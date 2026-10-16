"""Regras do escopo federal do INVESTSUS 360 (services/investsus_federal.py)."""
from services import investsus_federal as fed


# ── Escopo / esfera ───────────────────────────────────────────────────────────

def test_somente_esfera_federal_habilitada():
    assert fed.ESFERAS_HABILITADAS == frozenset({"federal"})
    assert fed.esfera_habilitada("federal")
    assert fed.esfera_habilitada(None)  # registro antigo sem esfera = federal
    assert not fed.esfera_habilitada("estadual")


def test_todas_as_fontes_ativas_sao_federais():
    assert fed.fontes_habilitadas()
    assert all(f.esfera == "federal" for f in fed.fontes_habilitadas())
    assert fed.fonte_permitida("investsus") and fed.fonte_permitida("transparencia")
    assert not fed.fonte_permitida("assembleia_legislativa")


def test_item_estadual_e_reconhecido_como_fora_do_escopo():
    assert fed.classificar_esfera("Emenda estadual - Deputado Estadual Fulano") == "estadual"
    assert fed.classificar_esfera("Assembleia Legislativa do Estado do Amazonas") == "estadual"
    assert fed.classificar_esfera("EMENDA", "INCREMENTO MAC") == "federal"
    assert fed.classificar_esfera("Deputado Federal Fulano") == "federal"


# ── Modalidades ───────────────────────────────────────────────────────────────

def test_modalidades_por_texto_da_fonte():
    assert fed.classificar_modalidade("EMENDA INDIVIDUAL") == "rp6"
    assert fed.classificar_modalidade("Emenda de Bancada") == "rp7"
    assert fed.classificar_modalidade("EMENDA DE COMISSÃO") == "rp8"
    assert fed.classificar_modalidade("Emenda Coletiva") == "rp7"
    assert fed.classificar_modalidade("PROGRAMA", "CUSTEIO PAP") == "programa"
    assert fed.classificar_modalidade("Outros") == "programa"


def test_modalidade_por_resultado_primario_explicito():
    assert fed.classificar_modalidade("EMENDA", resultado_primario=6) == "rp6"
    assert fed.classificar_modalidade("EMENDA", resultado_primario="RP 7") == "rp7"
    assert fed.classificar_modalidade("EMENDA", resultado_primario="8") == "rp8"
    assert fed.classificar_modalidade("Emenda RP-8") == "rp8"


def test_resultado_primario_nao_confunde_ano_ou_outros_codigos():
    assert fed.modalidade_por_rp("2026") is None
    assert fed.modalidade_por_rp("2") is None
    assert fed.modalidade_por_rp(None) is None


def test_emenda_sem_tipo_nao_vira_individual_por_omissao():
    # Regra antiga gravava toda emenda como "individual" — RP 7/RP 8 sumiam.
    assert fed.classificar_modalidade("EMENDA", "INCREMENTO MAC") is None
    assert fed.eh_emenda("EMENDA")
    assert not fed.eh_emenda("PROGRAMA", "CUSTEIO PAP")


def test_compatibilidade_com_tipo_emenda_legado():
    for modalidade in ("rp6", "rp7", "rp8", "programa"):
        legado = fed.tipo_emenda_de_modalidade(modalidade)
        assert fed.modalidade_de_tipo_emenda(legado) == modalidade
    assert fed.tipo_emenda_de_modalidade("a_classificar") == "outro"


# ── Situações oficiais ────────────────────────────────────────────────────────

def test_aguardando_pagamento_nao_e_paga():
    assert fed.classificar_situacao("Aguardando Pagamento") == "aguardando_pagamento"
    assert fed.fase_de("aguardando_pagamento") == "empenhada"


def test_reanalise_nao_e_analise():
    assert fed.classificar_situacao("Em Reanálise") == "em_reanalize"
    assert fed.classificar_situacao("Em análise") == "em_analise"


