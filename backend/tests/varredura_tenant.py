"""
Varredura de isolamento: chama TODAS as rotas GET da API como usuário de um
município que não é Apuí, com a internet simulada, e aponta cada rota que:
  - devolve marcadores de Apuí na resposta (IBGE, nome, dados semeados), ou
  - consulta fontes externas com o IBGE de Apuí.

Usada por tests/test_varredura_tenant.py e executável direto para diagnóstico:
    python -m tests.varredura_tenant
"""
from __future__ import annotations

import asyncio
import json
import re
from dataclasses import dataclass, field

import httpx
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

MARCADORES = re.compile(r"1300144|130014(?!\d)|apu[ií]|APU[IÍ]|MARCADOR-APUI", re.I)
IBGE_B = "1399991"
SENHA = "senha-varredura-123"


@dataclass
class Resultado:
    rota: str
    status: int
    motivo: str
    trecho: str = ""


@dataclass
class Relatorio:
    total: int = 0
    bloqueadas: list[str] = field(default_factory=list)
    vazamentos: list[Resultado] = field(default_factory=list)
    erros: list[Resultado] = field(default_factory=list)


def _preencher(path: str) -> str:
    return re.sub(r"\{[^}]+\}", "1", path)


class _SaidaSimulada:
    """Substitui o transporte do httpx: registra toda chamada externa e responde 404."""

    def __init__(self):
        self.chamadas: list[str] = []

    def registrar(self, request: httpx.Request) -> httpx.Response:
        corpo = request.content.decode("utf-8", "ignore") if request.content else ""
        self.chamadas.append(f"{request.method} {request.url} {corpo}")
        return httpx.Response(404, request=request, json={})


async def _semear(Session, pwd_hash: str):
    from models.convenio import Convenio
    from models.indicador import Indicador
    from models.alerta import Alerta
    from models.municipio import Municipio
    from models.usuario import Perfil, Usuario

    async with Session() as db:
        apui = Municipio(nome="APUÍ", uf="AM", codigo_ibge="1300144", situacao="ativo", populacao=20647)
        mun_b = Municipio(nome="Município Teste B", uf="AM", codigo_ibge=IBGE_B, situacao="ativo", populacao=5000)
        db.add_all([apui, mun_b])
        await db.flush()
        db.add(Usuario(municipio_id=mun_b.id, nome="Gestor B", email="gestor.b@teste.gov.br",
                       senha_hash=pwd_hash, perfil=Perfil.ADMIN, ativo=True))
        # Dados de Apuí com marcador: nenhum deles pode aparecer para o município B
        db.add(Convenio(municipio_id=apui.id, numero="MARCADOR-APUI-1", objeto="MARCADOR-APUI convênio"))
        db.add(Indicador(municipio_id=apui.id, indicador="MARCADOR-APUI indicador", eixo="APS",
                         meta_prevista=100, valor_alcancado=50, competencia="2026-06"))
        try:
            db.add(Alerta(municipio_id=apui.id, titulo="MARCADOR-APUI alerta", descricao="MARCADOR-APUI", modulo="APS"))
        except TypeError:
            pass
        await db.commit()


async def executar(prefixos_ignorados: tuple[str, ...] = ()) -> Relatorio:
    import main
    import models  # noqa: F401
    import models.integracao_gateway  # noqa: F401 — tabelas fora de models/__init__
    from database import Base, get_db
    from routers import auth as auth_mod

    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool,
                                 connect_args={"check_same_thread": False})
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    Session = async_sessionmaker(engine, expire_on_commit=False)
    await _semear(Session, auth_mod.pwd_ctx.hash(SENHA))

    async def _get_db():
        async with Session() as s:
            yield s

    saida = _SaidaSimulada()
    envio_original = httpx.AsyncClient.send
    envio_sync_original = httpx.Client.send

    async def envio_simulado(self, request, *a, **k):
        if request.url.host in ("test", "testserver"):
            return await envio_original(self, request, *a, **k)
        return saida.registrar(request)

    def envio_sync_simulado(self, request, *a, **k):
        if request.url.host in ("test", "testserver"):
            return envio_sync_original(self, request, *a, **k)
        return saida.registrar(request)

    main.app.dependency_overrides[get_db] = _get_db
    httpx.AsyncClient.send = envio_simulado
    httpx.Client.send = envio_sync_simulado
    rel = Relatorio()
    try:
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=main.app),
                                     base_url="http://test", timeout=30) as c:
            r = await c.post("/api/auth/login", data={"username": "gestor.b@teste.gov.br", "password": SENHA})
            token = r.json()["access_token"]
            h = {"Authorization": f"Bearer {token}"}
            paths = main.app.openapi()["paths"]
            for path, ops in sorted(paths.items()):
                if "get" not in ops or not path.startswith("/api/"):
                    continue
                if any(path.startswith(p) for p in prefixos_ignorados):
                    continue
                rota = _preencher(path)
                rel.total += 1
                saida.chamadas.clear()
                try:
                    resp = await asyncio.wait_for(c.get(rota, headers=h), timeout=20)
                except Exception as exc:  # erro interno do router: registrado à parte
                    rel.erros.append(Resultado(path, 0, type(exc).__name__, str(exc)[:160]))
                    continue
                if resp.status_code == 403 and "não disponível para este município" in resp.text:
                    rel.bloqueadas.append(path)
                    continue
                externas = [x for x in saida.chamadas if MARCADORES.search(x)]
                if externas:
                    rel.vazamentos.append(Resultado(path, resp.status_code, "consulta externa com IBGE de Apuí",
                                                    externas[0][:200]))
                    continue
                m = MARCADORES.search(resp.text)
                if m:
                    ini = max(0, m.start() - 60)
                    rel.vazamentos.append(Resultado(path, resp.status_code, "resposta contém Apuí",
                                                    resp.text[ini:m.end() + 60]))
                elif resp.status_code >= 500:
                    rel.erros.append(Resultado(path, resp.status_code, "erro 5xx", resp.text[:160]))
    finally:
        httpx.AsyncClient.send = envio_original
        httpx.Client.send = envio_sync_original
        main.app.dependency_overrides.clear()
        await engine.dispose()
    return rel


if __name__ == "__main__":
    import logging
    import sys

    logging.disable(logging.CRITICAL)
    import tenancy.guard as guard

    if "--sem-bloqueio" in sys.argv:  # diagnóstico: ignora a lista de módulos só-Apuí
        guard.ROTAS_SO_APUI = ()
    rel = asyncio.run(executar())
    print(f"rotas GET: {rel.total} | bloqueadas (só Apuí): {len(rel.bloqueadas)} | "
          f"vazamentos: {len(rel.vazamentos)} | erros: {len(rel.erros)}")
    for v in rel.vazamentos:
        print(f"VAZA {v.rota} [{v.status}] {v.motivo}: {v.trecho!r}")
    if "--erros" in sys.argv:
        for e in rel.erros:
            print(f"ERRO {e.rota} [{e.status}] {e.motivo}: {e.trecho!r}")
    print(json.dumps({"bloqueadas": rel.bloqueadas}) if "--listar-bloqueadas" in sys.argv else "")
