import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { apiGet } from "../lib/api"
import { Home } from "lucide-react"

const BRAND="#1e3a5f", ACCENT="#1d4ed8", OK="#16a34a", WARN="#d97706", CRIT="#dc2626"
const ABAS=["Dashboard","Perfil","Ações","Histórico","Indicadores"]
const statusColor=(s:string)=>s==="ok"?OK:s==="atencao"?WARN:CRIT
function KPI({label,value,sub,color=BRAND}:{label:string;value:string|number;sub?:string;color?:string}){
  return <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,padding:"14px 18px",minWidth:130}}>
    <div style={{fontSize:11,color:"#6b7280",marginBottom:4}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{sub}</div>}
  </div>
}
export default function SaudePopulacaoRuaApui(){
  const [aba,setAba]=useState("Dashboard")
  const dash=useQuery({queryKey:["pop-rua-dash"],  queryFn:()=>apiGet("/api/saude-populacao-rua-apui/dashboard"),  enabled:aba==="Dashboard"})
  const perf=useQuery({queryKey:["pop-rua-perf"],  queryFn:()=>apiGet("/api/saude-populacao-rua-apui/perfil"),     enabled:aba==="Perfil"})
  const acoes=useQuery({queryKey:["pop-rua-acoes"],queryFn:()=>apiGet("/api/saude-populacao-rua-apui/acoes"),      enabled:aba==="Ações"})
  const hist=useQuery({queryKey:["pop-rua-hist"],  queryFn:()=>apiGet("/api/saude-populacao-rua-apui/historico"),  enabled:aba==="Histórico"})
  const ind=useQuery({queryKey:["pop-rua-ind"],    queryFn:()=>apiGet("/api/saude-populacao-rua-apui/indicadores"),enabled:aba==="Indicadores"})
  const d=dash.data as any, p=perf.data as any, a=acoes.data as any, h=hist.data as any, i=ind.data as any
  return (
    <div style={{padding:"24px 32px",fontFamily:"Inter,sans-serif",background:"#f8fafc",minHeight:"100vh"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <Home size={28} color={ACCENT}/>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:BRAND}}>Saúde da População em Situação de Rua</div>
          <div style={{fontSize:12,color:"#6b7280"}}>Consultório na Rua / CnaR — Apuí/AM</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:24}}>
        {ABAS.map(a=><button key={a} onClick={()=>setAba(a)} style={{padding:"6px 18px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:aba===a?ACCENT:"#e5e7eb",color:aba===a?"#fff":"#374151"}}>{a}</button>)}
      </div>

      {aba==="Dashboard"&&d&&(
        <div>
          <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:20}}>
            <KPI label="Pop. Estimada em Situação de Rua" value={d.populacao_estimada_rua} />
            <KPI label="Cadastrados CnaR" value={d.cadastrados_cnar} color={ACCENT} />
            <KPI label="Cobertura" value={`${d.cobertura_pct}%`} color={d.cobertura_pct>=80?OK:WARN} />
            <KPI label="Atendimentos/Mês" value={d.atendimentos_mes} />
            <KPI label="Vinculados RAPS" value={d.vinculados_rede_psicossocial} color={OK} />
            <KPI label="Equipe CnaR Formal" value={d.equipe_cnar?"Sim":"Não"} color={d.equipe_cnar?OK:CRIT} />
          </div>
          <div style={{background:"#fff3cd",border:"1px solid #ffd07a",borderRadius:10,padding:16,fontSize:13,color:"#7c4a00"}}>
            <b>Nota Técnica:</b> {d.nota_tecnica}
          </div>
        </div>
      )}

      {aba==="Perfil"&&p&&Array.isArray(p)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Perfil por Faixa Etária</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={p} margin={{top:10,right:20,left:20,bottom:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="faixa_etaria" tick={{fontSize:12}}/>
              <YAxis tick={{fontSize:11}}/>
              <Tooltip/>
              <Legend/>
              <Bar dataKey="qtd" fill={ACCENT} name="Cadastrados" radius={[4,4,0,0]}/>
              <Bar dataKey="uso_substancias_pct" fill={CRIT} name="Uso substâncias %" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {aba==="Ações"&&a&&Array.isArray(a)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Ações de Saúde</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:"#f3f4f6"}}>
              <th style={{padding:"8px 12px",textAlign:"left",color:BRAND}}>Ação</th>
              <th style={{padding:"8px 12px",textAlign:"center",color:BRAND}}>Frequência</th>
              <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>Alcance</th>
              <th style={{padding:"8px 12px",textAlign:"center",color:BRAND}}>Status</th>
            </tr></thead>
            <tbody>{a.map((row:any,i:number)=>(
              <tr key={i} style={{borderBottom:"1px solid #f3f4f6"}}>
                <td style={{padding:"8px 12px"}}>{row.acao}</td>
                <td style={{padding:"8px 12px",textAlign:"center"}}>{row.frequencia}</td>
                <td style={{padding:"8px 12px",textAlign:"right"}}>{row.alcance}</td>
                <td style={{padding:"8px 12px",textAlign:"center"}}>
                  <span style={{color:statusColor(row.status),fontWeight:600}}>{row.status.toUpperCase()}</span>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {aba==="Histórico"&&h&&Array.isArray(h)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Evolução Mensal 2025</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={h} margin={{top:10,right:20,left:20,bottom:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="mes" tick={{fontSize:11}}/>
              <YAxis tick={{fontSize:11}}/>
              <Tooltip/>
              <Legend/>
              <Line type="monotone" dataKey="cadastrados"    stroke={ACCENT} strokeWidth={2} name="Cadastrados" dot={false}/>
              <Line type="monotone" dataKey="atendimentos"   stroke={OK}    strokeWidth={2} name="Atendimentos"  dot={false}/>
              <Line type="monotone" dataKey="encaminhamentos"stroke={WARN}  strokeWidth={2} name="Encaminhamentos" dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {aba==="Indicadores"&&i&&Array.isArray(i)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Indicadores CnaR</div>
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
