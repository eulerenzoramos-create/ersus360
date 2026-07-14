import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, BarChart2, Users, Layers, Calendar, Download, Filter } from "lucide-react";
import { apiGet } from "../lib/api";

// ── helpers ──────────────────────────────────────────────────────────────────
const corStatus = (s: string) =>
  s === "critico" ? "#ef4444" : s === "atencao" ? "#f59e0b" : "#22c55e";

const badgeStatus = (s: string) => {
  const map: Record<string, { bg: string; txt: string; label: string }> = {
    critico: { bg: "#fef2f2", txt: "#b91c1c", label: "CRÍTICO"  },
    atencao: { bg: "#fffbeb", txt: "#92400e", label: "ATENÇÃO"  },
    normal:  { bg: "#f0fdf4", txt: "#166534", label: "NORMAL"   },
  };
  const c = map[s] ?? map.normal;
  return (
    <span style={{
      background: c.bg, color: c.txt, border: `1px solid ${c.txt}22`,
      borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 700,
    }}>{c.label}</span>
  );
};

function Barra({ pct, cor }: { pct: number; cor?: string }) {
  const c = cor ?? (pct >= 75 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444");
  return (
    <div style={{ background: "#e5e7eb", borderRadius: 4, height: 8, width: "100%", overflow: "hidden" }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, background: c, height: "100%", borderRadius: 4 }} />
    </div>
  );
}

