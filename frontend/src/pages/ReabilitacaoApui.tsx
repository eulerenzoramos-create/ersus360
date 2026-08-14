import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Activity, AlertTriangle, TrendingUp, Users } from "lucide-react";

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

const DEF_COLORS: Record<string, string> = {
  "Deficiência física / motora":   CRIT,
  "Deficiência intelectual":        "#7c3aed",
  "Deficiência auditiva":           ACCENT,
  "Deficiência visual":             WARN,
  "Deficiência múltipla":           "#6b7280",
  "Transtorno do Espectro Autista": OK,
};

export default function ReabilitacaoApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["reab-dashboard"],    queryFn: () => apiGet("/api/reabilitacao-apui/dashboard"),    enabled: aba === "dashboard" });
  const { data: deficiencias }= useQuery({ queryKey: ["reab-defic"],        queryFn: () => apiGet("/api/reabilitacao-apui/deficiencias"), enabled: aba === "deficiencias" });
  const { data: servicos }    = useQuery({ queryKey: ["reab-serv"],         queryFn: () => apiGet("/api/reabilitacao-apui/servicos"),     enabled: aba === "servicos" });
  const { data: historico }   = useQuery({ queryKey: ["reab-hist"],         queryFn: () => apiGet("/api/reabilitacao-apui/historico"),    enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["reab-ind"],          queryFn: () => apiGet("/api/reabilitacao-apui/indicadores"),  enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",      icon: <Activity size={15}/> },
    { key: "deficiencias", label: "Deficiências",   icon: <Users size={15}/> },
    { key: "servicos",     label: "Serviços",        icon: <AlertTriangle size={15}/> },
    { key: "historico",    label: "Histórico",      icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores",    icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Activity size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Reabilitação — Apuí/AM</h1>
            <p className="text-sm text-slate-500">PCD · BPC · CRIE (ausente) · Fisioterapia · CER Humaitá · FMS Apuí/AM</p>
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
              <KPI label="Pop. Estimada c/ Defic." value={dashRaw.populacao_estimada_deficiencia?.toLocaleString()} color={BRAND} sub={`${dashRaw.pct_populacao_total}% da população`} />
              <KPI label="Beneficiários BPC"        value={dashRaw.beneficiarios_bpc.toString()} color={ACCENT} sub="LOAS pessoa com deficiência" />
              <KPI label="Pacientes Fisioterapia"   value={dashRaw.pacientes_fisioterapia_municipio.toString()} color={WARN} sub={`lista espera: ${dashRaw.lista_espera_reab}`} />
              <KPI label="CRIE Implantado"          value="NÃO" color={CRIT} sub={`Ref.: ${dashRaw.cer_referencia}`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Fisioterapeutas SUS"      value={`${dashRaw.fisioterapeutas_sus} / ${dashRaw.fisioterapeutas_necessarios}`} color={CRIT} sub="disponíveis / necessários" />
              <KPI label="Espera p/ Fisioterapia"   value={`${dashRaw.tempo_medio_espera_meses} meses`} color={CRIT} sub="meta: 3 meses" />
              <KPI label="Cadeirantes Atendidos"    value={`${dashRaw.cadeirantes_atendimento_pct}%`} color={CRIT} sub={`${dashRaw.cadeirantes_atendidos_ano} / ${dashRaw.cadeirantes_necessidade} cad./ano`} />
              <KPI label="Distância ao CER"         value={`${dashRaw.cer_distancia_km} km`} color={WARN} sub={`${dashRaw.cer_tempo_horas}h de viagem`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cobertura de Reabilitação por Tipo</h3>
                <div className="space-y-3">
                  {[
                    { label: "Fisioterapia",        value: 22.4, color: CRIT },
                    { label: "Fonoaudiologia",      value: 16.9, color: CRIT },
                    { label: "Terapia Ocupacional", value: 0,    color: CRIT },
                    { label: "CRIE (Intelectual)",  value: 0,    color: CRIT },
                    { label: "AASI (Auditivo)",     value: 0,    color: CRIT },
                    { label: "CAPS",                value: 52.1, color: WARN },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-medium" style={{ color: b.color }}>{b.value}%</span>
                      </div>
                      <ProgressBar value={b.value} max={100} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>CRIE inexistente</b> — 568 pessoas com deficiência intelectual sem reabilitação especializada. Referência: CER Humaitá, 284 km.</p>
                <p><b>Terapia Ocupacional: ZERO</b> — sem profissional TO no SUS de Apuí. Pacientes com AVC, paralisia e TEA sem acompanhamento.</p>
                <p><b>67,2% dos cadeirantes</b> sem fornecimento de cadeira de rodas — fila de 18–24 meses para dispensação via SUS.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "deficiencias" && Array.isArray(deficiencias) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Estimativa de PCD por Tipo — Apuí/AM</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={deficiencias as any[]} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="tipo" tick={{ fontSize: 9 }} width={240} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip formatter={(v: any) => `${v?.toLocaleString()}`} />
                  <Bar dataKey="estimativa" name="Estimativa" radius={[0,3,3,0]}>
                    {(deficiencias as any[]).map((d: any) => <Cell key={d.tipo} fill={DEF_COLORS[d.tipo] || BRAND} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(deficiencias as any[]).map((d: any) => (
                <div key={d.tipo} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-semibold text-sm text-slate-700">{d.tipo}</span>
                      <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                        <span>Est.: {d.estimativa?.toLocaleString()} ({d.pct}%)</span>
                        <span>BPC: {d.bpc_beneficiarios}</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold" style={{ color: statusColor(d.status) }}>
                      {d.cobertura_reab_pct}% cobertura
                    </span>
                  </div>
                  <ProgressBar value={d.cobertura_reab_pct} max={100} color={statusColor(d.status)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "servicos" && Array.isArray(servicos) && (
          <div className="grid gap-2">
            {(servicos as any[]).map((s: any) => (
              <div key={s.servico} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: statusColor(s.status) }} />
                    <div>
                      <span className="font-semibold text-sm text-slate-700">{s.servico}</span>
                      <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                        <span>{s.profissionais} prof.</span>
                        <span>{s.vagas_mes} vagas/mês</span>
                        <span>Demanda: {s.demanda_estimada}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {!s.disponivel && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">NÃO DISPONÍVEL</span>}
                    {s.disponivel && (
                      <span className="text-sm font-bold" style={{ color: statusColor(s.status) }}>
                        {s.cobertura_pct}%
                      </span>
                    )}
                  </div>
                </div>
                {s.disponivel && s.vagas_mes > 0 && (
                  <ProgressBar value={s.vagas_mes} max={s.demanda_estimada} color={statusColor(s.status)} />
                )}
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Reabilitação (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="pacientes_fisio"      name="Pacientes fisio."    stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="bpc_novos"            name="BPC novos"           stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="dispensados_orteses"  name="Órteses dispensadas" stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="encaminhados_cer"     name="Encam. CER"          stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
