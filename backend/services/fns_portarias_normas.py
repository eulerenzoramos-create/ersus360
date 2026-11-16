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


# ═══════════════════════════════════════════════════════════════════════════════
# NORMAS DE ORIGEM E REGULAMENTAÇÃO POR PROGRAMA (conferidas em 16/11/2026)
# A portaria de repasse autoriza a transferência; as regras de APLICAÇÃO estão nas normas abaixo.
# Texto conferido no Saúde Legis (PRC 5, PRC 6, Portaria GM/MS 4.986/2024) e no Planalto (Lei 11.350/2006).
# Programa sem norma conferida aqui fica "ANÁLISE PENDENTE" — nunca se presume a regra.
# ═══════════════════════════════════════════════════════════════════════════════

NORMAS.update({
    "PRC5": {
        "nome": "Portaria de Consolidação GM/MS nº 5/2017",
        "ementa": "Consolida as normas sobre as ações e os serviços de saúde do SUS (inclui o Qualifar-SUS).",
        "url": "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2017/prc0005_03_10_2017.html",
        "fonte": "Saúde Legis (Ministério da Saúde)",
    },
    "P4986_2024": {
        "nome": "Portaria GM/MS nº 4.986/2024",
        "ementa": "Transferência dos recursos do Eixo Estrutura do Qualifar-SUS aos municípios com IDHM baixo, "
                  "médio e alto.",
        "url": "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2024/prt4986_08_08_2024.html",
        "fonte": "Saúde Legis (Ministério da Saúde)",
    },
    "L11350": {
        "nome": "Lei nº 11.350/2006",
        "ementa": "Regulamenta as atividades de Agente Comunitário de Saúde e de Agente de Combate às Endemias.",
        "url": "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11350.htm",
        "fonte": "Planalto",
    },
})


def _d(norma, dispositivo, resumo, redacao, conferencia):
    return {"norma": norma, "dispositivo": dispositivo, "resumo": resumo, "redacao": redacao,
            "conferencia": conferencia}


