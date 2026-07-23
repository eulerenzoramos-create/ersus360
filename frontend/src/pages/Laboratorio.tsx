import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { FlaskConical, AlertTriangle, ClipboardList, Activity } from "lucide-react";

const BRAND  = "#312e81";
const ACCENT = "#6366f1";
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

const GRUPO_COLORS = ["#6366f1","#0891b2","#10b981","#f59e0b","#ec4899","#8b5cf6","#14b8a6","#f97316","#94a3b8"];

export default function Laboratorio() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["lab-dashboard"],
    queryFn: () => apiGet("/api/laboratorio/dashboard"),
    enabled: aba === "dashboard",
  });

  const { data: producao } = useQuery({
    queryKey: ["lab-producao"],
    queryFn: () => apiGet("/api/laboratorio/producao"),
    enabled: aba === "producao",
  });

  const { data: pendentes } = useQuery({
    queryKey: ["lab-pendentes"],
    queryFn: () => apiGet("/api/laboratorio/pendentes-criticos"),
    enabled: aba === "pendentes",
  });

  const { data: historico } = useQuery({
    queryKey: ["lab-historico"],
    queryFn: () => apiGet("/api/laboratorio/historico"),
    enabled: aba === "historico",
  });

  const { data: indicadores } = useQuery({
    queryKey: ["lab-indicadores"],
    queryFn: () => apiGet("/api/laboratorio/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",    icon: <FlaskConical size={15}/> },
    { key: "producao",    label: "Produção",     icon: <BarChart size={15}/> as any },
    { key: "pendentes",   label: "Pendentes Crít.", icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",    icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores",  icon: <ClipboardList size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <FlaskConical size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Laboratório Municipal</h1>
            <p className="text-sm text-slate-500">Exames · Resultados · Produção · FMS Apuí/AM</p>
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

        {/* Dashboard */}
        {aba === "dashboard" && dashRaw && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Exames/Mês"          value={dashRaw.exames_mes.toLocaleString()} />
              <KPI label="Pendentes"           value={dashRaw.exames_pendentes.toString()} sub={`${dashRaw.exames_pendentes_criticos} críticos`} color={WARN} />
              <KPI label="Prazo Médio"         value={`${dashRaw.prazo_medio_resultado_dias}d`} sub="meta: 3,0 dias" color={dashRaw.prazo_medio_resultado_dias > 3 ? WARN : OK} />
              <KPI label="Amostras Rejeitadas" value={`${dashRaw.amostras_rejeitadas_mes} (${dashRaw.amostras_rejeitadas_pct}%)`} color={WARN} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Críticos Notificados" value={`${dashRaw.taxa_exames_criticos_notificados_pct}%`} color={WARN} />
              <KPI label="Reagentes em Falta"   value={dashRaw.reagentes_em_falta.toString()} color={CRIT} />
              <KPI label="Equipamentos Calibr." value={`${dashRaw.calibracoes_em_dia_pct}%`} color={WARN} />
              <KPI label="Custo Médio/Exame"    value={`R$ ${dashRaw.custo_exame_medio.toFixed(2)}`} />
            </div>
          </div>
        )}

        {/* Produção */}
        {aba === "producao" && producao && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Exames por Grupo</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={(producao as any).por_grupo} layout="vertical" margin={{ top: 5, right: 30, left: 150, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="grupo" tick={{ fontSize: 10 }} width={145} />
                  <Tooltip />
                  <Bar dataKey="exames" name="Exames" radius={[0,3,3,0]}>
                    {((producao as any).por_grupo || []).map((_: any, i: number) => (
                      <Cell key={i} fill={GRUPO_COLORS[i % GRUPO_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <h3 className="font-semibold text-slate-700 text-sm">Top 10 Exames — Jun/2026</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Código SIGTAP","Exame","Quantidade","Prazo Médio"].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {((producao as any).top_exames || []).map((e: any, i: number) => (
                    <tr key={e.codigo} className={`border-b border-slate-50 ${i % 2 === 0 ? "" : "bg-slate-50/50"}`}>
                      <td className="px-4 py-2 font-mono text-xs text-slate-400">{e.codigo}</td>
                      <td className="px-4 py-2 font-medium">{e.exame}</td>
                      <td className="px-4 py-2 font-bold" style={{ color: ACCENT }}>{e.quantidade.toLocaleString()}</td>
                      <td className="px-4 py-2 text-xs" style={{ color: e.prazo > 5 ? CRIT : e.prazo > 3 ? WARN : OK }}>{e.prazo}d</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pendentes Críticos */}
        {aba === "pendentes" && Array.isArray(pendentes) && (
          <div className="grid gap-3">
            {(pendentes as any[]).map((p: any, i: number) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
                style={{ borderLeft: `4px solid ${p.status === "critico" ? CRIT : WARN}` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-700">{p.exame}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: (p.status === "critico" ? CRIT : WARN) + "22", color: p.status === "critico" ? CRIT : WARN }}>
                      {p.dias_espera}d de espera
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-2">
                  <span>Solicitante: <b>{p.unidade_solicitante}</b></span>
                  <span>Paciente: <b>{p.paciente_id}</b></span>
                </div>
                <p className="text-xs text-slate-500 bg-amber-50 rounded p-2">{p.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {/* Histórico */}
        {aba === "historico" && Array.isArray(historico) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Produção e Prazo Médio (2026)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="ex" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="pr" orientation="right" domain={[2,5]} tickFormatter={(v) => `${v}d`} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="ex" dataKey="exames"       name="Exames/Mês"   stroke={ACCENT} strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="pr" dataKey="prazo_medio"  name="Prazo Médio"  stroke={WARN}   strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Indicadores */}
        {aba === "indicadores" && Array.isArray(indicadores) && (
          <div className="grid gap-3">
            {(indicadores as any[]).map((ind: any) => (
              <div key={ind.indicador} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-4">
                <div className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(ind.status) }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 text-sm">{ind.indicador}</span>
                    <span className="font-bold text-sm" style={{ color: statusColor(ind.status) }}>
                      {`${ind.valor} ${ind.unidade}`} {ind.meta ? `/ meta: ${ind.meta} ${ind.unidade}` : ""}
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