function KPI({ label, value, sub, cor }: { label: string; value: string | number; sub?: string; cor?: string }) {
  return (
    <div style={{
      background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10,
      padding: "14px 18px", borderTop: `3px solid ${cor ?? "#3b82f6"}`,
    }}>
      <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "var(--fg)", lineHeight: 1.1, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── exportar CSV ─────────────────────────────────────────────────────────────
function exportarCSV(linhas: string[][], nome: string) {
  const bom = "﻿";
  const csv = bom + linhas.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

// ── MESES ─────────────────────────────────────────────────────────────────────
const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

const ABAS = [
  { key: "tipo",          label: "Por Tipo",         Icon: Layers   },
  { key: "profissional",  label: "Por Profissional", Icon: Users    },
  { key: "equipe",        label: "Por Equipe",       Icon: BarChart2},
  { key: "diario",        label: "Diário",           Icon: Calendar },
];

const TIPOS_EQUIPE = ["ESF","ESB","eMulti"];

export default function RelatorioProducao() {
  const hoje = new Date();
  const [aba,    setAba]    = useState("tipo");
  const [mes,    setMes]    = useState(hoje.getMonth() + 1);
  const [ano,    setAno]    = useState(hoje.getFullYear());
  const [equipe, setEquipe] = useState("");
  const [tipoEq, setTipoEq] = useState("");
  const [profId, setProfId] = useState("");
  const [diaExpandido, setDiaExpandido] = useState<number | null>(null);
  const [grupoFiltro, setGrupoFiltro]   = useState("");

  // lista de equipes e profissionais para filtros
  const qEquipes = useQuery({ queryKey: ["rel-equipes"], queryFn: () => apiGet("/api/relatorios/equipes") });
  const qProfs   = useQuery({
    queryKey: ["rel-profs", equipe, tipoEq],
    queryFn:  () => apiGet(`/api/relatorios/profissionais?${equipe ? `equipe=${encodeURIComponent(equipe)}&` : ""}${tipoEq ? `tipo=${tipoEq}` : ""}`),
  });

  const params = new URLSearchParams({ mes: String(mes), ano: String(ano) });
  if (equipe) params.set("equipe", equipe);
  if (tipoEq) params.set("tipo_equipe", tipoEq);
  if (profId) params.set("profissional_id", profId);
  if (grupoFiltro) params.set("grupo", grupoFiltro);

  const qTipo  = useQuery({ queryKey: ["rel-tipo",  mes, ano, equipe, tipoEq, profId],          queryFn: () => apiGet(`/api/relatorios/por-tipo?${params}`),          enabled: aba === "tipo" });
  const qProf  = useQuery({ queryKey: ["rel-prof",  mes, ano, equipe, tipoEq],                  queryFn: () => apiGet(`/api/relatorios/por-profissional?${params}`),   enabled: aba === "profissional" });
  const qEq    = useQuery({ queryKey: ["rel-eq",    mes, ano, tipoEq],                          queryFn: () => apiGet(`/api/relatorios/por-equipe?${params}`),         enabled: aba === "equipe" });
  const qDiario= useQuery({ queryKey: ["rel-diario",mes, ano, equipe, tipoEq, grupoFiltro],     queryFn: () => apiGet(`/api/relatorios/diario?${params}`),             enabled: aba === "diario" });

  const anos = [hoje.getFullYear(), hoje.getFullYear() - 1];

  // ── FILTROS ───────────────────────────────────────────────────────────────
  const filtros = (
    <div style={{
      background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10,
      padding: "14px 18px", marginBottom: 18, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end",
    }}>
      <Filter size={14} style={{ color: "var(--muted)", marginBottom: 6 }} />
      {/* Mês */}
      <div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, fontWeight: 600 }}>MÊS</div>
        <select value={mes} onChange={e => setMes(Number(e.target.value))} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--fg)", fontSize: 13 }}>
          {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
      </div>
      {/* Ano */}
      <div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, fontWeight: 600 }}>ANO</div>
        <select value={ano} onChange={e => setAno(Number(e.target.value))} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--fg)", fontSize: 13 }}>
          {anos.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {/* Tipo Equipe */}
      <div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, fontWeight: 600 }}>TIPO EQUIPE</div>
        <select value={tipoEq} onChange={e => { setTipoEq(e.target.value); setEquipe(""); setProfId(""); }} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--fg)", fontSize: 13 }}>
          <option value="">Todas</option>
          {TIPOS_EQUIPE.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      {/* Equipe */}
      <div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, fontWeight: 600 }}>EQUIPE</div>
        <select value={equipe} onChange={e => { setEquipe(e.target.value); setProfId(""); }} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--fg)", fontSize: 13, minWidth: 150 }}>
          <option value="">Todas</option>
          {(qEquipes.data?.equipes ?? [])
            .filter((e: any) => !tipoEq || e.tipo === tipoEq)
            .map((e: any) => <option key={e.id} value={e.nome}>{e.nome}</option>)}
        </select>
      </div>
      {/* Profissional */}
      {(aba === "tipo" || aba === "diario") && (
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, fontWeight: 600 }}>PROFISSIONAL</div>
          <select value={profId} onChange={e => setProfId(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--fg)", fontSize: 13, minWidth: 220 }}>
            <option value="">Todos</option>
            {(qProfs.data?.profissionais ?? []).map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
      )}
      {/* Botão limpar */}
      <button onClick={() => { setEquipe(""); setTipoEq(""); setProfId(""); setGrupoFiltro(""); }}
        style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 12 }}>
        Limpar filtros
      </button>
    </div>
  );

  // ── ABA POR TIPO ──────────────────────────────────────────────────────────
  const abaTipo = !qTipo.data ? (
    <div style={{ color: "var(--muted)", padding: 24 }}>Carregando...</div>
  ) : (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10, marginBottom: 16 }}>
        <KPI label="Total Atendimentos" value={qTipo.data.total_atendimentos.toLocaleString("pt-BR")} sub={`${MESES[mes-1]}/${ano}`} cor="#3b82f6" />
        <KPI label="Tipos distintos"    value={qTipo.data.total_tipos}          sub="tipos de atendimento" cor="#8b5cf6" />
        <KPI label="Dias úteis"         value={qTipo.data.dias_uteis}           sub="dias com produção"    cor="#f59e0b" />
        <KPI label="Profissionais"      value={qTipo.data.profissionais_filtro} sub="no filtro"            cor="#06b6d4" />
      </div>

      {/* Botão exportar */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button onClick={() => {
          const rows = [["Grupo","Tipo","Label","Realizado","Meta","% Meta","Média/Dia","Status"]];
          qTipo.data.por_tipo.forEach((t: any) => rows.push([t.grupo, t.tipo, t.label, t.realizado, t.meta_total, t.pct_meta, t.media_dia, t.status]));
          exportarCSV(rows, `producao_tipo_${mes.toString().padStart(2,"0")}_${ano}.csv`);
        }} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
          borderRadius: 6, border: "1px solid var(--accent)", background: "transparent",
          color: "var(--accent)", cursor: "pointer", fontSize: 12, fontWeight: 600,
        }}>
          <Download size={13} /> Exportar CSV
        </button>
      </div>

      {/* Por grupo */}
      {qTipo.data.por_grupo.map((g: any) => (
        <div key={g.grupo} style={{ marginBottom: 18 }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "var(--hover)", borderRadius: "8px 8px 0 0", padding: "8px 14px",
            borderBottom: "2px solid var(--border)",
          }}>
            <span style={{ fontWeight: 800, fontSize: 13, color: "var(--fg)" }}>{g.grupo}</span>
            <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {g.total.toLocaleString("pt-BR")} atend.
            </span>
          </div>
          <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderTop: "none", borderRadius: "0 0 8px 8px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "var(--hover)" }}>
                  {["Tipo de Atendimento","Realizado","Meta Total","% Meta","Média/Dia","Status"].map(h => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700, color: "var(--muted)", fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {g.tipos.map((t: any) => (
                  <tr key={t.tipo} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "7px 10px", color: "var(--fg)", fontWeight: 600 }}>{t.label}</td>
                    <td style={{ padding: "7px 10px", fontWeight: 800, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>{t.realizado.toLocaleString("pt-BR")}</td>
                    <td style={{ padding: "7px 10px", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{t.meta_total.toLocaleString("pt-BR")}</td>
                    <td style={{ padding: "7px 10px", minWidth: 110 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Barra pct={t.pct_meta} />
                        <span style={{ fontSize: 11, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{t.pct_meta}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "7px 10px", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{t.media_dia}</td>
                    <td style={{ padding: "7px 10px" }}>{badgeStatus(t.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );

  // ── ABA POR PROFISSIONAL ──────────────────────────────────────────────────
  const [profExpandido, setProfExpandido] = useState<string | null>(null);
  const abaProf = !qProf.data ? (
    <div style={{ color: "var(--muted)", padding: 24 }}>Carregando...</div>
  ) : (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10, marginBottom: 16 }}>
        <KPI label="Profissionais"   value={qProf.data.total_profissionais} cor="#3b82f6" />
        <KPI label="Total Período"   value={qProf.data.total_atendimentos.toLocaleString("pt-BR")} sub={`${MESES[mes-1]}/${ano}`} cor="#8b5cf6" />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button onClick={() => {
          const rows = [["Nome","CBO","Equipe","Tipo","Realizado","Meta","% Meta","Média/Dia","Status"]];
          qProf.data.profissionais.forEach((p: any) => rows.push([p.nome, p.cbo, p.equipe, p.tipo, p.total_realizado, p.total_meta, p.pct_meta, p.media_dia, p.status]));
          exportarCSV(rows, `producao_profissional_${mes.toString().padStart(2,"0")}_${ano}.csv`);
        }} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:6, border:"1px solid var(--accent)", background:"transparent", color:"var(--accent)", cursor:"pointer", fontSize:12, fontWeight:600 }}>
          <Download size={13} /> Exportar CSV
        </button>
      </div>
      {qProf.data.profissionais.map((p: any, idx: number) => {
        const expanded = profExpandido === p.id;
        return (
          <div key={p.id} style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8, marginBottom: 8, borderLeft: `4px solid ${corStatus(p.status)}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", cursor: "pointer" }}
              onClick={() => setProfExpandido(expanded ? null : p.id)}>
              <span style={{ fontSize: 13, color: "var(--muted)", fontVariantNumeric: "tabular-nums", minWidth: 22 }}>{idx + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{p.nome}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{p.cbo} · {p.equipe}
                  <span style={{ marginLeft: 6, background: p.tipo === "ESB" ? "#f5f3ff" : p.tipo === "eMulti" ? "#ecfeff" : "#eff6ff", color: p.tipo === "ESB" ? "#5b21b6" : p.tipo === "eMulti" ? "#0e7490" : "#1d4ed8", borderRadius: 3, padding: "0 5px", fontSize: 10, fontWeight: 700 }}>{p.tipo}</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: corStatus(p.status), fontVariantNumeric: "tabular-nums" }}>{p.total_realizado.toLocaleString("pt-BR")}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>atend. · {p.pct_meta}% meta</div>
                </div>
                <div style={{ minWidth: 90 }}>
                  <Barra pct={p.pct_meta} />
                  <div style={{ fontSize: 10, color: "var(--muted)", textAlign: "center", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
                    Média: {p.media_dia}/dia
                  </div>
                </div>
                {badgeStatus(p.status)}
                <span style={{ color: "var(--muted)" }}>{expanded ? "▲" : "▼"}</span>
              </div>
            </div>
            {expanded && (
              <div style={{ padding: "0 14px 14px" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "var(--hover)" }}>
                        {["Tipo de Atendimento","Grupo","Realizado","Meta","% Meta"].map(h => (
                          <th key={h} style={{ padding: "5px 8px", textAlign: "left", fontWeight: 700, color: "var(--muted)", fontSize: 11 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {p.tipos_detalhe.map((t: any) => (
                        <tr key={t.tipo} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "5px 8px", fontWeight: 600 }}>{t.label}</td>
                          <td style={{ padding: "5px 8px", color: "var(--muted)", fontSize: 11 }}>{t.grupo}</td>
                          <td style={{ padding: "5px 8px", fontWeight: 700, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>{t.realizado.toLocaleString("pt-BR")}</td>
                          <td style={{ padding: "5px 8px", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{t.meta.toLocaleString("pt-BR")}</td>
                          <td style={{ padding: "5px 8px", minWidth: 100 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <Barra pct={t.pct} />
                              <span style={{ fontSize: 11, fontVariantNumeric: "tabular-nums" }}>{t.pct}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ── ABA POR EQUIPE ────────────────────────────────────────────────────────
  const [eqExpandida, setEqExpandida] = useState<string | null>(null);
  const abaEquipe = !qEq.data ? (
    <div style={{ color: "var(--muted)", padding: 24 }}>Carregando...</div>
  ) : (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10, marginBottom: 16 }}>
        <KPI label="Equipes"       value={qEq.data.total_equipes}                                  cor="#3b82f6" />
        <KPI label="Total Período" value={qEq.data.total_atendimentos.toLocaleString("pt-BR")} sub={`${MESES[mes-1]}/${ano}`} cor="#8b5cf6" />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button onClick={() => {
          const rows = [["Equipe","Tipo","UBS","Realizado","Meta","% Meta","Média/Dia","Profissionais","Status"]];
          qEq.data.equipes.forEach((e: any) => rows.push([e.nome, e.tipo, e.ubs, e.total_realizado, e.total_meta, e.pct_meta, e.media_dia, e.n_profissionais, e.status]));
          exportarCSV(rows, `producao_equipe_${mes.toString().padStart(2,"0")}_${ano}.csv`);
        }} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:6, border:"1px solid var(--accent)", background:"transparent", color:"var(--accent)", cursor:"pointer", fontSize:12, fontWeight:600 }}>
          <Download size={13} /> Exportar CSV
        </button>
      </div>
      {/* Gráfico de barras visual */}
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 14, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Comparativo de Produção — {MESES[mes-1]}/{ano}</div>
        {qEq.data.equipes.map((eq: any) => {
          const max = qEq.data.equipes[0]?.total_realizado ?? 1;
          const pct = Math.round((eq.total_realizado / max) * 100);
          return (
            <div key={eq.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{eq.nome}</span>
                  <span style={{ fontSize: 10, color: eq.tipo === "ESB" ? "#5b21b6" : eq.tipo === "eMulti" ? "#0891b2" : "#3b82f6", fontWeight: 700 }}>[{eq.tipo}]</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
                  {eq.total_realizado.toLocaleString("pt-BR")} · {eq.pct_meta}%
                </span>
              </div>
              <div style={{ background: "#e5e7eb", borderRadius: 4, height: 14, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: corStatus(eq.status), borderRadius: 4 }} />
              </div>
            </div>
          );
        })}
      </div>
      {/* Tabela detalhada */}
      {qEq.data.equipes.map((eq: any) => {
        const expanded = eqExpandida === eq.id;
        return (
          <div key={eq.id} style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8, marginBottom: 8, borderLeft: `4px solid ${corStatus(eq.status)}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer" }}
              onClick={() => setEqExpandida(expanded ? null : eq.id)}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                  {eq.nome}
                  <span style={{ marginLeft: 8, fontSize: 10, background: eq.tipo === "ESB" ? "#f5f3ff" : eq.tipo === "eMulti" ? "#ecfeff" : "#eff6ff", color: eq.tipo === "ESB" ? "#5b21b6" : eq.tipo === "eMulti" ? "#0e7490" : "#1d4ed8", borderRadius: 3, padding: "1px 6px", fontWeight: 700 }}>{eq.tipo}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{eq.ubs} · {eq.n_profissionais} profissionais</div>
              </div>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: corStatus(eq.status), fontVariantNumeric: "tabular-nums" }}>{eq.total_realizado.toLocaleString("pt-BR")}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>{eq.pct_meta}% meta · {eq.media_dia}/dia</div>
                </div>
                {badgeStatus(eq.status)}
                <span style={{ color: "var(--muted)" }}>{expanded ? "▲" : "▼"}</span>
              </div>
            </div>
            {expanded && (
              <div style={{ padding: "0 14px 14px" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "var(--hover)" }}>
                        {["Tipo de Atendimento","Grupo","Realizado","Meta","% Meta"].map(h => (
                          <th key={h} style={{ padding: "5px 8px", textAlign: "left", fontWeight: 700, color: "var(--muted)", fontSize: 11 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {eq.tipos_detalhe.map((t: any) => (
                        <tr key={t.tipo} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "5px 8px", fontWeight: 600 }}>{t.label}</td>
                          <td style={{ padding: "5px 8px", color: "var(--muted)", fontSize: 11 }}>{t.grupo}</td>
                          <td style={{ padding: "5px 8px", fontWeight: 700, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>{t.realizado.toLocaleString("pt-BR")}</td>
                          <td style={{ padding: "5px 8px", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{t.meta.toLocaleString("pt-BR")}</td>
                          <td style={{ padding: "5px 8px", minWidth: 100 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <Barra pct={t.pct} />
                              <span style={{ fontSize: 11, fontVariantNumeric: "tabular-nums" }}>{t.pct}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ── ABA DIÁRIO ────────────────────────────────────────────────────────────
  const abaDiario = !qDiario.data ? (
    <div style={{ color: "var(--muted)", padding: 24 }}>Carregando...</div>
  ) : (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10, marginBottom: 16 }}>
        <KPI label="Total Mês"   value={qDiario.data.total_mes.toLocaleString("pt-BR")} sub={`${MESES[mes-1]}/${ano}`} cor="#3b82f6" />
        <KPI label="Dias Úteis"  value={qDiario.data.dias_uteis}     sub="com produção registrada"  cor="#8b5cf6" />
        <KPI label="Média/Dia"   value={qDiario.data.media_dia}      sub="atendimentos por dia"     cor="#f59e0b" />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>Filtrar grupo:</span>
        {["","Consultas","Procedimentos","Visitas","Imunização","Rastreamento","Saúde da Mulher","Doenças Crônicas","Ações Coletivas","Triagem","Farmácia"].map(g => (
          <button key={g} onClick={() => setGrupoFiltro(g)} style={{
            padding: "4px 10px", borderRadius: 5, border: "1px solid var(--border)", cursor: "pointer", fontSize: 11,
            background: grupoFiltro === g ? "var(--accent)" : "transparent",
            color: grupoFiltro === g ? "#fff" : "var(--muted)",
          }}>{g || "Todos"}</button>
        ))}
        <button onClick={() => {
          const rows = [["Dia","Data","Dia Semana","Total","Acumulado"]];
          qDiario.data.dias.filter((d: any) => d.total != null).forEach((d: any) => rows.push([d.dia, d.data, d.dia_semana, d.total, d.acumulado]));
          exportarCSV(rows, `producao_diaria_${mes.toString().padStart(2,"0")}_${ano}.csv`);
        }} style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:5, border:"1px solid var(--accent)", background:"transparent", color:"var(--accent)", cursor:"pointer", fontSize:11 }}>
          <Download size={11} /> CSV
        </button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "var(--hover)" }}>
              {["Dia","Data","","Total Atend.","Acumulado","Top Tipos"].map(h => (
                <th key={h} style={{ padding: "7px 10px", textAlign: "left", fontWeight: 700, color: "var(--muted)", fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {qDiario.data.dias.map((d: any) => {
              const isH = d.is_hoje;
              const expanded = diaExpandido === d.dia;
              return [
                <tr key={`r-${d.dia}`}
                  style={{ borderBottom: "1px solid var(--border)", background: isH ? "#fffbeb" : !d.is_util ? "var(--hover)" : "transparent", cursor: d.total != null ? "pointer" : "default" }}
                  onClick={() => d.total != null && setDiaExpandido(expanded ? null : d.dia)}>
                  <td style={{ padding: "7px 10px", fontWeight: isH ? 800 : 600, color: isH ? "#f59e0b" : "var(--fg)", fontVariantNumeric: "tabular-nums" }}>{d.dia}</td>
                  <td style={{ padding: "7px 10px", color: "var(--muted)" }}>{d.data}</td>
                  <td style={{ padding: "7px 10px", fontSize: 11 }}>
                    {isH ? <span style={{ color:"#f59e0b", fontWeight:700 }}>HOJE</span>
                      : !d.is_util ? <span style={{ color:"var(--border)" }}>FDS</span>
                      : d.is_futuro ? <span style={{ color:"var(--border)" }}>—</span>
                      : null}
                  </td>
                  <td style={{ padding: "7px 10px", fontWeight: 800, fontSize: 14, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
                    {d.total != null ? d.total.toLocaleString("pt-BR") : "—"}
                  </td>
                  <td style={{ padding: "7px 10px", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                    {d.acumulado != null ? d.acumulado.toLocaleString("pt-BR") : "—"}
                  </td>
                  <td style={{ padding: "7px 10px" }}>
                    {d.tipos?.slice(0, 3).map((t: any) => (
                      <span key={t.tipo} style={{ background:"var(--hover)", borderRadius:4, padding:"2px 6px", fontSize:10, marginRight:4, border:"1px solid var(--border)", whiteSpace:"nowrap" }}>
                        {t.label}: {t.realizado}
                      </span>
                    ))}
                    {d.total != null && <span style={{ fontSize:11, color:"var(--muted)" }}>{expanded ? "▲" : "▼"}</span>}
                  </td>
                </tr>,
                expanded && d.tipos ? (
                  <tr key={`exp-${d.dia}`}>
                    <td colSpan={6} style={{ padding: "10px 16px", background: "var(--hover)" }}>
                      <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8 }}>📅 {d.data} ({d.dia_semana}) — Todos os tipos de atendimento</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 6 }}>
                        {d.tipos.map((t: any) => (
                          <div key={t.tipo} style={{ background: "var(--card-bg)", borderRadius: 6, padding: "6px 10px", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 600 }}>{t.label}</div>
                              <div style={{ fontSize: 10, color: "var(--muted)" }}>{t.grupo}</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontWeight: 800, color: corStatus(t.pct >= 75 ? "normal" : t.pct >= 50 ? "atencao" : "critico"), fontVariantNumeric: "tabular-nums" }}>{t.realizado}</div>
                              <div style={{ fontSize: 10, color: "var(--muted)" }}>/ {t.meta}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ) : null,
              ];
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const abaContent: Record<string, JSX.Element> = {
    tipo: abaTipo, profissional: abaProf, equipe: abaEquipe, diario: abaDiario,
  };

  return (
    <div style={{ padding: "20px 24px", fontFamily: "system-ui, sans-serif", maxWidth: 1280, margin: "0 auto" }}>
      <style>{`
        :root{--card-bg:#fff;--border:#e5e7eb;--fg:#111827;--muted:#6b7280;--accent:#3b82f6;--hover:#f9fafb;}
        @media(prefers-color-scheme:dark){:root{--card-bg:#1e2127;--border:#374151;--fg:#f9fafb;--muted:#9ca3af;--accent:#60a5fa;--hover:#252a33;}}
        :root[data-theme="dark"]{--card-bg:#1e2127;--border:#374151;--fg:#f9fafb;--muted:#9ca3af;--accent:#60a5fa;--hover:#252a33;}
        :root[data-theme="light"]{--card-bg:#fff;--border:#e5e7eb;--fg:#111827;--muted:#6b7280;--accent:#3b82f6;--hover:#f9fafb;}
        *{box-sizing:border-box;} select,button{font-family:inherit;}
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
          <FileText size={20} /> Relatórios de Produção — Apuí/AM
        </h2>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
          ESF · ESB (Odontologia) · eMulti · Todos os tipos de atendimento
        </div>
      </div>

      {filtros}

      {/* Abas */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", borderBottom: "2px solid var(--border)", marginBottom: 18 }}>
        {ABAS.map(({ key, label, Icon }) => {
          const active = aba === key;
          return (
            <button key={key} onClick={() => setAba(key)} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "8px 14px",
              border: "none", cursor: "pointer", borderRadius: "8px 8px 0 0",
              fontSize: 13, fontWeight: active ? 700 : 500,
              background: active ? "var(--accent)" : "transparent",
              color: active ? "#fff" : "var(--muted)",
              borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
            }}>
              <Icon size={14} /> {label}
            </button>
          );
        })}
      </div>

      {abaContent[aba] ?? null}
    </div>
  );
}
