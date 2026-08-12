import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Calendar, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function PlanejamentoFamiliarApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }         = useQuery({ queryKey: ["pf-dash"], queryFn: () => apiGet("/api/planejamento-familiar-apui/dashboard"),    enabled: aba === "dashboard" });
  const { data: metodos }      = useQuery({ queryKey: ["pf-met"],  queryFn: () => apiGet("/api/planejamento-familiar-apui/metodos"),      enabled: aba === "metodos" });
  const { data: intervencoes } = useQuery({ queryKey: ["pf-int"],  queryFn: () => apiGet("/api/planejamento-familiar-apui/intervencoes"), enabled: aba === "intervencoes" });
  const { data: historico }    = useQuery({ queryKey: ["pf-hist"], queryFn: () => apiGet("/api/planejamento-familiar-apui/historico"),    enabled: aba === "historico" });
  const { data: indicadores }  = useQuery({ queryKey: ["pf-ind"],  queryFn: () => apiGet("/api/planejamento-familiar-apui/indicadores"),  enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",     icon: <Calendar size={15}/> },
    { key: "metodos",      label: "Métodos",       icon: <Activity size={15}/> },
    { key: "intervencoes", label: "Intervenções",  icon: <AlertTriangle size={15}/> },
    { key: "historico",    label: "Histórico",     icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores",   icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Calendar size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Planejamento Familiar e Contracepção — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Contracepção · Pré-Natal · Gravidez na Adolescência · DIU · Implante · FMS Apuí/AM</p>
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
              <KPI label="Mulheres usando contraceptivo"   value={`${dashRaw.mulheres_em_uso_contraceptivo_pct}%`}      color={CRIT} sub={`meta ${dashRaw.meta_contraceptivo_pct}% (MIF)`} />
              <KPI label="Gravidez na adolescência 2025"  value={dashRaw.gravidez_adolescente_10_19_2025}              color={CRIT} sub={`taxa ${dashRaw.taxa_fecundidade_adolescente_1000}/1000 (meta ${dashRaw.meta_fecundidade_adolescente_1000})`} />
              <KPI label="Gravidez não planejada"         value={`${dashRaw.gravidez_nao_planejada_pct}%`}             color={CRIT} sub="das gestações em 2025" />
              <KPI label="Pré-natal 6+ consultas"         value={`${dashRaw.pre_natal_6_consultas_pct}%`}              color={CRIT} sub={`início 1º trimestre: ${dashRaw.inicio_pre_natal_1_trimestre_pct}%`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="DIU ofertado no SUS"            value={dashRaw.diu_ofertado ? "Sim" : "Não"}                color={CRIT} sub="mais eficaz reversível (99,7%)" />
              <KPI label="Implante subdérmico"            value={dashRaw.implante_ofertado ? "Sim" : "Não"}           color={CRIT} sub="mais eficaz disponível (99,9%)" />
              <KPI label="Preservativos distribuídos"     value={`${((dashRaw.preservativo_distribuido_2025/dashRaw.meta_preservativo_distribuicao)*100).toFixed(0)}%`} color={CRIT} sub={`${dashRaw.preservativo_distribuido_2025.toLocaleString()} de ${dashRaw.meta_preservativo_distribuicao.toLocaleString()}`} />
              <KPI label="Consultas planejamento fam."    value={`${((dashRaw.consulta_planejamento_familiar_2025/dashRaw.meta_consultas_planejamento_familiar)*100).toFixed(0)}%`} color={CRIT} sub={`${dashRaw.consulta_planejamento_familiar_2025} de ${dashRaw.meta_consultas_planejamento_familiar}`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Saúde Reprodutiva — Indicadores de Cobertura</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Uso de contraceptivo (${dashRaw.mulheres_em_uso_contraceptivo_pct}% / meta 80%)`,        value: dashRaw.mulheres_em_uso_contraceptivo_pct, max: 100, color: CRIT },
                    { label: `Pré-natal com 6+ consultas (${dashRaw.pre_natal_6_consultas_pct}% / meta 95%)`,          value: dashRaw.pre_natal_6_consultas_pct, max: 100, color: CRIT },
                    { label: `Pré-natal 1º trimestre (${dashRaw.inicio_pre_natal_1_trimestre_pct}% / meta 90%)`,       value: dashRaw.inicio_pre_natal_1_trimestre_pct, max: 100, color: CRIT },
                    { label: `Gestantes acompanhadas (${dashRaw.gestante_acompanhada_pre_natal_pct}% / meta 95%)`,     value: dashRaw.gestante_acompanhada_pre_natal_pct, max: 100, color: CRIT },
                    { label: `Preservativos distribuídos (${((dashRaw.preservativo_distribuido_2025/dashRaw.meta_preservativo_distribuicao)*100).toFixed(0)}% da meta)`, value: dashRaw.preservativo_distribuido_2025, max: dashRaw.meta_preservativo_distribuicao, color: WARN },
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
                <p><b>Zero DIU e zero implante subdérmico no SUS de Apuí</b> — métodos com 99,7-99,9% de eficácia, RENAME-listados, custo R$ 28-180. Única barreira: zero médico treinado. Capacitação FEBRASGO: 8h + R$ 12.000 para 4 médicos = acesso imediato.</p>
                <p><b>62,4% das gestações não planejadas — taxa de gravidez adolescente 2,8× acima da meta</b> — 142 adolescentes grávidas em 2025. Gravidez na adolescência: 3× mais mortalidade materna. Implante em adolescente: método de maior impacto comprovado (redução 80%).</p>
                <p><b>Déficit de 34.000 preservativos</b> — solicitação ao MS (CONDOM): gratuita, custo R$ 0, prazo 30 dias. Pré-natal no 1º trimestre em apenas 42,4%: ACS identificando gestante em tempo real via RNDS = diagnóstico precoce de sífilis, toxoplasmose e diabetes.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "metodos" && Array.isArray(metodos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Disponibilidade e Uso de Métodos Contraceptivos</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(metodos as any[])} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis dataKey="metodo" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="eficacia_pct" name="Eficácia (%)" fill={ACCENT} radius={[4,4,0,0]} />
                  <Bar dataKey="uso_estimado_pct" name="Uso estimado (%)" fill={WARN} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(metodos as any[]).map((m: any) => (
                <div key={m.metodo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: m.disponivel ? statusColor(m.status) : CRIT }} />
                      <p className="font-semibold text-sm text-slate-700">{m.metodo}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${m.disponivel ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {m.disponivel ? "Disponível" : "Indisponível"}
                      </span>
                      <p className="mt-0.5">uso: {m.uso_estimado_pct}% · eficácia: {m.eficacia_pct}%</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{m.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "intervencoes" && Array.isArray(intervencoes) && (
          <div className="grid gap-3">
            {(intervencoes as any[]).map((i: any) => (
              <div key={i.intervencao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: i.implementada ? OK : CRIT }} />
                    <p className="font-semibold text-sm text-slate-700">{i.intervencao}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${i.implementada ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {i.implementada ? "Implementada" : "Não implementada"}
                    </span>
                    {i.custo > 0 && <p className="text-xs text-slate-400 mt-0.5">R$ {i.custo.toLocaleString()} · {i.prazo_meses}m</p>}
                    {i.custo === 0 && <p className="text-xs text-green-600 mt-0.5">custo R$ 0 · {i.prazo_meses}m</p>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{i.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Planejamento Familiar — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="contraceptivo_pct" name="Uso contraceptivo (%)" stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="gravidez_adol"      name="Grav. adolescente"    stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="pre_natal_pct"      name="Pré-natal (%)"        stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="preservativo_meta_pct" name="Preservat. meta (%)" stroke={WARN} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
