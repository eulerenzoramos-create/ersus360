"""
Base normativa do Agente de Análise das Portarias do FNS.

Só entra aqui dispositivo conferido no texto oficial. Cada dispositivo tem um trecho de conferência
(palavras do texto oficial) que a rotina de vigência procura de novo na página oficial — se o trecho
sumir, a classificação que usa o dispositivo passa a "pendente de confirmação".

Conferência manual feita em 16/11/2026:
  • Portaria de Consolidação GM/MS nº 6/2017 — texto compilado do Saúde Legis (cita a PRT GM/MS 12.151/2026)
  • LC 141/2012 e LC 172/2020 — texto compilado do Planalto

Atenção registrada na conferência: a vedação antiga "obras de construções novas, EXCETO reformas e adequações"
(redação de 2011) NÃO vale mais para o Bloco de Manutenção. O texto atual (PRT 828/2020) veda obras novas e
ampliações e não menciona reformas.
"""
from __future__ import annotations

import unicodedata

# ── Normas ──────────────────────────────────────────────────────────────────────
NORMAS: dict[str, dict] = {
    "PRC6": {
        "nome": "Portaria de Consolidação GM/MS nº 6/2017",
        "ementa": "Consolida as normas sobre o financiamento e a transferência dos recursos federais para as ações "
                  "e os serviços de saúde do SUS (blocos de financiamento).",
        "url": "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2017/prc0006_03_10_2017.html",
        "fonte": "Saúde Legis (Ministério da Saúde)",
    },
    "LC141": {
        "nome": "Lei Complementar nº 141/2012",
        "ementa": "Valores mínimos em ações e serviços públicos de saúde (ASPS), critérios de rateio, fiscalização, "
                  "avaliação e controle.",
        "url": "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp141.htm",
        "fonte": "Planalto",
    },
    "L8080": {
        "nome": "Lei nº 8.080/1990",
        "ementa": "Lei Orgânica da Saúde — condições para promoção, proteção e recuperação da saúde.",
        "url": "https://www.planalto.gov.br/ccivil_03/leis/l8080.htm",
        "fonte": "Planalto",
    },
    "LC172": {
        "nome": "Lei Complementar nº 172/2020",
        "ementa": "Transposição e transferência de saldos financeiros remanescentes de exercícios anteriores nos "
                  "fundos de saúde.",
        "url": "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp172.htm",
        "fonte": "Planalto",
    },
}

