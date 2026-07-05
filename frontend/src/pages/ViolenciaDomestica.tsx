import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Shield, AlertTriangle, Users, Activity } from "lucide-react";

const BRAND  = "#3b0764";
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

const TIPO_COLORS = ["#dc2626","#7c3aed","#ef4444","#d97706","#0891b2","#64748b"];

export default function ViolenciaDomestica() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["vd-dashboard"],
    queryFn: () => apiGet("/api/violencia-domestica/dashboard"),
    enabled: aba === "dashboard",
  });

  const { data: tipos } = useQuery({
    queryKey: ["vd-tipos"],
    queryFn: () => apiGet("/api/violencia-domestica/tipos"),
    enabled: aba === "tipos",
  });

  const { data: fluxo } = useQuery({
    queryKey: ["vd-fluxo"],
    queryFn: () => apiGet("/api/violencia-domestica/fluxo-atendimento"),
    enabled: aba === "fluxo",
  });

  const { data: historico } = useQuery({
    queryKey: ["vd-historico"],
    queryFn: () => apiGet("/api/violencia-domestica/historico"),
    enabled: aba === "historico",
  });

  const { data: indicadores } = useQuery({
    queryKey: ["vd-indicadores"],
    queryFn: () => apiGet("/api/violencia-domestica/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",        icon: <Shield size={15}/> },
    { key: "tipos",       label: "Tipos",            icon: <AlertTriangle size={15}/> },
    { key: "fluxo",       label: "Fluxo",            icon: <Users size={15}/> },
    { key: "historico",   label: "Histórico",        icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores",      icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Shield size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Atenção às Vítimas de Violência</h1>
            <p className="text-sm text-slate-500">Doméstica · Sexual · Notificação · Fluxo de Proteção · FMS Apuí/AM</p>
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
              <KPI label="Atendimentos/Mês"    value={dashRaw.atendimentos_mes.toString()} color={ACCENT} />
              <KPI label="Notif. SINAN/Mês"    value={dashRaw.notificacoes_sinan_mes.toString()} color={WARN} />
              <KPI label="Viol. Sexual/Mês"    value={dashRaw.violencia_sexual_mes.toString()} color={CRIT} />
              <KPI label="Menores Vítimas/Mês" value={dashRaw.menores_vitimas_mes.toString()} color={CRIT} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Profilaxia IST (VS)" value={`${dashRaw.profilaxia_ist_realizada_pct}%`} color={OK} />
              <KPI label="Reincidentes"        value={`${dashRaw.reincidentes_pct}%`} sub="das vítimas" color={CRIT} />
              <KPI label="Seguimento 30 dias"  value={`${dashRaw.seguimento_30dias_pct}%`} sub="meta: 80%" color={CRIT} />
              <KPI label="BO Registrado"       value={`${dashRaw.bo_registrado_pct}%`} sub="sem DDM no município" color={WARN} />
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-900">
              <b>Contexto:</b> Subnotificação estimada em {dashRaw.subnotificacao_estimada_pct}%. Agressor masculino em {dashRaw.masculino_agressor_pct}% dos casos. Apuí não possui Delegacia da Mulher (DDM) — B.O. na Delegacia Geral ou por telefone.
            </div>
          </div>
        )}

        {aba === "tipos" && Array.isArray(tipos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Casos por Tipo de Violência (mês)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={tipos} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="tipo" tick={{ fontSize: 9 }} width={180} />
                  <Tooltip />
                  <Bar dataKey="n_mes" name="Casos/mês" radius={[0,3,3,0]}>
                    {(tipos as any[]).map((_: any, i: number) => (
                      <Cell key={i} fill={TIPO_COLORS[i % TIPO_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(tipos as any[]).map((t: any, i: number) => (
                <div key={t.tipo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: TIPO_COLORS[i % TIPO_COLORS.length] }} />
                      <span className="font-semibold text-slate-700 text-sm">{t.tipo}</span>
                    </div>
                    <span className="font-bold" style={{ color: statusColor(t.status) }}>{t.n_mes}/mês</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                    <span>Feminino: <b>{t.feminino_pct}%</b></span>
                    <span>Menores: <b style={{ color: t.menor_18_pct > 40 ? CRIT : "inherit" }}>{t.menor_18_pct}%</b></span>
                    <span>BO: <b style={{ color: t.bo_registrado_pct < 50 ? CRIT : WARN }}>{t.bo_registrado_pct}%</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "fluxo" && Array.isArray(fluxo) && (
          <div className="grid gap-3">
            {(fluxo as any[]).map((f: any, i: number) => (
              <div key={f.passo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: statusColor(f.status) }}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-700">{f.passo}</p>
                  <p className="text-xs text-slate-400">{f.responsavel} · {f.prazo}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm" style={{ color: statusColor(f.status) }}>{f.executado_pct}%</div>
                  <div className="w-20 bg-slate-100 rounded-full h-1.5 mt-1">
                    <div className="h-1.5 rounded-full" style={{ width: `${f.executado_pct}%`, background: statusColor(f.status) }} />
                  </div>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="atendimentos"          name="Atendimentos"          stroke={ACCENT}  strokeWidth={2} dot={{ r: 3 }} />
                <Line dataKey="notificacoes"           name="Notificações SINAN"    stroke={WARN}    strokeWidth={2} dot={{ r: 3 }} />
                <Line dataKey="menores"               name="Menores Vítimas"       stroke={CRIT}    strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
                <Line dataKey="encaminhamentos_creas"  name="Encaminh. CREAS"      stroke="#0891b2" strokeWidth={2} dot={{ r: 3 }} />
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
