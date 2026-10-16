"""
INVESTSUS 360 — núcleo de regras do escopo FEDERAL.

Determinação vigente (etapa 1): o agente capta, sincroniza e acompanha SOMENTE
recursos do Governo Federal (Ministério da Saúde / InvestSUS), em quatro modalidades:

    rp6       Emenda Parlamentar Individual Federal          (RP 6)
    rp7       Emenda Parlamentar de Bancada Federal          (RP 7)
    rp8       Emenda Parlamentar de Comissão do Congresso    (RP 8)
    programa  Recurso de Programa (Outros) do Ministério da Saúde

Emendas estaduais (Assembleia Legislativa / orçamento estadual) estão FORA do
escopo e não são captadas. A arquitetura já separa a ESFERA de cada registro e
registra cada FONTE com a sua esfera: um módulo estadual futuro entra como nova
fonte com esfera "estadual" e só passa a valer quando "estadual" for incluída em
ESFERAS_HABILITADAS — sem reconstruir o sistema.

Este módulo não depende de banco nem de FastAPI (só biblioteca padrão), para que
as regras sejam testáveis isoladamente. Situações normalizadas são tratadas como
texto (os mesmos valores de models.investsus.SituacaoNormalizada).
"""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

# ── Esfera ────────────────────────────────────────────────────────────────────

ESFERA_FEDERAL = "federal"
ESFERA_ESTADUAL = "estadual"

# Única esfera ativa nesta etapa. NÃO incluir "estadual" sem nova autorização.
ESFERAS_HABILITADAS: frozenset[str] = frozenset({ESFERA_FEDERAL})


def esfera_habilitada(esfera: str | None) -> bool:
    return (esfera or ESFERA_FEDERAL) in ESFERAS_HABILITADAS


@dataclass(frozen=True)
class FonteRecursos:
    """Fonte de captação de propostas. Cada fonte pertence a uma esfera."""
    codigo: str
    nome: str
    esfera: str
    descricao: str


FONTES: dict[str, FonteRecursos] = {
    "investsus": FonteRecursos(
        "investsus", "InvestSUS (Ministério da Saúde)", ESFERA_FEDERAL,
        "Propostas do Fundo de Saúde no portal investsus.saude.gov.br (acesso gov.br autorizado).",
    ),
    "transparencia": FonteRecursos(
        "transparencia", "Portal da Transparência (CGU)", ESFERA_FEDERAL,
        "Emendas parlamentares federais — complemento de empenho e pagamento.",
    ),
    # Etapa futura (não habilitada): uma fonte estadual seria registrada aqui com
    # esfera=ESFERA_ESTADUAL e permaneceria bloqueada por ESFERAS_HABILITADAS.
}


def fonte_permitida(codigo: str) -> bool:
    fonte = FONTES.get(codigo)
    return bool(fonte and esfera_habilitada(fonte.esfera))


def fontes_habilitadas() -> list[FonteRecursos]:
    return [f for f in FONTES.values() if esfera_habilitada(f.esfera)]


# ── Normalização de texto ─────────────────────────────────────────────────────

def _norm(texto) -> str:
    if texto is None:
        return ""
    t = unicodedata.normalize("NFKD", str(texto)).encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", t.lower()).strip()


def _tem(t: str, padrao: str) -> bool:
    return re.search(padrao, t) is not None


# ── Modalidades ───────────────────────────────────────────────────────────────

MODALIDADES: dict[str, dict] = {
    "rp6": {"rotulo": "Emenda Individual (RP 6)", "curto": "RP 6", "tipo_emenda": "individual"},
    "rp7": {"rotulo": "Emenda de Bancada (RP 7)", "curto": "RP 7", "tipo_emenda": "bancada"},
    "rp8": {"rotulo": "Emenda de Comissão (RP 8)", "curto": "RP 8", "tipo_emenda": "comissao"},
    "programa": {"rotulo": "Recurso de Programa (Outros)", "curto": "Programa", "tipo_emenda": "programa"},
}
# Emenda federal cuja fonte não informou o tipo: fica visível para o técnico classificar
# (nunca vira "individual" por omissão — era assim que RP 7/RP 8 sumiam dos painéis).
MODALIDADE_A_CLASSIFICAR = "a_classificar"
MODALIDADES_VALIDAS = frozenset(MODALIDADES) | {MODALIDADE_A_CLASSIFICAR}

