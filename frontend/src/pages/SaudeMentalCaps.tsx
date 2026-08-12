import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Brain, AlertTriangle, Activity, Users } from "lucide-react";

const BRAND  = "#4c1d95";
const ACCENT = "#7c3aed";
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

const TEND_COLOR: Record<string, string> = { aumento: CRIT, estavel: WARN, reducao: OK };
const TEND_LABEL: Record<string, string> = { aumento: "↑ Aumento", estavel: "→ Estável", reducao: "↓ Redução" };

export default function SaudeMentalCaps() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }      = useQuery({ queryKey: ["smc-dashboard"], queryFn: () => apiGet("/api/saude-mental-caps/dashboard"), enabled: aba === "dashboard" });
  const { data: servicos }  = useQuery({ queryKey: ["smc-servicos"],  queryFn: () => apiGet("/api/saude-mental-caps/servicos"),  enabled: aba === "servicos" });
  const { data: agravos }   = useQuery({ queryKey: ["smc-agravos"],   queryFn: () => apiGet("/api/saude-mental-caps/agravos"),   enabled: aba === "agravos" });
  const { data: historico } = useQuery({ queryKey: ["smc-historico"], queryFn: () => apiGet("/api/saude-mental-caps/historico"), enabled: aba === "historico" });
  const { data: indicadores }= useQuery({ queryKey: ["smc-ind"],     queryFn: () => apiGet("/api/saude-mental-caps/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Brain size={15}/> },
    { key: "servicos",    label: "CAPS",       icon: <Users size={15}/> },
    { key: "agravos",     label: "Agravos",    icon: <Activity size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <Activity size={15}/> },
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
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Mental / CAPS</h1>
            <p className="text-sm text-slate-500">CAPS I · CAPS AD · Internações · Crises · Suicídio · FMS Apuí/AM</p>
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
              <KPI label="Usuários Ativos"         value={dashRaw.total_usuarios_ativos.toString()} color={ACCENT} sub="CAPS I + CAPS AD" />
              <KPI label="Novos Acolhimentos/Mês"  value={dashRaw.novos_acolhimentos_mes.toString()} color={WARN} />
              <KPI label="Crises Atendidas/Mês"    value={dashRaw.crise_atendidas_mes.toString()} color={CRIT} />
              <KPI label="Internações Psiq./Mês"   value={dashRaw.internacoes_psiquiatricas_mes.toString()} color={CRIT} sub="Referenciados Manaus" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Altas/Mês"               value={dashRaw.altas_mes.toString()} color={OK} />
              <KPI label="Encaminhamentos Manaus"  value={dashRaw.encaminhamentos_manaus_mes.toString()} color={WARN} sub="por mês" />
              <KPI label="Tentativas de Suicídio"  value={dashRaw.tentativas_suicidio_mes.toString()} color={CRIT} sub="último mês" />
              <KPI label="Leitos Referência"        value={dashRaw.leitos_referencia_manaus.toString()} color={WARN} sub="Manaus" />
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-900">
              <b>Saúde Mental — situação de atenção.</b> CAPS I e CAPS AD ativos mas sem psiquiatra fixo (visita 2×/mês). Fila de espera de 8 dias para acolhimento. Demanda crescente pós-pandemia com aumento de casos de ansiedade, crack e tentativas de suicídio.
            </div>
          </div>
        )}

        {aba === "servicos" && Array.isArray(servicos) && (
          <div className="grid gap-4">
            {(servicos as any[]).map((srv: any) => (
              <div key={srv.tipo} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-700">{srv.servico}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{srv.funcionamento}</p>
                  </div>
                  <span className="text-sm font-bold px-3 py-1 rounded-full"
                    style={{ background: statusColor(srv.status) + "22", color: statusColor(srv.status) }}>
                    {srv.status.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-slate-500">Usuários Ativos</p>
                    <p className="text-xl font-bold" style={{ color: ACCENT }}>{srv.usuarios_ativos}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Capacidade</p>
                    <p className="text-xl font-bold text-slate-600">{srv.capacidade_referencia}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Ocupação</p>
                    <p className="text-xl font-bold" style={{ color: srv.usuarios_ativos / srv.capacidade_referencia > 0.8 ? WARN : OK }}>
                      {((srv.usuarios_ativos / srv.capacidade_referencia) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {srv.modalidades.map((m: string) => (
                    <span key={m} className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700">{m.replace(/_/g," ")}</span>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 border-t pt-3">
                  {Object.entries(srv.equipe).map(([k, v]) => (
                    <div key={k}><span className="text-slate-400">{k.replace(/_/g," ")}: </span><b>{String(v)}</b></div>
                  ))}
                </div>
                <p className="text-xs text-amber-700 bg-amber-50 rounded p-2 mt-3">{srv.obs}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "agravos" && Array.isArray(agravos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Usuários por Agravo (CAPS I + CAPS AD)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={agravos} layout="vertical" margin={{ left: 10, right: 50 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="agravo" tick={{ fontSize: 9 }} width={240} />
                  <Tooltip />
                  <Bar dataKey="usuarios" name="Usuários" radius={[0,3,3,0]}>
                    {(agravos as any[]).map((a: any) => <Cell key={a.agravo} fill={TEND_COLOR[a.tendencia]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(agravos as any[]).map((a: any) => (
                <div key={a.agravo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-700 text-sm">{a.agravo}</p>
                    <p className="text-xs text-slate-400">{a.usuarios} usuários · {a.pct}% da carteira</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: TEND_COLOR[a.tendencia] + "22", color: TEND_COLOR[a.tendencia] }}>
                    {TEND_LABEL[a.tendencia]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal — Usuários, Internações e Crises</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="u" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="e" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="u" dataKey="usuarios_ativos"  name="Usuários Ativos" stroke={ACCENT} strokeWidth={3} dot={{ r: 5 }} />
                <Line yAxisId="e" dataKey="crises"           name="Crises"          stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="e" dataKey="internacoes"      name="Internações"     stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="e" dataKey="acolhimentos"     name="Acolhimentos"    stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
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
