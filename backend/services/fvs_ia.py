"""
AGENTE IA — VIGILÂNCIA EM SAÚDE ERSUS360 (consulta em linguagem natural).

O modelo não recebe números soltos no prompt: ele chama ferramentas que leem a série da FVS-RCP/AM já
integrada (services/fvs_analise.py) e só pode citar o que elas devolvem. Cada resposta separa
"Dados oficiais" (com fonte e período) de "Análise da IA".
"""
from __future__ import annotations

import json
import logging
from datetime import date, datetime

import anthropic
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from services import fvs_analise as an
from services import fvs_catalogo as cat
from services.fvs_coleta import IBGE_AM

logger = logging.getLogger(__name__)

MODELO = "claude-opus-5-5"
MAX_PASSOS = 10

SYSTEM = """Você é o AGENTE IA — VIGILÂNCIA EM SAÚDE do ERSUS360, assistente de gestores municipais de saúde do Amazonas.

Seus dados vêm só das ferramentas, que leem a série integrada dos painéis públicos da FVS-RCP/AM (fvs.am.gov.br/dadossaude):
- sinan: contagem de notificações por doença/agravo (base de monitoramento SINAN da FVS) — não traz confirmados, descartados nem óbitos;
- malaria: exames positivos do SIVEP-Malária por município provável de infecção, e IPA;
- aesop: avisos do CIEVS/FVS para síndromes respiratórias, SRAG, vírus (GAL);
- pqa_vs: indicadores do PQA-VS (resultado, meta e alcance publicados);
- vacinometro: doses de vacina COVID-19 aplicadas.

Regras:
- Use as ferramentas antes de responder. Cite apenas números que elas devolveram, sempre com fonte e período (ex.: "FVS/SINAN, notificações até 19/10/2026").
- Se a informação não existir nas ferramentas, diga que o ERSUS360 ainda não tem esse dado e onde ele poderia ser obtido. Nunca estime, arredonde para "cerca de" sem base, nem invente números.
- Números do ano corrente são parciais: compare com o mesmo período (mesmas semanas epidemiológicas) do ano anterior, como a ferramenta comparar_periodo faz.
- Alertas "calculados" são sinais estatísticos para investigação, não confirmação de surto. Alertas "oficiais" são os publicados pela FVS/CIEVS.
- Painéis em Power BI (mortalidade materna/infantil, nascimentos, SRAG, Mpox, esporotricose, PES, TB preventivo) e os de IST/HIV/hepatites/sífilis/TB/óbitos de mulheres não têm dados extraídos — indique o painel oficial.
- A partir de 2024 os indicadores do PQA-VS seguem a Portaria GM/MS nº 6.878/2025; não atribua a eles as descrições antigas.
- Responda em português do Brasil, para secretários e coordenadores de vigilância, com duas seções:
  "## Dados oficiais" (fatos das ferramentas, com fonte) e "## Análise da IA" (interpretação, tendências, pontos de atenção e sugestões técnicas). Tabelas em Markdown quando ajudar. Seja objetivo."""


def _tool(name: str, description: str, props: dict, required: list[str]) -> dict:
    return {"name": name, "description": description, "strict": True,
            "input_schema": {"type": "object", "properties": props, "required": required,
                             "additionalProperties": False}}


_MUN = {"type": "string", "description": "Código IBGE (6 ou 7 dígitos) ou nome do município do AM; '130000' = Amazonas"}
_ANO = {"type": "integer", "description": "Ano (ex.: 2026)"}
_FONTE = {"type": "string", "enum": list(cat.COLETORES)}

