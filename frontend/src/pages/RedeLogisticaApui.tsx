import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Truck, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function RedeLogisticaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["log-dashboard"], queryFn: () => apiGet("/api/rede-logistica-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: rotas }       = useQuery({ queryKey: ["log-rotas"],     queryFn: () => apiGet("/api/rede-logistica-apui/rotas"),      enabled: aba === "rotas" });
  const { data: insumos }     = useQuery({ queryKey: ["log-insumos"],   queryFn: () => apiGet("/api/rede-logistica-apui/insumos"),    enabled: aba === "insumos" });
  const { data: historico }   = useQuery({ queryKey: ["log-hist"],      queryFn: () => apiGet("/api/rede-logistica-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["log-ind"],       queryFn: () => apiGet("/api/rede-logistica-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",  icon: <Truck size={15}/> },
    { key: "rotas",      label: "Rotas",      icon: <Activity size={15}/> },
    { key: "insumos",    label: "Insumos",    icon: <Activity size={15}/> },
    { key: "historico",  label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Truck size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Rede Logística — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Frota · Rotas · Insumos · Cadeia Frio · FMS Apuí/AM</p>
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
              <KPI label="Frota operacional"         value={`${dashRaw.frota_operacional_pct}%`}             color={CRIT} sub={`${dashRaw.frota_veiculos_saude_total} veículos total`} />
              <KPI label="Barcos operacionais"        value={`${dashRaw.barcos_operacionais}/${dashRaw.barcos_saude}`} color={CRIT} sub={`${dashRaw.comunidades_acesso_fluvial_apenas} comun. ribeirinhas`} />
              <KPI label="Ruptura de estoque"         value={`${dashRaw.medicamentos_ruptura_estoque_pct}%`} color={WARN} sub={`meta: ${dashRaw.meta_ruptura_estoque_pct}%`} />
              <KPI label="Prazo entrega insumos"      value={`${dashRaw.prazo_medio_entrega_medicamentos_dias} dias`} color={WARN} sub={`meta: ${dashRaw.meta_prazo_entrega_dias} dias`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Cadeia frio adequada"       value={`${dashRaw.cadeia_frio_salas_adequadas}/${dashRaw.cadeia_frio_salas_total}`} color={CRIT} sub="salas certificadas PNI" />
              <KPI label="Frete Manaus (R$/kg)"       value={`R$ ${dashRaw.custo_frete_manaus_R_kg.toFixed(2)}`} color={CRIT} sub={`vs nacional: R$ ${dashRaw.custo_frete_nacional_R_kg.toFixed(2)}`} />
              <KPI label="Ramais intransit. (chuvoso)" value={`${dashRaw.ramais_intransitaveis_chuvoso_pct}%`} color={CRIT} sub="4 meses/ano inacessíveis" />
              <KPI label="Energia — interrupções/mês" value={`${dashRaw.energia_eletrica_interrupção_horas_mes}h`} color={WARN} sub="impacta cadeia frio" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Logística — Pontos Críticos</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Frota operacional (meta 95%)",         value: dashRaw.frota_operacional_pct,            color: CRIT, display: `${dashRaw.frota_operacional_pct}%` },
                    { label: "Cadeia frio adequada (meta 100%)",      value: dashRaw.cadeia_frio_salas_adequadas / dashRaw.cadeia_frio_salas_total * 100, color: CRIT, display: `${dashRaw.cadeia_frio_salas_adequadas}/${dashRaw.cadeia_frio_salas_total} salas` },
                    { label: "Medicamentos sem ruptura (meta 98%)",   value: 100 - dashRaw.medicamentos_ruptura_estoque_pct, color: WARN, display: `${100 - dashRaw.medicamentos_ruptura_estoque_pct}%` },
                    { label: "Ramais transitáveis (ano inteiro)",     value: 100 - dashRaw.ramais_intransitaveis_chuvoso_pct, color: CRIT, display: `${100 - dashRaw.ramais_intransitaveis_chuvoso_pct}%` },
                  ].map((b: any) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-bold" style={{ color: b.color }}>{b.display}</span>
                      </div>
                      <ProgressBar value={b.value} max={100} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>5/12 veículos parados</b> — sem manutenção preventiva, frota deteriora continuamente. Custo de recuperar veículo degradado é 3-4x maior do que manter preventivamente. Sem ambulância UTI-móvel: transfer de UTI em veículo comum = 5-8h sem monitoramento.</p>
                <p><b>Frete Manaus 4x o nacional</b> — R$ 4,80/kg vs R$ 1,20 nacional. Medicamento de cadeia fria: frete aéreo exclusivo (R$ 28/kg). Custo logístico representa 28-40% do custo final do insumo em Apuí. Compra em conjunto com Humaitá e municípios vizinhos poderia reduzir 35% do custo.</p>
                <p><b>48h de falta de energia/mês</b> — 4/4 UBS rurais com gerador, mas gerador depende de combustível. 2023: 72h sem combustível = cadeia frio desligada = vacinas perdidas. Cadeia frio: 3/8 salas inadequadas = vacina com eficácia não garantida.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "rotas" && Array.isArray(rotas) && (
          <div className="grid gap-3">
            {(rotas as any[]).map((r: any) => (
              <div key={r.rota} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(r.status) }} />
                    <div>
                      <p className="font-semibold text-sm text-slate-700">{r.rota}</p>
                      <p className="text-xs text-slate-400">{r.distancia_km} km · {r.modal} · {r.tempo_horas}h</p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: BRAND }}>R$ {r.custo_referencia_R}</span>
                    <p className="text-xs" style={{ color: r.restricao_chuvoso ? CRIT : OK }}>
                      {r.restricao_chuvoso ? "Restrição no chuvoso" : "Sem restrição sazonal"}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{r.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "insumos" && Array.isArray(insumos) && (
          <div className="space-y-3">
            {(insumos as any[]).map((ins: any) => (
              <div key={ins.insumo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(ins.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{ins.insumo}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: statusColor(ins.status) }}>{ins.cobertura_pct}% cobertura</span>
                    <p className="text-xs text-slate-400">Prazo: {ins.prazo_entrega_dias}d · Ruptura: {ins.ruptura_media_dias_ano}d/ano</p>
                  </div>
                </div>
                <div className="ml-5 mb-2">
                  <ProgressBar value={ins.cobertura_pct} max={100} color={statusColor(ins.status)} />
                </div>
                <p className="text-xs text-slate-500 ml-5">{ins.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Logística — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="frota_operacional_pct"  name="Frota operacional (%)"   stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="ruptura_estoque_pct"    name="Ruptura estoque (%)"      stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="prazo_entrega_dias"     name="Prazo entrega (dias)"     stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
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
