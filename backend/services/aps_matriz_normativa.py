"""
Matriz Normativa da APS — por modalidade de equipe: cadeia normativa (origem → regulamentação → alterações →
revogações → norma vigente), critérios exigidos (composição, CBO, carga horária, vínculos, suspensão) com
fundamentação, financiamento e a fonte oficial do dado que valida cada critério.

Não é uma base paralela — compõe o que já existe:
  • dispositivos e normas: services/fns_portarias_normas.py (tema "equipes_aps"), conferidos todo dia no texto oficial
    pela rotina de vigência do Agente de Portarias (FnsNormaVerificacao);
  • valores (40 h, 300 h, 60 h, 25%…): services/aps_parametros.py (REGRAS + atualizações validadas, por competência);
  • financiamento: os mesmos parâmetros do Simulador APS (fixo, vínculo, qualidade, implantação, eSFR).

Cálculo e validação são determinísticos (etapa 3: retrato do CNES × matriz). A IA só interpreta e recomenda.
Tudo aqui foi conferido no texto consolidado do Saúde Legis em 26/11/2026; o que não foi conferido fica
"pendente de confirmação" — nunca se presume a regra.
"""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from services import aps_parametros as ap
from services import fns_portarias_normas as N

CONFERIDO_EM = "2026-11-26"

# Famílias da Classificação Brasileira de Ocupações (CBO 2002, MTE) usadas para reconhecer a categoria no CNES.
FONTE_CBO = "Classificação Brasileira de Ocupações — CBO 2002 (Ministério do Trabalho e Emprego)"
CATEGORIAS: dict[str, dict] = {
    "medico": {"nome": "Médico(a)", "cbo": ("225",)},
    "enfermeiro": {"nome": "Enfermeiro(a)", "cbo": ("2235",)},
    "aux_tec_enfermagem": {"nome": "Auxiliar ou técnico(a) de enfermagem", "cbo": ("3222",)},
    "acs": {"nome": "Agente comunitário de saúde", "cbo": ("515105",)},
    "dentista": {"nome": "Cirurgião(ã)-dentista", "cbo": ("2232",)},
    "asb_tsb": {"nome": "Auxiliar ou técnico(a) em saúde bucal", "cbo": ("3224",)},
    "tsb": {"nome": "Técnico(a) em saúde bucal", "cbo": ("322405", "322425")},
}

# Anexo 6 do Anexo XXII da PRC 2/2017 (red. PRT GM/MS 11.353/2026) — categorias possíveis da eMulti.
CBO_EMULTI: dict[str, str] = {
    "515305": "Arte educador", "251605": "Assistente social", "223505": "Enfermeiro",
    "223580": "Enfermeiro estomaterapeuta", "223545": "Enfermeiro obstétrico",
    "223555": "Enfermeiro puericultor e pediátrico", "223405": "Farmacêutico", "223445": "Farmacêutico clínico",
    "223605": "Fisioterapeuta", "223810": "Fonoaudiólogo", "225105": "Médico acupunturista",
    "225120": "Médico cardiologista", "225135": "Médico dermatologista ou hansenólogo",
    "225155": "Médico endocrinologista", "225180": "Médico geriatra", "225250": "Médico ginecologista/obstetra",
    "225195": "Médico homeopata", "225103": "Médico infectologista", "225125": "Médico paliativista",
    "225124": "Médico pediatra", "225133": "Médico psiquiatra", "223305": "Médico veterinário",
    "223710": "Nutricionista", "223575": "Obstetriz", "224140": "Profissional de educação física na saúde",
    "251510": "Psicólogo", "131225": "Sanitarista", "223905": "Terapeuta ocupacional",
}


def _c(id_, criterio, tipo, dispositivo, fonte_dado, exigencia, parametros=(), categorias=()):
    return {"id": id_, "criterio": criterio, "tipo": tipo, "dispositivo": dispositivo, "fonte_dado": fonte_dado,
            "exigencia": exigencia, "parametros": list(parametros), "categorias": list(categorias)}


def _n(norma, papel, descricao, url=None, referencia=None):
    return {"norma": norma, "papel": papel, "descricao": descricao, "url": url, "referencia": referencia}


URL_PRC2, URL_PRC6 = N.NORMAS["PRC2"]["url"], N.NORMAS["PRC6"]["url"]
URL_3493 = "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2024/prt3493_11_04_2024.html"
_FIN_ESF = _n("PRT GM/MS nº 3.493/2024", "financiamento",
              "Novo cofinanciamento federal da APS (componentes fixo, vínculo, qualidade, implantação) — "
              "consolidado na PRC 6/2017, Título II.", URL_3493)
