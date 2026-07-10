import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { apiGet } from "../lib/api"
import { Bug } from "lucide-react"

const BRAND="#1e3a5f", ACCENT="#1d4ed8", OK="#16a34a", WARN="#d97706", CRIT="#dc2626"
const ABAS=["Dashboard","LIRAa","Nebulizações","Histórico","Indicadores"]
const sc=(s:string)=>s==="ok"?OK:s==="atencao"?WARN:CRIT
function KPI({label,value,sub,color=BRAND}:{label:string;value:string|number;sub?:string;color?:string}){
  return <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,padding:"14px 18px",minWidth:130}}>
    <div style={{fontSize:11,color:"#6b7280",marginBottom:4}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{sub}</div>}
  </div>
}
export default function ControleVetorialApui(){
  const [aba,setAba]=useState("Dashboard")
  const dash=useQuery({queryKey:["cv-dash"],  queryFn:()=>apiGet("/api/controle-vetorial-apui/dashboard"),    enabled:aba==="Dashboard"})
  const lir =useQuery({queryKey:["cv-lira"],  queryFn:()=>apiGet("/api/controle-vetorial-apui/liraa"),         enabled:aba==="LIRAa"})
  const neb =useQuery({queryKey:["cv-neb"],   queryFn:()=>apiGet("/api/controle-vetorial-apui/nebulizacoes"),  enabled:aba==="Nebulizações"})
  const hist=useQuery({queryKey:["cv-hist"],  queryFn:()=>apiGet("/api/controle-vetorial-apui/historico"),     enabled:aba==="Histórico"})
  const ind =useQuery({queryKey:["cv-ind"],   queryFn:()=>apiGet("/api/controle-vetorial-apui/indicadores"),   enabled:aba==="Indicadores"})
  const d=dash.data as any, l=lir.data as any, n=neb.data as any, h=hist.data as any, i=ind.data as any
  return(
    <div style={{padding:"24px 32px",fontFamily:"Inter,sans-serif",background:"#f8fafc",minHeight:"100vh"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <Bug size={28} color={CRIT}/>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:BRAND}}>Controle Vetorial</div>
          <div style={{fontSize:12,color:"#6b7280"}}>Dengue · Aedes aegypti · LIRAa · Nebulização — Apuí/AM</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:24}}>
        {ABAS.map(a=><button key={a} onClick={()=>setAba(a)} style={{padding:"6px 18px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:aba===a?ACCENT:"#e5e7eb",color:aba===a?"#fff":"#374151"}}>{a}</button>)}
      </div>

      {aba==="Dashboard"&&d&&(
        <div>
          <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:20}}>
            <KPI label="IIP Aedes Atual"        value={`${d.iip_aedes_atual_pct}%`}  sub="Meta: < 1%"           color={CRIT}/>
            <KPI label="Nível de Risco Dengue"  value={d.nivel_risco_dengue.toUpperCase()} color={CRIT}/>
            <KPI label="Agentes de Endemias"    value={`${d.agentes_endemias_ativo}/${d.agentes_endemias_necessario}`} sub="necessários" color={CRIT}/>
            <KPI label="Cobertura Visitas"      value={`${d.cobertura_visitas_pct}%`} sub="dos imóveis/mês"     color={WARN}/>
            <KPI label="Focos Eliminados 2025"  value={d.focos_eliminados_2025.toLocaleString()} color={OK}/>
            <KPI label="Estoque Inseticida"     value={`${d.inseticidas_estoque_meses} meses`} sub="Meta: ≥ 3 meses" color={CRIT}/>
            <KPI label="Nebulizações 2025"      value={`${d.nebulizacoes_realizadas_2025}/${d.nebulizacoes_meta_2025}`} color={WARN}/>
            <KPI label="Positividade Ovitrampa" value={`${d.positivas_ovitrampa_pct}%`} color={WARN}/>
          </div>
          <div style={{background:"#fff3cd",border:"1px solid #ffc107",borderRadius:10,padding:14,fontSize:13,color:"#856404"}}>
            <b>⚠ Situação Crítica:</b> IIP {d.iip_aedes_atual_pct}% — acima do nível crítico (3,9%). Apenas {d.agentes_endemias_ativo} de {d.agentes_endemias_necessario} agentes necessários. Estoque de inseticida para {d.inseticidas_estoque_meses} meses.
          </div>
        </div>
      )}

      {aba==="LIRAa"&&l&&Array.isArray(l)&&(
        <div>
          <div style={{background:"#fff",borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Levantamentos de Índice Rápido de Aedes aegypti</div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{background:"#f3f4f6"}}>
                <th style={{padding:"8px 12px",textAlign:"left",color:BRAND}}>Ciclo</th>
                <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>IIP %</th>
                <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>IIB %</th>
                <th style={{padding:"8px 12px",textAlign:"center",color:BRAND}}>Nível</th>
                <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>Imóveis</th>
                <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>Focos</th>
                <th style={{padding:"8px 12px",textAlign:"left",color:BRAND}}>Depósitos</th>
              </tr></thead>
              <tbody>{l.map((r:any,idx:number)=>(
                <tr key={idx} style={{borderBottom:"1px solid #f3f4f6"}}>
                  <td style={{padding:"8px 12px",fontWeight:600}}>{r.ciclo}</td>
                  <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:r.iip_pct===null?"#9ca3af":r.iip_pct>3.9?CRIT:r.iip_pct>1?WARN:OK}}>{r.iip_pct!==null?`${r.iip_pct}%`:"—"}</td>
                  <td style={{padding:"8px 12px",textAlign:"right"}}>{r.iib_pct!==null?`${r.iib_pct}%`:"—"}</td>
                  <td style={{padding:"8px 12px",textAlign:"center"}}><span style={{color:r.nivel==="critico"?CRIT:r.nivel==="alerta"?WARN:r.nivel==="pendente"?"#9ca3af":OK,fontWeight:700,fontSize:11}}>{r.nivel.toUpperCase()}</span></td>
                  <td style={{padding:"8px 12px",textAlign:"right",color:"#6b7280"}}>{r.imoveis_inspecionados||"—"}</td>
                  <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700}}>{r.focos||"—"}</td>
                  <td style={{padding:"8px 12px",fontSize:11,color:"#6b7280"}}>{r.principais_depositos}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{background:"#fff",borderRadius:12,padding:20}}>
            <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Ações por Ciclo</div>
            {l.filter((r:any)=>r.acoes!=="—").map((r:any,idx:number)=>(
              <div key={idx} style={{padding:"8px 12px",borderBottom:"1px solid #f3f4f6",fontSize:13}}>
                <span style={{fontWeight:600,color:ACCENT}}>{r.ciclo}:</span> {r.acoes}
              </div>
            ))}
          </div>
        </div>
      )}

      {aba==="Nebulizações"&&n&&Array.isArray(n)&&(
        <div>
          <div style={{background:"#fff",borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Nebulizações Ultra-Baixo Volume — 2025</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={n} margin={{top:10,right:20,left:20,bottom:20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="mes" tick={{fontSize:10}}/>
                <YAxis tick={{fontSize:11}}/>
                <Tooltip/>
                <Legend/>
                <Bar dataKey="programadas" fill="#e5e7eb" name="Programadas" radius={[4,4,0,0]}/>
                <Bar dataKey="realizadas"  fill={ACCENT}  name="Realizadas"  radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:"#fff",borderRadius:12,padding:20}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{background:"#f3f4f6"}}>
                <th style={{padding:"8px 10px",textAlign:"left",color:BRAND}}>Mês</th>
                <th style={{padding:"8px 10px",textAlign:"center",color:BRAND}}>Realizadas</th>
                <th style={{padding:"8px 10px",textAlign:"right",color:BRAND}}>KM</th>
                <th style={{padding:"8px 10px",textAlign:"right",color:BRAND}}>Inseticida (L)</th>
                <th style={{padding:"8px 10px",textAlign:"left",color:BRAND}}>Bairros</th>
                <th style={{padding:"8px 10px",textAlign:"left",color:BRAND}}>Obs.</th>
              </tr></thead>
              <tbody>{n.map((r:any,idx:number)=>(
                <tr key={idx} style={{borderBottom:"1px solid #f3f4f6"}}>
                  <td style={{padding:"8px 10px",fontWeight:600}}>{r.mes}</td>
                  <td style={{padding:"8px 10px",textAlign:"center",fontWeight:700,color:r.realizadas>=r.programadas?OK:WARN}}>{r.realizadas}/{r.programadas}</td>
                  <td style={{padding:"8px 10px",textAlign:"right"}}>{r.km_percorridos}</td>
                  <td style={{padding:"8px 10px",textAlign:"right"}}>{r.inseticida_litros}</td>
                  <td style={{padding:"8px 10px",fontSize:11,color:"#6b7280"}}>{r.cobertura_bairros}</td>
                  <td style={{padding:"8px 10px",fontSize:11,color:CRIT}}>{r.obs||""}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {aba==="Histórico"&&h&&Array.isArray(h)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Evolução Anual — IIP e Dengue</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={h} margin={{top:10,right:20,left:20,bottom:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="ano" tick={{fontSize:11}}/>
              <YAxis yAxisId="left" tick={{fontSize:11}}/>
              <YAxis yAxisId="right" orientation="right" tick={{fontSize:11}}/>
              <Tooltip/>
              <Legend/>
              <Line yAxisId="left"  type="monotone" dataKey="iip_medio_pct"  stroke={CRIT}  strokeWidth={2} name="IIP Médio %" dot/>
              <Line yAxisId="right" type="monotone" dataKey="casos_dengue"   stroke={WARN}  strokeWidth={2} name="Casos Dengue" dot/>
              <Line yAxisId="right" type="monotone" dataKey="focos_eliminados" stroke={OK}  strokeWidth={2} name="Focos Elim." dot strokeDasharray="4 2"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {aba==="Indicadores"&&i&&Array.isArray(i)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Indicadores de Controle Vetorial</div>
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
