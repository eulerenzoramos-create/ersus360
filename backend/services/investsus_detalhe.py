"""
INVESTSUS 360 — detalhe da proposta (tela "Visualizar" do InvestSUS).

Normaliza, sem acesso a banco, o que o navegador do usuário buscou na API oficial
para UMA proposta:

    cadastro   GET /indicacao-objeto/proposta/{coProposta}/cadastro
    pareceres  GET /propostas/{numero}/pareceres
    repasses   GET /propostas/{numero}/repasses
    anexos     GET /propostas/{numero}/anexos
    planos     GET /indicacao-objeto/plano-trabalho/{idPlanoTrabalho}   (um por estabelecimento)

Campos confirmados na API em 16/10/2026 (Apuí/AM). Propostas canceladas/rejeitadas
não têm cadastro (a API responde 500) — nesse caso só pareceres/anexos são usados.
"""
from __future__ import annotations

import html
from datetime import date, datetime

from services import investsus_federal as fed

# Natureza de despesa (elemento) — descrições usuais nas propostas do Fundo a Fundo
NATUREZAS = {
    "339030": "Material de Consumo",
    "339032": "Material, Bem ou Serviço para Distribuição Gratuita",
    "339033": "Passagens e Despesas com Locomoção",
    "339014": "Diárias — Civil",
    "339036": "Outros Serviços de Terceiros — Pessoa Física",
    "339039": "Outros Serviços de Terceiros — Pessoa Jurídica",
    "339040": "Serviços de Tecnologia da Informação e Comunicação — PJ",
    "339047": "Obrigações Tributárias e Contributivas",
    "449051": "Obras e Instalações",
    "449052": "Equipamentos e Material Permanente",
}


def somente_digitos(v) -> str:
    return "".join(c for c in str(v or "") if c.isdigit())


def _texto(v) -> str | None:
    if v is None:
        return None
    t = html.unescape(str(v)).strip()
    return t or None


def _data(v) -> date | None:
    """'2026-05-22T21:20:39Z' → date (data local do evento no InvestSUS)."""
    if not v:
        return None
    try:
        return datetime.fromisoformat(str(v).replace("Z", "+00:00")).date()
    except ValueError:
        try:
            return datetime.strptime(str(v)[:10], "%Y-%m-%d").date()
        except ValueError:
            return None


def _num(v) -> float:
    try:
        return float(v or 0)
    except (TypeError, ValueError):
        return 0.0


def resultado_parecer(situacao: str | None) -> str:
    t = fed._norm(situacao)
    if "nao favoravel" in t or "desfavoravel" in t or "indeferid" in t:
        return "desfavoravel"
    if "diligencia" in t:
        return "diligencia"
    if "favoravel" in t:
        return "favoravel"
    return "pendente"


def tipo_parecer(grupo: str | None) -> str:
    t = fed._norm(grupo)
    if "merito" in t:
        return "merito"
    if "economic" in t or "financ" in t or "orcament" in t:
        return "financeiro"
    if "juridic" in t:
        return "juridico"
    if "tecnic" in t:
        return "tecnico"
    return "complementar"


def tipo_financiamento(gnd: str | None) -> str | None:
    t = fed._norm(gnd)
    if "corrente" in t or "custeio" in t:
        return "custeio"
    if "capital" in t or "investimento" in t:
        return "investimento"
    return None


def _caminho_meta(meta: dict) -> list[str]:
    """Meta folha → [raiz, ..., folha] (descrições)."""
    nomes = []
    m = meta
    while isinstance(m, dict) and m:
        if m.get("descricao"):
            nomes.append(str(m["descricao"]).strip())
        m = m.get("metaPai")
    return list(reversed(nomes))


