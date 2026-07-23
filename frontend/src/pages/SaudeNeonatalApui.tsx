import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Baby, AlertTriangle, TrendingUp, Activity } from "lucide-react";

const BRAND  = "#1e3a5f";
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

export default function SaudeNeonatalApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["neo-dash"],  queryFn: () => apiGet("/api/saude-neonatal-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: condicoes }   = useQuery({ queryKey: ["neo-cond"],  queryFn: () => apiGet("/api/saude-neonatal-apui/condicoes"),  enabled: aba === "condicoes" });
  const { data: acoes }       = useQuery({ queryKey: ["neo-acao"],  queryFn: () => apiGet("/api/saude-neonatal-apui/acoes"),      enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["neo-hist"],  queryFn: () => apiGet("/api/saude-neonatal-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["neo-ind"],   queryFn: () => apiGet("/api/saude-neonatal-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Baby size={15}/> },
    { key: "condicoes",   label: "Condições",  icon: <Activity size={15}/> },
    { key: "acoes",       label: "Ações",      icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Baby size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Neonatal — Apuí/AM</h1>
            <p className="text-sm text-slate-500">TMN · Prematuridade · Surfactante · Método Canguru · Triagem Neonatal · Reanimação · FMS Apuí/AM</p>
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
              <KPI label="Taxa mortalidade neonatal (meta: ≤ 5/1k NV)" value={`${dashRaw.taxa_mortalidade_neonatal_1000nv}/1k NV`} color={CRIT} sub={`${dashRaw.obitos_neonatais_2025} óbitos — precoce ${dashRaw.obitos_neonatais_precoces_0_6d}, tardio ${dashRaw.obitos_neonatais_tardios_7_27d}`} />
              <KPI label="Taxa mortalidade infantil (meta: ≤ 10/1k NV)" value={`${dashRaw.taxa_mortalidade_infantil_1000nv}/1k NV`} color={CRIT} sub={`${dashRaw.obitos_infantis_total_2025} óbitos infantis 2025`} />
              <KPI label="Prematuridade (meta: < 8%)"                   value={`${dashRaw.prematuridade_pct}%`}                     color={CRIT} sub={`muito baixo peso: ${dashRaw.muito_baixo_peso_pct}% — UTI neonatal: ${dashRaw.uti_neonatal_apui ? "disponível" : "indisponível"}`} />
              <KPI label="Teste do Pezinho (meta: 100%)"                value={`${dashRaw.teste_pezinho_cobertura_pct}%`}            color={WARN} sub={`orelhinha: ${dashRaw.teste_orelhinha_cobertura_pct}% — olhinho: ${dashRaw.teste_olhinho_cobertura_pct}%`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Surfactante disponível em Apuí"               value={dashRaw.surfactante_disponivel_apui ? "Disponível" : "Indisponível"} color={CRIT} sub="MS financia via RENAME: R$ 0 — SDR -60% de mortalidade" />
              <KPI label="Método Canguru implementado"                  value={dashRaw.metodo_canguru_apui ? "Ativo" : "Inexistente"} color={CRIT} sub="sobrevida +40% em muito baixo peso — custo R$ 8.400" />
              <KPI label="Aleitamento exclusivo até 6 meses (meta: 50%)" value={`${dashRaw.aleitamento_exclusivo_6m_pct}%`}          color={CRIT} sub={`banco de leite: ${dashRaw.banco_leite_apui ? "disponível" : "inexistente"}`} />
              <KPI label="GBS intraparto rastreado (meta: 100%)"        value={`${dashRaw.triagem_cardiaca_oximetria_pct}%`}         color={CRIT} sub={`neonatologista: ${dashRaw.neonatologista_apui === 0 ? "zero" : dashRaw.neonatologista_apui} em Apuí`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cobertura da Triagem Neonatal — Apuí/AM</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Teste do Pezinho: ${dashRaw.teste_pezinho_cobertura_pct}% (meta 100%)`,   value: dashRaw.teste_pezinho_cobertura_pct,      max: 100, color: WARN },
                    { label: `Teste da Orelhinha: ${dashRaw.teste_orelhinha_cobertura_pct}% (meta 100%)`,value: dashRaw.teste_orelhinha_cobertura_pct,     max: 100, color: CRIT },
                    { label: `Teste do Olhinho: ${dashRaw.teste_olhinho_cobertura_pct}% (meta 100%)`,   value: dashRaw.teste_olhinho_cobertura_pct,       max: 100, color: CRIT },
                    { label: `Oximetria neonatal: ${dashRaw.triagem_cardiaca_oximetria_pct}%`,           value: dashRaw.triagem_cardiaca_oximetria_pct,    max: 100, color: WARN },
                  ].map((b: any) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                      </div>
                      <ProgressBar value={b.value} max={b.max} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>TMN 17/1.000 NV</b> — 3,4× a meta (5/1.000). 18 óbitos neonatais 2025. Surfactante via RENAME: R$ 0 — SDR mortalidade -60%. Método Canguru: R$ 8.400 — sobrevida +40% em muito baixo peso. UTI neonatal em Apuí: zero (referência HGH-Humaitá 160km).</p>
                <p><b>18,4% de prematuridade</b> (meta 8%). Corticoide antenatal em TPP: 68,4% (meta 100%). Betametasona: R$ 8,40/dose = SDR -50%. Reanimação Neonatal SBP: R$ 4.200 → 42 casos de asfixia/ano — treinamento = -80% de mortalidade por asfixia.</p>
                <p><b>Triagem neonatal incompleta</b>: 27,6% sem Pezinho + 57,6% sem Orelhinha + 61,6% sem Olhinho. PKU não diagnosticada: retardo mental grave (evitável com R$ 0). Kit triagem completa: R$ 14.000/ano. LACEN-AM processa: resultado em 10 dias.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "condicoes" && Array.isArray(condicoes) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={condicoes as any[]} margin={{ top: 5, right: 20, bottom: 60, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="condicao" tick={{ fontSize: 7 }} angle={-10} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="casos_2025" name="Casos 2025" radius={[4,4,0,0]}>
                  {(condicoes as any[]).map((c: any, i: number) => <Cell key={i} fill={statusColor(c.status)} />)}
                </Bar>
                <Bar dataKey="obitos_2025" name="Óbitos 2025" radius={[4,4,0,0]} fill={BRAND} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(condicoes as any[]).map((c: any) => (
                <div key={c.condicao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(c.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{c.condicao}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: statusColor(c.status) }}>{c.casos_2025} casos</span>
                      <span className="text-red-600 font-bold ml-2">{c.obitos_2025} óbitos</span>
                      <p className="text-slate-400 mt-0.5">sobrevida: {c.sobrevida_pct}%</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{c.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "acoes" && Array.isArray(acoes) && (
          <div className="grid gap-3">
            {(acoes as any[]).map((a: any) => (
              <div key={a.acao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: a.implementada ? OK : CRIT }} />
                    <p className="font-semibold text-sm text-slate-700">{a.acao}</p>
                  </div>
                  <div className="text-right text-xs">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${a.implementada ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {a.implementada ? "Implementada" : "Não implementada"}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">R$ {(a.custo||0).toLocaleString()} · {a.prazo_meses}m</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Saúde Neonatal — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="tmn"               name="TMN (/1k NV)"          stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="tmi"               name="TMI (/1k NV)"          stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="left"  dataKey="prematuridade_pct" name="Prematuridade (%)"     stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
                <Line yAxisId="right" dataKey="pezinho_pct"       name="Pezinho (%)"           stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" dataKey="aleitamento_pct"   name="Aleitamento exc. (%)"  stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="6 2" />
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
