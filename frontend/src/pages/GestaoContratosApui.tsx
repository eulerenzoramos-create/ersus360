import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Clipboard, AlertTriangle, Activity, TrendingUp } from "lucide-react";

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

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

export default function GestaoContratosApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["gc-dashboard"], queryFn: () => apiGet("/api/gestao-contratos-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: contratos }   = useQuery({ queryKey: ["gc-contr"],     queryFn: () => apiGet("/api/gestao-contratos-apui/contratos"),   enabled: aba === "contratos" });
  const { data: convenios }   = useQuery({ queryKey: ["gc-conv"],      queryFn: () => apiGet("/api/gestao-contratos-apui/convenios"),   enabled: aba === "convenios" });
  const { data: historico }   = useQuery({ queryKey: ["gc-hist"],      queryFn: () => apiGet("/api/gestao-contratos-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["gc-ind"],       queryFn: () => apiGet("/api/gestao-contratos-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Clipboard size={15}/> },
    { key: "contratos",   label: "Contratos",  icon: <Activity size={15}/> },
    { key: "convenios",   label: "Convênios",  icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Clipboard size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Gestão de Contratos — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Contratos SUS · Convênios Federais · FNS · Prestadores · FMS Apuí/AM</p>
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
              <KPI label="Contratos ativos"      value={dashRaw.contratos_ativos.toString()}          color={BRAND} />
              <KPI label="Convênios federais"    value={dashRaw.convenios_federais.toString()}         color={ACCENT} />
              <KPI label="Contratos irregulares" value={`${dashRaw.contratos_irregulares} (${dashRaw.contratos_irregulares_pct}%)`} color={WARN} sub="meta: < 5%" />
              <KPI label="Contratos vencidos"    value={dashRaw.contratos_vencidos.toString()}         color={CRIT} sub="sem cobertura legal" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Processamento médio"   value={`${dashRaw.tempo_processamento_medio_dias} dias`} color={WARN} sub={`meta: ${dashRaw.meta_processamento_dias} dias`} />
              <KPI label="Repasse FNS/ano"       value={fmt(dashRaw.transferencias_fns_anual)}          color={OK} />
              <KPI label="Repasse SES/AM"        value={fmt(dashRaw.transferencias_estado_anual)}        color={ACCENT} />
              <KPI label="Vencendo em 90 dias"   value={dashRaw.contratos_vencendo_90d.toString()}       color={WARN} sub="atenção para renovação" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Situação dos Contratos Ativos</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={[
                    { status: "Regulares",   qtd: dashRaw.contratos_ativos - dashRaw.contratos_irregulares - dashRaw.contratos_vencidos },
                    { status: "Irregulares", qtd: dashRaw.contratos_irregulares },
                    { status: "Vencidos",    qtd: dashRaw.contratos_vencidos },
                    { status: "Vencendo 90d",qtd: dashRaw.contratos_vencendo_90d },
                  ]} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                    <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => `${v} contratos`} />
                    <Bar dataKey="qtd" name="Contratos" radius={[3,3,0,0]}>
                      <Cell fill={OK} />
                      <Cell fill={WARN} />
                      <Cell fill={CRIT} />
                      <Cell fill={WARN} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex flex-col gap-2 justify-center">
                <p><b>4 contratos vencidos</b> — serviços prestados sem cobertura jurídica. Risco de impugnação e devolução de recursos ao FNS.</p>
                <p><b>Tempo médio de 18,4 dias</b> para processar contratos — 84% acima do prazo legal de 10 dias. Gargalo na análise jurídica da Procuradoria Municipal.</p>
                <p><b>FUNASA com prestação de contas pendente</b> — risco de bloqueio de repasse de R$ 284.000 de saneamento em áreas rurais.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "contratos" && Array.isArray(contratos) && (
          <div className="grid gap-3">
            {(contratos as any[]).map((c: any, i: number) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {c.status === "vencido"   && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">VENCIDO</span>}
                      {c.status === "vencendo"  && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold">VENCENDO</span>}
                      {c.status === "vigente"   && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">VIGENTE</span>}
                      {c.irregularidade && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-bold">IRREGULARIDADE</span>}
                      <span className="font-semibold text-sm text-slate-700">{c.contrato}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-slate-400">
                      <span>Contratado: {c.contratado}</span>
                      <span>Valor: {fmt(c.valor_anual)}/ano</span>
                      <span>Vigência: {c.vigencia}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "convenios" && Array.isArray(convenios) && (
          <div className="grid gap-3">
            {(convenios as any[]).map((cv: any, i: number) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ background: statusColor(cv.status) }} />
                    <div>
                      <span className="font-semibold text-sm text-slate-700">{cv.convenio}</span>
                      <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                        <span>{cv.orgao}</span>
                        <span>{cv.vigencia}</span>
                        <span className="font-medium text-slate-600">{fmt(cv.repasse_anual)}/ano</span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: statusColor(cv.status) }}>{cv.situacao}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Gestão de Contratos (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="contratos_ativos"   name="Contratos ativos"    stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="convenios"          name="Convênios"            stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="irregulares_pct"    name="Irregulares %"        stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="n"   dataKey="processamento_dias" name="Processamento (dias)" stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
                      {typeof ind.valor === "number" && ind.valor > 100000
                        ? fmt(ind.valor)
                        : `${ind.valor} ${ind.unidade}`}
                      {ind.meta != null ? ` / meta: ${ind.meta}` : ""}
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
