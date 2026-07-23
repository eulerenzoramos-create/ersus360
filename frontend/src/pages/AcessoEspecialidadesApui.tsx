import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { apiGet } from "../lib/api"
import { Stethoscope } from "lucide-react"

const BRAND="#dbeafe", ACCENT="#1d4ed8", OK="#16a34a", WARN="#d97706", CRIT="#dc2626"
const ABAS=["Dashboard","Especialidades","TFD","Histórico","Indicadores"]
const statusColor=(s:string)=>s==="ok"||s==="concluido"?OK:s==="atencao"||s==="andamento"?WARN:CRIT
function KPI({label,value,sub,color=BRAND}:{label:string;value:string|number;sub?:string;color?:string}){
  return <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,padding:"14px 18px",minWidth:130}}>
    <div style={{fontSize:11,color:"#6b7280",marginBottom:4}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{sub}</div>}
  </div>
}
export default function AcessoEspecialidadesApui(){
  const [aba,setAba]=useState("Dashboard")
  const dash=useQuery({queryKey:["espec-dash"], queryFn:()=>apiGet("/api/acesso-especialidades-apui/dashboard"),   enabled:aba==="Dashboard"})
  const esp =useQuery({queryKey:["espec-esp"],  queryFn:()=>apiGet("/api/acesso-especialidades-apui/especialidades"),enabled:aba==="Especialidades"})
  const tfd =useQuery({queryKey:["espec-tfd"],  queryFn:()=>apiGet("/api/acesso-especialidades-apui/tfd"),          enabled:aba==="TFD"})
  const hist=useQuery({queryKey:["espec-hist"], queryFn:()=>apiGet("/api/acesso-especialidades-apui/historico"),    enabled:aba==="Histórico"})
  const ind =useQuery({queryKey:["espec-ind"],  queryFn:()=>apiGet("/api/acesso-especialidades-apui/indicadores"),  enabled:aba==="Indicadores"})
  const d=dash.data as any, e=esp.data as any, t=tfd.data as any, h=hist.data as any, i=ind.data as any
  const fmt=(v:number)=>`R$ ${(v/1000).toFixed(1)}k`

  return (
    <div style={{padding:"24px 32px",fontFamily:"Inter,sans-serif",background:"#f8fafc",minHeight:"100vh"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <Stethoscope size={28} color={ACCENT}/>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:BRAND}}>Acesso a Especialidades Médicas</div>
          <div style={{fontSize:12,color:"#6b7280"}}>TFD / Regulação / Fila de Espera — Apuí/AM</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:24}}>
        {ABAS.map(a=><button key={a} onClick={()=>setAba(a)} style={{padding:"6px 18px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:aba===a?ACCENT:"#e5e7eb",color:aba===a?"#fff":"#374151"}}>{a}</button>)}
      </div>

      {aba==="Dashboard"&&d&&(
        <div>
          <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:20}}>
            <KPI label="Aguardando Consulta"      value={d.total_aguardando_consulta} color={CRIT} />
            <KPI label="Aguardando Exame"         value={d.total_aguardando_exame} color={WARN} />
            <KPI label="Espera Média"             value={`${d.tempo_espera_medio_dias}d`} sub={`Meta: ${d.meta_espera_dias}d`} color={CRIT} />
            <KPI label="Especialidades c/ Disponibilidade" value={d.especialidades_disponiveis_municipio} sub="no município" color={WARN} />
            <KPI label="TFD Processos Ativos"    value={d.tfd_processos_ativos} color={ACCENT} />
            <KPI label="Taxa Deferimento TFD"    value={`${d.tfd_processos_deferidos_pct}%`} color={d.tfd_processos_deferidos_pct>=85?OK:WARN} />
          </div>
        </div>
      )}

      {aba==="Especialidades"&&e&&Array.isArray(e)&&(
        <div>
          <div style={{background:"#fff",borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Fila por Especialidade</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={e} layout="vertical" margin={{left:100,right:80,top:10,bottom:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis type="number" tick={{fontSize:11}}/>
                <YAxis dataKey="especialidade" type="category" tick={{fontSize:11}} width={100}/>
                <Tooltip/>
                <Legend/>
                <Bar dataKey="fila" fill={ACCENT} radius={[0,4,4,0]} name="Fila"/>
                <Bar dataKey="espera_media_dias" fill={WARN} radius={[0,4,4,0]} name="Espera (dias)"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:"#fff",borderRadius:12,padding:20}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{background:"#f3f4f6"}}>
                <th style={{padding:"8px 12px",textAlign:"left",color:BRAND}}>Especialidade</th>
                <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>Fila</th>
                <th style={{padding:"8px 12px",textAlign:"right",color:BRAND}}>Espera</th>
                <th style={{padding:"8px 12px",textAlign:"center",color:BRAND}}>No Município</th>
                <th style={{padding:"8px 12px",textAlign:"left",color:BRAND}}>Referência</th>
              </tr></thead>
              <tbody>{e.map((r:any,idx:number)=>(
                <tr key={idx} style={{borderBottom:"1px solid #f3f4f6"}}>
                  <td style={{padding:"8px 12px"}}>{r.especialidade}</td>
                  <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:r.fila>50?CRIT:r.fila>30?WARN:OK}}>{r.fila}</td>
                  <td style={{padding:"8px 12px",textAlign:"right"}}>{r.espera_media_dias}d</td>
                  <td style={{padding:"8px 12px",textAlign:"center",color:r.disponivel_municipio?OK:CRIT}}>{r.disponivel_municipio?"✓ Sim":"✗ Não"}</td>
                  <td style={{padding:"8px 12px",fontSize:11,color:"#6b7280"}}>{r.referencia}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {aba==="TFD"&&t&&Array.isArray(t)&&(
        <div>
          <div style={{background:"#fff",borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>TFD — Tratamento Fora do Domicílio</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={t} margin={{top:10,right:20,left:20,bottom:20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="mes" tick={{fontSize:11}}/>
                <YAxis tick={{fontSize:11}}/>
                <Tooltip/>
                <Legend/>
                <Bar dataKey="solicitacoes" fill="#6b7280" radius={[4,4,0,0]} name="Solicitações"/>
                <Bar dataKey="deferidos"    fill={OK}    radius={[4,4,0,0]} name="Deferidos"/>
                <Bar dataKey="indeferidos"  fill={CRIT}  radius={[4,4,0,0]} name="Indeferidos"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:"#fff",borderRadius:12,padding:20}}>
            <div style={{fontWeight:700,color:BRAND,marginBottom:8}}>Custo Transporte TFD</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={t} margin={{top:10,right:20,left:20,bottom:20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="mes" tick={{fontSize:11}}/>
                <YAxis tickFormatter={v=>fmt(v)} tick={{fontSize:10}}/>
                <Tooltip formatter={(v:number)=>[fmt(v),"Custo Transporte"]}/>
                <Line type="monotone" dataKey="custo_transporte" stroke={ACCENT} strokeWidth={2} dot name="Custo"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {aba==="Histórico"&&h&&Array.isArray(h)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Evolução da Fila 2025</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={h} margin={{top:10,right:20,left:20,bottom:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="mes" tick={{fontSize:11}}/>
              <YAxis tick={{fontSize:11}}/>
              <Tooltip/>
              <Legend/>
              <Line type="monotone" dataKey="fila_consultas" stroke={CRIT}  strokeWidth={2} name="Fila Consultas" dot={false}/>
              <Line type="monotone" dataKey="fila_exames"    stroke={WARN}  strokeWidth={2} name="Fila Exames"    dot={false}/>
              <Line type="monotone" dataKey="tempo_espera"   stroke={ACCENT}strokeWidth={2} name="Espera (dias)"  dot={false} strokeDasharray="4 2"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {aba==="Indicadores"&&i&&Array.isArray(i)&&(
        <div style={{background:"#fff",borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,color:BRAND,marginBottom:12}}>Indicadores de Acesso</div>
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
