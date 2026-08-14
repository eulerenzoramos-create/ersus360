import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
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

const RISCO_COLORS: Record<string, string> = {
  "MÉDIO":      WARN,
  "ALTO":       CRIT,
  "MUITO ALTO": "#7f1d1d",
};

export default function MalariaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }          = useQuery({ queryKey: ["mal-dashboard"],    queryFn: () => apiGet("/api/malaria-apui/dashboard"),      enabled: aba === "dashboard" });
  const { data: estratificacao }= useQuery({ queryKey: ["mal-estrat"],       queryFn: () => apiGet("/api/malaria-apui/estratificacao"), enabled: aba === "estratificacao" });
  const { data: sazonalidade }  = useQuery({ queryKey: ["mal-sazonal"],      queryFn: () => apiGet("/api/malaria-apui/sazonalidade"),   enabled: aba === "sazonalidade" });
  const { data: indicadores }   = useQuery({ queryKey: ["mal-ind"],          queryFn: () => apiGet("/api/malaria-apui/indicadores"),    enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",      label: "Dashboard",      icon: <Droplets size={15}/> },
    { key: "estratificacao", label: "Estratificação", icon: <Activity size={15}/> },
    { key: "sazonalidade",   label: "Sazonalidade",   icon: <TrendingUp size={15}/> },
    { key: "indicadores",    label: "Indicadores",    icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Droplets size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Malária — Apuí/AM</h1>
            <p className="text-sm text-slate-500">IPA · Estratificação · Sazonalidade · Controle Vetorial · FMS Apuí/AM</p>
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
              <KPI label="IPA (casos/1k hab.)" value={dashRaw.ipa.toString()}           color={CRIT} sub={`meta eliminação: ${dashRaw.meta_ipa_eliminacao}`} />
              <KPI label="Casos/Ano"           value={dashRaw.casos_ano?.toLocaleString()} color={CRIT} sub="município grupo 3 PNCM" />
              <KPI label="P. vivax"            value={`${dashRaw.ivp_pct}%`}             color={WARN} sub={`P. falciparum: ${dashRaw.iaf_pct}%`} />
              <KPI label="Óbitos/Ano"          value={dashRaw.obitos_malaria_ano.toString()} color={CRIT} sub={`${dashRaw.casos_graves_ano} casos graves`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Casos em Gestantes" value={dashRaw.casos_gestantes_ano.toString()} color={CRIT} sub="risco de aborto e prematuridade" />
              <KPI label="Crianças < 5a"      value={dashRaw.casos_criancas_5a_ano.toString()} color={CRIT} sub="maior morbimortalidade" />
              <KPI label="Tratamento 24h"     value={`${dashRaw.tratamento_oportuno_pct}%`} color={WARN} sub={`meta: ${dashRaw.meta_tratamento_pct}%`} />
              <KPI label="Borrifação Intradom." value={`${dashRaw.borrifacao_intradomiciliar_cobertura_pct}%`} color={CRIT} sub="meta: 80%" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Controle Vetorial</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: "Tratamento oportuno (24h)", value: dashRaw.tratamento_oportuno_pct, meta: 100, color: WARN },
                    { label: "Borrifação intradomiciliar", value: dashRaw.borrifacao_intradomiciliar_cobertura_pct, meta: 80, color: CRIT },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-bold" style={{ color: b.color }}>{b.value}% / meta {b.meta}%</span>
                      </div>
                      <ProgressBar value={b.value} max={100} color={b.color} />
                    </div>
                  ))}
                  <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 mt-2">
                    <b>Mosquiteiros distribuídos:</b> {dashRaw.mosquiteiro_distribuido_ano}/ano — insuficiente para cobertura das 28 comunidades ribeirinhas
                  </div>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>IPA 51,9 — município Grupo 3 PNCM</b> (IPA &gt; 50, máximo risco). Meta de eliminação é IPA &lt; 1,0 — Apuí está 51,9× acima. O garimpo ilegal é o principal driver.</p>
                <p><b>27,6% P. falciparum</b> — espécie mais grave, causa malária cerebral. 28 casos graves e 2 óbitos em 2025. Ribeirinhos e garimpeiros são os grupos de maior risco.</p>
                <p><b>Borrifação 42,4%</b> vs meta 80% — logística fluvial precária, falta de inseticida e pessoal deixam 57,6% das residências sem proteção.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "estratificacao" && Array.isArray(estratificacao) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">IPA por Localidade — Apuí/AM</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={estratificacao as any[]} layout="vertical" margin={{ left: 10, right: 60 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="localidade" tick={{ fontSize: 9 }} width={200} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip formatter={(v: any) => `IPA ${v}`} />
                  <Bar dataKey="ipa" name="IPA" radius={[0,3,3,0]}>
                    {(estratificacao as any[]).map((e: any) => <Cell key={e.localidade} fill={RISCO_COLORS[e.risco] || WARN} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(estratificacao as any[]).map((e: any) => (
                <div key={e.localidade} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: RISCO_COLORS[e.risco] || WARN }} />
                      <span className="font-semibold text-sm text-slate-700">{e.localidade}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: RISCO_COLORS[e.risco] || WARN, color: "white" }}>{e.risco}</span>
                    </div>
                    <span className="font-bold text-slate-700">IPA {e.ipa} | {e.casos_ano} casos</span>
                  </div>
                  <div className="text-xs text-slate-500">P. vivax: {e.ivp_pct}% · P. falciparum: {e.iaf_pct}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "sazonalidade" && Array.isArray(sazonalidade) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Sazonalidade — Casos de Malária (2025)</h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={sazonalidade} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="c" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="g" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="c" dataKey="casos"  name="Total casos"  stroke={BRAND}  strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="c" dataKey="ivp"    name="P. vivax"     stroke={ACCENT} strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="c" dataKey="iaf"    name="P. falciparum"stroke={WARN}   strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
                <Line yAxisId="g" dataKey="graves" name="Graves"       stroke={CRIT}   strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
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
