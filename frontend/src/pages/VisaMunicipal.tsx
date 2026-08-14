import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { ShieldCheck, AlertTriangle, Search, TrendingUp } from "lucide-react";

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

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  "em_apuracao": { bg: "#fef3c7", text: "#92400e", label: "Em apuração" },
  "resolvido":   { bg: "#dcfce7", text: "#166534", label: "Resolvido" },
  "concluido":   { bg: "#dcfce7", text: "#166534", label: "Concluído" },
};

export default function VisaMunicipal() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["visa-dashboard"],   queryFn: () => apiGet("/api/visa-municipal/dashboard"),        enabled: aba === "dashboard" });
  const { data: estab }       = useQuery({ queryKey: ["visa-estab"],       queryFn: () => apiGet("/api/visa-municipal/estabelecimentos"),  enabled: aba === "estabelecimentos" });
  const { data: inspecoes }   = useQuery({ queryKey: ["visa-insp"],        queryFn: () => apiGet("/api/visa-municipal/inspecoes"),         enabled: aba === "inspecoes" });
  const { data: alertas }     = useQuery({ queryKey: ["visa-alertas"],     queryFn: () => apiGet("/api/visa-municipal/alertas-produtos"),  enabled: aba === "alertas" });
  const { data: indicadores } = useQuery({ queryKey: ["visa-ind"],         queryFn: () => apiGet("/api/visa-municipal/indicadores"),       enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",       label: "Dashboard",        icon: <ShieldCheck size={15}/> },
    { key: "estabelecimentos",label: "Estabelecimentos", icon: <Search size={15}/> },
    { key: "inspecoes",       label: "Inspeções",        icon: <TrendingUp size={15}/> },
    { key: "alertas",         label: "Alertas / Produtos",icon: <AlertTriangle size={15}/> },
    { key: "indicadores",     label: "Indicadores",      icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <ShieldCheck size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Vigilância Sanitária Municipal — Apuí/AM</h1>
            <p className="text-sm text-slate-500">VISA · Inspeções · Licença Sanitária · Alertas ANVISA · FMS Apuí/AM</p>
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
              <KPI label="Estabelecimentos Cadastrados" value={dashRaw.estabelecimentos_cadastrados.toString()} color={ACCENT} />
              <KPI label="Regulares"                    value={dashRaw.estabelecimentos_regulares.toString()} color={OK} sub={`${((dashRaw.estabelecimentos_regulares/dashRaw.estabelecimentos_cadastrados)*100).toFixed(1)}%`} />
              <KPI label="Irregulares"                  value={dashRaw.estabelecimentos_irregulares.toString()} color={WARN} />
              <KPI label="Sem Licença Sanitária"        value={dashRaw.estabelecimentos_sem_licenca.toString()} color={CRIT} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Inspeções Realizadas/Ano"     value={`${dashRaw.inspecoes_realizadas_ano}/${dashRaw.meta_inspecoes_ano}`} color={WARN} sub="meta anual" />
              <KPI label="Cobertura Inspeção"           value={`${dashRaw.cobertura_inspecao_pct}%`} color={WARN} sub="meta: 100%" />
              <KPI label="Autos de Infração/Ano"        value={dashRaw.autos_infracao_ano.toString()} />
              <KPI label="Interdições/Ano"              value={dashRaw.interdictions_ano.toString()} color={CRIT} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Situação dos Estabelecimentos</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={[
                      { name: "Regulares",     value: dashRaw.estabelecimentos_regulares,   fill: OK },
                      { name: "Irregulares",   value: dashRaw.estabelecimentos_irregulares, fill: WARN },
                      { name: "Sem Licença",   value: dashRaw.estabelecimentos_sem_licenca, fill: CRIT },
                    ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }: any) => `${name}: ${value}`}>
                      {[OK, WARN, CRIT].map((c) => <Cell key={c} fill={c} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Amostras / Multas</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">Amostras coletadas/ano</span>
                    <span className="font-bold">{dashRaw.amostras_coletadas_ano}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                    <span className="text-sm text-slate-600">Amostras irregulares</span>
                    <span className="font-bold text-amber-700">{dashRaw.amostras_irregulares_pct}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">Multas aplicadas</span>
                    <span className="font-bold">R$ {dashRaw.multas_valor_r?.toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">Reclamações ouvidoria</span>
                    <span className="font-bold">{dashRaw.reclamacoes_ouvidoria_ano}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {aba === "estabelecimentos" && Array.isArray(estab) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Estabelecimentos por Tipo — Regularidade</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={(estab as any[])} margin={{ left: 0, right: 20 }}>
                  <XAxis dataKey="tipo" tick={{ fontSize: 8 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="regulares"    name="Regulares"    fill={OK}   stackId="a" radius={[0,0,0,0]} />
                  <Bar dataKey="irregulares"  name="Irregulares"  fill={WARN} stackId="a" />
                  <Bar dataKey="sem_licenca"  name="Sem Licença"  fill={CRIT} stackId="a" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(estab as any[]).map((e: any) => (
                <div key={e.tipo} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-semibold text-sm text-slate-700">{e.tipo}</span>
                      <span className="ml-2 text-xs px-2 py-0.5 rounded" style={{ background: "#111827", color: "#475569" }}>Risco {e.risco}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{ background: statusColor(e.status) + "22", color: statusColor(e.status) }}>
                      {e.irregulares + e.sem_licenca} irregulares
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-slate-500 mb-2">
                    <span>Total: <b>{e.total}</b></span>
                    <span>Regulares: <b className="text-green-600">{e.regulares}</b></span>
                    <span>Irregulares: <b className="text-amber-600">{e.irregulares}</b></span>
                    <span>Sem licença: <b className="text-red-600">{e.sem_licenca}</b></span>
                  </div>
                  <ProgressBar value={e.regulares} max={e.total} color={statusColor(e.status)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "inspecoes" && Array.isArray(inspecoes) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Inspeções Realizadas vs. Meta (Jan–Jun/2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={inspecoes} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="a"   orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="n" dataKey="realizadas"     name="Inspeções realizadas" stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n" dataKey="meta"           name="Meta"                 stroke="#6b7280" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                <Line yAxisId="n" dataKey="irregularidades"name="Irregularidades"      stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="a" dataKey="autos"          name="Autos de infração"   stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {aba === "alertas" && Array.isArray(alertas) && (
          <div className="grid gap-3">
            {(alertas as any[]).map((a: any, i: number) => {
              const badge = STATUS_BADGE[a.status] || { bg: "#111827", text: "#475569", label: a.status };
              return (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-4">
                  <div className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: a.risco === "alto" ? CRIT : WARN }} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-700 text-sm">{a.produto}</span>
                      <span className="text-xs px-2 py-0.5 rounded flex-shrink-0" style={{ background: badge.bg, color: badge.text }}>{badge.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Ação: {a.acao}</p>
                    <span className="text-xs mt-1 inline-block px-2 py-0.5 rounded" style={{ background: a.risco === "alto" ? "#fee2e2" : "#fef3c7", color: a.risco === "alto" ? CRIT : WARN }}>
                      Risco {a.risco}
                    </span>
                  </div>
                </div>
              );
            })}
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
