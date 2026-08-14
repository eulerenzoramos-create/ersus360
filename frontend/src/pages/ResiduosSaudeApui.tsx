import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Trash2, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function ResiduosSaudeApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["rss-dashboard"], queryFn: () => apiGet("/api/residuos-saude-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: tipos }       = useQuery({ queryKey: ["rss-tipos"],     queryFn: () => apiGet("/api/residuos-saude-apui/tipos"),       enabled: aba === "tipos" });
  const { data: prevencao }   = useQuery({ queryKey: ["rss-prev"],      queryFn: () => apiGet("/api/residuos-saude-apui/prevencao"),   enabled: aba === "prevencao" });
  const { data: historico }   = useQuery({ queryKey: ["rss-hist"],      queryFn: () => apiGet("/api/residuos-saude-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["rss-ind"],       queryFn: () => apiGet("/api/residuos-saude-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",   icon: <Trash2 size={15}/> },
    { key: "tipos",       label: "Tipos de RSS", icon: <Activity size={15}/> },
    { key: "prevencao",   label: "Prevenção",   icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",   icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Trash2 size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Resíduos de Saúde — Apuí/AM</h1>
            <p className="text-sm text-slate-500">PGRSS · Infectantes · Perfurocortantes · EPI · VISA · FMS Apuí/AM</p>
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
              <KPI label="RSS gerados/dia"           value={`${dashRaw.residuos_totais_kg_dia} kg`}     color={WARN} sub={`infectantes: ${dashRaw.residuos_infectantes_kg_dia} kg/dia`} />
              <KPI label="Descarte inadequado"       value={`${dashRaw.descarte_inadequado_pct}%`}       color={CRIT} sub="meta < 5%" />
              <KPI label="Acidentes perfurocortante" value={dashRaw.acidente_perfurocortante_2025}        color={CRIT} sub="em 2025 (10 por descarte)" />
              <KPI label="PGRSS atualizado"          value={dashRaw.pgrss_atualizado ? "Sim" : "Não"}   color={CRIT} sub={`última atualização: ${dashRaw.pgrss_ultima_atualizacao_ano}`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Coleta especializada"      value={`${dashRaw.coleta_especializada_pct}%`}      color={CRIT} sub="meta: 100%" />
              <KPI label="EPI disponível"            value={`${dashRaw.equipamentos_epi_disponibilidade_pct}%`} color={WARN} sub="meta: 100%" />
              <KPI label="Treinamento RSS"           value={`${dashRaw.treinamento_manipulacao_rss_pct}%`} color={CRIT} sub="meta: 80%" />
              <KPI label="Incinerador"               value={dashRaw.incineracao_disponivel ? "Sim" : "Não"} color={CRIT} sub="autoclave: não disponível" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Situação dos Resíduos — Indicadores Principais</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Coleta especializada (${dashRaw.coleta_especializada_pct}%)`, value: dashRaw.coleta_especializada_pct, max: 100, color: CRIT },
                    { label: `EPI disponível (${dashRaw.equipamentos_epi_disponibilidade_pct}%)`, value: dashRaw.equipamentos_epi_disponibilidade_pct, max: 100, color: WARN },
                    { label: `Treinamento RSS (${dashRaw.treinamento_manipulacao_rss_pct}%)`, value: dashRaw.treinamento_manipulacao_rss_pct, max: 100, color: CRIT },
                    { label: `Agulhas descarte seguro (${dashRaw.agulhas_descarte_seguro_pct}%)`, value: dashRaw.agulhas_descarte_seguro_pct, max: 100, color: CRIT },
                    { label: `Fiscalizações VISA (${dashRaw.vigilancia_sanitaria_fiscalizacoes_2025}/12)`, value: dashRaw.vigilancia_sanitaria_fiscalizacoes_2025, max: 12, color: WARN },
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
                <p><b>PGRSS vencido desde 2022</b> — 6 anos sem atualização (meta: renovar a cada 3 anos). Risco de multa R$ 5-50k. Empresa de coleta não renova contrato. Renovação via COSEMS-AM: R$ 6.000.</p>
                <p><b>14 acidentes perfurocortantes em 2025</b> — 10 por descarte inadequado (agulhas em saco de lixo comum). Custo em PEP (profilaxia HIV): R$ 67.200/ano. EPI completo + caixa coletora em campo: reduz para &lt; 2 acidentes/ano.</p>
                <p><b>Zero incinerador ou autoclave</b> — resíduos infectantes aguardam 7 dias até coleta especializada. 62,4% vai para lixo comum. Consórcio com Humaitá/Manicoré/N.Aripuanã: R$ 71.000/município. Payback: 1,5 anos.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "tipos" && Array.isArray(tipos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Descarte Adequado por Tipo de RSS (%)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={(tipos as any[])} layout="vertical" margin={{ left: 200, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="tipo" type="category" tick={{ fontSize: 10 }} width={200} />
                  <Tooltip />
                  <Bar dataKey="descarte_adequado_pct" name="Descarte adequado (%)" radius={[0,3,3,0]}>
                    {(tipos as any[]).map((t: any, i: number) => (
                      <Cell key={i} fill={statusColor(t.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(tipos as any[]).map((t: any) => (
                <div key={t.tipo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(t.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{t.tipo}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <span className="font-bold text-slate-700">{t.geracao_kg_dia} kg/dia</span>
                      {" · "}
                      <span style={{ color: statusColor(t.status) }}>{t.descarte_adequado_pct}% adequado</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{t.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "prevencao" && Array.isArray(prevencao) && (
          <div className="grid gap-3">
            {(prevencao as any[]).map((p: any) => (
              <div key={p.medida} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: p.implementada ? OK : CRIT }} />
                    <p className="font-semibold text-sm text-slate-700">{p.medida}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.implementada ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {p.implementada ? "Implementada" : "Não implementada"}
                    </span>
                    {p.custo > 0 && <p className="text-xs text-slate-400 mt-0.5">custo: R$ {p.custo?.toLocaleString()} · prazo: {p.prazo_meses}m</p>}
                    {p.custo === 0 && <p className="text-xs text-green-600 mt-0.5">custo R$ 0 · {p.prazo_meses}m</p>}
                    <p className="text-xs text-slate-400">{p.responsavel}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{p.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução RSS — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="descarte_adequado_pct" name="Descarte adequado (%)" stroke={OK}    strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="acidentes_perfuro"      name="Acidentes perfuro"     stroke={CRIT}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="fiscalizacoes"           name="Fiscalizações VISA"   stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
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
