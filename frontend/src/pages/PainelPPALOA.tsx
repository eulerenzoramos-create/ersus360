import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell,
} from "recharts";
import { ClipboardList, AlertTriangle, CheckCircle, TrendingUp, DollarSign } from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import { BRL, BRL_AXIS } from "../lib/fmt";

const COR_STATUS = (s: string) =>
  s === "critico" ? "#dc2626" : s === "atencao" ? "#d97706" : "#16a34a";
const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };

function KpiCard({ label, value, sub, cor, icon }: { label: string; value: string | number; sub?: string; cor: string; icon: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}22`, borderTop: `3px solid ${cor}`, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: "#6b7280" }}>{label}</span>
        <div style={{ background: `${cor}15`, borderRadius: 6, padding: 5 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: cor, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// ── LOA ───────────────────────────────────────────────────────────────────────
function AbaLOA({ loa, dash }: { loa: any[] | undefined; dash: any }) {
  if (!loa || !dash) return <NaoDisponivelBanner nota="Integração com sistema de planejamento orçamentário ainda não configurada no Railway. Nenhum valor de LOA ou PPA foi inventado." />;
  const barData = loa.map(p => ({
    programa: p.programa.split(" ").slice(0, 3).join(" "),
    Dotação:  p.dotacao,
    Empenhado:p.empenhado,
    Pago:     p.pago,
    status:   p.status,
  }));

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 22 }}>
        <KpiCard label="Dotação total 2026"   value={BRL(dash.total_dotacao)}  sub={`${dash.n_programas} programas`} cor="#1d4ed8" icon={<DollarSign size={14} color="#1d4ed8"/>} />
        <KpiCard label="Empenhado"            value={BRL(dash.total_empenhado)} sub={`${dash.pct_execucao}%`}        cor="#7c3aed" icon={<TrendingUp size={14} color="#7c3aed"/>} />
        <KpiCard label="Pago"                 value={BRL(dash.total_pago)}      sub={`${dash.pct_pago}%`}            cor="#16a34a" icon={<CheckCircle size={14} color="#16a34a"/>} />
        <KpiCard label="Saldo disponível"     value={BRL(dash.total_saldo)}     sub="não empenhado"                  cor="#0891b2" icon={<DollarSign size={14} color="#0891b2"/>} />
        <KpiCard label="SIOPS rec. próprios"  value={`${dash.siops_atual}%`}     sub={`meta ≥ ${dash.siops_meta}%`}  cor={dash.siops_conforme ? "#16a34a" : "#dc2626"} icon={<CheckCircle size={14} color={dash.siops_conforme ? "#16a34a" : "#dc2626"}/>} />
      </div>

      {/* Gráfico */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Dotação × Empenhado × Pago por programa</div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} barGap={3} barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="programa" tick={{ fontSize: 8 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} width={90} tickFormatter={BRL_AXIS} />
              <Tooltip contentStyle={TT} formatter={(v: number, name) => [BRL(v), name as string]} />
              <Bar dataKey="Dotação"   fill="#dbeafe" radius={[3,3,0,0]} />
              <Bar dataKey="Empenhado" fill="#7c3aed" radius={[3,3,0,0]} />
              <Bar dataKey="Pago"      fill="#16a34a" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela programas */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#1d4ed8", color: "#fff" }}>
              <th style={{ padding: "9px 14px", textAlign: "left" }}>Programa</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Dotação</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Empenhado</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Pago</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Saldo</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>% Pago</th>
              <th style={{ padding: "9px 10px", textAlign: "left" }}>Meta física</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loa.map((p, i) => (
              <tr key={p.id} style={{ borderTop: "1px solid #f3f4f6", background: p.status === "critico" ? "#fff7f7" : i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                <td style={{ padding: "9px 14px", fontWeight: 600 }}>{p.programa}</td>
                <td style={{ padding: "9px 10px", textAlign: "right" }}>{BRL(p.dotacao)}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", color: "#7c3aed" }}>{BRL(p.empenhado)}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", color: "#16a34a", fontWeight: 700 }}>{BRL(p.pago)}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", color: "#6b7280" }}>{BRL(p.saldo)}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 700, color: COR_STATUS(p.pct_pago < 30 ? "critico" : p.pct_pago < 60 ? "atencao" : "ok") }}>{p.pct_pago}%</td>
                <td style={{ padding: "9px 10px", fontSize: 11, color: "#6b7280" }}>{p.meta_fisica}</td>
                <td style={{ padding: "9px 10px", textAlign: "center" }}>
                  <span style={{ background: p.status === "critico" ? "#fff7f7" : "#f0fdf4", color: COR_STATUS(p.status), fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>
                    {p.status === "critico" ? "Crítico" : "Em execução"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── LDO Metas ─────────────────────────────────────────────────────────────────
function AbaLDO({ metas }: { metas: any[] | undefined }) {
  if (!metas) return null;
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1d4ed8", margin: "0 0 4px" }}>LDO — Metas e Prioridades 2026</h2>
        <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Acompanhamento dos indicadores da Lei de Diretrizes Orçamentárias</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {metas.map((m, i) => {
          const cor = COR_STATUS(m.status);
          const pct = Math.min((m.realizado / m.meta_ldo) * 100, 100);
          return (
            <div key={i} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{m.indicador}</span>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>meta: {m.meta_ldo}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: cor }}>{m.realizado}</span>
                  <span style={{ background: cor + "15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>
                    {m.status === "critico" ? "⚠ Crítico" : m.status === "atencao" ? "~ Atenção" : "✓ OK"}
                  </span>
                </div>
              </div>
              <div style={{ height: 6, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: cor, borderRadius: 4 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SIOPS Bimestral (RREO) ────────────────────────────────────────────────────
const COR_BIM = (s: string) =>
  s === "atingido" ? "#16a34a" : s === "parcial" ? "#d97706" : s === "pendente" ? "#dc2626" : "#9ca3af";
const LABEL_BIM: Record<string, string> = {
  atingido: "✓ Atingido", parcial: "⏳ Em andamento", pendente: "⚠ Abaixo do mínimo", previsto: "— Previsto",
};

function AbaSIOPS({ historico, bimestral }: { historico: any[] | undefined; bimestral: any }) {
  const [subAba, setSubAba] = useState<"bimestral" | "historico">("bimestral");

  if (!bimestral && !historico) return null;

  const bims: any[] = bimestral?.bimestres ?? [];
  const acum = bimestral?.acumulado;
  const loaBim: Record<string, (number | null)[]> = bimestral?.loa_bimestral ?? {};
  const bimLabels = ["1ºBim","2ºBim","3ºBim","4ºBim","5ºBim","6ºBim"];

  // Dados para gráfico % próprio por bimestre
  const chartPct = bims.map((b, i) => ({
    label: bimLabels[i],
    pct: b.pct_proprio,
    meta: 15,
    status: b.status,
  })).filter(b => b.pct !== null);

  // Dados para gráfico execução LOA acumulada
  const chartExec = bims.map((b, i) => ({
    label: bimLabels[i],
    empenhado: b.empenhado_acum,
    pago: b.pago_acum,
    dotacao: b.dotacao_atualizada,
  })).filter(b => b.empenhado !== null);

  return (
    <div>
      {/* Sub-abas */}
      <div style={{ display: "flex", gap: 2, marginBottom: 20, borderBottom: "2px solid #e4e7ec" }}>
        {[["bimestral","RREO — Execução Bimestral 2026"],["historico","Histórico Anual SIOPS"]].map(([id, label]) => (
          <button key={id} onClick={() => setSubAba(id as any)}
            style={{ padding: "8px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 13,
              borderBottom: subAba === id ? "2px solid #0891b2" : "2px solid transparent",
              color: subAba === id ? "#0891b2" : "#6b7280",
              fontWeight: subAba === id ? 700 : 400, marginBottom: -2 }}>
            {label}
          </button>
        ))}
      </div>

      {subAba === "bimestral" && (
        <div>
          {/* Acumulado banner */}
          {acum && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
              <KpiCard label="Receita acumulada (1º–3º Bim)" value={BRL(acum.receita_arrecadada)} sub="encerrados" cor="#1d4ed8" icon={<DollarSign size={14} color="#1d4ed8"/>} />
              <KpiCard label="Gasto próprio saúde acum." value={BRL(acum.gasto_proprio)} sub="recursos próprios" cor="#7c3aed" icon={<TrendingUp size={14} color="#7c3aed"/>} />
              <KpiCard label="% Próprio acumulado" value={`${acum.pct_proprio_acum}%`} sub={acum.status === "atingido" ? "✓ Meta ≥ 15% atingida" : "⚠ Abaixo do mínimo"} cor={acum.status === "atingido" ? "#16a34a" : "#dc2626"} icon={<CheckCircle size={14} color={acum.status === "atingido" ? "#16a34a" : "#dc2626"}/>} />
            </div>
          )}

          {/* Gráfico % próprio bimestral */}
          <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:18, marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>
              % de Recursos Próprios Aplicados em Saúde — por Bimestre (meta ≥ 15%)
            </div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartPct} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 24]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={TT} formatter={(v: number, name) => [`${v}%`, name as string]} />
                  <Bar dataKey="pct" name="% Próprio" radius={[4,4,0,0]}>
                    {chartPct.map((b, i) => <Cell key={i} fill={COR_BIM(b.status)} />)}
                  </Bar>
                  <Line type="monotone" dataKey="meta" stroke="#dc2626" strokeWidth={2} strokeDasharray="5 3" dot={false} name="Meta 15%" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico execução LOA acumulada */}
          <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:18, marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>Execução LOA — Empenhado × Pago Acumulado por Bimestre</div>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartExec} barGap={4} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} width={90} tickFormatter={BRL_AXIS} />
                  <Tooltip contentStyle={TT} formatter={(v: number, name) => [BRL(v), name as string]} />
                  <Bar dataKey="empenhado" name="Empenhado" fill="#7c3aed" radius={[3,3,0,0]} />
                  <Bar dataKey="pago"      name="Pago/Liquidado" fill="#16a34a" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cartões bimestrais */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
            {bims.map((b, i) => {
              const cor = COR_BIM(b.status);
              const isPrev = b.status === "previsto";
              return (
                <div key={i} style={{ background:"#fff", border:`1px solid ${cor}40`, borderTop:`3px solid ${cor}`, borderRadius:10, padding:"14px 16px", opacity: isPrev ? 0.55 : 1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:800, color:"#111827" }}>{b.bimestre}</div>
                      <div style={{ fontSize:10, color:"#9ca3af" }}>{b.periodo}</div>
                    </div>
                    <span style={{ background:`${cor}15`, color:cor, fontSize:9, fontWeight:700, padding:"3px 8px", borderRadius:12 }}>
                      {LABEL_BIM[b.status]}
                    </span>
                  </div>
                  {!isPrev ? (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                      <div style={{ background:"#f9fafb", borderRadius:6, padding:"6px 8px" }}>
                        <div style={{ fontSize:9, color:"#9ca3af" }}>Receita impostos</div>
                        <div style={{ fontSize:12, fontWeight:700 }}>{b.receita_arrecadada ? BRL(b.receita_arrecadada) : "—"}</div>
                      </div>
                      <div style={{ background:"#f9fafb", borderRadius:6, padding:"6px 8px" }}>
                        <div style={{ fontSize:9, color:"#9ca3af" }}>Gasto próprio saúde</div>
                        <div style={{ fontSize:12, fontWeight:700 }}>{b.gasto_proprio_saude ? BRL(b.gasto_proprio_saude) : "—"}</div>
                      </div>
                      <div style={{ background:`${cor}12`, borderRadius:6, padding:"6px 8px" }}>
                        <div style={{ fontSize:9, color:"#9ca3af" }}>% Próprio</div>
                        <div style={{ fontSize:16, fontWeight:800, color:cor }}>{b.pct_proprio != null ? `${b.pct_proprio}%` : "—"}</div>
                      </div>
                      <div style={{ background:"#f9fafb", borderRadius:6, padding:"6px 8px" }}>
                        <div style={{ fontSize:9, color:"#9ca3af" }}>Exec. LOA</div>
                        <div style={{ fontSize:14, fontWeight:700, color:"#7c3aed" }}>{b.pct_exec != null ? `${b.pct_exec}%` : "—"}</div>
                      </div>
                      {b.empenhado_acum != null && (
                        <>
                          <div style={{ background:"#f9fafb", borderRadius:6, padding:"6px 8px" }}>
                            <div style={{ fontSize:9, color:"#9ca3af" }}>Empenhado acum.</div>
                            <div style={{ fontSize:11, fontWeight:700, color:"#7c3aed" }}>{BRL(b.empenhado_acum)}</div>
                          </div>
                          <div style={{ background:"#f9fafb", borderRadius:6, padding:"6px 8px" }}>
                            <div style={{ fontSize:9, color:"#9ca3af" }}>Pago acum.</div>
                            <div style={{ fontSize:11, fontWeight:700, color:"#16a34a" }}>{BRL(b.pago_acum)}</div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign:"center", padding:"12px 0", color:"#9ca3af", fontSize:11 }}>
                      Previsão: {BRL(b.receita_previsao)}<br/>Bimestre não iniciado
                    </div>
                  )}
                  {b.alerta && (
                    <div style={{ marginTop:8, fontSize:10, color: b.status==="pendente" ? "#dc2626" : "#d97706", background: b.status==="pendente" ? "#fef2f2" : "#fffbeb", borderRadius:6, padding:"5px 8px" }}>
                      <AlertTriangle size={10} style={{ display:"inline", marginRight:4 }} />
                      {b.alerta}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tabela RREO LOA por programa */}
          <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:18 }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>LOA — Empenhado Acumulado por Programa × Bimestre</div>
            <div style={{ overflowX:"auto" as const }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11, minWidth:700 }}>
                <thead>
                  <tr style={{ background:"#1d4ed8", color:"#fff" }}>
                    <th style={{ padding:"8px 12px", textAlign:"left", whiteSpace:"nowrap" as const }}>Programa</th>
                    {bimLabels.map(l => <th key={l} style={{ padding:"8px 10px", textAlign:"right", whiteSpace:"nowrap" as const }}>{l}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(loaBim).map(([prog, vals], i) => (
                    <tr key={prog} style={{ borderTop:"1px solid #f3f4f6", background: i%2===0 ? "#fff" : "#f9fafb" }}>
                      <td style={{ padding:"7px 12px", fontWeight:600 }}>{prog}</td>
                      {(vals as (number|null)[]).map((v, j) => (
                        <td key={j} style={{ padding:"7px 10px", textAlign:"right",
                          color: v == null ? "#d1d5db" : "#374151",
                          fontStyle: v == null ? "italic" : "normal" }}>
                          {v != null ? BRL(v) : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {subAba === "historico" && historico && (
        <div>
          <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, padding:"12px 16px", marginBottom:20, display:"flex", gap:10, alignItems:"center" }}>
            <CheckCircle size={16} color="#16a34a" />
            <span style={{ fontSize:13, color:"#166534" }}>
              Apuí/AM está <strong>conforme</strong> em todos os anos do PPA. Ano 2026 projetado: <strong>17,16%</strong> (meta ≥ 15%).
            </span>
          </div>
          <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:18 }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>Histórico — Recursos Próprios em Saúde (%)</div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historico} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 22]} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={TT} formatter={(v: number) => [`${v}%`, "Aplicado"]} />
                  <Bar dataKey="pct_proprio" name="Aplicado (%)" radius={[4,4,0,0]}>
                    {historico.map((h, i) => <Cell key={i} fill={h.conforme ? "#16a34a" : "#dc2626"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop:12, display:"flex", flexWrap:"wrap" as const, gap:8 }}>
              {historico.map(h => (
                <div key={h.ano} style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:12, background:"#f0fdf4", padding:"4px 10px", borderRadius:20 }}>
                  <CheckCircle size={11} color="#16a34a" />
                  <span>{h.ano}: <strong>{h.pct_proprio}%</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type Aba = "loa" | "ldo" | "siops";

export default function PainelPPALOA() {
  const [aba, setAba] = useState<Aba>("loa");
  const { data: dash }      = useQuery({ queryKey: ["ppa-dashboard"], queryFn: () => apiGet("/api/planejamento-orc/dashboard") as Promise<any> });
  const { data: loa }       = useQuery({ queryKey: ["ppa-loa"],       queryFn: () => apiGet("/api/planejamento-orc/loa") as Promise<any[]> });
  const { data: metas }     = useQuery({ queryKey: ["ppa-ldo"],       queryFn: () => apiGet("/api/planejamento-orc/ldo-metas") as Promise<any[]>, enabled: aba === "ldo" });
  const { data: siopsHist } = useQuery({ queryKey: ["ppa-siops"],     queryFn: () => apiGet("/api/planejamento-orc/siops-historico") as Promise<any[]>, enabled: aba === "siops" });
  const { data: siopsBim }  = useQuery({ queryKey: ["ppa-siops-bim"], queryFn: () => apiGet("/api/planejamento-orc/siops-bimestral") as Promise<any>, enabled: aba === "siops" });

  const ABAS: { id: Aba; label: string }[] = [
    { id: "loa",   label: "LOA — Execução Orçamentária" },
    { id: "ldo",   label: "LDO — Metas e Indicadores" },
    { id: "siops", label: "SIOPS — Recursos Próprios" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>PPA / LDO / LOA — Planejamento Orçamentário</h1>
            <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>Lei 4.320/64 · FMS Apuí/AM · Exercício 2026</p>
          </div>
          {dash && (
            <div style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{BRL(dash.total_dotacao)}</div>
              <div style={{ fontSize: 10, opacity: 0.8 }}>dotação total 2026</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e4e7ec" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{
              padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13,
              borderBottom: aba === a.id ? "2px solid #0891b2" : "2px solid transparent",
              color: aba === a.id ? "#0891b2" : "#6b7280",
              fontWeight: aba === a.id ? 700 : 400, marginBottom: -2,
            }}>{a.label}</button>
          ))}
        </div>
        {aba === "loa"   && <AbaLOA loa={loa} dash={dash} />}
        {aba === "ldo"   && <AbaLDO metas={metas} />}
        {aba === "siops" && <AbaSIOPS historico={siopsHist} bimestral={siopsBim} />}
      </div>
    </div>
  );
}
