from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/rede-logistica-apui", tags=["rede_logistica_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "distancia_manaus_km": 784,
        "distancia_humaitá_km": 284,
        "acesso_principal": "BR-230 (Transamazônica) — trecho sem pavimento 320 km",
        "periodo_chuvas_restricao_meses": 4,
        "vias_internas_ramal_km": 1240,
        "ramais_intransitaveis_chuvoso_pct": 48.4,
        "comunidades_acesso_fluvial_apenas": 18,
        "frota_veiculos_saude_total": 12,
        "frota_operacional_pct": 58.4,
        "frota_manutencao_pendente": 5,
        "ambulancias_ubs": 3,
        "ambulancias_uti_movel": 0,
        "barcos_saude": 2,
        "barcos_operacionais": 1,
        "custo_frete_manaus_R_kg": 4.80,
        "custo_frete_nacional_R_kg": 1.20,
        "medicamentos_ruptura_estoque_pct": 18.4,
        "meta_ruptura_estoque_pct": 2.0,
        "medicamentos_vencidos_descartados_pct": 8.4,
        "prazo_medio_entrega_medicamentos_dias": 28,
        "meta_prazo_entrega_dias": 7,
        "cadeia_frio_salas_adequadas": 3,
        "cadeia_frio_salas_total": 8,
        "energia_eletrica_interrupção_horas_mes": 48,
        "gerador_ubs_rural": 4,
        "gerador_ubs_rural_total_sem_energia_est": 4,
        "status_frota": "critico",
        "status_abastecimento": "atencao",
        "status_acesso": "critico",
    }


@lru_cache(maxsize=1)
def _ROTAS():
    return [
        {"rota": "Apuí → Manaus (insumos, referência)",   "distancia_km": 784, "modal": "Rodoviário + aéreo", "tempo_horas": 14,  "custo_referencia_R": 2800, "restricao_chuvoso": True,  "status": "critico",  "observacao": "784 km pela BR-230 sem asfalto em 320 km. Período chuvoso (nov-mar): 4 meses com trechos intransitáveis. Alternativa: voo fretado R$ 4.800/trecho ou barco 72h pelo Rio Madeira. Medicamentos importados ou de cadeia fria: frete aéreo exclusivo"},
        {"rota": "Apuí → Humaitá (referência média compl.","distancia_km": 284, "modal": "Rodoviário",         "tempo_horas": 5,   "custo_referencia_R": 480,  "restricao_chuvoso": True,  "status": "atencao",  "observacao": "284 km pela BR-230 — 5h em boas condições, 8-12h no período chuvoso. Humaitá tem HMTJ com 40 leitos, UTI com 4 leitos (insuficiente). Destino primário de transfer: IAM, AVC, parto de alto risco, trauma"},
        {"rota": "Sede → Comunidades Ribeirinhas",         "distancia_km": 80,  "modal": "Fluvial (barco)",   "tempo_horas": 8,   "custo_referencia_R": 320,  "restricao_chuvoso": False, "status": "critico",  "observacao": "18 comunidades ribeirinhas acessíveis apenas por barco. 1 barco da saúde operacional (2 barcos, 1 em manutenção há 8 meses). Visita de saúde: 1x/mês se barco disponível. Urgência ribeirinha: agente de saúde aciona pelo rádio, aguarda barco ou familiar traz de canoe — 4-12h até chegar ao serviço"},
        {"rota": "Sede → Ramais e Assentamentos",          "distancia_km": 120, "modal": "Rodoviário (ramal)","tempo_horas": 4,   "custo_referencia_R": 240,  "restricao_chuvoso": True,  "status": "critico",  "observacao": "48,4% dos ramais intransitáveis no período chuvoso. 14 microáreas sem ACS por impossibilidade de acesso regular. Ambulância não entra em ramal com lama: urgência no ramal = familiar carrega o paciente na maca ou em redes até o asfalto"},
    ]


