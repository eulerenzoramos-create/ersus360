import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell,
} from "recharts";
import { AlertTriangle, Activity, Shield, Search } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#e4e7ec", border: "none", borderRadius: 6, color: "#f8fafc" };

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

const NIVEL_COR: Record<string, string> = { critico: "#dc2626", atencao: "#d97706", ok: "#16a34a" };
const STATUS_COR: Record<string, string> = { encerrado: "#16a34a", em_invest: "#d97706" };

// ── Dashboard ─────────────────────────────────────────────────────────────────
function AbaDashboard({ dash }: { dash: any }) {
  if (!dash) return null;
  const CORES = ["#dc2626", "#d97706", "#0891b2", "#7c3aed", "#16a34a"];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Total de casos"       value={dash.total_casos}        sub="notificados 2026"          cor="#1d4ed8" icon={<Activity size={14} color="#1d4ed8"/>}/>
        <KpiCard label="Confirmados"          value={dash.confirmados}        sub={`${dash.descartados} descartados`} cor="#dc2626" icon={<AlertTriangle size={14} color="#dc2626"/>}/>
        <KpiCard label="Em investigação"      value={dash.em_investigacao}    sub="notificações abertas"      cor="#d97706" icon={<Search size={14} color="#d97706"/>}/>
        <KpiCard label="Agravos distintos"    value={dash.agravos_distintos}  sub="doenças/agravos"           cor="#7c3aed" icon={<Shield size={14} color="#7c3aed"/>}/>
        <KpiCard label="Óbitos notificados"   value={dash.obitos}             sub="em 2026"                   cor={dash.obitos>0?"#dc2626":"#16a34a"} icon={<AlertTriangle size={14} color={dash.obitos>0?"#dc2626":"#16a34a"}/>}/>
      </div>

      {dash.n_alertas_criticos > 0 && (
        <div style={{ background: "#fff7f7", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 16px", marginBottom: 18 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}>⚠ {dash.n_alertas_criticos} alerta(s) crítico(s) ativo(s)</span>
          <span style={{ fontSize: 12, color: "#7f1d1d", marginLeft: 10 }}>— verifique a aba Alertas</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Top 5 agravos confirmados</div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dash.top_agravos} layout="vertical" barSize={14}>
                <XAxis type="number" tick={{ fontSize: 9 }}/>
                <YAxis type="category" dataKey="agravo" tick={{ fontSize: 9 }} width={160}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="n" name="Casos" radius={[0,4,4,0]}>
                  {dash.top_agravos.map((_: any, i: number) => <Cell key={i} fill={CORES[i % CORES.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Casos por semana epidemiológica</div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dash.historico_semanal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="semana" tick={{ fontSize: 8 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Line type="monotone" dataKey="dengue"  stroke="#dc2626" strokeWidth={2} dot={false} name="Dengue"/>
                <Line type="monotone" dataKey="malaria" stroke="#0891b2" strokeWidth={2} dot={false} name="Malária"/>
                <Line type="monotone" dataKey="outros"  stroke="#7c3aed" strokeWidth={1.5} dot={false} name="Outros"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11 }}>
            {[["#dc2626","Dengue"],["#0891b2","Malária"],["#7c3aed","Outros"]].map(([c,l])=>(
              <span key={l} style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:10,height:4,background:c,borderRadius:2,display:"inline-block"}}></span>{l}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Por Agravo ────────────────────────────────────────────────────────────────
function AbaAgravo({ dados }: { dados: any[] | undefined }) {
  if (!dados) return null;
  return (
    <div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#dc2626", color: "#fff" }}>
              <th style={{ padding: "9px 14px", textAlign: "left" }}>Agravo</th>
              <th style={{ padding: "9px 10px", textAlign: "left" }}>CID-10</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Notificados</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Confirmados</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Descartados</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Óbitos</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>Em invest.</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((d, i) => (
              <tr key={d.agravo} style={{ borderTop: "1px solid #f3f4f6", background: i%2===0?"#fff":"#f9fafb" }}>
                <td style={{ padding: "9px 14px", fontWeight: 700 }}>{d.agravo}</td>
                <td style={{ padding: "9px 10px", fontSize: 11, color: "#6b7280" }}>{d.cid}</td>
                <td style={{ padding: "9px 10px", textAlign: "right" }}>{d.casos}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 700, color: "#dc2626" }}>{d.confirmados}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", color: "#9ca3af" }}>{d.descartados}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: d.obitos > 0 ? 700 : 400, color: d.obitos > 0 ? "#dc2626" : "#9ca3af" }}>{d.obitos}</td>
                <td style={{ padding: "9px 10px", textAlign: "center" }}>
                  {d.em_invest > 0
                    ? <span style={{ background: "#fef3c7", color: "#d97706", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{d.em_invest}</span>
                    : <span style={{ color: "#16a34a" }}>✓</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Notificações ──────────────────────────────────────────────────────────────
function AbaNotificacoes({ notif }: { notif: any[] | undefined }) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  if (!notif) return null;
  const lista = notif.filter(n =>
    (filtro === "todos" || n.status === filtro) &&
    (busca === "" || n.agravo.toLowerCase().includes(busca.toLowerCase()) || n.local.toLowerCase().includes(busca.toLowerCase()))
  );
  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Filtrar agravo ou local..." style={{ flex:1, padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:6, fontSize:13 }}/>
        <select value={filtro} onChange={e=>setFiltro(e.target.value)} style={{ padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:6, fontSize:13 }}>
          <option value="todos">Todos status</option>
          <option value="em_invest">Em investigação</option>
          <option value="encerrado">Encerrado</option>
        </select>
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "2px solid #d4d4d4" }}>
              <th style={{ padding: "9px 14px", textAlign: "left" }}>Agravo</th>
              <th style={{ padding: "9px 10px", textAlign: "left" }}>Local</th>
              <th style={{ padding: "9px 10px", textAlign: "left" }}>Data</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Casos</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Confirm.</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>SE</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((n, i) => (
              <tr key={n.id} style={{ borderTop: "1px solid #f3f4f6", background: n.status==="em_invest"?"#fffbeb":i%2===0?"#fff":"#f9fafb" }}>
                <td style={{ padding: "9px 14px", fontWeight: 600 }}>{n.agravo}</td>
                <td style={{ padding: "9px 10px", color: "#374151" }}>{n.local}</td>
                <td style={{ padding: "9px 10px", color: "#6b7280" }}>{n.data}</td>
                <td style={{ padding: "9px 10px", textAlign: "right" }}>{n.casos}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 700, color: "#dc2626" }}>{n.confirmados}</td>
                <td style={{ padding: "9px 10px", textAlign: "center", color: "#6b7280", fontSize: 11 }}>{n.semana}</td>
                <td style={{ padding: "9px 10px", textAlign: "center" }}>
                  <span style={{ background: STATUS_COR[n.status]+"15", color: STATUS_COR[n.status], fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>
                    {n.status === "em_invest" ? "Investig." : "Encerrado"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>{lista.length} registros</div>
    </div>
  );
}

// ── Alertas ───────────────────────────────────────────────────────────────────
function AbaAlertas({ alertas }: { alertas: any[] | undefined }) {
  if (!alertas) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {alertas.map((a, i) => (
        <div key={i} style={{ background: "#fff", border: `1px solid ${a.nivel==="critico"?"#b91c1c":"#fed7aa"}`, borderLeft: `4px solid ${NIVEL_COR[a.nivel]}`, borderRadius: 8, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e7ec" }}>{a.agravo}</div>
            <span style={{ background: NIVEL_COR[a.nivel]+"15", color: NIVEL_COR[a.nivel], fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, textTransform: "uppercase" as const }}>{a.tipo}</span>
          </div>
          <div style={{ fontSize: 13, color: "#374151", marginTop: 6 }}>{a.descricao}</div>
        </div>
      ))}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
        Notificações enviadas ao SINAN Web conforme fluxo estadual SVSA/AM. Prazo de investigação: 60 dias (Portaria SVS/MS nº 104/2011).
      </div>
    </div>
  );
}

type Aba = "dashboard"|"agravo"|"notificacoes"|"alertas";

export default function NotificacoesSINAN() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash }    = useQuery({ queryKey:["sinan-dash"],  queryFn:()=>apiGet("/api/sinan/dashboard") as Promise<any> });
  const { data: agravo }  = useQuery({ queryKey:["sinan-agr"],   queryFn:()=>apiGet("/api/sinan/por-agravo") as Promise<any[]>, enabled:aba==="agravo" });
  const { data: notif }   = useQuery({ queryKey:["sinan-not"],   queryFn:()=>apiGet("/api/sinan/notificacoes") as Promise<any[]>, enabled:aba==="notificacoes" });
  const { data: alertas } = useQuery({ queryKey:["sinan-alert"], queryFn:()=>apiGet("/api/sinan/alertas") as Promise<any[]>, enabled:aba==="alertas" });

  const nAlertas = dash?.n_alertas_criticos ?? 0;

  const ABAS: { id: Aba; label: string; badge?: number }[] = [
    { id:"dashboard",    label:"Dashboard" },
    { id:"agravo",       label:"Por Agravo" },
    { id:"notificacoes", label:"Notificações" },
    { id:"alertas",      label:"Alertas", badge: nAlertas },
  ];

  return (
    <div style={{ padding:"0 0 32px", fontFamily:"system-ui,sans-serif" }}>
      <div style={{ background:"linear-gradient(135deg,#1351b4 0%,#0c3fa4 100%)", color:"#fff", padding:"20px 24px 16px", borderRadius:"0 0 16px 16px", marginBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, margin:"0 0 4px" }}>Vigilância Epidemiológica — SINAN</h1>
            <p style={{ fontSize:13, opacity:.85, margin:0 }}>Notificações compulsórias · FMS Apuí/AM · 2026</p>
          </div>
          {dash && (
            <div style={{ background:"rgba(255,255,255,.15)", borderRadius:8, padding:"8px 14px", textAlign:"center" }}>
              <div style={{ fontSize:20, fontWeight:900 }}>{dash.confirmados}</div>
              <div style={{ fontSize:10, opacity:.8 }}>casos confirmados</div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding:"0 24px" }}>
        <div style={{ display:"flex", gap:2, marginBottom:24, borderBottom:"2px solid #fee2e2" }}>
          {ABAS.map(a=>(
            <button key={a.id} onClick={()=>setAba(a.id)} style={{ padding:"9px 16px", border:"none", background:"none", cursor:"pointer", fontSize:13, borderBottom:aba===a.id?"3px solid #1351b4":"2px solid transparent", color:aba===a.id?"#dc2626":"#6b7280", fontWeight:aba===a.id?700:400, marginBottom:-2, display:"flex", alignItems:"center", gap:6 }}>
              {a.label}
              {a.badge && a.badge > 0 ? <span style={{ background:"#dc2626", color:"#fff", borderRadius:"50%", fontSize:10, fontWeight:900, width:18, height:18, display:"inline-flex", alignItems:"center", justifyContent:"center" }}>{a.badge}</span> : null}
            </button>
          ))}
        </div>
        {aba==="dashboard"    && <AbaDashboard dash={dash}/>}
        {aba==="agravo"       && <AbaAgravo dados={agravo}/>}
        {aba==="notificacoes" && <AbaNotificacoes notif={notif}/>}
        {aba==="alertas"      && <AbaAlertas alertas={alertas}/>}
      </div>
    </div>
  );
}
