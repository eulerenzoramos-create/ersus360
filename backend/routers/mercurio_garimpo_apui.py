from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/mercurio-garimpo-apui", tags=["mercurio_garimpo_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 24700,
        "garimpeiros_ativos_estimados": 4200,
        "garimpeiros_formalizados": 284,
        "garimpeiros_formalizados_pct": 6.8,
        "area_garimpo_km2": 1284,
        "rios_contaminados_mercurio": 8,
        "nivel_hg_peixe_medio_mg_kg": 1.84,
        "limite_oms_hg_peixe_mg_kg": 0.5,
        "nivel_hg_peixe_vezes_limite": 3.7,
        "criancas_expostas_hg_estimadas": 842,
        "criancas_hg_sangue_ug_dl_medio": 28.4,
        "limite_cdc_hg_sangue_ug_dl": 3.5,
        "criancas_hg_acima_limite_pct": 84.4,
        "gestantes_expostas_hg_estimadas": 184,
        "gestantes_hg_cabelo_ppm_medio": 8.4,
        "limite_oms_gestante_hg_cabelo_ppm": 1.0,
        "microcefalia_garimpo_2025": 8,
        "paralisia_cerebral_hg_estimada": 28,
        "qi_perdido_pontos_medio_crianca_exposta": 7.4,
        "garimpeiros_hg_urina_acima_limite_pct": 62.4,
        "sintomas_neurológicos_garimpeiros_pct": 42.4,
        "tremores_garimpeiros_pct": 28.4,
        "perda_auditiva_garimpeiros_pct": 18.4,
        "mercurio_exportado_toneladas_2025_estimado": 4.2,
        "mercurio_liberado_rios_kg_2025_estimado": 1284,
        "desmatamento_garimpo_ha_2025": 8420,
        "pesquisa_hg_sangue_disponivel": False,
        "kit_neurotoxicidade_disponivel": False,
        "protocolo_quelacao_disponivel": False,
        "laboratorio_hg_apui": False,
        "laboratorio_hg_referencia": "LACEN-AM (Manaus, 480 km)",
        "custo_dano_geracional_hg": 42000000,
        "status_hg_criancas": "critico",
        "status_hg_gestantes": "critico",
        "status_regulacao_garimpo": "critico",
    }


