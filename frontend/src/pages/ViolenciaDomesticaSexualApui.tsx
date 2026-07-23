import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Shield, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function ViolenciaDomesticaSexualApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["vds-dash"],  queryFn: () => apiGet("/api/violencia-domestica-sexual-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: casos }       = useQuery({ queryKey: ["vds-caso"],  queryFn: () => apiGet("/api/violencia-domestica-sexual-apui/casos"),      enabled: aba === "casos" });
  const { data: protecao }    = useQuery({ queryKey: ["vds-prot"],  queryFn: () => apiGet("/api/violencia-domestica-sexual-apui/protecao"),   enabled: aba === "protecao" });
  const { data: historico }   = useQuery({ queryKey: ["vds-hist"],  queryFn: () => apiGet("/api/violencia-domestica-sexual-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["vds-ind"],   queryFn: () => apiGet("/api/violencia-domestica-sexual-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Shield size={15}/> },
    { key: "casos",       label: "Casos",      icon: <Activity size={15}/> },
    { key: "protecao",    label: "Proteção",   icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Shield size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Violência Doméstica e Sexual — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Femicídio · Lei Maria da Penha · CREAS · Linha 180 · PEP · FMS Apuí/AM</p>
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
              <KPI label="Femicídio 2025 (taxa/100k mulheres)" value={`${dashRaw.femicidio_2025} óbitos`}             color={CRIT} sub={`taxa 35/100k (22× a média nacional 1,6)`} />
              <KPI label="VD notificada 2025 (estimada: 1.420)" value={dashRaw.violencia_domestica_notificada_2025}  color={CRIT} sub={`subnotificação estimada: ${dashRaw.subnotificacao_estimada_pct}%`} />
              <KPI label="B.O. registrado (das vítimas)"       value={`${dashRaw.bo_registrado_pct}%`}               color={CRIT} sub="72% não vão à delegacia" />
              <KPI label="Medidas protetivas cumpridas"        value={`${dashRaw.medida_protetiva_cumprida_pct}%`}   color={CRIT} sub={`${dashRaw.medida_protetiva_concedida_2025} concedidas — 57,6% descumpridas`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Delegacia da Mulher (DEAM)"         value={dashRaw.delegacia_mulher_apui === 0 ? "Inexistente" : "Presente"} color={CRIT} sub="referência: DEAM Humaitá (180 km)" />
              <KPI label="Casa-Abrigo em Apuí"                value={dashRaw.casa_abrigo_apui === 0 ? "Inexistente" : "Presente"}      color={CRIT} sub="mulher ameaçada sem local seguro" />
              <KPI label="Kit pós-violência sexual (UBSs)"    value={dashRaw.kit_violencia_sexual_ubs ? "Disponível" : "Indisponível"}  color={CRIT} sub="PEP + anticoncepção emergência" />
              <KPI label="Crianças expostas à VD (estimadas)" value={(dashRaw.criancas_expostas_violencia_domestica_estimadas||0).toLocaleString()} color={CRIT} sub="TEPT em 42% das expostas" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Estrutura de Proteção à Mulher em Apuí</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `B.O. registrado: ${dashRaw.bo_registrado_pct}% das vítimas (meta 100%)`,              value: dashRaw.bo_registrado_pct,                 max: 100, color: CRIT },
                    { label: `Notificação compulsória SINAN: ${dashRaw.notificacao_compulsoria_implantada_pct}% das UBSs`, value: dashRaw.notificacao_compulsoria_implantada_pct, max: 100, color: CRIT },
                    { label: `Medidas protetivas cumpridas: ${dashRaw.medida_protetiva_cumprida_pct}%`,              value: dashRaw.medida_protetiva_cumprida_pct,     max: 100, color: CRIT },
                    { label: `Femicídio 2025: ${dashRaw.femicidio_2025} óbitos + ${dashRaw.femicidio_tentativa_2025} tentativas`, value: dashRaw.femicidio_2025, max: 20, color: CRIT },
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
                <p><b>4 femicídios em 2025 — taxa 35/100k mulheres (22× a média nacional)</b>. 3 de 4 tinham medida protetiva anterior descumprida. Zero casa-abrigo em Apuí. Odara + botão do pânico: R$ 2.400.</p>
                <p><b>80% de subnotificação</b> — 1.420 casos estimados vs 284 notificados. Protocolo de triagem nas UBSs: R$ 8.400 → 1 pergunta salva vidas. UBS = único ponto de contato em 68% dos casos.</p>
                <p><b>Zero kit pós-violência sexual</b>. 280 casos estimados vs 42 notificados (subnotificação 85%). PEP em ≤ 72h: custo R$ 14k → evita HIV em 100% dos casos tratados a tempo. Protocolo MS 2022: gratuito.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "casos" && Array.isArray(casos) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={casos as any[]} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="tipo" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="estimados_2025"   name="Estimados 2025"   radius={[4,4,0,0]} fill={ACCENT} />
                <Bar dataKey="notificados_2025" name="Notificados 2025" radius={[4,4,0,0]}>
                  {(casos as any[]).map((_c: any, i: number) => <Cell key={i} fill={CRIT} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(casos as any[]).map((c: any) => (
                <div key={c.tipo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(c.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{c.tipo}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: CRIT }}>{(c.estimados_2025||0).toLocaleString()} estim.</span>
                      <span className="text-slate-500"> · {c.notificados_2025} notif.</span>
                      <p className="text-slate-400 mt-0.5">subnotif.: {c.subnotificacao_pct}%</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 ml-5 mb-1"><b>Perfil:</b> {c.perfil_vitima}</p>
                  <p className="text-xs text-slate-500 ml-5">{c.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "protecao" && Array.isArray(protecao) && (
          <div className="grid gap-3">
            {(protecao as any[]).map((p: any) => (
              <div key={p.acao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: p.implementada ? OK : CRIT }} />
                    <p className="font-semibold text-sm text-slate-700">{p.acao}</p>
                  </div>
                  <div className="text-right text-xs">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.implementada ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {p.implementada ? "Implementada" : "Não implementada"}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">R$ {(p.custo||0).toLocaleString()} · {p.prazo_meses}m</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{p.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Violência Doméstica — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="vd_notificada"          name="VD notificada"             stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="medidas_protetivas"     name="Medidas protetivas"        stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="right" dataKey="bo_registrado_pct"      name="B.O. registrado (%)"       stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
                <Line yAxisId="left"  dataKey="creas_atendimentos"     name="CREAS atendimentos"        stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="femicidio"              name="Femicídio"                 stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="6 2" />
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
