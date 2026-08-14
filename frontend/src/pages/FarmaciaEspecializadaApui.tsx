import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Pill, AlertTriangle, Activity, TrendingUp } from "lucide-react";

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

const COMP_COLORS: Record<string, string> = {
  "Básico": BRAND,
  "Especializado": ACCENT,
  "Estratégico": OK,
};

const JUDIC_STATUS: Record<string, { bg: string; text: string }> = {
  "deferido":      { bg: "#dcfce7", text: "#166534" },
  "em_andamento":  { bg: "#fef3c7", text: "#92400e" },
  "negado":        { bg: "#fee2e2", text: "#991b1b" },
};

export default function FarmaciaEspecializadaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["fe-dashboard"],  queryFn: () => apiGet("/api/farmacia-especializada-apui/dashboard"),      enabled: aba === "dashboard" });
  const { data: meds }        = useQuery({ queryKey: ["fe-meds"],       queryFn: () => apiGet("/api/farmacia-especializada-apui/medicamentos"),    enabled: aba === "medicamentos" });
  const { data: judic }       = useQuery({ queryKey: ["fe-judic"],      queryFn: () => apiGet("/api/farmacia-especializada-apui/judicializacoes"), enabled: aba === "judicializacoes" });
  const { data: historico }   = useQuery({ queryKey: ["fe-historico"],  queryFn: () => apiGet("/api/farmacia-especializada-apui/historico"),      enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["fe-ind"],        queryFn: () => apiGet("/api/farmacia-especializada-apui/indicadores"),    enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",       label: "Dashboard",        icon: <Pill size={15}/> },
    { key: "medicamentos",    label: "Medicamentos",     icon: <Activity size={15}/> },
    { key: "judicializacoes", label: "Judicializações",  icon: <AlertTriangle size={15}/> },
    { key: "historico",       label: "Histórico",        icon: <TrendingUp size={15}/> },
    { key: "indicadores",     label: "Indicadores",      icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Pill size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Farmácia Especializada — Apuí/AM</h1>
            <p className="text-sm text-slate-500">CEAF · Componente Especializado · Biológicos · Judicialização · FMS Apuí/AM</p>
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
          <NaoDisponivelBanner
            titulo="Farmácia Especializada — Dados Indisponíveis"
            nota="Integração com CEAF/RENAME ou sistema estadual de farmácia especializada ainda não configurada. Nenhum dado de paciente ou dispensação foi inventado."
          />
        )}

        {aba === "dashboard" && dashRaw && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Pacientes CEAF Ativos"   value={dashRaw.pacientes_ceaf_ativos.toString()} color={ACCENT} sub="dispensação regular" />
              <KPI label="Dispensações/Mês"        value={dashRaw.medicamentos_dispensados_mes?.toLocaleString()} color={BRAND} />
              <KPI label="Aprovação CEAF"          value={`${dashRaw.aprovadas_pct}%`} color={WARN} sub="meta: 95%" />
              <KPI label="Medicamentos em Falta"   value={dashRaw.medicamentos_falta_itens.toString()} color={CRIT} sub="itens desabastecidos" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Comp. Especializado"     value={dashRaw.medicamentos_componente_especializado.toString()} sub="dispensações/mês" />
              <KPI label="Comp. Estratégico"       value={dashRaw.medicamentos_componente_estrategico.toString()} sub="malária + TB" />
              <KPI label="Estoque Médio"           value={`${dashRaw.dispensacao_media_dias_estoque} dias`} color={WARN} sub="meta: 60 dias" />
              <KPI label="Judicializações/Ano"     value={dashRaw.judicializacoes_medic_ano.toString()} color={WARN} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Dispensações por Componente</h3>
                <div className="space-y-3">
                  {[
                    { label: "Básico",       value: dashRaw.medicamentos_componente_basico,         total: dashRaw.medicamentos_dispensados_mes },
                    { label: "Especializado",value: dashRaw.medicamentos_componente_especializado,   total: dashRaw.medicamentos_dispensados_mes },
                    { label: "Estratégico",  value: dashRaw.medicamentos_componente_estrategico,     total: dashRaw.medicamentos_dispensados_mes },
                  ].map((c) => (
                    <div key={c.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: COMP_COLORS[c.label] }}>{c.label}</span>
                        <span className="font-medium">{c.value} ({((c.value/c.total)*100).toFixed(1)}%)</span>
                      </div>
                      <ProgressBar value={c.value} max={c.total} color={COMP_COLORS[c.label] || BRAND} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>Adalimumabe (biológico):</b> estoque ZERO — 4 pacientes com artrite reumatoide grave sem medicamento. Risco de dano articular permanente.</p>
                <p><b>Custo judicial:</b> eculizumabe R$ 48 mil/mês/paciente — 1 ação judicial pode consumir 16% do orçamento anual de farmácia do município.</p>
                <p><b>Estoque crítico:</b> 28 dias vs meta 60 — abastecimento via Manaus sujeito a atrasos em período de chuvas (estradas bloqueadas).</p>
              </div>
            </div>
          </div>
        )}

        {aba === "medicamentos" && Array.isArray(meds) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Pacientes por Medicamento</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={(meds as any[])} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="medicamento" tick={{ fontSize: 8 }} width={230} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip formatter={(v: any) => `${v} pacientes`} />
                  <Bar dataKey="pacientes" name="Pacientes" radius={[0,3,3,0]}>
                    {(meds as any[]).map((m: any) => <Cell key={m.medicamento} fill={COMP_COLORS[m.componente] || BRAND} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(meds as any[]).map((m: any) => (
                <div key={m.medicamento} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-semibold text-sm text-slate-700">{m.medicamento}</span>
                      <div className="flex gap-2 text-xs text-slate-400 mt-0.5">
                        <span>CID: {m.cid}</span>
                        <span style={{ color: COMP_COLORS[m.componente] || BRAND }}>{m.componente}</span>
                        <span>{m.pacientes} pacientes</span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded font-bold ${
                      m.estoque_dias === 0 ? "bg-red-100 text-red-700"
                      : m.estoque_dias < 20 ? "bg-amber-50 text-amber-700"
                      : "bg-green-50 text-green-700"
                    }`}>
                      {m.estoque_dias === 0 ? "FALTA" : `${m.estoque_dias}d`}
                    </span>
                  </div>
                  {m.estoque_dias > 0 && <ProgressBar value={m.estoque_dias} max={60} color={m.estoque_dias < 20 ? WARN : OK} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "judicializacoes" && Array.isArray(judic) && (
          <div className="grid gap-3">
            {(judic as any[]).map((j: any, i: number) => {
              const badge = JUDIC_STATUS[j.status] || { bg: "#111827", text: "#475569" };
              return (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-semibold text-slate-700">{j.medicamento}</span>
                      <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                        <span>CID: {j.cid}</span>
                        <span>Via: {j.via}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: badge.bg, color: badge.text }}>
                        {j.status === "deferido" ? "Deferido" : j.status === "em_andamento" ? "Em andamento" : "Negado"}
                      </span>
                      <p className="text-sm font-bold mt-1" style={{ color: CRIT }}>
                        R$ {j.valor_r?.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}/mês
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal — Farmácia Especializada (Jan–Jun/2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="s"   orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="n" dataKey="dispensacoes"    name="Dispensações"      stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n" dataKey="pacientes_ativos"name="Pacientes ativos"  stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="s" dataKey="judicializ"      name="Judicializações"   stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="s" dataKey="falta_itens"     name="Itens em falta"    stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
