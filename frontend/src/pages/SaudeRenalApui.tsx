import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Droplets, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function SaudeRenalApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["renal-dashboard"], queryFn: () => apiGet("/api/saude-renal-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: estagios }    = useQuery({ queryKey: ["renal-est"],       queryFn: () => apiGet("/api/saude-renal-apui/estagios"),    enabled: aba === "estagios" });
  const { data: causas }      = useQuery({ queryKey: ["renal-causas"],    queryFn: () => apiGet("/api/saude-renal-apui/causas"),      enabled: aba === "causas" });
  const { data: historico }   = useQuery({ queryKey: ["renal-hist"],      queryFn: () => apiGet("/api/saude-renal-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["renal-ind"],       queryFn: () => apiGet("/api/saude-renal-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",    icon: <Droplets size={15}/> },
    { key: "estagios",   label: "Estágios DRC", icon: <Activity size={15}/> },
    { key: "causas",     label: "Causas",        icon: <Activity size={15}/> },
    { key: "historico",  label: "Histórico",     icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores",   icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Droplets size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Renal — Apuí/AM</h1>
            <p className="text-sm text-slate-500">DRC · Hemodiálise · Nefropatia · ITU · Amputações · FMS Apuí/AM</p>
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
              <KPI label="DRC diagnosticada"       value={`${dashRaw.drc_diagnosticada_pct}%`}               color={CRIT} sub={`${dashRaw.drc_casos_estimados.toLocaleString()} estimados`} />
              <KPI label="DRC em estágio avançado" value={`${dashRaw.drc_estadio_avancado_pct}%`}             color={CRIT} sub="G4-G5 no diagnóstico" />
              <KPI label="Hemodiálise em TFD"      value={`${dashRaw.tfd_hemodialise_viagens_mes} viagens/mês`}color={CRIT} sub={dashRaw.hemodialise_referencia} />
              <KPI label="Nefrologista"             value={`${dashRaw.nefrologista_municipio}`}               color={CRIT} sub="zero no município" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Amputação (pé diabético)"value={`${dashRaw.amputacao_diabetes_ano}/ano`}            color={CRIT} sub="meta: 4/ano" />
              <KPI label="ITU — internações"        value={`${dashRaw.itu_internacoes_ano}/ano`}              color={WARN} sub="pielonefrite inclusa" />
              <KPI label="Creatinina — espera"      value={`${dashRaw.creatinina_laboratorio_dias} dias`}     color={WARN} sub="resultado laboratorial" />
              <KPI label="Custo TFD hemodiálise"   value={`R$ ${dashRaw.tfd_custo_paciente_hemodialise_R_mes.toLocaleString()}/mês`} color={CRIT} sub="por paciente" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Estágios DRC — Diagnóstico vs Estimado</h3>
                {Array.isArray(estagios) && (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={estagios as any[]} layout="vertical" margin={{ left: 100, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="estagio" type="category" tick={{ fontSize: 9 }} width={100} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="estimados"    name="Estimados" fill="#374151" />
                      <Bar dataKey="diagnosticados" name="Diagnosticados">
                        {(estagios as any[]).map((e: any) => (
                          <Cell key={e.estagio} fill={statusColor(e.status)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>Zero hemodiálise em Apuí</b> — 48 pacientes em TFD, 3x/semana = 144 viagens/mês para Humaitá ou Manaus. Custo total mensal ao município: R$ 136.320 (TFD + diária + transporte). Clínica de diálise local: investimento R$ 1,2M + custeio R$ 28k/mês — custo-benefício favorável a partir de 18 pacientes.</p>
                <p><b>64,2% detectados em G4-G5</b> — rastreio com microalbuminúria em HAS/DM detectaria em G1-G2. Custo do rastreio: R$ 28/paciente/ano vs R$ 50.400/paciente/ano em hemodiálise. ROI de 1.800:1 na detecção precoce.</p>
                <p><b>Mercúrio renal (garimpo)</b> — 2.400 expostos a mercúrio acima do limite OMS. Nefrotoxicidade crônica por mercúrio não monitorada. Dano renal cumulativo + HAS + DM = DRC acelerada em garimpeiros.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "estagios" && Array.isArray(estagios) && (
          <div className="grid gap-3">
            {(estagios as any[]).map((e: any) => (
              <div key={e.estagio} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(e.status) }} />
                    <div>
                      <p className="font-semibold text-sm text-slate-700">{e.estagio}</p>
                      <p className="text-xs text-slate-400">{e.descricao}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: BRAND }}>{e.estimados} estimados</span>
                    <p className="text-xs" style={{ color: statusColor(e.status) }}>{e.diagnosticados} diag. · {e.manejados_aps_pct}% manejados</p>
                  </div>
                </div>
                <div className="ml-5 mb-2">
                  <ProgressBar value={e.diagnosticados} max={e.estimados} color={statusColor(e.status)} />
                </div>
                <p className="text-xs text-slate-500 ml-5">{e.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "causas" && Array.isArray(causas) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-2">
              <h3 className="font-semibold text-slate-700 mb-3">Causas de DRC — Proporção</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={causas as any[]} layout="vertical" margin={{ left: 180, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis type="number" tick={{ fontSize: 10 }} unit="%" />
                  <YAxis dataKey="causa" type="category" tick={{ fontSize: 10 }} width={180} />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="proporcao_drc_pct" name="Proporção DRC (%)">
                    {(causas as any[]).map((c: any) => (
                      <Cell key={c.causa} fill={statusColor(c.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {(causas as any[]).map((c: any) => (
              <div key={c.causa} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(c.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{c.causa}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: statusColor(c.status) }}>{c.proporcao_drc_pct}% dos casos DRC</span>
                    <p className="text-xs text-slate-400">controlada: {c.controlada_municipio_pct}%</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{c.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Renal — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="drc_diagnosticada_pct"      name="DRC diagnosticada (%)"    stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="hemodialise_tfd_pacientes"   name="TFD hemodiálise (pcts)"   stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="amputacao_diabetes"          name="Amputações diabetes"       stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
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
