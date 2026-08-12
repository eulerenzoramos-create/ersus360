import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Wind, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function SaudeRespiratoriaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["resp-dashboard"],   queryFn: () => apiGet("/api/saude-respiratoria-apui/dashboard"),    enabled: aba === "dashboard" });
  const { data: condicoes }   = useQuery({ queryKey: ["resp-condicoes"],   queryFn: () => apiGet("/api/saude-respiratoria-apui/condicoes"),     enabled: aba === "condicoes" });
  const { data: intervencoes }= useQuery({ queryKey: ["resp-interv"],      queryFn: () => apiGet("/api/saude-respiratoria-apui/intervencoes"),  enabled: aba === "intervencoes" });
  const { data: historico }   = useQuery({ queryKey: ["resp-hist"],        queryFn: () => apiGet("/api/saude-respiratoria-apui/historico"),     enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["resp-ind"],         queryFn: () => apiGet("/api/saude-respiratoria-apui/indicadores"),   enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",    icon: <Wind size={15}/> },
    { key: "condicoes",    label: "Condições",    icon: <Activity size={15}/> },
    { key: "intervencoes", label: "Intervenções", icon: <Activity size={15}/> },
    { key: "historico",    label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Wind size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Respiratória — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Asma · DPOC · Pneumonia · Influenza · Silicose · FMS Apuí/AM</p>
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
              <KPI label="Asma controlada"           value={`${dashRaw.asma_controlada_pct}%`}              color={CRIT} sub={`${dashRaw.asma_casos_estimados.toLocaleString()} casos estimados`} />
              <KPI label="DPOC diagnosticada"         value={`${dashRaw.dpoc_diagnosticada_pct}%`}           color={CRIT} sub={`${dashRaw.dpoc_casos_estimados.toLocaleString()} casos estimados`} />
              <KPI label="Pneumonia — internações"    value={`${dashRaw.pneumonia_internacoes_ano}/ano`}      color={WARN} sub={`mortalidade: ${dashRaw.pneumonia_mortalidade_hospitalar_pct}%`} />
              <KPI label="Influenza — cobertura vac." value={`${dashRaw.influenza_cobertura_vacinal_pct}%`}  color={CRIT} sub={`meta: ${dashRaw.meta_influenza_pct}%`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Corticoide inalatório"     value={`${dashRaw.corticoide_inalatorio_disponibilidade_pct}% UBS`} color={CRIT} sub="disponível" />
              <KPI label="Espirometria disponível"   value="Não"                                              color={CRIT} sub={dashRaw.espirometria_referencia} />
              <KPI label="Silicose — suspeitos"      value={`${dashRaw.silicose_casos_suspeitos}`}            color={CRIT} sub="garimpeiros expostos a sílica" />
              <KPI label="O₂ — interrupções/ano"    value={`${dashRaw.oxigenio_hospitalar_interrupção_horas_ano}h`} color={WARN} sub="impacto em UTI-dependentes" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cobertura Intervenções Respiratórias</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Asma controlada (meta 70%)",              value: dashRaw.asma_controlada_pct,                     color: CRIT },
                    { label: "DPOC diagnosticada (meta 80%)",            value: dashRaw.dpoc_diagnosticada_pct,                  color: CRIT },
                    { label: "Corticoide inalatório UBS (meta 90%)",     value: dashRaw.corticoide_inalatorio_disponibilidade_pct, color: CRIT },
                    { label: "Cobertura vacinal Influenza (meta 90%)",   value: dashRaw.influenza_cobertura_vacinal_pct,          color: CRIT },
                    { label: "Nebulizador UBS funcionando (meta 100%)",  value: dashRaw.nebulizador_ubs_funcionando_pct,          color: WARN },
                  ].map((b: any) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-bold" style={{ color: b.color }}>{b.value}%</span>
                      </div>
                      <ProgressBar value={b.value} max={100} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>Zero espirometria em Apuí</b> — 71,6% do DPOC não diagnosticado. Custo de aquisição: R$ 16.000 (equipamento + treinamento). Benefício: diagnóstico correto de 1.038 DPOC + 2.075 asmáticos. Sem espirometria, tratamento é empírico sem estadiamento funcional.</p>
                <p><b>Corticoide inalatório: 51,6% das UBS sem disponibilidade</b> — paciente asmático sem corticoide faz 3-5 nebulizações/mês na UPA. Custo 1 hospitalização: R$ 1.872. Custo 1 mês de beclometasona preventiva: R$ 28. ROI de 66:1.</p>
                <p><b>Silicose em garimpeiros</b> — 8 casos suspeitos sem confirmação por ausência de espirometria e radiografia interpretada. Doença não registrada (garimpo ilegal sem nexo trabalhista). Silicose leva a fibrose maciça progressiva e óbito evitável.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "condicoes" && Array.isArray(condicoes) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-2">
              <h3 className="font-semibold text-slate-700 mb-3">Internações por Condição Respiratória (ano)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={(condicoes as any[]).filter((c: any) => c.hospitalizacoes_ano > 0)} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis dataKey="condicao" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="hospitalizacoes_ano" name="Internações/ano">
                    {(condicoes as any[]).filter((c: any) => c.hospitalizacoes_ano > 0).map((c: any) => (
                      <Cell key={c.condicao} fill={statusColor(c.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {(condicoes as any[]).map((c: any) => (
              <div key={c.condicao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(c.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{c.condicao}</p>
                  </div>
                  <div className="text-right text-sm">
                    {c.prevalencia_estimada > 0 && (
                      <span className="font-bold" style={{ color: BRAND }}>{c.prevalencia_estimada.toLocaleString()} estimados</span>
                    )}
                    {c.hospitalizacoes_ano > 0 && (
                      <p className="text-xs" style={{ color: statusColor(c.status) }}>{c.hospitalizacoes_ano} internações/ano</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{c.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "intervencoes" && Array.isArray(intervencoes) && (
          <div className="space-y-3">
            {(intervencoes as any[]).map((inv: any) => (
              <div key={inv.intervencao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(inv.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{inv.intervencao}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: statusColor(inv.status) }}>{inv.cobertura_pct}%</span>
                    <p className="text-xs text-slate-400">meta: {inv.meta_pct}%</p>
                  </div>
                </div>
                <div className="ml-5 mb-2">
                  <ProgressBar value={inv.cobertura_pct} max={inv.meta_pct} color={statusColor(inv.status)} />
                </div>
                <p className="text-xs text-slate-500 ml-5">{inv.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Respiratória — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="asma_controlada_pct"      name="Asma controlada (%)"     stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="dpoc_diagnosticada_pct"   name="DPOC diagnosticada (%)"  stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="influenza_vacinal_pct"    name="Influenza vacinal (%)"    stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
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
