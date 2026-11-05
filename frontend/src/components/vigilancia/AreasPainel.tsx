/**
 * Áreas temáticas do Painel de Vigilância em Saúde (backend: /api/vigilancia-fvs/area/{area}).
 * Regra de exibição: número que a fonte não publica aparece como "Dados não disponíveis" (nunca zero);
 * cada bloco mostra fonte, período e última sincronização; associação temporal não é apresentada como causa.
 */
import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownUp, Download, Info, Search } from "lucide-react";
import { apiGet } from "../../lib/api";
import { COR, FVS_API, IBGE_AM, fmt, fmtPct, useCatalogoFvs, type EstadoFonte, type LinhaSerie } from "../../lib/vigilanciaFvs";
import { Cartao, PainelOficial, Secao, SeloFonteFvs, TabelaSimples, Vazio, botaoSec, rotuloStyle, selectStyle } from "./FvsBase";
import { BarrasAnuais, BarrasCategoria, BarrasRecorte, LinhasSE, SERIE } from "./Graficos";
import MapaAmazonas, { type ValorMapa } from "./MapaAmazonas";
import { PRIORIDADE, SeloPrioridade, type Central, type Prioridade } from "./CentralAlertas";

export const AZUL = "#1d4ed8";
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
interface Indisp { item: string; motivo: string }

export function useArea<T = any>(area: string, mun: string, ano: number, ativo = true) {
  return useQuery({ queryKey: ["vig-area", area, mun, ano], enabled: ativo,
    queryFn: () => apiGet<T>(`${FVS_API}/area/${area}`, { mun, ano }) });
}

// ── Peças comuns ──────────────────────────────────────────────────────────────

export const ND = "Dados não disponíveis";

/** Valor do cartão: null/undefined → "Dados não disponíveis" (texto menor, cinza), nunca 0. */
function V({ v, casas = 0, sufixo = "" }: { v: number | null | undefined; casas?: number; sufixo?: string }) {
  if (v === null || v === undefined) return <span style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>{ND}</span>;
  return <>{fmt(v, casas)}{sufixo}</>;
}

function Kpi({ titulo, v, sub, cor = AZUL, origem, casas, children }: { titulo: string; v?: number | null; sub?: ReactNode; cor?: string;
  origem?: string; casas?: number; children?: ReactNode }) {
  return <Cartao titulo={titulo} valor={children ?? <V v={v} casas={casas} />} sub={sub} cor={cor} origem={origem} />;
}

const grade = (min = 180): React.CSSProperties => ({ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))`, gap: 10 });

function Painel({ titulo, children, fonte, nota }: { titulo: ReactNode; children: ReactNode; fonte?: ReactNode; nota?: ReactNode }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${COR.borda}`, borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: COR.texto }}>{titulo}</div>
      {children}
      {(fonte || nota) && <div style={{ fontSize: 11, color: COR.sub, borderTop: `1px solid ${COR.borda}`, paddingTop: 6 }}>{fonte}{fonte && nota ? " · " : ""}{nota}</div>}
    </div>
  );
}

function Selos({ fontes }: { fontes?: Record<string, EstadoFonte> }) {
  if (!fontes) return null;
  return <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{Object.values(fontes).map(f => <SeloFonteFvs key={f.fonte} estado={f} compacto />)}</div>;
}

function Indisponiveis({ itens, titulo = "Dados não disponíveis nesta área" }: { itens?: Indisp[]; titulo?: string }) {
  if (!itens?.length) return null;
  return (
    <details style={{ background: "#fff", border: `1px dashed ${COR.borda}`, borderRadius: 10, padding: "8px 12px", fontSize: 12.5, color: COR.sub }}>
      <summary style={{ cursor: "pointer", fontWeight: 700, color: COR.texto }}>{titulo} ({itens.length})</summary>
      <ul style={{ margin: "6px 0 0", paddingLeft: 18, display: "grid", gap: 4 }}>
        {itens.map(i => <li key={i.item}><b>{i.item}:</b> {i.motivo}</li>)}
      </ul>
    </details>
  );
}

function Aviso({ children }: { children: ReactNode }) {
  return <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10,
    padding: "8px 12px", fontSize: 12.5, color: "#78350f" }}><Info size={15} style={{ flexShrink: 0, marginTop: 2 }} /><span>{children}</span></div>;
}

function Tendencia({ t }: { t: string }) {
  const cor = t === "crescimento" ? COR.alto : t === "redução" ? "#15803d" : COR.sub;
  return <span style={{ fontSize: 11, fontWeight: 700, color: cor }}>{t === "crescimento" ? "▲ " : t === "redução" ? "▼ " : ""}{t}</span>;
}

function Carregando({ q, children }: { q: { isLoading: boolean; isError: boolean; data?: unknown }; children: () => ReactNode }) {
  if (q.isLoading) return <Vazio>Carregando…</Vazio>;
  if (q.isError || !q.data) return <Vazio>Não foi possível carregar esta área agora.</Vazio>;
  return <>{children()}</>;
}

interface AgravoArea { agravo: string; cid10: string | null; casos_ano: number | null; casos_ano_anterior: number | null; casos_2_anos_antes: number | null;
  incidencia_100mil: number | null; comparacao: any; tendencia: string; semanal: Record<string, number | null>[] }

