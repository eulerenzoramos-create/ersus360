// src/pages/PainelGestor.tsx — ERSUS 360 · Home BI de APS
import { useQuery } from "@tanstack/react-query";
import { apiDashboard, apiAlertas, apiIndicadores, apiBI, apiSistema } from "../lib/api";
import {
  TrendingUp, TrendingDown, AlertTriangle, AlertCircle, CheckCircle,
  Activity, DollarSign, Target, Bell, BarChart2, Users, Pill,
  Heart, ShieldCheck, Syringe, Brain, ArrowRight, Star,
} from "lucide-react";

const BLUE = "#1565c0";

const fmt = (v: number) =>
  v >= 1_000_000 ? `R$${(v / 1_000_000).toFixed(1)}M`
  : v >= 1_000   ? `R$${(v / 1_000).toFixed(0)}K`
  : `R$${v.toFixed(0)}`;

const corSemaforo = (valor: number, meta: number) => {
  const p = meta > 0 ? valor / meta : 0;
  if (p >= 0.9) return "#2e7d32";
  if (p >= 0.6) return "#f57f17";
  return "#c62828";
};

const bgSev: Record<string, string> = { critico:"#ffebee", atencao:"#fff8e1", info:"#e3f2fd" };
const corSev: Record<string, string> = { critico:"#c62828", atencao:"#f57f17", info:BLUE };

// ── Módulos em destaque ─────────────────────────────────────────────────────
const MODULOS = [
  { label:"Saúde Brasil 360",    desc:"Vínculo, acompanhamento e qualidade das equipes APS", Icon:Heart,      path:"/sb360/consolidado-territorial",  cor:"#1565c0" },
  { label:"Previne Brasil",      desc:"7 indicadores oficiais de desempenho da APS",         Icon:Target,     path:"/previne",                         cor:"#2e7d32" },
  { label:"Painel de Gestão",    desc:"Atendimentos, procedimentos, visitas e vacinas",       Icon:BarChart2,  path:"/gestao",                          cor:"#6a1b9a" },
  { label:"Busca Ativa",         desc:"Identifique gestantes e crianças sem acompanhamento", Icon:Users,      path:"/busca-ativa/gestante",             cor:"#e65100" },
  { label:"ACS",                 desc:"Cadastros, visitas e calendário dos agentes",          Icon:ShieldCheck,path:"/acs/painel",                       cor:"#00695c" },
  { label:"Assistência Farmac.", desc:"Dispensação, estoque e controle de medicamentos",      Icon:Pill,       path:"/farmacia",                         cor:"#ad1457" },
  { label:"Vigilância em Saúde", desc:"Epidemiológica, sanitária e imunização",               Icon:Syringe,    path:"/vigilancia",                       cor:"#37474f" },
  { label:"IA Gestora",          desc:"Assistente inteligente para decisões em saúde",        Icon:Brain,      path:"/ia",                               cor:"#1565c0" },
];

// ── Benefícios ──────────────────────────────────────────────────────────────
const BENEFICIOS = [
  { Icon:BarChart2,  label:"Análise de dados do e-SUS APS",           desc:"Cruza dados de múltiplos sistemas em tempo real" },
  { Icon:Target,     label:"Indicadores de atendimento ao cidadão",    desc:"Monitore metas do Previne Brasil e POEPS" },
  { Icon:DollarSign, label:"Decisões financeiras mais assertivas",     desc:"Controle de repasses FNS, convênios e execução" },
  { Icon:TrendingUp, label:"Redução de custo e retrabalho",            desc:"Automatize processos manuais e elimine planilhas" },
  { Icon:Activity,   label:"Painéis de indicadores de desempenho",     desc:"Semáforos visuais com alertas em tempo real" },
];

