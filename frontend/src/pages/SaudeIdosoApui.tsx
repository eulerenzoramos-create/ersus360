import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { UserCheck, AlertTriangle, Activity, TrendingUp } from "lucide-react";

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

export default function SaudeIdosoApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["si-dashboard"],  queryFn: () => apiGet("/api/saude-idoso-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: condicoes }   = useQuery({ queryKey: ["si-cond"],       queryFn: () => apiGet("/api/saude-idoso-apui/condicoes"),  enabled: aba === "condicoes" });
  const { data: riscos }      = useQuery({ queryKey: ["si-riscos"],     queryFn: () => apiGet("/api/saude-idoso-apui/riscos"),     enabled: aba === "riscos" });
  const { data: historico }   = useQuery({ queryKey: ["si-historico"],  queryFn: () => apiGet("/api/saude-idoso-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["si-ind"],        queryFn: () => apiGet("/api/saude-idoso-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",      icon: <UserCheck size={15}/> },
    { key: "condicoes",  label: "Condições",       icon: <Activity size={15}/> },
    { key: "riscos",     label: "Riscos",          icon: <AlertTriangle size={15}/> },
    { key: "historico",  label: "Histórico",      icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores",    icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <UserCheck size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde do Idoso — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Caderneta do Idoso · Avaliação Funcional · ILPI · Quedas · Polifarmácia · FMS Apuí/AM</p>
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
              <KPI label="Pop. Idosa (≥ 60a)"     value={dashRaw.populacao_idosa_estimada.toLocaleString()} color={BRAND} sub={`${dashRaw.pct_populacao_total}% da população`} />
              <KPI label="Cadastrados ESF"         value={`${dashRaw.cobertura_cadastro_pct}%`} color={WARN} sub={`${dashRaw.idosos_cadastrados_esf.toLocaleString()} idosos`} />
              <KPI label="Avaliação Funcional"     value={`${dashRaw.avaliacao_funcional_realizada_pct}%`} color={CRIT} sub={`meta: ${dashRaw.meta_avaliacao_pct}%`} />
              <KPI label="Caderneta Atualizada"    value={`${dashRaw.caderneta_idoso_atualizada_pct}%`} color={CRIT} sub={`meta: ${dashRaw.meta_caderneta_pct}%`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="ILPI Municipal"          value="NÃO" color={CRIT} sub={`Ref.: ${dashRaw.ilpi_referencia} (${dashRaw.ilpi_distancia_km} km)`} />
              <KPI label="Polifarmácia"            value={`${dashRaw.polifarmacia_pct}%`} color={CRIT} sub={`meta: ${dashRaw.meta_polifarmacia_pct}%`} />
              <KPI label="Internações por Queda"   value={`${dashRaw.quedas_internacao_ano}/ano`} color={CRIT} sub={`${dashRaw.fraturas_quadril_ano} fraturas de quadril`} />
              <KPI label="Vulner. Acompanhados"    value={`${dashRaw.idosos_vulneraveis_acompanhados_pct}%`} color={CRIT} sub={`de ${dashRaw.idosos_vulneraveis_estimativa} vulneráveis`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cobertura — Idoso</h3>
                <div className="space-y-3">
                  {[
                    { label: "Idosos cadastrados",           value: dashRaw.cobertura_cadastro_pct,                     max: 100, color: WARN },
                    { label: "Avaliação funcional",          value: dashRaw.avaliacao_funcional_realizada_pct,           max: 80,  color: CRIT },
                    { label: "Caderneta atualizada",         value: dashRaw.caderneta_idoso_atualizada_pct,             max: 100, color: CRIT },
                    { label: "Vulneráveis acompanhados",     value: dashRaw.idosos_vulneraveis_acompanhados_pct,         max: 100, color: CRIT },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-medium" style={{ color: b.color }}>{b.value}%</span>
                      </div>
                      <ProgressBar value={b.value} max={b.max} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>Sem ILPI em Apuí</b> — idosos dependentes ficam com família sem suporte ou são encaminhados para Humaitá (284 km). Muitos permanecem em situação de vulnerabilidade extrema.</p>
                <p><b>12 fraturas de quadril/ano</b> — mortalidade de 25% em 1 ano após fratura de quadril em idosos. Adaptação domiciliar e prevenção de quedas não são ofertadas pela SMS.</p>
                <p><b>38,4% em polifarmácia</b> — sem revisão farmacoterapêutica sistematizada. Interação medicamentosa é a causa de 30% das quedas em idosos polimedicados.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "condicoes" && Array.isArray(condicoes) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Prevalência e Acompanhamento por Condição</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={condicoes as any[]} margin={{ top: 5, right: 60, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="condicao" tick={{ fontSize: 7 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="prevalencia_pct"   name="Prevalência (%)" fill={BRAND}  radius={[3,3,0,0]} />
                  <Bar dataKey="acompanhados_pct"  name="Acompanhados (%)" radius={[3,3,0,0]}>
                    {(condicoes as any[]).map((c: any) => <Cell key={c.condicao} fill={statusColor(c.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(condicoes as any[]).map((c: any) => (
                <div key={c.condicao} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: statusColor(c.status) }} />
                      <span className="font-semibold text-sm text-slate-700">{c.condicao}</span>
                    </div>
                    <div className="text-right text-xs">
                      <span className="text-slate-400">Prevalência: {c.prevalencia_pct}% · </span>
                      <span className="font-bold" style={{ color: statusColor(c.status) }}>Acomp.: {c.acompanhados_pct}%</span>
                    </div>
                  </div>
                  <ProgressBar value={c.acompanhados_pct} max={100} color={statusColor(c.status)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "riscos" && Array.isArray(riscos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Prevalência de Fatores de Risco — Idosos</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={riscos as any[]} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" domain={[0, 60]} tick={{ fontSize: 11 }} unit="%" />
                  <YAxis type="category" dataKey="risco" tick={{ fontSize: 8 }} width={240} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="afetados_pct" name="Afetados (%)" radius={[0,3,3,0]}>
                    {(riscos as any[]).map((r: any) => <Cell key={r.risco} fill={statusColor(r.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(riscos as any[]).map((r: any) => (
                <div key={r.risco} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: statusColor(r.status) }} />
                      <span className="font-semibold text-sm text-slate-700">{r.risco}</span>
                    </div>
                    <span className="font-bold text-sm" style={{ color: statusColor(r.status) }}>
                      {r.afetados_pct}%{r.meta_pct ? ` / meta: ${r.meta_pct}%` : ""}
                    </span>
                  </div>
                  {r.meta_pct && <ProgressBar value={r.afetados_pct} max={r.meta_pct * 2} color={statusColor(r.status)} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Saúde do Idoso (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="s" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n" dataKey="cadastrados"      name="Cadastrados"           stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n" dataKey="internacoes_icsap"name="ICSAP"                  stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="n" dataKey="quedas_intern"    name="Internações queda"      stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="s" dataKey="cobertura_pct"    name="Cobertura cadastro (%)" stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
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
