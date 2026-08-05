from fastapi import APIRouter
from typing import Optional
from functools import lru_cache

router = APIRouter(prefix="/api/almoxarifado", tags=["almoxarifado"])

@lru_cache(maxsize=1)
def _INSUMOS():
    return [
        {
            "id": "a01", "nome": "Luvas de Procedimento M (cx100)", "codigo": "CATMAT-390005",
            "categoria": "EPI", "unidade": "caixa",
            "estoque_atual": 12, "estoque_minimo": 20, "estoque_maximo": 80,
            "consumo_medio_mensal": 14, "meses_cobertura": 0.86,
            "lote": "LP2024-08", "validade": "2027-08-01", "dias_vencimento": 374,
            "local": "Almoxarifado Central — Prateleira A1",
            "status": "critico", "valor_unitario": 28.50,
            "ultimo_recebimento": "2026-05-10",
        },
        {
            "id": "a02", "nome": "Seringa 3mL c/ agulha 25×8 (cx100)", "codigo": "CATMAT-277556",
            "categoria": "Material Hospitalar", "unidade": "caixa",
            "estoque_atual": 0, "estoque_minimo": 15, "estoque_maximo": 60,
            "consumo_medio_mensal": 12, "meses_cobertura": 0.0,
            "lote": "—", "validade": None, "dias_vencimento": None,
            "local": "Almoxarifado Central — Prateleira B2",
            "status": "sem_estoque", "valor_unitario": 45.00,
            "ultimo_recebimento": "2026-03-15",
        },
        {
            "id": "a03", "nome": "Amoxicilina 500mg (cx500)", "codigo": "REMUME-001",
            "categoria": "Medicamento", "unidade": "caixa",
            "estoque_atual": 8, "estoque_minimo": 10, "estoque_maximo": 40,
            "consumo_medio_mensal": 6, "meses_cobertura": 1.33,
            "lote": "AMX2025-12", "validade": "2026-08-10", "dias_vencimento": 18,
            "local": "Farmácia — Armário C4",
            "status": "alerta", "valor_unitario": 32.00,
            "ultimo_recebimento": "2026-02-20",
        },
        {
            "id": "a04", "nome": "Metformina 850mg (cx30)", "codigo": "REMUME-045",
            "categoria": "Medicamento", "unidade": "caixa",
            "estoque_atual": 240, "estoque_minimo": 60, "estoque_maximo": 300,
            "consumo_medio_mensal": 55, "meses_cobertura": 4.36,
            "lote": "MF2026-01", "validade": "2028-01-01", "dias_vencimento": 527,
            "local": "Farmácia — Armário A1",
            "status": "ok", "valor_unitario": 8.50,
            "ultimo_recebimento": "2026-06-05",
        },
        {
            "id": "a05", "nome": "Losartana 50mg (cx30)", "codigo": "REMUME-028",
            "categoria": "Medicamento", "unidade": "caixa",
            "estoque_atual": 180, "estoque_minimo": 50, "estoque_maximo": 250,
            "consumo_medio_mensal": 48, "meses_cobertura": 3.75,
            "lote": "LOS2026-02", "validade": "2028-02-01", "dias_vencimento": 558,
            "local": "Farmácia — Armário A2",
            "status": "ok", "valor_unitario": 7.20,
            "ultimo_recebimento": "2026-06-05",
        },
        {
            "id": "a06", "nome": "Atorvastatina 20mg (cx30)", "codigo": "REMUME-012",
            "categoria": "Medicamento", "unidade": "caixa",
            "estoque_atual": 22, "estoque_minimo": 30, "estoque_maximo": 120,
            "consumo_medio_mensal": 28, "meses_cobertura": 0.79,
            "lote": "ATO2025-11", "validade": "2026-07-25", "dias_vencimento": 2,
            "local": "Farmácia — Armário A3",
            "status": "vencido", "valor_unitario": 14.00,
            "ultimo_recebimento": "2025-11-10",
        },
        {
            "id": "a07", "nome": "Álcool Isopropílico 70% (galão 5L)", "codigo": "CATMAT-180062",
            "categoria": "Higiene e Limpeza", "unidade": "galão",
            "estoque_atual": 18, "estoque_minimo": 10, "estoque_maximo": 40,
            "consumo_medio_mensal": 7, "meses_cobertura": 2.57,
            "lote": "ALI2026-03", "validade": "2028-03-01", "dias_vencimento": 586,
            "local": "Almoxarifado Central — Prateleira D1",
            "status": "ok", "valor_unitario": 62.00,
            "ultimo_recebimento": "2026-04-12",
        },
        {
            "id": "a08", "nome": "Sulfato Ferroso 40mg/mL (fco 30mL)", "codigo": "REMUME-062",
            "categoria": "Medicamento", "unidade": "frasco",
            "estoque_atual": 145, "estoque_minimo": 40, "estoque_maximo": 200,
            "consumo_medio_mensal": 35, "meses_cobertura": 4.14,
            "lote": "SF2026-01", "validade": "2027-06-01", "dias_vencimento": 313,
            "local": "Farmácia — Armário B1",
            "status": "ok", "valor_unitario": 4.80,
            "ultimo_recebimento": "2026-05-20",
        },
        {
            "id": "a09", "nome": "Dipirona 500mg (cx500)", "codigo": "REMUME-020",
            "categoria": "Medicamento", "unidade": "caixa",
            "estoque_atual": 3, "estoque_minimo": 20, "estoque_maximo": 80,
            "consumo_medio_mensal": 18, "meses_cobertura": 0.17,
            "lote": "DIP2025-10", "validade": "2026-09-01", "dias_vencimento": 40,
            "local": "Farmácia — Armário B2",
            "status": "critico", "valor_unitario": 22.00,
            "ultimo_recebimento": "2025-10-05",
        },
        {
            "id": "a10", "nome": "Máscara Cirúrgica Tripla (cx50)", "codigo": "CATMAT-468120",
            "categoria": "EPI", "unidade": "caixa",
            "estoque_atual": 35, "estoque_minimo": 20, "estoque_maximo": 100,
            "consumo_medio_mensal": 16, "meses_cobertura": 2.19,
            "lote": "MC2026-02", "validade": "2029-02-01", "dias_vencimento": 923,
            "local": "Almoxarifado Central — Prateleira A2",
            "status": "ok", "valor_unitario": 19.50,
            "ultimo_recebimento": "2026-05-28",
        },
        {
            "id": "a11", "nome": "Fita de Teste Glicemia (cx50)", "codigo": "CATMAT-333812",
            "categoria": "Diagnóstico POC", "unidade": "caixa",
            "estoque_atual": 6, "estoque_minimo": 8, "estoque_maximo": 30,
            "consumo_medio_mensal": 5, "meses_cobertura": 1.2,
            "lote": "FTG2026-04", "validade": "2026-08-30", "dias_vencimento": 38,
            "local": "Almoxarifado Central — Prateleira B3",
            "status": "alerta", "valor_unitario": 48.00,
            "ultimo_recebimento": "2026-04-20",
        },
        {
            "id": "a12", "nome": "Omeprazol 20mg (cx30)", "codigo": "REMUME-038",
            "categoria": "Medicamento", "unidade": "caixa",
            "estoque_atual": 92, "estoque_minimo": 25, "estoque_maximo": 120,
            "consumo_medio_mensal": 30, "meses_cobertura": 3.07,
            "lote": "OMP2026-02", "validade": "2027-12-01", "dias_vencimento": 496,
            "local": "Farmácia — Armário C1",
            "status": "ok", "valor_unitario": 9.80,
            "ultimo_recebimento": "2026-06-10",
        },
    ]


@router.get("/resumo")
def resumo():
    ok     = [i for i in _INSUMOS() if i["status"] == "ok"]
    alerta = [i for i in _INSUMOS() if i["status"] == "alerta"]
    crit   = [i for i in _INSUMOS() if i["status"] == "critico"]
    sem    = [i for i in _INSUMOS() if i["status"] == "sem_estoque"]
    venc30 = [i for i in _INSUMOS() if i["status"] in ("vencido",) or (i["dias_vencimento"] is not None and i["dias_vencimento"] <= 30)]
    valor  = sum(i["estoque_atual"] * i["valor_unitario"] for i in _INSUMOS())
    return {
        "total_itens":          len(_INSUMOS()),
        "itens_ok":             len(ok),
        "itens_alerta":         len(alerta),
        "itens_critico":        len(crit),
        "sem_estoque":          len(sem),
        "vencendo_30d":         len(venc30),
        "valor_total_estoque":  round(valor, 2),
    }

@router.get("/lista")
def lista(status: Optional[str] = None, categoria: Optional[str] = None):
    data = _INSUMOS
    if status and status != "todos":
        data = [i for i in data if i["status"] == status]
    if categoria and categoria != "todos":
        data = [i for i in data if i["categoria"] == categoria]
    return data
