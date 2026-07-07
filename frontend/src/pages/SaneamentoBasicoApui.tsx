import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Waves, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function SaneamentoBasicoApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["san-dash"],  queryFn: () => apiGet("/api/saneamento-basico-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: componentes } = useQuery({ queryKey: ["san-comp"],  queryFn: () => apiGet("/api/saneamento-basico-apui/componentes"), enabled: aba === "componentes" });
  const { data: acoes }       = useQuery({ queryKey: ["san-acoes"], queryFn: () => apiGet("/api/saneamento-basico-apui/acoes"),       enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["san-hist"],  queryFn: () => apiGet("/api/saneamento-basico-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["san-ind"],   queryFn: () => apiGet("/api/saneamento-basico-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",   icon: <Waves size={15}/> },
    { key: "componentes", label: "Componentes", icon: <Activity size={15}/> },
    { key: "acoes",       label: "Ações",       icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",   icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores", icon: <AlertTriangle size={15}/> },
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
            <p className="text-sm text-slate-500">Água · Esgoto · Lixo · Ribeirinhos · Mercúrio · VIGIÁGUA · FMS Apuí/AM</p>
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
              <KPI label="Água tratada (urbana)"         value={`${dashRaw.agua_tratada_cobertura_pct}%`}             color={CRIT} sub={`meta ${dashRaw.meta_agua_tratada_pct}% — ETA avariada`} />
              <KPI label="Esgotamento sanitário"         value={`${dashRaw.esgotamento_sanitario_rede_pct}%`}         color={CRIT} sub={`meta ${dashRaw.meta_esgotamento_pct}%`} />
              <KPI label="Coleta de lixo (urbana)"       value={`${dashRaw.coleta_lixo_urbana_pct}%`}                color={CRIT} sub="lixão a céu aberto ativo" />
              <KPI label="Ribeirinhos sem água segura"   value={dashRaw.populacoes_ribeirinhas_sem_agua_segura?.toLocaleString()} color={CRIT} sub="mercúrio 800× limite OMS" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Diarreia (0-5 anos) 2025"     value={dashRaw.diarreia_criancas_0_5_2025}                   color={CRIT} sub={`${dashRaw.diarreia_obito_0_5_2025} óbitos`} />
              <KPI label="Leptospirose 2025"             value={dashRaw.leptospirose_casos_2025}                      color={CRIT} sub={`${dashRaw.leptospirose_obitos_2025} óbitos (7,1% letald.)`} />
              <KPI label="Água contaminada (nitrato)"    value={`${dashRaw.agua_contaminada_nitrato_pct}%`}           color={CRIT} sub="fossas negras próximas a poços" />
              <KPI label="Peixes acima limite mercúrio"  value={`${dashRaw.mercurio_peixe_acima_limite_pct}%`}        color={CRIT} sub="neurotoxicidade em crianças" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Saneamento — Cobertura vs Meta</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Água tratada (${dashRaw.agua_tratada_cobertura_pct}% / meta 99%)`,           value: dashRaw.agua_tratada_cobertura_pct,          max: 100, color: CRIT },
                    { label: `Esgotamento sanitário (${dashRaw.esgotamento_sanitario_rede_pct}% / meta 90%)`, value: dashRaw.esgotamento_sanitario_rede_pct,    max: 100, color: CRIT },
                    { label: `Coleta de lixo (${dashRaw.coleta_lixo_urbana_pct}% / meta 90%)`,            value: dashRaw.coleta_lixo_urbana_pct,              max: 100, color: CRIT },
                    { label: `Água rural (15,6% / meta 80%)`,                                              value: 15.6,                                        max: 100, color: CRIT },
                    { label: `VIGIÁGUA amostras (42,4% / meta 100%)`,                                     value: 42.4,                                        max: 100, color: CRIT },
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
                <p><b>ETA com bomba dosadora de cloro avariada desde março/2025</b> — 14.200 pessoas sem cloro residual. Peça: R$ 12.000. Em licitação há 8 meses. Dispensa de licitação (Art. 75, Lei 14.133): emergência de saúde pública = 7 dias de prazo.</p>
                <p><b>4.284 ribeirinhos em 42 comunidades consumindo Rio Madeira</b> — mercúrio 0,8 μg/L (800× limite OMS 0,001 μg/L). 6 de 8 sistemas de dessedentação solar inoperantes. Recuperação: R$ 84.000 (FUNASA cobre 100%). 62,4% dos peixes acima do limite.</p>
                <p><b>Apuí sem PMSB válido</b> — bloqueados R$ 84M em financiamentos federais (FUNASA/BNDES/FGTS). Contratação de plano: R$ 120.000 = ROI de 700×. Lixão com multa IBAMA de R$ 84k/mês desde 2021 (R$ 3,5M acumulados).</p>
              </div>
            </div>
          </div>
        )}

        {aba === "componentes" && Array.isArray(componentes) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Cobertura por Componente de Saneamento (%)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(componentes as any[])} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="componente" tick={{ fontSize: 8 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="cobertura_pct" name="Cobertura (%)" radius={[4,4,0,0]}>
                    {(componentes as any[]).map((c: any, i: number) => <Cell key={i} fill={statusColor(c.status)} />)}
                  </Bar>
                  <Bar dataKey="meta_pct" name="Meta (%)" fill="#cbd5e1" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(componentes as any[]).map((c: any) => (
                <div key={c.componente} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(c.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{c.componente}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: statusColor(c.status) }}>{c.cobertura_pct}%</span>
                      <span className="text-slate-400"> / meta {c.meta_pct}%</span>
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
                  <div className="text-right text-xs text-slate-500">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${a.implementada ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {a.implementada ? "Implementada" : "Não implementada"}
                    </span>
                    {a.custo > 0 && <p className="text-xs text-slate-400 mt-0.5">R$ {a.custo.toLocaleString()} · {a.prazo_meses}m</p>}
                    {a.custo === 0 && <p className="text-xs text-green-600 mt-0.5">custo R$ 0 · {a.prazo_meses}m</p>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Saneamento — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="agua_tratada_pct" name="Água tratada (%)"    stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="esgoto_pct"        name="Esgoto (%)"         stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="lixo_pct"          name="Coleta lixo (%)"   stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="diarreia_0_5"      name="Diarreia 0-5 anos" stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
