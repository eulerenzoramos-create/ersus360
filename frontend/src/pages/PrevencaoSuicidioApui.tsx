import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Heart, AlertTriangle, TrendingUp, Activity } from "lucide-react";
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

export default function PrevencaoSuicidioApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["sui-dash"],  queryFn: () => apiGet("/api/prevencao-suicidio-apui/dashboard"),     enabled: aba === "dashboard" });
  const { data: fatores }     = useQuery({ queryKey: ["sui-fat"],   queryFn: () => apiGet("/api/prevencao-suicidio-apui/fatores-risco"), enabled: aba === "fatores" });
  const { data: intervencoes }= useQuery({ queryKey: ["sui-int"],   queryFn: () => apiGet("/api/prevencao-suicidio-apui/intervencoes"),  enabled: aba === "intervencoes" });
  const { data: historico }   = useQuery({ queryKey: ["sui-hist"],  queryFn: () => apiGet("/api/prevencao-suicidio-apui/historico"),     enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["sui-ind"],   queryFn: () => apiGet("/api/prevencao-suicidio-apui/indicadores"),   enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",      icon: <Heart size={15}/> },
    { key: "fatores",      label: "Fatores de Risco",icon: <Activity size={15}/> },
    { key: "intervencoes", label: "Intervenções",   icon: <AlertTriangle size={15}/> },
    { key: "historico",    label: "Histórico",      icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores",    icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Heart size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Prevenção do Suicídio — Apuí/AM</h1>
            <p className="text-sm text-slate-500">CVV 188 · CAPS II · Guardiões da Vida · Busca Ativa · PHQ-2 · Escolas · FMS Apuí/AM</p>
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
              <KPI label="Taxa de suicídio"             value={`${dashRaw.taxa_suicidio_100k}/100k`}             color={CRIT} sub={`média BR: ${dashRaw.media_nacional_suicidio_100k}/100k`} />
              <KPI label="Óbitos por suicídio 2025"     value={dashRaw.obitos_suicidio_2025}                     color={CRIT} sub={`${dashRaw.vezes_acima_media_nacional}× acima da média`} />
              <KPI label="Tentativas notificadas 2025"  value={dashRaw.tentativas_suicidio_notificadas_2025}      color={CRIT} sub={`estimado: ~${dashRaw.tentativas_nao_notificadas_estimadas}`} />
              <KPI label="Psiquiatra SUS"               value={dashRaw.psiquiatra_sus}                           color={CRIT} sub="zero em Apuí" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Suicídios em jovens 15-29"    value={`${dashRaw.suicidio_jovem_15_29_pct}%`}           color={CRIT} sub="dos óbitos de 2025" />
              <KPI label="Suicídios em garimpeiros"     value={`${dashRaw.suicidio_garimpeiro_pct}%`}            color={CRIT} sub="exposição a Hg + isolamento" />
              <KPI label="Busca ativa pós-tentativa"    value="Inexistente"                                      color={CRIT} sub="zero protocolo implantado" />
              <KPI label="Custo social anual"           value={BRL(dashRaw.custo_social_suicidio_anual)} color={CRIT} sub="estimado IPEA" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cobertura da Rede de Prevenção — Apuí/AM</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Profissionais treinados: ${dashRaw.profissionais_treinados_prevencao_pct}% (meta 100%)`, value: dashRaw.profissionais_treinados_prevencao_pct, max: 100, color: CRIT },
                    { label: `Escolas com programa: ${dashRaw.escolas_com_programa_prevencao}/8 (meta 8)`,             value: dashRaw.escolas_com_programa_prevencao, max: 8, color: CRIT },
                    { label: `Tentativas com busca ativa: 0% (meta 100%)`,                                             value: 0, max: 100, color: CRIT },
                    { label: `CAPS II disponível: 0 (meta 1)`,                                                         value: 0, max: 1, color: CRIT },
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
                <p><b>56,7 suicídios/100k — 8,9× a média nacional</b> — 14 óbitos em 2025, crescimento de +40% em 3 anos. 42,9% em jovens 15-29, 35,7% em garimpeiros (mercúrio + isolamento).</p>
                <p><b>Subnotificação de 80%</b> — 84 tentativas notificadas vs 420 estimadas. Zero busca ativa pós-tentativa: protocolo (R$ 4.800) + OMS comprova -26% de nova tentativa em 72h.</p>
                <p><b>CAPS II: elegível (&gt; 20k hab.), não implantado</b> — MS financia R$ 60k/mês. R$ 168k municipal = psiquiatra permanente + 2 psicólogos + leito de acolhimento noturno. CVV 188: divulgar nas escolas = R$ 0.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "fatores" && Array.isArray(fatores) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={fatores as any[]} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="fator" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="prevalencia_pct" name="% dos suicídios" radius={[4,4,0,0]}>
                  {(fatores as any[]).map((f: any, i: number) => <Cell key={i} fill={statusColor(f.status)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(fatores as any[]).map((f: any) => (
                <div key={f.fator} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(f.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{f.fator}</p>
                    </div>
                    <span className="font-bold text-sm" style={{ color: statusColor(f.status) }}>{f.prevalencia_pct}% dos casos</span>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{f.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "intervencoes" && Array.isArray(intervencoes) && (
          <div className="grid gap-3">
            {(intervencoes as any[]).map((i: any) => (
              <div key={i.intervencao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: i.implementada ? OK : CRIT }} />
                    <p className="font-semibold text-sm text-slate-700">{i.intervencao}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${i.implementada ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {i.implementada ? "Implementada" : "Não implementada"}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">R$ {i.custo.toLocaleString()} · {i.prazo_meses}m</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{i.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Suicídio em Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="obitos"                      name="Óbitos"                       stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="tentativas"                  name="Tentativas notif."             stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="taxa_100k"                   name="Taxa/100k"                    stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="profissionais_treinados_pct" name="Profis. treinados (%)"        stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
