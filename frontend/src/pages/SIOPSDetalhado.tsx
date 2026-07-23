import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  Landmark, DollarSign, AlertTriangle, BarChart3, Activity,
  ArrowDownUp, ClipboardList, Layers,
} from "lucide-react";

const BRL  = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const BRLK = (v: number) => {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `R$${(v / 1_000).toFixed(0)}K`;
  return BRL(v);
};
const PCT = (v: number) => `${v.toFixed(1)}%`;

const BRAND  = "#1e3a5f";
const ACCENT = "#1d4ed8";
const OK     = "#16a34a";
const WARN   = "#d97706";
const CRIT   = "#dc2626";
const BLOCOS = ["#1d4ed8","#0891b2","#7c3aed","#16a34a","#d97706"];

function sc(s: string) {
  if (s === "ok") return OK;
  if (s === "atencao") return WARN;
  return CRIT;
}

/* ── Card KPI ─────────────────────────────────────────────────────────────── */
const KPI = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
  <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,.07)" }}>
    <p style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{label}</p>
    <p style={{ fontSize: 22, fontWeight: 700, color: color || BRAND, margin: "4px 0 0" }}>{value}</p>
    {sub && <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>{sub}</p>}
  </div>
);

/* ── Grid helpers ─────────────────────────────────────────────────────────── */
const Grid4 = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>{children}</div>
);
const Grid3 = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>{children}</div>
);
const Grid2 = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>{children}</div>
);

const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.07)", ...style }}>{children}</div>
);

