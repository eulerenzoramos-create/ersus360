import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { ShieldCheck, AlertTriangle, Activity, TrendingUp } from "lucide-react";

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

export default function PoliticaPrevencaoApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["pp-dashboard"], queryFn: () => apiGet("/api/politica-prevencao-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: rastreios }   = useQuery({ queryKey: ["pp-rast"],      queryFn: () => apiGet("/api/politica-prevencao-apui/rastreios"),   enabled: aba === "rastreios" });
  const { data: programas }   = useQuery({ queryKey: ["pp-prog"],      queryFn: () => apiGet("/api/politica-prevencao-apui/programas"),   enabled: aba === "programas" });
  const { data: historico }   = useQuery({ queryKey: ["pp-hist"],      queryFn: () => apiGet("/api/politica-prevencao-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["pp-ind"],       queryFn: () => apiGet("/api/politica-prevencao-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <ShieldCheck size={15}/> },
    { key: "rastreios",   label: "Rastreios",  icon: <Activity size={15}/> },
    { key: "programas",   label: "Programas",  icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <ShieldCheck size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Política de Prevenção — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Rastreios · PNCT · PAAS · Prevenção Primária · FMS Apuí/AM</p>
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
              <KPI label="Rastreios ativos"       value={dashRaw.rastreios_ativos.toString()}         color={BRAND} sub={`${dashRaw.rastreios_na_meta} na meta`} />
              <KPI label="Cobertura média"        value={`${dashRaw.cobertura_media_rastreios_pct}%`} color={WARN}  sub="meta: 80%" />
              <KPI label="Preventivo colo útero" value={`${dashRaw.preventivo_colo_pct}%`}           color={WARN}  sub={`meta: ${dashRaw.meta_preventivo_pct}%`} />
              <KPI label="Mamografia local"       value="NÃO"                                         color={CRIT}  sub={`Espera: ${dashRaw.mamografia_espera_meses} meses`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Rastreio DM"            value={`${dashRaw.rastreio_dm_pct}%`}    color={CRIT}  sub="meta: 90%" />
              <KPI label="Rastreio HAS"           value={`${dashRaw.rastreio_has_pct}%`}   color={WARN}  sub="meta: 90%" />
              <KPI label="Cessação tabagismo"     value={`${dashRaw.tabagismo_cessacao_pct}%`} color={CRIT} sub="meta: 50%" />
              <KPI label="Consultas preventivas" value={`${dashRaw.consultas_preventivas_pct}%`} color={CRIT} sub="do total de consultas" />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-3">Cobertura por Programa de Rastreio</h3>
              <div className="space-y-3">
                {[
                  { label: "Preventivo câncer de colo",  value: dashRaw.preventivo_colo_pct,     meta: 80, color: WARN },
                  { label: "Rastreio HAS",               value: dashRaw.rastreio_has_pct,         meta: 90, color: WARN },
                  { label: "Rastreio DM",                value: dashRaw.rastreio_dm_pct,          meta: 90, color: CRIT },
                  { label: "Mamografia (via regulação)", value: 34.2,                              meta: 70, color: CRIT },
                  { label: "Saúde bucal preventiva",     value: dashRaw.consultas_preventivas_pct,meta: 80, color: CRIT },
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
          </div>
        )}

        {aba === "rastreios" && Array.isArray(rastreios) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Cobertura dos Programas de Rastreio (%)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={(rastreios as any[]).map((r: any) => ({
                    prog: r.programa.substring(0, 28), cobertura: r.cobertura_pct, meta: r.meta_pct
                  }))}
                  layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="prog" tick={{ fontSize: 7 }} width={230} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="cobertura" name="Cobertura atual" radius={[0,3,3,0]}>
                    {(rastreios as any[]).map((r: any) => <Cell key={r.programa} fill={statusColor(r.status)} />)}
                  </Bar>
                  <Bar dataKey="meta" name="Meta" fill="#374151" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(rastreios as any[]).map((r: any) => (
                <div key={r.programa} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ background: statusColor(r.status) }} />
                      <span className="font-semibold text-sm text-slate-700">{r.programa}</span>
                    </div>
                    <span className="text-xs font-bold flex-shrink-0" style={{ color: statusColor(r.status) }}>
                      {r.cobertura_pct}% / {r.meta_pct}%
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-slate-400 ml-5">
                    <span>{r.periodicidade}</span>
                    {!r.disponivel_local && <span className="text-red-600 font-semibold">Sem equipamento local</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 ml-5">{r.obstaculo}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "programas" && Array.isArray(programas) && (
          <div className="grid gap-3">
            {(programas as any[]).map((p: any) => (
              <div key={p.programa} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: p.implantado ? OK : CRIT }} />
                    <div>
                      <span className="font-semibold text-sm text-slate-700">{p.programa}</span>
                      <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                        {p.grupos_ativos > 0 && <span>{p.grupos_ativos} grupo(s) ativo(s)</span>}
                        {p.pacientes && <span>{p.pacientes} pacientes</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    {p.medicamento_disponivel === false && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Sem medicamento</span>
                    )}
                    {!p.implantado && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">NÃO IMPLANTADO</span>
                    )}
                    {p.implantado && (
                      <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: statusColor(p.status) + "22", color: statusColor(p.status) }}>
                        {p.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Rastreios e Prevenção (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line dataKey="preventivo_pct"          name="Preventivo colo %"   stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="rastreio_has_pct"        name="Rastreio HAS %"      stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="rastreio_dm_pct"         name="Rastreio DM %"       stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="cessacao_tabagismo_pct"  name="Cessação tabagismo %" stroke={OK}    strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
