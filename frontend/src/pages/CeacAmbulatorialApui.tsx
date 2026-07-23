import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { apiGet } from "../lib/api"
import { Stethoscope } from "lucide-react"

const BRAND="#dbeafe", ACCENT="#1d4ed8", OK="#16a34a", WARN="#d97706", CRIT="#dc2626"
const ABAS=["Dashboard","Especialidades","Exames","Histórico","Indicadores"]
const sc=(s:string)=>s==="ok"?OK:s==="atencao"?WARN:CRIT
function KPI({label,value,sub,color=BRAND}:{label:string;value:string|number;sub?:string;color?:string}){
  return <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,padding:"14px 18px",minWidth:130}}>
    <div style={{fontSize:11,color:"#6b7280",marginBottom:4}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{sub}</div>}
  </div>
}
export default function CeacAmbulatorialApui(){
  const [aba,setAba]=useState("Dashboard")
  const dash=useQuery({queryKey:["ca-dash"], queryFn:()=>apiGet("/api/ceac-ambulatorial-apui/dashboard"),    enabled:aba==="Dashboard"})
  const esp =useQuery({queryKey:["ca-esp"],  queryFn:()=>apiGet("/api/ceac-ambulatorial-apui/especialidades"),enabled:aba==="Especialidades"})
  const exm =useQuery({queryKey:["ca-exm"],  queryFn:()=>apiGet("/api/ceac-ambulatorial-apui/exames"),       enabled:aba==="Exames"})
  const hist=useQuery({queryKey:["ca-hist"], queryFn:()=>apiGet("/api/ceac-ambulatorial-apui/historico"),    enabled:aba==="Histórico"})
  const ind =useQuery({queryKey:["ca-ind"],  queryFn:()=>apiGet("/api/ceac-ambulatorial-apui/indicadores"),  enabled:aba==="Indicadores"})
  const d=dash.data as any, e=esp.data as any, x=exm.data as any, h=hist.data as any, i=ind.data as any
  return(
    <div style={{padding:"24px 32px",fontFamily:"Inter,sans-serif",background:"#f8fafc",minHeight:"100vh"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <Stethoscope size={28} color={ACCENT}/>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:BRAND}}>CEAC — Atenção Ambulatorial</div>
          <div style={{fontSize:12,color:"#6b7280"}}>Produção Ambulatorial · Especialidades · Exames · Filas — Apuí/AM</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:24}}>
        {ABAS.map(a=><button key={a} onClick={()=>setAba(a)} style={{padding:"6px 18px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:aba===a?ACCENT:"#e5e7eb",color:aba===a?"#fff":"#374151"}}>{a}</button>)}
      </div>

      {aba==="Dashboard"&&d&&(
        <div>
          <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:20}}>
            <KPI label="Procedimentos Amb./mês"  value={d.procedimentos_ambulatoriais_mes.toLocaleString()} color={ACCENT}/>
            <KPI label="Consultas Especializadas" value={d.consultas_especializadas_mes} sub="por mês"       color={ACCENT}/>
            <KPI label="Exames Represados"        value={d.exames_represados.toLocaleString()}               color={CRIT}/>
            <KPI label="Fila Cirúrgica Total"     value={d.fila_cirurgica_total}          sub="eletivas"     color={CRIT}/>
            <KPI label="Espera Consulta Espec."   value={`${d.tempo_espera_consulta_especializada_dias}d`} sub="Meta: ≤ 60d" color={CRIT}/>
            <KPI label="Espera Cirurgia Eletiva"  value={`${d.tempo_espera_cirurgia_eletiva_dias}d`} sub="Meta: ≤ 120d" color={CRIT}/>
            <KPI label="Absenteismo Consultas"    value={`${d.taxa_absenteismo_consultas_pct}%`} sub="Meta: ≤ 10%" color={WARN}/>
            <KPI label="Resolubilidade APS"       value={`${d.resolubilidade_aps_pct}%`} sub="Meta: ≥ 85%" color={WARN}/>
          </div>
          <div style={{display:"flex",gap:12}}>
            <div style={{flex:1,background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:10,padding:14,fontSize:13,color:"#991b1b"}}>
              <b>Filas Críticas:</b> TC e RM com zero realizações — {d.exames_represados} exames represados. 5 especialidades sem médico local: Ortopedia ({184}d), Neurologia ({248}d), Endocrinologia.
            </div>
            <div style={{flex:1,background:"#fef3c7",border:"1px solid #fcd34d",borderRadius:10,padding:14,fontSize:13,color:"#92400e"}}>
              <b>MAC mensal:</b> R$ {(d.despesa_mac_mensal_r/1000).toFixed(0)}k de R$ {(d.teto_mac_mensal_r/1000).toFixed(0)}k teto. Resolubilidade APS {d.resolubilidade_aps_pct}% — meta 85%.
            </div>
          </div>
        </div>
      )}

      {aba==="Especialidades"&&e&&Array.isArray(e)&&(
        <div>
          <div style={{background:"#fff",borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Espera por Especialidade (dias)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={e} layout="vertical" margin={{left:200,right:60,top:10,bottom:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis type="number" tick={{fontSize:11}}/>
                <YAxis dataKey="especialidade" type="category" tick={{fontSize:11}} width={200}/>
                <Tooltip/>
                <Bar dataKey="espera_dias" radius={[0,4,4,0]} name="Espera (dias)"
                  fill={CRIT}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:"#fff",borderRadius:12,padding:20}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:600}}>
                <thead><tr style={{background:"#f3f4f6"}}>
                  <th style={{padding:"8px 10px",textAlign:"left",color:BRAND}}>Especialidade</th>
                  <th style={{padding:"8px 10px",textAlign:"right",color:BRAND}}>Consult./mês</th>
                  <th style={{padding:"8px 10px",textAlign:"right",color:BRAND}}>Fila</th>
                  <th style={{padding:"8px 10px",textAlign:"right",color:BRAND}}>Espera (d)</th>
                  <th style={{padding:"8px 10px",textAlign:"right",color:BRAND}}>Res. APS %</th>
                  <th style={{padding:"8px 10px",textAlign:"center",color:BRAND}}>Médicos</th>
                  <th style={{padding:"8px 10px",textAlign:"center",color:BRAND}}>Status</th>
                </tr></thead>
                <tbody>{e.map((r:any,idx:number)=>(
                  <tr key={idx} style={{borderBottom:"1px solid #f3f4f6",background:r.medicos_disponíveis===0?"#fff5f5":"#fff"}}>
                    <td style={{padding:"8px 10px",fontWeight:600}}>{r.especialidade}</td>
                    <td style={{padding:"8px 10px",textAlign:"right"}}>{r.consultas_mes}</td>
                    <td style={{padding:"8px 10px",textAlign:"right",fontWeight:700,color:r.fila>80?CRIT:WARN}}>{r.fila}</td>
                    <td style={{padding:"8px 10px",textAlign:"right",fontWeight:700,color:r.espera_dias>120?CRIT:r.espera_dias>60?WARN:OK}}>{r.espera_dias}d</td>
                    <td style={{padding:"8px 10px",textAlign:"right",color:"#6b7280"}}>{r.resolve_aps_pct}%</td>
                    <td style={{padding:"8px 10px",textAlign:"center",fontWeight:700,color:r.medicos_disponíveis===0?CRIT:OK}}>{r.medicos_disponíveis===0?"—":r.medicos_disponíveis}</td>
                    <td style={{padding:"8px 10px",textAlign:"center"}}><span style={{color:sc(r.status),fontWeight:700,fontSize:10}}>{r.status.toUpperCase()}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {aba==="Exames"&&x&&Array.isArray(x)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Exames Solicitados × Realizados × Represados</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:"#f3f4f6"}}>
              <th style={{padding:"8px 12px",textAlign:"left",color:BRAND}}>Grupo</th>
              <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>Solicitados</th>
              <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>Realizados</th>
              <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>Represados</th>
              <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>Prazo Res.</th>
              <th style={{padding:"8px 12px",textAlign:"center",color:BRAND}}>Status</th>
            </tr></thead>
            <tbody>{x.map((r:any,idx:number)=>(
              <tr key={idx} style={{borderBottom:"1px solid #f3f4f6",background:r.status==="critico"?"#fff5f5":"#fff"}}>
                <td style={{padding:"8px 12px",fontWeight:600}}>{r.grupo}</td>
                <td style={{padding:"8px 12px",textAlign:"right"}}>{r.solicitados_mes}</td>
                <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:r.realizados_mes===0?CRIT:OK}}>{r.realizados_mes}</td>
                <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:r.represados>100?CRIT:r.represados>50?WARN:OK}}>{r.represados}</td>
                <td style={{padding:"8px 12px",textAlign:"right",color:"#6b7280"}}>{r.tempo_resultado_dias!==null?`${r.tempo_resultado_dias}d`:"—"}</td>
                <td style={{padding:"8px 12px",textAlign:"center"}}><span style={{color:sc(r.status),fontWeight:700,fontSize:11}}>{r.status.toUpperCase()}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {aba==="Histórico"&&h&&Array.isArray(h)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Produção Ambulatorial — Jan a Jun/2025</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={h} margin={{top:10,right:20,left:20,bottom:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="mes" tick={{fontSize:10}}/>
              <YAxis yAxisId="left" tick={{fontSize:11}}/>
              <YAxis yAxisId="right" orientation="right" tick={{fontSize:11}}/>
              <Tooltip/>
              <Legend/>
              <Line yAxisId="left"  type="monotone" dataKey="producao_amb"       stroke={ACCENT}strokeWidth={2} name="Produção Amb." dot/>
              <Line yAxisId="right" type="monotone" dataKey="exames_realizados"  stroke={OK}    strokeWidth={2} name="Exames Real."  dot/>
              <Line yAxisId="right" type="monotone" dataKey="consultas_espec"    stroke={WARN}  strokeWidth={2} name="Consult. Espec." dot strokeDasharray="4 2"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {aba==="Indicadores"&&i&&Array.isArray(i)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Indicadores Ambulatoriais</div>
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
