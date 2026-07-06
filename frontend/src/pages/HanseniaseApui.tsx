import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Eye, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

const FORMA_COLORS: Record<string, string> = {
  "Multibacilar — Virchowiana (VV)":   CRIT,
  "Multibacilar — Dimorfa (DD/DV/DT)": WARN,
  "Paucibacilar — Tuberculoide (TT)":  ACCENT,
  "Paucibacilar — Indeterminada (I)":  OK,
};

const GRAU_COLORS: Record<string, string> = {
  "Grau 0 — sem incapacidade":       OK,
  "Grau 1 — perda sensibilidade":    WARN,
  "Grau 2 — incapacidade visível":   CRIT,
};

export default function HanseniaseApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["hans-dashboard"],  queryFn: () => apiGet("/api/hanseniase-apui/dashboard"),     enabled: aba === "dashboard" });
  const { data: classif }     = useQuery({ queryKey: ["hans-classif"],    queryFn: () => apiGet("/api/hanseniase-apui/classificacao"), enabled: aba === "classificacao" });
  const { data: incapac }     = useQuery({ queryKey: ["hans-incapac"],    queryFn: () => apiGet("/api/hanseniase-apui/incapacidades"), enabled: aba === "incapacidades" });
  const { data: historico }   = useQuery({ queryKey: ["hans-hist"],       queryFn: () => apiGet("/api/hanseniase-apui/historico"),     enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["hans-ind"],        queryFn: () => apiGet("/api/hanseniase-apui/indicadores"),   enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",      label: "Dashboard",     icon: <Eye size={15}/> },
    { key: "classificacao",  label: "Classificação", icon: <Activity size={15}/> },
    { key: "incapacidades",  label: "Incapacidades", icon: <AlertTriangle size={15}/> },
    { key: "historico",      label: "Histórico",     icon: <TrendingUp size={15}/> },
    { key: "indicadores",    label: "Indicadores",   icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Eye size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Hanseníase — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Hiperendemia · Grau 2 · PQT · Contatos · FMS Apuí/AM</p>
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
              <KPI label="Coef. Detecção"     value={`${dashRaw.coeficiente_deteccao_100k}/100k`} color={CRIT} sub={`meta: ${dashRaw.meta_coef_deteccao_100k}/100k`} />
              <KPI label="Casos Novos/Ano"    value={dashRaw.casos_novos_ano.toString()}           color={CRIT} sub={dashRaw.classificacao_endemicidade} />
              <KPI label="Grau 2 Diagnóstico" value={`${dashRaw.grau2_incapacidade_diagnostico_pct}%`} color={CRIT} sub={`meta: < ${dashRaw.meta_grau2_pct}%`} />
              <KPI label="< 15 Anos"          value={`${dashRaw.casos_menores_15a_ano} casos`}    color={CRIT} sub={`${dashRaw.pct_menores_15a}% do total`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Taxa de Cura"        value={`${dashRaw.cura_pct}%`}               color={WARN} sub={`meta: ${dashRaw.meta_cura_pct}%`} />
              <KPI label="Abandono"            value={`${dashRaw.abandono_pct}%`}           color={CRIT} sub={`meta: < ${dashRaw.meta_abandono_pct}%`} />
              <KPI label="Contatos Examinados" value={`${dashRaw.contatos_examinados_pct}%`} color={CRIT} sub={`meta: ${dashRaw.meta_contatos_pct}%`} />
              <KPI label="Recidivas/Ano"       value={dashRaw.casos_recidiva.toString()}    color={CRIT} sub="risco de resistência PQT" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Indicadores Operacionais</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: "Taxa de cura (meta 75%)",         value: dashRaw.cura_pct,                        meta: dashRaw.meta_cura_pct,      color: WARN, max: 100 },
                    { label: "Grau 2 no diagnóstico (meta <10%)", value: dashRaw.grau2_incapacidade_diagnostico_pct, meta: dashRaw.meta_grau2_pct, color: CRIT, max: 40 },
                    { label: "Contatos examinados (meta 80%)",   value: dashRaw.contatos_examinados_pct,         meta: dashRaw.meta_contatos_pct,  color: CRIT, max: 100 },
                    { label: "Abandono (meta <10%)",             value: dashRaw.abandono_pct,                    meta: dashRaw.meta_abandono_pct,  color: CRIT, max: 30 },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-bold" style={{ color: b.color }}>{b.value}% / meta {b.meta}%</span>
                      </div>
                      <ProgressBar value={b.value} max={b.max} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>Hiperendêmico — 113,3/100k (meta 10/100k)</b>. Apuí está entre os municípios amazônicos de máxima endemicidade. O MS classifica como área de eliminação prioritária desde 2020.</p>
                <p><b>22,4% com Grau 2 no diagnóstico</b> — incapacidade física instalada (paralisia, úlcera, cegueira). Diagnóstico tardio revela que os casos circulam na comunidade por 3-5 anos antes do reconhecimento.</p>
                <p><b>4 casos em &lt; 15a (14,3%)</b> — crianças adoecem por convivência com casos não detectados. É o indicador mais fidedigno de transmissão ativa recente e falha programática.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "classificacao" && Array.isArray(classif) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Casos por Forma Clínica</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={classif as any[]} margin={{ left: 10, right: 30 }}>
                  <XAxis dataKey="forma" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip />
                  <Bar dataKey="casos" name="Casos" radius={[4,4,0,0]}>
                    {(classif as any[]).map((c: any) => <Cell key={c.forma} fill={FORMA_COLORS[c.forma] || BRAND} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(classif as any[]).map((c: any) => (
                <div key={c.forma} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: FORMA_COLORS[c.forma] || BRAND }} />
                      <span className="font-semibold text-sm text-slate-700">{c.forma}</span>
                    </div>
                    <span className="font-bold text-slate-700">{c.casos} casos ({c.pct}%)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-slate-500">Grau 2 ao diagn.</span>
                        <span className="font-bold" style={{ color: c.grau2_pct > 20 ? CRIT : c.grau2_pct > 10 ? WARN : OK }}>{c.grau2_pct}%</span>
                      </div>
                      <ProgressBar value={c.grau2_pct} max={50} color={c.grau2_pct > 20 ? CRIT : c.grau2_pct > 10 ? WARN : OK} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-slate-500">Taxa de cura</span>
                        <span className="font-bold" style={{ color: c.cura_pct >= 75 ? OK : WARN }}>{c.cura_pct}%</span>
                      </div>
                      <ProgressBar value={c.cura_pct} max={100} color={c.cura_pct >= 75 ? OK : WARN} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "incapacidades" && Array.isArray(incapac) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Grau de Incapacidade: Diagnóstico vs Alta</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={incapac as any[]} margin={{ left: 10, right: 30 }}>
                  <XAxis dataKey="grau" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="casos_diagnostico" name="No diagnóstico" radius={[4,4,0,0]}>
                    {(incapac as any[]).map((i: any) => <Cell key={i.grau} fill={GRAU_COLORS[i.grau] || BRAND} />)}
                  </Bar>
                  <Bar dataKey="casos_alta" name="Na alta" fill="#94a3b8" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(incapac as any[]).map((i: any) => (
                <div key={i.grau} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: GRAU_COLORS[i.grau] || BRAND }} />
                    <span className="font-semibold text-sm text-slate-700">{i.grau}</span>
                  </div>
                  <div className="text-xs text-right space-y-0.5">
                    <div>Diagn.: <span className="font-bold">{i.casos_diagnostico}</span> → Alta: <span className="font-bold">{i.casos_alta}</span></div>
                    <div>Melhora: <span className="font-bold" style={{ color: i.melhora_pct >= 80 ? OK : i.melhora_pct >= 60 ? WARN : CRIT }}>{i.melhora_pct}%</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Hanseníase (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="casos_novos"  name="Casos novos"       stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="menores_15a"  name="< 15 anos"         stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="grau2_pct"    name="Grau 2 (%)"        stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="pct" dataKey="cura_pct"     name="Cura (%)"          stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="abandono_pct" name="Abandono (%)"      stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