_SUSP = [_n("PRT GM/MS nº 7.799/2025", "alteracao",
            "Nova redação do art. 12-K (§§ 3º e 4º) e do Anexo C da PRC 6/2017 — hipóteses de suspensão.",
            URL_PRC6, "PRC 6/2017, art. 12-K e Anexo C")]
_REVOG_3493 = [
    _n("PRT GM/MS nº 960/2023", "revogacao", "Revogada pela PRT GM/MS nº 3.493/2024, art. 7º, X.", URL_3493),
]

SUSPENSAO_ESF_EAP = [
    _c("susp_ausencia", "Ausência de profissional da equipe mínima (2 competências do CNES)", "suspensao",
       "PRC6_ANEXO_C", "CNES (retrato por competência)",
       "25% ausência de aux./téc. de enfermagem ou ACS; 50% médico ou enfermeiro; 75% combinações; 100% três "
       "categorias ou médico e enfermeiro",
       ("regra.suspensao.competencias_cnes", "regra.suspensao.pct.ausencia_aux_tec_ou_acs",
        "regra.suspensao.pct.ausencia_medico_ou_enfermeiro", "regra.suspensao.pct.ausencia_combinada",
        "regra.suspensao.pct.ausencia_tres_ou_medico_e_enfermeiro")),
    _c("susp_ch", "Carga horária da composição mínima ou acúmulo acima de 60 h", "suspensao", "PRC6_12K_P4",
       "CNES (retrato por competência)", "Suspensão total após {regra.suspensao.competencias_cnes} competências "
       "do CNES; acúmulo máximo de {regra.aps.ch_max_acumulada} h semanais por profissional",
       ("regra.suspensao.competencias_cnes", "regra.aps.ch_max_acumulada")),
    _c("susp_producao", "Envio de produção ao Siaps", "suspensao", "PRC6_12K_P3", "SIAPS / e-Gestor",
       "Suspensão total após {regra.suspensao.competencias_sem_producao} competências sem envio",
       ("regra.suspensao.competencias_sem_producao",)),
]