function TabelaAgravos({ itens, ano, onEscolher }: { itens: AgravoArea[]; ano: number; onEscolher?: (a: string) => void }) {
  return <TabelaSimples colunas={["Agravo", "CID-10", `${ano}`, `${ano - 1}`, `${ano - 2}`, "Mesmo período", "Variação", "Incid./100 mil", "Tendência"]}
    linhas={itens.map(a => [onEscolher ? <button style={{ background: "none", border: 0, padding: 0, color: AZUL, cursor: "pointer", fontSize: 12.5, textAlign: "left" }}
      onClick={() => onEscolher(a.agravo)}>{a.agravo}</button> : a.agravo, a.cid10 ?? "—", fmt(a.casos_ano), fmt(a.casos_ano_anterior), fmt(a.casos_2_anos_antes),
      a.comparacao ? `${fmt(a.comparacao.acumulado)} × ${fmt(a.comparacao.mesmo_periodo_ano_anterior)} (SE 1–${a.comparacao.ate_se})` : "—",
      fmtPct(a.comparacao?.variacao_pct), fmt(a.incidencia_100mil, 1), <Tendencia t={a.tendencia} />])} />;
}

// ── 1. Visão geral ────────────────────────────────────────────────────────────

export function AreaVisao({ mun, ano, central, onAlertas, onArea }: { mun: string; ano: number; central?: Central;
  onAlertas: (p?: Prioridade) => void; onArea: (a: string) => void }) {
  const q = useArea("visao", mun, ano);
  return <Carregando q={q}>{() => {
    const d = q.data;
    const c = d.cartoes;
    const epid = (central?.alertas ?? []).filter(a => a.categoria !== "integracao");
    const destaques = epid.filter(a => a.prioridade === "critico" || a.prioridade === "alto").slice(0, 4);
    const semDado = Object.values(d.fontes as Record<string, EstadoFonte>).every(f => f.situacao === "nunca_sincronizada");
    const mc = d.maior_crescimento[0];
    const anos = [ano - 2, ano - 1, ano];
    return <>
      {semDado && <Vazio>Os dados ainda não foram sincronizados neste servidor. A primeira coleta roda automaticamente alguns minutos depois
        da publicação do sistema; perfis autorizados podem iniciar em "Inteligência e ferramentas → Integrações".</Vazio>}
      <div style={grade(170)}>
        <Kpi titulo={`Notificações ${ano}`} v={c.notificacoes_sinan?.valor} origem="oficial"
          sub={d.ate_se ? `até a SE ${d.ate_se} · SINAN (base FVS)` : "SINAN (base FVS)"} />
        <Kpi titulo="Agravos monitorados" v={c.notificacoes_sinan?.valor === null ? null : d.agravos_monitorados} origem="oficial"
          sub="doenças/agravos com notificação no ano" />
        <Kpi titulo="Maior crescimento" cor={COR.alto} origem="calculado" sub={mc ? `${fmt(mc.acumulado)} × ${fmt(mc.anterior)} no mesmo período` :
          `nenhum agravo com ≥ 5 casos e aumento`}>
          {c.notificacoes_sinan?.valor === null ? <V v={null} /> : mc ? <span style={{ fontSize: 15, lineHeight: 1.25, overflowWrap: "anywhere", display: "block" }}>{mc.agravo} <span style={{ color: COR.alto }}>{fmtPct(mc.variacao_pct)}</span></span>
            : <span style={{ fontSize: 15 }}>Sem aumento relevante</span>}
        </Kpi>
        <Kpi titulo="Casos suspeitos e confirmados" v={null} sub="a base pública traz notificações, sem classificação final" />
        <Kpi titulo="Internações por causas prioritárias" v={null} sub="SIH/SUS — integração prevista (fase 2)" />
        <Kpi titulo="Óbitos por causas prioritárias" v={null} sub="SIM — painéis da FVS sem exportação" />
        <Kpi titulo="Alertas epidemiológicos ativos" cor={COR.medio}
          sub={central ? `${central.resumo.critico} crítico(s) · ${central.resumo.alto} alto(s)` : "calculando…"}>
          <button onClick={() => onAlertas()} style={{ background: "none", border: 0, padding: 0, font: "inherit", cursor: "pointer", color: COR.texto }}>
            {central ? epid.filter(a => a.prioridade !== "informativo").length : "—"}</button>
        </Kpi>
        <Kpi titulo="PQA-VS — metas atingidas" cor="#15803d" origem="oficial" sub={c.pqa_vs?.periodo ?? "sem resultado publicado"}>
          {c.pqa_vs?.valor === null || c.pqa_vs?.valor === undefined ? <V v={null} /> : `${c.pqa_vs.valor}/${c.pqa_vs.total}`}
        </Kpi>
      </div>

      {destaques.length > 0 && (
        <div style={{ background: "#fff", border: `1px solid ${COR.borda}`, borderRadius: 12, padding: 10, display: "grid", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <b style={{ fontSize: 13 }}>Situações prioritárias</b>
            <button style={botaoSec} onClick={() => onAlertas()}>Ver todos na central</button>
          </div>
          {destaques.map(a => (
            <button key={a.chave} onClick={() => onAlertas(a.prioridade)} style={{ display: "flex", gap: 8, alignItems: "center", textAlign: "left",
              background: PRIORIDADE[a.prioridade].fundo, border: 0, borderLeft: `3px solid ${PRIORIDADE[a.prioridade].cor}`, borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>
              <SeloPrioridade p={a.prioridade} /><span style={{ fontSize: 12.5, fontWeight: 700, color: COR.texto }}>{a.titulo}</span>
            </button>))}
        </div>
      )}

      <div style={grade(340)}>
        <Painel titulo="Evolução das notificações por semana epidemiológica" fonte="SINAN — base de monitoramento da FVS"
          nota={`Todas as doenças/agravos. ${ano} parcial até a última SE completa.`}>
          {d.evolucao_semanal.some((l: any) => anos.some(a => l[String(a)])) ? <LinhasSE dados={d.evolucao_semanal}
            series={anos.map((a, i) => ({ chave: String(a), nome: a === ano ? `${a} (parcial)` : String(a), cor: [SERIE[2], SERIE[1], SERIE[0]][i], tracejado: a === ano - 2 }))} />
            : <Vazio>{ND} para a série semanal.</Vazio>}
        </Painel>
        <Painel titulo={`Agravos mais notificados — ${ano}`} fonte="SINAN — base FVS" nota={<button style={{ ...botaoSec, padding: "2px 8px", minHeight: 0 }}
          onClick={() => onArea("notificacoes")}>Tabela completa</button>}>
          {d.top_agravos.length ? <BarrasRecorte itens={d.top_agravos.map((a: any) => ({ rotulo: a.agravo, valor: a.casos }))} /> : <Vazio>{ND}.</Vazio>}
        </Painel>
        <Painel titulo="Comparativo epidemiológico — períodos equivalentes" fonte="SINAN — base FVS" nota={d.comparativo_formula ?? undefined}>
          {d.comparativo_anos.some((x: any) => x.acumulado !== null) ? <BarrasAnuais dados={d.comparativo_anos.map((x: any) => ({ ano: String(x.ano), valor: x.acumulado }))}
            series={[{ chave: "valor", nome: "Notificações" }]} /> : <Vazio>{ND}.</Vazio>}
        </Painel>
        <Painel titulo="Distribuição territorial — zona de residência" fonte="SINAN — base FVS" nota={d.territorio_nota}>
          {d.territorio.length ? <BarrasRecorte itens={d.territorio} /> : <Vazio>{ND}.</Vazio>}
          <button style={{ ...botaoSec, alignSelf: "flex-start" }} onClick={() => onArea("ferramentas:mapa")}>Mapa dos 62 municípios</button>
        </Painel>
      </div>
      <Selos fontes={d.fontes} />
      <Indisponiveis itens={d.indisponivel} />
    </>;
  }}</Carregando>;
}

// ── 2. Respiratória e qualidade do ar ─────────────────────────────────────────

export function AreaRespiratoria({ mun, ano }: { mun: string; ano: number }) {
  const q = useArea("respiratoria", mun, ano);
  return <Carregando q={q}>{() => {
    const d = q.data; const t = d.totais; const a = d.aesop_ultima;
    const serie = (k: string) => d.serie_conjunta.map((c: any) => ({ se: c.se, v: c[k] }));
    const tem = (k: string) => d.serie_conjunta.some((c: any) => c[k] !== null);
    const sub = (k: string) => t[k].ano_anterior !== null ? `${ano - 1}: ${fmt(t[k].ano_anterior)}` : undefined;
    return <>
      <div style={grade(160)}>
        <Kpi titulo={`SRAG — casos ${ano}`} v={t.srag_casos.ano} origem="oficial" cor="#eb6834" sub={sub("srag_casos") ?? "SIVEP-Gripe (painel AESOP)"} />
        <Kpi titulo={`Síndrome gripal na APS ${ano}`} v={t.sindrome_gripal_aps.ano} origem="oficial" sub={sub("sindrome_gripal_aps") ?? "painel AESOP"} />
        <Kpi titulo={`Atendimentos na APS ${ano}`} v={t.atendimentos_aps.ano} origem="oficial" cor="#6250d6" sub="denominador do AESOP" />
        <Kpi titulo={`Focos de calor ${ano}`} v={t.focos_calor.ano} origem="oficial" cor={COR.alto} sub={sub("focos_calor") ?? "INPE — satélite de referência"} />
        <Kpi titulo="Aviso AESOP (última semana)" origem="oficial" cor={a?.aviso_aesop === "Sim" ? COR.alto : "#15803d"}
          sub={a ? `SE ${a.se}/${a.ano} · prob. crescimento ${fmt(a.prob_crescimento_pct, 1)}%` : "CIEVS/FVS"}>
          {a ? (a.aviso_aesop ?? "—") : <V v={null} />}</Kpi>
        <Kpi titulo="PM2,5 / qualidade do ar" v={null} sub="sem medição oficial no município" />
      </div>
      <Aviso>{d.nota_causalidade}</Aviso>
      <Painel titulo={`Fumaça × síndromes respiratórias por semana — ${ano}`} fonte="INPE (focos, satélite AQUA_M-T) · CIEVS/FVS — AESOP (SG na APS, SRAG)"
        nota="Gráficos alinhados pela semana epidemiológica (passe o mouse para ver a mesma semana nos três).">
        {[["focos_calor", "Focos de calor", COR.alto], ["sg_aps", "Síndrome gripal na APS", SERIE[0]], ["srag", "SRAG (SIVEP-Gripe)", SERIE[1]]].map(([k, nome, cor]) => (
          <div key={k}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: COR.sub }}>{nome}</div>
            {tem(k) ? <LinhasSE dados={serie(k)} series={[{ chave: "v", nome, cor }]} altura={140} syncId="resp" />
              : <div style={{ fontSize: 12, color: "#94a3b8", padding: "10px 0" }}>{ND}</div>}
          </div>))}
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: COR.sub }}>PM2,5 (concentração de material particulado)</div>
          <div style={{ fontSize: 12, color: "#94a3b8", padding: "6px 0" }}>{ND} — sem estação oficial; ver motivo abaixo.</div>
        </div>
      </Painel>
      <div style={grade(320)}>
        <Painel titulo="Períodos de maior × menor exposição à fumaça" nota={d.exposicao?.formula}>
          {d.exposicao ? <TabelaSimples colunas={["Grupo de semanas", "Semanas", "Média semanal de SG na APS"]} linhas={[
            [`Mais focos (≥ ${fmt(d.exposicao.limite_alta)})`, d.exposicao.semanas_alta, fmt(d.exposicao.media_sg_alta, 1)],
            [`Menos focos (≤ ${fmt(d.exposicao.limite_baixa)})`, d.exposicao.semanas_baixa, fmt(d.exposicao.media_sg_baixa, 1)]]} />
            : <Vazio>Semanas insuficientes com focos e atendimentos para comparar ({ND} em uma das séries ou ano sem variação de focos).</Vazio>}
        </Painel>
        <Painel titulo={`Vírus respiratórios detectados (GAL) — ${ano}`} fonte="LACEN/GAL via painel AESOP">
          {d.virus.length ? <BarrasRecorte itens={d.virus} /> : <Vazio>{ND}.</Vazio>}
        </Painel>
      </div>
      {d.agravos.length > 0 && <Secao titulo="Agravos respiratórios de notificação"><TabelaAgravos itens={d.agravos} ano={ano} /></Secao>}
      <Selos fontes={d.fontes} />
      <Indisponiveis itens={d.indisponivel} />
    </>;
  }}</Carregando>;
}

