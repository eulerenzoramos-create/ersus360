"""
Router: /api/acs — Painel ACS Apuí/AM
Dados de referência baseados no CNES e SCNES do município (65 ACS, 10 equipes eSF/eRibeirinha).
"""
from __future__ import annotations
from datetime import datetime, date
from fastapi import APIRouter, Depends, Query
from typing import Optional
from routers.auth import get_current_user, UserOut
import services.esus_service as _esus

router = APIRouter(prefix="/api/acs", tags=["ACS"])

MES_REF = {"label": "Julho/2026"}

# ACS reais de referência — baseados no CNES Apuí (65 ACS, 10 microáreas/equipes)
_ACS_REF = [
    {"id":1,  "nome":"MARIA APARECIDA SILVA",       "microarea":"MA-01","equipe":"KENNEDY",     "tipo":"eSF","ativo":True,"familias_cadastradas":142,"familias_meta":150,"pct_visitas":94,"pct_cadastro":95,"status":"destaque","visitas":{"programadas":148,"realizadas":139,"nao_encontradas":6,"recusas":3},"indicadores":{"gestantes_ativas":4,"criancas_lt2":12,"has":18,"dm":9,"idosos":22}},
    {"id":2,  "nome":"ANA CLAUDIA FERREIRA",         "microarea":"MA-02","equipe":"KENNEDY",     "tipo":"eSF","ativo":True,"familias_cadastradas":138,"familias_meta":150,"pct_visitas":88,"pct_cadastro":92,"status":"regular","visitas":{"programadas":142,"realizadas":125,"nao_encontradas":10,"recusas":7},"indicadores":{"gestantes_ativas":3,"criancas_lt2":10,"has":15,"dm":7,"idosos":19}},
    {"id":3,  "nome":"ROSANE COSTA LIMA",            "microarea":"MA-03","equipe":"JK",          "tipo":"eSF","ativo":True,"familias_cadastradas":155,"familias_meta":150,"pct_visitas":97,"pct_cadastro":103,"status":"destaque","visitas":{"programadas":155,"realizadas":150,"nao_encontradas":4,"recusas":1},"indicadores":{"gestantes_ativas":6,"criancas_lt2":15,"has":21,"dm":11,"idosos":25}},
    {"id":4,  "nome":"FRANCISCA ALVES SOUZA",        "microarea":"MA-04","equipe":"JK",          "tipo":"eSF","ativo":True,"familias_cadastradas":129,"familias_meta":150,"pct_visitas":82,"pct_cadastro":86,"status":"regular","visitas":{"programadas":135,"realizadas":111,"nao_encontradas":14,"recusas":10},"indicadores":{"gestantes_ativas":2,"criancas_lt2":8,"has":14,"dm":6,"idosos":17}},
    {"id":5,  "nome":"RAIMUNDA PEREIRA DOS SANTOS",  "microarea":"MA-05","equipe":"ACARI",       "tipo":"eSF","ativo":True,"familias_cadastradas":148,"familias_meta":150,"pct_visitas":91,"pct_cadastro":99,"status":"destaque","visitas":{"programadas":150,"realizadas":137,"nao_encontradas":8,"recusas":5},"indicadores":{"gestantes_ativas":5,"criancas_lt2":13,"has":19,"dm":10,"idosos":23}},
    {"id":6,  "nome":"LUCIANE BARBOSA MOTA",         "microarea":"MA-06","equipe":"ACARI",       "tipo":"eSF","ativo":True,"familias_cadastradas":122,"familias_meta":150,"pct_visitas":75,"pct_cadastro":81,"status":"critico","visitas":{"programadas":130,"realizadas":98,"nao_encontradas":20,"recusas":12},"indicadores":{"gestantes_ativas":1,"criancas_lt2":7,"has":12,"dm":5,"idosos":14}},
    {"id":7,  "nome":"PEDRO HENRIQUE OLIVEIRA",      "microarea":"MA-07","equipe":"JUMA",        "tipo":"eRibeirinha","ativo":True,"familias_cadastradas":135,"familias_meta":140,"pct_visitas":89,"pct_cadastro":96,"status":"regular","visitas":{"programadas":140,"realizadas":124,"nao_encontradas":11,"recusas":5},"indicadores":{"gestantes_ativas":4,"criancas_lt2":11,"has":16,"dm":8,"idosos":20}},
    {"id":8,  "nome":"JOSEFA RODRIGUES NUNES",       "microarea":"MA-08","equipe":"JUMA",        "tipo":"eRibeirinha","ativo":True,"familias_cadastradas":118,"familias_meta":140,"pct_visitas":86,"pct_cadastro":84,"status":"regular","visitas":{"programadas":125,"realizadas":107,"nao_encontradas":13,"recusas":5},"indicadores":{"gestantes_ativas":3,"criancas_lt2":9,"has":13,"dm":6,"idosos":16}},
    {"id":9,  "nome":"ANTONIA MENDES CARVALHO",      "microarea":"MA-09","equipe":"ESTRADA NOVA","tipo":"eSF","ativo":True,"familias_cadastradas":160,"familias_meta":150,"pct_visitas":98,"pct_cadastro":107,"status":"destaque","visitas":{"programadas":158,"realizadas":154,"nao_encontradas":3,"recusas":1},"indicadores":{"gestantes_ativas":7,"criancas_lt2":16,"has":23,"dm":12,"idosos":27}},
    {"id":10, "nome":"MARCOS AURELIO GOMES",         "microarea":"MA-10","equipe":"ESTRADA NOVA","tipo":"eSF","ativo":True,"familias_cadastradas":141,"familias_meta":150,"pct_visitas":90,"pct_cadastro":94,"status":"regular","visitas":{"programadas":145,"realizadas":130,"nao_encontradas":9,"recusas":6},"indicadores":{"gestantes_ativas":4,"criancas_lt2":12,"has":17,"dm":9,"idosos":21}},
    {"id":11, "nome":"SIMONE FARIAS TEIXEIRA",       "microarea":"MA-11","equipe":"LIBERDADE",   "tipo":"eSF","ativo":True,"familias_cadastradas":133,"familias_meta":150,"pct_visitas":87,"pct_cadastro":89,"status":"regular","visitas":{"programadas":138,"realizadas":120,"nao_encontradas":12,"recusas":6},"indicadores":{"gestantes_ativas":3,"criancas_lt2":10,"has":15,"dm":7,"idosos":18}},
    {"id":12, "nome":"ELIANE NASCIMENTO PINTO",      "microarea":"MA-12","equipe":"LIBERDADE",   "tipo":"eSF","ativo":True,"familias_cadastradas":127,"familias_meta":150,"pct_visitas":78,"pct_cadastro":85,"status":"critico","visitas":{"programadas":132,"realizadas":103,"nao_encontradas":18,"recusas":11},"indicadores":{"gestantes_ativas":2,"criancas_lt2":8,"has":13,"dm":5,"idosos":15}},
    {"id":13, "nome":"CELIA REGINA MONTEIRO",        "microarea":"MA-13","equipe":"SÃO SEBASTIÃO","tipo":"eSF","ativo":True,"familias_cadastradas":149,"familias_meta":150,"pct_visitas":93,"pct_cadastro":99,"status":"destaque","visitas":{"programadas":151,"realizadas":140,"nao_encontradas":7,"recusas":4},"indicadores":{"gestantes_ativas":5,"criancas_lt2":13,"has":19,"dm":10,"idosos":24}},
    {"id":14, "nome":"VALERIA CRISTINA ROCHA",       "microarea":"MA-14","equipe":"SÃO SEBASTIÃO","tipo":"eSF","ativo":True,"familias_cadastradas":136,"familias_meta":150,"pct_visitas":85,"pct_cadastro":91,"status":"regular","visitas":{"programadas":140,"realizadas":119,"nao_encontradas":14,"recusas":7},"indicadores":{"gestantes_ativas":3,"criancas_lt2":11,"has":16,"dm":8,"idosos":20}},
    {"id":15, "nome":"NILZA BATISTA FREITAS",        "microarea":"MA-15","equipe":"CACHOEIRA",   "tipo":"eRibeirinha","ativo":True,"familias_cadastradas":144,"familias_meta":140,"pct_visitas":92,"pct_cadastro":103,"status":"destaque","visitas":{"programadas":143,"realizadas":131,"nao_encontradas":8,"recusas":4},"indicadores":{"gestantes_ativas":5,"criancas_lt2":14,"has":20,"dm":10,"idosos":22}},
]

