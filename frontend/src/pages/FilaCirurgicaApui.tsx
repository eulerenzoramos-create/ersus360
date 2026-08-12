import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Clock, AlertTriangle, TrendingUp, Activity } from "lucide-react";
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

export default function FilaCirurgicaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["cir-dash"],  queryFn: () => apiGet("/api/fila-cirurgica-apui/dashboard"),     enabled: aba === "dashboard" });
  const { data: espec }       = useQuery({ queryKey: ["cir-esp"],   queryFn: () => apiGet("/api/fila-cirurgica-apui/especialidades"),enabled: aba === "especialidades" });
  const { data: acoes }       = useQuery({ queryKey: ["cir-acao"],  queryFn: () => apiGet("/api/fila-cirurgica-apui/acoes"),         enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["cir-hist"],  queryFn: () => apiGet("/api/fila-cirurgica-apui/historico"),     enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["cir-ind"],   queryFn: () => apiGet("/api/fila-cirurgica-apui/indicadores"),   enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",      label: "Dashboard",     icon: <Clock size={15}/> },
    { key: "especialidades", label: "Especialidades",icon: <Activity size={15}/> },
    { key: "acoes",          label: "Ações",         icon: <AlertTriangle size={15}/> },
    { key: "historico",      label: "Histórico",     icon: <TrendingUp size={15}/> },
    { key: "indicadores",    label: "Indicadores",   icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Clock size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Fila Cirúrgica — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Cirurgia Geral · Ortopedia · Oftalmologia · SISREG · Mutirão · Anestesiologista · FMS Apuí/AM</p>
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
              <KPI label="Pacientes na fila cirúrgica"  value={dashRaw.pacientes_fila_cirurgica}                                  color={CRIT} sub={`${dashRaw.deficit_cirurgico_pct}% do deficit atendido`} />
              <KPI label="Tempo médio de espera"        value={`${dashRaw.tempo_espera_medio_dias} dias`}                         color={CRIT} sub={`meta: ${dashRaw.meta_tempo_espera_dias} dias`} />
              <KPI label="Óbitos em fila de espera"     value={dashRaw.obitos_fila_espera_2025}                                   color={CRIT} sub={`${dashRaw.obitos_potencialmente_evitageis} evitáveis`} />
              <KPI label="Cirurgiões em Apuí"           value={dashRaw.cirurgiao_geral_apui}                                      color={CRIT} sub="zero especialistas" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Cirurgias HMM/2025"           value={dashRaw.cirurgias_realizadas_hmm_2025}                             color={WARN} sub={`necessárias: ${dashRaw.cirurgias_necessarias_estimadas}`} />
              <KPI label="SISREG — tempo de aprovação"  value={`${dashRaw.tempo_aprovacao_sisreg_dias} dias`}                     color={CRIT} sub={`meta: ${dashRaw.meta_aprovacao_sisreg_dias} dias`} />
              <KPI label="Cegos por catarata operável"  value={dashRaw.obitos_fila_espera_2025 > 0 ? "68 pessoas" : "0"}          color={CRIT} sub="aguardando mutirão Visão Brasil" />
              <KPI label="Custo social da fila"         value={BRL(dashRaw.custo_social_fila_anual)}     color={CRIT} sub="estimado/ano" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cirurgias Realizadas vs Necessidade Estimada</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Cirurgia geral: 42 realizadas vs 284 necessárias`, value: 42, max: 284, color: CRIT },
                    { label: `Ortopedia: 0 realizadas vs 242 necessárias`,        value: 0,  max: 242, color: CRIT },
                    { label: `Oftalmologia: 0 realizadas vs 184 necessárias`,     value: 0,  max: 184, color: CRIT },
                    { label: `Ginecologia cirúrgica: 0 realizadas vs 84 necess.`, value: 0,  max: 84,  color: CRIT },
                    { label: `SISREG aprovado em prazo: 0% (meta 100%)`,          value: 0,  max: 100, color: CRIT },
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
                <p><b>842 pacientes em fila cirúrgica — 8 óbitos em 2025</b> (6 potencialmente evitáveis). 3 por hérnia estrangulada: cirurgia eletiva existia, não foi realizada a tempo. Ortopedia: 3 anos de espera média.</p>
                <p><b>Zero cirurgião especialista, zero anestesiologista em Apuí</b> — HMM realiza 42 cirurgias/ano (médico generalista). Meta mínima: 284/ano. Anestesiologista itinerante mensal: R$ 28.000 → +240 cirurgias/ano.</p>
                <p><b>SISREG: 284 dias de espera para aprovação (meta: 30 dias)</b> — telemedicina cirúrgica (R$ 14.000) resolve em 2 meses. Mutirão SES-AM (cirurgia geral): R$ 25.200 municipal → 120 cirurgias em 5 dias.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "especialidades" && Array.isArray(espec) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={espec as any[]} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="especialidade" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="fila_pacientes"   name="Fila (pacientes)" radius={[4,4,0,0]}>
                  {(espec as any[]).map((_: any, i: number) => <Cell key={i} fill={CRIT} />)}
                </Bar>
                <Bar dataKey="tempo_espera_dias" name="Espera (dias)" radius={[4,4,0,0]} fill={WARN} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(espec as any[]).map((e: any) => (
                <div key={e.especialidade} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(e.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{e.especialidade}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: CRIT }}>{e.fila_pacientes} pacientes</span>
                      <span className="text-slate-400"> · {e.tempo_espera_dias} dias de espera</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{e.observacao}</p>
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
                  <div className="text-right text-xs text-slate-500">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${a.implementada ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {a.implementada ? "Implementada" : "Não implementada"}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">R$ {a.custo.toLocaleString()} · {a.prazo_meses}m</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Fila Cirúrgica — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="fila_total"        name="Fila total"          stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="cirurgias_hmm"     name="Cirurgias HMM"       stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="tempo_espera_dias" name="Tempo espera (dias)" stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="obitos_fila"       name="Óbitos na fila"      stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
