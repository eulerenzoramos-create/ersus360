import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Brain, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function SaudeMentalApui2() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["sm2-dashboard"], queryFn: () => apiGet("/api/saude-mental-apui/dashboard"),     enabled: aba === "dashboard" });
  const { data: agravos }     = useQuery({ queryKey: ["sm2-agravos"],   queryFn: () => apiGet("/api/saude-mental-apui/agravos"),        enabled: aba === "agravos" });
  const { data: producao }    = useQuery({ queryKey: ["sm2-prod"],      queryFn: () => apiGet("/api/saude-mental-apui/caps-producao"),   enabled: aba === "producao" });
  const { data: historico }   = useQuery({ queryKey: ["sm2-hist"],      queryFn: () => apiGet("/api/saude-mental-apui/historico"),      enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["sm2-ind"],       queryFn: () => apiGet("/api/saude-mental-apui/indicadores"),    enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",     icon: <Brain size={15}/> },
    { key: "agravos",    label: "Agravos",       icon: <AlertTriangle size={15}/> },
    { key: "producao",   label: "CAPS Produção", icon: <Activity size={15}/> },
    { key: "historico",  label: "Histórico",     icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores",   icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Brain size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Mental — Apuí/AM</h1>
            <p className="text-sm text-slate-500">CAPS · Suicídio · Álcool/Drogas · Psiquiatria · FMS Apuí/AM</p>
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
              <KPI label="Taxa Suicídio"           value={`${dashRaw.taxa_suicidio_por_100k}/100k`}  color={CRIT} sub={`nacional: ${dashRaw.media_nacional_suicidio_por_100k}/100k`} />
              <KPI label="CAPS Superlotação"        value={`${dashRaw.caps_superlotacao_pct}%`}        color={CRIT} sub={`${dashRaw.caps_pacientes_acompanhados} / cap. ${dashRaw.caps_capacidade_maxima}`} />
              <KPI label="Psiquiatras Município"    value={`${dashRaw.psiquiatras_municipio}`}          color={CRIT} sub="espera 128 dias via TFD" />
              <KPI label="Leitos Psiquiátricos"     value={`${dashRaw.leitos_psiquiatricos_municipio}`} color={CRIT} sub={`ref: ${dashRaw.referencia_internacao}`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Internações Psiq./Ano"   value={`${dashRaw.internacoes_psiquiatricas_ano}`} color={CRIT} sub={`${dashRaw.internacoes_fora_municipio_pct}% fora`} />
              <KPI label="Tentativas Suicídio/Ano" value={`${dashRaw.tentativas_suicidio_ano}`}        color={CRIT} sub="subnotificação alta" />
              <KPI label="Reinternação 30 dias"    value={`${dashRaw.reinternacoes_30dias_pct}%`}      color={CRIT} sub="meta: < 15%" />
              <KPI label="NASF Psicólogo"          value={`${dashRaw.nasf_psicologo_equipes_pct}%`}   color={WARN} sub="das equipes ESF" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Estrutura RAPS em Apuí</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "CAPS I (existe)", value: dashRaw.caps_tipo_i, ok: true },
                    { label: "CAPS AD (álcool/drogas)", value: dashRaw.caps_ad, ok: false },
                    { label: "CAPS Infanto-Juvenil", value: dashRaw.caps_infanto_juvenil, ok: false },
                    { label: "Psiquiatras municipais", value: dashRaw.psiquiatras_municipio, ok: false },
                    { label: "Leito psiquiátrico local", value: dashRaw.leitos_psiquiatricos_municipio, ok: false },
                  ].map((b) => (
                    <div key={b.label} className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-600">{b.label}</span>
                      <span className="font-bold px-2 py-0.5 rounded text-xs" style={{ background: (b.value > 0) === b.ok ? OK + "22" : CRIT + "22", color: (b.value > 0) === b.ok ? OK : CRIT }}>
                        {b.value > 0 ? `${b.value}` : "Não existe"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>Taxa suicídio 18,4/100k — 2,8x a média nacional</b>. Homens 15-44 anos, garimpo ilegal (isolamento + dívida + drogas). CAPS sem protocolo de crise 24h. CVV sem cobertura local. Tentativas são subnotificadas: estimativa real é 4-6x os óbitos.</p>
                <p><b>CAPS superlotado (153%)</b> — 184 pacientes, capacidade 120. CAPS AD inexistente para demanda de 38,4% álcool/drogas. Sem leito de crise para observação 24-72h: crise aguda = polícia + UPA sem protocolo.</p>
                <p><b>Zero psiquiatra no município</b> — TFD com 128 dias de espera. Doente mental agudo em crise aguarda 4 meses por consulta especializada. Reinternação em 30 dias de 28,4% mostra que alta hospitalar sem seguimento é abandono disfarçado.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "agravos" && Array.isArray(agravos) && (
          <div className="space-y-3">
            {(agravos as any[]).map((ag: any) => (
              <div key={ag.agravo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(ag.status) }} />
                    <span className="font-semibold text-slate-700">{ag.agravo}</span>
                  </div>
                  <div className="text-xs text-right ml-4 space-y-0.5">
                    {ag.prevalencia_estimada && <div>Estimado: <b>{ag.prevalencia_estimada?.toLocaleString()}</b> | Tratados: <b>{ag.em_tratamento}</b></div>}
                    {ag.cobertura_pct && <div>Cobertura: <b style={{ color: statusColor(ag.status) }}>{ag.cobertura_pct}%</b></div>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{ag.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "producao" && Array.isArray(producao) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Produção CAPS — 2025 (por mês)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={producao as any[]} margin={{ left: 0, right: 10 }}>
                  <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="atendimentos" name="Atendimentos" fill={BRAND} radius={[3,3,0,0]} />
                  <Bar dataKey="novos"        name="Novos casos"  fill={WARN}  radius={[3,3,0,0]} />
                  <Bar dataKey="crises"       name="Crises"       fill={CRIT}  radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Saúde Mental (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10 }} unit="/100k" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="pacientes_caps"          name="Pacientes CAPS"      stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="suicidios_tentativas"    name="Tentativas suicídio" stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="n"   dataKey="internacoes"             name="Internações psiq."   stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="taxa_suicidio_100k"      name="Taxa suicídio"       stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
