import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { BarChart2, AlertTriangle, TrendingUp, Activity } from "lucide-react";

const BRAND  = "#1e3a5f";
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

export default function PlanejamentoSaudeApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }       = useQuery({ queryKey: ["plan-dashboard"], queryFn: () => apiGet("/api/planejamento-saude-apui/dashboard"),     enabled: aba === "dashboard" });
  const { data: previne }    = useQuery({ queryKey: ["plan-previne"],   queryFn: () => apiGet("/api/planejamento-saude-apui/previne-brasil"), enabled: aba === "previne" });
  const { data: idsus }      = useQuery({ queryKey: ["plan-idsus"],     queryFn: () => apiGet("/api/planejamento-saude-apui/idsus"),          enabled: aba === "idsus" });
  const { data: historico }  = useQuery({ queryKey: ["plan-hist"],      queryFn: () => apiGet("/api/planejamento-saude-apui/historico"),      enabled: aba === "historico" });
  const { data: indicadores }= useQuery({ queryKey: ["plan-ind"],       queryFn: () => apiGet("/api/planejamento-saude-apui/indicadores"),    enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",       icon: <BarChart2 size={15}/> },
    { key: "previne",     label: "Previne Brasil",   icon: <Activity size={15}/> },
    { key: "idsus",       label: "IDSUS",            icon: <Activity size={15}/> },
    { key: "historico",   label: "Histórico",        icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",      icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <BarChart2 size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Planejamento e Monitoramento — Apuí/AM</h1>
            <p className="text-sm text-slate-500">PMS · Previne Brasil · IDSUS · RAG · CMS · FMS Apuí/AM</p>
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
              <KPI label="Previne Brasil — metas"    value={`${dashRaw.previne_brasil_meta_atingida}/${dashRaw.previne_brasil_indicadores_total}`} color={CRIT} sub={`${dashRaw.previne_brasil_meta_atingida_pct}% atingidas`} />
              <KPI label="IDSUS municipal"            value={`${dashRaw.idsus_nota_municipio}`}                                                    color={WARN} sub={`AM: ${dashRaw.idsus_media_am} · BR: ${dashRaw.idsus_media_brasil}`} />
              <KPI label="Metas PMS atingidas"        value={`${dashRaw.metas_pms_atingidas_pct}%`}                                                color={WARN} sub={`PMS ${dashRaw.pms_vigente}`} />
              <KPI label="Reuniões CMS 2025"          value={`${dashRaw.cms_reunioes_realizadas_2025}/${dashRaw.cms_reunioes_previstas_2025}`}      color={WARN} sub={`Delib. implementadas: ${dashRaw.cms_deliberacoes_implementadas_pct}%`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="PMS aprovado pelo CMS"     value={dashRaw.pms_aprovado_cms ? "Sim" : "Não"}          color={OK}   sub={`Vigência: ${dashRaw.pms_vigente}`} />
              <KPI label="RAG 2024 entregue"          value={dashRaw.rag_2024_entregue ? "Sim" : "Não"}         color={OK}   sub={dashRaw.rag_2024_prazo} />
              <KPI label="COAP com SES-AM"            value={dashRaw.coap_vigente ? "Ativo" : "Não assinado"}   color={WARN} sub={dashRaw.coap_status} />
              <KPI label="Indicadores monitorados"    value={`${dashRaw.indicadores_monitorados_mensalmente}/${dashRaw.indicadores_pms_total}`} color={WARN} sub="mensalmente" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Painel de Planejamento</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Previne Brasil — metas atingidas (meta: 80%)",  value: dashRaw.previne_brasil_meta_atingida_pct, color: CRIT },
                    { label: "IDSUS (meta: 5,6 pts — escala 10)",             value: dashRaw.idsus_nota_municipio * 10,        color: WARN },
                    { label: "Metas PMS atingidas (meta: 80%)",               value: dashRaw.metas_pms_atingidas_pct,          color: WARN },
                    { label: "Delib. CMS implementadas (meta: 80%)",          value: dashRaw.cms_deliberacoes_implementadas_pct, color: WARN },
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
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex flex-col gap-2 justify-center">
                <p><b>28,6% das metas Previne Brasil atingidas</b> — cada indicador abaixo da meta = redução do repasse PAB. Perda estimada 2025: R$ 280k em incentivos federais não captados. Municípios de porte similar com equipe completa atingem 60-70% das metas.</p>
                <p><b>IDSUS 4,2 — 1,4 pontos abaixo da média nacional</b> — tendência de melhora lenta (0,1/ano). No ritmo atual, Apuí atingirá a média nacional em 2040. Atenção Hospitalar nota 3,6: pior componente — sem UTI, 28 leitos (meta 62).</p>
                <p><b>COAP não assinado com SES-AM</b> — sem Contrato Organizativo, referência e contrarreferência não têm responsabilidades formalizadas. Paciente transferido para Humaitá/Manaus sem garantia de vaga ou retorno com resumo de alta.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "previne" && Array.isArray(previne) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-2">
              <h3 className="font-semibold text-slate-700 mb-3">Previne Brasil — Resultado vs Meta</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={previne as any[]} layout="vertical" margin={{ left: 200, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10 }} unit="%" domain={[0, 110]} />
                  <YAxis dataKey="indicador" type="category" tick={{ fontSize: 10 }} width={200} />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="resultado_pct" name="Resultado (%)" >
                    {(previne as any[]).map((p: any) => (
                      <Cell key={p.indicador} fill={statusColor(p.status)} />
                    ))}
                  </Bar>
                  <Bar dataKey="meta_pct" name="Meta (%)" fill="#cbd5e1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {(previne as any[]).map((p: any) => (
              <div key={p.indicador} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(p.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{p.indicador}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: statusColor(p.status) }}>{p.resultado_pct}%</span>
                    <p className="text-xs text-slate-400">meta: {p.meta_pct}%</p>
                  </div>
                </div>
                <div className="ml-5 mb-2">
                  <ProgressBar value={p.resultado_pct} max={p.meta_pct} color={statusColor(p.status)} />
                </div>
                <p className="text-xs text-slate-500 ml-5">{p.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "idsus" && Array.isArray(idsus) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-2">
              <h3 className="font-semibold text-slate-700 mb-3">IDSUS — Notas por Componente (Apuí vs AM)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={idsus as any[]} layout="vertical" margin={{ left: 140, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 7]} />
                  <YAxis dataKey="componente" type="category" tick={{ fontSize: 10 }} width={140} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="nota"     name="Apuí" >
                    {(idsus as any[]).map((c: any) => (
                      <Cell key={c.componente} fill={statusColor(c.status)} />
                    ))}
                  </Bar>
                  <Bar dataKey="media_am" name="Média AM" fill="#94a3b8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {(idsus as any[]).map((c: any) => (
              <div key={c.componente} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(c.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{c.componente}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: statusColor(c.status) }}>{c.nota}</span>
                    <span className="text-slate-400 text-xs"> / AM: {c.media_am}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{c.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Planejamento — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="idsus"            name="IDSUS"                    stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="previne_meta_pct" name="Previne — metas (%)"      stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="metas_pms_pct"    name="Metas PMS (%)"            stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
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
