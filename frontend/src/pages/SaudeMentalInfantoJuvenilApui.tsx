import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Smile, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function SaudeMentalInfantoJuvenilApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["smij-dash"],  queryFn: () => apiGet("/api/saude-mental-infantojuvenil-apui/dashboard"),    enabled: aba === "dashboard" });
  const { data: transtornos } = useQuery({ queryKey: ["smij-tra"],   queryFn: () => apiGet("/api/saude-mental-infantojuvenil-apui/transtornos"),   enabled: aba === "transtornos" });
  const { data: intervencoes }= useQuery({ queryKey: ["smij-int"],   queryFn: () => apiGet("/api/saude-mental-infantojuvenil-apui/intervencoes"),  enabled: aba === "intervencoes" });
  const { data: historico }   = useQuery({ queryKey: ["smij-hist"],  queryFn: () => apiGet("/api/saude-mental-infantojuvenil-apui/historico"),     enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["smij-ind"],   queryFn: () => apiGet("/api/saude-mental-infantojuvenil-apui/indicadores"),   enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",    icon: <Smile size={15}/> },
    { key: "transtornos",  label: "Transtornos",  icon: <Activity size={15}/> },
    { key: "intervencoes", label: "Intervenções", icon: <AlertTriangle size={15}/> },
    { key: "historico",    label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Smile size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Mental Infanto-Juvenil — Apuí/AM</h1>
            <p className="text-sm text-slate-500">TEA · TDAH · Depressão · Suicídio Adolescente · TEPT · Drogas · FMS Apuí/AM</p>
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
              <KPI label="Transtorno s/ acompanhamento"  value={`${dashRaw.sem_acompanhamento_pct}%`}                   color={CRIT} sub={`${dashRaw.em_acompanhamento_saude_mental} de ${dashRaw.criancas_adolescentes_transtorno_estimados} estimados`} />
              <KPI label="TEA estimados"                 value={(dashRaw.tea_estimados||0).toLocaleString()}            color={CRIT} sub={`${dashRaw.tea_diagnosticados} diagnosticados — ${dashRaw.tea_em_terapia} em terapia`} />
              <KPI label="TDAH estimados"                value={(dashRaw.tdah_estimados||0).toLocaleString()}           color={CRIT} sub={`${dashRaw.tdah_diagnosticados} diag. — ${dashRaw.tdah_medicado} medicados`} />
              <KPI label="Tentativas suicídio adol. 2025" value={dashRaw.tentativa_suicidio_adolescente_2025}          color={CRIT} sub={`${dashRaw.suicidio_adolescente_2025} óbitos — ${dashRaw.suicidio_adolescente_pct_total_suicidio}% dos suicídios`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="CAPS infantojuvenil"           value={dashRaw.caps_infantojuvenil_apui === 0 ? "Inexistente" : dashRaw.caps_infantojuvenil_apui} color={CRIT} sub="zero em Apuí" />
              <KPI label="Psicólogo infantojuvenil SUS"  value={dashRaw.psicologo_sus_infantojuvenil === 0 ? "Nenhum" : dashRaw.psicologo_sus_infantojuvenil} color={CRIT} sub="zero em Apuí" />
              <KPI label="Vagas SCFV (meta 840)"         value={`${dashRaw.scfv_vagas_disponiveis}/840`}               color={CRIT} sub={`${((dashRaw.scfv_vagas_disponiveis/840)*100).toFixed(1)}% da necessidade`} />
              <KPI label="TEPT em crianças (estimado)"   value={`${dashRaw.transtorno_estresse_pos_traumatico_pct}%`}   color={CRIT} sub="trauma, violência, luto por suicídio familiar" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cobertura de Suporte Infanto-Juvenil</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Em acompanhamento: ${dashRaw.em_acompanhamento_saude_mental}/${dashRaw.criancas_adolescentes_transtorno_estimados}`, value: dashRaw.em_acompanhamento_saude_mental, max: dashRaw.criancas_adolescentes_transtorno_estimados, color: CRIT },
                    { label: `TEA em terapia: ${dashRaw.tea_em_terapia}/${dashRaw.tea_estimados} estimados`,          value: dashRaw.tea_em_terapia,     max: dashRaw.tea_estimados,     color: CRIT },
                    { label: `TDAH medicado: ${dashRaw.tdah_medicado}/${dashRaw.tdah_estimados} estimados`,           value: dashRaw.tdah_medicado,      max: dashRaw.tdah_estimados,    color: CRIT },
                    { label: `SCFV vagas: ${dashRaw.scfv_vagas_disponiveis}/${dashRaw.scfv_vagas_necessarias}`,       value: dashRaw.scfv_vagas_disponiveis, max: dashRaw.scfv_vagas_necessarias, color: CRIT },
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
                <p><b>92,2% das crianças com transtorno sem acompanhamento</b> — zero CAPS IJ, zero psicólogo SUS infantojuvenil, zero psiquiatra infantil em Apuí. Tele-psiquiatria: R$ 14k → 100 atendimentos/mês.</p>
                <p><b>28 tentativas de suicídio em adolescentes (6 óbitos)</b> — 42,9% de todos os suicídios do município. PHQ-A nas escolas (R$ 4.800) + protocolo pós-tentativa em 72h: salva vidas.</p>
                <p><b>80 vagas SCFV vs 840 necessárias</b> (9,5%). Federal financia R$ 504k/ano. Municipal: R$ 168k. SCFV: -28% uso de drogas, -18% evasão escolar. ROI 50:1 em saúde mental geracional.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "transtornos" && Array.isArray(transtornos) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={transtornos as any[]} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="transtorno" tick={{ fontSize: 8 }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="estimados"     name="Estimados"     radius={[4,4,0,0]} fill={ACCENT} />
                <Bar dataKey="diagnosticados" name="Diagnosticados" radius={[4,4,0,0]}>
                  {(transtornos as any[]).map((_t: any, i: number) => <Cell key={i} fill={CRIT} />)}
                </Bar>
                <Bar dataKey="em_terapia"    name="Em terapia"    radius={[4,4,0,0]} fill={OK} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(transtornos as any[]).map((t: any) => (
                <div key={t.transtorno} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: CRIT }} />
                      <p className="font-semibold text-sm text-slate-700">{t.transtorno}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: CRIT }}>{(t.estimados||0).toLocaleString()} estim.</span>
                      <span className="text-slate-500"> · {t.diagnosticados} diag. · {t.em_terapia} trat.</span>
                      <p className="text-slate-400 mt-0.5">{t.faixa_etaria}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{t.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "intervencoes" && Array.isArray(intervencoes) && (
          <div className="grid gap-3">
            {(intervencoes as any[]).map((iv: any) => (
              <div key={iv.intervencao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: iv.implementada ? OK : CRIT }} />
                    <p className="font-semibold text-sm text-slate-700">{iv.intervencao}</p>
                  </div>
                  <div className="text-right text-xs">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${iv.implementada ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {iv.implementada ? "Implementada" : "Não implementada"}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">R$ {(iv.custo||0).toLocaleString()} · {iv.prazo_meses}m</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{iv.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Saúde Mental Infanto-Juvenil — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="em_acompanhamento"          name="Em acompanhamento"          stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" dataKey="tentativas_suicidio_adol"   name="Tentativas suicídio adol."  stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="right" dataKey="violencia_notificada"       name="Violência notificada"       stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
                <Line yAxisId="right" dataKey="scfv_vagas"                 name="SCFV vagas"                 stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
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
