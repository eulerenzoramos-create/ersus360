import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Clock, AlertTriangle, Activity, TrendingUp } from "lucide-react";

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

export default function UrgenciaEmergencia() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["ue-dashboard"],  queryFn: () => apiGet("/api/urgencia-emergencia/dashboard"),          enabled: aba === "dashboard" });
  const { data: classif }     = useQuery({ queryKey: ["ue-classif"],    queryFn: () => apiGet("/api/urgencia-emergencia/classificacao-risco"), enabled: aba === "classificacao" });
  const { data: causas }      = useQuery({ queryKey: ["ue-causas"],     queryFn: () => apiGet("/api/urgencia-emergencia/causas"),             enabled: aba === "causas" });
  const { data: historico }   = useQuery({ queryKey: ["ue-historico"],  queryFn: () => apiGet("/api/urgencia-emergencia/atendimentos"),       enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["ue-ind"],        queryFn: () => apiGet("/api/urgencia-emergencia/indicadores"),        enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",        icon: <Clock size={15}/> },
    { key: "classificacao",label: "Classif. Risco",   icon: <AlertTriangle size={15}/> },
    { key: "causas",       label: "Causas",           icon: <Activity size={15}/> },
    { key: "historico",    label: "Histórico",        icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores",      icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Clock size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Urgência e Emergência — Apuí/AM</h1>
            <p className="text-sm text-slate-500">UPA 24h · SAMU · Protocolo Manchester · FMS Apuí/AM</p>
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
              <KPI label="Atendimentos UPA/mês" value={dashRaw.atendimentos_upa_mes.toLocaleString()} color={ACCENT} sub="UPA 24h ativa" />
              <KPI label="SAMU — Ocorrências/mês" value={dashRaw.atendimentos_samu_mes.toString()} color={BRAND} />
              <KPI label="Tempo Médio Espera" value={`${dashRaw.tempo_medio_espera_upa_min} min`} color={WARN} sub={`meta: ${dashRaw.meta_tempo_espera_min} min`} />
              <KPI label="Transferências Manaus/mês" value={dashRaw.transferencias_manaus_mes.toString()} color={CRIT} sub="UTI / especialidades" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Internações via UPA/mês" value={dashRaw.internacoes_upa_mes.toString()} />
              <KPI label="SAMU — T. Resposta" value={`${dashRaw.samu_tempo_resposta_min} min`} color={WARN} sub={`meta: ${dashRaw.meta_samu_min} min`} />
              <KPI label="Óbitos UPA/mês" value={dashRaw.obitos_upa_mes.toString()} color={CRIT} />
              <KPI label="Classificação Vermelha" value={`${dashRaw.classificacao_vermelha_pct}%`} color={CRIT} sub="emergências imediatas" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Distribuição Manchester</h3>
                <div className="space-y-3">
                  {[
                    { nivel: "Vermelho", pct: dashRaw.classificacao_vermelha_pct, cor: "#dc2626" },
                    { nivel: "Laranja",  pct: dashRaw.classificacao_laranja_pct,  cor: "#f97316" },
                    { nivel: "Amarelo",  pct: dashRaw.classificacao_amarela_pct,  cor: "#d97706" },
                    { nivel: "Verde",    pct: dashRaw.classificacao_verde_pct,    cor: "#16a34a" },
                  ].map((c) => (
                    <div key={c.nivel}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium" style={{ color: c.cor }}>{c.nivel}</span>
                        <span>{c.pct}%</span>
                      </div>
                      <ProgressBar value={c.pct} max={100} color={c.cor} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex flex-col gap-2 justify-center">
                <p><b>UPA 24h:</b> única unidade de urgência no município. Cobre população de 24.892 hab. + zona rural.</p>
                <p><b>SAMU:</b> resposta 18 min em média — zona rural pode ultrapassar 40 min.</p>
                <p><b>Sem UTI:</b> 42 transferências/mês para Manaus (600 km). Casos graves com alta mortalidade em trânsito.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "classificacao" && Array.isArray(classif) && (
          <div className="space-y-4">
            <div className="grid gap-3">
              {(classif as any[]).map((c: any) => (
                <div key={c.nivel} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ background: c.cor }} />
                      <span className="font-semibold text-slate-700">{c.nivel}</span>
                    </div>
                    <span className="text-lg font-bold" style={{ color: c.cor }}>{c.atend_mes.toLocaleString()} atend.</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs">% do total</p>
                      <p className="font-semibold">{c.pct}%</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Tempo meta</p>
                      <p className="font-semibold">{c.tempo_meta_min === 0 ? "Imediato" : `${c.tempo_meta_min} min`}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Tempo real</p>
                      <p className="font-semibold" style={{ color: c.tempo_real_min > c.tempo_meta_min ? CRIT : OK }}>
                        {c.tempo_real_min === 0 ? "Imediato" : `${c.tempo_real_min} min`}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={c.pct} max={100} color={c.cor} />
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-3">Atendimentos por Nível Manchester</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={(classif as any[])} dataKey="atend_mes" nameKey="nivel" cx="50%" cy="50%" outerRadius={80} label={({ nivel, pct }: any) => `${pct}%`}>
                    {(classif as any[]).map((c: any) => <Cell key={c.nivel} fill={c.cor} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `${v} atend.`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {aba === "causas" && Array.isArray(causas) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Principais Causas — Atendimentos UPA</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={(causas as any[])} layout="vertical" margin={{ left: 10, right: 60 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="causa" tick={{ fontSize: 10 }} width={200} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip formatter={(v: any, n: any) => [v, n === "atend" ? "Atendimentos" : "Taxa internação %"]} />
                  <Bar dataKey="atend" name="Atendimentos" fill={ACCENT} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Taxa de Internação por Causa (%)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={(causas as any[])} layout="vertical" margin={{ left: 10, right: 60 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} unit="%" />
                  <YAxis type="category" dataKey="causa" tick={{ fontSize: 10 }} width={200} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="internacao_pct" name="Internação %" radius={[0,3,3,0]}>
                    {(causas as any[]).map((c: any) => <Cell key={c.causa} fill={c.internacao_pct > 15 ? CRIT : c.internacao_pct > 8 ? WARN : OK} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução — Atendimentos UPA e SAMU (Jan–Jun/2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="upa" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="samu" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="upa"  dataKey="upa"           name="Atend. UPA"      stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="samu" dataKey="samu"          name="Ocor. SAMU"      stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="samu" dataKey="internacoes"   name="Internações"     stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="samu" dataKey="transferencias"name="Transferências"  stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