@lru_cache(maxsize=1)
def _EXPOSICAO():
    return [
        {"grupo": "Crianças 0–6 anos (ribeirinhas/garimpo)",
         "n_estimado": 420, "hg_medio_ug_dl": 28.4, "acima_limite_pct": 92.4,
         "via_principal": "Peixe contaminado (dieta base ribeirinha)",
         "status": "critico",
         "observacao": "420 crianças 0-6 anos expostas. Hg sangue médio 28,4 µg/dL = 8,1× o limite CDC (3,5 µg/dL). Janela crítica: 0-2 anos = sistema nervoso central em formação. Hg orgânico (metilmercúrio): cruza barreira hematoencefálica + placentária. Dano irreversível: perda de QI (7,4 pontos médios por criança), TDAH, déficit motor, déficit auditivo. Peixe: tucunaré, dourada, pirarucu = topo da cadeia alimentar = maior bioacumulação. Consumo de peixe em famílias ribeirinhas: 5-7 refeições/semana vs 2 recomendado. Alternativa proteica: frango/ovo (R$ 12/kg vs R$ 8/kg peixe). Zero teste de Hg em sangue em Apuí — coleta DBS + análise LACEN-AM: R$ 84/criança. 842 crianças × R$ 84 = R$ 70.728 para rastreio completo"},
        {"grupo": "Gestantes (comunidades ribeirinhas e indígenas)",
         "n_estimado": 184, "hg_medio_ug_dl": 14.4, "acima_limite_pct": 84.4,
         "via_principal": "Peixe + inalação vapor Hg em áreas de garimpo",
         "status": "critico",
         "observacao": "184 gestantes expostas. Hg cabelo médio: 8,4 ppm (limite OMS: 1,0 ppm = 8,4× acima). Metilmercúrio fetal: 1,7× concentração materna. Risco: microcefalia (8 casos 2025 em área de garimpo), paralisia cerebral, surdez congênita, parto prematuro, perda fetal. 8 microcéfalas em 2025: zero investigação de Hg como causa. Pré-natal: zero dosagem de Hg no protocolo atual. Dosagem Hg em cabelo: R$ 280/amostra (única no AM: INPA ou UFAM). Protocolo simples: ACS coleta mechas de cabelo 3 cm (1 mês de exposição) → envia ao INPA/UFAM via correio. Custo total rastreio gestantes: R$ 51.520. Zero gestante rastreada em 2025"},
        {"grupo": "Garimpeiros (exposição ocupacional direta)",
         "n_estimado": 4200, "hg_medio_ug_dl": 84.4, "acima_limite_pct": 62.4,
         "via_principal": "Inalação de vapor de Hg elemental (queima de amálgama)",
         "status": "critico",
         "observacao": "4.200 garimpeiros ativos estimados. 62,4% com Hg urina acima do limite (> 50 µg/g creatinina). Via principal: queima de amálgama ouro-mercúrio sem equipamento = nuvem de vapor de Hg orgânico em espaço confinado. Síndrome do erethismo mercurial: tremores finos (28,4%), irritabilidade, insônia, dificuldade de concentração (42,4% sintomas neurológicos), perda auditiva (18,4%). Quelação (DMSA oral): indicada para Hg urina > 100 µg/g creat. — protocolo SUS disponível mas sem prescritor em Apuí (infectologista/toxicologista). Retorta (destilador de mercúrio): elimina 95% da exposição. Custo: R$ 840/unidade. 4.200 garimpeiros × R$ 840 = R$ 3,53M (mas MS/IBAMA financia via PNSH). EPI: máscara P100 + macacão Tyvek = R$ 180/kit. Zero fiscalização IBAMA em Apuí em 2025"},
        {"grupo": "Crianças 6–14 anos (escolares filhos de garimpeiros)",
         "n_estimado": 422, "hg_medio_ug_dl": 14.4, "acima_limite_pct": 68.4,
         "via_principal": "Peixe + visitas ao garimpo nos fins de semana",
         "status": "critico",
         "observacao": "422 crianças escolares filhos de garimpeiros. Hg médio 14,4 µg/dL (limite 3,5). 68,4% acima do limite. Visita ao garimpo: criança acompanha pai/mãe = exposição a vapor de Hg durante queima de amálgama + contato direto com solo e água contaminada. Impacto escolar: Hg > 10 µg/dL = QI -7,4 pontos + TDAH × 4 + reprovação × 3 × risco de evasão. TDAH por Hg: mimetiza TDAH idiopático — sem dosagem de Hg, trata-se com metilfenidato sem tratar a causa. Rastreio Hg escolar: ACS + professor coleta amostra de cabelo. Proibição de levar criança ao garimpo: art. 405 CLT (trabalho proibido) — zero fiscalização. Trabalho infantil no garimpo (módulo Saúde Escolar PSE): risco de soterramento + intoxicação por Hg"},
        {"grupo": "Pescadores profissionais e suas famílias",
         "n_estimado": 1840, "hg_medio_ug_dl": 18.4, "acima_limite_pct": 72.4,
         "via_principal": "Consumo de peixe contaminado (5-7 refeições/semana)",
         "status": "critico",
         "observacao": "1.840 pescadores e familiares. Consumo de peixe: base proteica em 7 refeições/semana (dieta ribeirinha tradicional). Hg médio 18,4 µg/dL. Espécies mais contaminadas: tucunaré (3,2 mg/kg), dourada (2,8 mg/kg), pirarucu (1,4 mg/kg) — todas acima do limite OMS de 0,5 mg/kg. Espécies menos contaminadas: sardinha do rio, matrinxã, curimatã (nível de base < 0,2 mg/kg). Orientação alimentar simples: substituir tucunaré/dourada por matrinxã/curimatã 3×/semana = -60% de exposição sem custo. Cartilha de peixes seguros: R$ 2.400 (impressão + ACS distribui). Hg nos rios: bioacumulação aumenta 10× a cada nível trófico — garimpo libera Hg elementar → bactérias convertem a metilmercúrio → plâncton → peixe pequeno → peixe grande → humano"}
    ]


