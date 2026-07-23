// src/pages/PainelGestor.tsx — ERSUS 360 · Home BI de APS
import { useQuery } from "@tanstack/react-query";
import { apiDashboard, apiAlertas, apiIndicadores, apiSistema, apiGet, apiConformidade } from "../lib/api";
import {
  TrendingUp, AlertTriangle, AlertCircle, CheckCircle,
  Activity, DollarSign, Target, Bell, BarChart2, Users, Pill,
  Heart, ShieldCheck, Syringe, Brain, ArrowRight, Star, Map,
  FileText, Wifi,
} from "lucide-react";

const BLUE = "#1565c0";
const fmt = (v: number) =>
  v >= 1_000_000 ? `R$${(v/1_000_000).toFixed(1)}M`
  : v >= 1_000   ? `R$${(v/1_000).toFixed(0)}K`
  : `R$${v.toFixed(0)}`;

const corSem = (v: number, m: number) => {
  const p = m > 0 ? v / m : 0;
  return p >= 0.9 ? "#2e7d32" : p >= 0.6 ? "#f57f17" : "#c62828";
};
const bgSev:  Record<string,string> = { critico:"#ffebee", atencao:"#fff8e1", info:"#e3f2fd" };
const corSev: Record<string,string> = { critico:"#c62828", atencao:"#f57f17", info:BLUE };

// ── Módulos disponíveis ──────────────────────────────────────────────────────
const MODULOS = [
  { label:"Saúde Brasil 360",     desc:"Vínculo, acompanhamento e qualidade das equipes APS",  Icon:Heart,       path:"/sb360/consolidado-territorial",  cor:"#1565c0" },
  { label:"Componente Qualidade", desc:"15 indicadores C/B/M — Portaria 3.493/2024",           Icon:Target,      path:"/previne",                        cor:"#2e7d32" },
  { label:"Painel de Gestão",     desc:"Atendimentos, procedimentos, visitas e vacinas",        Icon:BarChart2,   path:"/gestao",                         cor:"#6a1b9a" },
  { label:"Busca Ativa",          desc:"Identifique gestantes e crianças sem acompanhamento",  Icon:Users,       path:"/busca-ativa/gestante",            cor:"#e65100" },
  { label:"ACS",                  desc:"Cadastros, visitas e calendário dos agentes",           Icon:ShieldCheck, path:"/acs/painel",                      cor:"#00695c" },
  { label:"Assistência Farmac.",  desc:"Dispensação, estoque e controle de medicamentos",       Icon:Pill,        path:"/farmacia",                        cor:"#ad1457" },
  { label:"Vigilância em Saúde",  desc:"Epidemiológica, sanitária e imunização",                Icon:Syringe,     path:"/vigilancia",                      cor:"#37474f" },
  { label:"IA Gestora",           desc:"Assistente inteligente para decisões em saúde",         Icon:Brain,       path:"/ia",                              cor:"#1565c0" },
  { label:"Mapa de Desempenho",   desc:"Ranking municipal AM e nacional",                       Icon:Map,         path:"/mapa-desempenho",                 cor:"#00838f" },
  { label:"Sprint ÓTIMO",         desc:"Monitoramento SIAPS Q2/2026 das equipes ESF",           Icon:TrendingUp,  path:"/sprint-otimo",                    cor:"#7c3aed" },
  { label:"Repasses FNS",         desc:"Controle de repasses e execução financeira",            Icon:DollarSign,  path:"/repasses",                        cor:"#b45309" },
  { label:"Documentos",           desc:"Portarias, ofícios e termos de referência",             Icon:FileText,    path:"/documentos",                      cor:"#475569" },
];

// ── Benefícios ───────────────────────────────────────────────────────────────
const BENEFICIOS = [
  { Icon:BarChart2,   label:"Análise de dados do e-SUS APS",         desc:"Cruza dados de múltiplos sistemas em tempo real" },
  { Icon:Target,      label:"Indicadores de atendimento ao cidadão", desc:"Monitore metas do Novo Financiamento APS e POEPS" },
  { Icon:DollarSign,  label:"Decisões financeiras mais assertivas",  desc:"Controle de repasses FNS, convênios e execução" },
  { Icon:TrendingUp,  label:"Redução de custo e retrabalho",         desc:"Automatize processos manuais e elimine planilhas" },
  { Icon:Activity,    label:"Painéis de indicadores de desempenho",  desc:"Semáforos visuais com alertas em tempo real" },
];

