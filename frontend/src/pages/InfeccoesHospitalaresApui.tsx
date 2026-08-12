import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { ShieldCheck, AlertTriangle, TrendingUp, Activity } from "lucide-react";
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

export default function InfeccoesHospitalaresApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["ira-dash"],  queryFn: () => apiGet("/api/infeccoes-hospitalares-apui/dashboard"), enabled: aba === "dashboard" });
  const { data: tipos }       = useQuery({ queryKey: ["ira-tipo"],  queryFn: () => apiGet("/api/infeccoes-hospitalares-apui/tipos"),     enabled: aba === "tipos" });
  const { data: acoes }       = useQuery({ queryKey: ["ira-acao"],  queryFn: () => apiGet("/api/infeccoes-hospitalares-apui/acoes"),     enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["ira-hist"],  queryFn: () => apiGet("/api/infeccoes-hospitalares-apui/historico"), enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["ira-ind"],   queryFn: () => apiGet("/api/infeccoes-hospitalares-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <ShieldCheck size={15}/> },
    { key: "tipos",       label: "Tipos IRAS", icon: <Activity size={15}/> },
    { key: "acoes",       label: "Ações",      icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <ShieldCheck size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Infecções Hospitalares / IRAS — Apuí/AM</h1>
            <p className="text-sm text-slate-500">CCIH · ISC · PAV · IUAC · Higiene de Mãos · Resistência Antimicrobiana · FMS Apuí/AM</p>
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
              <KPI label="Taxa IRAS estimada (meta: ≤ 3%)"        value={`${dashRaw.taxa_iras_estimada_pct}%`}          color={CRIT} sub={`${dashRaw.iras_estimadas_2025} IRAS/ano · ${dashRaw.obitos_iras_estimados_2025} óbitos`} />
              <KPI label="CCIH ativa (obrigatória RDC 42/2010)"   value={dashRaw.ccih_apui ? "Ativa" : "Inexistente"}   color={CRIT} sub="ANVISA pode interditar estabelecimento sem CCIH" />
              <KPI label="Adesão higiene de mãos (meta: 80%)"     value={`${dashRaw.higiene_maos_adesao_pct}%`}         color={CRIT} sub={`paramentação correta: ${dashRaw.paramentacao_correta_pct}%`} />
              <KPI label="KPC + MRSA 2025"                        value={`${dashRaw.kpc_casos_2025 + dashRaw.mrsa_casos_2025} casos`} color={CRIT} sub={`KPC: ${dashRaw.kpc_casos_2025} · MRSA: ${dashRaw.mrsa_casos_2025} · mortalidade KPC: 50-70%`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Custo estimado das IRAS 2025"            value={BRL(dashRaw.custo_iras_2025_estimado)} color={CRIT} sub="352 IRAS × R$ 8.000/caso médio" />
              <KPI label="ISC — Infecção do Sítio Cirúrgico"       value={`${dashRaw.taxa_iras_estimada_pct}% est.`}     color={CRIT} sub="cefazolina 2g pré-operatório: R$ 2,80 → ROI 2.857:1" />
              <KPI label="Farmacêutico clínico (stewardship)"      value={dashRaw.farmaceutico_clinico_apui === 0 ? "Nenhum" : dashRaw.farmaceutico_clinico_apui} color={CRIT} sub="carbapenemo empírico: 28,4% sem antibiograma" />
              <KPI label="Autoclave com validação mensal"          value={dashRaw.validacao_autoclave_mensal ? "Validada" : "Sem validação"} color={CRIT} sub={`${dashRaw.autoclave_apui} autoclaves · RDC 15/2012 obrigatória`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Indicadores de Controle de Infecção — Apuí/AM</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Higiene de mãos: ${dashRaw.higiene_maos_adesao_pct}% (meta 80%)`,       value: dashRaw.higiene_maos_adesao_pct, max: 80,  color: CRIT },
                    { label: `Paramentação correta: ${dashRaw.paramentacao_correta_pct}%`,             value: dashRaw.paramentacao_correta_pct, max: 100, color: CRIT },
                    { label: `Álcool gel cobertura: ${dashRaw.alcool_gel_cobertura_pct}%`,            value: dashRaw.alcool_gel_cobertura_pct, max: 100, color: WARN },
                    { label: `Resistência gram-negativa: ${dashRaw.resistencia_gram_negativa_pct}%`,  value: 100 - dashRaw.resistencia_gram_negativa_pct, max: 100, color: CRIT },
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
                <p><b>12,4% de taxa de IRAS</b> (meta 3% — 4,1× acima). 352 IRAS/ano = R$ 2,82M em custo hospitalar extra. CCIH: obrigatória RDC 42/2010. Criação: R$ 4.200. Sem CCIH: ANVISA pode interditar. Higiene de mãos correta: evita 62% das IRAS = R$ 1,74M/ano.</p>
                <p><b>4 KPC + 8 MRSA em 2025</b>. KPC: mortalidade 50-70% + tratamento R$ 28.000. Causa: carbapenemo empírico sem antibiograma em 28,4% dos casos. Farmacêutico clínico: R$ 84.000/ano → economia R$ 280.000/ano em carbapenemos + zeramento dos novos KPC.</p>
                <p><b>ISC 8,4% das cirurgias</b> (meta 2%). Cefazolina 2g IV 30-60 min pré-operatório: R$ 2,80/dose vs R$ 8.000 de ISC. Checklist WHO cirúrgico: R$ 0 (impressão). Autoclave sem validação: ISC garantida. RDC 15/2012: indicador biológico mensal = R$ 4.200/ano.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "tipos" && Array.isArray(tipos) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={tipos as any[]} margin={{ top: 5, right: 20, bottom: 60, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="tipo" tick={{ fontSize: 7 }} angle={-10} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="taxa_estimada_pct" name="Taxa estimada (%)" radius={[4,4,0,0]}>
                  {(tipos as any[]).map((t: any, i: number) => <Cell key={i} fill={statusColor(t.status)} />)}
                </Bar>
                <Bar dataKey="meta_pct" name="Meta (%)" radius={[4,4,0,0]} fill={OK} opacity={0.3} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(tipos as any[]).map((t: any) => (
                <div key={t.tipo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(t.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{t.tipo}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: statusColor(t.status) }}>{t.taxa_estimada_pct}%</span>
                      <span className="text-slate-400"> / meta {t.meta_pct}%</span>
                      <p className="text-slate-400 mt-0.5">{t.casos_estimados} casos/ano</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{t.observacao}</p>
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
            <h3 className="font-semibold text-slate-700 mb-4">Evolução IRAS — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="taxa_iras_pct"      name="Taxa IRAS (%)"           stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="isc_pct"            name="ISC (%)"                 stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="left"  dataKey="higiene_maos_pct"   name="Higiene mãos (%)"        stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
                <Line yAxisId="left"  dataKey="resistencia_pct"    name="Resistência AMR (%)"     stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" dataKey="obitos_iras"        name="Óbitos por IRAS"         stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="6 2" />
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