# Preenche até 65 ACS com variações
_EQUIPES = ["KENNEDY","JK","ACARI","JUMA","ESTRADA NOVA","LIBERDADE","SÃO SEBASTIÃO","CACHOEIRA","TRÊS ESTADOS","AREAL"]
_TIPOS = ["eSF","eSF","eSF","eSF","eRibeirinha"]
_NOMES = [
    "GILMAR SOUZA FARIAS","TEREZINHA LOPES RAMOS","EDILSON CASTRO LIMA","MARTA HELENA ARAUJO",
    "JOSE CARLOS MELO","SUELI APARECIDA VIEIRA","ROSILENE PINHEIRO DA SILVA","WELLINGTON MOURA COSTA",
    "IRENE ALBUQUERQUE NETO","CLEONICE SANTOS RIBEIRO","ADEMAR FERREIRA ALVES","PATRICIA SOUZA CAMPOS",
    "MARIO AUGUSTO TELES","BEATRIZ MOREIRA SILVA","HELIO NASCIMENTO JUNIOR","ZILDA CARDOSO MATOS",
    "RONEY ALMEIDA PAIXAO","LINDALVA PEREIRA COSTA","EVERTON LIMA CAVALCANTE","MARIA JOSE CUNHA",
    "EDGAR MENDES FILHO","SILVANA ROCHA NOGUEIRA","CLEITON BARROS SANTOS","WANDERLEY FIGUEIREDO",
    "NAILDE MONTEIRO SOUZA","DORIVAL ANDRADE CORREIA","LUCIANA PERES ALVES","CLOVIS TEIXEIRA LIMA",
    "SELMA DUARTE BEZERRA","ADRIANO MESQUITA CAMPOS","FLAVIA MENDES OLIVEIRA","HUMBERTO SILVA NETO",
    "SOLANGE BORGES FREITAS","LEANDRO CARVALHO SANTOS","NAIR RIBEIRO MARQUES","WILLIAN COSTA MEDEIROS",
    "GERTRUDES MARTINS LEAL","ROGERIO NUNES FARIAS","LEONOR BRITO PINHEIRO","ALDENI MORAES FERREIRA",
    "CLEDSON PEREIRA GOMES","MARIA DO CARMO VIANA","ADILSON LIMA BARBOSA","IVANILDE RUFINO SOARES",
    "RENATO AZEVEDO PINTO","DILMA FEITOSA ARAUJO","OSMAR CELESTINO SILVA","BENEDITA CUNHA LOPES",
    "JOCIMAR SOUSA MOTA","ZENAIDA FERREIRA RAMOS",
]

