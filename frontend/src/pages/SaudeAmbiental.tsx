import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from "recharts";
import { Droplets, AlertTriangle, Wind, MapPin } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#1e293b", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", alerta: "#dc2626", critico: "#dc2626", monitoramento: "#6b7280", parcial: "#d97706", deficiente: "#dc2626" };
const SANEAMENTO_COR: Record<string, string> = { ok: "#16a34a", parcial: "#d97706", deficiente: "#dc2626", critico: "#dc2626" };

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
        <KpiCard label="Conformidade água"    value={dash.amostras_conformes_pct+"%"}  sub={`${dash.amostras_agua_mes} amostras/mês`}  cor={STATUS_COR[dash.amostras_conformes_status]} icon={<Droplets size={14} color={STATUS_COR[dash.amostras_conformes_status]}/>}/>
        <KpiCard label="Alertas ativos"       value={dash.alertas_ativos}               sub="pontos não conformes"                      cor={dash.alertas_ativos>0?"#dc2626":"#16a34a"}  icon={<AlertTriangle size={14} color={dash.alertas_ativos>0?"#dc2626":"#16a34a"}/>}/>
        <KpiCard label="Cobertura saneamento" value={dash.cobertura_saneamento_pct+"%"} sub="água + esgoto"                             cor={STATUS_COR[dash.cobertura_saneamento_status]} icon={<Wind size={14} color={STATUS_COR[dash.cobertura_saneamento_status]}/>}/>
        <KpiCard label="Intox. agrotóxico/mês" value={dash.intoxicacoes_agrotoxico_mes} sub="notif. SINAN"                              cor={dash.intoxicacoes_agrotoxico_mes>0?"#d97706":"#16a34a"} icon={<AlertTriangle size={14} color={dash.intoxicacoes_agrotoxico_mes>0?"#d97706":"#16a34a"}/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Conformidade da água — 6 meses (%)</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }} unit="%" domain={[60, 100]}/>
                <Tooltip contentStyle={TT} formatter={(v: any) => `${v}%`}/>
                <Line type="monotone" dataKey="pct"          stroke="#0369a1" strokeWidth={2.5} dot={{ r: 3 }} name="Conformes %"/>
                <Line type="monotone" dataKey="nao_conformes" stroke="#dc2626" strokeWidth={1.5} dot={false}   name="Não conformes"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaAgua({ pontos }: { pontos: any[] | undefined }) {
  if (!pontos) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {pontos.map(p => {
          const cor = STATUS_COR[p.status];
          return (
            <div key={p.ponto} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{p.ponto}</span>
                  <span style={{ marginLeft: 8, background: "#f3f4f6", color: "#374151", fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4 }}>{p.tipo}</span>
                </div>
                <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{p.status}</span>
              </div>
              <div style={{ display: "flex", gap: 18, fontSize: 12, color: "#374151" }}>
                <span>Coliformes: <strong style={{ color: p.coliformes_totais==="Presente"?"#dc2626":"#16a34a" }}>{p.coliformes_totais}</strong></span>
                {p.cloro_residual !== null && p.cloro_residual !== undefined && <span>Cloro: <strong style={{ color: p.cloro_residual<0.2?"#dc2626":"#374151" }}>{p.cloro_residual} mg/L</strong></span>}
                <span>Turbidez: <strong style={{ color: p.turbidez>5?"#dc2626":"#374151" }}>{p.turbidez} NTU</strong></span>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>Coleta: {p.ultima_coleta}</span>
              </div>
              {p.alerta && <div style={{ marginTop: 6, background: "#fef2f2", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#dc2626", fontWeight: 600 }}>⚠ {p.alerta}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaSaneamento({ san }: { san: any[] | undefined }) {
  if (!san) return null;
  const barData = san.map(s => ({ name: s.localidade.split(" ")[0], agua: s.agua_tratada_pct, esgoto: s.esgoto_pct, residuos: s.residuos_coleta_pct }));
  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Cobertura de saneamento por localidade (%)</div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="name" tick={{ fontSize: 9 }}/>
              <YAxis tick={{ fontSize: 10 }} unit="%"/>
              <Tooltip contentStyle={TT} formatter={(v: any) => `${v}%`}/>
              <Bar dataKey="agua"     name="Água tratada"  fill="#0369a1" radius={[4,4,0,0]}/>
              <Bar dataKey="esgoto"   name="Esgoto tratado" fill="#7c3aed" radius={[4,4,0,0]}/>
              <Bar dataKey="residuos" name="Coleta resíduos" fill="#16a34a" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {san.map(s => {
          const cor = SANEAMENTO_COR[s.situacao];
          return (
            <div key={s.localidade} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "10px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.localidade}</div>
                <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{s.situacao}</span>
              </div>
              <div style={{ display: "flex", gap: 18, fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                <span>Água: <strong style={{ color: s.agua_tratada_pct<50?"#dc2626":"#374151" }}>{s.agua_tratada_pct}%</strong></span>
                <span>Esgoto: <strong style={{ color: s.esgoto_pct<20?"#dc2626":"#374151" }}>{s.esgoto_pct}%</strong></span>
                <span>Resíduos: <strong>{s.residuos_coleta_pct}%</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaAgrotoxicos({ casos }: { casos: any[] | undefined }) {
  if (!casos) return null;
  return (
    <div>
      <div style={{ marginBottom: 16, padding: "10px 14px", background: "#fef9c3", borderRadius: 8, border: "1px solid #fde68a", fontSize: 12, color: "#92400e" }}>
        <strong>SINAN:</strong> Intoxicações por agrotóxicos de uso agrícola são de notificação compulsória. Total T1/26: {casos.length} casos.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {casos.map(c => (
          <div key={c.id} style={{ background: "#fff", border: `1px solid ${c.alerta?"#dc262222":"#e5e7eb"}`, borderLeft: `4px solid ${c.alerta?"#dc2626":"#d97706"}`, borderRadius: 8, padding: "12px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{c.id}</span>
                <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600 }}>{c.agente}</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ background: c.gravidade==="leve"?"#fef9c3":c.gravidade==="moderada"?"#fee2e2":"#fee2e2", color: c.gravidade==="leve"?"#a16207":"#dc2626", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{c.gravidade}</span>
                <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: 10, padding: "2px 7px", borderRadius: 4 }}>{c.notificado_sinan?"SINAN ✓":"Pendente"}</span>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Ocupação: {c.ocupacao} · Exposição: {c.exposicao} · {c.mes}</div>
            {c.alerta && <div style={{ marginTop: 6, background: "#fef2f2", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#dc2626", fontWeight: 600 }}>⚠ {c.alerta}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

type Aba = "dashboard"|"agua"|"saneamento"|"agrotoxicos";

export default function SaudeAmbiental() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash } = useQuery({ queryKey: ["sa-dash"], queryFn: () => apiGet("/api/saude-ambiental/dashboard")            as Promise<any> });
  const { data: hist } = useQuery({ queryKey: ["sa-hist"], queryFn: () => apiGet("/api/saude-ambiental/historico-conformidade") as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: agua } = useQuery({ queryKey: ["sa-agua"], queryFn: () => apiGet("/api/saude-ambiental/qualidade-agua")        as Promise<any[]>, enabled: aba==="agua" });
  const { data: san  } = useQuery({ queryKey: ["sa-san"],  queryFn: () => apiGet("/api/saude-ambiental/saneamento")           as Promise<any[]>, enabled: aba==="saneamento" });
  const { data: agro } = useQuery({ queryKey: ["sa-agro"], queryFn: () => apiGet("/api/saude-ambiental/agrotoxicos")          as Promise<any[]>, enabled: aba==="agrotoxicos" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "agua",        label: `Qualidade da Água (${dashRaw?.alertas_ativos ?? 0} alertas)` },
    { id: "saneamento",  label: `Saneamento (${dashRaw?.cobertura_saneamento_pct ?? 0}%)` },
    { id: "agrotoxicos", label: `Agrotóxicos (${dashRaw?.intoxicacoes_agrotoxico_mes ?? 0} casos/mês)` },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#065f46 0%,#059669 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Saúde Ambiental</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>VIGIAGUA · Saneamento · Agrotóxicos · VIGIPIECES · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.amostras_conformes_pct}%</div>
                <div style={{ fontSize: 10, opacity: .8 }}>água conforme</div>
              </div>
              <div style={{ background: dashRaw.alertas_ativos>0?"rgba(239,68,68,.3)":"rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.alertas_ativos}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>alertas</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #d1fae5" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #059669":"2px solid transparent", color: aba===a.id?"#059669":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard"   && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="agua"        && <AbaAgua pontos={agua}/>}
        {aba==="saneamento"  && <AbaSaneamento san={san}/>}
        {aba==="agrotoxicos" && <AbaAgrotoxicos casos={agro}/>}
      </div>
    </div>
  );
}
