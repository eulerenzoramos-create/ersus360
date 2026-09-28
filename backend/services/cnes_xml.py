"""
Leitura e conferência do XML-CNES para o e-SUS APS (SISAB → "Gerador de Arquivo
XML-CNES", versões 3.0/3.1: raiz <ImportarXMLCNES>, atributos em MAIÚSCULAS).

O arquivo traz TODOS os estabelecimentos da administração pública do município
com nível de atenção cadastrado, as equipes (INE) e as lotações de cada
profissional (CNES, CBO, INE). Aqui:

  1. `ler_arquivo`  — valida e extrai (aceita .xml ou o .zip baixado do SISAB),
                      descartando os dados pessoais que não usamos.
  2. `analisar`     — composição de cada equipe e pendências cadastrais.
  3. `comparar`     — o que mudou em relação à importação anterior.

Limites conhecidos do formato (conferidos no arquivo real de Apuí, 28/09/2026):
  - não informa se a eSF é ribeirinha/quilombola/indígena → a marcação vem da
    referência verificada no CNES Web, quando existir para o município;
  - a MICROAREA das lotações de ACS vem vazia → não geramos pendência por isso.
"""
from __future__ import annotations

import io
import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict

TAMANHO_MAXIMO = 20 * 1024 * 1024          # o XML de um município grande tem poucos MB

TIPOS_EQUIPE = {"70": "eSF", "71": "eSB", "72": "eMulti"}

# Famílias CBO usadas na conferência da composição mínima
CBO_MEDICO = ("225",)                       # médicos (clínico, MFC, generalista…)
CBO_ENFERMEIRO = ("2235",)
CBO_TEC_AUX_ENF = ("3222",)
CBO_ACS = ("515105",)
CBO_DENTISTA = ("2232",)
CBO_ASB_TSB = ("3224",)

SEVERIDADES = ("critica", "alerta", "info")


class ArquivoInvalido(ValueError):
    """Arquivo que não é um XML-CNES do SISAB utilizável."""


# ── 1. Leitura ────────────────────────────────────────────────────────────────

def _extrair_xml(conteudo: bytes, nome: str) -> bytes:
    if len(conteudo) > TAMANHO_MAXIMO:
        raise ArquivoInvalido("Arquivo maior que 20 MB")
    if conteudo[:2] == b"PK" or (nome or "").lower().endswith(".zip"):
        try:
            with zipfile.ZipFile(io.BytesIO(conteudo)) as z:
                xmls = [i for i in z.infolist() if i.filename.lower().endswith(".xml")]
                if len(xmls) != 1:
                    raise ArquivoInvalido("O .zip deve conter exatamente um arquivo .xml")
                if xmls[0].file_size > TAMANHO_MAXIMO:
                    raise ArquivoInvalido("XML dentro do .zip maior que 20 MB")
                return z.read(xmls[0])
        except zipfile.BadZipFile as e:
            raise ArquivoInvalido("Arquivo .zip corrompido") from e
    return conteudo


def _cnes(v: str | None) -> str:
    return (v or "").strip().zfill(7) if (v or "").strip() else ""


def _ine(v: str | None) -> str:
    return (v or "").strip().zfill(10) if (v or "").strip() else ""


