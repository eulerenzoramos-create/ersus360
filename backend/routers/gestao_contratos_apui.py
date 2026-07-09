from fastapi import APIRouter

router = APIRouter(prefix="/api/gestao-contratos-apui", tags=["Gestão de Contratos Apuí"])

@router.get("/dashboard")
def dashboard():
    return {
        "contratos_ativos": 28,
        "convenios_federais": 14,
        "prestadores_sus": 12,
        "contratos_irregulares": 6,
        "contratos_irregulares_pct": 21.4,
        "tempo_processamento_medio_dias": 18.4,
        "meta_processamento_dias": 10,
        "transferencias_fns_anual": 4284000.0,
        "transferencias_estado_anual": 982000.0,
        "contratos_vencidos": 4,
        "contratos_vencendo_90d": 8,
        "status_contratos": "atencao",
        "status_convenios": "atencao",
    }

@router.get("/contratos")
def contratos():
    return [
        {"contrato": "Prestação de serviços hospitalares — UPA/PA",
         "contratado": "Gestão Municipal Direta", "valor_anual": 1284000.0,
         "vigencia": "2025-12-31", "status": "vigente", "irregularidade": False},
        {"contrato": "Serviços de diagnóstico laboratorial",
         "contratado": "Laboratório Municipal Apuí", "valor_anual": 284000.0,
         "vigencia": "2025-08-31", "status": "vencendo", "irregularidade": False},
        {"contrato": "Serviços odontológicos — CEO itinerante",
         "contratado": "Clínica Odonto Ltda", "valor_anual": 184000.0,
         "vigencia": "2025-06-30", "status": "vencido", "irregularidade": True},
        {"contrato": "Transporte sanitário — TFD Manaus",
         "contratado": "Transportes Amazonas ME", "valor_anual": 384000.0,
         "vigencia": "2026-03-31", "status": "vigente", "irregularidade": True},
        {"contrato": "Serviços de imagem — RX/USG",
         "contratado": "Clínica Imagem do Sul AM", "valor_anual": 228000.0,
         "vigencia": "2025-11-30", "status": "vigente", "irregularidade": False},
        {"contrato": "Manutenção equipamentos médico-hospitalares",
         "contratado": "MedTec Norte Ltda", "valor_anual": 84000.0,
         "vigencia": "2025-10-31", "status": "vigente", "irregularidade": False},
        {"contrato": "Locação de imóvel — UBS Ramal Acará",
         "contratado": "Proprietário individual", "valor_anual": 24000.0,
         "vigencia": "2026-01-31", "status": "vigente", "irregularidade": True},
        {"contrato": "Serviços de fisioterapia complementar",
         "contratado": "Clínica Fisiomais Apuí", "valor_anual": 64800.0,
         "vigencia": "2025-07-31", "status": "vencendo", "irregularidade": False},
    ]

@router.get("/convenios")
def convenios():
    return [
        {"convenio": "PAB — Piso Atenção Básica (Emendas/DAB)",
         "orgao": "MS/DAB", "repasse_anual": 1284000.0,
         "situacao": "regular", "vigencia": "continuado", "status": "ok"},
        {"convenio": "IDSUS/PMAQ — Qualidade APS",
         "orgao": "MS/DAB", "repasse_anual": 184000.0,
         "situacao": "regular", "vigencia": "2025-12-31", "status": "ok"},
        {"convenio": "FNS Vigilância Epidemiológica",
         "orgao": "MS/SVS", "repasse_anual": 228000.0,
         "situacao": "regular", "vigencia": "continuado", "status": "ok"},
        {"convenio": "Rede Cegonha — Materno-Infantil",
         "orgao": "MS/SCTIE", "repasse_anual": 184000.0,
         "situacao": "pendência documental", "vigencia": "2025-09-30", "status": "atencao"},
        {"convenio": "CAPS I — Custeio Saúde Mental",
         "orgao": "MS/SCTIE", "repasse_anual": 284000.0,
         "situacao": "regular", "vigencia": "continuado", "status": "ok"},
        {"convenio": "Emenda Parlamentar — Equipamentos UBS",
         "orgao": "Dep. Fed. AM", "repasse_anual": 384000.0,
         "situacao": "execução parcial", "vigencia": "2025-12-31", "status": "atencao"},
        {"convenio": "FUNASA — Saneamento Área Rural",
         "orgao": "FUNASA/SESAI", "repasse_anual": 284000.0,
         "situacao": "prestação de contas pendente", "vigencia": "2026-06-30", "status": "critico"},
        {"convenio": "SES/AM — Média e Alta Complexidade",
         "orgao": "SES Amazonas", "repasse_anual": 350000.0,
         "situacao": "regular", "vigencia": "continuado", "status": "ok"},
    ]

@router.get("/historico")
def historico():
    return [
        {"ano": 2022, "contratos_ativos": 22, "convenios": 11, "irregulares_pct": 31.8, "processamento_dias": 24.4},
        {"ano": 2023, "contratos_ativos": 24, "convenios": 12, "irregulares_pct": 28.2, "processamento_dias": 22.8},
        {"ano": 2024, "contratos_ativos": 26, "convenios": 13, "irregulares_pct": 24.4, "processamento_dias": 20.4},
        {"ano": 2025, "contratos_ativos": 28, "convenios": 14, "irregulares_pct": 21.4, "processamento_dias": 18.4},
    ]

@router.get("/indicadores")
def indicadores():
    return [
        {"indicador": "Contratos com irregularidades", "valor": 21.4, "unidade": "%", "meta": 5, "status": "atencao",
         "observacao": "6 de 28 contratos ativos com pendência documental ou de prestação de contas."},
        {"indicador": "Tempo médio de processamento", "valor": 18.4, "unidade": "dias", "meta": 10, "status": "atencao",
         "observacao": "Prazo legal de 10 dias não cumprido. Gargalo na análise jurídica."},
        {"indicador": "Contratos vencidos", "valor": 4, "unidade": "contratos", "meta": 0, "status": "critico",
         "observacao": "4 contratos expirados sem renovação. Serviços continuados sem cobertura legal."},
        {"indicador": "Repasse FNS total anual", "valor": 4284000, "unidade": "R$", "meta": None, "status": "ok",
         "observacao": "R$ 4.284.000 transferidos pelo FNS em 2025. Execução: 82,4%."},
        {"indicador": "Convênios com pendências", "valor": 2, "unidade": "convênios", "meta": 0, "status": "atencao",
         "observacao": "FUNASA e Rede Cegonha com prestação de contas pendente ou documentação incompleta."},
    ]
