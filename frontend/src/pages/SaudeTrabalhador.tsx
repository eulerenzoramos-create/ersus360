import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from "recharts";
import { Wrench, AlertTriangle, Activity, CheckCircle } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#1e293b", border: "none", borderRadius: 6, color: "#f8fafc" };
const RISCO_COR: Record<string, string> = { alto: "#dc2626", medio: "#d97706", baixo: "#16a34a" };
const STATUS_ACO: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };

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

function AbaDashboard({ dash }: { dash: any }) {
  if (!dash) return null;
  const histBar = (dash.historico || []).filter((h: any) => h.ano !== "2026*");
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Agravos 2026"      value={dash.agravos_2026}       sub="Jan–Mar/26"              cor="#1d4ed8" icon={<Wrench size={14} color="#1d4ed8"/>}/>
        <KpiCard label="Acid. típicos"     value={dash.acidentes_tipicos}  sub="notificados"             cor="#dc2626" icon={<AlertTriangle size={14} color="#dc2626"/>}/>
        <KpiCard label="Intox. agrotóxico" value={dash.intox_agrotox}      sub="SINAN obrigatório"       cor="#d97706" icon={<AlertTriangle size={14} color="#d97706"/>}/>
        <KpiCard label="Com alerta"        value={dash.alertas}            sub="CAT pendente / nexo"     cor={dash.alertas>0?"#dc2626":"#16a34a"} icon={<AlertTriangle size={14} color={dash.alertas>0?"#dc2626":"#16a34a"}/>}/>
        <KpiCard label="Dias afastamento"  value={dash.dias_afastamento}   sub="total acumulado"         cor="#7c3aed" icon={<Activity size={14} color="#7c3aed"/>}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Acidentes e doenças — histórico anual</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histBar} barSize={18}>
                <XAxis dataKey="ano" tick={{ fontSize: 10 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="acidentes_tipicos" name="Acid. típicos" fill="#dc2626" radius={[4,4,0,0]}/>
                <Bar dataKey="intox_agrotox"     name="Intox. agrotóx." fill="#d97706" radius={[4,4,0,0]}/>
                <Bar dataKey="doencas_trab"      name="Doenças trabalho" fill="#7c3aed" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Taxa de acidente por setor (/1.000 trab.)</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dash.setores_chart || []} layout="vertical" barSize={13}>
                <XAxis type="number" tick={{ fontSize: 9 }}/>
                <YAxis type="category" dataKey="setor" tick={{ fontSize: 9 }} width={90}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="taxa" name="Taxa" radius={[0,4,4,0]}>
                  {(dash.setores_chart||[]).map((s: any, i: number) => <Cell key={i} fill={RISCO_COR[s.risco]||"#94a3b8"}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function AbaAgravos({ agravos }: { agravos: any[] | undefined }) {
  const [filtro, setFiltro] = useState("todos");
  if (!agravos) return null;
  const lista = filtro === "todos" ? agravos : filtro === "alerta" ? agravos.filter(a => a.alerta) : agravos.filter(a => a.agravo.toLowerCase().includes(filtro));
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {[["todos","Todos",agravos.length],["alerta","⚠ Alertas",agravos.filter(a=>a.alerta).length],["acidente","Acidentes",agravos.filter(a=>a.agravo.toLowerCase().includes("acidente")).length],["intoxicação","Intoxicações",agravos.filter(a=>a.agravo.toLowerCase().includes("intoxicação")).length]].map(([k,l,n])=>(
          <button key={String(k)} onClick={()=>setFiltro(String(k))} style={{ padding:"6px 14px",border:`1px solid ${filtro===k?"#1d4ed8":"#e5e7eb"}`,borderRadius:20,background:filtro===k?"#eff6ff":"#fff",color:filtro===k?"#1d4ed8":"#374151",fontSize:12,cursor:"pointer",fontWeight:filtro===k?700:400 }}>{l} ({n})</button>
        ))}
        <div style={{ fontSize: 12, color: "#9ca3af", alignSelf: "center", marginLeft: "auto" }}>{lista.length} registros</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {lista.map(a => (
          <div key={a.id} style={{ background: "#fff", border: `1px solid ${a.alerta?"#dc262222":"#e5e7eb"}`, borderLeft: `4px solid ${a.cat_emitida?"#16a34a":"#dc2626"}`, borderRadius: 8, padding: "12px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{a.agravo}</div>
              <div style={{ display: "flex", gap: 6 }}>
                {a.cat_emitida
                  ? <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>CAT emitida</span>
                  : <span style={{ background: "#fef2f2", color: "#dc2626", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>CAT pendente</span>}
                <span style={{ background: "#f3f4f6", color: "#374151", fontSize: 10, padding: "2px 7px", borderRadius: 4 }}>{a.mes}/26</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#6b7280" }}>
              <span>Setor: <strong style={{ color: "#374151" }}>{a.setor}</strong></span>
              <span>Afastamento: <strong style={{ color: a.afastamento_dias>=30?"#dc2626":"#374151" }}>{a.afastamento_dias} dias</strong></span>
              <span>Nexo causal: <strong style={{ color: a.nexo_causal?"#16a34a":"#d97706" }}>{a.nexo_causal?"Confirmado":"A investigar"}</strong></span>
              <span>Investigado: <strong style={{ color: a.investigado?"#16a34a":"#d97706" }}>{a.investigado?"Sim":"Não"}</strong></span>
            </div>
            {a.alerta && <div style={{ marginTop: 6, background: "#fef2f2", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#dc2626", fontWeight: 600 }}>⚠ {a.alerta}</div>}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
        CAT (Comunicação de Acidente de Trabalho) — obrigatória em até 24h do acidente. Intoxicações por agrotóxicos são de notificação compulsória imediata no SINAN. Nexo causal: Lei 8.213/1991.
      </div>
    </div>
  );
}

function AbaSetores({ setores }: { setores: any[] | undefined }) {
  if (!setores) return null;
  return (
    <div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#1d4ed8", color: "#fff" }}>
              {["Setor","Trab. estimados","Acid. 2026","Doenças 2026","Taxa (/1.000)","Risco"].map(h=>(
                <th key={h} style={{ padding: "9px 12px", textAlign: h==="Setor"?"left":"center" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {setores.map((s, i) => {
              const rCor = RISCO_COR[s.risco];
              return (
                <tr key={s.setor} style={{ borderTop: "1px solid #f3f4f6", background: s.risco==="alto"?"#fff7f7":i%2===0?"#fff":"#f9fafb" }}>
                  <td style={{ padding: "9px 12px", fontWeight: 600 }}>{s.setor}</td>
                  <td style={{ padding: "9px 12px", textAlign: "center" }}>{s.trabalhadores_est.toLocaleString("pt-BR")}</td>
                  <td style={{ padding: "9px 12px", textAlign: "center", color: s.acidentes_2026>0?"#dc2626":"#9ca3af", fontWeight: s.acidentes_2026>0?700:400 }}>{s.acidentes_2026}</td>
                  <td style={{ padding: "9px 12px", textAlign: "center", color: s.doencas_2026>0?"#d97706":"#9ca3af" }}>{s.doencas_2026}</td>
                  <td style={{ padding: "9px 12px", textAlign: "center", fontWeight: 700, color: rCor }}>{s.taxa_acidente.toFixed(2)}</td>
                  <td style={{ padding: "9px 12px", textAlign: "center" }}>
                    <span style={{ background: rCor+"15", color: rCor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{s.risco}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AbaAcoes({ acoes }: { acoes: any[] | undefined }) {
  if (!acoes) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {acoes.map((a, i) => {
          const cor = STATUS_ACO[a.status];
          const pct = Math.round(a.realizadas_2026 / a.meta_ano * 100);
          return (
            <div key={i} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{a.acao}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: cor, flexShrink: 0, marginLeft: 10 }}>{a.realizadas_2026}/{a.meta_ano}</span>
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 6, height: 7 }}>
                <div style={{ background: cor, height: "100%", width: `${Math.min(100,pct)}%`, borderRadius: 6 }}/>
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{pct}% da meta anual</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type Aba = "dashboard"|"agravos"|"setores"|"acoes";

export default function SaudeTrabalhador() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dashRaw } = useQuery({ queryKey: ["trab-dash"],  queryFn: () => apiGet("/api/saude-trabalhador/dashboard") as Promise<any> });
  const { data: hist }    = useQuery({ queryKey: ["trab-hist"],  queryFn: () => apiGet("/api/saude-trabalhador/agravos"),   enabled: false });
  const { data: agravos } = useQuery({ queryKey: ["trab-agr"],   queryFn: () => apiGet("/api/saude-trabalhador/agravos")   as Promise<any[]>, enabled: aba==="agravos" });
  const { data: setores } = useQuery({ queryKey: ["trab-set"],   queryFn: () => apiGet("/api/saude-trabalhador/setores")   as Promise<any[]>, enabled: aba==="setores"||aba==="dashboard" });
  const { data: acoes }   = useQuery({ queryKey: ["trab-aco"],   queryFn: () => apiGet("/api/saude-trabalhador/acoes")     as Promise<any[]>, enabled: aba==="acoes" });

  const dash = dashRaw && setores ? {
    ...dashRaw,
    setores_chart: setores.map(s => ({ setor: s.setor, taxa: s.taxa_acidente, risco: s.risco })),
  } : null;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "agravos",   label: `Agravos (${dashRaw?.agravos_2026 ?? 0})` },
    { id: "setores",   label: "Setores" },
    { id: "acoes",     label: "Ações CEREST" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#92400e 0%,#1d4ed8 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Saúde do Trabalhador</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>CEREST · RENAST · CAT · Agrotóxicos · FMS Apuí/AM</p>
          </div>
          {dashRaw && (
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.agravos_2026}</div>
              <div style={{ fontSize: 10, opacity: .8 }}>agravos 2026</div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #fef3c7" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #92400e":"2px solid transparent", color: aba===a.id?"#92400e":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard" && <AbaDashboard dash={dash}/>}
        {aba==="agravos"   && <AbaAgravos agravos={agravos}/>}
        {aba==="setores"   && <AbaSetores setores={setores}/>}
        {aba==="acoes"     && <AbaAcoes acoes={acoes}/>}
      </div>
    </div>
  );
}
