import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { apiGet } from "../lib/api"
import { HandHeart } from "lucide-react"

const BRAND="#1e3a5f", ACCENT="#1d4ed8", OK="#16a34a", WARN="#d97706", CRIT="#dc2626"
const ABAS=["Dashboard","Condicionalidades","BPC Saúde","Casos Interface","Histórico","Indicadores"]
const sc=(s:string)=>s==="ok"?OK:s==="atencao"?WARN:CRIT
function KPI({label,value,sub,color=BRAND}:{label:string;value:string|number;sub?:string;color?:string}){
  return <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,padding:"14px 18px",minWidth:130}}>
    <div style={{fontSize:11,color:"#6b7280",marginBottom:4}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{sub}</div>}
  </div>
}
const PRIORIDADE_COR:Record<string,string>={"alta":CRIT,"media":WARN,"baixa":OK}
export default function SuaSusApui(){
  const [aba,setAba]=useState("Dashboard")
  const dash=useQuery({queryKey:["ss-dash"],  queryFn:()=>apiGet("/api/suas-sus-apui/dashboard"),         enabled:aba==="Dashboard"})
  const cond=useQuery({queryKey:["ss-cond"],  queryFn:()=>apiGet("/api/suas-sus-apui/condicionalidades"),  enabled:aba==="Condicionalidades"})
  const bpc =useQuery({queryKey:["ss-bpc"],   queryFn:()=>apiGet("/api/suas-sus-apui/bpc-saude"),          enabled:aba==="BPC Saúde"})
  const caso=useQuery({queryKey:["ss-caso"],  queryFn:()=>apiGet("/api/suas-sus-apui/casos-interface"),    enabled:aba==="Casos Interface"})
  const hist=useQuery({queryKey:["ss-hist"],  queryFn:()=>apiGet("/api/suas-sus-apui/historico"),          enabled:aba==="Histórico"})
  const ind =useQuery({queryKey:["ss-ind"],   queryFn:()=>apiGet("/api/suas-sus-apui/indicadores"),        enabled:aba==="Indicadores"})
  const d=dash.data as any, c=cond.data as any, b=bpc.data as any, cs=caso.data as any, h=hist.data as any, i=ind.data as any
  return(
    <div style={{padding:"24px 32px",fontFamily:"Inter,sans-serif",background:"#f8fafc",minHeight:"100vh"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <HandHeart size={28} color={ACCENT}/>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:BRAND}}>Interface SUAS / SUS</div>
          <div style={{fontSize:12,color:"#6b7280"}}>Proteção Social · Condicionalidades · BPC · Casos Intersetoriais — Apuí/AM</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
        {ABAS.map(a=><button key={a} onClick={()=>setAba(a)} style={{padding:"6px 18px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:aba===a?ACCENT:"#e5e7eb",color:aba===a?"#fff":"#374151"}}>{a}</button>)}
      </div>

      {aba==="Dashboard"&&d&&(
        <div>
          <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:20}}>
            <KPI label="Famílias CRAS"           value={d.familias_cras_referenciadas.toLocaleString()}  color={ACCENT}/>
            <KPI label="Vulnerabilidade Extrema" value={d.familias_vulnerabilidade_extrema}              color={CRIT}/>
            <KPI label="Beneficiários BPC/Saúde" value={d.beneficiarios_bpc_saude}                       color={ACCENT}/>
            <KPI label="Bolsa Família + Cond."   value={d.beneficiarios_bolsa_familia_com_condicionalidades.toLocaleString()} color={BRAND}/>
            <KPI label="Condicionalidades Cumpr." value={`${d.condicionalidades_saude_cumpridas_pct}%`}  sub="Meta: ≥ 90%" color={WARN}/>
            <KPI label="Casos SUAS/SUS Abertos"  value={d.casos_interface_suas_sus_abertos}              color={WARN}/>
            <KPI label="Crianças Acomp. Conjunto" value={d.criancas_acompanhamento_conjunto}             color={ACCENT}/>
            <KPI label="Reuniões Intersetoriais" value={`${d.reunioes_intersetoriais_2025}/ano`}          sub="Meta: ≥ 12" color={WARN}/>
          </div>
          <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:10,padding:14,fontSize:13,color:"#1e40af"}}>
            <b>Interface SUAS/SUS:</b> {d.casos_interface_suas_sus_abertos} casos intersetoriais abertos. Apenas {d.protocolos_interface_vigentes} protocolos formalizados de {8} necessários. Reuniões mensais ainda não atingidas.
          </div>
        </div>
      )}

      {aba==="Condicionalidades"&&c&&Array.isArray(c)&&(
        <div>
          <div style={{background:"#fff",borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Cumprimento de Condicionalidades de Saúde — Bolsa Família</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={c} layout="vertical" margin={{left:300,right:60,top:10,bottom:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis type="number" domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{fontSize:11}}/>
                <YAxis dataKey="acao" type="category" tick={{fontSize:11}} width={300}/>
                <Tooltip formatter={(v:number)=>[`${v}%`,"Cumprimento"]}/>
                <Bar dataKey="cumprimento_pct" fill={ACCENT} radius={[0,4,4,0]} name="Cumprimento %"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {c.map((r:any,idx:number)=>(
              <div key={idx} style={{background:"#fff",borderRadius:10,padding:14,borderLeft:`4px solid ${r.cumprimento_pct>=90?OK:r.cumprimento_pct>=80?WARN:CRIT}`}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <b style={{fontSize:13,color:BRAND}}>{r.acao}</b>
                  <span style={{fontWeight:700,color:r.cumprimento_pct>=90?OK:r.cumprimento_pct>=80?WARN:CRIT}}>{r.cumprimento_pct}% ({r.acompanhados}/{r.meta_beneficiarios})</span>
                </div>
                <div style={{fontSize:11,color:"#6b7280"}}>{r.pendencias}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {aba==="BPC Saúde"&&b&&Array.isArray(b)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Beneficiários BPC com Acompanhamento em Saúde</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:"#f3f4f6"}}>
              <th style={{padding:"8px 12px",textAlign:"left",color:BRAND}}>Categoria</th>
              <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>Beneficiários</th>
              <th style={{padding:"8px 12px",textAlign:"left",color:BRAND}}>Acompanhamento</th>
              <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>Req. Pendentes</th>
              <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>Renda/PC Média</th>
            </tr></thead>
            <tbody>{b.map((r:any,idx:number)=>(
              <tr key={idx} style={{borderBottom:"1px solid #f3f4f6"}}>
                <td style={{padding:"8px 12px"}}>{r.categoria}</td>
                <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:ACCENT}}>{r.beneficiarios}</td>
                <td style={{padding:"8px 12px",fontSize:11,color:"#6b7280"}}>{r.acompanhamento_saude}</td>
                <td style={{padding:"8px 12px",textAlign:"right",color:r.requerimentos_pendentes>10?WARN:OK,fontWeight:700}}>{r.requerimentos_pendentes}</td>
                <td style={{padding:"8px 12px",textAlign:"right",color:"#6b7280"}}>{r.media_renda_pc}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {aba==="Casos Interface"&&cs&&Array.isArray(cs)&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {cs.map((r:any,idx:number)=>(
            <div key={idx} style={{background:"#fff",borderRadius:10,padding:16,borderLeft:`4px solid ${PRIORIDADE_COR[r.prioridade]||WARN}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontWeight:700,fontSize:14,color:BRAND,marginBottom:4}}>{r.tipo}</div>
                <div style={{fontSize:11,color:"#6b7280"}}><b>Equipes:</b> {r.equipes}</div>
              </div>
              <div style={{textAlign:"right",minWidth:120}}>
                <div style={{fontWeight:700,color:CRIT,fontSize:18}}>{r.abertos}</div>
                <div style={{fontSize:10,color:"#9ca3af"}}>abertos</div>
                <div style={{fontSize:11,color:OK,fontWeight:600}}>{r.encerrados_mes}/mês enc.</div>
                <span style={{background:PRIORIDADE_COR[r.prioridade]+"22",color:PRIORIDADE_COR[r.prioridade],fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:12}}>{r.prioridade.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {aba==="Histórico"&&h&&Array.isArray(h)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Evolução SUAS/SUS — 2022–2025</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={h} margin={{top:10,right:20,left:20,bottom:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="ano" tick={{fontSize:11}}/>
              <YAxis yAxisId="left" tick={{fontSize:11}}/>
              <YAxis yAxisId="right" orientation="right" tick={{fontSize:11}}/>
              <Tooltip/>
              <Legend/>
              <Line yAxisId="left"  type="monotone" dataKey="familias_cras"        stroke={ACCENT}strokeWidth={2} name="Famílias CRAS" dot/>
              <Line yAxisId="left"  type="monotone" dataKey="bpc_beneficiarios"    stroke={OK}    strokeWidth={2} name="Benef. BPC"    dot/>
              <Line yAxisId="right" type="monotone" dataKey="condicionalidades_pct" stroke={WARN} strokeWidth={2} name="Cond. Saúde %" dot strokeDasharray="4 2"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {aba==="Indicadores"&&i&&Array.isArray(i)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Indicadores da Interface SUAS/SUS</div>
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
          {i.map((r:any,idx:number)=>r.observacao&&(
            <div key={idx} style={{marginTop:8,padding:"8px 12px",background:"#f8fafc",borderRadius:8,fontSize:11,color:"#374151"}}>
              <b style={{color:BRAND}}>{r.indicador}:</b> {r.observacao}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
