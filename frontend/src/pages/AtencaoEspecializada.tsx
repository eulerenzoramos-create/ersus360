import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Stethoscope, AlertTriangle, Users, Activity } from "lucide-react";

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

const DISP_LABEL: Record<string, string> = {
  presencial:              "Presencial fixo",
  itinerante_mensal:       "Itinerante mensal",
  itinerante_quinzenal:    "Itinerante quinzenal",
  itinerante_trimestral:   "Itinerante trimestral",
  referencia_manaus:       "Referência Manaus",
  telessaude:              "Telessaúde",
};

export default function AtencaoEspecializada() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({ queryKey: ["ae-dashboard"], queryFn: () => apiGet("/api/atencao-especializada/dashboard"), enabled: aba === "dashboard" });
  const { data: especialidades } = useQuery({ queryKey: ["ae-especial"], queryFn: () => apiGet("/api/atencao-especializada/especialidades"), enabled: aba === "especialidades" });
  const { data: exames } = useQuery({ queryKey: ["ae-exames"], queryFn: () => apiGet("/api/atencao-especializada/exames-mac"), enabled: aba === "exames" });
  const { data: historico } = useQuery({ queryKey: ["ae-historico"], queryFn: () => apiGet("/api/atencao-especializada/historico"), enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["ae-indicadores"], queryFn: () => apiGet("/api/atencao-especializada/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",     label: "Dashboard",      icon: <Stethoscope size={15}/> },
    { key: "especialidades",label: "Especialidades", icon: <Users size={15}/> },
    { key: "exames",        label: "Exames MAC",     icon: <Activity size={15}/> },
    { key: "historico",     label: "Histórico",      icon: <Activity size={15}/> },
    { key: "indicadores",   label: "Indicadores",    icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Stethoscope size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Atenção Especializada / MAC</h1>
            <p className="text-sm text-slate-500">Especialidades · Exames · Referências Manaus · Policlínica · FMS Apuí/AM</p>
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
              <KPI label="Consultas Espec./Mês" value={dashRaw.consultas_especializadas_mes.toLocaleString()} color={ACCENT} />
              <KPI label="Lista de Espera Total" value={dashRaw.total_lista_espera.toLocaleString()} color={CRIT} />
              <KPI label="Espec. Presencial Fixo" value={`${dashRaw.especialidades_presencial}/${dashRaw.especialidades_disponiveis}`} color={WARN} />
              <KPI label="Espec. Críticas" value={dashRaw.especialidades_criticas.toString()} color={CRIT} sub="sem profissional local" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Exames MAC/Mês"       value={dashRaw.exames_mac_mes.toString()} color={ACCENT} />
              <KPI label="Referências Manaus/Mês" value={dashRaw.referencias_manaus_mes.toString()} color={CRIT} sub="~14h de distância" />
              <KPI label="Contrarreferência"    value={`${dashRaw.contrareferencia_pct}%`} color={CRIT} sub="meta: 80%" />
              <KPI label="Policlínica"          value={dashRaw.policlinica ? "Sim" : "NÃO"} color={CRIT} />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <b>Sem policlínica municipal</b> — 6 especialidades sem profissional residente (neurologia espera 148d, ortopedia 112d, dermatologia 168d). {dashRaw.referencias_manaus_mes} pacientes/mês deslocam-se a Manaus. Contrarreferência apenas {dashRaw.contrareferencia_pct}% — cuidado fragmentado.
            </div>
          </div>
        )}

        {aba === "especialidades" && Array.isArray(especialidades) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Lista de Espera por Especialidade</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={especialidades} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="especialidade" tick={{ fontSize: 8 }} width={220} />
                  <Tooltip />
                  <Bar dataKey="lista_espera" name="Lista Espera" radius={[0,3,3,0]}>
                    {(especialidades as any[]).map((e: any) => (
                      <Cell key={e.especialidade} fill={statusColor(e.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(especialidades as any[]).map((esp: any) => (
                <div key={esp.especialidade} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: statusColor(esp.status) }} />
                      <span className="font-semibold text-slate-700 text-sm">{esp.especialidade}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{DISP_LABEL[esp.disponibilidade] || esp.disponibilidade}</span>
                    </div>
                    <span className="font-bold text-sm" style={{ color: statusColor(esp.status) }}>
                      Espera: {esp.lista_espera} · {esp.tempo_espera_dias}d
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                    <span>Profissionais: <b>{esp.profissionais}</b></span>
                    <span>Consultas/mês: <b>{esp.consultas_mes}</b></span>
                    <span style={{ color: esp.profissionais === 0 ? CRIT : OK }}>
                      {esp.profissionais === 0 ? "Sem residente" : `${esp.profissionais} residente(s)`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "exames" && Array.isArray(exames) && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Lista de Espera — Exames MAC</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={exames} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="exame" tick={{ fontSize: 8 }} width={220} />
                  <Tooltip />
                  <Bar dataKey="lista_espera" name="Lista Espera" radius={[0,3,3,0]}>
                    {(exames as any[]).map((e: any) => (
                      <Cell key={e.exame} fill={statusColor(e.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(exames as any[]).map((ex: any) => (
                <div key={ex.exame} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: statusColor(ex.status) }} />
                    <span className="font-semibold text-slate-700 text-sm">{ex.exame}</span>
                  </div>
                  <div className="flex gap-5 text-xs text-slate-500">
                    <span>Realiz./mês: <b>{ex.realizados_mes}</b></span>
                    <span style={{ color: statusColor(ex.status) }}>Espera: <b>{ex.lista_espera} · {ex.tempo_espera_dias}d</b></span>
                    <span className="italic">{ex.local}</span>
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
                <YAxis yAxisId="pct" orientation="right" domain={[35, 50]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="consultas_especializadas" name="Consultas Espec."      stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="referencias_manaus"       name="Referências Manaus"    stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="contrareferencias_pct"    name="Contrarreferência %"   stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
