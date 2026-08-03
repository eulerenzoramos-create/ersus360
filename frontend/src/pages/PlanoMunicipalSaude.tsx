import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { BookOpen, AlertTriangle, Target, Activity } from "lucide-react";
import { BRL, BRL_AXIS, PCT } from "../lib/fmt";

const BRAND  = "#dbeafe";
const ACCENT = "#2563eb";
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
    <div className="h-2.5 rounded-full transition-all" style={{ width: `${Math.min(value / max * 100, 100)}%`, background: color }} />
  </div>
);

const EIXO_COLORS = ["#2563eb","#7c3aed","#0891b2","#16a34a","#dc2626"];

export default function PlanoMunicipalSaude() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }    = useQuery({ queryKey: ["pms-dashboard"], queryFn: () => apiGet("/api/plano-municipal-saude/dashboard"), enabled: aba === "dashboard" });
  const { data: eixos }   = useQuery({ queryKey: ["pms-eixos"],     queryFn: () => apiGet("/api/plano-municipal-saude/eixos"),     enabled: aba === "eixos" });
  const { data: metas }   = useQuery({ queryKey: ["pms-metas"],     queryFn: () => apiGet("/api/plano-municipal-saude/metas-destaque"), enabled: aba === "metas" });
  const { data: historico }= useQuery({ queryKey: ["pms-hist"],     queryFn: () => apiGet("/api/plano-municipal-saude/historico-monitoramento"), enabled: aba === "historico" });
  const { data: indicadores }= useQuery({ queryKey: ["pms-ind"],   queryFn: () => apiGet("/api/plano-municipal-saude/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",      icon: <BookOpen size={15}/> },
    { key: "eixos",      label: "Eixos",          icon: <Target size={15}/> },
    { key: "metas",      label: "Metas Destaque", icon: <Target size={15}/> },
    { key: "historico",  label: "Monitoramento",  icon: <Activity size={15}/> },
    { key: "indicadores",label: "Indicadores",    icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <BookOpen size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Plano Municipal de Saúde</h1>
            <p className="text-sm text-slate-500">PMS 2022–2025 · 5 Eixos · 78 Metas · RAG · RADC · FMS Apuí/AM</p>
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
              <KPI label="Metas Totais"        value={dashRaw.metas_total.toString()} />
              <KPI label="Metas Cumpridas"     value={dashRaw.metas_cumpridas.toString()} color={OK} />
              <KPI label="Em Andamento"        value={dashRaw.metas_em_andamento.toString()} color={WARN} />
              <KPI label="Atrasadas/Não Inic." value={`${dashRaw.metas_atrasadas + dashRaw.metas_nao_iniciadas}`} color={CRIT} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Cumprimento Geral"   value={`${dashRaw.percentual_cumprimento_geral}%`} color={dashRaw.percentual_cumprimento_geral >= 70 ? OK : dashRaw.percentual_cumprimento_geral >= 50 ? WARN : CRIT} sub="PMS 2022–2025" />
              <KPI label="Eixos"               value={dashRaw.eixos_total.toString()} />
              <KPI label="RAG Aprovado"        value={dashRaw.rag_aprovado ? "Sim" : "Não"} color={dashRaw.rag_aprovado ? OK : CRIT} sub="CMS" />
              <KPI label="RADC em Dia"         value={dashRaw.radc_em_dia ? "Sim" : "Não"} color={dashRaw.radc_em_dia ? OK : CRIT} sub="quadrimestral" />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-3">Cumprimento Geral do PMS</h3>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">{dashRaw.metas_cumpridas} cumpridas de {dashRaw.metas_total}</span>
                <span className="font-bold" style={{ color: CRIT }}>{dashRaw.percentual_cumprimento_geral}%</span>
              </div>
              <ProgressBar value={dashRaw.percentual_cumprimento_geral} max={100} color={CRIT} />
              <p className="text-xs text-slate-400 mt-2">Período: 2022–2025 · Avaliação: 2º Quadrimestre/2025</p>
            </div>
          </div>
        )}

        {aba === "eixos" && Array.isArray(eixos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Cumprimento por Eixo (%)</h3>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={eixos} layout="vertical" margin={{ left: 10, right: 50 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} unit="%" />
                  <YAxis type="category" dataKey="eixo" tick={{ fontSize: 8 }} width={250} />
                  <Tooltip />
                  <Bar dataKey="percentual_cumprimento" name="Cumprimento %" radius={[0,3,3,0]}>
                    {(eixos as any[]).map((e: any) => <Cell key={e.eixo} fill={statusColor(e.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(eixos as any[]).map((eixo: any, i: number) => (
                <div key={eixo.eixo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: EIXO_COLORS[i % EIXO_COLORS.length] }} />
                      <span className="font-semibold text-slate-700 text-sm">{eixo.eixo}</span>
                    </div>
                    <span className="font-bold text-sm" style={{ color: statusColor(eixo.status) }}>{eixo.percentual_cumprimento}%</span>
                  </div>
                  <ProgressBar value={eixo.percentual_cumprimento} max={100} color={statusColor(eixo.status)} />
                  <div className="flex gap-4 mt-2 text-xs text-slate-500">
                    <span style={{ color: OK }}>Cumpridas: <b>{eixo.metas_cumpridas}</b></span>
                    <span style={{ color: WARN }}>Andamento: <b>{eixo.metas_em_andamento}</b></span>
                    <span style={{ color: CRIT }}>Atrasadas: <b>{eixo.metas_atrasadas}</b></span>
                    <span>Total: <b>{eixo.metas_total}</b></span>
                  </div>
                  <div className="mt-2 space-y-0.5">
                    {eixo.destaques.map((d: string) => <p key={d} className="text-xs text-slate-500">• {d}</p>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "metas" && Array.isArray(metas) && (
          <div className="grid gap-3">
            {(metas as any[]).map((m: any) => (
              <div key={m.meta} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-700 text-sm">{m.meta}</p>
                    <p className="text-xs text-slate-400">{m.eixo} · Prazo: {m.prazo}</p>
                  </div>
                  <span className="font-bold text-sm" style={{ color: statusColor(m.status) }}>
                    {m.progresso_pct === 100 ? "✓ Cumprida" : PCT(m.progresso_pct)}
                  </span>
                </div>
                <ProgressBar value={m.progresso_pct} max={100} color={statusColor(m.status)} />
                <div className="flex gap-4 mt-2 text-xs text-slate-500">
                  <span>Baseline: <b>{m.baseline}</b></span>
                  <span>Atual: <b>{m.atual}</b></span>
                  <span>Meta: <b>{m.meta_valor}</b></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Quadrimestral — PMS 2022–2025</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="quadrimestre" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Legend />
                <Bar dataKey="cumpridas_pct"    name="Cumpridas %"    fill={OK}    stackId="a" />
                <Bar dataKey="em_andamento_pct" name="Em Andamento %"  fill={WARN}  stackId="a" />
                <Bar dataKey="atrasadas_pct"    name="Atrasadas %"     fill={CRIT}  stackId="a" />
              </BarChart>
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
                      {`${ind.valor} ${ind.unidade}`}{ind.meta != null ? ` / meta: ${ind.meta} ${ind.unidade}` : ""}
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
