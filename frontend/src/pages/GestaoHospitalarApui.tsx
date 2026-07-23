import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Landmark, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function GestaoHospitalarApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }         = useQuery({ queryKey: ["hosp-dashboard"],  queryFn: () => apiGet("/api/gestao-hospitalar-apui/dashboard"),    enabled: aba === "dashboard" });
  const { data: producao }     = useQuery({ queryKey: ["hosp-producao"],   queryFn: () => apiGet("/api/gestao-hospitalar-apui/producao"),     enabled: aba === "producao" });
  const { data: fragilidades } = useQuery({ queryKey: ["hosp-fragilid"],   queryFn: () => apiGet("/api/gestao-hospitalar-apui/fragilidades"), enabled: aba === "fragilidades" });
  const { data: historico }    = useQuery({ queryKey: ["hosp-hist"],       queryFn: () => apiGet("/api/gestao-hospitalar-apui/historico"),    enabled: aba === "historico" });
  const { data: indicadores }  = useQuery({ queryKey: ["hosp-ind"],        queryFn: () => apiGet("/api/gestao-hospitalar-apui/indicadores"),  enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",    icon: <Landmark size={15}/> },
    { key: "producao",     label: "Produção",     icon: <Activity size={15}/> },
    { key: "fragilidades", label: "Fragilidades", icon: <AlertTriangle size={15}/> },
    { key: "historico",    label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Landmark size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Gestão Hospitalar — Apuí/AM</h1>
            <p className="text-sm text-slate-500">HMM · Leitos · Cirurgias · Transferências · FMS Apuí/AM</p>
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
              <KPI label="Leitos SUS"              value={`${dashRaw.leitos_sus_total}`}              color={CRIT} sub={`meta: ${dashRaw.leitos_necessarios_meta} leitos`} />
              <KPI label="Taxa de Ocupação"         value={`${dashRaw.taxa_ocupacao_pct}%`}            color={CRIT} sub={`meta segura: ${dashRaw.meta_ocupacao_pct}%`} />
              <KPI label="UTI Leitos"               value={`${dashRaw.uti_leitos}`}                    color={CRIT} sub="zero — transfer imediato" />
              <KPI label="Transferências/mês"       value={`${dashRaw.internacoes_transferidas_mes}`}  color={CRIT} sub={`de ${dashRaw.internacoes_mes} internações`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Reinternação 30 dias"    value={`${dashRaw.reinternacao_30_dias_pct}%`}      color={CRIT} sub={`meta: ${dashRaw.meta_reinternacao_pct}%`} />
              <KPI label="Banco de sangue"          value={dashRaw.banco_sangue ? "Sim" : "Não"}        color={CRIT} sub={`ref.: ${dashRaw.hemoterapia_referencia}`} />
              <KPI label="Cirurgias eletivas/mês"  value={`${dashRaw.cirurgias_eletivas_mes}`}         color={WARN} sub={`suspensão: ${dashRaw.suspensao_cirurgica_meses_2025} meses/2025`} />
              <KPI label="Óbitos evitáveis (est.)" value={`${dashRaw.obitos_evitaveis_estimados_pct}%`} color={CRIT} sub={`dos ${dashRaw.obitos_hospitalares_ano} óbitos/ano`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Capacidade vs Meta</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Leitos/1k hab (meta 2,5/1k)", value: dashRaw.leitos_por_mil_hab / dashRaw.meta_leitos_por_mil * 100, color: CRIT, display: `${dashRaw.leitos_por_mil_hab}/1k` },
                    { label: "Ocupação (meta ≤75%)",         value: dashRaw.taxa_ocupacao_pct,  color: CRIT, display: `${dashRaw.taxa_ocupacao_pct}%` },
                    { label: "Enfermeiro/leito (meta 0,33)", value: dashRaw.enfermeiros_leito_ratio / dashRaw.meta_enfermeiro_leito * 100, color: CRIT, display: `${dashRaw.enfermeiros_leito_ratio}` },
                    { label: "Cirurgias eletivas funcionando", value: ((12 - dashRaw.suspensao_cirurgica_meses_2025) / 12 * 100), color: WARN, display: `${12 - dashRaw.suspensao_cirurgica_meses_2025}/12 meses` },
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
                <p><b>Zero UTI — 28 leitos para 24.700 hab (1,13/1k)</b> — IAM, AVC, sepse grave e politrauma = transfer imediato para Humaitá (284 km) ou Manaus (784 km). Viatura sem UTI móvel: paciente crítico percorre até 8h sem monitoramento intensivo.</p>
                <p><b>Banco de sangue inexistente</b> — cirurgia com sangramento intraoperatório imprevisto = suspensão do procedimento ou óbito. Obstetrícia: hemorragia pós-parto requer transfer enquanto paciente sangra ativamente.</p>
                <p><b>42,4% dos óbitos hospitalares estimados como evitáveis</b> — 11-12 vidas/ano com UTI (4-5), banco de sangue (2-3), cirurgião 24h (2-3) e protocolo de sepse operante (2). Comitê de mortalidade inativo em 2025.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "producao" && Array.isArray(producao) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Produção Hospitalar Mensal — 2025</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={producao as any[]} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} unit="%" domain={[60, 100]} />
                <Tooltip />
                <Legend />
                <Bar  yAxisId="left"  dataKey="internacoes"    name="Internações"    fill={BRAND}  radius={[3,3,0,0]} />
                <Bar  yAxisId="left"  dataKey="transferencias" name="Transferências" fill={CRIT}   radius={[3,3,0,0]} />
                <Bar  yAxisId="left"  dataKey="cirurgias"      name="Cirurgias"      fill={ACCENT} radius={[3,3,0,0]} />
                <Line yAxisId="right" dataKey="ocupacao_pct"   name="Ocupação (%)"   stroke={WARN} strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {aba === "fragilidades" && Array.isArray(fragilidades) && (
          <div className="grid gap-3">
            {(fragilidades as any[]).map((f: any) => (
              <div key={f.area} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-4">
                <div className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(f.status) }} />
                <div className="flex-1">
                  <p className="font-semibold text-slate-700 text-sm">{f.area}</p>
                  <p className="text-xs text-slate-500 mt-1">{f.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — HMM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="internacoes_ano"    name="Internações/ano"    stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="transferencias_ano" name="Transferências/ano" stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="cirurgias_ano"      name="Cirurgias/ano"      stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="obitos"             name="Óbitos/ano"         stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