_RP_NUMERICO = {"6": "rp6", "7": "rp7", "8": "rp8"}
_TIPO_EMENDA_PARA_MODALIDADE = {
    "individual": "rp6", "bancada": "rp7", "coletiva": "rp7",
    "comissao": "rp8", "programa": "programa",
}


def modalidade_por_rp(valor) -> str | None:
    """Resultado primário explícito (6, '7', 'RP 8', 'RP8'...) → modalidade."""
    if valor is None:
        return None
    m = re.fullmatch(r"(?:rp|resultado primario)?\s*-?\s*([678])", _norm(valor))
    return _RP_NUMERICO.get(m.group(1)) if m else None


def classificar_modalidade(*textos, resultado_primario=None) -> str | None:
    """Classifica a modalidade federal a partir do RP explícito ou dos textos da fonte
    (tipo de recurso, tipo de emenda, descrição). None = não é possível afirmar."""
    por_rp = modalidade_por_rp(resultado_primario)
    if por_rp:
        return por_rp
    t = " ".join(_norm(x) for x in textos if x)
    if not t:
        return None
    rp = re.search(r"\brp\s*-?\s*([678])\b", t)
    if rp:
        return _RP_NUMERICO[rp.group(1)]
    if _tem(t, r"bancada|coletiva"):
        return "rp7"
    if _tem(t, r"comiss"):
        return "rp8"
    if _tem(t, r"individual"):
        return "rp6"
    if _tem(t, r"\bemenda") or _tem(t, r"parlamentar"):
        return None  # é emenda, mas a fonte não disse qual — não adivinhar
    if _tem(t, r"programa|\boutros?\b"):
        return "programa"
    return None


def modalidade_de_tipo_emenda(tipo_emenda: str | None) -> str | None:
    """Mapeamento do campo legado tipo_emenda (cadastro manual) → modalidade."""
    return _TIPO_EMENDA_PARA_MODALIDADE.get((tipo_emenda or "").lower())


def tipo_emenda_de_modalidade(modalidade: str | None) -> str:
    """Valor compatível com o Enum legado TipoEmenda."""
    info = MODALIDADES.get(modalidade or "")
    return info["tipo_emenda"] if info else "outro"


def eh_emenda(*textos) -> bool:
    t = " ".join(_norm(x) for x in textos if x)
    return _tem(t, r"\bemenda|parlamentar|\brp\s*-?\s*[678]\b|bancada|comiss|individual")


# ── Esfera de um item captado ─────────────────────────────────────────────────

def classificar_esfera(*textos) -> str:
    """Itens de fontes federais são federais, salvo menção explícita a recurso
    estadual (Assembleia Legislativa, emenda estadual, orçamento do estado)."""
    t = " ".join(_norm(x) for x in textos if x)
    if _tem(t, r"assembleia legislativa|\baleam\b|deputad[oa] estadual|emenda estadual|"
               r"orcamento estadual|tesouro estadual|recurso estadual"):
        return ESFERA_ESTADUAL
    return ESFERA_FEDERAL


# ── Situação oficial → situação normalizada ───────────────────────────────────

