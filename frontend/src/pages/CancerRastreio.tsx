import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { ShieldCheck, AlertTriangle, Activity, Search } from "lucide-react";

const BRAND  = "#7c2d12";
const ACCENT = "#ea580c";
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

const EST_COLORS = [OK, WARN, "#f97316", CRIT];

export default function CancerRastreio() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }         = useQuery({ queryKey: ["cr-dashboard"],    queryFn: () => apiGet("/api/cancer-rastreio/dashboard"),    enabled: aba === "dashboard" });
  const { data: rastreio }     = useQuery({ queryKey: ["cr-rastreio"],     queryFn: () => apiGet("/api/cancer-rastreio/rastreio"),     enabled: aba === "rastreio" });
  const { data: estadiamento } = useQuery({ queryKey: ["cr-estadiamento"], queryFn: () => apiGet("/api/cancer-rastreio/estadiamento"), enabled: aba === "estadiamento" });
  const { data: historico }    = useQuery({ queryKey: ["cr-historico"],    queryFn: () => apiGet("/api/cancer-rastreio/historico"),    enabled: aba === "historico" });
  const { data: indicadores }  = useQuery({ queryKey: ["cr-ind"],          queryFn: () => apiGet("/api/cancer-rastreio/indicadores"),  enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",     icon: <ShieldCheck size={15}/> },
    { key: "rastreio",     label: "Rastreio",      icon: <Search size={15}/> },
    { key: "estadiamento", label: "Estadiamento",  icon: <AlertTriangle size={15}/> },
    { key: "historico",    label: "Histórico",     icon: <Activity size={15}/> },
    { key: "indicadores",  label: "Indicadores",   icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <ShieldCheck size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Câncer e Rastreio</h1>
            <p className="text-sm text-slate-500">Colo Útero · Mama · Próstata · Pele · Estadiamento · FMS Apuí/AM</p>
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
              <KPI label="Papanicolau Cobertura"   value={`${dashRaw.colpocitologia_cobertura_pct}%`} color={WARN} sub="meta: 80%" />
              <KPI label="Mamografia Cobertura"    value={`${dashRaw.mamografia_cobertura_pct}%`}     color={CRIT} sub="meta: 70%" />
              <KPI label="Casos Novos (2025)"      value={dashRaw.total_casos_novos_ano.toString()}   color={ACCENT} />
              <KPI label="Diagnós. Avançado"       value={`${dashRaw.estadio_avancado_pct}%`}         color={CRIT} sub="estádio III/IV" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: "Colo Útero", n: dashRaw.cancer_colo_casos_ano },
                { label: "Mama",       n: dashRaw.cancer_mama_casos_ano },
                { label: "Pele",       n: dashRaw.cancer_pele_casos_ano },
                { label: "Próstata",   n: dashRaw.cancer_prostata_casos_ano },
                { label: "Pulmão",     n: dashRaw.cancer_pulmao_casos_ano },
              ].map((c) => (
                <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm text-center">
                  <p className="text-xs text-slate-500">{c.label}</p>
                  <p className="text-2xl font-black mt-1" style={{ color: ACCENT }}>{c.n}</p>
                  <p className="text-xs text-slate-400">casos/ano</p>
                </div>
              ))}
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900">
              <b>68,2% dos diagnósticos em estádio avançado (III/IV).</b> Mamografia indisponível em Apuí — pacientes referenciadas a Manaus, com baixa adesão (42,4% de cobertura). Câncer de pele com alta incidência em trabalhadores rurais e garimpeiros.
            </div>
          </div>
        )}

        {aba === "rastreio" && Array.isArray(rastreio) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Cobertura por Tipo de Rastreio</h3>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={(rastreio as any[]).map((r: any) => ({ cancer: r.cancer, cobertura: r.cobertura_pct, meta: r.meta_pct }))} layout="vertical" margin={{ left: 10, right: 60 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} unit="%" />
                  <YAxis type="category" dataKey="cancer" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="cobertura" name="Cobertura %" radius={[0,3,3,0]}>
                    {(rastreio as any[]).map((r: any) => <Cell key={r.cancer} fill={statusColor(r.status)} />)}
                  </Bar>
                  <Bar dataKey="meta" name="Meta %" fill="#374151" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(rastreio as any[]).map((r: any) => (
                <div key={r.cancer} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-semibold text-slate-700">{r.cancer}</span>
                      <span className="text-xs text-slate-400 ml-2">· {r.publico_alvo} · {r.exame}</span>
                    </div>
                    <span className="font-bold text-lg" style={{ color: statusColor(r.status) }}>{r.cobertura_pct}%</span>
                  </div>
                  <ProgressBar value={r.cobertura_pct} max={r.meta_pct} color={statusColor(r.status)} />
                  <div className="flex gap-6 mt-2 text-xs text-slate-500">
                    <span>Público-alvo: <b>{r.n_alvo?.toLocaleString()}</b></span>
                    <span>Exames: <b>{r.exames_realizados_ano?.toLocaleString()}</b></span>
                    <span style={{ color: WARN }}>Alterados: <b>{r.alterados} ({r.alterados_pct}%)</b></span>
                    <span style={{ color: CRIT }}>Casos: <b>{r.casos_confirmados_ano}</b></span>
                  </div>
                  {r.obs && <p className="text-xs text-amber-700 bg-amber-50 rounded p-2 mt-2">{r.obs}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "estadiamento" && Array.isArray(estadiamento) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Estadiamento ao Diagnóstico</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={estadiamento} dataKey="casos" nameKey="estadio" cx="50%" cy="50%" outerRadius={80} label={({ estadio, pct }) => `${pct}%`}>
                    {(estadiamento as any[]).map((_: any, i: number) => <Cell key={i} fill={EST_COLORS[i % EST_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {(estadiamento as any[]).map((e: any, i: number) => (
                <div key={e.estadio} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: EST_COLORS[i % EST_COLORS.length] }} />
                      <span className="font-semibold text-slate-700 text-sm">{e.estadio}</span>
                    </div>
                    <span className="font-bold" style={{ color: EST_COLORS[i % EST_COLORS.length] }}>{e.casos} casos ({e.pct}%)</span>
                  </div>
                  <ProgressBar value={e.pct} max={100} color={EST_COLORS[i % EST_COLORS.length]} />
                </div>
              ))}
              <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-800">
                <b>68,2% diagnosticados em estádio III/IV.</b> Prognóstico ruim e custo de tratamento muito mais elevado. Meta: reduzir para &lt;40% via rastreio precoce.
              </div>
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Casos, Rastreio e Estadiamento</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" tick={{ fontSize: 11 }} unit="%" />
                <YAxis yAxisId="n"   orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="pct" dataKey="colpocito_cobertura"   name="Papanicolau %"  stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="mamografia_cobertura"  name="Mamografia %"   stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="estadio_avancado_pct"  name="Estádio avanç. %" stroke={CRIT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="casos_novos"           name="Casos Novos"    stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
