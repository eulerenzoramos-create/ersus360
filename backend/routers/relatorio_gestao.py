from fastapi import APIRouter

router = APIRouter(prefix="/api/relatorio-gestao", tags=["relatorio-gestao"])

_SECOES = [
    {
        "id": "s01", "titulo": "Atenção Primária",
        "descricao": "Cobertura ESF, Previne Brasil, pré-natal, HAS, DM, saúde da criança, saúde bucal",
        "status": "aprovada", "percentual_execucao": 88,
        "itens": [
            {"indicador": "Cobertura da Estratégia Saúde da Família", "meta": "≥ 95%",    "realizado": "98,5%",  "situacao": "atingida",     "justificativa": ""},
            {"indicador": "Score Previne Brasil (0–10)",              "meta": "≥ 7,0",    "realizado": "6,8",    "situacao": "parcial",      "justificativa": "Indicador C01 (pré-natal) abaixo da meta — ações de busca ativa em curso."},
            {"indicador": "Pré-natal: 6+ consultas",                 "meta": "≥ 90%",    "realizado": "74,1%",  "situacao": "nao_atingida", "justificativa": "Gestantes rurais com acesso dificultado. Ampliação de consultas na UBS rural prevista para ago/2026."},
            {"indicador": "Acompanhamento HAS",                      "meta": "≥ 65%",    "realizado": "61,3%",  "situacao": "parcial",      "justificativa": ""},
            {"indicador": "Acompanhamento DM",                       "meta": "≥ 65%",    "realizado": "58,7%",  "situacao": "nao_atingida", "justificativa": "Reforço de busca ativa por ACS previsto para o 2º semestre."},
            {"indicador": "Citopatológico (mulheres 25-64a)",        "meta": "≥ 80%",    "realizado": "71,4%",  "situacao": "parcial",      "justificativa": ""},
            {"indicador": "Cobertura de saúde bucal na APS",         "meta": "≥ 70%",    "realizado": "52,0%",  "situacao": "nao_atingida", "justificativa": "Cadeira odontológica da UBS Central em manutenção corretiva desde jun/2026."},
        ],
    },
    {
        "id": "s02", "titulo": "Vigilância em Saúde",
        "descricao": "Vigilância epidemiológica, ambiental e sanitária — malária, dengue, imunização",
        "status": "pendente", "percentual_execucao": 72,
        "itens": [
            {"indicador": "Taxa de incidência de malária (por mil hab.)", "meta": "< 10,0", "realizado": "8,4",   "situacao": "atingida",     "justificativa": ""},
            {"indicador": "Cobertura vacinal infantil ≥ 95% (DTP3)",     "meta": "≥ 95%",  "realizado": "87,0%",  "situacao": "parcial",      "justificativa": "Campanha de atualização vacinal prevista para ago/2026."},
            {"indicador": "Cobertura vacinal Febre Amarela",             "meta": "≥ 95%",  "realizado": "72,4%",  "situacao": "nao_atingida", "justificativa": "Região endêmica. Estratégia de imunização extramuros solicitada à SUSAM."},
            {"indicador": "Notificações de doenças de notificação compulsória", "meta": "100% em 24h", "realizado": "94,2%", "situacao": "parcial", "justificativa": ""},
            {"indicador": "Inspeções sanitárias em estabelecimentos",    "meta": "≥ 80%",  "realizado": "91,0%",  "situacao": "atingida",     "justificativa": ""},
        ],
    },
    {
        "id": "s03", "titulo": "Gestão Financeira",
        "descricao": "Execução orçamentária, repasses FNS, SIOPS, aplicação mínima em saúde",
        "status": "aprovada", "percentual_execucao": 95,
        "itens": [
            {"indicador": "Aplicação mínima em saúde (15% receita própria)", "meta": "≥ 15%",  "realizado": "18,4%",  "situacao": "atingida", "justificativa": ""},
            {"indicador": "Execução orçamentária em ações de saúde",         "meta": "≥ 70%",  "realizado": "71,4%",  "situacao": "atingida", "justificativa": ""},
            {"indicador": "Repasses FNS creditados no prazo",                "meta": "100%",   "realizado": "83,3%",  "situacao": "parcial",  "justificativa": "Repasse Vigilância (Abr/2026) com pendência documental no FNS — regularização prevista."},
            {"indicador": "Alimentação do SIOPS (quadrimestral)",            "meta": "em dia",  "realizado": "em dia", "situacao": "atingida", "justificativa": ""},
        ],
    },
    {
        "id": "s04", "titulo": "Recursos Humanos",
        "descricao": "Equipes ESF, SCNES, formação, precarização do trabalho",
        "status": "revisao", "percentual_execucao": 60,
        "itens": [
            {"indicador": "Equipes ESF completas (médico, enfermeiro, ACS, AUX)", "meta": "5 de 5", "realizado": "4 de 5", "situacao": "parcial",      "justificativa": "ESF III zona rural sem médico desde mai/2026. Processo seletivo em andamento."},
            {"indicador": "Profissionais com registro CNES ativo",               "meta": "100%",    "realizado": "96,8%",  "situacao": "parcial",      "justificativa": "4 profissionais com pendência de atualização de registro."},
            {"indicador": "ACS com microárea sob cobertura",                     "meta": "100%",    "realizado": "100%",   "situacao": "atingida",     "justificativa": ""},
            {"indicador": "Rotatividade médica (turnover anualizado)",            "meta": "< 30%",   "realizado": "40,0%",  "situacao": "nao_atingida", "justificativa": "Dificuldade de fixação de médico em área rural amazônica. Medidas do Mais Médicos solicitadas."},
        ],
    },
    {
        "id": "s05", "titulo": "Saúde Mental",
        "descricao": "RAPS, CAPS, internação psiquiátrica, leitos, SISAB-Mental",
        "status": "rascunho", "percentual_execucao": 45,
        "itens": [
            {"indicador": "Cobertura CAPS (por 100 mil hab.)",                    "meta": "≥ 1 CAPS",  "realizado": "1 CAPS AD", "situacao": "atingida", "justificativa": ""},
            {"indicador": "Usuários acompanhados no CAPS",                        "meta": "≥ 80% da cap.", "realizado": "73,0%", "situacao": "parcial",  "justificativa": ""},
            {"indicador": "Implantação de grupo terapêutico nas UBS",             "meta": "4 de 4 UBS", "realizado": "2 de 4",  "situacao": "nao_atingida", "justificativa": "Psicólogo NASF-AB sobrecarregado. Solicitação de apoio estadual pendente."},
        ],
    },
    {
        "id": "s06", "titulo": "Assistência Farmacêutica",
        "descricao": "Relação Municipal de Medicamentos (REMUME), dispensação, abastecimento",
        "status": "pendente", "percentual_execucao": 55,
        "itens": [
            {"indicador": "Disponibilidade de medicamentos da REMUME",  "meta": "≥ 90%",  "realizado": "83,3%",  "situacao": "parcial",      "justificativa": "Dipirona e amoxicilina com estoque crítico. Pedido de compra emergencial em elaboração."},
            {"indicador": "Dispensação com receituário válido",         "meta": "100%",   "realizado": "98,4%",  "situacao": "atingida",     "justificativa": ""},
            {"indicador": "Alimentação do HÓRUS/BNAfar",               "meta": "em dia",  "realizado": "atrasada 2 meses", "situacao": "nao_atingida", "justificativa": "Responsável técnico em férias — designação de substituto pendente."},
        ],
    },
]

@router.get("/resumo")
def resumo():
    aprovadas = [s for s in _SECOES if s["status"] == "aprovada"]
    pendentes = [s for s in _SECOES if s["status"] in ("pendente", "rascunho", "revisao")]
    todos_itens = [i for s in _SECOES for i in s["itens"]]
    atingidos   = [i for i in todos_itens if i["situacao"] == "atingida"]
    return {
        "quadrimestre":           "1º Quadrimestre",
        "periodo":                "Janeiro a Abril de 2026",
        "ano":                    2026,
        "secoes_total":           len(_SECOES),
        "secoes_aprovadas":       len(aprovadas),
        "secoes_pendentes":       len(pendentes),
        "indicadores_total":      len(todos_itens),
        "indicadores_atingidos":  len(atingidos),
        "data_apresentacao_cms":  "30/07/2026",
        "status_geral":           "Em elaboração — 2 seções aprovadas de 6",
    }

@router.get("/secoes")
def secoes():
    return _SECOES

@router.post("/gerar")
def gerar():
    return {"ok": True, "mensagem": "PDF do Relatório de Gestão gerado com sucesso.", "url": "/relatorios/rg-1quad-2026.pdf"}