TOOLS = [
    _tool("listar_municipios", "Lista os 62 municípios do AM com código IBGE e Região de Saúde.", {}, []),
    _tool("fontes_e_indicadores", "Situação das fontes (última atualização, data de referência) e indicadores disponíveis "
          "em cada uma (ex.: 'casos:Dengue').", {}, []),
    _tool("painel_municipio", "Painel executivo de um município: casos por agravo no ano, malária, AESOP, PQA-VS.",
          {"municipio": _MUN, "ano": _ANO}, ["municipio", "ano"]),
    _tool("consultar_serie", "Série histórica de um indicador. periodo_tipo: ano | mes | se | quadrimestre. "
          "recorte: total | sexo | faixa_etaria | zona | raca_cor | parasita | dose | virus.",
          {"fonte": _FONTE, "indicador": {"type": "string"},
           "municipios": {"type": "array", "items": _MUN},
           "ano_inicio": _ANO, "ano_fim": _ANO,
           "periodo_tipo": {"type": "string", "enum": ["ano", "mes", "se", "quadrimestre"]},
           "recorte": {"type": "string"}},
          ["fonte", "indicador", "municipios", "ano_inicio", "ano_fim", "periodo_tipo", "recorte"]),
    _tool("comparar_periodo", "Acumulado do ano até a última semana epidemiológica completa × mesmo período do ano "
          "anterior, e últimas 4 semanas × 4 anteriores.",
          {"fonte": {"type": "string", "enum": ["sinan", "malaria"]}, "indicador": {"type": "string"},
           "municipio": _MUN, "ano": _ANO}, ["fonte", "indicador", "municipio", "ano"]),
    _tool("ranking_municipios", "Valor de um indicador em todos os 62 municípios num ano (e taxa por 100 mil no SINAN).",
          {"fonte": _FONTE, "indicador": {"type": "string"}, "ano": _ANO}, ["fonte", "indicador", "ano"]),
    _tool("municipios_em_aumento", "Municípios com maior aumento no acumulado do ano × mesmo período do ano anterior.",
          {"fonte": {"type": "string", "enum": ["sinan", "malaria"]}, "indicador": {"type": "string"}, "ano": _ANO},
          ["fonte", "indicador", "ano"]),
    _tool("alertas", "Alertas do município: oficiais (AESOP, PQA-VS abaixo da meta) e calculados (aumento de casos).",
          {"municipio": _MUN, "ano": _ANO}, ["municipio", "ano"]),
    _tool("pqa_vs", "Indicadores do PQA-VS do município: último período publicado e histórico.",
          {"municipio": _MUN}, ["municipio"]),
    _tool("comparar_municipios", "Comparação de indicadores (SINAN e malária) entre até 10 municípios num ano.",
          {"municipios": {"type": "array", "items": _MUN}, "ano": _ANO}, ["municipios", "ano"]),
]


class IAIndisponivel(RuntimeError):
    pass


class _Ferramentas:
    def __init__(self, db: AsyncSession):
        self.db = db
        self._muns: list[dict] | None = None
        self.fontes_usadas: set[str] = set()

    async def _municipios(self) -> list[dict]:
        if self._muns is None:
            self._muns = await an.municipios(self.db)
        return self._muns

    async def mun(self, v) -> str:
        import re
        import unicodedata
        s = str(v or "").strip()
        dig = re.sub(r"\D", "", s)
        if len(dig) >= 6:
            return dig[:6]
        def norm(x): return unicodedata.normalize("NFKD", x).encode("ascii", "ignore").decode().lower().strip()
        if norm(s) in {"amazonas", "am", "estado"}:
            return IBGE_AM
        for m in await self._municipios():
            if norm(m["nome"]) == norm(s):
                return m["ibge6"]
        raise ValueError(f"Município não encontrado no Amazonas: {s}")

    async def executar(self, nome: str, a: dict):
        db = self.db
        if nome == "listar_municipios":
            return await self._municipios()
        if nome == "fontes_e_indicadores":
            out = {}
            for f in cat.COLETORES:
                inds = await an.indicadores_disponiveis(db, f)
                out[f] = {"estado": await an._estado(db, f), "indicadores": inds[:200]}
            return out
        if nome == "painel_municipio":
            self.fontes_usadas.update(cat.COLETORES)
            return await an.painel_executivo(db, await self.mun(a["municipio"]), int(a["ano"]))
        if nome == "consultar_serie":
            self.fontes_usadas.add(a["fonte"])
            ibges = [await self.mun(x) for x in a.get("municipios") or []][:10]
            return await an.serie(db, a["fonte"], a["indicador"], ibges or None, a.get("ano_inicio"), a.get("ano_fim"),
                                  a.get("periodo_tipo"), a.get("recorte") or "total", limite=3000)
        if nome == "comparar_periodo":
            self.fontes_usadas.add(a["fonte"])
            return await an.comparar_periodo(db, a["fonte"], a["indicador"], await self.mun(a["municipio"]), int(a["ano"])) \
                or "Sem dado semanal para este indicador/ano."
        if nome == "ranking_municipios":
            self.fontes_usadas.add(a["fonte"])
            m = await an.mapa(db, a["fonte"], a["indicador"], int(a["ano"]))
            m["municipios"] = sorted(m["municipios"], key=lambda x: -(x["valor"] or 0))
            return m
        if nome == "municipios_em_aumento":
            self.fontes_usadas.add(a["fonte"])
            return await an.tendencias(db, a["fonte"], a["indicador"], int(a["ano"]))
        if nome == "alertas":
            self.fontes_usadas.update(cat.COLETORES)
            return await an.alertas(db, await self.mun(a["municipio"]), int(a["ano"]))
        if nome == "pqa_vs":
            self.fontes_usadas.add("pqa_vs")
            m = await self.mun(a["municipio"])
            return {"ultimo": await an.pqa_resumo(db, m), "historico": (await an.pqa_historico(db, m))[-150:],
                    "nota": (await an.extra_da_fonte(db, "pqa_vs")).get("nota_definicoes")}
        if nome == "comparar_municipios":
            self.fontes_usadas.update({"sinan", "malaria", "pqa_vs"})
            return await an.comparativo(db, [await self.mun(x) for x in a["municipios"]][:10], int(a["ano"]))
        raise ValueError(f"ferramenta desconhecida: {nome}")


