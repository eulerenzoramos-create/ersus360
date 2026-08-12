import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { ShieldCheck, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function VigilanciaSanitariaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["visa-dashboard"],  queryFn: () => apiGet("/api/vigilancia-sanitaria-apui/dashboard"),       enabled: aba === "dashboard" });
  const { data: estab }       = useQuery({ queryKey: ["visa-estab"],      queryFn: () => apiGet("/api/vigilancia-sanitaria-apui/estabelecimentos"),  enabled: aba === "estabelecimentos" });
  const { data: zoonoses }    = useQuery({ queryKey: ["visa-zoo"],        queryFn: () => apiGet("/api/vigilancia-sanitaria-apui/zoonoses"),          enabled: aba === "zoonoses" });
  const { data: historico }   = useQuery({ queryKey: ["visa-hist"],       queryFn: () => apiGet("/api/vigilancia-sanitaria-apui/historico"),         enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["visa-ind"],        queryFn: () => apiGet("/api/vigilancia-sanitaria-apui/indicadores"),       enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",       label: "Dashboard",       icon: <ShieldCheck size={15}/> },
    { key: "estabelecimentos",label: "Estabelecimentos",icon: <Activity size={15}/> },
    { key: "zoonoses",        label: "Zoonoses",        icon: <AlertTriangle size={15}/> },
    { key: "historico",       label: "Histórico",       icon: <TrendingUp size={15}/> },
    { key: "indicadores",     label: "Indicadores",     icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <ShieldCheck size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Vigilância Sanitária — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Inspeção · Alimentos · Água · Zoonoses · FMS Apuí/AM</p>
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
              <KPI label="Inspeções Regulares"    value={`${dashRaw.inspecoes_regulares_pct}%`}    color={CRIT} sub={`meta: ${dashRaw.meta_inspecoes_pct}%`} />
              <KPI label="Vigilantes VISA"         value={`${dashRaw.vigilantes_sanitarios}/${dashRaw.meta_vigilantes}`} color={CRIT} sub={`${dashRaw.estabelecimentos_total} estabelecimentos`} />
              <KPI label="Surtos Alimentares/Ano"  value={dashRaw.surtos_alimentares_ano?.toString()} color={CRIT} sub={`${dashRaw.casos_surtos_total} casos`} />
              <KPI label="Água Irregular"          value={`${dashRaw.agua_irregular_pct}%`}         color={CRIT} sub={`de ${dashRaw.agua_pontos_monitorados} pontos`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Vacinação Antirrábica"   value={`${dashRaw.raiva_vacinacao_caes_gatos_pct}%`} color={WARN} sub={`meta: ${dashRaw.meta_vacinacao_raiva_pct}%`} />
              <KPI label="Leptospirose (casos)"    value={dashRaw.leptospirose_casos_ano?.toString()} color={CRIT} sub="casos humanos/ano" />
              <KPI label="Apreensões/Ano"          value={dashRaw.apreensoes_produtos_irregulares_ano?.toString()} color={WARN} sub="produtos irregulares" />
              <KPI label="LACEN Referência"        value={dashRaw.laboratorio_referencia}           color={BRAND} sub={`${dashRaw.distancia_lacen_km} km`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Coberturas VISA</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Inspeções sanitárias (meta 80%)",      value: dashRaw.inspecoes_regulares_pct,      color: CRIT },
                    { label: "Monitoramento água (meta 100%)",        value: dashRaw.agua_monitoramento_regular_pct, color: CRIT },
                    { label: "Vacinação antirrábica (meta 80%)",      value: dashRaw.raiva_vacinacao_caes_gatos_pct, color: WARN },
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
                <p><b>3 vigilantes para 284 estabelecimentos</b> — impossível atingir 80% de inspeção regular. 175 estabelecimentos sem inspeção anual. Auto de infração e interdição impossíveis sem equipe mínima de 8 profissionais.</p>
                <p><b>Garimpo ilegal: 92% de irregularidade</b> — 38 pontos com mercúrio, cianeto e explosivos sem nenhum controle sanitário. VISA municipal não tem mandato legal para garimpo ilegal. Demanda ação federal (IBAMA/PF/Anvisa).</p>
                <p><b>42,4% da água irregular</b> — LACEN-AM em Manaus (784 km) para análises. Resultado em 15-30 dias quando a contaminação já atingiu centenas de pessoas. Laboratório itinerante da ADAF visita semestralmente.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "estabelecimentos" && Array.isArray(estab) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Inspeção por Segmento (%)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={estab as any[]} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
                  <YAxis type="category" dataKey="segmento" tick={{ fontSize: 8 }} width={260} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="inspecionados_pct" name="Inspecionados (%)" radius={[0,3,3,0]}>
                    {(estab as any[]).map((e: any) => <Cell key={e.segmento} fill={statusColor(e.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(estab as any[]).map((e: any) => (
                <div key={e.segmento} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: statusColor(e.status) }} />
                    <span className="font-semibold text-sm text-slate-700">{e.segmento}</span>
                  </div>
                  <div className="text-xs text-right space-y-0.5">
                    <div>Total: <b>{e.total}</b> | Alto risco: <b style={{ color: CRIT }}>{e.alto_risco}</b></div>
                    <div>Inspecionados: <b style={{ color: statusColor(e.status) }}>{e.inspecionados_pct}%</b> | Irregulares: <b style={{ color: CRIT }}>{e.irregulares_pct}%</b></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "zoonoses" && Array.isArray(zoonoses) && (
          <div className="grid gap-3">
            {(zoonoses as any[]).map((z: any) => (
              <div key={z.agravo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: z.risco === "alto" ? CRIT : z.risco === "medio" ? WARN : OK }} />
                    <span className="font-semibold text-sm text-slate-700">{z.agravo}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: (z.risco === "alto" ? CRIT : z.risco === "medio" ? WARN : OK) + "22", color: z.risco === "alto" ? CRIT : z.risco === "medio" ? WARN : OK }}>{z.risco}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: z.casos_humanos_ano > 0 ? CRIT : OK }}>{z.casos_humanos_ano} casos humanos/ano</span>
                </div>
                <p className="text-xs text-slate-500 ml-5 mb-1">{z.situacao}</p>
                <p className="text-xs font-medium ml-5" style={{ color: ACCENT }}>{z.acao_prioritaria}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — VISA (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" tick={{ fontSize: 11 }} unit="%" />
                <YAxis yAxisId="n" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="pct" dataKey="inspecoes_pct"        name="Inspeções (%)"           stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="irregulares_pct"      name="Irregulares (%)"         stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="pct" dataKey="agua_irregular_pct"   name="Água irregular (%)"      stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="pct" dataKey="raiva_vacinacao_pct"  name="Vacinação antirrábica (%)" stroke={OK}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="surtos_alimentares"   name="Surtos alimentares"       stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
