import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { UserCheck, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function SaudeIdosoApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["idoso-dash"],  queryFn: () => apiGet("/api/saude-idoso-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: condicoes }   = useQuery({ queryKey: ["idoso-cond"],  queryFn: () => apiGet("/api/saude-idoso-apui/condicoes"),   enabled: aba === "condicoes" });
  const { data: acoes }       = useQuery({ queryKey: ["idoso-acao"],  queryFn: () => apiGet("/api/saude-idoso-apui/acoes"),       enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["idoso-hist"],  queryFn: () => apiGet("/api/saude-idoso-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["idoso-ind"],   queryFn: () => apiGet("/api/saude-idoso-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",   icon: <UserCheck size={15}/> },
    { key: "condicoes",   label: "Condições",   icon: <Activity size={15}/> },
    { key: "acoes",       label: "Ações",       icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",   icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <UserCheck size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde do Idoso — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Quedas · Demência · Polifarmácia · Funcionalidade · Vacinação · Caderneta do Idoso · FMS Apuí/AM</p>
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
              <KPI label="Idosos 60+ em Apuí"              value={(dashRaw.idosos_60_mais||0).toLocaleString()}     color={BRAND} sub={`${dashRaw.idosos_pct_populacao}% da pop. · 80+: ${dashRaw.idosos_80_mais}`} />
              <KPI label="Quedas em idosos 2025"           value={(dashRaw.queda_idoso_2025||0).toLocaleString()}   color={CRIT}  sub={`${dashRaw.fratura_quadril_2025} fraturas de quadril · mortalidade ${dashRaw.obito_fratura_quadril_1ano_pct}% em 1a`} />
              <KPI label="Demência diagnosticada / estimada" value={`${dashRaw.demencia_diagnosticados} / ${dashRaw.demencia_estimados}`} color={CRIT} sub={`${dashRaw.demencia_diagnostico_pct}% diagnosticados · CAPS Idoso: ${dashRaw.caps_idoso_apui ? "SIM" : "NÃO"}`} />
              <KPI label="Polifarmácia ≥ 5 medicamentos"  value={`${dashRaw.polifarmacia_5mais_pct}%`}             color={CRIT}  sub={`meta < ${dashRaw.meta_polifarmacia_pct}% · ${dashRaw.internacao_ram_2025} internações por RAM 2025`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Caderneta do Idoso (meta: 100%)" value={`${dashRaw.caderneta_idoso_apui_pct}%`}           color={CRIT}  sub="MS distribui gratuitamente — 28,4% preenchidas" />
              <KPI label="Influenza em idosos (meta: 90%)" value={`${dashRaw.influenza_idoso_pct}%`}                color={WARN}  sub={`pneumococo: ${dashRaw.pneumococo_idoso_pct}% (meta 90%)`} />
              <KPI label="Avaliação de risco de queda"     value={`${dashRaw.avaliacao_risco_queda_pct}%`}          color={CRIT}  sub="Escala de Morse · meta 100% — programa Otago: -40% quedas" />
              <KPI label="Geriatra em Apuí"                value={`${dashRaw.geriatra_apui} médico(s)`}             color={CRIT}  sub="Tele-geriatria TELESSAÚDE-AM: resultado em 10 dias" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Fragilidades — Idosos em Apuí (2025)</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Polifarmácia ≥ 5 med.",    val: dashRaw.polifarmacia_5mais_pct, meta: 20  },
                    { label: "Dependência AVD",           val: dashRaw.idoso_dependente_avd_pct, meta: 10 },
                    { label: "Influenza vacinados",       val: dashRaw.influenza_idoso_pct, meta: 90   },
                    { label: "Pneumococo vacinados",      val: dashRaw.pneumococo_idoso_pct, meta: 90  },
                    { label: "Caderneta preenchida",      val: dashRaw.caderneta_idoso_apui_pct, meta: 100 },
                    { label: "Avaliação risco queda",     val: dashRaw.avaliacao_risco_queda_pct, meta: 100 },
                  ].map((f: any) => (
                    <div key={f.label} className="flex items-center gap-2">
                      <span className="text-slate-600 w-36 text-xs">{f.label}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: `${Math.min(f.val, 100)}%`, background: f.val >= f.meta * 0.8 ? OK : CRIT }} />
                      </div>
                      <span className="font-bold text-xs" style={{ color: f.val >= f.meta * 0.8 ? OK : CRIT }}>{f.val}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>28 fraturas de quadril em 2025</b> — mortalidade em 1 ano: 28,4% (8 óbitos). Custo: R$ 42.000/caso × 28 = R$ 1,176M. Programa Otago (fisioterapeuta): -40% quedas. Vitamina D 1.000 UI (R$ 0,28/cáps, REMUME): -22% quedas. Avaliação de risco de Morse: 18,4% dos idosos (meta 100%).</p>
                <p><b>342 casos estimados de demência — 84 diagnosticados (24,6%)</b>. MMSE: 10 min, gratuito. Donepezila: REMUME disponível. Grupo de apoio a cuidadores: R$ 4.200/ano. 1 cuidador em burnout: institucionalização = R$ 84.000/ano.</p>
                <p><b>42,4% em polifarmácia</b> (≥ 5 medicamentos). 28 internações por RAM/ano = R$ 420.000. Critérios de Beers: deprescrição (BZD + AINE + anticolinérgico). ILPI: zero em Apuí — 142 idosos com dependência severa sem suporte formal.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "condicoes" && Array.isArray(condicoes) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={condicoes as any[]} margin={{ top: 5, right: 20, bottom: 80, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="condicao" tick={{ fontSize: 8 }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="casos_2025"         name="Casos 2025"          radius={[4,4,0,0]}>
                  {(condicoes as any[]).map((c: any, i: number) => <Cell key={i} fill={statusColor(c.status)} />)}
                </Bar>
                <Bar dataKey="obitos_relacionados" name="Óbitos relacionados" radius={[4,4,0,0]} fill={CRIT} opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(condicoes as any[]).map((c: any) => (
                <div key={c.condicao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(c.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{c.condicao}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: statusColor(c.status) }}>{c.casos_2025} casos</span>
                      <p className="text-slate-400 mt-0.5">{c.obitos_relacionados} óbitos · R$ {(c.custo_estimado||0).toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{c.observacao}</p>
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
                  <div className="text-right text-xs">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${a.implementada ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {a.implementada ? "Implementada" : "Não implementada"}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">R$ {(a.custo||0).toLocaleString()} · {a.prazo_meses}m</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Saúde do Idoso — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left"  tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="queda"           name="Quedas"              stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="fratura_quadril" name="Fraturas quadril"    stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="left"  dataKey="demencia_diag"   name="Demência diagnos."   stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
                <Line yAxisId="right" dataKey="polifarmacia_pct" name="Polifarmácia (%)"   stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="6 2" />
                <Line yAxisId="right" dataKey="influenza_pct"   name="Influenza vacinados (%)" stroke={OK} strokeWidth={2} dot={{ r: 4 }} />
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