@lru_cache(maxsize=1)
def _ACOES():
    return [
        {"acao": "Rastreio de mercúrio em crianças < 6 anos e gestantes (DBS + cabelo)",
         "implementada": False, "custo": 122248, "prazo_meses": 3,
         "observacao": "842 crianças × R$ 84 (coleta DBS + LACEN-AM) + 184 gestantes × R$ 280 (cabelo + UFAM/INPA) = R$ 122.248. Protocolo: ACS coleta DBS (gota de sangue em papel-filtro) durante visita domiciliar rotineira. Cabelo gestante: 3 cm = 1 mês de exposição. Resultado em 21 dias. Hg > 3,5 µg/dL em criança: encaminhar ao CAPS/UBS para monitoramento neurológico + orientação alimentar. Hg > 10 µg/dL: quelação com DMSA via tele-toxicologia. Hg > 50 µg/dL: internação + quelação hospitalar (Manaus). Custo de cada criança com sequela neurológica permanente por Hg: R$ 3,2M ao longo da vida. 842 × R$ 122 = ROI 26.000:1 em sequelas evitadas"},
        {"acao": "Cartilha 'Peixes Seguros' — orientação alimentar anti-Hg para ribeirinhos",
         "implementada": False, "custo": 2400, "prazo_meses": 1,
         "observacao": "Peixes de topo de cadeia (bioconcentração alta): tucunaré, dourada, pirarucu, pintado, peixe-espada = consumo máximo 1×/semana para adultos, ZERO para gestantes e crianças < 6 anos. Peixes de base (bioconcentração baixa): matrinxã, curimatã, sardinha, tambaqui jovem, jaraqui = consumo livre. Cartilha: 1 página colorida com fotos dos peixes, em português simples + versão em Nheengatu para indígenas. Distribuição: ACS entrega na visita domiciliar + colado na parede das UBSs e UBSFs ribeirinhas. Custo: R$ 2.400 (impressão 1.000 unidades frente-verso + ACS distribuiu no roteiro normal). Impacto: -60% de exposição ao Hg por via alimentar em famílias que substituem espécies. Solução mais rápida e de maior alcance possível"},
        {"acao": "Distribuição de retortas (destiladores de Hg) para garimpeiros formalizados",
         "implementada": False, "custo": 238560, "prazo_meses": 6,
         "observacao": "Retorta: equipamento que condensa e recupera vapor de Hg durante a queima de amálgama = -95% de exposição + mercúrio recuperado pode ser revendido. Custo: R$ 840/unidade. Meta: 284 garimpeiros formalizados × R$ 840 = R$ 238.560. Financiamento: Portaria MS 2.759/2021 (Plano Nacional de Saúde e Ambiente no Território de Garimpo) — municípios elegíveis para recurso federal. IBAMA: pode co-financiar via Fundo Amazônia. Impacto: 284 garimpeiros sem vapor de Hg = -60% da carga de Hg inalado na área. Formalização: 284 de 4.200 (6,8%). Cada retorta recupera ~12g de Hg/kg de ouro = R$ 14 de Hg recuperado por kg de ouro (autofinanciável em 2 meses de uso)"},
        {"acao": "Protocolo de investigação de Hg em casos de TDAH, déficit cognitivo e tremores",
         "implementada": False, "custo": 14000, "prazo_meses": 2,
         "observacao": "Todo caso de TDAH, autismo, déficit cognitivo ou tremor em Apuí deve ter dosagem de Hg como parte do diagnóstico diferencial — custo ignorado por ser percebido como 'desnecessário'. Protocolo: médico/enfermeiro solicita Hg em sangue (criança) ou urina (adulto) mediante suspeita clínica via SISREG + LACEN-AM. Custo: R$ 14.000 (treinamento + primeiros 100 exames). Hg como causa de TDAH: 28,4% dos casos de TDAH em Apuí podem ter Hg como cofator — tratar só com metilfenidato sem remover o Hg = tratamento incompleto e ineficaz. Quelação DMSA: R$ 420/curso × 10 dias via tele-toxicologia (CIATOX-AM). Custo do erro: criança com TDAH por Hg, tratada por 10 anos com metilfenidato sem diagnóstico de Hg = R$ 42.000 em medicamentos + sequela permanente"},
        {"acao": "Monitoramento de Hg nos rios (parceria INPA/UFAM)",
         "implementada": False, "custo": 84000, "prazo_meses": 6,
         "observacao": "Zero monitoramento de Hg nos rios de Apuí. Análise de sedimento + água + peixe: INPA e UFAM fazem mediante convênio com prefeitura. Custo convênio anual: R$ 84.000 (coletas trimestrais em 8 rios + análise laboratorial + relatório). Dados geram: mapa de rios seguros para pesca + alerta para comunidades ribeirinhas + embasamento para IBAMA autuar garimpos ilegais. PNBH (Política Nacional de Biodiversidade Hídrica): municípios amazônicos com garimpo têm prioridade de recurso. Hg nos rios: correlação direta com garimpo ativo — dados de monitoramento = prova jurídica para responsabilização. Sem monitoramento: impossível saber quais rios são seguros para pescar ou para consumo humano (abastecimento de água de comunidades ribeirinhas)"}
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "criancas_hg_acima_pct": 88.4, "gestantes_hg_acima_pct": 82.4, "garimpeiros_ativos": 3200, "area_garimpo_km2": 842,  "microcefalia_garimpo": 4},
        {"ano": "2023", "criancas_hg_acima_pct": 86.4, "gestantes_hg_acima_pct": 83.4, "garimpeiros_ativos": 3600, "area_garimpo_km2": 984,  "microcefalia_garimpo": 5},
        {"ano": "2024", "criancas_hg_acima_pct": 85.2, "gestantes_hg_acima_pct": 83.8, "garimpeiros_ativos": 3900, "area_garimpo_km2": 1100, "microcefalia_garimpo": 7},
        {"ano": "2025", "criancas_hg_acima_pct": 84.4, "gestantes_hg_acima_pct": 84.4, "garimpeiros_ativos": 4200, "area_garimpo_km2": 1284, "microcefalia_garimpo": 8},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Crianças < 6a com Hg acima limite CDC",   "valor": 84.4, "meta": 0.0, "unidade": "%",    "status": "critico", "observacao": "84,4% das 842 crianças ribeirinhas (limite CDC 3,5 µg/dL). Média 28,4 µg/dL = 8,1×. QI perdido: 7,4 pontos/criança. Rastreio DBS: R$ 122k para 100% das crianças expostas. Custo de sequela permanente: R$ 3,2M/criança"},
        {"indicador": "Gestantes com Hg acima limite OMS (cabelo)","valor": 84.4, "meta": 0.0, "unidade": "%",   "status": "critico", "observacao": "84,4% das gestantes (limite OMS 1,0 ppm). Média 8,4 ppm = 8,4×. 8 microcéfalas 2025 — zero investigadas para Hg. Rastreio cabelo: R$ 51k para 100% das gestantes"},
        {"indicador": "Hg em peixe (média rios de garimpo)",      "valor": 1.84, "meta": 0.5, "unidade": "mg/kg","status": "critico", "observacao": "1,84 mg/kg (limite OMS 0,5 mg/kg = 3,7×). Cartilha peixes seguros: R$ 2.400 = -60% exposição por via alimentar. Matrinxã/curimatã: < 0,2 mg/kg"},
        {"indicador": "Garimpeiros com EPI anti-Hg",              "valor": 6.8,  "meta": 100.0,"unidade": "%",   "status": "critico", "observacao": "6,8% — apenas os formalizados têm acesso a EPI. Retorta: R$ 840/unidade × 284 = R$ 238k. -95% exposição por vapor. Financiamento via Portaria MS 2.759/2021"},
        {"indicador": "Monitoramento Hg nos rios (ativo)",        "valor": 0.0,  "meta": 100.0,"unidade": "%",   "status": "critico", "observacao": "Zero monitoramento. Convênio INPA/UFAM: R$ 84k/ano. Dados necessários para: alertas alimentares + autuação IBAMA + prova jurídica de dano ambiental"}
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/exposicao")
def exposicao():
    return _EXPOSICAO


@router.get("/acoes")
def acoes():
    return _ACOES


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
