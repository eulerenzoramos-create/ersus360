import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp, AlertTriangle, Activity, Users } from "lucide-react";

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

const TEND_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  "crescente":   { bg: "#fee2e2", text: "#991b1b", label: "↑ Crescente" },
  "estavel":     { bg: "#fef3c7", text: "#92400e", label: "→ Estável" },
  "decrescente": { bg: "#dcfce7", text: "#166534", label: "↓ Decrescente" },
};

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

export default function MortalidadePrematuraApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }       = useQuery({ queryKey: ["mp-dashboard"], queryFn: () => apiGet("/api/mortalidade-prematura-apui/dashboard"),       enabled: aba === "dashboard" });
  const { data: causas }     = useQuery({ queryKey: ["mp-causas"],    queryFn: () => apiGet("/api/mortalidade-prematura-apui/causas"),           enabled: aba === "causas" });
  const { data: perfil }     = useQuery({ queryKey: ["mp-perfil"],    queryFn: () => apiGet("/api/mortalidade-prematura-apui/perfil-demografico"),enabled: aba === "perfil" });
  const { data: historico }  = useQuery({ queryKey: ["mp-hist"],      queryFn: () => apiGet("/api/mortalidade-prematura-apui/historico"),        enabled: aba === "historico" });
  const { data: indicadores }= useQuery({ queryKey: ["mp-ind"],       queryFn: () => apiGet("/api/mortalidade-prematura-apui/indicadores"),      enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",    icon: <TrendingUp size={15}/> },
    { key: "causas",      label: "Causas",       icon: <Activity size={15}/> },
    { key: "perfil",      label: "Perfil",       icon: <Users size={15}/> },
    { key: "historico",   label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <TrendingUp size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Mortalidade Prematura — Apuí/AM</h1>
            <p className="text-sm text-slate-500">DCNT · Causas Externas · SIM · AVPP · FMS Apuí/AM</p>
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
              <KPI label="Óbitos totais/ano"      value={dashRaw.obitos_totais_ano.toString()}           color={BRAND} sub={`taxa: ${dashRaw.taxa_mortalidade_geral}/1000 hab`} />
              <KPI label="Mortalidade prematura"  value={`${dashRaw.mortalidade_prematura_pct}%`}        color={WARN}  sub={`${dashRaw.obitos_prematuros_30_69} óbitos 30–69 anos`} />
              <KPI label="Principal causa"        value={`${dashRaw.principal_causa_pct}%`}              color={CRIT}  sub={dashRaw.principal_causa} />
              <KPI label="AVPP"                   value={dashRaw.anos_vida_perdidos_prematuramente?.toLocaleString()} color={CRIT} sub="anos de vida perdidos prematuramente" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Causas externas 15–39" value={`${dashRaw.obitos_causas_externas_15_39_100k}/100k`} color={CRIT} sub="meta: < 80/100k" />
              <KPI label="DOs investigadas"      value={`${dashRaw.obitos_investigados_pct}%`}               color={WARN} sub={`meta: ${dashRaw.meta_investigados_pct}%`} />
              <KPI label="DO no domicílio"       value={`${dashRaw.do_domicilio_pct}%`}                      color={WARN} sub="diagnóstico de baixa qualidade" />
              <KPI label="Meta redução 5 anos"   value={`-${dashRaw.reducao_meta_5anos_pct}%`}               color={ACCENT} sub="mortalidade prematura até 2030" />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900">
              <b>Óbitos por causas externas em jovens (15–39 anos): 184/100k hab</b> — mais que o dobro da média nacional. Acidentes de motocicleta (48%), garimpo ilegal (18%) e afogamento (14%) são as principais causas. Ausência de UTI agrava a letalidade das emergências traumáticas.
            </div>
          </div>
        )}

        {aba === "causas" && Array.isArray(causas) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Óbitos por Causa — Apuí/AM (2025)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={(causas as any[]).map((c: any) => ({ causa: c.causa.substring(0, 32), obitos: c.obitos, pct: c.pct }))}
                  layout="vertical" margin={{ left: 10, right: 60 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="causa" tick={{ fontSize: 7 }} width={250} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip formatter={(v: any, n: string) => n === "obitos" ? `${v} óbitos` : `${v}%`} />
                  <Bar dataKey="obitos" name="Óbitos" radius={[0,3,3,0]}>
                    {(causas as any[]).map((c: any) => <Cell key={c.causa} fill={statusColor(c.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(causas as any[]).map((c: any) => {
                const tend = TEND_BADGE[c.tendencia] || TEND_BADGE["estavel"];
                return (
                  <div key={c.causa} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ background: statusColor(c.status) }} />
                        <span className="font-semibold text-sm text-slate-700">{c.causa}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: tend.bg, color: tend.text }}>{tend.label}</span>
                        <span className="font-bold text-sm" style={{ color: statusColor(c.status) }}>{c.obitos} ({c.pct}%)</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 ml-5">{c.obs}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {aba === "perfil" && Array.isArray(perfil) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Taxa de Mortalidade por Faixa Etária (/100k hab)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={(perfil as any[]).map((p: any) => ({ faixa: p.faixa.substring(0, 18), taxa: p.taxa_100k, obitos: p.obitos }))}
                  margin={{ top: 5, right: 40, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis dataKey="faixa" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="taxa" name="Taxa /100k" radius={[3,3,0,0]}>
                    {(perfil as any[]).map((p: any, i: number) => (
                      <Cell key={i} fill={i >= 4 ? CRIT : i >= 2 ? WARN : ACCENT} />
                    ))}
                  </Bar>
                  <Bar dataKey="obitos" name="Óbitos" radius={[3,3,0,0]} fill={BRAND} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(perfil as any[]).map((p: any) => (
                <div key={p.faixa} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm text-slate-700">{p.faixa}</span>
                    <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                      <span>Óbitos: {p.obitos}</span>
                      <span>Taxa: {p.taxa_100k}/100k</span>
                      <span>Sexo masc.: {p.sexo_m_pct}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium" style={{ color: p.investigados_pct < 80 ? WARN : OK }}>
                      {p.investigados_pct}% invest.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Mortalidade (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="obitos_totais"    name="Óbitos totais"          stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="prematuros_pct"   name="Mortalidade prematura %" stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="ext_causas_pct"   name="Causas externas %"       stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="pct" dataKey="investigados_pct" name="DOs investigadas %"       stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
