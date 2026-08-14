import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import { BRL, BRL_AXIS } from "../lib/fmt";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Landmark, AlertTriangle, DollarSign, Activity } from "lucide-react";

const BRAND  = "#dbeafe";
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

const PIE_COLORS = ["#2563eb","#7c3aed","#0891b2","#d97706","#dc2626","#16a34a","#6b7280"];

export default function FundoMunicipal() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({ queryKey: ["fm-dashboard"], queryFn: () => apiGet("/api/fundo-municipal/dashboard"), enabled: aba === "dashboard" });
  const { data: receitas } = useQuery({ queryKey: ["fm-receitas"], queryFn: () => apiGet("/api/fundo-municipal/receitas"), enabled: aba === "receitas" });
  const { data: despesas } = useQuery({ queryKey: ["fm-despesas"], queryFn: () => apiGet("/api/fundo-municipal/despesas"), enabled: aba === "despesas" });
  const { data: blocos } = useQuery({ queryKey: ["fm-blocos"], queryFn: () => apiGet("/api/fundo-municipal/blocos"), enabled: aba === "blocos" });
  const { data: historico } = useQuery({ queryKey: ["fm-historico"], queryFn: () => apiGet("/api/fundo-municipal/historico"), enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["fm-indicadores"], queryFn: () => apiGet("/api/fundo-municipal/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",   icon: <Landmark size={15}/> },
    { key: "receitas",   label: "Receitas",     icon: <DollarSign size={15}/> },
    { key: "despesas",   label: "Despesas",     icon: <DollarSign size={15}/> },
    { key: "blocos",     label: "Blocos SUS",   icon: <Activity size={15}/> },
    { key: "historico",  label: "Histórico",    icon: <Activity size={15}/> },
    { key: "indicadores",label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  const fmt = (v: number) => BRL(v );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Landmark size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Fundo Municipal de Saúde</h1>
            <p className="text-sm text-slate-500">Receitas · Despesas · Blocos SUS · Aplicação Constitucional · FMS Apuí/AM</p>
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
              <KPI label="Receita Prevista"    value={fmt(dashRaw.receita_total_prevista_r)} />
              <KPI label="Receita Realizada"   value={fmt(dashRaw.receita_total_realizada_r)} color={ACCENT} />
              <KPI label="Despesa Total"       value={fmt(dashRaw.despesa_total_r)} color={WARN} />
              <KPI label="Saldo Acumulado"     value={`R$ ${dashRaw.saldo_acumulado_r?.toLocaleString()}`} color={dashRaw.saldo_acumulado_r >= 0 ? OK : CRIT} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Aplic. Constitucional" value={`${dashRaw.percentual_impostos_saude}%`} sub="mínimo: 15%" color={OK} />
              <KPI label="Pessoal/Despesa"       value={`${dashRaw.pessoal_pct_despesa}%`}       sub="limite: 60%" color={dashRaw.pessoal_pct_despesa > 60 ? CRIT : OK} />
              <KPI label="Judicialização/Mês"    value={BRL(dashRaw.judicializacao_r)} color={CRIT} />
              <KPI label="Exec. Emendas"         value={`${dashRaw.emendas_execucao_pct}%`} color={dashRaw.emendas_execucao_pct >= 90 ? OK : CRIT} />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <b>Folha acima do limite prudencial</b> ({dashRaw.pessoal_pct_despesa}% vs 60%). Emendas parlamentares com execução de apenas {dashRaw.emendas_execucao_pct}% — risco de devolução. Judicialização crescente: {BRL(dashRaw.judicializacao_r)}/mês.
            </div>
          </div>
        )}

        {aba === "receitas" && Array.isArray(receitas) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Execução por Fonte de Receita (%)</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={receitas} layout="vertical" margin={{ left: 10, right: 50 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} unit="%" />
                  <YAxis type="category" dataKey="fonte" tick={{ fontSize: 8 }} width={240} />
                  <Tooltip />
                  <Bar dataKey="execucao_pct" name="Execução %" radius={[0,3,3,0]}>
                    {(receitas as any[]).map((r: any) => (
                      <Cell key={r.fonte} fill={statusColor(r.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(receitas as any[]).map((r: any) => (
                <div key={r.fonte} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: statusColor(r.status) }} />
                    <span className="font-semibold text-slate-700 text-sm">{r.fonte}</span>
                  </div>
                  <div className="flex gap-6 text-xs text-slate-500">
                    <span>Previsto: <b>{fmt(r.valor_previsto_r)}</b></span>
                    <span>Realizado: <b style={{ color: statusColor(r.status) }}>{fmt(r.valor_realizado_r)}</b></span>
                    <span style={{ color: statusColor(r.status) }}><b>{r.execucao_pct}%</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "despesas" && Array.isArray(despesas) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Composição das Despesas</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={despesas} dataKey="percentual_total" nameKey="grupo" cx="50%" cy="50%" outerRadius={80} label={({ grupo, percentual_total }) => `${percentual_total}%`} labelLine={false}>
                    {(despesas as any[]).map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {(despesas as any[]).map((d: any, i: number) => (
                <div key={d.grupo} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-sm text-slate-700">{d.grupo}</span>
                  </div>
                  <div className="text-xs font-bold" style={{ color: statusColor(d.status) }}>
                    {fmt(d.valor_r)} · {d.percentual_total}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "blocos" && Array.isArray(blocos) && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Execução por Bloco de Financiamento SUS (%)</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={blocos} layout="vertical" margin={{ left: 10, right: 50 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} unit="%" />
                  <YAxis type="category" dataKey="bloco" tick={{ fontSize: 8 }} width={220} />
                  <Tooltip />
                  <Bar dataKey="execucao_pct" name="Execução %" radius={[0,3,3,0]}>
                    {(blocos as any[]).map((b: any) => (
                      <Cell key={b.bloco} fill={statusColor(b.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(blocos as any[]).map((b: any) => (
                <div key={b.bloco} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: statusColor(b.status) }} />
                    <span className="font-semibold text-slate-700 text-sm">{b.bloco}</span>
                  </div>
                  <div className="flex gap-5 text-xs text-slate-500">
                    <span>Previsto: <b>{fmt(b.previsto_r)}</b></span>
                    <span>Realizado: <b>{fmt(b.realizado_r)}</b></span>
                    <span style={{ color: statusColor(b.status) }}><b>{b.execucao_pct}%</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Receita vs Despesa Mensal — 2026 (R$)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={BRL_AXIS} />
                <Tooltip formatter={(v: any) => `R$ ${v?.toLocaleString()}`} />
                <Legend />
                <Line dataKey="receita_r"  name="Receita"  stroke={OK}    strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="despesa_r"  name="Despesa"  stroke={CRIT}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="saldo_r"    name="Saldo"    stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
                      {`${typeof ind.valor === "number" && ind.valor > 10000 ? "R$ " + ind.valor?.toLocaleString() : ind.valor} ${ind.unidade}`}
                      {ind.meta != null ? ` / meta: ${ind.meta} ${ind.unidade}` : ""}
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
