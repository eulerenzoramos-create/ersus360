"""Inconsistências de envio do PEC: contrato agregado (nada de quem enviou, UUID, arquivo ou ficha),
mensagens com números longos mascarados, isolamento por município e agregação do agente."""
import importlib.util
import shutil
from pathlib import Path

import pytest
from pydantic import ValidationError

from models.municipio import Municipio
from routers.pec_agente import LoteInconsistenciasIn, painel_inconsistencias, receber_inconsistencias
from tests.test_pec_agente import CHAVE, _req, _sessao, apui  # noqa: F401 (fixture)

AGENTE = Path(__file__).resolve().parents[2] / "pec_sync_agent" / "pec_sync.py"


def _lote(**extra):
    base = {
        "ibge": "1300144", "competencia": "2026-10", "gerado_em": "2026-10-26T12:00:00Z",
        "agente_versao": "1.4.0", "periodo": {"inicio": "2026-10-01", "fim": "2026-10-31"},
        "totais": {"lotes": 2, "registros": 5},
        "por_situacao": [{"situacao": "Completo", "quantidade": 3}, {"situacao": "Inválido", "quantidade": 2}],
        "por_tipo_ficha": [{"tipo_ficha": "CDS Ficha de Visita Domiciliar", "cnes": "1111111", "situacao": "Inválido",
                            "quantidade": 2}],
        "erros": [{"tipo_ficha": "CDS Ficha de Visita Domiciliar", "cnes": "1111111", "tipo_erro": "campo_invalido",
                   "mensagem": "CNS do cidadão 898001160648512 inválido", "quantidade": 2}],
    }
    base.update(extra)
    return LoteInconsistenciasIn(**base)


def test_contrato_recusa_quem_enviou_e_identificador_da_ficha():
    with pytest.raises(ValidationError):
        _lote(responsavel_envio="Fulano")
    with pytest.raises(ValidationError):
        _lote(erros=[{"tipo_ficha": "X", "tipo_erro": "regra", "quantidade": 1, "uuid": "abc"}])


def test_mensagem_chega_mascarada():
    assert _lote().erros[0].mensagem == "CNS do cidadão ### inválido"


async def test_recebe_idempotente_e_so_o_municipio_ve(db_session, apui):
    r1 = await receber_inconsistencias(_lote(), _req(), db_session, x_sync_key=CHAVE)
    r2 = await receber_inconsistencias(_lote(gerado_em="2026-10-26T16:00:00Z"), _req(), db_session, x_sync_key=CHAVE)
    assert r1["status"] == "aceito" and r2["status"] == "sem_alteracao"
    p = await painel_inconsistencias(_sessao(apui), db_session, competencia="")
    assert p["status"] == "ok" and p["lote"]["totais"]["registros"] == 5
    assert "898001160648512" not in str(p)

    outro = Municipio(nome="Outro", uf="AM", codigo_ibge="1399991", situacao="ativo")
    db_session.add(outro)
    await db_session.flush()
    vazio = await painel_inconsistencias(_sessao(outro), db_session, competencia="")
    assert vazio["status"] == "aguardando_agente" and vazio["lote"] is None


# ── Agente ────────────────────────────────────────────────────────────────────

@pytest.fixture
def agente(tmp_path, monkeypatch):
    for k in ("ERSUS_IBGE", "PEC_TREINAMENTO"):
        monkeypatch.delenv(k, raising=False)
    monkeypatch.setenv("ERSUS_SYNC_KEY", "chave-teste")
    copia = tmp_path / "pec_sync.py"
    shutil.copy(AGENTE, copia)
    spec = importlib.util.spec_from_file_location("pec_sync_inconsist", copia)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class _Cursor:
    """Imita o PEC: 2 lotes; item 1 inválido com 2 erros, item 2 completo, item 3 incompleto sem detalhe."""
    def __init__(self):
        self.sqls, self._fase = [], 0

    def execute(self, sql, params=None):
        self.sqls.append(sql)
        self._fase += 1

    def fetchone(self):
        return (2,)

    def fetchmany(self, n):
        if self._fase != 2:
            return []
        self._fase = 3
        return [
            (1, "CDS Ficha de Visita Domiciliar", "1111111 ", "Inválido", None, "CNS 898001160648512 inválido", None),
            (1, "CDS Ficha de Visita Domiciliar", "1111111", "Inválido", "Campo turno", None, None),
            (2, "CDS Cadastro Individual", "1111111", "Completo", None, None, None),
            (3, "CDS Cadastro Individual", None, "Incompleto", None, None, None),
        ]

    def close(self):
        pass


class _Conn:
    def __init__(self):
        self.cur = _Cursor()

    def cursor(self):
        return self.cur


def test_agente_agrega_mascara_e_nao_le_quem_enviou(agente):
    conn = _Conn()
    corpo = agente.coletar_inconsistencias(conn, "2026-10")
    sql = " ".join(conn.cur.sqls).lower()
    for proibido in ("responsavel", "no_arquivo", "co_unico", "im_dado"):
        assert proibido not in sql
    assert corpo["totais"] == {"lotes": 2, "registros": 3}
    assert {s["situacao"]: s["quantidade"] for s in corpo["por_situacao"]} == {"Inválido": 1, "Completo": 1, "Incompleto": 1}
    erros = {(e["tipo_erro"], e["mensagem"]): e["quantidade"] for e in corpo["erros"]}
    assert erros == {("campo_invalido", "CNS ### inválido"): 1, ("campo_nao_preenchido", "Campo turno"): 1,
                     ("sem_detalhe", None): 1}
    assert corpo["periodo"] == {"inicio": "2026-10-01", "fim": "2026-10-31"}
    LoteInconsistenciasIn(**corpo)                       # o que o agente envia passa no contrato do backend


def test_agente_envia_para_o_endpoint_de_inconsistencias(agente, monkeypatch):
    enviados = []
    monkeypatch.setattr(agente.requests, "post", lambda url, json=None, headers=None, timeout=None:
                        enviados.append(url) or type("R", (), {"status_code": 200, "text": "ok"})())
    assert agente.enviar_inconsistencias(_Conn(), "2026-10") is True
    assert enviados == [f"{agente.ERSUS_URL}/api/pec-agente/inconsistencias"]
