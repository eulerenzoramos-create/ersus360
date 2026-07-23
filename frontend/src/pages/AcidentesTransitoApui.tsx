import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { AlertTriangle, TrendingUp, Activity, Shield } from "lucide-react";

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

export default function AcidentesTransitoApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }         = useQuery({ queryKey: ["trans-dash"],  queryFn: () => apiGet("/api/acidentes-transito-apui/dashboard"),    enabled: aba === "dashboard" });
  const { data: tipos }        = useQuery({ queryKey: ["trans-tipos"], queryFn: () => apiGet("/api/acidentes-transito-apui/tipos"),        enabled: aba === "tipos" });
  const { data: fiscalizacao } = useQuery({ queryKey: ["trans-fisc"],  queryFn: () => apiGet("/api/acidentes-transito-apui/fiscalizacao"), enabled: aba === "fiscalizacao" });
  const { data: historico }    = useQuery({ queryKey: ["trans-hist"],  queryFn: () => apiGet("/api/acidentes-transito-apui/historico"),    enabled: aba === "historico" });
  const { data: indicadores }  = useQuery({ queryKey: ["trans-ind"],   queryFn: () => apiGet("/api/acidentes-transito-apui/indicadores"),  enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",      icon: <AlertTriangle size={15}/> },
    { key: "tipos",        label: "Tipos",          icon: <Activity size={15}/> },
    { key: "fiscalizacao", label: "Fiscalização",   icon: <Shield size={15}/> },
    { key: "historico",    label: "Histórico",      icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores",    icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <AlertTriangle size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Acidentes de Trânsito e Trauma — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Mortalidade · Trauma · Motociclistas · Álcool · SAMU · FMS Apuí/AM</p>
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
              <KPI label="Óbitos no trânsito 2025"   value={dashRaw.obitos_transito_2025}                       color={CRIT} sub={`${dashRaw.taxa_mortalidade_transito_100k}/100k (meta ${dashRaw.meta_taxa_mortalidade_transito_100k})`} />
              <KPI label="Internações por trauma"     value={dashRaw.internacoes_trauma_2025}                   color={CRIT} sub={`R$ ${(dashRaw.custo_internacao_trauma_anual/1e6).toFixed(1)}M/ano`} />
              <KPI label="Condutores alcoolizados"    value={`${dashRaw.condutor_alcool_pct}%`}                 color={CRIT} sub="dos acidentes com vítima" />
              <KPI label="SAMU tempo resposta"        value={`${dashRaw.samu_tempo_resposta_min} min`}          color={CRIT} sub={`meta ${dashRaw.meta_samu_tempo_resposta_min} min`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Motociclistas entre vítimas" value={`${dashRaw.motociclistas_pct_vitimas}%`}          color={CRIT} sub="principal modal de risco" />
              <KPI label="Atropelamentos 2025"         value={dashRaw.atropelamentos_pedestres_2025}            color={CRIT} sub="113/100k (5,7× média BR)" />
              <KPI label="Blitz etilômetro 2025"       value={`${dashRaw.blitz_etilometro_2025}/${dashRaw.meta_blitz_etilometro_2025}`} color={CRIT} sub="meta: 2/mês" />
              <KPI label="Ortopedista no HMM"          value={dashRaw.hmm_cirurgiao_ortopedico === 0 ? "Nenhum" : dashRaw.hmm_cirurgiao_ortopedico} color={CRIT} sub="todas as fraturas para Humaitá" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Segurança Viária — Situação Atual</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Blitz etilômetro (${dashRaw.blitz_etilometro_2025}/${dashRaw.meta_blitz_etilometro_2025}/ano)`,  value: dashRaw.blitz_etilometro_2025, max: dashRaw.meta_blitz_etilometro_2025, color: CRIT },
                    { label: `Pontos críticos sinalizados (21,4% / meta 100%)`,                                                  value: 21.4, max: 100, color: CRIT },
                    { label: `Capacete (62,4% / meta 95%)`,                                                                      value: 62.4, max: 100, color: CRIT },
                    { label: `CNH habilitados para moto (42,4% / meta 95%)`,                                                     value: 42.4, max: 100, color: CRIT },
                    { label: `SAMU tempo resposta inverso (meta 15 min)`,                                                        value: 15, max: dashRaw.samu_tempo_resposta_min, color: CRIT },
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
                <p><b>Taxa 72,9/100k = 4,9× acima da meta ODS</b> — 18 óbitos em 2025, custo social R$ 21,6M (IPEA: R$ 1,2M/óbito). 62,4% das vítimas: motociclistas. AM-174 (garimpo): velocidade média 94 km/h, limite 60 km/h, zero radar.</p>
                <p><b>48,4% dos acidentes: condutor alcoolizado</b> — apenas 2 blitz em 2025 (meta: 24/ano). Custo da blitz: zero (PM realiza). "Operação Lei Seca": não implantada. 18 autuações e 4 CNHs recolhidas nas 2 blitz realizadas.</p>
                <p><b>Zero ortopedista no HMM</b> — 84 fraturas/ano transferidas para Humaitá (R$ 235k em SAMU). Ortopedista PSS: R$ 180k/ano, payback em 8 meses. 4 óbitos em 2025 ocorreram durante o transporte (golden hour não cumprida).</p>
              </div>
            </div>
          </div>
        )}

        {aba === "tipos" && Array.isArray(tipos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Acidentes por Tipo — 2025</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(tipos as any[])} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis dataKey="tipo" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="casos_2025" name="Casos" radius={[4,4,0,0]}>
                    {(tipos as any[]).map((t: any, i: number) => <Cell key={i} fill={statusColor(t.gravidade === "grave" ? "critico" : "atencao")} />)}
                  </Bar>
                  <Bar dataKey="obitos" name="Óbitos" fill={BRAND} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(tipos as any[]).map((t: any) => (
                <div key={t.tipo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(t.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{t.tipo}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold text-slate-700">{t.casos_2025} casos</span>
                      {t.obitos > 0 && <span className="ml-1 font-bold text-red-700">· {t.obitos} óbito(s)</span>}
                      <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${t.gravidade === "grave" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{t.gravidade}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{t.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "fiscalizacao" && Array.isArray(fiscalizacao) && (
          <div className="grid gap-3">
            {(fiscalizacao as any[]).map((f: any) => (
              <div key={f.acao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: f.implementada ? OK : CRIT }} />
                    <p className="font-semibold text-sm text-slate-700">{f.acao}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${f.implementada ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {f.implementada ? "Implementada" : "Não implementada"}
                    </span>
                    {f.atual != null && <p className="text-xs mt-0.5">{f.atual} / meta {f.meta}</p>}
                    {f.custo > 0 && <p className="text-xs text-slate-400">R$ {f.custo.toLocaleString()} · {f.prazo_meses}m</p>}
                    {f.custo === 0 && <p className="text-xs text-green-600">custo R$ 0 · {f.prazo_meses}m</p>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{f.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Acidentes de Trânsito — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="obitos"      name="Óbitos"            stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="internacoes" name="Internações"       stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="blitz"       name="Blitz etilômetro" stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="alcool_pct"  name="Álcool (%)"        stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
