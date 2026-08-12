import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { apiGet } from "../lib/api"
import { ShieldCheck } from "lucide-react"

const BRAND="#dbeafe", ACCENT="#1d4ed8", OK="#16a34a", WARN="#d97706", CRIT="#dc2626"
const ABAS=["Dashboard","Matriz","Planos","Histórico","Indicadores"]
const statusColor=(s:string)=>s==="ok"||s==="concluido"?OK:s==="atencao"||s==="andamento"?WARN:s==="alto"?WARN:s==="critico"?CRIT:WARN
function KPI({label,value,sub,color=BRAND}:{label:string;value:string|number;sub?:string;color?:string}){
  return <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,padding:"14px 18px",minWidth:130}}>
    <div style={{fontSize:11,color:"#6b7280",marginBottom:4}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{sub}</div>}
  </div>
}
export default function GestaoRiscosSaudeApui(){
  const [aba,setAba]=useState("Dashboard")
  const dash=useQuery({queryKey:["riscos-dash"], queryFn:()=>apiGet("/api/gestao-riscos-saude-apui/dashboard"),  enabled:aba==="Dashboard"})
  const mat =useQuery({queryKey:["riscos-mat"],  queryFn:()=>apiGet("/api/gestao-riscos-saude-apui/matriz"),     enabled:aba==="Matriz"})
  const plan=useQuery({queryKey:["riscos-plan"], queryFn:()=>apiGet("/api/gestao-riscos-saude-apui/planos"),     enabled:aba==="Planos"})
  const hist=useQuery({queryKey:["riscos-hist"], queryFn:()=>apiGet("/api/gestao-riscos-saude-apui/historico"),  enabled:aba==="Histórico"})
  const ind =useQuery({queryKey:["riscos-ind"],  queryFn:()=>apiGet("/api/gestao-riscos-saude-apui/indicadores"),enabled:aba==="Indicadores"})
  const d=dash.data as any, m=mat.data as any, pl=plan.data as any, h=hist.data as any, i=ind.data as any

  const nivelColor=(n:string)=>n==="critico"?CRIT:n==="alto"?WARN:n==="medio"?"#6366f1":OK

  return (
    <div style={{padding:"24px 32px",fontFamily:"Inter,sans-serif",background:"#f8fafc",minHeight:"100vh"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <ShieldCheck size={28} color={ACCENT}/>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:BRAND}}>Gestão de Riscos em Saúde</div>
          <div style={{fontSize:12,color:"#6b7280"}}>Matriz de Riscos SMS — Apuí/AM</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:24}}>
        {ABAS.map(a=><button key={a} onClick={()=>setAba(a)} style={{padding:"6px 18px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:aba===a?ACCENT:"#e5e7eb",color:aba===a?"#fff":"#374151"}}>{a}</button>)}
      </div>

      {aba==="Dashboard"&&!d&&<NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />}
      {aba==="Dashboard"&&d&&(
        <div>
          <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:20}}>
            <KPI label="Riscos Mapeados"   value={d.riscos_mapeados} />
            <KPI label="Críticos"          value={d.riscos_criticos} color={CRIT} />
            <KPI label="Altos"             value={d.riscos_altos}    color={WARN} />
            <KPI label="Médios"            value={d.riscos_medios}   color="#6366f1" />
            <KPI label="Planos Ativos"     value={d.planos_acao_ativos} color={ACCENT} />
            <KPI label="Índice de Risco"   value={d.indice_risco_medio} sub={`Meta: ${d.meta_indice}`} color={CRIT} />
          </div>
        </div>
      )}

      {aba==="Matriz"&&m&&Array.isArray(m)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Matriz de Riscos ({m.length} riscos)</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{background:"#f3f4f6"}}>
              <th style={{padding:"8px 10px",textAlign:"left",color:BRAND}}>Categoria</th>
              <th style={{padding:"8px 10px",textAlign:"left",color:BRAND}}>Risco</th>
              <th style={{padding:"8px 10px",textAlign:"center",color:BRAND}}>Prob.</th>
              <th style={{padding:"8px 10px",textAlign:"center",color:BRAND}}>Impacto</th>
              <th style={{padding:"8px 10px",textAlign:"center",color:BRAND}}>Nível</th>
            </tr></thead>
            <tbody>{m.map((r:any,idx:number)=>(
              <tr key={idx} style={{borderBottom:"1px solid #f3f4f6"}}>
                <td style={{padding:"8px 10px",color:"#6b7280",fontSize:11}}>{r.categoria}</td>
                <td style={{padding:"8px 10px"}}>{r.risco}</td>
                <td style={{padding:"8px 10px",textAlign:"center"}}>{r.probabilidade}/5</td>
                <td style={{padding:"8px 10px",textAlign:"center"}}>{r.impacto}/5</td>
                <td style={{padding:"8px 10px",textAlign:"center"}}>
                  <span style={{background:nivelColor(r.nivel)+"22",color:nivelColor(r.nivel),padding:"2px 8px",borderRadius:10,fontWeight:700,fontSize:11}}>{r.nivel.toUpperCase()}</span>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {aba==="Planos"&&pl&&Array.isArray(pl)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Planos de Ação</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:"#f3f4f6"}}>
              <th style={{padding:"8px 12px",textAlign:"left",color:BRAND}}>Risco</th>
              <th style={{padding:"8px 12px",textAlign:"left",color:BRAND}}>Ação</th>
              <th style={{padding:"8px 12px",textAlign:"center",color:BRAND}}>Responsável</th>
              <th style={{padding:"8px 12px",textAlign:"center",color:BRAND}}>Prazo</th>
              <th style={{padding:"8px 12px",textAlign:"center",color:BRAND}}>Status</th>
            </tr></thead>
            <tbody>{pl.map((p:any,idx:number)=>(
              <tr key={idx} style={{borderBottom:"1px solid #f3f4f6"}}>
                <td style={{padding:"8px 12px",fontSize:12,color:"#6b7280"}}>{p.risco}</td>
                <td style={{padding:"8px 12px"}}>{p.acao}</td>
                <td style={{padding:"8px 12px",textAlign:"center"}}>{p.responsavel}</td>
                <td style={{padding:"8px 12px",textAlign:"center"}}>{p.prazo}</td>
                <td style={{padding:"8px 12px",textAlign:"center"}}>
                  <span style={{color:statusColor(p.status),fontWeight:700}}>{p.status.toUpperCase()}</span>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {aba==="Histórico"&&h&&Array.isArray(h)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Evolução Trimestral — Índice de Risco</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={h} margin={{top:10,right:20,left:20,bottom:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="trimestre" tick={{fontSize:11}}/>
              <YAxis tick={{fontSize:11}}/>
              <Tooltip/>
              <Legend/>
              <Line type="monotone" dataKey="mapeados"  stroke={ACCENT} strokeWidth={2} name="Mapeados"  dot/>
              <Line type="monotone" dataKey="criticos"  stroke={CRIT}   strokeWidth={2} name="Críticos"   dot/>
              <Line type="monotone" dataKey="resolvidos"stroke={OK}     strokeWidth={2} name="Resolvidos" dot/>
              <Line type="monotone" dataKey="indice"    stroke={WARN}   strokeWidth={2} name="Índice Risco" dot strokeDasharray="4 2"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {aba==="Indicadores"&&i&&Array.isArray(i)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Indicadores de Gestão de Riscos</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:"#f3f4f6"}}>
              <th style={{padding:"8px 12px",textAlign:"left",color:BRAND}}>Indicador</th>
              <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>Valor</th>
              <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>Meta</th>
              <th style={{padding:"8px 12px",textAlign:"center",color:BRAND}}>Status</th>
            </tr></thead>
            <tbody>{i.map((row:any,idx:number)=>(
              <tr key={idx} style={{borderBottom:"1px solid #f3f4f6"}}>
                <td style={{padding:"8px 12px"}}>{row.indicador}</td>
                <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700}}>{row.valor}</td>
                <td style={{padding:"8px 12px",textAlign:"right",color:"#6b7280"}}>{row.meta}</td>
                <td style={{padding:"8px 12px",textAlign:"center"}}>
                  <span style={{color:statusColor(row.status),fontWeight:700}}>{row.status.toUpperCase()}</span>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
