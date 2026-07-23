import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Scale, AlertTriangle, DollarSign, Activity } from "lucide-react";

const BRAND  = "#1e1b4b";
const ACCENT = "#4f46e5";
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

const CUMP_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  cumprido:      { bg: "#f0fdf4", text: OK,    label: "Cumprido" },
  em_andamento:  { bg: "#fefce8", text: WARN,  label: "Em Andamento" },
  atrasado:      { bg: "#fff7ed", text: WARN,  label: "Atrasado" },
  descumprido:   { bg: "#fef2f2", text: CRIT,  label: "DESCUMPRIDO" },
};

const TEND_COLORS: Record<string, string> = { crescente: CRIT, estavel: WARN, decrescente: OK };

export default function JudicializacaoSaude() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({ queryKey: ["jud-dashboard"], queryFn: () => apiGet("/api/judicializacao-saude/dashboard"), enabled: aba === "dashboard" });
  const { data: processos } = useQuery({ queryKey: ["jud-processos"], queryFn: () => apiGet("/api/judicializacao-saude/processos"), enabled: aba === "processos" });
  const { data: porObjeto } = useQuery({ queryKey: ["jud-objeto"], queryFn: () => apiGet("/api/judicializacao-saude/por-objeto"), enabled: aba === "objeto" });
  const { data: historico } = useQuery({ queryKey: ["jud-historico"], queryFn: () => apiGet("/api/judicializacao-saude/historico"), enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["jud-indicadores"], queryFn: () => apiGet("/api/judicializacao-saude/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",   icon: <AlertTriangle size={15}/> },
    { key: "processos",  label: "Processos",   icon: <AlertTriangle size={15}/> },
    { key: "objeto",     label: "Por Objeto",  icon: <DollarSign size={15}/> },
    { key: "historico",  label: "Histórico",   icon: <Activity size={15}/> },
    { key: "indicadores",label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <AlertTriangle size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Judicialização da Saúde</h1>
            <p className="text-sm text-slate-500">Processos Ativos · Cumprimento · Custo · Defensoria · FMS Apuí/AM</p>
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
              <KPI label="Processos Ativos"   value={dashRaw.processos_ativos.toString()}               color={CRIT} />
              <KPI label="Novos/Mês"          value={dashRaw.novos_mes.toString()}                      color={WARN} />
              <KPI label="Custo/Mês"          value={`R$ ${(dashRaw.custo_mensal_r/1000).toFixed(0)}k`} color={CRIT} />
              <KPI label="Custo Acum./Ano"    value={`R$ ${(dashRaw.custo_acumulado_ano_r/1_000_000).toFixed(2)}M`} color={CRIT} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Cumprimento"         value={`${dashRaw.cumprimento_pct}%`}  color={dashRaw.cumprimento_pct >= 95 ? OK : CRIT} />
              <KPI label="Descumprimentos"     value={dashRaw.descumprimentos.toString()} color={CRIT} sub="risco de multa diária" />
              <KPI label="Origem Defensoria"   value={`${dashRaw.origem_defensoria_pct}%`} color={ACCENT} />
              <KPI label="Origem MP"           value={`${dashRaw.origem_mp_pct}%`} color={WARN} />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <b>{dashRaw.descumprimentos} ordens judiciais descumpridas</b> — multa diária de R$ 500–5.000 por processo. Custo total estimado R$ {(dashRaw.custo_acumulado_ano_r/1_000_000).toFixed(2)}M em 2026. Taxa de cumprimento: {dashRaw.cumprimento_pct}% (meta: 95%).
            </div>
          </div>
        )}

        {aba === "processos" && Array.isArray(processos) && (
          <div className="grid gap-3">
            {(processos as any[]).map((p: any) => {
              const badge = CUMP_COLORS[p.status_cumprimento] || CUMP_COLORS["em_andamento"];
              return (
                <div key={p.processo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400">{p.processo}</span>
                        <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ background: badge.bg, color: badge.text }}>{badge.label}</span>
                        {p.advogado_mp && <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold">MP</span>}
                      </div>
                      <p className="font-semibold text-slate-700 text-sm mt-1">{p.objeto}</p>
                      <p className="text-xs text-slate-400">{p.origem} · prazo: {p.prazo_cumprimento_d} dias</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg" style={{ color: CRIT }}>R$ {p.valor_mensal_r.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">/mês</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {aba === "objeto" && Array.isArray(porObjeto) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Custo Mensal por Objeto da Ação (R$)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={porObjeto} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="objeto" tick={{ fontSize: 8 }} width={220} />
                  <Tooltip formatter={(v: any) => `R$ ${v.toLocaleString()}`} />
                  <Bar dataKey="custo_mensal_r" name="Custo/mês" fill={ACCENT} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(porObjeto as any[]).map((obj: any) => (
                <div key={obj.objeto} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                  <span className="font-semibold text-slate-700 text-sm">{obj.objeto}</span>
                  <div className="flex gap-5 text-xs text-slate-500">
                    <span>Processos: <b>{obj.processos}</b></span>
                    <span>Custo/mês: <b>R$ {obj.custo_mensal_r.toLocaleString()}</b></span>
                    <span style={{ color: TEND_COLORS[obj.tendencia] }}>
                      {obj.tendencia === "crescente" ? "↑ Crescente" : obj.tendencia === "estavel" ? "→ Estável" : "↓ Decrescente"}
                    </span>
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
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="r"   orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip />
                <Legend />
                <Line yAxisId="n" dataKey="total_ativos"       name="Processos Ativos"  stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n" dataKey="novos_processos"    name="Novos"             stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="r" dataKey="custo_mensal_r"     name="Custo/mês (R$)"   stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
