import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Syringe, AlertTriangle, Activity, TrendingUp } from "lucide-react";

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

export default function ImunizacaoApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["imun-dashboard"],  queryFn: () => apiGet("/api/imunizacao-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: coberturas }  = useQuery({ queryKey: ["imun-cob"],        queryFn: () => apiGet("/api/imunizacao-apui/coberturas"), enabled: aba === "coberturas" });
  const { data: historico }   = useQuery({ queryKey: ["imun-hist"],       queryFn: () => apiGet("/api/imunizacao-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["imun-ind"],        queryFn: () => apiGet("/api/imunizacao-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",       icon: <Syringe size={15}/> },
    { key: "coberturas",  label: "Coberturas",      icon: <Activity size={15}/> },
    { key: "historico",   label: "Histórico",       icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",     icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Syringe size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Imunização — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Calendário Nacional · Coberturas · Cadeia de Frio · Salas de Vacina · FMS Apuí/AM</p>
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
              <KPI label="Cobertura Geral"        value={`${dashRaw.cobertura_geral_pct}%`} color={statusColor(dashRaw.status_cobertura)} sub="meta: 95%" />
              <KPI label="Vacinas Aplicadas/Mês"  value={dashRaw.vacinas_aplicadas_mes.toLocaleString()} color={BRAND} />
              <KPI label="Vacinas Abaixo da Meta" value={dashRaw.vacinas_abaixo_meta.toString()} color={CRIT} sub="imunobiológicos críticos" />
              <KPI label="Salas de Vacina"        value={`${dashRaw.sala_vacina_funcionando} / ${dashRaw.sala_vacina_total}`} color={WARN} sub="em funcionamento" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="< 1 ano Vacinadas"      value={`${dashRaw.criancas_menores_1_vacinadas_pct}%`} color={WARN} sub="meta: 95%" />
              <KPI label="Multivacinação (camp.)"  value={`${dashRaw.multivacinacao_ultima_campanha_pct}%`} color={WARN} sub="última campanha" />
              <KPI label="Perdas de Doses"         value={`${dashRaw.doses_perdidas_pct}%`} color={WARN} sub={`meta: ${dashRaw.meta_perdas_pct}%`} />
              <KPI label="Freezers Ativos"         value={`${dashRaw.freezer_ativo} / ${dashRaw.freezer_necessario}`} color={statusColor(dashRaw.status_cadeia_frio)} sub="cadeia de frio" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Coberturas Críticas vs Meta</h3>
                <div className="space-y-2">
                  {[
                    { label: "Pentavalente",  value: 80.0, color: CRIT },
                    { label: "Meningocócica", value: 78.3, color: CRIT },
                    { label: "HPV (meninas)", value: 53.3, color: CRIT },
                    { label: "Influenza",     value: 71.3, color: CRIT },
                    { label: "Covid (>60a)",  value: 54.0, color: CRIT },
                    { label: "Febre Amarela", value: 82.0, color: CRIT },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-medium" style={{ color: b.color }}>{b.value}% / meta 95%</span>
                      </div>
                      <ProgressBar value={b.value} max={95} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>Febre Amarela 82%</b> — Apuí é área endêmica. Cobertura abaixo de 95% mantém risco de surto em zona de transmissão silvestre ativa.</p>
                <p><b>HPV 53,3%</b> — meninas 9-14a sem esquema completo. Perda de seguimento no intervalo de 6 meses entre doses é o principal problema.</p>
                <p><b>2 salas fechadas</b> por falta de vacinador — UBS Ramal Acará e Rural sem vacina. Populações rurais e ribeirinhas sem acesso.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "coberturas" && Array.isArray(coberturas) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Cobertura Vacinal por Imunobiológico (%)</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={coberturas as any[]} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <YAxis type="category" dataKey="vacina" tick={{ fontSize: 8 }} width={220} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="cobertura_pct" name="Cobertura (%)" radius={[0,3,3,0]}>
                    {(coberturas as any[]).map((c: any) => <Cell key={c.vacina} fill={statusColor(c.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(coberturas as any[]).map((c: any) => (
                <div key={c.vacina} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="font-semibold text-sm text-slate-700">{c.vacina}</span>
                      <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                        <span>Público: {c.publico}</span>
                        <span>{c.aplicadas} aplicadas / {c.populacao_alvo} alvo</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold" style={{ color: statusColor(c.status) }}>{c.cobertura_pct}%</span>
                      <p className="text-xs text-slate-400">meta: {c.meta_pct}%</p>
                    </div>
                  </div>
                  <ProgressBar value={c.cobertura_pct} max={c.meta_pct} color={statusColor(c.status)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal — Imunização (Jan–Jun/2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="s" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n" dataKey="aplicadas"            name="Doses aplicadas"    stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="s" dataKey="cobertura_inf_pct"    name="Cobertura infantil (%)" stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="s" dataKey="febre_amarela_pct"    name="Febre Amarela (%)"  stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="s" dataKey="perdas_pct"           name="Perdas (%)"         stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
