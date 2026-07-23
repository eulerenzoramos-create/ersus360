import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Clock, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

const CAUSA_COLORS: Record<string, string> = {
  "Trauma / acidente (moto/garimpo)":   CRIT,
  "Parto e complicações obstétricas":    "#e11d48",
  "Malária grave / complicações":         WARN,
  "Infecção respiratória grave":          ACCENT,
  "Acidente ofídico / animal peçonhento": "#7c3aed",
  "DCNT em crise (HAS/DM/IAM)":          "#0891b2",
  "Intoxicação / envenenamento":          "#6b7280",
  "Outros / não classificados":           "#6b7280",
};

export default function UrgenciaEmergenciaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["ue-dashboard"],  queryFn: () => apiGet("/api/urgencia-emergencia-apui/dashboard"),    enabled: aba === "dashboard" });
  const { data: causas }      = useQuery({ queryKey: ["ue-causas"],     queryFn: () => apiGet("/api/urgencia-emergencia-apui/causas"),        enabled: aba === "causas" });
  const { data: transf }      = useQuery({ queryKey: ["ue-transf"],     queryFn: () => apiGet("/api/urgencia-emergencia-apui/transferencias"),enabled: aba === "transferencias" });
  const { data: historico }   = useQuery({ queryKey: ["ue-hist"],       queryFn: () => apiGet("/api/urgencia-emergencia-apui/historico"),     enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["ue-ind"],        queryFn: () => apiGet("/api/urgencia-emergencia-apui/indicadores"),   enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",      label: "Dashboard",       icon: <Clock size={15}/> },
    { key: "causas",         label: "Causas",          icon: <Activity size={15}/> },
    { key: "transferencias", label: "Transferências",  icon: <AlertTriangle size={15}/> },
    { key: "historico",      label: "Histórico",       icon: <TrendingUp size={15}/> },
    { key: "indicadores",    label: "Indicadores",     icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Clock size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Urgência e Emergência — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Hospital Municipal · SAMU · UTI · Transferências Manaus · FMS Apuí/AM</p>
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
              <KPI label="Leitos UTI SUS"        value={`${dashRaw.leitos_uti_sus} funcionais`}      color={CRIT} sub={`necessários: ${dashRaw.leitos_uti_necessarios}`} />
              <KPI label="Atend. PS / Mês"       value={dashRaw.atendimentos_ps_mes.toLocaleString()} color={BRAND} sub={`${dashRaw.internacoes_mes} internações`} />
              <KPI label="Tempo Resp. SAMU"      value={`${dashRaw.samu_tempo_resposta_min} min`}     color={CRIT} sub={`meta: ${dashRaw.meta_samu_resposta_min} min`} />
              <KPI label="Transferências/Mês"    value={dashRaw.transferencias_manaus_mes.toString()}  color={CRIT} sub="para Manaus (784 km)" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Ocupação Leitos Clín." value={`${dashRaw.taxa_ocupacao_clinica_pct}%`}       color={CRIT} sub={`meta: ${dashRaw.meta_ocupacao_pct}%`} />
              <KPI label="Mortalidade Hospitalar" value={`${dashRaw.taxa_mortalidade_hospitalar_pct}%`} color={CRIT} sub={`${dashRaw.obitos_hospitalares_mes} óbitos/mês`} />
              <KPI label="UTI Móvel Avançada"     value="NÃO"                                           color={CRIT} sub="apenas ambulância básica" />
              <KPI label="Aeronave Emergência"    value={`${dashRaw.disponibilidade_aeronave_pct}%`}    color={CRIT} sub="disponibilidade efetiva" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Estrutura Assistencial</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Leitos SUS totais",          value: dashRaw.leitos_sus_total,   meta: 60,   color: WARN, unit: "leitos" },
                    { label: "Leitos UTI (meta 8)",        value: dashRaw.leitos_uti_sus,      meta: 8,    color: CRIT, unit: "leitos" },
                    { label: "Ocupação clínica (meta 75%)",value: dashRaw.taxa_ocupacao_clinica_pct, meta: 75, color: CRIT, unit: "%" },
                    { label: "Aeronave disponível (meta 100%)", value: dashRaw.disponibilidade_aeronave_pct, meta: 100, color: CRIT, unit: "%" },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-bold" style={{ color: b.color }}>{b.value}{b.unit === "%" ? "%" : " " + b.unit} / meta {b.meta}{b.unit === "%" ? "%" : ""}</span>
                      </div>
                      <ProgressBar value={b.unit === "%" ? b.value : (b.value / b.meta) * 100} max={b.unit === "%" ? 100 : 100} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>Zero leitos de UTI — {dashRaw.hospital_nome}</b>. Pacientes críticos (IAM, TCE, sepse) aguardam em corredor até estabilização para voo a Manaus. Mortalidade evitável é documentada.</p>
                <p><b>SAMU: 48 min vs meta 20 min</b> — zona ribeirinha e rural sem cobertura. Acidente de moto em ramal: socorrido 2-3h após o trauma. "Hora de ouro" inexistente fora da sede.</p>
                <p><b>Aeronave em 28,4% das emergências</b> — 71,6% das solicitações negadas ou com atraso &gt; 4h. Custo TFD: R$ 284k/mês, o maior item de despesa da SMS após folha.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "causas" && Array.isArray(causas) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Atendimentos por Causa — PS Municipal</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={causas as any[]} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="causa" tick={{ fontSize: 8 }} width={260} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip />
                  <Bar dataKey="atend_mes" name="Atend./mês" radius={[0,3,3,0]}>
                    {(causas as any[]).map((c: any) => <Cell key={c.causa} fill={CAUSA_COLORS[c.causa] || BRAND} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(causas as any[]).map((c: any) => (
                <div key={c.causa} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: CAUSA_COLORS[c.causa] || BRAND }} />
                    <span className="font-semibold text-sm text-slate-700">{c.causa}</span>
                  </div>
                  <div className="text-xs text-right space-y-0.5">
                    <div><span className="font-bold">{c.atend_mes}</span> atend. | <span className="font-bold">{c.internacoes}</span> intern.</div>
                    <div>Transf.: <span className="font-bold" style={{ color: c.transferencia_pct > 15 ? CRIT : WARN }}>{c.transferencia_pct}%</span> | Óbitos: <span className="font-bold" style={{ color: c.obitos > 0 ? CRIT : OK }}>{c.obitos}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "transferencias" && Array.isArray(transf) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Transferências por Destino / Motivo</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={transf as any[]} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="destino" tick={{ fontSize: 8 }} width={260} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip />
                  <Bar dataKey="transferencias_mes" name="Transf./mês" radius={[0,3,3,0]}>
                    {(transf as any[]).map((t: any) => <Cell key={t.destino} fill={statusColor(t.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(transf as any[]).map((t: any) => (
                <div key={t.destino} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: statusColor(t.status) }} />
                    <span className="font-semibold text-sm text-slate-700">{t.destino}</span>
                  </div>
                  <div className="text-xs text-right space-y-0.5">
                    <div><span className="font-bold">{t.transferencias_mes}</span> transf./mês | <span className="font-bold">R$ {t.custo_medio_R.toLocaleString()}</span>/transf.</div>
                    <div>Tempo: <span className="font-bold">{t.tempo_medio_h}h</span> | Resolvido: <span className="font-bold" style={{ color: t.retorno_resolvido_pct >= 80 ? OK : WARN }}>{t.retorno_resolvido_pct}%</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal — Urgência e Emergência (2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="n" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="atendimentos"   name="Atendimentos"      stroke={BRAND}  strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="n"   dataKey="internacoes"    name="Internações"       stroke={ACCENT} strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="n"   dataKey="transferencias" name="Transferências"    stroke={WARN}   strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
                <Line yAxisId="n"   dataKey="obitos"         name="Óbitos"            stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="pct" dataKey="ocupacao_pct"   name="Ocupação (%)"      stroke="#6b7280" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
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
