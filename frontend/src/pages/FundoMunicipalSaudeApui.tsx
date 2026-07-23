import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { FolderOpen, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

function fmtR(v: number) {
  if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`;
  return `R$ ${v}`;
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

export default function FundoMunicipalSaudeApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }          = useQuery({ queryKey: ["fms-dashboard"], queryFn: () => apiGet("/api/fundo-municipal-saude-apui/dashboard"),      enabled: aba === "dashboard" });
  const { data: receitas }      = useQuery({ queryKey: ["fms-receitas"],  queryFn: () => apiGet("/api/fundo-municipal-saude-apui/receitas"),        enabled: aba === "receitas" });
  const { data: despesas }      = useQuery({ queryKey: ["fms-despesas"],  queryFn: () => apiGet("/api/fundo-municipal-saude-apui/despesas-mensais"),enabled: aba === "despesas" });
  const { data: historico }     = useQuery({ queryKey: ["fms-hist"],      queryFn: () => apiGet("/api/fundo-municipal-saude-apui/historico"),       enabled: aba === "historico" });
  const { data: indicadores }   = useQuery({ queryKey: ["fms-ind"],       queryFn: () => apiGet("/api/fundo-municipal-saude-apui/indicadores"),     enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",    icon: <FolderOpen size={15}/> },
    { key: "receitas",   label: "Receitas",     icon: <Activity size={15}/> },
    { key: "despesas",   label: "Despesas",     icon: <Activity size={15}/> },
    { key: "historico",  label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <FolderOpen size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Fundo Municipal de Saúde — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Execução Orçamentária · Emendas · ASPS · Blocos · FMS Apuí/AM</p>
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
              <KPI label="Receita prevista"         value={fmtR(dashRaw.receita_total_prevista_R)}   color={BRAND} sub={`exercício ${dashRaw.ano_referencia}`} />
              <KPI label="Receita executada"        value={fmtR(dashRaw.receita_total_executada_R)}  color={WARN}  sub={`${dashRaw.execucao_pct}% executado`} />
              <KPI label="Gasto per capita"         value={`R$ ${dashRaw.gasto_per_capita_R}/hab`}   color={WARN}  sub={`média BR: R$ ${dashRaw.media_brasil_per_capita_R}`} />
              <KPI label="ASPS (%)"                 value={`${dashRaw.asps_percentual_pct}%`}        color={OK}    sub={`mín. const.: ${dashRaw.meta_asps_pct}%`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Emendas parlamentares"   value={fmtR(dashRaw.emendas_parlamentares_R)}     color={WARN}  sub={`${dashRaw.emendas_executadas_pct}% executado`} />
              <KPI label="Bloco custeio"           value={fmtR(dashRaw.blocos_custeio_R)}             color={BRAND} sub="despesa corrente" />
              <KPI label="Bloco investimento"      value={fmtR(dashRaw.blocos_investimento_R)}        color={CRIT}  sub={`${dashRaw.blocos_investimento_executado_pct}% executado`} />
              <KPI label="Transfências federais"   value={fmtR(dashRaw.transferencias_federais_R)}    color={BRAND} sub="fundo a fundo" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Subfunções — Distribuição</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Atenção Básica",           value: dashRaw.subfuncao_atencao_basica_R,       total: dashRaw.receita_total_executada_R, display: fmtR(dashRaw.subfuncao_atencao_basica_R) },
                    { label: "Hospitalar/Ambulatorial",  value: dashRaw.subfuncao_hospitalar_ambulatorial_R, total: dashRaw.receita_total_executada_R, display: fmtR(dashRaw.subfuncao_hospitalar_ambulatorial_R) },
                    { label: "Vigilância em Saúde",      value: dashRaw.subfuncao_vigilancia_R,           total: dashRaw.receita_total_executada_R, display: fmtR(dashRaw.subfuncao_vigilancia_R) },
                  ].map((b: any) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-bold" style={{ color: BRAND }}>{b.display} ({Math.round(b.value / b.total * 100)}%)</span>
                      </div>
                      <ProgressBar value={b.value / b.total * 100} max={100} color={BRAND} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex flex-col gap-2 justify-center">
                <p><b>64,1% de execução orçamentária</b> — R$ 10,2M não gastos retornam à União. Principal causa: impossibilidade de contratar médicos especialistas (nenhum aceitou o salário municipal) e licitações desertas para equipamentos com frete amazônico.</p>
                <p><b>Bloco de investimento: 42,4% executado</b> — 2 UBS rurais com projeto de reforma há 2 anos sem obra iniciada. Equipamentos parados: 4 pregões não homologados por ausência de propostas dentro das especificações.</p>
                <p><b>Emendas: 48,4% executadas</b> — risco de bloqueio de novas emendas. Solução: pregão com critérios adaptados à logística amazônica e ampliação do prazo de entrega para fornecedores credenciados no interior do Amazonas.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "receitas" && Array.isArray(receitas) && (
          <div className="space-y-3">
            {(receitas as any[]).map((r: any) => (
              <div key={r.fonte} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(r.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{r.fonte}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: BRAND }}>{fmtR(r.valor_R)}</span>
                    <p className="text-xs" style={{ color: statusColor(r.status) }}>{r.executado_pct}% executado</p>
                  </div>
                </div>
                <div className="ml-5 mb-2">
                  <ProgressBar value={r.executado_pct} max={100} color={statusColor(r.status)} />
                </div>
                <p className="text-xs text-slate-500 ml-5">{r.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "despesas" && Array.isArray(despesas) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Despesas Mensais — 2025 (R$)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={despesas as any[]} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => fmtR(v)} />
                <Legend />
                <Bar dataKey="custeio"     name="Custeio"    fill={BRAND}  radius={[3,3,0,0]} stackId="a" />
                <Bar dataKey="investimento" name="Investimento" fill={ACCENT} radius={[0,0,0,0]} stackId="a" />
                <Bar dataKey="pessoal"     name="Pessoal"    fill={WARN}   radius={[0,0,3,3]} stackId="a" />
                <Line dataKey="total"      name="Total"      stroke={CRIT} strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Orçamentária — FMS (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line dataKey="execucao_pct"       name="Execução (%)"           stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="asps_pct"           name="ASPS (%)"               stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="emendas_exec_pct"   name="Emendas exec. (%)"      stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