def normalizar_detalhe(det: dict, cnpj_fundo: str) -> dict:
    """Um item {numero, cadastro, pareceres, repasses, anexos, planos} → dados prontos
    para gravar. `cnpj_ok` = False quando o cadastro é de outro Fundo (descartar)."""
    cnpj_fundo = somente_digitos(cnpj_fundo)
    numero = str(det.get("numero") or "").strip()
    cad = det.get("cadastro") if isinstance(det.get("cadastro"), dict) else {}
    projeto = cad.get("projeto") or {}
    objeto = cad.get("objeto") or {}

    cnpj_cad = somente_digitos(projeto.get("cnpjFundo") or projeto.get("cnpjEntidade"))
    cnpj_ok = not cnpj_cad or cnpj_cad == cnpj_fundo

    # Estabelecimentos (CNES) e emendas/parlamentares
    unidades, emendas = [], []
    for est in cad.get("indicacoes") or []:
        unidades.append({
            "cnes": str(est.get("cnes") or "").strip() or None,
            "nome": _texto(est.get("nomeEstabelecimento")),
            "valor": _num(est.get("valorDisponivel") or est.get("valorPlanoTrabalho")),
            "id_plano": est.get("idPlanoTrabalho"),
        })
        for ind in est.get("indicacoes") or []:
            emendas.append({
                "numero_emenda": str(ind.get("numeroEmenda") or "").strip() or None,
                "parlamentar": _texto(ind.get("nomeParlamentar")),
                "tipo_emenda": _texto(ind.get("idTipoEmenda") or est.get("idTipoEmenda")),
                "valor_indicado": _num(ind.get("valorIndicado")),
            })

    tipos = sorted({e["tipo_emenda"] for e in emendas if e["tipo_emenda"]})
    modalidade = None
    if tipos:
        modalidades = {fed.classificar_modalidade(t) for t in tipos}
        modalidades.discard(None)
        modalidade = modalidades.pop() if len(modalidades) == 1 else None
    elif cad and fed._norm(projeto.get("coTipoRecurso")) == "programa":
        modalidade = "programa"

    acao = " — ".join(x for x in [objeto.get("codigoAcao"), _texto(objeto.get("descricaoAcao"))] if x) or None
    pas = cad.get("programacaoAnualSaude") or {}
    diretriz = pas.get("diretriz") or {}
    objetivo = diretriz.get("objetivo") or {}
    metas_pas = [m.get("descricao") for m in (objetivo.get("meta") or []) if m.get("descricao")]

    proposta = {}
    if cad:
        proposta = {
            "objeto": _texto(objeto.get("descricaoObjeto")),
            "finalidade": _texto(objeto.get("descricaoComponente")),
            "tipo_objeto": _texto(objeto.get("descricaoTipoProposta") or projeto.get("coTipoProjeto")),
            "bloco_financiamento": _texto(objeto.get("descricaoProgramaEstrategico")),
            "tipo_financiamento": tipo_financiamento(objeto.get("descricaoGnd")),
            "acao_orcamentaria": (acao or "")[:200] or None,
            "modalidade_transferencia": "Fundo a Fundo",
            "valor_proposta": _num(projeto.get("vlProposta")),
            "valor_indicado": sum(e["valor_indicado"] for e in emendas) or _num(projeto.get("vlProposta")),
            "entidade_uf": (projeto.get("sgUf") or None),
            "programa_trabalho": projeto.get("dsProgramaTrabalho"),
            "situacao_interna_ms": _texto(projeto.get("stInterna")),
        }

    digisus = {}
    if diretriz:
        digisus = {
            "digisus_exercicio": int(pas["ano"]) if str(pas.get("ano") or "").isdigit() else None,
            "digisus_diretriz": _texto(diretriz.get("descricao")),
            "digisus_objetivo": _texto(objetivo.get("descricao")),
            "digisus_meta": "\n".join(_texto(m) or "" for m in metas_pas) or None,
            "digisus_situacao_vinculacao": _texto(pas.get("situacao")),
        }

    planos = []
    for pl in det.get("planos") or []:
        if not isinstance(pl, dict) or not pl.get("id"):
            continue
        metas = []
        for m in pl.get("metas") or []:
            caminho = _caminho_meta(m.get("meta") or {})
            metas.append({
                "id_externo": str(m.get("id")),
                "descricao": caminho[-1] if caminho else "Meta",
                "categoria": (caminho[-2] if len(caminho) > 1 else None),
                "caminho": " › ".join(caminho) or None,
                "valor": _num(m.get("valor")),
            })
        planos.append({
            "id_externo": str(pl.get("id")),
            "cnes": str(pl.get("cnes") or "").strip() or None,
            "valor": _num(pl.get("valor")),
            "justificativa": _texto(pl.get("justificativa")),
            "metas": metas,
            "naturezas": [{"codigo": str(n.get("idNaturezaDespesa") or "").strip(),
                           "descricao": NATUREZAS.get(str(n.get("idNaturezaDespesa") or "").strip()),
                           "valor": _num(n.get("valor"))}
                          for n in pl.get("naturezas") or [] if n.get("idNaturezaDespesa")],
        })

    pareceres = []
    for p in det.get("pareceres") or []:
        if not isinstance(p, dict):
            continue
        res = resultado_parecer(p.get("descricaoSituacao"))
        pareceres.append({
            "numero_parecer": str(p.get("idParecer") or "").strip() or None,
            "area_responsavel": _texto(p.get("areaResponsavel")),
            "sigla_area": (_texto(p.get("areaResponsavel")) or "").split(" - ")[0][:50] or None,
            "data_parecer": _data(p.get("dataParecer")),
            "tipo": tipo_parecer(p.get("descricaoGrupoParecer")),
            "resultado": res,
            "eh_diligencia": res == "diligencia",
            "texto": f"{_texto(p.get('descricaoGrupoParecer')) or 'Parecer'}: {_texto(p.get('descricaoSituacao')) or ''}".strip(),
        })

    repasses = []
    for r in det.get("repasses") or []:
        if not isinstance(r, dict):
            continue
        repasses.append({
            "ordem_bancaria": str(r.get("numeroOrdemPagamento") or "").strip() or None,
            "data_pagamento": _data(r.get("dataPagamento")),
            "valor": _num(r.get("valorRepassado")),
            "numero_processo": str(r.get("numeroProcessoPagamento") or "").strip() or None,
            "situacao": _texto(r.get("localProcessoPagamento")),
        })

    anexos = [{
        "id_externo": str(a.get("codigo")),
        "nome": (_texto(a.get("documento")) or "Anexo")[:300],
        "tipo": (_texto(a.get("descricaoDocumento")) or "")[:100] or None,
    } for a in det.get("anexos") or [] if isinstance(a, dict) and a.get("codigo")]

    return {
        "numero": numero,
        "cnpj_ok": cnpj_ok,
        "tem_cadastro": bool(cad),
        "proposta": proposta,
        "modalidade": modalidade,
        "emendas": emendas,
        "unidades": unidades,
        "digisus": digisus,
        "planos": planos,
        "pareceres": pareceres,
        "repasses": repasses,
        "anexos": anexos,
    }