export default function PainelGestor() {
  const { data: stats, isLoading } = useQuery({ queryKey:["dashboard"], queryFn:() => apiDashboard.stats() });
  const { data: alertas = [] }     = useQuery({ queryKey:["alertas"],   queryFn:() => apiAlertas.list() });
  const { data: indicadores = [] } = useQuery({ queryKey:["indicadores"], queryFn:() => apiIndicadores.list() });
  const { data: scoreData }        = useQuery({ queryKey:["bi-score-home"], queryFn: apiBI.score });
  const { data: sysInfo }          = useQuery({ queryKey:["sistema-info"], queryFn: apiSistema.info, staleTime: 60_000 });

  const semaforo = indicadores.slice(0, 8);
  const alertasAtivos = alertas.filter((a:any) => !a.resolvido);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0 }}>

      {/* ── Hero ── */}
      <div style={{
        background:`linear-gradient(135deg, ${BLUE} 0%, #0d47a1 100%)`,
        padding:"36px 32px 28px", color:"#fff",
      }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <span style={{ fontSize:28 }}>⚕</span>
              <div>
                <div style={{ fontSize:24, fontWeight:800, letterSpacing:-0.5 }}>ERSUS 360</div>
                <div style={{ fontSize:13, opacity:.85 }}>Plataforma de BI e Gestão para a Atenção Primária à Saúde</div>
              </div>
            </div>
            <p style={{ margin:"12px 0 0", fontSize:14, opacity:.9, maxWidth:560, lineHeight:1.6 }}>
              Transformamos dados do SUS em decisões estratégicas para gestores municipais de saúde.
              Integramos e-SUS APS, FNS, CNES e SISAB em uma única plataforma.
            </p>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <div style={{ background:"rgba(255,255,255,.15)", borderRadius:10, padding:"14px 20px", textAlign:"center", minWidth:90 }}>
              <div style={{ fontSize:26, fontWeight:800 }}>{isLoading ? "—" : `${stats?.indicadores_atingidos ?? 0}/${stats?.total_indicadores ?? 0}`}</div>
              <div style={{ fontSize:11, opacity:.8, marginTop:2 }}>Metas atingidas</div>
            </div>
            <div style={{ background:"rgba(255,255,255,.15)", borderRadius:10, padding:"14px 20px", textAlign:"center", minWidth:90 }}>
              <div style={{ fontSize:26, fontWeight:800 }}>{isLoading ? "—" : fmt(stats?.total_repasses ?? 0)}</div>
              <div style={{ fontSize:11, opacity:.8, marginTop:2 }}>Repasses FNS</div>
            </div>
            <div style={{ background:"rgba(255,255,255,.15)", borderRadius:10, padding:"14px 20px", textAlign:"center", minWidth:90 }}>
              <div style={{ fontSize:26, fontWeight:800 }}>{isLoading ? "—" : `${(stats?.execucao_pas ?? 0).toFixed(0)}%`}</div>
              <div style={{ fontSize:11, opacity:.8, marginTop:2 }}>Execução PAS</div>
            </div>
            <div style={{ background: alertasAtivos.length > 0 ? "rgba(198,40,40,.3)" : "rgba(46,125,50,.3)", borderRadius:10, padding:"14px 20px", textAlign:"center", minWidth:90 }}>
              <div style={{ fontSize:26, fontWeight:800 }}>{alertasAtivos.length}</div>
              <div style={{ fontSize:11, opacity:.8, marginTop:2 }}>Alertas ativos</div>
            </div>
            {scoreData && (
              <div style={{ background:"rgba(255,255,255,.18)", border:"2px solid rgba(255,255,255,.4)", borderRadius:10, padding:"14px 20px", textAlign:"center", minWidth:90 }}>
                <div style={{ fontSize:26, fontWeight:800 }}>{scoreData.score_total?.toFixed(0) ?? "—"}</div>
                <div style={{ fontSize:11, opacity:.8, marginTop:2 }}>Score ERSUS 360</div>
                <div style={{ fontSize:10, opacity:.65, marginTop:1 }}>{scoreData.classificacao ?? ""}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:24 }}>

        {/* ── Benefícios ── */}
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:"#424242", marginBottom:12, textTransform:"uppercase", letterSpacing:.5 }}>
            Por que usar o ERSUS 360
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px,1fr))", gap:10 }}>
            {BENEFICIOS.map(b => (
              <div key={b.label} style={{ background:"#fff", border:"1px solid #e0e0e0", borderRadius:10, padding:"14px 16px", display:"flex", gap:12, alignItems:"flex-start" }}>
                <div style={{ background:"#e3f2fd", borderRadius:8, padding:8, flexShrink:0 }}>
                  <b.Icon size={18} color={BLUE}/>
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#212121" }}>{b.label}</div>
                  <div style={{ fontSize:11, color:"#757575", marginTop:2, lineHeight:1.4 }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Módulos ── */}
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:"#424242", marginBottom:12, textTransform:"uppercase", letterSpacing:.5 }}>
            Módulos disponíveis
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px,1fr))", gap:12 }}>
            {MODULOS.map(m => (
              <a key={m.label} href={m.path} style={{ textDecoration:"none" }}>
                <div style={{
                  background:"#fff", border:"1px solid #e0e0e0", borderRadius:10,
                  padding:"16px", cursor:"pointer", transition:"box-shadow .2s",
                  display:"flex", flexDirection:"column", gap:10,
                  boxShadow:"0 1px 4px rgba(0,0,0,.04)",
                }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.12)")}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.04)")}
                >
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ background:m.cor+"18", borderRadius:8, padding:8 }}>
                      <m.Icon size={20} color={m.cor}/>
                    </div>
                    <ArrowRight size={14} color="#bdbdbd"/>
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#212121" }}>{m.label}</div>
                    <div style={{ fontSize:11, color:"#757575", marginTop:3, lineHeight:1.4 }}>{m.desc}</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* ── Semáforo + Alertas ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

          {/* Semáforo */}
          <div style={{ background:"#fff", border:"1px solid #e0e0e0", borderRadius:10, padding:"18px 20px" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#212121", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
              <Activity size={15} color={BLUE}/> Semáforo de indicadores
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {semaforo.map((ind:any) => {
                const cor = corSemaforo(ind.valor_alcancado, ind.meta_prevista);
                const pct = Math.min(100, Math.round((ind.valor_alcancado / (ind.meta_prevista || 1)) * 100));
                return (
                  <div key={ind.id} style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:9, height:9, borderRadius:"50%", background:cor, flexShrink:0 }}/>
                    <div style={{ fontSize:12, flex:"0 0 auto", maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:"#424242" }} title={ind.indicador}>
                      {ind.indicador}
                    </div>
                    <div style={{ flex:1, height:6, background:"#f0f0f0", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:cor, borderRadius:3 }}/>
                    </div>
                    <div style={{ fontSize:12, fontWeight:700, color:cor, minWidth:36, textAlign:"right" }}>
                      {ind.valor_alcancado.toFixed(0)}%
                    </div>
                  </div>
                );
              })}
              {semaforo.length === 0 && (
                <div style={{ fontSize:12, color:"#9e9e9e", textAlign:"center", padding:"10px 0" }}>
                  Nenhum indicador cadastrado.
                </div>
              )}
            </div>
          </div>

          {/* Alertas */}
          <div style={{ background:"#fff", border:"1px solid #e0e0e0", borderRadius:10, padding:"18px 20px" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#212121", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
              <Bell size={15} color={BLUE}/> Alertas prioritários
              {alertasAtivos.length > 0 && (
                <span style={{ marginLeft:"auto", background:"#c62828", color:"#fff", fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:10 }}>
                  {alertasAtivos.length}
                </span>
              )}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {alertasAtivos.slice(0,5).map((a:any) => (
                <div key={a.id} style={{
                  padding:"10px 12px", borderRadius:8,
                  background:bgSev[a.severidade]??"#f5f5f5",
                  border:`1px solid ${corSev[a.severidade]??"#e0e0e0"}22`,
                  display:"flex", gap:10, alignItems:"flex-start",
                }}>
                  <span style={{ color:corSev[a.severidade], flexShrink:0, marginTop:1 }}>
                    {a.severidade === "critico" ? <AlertTriangle size={13}/> : <AlertCircle size={13}/>}
                  </span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:corSev[a.severidade] }}>{a.titulo}</div>
                    <div style={{ fontSize:11, color:corSev[a.severidade], marginTop:2, opacity:.8 }}>
                      {a.modulo} · {new Date(a.criado_em).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                </div>
              ))}
              {alertasAtivos.length === 0 && (
                <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"#2e7d32" }}>
                  <CheckCircle size={14}/> Nenhum alerta ativo. Tudo em ordem!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Rodapé informativo ── */}
        <div style={{ background:"#e3f2fd", borderRadius:10, padding:"14px 20px", display:"flex", alignItems:"center", gap:12 }}>
          <Star size={18} color={BLUE}/>
          <div style={{ fontSize:12, color:"#1565c0", lineHeight:1.5 }}>
            <strong>ERSUS 360 v1.0</strong> — Plataforma desenvolvida pela <strong>ERSUS Tecnologia em Saúde Pública</strong>.
            Dados integrados com e-SUS APS, FNS, CNES e SISAB para o município de <strong>Apuí/AM</strong>.
          </div>
        </div>

      </div>
    </div>
  );
}