// ── 3. Diarreicas e água ──────────────────────────────────────────────────────

export function AreaDiarreicas({ mun, ano }: { mun: string; ano: number }) {
  const q = useArea("diarreicas", mun, ano);
  return <Carregando q={q}>{() => {
    const d = q.data;
    const anoAtual = d.agua_anual.find((x: any) => x.ano === ano);
    const nuncaSinc = d.fontes.sisagua.situacao === "nunca_sincronizada";
    const mensal = d.agua_mensal.map((m: any) => ({ mes: `${MESES[m.mes - 1]}/${String(m.ano).slice(2)}`, amostras: m["amostras:ecoli"] ?? 0,
      ecoli: m["presenca:ecoli"] ?? 0, coliformes: m["presenca:coliformes"] ?? 0 }));
    return <>
      <Painel titulo="Monitorização das Doenças Diarreicas Agudas (MDDA)">
        <Vazio><b>{ND}.</b> {d.indisponivel[0].motivo}</Vazio>
      </Painel>
      <Secao titulo="Vigilância da qualidade da água para consumo humano (Vigiagua/SISAGUA)">
        {nuncaSinc ? <Vazio>SISAGUA ainda não sincronizado neste servidor.</Vazio>
          : d.agua_sem_registro ? <Aviso>Nenhuma amostra da <b>vigilância municipal</b> registrada no SISAGUA entre {ano - 2} e {ano}. Isso é uma lacuna de
            monitoramento (coleta ou digitação do Vigiagua), não um resultado de qualidade da água.</Aviso>
          : <>
            <div style={grade(160)}>
              <Kpi titulo={`Amostras analisadas (E. coli) ${ano}`} v={anoAtual?.["amostras:ecoli"] ?? null} origem="oficial" />
              <Kpi titulo="E. coli presente" v={anoAtual ? anoAtual["presenca:ecoli"] ?? 0 : null} origem="oficial" cor={COR.alto} sub="padrão: ausência em 100 mL" />
              <Kpi titulo="Coliformes totais presentes" v={anoAtual ? anoAtual["presenca:coliformes"] ?? 0 : null} origem="oficial" cor={COR.medio}
                sub={anoAtual?.["amostras:coliformes"] ? `de ${fmt(anoAtual["amostras:coliformes"])} amostras` : undefined} />
              <Kpi titulo="Turbidez > 5,0 uT" v={anoAtual?.["amostras:turbidez"] ? anoAtual["fora_padrao:turbidez"] ?? 0 : null} origem="calculado"
                sub={anoAtual?.["amostras:turbidez"] ? `de ${fmt(anoAtual["amostras:turbidez"])} amostras` : "sem amostra de turbidez"} />
              <Kpi titulo="Cloro residual livre < 0,2 mg/L" v={anoAtual?.["amostras:cloro"] ? anoAtual["fora_padrao:cloro"] ?? 0 : null} origem="calculado"
                sub={anoAtual?.["amostras:cloro"] ? `de ${fmt(anoAtual["amostras:cloro"])} amostras` : "sem amostra de cloro"} />
            </div>
            <Painel titulo="Amostras da vigilância por mês" fonte="SISAGUA — API de Dados Abertos do MS" nota={d.referencias_agua}>
              {mensal.length ? <BarrasCategoria dados={mensal} chaveX="mes" series={[{ chave: "amostras", nome: "Amostras (E. coli)", cor: SERIE[0] },
                { chave: "ecoli", nome: "E. coli presente", cor: COR.alto }, { chave: "coliformes", nome: "Coliformes presentes", cor: SERIE[3] }]} />
                : <Vazio>{ND}.</Vazio>}
            </Painel>
          </>}
      </Secao>
      <Aviso>{d.nota_causalidade}</Aviso>
      <Secao titulo="Agravos de transmissão hídrica e alimentar notificados">
        {d.agravos.length ? <TabelaAgravos itens={d.agravos} ano={ano} /> : <Vazio>Sem notificação desses agravos na base da FVS em {ano - 2}–{ano}.</Vazio>}
      </Secao>
      <Selos fontes={d.fontes} />
      <Indisponiveis itens={d.indisponivel.slice(1)} />
    </>;
  }}</Carregando>;
}

