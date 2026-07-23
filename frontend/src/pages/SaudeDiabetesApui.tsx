import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Stethoscope, AlertTriangle, TrendingUp, Activity } from "lucide-react";

const BRAND  = "#1e3a5f";
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

export default function SaudeDiabetesApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["dm-dashboard"],   queryFn: () => apiGet("/api/saude-diabetes-apui/dashboard"),    enabled: aba === "dashboard" });
  const { data: complicacoes }= useQuery({ queryKey: ["dm-complic"],     queryFn: () => apiGet("/api/saude-diabetes-apui/complicacoes"),  enabled: aba === "complicacoes" });
  const { data: insumos }     = useQuery({ queryKey: ["dm-insumos"],     queryFn: () => apiGet("/api/saude-diabetes-apui/insumos"),       enabled: aba === "insumos" });
  const { data: historico }   = useQuery({ queryKey: ["dm-hist"],        queryFn: () => apiGet("/api/saude-diabetes-apui/historico"),     enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["dm-ind"],         queryFn: () => apiGet("/api/saude-diabetes-apui/indicadores"),   enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",    icon: <Stethoscope size={15}/> },
    { key: "complicacoes", label: "Complicações", icon: <Activity size={15}/> },
    { key: "insumos",      label: "Insumos",      icon: <Activity size={15}/> },
    { key: "historico",    label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Stethoscope size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Diabetes Mellitus — Apuí/AM</h1>
            <p className="text-sm text-slate-500">DM1 · DM2 · Complicações · Insumos · Pé Diabético · FMS Apuí/AM</p>
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
              <KPI label="DM cadastrados"         value={`${dashRaw.dm_cadastrados_hiperdia.toLocaleString()}`}   color={BRAND} sub={`${dashRaw.dm_casos_estimados.toLocaleString()} estimados`} />
              <KPI label="HbA1c controlada"        value={`${dashRaw.dm_hba1c_controlada_pct}%`}                  color={CRIT}  sub={`meta: ${dashRaw.meta_hba1c_controlada_pct}%`} />
              <KPI label="Amputações/ano"          value={`${dashRaw.dm_amputacao_pé_diabetico_ano}`}             color={CRIT}  sub="meta: 4/ano" />
              <KPI label="Endocrinologista"        value={`${dashRaw.endocrinologista_municipio}`}                 color={CRIT}  sub="zero no município" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Insulina disponível (UBS)" value={`${dashRaw.insulina_disponivel_ubs_pct}%`}             color={CRIT}  sub={`falta ${dashRaw.insulina_desabastecimento_dias_ano}d/ano`} />
              <KPI label="Retinopatia — rastreio" value={`${dashRaw.dm_retinopatia_rastreada_pct}%`}              color={CRIT}  sub="81,6% sem rastreio" />
              <KPI label="Nefropatia — rastreio"   value={`${dashRaw.dm_nefropatia_microalbuminuria_pct}%`}       color={CRIT}  sub="microalbuminúria anual" />
              <KPI label="Nutricionista"            value={`${dashRaw.nutricionista_municipal}`}                   color={CRIT}  sub="zero no município" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Rastreio de Complicações</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "HbA1c controlada (meta 50%)",           value: dashRaw.dm_hba1c_controlada_pct,         color: CRIT },
                    { label: "Rastreio retinopatia (meta 80%)",        value: dashRaw.dm_retinopatia_rastreada_pct,    color: CRIT },
                    { label: "Rastreio neuropatia (meta 80%)",         value: dashRaw.dm_neuropatia_rastreada_pct,     color: CRIT },
                    { label: "Rastreio nefropatia (meta 80%)",         value: dashRaw.dm_nefropatia_microalbuminuria_pct, color: CRIT },
                    { label: "Insulina disponível nas UBS (meta 100%)",value: dashRaw.insulina_disponivel_ubs_pct,     color: WARN },
                  ].map((b: any) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-bold" style={{ color: b.color }}>{b.value}%</span>
                      </div>
                      <ProgressBar value={b.value} max={100} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>12 amputações/ano — 3x a meta</b> — pé diabético é prevenível com rastreio de neuropatia com monofilamento (custo R$ 12/unidade). 77,6% dos DM sem rastreio anual. Custo de 1 amputação + reabilitação: R$ 30.800 vs R$ 480/ano de prevenção. ROI 64:1.</p>
                <p><b>81,6% sem rastreio de retinopatia</b> — cegueira diabética irreversível e prevenível. Retinógrafo portátil com leitura remota: R$ 28k. Zero oftalmologista em Apuí. Cada caso de cegueira: impacto econômico R$ 480k em produtividade perdida.</p>
                <p><b>Insulina em falta 42 dias/ano</b> — DM1 sem insulina desenvolve cetoacidose em 24-48h. Mortalidade por cetoacidose: 14,2% (meta &lt; 5%). Cadeia frio inadequada em 5/8 UBS: insulina disponível mas com eficácia não garantida.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "complicacoes" && Array.isArray(complicacoes) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-2">
              <h3 className="font-semibold text-slate-700 mb-3">Rastreio de Complicações (%)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={complicacoes as any[]} layout="vertical" margin={{ left: 180, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10 }} unit="%" domain={[0, 60]} />
                  <YAxis dataKey="complicacao" type="category" tick={{ fontSize: 9 }} width={180} />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="rastreado_pct" name="Rastreado (%)">
                    {(complicacoes as any[]).map((c: any) => (
                      <Cell key={c.complicacao} fill={statusColor(c.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {(complicacoes as any[]).map((c: any) => (
              <div key={c.complicacao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(c.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{c.complicacao}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: statusColor(c.status) }}>{c.rastreado_pct}% rastreado</span>
                    <p className="text-xs text-slate-400">{c.internacoes_ano} internações/ano</p>
                  </div>
                </div>
                <div className="ml-5 mb-2">
                  <ProgressBar value={c.rastreado_pct} max={100} color={statusColor(c.status)} />
                </div>
                <p className="text-xs text-slate-500 ml-5">{c.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "insumos" && Array.isArray(insumos) && (
          <div className="grid gap-3">
            {(insumos as any[]).map((ins: any) => (
              <div key={ins.insumo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(ins.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{ins.insumo}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: statusColor(ins.status) }}>{ins.disponivel_pct}% disponível</span>
                    <p className="text-xs text-slate-400">falta {ins.desabastecimento_dias_ano} dias/ano</p>
                  </div>
                </div>
                <div className="ml-5 mb-2">
                  <ProgressBar value={ins.disponivel_pct} max={100} color={statusColor(ins.status)} />
                </div>
                <p className="text-xs text-slate-500 ml-5">{ins.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Diabetes — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="hba1c_controlada_pct"    name="HbA1c controlada (%)"    stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="amputacoes"               name="Amputações/ano"           stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="cetoacidose_internacoes"  name="Cetoacidose internações"  stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
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
