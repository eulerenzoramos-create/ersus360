import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Heart, AlertTriangle, Activity, TrendingUp } from "lucide-react";

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

export default function AleitamentoMaternoApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["am-dashboard"], queryFn: () => apiGet("/api/aleitamento-materno-apui/dashboard"),              enabled: aba === "dashboard" });
  const { data: indicAmam }   = useQuery({ queryKey: ["am-indics"],    queryFn: () => apiGet("/api/aleitamento-materno-apui/indicadores-amamentacao"), enabled: aba === "indicadores-am" });
  const { data: acoes }       = useQuery({ queryKey: ["am-acoes"],     queryFn: () => apiGet("/api/aleitamento-materno-apui/acoes"),                   enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["am-hist"],      queryFn: () => apiGet("/api/aleitamento-materno-apui/historico"),               enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["am-ind"],       queryFn: () => apiGet("/api/aleitamento-materno-apui/indicadores"),             enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",      label: "Dashboard",    icon: <Heart size={15}/> },
    { key: "indicadores-am", label: "Amamentação",  icon: <Activity size={15}/> },
    { key: "acoes",          label: "Ações",        icon: <AlertTriangle size={15}/> },
    { key: "historico",      label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores",    label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Heart size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Aleitamento Materno — Apuí/AM</h1>
            <p className="text-sm text-slate-500">AME · Banco de Leite · GALMA · Puerpério · FMS Apuí/AM</p>
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
              <KPI label="AME até 6 meses"         value={`${dashRaw.ame_6meses_pct}%`}        color={CRIT} sub={`meta: ${dashRaw.meta_ame_pct}%`} />
              <KPI label="AM continuado 1 ano"     value={`${dashRaw.am_continuado_1ano_pct}%`} color={CRIT} sub="meta: 75%" />
              <KPI label="AM continuado 2 anos"    value={`${dashRaw.am_continuado_2anos_pct}%`}color={CRIT} sub="meta: 50% (OMS)" />
              <KPI label="BLH implantado"          value="NÃO"                                  color={CRIT} sub={`Ref.: ${dashRaw.blh_referencia}`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="RN em AME na alta"       value={`${dashRaw.rn_ame_alta_hospitalar_pct}%`} color={CRIT} sub="meta: 90%" />
              <KPI label="Uso de fórmula infantil" value={`${dashRaw.formula_infantil_uso_pct}%`}   color={CRIT} sub="bebês até 6 meses" />
              <KPI label="Puérperas orientadas"    value={`${dashRaw.puerperasOrientadas_pct}%`}    color={WARN} sub="meta: 100%" />
              <KPI label="Alojamento conjunto"     value={`${dashRaw.alojamento_conjunto_pct}%`}    color={WARN} sub="meta: 100%" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">AME vs. Meta OMS (90%)</h3>
                <div className="space-y-3">
                  {[
                    { label: "AME exclusivo até 6 meses",    value: dashRaw.ame_6meses_pct,              meta: 90, color: CRIT },
                    { label: "AM continuado até 1 ano",      value: dashRaw.am_continuado_1ano_pct,       meta: 75, color: CRIT },
                    { label: "AM continuado até 2 anos",     value: dashRaw.am_continuado_2anos_pct,      meta: 50, color: CRIT },
                    { label: "Contato pele a pele pós-parto",value: dashRaw.contato_pele_pele_pct,        meta: 90, color: WARN },
                    { label: "Alojamento conjunto",          value: dashRaw.alojamento_conjunto_pct,      meta: 100,color: WARN },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-medium" style={{ color: b.color }}>{b.value}% / meta {b.meta}%</span>
                      </div>
                      <ProgressBar value={b.value} max={b.meta} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>61,8% dos bebês</b> recebem fórmula infantil antes dos 6 meses. O desmame precoce contribui diretamente para os índices críticos de desnutrição infantil (28,4%) em Apuí.</p>
                <p><b>BLH inexistente</b> — recém-nascidos prematuros e de baixo peso sem acesso a leite humano pasteurizado. Referência: HGH Humaitá, 284 km.</p>
                <p><b>Nenhum grupo GALMA</b> ativo. Puérperas sem suporte estruturado para manutenção da amamentação após a alta hospitalar.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "indicadores-am" && Array.isArray(indicAmam) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Indicadores de Amamentação vs. Meta</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={(indicAmam as any[]).filter((i: any) => i.meta != null).map((i: any) => ({
                    ind: i.indicador.substring(0, 36), valor: i.valor, meta: i.meta
                  }))}
                  layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="ind" tick={{ fontSize: 8 }} width={240} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="valor" name="Valor atual" radius={[0,3,3,0]}>
                    {(indicAmam as any[]).filter((i: any) => i.meta != null).map((i: any) => (
                      <Cell key={i.indicador} fill={statusColor(i.status)} />
                    ))}
                  </Bar>
                  <Bar dataKey="meta" name="Meta" fill="#374151" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(indicAmam as any[]).map((ind: any) => (
                <div key={ind.indicador} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: statusColor(ind.status) }} />
                    <span className="text-sm text-slate-700">{ind.indicador}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm" style={{ color: statusColor(ind.status) }}>
                      {ind.valor}{ind.unidade}
                    </span>
                    {ind.meta != null && <span className="text-xs text-slate-400 ml-2">/ meta: {ind.meta}{ind.unidade}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "acoes" && Array.isArray(acoes) && (
          <div className="grid gap-3">
            {(acoes as any[]).map((a: any, i: number) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-semibold text-sm text-slate-700">{a.acao}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-bold flex-shrink-0 ${a.status === "em_andamento" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                    {a.status === "em_andamento" ? "Em andamento" : "Planejado"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-1">{a.descricao}</p>
                <div className="flex gap-3 text-xs text-slate-400">
                  <span>Resp.: {a.responsavel}</span>
                  <span>Prazo: {a.prazo}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Aleitamento Materno (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line dataKey="ame_6m_pct"    name="AME 6 meses %"   stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="am_1ano_pct"   name="AM 1 ano %"      stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="am_2anos_pct"  name="AM 2 anos %"     stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="formula_pct"   name="Fórmula infantil %" stroke={OK}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
