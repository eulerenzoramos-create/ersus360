import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { ClipboardList, AlertTriangle, Activity, CheckCircle } from "lucide-react";

const BRAND  = "#dbeafe";
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

const CAT_COLORS: Record<string, string> = {
  "Doenças Crônicas": "#1d4ed8",
  "Doenças Infecciosas": "#dc2626",
  "Saúde da Mulher": "#ec4899",
  "IST/HIV": "#7c3aed",
  "Oncologia/Prev.": "#d97706",
  "Doenças Respiratórias": "#0891b2",
  "Doenças Cardiovasc.": "#ef4444",
  "Saúde Mental": "#8b5cf6",
  "Saúde da Criança": "#10b981",
};

export default function ProtocoloClinico() {
  const [aba, setAba] = useState("dashboard");
  const [filtroStatus, setFiltroStatus] = useState("");

  const { data: dash } = useQuery({
    queryKey: ["protocolo-dashboard"],
    queryFn: () => apiGet("/api/protocolo-clinico/dashboard"),
    enabled: aba === "dashboard",
  });

  const { data: lista } = useQuery({
    queryKey: ["protocolo-lista", filtroStatus],
    queryFn: () => apiGet(`/api/protocolo-clinico/lista${filtroStatus ? `?status=${filtroStatus}` : ""}`),
    enabled: aba === "lista",
  });

  const { data: desvios } = useQuery({
    queryKey: ["protocolo-desvios"],
    queryFn: () => apiGet("/api/protocolo-clinico/desvios"),
    enabled: aba === "desvios",
  });

  const { data: historico } = useQuery({
    queryKey: ["protocolo-historico"],
    queryFn: () => apiGet("/api/protocolo-clinico/historico"),
    enabled: aba === "historico",
  });

  const { data: indicadores } = useQuery({
    queryKey: ["protocolo-indicadores"],
    queryFn: () => apiGet("/api/protocolo-clinico/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",   icon: <ClipboardList size={15}/> },
    { key: "lista",       label: "Protocolos",  icon: <CheckCircle size={15}/> },
    { key: "desvios",     label: "Desvios",     icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",   icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <ClipboardList size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Protocolos Clínicos — PCDT</h1>
            <p className="text-sm text-slate-500">Adesão · Desvios · Monitoramento · FMS Apuí/AM</p>
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
        {aba === "dashboard" && !dashRaw && (
          <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />
        )}

        {aba === "dashboard" && dashRaw && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Protocolos Ativos"  value={dashRaw.protocolos_ativos.toString()} />
              <KPI label="Em dia"             value={dashRaw.protocolos_ok.toString()}     color={OK} />
              <KPI label="Atenção"            value={dashRaw.protocolos_atencao.toString()} color={WARN} />
              <KPI label="Críticos"           value={dashRaw.protocolos_criticos.toString()} color={CRIT} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Adesão Média"       value={`${dashRaw.adesao_media_pct}%`} sub="meta: 85%" color={WARN} />
              <KPI label="Pacientes em Prot." value={dashRaw.pacientes_em_protocolo.toLocaleString()} />
              <KPI label="Monitoramentos/Mês" value={dashRaw.monitoramentos_mes.toLocaleString()} />
              <KPI label="Desvios/Mês"        value={dashRaw.desvios_mes.toString()} color={WARN} />
            </div>
          </div>
        )}

        {/* Lista de Protocolos */}
        {aba === "lista" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {["","ok","atencao","critico"].map(s => (
                <button key={s} onClick={() => setFiltroStatus(s)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                  style={filtroStatus === s ? { background: BRAND, color: "white", border: "none" } : { background: "white", color: "#6b7280", borderColor: "#374151" }}>
                  {s === "" ? "Todos" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <div className="grid gap-3">
              {Array.isArray(lista) && (lista as any[]).map((p: any) => (
                <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">{p.nome}</span>
                      {p.pcdt_ms && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">PCDT/MS</span>}
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: (CAT_COLORS[p.categoria] || "#6b7280") + "22", color: CAT_COLORS[p.categoria] || "#6b7280" }}>
                        {p.categoria}
                      </span>
                    </div>
                    <span className="font-bold text-sm" style={{ color: statusColor(p.status) }}>
                      {p.adesao_pct}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                    <div className="h-2 rounded-full" style={{ width: `${p.adesao_pct}%`, background: statusColor(p.status) }} />
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-slate-500">
                    <span>Pacientes: <b>{p.pacientes_alvo.toLocaleString()}</b></span>
                    <span>Em prot.: <b>{p.em_protocolo.toLocaleString()}</b></span>
                    <span>Monitor./mês: <b>{p.monitoramentos_mes}</b></span>
                    <span>Desvios: <b style={{ color: p.desvios_mes > 0 ? WARN : OK }}>{p.desvios_mes}</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Desvios */}
        {aba === "desvios" && Array.isArray(desvios) && (
          <div className="grid gap-3">
            {(desvios as any[]).map((d: any, i: number) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm border-l-4" style={{ borderLeftColor: WARN }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700">{d.protocolo}</span>
                    <span className="font-semibold text-slate-700 text-sm">{d.desvio}</span>
                  </div>
                  <span className="font-bold text-sm" style={{ color: WARN }}>{d.n_mes} casos/mês</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-500">
                  <span className="font-medium">Unidade:</span> <span>{d.unidade}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 bg-amber-50 rounded p-2">{d.causa}</p>
              </div>
            ))}
          </div>
        )}

        {/* Histórico */}
        {aba === "historico" && Array.isArray(historico) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Adesão Média e Desvios (2026)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="ad" domain={[65, 85]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="dv" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="ad" dataKey="adesao_media"   name="Adesão Média (%)"  stroke="#1d4ed8" strokeWidth={2} dot={{ r: 4 }} />
                  <Line yAxisId="dv" dataKey="desvios"        name="Desvios/Mês"       stroke={CRIT}    strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
