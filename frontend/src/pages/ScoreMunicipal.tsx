import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Star, AlertTriangle, TrendingUp, Activity, Bot, Clock, User, Zap } from "lucide-react";

const BRAND  = "#1e3a5f";
const ACCENT = "#2563eb";
const OK     = "#16a34a";
const WARN   = "#d97706";
const CRIT   = "#dc2626";

function scoreColor(s: number) {
  if (s >= 70) return OK;
  if (s >= 50) return WARN;
  return CRIT;
}

const KPI = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-bold mt-1" style={{ color: color || BRAND }}>{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </div>
);

export default function ScoreMunicipal() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }      = useQuery({ queryKey: ["sm-dashboard"], queryFn: () => apiGet("/api/score-municipal/dashboard"), enabled: aba === "dashboard" });
  const { data: dimensoes } = useQuery({ queryKey: ["sm-dimensoes"], queryFn: () => apiGet("/api/score-municipal/dimensoes"),  enabled: aba === "dimensoes" });
  const { data: historico } = useQuery({ queryKey: ["sm-historico"], queryFn: () => apiGet("/api/score-municipal/historico"),  enabled: aba === "historico" });
  const { data: comparativo }= useQuery({ queryKey: ["sm-comp"],    queryFn: () => apiGet("/api/score-municipal/comparativo"), enabled: aba === "comparativo" });
  const { data: indicadores }= useQuery({ queryKey: ["sm-ind"],     queryFn: () => apiGet("/api/score-municipal/indicadores"), enabled: aba === "indicadores" });
  const { data: recomendacoes, isLoading: loadingRec } = useQuery({ queryKey: ["sm-rec-ia"], queryFn: () => apiGet("/api/score-municipal/recomendacoes-ia"), enabled: aba === "recomendacoes", staleTime: 5 * 60 * 1000 });

  const dashRaw = dash as any;
  const compRaw = comparativo as any;

  const recRaw = recomendacoes as any;

  const urgColor = (u: string) => u === "critico" ? CRIT : u === "alto" ? WARN : "#0891b2";
  const prazoIcon = (p: string) => p?.includes("30") ? "🔴" : p?.includes("60") ? "🟠" : p?.includes("90") ? "🟡" : "🔵";

  const ABAS = [
    { key: "dashboard",      label: "Dashboard",        icon: <Star size={15}/> },
    { key: "dimensoes",      label: "Dimensões",        icon: <Activity size={15}/> },
    { key: "historico",      label: "Evolução",         icon: <TrendingUp size={15}/> },
    { key: "comparativo",    label: "Comparativo",      icon: <TrendingUp size={15}/> },
    { key: "indicadores",    label: "Indicadores",      icon: <AlertTriangle size={15}/> },
    { key: "recomendacoes",  label: "Recomendações IA", icon: <Bot size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Star size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Score / Diagnóstico Municipal ERSUS 360</h1>
            <p className="text-sm text-slate-500">8 Dimensões · Ranking AM · Evolução · Comparativo · FMS Apuí/AM</p>
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
            <div className="flex flex-col md:flex-row gap-6">
              <div className="bg-white rounded-2xl border-2 p-8 flex flex-col items-center justify-center min-w-[200px] shadow-sm"
                style={{ borderColor: scoreColor(dashRaw.score_geral) }}>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mb-2">SCORE GERAL</p>
                <p className="text-7xl font-black" style={{ color: scoreColor(dashRaw.score_geral) }}>{dashRaw.score_geral}</p>
                <p className="text-sm font-semibold mt-1 text-slate-600">{dashRaw.categoria}</p>
                <p className="text-xs text-slate-400 mt-1">{dashRaw.ranking_am}º / {dashRaw.total_municipios_am} municípios AM</p>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                <KPI label="Melhor Dimensão"   value={dashRaw.dimensao_melhor}   sub={`${dashRaw.score_melhor} pts`} color={OK} />
                <KPI label="Pior Dimensão"     value={dashRaw.dimensao_pior}     sub={`${dashRaw.score_pior} pts`}  color={CRIT} />
                <KPI label="Evolução 3 anos"   value={`+${dashRaw.evolucao_3anos} pts`} color={OK} sub="2022→2025" />
                <KPI label="Média AM"          value={`${dashRaw.media_am} pts`} color={WARN} sub="outros 62 municípios" />
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <b>Score 50,2 — categoria Moderado.</b> Acima da média estadual (48,6) mas longe da meta de 70 pontos. Saúde Mental (38,4) e RH (41,2) são os maiores gargalos. Evolução positiva: +12 pontos em 3 anos.
            </div>
          </div>
        )}

        {aba === "dimensoes" && Array.isArray(dimensoes) && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-4">Radar — Score por Dimensão</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={(dimensoes as any[]).map((d: any) => ({ dimensao: d.dimensao.split("—")[0].trim().substring(0, 18), score: d.score }))}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="dimensao" tick={{ fontSize: 9 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8 }} />
                    <Radar dataKey="score" fill={ACCENT} fillOpacity={0.35} stroke={ACCENT} strokeWidth={2} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-4">Score por Dimensão</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={dimensoes} layout="vertical" margin={{ left: 10, right: 40 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <YAxis type="category" dataKey="dimensao" tick={{ fontSize: 7 }} width={190} />
                    <Tooltip />
                    <Bar dataKey="score" name="Score" radius={[0,3,3,0]}>
                      {(dimensoes as any[]).map((d: any) => <Cell key={d.dimensao} fill={scoreColor(d.score)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="grid gap-3">
              {(dimensoes as any[]).map((dim: any) => (
                <div key={dim.dimensao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: dim.cor }} />
                      <span className="font-semibold text-slate-700 text-sm">{dim.dimensao}</span>
                      <span className="text-xs text-slate-400">peso {dim.peso}%</span>
                    </div>
                    <span className="font-bold text-lg" style={{ color: scoreColor(dim.score) }}>{dim.score}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                    <div className="h-2 rounded-full" style={{ width: `${dim.score}%`, background: scoreColor(dim.score) }} />
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {dim.subdimensoes.map((sub: any) => (
                      <div key={sub.item} className="flex justify-between text-xs text-slate-500">
                        <span>{sub.item}</span>
                        <span className="font-bold" style={{ color: scoreColor(sub.score) }}>{sub.score.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução do Score — 2022 a 2025</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis domain={[30, 70]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="score_geral"     name="Score Geral"        stroke={BRAND}  strokeWidth={3} dot={{ r: 5 }} />
                <Line dataKey="aps"             name="APS"                stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="vigilancia"      name="Vigilância"         stroke="#7c3aed" strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="mulher_crianca"  name="Mulher/Criança"     stroke="#db2777" strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="dcnt"            name="DCNT"               stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {aba === "comparativo" && compRaw && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Score Apuí"        value={compRaw.score_apui.toString()}    color={scoreColor(compRaw.score_apui)} />
              <KPI label="Média AM"          value={compRaw.media_am.toString()}      color={WARN} />
              <KPI label="Mediana AM"        value={compRaw.mediana_am.toString()}    />
              <KPI label="Melhor AM"         value={compRaw.melhor_am.toString()}     color={OK} />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Posição de Apuí no Estado do Amazonas</h3>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={[
                  { label: "Pior AM",   valor: compRaw.pior_am },
                  { label: "Mediana AM",valor: compRaw.mediana_am },
                  { label: "Apuí",      valor: compRaw.score_apui },
                  { label: "Média AM",  valor: compRaw.media_am },
                  { label: "Melhor AM", valor: compRaw.melhor_am },
                ]} layout="vertical" margin={{ left: 10, right: 40 }}>
                  <XAxis type="number" domain={[0, 80]} tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 9 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="valor" name="Score" radius={[0,3,3,0]}>
                    <Cell fill={CRIT} />
                    <Cell fill={WARN} />
                    <Cell fill={ACCENT} />
                    <Cell fill={WARN} />
                    <Cell fill={OK} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-500 mt-3">Apuí: {compRaw.ranking_am}º lugar entre {compRaw.total_municipios_am} municípios — categoria <b>{compRaw.categoria}</b></p>
            </div>
          </div>
        )}

        {aba === "indicadores" && Array.isArray(indicadores) && (
          <div className="grid gap-3">
            {(indicadores as any[]).map((ind: any) => (
              <div key={ind.indicador} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-4">
                <div className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: ind.status === "ok" ? OK : ind.status === "atencao" ? WARN : CRIT }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 text-sm">{ind.indicador}</span>
                    <span className="font-bold text-sm" style={{ color: ind.status === "ok" ? OK : ind.status === "atencao" ? WARN : CRIT }}>
                      {`${ind.valor} ${ind.unidade}`}{ind.meta != null ? ` / meta: ${ind.meta} ${ind.unidade}` : ""}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{ind.observacao}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "recomendacoes" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}>
              <Bot size={20} color={ACCENT} />
              <div>
                <p className="text-sm font-semibold text-blue-800">Recomendações geradas por IA (Claude)</p>
                <p className="text-xs text-blue-600">Análise automática das 8 dimensões do score com priorização por impacto e urgência</p>
              </div>
              {recRaw?.fonte === "ia" && (
                <span className="ml-auto text-xs bg-blue-600 text-white px-2 py-1 rounded-full">IA Ativa</span>
              )}
              {recRaw?.fonte === "referencia" && (
                <span className="ml-auto text-xs bg-slate-400 text-white px-2 py-1 rounded-full">Dados de Referência</span>
              )}
            </div>

            {loadingRec && (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-sm text-slate-500">IA analisando dimensões do score...</p>
              </div>
            )}

            {recRaw?.recomendacoes && (
              <div className="grid gap-4">
                {(recRaw.recomendacoes as any[]).map((rec: any) => (
                  <div key={rec.prioridade} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-lg"
                        style={{ background: urgColor(rec.urgencia) }}>
                        {rec.prioridade}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: urgColor(rec.urgencia) }}>
                            {rec.urgencia?.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">{rec.dimensao}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 mb-3">{rec.acao}</p>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Zap size={12} color={OK} />
                            <span>Impacto: <b style={{ color: OK }}>{rec.impacto}</b></span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Clock size={12} color={WARN} />
                            <span>{prazoIcon(rec.prazo)} {rec.prazo}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <User size={12} />
                            <span className="truncate">{rec.responsavel}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
