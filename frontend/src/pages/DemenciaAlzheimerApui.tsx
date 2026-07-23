import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { UserCog, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function DemenciaAlzheimerApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["dem-dash"],  queryFn: () => apiGet("/api/demencia-alzheimer-apui/dashboard"), enabled: aba === "dashboard" });
  const { data: estadios }    = useQuery({ queryKey: ["dem-est"],   queryFn: () => apiGet("/api/demencia-alzheimer-apui/estadios"),  enabled: aba === "estadios" });
  const { data: acoes }       = useQuery({ queryKey: ["dem-acao"],  queryFn: () => apiGet("/api/demencia-alzheimer-apui/acoes"),     enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["dem-hist"],  queryFn: () => apiGet("/api/demencia-alzheimer-apui/historico"), enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["dem-ind"],   queryFn: () => apiGet("/api/demencia-alzheimer-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <UserCog size={15}/> },
    { key: "estadios",    label: "Estágios",   icon: <Activity size={15}/> },
    { key: "acoes",       label: "Ações",      icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <UserCog size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Demência e Alzheimer — Apuí/AM</h1>
            <p className="text-sm text-slate-500">MEEM · Donepezila · CEAF · Cuidador Familiar · Quedas · Estatuto do Idoso · FMS Apuí/AM</p>
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
              <KPI label="Idosos c/ demência estimados"  value={dashRaw.idosos_demencia_estimados}      color={BRAND} sub={`${dashRaw.populacao_60_mais?.toLocaleString()} idosos totais`} />
              <KPI label="Diagnosticados"                value={dashRaw.idosos_demencia_diagnosticados} color={WARN}  sub={`${dashRaw.sem_diagnostico_pct}% sem diagnóstico`} />
              <KPI label="Cuidadores sem apoio"          value={`${dashRaw.cuidadores_sem_suporte_pct}%`} color={CRIT} sub={`burnout: ${dashRaw.cuidador_familiar_burnout_pct}%`} />
              <KPI label="Neurologista em Apuí"         value={dashRaw.neurologista_apui}               color={CRIT} sub="zero especialistas" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Quedas (demência) 2025"        value={dashRaw.quedas_idoso_demencia_2025}     color={CRIT} sub={`${dashRaw.obitos_quedas_demencia_2025} óbitos`} />
              <KPI label="Internações evitáveis"         value={dashRaw.internacoes_demencia_2025}      color={CRIT} sub={`${dashRaw.internacoes_evitageis_cuidado_domiciliar_pct}% evitáveis`} />
              <KPI label="Abuso notificado vs estimado"  value={`${dashRaw.abuso_idoso_demencia_notificado}/${dashRaw.abuso_idoso_demencia_estimado}`} color={CRIT} sub="subnotificação 85,7%" />
              <KPI label="Custo social anual"            value={`R$ ${((dashRaw.custo_social_demencia_anual||0)/1000000).toFixed(1)}M`} color={CRIT} sub="estimado" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cobertura do Cuidado à Demência — Apuí/AM</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Diagnosticados: ${dashRaw.idosos_demencia_diagnosticados}/${dashRaw.idosos_demencia_estimados} estimados`, value: dashRaw.idosos_demencia_diagnosticados, max: dashRaw.idosos_demencia_estimados, color: WARN },
                    { label: `Rivastigmina disponível: ${dashRaw.rivastigmina_disponivel_pct}% (meta 100%)`, value: dashRaw.rivastigmina_disponivel_pct, max: 100, color: CRIT },
                    { label: `Cuidadores com apoio: ${100 - dashRaw.cuidadores_sem_suporte_pct}% (meta 100%)`, value: 100 - dashRaw.cuidadores_sem_suporte_pct, max: 100, color: CRIT },
                    { label: `Internações evitáveis: ${dashRaw.internacoes_evitageis_cuidado_domiciliar_pct}% (meta 0%)`, value: dashRaw.internacoes_evitageis_cuidado_domiciliar_pct, max: 100, color: CRIT },
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
                <p><b>85,6% dos idosos com demência sem diagnóstico</b> — 286 de 334 estimados. MEEM + Teste do Relógio: R$ 2.400 protocola rastreio em toda a APS. Diagnóstico precoce = 12-18 meses de autonomia preservada com donepezila (disponível no REMUME).</p>
                <p><b>84,4% dos cuidadores sem apoio formal</b> — burnout 68,4% leva a abuso (85,7% subnotificado) e institucionalização precoce. Grupo CRAS mensal: R$ 4.800/ano. Burnout → internação = R$ 18.400 × 42 = R$ 773k/ano.</p>
                <p><b>84 quedas, 8 óbitos</b> — fratura de fêmur: R$ 28.400 × 12 = R$ 340k/ano. Adaptação domiciliar: R$ 28k → payback em 1 mês. Tele-neurologista: R$ 14k → diagnóstico + CEAF em 30 dias vs 284 dias atual.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "estadios" && Array.isArray(estadios) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={estadios as any[]} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="estadio" tick={{ fontSize: 8 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="estimados"      name="Estimados"      radius={[4,4,0,0]} fill={BRAND} />
                <Bar dataKey="diagnosticados" name="Diagnosticados" radius={[4,4,0,0]} fill={WARN} />
                <Bar dataKey="em_tratamento"  name="Em tratamento"  radius={[4,4,0,0]} fill={OK} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(estadios as any[]).map((e: any) => (
                <div key={e.estadio} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(e.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{e.estadio}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: statusColor(e.status) }}>{e.diagnosticados}/{e.estimados} diag.</span>
                      <span className="text-slate-400"> · {e.em_tratamento} trat.</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{e.observacao}</p>
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
                    <p className="text-xs text-slate-400 mt-0.5">R$ {a.custo.toLocaleString()} · {a.prazo_meses}m</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Demência e Alzheimer — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="diagnosticados"    name="Diagnosticados"       stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="internacoes"        name="Internações"          stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="quedas"             name="Quedas"               stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="cuidadores_apoiados" name="Cuidadores apoiados" stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
