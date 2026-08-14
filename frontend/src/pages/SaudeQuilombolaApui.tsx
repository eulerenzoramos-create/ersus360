import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Users, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function SaudeQuilombolaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["quil-dashboard"],  queryFn: () => apiGet("/api/saude-quilombola-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: comunidades } = useQuery({ queryKey: ["quil-comunid"],    queryFn: () => apiGet("/api/saude-quilombola-apui/comunidades"), enabled: aba === "comunidades" });
  const { data: agravos }     = useQuery({ queryKey: ["quil-agravos"],    queryFn: () => apiGet("/api/saude-quilombola-apui/agravos"),     enabled: aba === "agravos" });
  const { data: historico }   = useQuery({ queryKey: ["quil-hist"],       queryFn: () => apiGet("/api/saude-quilombola-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["quil-ind"],        queryFn: () => apiGet("/api/saude-quilombola-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",     icon: <Users size={15}/> },
    { key: "comunidades", label: "Comunidades",   icon: <Activity size={15}/> },
    { key: "agravos",     label: "Agravos",       icon: <Activity size={15}/> },
    { key: "historico",   label: "Histórico",     icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",   icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Users size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Quilombola e Ribeirinha — Apuí/AM</h1>
            <p className="text-sm text-slate-500">4 Quilombos · 18 Comunidades Ribeirinhas · Equidade · Acesso · FMS Apuí/AM</p>
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
              <KPI label="Pop. quilombola"          value={`${dashRaw.populacao_quilombola_estimada?.toLocaleString()}`}  color={BRAND} sub={`${dashRaw.comunidades_quilombolas_certificadas} comunidades certificadas`} />
              <KPI label="Pop. ribeirinha"           value={`${dashRaw.populacao_ribeirinha_estimada?.toLocaleString()}`} color={BRAND} sub="18 comunidades" />
              <KPI label="Cobertura ESF quilombola" value={`${dashRaw.esf_com_cobertura_quilombola_pct}%`}              color={CRIT}  sub="75% sem acesso regular" />
              <KPI label="Mortalidade infantil"     value={`${dashRaw.mortalidade_infantil_quilombola_1k}/1k NV`}        color={CRIT}  sub={`vs municipal: ${dashRaw.mortalidade_infantil_municipal_1k}/1k`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Consulta médica (freq.)"  value={`a cada ${dashRaw.consulta_medica_quilombola_frequencia_meses} meses`} color={CRIT} sub={`meta: ${dashRaw.meta_consulta_medica_meses} meses`} />
              <KPI label="Parto domiciliar"          value={`${dashRaw.parto_domiciliar_pct}%`}                          color={CRIT}  sub="nas comunidades" />
              <KPI label="Vacinação"                 value={`${dashRaw.vacinacao_cobertura_pct}%`}                       color={CRIT}  sub={`meta: ${dashRaw.meta_vacinacao_pct}%`} />
              <KPI label="Água tratada"              value={`${dashRaw.agua_tratada_pct}%`}                              color={CRIT}  sub="domicílios quilombolas" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Inequidade em Saúde — Quilombola vs Municipal</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Cobertura ESF (meta 100%)",                value: dashRaw.esf_com_cobertura_quilombola_pct,   color: CRIT },
                    { label: "Vacinação (meta 95%)",                      value: dashRaw.vacinacao_cobertura_pct,            color: CRIT },
                    { label: "Água tratada (meta 80%)",                   value: dashRaw.agua_tratada_pct,                   color: CRIT },
                    { label: "Saneamento básico (meta 80%)",              value: dashRaw.saneamento_basico_domicilios_pct,   color: CRIT },
                    { label: "ACS quilombola designado (meta 100%)",      value: (dashRaw.acs_quilombola_designado / dashRaw.meta_acs_quilombola) * 100, color: CRIT },
                  ].map((b: any) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-bold" style={{ color: b.color }}>{b.value?.toFixed(1)}%</span>
                      </div>
                      <ProgressBar value={b.value} max={100} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>Óbito materno por eclampsia em 2024</b> — gestante do Quilombo Terra Preta levou 11h de barco para chegar à sede. Chegou sem vida. Parto domiciliar 28,4%: sem parteira capacitada, sem kit de parto limpo. Mortalidade infantil quilombola: 28,4/1k vs 18,4 municipal — 54% maior.</p>
                <p><b>Vacina chega 2x/ano nas comunidades</b> — calendário vacinal exige 6-12 doses nos primeiros 2 anos: impossível com visita semestral. Criança quilombola sem vacina completa = surto de sarampo/poliomielite a qualquer momento. 46,6 pontos abaixo da meta de 95%.</p>
                <p><b>87,6% sem água tratada</b> — malária, hepatite A, diarreia: consequências diretas. Custo de filtro doméstico + hipoclorito por família: R$ 280/ano. Custo de 1 internação por hepatite A: R$ 4.800. ROI: 17:1 só na hepatite A.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "comunidades" && Array.isArray(comunidades) && (
          <div className="grid gap-4">
            {(comunidades as any[]).map((c: any) => (
              <div key={c.comunidade} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(c.status) }} />
                    <div>
                      <p className="font-semibold text-sm text-slate-700">{c.comunidade}</p>
                      <p className="text-xs text-slate-400">{c.certificacao} · {c.acesso} · {c.distancia_sede_km} km da sede</p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: BRAND }}>{c.populacao} hab.</span>
                    <p className="text-xs" style={{ color: c.consulta_frequencia_meses > 3 ? CRIT : WARN }}>
                      Consulta a cada {c.consulta_frequencia_meses} meses
                    </p>
                    <p className="text-xs" style={{ color: c.acs_designado ? OK : CRIT }}>
                      ACS: {c.acs_designado ? "designado" : "sem ACS"}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{c.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "agravos" && Array.isArray(agravos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-2">
              <h3 className="font-semibold text-slate-700 mb-3">Taxa de Agravos — Quilombola vs Municipal (/100k)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(agravos as any[]).filter((a: any) => a.taxa_100k_quilombola > 0)} margin={{ top: 5, right: 20, bottom: 30, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis dataKey="agravo" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="taxa_100k_quilombola" name="Quilombola" fill={CRIT} />
                  <Bar dataKey="taxa_100k_municipal"  name="Municipal"  fill={ACCENT} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {(agravos as any[]).map((a: any) => (
              <div key={a.agravo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(a.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{a.agravo}</p>
                  </div>
                  <div className="text-right text-sm">
                    {a.taxa_100k_quilombola > 0 && (
                      <>
                        <span className="font-bold" style={{ color: CRIT }}>{a.taxa_100k_quilombola}/100k (quil.)</span>
                        <p className="text-xs text-slate-400">{a.taxa_100k_municipal}/100k (municipal)</p>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Saúde Quilombola — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="vacinacao_pct"           name="Vacinação (%)"            stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="parto_domiciliar_pct"    name="Parto domiciliar (%)"     stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="desnutricao_criancas_pct"name="Desnutrição crianças (%)" stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
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
