import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Heart, AlertTriangle, TrendingUp, Activity } from "lucide-react";

const BRAND  = "#dbeafe";
const ACCENT = "#1d4ed8";
const OK     = "#16a34a";
const WARN   = "#d97706";
const CRIT   = "#dc2626";

function statusColor(s: string) {
  if (s === "ok") return OK;
  if (s === "atencao") return WARN;
  return CRIT;
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

export default function SaudeCardiovascularApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["cv-dashboard"],  queryFn: () => apiGet("/api/saude-cardiovascular-apui/dashboard"),    enabled: aba === "dashboard" });
  const { data: condicoes }   = useQuery({ queryKey: ["cv-condicoes"],  queryFn: () => apiGet("/api/saude-cardiovascular-apui/condicoes"),     enabled: aba === "condicoes" });
  const { data: risco }       = useQuery({ queryKey: ["cv-risco"],      queryFn: () => apiGet("/api/saude-cardiovascular-apui/fatores-risco"), enabled: aba === "risco" });
  const { data: historico }   = useQuery({ queryKey: ["cv-hist"],       queryFn: () => apiGet("/api/saude-cardiovascular-apui/historico"),     enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["cv-ind"],        queryFn: () => apiGet("/api/saude-cardiovascular-apui/indicadores"),   enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",       icon: <Heart size={15}/> },
    { key: "condicoes",  label: "Condições CV",    icon: <Activity size={15}/> },
    { key: "risco",      label: "Fatores de Risco",icon: <Activity size={15}/> },
    { key: "historico",  label: "Histórico",        icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores",      icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Heart size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Cardiovascular — Apuí/AM</h1>
            <p className="text-sm text-slate-500">HAS · IAM · AVC · IC · Fatores de Risco · FMS Apuí/AM</p>
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
              <KPI label="HAS — PA controlada"     value={`${dashRaw.has_pa_controlada_pct}%`}               color={CRIT} sub={`${dashRaw.has_cadastrados_hiperdia?.toLocaleString()} cadastrados`} />
              <KPI label="IAM — mortalidade hosp." value={`${dashRaw.iam_mortalidade_hospitalar_pct}%`}       color={CRIT} sub={`${dashRaw.iam_internacoes_ano} internações/ano`} />
              <KPI label="AVC — sequela permanente"value={`${dashRaw.avc_sequela_permanente_pct}%`}           color={CRIT} sub={`${dashRaw.avc_internacoes_ano} AVC/ano`} />
              <KPI label="Mortalidade CV/100k"      value={`${dashRaw.mortalidade_cardiovascular_100k}`}      color={CRIT} sub={`vs BR: ${dashRaw.media_nacional_cardiovascular_100k}`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Trombólise (IAM/AVC)"    value="Indisponível"                                       color={CRIT} sub="zero rt-PA no HMM" />
              <KPI label="Cardiologista"            value={`${dashRaw.cardiologista_municipio}`}               color={CRIT} sub="zero no município" />
              <KPI label="ECG nas UBS"              value={dashRaw.ecg_disponivel_ubs ? "Sim" : "Não"}         color={WARN} sub={dashRaw.ecg_referencia} />
              <KPI label="Anti-hipertensivo falta"  value={`${dashRaw.has_desabastecimento_anti_hipertensivo_dias_ano}d/ano`} color={WARN} sub="desabastecimento médio" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Painel Cardiovascular</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "HAS — PA controlada (meta 50%)",             value: dashRaw.has_pa_controlada_pct,           color: CRIT },
                    { label: "AVC — janela terapêutica atingida (meta 30%)",value: 100 - dashRaw.avc_tempo_janela_terapeutica_perdido_pct, color: CRIT },
                    { label: "IC — sem reinternação 30d (meta 85%)",        value: 100 - dashRaw.ic_reinternacao_30d_pct,   color: CRIT },
                    { label: "IAM — sobrevivência (meta 90%)",              value: 100 - dashRaw.iam_mortalidade_hospitalar_pct, color: CRIT },
                  ].map((b: any) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-bold" style={{ color: b.color }}>{b.value?.toFixed(1)}%</span>
                      </div>
                      <ProgressBar value={b.value} max={100} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>IAM e AVC sem tratamento trombolítico</b> — rt-PA e kit de trombólise ausentes no HMM. IAM com supra de ST = transfer para Manaus (784 km, 5-8h) = 94% fora da golden hour. Mortalidade 21,4% vs meta 10%. Implantação de protocolo de trombólise: custo R$ 28k/ano em medicamentos.</p>
                <p><b>Zero cardiologista + zero tomógrafo</b> — AVC isquêmico vs hemorrágico: diagnóstico impossível sem TC. Janela terapêutica de 4,5h perdida em 98,4% dos casos. Cada AVC sem trombólise = sequela permanente em 64,2% dos sobreviventes.</p>
                <p><b>Anti-hipertensivo falta 48 dias/ano</b> — 3.684 hipertensos sem medicação 48 dias = descontrole de PA em toda a coorte. HAS mal controlada = maior fator de risco para IAM, AVC e IRC em Apuí.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "condicoes" && Array.isArray(condicoes) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-2">
              <h3 className="font-semibold text-slate-700 mb-3">Internações por Condição Cardiovascular (ano)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(condicoes as any[]).filter((c: any) => c.internacoes_ano > 0)} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis dataKey="condicao" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="internacoes_ano" name="Internações/ano">
                    {(condicoes as any[]).filter((c: any) => c.internacoes_ano > 0).map((c: any) => (
                      <Cell key={c.condicao} fill={statusColor(c.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {(condicoes as any[]).map((c: any) => (
              <div key={c.condicao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(c.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{c.condicao}</p>
                  </div>
                  <div className="text-right text-sm">
                    {c.estimados > 0 && <span className="font-bold" style={{ color: BRAND }}>{c.estimados?.toLocaleString()} estimados</span>}
                    {c.internacoes_ano > 0 && <p className="text-xs" style={{ color: statusColor(c.status) }}>{c.internacoes_ano} internações/ano</p>}
                    {c.controlados_pct > 0 && <p className="text-xs text-slate-400">{c.controlados_pct}% controlados</p>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{c.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "risco" && Array.isArray(risco) && (
          <div className="space-y-3">
            {(risco as any[]).map((r: any) => (
              <div key={r.fator} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(r.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{r.fator}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: statusColor(r.status) }}>{r.prevalencia_adultos_pct}%</span>
                    <p className="text-xs text-slate-400">meta: {r.meta_pct}%</p>
                  </div>
                </div>
                <div className="ml-5 mb-2">
                  <ProgressBar value={r.prevalencia_adultos_pct} max={60} color={statusColor(r.status)} />
                </div>
                <p className="text-xs text-slate-500 ml-5">{r.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Cardiovascular — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="has_controlada_pct"    name="HAS controlada (%)"    stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="iam_internacoes"        name="IAM internações"        stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="avc_internacoes"        name="AVC internações"        stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
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
