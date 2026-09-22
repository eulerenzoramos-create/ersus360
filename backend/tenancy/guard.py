"""
Guard global de autenticação e isolamento por município.

Aplicado como dependência de TODA a aplicação (FastAPI(dependencies=[...])),
portanto cobre todos os routers existentes e futuros sem depender de cada
endpoint lembrar de proteger a si mesmo.

Regras (em ordem):
  1. Rotas fora de /api e /ws (SPA, assets, /health, /docs) não passam pelo guard.
  2. Rotas públicas explícitas (login, logout, info do sistema, recepção do agente
     PEC com chave própria) passam sem token.
  3. Todas as demais exigem token válido; usuário, município e autorização são
     revalidados no banco (resolver_sessao).
  4. Rotas do administrador-geral exigem o perfil ADMINISTRADOR_GERAL.
  5. Rotas de dados exigem um município ativo na sessão.
  6. Parâmetros de município enviados pelo cliente (query, path, corpo JSON) que
     divergirem do município da sessão bloqueiam a requisição (403 + auditoria).
  7. Módulos com dados de Apuí/AM fixos no código (ROTAS_SO_APUI) só respondem
     a sessões de Apuí. Os demais municípios recebem 403.
  8. Toda ação de escrita é registrada na auditoria com o município.
"""
from __future__ import annotations

import json
import logging

from fastapi import Depends, HTTPException, WebSocketException, status
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import HTTPConnection

from database import get_db
from routers.auth import AcessoNegado, UserOut, decodificar_token, ip_de, resolver_sessao
from tenancy.auditoria import registrar_auditoria
from tenancy.contexto import MunicipioContexto, definir_municipio

logger = logging.getLogger(__name__)

# Município piloto: os módulos legados têm seus dados fixos no código.
IBGE_LEGADO = "1300144"

ROTAS_PUBLICAS = {
    "/api/auth/login",
    "/api/auth/logout",
    "/api/pec/sync",        # agente PEC — autenticado pela X-Sync-Key do próprio endpoint
}

# Rotas que exigem login mas não um município selecionado.
PREFIXOS_SEM_MUNICIPIO = (
    "/api/auth/",
    "/api/tenant/",
    "/api/admin-geral/",
)

# Rotas exclusivas do administrador-geral (operam sobre vários municípios por definição).
PREFIXOS_ADMIN_GERAL = (
    "/api/admin-geral/",
    "/api/ws/broadcast",   # envia a TODOS os conectados, de qualquer município
    "/api/auth/usuarios",
    "/api/auth/registrar",
)

# Módulos com dados de Apuí/AM fixos no código (listas verificadas, séries
# históricas, rotas "-apui"). Respondem SOMENTE a sessões de Apuí; qualquer
# outro município recebe 403. Todas as demais rotas operam sobre o município da
# sessão (tenancy.contexto) — verificado por tests/test_varredura_tenant.py.
ROTAS_SO_APUI: tuple[str, ...] = (
    # referência municipal / planilhas oficiais de Apuí embutidas no código
    "/api/absenteismo/", "/api/acs/", "/api/auditoria-dados/", "/api/cms/", "/api/contratos/",
    "/api/exportador/", "/api/folha/", "/api/frota/", "/api/gestao/", "/api/linha-tempo/",
    "/api/okr/", "/api/ouvidoria/", "/api/patrimonio/", "/api/relatorios/", "/api/sync/",
    "/api/siaps/", "/api/telessaude-apui/", "/api/indicadores-aps/",
    # lista verificada de UBS/equipes CNES de Apuí
    "/api/cnes/", "/api/equipamentos/", "/api/scnes-conformidade/", "/api/siaps-monitor/",
    "/api/dashboard-exec/", "/api/sisab/",
    # integrações configuradas só para Apuí (credenciais, CNES, agente PEC)
    "/api/integracao/", "/api/integracao-egestor-apui/", "/api/integracao-esuspec-apui/",
    "/api/integracao-fns-apui/", "/api/integracao-siaps-apui/", "/api/integracao-pec/",
    "/api/pec/", "/api/ledi/", "/api/mapa-visitas-domiciliares/", "/api/auditoria-auto/",
    # financeiro FMS Apuí (tabelas ainda sem filtro por município nos routers)
    "/api/repasses-aps/", "/api/repasses-fns/", "/api/execucao-fns/", "/api/contas-fms/",
    "/api/email-diario/",
    "/api/rnds/", "/api/gateway/diagnostico",  # certificado ICP-Brasil/CNES de Apuí
    "/ws/",  # alertas/ACS em tempo real: canal único, sem separação por município
)

# Nomes de parâmetro que identificam município. Valor divergente da sessão = bloqueio.
_CHAVES_ID = {"municipio_id", "tenant_id", "id_municipio"}
_CHAVES_UUID = {"municipio_uuid", "tenant_uuid"}
_CHAVES_IBGE = {
    "municipio_ibge", "ibge", "codigo_ibge", "cod_ibge", "ibge7", "ibge6",
    "co_municipio", "comunicipio", "cod_municipio", "codigo_municipio",
}

