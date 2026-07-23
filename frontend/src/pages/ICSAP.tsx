import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Cell, ReferenceLine } from "recharts";
import { TrendingDown, AlertTriangle, DollarSign, Target } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const TEND_COR: Record<string, string> = { alta: "#dc2626", estavel: "#16a34a" };
const ESF_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };

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
  if (!dash) return null;
  return (
    <div>
      <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#92400e" }}>
        <strong>ICSAP:</strong> Internações por Condições Sensíveis à Atenção Primária são evitáveis com APS resolutiva. Taxa atual de <strong>{dash.icsap_pct}%</strong> está acima da meta de {dash.meta_icsap_pct}%.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="ICSAP no mês"         value={dash.icsap_mes}                    sub={`de ${dash.internacoes_total_mes} internações`}      cor={STATUS_COR[dash.icsap_status]}   icon={<TrendingDown size={14} color={STATUS_COR[dash.icsap_status]}/>}/>
        <KpiCard label="Taxa ICSAP"           value={dash.icsap_pct+"%"}                sub={`meta: ${dash.meta_icsap_pct}%`}                     cor="#dc2626"                         icon={<Target size={14} color="#dc2626"/>}/>
        <KpiCard label="Custo ICSAP/mês"      value={"R$"+dash.custo_icsap_mes.toLocaleString("pt-BR")} sub="internações evitáveis"              cor="#d97706"                         icon={<DollarSign size={14} color="#d97706"/>}/>
        <KpiCard label="ICSAP acumulado 12m"  value={dash.internacoes_evitiveis_12m}    sub="internações evitáveis"                               cor="#dc2626"                         icon={<AlertTriangle size={14} color="#dc2626"/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>ICSAP — tendência mensal (%)</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }} unit="%"/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }}/>
                <Tooltip contentStyle={TT}/>
                <ReferenceLine yAxisId="l" y={25} stroke="#16a34a" strokeDasharray="4 2" label={{ value: "meta 25%", fontSize: 9, fill: "#16a34a" }}/>
                <Line yAxisId="l" type="monotone" dataKey="pct_icsap"      stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3 }} name="% ICSAP"/>
                <Line yAxisId="r" type="monotone" dataKey="icsap"          stroke="#d97706" strokeWidth={1.5} dot={false}   name="Qtd ICSAP"/>
                <Line yAxisId="r" type="monotone" dataKey="custo_icsap"    stroke="#7c3aed" strokeWidth={1}   dot={false}   name="Custo (R$)" strokeDasharray="3 2"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaCausas({ causas }: { causas: any[] | undefined }) {
  if (!causas) return null;
  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Causas ICSAP — Mar/26</div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={causas} layout="vertical" barSize={13}>
              <XAxis type="number" tick={{ fontSize: 9 }}/>
              <YAxis type="category" dataKey="grupo" tick={{ fontSize: 9 }} width={200}/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="internacoes_mes" name="Internações" radius={[0,4,4,0]}>
                {causas.map((c, i) => <Cell key={i} fill={TEND_COR[c.tendencia]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#dc2626", color: "#fff" }}>
              {["Grupo","CID","Intern./mês","% ICSAP","Custo médio","Tendência","ESF principal"].map(h=>(
                <th key={h} style={{ padding: "7px 10px", textAlign: h==="Grupo"?"left":"center" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {causas.map((c, i) => (
              <tr key={c.grupo} style={{ borderTop: "1px solid #f3f4f6", background: i%2===0?"#fff":"#fafafa" }}>
                <td style={{ padding: "7px 10px", fontWeight: 600 }}>{c.grupo}</td>
                <td style={{ padding: "7px 10px", textAlign: "center", color: "#6b7280", fontSize: 10 }}>{c.cid}</td>
                <td style={{ padding: "7px 10px", textAlign: "center", fontWeight: 700, color: "#dc2626" }}>{c.internacoes_mes}</td>
                <td style={{ padding: "7px 10px", textAlign: "center" }}>{c.pct_icsap}%</td>
                <td style={{ padding: "7px 10px", textAlign: "center", color: "#1d4ed8" }}>R${c.custo_medio}</td>
                <td style={{ padding: "7px 10px", textAlign: "center" }}>
                  <span style={{ color: TEND_COR[c.tendencia], fontWeight: 700 }}>{c.tendencia==="alta"?"↑ Alta":"→ Estável"}</span>
                </td>
                <td style={{ padding: "7px 10px", textAlign: "center", fontSize: 11, color: "#6b7280" }}>{c.esf_principal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AbaPorESF({ esfs }: { esfs: any[] | undefined }) {
  if (!esfs) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {esfs.map(e => {
          const cor = ESF_COR[e.status];
          const pct = Math.min(100, Math.round(e.taxa_100mil / e.meta_100mil * 100));
          return (
            <div key={e.esf} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{e.esf}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>Pop. coberta: {e.pop_coberta.toLocaleString("pt-BR")} · Principal: {e.principal_causa}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: cor }}>{e.taxa_100mil.toFixed(1)}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>ICSAP/100mil · meta: {e.meta_100mil}</div>
                </div>
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 6, height: 7 }}>
                <div style={{ background: cor, height: "100%", width: `${Math.min(100,pct)}%`, borderRadius: 6 }}/>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: "#9ca3af" }}>
                <span>{e.internacoes_icsap_mes} internações/mês</span>
                <span style={{ color: cor }}>{e.status === "ok" ? "✓ Abaixo da meta" : e.status === "atencao" ? "⚠ Próximo da meta" : "⚠ Acima da meta"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaAcoes({ acoes }: { acoes: any[] | undefined }) {
  if (!acoes) return null;
  const PRIOR_COR: Record<string, string> = { alta: "#dc2626", media: "#d97706", baixa: "#16a34a" };
  const SIT_COR: Record<string, string> = { "em andamento": "#1d4ed8", "planejado": "#d97706", "concluido": "#16a34a" };
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {acoes.map((a, i) => {
          const cor = PRIOR_COR[a.prioridade];
          const sc = SIT_COR[a.status];
          return (
            <div key={i} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{a.acao}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{a.prioridade}</span>
                  <span style={{ background: sc+"15", color: sc, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{a.status}</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Causa-alvo: <strong>{a.causa_alvo}</strong> · Resp.: {a.responsavel} · Prazo: {a.prazo}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type Aba = "dashboard"|"causas"|"por-esf"|"acoes";

export default function ICSAP() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash  } = useQuery({ queryKey: ["ic-dash"],  queryFn: () => apiGet("/api/icsap/dashboard") as Promise<any> });
  const { data: hist  } = useQuery({ queryKey: ["ic-hist"],  queryFn: () => apiGet("/api/icsap/historico") as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: caus  } = useQuery({ queryKey: ["ic-caus"],  queryFn: () => apiGet("/api/icsap/causas")    as Promise<any[]>, enabled: aba==="causas" });
  const { data: esfs  } = useQuery({ queryKey: ["ic-esf"],   queryFn: () => apiGet("/api/icsap/por-esf")  as Promise<any[]>, enabled: aba==="por-esf" });
  const { data: acoes } = useQuery({ queryKey: ["ic-acoes"], queryFn: () => apiGet("/api/icsap/acoes")    as Promise<any[]>, enabled: aba==="acoes" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "causas",    label: `Causas (${dashRaw?.icsap_mes ?? 0} casos)` },
    { id: "por-esf",   label: "Por ESF" },
    { id: "acoes",     label: "Ações de Melhoria" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>ICSAP — Internações Evitáveis</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Condições Sensíveis à APS · Lista Brasileira ICSAP · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.icsap_pct}%</div>
                <div style={{ fontSize: 10, opacity: .8 }}>taxa ICSAP (meta 25%)</div>
              </div>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 900 }}>R${dashRaw.custo_icsap_mes?.toLocaleString("pt-BR")}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>custo evitável/mês</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e4e7ec" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"3px solid #1351b4":"2px solid transparent", color: aba===a.id?"#1351b4":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard" && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="causas"    && <AbaCausas causas={caus}/>}
        {aba==="por-esf"   && <AbaPorESF esfs={esfs}/>}
        {aba==="acoes"     && <AbaAcoes acoes={acoes}/>}
      </div>
    </div>
  );
}
