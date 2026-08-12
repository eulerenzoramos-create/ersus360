import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { apiGet } from "../lib/api"
import { FlaskConical } from "lucide-react"

const BRAND="#dbeafe", ACCENT="#1d4ed8", OK="#16a34a", WARN="#d97706", CRIT="#dc2626"
const ABAS=["Dashboard","RAMs","Desvios Qualidade","Histórico","Indicadores"]
const sc=(s:string)=>s==="ok"?OK:s==="atencao"?WARN:CRIT
const GR_COR:Record<string,string>={grave:CRIT,moderada:WARN,leve:OK}
function KPI({label,value,sub,color=BRAND}:{label:string;value:string|number;sub?:string;color?:string}){
  return <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,padding:"14px 18px",minWidth:130}}>
    <div style={{fontSize:11,color:"#6b7280",marginBottom:4}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{sub}</div>}
  </div>
}
export default function FarmacovigilanciaApui(){
  const [aba,setAba]=useState("Dashboard")
  const dash=useQuery({queryKey:["fv-dash"], queryFn:()=>apiGet("/api/farmacovigilancia-apui/dashboard"),        enabled:aba==="Dashboard"})
  const rams=useQuery({queryKey:["fv-rams"], queryFn:()=>apiGet("/api/farmacovigilancia-apui/rams"),              enabled:aba==="RAMs"})
  const dq  =useQuery({queryKey:["fv-dq"],   queryFn:()=>apiGet("/api/farmacovigilancia-apui/desvios-qualidade"), enabled:aba==="Desvios Qualidade"})
  const hist=useQuery({queryKey:["fv-hist"], queryFn:()=>apiGet("/api/farmacovigilancia-apui/historico"),         enabled:aba==="Histórico"})
  const ind =useQuery({queryKey:["fv-ind"],  queryFn:()=>apiGet("/api/farmacovigilancia-apui/indicadores"),       enabled:aba==="Indicadores"})
  const d=dash.data as any, r=rams.data as any, q=dq.data as any, h=hist.data as any, i=ind.data as any
  return(
    <div style={{padding:"24px 32px",fontFamily:"Inter,sans-serif",background:"#f8fafc",minHeight:"100vh"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <FlaskConical size={28} color={ACCENT}/>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:BRAND}}>Farmacovigilância</div>
          <div style={{fontSize:12,color:"#6b7280"}}>RAMs · Desvios de Qualidade · NOTIVISA — Apuí/AM</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:24}}>
        {ABAS.map(a=><button key={a} onClick={()=>setAba(a)} style={{padding:"6px 18px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:aba===a?ACCENT:"#e5e7eb",color:aba===a?"#fff":"#374151"}}>{a}</button>)}
      </div>

      {aba==="Dashboard"&&!d&&<NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />}
      {aba==="Dashboard"&&d&&(
        <div>
          <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:20}}>
            <KPI label="Notificações RAM 2025"    value={`${d.notificacoes_ram_2025}/${d.notificacoes_meta_2025}`} sub="meta anual"    color={WARN}/>
            <KPI label="RAMs Graves"              value={d.notificacoes_graves_2025}   sub="hospitalizações/óbitos" color={CRIT}/>
            <KPI label="Medicamentos Envolvidos"  value={d.medicamentos_envolvidos_distintos} sub="distintos"      color={ACCENT}/>
            <KPI label="Desvios de Qualidade"     value={d.desvios_qualidade_notificados} sub="2025"              color={WARN}/>
            <KPI label="Alertas ANVISA Recebidos" value={d.alertas_anvisa_recebidos_2025} sub="2025"              color={ACCENT}/>
            <KPI label="Alertas Verificados"      value={`${d.alertas_anvisa_verificados_pct}%`} sub="Meta: 100%" color={WARN}/>
            <KPI label="Profis. Treinados"        value={`${d.profissionais_treinados_farmacovig_pct}%`} sub="Meta: ≥ 80%" color={WARN}/>
            <KPI label="Interações Detectadas"    value={d.interacoes_medicamentosas_detectadas} sub="pacientes"  color={CRIT}/>
          </div>
          <div style={{background:"#fef3c7",border:"1px solid #fcd34d",borderRadius:10,padding:14,fontSize:13,color:"#92400e"}}>
            <b>Subnotificação estimada 70–80%:</b> Apenas 48 RAMs notificadas em 2025 — real pode ultrapassar 200. {d.notificacoes_graves_2025} graves, incluindo anafilaxia, distonia aguda e possível visão comprometida por hidroxicloroquina.
          </div>
        </div>
      )}

      {aba==="RAMs"&&r&&Array.isArray(r)&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {r.map((ram:any,idx:number)=>(
            <div key={idx} style={{background:"#fff",borderRadius:12,padding:16,borderLeft:`4px solid ${GR_COR[ram.gravidade]||WARN}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div>
                  <span style={{fontFamily:"monospace",fontSize:11,color:"#9ca3af"}}>{ram.id}</span>
                  <div style={{fontSize:15,fontWeight:700,color:BRAND,marginTop:2}}>{ram.medicamento}</div>
                  <div style={{fontSize:12,color:"#6b7280"}}>{ram.data} · {ram.notificante}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end"}}>
                  <span style={{background:GR_COR[ram.gravidade]+"22",color:GR_COR[ram.gravidade],fontWeight:700,fontSize:11,padding:"3px 10px",borderRadius:12}}>{ram.gravidade.toUpperCase()}</span>
                  <span style={{fontSize:11,color:"#6b7280"}}>{ram.desfecho}</span>
                </div>
              </div>
              <div style={{fontSize:13,marginBottom:6}}><b style={{color:CRIT}}>RAM:</b> {ram.ram}</div>
              <div style={{fontSize:11,color:"#6b7280",marginBottom:4}}><b>Investigação:</b> {ram.investigacao}</div>
              <div style={{fontSize:11,background:"#f0fdf4",color:"#166534",padding:"4px 10px",borderRadius:8,display:"inline-block"}}><b>Ação:</b> {ram.acao}</div>
            </div>
          ))}
        </div>
      )}

      {aba==="Desvios Qualidade"&&q&&Array.isArray(q)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Desvios de Qualidade Notificados — 2025</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{background:"#f3f4f6"}}>
              <th style={{padding:"8px 10px",textAlign:"left",color:BRAND}}>ID</th>
              <th style={{padding:"8px 10px",textAlign:"left",color:BRAND}}>Medicamento</th>
              <th style={{padding:"8px 10px",textAlign:"left",color:BRAND}}>Problema</th>
              <th style={{padding:"8px 10px",textAlign:"left",color:BRAND}}>Fornecedor</th>
              <th style={{padding:"8px 10px",textAlign:"center",color:BRAND}}>Status</th>
            </tr></thead>
            <tbody>{q.map((dqr:any,idx:number)=>(
              <tr key={idx} style={{borderBottom:"1px solid #f3f4f6"}}>
                <td style={{padding:"8px 10px",fontFamily:"monospace",fontSize:11,color:"#6b7280"}}>{dqr.lote}</td>
                <td style={{padding:"8px 10px",fontWeight:600}}>{dqr.medicamento}</td>
                <td style={{padding:"8px 10px",color:"#374151"}}>{dqr.problema}</td>
                <td style={{padding:"8px 10px",color:"#6b7280"}}>{dqr.fornecedor}</td>
                <td style={{padding:"8px 10px",textAlign:"center"}}><span style={{background:dqr.status==="recolhido"?"#fee2e2":dqr.status==="devolvido"?"#fef9c3":"#dcfce7",color:dqr.status==="recolhido"?CRIT:dqr.status==="devolvido"?WARN:OK,fontWeight:700,fontSize:11,padding:"2px 8px",borderRadius:10}}>{dqr.status.toUpperCase()}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {aba==="Histórico"&&h&&Array.isArray(h)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Evolução Farmacovigilância — 2022–2025</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={h} margin={{top:10,right:20,left:20,bottom:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="ano" tick={{fontSize:11}}/>
              <YAxis yAxisId="left" tick={{fontSize:11}}/>
              <YAxis yAxisId="right" orientation="right" domain={[0,100]} tick={{fontSize:11}}/>
              <Tooltip/>
              <Legend/>
              <Line yAxisId="left"  type="monotone" dataKey="rams"            stroke={CRIT}  strokeWidth={2} name="RAMs"             dot/>
              <Line yAxisId="left"  type="monotone" dataKey="graves"          stroke={WARN}  strokeWidth={2} name="Graves"           dot/>
              <Line yAxisId="right" type="monotone" dataKey="treinados_pct"   stroke={ACCENT}strokeWidth={2} name="Treinados %"      dot strokeDasharray="4 2"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {aba==="Indicadores"&&i&&Array.isArray(i)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Indicadores de Farmacovigilância</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:"#f3f4f6"}}>
              <th style={{padding:"8px 12px",textAlign:"left",color:BRAND}}>Indicador</th>
              <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>Valor</th>
              <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>Meta</th>
              <th style={{padding:"8px 12px",textAlign:"center",color:BRAND}}>Status</th>
            </tr></thead>
            <tbody>{i.map((r:any,idx:number)=>(
              <tr key={idx} style={{borderBottom:"1px solid #f3f4f6"}}>
                <td style={{padding:"8px 12px"}}>{r.indicador}</td>
                <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:sc(r.status)}}>{r.valor}</td>
                <td style={{padding:"8px 12px",textAlign:"right",color:"#6b7280"}}>{r.meta}</td>
                <td style={{padding:"8px 12px",textAlign:"center"}}><span style={{color:sc(r.status),fontWeight:700,fontSize:11}}>{r.status.toUpperCase()}</span></td>
              </tr>
            ))}</tbody>
          </table>
          {i.map((r:any,idx:number)=>r.obs&&(
            <div key={idx} style={{marginTop:8,padding:"8px 12px",background:"#f8fafc",borderRadius:8,fontSize:11,color:"#374151"}}>
              <b style={{color:BRAND}}>{r.indicador}:</b> {r.obs}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