def ler_arquivo(conteudo: bytes, nome: str = "") -> dict:
    """Extrai o retrato do CNES. Levanta ArquivoInvalido se não for o formato do SISAB."""
    bruto = _extrair_xml(conteudo, nome)
    if b"<!DOCTYPE" in bruto[:4096].upper() or b"<!ENTITY" in bruto.upper():
        raise ArquivoInvalido("XML com DOCTYPE/ENTITY não é aceito")
    try:
        raiz = ET.fromstring(bruto)
    except ET.ParseError as e:
        raise ArquivoInvalido(f"XML mal formado: {e}") from e
    if raiz.tag.split("}")[-1] != "ImportarXMLCNES":
        raise ArquivoInvalido("Não é o XML-CNES do SISAB (raiz esperada: ImportarXMLCNES). "
                              "Gere o arquivo em SISAB → Gerador de Arquivo XML-CNES para o e-SUS APS.")
    ident = raiz.find("IDENTIFICACAO")
    if ident is None:
        raise ArquivoInvalido("XML sem o bloco IDENTIFICACAO")
    ibge = (ident.get("CO_IBGE_MUN") or "").strip()
    if len(ibge) not in (6, 7) or not ibge.isdigit():
        raise ArquivoInvalido("XML sem o código IBGE do município (CO_IBGE_MUN)")

    estabelecimentos: list[dict] = []
    equipes: dict[str, dict] = {}
    for est in ident.findall("ESTABELECIMENTOS/DADOS_GERAIS_ESTABELECIMENTOS"):
        cnes = _cnes(est.get("CNES"))
        estabelecimentos.append({
            "cnes": cnes, "nome": (est.get("NM_FANTA") or "").strip(),
            "tipo": (est.get("DS_TP_UNID") or "").strip(),
            "subtipo": (est.get("DS_SUBTIPO_UNID") or "").strip() or None,
        })
        for eq in est.findall("EQUIPES/DADOS_EQUIPES"):
            ine = _ine(eq.get("CO_INE"))
            if not ine:
                continue
            reg = equipes.setdefault(ine, {
                "ine": ine, "nome": (eq.get("NM_REFERENCIA") or "").strip(),
                "tp_equipe": (eq.get("TP_EQUIPE") or "").strip(),
                "sigla": (eq.get("SG_EQUIPE") or "").strip(),
                "descricao": (eq.get("DS_EQUIPE") or "").strip(),
                "area": (eq.get("CO_AREA") or "").strip(),
                "desativada_em": (eq.get("DT_DESATIVACAO") or "").strip() or None,
                "estabelecimentos": [],
            })
            if cnes and cnes not in reg["estabelecimentos"]:
                reg["estabelecimentos"].append(cnes)   # eMulti costuma apoiar várias UBS

    profissionais: list[dict] = []
    for p in ident.findall("PROFISSIONAIS/DADOS_PROFISSIONAIS"):
        lot = [{"cnes": _cnes(l.get("CNES")), "cbo": (l.get("CO_CBO") or "").strip().upper(),
                "ine": _ine(l.get("CO_INE")) or None}
               for l in p.findall("LOTACOES/DADOS_LOTACOES")]
        # Só CNS e nome: CPF, nascimento, sexo, endereço, contatos e registro de
        # conselho existem no arquivo mas não são necessários → não são guardados.
        profissionais.append({"cns": (p.get("CO_CNS") or "").strip(),
                              "nome": (p.get("NM_PROF") or "").strip(), "lotacoes": lot})

    return {
        "municipio_ibge": ibge,
        "data_arquivo": (ident.get("DATA") or "").strip() or None,
        "versao_xsd": (ident.get("VERSAO_XSD") or "").strip() or None,
        "estabelecimentos": estabelecimentos,
        "equipes": sorted(equipes.values(), key=lambda e: (e["tp_equipe"], e["nome"])),
        "profissionais": profissionais,
    }


def totais(dados: dict) -> dict:
    eqs = dados["equipes"]
    return {
        "estabelecimentos": len(dados["estabelecimentos"]),
        "equipes": len(eqs),
        "equipes_ativas": sum(1 for e in eqs if not e["desativada_em"]),
        "por_tipo": {TIPOS_EQUIPE.get(t, t): sum(1 for e in eqs if e["tp_equipe"] == t and not e["desativada_em"])
                     for t in sorted({e["tp_equipe"] for e in eqs})},
        "profissionais": len(dados["profissionais"]),
        "lotacoes": sum(len(p["lotacoes"]) for p in dados["profissionais"]),
    }


def mesmo_municipio(ibge_arquivo: str, ibge_sessao: str | None) -> bool:
    return bool(ibge_sessao) and ibge_arquivo[:6] == ibge_sessao[:6]


# ── 2. Análise ────────────────────────────────────────────────────────────────

def _tem(cbos: list[str], prefixos: tuple[str, ...]) -> bool:
    return any(c.startswith(prefixos) for c in cbos)


