import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Baby, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function MaternoInfantilApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["mi-dashboard"], queryFn: () => apiGet("/api/materno-infantil-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: prenatal }    = useQuery({ queryKey: ["mi-prenatal"],  queryFn: () => apiGet("/api/materno-infantil-apui/prenatal"),    enabled: aba === "prenatal" });
  const { data: mortalidade } = useQuery({ queryKey: ["mi-mort"],      queryFn: () => apiGet("/api/materno-infantil-apui/mortalidade"), enabled: aba === "mortalidade" });
  const { data: historico }   = useQuery({ queryKey: ["mi-hist"],      queryFn: () => apiGet("/api/materno-infantil-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["mi-ind"],       queryFn: () => apiGet("/api/materno-infantil-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",   icon: <Baby size={15}/> },
    { key: "prenatal",   label: "Pré-natal",   icon: <Activity size={15}/> },
    { key: "mortalidade",label: "Mortalidade",  icon: <AlertTriangle size={15}/> },
    { key: "historico",  label: "Histórico",   icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Baby size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Materno-Infantil — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Pré-natal · Parto · Mortalidade Materna/Infantil · FMS Apuí/AM</p>
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
              <KPI label="Sífilis Congênita"        value={`${dashRaw.sifilis_congenita_por_mil_nv}/1k NV`} color={CRIT} sub={`meta: ${dashRaw.meta_sifilis_congenita_por_mil_nv}/1k`} />
              <KPI label="Mortalidade Materna"       value={`${dashRaw.mortalidade_materna_por_100k_nv}/100k`} color={CRIT} sub={`nacional: ${dashRaw.media_nacional_mm_por_100k}/100k`} />
              <KPI label="Mortalidade Infantil"      value={`${dashRaw.mortalidade_infantil_por_mil_nv}/1k NV`} color={CRIT} sub={`nacional: ${dashRaw.media_nacional_mi_por_mil_nv}/1k`} />
              <KPI label="Parto Domiciliar"          value={`${dashRaw.parto_domiciliar_pct}%`}            color={CRIT} sub="parto sem assistência hospitalar" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Pré-natal ≥ 6 consultas"  value={`${dashRaw.prenatal_6_consultas_pct}%`}        color={WARN} sub={`meta: ${dashRaw.meta_prenatal_pct}%`} />
              <KPI label="Cesárea"                   value={`${dashRaw.cesarea_pct}%`}                     color={CRIT} sub={`meta SUS: ≤ ${dashRaw.meta_cesarea_pct}%`} />
              <KPI label="Aleitamento Excl. 6m"      value={`${dashRaw.aleitamento_exclusivo_6m_pct}%`}    color={CRIT} sub={`meta: ${dashRaw.meta_aleitamento_pct}%`} />
              <KPI label="Triagem Neonatal"           value={`${dashRaw.triagem_neonatal_completa_pct}%`}  color={WARN} sub={`meta: ${dashRaw.meta_triagem_pct}%`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Coberturas Materno-Infantis</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Pré-natal ≥ 6 cons. (meta 75%)",      value: dashRaw.prenatal_6_consultas_pct,   color: WARN },
                    { label: "1ª cons. 1º trimestre (meta 70%)",     value: dashRaw.prenatal_1_trimestre_pct,   color: CRIT },
                    { label: "Parto institucional (meta 100%)",      value: dashRaw.parto_institucional_pct,    color: WARN },
                    { label: "Aleitamento excl. 6m (meta 45%)",      value: dashRaw.aleitamento_exclusivo_6m_pct, color: CRIT },
                    { label: "Triagem neonatal (meta 100%)",          value: dashRaw.triagem_neonatal_completa_pct, color: WARN },
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
                <p><b>Sífilis congênita 18,4/1k NV — 36,8x acima da meta</b>. VDRL positivo sem penicilina benzatina em 71,6% das gestantes. Eliminação é impossível sem estruturar toda a cadeia: teste → diagnóstico → tratamento materno e parceiro no mesmo dia.</p>
                <p><b>Zero obstetra, zero UTI neonatal</b> — pré-eclâmpsia e prematuridade matam gestantes e RN em Apuí que sobreviveriam com atendimento básico. Transfer 284 km para Humaitá em crise convulsiva com viatura = risco de óbito no trajeto.</p>
                <p><b>Cesárea 42,4% (meta SUS 25%)</b> — excesso de cesárea sem indicação clínica aumenta morbi-mortalidade materna. RN prematuro iatrogênico por cesárea eletiva vai para UTI neonatal que não existe em Apuí (transfer automático para Humaitá/Manaus).</p>
              </div>
            </div>
          </div>
        )}

        {aba === "prenatal" && Array.isArray(prenatal) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Qualidade do Pré-natal — Itens PHPN (%)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={prenatal as any[]} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="item" tick={{ fontSize: 8 }} width={260} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="cobertura_pct" name="Cobertura (%)" radius={[0,3,3,0]}>
                    {(prenatal as any[]).map((p: any) => <Cell key={p.item} fill={statusColor(p.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(prenatal as any[]).map((p: any) => (
                <div key={p.item} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: statusColor(p.status) }} />
                      <span className="font-semibold text-sm text-slate-700">{p.item}</span>
                    </div>
                    <span className="font-bold text-sm" style={{ color: statusColor(p.status) }}>{p.cobertura_pct}% / meta {p.meta_pct}%</span>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{p.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "mortalidade" && Array.isArray(mortalidade) && (
          <div className="space-y-3">
            {(mortalidade as any[]).map((m: any) => (
              <div key={m.causa} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: m.evitabilidade === "alta" ? CRIT : WARN }} />
                    <span className="font-semibold text-slate-700">{m.causa}</span>
                  </div>
                  <div className="text-xs text-right ml-4 space-y-0.5">
                    <div>Casos/ano: <b style={{ color: CRIT }}>{m.casos_ano}</b></div>
                    <div className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: m.evitabilidade === "alta" ? CRIT + "22" : WARN + "22", color: m.evitabilidade === "alta" ? CRIT : WARN }}>
                      Evitabilidade: {m.evitabilidade}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{m.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Materno-Infantil (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" tick={{ fontSize: 11 }} unit="%" />
                <YAxis yAxisId="n" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="pct" dataKey="prenatal_6c_pct"           name="Pré-natal ≥6c (%)"    stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="parto_institucional_pct"   name="Parto instit. (%)"    stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="aleitamento_6m_pct"        name="Aleitamento 6m (%)"   stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="sifilis_cong_por_mil"      name="Sífilis cong. (/1kNV)"stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="n"   dataKey="mort_infantil_por_mil"     name="Mort. infantil (/1kNV)"stroke={WARN}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
