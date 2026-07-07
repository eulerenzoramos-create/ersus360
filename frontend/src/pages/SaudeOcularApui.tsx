import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Eye, AlertTriangle, TrendingUp, Activity } from "lucide-react";

const BRAND  = "#1e3a5f";
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

export default function SaudeOcularApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["ocul-dashboard"],    queryFn: () => apiGet("/api/saude-ocular-apui/dashboard"),    enabled: aba === "dashboard" });
  const { data: condicoes }   = useQuery({ queryKey: ["ocul-condicoes"],    queryFn: () => apiGet("/api/saude-ocular-apui/condicoes"),    enabled: aba === "condicoes" });
  const { data: intervencoes }= useQuery({ queryKey: ["ocul-interv"],       queryFn: () => apiGet("/api/saude-ocular-apui/intervencoes"), enabled: aba === "intervencoes" });
  const { data: historico }   = useQuery({ queryKey: ["ocul-hist"],         queryFn: () => apiGet("/api/saude-ocular-apui/historico"),    enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["ocul-ind"],          queryFn: () => apiGet("/api/saude-ocular-apui/indicadores"),  enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",     icon: <Eye size={15}/> },
    { key: "condicoes",    label: "Condições",     icon: <Activity size={15}/> },
    { key: "intervencoes", label: "Intervenções",  icon: <Activity size={15}/> },
    { key: "historico",    label: "Histórico",     icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores",   icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Eye size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Ocular — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Catarata · Glaucoma · Retinopatia diabética · DMRI · Tracoma · Baixa visão · FMS Apuí/AM</p>
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
              <KPI label="Catarata estimados"     value={dashRaw.catarata_estimados?.toLocaleString()}        color={CRIT} sub={`fila: ${dashRaw.catarata_cirurgia_fila_pacientes} pac.`} />
              <KPI label="Glaucoma estimados"     value={dashRaw.glaucoma_estimados?.toLocaleString()}        color={CRIT} sub={`diagnosticados: ${dashRaw.glaucoma_diagnosticados_pct}%`} />
              <KPI label="Retinopatia — rastreio" value={`${dashRaw.retinopatia_diabetica_rastreio_pct}%`}    color={CRIT} sub="dos diabéticos" />
              <KPI label="Espera oftalmologia"    value={`${dashRaw.fila_consulta_oftalmologia_dias} dias`}   color={CRIT} sub="zero oftalmologista" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Catarata — cirurgia fila" value={`${dashRaw.catarata_cirurgia_espera_meses}m`}     color={CRIT} sub="espera para cirurgia" />
              <KPI label="Cegueira legal estimada" value={dashRaw.cegueira_legal_casos_estimados?.toLocaleString()} color={CRIT} sub="casos no município" />
              <KPI label="Triagem visual escolar" value={`${dashRaw.acuidade_visual_triagem_escolar_pct}%`}  color={CRIT} sub="das escolas" />
              <KPI label="Óculos via SUS — fila"  value={`${dashRaw.oculos_via_sus_fila_meses}m`}           color={CRIT} sub="espera para óculos" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Diagnóstico por Condição Ocular</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Catarata diagnosticados (${Math.round(dashRaw.catarata_cirurgia_fila_pacientes / dashRaw.catarata_estimados * 100)}%)`, value: dashRaw.catarata_cirurgia_fila_pacientes, max: dashRaw.catarata_estimados, color: CRIT },
                    { label: `Glaucoma diagnosticados (${dashRaw.glaucoma_diagnosticados_pct}%)`,  value: dashRaw.glaucoma_diagnosticados_pct,  max: 100, color: CRIT },
                    { label: `Retinopatia rastreada (${dashRaw.retinopatia_diabetica_rastreio_pct}%)`, value: dashRaw.retinopatia_diabetica_rastreio_pct, max: 100, color: CRIT },
                    { label: `Triagem visual escolar (${dashRaw.acuidade_visual_triagem_escolar_pct}%)`, value: dashRaw.acuidade_visual_triagem_escolar_pct, max: 100, color: WARN },
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
                <p><b>Cegueira evitável em massa</b> — 742 com catarata (cirurgia: 18 meses de espera), 494 com glaucoma sem diagnóstico, 148 com cegueira legal estimada. Todas essas condições têm tratamento efetivo disponível via SUS.</p>
                <p><b>Retinopatia diabética sem rastreio</b> — 81,6% dos 1.684 diabéticos nunca tiveram o fundo de olho avaliado. Fotocoagulação a laser: indisponível em Apuí e Humaitá. Cada mês de atraso = perda permanente de visão.</p>
                <p><b>Mutirão de catarata: R$ 164.720</b> — cirurgia de catarata custa R$ 580 pelo SUS. 284 pacientes na fila = 2 dias de mutirão com oftalmologista de Manaus eliminaria a fila completa e preveniria 148 casos de cegueira legal.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "condicoes" && Array.isArray(condicoes) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-2">
              <h3 className="font-semibold text-slate-700 mb-3">Estimados vs Diagnosticados por Condição Ocular</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={(condicoes as any[]).filter((c: any) => c.estimados > 0)} margin={{ top: 5, right: 20, bottom: 50, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="condicao" tick={{ fontSize: 8 }} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="estimados"      name="Estimados"      fill={CRIT} />
                  <Bar dataKey="diagnosticados" name="Diagnosticados" fill={WARN} />
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
                    <span className="font-bold" style={{ color: statusColor(c.status) }}>{c.diagnosticados} diagnosticados</span>
                    <p className="text-xs text-slate-400">estimados: {c.estimados} · tratados: {c.tratados_pct}%</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{c.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "intervencoes" && Array.isArray(intervencoes) && (
          <div className="grid gap-3">
            {(intervencoes as any[]).map((i: any) => (
              <div key={i.intervencao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(i.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{i.intervencao}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${i.disponivel ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {i.disponivel ? "Disponível" : "Indisponível"}
                    </span>
                    {i.fila_dias > 0 && <p className="text-xs text-slate-400 mt-0.5">fila: {i.fila_dias} dias</p>}
                  </div>
                </div>
                {!i.disponivel && <p className="text-xs text-slate-400 ml-5 mb-1">Referência: {i.referencia}</p>}
                <p className="text-xs text-slate-500 ml-5">{i.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Saúde Ocular — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="catarata_fila"              name="Catarata fila (pac.)"        stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="glaucoma_diag_pct"          name="Glaucoma diagnosticado (%)"  stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="retinopatia_rastreio_pct"   name="Retinopatia rastreada (%)"   stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="triagem_escolar_pct"        name="Triagem escolar (%)"         stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
