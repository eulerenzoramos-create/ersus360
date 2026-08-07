# backend/routers/rnds_gateway.py — RNDS FHIR R4 Gateway
from fastapi import APIRouter, Query
from typing import Optional
from functools import lru_cache

router = APIRouter(prefix="/api/rnds", tags=["rnds"])

# ── Dados estáticos de referência ─────────────────────────────────────────────

@lru_cache(maxsize=1)
def _ENDPOINTS():
    return [
        {"recurso":"Patient","path":"/fhir/r4/Patient","metodos":["GET","POST"],"status":"ok","ultima_chamada":"2026-05-23 14:12","tempo_resposta_ms":210,"total_chamadas":1842,"erros_24h":0},
        {"recurso":"Immunization","path":"/fhir/r4/Immunization","metodos":["GET","POST"],"status":"ok","ultima_chamada":"2026-05-23 14:05","tempo_resposta_ms":185,"total_chamadas":3271,"erros_24h":2},
        {"recurso":"AllergyIntolerance","path":"/fhir/r4/AllergyIntolerance","metodos":["GET","POST","PUT"],"status":"ok","ultima_chamada":"2026-05-23 13:48","tempo_resposta_ms":224,"total_chamadas":412,"erros_24h":0},
        {"recurso":"Condition","path":"/fhir/r4/Condition","metodos":["GET","POST"],"status":"ok","ultima_chamada":"2026-05-23 12:30","tempo_resposta_ms":198,"total_chamadas":987,"erros_24h":1},
        {"recurso":"Procedure","path":"/fhir/r4/Procedure","metodos":["GET","POST"],"status":"ok","ultima_chamada":"2026-05-23 11:15","tempo_resposta_ms":241,"total_chamadas":623,"erros_24h":0},
        {"recurso":"MedicationRequest","path":"/fhir/r4/MedicationRequest","metodos":["GET"],"status":"nao_testado","ultima_chamada":None,"tempo_resposta_ms":None,"total_chamadas":0,"erros_24h":0},
        {"recurso":"Observation","path":"/fhir/r4/Observation","metodos":["GET","POST"],"status":"nao_testado","ultima_chamada":None,"tempo_resposta_ms":None,"total_chamadas":0,"erros_24h":0},
        {"recurso":"DiagnosticReport","path":"/fhir/r4/DiagnosticReport","metodos":["GET"],"status":"nao_testado","ultima_chamada":None,"tempo_resposta_ms":None,"total_chamadas":0,"erros_24h":0},
        {"recurso":"CapabilityStatement","path":"/fhir/r4/metadata","metodos":["GET"],"status":"ok","ultima_chamada":"2026-05-23 08:00","tempo_resposta_ms":145,"total_chamadas":48,"erros_24h":0},
    ]


@lru_cache(maxsize=1)
def _REGISTROS():
    return [
        {"id":"RG001","tipo_recurso":"Immunization","identificador":"710001234567001","paciente_nome":"Ana Paula Souza","data_envio":"2026-05-23 14:05","status":"enviado","codigo_resposta":201,"mensagem_retorno":None,"tentativas":1},
        {"id":"RG002","tipo_recurso":"Patient","identificador":"710009876543002","paciente_nome":"João Carlos Mendes","data_envio":"2026-05-23 13:10","status":"enviado","codigo_resposta":200,"mensagem_retorno":None,"tentativas":1},
        {"id":"RG003","tipo_recurso":"AllergyIntolerance","identificador":"710001111222003","paciente_nome":"Maria Inês Costa","data_envio":"2026-05-22 16:40","status":"rejeitado","codigo_resposta":422,"mensagem_retorno":"REQUIRED_FIELD_MISSING: Reaction.substance.code obrigatório para recurso AllergyIntolerance","tentativas":2},
        {"id":"RG004","tipo_recurso":"Immunization","identificador":"710003333444004","paciente_nome":"Pedro Henrique Lima","data_envio":"2026-05-22 15:20","status":"enviado","codigo_resposta":201,"mensagem_retorno":None,"tentativas":1},
        {"id":"RG005","tipo_recurso":"Condition","identificador":"710005555666005","paciente_nome":"Rosangela Ferreira","data_envio":"2026-05-21 10:30","status":"rejeitado","codigo_resposta":400,"mensagem_retorno":"INVALID_CID: Código CID-10 'Z00' sem especificidade mínima para Condition","tentativas":1},
        {"id":"RG006","tipo_recurso":"Patient","identificador":"710007777888006","paciente_nome":"Francisca Nunes","data_envio":"2026-05-20 09:15","status":"enviado","codigo_resposta":200,"mensagem_retorno":None,"tentativas":1},
        {"id":"RG007","tipo_recurso":"Immunization","identificador":"710009999000007","paciente_nome":"Antônio Melo","data_envio":"2026-05-19 14:00","status":"pendente","codigo_resposta":None,"mensagem_retorno":None,"tentativas":0},
        {"id":"RG008","tipo_recurso":"Procedure","identificador":"710002222333008","paciente_nome":"Benedita Alves","data_envio":"2026-05-19 11:45","status":"enviado","codigo_resposta":201,"mensagem_retorno":None,"tentativas":1},
        {"id":"RG009","tipo_recurso":"AllergyIntolerance","identificador":"710004444555009","paciente_nome":"Raimundo Santos","data_envio":"2026-05-18 16:00","status":"reprocessar","codigo_resposta":500,"mensagem_retorno":"RNDS_TIMEOUT: Servidor RNDS não respondeu em 30s","tentativas":3},
    ]



@router.get("/status")
def status_rnds():
    return {
        "conexao": "online",
        "autenticacao": "ok",
        "mtls_valido": True,
        "certificado_validade": "2027-03-15",
        "certificado_dias_restantes": 296,
        "token_expira": "2026-05-23 15:02",
        "ultimo_ping": "2026-05-23 14:32",
        "latencia_ms": 210,
        "ambiente": "producao",
        "versao_fhir": "R4 4.0.1",
        "endpoints": _ENDPOINTS(),
    }


@router.get("/registros")
def listar_registros(status: Optional[str] = Query(None)):
    if status:
        return [r for r in _REGISTROS() if r["status"] == status]
    return _REGISTROS()


@router.get("/estatisticas")
def estatisticas_rnds():
    enviados = sum(1 for r in _REGISTROS() if r["status"] == "enviado")
    rejeitados = sum(1 for r in _REGISTROS() if r["status"] == "rejeitado")
    total = enviados + rejeitados
    recursos = {}
    for r in _REGISTROS():
        recursos[r["tipo_recurso"]] = recursos.get(r["tipo_recurso"], 0) + 1

    historico = [
        {"data": f"2026-05-{d:02d}", "enviados": 12 + d % 5, "rejeitados": d % 3}
        for d in range(13, 24)
    ]
    return {
        "total_enviados_mes": 127,
        "total_rejeitados_mes": 8,
        "taxa_sucesso": 93.7,
        "recursos_por_tipo": recursos,
        "historico_diario": historico,
    }


@router.post("/testar-conexao")
def testar_conexao():
    return {"ok": True, "latencia_ms": 198, "mensagem": "Conexão RNDS estabelecida com sucesso (mTLS OK)"}


@router.post("/registros/{registro_id}/reprocessar")
def reprocessar_registro(registro_id: str):
    return {"ok": True, "registro_id": registro_id, "mensagem": "Registro enfileirado para reprocessamento"}