_METODOS_ESCRITA = {"POST", "PUT", "PATCH", "DELETE"}


def _protegida(path: str) -> bool:
    return path.startswith("/api/") or path.startswith("/ws/")


def _comeca(path: str, prefixos: tuple[str, ...]) -> bool:
    return any(path == p.rstrip("/") or path.startswith(p) for p in prefixos)


def _token(conn: HTTPConnection) -> str | None:
    auth = conn.headers.get("authorization", "")
    if auth.lower().startswith("bearer "):
        return auth[7:].strip()
    if conn.scope["type"] == "websocket":
        return conn.query_params.get("token")
    return None


def _diverge(chave: str, valor, usuario: UserOut) -> bool:
    k = chave.lower()
    if valor is None or valor == "":
        return False
    v = str(valor).strip()
    if k in _CHAVES_ID:
        return v != str(usuario.municipio_id)
    if k in _CHAVES_UUID:
        return v != (usuario.municipio_uuid or "")
    if k in _CHAVES_IBGE:
        ibge = usuario.municipio_ibge or ""
        return not (v == ibge or (len(v) == 6 and v == ibge[:6]))
    return False


async def _parametros_cliente(conn: HTTPConnection) -> list[tuple[str, object]]:
    pares: list[tuple[str, object]] = list(conn.query_params.multi_items())
    pares += list(conn.path_params.items())
    if conn.scope["type"] == "http" and conn.scope.get("method") in _METODOS_ESCRITA:
        ctype = conn.headers.get("content-type", "")
        if ctype.startswith("application/json"):
            try:
                corpo = json.loads(await conn.body() or b"null")  # type: ignore[attr-defined]
            except ValueError:
                corpo = None
            itens = corpo if isinstance(corpo, list) else [corpo]
            for item in itens:
                if isinstance(item, dict):
                    pares += list(item.items())
    return pares


def _erro(conn: HTTPConnection, status_code: int, detail: str):
    if conn.scope["type"] == "websocket":
        return WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason=detail[:120])
    return HTTPException(status_code=status_code, detail=detail)


async def tenant_guard(conn: HTTPConnection, db: AsyncSession = Depends(get_db)) -> None:
    path = conn.url.path
    if not _protegida(path) or path in ROTAS_PUBLICAS:
        return

    ip = ip_de(conn)
    try:
        payload = decodificar_token(_token(conn))
        usuario = await resolver_sessao(payload["sub"], payload.get("mid"), db)
    except AcessoNegado as exc:
        await registrar_auditoria(db, "ACESSO_NEGADO", login=payload.get("sub"), ip=ip,
                                  municipio_id=payload.get("mid"),
                                  detalhe=f"{exc.motivo} {conn.scope.get('method', 'WS')} {path}")
        raise _erro(conn, exc.status_code, exc.detail)
    except HTTPException as exc:
        raise _erro(conn, exc.status_code, exc.detail)

    conn.state.usuario = usuario
    if usuario.municipio_id is not None:
        # Serviços e cache passam a operar sobre o município da sessão
        definir_municipio(MunicipioContexto(
            id=usuario.municipio_id, uuid=usuario.municipio_uuid, ibge=usuario.municipio_ibge or "",
            nome=usuario.municipio, uf=usuario.municipio_uf or "", populacao=usuario.municipio_populacao,
        ))

    async def negar(motivo: str, detail: str, codigo: int = status.HTTP_403_FORBIDDEN):
        await registrar_auditoria(db, "ACESSO_NEGADO", usuario=usuario, ip=ip,
                                  detalhe=f"{motivo} {conn.scope.get('method', 'WS')} {path}")
        raise _erro(conn, codigo, detail)

    if _comeca(path, PREFIXOS_ADMIN_GERAL):
        if not usuario.administrador_geral:
            await negar("ROTA_ADMIN_GERAL", "Acesso restrito ao administrador-geral")
        return  # rotas globais por definição: sem vínculo a um único município

    if _comeca(path, PREFIXOS_SEM_MUNICIPIO):
        return  # sessão/troca de município: auditadas pelos próprios endpoints

    if usuario.municipio_id is None:
        raise _erro(conn, status.HTTP_409_CONFLICT,
                    "MUNICIPIO_NAO_SELECIONADO: selecione um município para continuar")

    for chave, valor in await _parametros_cliente(conn):
        if _diverge(chave, valor, usuario):
            await negar("PARAMETRO_MUNICIPIO_DIVERGENTE",
                        f"Acesso negado: o parâmetro '{chave}' não corresponde ao município da sessão")

    if _comeca(path, ROTAS_SO_APUI) and usuario.municipio_ibge != IBGE_LEGADO:
        await negar("MODULO_NAO_MIGRADO",
                    "Módulo ainda não disponível para este município")

    if conn.scope.get("method") in _METODOS_ESCRITA:
        await registrar_auditoria(db, "ESCRITA", usuario=usuario, ip=ip,
                                  detalhe=f"{conn.scope['method']} {path}")
