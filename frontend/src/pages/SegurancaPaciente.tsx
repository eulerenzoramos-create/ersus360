import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { ShieldCheck, AlertTriangle, ClipboardList, Activity } from "lucide-react";

const BRAND = "#1e3a5f";
const OK    = "#16a34a";
const WARN  = "#d97706";
const CRIT  = "#dc2626";

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

const GRAVIDADE_COLOR: Record<string, string> = { grave: CRIT, moderada: WARN, leve: OK };

export default function SegurancaPaciente() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["sp-dashboard"],
    queryFn: () => apiGet("/api/seguranca-paciente/dashboard"),
    enabled: aba === "dashboard",
  });

  const { data: incidentes } = useQuery({
    queryKey: ["sp-incidentes"],
    queryFn: () => apiGet("/api/seguranca-paciente/incidentes"),
    enabled: aba === "incidentes",
  });

  const { data: protocolos } = useQuery({
    queryKey: ["sp-protocolos"],
    queryFn: () => apiGet("/api/seguranca-paciente/protocolos"),
    enabled: aba === "protocolos",
  });

  const { data: historico } = useQuery({
    queryKey: ["sp-historico"],
    queryFn: () => apiGet("/api/seguranca-paciente/historico"),
    enabled: aba === "historico",
  });

  const { data: indicadores } = useQuery({
    queryKey: ["sp-indicadores"],
    queryFn: () => apiGet("/api/seguranca-paciente/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",   icon: <ShieldCheck size={15}/> },
    { key: "incidentes",  label: "Incidentes",  icon: <AlertTriangle size={15}/> },
    { key: "protocolos",  label: "Protocolos",  icon: <ClipboardList size={15}/> },
    { key: "historico",   label: "Histórico",   icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <ShieldCheck size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Segurança do Paciente</h1>
            <p className="text-sm text-slate-500">NSP · Incidentes · Protocolos OMS · FMS Apuí/AM</p>
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
              <KPI label="Incidentes/Mês"   value={dashRaw.incidentes_mes.toString()} />
              <KPI label="Com Dano"          value={dashRaw.incidentes_com_dano.toString()} color={CRIT} />
              <KPI label="Near-Miss"         value={dashRaw.near_miss.toString()}       color={WARN} />
              <KPI label="Eventos Adversos Graves" value={dashRaw.events_adversos_graves.toString()} color={CRIT} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Quedas"            value={dashRaw.queda_paciente_mes.toString()} color={WARN} />
              <KPI label="Erros de Medicação" value={dashRaw.erro_medicacao_mes.toString()} color={WARN} />
              <KPI label="IRAS"              value={dashRaw.infeccao_relacionada_assistencia_mes.toString()} color={CRIT} />
              <KPI label="Cirurgia Segura"   value={`${dashRaw.cirurgia_segura_conformidade_pct}%`} sub="conformidade" color={WARN} />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-3">Higiene das Mãos</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-slate-100 rounded-full h-4">
                  <div className="h-4 rounded-full" style={{ width: `${dashRaw.higiene_maos_conformidade_pct}%`, background: WARN }} />
                </div>
                <span className="font-bold text-lg" style={{ color: WARN }}>{dashRaw.higiene_maos_conformidade_pct}%</span>
                <span className="text-sm text-slate-500">meta: 85%</span>
              </div>
            </div>
          </div>
        )}

        {/* Incidentes */}
        {aba === "incidentes" && Array.isArray(incidentes) && (
          <div className="grid gap-3">
            {(incidentes as any[]).map((inc: any) => (
              <div key={inc.tipo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-700">{inc.tipo}</span>
                  <div className="flex gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: GRAVIDADE_COLOR[inc.gravidade] + "22", color: GRAVIDADE_COLOR[inc.gravidade] }}>
                      {inc.gravidade}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#1e3a5f22", color: BRAND }}>
                      {inc.n} casos
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-xs text-slate-500 mb-2">
                  <span>Com dano: <b style={{ color: CRIT }}>{inc.com_dano}</b></span>
                  <span>Sem dano: <b style={{ color: OK }}>{inc.sem_dano}</b></span>
                  <span>Near-miss: <b style={{ color: WARN }}>{inc.near_miss}</b></span>
                  <span>Unidade: <b>{inc.unidade}</b></span>
                </div>
                <p className="text-xs text-slate-500 bg-blue-50 rounded p-2">{inc.medida}</p>
              </div>
            ))}
          </div>
        )}

        {/* Protocolos */}
        {aba === "protocolos" && Array.isArray(protocolos) && (
          <div className="grid gap-3">
            {(protocolos as any[]).map((p: any) => (
              <div key={p.protocolo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-700 text-sm">{p.protocolo}</span>
                  <span className="font-bold text-sm" style={{ color: statusColor(p.status) }}>
                    {p.conformidade_pct}% <span className="font-normal text-slate-400">/ meta {p.meta_pct}%</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                  <div className="h-2 rounded-full" style={{ width: `${p.conformidade_pct}%`, background: statusColor(p.status) }} />
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{p.observacao}</span>
                  <span>{p.auditorias_mes} auditorias/mês</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Histórico */}
        {aba === "historico" && Array.isArray(historico) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Incidentes por Mês (2026)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="com_dano"   name="Com Dano"   fill={CRIT} radius={[3,3,0,0]} />
                  <Bar dataKey="near_miss"  name="Near-Miss"  fill={WARN} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Evolução dos Protocolos (%)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis domain={[50, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line dataKey="cirurgia_segura_pct" name="Cirurgia Segura" stroke="#1d4ed8" strokeWidth={2} dot={{ r: 3 }} />
                  <Line dataKey="higiene_maos_pct"    name="Higiene Mãos"   stroke={WARN}    strokeWidth={2} dot={{ r: 3 }} />
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
                      {`${ind.valor} ${ind.unidade}`} {ind.meta !== null && ind.meta !== undefined ? `/ meta: ${ind.meta} ${ind.unidade}` : ""}
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
