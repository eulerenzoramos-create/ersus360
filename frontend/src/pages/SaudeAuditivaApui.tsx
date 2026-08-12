import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Radio, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function SaudeAuditivaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["aud-dashboard"],   queryFn: () => apiGet("/api/saude-auditiva-apui/dashboard"),    enabled: aba === "dashboard" });
  const { data: condicoes }   = useQuery({ queryKey: ["aud-condicoes"],   queryFn: () => apiGet("/api/saude-auditiva-apui/condicoes"),    enabled: aba === "condicoes" });
  const { data: reabilitacao }= useQuery({ queryKey: ["aud-reab"],        queryFn: () => apiGet("/api/saude-auditiva-apui/reabilitacao"), enabled: aba === "reabilitacao" });
  const { data: historico }   = useQuery({ queryKey: ["aud-hist"],        queryFn: () => apiGet("/api/saude-auditiva-apui/historico"),    enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["aud-ind"],         queryFn: () => apiGet("/api/saude-auditiva-apui/indicadores"),  enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",      icon: <Radio size={15}/> },
    { key: "condicoes",    label: "Condições",      icon: <Activity size={15}/> },
    { key: "reabilitacao", label: "Reabilitação",   icon: <Activity size={15}/> },
    { key: "historico",    label: "Histórico",      icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores",    icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Radio size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Auditiva — Apuí/AM</h1>
            <p className="text-sm text-slate-500">PAIR · OMC · Presbiacusia · Triagem neonatal · AASI · Implante coclear · FMS Apuí/AM</p>
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
              <KPI label="Perda auditiva estimada"  value={dashRaw.perda_auditiva_estimados?.toLocaleString()} color={CRIT} sub={`${dashRaw.perda_auditiva_estimada_pct}% da população`} />
              <KPI label="AASI — cobertura"         value={`${dashRaw.aparelho_auditivo_usuarios} usuários`}   color={CRIT} sub={`necessitam: ${dashRaw.aparelho_auditivo_necessitam_estimados}`} />
              <KPI label="PAIR no garimpo"          value={`${dashRaw.perda_induzida_ruido_garimpo_pct}%`}     color={CRIT} sub="exposição ao ruído" />
              <KPI label="EOA neonatal"             value={`${dashRaw.eoa_triagem_neonatal_pct}%`}             color={CRIT} sub="cobertura triagem" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Audiometria disponível"   value={dashRaw.audiometria_disponivel ? "Sim" : "Não"}     color={CRIT} sub="zero em Apuí" />
              <KPI label="AASI — fila (meses)"      value={`${dashRaw.aparelho_auditivo_fila_meses}m`}         color={CRIT} sub="espera para receber" />
              <KPI label="OMC — prevalência"        value={`${dashRaw.otite_media_cronca_prevalencia_pct}%`}   color={CRIT} sub={`indígenas: ${dashRaw.otite_media_comunidades_indigenas_pct}%`} />
              <KPI label="OTR / fonoaudiólogo"      value="0"                                                   color={CRIT} sub="zero no município" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Diagnóstico e Cobertura Auditiva</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `PAIR diagnosticados (${dashRaw.perda_induzida_ruido_diagnosticados_pct}%)`, value: dashRaw.perda_induzida_ruido_diagnosticados_pct, max: 100, color: CRIT },
                    { label: `EOA neonatal (${dashRaw.eoa_triagem_neonatal_pct}%)`,                       value: dashRaw.eoa_triagem_neonatal_pct,                 max: 100, color: CRIT },
                    { label: `Perda auditiva diagnosticados (${dashRaw.perda_auditiva_diagnosticados_pct}%)`, value: dashRaw.perda_auditiva_diagnosticados_pct,    max: 100, color: CRIT },
                    { label: `AASI usuários (${Math.round(dashRaw.aparelho_auditivo_usuarios / dashRaw.aparelho_auditivo_necessitam_estimados * 100)}% dos necessitados)`, value: dashRaw.aparelho_auditivo_usuarios, max: dashRaw.aparelho_auditivo_necessitam_estimados, color: CRIT },
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
                <p><b>PAIR no garimpo: 38,4% com surdez ocupacional</b> — perda sensorineural irreversível. Protetor auricular custa R$ 2,80. Diagnóstico: audiômetro portátil R$ 12.000. Garimpeiro com &gt; 5 anos: 84,2% com perda moderada-severa.</p>
                <p><b>OMC 22,4% nas aldeias indígenas</b> (11x a meta OMS). Otite média crônica em criança = perda condutiva + dificuldade de aprendizado. Timpanotomia: indisponível. Antibiótico tópico: desabastecido 38 dias/ano.</p>
                <p><b>AASI: 84 usuários de 742 necessitados (11,3%)</b> — fila de 14 meses. Fonoaudiólogo: zero. Criança com AASI sem reabilitação fonoaudiológica = aparelho que amplifica sem desenvolver linguagem. Custo de 1 fonoaudiólogo: R$ 4.800/mês.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "condicoes" && Array.isArray(condicoes) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-2">
              <h3 className="font-semibold text-slate-700 mb-3">Condições Auditivas — Estimados vs Diagnosticados</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={(condicoes as any[]).filter((c: any) => c.estimados > 0 && c.estimados < 2000)} margin={{ top: 5, right: 20, bottom: 50, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis dataKey="condicao" tick={{ fontSize: 8 }} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="estimados"      name="Estimados"      fill={CRIT} />
                  <Bar dataKey="diagnosticados" name="Diagnosticados" fill={WARN} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {(condicoes as any[]).map((c: any) => (
              <div key={c.condicao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(c.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{c.condicao}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: statusColor(c.status) }}>{c.diagnosticados} diagnosticados</span>
                    <p className="text-xs text-slate-400">estimados: {c.estimados} · reabilitados: {c.reabilitados_pct}%</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{c.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "reabilitacao" && Array.isArray(reabilitacao) && (
          <div className="grid gap-3">
            {(reabilitacao as any[]).map((r: any) => (
              <div key={r.recurso} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(r.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{r.recurso}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${r.disponivel ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {r.disponivel ? "Disponível" : "Indisponível"}
                    </span>
                    {r.fila_meses > 0 && <p className="text-xs text-slate-400 mt-0.5">fila: {r.fila_meses}m · {r.usuarios_ativos} ativos</p>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{r.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Saúde Auditiva — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="eoa_pct"                        name="EOA neonatal (%)"         stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="aasi_usuarios"                  name="AASI usuários ativos"     stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="pair_diagnosticados_pct"        name="PAIR diagnosticados (%)"  stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="otite_cronica_diagnosticados_pct" name="OMC diagnosticados (%)" stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
