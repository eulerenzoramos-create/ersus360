"""
Inventário dos painéis de dados da FVS-RCP/AM (https://www.fvs.am.gov.br/dadossaude) e o mapeamento
para as 15 subabas da Vigilância em Saúde do ERSUS360.

Levantado em 23/10/2026 na própria página (cada cartão abre fvs.am.gov.br/ver_painel/{id}):
  • 10 painéis em Tableau Public (perfil "astec.sass" — SASS/FVS-RCP)
  • 9 painéis em Power BI "Publicar na Web"
  • mais 5 pastas públicas do mesmo perfil Tableau que não aparecem na página (AESOP, Vacinômetro…)

Como cada painel entra no ERSUS360 (campo "integracao"):
  extracao        → o coletor baixa a pasta de trabalho pelo download que a própria FVS deixou liberado
                    no Tableau Public, agrega por município/período e grava só os números (fvs_serie).
  incorporado     → o painel oficial é exibido dentro da subaba (visualização da própria FVS).
                    Power BI "Publicar na Web" não oferece exportação de dados; no Tableau, quando a
                    FVS desativou o download, também só há visualização.
  bloqueado_lgpd  → a pasta de trabalho pública traz dados pessoais identificados (nome do paciente,
                    nome da mãe, data de nascimento, CNS…). O ERSUS360 NÃO baixa nem lê esses
                    arquivos; mostra só o painel oficial, sem barra de download. Ver
                    docs/VIGILANCIA-FVS-AM.md (recomendação de comunicar a FVS).
"""
from __future__ import annotations

FONTE_PAGINA = "https://www.fvs.am.gov.br/dadossaude"
FONTE_NOME = "FVS-RCP/AM — Fundação de Vigilância em Saúde do Amazonas Dra. Rosemary Costa Pinto"
TABLEAU_PERFIL = "astec.sass"

# Identificadores das 15 subabas existentes + o painel executivo novo. A rota de cada uma fica no
# frontend (components/vigilancia/subabas.ts) — aqui só o identificador neutro.
SUBABAS = {
    "painel": "Painel de Vigilância (FVS-AM)",
    "arboviroses": "Arboviroses / Dengue",
    "ccih": "CCIH",
    "vetores": "Controle de Vetores",
    "epidemiologia": "Epidemiologia / SINAN",
    "ist_hiv": "IST / HIV / Hepatites",
    "malaria": "Malária / Endemias",
    "monitor": "Monitor Epidemiológico",
    "cancer": "Rastreio de Câncer",
    "vacinas": "Vacinas / SIPNI",
    "sim_sinasc": "SIM / SINASC",
    "sisvan": "SISVAN",
    "tb_hanseniase": "TB / Hanseníase",
    "vigiagua": "VigiÁgua",
    "visa": "Vigilância Sanitária",
    "zoonoses": "Zoonoses",
}

# Subabas para as quais a FVS não publica painel em /dadossaude (continuam com as fontes que já têm)
SEM_FONTE_FVS = {
    "ccih": "A FVS não publica painel de infecção hospitalar em /dadossaude.",
    "cancer": "A FVS não publica painel de rastreamento de câncer em /dadossaude.",
    "sisvan": "A FVS não publica painel de vigilância alimentar e nutricional em /dadossaude.",
    "visa": "A FVS não publica painel de vigilância sanitária em /dadossaude.",
}


def _tableau(workbook: str, view: str) -> str:
    # Barra de ferramentas desligada: nas pastas com dado pessoal ela oferece "baixar pasta de trabalho"
    return f"https://public.tableau.com/views/{workbook}/{view}?:embed=y&:showVizHome=no&:toolbar=no&:tabs=no"


def _pbi(chave: str, pagina: str | None = None) -> str:
    return f"https://app.powerbi.com/view?r={chave}" + (f"&pageName={pagina}" if pagina else "")


