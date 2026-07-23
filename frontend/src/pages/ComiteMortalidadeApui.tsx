import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { apiGet } from "../lib/api"
import { HeartPulse } from "lucide-react"

const BRAND="#dbeafe", ACCENT="#1d4ed8", OK="#16a34a", WARN="#d97706", CRIT="#dc2626"
const ABAS=["Dashboard","Óbitos Maternos","Óbitos Infantis","Histórico","Indicadores"]
const sc=(s:string)=>s==="ok"?OK:s==="atencao"?WARN:CRIT
function KPI({label,value,sub,color=BRAND}:{label:string;value:string|number;sub?:string;color?:string}){
  return <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,padding:"14px 18px",minWidth:130}}>
    <div style={{fontSize:11,color:"#6b7280",marginBottom:4}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{sub}</div>}
  </div>
}
export default function ComiteMortalidadeApui(){
  const [aba,setAba]=useState("Dashboard")
  const dash=useQuery({queryKey:["cm-dash"],  queryFn:()=>apiGet("/api/comite-mortalidade-apui/dashboard"),      enabled:aba==="Dashboard"})
  const mat =useQuery({queryKey:["cm-mat"],   queryFn:()=>apiGet("/api/comite-mortalidade-apui/obitos-maternos"), enabled:aba==="Óbitos Maternos"})
  const inf =useQuery({queryKey:["cm-inf"],   queryFn:()=>apiGet("/api/comite-mortalidade-apui/obitos-infantis"), enabled:aba==="Óbitos Infantis"})
  const hist=useQuery({queryKey:["cm-hist"],  queryFn:()=>apiGet("/api/comite-mortalidade-apui/historico"),       enabled:aba==="Histórico"})
  const ind =useQuery({queryKey:["cm-ind"],   queryFn:()=>apiGet("/api/comite-mortalidade-apui/indicadores"),     enabled:aba==="Indicadores"})
  const d=dash.data as any, m=mat.data as any, f=inf.data as any, h=hist.data as any, i=ind.data as any
  return(
    <div style={{padding:"24px 32px",fontFamily:"Inter,sans-serif",background:"#f8fafc",minHeight:"100vh"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <HeartPulse size={28} color={CRIT}/>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:BRAND}}>Comitê de Mortalidade</div>
          <div style={{fontSize:12,color:"#6b7280"}}>CIAMI — Óbitos Maternos e Infantis Evitáveis — Apuí/AM</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:24}}>
        {ABAS.map(a=><button key={a} onClick={()=>setAba(a)} style={{padding:"6px 18px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:aba===a?ACCENT:"#e5e7eb",color:aba===a?"#fff":"#374151"}}>{a}</button>)}
      </div>

      {aba==="Dashboard"&&d&&(
        <div>
          <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:20}}>
            <KPI label="Óbitos Maternos 2025"    value={d.obitos_maternos_2025}      sub="vs 3 em 2024"         color={CRIT}/>
            <KPI label="RMM 2025 (100k NV)"      value={`${d.razao_mortalidade_materna_100k}`} sub="Meta: ≤ 30" color={CRIT}/>
            <KPI label="Evitáveis — Maternos"    value={`${d.obitos_maternos_evitaveis_pct}%`}                  color={CRIT}/>
            <KPI label="Óbitos Infantis 2025"    value={d.obitos_infantis_2025}      sub="neonatal + pós"       color={CRIT}/>
            <KPI label="TMI 2025 (1k NV)"        value={`${d.taxa_mortalidade_infantil_1k}`} sub="Meta: ≤ 10"  color={CRIT}/>
            <KPI label="Evitáveis — Infantis"    value={`${d.obitos_infantis_evitaveis_pct}%`}                  color={WARN}/>
            <KPI label="Investigações Concluídas" value={`${d.investigacoes_concluidas_pct}%`}                  color={WARN}/>
            <KPI label="Reuniões Realizadas"     value={`${d.reunioes_realizadas_2025}/${d.reunioes_meta_2025}`} color={WARN}/>
          </div>
          <div style={{display:"flex",gap:12}}>
            <div style={{flex:1,background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:10,padding:14,fontSize:13,color:"#991b1b"}}>
              <b>Mortalidade Materna:</b> RMM {d.razao_mortalidade_materna_100k}/100k NV — 8,5× a meta nacional. {d.obitos_maternos_evitaveis_pct}% dos óbitos classificados como evitáveis por falha assistencial.
            </div>
            <div style={{flex:1,background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:10,padding:14,fontSize:13,color:"#991b1b"}}>
              <b>Mortalidade Infantil:</b> TMI {d.taxa_mortalidade_infantil_1k}/1k NV — 2,2× a meta. Prematuridade sem UTI neonatal e infecções tratáveis lideram as causas evitáveis.
            </div>
          </div>
        </div>
      )}

      {aba==="Óbitos Maternos"&&m&&Array.isArray(m)&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {m.map((r:any,idx:number)=>(
            <div key={idx} style={{background:"#fff",borderRadius:12,padding:20,borderLeft:`4px solid ${r.evitavel?CRIT:WARN}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <span style={{fontFamily:"monospace",fontSize:11,color:"#6b7280"}}>{r.id}</span>
                  <div style={{fontSize:16,fontWeight:700,color:BRAND,marginTop:2}}>{r.causa_basica}</div>
                  <div style={{fontSize:12,color:"#6b7280"}}>{r.mes} · CID {r.causa_obito_CID} · {r.local_obito}</div>
                </div>
                <span style={{background:r.evitavel?"#fee2e2":"#fef9c3",color:r.evitavel?CRIT:WARN,fontWeight:700,fontSize:11,padding:"4px 10px",borderRadius:20}}>{r.classificacao}</span>
              </div>
              <div style={{fontSize:12,marginBottom:10}}>
                <span style={{color:"#6b7280"}}>Pré-natal:</span> <b style={{color:r.pre_natal_consultas<r.meta_pre_natal?WARN:OK}}>{r.pre_natal_consultas}/{r.meta_pre_natal} consultas</b>
                {" · "}<span style={{color:"#6b7280"}}>Gestação:</span> <b>{r.gestacao}</b>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:11,fontWeight:700,color:CRIT,marginBottom:4}}>Fatores contribuintes:</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {r.fatores.map((f:string,fi:number)=><span key={fi} style={{background:"#fee2e2",color:"#991b1b",fontSize:11,padding:"2px 8px",borderRadius:12}}>{f}</span>)}
                </div>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:OK,marginBottom:4}}>Recomendações:</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {r.recomendacoes.map((rec:string,ri:number)=><span key={ri} style={{background:"#dcfce7",color:"#166534",fontSize:11,padding:"2px 8px",borderRadius:12}}>{rec}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {aba==="Óbitos Infantis"&&f&&Array.isArray(f)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Óbitos Infantis por Causa — 2025</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:"#f3f4f6"}}>
              <th style={{padding:"8px 12px",textAlign:"left",color:BRAND}}>Causa</th>
              <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>Óbitos</th>
              <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>Evitáveis %</th>
              <th style={{padding:"8px 12px",textAlign:"left",color:BRAND}}>Principal Fator</th>
            </tr></thead>
            <tbody>{f.map((r:any,idx:number)=>(
              <tr key={idx} style={{borderBottom:"1px solid #f3f4f6"}}>
                <td style={{padding:"8px 12px"}}>{r.causa} <span style={{fontSize:10,color:"#9ca3af"}}>({r.CID})</span></td>
                <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:CRIT}}>{r.obitos_2025}</td>
                <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:r.evitaveis_pct===100?CRIT:r.evitaveis_pct>0?WARN:OK}}>{r.evitaveis_pct}%</td>
                <td style={{padding:"8px 12px",fontSize:11,color:"#6b7280"}}>{r.principal_fator}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {aba==="Histórico"&&h&&Array.isArray(h)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Evolução da Mortalidade — 2021–2025</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={h} margin={{top:10,right:20,left:20,bottom:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="ano" tick={{fontSize:11}}/>
              <YAxis yAxisId="left"  tick={{fontSize:11}}/>
              <YAxis yAxisId="right" orientation="right" tick={{fontSize:11}}/>
              <Tooltip/>
              <Legend/>
              <Line yAxisId="left"  type="monotone" dataKey="rmm_100k"     stroke={CRIT}  strokeWidth={2} name="RMM/100k NV" dot/>
              <Line yAxisId="right" type="monotone" dataKey="tmi_1k"       stroke={WARN}  strokeWidth={2} name="TMI/1k NV"   dot/>
              <Line yAxisId="right" type="monotone" dataKey="investigados_pct" stroke={OK} strokeWidth={2} name="Investigados %" dot strokeDasharray="4 2"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {aba==="Indicadores"&&i&&Array.isArray(i)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Indicadores do Comitê de Mortalidade</div>
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
