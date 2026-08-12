import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { apiGet } from "../lib/api"
import { Baby } from "lucide-react"

const BRAND="#dbeafe", ACCENT="#1d4ed8", OK="#16a34a", WARN="#d97706", CRIT="#dc2626"
const ABAS=["Dashboard","Doadoras","Receptores","Ações","Histórico","Indicadores"]
const sc=(s:string)=>s==="ok"?OK:s==="atencao"?WARN:CRIT
function KPI({label,value,sub,color=BRAND}:{label:string;value:string|number;sub?:string;color?:string}){
  return <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,padding:"14px 18px",minWidth:130}}>
    <div style={{fontSize:11,color:"#6b7280",marginBottom:4}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{sub}</div>}
  </div>
}
export default function BancoLeiteApui(){
  const [aba,setAba]=useState("Dashboard")
  const dash=useQuery({queryKey:["bl-dash"], queryFn:()=>apiGet("/api/banco-leite-apui/dashboard"),        enabled:aba==="Dashboard"})
  const doad=useQuery({queryKey:["bl-doad"], queryFn:()=>apiGet("/api/banco-leite-apui/doadoras"),         enabled:aba==="Doadoras"})
  const rec =useQuery({queryKey:["bl-rec"],  queryFn:()=>apiGet("/api/banco-leite-apui/receptores"),        enabled:aba==="Receptores"})
  const acoes=useQuery({queryKey:["bl-ac"],  queryFn:()=>apiGet("/api/banco-leite-apui/acoes-aleitamento"), enabled:aba==="Ações"})
  const hist=useQuery({queryKey:["bl-hist"], queryFn:()=>apiGet("/api/banco-leite-apui/historico"),         enabled:aba==="Histórico"})
  const ind =useQuery({queryKey:["bl-ind"],  queryFn:()=>apiGet("/api/banco-leite-apui/indicadores"),       enabled:aba==="Indicadores"})
  const d=dash.data as any, do2=doad.data as any, r=rec.data as any, a=acoes.data as any, h=hist.data as any, i=ind.data as any
  return(
    <div style={{padding:"24px 32px",fontFamily:"Inter,sans-serif",background:"#f8fafc",minHeight:"100vh"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <Baby size={28} color={ACCENT}/>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:BRAND}}>Banco de Leite Humano</div>
          <div style={{fontSize:12,color:"#6b7280"}}>BLH · Aleitamento Materno · RNPT — Apuí/AM</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
        {ABAS.map(ab=><button key={ab} onClick={()=>setAba(ab)} style={{padding:"6px 18px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:aba===ab?ACCENT:"#e5e7eb",color:aba===ab?"#fff":"#374151"}}>{ab}</button>)}
      </div>

      {aba==="Dashboard"&&!d&&<NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />}
      {aba==="Dashboard"&&d&&(
        <div>
          <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:20}}>
            <KPI label="Doadoras Ativas"           value={d.doadoras_ativas}         sub={`de ${d.doadoras_cadastradas_2025} cadastradas`} color={ACCENT}/>
            <KPI label="Coleta mL/mês"             value={d.coleta_ml_mes.toLocaleString()} sub={`Meta: ${d.coleta_meta_ml_mes.toLocaleString()} mL`} color={WARN}/>
            <KPI label="Pasteurizado/mês"          value={d.leite_pasteurizado_ml_mes.toLocaleString()} sub="mL" color={OK}/>
            <KPI label="Receptores RNPT"           value={`${d.receptores_rnpt_ativo}/${d.receptores_rnpt_meta}`} sub="ativos" color={WARN}/>
            <KPI label="AM Exclusivo 6 meses"      value={`${d.cobertura_aleitamento_exclusivo_6m_pct}%`} sub="Meta: ≥ 50%" color={CRIT}/>
            <KPI label="Perdas Qualidade"          value={`${d.perdas_controle_qualidade_pct}%`} sub="Meta: ≤ 3%" color={WARN}/>
            <KPI label="Grupos Aleitamento/mês"    value={d.grupos_aleitamento_mes}   sub="Meta: ≥ 8"  color={WARN}/>
            <KPI label="Zona Rural Doadoras"       value={`${d.doadoras_zona_rural_pct}%`} sub="do total" color={CRIT}/>
          </div>
          <div style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:10,padding:14,fontSize:13,color:"#991b1b"}}>
            <b>AM Exclusivo Crítico:</b> Apenas {d.cobertura_aleitamento_exclusivo_6m_pct}% das crianças em aleitamento exclusivo até 6 meses — 2,4× abaixo da meta OMS. Zona rural e ribeirinha sem nenhuma doadora cadastrada por falta de estrutura de coleta.
          </div>
        </div>
      )}

      {aba==="Doadoras"&&do2&&Array.isArray(do2)&&(
        <div>
          <div style={{background:"#fff",borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Coleta por Perfil de Doadora (mL/mês)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={do2} layout="vertical" margin={{left:200,right:60,top:10,bottom:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis type="number" tick={{fontSize:11}}/>
                <YAxis dataKey="perfil" type="category" tick={{fontSize:11}} width={200}/>
                <Tooltip/>
                <Bar dataKey="coleta_ml_perfil" fill={ACCENT} radius={[0,4,4,0]} name="Coleta (mL)"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {do2.map((dq:any,idx:number)=>(
              <div key={idx} style={{background:"#fff",borderRadius:10,padding:14,display:"flex",justifyContent:"space-between",alignItems:"center",borderLeft:`4px solid ${dq.doadoras>0?OK:CRIT}`}}>
                <div>
                  <div style={{fontWeight:700,fontSize:13,color:BRAND}}>{dq.perfil}</div>
                  <div style={{fontSize:11,color:OK,marginTop:2}}><b>Motivação:</b> {dq.motivacao}</div>
                  <div style={{fontSize:11,color:CRIT,marginTop:2}}><b>Barreira:</b> {dq.barreira}</div>
                </div>
                <div style={{textAlign:"right",minWidth:100}}>
                  <div style={{fontWeight:700,fontSize:20,color:dq.doadoras>0?ACCENT:CRIT}}>{dq.doadoras}</div>
                  <div style={{fontSize:10,color:"#9ca3af"}}>doadoras</div>
                  <div style={{fontSize:11,color:WARN}}>{dq.coleta_ml_perfil.toLocaleString()} mL</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {aba==="Receptores"&&r&&Array.isArray(r)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Receptores de Leite Pasteurizado</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:"#f3f4f6"}}>
              <th style={{padding:"8px 12px",textAlign:"left",color:BRAND}}>Categoria</th>
              <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>Receptores</th>
              <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>mL/dia prescrito</th>
              <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>Atendimento %</th>
              <th style={{padding:"8px 12px",textAlign:"center",color:BRAND}}>Prioridade</th>
            </tr></thead>
            <tbody>{r.map((rr:any,idx:number)=>(
              <tr key={idx} style={{borderBottom:"1px solid #f3f4f6",background:rr.atendimento_pct===0?"#fff5f5":"#fff"}}>
                <td style={{padding:"8px 12px"}}>{rr.categoria}{rr.obs&&<div style={{fontSize:10,color:CRIT}}>{rr.obs}</div>}</td>
                <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700}}>{rr.receptores}</td>
                <td style={{padding:"8px 12px",textAlign:"right",color:"#6b7280"}}>{rr.volume_prescrito_ml_dia||"—"}</td>
                <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:rr.atendimento_pct===0?CRIT:rr.atendimento_pct<85?WARN:OK}}>{rr.atendimento_pct>0?`${rr.atendimento_pct}%`:"—"}</td>
                <td style={{padding:"8px 12px",textAlign:"center"}}><span style={{fontSize:11,fontWeight:700,color:rr.prioridade==="máxima"?CRIT:rr.prioridade==="alta"?WARN:ACCENT}}>{rr.prioridade}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {aba==="Ações"&&a&&Array.isArray(a)&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {a.map((ac:any,idx:number)=>(
            <div key={idx} style={{background:"#fff",borderRadius:10,padding:16,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:13,color:BRAND,marginBottom:4}}>{ac.acao}</div>
                <div style={{fontSize:11,color:"#6b7280"}}><b>Local:</b> {ac.local}</div>
                <div style={{fontSize:11,color:OK,marginTop:4}}><b>Resultado:</b> {ac.resultado}</div>
              </div>
              <div style={{textAlign:"right",minWidth:120,marginLeft:16}}>
                <div style={{fontWeight:700,fontSize:18,color:ACCENT}}>{ac.realizacoes_mes}</div>
                <div style={{fontSize:10,color:"#9ca3af"}}>realizações/mês</div>
                <div style={{fontSize:11,color:WARN,fontWeight:600}}>{ac.participantes_mes} partic.</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {aba==="Histórico"&&h&&Array.isArray(h)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Evolução BLH e AM — 2022–2025</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={h} margin={{top:10,right:20,left:20,bottom:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="ano" tick={{fontSize:11}}/>
              <YAxis yAxisId="left" tick={{fontSize:11}}/>
              <YAxis yAxisId="right" orientation="right" domain={[25,50]} tick={{fontSize:11}}/>
              <Tooltip/>
              <Legend/>
              <Line yAxisId="left"  type="monotone" dataKey="doadoras"         stroke={ACCENT}strokeWidth={2} name="Doadoras"      dot/>
              <Line yAxisId="left"  type="monotone" dataKey="receptores"       stroke={OK}    strokeWidth={2} name="Receptores"    dot/>
              <Line yAxisId="right" type="monotone" dataKey="cobertura_am6m_pct" stroke={WARN} strokeWidth={2} name="AM Exclus. %" dot strokeDasharray="4 2"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {aba==="Indicadores"&&i&&Array.isArray(i)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Indicadores BLH e Aleitamento Materno</div>
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
