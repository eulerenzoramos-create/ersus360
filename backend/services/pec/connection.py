"""PecConnectionService — único responsável por testar/reportar conectividade com o PEC.

Regra de ouro: nunca retornar `conectado=True` sem ter feito uma chamada de rede real.
Compare com backend/routers/rnds_gateway.py::testar_conexao, que retorna um sucesso
fabricado sem chamar a rede — esse é exatamente o padrão que este serviço deve evitar.
"""
from __future__ import annotations
from dataclasses import dataclass, asdict
from datetime import datetime

import httpx

from config import settings


@dataclass
class PecConnectionStatus:
    configurado: bool
    ambiente: str
    base_url: str | None
    https: bool
    conectado: bool | None   # None = nenhuma chamada de rede foi feita (desativado/sem config)
    mensagem: str
    verificado_em: datetime

    def to_dict(self) -> dict:
        d = asdict(self)
        d["verificado_em"] = self.verificado_em.isoformat()
        return d


class PecConnectionService:
    @staticmethod
    def _https_ativo(url: str) -> bool:
        return url.lower().startswith("https://")

    async def test_connection(self) -> PecConnectionStatus:
        agora = datetime.utcnow()

        if not settings.ESUS_INTEGRATION_ENABLED:
            return PecConnectionStatus(
                configurado=settings.pec_configurado,
                ambiente=settings.PEC_ENVIRONMENT,
                base_url=settings.PEC_BASE_URL or None,
                https=self._https_ativo(settings.PEC_BASE_URL) if settings.PEC_BASE_URL else False,
                conectado=None,
                mensagem="ESUS_INTEGRATION_ENABLED=false — integração desativada por configuração. "
                         "Nenhuma chamada de rede foi feita.",
                verificado_em=agora,
            )

        if not settings.pec_configurado:
            return PecConnectionStatus(
                configurado=False,
                ambiente=settings.PEC_ENVIRONMENT,
                base_url=settings.PEC_BASE_URL or None,
                https=False,
                conectado=None,
                mensagem="Credenciais PEC_BASE_URL / PEC_CLIENT_ID / PEC_CLIENT_SECRET ausentes. "
                         "Nenhuma chamada de rede foi feita.",
                verificado_em=agora,
            )

        # NOTA: o caminho "/oauth/token" com grant client_credentials é o padrão mais comum
        # para APIs LEDI, mas deve ser confirmado contra a documentação da instalação real
        # do PEC antes de ir para produção (ver docs/DOC-PEC-INTEGRACAO.md).
        try:
            async with httpx.AsyncClient(timeout=settings.PEC_REQUEST_TIMEOUT) as client:
                resp = await client.post(
                    f"{settings.PEC_BASE_URL.rstrip('/')}/oauth/token",
                    data={"grant_type": "client_credentials"},
                    auth=(settings.PEC_CLIENT_ID, settings.PEC_CLIENT_SECRET),
                )
            conectado = resp.status_code == 200
            mensagem = (
                "Conexão e autenticação OAuth2 bem-sucedidas."
                if conectado
                else f"PEC respondeu HTTP {resp.status_code}."
            )
            return PecConnectionStatus(
                configurado=True,
                ambiente=settings.PEC_ENVIRONMENT,
                base_url=settings.PEC_BASE_URL,
                https=self._https_ativo(settings.PEC_BASE_URL),
                conectado=conectado,
                mensagem=mensagem,
                verificado_em=agora,
            )
        except httpx.HTTPError as exc:
            return PecConnectionStatus(
                configurado=True,
                ambiente=settings.PEC_ENVIRONMENT,
                base_url=settings.PEC_BASE_URL,
                https=self._https_ativo(settings.PEC_BASE_URL),
                conectado=False,
                mensagem=f"Falha de rede ao contatar o PEC: {exc}",
                verificado_em=agora,
            )
