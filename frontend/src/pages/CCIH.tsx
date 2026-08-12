import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Cell, ReferenceLine } from "recharts";
import { ShieldCheck, AlertTriangle, Activity, Pill } from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const TEND_COR: Record<string, string>   = { alta: "#dc2626", estavel: "#6b7280", queda: "#16a34a" };

function KpiCard({ label, value, sub, cor, icon }: { label: string; value: string | number; sub?: string; cor: string; icon: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}22`, borderTop: `3px solid ${cor}`, borderRadius: 10, padding: "13px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: "#6b7280" }}>{label}</span>
        <div style={{ background: `${cor}15`, borderRadius: 6, padding: 5 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: cor, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function AbaDashboard({ dash, hist }: { dash: any; hist: any[] | undefined }) {
  if (!dash) return <NaoDisponivelBanner nota="Dados indisponíveis. Integração não configurada no Railway. Nenhum valor foi inventado." />;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Taxa IRAS/mês"       value={dash.taxa_iras_pct+"%"}                sub={`meta: ${dash.meta_taxa_iras_pct}%`}               cor={STATUS_COR[dash.status_geral]}   icon={<ShieldCheck size={14} color={STATUS_COR[dash.status_geral]}/>}/>
        <KpiCard label="IRAS no mês"         value={dash.iras_total_mes}                   sub="infecções hospitalares"                            cor="#d97706"                         icon={<AlertTriangle size={14} color="#d97706"/>}/>
        <KpiCard label="DDD Antibióticos"    value={dash.consumo_antibioticos_ddd}         sub={`meta: ${dash.meta_ddd} DDD/100 LD`}              cor={dash.consumo_antibioticos_ddd>dash.meta_ddd?"#dc2626":"#16a34a"} icon={<Pill size={14} color={dash.consumo_antibioticos_ddd>dash.meta_ddd?"#dc2626":"#16a34a"}/>}/>
        <KpiCard label="Adesão bundles"      value={dash.bundles_adesao_pct+"%"}           sub="prevenção IRAS"                                    cor={dash.bundles_adesao_pct>=80?"#16a34a":"#d97706"} icon={<Activity size={14} color={dash.bundles_adesao_pct>=80?"#16a34a":"#d97706"}/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>IRAS e consumo ATB — 6 meses</div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }} unit="%" domain={[0,5]}/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }}/>
                <Tooltip contentStyle={TT}/>
                <ReferenceLine yAxisId="l" y={2} stroke="#16a34a" strokeDasharray="4 2" label={{ value: "meta 2%", fontSize: 9, fill: "#16a34a" }}/>
                <Line yAxisId="l" type="monotone" dataKey="taxa_iras"  stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3 }} name="Taxa IRAS (%)"/>
                <Line yAxisId="l" type="monotone" dataKey="pneumonia"  stroke="#f97316" strokeWidth={1.5} dot={false}   name="Pneumonia (%)"/>
                <Line yAxisId="l" type="monotone" dataKey="itu"        stroke="#a855f7" strokeWidth={1.5} dot={false}   name="ITU (%)"/>
                <Line yAxisId="r" type="monotone" dataKey="ddd_total"  stroke="#374151" strokeWidth={1}   dot={false}   name="DDD" strokeDasharray="3 2"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaMicrorganismos({ orgs }: { orgs: any[] | undefined }) {
  if (!orgs) return <NaoDisponivelBanner nota="Dados indisponíveis. Nenhum valor foi inventado." />;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {orgs.map(o => {
          const tendCor = TEND_COR[o.tendencia];
          return (
            <div key={o.organismo} style={{ background: "#fff", border: `1px solid ${o.alerta?"#dc262222":"#e5e7eb"}`, borderLeft: `4px solid ${o.alerta?"#dc2626":"#6b7280"}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, fontStyle: "italic" }}>{o.organismo}</span>
                  <span style={{ marginLeft: 8, background: "#fef9c3", color: "#92400e", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>{o.resistencia}</span>
                  {o.alerta && <span style={{ marginLeft: 6, background: "#fef2f2", color: "#dc2626", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>⚠ ALERTA</span>}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: tendCor, fontWeight: 700, fontSize: 12 }}>{o.tendencia==="alta"?"↑":o.tendencia==="queda"?"↓":"→"} {o.casos_mes} casos</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Sensível a: <strong style={{ color: "#374151" }}>{o.sensibilidade}</strong></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaAntibioticos({ atbs }: { atbs: any[] | undefined }) {
  if (!atbs) return <NaoDisponivelBanner nota="Dados n�o dispon�veis no momento. Integra��o pendente de configura��o no Railway." />;
  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Consumo de antibióticos (DDD/100 leitos-dia)</div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={atbs} layout="vertical" barSize={13}>
              <XAxis type="number" tick={{ fontSize: 9 }}/>
              <YAxis type="category" dataKey="antibiotico" tick={{ fontSize: 9 }} width={160}/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="ddd_100ld" name="DDD/100 LD" radius={[0,4,4,0]}>
                {atbs.map((a, i) => <Cell key={i} fill={STATUS_COR[a.status]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {atbs.filter(a => a.alerta).map(a => (
          <div key={a.antibiotico} style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#dc2626" }}>
            <strong>{a.antibiotico}:</strong> {a.alerta}
          </div>
        ))}
      </div>
    </div>
  );
}

function AbaBundles({ bundles }: { bundles: any[] | undefined }) {
  if (!bundles) return <NaoDisponivelBanner nota="Dados n�o dispon�veis no momento. Integra��o pendente de configura��o no Railway." />;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {bundles.map(b => {
          const cor = b.adesao_pct >= 80 ? "#16a34a" : b.adesao_pct >= 60 ? "#d97706" : "#dc2626";
          return (
            <div key={b.bundle} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{b.bundle}</div>
                <span style={{ fontSize: 18, fontWeight: 900, color: cor }}>{b.adesao_pct}%</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 8 }}>
                {b.itens.map((item: string) => (
                  <span key={item} style={{ background: "#f3f4f6", color: "#374151", fontSize: 10, padding: "2px 8px", borderRadius: 4 }}>{item}</span>
                ))}
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 6, height: 7 }}>
                <div style={{ background: cor, height: "100%", width: `${b.adesao_pct}%`, borderRadius: 6 }}/>
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{b.adesao_pct >= 80 ? "✓ Meta atingida" : "⚠ Abaixo da meta de 80%"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type Aba = "dashboard"|"microrganismos"|"antibioticos"|"bundles";

export default function CCIH() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash    } = useQuery({ queryKey: ["ccih-dash"],  queryFn: () => apiGet("/api/ccih/dashboard")     as Promise<any> });
  const { data: hist    } = useQuery({ queryKey: ["ccih-hist"],  queryFn: () => apiGet("/api/ccih/historico")     as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: orgs    } = useQuery({ queryKey: ["ccih-orgs"],  queryFn: () => apiGet("/api/ccih/microrganismos") as Promise<any[]>, enabled: aba==="microrganismos" });
  const { data: atbs    } = useQuery({ queryKey: ["ccih-atbs"],  queryFn: () => apiGet("/api/ccih/antibioticos")  as Promise<any[]>, enabled: aba==="antibioticos" });
  const { data: bundles } = useQuery({ queryKey: ["ccih-bund"],  queryFn: () => apiGet("/api/ccih/bundles")       as Promise<any[]>, enabled: aba==="bundles" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",     label: "Dashboard" },
    { id: "microrganismos",label: `Microrganismos (${dashRaw?.microrganismos_mdr ?? 0} MDR)` },
    { id: "antibioticos",  label: "Antibióticos" },
    { id: "bundles",       label: `Bundles (${dashRaw?.bundles_adesao_pct ?? 0}% adesão)` },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>CCIH — Controle de Infecções</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>IRAS · Resistência Bacteriana · Antibióticos · Bundles · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: dashRaw.taxa_iras_pct > dashRaw.meta_taxa_iras_pct ? "rgba(255,100,100,.3)" : "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.taxa_iras_pct}%</div>
                <div style={{ fontSize: 10, opacity: .8 }}>taxa IRAS (meta {dashRaw.meta_taxa_iras_pct}%)</div>
              </div>
              <div style={{ background: dashRaw.alertas_resistencia > 0 ? "rgba(255,100,100,.3)" : "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.alertas_resistencia}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>alertas MDR</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e4e7ec" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #0f766e":"2px solid transparent", color: aba===a.id?"#0f766e":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard" && !dashRaw && <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />}
        {aba==="dashboard"      && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="microrganismos" && <AbaMicrorganismos orgs={orgs}/>}
        {aba==="antibioticos"   && <AbaAntibioticos atbs={atbs}/>}
        {aba==="bundles"        && <AbaBundles bundles={bundles}/>}
      </div>
    </div>
  );
}
