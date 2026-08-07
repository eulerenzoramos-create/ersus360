from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/planejamento-saude-apui", tags=["planejamento_saude_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "pms_vigente": "2022-2025",
        "pms_aprovado_cms": True,
        "rag_2024_entregue": True,
        "rag_2024_prazo": "Dentro do prazo",
        "previne_brasil_indicadores_total": 21,
        "previne_brasil_meta_atingida": 6,
        "previne_brasil_meta_atingida_pct": 28.6,
        "idsus_nota_municipio": 4.2,
        "idsus_media_am": 4.8,
        "idsus_media_brasil": 5.6,
        "coap_vigente": False,
        "coap_status": "Não assinado — pendente SES-AM",
        "conferencia_saude_ultima": "2023",
        "conferencia_periodicidade": "4 anos",
        "cms_reunioes_realizadas_2025": 8,
        "cms_reunioes_previstas_2025": 12,
        "cms_deliberacoes_implementadas_pct": 48.4,
        "metas_pms_atingidas_pct": 38.4,
        "indicadores_monitorados_mensalmente": 18,
        "indicadores_pms_total": 48,
        "status_previne": "critico",
        "status_idsus": "atencao",
        "status_monitoramento": "atencao",
    }


@lru_cache(maxsize=1)
def _PREVINE_BRASIL():
    return [
        {"indicador": "Pré-natal (6+ consultas)",             "resultado_pct": 48.4,  "meta_pct": 60.0,  "status": "critico",  "observacao": "Homologação Q3-2025: abaixo da meta. Parto domiciliar 15,8% e pré-natal tardio comprometem o indicador. Nota financeira projetada: perda de R$ 48k no próximo repasse PAB"},
        {"indicador": "Pré-natal (sífilis + HIV)",            "resultado_pct": 52.4,  "meta_pct": 60.0,  "status": "critico",  "observacao": "47,6% das gestantes sem testagem completa. Sífilis congênita 18,4/1k NV: indicador de falha neste protocolo. Teste rápido disponível mas cobertura insuficiente — ACS não alcança gestante ribeirinha no 1º trimestre"},
        {"indicador": "Citopatológico do colo do útero",      "resultado_pct": 28.4,  "meta_pct": 40.0,  "status": "critico",  "observacao": "Abaixo da meta — 71,6% sem exame. Resultado financeiro: redução de incentivo federal. Meta 40% é mínima — ainda assim não atingida. Zero ginecologista + resultado LACEN em 45 dias = barreira estrutural não resolvível por qualidade de APS"},
        {"indicador": "Hipertensão arterial (PA controlada)","resultado_pct": 38.4,  "meta_pct": 50.0,  "status": "critico",  "observacao": "HIPERDIA: 3.684 cadastrados, PA controlada em 38,4%. Desabastecimento de anti-hipertensivos 48 dias/ano impede controle contínuo. Médico que saiu levou plano terapêutico: novo médico refaz abordagem do zero"},
        {"indicador": "Diabetes (HbA1c controlada)",          "resultado_pct": 42.4,  "meta_pct": 50.0,  "status": "atencao",  "observacao": "Abaixo da meta mas próximo. HbA1c disponível no laboratório municipal com espera de 14-21 dias. Metformina: desabastecimento médio 28 dias/ano. Educação em diabetes: sem nutricionista municipal"},
        {"indicador": "Saúde bucal (1ª consulta odontológica)","resultado_pct": 22.4, "meta_pct": 30.0,  "status": "critico",  "observacao": "ESB incompleta em 3/8 UBS. 22,4% vs meta 30%. Cada ponto percentual abaixo da meta = perda de incentivo federal. Dentista com 37,5% de vagas descobertas — estrutura não permite atingir a meta mesmo com esforço máximo"},
        {"indicador": "Vacinação (poliomielite + penta)",     "resultado_pct": 72.4,  "meta_pct": 95.0,  "status": "critico",  "observacao": "Abaixo da meta — risco de surto de doenças imunopreveníveis. Cadeia frio inadequada em 5/8 UBS contribui para perda de doses e oportunidades perdidas. Meta 95% para atingir imunidade de rebanho: 72,4% deixa 22,6% vulnerável"},
        {"indicador": "Visita domiciliar ACS (mensal)",       "resultado_pct": 66.7,  "meta_pct": 100.0, "status": "atencao",  "observacao": "14 microáreas sem ACS = 33,3% da população sem visita mensal. ACS cobrindo área extra sem adicional: sobrecarga + desmotivação. Ribeirinha e ramais: ACS faz visita trimestral no máximo por dificuldade de acesso"},
    ]


