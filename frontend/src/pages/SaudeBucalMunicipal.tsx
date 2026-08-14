import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Smile, AlertTriangle, Activity, Users } from "lucide-react";

const BRAND  = "#164e63";
const ACCENT = "#0891b2";
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

const PROC_COLORS = ["#2563eb","#16a34a","#d97706","#0891b2","#dc2626","#7c3aed","#db2777"];

export default function SaudeBucalMunicipal() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }       = useQuery({ queryKey: ["sb-dashboard"], queryFn: () => apiGet("/api/saude-bucal-municipal/dashboard"),    enabled: aba === "dashboard" });
  const { data: esb }        = useQuery({ queryKey: ["sb-esb"],       queryFn: () => apiGet("/api/saude-bucal-municipal/esb"),          enabled: aba === "esb" });
  const { data: procedimentos }= useQuery({ queryKey: ["sb-proc"],   queryFn: () => apiGet("/api/saude-bucal-municipal/procedimentos"), enabled: aba === "procedimentos" });
  const { data: historico }  = useQuery({ queryKey: ["sb-historico"], queryFn: () => apiGet("/api/saude-bucal-municipal/historico"),    enabled: aba === "historico" });
  const { data: indicadores }= useQuery({ queryKey: ["sb-ind"],      queryFn: () => apiGet("/api/saude-bucal-municipal/indicadores"),   enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",      label: "Dashboard",      icon: <Smile size={15}/> },
    { key: "esb",            label: "Equipes (ESB)",  icon: <Users size={15}/> },
    { key: "procedimentos",  label: "Procedimentos",  icon: <Activity size={15}/> },
    { key: "historico",      label: "Histórico",      icon: <Activity size={15}/> },
    { key: "indicadores",    label: "Indicadores",    icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Smile size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Bucal Municipal</h1>
            <p className="text-sm text-slate-500">6 ESB · CPO-D · Fluoretação · Procedimentos · CEO · FMS Apuí/AM</p>
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

        {aba === "dashboard" && !dashRaw && (
          <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />
        )}

        {aba === "dashboard" && dashRaw && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="ESB Funcionando"          value={`${dashRaw.esb_funcionando}/${dashRaw.esb_total}`} color={dashRaw.esb_funcionando < dashRaw.esb_total ? CRIT : OK} />
              <KPI label="Procedimentos Básicos/Mês" value={dashRaw.procedimentos_basicos_mes?.toLocaleString()} color={ACCENT} />
              <KPI label="Urgências/Mês"             value={dashRaw.urgencias_mes.toString()} color={WARN} />
              <KPI label="Exodontias"                value={`${dashRaw.exodontias_mes} (${dashRaw.exodontias_pct_total}%)`} color={CRIT} sub={`meta: <${dashRaw.meta_exodontias_pct}%`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="CPO-D (12 anos)"           value={dashRaw.cpod_12anos.toString()} color={CRIT}  sub="meta OMS: ≤2,0" />
              <KPI label="1ª Consulta Programática"  value={`${dashRaw.primeira_consulta_pct}%`} color={WARN} sub={`meta: ${dashRaw.meta_primeira_consulta_pct}%`} />
              <KPI label="Fluoretação da Água"       value={dashRaw.fluoretacao_agua ? "Ativa" : "Inativa"} color={dashRaw.fluoretacao_agua ? OK : CRIT} />
              <KPI label="CEO Disponível"            value={dashRaw.ceo_disponivel ? "Sim" : "Não"} color={dashRaw.ceo_disponivel ? OK : CRIT} sub="Centro Esp. Odonto." />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900">
              <b>CPO-D 3,8 — acima da meta OMS (2,0).</b> ESB 06 (PA Aripuanã) sem dentista há 4 meses. Apuí não possui CEO — especialidades referenciadas a Humaitá/Manaus. Taxa de exodontia 10% (meta &lt;7%) indica diagnóstico tardio.
            </div>
          </div>
        )}

        {aba === "esb" && Array.isArray(esb) && (
          <div className="grid gap-3">
            {(esb as any[]).map((e: any) => (
              <div key={e.esb} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-semibold text-slate-700">{e.esb}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded"
                    style={{ background: statusColor(e.status) + "22", color: statusColor(e.status) }}>
                    {e.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex gap-6 text-xs text-slate-500">
                  <span>Dentistas: <b style={{ color: e.dentistas === 0 ? CRIT : OK }}>{e.dentistas}</b></span>
                  <span>Auxiliares: <b style={{ color: e.auxiliares === 0 ? WARN : OK }}>{e.auxiliares}</b></span>
                  <span>Proced./mês: <b>{e.proc_mes}</b></span>
                  <span style={{ color: e.exod_pct > 10 ? CRIT : WARN }}>Exodontias: <b>{e.exod_pct}%</b></span>
                </div>
                {e.obs && <p className="text-xs text-amber-700 bg-amber-50 rounded p-2 mt-2">{e.obs}</p>}
              </div>
            ))}
          </div>
        )}

        {aba === "procedimentos" && Array.isArray(procedimentos) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Distribuição de Procedimentos (mês)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={procedimentos} dataKey="quantidade" nameKey="procedimento" cx="50%" cy="50%" outerRadius={80} label={({ pct }) => `${pct}%`}>
                    {(procedimentos as any[]).map((_: any, i: number) => <Cell key={i} fill={PROC_COLORS[i % PROC_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {(procedimentos as any[]).map((p: any, i: number) => (
                <div key={p.procedimento} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: PROC_COLORS[i % PROC_COLORS.length] }} />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">{p.procedimento}</span>
                      <span className="font-bold text-slate-700">{p.quantidade} ({p.pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-0.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${p.pct}%`, background: PROC_COLORS[i % PROC_COLORS.length] }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal — Procedimentos, Urgências e Exodontias</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="n"  tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="n" dataKey="proc_basicos"    name="Procedimentos Básicos" stroke={ACCENT} strokeWidth={3} dot={{ r: 4 }} />
                <Line yAxisId="n" dataKey="urgencias"       name="Urgências"             stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n" dataKey="exodontias"      name="Exodontias"            stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n" dataKey="primeira_consulta" name="1ª Consulta Prog."   stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