# Ordem importa: estados finais/negativos e estágios mais avançados primeiro.
# Correções em relação à regra anterior:
#   • "Aguardando pagamento" NÃO é paga (antes casava com "paga" e lançava o valor como pago);
#   • "Em reanálise" NÃO é "em análise".
_REGRAS_SITUACAO: list[tuple[str, str]] = [
    (r"cancelad", "cancelada"),
    (r"rejeitad|reprovad|indeferid|nao aprovad|inabilitad", "rejeitada"),
    (r"devolucao de saldo", "devolucao_saldo_pendente"),
    (r"prestacao de contas.*(enviad|apresentad)", "prestacao_contas_enviada"),
    (r"prestacao de contas", "prestacao_contas_pendente"),
    (r"execucao fisica concluid", "execucao_fisica_concluida"),
    (r"execucao financeira concluid", "execucao_financeira_concluida"),
    (r"concluid|finalizad|encerrad", "instrumento_concluido"),
    (r"execucao.*atrasad", "execucao_atrasada"),
    (r"execucao.*paralisad", "execucao_paralisada"),
    (r"execucao nao iniciad", "execucao_nao_iniciada"),
    (r"monitoramento.*preenchid", "monitoramento_preenchido"),
    (r"monitoramento", "monitoramento_pendente"),
    (r"execucao", "em_execucao"),
    (r"aguardando (o )?pagamento|pagamento pendente|a pagar", "aguardando_pagamento"),
    (r"parcialmente pag", "parcialmente_paga"),
    (r"\bpag[ao]s?\b|totalmente pag|pagamento (efetuado|realizado)", "totalmente_paga"),
    (r"empenhad.*formaliza|aguardando formaliza", "empenhada_aguardando_formalizacao"),
    (r"empenhad|empenho", "empenhada"),
    (r"formalizad", "formalizada"),
    (r"aguardando.*portaria", "aprovada"),
    (r"portaria", "portaria_publicada"),
    (r"reanalise", "em_reanalize"),
    (r"(diligencia|complementacao|adequacao).*(respondid|enviad|atendid)", "complementacao_enviada"),
    (r"diligencia", "em_diligencia"),
    (r"complementacao|adequacao|ajuste", "aguardando_complementacao"),
    (r"aprovad|habilitad|deferid|favoravel", "aprovada"),
    (r"analise", "em_analise"),
    (r"enviad", "proposta_enviada"),
    (r"cadastrad", "proposta_cadastrada"),
    (r"rascunho|elaboracao|em preenchimento", "proposta_elaboracao"),
    (r"prazo.*cadastr", "prazo_cadastramento"),
    (r"beneficiario indicado", "beneficiario_indicado"),
    (r"indicacao|indicad", "indicacao_parlamentar"),
    (r"programad", "recurso_programado"),
    (r"disponivel", "recurso_disponivel"),
]


def classificar_situacao(texto) -> str | None:
    """Texto de situação da fonte oficial → valor de SituacaoNormalizada (ou None)."""
    t = _norm(texto)
    if not t:
        return None
    for padrao, valor in _REGRAS_SITUACAO:
        if re.search(padrao, t):
            return valor
    return None


# ── Fases de acompanhamento ───────────────────────────────────────────────────

FASES: dict[str, str] = {
    "a_cadastrar": "Disponível / a cadastrar",
    "cadastrada": "Cadastrada",
    "enviada": "Enviada",
    "em_analise": "Em análise",
    "em_diligencia": "Em diligência",
    "em_reanalise": "Em reanálise",
    "aprovada": "Aprovada",
    "rejeitada": "Rejeitada",
    "cancelada": "Cancelada",
    "empenhada": "Empenhada",
    "paga": "Paga",
    "em_execucao": "Em execução",
    "concluida": "Concluída",
}

_FASE_POR_SITUACAO: dict[str, str] = {
    "recurso_disponivel": "a_cadastrar",
    "recurso_programado": "a_cadastrar",
    "indicacao_parlamentar": "a_cadastrar",
    "beneficiario_indicado": "a_cadastrar",
    "prazo_cadastramento": "a_cadastrar",
    "proposta_elaboracao": "a_cadastrar",
    "proposta_cadastrada": "cadastrada",
    "proposta_enviada": "enviada",
    "em_analise": "em_analise",
    "em_diligencia": "em_diligencia",
    "aguardando_complementacao": "em_diligencia",
    "complementacao_enviada": "em_reanalise",
    "em_reanalize": "em_reanalise",
    "aprovada": "aprovada",
    "rejeitada": "rejeitada",
    "cancelada": "cancelada",
    "empenhada": "empenhada",
    "empenhada_aguardando_formalizacao": "empenhada",
    "formalizada": "empenhada",
    "portaria_publicada": "empenhada",
    "aguardando_pagamento": "empenhada",
    "parcialmente_paga": "paga",
    "totalmente_paga": "paga",
    "execucao_nao_iniciada": "em_execucao",
    "em_execucao": "em_execucao",
    "execucao_atrasada": "em_execucao",
    "execucao_paralisada": "em_execucao",
    "monitoramento_pendente": "em_execucao",
    "monitoramento_preenchido": "em_execucao",
    "prestacao_contas_pendente": "em_execucao",
    "prestacao_contas_enviada": "em_execucao",
    "devolucao_saldo_pendente": "em_execucao",
    "execucao_fisica_concluida": "concluida",
    "execucao_financeira_concluida": "concluida",
    "instrumento_concluido": "concluida",
}


