import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { TrendingDown, AlertTriangle, TrendingUp, Activity } from "lucide-react";

const BRAND  = "#dbeafe";
const ACCENT = "#1d4ed8";
const OK     = "#16a34a";
const WARN   = "#d97706";
const CRIT   = "#dc2626";

function statusColor(s: string) {
  if (s === "critico") return CRIT;
  if (s === "atencao") return WARN;
  return OK;
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

export default function EconomiaSaudeApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }          = useQuery({ queryKey: ["eco-dashboard"],   queryFn: () => apiGet("/api/economia-saude-apui/dashboard"),     enabled: aba === "dashboard" });
  const { data: gastos }        = useQuery({ queryKey: ["eco-gastos"],      queryFn: () => apiGet("/api/economia-saude-apui/gastos"),         enabled: aba === "gastos" });
  const { data: judicializacao }= useQuery({ queryKey: ["eco-judicial"],    queryFn: () => apiGet("/api/economia-saude-apui/judicializacao"), enabled: aba === "judicializacao" });
  const { data: historico }     = useQuery({ queryKey: ["eco-hist"],        queryFn: () => apiGet("/api/economia-saude-apui/historico"),      enabled: aba === "historico" });
  const { data: indicadores }   = useQuery({ queryKey: ["eco-ind"],         queryFn: () => apiGet("/api/economia-saude-apui/indicadores"),    enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",      label: "Dashboard",      icon: <TrendingDown size={15}/> },
    { key: "gastos",         label: "Gastos",         icon: <Activity size={15}/> },
    { key: "judicializacao", label: "Judicialização", icon: <AlertTriangle size={15}/> },
    { key: "historico",      label: "Histórico",      icon: <TrendingUp size={15}/> },
    { key: "indicadores",    label: "Indicadores",    icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <TrendingDown size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Economia da Saúde — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Gastos · Judicialização · Prevenção · Custo-efetividade · FMS Apuí/AM</p>
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
              <KPI label="Orçamento saúde 2025"     value={`R$ ${(dashRaw.orcamento_saude_total_2025/1000000).toFixed(1)}M`} color={BRAND} sub={`R$ ${dashRaw.gasto_per_capita_saude}/hab (BR: R$ ${dashRaw.gasto_per_capita_media_br})`} />
              <KPI label="TFD (% orçamento)"        value={`${dashRaw.custo_tfd_pct_orcamento}%`}                             color={CRIT}  sub={`R$ ${(dashRaw.custo_tfd_pct_orcamento*dashRaw.orcamento_saude_total_2025/100/1000000).toFixed(2)}M/ano`} />
              <KPI label="Judicialização (% orçam)" value={`${dashRaw.custo_judicial_anual && (dashRaw.custo_judicial_anual/dashRaw.orcamento_saude_total_2025*100).toFixed(1)}%`} color={CRIT} sub={`R$ ${(dashRaw.custo_judicial_anual/1000000).toFixed(2)}M/ano`} />
              <KPI label="Ações judiciais ativas"   value={dashRaw.judicializacoes_ativas}                                    color={CRIT}  sub={`R$ ${(dashRaw.custo_judicial_mensal/1000).toFixed(0)}k/mês`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Gasto em prevenção"       value={`${dashRaw.custo_prevencao_pct}%`}                                 color={CRIT}  sub={`meta: ${dashRaw.custo_prevencao_meta_pct}%`} />
              <KPI label="Internações evitáveis"    value={`${dashRaw.internacoes_causas_preveniveis_pct}%`}                  color={CRIT}  sub={`R$ ${(dashRaw.custo_hospitalizacoes_preveniveis_ano/1000).toFixed(0)}k/ano desperdiçados`} />
              <KPI label="ROI prevenção"            value={`R$ ${dashRaw.retorno_investimento_prevencao}/R$1`}                color={OK}    sub="retorno por real investido" />
              <KPI label="Receita própria saúde"    value={`${dashRaw.receita_propria_saude_pct}%`}                           color={CRIT}  sub={`dependência FNS: ${dashRaw.fundo_fns_repasse_pct}%`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Alocação do Orçamento de Saúde</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Pessoal (48,0%)`,              value: 48.0, max: 100, color: ACCENT },
                    { label: `TFD (${dashRaw.custo_tfd_pct_orcamento}%)`, value: dashRaw.custo_tfd_pct_orcamento, max: 100, color: CRIT },
                    { label: `Judicialização (34,1%)`,       value: 34.1, max: 100, color: CRIT },
                    { label: `Medicamentos (12,0%)`,         value: 12.0, max: 100, color: WARN },
                    { label: `Atenção Básica (9,8%)`,        value: 9.8,  max: 100, color: CRIT },
                    { label: `Prevenção (${dashRaw.custo_prevencao_pct}%)`, value: dashRaw.custo_prevencao_pct, max: 100, color: CRIT },
                  ].map((b: any) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                      </div>
                      <ProgressBar value={b.value} max={100} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>Judicialização superou TFD em 2025</b> — R$ 3,4M em ações judiciais vs R$ 2,84M em TFD. Total: R$ 6,25M = 62,5% do orçamento em acesso a serviços que deveriam estar disponíveis.</p>
                <p><b>Internações evitáveis: R$ 1,24M/ano</b> — 42,4% das internações por causas evitáveis na AB. 1 internação = 59 consultas de AB. Cada R$ 1M em prevenção retorna R$ 4,2M em 5 anos.</p>
                <p><b>Gasto per capita: R$ 405/hab = 59% da média nacional</b> — subfinanciamento crônico + custo de acesso em região amazônica = círculo vicioso. PEC do Piso da AB universal: R$ 684/hab mínimo.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "gastos" && Array.isArray(gastos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Gastos por Categoria (R$/ano)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={(gastos as any[])} layout="vertical" margin={{ left: 160, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v/1000000).toFixed(1)}M`} />
                  <YAxis dataKey="categoria" type="category" tick={{ fontSize: 10 }} width={160} />
                  <Tooltip formatter={(v: any) => `R$ ${Number(v).toLocaleString()}`} />
                  <Bar dataKey="valor_ano" name="Valor (R$/ano)" radius={[0,3,3,0]}>
                    {(gastos as any[]).map((g: any, i: number) => (
                      <Cell key={i} fill={statusColor(g.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(gastos as any[]).map((g: any) => (
                <div key={g.categoria} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(g.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{g.categoria}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold text-slate-700">R$ {(g.valor_ano/1000000).toFixed(2)}M</span>
                      <span className="text-slate-400 ml-1">({g.pct_orcamento}%)</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{g.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "judicializacao" && Array.isArray(judicializacao) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Ações Judiciais — Volume e Custo Mensal</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={(judicializacao as any[])} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis dataKey="objeto" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" />
                  <YAxis yAxisId="left"  tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left"  dataKey="acoes"         name="Ações ativas" fill={ACCENT} radius={[4,4,0,0]}>
                    {(judicializacao as any[]).map((j: any, i: number) => (
                      <Cell key={i} fill={statusColor(j.status)} />
                    ))}
                  </Bar>
                  <Bar yAxisId="right" dataKey="custo_mensal"  name="Custo/mês (R$)" fill={WARN} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(judicializacao as any[]).map((j: any) => (
                <div key={j.objeto} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(j.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{j.objeto}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <span className="font-bold" style={{ color: CRIT }}>{j.acoes} ações</span>
                      {" · "}
                      <span style={{ color: statusColor(j.status) }}>R$ {(j.custo_mensal/1000).toFixed(0)}k/mês</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{j.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Econômica da Saúde — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v/1000000).toFixed(1)}M`} />
                <Tooltip formatter={(v: any) => `R$ ${Number(v).toLocaleString()}`} />
                <Legend />
                <Line dataKey="orcamento_total"  name="Orçamento total"      stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="tfd_custo"         name="TFD"                  stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="judicial_custo"    name="Judicialização"       stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
                <Line dataKey="prev_custo"        name="Prevenção"            stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
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
