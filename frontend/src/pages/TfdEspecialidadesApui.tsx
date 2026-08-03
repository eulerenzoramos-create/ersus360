import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Globe, AlertTriangle, TrendingUp, Activity } from "lucide-react";
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

export default function TfdEspecialidadesApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["tfd-dashboard"],     queryFn: () => apiGet("/api/tfd-especialidades-apui/dashboard"),    enabled: aba === "dashboard" });
  const { data: especialidades } = useQuery({ queryKey: ["tfd-espec"],      queryFn: () => apiGet("/api/tfd-especialidades-apui/especialidades"), enabled: aba === "especialidades" });
  const { data: destinos }    = useQuery({ queryKey: ["tfd-destinos"],      queryFn: () => apiGet("/api/tfd-especialidades-apui/destinos"),       enabled: aba === "destinos" });
  const { data: historico }   = useQuery({ queryKey: ["tfd-hist"],          queryFn: () => apiGet("/api/tfd-especialidades-apui/historico"),      enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["tfd-ind"],           queryFn: () => apiGet("/api/tfd-especialidades-apui/indicadores"),    enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",      label: "Dashboard",       icon: <Globe size={15}/> },
    { key: "especialidades", label: "Especialidades",  icon: <Activity size={15}/> },
    { key: "destinos",       label: "Destinos",        icon: <AlertTriangle size={15}/> },
    { key: "historico",      label: "Histórico",       icon: <TrendingUp size={15}/> },
    { key: "indicadores",    label: "Indicadores",     icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Globe size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>TFD e Especialidades — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Tratamento Fora do Domicílio · Regulação · Fila · Destinos · FMS Apuí/AM</p>
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
              <KPI label="TFD autorizadas/ano"     value={dashRaw.tfd_autorizacoes_ano?.toLocaleString()}     color={CRIT} sub="crescendo 10,9%/aa" />
              <KPI label="Custo TFD/ano"           value={`R$ ${(dashRaw.tfd_custo_total_ano/1000000).toFixed(2)}M`} color={CRIT} sub="28,4% do orçamento saúde" />
              <KPI label="Fila total especialidades" value={dashRaw.fila_total_especialidades?.toLocaleString()} color={CRIT} sub={`espera: ${dashRaw.tempo_medio_espera_dias} dias (meta ${dashRaw.meta_espera_dias})`} />
              <KPI label="Óbitos na fila 2025"     value={dashRaw.pacientes_obito_na_fila_2025}               color={CRIT} sub="potencialmente evitáveis" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Especialistas no município" value={dashRaw.especialistas_municipio}                color={CRIT} sub={`meta: ${dashRaw.especialistas_meta_pop}`} />
              <KPI label="TFD indeferidas"          value={`${dashRaw.tfd_indeferidas_pct}%`}               color={CRIT} sub="meta < 2%" />
              <KPI label="TFD via judicial"         value={`${dashRaw.tfd_judicial_para_acesso_pct}%`}      color={WARN} sub="acesso por via judicial" />
              <KPI label="Pendentes autorização"    value={dashRaw.tfd_pendentes_autorizacao}               color={WARN} sub="aguardando regulação" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Fila por Especialidade (dias de espera)</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Endocrinologia (${dashRaw.neurologia_espera_dias} dias)`, value: 240, max: 250, color: CRIT },
                    { label: `Neurologia (${dashRaw.neurologia_espera_dias} dias)`,     value: dashRaw.neurologia_espera_dias, max: 250, color: CRIT },
                    { label: `Cardiologia (${dashRaw.cardiologia_espera_dias} dias)`,   value: dashRaw.cardiologia_espera_dias, max: 250, color: CRIT },
                    { label: `Oftalmologia (${dashRaw.cardiologia_espera_dias} dias)`,  value: 180, max: 250, color: CRIT },
                    { label: `Ortopedia (${dashRaw.ortopedia_espera_dias} dias)`,       value: dashRaw.ortopedia_espera_dias, max: 250, color: WARN },
                    { label: `Oncologia (${dashRaw.oncologia_espera_dias} dias)`,       value: dashRaw.oncologia_espera_dias, max: 250, color: WARN },
                  ].map((b: any) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="text-xs text-slate-400">meta: 30d</span>
                      </div>
                      <ProgressBar value={b.value} max={b.max} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>8 óbitos enquanto aguardavam especialidade em 2025</b> — 3 por cardiologia (IAM/AVC), 2 por neurologia, 2 por oncologia, 1 por psiquiatria (suicídio). Todos potencialmente evitáveis com acesso oportuno.</p>
                <p><b>Custo de TFD: R$ 2,84M/ano = 28,4% do orçamento</b> — 1 cardiologista fixo custa R$ 216k/ano e elimina R$ 240k em TFDs de cardiologia. ROI positivo em 12 meses.</p>
                <p><b>Telemedicina: apenas 28 teleconsultas em 2025</b> vs potencial de 500/ano. Economia de R$ 795k/ano com investimento de R$ 48.000 em equipamento e treinamento.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "especialidades" && Array.isArray(especialidades) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Fila vs Meta — por Especialidade</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={(especialidades as any[])} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="especialidade" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="fila"        name="Na fila"       fill={CRIT} radius={[0,3,3,0]} />
                  <Bar dataKey="espera_dias" name="Espera (dias)" fill={WARN} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(especialidades as any[]).map((e: any) => (
                <div key={e.especialidade} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(e.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{e.especialidade}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <span className="font-bold" style={{ color: CRIT }}>{e.fila} na fila</span>
                      {" · "}
                      <span style={{ color: statusColor(e.status) }}>{e.espera_dias}d espera (meta {e.meta_dias}d)</span>
                      {e.mortes_na_fila_2025 > 0 && <span className="ml-1 text-red-700 font-bold">· {e.mortes_na_fila_2025} óbito(s)</span>}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{e.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "destinos" && Array.isArray(destinos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">TFD por Destino — Volume e Custo Anual</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={(destinos as any[])} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis dataKey="destino" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tfd_ano" name="TFDs/ano" fill={ACCENT} radius={[4,4,0,0]}>
                    {(destinos as any[]).map((d: any, i: number) => (
                      <Cell key={i} fill={statusColor(d.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(destinos as any[]).map((d: any) => (
                <div key={d.destino} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(d.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{d.destino}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <span className="font-bold text-slate-700">{d.tfd_ano} TFDs</span>
                      {" · "}
                      <span style={{ color: CRIT }}>{BRL(d.custo_total_ano)}/ano</span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 ml-5 mb-1">{d.especialidades_principais}</p>
                  <p className="text-xs text-slate-500 ml-5">{d.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução TFD — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="tfd_total"        name="TFD total/ano"       stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="fila_espera"       name="Fila de espera"      stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="tempo_medio_dias"  name="Espera média (dias)" stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
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
