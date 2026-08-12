import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Smile, AlertTriangle, Users, Activity } from "lucide-react";

const BRAND  = "#1e1b4b";
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

const T_COLORS = ["#7c3aed","#d97706","#ef4444","#0891b2","#dc2626","#8b5cf6","#d97706","#6b7280"];

export default function CAPSInfanto() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["ci-dashboard"],
    queryFn: () => apiGet("/api/caps-infanto/dashboard"),
    enabled: aba === "dashboard",
  });

  const { data: transtornos } = useQuery({
    queryKey: ["ci-transtornos"],
    queryFn: () => apiGet("/api/caps-infanto/transtornos"),
    enabled: aba === "transtornos",
  });

  const { data: atividades } = useQuery({
    queryKey: ["ci-atividades"],
    queryFn: () => apiGet("/api/caps-infanto/atividades"),
    enabled: aba === "atividades",
  });

  const { data: historico } = useQuery({
    queryKey: ["ci-historico"],
    queryFn: () => apiGet("/api/caps-infanto/historico"),
    enabled: aba === "historico",
  });

  const { data: indicadores } = useQuery({
    queryKey: ["ci-indicadores"],
    queryFn: () => apiGet("/api/caps-infanto/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",    icon: <Smile size={15}/> },
    { key: "transtornos", label: "Transtornos",  icon: <Users size={15}/> },
    { key: "atividades",  label: "Atividades",   icon: <Activity size={15}/> },
    { key: "historico",   label: "Histórico",    icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Smile size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>CAPS Infanto-Juvenil</h1>
            <p className="text-sm text-slate-500">Saúde Mental · Crianças e Adolescentes · FMS Apuí/AM</p>
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
              <KPI label="Pacientes Ativos"     value={dashRaw.pacientes_ativos.toString()} />
              <KPI label="Novos/Mês"            value={dashRaw.novos_cadastros_mes.toString()} color={ACCENT} />
              <KPI label="Abandono/Mês"         value={dashRaw.abandono_mes.toString()} sub={`${dashRaw.taxa_abandono_pct}% de evasão`} color={WARN} />
              <KPI label="Lista de Espera"      value={dashRaw.lista_espera.toString()} sub={`~${dashRaw.tempo_espera_medio_dias} dias`} color={CRIT} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Atend. Individuais/Mês" value={dashRaw.atendimentos_individuais_mes.toString()} />
              <KPI label="Atend. Grupo/Mês"        value={dashRaw.atendimentos_grupo_mes.toString()} color={OK} />
              <KPI label="Visitas Escola/Mês"      value={dashRaw.visitas_escola_mes.toString()} color={WARN} />
              <KPI label="Visitas Domiciliares"    value={dashRaw.visitas_domiciliares_mes.toString()} />
            </div>
            {dashRaw.lista_espera > 20 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
                <b>Alerta:</b> {dashRaw.lista_espera} crianças/adolescentes aguardam vaga. Tempo médio de espera: {dashRaw.tempo_espera_medio_dias} dias — meta: 15 dias. Ampliação de equipe necessária.
              </div>
            )}
          </div>
        )}

        {aba === "transtornos" && Array.isArray(transtornos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Pacientes por Transtorno</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={transtornos} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="transtorno" tick={{ fontSize: 9 }} width={230} />
                  <Tooltip />
                  <Bar dataKey="em_acompanhamento" name="Em Acompanhamento" radius={[0,3,3,0]}>
                    {(transtornos as any[]).map((_: any, i: number) => (
                      <Cell key={i} fill={T_COLORS[i % T_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(transtornos as any[]).map((t: any, i: number) => (
                <div key={t.transtorno} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center gap-4">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: T_COLORS[i % T_COLORS.length] }} />
                  <span className="font-semibold text-sm text-slate-700 flex-1">{t.transtorno}</span>
                  <div className="text-xs text-slate-500 flex gap-4">
                    <span>Total: <b>{t.n}</b></span>
                    <span style={{ color: t.abandono_mes > 3 ? CRIT : WARN }}>Evasão: <b>{t.abandono_mes}</b></span>
                    <span className="font-bold" style={{ color: statusColor(t.status) }}>{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "atividades" && Array.isArray(atividades) && (
          <div className="grid gap-3">
            {(atividades as any[]).map((a: any) => (
              <div key={a.atividade} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: statusColor(a.status) }} />
                    <span className="font-semibold text-slate-700 text-sm">{a.atividade}</span>
                  </div>
                  <span className="font-bold text-sm" style={{ color: ACCENT }}>{a.participantes_mes} participantes/mês</span>
                </div>
                <div className="text-xs text-slate-400">
                  {a.frequencia} · {a.profissional}
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal (2026)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"  tick={{ fontSize: 11 }} />
                <YAxis yAxisId="w"  orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="n" dataKey="pacientes_ativos" name="Pacientes Ativos" stroke={ACCENT} strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="n" dataKey="atendimentos"      name="Atendimentos"    stroke="#0891b2" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="w" dataKey="lista_espera"       name="Lista de Espera" stroke={CRIT}   strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
                <Line yAxisId="n" dataKey="abandono"           name="Abandono"        stroke={WARN}   strokeWidth={2} dot={{ r: 3 }} />
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
                      {`${ind.valor} ${ind.unidade}`}{ind.meta ? ` / meta: ${ind.meta} ${ind.unidade}` : ""}
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