DISPOSITIVOS.update({
    # ── Atenção Primária (PRC 6, Título II, Cap. I — redação da PRT GM/MS 3.493/2024) ───────────
    "PRC6_9D": _d("PRC6", "art. 9º-D, I a III",
                  "A transferência do componente fixo depende do credenciamento e do cadastro no SCNES das eSF, eAP, "
                  "eSB e eMulti e da ausência de irregularidades que motivem suspensão.",
                  "PRT GM/MS 3.493/2024", "credenciamento das eSF, eAP, eSB e eMulti pelo Ministério da Saúde"),
    "PRC6_12H": _d("PRC6", "art. 12-H",
                   "O componente de programas, serviços e equipes da APS custeia eMulti, eCR, UBSF, eSFR, eAPP, PSE, "
                   "atividade física, microscopistas, Estratégia ACS e outros programas instituídos em ato específico.",
                   "PRT GM/MS 3.493/2024", "outras composições de equipe que atuam na APS contemplará o custeio"),
    "PRC6_12J": _d("PRC6", "art. 12-J",
                   "O componente de Atenção à Saúde Bucal custeia eSB, UOM, CEO, LRPD e Sesb.",
                   "PRT GM/MS 3.493/2024", "O componente para Atenção à Saúde Bucal contemplará o custeio"),
    "PRC6_12P": _d("PRC6", "art. 12-P, caput",
                   "O componente per capita de base populacional apoia o custeio das ações da APS.",
                   "PRT GM/MS 3.493/2024", "para apoiar o custeio das ações da APS"),
    "PRC6_12R": _d("PRC6", "art. 12-R e parágrafo único",
                   "Os recursos dos componentes do Piso da APS devem ser aplicados, de forma autônoma, em ações e "
                   "serviços da APS, conforme a LC 141/2012; a prestação de contas é feita no RAG.",
                   "PRT GM/MS 3.493/2024", "devem ser aplicados, de forma autônoma, em ações e serviços da APS"),
    "PRC6_85C": _d("PRC6", "art. 85-C",
                   "O financiamento federal da eMulti tem incentivo de implantação, componente de manutenção, "
                   "componente de qualidade e incentivos adicionais (TDIC e Padi).",
                   "PRT GM/MS 9.584/2025", "O financiamento federal referente à eMulti, será constituído por"),
    # ── ACS / ACE ─────────────────────────────────────────────────────────────────────────────
    "L11350_9C": _d("L11350", "art. 9º-C, caput e § 3º",
                    "A União presta assistência financeira complementar (AFC) para o cumprimento do piso salarial dos "
                    "agentes, fixada em 95% do piso.",
                    "Lei 12.994/2014", "compete à União prestar assistência financeira complementar"),
    "L11350_9D": _d("L11350", "art. 9º-D, caput",
                    "Incentivo financeiro para fortalecimento de políticas afetas à atuação de ACS e ACE.",
                    "Lei 12.994/2014", "incentivo financeiro para fortalecimento de políticas afetas à atuação de agentes"),
    "L11350_9E": _d("L11350", "art. 9º-E",
                    "Os recursos dos arts. 9º-C e 9º-D são transferências correntes, regulares, automáticas e "
                    "obrigatórias aos fundos de saúde.",
                    "Lei 13.595/2018", "como transferências correntes, regulares, automáticas e obrigatórias"),
    "PRC6_36": _d("PRC6", "art. 36",
                  "A AFC dos ACS corresponde a 95% do piso salarial nacional vigente; 12 parcelas mais 1 adicional.",
                  "PRT MS/GM 1.024/2015 (origem)", "do piso salarial nacional vigente do ACS"),
    "PRC6_40": _d("PRC6", "art. 40, caput e § 1º",
                  "Incentivo de fortalecimento de políticas afetas à atuação de ACS: 5% do piso por ACS com vínculo "
                  "regularmente formalizado.",
                  "PRT MS/GM 1.024/2015 (origem)", "fortalecimento de políticas afetas à atuação de ACS, instituído"),
    "PRC6_426": _d("PRC6", "art. 426",
                   "A AFC dos ACE corresponde a 95% do piso salarial nacional vigente; 12 parcelas mais 1 adicional.",
                   "PRT MS/GM 1.243/2015 (origem)", "do piso salarial nacional vigente do ACE"),
    "PRC6_429": _d("PRC6", "art. 429, caput e § 1º",
                   "Incentivo de fortalecimento de políticas afetas à atuação de ACE: 5% do piso por ACE com vínculo "
                   "regularmente formalizado.",
                   "PRT MS/GM 1.243/2015 (origem)", "fortalecimento de políticas afetas à atuação de ACE, instituído"),
    # ── Vigilância em Saúde e Vigilância Sanitária ────────────────────────────────────────────
    "PRC6_431": _d("PRC6", "art. 431",
                   "Os recursos de Vigilância em Saúde estão no Bloco de Manutenção: Componente de Vigilância em "
                   "Saúde e Componente da Vigilância Sanitária.",
                   "PRT GM/MS 3.192/2021", "Vigilância em Saúde estão organizados no Bloco de Manutenção"),
    "PRC6_433": _d("PRC6", "art. 433, caput e § 1º",
                   "O Componente de Vigilância em Saúde destina-se a ações de vigilância, de prevenção e controle de "
                   "doenças e agravos e dos seus fatores de risco, e de promoção.",
                   "PRT MS/GM 1.378/2013 (origem)", "prevenção e controle de doenças e agravos e dos seus fatores de risco"),
    "PRC6_443": _d("PRC6", "art. 443, I",
                   "Piso Fixo de Vigilância Sanitária: descentralização, execução das ações de vigilância sanitária e "
                   "qualificação das análises laboratoriais de interesse da VISA.",
                   "PRT GM/MS 3.192/2021", "a execução das ações de vigilância sanitária e a qualificação das análises"),
    "PRC6_465": _d("PRC6", "art. 465",
                   "A manutenção do repasse da VISA depende da regularidade do cadastro do serviço de vigilância "
                   "sanitária no SCNES.",
                   "PRT GM/MS 3.192/2021", "regularidade do cadastro do serviço de vigilância sanitária"),
    "PRC6_468": _d("PRC6", "art. 468",
                   "Os demonstrativos das ações, resultados e aplicação dos recursos da VISA compõem o RAG.",
                   "PRT MS/GM 475/2014 (origem)",
                   "resultados alcançados e da aplicação dos recursos comporão o Relatório Anual de Gestão"),
    # ── Média e Alta Complexidade ─────────────────────────────────────────────────────────────
    "PRC6_174": _d("PRC6", "art. 174",
                   "O Limite Financeiro da MAC destina-se ao financiamento de ações de média e alta complexidade em "
                   "saúde e de incentivos transferidos mensalmente.",
                   "PRT MS/GM 204/2007 (origem)", "financiamento de ações de média e alta complexidade em saúde"),
    # ── Assistência Farmacêutica — CBAF ───────────────────────────────────────────────────────
    "PRC6_537": _d("PRC6", "art. 537, I",
                   "O recurso federal do Componente Básico da Assistência Farmacêutica financia a aquisição dos "
                   "medicamentos e insumos dos Anexos I e IV da RENAME vigente.",
                   "PRT GM/MS 6.942/2025 (valores)", "constantes dos Anexos I e IV da RENAME vigente no SUS"),
    "PRC6_538": _d("PRC6", "art. 538",
                   "Até 15% das contrapartidas estadual e municipal podem ir para adequação de farmácias, equipamentos "
                   "e educação continuada, sendo VEDADA a utilização dos recursos federais para esta finalidade.",
                   "PRT MS/GM 1.555/2013 (origem)", "sendo vedada a utilização dos recursos federais para esta finalidade"),
    # ── Qualifar-SUS ──────────────────────────────────────────────────────────────────────────
    "PRC5_577": _d("PRC5", "arts. 574 a 578",
                   "Institui o Qualifar-SUS, organizado em 4 eixos; a operacionalização dos eixos é regulada em atos "
                   "específicos pactuados na CIT.",
                   "PRT MS/GM 1.214/2012 (origem)",
                   "A operacionalização dos eixos do QUALIFAR-SUS de que trata esta Seção será regulada em atos específicos"),
    "P4986_2": _d("P4986_2024", "art. 2º, II",
                  "Os recursos do Bloco de Manutenção do Eixo Estrutura devem ser usados em serviços e outras despesas "
                  "de custeio relacionados aos objetivos do Eixo Estrutura do Qualifar-SUS.",
                  "original", "serviços e outras despesas de custeio relacionados aos objetivos do Eixo Estrutura"),
    "P4986_2_I": _d("P4986_2024", "art. 2º, I",
                    "Os recursos do Bloco de Estruturação do Eixo Estrutura são para mobiliário e equipamentos das "
                    "Centrais de Abastecimento Farmacêutico e Farmácias da Atenção Básica.",
                    "original", "aquisição de mobiliários e equipamentos necessários à estruturação das Centrais"),
    "P4986_2_PU": _d("P4986_2024", "art. 2º, parágrafo único",
                     "É vedada a utilização dos recursos do Eixo Estrutura para aquisição de medicamentos e insumos.",
                     "original", "para aquisição de medicamentos e insumos"),
    "P4986_9": _d("P4986_2024", "art. 9º, § 1º e § 2º",
                  "Incentivo de manutenção de R$ 24.000,00/ano por município habilitado; nos anos seguintes à "
                  "habilitação, 4 parcelas trimestrais, condicionadas ao uso do Hórus ou ao envio dos dados ao BNAFAR "
                  "até o dia 15; o descumprimento suspende a parcela do trimestre.",
                  "original", "R$ 24.000,00 (vinte e quatro mil reais) para cada município habilitado"),
    # ── Investimentos (Estruturação) ──────────────────────────────────────────────────────────
    "PRC6_647": _d("PRC6", "art. 647",
                   "Recursos de investimento são transferidos exclusivamente para despesas de capital, mediante "
                   "projeto apresentado ao Ministério da Saúde.",
                   "PRT MS/GM 204/2007 (origem)", "exclusivamente para a realização de despesas de capital"),
    "PRC6_651": _d("PRC6", "art. 651",
                   "Cada projeto aprovado é formalizado em portaria específica que define valor, período de execução e "
                   "cronograma de desembolso.",
                   "PRT MS/GM 204/2007 (origem)", "o valor, o período de execução e o cronograma de desembolso"),
    "PRC6_652": _d("PRC6", "art. 652",
                   "Informações do projeto e da execução dos investimentos devem compor o Relatório de Gestão.",
                   "PRT MS/GM 204/2007 (origem)",
                   "da execução do Bloco de Investimentos na Rede de Serviços de Saúde devem compor o Relatório de Gestão"),
})


