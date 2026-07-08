import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { UserCog, AlertTriangle, TrendingUp, Activity } from "lucide-react";

const BRAND  = "#1e3a5f";
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

export default function SaudeHomemApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["hom-dash"],  queryFn: () => apiGet("/api/saude-homem-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: condicoes }   = useQuery({ queryKey: ["hom-cond"],  queryFn: () => apiGet("/api/saude-homem-apui/condicoes"),   enabled: aba === "condicoes" });
  const { data: acoes }       = useQuery({ queryKey: ["hom-acao"],  queryFn: () => apiGet("/api/saude-homem-apui/acoes"),       enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["hom-hist"],  queryFn: () => apiGet("/api/saude-homem-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["hom-ind"],   queryFn: () => apiGet("/api/saude-homem-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <UserCog size={15}/> },
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
            <UserCog size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde do Homem — Apuí/AM</h1>
            <p className="text-sm text-slate-500">PNAISH · Ca Próstata · IST/HIV · Acesso à UBS · Saúde Mental · Vasectomia · FMS Apuí/AM</p>
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
              <KPI label="Ca próstata — diagnóstico tardio"     value={`${dashRaw.cancer_prostata_diagnostico_tardio_pct}%`} color={CRIT} sub={`${dashRaw.cancer_prostata_novos_2025} casos novos — urologista: ${dashRaw.urologista_apui === 0 ? "zero" : dashRaw.urologista_apui}`} />
              <KPI label="Consulta médica masculina na UBS"     value={`${dashRaw.consulta_medica_homem_ubs_pct}%`}          color={CRIT} sub={`meta 80% — UBS horário noturno: ${dashRaw.ubs_horario_estendido_noturno}`} />
              <KPI label="Suicídio masculino 2025"              value={`${dashRaw.suicidio_homem_2025} óbitos`}             color={CRIT} sub={`${dashRaw.suicidio_homem_pct_total}% dos suicídios são homens — CAPS: ${dashRaw.caps_apui ? "Disponível" : "Inexistente"}`} />
              <KPI label="Testagem IST em homens (meta: 80%)"   value={`${dashRaw.testagem_ist_homem_pct}%`}                color={CRIT} sub={`sífilis: ${dashRaw.ist_sifilis_homem_2025} · gonorreia: ${dashRaw.ist_gonorreia_homem_2025} · HIV: ${dashRaw.hiv_homem_2025}`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="PSA rastreamento (meta: 60%)"          value={`${dashRaw.psa_rastreamento_pct}%`}                 color={CRIT} sub={`fila urologista: ${dashRaw.espera_urologista_sisreg_dias} dias SISREG`} />
              <KPI label="Hipertenso homem em tratamento"        value={`${dashRaw.hipertenso_tratado_homem_pct}%`}         color={CRIT} sub={`vs 62,4% das mulheres — IAM < 60a: 8 óbitos 2025`} />
              <KPI label="Alcoolismo masculino estimado"          value={`${dashRaw.masculino_alcool_abuso_pct}%`}           color={CRIT} sub="garimpo + isolamento + zero lazer — CAPS AD: inexistente" />
              <KPI label="Vasectomia disponível"                 value={dashRaw.vasectomia_disponivel ? "Disponível" : "Indisponível"} color={CRIT} sub="gratuita via SUS — Lei 9.263/96" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Acesso e Rastreamento Masculino — Apuí/AM</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `PSA rastreamento: ${dashRaw.psa_rastreamento_pct}% (meta 60%)`,       value: dashRaw.psa_rastreamento_pct,              max: 60,  color: CRIT },
                    { label: `Consulta médica anual: ${dashRaw.consulta_medica_homem_ubs_pct}%`,    value: dashRaw.consulta_medica_homem_ubs_pct,      max: 80,  color: CRIT },
                    { label: `Testagem IST: ${dashRaw.testagem_ist_homem_pct}% (meta 80%)`,         value: dashRaw.testagem_ist_homem_pct,             max: 80,  color: CRIT },
                    { label: `Hipertenso tratado (homens): ${dashRaw.hipertenso_tratado_homem_pct}%`, value: dashRaw.hipertenso_tratado_homem_pct,    max: 80,  color: CRIT },
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
                <p><b>72,4% dos cânceres de próstata diagnosticados em estádio tardio</b> — sem PSA de rastreamento (18,4%). Urologista: zero em Apuí (fila 320 dias SISREG). Tele-urologia: PSA alterado → laudo em 5 dias. Ca próstata estádio I: cura 99% vs estádio IV: 30%/5a.</p>
                <p><b>28,4% dos homens consultam na UBS</b> (vs 68,4% das mulheres). Zero UBSs com horário noturno. Trabalhador não pode faltar. Outubro Azul ampliado no garimpo: testagem PSA + glicemia + PA + IST no local de trabalho. Custo: R$ 18.000 → 400 homens.</p>
                <p><b>8 dos 11 suicídios são homens (72,7%)</b>. CAPS: zero. Alcoolismo: 28,4% dos homens adultos. Grupo de homens na UBS: R$ 8.400/ano. CVV 188 7 sinalizado no garimpo + escola. CAPS AD: solicitação formal ao Estado (> 20k hab = critério atendido).</p>
              </div>
            </div>
          </div>
        )}

        {aba === "condicoes" && Array.isArray(condicoes) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={condicoes as any[]} margin={{ top: 5, right: 20, bottom: 60, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="condicao" tick={{ fontSize: 7 }} angle={-10} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="estimados"     name="Estimados"     radius={[4,4,0,0]} fill={CRIT} opacity={0.4} />
                <Bar dataKey="diagnosticados" name="Diagnosticados" radius={[4,4,0,0]}>
                  {(condicoes as any[]).map((c: any, i: number) => <Cell key={i} fill={statusColor(c.status)} />)}
                </Bar>
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
                      <span className="font-bold" style={{ color: statusColor(c.status) }}>{c.diagnosticados} diag.</span>
                      <span className="text-slate-400"> / {c.estimados} est.</span>
                      <p className="text-slate-400 mt-0.5">diagnóstico tardio: {c.tardio_pct}%</p>
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
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Saúde do Homem — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="psa_pct"              name="PSA rastreamento (%)"    stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="consulta_homem_pct"   name="Consulta masculina (%)"  stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="right" dataKey="suicidio_homem"       name="Suicídio masculino"      stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" dataKey="ist_homem"            name="IST em homens"           stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
                <Line yAxisId="right" dataKey="obito_prematura_homem" name="Óbito prematuro homem"  stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="6 2" />
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