MODALIDADES: list[dict] = [
    {
        "id": "eSF", "nome": "Equipe de Saúde da Família (eSF)", "tipo_cnes": "70",
        "cadeia": [
            _n("PRT GM/MS nº 2.436/2017 (PNAB)", "origem", "Política Nacional de Atenção Básica — define a eSF.",
               "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2017/prt2436_22_09_2017.html"),
            _n("PRC GM/MS nº 2/2017, Anexo XXII", "vigente", "PNAB consolidada (composição, carga horária, vínculo).",
               URL_PRC2, "Anexo XXII, Anexo 1, item 3.4"),
            _FIN_ESF, *_SUSP, *_REVOG_3493,
        ],
        "criterios": [
            _c("composicao", "Composição mínima", "composicao", "PRC2_PNAB_ESF_COMP", "CNES",
               "Médico, enfermeiro, auxiliar/técnico de enfermagem e ACS", (),
               ("medico", "enfermeiro", "aux_tec_enfermagem", "acs")),
            _c("ch_individual", "Carga horária individual", "ch_individual", "PRC2_PNAB_ESF_40H", "CNES",
               "{regra.eSF.ch_individual} h semanais para todos os profissionais", ("regra.eSF.ch_individual",)),
            _c("vinculo_unico", "Vínculo a uma única eSF", "vinculo", "PRC2_PNAB_ESF_VINC", "CNES",
               "Profissional em no máximo {regra.eSF.max_equipes_por_profissional} eSF",
               ("regra.eSF.max_equipes_por_profissional",)),
            *SUSPENSAO_ESF_EAP,
        ],
        "financiamento": ("fixo.eSF.", "vinculo.eSF.", "qualidade.eSF.", "implantacao.eSF"),
    },
    {
        "id": "eAP", "nome": "Equipe de Atenção Primária (eAP 20h / 30h)", "tipo_cnes": None,
        "cadeia": [
            _n("PRT GM/MS nº 2.539/2019", "origem", "Institui a eAP (modalidades I-20h e II-30h) e a eSB com "
               "carga horária diferenciada.", "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2019/prt2539_27_09_2019.html"),
            _n("PRC GM/MS nº 2/2017, Anexo XXII", "vigente", "Redação dada pela PRT 2.539/2019 ao item 3.4, 2.",
               URL_PRC2, "Anexo XXII, Anexo 1, item 3.4, 2"),
            _FIN_ESF, *_SUSP,
        ],
        "criterios": [
            _c("composicao", "Composição mínima", "composicao", "PRC2_PNAB_EAP_COMP", "CNES",
               "Médico e enfermeiro cadastrados na mesma unidade", (), ("medico", "enfermeiro")),
            _c("ch_20h", "Carga horária individual — Modalidade I", "ch_individual", "PRC2_PNAB_EAP_20H", "CNES",
               "Mínimo de {regra.eAP20.ch_individual} h semanais", ("regra.eAP20.ch_individual",)),
            _c("ch_30h", "Carga horária individual — Modalidade II", "ch_individual", "PRC2_PNAB_EAP_30H", "CNES",
               "Mínimo de {regra.eAP30.ch_individual} h semanais", ("regra.eAP30.ch_individual",)),
            _c("duplicidade", "Participação em mais de uma equipe", "vinculo", "PRC2_PNAB_EAP_DUP", "CNES",
               "Permitida (não é duplicidade)"),
            *SUSPENSAO_ESF_EAP,
        ],
        "financiamento": ("fixo.eAP", "vinculo.eAP", "qualidade.eAP", "implantacao.eAP"),
    },
    {
        "id": "eSB", "nome": "Equipe de Saúde Bucal (eSB)", "tipo_cnes": "71",
        "cadeia": [
            _n("PRT GM/MS nº 2.436/2017 (PNAB)", "origem", "Modalidades I e II da eSB.",
               "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2017/prt2436_22_09_2017.html"),
            _n("PRT GM/MS nº 2.539/2019", "alteracao", "Cria as eSB Modalidade I-20h e I-30h.",
               "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2019/prt2539_27_09_2019.html"),
            _n("PRC GM/MS nº 2/2017, Anexo XXII", "vigente", "PNAB consolidada (eSB).", URL_PRC2,
               "Anexo XXII, Anexo 1, item 3.4, 3"),
            _FIN_ESF, *_REVOG_3493,
        ],
        "criterios": [
            _c("modalidade_I", "Composição — Modalidade I", "composicao", "PRC2_PNAB_ESB_I", "CNES + e-Gestor",
               "Cirurgião-dentista e ASB ou TSB", (), ("dentista", "asb_tsb")),
            _c("modalidade_II", "Composição — Modalidade II", "composicao", "PRC2_PNAB_ESB_II", "CNES + e-Gestor",
               "Cirurgião-dentista, TSB e ASB (ou outro TSB)", (), ("dentista", "tsb", "asb_tsb")),
            _c("ch_20h", "Carga horária individual — Modalidade I-20h", "ch_individual", "PRC2_PNAB_ESB_20H",
               "CNES + e-Gestor", "Mínimo de {regra.eSB20.ch_individual} h semanais na mesma unidade",
               ("regra.eSB20.ch_individual",)),
            _c("ch_30h", "Carga horária individual — Modalidade I-30h", "ch_individual", "PRC2_PNAB_ESB_30H",
               "CNES + e-Gestor", "Mínimo de {regra.eSB30.ch_individual} h semanais na mesma unidade",
               ("regra.eSB30.ch_individual",)),
            _c("duplicidade", "Participação em mais de uma equipe (I-20h/I-30h)", "vinculo", "PRC2_PNAB_ESB_DUP",
               "CNES", "Permitida para eSB com carga horária diferenciada"),
        ],
        "financiamento": ("qualidade.eSB.", "implantacao.eSB40"),
    },
    {
        "id": "eSFR", "nome": "Equipe de Saúde da Família Ribeirinha (eSFR)", "tipo_cnes": None,
        "cadeia": [
            _n("PRT GM/MS nº 837/2014", "origem", "Arranjo organizacional das eSFR e eSFF (Amazônia Legal e Pantanal).",
               URL_PRC2, "Origem citada na PRC 2/2017, Anexo XXII, arts. 16 a 20"),
            _n("PRT GM/MS nº 5.850/2024", "alteracao", "Custeio, implantação, profissionais adicionais e logística da "
               "eSFR (PRC 6, arts. 69 a 72).",
               "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2025/prt5850_06_02_2025_REP.html"),
            _n("PRT GM/MS nº 8.994/2025", "alteracao", "Nova redação dos arts. 16, 17, 19 e 20 do Anexo XXII da PRC 2.",
               URL_PRC2, "Anexo XXII, arts. 16 a 20"),
            _n("PRC GM/MS nº 2/2017, Anexo XXII", "vigente", "Composição e profissionais adicionais da eSFR.", URL_PRC2,
               "Anexo XXII, arts. 16 a 20"),
        ],
        "criterios": [
            _c("composicao", "Composição mínima", "composicao", "PRC2_ESFR_18", "CNES + e-Gestor",
               "Médico, enfermeiro e auxiliar ou técnico de enfermagem", (),
               ("medico", "enfermeiro", "aux_tec_enfermagem")),
            _c("esb_vinculada", "eSB vinculada à eSFR", "composicao", "PRC2_ESFR_19", "CNES + e-Gestor",
               "Cirurgião-dentista e técnico ou auxiliar em saúde bucal", (), ("dentista", "asb_tsb")),
            _c("adicionais", "Profissionais adicionais (grande dispersão)", "adicionais", "PRC2_ESFR_20", "CNES",
               "Até {regra.eSFR.adicional.acs} ACS, {regra.eSFR.adicional.microscopista} microscopistas, "
               "{regra.eSFR.adicional.aux_tec_enfermagem} aux./téc. de enfermagem, "
               "{regra.eSFR.adicional.aux_tec_saude_bucal} aux./téc. de saúde bucal e "
               "{regra.eSFR.adicional.nivel_superior} de nível superior",
               ("regra.eSFR.adicional.acs", "regra.eSFR.adicional.microscopista",
                "regra.eSFR.adicional.aux_tec_enfermagem", "regra.eSFR.adicional.aux_tec_saude_bucal",
                "regra.eSFR.adicional.nivel_superior")),
        ],
        "pendencias": ["Carga horária individual da eSFR: o Anexo XXII (arts. 16 a 20) não fixa carga horária por "
                       "profissional; a regra não é presumida até ser conferida no texto oficial (PNAB, item 3.6)."],
        "financiamento": ("esfr.", "vinculo.eSFR.", "qualidade.eSFR."),
    },
    {
        "id": "eMulti", "nome": "Equipe Multiprofissional (eMulti)", "tipo_cnes": "72",
        "cadeia": [
            _n("PRT GM/MS nº 635/2023", "origem", "Institui as eMulti e o incentivo financeiro federal.",
               "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2023/prt0635_22_05_2023.html"),
            _n("PRT GM/MS nº 3.493/2024", "revogacao", "Revoga os arts. 14 a 17, 20 e 21 da PRT 635/2023 (art. 7º, IX).",
               URL_3493),
            _n("PRT GM/MS nº 9.584/2025", "alteracao", "Redação dos arts. 40-A a 40-M do Anexo XXII da PRC 2.", URL_PRC2,
               "Anexo XXII, arts. 40-A a 40-M"),
            _n("PRT GM/MS nº 11.353/2026", "alteracao", "Redação do Anexo 6 do Anexo XXII (categorias e CBO).",
               URL_PRC2, "Anexo 6 do Anexo XXII"),
            _n("PRC GM/MS nº 2/2017, Anexo XXII", "vigente", "Regras vigentes das eMulti.", URL_PRC2,
               "Anexo XXII, arts. 40-A a 40-M e Anexo 6"),
        ],
        "criterios": [
            _c("categorias", "Categorias e CBO", "cbo", "PRC2_40F_I", "CNES",
               "Somente as categorias do Anexo 6 do Anexo XXII"),
            _c("ch_medico", "Carga horária individual — médico", "ch_individual", "PRC2_40F_II", "CNES",
               "Mínimo de {regra.eMulti.ch_individual.medico} h semanais", ("regra.eMulti.ch_individual.medico",)),
            _c("ch_demais", "Carga horária individual — demais categorias", "ch_individual", "PRC2_40F_III", "CNES",
               "Mínimo de {regra.eMulti.ch_individual.demais} h semanais", ("regra.eMulti.ch_individual.demais",)),
            *[_c(f"ch_total_{m}", f"Carga horária da equipe — {rot}", "ch_total", d, "CNES + e-Gestor",
                 f"Mínimo de {{regra.eMulti.{m}.ch_total_min}} h semanais (soma individual); até "
                 f"{{regra.eMulti.{m}.ch_max_mesma_categoria}} h da mesma categoria; "
                 f"{{regra.eMulti.{m}.equipes_vinculadas_min}} a {{regra.eMulti.{m}.equipes_vinculadas_max}} "
                 f"equipes vinculadas",
                 (f"regra.eMulti.{m}.ch_total_min", f"regra.eMulti.{m}.ch_max_mesma_categoria",
                  f"regra.eMulti.{m}.equipes_vinculadas_min", f"regra.eMulti.{m}.equipes_vinculadas_max"))
              for m, rot, d in (("ampliada", "Ampliada", "PRC2_40G_I"), ("complementar", "Complementar", "PRC2_40G_II"),
                                ("estrategica", "Estratégica", "PRC2_40G_III"))],
            _c("soma", "Forma de cálculo da carga da equipe", "ch_total", "PRC2_40G_P2", "CNES",
               "Somatório da carga horária individual dos profissionais"),
            _c("vinculo_equipe", "Equipe vinculada a uma única eMulti", "vinculo", "PRC2_40F_P2", "e-Gestor",
               "Nenhuma equipe vinculada a mais de uma eMulti"),
            _c("duplicidade", "Profissional em mais de uma equipe", "vinculo", "PRC2_40G_P3", "CNES",
               "Permitido, desde que as cargas horárias sejam compatíveis", ("regra.aps.ch_max_acumulada",)),
            _c("cadastro", "Cadastro no SCNES e produção", "cadastro", "PRC2_40H", "CNES + SIAPS",
               "INE com tipo de equipe 72, e-SUS APS e envio ao Siaps"),
        ],
        "financiamento": ("qualidade.eMulti.", "implantacao.eMulti."),
    },
]


