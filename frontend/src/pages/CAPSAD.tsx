import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";
import { Brain, AlertTriangle, Users, Activity } from "lucide-react";

const BRAND  = "#1c1917";
const ACCENT = "#854d0e";
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

const SUB_COLORS = ["#d97706","#16a34a","#dc2626","#8b5cf6","#0891b2","#6b7280"];

export default function CAPSAD() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["ca-dashboard"],
    queryFn: () => apiGet("/api/caps-ad/dashboard"),
    enabled: aba === "dashboard",
  });

  const { data: substancias } = useQuery({
    queryKey: ["ca-substancias"],
    queryFn: () => apiGet("/api/caps-ad/substancias"),
    enabled: aba === "substancias",
  });

  const { data: servicos } = useQuery({
    queryKey: ["ca-servicos"],
    queryFn: () => apiGet("/api/caps-ad/servicos"),
    enabled: aba === "servicos",
  });

  const { data: historico } = useQuery({
    queryKey: ["ca-historico"],
    queryFn: () => apiGet("/api/caps-ad/historico"),
    enabled: aba === "historico",
  });

  const { data: indicadores } = useQuery({
    queryKey: ["ca-indicadores"],
    queryFn: () => apiGet("/api/caps-ad/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",   icon: <Brain size={15}/> },
    { key: "substancias", label: "Substâncias", icon: <Users size={15}/> },
    { key: "servicos",    label: "Serviços",    icon: <Activity size={15}/> },
    { key: "historico",   label: "Histórico",   icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Brain size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>CAPS AD — Álcool e Drogas</h1>
            <p className="text-sm text-slate-500">Dependência Química · Redução de Danos · FMS Apuí/AM</p>
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
              <KPI label="Pacientes Ativos"     value={dashRaw.pacientes_ativos.toString()} />
              <KPI label="Novos/Mês"            value={dashRaw.novos_cadastros_mes.toString()} color={ACCENT} />
              <KPI label="Abandono/Mês"         value={dashRaw.abandono_mes.toString()} sub={`${dashRaw.taxa_abandono_pct}% evasão`} color={CRIT} />
              <KPI label="Lista de Espera"      value={dashRaw.lista_espera.toString()} sub={`~${dashRaw.tempo_espera_dias} dias`} color={WARN} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Atendimentos/Mês"     value={dashRaw.atendimentos_mes.toString()} />
              <KPI label="Álcool (%)"           value={`${dashRaw.proporcao_alcool_pct}%`} color={WARN} />
              <KPI label="Crack/Pasta (%)"      value={`${dashRaw.proporcao_crack_pct}%`} color={CRIT} />
              <KPI label="Leitos CAPS AD"       value={dashRaw.leitos_caps_ad.toString()} sub="meta: 6" color={CRIT} />
            </div>
            {dashRaw.leitos_caps_ad === 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
                <b>Alerta crítico:</b> CAPS AD sem leitos de internação breve. Crises de abstinência são encaminhadas ao Hospital Municipal (sem leito psiquiátrico) ou referidas a Humaitá/AM (+200 km). Aquisição de 6 leitos prevista no orçamento 2027.
              </div>
            )}
          </div>
        )}

        {aba === "substancias" && Array.isArray(substancias) && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Distribuição por Substância</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={substancias} dataKey="acompanhamento_ativo" nameKey="substancia" cx="50%" cy="50%" outerRadius={80} label={({ pct }: any) => `${pct}%`} labelLine={false}>
                      {(substancias as any[]).map((_: any, i: number) => (
                        <Cell key={i} fill={SUB_COLORS[i % SUB_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Abandono por Substância</h3>
                <div className="space-y-3">
                  {(substancias as any[]).map((s: any, i: number) => (
                    <div key={s.substancia} className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: SUB_COLORS[i % SUB_COLORS.length] }} />
                      <span className="text-sm flex-1 text-slate-700">{s.substancia}</span>
                      <span className="text-xs" style={{ color: s.abandono_mes > 8 ? CRIT : s.abandono_mes > 3 ? WARN : OK }}>
                        {s.abandono_mes} evasões
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              {(substancias as any[]).map((s: any, i: number) => (
                <div key={s.substancia} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center gap-4">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: SUB_COLORS[i % SUB_COLORS.length] }} />
                  <span className="font-semibold text-sm text-slate-700 flex-1">{s.substancia}</span>
                  <div className="text-xs flex gap-4 text-slate-500">
                    <span>Total: <b>{s.n}</b></span>
                    <span>Ativo: <b>{s.acompanhamento_ativo}</b></span>
                    <span style={{ color: statusColor(s.status) }}><b>{s.pct}%</b> do perfil</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "servicos" && Array.isArray(servicos) && (
          <div className="grid gap-3">
            {(servicos as any[]).map((s: any) => (
              <div key={s.servico} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: statusColor(s.status) }} />
                    <span className="font-semibold text-slate-700 text-sm">{s.servico}</span>
                  </div>
                  <span className="font-bold text-sm" style={{ color: s.realizados_mes === 0 ? CRIT : ACCENT }}>
                    {s.realizados_mes === 0 ? "SEM OFERTA" : `${s.realizados_mes}/mês`}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{s.profissional}</p>
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
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="pacientes_ativos" name="Pacientes Ativos" stroke={ACCENT}  strokeWidth={2} dot={{ r: 3 }} />
                <Line dataKey="atendimentos"     name="Atendimentos"     stroke="#0891b2" strokeWidth={2} dot={{ r: 3 }} />
                <Line dataKey="abandono"         name="Abandono/Mês"     stroke={CRIT}    strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
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
