import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Network, AlertTriangle, Activity, TrendingUp } from "lucide-react";

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

export default function RegulacaoAcesso() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["ra-dashboard"],  queryFn: () => apiGet("/api/regulacao-acesso/dashboard"),    enabled: aba === "dashboard" });
  const { data: espec }       = useQuery({ queryKey: ["ra-espec"],      queryFn: () => apiGet("/api/regulacao-acesso/especialidades"), enabled: aba === "especialidades" });
  const { data: exames }      = useQuery({ queryKey: ["ra-exames"],     queryFn: () => apiGet("/api/regulacao-acesso/exames-mac"),    enabled: aba === "exames" });
  const { data: historico }   = useQuery({ queryKey: ["ra-historico"],  queryFn: () => apiGet("/api/regulacao-acesso/historico"),     enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["ra-ind"],        queryFn: () => apiGet("/api/regulacao-acesso/indicadores"),   enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",     label: "Dashboard",       icon: <Network size={15}/> },
    { key: "especialidades",label: "Especialidades",  icon: <Activity size={15}/> },
    { key: "exames",        label: "Exames MAC",      icon: <Activity size={15}/> },
    { key: "historico",     label: "Histórico",       icon: <TrendingUp size={15}/> },
    { key: "indicadores",   label: "Indicadores",     icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Network size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Regulação e Acesso — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Fila de Espera · Especialidades · Exames MAC · SISREG · FMS Apuí/AM</p>
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
              <KPI label="Fila Total Ativa"         value={dashRaw.fila_total_ativa.toLocaleString()} color={CRIT} sub="pacientes aguardando" />
              <KPI label="Tempo Médio Espera"       value={`${dashRaw.tempo_medio_espera_dias} dias`} color={CRIT} sub={`meta: ${dashRaw.meta_tempo_espera_dias} dias`} />
              <KPI label=">180 dias em fila"        value={dashRaw.pendentes_mais_180dias.toString()} color={CRIT} />
              <KPI label="Ref. a Manaus/mês"        value={dashRaw.referencias_manaus_mes.toString()}  color={WARN} sub="600 km" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Fila Consultas Espec."   value={dashRaw.fila_consultas_espec.toString()} />
              <KPI label="Fila Exames MAC"         value={dashRaw.fila_exames_mac.toString()} />
              <KPI label="Taxa Regulação"          value={`${dashRaw.reguladas_pct}%`} color={WARN} sub={`meta: 95%`} />
              <KPI label="Contrarreferência"       value={`${dashRaw.contrarreferencias_retorno_pct}%`} color={CRIT} sub="retornam à APS" />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900">
              <b>Acesso especializado crítico.</b> Fila de 1.284 pacientes com 148 dias de espera médios — 2,5× a meta. Neurologia e ortopedia com espera superior a 300 dias. 184 pacientes há mais de 6 meses aguardando. Ausência de especialistas fixos em Apuí força dependência total de referências para Manaus.
            </div>
          </div>
        )}

        {aba === "especialidades" && Array.isArray(espec) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Fila por Especialidade (pacientes)</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={(espec as any[])} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="especialidade" tick={{ fontSize: 10 }} width={180} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip formatter={(v: any) => `${v} pacientes`} />
                  <Bar dataKey="fila" name="Fila" radius={[0,3,3,0]}>
                    {(espec as any[]).map((e: any) => <Cell key={e.especialidade} fill={statusColor(e.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(espec as any[]).map((e: any) => (
                <div key={e.especialidade} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-semibold text-sm text-slate-700">{e.especialidade}</span>
                      <span className="ml-2 text-xs text-slate-400">{e.oferta}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{ background: statusColor(e.status) + "22", color: statusColor(e.status) }}>
                      {e.espera_media_dias}d espera
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-slate-500 mb-2">
                    <span>Fila: <b>{e.fila}</b></span>
                    <span>Cotas/mês: <b>{e.cotas_mes}</b></span>
                  </div>
                  <ProgressBar value={e.fila} max={160} color={statusColor(e.status)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "exames" && Array.isArray(exames) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Fila Exames de Alta Complexidade (MAC)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={(exames as any[])} layout="vertical" margin={{ left: 10, right: 60 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="exame" tick={{ fontSize: 10 }} width={220} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip formatter={(v: any) => `${v} pacientes`} />
                  <Bar dataKey="fila" name="Fila" radius={[0,3,3,0]}>
                    {(exames as any[]).map((e: any) => <Cell key={e.exame} fill={statusColor(e.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(exames as any[]).map((e: any) => (
                <div key={e.exame} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm text-slate-700">{e.exame}</span>
                    <div className="flex gap-4 text-xs text-slate-400 mt-0.5">
                      <span>Fila: {e.fila}</span>
                      <span>Cotas/mês: {e.cotas_mes}</span>
                    </div>
                  </div>
                  <span className="font-bold text-sm" style={{ color: statusColor(e.status) }}>{e.espera_dias}d</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução da Fila e Regulação (Jan–Jun/2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="fila" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="fila" dataKey="fila_total"        name="Fila total"          stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="fila" dataKey="solicitacoes"      name="Solicitações"        stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="fila" dataKey="referencias_manaus"name="Ref. Manaus"         stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="pct"  dataKey="reguladas_pct"     name="Reguladas %"         stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
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