def fase_de(situacao_normalizada: str | None) -> str | None:
    return _FASE_POR_SITUACAO.get(situacao_normalizada or "")


def situacoes_da_fase(fase: str) -> list[str]:
    return [s for s, f in _FASE_POR_SITUACAO.items() if f == fase]


# ── Alertas de movimentação ───────────────────────────────────────────────────

_ALERTA_POR_FASE: dict[str, tuple[str, str, str]] = {
    # fase nova → (nivel, título, providência)
    "em_diligencia": ("urgente", "Proposta em diligência",
                      "Ler o parecer no InvestSUS, registrar o prazo e responder à diligência."),
    "rejeitada": ("critico", "Proposta rejeitada",
                  "Verificar o motivo da rejeição e avaliar recurso ou nova proposta com o parlamentar/área técnica."),
    "cancelada": ("critico", "Proposta cancelada",
                  "Confirmar o cancelamento com o Ministério da Saúde e o autor do recurso."),
    "em_reanalise": ("informativo", "Proposta em reanálise",
                     "Acompanhar a reanálise; nenhuma ação até nova manifestação."),
    "aprovada": ("informativo", "Proposta aprovada",
                 "Acompanhar empenho e publicação da portaria."),
    "empenhada": ("informativo", "Proposta empenhada",
                  "Acompanhar formalização/portaria e o crédito na conta do Fundo de Saúde."),
    "paga": ("informativo", "Pagamento identificado",
             "Conferir o crédito no extrato da conta do Fundo e iniciar a execução."),
    "em_execucao": ("informativo", "Proposta em execução",
                    "Manter a execução física/financeira e o monitoramento atualizados."),
    "concluida": ("informativo", "Proposta concluída",
                  "Conferir prestação de contas e eventual devolução de saldo."),
}


def alertas_de_movimento(
    *, nova: bool, fase_anterior: str | None, fase_nova: str | None,
    situacao_anterior: str | None, situacao_nova: str | None, numero: str,
) -> list[dict]:
    """Alertas a emitir quando a sincronização detecta uma proposta nova ou uma
    mudança de situação. Retorna dicts {tipo_alerta, nivel, titulo, descricao, providencia}."""
    rotulo = FASES.get(fase_nova or "", situacao_nova or "situação não informada")
    if nova:
        return [{
            "tipo_alerta": "nova_proposta",
            "nivel": "informativo",
            "titulo": f"Nova proposta federal identificada — {numero}",
            "descricao": f"Situação oficial: {situacao_nova or '—'} ({rotulo}).",
            "providencia": "Conferir modalidade, responsável interno e prazos.",
        }]
    texto_mudou = _norm(situacao_anterior) != _norm(situacao_nova) and bool(_norm(situacao_nova))
    if fase_nova and fase_nova != fase_anterior and fase_nova in _ALERTA_POR_FASE:
        nivel, titulo, prov = _ALERTA_POR_FASE[fase_nova]
        return [{
            "tipo_alerta": f"mudanca_fase_{fase_nova}",
            "nivel": nivel,
            "titulo": f"{titulo} — {numero}",
            "descricao": f"Situação oficial passou de “{situacao_anterior or '—'}” para “{situacao_nova or '—'}”.",
            "providencia": prov,
        }]
    if texto_mudou:
        return [{
            "tipo_alerta": "mudanca_situacao",
            "nivel": "informativo",
            "titulo": f"Situação atualizada — {numero}",
            "descricao": f"Situação oficial passou de “{situacao_anterior or '—'}” para “{situacao_nova or '—'}”.",
            "providencia": "Verificar se há providência a tomar.",
        }]
    return []


def nivel_prazo_diligencia(dias_restantes: int) -> str | None:
    """Nível do alerta de prazo de resposta a diligência (None = ainda não alertar)."""
    if dias_restantes < 0:
        return "critico"
    if dias_restantes <= 3:
        return "urgente"
    if dias_restantes <= 7:
        return "atencao"
    return None
