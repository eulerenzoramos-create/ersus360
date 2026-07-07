import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Bug, AlertTriangle, TrendingUp, Activity } from "lucide-react";

const BRAND  = "#1e3a5f";
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

export default function DengueArbovirosesApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["arbo-dashboard"],  queryFn: () => apiGet("/api/dengue-arboviroses-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: arboviroses } = useQuery({ queryKey: ["arbo-doencas"],    queryFn: () => apiGet("/api/dengue-arboviroses-apui/arboviroses"),  enabled: aba === "arboviroses" });
  const { data: controle }    = useQuery({ queryKey: ["arbo-controle"],   queryFn: () => apiGet("/api/dengue-arboviroses-apui/controle"),     enabled: aba === "controle" });
  const { data: historico }   = useQuery({ queryKey: ["arbo-hist"],       queryFn: () => apiGet("/api/dengue-arboviroses-apui/historico"),    enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["arbo-ind"],        queryFn: () => apiGet("/api/dengue-arboviroses-apui/indicadores"),  enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",    icon: <Bug size={15}/> },
    { key: "arboviroses", label: "Arboviroses",  icon: <Activity size={15}/> },
    { key: "controle",    label: "Controle",     icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Bug size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Dengue e Arboviroses — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Dengue · Zika · Chikungunya · Febre Amarela · Controle Vetorial · FMS Apuí/AM</p>
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
              <KPI label="Dengue 2025"            value={dashRaw.dengue_casos_2025?.toLocaleString()}    color={CRIT} sub={`${dashRaw.dengue_incidencia_por_100k}/100k (meta ${dashRaw.meta_incidencia_por_100k})`} />
              <KPI label="Dengue grave"           value={dashRaw.dengue_graves_2025}                     color={CRIT} sub={`${dashRaw.dengue_obitos_2025} óbitos`} />
              <KPI label="Índice de Breteau"      value={`${dashRaw.indice_breteau_pct}%`}               color={CRIT} sub={`meta < ${dashRaw.meta_indice_breteau_pct}% (epidemia)`} />
              <KPI label="Zika + Chikungunya"     value={(dashRaw.zika_casos_2025 + dashRaw.chikungunya_casos_2025)?.toLocaleString()} color={CRIT} sub={`${dashRaw.zika_microcefalia_2025} microcefalia(s)`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="ACEs ativos"            value={`${dashRaw.agentes_endemias_ativas}/${dashRaw.meta_agentes_endemias}`} color={CRIT} sub="44,4% dos necessários" />
              <KPI label="Cobertura visita ACE"   value={`${dashRaw.cobertura_visita_domiciliar_pct}%`}  color={CRIT} sub={`meta ${dashRaw.meta_cobertura_visita_pct}%`} />
              <KPI label="Semanas epidêmicas"     value={`${dashRaw.semanas_epidemicas_2025} sem.`}      color={CRIT} sub="situação de epidemia em 2025" />
              <KPI label="Resistência temefós"    value={dashRaw.aedes_resistencia_temefos_confirmada ? "Confirmada" : "Não"} color={CRIT} sub="mudar para Bti (biológico)" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Controle Vetorial — Situação Atual</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `ACEs (${dashRaw.agentes_endemias_ativas}/${dashRaw.meta_agentes_endemias} = 44,4%)`,         value: dashRaw.agentes_endemias_ativas, max: dashRaw.meta_agentes_endemias, color: CRIT },
                    { label: `Cobertura visita domiciliar (${dashRaw.cobertura_visita_domiciliar_pct}% / meta 80%)`,       value: dashRaw.cobertura_visita_domiciliar_pct, max: 100, color: CRIT },
                    { label: `Abastecimento larvicida (${dashRaw.larvicida_abastecimento_regular_pct}%)`,                   value: dashRaw.larvicida_abastecimento_regular_pct, max: 100, color: WARN },
                    { label: `Vacinação febre amarela (72,4% / meta 95%)`,                                                  value: 72.4, max: 100, color: CRIT },
                    { label: `Índice de Breteau (${dashRaw.indice_breteau_pct}% — meta < 1%)`,                              value: 100 - dashRaw.indice_breteau_pct, max: 100, color: CRIT },
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
                <p><b>Incidência 7.456/100k = 24,9× acima da meta</b> — epidemia declarada em 22 semanas de 2025. DENV-3 reintroduzido em 2024 em população sem imunidade = maior risco de dengue grave.</p>
                <p><b>Índice de Breteau 18,4% vs meta &lt; 1%</b> — hiperendemia permanente. 8 ACEs para necessidade de 18 = cobertura insuficiente. 10 ACEs adicionais = R$ 120k/ano vs R$ 840k em atendimento de dengue.</p>
                <p><b>Resistência ao temefós confirmada</b> — continuar usando temefós é ineficaz. Bti (Bacillus thuringiensis israelensis): 100% biológico, sem resistência, R$ 18.000/ano para cobertura completa.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "arboviroses" && Array.isArray(arboviroses) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Casos por Arbovirose — 2025</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(arboviroses as any[]).filter((a: any) => a.casos_2025 > 0)} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="doenca" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="casos_2025" name="Casos 2025" radius={[4,4,0,0]}>
                    {(arboviroses as any[]).filter((a: any) => a.casos_2025 > 0).map((a: any, i: number) => (
                      <Cell key={i} fill={statusColor(a.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(arboviroses as any[]).map((a: any) => (
                <div key={a.doenca} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(a.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{a.doenca}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <span className="font-bold" style={{ color: statusColor(a.status) }}>{a.casos_2025} casos</span>
                      {a.graves > 0 && <span className="ml-1 text-red-700">· {a.graves} graves</span>}
                      {a.obitos > 0 && <span className="ml-1 text-red-900 font-bold">· {a.obitos} óbito(s)</span>}
                    </div>
                  </div>
                  {a.sorotipos_circulantes?.length > 0 && (
                    <p className="text-xs text-blue-600 ml-5 mb-1">{a.sorotipos_circulantes.join(" · ")}</p>
                  )}
                  <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
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
                  <div className="text-right text-xs text-slate-500">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.implementada ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {c.implementada ? "Implementada" : "Não implementada"}
                    </span>
                    {c.atual_pct != null && <p className="text-xs mt-0.5">{c.atual_pct}% / meta {c.meta_pct}%</p>}
                    {c.custo > 0 && <p className="text-xs text-slate-400">R$ {c.custo.toLocaleString()} · {c.prazo_meses}m</p>}
                    {c.custo === 0 && <p className="text-xs text-green-600">custo R$ 0 · {c.prazo_meses}m</p>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{c.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Dengue e Arboviroses — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="dengue_casos"       name="Dengue (casos)"      stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="zika_casos"         name="Zika (casos)"        stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="chik_casos"         name="Chikungunya"         stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="cobertura_ace_pct"  name="Cobertura ACE (%)"   stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
