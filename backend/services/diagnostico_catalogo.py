"""
Catálogo do checklist do Diagnóstico Situacional da Saúde Municipal (9 áreas, A–I).

Cada item diz COMO pode ser verificado hoje no ERSUS360:
  automatico   — há fonte oficial já integrada; o coletor (services/diagnostico_fontes.py) preenche
  integracao   — a fonte existe fora do ERSUS360 mas ainda não está integrada; até lá, declarado pelo município
  levantamento — só o município sabe (documento, visita, ata); sempre declarado e validado pelo técnico

Sem dependências de banco: testado em tests/test_diagnostico_situacional.py.
"""
from __future__ import annotations

from dataclasses import dataclass

CLASSIFICACOES = {
    "regular": "Regular",
    "pendencia": "Com pendência",
    "critico": "Crítico",
    "nao_se_aplica": "Não se aplica",
    "nao_verificado": "Não verificado",
}
# Ordem de gravidade para comparar períodos. "Não verificado"/"Não se aplica" não entram na comparação.
GRAVIDADE = {"regular": 0, "pendencia": 1, "critico": 2}

ORIGENS = {"automatico": "Automático (fonte oficial)", "declarado": "Declarado pelo município"}
VALIDACOES = {"pendente": "Aguardando validação", "confirmado": "Validado", "contestado": "Contestado"}
NATUREZAS = {"comprovado": "Achado comprovado", "hipotese": "Hipótese (a confirmar)"}
PRIORIDADES = {"alta": "Alta", "media": "Média", "baixa": "Baixa"}
STATUS_ACAO = {"nao_iniciada": "Não iniciada", "em_andamento": "Em andamento", "concluida": "Concluída",
               "cancelada": "Cancelada"}
SITUACOES = {"em_elaboracao": "Em elaboração", "em_validacao": "Em validação", "concluido": "Concluído"}
MODOS = {"automatico": "Dado automático disponível", "integracao": "Exige integração",
         "levantamento": "Depende de levantamento municipal"}

AREAS = {
    "A": "Planejamento e Controle Social",
    "B": "Atenção Primária à Saúde",
    "C": "Rede de Serviços e CNES",
    "D": "Regulação e Acesso",
    "E": "Vigilância em Saúde",
    "F": "Assistência Farmacêutica",
    "G": "Financiamento e Recursos Federais",
    "H": "Gestão de Pessoas",
    "I": "Território e Acesso",
}


@dataclass(frozen=True)
class ItemCatalogo:
    codigo: str
    area: str
    titulo: str
    pergunta: str          # o que se verifica
    modo: str              # automatico | integracao | levantamento
    fonte_sugerida: str    # onde o dado oficial está (ou estará)
    evidencia_esperada: str


def _i(codigo, titulo, pergunta, modo, fonte, evidencia) -> ItemCatalogo:
    return ItemCatalogo(codigo, codigo[0], titulo, pergunta, modo, fonte, evidencia)