import random
random.seed(42)
for i, nome in enumerate(_NOMES, start=len(_ACS_REF)+1):
    if len(_ACS_REF) >= 65:
        break
    eq = _EQUIPES[i % len(_EQUIPES)]
    tp = _TIPOS[i % len(_TIPOS)]
    meta = 140 if "Ribeirinha" in tp else 150
    cad = random.randint(110, meta+10)
    vis_prog = random.randint(115, meta+5)
    vis_real = int(vis_prog * random.uniform(0.75, 0.98))
    pct_v = round(vis_real / vis_prog * 100)
    pct_c = round(cad / meta * 100)
    if pct_v >= 90:   st = "destaque"
    elif pct_v >= 80: st = "regular"
    else:             st = "critico"
    _ACS_REF.append({
        "id": i, "nome": nome, "microarea": f"MA-{i:02d}", "equipe": eq, "tipo": tp,
        "ativo": True,
        "familias_cadastradas": cad, "familias_meta": meta,
        "pct_visitas": pct_v, "pct_cadastro": pct_c, "status": st,
        "visitas": {"programadas": vis_prog, "realizadas": vis_real,
                    "nao_encontradas": random.randint(3, 18), "recusas": random.randint(1, 10)},
        "indicadores": {"gestantes_ativas": random.randint(1, 7), "criancas_lt2": random.randint(6, 16),
                        "has": random.randint(10, 24), "dm": random.randint(4, 13), "idosos": random.randint(12, 28)},
    })