PAINEIS: list[dict] = [
    # ── Apoio à Gestão e Planejamento ──────────────────────────────────────────
    {"id": "fvs-23", "ver_painel": 23, "grupo": "Apoio à Gestão e Planejamento",
     "titulo": "Saúde da População Negra", "descricao": "Painel de acesso",
     "plataforma": "powerbi", "integracao": "incorporado",
     "embed": _pbi("eyJrIjoiMTY4ZDA0YWMtMzQ4MC00NDM4LWE0ODYtYWJmYzIxMzNmMTUxIiwidCI6Ijg1NDczOTk4LTFmODEtNDAxMS1iYzk3LTg3YWUwNGU2MTIwNCJ9"),
     "subabas": ["painel"]},
    {"id": "fvs-2", "ver_painel": 2, "grupo": "Apoio à Gestão e Planejamento",
     "titulo": "Indicadores do PQA-VS", "descricao": "Programa de Qualificação das Ações de Vigilância em Saúde",
     "plataforma": "tableau", "workbook": "PQA-VS-Indicadores", "integracao": "extracao", "coletor": "pqa_vs",
     "embed": _tableau("PQA-VS-Indicadores", "Histria1"),
     "subabas": ["painel", "sim_sinasc", "vacinas", "vigiagua", "epidemiologia",
                 "malaria", "vetores", "tb_hanseniase", "ist_hiv"]},
    {"id": "fvs-1", "ver_painel": 1, "grupo": "Apoio à Gestão e Planejamento",
     "titulo": "Indicadores PES", "descricao": "Plano Estadual de Saúde",
     "plataforma": "powerbi", "integracao": "incorporado",
     "embed": _pbi("eyJrIjoiNzcwMTUwNDUtN2NlYS00ZGJmLTg0NzAtODQwZmMxOWQ3MGUxIiwidCI6Ijg1NDczOTk4LTFmODEtNDAxMS1iYzk3LTg3YWUwNGU2MTIwNCJ9", "a770c5c7757aa1a0e633"),
     "subabas": ["painel"]},

    # ── Doenças e Agravos à Saúde ──────────────────────────────────────────────
    {"id": "fvs-20", "ver_painel": 20, "grupo": "Doenças e Agravos à Saúde",
     "titulo": "Tratamento Preventivo da Tuberculose", "descricao": "Indicadores de início e desfecho de tratamento",
     "plataforma": "powerbi", "integracao": "incorporado",
     "embed": _pbi("eyJrIjoiZDVkODI0OGEtZDM4Mi00ZjQwLWFkN2MtNGEzMjYzYzRkOTc2IiwidCI6Ijg1NDczOTk4LTFmODEtNDAxMS1iYzk3LTg3YWUwNGU2MTIwNCJ9"),
     "subabas": ["tb_hanseniase"]},
    {"id": "fvs-18", "ver_painel": 18, "grupo": "Doenças e Agravos à Saúde",
     "titulo": "Esporotricose", "descricao": "Humana e animal",
     "plataforma": "powerbi", "integracao": "incorporado",
     "embed": _pbi("eyJrIjoiZWZlOWFkYjQtMWMzOS00ZWM2LWFmN2ItYzdhMTE1NWRmYzQ5IiwidCI6Ijg1NDczOTk4LTFmODEtNDAxMS1iYzk3LTg3YWUwNGU2MTIwNCJ9", "80e0c542d33e78676714"),
     "subabas": ["zoonoses"]},
    {"id": "fvs-12", "ver_painel": 12, "grupo": "Doenças e Agravos à Saúde",
     "titulo": "Vírus Respiratórios", "descricao": "Síndrome Respiratória Aguda Grave (SRAG)",
     "plataforma": "powerbi", "integracao": "incorporado",
     "embed": _pbi("eyJrIjoiNTg5MDhiZmEtNmNhYi00NmZkLWI1YTYtNmMxMTQ4YmFiMzFmIiwidCI6Ijg1NDczOTk4LTFmODEtNDAxMS1iYzk3LTg3YWUwNGU2MTIwNCJ9", "d76de02995cae8147eb7"),
     "subabas": ["monitor"]},
    {"id": "fvs-11", "ver_painel": 11, "grupo": "Doenças e Agravos à Saúde",
     "titulo": "Doenças e agravos de notificação", "descricao": "Vigilância em Saúde (monitoramento SINAN)",
     "plataforma": "tableau", "workbook": "monitoramentosinan", "integracao": "extracao", "coletor": "sinan",
     "embed": _tableau("monitoramentosinan", "Histria1"),
     "subabas": ["epidemiologia", "arboviroses", "zoonoses", "tb_hanseniase", "ist_hiv",
                 "malaria", "monitor", "painel"]},
    {"id": "fvs-10", "ver_painel": 10, "grupo": "Doenças e Agravos à Saúde",
     "titulo": "Hepatites Virais", "descricao": "Cenário epidemiológico",
     "plataforma": "tableau", "workbook": "PainelHepatites", "integracao": "bloqueado_lgpd",
     "embed": _tableau("PainelHepatites", "Painel1"), "subabas": ["ist_hiv"]},
    {"id": "fvs-9", "ver_painel": 9, "grupo": "Doenças e Agravos à Saúde",
     "titulo": "Tuberculose", "descricao": "Tuberculose e Infecção Latente de TB (ILTB)",
     "plataforma": "tableau", "workbook": "PainelTuberculose", "integracao": "bloqueado_lgpd",
     "embed": _tableau("PainelTuberculose", "Painel1"), "subabas": ["tb_hanseniase"]},
    {"id": "fvs-8", "ver_painel": 8, "grupo": "Doenças e Agravos à Saúde",
     "titulo": "Malária", "descricao": "Cenário epidemiológico (SIVEP-Malária)",
     "plataforma": "tableau", "workbook": "Painel_Malria", "integracao": "extracao", "coletor": "malaria",
     "embed": _tableau("Painel_Malria", "PAINELMALRIA"), "subabas": ["malaria", "painel"]},
    {"id": "fvs-6", "ver_painel": 6, "grupo": "Doenças e Agravos à Saúde",
     "titulo": "HIV/AIDS", "descricao": "Infecção pelo HIV e casos de aids",
     "plataforma": "tableau", "workbook": "Painel_AIDS_HIV", "integracao": "bloqueado_lgpd",
     "embed": _tableau("Painel_AIDS_HIV", "PainelHIVSIM2"), "subabas": ["ist_hiv"]},
    {"id": "fvs-5", "ver_painel": 5, "grupo": "Doenças e Agravos à Saúde",
     "titulo": "Sífilis", "descricao": "Sífilis adquirida, em gestantes e congênita",
     "plataforma": "tableau", "workbook": "PainelSfilisFVSAM", "integracao": "bloqueado_lgpd",
     "embed": _tableau("PainelSfilisFVSAM", "PainelAdquirida"), "subabas": ["ist_hiv"]},
    {"id": "fvs-4", "ver_painel": 4, "grupo": "Doenças e Agravos à Saúde",
     "titulo": "ISTs", "descricao": "Infecções Sexualmente Transmissíveis",
     "plataforma": "tableau", "workbook": "PaineldeISTs", "integracao": "bloqueado_lgpd",
     "embed": _tableau("PaineldeISTs", "PainelAmazonas2026"), "subabas": ["ist_hiv"]},
    {"id": "fvs-3", "ver_painel": 3, "grupo": "Doenças e Agravos à Saúde",
     "titulo": "Mpox", "descricao": "Cenário epidemiológico",
     "plataforma": "powerbi", "integracao": "incorporado",
     "embed": _pbi("eyJrIjoiOWFhYzdjODItYjI5NC00YjQ1LTkwOWItY2EyZDIwNzJmMmI4IiwidCI6Ijg1NDczOTk4LTFmODEtNDAxMS1iYzk3LTg3YWUwNGU2MTIwNCJ9"),
     "subabas": ["monitor"]},

    # ── Mortalidade e Ciclos de Vida ───────────────────────────────────────────
    {"id": "fvs-25", "ver_painel": 25, "grupo": "Mortalidade e Ciclos de Vida",
     "titulo": "Mortalidade Feminina", "descricao": "Óbitos em mulheres",
     "plataforma": "tableau", "workbook": "Painel-bitosdemulheres", "integracao": "bloqueado_lgpd",
     "embed": _tableau("Painel-bitosdemulheres", "Painel-ObtMulheres"), "subabas": ["sim_sinasc"]},
    {"id": "fvs-24", "ver_painel": 24, "grupo": "Mortalidade e Ciclos de Vida",
     "titulo": "Taxa de Mortalidade Prematura", "descricao": "Doenças crônicas não transmissíveis (DCNT)",
     "plataforma": "tableau", "workbook": "Sispacto1-TaxadeMortalidadeprematuraporDCNT", "integracao": "incorporado",
     "embed": _tableau("Sispacto1-TaxadeMortalidadeprematuraporDCNT", "Sispacto1-DCNT"),
     "nota": "Download desativado pela FVS no Tableau Public: só visualização.", "subabas": ["sim_sinasc"]},
    {"id": "fvs-16", "ver_painel": 16, "grupo": "Mortalidade e Ciclos de Vida",
     "titulo": "Nascimentos", "descricao": "Nascidos vivos e indicadores de natalidade",
     "plataforma": "powerbi", "integracao": "incorporado",
     "embed": _pbi("eyJrIjoiMjM1N2NmNzItMjI3OC00MGE1LWJkZDEtMmVjYTVjMDAwMzY5IiwidCI6Ijg1NDczOTk4LTFmODEtNDAxMS1iYzk3LTg3YWUwNGU2MTIwNCJ9", "202af8acd6bb3c058872"),
     "subabas": ["sim_sinasc"]},
    {"id": "fvs-15", "ver_painel": 15, "grupo": "Mortalidade e Ciclos de Vida",
     "titulo": "Mortalidade Materna", "descricao": "Óbitos maternos e causas associadas",
     "plataforma": "powerbi", "integracao": "incorporado",
     "embed": _pbi("eyJrIjoiZThlYTVhMjctMmVmOC00NWU5LThiMmItYzFjMDk0Njc2YmIwIiwidCI6Ijg1NDczOTk4LTFmODEtNDAxMS1iYzk3LTg3YWUwNGU2MTIwNCJ9"),
     "subabas": ["sim_sinasc"]},
    {"id": "fvs-14", "ver_painel": 14, "grupo": "Mortalidade e Ciclos de Vida",
     "titulo": "Mortalidade Infantil e Neonatal", "descricao": "Óbitos infantis e neonatais",
     "plataforma": "powerbi", "integracao": "incorporado",
     "embed": _pbi("eyJrIjoiNTAyM2JkMzAtOWMyMS00OWEwLTg1YWMtNmE3ZmU1NWQ0NTBhIiwidCI6Ijg1NDczOTk4LTFmODEtNDAxMS1iYzk3LTg3YWUwNGU2MTIwNCJ9", "202af8acd6bb3c058872"),
     "subabas": ["sim_sinasc"]},

    # ── Mesmo perfil Tableau da FVS, fora da página /dadossaude ───────────────
    {"id": "fvs-aesop", "ver_painel": None, "grupo": "Outros painéis públicos da FVS (Tableau)",
     "titulo": "AESOP — Alerta precoce de síndromes respiratórias",
     "descricao": "Avisos por município e semana epidemiológica (CIEVS/FVS)",
     "plataforma": "tableau", "workbook": "Painel_AESOP", "integracao": "extracao", "coletor": "aesop",
     "embed": _tableau("Painel_AESOP", "Histria1"), "subabas": ["monitor", "painel"]},
    {"id": "fvs-vacinometro", "ver_painel": None, "grupo": "Outros painéis públicos da FVS (Tableau)",
     "titulo": "Vacinômetro AM", "descricao": "Doses de vacina COVID-19 aplicadas por município",
     "plataforma": "tableau", "workbook": "Vacinometro_AM_2", "integracao": "extracao", "coletor": "vacinometro",
     "embed": _tableau("Vacinometro_AM_2", "Vacinmetro"), "subabas": ["vacinas"]},
    {"id": "fvs-covid", "ver_painel": None, "grupo": "Outros painéis públicos da FVS (Tableau)",
     "titulo": "Painel COVID-19 Resumo", "descricao": "Resumo da COVID-19 no Amazonas",
     "plataforma": "tableau", "workbook": "PainelCOVID-19Resumo", "integracao": "incorporado",
     "embed": _tableau("PainelCOVID-19Resumo", "PainelCOVID-19Resumo"), "subabas": ["monitor"]},
    {"id": "fvs-inundacao", "ver_painel": None, "grupo": "Outros painéis públicos da FVS (Tableau)",
     "titulo": "Informe Inundação AM 2025", "descricao": "Situação dos municípios afetados pela cheia de 2025",
     "plataforma": "tableau", "workbook": "Inundao_AM_2025", "integracao": "incorporado",
     "embed": _tableau("Inundao_AM_2025", "InformeINUNDAOp1"), "subabas": ["painel"]},
]

