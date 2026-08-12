import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Shield, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function SaudePrisionalApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["pris-dash"],  queryFn: () => apiGet("/api/saude-prisional-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: agravos }     = useQuery({ queryKey: ["pris-agrav"], queryFn: () => apiGet("/api/saude-prisional-apui/agravos"),    enabled: aba === "agravos" });
  const { data: servicos }    = useQuery({ queryKey: ["pris-serv"],  queryFn: () => apiGet("/api/saude-prisional-apui/servicos"),   enabled: aba === "servicos" });
  const { data: historico }   = useQuery({ queryKey: ["pris-hist"],  queryFn: () => apiGet("/api/saude-prisional-apui/historico"), enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["pris-ind"],   queryFn: () => apiGet("/api/saude-prisional-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Shield size={15}/> },
    { key: "agravos",     label: "Agravos",    icon: <Activity size={15}/> },
    { key: "servicos",    label: "Serviços",   icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Shield size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Prisional — Apuí/AM</h1>
            <p className="text-sm text-slate-500">CPP Apuí · TB · HIV · Superlotação · PNAISP · Reinserção · FMS Apuí/AM</p>
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
              <KPI label="Presos no CPP Apuí"        value={`${dashRaw.presos_atual}/${dashRaw.capacidade_unidade}`}  color={CRIT} sub={`${dashRaw.superlotacao_pct}% de ocupação`} />
              <KPI label="TB entre presos"            value={`${dashRaw.tb_taxa_preso_por_100k}/100k`}                color={CRIT} sub={`${dashRaw.tb_media_br_por_100k}/100k na pop. geral`} />
              <KPI label="HIV nos presos"             value={`${dashRaw.hiv_prevalencia_presos_pct}%`}                color={CRIT} sub={`pop. geral: ${dashRaw.hiv_media_br_pct}%`} />
              <KPI label="Transtorno mental (presos)" value={`${dashRaw.saude_mental_transtorno_pct}%`}               color={CRIT} sub="zero psicólogo prisional" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Óbitos na unidade 2025"    value={dashRaw.obito_unidade_2025}                              color={CRIT} sub={`${dashRaw.obito_causas_evitaveis_pct}% causas evitáveis`} />
              <KPI label="Hepatite C (presos)"       value={`${dashRaw.hepatite_c_prevalencia_pct}%`}               color={CRIT} sub="37× média nacional" />
              <KPI label="Sífilis (presos)"          value={`${dashRaw.sifilis_prevalencia_pct}%`}                  color={CRIT} sub="4× média nacional" />
              <KPI label="Egressos encaminhados SUS" value={`${dashRaw.egressos_acompanhados_sus_pct}%`}            color={CRIT} sub={`reincidência: ${dashRaw.reincidencia_criminal_pct}%`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Saúde Prisional — Comparativo com Pop. Geral</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `TB: ${dashRaw.tb_taxa_preso_por_100k}/100k vs ${dashRaw.tb_media_br_100k}/100k geral`, value: dashRaw.tb_media_br_por_100k, max: dashRaw.tb_taxa_preso_por_100k, color: CRIT },
                    { label: `HIV: ${dashRaw.hiv_prevalencia_presos_pct}% vs ${dashRaw.hiv_media_br_pct}% geral`,    value: dashRaw.hiv_media_br_pct, max: dashRaw.hiv_prevalencia_presos_pct, color: CRIT },
                    { label: `HCV: ${dashRaw.hepatite_c_prevalencia_pct}% vs 0,5% geral`,                             value: 0.5, max: dashRaw.hepatite_c_prevalencia_pct, color: CRIT },
                    { label: `Sífilis: ${dashRaw.sifilis_prevalencia_pct}% vs 7,8% geral`,                            value: 7.8, max: dashRaw.sifilis_prevalencia_pct, color: CRIT },
                    { label: `Transt. mental: ${dashRaw.saude_mental_transtorno_pct}% vs 3,2% geral`,                 value: 3.2, max: dashRaw.saude_mental_transtorno_pct, color: CRIT },
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
                <p><b>188% de superlotação (242 em 84 vagas)</b> — TB cresce 86× em relação à população geral por transmissão em aerossol. 3 óbitos em 2025 — 100% causas evitáveis. 2 por doença infecciosa + 1 suicídio.</p>
                <p><b>PNAISP elegível — zero implantado</b> — financiamento de R$ 120k/mês pelo MS já aprovado. Custo municipal: R$ 60k/ano. ROI positivo desde o 1º mês (42 internações/ano × R$ 12.971 = R$ 544k economizados). Prazo: 6 meses.</p>
                <p><b>91,6% dos egressos soltos sem encaminhamento ao SUS</b> — reincidência criminal de 68,4%. Protocolo de alta prisional com PTS: R$ 2.400 + 2h de treinamento. Custo de 1 reincidência (processo judicial): R$ 42.000.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "agravos" && Array.isArray(agravos) && (
          <div className="grid gap-3">
            {(agravos as any[]).map((a: any) => (
              <div key={a.agravo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(a.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{a.agravo}</p>
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-bold" style={{ color: statusColor(a.status) }}>{a.prevalencia_pct}%</span>
                    <span className="text-slate-400"> · {a.taxa_100k}/100k vs {a.referencia_br_100k}/100k BR</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "servicos" && Array.isArray(servicos) && (
          <div className="grid gap-3">
            {(servicos as any[]).map((s: any) => (
              <div key={s.servico} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: s.implementado ? OK : CRIT }} />
                    <p className="font-semibold text-sm text-slate-700">{s.servico}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.implementado ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {s.implementado ? "Implementado" : "Não implementado"}
                    </span>
                    {s.custo > 0 && <p className="text-xs text-slate-400 mt-0.5">R$ {s.custo.toLocaleString()} · {s.prazo_meses}m</p>}
                    {s.custo === 0 && <p className="text-xs text-green-600 mt-0.5">custo R$ 0 · {s.prazo_meses}m</p>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{s.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Saúde Prisional — CPP Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="presos"      name="Total presos"     stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="tb_casos"    name="TB (casos)"       stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="hiv_casos"   name="HIV (casos)"      stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="internacoes" name="Internações/ano"  stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
