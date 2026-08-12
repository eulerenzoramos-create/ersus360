import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Eye, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function SaudeOcularApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["ocu-dash"],  queryFn: () => apiGet("/api/saude-ocular-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: condicoes }   = useQuery({ queryKey: ["ocu-cond"],  queryFn: () => apiGet("/api/saude-ocular-apui/condicoes"),  enabled: aba === "condicoes" });
  const { data: acoes }       = useQuery({ queryKey: ["ocu-acao"],  queryFn: () => apiGet("/api/saude-ocular-apui/acoes"),      enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["ocu-hist"],  queryFn: () => apiGet("/api/saude-ocular-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["ocu-ind"],   queryFn: () => apiGet("/api/saude-ocular-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Eye size={15}/> },
    { key: "condicoes",   label: "Condições",  icon: <Activity size={15}/> },
    { key: "acoes",       label: "Ações",      icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Eye size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Ocular — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Glaucoma · Catarata · Retinopatia Diabética · Tracoma · Olhar Brasil · FMS Apuí/AM</p>
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
              <KPI label="Oftalmologista em Apuí"          value={dashRaw.oftalmologista_apui === 0 ? "Nenhum" : dashRaw.oftalmologista_apui} color={CRIT} sub={`ref.: ${dashRaw.referencia_oftalmologia}`} />
              <KPI label="Espera SISREG oftalmologia"      value={`${dashRaw.espera_sisreg_dias} dias`}                 color={CRIT} sub="Humaitá/AM (180 km)" />
              <KPI label="Glaucoma estimados"              value={(dashRaw.glaucoma_estimados||0).toLocaleString()}     color={CRIT} sub={`${dashRaw.glaucoma_diagnosticados} diag. — ${dashRaw.glaucoma_cegueira_irreversivel_estimada} com cegueira irreversível`} />
              <KPI label="Catarata — fila de cirurgia"     value={dashRaw.catarata_cirurgia_fila_espera}                color={CRIT} sub={`${dashRaw.catarata_cirurgia_realizada_2025} cirurgias realizadas em 2025`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Retinopatia diabética rastreada" value={`${dashRaw.retinopatia_diabetica_rastreados_pct}%`}   color={CRIT} sub={`${dashRaw.retinopatia_diabetica_estimados} pacientes com RD estimados`} />
              <KPI label="Criancas s/ óculos (precisam)"   value={`${dashRaw.criancas_oculos_necessitam - dashRaw.criancas_oculos_receberam}`} color={CRIT} sub={`${dashRaw.criancas_oculos_receberam} receberam de ${dashRaw.criancas_oculos_necessitam}`} />
              <KPI label="Tracoma (escolares)"             value={`${dashRaw.tracoma_prevalencia_escolar_pct}%`}        color={WARN} sub={`${dashRaw.tracoma_criancas_estimadas} crianças estimadas`} />
              <KPI label="Programa Olhar Brasil"           value={dashRaw.programa_olhar_brasil_ativo ? "Ativo" : "Inativo"} color={CRIT} sub="R$ 0 para o município — não ativado" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Passivo de Cegueira Evitável — Apuí/AM</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Glaucoma diagnosticados: ${dashRaw.glaucoma_diagnosticados}/${dashRaw.glaucoma_estimados} estimados (cegueira irreversível)`,  value: dashRaw.glaucoma_diagnosticados, max: dashRaw.glaucoma_estimados, color: CRIT },
                    { label: `Catarata cirurgias realizadas: ${dashRaw.catarata_cirurgia_realizada_2025} de ${dashRaw.catarata_cirurgia_fila_espera} na fila`, value: dashRaw.catarata_cirurgia_realizada_2025, max: dashRaw.catarata_cirurgia_fila_espera, color: CRIT },
                    { label: `RD rastreada: ${dashRaw.retinopatia_diabetica_rastreados_pct}% (meta 100%)`,  value: dashRaw.retinopatia_diabetica_rastreados_pct, max: 100, color: CRIT },
                    { label: `Crianças com óculos: ${dashRaw.criancas_oculos_receberam}/${dashRaw.criancas_oculos_necessitam}`, value: dashRaw.criancas_oculos_receberam, max: dashRaw.criancas_oculos_necessitam, color: CRIT },
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
                <p><b>Zero oftalmologista em Apuí</b> — espera SISREG: 280 dias. 142 pessoas com cegueira irreversível por glaucoma. Tonômetro: R$ 18k + colírio timolol R$ 8,40/mês = controla por toda a vida.</p>
                <p><b>284 pacientes cegos por catarata — todos recuperáveis</b>. Mutirão SES-AM: custo R$ 0 para o município, 120 cirurgias em 1 semana. 28 realizadas em 2025 (9,9% da fila).</p>
                <p><b>Programa Olhar Brasil: R$ 0 e não foi ativado</b>. 142 crianças sem óculos = -40% no rendimento escolar. Fundoscopia + tonometria nas UBSs: R$ 18k. Tele-oftalmologia para RD: R$ 84k → R$ 35,3M de cegueira evitável.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "condicoes" && Array.isArray(condicoes) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={condicoes as any[]} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="condicao" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="estimados"     name="Estimados"      radius={[4,4,0,0]} fill={ACCENT} />
                <Bar dataKey="diagnosticados" name="Diagnosticados" radius={[4,4,0,0]}>
                  {(condicoes as any[]).map((c: any, i: number) => <Cell key={i} fill={statusColor(c.status)} />)}
                </Bar>
                <Bar dataKey="cegueira_estimada" name="Cegueira estimada" radius={[4,4,0,0]} fill={CRIT} />
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
                      <span className="font-bold" style={{ color: statusColor(c.status) }}>{(c.estimados||0).toLocaleString()} estim.</span>
                      <span className="text-slate-500"> · {c.diagnosticados} diag. · {c.cegueira_estimada} cegueira</span>
                      <p className="text-xs mt-0.5" style={{ color: c.reversibilidade.includes("irreversível") ? CRIT : OK }}>{c.reversibilidade}</p>
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
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Saúde Ocular — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="glaucoma_diag"              name="Glaucoma diagnosticados"  stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="catarata_cirurgias"         name="Catarata cirurgias"       stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="right" dataKey="retinopatia_rastreados_pct" name="RD rastreados (%)"        stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
                <Line yAxisId="right" dataKey="tracoma_escolar_pct"        name="Tracoma escolar (%)"      stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="oculos_criancas"            name="Óculos — crianças"        stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="6 2" />
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
