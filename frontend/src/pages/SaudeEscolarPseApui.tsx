import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { School, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function SaudeEscolarPseApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["pse-dash"],  queryFn: () => apiGet("/api/saude-escolar-pse-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: acoesPse }    = useQuery({ queryKey: ["pse-acao"],  queryFn: () => apiGet("/api/saude-escolar-pse-apui/acoes-pse"),  enabled: aba === "acoes" });
  const { data: programas }   = useQuery({ queryKey: ["pse-prog"],  queryFn: () => apiGet("/api/saude-escolar-pse-apui/programas"),  enabled: aba === "programas" });
  const { data: historico }   = useQuery({ queryKey: ["pse-hist"],  queryFn: () => apiGet("/api/saude-escolar-pse-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["pse-ind"],   queryFn: () => apiGet("/api/saude-escolar-pse-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <School size={15}/> },
    { key: "acoes",       label: "Ações PSE",  icon: <Activity size={15}/> },
    { key: "programas",   label: "Programas",  icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <School size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Escolar e PSE — Apuí/AM</h1>
            <p className="text-sm text-slate-500">PSE · Triagem Visual · Saúde Bucal · Gravidez Adolescente · Evasão · FMS Apuí/AM</p>
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
              <KPI label="Alunos matriculados 2025"       value={(dashRaw.alunos_matriculados_2025||0).toLocaleString()}   color={ACCENT} sub="18 escolas municipais + 4 estaduais" />
              <KPI label="Cobertura PSE (meta: 100%)"     value={`${dashRaw.pse_cobertura_pct}%`}                          color={CRIT}   sub={`${dashRaw.escolas_pse_adesao} de ${dashRaw.meta_escolas_pse} escolas com adesão`} />
              <KPI label="Cárie ativa (alunos triados)"   value={`${dashRaw.alunos_carie_ativa_pct}%`}                     color={CRIT}   sub={`${dashRaw.alunos_carie_ativa} alunos — apenas ${dashRaw.alunos_tratamento_concluido_pct}% concluíram`} />
              <KPI label="Gravidez na adolescência 2025"  value={dashRaw.alunos_gravidez_escolar_2025}                     color={CRIT}   sub={`${dashRaw.alunos_gravidez_escolar_menores_15} em < 15 anos`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Evasão escolar"                 value={`${dashRaw.evasao_escolar_pct}%`}                         color={CRIT}   sub={`${dashRaw.evasao_por_trabalho_infantil_pct}% trabalho infantil`} />
              <KPI label="Deficiência visual detectada"   value={dashRaw.alunos_deficiencia_visual_detectada}              color={WARN}   sub={`${dashRaw.alunos_oculos_necessitam} precisam de óculos — ${dashRaw.alunos_oculos_fornecidos} receberam`} />
              <KPI label="Obesidade escolar"              value={`${dashRaw.obesidade_escolar_pct}%`}                      color={WARN}   sub={`+ ${dashRaw.sobrepeso_escolar_pct}% sobrepeso`} />
              <KPI label="Abuso sexual suspeitas 2025"    value={dashRaw.alunos_abuso_sexual_suspeita_2025}                color={CRIT}   sub={`${dashRaw.abuso_sexual_notificado_2025} notificados (subnotif. 71,4%)`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Situação dos Programas Escolares</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `PSE cobertura: ${dashRaw.pse_cobertura_pct}% (meta 100%)`,    value: dashRaw.pse_cobertura_pct,         max: 100,  color: CRIT },
                    { label: `Tratamento bucal concluído: ${dashRaw.alunos_tratamento_concluido_pct}%`, value: dashRaw.alunos_tratamento_concluido_pct, max: 100, color: CRIT },
                    { label: `Óculos fornecidos: ${dashRaw.alunos_oculos_fornecidos} de ${dashRaw.alunos_oculos_necessitam}`, value: dashRaw.alunos_oculos_fornecidos, max: dashRaw.alunos_oculos_necessitam, color: CRIT },
                    { label: `Bullying — vítimas estimadas: ${dashRaw.alunos_bullying_vitima_pct}%`, value: dashRaw.alunos_bullying_vitima_pct, max: 100, color: WARN },
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
                <p><b>36,4% de cobertura PSE</b> — MS repassa R$ 605k/ano para adesão plena de 22 escolas. Custo de ampliação: R$ 0. Reunião gestores saúde + educação = termo de adesão em 1 semana.</p>
                <p><b>52,9% de cárie ativa</b> — 1.284 alunos com cárie. Escovação supervisionada + flúor: R$ 18k vs R$ 107k de tratamento (ROI 6:1). Dentista escolar: zero em Apuí.</p>
                <p><b>42 gravidezes escolares</b> (8 em menores de 15 anos = estupro de vulnerável — zero notificados como crime). 14,4% de evasão escolar: 42,4% por trabalho infantil no garimpo. PETI: R$ 0 municipal.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "acoes" && Array.isArray(acoesPse) && (
          <div className="grid gap-3">
            {(acoesPse as any[]).map((a: any) => (
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
                    <p className="text-xs text-slate-400 mt-0.5">R$ {a.custo.toLocaleString()} · {a.prazo_meses}m · {a.escolas_alcancadas} escolas · {(a.alunos_beneficiados||0).toLocaleString()} alunos</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "programas" && Array.isArray(programas) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={programas as any[]} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="programa" tick={{ fontSize: 8 }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="cobertura_pct" name="Cobertura atual (%)" radius={[4,4,0,0]}>
                  {(programas as any[]).map((p: any, i: number) => <Cell key={i} fill={p.status === "ausente" ? CRIT : p.status === "parcial" ? WARN : OK} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(programas as any[]).map((p: any) => (
                <div key={p.programa} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: p.status === "ausente" ? CRIT : p.status === "parcial" ? WARN : OK }} />
                      <p className="font-semibold text-sm text-slate-700">{p.programa}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm" style={{ color: p.status === "ausente" ? CRIT : p.status === "parcial" ? WARN : OK }}>
                        {p.cobertura_pct}% / meta {p.meta_pct}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{p.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Saúde Escolar — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="pse_cobertura_pct"  name="PSE cobertura (%)"          stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="carie_ativa_pct"    name="Cárie ativa (%)"             stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="right" dataKey="gravidez_escolar"   name="Gravidez escolar (casos)"    stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="evasao_pct"         name="Evasão escolar (%)"          stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
