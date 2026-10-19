"""O cabeçalho do PDF usa os dados do município da sessão (nunca os de Apuí fixos no código)."""
import pytest
from sqlalchemy import update

from models.municipio import Municipio
from tests.test_isolamento_tenant import _h, _token, ambiente  # noqa: F401


@pytest.mark.asyncio
async def test_sessao_traz_cnpj_do_proprio_municipio(ambiente):
    c, S, ids = ambiente["client"], ambiente["Session"], ambiente["ids"]
    async with S() as db:
        await db.execute(update(Municipio).where(Municipio.id == ids["apui"]).values(cnpj_fundo="11.111.111/0001-11"))
        await db.execute(update(Municipio).where(Municipio.id == ids["b"]).values(cnpj_fundo="22.222.222/0001-22"))
        await db.commit()
    a = (await c.get("/api/auth/me", headers=_h(await _token(c, "gestor.apui@teste.gov.br")))).json()
    b = (await c.get("/api/auth/me", headers=_h(await _token(c, "gestor.b@teste.gov.br")))).json()
    assert a["municipio_cnpj_fundo"] == "11.111.111/0001-11" and a["municipio_ibge"] == "1300144"
    assert b["municipio_cnpj_fundo"] == "22.222.222/0001-22" and b["municipio_ibge"] == "1399991"
