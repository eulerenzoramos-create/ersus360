import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Globe, MapPin, AlertTriangle, Activity } from "lucide-react";

const BRAND  = "#14532d";
const ACCENT = "#16a34a";
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

export default function SaudeIndigena() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["sind-dashboard"],
    queryFn: () => apiGet("/api/saude-indigena/dashboard"),
    enabled: aba === "dashboard",
  });
  const { data: aldeias } = useQuery({
    queryKey: ["sind-aldeias"],
    queryFn: () => apiGet("/api/saude-indigena/aldeias"),
    enabled: aba === "aldeias",
  });
  const { data: agravos } = useQuery({
    queryKey: ["sind-agravos"],
    queryFn: () => apiGet("/api/saude-indigena/agravos"),
    enabled: aba === "agravos",
  });
  const { data: historico } = useQuery({
    queryKey: ["sind-historico"],
    queryFn: () => apiGet("/api/saude-indigena/historico"),
    enabled: aba === "historico",
  });
  const { data: indicadores } = useQuery({
    queryKey: ["sind-indicadores"],
    queryFn: () => apiGet("/api/saude-indigena/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",   icon: <Globe size={15}/> },
    { key: "aldeias",     label: "Aldeias",     icon: <MapPin size={15}/> },
    { key: "agravos",     label: "Agravos",     icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",   icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Globe size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Indígena</h1>
            <p className="text-sm text-slate-500">DSEI · EMSI · SIASI · Aldeias · FMS Apuí/AM</p>
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
              <KPI label="Pop. Indígena"       value={dashRaw.populacao_indigena_total.toLocaleString()} sub={`${dashRaw.povos_atendidos} povos`} />
              <KPI label="Aldeias Monitoradas" value={dashRaw.aldeias_monitoradas.toString()} />
              <KPI label="Sem EMSI"            value={dashRaw.aldeias_sem_emsi.toString()} sub="aldeias sem equipe" color={CRIT} />
              <KPI label="IPA Indígena"        value={`${dashRaw.ipa_indigena}`} sub="/1000 hab" color={CRIT} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Cobertura Vacinal"   value={`${dashRaw.cobertura_vacinal_media_pct}%`} sub="meta: 95%" color={CRIT} />
              <KPI label="Desnutrição <5 anos" value={`${dashRaw.desnutricao_infantil_pct}%`} sub="meta: 10%" color={CRIT} />
              <KPI label="TMI Indígena"        value={`${dashRaw.tmi_indigena}`} sub="/1000 NV" color={CRIT} />
              <KPI label="Atendimentos/Mês"    value={dashRaw.atendimentos_mes.toString()} color={ACCENT} />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <b>Atenção prioritária:</b> {dashRaw.aldeia_critica}. IPA indígena {dashRaw.ipa_indigena}/1000 — 74% superior ao municipal. TMI indígena quase 2× a média municipal.
            </div>
          </div>
        )}

        {aba === "aldeias" && Array.isArray(aldeias) && (
          <div className="space-y-3">
            {(aldeias as any[]).map((a: any) => (
              <div key={a.aldeia} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(a.status) }} />
                    <div>
                      <span className="font-semibold text-slate-700">{a.aldeia}</span>
                      <span className="ml-2 text-xs text-slate-500">Povo {a.povo}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {!a.equipe_saude && (
                      <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: CRIT + "22", color: CRIT }}>SEM EMSI</span>
                    )}
                    <span className="text-sm font-bold" style={{ color: statusColor(a.status) }}>Pop. {a.populacao}</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs text-slate-500">
                  <span>Última visita: <b style={{ color: a.ultima_visita_dias > 45 ? CRIT : a.ultima_visita_dias > 21 ? WARN : OK }}>{a.ultima_visita_dias}d</b></span>
                  <span>Vacinação: <b style={{ color: a.cobertura_vacinal_pct < 70 ? CRIT : a.cobertura_vacinal_pct < 85 ? WARN : OK }}>{a.cobertura_vacinal_pct}%</b></span>
                  <span>Desnutrição: <b style={{ color: a.desnutricao_infantil_pct > 20 ? CRIT : WARN }}>{a.desnutricao_infantil_pct}%</b></span>
                  <span>Município: <b>{a.municipio}</b></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "agravos" && Array.isArray(agravos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Casos por Agravo (2026)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={agravos} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="agravo" tick={{ fontSize: 9 }} width={220} />
                  <Tooltip />
                  <Bar dataKey="casos_ano" name="Casos" radius={[0,3,3,0]}>
                    {(agravos as any[]).map((g: any, i: number) => (
                      <Cell key={i} fill={statusColor(g.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(agravos as any[]).map((g: any) => (
                <div key={g.agravo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor(g.status) }} />
                    <span className="font-medium text-slate-700 text-sm">{g.agravo}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Casos: <b>{g.casos_ano}</b></span>
                    <span>Taxa/100: <b style={{ color: statusColor(g.status) }}>{g.taxa_100}</b></span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: statusColor(g.tendencia === "alta" ? "critico" : "ok") + "22", color: statusColor(g.tendencia === "alta" ? "critico" : "ok") }}>
                      {g.tendencia}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Atendimentos Mensais (2026)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="atendimentos"    name="Atendimentos"     stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="visitas_aldeias" name="Visitas Aldeias"  stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="encam_polo_base" name="Encam. Polo Base" stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
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
