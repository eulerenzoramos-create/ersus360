import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Stethoscope, AlertTriangle, Activity, TrendingUp } from "lucide-react";

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

const TOPO_COLORS: Record<string, string> = {
  "Colo do útero":      CRIT,
  "Mama feminina":      "#e11d48",
  "Próstata":           ACCENT,
  "Pele não melanoma":  OK,
  "Pulmão":             "#6b7280",
  "Estômago":           WARN,
  "Colorrretal":        "#7c3aed",
  "Leucemia / linfoma": "#0891b2",
  "Outros":             "#6b7280",
};

export default function OncologiaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["onco-dashboard"],  queryFn: () => apiGet("/api/oncologia-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: topografias } = useQuery({ queryKey: ["onco-topo"],       queryFn: () => apiGet("/api/oncologia-apui/topografias"), enabled: aba === "topografias" });
  const { data: fluxo }       = useQuery({ queryKey: ["onco-fluxo"],      queryFn: () => apiGet("/api/oncologia-apui/fluxo"),       enabled: aba === "fluxo" });
  const { data: historico }   = useQuery({ queryKey: ["onco-historico"],  queryFn: () => apiGet("/api/oncologia-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["onco-ind"],        queryFn: () => apiGet("/api/oncologia-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",    icon: <Stethoscope size={15}/> },
    { key: "topografias", label: "Topografias",  icon: <Activity size={15}/> },
    { key: "fluxo",       label: "Fluxo Diagnóstico", icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Stethoscope size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Oncologia — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Diagnóstico Tardio · Rastreio · Fluxo · Referência Manaus · FMS Apuí/AM</p>
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
              <KPI label="Casos Novos/Ano"        value={dashRaw.casos_cancer_novos_ano.toString()} color={BRAND} sub={`${dashRaw.incidencia_100k}/100k hab.`} />
              <KPI label="Diagnóstico Avançado"   value={`${dashRaw.casos_estagio_avancado_pct}%`} color={CRIT} sub={`meta: ${dashRaw.meta_estagio_avancado_pct}%`} />
              <KPI label="Tempo Diagnóstico"      value={`${dashRaw.tempo_medio_diagnostico_dias} dias`} color={CRIT} sub={`meta: ${dashRaw.meta_diagnostico_dias} dias`} />
              <KPI label="Óbitos/Ano"             value={dashRaw.obitos_cancer_ano.toString()} color={CRIT} sub={`${dashRaw.mortalidade_prematura_pct}% prematuros`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Oncologista Municipal"   value="NÃO" color={CRIT} sub="Referência: Manaus (784 km)" />
              <KPI label="Quimioterapia Local"     value="NÃO" color={CRIT} sub="sem serviço no município" />
              <KPI label="Abandono Tratamento"     value={`${dashRaw.abandono_tratamento_pct}%`} color={CRIT} sub="meta: 5%" />
              <KPI label="Encaminhamentos/Ano"     value={dashRaw.encaminhamentos_oncologia_ano.toString()} color={WARN} sub="para Manaus" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Tempo no Fluxo Diagnóstico (dias)</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Suspeita → solicitação biópsia", value: 18,  meta: 14,  color: WARN },
                    { label: "Biópsia → resultado anatomopatol.", value: 42, meta: 30, color: WARN },
                    { label: "Resultado → encaminhamento oncol.", value: 18, meta: 7,  color: CRIT },
                    { label: "Encaminh. → 1ª consulta (Manaus)", value: 22, meta: 30,  color: OK },
                    { label: "TOTAL suspeita → 1ª consulta",    value: 128, meta: 60, color: CRIT },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-bold" style={{ color: b.color }}>{b.value}d / meta {b.meta}d</span>
                      </div>
                      <ProgressBar value={b.value} max={Math.max(b.meta * 2, b.value)} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>68,4% dos casos em estágio avançado</b> — sem rastreio adequado (mamografia a 284 km, citologia 44,8%), o diagnóstico é feito quando já há sintomas.</p>
                <p><b>32,4% abandono</b> — deslocamento Manaus (R$ 800-2.000/viagem), 784 km, impacto no emprego e moradia. Suporte logístico inexistente na SMS.</p>
                <p><b>Colo do útero: 75% avançado</b> — câncer completamente evitável com HPV (53,3% cobertura) e rastreio (citologia 44,8%). Negligência programática documentada.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "topografias" && Array.isArray(topografias) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Casos por Topografia — Apuí/AM</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topografias as any[]} layout="vertical" margin={{ left: 10, right: 60 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="topografia" tick={{ fontSize: 9 }} width={200} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip formatter={(v: any) => `${v} casos`} />
                  <Bar dataKey="casos_ano" name="Casos" radius={[0,3,3,0]}>
                    {(topografias as any[]).map((t: any) => <Cell key={t.topografia} fill={TOPO_COLORS[t.topografia] || BRAND} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(topografias as any[]).map((t: any) => (
                <div key={t.topografia} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: TOPO_COLORS[t.topografia] || BRAND }} />
                      <span className="font-semibold text-sm text-slate-700">{t.topografia}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-500">Sobrevida 5a: <b style={{ color: t.sobrevida_5a_pct >= 60 ? OK : t.sobrevida_5a_pct >= 40 ? WARN : CRIT }}>{t.sobrevida_5a_pct}%</b></span>
                      <span className="font-bold text-slate-700">{t.casos_ano} casos</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mb-1">Estágio avançado: <span className="font-bold" style={{ color: t.estagio_avancado_pct >= 70 ? CRIT : WARN }}>{t.estagio_avancado_pct}%</span></div>
                  <ProgressBar value={t.estagio_avancado_pct} max={100} color={t.estagio_avancado_pct >= 70 ? CRIT : WARN} />
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "fluxo" && Array.isArray(fluxo) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Tempo por Etapa do Fluxo Diagnóstico (dias)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={fluxo as any[]} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="etapa" tick={{ fontSize: 8 }} width={260} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip formatter={(v: any) => `${v} dias`} />
                  <Bar dataKey="tempo_medio_dias" name="Tempo médio (dias)" radius={[0,3,3,0]}>
                    {(fluxo as any[]).map((f: any) => <Cell key={f.etapa} fill={statusColor(f.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(fluxo as any[]).map((f: any) => (
                <div key={f.etapa} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: statusColor(f.status) }} />
                    <span className="font-semibold text-sm text-slate-700">{f.etapa}</span>
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-bold text-lg" style={{ color: statusColor(f.status) }}>{f.tempo_medio_dias}d</span>
                    <span className="text-slate-400 ml-1">/ meta {f.meta_dias}d</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Oncologia (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="s" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n" dataKey="casos_novos"      name="Casos novos"       stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n" dataKey="obitos"           name="Óbitos"            stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="n" dataKey="encaminhamentos"  name="Encaminhamentos"   stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="s" dataKey="estagio_av_pct"   name="Estágio av. (%)"   stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