def test_situacoes_do_ciclo_completo():
    casos = {
        "Cadastrada": ("proposta_cadastrada", "cadastrada"),
        "Enviada": ("proposta_enviada", "enviada"),
        "Enviada para análise": ("em_analise", "em_analise"),
        "Em Diligência": ("em_diligencia", "em_diligencia"),
        "Diligência respondida": ("complementacao_enviada", "em_reanalise"),
        "Aprovada": ("aprovada", "aprovada"),
        "Rejeitada": ("rejeitada", "rejeitada"),
        "Não aprovada": ("rejeitada", "rejeitada"),
        "Empenhada": ("empenhada", "empenhada"),
        "Empenhada - aguardando formalização": ("empenhada_aguardando_formalizacao", "empenhada"),
        "Paga": ("totalmente_paga", "paga"),
        "Parcialmente paga": ("parcialmente_paga", "paga"),
        "Em execução": ("em_execucao", "em_execucao"),
        "Concluída": ("instrumento_concluido", "concluida"),
        "Cancelada": ("cancelada", "cancelada"),
    }
    for texto, (situacao, fase) in casos.items():
        assert fed.classificar_situacao(texto) == situacao, texto
        assert fed.fase_de(situacao) == fase, texto


def test_situacao_desconhecida_ou_vazia():
    assert fed.classificar_situacao("") is None
    assert fed.classificar_situacao(None) is None
    assert fed.classificar_situacao("xyz") is None


def test_toda_situacao_normalizada_tem_fase():
    # Mesma lista de models.investsus.SituacaoNormalizada (sem importar SQLAlchemy).
    for _, valor in fed._REGRAS_SITUACAO:
        assert fed.fase_de(valor) in fed.FASES, valor


def test_fases_exigidas_pela_determinacao():
    exigidas = {"cadastrada", "enviada", "em_analise", "em_diligencia", "em_reanalise",
                "aprovada", "rejeitada", "empenhada", "paga", "em_execucao", "concluida"}
    assert exigidas <= set(fed.FASES)
    for fase in exigidas:
        assert fed.situacoes_da_fase(fase), fase


# ── Alertas ───────────────────────────────────────────────────────────────────

def test_alerta_de_nova_proposta():
    [a] = fed.alertas_de_movimento(nova=True, fase_anterior=None, fase_nova="cadastrada",
                                   situacao_anterior=None, situacao_nova="Cadastrada", numero="123")
    assert a["tipo_alerta"] == "nova_proposta" and "123" in a["titulo"]


def test_alerta_de_diligencia_e_urgente_e_rejeicao_e_critica():
    [d] = fed.alertas_de_movimento(nova=False, fase_anterior="em_analise", fase_nova="em_diligencia",
                                   situacao_anterior="Em análise", situacao_nova="Em diligência", numero="1")
    assert d["nivel"] == "urgente"
    [r] = fed.alertas_de_movimento(nova=False, fase_anterior="em_analise", fase_nova="rejeitada",
                                   situacao_anterior="Em análise", situacao_nova="Rejeitada", numero="1")
    assert r["nivel"] == "critico"


def test_mudanca_so_de_texto_oficial_tambem_gera_registro():
    [a] = fed.alertas_de_movimento(nova=False, fase_anterior="empenhada", fase_nova="empenhada",
                                   situacao_anterior="Empenhada", situacao_nova="Aguardando pagamento",
                                   numero="1")
    assert a["tipo_alerta"] == "mudanca_situacao"


def test_sem_mudanca_sem_alerta():
    assert fed.alertas_de_movimento(nova=False, fase_anterior="paga", fase_nova="paga",
                                    situacao_anterior="Paga", situacao_nova="PAGA", numero="1") == []


def test_niveis_de_prazo_de_diligencia():
    assert fed.nivel_prazo_diligencia(10) is None
    assert fed.nivel_prazo_diligencia(7) == "atencao"
    assert fed.nivel_prazo_diligencia(3) == "urgente"
    assert fed.nivel_prazo_diligencia(0) == "urgente"
    assert fed.nivel_prazo_diligencia(-1) == "critico"


def test_situacoes_reais_do_investsus_apui():
    """Textos oficiais vistos na API do InvestSUS (Apuí, out/2026)."""
    casos = {
        "Proposta enviada para Análise Técnica de Mérito": "em_analise",
        "Proposta Favorável aguardando Classificação Orçamentária": "aprovada",
        "Proposta Empenhada aguardando Formalização": "empenhada",
        "Proposta Paga": "paga",
        "Proposta Rejeitada": "rejeitada",
        "Proposta Cancelada": "cancelada",
    }
    for texto, fase in casos.items():
        assert fed.fase_de(fed.classificar_situacao(texto)) == fase, texto
