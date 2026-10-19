"""
Painel ACS — cálculos a partir do lote agregado enviado pelo PEC_SYNC_AGENT.

Funções puras (sem banco): recebem o `payload` de um PecAcsLote e devolvem as visões
do Painel ACS. Critérios (documentados em docs/DOC-PEC-ACS-INTEGRACAO.md):

- ACS ativos ............. ACS (CBO 515105) com lotação ativa em equipe, segundo o PEC.
- Famílias/domicílios .... soma dos cadastros domiciliares ativos por microárea (PEC).
- Visitas realizadas ..... fichas de visita domiciliar com desfecho "visita realizada"
                            no período (data de atendimento), por ACS/equipe/microárea.
- % famílias visitadas ... famílias com >= 1 visita realizada no período ÷ famílias
                            cadastradas (só quando o agente envia as duas contagens).
- Cobertura familiar ..... NÃO é calculada aqui: depende de parâmetro populacional e
                            fórmula a validar com a Secretaria; fica None até lá.
- Grupos prioritários .... contagens enviadas pelo agente (critérios declarados pelo
                            próprio agente em payload["criterios"]).

Cadastro NUNCA é tratado como visita/acompanhamento. Valor ausente na origem = None,
nunca zero inventado.
"""
from __future__ import annotations

from collections import defaultdict


ORIGEM_CAPTURA = "captura_assistida_pec_web"      # arquivo importado a partir da tela do PEC
ORIGEM_AUTOMATICA = "pec_web_automatico"          # sincronização automática pela API web do PEC
ORIGENS_TERRITORIO = {ORIGEM_CAPTURA, ORIGEM_AUTOMATICA}


def e_captura(p: dict | None) -> bool:
    """Lote de território do PEC (captura assistida ou sincronização automática; não é do agente local):
    só tem contadores por microárea."""
    return (p or {}).get("origem") in ORIGENS_TERRITORIO


def _soma(itens, campo):
    vals = [i.get(campo) for i in itens if i.get(campo) is not None]
    return sum(vals) if vals else None


def _pct(parte, todo):
    if parte is None or not todo:
        return None
    return round(parte / todo * 100, 1)


def _nome_equipes(p: dict) -> dict[str, str]:
    return {e["ine"]: e.get("nome") or e["ine"] for e in p.get("equipes") or [] if e.get("ine")}


def _filtrar(itens, ine=None, data_ini=None, data_fim=None):
    out = []
    for i in itens:
        if ine and i.get("ine") != ine:
            continue
        d = i.get("data")
        if d and data_ini and d < data_ini:
            continue
        if d and data_fim and d > data_fim:
            continue
        out.append(i)
    return out


def visitas_realizadas(v: dict) -> int:
    """Visita com desfecho conhecido conta só 'realizadas'; sem detalhamento usa o total."""
    return v["realizadas"] if v.get("realizadas") is not None else int(v.get("total") or 0)


def kpis(p: dict, ine: str | None = None, data_ini: str | None = None, data_fim: str | None = None) -> dict:
    acs = [a for a in p.get("acs") or [] if not ine or a.get("ine") == ine]
    micro = _filtrar(p.get("microareas") or [], ine)
    if e_captura(p):
        return _kpis_captura(micro)
    vis = _filtrar(p.get("visitas") or [], ine, data_ini, data_fim)
    grupos = _filtrar(p.get("grupos") or [], ine)
    familias = _soma(micro, "familias")
    fam_visit = _soma(micro, "familias_visitadas")
    return {
        "total_acs": len(acs),
        "acs_ativos": sum(1 for a in acs if a.get("ativo")),
        "total_microareas": len({(m.get("ine"), m.get("codigo")) for m in micro}),
        "familias_cadastradas": familias,
        "domicilios_cadastrados": _soma(micro, "domicilios"),
        "individuos_cadastrados": _soma(micro, "individuos"),
        "familias_visitadas": fam_visit,
        "pct_familias_visitadas": _pct(fam_visit, familias),
        "pct_cobertura": None,  # fórmula a validar com a Secretaria (ver doc)
        "visitas_realizadas": sum(visitas_realizadas(v) for v in vis),
        "visitas_registradas": sum(int(v.get("total") or 0) for v in vis),
        "visitas_recusadas": _soma(vis, "recusadas"),
        "visitas_ausentes": _soma(vis, "ausentes"),
        "gestantes_ativas": _soma(grupos, "gestantes"),
        "criancas_lt2": _soma(grupos, "criancas_menor_2"),
        "has_acompanhados": _soma(grupos, "hipertensos"),
        "dm_acompanhados": _soma(grupos, "diabeticos"),
        "idosos": _soma(grupos, "idosos"),
        "acamados": _soma(grupos, "acamados"),
        "domiciliados": _soma(grupos, "domiciliados"),
    }


