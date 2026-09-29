// Indicadores por Equipe — resultados oficiais do SIAPS por INE (motor de indicadores)
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Info, Users, X } from "lucide-react";
import { api } from "../lib/api";

interface Linha {
  componente: "qualidade" | "cvat"; indicador: string; indicador_nome: string; equipe: string; ine: string; tipo: string;
  cnes: string; numerador: number | null; denominador: number | null; resultado: number | null; meta: number | null;
  gap: number | null; classificacao: string | null; meta_status: string; regra: string; situacao: string; fonte: string;
  coletado_em: string | null;
}
interface Atencao { tipo: string; equipe: string; ine: string; indicador: string | null; resultado?: number | null;
  meta?: number | null; gap?: number | null; classificacao?: string | null; origem_provavel: string }
interface Resposta {
  situacao_dado: string; competencias: string[]; competencia?: string; nota?: string;
  cards?: Record<string, number>; linhas?: Linha[]; atencao_necessaria?: Atencao[];
  ultima_sincronizacao?: { em: string | null; sucesso: boolean | null; metodo: string | null; observacao: string | null };
}

const TIPOS = ["", "eSF", "eAP", "eSFR", "eSB", "eMulti"];
const COR: Record<string, string> = { otimo: "#1d4ed8", bom: "#16a34a", suficiente: "#d97706", regular: "#dc2626" };
const ROT: Record<string, string> = { otimo: "Ótimo", bom: "Bom", suficiente: "Suficiente", regular: "Regular" };
const card: React.CSSProperties = { background: "#fff", color: "#1f2937", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14 };
const th: React.CSSProperties = { padding: "6px 8px", textAlign: "left", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "6px 8px", borderTop: "1px solid #eee", fontVariantNumeric: "tabular-nums" };
const n = (v: number | null | undefined, d = 2) => (v === null || v === undefined ? "—" : v.toLocaleString("pt-BR", { maximumFractionDigits: d }));
const mesAno = (c?: string) => { if (!c) return "—"; const [a, m] = c.split("-"); return `${["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][+m - 1]}/${a}`; };
const dataHora = (d?: string | null) => (d ? new Date(d).toLocaleString("pt-BR") : "—");