ITENS: tuple[ItemCatalogo, ...] = (
    # A — Planejamento e Controle Social
    _i("A01", "Plano Municipal de Saúde (PMS)", "O PMS do quadriênio está vigente e aprovado pelo Conselho Municipal de Saúde?",
       "integracao", "DigiSUS Gestor — Módulo Planejamento (DGMP)", "PMS e resolução de aprovação do CMS"),
    _i("A02", "Programação Anual de Saúde (PAS)", "A PAS do exercício foi elaborada e aprovada pelo Conselho?",
       "integracao", "DigiSUS Gestor — Módulo Planejamento (DGMP)", "PAS e resolução do CMS"),
    _i("A03", "RDQA do período", "O Relatório Detalhado do Quadrimestre Anterior foi registrado e apresentado em audiência pública e ao Conselho?",
       "integracao", "DigiSUS Gestor — Módulo Planejamento (DGMP)", "RDQA registrado e ata da audiência pública"),
    _i("A04", "Relatório Anual de Gestão (RAG)", "O RAG do exercício anterior foi enviado ao Conselho e apreciado no prazo legal?",
       "integracao", "DigiSUS Gestor — Módulo Planejamento (DGMP)", "RAG registrado e parecer/resolução do CMS"),
    _i("A05", "Conselho Municipal de Saúde", "O CMS está constituído com paridade, regimento e reuniões ordinárias regulares?",
       "levantamento", "Secretaria Executiva do CMS", "Lei de criação, regimento, atas do período"),
    _i("A06", "Conferência Municipal de Saúde", "A Conferência Municipal do ciclo vigente foi realizada e seu relatório considerado no PMS?",
       "levantamento", "Secretaria Executiva do CMS", "Relatório final da conferência"),

    # B — Atenção Primária
    _i("B01", "Classificação oficial do quadrimestre (SIAPS)", "Há equipes classificadas como Regular na avaliação oficial do quadrimestre?",
       "automatico", "SIAPS — área pública (Avaliação do Quadrimestre)", "Contagem oficial de equipes por classificação"),
    _i("B02", "Ausência de envio de produção (e-Gestor)", "Há equipes, estabelecimentos ou profissionais com ausência de envio registrada no e-Gestor?",
       "automatico", "e-Gestor APS — relatório público de ausência de envio", "Registros de ausência por competência"),
    _i("B03", "Situação de pagamento das equipes (e-Gestor)", "Há equipes com pagamento suspenso ou com pendência na parcela do período?",
       "automatico", "e-Gestor APS — pagamento por equipe (API pública)", "Situação de pagamento por INE na parcela"),
    _i("B04", "Cadastro territorial pelos ACS", "A cobertura de cadastro individual e domiciliar dos ACS está adequada?",
       "integracao", "e-SUS APS PEC (agente local de sincronização)", "Relatório de cadastro territorial do PEC"),
    _i("B05", "Acesso às UBS", "As UBS funcionam com horário, agenda e acolhimento compatíveis com a demanda?",
       "levantamento", "Coordenação da APS / visita técnica", "Horários afixados, agendas, relatório de visita"),

    # C — Rede de Serviços e CNES
    _i("C01", "Composição mínima das equipes no CNES", "As equipes ativas no CNES têm a composição mínima de profissionais lotados?",
       "automatico", "CNES — XML-CNES do SISAB importado no ERSUS360", "Pendências de composição por INE"),
    _i("C02", "Funcionamento efetivo dos estabelecimentos", "Os estabelecimentos e equipes cadastrados funcionam de fato (cadastro ≠ funcionamento)?",
       "levantamento", "Visita técnica / coordenação", "Relatório de visita com fotos e escala"),
    _i("C03", "Estrutura física e equipamentos", "A estrutura física e os equipamentos das unidades estão adequados e em funcionamento?",
       "levantamento", "Visita técnica / patrimônio", "Checklist de infraestrutura"),
    _i("C04", "Carga horária real × CNES", "A carga horária cumprida pelos profissionais confere com a cadastrada no CNES?",
       "levantamento", "RH municipal × CNES", "Folha de ponto/escala comparada ao CNES"),

    # D — Regulação e Acesso
    _i("D01", "Regulação municipal instituída", "Há fluxo/central de regulação municipal formalizado para consultas e exames especializados?",
       "levantamento", "Secretaria Municipal de Saúde", "Ato normativo, fluxos e protocolos"),
    _i("D02", "Fila de espera monitorada", "A fila de espera por consultas, exames e cirurgias é registrada e monitorada?",
       "integracao", "SISREG / sistema de regulação estadual", "Relatório de fila por especialidade"),
    _i("D03", "Tratamento Fora do Domicílio (TFD)", "O TFD está organizado com critérios, registro e prestação de contas?",
       "levantamento", "Setor de TFD", "Normas, registros de deslocamentos e pagamentos"),
    _i("D04", "Referências pactuadas", "As referências para média e alta complexidade estão pactuadas (PPI/CIR) e funcionando?",
       "levantamento", "CIR / Programação Pactuada", "Pactuação vigente e registro de recusas"),

    # E — Vigilância em Saúde
    _i("E01", "PQA-VS — metas da vigilância", "Os indicadores do PQA-VS avaliados no período atingiram a meta?",
       "automatico", "FVS-RCP/AM — painel público do PQA-VS", "Resultado, meta e alcance publicados por indicador"),
    _i("E02", "Vigilância Sanitária estruturada", "A VISA municipal tem equipe, legislação e programação de inspeções?",
       "levantamento", "Coordenação de VISA", "Lei/código sanitário, equipe e relatório de inspeções"),
    _i("E03", "Coberturas vacinais", "As coberturas vacinais do calendário básico atingiram as metas?",
       "integracao", "SIPNI / Vacinômetro", "Relatório de cobertura por vacina"),
    _i("E04", "Notificação e investigação oportuna", "Os agravos de notificação compulsória são notificados e encerrados oportunamente?",
       "integracao", "SINAN", "Relatório de oportunidade de encerramento"),

    # F — Assistência Farmacêutica
    _i("F01", "REMUME atualizada", "A Relação Municipal de Medicamentos Essenciais está atualizada e publicada?",
       "levantamento", "Assistência Farmacêutica municipal", "REMUME e ato de publicação"),
    _i("F02", "Controle de estoque informatizado", "O estoque e a dispensação são registrados em sistema (Hórus/BNAFAR)?",
       "integracao", "Hórus / BNAFAR", "Relatório de estoque e envio ao BNAFAR"),
    _i("F03", "Farmacêutico responsável", "As unidades dispensadoras têm farmacêutico responsável?",
       "levantamento", "CNES / Assistência Farmacêutica", "Escala e registro no CRF"),
    _i("F04", "Desabastecimento", "Há desabastecimento de medicamentos essenciais no período?",
       "levantamento", "Almoxarifado / CAF", "Relatório de rupturas de estoque"),

    # G — Financiamento e Recursos Federais
    _i("G01", "Aplicação mínima em saúde (EC 29 / LC 141)", "O município aplicou ao menos 15% da receita de impostos em ações e serviços públicos de saúde?",
       "automatico", "SIOPS — API de dados abertos do Ministério da Saúde", "Percentual aplicado declarado no SIOPS"),
    _i("G02", "Repasses FNS previstos × recebidos", "Os repasses previstos nas Portarias foram identificados no FNS sem divergência?",
       "automatico", "FNS — transferências fundo a fundo × previsões cadastradas", "Conciliação previsto × recebido"),
    _i("G03", "Propostas federais (InvestSUS)", "Há propostas/emendas federais em diligência, rejeitadas ou canceladas?",
       "automatico", "InvestSUS — propostas do Fundo Municipal de Saúde", "Situação oficial de cada proposta"),
    _i("G04", "Recursos parados em conta", "Há saldos de recursos federais sem execução nas contas do Fundo?",
       "integracao", "Extratos bancários das contas do FMS", "Extrato e plano de aplicação"),
    _i("G05", "Fundo Municipal de Saúde", "O FMS tem CNPJ próprio, gestor designado e contas por bloco?",
       "levantamento", "Lei do FMS / contabilidade", "Lei, CNPJ e relação de contas"),

    # H — Gestão de Pessoas
    _i("H01", "Vínculos de trabalho", "Os profissionais da saúde têm vínculos regulares (concurso, seleção pública)?",
       "levantamento", "RH municipal", "Quadro de pessoal por vínculo"),
    _i("H02", "Plano de cargos e carreiras", "Há PCCS ou plano equivalente para os trabalhadores da saúde?",
       "levantamento", "RH municipal", "Lei do PCCS"),
    _i("H03", "Educação permanente", "Há plano de educação permanente executado no período?",
       "levantamento", "Coordenação de educação permanente", "Plano e registros de capacitação"),
    _i("H04", "Rotatividade e vacância", "Há vacância ou rotatividade que comprometa equipes essenciais?",
       "levantamento", "RH municipal × CNES", "Relação de cargos vagos e desligamentos"),

    # I — Território e Acesso
    _i("I01", "Territorialização atualizada", "As microáreas estão delimitadas e o mapa do território está atualizado?",
       "levantamento", "Coordenação da APS", "Mapas e cadastro de microáreas"),
    _i("I02", "Áreas descobertas por ACS", "Há microáreas sem ACS ou populações sem cadastro?",
       "integracao", "e-SUS APS PEC (agente local de sincronização)", "Microáreas sem ACS vinculado"),
    _i("I03", "Populações ribeirinhas, rurais e indígenas", "As populações de difícil acesso recebem atendimento regular (itinerância, UBS fluvial, eSFR)?",
       "levantamento", "Coordenação da APS / DSEI", "Cronograma de itinerância e registros de atendimento"),
    _i("I04", "Vazios assistenciais", "Há localidades ou serviços sem oferta assistencial dentro do município?",
       "levantamento", "Secretaria Municipal de Saúde", "Mapa de oferta × localidades"),
)