def _formatar(texto: str, params: dict) -> str:
    def val(k):
        v = (params.get(k) or {}).get("valor")
        return "?" if v is None else (str(int(v)) if float(v).is_integer() else str(v))
    out = texto
    for k in params:
        if "{" + k + "}" in out:
            out = out.replace("{" + k + "}", val(k))
    return out


async def montar(db: AsyncSession, municipio_id: int, competencia: str) -> dict:
    from services.fns_portarias_agente import _estado_normas
    params = await ap.vigentes(db, municipio_id, competencia)
    estado = await _estado_normas(db)
    modalidades = []
    for m in MODALIDADES:
        criterios = []
        for c in m["criterios"]:
            d = N.DISPOSITIVOS[c["dispositivo"]]
            norma = N.NORMAS[d["norma"]]
            e = estado.get(c["dispositivo"]) or {}
            criterios.append({
                **{k: c[k] for k in ("id", "criterio", "tipo", "fonte_dado")},
                "exigencia": _formatar(c["exigencia"], params),
                "valores": {k: {"valor": (params.get(k) or {}).get("valor"),
                                "vigencia_inicio": (params.get(k) or {}).get("vigencia_inicio"),
                                "origem": (params.get(k) or {}).get("origem")} for k in c["parametros"]},
                "categorias": [{"id": k, "nome": CATEGORIAS[k]["nome"], "cbo": list(CATEGORIAS[k]["cbo"])}
                               for k in c["categorias"]],
                "fundamentacao": {"norma": norma["nome"], "dispositivo": d["dispositivo"], "resumo": d["resumo"],
                                  "url": norma["url"], "chave": c["dispositivo"],
                                  "conferido": e.get("confere", True if not e else None),
                                  "conferido_em": e.get("verificado_em") or CONFERIDO_EM,
                                  "detalhe_conferencia": e.get("detalhe") or "Conferido manualmente no texto oficial."},
            })
        fin = [{"chave": k, "valor": v["valor"], "valor_texto": v.get("valor_texto"), "norma": v["norma"]}
               for k, v in sorted(params.items()) if k.startswith(m["financiamento"])]
        modalidades.append({"id": m["id"], "nome": m["nome"], "tipo_cnes": m["tipo_cnes"], "cadeia": m["cadeia"],
                            "criterios": criterios, "financiamento": fin, "pendencias": m.get("pendencias", [])})
    return {
        "competencia": competencia, "modalidades": modalidades,
        "categorias_cbo": {"fonte": FONTE_CBO, "categorias": {k: {"nome": v["nome"], "cbo": list(v["cbo"])}
                                                                for k, v in CATEGORIAS.items()},
                           "emulti_anexo6": CBO_EMULTI},
        "monitoramento": ("Cada dispositivo é procurado de novo, todo dia, no texto oficial do Saúde Legis pela rotina "
                          "de vigência do Agente de Portarias; se o trecho sumir, o critério aparece como não conferido. "
                          "Valores só mudam por atualização registrada e validada (histórico por competência)."),
    }