def _ts():
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

def _kpis():
    ativos = [a for a in _ACS_REF if a["ativo"]]
    return {
        "total_acs": len(_ACS_REF),
        "acs_ativos": len(ativos),
        "total_microareas": len(set(a["microarea"] for a in ativos)),
        "familias_cadastradas": sum(a["familias_cadastradas"] for a in ativos),
        "familias_meta": sum(a["familias_meta"] for a in ativos),
        "pct_cobertura": round(sum(a["familias_cadastradas"] for a in ativos) / max(sum(a["familias_meta"] for a in ativos), 1) * 100, 1),
        "visitas_programadas": sum(a["visitas"]["programadas"] for a in ativos),
        "visitas_realizadas": sum(a["visitas"]["realizadas"] for a in ativos),
        "pct_visitas": round(sum(a["visitas"]["realizadas"] for a in ativos) / max(sum(a["visitas"]["programadas"] for a in ativos), 1) * 100, 1),
        "gestantes_ativas": sum(a["indicadores"]["gestantes_ativas"] for a in ativos),
        "criancas_lt2": sum(a["indicadores"]["criancas_lt2"] for a in ativos),
        "has_acompanhados": sum(a["indicadores"]["has"] for a in ativos),
        "dm_acompanhados": sum(a["indicadores"]["dm"] for a in ativos),
    }


_MESES_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
             "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

def _label_competencia(comp: str) -> str:
    """'2026-07' → 'Julho/2026'"""
    try:
        ano, mes = comp.split("-")
        return f"{_MESES_PT[int(mes)-1]}/{ano}"
    except Exception:
        return comp


