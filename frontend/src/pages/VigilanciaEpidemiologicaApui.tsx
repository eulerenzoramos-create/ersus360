import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Monitor, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function VigilanciaEpidemiologicaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["vige-dashboard"], queryFn: () => apiGet("/api/vigilancia-epidemiologica-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: agravos }     = useQuery({ queryKey: ["vige-agravos"],   queryFn: () => apiGet("/api/vigilancia-epidemiologica-apui/agravos"),     enabled: aba === "agravos" });
  const { data: surtos }      = useQuery({ queryKey: ["vige-surtos"],    queryFn: () => apiGet("/api/vigilancia-epidemiologica-apui/surtos"),      enabled: aba === "surtos" });
  const { data: historico }   = useQuery({ queryKey: ["vige-hist"],      queryFn: () => apiGet("/api/vigilancia-epidemiologica-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["vige-ind"],       queryFn: () => apiGet("/api/vigilancia-epidemiologica-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",     icon: <Monitor size={15}/> },
    { key: "agravos",    label: "Agravos SINAN", icon: <Activity size={15}/> },
    { key: "surtos",     label: "Surtos",        icon: <AlertTriangle size={15}/> },
    { key: "historico",  label: "Histórico",     icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores",   icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Monitor size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Vigilância Epidemiológica — Apuí/AM</h1>
            <p className="text-sm text-slate-500">SINAN · Arboviroses · Malária · Surtos · FMS Apuí/AM</p>
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
              <KPI label="Notificações SINAN/ano"   value={`${dashRaw.notificacoes_compulsorias_ano}`}    color={BRAND} sub={`${dashRaw.doencas_monitoradas_sinan} doenças monitoradas`} />
              <KPI label="Completude SINAN"          value={`${dashRaw.completude_sinan_pct}%`}            color={WARN}  sub={`meta: ${dashRaw.meta_completude_pct}%`} />
              <KPI label="IIP Aedes aegypti"         value={`${dashRaw.dengue_iip_aedes_pct}%`}            color={CRIT}  sub={`crítico > ${dashRaw.dengue_nivel_critico_pct}%`} />
              <KPI label="Surtos/ano"                value={`${dashRaw.surtos_ano}`}                       color={CRIT}  sub={`${dashRaw.surtos_investigados_prazo_pct}% no prazo`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Epidemiologista municipal" value={`${dashRaw.epidemiologistas_municipio}`}        color={CRIT} sub="zero profissional" />
              <KPI label="Técnicos de vigilância"    value={`${dashRaw.tecnico_vigilancia}/${dashRaw.meta_tecnico_vigilancia}`} color={WARN} sub="atual/meta" />
              <KPI label="Dengue — casos 2025"       value={`${dashRaw.arboviroses_casos_ano}`}             color={CRIT} sub="IIP 4,2% (nível crítico)" />
              <KPI label="CIEVS-AM (referência)"     value={`${dashRaw.distancia_cievs_km} km`}             color={WARN} sub="Manaus" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Qualidade da Vigilância</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Completude SINAN (meta 95%)",           value: dashRaw.completude_sinan_pct,           color: WARN, display: `${dashRaw.completude_sinan_pct}%` },
                    { label: "Oportunidade de notificação (meta 80%)",value: dashRaw.oportunidade_notificacao_pct,    color: WARN, display: `${dashRaw.oportunidade_notificacao_pct}%` },
                    { label: "Surtos investigados no prazo (meta 100%)", value: dashRaw.surtos_investigados_prazo_pct, color: WARN, display: `${dashRaw.surtos_investigados_prazo_pct}%` },
                    { label: "Vacinação antirrábica animal (meta 80%)", value: dashRaw.raiva_vacinacao_animais_pct,   color: CRIT, display: `${dashRaw.raiva_vacinacao_animais_pct}%` },
                  ].map((b: any) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-bold" style={{ color: b.color }}>{b.display}</span>
                      </div>
                      <ProgressBar value={b.value} max={100} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>Zero epidemiologista</b> — CIEVS-AM em Manaus a 784 km. Surto em área ribeirinha pode levar 3-5 dias para chegar ao sistema quando já há propagação. Técnico de nível médio preenche ficha SINAN sem formação analítica.</p>
                <p><b>IIP Aedes 4,2%</b> — acima do nível crítico (3,9%). 284 casos de dengue em 2025 com tendência ascendente. Agentes de endemias: 2 para 24.700 hab (meta: 12). Cobertura urbana 64%, rural zero.</p>
                <p><b>Malária IPA 51,9/1k</b> — Grupo 3 PNCM (pior classificação). Garimpo ilegal impede controle ambiental. Borrifação 42,4% vs meta 80%. Transmissão ativa 12 meses/ano.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "agravos" && Array.isArray(agravos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Casos por Agravo — 2025</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={agravos as any[]} layout="vertical" margin={{ left: 160, right: 30, top: 5, bottom: 5 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="agravo" tick={{ fontSize: 10 }} width={155} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip />
                  <Bar dataKey="casos_2025" name="Casos 2025" radius={[0, 4, 4, 0]}>
                    {(agravos as any[]).map((a: any, i: number) => (
                      <Cell key={i} fill={statusColor(a.nivel_alerta || "ok")} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(agravos as any[]).map((a: any) => (
                <div key={a.agravo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(a.nivel_alerta || "ok") }} />
                      <div>
                        <p className="font-semibold text-sm text-slate-700">{a.agravo}</p>
                        <p className="text-xs text-slate-400">Incidência: {a.incidencia_100k}/100k · Investigação: {a.investigacao_pct}%</p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <span className="font-bold" style={{ color: statusColor(a.nivel_alerta || "ok") }}>{a.casos_2025} casos</span>
                      <p className="text-xs text-slate-400">{a.variacao_pct > 0 ? "+" : ""}{a.variacao_pct}% vs 2024</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "surtos" && Array.isArray(surtos) && (
          <div className="grid gap-3">
            {(surtos as any[]).map((s: any) => (
              <div key={`${s.agravo}-${s.ano}`} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(s.status) }} />
                    <div>
                      <p className="font-semibold text-sm text-slate-700">{s.agravo} — {s.ano}</p>
                      <p className="text-xs text-slate-400">{s.duracao_semanas} semanas · {s.obitos_suspeitos} óbito(s) suspeito(s)</p>
                    </div>
                  </div>
                  <span className="font-bold text-sm" style={{ color: statusColor(s.status) }}>{s.casos} casos</span>
                </div>
                <p className="text-xs text-slate-500 ml-5">Controle: {s.controle}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Vigilância Epidemiológica (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="notificacoes"   name="Notificações SINAN"   stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="dengue_casos"   name="Dengue (casos)"       stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="malaria_casos"  name="Malária (casos)"      stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="completude_pct" name="Completude SINAN (%)" stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
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
