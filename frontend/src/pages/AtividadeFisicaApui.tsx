import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Thermometer, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function AtividadeFisicaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["af-dash"],  queryFn: () => apiGet("/api/atividade-fisica-apui/dashboard"),          enabled: aba === "dashboard" });
  const { data: grupos }      = useQuery({ queryKey: ["af-grup"],  queryFn: () => apiGet("/api/atividade-fisica-apui/grupos-populacionais"),enabled: aba === "grupos" });
  const { data: programas }   = useQuery({ queryKey: ["af-prog"],  queryFn: () => apiGet("/api/atividade-fisica-apui/programas"),           enabled: aba === "programas" });
  const { data: historico }   = useQuery({ queryKey: ["af-hist"],  queryFn: () => apiGet("/api/atividade-fisica-apui/historico"),           enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["af-ind"],   queryFn: () => apiGet("/api/atividade-fisica-apui/indicadores"),         enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",           icon: <Thermometer size={15}/> },
    { key: "grupos",      label: "Grupos Populacionais",icon: <Activity size={15}/> },
    { key: "programas",   label: "Programas",           icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",           icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",         icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Thermometer size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Atividade Física e Sedentarismo — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Sedentarismo · Obesidade · Academia da Saúde · Grupos de AF · Receita do Exercício · FMS Apuí/AM</p>
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
              <KPI label="Sedentarismo adultos"     value={`${dashRaw.sedentarismo_adultos_pct}%`}         color={CRIT} sub={`meta: ${dashRaw.meta_sedentarismo_pct}%`} />
              <KPI label="Atividade física sufic."  value={`${dashRaw.atividade_fisica_suficiente_pct}%`}  color={CRIT} sub={`meta: ${dashRaw.meta_atividade_fisica_pct}%`} />
              <KPI label="Obesidade adultos"        value={`${dashRaw.obesidade_adultos_pct}%`}            color={CRIT} sub={`sobrepeso: ${dashRaw.sobrepeso_adultos_pct}%`} />
              <KPI label="Grupos AF no SUS"         value={`${dashRaw.grupos_atividade_fisica_sus}/${dashRaw.meta_grupos_atividade_fisica}`} color={CRIT} sub="grupos ativos" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Academia da Saúde"        value={`${dashRaw.academia_saude_apui}/${dashRaw.meta_academia_saude}`} color={CRIT} sub="polos implantados" />
              <KPI label="Prof. Ed. Física SUS"     value={dashRaw.profissional_educacao_fisica_sus}    color={CRIT} sub="zero no eMulti/NASF" />
              <KPI label="Obesidade infantil 5-9"   value={`${dashRaw.obesidade_infantil_5_9_pct}%`}    color={CRIT} sub={`meta: < 5%`} />
              <KPI label="Mortes por sedentarismo"  value={dashRaw.morte_prematura_doencas_cronicas_sedentarismo_2025} color={CRIT} sub="prematuras em 2025" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Sedentarismo por Grupo — Cobertura Real vs Meta OMS</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Adultos: AF suficiente ${dashRaw.atividade_fisica_suficiente_pct}% vs meta 60%`, value: dashRaw.atividade_fisica_suficiente_pct, max: 100, color: CRIT },
                    { label: `Idosos: AF suficiente ${100-dashRaw.sedentarismo_adultos_pct}% vs meta 60%`,     value: 100-dashRaw.sedentarismo_adultos_pct, max: 100, color: CRIT },
                    { label: `Hipertensos com AF: ${100-dashRaw.hipertenso_sedentario_pct}% vs meta 60%`,      value: 100-dashRaw.hipertenso_sedentario_pct, max: 100, color: CRIT },
                    { label: `Diabéticos com AF: ${100-dashRaw.diabetico_sedentario_pct}% vs meta 60%`,        value: 100-dashRaw.diabetico_sedentario_pct, max: 100, color: CRIT },
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
                <p><b>62,4% dos adultos sedentários (4,2× acima da meta OMS)</b> — 28 mortes prematuras por doenças crônicas associadas ao sedentarismo em 2025. Custo estimado: R$ 2,84M/ano.</p>
                <p><b>Zero Academia da Saúde, zero pista de caminhada, zero prof. de Ed. Física no SUS</b> — municípios com Academia da Saúde têm -18% de internações por HAS/DM. MS financia 80% da implantação (custo municipal: R$ 84.000).</p>
                <p><b>'Receita do Exercício': R$ 1.200 → +1.240 pacientes com AF prescrita</b> — caminhada 30 min/dia equivale a 1 anti-hipertensivo. 7 grupos de AF adicionais: R$ 4.800 (material). ROI: R$ 3,20 economizados por R$ 1 investido em AF na APS (OMS).</p>
              </div>
            </div>
          </div>
        )}

        {aba === "grupos" && Array.isArray(grupos) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={grupos as any[]} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="grupo" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0,100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="sedentarismo_pct" name="Sedentarismo %" fill={CRIT} radius={[4,4,0,0]}>
                  {(grupos as any[]).map((_: any, i: number) => <Cell key={i} fill={CRIT} />)}
                </Bar>
                <Bar dataKey="atividade_suficiente_pct" name="AF Suficiente %" fill={OK} radius={[4,4,0,0]} />
                <Bar dataKey="obesidade_pct" name="Obesidade %" fill={WARN} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(grupos as any[]).map((g: any) => (
                <div key={g.grupo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(g.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{g.grupo}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: statusColor(g.status) }}>Sed: {g.sedentarismo_pct}%</span>
                      <span className="text-slate-400"> · Ob: {g.obesidade_pct}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{g.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "programas" && Array.isArray(programas) && (
          <div className="grid gap-3">
            {(programas as any[]).map((p: any) => (
              <div key={p.programa} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: p.implementado ? OK : CRIT }} />
                    <p className="font-semibold text-sm text-slate-700">{p.programa}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.implementado ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {p.implementado ? "Implementado" : "Não implementado"}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">R$ {p.custo.toLocaleString()} · {p.prazo_meses}m</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{p.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Atividade Física e Obesidade — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="sedentarismo_pct" name="Sedentarismo (%)" stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="obesidade_pct"    name="Obesidade (%)"    stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="grupos_af"        name="Grupos AF (SUS)"  stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
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
