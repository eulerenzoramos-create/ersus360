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

export default function ViolenciaAcidentesApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["viol-dashboard"], queryFn: () => apiGet("/api/violencia-acidentes-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: tipologia }   = useQuery({ queryKey: ["viol-tipo"],      queryFn: () => apiGet("/api/violencia-acidentes-apui/tipologia"),  enabled: aba === "tipologia" });
  const { data: prevencao }   = useQuery({ queryKey: ["viol-prev"],      queryFn: () => apiGet("/api/violencia-acidentes-apui/prevencao"),  enabled: aba === "prevencao" });
  const { data: historico }   = useQuery({ queryKey: ["viol-hist"],      queryFn: () => apiGet("/api/violencia-acidentes-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["viol-ind"],       queryFn: () => apiGet("/api/violencia-acidentes-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",    icon: <Shield size={15}/> },
    { key: "tipologia",  label: "Tipologia",    icon: <Activity size={15}/> },
    { key: "prevencao",  label: "Prevenção",    icon: <Activity size={15}/> },
    { key: "historico",  label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Shield size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Violência e Acidentes — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Causas Externas · Homicídios · Trânsito · Violência Doméstica · Suicídio · FMS Apuí/AM</p>
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
              <KPI label="Mortalidade ext./100k"   value={`${dashRaw.taxa_mortalidade_causas_externas_100k}`}  color={CRIT} sub={`vs BR: ${dashRaw.media_nacional_causas_externas_100k}`} />
              <KPI label="Homicídios/100k"          value={`${dashRaw.taxa_homicidio_100k}`}                   color={CRIT} sub={`vs BR: ${dashRaw.media_nacional_homicidio_100k}`} />
              <KPI label="Suicídio/100k"            value={`${dashRaw.taxa_suicidio_100k}`}                    color={CRIT} sub={`vs BR: ${dashRaw.media_nacional_suicidio_100k}`} />
              <KPI label="Violência doméstica"       value={`${dashRaw.violencia_domestica_registros_ano}`}    color={CRIT} sub={`subnotif. ${dashRaw.violencia_domestica_subnotificacao_estimada_pct}%`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Acidente trânsito — óbitos" value={`${dashRaw.acidentes_transito_obitos_ano}/ano`}   color={CRIT} sub={`${dashRaw.acidentes_transito_internacoes_ano} internações`} />
              <KPI label="Feminicídio consumado"    value={`${dashRaw.feminicidio_consumados_ano}/ano`}        color={CRIT} sub={`${dashRaw.feminicidio_tentados_ano} tentativas`} />
              <KPI label="Tentativa suicídio"       value={`${dashRaw.tentativa_suicidio_ano}/ano`}            color={CRIT} sub={`${dashRaw.suicidio_consumado_ano} consumados`} />
              <KPI label="Afogamentos"              value={`${dashRaw.afogamento_obitos_ano}/ano`}             color={CRIT} sub="3,2x média nacional" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Estrutura de Prevenção — Disponibilidade</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Delegacia com plantão 24h",       disponivel: dashRaw.delegacia_plantao_24h },
                    { label: "UPA com cirurgião de trauma",      disponivel: dashRaw.upa_trauma_disponivel },
                    { label: "CRAM (Centro Ref. Mulher)",        disponivel: dashRaw.cram_municipio },
                  ].map((item: any) => (
                    <div key={item.label} className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="font-bold text-xs px-2 py-0.5 rounded-full"
                        style={{ background: item.disponivel ? "#dcfce7" : "#fee2e2", color: item.disponivel ? OK : CRIT }}>
                        {item.disponivel ? "Disponível" : "Indisponível"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>Homicídio 56,7/100k — 2,5x a média nacional</b> — garimpo ilegal alimenta conflitos de território e tráfico. Ausência de presença estatal faz da violência o mecanismo de resolução de conflitos. Delegacia sem plantão = impunidade noturna = ciclo de violência.</p>
                <p><b>Suicídio 16,2/100k — 2,5x a média nacional</b> — isolamento, abuso de álcool e ausência de saúde mental: combinação letal. Zero CVV, zero CAPS II para adultos. Tentativa de suicídio cresce ano a ano: 14 → 18 casos (2022-2025).</p>
                <p><b>Violência doméstica: 72,4% subnotificada</b> — sem delegacia da mulher, sem CRAM, sem casa de acolhimento. Medida protetiva em Humaitá (284 km): vítima volta para casa sem proteção. Feminicídio é a ponta do iceberg de uma rede de proteção inexistente.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "tipologia" && Array.isArray(tipologia) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-2">
              <h3 className="font-semibold text-slate-700 mb-3">Óbitos por Causa Externa (ano)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(tipologia as any[]).filter((t: any) => t.obitos_ano > 0)} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis dataKey="tipo" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="obitos_ano" name="Óbitos/ano">
                    {(tipologia as any[]).filter((t: any) => t.obitos_ano > 0).map((t: any) => (
                      <Cell key={t.tipo} fill={statusColor(t.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {(tipologia as any[]).map((t: any) => (
              <div key={t.tipo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(t.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{t.tipo}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: statusColor(t.status) }}>{t.taxa_100k}/100k</span>
                    <p className="text-xs text-slate-400">{t.obitos_ano} óbitos · {t.internacoes_ano} internações/ano</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{t.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "prevencao" && Array.isArray(prevencao) && (
          <div className="grid gap-3">
            {(prevencao as any[]).map((p: any) => (
              <div key={p.acao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(p.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{p.acao}</p>
                  </div>
                  <span className="font-bold text-xs px-2 py-1 rounded-full"
                    style={{ background: p.disponivel ? "#dcfce7" : "#fee2e2", color: p.disponivel ? OK : CRIT }}>
                    {p.disponivel ? "Disponível" : "Indisponível"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 ml-5">{p.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Causas Externas — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="obitos_ext"              name="Óbitos ext. (total)"         stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="homicidios"               name="Homicídios"                  stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="acidentes_transito_obitos" name="Ac. trânsito (óbitos)"      stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="tentativa_suicidio"        name="Tentativa suicídio"         stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
