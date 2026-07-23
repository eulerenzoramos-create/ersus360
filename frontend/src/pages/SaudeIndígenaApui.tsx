import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
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

export default function SaudeIndígenaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["sind-dashboard"], queryFn: () => apiGet("/api/saude-indigena-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: agravos }     = useQuery({ queryKey: ["sind-agravos"],   queryFn: () => apiGet("/api/saude-indigena-apui/agravos"),      enabled: aba === "agravos" });
  const { data: acesso }      = useQuery({ queryKey: ["sind-acesso"],    queryFn: () => apiGet("/api/saude-indigena-apui/acesso"),       enabled: aba === "acesso" });
  const { data: historico }   = useQuery({ queryKey: ["sind-hist"],      queryFn: () => apiGet("/api/saude-indigena-apui/historico"),    enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["sind-ind"],       queryFn: () => apiGet("/api/saude-indigena-apui/indicadores"),  enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",  icon: <Users size={15}/> },
    { key: "agravos",    label: "Agravos",    icon: <AlertTriangle size={15}/> },
    { key: "acesso",     label: "Acesso",     icon: <Activity size={15}/> },
    { key: "historico",  label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Users size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Indígena — Apuí/AM</h1>
            <p className="text-sm text-slate-500">DSEI Madeira · TI Tenharim · CASAI Porto Velho · FMS Apuí/AM</p>
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
              <KPI label="População Indígena"      value={dashRaw.populacao_indigena_estimada?.toString()} color={BRAND} sub={`${dashRaw.aldeias_territorio_municipal} aldeias`} />
              <KPI label="Mortalidade Infantil"    value={`${dashRaw.mortalidade_infantil_por_mil_nv}/1k NV`} color={CRIT} sub={`nacional: ${dashRaw.media_nacional_mort_inf}/1k`} />
              <KPI label="IPA Malária Indígena"    value={`${dashRaw.malaria_incidencia_por_mil}/1k`}     color={CRIT} sub={`municipal: ${dashRaw.media_municipal_malaria_por_mil}/1k`} />
              <KPI label="Desnutrição < 5a"        value={`${dashRaw.desnutricao_cronica_menores_5_pct}%`} color={CRIT} sub={`meta: ${dashRaw.meta_desnutricao_pct}%`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Vacinação Completa"      value={`${dashRaw.vacinacao_cobertura_pct}%`}          color={CRIT} sub={`meta: ${dashRaw.meta_vacinacao_pct}%`} />
              <KPI label="Parto Institucional"     value={`${dashRaw.parto_institucional_pct}%`}          color={CRIT} sub={`meta: ${dashRaw.meta_parto_institucional_pct}%`} />
              <KPI label="EMSI Equipes"            value={`${dashRaw.equipes_emsi_municipio}/${dashRaw.meta_emsi}`} color={CRIT} sub={`médico: ${dashRaw.medico_emsi ? "sim" : "não"}`} />
              <KPI label="CASAI Referência"        value={dashRaw.casai_referencia}                       color={WARN} sub={`${dashRaw.distancia_casai_km} km`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Indicadores Prioritários</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Cobertura vacinal (meta 95%)",           value: dashRaw.vacinacao_cobertura_pct,       meta: 95,  color: CRIT },
                    { label: "Parto institucional (meta 100%)",         value: dashRaw.parto_institucional_pct,       meta: 100, color: CRIT },
                    { label: "Desnutrição reversa (meta ≤ 5%)",        value: 100 - dashRaw.desnutricao_cronica_menores_5_pct, meta: 95,  color: CRIT },
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
                <p><b>Mortalidade infantil 42/1.000 NV</b> — 3,5x a média nacional. Partos domiciliares 61,6% em aldeia a 3-8h de barco da UBS sede. Sepse neonatal e prematuridade tratáveis matam porque não há estrutura.</p>
                <p><b>IPA malária 384/1.000</b> — 7,4x superior à média municipal. Garimpo ilegal nas proximidades da TI amplia criadouros e contato vetorial. Sem borrifação intradomiciliar, sem bed nets universais.</p>
                <p><b>EMSI sem médico</b> — 1 equipe (enfermeiro + técnico + 4 AIS) para 420 pessoas em 3 aldeias. CASAI Porto Velho a 680 km: internação indígena = ruptura familiar e abandono de tratamento.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "agravos" && Array.isArray(agravos) && (
          <div className="space-y-3">
            {(agravos as any[]).map((ag: any) => (
              <div key={ag.agravo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(ag.status) }} />
                    <span className="font-semibold text-sm text-slate-700">{ag.agravo}</span>
                  </div>
                  <div className="text-xs text-right ml-4 space-y-0.5">
                    <div>Casos/ano: <span className="font-bold">{ag.casos_ano}</span></div>
                    {ag.obitos_ano > 0 && <div className="font-bold" style={{ color: CRIT }}>Óbitos: {ag.obitos_ano}</div>}
                    {ag.incidencia_indigena_por_mil && (
                      <div className="text-slate-400">{ag.incidencia_indigena_por_mil}/1k vs {ag.incidencia_municipal_por_mil}/1k municipal</div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{ag.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "acesso" && Array.isArray(acesso) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Acesso a Serviços de Saúde — Indígenas</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={acesso as any[]} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="indicador" tick={{ fontSize: 8 }} width={240} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip />
                  <Bar dataKey="valor" name="Realizado" radius={[0,3,3,0]}>
                    {(acesso as any[]).map((a: any) => <Cell key={a.indicador} fill={statusColor(a.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(acesso as any[]).map((a: any) => (
                <div key={a.indicador} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: statusColor(a.status) }} />
                    <span className="font-semibold text-sm text-slate-700">{a.indicador}</span>
                  </div>
                  <span className="font-bold text-sm" style={{ color: statusColor(a.status) }}>{a.valor} {a.unidade} / meta {a.meta}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Saúde Indígena (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct"  tick={{ fontSize: 11 }} unit="%" />
                <YAxis yAxisId="n"    orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="mortalidade_infantil"      name="Mortal. infantil (/1kNV)" stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="malaria_ipa_por_mil"       name="IPA malária (/1k)"        stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="pct" dataKey="vacinacao_pct"             name="Vacinação (%)"            stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="desnutricao_cronica_pct"   name="Desnutrição < 5a (%)"     stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="pct" dataKey="parto_institucional_pct"   name="Parto institucional (%)"  stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
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
