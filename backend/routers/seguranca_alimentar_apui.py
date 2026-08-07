from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/seguranca-alimentar-apui", tags=["seguranca_alimentar_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "populacao_total": 18732,  # IBGE Censo 2022,
        "inseguranca_alimentar_leve_pct": 28.4,
        "inseguranca_alimentar_moderada_pct": 18.4,
        "inseguranca_alimentar_grave_pct": 8.4,
        "inseguranca_alimentar_total_pct": 55.2,
        "fome_estimada_pessoas": 2075,
        "desnutricao_cronica_criancas_5a_pct": 8.4,
        "desnutricao_aguda_criancas_pct": 2.4,
        "sobrepeso_criancas_pct": 18.4,
        "obesidade_adultos_pct": 22.4,
        "anemia_criancas_6m_2a_pct": 28.4,
        "hipovitaminose_a_criancas_pct": 14.4,
        "sisvan_cobertura_criancas_pct": 48.4,
        "sisvan_cobertura_gestantes_pct": 52.4,
        "nutricionista_municipal": 0,
        "cras_municipal": 1,
        "cras_capacidade_familias": 2500,
        "bolsa_familia_familias": 3284,
        "bolsa_familia_cobertura_estimada_pct": 84.2,
        "pnae_escolas_cobertas": 12,
        "pnae_agricultura_familiar_pct": 28.4,
        "meta_pnae_agricultura_familiar_pct": 30.0,
        "cras_acompanhamento_nutricional": False,
        "banco_alimentos_municipal": False,
        "status_inseguranca": "critico",
        "status_nutricao_infantil": "atencao",
        "status_programas": "atencao",
    }


@lru_cache(maxsize=1)
def _SISVAN():
    return [
        {"grupo": "Crianças < 5 anos",       "avaliadas_pct": 48.4, "desnutricao_cronica_pct": 8.4,  "desnutricao_aguda_pct": 2.4,  "sobrepeso_pct": 18.4, "obesidade_pct": 4.4,  "status": "atencao",
         "observacao": "51,6% das crianças < 5 anos sem monitoramento SISVAN. Desnutrição crônica (baixa estatura para idade): 8,4% — reflexo de insegurança alimentar persistente. Paradoxo: desnutrição coexiste com sobrepeso (18,4%) — evidência de transição nutricional com má qualidade alimentar"},
        {"grupo": "Crianças 5-10 anos",       "avaliadas_pct": 42.4, "desnutricao_cronica_pct": 6.4,  "desnutricao_aguda_pct": 1.4,  "sobrepeso_pct": 22.4, "obesidade_pct": 8.4,  "status": "atencao",
         "observacao": "Sobrepeso 22,4% em escola primária: alimentação ultraprocessada (biscoito, refrigerante) substituindo refeição de qualidade. PNAE: principal garantia de refeição saudável em dia de aula — fim de semana e férias sem alimentação supervisionada"},
        {"grupo": "Adolescentes (10-19 anos)","avaliadas_pct": 28.4, "desnutricao_cronica_pct": 4.4,  "desnutricao_aguda_pct": 0.8,  "sobrepeso_pct": 24.4, "obesidade_pct": 12.4, "status": "atencao",
         "observacao": "Obesidade em adolescente: tendência crescente em 4 anos. Adolescente obeso: risco de DM2 e HAS antes dos 30 anos. NASF sem nutricionista: sem grupo de educação alimentar nas escolas. Merenda escolar: 28,4% de origem da agricultura familiar — abaixo dos 30% obrigatórios"},
        {"grupo": "Gestantes",                "avaliadas_pct": 52.4, "desnutricao_cronica_pct": 0,     "desnutricao_aguda_pct": 0,    "sobrepeso_pct": 28.4, "obesidade_pct": 14.4, "status": "critico",
         "observacao": "47,6% das gestantes sem avaliação nutricional no pré-natal. Obesidade gestacional 14,4%: risco de DMG, pré-eclâmpsia, macrossomia, cesárea. Sulfato ferroso prescrito: 72,4% das gestantes recebem — anemia ferropriva em 22,4% mesmo com suplementação (adesão baixa por efeitos gastrointestinais)"},
        {"grupo": "Adultos (20-59 anos)",     "avaliadas_pct": 22.4, "desnutricao_cronica_pct": 1.8,  "desnutricao_aguda_pct": 0.4,  "sobrepeso_pct": 38.4, "obesidade_pct": 22.4, "status": "critico",
         "observacao": "22,4% com monitoramento: menor cobertura por grupo. Obesidade adulta 22,4% + HAS 22,4% + DM 9,4% = síndrome metabólica em evolução silenciosa. Sem nutricionista municipal: educação nutricional inexistente na rede. NASF com nutricionista: referência em Humaitá (284 km)"},
        {"grupo": "Idosos (60+ anos)",        "avaliadas_pct": 38.4, "desnutricao_cronica_pct": 12.4, "desnutricao_aguda_pct": 3.4,  "sobrepeso_pct": 18.4, "obesidade_pct": 8.4,  "status": "critico",
         "observacao": "Desnutrição em idoso 12,4%: maior prevalência por grupo. Sarcopenia não rastreada. Idoso frágil + desnutrido + sem suporte familiar = hospitalização de longa permanência. Serviço de alimentação para idosos (Cozinha Comunitária): não existe em Apuí. Bolsa Família não cobre idosos não-BPC"},
    ]


