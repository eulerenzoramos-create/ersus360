import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { FlaskConical, AlertTriangle, Activity, Users } from "lucide-react";

const BRAND  = "#1e3a5f";
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

const ProgressBar = ({ value, max, color }: { value: number; max: number; color: string }) => (
  <div className="w-full bg-slate-100 rounded-full h-2.5">
    <div className="h-2.5 rounded-full" style={{ width: `${Math.min(value / max * 100, 100)}%`, background: color }} />
  </div>
);

const CAT_COLORS: Record<string, string> = {
  "Magreza acentuada": CRIT,
  "Magreza": WARN,
  "Eutrofia": OK,
  "Risco sobrepeso": "#f97316",
  "Sobrepeso": "#f97316",
  "Sobrepeso/Obesidade": "#f97316",
  "Obesidade": CRIT,
  "Baixo peso": WARN,
  "Adequado": OK,
};

export default function VigilanciaNutricional() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["vn-dashboard"],  queryFn: () => apiGet("/api/vigilancia-nutricional/dashboard"),        enabled: aba === "dashboard" });
  const { data: estadoNut }   = useQuery({ queryKey: ["vn-estado"],     queryFn: () => apiGet("/api/vigilancia-nutricional/estado-nutricional"),enabled: aba === "estado" });
  const { data: micronut }    = useQuery({ queryKey: ["vn-micro"],      queryFn: () => apiGet("/api/vigilancia-nutricional/micronutrientes"),   enabled: aba === "micronutrientes" });
  const { data: historico }   = useQuery({ queryKey: ["vn-historico"],  queryFn: () => apiGet("/api/vigilancia-nutricional/historico"),         enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["vn-ind"],        queryFn: () => apiGet("/api/vigilancia-nutricional/indicadores"),       enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",       label: "Dashboard",      icon: <FlaskConical size={15}/> },
    { key: "estado",          label: "Estado Nutric.", icon: <Users size={15}/> },
    { key: "micronutrientes", label: "Micronutrientes",icon: <Activity size={15}/> },
    { key: "historico",       label: "Histórico",      icon: <Activity size={15}/> },
    { key: "indicadores",     label: "Indicadores",    icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <FlaskConical size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Vigilância Nutricional (SISVAN)</h1>
            <p className="text-sm text-slate-500">Estado Nutricional · Anemia · Micronutrientes · Bolsa Família · FMS Apuí/AM</p>
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
              <KPI label="Acompanham. SISVAN/Mês" value={dashRaw.acompanhamentos_sisvan_mes.toLocaleString()} color={ACCENT} />
              <KPI label="Cobertura SISVAN"        value={`${dashRaw.cobertura_sisvan_pct}%`}     color={WARN} sub="meta: 75%" />
              <KPI label="Desnutrição Infantil"    value={`${dashRaw.desnutricao_infantil_pct}%`} color={WARN} sub="crianças <5a" />
              <KPI label="Desnutrição Grave"       value={`${dashRaw.desnutricao_grave_pct}%`}    color={CRIT} sub="urgência clínica" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Anemia em Crianças"     value={`${dashRaw.anemia_criancas_pct}%`}      color={CRIT} sub="<5 anos" />
              <KPI label="Anemia em Gestantes"    value={`${dashRaw.anemia_gestantes_pct}%`}     color={CRIT} />
              <KPI label="Vitamina A suplementada" value={`${dashRaw.vitamina_a_suplementada_pct}%`} color={WARN} sub="meta: 90%" />
              <KPI label="Acomp. Bolsa Família"   value={`${dashRaw.bolsa_familia_acomp_pct}%`}  color={WARN} sub="cumprimento condicionalidades" />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900">
              <b>Dupla carga nutricional:</b> desnutrição infantil nas comunidades ribeirinhas e rurais (8,4%) convive com crescente obesidade infantil em área urbana (10,6% em 5–9a). Anemia afeta 32,4% das crianças &lt;5a — fortemente associada à malária e baixo consumo de ferro.
            </div>
          </div>
        )}

        {aba === "estado" && Array.isArray(estadoNut) && (
          <div className="space-y-4">
            {(estadoNut as any[]).map((faixa: any) => (
              <div key={faixa.faixa} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-700">{faixa.faixa}</h3>
                  <span className="text-xs text-slate-400">n={faixa.n_acompanhados.toLocaleString()}</span>
                </div>
                <ResponsiveContainer width="100%" height={40}>
                  <BarChart data={[faixa.categorias.reduce((acc: any, c: any) => { acc[c.cat] = c.pct; return acc; }, {})]} layout="vertical">
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" hide />
                    {faixa.categorias.map((c: any) => (
                      <Bar key={c.cat} dataKey={c.cat} stackId="a" fill={CAT_COLORS[c.cat] || WARN} />
                    ))}
                    <Tooltip />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-3">
                  {faixa.categorias.map((c: any) => (
                    <div key={c.cat} className="flex items-center gap-1 text-xs">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: CAT_COLORS[c.cat] || WARN }} />
                      <span className="text-slate-600">{c.cat}: <b style={{ color: statusColor(c.status) }}>{c.pct}%</b></span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "micronutrientes" && Array.isArray(micronut) && (
          <div className="grid gap-3">
            {(micronut as any[]).map((m: any) => {
              const val = m.prevalencia_pct ?? m.cobertura_pct;
              const meta = m.meta_pct;
              const isPrevalencia = m.prevalencia_pct != null;
              return (
                <div key={m.micronutriente} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-700 text-sm">{m.micronutriente}</span>
                    <span className="font-bold text-sm" style={{ color: statusColor(m.status) }}>
                      {val}% {isPrevalencia ? "(prevalência)" : "(cobertura)"}
                    </span>
                  </div>
                  <ProgressBar value={val} max={meta} color={statusColor(m.status)} />
                  <p className="text-xs text-slate-400 mt-1">Meta: {meta}%</p>
                </div>
              );
            })}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal — Cobertura SISVAN, Desnutrição e Anemia</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="pct" tick={{ fontSize: 11 }} unit="%" />
                <YAxis yAxisId="cob" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="pct"  dataKey="desnutricao_inf_pct" name="Desnutrição Inf. %" stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct"  dataKey="anemia_cri_pct"      name="Anemia Crianças %" stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="cob"  dataKey="cobertura_pct"        name="Cobertura SISVAN %" stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