// ── 4. Arboviroses e endemias ─────────────────────────────────────────────────

export function AreaArboviroses({ mun, ano }: { mun: string; ano: number }) {
  const q = useArea("arboviroses", mun, ano);
  const [sel, setSel] = useState<string | null>(null);
  return <Carregando q={q}>{() => {
    const d = q.data; const m = d.malaria ?? {};
    const ags: AgravoArea[] = d.agravos;
    const atual = ags.find(a => a.agravo === sel) ?? ags[0];
    const especies = Array.from(new Set<string>((m.parasita ?? []).map((r: LinhaSerie) => r.recorte_valor)));
    const porAno: Record<number, any> = {};
    for (const r of (m.parasita ?? []) as LinhaSerie[]) (porAno[r.ano] ??= { ano: String(r.ano) })[r.recorte_valor] = r.valor;
    const anual = ((m.anual ?? []) as LinhaSerie[]).filter(r => r.indicador === "positivos");
    return <>
      <div style={grade(170)}>
        {ags.map(a => (
          <button key={a.agravo} onClick={() => setSel(a.agravo)} aria-pressed={atual?.agravo === a.agravo}
            style={{ textAlign: "left", background: "#fff", border: `1px solid ${atual?.agravo === a.agravo ? AZUL : COR.borda}`, borderTop: `3px solid ${AZUL}`,
              borderRadius: 10, padding: "10px 12px", cursor: "pointer", display: "grid", gap: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: COR.sub }}>{a.agravo} <span style={{ fontWeight: 500 }}>{a.cid10 ? `· ${a.cid10}` : ""}</span></span>
            <span style={{ fontSize: 22, fontWeight: 800, color: COR.texto }}><V v={a.casos_ano} /></span>
            <span style={{ fontSize: 11, color: COR.sub }}>{ano - 1}: {fmt(a.casos_ano_anterior)} · {fmtPct(a.comparacao?.variacao_pct)} no mesmo período</span>
            <span style={{ fontSize: 11, color: COR.sub }}>{a.incidencia_100mil !== null ? `${fmt(a.incidencia_100mil, 1)}/100 mil hab. · ` : ""}<Tendencia t={a.tendencia} /></span>
          </button>))}
        <Kpi titulo={`Malária — positivos ${ano}`} v={m.positivos_ano ?? null} origem="oficial" cor="#2a78d6"
          sub={m.ipa_ano_anterior ? `IPA ${ano - 1}: ${fmt(m.ipa_ano_anterior.valor, 2)} — ${m.ipa_ano_anterior.texto}` : "SIVEP-Malária"} />
      </div>
      {!ags.length && <Vazio>Sem notificação de arboviroses/endemias na base da FVS para {ano - 2}–{ano}.</Vazio>}
      <div style={grade(340)}>
        {atual && <Painel titulo={`${atual.agravo} — semana epidemiológica ${ano} × ${ano - 1}`} fonte="SINAN — base FVS (notificações)"
          nota={atual.comparacao?.formula}>
          <LinhasSE dados={atual.semanal} series={[{ chave: String(ano - 1), nome: String(ano - 1), cor: SERIE[1] }, { chave: String(ano), nome: `${ano} (parcial)`, cor: SERIE[0] }]} />
        </Painel>}
        <Painel titulo={`Malária — positivos por semana ${ano} × ${ano - 1}`} fonte="SIVEP-Malária (painel FVS) — município provável de infecção"
          nota={m.comparacao ? `${fmt(m.comparacao.acumulado)} × ${fmt(m.comparacao.mesmo_periodo_ano_anterior)} até a SE ${m.comparacao.ate_se} (${fmtPct(m.comparacao.variacao_pct)})` : undefined}>
          {m.semanal?.some((l: any) => l[String(ano)] || l[String(ano - 1)]) ? <LinhasSE dados={m.semanal}
            series={[{ chave: String(ano - 1), nome: String(ano - 1), cor: SERIE[1] }, { chave: String(ano), nome: `${ano} (parcial)`, cor: SERIE[0] }]} />
            : <Vazio>{ND}.</Vazio>}
        </Painel>
        <Painel titulo="Malária — espécie parasitária por ano" fonte="SIVEP-Malária (painel FVS)">
          {especies.length ? <BarrasCategoria dados={Object.values(porAno)} chaveX="ano" series={especies.map(e => ({ chave: e, nome: e }))} /> : <Vazio>{ND}.</Vazio>}
        </Painel>
        <Painel titulo="Malária — positivos por ano (10 anos)" fonte="SIVEP-Malária (painel FVS)">
          {anual.length ? <BarrasAnuais dados={anual.map(r => ({ ano: String(r.ano), valor: r.valor }))} series={[{ chave: "valor", nome: "Positivos" }]} /> : <Vazio>{ND}.</Vazio>}
        </Painel>
      </div>
      {ags.length > 0 && <Secao titulo="Comparativo com anos anteriores"><TabelaAgravos itens={ags} ano={ano} onEscolher={setSel} /></Secao>}
      <Selos fontes={d.fontes} />
      <Indisponiveis itens={d.indisponivel} />
    </>;
  }}</Carregando>;
}

