"""
Assistência Farmacêutica Básica — REMUME / HÓRUS / Dispensação
FMS Apuí/AM · Componente Básico
"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/farmacia-basica", tags=["Assistência Farmacêutica"])

@lru_cache(maxsize=1)
def _MEDICAMENTOS():
    return [
        # Componente Básico — REMUME Apuí
        {"id":1,  "principio":"Amoxicilina 500mg",         "forma":"cápsulas","estoque":3200,"estoque_min":500, "consumo_mes":480, "validade":"2026-12-31","status":"ok",      "grupo":"Antibiótico",       "programa":"PAB"},
        {"id":2,  "principio":"Amoxicilina + Clavulanato",  "forma":"comprimidos","estoque":180,"estoque_min":100,"consumo_mes":95, "validade":"2026-09-30","status":"ok",      "grupo":"Antibiótico",       "programa":"PAB"},
        {"id":3,  "principio":"Azitromicina 500mg",         "forma":"comprimidos","estoque":640,"estoque_min":200,"consumo_mes":210,"validade":"2026-11-30","status":"ok",      "grupo":"Antibiótico",       "programa":"PAB"},
        {"id":4,  "principio":"Metformina 850mg",           "forma":"comprimidos","estoque":8400,"estoque_min":1000,"consumo_mes":1200,"validade":"2027-02-28","status":"ok",   "grupo":"Diabetes",          "programa":"Hiperdia"},
        {"id":5,  "principio":"Glibenclamida 5mg",          "forma":"comprimidos","estoque":2100,"estoque_min":600,"consumo_mes":650,"validade":"2026-10-31","status":"ok",     "grupo":"Diabetes",          "programa":"Hiperdia"},
        {"id":6,  "principio":"Insulina NPH 100UI/mL",      "forma":"frascos",   "estoque":82, "estoque_min":30, "consumo_mes":28, "validade":"2026-08-31","status":"ok",      "grupo":"Diabetes",          "programa":"Hiperdia"},
        {"id":7,  "principio":"Enalapril 10mg",             "forma":"comprimidos","estoque":9800,"estoque_min":1500,"consumo_mes":1800,"validade":"2027-01-31","status":"ok",   "grupo":"Anti-hipertensivo", "programa":"Hiperdia"},
        {"id":8,  "principio":"Losartana 50mg",             "forma":"comprimidos","estoque":4200,"estoque_min":800,"consumo_mes":960,"validade":"2026-12-31","status":"ok",     "grupo":"Anti-hipertensivo", "programa":"Hiperdia"},
        {"id":9,  "principio":"Hidroclorotiazida 25mg",     "forma":"comprimidos","estoque":5100,"estoque_min":900,"consumo_mes":1050,"validade":"2027-03-31","status":"ok",    "grupo":"Anti-hipertensivo", "programa":"Hiperdia"},
        {"id":10, "principio":"Atorvastatina 20mg",         "forma":"comprimidos","estoque":3600,"estoque_min":700,"consumo_mes":820,"validade":"2026-11-30","status":"ok",     "grupo":"Cardiovascular",    "programa":"Hiperdia"},
        {"id":11, "principio":"AAS 100mg",                  "forma":"comprimidos","estoque":4800,"estoque_min":800,"consumo_mes":920,"validade":"2027-01-31","status":"ok",     "grupo":"Cardiovascular",    "programa":"PAB"},
        {"id":12, "principio":"Omeprazol 20mg",             "forma":"cápsulas",  "estoque":2200,"estoque_min":500,"consumo_mes":580,"validade":"2026-10-31","status":"ok",     "grupo":"Gastrointestinal",  "programa":"PAB"},
        {"id":13, "principio":"Dipirona 500mg",             "forma":"comprimidos","estoque":6400,"estoque_min":1000,"consumo_mes":1200,"validade":"2026-12-31","status":"ok",   "grupo":"Analgésico",        "programa":"PAB"},
        {"id":14, "principio":"Ibuprofeno 600mg",           "forma":"comprimidos","estoque":1800,"estoque_min":400,"consumo_mes":460,"validade":"2026-09-30","status":"ok",     "grupo":"Anti-inflamatório", "programa":"PAB"},
        {"id":15, "principio":"Salbutamol spray",           "forma":"frascos",   "estoque":48, "estoque_min":20, "consumo_mes":18, "validade":"2026-08-31","status":"ok",      "grupo":"Respiratório",      "programa":"PAB"},
        {"id":16, "principio":"Beclometasona spray",        "forma":"frascos",   "estoque":22, "estoque_min":15, "consumo_mes":12, "validade":"2026-07-31","status":"atencao", "grupo":"Respiratório",      "programa":"PAB"},
        {"id":17, "principio":"Levotiroxina 50mcg",         "forma":"comprimidos","estoque":1100,"estoque_min":200,"consumo_mes":240,"validade":"2026-10-31","status":"ok",    "grupo":"Tireóide",          "programa":"PAB"},
        {"id":18, "principio":"Sulfato Ferroso 40mg",       "forma":"comprimidos","estoque":2800,"estoque_min":600,"consumo_mes":680,"validade":"2026-12-31","status":"ok",    "grupo":"Hematológico",      "programa":"PAB"},
        {"id":19, "principio":"Ácido Fólico 5mg",           "forma":"comprimidos","estoque":1600,"estoque_min":300,"consumo_mes":350,"validade":"2027-02-28","status":"ok",    "grupo":"Hematológico",      "programa":"PAB"},
        {"id":20, "principio":"Haloperidol 5mg",            "forma":"comprimidos","estoque":180, "estoque_min":50,"consumo_mes":55,"validade":"2026-11-30","status":"ok",      "grupo":"Psiquiátrico",      "programa":"RAPS"},
        {"id":21, "principio":"Carbamazepina 200mg",        "forma":"comprimidos","estoque":520, "estoque_min":100,"consumo_mes":120,"validade":"2026-09-30","status":"ok",    "grupo":"Psiquiátrico",      "programa":"RAPS"},
        {"id":22, "principio":"Clonazepam 2mg",             "forma":"comprimidos","estoque":95,  "estoque_min":80,"consumo_mes":88,"validade":"2026-08-31","status":"critico", "grupo":"Psiquiátrico",      "programa":"RAPS"},
        {"id":23, "principio":"Doxiciclina 100mg",          "forma":"comprimidos","estoque":340, "estoque_min":100,"consumo_mes":60,"validade":"2026-11-30","status":"ok",     "grupo":"Malária",           "programa":"PNCM"},
        {"id":24, "principio":"Cloroquina 150mg",           "forma":"comprimidos","estoque":820, "estoque_min":200,"consumo_mes":90,"validade":"2027-01-31","status":"ok",     "grupo":"Malária",           "programa":"PNCM"},
        {"id":25, "principio":"Primaquina 15mg",            "forma":"comprimidos","estoque":640, "estoque_min":150,"consumo_mes":80,"validade":"2026-12-31","status":"ok",     "grupo":"Malária",           "programa":"PNCM"},
    ]


@lru_cache(maxsize=1)
def _DISPENSACAO_MENSAL():
    return [
        {"mes":"Nov/25","receitas":1820,"itens_disp":4210,"valor":18400},
        {"mes":"Dez/25","receitas":1650,"itens_disp":3890,"valor":16800},
        {"mes":"Jan/26","receitas":1940,"itens_disp":4480,"valor":19200},
        {"mes":"Fev/26","receitas":1780,"itens_disp":4120,"valor":17600},
        {"mes":"Mar/26","receitas":2010,"itens_disp":4650,"valor":20100},
        {"mes":"Abr/26","receitas":1870,"itens_disp":4320,"valor":18700},
    ]


@lru_cache(maxsize=1)
def _PROGRAMAS():
    return [
        {"programa":"Hiperdia",  "pacientes":1248,"itens_mes":5820,"cobertura_pct":82.4,"meta_pct":90},
        {"programa":"Diabetes",  "pacientes":486, "itens_mes":1940,"cobertura_pct":78.2,"meta_pct":90},
        {"programa":"RAPS",      "pacientes":64,  "itens_mes":260, "cobertura_pct":91.4,"meta_pct":95},
        {"programa":"PNCM",      "pacientes":138, "itens_mes":410, "cobertura_pct":99.1,"meta_pct":100},
        {"programa":"Saúde Mulher","pacientes":892,"itens_mes":1780,"cobertura_pct":85.6,"meta_pct":90},
    ]


@router.get("/dashboard")
async def dashboard():
    criticos = [m["principio"] for m in _MEDICAMENTOS() if m["status"] in ("critico","atencao")]
    proximos_vencer = [m for m in _MEDICAMENTOS() if m["validade"] <= "2026-08-31"]
    total_itens = len(_MEDICAMENTOS())
    ok_count    = sum(1 for m in _MEDICAMENTOS() if m["status"] == "ok")
    return {
        "competencia":        "Abr/2026",
        "total_medicamentos": total_itens,
        "itens_ok":           ok_count,
        "itens_criticos":     sum(1 for m in _MEDICAMENTOS() if m["status"] == "critico"),
        "itens_atencao":      sum(1 for m in _MEDICAMENTOS() if m["status"] == "atencao"),
        "receitas_mes":       _DISPENSACAO_MENSAL()[-1]["receitas"],
        "itens_dispensados_mes": _DISPENSACAO_MENSAL()[-1]["itens_disp"],
        "valor_dispensado_mes":  _DISPENSACAO_MENSAL()[-1]["valor"],
        "itens_criticos_lista": criticos,
        "proximos_vencer":    [m["principio"] for m in proximos_vencer],
        "historico_dispensacao": _DISPENSACAO_MENSAL(),
        "taxa_disponibilidade": round(ok_count / total_itens * 100, 1),
    }

@router.get("/estoque")
async def estoque():
    return sorted(_MEDICAMENTOS(), key=lambda x: (x["status"] != "critico", x["status"] != "atencao", x["principio"]))

@router.get("/dispensacao")
async def dispensacao():
    return _DISPENSACAO_MENSAL()

@router.get("/programas")
async def programas():
    return _PROGRAMAS()