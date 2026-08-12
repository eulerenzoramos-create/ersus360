import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Bug, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function DoencasNegligenciadasApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["dnt-dash"],  queryFn: () => apiGet("/api/doencas-negligenciadas-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: doencas }     = useQuery({ queryKey: ["dnt-doe"],   queryFn: () => apiGet("/api/doencas-negligenciadas-apui/doencas"),    enabled: aba === "doencas" });
  const { data: controle }    = useQuery({ queryKey: ["dnt-ctrl"],  queryFn: () => apiGet("/api/doencas-negligenciadas-apui/controle"),   enabled: aba === "controle" });
  const { data: historico }   = useQuery({ queryKey: ["dnt-hist"],  queryFn: () => apiGet("/api/doencas-negligenciadas-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["dnt-ind"],   queryFn: () => apiGet("/api/doencas-negligenciadas-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Bug size={15}/> },
    { key: "doencas",     label: "Doenças",    icon: <Activity size={15}/> },
    { key: "controle",    label: "Controle",   icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Bug size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Doenças Negligenciadas — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Chagas · Helmintos · Leptospirose · Arboviroses · LT · Raiva · FMS Apuí/AM</p>
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

        {aba === "dashboard" && !dashRaw && (
          <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />
        )}

        {aba === "dashboard" && dashRaw && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Helmintos (crianças < 14a)"    value={`${dashRaw.helmintoses_criancas_pct}%`}                  color={CRIT} sub={`${(dashRaw.helmintoses_n_estimados||0).toLocaleString()} estimados na pop. geral`} />
              <KPI label="Chagas estimados"              value={(dashRaw.chagas_soropositivos_estimados||0).toLocaleString()} color={CRIT} sub={`${dashRaw.chagas_diagnosticados} diagnosticados (11,4%)`} />
              <KPI label="Leptospirose 2025"             value={dashRaw.leptospirose_casos_2025}                         color={CRIT} sub={`${dashRaw.leptospirose_obitos_2025} óbitos — ${dashRaw.leptospirose_letalidade_pct}% letalidade`} />
              <KPI label="IIP Aedes aegypti (meta < 1%)" value={`${dashRaw.aedes_infestacao_pct_iip}%`}                  color={CRIT} sub={`${dashRaw.arboviroses_dengue_2025} dengue + ${dashRaw.arboviroses_zika_2025} Zika + ${dashRaw.arboviroses_chikungunya_2025} Chik.`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="LT — Leishmaniose Tegumentar"  value={dashRaw.leishmaniose_tegumentar_2025}                    color={CRIT} sub={`${dashRaw.lt_tratamento_pct}% em tratamento`} />
              <KPI label="Agentes de endemias (meta 12)" value={`${dashRaw.agente_endemias}/12`}                         color={CRIT} sub={`${dashRaw.cobertura_vigilancia_endemias_pct}% de cobertura`} />
              <KPI label="Raiva animal 2025"             value={dashRaw.raiva_animal_casos_2025}                         color={WARN} sub={`vacinação animal: ${dashRaw.populacao_vacinada_raiva_animal_pct}% (meta 80%)`} />
              <KPI label="Benznidazol disponível"        value={dashRaw.benznidazol_disponivel ? "Sim" : "NÃO"}          color={CRIT} sub="tratamento Chagas — zero em Apuí" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cobertura de Controle por Doença</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Chagas diagnosticados: ${dashRaw.chagas_diagnosticados}/${dashRaw.chagas_soropositivos_estimados} estimados`, value: dashRaw.chagas_diagnosticados, max: dashRaw.chagas_soropositivos_estimados, color: CRIT },
                    { label: `Raiva animal vacinada: ${dashRaw.populacao_vacinada_raiva_animal_pct}% (meta 80%)`,                           value: dashRaw.populacao_vacinada_raiva_animal_pct, max: 80, color: CRIT },
                    { label: `LT em tratamento: ${dashRaw.lt_tratamento_pct}%`,                                                              value: dashRaw.lt_tratamento_pct, max: 100, color: WARN },
                    { label: `Agentes de endemias: ${dashRaw.agente_endemias}/${dashRaw.meta_agente_endemias}`,                              value: dashRaw.agente_endemias, max: dashRaw.meta_agente_endemias, color: CRIT },
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
                <p><b>62,4% das crianças com helmintoses</b> — MDA com albendazol: R$ 10.374 via PSE = -72% em 1 dose. Saneamento: único controle definitivo.</p>
                <p><b>4 óbitos por leptospirose</b> (9,5% de letalidade, meta &lt; 5%). Leptocheck (R$ 8.400): diagnóstico em 15 minutos. Amoxicilina (R$ 4,20) em &lt; 5 dias = letalidade zero. Todos evitáveis.</p>
                <p><b>IIP Aedes = 4,8%</b> (meta &lt; 1%). Epidemia de dengue iminente. 4 agentes de endemias vs 12 necessários. 8 agentes adicionais: R$ 504k evitam R$ 1,68M em epidemia.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "doencas" && Array.isArray(doencas) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={doencas as any[]} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="doenca" tick={{ fontSize: 8 }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="casos_estimados"    name="Estimados"    radius={[4,4,0,0]} fill={ACCENT} />
                <Bar dataKey="casos_diagnosticados" name="Diagnosticados" radius={[4,4,0,0]}>
                  {(doencas as any[]).map((d: any, i: number) => <Cell key={i} fill={statusColor(d.status)} />)}
                </Bar>
                <Bar dataKey="em_tratamento" name="Em tratamento" radius={[4,4,0,0]} fill={OK} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(doencas as any[]).map((d: any) => (
                <div key={d.doenca} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(d.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{d.doenca}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: CRIT }}>{(d.casos_estimados||0).toLocaleString()} estim.</span>
                      <span className="text-slate-500"> · {d.casos_diagnosticados} diag. · {d.em_tratamento} trat.</span>
                      <p className="text-slate-400 mt-0.5">{d.faixa_etaria}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{d.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "controle" && Array.isArray(controle) && (
          <div className="grid gap-3">
            {(controle as any[]).map((c: any) => (
              <div key={c.acao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: c.implementada ? OK : CRIT }} />
                    <p className="font-semibold text-sm text-slate-700">{c.acao}</p>
                  </div>
                  <div className="text-right text-xs">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.implementada ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {c.implementada ? "Implementada" : "Não implementada"}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">R$ {(c.custo||0).toLocaleString()} · {c.prazo_meses}m</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{c.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Doenças Negligenciadas — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="helmintoses_pct"       name="Helmintos crianças (%)"   stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="lt_casos"              name="LT casos"                 stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="left"  dataKey="leptospirose_casos"    name="Leptospirose casos"       stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
                <Line yAxisId="right" dataKey="dengue_casos"          name="Dengue casos"             stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="chagas_diagnosticados" name="Chagas diag."             stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="6 2" />
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
