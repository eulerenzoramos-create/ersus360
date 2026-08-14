import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Droplets, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function AguaSaneamentoApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["agua-dashboard"],  queryFn: () => apiGet("/api/agua-saneamento-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: cobertura }   = useQuery({ queryKey: ["agua-cobertura"],  queryFn: () => apiGet("/api/agua-saneamento-apui/cobertura"),  enabled: aba === "cobertura" });
  const { data: doencas }     = useQuery({ queryKey: ["agua-doencas"],    queryFn: () => apiGet("/api/agua-saneamento-apui/doencas"),    enabled: aba === "doencas" });
  const { data: historico }   = useQuery({ queryKey: ["agua-hist"],       queryFn: () => apiGet("/api/agua-saneamento-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["agua-ind"],        queryFn: () => apiGet("/api/agua-saneamento-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",  icon: <Droplets size={15}/> },
    { key: "cobertura",  label: "Cobertura",  icon: <Activity size={15}/> },
    { key: "doencas",    label: "Doenças",    icon: <AlertTriangle size={15}/> },
    { key: "historico",  label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Droplets size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Água e Saneamento — Apuí/AM</h1>
            <p className="text-sm text-slate-500">VIGIAGUA · Doenças Hídricas · Saneamento Rural · FMS Apuí/AM</p>
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
              <KPI label="Água tratada (%)"         value={`${dashRaw.abastecimento_agua_tratada_pct}%`}   color={CRIT} sub={`meta: ${dashRaw.meta_agua_tratada_pct}%`} />
              <KPI label="Esgotamento sanit. (%)"   value={`${dashRaw.esgotamento_sanitario_pct}%`}        color={CRIT} sub={`meta: ${dashRaw.meta_esgotamento_pct}%`} />
              <KPI label="Doenças diarreicas/100k"  value={`${dashRaw.doencas_diarreicas_incidencia_100k}`} color={CRIT} sub="vs média BR: 420/100k" />
              <KPI label="Lixão a céu aberto"       value={dashRaw.lixao_ceu_aberto ? "Sim" : "Não"}       color={CRIT} sub={`${dashRaw.lixao_distancia_manancial_km}km do manancial`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Água tratada — rural"      value={`${dashRaw.abastecimento_rural_agua_tratada_pct}%`}  color={CRIT} sub="zona rural" />
              <KPI label="Fossa rudimentar (%)"      value={`${dashRaw.domicilios_fossa_rudimentar_pct}%`}       color={CRIT} sub="dos domicílios" />
              <KPI label="Amostras irregulares"      value={`${dashRaw.qualidade_agua_irregular_amostras_pct}%`} color={CRIT} sub={`meta: ${dashRaw.meta_agua_irregular_pct}%`} />
              <KPI label="VIGIAGUA — cobertura"      value={`${dashRaw.vigagua_pontos_monitorados}/${dashRaw.vigagua_pontos_total}`} color={WARN} sub="pontos monitorados" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cobertura por Tipo de Serviço</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Água tratada — urbano (meta 100%)",  value: dashRaw.abastecimento_urbano_agua_tratada_pct, color: WARN, display: `${dashRaw.abastecimento_urbano_agua_tratada_pct}%` },
                    { label: "Água tratada — rural (meta 100%)",   value: dashRaw.abastecimento_rural_agua_tratada_pct,  color: CRIT, display: `${dashRaw.abastecimento_rural_agua_tratada_pct}%` },
                    { label: "Esgotamento sanitário (meta 90%)",   value: dashRaw.esgotamento_sanitario_pct,             color: CRIT, display: `${dashRaw.esgotamento_sanitario_pct}%` },
                    { label: "Coleta de lixo (meta 100%)",         value: dashRaw.coleta_lixo_pct,                       color: CRIT, display: `${dashRaw.coleta_lixo_pct}%` },
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
                <p><b>6.400 pessoas sem água tratada na zona rural</b> — igarapés e poços rasos sem tratamento. Doenças diarreicas 6,8x a média nacional: crianças &lt; 5 anos respondem por 42% dos casos. Cada R$ 1 em saneamento poupa R$ 4 em saúde — Apuí investe zero em saneamento rural.</p>
                <p><b>Lixão a 800m de manancial</b> — prazo PNRS vencido há 11 anos. Roedores do lixão: leptospirose (3 casos em 2025, alta de 50%). Projeto de aterro sanitário aprovado, obra nunca iniciada.</p>
                <p><b>64,2% dos domicílios com fossa rudimentar</b> — igarapés usados para consumo, banho, pesca e destino de dejetos simultaneamente. 28,4% das amostras d'água irregulares com coliformes fecais.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "cobertura" && Array.isArray(cobertura) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Cobertura por Zona (%) — 2025</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={cobertura as any[]} margin={{ left: 0, right: 10 }}>
                  <XAxis dataKey="zona" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="agua_tratada_pct"  name="Água tratada (%)"  fill={BRAND}  radius={[3,3,0,0]} />
                  <Bar dataKey="esgoto_pct"         name="Esgotamento (%)"  fill={WARN}   radius={[3,3,0,0]} />
                  <Bar dataKey="coleta_lixo_pct"    name="Coleta lixo (%)"  fill={ACCENT} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(cobertura as any[]).map((z: any) => (
                <div key={z.zona} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(z.status) }} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-700">{z.zona}</p>
                    <p className="text-xs text-slate-400">Pop.: {z.populacao?.toLocaleString("pt-BR")}</p>
                  </div>
                  <div className="text-right text-xs space-y-0.5">
                    <p>Água: <b style={{ color: statusColor(z.agua_tratada_pct < 50 ? "critico" : "atencao") }}>{z.agua_tratada_pct}%</b></p>
                    <p>Esgoto: <b style={{ color: statusColor(z.esgoto_pct < 20 ? "critico" : "atencao") }}>{z.esgoto_pct}%</b></p>
                    <p>Lixo: <b style={{ color: statusColor(z.coleta_lixo_pct < 30 ? "critico" : "atencao") }}>{z.coleta_lixo_pct}%</b></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "doencas" && Array.isArray(doencas) && (
          <div className="grid gap-3">
            {(doencas as any[]).map((d: any) => (
              <div key={d.doenca} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(d.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{d.doenca}</p>
                  </div>
                  <div className="text-right text-sm">
                    {d.casos_ano != null && <span className="font-bold" style={{ color: statusColor(d.status) }}>{d.casos_ano} casos/ano</span>}
                    {d.hospitalizacoes != null && <p className="text-xs text-slate-400">{d.hospitalizacoes} hospitalizações</p>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5"><b>Nexo:</b> {d.nexo}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Água e Saneamento (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="agua_tratada_pct"        name="Água tratada (%)"         stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="esgoto_pct"               name="Esgotamento (%)"          stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="qualidade_irregular_pct" name="Amostras irregulares (%)" stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
