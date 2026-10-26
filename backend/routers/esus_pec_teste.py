"""
Router: /api/esus-pec-teste — ERSUS 360
Servidor de TESTE do e-SUS APS PEC (homologação/treinamento) do município.

O endereço vem SÓ de variável de ambiente no Railway: ESUS_PEC_TESTE_URL_{IBGE7}
(sem sufixo = Apuí, legado). Nenhuma credencial é usada nem guardada aqui.

O servidor apenas confere se o endereço responde (um GET na página inicial, sem login,
sem GraphQL, sem ler dado de cidadão). Nada é gravado no PEC. O login no PEC de teste
é feito pelo próprio usuário, no navegador, pelo botão "Abrir PEC de teste".
"""
from __future__ import annotations

import time
from datetime import datetime, timezone
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, HTTPException

from routers.auth import UserOut
from tenancy.credenciais import credencial, nome_variavel
from tenancy.escopo import SessaoMunicipal

router = APIRouter(prefix="/api/esus-pec-teste", tags=["e-SUS PEC — servidor de teste"])

# Mesmos perfis de ROLES_AUD (frontend/src/lib/navItems.ts)
PERFIS = {"administrador_geral", "superadmin", "admin", "gestor", "auditoria"}
TIMEOUT = 8.0


def _exigir_perfil(u: UserOut) -> None:
    if not (u.administrador_geral or u.role in PERFIS):
        raise HTTPException(403, "Perfil sem permissão para ver integrações")


def _url_valida(url: str) -> bool:
    p = urlparse(url)
    return p.scheme in ("http", "https") and bool(p.netloc)


@router.get("/status")
async def status_pec_teste(usuario: SessaoMunicipal):
    """Situação do servidor de teste do PEC: configurado? responde?"""
    _exigir_perfil(usuario)
    variavel = nome_variavel("ESUS_TESTE", "PEC_URL", usuario.municipio_ibge or "")
    url = credencial("ESUS_TESTE", "PEC_URL").rstrip("/")
    base = {
        "verificado_em": datetime.now(timezone.utc).isoformat(),
        "variavel": variavel,
        "url": None,
        "online": None,
        "http_status": None,
        "tempo_ms": None,
    }

    if not url:
        return {**base, "status": "nao_configurado",
                "mensagem": f"Servidor de teste do PEC não configurado. Cadastre {variavel} no Railway."}
    if not _url_valida(url):
        return {**base, "status": "url_invalida",
                "mensagem": f"{variavel} precisa começar com http:// ou https://."}

    inicio = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=False) as client:
            r = await client.get(url + "/")
        ms = int((time.monotonic() - inicio) * 1000)
        online = r.status_code < 500
        return {**base, "status": "online" if online else "erro_servidor", "url": url,
                "online": online, "http_status": r.status_code, "tempo_ms": ms,
                "mensagem": ("O servidor de teste do PEC respondeu." if online else
                             f"O servidor de teste respondeu com erro HTTP {r.status_code}.")}
    except httpx.HTTPError as e:
        return {**base, "status": "offline", "url": url, "online": False,
                "mensagem": (f"Sem resposta do servidor de teste ({type(e).__name__}). "
                             "Confira se ele está ligado e acessível pela internet a partir do Railway.")}
