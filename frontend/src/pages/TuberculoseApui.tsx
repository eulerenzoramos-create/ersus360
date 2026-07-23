import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Thermometer, AlertTriangle, TrendingUp, Activity } from "lucide-react";

const BRAND  = "#dbeafe";
const ACCENT = "#1d4ed8";
const OK     = "#16a34a";
const WARN   = "#d97706";
const CRIT   = "#dc2626";

function statusColor(s: string) {
  if (s === "critico") return CRIT;
  if (s === "atencao") return WARN;
  return OK;
}

const KPI = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-bold mt-1" style={{ color: color || BRAND }}>{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </div>
);

const ProgressBar = ({ value, max, color }: { value: number; max: number; color: string }) => (
  <div className="w-full bg-slate-100 rounded-full h-2.5">
    <div className="h-2.5 rounded-full" style={{ width: `${Math.min(value / max * 100, 100)}%`, background: color }} />
  </div>
);

export default function TuberculoseApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["tb-dash"],  queryFn: () => apiGet("/api/tuberculose-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: casos }       = useQuery({ queryKey: ["tb-caso"],  queryFn: () => apiGet("/api/tuberculose-apui/casos"),      enabled: aba === "casos" });
  const { data: acoes }       = useQuery({ queryKey: ["tb-acao"],  queryFn: () => apiGet("/api/tuberculose-apui/acoes"),      enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["tb-hist"],  queryFn: () => apiGet("/api/tuberculose-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["tb-ind"],   queryFn: () => apiGet("/api/tuberculose-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Thermometer size={15}/> },
    { key: "casos",       label: "Casos",      icon: <Activity size={15}/> },
    { key: "acoes",       label: "Ações",      icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Thermometer size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Tuberculose — Apuí/AM</h1>
            <p className="text-sm text-slate-500">DOTS · TB-HIV · GeneXpert · TPT · DR-TB · Populações Vulneráveis · FMS Apuí/AM</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {ABAS.map((a) => (
            <button key={a.key} onClick={() => setAba(a.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={aba === a.key ? { background: BRAND, color: "white" } : { background: "white", color: "#475569", border: "1px solid #e2e8f0" }}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>

        {aba === "dashboard" && dashRaw && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Incidência TB 2025 (meta: 10/100k)"   value={`${dashRaw.incidencia_tb_100k_2025}/100k`}       color={CRIT} sub={`${dashRaw.casos_tb_2025} casos — ${dashRaw.casos_novos_2025} novos`} />
              <KPI label="Taxa de cura (meta: ≥ 85%)"           value={`${dashRaw.taxa_cura_pct}%`}                     color={CRIT} sub={`abandono: ${dashRaw.taxa_abandono_pct}% (meta < 5%)`} />
              <KPI label="TB-HIV coinfecção"                    value={`${dashRaw.tb_hiv_casos} casos`}                 color={CRIT} sub={`${dashRaw.tb_hiv_coinfeccao_pct}% dos TB — mortalidade 3×`} />
              <KPI label="GeneXpert (TRM-TB)"                   value={dashRaw.teste_rapido_molecular_geneXpert_apui ? "Disponível" : "Indisponível"} color={CRIT} sub="diagnóstico em 2h + resistência" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="DOTS supervisionado"                  value={`${dashRaw.dots_supervisionado_pct}%`}           color={CRIT} sub={`meta 100% — ${dashRaw.agente_tb_dedicado} agente TB dedicado`} />
              <KPI label="Óbito por TB 2025"                    value={`${dashRaw.taxa_obito_tb_pct}%`}                 color={CRIT} sub={`meta < 4% — TB resistente: ${dashRaw.tb_dr_resistente_2025} casos`} />
              <KPI label="Contatos investigados (meta: 100%)"   value={`${dashRaw.contatos_investigados_pct}%`}         color={CRIT} sub={`TPT iniciados: ${dashRaw.tpt_iniciados}/${dashRaw.tpt_indicados}`} />
              <KPI label="TB em indígenas + vulneráveis"        value={`${dashRaw.tb_indigenas + dashRaw.tb_privados_liberdade + dashRaw.tb_populacao_rua}`} color={CRIT} sub={`${dashRaw.tb_indigenas} indígenas · ${dashRaw.tb_privados_liberdade} PPL · ${dashRaw.tb_populacao_rua} rua`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Indicadores de Controle da TB — Apuí/AM</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Taxa de cura: ${dashRaw.taxa_cura_pct}% (meta 85%)`,            value: dashRaw.taxa_cura_pct,                max: 85,  color: CRIT },
                    { label: `Contatos investigados: ${dashRaw.contatos_investigados_pct}%`,   value: dashRaw.contatos_investigados_pct,    max: 100, color: CRIT },
                    { label: `TPT iniciados: ${dashRaw.tpt_iniciados_pct}% dos indicados`,     value: dashRaw.tpt_iniciados_pct,            max: 100, color: CRIT },
                    { label: `DOTS supervisionado: ${dashRaw.dots_supervisionado_pct}%`,        value: dashRaw.dots_supervisionado_pct,      max: 100, color: CRIT },
                  ].map((b: any) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                      </div>
                      <ProgressBar value={b.value} max={b.max} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>Incidência 142,4/100k</b> — 14,2× a meta OMS Fim da TB (10/100k). 352 casos em 2025. GeneXpert: R$ 84k → diagnóstico em 2h + detecção de resistência. Abandono 22,4% → DR-TB: custo R$ 280k/caso.</p>
                <p><b>DOTS 28,4% supervisionado</b> (meta 100%). 1 ACS TB-dedicado: R$ 28k/ano → abandono de 22% para 4%. Bolsa Tuberculose R$ 250/mês: -68% de abandono em alcoolistas e vulneráveis.</p>
                <p><b>57,6% dos contatos não investigados</b>. 284 elegíveis para TPT — apenas 84 iniciaram (29,6%). 1 caso de TB ativa evitado por TPT: ROI 170:1. Crianças &lt; 5a em contato: TPT independente do TST.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "casos" && Array.isArray(casos) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={casos as any[]} margin={{ top: 5, right: 20, bottom: 50, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="grupo" tick={{ fontSize: 8 }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="casos_2025" name="Casos 2025" radius={[4,4,0,0]}>
                  {(casos as any[]).map((c: any, i: number) => <Cell key={i} fill={statusColor(c.status)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(casos as any[]).map((c: any) => (
                <div key={c.grupo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(c.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{c.grupo}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: statusColor(c.status) }}>{c.casos_2025} casos</span>
                      <span className="text-slate-400"> · BAAR: {c.baciloscopia_pct}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{c.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "acoes" && Array.isArray(acoes) && (
          <div className="grid gap-3">
            {(acoes as any[]).map((a: any) => (
              <div key={a.acao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: a.implementada ? OK : CRIT }} />
                    <p className="font-semibold text-sm text-slate-700">{a.acao}</p>
                  </div>
                  <div className="text-right text-xs">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${a.implementada ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {a.implementada ? "Implementada" : "Não implementada"}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">R$ {(a.custo||0).toLocaleString()} · {a.prazo_meses}m</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Tuberculose — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="right" dataKey="casos"               name="Casos totais"          stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="cura_pct"            name="Cura (%)"              stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="left"  dataKey="abandono_pct"        name="Abandono (%)"          stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
                <Line yAxisId="left"  dataKey="coinfeccao_hiv_pct"  name="TB-HIV (%)"            stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="contatos_invest_pct" name="Contatos invest. (%)"  stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="6 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {aba === "indicadores" && Array.isArray(indicadores) && (
          <div className="grid gap-3">
            {(indicadores as any[]).map((ind: any) => (
              <div key={ind.indicador} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-4">
                <div className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(ind.status) }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 text-sm">{ind.indicador}</span>
                    <span className="font-bold text-sm" style={{ color: statusColor(ind.status) }}>
                      {`${ind.valor} ${ind.unidade}`}{ind.meta != null ? ` / meta: ${ind.meta}` : ""}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{ind.observacao}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