# Coletores automáticos (um por pasta de trabalho Tableau com download liberado e sem dado pessoal)
COLETORES = {
    "pqa_vs": {"workbook": "PQA-VS-Indicadores", "titulo": "Indicadores do PQA-VS", "periodicidade": "diária (verifica publicação)"},
    "sinan": {"workbook": "monitoramentosinan", "titulo": "Doenças e agravos de notificação (SINAN)", "periodicidade": "diária (verifica publicação)"},
    "malaria": {"workbook": "Painel_Malria", "titulo": "Malária (SIVEP-Malária)", "periodicidade": "diária (verifica publicação)"},
    "aesop": {"workbook": "Painel_AESOP", "titulo": "AESOP — síndromes respiratórias", "periodicidade": "diária (verifica publicação)"},
    "vacinometro": {"workbook": "Vacinometro_AM_2", "titulo": "Vacinômetro COVID-19", "periodicidade": "diária (verifica publicação)"},
}

# Agravos da base de monitoramento SINAN da FVS → subabas do ERSUS360 (nomes exatamente como na base)
AGRAVOS_POR_SUBABA = {
    "arboviroses": ["Dengue", "Chikungunya", "Zika", "Febre Amarela"],
    "malaria": ["Malária"],
    "zoonoses": ["Atend. Antirrábico Humano", "Raiva humana", "Leptospirose", "Leishmaniose Tegumentar",
                       "Acid. por animais peçonhentos", "Doença de Chagas"],
    "tb_hanseniase": ["Tuberculose", "Hanseníase"],
    "ist_hiv": ["Aids", "Sífilis Congênita em <1 ano", "Hepatite A", "Hepatite B", "Hepatite C", "Hepatite B+D",
                 "Hepatite B e C", "Outras hepatites virais"],
    "monitor": ["Sarampo", "Coqueluche", "Doença meningocócica",
                                "Outras meningites (exceto D. Meningocócica)", "Febre Tifóide", "Tétano Acidental",
                                "Tétano Neonatal"],
    "epidemiologia": None,  # todos
}

# PQA-VS: indicador → subaba (numeração do próprio painel da FVS)
PQA_POR_SUBABA = {
    "sim_sinasc": ["01", "02"], "vacinas": ["03", "04"], "vigiagua": ["05"],
    "epidemiologia": ["06", "13", "14"], "malaria": ["07"], "vetores": ["08"],
    "tb_hanseniase": ["09", "10"], "ist_hiv": ["11", "12"],
}


def paineis_da_subaba(subaba: str) -> list[dict]:
    return [p for p in PAINEIS if subaba in p["subabas"]]


def painel_do_coletor(coletor: str) -> dict | None:
    return next((p for p in PAINEIS if p.get("coletor") == coletor), None)
