import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Brain, AlertTriangle, Users, Activity } from "lucide-react";

const BRAND  = "#1e1b4b";
const ACCENT = "#4f46e5";
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

const SERVICO_COLORS = ["#4f46e5","#854d0e","#1e1b4b","#0891b2","#dc2626"];
const TRANSTORNO_COLORS = ["#dc2626","#854d0e","#7c3aed","#d97706","#1d4ed8","#0891b2","#dc2626"];

export default function SaudeMental() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["sm-dashboard"],
    queryFn: () => apiGet("/api/saude-mental/dashboard"),
    enabled: aba === "dashboard",
  });
  const { data: servicos } = useQuery({
    queryKey: ["sm-servicos"],
    queryFn: () => apiGet("/api/saude-mental/servicos-raps"),
    enabled: aba === "servicos",
  });
  const { data: transtornos } = useQuery({
    queryKey: ["sm-transtornos"],
    queryFn: () => apiGet("/api/saude-mental/transtornos"),
    enabled: aba === "transtornos",
  });
  const { data: historico } = useQuery({
    queryKey: ["sm-historico"],
    queryFn: () => apiGet("/api/saude-mental/historico"),
    enabled: aba === "historico",
  });
  const { data: indicadores } = useQuery({
    queryKey: ["sm-indicadores"],
    queryFn: () => apiGet("/api/saude-mental/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Brain size={15}/> },
    { key: "servicos",    label: "RAPS",       icon: <Users size={15}/> },
    { key: "transtornos", label: "Transtornos",icon: <AlertTriangle size={15}/> },
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
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Mental</h1>
            <p className="text-sm text-slate-500">RAPS · CAPS · SRT · Suicídio · RNSMF · FMS Apuí/AM</p>
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
              <KPI label="Pacientes RAPS"      value={dashRaw.pacientes_raps_total.toString()} />
              <KPI label="Serviços Superlotados" value={dashRaw.servicos_superlotados.toString()} sub="de 5 serviços RAPS" color={CRIT} />
              <KPI label="Leitos Psiq. SUS"    value={dashRaw.leitos_psiq_sus.toString()} sub="ZERO disponíveis" color={CRIT} />
              <KPI label="Lista de Espera"     value={dashRaw.lista_espera_total.toString()} sub="total RAPS" color={CRIT} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Tent. Suicídio/Mês" value={dashRaw.tentativas_suicidio_mes.toString()} color={CRIT} />
              <KPI label="Internações/Mês"    value={dashRaw.internacoes_mes.toString()} color={WARN} />
              <KPI label="Reinternação"       value={`${dashRaw.reinternacao_pct}%`} sub="meta: ≤15%" color={CRIT} />
              <KPI label="Atendimentos/Mês"   value={dashRaw.atendimentos_mes.toLocaleString()} color={ACCENT} />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <b>Alerta RAPS:</b> {dashRaw.servicos_superlotados} serviços superlotados. {dashRaw.leitos_psiq_sus} leitos psiquiátricos SUS — internações dependem de regulação regional. Tentativas de suicídio em crescimento: {dashRaw.tentativas_suicidio_mes} em junho.
            </div>
          </div>
        )}

        {aba === "servicos" && Array.isArray(servicos) && (
          <div className="space-y-3">
            {(servicos as any[]).map((s: any, i: number) => (
              <div key={s.servico} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(s.status) }} />
                    <span className="font-semibold text-slate-700">{s.servico}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm" style={{ color: statusColor(s.status) }}>
                      {s.ocupacao_pct}% ocupação
                    </span>
                  </div>
                </div>
                <div className="mb-3 w-full bg-slate-100 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(s.ocupacao_pct, 100)}%`, background: statusColor(s.status) }} />
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs text-slate-500">
                  <span>Ativos: <b>{s.pacientes_ativos}</b></span>
                  <span>Capacidade: <b>{s.capacidade}</b></span>
                  <span style={{ color: s.lista_espera > 0 ? CRIT : OK }}>Lista espera: <b>{s.lista_espera}</b></span>
                  <span style={{ color: s.tempo_espera_dias > 30 ? CRIT : WARN }}>Espera: <b>{s.tempo_espera_dias > 0 ? `${s.tempo_espera_dias}d` : "—"}</b></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "transtornos" && Array.isArray(transtornos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Casos por Transtorno</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={transtornos} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="transtorno" tick={{ fontSize: 8 }} width={250} />
                  <Tooltip />
                  <Bar dataKey="casos" name="Casos" radius={[0,3,3,0]}>
                    {(transtornos as any[]).map((_: any, i: number) => (
                      <Cell key={i} fill={TRANSTORNO_COLORS[i % TRANSTORNO_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(transtornos as any[]).map((t: any, i: number) => (
                <div key={t.transtorno} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: TRANSTORNO_COLORS[i % TRANSTORNO_COLORS.length] }} />
                    <span className="font-medium text-slate-700 text-sm">{t.transtorno}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Total: <b>{t.casos}</b></span>
                    <span>Novos/mês: <b>{t.novos_mes}</b></span>
                    {t.internacoes_ano > 0 && <span style={{ color: CRIT }}>Intern./ano: <b>{t.internacoes_ano}</b></span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal (2026)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" domain={[20, 40]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="atendimentos"         name="Atendimentos"      stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="internacoes"          name="Internações"        stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="tentativas_suicidio"  name="Tent. Suicídio"     stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="alta_reinternacao_pct" name="Reinternação (%)" stroke="#7c3aed" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
