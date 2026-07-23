import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Globe, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function RegulacaoEspecializadaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["reg-dashboard"], queryFn: () => apiGet("/api/regulacao-especializada-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: fila }        = useQuery({ queryKey: ["reg-fila"],      queryFn: () => apiGet("/api/regulacao-especializada-apui/fila"),        enabled: aba === "fila" });
  const { data: tfd }         = useQuery({ queryKey: ["reg-tfd"],       queryFn: () => apiGet("/api/regulacao-especializada-apui/tfd"),         enabled: aba === "tfd" });
  const { data: historico }   = useQuery({ queryKey: ["reg-hist"],      queryFn: () => apiGet("/api/regulacao-especializada-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["reg-ind"],       queryFn: () => apiGet("/api/regulacao-especializada-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",       icon: <Globe size={15}/> },
    { key: "fila",       label: "Fila de Espera",  icon: <Activity size={15}/> },
    { key: "tfd",        label: "TFD",             icon: <AlertTriangle size={15}/> },
    { key: "historico",  label: "Histórico",       icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores",     icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Globe size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Regulação / Acesso Especializado — Apuí/AM</h1>
            <p className="text-sm text-slate-500">SISREG · Fila de Espera · TFD · Referências · FMS Apuí/AM</p>
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
              <KPI label="Fila Total"              value={dashRaw.pacientes_fila_especialidades.toLocaleString()} color={CRIT} sub="pacientes aguardando" />
              <KPI label="Tempo Médio Espera"      value={`${dashRaw.tempo_medio_espera_dias} dias`}              color={CRIT} sub={`meta: ${dashRaw.meta_espera_dias} dias`} />
              <KPI label="TFD / Mês"               value={dashRaw.tfd_pacientes_mes.toString()}                   color={CRIT} sub="deslocamentos p/ Manaus" />
              <KPI label="Custo TFD / Mês"         value={`R$ ${(dashRaw.tfd_custo_mensal_R/1000).toFixed(0)}k`}  color={CRIT} sub="maior despesa SMS s/ folha" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Especialidades Dispon."  value={`${dashRaw.especialidades_disponiveis_municipio}/${dashRaw.especialidades_necessarias_municipio}`} color={CRIT} sub="no município" />
              <KPI label="SISREG Regulados"        value={`${dashRaw.sisreg_regulados_pct}%`}         color={WARN} sub={`meta: ${dashRaw.meta_sisreg_pct}%`} />
              <KPI label="TFD sem Resolução"       value={`${dashRaw.retorno_tfd_sem_resolucao_pct}%`} color={CRIT} sub="retornam sem resolução" />
              <KPI label="Encam. Não Respondidos"  value={`${dashRaw.encaminhamentos_nao_respondidos_pct}%`} color={CRIT} sub="sem retorno ao município" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Indicadores Regulação</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: "SISREG regulados (meta 90%)",        value: dashRaw.sisreg_regulados_pct,               meta: 90,  color: WARN },
                    { label: "Encaminhamentos respondidos",         value: 100 - dashRaw.encaminhamentos_nao_respondidos_pct, meta: 90, color: CRIT },
                    { label: "TFD com resolução (meta 90%)",        value: 100 - dashRaw.retorno_tfd_sem_resolucao_pct,meta: 90,  color: CRIT },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-bold" style={{ color: b.color }}>{b.value.toFixed(1)}% / meta {b.meta}%</span>
                      </div>
                      <ProgressBar value={b.value} max={100} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>3 de 18 especialidades no município</b> — 83,3% da atenção especializada depende de Manaus (784 km). Fila de 1.284 pacientes crescendo 12%/semestre. Sem perspectiva de resolução sem consórcio intermunicipal.</p>
                <p><b>Custo TFD: R$ 284k/mês</b> — maior despesa da SMS após folha de pagamento. R$ 3,4 milhões/ano em deslocamentos, sem contrapartida de telemedicina ou telediagnóstico para reduzir viagens evitáveis.</p>
                <p><b>28,4% retornam sem resolução</b> — custo TFD despendido sem benefício clínico. Causa principal: exame pré-requisito não realizado antes da consulta. Contrarreferência inexistente na prática.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "fila" && Array.isArray(fila) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Fila por Especialidade — Tempo de Espera (dias)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={fila as any[]} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="especialidade" tick={{ fontSize: 9 }} width={160} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip />
                  <Bar dataKey="tempo_espera_dias" name="Espera (dias)" radius={[0,3,3,0]}>
                    {(fila as any[]).map((f: any) => <Cell key={f.especialidade} fill={statusColor(f.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(fila as any[]).map((f: any) => (
                <div key={f.especialidade} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: statusColor(f.status) }} />
                    <span className="font-semibold text-sm text-slate-700">{f.especialidade}</span>
                    {f.disponivel_municipio && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">Municipal</span>
                    )}
                  </div>
                  <div className="text-xs text-right space-y-0.5">
                    <div>Fila: <span className="font-bold">{f.fila}</span> | Espera: <span className="font-bold" style={{ color: statusColor(f.status) }}>{f.tempo_espera_dias}d</span> / meta {f.meta_dias}d</div>
                    <div className="text-slate-400">Ref.: {f.referencia}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "tfd" && Array.isArray(tfd) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">TFD — Pacientes/Mês por Motivo</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={tfd as any[]} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="motivo" tick={{ fontSize: 8 }} width={280} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip />
                  <Bar dataKey="pacientes_mes" name="Pacientes/mês" radius={[0,3,3,0]}>
                    {(tfd as any[]).map((t: any) => <Cell key={t.motivo} fill={statusColor(t.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(tfd as any[]).map((t: any) => (
                <div key={t.motivo} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: statusColor(t.status) }} />
                    <span className="font-semibold text-sm text-slate-700">{t.motivo}</span>
                  </div>
                  <div className="text-xs text-right space-y-0.5">
                    <div><span className="font-bold">{t.pacientes_mes}</span> pcts | R$ {t.custo_medio_R.toLocaleString()}/viagem | {t.dias_deslocamento}d</div>
                    <div>Resolvido: <span className="font-bold" style={{ color: t.retorno_resolvido_pct >= 80 ? OK : WARN }}>{t.retorno_resolvido_pct}%</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal — Regulação / TFD (2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="n" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="fila_total"        name="Fila total"         stroke={CRIT}   strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="n"   dataKey="tempo_espera_dias" name="Espera (dias)"      stroke={WARN}   strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="n"   dataKey="tfd_pacientes"     name="TFD pacientes"      stroke={BRAND}  strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
                <Line yAxisId="pct" dataKey="sisreg_pct"        name="SISREG regulados (%)"stroke={ACCENT} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
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
