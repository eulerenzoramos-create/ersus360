"""PMS Vivo (fases 1–3): planilha modelo com revisão, versões do PMS, PAS e ações N:N, execução que só vale
validada por outra pessoa, "Minhas Ações" e isolamento entre municípios. Dados fictícios."""
from __future__ import annotations

import io
from datetime import date, timedelta

import pytest
from openpyxl import load_workbook

from models.usuario import Perfil, Usuario
from routers import auth as auth_mod
from services import pms_vivo as svc
from tests.test_isolamento_tenant import SENHA, _auditoria, _h, _token, ambiente  # noqa: F401 (fixture)

URL = "/api/pms-vivo"
ANOS = [2026, 2027, 2028, 2029]


def _planilha(linhas: list[list]) -> bytes:
    wb = load_workbook(io.BytesIO(svc.modelo_xlsx(ANOS)))
    ws = wb["PMS"]
    for ln in linhas:
        ws.append(ln)
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


LINHA_1 = ["1", "Fortalecer a APS", "1.1", "Ampliar o acesso", "1.1.1", "Ampliar a cobertura de ACS",
           "Cobertura de ACS", "percentual", "%", "maior_melhor", "cadastros/população", "70,5", 2025, "85%",
           "e-SUS APS", "Coordenação APS", 75, 78, 82, 85]
LINHA_2 = ["1", "Fortalecer a APS", "1.1", "Ampliar o acesso", "1.1.2", "Reformar UBS", "UBS reformadas",
           "absoluto_acumulavel", "UBS", "maior_melhor", None, None, None, 4, None, "Infraestrutura", 1, 1, 1, 1]


# ── Regras puras ──────────────────────────────────────────────────────────────

def test_numero_nunca_estima():
    assert svc.numero("70,5") == (70.5, True)
    assert svc.numero("85%") == (85.0, True)
    assert svc.numero("1.234,5") == (1234.5, True)
    assert svc.numero("") == (None, True)
    assert svc.numero("cerca de 80") == (None, False)


def test_planilha_modelo_e_previa():
    r = svc.ler_planilha(_planilha([LINHA_1, LINHA_2]), ANOS)
    assert r["erros"] == [] and r["totais"] == {"diretrizes": 1, "objetivos": 1, "metas": 2}
    m = r["diretrizes"][0]["objetivos"][0]["metas"][0]
    assert (m["linha_base"], m["meta_quadrienal"], m["metas_anuais"]["2029"]) == (70.5, 85.0, 85.0)
    assert r["diretrizes"][0]["objetivos"][0]["metas"][1]["formula"] is None     # vazio fica vazio


def test_planilha_aponta_erros_sem_corrigir():
    ruim = LINHA_1.copy()
    ruim[11] = "aprox. 70"           # linha de base ilegível
    ruim[7] = "media"                # tipo inválido
    sem_tipo = LINHA_2.copy()
    sem_tipo[4], sem_tipo[7] = "1.1.3", None
    r = svc.ler_planilha(_planilha([ruim, sem_tipo, LINHA_2[:5] + [None]]), ANOS)
    texto = " ".join(r["erros"])
    assert "não é número" in texto and "tipo do indicador 'media'" in texto and "falta Meta" in texto
    assert r["diretrizes"][0]["objetivos"][0]["metas"][0]["linha_base"] is None
    assert any("tipo do indicador não informado" in a for a in r["avisos"])
    with pytest.raises(ValueError):
        svc.ler_planilha(b"isto nao e xlsx", ANOS)


# ── Fluxo pela API ────────────────────────────────────────────────────────────

async def _usuario(S, municipio_id, email, perfil):
    async with S() as db:
        u = Usuario(municipio_id=municipio_id, nome=email.split("@")[0], email=email,
                    senha_hash=auth_mod.pwd_ctx.hash(SENHA), perfil=perfil, ativo=True)
        db.add(u)
        await db.commit()
        return u.id


