import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { DollarSign, AlertTriangle, Activity, TrendingUp } from "lucide-react";

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

const fmtR = (v: number) => `R$ ${(v / 1000000).toFixed(2)}M`;
const fmtK = (v: number) => `R$ ${(v / 1000).toFixed(0)}k`;

export default function SaudeFinanceiraApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["sf-dashboard"], queryFn: () => apiGet("/api/saude-financeira-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: orcamento }   = useQuery({ queryKey: ["sf-orc"],       queryFn: () => apiGet("/api/saude-financeira-apui/orcamento"),   enabled: aba === "orcamento" });
  const { data: fontes }      = useQuery({ queryKey: ["sf-fontes"],    queryFn: () => apiGet("/api/saude-financeira-apui/fontes"),      enabled: aba === "fontes" });
  const { data: historico }   = useQuery({ queryKey: ["sf-hist"],      queryFn: () => apiGet("/api/saude-financeira-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["sf-ind"],       queryFn: () => apiGet("/api/saude-financeira-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <DollarSign size={15}/> },
    { key: "orcamento",   label: "Orçamento",  icon: <Activity size={15}/> },
    { key: "fontes",      label: "Fontes",     icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  const PIE_COLORS = [BRAND, ACCENT, OK, WARN, CRIT];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <DollarSign size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Execução Orçamentária — Apuí/AM</h1>
            <p className="text-sm text-slate-500">FMS · FNS · Receitas · Execução · Per Capita · FMS Apuí/AM</p>
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
              <KPI label="Orçamento FMS 2025"    value={fmtR(dashRaw.orcamento_fms_2025)}   color={BRAND} />
              <KPI label="Executado"             value={`${dashRaw.executado_pct}%`}         color={statusColor(dashRaw.status_execucao)} sub={fmtR(dashRaw.executado_valor)} />
              <KPI label="Vinculação saúde"      value={`${dashRaw.aplicado_saude_receitas_pct}%`} color={OK} sub={`mín. constitucional: ${dashRaw.vinculacao_constitucional_pct}%`} />
              <KPI label="Per capita"            value={`R$ ${dashRaw.custo_per_capita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} color={WARN} sub="meta: R$ 2.000/hab" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Restos a pagar"        value={fmtK(dashRaw.restos_a_pagar)}         color={WARN} sub="9% do orçamento" />
              <KPI label="Inadimplência fornec." value={fmtK(dashRaw.inadimplencia_fornecedores)} color={CRIT} />
              <KPI label="Transferências FNS"    value={`${dashRaw.transferencias_sus_pct_orcamento}%`} color={BRAND} sub="do orçamento total" />
              <KPI label="Recursos próprios"     value={`${dashRaw.recursos_proprios_pct}%`}  color={ACCENT} sub="do orçamento total" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Composição do Orçamento 2025</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "FNS/Federal", value: dashRaw.transferencias_sus_pct_orcamento },
                        { name: "Rec. próprios", value: dashRaw.recursos_proprios_pct },
                        { name: "Emendas", value: dashRaw.emendas_parlamentares_pct },
                      ]}
                      cx="50%" cy="50%" outerRadius={72} dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                      labelLine={false}>
                      {PIE_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex flex-col gap-2 justify-center">
                <p><b>72,4% de execução</b> — R$ 3,94M do orçamento não executado. Principal gargalo: licitações desertas na Assistência Farmacêutica (47,9% executado).</p>
                <p><b>68,4% de dependência federal</b> — vulnerabilidade alta. Suspensão de convênios pode comprometer serviços essenciais em 30 dias.</p>
                <p><b>Per capita de R$ 1.428</b> — 28,6% abaixo da média nacional estimada. Restrição fiscal impacta diretamente a qualidade dos serviços.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "orcamento" && Array.isArray(orcamento) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Orçado vs. Executado por Área (R$ mil)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={(orcamento as any[]).map((o: any) => ({
                    area: o.area.substring(0, 22), orcado: o.orcado / 1000, executado: o.executado / 1000
                  }))}
                  layout="vertical" margin={{ left: 10, right: 60 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={(v) => `${v}k`} />
                  <YAxis type="category" dataKey="area" tick={{ fontSize: 7 }} width={180} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip formatter={(v: any) => `R$ ${v.toFixed(0)}k`} />
                  <Legend />
                  <Bar dataKey="orcado"    name="Orçado"    fill="#374151" radius={[0,3,3,0]} />
                  <Bar dataKey="executado" name="Executado" radius={[0,3,3,0]}>
                    {(orcamento as any[]).map((o: any) => <Cell key={o.area} fill={statusColor(o.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(orcamento as any[]).map((o: any) => (
                <div key={o.area} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ background: statusColor(o.status) }} />
                      <div>
                        <span className="font-semibold text-sm text-slate-700">{o.area}</span>
                        <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                          <span>Orçado: {fmtR(o.orcado)}</span>
                          <span>Executado: {fmtR(o.executado)}</span>
                        </div>
                      </div>
                    </div>
                    <span className="font-bold text-sm" style={{ color: statusColor(o.status) }}>{o.exec_pct}%</span>
                  </div>
                  <ProgressBar value={o.exec_pct} max={100} color={statusColor(o.status)} />
                  <p className="text-xs text-slate-400 mt-1">{o.obs}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "fontes" && Array.isArray(fontes) && (
          <div className="grid gap-3">
            {(fontes as any[]).map((f: any) => (
              <div key={f.fonte} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ background: statusColor(f.status) }} />
                    <div>
                      <span className="font-semibold text-sm text-slate-700">{f.fonte}</span>
                      <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                        <span>{fmtR(f.valor)}</span>
                        <span>{f.pct}% do orçamento</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{f.obs}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Orçamento FMS (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={(historico as any[]).map((h: any) => ({ ...h, orc_M: h.orcamento / 1000000 }))}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="m"   tick={{ fontSize: 11 }} tickFormatter={(v) => `${v.toFixed(1)}M`} />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip formatter={(v: any, n: string) => n === "Orçamento (R$M)" ? `R$ ${v.toFixed(2)}M` : `${v}%`} />
                <Legend />
                <Line yAxisId="m"   dataKey="orc_M"         name="Orçamento (R$M)"    stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="executado_pct"  name="Execução %"          stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="vinculacao_pct" name="Vinculação %"         stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