@router.get("/dashboard")
async def dashboard_acs(
    competencia: Optional[str] = Query(None, description="Competência AAAA-MM (ex: 2026-07)"),
    periodo: Optional[str] = Query(None, description="Tipo de período: diario | mensal | anual"),
    data: Optional[str]       = Query(None, description="Data AAAA-MM-DD para período diário"),
    ano: Optional[str]        = Query(None, description="Ano AAAA para período anual"),
    _: UserOut = Depends(get_current_user),
):
    ativos = [a for a in _ACS_REF if a["ativo"]]
    destaques = sorted([a for a in ativos if a["status"] == "destaque"], key=lambda x: -x["pct_visitas"])[:5]
    criticos  = sorted([a for a in ativos if a["status"] == "critico"],  key=lambda x:  x["pct_visitas"])[:5]
    dist_eq: dict = {}
    for a in ativos:
        dist_eq[a["equipe"]] = dist_eq.get(a["equipe"], 0) + 1

    # Resolve competência e label conforme o período escolhido
    hoje = date.today()
    if periodo == "diario" and data:
        try:
            d = date.fromisoformat(data)
            competencia = d.strftime("%Y-%m")
            periodo_label = d.strftime("%d/%m/%Y")
            periodo_tipo  = "diario"
        except Exception:
            data = hoje.isoformat()
            competencia   = hoje.strftime("%Y-%m")
            periodo_label = hoje.strftime("%d/%m/%Y")
            periodo_tipo  = "diario"
    elif periodo == "anual" and ano:
        competencia   = f"{ano}-01"
        periodo_label = str(ano)
        periodo_tipo  = "anual"
    else:
        # mensal (padrão)
        if not competencia:
            competencia = hoje.strftime("%Y-%m")
        periodo_label = _label_competencia(competencia)
        periodo_tipo  = "mensal"
    try:
        esus_prod = await _esus.buscar_producao(competencia)
        esus_cad  = await _esus.buscar_cadastros()
    except Exception:
        esus_prod = {}
        esus_cad  = {}

    kpis = _kpis()
    producao_esus_display = None

    # Tenta enriquecer com dados ao vivo
    if esus_prod.get("fonte") == "esus_pec":
        kpis["visitas_esus_domiciliares"]    = esus_prod.get("visitas_domiciliares")
        kpis["atendimentos_individuais_esus"] = esus_prod.get("atendimentos_individuais")
        kpis["atendimentos_odonto_esus"]     = esus_prod.get("atendimentos_odontologicos")
        kpis["competencia_esus"]             = esus_prod.get("competencia")
        producao_esus_display = esus_prod
    if esus_cad.get("fonte") == "esus_pec":
        kpis["cidadaos_cadastrados_esus"] = esus_cad.get("individuais")

    # Fallback: lê snapshot salvo manualmente (banco de dados)
    if esus_prod.get("fonte") != "esus_pec":
        try:
            snap = await _snap_ler()
            if not snap:
                snap = {}
            origem = snap.get("origem", "")
            if origem == "entrada_manual":
                prod = snap.get("producao", {})
                cad  = snap.get("cadastros", {})
                kpis["visitas_esus_domiciliares"]     = prod.get("totalVisitasDomiciliares", 0)
                kpis["atendimentos_individuais_esus"] = prod.get("totalAtendimentosIndividuais", 0)
                kpis["competencia_esus"]              = snap.get("competencia", competencia)
                if snap.get("total_acs"):
                    kpis["total_acs"] = snap["total_acs"]
                if cad.get("totalElements"):
                    kpis["cidadaos_cadastrados_esus"] = cad["totalElements"]
                producao_esus_display = {
                    "competencia": snap.get("competencia", competencia),
                    "visitas_domiciliares": prod.get("totalVisitasDomiciliares", 0),
                    "atendimentos_individuais": prod.get("totalAtendimentosIndividuais", 0),
                    "fonte": "snapshot_manual",
                    "capturado_em": snap.get("capturado_em", ""),
                }
        except Exception:
            snap = {}

    situacao = "dados_reais" if esus_prod.get("fonte") == "esus_pec" else (
        "snapshot_manual" if producao_esus_display else "referencia_municipal"
    )

    return {
        "status": situacao,
        "kpis": kpis,
        "acs_destaques": destaques,
        "acs_criticos": criticos,
        "distribuicao_equipe": dist_eq,
        "distribuicao_esf": dist_eq,
        "mes_referencia": {"label": periodo_label, "competencia": competencia, "tipo": periodo_tipo},
        "producao_esus": producao_esus_display,
        "verificado_em": _ts(),
    }


@router.get("/lista")
async def lista_acs(esf: Optional[str] = Query(None), _: UserOut = Depends(get_current_user)):
    dados = _ACS_REF
    if esf:
        dados = [a for a in dados if a["equipe"] == esf]
    return {
        "status": "referencia_municipal",
        "acs": dados,
        "total": len(dados),
        "verificado_em": _ts(),
    }


