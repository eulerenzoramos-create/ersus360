# backend/routers/linha_tempo.py — Linha do Tempo Unificada do Cidadão
from fastapi import APIRouter, Query
from typing import Optional
from functools import lru_cache

router = APIRouter(prefix="/api/linha-tempo", tags=["linha-tempo"])

# ── Mock cidadão padrão para demo ──────────────────────────────────────────────

@lru_cache(maxsize=1)
def _CIDADAO_DEMO():
    return {
        "cns": "710001234567890",
        "cpf": "34130047272",
        "nome": "Maria das Graças Oliveira",
        "data_nascimento": "15/04/1978",
        "sexo": "Feminino",
        "mae": "Antônia Rodrigues Oliveira",
        "municipio_nascimento": "Apuí",
        "uf_nascimento": "AM",
        "raca_cor": "Parda",
        "escolaridade": "Ensino Médio Completo",
        "situacao_trabalho": "Empregado com carteira assinada",
        "cns_ativo": True,
        "ultimo_atendimento": "2026-05-10",
        "microarea": "1A",
        "acs": "Maria Santos",
        "equipe": "ESF I",
        "fontes": ["CADSUS", "PEC", "RNDS"],
    }


@lru_cache(maxsize=1)
def _EVENTOS_DEMO():
    return [
        {
            "id": "EV001", "data": "2026-05-10", "hora": "09:30",
            "tipo": "atendimento", "fonte": "PEC",
            "titulo": "Consulta — Clínico Geral",
            "descricao": "Atendimento individual por médico clínico. Paciente compareceu com queixa de cefaleia e hipertensão não controlada. PA: 160/100 mmHg. Solicitados exames laboratoriais e ajuste de medicamento.",
            "profissional": "Dr. Marcos Alves (CRM 12345)", "local": "UBS Centro",
            "cid": "I10", "procedimentos": ["0301010129", "0301010064"], "medicamentos": None, "resultado": None,
        },
        {
            "id": "EV002", "data": "2026-04-22", "hora": "10:00",
            "tipo": "vacina", "fonte": "RNDS",
            "titulo": "Vacina Influenza — Campanha 2026",
            "descricao": "Imunização contra influenza sazonal. Dose única administrada no músculo deltoide esquerdo. Lote: FL2026/001. Fabricante: Butantan.",
            "profissional": "Enf. Ana Carvalho (COREN 54321)", "local": "UBS Centro",
            "cid": None, "procedimentos": ["0301130051"], "medicamentos": None, "resultado": "Administrada com sucesso",
        },
        {
            "id": "EV003", "data": "2026-04-15", "hora": "14:20",
            "tipo": "prescricao", "fonte": "PEC",
            "titulo": "Prescrição — Anti-hipertensivos",
            "descricao": "Renovação de receita médica para tratamento de hipertensão arterial sistêmica. Medicamentos incluídos na RENAME e disponíveis na farmácia da UBS.",
            "profissional": "Dr. Marcos Alves (CRM 12345)", "local": "UBS Centro",
            "cid": "I10", "procedimentos": None,
            "medicamentos": ["Losartana Potássica 50mg — 1 comp/dia","Hidroclorotiazida 25mg — 1 comp/dia (manhã)"],
            "resultado": None,
        },
        {
            "id": "EV004", "data": "2026-03-18", "hora": "08:00",
            "tipo": "exame", "fonte": "PEC",
            "titulo": "Resultado — Exames Laboratoriais",
            "descricao": "Resultados dos exames solicitados na consulta anterior. Glicose jejum, hemograma completo, perfil lipídico e função renal dentro dos parâmetros esperados, exceto colesterol LDL levemente elevado.",
            "profissional": "Lab. Municipal", "local": "Laboratório Municipal",
            "cid": None, "procedimentos": ["0202010619","0202010139","0202020380"],
            "medicamentos": None,
            "resultado": "Colesterol LDL: 142mg/dL (referência <130). Demais resultados normais.",
        },
        {
            "id": "EV005", "data": "2026-02-10", "hora": "09:00",
            "tipo": "visita", "fonte": "PEC",
            "titulo": "Visita Domiciliar — ACS",
            "descricao": "Visita domiciliar realizada pela ACS Maria Santos. Verificada adesão ao tratamento anti-hipertensivo. Paciente relata tomando medicação regularmente. Orientada sobre dieta hipossódica e atividade física.",
            "profissional": "ACS Maria Santos", "local": "Microárea 1A",
            "cid": None, "procedimentos": ["0301010145"], "medicamentos": None, "resultado": "Paciente aderente ao tratamento",
        },
        {
            "id": "EV006", "data": "2026-01-20", "hora": "11:00",
            "tipo": "atendimento", "fonte": "PEC",
            "titulo": "Consulta — Enfermagem",
            "descricao": "Atendimento de enfermagem para acompanhamento de hipertensão arterial. Aferição de PA: 148/96 mmHg. Peso: 72kg. IMC: 28.4. Orientação sobre hábitos de vida saudável.",
            "profissional": "Enf. Ana Carvalho (COREN 54321)", "local": "UBS Centro",
            "cid": "I10", "procedimentos": ["0301010129"], "medicamentos": None, "resultado": None,
        },
        {
            "id": "EV007", "data": "2025-11-14", "hora": "10:30",
            "tipo": "exame", "fonte": "RNDS",
            "titulo": "Mamografia Digital Bilateral",
            "descricao": "Rastreamento de câncer de mama. Exame solicitado por médico clínico no contexto do Programa Nacional de Rastreamento. Encaminhamento para serviço de imagem.",
            "profissional": "Radiologia — Hospital Regional", "local": "Hospital Regional do AM",
            "cid": "Z12.3", "procedimentos": ["0204030030"],
            "medicamentos": None, "resultado": "BI-RADS 1 — Negativo para malignidade. Repetir em 2 anos.",
        },
        {
            "id": "EV008", "data": "2025-10-05", "hora": "15:00",
            "tipo": "atendimento", "fonte": "PEC",
            "titulo": "Coleta — Exame Citopatológico",
            "descricao": "Coleta de material para exame citopatológico (Papanicolau). Procedimento realizado pela enfermeira. Material enviado ao laboratório de análises clínicas.",
            "profissional": "Enf. Ana Carvalho (COREN 54321)", "local": "UBS Centro",
            "cid": "Z12.4", "procedimentos": ["0204030030"], "medicamentos": None,
            "resultado": "NILM — Negativo para lesão intraepitelial. Repetir em 3 anos.",
        },
        {
            "id": "EV009", "data": "2025-06-18", "hora": None,
            "tipo": "vacina", "fonte": "RNDS",
            "titulo": "Reforço — Hepatite B",
            "descricao": "3ª dose da vacina contra hepatite B, completando esquema vacinal básico do adulto.",
            "profissional": "Enf. Técnica Josefa Lima", "local": "UBS Centro",
            "cid": None, "procedimentos": ["0301130035"], "medicamentos": None, "resultado": "Esquema vacinal hepatite B completo",
        },
        {
            "id": "EV010", "data": "2024-03-10", "hora": None,
            "tipo": "cadastro", "fonte": "CADSUS",
            "titulo": "Atualização Cadastral — CADSUS",
            "descricao": "Atualização de dados cadastrais no CADSUS. Endereço residencial atualizado após mudança para novo bairro. CNS verificado e confirmado como ativo.",
            "profissional": None, "local": "UBS Centro — Recepção",
            "cid": None, "procedimentos": None, "medicamentos": None, "resultado": "Cadastro atualizado com sucesso",
        },
    ]



@router.get("/cidadao")
def buscar_cidadao(cns: str = Query(...)):
    cns_num = cns.replace(" ", "")
    return _CIDADAO_DEMO


@router.get("/eventos")
def listar_eventos(
    cns: str = Query(...),
    fontes: Optional[str] = Query(None),
    tipo: Optional[str] = Query(None),
):
    eventos = list(_EVENTOS_DEMO)
    if fontes:
        lista_fontes = fontes.split(",")
        eventos = [e for e in eventos if e["fonte"] in lista_fontes]
    if tipo:
        eventos = [e for e in eventos if e["tipo"] == tipo]
    return eventos
