import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell,
} from "recharts";
import { Truck, MapPin, DollarSign, Calendar, AlertTriangle } from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import { BRL, BRL_AXIS, PCT } from "../lib/fmt";

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };

function KpiCard({ label, value, sub, cor, icon }: { label: string; value: string | number; sub?: string; cor: string; icon: React.ReactNode }) {
  return (
    <div style={{ background:"#fff", border:`1px solid ${cor}22`, borderTop:`3px solid ${cor}`, borderRadius:10, padding:"13px 16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:5 }}>
        <span style={{ fontSize:11, color:"#6b7280" }}>{label}</span>
        <div style={{ background:`${cor}15`, borderRadius:6, padding:5 }}>{icon}</div>
      </div>
      <div style={{ fontSize:22, fontWeight:800, color:cor, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"#9ca3af", marginTop:3 }}>{sub}</div>}
    </div>
  );
}

const FROTA_STATUS_COR: Record<string,string> = { operacional:"#16a34a", manutencao:"#dc2626", aguardando_peca:"#d97706" };
const FROTA_STATUS_LABEL: Record<string,string> = { operacional:"Operacional", manutencao:"Manutenção", aguardando_peca:"Aguard. peça" };
const VIAGEM_COR: Record<string,string> = { realizada:"#16a34a", agendada:"#0891b2", cancelada:"#dc2626" };
const ESP_CORES = ["#dc2626","#d97706","#0891b2","#7c3aed","#16a34a"];

// ── Dashboard ─────────────────────────────────────────────────────────────────
function AbaDashboard({ dash }: { dash: any }) {
  if (!dash) return <NaoDisponivelBanner nota="Dados indisponíveis. Integração não configurada no Railway. Nenhum valor foi inventado." />;
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:22 }}>
        <KpiCard label="Frota operacional"    value={`${dash.frota_operacional}/${dash.total_frota}`}  sub="veículos disponíveis"   cor="#16a34a" icon={<Truck size={14} color="#16a34a"/>}/>
        <KpiCard label="Viagens realizadas"   value={dash.viagens_realizadas_mes}                     sub="Abr/2026"               cor="#1d4ed8" icon={<MapPin size={14} color="#1d4ed8"/>}/>
        <KpiCard label="Viagens agendadas"    value={dash.viagens_agendadas}                          sub="próximas"               cor="#0891b2" icon={<Calendar size={14} color="#0891b2"/>}/>
        <KpiCard label="KM rodados"           value={dash.km_total_mes.toLocaleString("pt-BR")}       sub="no mês"                 cor="#7c3aed" icon={<Truck size={14} color="#7c3aed"/>}/>
        <KpiCard label="Custo estimado"       value={BRL(dash.custo_estimado_mes)} sub="combustível+motorista" cor="#d97706" icon={<DollarSign size={14} color="#d97706"/>}/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:18 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>Destinos no mês</div>
          <div style={{ display:"flex", gap:18, marginBottom:12 }}>
            {[["Manaus", dash.destinos.manaus, "#1d4ed8"],["Humaitá", dash.destinos.humaita, "#0891b2"]].map(([d,n,c])=>(
              <div key={String(d)} style={{ flex:1, background:`${c}08`, border:`1px solid ${c}22`, borderRadius:8, padding:"10px 14px", textAlign:"center" }}>
                <div style={{ fontSize:26, fontWeight:800, color:String(c) }}>{n}</div>
                <div style={{ fontSize:12, color:"#6b7280" }}>{d}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>Top especialidades</div>
          {dash.top_especialidades.map((e: any, i: number) => (
            <div key={e.esp} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid #f3f4f6", fontSize:13 }}>
              <span style={{ color:"#374151" }}>{e.esp}</span>
              <span style={{ fontWeight:700, color:ESP_CORES[i%ESP_CORES.length] }}>{e.n} viagens</span>
            </div>
          ))}
        </div>
        <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:18 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>Custo mensal (R$)</div>
          <div style={{ height:200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dash.historico_mensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize:9 }}/>
                <YAxis tick={{ fontSize:10 }} tickFormatter={v=>`${BRL(v)}`}/>
                <Tooltip contentStyle={TT} formatter={(v:number)=>[`R$ ${v.toLocaleString("pt-BR")}`, "Custo"]}/>
                <Line type="monotone" dataKey="custo" stroke="#d97706" strokeWidth={2.5} dot={{ r:4 }} name="Custo"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Frota ─────────────────────────────────────────────────────────────────────
function AbaFrota({ frota }: { frota: any[] | undefined }) {
  if (!frota) return <NaoDisponivelBanner nota="Dados n�o dispon�veis no momento. Integra��o pendente de configura��o no Railway." />;
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
        {[["#16a34a","operacional","Operacionais"],["#dc2626","manutencao","Em manutenção"],["#d97706","aguardando_peca","Aguard. peça"]].map(([c,s,l])=>(
          <div key={String(s)} style={{ background:"#fff", border:`1px solid ${c}22`, borderTop:`3px solid ${c}`, borderRadius:10, padding:"12px 16px", textAlign:"center" }}>
            <div style={{ fontSize:28, fontWeight:800, color:String(c) }}>{frota.filter(f=>f.status===s).length}</div>
            <div style={{ fontSize:12, color:"#6b7280" }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ border:"1px solid #e5e7eb", borderRadius:8, overflow:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ background:"#1d4ed8", color:"#fff" }}>
              <th style={{ padding:"9px 14px", textAlign:"left" }}>Placa</th>
              <th style={{ padding:"9px 10px", textAlign:"left" }}>Tipo</th>
              <th style={{ padding:"9px 10px", textAlign:"left" }}>Marca/Ano</th>
              <th style={{ padding:"9px 10px", textAlign:"left" }}>Base</th>
              <th style={{ padding:"9px 10px", textAlign:"right" }}>KM atual</th>
              <th style={{ padding:"9px 10px", textAlign:"right" }}>Cap.</th>
              <th style={{ padding:"9px 10px", textAlign:"left" }}>Próx. revisão</th>
              <th style={{ padding:"9px 10px", textAlign:"center" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {frota.map((f, i) => {
              const cor = FROTA_STATUS_COR[f.status] || "#6b7280";
              return (
                <tr key={f.id} style={{ borderTop:"1px solid #f3f4f6", background:f.status!=="operacional"?"#fff7f7":i%2===0?"#fff":"#f9fafb" }}>
                  <td style={{ padding:"9px 14px", fontWeight:700 }}>{f.placa}</td>
                  <td style={{ padding:"9px 10px", color:"#374151" }}>{f.tipo}</td>
                  <td style={{ padding:"9px 10px", color:"#6b7280" }}>{f.marca} ({f.ano})</td>
                  <td style={{ padding:"9px 10px", color:"#374151" }}>{f.base}</td>
                  <td style={{ padding:"9px 10px", textAlign:"right", color:"#6b7280" }}>{f.km.toLocaleString("pt-BR")}</td>
                  <td style={{ padding:"9px 10px", textAlign:"right", color:"#9ca3af" }}>{f.capacidade}</td>
                  <td style={{ padding:"9px 10px", fontSize:11, color:f.proxima_rev<"2026-07-01"?"#d97706":"#6b7280" }}>{f.proxima_rev}</td>
                  <td style={{ padding:"9px 10px", textAlign:"center" }}>
                    <span style={{ background:cor+"15", color:cor, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:4 }}>{FROTA_STATUS_LABEL[f.status]}</span>
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

// ── Viagens ───────────────────────────────────────────────────────────────────
function AbaViagens({ viagens }: { viagens: any[] | undefined }) {
  const [filtro, setFiltro] = useState("todos");
  if (!viagens) return <NaoDisponivelBanner nota="Dados n�o dispon�veis no momento. Integra��o pendente de configura��o no Railway." />;
  const lista = filtro==="todos" ? viagens : viagens.filter(v=>v.status===filtro);
  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:14 }}>
        <select value={filtro} onChange={e=>setFiltro(e.target.value)} style={{ padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:6, fontSize:13 }}>
          <option value="todos">Todos status</option>
          <option value="realizada">Realizadas</option>
          <option value="agendada">Agendadas</option>
        </select>
        <div style={{ fontSize:12, color:"#9ca3af", alignSelf:"center" }}>{lista.length} viagens</div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {lista.map(v => {
          const custo = v.km_total * v.custo_km;
          const cor   = VIAGEM_COR[v.status] || "#6b7280";
          return (
            <div key={v.id} style={{ background:"#fff", border:`1px solid ${v.status==="agendada"?"#374151":"#e5e7eb"}`, borderLeft:`4px solid ${cor}`, borderRadius:8, padding:"12px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700 }}>Paciente: {v.paciente} — <span style={{ color:"#0891b2" }}>{v.especialidade}</span></div>
                  <div style={{ fontSize:12, color:"#6b7280", marginTop:3, display:"flex", gap:16 }}>
                    <span><MapPin size={11} style={{ display:"inline", marginRight:3 }}/>{v.destino}</span>
                    <span><Calendar size={11} style={{ display:"inline", marginRight:3 }}/>{v.data}</span>
                    <span>Veículo: <strong>{v.veiculo}</strong></span>
                    <span>Motorista: <strong>{v.motorista}</strong></span>
                    <span>Acomp.: {v.acomp}</span>
                    <span>KM: {v.km_total.toLocaleString("pt-BR")} · <strong style={{ color:"#d97706" }}>R$ {custo.toLocaleString("pt-BR",{minimumFractionDigits:0})}</strong></span>
                  </div>
                </div>
                <span style={{ background:cor+"15", color:cor, fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:4, flexShrink:0 }}>
                  {v.status==="realizada"?"Realizada":"Agendada"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type Aba = "dashboard"|"frota"|"viagens";

export default function TransporteSanitario() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash }    = useQuery({ queryKey:["ts-dash"],   queryFn:()=>apiGet("/api/transporte-sanitario/dashboard") as Promise<any> });
  const { data: frota }   = useQuery({ queryKey:["ts-frota"],  queryFn:()=>apiGet("/api/transporte-sanitario/frota") as Promise<any[]>,   enabled:aba==="frota" });
  const { data: viagens } = useQuery({ queryKey:["ts-viagens"],queryFn:()=>apiGet("/api/transporte-sanitario/viagens") as Promise<any[]>, enabled:aba==="viagens" });

  const ABAS: { id: Aba; label: string }[] = [
    { id:"dashboard", label:"Dashboard" },
    { id:"frota",     label:"Frota" },
    { id:"viagens",   label:"Viagens / TFD" },
  ];

  return (
    <div style={{ padding:"0 0 32px", fontFamily:"system-ui,sans-serif" }}>
      <div style={{ background:"linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color:"#fff", padding:"20px 24px 16px", borderRadius:"0 0 16px 16px", marginBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, margin:"0 0 4px" }}>Transporte Sanitário / TFD</h1>
            <p style={{ fontSize:13, opacity:.85, margin:0 }}>Tratamento Fora do Domicílio · Gestão de frota · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ background:"rgba(255,255,255,.15)", borderRadius:8, padding:"8px 14px", textAlign:"center" }}>
              <div style={{ fontSize:20, fontWeight:900 }}>{dash.viagens_realizadas_mes}</div>
              <div style={{ fontSize:10, opacity:.8 }}>viagens/mês</div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding:"0 24px" }}>
        <div style={{ display:"flex", gap:2, marginBottom:24, borderBottom:"2px solid #dbeafe" }}>
          {ABAS.map(a=>(
            <button key={a.id} onClick={()=>setAba(a.id)} style={{ padding:"9px 18px", border:"none", background:"none", cursor:"pointer", fontSize:13, borderBottom:aba===a.id?"2px solid #1d4ed8":"2px solid transparent", color:aba===a.id?"#1d4ed8":"#6b7280", fontWeight:aba===a.id?700:400, marginBottom:-2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard" && !dash && <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />}
        {aba==="dashboard" && <AbaDashboard dash={dash}/>}
        {aba==="frota"     && <AbaFrota frota={frota}/>}
        {aba==="viagens"   && <AbaViagens viagens={viagens}/>}
      </div>
    </div>
  );
}