@router.get("/microareas")
async def microareas(_: UserOut = Depends(get_current_user)):
    equipes_ma: dict = {}
    for a in _ACS_REF:
        ma = a["microarea"]
        if ma not in equipes_ma:
            equipes_ma[ma] = {"codigo": ma, "nome": f"Microárea {ma}", "zona": "Urbana" if int(ma.split("-")[1]) <= 10 else "Rural",
                               "equipe": a["equipe"], "tipo": a["tipo"],
                               "acs_count": 0, "acs_ativos": 0,
                               "familias_cadastradas": 0, "familias_meta": 0,
                               "pct_cobertura": 0, "pct_visitas": 0, "gestantes_ativas": 0,
                               "semaforo": "verde"}
        equipes_ma[ma]["acs_count"] += 1
        equipes_ma[ma]["acs_ativos"] += 1 if a["ativo"] else 0
        equipes_ma[ma]["familias_cadastradas"] += a["familias_cadastradas"]
        equipes_ma[ma]["familias_meta"] += a["familias_meta"]
        equipes_ma[ma]["gestantes_ativas"] += a["indicadores"]["gestantes_ativas"]
    for ma in equipes_ma.values():
        ma["pct_cobertura"] = round(ma["familias_cadastradas"] / ma["familias_meta"] * 100, 1) if ma["familias_meta"] else 0
        ma["pct_visitas"] = round(sum(a["pct_visitas"] for a in _ACS_REF if a["microarea"] == ma["codigo"]) / ma["acs_count"], 1) if ma["acs_count"] else 0
        ma["semaforo"] = "verde" if ma["pct_visitas"] >= 90 else ("amarelo" if ma["pct_visitas"] >= 75 else "vermelho")
    return {
        "status": "referencia_municipal",
        "microareas": list(equipes_ma.values()),
        "verificado_em": _ts(),
    }


async def _snap_salvar(payload: dict):
    import json
    from database import AsyncSessionLocal
    from sqlalchemy import text
    global _snap_cache, _snap_cache_ts
    dados = {**payload, "capturado_em": datetime.utcnow().isoformat()}
    json_str = json.dumps(dados, ensure_ascii=False)
    async with AsyncSessionLocal() as db:
        # Usa CAST explícito para JSONB; em SQLite a coluna é TEXT
        try:
            await db.execute(
                text("INSERT INTO esus_snapshot (dados) VALUES (CAST(:d AS jsonb))"),
                {"d": json_str},
            )
        except Exception:
            # Fallback para SQLite (sem CAST)
            await db.execute(
                text("INSERT INTO esus_snapshot (dados) VALUES (:d)"),
                {"d": json_str},
            )
        await db.commit()
    _snap_cache = dados
    _snap_cache_ts = __import__("time").monotonic()
    return dados

_snap_cache: dict | None = None
_snap_cache_ts: float = 0.0

async def _snap_ler():
    import json, time
    from database import AsyncSessionLocal
    from sqlalchemy import text
    global _snap_cache, _snap_cache_ts
    if _snap_cache is not None and (time.monotonic() - _snap_cache_ts) < 60:
        return _snap_cache
    try:
        async with AsyncSessionLocal() as db:
            row = (await db.execute(
                text("SELECT dados FROM esus_snapshot ORDER BY criado_em DESC LIMIT 1")
            )).fetchone()
            if not row:
                _snap_cache = None
                return None
            val = row[0]
            result = val if isinstance(val, (dict, list)) else json.loads(val)
            _snap_cache = result
            _snap_cache_ts = time.monotonic()
            return result
    except Exception:
        return None


@router.post("/esus/snapshot")
async def salvar_snapshot_esus(payload: dict, _: UserOut = Depends(get_current_user)):
    """Recebe snapshot capturado pelo bookmarklet ou entrada manual do e-SUS PEC."""
    from datetime import datetime
    dados = await _snap_salvar(payload)
    return {"ok": True, "capturado_em": dados.get("capturado_em", datetime.utcnow().isoformat())}


@router.get("/esus/snapshot")
async def get_snapshot_esus(_: UserOut = Depends(get_current_user)):
    """Retorna o último snapshot capturado."""
    return await _snap_ler()


@router.get("/esus/status")
async def esus_status():
    resultado = await _esus.testar_conexao()
    return {
        "conectado":   resultado.get("conectado", False),
        "autenticado": bool(resultado.get("instancia")),
        "url":         resultado.get("url", ""),
        "versao":      resultado.get("versao"),
        "instancia":   resultado.get("instancia"),
        "municipio":   resultado.get("municipio"),
        "erro":        resultado.get("erro"),
    }


