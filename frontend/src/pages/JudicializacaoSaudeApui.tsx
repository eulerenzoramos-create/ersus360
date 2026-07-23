import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { apiGet } from "../lib/api"
import { Scale } from "lucide-react"

const BRAND="#dbeafe", ACCENT="#1d4ed8", OK="#16a34a", WARN="#d97706", CRIT="#dc2626"
const ABAS=["Dashboard","Por Categoria","Medicamentos","Histórico","Indicadores"]
const sc=(s:string)=>s==="ok"?OK:s==="atencao"?WARN:CRIT
function KPI({label,value,sub,color=BRAND}:{label:string;value:string|number;sub?:string;color?:string}){
  return <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,padding:"14px 18px",minWidth:130}}>
    <div style={{fontSize:11,color:"#6b7280",marginBottom:4}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{sub}</div>}
  </div>
}
export default function JudicializacaoSaudeApui(){
  const [aba,setAba]=useState("Dashboard")
  const dash=useQuery({queryKey:["jud-dash"],queryFn:()=>apiGet("/api/judicializacao-saude-apui/dashboard"),           enabled:aba==="Dashboard"})
  const cat =useQuery({queryKey:["jud-cat"], queryFn:()=>apiGet("/api/judicializacao-saude-apui/processos-categoria"), enabled:aba==="Por Categoria"})
  const med =useQuery({queryKey:["jud-med"], queryFn:()=>apiGet("/api/judicializacao-saude-apui/medicamentos-judiciais"),enabled:aba==="Medicamentos"})
  const hist=useQuery({queryKey:["jud-hist"],queryFn:()=>apiGet("/api/judicializacao-saude-apui/historico"),           enabled:aba==="Histórico"})
  const ind =useQuery({queryKey:["jud-ind"], queryFn:()=>apiGet("/api/judicializacao-saude-apui/indicadores"),         enabled:aba==="Indicadores"})
  const d=dash.data as any, c=cat.data as any, m=med.data as any, h=hist.data as any, i=ind.data as any
  return(
    <div style={{padding:"24px 32px",fontFamily:"Inter,sans-serif",background:"#f8fafc",minHeight:"100vh"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <Scale size={28} color={ACCENT}/>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:BRAND}}>Judicialização em Saúde</div>
          <div style={{fontSize:12,color:"#6b7280"}}>Processos · Medicamentos · Impacto Orçamentário — Apuí/AM</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
        {ABAS.map(a=><button key={a} onClick={()=>setAba(a)} style={{padding:"6px 18px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:aba===a?ACCENT:"#e5e7eb",color:aba===a?"#fff":"#374151"}}>{a}</button>)}
      </div>

      {aba==="Dashboard"&&d&&(
        <div>
          <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:20}}>
            <KPI label="Processos Ativos 2025"     value={d.processos_ativos_2025}   sub={`+${d.processos_novos_2025} novos`}      color={CRIT}/>
            <KPI label="Gasto Judicialização 2025" value={`R$ ${(d.gasto_judicializacao_2025_r/1000).toFixed(0)}k`} sub={`${d.gasto_judicializacao_orcamento_saude_pct}% do orçamento`} color={CRIT}/>
            <KPI label="Cumprimento em Dia"        value={`${d.cumprimento_judicial_em_dia_pct}%`} sub="Meta: ≥ 95%"               color={WARN}/>
            <KPI label="Multas por Descumprimento" value={`R$ ${(d.descumprimento_multas_2025_r/1000).toFixed(0)}k`}               color={CRIT}/>
            <KPI label="Medicamentos Distintos"    value={d.medicamentos_demandados_distintos}                                     color={ACCENT}/>
            <KPI label="Fora RENAME/REMUME"        value={`${d.medicamentos_fora_lista_pct}%`} sub="Meta: < 30%"                  color={CRIT}/>
            <KPI label="Cirurgias Judiciais"       value={d.cirurgias_judiciais_pendentes}   sub="pendentes"                      color={WARN}/>
            <KPI label="Resposta NAP/NUDJUS"       value={`${d.nap_nudjus_resposta_media_dias} dias`} sub="Meta: ≤ 5 dias"        color={WARN}/>
          </div>
          <div style={{display:"flex",gap:12}}>
            <div style={{flex:1,background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:10,padding:14,fontSize:13,color:"#991b1b"}}>
              <b>Crescimento acelerado:</b> R$ 184k → R$ 384k em 3 anos (+109%). Sem NAT/NATjus local — defesa extrajudicial inexistente. 71,4% dos pedidos são por medicamentos fora da lista com alternativa terapêutica disponível.
            </div>
            <div style={{flex:1,background:"#fef3c7",border:"1px solid #fcd34d",borderRadius:10,padding:14,fontSize:13,color:"#92400e"}}>
              <b>Prazo judicial 48h:</b> Município recebe intimação e tem 48h para cumprir. Mas resposta do NUDJUS estadual demora 18 dias. Resultado: cumprimento tardio com multas de R$ 48k/ano.
            </div>
          </div>
        </div>
      )}

      {aba==="Por Categoria"&&c&&Array.isArray(c)&&(
        <div>
          <div style={{background:"#fff",borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Processos por Categoria — Custo Mensal</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={c} layout="vertical" margin={{left:260,right:60,top:10,bottom:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis type="number" tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`} tick={{fontSize:10}}/>
                <YAxis dataKey="categoria" type="category" tick={{fontSize:10}} width={260}/>
                <Tooltip formatter={(v:number)=>[`R$ ${v.toLocaleString()}`,"Custo/mês"]}/>
                <Bar dataKey="valor_mensal_r" fill={CRIT} radius={[0,4,4,0]} name="Custo Mensal"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:"#fff",borderRadius:12,padding:20}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{background:"#f3f4f6"}}>
                <th style={{padding:"8px 10px",textAlign:"left",color:BRAND}}>Categoria</th>
                <th style={{padding:"8px 10px",textAlign:"right",color:BRAND}}>Processos</th>
                <th style={{padding:"8px 10px",textAlign:"right",color:BRAND}}>Custo/mês</th>
                <th style={{padding:"8px 10px",textAlign:"center",color:BRAND}}>Complex.</th>
                <th style={{padding:"8px 10px",textAlign:"left",color:BRAND}}>Principais</th>
              </tr></thead>
              <tbody>{c.map((r:any,idx:number)=>(
                <tr key={idx} style={{borderBottom:"1px solid #f3f4f6"}}>
                  <td style={{padding:"8px 10px",fontWeight:600}}>{r.categoria}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontWeight:700,color:sc(r.status)}}>{r.processos}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontWeight:700,color:r.valor_mensal_r>10000?CRIT:WARN}}>R$ {r.valor_mensal_r.toLocaleString()}</td>
                  <td style={{padding:"8px 10px",textAlign:"center",fontSize:11,color:r.complexidade==="alta"?CRIT:WARN}}>{r.complexidade}</td>
                  <td style={{padding:"8px 10px",fontSize:11,color:"#6b7280"}}>{r.principais}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {aba==="Medicamentos"&&m&&Array.isArray(m)&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {m.map((med2:any,idx:number)=>(
            <div key={idx} style={{background:"#fff",borderRadius:10,padding:14,borderLeft:`4px solid ${med2.lista_sus==="Não"?CRIT:WARN}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <div>
                  <div style={{fontWeight:700,fontSize:14,color:BRAND}}>{med2.medicamento}</div>
                  <div style={{fontSize:11,color:"#6b7280"}}>{med2.indicacao}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                  <span style={{background:med2.lista_sus==="Não"?"#fee2e2":"#fef3c7",color:med2.lista_sus==="Não"?CRIT:WARN,fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:10}}>
                    {med2.lista_sus==="Não"?"Fora do SUS":"No SUS"}
                  </span>
                  <span style={{fontWeight:700,color:CRIT,fontSize:14}}>R$ {med2.custo_mensal_r.toLocaleString()}/mês</span>
                  <span style={{fontSize:11,color:"#6b7280"}}>{med2.processos} processo(s)</span>
                </div>
              </div>
              <div style={{fontSize:11,background:"#f0fdf4",color:"#166534",padding:"4px 10px",borderRadius:8,display:"inline-block"}}>
                <b>Alternativa SUS:</b> {med2.alternativa_sus}
              </div>
            </div>
          ))}
        </div>
      )}

      {aba==="Histórico"&&h&&Array.isArray(h)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Evolução da Judicialização — 2022–2025</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={h} margin={{top:10,right:20,left:20,bottom:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="ano" tick={{fontSize:11}}/>
              <YAxis yAxisId="left" tick={{fontSize:11}}/>
              <YAxis yAxisId="right" orientation="right" domain={[60,90]} tick={{fontSize:11}}/>
              <Tooltip/>
              <Legend/>
              <Line yAxisId="left"  type="monotone" dataKey="processos_novos"        stroke={CRIT}  strokeWidth={2} name="Proc. Novos"    dot/>
              <Line yAxisId="left"  type="monotone" dataKey="gasto_r" stroke={WARN}  strokeWidth={2} name="Gasto R$"        dot/>
              <Line yAxisId="right" type="monotone" dataKey="cumprimento_pct"        stroke={ACCENT}strokeWidth={2} name="Cumprimento %"  dot strokeDasharray="4 2"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {aba==="Indicadores"&&i&&Array.isArray(i)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Indicadores de Judicialização em Saúde</div>
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
