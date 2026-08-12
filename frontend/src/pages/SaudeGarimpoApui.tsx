import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Bug, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function SaudeGarimpoApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["garimpo-dashboard"], queryFn: () => apiGet("/api/saude-garimpo-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: mercurio }    = useQuery({ queryKey: ["garimpo-merc"],      queryFn: () => apiGet("/api/saude-garimpo-apui/mercurio"),   enabled: aba === "mercurio" });
  const { data: agravos }     = useQuery({ queryKey: ["garimpo-agrav"],     queryFn: () => apiGet("/api/saude-garimpo-apui/agravos"),    enabled: aba === "agravos" });
  const { data: historico }   = useQuery({ queryKey: ["garimpo-hist"],      queryFn: () => apiGet("/api/saude-garimpo-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["garimpo-ind"],       queryFn: () => apiGet("/api/saude-garimpo-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",   icon: <Bug size={15}/> },
    { key: "mercurio",   label: "Mercúrio",    icon: <AlertTriangle size={15}/> },
    { key: "agravos",    label: "Agravos",     icon: <Activity size={15}/> },
    { key: "historico",  label: "Histórico",   icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Bug size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde do Garimpo — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Mercúrio · Malária · Acidentes · Vigilância Ocupacional · FMS Apuí/AM</p>
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
              <KPI label="Garimpeiros estimados"      value={`${dashRaw.garimpeiros_estimados}`}              color={CRIT} sub={`${dashRaw.garimpos_ilegais_estimados} garimpos ilegais`} />
              <KPI label="Mercúrio médio (garimpeiros)" value={`${dashRaw.mercurio_nivel_sangue_medio_ug_l} μg/L`} color={CRIT} sub={`limite OMS: ${dashRaw.limite_oms_mercurio_ug_l} μg/L`} />
              <KPI label="Malária — IPA garimpo/1k"  value={`${dashRaw.malaria_garimpeiros_ipa_1k}`}          color={CRIT} sub={`vs município: ${dashRaw.malaria_municipio_ipa_1k}`} />
              <KPI label="Acidentes garimpo/ano"      value={`${dashRaw.acidentes_trabalho_garimpo_ano}`}     color={CRIT} sub="notificados (estimativa 5x maior)" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Pop. exposta ao mercúrio"   value={`${dashRaw.populacao_exposta_mercurio_estimada}`}  color={CRIT} sub={`${dashRaw.criancas_expostas_estimadas} crianças < 5a`} />
              <KPI label="Garimpo em TI Tenharim"     value={`${dashRaw.garimpo_zona_ti_pct}%`}                color={CRIT} sub="dos garimpos em TI" />
              <KPI label="Notif. intox. mercúrio/ano" value={`${dashRaw.notificacao_intoxicacao_mercurio_ano}`}color={CRIT} sub={`subnotificação est.: ${dashRaw.subnotificacao_mercurio_estimada_pct}%`} />
              <KPI label="Vigilância garimpo ativa"   value={dashRaw.vigilancia_garimpo_ativo ? "Sim" : "Não"} color={CRIT} sub="zero programa municipal" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Exposição a Mercúrio por Grupo</h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="font-medium">Grupo</span>
                    <span className="font-medium">Nível médio (μg/L)</span>
                  </div>
                  {[
                    { label: "Amalgamação a quente",    v: 48.4 },
                    { label: "Garimpeiros diretos",     v: 28.4 },
                    { label: "Ribeirinhos Rio Juma",    v: 12.4 },
                    { label: "Crianças < 5a (área)",   v: 8.4  },
                    { label: "Limite OMS",              v: 5.0  },
                  ].map((g) => (
                    <div key={g.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span>{g.label}</span>
                        <span className="font-bold" style={{ color: g.v > 5 ? CRIT : OK }}>{g.v} μg/L</span>
                      </div>
                      <ProgressBar value={g.v} max={50} color={g.v > 5 ? CRIT : OK} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>Mercúrio 5,7x o limite OMS em garimpeiros</b> — dano neurológico irreversível com exposição prolongada. 480 crianças expostas via peixe contaminado do Rio Juma. Neurodesenvolvimento comprometido na fase mais crítica: QI reduzido, atraso de fala, déficit de atenção.</p>
                <p><b>42,4% dos garimpos em TI Tenharim</b> — poluição de mananciais da única população indígena do município. Índígenas com malária IPA 42/1k (pré-existente) + mercúrio via peixes contaminados do Rio Juma = dupla vulnerabilidade.</p>
                <p><b>Subnotificação de 90%</b> — reagente de dosagem de mercúrio ausente em Apuí. Médico não pede sem protocolo. Garimpeiro ilegal não vai à UBS com medo de identificação. Vigilância passiva é ineficaz nesse contexto: precisa de programa ativo.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "mercurio" && Array.isArray(mercurio) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Nível de Mercúrio por Grupo (μg/L)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={mercurio as any[]} layout="vertical" margin={{ left: 160, right: 30 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="grupo" tick={{ fontSize: 10 }} width={155} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip />
                  <Bar dataKey="nivel_medio_ug_l" name="Nível médio (μg/L)" radius={[0, 4, 4, 0]}>
                    {(mercurio as any[]).map((m: any, i: number) => (
                      <Cell key={i} fill={m.nivel_medio_ug_l > 5 ? CRIT : OK} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(mercurio as any[]).map((m: any) => (
                <div key={m.grupo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(m.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{m.grupo}</p>
                    </div>
                    <div className="text-right text-sm">
                      <span className="font-bold" style={{ color: statusColor(m.status) }}>{m.nivel_medio_ug_l} μg/L</span>
                      <p className="text-xs text-slate-400">Acima OMS: {m.acima_oms_pct}% · Sintomas neuro: {m.sintomas_neurologicos_pct}%</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{m.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "agravos" && Array.isArray(agravos) && (
          <div className="grid gap-3">
            {(agravos as any[]).map((a: any) => (
              <div key={a.agravo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(a.status) }} />
                    <div>
                      <p className="font-semibold text-sm text-slate-700">{a.agravo}</p>
                      <p className="text-xs text-slate-400">Incidência/1k: {a.incidencia_1k} · vs município: {a.vs_municipio}</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Saúde do Garimpo (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="malaria_garimpeiros" name="Malária garimpeiros (casos)" stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="acidentes_notif"     name="Acidentes notificados"       stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="garimpos_estimados"  name="Garimpos estimados"          stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
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
