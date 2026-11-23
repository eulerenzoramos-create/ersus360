from datetime import date
from types import SimpleNamespace as NS

from services import previsao_emendas as pe


def _p(mod, exercicio=2026, componente=None, tipo=None, aprovado=0, proposta=0, indicado=0, pago=0,
       sit="recurso_pago", pags=(), esfera="federal"):
    return NS(modalidade=mod, tipo_emenda=None, exercicio=exercicio, componente=componente, esfera=esfera,
              payload_original={"tipoProposta": {"descricao": tipo}} if tipo else None, programa=None,
              acao_orcamentaria=None, objeto=None, valor_aprovado=aprovado, valor_proposta=proposta,
              valor_indicado=indicado, valor_pago=pago, situacao_normalizada=sit,
              pagamentos_investsus=[NS(valor=v, data_pagamento=d) for v, d in pags])


def _linha(r, chave):
    return next(l for l in r["linhas"] if l["chave"] == chave)


def test_previsto_por_modalidade_e_area_sem_somar_estagios():
    props = [
        _p("rp6", componente="PAP", aprovado=1_000_000, indicado=1_200_000, pago=1_000_000,
           pags=[(1_000_000, date(2026, 3, 10))]),
        _p("rp6", tipo="INCREMENTO MAC", indicado=100_000, pago=0),
        _p("rp7", componente="MAC", aprovado=500_000, pago=200_000),
        _p("rp8", tipo="INCREMENTO PAP", proposta=300_000, pago=300_000),
        _p("programa", tipo="CUSTEIO DA ATENCAO PRIMARIA A SAUDE", aprovado=2_000_000, pago=0),
        _p("rp6", componente="PAP", aprovado=999, sit="cancelada"),           # fora do previsto
        _p("rp6", componente="PAP", aprovado=700_000, exercicio=2025, pago=700_000,
           pags=[(700_000, date(2026, 2, 5))]),                              # outro exercício: só pago no período
        _p("rp6", componente="PAP", aprovado=5, esfera="estadual"),          # fora do escopo federal
    ]
    r = pe.montar(props, pe.modalidade_gravada, 2026, 1, 11, "AM")
    rp6 = _linha(r, "rp6")
    pap = next(a for a in rp6["areas"] if a["area"] == "PAP")
    assert pap["qtd"] == 1 and pap["previsto"] == 1_000_000            # aprovado, não indicado+aprovado
    assert pap["pago_periodo"] == 1_700_000                             # inclui pagamento do exercício 2025
    mac = next(a for a in rp6["areas"] if a["area"] == "MAC")
    assert mac["previsto"] == 100_000 and mac["a_receber"] == 100_000 and mac["pct_recebido"] == 0
    assert _linha(r, "rp7")["rotulo"] == "Emenda de Bancada do Amazonas (RP 7)"
    assert r["coletivas"]["previsto"] == 800_000 and r["coletivas"]["recebido"] == 500_000
    assert r["emendas"]["previsto"] == 1_900_000
    assert r["total"]["previsto"] == 3_900_000
    assert _linha(r, "programa")["areas"][0]["area"] == "PAP"
    assert r["canceladas"] == {"qtd": 1, "valor": 999}
    assert r["por_area"]["PAP"]["previsto"] == 3_300_000


def test_sem_classificacao_oficial_fica_em_outros():
    r = pe.montar([_p("rp6", indicado=50_000)], pe.modalidade_gravada, 2026)
    assert _linha(r, "rp6")["areas"][0]["area"] == "Outros"
    assert all(l["chave"] != "outras" for l in r["linhas"])