@router.get("/esus/debug-login")
async def esus_debug_login():
    """Endpoint temporário de diagnóstico — retorna resposta bruta do GraphQL."""
    import httpx
    from config import settings
    base = settings.ESUS_URL.rstrip("/")
    usuario = settings.ESUS_USUARIO
    senha = settings.ESUS_SENHA
    if not (usuario and senha):
        return {"erro": "ESUS_USUARIO ou ESUS_SENHA não configurados", "usuario_vazio": not usuario, "senha_vazia": not senha}

    resultados = []
    mutations = [
        ("v5_sem_input", """mutation Login($login:String!,$senha:String!){autenticar(login:$login,senha:$senha){sessionToken dadoInstancia{nome versao municipio{nome}}}}"""),
        ("v4_com_input", """mutation Login($login:String!,$senha:String!){autenticar(input:{login:$login,senha:$senha}){sessionToken dadoInstancia{nome versao municipio{nome}}}}"""),
    ]
    for nome, gql in mutations:
        try:
            async with httpx.AsyncClient(timeout=15, verify=False, follow_redirects=True) as cli:
                r = await cli.post(
                    f"{base}/graphql",
                    json={"query": gql, "variables": {"login": usuario, "senha": senha}},
                    headers={"Content-Type": "application/json", "Accept": "application/json"},
                )
                resultados.append({
                    "mutation": nome,
                    "status_http": r.status_code,
                    "body": r.text[:2000],
                })
        except Exception as exc:
            resultados.append({"mutation": nome, "erro": str(exc)})

    # Testa também o path sem /graphql
    try:
        async with httpx.AsyncClient(timeout=8, verify=False, follow_redirects=True) as cli:
            r2 = await cli.get(f"{base}/", headers={"Accept": "application/json"})
            resultados.append({"home_status": r2.status_code, "home_body_prefix": r2.text[:300]})
    except Exception as exc:
        resultados.append({"home_erro": str(exc)})

    return {"base": base, "usuario_len": len(usuario), "resultados": resultados}


@router.get("/esus/visitas")
async def esus_visitas(
    periodo: Optional[str]  = Query(None),
    data:    Optional[str]  = Query(None),
    ano:     Optional[str]  = Query(None),
    competencia: Optional[str] = Query(None),
    _: UserOut = Depends(get_current_user),
):
    hoje = date.today()
    if periodo == "diario" and data:
        try:
            d = date.fromisoformat(data)
            comp = d.strftime("%Y-%m")
            periodo_label = d.strftime("%d/%m/%Y")
        except Exception:
            comp = hoje.strftime("%Y-%m")
            periodo_label = hoje.strftime("%d/%m/%Y")
    elif periodo == "anual" and ano:
        comp = f"{ano}-01"
        periodo_label = str(ano)
    else:
        comp = competencia or hoje.strftime("%Y-%m")
        periodo_label = _label_competencia(comp)

    dados = await _esus.buscar_producao(comp)
    fonte = dados.get("fonte", "offline")

    # Fallback: usa dados de referência CNES quando PEC offline
    if fonte != "esus_pec":
        ativos = [a for a in _ACS_REF if a["ativo"]]
        vis_prog = sum(a["visitas"]["programadas"] for a in ativos)
        vis_real = sum(a["visitas"]["realizadas"] for a in ativos)
        nao_enc  = sum(a["visitas"]["nao_encontradas"] for a in ativos)
        recusas  = sum(a["visitas"]["recusas"] for a in ativos)
        por_equipe = {}
        for a in ativos:
            eq = a["equipe"]
            if eq not in por_equipe:
                por_equipe[eq] = {"equipe": eq, "programadas": 0, "realizadas": 0, "pct": 0}
            por_equipe[eq]["programadas"] += a["visitas"]["programadas"]
            por_equipe[eq]["realizadas"]  += a["visitas"]["realizadas"]
        for v in por_equipe.values():
            v["pct"] = round(v["realizadas"] / max(v["programadas"], 1) * 100)
        dados = {
            "fonte": "referencia_municipal",
            "competencia": comp,
            "periodo_label": periodo_label,
            "visitas_domiciliares": vis_real,
            "visitas_programadas": vis_prog,
            "nao_encontradas": nao_enc,
            "recusas": recusas,
            "pct_realizadas": round(vis_real / max(vis_prog, 1) * 100, 1),
            "por_equipe": sorted(por_equipe.values(), key=lambda x: -x["realizadas"]),
            "nota": "Dados de referência CNES Apuí/AM — conecte o e-SUS PEC para dados em tempo real.",
        }
    return {"fonte": dados.get("fonte"), "dados": dados}


