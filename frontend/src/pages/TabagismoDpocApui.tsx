import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Wind, AlertTriangle, TrendingUp, Activity } from "lucide-react";

const BRAND  = "#1e3a5f";
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

export default function TabagismoDpocApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["tab-dashboard"], queryFn: () => apiGet("/api/tabagismo-dpoc-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: doencas }     = useQuery({ queryKey: ["tab-doencas"],   queryFn: () => apiGet("/api/tabagismo-dpoc-apui/doencas"),    enabled: aba === "doencas" });
  const { data: cessacao }    = useQuery({ queryKey: ["tab-cessacao"],  queryFn: () => apiGet("/api/tabagismo-dpoc-apui/cessacao"),   enabled: aba === "cessacao" });
  const { data: historico }   = useQuery({ queryKey: ["tab-hist"],      queryFn: () => apiGet("/api/tabagismo-dpoc-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["tab-ind"],       queryFn: () => apiGet("/api/tabagismo-dpoc-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",    icon: <Wind size={15}/> },
    { key: "doencas",     label: "Doenças Resp.", icon: <Activity size={15}/> },
    { key: "cessacao",    label: "Cessação",     icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Wind size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Tabagismo e DPOC — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Tabagismo · DPOC · Asma · Queimadas · Cessação · FMS Apuí/AM</p>
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
              <KPI label="Prevalência tabagismo"    value={`${dashRaw.prevalencia_tabagismo_adulto_pct}%`}  color={CRIT} sub={`BR: ${dashRaw.media_brasil_tabagismo_pct}% (2,3x acima)`} />
              <KPI label="DPOC estimados"           value={dashRaw.dpoc_estimados?.toLocaleString()}         color={CRIT} sub={`apenas ${dashRaw.dpoc_diagnosticados_pct}% diagnosticados`} />
              <KPI label="Óbitos resp. 2025"        value={dashRaw.obitos_doencas_respiratorias_2025}        color={CRIT} sub="60% relacionados a tabagismo + queimadas" />
              <KPI label="Dias ar ruim/ano"         value={`${dashRaw.queimadas_dias_ar_ruim_2024} dias`}   color={CRIT} sub={`PM2,5 pico: ${dashRaw.pm25_pico_ug_m3} μg/m³ (19× OMS)`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Tabagismo na gestante"    value={`${dashRaw.tabagismo_gestante_pct}%`}            color={CRIT} sub="causa prematuridade/baixo peso" />
              <KPI label="Tabagismo adolescente"    value={`${dashRaw.tabagismo_adolescente_pct}%`}         color={CRIT} sub="início médio: 12,4 anos" />
              <KPI label="Tabagismo indígena"       value={`${dashRaw.tabagismo_indigena_pct}%`}            color={CRIT} sub="cachimbo + cigarro industrializado" />
              <KPI label="Cessação com apoio SUS"   value={`${dashRaw.tratamento_cessacao_tabagismo_ativo_pct}%`} color={CRIT} sub="meta: 30% dos fumantes" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Doenças Respiratórias — Diagnóstico e Controle</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `DPOC diagnosticado (${dashRaw.dpoc_diagnosticados_pct}% de estimados)`,   value: dashRaw.dpoc_diagnosticados_pct, max: 100, color: CRIT },
                    { label: `Asma controlada (${dashRaw.asma_controlada_pct}% dos asmáticos)`,          value: dashRaw.asma_controlada_pct, max: 100, color: CRIT },
                    { label: `Cessação tabagismo ativa (${dashRaw.tratamento_cessacao_tabagismo_ativo_pct}%)`, value: dashRaw.tratamento_cessacao_tabagismo_ativo_pct, max: 100, color: CRIT },
                    { label: `Grupo cessação ativo: ${dashRaw.grupo_cessacao_tabagismo ? "Sim" : "Não"}`, value: dashRaw.grupo_cessacao_tabagismo ? 100 : 0, max: 100, color: CRIT },
                    { label: `Espirometria disponível: ${dashRaw.espirometria_disponivel ? "Sim" : "Não"}`, value: dashRaw.espirometria_disponivel ? 100 : 0, max: 100, color: CRIT },
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
                <p><b>28,4% de tabagistas = 2,3× a média nacional</b> — tabagismo indígena 42,4%. Cessação com apoio formal: apenas 8,4%. Grupo INCA: zero ativo desde 2021. TRN (adesivo/goma): disponível, mas raramente prescrito.</p>
                <p><b>DPOC: 81,6% sem diagnóstico</b> — espirometria indisponível. 84 internações/ano por exacerbação = R$ 238.560/ano evitável. Espirômetro portátil: R$ 4.800 — payback em 1 internação evitada.</p>
                <p><b>Queimadas + DPOC: combinação letal</b> — PM2,5 284 μg/m³ em pico (19× OMS). 68 dias/ano com ar irrespirável. Paciente com DPOC em queimada: 3-5 exacerbações adicionais/ano vs paciente em área sem queimada.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "doencas" && Array.isArray(doencas) && (
          <div className="grid gap-3">
            {(doencas as any[]).map((d: any) => (
              <div key={d.doenca} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(d.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{d.doenca}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <span className="font-bold text-slate-700">{d.estimados?.toLocaleString()} estimados</span>
                    {" · "}
                    <span style={{ color: statusColor(d.status) }}>{d.diagnosticados_pct}% diag · {d.controlados_pct}% controlados</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{d.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "cessacao" && Array.isArray(cessacao) && (
          <div className="grid gap-3">
            {(cessacao as any[]).map((c: any) => (
              <div key={c.acao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: c.implementada ? OK : CRIT }} />
                    <p className="font-semibold text-sm text-slate-700">{c.acao}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.implementada ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {c.implementada ? "Implementada" : "Não implementada"}
                    </span>
                    {c.custo > 0 && <p className="text-xs text-slate-400 mt-0.5">custo: R$ {c.custo.toLocaleString()} · prazo: {c.prazo_meses}m</p>}
                    {c.custo === 0 && <p className="text-xs text-green-600 mt-0.5">custo R$ 0 · {c.prazo_meses}m</p>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{c.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Tabagismo/Respiratório — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="tabagismo_pct"         name="Tabagismo (%)"          stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="asma_controlada_pct"   name="Asma controlada (%)"    stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="internacoes_resp"       name="Internações resp."      stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="obitos_resp"            name="Óbitos resp."           stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
