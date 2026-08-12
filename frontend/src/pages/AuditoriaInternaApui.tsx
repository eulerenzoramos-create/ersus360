import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { apiGet } from "../lib/api"
import { Shield } from "lucide-react"

const BRAND="#dbeafe", ACCENT="#1d4ed8", OK="#16a34a", WARN="#d97706", CRIT="#dc2626"
const ABAS=["Dashboard","Auditorias","Não Conformidades","Histórico","Indicadores"]
const sc=(s:string)=>s==="ok"||s==="concluida"?OK:s==="atencao"||s==="em andamento"||s==="em tratamento"?WARN:s==="critico"||s==="critica"||s==="aberta"?CRIT:WARN
function KPI({label,value,sub,color=BRAND}:{label:string;value:string|number;sub?:string;color?:string}){
  return <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,padding:"14px 18px",minWidth:130}}>
    <div style={{fontSize:11,color:"#6b7280",marginBottom:4}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{sub}</div>}
  </div>
}
export default function AuditoriaInternaApui(){
  const [aba,setAba]=useState("Dashboard")
  const dash=useQuery({queryKey:["aud-dash"], queryFn:()=>apiGet("/api/auditoria-interna-apui/dashboard"),       enabled:aba==="Dashboard"})
  const aud =useQuery({queryKey:["aud-aud"],  queryFn:()=>apiGet("/api/auditoria-interna-apui/auditorias"),      enabled:aba==="Auditorias"})
  const nc  =useQuery({queryKey:["aud-nc"],   queryFn:()=>apiGet("/api/auditoria-interna-apui/nao-conformidades"),enabled:aba==="Não Conformidades"})
  const hist=useQuery({queryKey:["aud-hist"], queryFn:()=>apiGet("/api/auditoria-interna-apui/historico"),       enabled:aba==="Histórico"})
  const ind =useQuery({queryKey:["aud-ind"],  queryFn:()=>apiGet("/api/auditoria-interna-apui/indicadores"),     enabled:aba==="Indicadores"})
  const d=dash.data as any, a=aud.data as any, n=nc.data as any, h=hist.data as any, i=ind.data as any
  return(
    <div style={{padding:"24px 32px",fontFamily:"Inter,sans-serif",background:"#f8fafc",minHeight:"100vh"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <Shield size={28} color={ACCENT}/>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:BRAND}}>Auditoria Interna</div>
          <div style={{fontSize:12,color:"#6b7280"}}>Controle Interno SMS — Apuí/AM</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:24}}>
        {ABAS.map(ab=><button key={ab} onClick={()=>setAba(ab)} style={{padding:"6px 18px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:aba===ab?ACCENT:"#e5e7eb",color:aba===ab?"#fff":"#374151"}}>{ab}</button>)}
      </div>

      {aba==="Dashboard"&&!d&&<NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />}
      {aba==="Dashboard"&&d&&(
        <div>
          <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:20}}>
            <KPI label="Auditorias Realizadas" value={`${d.auditorias_realizadas_2025}/${d.auditorias_planejadas_2025}`} sub="2025" color={ACCENT} />
            <KPI label="Conformidade Média"    value={`${d.conformidade_media_pct}%`} sub={`Meta: ${d.meta_conformidade_pct}%`} color={WARN} />
            <KPI label="NC Abertas"            value={d.nao_conformidades_abertas} color={CRIT} />
            <KPI label="NC Críticas"           value={d.nao_conformidades_criticas} color={CRIT} />
            <KPI label="Recomendações Atendidas" value={`${d.recomendacoes_atendidas_pct}%`} color={WARN} />
            <KPI label="Processos Monitorados" value={d.processos_sob_monitoramento} color={OK} />
          </div>
        </div>
      )}

      {aba==="Auditorias"&&a&&Array.isArray(a)&&(
        <div>
          <div style={{background:"#fff",borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Conformidade por Área Auditada</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={a.filter((r:any)=>r.conformidade_pct>0)} layout="vertical" margin={{left:160,right:40,top:10,bottom:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis type="number" domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{fontSize:11}}/>
                <YAxis dataKey="area" type="category" tick={{fontSize:11}} width={160}/>
                <Tooltip formatter={(v:number)=>[`${v}%`,"Conformidade"]}/>
                <Bar dataKey="conformidade_pct" fill={ACCENT} radius={[0,4,4,0]} name="Conformidade %"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:"#fff",borderRadius:12,padding:20}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{background:"#f3f4f6"}}>
                <th style={{padding:"8px 12px",textAlign:"left",color:BRAND}}>Área</th>
                <th style={{padding:"8px 12px",textAlign:"center",color:BRAND}}>Data</th>
                <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>Conform.</th>
                <th style={{padding:"8px 12px",textAlign:"center",color:BRAND}}>NC Críticas</th>
                <th style={{padding:"8px 12px",textAlign:"center",color:BRAND}}>Status</th>
              </tr></thead>
              <tbody>{a.map((r:any,idx:number)=>(
                <tr key={idx} style={{borderBottom:"1px solid #f3f4f6"}}>
                  <td style={{padding:"8px 12px"}}>{r.area}</td>
                  <td style={{padding:"8px 12px",textAlign:"center",color:"#6b7280"}}>{r.data}</td>
                  <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:r.conformidade_pct>=80?OK:r.conformidade_pct>=60?WARN:CRIT}}>{r.conformidade_pct>0?`${r.conformidade_pct}%`:"—"}</td>
                  <td style={{padding:"8px 12px",textAlign:"center",color:r.nc_criticas>0?CRIT:OK,fontWeight:700}}>{r.nc_criticas}</td>
                  <td style={{padding:"8px 12px",textAlign:"center"}}><span style={{color:sc(r.status),fontWeight:600}}>{r.status.toUpperCase()}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {aba==="Não Conformidades"&&n&&Array.isArray(n)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Não Conformidades Abertas ({n.length})</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{background:"#f3f4f6"}}>
              <th style={{padding:"8px 10px",textAlign:"left",color:BRAND}}>ID</th>
              <th style={{padding:"8px 10px",textAlign:"left",color:BRAND}}>Área</th>
              <th style={{padding:"8px 10px",textAlign:"left",color:BRAND}}>Descrição</th>
              <th style={{padding:"8px 10px",textAlign:"center",color:BRAND}}>Criticidade</th>
              <th style={{padding:"8px 10px",textAlign:"center",color:BRAND}}>Status</th>
              <th style={{padding:"8px 10px",textAlign:"center",color:BRAND}}>Prazo</th>
            </tr></thead>
            <tbody>{n.map((r:any,idx:number)=>(
              <tr key={idx} style={{borderBottom:"1px solid #f3f4f6"}}>
                <td style={{padding:"8px 10px",fontFamily:"monospace",color:"#6b7280"}}>{r.id}</td>
                <td style={{padding:"8px 10px"}}>{r.area}</td>
                <td style={{padding:"8px 10px"}}>{r.descricao}</td>
                <td style={{padding:"8px 10px",textAlign:"center"}}><span style={{color:sc(r.criticidade),fontWeight:700,fontSize:11}}>{r.criticidade.toUpperCase()}</span></td>
                <td style={{padding:"8px 10px",textAlign:"center"}}><span style={{color:sc(r.status),fontWeight:600}}>{r.status}</span></td>
                <td style={{padding:"8px 10px",textAlign:"center",color:"#6b7280"}}>{r.prazo}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {aba==="Histórico"&&h&&Array.isArray(h)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Evolução Trimestral</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={h} margin={{top:10,right:20,left:20,bottom:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="trimestre" tick={{fontSize:11}}/>
              <YAxis tick={{fontSize:11}}/>
              <Tooltip/>
              <Legend/>
              <Line type="monotone" dataKey="conformidade"  stroke={OK}    strokeWidth={2} name="Conformidade %" dot/>
              <Line type="monotone" dataKey="nc_abertas"    stroke={CRIT}  strokeWidth={2} name="NC Abertas"     dot/>
              <Line type="monotone" dataKey="nc_atendidas"  stroke={ACCENT}strokeWidth={2} name="NC Atendidas"   dot/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {aba==="Indicadores"&&i&&Array.isArray(i)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Indicadores de Auditoria</div>
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
