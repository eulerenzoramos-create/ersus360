import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Wind, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

const PERF_COLORS: Record<string, string> = {
  "Pulmonar bacilífera":    CRIT,
  "Pulmonar não bacilífera": WARN,
  "Extrapulmonar":          ACCENT,
  "TB recidiva":            "#7c3aed",
};

export default function TuberculoseApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["tb-dashboard"],     queryFn: () => apiGet("/api/tuberculose-apui/dashboard"),     enabled: aba === "dashboard" });
  const { data: perfil }      = useQuery({ queryKey: ["tb-perfil"],        queryFn: () => apiGet("/api/tuberculose-apui/perfil"),        enabled: aba === "perfil" });
  const { data: determinantes}= useQuery({ queryKey: ["tb-determinantes"], queryFn: () => apiGet("/api/tuberculose-apui/determinantes"), enabled: aba === "determinantes" });
  const { data: historico }   = useQuery({ queryKey: ["tb-historico"],     queryFn: () => apiGet("/api/tuberculose-apui/historico"),     enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["tb-ind"],           queryFn: () => apiGet("/api/tuberculose-apui/indicadores"),   enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",     label: "Dashboard",     icon: <Wind size={15}/> },
    { key: "perfil",        label: "Perfil",        icon: <Activity size={15}/> },
    { key: "determinantes", label: "Determinantes", icon: <AlertTriangle size={15}/> },
    { key: "historico",     label: "Histórico",     icon: <TrendingUp size={15}/> },
    { key: "indicadores",   label: "Indicadores",   icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Wind size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Tuberculose — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Incidência · Cura · DOTS · Coinfecção TB-HIV · FMS Apuí/AM</p>
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
              <KPI label="Casos Novos/Ano"      value={dashRaw.casos_novos_ano.toString()}     color={CRIT} sub={`Incidência ${dashRaw.incidencia_100k}/100k`} />
              <KPI label="Taxa de Cura"         value={`${dashRaw.cura_pct}%`}                  color={statusColor(dashRaw.status_cura)} sub={`meta: ${dashRaw.meta_cura_pct}%`} />
              <KPI label="Taxa de Abandono"     value={`${dashRaw.abandono_pct}%`}              color={statusColor(dashRaw.status_abandono)} sub={`meta: ${dashRaw.meta_abandono_pct}%`} />
              <KPI label="DOTS Supervisão"      value={`${dashRaw.dots_supervisao_pct}%`}       color={statusColor(dashRaw.status_dots)} sub={`meta: ${dashRaw.meta_dots_pct}%`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Coinfecção TB-HIV"    value={`${dashRaw.casos_tb_hiv_coinfectados_pct}%`} color={CRIT} sub="dos casos novos" />
              <KPI label="Casos MDR"            value={dashRaw.casos_tb_mdr.toString()}         color={CRIT} sub="sem cultura local" />
              <KPI label="Contatos Examinados"  value={`${dashRaw.contatos_examinados_pct}%`}   color={WARN} sub={`meta: ${dashRaw.meta_contatos_pct}%`} />
              <KPI label="Cultura Disponível"   value="NÃO"                                     color={CRIT} sub="diagnóstico limitado" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Desfechos do Tratamento</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: "Taxa de cura",     value: dashRaw.cura_pct,     meta: dashRaw.meta_cura_pct,     color: statusColor(dashRaw.status_cura),     pct: dashRaw.cura_pct },
                    { label: "DOTS supervisão",  value: dashRaw.dots_supervisao_pct, meta: dashRaw.meta_dots_pct, color: statusColor(dashRaw.status_dots),  pct: dashRaw.dots_supervisao_pct },
                    { label: "Contatos exam.",   value: dashRaw.contatos_examinados_pct, meta: dashRaw.meta_contatos_pct, color: WARN, pct: dashRaw.contatos_examinados_pct },
                    { label: "LTBI em tratamento", value: dashRaw.ltbi_tratamento_pct, meta: 80, color: CRIT, pct: dashRaw.ltbi_tratamento_pct },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-bold" style={{ color: b.color }}>{b.value}% / meta {b.meta}%</span>
                      </div>
                      <ProgressBar value={b.pct} max={100} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>Incidência 89/100k — 8,9× a meta nacional</b> (meta ≤ 10/100k). Apuí está entre os municípios amazônicos de altíssima carga, influenciado por garimpo, ribeirinhos e condições socioeconômicas precárias.</p>
                <p><b>DOTS 64,2% vs meta 100%</b> — 35,8% dos pacientes sem supervisão da tomada. ACS sobrecarregados e zona rural dispersa inviabilizam o DOTS regular, resultando em 18,4% de abandono.</p>
                <p><b>1 caso MDR em 2025</b> — sem cultura local, diagnóstico de resistência demora semanas. Encaminhamento para Manaus indispensável, mas logística é barreira crítica.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "perfil" && Array.isArray(perfil) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Casos por Categoria Diagnóstica</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={perfil as any[]} margin={{ left: 10, right: 30 }}>
                  <XAxis dataKey="categoria" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip />
                  <Bar dataKey="casos" name="Casos" radius={[4,4,0,0]}>
                    {(perfil as any[]).map((p: any) => <Cell key={p.categoria} fill={PERF_COLORS[p.categoria] || BRAND} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(perfil as any[]).map((p: any) => (
                <div key={p.categoria} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: PERF_COLORS[p.categoria] || BRAND }} />
                      <span className="font-semibold text-sm text-slate-700">{p.categoria}</span>
                    </div>
                    <span className="font-bold text-slate-700">{p.casos} casos ({p.pct}%)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs mt-2">
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-slate-500">Taxa de cura</span>
                        <span className="font-bold" style={{ color: p.cura_pct >= 85 ? OK : p.cura_pct >= 70 ? WARN : CRIT }}>{p.cura_pct}%</span>
                      </div>
                      <ProgressBar value={p.cura_pct} max={100} color={p.cura_pct >= 85 ? OK : p.cura_pct >= 70 ? WARN : CRIT} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-slate-500">Abandono</span>
                        <span className="font-bold" style={{ color: p.abandono_pct <= 5 ? OK : p.abandono_pct <= 15 ? WARN : CRIT }}>{p.abandono_pct}%</span>
                      </div>
                      <ProgressBar value={p.abandono_pct} max={30} color={p.abandono_pct <= 5 ? OK : p.abandono_pct <= 15 ? WARN : CRIT} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "determinantes" && Array.isArray(determinantes) && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Fatores de Risco / Determinantes Sociais</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={determinantes as any[]} layout="vertical" margin={{ left: 10, right: 60 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
                  <YAxis type="category" dataKey="fator" tick={{ fontSize: 9 }} width={200} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="prevalencia_pct" name="Prevalência (%)" radius={[0,3,3,0]}>
                    {(determinantes as any[]).map((d: any) => <Cell key={d.fator} fill={statusColor(d.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {(determinantes as any[]).map((d: any) => (
              <div key={d.fator} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-start gap-3">
                <div className="mt-1.5 w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(d.status) }} />
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm text-slate-700">{d.fator}</span>
                    <span className="font-bold text-sm" style={{ color: statusColor(d.status) }}>{d.prevalencia_pct}%</span>
                  </div>
                  <p className="text-xs text-slate-500">{d.impacto}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Tuberculose (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="s" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n" dataKey="casos_novos"    name="Casos novos"  stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="s" dataKey="cura_pct"       name="Cura (%)"     stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="s" dataKey="abandono_pct"   name="Abandono (%)" stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="s" dataKey="coinfec_hiv_pct"name="TB-HIV (%)"   stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
