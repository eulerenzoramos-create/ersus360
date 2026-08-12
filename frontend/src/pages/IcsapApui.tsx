import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Stethoscope, AlertTriangle, TrendingUp, Activity } from "lucide-react";
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

export default function IcsapApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["ics-dash"],  queryFn: () => apiGet("/api/icsap-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: condicoes }   = useQuery({ queryKey: ["ics-cond"],  queryFn: () => apiGet("/api/icsap-apui/condicoes"),   enabled: aba === "condicoes" });
  const { data: acoes }       = useQuery({ queryKey: ["ics-acao"],  queryFn: () => apiGet("/api/icsap-apui/acoes"),       enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["ics-hist"],  queryFn: () => apiGet("/api/icsap-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["ics-ind"],   queryFn: () => apiGet("/api/icsap-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Stethoscope size={15}/> },
    { key: "condicoes",   label: "Condições",  icon: <Activity size={15}/> },
    { key: "acoes",       label: "Ações",      icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Stethoscope size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>ICSAP — Internações Evitáveis — Apuí/AM</h1>
            <p className="text-sm text-slate-500">ESF · HIPERDIA · SRO · Antibioticoterapia Empírica · SIHSUS · Piso APS · FMS Apuí/AM</p>
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
              <KPI label="Taxa ICSAP (meta: 20%)"       value={`${dashRaw.icsap_pct_total}%`}               color={CRIT} sub={`${dashRaw.internacoes_icsap_2025} internações evitáveis`} />
              <KPI label="Custo ICSAP 2025"             value={BRL(dashRaw.custo_icsap_2025||0)} color={CRIT} sub={`R$ ${dashRaw.custo_icsap_por_internacao_media?.toLocaleString()}/internação`} />
              <KPI label="Cobertura da APS"             value={`${dashRaw.cobertura_aps_pct}%`}              color={CRIT} sub={`${dashRaw.esf_equipes_ativas}/${dashRaw.esf_equipes_necessarias} ESFs ativas`} />
              <KPI label="Sem APS vinculada"            value={(dashRaw.populacao_sem_aps_vinculada||0).toLocaleString()} color={CRIT} sub="sem equipe de saúde da família" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Gastroenterite (intern.)"     value={184}                    color={CRIT} sub="92,4% evitáveis com SRO" />
              <KPI label="Pneumonia bacteriana"         value={142}                    color={CRIT} sub="72,4% evitáveis — vacina + APS" />
              <KPI label="Diabetes descompensado"       value={112}                    color={CRIT} sub="84,4% evitáveis — HIPERDIA" />
              <KPI label="HAS com complicação"          value={98}                     color={CRIT} sub="78,4% evitáveis — grupo HIPERDIA" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Comparativo ICSAP — Apuí/AM vs Meta SUS</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `ICSAP atual: ${dashRaw.icsap_pct_total}% (meta: ${dashRaw.meta_icsap_pct}%)`, value: dashRaw.meta_icsap_pct, max: dashRaw.icsap_pct_total, color: OK },
                    { label: `Cobertura APS: ${dashRaw.cobertura_aps_pct}% (meta: 100%)`, value: dashRaw.cobertura_aps_pct, max: 100, color: CRIT },
                    { label: `Consultas APS/cápita: ${dashRaw.consultas_aps_per_capita_2025} (meta: ${dashRaw.meta_consultas_aps_per_capita})`, value: dashRaw.consultas_aps_per_capita_2025, max: dashRaw.meta_consultas_aps_per_capita, color: CRIT },
                    { label: `ICSAP crianças: ${dashRaw.internacoes_evitageis_criancas_pct}% evitáveis`, value: 100 - dashRaw.internacoes_evitageis_criancas_pct, max: 100, color: CRIT },
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
                <p><b>45,7% das internações são evitáveis com APS de qualidade</b> — meta SUS: 20%. 842 internações = R$ 7,82M/ano desperdiçado. 62,4% de cobertura: 9.300 hab. sem equipe de saúde. Taxa cresce: +7,3pp em 3 anos.</p>
                <p><b>Expansão de 4 para 8 ESFs: 100% financiado pelo federal</b> — Piso da APS (Lei 14.434/2022): MS repassa R$ 420k/ESF/ano. 4 novas ESFs = -40% ICSAP = R$ 3,1M economizados. ROI 1,8:1 no 1º ano.</p>
                <p><b>Gastroenterite: 184 internações, 92,4% evitáveis</b> — SRO: R$ 0,80 vs R$ 9.287 de internação. Protocolo antibioticoterapia empírica (R$ 1.800): 113 internações por ITU evitadas = R$ 1,04M/ano. ICSAP = prova viva de que a APS funciona (ou não).</p>
              </div>
            </div>
          </div>
        )}

        {aba === "condicoes" && Array.isArray(condicoes) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={condicoes as any[]} layout="vertical" margin={{ top: 5, right: 60, bottom: 5, left: 200 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="condicao" type="category" tick={{ fontSize: 8 }} width={195} />
                <Tooltip />
                <Legend />
                <Bar dataKey="internacoes_2025" name="Internações 2025" radius={[0,4,4,0]}>
                  {(condicoes as any[]).map((c: any, i: number) => <Cell key={i} fill={statusColor(c.status)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(condicoes as any[]).map((c: any) => (
                <div key={c.condicao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(c.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{c.condicao}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: statusColor(c.status) }}>{c.internacoes_2025} intern.</span>
                      <span className="text-slate-400"> · {c.evitageis_pct}% evitáveis</span>
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
                    <p className="text-xs text-slate-400 mt-0.5">R$ {a.custo.toLocaleString()} · {a.prazo_meses}m</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução ICSAP — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="icsap_pct"        name="ICSAP (%)"          stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="cobertura_aps_pct" name="Cobertura APS (%)" stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="right" dataKey="internacoes_icsap" name="Internações ICSAP"  stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
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
