from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/cms", tags=["cms"])

@lru_cache(maxsize=1)
def _REUNIOES():
    return [
        {
            "id": "r01", "numero": "1", "data": "28/01/2026", "hora": "14h00", "local": "Câmara Municipal de Apuí",
            "tipo": "ordinaria", "status": "realizada", "quorum": 14, "total_conselheiros": 16, "ata_aprovada": True,
            "pauta": [
                "Aprovação da ata da reunião anterior",
                "Apresentação do Relatório de Gestão do 3º Quadrimestre de 2025",
                "Apreciação do Plano Municipal de Saúde 2026-2029",
                "Informes gerais",
            ],
            "deliberacoes": [
                {"numero": "001/2026", "descricao": "Aprovação do Relatório de Gestão do 3º Quadrimestre/2025.", "situacao": "cumprida"},
                {"numero": "002/2026", "descricao": "Aprovação do Plano Municipal de Saúde 2026-2029 com recomendações.", "situacao": "em_acompanhamento"},
            ],
        },
        {
            "id": "r02", "numero": "2", "data": "25/02/2026", "hora": "14h00", "local": "Câmara Municipal de Apuí",
            "tipo": "ordinaria", "status": "realizada", "quorum": 13, "total_conselheiros": 16, "ata_aprovada": True,
            "pauta": [
                "Aprovação da ata da reunião anterior",
                "Análise da execução orçamentária — Jan/Fev 2026",
                "Situação do abastecimento de medicamentos",
                "Informes gerais",
            ],
            "deliberacoes": [
                {"numero": "003/2026", "descricao": "Solicitação de providências ao FMS quanto à falta de dipirona e amoxicilina.", "situacao": "em_acompanhamento"},
            ],
        },
        {
            "id": "r03", "numero": "3", "data": "31/03/2026", "hora": "14h00", "local": "UBS Central — Sala de Reuniões",
            "tipo": "ordinaria", "status": "realizada", "quorum": 15, "total_conselheiros": 16, "ata_aprovada": True,
            "pauta": [
                "Aprovação da ata da reunião anterior",
                "Visita técnica às instalações da UBS Central",
                "Situação das equipes ESF — vagas em aberto",
            ],
            "deliberacoes": [
                {"numero": "004/2026", "descricao": "Aprovação de moção de apoio ao processo seletivo para médico do ESF III rural.", "situacao": "cumprida"},
                {"numero": "005/2026", "descricao": "Recomendação para manutenção da cadeira odontológica suspensa.", "situacao": "em_acompanhamento"},
            ],
        },
        {
            "id": "r04", "numero": "1-E", "data": "14/04/2026", "hora": "09h00", "local": "Câmara Municipal de Apuí",
            "tipo": "extraordinaria", "status": "realizada", "quorum": 12, "total_conselheiros": 16, "ata_aprovada": True,
            "pauta": [
                "Análise e aprovação do Relatório de Gestão do 1º Quadrimestre de 2026",
                "Execução financeira do 1º quadrimestre",
            ],
            "deliberacoes": [
                {"numero": "006/2026", "descricao": "Aprovação do Relatório de Gestão do 1º Quadrimestre/2026 com ressalvas (indicadores de pré-natal e DM abaixo da meta).", "situacao": "cumprida"},
            ],
        },
        {
            "id": "r05", "numero": "4", "data": "28/04/2026", "hora": "14h00", "local": "Câmara Municipal de Apuí",
            "tipo": "ordinaria", "status": "realizada", "quorum": 14, "total_conselheiros": 16, "ata_aprovada": False,
            "pauta": [
                "Aprovação da ata da reunião anterior",
                "Cobertura vacinal — situação da febre amarela",
                "Informes sobre o surto de malária no ramal do Castanhal",
            ],
            "deliberacoes": [
                {"numero": "007/2026", "descricao": "Solicitação urgente de campanha de vacinação contra febre amarela na zona rural.", "situacao": "em_acompanhamento"},
            ],
        },
        {
            "id": "r06", "numero": "5", "data": "26/05/2026", "hora": "14h00", "local": "Câmara Municipal de Apuí",
            "tipo": "ordinaria", "status": "realizada", "quorum": 16, "total_conselheiros": 16, "ata_aprovada": False,
            "pauta": [
                "Aprovação da ata da reunião anterior",
                "Análise do contrato do laboratório (vencimento em jul/2026)",
                "Situação do Almoxarifado — itens críticos",
            ],
            "deliberacoes": [
                {"numero": "008/2026", "descricao": "Recomendação para renovação imediata do contrato de laboratório (CT-004/2026).", "situacao": "em_acompanhamento"},
                {"numero": "009/2026", "descricao": "Solicitação de compra emergencial de dipirona e amoxicilina.", "situacao": "aprovada"},
            ],
        },
        {
            "id": "r07", "numero": "6", "data": "30/07/2026", "hora": "14h00", "local": "Câmara Municipal de Apuí",
            "tipo": "ordinaria", "status": "agendada", "quorum": None, "total_conselheiros": 16, "ata_aprovada": False,
            "pauta": [
                "Aprovação das atas das reuniões 4ª e 5ª",
                "Relatório de Gestão do 2º Quadrimestre de 2026",
                "Situação da ESF III rural — contratação de médico",
                "Informes gerais",
            ],
            "deliberacoes": [],
        },
    ]


