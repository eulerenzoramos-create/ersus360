import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { Trash2, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const GRAV_COR: Record<string, string>   = { alta: "#dc2626", media: "#d97706", baixa: "#6b7280" };

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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Resíduos totais/mês"    value={dash.residuos_total_kg_mes.toLocaleString("pt-BR")+" kg"} sub={`${dash.residuos_infectantes_kg_mes} kg infectantes`}  cor="#374151"  icon={<Trash2 size={14} color="#374151"/>}/>
        <KpiCard label="Conformidade PGRSS"     value={dash.conformidade_pct+"%"}                                sub={`meta: 90%`}                                            cor={STATUS_COR[dash.status_geral]}  icon={<CheckCircle size={14} color={STATUS_COR[dash.status_geral]}/>}/>
        <KpiCard label="Não conformidades"      value={dash.nao_conformidades_mes}                               sub="no mês"                                                 cor={dash.nao_conformidades_mes>4?"#dc2626":"#d97706"}  icon={<AlertTriangle size={14} color={dash.nao_conformidades_mes>4?"#dc2626":"#d97706"}/>}/>
        <KpiCard label="Próxima coleta"         value={dash.proxima_coleta_dias+"d"}                             sub={dash.empresa_coleta}                                    cor="#16a34a"  icon={<TrendingUp size={14} color="#16a34a"/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Geração de resíduos — 6 meses (kg)</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hist} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }}/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }} unit="%"/>
                <Tooltip contentStyle={TT}/>
                <Bar yAxisId="l" dataKey="infectantes" name="Infectantes (A)" fill="#dc2626" radius={[4,4,0,0]} stackId="a"/>
                <Bar yAxisId="l" dataKey="quimicos"    name="Químicos (B)"    fill="#d97706" radius={[0,0,0,0]} stackId="a"/>
                <Bar yAxisId="l" dataKey="comuns"      name="Comuns (D)"      fill="#6b7280" radius={[0,0,4,4]} stackId="a"/>
                <Line yAxisId="r" type="monotone" dataKey="conformidade" name="Conformidade %" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaGrupos({ grupos }: { grupos: any[] | undefined }) {
  if (!grupos) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {grupos.map(g => {
          const cor = STATUS_COR[g.status];
          return (
            <div key={g.grupo} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 800 }}>{g.grupo}</span>
                  <span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280" }}>{g.descricao}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: cor }}>{g.conformidade_pct}%</span>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
                {g.kg_mes > 0 && <span><strong>{g.kg_mes.toLocaleString("pt-BR")} kg</strong>/mês</span>}
                {g.caixas_mes && <span><strong>{g.caixas_mes} caixas</strong>/mês</span>}
                <span>Coleta: {g.coleta}</span>
                <span>Destino: {g.destino}</span>
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 6, height: 7 }}>
                <div style={{ background: cor, height: "100%", width: `${g.conformidade_pct}%`, borderRadius: 6 }}/>
              </div>
              {g.alerta && <div style={{ marginTop: 5, background: "#fef9c3", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#92400e" }}>⚠ {g.alerta}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaNaoConformidades({ ncs }: { ncs: any[] | undefined }) {
  if (!ncs) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {ncs.map(nc => {
          const cor = nc.corrigida ? "#16a34a" : GRAV_COR[nc.gravidade];
          return (
            <div key={nc.id} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "11px 16px", opacity: nc.corrigida ? 0.7 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>{nc.id}</span>
                  <span style={{ marginLeft: 8, background: GRAV_COR[nc.gravidade]+"15", color: GRAV_COR[nc.gravidade], fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>{nc.gravidade}</span>
                </div>
                <span style={{ background: nc.corrigida?"#dcfce7":"#fef2f2", color: nc.corrigida?"#16a34a":"#dc2626", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
                  {nc.corrigida ? "✓ Corrigida" : "⚠ Aberta"}
                </span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 3 }}>{nc.descricao}</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>Local: {nc.local} · {nc.data} · Prazo: {nc.prazo}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaIndicadores({ inds }: { inds: any[] | undefined }) {
  if (!inds) return null;
  return (
    <div>
      {["critico","atencao","ok"].map(nivel => {
        const grupo = inds.filter(i => i.status === nivel);
        if (!grupo.length) return null;
        const cor = STATUS_COR[nivel];
        return (
          <div key={nivel} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: cor, marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: 1 }}>{nivel==="critico"?"Crítico":nivel==="atencao"?"Atenção":"OK"}</div>
            {grupo.map(ind => (
              <div key={ind.indicador} style={{ background: "#fff", border: `1px solid ${cor}22`, borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ind.meta && ind.unidade==="%"?6:0 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{ind.indicador}</span>
                    {ind.observacao && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{ind.observacao}</div>}
                  </div>
                  <div style={{ flexShrink: 0, marginLeft: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{ind.valor}{ind.unidade==="%"?"%":""}</span>
                    {ind.meta && <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>meta: {ind.meta}{ind.unidade==="%"?"%":""}</span>}
                  </div>
                </div>
                {ind.meta && ind.unidade==="%" && typeof ind.valor==="number" && (
                  <div style={{ background: "#f3f4f6", borderRadius: 6, height: 7 }}>
                    <div style={{ background: cor, height: "100%", width: `${Math.min(100,Math.round(ind.valor/ind.meta*100))}%`, borderRadius: 6 }}/>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

type Aba = "dashboard"|"grupos"|"nao-conformidades"|"indicadores";

export default function PGRSS() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash } = useQuery({ queryKey: ["pgr-dash"], queryFn: () => apiGet("/api/pgrss/dashboard")          as Promise<any> });
  const { data: hist } = useQuery({ queryKey: ["pgr-hist"], queryFn: () => apiGet("/api/pgrss/historico")          as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: grps } = useQuery({ queryKey: ["pgr-grps"], queryFn: () => apiGet("/api/pgrss/grupos")            as Promise<any[]>, enabled: aba==="grupos" });
  const { data: ncs  } = useQuery({ queryKey: ["pgr-ncs"],  queryFn: () => apiGet("/api/pgrss/nao-conformidades") as Promise<any[]>, enabled: aba==="nao-conformidades" });
  const { data: inds } = useQuery({ queryKey: ["pgr-ind"],  queryFn: () => apiGet("/api/pgrss/indicadores")       as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",        label: "Dashboard" },
    { id: "grupos",           label: "Grupos A-E" },
    { id: "nao-conformidades",label: `NC (${dashRaw?.nao_conformidades_mes ?? 0})` },
    { id: "indicadores",      label: "Indicadores" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>PGRSS — Resíduos de Saúde</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Grupos A-E · Segregação · Coleta · Conformidade · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 900 }}>{dashRaw.residuos_total_kg_mes.toLocaleString("pt-BR")} kg</div>
                <div style={{ fontSize: 10, opacity: .8 }}>resíduos/mês</div>
              </div>
              <div style={{ background: dashRaw.conformidade_pct < 80 ? "rgba(255,200,50,.3)" : "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.conformidade_pct}%</div>
                <div style={{ fontSize: 10, opacity: .8 }}>conformidade</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e4e7ec" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #15803d":"2px solid transparent", color: aba===a.id?"#15803d":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard"         && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="grupos"            && <AbaGrupos grupos={grps}/>}
        {aba==="nao-conformidades" && <AbaNaoConformidades ncs={ncs}/>}
        {aba==="indicadores"       && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
