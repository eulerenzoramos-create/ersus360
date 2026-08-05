from fastapi import APIRouter
from typing import Optional
from functools import lru_cache

router = APIRouter(prefix="/api/equipamentos", tags=["equipamentos"])

@lru_cache(maxsize=1)
def _EQUIPAMENTOS():
    return [
        {
            "id": "eq01", "nome": "Autoclave Vertical 30L", "tipo": "Esterilização",
            "fabricante": "Sercon", "modelo": "SV-30", "patrimonio": "2021.001.003",
            "unidade": "UBS Central", "setor": "CME",
            "status": "operacional",
            "data_ultima_manut": "2026-04-10", "data_proxima_manut": "2026-10-10",
            "dias_prox_manut": 79, "garantia_ate": None,
            "historico": [
                {"data": "2026-04-10", "tipo": "preventiva", "descricao": "Revisão de vedação e termômetro. Calibração confirmada.", "tecnico": "José Elias", "custo": None},
                {"data": "2025-10-08", "tipo": "preventiva", "descricao": "Limpeza de câmara, troca de junta de silicone.", "tecnico": "José Elias", "custo": 320},
            ],
            "alertas": [],
        },
        {
            "id": "eq02", "nome": "Eletrocardiógrafo 12 canais", "tipo": "Diagnóstico",
            "fabricante": "Nihon Kohden", "modelo": "ECG-1350P", "patrimonio": "2020.002.001",
            "unidade": "UBS Central", "setor": "Consultório Médico",
            "status": "manutencao",
            "data_ultima_manut": "2026-07-15", "data_proxima_manut": None,
            "dias_prox_manut": None, "garantia_ate": None,
            "historico": [
                {"data": "2026-07-15", "tipo": "corretiva", "descricao": "Falha no cabo do eletrodo V4 — enviado à assistência técnica.", "tecnico": "MedTech Manaus", "custo": None},
                {"data": "2025-06-20", "tipo": "preventiva", "descricao": "Limpeza de conectores e verificação de cabos.", "tecnico": "José Elias", "custo": None},
            ],
            "alertas": ["Em manutenção corretiva", "Previsão de retorno: 30/07/2026"],
        },
        {
            "id": "eq03", "nome": "Nebulizador Compressor", "tipo": "Terapia Respiratória",
            "fabricante": "Soniclear", "modelo": "Master Elite", "patrimonio": "2022.003.004",
            "unidade": "UBS Bairro Novo", "setor": "Sala de Procedimentos",
            "status": "operacional",
            "data_ultima_manut": "2026-01-12", "data_proxima_manut": "2026-07-12",
            "dias_prox_manut": -11, "garantia_ate": None,
            "historico": [
                {"data": "2026-01-12", "tipo": "preventiva", "descricao": "Troca do filtro de ar e limpeza do compressor.", "tecnico": "José Elias", "custo": 90},
            ],
            "alertas": ["Manutenção preventiva VENCIDA (12/07/2026)"],
        },
        {
            "id": "eq04", "nome": "Glicosímetro Accucheck Active", "tipo": "Diagnóstico POC",
            "fabricante": "Roche", "modelo": "Accu-Chek Active", "patrimonio": "2023.004.002",
            "unidade": "UBS Central", "setor": "Sala de Enfermagem",
            "status": "operacional",
            "data_ultima_manut": "2026-05-20", "data_proxima_manut": "2026-11-20",
            "dias_prox_manut": 120, "garantia_ate": "2027-03-15",
            "historico": [
                {"data": "2026-05-20", "tipo": "calibracao", "descricao": "Calibração com solução padrão. Resultado dentro da margem.", "tecnico": "Enfermagem", "custo": None},
            ],
            "alertas": [],
        },
        {
            "id": "eq05", "nome": "Cadeira Odontológica Completa", "tipo": "Odontológico",
            "fabricante": "Saevo", "modelo": "Ópera SP", "patrimonio": "2019.005.001",
            "unidade": "UBS Central", "setor": "Consultório Odontológico",
            "status": "aguardando_peca",
            "data_ultima_manut": "2026-06-05", "data_proxima_manut": None,
            "dias_prox_manut": None, "garantia_ate": None,
            "historico": [
                {"data": "2026-06-05", "tipo": "corretiva", "descricao": "Motor da cadeira com falha. Peça solicitada ao fabricante (n.º OS 45892).", "tecnico": "Saevo Serviços", "custo": None},
                {"data": "2025-03-10", "tipo": "preventiva", "descricao": "Lubrificação de articulações e troca de estofado.", "tecnico": "Saevo Serviços", "custo": 750},
            ],
            "alertas": ["Aguardando peça desde 05/06/2026", "Consulta odontológica suspensa na unidade"],
        },
        {
            "id": "eq06", "nome": "Balança Pediátrica Digital", "tipo": "Antropometria",
            "fabricante": "Welmy", "modelo": "W-Baby", "patrimonio": "2023.006.001",
            "unidade": "UBS Bairro Novo", "setor": "Sala de Puericultura",
            "status": "operacional",
            "data_ultima_manut": "2026-03-01", "data_proxima_manut": "2026-09-01",
            "dias_prox_manut": 40, "garantia_ate": "2026-08-10",
            "historico": [
                {"data": "2026-03-01", "tipo": "calibracao", "descricao": "Calibração aferida pelo INMETRO — aprovada.", "tecnico": "INMETRO-AM", "custo": 180},
            ],
            "alertas": ["Garantia vence em 18 dias"],
        },
        {
            "id": "eq07", "nome": "Refrigerador de Imunobiológicos", "tipo": "Imunização",
            "fabricante": "Consul", "modelo": "CVU18", "patrimonio": "2021.007.001",
            "unidade": "UBS Central", "setor": "Sala de Vacinas",
            "status": "operacional",
            "data_ultima_manut": "2026-06-15", "data_proxima_manut": "2026-12-15",
            "dias_prox_manut": 145, "garantia_ate": None,
            "historico": [
                {"data": "2026-06-15", "tipo": "preventiva", "descricao": "Verificação de temperatura, limpeza de condensador, troca de borracha de vedação.", "tecnico": "Técnico Refrigeração", "custo": 220},
            ],
            "alertas": [],
        },
        {
            "id": "eq08", "nome": "Mesa Ginecológica", "tipo": "Ginecologia",
            "fabricante": "Biodicken", "modelo": "Master", "patrimonio": "2018.008.001",
            "unidade": "UBS Rural Zona Norte", "setor": "Consultório",
            "status": "inativo",
            "data_ultima_manut": "2024-11-10", "data_proxima_manut": None,
            "dias_prox_manut": None, "garantia_ate": None,
            "historico": [
                {"data": "2024-11-10", "tipo": "corretiva", "descricao": "Avaliação: mecanismo de regulação de altura comprometido. Laudo técnico indica descarte ou reforma.", "tecnico": "Biodicken Manaus", "custo": None},
            ],
            "alertas": ["Inativo — aguardando decisão de descarte ou reforma"],
        },
    ]


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/resumo")
def resumo():
    op  = [e for e in _EQUIPAMENTOS() if e["status"] == "operacional"]
    man = [e for e in _EQUIPAMENTOS() if e["status"] == "manutencao"]
    agu = [e for e in _EQUIPAMENTOS() if e["status"] == "aguardando_peca"]
    ina = [e for e in _EQUIPAMENTOS() if e["status"] == "inativo"]
    p30 = [e for e in _EQUIPAMENTOS() if e["dias_prox_manut"] is not None and 0 <= e["dias_prox_manut"] <= 30]
    gar = [e for e in _EQUIPAMENTOS() if e["garantia_ate"] and e["garantia_ate"] <= "2026-08-31"]
    return {
        "total":               len(_EQUIPAMENTOS()),
        "operacionais":        len(op),
        "em_manutencao":       len(man),
        "aguardando_peca":     len(agu),
        "inativos":            len(ina),
        "manut_proximos_30d":  len(p30),
        "vencendo_garantia":   len(gar),
    }

@router.get("/lista")
def lista(status: Optional[str] = None, unidade: Optional[str] = None):
    data = _EQUIPAMENTOS
    if status and status != "todos":
        data = [e for e in data if e["status"] == status]
    if unidade and unidade != "todos":
        data = [e for e in data if e["unidade"] == unidade]
    return data
