import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { FlaskRound, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function HanseniaseApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["han-dash"],  queryFn: () => apiGet("/api/hanseniase-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: formas }      = useQuery({ queryKey: ["han-for"],   queryFn: () => apiGet("/api/hanseniase-apui/formas"),     enabled: aba === "formas" });
  const { data: acoes }       = useQuery({ queryKey: ["han-acao"],  queryFn: () => apiGet("/api/hanseniase-apui/acoes"),      enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["han-hist"],  queryFn: () => apiGet("/api/hanseniase-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["han-ind"],   queryFn: () => apiGet("/api/hanseniase-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <FlaskRound size={15}/> },
    { key: "formas",      label: "Formas",     icon: <Activity size={15}/> },
    { key: "acoes",       label: "Ações",      icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <FlaskRound size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Hanseníase — Apuí/AM</h1>
            <p className="text-sm text-slate-500">PQT · Grau de Incapacidade · Casos em Crianças · Neurite · Tele-dermatologia · FMS Apuí/AM</p>
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
              <KPI label="Detecção hanseníase (meta: 10/100k)" value={`${dashRaw.coeficiente_deteccao_100k_2025}/100k`}  color={CRIT} sub={`${dashRaw.casos_novos_2025} casos novos — ${dashRaw.casos_novos_mb} MB (${dashRaw.casos_novos_mb_pct}%)`} />
              <KPI label="Grau de incapacidade 2 (meta: < 5%)" value={`${dashRaw.grau_incapacidade_2_pct}%`}             color={CRIT} sub={`${Math.round(dashRaw.casos_novos_2025 * dashRaw.grau_incapacidade_2_pct / 100)} casos com deformidade visível`} />
              <KPI label="Casos em crianças < 15a (meta: 0)"   value={`${dashRaw.criancas_casos_novos_2025} casos`}       color={CRIT} sub={`taxa ${dashRaw.taxa_deteccao_criancas_100k}/100k — transmissão ativa domiciliar`} />
              <KPI label="Taxa de cura (meta: ≥ 90%)"          value={`${dashRaw.taxa_cura_pct}%`}                        color={CRIT} sub={`abandono: ${dashRaw.abandono_pct}% (meta < 5%)`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Contatos examinados (meta: 100%)"    value={`${dashRaw.contatos_examinados_pct}%`}              color={CRIT} sub="51,6% dos contatos de MB não examinados" />
              <KPI label="Dermatologista em Apuí"              value={dashRaw.dermatologista_apui === 0 ? "Nenhum" : dashRaw.dermatologista_apui} color={CRIT} sub="tele-dermatologia: diagnóstico em 48h" />
              <KPI label="Casos com neurite"                   value={`${dashRaw.cases_com_neurite_pct}%`}                color={CRIT} sub="emergência: corticoide < 24h ou sequela permanente" />
              <KPI label="PQT disponível (gratuita)"           value={dashRaw.pqt_disponivel ? "Disponível" : "Indisponível"} color={OK} sub="MS fornece gratuitamente" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Desempenho do Programa de Hanseníase — Apuí/AM</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Taxa de cura: ${dashRaw.taxa_cura_pct}% (meta 90%)`,           value: dashRaw.taxa_cura_pct,              max: 90,  color: CRIT },
                    { label: `Contatos examinados: ${dashRaw.contatos_examinados_pct}%`,      value: dashRaw.contatos_examinados_pct,    max: 100, color: CRIT },
                    { label: `Grau 2: ${dashRaw.grau_incapacidade_2_pct}% (meta < 5%)`,      value: 100 - dashRaw.grau_incapacidade_2_pct, max: 100, color: CRIT },
                    { label: `Casos MB: ${dashRaw.casos_novos_mb_pct}% (ideal < 60%)`,       value: 100 - dashRaw.casos_novos_mb_pct,   max: 100, color: CRIT },
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
                <p><b>84,4/100k de detecção</b> — 8,4× a meta OMS (10/100k). 208 casos novos. 80,8% são multibacilar (alta carga endêmica). Busca ativa ACS: R$ 14k + tele-derm R$ 8,4k → detecção precoce = grau 0 = sem incapacidade.</p>
                <p><b>28,4% com grau de incapacidade 2</b> — deformidade visível (garra, pé-caído, lagoftalmo). Reabilitação: R$ 28.400/caso. PQT supervisionada + corticoide na neurite em &lt; 24h: evita toda incapacidade grau 2.</p>
                <p><b>28 crianças com hanseníase</b> (meta OMS: 0). Transmissão ativa intrafamiliar. BCG em contatos &lt; 15a: -50%. Investigação de 100% dos contatos: R$ 14k. Criança com hanseníase = família toda em risco.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "formas" && Array.isArray(formas) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={formas as any[]} margin={{ top: 5, right: 20, bottom: 50, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="forma" tick={{ fontSize: 8 }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="casos_2025"       name="Casos 2025"        radius={[4,4,0,0]}>
                  {(formas as any[]).map((f: any, i: number) => <Cell key={i} fill={statusColor(f.status)} />)}
                </Bar>
                <Bar dataKey="grau_incap_2_pct" name="Grau 2 incap. (%)" radius={[4,4,0,0]} fill={ACCENT} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(formas as any[]).map((f: any) => (
                <div key={f.forma} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(f.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{f.forma}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: statusColor(f.status) }}>{f.casos_2025} casos</span>
                      <span className="text-slate-400"> · grau 2: {f.grau_incap_2_pct}%</span>
                      <p className="text-slate-400 mt-0.5">PQT: {f.tratamento_meses} meses</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{f.observacao}</p>
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
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Hanseníase — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="right" dataKey="casos_novos"        name="Casos novos"            stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" dataKey="casos_criancas"     name="Casos em crianças"      stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="left"  dataKey="grau2_pct"          name="Grau 2 (%)"             stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
                <Line yAxisId="left"  dataKey="cura_pct"           name="Cura (%)"               stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="contatos_exam_pct"  name="Contatos examinados (%)"stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="6 2" />
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
