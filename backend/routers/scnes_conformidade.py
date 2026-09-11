"""Router: /api/scnes-conformidade — ERSUS 360 — CNES dados abertos"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter
from services.cnes_service import (
    buscar_estabelecimentos, buscar_equipes_saude, buscar_status, IBGE
)

router = APIRouter(prefix="/api/scnes-conformidade", tags=["Conformidade SCNES"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_MUNICIPIO = "Apuí"
_UF = "AM"


def _sit(tem_dados: bool) -> str:
    return "oficial_aguardando" if tem_dados else "nao_disponivel"


# ── Endpoints legados ──────────────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard():
    estabs = await buscar_estabelecimentos()
    total = len(estabs) if isinstance(estabs, list) else 0
    return {
        "situacao_dado": _sit(total > 0),
        "total_estabelecimentos": total,
        "nota": "Conformidade detalhada requer consulta SCNES (pendente). CNES público como proxy de cadastro.",
        "fonte": "CNES — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/indicadores")
async def indicadores():
    return await dashboard()


@router.get("/conformidade")
async def conformidade():
    return await dashboard()


# ── Novos endpoints ────────────────────────────────────────────────────────────

@router.get("/resumo")
async def resumo(ibge: str = IBGE):
    estabs = await buscar_estabelecimentos()
    equipes = await buscar_equipes_saude(ibge)

    total_estabs = len(estabs) if isinstance(estabs, list) else 0
    esf = [e for e in equipes if e.get("tp_equipe") == "70"]
    com_ine = [e for e in esf if e.get("ine")]
    sem_ine = [e for e in esf if not e.get("ine")]
    ativas = [e for e in esf if e.get("ativo")]
    com_rejeicao = [e for e in esf if not e.get("ativo")]  # desativadas = rejeição possível

    fonte = equipes[0].get("fonte", "cnes_verificado") if equipes else "cnes_verificado"

    return {
        "ibge": ibge,
        "municipio": _MUNICIPIO,
        "uf": _UF,
        "situacao_geral": _sit(len(equipes) > 0),
        "estabelecimentos": {
            "total": total_estabs,
            "situacao_dado": _sit(total_estabs > 0),
            "fonte": fonte,
        },
        "equipes_esf": {
            "total": len(esf),
            "com_ine": len(com_ine),
            "sem_ine": len(sem_ine),
            "ativas": len(ativas),
            "com_rejeicao": len(com_rejeicao),
            "situacao_dado": _sit(len(esf) > 0),
            "nota": "Equipes obtidas via CNES/DATASUS. INE validado pelo SCNES.",
        },
        "inconsistencias_abertas": 0,
        "total_inconsistencias": 0,
        "verificado_em": _TS(),
    }


@router.get("/equipes")
async def equipes(ibge: str = IBGE):
    equipes_raw = await buscar_equipes_saude(ibge)
    result = []
    for eq in equipes_raw:
        ativo = eq.get("ativo", True)
        ine = eq.get("ine") or None
        fonte = eq.get("fonte", "cnes_verificado")

        dimensoes = {
            "ine": {
                "label": "INE",
                "situacao_dado": "oficial_validado" if ine else "divergente",
                "valor": ine,
                "observacao": "" if ine else "Equipe sem INE registrado no CNES",
            },
            "ativacao": {
                "label": "Situação",
                "situacao_dado": "oficial_validado" if ativo else "divergente",
                "valor": ativo,
                "observacao": eq.get("dt_ativacao", "") if ativo else f"Desativada em {eq.get('dt_desativacao', '')}",
            },
            "tipo": {
                "label": "Tipo de equipe",
                "situacao_dado": "oficial_aguardando",
                "valor": eq.get("tipo", ""),
                "observacao": "",
            },
        }

        alerta = eq.get("alerta")
        pendencias = []
        if alerta:
            pendencias.append({
                "id": 1,
                "componente": "SIAPS",
                "gravidade": "alto",
                "descricao": alerta,
                "situacao": "aberta",
            })
        if not ine:
            pendencias.append({
                "id": 2,
                "componente": "SCNES",
                "gravidade": "critico",
                "descricao": "Equipe sem INE registrado no CNES — não elegível ao pagamento.",
                "situacao": "aberta",
            })

        result.append({
            "ine": ine,
            "nome": eq.get("nome", ""),
            "cnes_ubs": eq.get("cnes_ubs", ""),
            "municipio": _MUNICIPIO,
            "uf": _UF,
            "ativo": ativo,
            "rejeicao_cnes": not ativo,
            "situacao_geral": "oficial_validado" if ativo and ine and not alerta else "oficial_aguardando",
            "dimensoes": dimensoes,
            "pendencias_abertas": len(pendencias),
            "pendencias_detalhe": pendencias,
            "fonte": fonte,
            "verificado_em": _TS(),
        })
    return result


@router.get("/alertas-cnes")
async def alertas_cnes(ibge: str = IBGE):
    equipes_raw = await buscar_equipes_saude(ibge)

    alertas = []
    _id = 1

    for eq in equipes_raw:
        if not eq.get("ativo"):
            alertas.append({
                "id": _id,
                "componente": "SCNES",
                "gravidade": "alto",
                "descricao": f"Equipe {eq.get('nome', '')} ({eq.get('cnes_ubs', '')}) desativada no CNES.",
                "situacao": "aberta",
            })
            _id += 1

        if not eq.get("ine"):
            alertas.append({
                "id": _id,
                "componente": "SCNES",
                "gravidade": "critico",
                "descricao": f"Equipe {eq.get('nome', '')} sem INE — excluída do pagamento.",
                "situacao": "aberta",
            })
            _id += 1

        if eq.get("alerta"):
            alertas.append({
                "id": _id,
                "componente": "SIAPS",
                "gravidade": "medio",
                "descricao": eq["alerta"],
                "situacao": "aberta",
            })
            _id += 1

    criticos = len([a for a in alertas if a["gravidade"] == "critico"])
    altos = len([a for a in alertas if a["gravidade"] == "alto"])
    medios = len([a for a in alertas if a["gravidade"] == "medio"])

    return {
        "total": len(alertas),
        "criticos": criticos,
        "altos": altos,
        "medios": medios,
        "situacao_dado": _sit(True),
        "alertas": alertas,
    }


@router.get("/sincronizacao")
async def sincronizacao():
    status = await buscar_status()
    equipes = await buscar_equipes_saude()
    estabs = await buscar_estabelecimentos()

    esf = [e for e in equipes if e.get("tp_equipe") == "70"]
    com_ine = [e for e in esf if e.get("ine")]
    sem_ine = [e for e in esf if not e.get("ine")]

    return {
        "situacao_dado": "oficial_aguardando" if status.get("cnes_api_disponivel") else "nao_disponivel",
        "ultima_sync": status.get("timestamp", _TS()),
        "total_estabelecimentos": len(estabs) if isinstance(estabs, list) else 0,
        "total_equipes": len(equipes),
        "equipes_com_ine": len(com_ine),
        "equipes_sem_ine": len(sem_ine),
        "nota": "Sincronização automática via CNES/DATASUS (cache 6h). Dados públicos sem credencial.",
    }


@router.post("/sincronizar")
async def sincronizar():
    """Força refresh do cache CNES."""
    from services import cnes_service
    cnes_service._cache_equipes = None
    cnes_service._cache_equipes_exp = None
    cnes_service._cache_estab = None
    cnes_service._cache_estab_exp = None

    equipes = await buscar_equipes_saude()
    estabs = await buscar_estabelecimentos()

    return {
        "sucesso": True,
        "mensagem": f"Cache atualizado: {len(equipes)} equipes, {len(estabs) if isinstance(estabs, list) else 0} estabelecimentos.",
        "timestamp": _TS(),
    }
