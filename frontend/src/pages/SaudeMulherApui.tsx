import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Thermometer, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function SaudeMulherApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }         = useQuery({ queryKey: ["mulher-dashboard"], queryFn: () => apiGet("/api/saude-mulher-apui/dashboard"),         enabled: aba === "dashboard" });
  const { data: rastreamento } = useQuery({ queryKey: ["mulher-rastr"],     queryFn: () => apiGet("/api/saude-mulher-apui/rastreamento"),       enabled: aba === "rastreamento" });
  const { data: violencia }    = useQuery({ queryKey: ["mulher-viol"],      queryFn: () => apiGet("/api/saude-mulher-apui/violencia"),          enabled: aba === "violencia" });
  const { data: historico }    = useQuery({ queryKey: ["mulher-hist"],      queryFn: () => apiGet("/api/saude-mulher-apui/historico"),          enabled: aba === "historico" });
  const { data: indicadores }  = useQuery({ queryKey: ["mulher-ind"],       queryFn: () => apiGet("/api/saude-mulher-apui/indicadores"),        enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",    icon: <Thermometer size={15}/> },
    { key: "rastreamento", label: "Rastreamento", icon: <Activity size={15}/> },
    { key: "violencia",    label: "Violência",    icon: <AlertTriangle size={15}/> },
    { key: "historico",    label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Thermometer size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde da Mulher — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Rastreamento · Planejamento Familiar · Violência · FMS Apuí/AM</p>
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
              <KPI label="Papanicolau (%)"          value={`${dashRaw.papanicolau_cobertura_pct}%`}        color={CRIT} sub={`meta: ${dashRaw.meta_papanicolau_pct}%`} />
              <KPI label="Mamografia (%)"           value={`${dashRaw.mamografia_cobertura_pct}%`}         color={CRIT} sub={`fila: ${dashRaw.mamografia_fila_dias} dias`} />
              <KPI label="Gravidez não planejada"   value={`${dashRaw.gravidez_nao_planejada_pct}%`}       color={CRIT} sub="das gestações" />
              <KPI label="Violência notificada"     value={`${dashRaw.violencia_contra_mulher_notif_ano}`} color={CRIT} sub="notificações/ano" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="CA Colo — diagnóstico tardio" value={`${dashRaw.ca_colo_diagnostico_avancado_pct}%`} color={CRIT} sub="estágio avançado" />
              <KPI label="Ginecologista no município"   value={`${dashRaw.ginecologista_municipio}`}            color={CRIT} sub="zero especialista" />
              <KPI label="Esterilização (fila)"         value={`${dashRaw.esterilizacao_fila_meses} meses`}     color={CRIT} sub="espera laqueadura" />
              <KPI label="Feminicídio tentado/ano"      value={`${dashRaw.feminicidios_tentados_ano}`}           color={CRIT} sub="zero casa de acolhimento" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Rastreamento Oncológico</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Papanicolau (meta 80%)",         value: dashRaw.papanicolau_cobertura_pct,  color: CRIT, display: `${dashRaw.papanicolau_cobertura_pct}%` },
                    { label: "Mamografia (meta 70%)",          value: dashRaw.mamografia_cobertura_pct,   color: CRIT, display: `${dashRaw.mamografia_cobertura_pct}%` },
                    { label: "HPV D2 feminino (meta 80%)",     value: dashRaw.hpv_cobertura_d2_pct,       color: CRIT, display: `${dashRaw.hpv_cobertura_d2_pct}%` },
                    { label: "Contraceptivo (meta 80%)",       value: dashRaw.metodo_contraceptivo_pct,   color: WARN, display: `${dashRaw.metodo_contraceptivo_pct}%` },
                    { label: "Climatério acomp. (meta 50%)",   value: dashRaw.climatério_acompanhamento_pct, color: CRIT, display: `${dashRaw.climatério_acompanhamento_pct}%` },
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
                <p><b>Mamógrafo inexistente</b> — TFD com fila de 128 dias. AM tem incidência de CA mama e colo entre as mais altas do Brasil. 84,2% dos casos de CA mama diagnosticados em estágio III/IV: doença curável se detectada cedo, letal quando tardia.</p>
                <p><b>Zero ginecologista</b> — CA colo suspeito = transfer imediato sem colposcópio. Mulher ribeirinha percorre 60-180km para consulta ginecológica via TFD em Humaitá ou Manaus com fila de semanas a meses.</p>
                <p><b>4 feminicídios tentados em 2025</b> — zero casa de acolhimento. Delegacia da mulher em Humaitá (284 km). Mulher em situação de violência não tem para onde ir sem abandonar filhos, emprego e comunidade.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "rastreamento" && Array.isArray(rastreamento) && (
          <div className="space-y-4">
            {(rastreamento as any[]).map((r: any) => (
              <div key={r.programa} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(r.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{r.programa}</p>
                  </div>
                  <span className="font-bold text-sm" style={{ color: statusColor(r.status) }}>{r.cobertura_pct}% / meta {r.meta_pct}%</span>
                </div>
                <div className="ml-5 space-y-1">
                  {r.lesoes_detectadas_ano != null && (
                    <p className="text-xs text-slate-500">
                      Lesões detectadas/ano: <b>{r.lesoes_detectadas_ano}</b> · CA confirmado: <b>{r.casos_cancer_confirmados_ano}</b>
                      {r.estagio_avancado_pct != null && <> · Diagnóstico avançado: <b style={{ color: CRIT }}>{r.estagio_avancado_pct}%</b></>}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">{r.observacao}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "violencia" && Array.isArray(violencia) && (
          <div className="grid gap-3">
            {(violencia as any[]).map((v: any) => (
              <div key={v.tipo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(v.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{v.tipo}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: statusColor(v.status) }}>{v.notificacoes_ano} notif.</span>
                    {v.subnotificacao_estimada_pct > 0 && (
                      <p className="text-xs text-slate-400">subnotificação est.: {v.subnotificacao_estimada_pct}%</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{v.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Saúde da Mulher (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line dataKey="papanicolau_pct"   name="Papanicolau (%)"    stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="mamografia_pct"    name="Mamografia (%)"     stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="contraceptivo_pct" name="Contraceptivo (%)"  stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="hpv_d2_pct"        name="HPV D2 (%)"         stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
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
