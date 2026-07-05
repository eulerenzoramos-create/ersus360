import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from "recharts";
import { Activity, AlertTriangle, Truck, Clock } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#1e293b", border: "none", borderRadius: 6, color: "#f8fafc" };
const MANCHESTER_CORES: Record<string, string> = { vermelho: "#dc2626", laranja: "#d97706", amarelo: "#ca8a04", verde: "#16a34a", azul: "#1d4ed8" };
const MANCHESTER_LABEL: Record<string, string> = { vermelho: "Emergência", laranja: "Muito urgente", amarelo: "Urgente", verde: "Pouco urgente", azul: "Não urgente" };
const FROTA_COR: Record<string, string> = { operacional: "#16a34a", manutencao: "#dc2626" };
const TEND_COR: Record<string, string> = { alta: "#dc2626", estavel: "#16a34a" };

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
  const manchChart = [
    { name: "Vermelho",  n: dash.ult_vermelho||0,  cor: "#dc2626" },
    { name: "Laranja",   n: dash.ult_laranja||0,   cor: "#d97706" },
    { name: "Amarelo",   n: dash.ult_amarelo||0,   cor: "#ca8a04" },
    { name: "Verde",     n: dash.ult_verde||0,     cor: "#16a34a" },
    { name: "Azul",      n: dash.ult_azul||0,      cor: "#1d4ed8" },
  ];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Atendimentos/mês"   value={dash.atendimentos_mes}     sub="UPA Mar/26"            cor="#1d4ed8" icon={<Activity size={14} color="#1d4ed8"/>}/>
        <KpiCard label="Críticos (R+O)"     value={dash.criticos_mes}         sub="vermelho + laranja"     cor="#dc2626" icon={<AlertTriangle size={14} color="#dc2626"/>}/>
        <KpiCard label="Transferências"     value={dash.transferencias_mes}   sub="para Manaus/Humaitá"    cor="#d97706" icon={<Truck size={14} color="#d97706"/>}/>
        <KpiCard label="SAMU ocorrências"   value={dash.samu_ocorrencias_mes} sub="Mar/26"                 cor="#7c3aed" icon={<Truck size={14} color="#7c3aed"/>}/>
        <KpiCard label="Tempo resposta"     value={dash.tempo_resposta_samu+"min"} sub={`frota ${dash.frota_disponivel}/${dash.frota_total}`} cor={dash.tempo_resposta_samu>15?"#d97706":"#16a34a"} icon={<Clock size={14} color={dash.tempo_resposta_samu>15?"#d97706":"#16a34a"}/>}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Classificação Manchester — Mar/26</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={manchChart} barSize={44}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="n" name="Atendimentos" radius={[4,4,0,0]}>
                  {manchChart.map((m, i) => <Cell key={i} fill={m.cor}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Atendimentos UPA — 6 meses</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dash.historico_ue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Line type="monotone" dataKey="atendimentos"            stroke="#1d4ed8" strokeWidth={2.5} dot={{ r: 3 }} name="Atend. total"/>
                <Line type="monotone" dataKey="transferencias"          stroke="#d97706" strokeWidth={1.5} dot={false}   name="Transferências"/>
                <Line type="monotone" dataKey="procedimentos_cirurgicos" stroke="#7c3aed" strokeWidth={1.5} dot={false}  name="Cirurgias"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function AbaManchester({ atend }: { atend: any[] | undefined }) {
  if (!atend) return null;
  const ult = atend[atend.length - 1];
  const total = ult.atendimentos;
  const cores = ["vermelho","laranja","amarelo","verde","azul"];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 20 }}>
        {cores.map(c => {
          const n = ult[`manchester_${c}`];
          const cor = MANCHESTER_CORES[c];
          return (
            <div key={c} style={{ background: "#fff", border: `2px solid ${cor}`, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: cor }}>{n}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: cor }}>{c.charAt(0).toUpperCase()+c.slice(1)}</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>{MANCHESTER_LABEL[c]}</div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>{Math.round(n/total*100)}%</div>
            </div>
          );
        })}
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#1d4ed8", color: "#fff" }}>
              {["Mês","Total","Vermelho","Laranja","Amarelo","Verde","Azul","Cirurgias","Transfer.","Óbitos"].map(h=>(
                <th key={h} style={{ padding: "8px 10px", textAlign: h==="Mês"?"left":"center" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {atend.map((m, i) => (
              <tr key={m.mes} style={{ borderTop: "1px solid #f3f4f6", background: i%2===0?"#fff":"#f9fafb" }}>
                <td style={{ padding: "8px 10px", fontWeight: 600 }}>{m.mes}</td>
                <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, color: "#1d4ed8" }}>{m.atendimentos}</td>
                <td style={{ padding: "8px 10px", textAlign: "center", color: "#dc2626", fontWeight: 700 }}>{m.manchester_vermelho}</td>
                <td style={{ padding: "8px 10px", textAlign: "center", color: "#d97706" }}>{m.manchester_laranja}</td>
                <td style={{ padding: "8px 10px", textAlign: "center", color: "#ca8a04" }}>{m.manchester_amarelo}</td>
                <td style={{ padding: "8px 10px", textAlign: "center", color: "#16a34a" }}>{m.manchester_verde}</td>
                <td style={{ padding: "8px 10px", textAlign: "center", color: "#1d4ed8" }}>{m.manchester_azul}</td>
                <td style={{ padding: "8px 10px", textAlign: "center", color: "#7c3aed" }}>{m.procedimentos_cirurgicos}</td>
                <td style={{ padding: "8px 10px", textAlign: "center", color: "#d97706" }}>{m.transferencias}</td>
                <td style={{ padding: "8px 10px", textAlign: "center", color: m.obitos_ue>0?"#dc2626":"#9ca3af" }}>{m.obitos_ue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AbaSamu({ dados }: { dados: any }) {
  if (!dados) return null;
  const { ocorrencias, frota } = dados;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>SAMU — ocorrências e tempo resposta</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ocorrencias} barSize={18}>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="left" tick={{ fontSize: 10 }}/>
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} unit="min"/>
                <Tooltip contentStyle={TT}/>
                <Bar yAxisId="left"  dataKey="ocorrencias"          name="Ocorrências" fill="#7c3aed" radius={[4,4,0,0]}/>
                <Bar yAxisId="left"  dataKey="suporte_avancado"      name="USA (SAV)"   fill="#dc2626" radius={[4,4,0,0]}/>
                <Line yAxisId="right" type="monotone" dataKey="tempo_resposta_med_min" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} name="T. resposta (min)"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Frota SAMU</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {frota.map((v: any) => {
              const cor = FROTA_COR[v.status];
              return (
                <div key={v.veiculo} style={{ border: `1px solid ${cor}22`, borderLeft: `3px solid ${cor}`, borderRadius: 6, padding: "10px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{v.veiculo}</div>
                    <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{v.status}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>Placa: {v.placa} · KM/mês: {v.km_rodados_mes.toLocaleString("pt-BR")} · Últ. manut.: {v.ultima_manutencao}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function AbaCausas({ causas }: { causas: any[] | undefined }) {
  if (!causas) return null;
  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Causas de atendimento UPA — Mar/26</div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={causas} layout="vertical" barSize={16}>
              <XAxis type="number" tick={{ fontSize: 9 }} unit="%"/>
              <YAxis type="category" dataKey="causa" tick={{ fontSize: 9 }} width={160}/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="pct" name="% atendimentos" fill="#1d4ed8" radius={[0,4,4,0]}>
                {causas.map((c, i) => <Cell key={i} fill={c.tendencia==="alta"?"#dc2626":"#1d4ed8"}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {causas.filter(c=>c.causa!=="Outras causas").map((c, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: TEND_COR[c.tendencia] }}>{c.pct}%</div>
            <div style={{ fontSize: 12, color: "#374151", marginBottom: 3 }}>{c.causa}</div>
            <span style={{ background: TEND_COR[c.tendencia]+"15", color: TEND_COR[c.tendencia], fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3 }}>
              {c.tendencia === "alta" ? "↑ Alta" : "→ Estável"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

type Aba = "dashboard"|"manchester"|"samu"|"causas";

export default function UrgenciaEmergencia() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dashRaw } = useQuery({ queryKey: ["ue-dash"],  queryFn: () => apiGet("/api/urgencia-emergencia/dashboard")   as Promise<any> });
  const { data: atend }   = useQuery({ queryKey: ["ue-atend"], queryFn: () => apiGet("/api/urgencia-emergencia/atendimentos") as Promise<any[]>, enabled: aba==="manchester"||aba==="dashboard" });
  const { data: samu }    = useQuery({ queryKey: ["ue-samu"],  queryFn: () => apiGet("/api/urgencia-emergencia/samu")         as Promise<any>,   enabled: aba==="samu" });
  const { data: causas }  = useQuery({ queryKey: ["ue-caus"],  queryFn: () => apiGet("/api/urgencia-emergencia/causas")       as Promise<any[]>, enabled: aba==="causas" });

  const ult = atend?.[atend.length - 1];
  const dash = dashRaw && ult ? {
    ...dashRaw,
    ult_vermelho: ult.manchester_vermelho,
    ult_laranja:  ult.manchester_laranja,
    ult_amarelo:  ult.manchester_amarelo,
    ult_verde:    ult.manchester_verde,
    ult_azul:     ult.manchester_azul,
    historico_ue: atend,
  } : null;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",  label: "Dashboard" },
    { id: "manchester", label: `Manchester (${(dashRaw as any)?.atendimentos_mes ?? 0}/mês)` },
    { id: "samu",       label: `SAMU (${(dashRaw as any)?.samu_ocorrencias_mes ?? 0} ocorr.)` },
    { id: "causas",     label: "Causas" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#dc2626 0%,#1d4ed8 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Urgência e Emergência</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>UPA · SAMU · Manchester · Rede de Urgências · FMS Apuí/AM</p>
          </div>
          {dashRaw && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{(dashRaw as any).atendimentos_mes}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>atend./mês</div>
              </div>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{(dashRaw as any).tempo_resposta_samu}min</div>
                <div style={{ fontSize: 10, opacity: .8 }}>SAMU resposta</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #fee2e2" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #dc2626":"2px solid transparent", color: aba===a.id?"#dc2626":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard"  && <AbaDashboard dash={dash}/>}
        {aba==="manchester" && <AbaManchester atend={atend}/>}
        {aba==="samu"       && <AbaSamu dados={samu}/>}
        {aba==="causas"     && <AbaCausas causas={causas}/>}
      </div>
    </div>
  );
}
