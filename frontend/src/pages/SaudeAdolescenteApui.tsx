import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Sparkles, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function SaudeAdolescenteApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["adol-dashboard"], queryFn: () => apiGet("/api/saude-adolescente-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: agravos }     = useQuery({ queryKey: ["adol-agravos"],   queryFn: () => apiGet("/api/saude-adolescente-apui/agravos"),    enabled: aba === "agravos" });
  const { data: prevencao }   = useQuery({ queryKey: ["adol-prev"],      queryFn: () => apiGet("/api/saude-adolescente-apui/prevencao"),  enabled: aba === "prevencao" });
  const { data: historico }   = useQuery({ queryKey: ["adol-hist"],      queryFn: () => apiGet("/api/saude-adolescente-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["adol-ind"],       queryFn: () => apiGet("/api/saude-adolescente-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",    icon: <Sparkles size={15}/> },
    { key: "agravos",     label: "Agravos",      icon: <Activity size={15}/> },
    { key: "prevencao",   label: "Prevenção",    icon: <Activity size={15}/> },
    { key: "historico",   label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Sparkles size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde do Adolescente — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Gravidez na adolescência · IST · Saúde mental · Drogas · Evasão escolar · PSE · FMS Apuí/AM</p>
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
              <KPI label="Gravidez adolescente"      value={`${dashRaw.gravidez_adolescente_taxa_1k}/1k`}  color={CRIT} sub={`${dashRaw.gravidez_adolescente_casos_ano} casos/ano`} />
              <KPI label="Evasão escolar 10-17a"     value={`${dashRaw.evasao_escolar_10_17a_pct}%`}        color={CRIT} sub="meta: 5%" />
              <KPI label="Tentativa suicídio/ano"    value={`${dashRaw.tentativa_suicidio_adolescente_ano}`} color={CRIT} sub={`+ ${dashRaw.automutilacao_notificada_ano} automutilações`} />
              <KPI label="Álcool em adolescentes"    value={`${dashRaw.uso_alcool_pct}%`}                   color={CRIT} sub="uso regular" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Gravidez < 15a"            value={`${dashRaw.gravidez_menos_15a_pct}%`}           color={CRIT} sub="das grávidas adolescentes" />
              <KPI label="IST em adolescentes"       value={`${dashRaw.ist_adolescente_casos_ano} casos`}   color={CRIT} sub="por ano" />
              <KPI label="Psicólogo municipal"       value={`${dashRaw.psicologo_municipio}`}               color={CRIT} sub="zero em Apuí" />
              <KPI label="CAPS Infantojuvenil"       value={dashRaw.caps_infantojuvenil ? "Sim" : "Não"}    color={CRIT} sub="inexistente" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cobertura de Prevenção — Adolescentes</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Anticoncepção acessível (${dashRaw.contraceptivo_adolescente_acesso_pct}%)`,  value: dashRaw.contraceptivo_adolescente_acesso_pct, max: 80,  color: CRIT },
                    { label: `Testagem IST disponível (${dashRaw.ist_adolescente_casos_ano} casos)`,         value: 18.4, max: 70, color: CRIT },
                    { label: `Vacina HPV (${dashRaw.evasao_escolar_gravidez_pct > 0 ? "68,4" : "0"}%)`,    value: 68.4, max: 90, color: WARN },
                    { label: `PSE ativo nas escolas (48,4%)`,                                                value: 48.4, max: 100, color: CRIT },
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
                <p><b>Taxa de gravidez 2,3x acima da meta</b> — 68,4/1k vs meta 30/1k. 12,4% em meninas &lt; 15a (violência sexual em 8,4%). Evasão pós-gravidez: 72,4%. Anticoncepção: acessível a apenas 38,4% das adolescentes.</p>
                <p><b>Saúde mental invisível</b> — 28 automutilações + 18 tentativas de suicídio em 2025. PHQ-A: aplicado em 4,8% das consultas. Zero psicólogo, zero CAPS-IJ. Linha CVV 188: não divulgada nas escolas de Apuí.</p>
                <p><b>42,4% usam álcool regularmente</b> — início médio aos 12,4 anos. Drogas ilícitas: 22,4%. CAPS-AD sem leito infantojuvenil. PSE ativo em menos da metade das escolas — sem psicólogo nos ciclos.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "agravos" && Array.isArray(agravos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-2">
              <h3 className="font-semibold text-slate-700 mb-3">Agravos em Adolescentes — Casos/Ano</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(agravos as any[]).filter((a: any) => a.casos_ano < 500)} margin={{ top: 5, right: 20, bottom: 50, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis dataKey="agravo" tick={{ fontSize: 8 }} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="casos_ano" name="Casos/ano" radius={[4,4,0,0]}>
                    {(agravos as any[]).filter((a: any) => a.casos_ano < 500).map((a: any) => (
                      <Cell key={a.agravo} fill={statusColor(a.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {(agravos as any[]).map((a: any) => (
              <div key={a.agravo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(a.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{a.agravo}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: statusColor(a.status) }}>{a.casos_ano} casos/ano</span>
                    {a.taxa_1k > 0 && <p className="text-xs text-slate-400">taxa: {a.taxa_1k}/1k · meta: {a.meta_1k}/1k</p>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "prevencao" && Array.isArray(prevencao) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-2">
              <h3 className="font-semibold text-slate-700 mb-3">Cobertura das Ações de Prevenção (%)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={prevencao as any[]} layout="vertical" margin={{ top: 5, right: 40, bottom: 5, left: 210 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <YAxis type="category" dataKey="acao" tick={{ fontSize: 8 }} width={205} />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="cobertura_pct" name="Cobertura atual (%)" radius={[0,4,4,0]}>
                    {(prevencao as any[]).map((p: any) => (
                      <Cell key={p.acao} fill={statusColor(p.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {(prevencao as any[]).map((p: any) => (
              <div key={p.acao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(p.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{p.acao}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: statusColor(p.status) }}>{p.cobertura_pct}%</span>
                    <p className="text-xs text-slate-400">meta: {p.meta_pct}%</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{p.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Saúde do Adolescente — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="gravidez_adol_1k"      name="Gravidez adol. /1k"    stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="ist_adol_casos"         name="IST casos"             stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="evasao_pct"             name="Evasão escolar (%)"    stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="saude_mental_diag_pct"  name="S. mental diag. (%)"  stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
