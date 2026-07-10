import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { apiGet } from "../lib/api"
import { Users } from "lucide-react"

const BRAND="#1e3a5f", ACCENT="#1d4ed8", OK="#16a34a", WARN="#d97706", CRIT="#dc2626"
const ABAS=["Dashboard","Equipes","Atividades","Histórico","Indicadores"]
const sc=(s:string)=>s==="ok"?OK:s==="atencao"?WARN:CRIT
function KPI({label,value,sub,color=BRAND}:{label:string;value:string|number;sub?:string;color?:string}){
  return <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,padding:"14px 18px",minWidth:130}}>
    <div style={{fontSize:11,color:"#6b7280",marginBottom:4}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{sub}</div>}
  </div>
}
export default function MatriciamentoNasfApui(){
  const [aba,setAba]=useState("Dashboard")
  const dash=useQuery({queryKey:["mn-dash"],  queryFn:()=>apiGet("/api/matriciamento-nasf-apui/dashboard"),  enabled:aba==="Dashboard"})
  const eq  =useQuery({queryKey:["mn-eq"],    queryFn:()=>apiGet("/api/matriciamento-nasf-apui/equipes"),    enabled:aba==="Equipes"})
  const atv =useQuery({queryKey:["mn-atv"],   queryFn:()=>apiGet("/api/matriciamento-nasf-apui/atividades"), enabled:aba==="Atividades"})
  const hist=useQuery({queryKey:["mn-hist"],  queryFn:()=>apiGet("/api/matriciamento-nasf-apui/historico"),  enabled:aba==="Histórico"})
  const ind =useQuery({queryKey:["mn-ind"],   queryFn:()=>apiGet("/api/matriciamento-nasf-apui/indicadores"),enabled:aba==="Indicadores"})
  const d=dash.data as any, e=eq.data as any, a=atv.data as any, h=hist.data as any, i=ind.data as any
  const profs=d?.profissionais
  return(
    <div style={{padding:"24px 32px",fontFamily:"Inter,sans-serif",background:"#f8fafc",minHeight:"100vh"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <Users size={28} color={ACCENT}/>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:BRAND}}>Matriciamento NASF-AB / eMulti</div>
          <div style={{fontSize:12,color:"#6b7280"}}>Apoio Matricial · Equipes Multiprofissionais — Apuí/AM</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:24}}>
        {ABAS.map(ab=><button key={ab} onClick={()=>setAba(ab)} style={{padding:"6px 18px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:aba===ab?ACCENT:"#e5e7eb",color:aba===ab?"#fff":"#374151"}}>{ab}</button>)}
      </div>

      {aba==="Dashboard"&&d&&(
        <div>
          <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:20}}>
            <KPI label="eSF com eMulti"            value={`${d.equipes_sf_com_emulti}/${d.equipes_sf_total}`} sub="equipes cobertas" color={WARN}/>
            <KPI label="Profissionais eMulti"       value={`${d.profissionais_emulti_ativo}/${d.profissionais_emulti_meta}`} sub="meta" color={WARN}/>
            <KPI label="Atend. Compartilhados/mês" value={d.atendimentos_compartilhados_mes} color={ACCENT}/>
            <KPI label="Consultorias Matriciais"    value={d.consultorias_matriciais_mes} sub="por mês"       color={ACCENT}/>
            <KPI label="Discussão de Casos"         value={d.casos_discussao_quinzenal}   sub="quinzenal"    color={OK}/>
            <KPI label="VD Conjuntas/mês"           value={d.visitas_domiciliares_conjuntas_mes} color={OK}/>
            <KPI label="Enc. Reduzidos"             value={`${d.encaminhamentos_reduzidos_pct}%`} sub="Meta: ≥ 40%" color={WARN}/>
            <KPI label="Satisfação eSF"             value={`${d.satisfacao_esf_pct}%`}   sub="Meta: ≥ 85%"  color={WARN}/>
          </div>
          {profs&&(
            <div style={{background:"#fff",borderRadius:12,padding:16,marginBottom:16}}>
              <div style={{fontWeight:700,color:BRAND,marginBottom:10,fontSize:13}}>Composição eMulti Atual</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {Object.entries(profs).map(([k,v]:any)=>(
                  <span key={k} style={{padding:"4px 12px",borderRadius:12,fontSize:12,fontWeight:600,background:v>0?"#dbeafe":"#f3f4f6",color:v>0?ACCENT:"#9ca3af"}}>
                    {k.replace(/_/g," ")} ({v})
                  </span>
                ))}
              </div>
            </div>
          )}
          <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:10,padding:14,fontSize:13,color:"#1e40af"}}>
            <b>Sem apoio:</b> eSF Rural I (42 km da sede) e eSF Ribeirinha — as 2 equipes que atendem populações mais vulneráveis não têm nenhum profissional de apoio matricial.
          </div>
        </div>
      )}

      {aba==="Equipes"&&e&&Array.isArray(e)&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {e.map((r:any,idx:number)=>(
            <div key={idx} style={{background:"#fff",borderRadius:12,padding:16,borderLeft:`4px solid ${r.com_emulti?OK:CRIT}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div>
                  <div style={{fontWeight:700,fontSize:14,color:BRAND}}>{r.esf}</div>
                  <div style={{fontSize:12,color:"#6b7280"}}>{r.medico}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <span style={{background:r.com_emulti?"#dcfce7":"#fee2e2",color:r.com_emulti?OK:CRIT,fontWeight:700,fontSize:11,padding:"3px 10px",borderRadius:12}}>{r.com_emulti?"COM eMULTI":"SEM eMULTI"}</span>
                </div>
              </div>
              {r.com_emulti?(
                <div>
                  <div style={{fontSize:11,marginBottom:6}}>
                    <b>Núcleos de apoio:</b>{" "}
                    {r.apoio_nucleo.map((n:string,ni:number)=><span key={ni} style={{background:"#dbeafe",color:ACCENT,padding:"2px 8px",borderRadius:10,fontSize:11,marginRight:4}}>{n}</span>)}
                  </div>
                  <div style={{fontSize:12,color:"#374151"}}>
                    <b style={{color:ACCENT}}>{r.atend_compartilhados_mes}</b> atend. compartilhados/mês · Discussão: <b>{r.discussao_caso}</b>
                  </div>
                  <div style={{fontSize:11,color:"#6b7280",marginTop:4}}>Demanda principal: {r.demanda_principal}</div>
                </div>
              ):(
                <div style={{fontSize:12,color:CRIT,fontWeight:600}}>{r.demanda_principal}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {aba==="Atividades"&&a&&Array.isArray(a)&&(
        <div>
          <div style={{background:"#fff",borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Produção por Tipo de Atividade</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={a} layout="vertical" margin={{left:240,right:60,top:10,bottom:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis type="number" tick={{fontSize:11}}/>
                <YAxis dataKey="tipo" type="category" tick={{fontSize:10}} width={240}/>
                <Tooltip/>
                <Bar dataKey="meta_mes"      fill="#e5e7eb" name="Meta/mês"      radius={[0,4,4,0]}/>
                <Bar dataKey="realizadas_mes" fill={ACCENT} name="Realizadas/mês" radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:"#fff",borderRadius:12,padding:20}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{background:"#f3f4f6"}}>
                <th style={{padding:"8px 10px",textAlign:"left",color:BRAND}}>Tipo</th>
                <th style={{padding:"8px 10px",textAlign:"center",color:BRAND}}>Real/Meta</th>
                <th style={{padding:"8px 10px",textAlign:"left",color:BRAND}}>Profissional</th>
                <th style={{padding:"8px 10px",textAlign:"left",color:BRAND}}>Demanda</th>
              </tr></thead>
              <tbody>{a.map((r:any,idx:number)=>(
                <tr key={idx} style={{borderBottom:"1px solid #f3f4f6"}}>
                  <td style={{padding:"8px 10px",fontWeight:600}}>{r.tipo}</td>
                  <td style={{padding:"8px 10px",textAlign:"center",fontWeight:700,color:r.realizadas_mes>=r.meta_mes?OK:WARN}}>{r.realizadas_mes}/{r.meta_mes}</td>
                  <td style={{padding:"8px 10px",fontSize:11,color:"#6b7280"}}>{r.profissional_apoio}</td>
                  <td style={{padding:"8px 10px",fontSize:11,color:"#6b7280"}}>{r.principais_queixas}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {aba==="Histórico"&&h&&Array.isArray(h)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Produção eMulti — Jan a Jun/2025</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={h} margin={{top:10,right:20,left:20,bottom:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="mes" tick={{fontSize:10}}/>
              <YAxis tick={{fontSize:11}}/>
              <Tooltip/>
              <Legend/>
              <Line type="monotone" dataKey="atendimentos_compartilhados" stroke={ACCENT} strokeWidth={2} name="Atend. Compartilhados" dot/>
              <Line type="monotone" dataKey="consultorias"                stroke={OK}    strokeWidth={2} name="Consultorias"           dot/>
              <Line type="monotone" dataKey="grupos"                      stroke={WARN}  strokeWidth={2} name="Grupos"                 dot strokeDasharray="4 2"/>
              <Line type="monotone" dataKey="vd_conjuntas"                stroke={CRIT}  strokeWidth={2} name="VD Conjuntas"           dot strokeDasharray="4 2"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {aba==="Indicadores"&&i&&Array.isArray(i)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Indicadores de Matriciamento</div>
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
