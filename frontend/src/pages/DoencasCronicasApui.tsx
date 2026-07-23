import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
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

export default function DoencasCronicasApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["dcnt-dashboard"], queryFn: () => apiGet("/api/doencas-cronicas-apui/dashboard"),                 enabled: aba === "dashboard" });
  const { data: condicoes }   = useQuery({ queryKey: ["dcnt-cond"],      queryFn: () => apiGet("/api/doencas-cronicas-apui/condicoes"),                  enabled: aba === "condicoes" });
  const { data: cardiovasc }  = useQuery({ queryKey: ["dcnt-cardio"],    queryFn: () => apiGet("/api/doencas-cronicas-apui/eventos-cardiovasculares"),    enabled: aba === "cardiovascular" });
  const { data: historico }   = useQuery({ queryKey: ["dcnt-hist"],      queryFn: () => apiGet("/api/doencas-cronicas-apui/historico"),                  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["dcnt-ind"],       queryFn: () => apiGet("/api/doencas-cronicas-apui/indicadores"),                enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",     label: "Dashboard",    icon: <Heart size={15}/> },
    { key: "condicoes",     label: "Condições",    icon: <Activity size={15}/> },
    { key: "cardiovascular",label: "Cardiovascular",icon: <AlertTriangle size={15}/> },
    { key: "historico",     label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores",   label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Heart size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Doenças Crônicas / DCNT — Apuí/AM</h1>
            <p className="text-sm text-slate-500">HAS · DM · DRC · DPOC · Cardiovascular · FMS Apuí/AM</p>
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
              <KPI label="HAS Diagnosticados"       value={dashRaw.has_diagnosticados?.toLocaleString()} color={WARN} sub={`${dashRaw.has_diagnosticados_estimados_pct}% dos estimados`} />
              <KPI label="HAS Controlados"           value={`${dashRaw.has_controlados_pct}%`}           color={CRIT} sub={`meta: ${dashRaw.meta_has_controlados_pct}%`} />
              <KPI label="DM Diagnosticados"         value={dashRaw.dm_diagnosticados?.toLocaleString()} color={WARN} sub="HbA1c não local" />
              <KPI label="DM Controlados (HbA1c)"    value={`${dashRaw.dm_hba1c_controlados_pct}%`}      color={CRIT} sub={`meta: ${dashRaw.meta_dm_controlados_pct}%`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="HIPERDIA Ativo"             value={`${dashRaw.hiperdia_acompanhamento_ativo_pct}%`} color={CRIT} sub={`${dashRaw.hiperdia_cadastrados} cadastrados`} />
              <KPI label="IAM / Ano"                  value={`${dashRaw.ami_casos_ano} casos`}             color={CRIT} sub="zero trombolítico local" />
              <KPI label="AVC / Ano"                  value={`${dashRaw.avc_casos_ano} casos`}             color={CRIT} sub="zero tPA disponível" />
              <KPI label="DRC em Diálise (Manaus)"    value={dashRaw.drc_dialise_manaus_pacientes?.toString()} color={CRIT} sub="784 km de Apuí" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Controle HAS e DM</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "HAS controlada (meta 70%)",         value: dashRaw.has_controlados_pct,      meta: 70, color: CRIT },
                    { label: "DM HbA1c < 7% (meta 60%)",          value: dashRaw.dm_hba1c_controlados_pct, meta: 60, color: CRIT },
                    { label: "HIPERDIA ativo (meta 85%)",          value: dashRaw.hiperdia_acompanhamento_ativo_pct, meta: 85, color: CRIT },
                    { label: "DM em tratamento (meta 85%)",        value: dashRaw.dm_em_tratamento_pct,     meta: 85, color: WARN },
                    { label: "HAS em tratamento (meta 80%)",       value: dashRaw.has_em_tratamento_pct,    meta: 80, color: WARN },
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
                <p><b>IAM = 784 km sem trombolítico</b> — 12 infartos/ano com tempo porta-reperfusão impossível. R$ 1.200 de alteplase poderia salvar 3 vidas/ano. Sem ele, transferência de 8-12h = necrose miocárdica total.</p>
                <p><b>AVC: zero tPA disponível</b> — 18 casos/ano, janela 4,5h, transfer 8h. 72% de sequela permanente nos sobreviventes. Custo da sequela (cadeira de rodas, cuidador, pensão) supera 100x o custo do tPA em 1 ano.</p>
                <p><b>28 pacientes em hemodiálise em Manaus</b> — DRC diagnosticada tardiamente sem nefrologista. TFD R$ 284k/mês só para DRC. Fístula arteriovenosa não é feita antes da diálise: cada paciente chega com cateter de emergência.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "condicoes" && Array.isArray(condicoes) && (
          <div className="space-y-4">
            {(condicoes as any[]).map((c: any) => (
              <div key={c.condicao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(c.status) }} />
                    <span className="font-semibold text-slate-700">{c.condicao}</span>
                  </div>
                  <div className="text-xs text-right space-y-0.5 ml-4">
                    <div>Diagnosticados: <b>{c.diagnosticados.toLocaleString()}</b> / estimados: <b>{c.prevalencia_estimada.toLocaleString()}</b></div>
                    <div>Diagnóstico: <b style={{ color: WARN }}>{c.diagnostico_pct}%</b> | Tratamento: <b style={{ color: statusColor(c.status) }}>{c.tratamento_pct}%</b></div>
                    {c.controlados_pct != null && <div>Controlados: <b style={{ color: statusColor(c.status) }}>{c.controlados_pct}%</b> / meta {c.meta_controle_pct}%</div>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{c.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "cardiovascular" && Array.isArray(cardiovasc) && (
          <div className="space-y-3">
            {(cardiovasc as any[]).map((ev: any) => (
              <div key={ev.evento} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: CRIT }} />
                    <span className="font-semibold text-slate-700">{ev.evento}</span>
                  </div>
                  <div className="text-xs text-right ml-4 space-y-0.5">
                    <div>Casos/ano: <b>{ev.casos_ano}</b></div>
                    <div>Óbitos hosp: <b style={{ color: ev.obitos_hospitais > 0 ? CRIT : OK }}>{ev.obitos_hospitais}</b> | Pré-hosp: <b style={{ color: ev.obitos_pre_hospitalar > 0 ? CRIT : OK }}>{ev.obitos_pre_hospitalar}</b></div>
                    {ev.fibrinolise_local === false && <div className="font-bold" style={{ color: CRIT }}>Zero fibrinolítico disponível</div>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{ev.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — DCNT (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" tick={{ fontSize: 11 }} unit="%" />
                <YAxis yAxisId="n" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="pct" dataKey="has_controlados_pct"    name="HAS controlada (%)"     stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="dm_controlados_pct"     name="DM HbA1c < 7% (%)"      stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="hiperdia_ativo_pct"     name="HIPERDIA ativo (%)"      stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="ami_casos"              name="IAM casos"               stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="n"   dataKey="avc_casos"              name="AVC casos"               stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="n"   dataKey="drc_dialise"            name="DRC em diálise"          stroke="#6b7280"strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
