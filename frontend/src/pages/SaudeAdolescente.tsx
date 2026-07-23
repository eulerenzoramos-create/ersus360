import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { Users, AlertTriangle, Heart, Activity } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#1e293b", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };

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

function AbaDashboard({ dash, prod }: { dash: any; prod: any[] | undefined }) {
  if (!dash) return null;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Cobertura consulta"    value={dash.cobertura_consulta_pct+"%"}  sub="adolescentes APS"      cor={STATUS_COR[dash.cobertura_consulta_status]}  icon={<Users size={14} color={STATUS_COR[dash.cobertura_consulta_status]}/>}/>
        <KpiCard label="Gravidez adolescência" value={dash.gravidez_adolescente_pct+"%"} sub="% nascimentos"         cor={STATUS_COR[dash.gravidez_adolescente_status]} icon={<Heart size={14} color={STATUS_COR[dash.gravidez_adolescente_status]}/>}/>
        <KpiCard label="DST/IST novos casos"   value={dash.dst_ist_novos_casos}          sub="T1/26"                 cor="#d97706"                                       icon={<AlertTriangle size={14} color="#d97706"/>}/>
        <KpiCard label="Rastreio saúde mental" value={dash.saude_mental_rastreio_pct+"%"} sub="PHQ-A realizado"      cor={STATUS_COR[dash.saude_mental_rastreio_status]} icon={<Activity size={14} color={STATUS_COR[dash.saude_mental_rastreio_status]}/>}/>
      </div>
      {prod && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Produção mensal — adolescentes (10-19 anos)</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prod} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="consultas"          name="Consultas"         fill="#6366f1" radius={[4,4,0,0]}/>
                <Bar dataKey="testagens_ist"       name="Testagens IST"     fill="#d97706" radius={[4,4,0,0]}/>
                <Bar dataKey="grupos_educativos"   name="Grupos educativos" fill="#16a34a" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaGravidez({ historico }: { historico: any[] | undefined }) {
  if (!historico) return null;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Gravidez na adolescência — histórico</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="ano" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }}/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }} unit="%"/>
                <Tooltip contentStyle={TT}/>
                <Bar yAxisId="l" dataKey="adol_nv" name="NV adolescentes" fill="#dc2626" radius={[4,4,0,0]}/>
                <Line yAxisId="r" type="monotone" dataKey="pct" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} name="% NV adolesc."/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Detalhamento por ano</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#dc2626", color: "#fff" }}>
                  {["Ano","Total NV","NV Adolesc.","% Adolesc."].map(h => <th key={h} style={{ padding: "7px 10px", textAlign: h==="Ano"?"left":"center" }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {historico.map((h, i) => (
                  <tr key={h.ano} style={{ borderTop: "1px solid #f3f4f6", background: i%2===0?"#fff":"#fafafa" }}>
                    <td style={{ padding: "7px 10px", fontWeight: 600 }}>{h.ano}</td>
                    <td style={{ padding: "7px 10px", textAlign: "center" }}>{h.total_nv}</td>
                    <td style={{ padding: "7px 10px", textAlign: "center", color: "#dc2626", fontWeight: 700 }}>{h.adol_nv}</td>
                    <td style={{ padding: "7px 10px", textAlign: "center", color: h.pct>13?"#dc2626":"#d97706", fontWeight: 700 }}>{h.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function AbaDst({ casos }: { casos: any[] | undefined }) {
  if (!casos) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {casos.map(c => (
          <div key={c.id} style={{ background: "#fff", border: `1px solid ${c.alerta?"#dc262222":"#e5e7eb"}`, borderLeft: `4px solid ${c.alerta?"#dc2626":"#d97706"}`, borderRadius: 8, padding: "12px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{c.id}</span>
                <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 600 }}>{c.diagnostico}</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ background: "#fef9c3", color: "#a16207", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{c.faixa} anos</span>
                <span style={{ background: c.tto_iniciado?"#dcfce7":"#fee2e2", color: c.tto_iniciado?"#16a34a":"#dc2626", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{c.tto_iniciado?"Tto iniciado":"Sem tto"}</span>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{c.trimestre} · {c.encaminhamento} · ESF: {c.esf ?? "—"}</div>
            {c.alerta && <div style={{ marginTop: 6, background: "#fef2f2", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#dc2626", fontWeight: 600 }}>⚠ {c.alerta}</div>}
          </div>
        ))}
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ind.meta?6:0 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{ind.indicador}</span>
                    {ind.observacao && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{ind.observacao}</div>}
                  </div>
                  <div style={{ flexShrink: 0, marginLeft: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{ind.valor}{ind.unidade.startsWith("%")?"%":""}</span>
                    {ind.meta && <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>meta: {ind.meta}{ind.unidade.startsWith("%")?"%":""}</span>}
                  </div>
                </div>
                {!ind.invertido && ind.meta && typeof ind.valor === "number" && (
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

type Aba = "dashboard"|"gravidez"|"dst"|"indicadores";

export default function SaudeAdolescente() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash } = useQuery({ queryKey: ["adol-dash"], queryFn: () => apiGet("/api/saude-adolescente/dashboard")         as Promise<any> });
  const { data: prod } = useQuery({ queryKey: ["adol-prod"], queryFn: () => apiGet("/api/saude-adolescente/producao")           as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: grav } = useQuery({ queryKey: ["adol-grav"], queryFn: () => apiGet("/api/saude-adolescente/gravidez-historico") as Promise<any[]>, enabled: aba==="gravidez" });
  const { data: dst  } = useQuery({ queryKey: ["adol-dst"],  queryFn: () => apiGet("/api/saude-adolescente/dst-ist")            as Promise<any[]>, enabled: aba==="dst" });
  const { data: inds } = useQuery({ queryKey: ["adol-ind"],  queryFn: () => apiGet("/api/saude-adolescente/indicadores")        as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "gravidez",    label: `Gravidez Adolescente (${dashRaw?.gravidez_adolescente_casos ?? 0} casos)` },
    { id: "dst",         label: `DST/IST (${dashRaw?.dst_ist_novos_casos ?? 0} casos)` },
    { id: "indicadores", label: "Indicadores" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#4f46e5 0%,#6366f1 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Saúde do Adolescente</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>PROSAD · ECA · SSR · Saúde Mental · IST · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.populacao_10_19}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>pop. 10-19 anos</div>
              </div>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.cobertura_consulta_pct}%</div>
                <div style={{ fontSize: 10, opacity: .8 }}>cobertura APS</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e0e7ff" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #4f46e5":"2px solid transparent", color: aba===a.id?"#4f46e5":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard"   && <AbaDashboard dash={dashRaw} prod={prod}/>}
        {aba==="gravidez"    && <AbaGravidez historico={grav}/>}
        {aba==="dst"         && <AbaDst casos={dst}/>}
        {aba==="indicadores" && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
