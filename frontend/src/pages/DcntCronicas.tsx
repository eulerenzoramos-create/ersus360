import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Activity, AlertTriangle, TrendingDown, Users } from "lucide-react";

const BRAND  = "#dbeafe";
const ACCENT = "#2563eb";
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

const PIE_COLORS = [OK, WARN, CRIT];

export default function DcntCronicas() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }      = useQuery({ queryKey: ["dcnt-dashboard"], queryFn: () => apiGet("/api/dcnt-cronicas/dashboard"), enabled: aba === "dashboard" });
  const { data: doencas }   = useQuery({ queryKey: ["dcnt-doencas"],   queryFn: () => apiGet("/api/dcnt-cronicas/doencas"),   enabled: aba === "doencas" });
  const { data: riscoCV }   = useQuery({ queryKey: ["dcnt-risco"],     queryFn: () => apiGet("/api/dcnt-cronicas/risco-cv"),  enabled: aba === "risco" });
  const { data: historico } = useQuery({ queryKey: ["dcnt-historico"], queryFn: () => apiGet("/api/dcnt-cronicas/historico"), enabled: aba === "historico" });
  const { data: indicadores }= useQuery({ queryKey: ["dcnt-ind"],     queryFn: () => apiGet("/api/dcnt-cronicas/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Activity size={15}/> },
    { key: "doencas",     label: "Doenças",    icon: <Users size={15}/> },
    { key: "risco",       label: "Risco CV",   icon: <TrendingDown size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Activity size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>DCNT / Doenças Crônicas</h1>
            <p className="text-sm text-slate-500">HAS · DM · Obesidade · DPOC · Dislipidemia · Risco CV · FMS Apuí/AM</p>
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
              <KPI label="Hipertensos Cadastrados"  value={dashRaw.hipertensao_cadastrados?.toLocaleString()} color={ACCENT} />
              <KPI label="HAS Controlados"          value={`${dashRaw.hipertensao_controlados_pct}%`} color={statusColor(dashRaw.status_has)} sub="PA controlada" />
              <KPI label="Diabéticos Cadastrados"   value={dashRaw.diabetes_cadastrados?.toLocaleString()} color={ACCENT} />
              <KPI label="DM Controlados"           value={`${dashRaw.diabetes_controlados_pct}%`} color={statusColor(dashRaw.status_dm)} sub="glicemia controlada" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Obesidade Adultos"        value={`${dashRaw.obesidade_adultos_pct}%`} color={WARN} />
              <KPI label="Risco CV Alto"            value={`${dashRaw.risco_cv_alto_pct}%`}     color={CRIT} sub="da carteira" />
              <KPI label="Internações DCNT/Mês"     value={dashRaw.internacoes_dcnt_mes.toString()} color={CRIT} />
              <KPI label="Óbitos DCNT (2025)"       value={dashRaw.obitos_dcnt_ano.toString()} color={CRIT} />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Controle HAS vs DM</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>HAS controlados</span>
                      <span className="font-bold" style={{ color: WARN }}>{dashRaw.hipertensao_controlados_pct}% / meta 70%</span>
                    </div>
                    <ProgressBar value={dashRaw.hipertensao_controlados_pct} max={70} color={WARN} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>DM controlados</span>
                      <span className="font-bold" style={{ color: CRIT }}>{dashRaw.diabetes_controlados_pct}% / meta 60%</span>
                    </div>
                    <ProgressBar value={dashRaw.diabetes_controlados_pct} max={60} color={CRIT} />
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <b>Controle insuficiente de DM e HAS.</b> DM com apenas 44,2% de controle (meta 60%) — risco elevado de complicações: neuropatia, nefropatia, retinopatia, amputações. 18,6% da carteira com risco cardiovascular alto ({dashRaw.internacoes_dcnt_mes} internações/mês).
              </div>
            </div>
          </div>
        )}

        {aba === "doencas" && Array.isArray(doencas) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Controle por Doença Crônica</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={(doencas as any[]).map((d: any) => ({ nome: d.doenca.split(" (")[0], pct: d.controlados_pct, meta: d.meta_controle_pct }))} layout="vertical" margin={{ left: 10, right: 60 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} unit="%" />
                  <YAxis type="category" dataKey="nome" tick={{ fontSize: 9 }} width={180} />
                  <Tooltip />
                  <Bar dataKey="pct"  name="Controlados %" radius={[0,3,3,0]}>
                    {(doencas as any[]).map((d: any) => <Cell key={d.doenca} fill={statusColor(d.status)} />)}
                  </Bar>
                  <Bar dataKey="meta" name="Meta %"  fill="#374151" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(doencas as any[]).map((d: any) => (
                <div key={d.doenca} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-semibold text-slate-700">{d.doenca}</span>
                      <span className="text-xs text-slate-400 ml-2">{d.cid}</span>
                    </div>
                    <span className="font-bold text-lg" style={{ color: statusColor(d.status) }}>{d.controlados_pct}%</span>
                  </div>
                  <ProgressBar value={d.controlados_pct} max={d.meta_controle_pct} color={statusColor(d.status)} />
                  <div className="flex gap-6 mt-2 text-xs text-slate-500">
                    <span>Cadastrados: <b>{d.cadastrados?.toLocaleString()}</b></span>
                    <span style={{ color: OK }}>Controlados: <b>{d.controlados?.toLocaleString()}</b></span>
                    <span>Meta: <b>{d.meta_controle_pct}%</b></span>
                    <span>Consultas/ano: <b>{d.consultas_ano}</b></span>
                  </div>
                  {d.medicamentos_basicos.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {d.medicamentos_basicos.map((m: string) => (
                        <span key={m} className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700">{m}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "risco" && Array.isArray(riscoCV) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Estratificação de Risco Cardiovascular</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={riscoCV} dataKey="pct" nameKey="faixa" cx="50%" cy="50%" outerRadius={80} label={({ faixa, pct }) => `${pct}%`}>
                    {(riscoCV as any[]).map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {(riscoCV as any[]).map((r: any, i: number) => (
                <div key={r.faixa} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="font-semibold text-slate-700">{r.faixa}</span>
                    </div>
                    <span className="font-bold text-lg" style={{ color: PIE_COLORS[i % PIE_COLORS.length] }}>{r.n?.toLocaleString()}</span>
                  </div>
                  <ProgressBar value={r.pct} max={100} color={PIE_COLORS[i % PIE_COLORS.length]} />
                  <p className="text-xs text-slate-400 mt-1">{r.pct}% da carteira HAS/DM</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal — Controle HAS, DM e Internações</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="pct" tick={{ fontSize: 11 }} unit="%" domain={[35, 65]} />
                <YAxis yAxisId="n"   orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="pct" dataKey="has_controlados_pct" name="HAS controlados %"   stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="dm_controlados_pct"  name="DM controlados %"    stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="internacoes_dcnt"    name="Internações DCNT"     stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
