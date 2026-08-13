"""
Router: /api/atencao-domiciliar — ERSUS 360
Dados de referência municipal — Apuí/AM
SAD/EMAD · Portaria GM/MS nº 825/2016
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/atencao-domiciliar", tags=["Atenção Domiciliar"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "competencia": "Mar/2026",
        "pacientes_ativos": 43,
        "ad1": 26,
        "ad2": 13,
        "ad3": 4,
        "com_alerta": 5,
        "visitas_mes": 214,
        "procedimentos_mes": 318,
        "historico": [
            {"mes": "Out/25", "visitas_domiciliares": 188, "procedimentos": 271},
            {"mes": "Nov/25", "visitas_domiciliares": 196, "procedimentos": 284},
            {"mes": "Dez/25", "visitas_domiciliares": 178, "procedimentos": 258},
            {"mes": "Jan/26", "visitas_domiciliares": 202, "procedimentos": 298},
            {"mes": "Fev/26", "visitas_domiciliares": 208, "procedimentos": 308},
            {"mes": "Mar/26", "visitas_domiciliares": 214, "procedimentos": 318},
        ],
    }


@router.get("/pacientes")
async def pacientes():
    return [
        {"situacao_dado": "referencia_municipal", "id": 1, "nome": "M.A.S.", "idade": 78, "modalidade": "AD3", "cid": "G35", "equipe": "EMAD Apuí", "cuidador": "Familiar", "dias_programa": 142, "visitas_mes": 8, "alerta": "Úlcera por pressão grau II"},
        {"situacao_dado": "referencia_municipal", "id": 2, "nome": "J.R.F.", "idade": 82, "modalidade": "AD3", "cid": "I63", "equipe": "EMAD Apuí", "cuidador": "Familiar", "dias_programa": 98, "visitas_mes": 8, "alerta": "Disfagia grave — risco broncoaspiração"},
        {"situacao_dado": "referencia_municipal", "id": 3, "nome": "A.C.M.", "idade": 71, "modalidade": "AD3", "cid": "C80", "equipe": "EMAD Apuí", "cuidador": "Cuidador contratado", "dias_programa": 64, "visitas_mes": 6, "alerta": None},
        {"situacao_dado": "referencia_municipal", "id": 4, "nome": "L.S.P.", "idade": 66, "modalidade": "AD3", "cid": "N18", "equipe": "EMAD Apuí", "cuidador": "Familiar", "dias_programa": 210, "visitas_mes": 8, "alerta": "Diálise peritoneal — cateter com sinal flogístico"},
        {"situacao_dado": "referencia_municipal", "id": 5, "nome": "R.O.N.", "idade": 58, "modalidade": "AD2", "cid": "J44", "equipe": "EMAD Apuí", "cuidador": "Familiar", "dias_programa": 76, "visitas_mes": 4, "alerta": "SpO2 < 92% — O2 domiciliar disponível"},
        {"situacao_dado": "referencia_municipal", "id": 6, "nome": "E.B.T.", "idade": 74, "modalidade": "AD2", "cid": "I50", "equipe": "EMAD Apuí", "cuidador": "Familiar", "dias_programa": 54, "visitas_mes": 4, "alerta": None},
        {"situacao_dado": "referencia_municipal", "id": 7, "nome": "D.F.A.", "idade": 69, "modalidade": "AD2", "cid": "E11", "equipe": "EMAD Apuí", "cuidador": "Familiar", "dias_programa": 118, "visitas_mes": 4, "alerta": None},
        {"situacao_dado": "referencia_municipal", "id": 8, "nome": "C.M.V.", "idade": 81, "modalidade": "AD2", "cid": "M05", "equipe": "EMAD Apuí", "cuidador": "Cuidador voluntário", "dias_programa": 42, "visitas_mes": 3, "alerta": None},
        {"situacao_dado": "referencia_municipal", "id": 9, "nome": "V.R.S.", "idade": 72, "modalidade": "AD1", "cid": "I10", "equipe": "ESF Central", "cuidador": "Auto-cuidado", "dias_programa": 228, "visitas_mes": 2, "alerta": None},
        {"situacao_dado": "referencia_municipal", "id": 10, "nome": "T.A.L.", "idade": 65, "modalidade": "AD1", "cid": "E14", "equipe": "ESF Rio Juma", "cuidador": "Auto-cuidado", "dias_programa": 185, "visitas_mes": 2, "alerta": None},
    ]


@router.get("/equipe")
async def equipe():
    return {
        "situacao_dado": "referencia_municipal",
        "nome": "EMAD Apuí — Equipe Multiprofissional de Atenção Domiciliar",
        "transporte": "Veículo SMS + Barco para zona ribeirinha",
        "area_abrangencia": "Município de Apuí/AM — área urbana e comunidades ribeirinhas do Rio Madeira",
        "composicao": [
            {"profissional": "Médico Clínico", "carga_horaria": "20h/semana", "vinculo": "Concursado"},
            {"profissional": "Enfermeiro", "carga_horaria": "40h/semana", "vinculo": "Concursado"},
            {"profissional": "Fisioterapeuta", "carga_horaria": "20h/semana", "vinculo": "Contrato temporário"},
            {"profissional": "Auxiliar de Enfermagem", "carga_horaria": "40h/semana", "vinculo": "Concursado"},
            {"profissional": "Assistente Social", "carga_horaria": "20h/semana", "vinculo": "Concursado"},
            {"profissional": "Motorista/Barqueiro", "carga_horaria": "40h/semana", "vinculo": "Terceirizado"},
        ],
    }


@router.get("/producao")
async def producao():
    return [
        {"situacao_dado": "referencia_municipal", "mes": "Out/25", "visitas_domiciliares": 188, "procedimentos": 271, "ad1": 24, "ad2": 12, "ad3": 3, "altas": 2, "obitos": 1},
        {"situacao_dado": "referencia_municipal", "mes": "Nov/25", "visitas_domiciliares": 196, "procedimentos": 284, "ad1": 25, "ad2": 12, "ad3": 4, "altas": 1, "obitos": 0},
        {"situacao_dado": "referencia_municipal", "mes": "Dez/25", "visitas_domiciliares": 178, "procedimentos": 258, "ad1": 23, "ad2": 11, "ad3": 3, "altas": 3, "obitos": 1},
        {"situacao_dado": "referencia_municipal", "mes": "Jan/26", "visitas_domiciliares": 202, "procedimentos": 298, "ad1": 25, "ad2": 13, "ad3": 4, "altas": 2, "obitos": 0},
        {"situacao_dado": "referencia_municipal", "mes": "Fev/26", "visitas_domiciliares": 208, "procedimentos": 308, "ad1": 26, "ad2": 13, "ad3": 4, "altas": 1, "obitos": 1},
        {"situacao_dado": "referencia_municipal", "mes": "Mar/26", "visitas_domiciliares": 214, "procedimentos": 318, "ad1": 26, "ad2": 13, "ad3": 4, "altas": 2, "obitos": 0},
    ]
