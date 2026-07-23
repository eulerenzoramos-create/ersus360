import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Heart, AlertTriangle, TrendingUp, Baby } from "lucide-react";

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

export default function MortalidadeMaternaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }     = useQuery({ queryKey: ["mat-dashboard"], queryFn: () => apiGet("/api/mortalidade-materna-apui/dashboard"),      enabled: aba === "dashboard" });
  const { data: causas }   = useQuery({ queryKey: ["mat-causas"],    queryFn: () => apiGet("/api/mortalidade-materna-apui/causas-maternas"), enabled: aba === "causas" });
  const { data: neonatal } = useQuery({ queryKey: ["mat-neonatal"],  queryFn: () => apiGet("/api/mortalidade-materna-apui/neonatal"),        enabled: aba === "neonatal" });
  const { data: historico }= useQuery({ queryKey: ["mat-hist"],      queryFn: () => apiGet("/api/mortalidade-materna-apui/historico"),       enabled: aba === "historico" });
  const { data: indicadores}=useQuery({ queryKey: ["mat-ind"],       queryFn: () => apiGet("/api/mortalidade-materna-apui/indicadores"),     enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",       icon: <Heart size={15}/> },
    { key: "causas",      label: "Causas Maternas", icon: <AlertTriangle size={15}/> },
    { key: "neonatal",    label: "Neonatal",        icon: <Baby size={15}/> },
    { key: "historico",   label: "Histórico",       icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",     icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Heart size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Mortalidade Materna e Neonatal — Apuí/AM</h1>
            <p className="text-sm text-slate-500">RMM · Pré-natal · Parto domiciliar · Mortalidade neonatal · FMS Apuí/AM</p>
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
              <KPI label="Razão Mortalidade Materna" value={`${dashRaw.razao_mortalidade_materna_2025}/100kNV`} color={CRIT} sub={`meta ODS: ${dashRaw.meta_rmm_ods} · BR: ${dashRaw.media_rmm_brasil}`} />
              <KPI label="Óbitos maternos 2025"      value={dashRaw.obitos_maternos_2025}                       color={CRIT} sub={`${dashRaw.obitos_maternos_preveniveis_pct}% evitáveis`} />
              <KPI label="Mortalidade neonatal"       value={`${dashRaw.mortalidade_neonatal_por_1k}/1000NV`}   color={CRIT} sub={`meta ODS: ${dashRaw.meta_mortalidade_neonatal_ods}`} />
              <KPI label="Parto hospitalar"           value={`${dashRaw.parto_hospitalar_pct}%`}               color={CRIT} sub={`${dashRaw.parto_domiciliar_ribeirinho_pct}% domiciliar/ribeirinho`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Pré-natal ≥ 6 consultas"   value={`${dashRaw.prenatal_6_consultas_pct}%`}           color={CRIT} sub="meta: 80%" />
              <KPI label="1ª consulta 1º trimestre"   value={`${dashRaw.prenatal_inicio_1_trimestre_pct}%`}   color={CRIT} sub="meta: 90%" />
              <KPI label="Cesariana"                  value={`${dashRaw.cesariana_pct}%`}                     color={CRIT} sub={`meta OMS: ${dashRaw.meta_cesariana_oms_pct}%`} />
              <KPI label="Obstetra no município"      value={dashRaw.obstetra_municipio === 0 ? "Nenhum" : dashRaw.obstetra_municipio} color={CRIT} sub={`referência: ${dashRaw.obstetra_referencia_km} km`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Indicadores Obstétricos — Situação vs Meta</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Pré-natal ≥ 6 consultas (${dashRaw.prenatal_6_consultas_pct}% / meta 80%)`, value: dashRaw.prenatal_6_consultas_pct, max: 100, color: CRIT },
                    { label: `1ª consulta 1º trimestre (${dashRaw.prenatal_inicio_1_trimestre_pct}% / meta 90%)`, value: dashRaw.prenatal_inicio_1_trimestre_pct, max: 100, color: CRIT },
                    { label: `Parto hospitalar (${dashRaw.parto_hospitalar_pct}% / meta 95%)`, value: dashRaw.parto_hospitalar_pct, max: 100, color: CRIT },
                    { label: `Cesariana: meta ≤15% OMS (atual ${dashRaw.cesariana_pct}%)`, value: 100 - dashRaw.cesariana_pct, max: 100, color: WARN },
                    { label: `Mortalidade infantil (${dashRaw.mortalidade_infantil_por_1k}/1kNV / meta 12,4)`, value: 100 - dashRaw.mortalidade_infantil_por_1k, max: 100, color: CRIT },
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
                <p><b>RMM 124/100kNV = 4,1x acima da meta ODS</b> — 6 óbitos maternos em 2025, todos evitáveis. Zero obstetra, zero banco de sangue, zero UTI neonatal. Hemorragia pós-parto + 2h para chegar ao banco de sangue = óbito praticamente certo.</p>
                <p><b>28,4% de parto domiciliar ribeirinho</b> — o mais alto do Amazonas excluindo municípios sem hospital. Parteiras tradicionais: 8 cadastradas, sem integração ao SUS. Mapa de gestantes por localização: inexistente.</p>
                <p><b>Mortalidade neonatal 20,7/1000NV = 1,7x acima da meta ODS</b> — 10 óbitos neonatais em 2025. 80% evitáveis com UTI neonatal + reanimação adequada + pré-natal de qualidade. Rede Cegonha: proposta de 6 leitos de UCIN = R$ 1,8M.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "causas" && Array.isArray(causas) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Óbitos Maternos por Causa — 2025</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(causas as any[]).filter((c: any) => c.obitos > 0)} layout="vertical" margin={{ left: 200, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="causa" type="category" tick={{ fontSize: 10 }} width={200} />
                  <Tooltip />
                  <Bar dataKey="obitos" name="Óbitos" fill={CRIT} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(causas as any[]).map((c: any) => (
                <div key={c.causa} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(c.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{c.causa}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <span className="font-bold" style={{ color: c.obitos > 0 ? CRIT : WARN }}>{c.obitos} óbito(s)</span>
                      {" · "}
                      <span>{c.pct_total}%</span>
                      {c.prevenivel && <span className="ml-1 text-orange-600 font-bold">· evitável</span>}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{c.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "neonatal" && Array.isArray(neonatal) && (
          <div className="grid gap-3">
            {(neonatal as any[]).map((n: any) => (
              <div key={n.indicador} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-4">
                <div className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(n.status) }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-700 text-sm">{n.indicador}</span>
                    <span className="font-bold text-sm" style={{ color: statusColor(n.status) }}>
                      {n.valor} / meta: {n.meta}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{n.observacao}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mortalidade Materna/Neonatal — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="rmm"                 name="RMM (/100kNV)"         stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="prenatal_6cons_pct"  name="Pré-natal ≥6 cons (%)" stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="parto_hosp_pct"      name="Parto hospitalar (%)"  stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="mort_neonatal"       name="Mort. neonatal /1000"  stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
