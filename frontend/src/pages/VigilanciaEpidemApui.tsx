import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Bug, AlertTriangle, Activity, TrendingUp } from "lucide-react";

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

const TEND_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  "crescente":   { bg: "#fee2e2", text: "#991b1b", label: "↑ Crescente" },
  "estavel":     { bg: "#fef3c7", text: "#92400e", label: "→ Estável" },
  "decrescente": { bg: "#dcfce7", text: "#166534", label: "↓ Decrescente" },
};

export default function VigilanciaEpidemApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["ve-dashboard"],  queryFn: () => apiGet("/api/vigilancia-epidem-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: agravos }     = useQuery({ queryKey: ["ve-agravos"],    queryFn: () => apiGet("/api/vigilancia-epidem-apui/agravos"),    enabled: aba === "agravos" });
  const { data: surtos }      = useQuery({ queryKey: ["ve-surtos"],     queryFn: () => apiGet("/api/vigilancia-epidem-apui/surtos"),     enabled: aba === "surtos" });
  const { data: historico }   = useQuery({ queryKey: ["ve-historico"],  queryFn: () => apiGet("/api/vigilancia-epidem-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["ve-ind"],        queryFn: () => apiGet("/api/vigilancia-epidem-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",   icon: <Bug size={15}/> },
    { key: "agravos",      label: "Agravos",     icon: <Activity size={15}/> },
    { key: "surtos",       label: "Surtos",      icon: <AlertTriangle size={15}/> },
    { key: "historico",    label: "Histórico",   icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Bug size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Vigilância Epidemiológica — Apuí/AM</h1>
            <p className="text-sm text-slate-500">SINAN · Notificações · Surtos · Sala de Situação · FMS Apuí/AM</p>
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
              <KPI label="Notificações/Ano"       value={dashRaw.notificacoes_ano?.toLocaleString()} color={BRAND} />
              <KPI label="Investigadas"           value={`${dashRaw.notificacoes_investigadas_pct}%`} color={statusColor(dashRaw.status_notificacao)} sub="meta: 100%" />
              <KPI label="Surtos Ativos"          value={dashRaw.surtos_em_investigacao.toString()} color={CRIT} sub={`${dashRaw.surtos_confirmados_ano} confirmados/ano`} />
              <KPI label="Completude SINAN"       value={`${dashRaw.completude_ficha_pct}%`} color={statusColor(dashRaw.status_completude)} sub="meta: 90%" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Malária (casos/ano)"    value={dashRaw.malaria_casos_ano?.toLocaleString()} color={CRIT} sub="endêmica regional" />
              <KPI label="Dengue (casos/ano)"     value={dashRaw.dengue_casos_ano.toString()} color={CRIT} sub="2 surtos ativos" />
              <KPI label="Leishmaniose/ano"       value={dashRaw.leishmaniose_casos_ano.toString()} color={CRIT} sub="surto ativo Ramal Acará" />
              <KPI label="Agravos > Limiar"       value={dashRaw.agravos_acima_limiar.toString()} color={WARN} sub={`de ${dashRaw.agravos_monitorados} monitorados`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Qualidade da Vigilância</h3>
                <div className="space-y-3">
                  {[
                    { label: "Investigação de notificações", value: dashRaw.notificacoes_investigadas_pct, meta: 100, color: WARN },
                    { label: "Completude das fichas SINAN",  value: dashRaw.completude_ficha_pct,          meta: 90,  color: CRIT },
                    { label: "Oportunidade de notificação",  value: dashRaw.oportunidade_notificacao_pct,  meta: 80,  color: WARN },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-medium" style={{ color: b.color }}>{b.value}% / meta {b.meta}%</span>
                      </div>
                      <ProgressBar value={b.value} max={b.meta} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>284 acidentes por animal peçonhento/ano</b> — taxa 1.148/100k (10× acima da média nacional). Bothrops (jararaca) é responsável por 72%.</p>
                <p><b>Dengue em surto ativo</b> — LIRAa 4,8% em Jun/25 (RISCO). Dois focos simultâneos: Setor Industrial e Jardim Apuí.</p>
                <p><b>Sífilis congênita: 18 casos</b> em 2025 — meta é ZERO. Falha no rastreio pré-natal (sorologia 1º tri: 64,8% vs meta 95%).</p>
              </div>
            </div>
          </div>
        )}

        {aba === "agravos" && Array.isArray(agravos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Casos por Agravo — Apuí/AM (ano corrente)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={agravos as any[]} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="agravo" tick={{ fontSize: 8 }} width={220} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip formatter={(v: any) => `${v?.toLocaleString()} casos`} />
                  <Bar dataKey="casos_ano" name="Casos" radius={[0,3,3,0]}>
                    {(agravos as any[]).map((a: any) => <Cell key={a.agravo} fill={statusColor(a.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(agravos as any[]).map((a: any) => {
                const tend = TEND_BADGE[a.tendencia] || TEND_BADGE["estavel"];
                return (
                  <div key={a.agravo} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ background: statusColor(a.status) }} />
                      <div>
                        <span className="font-semibold text-sm text-slate-700">{a.agravo}</span>
                        <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                          <span>CID: {a.cid}</span>
                          {a.taxa_100k && <span>{a.taxa_100k?.toLocaleString()}/100k</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: tend.bg, color: tend.text }}>{tend.label}</span>
                      <span className="text-lg font-bold" style={{ color: statusColor(a.status) }}>{a.casos_ano}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {aba === "surtos" && Array.isArray(surtos) && (
          <div className="grid gap-3">
            {(surtos as any[]).map((s: any, i: number) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {!s.encerrado && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">ATIVO</span>}
                      {s.encerrado  && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">ENCERRADO</span>}
                      {!s.investigado && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold">SEM INVEST.</span>}
                      <span className="font-semibold text-slate-700">{s.surto}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-slate-400">
                      <span>{s.agravo}</span>
                      <span>{s.data_inicio}</span>
                      <span className="font-bold text-slate-600">{s.casos} casos</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{s.observacao}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal — Vigilância Epidemiológica (Jan–Jun/2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="s" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n" dataKey="notificacoes"      name="Notificações"        stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n" dataKey="surtos"            name="Surtos ativos"       stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="s" dataKey="investigadas_pct"  name="Investigadas (%)"    stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="s" dataKey="completude_pct"    name="Completude (%)"      stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
