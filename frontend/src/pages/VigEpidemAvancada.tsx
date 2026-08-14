import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { AlertTriangle, Activity, BookOpen, ClipboardList } from "lucide-react";

const BRAND  = "#7c2d12";
const ACCENT = "#ea580c";
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

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  ativo:         { bg: "#fef2f2", text: CRIT,  label: "ATIVO" },
  encerrado:     { bg: "#f0fdf4", text: OK,    label: "Encerrado" },
  em_andamento:  { bg: "#fefce8", text: WARN,  label: "Em Andamento" },
};

export default function VigEpidemAvancada() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["vea-dashboard"],
    queryFn: () => apiGet("/api/vig-epidem-avancada/dashboard"),
    enabled: aba === "dashboard",
  });
  const { data: surtos } = useQuery({
    queryKey: ["vea-surtos"],
    queryFn: () => apiGet("/api/vig-epidem-avancada/surtos"),
    enabled: aba === "surtos",
  });
  const { data: boletim } = useQuery({
    queryKey: ["vea-boletim"],
    queryFn: () => apiGet("/api/vig-epidem-avancada/boletim-semanal"),
    enabled: aba === "boletim",
  });
  const { data: sinan } = useQuery({
    queryKey: ["vea-sinan"],
    queryFn: () => apiGet("/api/vig-epidem-avancada/sinan-agravos"),
    enabled: aba === "sinan",
  });
  const { data: historico } = useQuery({
    queryKey: ["vea-historico"],
    queryFn: () => apiGet("/api/vig-epidem-avancada/historico"),
    enabled: aba === "historico",
  });
  const { data: indicadores } = useQuery({
    queryKey: ["vea-indicadores"],
    queryFn: () => apiGet("/api/vig-epidem-avancada/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",    icon: <AlertTriangle size={15}/> },
    { key: "surtos",     label: "Surtos",        icon: <AlertTriangle size={15}/> },
    { key: "boletim",    label: "Boletim Semanal", icon: <BookOpen size={15}/> },
    { key: "sinan",      label: "SINAN",         icon: <ClipboardList size={15}/> },
    { key: "historico",  label: "Histórico",     icon: <Activity size={15}/> },
    { key: "indicadores",label: "Indicadores",   icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <AlertTriangle size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Vigilância Epidemiológica Avançada</h1>
            <p className="text-sm text-slate-500">Surtos · SINAN · Boletim Semanal · CIEVS · FMS Apuí/AM</p>
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
              <KPI label="Surtos Ativos"           value={dashRaw.surtos_ativos.toString()}             color={dashRaw.surtos_ativos > 0 ? CRIT : OK} />
              <KPI label="Notificações/Mês"        value={dashRaw.notificacoes_mes?.toLocaleString()}    color={ACCENT} />
              <KPI label="Pendentes >60d"          value={dashRaw.notificacoes_pendentes_60d.toString()} color={CRIT} sub="aguardando encerramento" />
              <KPI label="Encerramento Oportuno"   value={`${dashRaw.encerramento_oportuno_pct}%`}      color={dashRaw.encerramento_oportuno_pct >= 90 ? OK : CRIT} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Agravos Monitorados"     value={dashRaw.agravos_monitorados.toString()} />
              <KPI label="Surtos Encerrados/Ano"   value={dashRaw.surtos_encerrados_ano.toString()} color={OK} />
              <KPI label="Boletins/Semestre"       value={dashRaw.boletins_emitidos_semestre.toString()} color={OK} sub="semanal em dia" />
              <KPI label="Casos Confirmados SE Atual" value={dashRaw.casos_confirmados_semana_atual.toString()} color={WARN} />
            </div>
            {dashRaw.surtos_ativos > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
                <b>{dashRaw.surtos_ativos} surto(s) ativo(s)</b> em investigação. {dashRaw.notificacoes_pendentes_60d} notificações SINAN com encerramento pendente acima de 60 dias — sífilis, malária e tuberculose concentram os atrasos.
              </div>
            )}
          </div>
        )}

        {aba === "surtos" && Array.isArray(surtos) && (
          <div className="grid gap-4">
            {(surtos as any[]).map((s: any) => {
              const badge = STATUS_BADGE[s.status] || STATUS_BADGE["em_andamento"];
              return (
                <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{s.agravo}</span>
                        <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ background: badge.bg, color: badge.text }}>{badge.label}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{s.id} · Início: {s.data_inicio} · {s.bairro}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg" style={{ color: CRIT }}>{s.casos_confirmados}</p>
                      <p className="text-xs text-slate-500">confirmados</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Causa provável</p>
                      <p className="text-sm font-medium text-slate-700">{s.causa_provavel}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Medidas adotadas</p>
                      <ul className="text-xs text-slate-700 space-y-0.5">
                        {s.medidas.map((m: string) => <li key={m}>• {m}</li>)}
                      </ul>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>Suspeitos: <b>{s.casos_suspeitos}</b></span>
                    <span>Óbitos: <b style={{ color: s.obitos > 0 ? CRIT : "inherit" }}>{s.obitos}</b></span>
                    <span>Investigação: <b style={{ color: s.investigacao === "concluida" ? OK : WARN }}>
                      {s.investigacao === "concluida" ? "Concluída" : "Em andamento"}
                    </b></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {aba === "boletim" && Array.isArray(boletim) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Notificações por Semana Epidemiológica (2026)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={boletim} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis dataKey="semana" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="malaria"    name="Malária"     fill="#7c3aed" stackId="a" />
                  <Bar dataKey="dengue"     name="Dengue"      fill={CRIT}    stackId="a" />
                  <Bar dataKey="influenza"  name="Influenza"   fill={WARN}    stackId="a" />
                  <Bar dataKey="dda"        name="DDA"         fill={ACCENT}  stackId="a" />
                  <Bar dataKey="leptospirose" name="Leptospirose" fill="#0891b2" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs bg-white rounded-xl border border-slate-200 shadow-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Semana","Dengue","Malária","Leptospirose","Hep. A","Influenza","DDA","Total"].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-slate-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(boletim as any[]).map((row: any) => (
                    <tr key={row.semana} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-3 py-2 font-semibold text-slate-700">{row.semana}</td>
                      <td className="px-3 py-2" style={{ color: row.dengue > 2 ? CRIT : "inherit" }}>{row.dengue}</td>
                      <td className="px-3 py-2" style={{ color: row.malaria > 5 ? CRIT : row.malaria > 3 ? WARN : "inherit" }}>{row.malaria}</td>
                      <td className="px-3 py-2">{row.leptospirose}</td>
                      <td className="px-3 py-2">{row.hepatite_a}</td>
                      <td className="px-3 py-2" style={{ color: row.influenza > 10 ? CRIT : "inherit" }}>{row.influenza}</td>
                      <td className="px-3 py-2" style={{ color: row.dda > 90 ? WARN : "inherit" }}>{row.dda}</td>
                      <td className="px-3 py-2 font-bold">{row.total_notificacoes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {aba === "sinan" && Array.isArray(sinan) && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Encerramento Oportuno ≤60d por Agravo (%)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sinan} layout="vertical" margin={{ left: 10, right: 40 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} unit="%" />
                  <YAxis type="category" dataKey="agravo" tick={{ fontSize: 9 }} width={220} />
                  <Tooltip />
                  <Bar dataKey="encerrados_60d_pct" name="Encerrados ≤60d %" fill={ACCENT} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(sinan as any[]).map((ag: any) => (
                <div key={ag.agravo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: statusColor(ag.status) }} />
                    <span className="font-semibold text-slate-700 text-sm">{ag.agravo}</span>
                    <span className="text-xs text-slate-400">{ag.codigo}</span>
                  </div>
                  <div className="flex gap-6 text-xs text-slate-500">
                    <span>Notif.: <b>{ag.notificacoes_ano}</b></span>
                    <span>Confirm.: <b>{ag.confirmados}</b></span>
                    <span style={{ color: ag.pendentes > 5 ? CRIT : ag.pendentes > 0 ? WARN : OK }}>Pendentes: <b>{ag.pendentes}</b></span>
                    <span style={{ color: statusColor(ag.status) }}>Encerr. ≤60d: <b>{ag.encerrados_60d_pct}%</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal (2026)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" domain={[70, 95]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="total_notificacoes"      name="Notificações"          stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="surtos_novos"            name="Surtos Novos"          stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="encerrados_oportuno_pct" name="Encerr. Oportuno %"    stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
                      {`${ind.valor} ${ind.unidade}`}{ind.meta != null ? ` / meta: ${ind.meta} ${ind.unidade}` : ""}
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