const InfoBox = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <div style={{ background: `${color}12`, border: `1px solid ${color}33`, borderRadius: 12, padding: 16, fontSize: 13, color, display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
);

const BarOrc = ({ label, val, max, color }: { label: string; val: number; max: number; color: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
    <span style={{ width: 80, color: "#64748b", flexShrink: 0 }}>{label}</span>
    <div style={{ flex: 1, background: "#f1f5f9", borderRadius: 9999, height: 8 }}>
      <div style={{ width: `${Math.min((val / max) * 100, 100)}%`, height: 8, borderRadius: 9999, background: color }} />
    </div>
    <span style={{ width: 96, textAlign: "right", fontWeight: 600, color: "#334155" }}>{BRLK(val)}</span>
    <span style={{ width: 40, textAlign: "right", color: "#94a3b8" }}>{PCT((val / max) * 100)}</span>
  </div>
);

const BLOCO_LABEL: Record<string, string> = { AB: "Atenção Básica", MAC: "MAC", VIG: "Vigilância", FARM: "Farmácia" };

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function SIOPSDetalhado() {
  const [aba, setAba]             = useState("dashboard");
  const [filtroBloco, setFiltro]  = useState("TODOS");

  const { data: dash }    = useQuery({ queryKey: ["siops-dash"],   queryFn: () => apiGet("/api/siops-detalhado/dashboard"),              enabled: aba === "dashboard" });
  const { data: blocos }  = useQuery({ queryKey: ["siops-blocos"], queryFn: () => apiGet("/api/siops-detalhado/blocos"),                  enabled: aba === "blocos" });
  const { data: ec29 }    = useQuery({ queryKey: ["siops-ec29"],   queryFn: () => apiGet("/api/siops-detalhado/ec29"),                    enabled: aba === "ec29" });
  const { data: hist }    = useQuery({ queryKey: ["siops-hist"],   queryFn: () => apiGet("/api/siops-detalhado/historico"),               enabled: aba === "historico" });
  const { data: ind }     = useQuery({ queryKey: ["siops-ind"],    queryFn: () => apiGet("/api/siops-detalhado/indicadores"),             enabled: aba === "indicadores" });
  const { data: transf }  = useQuery({ queryKey: ["siops-transf"], queryFn: () => apiGet("/api/siops-detalhado/transferencias"),          enabled: aba === "transferencias" });
  const { data: orcam }   = useQuery({ queryKey: ["siops-orcam"],  queryFn: () => apiGet("/api/siops-detalhado/execucao-orcamentaria"),   enabled: aba === "orcamento" });
  const { data: natData } = useQuery({ queryKey: ["siops-nat"],    queryFn: () => apiGet("/api/siops-detalhado/despesa-natureza"),        enabled: aba === "natureza" });
  const { data: rfData }  = useQuery({ queryKey: ["siops-rf"],     queryFn: () => apiGet("/api/siops-detalhado/receita-despesa"),         enabled: aba === "receita" });

  const d = dash as any;

  const ABAS = [
    { key: "dashboard",      label: "Dashboard",          icon: <Landmark size={13}/> },
    { key: "blocos",         label: "Blocos",             icon: <BarChart3 size={13}/> },
    { key: "transferencias", label: "Transferências",     icon: <ArrowDownUp size={13}/> },
    { key: "orcamento",      label: "Exec. Orçamentária", icon: <ClipboardList size={13}/> },
    { key: "natureza",       label: "Natureza Despesa",   icon: <Layers size={13}/> },
    { key: "ec29",           label: "EC-29",              icon: <DollarSign size={13}/> },
    { key: "receita",        label: "Receita vs Despesa", icon: <Activity size={13}/> },
    { key: "indicadores",    label: "Indicadores",        icon: <AlertTriangle size={13}/> },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Cabeçalho */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ padding: 8, borderRadius: 10, background: BRAND }}>
            <Landmark size={22} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: BRAND, margin: 0 }}>SIOPS Detalhado</h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
              Vinculação EC-29 · Blocos · Transferências FNS/FES · Execução Orçamentária · FMS Apuí/AM
            </p>
          </div>
        </div>

        {/* Abas */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {ABAS.map((a) => (
            <button key={a.key} onClick={() => setAba(a.key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer",
                border: aba === a.key ? "none" : "1px solid #e2e8f0",
                background: aba === a.key ? BRAND : "#fff",
                color: aba === a.key ? "#fff" : "#475569",
              }}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>

        {/* ── DASHBOARD ── */}
        {aba === "dashboard" && d && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Grid4>
              <KPI label="EC-29 Aplicado"       value={PCT(d.aplicacao_saude_pct)}    sub={`Meta: ${d.vinculacao_minima_ec29_pct}%`} color={OK} />
              <KPI label="Superávit EC-29"       value={BRLK(d.superavit_ec29_valor)} sub={`+${d.superavit_ec29_pct} p.p. acima`}    color={OK} />
              <KPI label="MAC Executado"         value={PCT(d.mac_executado_pct)}      sub={BRLK(d.mac_executado_valor)}               color={WARN} />
              <KPI label="Teto MAC Anual"        value={BRLK(d.teto_mac_anual)}        sub={d.competencia} />
            </Grid4>
            <Grid4>
              <KPI label="Total Transferências"  value={BRLK(d.total_transferencias_recebidas)} sub="FNS + FES recebidos"  color={ACCENT} />
              <KPI label="Recursos Próprios"     value={BRLK(d.total_recursos_proprios)}         sub="Tesouro municipal"    color={BRAND} />
              <KPI label="Despesa Total Saúde"   value={BRLK(d.total_despesa_saude)}             sub="Empenhado acumulado"  color={BRAND} />
              <KPI label="Despesa/Hab./Ano"      value="R$ 668" sub="Meta: R$600 — acima"        color={OK} />
            </Grid4>

            <Card>
              <p style={{ fontWeight: 600, color: "#334155", marginBottom: 16, fontSize: 14 }}>Distribuição por Bloco de Financiamento</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                {[
                  { label: "Atenção Básica", pct: d.bloco_atencao_basica_pct },
                  { label: "MAC",            pct: d.bloco_mac_pct },
                  { label: "Vigilância",     pct: d.bloco_vigilancia_pct },
                  { label: "Assist. Farm.",  pct: d.bloco_assistencia_farm_pct },
                  { label: "Gestão",         pct: d.bloco_gestao_pct },
                ].map((b, i) => (
                  <div key={b.label} style={{ textAlign: "center", padding: 12, borderRadius: 8, background: `${BLOCOS[i]}14` }}>
                    <p style={{ fontSize: 22, fontWeight: 700, color: BLOCOS[i], margin: 0 }}>{b.pct}%</p>
                    <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 0" }}>{b.label}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Grid3>
              <InfoBox color="#16a34a"><p><b>EC-29 superado em 4,8 p.p.</b> — Apuí aplica 19,8% da receita de impostos em saúde. O superávit de R$895.920 representa margem real de custeio.</p></InfoBox>
              <InfoBox color="#d97706"><p><b>MAC com 25,8% de saldo</b> — R$1.105.272 disponíveis. Risco de devolução ao FNS se não houver aceleração no 2º trimestre.</p></InfoBox>
              <InfoBox color="#1d4ed8"><p><b>34,3% de recursos próprios</b> — R$2,87M de tesouro municipal. Acima da média AM para municípios de porte similar (28,4%).</p></InfoBox>
            </Grid3>
          </div>
        )}

        {/* ── BLOCOS ── */}
        {aba === "blocos" && Array.isArray(blocos) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card>
              <p style={{ fontWeight: 600, color: "#334155", marginBottom: 16, fontSize: 14 }}>Execução por Bloco (R$) — Federal · Estadual · Municipal</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={blocos as any[]} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="bloco" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => BRL(v)} />
                  <Legend />
                  <Bar dataKey="federal"   name="Federal"   fill="#1d4ed8" radius={[3,3,0,0]} />
                  <Bar dataKey="estadual"  name="Estadual"  fill="#0891b2" radius={[3,3,0,0]} />
                  <Bar dataKey="municipal" name="Municipal" fill="#7c3aed" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            {(blocos as any[]).map((b: any, i: number) => (
              <Card key={b.bloco}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontWeight: 600, color: "#334155" }}>{b.bloco}</span>
                  <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
                    <span style={{ color: "#64748b" }}>Total: <b>{BRLK(b.total)}</b></span>
                    <span style={{ fontWeight: 700, color: BLOCOS[i] }}>{b.pct_exec}% executado</span>
                  </div>
                </div>
                <div style={{ background: "#f1f5f9", borderRadius: 9999, height: 8, marginBottom: 12 }}>
                  <div style={{ width: `${b.pct_exec}%`, height: 8, borderRadius: 9999, background: BLOCOS[i] }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, fontSize: 12 }}>
                  {[["Federal",BRLK(b.federal),"#dbeafe","#1d4ed8"],["Estadual",BRLK(b.estadual),"#e0f2fe","#0891b2"],["Municipal",BRLK(b.municipal),"#ede9fe","#7c3aed"],["Executado",BRLK(b.executado),"#dcfce7","#16a34a"]].map(([lbl,val,bg,fg]) => (
                    <div key={lbl} style={{ background: bg, borderRadius: 6, padding: 8, textAlign: "center" }}>
                      <p style={{ color: "#64748b", margin: 0, fontSize: 10 }}>{lbl}</p>
                      <p style={{ fontWeight: 700, color: fg, margin: "2px 0 0" }}>{val}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── TRANSFERÊNCIAS ── */}
        {aba === "transferencias" && Array.isArray(transf) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["TODOS","AB","MAC","VIG","FARM"].map((b) => (
                <button key={b} onClick={() => setFiltro(b)}
                  style={{ padding: "4px 12px", borderRadius: 9999, fontSize: 12, fontWeight: 500, cursor: "pointer",
                    background: filtroBloco === b ? BRAND : "#fff",
                    color: filtroBloco === b ? "#fff" : "#475569",
                    border: filtroBloco === b ? `1px solid ${BRAND}` : "1px solid #e2e8f0" }}>
                  {b === "TODOS" ? "Todos" : BLOCO_LABEL[b] || b}
                </button>
              ))}
            </div>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: BRAND, color: "#fff" }}>
                      {["Programa / Incentivo","Bloco","Fonte","Previsto/Ano","Recebido","Exec. %","Observação"].map((h) => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(transf as any[]).filter((t: any) => filtroBloco === "TODOS" || t.bloco === filtroBloco).map((t: any, i: number) => (
                      <tr key={t.programa} style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff" }}>
                        <td style={{ padding: "9px 12px", fontWeight: 500, color: "#334155" }}>{t.programa}</td>
                        <td style={{ padding: "9px 12px" }}><span style={{ background: "#f1f5f9", color: "#475569", padding: "2px 6px", borderRadius: 4 }}>{t.bloco}</span></td>
                        <td style={{ padding: "9px 12px" }}><span style={{ background: t.fonte === "FNS" ? "#dbeafe" : "#e0f2fe", color: t.fonte === "FNS" ? "#1d4ed8" : "#0891b2", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>{t.fonte}</span></td>
                        <td style={{ padding: "9px 12px", textAlign: "right" }}>{t.valor_anual > 0 ? BRLK(t.valor_anual) : "—"}</td>
                        <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 600 }}>{t.valor_recebido > 0 ? BRLK(t.valor_recebido) : "—"}</td>
                        <td style={{ padding: "9px 12px", textAlign: "center", fontWeight: 700, color: sc(t.status) }}>{t.valor_anual > 0 ? `${t.pct_exec}%` : "—"}</td>
                        <td style={{ padding: "9px 12px", color: "#94a3b8", maxWidth: 240 }}>{t.obs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── EXECUÇÃO ORÇAMENTÁRIA ── */}
        {aba === "orcamento" && Array.isArray(orcam) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#1e40af" }}>
              <b>Pipeline:</b> Dotação Atual → Empenhado → Liquidado → Pago · Saldo a empenhar antes do encerramento do exercício.
            </div>
            {(orcam as any[]).map((a: any) => (
              <Card key={a.acao}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <p style={{ fontWeight: 600, color: "#334155", fontSize: 14, margin: 0 }}>{a.acao}</p>
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>Função: {a.funcao}</p>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 12 }}>
                    <p style={{ color: "#94a3b8", margin: 0 }}>Dotação atual</p>
                    <p style={{ fontWeight: 700, color: "#334155", margin: "2px 0 0" }}>{BRLK(a.dotacao_atual)}</p>
                    {a.creditos_adic > 0 && <p style={{ color: OK, fontSize: 11, margin: 0 }}>+{BRLK(a.creditos_adic)} créditos ad.</p>}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <BarOrc label="Empenhado"  val={a.empenhado}  max={a.dotacao_atual} color={ACCENT} />
                  <BarOrc label="Liquidado"  val={a.liquidado}  max={a.dotacao_atual} color="#0891b2" />
                  <BarOrc label="Pago"       val={a.pago}       max={a.dotacao_atual} color={OK} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12 }}>
                  <span style={{ color: "#64748b" }}>A empenhar: <b style={{ color: "#334155" }}>{BRLK(a.a_empenhar)}</b></span>
                  <span style={{ padding: "2px 10px", borderRadius: 9999, fontWeight: 600, fontSize: 11, background: `${sc(a.status)}22`, color: sc(a.status) }}>
                    {a.status === "ok" ? "Regular" : a.status === "atencao" ? "Atenção" : "Crítico"}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── NATUREZA DA DESPESA ── */}
        {aba === "natureza" && natData && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Grid2>
              <Card>
                <p style={{ fontWeight: 600, color: "#334155", marginBottom: 12, fontSize: 14 }}>Despesa por Natureza — Empenhado</p>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={(natData as any).resumo} dataKey="empenhado" nameKey="natureza" cx="50%" cy="50%" outerRadius={85}>
                      {((natData as any).resumo as any[]).map((n: any) => <Cell key={n.natureza} fill={n.cor} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => BRLK(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
              <Card>
                <p style={{ fontWeight: 600, color: "#334155", marginBottom: 12, fontSize: 14 }}>Dotação vs Empenhado</p>
                {((natData as any).resumo as any[]).map((n: any) => (
                  <div key={n.natureza} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                      <span style={{ color: "#475569", fontWeight: 500 }}>{n.natureza}</span>
                      <span style={{ fontWeight: 700, color: n.cor }}>{BRLK(n.empenhado)}</span>
                    </div>
                    <div style={{ background: "#f1f5f9", borderRadius: 9999, height: 6 }}>
                      <div style={{ width: `${Math.min((n.empenhado / n.dotacao) * 100, 100)}%`, height: 6, borderRadius: 9999, background: n.cor }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", marginTop: 1 }}>
                      <span>Dotação: {BRLK(n.dotacao)}</span>
                      <span>{PCT((n.empenhado / n.dotacao) * 100)} exec.</span>
                    </div>
                  </div>
                ))}
              </Card>
            </Grid2>
            <Card>
              <p style={{ fontWeight: 600, color: "#334155", marginBottom: 12, fontSize: 14 }}>Evolução Mensal por Natureza (R$)</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={(natData as any).mensal} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => BRLK(v)} />
                  <Legend />
                  <Bar dataKey="pessoal"      name="Pessoal"           fill="#1e3a5f" stackId="a" />
                  <Bar dataKey="custeio"      name="Custeio/Serviços"  fill="#1d4ed8" stackId="a" />
                  <Bar dataKey="farmacia"     name="Mat. Farmacol."    fill="#7c3aed" stackId="a" />
                  <Bar dataKey="investimento" name="Investimento"      fill="#dc2626" stackId="a" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* ── EC-29 ── */}
        {aba === "ec29" && ec29 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Grid3>
              <KPI label="Receita Base" value={BRLK((ec29 as any).receita_base)} />
              <KPI label="Mínimo EC-29 (15%)" value={BRL((ec29 as any).minimo_legal_valor)} />
              <KPI label="Aplicado" value={PCT((ec29 as any).aplicado_pct)} sub={BRL((ec29 as any).aplicado_valor)} color={OK} />
              <KPI label="Superávit" value={`${(ec29 as any).superavit_pct} p.p.`} sub={BRL((ec29 as any).superavit_valor)} color={OK} />
            </Grid3>
            <Card>
              <p style={{ fontWeight: 600, color: "#334155", marginBottom: 12, fontSize: 14 }}>Série Histórica EC-29 (2021–2026)</p>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={(ec29 as any).serie_historica} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="pct" domain={[12, 22]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="val" orientation="right" tickFormatter={(v) => `${(v/1_000_000).toFixed(1)}M`} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine yAxisId="pct" y={15} stroke={CRIT} strokeDasharray="4 4" label={{ value: "Mín. 15%", position: "insideRight", fontSize: 10 }} />
                  <Line yAxisId="pct" dataKey="aplicado_pct"   name="EC-29 %"         stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                  <Line yAxisId="val" dataKey="aplicado_valor" name="Valor (R$)"       stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* ── RECEITA VS DESPESA ── */}
        {aba === "receita" && Array.isArray(rfData) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card>
              <p style={{ fontWeight: 600, color: "#334155", marginBottom: 12, fontSize: 14 }}>Receita Arrecadada vs Despesa Realizada (últimos 6 meses)</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={rfData as any[]} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => BRLK(v)} />
                  <Legend />
                  <Bar dataKey="receita_propria"  name="Receita Própria"   fill="#7c3aed" radius={[3,3,0,0]} />
                  <Bar dataKey="transferencias"   name="Transferências"    fill="#1d4ed8" radius={[3,3,0,0]} />
                  <Bar dataKey="despesa_saude"    name="Despesa Saúde"     fill="#0891b2" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            {(rfData as any[]).map((r: any) => (
              <div key={r.mes} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16, fontSize: 13 }}>
                <span style={{ fontWeight: 600, color: "#64748b", width: 60, flexShrink: 0 }}>{r.mes}</span>
                <span style={{ color: "#7c3aed" }}>Própria: <b>{BRLK(r.receita_propria)}</b></span>
                <span style={{ color: "#1d4ed8" }}>Transf.: <b>{BRLK(r.transferencias)}</b></span>
                <span style={{ color: "#0891b2" }}>Total: <b>{BRLK(r.total_receita)}</b></span>
                <span style={{ color: "#334155" }}>Despesa: <b>{BRLK(r.despesa_saude)}</b></span>
                <span style={{ marginLeft: "auto", fontWeight: 700, color: r.saldo >= 0 ? OK : CRIT }}>
                  {r.saldo >= 0 ? "+" : ""}{BRLK(r.saldo)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── INDICADORES ── */}
        {aba === "indicadores" && Array.isArray(ind) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(ind as any[]).map((i: any) => (
              <div key={i.indicador} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: sc(i.status), flexShrink: 0, marginTop: 3 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <span style={{ fontWeight: 600, color: "#334155", fontSize: 14 }}>{i.indicador}</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: sc(i.status) }}>
                      {typeof i.valor === "number" && i.unidade === "R$" ? BRL(i.valor) : `${i.valor} ${i.unidade}`}
                      {i.meta != null ? ` / meta: ${i.unidade === "R$" ? BRL(i.meta) : `${i.meta} ${i.unidade}`}` : ""}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>{i.observacao}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
