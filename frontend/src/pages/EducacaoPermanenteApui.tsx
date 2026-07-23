import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { BookOpen, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function EducacaoPermanenteApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["ep-dash"],  queryFn: () => apiGet("/api/educacao-permanente-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: programas }   = useQuery({ queryKey: ["ep-prog"],  queryFn: () => apiGet("/api/educacao-permanente-apui/programas"),  enabled: aba === "programas" });
  const { data: acoes }       = useQuery({ queryKey: ["ep-acao"],  queryFn: () => apiGet("/api/educacao-permanente-apui/acoes"),      enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["ep-hist"],  queryFn: () => apiGet("/api/educacao-permanente-apui/historico"), enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["ep-ind"],   queryFn: () => apiGet("/api/educacao-permanente-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <BookOpen size={15}/> },
    { key: "programas",   label: "Programas",  icon: <Activity size={15}/> },
    { key: "acoes",       label: "Ações",      icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <BookOpen size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Educação Permanente em Saúde — Apuí/AM</h1>
            <p className="text-sm text-slate-500">UNA-SUS · Residência MFC · TELESSAÚDE-AM · Humanização PNH · Plano EPS · PNEPS · FMS Apuí/AM</p>
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
              <KPI label="Profissionais capacitados (meta: 100%/ano)" value={`${dashRaw.capacitados_pct}%`}                 color={CRIT} sub={`${dashRaw.profissionais_capacitados_2025} de ${dashRaw.profissionais_saude_total} profissionais`} />
              <KPI label="Horas de EP/profissional (meta: 40h/ano)"   value={`${dashRaw.horas_educacao_permanente_media}h`} color={CRIT} sub={`meta ${dashRaw.meta_horas_ep_ano}h · UNA-SUS: ${dashRaw.curso_unasus_matriculados} matriculados`} />
              <KPI label="Plano Municipal EPS (meta: elaborado)"       value={dashRaw.plano_eps_2025 ? "Elaborado" : "Ausente"} color={CRIT} sub="PNEPS 2004 obrigatório · COSEMS-AM apoia" />
              <KPI label="Residência MFC em Apuí"                     value={dashRaw.medico_residente_apui > 0 ? `${dashRaw.medico_residente_apui} resid.` : "Ausente"} color={CRIT} sub="UFAM + SES-AM: R$ 84.000/ano · fidelização pós-residência" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Tele-consultoria/mês (meta: 100)"          value={`${dashRaw.telessaude_teleconsultoria_mes}/mês`}    color={CRIT} sub="TELESSAÚDE-AM gratuito · +webinários quinzenais" />
              <KPI label="Acolhimento treinado (meta: 100%)"         value={`${dashRaw.acolhimento_treinado_pct}%`}             color={CRIT} sub="PNH: -40% encaminhamentos + -28% tempo espera" />
              <KPI label="ACS capacitados SISAB (meta: 100%)"        value={`${dashRaw.acs_capacitado_sisab_pct}%`}             color={CRIT} sub={`${dashRaw.acs_total} ACS total · SISAB: base do PREVINE Brasil`} />
              <KPI label="Verba EPS planejada 2025"                  value={`R$ ${(dashRaw.verba_eps_planejada_2025||0).toLocaleString()}`} color={CRIT} sub={`meta R$ ${(dashRaw.meta_verba_eps||0).toLocaleString()} = R$ 296/profissional/ano`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Educação Permanente — Apuí/AM 2025</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Profissionais capacitados", val: dashRaw.capacitados_pct,       meta: 100 },
                    { label: "Horas EP (% da meta 40h)", val: (dashRaw.horas_educacao_permanente_media / 40 * 100).toFixed(1), meta: 100 },
                    { label: "UNA-SUS matriculados",     val: ((dashRaw.curso_unasus_matriculados || 0) / 284 * 100).toFixed(1), meta: 80 },
                    { label: "Tele-consultoria (% meta 100/mês)", val: dashRaw.telessaude_teleconsultoria_mes, meta: 100 },
                    { label: "Acolhimento treinado",     val: dashRaw.acolhimento_treinado_pct, meta: 100 },
                    { label: "ACS capacitados SISAB",    val: dashRaw.acs_capacitado_sisab_pct, meta: 100 },
                  ].map((f: any) => (
                    <div key={f.label} className="flex items-center gap-2">
                      <span className="text-slate-600 w-44 text-xs">{f.label}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: `${Math.min(Number(f.val), 100)}%`, background: Number(f.val) >= f.meta * 0.8 ? OK : CRIT }} />
                      </div>
                      <span className="font-bold text-xs" style={{ color: Number(f.val) >= f.meta * 0.8 ? OK : CRIT }}>{f.val}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>29,6% dos profissionais capacitados</b> (meta 100%). Horas de EP: 4,2h/profissional/ano (meta 40h). Plano EPS Municipal: zero. PNEPS 2004 obrigatório. COSEMS-AM apoia elaboração. Verba EPS: R$ 0 planejada (meta R$ 84.000 = R$ 296/profissional). UNA-SUS: 28 matriculados de 284 (meta 80%).</p>
                <p><b>TELESSAÚDE-AM: 18 consultoria/mês</b> (meta 100). Webinários quinzenais gratuitos: 84 participantes 2025. 1 webinário quinzenal = 24h tele-educação/ano. UNA-SUS: 60 cursos gratuitos, 40h/profissional/ano. Acolhimento treinado: 28,4% (meta 100%) — PNH: -40% encaminhamentos. Custo: R$ 0.</p>
                <p><b>Zero médico residente em Apuí</b>. Residência MFC: R$ 84.000/ano (UFAM + SES-AM). Internato rural: 2 estagiários 2025 — formalizar permanência pós-formatura. ACS capacitados SISAB: 42,4% (meta 100%). SISAB: base do PREVINE Brasil — ACS não capacitado = dado errado = menos recurso.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "programas" && Array.isArray(programas) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={programas as any[]} margin={{ top: 5, right: 20, bottom: 80, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="programa" tick={{ fontSize: 8 }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="beneficiarios" name="Beneficiários atuais" radius={[4,4,0,0]}>
                  {(programas as any[]).map((p: any, i: number) => <Cell key={i} fill={p.status === "ausente" ? CRIT : p.status === "parcial" ? WARN : OK} />)}
                </Bar>
                <Bar dataKey="meta"          name="Meta"                radius={[4,4,0,0]} fill={ACCENT} opacity={0.3} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(programas as any[]).map((p: any) => (
                <div key={p.programa} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: p.status === "ausente" ? CRIT : p.status === "parcial" ? WARN : OK }} />
                      <p className="font-semibold text-sm text-slate-700">{p.programa}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.status === "ausente" ? "bg-red-100 text-red-700" : p.status === "parcial" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                        {p.status === "ausente" ? "Ausente" : p.status === "parcial" ? "Parcial" : "Ativo"}
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">{p.beneficiarios} / meta {p.meta} · R$ {(p.custo||0).toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{p.descricao}</p>
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
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Educação Permanente — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left"  tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="capacitados_pct"     name="Capacitados (%)"        stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" dataKey="horas_ep"            name="Horas EP/profis."        stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="right" dataKey="unasus_matriculados" name="UNA-SUS matriculados"    stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
                <Line yAxisId="right" dataKey="webinarios"          name="Participantes webinário" stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
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
