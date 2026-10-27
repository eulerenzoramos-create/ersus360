// eGestor › Painel Geral da APS — reúne os módulos sem misturar periodicidades:
// monitoramento MENSAL (preliminar) e avaliação QUADRIMESTRAL (cofinanciamento), com competência,
// atualização, situação e defasagem. Só contagens do que o Ministério publicou.
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../lib/api";

const CLS = [
  { k: "otimo", rot: "Ótimo", cor: "#1d4ed8" }, { k: "bom", rot: "Bom", cor: "#16a34a" },
  { k: "suficiente", rot: "Suficiente", cor: "#d97706" }, { k: "regular", rot: "Regular", cor: "#dc2626" },
];
const dataBR = (iso?: string | null) => iso ? new Date(iso.endsWith("Z") ? iso : iso + "Z").toLocaleString("pt-BR") : "—";
const card: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14 };

export default function PainelGeralAps({ irPara }: { irPara: (aba: string) => void }) {
  const [mod, setMod] = useState<string>("");
  const { data: p, isLoading } = useQuery<any>({
    queryKey: ["siaps-painel-geral", mod],
    queryFn: () => api.get("/api/siaps-publico/painel-geral", { params: mod ? { modalidade: mod } : {} }).then(r => r.data),
  });
  if (isLoading || !p) return <div style={{ padding: 30, color: "#6b7280" }}>Carregando painel…</div>;
  const m = p.monitoramento_mensal, q = p.avaliacao_quadrimestral;
  const mods = Object.keys(p.equipes_por_modalidade ?? {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ ...card, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#1e3a8a" }}>Painel Geral da APS — {p.municipio} ({p.ibge})</div>
        {p.equidade && <span style={{ fontSize: 12, background: "#fef3c7", color: "#92400e", padding: "2px 10px", borderRadius: 12, fontWeight: 700 }}>
          IED {p.equidade.faixa_ied} · {p.equidade.porte_populacional}</span>}
        <label style={{ fontSize: 12, marginLeft: "auto" }}>Modalidade{" "}
          <select value={mod} onChange={e => setMod(e.target.value)} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1" }}>
            <option value="">Todas</option>{mods.map(x => <option key={x} value={x}>{x}</option>)}
          </select></label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
        {Object.entries(p.equipes_por_modalidade ?? {}).map(([k, v]: any) => (
          <div key={k} style={{ ...card, textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#1d4ed8" }}>{v}</div>
            <div style={{ fontSize: 12, color: "#475569" }}>equipes {k}</div>
            {p.homologadas_validas && <div style={{ fontSize: 10.5, color: "#64748b" }}>
              válidas {p.homologadas_validas.validas?.[k] ?? "—"} ({p.homologadas_validas.quadrimestre})</div>}
          </div>))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1e3a8a" }}>Monitoramento mensal (preliminar)</div>
          <div style={{ fontSize: 12, color: "#334155", margin: "6px 0" }}>
            Competência oficial mais recente: <b>{m.competencia_rotulo ?? "nenhuma captada"}</b><br />
            Mês corrente: {p.mes_corrente}
            {m.defasagem_meses != null && <> · <b style={{ color: m.defasagem_meses > 2 ? "#b45309" : "#334155" }}>
              defasagem de {m.defasagem_meses} {m.defasagem_meses === 1 ? "mês" : "meses"}</b> (o SIAPS ainda não publicou as competências seguintes)</>}<br />
            Atualizado no ERSUS360: {dataBR(m.atualizado_em)} · Fonte: {m.fonte}
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#b91c1c", marginTop: 8 }}>Indicadores com equipes em Regular ({m.indicadores_com_regular.length})</div>
          {m.indicadores_com_regular.map((i: any) => (
            <div key={i.sg_equipe + i.codigo} style={{ fontSize: 12, padding: "2px 0" }}>
              • <b>{i.codigo}</b> {i.nome} ({i.sg_equipe}): {i.equipes.join(", ")}</div>))}
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#15803d", marginTop: 8 }}>Indicadores sem equipes em Regular ({m.indicadores_sem_regular.length})</div>
          <div style={{ fontSize: 12, color: "#334155" }}>{m.indicadores_sem_regular.map((i: any) => `${i.codigo} (${i.sg_equipe}: ${i.otimo}/${i.total} Ótimo)`).join(" · ") || "—"}</div>
          <button onClick={() => irPara("analise_indicador")} style={{ marginTop: 10, fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "1px solid #1d4ed8", background: "#fff", color: "#1d4ed8", cursor: "pointer" }}>
            Abrir Análise do Indicador →</button>
        </div>

        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1e3a8a" }}>Avaliação quadrimestral (cofinanciamento)</div>
          <div style={{ fontSize: 12, color: "#334155", margin: "6px 0" }}>
            Último quadrimestre publicado: <b>{q.publicado_rotulo ?? "—"}</b><br />
            Por equipe (área logada): {q.por_equipe_mais_recente ?? "não captado"}{q.por_equipe_situacao && ` — ${q.por_equipe_situacao}`}<br />
            Atualizado no ERSUS360: {dataBR(q.atualizado_em)}
          </div>
          {(q.componentes_publicados ?? []).filter((c: any) => !mod || c.tipo_equipe === mod).map((c: any) => (
            <div key={c.origem + c.tipo_equipe} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: "3px 0" }}>
              <span style={{ minWidth: 150 }}>{c.origem === "CVAT" ? "Vínculo" : "Qualidade"} · {c.tipo_equipe}</span>
              <div style={{ flex: 1, display: "flex", height: 10, borderRadius: 5, overflow: "hidden" }}>
                {CLS.map(k => <div key={k.k} title={`${k.rot} ${c[k.k]}`} style={{ width: `${c[k.k] / (c.total || 1) * 100}%`, background: k.cor }} />)}
              </div>
              <span style={{ fontSize: 11, color: "#64748b", minWidth: 90 }}>{CLS.map(k => c[k.k]).join("/")} de {c.total}</span>
            </div>))}
          {q.historico?.length > 1 && (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={q.historico.map((h: any) => {
                const c = h.componentes.find((x: any) => x.origem === "CVAT" && (!mod || x.tipo_equipe === mod)) ?? h.componentes[0];
                return { q: h.quadrimestre, ...Object.fromEntries(CLS.map(k => [k.rot, c?.[k.k] ?? 0])) };
              })}>
                <XAxis dataKey="q" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={22} /><Tooltip contentStyle={{ fontSize: 11 }} />
                {CLS.map(k => <Bar key={k.k} dataKey={k.rot} stackId="a" fill={k.cor} />)}
              </BarChart>
            </ResponsiveContainer>)}
          <button onClick={() => irPara("quadrimestre")} style={{ marginTop: 6, fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "1px solid #1d4ed8", background: "#fff", color: "#1d4ed8", cursor: "pointer" }}>
            Abrir Avaliação Quadrimestre →</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1e3a8a" }}>Resultados indisponíveis ({p.indisponiveis.length})</div>
          <div style={{ fontSize: 11.5, color: "#64748b", marginBottom: 4 }}>Indicadores oficiais das modalidades do município sem resultado captado.</div>
          <div style={{ fontSize: 12 }}>{p.indisponiveis.map((i: any) => `${i.codigo} — ${i.nome} (${i.modalidades})`).join(" · ") || "Nenhum."}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1e3a8a" }}>Conferência e divergências</div>
          <div style={{ fontSize: 12, margin: "4px 0" }}>Confere: <b>{p.conferencia.confere ?? 0}</b> · Diverge: <b style={{ color: "#dc2626" }}>{p.conferencia.diverge ?? 0}</b>
            {" "}· Sem comparação: {p.conferencia.sem_comparacao ?? 0} · Problemas de integridade: {p.conferencia.problemas_integridade ?? 0}</div>
          {p.divergencias.slice(0, 8).map((d: any, i: number) => (
            <div key={i} style={{ fontSize: 11.5, color: "#b91c1c" }}>• {d.problema ?? `${d.quadrimestre} ${d.componente} ${d.sg_equipe}: área pública ≠ área logada`}</div>))}
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>{p.regra}</div>
        </div>
      </div>
    </div>
  );
}
