import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { apiGet } from "../lib/api"
import { Heart } from "lucide-react"

const BRAND="#dbeafe", ACCENT="#1d4ed8", OK="#16a34a", WARN="#d97706", CRIT="#dc2626"
const ABAS=["Dashboard","Métodos","Gravidez Adolescente","Histórico","Indicadores"]
const sc=(s:string)=>s==="ok"||s==="regular"?OK:s==="atencao"?WARN:CRIT
const COLORS=[ACCENT,"#7c3aed",OK,WARN,"#06b6d4","#f59e0b","#10b981",CRIT]
function KPI({label,value,sub,color=BRAND}:{label:string;value:string|number;sub?:string;color?:string}){
  return <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,padding:"14px 18px",minWidth:130}}>
    <div style={{fontSize:11,color:"#6b7280",marginBottom:4}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{sub}</div>}
  </div>
}
export default function SaudeSexualReprodutoraApui(){
  const [aba,setAba]=useState("Dashboard")
  const dash=useQuery({queryKey:["ssr-dash"], queryFn:()=>apiGet("/api/saude-sexual-reprodutiva-apui/dashboard"),        enabled:aba==="Dashboard"})
  const met =useQuery({queryKey:["ssr-met"],  queryFn:()=>apiGet("/api/saude-sexual-reprodutiva-apui/metodos"),           enabled:aba==="Métodos"})
  const grav=useQuery({queryKey:["ssr-grav"], queryFn:()=>apiGet("/api/saude-sexual-reprodutiva-apui/gravidez-adolescente"),enabled:aba==="Gravidez Adolescente"})
  const hist=useQuery({queryKey:["ssr-hist"], queryFn:()=>apiGet("/api/saude-sexual-reprodutiva-apui/historico"),         enabled:aba==="Histórico"})
  const ind =useQuery({queryKey:["ssr-ind"],  queryFn:()=>apiGet("/api/saude-sexual-reprodutiva-apui/indicadores"),       enabled:aba==="Indicadores"})
  const d=dash.data as any, m=met.data as any, g=grav.data as any, h=hist.data as any, i=ind.data as any
  return(
    <div style={{padding:"24px 32px",fontFamily:"Inter,sans-serif",background:"#f8fafc",minHeight:"100vh"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <Heart size={28} color={ACCENT}/>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:BRAND}}>Saúde Sexual e Reprodutiva</div>
          <div style={{fontSize:12,color:"#6b7280"}}>Planejamento Familiar · IST · Pré-Natal — Apuí/AM</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:24}}>
        {ABAS.map(a=><button key={a} onClick={()=>setAba(a)} style={{padding:"6px 18px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:aba===a?ACCENT:"#e5e7eb",color:aba===a?"#fff":"#374151"}}>{a}</button>)}
      </div>

      {aba==="Dashboard"&&!d&&<NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />}
      {aba==="Dashboard"&&d&&(
        <div>
          <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:20}}>
            <KPI label="Mulheres Idade Fértil"   value={d.mulheres_idade_fertil?.toLocaleString("pt-BR")} />
            <KPI label="Cobertura Contraceptiva" value={`${d.cobertura_metodo_contraceptivo_pct}%`} sub={`Meta: ${d.meta_cobertura_pct}%`} color={WARN} />
            <KPI label="Gestantes Acomp."        value={d.gestantes_acompanhadas} color={ACCENT} />
            <KPI label="Pré-natal Adequado"      value={`${d.prenatal_adequado_pct}%`} sub={`Meta: ${d.meta_prenatal_pct}%`} color={WARN} />
            <KPI label="Testes IST/Mês"          value={d.testes_ist_realizados_mes} color={OK} />
            <KPI label="Gravidez Adolescente"    value={`${d.adolescentes_gravidez_pct}%`} sub={`Meta: ${d.meta_adolescentes_pct}%`} color={CRIT} />
          </div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <div style={{background:"#fff3cd",border:"1px solid #ffd07a",borderRadius:10,padding:"12px 16px",flex:1,fontSize:13,color:"#7c4a00"}}>
              <b>Sífilis:</b> {d.positivos_sifilis_mes} casos este mês
            </div>
            <div style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:10,padding:"12px 16px",flex:1,fontSize:13,color:"#7f1d1d"}}>
              <b>HIV:</b> {d.positivos_hiv_mes} caso este mês
            </div>
          </div>
        </div>
      )}

      {aba==="Métodos"&&m&&Array.isArray(m)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Métodos Contraceptivos — Cobertura</div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={m.filter((r:any)=>r.pct_fertil>0)} dataKey="pct_fertil" nameKey="metodo" cx="50%" cy="50%" outerRadius={110} label={({metodo,pct_fertil})=>`${pct_fertil}%`}>
                {m.map((_:any,i:number)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie>
              <Tooltip formatter={(v:number)=>[`${v}%`,"% mulheres"]}/>
              <Legend/>
            </PieChart>
          </ResponsiveContainer>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,marginTop:16}}>
            <thead><tr style={{background:"#f3f4f6"}}>
              <th style={{padding:"8px 12px",textAlign:"left",color:BRAND}}>Método</th>
              <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>Usuárias</th>
              <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>% Férteis</th>
              <th style={{padding:"8px 12px",textAlign:"center",color:BRAND}}>Disponibilidade</th>
            </tr></thead>
            <tbody>{m.map((r:any,idx:number)=>(
              <tr key={idx} style={{borderBottom:"1px solid #f3f4f6"}}>
                <td style={{padding:"8px 12px"}}>{r.metodo}</td>
                <td style={{padding:"8px 12px",textAlign:"right"}}>{r.usuarios?.toLocaleString("pt-BR")}</td>
                <td style={{padding:"8px 12px",textAlign:"right"}}>{r.pct_fertil}%</td>
                <td style={{padding:"8px 12px",textAlign:"center"}}><span style={{color:sc(r.disponibilidade),fontWeight:600}}>{r.disponibilidade}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {aba==="Gravidez Adolescente"&&g&&Array.isArray(g)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Gravidez na Adolescência — Comparativo 2024 x 2025</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={g} margin={{top:10,right:20,left:20,bottom:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="faixa" tick={{fontSize:12}}/>
              <YAxis tick={{fontSize:11}}/>
              <Tooltip/>
              <Legend/>
              <Bar dataKey="gestantes_2024" fill="#6b7280" radius={[4,4,0,0]} name="2024"/>
              <Bar dataKey="gestantes_2025" fill={ACCENT}  radius={[4,4,0,0]} name="2025"/>
            </BarChart>
          </ResponsiveContainer>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,marginTop:16}}>
            <thead><tr style={{background:"#f3f4f6"}}>
              <th style={{padding:"8px 12px",textAlign:"left",color:BRAND}}>Faixa</th>
              <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>2024</th>
              <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>2025</th>
              <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>Variação</th>
            </tr></thead>
            <tbody>{g.map((r:any,idx:number)=>(
              <tr key={idx} style={{borderBottom:"1px solid #f3f4f6"}}>
                <td style={{padding:"8px 12px"}}>{r.faixa}</td>
                <td style={{padding:"8px 12px",textAlign:"right"}}>{r.gestantes_2024}</td>
                <td style={{padding:"8px 12px",textAlign:"right"}}>{r.gestantes_2025}</td>
                <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:r.variacao_pct<0?OK:CRIT}}>{r.variacao_pct}%</td>
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
              <Line type="monotone" dataKey="testes_ist"       stroke={ACCENT} strokeWidth={2} name="Testes IST"    dot={false}/>
              <Line type="monotone" dataKey="sifilis_pos"      stroke={CRIT}   strokeWidth={2} name="Sífilis +"     dot={false}/>
              <Line type="monotone" dataKey="prenatal_adeq_pct"stroke={OK}     strokeWidth={2} name="Pré-natal Ad.%" dot={false} strokeDasharray="4 2"/>
              <Line type="monotone" dataKey="metodo_pct"       stroke={WARN}   strokeWidth={2} name="Método%"       dot={false} strokeDasharray="4 2"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {aba==="Indicadores"&&i&&Array.isArray(i)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Indicadores de Saúde Sexual e Reprodutiva</div>
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
                <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700}}>{r.valor}</td>
                <td style={{padding:"8px 12px",textAlign:"right",color:"#6b7280"}}>{r.meta}</td>
                <td style={{padding:"8px 12px",textAlign:"center"}}><span style={{color:sc(r.status),fontWeight:700}}>{r.status.toUpperCase()}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
