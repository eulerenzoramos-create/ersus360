import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Smile, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function SaudeLgbtqiaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["lgbt-dashboard"], queryFn: () => apiGet("/api/saude-lgbtqia-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: agravos }     = useQuery({ queryKey: ["lgbt-agravos"],   queryFn: () => apiGet("/api/saude-lgbtqia-apui/agravos"),     enabled: aba === "agravos" });
  const { data: barreiras }   = useQuery({ queryKey: ["lgbt-barreiras"], queryFn: () => apiGet("/api/saude-lgbtqia-apui/barreiras"),   enabled: aba === "barreiras" });
  const { data: historico }   = useQuery({ queryKey: ["lgbt-hist"],      queryFn: () => apiGet("/api/saude-lgbtqia-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["lgbt-ind"],       queryFn: () => apiGet("/api/saude-lgbtqia-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",   icon: <Smile size={15}/> },
    { key: "agravos",     label: "Agravos",     icon: <Activity size={15}/> },
    { key: "barreiras",   label: "Barreiras",   icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",   icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Smile size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde LGBTQIA+ — Apuí/AM</h1>
            <p className="text-sm text-slate-500">IST · Saúde Trans · Saúde Mental · PrEP · Violência · FMS Apuí/AM</p>
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
              <KPI label="Pop. LGBTQIA+ estimada"   value={dashRaw.populacao_lgbtqia_estimada?.toLocaleString()} color={ACCENT} sub={`${dashRaw.populacao_lgbtqia_pct}% da população`} />
              <KPI label="Acesso ao serviço saúde"  value={`${dashRaw.acesso_saude_lgbtqia_pct}%`}              color={CRIT}   sub={`${dashRaw.discriminacao_relato_pct}% relatam discriminação`} />
              <KPI label="Tentativas suicídio 2025" value={dashRaw.saude_mental_lgbtqia_tentativas_suicidio_2025} color={CRIT} sub="18% do total (10% da pop)" />
              <KPI label="Violência notificada"     value={dashRaw.violencia_lgbtqia_notificada_2025}            color={CRIT}   sub={`${dashRaw.violencia_lgbtqia_subnotificacao_estimada_pct}% subnotificação`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="PrEP usuarios ativos"     value={`${dashRaw.prep_usuarios_ativos}/${dashRaw.prep_estimativa_elegivel}`} color={CRIT} sub="16,7% dos elegíveis" />
              <KPI label="Trans hormonioterapia SUS" value={`${dashRaw.trans_hormonioterapia_via_sus_pct}%`}    color={CRIT}   sub={`${dashRaw.trans_identificadas} trans identificadas`} />
              <KPI label="Profissional capacitado"  value={`${dashRaw.profissional_treinado_humanizacao_pct}%`} color={CRIT}   sub="meta: 80%" />
              <KPI label="Política municipal LGBT"  value={dashRaw.politica_municipal_lgbt ? "Sim" : "Não"}    color={CRIT}   sub="Portaria MS 2.836/2011" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Acesso e Proteção — Indicadores</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Acesso ao serviço de saúde (${dashRaw.acesso_saude_lgbtqia_pct}% / meta 80%)`, value: dashRaw.acesso_saude_lgbtqia_pct, max: 100, color: CRIT },
                    { label: `Testagem IST anual (${dashRaw.testagem_ist_lgbtqia_anual_pct}% / meta 80%)`,    value: dashRaw.testagem_ist_lgbtqia_anual_pct, max: 100, color: CRIT },
                    { label: `PrEP cobertura (16,7% / meta 80%)`,                                             value: 16.7, max: 100, color: CRIT },
                    { label: `Trans com hormonioterapia SUS (${dashRaw.trans_hormonioterapia_via_sus_pct}%)`, value: dashRaw.trans_hormonioterapia_via_sus_pct, max: 100, color: CRIT },
                    { label: `Profissionais capacitados (${dashRaw.profissional_treinado_humanizacao_pct}% / meta 80%)`, value: dashRaw.profissional_treinado_humanizacao_pct, max: 100, color: CRIT },
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
                <p><b>62,4% relatam discriminação no serviço de saúde</b> — abandono do serviço = diagnóstico tardio de IST, câncer, saúde mental. Nome social: não respeitado em 48,4% dos atendimentos. Custo de implementação: zero.</p>
                <p><b>8 tentativas de suicídio LGBTQIA+ em 2025</b> — 3,5x maior risco que a população geral. CAPS sem grupo de suporte. Zero psicólogo capacitado em saúde LGBTQIA+. Intervenção: grupo de apoio + parceria escola-CAPS.</p>
                <p><b>57,6% das pessoas trans usam hormônios sem prescrição</b> — risco de tromboembolismo, hepatotoxicidade. Hormonioterapia pode ser prescrita por médico clínico: protocolo disponível no MS, treinamento de 4h. Estrogênio e espironolactona: disponíveis no REMUME.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "agravos" && Array.isArray(agravos) && (
          <div className="grid gap-3">
            {(agravos as any[]).map((a: any) => (
              <div key={a.agravo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(a.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{a.agravo}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <span className="font-bold text-slate-700">{a.estimativa_casos} estimados</span>
                    {" · "}
                    <span style={{ color: statusColor(a.status) }}>{a.diagnosticados_pct}% diag · {a.em_tratamento_pct}% tratamento</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "barreiras" && Array.isArray(barreiras) && (
          <div className="grid gap-3">
            {(barreiras as any[]).map((b: any) => (
              <div key={b.barreira} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: b.impacto === "alto" ? CRIT : WARN }} />
                    <p className="font-semibold text-sm text-slate-700">{b.barreira}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${b.impacto === "alto" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      impacto {b.impacto}
                    </span>
                    {b.custo_solucao > 0 && <p className="text-xs text-slate-400 mt-0.5">custo: R$ {b.custo_solucao.toLocaleString()} · {b.prazo_meses}m</p>}
                    {b.custo_solucao === 0 && <p className="text-xs text-green-600 mt-0.5">custo R$ 0 · {b.prazo_meses}m</p>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{b.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Saúde LGBTQIA+ — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="acesso_saude_pct"       name="Acesso saúde (%)"         stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="testagem_ist_pct"       name="Testagem IST (%)"         stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="prep_usuarios"          name="Usuários PrEP"            stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="tentativas_suicidio"    name="Tent. suicídio"           stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