POR_CODIGO = {i.codigo: i for i in ITENS}


def itens_da_area(area: str) -> list[ItemCatalogo]:
    return [i for i in ITENS if i.area == area]


# ── Períodos ──────────────────────────────────────────────────────────────────

PERIODOS = {"anual": 0, "quadrimestre": 3, "semestre": 2}


def validar_periodo(periodo_tipo: str, periodo: int) -> None:
    if periodo_tipo not in PERIODOS:
        raise ValueError("Tipo de período inválido (anual, quadrimestre ou semestre).")
    maximo = PERIODOS[periodo_tipo]
    if periodo_tipo == "anual":
        if periodo != 0:
            raise ValueError("Período anual não tem subdivisão (use 0).")
    elif not 1 <= periodo <= maximo:
        raise ValueError(f"Período inválido para {periodo_tipo}: use 1 a {maximo}.")


def meses_do_periodo(periodo_tipo: str, periodo: int) -> tuple[int, int]:
    """(mês inicial, mês final) do período."""
    if periodo_tipo == "quadrimestre":
        return 4 * periodo - 3, 4 * periodo
    if periodo_tipo == "semestre":
        return 6 * periodo - 5, 6 * periodo
    return 1, 12


def rotulo_periodo(exercicio: int, periodo_tipo: str, periodo: int) -> str:
    if periodo_tipo == "quadrimestre":
        return f"{periodo}º quadrimestre de {exercicio}"
    if periodo_tipo == "semestre":
        return f"{periodo}º semestre de {exercicio}"
    return f"Exercício {exercicio}"


def chave_ordem(exercicio: int, periodo_tipo: str, periodo: int) -> tuple[int, int]:
    """Ordena diagnósticos no tempo pelo mês final do período."""
    return exercicio, meses_do_periodo(periodo_tipo, periodo)[1]