def _kpis_captura(micro: list[dict]) -> dict:
    """Captura assistida: só existem imóveis e domicílios visitados por microárea. O resto (ACS, visitas por dia,
    grupos) NÃO foi capturado e fica None — nunca zero. Imóveis 'fora de área' não entram no % de visitas."""
    reais = [m for m in micro if m.get("codigo") != "FORA"]
    fora = [m for m in micro if m.get("codigo") == "FORA"]
    vis, a_vis = _soma(reais, "domicilios_visitados"), _soma(reais, "domicilios_a_visitar")
    return {
        "total_acs": None, "acs_ativos": None,
        "total_microareas": len({(m.get("ine"), m.get("codigo")) for m in reais}),
        "familias_cadastradas": None, "domicilios_cadastrados": _soma(reais, "domicilios"),
        "imoveis_fora_de_area": _soma(fora, "domicilios"),
        "individuos_cadastrados": None, "familias_visitadas": None, "pct_familias_visitadas": None,
        "pct_cobertura": None,
        "domicilios_visitados": vis, "domicilios_a_visitar": a_vis, "pct_domicilios_visitados": _pct(vis, a_vis),
        "visitas_realizadas": None, "visitas_registradas": None, "visitas_recusadas": None, "visitas_ausentes": None,
        "gestantes_ativas": None, "criancas_lt2": None, "has_acompanhados": None, "dm_acompanhados": None,
        "idosos": None, "acamados": None, "domiciliados": None,
    }


def lista_acs(p: dict, ine: str | None = None, data_ini=None, data_fim=None) -> list[dict]:
    equipes = _nome_equipes(p)
    micro = p.get("microareas") or []
    vis = _filtrar(p.get("visitas") or [], None, data_ini, data_fim)
    grupos = p.get("grupos") or []
    vis_por = defaultdict(list)
    for v in vis:
        vis_por[v.get("acs_chave")].append(v)
    saida = []
    for n, a in enumerate(p.get("acs") or [], start=1):
        if ine and a.get("ine") != ine:
            continue
        codigos = set(a.get("microareas") or [])
        m_acs = [m for m in micro if m.get("acs_chave") == a["chave"]
                 or (m.get("codigo") in codigos and m.get("ine") == a.get("ine"))]
        g_acs = [g for g in grupos if g.get("microarea") in codigos and g.get("ine") == a.get("ine")]
        v_acs = vis_por.get(a["chave"], [])
        familias = _soma(m_acs, "familias")
        fam_visit = _soma(m_acs, "familias_visitadas")
        saida.append({
            "id": n,
            "chave": a["chave"],
            "nome": a.get("nome"),
            "microarea": ", ".join(sorted(codigos)) or "—",
            "equipe": equipes.get(a.get("ine"), a.get("ine") or "—"),
            "ine": a.get("ine"),
            "tipo": "ACS",
            "ativo": bool(a.get("ativo")),
            "status": "ativo" if a.get("ativo") else "inativo",
            "familias_cadastradas": familias,
            "familias_meta": None,
            "familias_visitadas": fam_visit,
            "pct_visitas": _pct(fam_visit, familias),
            "pct_cadastro": None,
            "visitas": {
                "programadas": None,
                "realizadas": sum(visitas_realizadas(v) for v in v_acs),
                "nao_encontradas": _soma(v_acs, "ausentes"),
                "recusas": _soma(v_acs, "recusadas"),
            },
            "indicadores": {
                "gestantes_ativas": _soma(g_acs, "gestantes"),
                "criancas_lt2": _soma(g_acs, "criancas_menor_2"),
                "has": _soma(g_acs, "hipertensos"),
                "dm": _soma(g_acs, "diabeticos"),
                "idosos": _soma(g_acs, "idosos"),
            },
        })
    return saida


