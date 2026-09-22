"""
Município (tenant) da requisição corrente, acessível a serviços e routers.

O guard global preenche o contexto a partir da sessão validada. Serviços que
consultam fontes externas por IBGE usam `ibge7()`/`ibge6()` em vez de
constantes, e o cache em memória é separado por município.

Fora de requisições HTTP (jobs do scheduler, seeds de inicialização) não há
sessão: esses processos rodam para o município legado (Apuí/AM) — use
`contexto_municipio(...)` para executar um job em nome de outro município.
"""
from __future__ import annotations

from contextlib import contextmanager
from contextvars import ContextVar
from dataclasses import dataclass

from config import settings

IBGE_LEGADO = "1300144"


@dataclass(frozen=True)
class MunicipioContexto:
    id: int | None
    uuid: str | None
    ibge: str
    nome: str
    uf: str
    populacao: int | None = None

    @property
    def ibge6(self) -> str:
        return self.ibge[:6]

    @property
    def legado(self) -> bool:
        """True para Apuí/AM — único município com dados estáticos verificados no código."""
        return self.ibge == IBGE_LEGADO


# Município usado por jobs sem sessão (comportamento anterior ao multi-tenant)
_PADRAO = MunicipioContexto(
    id=None, uuid=None, ibge=settings.FNS_MUNICIPIO_IBGE,
    nome=settings.MUNICIPIO_NOME, uf=settings.MUNICIPIO_UF, populacao=20647,
)

_atual: ContextVar[MunicipioContexto | None] = ContextVar("municipio_atual", default=None)


def definir_municipio(ctx: MunicipioContexto | None):
    return _atual.set(ctx)


def configurar_municipio_padrao(ctx: MunicipioContexto) -> None:
    """Chamado na inicialização com o registro real de Apuí (id do banco)."""
    global _PADRAO
    _PADRAO = ctx


def municipio_id_atual() -> int | None:
    """Default das colunas municipio_id: registros novos pertencem ao município da sessão."""
    return municipio_atual().id


def municipio_atual() -> MunicipioContexto:
    return _atual.get() or _PADRAO


def ibge7() -> str:
    return municipio_atual().ibge


def ibge6() -> str:
    return municipio_atual().ibge6


def eh_legado() -> bool:
    return municipio_atual().legado


def populacao(padrao: int = 25_000) -> int:
    return municipio_atual().populacao or padrao


@contextmanager
def contexto_municipio(ctx: MunicipioContexto):
    """Executa um bloco (ex.: job agendado) em nome de um município."""
    token = _atual.set(ctx)
    try:
        yield ctx
    finally:
        _atual.reset(token)
