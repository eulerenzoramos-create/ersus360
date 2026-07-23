import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Heart, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function CuidadosPaliativosApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["cp-dash"],  queryFn: () => apiGet("/api/cuidados-paliativos-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: casos }       = useQuery({ queryKey: ["cp-caso"],  queryFn: () => apiGet("/api/cuidados-paliativos-apui/casos"),      enabled: aba === "casos" });
  const { data: acoes }       = useQuery({ queryKey: ["cp-acao"],  queryFn: () => apiGet("/api/cuidados-paliativos-apui/acoes"),      enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["cp-hist"],  queryFn: () => apiGet("/api/cuidados-paliativos-apui/historico"), enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["cp-ind"],   queryFn: () => apiGet("/api/cuidados-paliativos-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Heart size={15}/> },
    { key: "casos",       label: "Condições",  icon: <Activity size={15}/> },
    { key: "acoes",       label: "Ações",      icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Heart size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Cuidados Paliativos — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Dor · Morfina · Óbito Digno · Cuidado Domiciliar · Luto · Oncologia Avançada · Conforto · FMS Apuí/AM</p>
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
              <KPI label="Cobertura CP (meta: 100% elegíveis)"  value={`${dashRaw.cobertura_cp_pct}%`}                           color={CRIT} sub={`${dashRaw.pacientes_cp_atendidos} de ${dashRaw.pacientes_cp_estimados} elegíveis atendidos`} />
              <KPI label="Morfina disponível em Apuí"           value={dashRaw.morfina_disponivel_apui ? "Disponível" : "AUSENTE"} color={CRIT} sub={`${dashRaw.pacientes_dor_cronica_grave} pacientes com dor grave · OMS: medicamento essencial`} />
              <KPI label="Óbito no domicílio (meta: ≥ 70%)"    value={`${dashRaw.obito_domicilio_pct}%`}                        color={CRIT} sub={`desejo: ${dashRaw.desejo_domicilio_pct_estimado}% preferem domicílio · ${dashRaw.obito_hospital_pct}% morrem no hospital`} />
              <KPI label="Cuidador familiar treinado (meta: 100%)" value={`${dashRaw.cuidador_familiar_treinado_pct}%`}         color={CRIT} sub="1 institucionalização evitada = R$ 84.000/ano · cartilha INCA: gratuita" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Uso da escala de dor ESAS (meta: 100%)" value={`${dashRaw.escala_dor_uso_pct}%`}                     color={CRIT} sub="instrumento gratuito · 9 sintomas em 2 min" />
              <KPI label="Protocolo CP implantado"               value={dashRaw.protocolo_cp_apui ? "Sim" : "Não"}             color={CRIT} sub="INCA guia gratuito · custo: R$ 4.200 (treinamento)" />
              <KPI label="Acompanhamento de luto (meta: 100%)"   value={`${dashRaw.acompanhamento_luto_pct}%`}                 color={CRIT} sub="grupo apoio: R$ 4.200/ano · luto complicado: risco depressão + suicídio" />
              <KPI label="Tele-paliatologia TELESSAÚDE-AM"       value="R$ 0"                                                   color={OK}   sub="tele-consultoria com paliativista · prazo resposta: 1 semana" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Déficit de Cuidados Paliativos — Apuí/AM</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: "Cobertura CP (meta: 100%)",    val: dashRaw.cobertura_cp_pct,             meta: 100 },
                    { label: "Óbito no domicílio (meta: 70%)", val: dashRaw.obito_domicilio_pct,        meta: 70  },
                    { label: "Cuidador treinado (meta: 100%)", val: dashRaw.cuidador_familiar_treinado_pct, meta: 100 },
                    { label: "Escala ESAS uso (meta: 100%)",  val: dashRaw.escala_dor_uso_pct,          meta: 100 },
                    { label: "Luto acompanhado (meta: 100%)", val: dashRaw.acompanhamento_luto_pct,     meta: 100 },
                    { label: "Morfina: SIM = 100 / NÃO = 0", val: dashRaw.morfina_disponivel_apui ? 100 : 0, meta: 100 },
                  ].map((f: any) => (
                    <div key={f.label} className="flex items-center gap-2">
                      <span className="text-slate-600 w-44 text-xs">{f.label}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: `${Math.min(f.val, 100)}%`, background: f.val >= f.meta * 0.8 ? OK : CRIT }} />
                      </div>
                      <span className="font-bold text-xs" style={{ color: f.val >= f.meta * 0.8 ? OK : CRIT }}>{f.val}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>284 pacientes elegíveis para CP em Apuí — 9,9% atendidos</b>. Morfina: NÃO disponível. OMS: morfina = medicamento essencial. DAF-AM: formulário COAFIS = R$ 0, 30 dias. 142 pacientes com dor crônica grave sem morfina. Tramadol e codeína disponíveis mas insuficientes para dor oncológica severa.</p>
                <p><b>68,4% dos óbitos ocorrem no hospital</b> vs desejo 72,4% de morrer em casa. Hospitalização terminal: R$ 28.000. CP domiciliar: R$ 4.200. ROI 6,7:1. Custo AD CP: R$ 14.000 (eMulti). Protocolo CP: zero. INCA guia: gratuito. Treinamento equipe: R$ 4.200.</p>
                <p><b>8,4% dos cuidadores capacitados</b> (meta 100%). Cartilha INCA: gratuita. Treinamento: R$ 4.200. Luto acompanhado: 4,2%. Grupo de apoio ao luto: R$ 4.200/ano. Tele-paliatologia: R$ 0 (TELESSAÚDE-AM). Casos complexos pediátricos: GRAACC/SP via teleconsultoria.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "casos" && Array.isArray(casos) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={casos as any[]} margin={{ top: 5, right: 20, bottom: 80, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="condicao" tick={{ fontSize: 8 }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="casos_estimados" name="Casos estimados" radius={[4,4,0,0]}>
                  {(casos as any[]).map((c: any, i: number) => <Cell key={i} fill={statusColor(c.status)} />)}
                </Bar>
                <Bar dataKey="atendidos_cp"    name="Atendidos em CP" radius={[4,4,0,0]} fill={OK} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(casos as any[]).map((c: any) => (
                <div key={c.condicao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(c.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{c.condicao}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: statusColor(c.status) }}>{c.casos_estimados} estimados</span>
                      <p className="text-slate-400 mt-0.5">{c.atendidos_cp} em CP ({((c.atendidos_cp / c.casos_estimados) * 100).toFixed(0)}%)</p>
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
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Cuidados Paliativos — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left"  tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="pacientes_cp"        name="Pacientes em CP"         stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" dataKey="cobertura_pct"       name="Cobertura (%)"           stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
                <Line yAxisId="right" dataKey="obito_hospital_pct"  name="Óbito hospital (%)"      stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="right" dataKey="cuidador_treinado_pct" name="Cuidador treinado (%)" stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" dataKey="dor_controlada_pct"  name="Dor controlada (%)"      stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="6 2" />
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