def analisar(dados: dict, marcacoes: dict[str, dict] | None = None) -> dict:
    """Composição por equipe + pendências. `marcacoes` = {INE: {"ribeirinha": bool, "fonte": str}}
    vindas de uma referência verificada (o XML não traz essa informação)."""
    marcacoes = marcacoes or {}
    nomes_estab = {e["cnes"]: e["nome"] for e in dados["estabelecimentos"]}
    por_ine: dict[str, list[dict]] = defaultdict(list)
    for p in dados["profissionais"]:
        for l in p["lotacoes"]:
            if l["ine"]:
                por_ine[l["ine"]].append({"nome": p["nome"], "cns": p["cns"], "cbo": l["cbo"], "cnes": l["cnes"]})

    pendencias: list[dict] = []

    def pend(sev, codigo, equipe, mensagem, orientacao):
        pendencias.append({"severidade": sev, "codigo": codigo, "ine": equipe["ine"] if equipe else None,
                           "equipe": equipe["nome"] if equipe else None, "mensagem": mensagem,
                           "orientacao": orientacao})

    ines_arquivo = {e["ine"] for e in dados["equipes"]}
    equipes_out = []
    for eq in dados["equipes"]:
        membros = por_ine.get(eq["ine"], [])
        cbos = [m["cbo"] for m in membros]
        tipo = TIPOS_EQUIPE.get(eq["tp_equipe"], eq["sigla"] or eq["tp_equipe"])
        marc = marcacoes.get(eq["ine"], {})
        comp = {"medico": sum(c.startswith(CBO_MEDICO) for c in cbos),
                "enfermeiro": sum(c.startswith(CBO_ENFERMEIRO) for c in cbos),
                "tec_aux_enfermagem": sum(c.startswith(CBO_TEC_AUX_ENF) for c in cbos),
                "acs": sum(c.startswith(CBO_ACS) for c in cbos),
                "dentista": sum(c.startswith(CBO_DENTISTA) for c in cbos),
                "asb_tsb": sum(c.startswith(CBO_ASB_TSB) for c in cbos)}
        equipes_out.append({**eq, "tipo": tipo, "ribeirinha": marc.get("ribeirinha"),
                            "fonte_marcacao": marc.get("fonte"), "total_profissionais": len(membros),
                            "composicao": comp,
                            "estabelecimentos_nomes": [nomes_estab.get(c, c) for c in eq["estabelecimentos"]]})
        if eq["desativada_em"]:
            continue
        if not membros:
            pend("alerta", "EQUIPE_SEM_PROFISSIONAL", eq, f"{tipo} {eq['nome']} sem nenhum profissional lotado",
                 "Conferir as lotações da equipe no SCNES.")
            continue
        if eq["tp_equipe"] == "70":
            for chave, rotulo in (("medico", "médico(a)"), ("enfermeiro", "enfermeiro(a)"), ("acs", "ACS")):
                if not comp[chave]:
                    pend("critica", f"ESF_SEM_{chave.upper()}", eq, f"eSF {eq['nome']} sem {rotulo} lotado(a)",
                         "Composição mínima da eSF incompleta: pode suspender o repasse da equipe. "
                         "Regularizar a lotação no SCNES.")
            if not comp["tec_aux_enfermagem"]:
                pend("alerta", "ESF_SEM_TEC_AUX_ENFERMAGEM", eq,
                     f"eSF {eq['nome']} sem técnico(a)/auxiliar de enfermagem lotado(a)",
                     "Conferir a lotação de técnico/auxiliar de enfermagem no SCNES.")
        elif eq["tp_equipe"] == "71":
            if not comp["dentista"]:
                pend("critica", "ESB_SEM_DENTISTA", eq, f"eSB {eq['nome']} sem cirurgião(ã)-dentista lotado(a)",
                     "Composição mínima da eSB incompleta. Regularizar a lotação no SCNES.")
            if not comp["asb_tsb"]:
                pend("alerta", "ESB_SEM_ASB_TSB", eq, f"eSB {eq['nome']} sem ASB/TSB lotado(a)",
                     "Conferir a lotação de auxiliar/técnico em saúde bucal no SCNES.")

    # Lotação apontando para INE que não está no arquivo (equipe excluída ou de fora do município)
    orfas = sorted({l["ine"] for p in dados["profissionais"] for l in p["lotacoes"]
                    if l["ine"] and l["ine"] not in ines_arquivo})
    for ine in orfas:
        pend("alerta", "LOTACAO_EM_EQUIPE_INEXISTENTE", {"ine": ine, "nome": None},
             f"Há profissional lotado no INE {ine}, que não consta entre as equipes do arquivo",
             "Verificar se a equipe foi desativada ou pertence a outro município.")

    # Mesmo médico/enfermeiro em mais de uma eSF ativa (a eSF exige dedicação de 40 h)
    ativas_esf = {e["ine"] for e in dados["equipes"] if e["tp_equipe"] == "70" and not e["desativada_em"]}
    for p in dados["profissionais"]:
        for prefixo, rotulo in ((CBO_MEDICO, "médico(a)"), (CBO_ENFERMEIRO, "enfermeiro(a)")):
            ines = sorted({l["ine"] for l in p["lotacoes"] if l["ine"] in ativas_esf and l["cbo"].startswith(prefixo)})
            if len(ines) > 1:
                nomes = [next(e["nome"] for e in dados["equipes"] if e["ine"] == i) for i in ines]
                pend("alerta", "PROFISSIONAL_EM_MAIS_DE_UMA_ESF", None,
                     f"{p['nome']} ({rotulo}) está lotado(a) em {len(ines)} eSF: {', '.join(nomes)}",
                     "A eSF exige carga horária integral por equipe; conferir no SCNES.")

    avisos = []
    acs = [l for p in dados["profissionais"] for l in p["lotacoes"] if l["cbo"].startswith(CBO_ACS) and l["ine"]]
    if acs:
        avisos.append("O arquivo do SISAB não informa a microárea dos ACS; a conferência de microáreas "
                      "deve ser feita no e-SUS PEC/território.")
    if not marcacoes:
        avisos.append("O arquivo do SISAB não informa se a eSF é ribeirinha, quilombola ou indígena.")
    else:
        avisos.append("A marcação de eSF ribeirinha vem da referência verificada no CNES Web "
                      "(o arquivo do SISAB não traz essa informação).")

    ordem = {s: i for i, s in enumerate(SEVERIDADES)}
    pendencias.sort(key=lambda x: (ordem[x["severidade"]], x["equipe"] or "", x["codigo"]))
    return {
        "equipes": equipes_out,
        "pendencias": pendencias,
        "resumo_pendencias": {s: sum(1 for x in pendencias if x["severidade"] == s) for s in SEVERIDADES},
        "avisos": avisos,
    }


# ── 3. Comparação com a importação anterior ───────────────────────────────────

def comparar(atual: dict, anterior: dict | None) -> dict | None:
    if not anterior:
        return None
    eq_a = {e["ine"]: e for e in atual["equipes"]}
    eq_b = {e["ine"]: e for e in anterior["equipes"]}
    prof_a = {p["cns"]: p["nome"] for p in atual["profissionais"] if p["cns"]}
    prof_b = {p["cns"]: p["nome"] for p in anterior["profissionais"] if p["cns"]}
    return {
        "data_anterior": anterior.get("data_arquivo"),
        "equipes_novas": [eq_a[i]["nome"] for i in sorted(eq_a.keys() - eq_b.keys())],
        "equipes_removidas": [eq_b[i]["nome"] for i in sorted(eq_b.keys() - eq_a.keys())],
        "equipes_desativadas": [eq_a[i]["nome"] for i in sorted(eq_a.keys() & eq_b.keys())
                                if eq_a[i]["desativada_em"] and not eq_b[i]["desativada_em"]],
        "profissionais_entraram": sorted(prof_a[c] for c in prof_a.keys() - prof_b.keys()),
        "profissionais_sairam": sorted(prof_b[c] for c in prof_b.keys() - prof_a.keys()),
    }
