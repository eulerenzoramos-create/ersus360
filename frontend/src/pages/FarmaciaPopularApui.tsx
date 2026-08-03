import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { ShoppingBag, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import { BRL, BRL_AXIS, PCT } from "../lib/fmt";

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

export default function FarmaciaPopularApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["farm-dashboard"],  queryFn: () => apiGet("/api/farmacia-popular-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: medicamentos } = useQuery({ queryKey: ["farm-meds"],      queryFn: () => apiGet("/api/farmacia-popular-apui/medicamentos"), enabled: aba === "medicamentos" });
  const { data: gestao }      = useQuery({ queryKey: ["farm-gestao"],     queryFn: () => apiGet("/api/farmacia-popular-apui/gestao"),       enabled: aba === "gestao" });
  const { data: historico }   = useQuery({ queryKey: ["farm-hist"],       queryFn: () => apiGet("/api/farmacia-popular-apui/historico"),    enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["farm-ind"],        queryFn: () => apiGet("/api/farmacia-popular-apui/indicadores"),  enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",     icon: <ShoppingBag size={15}/> },
    { key: "medicamentos", label: "Medicamentos",  icon: <Activity size={15}/> },
    { key: "gestao",       label: "Gestão",        icon: <AlertTriangle size={15}/> },
    { key: "historico",    label: "Histórico",     icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores",   icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <ShoppingBag size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Farmácia e Acesso a Medicamentos — Apuí/AM</h1>
            <p className="text-sm text-slate-500">REMUME · Adesão · Desabastecimento · Gestão · Automedicação · FMS Apuí/AM</p>
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
              <KPI label="Desabastecimento REMUME"  value={`${dashRaw.desabastecimento_itens_pct}%`}          color={CRIT} sub={`${dashRaw.medicamentos_remume_itens} itens no REMUME`} />
              <KPI label="Adesão terapêutica crônicos" value={`${dashRaw.adesao_terapeutica_doencas_cronicas_pct}%`} color={CRIT} sub={`meta ${dashRaw.meta_adesao_terapeutica_pct}%`} />
              <KPI label="Perda por vencimento/a"   value={BRL(dashRaw.medicamentos_vencidos_perda_anual)} color={CRIT} sub="8,4% do orçamento de medicamentos" />
              <KPI label="Automedicação ATB"         value={`${dashRaw.antimicrobianos_automedicacao_pct}%`}   color={CRIT} sub="resistência bacteriana crescente" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Prescrição de genéricos"  value={`${dashRaw.prescricao_genericos_pct}%`}            color={WARN} sub={`meta ${dashRaw.meta_prescricao_genericos_pct}%`} />
              <KPI label="Compra emergencial"        value={`${dashRaw.compra_emergencial_pct}%`}              color={CRIT} sub={`custo ${dashRaw.custo_extra_compra_emergencial_pct}% maior`} />
              <KPI label="Farmacêutico clínico"      value={dashRaw.farmaceutico_clinico_municipio === 0 ? "Nenhum" : dashRaw.farmaceutico_clinico_municipio} color={CRIT} sub={`${dashRaw.farmaceutico_dispensacao} de dispensação`} />
              <KPI label="Comp. especial atendido"  value={`${dashRaw.medicamentos_componente_especial_atendido_pct}%`} color={WARN} sub="via SAE Humaitá (284 km)" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Acesso e Adesão — Indicadores</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Componente básico atendido (${dashRaw.medicamentos_componente_basico_atendido_pct}%)`,  value: dashRaw.medicamentos_componente_basico_atendido_pct, max: 100, color: WARN },
                    { label: `Adesão crônicas (${dashRaw.adesao_terapeutica_doencas_cronicas_pct}% / meta 80%)`,      value: dashRaw.adesao_terapeutica_doencas_cronicas_pct, max: 100, color: CRIT },
                    { label: `Prescrição de genéricos (${dashRaw.prescricao_genericos_pct}% / meta 90%)`,              value: dashRaw.prescricao_genericos_pct, max: 100, color: WARN },
                    { label: `Desabastecimento (${dashRaw.desabastecimento_itens_pct}% — meta < 5%)`,                 value: 100 - dashRaw.desabastecimento_itens_pct, max: 100, color: CRIT },
                    { label: `Compra emergencial (${dashRaw.compra_emergencial_pct}% — meta < 5%)`,                   value: 100 - dashRaw.compra_emergencial_pct, max: 100, color: CRIT },
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
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex flex-col gap-2 justify-center">
                <p><b>Desabastecimento em 28,4% dos itens</b> — zero sistema de alerta de estoque mínimo. HÓRUS (sistema MS): gratuito, implantação em 1 mês. Compra emergencial: 28% mais caro que pregão regular.</p>
                <p><b>Adesão terapêutica de 48,4% em doenças crônicas</b> — metade dos hipertensos e diabéticos sem controle adequado. PA descontrolada = 4× mais AVC. Estratégia de adesão via ACS: custo zero, +22% de adesão.</p>
                <p><b>R$ 101k/ano em medicamentos vencidos</b> — FEFO não praticado em 62,4% das farmácias. 42,4% usaram antibiótico sem prescrição = resistência bacteriana. MRSA e KPC crescentes no HMM.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "medicamentos" && Array.isArray(medicamentos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Disponibilidade e Adesão por Grupo Terapêutico</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={(medicamentos as any[])} layout="vertical" margin={{ left: 200, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="grupo" type="category" tick={{ fontSize: 10 }} width={200} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="medicamentos_disponives_pct" name="Disponível (%)" fill={ACCENT} radius={[0,3,3,0]} />
                  <Bar dataKey="adesao_pct"                  name="Adesão (%)"     fill={WARN}   radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(medicamentos as any[]).map((m: any) => (
                <div key={m.grupo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(m.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{m.grupo}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <span className="font-bold text-slate-700">{m.pacientes?.toLocaleString()} pacientes</span>
                      {" · "}
                      <span style={{ color: m.medicamentos_disponives_pct < 90 ? CRIT : OK }}>{m.medicamentos_disponives_pct}% disponível</span>
                      {" · "}
                      <span style={{ color: m.adesao_pct < 60 ? CRIT : WARN }}>adesão {m.adesao_pct}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{m.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "gestao" && Array.isArray(gestao) && (
          <div className="grid gap-3">
            {(gestao as any[]).map((g: any) => (
              <div key={g.processo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: g.implementado ? OK : CRIT }} />
                    <p className="font-semibold text-sm text-slate-700">{g.processo}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${g.implementado ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {g.implementado ? "Implementado" : "Não implementado"}
                    </span>
                    {g.custo > 0 && <p className="text-xs text-slate-400 mt-0.5">R$ {g.custo.toLocaleString()} · {g.prazo_meses}m</p>}
                    {g.custo === 0 && <p className="text-xs text-green-600 mt-0.5">custo R$ 0 · {g.prazo_meses}m</p>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{g.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Farmácia — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="adesao_cronicas_pct"    name="Adesão crônicos (%)"  stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="desabastecimento_pct"   name="Desabastecimento (%)" stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="genericos_pct"          name="Genéricos (%)"        stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="compra_emerg_pct"       name="Compra emerg. (%)"    stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
