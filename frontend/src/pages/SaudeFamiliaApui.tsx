import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Users, AlertTriangle, Activity, TrendingUp } from "lucide-react";

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

export default function SaudeFamiliaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["sf-dashboard"],  queryFn: () => apiGet("/api/saude-familia-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: equipes }     = useQuery({ queryKey: ["sf-equipes"],    queryFn: () => apiGet("/api/saude-familia-apui/equipes"),    enabled: aba === "equipes" });
  const { data: previne }     = useQuery({ queryKey: ["sf-previne"],    queryFn: () => apiGet("/api/saude-familia-apui/previne"),    enabled: aba === "previne" });
  const { data: historico }   = useQuery({ queryKey: ["sf-historico"],  queryFn: () => apiGet("/api/saude-familia-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["sf-ind"],        queryFn: () => apiGet("/api/saude-familia-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",       icon: <Users size={15}/> },
    { key: "equipes",      label: "Equipes ESF",     icon: <Activity size={15}/> },
    { key: "previne",      label: "Novo Financiamento APS",  icon: <AlertTriangle size={15}/> },
    { key: "historico",    label: "Histórico",       icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores",     icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Users size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde da Família — Apuí/AM</h1>
            <p className="text-sm text-slate-500">ESF · ACS · Novo Financiamento APS · Cobertura · PMAQ · FMS Apuí/AM</p>
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
              <KPI label="Equipes ESF"           value={`${dashRaw.equipes_esf_implantadas} / ${dashRaw.equipes_esf_necessarias}`} color={WARN} sub="implantadas / necessárias" />
              <KPI label="Cobertura ESF"         value={`${dashRaw.cobertura_esf_pct}%`} color={statusColor(dashRaw.status_cobertura)} sub="meta: 100%" />
              <KPI label="ACS"                   value={`${dashRaw.acs_total} / ${dashRaw.acs_necessarios}`} color={WARN} sub="ativos / necessários" />
              <KPI label="Nota Novo Financiamento APS"   value={`${dashRaw.previne_nota_geral}/10`} color={statusColor(dashRaw.status_previne)} sub={`meta: ${dashRaw.previne_meta_nota}`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Famílias Cadastradas"  value={dashRaw.familias_cadastradas.toLocaleString()} color={BRAND} />
              <KPI label="Famílias Acomp."       value={`${dashRaw.familias_acompanhadas_pct}%`} color={WARN} sub="meta: 100%" />
              <KPI label="Consultas Médicas/Mês" value={dashRaw.consultas_medicas_esf_mes.toLocaleString()} color={ACCENT} />
              <KPI label="Visitas Domiciliares"  value={dashRaw.visitas_domiciliares_mes.toLocaleString()} color={OK} sub="/mês" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cobertura e Acompanhamento</h3>
                <div className="space-y-3">
                  {[
                    { label: "Cobertura ESF",            value: dashRaw.cobertura_esf_pct,         max: 100, color: WARN },
                    { label: "Famílias acompanhadas",     value: dashRaw.familias_acompanhadas_pct, max: 100, color: WARN },
                    { label: "Equipes c/ saúde bucal",   value: (dashRaw.equipes_com_saude_bucal / dashRaw.equipes_esf_implantadas) * 100, max: 100, color: BRAND },
                    { label: "Nota Novo Financiamento APS",      value: dashRaw.previne_nota_geral * 10,   max: 100, color: statusColor(dashRaw.status_previne) },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-medium" style={{ color: b.color }}>{b.value.toFixed(1)}%</span>
                      </div>
                      <ProgressBar value={b.value} max={b.max} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex flex-col gap-2 justify-center">
                <p><b>2 equipes sem médico</b> — ESF Ramal do Acará e ESF Área Rural funcionam sem médico. ACS e enfermeira absorvem demanda, mas consultas médicas são limitadas.</p>
                <p><b>Nota Fin. APS 6,4</b> — abaixo da meta 7,0 impacta no financiamento federal (Piso da APS). Indicador mais crítico: pré-natal com odontológico (38,4% vs meta 60%).</p>
                <p><b>3 UBS sem saúde bucal</b> — gestantes sem acesso odontológico contribuem para o pior indicador do Novo Financiamento APS e para prematuridade e baixo peso ao nascer.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "equipes" && Array.isArray(equipes) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Nota Novo Financiamento APS por Equipe ESF</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={equipes as any[]} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis dataKey="equipe" tick={{ fontSize: 8 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => `${v}/10`} />
                  <Bar dataKey="previne_nota" name="Nota Fin. APS" radius={[3,3,0,0]}>
                    {(equipes as any[]).map((e: any) => <Cell key={e.equipe} fill={statusColor(e.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(equipes as any[]).map((e: any) => (
                <div key={e.equipe} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-semibold text-sm text-slate-700">{e.equipe}</span>
                      <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                        <span>{e.ubs}</span>
                        <span>{e.populacao.toLocaleString()} hab.</span>
                        <span>{e.acs} ACS</span>
                        {!e.medico && <span className="text-red-500 font-bold">SEM MÉDICO</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold" style={{ color: statusColor(e.status) }}>{e.previne_nota}</span>
                      <p className="text-xs text-slate-400">/10 Fin. APS</p>
                    </div>
                  </div>
                  <ProgressBar value={e.cobertura_pct} max={100} color={statusColor(e.status)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "previne" && Array.isArray(previne) && (
          <div className="grid gap-3">
            {(previne as any[]).map((p: any) => (
              <div key={p.indicador} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-4">
                <div className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(p.status) }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-700 text-sm">{p.indicador}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{p.parametro}</span>
                      <span className="font-bold text-sm" style={{ color: statusColor(p.status) }}>
                        {p.resultado_pct}%
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                        {p.pontuacao}/10 pts
                      </span>
                    </div>
                  </div>
                  <ProgressBar value={p.resultado_pct} max={100} color={statusColor(p.status)} />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>Resultado: {p.resultado_pct}%</span>
                    <span>Meta: {p.meta_pct}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal — Saúde da Família (Jan–Jun/2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="s" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n" dataKey="consultas_medicas" name="Consultas médicas"   stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n" dataKey="visitas_acs"       name="Visitas ACS"         stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="s" dataKey="cobertura_pct"     name="Cobertura ESF (%)"   stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="s" dataKey="previne_nota"      name="Nota Fin. APS"        stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