function DetalheEquipe({ ine, linhas, onFechar }: { ine: string; linhas: Linha[]; onFechar: () => void }) {
  const { data } = useQuery<{ series: Record<string, { competencia: string; resultado: number | null; numerador: number | null; denominador: number | null }[]> }>({
    queryKey: ["indicadores-historico", ine],
    queryFn: () => api.get("/api/siaps-relatorios/resultados/historico", { params: { ine } }).then(r => r.data),
  });
  const da = linhas.filter(l => l.ine === ine);
  const eq = da[0];
  return (
    <div role="dialog" aria-label={`Detalhamento da equipe ${eq?.equipe}`} style={{ ...card, marginBottom: 16, borderColor: "#93c5fd" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{eq?.equipe} <span style={{ fontSize: 12, color: "#525252" }}>· {eq?.tipo} · INE {ine} · CNES {eq?.cnes || "—"}</span></div>
          <div style={{ fontSize: 12, color: "#525252" }}>Detalhamento do cálculo — resultado oficial publicado pelo SIAPS</div>
        </div>
        <button type="button" onClick={onFechar} aria-label="Fechar" style={{ border: "none", background: "none", cursor: "pointer" }}><X size={18} /></button>
      </div>
      <div style={{ overflowX: "auto", marginTop: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ background: "#f5f5f3" }}>
            {["Indicador", "Numerador", "Denominador", "Resultado", "Meta", "GAP", "Regra aplicada", "Fonte", "Coleta", "Evolução"].map(h => <th key={h} style={th}>{h}</th>)}
          </tr></thead>
          <tbody>{da.map(l => {
            const serie = data?.series?.[l.indicador] ?? [];
            return (
              <tr key={l.indicador}>
                <td style={{ ...td, fontWeight: 600 }}>{l.indicador} — {l.indicador_nome}</td>
                <td style={td}>{n(l.numerador)}</td><td style={td}>{n(l.denominador)}</td>
                <td style={{ ...td, fontWeight: 700, color: COR[l.classificacao ?? ""] }}>{n(l.resultado)}</td>
                <td style={td}>{l.meta_status === "pendente_parametrizacao" ? <span style={{ color: "#737373" }}>pendente</span> : n(l.meta)}</td>
                <td style={{ ...td, color: (l.gap ?? 0) < 0 ? "#dc2626" : "#16a34a" }}>{l.gap === null ? "—" : `${l.gap > 0 ? "+" : ""}${n(l.gap)}`}</td>
                <td style={{ ...td, fontSize: 11, maxWidth: 260 }}>{l.regra}</td>
                <td style={{ ...td, fontSize: 11 }}>{l.fonte} · {l.situacao}</td>
                <td style={{ ...td, fontSize: 11 }}>{dataHora(l.coletado_em)}</td>
                <td style={{ ...td, fontSize: 11 }}>{serie.length ? serie.map(s => `${mesAno(s.competencia)}: ${n(s.resultado)}`).join(" · ") : "—"}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </div>
  );
}

export default function IndicadoresPorEquipe() {
  const [f, setF] = useState({ competencia: "", tipo: "", indicador: "" });
  const [aberta, setAberta] = useState<string | null>(null);
  const { data, isLoading } = useQuery<Resposta>({
    queryKey: ["indicadores-resultados", f],
    queryFn: () => api.get("/api/siaps-relatorios/resultados", {
      params: Object.fromEntries(Object.entries(f).filter(([, v]) => v)) }).then(r => r.data),
  });
  const linhas = data?.linhas ?? [];
  const indicadores = useMemo(() => Array.from(new Set(linhas.map(l => l.indicador))).sort(), [linhas]);
  const equipes = useMemo(() => {
    const m = new Map<string, { equipe: string; ine: string; tipo: string; por: Record<string, Linha> }>();
    for (const l of linhas) {
      const e = m.get(l.ine) ?? { equipe: l.equipe, ine: l.ine, tipo: l.tipo, por: {} };
      e.por[l.indicador] = l; m.set(l.ine, e);
    }
    return Array.from(m.values()).sort((a, b) => a.tipo.localeCompare(b.tipo) || a.equipe.localeCompare(b.equipe));
  }, [linhas]);
  const cards = data?.cards;

  return (
    <div style={{ padding: 20, maxWidth: 1300, color: "#1f2937" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", color: "#111827", display: "flex", gap: 8, alignItems: "center" }}>
        <Users size={20} /> Indicadores por Equipe
      </h1>
      <p style={{ fontSize: 13, color: "#525252", margin: "0 0 14px" }}>{data?.nota ?? "Resultados oficiais do SIAPS por equipe (INE)."}</p>

      <div style={{ ...card, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 12, fontSize: 13 }}>
        <label>Competência<br />
          <select id="f-comp" value={f.competencia || data?.competencia || ""} onChange={e => setF({ ...f, competencia: e.target.value })} style={{ padding: 6, borderRadius: 6 }}>
            {(data?.competencias ?? []).map(c => <option key={c} value={c}>{mesAno(c)}</option>)}
          </select></label>
        <label>Tipo de equipe<br />
          <select id="f-tipo" value={f.tipo} onChange={e => setF({ ...f, tipo: e.target.value })} style={{ padding: 6, borderRadius: 6 }}>
            {TIPOS.map(t => <option key={t} value={t}>{t || "Todas"}</option>)}
          </select></label>
        <label>Indicador<br />
          <select id="f-ind" value={f.indicador} onChange={e => setF({ ...f, indicador: e.target.value })} style={{ padding: 6, borderRadius: 6 }}>
            <option value="">Todos</option>
            {indicadores.map(i => <option key={i} value={i}>{i}</option>)}
          </select></label>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "#525252" }}>
          Última sincronização: <b>{dataHora(data?.ultima_sincronizacao?.em)}</b>
          {data?.ultima_sincronizacao?.metodo && ` · ${data.ultima_sincronizacao.metodo}`}
          {data?.ultima_sincronizacao?.sucesso === false && <span style={{ color: "#dc2626" }}> · com erros</span>}
        </div>
      </div>

      {isLoading && <div style={card}>Carregando…</div>}
      {data?.situacao_dado === "nao_disponivel" && (
        <div style={{ ...card, fontSize: 14 }}>Nenhum resultado oficial coletado ainda. Os resultados aparecem aqui assim que os relatórios do SIAPS são coletados/importados.</div>
      )}

      {cards && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 12 }}>
          {([["Equipes monitoradas", cards.equipes_monitoradas, "#1d4ed8"], ["Indicadores monitorados", cards.indicadores_monitorados, "#1d4ed8"],
             ["Meta atingida", cards.meta_atingida, "#16a34a"], ["Abaixo da meta", cards.abaixo_da_meta, "#dc2626"],
             ["Sem meta parametrizada", cards.sem_meta_parametrizada, "#737373"], ["Sem dados", cards.sem_dados, "#d97706"]] as [string, number, string][])
            .map(([t, v, c]) => (
              <div key={t} style={{ ...card, textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: c }}>{v}</div><div style={{ fontSize: 12 }}>{t}</div>
              </div>))}
        </div>
      )}

      {aberta && <DetalheEquipe ine={aberta} linhas={linhas} onFechar={() => setAberta(null)} />}

      {equipes.length > 0 && (
        <div style={{ ...card, overflowX: "auto", marginBottom: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Resultado por equipe — {mesAno(data?.competencia)} <span style={{ fontWeight: 400, fontSize: 12, color: "#525252" }}>(clique na equipe para o detalhamento)</span></div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: "#f5f5f3" }}>
              <th style={th}>Equipe</th><th style={th}>Tipo</th><th style={th}>INE</th>
              {indicadores.map(i => <th key={i} style={th}>{i}</th>)}
            </tr></thead>
            <tbody>{equipes.map(e => (
              <tr key={e.ine}>
                <td style={td}><button type="button" onClick={() => setAberta(e.ine)} style={{ border: "none", background: "none", color: "#1d4ed8", fontWeight: 600, cursor: "pointer", padding: 0 }}>{e.equipe}</button></td>
                <td style={td}>{e.tipo}</td><td style={td}>{e.ine}</td>
                {indicadores.map(i => {
                  const l = e.por[i];
                  return <td key={i} style={{ ...td, color: COR[l?.classificacao ?? ""], fontWeight: l?.classificacao ? 700 : 400 }}
                             title={l ? `${l.indicador_nome}${l.meta !== null ? ` · meta ${n(l.meta)} · GAP ${n(l.gap)}` : " · meta pendente"}` : ""}>
                    {l ? `${n(l.resultado)}${l.classificacao ? ` · ${ROT[l.classificacao]}` : ""}` : "—"}</td>;
                })}
              </tr>))}
            </tbody>
          </table>
        </div>
      )}

      {(data?.atencao_necessaria ?? []).length > 0 && (
        <div style={card}>
          <div style={{ fontWeight: 700, marginBottom: 8, display: "flex", gap: 6, alignItems: "center", color: "#b45309" }}><AlertTriangle size={16} /> Atenção necessária</div>
          {data!.atencao_necessaria!.map((a, k) => (
            <div key={k} style={{ borderLeft: `4px solid ${a.tipo === "abaixo_da_meta" ? "#dc2626" : a.tipo === "sem_dados" ? "#d97706" : "#7c3aed"}`, padding: "6px 10px", marginBottom: 6, background: "#fafafa", fontSize: 13 }}>
              <b>{a.equipe}</b> (INE {a.ine}){a.indicador && <> · {a.indicador}</>} —{" "}
              {a.tipo === "abaixo_da_meta" ? `abaixo da meta: resultado ${n(a.resultado)}${a.meta !== null && a.meta !== undefined ? `, meta ${n(a.meta)}, GAP ${n(a.gap)} p.p.` : ` (${ROT[a.classificacao ?? ""] ?? ""})`}`
                : a.tipo === "sem_dados" ? "sem dados na competência" : "inconsistência"}
              <div style={{ fontSize: 12, color: "#525252" }}>Provável origem: {a.origem_provavel}</div>
            </div>
          ))}
        </div>
      )}
      {data?.situacao_dado === "oficial_validado" && (data.atencao_necessaria ?? []).length === 0 && (
        <div style={{ ...card, color: "#059669", display: "flex", gap: 6 }}><CheckCircle2 size={16} /> Nenhuma equipe com atenção necessária nos filtros selecionados.</div>
      )}
      <div style={{ fontSize: 11, color: "#737373", marginTop: 10, display: "flex", gap: 6 }}><Info size={12} /> Meta/faixa exibida somente quando confirmada na fonte oficial; demais indicadores ficam "pendente de parametrização".</div>
    </div>
  );
}