// ── 5. Notificações compulsórias ──────────────────────────────────────────────

type Col = "agravo" | "cid10" | "notificacoes" | "ano_anterior" | "acumulado_se" | "variacao_pct" | "incidencia_100mil";

export function AreaNotificacoes({ mun, ano }: { mun: string; ano: number }) {
  const q = useArea("notificacoes", mun, ano);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("");
  const [ordem, setOrdem] = useState<{ col: Col; desc: boolean }>({ col: "notificacoes", desc: true });
  const linhas = useMemo(() => {
    const ls = (q.data?.linhas ?? []).filter((l: any) => (!busca || `${l.agravo} ${l.cid10 ?? ""}`.toLowerCase().includes(busca.toLowerCase()))
      && (!filtro || (filtro === "relevante" ? l.aumento_relevante : filtro === "imediata" ? l.imediata : l.tendencia === filtro)));
    return [...ls].sort((a: any, b: any) => {
      const x = a[ordem.col], y = b[ordem.col];
      const r = typeof x === "string" || typeof y === "string" ? String(x ?? "").localeCompare(String(y ?? "")) : (x ?? -1e9) - (y ?? -1e9);
      return ordem.desc ? -r : r;
    });
  }, [q.data, busca, filtro, ordem]);
  const cab = (col: Col, rot: string) => <button onClick={() => setOrdem(o => ({ col, desc: o.col === col ? !o.desc : col !== "agravo" }))}
    style={{ background: "none", border: 0, padding: 0, font: "inherit", fontWeight: 700, color: ordem.col === col ? AZUL : COR.sub, cursor: "pointer", display: "inline-flex", gap: 3, alignItems: "center" }}>
    {rot} <ArrowDownUp size={11} /></button>;
  const exportar = () => {
    const d = q.data;
    const cols = ["Agravo", "CID-10", "Notificação imediata", `Notificações ${ano}`, `Notificações ${ano - 1}`, "Acumulado até a SE", "Mesmo período ano anterior",
      "SE de referência", "Variação %", "Incidência/100 mil", "Tendência", "Casos confirmados", "Fonte", "Atualização"];
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const num = (v: number | null) => v === null || v === undefined ? "" : String(v).replace(".", ",");
    const corpo = linhas.map((l: any) => [l.agravo, l.cid10, l.imediata ? "sim" : "não", num(l.notificacoes), num(l.ano_anterior), num(l.acumulado_se),
      num(l.mesmo_periodo), l.ate_se, num(l.variacao_pct), num(l.incidencia_100mil), l.tendencia, ND, d.fonte.rotulo, d.fonte.data_referencia ?? ""].map(esc).join(";"));
    const blob = new Blob(["﻿" + [cols.map(esc).join(";"), ...corpo].join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `notificacoes_${mun}_${ano}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 4000);
  };
  return <Carregando q={q}>{() => {
    const d = q.data;
    return <Secao titulo={`Doenças e agravos de notificação compulsória — ${d.municipio.nome ?? mun} · ${ano}`} direita={<SeloFonteFvs estado={d.fonte} compacto />}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
        <label style={{ ...rotuloStyle, flex: "1 1 220px" }}>Pesquisar
          <span style={{ position: "relative" }}><Search size={13} style={{ position: "absolute", left: 9, top: 11, color: COR.sub }} />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Agravo ou CID-10" style={{ ...selectStyle, width: "100%", paddingLeft: 28 }} /></span></label>
        <label style={rotuloStyle}>Filtrar
          <select value={filtro} onChange={e => setFiltro(e.target.value)} style={selectStyle}>
            <option value="">Todos ({d.linhas.length})</option><option value="relevante">Aumento relevante</option>
            <option value="imediata">Notificação imediata</option><option value="crescimento">Tendência de crescimento</option>
            <option value="redução">Tendência de redução</option></select></label>
        <button style={botaoSec} onClick={exportar} disabled={!linhas.length}><Download size={13} /> Exportar (Excel/CSV)</button>
      </div>
      {d.linhas.length ? <TabelaSimples alinhar={["left", "left", "right", "right", "right", "right", "right", "left", "left"]}
        colunas={[cab("agravo", "Agravo") as any, cab("cid10", "CID-10"), cab("notificacoes", `${ano}`), cab("ano_anterior", `${ano - 1}`),
          cab("acumulado_se", "Mesmo período"), cab("variacao_pct", "Variação"), cab("incidencia_100mil", "Incid./100 mil"), "Tendência", "Confirmados"]}
        linhas={linhas.map((l: any) => [
          <span style={{ display: "inline-flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>{l.agravo}
            {l.imediata && <span title="Notificação imediata (até 24 h)" style={{ fontSize: 9.5, fontWeight: 800, color: PRIORIDADE.critico.cor, border: `1px solid ${PRIORIDADE.critico.cor}55`, borderRadius: 4, padding: "0 4px" }}>IMEDIATA</span>}
            {l.aumento_relevante && <span style={{ fontSize: 9.5, fontWeight: 800, color: COR.alto, background: "#fef2f2", borderRadius: 4, padding: "0 4px" }}>AUMENTO</span>}</span>,
          l.cid10 ?? "—", fmt(l.notificacoes), fmt(l.ano_anterior),
          l.acumulado_se !== null && l.acumulado_se !== undefined ? `${fmt(l.acumulado_se)} × ${fmt(l.mesmo_periodo)} (SE 1–${l.ate_se})` : "—",
          <span style={{ color: l.aumento_relevante ? COR.alto : COR.texto, fontWeight: l.aumento_relevante ? 700 : 400 }}>{fmtPct(l.variacao_pct)}</span>,
          fmt(l.incidencia_100mil, 1), <Tendencia t={l.tendencia} />, <span style={{ color: "#94a3b8", fontSize: 11.5 }}>não publicado</span>])} />
        : <Vazio>{ND}: sem notificações na base da FVS para este município em {ano} e {ano - 1}.</Vazio>}
      <div style={{ fontSize: 11.5, color: COR.sub, display: "grid", gap: 2 }}>
        <span><b>Destaque de aumento:</b> {d.criterio_relevancia}</span>
        <span><b>Tendência:</b> últimas 4 semanas × 4 anteriores (±25%); "números pequenos" quando há menos de 5 casos nas 8 semanas.</span>
        <span>{d.nota_confirmados} CID-10 de referência da ficha do agravo.</span>
      </div>
    </Secao>;
  }}</Carregando>;
}

// ── 6. Vigilância ambiental ───────────────────────────────────────────────────

export function AreaAmbiental({ mun, ano, onMunicipio }: { mun: string; ano: number; onMunicipio: (m: string) => void }) {
  const q = useArea("ambiental", mun, ano);
  const mapa = useQuery({ queryKey: ["fvs-mapa", "inpe_focos", ano], queryFn: () =>
    apiGet<{ municipios: ValorMapa[]; estado: EstadoFonte }>(`${FVS_API}/mapa`, { fonte: "inpe_focos", indicador: "focos_calor", ano }) });
  const { data: catalogo } = useCatalogoFvs();
  const inundacao = catalogo?.paineis.find(p => p.id === "fvs-inundacao");
  return <Carregando q={q}>{() => {
    const d = q.data; const fa = d.focos_acumulado;
    const anos = d.focos_anual.map((x: any) => x.ano);
    const ranking = [...(mapa.data?.municipios ?? [])].filter(m => m.valor).sort((a, b) => (b.valor ?? 0) - (a.valor ?? 0)).slice(0, 10);
    return <>
      <div style={grade(170)}>
        <Kpi titulo={`Focos de calor ${ano}`} v={d.focos_anual.find((x: any) => x.ano === ano)?.focos ?? null} origem="oficial" cor={COR.alto} sub="INPE — satélite de referência" />
        <Kpi titulo="Mesmo período do ano anterior" origem="calculado" cor={COR.medio} sub={fa.ate_se ? `SE 1–${fa.ate_se}: ${fmt(fa.ano)} × ${fmt(fa.ano_anterior)}` : undefined}>
          {fa.variacao_pct === null ? <V v={null} /> : fmtPct(fa.variacao_pct)}</Kpi>
        <Kpi titulo="Mês com mais focos" sub={`${ano}`}>{d.mes_pico ? MESES[d.mes_pico - 1] : <V v={null} />}</Kpi>
        <Kpi titulo="Precipitação / estiagem" v={null} sub="INMET exige credencial institucional" />
        <Kpi titulo="Cheias e emergências" v={null} sub="ver painel oficial da FVS abaixo" />
      </div>
      <Aviso>{d.nota_satelite}</Aviso>
      <div style={grade(340)}>
        <Painel titulo="Focos de calor por mês — últimos 5 anos" fonte="INPE — Programa Queimadas" nota="Período de maior risco: meses com mais focos.">
          {d.focos_mensal.some((m: any) => anos.some((a: number) => m[String(a)])) ? <LinhasSE dados={d.focos_mensal} chaveX="mes" intervalo={0}
            fmtX={(v: number) => MESES[v - 1]} series={anos.map((a: number, i: number) => ({ chave: String(a), nome: a === ano ? `${a} (parcial)` : String(a),
              cor: i === anos.length - 1 ? COR.alto : ["#cbd5e1", "#94a3b8", "#64748b", "#334155"][i], tracejado: false }))} /> : <Vazio>{ND}.</Vazio>}
        </Painel>
        <Painel titulo="Focos de calor por ano" fonte="INPE — satélite de referência">
          {d.focos_anual.some((x: any) => x.focos !== null) ? <BarrasAnuais dados={d.focos_anual.map((x: any) => ({ ano: String(x.ano), valor: x.focos }))}
            series={[{ chave: "valor", nome: "Focos" }]} /> : <Vazio>{ND}.</Vazio>}
        </Painel>
        <Painel titulo={`Focos de calor nos municípios do AM — ${ano}`} fonte="INPE · limites municipais IBGE" nota="Clique num município para abrir o painel dele.">
          {mapa.data?.municipios.some(m => m.valor) ? <MapaAmazonas valores={mapa.data.municipios} medida="valor" selecionados={[mun]} rotuloMedida="Focos de calor"
            onSelecionar={onMunicipio} /> : <Vazio>{ND}.</Vazio>}
        </Painel>
        <Painel titulo="Municípios com mais focos" fonte="INPE — satélite de referência">
          {ranking.length ? <TabelaSimples colunas={["Município", `${ano}`, `${ano - 1}`, "Variação"]} linhas={ranking.map(m =>
            [m.ibge6 === mun ? <b>{m.nome}</b> : m.nome, fmt(m.valor), fmt(m.ano_anterior), fmtPct(m.variacao_pct)])} /> : <Vazio>{ND}.</Vazio>}
        </Painel>
      </div>
      {inundacao && <Secao titulo="Cheias e inundações — painel oficial da FVS"><PainelOficial painel={inundacao} /></Secao>}
      <Selos fontes={d.fontes} />
      <Indisponiveis itens={d.indisponivel} />
    </>;
  }}</Carregando>;
}

// ── 7. PQA-VS ─────────────────────────────────────────────────────────────────

const SEMAFORO: Record<string, { cor: string; fundo: string; rotulo: string }> = {
  verde: { cor: "#15803d", fundo: "#dcfce7", rotulo: "Meta atingida" }, amarelo: { cor: "#a16207", fundo: "#fef9c3", rotulo: "Próximo da meta" },
  vermelho: { cor: "#b91c1c", fundo: "#fee2e2", rotulo: "Abaixo da meta" }, cinza: { cor: "#64748b", fundo: "#f1f5f9", rotulo: "Sem dado / não avaliado" },
};

export function AreaPqa({ mun }: { mun: string }) {
  const q = useQuery({ queryKey: ["vig-pqa", mun], enabled: mun !== IBGE_AM, queryFn: () => apiGet<any>(`${FVS_API}/pqa-semaforo`, { mun }) });
  const [ind, setInd] = useState("IND_01");
  if (mun === IBGE_AM) return <Vazio>Escolha um município: o PQA-VS é avaliado por município.</Vazio>;
  return <Carregando q={q}>{() => {
    const u = q.data.ultimo;
    const hist = (q.data.historico ?? []).filter((h: any) => h.indicador === ind && h.resultado !== null);
    const cont = (c: string) => (u?.itens ?? []).filter((i: any) => i.semaforo === c).length;
    return <>
      <Secao titulo={`PQA-VS — ${u?.periodo_rotulo ?? "sem resultado"}`} direita={<SeloFonteFvs estado={q.data.estado} compacto />}>
        {u ? <>
          <div style={grade(150)}>{Object.entries(SEMAFORO).map(([k, s]) => (
            <div key={k} style={{ background: s.fundo, borderRadius: 10, padding: "8px 12px", border: `1px solid ${s.cor}33` }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: s.cor }}>{s.rotulo}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: COR.texto }}>{cont(k)}</div></div>))}
          </div>
          <TabelaSimples alinhar={["left", "left", "left", "right", "left", "left", "left", "left"]}
            colunas={["Nº", "Indicador", "Meta oficial", "Resultado", "Cumprimento da meta", "Situação", "Período", "Fonte"]}
            linhas={u.itens.map((i: any) => {
              const s = SEMAFORO[i.semaforo];
              return [<button style={{ background: "none", border: 0, padding: 0, color: AZUL, cursor: "pointer", fontWeight: 700 }} onClick={() => setInd(i.indicador)}>
                {i.indicador.replace("IND_", "")}</button>, i.nome ?? <span style={{ color: COR.sub }}>Indicador {i.indicador.replace("IND_", "")} (Portaria GM/MS nº 6.878/2025)</span>,
                i.meta ?? "—", fmt(i.resultado, 1),
                i.cumprimento_pct === null ? "—" : <span style={{ display: "inline-flex", gap: 6, alignItems: "center", minWidth: 120 }}>
                  <span style={{ flex: 1, height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", width: `${Math.min(100, i.cumprimento_pct)}%`, background: s.cor }} /></span>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(i.cumprimento_pct, 0)}%</span></span>,
                <span style={{ fontSize: 11, fontWeight: 700, color: s.cor, background: s.fundo, borderRadius: 999, padding: "2px 8px", whiteSpace: "nowrap" }}>
                  {i.observacao === "Ausência de casos" ? "Ausência de casos" : s.rotulo}</span>,
                u.periodo_rotulo, "FVS-AM (PQA-VS)"];
            })} />
          <div style={{ fontSize: 11.5, color: COR.sub, display: "grid", gap: 2 }}>
            <span><b>Semáforo:</b> {q.data.criterio_semaforo}</span><span>{q.data.nota_metas}</span>
            <span>Metas atingidas: <b>{u.atingidos} de {u.avaliados}</b> avaliados (alcance publicado pela FVS).</span></div>
        </> : <Vazio>{ND}: sem resultado do PQA-VS publicado para este município.</Vazio>}
      </Secao>
      <Secao titulo={`Histórico — indicador ${ind.replace("IND_", "")}`}>
        {hist.length ? <BarrasAnuais dados={hist.map((h: any) => ({ ano: h.periodo, valor: h.resultado }))} series={[{ chave: "valor", nome: "Resultado" }]} />
          : <Vazio>{ND} — sem histórico numérico para este indicador.</Vazio>}
        <div style={{ fontSize: 11, color: COR.sub }}>Até 2023 por ano; a partir de 2025 por quadrimestre. A definição de alguns indicadores mudou em 2024 — compare com cuidado.</div>
      </Secao>
    </>;
  }}</Carregando>;
}

// ── 8. Inteligência epidemiológica ────────────────────────────────────────────

export function AreaInteligencia({ mun, ano }: { mun: string; ano: number }) {
  const q = useArea("inteligencia", mun, ano);
  return <Carregando q={q}>{() => {
    const d = q.data;
    const bloco = (titulo: string, cor: string, itens: ReactNode[], vazio: string) => (
      <Painel titulo={<span style={{ color: cor }}>{titulo}</span>}>
        {itens.length ? <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6, fontSize: 12.5 }}>{itens.map((t, i) => <li key={i}>{t}</li>)}</ul>
          : <div style={{ fontSize: 12.5, color: COR.sub }}>{vazio}</div>}
      </Painel>);
    return <>
      <Aviso>{d.aviso}</Aviso>
      <div style={grade(320)}>
        {bloco("Fatos observados", AZUL, d.fatos.map((f: any) => <><SeloPrioridade p={f.prioridade} /> {f.texto}</>), "Nenhuma alteração relevante identificada pelas regras.")}
        {bloco("Hipóteses para avaliação técnica", COR.calculado, d.hipoteses.map((h: any) => <>{h.texto}<div style={{ fontSize: 11, color: COR.sub }}>Cálculo: {h.formula}</div></>),
          "Sem coincidências temporais ou desvios sazonais acima dos critérios.")}
        {bloco("Indicadores que pedem investigação", COR.alto, d.investigar, "Nenhum alerta crítico ou alto.")}
        {bloco("Limitações dos dados", COR.sub, d.limitacoes, "—")}
      </div>
    </>;
  }}</Carregando>;
}
