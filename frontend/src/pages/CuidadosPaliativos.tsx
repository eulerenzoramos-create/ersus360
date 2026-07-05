import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Heart, AlertTriangle, Users, Activity } from "lucide-react";

const BRAND  = "#4a1942";
const ACCENT = "#9333ea";
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

const DIAG_COLORS = ["#9333ea","#ec4899","#8b5cf6","#f59e0b","#6366f1","#0891b2","#10b981","#64748b","#d97706","#94a3b8"];

export default function CuidadosPaliativos() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["cp-dashboard"],
    queryFn: () => apiGet("/api/cuidados-paliativos/dashboard"),
    enabled: aba === "dashboard",
  });

  const { data: perfil } = useQuery({
    queryKey: ["cp-perfil"],
    queryFn: () => apiGet("/api/cuidados-paliativos/pacientes-perfil"),
    enabled: aba === "perfil",
  });

  const { data: sintomas } = useQuery({
    queryKey: ["cp-sintomas"],
    queryFn: () => apiGet("/api/cuidados-paliativos/controle-sintomas"),
    enabled: aba === "sintomas",
  });

  const { data: historico } = useQuery({
    queryKey: ["cp-historico"],
    queryFn: () => apiGet("/api/cuidados-paliativos/historico"),
    enabled: aba === "historico",
  });

  const { data: indicadores } = useQuery({
    queryKey: ["cp-indicadores"],
    queryFn: () => apiGet("/api/cuidados-paliativos/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",       icon: <Heart size={15}/> },
    { key: "perfil",      label: "Perfil Pacientes", icon: <Users size={15}/> },
    { key: "sintomas",    label: "Sintomas",         icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",        icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores",      icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Heart size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Cuidados Paliativos</h1>
            <p className="text-sm text-slate-500">Equipe Multiprofissional · Controle de Sintomas · FMS Apuí/AM</p>
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
              <KPI label="Pacientes Ativos"    value={dashRaw.pacientes_ativos.toString()} />
              <KPI label="Oncológicos"         value={dashRaw.pacientes_oncologicos.toString()} color={ACCENT} />
              <KPI label="Não Oncológicos"     value={dashRaw.pacientes_nao_oncologicos.toString()} color="#0891b2" />
              <KPI label="Novos/Mês"           value={dashRaw.novos_cadastros_mes.toString()} color={WARN} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Óbito Local Desejado" value={`${dashRaw.obitos_em_local_desejado_pct}%`} sub="meta: 80%" color={WARN} />
              <KPI label="Visitas Domiciliares/Mês" value={dashRaw.visitas_domiciliares_mes.toString()} />
              <KPI label="Consultas Dor/Mês"   value={dashRaw.consultas_dor_mes.toString()} color={CRIT} />
              <KPI label="Morfina Disponível"  value={dashRaw.disponibilidade_morfina_oral ? "Sim" : "NÃO"} color={dashRaw.disponibilidade_morfina_oral ? OK : CRIT} />
            </div>
          </div>
        )}

        {/* Perfil Pacientes */}
        {aba === "perfil" && perfil && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Diagnósticos</h3>
              <div className="grid gap-2">
                {((perfil as any).por_diagnostico || []).map((d: any, i: number) => (
                  <div key={d.diagnostico} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: DIAG_COLORS[i % DIAG_COLORS.length] }} />
                    <span className="text-sm flex-1 text-slate-700">{d.diagnostico}</span>
                    <span className="text-xs text-slate-400 px-2 py-0.5 rounded-full" style={{ background: DIAG_COLORS[i % DIAG_COLORS.length] + "22" }}>
                      {d.fase}
                    </span>
                    <span className="font-bold text-sm" style={{ color: DIAG_COLORS[i % DIAG_COLORS.length] }}>{d.n}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Local de Cuidado</h3>
                {((perfil as any).por_local_cuidado || []).map((l: any, i: number) => (
                  <div key={l.local} className="flex items-center gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{l.local}</span>
                        <span className="font-bold">{l.n} ({l.pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: `${l.pct}%`, background: DIAG_COLORS[i] }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Escala ECOG</h3>
                {((perfil as any).escala_ecog || []).map((e: any, i: number) => (
                  <div key={e.ecog} className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-slate-500 flex-1">{e.ecog}</span>
                    <span className="font-bold text-sm" style={{ color: DIAG_COLORS[i + 4] }}>{e.n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Controle de Sintomas */}
        {aba === "sintomas" && Array.isArray(sintomas) && (
          <div className="grid gap-3">
            {(sintomas as any[]).map((s: any) => (
              <div key={s.sintoma} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-semibold text-slate-700">{s.sintoma}</span>
                    <span className="text-xs text-slate-400 ml-2">prevalência {s.prevalencia_pct}%</span>
                  </div>
                  <span className="font-bold text-sm" style={{ color: statusColor(s.status) }}>
                    {s.controlado_pct}% controlado <span className="font-normal text-slate-400">/ meta {s.meta_pct}%</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                  <div className="h-2 rounded-full" style={{ width: `${s.controlado_pct}%`, background: statusColor(s.status) }} />
                </div>
                <p className="text-xs text-slate-500">Farmacologia: <span className="font-medium">{s.farmaco_principal}</span></p>
              </div>
            ))}
          </div>
        )}

        {/* Histórico */}
        {aba === "historico" && Array.isArray(historico) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal (2026)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="n" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="pct" orientation="right" domain={[50, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="n"   dataKey="pacientes_ativos" name="Pacientes Ativos" stroke={ACCENT} strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="n"   dataKey="visitas_dom"       name="Visitas Dom."    stroke="#0891b2" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="pct" dataKey="obito_local_desejado_pct" name="Óbito Local Desejado %" stroke={OK} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
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
