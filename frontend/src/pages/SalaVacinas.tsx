import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PainelVacinacao from "./PainelVacinacao";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, ReferenceLine, Cell,
} from "recharts";
import { Syringe, Thermometer, AlertTriangle, CheckCircle, Package } from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };

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

// ── Dashboard ─────────────────────────────────────────────────────────────────
function AbaDashboard({ dash }: { dash: any }) {
  if (!dash) return <NaoDisponivelBanner nota="Dados indisponíveis. Integração não configurada no Railway. Nenhum valor foi inventado." />;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Imunobiológicos"     value={dash.total_imunobiol}    sub="no estoque"                    cor="#1d4ed8" icon={<Syringe size={14} color="#1d4ed8"/>}/>
        <KpiCard label="Doses aplicadas/mês" value={dash.doses_aplicadas_mes} sub={dash.competencia}             cor="#7c3aed" icon={<Syringe size={14} color="#7c3aed"/>}/>
        <KpiCard label="Cobertura média"     value={`${dash.cobertura_media}%`} sub="todas vacinas"              cor={dash.cobertura_media>=90?"#16a34a":"#d97706"} icon={<CheckCircle size={14} color={dash.cobertura_media>=90?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="Abaixo da meta"      value={dash.n_abaixo_meta}       sub="vacinas críticas"             cor={dash.n_abaixo_meta>0?"#dc2626":"#16a34a"} icon={<AlertTriangle size={14} color={dash.n_abaixo_meta>0?"#dc2626":"#16a34a"}/>}/>
        <KpiCard label="Temp. câmara atual"  value={`${dash.temp_atual_camera}°C`} sub={dash.n_temp_alerta>0?"⚠ ALERTA":"✓ OK"} cor={dash.n_temp_alerta>0?"#dc2626":"#16a34a"} icon={<Thermometer size={14} color={dash.n_temp_alerta>0?"#dc2626":"#16a34a"}/>}/>
      </div>

      {dash.n_temp_alerta > 0 && (
        <div style={{ background: "#fff7f7", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 16px", marginBottom: 18, display: "flex", gap: 10 }}>
          <AlertTriangle size={14} color="#dc2626" style={{ marginTop: 2, flexShrink: 0 }}/>
          <span style={{ fontSize: 12, color: "#7f1d1d" }}>
            <strong>Alerta de temperatura!</strong> A vacina <strong>{dash.temp_alerta.join(", ")}</strong> está fora da faixa ideal de armazenamento. Verificar imediatamente a câmara de refrigeração.
          </span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Doses aplicadas — últimos 6 meses</div>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dash.historico_mensal} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="doses" name="Doses" fill="#7c3aed" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Alertas de estoque</div>
          {dash.estoque_critico.length > 0 ? (
            <div>
              {dash.estoque_critico.map((v: string) => (
                <div key={v} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid #fef2f2", alignItems: "center" }}>
                  <Package size={12} color="#dc2626"/>
                  <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>{v}</span>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>— estoque crítico</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "#16a34a" }}>✓ Todos estoques acima do mínimo</div>
          )}
          <div style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Próximos a vencer (até Jul/26)</div>
          {dash.proximos_vencer.map((v: string) => (
            <div key={v} style={{ fontSize: 12, color: "#d97706", padding: "3px 0" }}>⚠ {v}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Estoque ───────────────────────────────────────────────────────────────────
function AbaEstoque({ estoque }: { estoque: any[] | undefined }) {
  if (!estoque) return <NaoDisponivelBanner nota="Dados indisponíveis. Nenhum valor foi inventado." />;
  return (
    <div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#7c3aed", color: "#fff" }}>
              <th style={{ padding: "9px 14px", textAlign: "left" }}>Vacina</th>
              <th style={{ padding: "9px 10px", textAlign: "left" }}>Lote</th>
              <th style={{ padding: "9px 10px", textAlign: "left" }}>Validade</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Estoque</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Mínimo</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Temp.</th>
              <th style={{ padding: "9px 10px", textAlign: "left" }}>Público-alvo</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>Estoque</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>Temp.</th>
            </tr>
          </thead>
          <tbody>
            {estoque.map((v, i) => {
              const corEst = v.status_estoque === "critico" ? "#dc2626" : v.status_estoque === "atencao" ? "#d97706" : "#16a34a";
              const corTmp = v.status_temp === "alerta" ? "#dc2626" : "#16a34a";
              return (
                <tr key={v.id} style={{ borderTop: "1px solid #f3f4f6", background: v.status_estoque === "critico" || v.status_temp === "alerta" ? "#fff7f7" : i%2===0?"#fff":"#f9fafb" }}>
                  <td style={{ padding: "9px 14px", fontWeight: 600 }}>{v.vacina}</td>
                  <td style={{ padding: "9px 10px", fontSize: 11, color: "#6b7280" }}>{v.lote}</td>
                  <td style={{ padding: "9px 10px", color: v.validade <= "2026-07-31" ? "#d97706" : "#374151" }}>{v.validade}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 700, color: corEst }}>{v.doses_estoque}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right", color: "#9ca3af" }}>{v.doses_min}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right", color: corTmp, fontWeight: v.status_temp === "alerta" ? 700 : 400 }}>{v.temp_atual}°C</td>
                  <td style={{ padding: "9px 10px", fontSize: 11, color: "#6b7280" }}>{v.publico}</td>
                  <td style={{ padding: "9px 10px", textAlign: "center" }}>
                    <span style={{ background: corEst+"15", color: corEst, fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>
                      {v.status_estoque === "critico" ? "Crítico" : v.status_estoque === "atencao" ? "Atenção" : "OK"}
                    </span>
                  </td>
                  <td style={{ padding: "9px 10px", textAlign: "center" }}>
                    {v.status_temp === "alerta"
                      ? <span style={{ background: "#fff7f7", color: "#dc2626", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>⚠ ALERTA</span>
                      : <span style={{ color: "#16a34a", fontSize: 12 }}>✓</span>}
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

// ── Temperatura ───────────────────────────────────────────────────────────────
function AbaTemperatura({ tempData }: { tempData: any }) {
  if (!tempData) return <NaoDisponivelBanner nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />;
  const alertas = tempData.historico_24h.filter((h: any) => h.temp > 8 || h.temp < 2);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 22 }}>
        <div style={{ background: tempData.alerta ? "#fff7f7" : "#f0fdf4", border: `1px solid ${tempData.alerta ? "#fca5a5" : "#bbf7d0"}`, borderRadius: 10, padding: "16px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: tempData.alerta ? "#dc2626" : "#16a34a" }}>{tempData.atual}°C</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Temperatura atual câmara principal</div>
        </div>
        <div style={{ background: "#eff6ff", borderRadius: 10, padding: "16px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1d4ed8" }}>2°C a 8°C</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Faixa ideal refrigeradas</div>
        </div>
        <div style={{ background: alertas.length > 0 ? "#fff7f7" : "#f0fdf4", borderRadius: 10, padding: "16px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: alertas.length > 0 ? "#dc2626" : "#16a34a" }}>{alertas.length}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Leituras fora da faixa (24h)</div>
        </div>
      </div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Monitoramento de temperatura — últimas 24 horas (câmara principal)</div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={tempData.historico_24h}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="hora" tick={{ fontSize: 9 }}/>
              <YAxis domain={[-2, 14]} tick={{ fontSize: 10 }}/>
              <Tooltip contentStyle={TT} formatter={(v: number) => [`${v}°C`, "Temperatura"]}/>
              <ReferenceLine y={8} stroke="#dc2626" strokeDasharray="4 2" label={{ value:"Máx 8°C", fontSize:10, fill:"#dc2626" }}/>
              <ReferenceLine y={2} stroke="#1d4ed8" strokeDasharray="4 2" label={{ value:"Mín 2°C", fontSize:10, fill:"#1d4ed8" }}/>
              <Line type="monotone" dataKey="temp" stroke="#7c3aed" strokeWidth={2.5} dot={false} name="Temp °C"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        {alertas.length > 0 && (
          <div style={{ marginTop: 12, background: "#fff7f7", border: "1px solid #fca5a5", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "#7f1d1d" }}>
            <strong>Excursões de temperatura detectadas:</strong> {alertas.map((a: any) => `${a.hora} (${a.temp}°C)`).join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Cobertura ─────────────────────────────────────────────────────────────────
function AbaCobertura({ cob }: { cob: any }) {
  if (!cob) return <NaoDisponivelBanner nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />;
  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Cobertura vacinal por imunobiológico</div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cob.por_vacina} layout="vertical" barSize={10}>
              <XAxis type="number" domain={[0,100]} tick={{ fontSize: 9 }}/>
              <YAxis type="category" dataKey="vacina" tick={{ fontSize: 9 }} width={140}/>
              <Tooltip contentStyle={TT} formatter={(v: number) => [`${v}%`, "Cobertura"]}/>
              <ReferenceLine x={90} stroke="#d97706" strokeDasharray="4 2"/>
              <Bar dataKey="cobertura" name="Cobertura" radius={[0,4,4,0]}>
                {cob.por_vacina.map((v: any, i: number) => <Cell key={i} fill={v.status === "ok" ? "#16a34a" : "#dc2626"}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ background: "#fff7f7", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 16px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", marginBottom: 8 }}>Vacinas abaixo da meta</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {cob.por_vacina.filter((v: any) => v.status !== "ok").map((v: any) => (
            <span key={v.vacina} style={{ background: "#fff", border: "1px solid #fca5a5", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#dc2626" }}>
              {v.vacina}: <strong>{v.cobertura}%</strong> (meta {v.meta}%)
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

type Aba = "dashboard"|"estoque"|"temperatura"|"cobertura"|"painel";

export default function SalaVacinas() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash }   = useQuery({ queryKey:["vac-dash"],   queryFn:()=>apiGet("/api/vacinas/dashboard") as Promise<any> });
  const { data: estoque = []}= useQuery({ queryKey:["vac-est"],    queryFn:()=>apiGet("/api/vacinas/estoque") as Promise<any[]>, enabled:aba==="estoque" });
  const { data: temp }   = useQuery({ queryKey:["vac-temp"],   queryFn:()=>apiGet("/api/vacinas/temperatura") as Promise<any>, enabled:aba==="temperatura" });
  const { data: cob }    = useQuery({ queryKey:["vac-cob"],    queryFn:()=>apiGet("/api/vacinas/cobertura") as Promise<any>, enabled:aba==="cobertura" });

  const ABAS: {id:Aba;label:string}[] = [
    {id:"dashboard",   label:"Dashboard"},
    {id:"estoque",     label:"Estoque"},
    {id:"temperatura", label:"Temperatura"},
    {id:"cobertura",   label:"Cobertura Vacinal"},
    {id:"painel",      label:"Painel SIPNI"},
  ];

  return (
    <div style={{ padding:"0 0 32px", fontFamily:"system-ui,sans-serif" }}>
      <div style={{ background:"linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color:"#fff", padding:"20px 24px 16px", borderRadius:"0 0 16px 16px", marginBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, margin:"0 0 4px" }}>Sala de Vacinas — PNI</h1>
            <p style={{ fontSize:13, opacity:.85, margin:0 }}>Controle de estoque, temperatura e cobertura · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ background:"rgba(255,255,255,.15)", borderRadius:8, padding:"8px 14px", textAlign:"center" }}>
              <div style={{ fontSize:20, fontWeight:900 }}>{dash.cobertura_media}%</div>
              <div style={{ fontSize:10, opacity:.8 }}>cobertura média</div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding:"0 24px" }}>
        <div style={{ display:"flex", gap:2, marginBottom:24, borderBottom:"2px solid #dbeafe" }}>
          {ABAS.map(a=>(
            <button key={a.id} onClick={()=>setAba(a.id)} style={{ padding:"9px 18px", border:"none", background:"none", cursor:"pointer", fontSize:13, borderBottom:aba===a.id?"3px solid #1351b4":"2px solid transparent", color:aba===a.id?"#7c3aed":"#6b7280", fontWeight:aba===a.id?700:400, marginBottom:-2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard" && !dash && <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />}
        {aba==="dashboard"   && <AbaDashboard dash={dash}/>}
        {aba==="estoque"     && <AbaEstoque estoque={estoque}/>}
        {aba==="temperatura" && <AbaTemperatura tempData={temp}/>}
        {aba==="cobertura"   && <AbaCobertura cob={cob}/>}
        {aba==="painel"      && <PainelVacinacao/>}
      </div>
    </div>
  );
}
