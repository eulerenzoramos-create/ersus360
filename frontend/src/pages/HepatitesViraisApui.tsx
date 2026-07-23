import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { FlaskConical, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function HepatitesViraisApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["hep-dashboard"], queryFn: () => apiGet("/api/hepatites-virais-apui/dashboard"),    enabled: aba === "dashboard" });
  const { data: tipos }       = useQuery({ queryKey: ["hep-tipos"],     queryFn: () => apiGet("/api/hepatites-virais-apui/tipos"),         enabled: aba === "tipos" });
  const { data: complic }     = useQuery({ queryKey: ["hep-comp"],      queryFn: () => apiGet("/api/hepatites-virais-apui/complicacoes"),  enabled: aba === "complicacoes" });
  const { data: historico }   = useQuery({ queryKey: ["hep-hist"],      queryFn: () => apiGet("/api/hepatites-virais-apui/historico"),     enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["hep-ind"],       queryFn: () => apiGet("/api/hepatites-virais-apui/indicadores"),   enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",     icon: <FlaskConical size={15}/> },
    { key: "tipos",        label: "Hepatites",     icon: <Activity size={15}/> },
    { key: "complicacoes", label: "Complicações",  icon: <AlertTriangle size={15}/> },
    { key: "historico",    label: "Histórico",     icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores",   icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <FlaskConical size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Hepatites Virais — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Hep. A · B · C · D (delta amazônico) · E · Cirrose · CHC · FMS Apuí/AM</p>
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
              <KPI label="Hep. B estimados"      value={dashRaw.hepatite_b_casos_estimados?.toLocaleString()}  color={CRIT} sub={`prevalência ${dashRaw.hepatite_b_prevalencia_estimada_pct}%`} />
              <KPI label="Hep. C estimados"      value={dashRaw.hepatite_c_casos_estimados?.toLocaleString()}  color={CRIT} sub={`prevalência ${dashRaw.hepatite_c_prevalencia_estimada_pct}%`} />
              <KPI label="HDV em HBsAg+"         value={`${dashRaw.hepatite_d_delta_prevalencia_hbsag_pct}%`}  color={CRIT} sub="endemia amazônica" />
              <KPI label="Cirrose acompanhada"   value={`${dashRaw.cirrose_casos_acompanhados}`}               color={CRIT} sub={`${dashRaw.hepatocarcinoma_casos_diagnosticados} CHC diagnosticados`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Hep. B diagnosticados" value={`${dashRaw.hepatite_b_diagnosticados_pct}%`}          color={CRIT} sub="dos estimados" />
              <KPI label="Hep. C em tratamento"  value={`${dashRaw.hepatite_c_tratamento_iniciado_pct}%`}     color={CRIT} sub="DAA: não disponível" />
              <KPI label="Hepatologista"          value={`${dashRaw.especialista_hepatologista}`}              color={CRIT} sub="zero no município" />
              <KPI label="Hep. A — surto 2025"   value={dashRaw.hepatite_a_surto_2025 ? "ATIVO" : "Não"}     color={CRIT} sub={`${dashRaw.hepatite_a_casos_2025} casos`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cobertura Vacinal e Diagnóstico</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Vacina Hep. B (${dashRaw.hepatite_b_vacinacao_cobertura_pct}%)`, value: dashRaw.hepatite_b_vacinacao_cobertura_pct, max: 100, color: WARN },
                    { label: `Hep. B diagnosticados (${dashRaw.hepatite_b_diagnosticados_pct}%)`, value: dashRaw.hepatite_b_diagnosticados_pct, max: 100, color: CRIT },
                    { label: `Hep. C diagnosticados (${dashRaw.hepatite_c_diagnosticados_pct}%)`, value: dashRaw.hepatite_c_diagnosticados_pct, max: 100, color: CRIT },
                    { label: `Hep. C em tratamento (${dashRaw.hepatite_c_tratamento_iniciado_pct}%)`, value: dashRaw.hepatite_c_tratamento_iniciado_pct, max: 100, color: CRIT },
                  ].map((b: any) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                      </div>
                      <ProgressBar value={b.value} max={b.max} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex flex-col gap-2 justify-center">
                <p><b>Endemia amazônica de HDV</b> — Apuí: 28,4% dos portadores de HBsAg com coinfecção delta vs 8% nacional. HBV+HDV = cirrose em 70-80% em 5-10 anos. Anti-HDV: não realizado no município.</p>
                <p><b>Hep. B 13x acima da média nacional</b> — 4,8% vs 0,37% BR. Transmissão vertical não bloqueada: 47,6% das gestantes sem triagem HBsAg no 1º trimestre. RN sem IGHAHB = 90% de chance de infecção crônica.</p>
                <p><b>HCV sem tratamento local</b> — DAA (cura 95-98%) não disponíveis em Apuí. 61,6% dos diagnosticados com HCV sem acesso ao tratamento. Progressão silenciosa para cirrose a cada mês sem sofosbuvir.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "tipos" && Array.isArray(tipos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-2">
              <h3 className="font-semibold text-slate-700 mb-3">Prevalência Estimada por Tipo de Hepatite (%)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(tipos as any[]).filter((t: any) => t.prevalencia_pct > 0)} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis dataKey="tipo" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="prevalencia_pct" name="Prevalência estimada (%)" radius={[4,4,0,0]}>
                    {(tipos as any[]).filter((t: any) => t.prevalencia_pct > 0).map((t: any) => (
                      <Cell key={t.tipo} fill={statusColor(t.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {(tipos as any[]).map((t: any) => (
              <div key={t.tipo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(t.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{t.tipo}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: BRAND }}>{t.diagnosticados} diagnosticados</span>
                    <p className="text-xs text-slate-400">vacina: {t.vacinacao_pct > 0 ? `${t.vacinacao_pct}%` : "indisponível"} · trat.: {t.tratamento_pct > 0 ? `${t.tratamento_pct}%` : "suportivo/indisponível"}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{t.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "complicacoes" && Array.isArray(complic) && (
          <div className="grid gap-3">
            {(complic as any[]).map((c: any) => (
              <div key={c.complicacao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(c.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{c.complicacao}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: CRIT }}>{c.casos_acompanhados} acompanhados</span>
                    <p className="text-xs text-slate-400">estimados: {c.estimados}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{c.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução de Hepatites Virais — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="hep_b_diag"    name="Hep. B diagnosticados"  stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="hep_c_diag"    name="Hep. C diagnosticados"  stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="hep_d_diag"    name="HDV diagnosticados"     stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="cirrose_novos" name="Cirrose novos casos"    stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
