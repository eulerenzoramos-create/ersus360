"""
Router: /api/scnes-conformidade — Monitoramento CNES (multi-município).

Fonte: retrato do CNES do município da sessão, coletado da API pública do CNES (services/cnes_publico.py) e
guardado por competência (models/cnes_retrato.py). Nenhum dado fixo no código: sem coleta, os endpoints dizem
"sem_coleta" e a tela orienta a clicar em Atualizar.

Endpoints:
  GET  /retrato                  → resumo do retrato (competência, totais, estabelecimentos, equipes, alterações)
  GET  /retrato/equipes/{ine}    → profissionais da equipe + outras lotações da mesma pessoa no município
  GET  /retratos                 → histórico de competências coletadas
  POST /retrato/coletar          → coleta agora (perfis de edição)
  GET  /resumo, /equipes, /alertas-cnes, /sincronizacao  · POST /sincronizar  (compatíveis com a tela anterior)
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.cnes_retrato import CnesRetrato
from routers.auth import ip_de
from routers.fns_previsao import _pode_editar
from services import cnes_publico as cp
from tenancy.auditoria import registrar_auditoria
from tenancy.contexto import municipio_atual
from tenancy.escopo import SessaoMunicipal

router = APIRouter(prefix="/api/scnes-conformidade", tags=["Monitoramento CNES"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")  # noqa: E731
SEM_COLETA = ("Ainda não há retrato do CNES deste município. Clique em Atualizar para coletar da API pública "
              "do CNES (cnes.datasus.gov.br).")


def _rot_comp(c: str | None) -> str | None:
    return f"{c[4:6]}/{c[:4]}" if c and len(c) == 6 else c


def _cab(reg: CnesRetrato) -> dict:
    return {"competencia": reg.competencia, "competencia_rotulo": _rot_comp(reg.competencia),
            "situacao": reg.situacao, "coletado_em": reg.coletado_em.isoformat() + "Z" if reg.coletado_em else None,
            "coletado_por": reg.coletado_por, "fonte": reg.fonte, "totais": reg.totais, "erros": reg.erros or []}


async def _retrato(db: AsyncSession, mid: int, competencia: str | None) -> CnesRetrato | None:
    if competencia:
        return await cp.de_competencia(db, mid, competencia)
    return await cp.ultimo(db, mid)


def _equipe_resumo(e: dict) -> dict:
    return {k: e.get(k) for k in ("ine", "nome", "sigla", "tp_equipe", "descricao", "area", "ds_area",
                                  "dt_ativacao", "dt_desativacao", "ativa", "marcadores", "estabelecimentos",
                                  "n_profissionais", "ch_total")}


# ── Retrato ────────────────────────────────────────────────────────────────────

@router.get("/retrato")
async def retrato(current: SessaoMunicipal, competencia: str | None = Query(None, pattern=r"^\d{6}$"),
                  db: AsyncSession = Depends(get_db)):
    reg = await _retrato(db, current.municipio_id, competencia)
    if not reg:
        return {"situacao_dado": "sem_coleta", "nota": SEM_COLETA, "equipes": [], "estabelecimentos": []}
    d = reg.dados
    return {"situacao_dado": "oficial", **_cab(reg), "alteracoes": reg.alteracoes,
            "estabelecimentos": d.get("estabelecimentos", []),
            "equipes": [_equipe_resumo(e) for e in d.get("equipes", [])]}


@router.get("/retrato/equipes/{ine}")
async def retrato_equipe(ine: str, current: SessaoMunicipal,
                         competencia: str | None = Query(None, pattern=r"^\d{6}$"),
                         db: AsyncSession = Depends(get_db)):
    reg = await _retrato(db, current.municipio_id, competencia)
    if not reg:
        raise HTTPException(404, SEM_COLETA)
    eq = next((e for e in reg.dados.get("equipes", []) if e["ine"] == ine), None)
    if not eq:
        raise HTTPException(404, f"Equipe INE {ine} não está no retrato do CNES de {_rot_comp(reg.competencia)}")
    pessoas = reg.dados.get("pessoas", {})
    profs = []
    for p in eq["profissionais"]:
        pes = pessoas.get(p["chave"] or "", {})
        outras = [l for l in pes.get("lotacoes", [])
                  if not (l["cnes"] == p["cnes"] and l["cbo"] == p["cbo"])]
        profs.append({k: v for k, v in p.items() if k != "chave"}
                     | {"outras_lotacoes": outras, "ch_total_municipio": pes.get("ch_total"),
                        "n_estabelecimentos": pes.get("n_estabelecimentos")})
    return {"situacao_dado": "oficial", **_cab(reg), "equipe": _equipe_resumo(eq), "profissionais": profs,
            "nota": "Outras lotações = vínculos da mesma pessoa em estabelecimentos deste município no CNES. "
                    "Vínculos em outros municípios não são publicados por esta consulta."}


@router.get("/retratos")
async def retratos(current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    return [_cab(r) | {"alteracoes": (r.alteracoes or {}).get("total")}
            for r in await cp.historico(db, current.municipio_id)]


@router.post("/retrato/coletar")
async def retrato_coletar(request: Request, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    _pode_editar(current)
    try:
        r = await cp.sincronizar(db, current.municipio_id, current.municipio_ibge, current.username, forcar=True)
    except cp.CnesIndisponivel as e:
        raise HTTPException(503, str(e))
    await registrar_auditoria(db, "CNES_RETRATO_COLETADO", usuario=current, ip=ip_de(request),
                              tabela="cnes_retratos",
                              detalhe=f"competência {r['competencia']} ({r['situacao']}): {r['totais']}")
    return {"ok": True, **r}


# ── Endpoints da tela anterior (mesmo formato, agora sobre o retrato) ─────────

def _equipes_legado(reg: CnesRetrato | None) -> list[dict]:
    if not reg:
        return []
    return [{"ine": e["ine"], "nome": e["nome"], "tipo": e["descricao"], "tp_equipe": e["tp_equipe"],
             "sigla": e["sigla"], "cnes_ubs": (e["estabelecimentos"] or [{}])[0].get("cnes", ""),
             "ativo": e["ativa"], "dt_ativacao": e["dt_ativacao"], "dt_desativacao": e["dt_desativacao"],
             "n_profissionais": e.get("n_profissionais"), "fonte": "cnes_publico"}
            for e in reg.dados.get("equipes", [])]


@router.get("/resumo")
async def resumo(current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    reg = await cp.ultimo(db, current.municipio_id)
    mun = municipio_atual()
    equipes = _equipes_legado(reg)
    esf = [e for e in equipes if e["sigla"] == "ESF"]
    sit = "oficial" if reg else "sem_coleta"
    return {
        "ibge": current.municipio_ibge, "municipio": mun.nome, "uf": mun.uf, "situacao_geral": sit,
        "competencia": reg.competencia if reg else None,
        "estabelecimentos": {"total": reg.totais.get("estabelecimentos", 0) if reg else 0, "situacao_dado": sit,
                             "fonte": cp.FONTE},
        "equipes_esf": {"total": len(esf), "com_ine": len([e for e in esf if e["ine"]]), "sem_ine": 0,
                        "ativas": len([e for e in esf if e["ativo"]]),
                        "com_rejeicao": len([e for e in esf if not e["ativo"]]), "situacao_dado": sit,
                        "nota": "Equipes do retrato do CNES (API pública)." if reg else SEM_COLETA},
        "inconsistencias_abertas": 0, "total_inconsistencias": 0,
        "verificado_em": _cab(reg)["coletado_em"] if reg else _TS(),
    }


@router.get("/equipes")
async def equipes(current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    reg = await cp.ultimo(db, current.municipio_id)
    mun = municipio_atual()
    out = []
    for eq in _equipes_legado(reg):
        ativo = eq["ativo"]
        pend = [] if ativo else [{"id": 1, "componente": "SCNES", "gravidade": "alto", "situacao": "aberta",
                                  "descricao": f"Equipe desativada no CNES em {eq['dt_desativacao']}."}]
        obs = (eq["dt_ativacao"] or "") if ativo else f"Desativada em {eq['dt_desativacao']}"
        out.append({
            "ine": eq["ine"], "nome": eq["nome"], "cnes_ubs": eq["cnes_ubs"], "municipio": mun.nome, "uf": mun.uf,
            "ativo": ativo, "rejeicao_cnes": not ativo,
            "situacao_geral": "oficial_validado" if ativo else "divergente",
            "dimensoes": {
                "ine": {"label": "INE", "situacao_dado": "oficial_validado", "valor": eq["ine"], "observacao": ""},
                "ativacao": {"label": "Situação", "situacao_dado": "oficial_validado" if ativo else "divergente",
                             "valor": ativo, "observacao": obs},
                "tipo": {"label": "Tipo de equipe", "situacao_dado": "oficial_validado", "valor": eq["tipo"],
                         "observacao": ""},
            },
            "pendencias_abertas": len(pend), "pendencias_detalhe": pend, "fonte": eq["fonte"],
            "competencia": reg.competencia, "verificado_em": _cab(reg)["coletado_em"],
        })
    return out


def _txt_alteracao(m: dict) -> str:
    t = m["tipo"]
    if t == "profissional_saiu":
        return f"{m['profissional']} (CBO {m['cbo']}) saiu da equipe {m['equipe']} (INE {m['ine']})."
    if t == "carga_horaria_alterada":
        return (f"Carga horária de {m['profissional']} na equipe {m['equipe']} mudou de {m['de']}h "
                f"para {m['para']}h.")
    return f"Equipe {m.get('equipe')} (INE {m['ine']}) não aparece mais no CNES."


@router.get("/alertas-cnes")
async def alertas_cnes(current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    reg = await cp.ultimo(db, current.municipio_id)
    alertas = []
    for eq in _equipes_legado(reg):
        if not eq["ativo"]:
            alertas.append({"id": len(alertas) + 1, "componente": "SCNES", "gravidade": "alto", "situacao": "aberta",
                            "descricao": f"Equipe {eq['nome']} (INE {eq['ine']}) desativada no CNES."})
    for m in ((reg.alteracoes or {}).get("itens", []) if reg else []):
        if m["tipo"] in ("profissional_saiu", "equipe_removida", "carga_horaria_alterada"):
            alertas.append({"id": len(alertas) + 1, "componente": "SCNES", "gravidade": "medio", "situacao": "aberta",
                            "descricao": _txt_alteracao(m)})
    return {"total": len(alertas), "criticos": 0, "altos": len([a for a in alertas if a["gravidade"] == "alto"]),
            "medios": len([a for a in alertas if a["gravidade"] == "medio"]),
            "situacao_dado": "oficial" if reg else "sem_coleta", "alertas": alertas}


@router.get("/sincronizacao")
async def sincronizacao(current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    reg = await cp.ultimo(db, current.municipio_id)
    if not reg:
        return {"situacao_dado": "sem_coleta", "ultima_sync": None, "total_estabelecimentos": 0, "total_equipes": 0,
                "equipes_com_ine": 0, "equipes_sem_ine": 0, "nota": SEM_COLETA}
    t = reg.totais
    return {"situacao_dado": "oficial", "ultima_sync": _cab(reg)["coletado_em"], "competencia": reg.competencia,
            "total_estabelecimentos": t.get("estabelecimentos", 0), "total_equipes": t.get("equipes", 0),
            "equipes_com_ine": t.get("equipes", 0), "equipes_sem_ine": 0,
            "nota": "Coleta automática semanal da API pública do CNES; botão Atualizar coleta na hora."}


@router.post("/sincronizar")
async def sincronizar(request: Request, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    r = await retrato_coletar(request, current, db)
    return {"sucesso": True, "timestamp": _TS(),
            "mensagem": f"CNES {_rot_comp(r['competencia'])}: {r['totais']['equipes']} equipes, "
                        f"{r['totais']['estabelecimentos']} estabelecimentos."}
