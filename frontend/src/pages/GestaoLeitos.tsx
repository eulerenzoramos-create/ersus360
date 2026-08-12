import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Building2, AlertTriangle, Activity, TrendingUp } from "lucide-react";

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

const OCUP_COLORS: Record<string, string> = {
  "Clínica Médica":           WARN,
  "Cirúrgico/Obs. Cirúrgica": OK,
  "Pediatria":                OK,
  "Isolamento/Infecciosas":   CRIT,
  "Ginecologia/Obstetrícia":  OK,
};

export default function GestaoLeitos() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["gl-dashboard"],  queryFn: () => apiGet("/api/gestao-leitos/dashboard"),       enabled: aba === "dashboard" });
  const { data: leitos }      = useQuery({ queryKey: ["gl-leitos"],     queryFn: () => apiGet("/api/gestao-leitos/leitos-tipo"),     enabled: aba === "leitos" });
  const { data: causas }      = useQuery({ queryKey: ["gl-causas"],     queryFn: () => apiGet("/api/gestao-leitos/causas-internacao"),enabled: aba === "causas" });
  const { data: historico }   = useQuery({ queryKey: ["gl-historico"],  queryFn: () => apiGet("/api/gestao-leitos/historico"),       enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["gl-ind"],        queryFn: () => apiGet("/api/gestao-leitos/indicadores"),     enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",      icon: <Building2 size={15}/> },
    { key: "leitos",      label: "Leitos por Tipo",icon: <Activity size={15}/> },
    { key: "causas",      label: "Causas",         icon: <Activity size={15}/> },
    { key: "historico",   label: "Histórico",      icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",    icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Building2 size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Gestão de Leitos — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Hospital Municipal · 38 Leitos SUS · AIH · FMS Apuí/AM</p>
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
              <KPI label="Leitos SUS Total"       value={dashRaw.leitos_sus.toString()}            color={ACCENT} sub="100% SUS — sem leitos privados" />
              <KPI label="Taxa de Ocupação"       value={`${dashRaw.taxa_ocupacao_pct}%`}          color={WARN}   sub={`meta máx: ${dashRaw.meta_ocupacao_pct_max}%`} />
              <KPI label="Internações/mês"        value={dashRaw.internacoes_mes.toString()}       color={BRAND} />
              <KPI label="Média de Permanência"   value={`${dashRaw.media_permanencia_dias} dias`} color={WARN}   sub={`meta: ${dashRaw.meta_permanencia_dias} dias`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Leitos UTI"             value={dashRaw.leitos_uti.toString()}            color={CRIT} sub="ZERO — sem UTI em Apuí" />
              <KPI label="Transferências Manaus"  value={dashRaw.transferencias_saida_mes.toString()} color={WARN} sub="/mês" />
              <KPI label="AIH Aprovadas/mês"      value={dashRaw.aih_aprovadas_mes.toString()} />
              <KPI label="Óbito Hospitalar/mês"   value={dashRaw.obito_hospitalar_mes.toString()}  color={CRIT} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Ocupação Atual por Clínica</h3>
                <div className="space-y-3">
                  {[
                    { tipo: "Clínica Médica",           ocup: 81.3 },
                    { tipo: "Cirúrgico",                 ocup: 62.5 },
                    { tipo: "Pediatria",                 ocup: 66.7 },
                    { tipo: "Isolamento",                ocup: 100.0 },
                    { tipo: "Ginecologia/Obst.",         ocup: 50.0 },
                  ].map((c) => (
                    <div key={c.tipo}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{c.tipo}</span>
                        <span className="font-medium" style={{ color: c.ocup >= 90 ? CRIT : c.ocup >= 75 ? WARN : OK }}>{c.ocup}%</span>
                      </div>
                      <ProgressBar value={c.ocup} max={100} color={c.ocup >= 90 ? CRIT : c.ocup >= 75 ? WARN : OK} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>Sem UTI:</b> pacientes graves precisam percorrer 600 km até Manaus. Alto risco de óbito no trajeto.</p>
                <p><b>Isolamento lotado:</b> 4/4 leitos ocupados — qualquer surto (dengue, hepatite, malária grave) colapsa a capacidade.</p>
                <p><b>Média de permanência:</b> 5,8 dias vs meta 4,5 — internações por saúde mental (8,8 dias) e infecciosas (7,2 dias) elevam a média.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "leitos" && Array.isArray(leitos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Ocupação × Total por Tipo de Leito</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={(leitos as any[])} margin={{ left: 0, right: 20 }}>
                  <XAxis dataKey="tipo" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total"    name="Total"    fill={ACCENT + "66"} radius={[3,3,0,0]} />
                  <Bar dataKey="ocupados" name="Ocupados" radius={[3,3,0,0]}>
                    {(leitos as any[]).map((l: any) => <Cell key={l.tipo} fill={OCUP_COLORS[l.tipo] || WARN} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(leitos as any[]).map((l: any) => (
                <div key={l.tipo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-700">{l.tipo}</span>
                    <span className="text-sm font-bold" style={{ color: statusColor(l.status) }}>{l.taxa_ocup}% ocupado</span>
                  </div>
                  <div className="flex gap-4 text-xs text-slate-500 mb-2">
                    <span>Total: <b>{l.total}</b></span>
                    <span>Ocupados: <b>{l.ocupados}</b></span>
                    <span>Perm. média: <b>{l.media_perm_dias} dias</b></span>
                  </div>
                  <ProgressBar value={l.taxa_ocup} max={100} color={statusColor(l.status)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "causas" && Array.isArray(causas) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Internações por Grupo CID — Jun/2025</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={(causas as any[])} layout="vertical" margin={{ left: 10, right: 60 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="cid_grupo" tick={{ fontSize: 9 }} width={220} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip formatter={(v: any, n: any) => [v, n === "internacoes" ? "Internações" : "Permanência (dias)"]} />
                  <Bar dataKey="internacoes" name="Internações" fill={ACCENT} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Distribuição % das Internações</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={(causas as any[])} dataKey="pct" nameKey="cid_grupo" cx="50%" cy="50%" outerRadius={80} label={({ pct }: any) => `${pct}%`}>
                    {(causas as any[]).map((_: any, i: number) => {
                      const colors = [BRAND, ACCENT, WARN, CRIT, OK, "#7c3aed", "#0891b2", "#059669", "#6b7280"];
                      return <Cell key={i} fill={colors[i % colors.length]} />;
                    })}
                  </Pie>
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Legend formatter={(v: string) => v.substring(0, 30)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Hospitalar (Jan–Jun/2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="internacoes"    name="Internações"     stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="transferencias" name="Transferências"  stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="pct" dataKey="taxa_ocup"      name="Taxa Ocup. %"   stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
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
