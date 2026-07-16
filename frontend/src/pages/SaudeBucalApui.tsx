import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Star, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

const PROC_COLORS: Record<string, string> = {
  "Consulta inicial / triagem":        BRAND,
  "Restauração dentária":              ACCENT,
  "Exodontia (adulto)":               CRIT,
  "Exodontia (criança / decíduo)":    "#e11d48",
  "Prevenção (aplicação flúor/selante)": OK,
  "Raspagem periodontal":             WARN,
  "Urgência odontológica":            "#64748b",
  "Cirurgia oral menor":              "#7c3aed",
};

export default function SaudeBucalApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["sb-dashboard"],  queryFn: () => apiGet("/api/saude-bucal-apui/dashboard"),    enabled: aba === "dashboard" });
  const { data: producao }    = useQuery({ queryKey: ["sb-producao"],   queryFn: () => apiGet("/api/saude-bucal-apui/producao"),     enabled: aba === "producao" });
  const { data: epidem }      = useQuery({ queryKey: ["sb-epidem"],     queryFn: () => apiGet("/api/saude-bucal-apui/epidemiologia"),enabled: aba === "epidemiologia" });
  const { data: historico }   = useQuery({ queryKey: ["sb-historico"],  queryFn: () => apiGet("/api/saude-bucal-apui/historico"),    enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["sb-ind"],        queryFn: () => apiGet("/api/saude-bucal-apui/indicadores"),  enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",    icon: <Star size={15}/> },
    { key: "producao",     label: "Produção",     icon: <Activity size={15}/> },
    { key: "epidemiologia",label: "Epidemiologia",icon: <AlertTriangle size={15}/> },
    { key: "historico",    label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Star size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Bucal — Apuí/AM</h1>
            <p className="text-sm text-slate-500">CPO-D · Exodontia · ESB · Edentulismo · FMS Apuí/AM</p>
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
              <KPI label="CEO-d (5 anos)"       value={dashRaw.ceo_d_5a.toString()}             color={statusColor(dashRaw.status_cpod)} sub={`meta OMS: ${dashRaw.meta_ceo_d_5a}`} />
              <KPI label="CPO-D (12 anos)"      value={dashRaw.cpod_12a.toString()}              color={statusColor(dashRaw.status_cpod)} sub={`meta: ${dashRaw.meta_cpod_12a}`} />
              <KPI label="Exodontias / Total"   value={`${dashRaw.exodontia_proporcao_pct}%`}    color={statusColor(dashRaw.status_exodontia)} sub={`meta: ${dashRaw.meta_exodontia_pct}%`} />
              <KPI label="ESB Implantadas"      value={`${dashRaw.esb_implantadas}/${dashRaw.esb_necessarias}`} color={statusColor(dashRaw.status_cobertura)} sub={`${dashRaw.cobertura_esb_pct}% cobertura`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Procedimentos/Mês"    value={dashRaw.procedimentos_basicos_mes.toLocaleString()} color={BRAND} sub="básicos + especializados" />
              <KPI label="Gestantes Atendidas"  value={`${dashRaw.gestantes_atendidas_pre_natal_pct}%`} color={CRIT} sub={`meta: ${dashRaw.meta_gestantes_pct}%`} />
              <KPI label="Fluorose Leve"        value={`${dashRaw.fluorose_leve_pct}%`}           color={WARN} sub={`Moderada: ${dashRaw.fluorose_moderada_pct}%`} />
              <KPI label="Água Fluoretada"      value={`${dashRaw.cobertura_agua_fluoretada_pct}%`} color={WARN} sub="cobertura municipal" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Indicadores-Chave</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: "CEO-d (5a) vs meta OMS 2,0", value: dashRaw.ceo_d_5a, max: 6, meta: dashRaw.meta_ceo_d_5a, color: CRIT, unit: "" },
                    { label: "CPO-D (12a) vs meta 2,6",    value: dashRaw.cpod_12a, max: 6, meta: dashRaw.meta_cpod_12a, color: WARN, unit: "" },
                    { label: "% exodontias (meta 30%)",     value: dashRaw.exodontia_proporcao_pct, max: 60, meta: dashRaw.meta_exodontia_pct, color: CRIT, unit: "%" },
                    { label: "Gestantes pré-natal (meta 60%)", value: dashRaw.gestantes_atendidas_pre_natal_pct, max: 100, meta: dashRaw.meta_gestantes_pct, color: CRIT, unit: "%" },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-bold" style={{ color: b.color }}>{b.value}{b.unit} / meta {b.meta}{b.unit}</span>
                      </div>
                      <ProgressBar value={b.value} max={b.max} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>Modelo mutilador persistente</b> — 38,4% dos procedimentos são exodontias vs meta ≤ 30%. O município extrai onde poderia restaurar, gerando o ciclo de edentulismo já visível nos idosos (38,4%).</p>
                <p><b>3 UBS sem ESB</b> — ESF sem dentista não atinge indicadores Novo Financiamento APS de saúde bucal no pré-natal. Gestantes não triadas = risco de parto prematuro por infecção periodontal.</p>
                <p><b>CEO não implantado</b> — sem referência para endodontia, prótese, periodontia. Procedimentos especializados só em Manicoré (160 km) ou Manaus (784 km).</p>
              </div>
            </div>
          </div>
        )}

        {aba === "producao" && Array.isArray(producao) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Produção por Tipo de Procedimento (mês atual)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={producao as any[]} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="procedimento" tick={{ fontSize: 8 }} width={260} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip />
                  <Bar dataKey="realizado_mes" name="Realizado" radius={[0,3,3,0]}>
                    {(producao as any[]).map((p: any) => <Cell key={p.procedimento} fill={PROC_COLORS[p.procedimento] || BRAND} />)}
                  </Bar>
                  <Bar dataKey="meta_mes" name="Meta" radius={[0,3,3,0]} fill="#e2e8f0" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(producao as any[]).map((p: any) => (
                <div key={p.procedimento} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: PROC_COLORS[p.procedimento] || BRAND }} />
                    <span className="font-semibold text-sm text-slate-700">{p.procedimento}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-bold" style={{ color: statusColor(p.status) }}>{p.realizado_mes} / meta {p.meta_mes}</span>
                    <div className="w-20">
                      <ProgressBar value={p.realizado_mes} max={p.meta_mes * 1.5} color={statusColor(p.status)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "epidemiologia" && Array.isArray(epidem) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Índices Epidemiológicos por Faixa Etária</h3>
              <div className="grid gap-3">
                {(epidem as any[]).map((e: any) => (
                  <div key={e.faixa} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-semibold text-slate-700 text-sm">{e.faixa}</span>
                        <span className="ml-2 text-xs text-slate-500">({e.indice})</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-lg" style={{ color: statusColor(e.status) }}>{e.valor}</span>
                        <span className="text-xs text-slate-400 ml-1">/ meta {e.meta}</span>
                      </div>
                    </div>
                    <ProgressBar value={e.valor} max={Math.max(e.meta * 2.5, e.valor)} color={statusColor(e.status)} />
                    <p className="text-xs text-slate-500 mt-2">{e.interpretacao}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal — Produção Odontológica (2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="p" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="p"   dataKey="procedimentos" name="Procedimentos total" stroke={BRAND}  strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="p"   dataKey="exodontias"    name="Exodontias"          stroke={CRIT}   strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="p"   dataKey="prevencao"     name="Prevenção"           stroke={OK}     strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="pct" dataKey="exod_proporcao_pct" name="% Exodontias"  stroke={WARN}   strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
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
