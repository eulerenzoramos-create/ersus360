import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Radio, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function DengueArbovirosesApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["den-dash"],  queryFn: () => apiGet("/api/dengue-arboviroses-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: vetores }     = useQuery({ queryKey: ["den-vet"],   queryFn: () => apiGet("/api/dengue-arboviroses-apui/vetores"),    enabled: aba === "vetores" });
  const { data: acoes }       = useQuery({ queryKey: ["den-acao"],  queryFn: () => apiGet("/api/dengue-arboviroses-apui/acoes"),      enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["den-hist"],  queryFn: () => apiGet("/api/dengue-arboviroses-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["den-ind"],   queryFn: () => apiGet("/api/dengue-arboviroses-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Radio size={15}/> },
    { key: "vetores",     label: "Arboviroses",icon: <Activity size={15}/> },
    { key: "acoes",       label: "Ações",      icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Radio size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Dengue e Arboviroses — Apuí/AM</h1>
            <p className="text-sm text-slate-500">IIP Aedes · Dengue · Zika · Chikungunya · Controle Vetorial · ACEs · Wolbachia · FMS Apuí/AM</p>
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
              <KPI label="IIP Aedes aegypti (crítico: > 1%)"    value={`${dashRaw.iip_aedes_atual_pct}%`}          color={CRIT} sub={`Breteau: ${dashRaw.ib_breteau_atual} — LIRAA ${dashRaw.cobertura_liraa_pct}% cobertura`} />
              <KPI label="Dengue — incidência 2025"              value={`${dashRaw.dengue_incidencia_100k.toFixed(0)}/100k`} color={CRIT} sub={`${dashRaw.dengue_casos_2025} casos · ${dashRaw.dengue_obitos_2025} óbitos · ${dashRaw.dengue_graves_2025} graves`} />
              <KPI label="Agentes de Endemias (ACEs)"            value={`${dashRaw.agentes_endemias_apui} / ${dashRaw.meta_agentes_endemias}`} color={CRIT} sub="déficit 27 ACEs (1 ACE/750 hab = 33 necessários)" />
              <KPI label="Plano de Contingência"                 value={dashRaw.plano_contingencia_dengue_apui ? "Ativo" : "Inexistente"} color={CRIT} sub="obrigatório PNCD — bloqueia recursos federais" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Zika em gestantes 2025"               value={`${dashRaw.zika_gestante_2025} casos`}      color={CRIT} sub={`${dashRaw.microcefalia_zika_2025} microcefalia/neuro — ${dashRaw.zika_casos_2025} casos totais`} />
              <KPI label="Chikungunya 2025"                     value={`${dashRaw.chikungunya_casos_2025} casos`}  color={CRIT} sub={`${dashRaw.chikungunya_cronica_estimados} crônicos (artralgia > 3m)`} />
              <KPI label="Sala de hidratação nas UBSs"          value={`${dashRaw.sala_hidratacao_dengue_ubs} / 8`} color={CRIT} sub="4 óbitos por dengue grave — hemoconcentração não detectada" />
              <KPI label="Sorotipo dominante"                   value={dashRaw.dengue_sorotipo_dominante}          color={CRIT} sub="hiperendemia: 4 sorotipos circulando = epidemia periódica garantida" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Controle Vetorial — Indicadores Críticos</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `IIP: ${dashRaw.iip_aedes_atual_pct}% (crítico > 1%)`,   value: 100 - dashRaw.iip_aedes_atual_pct * 10, max: 100, color: CRIT },
                    { label: `ACEs: ${dashRaw.agentes_endemias_apui}/${dashRaw.meta_agentes_endemias} necessários`, value: dashRaw.agentes_endemias_apui, max: dashRaw.meta_agentes_endemias, color: CRIT },
                    { label: `LIRAA: ${dashRaw.cobertura_liraa_pct}% dos quarteirões`, value: dashRaw.cobertura_liraa_pct, max: 100, color: CRIT },
                    { label: `Salas hidratação: ${dashRaw.sala_hidratacao_dengue_ubs}/8 UBSs`, value: dashRaw.sala_hidratacao_dengue_ubs, max: 8, color: CRIT },
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
                <p><b>IIP 4,8% = epidemia iminente</b> (nível crítico: 1%). 6 ACEs para 24.700 hab (meta 33). Principais criadouros: tonéis de garimpo (34,8%). Contratação emergencial 12 ACEs: R$ 504k/ano. ROI: 1.842 casos × R$ 840/caso = R$ 1,55M evitados vs R$ 504k de ACEs = ROI 3:1.</p>
                <p><b>4 óbitos por dengue grave em 2025</b> — todos por hemoconcentração não detectada. 2 das 8 UBSs com sala de hidratação. Equipar 6 UBSs restantes: R$ 48.000. Hematócrito &gt; 20% do basal = sinal de alarme = internação imediata. 1 óbito evitado = R$ 280k de UTI.</p>
                <p><b>Wolbachia Fiocruz</b>: parceria disponível para municípios endêmicos do AM. Eficácia: -77% de casos de dengue (NEJM 2021). Custo para o município: R$ 28.000 (logística). Fiocruz produz os mosquitos. Apuí: município pequeno = piloto ideal para zona amazônica.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "vetores" && Array.isArray(vetores) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={(vetores as any[]).filter((v: any) => v.casos_2025 > 0)} margin={{ top: 5, right: 20, bottom: 60, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="arbovirose" tick={{ fontSize: 8 }} angle={-10} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="casos_2025" name="Casos 2025" radius={[4,4,0,0]}>
                  {(vetores as any[]).filter((v: any) => v.casos_2025 > 0).map((_: any, i: number) => <Cell key={i} fill={[CRIT, WARN, ACCENT][i % 3]} />)}
                </Bar>
                <Bar dataKey="obitos_2025" name="Óbitos 2025" radius={[4,4,0,0]} fill={BRAND} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(vetores as any[]).map((v: any) => (
                <div key={v.arbovirose} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(v.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{v.arbovirose}</p>
                    </div>
                    <div className="text-right text-xs">
                      {v.casos_2025 > 0 && <span className="font-bold" style={{ color: statusColor(v.status) }}>{v.casos_2025} casos</span>}
                      {v.obitos_2025 > 0 && <span className="text-red-600 font-bold ml-2">{v.obitos_2025} óbitos</span>}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{v.observacao}</p>
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
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Arboviroses — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="dengue"  name="Dengue casos"      stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="chik"    name="Chikungunya casos" stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="left"  dataKey="zika"    name="Zika casos"        stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
                <Line yAxisId="right" dataKey="iip"     name="IIP (%)"           stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" dataKey="obitos"  name="Óbitos dengue"     stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="6 2" />
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
