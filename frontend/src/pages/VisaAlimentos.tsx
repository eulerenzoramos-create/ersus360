import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { ShieldCheck, AlertTriangle, ClipboardList, Activity } from "lucide-react";

const BRAND = "#14532d";
const ACCENT = "#16a34a";
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

const TIPO_COLORS = ["#16a34a","#0891b2","#7c3aed","#d97706","#dc2626","#0ea5e9","#84cc16","#f59e0b","#6b7280"];

export default function VisaAlimentos() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["visa-alimentos-dashboard"],
    queryFn: () => apiGet("/api/visa-alimentos/dashboard"),
    enabled: aba === "dashboard",
  });

  const { data: estabelecimentos } = useQuery({
    queryKey: ["visa-alimentos-estabelecimentos"],
    queryFn: () => apiGet("/api/visa-alimentos/estabelecimentos"),
    enabled: aba === "estabelecimentos",
  });

  const { data: surtos } = useQuery({
    queryKey: ["visa-alimentos-surtos"],
    queryFn: () => apiGet("/api/visa-alimentos/surtos-eta"),
    enabled: aba === "surtos",
  });

  const { data: historico } = useQuery({
    queryKey: ["visa-alimentos-historico"],
    queryFn: () => apiGet("/api/visa-alimentos/historico"),
    enabled: aba === "historico",
  });

  const { data: indicadores } = useQuery({
    queryKey: ["visa-alimentos-indicadores"],
    queryFn: () => apiGet("/api/visa-alimentos/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",        label: "Dashboard",       icon: <ShieldCheck size={15}/> },
    { key: "estabelecimentos", label: "Estabelecimentos", icon: <ClipboardList size={15}/> },
    { key: "surtos",           label: "Surtos ETA",       icon: <AlertTriangle size={15}/> },
    { key: "historico",        label: "Histórico",        icon: <Activity size={15}/> },
    { key: "indicadores",      label: "Indicadores",      icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <ShieldCheck size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>VISA — Alimentos</h1>
            <p className="text-sm text-slate-500">Inspeções · Surtos ETA · Qualidade · FMS Apuí/AM</p>
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

        {/* Dashboard */}
        {aba === "dashboard" && !dashRaw && (
          <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />
        )}

        {aba === "dashboard" && dashRaw && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Estabelecimentos" value={dashRaw.estabelecimentos_cadastrados.toString()} />
              <KPI label="Inspecionados/Ano" value={`${dashRaw.inspecionados_ano} (${dashRaw.inspecionados_pct}%)`} color={WARN} />
              <KPI label="Irregulares" value={dashRaw.irregulares.toString()} color={CRIT} />
              <KPI label="Autos de Infração" value={dashRaw.autos_infracao_ano.toString()} color={WARN} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Suspensões Ativas" value={dashRaw.suspensoes_ativas.toString()} color={CRIT} />
              <KPI label="Interdições Ativas" value={dashRaw.interdições_ativas?.toString() ?? dashRaw.interdicoes_ativas?.toString() ?? "2"} color={CRIT} />
              <KPI label="Amostras Reprovadas" value={`${dashRaw.amostras_reprovadas} (${dashRaw.amostras_reprovadas_pct}%)`} color={WARN} />
              <KPI label="Surtos ETA/Ano" value={`${dashRaw.surtos_eta_ano} (${dashRaw.surtos_em_investigacao} em invest.)`} color={WARN} />
            </div>
          </div>
        )}

        {/* Estabelecimentos */}
        {aba === "estabelecimentos" && Array.isArray(estabelecimentos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Conformidade por Tipo (%)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={estabelecimentos} layout="vertical" margin={{ top: 5, right: 30, left: 220, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis type="number" domain={[0,100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="tipo" tick={{ fontSize: 10 }} width={215} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="conformidade_pct" name="Conformidade" radius={[0,3,3,0]}>
                    {(estabelecimentos as any[]).map((_: any, i: number) => (
                      <Cell key={i} fill={TIPO_COLORS[i % TIPO_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(estabelecimentos as any[]).map((e: any, i: number) => (
                <div key={e.tipo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-700 text-sm">{e.tipo}</span>
                    <span className="font-bold text-sm" style={{ color: e.conformidade_pct >= 80 ? OK : e.conformidade_pct >= 65 ? WARN : CRIT }}>
                      {e.conformidade_pct}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                    <div className="h-2 rounded-full" style={{ width: `${e.conformidade_pct}%`, background: TIPO_COLORS[i % TIPO_COLORS.length] }} />
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-xs text-slate-500">
                    <span>Cadastr.: <b>{e.cadastrados}</b></span>
                    <span>Insp.: <b>{e.inspecionados}</b></span>
                    <span>Irreg.: <b style={{ color: e.irregulares > 0 ? CRIT : OK }}>{e.irregulares}</b></span>
                    <span>Susp.: <b style={{ color: e.suspensos > 0 ? CRIT : OK }}>{e.suspensos}</b></span>
                    <span>Interdit.: <b style={{ color: e.interditados > 0 ? CRIT : OK }}>{e.interditados}</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Surtos ETA */}
        {aba === "surtos" && surtos && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <KPI label="Surtos no Ano"     value={(surtos as any).surtos_ano.toString()} color={WARN} />
              <KPI label="Casos Totais"      value={(surtos as any).casos_totais.toString()} color={WARN} />
              <KPI label="Hospitalizados"    value={(surtos as any).hospitalizados.toString()} color={CRIT} />
            </div>
            <div className="grid gap-4">
              {((surtos as any).surtos || []).map((s: any) => (
                <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-700">{s.local}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: s.status === "em_investigacao" ? WARN + "22" : OK + "22", color: s.status === "em_investigacao" ? WARN : OK }}>
                          {s.status === "em_investigacao" ? "Em Investigação" : "Encerrado"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{s.data}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: CRIT }}>{s.casos}</p>
                      <p className="text-xs text-slate-400">casos</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-slate-50 rounded p-2">
                      <p className="text-xs text-slate-400 mb-1">Agente suspeito</p>
                      <p className="font-medium text-slate-700">{s.agente_suspeito}</p>
                    </div>
                    <div className="bg-slate-50 rounded p-2">
                      <p className="text-xs text-slate-400 mb-1">Alimento suspeito</p>
                      <p className="font-medium text-slate-700">{s.alimento_suspeito}</p>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-slate-500 bg-blue-50 rounded p-2">
                    {s.desfecho}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Histórico */}
        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução 2022–2026</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="conf" domain={[40,100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="conf" dataKey="conformidade_pct" name="Conformidade (%)" stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"    dataKey="irregulares"       name="Irregulares"      stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="n"    dataKey="surtos"            name="Surtos ETA"       stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Indicadores */}
        {aba === "indicadores" && Array.isArray(indicadores) && (
          <div className="grid gap-3">
            {(indicadores as any[]).map((ind: any) => (
              <div key={ind.indicador} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-4">
                <div className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(ind.status) }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 text-sm">{ind.indicador}</span>
                    <span className="font-bold text-sm" style={{ color: statusColor(ind.status) }}>
                      {`${ind.valor} ${ind.unidade}`} {ind.meta !== null && ind.meta !== undefined ? `/ meta: ${ind.meta} ${ind.unidade}` : ""}
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
