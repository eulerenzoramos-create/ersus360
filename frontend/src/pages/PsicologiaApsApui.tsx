import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Brain, AlertTriangle, Activity, TrendingUp } from "lucide-react";

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

export default function PsicologiaApsApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["pa-dashboard"], queryFn: () => apiGet("/api/psicologia-aps-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: demanda }     = useQuery({ queryKey: ["pa-dem"],       queryFn: () => apiGet("/api/psicologia-aps-apui/demanda"),    enabled: aba === "demanda" });
  const { data: acoes }       = useQuery({ queryKey: ["pa-acoes"],     queryFn: () => apiGet("/api/psicologia-aps-apui/acoes"),      enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["pa-hist"],      queryFn: () => apiGet("/api/psicologia-aps-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["pa-ind"],       queryFn: () => apiGet("/api/psicologia-aps-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Brain size={15}/> },
    { key: "demanda",     label: "Demanda",    icon: <Activity size={15}/> },
    { key: "acoes",       label: "Ações",      icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Brain size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Psicologia na APS — Apuí/AM</h1>
            <p className="text-sm text-slate-500">NASF · Apoio Matricial · Grupos Terapêuticos · Burnout · FMS Apuí/AM</p>
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
              <KPI label="Psicólogos NASF"        value={`${dashRaw.psicologos_nasf}/${dashRaw.psicologos_necessarios}`} color={CRIT} sub="disponíveis / necessários" />
              <KPI label="Cobertura psicologia"   value={`${dashRaw.cobertura_pct.toFixed(1)}%`}  color={CRIT} sub="meta: 80%" />
              <KPI label="Lista de espera"        value={dashRaw.lista_espera.toString()}          color={CRIT} sub={`espera: ${dashRaw.tempo_espera_medio_dias} dias`} />
              <KPI label="Prevalência TMC"        value={`${dashRaw.transtornos_comuns_prevalencia_pct}%`} color={WARN} sub="adultos com TMC" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Burnout servidores"     value={`${dashRaw.burnout_servidores_saude_pct}%`}  color={CRIT} sub="meta: < 15%" />
              <KPI label="Sofrimento psíq. ACS"  value={`${dashRaw.sofrimento_psiq_acs_pct}%`}       color={CRIT} sub="dos Agentes Comunitários" />
              <KPI label="Grupos terapêuticos"   value={dashRaw.grupos_terapeuticos_ativos.toString()} color={WARN} sub="ativos" />
              <KPI label="Apoio matricial/mês"   value={dashRaw.apoio_matricial_equipes_mes.toString()} color={ACCENT} sub={`de 7 equipes ESF`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Capacidade vs. Demanda (atendimentos/mês)</h3>
                <div className="space-y-3">
                  {[
                    { label: "Atendimentos realizados", value: dashRaw.atendimentos_mes,       meta: dashRaw.demanda_estimada_mes, color: WARN },
                    { label: "Apoio matricial ESF",     value: dashRaw.apoio_matricial_equipes_mes, meta: 28, color: ACCENT },
                    { label: "Encaminhamentos ao CAPS", value: dashRaw.encaminhamentos_caps_mes,    meta: 40, color: CRIT },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-medium" style={{ color: b.color }}>{b.value} / {b.meta}</span>
                      </div>
                      <ProgressBar value={b.value} max={b.meta} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>68,3% da demanda sem atendimento</b> — 1 psicólogo NASF para 19.788 hab. Espera média de 84 dias para consulta inicial (meta: 30 dias).</p>
                <p><b>42,4% de burnout</b> nos servidores da FMS — sem programa estruturado de saúde mental para trabalhadores de saúde. ACS são o grupo mais afetado (38,4%).</p>
                <p><b>28,4% da população</b> adulta com transtornos mentais comuns. Encaminhamentos ao CAPS sobrecarregam serviço já no limite de capacidade.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "demanda" && Array.isArray(demanda) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Demanda por Motivo de Procura — APS (casos/mês)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={(demanda as any[]).map((d: any) => ({
                  motivo: d.motivo.substring(0, 28), casos: d.casos_mes, atendidos: Math.round(d.casos_mes * d.atendidos_pct / 100)
                }))} layout="vertical" margin={{ left: 10, right: 60 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="motivo" tick={{ fontSize: 7 }} width={230} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="casos"     name="Demanda" fill="#374151" radius={[0,3,3,0]} />
                  <Bar dataKey="atendidos" name="Atendidos" radius={[0,3,3,0]}>
                    {(demanda as any[]).map((d: any) => <Cell key={d.motivo} fill={statusColor(d.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(demanda as any[]).map((d: any) => (
                <div key={d.motivo} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ background: statusColor(d.status) }} />
                    <div>
                      <span className="font-semibold text-sm text-slate-700">{d.motivo}</span>
                      <p className="text-xs text-slate-500 mt-0.5">{d.obs}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold" style={{ color: statusColor(d.status) }}>{d.casos_mes} casos</p>
                    <p className="text-xs text-slate-400">{d.atendidos_pct}% atend.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "acoes" && Array.isArray(acoes) && (
          <div className="grid gap-3">
            {(acoes as any[]).map((a: any, i: number) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-semibold text-sm text-slate-700">{a.acao}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-bold flex-shrink-0 ${a.status === "em_andamento" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                    {a.status === "em_andamento" ? "Em andamento" : "Planejado"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-1">{a.descricao}</p>
                <div className="flex gap-3 text-xs text-slate-400">
                  <span>Resp.: {a.responsavel}</span>
                  <span>Prazo: {a.prazo}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal — Psicologia APS (Jan–Jun/2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="m"   orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="n" dataKey="atendimentos"     name="Atendimentos"        stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n" dataKey="lista_espera"     name="Lista de espera"     stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="m" dataKey="grupos_realizados"name="Grupos realizados"   stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="m" dataKey="matriciamentos"   name="Matriciamentos"      stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