// ── Indicadores fallback ──────────────────────────────────────────────────────
const IND_FALLBACK = [
  { indicador:"Proporção de parto normal",     valor_alcancado:95, meta_prevista:100 },
  { indicador:"Cobertura vacinal BCG",          valor_alcancado:92, meta_prevista:100 },
  { indicador:"Pré-natal 7+ consultas",         valor_alcancado:85, meta_prevista:100 },
  { indicador:"Razão de exames citopatológico", valor_alcancado:80, meta_prevista:100 },
  { indicador:"Cobertura da Estratégia de S.",  valor_alcancado:68, meta_prevista:100 },
  { indicador:"Acompanhamento ICSAP",           valor_alcancado:62, meta_prevista:100 },
  { indicador:"Consultas médicas APS",          valor_alcancado:58, meta_prevista:100 },
  { indicador:"Visitas ACS/mês",                valor_alcancado:74, meta_prevista:100 },
];

export default function PainelGestor() {
  const { data: stats, isLoading } = useQuery({ queryKey:["dashboard"],        queryFn:() => apiDashboard.stats() });
  const { data: alertas = [] }     = useQuery({ queryKey:["alertas"],           queryFn:() => apiAlertas.list() });
  const { data: indicadoresRaw = [] } = useQuery({ queryKey:["indicadores"],   queryFn:() => apiIndicadores.list() });
  const { data: scoreData }        = useQuery({ queryKey:["score-resumo-home"], queryFn:() => apiGet("/api/score/resumo") as Promise<any> });
  const { data: conformidadeData } = useQuery({ queryKey:["conformidade-dash"], queryFn:() => apiConformidade.dashboard() as Promise<any>, staleTime:120_000 });
  const { data: sysInfo }          = useQuery({ queryKey:["sistema-info"],      queryFn:apiSistema.info, staleTime:60_000 });

  const indicadores = (indicadoresRaw as any[]).length > 0 ? (indicadoresRaw as any[]).slice(0, 8) : IND_FALLBACK;
  const alertasAtivos = (alertas as any[]).filter((a:any) => !a.resolvido);

  const scoreTotal = scoreData?.score_total ?? 85;
  const scoreNivel = scoreData?.nivel ?? "Excelente";
  const confPct    = conformidadeData?.pct_conformidade ?? 23.5;
  const confCrit   = conformidadeData?.criticos ?? 2;

  // ── KPI card helper ──────────────────────────────────────────────────────
  const KpiCard = ({ value, sub, sub2, highlight }: { value:string; sub:string; sub2?:string; highlight?:boolean }) => (
    <div style={{
      background: highlight ? "rgba(255,255,255,.18)" : "rgba(255,255,255,.13)",
      border: highlight ? "2px solid rgba(255,255,255,.45)" : "1px solid rgba(255,255,255,.2)",
      borderRadius:10, padding:"14px 18px", textAlign:"center", minWidth:96,
    }}>
      <div style={{ fontSize:24, fontWeight:800, lineHeight:1.1 }}>{value}</div>
      <div style={{ fontSize:11, opacity:.82, marginTop:3 }}>{sub}</div>
      {sub2 && <div style={{ fontSize:10, opacity:.6, marginTop:2 }}>{sub2}</div>}
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0, fontFamily:"system-ui,sans-serif" }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div style={{ background:`linear-gradient(135deg, ${BLUE} 0%, #0d47a1 100%)`, padding:"32px 28px 26px", color:"#fff" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>

          {/* Identidade */}
          <div style={{ maxWidth:560 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
              <span style={{ fontSize:26 }}>⚕</span>
              <div>
                <div style={{ fontSize:22, fontWeight:800, letterSpacing:-0.5 }}>ERSUS 360</div>
                <div style={{ fontSize:12.5, opacity:.85 }}>Plataforma de BI e Gestão para a Atenção Primária à Saúde</div>
              </div>
            </div>
            <p style={{ margin:"10px 0 0", fontSize:13.5, opacity:.88, lineHeight:1.65 }}>
              Transformamos dados do SUS em decisões estratégicas para gestores municipais de saúde.
              Integramos e-SUS APS, FNS, CNES e SISAB em uma única plataforma.
            </p>
            <div style={{ display:"flex", gap:7, marginTop:14, flexWrap:"wrap" }}>
              {[
                sysInfo ? `${sysInfo.municipio}/${sysInfo.uf}` : "Apuí/AM",
                sysInfo ? `IBGE ${sysInfo.ibge}` : "IBGE 1300144",
                sysInfo ? `v${sysInfo.versao} · ${sysInfo.modulos?.length ?? 12} módulos` : "v1.0.0 · 12 módulos",
              ].map(tag => (
                <span key={tag} style={{ background:"rgba(255,255,255,.16)", borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:600 }}>{tag}</span>
              ))}
            </div>
          </div>

          {/* KPIs */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <KpiCard value={isLoading ? "—" : `${stats?.indicadores_atingidos ?? 4}/${stats?.total_indicadores ?? 8}`} sub="Metas atingidas" />
            <KpiCard value={isLoading ? "—" : fmt(stats?.total_repasses ?? 0)} sub="Repasses FNS" />
            <KpiCard value={isLoading ? "—" : `${(stats?.execucao_pas ?? 69).toFixed(0)}%`} sub="Execução PAS" />
            <div style={{
              background: alertasAtivos.length > 0 ? "rgba(198,40,40,.3)" : "rgba(46,125,50,.28)",
              border:`1px solid ${alertasAtivos.length > 0 ? "rgba(198,40,40,.5)" : "rgba(46,125,50,.5)"}`,
              borderRadius:10, padding:"14px 18px", textAlign:"center", minWidth:88,
            }}>
              <div style={{ fontSize:24, fontWeight:800, lineHeight:1.1 }}>{alertasAtivos.length}</div>
              <div style={{ fontSize:11, opacity:.82, marginTop:3 }}>Alertas ativos</div>
            </div>
            <KpiCard value={`${scoreTotal.toFixed?.(0) ?? scoreTotal}`} sub="Score ERSUS 360" sub2={scoreNivel} highlight />
            <KpiCard value={`${confPct}%`} sub="Conformidade Legal" sub2={confCrit > 0 ? `${confCrit} crítica(s)` : "Em dia"} highlight />
          </div>
        </div>
      </div>

      {/* ── Corpo ──────────────────────────────────────────────────────────── */}
      <div style={{ padding:"22px 28px", display:"flex", flexDirection:"column", gap:22, background:"#f5f7fa" }}>

        {/* ── Por que usar ── */}
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:"#424242", marginBottom:10, textTransform:"uppercase", letterSpacing:.8 }}>
            Por que usar o ERSUS 360
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", gap:10 }}>
            {BENEFICIOS.map(b => (
              <div key={b.label} style={{ background:"#fff", border:"1px solid #e4e7ec", borderRadius:10, padding:"13px 15px", display:"flex", gap:11, alignItems:"flex-start" }}>
                <div style={{ background:"#e3f2fd", borderRadius:8, padding:8, flexShrink:0 }}>
                  <b.Icon size={17} color={BLUE}/>
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#1a1a2e" }}>{b.label}</div>
                  <div style={{ fontSize:11, color:"#6b7280", marginTop:2, lineHeight:1.45 }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Módulos ── */}
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:"#424242", marginBottom:10, textTransform:"uppercase", letterSpacing:.8 }}>
            Módulos disponíveis
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))", gap:11 }}>
            {MODULOS.map(m => (
              <a key={m.label} href={m.path} style={{ textDecoration:"none" }}>
                <div style={{
                  background:"#fff", border:"1px solid #e4e7ec", borderRadius:10,
                  padding:"15px", cursor:"pointer",
                  display:"flex", flexDirection:"column", gap:10,
                  boxShadow:"0 1px 3px rgba(0,0,0,.05)",
                  transition:"box-shadow .18s, transform .18s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow="0 6px 18px rgba(0,0,0,.11)"; e.currentTarget.style.transform="translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,.05)"; e.currentTarget.style.transform="translateY(0)"; }}
                >
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ background:m.cor+"18", borderRadius:8, padding:8 }}>
                      <m.Icon size={19} color={m.cor}/>
                    </div>
                    <ArrowRight size={13} color="#c4c9d4"/>
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e" }}>{m.label}</div>
                    <div style={{ fontSize:11, color:"#6b7280", marginTop:3, lineHeight:1.45 }}>{m.desc}</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* ── Semáforo + Alertas ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

          {/* Semáforo de indicadores */}
          <div style={{ background:"#fff", border:"1px solid #e4e7ec", borderRadius:10, padding:"18px 20px" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
              <Activity size={14} color={BLUE}/> Semáforo de indicadores
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
              {indicadores.map((ind:any) => {
                const cor = corSem(ind.valor_alcancado, ind.meta_prevista);
                const pct = Math.min(100, Math.round((ind.valor_alcancado / (ind.meta_prevista || 100)) * 100));
                return (
                  <div key={ind.indicador} style={{ display:"flex", alignItems:"center", gap:9 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:cor, flexShrink:0 }}/>
                    <div style={{ fontSize:12, flex:"0 0 auto", width:170, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:"#374151" }} title={ind.indicador}>
                      {ind.indicador}
                    </div>
                    <div style={{ flex:1, height:6, background:"#f0f2f5", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:cor, borderRadius:3 }}/>
                    </div>
                    <div style={{ fontSize:12, fontWeight:700, color:cor, minWidth:36, textAlign:"right" }}>{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alertas prioritários */}
          <div style={{ background:"#fff", border:"1px solid #e4e7ec", borderRadius:10, padding:"18px 20px" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
              <Bell size={14} color={BLUE}/> Alertas prioritários
              {alertasAtivos.length > 0 && (
                <span style={{ marginLeft:"auto", background:"#c62828", color:"#fff", fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:10 }}>
                  {alertasAtivos.length}
                </span>
              )}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {alertasAtivos.slice(0,6).map((a:any) => (
                <div key={a.id} style={{
                  padding:"10px 12px", borderRadius:8,
                  background:bgSev[a.severidade]??"#f9fafb",
                  border:`1px solid ${(corSev[a.severidade]??"#e0e0e0")+"33"}`,
                  display:"flex", gap:9, alignItems:"flex-start",
                }}>
                  <span style={{ color:corSev[a.severidade], flexShrink:0, marginTop:1 }}>
                    {a.severidade === "critico" ? <AlertTriangle size={13}/> : <AlertCircle size={13}/>}
                  </span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:corSev[a.severidade] }}>{a.titulo}</div>
                    <div style={{ fontSize:11, color:corSev[a.severidade], marginTop:2, opacity:.75 }}>
                      {a.modulo} · {new Date(a.criado_em).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                </div>
              ))}
              {alertasAtivos.length === 0 && (
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 0", fontSize:12.5, color:"#2e7d32", fontWeight:500 }}>
                  <CheckCircle size={15}/> Nenhum alerta ativo. Tudo em ordem!
                </div>
              )}
            </div>

            {/* Mini painel SIAPS ao vivo */}
            <div style={{ marginTop:14, paddingTop:12, borderTop:"1px solid #f0f2f5" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, fontWeight:700, color:"#374151", marginBottom:8 }}>
                <Wifi size={12} color={BLUE}/> SIAPS — ausências Mai/2026
              </div>
              <SiapsMiniBadge />
            </div>
          </div>
        </div>

        {/* ── Rodapé ── */}
        <div style={{ background:"#e8f0fe", border:"1px solid #c7d7fc", borderRadius:10, padding:"13px 18px", display:"flex", alignItems:"center", gap:12 }}>
          <Star size={17} color={BLUE}/>
          <div style={{ fontSize:12, color:"#1565c0", lineHeight:1.55 }}>
            <strong>ERSUS 360 v1.0</strong> — Plataforma desenvolvida pela <strong>ERSUS Tecnologia em Saúde Pública</strong>.
            Dados integrados com e-SUS APS, FNS, CNES e SISAB para o município de <strong>Apuí/AM</strong>.
            Competência ativa: <strong>Jul/2026</strong>.
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Mini badge de ausências SIAPS ─────────────────────────────────────────────
function SiapsMiniBadge() {
  const base = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8000";
  const { data, isLoading, isError } = useQuery({
    queryKey: ["siaps-ausencias-home"],
    queryFn: () => fetch(`${base}/api/aps/siaps-ausencias?comp=202605&ibge6=130014`).then(r => r.json()),
    staleTime: 300_000,
  });

  if (isLoading) return <div style={{ fontSize:11, color:"#9ca3af" }}>⏳ Consultando e-Gestor…</div>;
  if (isError || data?.error) return <div style={{ fontSize:11, color:"#ef4444" }}>⚠ Indisponível</div>;

  const equipes = data?.equipes ?? [];
  const criticos = equipes.filter((e:any) => e.qtCompetenciasConsecutivas?.includes("03") || e.qtCompetenciasConsecutivas?.includes("Superior")).length;
  const total = equipes.length;

  if (total === 0) return (
    <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#2e7d32" }}>
      <CheckCircle size={12}/> Sem ausências em Mai/2026
    </div>
  );

  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ background:"#fef3c7", border:"1px solid #fbbf24", borderRadius:6, padding:"4px 10px", fontSize:11, fontWeight:700, color:"#92400e" }}>
        ⚠ {total} equipe{total > 1 ? "s" : ""} com ausência
      </div>
      {criticos > 0 && (
        <div style={{ background:"#fee2e2", border:"1px solid #fca5a5", borderRadius:6, padding:"4px 10px", fontSize:11, fontWeight:700, color:"#991b1b" }}>
          🚨 {criticos} crítico{criticos > 1 ? "s" : ""}
        </div>
      )}
      <a href="/sprint-otimo" style={{ fontSize:10, color:BLUE, textDecoration:"none", marginLeft:"auto" }}>ver detalhes →</a>
    </div>
  );
}