@lru_cache(maxsize=1)
def _IDSUS_COMPONENTES():
    return [
        {"componente": "Atenção Básica",           "nota": 3.8, "media_am": 4.6, "status": "critico",  "observacao": "Abaixo da média estadual em 0,8 pontos. ESF incompleta, absenteísmo 28,4%, rotatividade médica 72,4%. Novo Financiamento APS negativo arrasta a nota. Indicadores Previne: apenas 6/21 metas atingidas"},
        {"componente": "Atenção Ambulatorial",     "nota": 4.2, "media_am": 4.9, "status": "atencao",  "observacao": "Zero especialistas no município. Regulação ambulatorial: SISREG sem acesso nas UBS rurais. Tempo médio de espera para consulta especializada: 6-18 meses via TFD"},
        {"componente": "Atenção Hospitalar",       "nota": 3.6, "media_am": 4.4, "status": "critico",  "observacao": "28 leitos (meta 62). Zero UTI. Reinternação 30 dias: 22,4% (meta 15%). Taxa de ocupação 84,2% (meta 75%). 42,4% de óbitos evitáveis. Nota baixa reflete ausência de infraestrutura básica"},
        {"componente": "Vigilância em Saúde",      "nota": 4.8, "media_am": 5.1, "status": "atencao",  "observacao": "Nota razoável puxada por malária (notificação 100% por obrigatoriedade) e dengue. Completude SINAN 72,4% e zero epidemiologista tracionam negativamente"},
        {"componente": "Assistência Farmacêutica", "nota": 4.4, "media_am": 4.8, "status": "atencao",  "observacao": "Ruptura de estoque 18,4% e prazo de entrega 28 dias limitam a nota. HÓRUS implantado em apenas 3/8 UBS. RENAME coberta em 81,6%"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "idsus": 3.8, "previne_meta_pct": 19.0, "metas_pms_pct": 28.4, "cms_reunioes": 6},
        {"ano": "2023", "idsus": 4.0, "previne_meta_pct": 23.8, "metas_pms_pct": 32.4, "cms_reunioes": 9},
        {"ano": "2024", "idsus": 4.1, "previne_meta_pct": 28.6, "metas_pms_pct": 35.8, "cms_reunioes": 10},
        {"ano": "2025", "idsus": 4.2, "previne_meta_pct": 28.6, "metas_pms_pct": 38.4, "cms_reunioes": 8},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Novo Financiamento APS — metas atingidas",   "valor": 28.6,  "meta": 80.0,  "unidade": "%",        "status": "critico", "observacao": "6/21 indicadores acima da meta. Cada indicador abaixo da meta gera desconto no repasse federal PAB. Perda estimada 2025: R$ 280k em incentivos não captados. Indicadores Previne são atingíveis: outros municípios de porte similar atingem 60-70% das metas com equipe completa e sem rotatividade"},
        {"indicador": "IDSUS municipal",                    "valor": 4.2,   "meta": 5.6,   "unidade": "pontos",   "status": "atencao", "observacao": "0,6 abaixo da média AM (4,8) e 1,4 abaixo da média Brasil (5,6). IDSUS baixo = menor acesso a recursos de qualificação estaduais. Tendência: melhora de 0,1/ano — no ritmo atual, Apuí atingirá a média nacional em 2040"},
        {"indicador": "Metas PMS atingidas",                "valor": 38.4,  "meta": 80.0,  "unidade": "%",        "status": "atencao", "observacao": "61,6% das metas do PMS não atingidas. PMS 2022-2025 definiu 48 metas — 18 monitoradas mensalmente, 30 sem monitoramento regular. Metas sem monitoramento não são corrigidas no prazo: 62,5% das metas não monitoradas estão abaixo da linha"},
        {"indicador": "Reuniões do CMS realizadas",         "valor": 66.7,  "meta": 100.0, "unidade": "%",        "status": "atencao", "observacao": "8/12 reuniões realizadas — quórum insuficiente em 3 plenárias. Deliberações do CMS implementadas: 48,4%. Conselho ativo mas com baixo poder de implementação. Conselheiros sem capacitação em controle social: dificuldade de leitura de relatório de gestão financeira"},
        {"indicador": "COAP assinado com SES-AM",           "valor": 0,     "meta": 1,     "unidade": "contrato", "status": "atencao", "observacao": "Contrato Organizativo de Ação Pública não assinado — pendência de SES-AM para definir responsabilidades na Rede de Atenção. Sem COAP: fluxo de referência e contrarreferência não formalizado. Paciente transferido para Humaitá/Manaus sem garantia formal de vaga ou retorno com resumo de alta"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/previne-brasil")
def previne_brasil():
    return _PREVINE_BRASIL()


@router.get("/idsus")
def idsus():
    return _IDSUS_COMPONENTES()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()