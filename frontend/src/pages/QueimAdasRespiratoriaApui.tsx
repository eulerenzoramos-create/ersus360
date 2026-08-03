import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Wind, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import { BRL, BRL_AXIS, PCT } from "../lib/fmt";

const BRAND  = "#dbeafe";
const ACCENT = "#1d4ed8";
const OK     = "#16a34a";
const WARN   = "#d97706";
const CRIT   = "#dc2626";

function statusColor(s: string) {
  if (s === "critico") return CRIT;
  if (s === "atencao") return WARN;
  return OK;
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

export default function QueimAdasRespiratoriaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["qmd-dash"],  queryFn: () => apiGet("/api/queimadas-respiratoria-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: exposicao }   = useQuery({ queryKey: ["qmd-exp"],   queryFn: () => apiGet("/api/queimadas-respiratoria-apui/exposicao"),  enabled: aba === "exposicao" });
  const { data: acoes }       = useQuery({ queryKey: ["qmd-acao"],  queryFn: () => apiGet("/api/queimadas-respiratoria-apui/acoes"),      enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["qmd-hist"],  queryFn: () => apiGet("/api/queimadas-respiratoria-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["qmd-ind"],   queryFn: () => apiGet("/api/queimadas-respiratoria-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Wind size={15}/> },
    { key: "exposicao",   label: "Exposição",  icon: <Activity size={15}/> },
    { key: "acoes",       label: "Ações",      icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Wind size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Queimadas e Saúde Respiratória — Apuí/AM</h1>
            <p className="text-sm text-slate-500">PM2,5 · DPOC · Asma · Focos INPE · PFF2 · Estação Julho–Outubro · FMS Apuí/AM</p>
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
              <KPI label="Focos de incêndio 2025"         value={(dashRaw.focos_incendio_2025||0).toLocaleString()} color={CRIT} sub={`+${dashRaw.variacao_focos_pct}% vs 2024`} />
              <KPI label="PM2,5 pico (µg/m³)"             value={`${dashRaw.pm25_pico_ugm3}`}                      color={CRIT} sub={`meta OMS: ${dashRaw.meta_pm25_oms_ugm3} µg/m³`} />
              <KPI label="Dias com ar muito ruim"          value={dashRaw.dias_qualidade_ar_muito_ruim}              color={CRIT} sub={`de ${dashRaw.dias_fumaca_2025} dias com fumaça`} />
              <KPI label="Internações respiratórias 2025"  value={dashRaw.internacoes_respiratorias_2025}            color={CRIT} sub={`${dashRaw.internacoes_respiratorias_queimadas_pct}% atribuíveis à fumaça`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Óbitos respiratórios 2025"       value={dashRaw.obitos_respiratorios_2025}                color={CRIT} sub={`${dashRaw.obitos_atribuiveis_queimadas_estimados} atribuíveis`} />
              <KPI label="Área queimada 2025"              value={`${BRL(dashRaw.area_queimada_ha_2025||0)} ha`} color={CRIT} sub="fumaça afeta toda a região" />
              <KPI label="Estação de queimadas pico"       value={dashRaw.estacao_queimadas_pico || "Ago/Set"}      color={WARN} sub="julho a outubro" />
              <KPI label="Monitoramento qualidade ar"      value="Inexistente"                                      color={CRIT} sub="zero sensor em Apuí" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Grupos Vulneráveis — Queimadas 2025</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Crianças < 5 anos internadas: ${dashRaw.internacoes_criancas_respiratorio_2025} (agosto-outubro)`, value: dashRaw.internacoes_criancas_respiratorio_2025, max: dashRaw.internacoes_respiratorias_2025, color: CRIT },
                    { label: `Asma — crises por fumaça: ${dashRaw.asma_crise_queimadas_2025}`,                                   value: dashRaw.asma_crise_queimadas_2025, max: 500, color: CRIT },
                    { label: `DPOC exacerbado por fumaça: ${dashRaw.dpoc_exacerbacao_queimadas_2025}`,                           value: dashRaw.dpoc_exacerbacao_queimadas_2025, max: 300, color: WARN },
                    { label: `Gestantes expostas sem proteção: ${dashRaw.gestantes_expostas_fumaca_2025}`,                       value: dashRaw.gestantes_expostas_fumaca_2025, max: 620, color: CRIT },
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
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>4.284 focos de incêndio (+50,7%)</b> — PM2,5 pico: 284,4 µg/m³ (19× o limite OMS). 84 dias com fumaça, 42 com ar muito ruim. 177 internações atribuíveis = R$ 1,64M. Tendência: piora ano a ano.</p>
                <p><b>142 crianças internadas por crise respiratória em agosto-outubro</b> — pulmão em desenvolvimento é irreversivelmente danificado. Kit PFF2 (R$ 19/criança) + nebulizador nas 4 UBSs rurais (R$ 18k): ROI 49:1 em internações evitadas.</p>
                <p><b>Zero monitoramento de qualidade do ar em Apuí</b> — sensor PM2,5 (R$ 8.400) + protocolo de alerta (R$ 2.400) = equipe preparada 24h antes do pico. Espirômetro (R$ 14k): diagnostica 280 DPOC não diagnosticados → -40% de exacerbações graves.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "exposicao" && Array.isArray(exposicao) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={exposicao as any[]} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="grupo" tick={{ fontSize: 8 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="internacoes_2025" name="Internações 2025" radius={[4,4,0,0]}>
                  {(exposicao as any[]).map((e: any, i: number) => <Cell key={i} fill={statusColor(e.status)} />)}
                </Bar>
                <Bar dataKey="obitos_2025" name="Óbitos 2025" radius={[4,4,0,0]} fill={BRAND} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(exposicao as any[]).map((e: any) => (
                <div key={e.grupo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(e.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{e.grupo}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: statusColor(e.status) }}>{e.internacoes_2025} intern.</span>
                      <span className="text-slate-400"> · {e.obitos_2025} óbitos</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{e.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "acoes" && Array.isArray(acoes) && (
          <div className="grid gap-3">
            {(acoes as any[]).map((a: any) => (
              <div key={a.acao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: a.implementada ? OK : CRIT }} />
                    <p className="font-semibold text-sm text-slate-700">{a.acao}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${a.implementada ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {a.implementada ? "Implementada" : "Não implementada"}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">R$ {a.custo.toLocaleString()} · {a.prazo_meses}m</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Queimadas e Saúde Respiratória — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="right" dataKey="focos"             name="Focos incêndio"     stroke={CRIT}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="internacoes_resp"  name="Internações resp."  stroke={BRAND} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="obitos_resp"       name="Óbitos resp."       stroke={WARN}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="left"  dataKey="pm25_media"        name="PM2,5 médio (µg/m³)" stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
