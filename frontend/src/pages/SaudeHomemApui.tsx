import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { UserCheck, AlertTriangle, TrendingUp, Activity } from "lucide-react";

const BRAND  = "#1e3a5f";
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

export default function SaudeHomemApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["hom-dashboard"],  queryFn: () => apiGet("/api/saude-homem-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: condicoes }   = useQuery({ queryKey: ["hom-condicoes"],  queryFn: () => apiGet("/api/saude-homem-apui/condicoes"),   enabled: aba === "condicoes" });
  const { data: barreiras }   = useQuery({ queryKey: ["hom-barreiras"],  queryFn: () => apiGet("/api/saude-homem-apui/barreiras"),   enabled: aba === "barreiras" });
  const { data: historico }   = useQuery({ queryKey: ["hom-hist"],       queryFn: () => apiGet("/api/saude-homem-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["hom-ind"],        queryFn: () => apiGet("/api/saude-homem-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",    icon: <UserCheck size={15}/> },
    { key: "condicoes",   label: "Condições",    icon: <Activity size={15}/> },
    { key: "barreiras",   label: "Barreiras",    icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <UserCheck size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde do Homem — Apuí/AM</h1>
            <p className="text-sm text-slate-500">PNAISH · Câncer próstata · HAS · Saúde mental · Alcoolismo · Mortalidade prematura · FMS Apuí/AM</p>
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
              <KPI label="Consulta médica/12m"       value={`${dashRaw.consulta_medica_12m_pct}%`}             color={CRIT} sub="meta: 60%" />
              <KPI label="Óbito masculino prematuro" value={`${dashRaw.obito_masculino_prematuro_pct}%`}       color={CRIT} sub="dos óbitos < 60a" />
              <KPI label="Câncer próstata avançado"  value={`${dashRaw.cancer_prostata_estadio_avancado_pct}%`}color={CRIT} sub="ao diagnóstico" />
              <KPI label="Suicídio — proporção masc."value={`${dashRaw.suicidio_masculino_pct_total}%`}        color={CRIT} sub="dos óbitos por suicídio" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="HAS masculina controlada"  value={`${dashRaw.hipertensao_controlada_masculina_pct}%`}color={CRIT} sub="meta: 60%" />
              <KPI label="Álcool uso nocivo"         value={`${dashRaw.alcool_uso_nocivo_masculino_pct}%`}     color={CRIT} sub="nos homens" />
              <KPI label="PSA rastreio > 50a"        value={`${dashRaw.cancer_prostata_rastreio_pct}%`}        color={CRIT} sub="meta: 70%" />
              <KPI label="Saúde mental em tratam."   value={`${dashRaw.saude_mental_busca_tratamento_masculino_pct}%`} color={CRIT} sub="homens que buscam help" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Acesso e Controle — Homem vs Meta</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Cadastro ESF (${dashRaw.cadastro_homem_esf_pct}% / meta ${dashRaw.meta_cadastro_pct}%)`, value: dashRaw.cadastro_homem_esf_pct, max: dashRaw.meta_cadastro_pct, color: CRIT },
                    { label: `Consulta 12m (${dashRaw.consulta_medica_12m_pct}% / meta ${dashRaw.meta_consulta_pct}%)`, value: dashRaw.consulta_medica_12m_pct, max: dashRaw.meta_consulta_pct, color: CRIT },
                    { label: `HAS controlada (${dashRaw.hipertensao_controlada_masculina_pct}%)`, value: dashRaw.hipertensao_controlada_masculina_pct, max: 60, color: CRIT },
                    { label: `PSA rastreio (${dashRaw.cancer_prostata_rastreio_pct}%)`,           value: dashRaw.cancer_prostata_rastreio_pct, max: 70, color: CRIT },
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
                <p><b>68,4% dos óbitos prematuros são masculinos</b> — mortalidade cardiovascular 47% maior que nas mulheres (218 vs 148/100k). Homem hipertenso: 71,6% fora de controle. Chega ao serviço de saúde em urgência/emergência — não na UBS preventiva.</p>
                <p><b>Câncer de próstata: 72,4% em estágio avançado</b> — PSA disponível (espera 14 dias) mas rastreio em apenas 18,4% dos homens > 50a. Zero urologista. TFD para Humaitá: espera de 3-6 meses.</p>
                <p><b>76,4% dos suicídios são masculinos</b> — taxa estimada 26,4/100k nos homens (4x a feminina). Alcoolismo como automedicação + isolamento rural + garimpo + CAPS sem estratégia masculina específica.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "condicoes" && Array.isArray(condicoes) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-2">
              <h3 className="font-semibold text-slate-700 mb-3">Condições — Prevalência e Controle Masculino (%)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={condicoes as any[]} margin={{ top: 5, right: 20, bottom: 50, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="condicao" tick={{ fontSize: 8 }} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="prevalencia_pct"  name="Prevalência (%)"         fill={CRIT} />
                  <Bar dataKey="controlada_pct"   name="Controlada/cessação (%)" fill={OK}   />
                  <Bar dataKey="acompanhamento_pct" name="Acompanhamento (%)"    fill={WARN} />
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
                    <span className="font-bold" style={{ color: statusColor(c.status) }}>{c.controlada_pct}% controlada</span>
                    <p className="text-xs text-slate-400">prevalência {c.prevalencia_pct}% · acomp. {c.acompanhamento_pct}%</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{c.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "barreiras" && Array.isArray(barreiras) && (
          <div className="grid gap-3">
            {(barreiras as any[]).map((b: any) => (
              <div key={b.barreira} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: b.impacto === "alto" ? CRIT : WARN }} />
                    <p className="font-semibold text-sm text-slate-700">{b.barreira}</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: b.impacto === "alto" ? "#fee2e2" : "#fef3c7", color: b.impacto === "alto" ? CRIT : WARN }}>
                    impacto {b.impacto}
                  </span>
                </div>
                <p className="text-xs text-slate-500 ml-5">{b.observacao}</p>
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
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="cadastro_pct"         name="Cadastro ESF (%)"        stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="consulta_12m_pct"     name="Consulta 12m (%)"        stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="psa_rastreio_pct"     name="PSA rastreio (%)"        stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="obito_prematuro_pct"  name="Óbito prematuro masc.(%)"%stroke={CRIT}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
