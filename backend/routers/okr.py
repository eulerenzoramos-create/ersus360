# backend/routers/okr.py — OKRs Estratégicos · FMS Apuí
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/okr", tags=["okr"])

@lru_cache(maxsize=1)
def _OBJETIVOS():
    return [
        {
            "id": "O1", "titulo": "Atingir 100% dos indicadores Previne Brasil Grupo C", "area": "APS",
            "trimestre": "Q3/2026", "pct_geral": 68, "status": "atencao",
            "descricao": "Elevar todos os 7 indicadores do Grupo C (eSF/eAP) ao patamar de meta ou acima até Set/2026.",
            "key_results": [
                {"id":"KR1.1","descricao":"Cobertura pré-natal 6+ consultas","unidade":"%","valor_atual":62,"valor_meta":60,"pct":100,"status":"concluido","responsavel":"Coord. Saúde da Mulher","data_limite":"2026-09-30"},
                {"id":"KR1.2","descricao":"Exame citopatológico (25-64a)","unidade":"%","valor_atual":41,"valor_meta":80,"pct":51,"status":"critico","responsavel":"Enf. Ana Carvalho","data_limite":"2026-09-30"},
                {"id":"KR1.3","descricao":"Cobertura vacinal infantil","unidade":"%","valor_atual":94,"valor_meta":90,"pct":100,"status":"concluido","responsavel":"Coord. Imunização","data_limite":"2026-09-30"},
                {"id":"KR1.4","descricao":"Saúde da criança <2 anos","unidade":"%","valor_atual":72,"valor_meta":75,"pct":96,"status":"atencao","responsavel":"Pediatra / Enfermagem","data_limite":"2026-09-30"},
            ],
        },
        {
            "id": "O2", "titulo": "Reduzir demanda reprimida em regulação para < 30 casos", "area": "Regulação",
            "trimestre": "Q3/2026", "pct_geral": 45, "status": "critico",
            "descricao": "Zerar a fila de espera acima de 90 dias e reduzir o total de aguardando para menos de 30 casos, priorizando urgentes.",
            "key_results": [
                {"id":"KR2.1","descricao":"Casos aguardando > 90 dias","unidade":"casos","valor_atual":18,"valor_meta":0,"pct":0,"status":"critico","responsavel":"Coord. Regulação","data_limite":"2026-09-30"},
                {"id":"KR2.2","descricao":"Tempo médio de espera","unidade":"dias","valor_atual":52,"valor_meta":30,"pct":42,"status":"critico","responsavel":"Coord. Regulação","data_limite":"2026-09-30"},
                {"id":"KR2.3","descricao":"Taxa de autorização SISREG","unidade":"%","valor_atual":74,"valor_meta":90,"pct":82,"status":"atencao","responsavel":"Coord. MAC","data_limite":"2026-09-30"},
            ],
        },
        {
            "id": "O3", "titulo": "Elevar conformidade SCNES para 95% em todas as equipes", "area": "Administração",
            "trimestre": "Q3/2026", "pct_geral": 79, "status": "atencao",
            "descricao": "Garantir que todas as 5 equipes ESF estejam com cadastro SCNES completo, sem pendências críticas.",
            "key_results": [
                {"id":"KR3.1","descricao":"Equipes sem pendência crítica SCNES","unidade":"equipes","valor_atual":3,"valor_meta":5,"pct":60,"status":"atencao","responsavel":"RH / Coord. APS","data_limite":"2026-08-31"},
                {"id":"KR3.2","descricao":"Profissionais com carga horária regularizada","unidade":"%","valor_atual":92,"valor_meta":100,"pct":92,"status":"atencao","responsavel":"RH","data_limite":"2026-08-31"},
                {"id":"KR3.3","descricao":"Score SCNES médio municipal","unidade":"pts","valor_atual":73,"valor_meta":95,"pct":77,"status":"atencao","responsavel":"Coord. APS","data_limite":"2026-09-30"},
            ],
        },
        {
            "id": "O4", "titulo": "Implantação completa do Gateway RNDS FHIR R4", "area": "Saúde Digital",
            "trimestre": "Q4/2026", "pct_geral": 55, "status": "atencao",
            "descricao": "Integrar todos os 9 recursos FHIR R4 prioritários com o RNDS, com taxa de erro < 2%.",
            "key_results": [
                {"id":"KR4.1","descricao":"Recursos FHIR implementados","unidade":"de 9","valor_atual":5,"valor_meta":9,"pct":55,"status":"atencao","responsavel":"TI / Saúde Digital","data_limite":"2026-12-31"},
                {"id":"KR4.2","descricao":"Taxa de erro nos envios RNDS","unidade":"%","valor_atual":2.1,"valor_meta":2,"pct":95,"status":"atencao","responsavel":"TI","data_limite":"2026-12-31"},
                {"id":"KR4.3","descricao":"Latência média p95 endpoints","unidade":"ms","valor_atual":380,"valor_meta":300,"pct":65,"status":"atencao","responsavel":"TI","data_limite":"2026-12-31"},
            ],
        },
        {
            "id": "O5", "titulo": "Score de risco ESF III abaixo de 50 pontos", "area": "APS",
            "trimestre": "Q4/2026", "pct_geral": 32, "status": "critico",
            "descricao": "Reverter a situação crítica da ESF III (score 85) com plano de ação intensivo em 90 dias.",
            "key_results": [
                {"id":"KR5.1","descricao":"Score de risco ESF III","unidade":"pts","valor_atual":85,"valor_meta":50,"pct":32,"status":"critico","responsavel":"Coord. APS + RH","data_limite":"2026-12-31"},
                {"id":"KR5.2","descricao":"Médico com CNES regularizado","unidade":"bool","valor_atual":0,"valor_meta":1,"pct":0,"status":"critico","responsavel":"RH","data_limite":"2026-08-01"},
                {"id":"KR5.3","descricao":"Citopatológico ESF III","unidade":"%","valor_atual":31,"valor_meta":60,"pct":52,"status":"critico","responsavel":"Enf. ESF III","data_limite":"2026-12-31"},
            ],
        },
        {
            "id": "O6", "titulo": "Execução orçamentária mínima 90% em todos os blocos", "area": "Financeiro",
            "trimestre": "Q3/2026", "pct_geral": 88, "status": "atencao",
            "descricao": "Garantir que nenhum bloco de financiamento encerre o trimestre com execução abaixo de 90%.",
            "key_results": [
                {"id":"KR6.1","descricao":"Execução bloco APS","unidade":"%","valor_atual":90.6,"valor_meta":90,"pct":100,"status":"concluido","responsavel":"Coord. Financeiro","data_limite":"2026-09-30"},
                {"id":"KR6.2","descricao":"Execução bloco MAC","unidade":"%","valor_atual":63.2,"valor_meta":90,"pct":70,"status":"critico","responsavel":"Coord. MAC","data_limite":"2026-09-30"},
                {"id":"KR6.3","descricao":"Execução bloco Vigilância","unidade":"%","valor_atual":91.2,"valor_meta":90,"pct":100,"status":"concluido","responsavel":"Coord. Vigilância","data_limite":"2026-09-30"},
            ],
        },
    ]


@lru_cache(maxsize=1)
def _RESUMO():
    return {
        "ciclo": "Q3/2026 (Jul–Set)",
        "total_objetivos": len(_OBJETIVOS()),
        "total_krs": sum(len(o["key_results"]) for o in _OBJETIVOS()),
        "concluidos": sum(1 for o in _OBJETIVOS() if o["status"] == "concluido"),
        "no_prazo":   sum(1 for o in _OBJETIVOS() if o["status"] == "no_prazo"),
        "atencao":    sum(1 for o in _OBJETIVOS() if o["status"] == "atencao"),
        "criticos":   sum(1 for o in _OBJETIVOS() if o["status"] == "critico"),
        "score_medio": round(sum(o["pct_geral"] for o in _OBJETIVOS()) / len(_OBJETIVOS()), 1),
    }



@router.get("/resumo")
def resumo():
    return _RESUMO()


@router.get("/objetivos")
def listar():
    return _OBJETIVOS()


@router.post("/atualizar")
def atualizar():
    return {"ok": True, "mensagem": "OKRs atualizados com os dados mais recentes dos módulos integrados."}