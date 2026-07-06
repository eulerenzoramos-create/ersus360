import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { UserCheck, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

  const { data: dash }        = useQuery({ queryKey: ["idoso-dashboard"], queryFn: () => apiGet("/api/saude-idoso-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: condicoes }   = useQuery({ queryKey: ["idoso-cond"],      queryFn: () => apiGet("/api/saude-idoso-apui/condicoes"),    enabled: aba === "condicoes" });
  const { data: quedas }      = useQuery({ queryKey: ["idoso-quedas"],    queryFn: () => apiGet("/api/saude-idoso-apui/quedas"),       enabled: aba === "quedas" });
  const { data: historico }   = useQuery({ queryKey: ["idoso-hist"],      queryFn: () => apiGet("/api/saude-idoso-apui/historico"),    enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["idoso-ind"],       queryFn: () => apiGet("/api/saude-idoso-apui/indicadores"),  enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",   icon: <UserCheck size={15}/> },
    { key: "condicoes",  label: "Condições",   icon: <Activity size={15}/> },
    { key: "quedas",     label: "Quedas",      icon: <AlertTriangle size={15}/> },
    { key: "historico",  label: "Histórico",   icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores", icon: <AlertTriangle size={15}/> },
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
            <p className="text-sm text-slate-500">Fragilidade · Demência · Quedas · Polifarmácia · FMS Apuí/AM</p>
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
              <KPI label="Pop. 60+ anos"           value={dashRaw.populacao_60_mais?.toLocaleString()} color={BRAND} sub={`${dashRaw.pct_populacao_60_mais}% da população`} />
              <KPI label="Avaliação Funcional"      value={`${dashRaw.avaliacao_funcional_pct}%`}       color={CRIT} sub={`meta: ${dashRaw.meta_avaliacao_pct}%`} />
              <KPI label="Demência Rastreada"       value={`${dashRaw.demencia_rastreada_pct}%`}        color={CRIT} sub={`${dashRaw.demencia_acompanhada_caps_aps}/${dashRaw.demencia_diagnosticada_estimada} est.`} />
              <KPI label="Quedas com Lesão / Ano"  value={`${dashRaw.quedas_com_lesao_ano}`}            color={CRIT} sub={`${dashRaw.fratura_quadril_ano} fraturas quadril`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Polifarmácia (≥ 5 med.)" value={`${dashRaw.polifarmacia_5_mais_pct}%`}       color={CRIT} sub="dos idosos" />
              <KPI label="Polifarmácia Revisada"    value={`${dashRaw.polif_revisao_sistematica_pct}%`} color={CRIT} sub="meta: 80%" />
              <KPI label="Fragilidade Mod./Grave"   value={`${dashRaw.fragilidade_moderada_grave_pct}%`} color={CRIT} sub="dos idosos" />
              <KPI label="ILPI no Município"        value={`${dashRaw.ilpi_municipio}`}                 color={CRIT} sub="zero institucionalização" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Coberturas Saúde do Idoso</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Caderneta preenchida (meta 100%)",        value: dashRaw.caderneta_idoso_preenchida_pct, color: CRIT },
                    { label: "Avaliação funcional (meta 80%)",           value: dashRaw.avaliacao_funcional_pct,       color: CRIT },
                    { label: "Demência rastreada (meta 70%)",            value: dashRaw.demencia_rastreada_pct,        color: CRIT },
                    { label: "Polifarmácia revisada (meta 80%)",         value: dashRaw.polif_revisao_sistematica_pct, color: CRIT },
                    { label: "Influenza idosos (meta 90%)",              value: dashRaw.influenza_idosos_pct,          color: WARN },
                    { label: "Pneumocócica idosos (meta 85%)",           value: dashRaw.pneumococica_idosos_pct,       color: CRIT },
                  ].map((b: any) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-bold" style={{ color: b.color }}>{b.value}%</span>
                      </div>
                      <ProgressBar value={b.value} max={100} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>148 idosos com demência estimada — 28 diagnosticados</b>. 81,1% sem diagnóstico. Cuidador familiar sem capacitação = exaustão, violência doméstica ao idoso por negligência. Geriatra: zero no município. MEEM demora 10 minutos e não é aplicado.</p>
                <p><b>84 quedas com lesão / 8 fraturas de quadril por ano</b>. Fisioterapia preventiva inexistente. R$ 120k em fratura de quadril vs R$ 8k em prevenção sistematizada (barras, tapetes, VGI). Mortalidade pós-fratura quadril: 18% em 1 ano.</p>
                <p><b>38,4% em polifarmácia sem revisão (87,6%)</b>. Benzodiazepínico = queda. AINE = sangramento gastrointestinal. Digitálico sem ajuste = intoxicação. Critérios de Beers identificáveis na prescrição sem custo adicional — falta protocolo.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "condicoes" && Array.isArray(condicoes) && (
          <div className="space-y-3">
            {(condicoes as any[]).map((c: any) => (
              <div key={c.condicao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(c.status) }} />
                    <span className="font-semibold text-slate-700">{c.condicao}</span>
                  </div>
                  <div className="text-xs text-right ml-4 space-y-0.5">
                    <div>Prevalência: <b>{c.prevalencia_pct}%</b> dos idosos</div>
                    {c.controlados_pct != null && <div>Controlados: <b style={{ color: statusColor(c.status) }}>{c.controlados_pct}%</b> / meta {c.meta_controle_pct}%</div>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{c.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "quedas" && Array.isArray(quedas) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Quedas em Idosos — 2025</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={quedas as any[]} margin={{ left: 0, right: 30 }}>
                  <XAxis dataKey="categoria" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="casos_ano"       name="Casos/ano"          fill={BRAND}  radius={[3,3,0,0]} />
                  <Bar dataKey="hospitalizacoes" name="Hospitalizações"    fill={WARN}   radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(quedas as any[]).map((q: any) => (
                <div key={q.categoria} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-slate-700">{q.categoria}</p>
                    <p className="text-xs text-slate-400">{q.observacao}</p>
                  </div>
                  <div className="text-xs text-right space-y-0.5 ml-4">
                    <div>Casos: <b>{q.casos_ano}</b> | Hosp.: <b style={{ color: q.hospitalizacoes > 0 ? WARN : OK }}>{q.hospitalizacoes}</b></div>
                    {q.obitos > 0 && <div className="font-bold" style={{ color: CRIT }}>Óbitos: {q.obitos}</div>}
                    {q.custo_estimado_R > 0 && <div className="text-slate-400">R$ {q.custo_estimado_R.toLocaleString()}</div>}
                  </div>
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
                <YAxis yAxisId="pct" tick={{ fontSize: 11 }} unit="%" />
                <YAxis yAxisId="n" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="pct" dataKey="avaliacao_func_pct"  name="Aval. funcional (%)" stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="influenza_pct"       name="Influenza idosos (%)"stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="polifarmacia_pct"    name="Polifarmácia (%)"    stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="n"   dataKey="demencia_diag"       name="Demência diagn."     stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="quedas_lesao"        name="Quedas c/ lesão"     stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