@lru_cache(maxsize=1)
def _CONSELHEIROS():
    return [
        {"id": "c01", "nome": "Raimunda Ferreira", "entidade": "Associação de Bairros de Apuí", "segmento": "usuarios", "cargo": "presidente", "titular": True, "mandato_ate": "31/12/2027"},
        {"id": "c02", "nome": "José Carlos Melo", "entidade": "Sindicato dos Trabalhadores Rurais", "segmento": "usuarios", "cargo": "vice_presidente", "titular": True, "mandato_ate": "31/12/2027"},
        {"id": "c03", "nome": "Ana Paula Rocha", "entidade": "Fundo Municipal de Saúde", "segmento": "gestao", "cargo": "secretario", "titular": True, "mandato_ate": "31/12/2027"},
        {"id": "c04", "nome": "Dr. Marcos Alves", "entidade": "Clínica Saúde Plena", "segmento": "prestadores", "cargo": "membro", "titular": True, "mandato_ate": "31/12/2027"},
        {"id": "c05", "nome": "Francisca Lima", "entidade": "Conselho Local de Saúde — MA-01", "segmento": "usuarios", "cargo": "membro", "titular": True, "mandato_ate": "31/12/2027"},
        {"id": "c06", "nome": "Antônio Bentes", "entidade": "Conselho Local de Saúde — MA-02", "segmento": "usuarios", "cargo": "membro", "titular": True, "mandato_ate": "31/12/2027"},
        {"id": "c07", "nome": "Rosa Viana", "entidade": "Conselho Local de Saúde — MA-03", "segmento": "usuarios", "cargo": "membro", "titular": True, "mandato_ate": "31/12/2027"},
        {"id": "c08", "nome": "Marlene Figueiredo", "entidade": "Conselho Local de Saúde — MA-04", "segmento": "usuarios", "cargo": "membro", "titular": True, "mandato_ate": "31/12/2027"},
        {"id": "c09", "nome": "Enf. Beatriz Santos", "entidade": "COFEN — Conselho de Enfermagem", "segmento": "trabalhadores", "cargo": "membro", "titular": True, "mandato_ate": "31/12/2027"},
        {"id": "c10", "nome": "Dr. Paulo Henrique", "entidade": "CFM — Conselho de Medicina", "segmento": "trabalhadores", "cargo": "membro", "titular": True, "mandato_ate": "31/12/2027"},
        {"id": "c11", "nome": "Célia Nunes", "entidade": "Secretaria Municipal de Saúde", "segmento": "gestao", "cargo": "membro", "titular": True, "mandato_ate": "31/12/2027"},
        {"id": "c12", "nome": "Roberto Sousa", "entidade": "Secretaria Municipal de Educação", "segmento": "gestao", "cargo": "membro", "titular": True, "mandato_ate": "31/12/2027"},
        {"id": "c13", "nome": "Tereza Cristina", "entidade": "Associação de Moradores Zona Rural", "segmento": "usuarios", "cargo": "membro", "titular": True, "mandato_ate": "31/12/2027"},
        {"id": "c14", "nome": "Carlos Rodrigues", "entidade": "Laboratório Diagnose Amazônia", "segmento": "prestadores", "cargo": "membro", "titular": True, "mandato_ate": "31/12/2027"},
        {"id": "c15", "nome": "Luzia Pereira", "entidade": "Associação de Bairros de Apuí", "segmento": "usuarios", "cargo": "membro", "titular": False, "mandato_ate": "31/12/2027"},
        {"id": "c16", "nome": "Ernesto Matos", "entidade": "Sindicato dos Trabalhadores em Saúde", "segmento": "trabalhadores", "cargo": "membro", "titular": False, "mandato_ate": "31/12/2027"},
    ]


@router.get("/resumo")
def resumo():
    realizadas = [r for r in _REUNIOES() if r["status"] == "realizada"]
    delibs = [d for r in _REUNIOES() for d in r["deliberacoes"]]
    cumpridas = [d for d in delibs if d["situacao"] == "cumprida"]
    return {
        "total_conselheiros":     len(_CONSELHEIROS()),
        "reunioes_ano":           len(_REUNIOES()),
        "reunioes_realizadas":    len(realizadas),
        "deliberacoes_total":     len(delibs),
        "deliberacoes_cumpridas": len(cumpridas),
        "proxima_reuniao":        "6ª Reunião Ordinária do CMS",
        "proxima_data":           "30/07/2026",
    }

@router.get("/reunioes")
def reunioes():
    return _REUNIOES

@router.get("/conselheiros")
def conselheiros():
    return _CONSELHEIROS
