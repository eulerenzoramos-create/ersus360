import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { apiGet } from "../lib/api"
import { Thermometer } from "lucide-react"

const BRAND="#dbeafe", ACCENT="#1d4ed8", OK="#16a34a", WARN="#d97706", CRIT="#dc2626"
const ABAS=["Dashboard","Equipamentos","Coberturas","Histórico","Indicadores"]
const sc=(s:string)=>s==="ok"?OK:s==="atencao"?WARN:CRIT
function KPI({label,value,sub,color=BRAND}:{label:string;value:string|number;sub?:string;color?:string}){
  return <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,padding:"14px 18px",minWidth:130}}>
    <div style={{fontSize:11,color:"#6b7280",marginBottom:4}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{sub}</div>}
  </div>
}
const STATUS_COR:Record<string,string>={ok:OK,atencao:WARN,critico:CRIT,manutencao:"#9ca3af"}
export default function CadeiaFrioApui(){
  const [aba,setAba]=useState("Dashboard")
  const dash=useQuery({queryKey:["cf-dash"], queryFn:()=>apiGet("/api/cadeia-frio-apui/dashboard"),    enabled:aba==="Dashboard"})
  const eq  =useQuery({queryKey:["cf-eq"],   queryFn:()=>apiGet("/api/cadeia-frio-apui/equipamentos"), enabled:aba==="Equipamentos"})
  const cob =useQuery({queryKey:["cf-cob"],  queryFn:()=>apiGet("/api/cadeia-frio-apui/coberturas"),   enabled:aba==="Coberturas"})
  const hist=useQuery({queryKey:["cf-hist"], queryFn:()=>apiGet("/api/cadeia-frio-apui/historico"),    enabled:aba==="Histórico"})
  const ind =useQuery({queryKey:["cf-ind"],  queryFn:()=>apiGet("/api/cadeia-frio-apui/indicadores"),  enabled:aba==="Indicadores"})
  const d=dash.data as any, e=eq.data as any, c=cob.data as any, h=hist.data as any, i=ind.data as any
  return(
    <div style={{padding:"24px 32px",fontFamily:"Inter,sans-serif",background:"#f8fafc",minHeight:"100vh"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <Thermometer size={28} color={ACCENT}/>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:BRAND}}>Cadeia de Frio / PNI</div>
          <div style={{fontSize:12,color:"#6b7280"}}>Rede de Frio · Coberturas Vacinais · Equipamentos — Apuí/AM</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:24}}>
        {ABAS.map(a=><button key={a} onClick={()=>setAba(a)} style={{padding:"6px 18px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:aba===a?ACCENT:"#e5e7eb",color:aba===a?"#fff":"#374151"}}>{a}</button>)}
      </div>

      {aba==="Dashboard"&&d&&(
        <div>
          <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:20}}>
            <KPI label="Equipamentos OK"        value={`${d.equipamentos_funcionando}/${d.equipamentos_refrigeracao_total}`} color={WARN}/>
            <KPI label="Temperatura Central"    value={`${d.temperatura_media_central_c}°C`} sub="Meta: 2–8°C" color={d.temperatura_media_central_c>8||d.temperatura_media_central_c<2?CRIT:OK}/>
            <KPI label="Doses Aplicadas 2025"   value={d.doses_aplicadas_2025.toLocaleString()} color={ACCENT}/>
            <KPI label="Perda de Doses"         value={`${d.perda_pct}%`} sub="Meta: ≤ 2%"  color={OK}/>
            <KPI label="Cobertura Polio <5a"    value={`${d.cobertura_polio_menores_5_pct}%`} sub="Meta: ≥ 95%" color={WARN}/>
            <KPI label="Cobertura Tríplice Viral" value={`${d.cobertura_triplice_viral_pct}%`} sub="Meta: ≥ 95%" color={WARN}/>
            <KPI label="Cobertura COVID Atual." value={`${d.cobertura_covid_atualizado_pct}%`} sub="Meta: ≥ 70%" color={CRIT}/>
            <KPI label="UBS com Refrig. Adequado" value={`${d.ubs_com_refrigerador_adequado}/${d.ubs_total}`} color={WARN}/>
          </div>
          <div style={{background:"#fffbeb",border:"1px solid #fcd34d",borderRadius:10,padding:14,fontSize:13,color:"#92400e"}}>
            <b>Situação Crítica — Cobertura COVID:</b> Apenas {d.cobertura_covid_atualizado_pct}% da população com esquema atualizado. PSF Rural I com refrigerador acima de 8°C — risco de perda de lote.
          </div>
        </div>
      )}

      {aba==="Equipamentos"&&e&&Array.isArray(e)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Refrigeradores da Rede de Frio</div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:700}}>
              <thead><tr style={{background:"#f3f4f6"}}>
                <th style={{padding:"8px 10px",textAlign:"left",color:BRAND}}>ID</th>
                <th style={{padding:"8px 10px",textAlign:"left",color:BRAND}}>Local</th>
                <th style={{padding:"8px 10px",textAlign:"left",color:BRAND}}>Modelo</th>
                <th style={{padding:"8px 10px",textAlign:"right",color:BRAND}}>Temp. °C</th>
                <th style={{padding:"8px 10px",textAlign:"center",color:BRAND}}>Status</th>
                <th style={{padding:"8px 10px",textAlign:"center",color:BRAND}}>Garantia</th>
                <th style={{padding:"8px 10px",textAlign:"left",color:BRAND}}>Obs.</th>
              </tr></thead>
              <tbody>{e.map((r:any,idx:number)=>(
                <tr key={idx} style={{borderBottom:"1px solid #f3f4f6",background:r.status==="critico"?"#fff5f5":r.status==="manutencao"?"#f9fafb":"#fff"}}>
                  <td style={{padding:"8px 10px",fontFamily:"monospace",color:"#6b7280"}}>{r.id}</td>
                  <td style={{padding:"8px 10px",fontWeight:600}}>{r.local}</td>
                  <td style={{padding:"8px 10px",color:"#6b7280"}}>{r.modelo}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontWeight:700,color:r.temp_atual_c===null?"#9ca3af":r.temp_atual_c>8||r.temp_atual_c<2?CRIT:OK}}>{r.temp_atual_c!==null?`${r.temp_atual_c}°C`:"—"}</td>
                  <td style={{padding:"8px 10px",textAlign:"center"}}><span style={{color:STATUS_COR[r.status]||WARN,fontWeight:700,fontSize:11}}>{r.status.toUpperCase()}</span></td>
                  <td style={{padding:"8px 10px",textAlign:"center",fontSize:11,color:r.garantia==="Vencida"?CRIT:"#374151"}}>{r.garantia}</td>
                  <td style={{padding:"8px 10px",fontSize:11,color:CRIT}}>{r.obs}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {aba==="Coberturas"&&c&&Array.isArray(c)&&(
        <div>
          <div style={{background:"#fff",borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Cobertura Vacinal por Imunobiológico — 2025</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={c} layout="vertical" margin={{left:220,right:60,top:10,bottom:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis type="number" domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{fontSize:10}}/>
                <YAxis dataKey="vacina" type="category" tick={{fontSize:10}} width={220}/>
                <Tooltip formatter={(v:number)=>[`${v}%`,"Cobertura"]}/>
                <Bar dataKey="cobertura_pct" radius={[0,4,4,0]} name="Cobertura %"
                  fill={ACCENT}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:"#fff",borderRadius:12,padding:20}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{background:"#f3f4f6"}}>
                <th style={{padding:"8px 10px",textAlign:"left",color:BRAND}}>Vacina</th>
                <th style={{padding:"8px 10px",textAlign:"left",color:BRAND}}>Público</th>
                <th style={{padding:"8px 10px",textAlign:"right",color:BRAND}}>Aplicadas</th>
                <th style={{padding:"8px 10px",textAlign:"right",color:BRAND}}>Meta</th>
                <th style={{padding:"8px 10px",textAlign:"right",color:BRAND}}>Cobertura</th>
                <th style={{padding:"8px 10px",textAlign:"center",color:BRAND}}>Status</th>
              </tr></thead>
              <tbody>{c.map((r:any,idx:number)=>(
                <tr key={idx} style={{borderBottom:"1px solid #f3f4f6"}}>
                  <td style={{padding:"8px 10px",fontWeight:600}}>{r.vacina}</td>
                  <td style={{padding:"8px 10px",fontSize:11,color:"#6b7280"}}>{r.publico}</td>
                  <td style={{padding:"8px 10px",textAlign:"right"}}>{r.aplicadas_2025.toLocaleString()}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",color:"#6b7280"}}>{r.meta.toLocaleString()}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontWeight:700,color:sc(r.status)}}>{r.cobertura_pct}%</td>
                  <td style={{padding:"8px 10px",textAlign:"center"}}><span style={{color:sc(r.status),fontWeight:700,fontSize:10}}>{r.status.toUpperCase()}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {aba==="Histórico"&&h&&Array.isArray(h)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Evolução Vacinal — 2022–2025</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={h} margin={{top:10,right:20,left:20,bottom:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="ano" tick={{fontSize:11}}/>
              <YAxis yAxisId="left" tick={{fontSize:11}}/>
              <YAxis yAxisId="right" orientation="right" domain={[60,100]} tick={{fontSize:11}}/>
              <Tooltip/>
              <Legend/>
              <Line yAxisId="left"  type="monotone" dataKey="doses_aplicadas"      stroke={ACCENT} strokeWidth={2} name="Doses Aplicadas" dot/>
              <Line yAxisId="right" type="monotone" dataKey="cobertura_vop_pct"    stroke={WARN}   strokeWidth={2} name="Cobertura Polio%" dot/>
              <Line yAxisId="right" type="monotone" dataKey="cobertura_triplice_pct" stroke={OK}   strokeWidth={2} name="Cobertura Tríplice%" dot strokeDasharray="4 2"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {aba==="Indicadores"&&i&&Array.isArray(i)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Indicadores Cadeia de Frio / PNI</div>
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
