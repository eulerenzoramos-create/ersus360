import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { apiGet } from "../lib/api"
import { Target } from "lucide-react"

const BRAND="#1e3a5f", ACCENT="#1d4ed8", OK="#16a34a", WARN="#d97706", CRIT="#dc2626"
const ABAS=["Dashboard","Metas PMS","Previne Brasil","Histórico","Indicadores"]
const sc=(s:string)=>s==="ok"?OK:s==="atencao"?WARN:CRIT
function KPI({label,value,sub,color=BRAND}:{label:string;value:string|number;sub?:string;color?:string}){
  return <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,padding:"14px 18px",minWidth:130}}>
    <div style={{fontSize:11,color:"#6b7280",marginBottom:4}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{sub}</div>}
  </div>
}
export default function MonitoramentoMetasApui(){
  const [aba,setAba]=useState("Dashboard")
  const dash=useQuery({queryKey:["metas-dash"],  queryFn:()=>apiGet("/api/monitoramento-metas-apui/dashboard"),      enabled:aba==="Dashboard"})
  const pms =useQuery({queryKey:["metas-pms"],   queryFn:()=>apiGet("/api/monitoramento-metas-apui/metas-pms"),      enabled:aba==="Metas PMS"})
  const prev=useQuery({queryKey:["metas-prev"],  queryFn:()=>apiGet("/api/monitoramento-metas-apui/previne-brasil"), enabled:aba==="Previne Brasil"})
  const hist=useQuery({queryKey:["metas-hist"],  queryFn:()=>apiGet("/api/monitoramento-metas-apui/historico"),      enabled:aba==="Histórico"})
  const ind =useQuery({queryKey:["metas-ind"],   queryFn:()=>apiGet("/api/monitoramento-metas-apui/indicadores"),    enabled:aba==="Indicadores"})
  const d=dash.data as any, p=pms.data as any, pr=prev.data as any, h=hist.data as any, i=ind.data as any
  return(
    <div style={{padding:"24px 32px",fontFamily:"Inter,sans-serif",background:"#f8fafc",minHeight:"100vh"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <Target size={28} color={ACCENT}/>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:BRAND}}>Monitoramento de Metas</div>
          <div style={{fontSize:12,color:"#6b7280"}}>PMS · Previne Brasil · Quadrimestral — Apuí/AM</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:24}}>
        {ABAS.map(a=><button key={a} onClick={()=>setAba(a)} style={{padding:"6px 18px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:aba===a?ACCENT:"#e5e7eb",color:aba===a?"#fff":"#374151"}}>{a}</button>)}
      </div>

      {aba==="Dashboard"&&d&&(
        <div>
          <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:20}}>
            <KPI label="Metas PMS Alcançadas" value={`${d.metas_alcancadas}/${d.metas_pms_total}`} color={WARN} />
            <KPI label="Metas em Andamento"   value={d.metas_andamento} color={ACCENT} />
            <KPI label="Metas Críticas"        value={d.metas_criticas} color={CRIT} />
            <KPI label="Nota Previne Brasil"   value={d.nota_previne_brasil} sub={`Meta: ${d.meta_nota_previne}`} color={WARN} />
            <KPI label="Indicadores na Meta"   value={`${d.indicadores_previne_meta}/${d.indicadores_previne_total}`} color={WARN} />
            <KPI label="Relatório"             value={d.relatorio_quadrimestral} color={OK} />
          </div>
          <div style={{background:"#e8f5e9",border:"1px solid #a5d6a7",borderRadius:10,padding:14,fontSize:13,color:"#1b5e20"}}>
            <b>Previne Brasil:</b> Nota {d.nota_previne_brasil} / 10 — {d.indicadores_previne_meta} de {d.indicadores_previne_total} indicadores na meta
          </div>
        </div>
      )}

      {aba==="Metas PMS"&&p&&Array.isArray(p)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Metas do Plano Municipal de Saúde 2022–2025</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:"#f3f4f6"}}>
              <th style={{padding:"8px 12px",textAlign:"left",color:BRAND}}>Eixo</th>
              <th style={{padding:"8px 12px",textAlign:"left",color:BRAND}}>Meta</th>
              <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>Atual</th>
              <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>Meta</th>
              <th style={{padding:"8px 12px",textAlign:"center",color:BRAND}}>Status</th>
            </tr></thead>
            <tbody>{p.map((r:any,idx:number)=>(
              <tr key={idx} style={{borderBottom:"1px solid #f3f4f6"}}>
                <td style={{padding:"8px 12px",fontSize:11,color:"#6b7280"}}>{r.eixo}</td>
                <td style={{padding:"8px 12px"}}>{r.meta}</td>
                <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:sc(r.status)}}>{r.valor_atual}</td>
                <td style={{padding:"8px 12px",textAlign:"right",color:"#6b7280"}}>{r.meta_val}</td>
                <td style={{padding:"8px 12px",textAlign:"center"}}><span style={{color:sc(r.status),fontWeight:700}}>{r.status.toUpperCase()}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {aba==="Previne Brasil"&&pr&&Array.isArray(pr)&&(
        <div>
          <div style={{background:"#fff",borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Nota por Indicador — Previne Brasil</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={pr} layout="vertical" margin={{left:260,right:40,top:10,bottom:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis type="number" domain={[0,10]} tick={{fontSize:11}}/>
                <YAxis dataKey="indicador" type="category" tick={{fontSize:10}} width={260}/>
                <Tooltip/>
                <Bar dataKey="nota" fill={ACCENT} radius={[0,4,4,0]} name="Nota"/>
                <Bar dataKey="meta" fill="#e5e7eb" radius={[0,4,4,0]} name="Meta" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:"#fff",borderRadius:12,padding:20}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{background:"#f3f4f6"}}>
                <th style={{padding:"8px 10px",textAlign:"left",color:BRAND}}>Indicador</th>
                <th style={{padding:"8px 10px",textAlign:"right",color:BRAND}}>Resultado</th>
                <th style={{padding:"8px 10px",textAlign:"right",color:BRAND}}>Meta</th>
                <th style={{padding:"8px 10px",textAlign:"right",color:BRAND}}>Nota</th>
                <th style={{padding:"8px 10px",textAlign:"center",color:BRAND}}>Status</th>
              </tr></thead>
              <tbody>{pr.map((r:any,idx:number)=>(
                <tr key={idx} style={{borderBottom:"1px solid #f3f4f6"}}>
                  <td style={{padding:"8px 10px"}}>{r.indicador}</td>
                  <td style={{padding:"8px 10px",textAlign:"right"}}>{r.resultado}%</td>
                  <td style={{padding:"8px 10px",textAlign:"right",color:"#6b7280"}}>{r.meta}%</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontWeight:700,color:sc(r.status)}}>{r.nota}</td>
                  <td style={{padding:"8px 10px",textAlign:"center"}}><span style={{color:sc(r.status),fontWeight:700}}>{r.status.toUpperCase()}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {aba==="Histórico"&&h&&Array.isArray(h)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Evolução Quadrimestral</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={h} margin={{top:10,right:20,left:20,bottom:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="quadrimestre" tick={{fontSize:10}}/>
              <YAxis tick={{fontSize:11}}/>
              <Tooltip/>
              <Legend/>
              <Line type="monotone" dataKey="metas_alcancadas" stroke={OK}    strokeWidth={2} name="Metas Alcançadas" dot/>
              <Line type="monotone" dataKey="nota_previne"     stroke={ACCENT}strokeWidth={2} name="Nota Previne"     dot/>
              <Line type="monotone" dataKey="execucao_orc_pct" stroke={WARN}  strokeWidth={2} name="Exec. Orç.%"      dot strokeDasharray="4 2"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {aba==="Indicadores"&&i&&Array.isArray(i)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Indicadores de Monitoramento</div>
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
                <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700}}>{r.valor}</td>
                <td style={{padding:"8px 12px",textAlign:"right",color:"#6b7280"}}>{r.meta}</td>
                <td style={{padding:"8px 12px",textAlign:"center"}}><span style={{color:sc(r.status),fontWeight:700}}>{r.status.toUpperCase()}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
