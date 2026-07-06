import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Baby, AlertTriangle, Activity, TrendingUp } from "lucide-react";

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

export default function SaudeMulherApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["sm2-dashboard"], queryFn: () => apiGet("/api/saude-mulher-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: prenatal }    = useQuery({ queryKey: ["sm2-pre"],       queryFn: () => apiGet("/api/saude-mulher-apui/prenatal"),   enabled: aba === "prenatal" });
  const { data: cancer }      = useQuery({ queryKey: ["sm2-cancer"],    queryFn: () => apiGet("/api/saude-mulher-apui/cancer"),     enabled: aba === "cancer" });
  const { data: historico }   = useQuery({ queryKey: ["sm2-hist"],      queryFn: () => apiGet("/api/saude-mulher-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["sm2-ind"],       queryFn: () => apiGet("/api/saude-mulher-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",     icon: <Baby size={15}/> },
    { key: "prenatal",     label: "Pré-natal",     icon: <Activity size={15}/> },
    { key: "cancer",       label: "Ca. Colo / Mama",icon: <AlertTriangle size={15}/> },
    { key: "historico",    label: "Histórico",     icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores",   icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Baby size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde da Mulher — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Pré-natal · Parto · Sífilis Congênita · Ca. Colo e Mama · FMS Apuí/AM</p>
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
              <KPI label="Gestantes Ativas"       value={dashRaw.gestantes_ativas.toString()} color={BRAND} sub="em acompanhamento" />
              <KPI label="Pré-natal 1º Trimestre" value={`${dashRaw.prenatal_inicio_1tri_pct}%`} color={statusColor(dashRaw.status_prenatal)} sub="meta: 100%" />
              <KPI label="Sífilis Congênita"      value={`${dashRaw.sifilis_congenita_casos_ano} casos`} color={CRIT} sub="meta: ZERO" />
              <KPI label="Mort. Materna"          value={`${dashRaw.mortalidade_materna_100k_NV}/100k NV`} color={statusColor(dashRaw.status_mortalidade)} sub="meta: 30" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Parto Normal"           value={`${dashRaw.partos_normais_pct}%`} color={OK} sub="partos normais" />
              <KPI label="Cesariana"              value={`${dashRaw.partos_cesareos_pct}%`} color={CRIT} sub="meta: ≤ 15%" />
              <KPI label="Citologia Oncótica"     value={`${dashRaw.cobertura_citopato_pct}%`} color={CRIT} sub="meta: 80%" />
              <KPI label="Mamografia (50-69a)"    value={`${dashRaw.mamografia_pct}%`} color={CRIT} sub="meta: 70%" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cobertura — Principais Indicadores</h3>
                <div className="space-y-3">
                  {[
                    { label: "Pré-natal 1º trimestre",   value: dashRaw.prenatal_inicio_1tri_pct,  max: 100, color: WARN },
                    { label: "Sífilis/HIV no pré-natal", value: 64.8,                              max: 95,  color: CRIT },
                    { label: "Citologia oncótica",        value: dashRaw.cobertura_citopato_pct,    max: 80,  color: CRIT },
                    { label: "Mamografia",               value: dashRaw.mamografia_pct,             max: 70,  color: CRIT },
                    { label: "Puerpério (consulta 42d)", value: 56.4,                              max: 100, color: WARN },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-medium" style={{ color: b.color }}>{b.value}%</span>
                      </div>
                      <ProgressBar value={b.value} max={b.max} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>18 casos de sífilis congênita</b> em 2025 — completamente evitável. Sorologia no 1º tri: 64,8% vs meta 95%. Criança nasce com a infecção da mãe não tratada.</p>
                <p><b>2 óbitos maternos</b> (84,2/100k NV vs meta 30) — hemorragia e hipertensão: ambos com protocolo de prevenção disponível no MS.</p>
                <p><b>Mamografia a 284 km</b> (Humaitá) — fila de 8-12 meses para exame. Diagnóstico tardio de câncer de mama resulta em doença avançada.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "prenatal" && Array.isArray(prenatal) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Indicadores de Pré-natal e Puerpério</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={prenatal as any[]} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <YAxis type="category" dataKey="indicador" tick={{ fontSize: 8 }} width={240} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="resultado_pct" name="Resultado (%)" radius={[0,3,3,0]}>
                    {(prenatal as any[]).map((p: any) => <Cell key={p.indicador} fill={statusColor(p.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(prenatal as any[]).map((p: any) => (
                <div key={p.indicador} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-slate-700">{p.indicador}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">meta: {p.meta_pct}%</span>
                      <span className="font-bold" style={{ color: statusColor(p.status) }}>{p.resultado_pct}%</span>
                    </div>
                  </div>
                  <ProgressBar value={p.resultado_pct} max={p.meta_pct} color={statusColor(p.status)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "cancer" && Array.isArray(cancer) && (
          <div className="space-y-4">
            {(cancer as any[]).map((c: any) => (
              <div key={c.exame} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-semibold text-slate-700">{c.exame}</span>
                    <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                      <span>{c.realizados_ano.toLocaleString()} realizados / {c.populacao_alvo.toLocaleString()} alvo</span>
                      <span className="text-amber-600 font-bold">{c.alterados_pct}% alterados</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold" style={{ color: statusColor(c.status) }}>{c.cobertura_pct}%</span>
                    <p className="text-xs text-slate-400">meta: {c.meta_pct}%</p>
                  </div>
                </div>
                <ProgressBar value={c.cobertura_pct} max={c.meta_pct} color={statusColor(c.status)} />
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal — Saúde da Mulher (Jan–Jun/2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="s" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n" dataKey="gestantes"        name="Gestantes ativas"     stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n" dataKey="partos"           name="Partos"               stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n" dataKey="sifilis_gest"     name="Sífilis gestacional"  stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="s" dataKey="prenatal_1tri_pct"name="Pré-natal 1ºtri (%)"  stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
