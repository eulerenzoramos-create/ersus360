/**
 * Parâmetros do Ministério da Saúde — Apuí/AM
 * Previne Brasil · PMAQ-AB · SISPACTO · Cobertura Vacinal · Parâmetros CBO
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Target, AlertTriangle, CheckCircle, Activity, Shield,
  Syringe, Users, BookOpen, TrendingUp, Filter, ChevronDown, ChevronRight,
} from "lucide-react";
import { apiGet } from "../lib/api";

const STATUS_STYLE: Record<string, { bg: string; border: string; text: string; label: string }> = {
  normal:  { bg: "#f0fdf4", border: "#16a34a", text: "#166534", label: "✅ ATINGIDA"  },
  atencao: { bg: "#fffbeb", border: "#d97706", text: "#92400e", label: "⚠️ ATENÇÃO"   },
  critico: { bg: "#fef2f2", border: "#dc2626", text: "#b91c1c", label: "🚨 CRÍTICO"   },
};

function Badge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.atencao;
  return (
    <span style={{
      background: s.bg, color: s.text, border: `1px solid ${s.border}44`,
      borderRadius: 5, padding: "2px 9px", fontSize: 10, fontWeight: 800, whiteSpace: "nowrap",
    }}>{s.label}</span>
  );
}

function BarraMeta({ valor, meta, status }: { valor: number; meta: number; status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.atencao;
  const pct = Math.min(valor / meta * 100, 100);
  return (
    <div style={{ position:"relative", height:10, background:"#e5e7eb", borderRadius:6, overflow:"hidden", minWidth:80, flex:1 }}>
      <div style={{ width:`${pct}%`, height:"100%", background:s.border, borderRadius:6, transition:"width 0.4s" }} />
    </div>
  );
}

function KPI({ label, value, sub, color="#3b82f6", icon }: { label:string; value:string|number; sub?:string; color?:string; icon?:React.ReactNode }) {
  return (
    <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderTop:`3px solid ${color}`, borderRadius:10, padding:"14px 18px", minWidth:140 }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"var(--muted)", fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>
        {icon}{label}
      </div>
      <div style={{ fontSize:28, fontWeight:900, color:"var(--fg)", lineHeight:1, fontVariantNumeric:"tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"var(--muted)", marginTop:4 }}>{sub}</div>}
    </div>
  );
}

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const ABAS = [
  { key:"painel",   label:"Painel Gestor",     Icon:Target     },
  { key:"previne",  label:"Previne Brasil",     Icon:Activity   },
  { key:"pmaq",     label:"PMAQ-AB Odonto",     Icon:Shield     },
  { key:"sispacto", label:"SISPACTO 2024",      Icon:TrendingUp },
  { key:"vacinal",  label:"Cobertura Vacinal",  Icon:Syringe    },
  { key:"cbo",      label:"Parâmetros CBO",     Icon:Users      },
];

export default function ParametrosMS() {
  const hoje = new Date();
  const [aba,    setAba]    = useState("painel");
  const [mes,    setMes]    = useState(hoje.getMonth() + 1);
  const [ano,    setAno]    = useState(hoje.getFullYear());
  const [cboDet, setCboDet] = useState<string|null>(null);
  const [indDet, setIndDet] = useState<string|null>(null);
  const anos = [hoje.getFullYear(), hoje.getFullYear() - 1];

  const qs = `mes=${mes}&ano=${ano}`;
  const qPainel  = useQuery({ queryKey:["pm-painel",  mes, ano], queryFn:() => apiGet(`/api/parametros-ms/painel-gestor?${qs}`),  enabled: aba==="painel"   });
  const qPrevine = useQuery({ queryKey:["pm-previne", mes, ano], queryFn:() => apiGet(`/api/parametros-ms/previne-brasil?${qs}`), enabled: aba==="previne"  });
  const qPmaq    = useQuery({ queryKey:["pm-pmaq",    mes, ano], queryFn:() => apiGet(`/api/parametros-ms/pmaq-odonto?${qs}`),    enabled: aba==="pmaq"    });
  const qSisp    = useQuery({ queryKey:["pm-sisp"],              queryFn:() => apiGet(`/api/parametros-ms/sispacto`),             enabled: aba==="sispacto" });
  const qVac     = useQuery({ queryKey:["pm-vac",     mes, ano], queryFn:() => apiGet(`/api/parametros-ms/cobertura-vacinal?${qs}`), enabled: aba==="vacinal" });
  const qCbo     = useQuery({ queryKey:["pm-cbo"],               queryFn:() => apiGet(`/api/parametros-ms/parametros-cbo`),       enabled: aba==="cbo"     });

  // ── PAINEL GESTOR ─────────────────────────────────────────────────────────
  const pData = qPainel.data;
  const abaPainel = !pData
    ? <div style={{ color:"var(--muted)", padding:32, textAlign:"center" }}>Carregando painel do gestor…</div>
    : (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:12, marginBottom:20 }}>
        <KPI label="Previne Brasil"   icon={<Activity size={12}/>}   value={`${pData.resumo.previne_brasil.normal}/${pData.resumo.previne_brasil.total}`}   sub="indicadores atingidos" color="#3b82f6"/>
        <KPI label="PMAQ Odonto"      icon={<Shield size={12}/>}     value={`${pData.resumo.pmaq_odonto.normal}/${pData.resumo.pmaq_odonto.total}`}         sub="indicadores atingidos" color="#8b5cf6"/>
        <KPI label="SISPACTO"         icon={<TrendingUp size={12}/>} value={`${pData.resumo.sispacto.normal}/${pData.resumo.sispacto.total}`}               sub="metas pactuadas ok"    color="#0ea5e9"/>
        <KPI label="Vacinas em Meta"  icon={<Syringe size={12}/>}    value={`${pData.resumo.cobertura_vacinal.adequadas}/${pData.resumo.cobertura_vacinal.total}`} sub="cobertura adequada" color="#10b981"/>
        <KPI label="Alertas Críticos" icon={<AlertTriangle size={12}/>} value={pData.alertas_criticos.length} sub="ação imediata" color="#ef4444"/>
      </div>

      {/* Alertas críticos */}
      {pData.alertas_criticos.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontWeight:800, fontSize:13, color:"#b91c1c", marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
            <AlertTriangle size={15}/> ALERTAS CRÍTICOS — AÇÃO IMEDIATA DO GESTOR
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {pData.alertas_criticos.map((a: any, i: number) => (
              <div key={i} style={{ background:"#fff8f8", border:"1px solid #fca5a5", borderLeft:"4px solid #dc2626", borderRadius:8, padding:"12px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, flexWrap:"wrap" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color:"#dc2626", fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>{a.modulo}</div>
                    <div style={{ fontWeight:700, fontSize:13, color:"#111", marginBottom:4 }}>{a.indicador}</div>
                    <div style={{ fontSize:12, color:"#6b7280" }}>
                      Atual: <strong style={{ color:"#dc2626" }}>{a.valor?.toFixed(1)}%</strong>
                      {" · "}Meta: <strong>{a.meta?.toFixed(1)}%</strong>
                      {" · "}Gap: <strong style={{ color:"#dc2626" }}>-{a.gap?.toFixed(1)}pp</strong>
                    </div>
                    {a.acoes?.length > 0 && (
                      <div style={{ marginTop:8, display:"flex", gap:6, flexWrap:"wrap" }}>
                        {a.acoes.map((ac: string, j: number) => (
                          <span key={j} style={{ background:"#fee2e2", color:"#7f1d1d", borderRadius:4, padding:"2px 8px", fontSize:11 }}>→ {ac}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Badge status="critico"/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Painéis lado a lado */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:10, padding:14 }}>
          <div style={{ fontWeight:800, fontSize:13, marginBottom:10, color:"#3b82f6", display:"flex", gap:6, alignItems:"center" }}>
            <Activity size={14}/> Previne Brasil 2024-2025
          </div>
          {(pData.previne_brasil ?? []).map((ind: any) => (
            <div key={ind.codigo} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid var(--border)", gap:10 }}>
              <div style={{ flex:1, fontSize:12, fontWeight:500 }}>{ind.indicador}</div>
              <span style={{ fontSize:13, fontWeight:900, fontVariantNumeric:"tabular-nums", color:STATUS_STYLE[ind.status]?.border }}>{ind.valor_atual?.toFixed(1)}%</span>
              <Badge status={ind.status}/>
            </div>
          ))}
        </div>
        <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:10, padding:14 }}>
          <div style={{ fontWeight:800, fontSize:13, marginBottom:10, color:"#0ea5e9", display:"flex", gap:6, alignItems:"center" }}>
            <TrendingUp size={14}/> SISPACTO 2024 — Apuí/AM
          </div>
          {(pData.sispacto ?? []).map((m: any, i: number) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid var(--border)", gap:10 }}>
              <div style={{ flex:1, fontSize:12 }}>{m.indicador}</div>
              <span style={{ fontSize:12, fontWeight:700, fontVariantNumeric:"tabular-nums" }}>{m.atual_estimado}<span style={{ fontSize:10, color:"var(--muted)" }}> {m.unidade}</span></span>
              <Badge status={m.status}/>
            </div>
          ))}
        </div>
      </div>

      {/* Nota ribeirinha */}
      <div style={{ marginTop:16, background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:8, padding:"10px 16px", fontSize:12, color:"#7c2d12" }}>
        <strong>📊 Contexto Amazônia — Dados Verificados (Ciência &amp; Saúde Coletiva 2021):</strong> Equipes fluviais/ribeirinhas da Amazônia têm pré-natal ≥6 consultas de apenas <strong>21,8%</strong> (vs 49,1% urbanas) e HbA1c diabetes em <strong>3,5%</strong> (vs 12,8% urbanas). Apuí precisa de estratégia específica para populações ribeirinhas.
      </div>
    </div>
  );

  // ── PREVINE BRASIL ─────────────────────────────────────────────────────────
  const pvData = qPrevine.data;
  const abaPrevine = !pvData
    ? <div style={{ color:"var(--muted)", padding:32, textAlign:"center" }}>Carregando…</div>
    : (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10, marginBottom:18 }}>
        <KPI label="Total"    value={pvData.resumo.total}   sub="indicadores Previne Brasil" color="#3b82f6" icon={<Activity size={12}/>}/>
        <KPI label="Atingidos" value={pvData.resumo.normal}  sub="meta alcançada"             color="#16a34a" icon={<CheckCircle size={12}/>}/>
        <KPI label="Atenção"  value={pvData.resumo.atencao} sub="abaixo da meta"             color="#d97706" icon={<AlertTriangle size={12}/>}/>
        <KPI label="Críticos" value={pvData.resumo.critico} sub="ação imediata"              color="#dc2626" icon={<AlertTriangle size={12}/>}/>
      </div>
      <div style={{ fontSize:11, color:"var(--muted)", marginBottom:14 }}>Referência: {pvData.referencia} · Período: {pvData.periodo}</div>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {pvData.indicadores.map((ind: any) => {
          const exp = indDet === ind.codigo;
          const s = STATUS_STYLE[ind.status] ?? STATUS_STYLE.atencao;
          return (
            <div key={ind.codigo} style={{ background:"var(--card)", border:`1px solid ${s.border}44`, borderLeft:`4px solid ${s.border}`, borderRadius:8, overflow:"hidden" }}>
              <div style={{ padding:"12px 16px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}
                onClick={() => setIndDet(exp ? null : ind.codigo)}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                    <span style={{ background:"#dbeafe", color:"#1e40af", borderRadius:4, padding:"1px 7px", fontSize:10, fontWeight:800 }}>{ind.codigo}</span>
                    <span style={{ fontSize:11, color:"var(--muted)", fontWeight:600, textTransform:"uppercase" }}>{ind.grupo}</span>
                  </div>
                  <div style={{ fontWeight:700, fontSize:14, color:"var(--fg)", marginBottom:6 }}>{ind.indicador}</div>
                  <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
                    <BarraMeta valor={ind.valor_atual} meta={ind.meta_apui} status={ind.status}/>
                    <span style={{ fontSize:14, fontWeight:900, color:s.border, fontVariantNumeric:"tabular-nums", flexShrink:0 }}>{ind.valor_atual?.toFixed(1)}%</span>
                    <span style={{ fontSize:12, color:"var(--muted)", flexShrink:0 }}>Meta Apuí: <strong>{ind.meta_apui}%</strong></span>
                    <span style={{ fontSize:12, color:"var(--muted)", flexShrink:0 }}>Nacional: {ind.meta_nacional}%</span>
                    {ind.gap_meta > 0 && <span style={{ fontSize:12, color:"#dc2626", fontWeight:700, flexShrink:0 }}>Gap: -{ind.gap_meta?.toFixed(1)}pp</span>}
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                  <Badge status={ind.status}/>
                  {exp ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                </div>
              </div>
              {exp && (
                <div style={{ background:"var(--hover)", padding:"12px 16px", borderTop:`1px solid ${s.border}33` }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, fontSize:12, marginBottom:10 }}>
                    <div><span style={{ color:"var(--muted)", fontWeight:600 }}>Numerador: </span>{ind.numerador}</div>
                    <div><span style={{ color:"var(--muted)", fontWeight:600 }}>Denominador: </span>{ind.denominador}</div>
                    <div><span style={{ color:"var(--muted)", fontWeight:600 }}>Fonte: </span>{ind.fonte}</div>
                    <div><span style={{ color:"var(--muted)", fontWeight:600 }}>Periodicidade: </span>{ind.periodicidade}</div>
                  </div>
                  <div style={{ marginBottom:10, fontSize:12, color:"#1e40af", fontStyle:"italic", padding:"8px 10px", background:"#eff6ff", borderRadius:6 }}>
                    📋 {ind.descricao_gestor}
                  </div>
                  {ind.acoes_melhoria?.length > 0 && (
                    <div>
                      <div style={{ fontWeight:700, fontSize:11, color:"var(--muted)", marginBottom:6, textTransform:"uppercase", letterSpacing:0.5 }}>Ações de Melhoria</div>
                      {ind.acoes_melhoria.map((ac: string, i: number) => (
                        <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", fontSize:12, marginBottom:4 }}>
                          <span style={{ color:"#16a34a", fontWeight:700, flexShrink:0 }}>→</span>{ac}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── PMAQ-AB ────────────────────────────────────────────────────────────────
  const pmaqData = qPmaq.data;
  const abaPmaq = !pmaqData
    ? <div style={{ color:"var(--muted)", padding:32, textAlign:"center" }}>Carregando…</div>
    : (
    <div>
      <div style={{ background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:8, padding:"10px 16px", marginBottom:16, fontSize:12, color:"#0c4a6e" }}>
        📋 <strong>{pmaqData.referencia}</strong> · Período: {pmaqData.periodo}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {pmaqData.indicadores.map((ind: any) => {
          const s = STATUS_STYLE[ind.status] ?? STATUS_STYLE.atencao;
          const menorMelhor = ind.sentido === "menor_melhor";
          return (
            <div key={ind.codigo} style={{ background:"var(--card)", border:`1px solid ${s.border}44`, borderLeft:`4px solid ${s.border}`, borderRadius:8, padding:"14px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, flexWrap:"wrap" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4, flexWrap:"wrap" }}>
                    <span style={{ background:"#ede9fe", color:"#6d28d9", borderRadius:4, padding:"1px 7px", fontSize:10, fontWeight:800 }}>{ind.codigo}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:"var(--muted)" }}>{ind.grupo}</span>
                    {menorMelhor && <span style={{ fontSize:10, background:"#fef3c7", color:"#92400e", borderRadius:4, padding:"1px 6px" }}>↓ quanto menor, melhor</span>}
                  </div>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{ind.indicador}</div>
                  <div style={{ fontSize:12, color:"var(--muted)", marginBottom:6 }}>{ind.calculo}</div>
                  <div style={{ display:"flex", gap:14, alignItems:"center", flexWrap:"wrap" }}>
                    <span style={{ fontSize:15, fontWeight:900, color:s.border, fontVariantNumeric:"tabular-nums" }}>{ind.valor_atual?.toFixed(1)}%</span>
                    <span style={{ fontSize:12, color:"var(--muted)" }}>{menorMelhor ? "Máx: " : "Meta: "}<strong>{ind.meta_pct}%</strong></span>
                    <span style={{ fontSize:12, color:"var(--muted)" }}>Fonte: {ind.fonte}</span>
                  </div>
                </div>
                <Badge status={ind.status}/>
              </div>
              <div style={{ marginTop:8, fontSize:12, color:"#374151", fontStyle:"italic" }}>📌 {ind.descricao_gestor}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── SISPACTO ───────────────────────────────────────────────────────────────
  const sispData = qSisp.data;
  const abaSispacto = !sispData
    ? <div style={{ color:"var(--muted)", padding:32, textAlign:"center" }}>Carregando…</div>
    : (
    <div>
      <div style={{ background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:8, padding:"10px 16px", marginBottom:16, fontSize:12, color:"#0c4a6e" }}>
        📋 <strong>{sispData.referencia}</strong> · {sispData.porte}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:10, marginBottom:16 }}>
        <KPI label="Total Metas"  value={sispData.resumo.total}   sub="indicadores SISPACTO" color="#0ea5e9" icon={<Target size={12}/>}/>
        <KPI label="Atingidas"    value={sispData.resumo.normal}  sub="no caminho certo"     color="#16a34a" icon={<CheckCircle size={12}/>}/>
        <KPI label="Críticas"     value={sispData.resumo.critico} sub="ação prioritária"     color="#dc2626" icon={<AlertTriangle size={12}/>}/>
      </div>
      <div style={{ overflowX:"auto", border:"1px solid var(--border)", borderRadius:10 }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ background:"#1e40af" }}>
              {["Indicador SISPACTO","Atual","Meta","Unidade","% Meta","Situação"].map(h => (
                <th key={h} style={{ padding:"9px 12px", textAlign:"left", color:"#fff", fontWeight:700, fontSize:11, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sispData.metas.map((m: any, i: number) => {
              const s = STATUS_STYLE[m.status] ?? STATUS_STYLE.atencao;
              return (
                <tr key={i} style={{ background:i%2===0?"var(--card)":"var(--hover)", borderBottom:"1px solid var(--border)" }}>
                  <td style={{ padding:"9px 12px", fontWeight:600 }}>{m.indicador}</td>
                  <td style={{ padding:"9px 12px", fontWeight:800, color:s.border, fontVariantNumeric:"tabular-nums" }}>{m.atual_estimado}</td>
                  <td style={{ padding:"9px 12px", color:"var(--muted)", fontVariantNumeric:"tabular-nums" }}>{m.meta}</td>
                  <td style={{ padding:"9px 12px", color:"var(--muted)" }}>{m.unidade}{m.sentido==="menor_melhor"?" ↓":""}</td>
                  <td style={{ padding:"9px 12px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ width:55, height:7, background:"#e5e7eb", borderRadius:4, overflow:"hidden" }}>
                        <div style={{ width:`${Math.min(m.pct_meta,100)}%`, height:"100%", background:s.border }}/>
                      </div>
                      <span style={{ fontVariantNumeric:"tabular-nums" }}>{m.pct_meta?.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td style={{ padding:"9px 12px" }}><Badge status={m.status}/></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── COBERTURA VACINAL ──────────────────────────────────────────────────────
  const vacData = qVac.data;
  const abaVacinal = !vacData
    ? <div style={{ color:"var(--muted)", padding:32, textAlign:"center" }}>Carregando…</div>
    : (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:10, marginBottom:16 }}>
        <KPI label="Total Vacinas" value={vacData.resumo.total}    sub="Calendário Nacional 2024" color="#0ea5e9" icon={<Syringe size={12}/>}/>
        <KPI label="Em Meta"       value={vacData.resumo.adequadas} sub="cobertura adequada"      color="#16a34a" icon={<CheckCircle size={12}/>}/>
        <KPI label="Críticas"      value={vacData.resumo.criticas}  sub="cobertura insuficiente"  color="#dc2626" icon={<AlertTriangle size={12}/>}/>
      </div>
      {(() => {
        const grupos: Record<string,any[]> = {};
        vacData.vacinas.forEach((v: any) => { grupos[v.grupo] = grupos[v.grupo] ?? []; grupos[v.grupo].push(v); });
        return Object.entries(grupos).map(([grp, vs]) => (
          <div key={grp} style={{ marginBottom:18 }}>
            <div style={{ fontWeight:800, fontSize:12, color:"#0ea5e9", textTransform:"uppercase", letterSpacing:0.5, marginBottom:8, paddingBottom:4, borderBottom:"2px solid #0ea5e933" }}>{grp}</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))", gap:8 }}>
              {(vs as any[]).map((v: any) => {
                const s = STATUS_STYLE[v.status] ?? STATUS_STYLE.atencao;
                return (
                  <div key={v.vacina} style={{ background:"var(--card)", border:`1px solid ${s.border}44`, borderRadius:8, padding:"10px 14px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:13 }}>{v.vacina}</div>
                        <div style={{ fontSize:11, color:"var(--muted)" }}>{v.faixa}</div>
                      </div>
                      <Badge status={v.status}/>
                    </div>
                    <BarraMeta valor={v.cobertura_atual} meta={v.meta} status={v.status}/>
                    <div style={{ display:"flex", justifyContent:"space-between", marginTop:4, fontSize:11 }}>
                      <span style={{ fontWeight:700, color:s.border }}>{v.cobertura_atual?.toFixed(1)}%</span>
                      <span style={{ color:"var(--muted)" }}>Meta: {v.meta}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ));
      })()}
    </div>
  );

  // ── PARÂMETROS CBO ─────────────────────────────────────────────────────────
  const cboData = qCbo.data;
  const abaCbo = !cboData
    ? <div style={{ color:"var(--muted)", padding:32, textAlign:"center" }}>Carregando…</div>
    : (
    <div>
      <div style={{ background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:8, padding:"10px 16px", marginBottom:16, fontSize:12, color:"#0c4a6e" }}>
        📋 <strong>{cboData.referencia}</strong> · Portaria GM/MS 3.493/2024: parâmetro 2.000 pessoas vinculadas por eSF (municípios ≤ 20.000 hab)
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {cboData.cbos.map((c: any) => {
          const exp = cboDet === c.cbo;
          return (
            <div key={c.cbo} style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:10, overflow:"hidden" }}>
              <div style={{ padding:"12px 16px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}
                onClick={() => setCboDet(exp ? null : c.cbo)}>
                <div>
                  <div style={{ fontWeight:800, fontSize:14, color:"var(--fg)" }}>{c.cbo}</div>
                  <div style={{ fontSize:11, color:"var(--muted)" }}>CH: {c.jornada_horas}h/sem · {c.portaria}</div>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  {Object.entries(c.meta_mensal ?? {}).slice(0,2).map(([k,v]: [string,any]) => (
                    <span key={k} style={{ background:"#dbeafe", color:"#1e40af", borderRadius:6, padding:"3px 10px", fontSize:12, fontWeight:700 }}>
                      {(v as number)?.toLocaleString("pt-BR")}
                    </span>
                  ))}
                  {exp ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                </div>
              </div>
              {exp && (
                <div style={{ background:"var(--hover)", padding:"14px 16px", borderTop:"1px solid var(--border)" }}>
                  <div style={{ fontWeight:700, fontSize:11, color:"var(--muted)", textTransform:"uppercase", letterSpacing:0.5, marginBottom:10 }}>
                    Produção mínima/dia — Portaria MS
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:8, marginBottom:14 }}>
                    {Object.entries(c.producao_dia ?? {}).map(([, pd]: [string, any]) => (
                      <div key={pd.label} style={{ background:"var(--card)", borderRadius:8, padding:"8px 12px", border:"1px solid var(--border)" }}>
                        <div style={{ fontSize:11, color:"var(--muted)", fontWeight:600 }}>{pd.label}</div>
                        <div style={{ display:"flex", gap:8, marginTop:4, alignItems:"center" }}>
                          <span style={{ fontWeight:900, fontSize:18, color:"#3b82f6", fontVariantNumeric:"tabular-nums" }}>{pd.meta}</span>
                          <span style={{ fontSize:11, color:"var(--muted)" }}>/ mín {pd.min}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {c.meta_mensal && (
                    <div style={{ marginBottom:12 }}>
                      <div style={{ fontWeight:700, fontSize:11, color:"var(--muted)", textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>Metas mensais</div>
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                        {Object.entries(c.meta_mensal).map(([k,v]: [string,any]) => (
                          <div key={k} style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:6, padding:"6px 12px", textAlign:"center" }}>
                            <div style={{ fontSize:10, color:"#1e40af", textTransform:"uppercase", fontWeight:600 }}>{k.replace(/_/g," ")}</div>
                            <div style={{ fontWeight:900, fontSize:16, color:"#1e40af", fontVariantNumeric:"tabular-nums" }}>{(v as number)?.toLocaleString("pt-BR")}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {c.observacao && (
                    <div style={{ fontSize:12, color:"#374151", background:"#fffbeb", border:"1px solid #fde68a", borderRadius:6, padding:"8px 12px" }}>
                      ℹ️ {c.observacao}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const abaContent: Record<string, React.ReactNode> = {
    painel:abaPainel, previne:abaPrevine, pmaq:abaPmaq,
    sispacto:abaSispacto, vacinal:abaVacinal, cbo:abaCbo,
  };

  return (
    <div style={{ padding:"20px 24px", fontFamily:"system-ui,sans-serif", maxWidth:1280, margin:"0 auto" }}>
      <style>{`
        :root{--card:#fff;--border:#e5e7eb;--fg:#111827;--muted:#6b7280;--hover:#f9fafb;}
        @media(prefers-color-scheme:dark){:root{--card:#1e2127;--border:#374151;--fg:#f9fafb;--muted:#9ca3af;--hover:#252a33;}}
        :root[data-theme="dark"]{--card:#1e2127;--border:#374151;--fg:#f9fafb;--muted:#9ca3af;--hover:#252a33;}
        :root[data-theme="light"]{--card:#fff;--border:#e5e7eb;--fg:#111827;--muted:#6b7280;--hover:#f9fafb;}
        *{box-sizing:border-box;} select,button{font-family:inherit;}
      `}</style>

      <div style={{ marginBottom:18 }}>
        <h2 style={{ margin:0, fontSize:20, fontWeight:900, display:"flex", alignItems:"center", gap:8, color:"#1e40af" }}>
          <BookOpen size={20}/> Parâmetros do Ministério da Saúde — Apuí/AM
        </h2>
        <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>
          IBGE 1300144 · Porte I · Amazônia Legal · Previne Brasil · PMAQ-AB · SISPACTO 2024 · Calendário Vacinal · Parâmetros CBO por Portaria MS
        </div>
      </div>

      <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:10, padding:"12px 16px", marginBottom:18, display:"flex", gap:12, alignItems:"flex-end", flexWrap:"wrap" }}>
        <Filter size={14} style={{ color:"var(--muted)", marginBottom:6 }}/>
        <div>
          <div style={{ fontSize:11, color:"var(--muted)", fontWeight:600, marginBottom:4 }}>MÊS</div>
          <select value={mes} onChange={e => setMes(Number(e.target.value))} style={{ padding:"6px 10px", borderRadius:6, border:"1px solid var(--border)", background:"var(--card)", color:"var(--fg)", fontSize:13 }}>
            {MESES.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize:11, color:"var(--muted)", fontWeight:600, marginBottom:4 }}>ANO</div>
          <select value={ano} onChange={e => setAno(Number(e.target.value))} style={{ padding:"6px 10px", borderRadius:6, border:"1px solid var(--border)", background:"var(--card)", color:"var(--fg)", fontSize:13 }}>
            {anos.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div style={{ fontSize:12, color:"var(--muted)", marginLeft:"auto" }}>
          Porte I · Pop. ~24.800 hab · 42% zona rural/ribeirinha
        </div>
      </div>

      <div style={{ display:"flex", gap:4, flexWrap:"wrap", borderBottom:"2px solid var(--border)", marginBottom:20 }}>
        {ABAS.map(({ key, label, Icon }) => {
          const active = aba === key;
          return (
            <button key={key} onClick={() => setAba(key)} style={{
              display:"flex", alignItems:"center", gap:5, padding:"9px 15px",
              border:"none", cursor:"pointer", borderRadius:"8px 8px 0 0",
              fontSize:13, fontWeight: active ? 700 : 400,
              background: active ? "#1e40af" : "transparent",
              color: active ? "#fff" : "var(--muted)",
            }}>
              <Icon size={14}/> {label}
            </button>
          );
        })}
      </div>

      {abaContent[aba] ?? null}
    </div>
  );
}
