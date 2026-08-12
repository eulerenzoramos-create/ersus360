import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Stethoscope, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function AtencaoPrimariaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["aps-dashboard"], queryFn: () => apiGet("/api/atencao-primaria-apui/dashboard"),      enabled: aba === "dashboard" });
  const { data: equipes }     = useQuery({ queryKey: ["aps-equipes"],   queryFn: () => apiGet("/api/atencao-primaria-apui/equipes"),         enabled: aba === "equipes" });
  const { data: indAps }      = useQuery({ queryKey: ["aps-ind-aps"],   queryFn: () => apiGet("/api/atencao-primaria-apui/indicadores-aps"), enabled: aba === "ind_aps" });
  const { data: historico }   = useQuery({ queryKey: ["aps-hist"],      queryFn: () => apiGet("/api/atencao-primaria-apui/historico"),       enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["aps-ind"],       queryFn: () => apiGet("/api/atencao-primaria-apui/indicadores"),     enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",    icon: <Stethoscope size={15}/> },
    { key: "equipes",    label: "Equipes ESF",  icon: <Activity size={15}/> },
    { key: "ind_aps",    label: "Indicadores APS", icon: <AlertTriangle size={15}/> },
    { key: "historico",  label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Stethoscope size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Atenção Primária / ESF — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Cobertura ESF · ACS · NASF · Puericultura · FMS Apuí/AM</p>
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
              <KPI label="Cobertura ESF"          value={`${dashRaw.cobertura_esf_pct}%`}           color={CRIT} sub={`${dashRaw.equipes_esf_ativas}/${dashRaw.meta_equipes_esf} equipes`} />
              <KPI label="UBS Sem Médico"          value={`${dashRaw.ubs_sem_medico}/${dashRaw.ubs_total}`} color={CRIT} sub={`${dashRaw.ubs_sem_medico_pct}% das UBS`} />
              <KPI label="Microáreas Sem ACS"      value={`${dashRaw.microareas_sem_acs_pct}%`}      color={WARN} sub={`${dashRaw.acs_ativos}/${dashRaw.microareas_total} ativas`} />
              <KPI label="Consultas/Hab/Ano"       value={dashRaw.consultas_hab_ano?.toString()}      color={CRIT} sub={`meta: ${dashRaw.meta_consultas_hab_ano}`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="HIPERDIA Ativo"           value={`${dashRaw.hiperdia_ativo_pct}%`}          color={CRIT} sub={`${dashRaw.hiperdia_cadastrados} cadastrados`} />
              <KPI label="Absenteísmo Médico"       value={`${dashRaw.absenteismo_medico_pct}%`}      color={CRIT} sub="agentes Mais Médicos" />
              <KPI label="Rotatividade Médicos"     value={`${dashRaw.rotatividade_medicos_ano_pct}%`} color={CRIT} sub="ao ano" />
              <KPI label="NASF Equipes"             value={`${dashRaw.nasf_equipes}/${dashRaw.meta_nasf}`} color={WARN} sub="para 8 ESF" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Indicadores de Acesso</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Cobertura ESF (meta 100%)",             value: dashRaw.cobertura_esf_pct,         color: CRIT },
                    { label: "UBS com médico (meta 100%)",            value: 100 - dashRaw.ubs_sem_medico_pct,  color: CRIT },
                    { label: "Microáreas com ACS (meta 100%)",        value: 100 - dashRaw.microareas_sem_acs_pct, color: WARN },
                    { label: "HIPERDIA ativo (meta 85%)",             value: dashRaw.hiperdia_ativo_pct,        color: CRIT },
                    { label: "Visitas domiciliares (meta 100%)",      value: dashRaw.visitas_domiciliares_familias_pct, color: CRIT },
                  ].map((b: any) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-bold" style={{ color: b.color }}>{b.value.toFixed(1)}%</span>
                      </div>
                      <ProgressBar value={b.value} max={100} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>35,8% da população sem ESF</b> — ribeirinhos e assentados rurais. Sem ESF = zero prevenção, HIPERDIA descontrolado, gestante sem pré-natal, criança sem puericultura. Cada equipe não implantada representa 2.000 pessoas sem APS.</p>
                <p><b>3/8 UBS sem médico</b> — Mais Médicos cobre mas rotatividade 42,4%/ano impede vínculo. Vila do Juma e áreas ribeirinhas têm enfermeiro como único profissional prescriptor. Diagnóstico diferencial complexo chega tarde à UPA.</p>
                <p><b>1,8 consultas/hab/ano vs meta 3,0</b> — APS subprodutora força demanda espontânea na UPA. Consulta de acolhimento e agendamento programático (HIPERDIA, pré-natal, puericultura) são preteridos pela urgência do dia.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "equipes" && Array.isArray(equipes) && (
          <div className="space-y-3">
            {(equipes as any[]).map((e: any) => (
              <div key={e.equipe} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(e.status) }} />
                    <div>
                      <p className="font-semibold text-sm text-slate-700">{e.equipe}</p>
                      <p className="text-xs text-slate-400">{e.localidade} · {e.populacao.toLocaleString()} hab</p>
                    </div>
                  </div>
                  <div className="text-xs text-right space-y-0.5 ml-4">
                    <div>Médico: <span className="font-bold" style={{ color: e.medico ? OK : CRIT }}>{e.medico ? "sim" : "não"}</span> | Enf.: <span className="font-bold" style={{ color: e.enfermeiro ? OK : CRIT }}>{e.enfermeiro ? "sim" : "não"}</span></div>
                    <div>ACS: <span className="font-bold" style={{ color: e.acs >= e.acs_meta ? OK : WARN }}>{e.acs}/{e.acs_meta}</span> | NASF: <span style={{ color: e.nasf ? OK : WARN }}>{e.nasf ? "sim" : "não"}</span></div>
                    <div>Consultas/mês: <b>{e.producao_consultas_mes}</b></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "ind_aps" && Array.isArray(indAps) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Indicadores PMAQ / PREVINE BRASIL (%)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={indAps as any[]} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="indicador" tick={{ fontSize: 8 }} width={270} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="resultado_pct" name="Resultado (%)" radius={[0,3,3,0]}>
                    {(indAps as any[]).map((i: any) => <Cell key={i.indicador} fill={statusColor(i.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Atenção Primária (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" tick={{ fontSize: 11 }} unit="%" />
                <YAxis yAxisId="n" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="pct" dataKey="cobertura_esf_pct"     name="Cobertura ESF (%)"     stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="hiperdia_ativo_pct"    name="HIPERDIA ativo (%)"    stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="consultas_hab"         name="Consultas/hab/ano"     stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="equipes_esf"           name="Equipes ESF"           stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="n"   dataKey="ubs_sem_medico"        name="UBS s/ médico"         stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
