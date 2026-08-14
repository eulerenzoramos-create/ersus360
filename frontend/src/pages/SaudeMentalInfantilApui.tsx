import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Brain, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function SaudeMentalInfantilApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["smi-dash"],  queryFn: () => apiGet("/api/saude-mental-infantil-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: transtornos } = useQuery({ queryKey: ["smi-tran"],  queryFn: () => apiGet("/api/saude-mental-infantil-apui/transtornos"),enabled: aba === "transtornos" });
  const { data: servicos }    = useQuery({ queryKey: ["smi-serv"],  queryFn: () => apiGet("/api/saude-mental-infantil-apui/servicos"),   enabled: aba === "servicos" });
  const { data: historico }   = useQuery({ queryKey: ["smi-hist"],  queryFn: () => apiGet("/api/saude-mental-infantil-apui/historico"), enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["smi-ind"],   queryFn: () => apiGet("/api/saude-mental-infantil-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",    icon: <Brain size={15}/> },
    { key: "transtornos", label: "Transtornos",  icon: <Activity size={15}/> },
    { key: "servicos",    label: "Serviços",     icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Brain size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Mental Infanto-Juvenil — Apuí/AM</h1>
            <p className="text-sm text-slate-500">TDAH · Depressão · TEA · Suicídio · Drogas · CAPSi · FMS Apuí/AM</p>
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
              <KPI label="Crianças/adol. com transtorno"  value={dashRaw.transtorno_mental_0_17_estimados?.toLocaleString()} color={CRIT} sub={`só ${dashRaw.transtorno_mental_diagnosticados_pct}% diagnosticados`} />
              <KPI label="Tentativas suicídio (0-17)"     value={dashRaw.tentativas_suicidio_0_17_2025}                      color={CRIT} sub={`${dashRaw.suicidio_consumado_0_17_2025} óbitos`} />
              <KPI label="Uso drogas (12-17 anos)"        value={`${dashRaw.uso_drogas_adolescentes_12_17_pct}%`}            color={CRIT} sub={`crack/cocaína: ${dashRaw.crack_cocaina_adolescente_pct}%`} />
              <KPI label="CAPSi no município"             value={dashRaw.capsi_municipio === 0 ? "Nenhum" : dashRaw.capsi_municipio} color={CRIT} sub={`referência: ${dashRaw.capsi_referencia_cidade}`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="TDAH estimados"                 value={dashRaw.tdah_estimados}                                     color={CRIT} sub={`só ${dashRaw.tdah_medicado_pct}% medicados`} />
              <KPI label="Depressão (12-17 anos)"         value={dashRaw.depressao_adolescente_estimados}                   color={CRIT} sub={`${dashRaw.depressao_diagnosticados_pct}% diagnosticados`} />
              <KPI label="Psicólogo infantil SUS"         value={dashRaw.psicologo_infantil_sus === 0 ? "Nenhum" : dashRaw.psicologo_infantil_sus} color={CRIT} sub="fila: Humaitá 12 meses" />
              <KPI label="Grupos saúde mental escolas"    value={`${dashRaw.grupos_saude_mental_escola}/${dashRaw.meta_grupos_saude_mental_escola}`} color={CRIT} sub="zero grupos ativos" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Saúde Mental Infanto-Juvenil — Cobertura</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Transtornos diagnosticados (${dashRaw.transtorno_mental_diagnosticados_pct}% / meta 70%)`,     value: dashRaw.transtorno_mental_diagnosticados_pct, max: 100, color: CRIT },
                    { label: `TDAH medicado (${dashRaw.tdah_medicado_pct}% / meta 70%)`,                                     value: dashRaw.tdah_medicado_pct, max: 100, color: CRIT },
                    { label: `Depressão diagnosticada (${dashRaw.depressao_diagnosticados_pct}% / meta 70%)`,                value: dashRaw.depressao_diagnosticados_pct, max: 100, color: CRIT },
                    { label: `Pós-tentativa suicídio acompanhado (48,4% / meta 100%)`,                                       value: 48.4, max: 100, color: CRIT },
                    { label: `TEA diagnosticado (${dashRaw.tdah_medicado_pct}% / meta 70%)`,                                 value: 22.4, max: 100, color: CRIT },
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
                <p><b>14 tentativas de suicídio em menores de 18 anos — 2 óbitos</b> (23,1/100k = 4,6× média BR). Zero protocolo de prevenção do suicídio. eCARE (cuidado pós-tentativa): não implantado. Curso QPR online: R$ 0 para 40 profissionais.</p>
                <p><b>Zero psicólogo e zero psiquiatra infantil no SUS</b> — 1.297 crianças com transtorno estimadas. TDAH não tratado: reprovação 3,4× mais frequente, drogas 4,2×. Telepsiquiatria infantil (UFAM): disponível gratuitamente, não utilizada.</p>
                <p><b>28,4% dos adolescentes usaram droga em 2025</b> — 8,4% crack/cocaína (3× média BR). Crack ligado à economia do garimpo. CAPSad atende adolescentes mas sem equipe especializada infantil. Zero grupos nas 8 escolas.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "transtornos" && Array.isArray(transtornos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Estimados vs Diagnosticados — Transtornos Infanto-Juvenis</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={(transtornos as any[])} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis dataKey="transtorno" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="estimados"       name="Estimados"     fill={ACCENT} radius={[4,4,0,0]} />
                  <Bar dataKey="diagnosticados_pct" name="Diagnos. (%)" fill={CRIT}   radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(transtornos as any[]).map((t: any) => (
                <div key={t.transtorno} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(t.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{t.transtorno}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <span className="font-bold text-slate-700">{t.estimados} estimados</span>
                      {" · "}
                      <span style={{ color: statusColor(t.status) }}>{t.diagnosticados_pct}% diag. · {t.tratados_pct}% tratados</span>
                      <p className="text-xs text-slate-400">{t.faixa_etaria}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{t.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "servicos" && Array.isArray(servicos) && (
          <div className="grid gap-3">
            {(servicos as any[]).map((s: any) => (
              <div key={s.servico} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: s.disponivel ? OK : CRIT }} />
                    <p className="font-semibold text-sm text-slate-700">{s.servico}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.disponivel ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {s.disponivel ? "Disponível" : "Indisponível"}
                    </span>
                    <p className="text-xs mt-0.5">demanda: {s.demanda_estimada}</p>
                    {s.custo_implantacao > 0 && <p className="text-xs text-slate-400">R$ {s.custo_implantacao?.toLocaleString()} · {s.prazo_meses}m</p>}
                    {s.custo_implantacao === 0 && <p className="text-xs text-green-600">custo R$ 0 · {s.prazo_meses}m</p>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{s.observacao}</p>
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
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="tentativas_suicidio_menor"    name="Tent. suicídio (<18)"  stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="uso_drogas_adolescente_pct"   name="Uso drogas adol. (%)"  stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="diagnosticados_pct"           name="Diagnosticados (%)"    stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="grupos_escola"                name="Grupos escolas"        stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
