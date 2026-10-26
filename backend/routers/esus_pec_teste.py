"""
Router: /api/esus-pec-teste — ERSUS 360
e-SUS APS PEC de TESTE: versão de treinamento padrão do Ministério da Saúde, credenciada no
Distrito Federal com dados fictícios. NÃO tem vínculo com nenhum município do ERSUS360 —
por isso é uma configuração única, igual para todos os municípios.

O endereço vem SÓ da variável de ambiente ESUS_PEC_TESTE_URL no Railway.
Nenhuma credencial é usada nem guardada aqui.

O servidor apenas confere se o endereço responde (um GET na página inicial, sem login,
sem GraphQL). Nada é gravado no PEC. O login no PEC de teste é feito pelo próprio usuário,
no navegador, pelo botão "Abrir PEC de teste".
"""
from __future__ import annotations

import os
import time
from datetime import datetime, timezone
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, HTTPException

from routers.auth import UserOut
from tenancy.escopo import SessaoMunicipal

router = APIRouter(prefix="/api/esus-pec-teste", tags=["e-SUS PEC — servidor de teste"])

# Mesmos perfis de ROLES_AUD (frontend/src/lib/navItems.ts)
PERFIS = {"administrador_geral", "superadmin", "admin", "gestor", "auditoria"}
VARIAVEL = "ESUS_PEC_TESTE_URL"
TIMEOUT = 8.0
# PEC instalado no computador do usuário: o Railway (nuvem) não alcança, e sondar loopback no servidor seria indevido
HOSTS_LOCAIS = {"localhost", "127.0.0.1", "::1"}


def _exigir_perfil(u: UserOut) -> None:
    if not (u.administrador_geral or u.role in PERFIS):
        raise HTTPException(403, "Perfil sem permissão para ver integrações")


def _url_valida(url: str) -> bool:
    p = urlparse(url)
    return p.scheme in ("http", "https") and bool(p.netloc)


@router.get("/status")
async def status_pec_teste(usuario: SessaoMunicipal):
    """Situação do PEC de teste (padrão MS): configurado? responde?"""
    _exigir_perfil(usuario)
    url = os.getenv(VARIAVEL, "").strip().rstrip("/")
    base = {
        "verificado_em": datetime.now(timezone.utc).isoformat(),
        "variavel": VARIAVEL,
        "url": None,
        "online": None,
        "http_status": None,
        "tempo_ms": None,
    }

    if not url:
        return {**base, "status": "nao_configurado",
                "mensagem": f"PEC de teste não configurado. Cadastre {VARIAVEL} no Railway."}
    if not _url_valida(url):
        return {**base, "status": "url_invalida",
                "mensagem": f"{VARIAVEL} precisa começar com http:// ou https://."}

    if (urlparse(url).hostname or "").lower() in HOSTS_LOCAIS:
        return {**base, "status": "local", "url": url,
                "mensagem": ("PEC de teste instalado no computador local. O ERSUS360 na nuvem não consegue "
                             "verificá-lo; abra pelo botão abaixo neste mesmo computador.")}

    inicio = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=False) as client:
            r = await client.get(url + "/")
        ms = int((time.monotonic() - inicio) * 1000)
        online = r.status_code < 500
        return {**base, "status": "online" if online else "erro_servidor", "url": url,
                "online": online, "http_status": r.status_code, "tempo_ms": ms,
                "mensagem": ("O PEC de teste respondeu." if online else
                             f"O PEC de teste respondeu com erro HTTP {r.status_code}.")}
    except httpx.HTTPError as e:
        return {**base, "status": "offline", "url": url, "online": False,
                "mensagem": (f"Sem resposta do PEC de teste ({type(e).__name__}). "
                             "Confira se ele está ligado e acessível pela internet a partir do Railway.")}
