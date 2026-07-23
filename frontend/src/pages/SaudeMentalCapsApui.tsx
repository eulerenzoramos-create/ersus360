import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Brain, AlertTriangle, Activity, TrendingUp } from "lucide-react";

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

const DIAG_COLORS: Record<string, string> = {
  "F10":    CRIT,
  "F20-29": "#7c3aed",
  "F31-33": ACCENT,
  "F19":    WARN,
  "F41":    OK,
};

export default function SaudeMentalCapsApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["sm-dashboard"],    queryFn: () => apiGet("/api/saude-mental-caps-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: diagnosticos }= useQuery({ queryKey: ["sm-diag"],         queryFn: () => apiGet("/api/saude-mental-caps-apui/diagnosticos"), enabled: aba === "diagnosticos" });
  const { data: servicos }    = useQuery({ queryKey: ["sm-serv"],         queryFn: () => apiGet("/api/saude-mental-caps-apui/servicos"),     enabled: aba === "servicos" });
  const { data: historico }   = useQuery({ queryKey: ["sm-historico"],    queryFn: () => apiGet("/api/saude-mental-caps-apui/historico"),    enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["sm-ind"],          queryFn: () => apiGet("/api/saude-mental-caps-apui/indicadores"),  enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",     icon: <Brain size={15}/> },
    { key: "diagnosticos", label: "Diagnósticos",  icon: <Activity size={15}/> },
    { key: "servicos",     label: "Serviços CAPS",  icon: <AlertTriangle size={15}/> },
    { key: "historico",    label: "Histórico",     icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores",   icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Brain size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Mental — CAPS Apuí/AM</h1>
            <p className="text-sm text-slate-500">CAPS I · Álcool e Drogas · Crise Psiquiátrica · RAPS · FMS Apuí/AM</p>
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
              <KPI label="CAPS I"                  value={dashRaw.caps_modalidade} color={OK} sub="implantado" />
              <KPI label="Pacientes Ativos CAPS"   value={dashRaw.caps_pacientes_ativos.toString()} color={ACCENT} sub="em acompanhamento" />
              <KPI label="Atendimentos/Mês"        value={dashRaw.caps_atendimentos_mes.toLocaleString()} color={BRAND} />
              <KPI label="Abandono Tratamento"     value={`${dashRaw.abandonos_tratamento_pct}%`} color={CRIT} sub={`meta: ${dashRaw.meta_abandono_pct}%`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Álcool / Drogas"         value={dashRaw.pacientes_alcool_drogas.toString()} color={CRIT} sub="pacientes (maior grupo)" />
              <KPI label="Psicose / Esquizofrenia" value={dashRaw.pacientes_psicose_esquizofrenia.toString()} color={WARN} />
              <KPI label="Crises no CAPS"          value={`${dashRaw.crise_atendida_caps_pct}%`} color={WARN} sub="resolvidas localmente" />
              <KPI label="Internações/Ano"         value={dashRaw.internacoes_psiquiatricas_ano.toString()} color={CRIT} sub="em Manaus (784 km)" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Distribuição por Diagnóstico</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { grupo: "Álcool",     pac: dashRaw.pacientes_alcool_drogas },
                    { grupo: "Psicose",    pac: dashRaw.pacientes_psicose_esquizofrenia },
                    { grupo: "Humor",      pac: dashRaw.pacientes_transtorno_humor },
                    { grupo: "Drogas",     pac: 18 },
                    { grupo: "Outros",     pac: dashRaw.pacientes_outros },
                  ]} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="grupo" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => `${v} pacientes`} />
                    <Bar dataKey="pac" name="Pacientes" radius={[3,3,0,0]}>
                      <Cell fill={CRIT} />
                      <Cell fill="#7c3aed" />
                      <Cell fill={ACCENT} />
                      <Cell fill={WARN} />
                      <Cell fill="#64748b" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>ZERO leitos de observação</b> — crise psiquiátrica grave = transferência para Manaus (784 km). 41,6% das crises terminam em internação fora do município.</p>
                <p><b>CAPS AD não implantado</b> — 112 pacientes com transtorno de álcool e 18 com múltiplas drogas no CAPS geral, sem estrutura especializada.</p>
                <p><b>28,4% de abandono</b> — 13,4 pp acima da meta. Distância, estigma e falta de moradia terapêutica são as principais causas identificadas.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "diagnosticos" && Array.isArray(diagnosticos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Pacientes e Internações por Diagnóstico</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={diagnosticos as any[]} margin={{ top: 5, right: 60, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="cid" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="p" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="i" orientation="right" tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="p" dataKey="pacientes"       name="Pacientes CAPS" radius={[3,3,0,0]}>
                    {(diagnosticos as any[]).map((d: any) => <Cell key={d.cid} fill={DIAG_COLORS[d.cid] || BRAND} />)}
                  </Bar>
                  <Bar yAxisId="i" dataKey="internacoes_ano" name="Internações/ano" fill={WARN} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(diagnosticos as any[]).map((d: any) => (
                <div key={d.cid} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: DIAG_COLORS[d.cid] || BRAND }} />
                    <div>
                      <span className="font-semibold text-sm text-slate-700">{d.cid} — {d.descricao}</span>
                      <p className="text-xs text-slate-400">{d.pacientes} pacientes ({d.pct}%)</p>
                    </div>
                  </div>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">
                    {d.internacoes_ano} internações/ano
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "servicos" && Array.isArray(servicos) && (
          <div className="grid gap-2">
            {(servicos as any[]).map((s: any) => (
              <div key={s.servico} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: statusColor(s.status) }} />
                    <div>
                      <span className="font-semibold text-sm text-slate-700">{s.servico}</span>
                      <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                        <span>{s.frequencia}</span>
                        {s.disponivel && <span>Cap.: {s.capacidade_mes} / Realiz.: {s.realizado_mes}</span>}
                      </div>
                    </div>
                  </div>
                  {!s.disponivel && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">NÃO DISPONÍVEL</span>}
                </div>
                {s.disponivel && s.capacidade_mes > 0 && (
                  <ProgressBar value={s.realizado_mes} max={s.capacidade_mes} color={statusColor(s.status)} />
                )}
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal — CAPS Apuí (Jan–Jun/2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="s" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="n" dataKey="atendimentos" name="Atendimentos"      stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n" dataKey="pacientes"    name="Pacientes ativos"  stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="s" dataKey="internacoes"  name="Internações"       stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="s" dataKey="abandonos"    name="Abandonos"         stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