def microareas(p: dict) -> list[dict]:
    equipes = _nome_equipes(p)
    nomes_acs = {a["chave"]: a.get("nome") for a in p.get("acs") or []}
    grupos = p.get("grupos") or []
    saida = []
    captura = e_captura(p)
    for m in p.get("microareas") or []:
        g = [x for x in grupos if x.get("microarea") == m.get("codigo") and x.get("ine") == m.get("ine")]
        fora = m.get("codigo") == "FORA"
        pct = (None if fora else _pct(m.get("domicilios_visitados"), m.get("domicilios_a_visitar"))) if captura \
            else _pct(m.get("familias_visitadas"), m.get("familias"))
        saida.append({
            "codigo": m.get("codigo"),
            "nome": "Imóveis fora de área (sem microárea)" if fora else f"Microárea {m.get('codigo')}",
            "fora_de_area": fora,
            "domicilios_visitados": m.get("domicilios_visitados"),
            "domicilios_a_visitar": m.get("domicilios_a_visitar"),
            "cadastro_completo": m.get("cadastro_completo"),
            "cadastro_atualizado": m.get("cadastro_atualizado"),
            "equipe": equipes.get(m.get("ine"), m.get("ine") or "—"),
            "ine": m.get("ine"),
            "acs": nomes_acs.get(m.get("acs_chave")),
            "acs_count": 1 if m.get("acs_chave") else 0,
            "acs_ativos": 1 if m.get("acs_chave") else 0,
            "domicilios": m.get("domicilios"),
            "familias_cadastradas": m.get("familias"),
            "individuos": m.get("individuos"),
            "familias_meta": None,
            "pct_cobertura": None,
            "pct_visitas": pct,
            "gestantes_ativas": _soma(g, "gestantes"),
            # captura parcial (mês em andamento) não recebe semáforo: o % ainda vai subir até o fim do mês
            "semaforo": None if (pct is None or fora or p.get("parcial_ate")) else
                        ("verde" if pct >= 90 else "amarelo" if pct >= 70 else "vermelho"),
        })
    return saida


def visitas_periodo(p: dict, data_ini: str | None, data_fim: str | None, rotulo: str) -> dict:
    equipes = _nome_equipes(p)
    vis = _filtrar(p.get("visitas") or [], None, data_ini, data_fim)
    por_eq = defaultdict(lambda: {"realizadas": 0, "registradas": 0})
    por_dia = defaultdict(int)
    for v in vis:
        e = por_eq[equipes.get(v.get("ine"), v.get("ine") or "Sem equipe")]
        e["realizadas"] += visitas_realizadas(v)
        e["registradas"] += int(v.get("total") or 0)
        if v.get("data"):
            por_dia[v["data"]] += visitas_realizadas(v)
    return {
        "fonte": "esus_pec",
        "periodo_label": rotulo,
        "competencia": p.get("competencia"),
        "visitas_domiciliares": sum(visitas_realizadas(v) for v in vis),
        "visitas_registradas": sum(int(v.get("total") or 0) for v in vis),
        "visitas_programadas": None,
        "pct_realizadas": None,
        "nao_encontradas": _soma(vis, "ausentes"),
        "recusas": _soma(vis, "recusadas"),
        "acs_ativos": sum(1 for a in p.get("acs") or [] if a.get("ativo")),
        "por_equipe": [{"equipe": k, "programadas": None, "realizadas": v["realizadas"],
                        "registradas": v["registradas"], "pct": None}
                       for k, v in sorted(por_eq.items())],
        "por_dia": [{"data": d, "realizadas": n} for d, n in sorted(por_dia.items())],
    }
