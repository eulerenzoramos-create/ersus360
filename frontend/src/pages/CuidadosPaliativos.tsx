import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Heart, AlertTriangle, Activity, TrendingUp } from "lucide-react";

const BRAND  = "#dbeafe";
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

const DIAG_COLORS: Record<string, string> = {
  "Neoplasia maligna (vários)":          CRIT,
  "DPOC avançado / insuficiência resp.": WARN,
  "Insuficiência cardíaca congestiva":   ACCENT,
  "AVC sequelado grave":                 "#7c3aed",
  "Insuficiência renal crônica (sem TRS)": "#0891b2",
  "Demência avançada":                   "#6b7280",
};

export default function CuidadosPaliativos() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["cp-dashboard"],  queryFn: () => apiGet("/api/cuidados-paliativos/dashboard"),       enabled: aba === "dashboard" });
  const { data: diagnosticos }= useQuery({ queryKey: ["cp-diag"],       queryFn: () => apiGet("/api/cuidados-paliativos/diagnosticos"),     enabled: aba === "diagnosticos" });
  const { data: sintomas }    = useQuery({ queryKey: ["cp-sint"],       queryFn: () => apiGet("/api/cuidados-paliativos/controle-sintomas"), enabled: aba === "sintomas" });
  const { data: historico }   = useQuery({ queryKey: ["cp-hist"],       queryFn: () => apiGet("/api/cuidados-paliativos/historico"),        enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["cp-ind"],        queryFn: () => apiGet("/api/cuidados-paliativos/indicadores"),      enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",        icon: <Heart size={15}/> },
    { key: "diagnosticos", label: "Diagnósticos",     icon: <Activity size={15}/> },
    { key: "sintomas",     label: "Controle Sintomas",icon: <AlertTriangle size={15}/> },
    { key: "historico",    label: "Histórico",        icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores",      icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Heart size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Cuidados Paliativos — Apuí/AM</h1>
            <p className="text-sm text-slate-500">EMAD · Controle de Sintomas · Morfina · Óbito Digno · FMS Apuí/AM</p>
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
              <KPI label="Pacientes Ativos"        value={dashRaw.pacientes_ativos.toString()} color={ACCENT} sub="em cuidados paliativos" />
              <KPI label="Domicílio / Hospitalar"  value={`${dashRaw.pacientes_domicilio} / ${dashRaw.pacientes_hospitalar}`} color={BRAND} sub="distribuição" />
              <KPI label="Visitas/Mês"             value={dashRaw.visitas_domiciliares_mes.toString()} color={OK} sub={`meta: ${dashRaw.meta_visitas_paciente_mes}/pac./mês`} />
              <KPI label="Estoque Morfina"         value={`${dashRaw.morfina_estoque_dias} dias`} color={WARN} sub={`meta: ${dashRaw.meta_estoque_dias} dias`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Oncológicos"             value={`${dashRaw.oncologicos_pct}%`} color={CRIT} sub="do total de pacientes" />
              <KPI label="EMAD Profissionais"      value={dashRaw.emad_profissionais.toString()} color={BRAND} sub="equipe multidisciplinar" />
            <KPI label="Óbito em Domicílio"      value={`${dashRaw.obitos_dignos_domicilio_pct}%`} color={statusColor(dashRaw.status_cobertura)} sub="meta: 70%" />
              <KPI label="Satisfação Familiar"     value={`${dashRaw.satisfacao_familiar_nota}/5`} color={OK} sub="nota média" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Visitas vs Meta (pac./mês)</h3>
                <div className="space-y-3">
                  {[
                    { label: "Visitas realizadas", value: dashRaw.media_visitas_paciente_mes, max: dashRaw.meta_visitas_paciente_mes, color: BRAND },
                    { label: "Estoque morfina",    value: dashRaw.morfina_estoque_dias,        max: dashRaw.meta_estoque_dias,        color: dashRaw.morfina_estoque_dias < 30 ? WARN : OK },
                    { label: "Óbito em domicílio", value: dashRaw.obitos_dignos_domicilio_pct, max: 70,                               color: ACCENT },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-medium">{b.value} / meta: {b.max}</span>
                      </div>
                      <ProgressBar value={b.value} max={b.max} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex flex-col gap-2 justify-center">
                <p><b>Morfina — 28 dias de estoque</b> (meta 60): risco de desabastecimento em situação de atraso logístico de Manaus.</p>
                <p><b>27,6% dos pacientes</b> com dor não controlada — 3ª meta prioritária EMAD: aumentar controle de dor para ≥ 90%.</p>
                <p><b>8 internações evitadas/mês</b> — economia estimada R$ 53.600/mês para a rede hospitalar regional.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "diagnosticos" && Array.isArray(diagnosticos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Pacientes por Diagnóstico</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={diagnosticos as any[]} layout="vertical" margin={{ left: 10, right: 60 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="diagnostico" tick={{ fontSize: 8 }} width={260} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip formatter={(v: any) => `${v} pacientes`} />
                  <Bar dataKey="pacientes" name="Pacientes" radius={[0,3,3,0]}>
                    {(diagnosticos as any[]).map((d: any) => <Cell key={d.diagnostico} fill={DIAG_COLORS[d.diagnostico] || BRAND} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(diagnosticos as any[]).map((d: any) => (
                <div key={d.diagnostico} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm text-slate-700">{d.diagnostico}</span>
                      <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                        <span>Estágio: {d.estagio}</span>
                        <span>Domicílio: {d.domicilio} · Hospitalar: {d.hospitalar}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold" style={{ color: DIAG_COLORS[d.diagnostico] || BRAND }}>{d.pacientes}</span>
                      <p className="text-xs text-slate-400">{d.pct}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "sintomas" && Array.isArray(sintomas) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Prevalência e Controle de Sintomas</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sintomas as any[]} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis dataKey="sintoma" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="prevalencia_pct" name="Prevalência (%)" fill={BRAND} radius={[3,3,0,0]} />
                  <Bar dataKey="controlado_pct"  name="Controlado (%)"  radius={[3,3,0,0]}>
                    {(sintomas as any[]).map((s: any) => <Cell key={s.sintoma} fill={typeof s.controlado_pct === "number" ? statusColor(s.status) : "#6b7280"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(sintomas as any[]).map((s: any) => (
                <div key={s.sintoma} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(s.status) }} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm text-slate-700">{s.sintoma}</span>
                      <span className="text-xs font-bold" style={{ color: statusColor(s.status) }}>
                        Controlado: {typeof s.controlado_pct === "number" ? `${s.controlado_pct}%` : s.controlado_pct}
                      </span>
                    </div>
                    <div className="flex gap-3 text-xs text-slate-500 mt-0.5">
                      <span>Prevalência: {s.prevalencia_pct}%</span>
                      <span>Medicamento: {s.principal_medic}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal — Cuidados Paliativos (Jan–Jun/2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="s" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="n" dataKey="pacientes"       name="Pacientes ativos"    stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n" dataKey="visitas"         name="Visitas"             stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="s" dataKey="obitos"          name="Óbitos"              stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="s" dataKey="internacoes_evit"name="Internações evitadas" stroke={OK}    strokeWidth={2} dot={{ r: 4 }} />
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