@lru_cache(maxsize=1)
def _INSUMOS():
    return [
        {"insumo": "Medicamentos essenciais (RENAME)",     "cobertura_pct": 81.6, "ruptura_media_dias_ano": 48, "prazo_entrega_dias": 28, "status": "atencao", "observacao": "18,4% de ruptura: desabastecimento médio de 48 dias/ano nos itens críticos (captopril, metformina, amoxicilina, omeprazol). Frete de Manaus: 4x o custo nacional. Compra emergencial por dispensa: prazo de 7-14 dias vs meta 7 dias. Licitação anual não prevê sazonalidade logística"},
        {"insumo": "Imunobiológicos (cadeia frio)",         "cobertura_pct": 87.4, "ruptura_media_dias_ano": 28, "prazo_entrega_dias": 14, "status": "atencao", "observacao": "3/8 salas de vacina com cadeia frio inadequada (sem geladeira certificada pelo PNI). Interrupção elétrica 48h/mês: 2 salas rurais sem gerador. Evento de pane em 2024: 3.840 doses perdidas (relatado em rodada anterior). Vacina perdida = novo pedido em 30-45 dias = janela de vulnerabilidade"},
        {"insumo": "Insumos diagnósticos (laboratório)",   "cobertura_pct": 72.4, "ruptura_media_dias_ano": 60, "prazo_entrega_dias": 21, "status": "critico", "observacao": "Reagentes diagnósticos com falta em 27,6% dos itens. Glicemia, hemograma, TSH, função renal: exames cotidianos com ruptura 1-2 meses/ano. LACEN-AM recebe amostras de Apuí por malote 2x/semana: resultado em 7-14 dias. Cultura com antibiograma: 21-28 dias = antibiótico empírico na maioria dos casos"},
        {"insumo": "Equipamentos de emergência (UPA/HMM)", "cobertura_pct": 64.2, "ruptura_media_dias_ano": 0,  "prazo_entrega_dias": 90, "status": "critico", "observacao": "Manutenção preventiva: inexistente por falta de técnico local. Equipamento quebra → COTER-AM (Manaus) → peça em 90-180 dias → conserto. Monitor multiparamétrico: 1 com defeito há 5 meses. Desfibrilador: 1 funcionando para HMM + UPA. ECG: única unidade com cabo danificado por 3 semanas em 2025"},
        {"insumo": "Combustível (frota / gerador)",         "cobertura_pct": 92.4, "ruptura_media_dias_ano": 12, "prazo_entrega_dias": 7,  "status": "atencao", "observacao": "Fornecimento de combustível relativamente estável (Petrobras regional). 12 dias/ano de abastecimento insuficiente por não pagamento de fatura (contingenciamento municipal). Gerador sem combustível = cadeia frio desligada = vacinas perdidas. Pior caso: 2023, 72h sem combustível em UBS rural no período chuvoso"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "frota_operacional_pct": 64.2, "ruptura_estoque_pct": 22.4, "prazo_entrega_dias": 32, "barcos_operacionais": 2},
        {"ano": "2023", "frota_operacional_pct": 62.4, "ruptura_estoque_pct": 20.4, "prazo_entrega_dias": 30, "barcos_operacionais": 1},
        {"ano": "2024", "frota_operacional_pct": 60.4, "ruptura_estoque_pct": 19.4, "prazo_entrega_dias": 29, "barcos_operacionais": 1},
        {"ano": "2025", "frota_operacional_pct": 58.4, "ruptura_estoque_pct": 18.4, "prazo_entrega_dias": 28, "barcos_operacionais": 1},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Frota operacional",                    "valor": 58.4,  "meta": 95.0,  "unidade": "%",       "status": "critico", "observacao": "5/12 veículos fora de operação. Manutenção preventiva inexistente: veículo entra na oficina quando para na estrada. Sem manutenção, frota deteriora continuamente. Custo de recuperar frota degradada é 3-4x maior do que manter preventivamente. Sem ambulância UTI-móvel = transfer de UTI em veículo comum"},
        {"indicador": "Barcos da saúde operacionais",         "valor": 1,     "meta": 2,     "unidade": "barcos",  "status": "critico", "observacao": "1/2 barcos operacional — o outro em manutenção há 8 meses por falta de peças (motor importado, prazo 90-120 dias). 18 comunidades ribeirinhas: com 1 barco, cobertura mensal só de algumas. Urgência fluvial com 1 barco: se ocupado, não há disponibilidade para segunda urgência simultânea"},
        {"indicador": "Ruptura de estoque de medicamentos",   "valor": 18.4,  "meta": 2.0,   "unidade": "%",       "status": "atencao", "observacao": "Desabastecimento em 18,4% dos itens — 48 dias/ano sem medicamento essencial. Paciente hipertenso sem captopril = crise hipertensiva = internação. Custo de 1 internação = custo de 6 meses de medicação. Compra emergencial por dispensa não resolve cronicamente — planejamento logístico anual precisa incorporar sazonalidade amazônica"},
        {"indicador": "Prazo médio de entrega de insumos",    "valor": 28,    "meta": 7,     "unidade": "dias",    "status": "atencao", "observacao": "28 dias vs meta 7 dias. Frete por BR-230: 2-3 dias em boas condições, 7-14 dias no chuvoso. Processo licitatório: especificações sem critério de logística amazônica = fornecedor de SP ganha licitação e não entrega no prazo. Multa contratual não compensa a ruptura de estoque"},
        {"indicador": "Cadeia frio adequada",                 "valor": 37.5,  "meta": 100.0, "unidade": "%",       "status": "critico", "observacao": "3/8 salas de vacina com cadeia frio certificada PNI. 5 UBS com geladeira doméstica ou sem geladeira. 48h de queda de energia/mês: sem gerador, vacina perde eficácia sem registro. 3.840 doses perdidas em 2024 = R$ 48.000 de insumo + janela de vulnerabilidade imunológica"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/rotas")
def rotas():
    return _ROTAS()


@router.get("/insumos")
def insumos():
    return _INSUMOS()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()