@lru_cache(maxsize=1)
def _PROGRAMAS():
    return [
        {"programa": "Bolsa Família",         "cobertura_pct": 84.2, "meta_pct": 95.0, "status": "atencao",
         "observacao": "15,8% dos elegíveis sem Bolsa Família — sem CPF, sem certidão, sem Cadastro Único atualizado (zona ribeirinha). CRAS: 1 unidade para 18.732 habitantes. Condicionalidades: 72,4% com acompanhamento de saúde em dia — 27,6% com pendência (consulta não realizada = suspensão do benefício = família sem renda)"},
        {"programa": "PNAE (Merenda Escolar)","cobertura_pct": 100.0,"meta_pct": 100.0,"status": "atencao",
         "observacao": "Cobertura total das 12 escolas. Agricultura familiar: 28,4% vs meta 30% (PNAE exige mínimo 30% de compra da AF). Merenda ribeirinha: transporte fluvial de alimentos precário — merenda chega com 14-21 dias de atraso após descarga em comunidade. Alimento perecível sem cadeia frio: desperdício estimado 18%"},
        {"programa": "SISVAN (monitoramento)","cobertura_pct": 48.4, "meta_pct": 80.0, "status": "critico",
         "observacao": "51,6% sem monitoramento. Sem nutricionista: antropometria delegada a ACS sem padronização. Balança pesa-bebê: 5/8 UBS com equipamento calibrado. Estadiômetro: 4/8 UBS. SISVAN-Web: 3/8 UBS com acesso regular. Dados do SISVAN de Apuí: subestimados por falta de input"},
        {"programa": "Vitamina A (suplementação)","cobertura_pct": 48.4,"meta_pct": 80.0,"status": "critico",
         "observacao": "Hipovitaminose A em 14,4% das crianças — risco de cegueira noturna e infecções graves. Suplementação semestral (6-59 meses): 48,4% de cobertura. Cápsula de vitamina A: desabastecimento médio 28 dias/ano. Zona ribeirinha: equipe não chega no intervalo semestral — criança perde a dose"},
        {"programa": "Ferro (suplementação)", "cobertura_pct": 58.4, "meta_pct": 90.0, "status": "critico",
         "observacao": "Anemia ferropriva em 28,4% das crianças < 2 anos. Sulfato ferroso: prescrito para todas as crianças 6-24 meses. Adesão real: 58,4% — sabor metálico + efeitos gastrointestinais = abandono. Ferro IV: não disponível para casos graves. Banco de leite humano: não existe — amamentação exclusiva em 42,4% (meta 50%)"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "inseg_alimentar_pct": 62.4, "desnutricao_criancas_pct": 11.4, "sisvan_cobertura_pct": 38.4, "obesidade_adultos_pct": 18.4},
        {"ano": "2023", "inseg_alimentar_pct": 60.4, "desnutricao_criancas_pct": 10.2, "sisvan_cobertura_pct": 42.4, "obesidade_adultos_pct": 19.8},
        {"ano": "2024", "inseg_alimentar_pct": 57.8, "desnutricao_criancas_pct": 9.2,  "sisvan_cobertura_pct": 45.8, "obesidade_adultos_pct": 21.4},
        {"ano": "2025", "inseg_alimentar_pct": 55.2, "desnutricao_criancas_pct": 8.4,  "sisvan_cobertura_pct": 48.4, "obesidade_adultos_pct": 22.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Insegurança alimentar total",         "valor": 55.2,  "meta": 20.0, "unidade": "%",   "status": "critico", "observacao": "Mais da metade da população em insegurança alimentar. 8,4% em insegurança grave = fome real. Apuí é produtor de castanha e pecuária, mas a população não tem acesso à sua própria produção — paradoxo amazônico. Cozinha Comunitária: solução de R$ 120k que poderia alimentar 400 famílias/dia"},
        {"indicador": "Desnutrição crônica em < 5 anos",    "valor": 8.4,   "meta": 2.5,  "unidade": "%",   "status": "critico", "observacao": "3,4x acima da meta. Baixa estatura em criança = dano irreversível ao desenvolvimento cognitivo e físico. Cada centímetro a menos de altura = 2-3% menos de renda futura (evidência econômica global). Janela de oportunidade: primeiros 1.000 dias de vida — Apuí não tem nutricionista para atuar nessa janela"},
        {"indicador": "Monitoramento SISVAN",                "valor": 48.4,  "meta": 80.0, "unidade": "%",   "status": "critico", "observacao": "51,6% sem dados. Decisão de gestão baseada em dados incompletos: 1 em cada 2 crianças sem avaliação. Nutricionista municipal viabilizaria SISVAN com cobertura 80%+ em 12 meses. Salário de 1 nutricionista: R$ 4.800/mês = R$ 57.600/ano. Custo de 1 criança desnutrida grave: R$ 14.800 em internação"},
        {"indicador": "Anemia ferropriva < 2 anos",         "valor": 28.4,  "meta": 10.0, "unidade": "%",   "status": "critico", "observacao": "2,8x a meta. Anemia no 1º ano de vida = dano ao desenvolvimento neurológico permanente. Ferro disponível mas adesão baixa (58,4%). Solução: ferro IV para casos graves + educação sobre adesão ao sulfato ferroso na consulta de puericultura"},
        {"indicador": "PNAE — agricultura familiar",         "valor": 28.4,  "meta": 30.0, "unidade": "%",   "status": "atencao", "observacao": "1,6 ponto abaixo da meta legal. PNAE compra da AF promove desenvolvimento local e qualidade da merenda. Barreiras: regularização fundiária incompleta em 62,4% dos produtores rurais de Apuí — sem DAP/CAF, não podem vender ao PNAE"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/sisvan")
def sisvan():
    return _SISVAN()


@router.get("/programas")
def programas():
    return _PROGRAMAS()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()