async def responder(db: AsyncSession, pergunta: str, ibge6_padrao: str) -> dict:
    if not settings.ANTHROPIC_API_KEY:
        raise IAIndisponivel("A IA não está configurada no servidor (ANTHROPIC_API_KEY).")
    nomes = await an.nomes_municipios(db)
    if len(nomes) <= 1:
        raise IAIndisponivel("Os dados da FVS ainda não foram sincronizados. Use 'Atualizar' na área de integrações.")
    ferr = _Ferramentas(db)
    contexto = (f"Data de hoje: {date.today():%d/%m/%Y}. Município selecionado na tela: "
                f"{nomes.get(ibge6_padrao, ibge6_padrao)} ({ibge6_padrao}).")
    messages: list[dict] = [{"role": "user", "content": f"{contexto}\n\nPergunta: {pergunta}"}]
    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    chamadas = []
    msg = None
    for _ in range(MAX_PASSOS):
        try:
            async with client.messages.stream(
                model=MODELO, max_tokens=32000, system=SYSTEM, tools=TOOLS, messages=messages,
                thinking={"type": "adaptive"},
                extra_headers={"anthropic-beta": "server-side-fallback-2026-07-01"},
                extra_body={"output_config": {"effort": "medium"}, "fallbacks": "default"},
            ) as stream:
                msg = await stream.get_final_message()
        except anthropic.AuthenticationError as e:
            raise IAIndisponivel("Chave da IA inválida no servidor.") from e
        except anthropic.RateLimitError as e:
            raise IAIndisponivel("Limite de uso da IA atingido. Tente de novo em alguns minutos.") from e
        except anthropic.APIStatusError as e:
            logger.error("Agente IA Vigilância: erro da API (%s): %s", e.status_code, e)
            raise IAIndisponivel(f"A IA respondeu com erro ({e.status_code}).") from e
        except anthropic.APIConnectionError as e:
            raise IAIndisponivel("Sem conexão com o serviço de IA.") from e

        if msg.stop_reason == "refusal":
            raise IAIndisponivel("A IA não pôde responder a esta solicitação. Reformule a pergunta.")
        if msg.stop_reason != "tool_use":
            break
        messages.append({"role": "assistant", "content": msg.content})
        resultados = []
        for b in msg.content:
            if b.type != "tool_use":
                continue
            entrada = b.input if isinstance(b.input, dict) else {}
            try:
                out = await ferr.executar(b.name, entrada)
                conteudo, erro = json.dumps(out, ensure_ascii=False, default=str)[:60000], False
            except Exception as exc:  # noqa: BLE001 — o erro volta para o modelo, que pode corrigir a chamada
                conteudo, erro = f"Erro: {exc}", True
            chamadas.append({"ferramenta": b.name, "entrada": entrada, "erro": erro})
            resultados.append({"type": "tool_result", "tool_use_id": b.id, "content": conteudo, "is_error": erro})
        messages.append({"role": "user", "content": resultados})

    resposta = "".join(b.text for b in (msg.content if msg else []) if b.type == "text").strip()
    if msg and msg.stop_reason == "max_tokens":
        resposta += "\n\n_(Resposta interrompida pelo limite de tamanho.)_"
    if msg and msg.stop_reason == "tool_use":
        resposta += "\n\n_(Consulta interrompida: muitas etapas. Reformule a pergunta de forma mais específica.)_"
    fontes = [an.ROTULO_FONTE[f] for f in sorted(ferr.fontes_usadas) if f in an.ROTULO_FONTE]
    return {"resposta": resposta, "fontes": fontes, "consultas": chamadas, "modelo": msg.model if msg else MODELO,
            "gerado_em": datetime.utcnow().isoformat(),
            "aviso": "Resposta gerada por IA a partir dos dados públicos da FVS-RCP/AM integrados ao ERSUS360. "
                     "A seção 'Análise da IA' é interpretação; confira os números no painel oficial."}
