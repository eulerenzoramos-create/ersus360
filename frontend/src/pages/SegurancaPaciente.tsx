import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Shield, AlertTriangle, Activity, TrendingUp } from "lucide-react";

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

export default function SegurancaPaciente() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["sp-dashboard"],  queryFn: () => apiGet("/api/seguranca-paciente/dashboard"),       enabled: aba === "dashboard" });
  const { data: eventos }     = useQuery({ queryKey: ["sp-eventos"],    queryFn: () => apiGet("/api/seguranca-paciente/eventos-adversos"), enabled: aba === "eventos" });
  const { data: protocolos }  = useQuery({ queryKey: ["sp-protocolos"],queryFn: () => apiGet("/api/seguranca-paciente/protocolos"),       enabled: aba === "protocolos" });
  const { data: historico }   = useQuery({ queryKey: ["sp-historico"],  queryFn: () => apiGet("/api/seguranca-paciente/historico"),        enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["sp-ind"],        queryFn: () => apiGet("/api/seguranca-paciente/indicadores"),      enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",        icon: <Shield size={15}/> },
    { key: "eventos",    label: "Eventos Adversos", icon: <AlertTriangle size={15}/> },
    { key: "protocolos", label: "Protocolos NSP",   icon: <Activity size={15}/> },
    { key: "historico",  label: "Histórico",        icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores",      icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Shield size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Segurança do Paciente — Apuí/AM</h1>
            <p className="text-sm text-slate-500">NSP · Eventos Adversos · Protocolos OMS · PNSP · FMS Apuí/AM</p>
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
              <KPI label="NSP Implantados"         value={`${dashRaw.unidades_com_nsp}/${dashRaw.unidades_total}`} color={WARN} sub={`${dashRaw.nsp_implantado_pct}% das unidades`} />
              <KPI label="Eventos Adversos/Ano"    value={dashRaw.eventos_adversos_notificados_ano.toString()} color={WARN} />
              <KPI label="Eventos Graves/Ano"      value={dashRaw.eventos_graves_ano.toString()} color={CRIT} />
              <KPI label="Near Miss Notificados"   value={dashRaw.near_miss_notificados_ano.toString()} color={BRAND} sub="incidentes sem dano" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Infecção Hospitalar"     value={`${dashRaw.infeccao_hospitalar_taxa_pct}%`} color={WARN} sub={`meta: ${dashRaw.meta_infeccao_pct}%`} />
              <KPI label="Checklist Cirurgia Seg." value={`${dashRaw.cirurgia_segura_checklist_pct}%`} color={WARN} sub="meta: 100%" />
              <KPI label="Cultura de Segurança"   value={`${dashRaw.cultura_seguranca_score}/100`} color={WARN} sub={`meta: ${dashRaw.meta_cultura_score}`} />
              <KPI label="Erros de Medicação/Ano" value={dashRaw.erros_medicacao_notificados_ano.toString()} color={WARN} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cultura de Segurança</h3>
                <div className="flex items-center gap-4">
                  <div className="relative w-28 h-28 flex-shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#111827" strokeWidth="12" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke={WARN} strokeWidth="12"
                        strokeDasharray={`${dashRaw.cultura_seguranca_score * 2.513} 251.3`} strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xl font-bold" style={{ color: WARN }}>{dashRaw.cultura_seguranca_score}</span>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p><b>Score: {dashRaw.cultura_seguranca_score}/100</b></p>
                    <p className="text-xs text-slate-400 mt-1">Score &lt;60 indica cultura punitiva: profissionais relatam medo de notificar erros por temor de punição.</p>
                    <p className="text-xs mt-2" style={{ color: WARN }}>Meta: {dashRaw.meta_cultura_score} pontos</p>
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex flex-col gap-2 justify-center">
                <p><b>Comitê implantado em 2025:</b> ainda em fase de estruturação — equipe treinada, fluxo de notificação em implantação.</p>
                <p><b>Subnotificação estimada:</b> 40–60% dos eventos adversos não são notificados — cultura punitiva é a principal barreira.</p>
                <p><b>Dois protocolos críticos ausentes:</b> Úlcera por pressão e handoff seguro — risco para pacientes internados.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "eventos" && Array.isArray(eventos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Eventos Adversos por Categoria — 2025</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={(eventos as any[])} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="categoria" tick={{ fontSize: 9 }} width={240} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total_ano"  name="Total/ano" fill={WARN}   radius={[0,3,3,0]} />
                  <Bar dataKey="graves"     name="Graves"    fill={CRIT}   radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(eventos as any[]).map((e: any) => (
                <div key={e.categoria} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-slate-700">{e.categoria}</span>
                    <div className="flex gap-3 text-xs">
                      <span className="font-bold text-amber-700">{e.total_ano} total</span>
                      <span className="font-bold text-red-700">{e.graves} graves</span>
                      {e.obitos > 0 && <span className="font-bold text-red-900">{e.obitos} óbito</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-24 flex-shrink-0">Notificação:</span>
                    <ProgressBar value={e.notificacao_pct} max={100} color={statusColor(e.status)} />
                    <span className="text-xs w-10 text-right font-medium" style={{ color: statusColor(e.status) }}>{e.notificacao_pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "protocolos" && Array.isArray(protocolos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Adesão aos Protocolos de Segurança do Paciente</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={(protocolos as any[])} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="protocolo" tick={{ fontSize: 9 }} width={240} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="adesao_pct" name="Adesão" radius={[0,3,3,0]}>
                    {(protocolos as any[]).map((p: any) => <Cell key={p.protocolo} fill={statusColor(p.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(protocolos as any[]).map((p: any) => (
                <div key={p.protocolo} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${p.implantado ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {p.implantado ? "✓ Implantado" : "✗ Não implantado"}
                      </span>
                      <span className="font-semibold text-sm text-slate-700">{p.protocolo}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: statusColor(p.status) }}>
                      {p.implantado ? `${p.adesao_pct}% / meta ${p.meta_pct}%` : "—"}
                    </span>
                  </div>
                  {p.implantado && <ProgressBar value={p.adesao_pct} max={100} color={statusColor(p.status)} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal — Segurança do Paciente (Jan–Jun/2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="eventos"    name="Eventos adversos"  stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="graves"     name="Graves"            stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="near_miss"  name="Near miss"         stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="infec_hosp" name="Infecção hosp. %"  stroke="#7c2d12" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="pct" dataKey="checklist"  name="Checklist %"       stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