# ── Dispositivos conferidos ─────────────────────────────────────────────────────
# chave → norma, dispositivo, resumo, redação, trecho de conferência (procurado no texto oficial)
DISPOSITIVOS: dict[str, dict] = {
    "PRC6_3_I_II": {
        "norma": "PRC6", "dispositivo": "art. 3º, I e II",
        "resumo": "Os recursos federais são transferidos em dois blocos: Manutenção das ASPS e Estruturação da "
                  "Rede de Serviços Públicos de Saúde.",
        "redacao": "PRT GM/MS 828/2020",
        "conferencia": "Bloco de Estruturação da Rede de Serviços Públicos de Saúde",
    },
    "PRC6_3_P1": {
        "norma": "PRC6", "dispositivo": "art. 3º, § 1º",
        "resumo": "Repasse fundo a fundo, em conta corrente específica e única para cada bloco.",
        "redacao": "PRT GM/MS 3.992/2017",
        "conferencia": "conta corrente específica e única para cada Bloco",
    },
    "PRC6_3_P2_I": {
        "norma": "PRC6", "dispositivo": "art. 3º, § 2º, I",
        "resumo": "Os recursos ficam vinculados, ao final do exercício, à finalidade definida em cada Programa de "
                  "Trabalho do Orçamento Geral da União.",
        "redacao": "PRT GM/MS 3.992/2017",
        "conferencia": "finalidade definida em cada Programa de Trabalho",
    },
    "PRC6_3_P3": {
        "norma": "PRC6", "dispositivo": "art. 3º, § 3º",
        "resumo": "A vinculação à finalidade vale até a aplicação integral dos recursos — o saldo continua "
                  "vinculado à mesma finalidade.",
        "redacao": "PRT GM/MS 3.992/2017",
        "conferencia": "até a aplicação integral dos recursos",
    },
    "PRC6_3_P5_I": {
        "norma": "PRC6", "dispositivo": "art. 3º, § 5º, I",
        "resumo": "A comprovação da aplicação se faz no Relatório Anual de Gestão (RAG), apreciado pelo Conselho "
                  "de Saúde.",
        "redacao": "PRT GM/MS 1.063/2023",
        "conferencia": "Relatório Anual de Gestão",
    },
    "PRC6_5_CAPUT": {
        "norma": "PRC6", "dispositivo": "art. 5º, caput, I e II",
        "resumo": "Bloco de Manutenção: manutenção da oferta e continuidade das ações e serviços e funcionamento "
                  "dos órgãos e estabelecimentos de saúde.",
        "redacao": "PRT GM/MS 1.063/2023",
        "conferencia": "funcionamento dos órgãos e estabelecimentos responsáveis",
    },
    "PRC6_5_P1_I": {
        "norma": "PRC6", "dispositivo": "art. 5º, § 1º, I",
        "resumo": "Vedado, no Bloco de Manutenção, pagar servidores inativos.",
        "redacao": "PRT GM/MS 3.992/2017",
        "conferencia": "servidores inativos",
    },
    "PRC6_5_P1_II": {
        "norma": "PRC6", "dispositivo": "art. 5º, § 1º, II",
        "resumo": "Vedado pagar servidores ativos, exceto os contratados exclusivamente para funções ligadas aos "
                  "serviços previstos no Plano de Saúde.",
        "redacao": "PRT GM/MS 3.992/2017",
        "conferencia": "contratados exclusivamente para desempenhar funções relacionadas aos serviços previstos",
    },
    "PRC6_5_P1_III": {
        "norma": "PRC6", "dispositivo": "art. 5º, § 1º, III",
        "resumo": "Vedada gratificação de função de cargo comissionado, exceto os diretamente ligados aos serviços "
                  "do Plano de Saúde.",
        "redacao": "PRT GM/MS 3.992/2017",
        "conferencia": "gratificação de função de cargos comissionados",
    },
    "PRC6_5_P1_IV": {
        "norma": "PRC6", "dispositivo": "art. 5º, § 1º, IV",
        "resumo": "Vedado pagar assessoria ou consultoria prestada por servidor do quadro do próprio Município ou "
                  "do Estado.",
        "redacao": "PRT GM/MS 3.992/2017",
        "conferencia": "assessorias ou consultorias prestadas por servidores públicos",
    },
    "PRC6_5_P1_V": {
        "norma": "PRC6", "dispositivo": "art. 5º, § 1º, V",
        "resumo": "Vedadas, no Bloco de Manutenção, obras de construção nova e ampliação de imóveis, ainda que "
                  "usados em ações e serviços de saúde.",
        "redacao": "PRT GM/MS 828/2020",
        "conferencia": "obras de construções novas bem como de ampliações de imóveis já existentes",
    },
    "PRC6_5_P2": {
        "norma": "PRC6", "dispositivo": "art. 5º, § 2º",
        "resumo": "A assistência financeira complementar dos pisos salariais é repassada em conta segregada.",
        "redacao": "PRT GM/MS 1.063/2023",
        "conferencia": "pisos salariais",
    },
    "PRC6_6_CAPUT": {
        "norma": "PRC6", "dispositivo": "art. 6º, caput",
        "resumo": "Os recursos do Bloco de Estruturação destinam-se EXCLUSIVAMENTE ao que os incisos listam.",
        "redacao": "PRT GM/MS 828/2020",
        "conferencia": "destinar-se-ão, exclusivamente",
    },
    "PRC6_6_I": {
        "norma": "PRC6", "dispositivo": "art. 6º, I",
        "resumo": "Estruturação: aquisição de equipamentos voltados a ações e serviços públicos de saúde.",
        "redacao": "PRT GM/MS 3.992/2017",
        "conferencia": "aquisição de equipamentos voltados para a realização de ações e serviços públicos de saúde",
    },
    "PRC6_6_II": {
        "norma": "PRC6", "dispositivo": "art. 6º, II",
        "resumo": "Estruturação: obras de construção nova ou ampliação de imóveis usados em ações e serviços de saúde.",
        "redacao": "PRT GM/MS 828/2020",
        "conferencia": "obras de construções novas ou ampliação de imóveis existentes",
    },
    "PRC6_6_III": {
        "norma": "PRC6", "dispositivo": "art. 6º, III",
        "resumo": "Estruturação: obras de reforma de imóveis já existentes usados em ações e serviços de saúde.",
        "redacao": "PRT GM/MS 828/2020",
        "conferencia": "obras de reforma de imóveis já existentes",
    },
    "PRC6_6_PU": {
        "norma": "PRC6", "dispositivo": "art. 6º, parágrafo único",
        "resumo": "Vedado usar o Bloco de Estruturação em órgãos e unidades voltados exclusivamente a atividades "
                  "administrativas.",
        "redacao": "PRT GM/MS 828/2020",
        "conferencia": "exclusivamente, à realização de atividades administrativas",
    },
    "LC141_2": {
        "norma": "LC141", "dispositivo": "art. 2º",
        "resumo": "São ASPS as despesas voltadas à promoção, proteção e recuperação da saúde, de acesso universal, "
                  "conforme os Planos de Saúde.",
        "redacao": "original",
        "conferencia": "promoção, proteção e recuperação da saúde",
    },
    "LC141_3": {
        "norma": "LC141", "dispositivo": "art. 3º (I a XII)",
        "resumo": "Lista o que é ASPS: vigilância, atenção integral, capacitação, insumos (V), investimento na rede "
                  "física (IX), remuneração de pessoal ativo da saúde (X), gestão e operação de unidades (XII), entre outros.",
        "redacao": "original, com incisos XIII (LC 209/2024) e XIV (LC 234/2026)",
        "conferencia": "investimento na rede física do SUS",
    },
    "LC141_4": {
        "norma": "LC141", "dispositivo": "art. 4º",
        "resumo": "Não é ASPS: aposentadorias e pensões (I), pessoal da saúde em atividade alheia (II), obras de "
                  "infraestrutura ainda que beneficiem a rede de saúde (IX), entre outros.",
        "redacao": "original, com incisos XI e XII acrescidos (LC 209/2024 e LC 234/2026)",
        "conferencia": "obras de infraestrutura, ainda que realizadas para beneficiar direta ou indiretamente a rede de saúde",
    },
    "LC141_13_P2": {
        "norma": "LC141", "dispositivo": "art. 13, § 2º e § 4º",
        "resumo": "Os recursos são movimentados até a destinação final em contas específicas, só por ordem bancária, "
                  "transferência eletrônica ou cheque nominativo.",
        "redacao": "original",
        "conferencia": "contas específicas mantidas em instituição financeira oficial federal",
    },
    "LC141_36": {
        "norma": "LC141", "dispositivo": "art. 36, caput e § 1º",
        "resumo": "Relatório detalhado do quadrimestre (RDQA) e Relatório de Gestão enviado ao Conselho até 30 de março "
                  "do ano seguinte.",
        "redacao": "original",
        "conferencia": "até o dia 30 de março do ano seguinte ao da execução financeira",
    },
    "L8080_36": {
        "norma": "L8080", "dispositivo": "art. 36, caput e § 1º",
        "resumo": "O planejamento e o orçamento do SUS são ascendentes e os planos de saúde são a base das atividades "
                  "e da programação de cada nível.",
        "redacao": "original",
        "conferencia": "planos de saúde serão a base das atividades e programações",
    },
    "LC172_2": {
        "norma": "LC172", "dispositivo": "art. 2º, I a III",
        "resumo": "Saldo transposto só pode ir para ASPS, cumprindo os compromissos do ato original, com inclusão na "
                  "PAS e na LOA e ciência ao Conselho de Saúde.",
        "redacao": "original",
        "conferencia": "ciência ao respectivo Conselho de Saúde",
    },
    "LC172_5": {
        "norma": "LC172", "dispositivo": "art. 5º",
        "resumo": "Prazo da autorização de transposição de saldos: na redação da LC 217/2025, até o fim do exercício "
                  "de 2025.",
        "redacao": "LC 217/2025",
        "conferencia": "exercício financeiro de 2025",
        # Se o Planalto publicar novo prazo, o trecho deixa de bater e a rotina avisa.
        "prazo_ate": "2025-12-31",
    },
}

