import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Waves, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function SaneamentoBasicoApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["san-dash"],  queryFn: () => apiGet("/api/saneamento-basico-apui/dashboard"),    enabled: aba === "dashboard" });
  const { data: componentes } = useQuery({ queryKey: ["san-comp"],  queryFn: () => apiGet("/api/saneamento-basico-apui/componentes"),  enabled: aba === "componentes" });
  const { data: acoes }       = useQuery({ queryKey: ["san-acao"],  queryFn: () => apiGet("/api/saneamento-basico-apui/acoes"),        enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["san-hist"],  queryFn: () => apiGet("/api/saneamento-basico-apui/historico"),    enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["san-ind"],   queryFn: () => apiGet("/api/saneamento-basico-apui/indicadores"),  enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",   icon: <Waves size={15}/> },
    { key: "componentes",  label: "Componentes", icon: <Activity size={15}/> },
    { key: "acoes",        label: "Ações",       icon: <AlertTriangle size={15}/> },
    { key: "historico",    label: "Histórico",   icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Waves size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saneamento Básico — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Água Tratada · Esgoto · Resíduos · Drenagem · PMSB · PAC Saneamento · FMS Apuí/AM</p>
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
              <KPI label="Água tratada — cobertura urbana"  value={`${dashRaw.abastecimento_agua_tratada_urbana_pct}%`}  color={CRIT} sub={`rural: ${dashRaw.abastecimento_agua_tratada_rural_pct}% — ${(dashRaw.agua_sem_tratamento_estimados||0).toLocaleString()} sem água tratada`} />
              <KPI label="Coleta de esgoto — urbana"        value={`${dashRaw.coleta_esgoto_urbana_pct}%`}              color={CRIT} sub={`rural: ${dashRaw.coleta_esgoto_rural_pct}% — ${(dashRaw.populacao_sem_esgoto_estimada||0).toLocaleString()} sem coleta`} />
              <KPI label="Coleta de lixo — urbana"          value={`${dashRaw.coleta_lixo_urbana_pct}%`}               color={WARN} sub={`lixão ativo — aterro sanitário: ${dashRaw.aterro_sanitario_apui ? "Sim" : "Não"}`} />
              <KPI label="PMSB (habilitação ao PAC)"        value={dashRaw.plano_saneamento_municipal_pmisb ? "Elaborado" : "Inexistente"} color={CRIT} sub="R$ 28M em PAC bloqueados sem PMSB" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Defecação a céu aberto (estimado)" value={(dashRaw.defecacao_ceu_aberto_estimados||0).toLocaleString()} color={CRIT} sub={`fossas negras: ${dashRaw.fossas_negras_pct}% dos domicílios`} />
              <KPI label="Diarreia — internações 2025"       value={dashRaw.diarreia_internacoes_2025}                  color={CRIT} sub={`${dashRaw.diarreia_internacoes_criancas_pct}% em crianças < 5a`} />
              <KPI label="Hepatite A 2025 (veiculada p/ água)" value={dashRaw.hepatite_a_casos_2025}                   color={CRIT} sub="R$ 18.000/caso de tratamento" />
              <KPI label="ETA (capacidade vs demanda)"       value={`${dashRaw.eta_cobertura_pct}%`}                   color={WARN} sub={`${dashRaw.eta_capacidade_m3_dia} m³/dia vs ${dashRaw.demanda_m3_dia} m³ de demanda`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cobertura de Saneamento Básico — Apuí/AM</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Água tratada (urbana): ${dashRaw.abastecimento_agua_tratada_urbana_pct}%`,   value: dashRaw.abastecimento_agua_tratada_urbana_pct, max: 100, color: CRIT },
                    { label: `Esgoto coletado (urbano): ${dashRaw.coleta_esgoto_urbana_pct}%`,             value: dashRaw.coleta_esgoto_urbana_pct, max: 100, color: CRIT },
                    { label: `Lixo coletado (urbano): ${dashRaw.coleta_lixo_urbana_pct}%`,                 value: dashRaw.coleta_lixo_urbana_pct, max: 100, color: WARN },
                    { label: `Drenagem urbana adequada: ${dashRaw.drenagem_urbana_pct || 28.4}%`,          value: dashRaw.drenagem_urbana_pct || 28.4, max: 100, color: CRIT },
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
                <p><b>14.284 pessoas sem água tratada</b> — 48 poços sem cloração. Cloração: R$ 403k/ano vs 284 internações por diarreia (R$ 2,84M). ROI 7:1. Fluoretação: zero — -60% de cárie se implementada.</p>
                <p><b>20.163 sem coleta de esgoto</b> — 4.284 defecam a céu aberto. Fossa biodigestora Embrapa: R$ 1.200/domicílio × 4.000 = R$ 4,8M (FUNASA financia). Helmintoses em 62,4% das crianças: saneamento = única solução definitiva.</p>
                <p><b>Zero PMSB</b> — município bloqueado de R$ 28M em PAC Saneamento. Elaboração: R$ 84k + 6 meses. FUNASA: apoio técnico gratuito. Lixão ativo (ilegal desde 2014): IBAMA pode autuar com multa de R$ 84k a R$ 840k.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "componentes" && Array.isArray(componentes) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={componentes as any[]} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="componente" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="cobertura_pct" name="Cobertura atual (%)" radius={[4,4,0,0]}>
                  {(componentes as any[]).map((c: any, i: number) => <Cell key={i} fill={statusColor(c.status)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(componentes as any[]).map((c: any) => (
                <div key={c.componente} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(c.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{c.componente}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: statusColor(c.status) }}>{c.cobertura_pct}% / meta {c.meta_pct}%</span>
                      <p className="text-slate-400 mt-0.5">{(c.populacao_sem_acesso||0).toLocaleString()} sem acesso</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{c.observacao}</p>
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
                  <div className="text-right text-xs">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${a.implementada ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {a.implementada ? "Implementada" : "Não implementada"}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">R$ {(a.custo||0).toLocaleString()} · {a.prazo_meses}m</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Saneamento Básico — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="agua_tratada_pct"  name="Água tratada (%)"     stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="esgoto_pct"        name="Esgoto coletado (%)"  stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="left"  dataKey="lixo_coleta_pct"   name="Lixo coletado (%)"    stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
                <Line yAxisId="right" dataKey="diarreia_intern"   name="Diarreia internações" stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" dataKey="hepatite_a"        name="Hepatite A casos"     stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="6 2" />
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
