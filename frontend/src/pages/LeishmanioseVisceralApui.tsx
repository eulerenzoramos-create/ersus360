import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Droplets, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function LeishmanioseVisceralApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["lv-dash"],  queryFn: () => apiGet("/api/leishmaniose-visceral-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: casos }       = useQuery({ queryKey: ["lv-caso"],  queryFn: () => apiGet("/api/leishmaniose-visceral-apui/casos"),        enabled: aba === "casos" });
  const { data: controle }    = useQuery({ queryKey: ["lv-ctrl"],  queryFn: () => apiGet("/api/leishmaniose-visceral-apui/controle"),     enabled: aba === "controle" });
  const { data: historico }   = useQuery({ queryKey: ["lv-hist"],  queryFn: () => apiGet("/api/leishmaniose-visceral-apui/historico"),    enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["lv-ind"],   queryFn: () => apiGet("/api/leishmaniose-visceral-apui/indicadores"),  enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Droplets size={15}/> },
    { key: "casos",       label: "Casos",      icon: <Activity size={15}/> },
    { key: "controle",    label: "Controle",   icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Droplets size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Leishmaniose Visceral — Apuí/AM</h1>
            <p className="text-sm text-slate-500">rK39 · Anfotericina B · Borrifação Intradomiciliar · Controle Canino · Lu. longipalpis · SINAN · FMS Apuí/AM</p>
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
              <KPI label="Casos de LV 2025"               value={dashRaw.casos_lv_2025}                                       color={CRIT} sub={`${dashRaw.incidencia_lv_100k}/100k (meta: ${dashRaw.meta_incidencia_lv_100k}/100k)`} />
              <KPI label="Óbitos (letalidade)"             value={`${dashRaw.obitos_lv_2025} (${dashRaw.letalidade_pct}%)`}   color={CRIT} sub={`meta: ≤ ${dashRaw.meta_letalidade_pct}%`} />
              <KPI label="Crianças < 5 anos"               value={`${dashRaw.casos_lv_criancas_menor_5} (${dashRaw.criancas_pct_casos}%)`} color={CRIT} sub="grupo de maior letalidade" />
              <KPI label="Tempo médio de diagnóstico"      value={`${dashRaw.tempo_diagnostico_medio_dias} dias`}              color={CRIT} sub={`meta: ${dashRaw.meta_tempo_diagnostico_dias} dias`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="rK39 em UBSs (cobertura)"        value={`${dashRaw.teste_rapido_rk39_ubs_pct}%`}                   color={CRIT} sub="disponível em 2 de 6 UBSs" />
              <KPI label="Borrifação intradomiciliar"      value={`${dashRaw.borrifacao_intradomiciliar_2025_domicilios}/${dashRaw.meta_borrifacao_domicilios}`} color={CRIT} sub="12,4% de cobertura" />
              <KPI label="Cães positivos testados"         value={`${dashRaw.caes_testados}/${dashRaw.caes_sorologicamente_positivos_estimados}`} color={CRIT} sub="22,1% rastreados" />
              <KPI label="Coinfecção LV-HIV"               value={`${dashRaw.coinfecao_lv_hiv_pct}%`}                       color={CRIT} sub="letalidade 37,5% nesse grupo" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cobertura de Controle da LV — Apuí/AM</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Diagnóstico em prazo: 0% (meta: 84 → 30 dias com rK39)`, value: 0, max: 100, color: CRIT },
                    { label: `Borrifação intradomiciliar: 12,4% (meta: 100%)`,          value: 12.4, max: 100, color: CRIT },
                    { label: `Cães testados: 22,1% (meta: 100%)`,                       value: 22.1, max: 100, color: CRIT },
                    { label: `Anfotericina B lipossomal em estoque: 0% (meta: 100%)`,   value: 0, max: 100, color: CRIT },
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
                <p><b>170/100k — 170× acima da meta de eliminação</b> — 42 casos, 8 óbitos (19% letalidade). Crescimento: +50% em 3 anos. 42,9% são crianças &lt; 5 anos (letalidade infantil: 27,8%). 3 crianças morreram aguardando transferência a Manaus (480km).</p>
                <p><b>rK39 em apenas 2 de 6 UBSs</b> — tempo diagnóstico: 84 dias (meta: 30). R$ 18k coloca rK39 em todas as UBSs + postos de garimpo. 6 óbitos evitáveis = 6 vidas, principalmente crianças. Anfotericina B lipossomal: zero em Apuí.</p>
                <p><b>Borrifação: 12,4% de cobertura</b> — SES-AM financia 80% = R$ 114k municipal para 100% de cobertura. BI reduz casos em 68,4%. Controle canino: 1.284 cães positivos estimados, 284 testados (22,1%). Programa integrado (R$ 84k) elimina reservatório em 18 meses.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "casos" && Array.isArray(casos) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={casos as any[]} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="grupo" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="casos_2025"       name="Casos 2025" radius={[4,4,0,0]}>
                  {(casos as any[]).map((c: any, i: number) => <Cell key={i} fill={statusColor(c.status)} />)}
                </Bar>
                <Bar dataKey="letalidade_pct"   name="Letalidade (%)" radius={[4,4,0,0]} fill={WARN} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(casos as any[]).map((c: any) => (
                <div key={c.grupo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(c.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{c.grupo}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: statusColor(c.status) }}>{c.casos_2025} casos</span>
                      <span className="text-slate-400"> · letal.: {c.letalidade_pct}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{c.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "controle" && Array.isArray(controle) && (
          <div className="grid gap-3">
            {(controle as any[]).map((c: any) => (
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
                    <p className="text-xs text-slate-400 mt-0.5">R$ {c.custo.toLocaleString()} · {c.prazo_meses}m</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{c.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Leishmaniose Visceral — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="casos"           name="Casos LV"              stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="obitos"           name="Óbitos"                stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="right" dataKey="incidencia_100k"  name="Incidência/100k"       stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" dataKey="borrifacao_pct"   name="Borrifação (%)"        stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
