import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie,
} from "recharts";
import { Thermometer, AlertTriangle, Activity, TrendingUp } from "lucide-react";

const BRAND  = "#1e3a5f";
const ACCENT = "#1d4ed8";
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

const ProgressBar = ({ value, max, color }: { value: number; max: number; color: string }) => (
  <div className="w-full bg-slate-100 rounded-full h-2.5">
    <div className="h-2.5 rounded-full" style={{ width: `${Math.min(value / max * 100, 100)}%`, background: color }} />
  </div>
);

const HAS_COLORS = [OK, WARN, WARN, CRIT, CRIT];
const DM_COLORS  = [OK, WARN, CRIT, CRIT];

export default function HiperdiaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["hd-dashboard"],  queryFn: () => apiGet("/api/hiperdia-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: hasData }     = useQuery({ queryKey: ["hd-has"],        queryFn: () => apiGet("/api/hiperdia-apui/controle-has"),enabled: aba === "controle" });
  const { data: dmData }      = useQuery({ queryKey: ["hd-dm"],         queryFn: () => apiGet("/api/hiperdia-apui/controle-dm"), enabled: aba === "controle" });
  const { data: historico }   = useQuery({ queryKey: ["hd-historico"],  queryFn: () => apiGet("/api/hiperdia-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["hd-ind"],        queryFn: () => apiGet("/api/hiperdia-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",      icon: <Thermometer size={15}/> },
    { key: "controle",   label: "Controle HAS/DM",icon: <Activity size={15}/> },
    { key: "historico",  label: "Histórico",      icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores",    icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Thermometer size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Hiperdia — HAS e DM — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Hipertensão · Diabetes · Controle PA · HbA1c · ICSAP · FMS Apuí/AM</p>
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
              <KPI label="Hipertensos Cadastrados" value={dashRaw.hipertensos_cadastrados.toLocaleString()} color={BRAND} sub={`${dashRaw.hipertensos_cobertura_pct}% da estimativa`} />
              <KPI label="HAS Controlada"          value={`${dashRaw.hipertensos_controlados_pct}%`} color={CRIT} sub={`meta: ${dashRaw.meta_controlados_pct}%`} />
              <KPI label="Diabéticos Cadastrados"  value={dashRaw.diabeticos_cadastrados.toLocaleString()} color={BRAND} sub={`${dashRaw.diabeticos_cobertura_pct}% da estimativa`} />
              <KPI label="DM Controlado (HbA1c)"  value={`${dashRaw.diabeticos_controlados_pct}%`} color={CRIT} sub={`meta: ${dashRaw.meta_diabeticos_controlados_pct}%`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="HbA1c Média"             value={`${dashRaw.hba1c_media_pct}%`} color={CRIT} sub={`meta: < ${dashRaw.meta_hba1c_pct}%`} />
              <KPI label="Abandono Tratamento"     value={`${dashRaw.abandono_tratamento_pct}%`} color={CRIT} sub={`meta: ${dashRaw.meta_abandono_pct}%`} />
              <KPI label="Internações ICSAP/ano"   value={dashRaw.internacoes_icsap_has_dm_ano.toString()} color={CRIT} sub="evitáveis" />
              <KPI label="Amputações DM/ano"       value={dashRaw.amputacoes_dm_ano.toString()} color={CRIT} sub="membros inferiores" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cobertura e Controle</h3>
                <div className="space-y-3">
                  {[
                    { label: "Hipertensos cadastrados/estimativa", value: dashRaw.hipertensos_cobertura_pct, max: 100, color: WARN },
                    { label: "HAS com PA controlada",              value: dashRaw.hipertensos_controlados_pct,max: 70,  color: CRIT },
                    { label: "Diabéticos cadastrados/estimativa",  value: dashRaw.diabeticos_cobertura_pct,   max: 100, color: WARN },
                    { label: "DM com HbA1c controlada",           value: dashRaw.diabeticos_controlados_pct, max: 60,  color: CRIT },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-medium" style={{ color: b.color }}>{b.value}%</span>
                      </div>
                      <ProgressBar value={b.value} max={b.max} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>184 internações ICSAP/ano</b> por HAS e DM — R$ 515.200/ano em internações evitáveis com bom controle ambulatorial.</p>
                <p><b>8 amputações por pé diabético</b> em 2025 — programa de pé diabético não estruturado. Custo médio amputação: R$ 12.000 + reabilitação.</p>
                <p><b>28 AVCs associados à HAS</b> — 72% com PA > 140/90 antes do evento. Controle adequado reduz risco de AVC em até 40%.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "controle" && Array.isArray(hasData) && Array.isArray(dmData) && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Distribuição de PA — Hipertensos</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={hasData as any[]} dataKey="pacientes" nameKey="faixa" cx="50%" cy="50%" outerRadius={80} label={({ pct }: any) => `${pct}%`}>
                    {(hasData as any[]).map((_: any, i: number) => <Cell key={i} fill={HAS_COLORS[i] || BRAND} />)}
                  </Pie>
                  <Tooltip formatter={(v: any, n: any) => [`${v} pac.`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid gap-1 mt-2">
                {(hasData as any[]).map((h: any, i: number) => (
                  <div key={h.faixa} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: HAS_COLORS[i] || BRAND }} />
                      <span className="text-slate-600">{h.faixa}</span>
                    </div>
                    <span className="font-bold" style={{ color: HAS_COLORS[i] || BRAND }}>{h.pacientes} ({h.pct}%)</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Distribuição de HbA1c — Diabéticos</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={dmData as any[]} dataKey="pacientes" nameKey="faixa" cx="50%" cy="50%" outerRadius={80} label={({ pct }: any) => `${pct}%`}>
                    {(dmData as any[]).map((_: any, i: number) => <Cell key={i} fill={DM_COLORS[i] || BRAND} />)}
                  </Pie>
                  <Tooltip formatter={(v: any, n: any) => [`${v} pac.`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid gap-1 mt-2">
                {(dmData as any[]).map((d: any, i: number) => (
                  <div key={d.faixa} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: DM_COLORS[i] || BRAND }} />
                      <span className="text-slate-600">{d.faixa}</span>
                    </div>
                    <span className="font-bold" style={{ color: DM_COLORS[i] || BRAND }}>{d.pacientes} ({d.pct}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal — Hiperdia (Jan–Jun/2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="s" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n" dataKey="consultas"           name="Consultas"            stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n" dataKey="internacoes_icsap"   name="ICSAP"                stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="s" dataKey="controlados_has_pct" name="HAS controlada (%)"   stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="s" dataKey="controlados_dm_pct"  name="DM controlada (%)"    stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
