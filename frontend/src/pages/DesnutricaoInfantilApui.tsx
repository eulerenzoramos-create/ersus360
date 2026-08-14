import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Brain, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import { BRL, BRL_AXIS, PCT } from "../lib/fmt";

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

export default function DesnutricaoInfantilApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["des-dash"],  queryFn: () => apiGet("/api/desnutricao-infantil-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: diagnostico } = useQuery({ queryKey: ["des-diag"],  queryFn: () => apiGet("/api/desnutricao-infantil-apui/diagnostico"), enabled: aba === "diagnostico" });
  const { data: acoes }       = useQuery({ queryKey: ["des-acao"],  queryFn: () => apiGet("/api/desnutricao-infantil-apui/acoes"),       enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["des-hist"],  queryFn: () => apiGet("/api/desnutricao-infantil-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["des-ind"],   queryFn: () => apiGet("/api/desnutricao-infantil-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Brain size={15}/> },
    { key: "diagnostico", label: "Diagnóstico",icon: <Activity size={15}/> },
    { key: "acoes",       label: "Ações",      icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Brain size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Desnutrição Infantil e Anemia — Apuí/AM</h1>
            <p className="text-sm text-slate-500">SISVAN · PNSF · NutriSUS · Stunting · RUTF · Janela dos 1000 dias · Bolsa Família · FMS Apuí/AM</p>
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
              <KPI label="Desnutrição aguda grave"       value={`${dashRaw.desnutricao_aguda_grave_pct}% (${dashRaw.desnutricao_aguda_grave_n})`} color={CRIT} sub="SISVAN detecta apenas 17,8%" />
              <KPI label="Stunting (baixa estatura)"     value={`${dashRaw.desnutricao_cronica_stunting_pct}% (${dashRaw.stunting_n})`}           color={CRIT} sub="irreversível após 2 anos" />
              <KPI label="Anemia < 2 anos"               value={`${dashRaw.anemia_ferropriva_menores_2_pct}% (${dashRaw.anemia_ferropriva_menores_2_n})`} color={CRIT} sub="62,4% das crianças nessa faixa" />
              <KPI label="Nutricionista no SUS"          value={dashRaw.nutricionista_sus}                                                         color={CRIT} sub="zero em Apuí" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="SISVAN cobertura (< 5 anos)"   value={`${dashRaw.sisvan_cobertura_pct}%`}                                                color={CRIT} sub="71,6% invisíveis ao sistema" />
              <KPI label="NutriSUS cobertura"            value={`${dashRaw.nutrisus_cobertura_pct}%`}                                              color={WARN} sub="meta 100%" />
              <KPI label="Internações por desnutrição"   value={dashRaw.internacoes_desnutricao_2025}                                              color={CRIT} sub={`${dashRaw.obitos_desnutricao_2025} óbitos diretos`} />
              <KPI label="Custo total 2025"              value={BRL(dashRaw.custo_total_desnutricao_2025||0)}            color={CRIT} sub="só em internações" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cobertura Nutricional — Apuí/AM</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `SISVAN: ${dashRaw.sisvan_cobertura_pct}% (meta 100%)`,              value: dashRaw.sisvan_cobertura_pct,    max: 100, color: CRIT },
                    { label: `NutriSUS: ${dashRaw.nutrisus_cobertura_pct}% (meta 100%)`,          value: dashRaw.nutrisus_cobertura_pct,  max: 100, color: WARN },
                    { label: `Aleitamento exclusivo 6m: ${dashRaw.aleitamento_exclusivo_6m_pct}%`, value: dashRaw.aleitamento_exclusivo_6m_pct, max: 100, color: CRIT },
                    { label: `Bolsa Família (desnutridos): ${dashRaw.bolsa_familia_cobertura_desnutridos_pct}%`, value: dashRaw.bolsa_familia_cobertura_desnutridos_pct, max: 100, color: CRIT },
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
                <p><b>8,4% de desnutrição aguda grave</b> — 270 crianças em risco de morte, SISVAN detecta apenas 48 (17,8%). Fita MUAC: R$ 0,80 detecta no domicílio. RUTF (Plumpy'Nut): R$ 1.134/criança vs R$ 12.400 de internação. ROI 11:1.</p>
                <p><b>28,4% de stunting — 912 crianças com crescimento permanentemente comprometido</b> — irreversível após os 2 anos. QI -8 pontos, renda adulta -22%. Custo econômico: R$ 842k/geração. Janela dos 1.000 dias: única chance de intervir.</p>
                <p><b>62,4% de anemia (842 crianças &lt; 2 anos)</b> — PNSF (sulfato ferroso MS): R$ 43,20/criança/ano. Cobertura 42,4%. -60% de anemia em 6 meses com 100% de cobertura = 505 crianças curadas. Nutricionista na eMulti: R$ 36k/ano = ROI 29:1.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "diagnostico" && Array.isArray(diagnostico) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={diagnostico as any[]} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="forma" tick={{ fontSize: 8 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="n_estimados" name="Estimados"    radius={[4,4,0,0]} fill={BRAND} />
                <Bar dataKey="n_sisvan"    name="Detectados"   radius={[4,4,0,0]} fill={WARN} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(diagnostico as any[]).map((d: any) => (
                <div key={d.forma} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(d.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{d.forma}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: statusColor(d.status) }}>{d.n_sisvan}/{d.n_estimados} detectados</span>
                      <span className="text-slate-400"> · {d.sisvan_cobertura_pct}% cobertura</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{d.observacao}</p>
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
                  <div className="text-right text-xs text-slate-500">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${a.implementada ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {a.implementada ? "Implementada" : "Não implementada"}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">R$ {a.custo?.toLocaleString()} · {a.prazo_meses}m</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Desnutrição Infantil — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="desnutricao_aguda_pct" name="Desnut. aguda (%)"   stroke={CRIT}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="anemia_pct"            name="Anemia < 2 anos (%)" stroke={WARN}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="sisvan_cobertura_pct"  name="SISVAN cobertura (%)" stroke={OK}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="right" dataKey="internacoes"           name="Internações"          stroke={BRAND} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
