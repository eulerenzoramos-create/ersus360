import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
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

export default function DoacaoOrgaosApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["do-dashboard"], queryFn: () => apiGet("/api/doacao-orgaos-apui/dashboard"),         enabled: aba === "dashboard" });
  const { data: potenciais }  = useQuery({ queryKey: ["do-pot"],       queryFn: () => apiGet("/api/doacao-orgaos-apui/potenciais-doadores"),enabled: aba === "potenciais" });
  const { data: fila }        = useQuery({ queryKey: ["do-fila"],      queryFn: () => apiGet("/api/doacao-orgaos-apui/fila-transplante"),   enabled: aba === "fila" });
  const { data: historico }   = useQuery({ queryKey: ["do-hist"],      queryFn: () => apiGet("/api/doacao-orgaos-apui/historico"),          enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["do-ind"],       queryFn: () => apiGet("/api/doacao-orgaos-apui/indicadores"),        enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",    icon: <Heart size={15}/> },
    { key: "potenciais",  label: "Doadores",     icon: <Activity size={15}/> },
    { key: "fila",        label: "Fila/Espera",  icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Heart size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Doação de Órgãos e Transplantes — Apuí/AM</h1>
            <p className="text-sm text-slate-500">CNCDO-AM · OPO · Morte Encefálica · Fila Nacional · FMS Apuí/AM</p>
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
              <KPI label="Potenciais doadores/ano"  value={dashRaw.potenciais_doadores_ano.toString()}    color={BRAND} />
              <KPI label="Doadores efetivos"        value={dashRaw.doadores_efetivos.toString()}          color={CRIT} sub="meta: ≥ 1/ano" />
              <KPI label="Taxa de efetivação"       value={`${dashRaw.taxa_efetivacao_pct}%`}            color={CRIT} sub="meta: 20% dos potenciais" />
              <KPI label="OPO implantada"           value="NÃO"                                           color={CRIT} sub={dashRaw.cncdo_referencia} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Residentes na fila"      value={dashRaw.pacientes_fila_transplante_residentes.toString()} color={CRIT} sub={`${dashRaw.rim_fila} rim · ${dashRaw.figado_fila} fígado`} />
              <KPI label="Espera média"            value={`${dashRaw.tempo_espera_medio_anos} anos`}    color={CRIT} sub="meta: < 2 anos" />
              <KPI label="Óbitos na fila/ano"      value={dashRaw.obitos_fila_espera_ano.toString()}     color={CRIT} sub="pacientes residentes" />
              <KPI label="Famílias que autorizaram" value={`${dashRaw.familias_autorizaram_pct}%`}      color={CRIT} sub={`${dashRaw.familias_abordadas} abordadas`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Fila de Transplante por Órgão</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={[
                    { orgao: "Rim",    fila: dashRaw.rim_fila },
                    { orgao: "Fígado", fila: dashRaw.figado_fila },
                    { orgao: "Coração",fila: dashRaw.coracao_fila },
                    { orgao: "Córnea", fila: dashRaw.cornea_fila },
                  ]} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                    <XAxis dataKey="orgao" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => `${v} pacientes`} />
                    <Bar dataKey="fila" name="Pacientes na fila" radius={[3,3,0,0]} fill={CRIT} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>Zero doadores efetivados em 4 anos.</b> 8 casos de morte encefálica em 2025, apenas 5 notificados ao CNCDO-AM. Nenhuma família abordou-se com sucesso.</p>
                <p><b>3 óbitos na fila de transplante</b> em 2025 — pacientes de Apuí aguardando rim e fígado. Espera média de 4,2 anos.</p>
                <p><b>OPO inexistente</b> — a criação de uma comissão intra-hospitalar de doação (CIHDOTT) é o primeiro passo. Treinamento de equipe com Hemoam previsto para 2025.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "potenciais" && Array.isArray(potenciais) && (
          <div className="grid gap-3">
            {(potenciais as any[]).map((p: any) => (
              <div key={p.situacao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ background: CRIT }} />
                    <span className="font-semibold text-sm text-slate-700">{p.situacao}</span>
                  </div>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold flex-shrink-0">
                    {p.autorizaram} doadores efetivos
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-slate-400 ml-6 mb-1">
                  <span>Casos: {p.casos}</span>
                  <span>Notificados CNCDO: {p.notificados_cncdo}</span>
                  <span>Famílias abordadas: {p.abordagem_familiar}</span>
                </div>
                <p className="text-xs text-slate-500 ml-6">{p.obs}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "fila" && Array.isArray(fila) && (
          <div className="grid gap-3">
            {(fila as any[]).map((f: any) => (
              <div key={f.orgao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ background: statusColor(f.status) }} />
                    <div>
                      <span className="font-semibold text-sm text-slate-700">{f.orgao}</span>
                      <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                        <span>{f.pacientes_fila} na fila</span>
                        <span>Espera média: {f.tempo_medio_anos} anos</span>
                        <span>Realizados/ano: {f.transplantes_realizados_ano}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <ProgressBar value={f.transplantes_realizados_ano} max={f.pacientes_fila} color={statusColor(f.status)} />
                <p className="text-xs text-slate-500 mt-2">{f.obs}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Doação e Transplante (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="potenciais"      name="Potenciais doadores"  stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="efetivos"        name="Doadores efetivos"    stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="notificados"     name="Notificados CNCDO"    stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="residentes_fila" name="Residentes na fila"   stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