async def _pms_aprovado(c, tok) -> dict:
    p = (await c.post(f"{URL}/planos", headers=_h(tok),
                      json={"titulo": "PMS 2026–2029 (teste)", "vigencia_inicio": 2026})).json()
    prev = (await c.post(f"{URL}/planos/{p['id']}/importar/previa", headers=_h(tok),
                         files={"arquivo": ("pms.xlsx", _planilha([LINHA_1, LINHA_2]))})).json()
    r = await c.post(f"{URL}/planos/{p['id']}/importar/confirmar", headers=_h(tok),
                     json={"diretrizes": prev["diretrizes"]})
    assert r.json() == {"diretrizes": 1, "objetivos": 1, "metas": 2}, r.text
    assert (await c.post(f"{URL}/planos/{p['id']}/aprovar", headers=_h(tok),
                         json={"resolucao_cms": "Resolução CMS 01/2026 (teste)"})).status_code == 200
    return (await c.get(f"{URL}/planos/{p['id']}", headers=_h(tok))).json()


async def test_pms_importacao_aprovacao_e_versoes(ambiente):
    c, S = ambiente["client"], ambiente["Session"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    p = (await c.post(f"{URL}/planos", headers=_h(tok), json={"titulo": "PMS teste", "vigencia_inicio": 2026})).json()
    assert (p["vigencia_fim"], p["situacao"], p["versao"]) == (2029, "rascunho", 1)
    assert (await c.post(f"{URL}/planos/{p['id']}/aprovar", headers=_h(tok),
                         json={"resolucao_cms": "Res. 1"})).status_code == 422          # sem metas
    plano = await _pms_aprovado_de(c, tok, p["id"])
    meta = plano["diretrizes"][0]["objetivos"][0]["metas"][0]
    assert meta["codigo"] == "1.1.1" and [a["meta_prevista"] for a in meta["metas_anuais"]] == [75, 78, 82, 85]
    # versão aprovada não se edita
    assert (await c.put(f"{URL}/metas/{meta['id']}", headers=_h(tok), json={"meta_quadrienal": 90})).status_code == 409
    # proposta de alteração: nova versão com os mesmos identificadores de meta
    v2 = (await c.post(f"{URL}/planos/{p['id']}/nova-versao", headers=_h(tok),
                       json={"motivo": "Revisão da meta de ACS após o RAG"})).json()
    assert (v2["versao"], v2["situacao"], v2["plano_origem_id"]) == (2, "rascunho", p["id"])
    arv2 = (await c.get(f"{URL}/planos/{v2['id']}", headers=_h(tok))).json()
    meta2 = arv2["diretrizes"][0]["objetivos"][0]["metas"][0]
    assert meta2["uid"] == meta["uid"] and meta2["id"] != meta["id"]
    r = await c.put(f"{URL}/metas/{meta2['id']}", headers=_h(tok), json={"meta_quadrienal": 90, "metas_anuais": {"2029": 90}})
    assert r.status_code == 200
    await c.post(f"{URL}/planos/{v2['id']}/aprovar", headers=_h(tok), json={"resolucao_cms": "Res. 7/2027"})
    planos = {x["id"]: x for x in (await c.get(f"{URL}/planos", headers=_h(tok))).json()}
    assert planos[p["id"]]["situacao"] == "substituido" and planos[v2["id"]]["situacao"] == "aprovado"
    # o original continua consultável, com o valor aprovado na época
    orig = (await c.get(f"{URL}/planos/{p['id']}", headers=_h(tok))).json()
    assert orig["diretrizes"][0]["objetivos"][0]["metas"][0]["meta_quadrienal"] == 85
    assert await _auditoria(S, "PMS_APROVADO")
    # documento oficial em PDF
    assert (await c.post(f"{URL}/planos/{p['id']}/documento", headers=_h(tok),
                         files={"arquivo": ("pms.docx", b"x")})).status_code == 422
    assert (await c.post(f"{URL}/planos/{p['id']}/documento", headers=_h(tok),
                         files={"arquivo": ("pms.pdf", b"%PDF-1.4 pms")})).status_code == 201


async def _pms_aprovado_de(c, tok, plano_id):
    prev = (await c.post(f"{URL}/planos/{plano_id}/importar/previa", headers=_h(tok),
                         files={"arquivo": ("pms.xlsx", _planilha([LINHA_1, LINHA_2]))})).json()
    await c.post(f"{URL}/planos/{plano_id}/importar/confirmar", headers=_h(tok), json={"diretrizes": prev["diretrizes"]})
    await c.post(f"{URL}/planos/{plano_id}/aprovar", headers=_h(tok), json={"resolucao_cms": "Res. 1/2026"})
    return (await c.get(f"{URL}/planos/{plano_id}", headers=_h(tok))).json()


async def test_pas_execucao_validacao_e_minhas_acoes(ambiente):
    c, S, ids = ambiente["client"], ambiente["Session"], ambiente["ids"]
    exec_id = await _usuario(S, ids["apui"], "executor@apui.test", Perfil.TECNICO_APS)
    await _usuario(S, ids["apui"], "coord@apui.test", Perfil.COORDENADOR)
    de_b = await _usuario(S, ids["b"], "alguem@b.test", Perfil.TECNICO_APS)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    tok_exec = await _token(c, "executor@apui.test")
    tok_coord = await _token(c, "coord@apui.test")

    plano = await _pms_aprovado(c, tok)
    metas = [m["id"] for m in plano["diretrizes"][0]["objetivos"][0]["metas"]]
    assert (await c.post(f"{URL}/planos/{plano['id']}/pas", headers=_h(tok), json={"exercicio": 2031})).status_code == 422
    pas = (await c.post(f"{URL}/planos/{plano['id']}/pas", headers=_h(tok), json={"exercicio": 2026})).json()

    base = {"codigo": "A1", "descricao": "Contratar e capacitar ACS", "meta_ids": metas, "produto": "ACS capacitados",
            "quantidade_prevista": 10, "prazo": (date.today() - timedelta(days=1)).isoformat(),
            "setor_responsavel": "Coordenação APS", "responsavel_usuario_id": exec_id,
            "evidencia_esperada": "Lista de presença da capacitação"}
    assert (await c.post(f"{URL}/pas/{pas['id']}/acoes", headers=_h(tok),
                         json={**base, "responsavel_usuario_id": de_b})).status_code == 422    # outro município
    assert (await c.post(f"{URL}/pas/{pas['id']}/acoes", headers=_h(tok),
                         json={**base, "meta_ids": [999999]})).status_code == 422
    assert (await c.post(f"{URL}/pas/{pas['id']}/acoes", headers=_h(tok_exec), json=base)).status_code == 403
    acao = (await c.post(f"{URL}/pas/{pas['id']}/acoes", headers=_h(tok), json=base)).json()
    assert len(acao["metas"]) == 2 and acao["responsavel_nome"] == "executor" and acao["atrasada"]
    # a meta 1.1.1 aparece com a ação vinculada (rastreabilidade meta ↔ ação)
    arv = (await c.get(f"{URL}/planos/{plano['id']}", headers=_h(tok))).json()
    assert [m["acoes"] for m in arv["diretrizes"][0]["objetivos"][0]["metas"]] == [1, 1]

    minhas = (await c.get(f"{URL}/minhas-acoes", headers=_h(tok_exec))).json()
    assert [a["codigo"] for a in minhas["acoes"]] == ["A1"]
    assert minhas["resumo"]["atrasadas"] == 1 and minhas["resumo"]["evidencias_pendentes"] == 1
    assert (await c.get(f"{URL}/minhas-acoes", headers=_h(tok_coord))).json()["acoes"] == []

    # execução informada não muda a situação oficial
    url_upd = f"{URL}/acoes/{acao['id']}/atualizacoes"
    assert (await c.post(url_upd, headers=_h(tok_exec), json={"situacao": "concluida"})).status_code == 422
    upd = (await c.post(url_upd, headers=_h(tok_exec), json={
        "situacao": "concluida", "quantidade_realizada": 10, "resultado_alcancado": "10 ACS capacitados"})).json()
    assert upd["status"] == "pendente"
    assert (await c.post(url_upd, headers=_h(tok_exec), json={"situacao": "em_andamento"})).status_code == 409
    det = (await c.get(f"{URL}/acoes/{acao['id']}", headers=_h(tok))).json()
    assert det["situacao"] == "nao_iniciada"
    # quem executa não valida; validação exige a evidência esperada
    url_val = f"{URL}/atualizacoes/{upd['id']}/validar"
    assert (await c.post(url_val, headers=_h(tok_exec), json={"decisao": "validar"})).status_code == 403
    assert (await c.post(url_val, headers=_h(tok_coord), json={"decisao": "validar"})).status_code == 422
    assert (await c.post(url_val, headers=_h(tok_coord), json={"decisao": "devolver"})).status_code == 422
    assert (await c.post(f"{URL}/acoes/{acao['id']}/anexos", headers=_h(tok_exec),
                         files={"arquivo": ("presenca.pdf", b"%PDF lista")},
                         data={"atualizacao_id": str(upd["id"])})).status_code == 201
    r = (await c.post(url_val, headers=_h(tok_coord), json={"decisao": "validar", "parecer": "Conferido"})).json()
    assert r["acao"]["situacao"] == "concluida" and r["acao"]["situacao_validada_por"] == "coord@apui.test"
    assert r["acao"]["atrasada"] is False
    assert await _auditoria(S, "PAS_EXECUCAO_VALIDADA")

    # cancelamento: justificativa e autorização do Secretário/Planejamento
    a2 = (await c.post(f"{URL}/pas/{pas['id']}/acoes", headers=_h(tok),
                       json={**base, "codigo": "A2", "evidencia_esperada": None})).json()
    url2 = f"{URL}/acoes/{a2['id']}/atualizacoes"
    assert (await c.post(url2, headers=_h(tok_exec), json={"situacao": "cancelada"})).status_code == 422
    u2 = (await c.post(url2, headers=_h(tok_exec), json={"situacao": "cancelada",
                                                          "justificativa": "Programa federal encerrado"})).json()
    assert (await c.post(f"{URL}/atualizacoes/{u2['id']}/validar", headers=_h(tok_coord),
                         json={"decisao": "validar"})).status_code == 403
    assert (await c.post(f"{URL}/atualizacoes/{u2['id']}/validar", headers=_h(tok),
                         json={"decisao": "validar"})).json()["acao"]["situacao"] == "cancelada"
    # autovalidação proibida mesmo para o Secretário
    a3 = (await c.post(f"{URL}/pas/{pas['id']}/acoes", headers=_h(tok), json={**base, "codigo": "A3"})).json()
    u3 = (await c.post(f"{URL}/acoes/{a3['id']}/atualizacoes", headers=_h(tok), json={"situacao": "em_andamento"})).json()
    assert (await c.post(f"{URL}/atualizacoes/{u3['id']}/validar", headers=_h(tok),
                         json={"decisao": "validar"})).status_code == 409
    fila = (await c.get(f"{URL}/validacoes-pendentes", headers=_h(tok_coord))).json()
    assert [f["acao"]["codigo"] for f in fila] == ["A3"] and fila[0]["pode_validar"]

    # PAS aprovada: ação não é excluída nem tem o texto alterado
    await c.post(f"{URL}/pas/{pas['id']}/aprovar", headers=_h(tok), json={"resolucao_cms": "Res. PAS 2026"})
    assert (await c.delete(f"{URL}/acoes/{a3['id']}", headers=_h(tok))).status_code == 409
    assert (await c.put(f"{URL}/acoes/{a3['id']}", headers=_h(tok), json={"descricao": "outra"})).status_code == 409
    assert (await c.put(f"{URL}/acoes/{a3['id']}", headers=_h(tok), json={"prazo": "2026-12-31"})).status_code == 200

    # isolamento e perfis
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    for path in (f"/planos/{plano['id']}", f"/acoes/{acao['id']}", f"/pas/{pas['id']}/acoes", f"/planos/{plano['id']}/pas"):
        assert (await c.get(URL + path, headers=_h(tok_b))).status_code == 404, path
    assert (await c.post(f"{URL}/acoes/{a3['id']}/atualizacoes", headers=_h(tok_b),
                         json={"situacao": "em_andamento"})).status_code == 404
    assert (await c.get(f"{URL}/planos", headers=_h(tok_b))).json() == []
    assert {u["id"] for u in (await c.get(f"{URL}/responsaveis", headers=_h(tok_b))).json()} >= {de_b}
    assert exec_id not in {u["id"] for u in (await c.get(f"{URL}/responsaveis", headers=_h(tok_b))).json()}
    tok_cons = await _token(c, "ana.consulta@apui.gov.br")
    assert (await c.get(f"{URL}/planos/{plano['id']}", headers=_h(tok_cons))).status_code == 200
    assert (await c.post(f"{URL}/planos/{plano['id']}/pas", headers=_h(tok_cons),
                         json={"exercicio": 2027})).status_code == 403
    assert (await c.post(f"{URL}/acoes/{a3['id']}/atualizacoes", headers=_h(tok_cons),
                         json={"situacao": "em_andamento"})).status_code == 403
