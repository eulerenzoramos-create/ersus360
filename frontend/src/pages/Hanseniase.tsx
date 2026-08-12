import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";
import { Eye, AlertTriangle, Users, Activity } from "lucide-react";

const BRAND  = "#7c2d12";
const ACCENT = "#ea580c";
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

const GRAU_COLORS = [OK, WARN, CRIT];

export default function Hanseniase() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["hans-dashboard"],
    queryFn: () => apiGet("/api/hanseniase/dashboard"),
    enabled: aba === "dashboard",
  });
  const { data: formas } = useQuery({
    queryKey: ["hans-formas"],
    queryFn: () => apiGet("/api/hanseniase/casos-por-forma"),
    enabled: aba === "formas",
  });
  const { data: graus } = useQuery({
    queryKey: ["hans-graus"],
    queryFn: () => apiGet("/api/hanseniase/graus-incapacidade"),
    enabled: aba === "graus",
  });
  const { data: historico } = useQuery({
    queryKey: ["hans-historico"],
    queryFn: () => apiGet("/api/hanseniase/historico"),
    enabled: aba === "historico",
  });
  const { data: indicadores } = useQuery({
    queryKey: ["hans-indicadores"],
    queryFn: () => apiGet("/api/hanseniase/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Eye size={15}/> },
    { key: "formas",      label: "PB / MB",    icon: <Users size={15}/> },
    { key: "graus",       label: "Incapacidade", icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Eye size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Hanseníase</h1>
            <p className="text-sm text-slate-500">PQT · PB/MB · Graus de Incapacidade · SINAN · FMS Apuí/AM</p>
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
              <KPI label="Casos Novos/Ano"     value={dashRaw.novos_casos_ano.toString()} color={CRIT} />
              <KPI label="Taxa Detecção"        value={`${dashRaw.taxa_deteccao_100mil}`} sub="/100 mil — HIPERENDEMICO" color={CRIT} />
              <KPI label="Em Tratamento"        value={dashRaw.em_tratamento.toString()} />
              <KPI label="Multibacilar (MB)"    value={`${dashRaw.mb_pct}%`} sub="dos casos" color={CRIT} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Grau II no Diag."    value={`${dashRaw.grau2_diagnostico_pct}%`} sub="meta: ≤5%" color={CRIT} />
              <KPI label="Cura PQT"            value={`${dashRaw.cura_pqt_pct}%`} sub="meta: 90%" color={CRIT} />
              <KPI label="Abandono MB"         value={`${dashRaw.abandono_mb_pct}%`} sub="meta: ≤5%" color={CRIT} />
              <KPI label="Contatos Exam."      value={`${dashRaw.contatos_examinados_pct}%`} sub="meta: 80%" color={WARN} />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <b>Classificação: {dashRaw.classificacao}</b> — Taxa {dashRaw.taxa_deteccao_100mil}/100 mil (OMS meta &lt;10/100mil). {dashRaw.mb_pct}% dos casos são Multibacilar. Diagnóstico tardio com grau II presente em {dashRaw.grau2_diagnostico_pct}% dos casos MB.
            </div>
          </div>
        )}

        {aba === "formas" && Array.isArray(formas) && (
          <div className="space-y-4">
            {(formas as any[]).map((f: any) => (
              <div key={f.forma} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: statusColor(f.status) }} />
                    <span className="font-semibold text-slate-700">{f.forma}</span>
                    <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: statusColor(f.status) + "22", color: statusColor(f.status) }}>
                      {f.casos_ano} casos
                    </span>
                  </div>
                  <span className="font-bold text-sm" style={{ color: statusColor(f.status) }}>Cura: {f.cura_pct}%</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-slate-500 mb-1">Grau incapacidade</p>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span className="text-slate-600">Grau 0</span><b style={{ color: OK }}>{f.grau_0_pct}%</b></div>
                      <div className="flex justify-between"><span className="text-slate-600">Grau I</span><b style={{ color: WARN }}>{f.grau_1_pct}%</b></div>
                      <div className="flex justify-between"><span className="text-slate-600">Grau II</span><b style={{ color: CRIT }}>{f.grau_2_pct}%</b></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Tratamento</p>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span className="text-slate-600">Cura</span><b style={{ color: f.cura_pct >= 85 ? OK : CRIT }}>{f.cura_pct}%</b></div>
                      <div className="flex justify-between"><span className="text-slate-600">Abandono</span><b style={{ color: f.abandono > 0 ? CRIT : OK }}>{f.abandono}</b></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "graus" && Array.isArray(graus) && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col items-center">
              <h3 className="font-semibold text-slate-700 mb-4 self-start">Distribuição por Grau</h3>
              <PieChart width={220} height={220}>
                <Pie data={graus} dataKey="casos" nameKey="grau" cx={110} cy={100} outerRadius={90} label={({ pct }) => `${pct}%`}>
                  {(graus as any[]).map((_: any, i: number) => (
                    <Cell key={i} fill={GRAU_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any, name: any) => [v, name]} />
              </PieChart>
            </div>
            <div className="space-y-3">
              {(graus as any[]).map((g: any, i: number) => (
                <div key={g.grau} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: GRAU_COLORS[i] }} />
                      <span className="font-semibold text-slate-700 text-sm">{g.grau}</span>
                    </div>
                    <span className="font-bold text-sm" style={{ color: GRAU_COLORS[i] }}>{g.casos} casos ({g.pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${g.pct}%`, background: GRAU_COLORS[i] }} />
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
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="em_tratamento" name="Em Tratamento" stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="novos_casos"   name="Casos Novos"   stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="curas"         name="Curas"         stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="abandonos"     name="Abandonos"     stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
