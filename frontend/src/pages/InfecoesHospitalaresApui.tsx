import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { ShieldCheck, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function InfecoesHospitalaresApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["iras-dashboard"], queryFn: () => apiGet("/api/infeccoes-hospitalares-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: tipos }       = useQuery({ queryKey: ["iras-tipos"],     queryFn: () => apiGet("/api/infeccoes-hospitalares-apui/tipos"),         enabled: aba === "tipos" });
  const { data: prevencao }   = useQuery({ queryKey: ["iras-prev"],      queryFn: () => apiGet("/api/infeccoes-hospitalares-apui/prevencao"),     enabled: aba === "prevencao" });
  const { data: historico }   = useQuery({ queryKey: ["iras-hist"],      queryFn: () => apiGet("/api/infeccoes-hospitalares-apui/historico"),     enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["iras-ind"],       queryFn: () => apiGet("/api/infeccoes-hospitalares-apui/indicadores"),   enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",    icon: <ShieldCheck size={15}/> },
    { key: "tipos",       label: "IRAS por Tipo", icon: <Activity size={15}/> },
    { key: "prevencao",   label: "Prevenção",    icon: <ShieldCheck size={15}/> },
    { key: "historico",   label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <ShieldCheck size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Infecções Hospitalares (IRAS) — Apuí/AM</h1>
            <p className="text-sm text-slate-500">CCIH · ISC · ITU · Bacteremia · MRSA · KPC · Higiene das mãos · HMM Apuí/AM</p>
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
              <KPI label="Taxa IRAS (geral)"     value={`${dashRaw.iras_taxa_geral_pct}%`}          color={CRIT} sub="meta: 3%" />
              <KPI label="ISC (cirurgia)"        value={`${dashRaw.infeccao_sitio_cirurgico_pct}%`} color={CRIT} sub="meta: 2%" />
              <KPI label="Higiene das mãos"      value={`${dashRaw.higiene_maos_conformidade_pct}%`} color={CRIT} sub="meta: 80%" />
              <KPI label="Resistência (MRSA/KPC)"value={`${dashRaw.resistencia_mrsa_casos_2025 + dashRaw.resistencia_kpc_casos_2025} casos`} color={CRIT} sub="2025" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Óbitos por IRAS/ano"   value={`${dashRaw.obitos_iras_ano}`}               color={CRIT} sub={`mortalidade ${dashRaw.mortalidade_iras_pct}%`} />
              <KPI label="ATB profilaxia cirurg." value={`${dashRaw.antibiotico_profilaxia_cirurgica_pct}%`} color={CRIT} sub="meta: 95%" />
              <KPI label="CCIH reuniões"          value={`${dashRaw.ccih_reunioes_ano}/12`}          color={CRIT} sub="meta: mensais" />
              <KPI label="Infectologista"         value={`${dashRaw.infectologista}`}                color={CRIT} sub="zero no município" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Conformidade das Medidas de Prevenção</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Higiene das mãos (${dashRaw.higiene_maos_conformidade_pct}%)`,          value: dashRaw.higiene_maos_conformidade_pct, max: 80,  color: CRIT },
                    { label: `ATB profilaxia cirúrgica (${dashRaw.antibiotico_profilaxia_cirurgica_pct}%)`, value: dashRaw.antibiotico_profilaxia_cirurgica_pct, max: 95, color: CRIT },
                    { label: `Álcool gel mL/leito/dia (${dashRaw.consumo_alcool_gel_ml_leito_dia}/${dashRaw.meta_alcool_gel_ml})`, value: dashRaw.consumo_alcool_gel_ml_leito_dia, max: dashRaw.meta_alcool_gel_ml, color: CRIT },
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
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex flex-col gap-2 justify-center">
                <p><b>IRAS 2,8x acima da meta</b> — 8,4% vs meta 3%. ISC 12,4% (meta 2%): bundle cirúrgico implementado completamente em apenas 28,4% das cirurgias. Antibiótico profilático no timing correto: 62,4% (meta 95%).</p>
                <p><b>MRSA e KPC em hospital de 28 leitos</b> — tendência crescente (2 → 6 casos em 4 anos). Triagem de resistência na admissão: zero. Notificação à ANVISA: não realizada em 2/6 casos em 2025.</p>
                <p><b>CCIH existente mas inoperante</b> — 4/12 reuniões em 2024. Sem infectologista, sem microbiologista, sem farmacêutico clínico. Higiene das mãos 48,4%: principal intervenção de custo zero está pela metade da meta.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "tipos" && Array.isArray(tipos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-2">
              <h3 className="font-semibold text-slate-700 mb-3">Taxa de IRAS por Tipo (%)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(tipos as any[]).filter((t: any) => t.taxa_pct > 0)} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="tipo" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="taxa_pct" name="Taxa atual (%)" radius={[4,4,0,0]}>
                    {(tipos as any[]).filter((t: any) => t.taxa_pct > 0).map((t: any) => (
                      <Cell key={t.tipo} fill={statusColor(t.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {(tipos as any[]).map((t: any) => (
              <div key={t.tipo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(t.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{t.tipo}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: statusColor(t.status) }}>{t.taxa_pct > 0 ? `${t.taxa_pct}%` : `${t.casos_ano} casos`}</span>
                    <p className="text-xs text-slate-400">meta: {t.meta_pct}% · casos/ano: {t.casos_ano}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{t.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "prevencao" && Array.isArray(prevencao) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-2">
              <h3 className="font-semibold text-slate-700 mb-3">Conformidade das Medidas de Prevenção (%)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={prevencao as any[]} layout="vertical" margin={{ top: 5, right: 40, bottom: 5, left: 200 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <YAxis type="category" dataKey="medida" tick={{ fontSize: 8 }} width={195} />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="conformidade_pct" name="Conformidade atual (%)" radius={[0,4,4,0]}>
                    {(prevencao as any[]).map((p: any) => (
                      <Cell key={p.medida} fill={statusColor(p.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {(prevencao as any[]).map((p: any) => (
              <div key={p.medida} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(p.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{p.medida}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: statusColor(p.status) }}>{p.conformidade_pct}%</span>
                    <p className="text-xs text-slate-400">meta: {p.meta_pct}%</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{p.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução IRAS — HMM Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="iras_taxa_pct"      name="Taxa IRAS (%)"           stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="isc_pct"            name="ISC (%)"                 stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="higiene_maos_pct"   name="Higiene mãos (%)"        stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="resistencia_casos"  name="Resistência (nº casos)"  stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
