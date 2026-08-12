import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Pill, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

const CAT_COLORS: Record<string, string> = {
  "DM":      CRIT,
  "HAS":     ACCENT,
  "Psiq.":   "#7c3aed",
  "Malária": WARN,
  "Sífilis": "#e11d48",
  "Resp.":   "#0891b2",
  "TB":      OK,
  "ATB":     "#6b7280",
  "Nutric.": "#f97316",
};

export default function FarmaciaBasicaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["farm-dashboard"],  queryFn: () => apiGet("/api/farmacia-basica-apui/dashboard"),    enabled: aba === "dashboard" });
  const { data: itens }       = useQuery({ queryKey: ["farm-itens"],      queryFn: () => apiGet("/api/farmacia-basica-apui/itens-criticos"),enabled: aba === "itens" });
  const { data: adesao }      = useQuery({ queryKey: ["farm-adesao"],     queryFn: () => apiGet("/api/farmacia-basica-apui/adesao"),        enabled: aba === "adesao" });
  const { data: historico }   = useQuery({ queryKey: ["farm-hist"],       queryFn: () => apiGet("/api/farmacia-basica-apui/historico"),     enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["farm-ind"],        queryFn: () => apiGet("/api/farmacia-basica-apui/indicadores"),   enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",       icon: <Pill size={15}/> },
    { key: "itens",      label: "Itens Críticos",  icon: <AlertTriangle size={15}/> },
    { key: "adesao",     label: "Adesão DCNT",     icon: <Activity size={15}/> },
    { key: "historico",  label: "Histórico",       icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores",     icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Pill size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Farmácia / Assistência Farmacêutica — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Componente Básico · RENAME · Adesão · CEAF · FMS Apuí/AM</p>
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
          <NaoDisponivelBanner
            titulo="Farmácia Básica — Dados Indisponíveis"
            nota="Integração com HORUS/SIAPS ou sistema de almoxarifado local ainda não configurada no Railway. Nenhum valor de estoque ou dispensação foi inventado."
          />
        )}

        {aba === "dashboard" && dashRaw && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Disponibilidade Básico"  value={`${dashRaw.disponibilidade_basico_pct}%`}    color={WARN} sub={`meta: ${dashRaw.meta_disponibilidade_pct}%`} />
              <KPI label="Itens em Falta > 30d"    value={dashRaw.itens_em_falta_30d.toString()}       color={CRIT} sub={`de ${dashRaw.itens_rename_pactuados} pactuados`} />
              <KPI label="Dispensações / Mês"      value={dashRaw.dispensacoes_mes.toLocaleString()}   color={BRAND} sub="Componente Básico" />
              <KPI label="Adesão HIPERDIA"         value={`${dashRaw.adesao_medicamento_hiperdia_pct}%`} color={WARN} sub={`meta: ${dashRaw.meta_adesao_pct}%`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Farmacêuticos SUS"       value={`${dashRaw.farmaceuticos_sus}/${dashRaw.farmaceuticos_necessarios}`} color={CRIT} sub="75% UBS sem farmacêutico" />
              <KPI label="Insulina NPH (falta 2025)" value={`${dashRaw.insulina_desabastecimento_meses_2025} meses`} color={CRIT} sub="184 diabéticos impactados" />
              <KPI label="Psicofármacos Disp."     value={`${dashRaw.psicofarmacos_disponibilidade_pct}%`} color={WARN} sub="haloperidol/clonazepam em falta" />
              <KPI label="CEAF Pacientes"          value={dashRaw.ceaf_pacientes_municipio.toString()} color={CRIT} sub={`retirada em ${dashRaw.ceaf_referencia}`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Estoque — Situação Atual</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: "Itens com estoque adequado",    value: dashRaw.itens_estoque_adequado,             max: dashRaw.itens_rename_pactuados, color: OK,   unit: "itens" },
                    { label: "Itens abaixo do mínimo",        value: dashRaw.itens_abaixo_estoque_minimo,        max: dashRaw.itens_rename_pactuados, color: WARN, unit: "itens" },
                    { label: "Itens em falta > 30 dias",      value: dashRaw.itens_em_falta_30d,                 max: dashRaw.itens_rename_pactuados, color: CRIT, unit: "itens" },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-bold" style={{ color: b.color }}>{b.value} {b.unit}</span>
                      </div>
                      <ProgressBar value={b.value} max={b.max} color={b.color} />
                    </div>
                  ))}
                  <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 mt-1">
                    <b>Custo componente básico:</b> R$ {dashRaw.custo_total_componente_basico_mes_R.toLocaleString()}/mês | <b>Perdas por vencimento:</b> {dashRaw.perdas_validade_pct}% (meta 2%)
                  </div>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>Insulina NPH desabastecida 3 meses</b> em 2025 — 184 diabéticos insulinodependentes sem medicamento. Cetoacidose, internações evitáveis e piora do controle glicêmico são consequências documentadas.</p>
                <p><b>2 farmacêuticos para 8 UBS</b> — dispensação por técnico/auxiliar de enfermagem sem orientação farmacêutica. Interações medicamentosas e abandono de tratamento são previsíveis e não detectados.</p>
                <p><b>184 pacientes no CEAF</b> dependem de viagem mensal a Manicoré/Manaus para retirar medicamento especializado. Falta de 1 mês = ruptura terapêutica. Farmácia satélite municipal é solução simples não implantada.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "itens" && Array.isArray(itens) && (
          <div className="space-y-2">
            {(itens as any[]).map((it: any) => (
              <div key={it.item} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: statusColor(it.status) }} />
                  <div>
                    <span className="font-semibold text-sm text-slate-700">{it.item}</span>
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: CAT_COLORS[it.categoria] + "22", color: CAT_COLORS[it.categoria] }}>{it.categoria}</span>
                  </div>
                </div>
                <div className="text-xs text-right space-y-0.5">
                  {it.falta_dias > 0 ? (
                    <>
                      <div className="font-bold" style={{ color: CRIT }}>Em falta: {it.falta_dias} dias</div>
                      <div className="text-slate-400">{it.pacientes_impactados} pcts impactados | Alt.: {it.alternativa}</div>
                    </>
                  ) : (
                    <div className="font-bold" style={{ color: OK }}>Estoque adequado</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "adesao" && Array.isArray(adesao) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Adesão ao Medicamento por Grupo DCNT</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={adesao as any[]} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
                  <YAxis type="category" dataKey="grupo" tick={{ fontSize: 9 }} width={220} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="adesao_pct" name="Adesão (%)" radius={[0,3,3,0]}>
                    {(adesao as any[]).map((a: any) => <Cell key={a.grupo} fill={statusColor(a.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(adesao as any[]).map((a: any) => (
                <div key={a.grupo} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: statusColor(a.status) }} />
                    <span className="font-semibold text-sm text-slate-700">{a.grupo}</span>
                    <span className="text-xs text-slate-400">({a.pacientes} pcts)</span>
                  </div>
                  <div className="text-xs text-right space-y-0.5">
                    <div>Adesão: <span className="font-bold" style={{ color: statusColor(a.status) }}>{a.adesao_pct}%</span></div>
                    <div>Abandon.: <span className="font-bold" style={{ color: WARN }}>{a.abandono_pct}%</span> | Sem med.: <span className="font-bold" style={{ color: CRIT }}>{a.sem_medicamento_pct}%</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal — Farmácia Básica (2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="pct" tick={{ fontSize: 11 }} unit="%" />
                <YAxis yAxisId="n" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="pct" dataKey="disponibilidade_pct"   name="Disponibilidade (%)"   stroke={BRAND}  strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="pct" dataKey="adesao_hiperdia_pct"   name="Adesão HIPERDIA (%)"   stroke={OK}     strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="n"   dataKey="itens_falta"           name="Itens em falta"        stroke={CRIT}   strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
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
