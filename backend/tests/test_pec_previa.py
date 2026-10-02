"""Valores do agente e-SUS PEC são sempre PRÉVIA local: só deixam de sê-lo quando o resultado
oficial do SIAPS existe para o mesmo indicador da mesma equipe."""
from routers.pec_sync import PREVIA_PADRAO, marcar_previa


def test_sem_oficial_tudo_do_agente_e_previa():
    pec = {"ESF 1": {"C2": 40.0, "C5": 60.0}}
    out = marcar_previa(pec, {"C2": "Prévia parcial A–D"})
    assert out == {"ESF 1": {"C2": "Prévia parcial A–D", "C5": PREVIA_PADRAO}}


def test_oficial_prevalece_e_nao_e_marcado_como_previa():
    pec = {"ESF 1": {"C2": 40.0, "C5": 60.0}, "ESF 2": {"C2": 10.0}}
    oficial = {"ESF 1": {"C2": 88.0}}
    out = marcar_previa(pec, {}, oficial)
    assert out == {"ESF 1": {"C5": PREVIA_PADRAO}, "ESF 2": {"C2": PREVIA_PADRAO}}


def test_entradas_vazias():
    assert marcar_previa(None, None) == {}
    assert marcar_previa({}, {}, {}) == {}