# ── 12 categorias de despesa ────────────────────────────────────────────────────
CATEGORIAS: list[tuple[str, str]] = [
    ("pessoal", "Pagamento de profissionais e encargos"),
    ("medicamentos", "Medicamentos e insumos"),
    ("consumo", "Material de consumo"),
    ("combustivel", "Combustível e transporte sanitário"),
    ("terceiros", "Serviços de terceiros"),
    ("manut_unidades", "Manutenção de unidades de saúde"),
    ("manut_equip", "Manutenção de equipamentos"),
    ("equipamentos", "Aquisição de equipamentos e materiais permanentes"),
    ("veiculos", "Aquisição de veículos"),
    ("reformas", "Reformas e adequações"),
    ("obras", "Ampliação e construção de unidades"),
    ("outras", "Outras despesas relacionadas à finalidade do financiamento"),
]

PERMITIDO = "PERMITIDO"
COM_CONDICOES = "PERMITIDO COM CONDIÇÕES"
VEDADO = "VEDADO"
ANALISE = "EXIGE ANÁLISE COMPLEMENTAR"

# (status, justificativa, dispositivos)
_CUSTEIO: dict[str, tuple[str, str, list[str]]] = {
    "pessoal": (COM_CONDICOES,
                "Só servidores ativos contratados exclusivamente para funções ligadas aos serviços do Plano de Saúde. "
                "Vedado pagar inativos, pensionistas e gratificação de comissionado sem ligação com esses serviços.",
                ["PRC6_5_P1_I", "PRC6_5_P1_II", "PRC6_5_P1_III", "LC141_3", "LC141_4"]),
    "medicamentos": (PERMITIDO,
                     "Insumos e medicamentos para as ações e serviços do bloco, dentro da finalidade do programa.",
                     ["PRC6_5_CAPUT", "LC141_3", "PRC6_3_P2_I"]),
    "consumo": (PERMITIDO,
                "Material de consumo para o funcionamento dos estabelecimentos e serviços de saúde.",
                ["PRC6_5_CAPUT", "PRC6_3_P2_I"]),
    "combustivel": (COM_CONDICOES,
                    "Combustível e transporte só quando ligados às ações e serviços de saúde (transporte sanitário, "
                    "visitas, deslocamento de equipes), com controle de uso.",
                    ["PRC6_5_CAPUT", "LC141_3", "PRC6_3_P2_I"]),
    "terceiros": (COM_CONDICOES,
                  "Serviços ligados ao funcionamento das ações de saúde. Vedada assessoria ou consultoria prestada por "
                  "servidor do quadro do próprio Município ou do Estado.",
                  ["PRC6_5_CAPUT", "PRC6_5_P1_IV"]),
    "manut_unidades": (PERMITIDO,
                       "Manutenção e funcionamento dos estabelecimentos de saúde.",
                       ["PRC6_5_CAPUT"]),
    "manut_equip": (PERMITIDO,
                    "Manutenção dos equipamentos usados nas ações e serviços de saúde (continuidade da oferta).",
                    ["PRC6_5_CAPUT"]),
    "equipamentos": (ANALISE,
                     "Aquisição de equipamentos é finalidade expressa do Bloco de Estruturação. Com recurso de custeio, "
                     "depende do grupo de natureza de despesa autorizado no programa de trabalho — confirmar com a "
                     "contabilidade e a portaria antes de empenhar.",
                     ["PRC6_6_I", "PRC6_3_P2_I"]),
    "veiculos": (ANALISE,
                 "Veículo é bem permanente (despesa de capital). A aquisição é finalidade do Bloco de Estruturação; com "
                 "custeio, só se o programa de trabalho autorizar — confirmar antes de empenhar.",
                 ["PRC6_6_I", "PRC6_3_P2_I"]),
    "reformas": (COM_CONDICOES,
                 "O texto atual veda obra nova e ampliação no custeio, mas não menciona reforma. Só reforma de imóvel já "
                 "usado em serviço de saúde, sem aumento de área, com classificação contábil de despesa corrente "
                 "confirmada pela contabilidade.",
                 ["PRC6_5_P1_V", "PRC6_5_CAPUT"]),
    "obras": (VEDADO,
              "Bloco de Manutenção não paga construção nova nem ampliação, ainda que o imóvel seja usado em saúde.",
              ["PRC6_5_P1_V"]),
    "outras": (COM_CONDICOES,
               "Outras despesas só se forem ASPS e estiverem na finalidade do programa de trabalho. Não podem ser "
               "despesas fora de ASPS (aposentadorias, obras de infraestrutura etc.).",
               ["LC141_2", "LC141_3", "LC141_4", "PRC6_3_P2_I"]),
}

