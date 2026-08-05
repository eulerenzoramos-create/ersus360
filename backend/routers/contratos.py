from fastapi import APIRouter
from typing import Optional
from functools import lru_cache

router = APIRouter(prefix="/api/contratos", tags=["contratos"])

@lru_cache(maxsize=1)
def _CONTRATOS():
    return [
        {
            "id": "ct01", "numero": "CT-001/2026",
            "objeto": "Prestação de serviços médicos especializados (clínica médica e ginecologia)",
            "contratado": "Clínica Saúde Plena Ltda.", "cnpj": "12.345.678/0001-90",
            "modalidade": "Credenciamento", "tipo": "Serviços Especializados",
            "valor_total": 480000.00, "valor_executado": 196000.00,
            "data_inicio": "01/01/2026", "data_fim": "31/12/2026", "dias_vencimento": 160,
            "status": "vigente", "fiscal": "Ana Beatriz Silva", "aditivos": 0,
            "descricao_servico": "Consultas especializadas em clínica médica (300/mês) e ginecologia (100/mês) para usuários do SUS.",
            "alertas": [],
        },
        {
            "id": "ct02", "numero": "CT-002/2026",
            "objeto": "Fornecimento de medicamentos da RENAME",
            "contratado": "Distribuidora Farma Norte Ltda.", "cnpj": "23.456.789/0001-01",
            "modalidade": "Pregão Eletrônico nº 03/2026", "tipo": "Aquisição de Medicamentos",
            "valor_total": 320000.00, "valor_executado": 148000.00,
            "data_inicio": "15/02/2026", "data_fim": "14/02/2027", "dias_vencimento": 206,
            "status": "vigente", "fiscal": "Carlos Mendes", "aditivos": 1,
            "descricao_servico": "Fornecimento parcelado de medicamentos constantes na RENAME e REMUME de Apuí/AM.",
            "alertas": ["Aditivo nº 1 registrado em 10/05/2026 — acréscimo de 15%"],
        },
        {
            "id": "ct03", "numero": "CT-003/2025",
            "objeto": "Manutenção preventiva e corretiva de equipamentos médico-hospitalares",
            "contratado": "MedTech Serviços AM Ltda.", "cnpj": "34.567.890/0001-12",
            "modalidade": "Dispensa de Licitação (art. 75 Lei 14.133/2021)", "tipo": "Manutenção de Equipamentos",
            "valor_total": 96000.00, "valor_executado": 88000.00,
            "data_inicio": "01/07/2025", "data_fim": "30/06/2026", "dias_vencimento": -24,
            "status": "vencido", "fiscal": "Rodrigo Lima", "aditivos": 0,
            "descricao_servico": "Manutenção preventiva semestral e corretiva sob demanda de equipamentos odontológicos, cardiológicos e laboratoriais.",
            "alertas": ["Contrato VENCIDO em 30/06/2026 — renovação pendente", "Equipamento ECG em manutenção sem cobertura contratual"],
        },
        {
            "id": "ct04", "numero": "CT-004/2026",
            "objeto": "Serviços de laboratório de análises clínicas",
            "contratado": "Laboratório Diagnose Amazônia Ltda.", "cnpj": "45.678.901/0001-23",
            "modalidade": "Credenciamento", "tipo": "Serviços Diagnósticos",
            "valor_total": 240000.00, "valor_executado": 98000.00,
            "data_inicio": "01/01/2026", "data_fim": "31/07/2026", "dias_vencimento": 7,
            "status": "vencendo", "fiscal": "Ana Beatriz Silva", "aditivos": 2,
            "descricao_servico": "Realização de exames laboratoriais (hemograma, glicemia, lipidograma, parasitológico, PCR malária, urina tipo I) para usuários do SUS.",
            "alertas": ["Vence em 7 dias — renovação/aditivo urgente"],
        },
        {
            "id": "ct05", "numero": "CT-005/2026",
            "objeto": "Locação de veículo tipo van para transporte sanitário",
            "contratado": "Transportes JB Apuí ME", "cnpj": "56.789.012/0001-34",
            "modalidade": "Pregão Eletrônico nº 05/2026", "tipo": "Transporte Sanitário",
            "valor_total": 144000.00, "valor_executado": 72000.00,
            "data_inicio": "01/01/2026", "data_fim": "31/12/2026", "dias_vencimento": 160,
            "status": "vigente", "fiscal": "Fernanda Costa", "aditivos": 0,
            "descricao_servico": "Locação de 1 van 15 lugares para transporte de pacientes a consultas especializadas em Humaitá/AM e Manaus/AM.",
            "alertas": [],
        },
        {
            "id": "ct06", "numero": "CT-006/2025",
            "objeto": "Serviços de desinsetização e desratização das unidades de saúde",
            "contratado": "Controle Ambiental Norte ME", "cnpj": "67.890.123/0001-45",
            "modalidade": "Dispensa de Licitação", "tipo": "Serviços de Vigilância Sanitária",
            "valor_total": 18000.00, "valor_executado": 18000.00,
            "data_inicio": "01/01/2025", "data_fim": "31/12/2025", "dias_vencimento": -205,
            "status": "encerrado", "fiscal": "Rodrigo Lima", "aditivos": 0,
            "descricao_servico": "Desinsetização e desratização trimestral das 4 UBS, CAPS AD e almoxarifado central do FMS de Apuí/AM.",
            "alertas": [],
        },
        {
            "id": "ct07", "numero": "CT-007/2026",
            "objeto": "Fornecimento de materiais de consumo odontológico",
            "contratado": "Dental Sul Distribuidora Ltda.", "cnpj": "78.901.234/0001-56",
            "modalidade": "Pregão Eletrônico nº 07/2026", "tipo": "Aquisição de Materiais",
            "valor_total": 64800.00, "valor_executado": 22100.00,
            "data_inicio": "01/03/2026", "data_fim": "28/02/2027", "dias_vencimento": 220,
            "status": "vigente", "fiscal": "Fernanda Costa", "aditivos": 0,
            "descricao_servico": "Aquisição parcelada de materiais odontológicos (resinas, cimentos, luvas, máscaras, agulhas) para as ESB do município.",
            "alertas": [],
        },
    ]


@router.get("/resumo")
def resumo():
    vigentes  = [c for c in _CONTRATOS() if c["status"] == "vigente"]
    vencendo  = [c for c in _CONTRATOS() if c["status"] == "vencendo"]
    vencidos  = [c for c in _CONTRATOS() if c["status"] == "vencido"]
    suspensos = [c for c in _CONTRATOS() if c["status"] == "suspenso"]
    val_total = sum(c["valor_total"]     for c in _CONTRATOS() if c["status"] != "encerrado")
    val_exec  = sum(c["valor_executado"] for c in _CONTRATOS() if c["status"] != "encerrado")
    return {
        "total":                 len(_CONTRATOS()),
        "vigentes":              len(vigentes),
        "vencendo_30d":          len(vencendo),
        "vencidos":              len(vencidos),
        "suspensos":             len(suspensos),
        "valor_total_carteira":  val_total,
        "valor_executado_total": val_exec,
    }

@router.get("/lista")
def lista(status: Optional[str] = None):
    data = _CONTRATOS
    if status and status != "todos":
        data = [c for c in data if c["status"] == status]
    return data