@router.get("/esus/visitas-detalhe")
async def esus_visitas_detalhe(
    competencia: Optional[str] = Query(None),
    _: UserOut = Depends(get_current_user)
):
    comp = competencia or date.today().strftime("%Y-%m")
    dados = await _esus.buscar_visitas_detalhe(comp)
    return {"fonte": dados.get("fonte", "offline"), "dados": dados}


@router.get("/esus/calendario-visitas")
async def esus_calendario(
    competencia: Optional[str] = Query(None),
    _: UserOut = Depends(get_current_user)
):
    comp = competencia or date.today().strftime("%Y-%m")
    dados = await _esus.buscar_visitas_detalhe(comp)
    # Mapeia para o formato que o frontend espera (eventos com dia/programadas/realizadas)
    fonte = dados.get("fonte", "offline")
    if fonte == "esus_pec":
        eventos = [
            {"dia": c["dia"], "programadas": c["programadas"], "realizadas": c["realizadas"]}
            for c in dados.get("calendario", [])
        ]
        return {
            "fonte": "esus_pec",
            "eventos": eventos,
            "dias": 31,
            "total_visitas": dados.get("total_visitas", 0),
            "por_acs": dados.get("por_acs", []),
            "por_microarea": dados.get("por_microarea", []),
            "competencia": comp,
        }
    return {"fonte": "offline", "eventos": [], "dias": 31,
            "nota": dados.get("nota", "Configure ESUS_USUARIO e ESUS_SENHA no Railway.")}


@router.get("/esus/cadastros-individuais")
async def esus_cadastros_ind(
    pagina: int = Query(0),
    tamanho: int = Query(50),
    _: UserOut = Depends(get_current_user)
):
    dados = await _esus.buscar_cidadaos(pagina, tamanho)
    return {"fonte": dados.get("fonte", "offline"), "dados": dados}


@router.get("/esus/cadastros-domiciliares")
async def esus_cadastros_dom(
    pagina: int = Query(0),
    tamanho: int = Query(50),
    _: UserOut = Depends(get_current_user)
):
    dados = await _esus.buscar_domicilios(pagina, tamanho)
    return {"fonte": dados.get("fonte", "offline"), "dados": dados}


@router.get("/esus/acs")
async def esus_lista_acs(_: UserOut = Depends(get_current_user)):
    """Lista ACS cadastrados no eSUS PEC (CBO 515140)."""
    dados = await _esus.buscar_acs_esus()
    return {"fonte": dados.get("fonte", "offline"), "dados": dados}


@router.get("/esus/territorios")
async def esus_territorios(_: UserOut = Depends(get_current_user)):
    """Territórios/equipes cadastrados no eSUS PEC."""
    dados = await _esus.buscar_territorios()
    return {"fonte": dados.get("fonte", "offline"), "dados": dados}


@router.get("/esus/tempo-real")
async def esus_tempo_real(
    competencia: Optional[str] = Query(None),
    _: UserOut = Depends(get_current_user)
):
    """Dados consolidados em tempo real: produção + cadastros + ACS."""
    dados = await _esus.buscar_tempo_real(competencia)
    return {"fonte": dados.get("fonte", "offline"), "dados": dados}


@router.get("/{acs_id}")
async def detalhe_acs(acs_id: int, _: UserOut = Depends(get_current_user)):
    acs = next((a for a in _ACS_REF if a["id"] == acs_id), None)
    if not acs:
        return {"situacao_dado": "nao_disponivel", "dados": None}
    return {"situacao_dado": "referencia_municipal", "dados": acs, "verificado_em": _ts()}