_INVESTIMENTO: dict[str, tuple[str, str, list[str]]] = {
    "pessoal": (VEDADO, "O Bloco de Estruturação é exclusivo para equipamentos e obras; não paga pessoal.",
                ["PRC6_6_CAPUT"]),
    "medicamentos": (VEDADO, "Fora das finalidades exclusivas do Bloco de Estruturação.", ["PRC6_6_CAPUT"]),
    "consumo": (VEDADO, "Fora das finalidades exclusivas do Bloco de Estruturação.", ["PRC6_6_CAPUT"]),
    "combustivel": (VEDADO, "Fora das finalidades exclusivas do Bloco de Estruturação.", ["PRC6_6_CAPUT"]),
    "terceiros": (ANALISE,
                  "Só serviços que integram o próprio objeto (ex.: execução da obra, instalação do equipamento). "
                  "Conferir o objeto aprovado na proposta.",
                  ["PRC6_6_CAPUT", "PRC6_6_II", "PRC6_6_III"]),
    "manut_unidades": (VEDADO, "Manutenção é custeio; o Bloco de Estruturação não a cobre.", ["PRC6_6_CAPUT"]),
    "manut_equip": (VEDADO, "Manutenção é custeio; o Bloco de Estruturação não a cobre.", ["PRC6_6_CAPUT"]),
    "equipamentos": (COM_CONDICOES,
                     "Equipamentos para ações e serviços de saúde, conforme o objeto aprovado (proposta/portaria). "
                     "Vedado em unidade exclusivamente administrativa.",
                     ["PRC6_6_I", "PRC6_6_PU"]),
    "veiculos": (COM_CONDICOES,
                 "Só se o veículo estiver no objeto aprovado da proposta/portaria, para uso nas ações de saúde.",
                 ["PRC6_6_I", "PRC6_6_PU"]),
    "reformas": (COM_CONDICOES,
                 "Reforma de imóvel já usado em ações e serviços de saúde, conforme o objeto aprovado.",
                 ["PRC6_6_III", "PRC6_6_PU"]),
    "obras": (COM_CONDICOES,
              "Construção ou ampliação de imóvel usado em ações e serviços de saúde, conforme o objeto aprovado. "
              "Obras de infraestrutura geral não são ASPS.",
              ["PRC6_6_II", "PRC6_6_PU", "LC141_4"]),
    "outras": (ANALISE, "Só o que integra o objeto aprovado; o bloco é exclusivo.", ["PRC6_6_CAPUT"]),
}


def normalizar(txt: str | None) -> str:
    s = unicodedata.normalize("NFKD", txt or "")
    return " ".join("".join(c for c in s if not unicodedata.combining(c)).upper().split())


def matriz_base(natureza: str) -> dict[str, tuple[str, str, list[str]]] | None:
    return {"CUSTEIO": _CUSTEIO, "INVESTIMENTO": _INVESTIMENTO}.get(natureza)


def citar(chave: str) -> dict:
    d = DISPOSITIVOS[chave]
    n = NORMAS[d["norma"]]
    return {"chave": chave, "norma": n["nome"], "dispositivo": d["dispositivo"], "resumo": d["resumo"],
            "redacao": d["redacao"], "url": n["url"]}