def _todas(categorias, regra):
    return {c: regra for c in categorias}


# ── Programas: como reconhecer no FNS, normas de origem e regras específicas de aplicação ──────
# padroes: textos procurados em grupo + ação + ação detalhada do FNS (sem acento, maiúsculas)
# origem: [(dispositivo, papel)] — papel: institui | financiamento | aplicação | condição
# regras: categoria → (classificação, justificativa, [dispositivos]) — substituem a regra geral do bloco
# limite: frase que restringe TODAS as despesas permitidas do programa
# pendente: motivo quando a norma de regulamentação ainda não foi conferida
PROGRAMAS: list[dict] = [
    {
        "chave": "qualifar_estrutura", "nome": "Qualifar-SUS — Eixo Estrutura",
        "padroes": ["QUALIF"],
        "origem": [("PRC5_577", "institui"), ("P4986_2", "aplicação"), ("P4986_2_PU", "aplicação"),
                   ("P4986_2_I", "aplicação"), ("P4986_9", "condição")],
        "limite": "Somente em serviços e despesas de custeio ligados aos objetivos do Eixo Estrutura do Qualifar-SUS "
                  "(Portaria GM/MS 4.986/2024, art. 2º, II).",
        "regras": {
            "pessoal": (ANALISE, "A portaria do Eixo Estrutura fala em serviços e outras despesas de custeio ligados "
                        "ao eixo; pagamento de pessoal não está expresso — confirmar antes de empenhar.", ["P4986_2"]),
            "medicamentos": (VEDADO, "Vedada a aquisição de medicamentos e insumos com recursos do Eixo Estrutura.",
                             ["P4986_2_PU"]),
            "consumo": (COM_CONDICOES, "Material de consumo da farmácia ou da Central de Abastecimento "
                        "Farmacêutico, exceto medicamentos e insumos.", ["P4986_2", "P4986_2_PU"]),
            "combustivel": (ANALISE, "Só se ligado aos objetivos do Eixo Estrutura; justificar a relação.",
                            ["P4986_2"]),
            "terceiros": (COM_CONDICOES, "Serviços ligados ao eixo, por exemplo conectividade e suporte de "
                          "informática para uso do Hórus ou envio dos dados ao BNAFAR.", ["P4986_2", "P4986_9"]),
            "manut_unidades": (COM_CONDICOES, "Manutenção da farmácia ou da Central de Abastecimento Farmacêutico.",
                               ["P4986_2"]),
            "manut_equip": (COM_CONDICOES, "Manutenção de equipamentos e mobiliário da farmácia ou da CAF.",
                            ["P4986_2"]),
            "equipamentos": (VEDADO, "Equipamentos e mobiliário do Eixo Estrutura são pagos com o recurso de "
                             "Estruturação (art. 2º, I); o recurso de custeio vai para serviços e despesas de custeio.",
                             ["P4986_2_I", "P4986_2"]),
            "veiculos": (VEDADO, "Fora da finalidade do custeio do Eixo Estrutura.", ["P4986_2"]),
            "reformas": (ANALISE, "Reforma não está expressa na portaria do Eixo Estrutura; confirmar antes.",
                         ["P4986_2", "PRC6_5_P1_V"]),
            "obras": (VEDADO, "Obra nova e ampliação são vedadas no custeio.", ["PRC6_5_P1_V"]),
            "outras": (COM_CONDICOES, "Somente despesas de custeio ligadas aos objetivos do Eixo Estrutura.",
                       ["P4986_2"]),
        },
        "exemplos": ["Conectividade (internet) e suporte de informática para usar o Hórus ou enviar os dados ao BNAFAR",
                     "Manutenção de equipamentos e mobiliário da farmácia e da Central de Abastecimento Farmacêutico",
                     "Material de expediente e de consumo da farmácia (nunca medicamentos ou insumos)"],
        "condicoes": ["Manter o uso do Hórus ou o envio ao BNAFAR até o dia 15 do mês seguinte — sem isso a parcela "
                      "trimestral é suspensa (art. 9º, § 2º)",
                      "Registrar a aplicação no RAG"],
    },
    {
        "chave": "cbaf", "nome": "Componente Básico da Assistência Farmacêutica (CBAF)",
        "padroes": ["CBAF", "COMPONENTE BASICO DA ASSISTENCIA FARMACEUTICA"],
        "origem": [("PRC6_537", "financiamento"), ("PRC6_538", "aplicação")],
        "limite": "O recurso federal do CBAF só compra medicamentos e insumos dos Anexos I e IV da RENAME "
                  "(PRC 6/2017, art. 537, I).",
        "regras": {
            "medicamentos": (COM_CONDICOES, "Somente medicamentos e insumos dos Anexos I e IV da RENAME vigente.",
                             ["PRC6_537"]),
            **_todas(("pessoal", "consumo", "combustivel", "terceiros", "manut_unidades", "manut_equip",
                      "equipamentos", "veiculos", "reformas", "obras", "outras"),
                     (VEDADO, "O recurso federal do CBAF é exclusivo para medicamentos e insumos da RENAME; "
                              "estrutura, equipamentos e capacitação só com as contrapartidas estadual e municipal.",
                      ["PRC6_537", "PRC6_538"])),
        },
        "exemplos": ["Compra de medicamentos da RENAME (Anexo I) para as farmácias da Atenção Básica",
                     "Compra de insumos do Anexo IV da RENAME (ex.: insumos para insulinodependentes)"],
        "condicoes": ["Conferir se cada item está nos Anexos I ou IV da RENAME vigente",
                      "Aplicar também as contrapartidas estadual e municipal mínimas (art. 537, II e III)"],
    },
    {
        "chave": "acs_afc", "nome": "Assistência financeira complementar — Agentes Comunitários de Saúde",
        "padroes": ["AGENTES COMUNITARIOS DE SAUDE"],
        "origem": [("L11350_9C", "institui"), ("L11350_9D", "institui"), ("L11350_9E", "financiamento"),
                   ("PRC6_36", "financiamento"), ("PRC6_40", "financiamento")],
        "limite": "Recurso vinculado ao piso salarial dos ACS (95%) e ao incentivo de fortalecimento de políticas "
                  "afetas à atuação dos ACS (5%).",
        "regras": {
            "pessoal": (COM_CONDICOES, "Pagamento do piso salarial dos ACS com vínculo direto e cadastro regular no "
                        "SCNES.", ["L11350_9C", "PRC6_36"]),
            **_todas(("consumo", "combustivel", "terceiros", "outras"),
                     (ANALISE, "Só a parcela do incentivo de fortalecimento (5%) pode apoiar políticas afetas à "
                               "atuação dos ACS; o FNS não separa as parcelas no repasse — confirmar valores e "
                               "finalidade.", ["L11350_9D", "PRC6_40"])),
            **_todas(("equipamentos", "veiculos", "obras"),
                     (VEDADO, "Fora da finalidade da AFC e do incentivo dos ACS (transferências correntes).",
                      ["L11350_9C", "L11350_9E"])),
            **_todas(("medicamentos", "manut_unidades", "manut_equip", "reformas"),
                     (ANALISE, "Fora da finalidade principal (piso dos ACS); depende de vínculo com a atuação dos "
                               "ACS.", ["L11350_9D"])),
        },
        "exemplos": ["Folha de pagamento dos ACS (piso salarial) e encargos",
                     "Com a parcela de fortalecimento: ações ligadas à atuação dos ACS (ex.: material de trabalho de campo)"],
        "condicoes": ["ACS com vínculo direto e cadastro regular no SCNES",
                      "Respeitar o quantitativo máximo de ACS da PNAB"],
    },
    {
        "chave": "ace_afc", "nome": "Assistência financeira complementar — Agentes de Combate às Endemias",
        "padroes": ["AGENTES DE COMBATE AS ENDEMIAS"],
        "origem": [("L11350_9C", "institui"), ("L11350_9D", "institui"), ("L11350_9E", "financiamento"),
                   ("PRC6_426", "financiamento"), ("PRC6_429", "financiamento")],
        "limite": "Recurso vinculado ao piso salarial dos ACE (95%) e ao incentivo de fortalecimento de políticas "
                  "afetas à atuação dos ACE (5%).",
        "regras": {
            "pessoal": (COM_CONDICOES, "Pagamento do piso salarial dos ACE com vínculo direto e cadastro regular no "
                        "SCNES.", ["L11350_9C", "PRC6_426"]),
            **_todas(("consumo", "combustivel", "terceiros", "outras"),
                     (ANALISE, "Só a parcela do incentivo de fortalecimento (5%) pode apoiar políticas afetas à "
                               "atuação dos ACE; confirmar valores e finalidade.", ["L11350_9D", "PRC6_429"])),
            **_todas(("equipamentos", "veiculos", "obras"),
                     (VEDADO, "Fora da finalidade da AFC e do incentivo dos ACE (transferências correntes).",
                      ["L11350_9C", "L11350_9E"])),
            **_todas(("medicamentos", "manut_unidades", "manut_equip", "reformas"),
                     (ANALISE, "Fora da finalidade principal (piso dos ACE); depende de vínculo com a atuação dos "
                               "ACE.", ["L11350_9D"])),
        },
        "exemplos": ["Folha de pagamento dos ACE (piso salarial) e encargos",
                     "Com a parcela de fortalecimento: ações ligadas à atuação dos ACE (ex.: material de campo)"],
        "condicoes": ["ACE com vínculo direto e cadastro regular no SCNES"],
    },
    {
        "chave": "visa", "nome": "Vigilância Sanitária (Piso Fixo de VISA)",
        "padroes": ["VIGILANCIA SANITARIA"],
        "origem": [("PRC6_431", "financiamento"), ("PRC6_443", "aplicação"), ("PRC6_465", "condição"),
                   ("PRC6_468", "condição")],
        "limite": "Somente em ações de vigilância sanitária (PRC 6/2017, art. 443, I).",
        "regras": {},
        "exemplos": ["Inspeções sanitárias: deslocamento, combustível e diárias da equipe de VISA",
                     "Material de consumo e de coleta de amostras para análise laboratorial",
                     "Capacitação da equipe de vigilância sanitária"],
        "condicoes": ["Cadastro regular do serviço de VISA no SCNES (art. 465)",
                      "Demonstrativos das ações e da aplicação no RAG (art. 468)"],
    },
    {
        "chave": "vs_componente", "nome": "Componente de Vigilância em Saúde",
        "padroes": ["PARA A VIGILANCIA EM SAUDE", "VIGILANCIA EM SAUDE - DESPESAS DIVERSAS"],
        "origem": [("PRC6_431", "financiamento"), ("PRC6_433", "aplicação")],
        "limite": "Somente em ações de vigilância, prevenção e controle de doenças e agravos e de promoção "
                  "(PRC 6/2017, art. 433).",
        "regras": {},
        "exemplos": ["Controle de vetores e endemias: material, combustível e manutenção de veículos da vigilância",
                     "Investigação de surtos e notificação (SINAN, SIM, SINASC)",
                     "Ações de promoção e prevenção e capacitação das equipes de vigilância"],
        "condicoes": ["Alimentação regular do SINAN, SIM e SINASC", "Registrar as ações e a aplicação no RAG"],
    },
    {
        "chave": "mac_limite", "nome": "Limite Financeiro da Média e Alta Complexidade (MAC)",
        "padroes": ["PROCEDIMENTOS NO MAC"],
        "origem": [("PRC6_174", "financiamento")],
        "limite": "Somente em ações de média e alta complexidade ambulatorial e hospitalar (PRC 6/2017, art. 174).",
        "regras": {},
        "exemplos": ["Pagamento de prestadores de consultas, exames e procedimentos especializados",
                     "Custeio de serviços ambulatoriais e hospitalares de média complexidade do município",
                     "Medicamentos e insumos usados nos serviços de MAC"],
        "condicoes": ["Seguir a programação pactuada e a produção registrada no SIA/SIH",
                      "Registrar a aplicação no RAG"],
    },
    {
        "chave": "aps_piso", "nome": "Piso da Atenção Primária à Saúde",
        "padroes": ["PISO DE ATENCAO PRIMARIA", "INCENTIVO FINANCEIRO DA APS"],
        "origem": [("PRC6_12R", "aplicação"), ("PRC6_9D", "condição"), ("PRC6_12H", "financiamento"),
                   ("PRC6_12J", "financiamento"), ("PRC6_12P", "financiamento"), ("PRC6_85C", "financiamento")],
        "limite": "Somente em ações e serviços da Atenção Primária, aplicados de forma autônoma entre os componentes "
                  "do Piso (PRC 6/2017, art. 12-R).",
        "regras": {},
        "exemplos": ["Folha das equipes eSF, eAP, eSB e eMulti (profissionais da APS) e encargos",
                     "Medicamentos, insumos e material de consumo das UBS",
                     "Manutenção das UBS e dos equipamentos; combustível para visitas domiciliares e transporte das "
                     "equipes"],
        "condicoes": ["Equipes credenciadas e cadastradas no SCNES, sem irregularidade que motive suspensão "
                      "(art. 9º-D)",
                      "Prestação de contas no RAG (art. 12-R, parágrafo único)"],
    },
    {
        "chave": "investimento_rede", "nome": "Investimento — Estruturação da Rede de Serviços",
        "padroes": ["ESTRUTURACAO DA REDE"],
        "origem": [("PRC6_647", "financiamento"), ("PRC6_651", "condição"), ("PRC6_652", "condição")],
        "limite": "Somente despesas de capital do projeto aprovado; a portaria específica define valor, prazo de "
                  "execução e cronograma (PRC 6/2017, arts. 647 e 651).",
        "regras": {},
        "exemplos": ["Equipamentos e materiais permanentes previstos na proposta aprovada",
                     "Obra de construção, ampliação ou reforma prevista na proposta aprovada"],
        "condicoes": ["Executar exatamente o objeto da proposta/portaria específica, no prazo nela definido "
                      "(art. 651)",
                      "Informar o projeto e a execução no Relatório de Gestão (art. 652)"],
    },
    {
        "chave": "incremento_temporario", "nome": "Incremento temporário (emenda parlamentar)",
        "padroes": ["INCREMENTO TEMPORARIO"],
        "origem": [],
        "pendente": "A regulamentação do incremento temporário (portaria anual do Ministério da Saúde e LDO do "
                    "exercício) ainda não foi conferida pelo ERSUS360.",
        "limite": "", "regras": {}, "exemplos": [], "condicoes": [],
    },
    {
        "chave": "fitoterapicos", "nome": "Apoio ao uso de plantas medicinais e fitoterápicos",
        "padroes": ["PLANTAS MEDICINAIS"],
        "origem": [],
        "pendente": "A portaria ou edital que regula este repasse ainda não foi conferida pelo ERSUS360.",
        "limite": "", "regras": {}, "exemplos": [], "condicoes": [],
    },
]

PAPEL_ROTULO = {"institui": "Institui o programa", "financiamento": "Regulamenta o financiamento",
                "aplicação": "Define a aplicação", "condição": "Condição de execução"}


def programa_por_texto(grupo: str | None, acao: str | None, acao_det: str | None) -> dict | None:
    texto = normalizar(" ".join(filter(None, [grupo, acao, acao_det])))
    for p in PROGRAMAS:
        if any(normalizar(x) in texto for x in p["padroes"]):
            return p
    return None
