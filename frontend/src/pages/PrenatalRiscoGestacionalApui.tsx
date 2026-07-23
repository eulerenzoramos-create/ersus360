import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Syringe, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function PrenatalRiscoGestacionalApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["pnt-dash"],  queryFn: () => apiGet("/api/prenatal-risco-gestacional-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: gestantes }   = useQuery({ queryKey: ["pnt-gest"],  queryFn: () => apiGet("/api/prenatal-risco-gestacional-apui/gestantes"),   enabled: aba === "gestantes" });
  const { data: acoes }       = useQuery({ queryKey: ["pnt-acao"],  queryFn: () => apiGet("/api/prenatal-risco-gestacional-apui/acoes"),       enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["pnt-hist"],  queryFn: () => apiGet("/api/prenatal-risco-gestacional-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["pnt-ind"],   queryFn: () => apiGet("/api/prenatal-risco-gestacional-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Syringe size={15}/> },
    { key: "gestantes",   label: "Gestantes",  icon: <Activity size={15}/> },
    { key: "acoes",       label: "Ações",      icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Syringe size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Pré-Natal e Risco Gestacional — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Rede Cegonha · MATEP · Sífilis Congênita · Tele-Obstetrícia · Barco-Saúde · Óbito Materno · FMS Apuí/AM</p>
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
              <KPI label="Razão Mortalidade Materna"     value={`${dashRaw.razao_mortalidade_materna_100k}/100k`}    color={CRIT} sub={`meta: ${dashRaw.meta_rmm_100k}/100k NV`} />
              <KPI label="Óbitos maternos 2025"          value={dashRaw.obitos_maternos_2025}                        color={CRIT} sub="2 hemorragia · 1 eclâmpsia · 1 infecção" />
              <KPI label="Pré-natal ≥ 7 consultas"       value={`${dashRaw.prenatal_7_consultas_pct}%`}              color={CRIT} sub={`meta: ${dashRaw.meta_prenatal_7_consultas_pct}%`} />
              <KPI label="Sífilis congênita 2025"        value={dashRaw.sifilis_congenita_2025}                      color={CRIT} sub="meta: zero" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Natimortos 2025"               value={`${dashRaw.natimortos_2025} (${dashRaw.taxa_natimortalidade_1000}/1.000)`} color={CRIT} sub={`meta: ${dashRaw.meta_natimortalidade_1000}/1.000`} />
              <KPI label="Gestantes adolescentes"        value={`${dashRaw.gestantes_adolescentes_pct}% (${dashRaw.gestantes_adolescentes_n})`} color={CRIT} sub="3× a média nacional" />
              <KPI label="Partos domiciliares sem assist." value={dashRaw.parto_domiciliar_sem_assistencia_2025}     color={CRIT} sub={`de ${dashRaw.parto_domiciliar_2025} domiciliares`} />
              <KPI label="Obstetra em Apuí"              value={dashRaw.obstetra_apui}                               color={CRIT} sub="zero especialistas" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Qualidade do Pré-Natal — Apuí/AM</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Pré-natal ≥ 7 consultas: ${dashRaw.prenatal_7_consultas_pct}% (meta 100%)`, value: dashRaw.prenatal_7_consultas_pct, max: 100, color: CRIT },
                    { label: `1ª consulta até 12 semanas: ${dashRaw.prenatal_1a_consulta_ate_12s_pct}% (meta 100%)`, value: dashRaw.prenatal_1a_consulta_ate_12s_pct, max: 100, color: CRIT },
                    { label: `TARV em gestantes HIV+: ${dashRaw.tarv_gestante_em_uso_pct}% (meta 100%)`, value: dashRaw.tarv_gestante_em_uso_pct, max: 100, color: CRIT },
                    { label: `Cesáreas: ${dashRaw.cesarea_pct}% (meta OMS: ${dashRaw.meta_cesarea_pct}%)`, value: dashRaw.meta_cesarea_pct, max: dashRaw.cesarea_pct, color: OK },
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
                <p><b>763,4/100k NV — 25,4× acima da meta</b> — 4 óbitos maternos em 2025 (2 por hemorragia, 1 eclâmpsia, 1 infecção). MATEP: previne hemorragia em 60% → 2 vidas salvas/ano. Custo: R$ 8.400 (treinamento toda equipe do HMM).</p>
                <p><b>42 casos de sífilis congênita (meta: zero)</b> — cada caso = falha do pré-natal. VDRL + penicilina: R$ 18,60/gestante tratada. R$ 4.200 elimina em 12 meses vs R$ 3,53M em tratamento dos 42 casos.</p>
                <p><b>290 gestantes ribeirinhas/indígenas com pré-natal 8,4% adequado</b> — 28 partos sem assistência. Barco-saúde: R$ 42k/ano, 8 comunidades/mês, -50% natimortalidade ribeirinha. Tele-obstetrícia: R$ 14k, resolve 176 gestantes de alto risco sem obstetra.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "gestantes" && Array.isArray(gestantes) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={gestantes as any[]} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="grupo" tick={{ fontSize: 8 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="prenatal_adequado_pct"    name="Pré-natal adequado (%)" radius={[4,4,0,0]}>
                  {(gestantes as any[]).map((g: any, i: number) => <Cell key={i} fill={statusColor(g.status)} />)}
                </Bar>
                <Bar dataKey="1a_consulta_ate_12s_pct"  name="1ª consult. ≤ 12s (%)"  radius={[4,4,0,0]} fill={ACCENT} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(gestantes as any[]).map((g: any) => (
                <div key={g.grupo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(g.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{g.grupo}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: statusColor(g.status) }}>{g.n} gestantes</span>
                      <span className="text-slate-400"> · {g.prenatal_adequado_pct}% pré-natal adequado</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{g.observacao}</p>
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
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Pré-Natal — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="prenatal_7_pct"     name="Pré-natal ≥7 (%)"    stroke={OK}    strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" dataKey="obitos_maternos"     name="Óbitos maternos"     stroke={CRIT}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" dataKey="sifilis_congenita"   name="Sífilis congênita"   stroke={WARN}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="right" dataKey="natimortos"          name="Natimortos"          stroke={BRAND} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
