import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Globe, AlertTriangle, TrendingUp, Activity } from "lucide-react";

const BRAND  = "#1e3a5f";
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

export default function SaudeDigitalApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }          = useQuery({ queryKey: ["dig-dashboard"],  queryFn: () => apiGet("/api/saude-digital-apui/dashboard"),    enabled: aba === "dashboard" });
  const { data: sistemas }      = useQuery({ queryKey: ["dig-sistemas"],   queryFn: () => apiGet("/api/saude-digital-apui/sistemas"),     enabled: aba === "sistemas" });
  const { data: conectividade } = useQuery({ queryKey: ["dig-connect"],    queryFn: () => apiGet("/api/saude-digital-apui/conectividade"),enabled: aba === "conectividade" });
  const { data: historico }     = useQuery({ queryKey: ["dig-hist"],       queryFn: () => apiGet("/api/saude-digital-apui/historico"),    enabled: aba === "historico" });
  const { data: indicadores }   = useQuery({ queryKey: ["dig-ind"],        queryFn: () => apiGet("/api/saude-digital-apui/indicadores"),  enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",     label: "Dashboard",      icon: <Globe size={15}/> },
    { key: "sistemas",      label: "Sistemas",       icon: <Activity size={15}/> },
    { key: "conectividade", label: "Conectividade",  icon: <Activity size={15}/> },
    { key: "historico",     label: "Histórico",      icon: <TrendingUp size={15}/> },
    { key: "indicadores",   label: "Indicadores",    icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Globe size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Digital — Apuí/AM</h1>
            <p className="text-sm text-slate-500">e-SUS PEC · Conectividade · Telessaúde · RNDS · FMS Apuí/AM</p>
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
              <KPI label="UBS com e-SUS PEC"        value={`${dashRaw.ubs_com_esus_pec}/${dashRaw.ubs_total}`}   color={WARN}  sub={`${dashRaw.ubs_esus_pec_pct}% implantado`} />
              <KPI label="UBS com internet"          value={`${dashRaw.ubs_com_internet}/${dashRaw.ubs_total}`}   color={CRIT}  sub={`${dashRaw.ubs_internet_pct}% conectado`} />
              <KPI label="Telessaúde / mês"          value={`${dashRaw.telessaude_consultas_mes}`}                color={CRIT}  sub={`meta: ${dashRaw.meta_telessaude_mes}`} />
              <KPI label="RNDS integrado"            value={dashRaw.rnds_integracao_ativa ? "Sim" : "Não"}        color={CRIT}  sub={`previsão: ${dashRaw.rnds_prevista}`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Prontuário eletrônico"     value={`${dashRaw.prontuario_eletronico_pct}%`}              color={CRIT}  sub="das UBS" />
              <KPI label="Atend. com CNS ident."     value={`${dashRaw.atendimentos_com_cns_identificado_pct}%`}  color={WARN}  sub={`meta: ${dashRaw.meta_cns_pct}%`} />
              <KPI label="Profissionais treinados"   value={`${dashRaw.profissionais_treinados_esus_pct}%`}       color={CRIT}  sub={`meta: ${dashRaw.meta_treinados_pct}%`} />
              <KPI label="Suporte técnico local"     value={dashRaw.suporte_tecnico_local ? "Sim" : "Não"}        color={CRIT}  sub={dashRaw.suporte_referencia} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Maturidade Digital</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "UBS com e-SUS PEC (meta 100%)",         value: dashRaw.ubs_esus_pec_pct,                        color: WARN, display: `${dashRaw.ubs_esus_pec_pct}%` },
                    { label: "UBS com internet (meta 100%)",           value: dashRaw.ubs_internet_pct,                        color: CRIT, display: `${dashRaw.ubs_internet_pct}%` },
                    { label: "Profissionais treinados e-SUS (meta 100%)", value: dashRaw.profissionais_treinados_esus_pct,     color: CRIT, display: `${dashRaw.profissionais_treinados_esus_pct}%` },
                    { label: "Telessaúde (meta: 120 consul./mês)",     value: dashRaw.telessaude_consultas_mes / dashRaw.meta_telessaude_mes * 100, color: CRIT, display: `${dashRaw.telessaude_consultas_mes} consul.` },
                    { label: "Atend. com CNS identificado (meta 95%)", value: dashRaw.atendimentos_com_cns_identificado_pct,   color: WARN, display: `${dashRaw.atendimentos_com_cns_identificado_pct}%` },
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
                <p><b>5/8 UBS sem internet</b> — prontuário em papel, SINAN com atraso de 8 dias, surto detectado mas não notificado por 12-15 dias. Decisão clínica baseada em dado desatualizado em 62,5% da rede.</p>
                <p><b>RNDS sem implantação</b> — paciente com 3 prontuários desconexos (UBS + HMM + referência Manaus). Polimedicação não rastreada: interação grave não detectada = evento adverso prevenível.</p>
                <p><b>Telessaúde: 28/120 consultas/mês (23%)</b> — sem telessaúde, dúvida diagnóstica = transfer para Humaitá (284 km). Teledermatologia e telepediatria inexistentes: dermatites tropicais e doenças pediátricas raras sem segunda opinião especializada.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "sistemas" && Array.isArray(sistemas) && (
          <div className="grid gap-3">
            {(sistemas as any[]).map((s: any) => (
              <div key={s.sistema} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(s.status) }} />
                    <div>
                      <p className="font-semibold text-sm text-slate-700">{s.sistema}</p>
                      <p className="text-xs text-slate-400">v{s.versao} · {s.ubs_implantadas}/{s.ubs_total} UBS</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: statusColor(s.status) + "22", color: statusColor(s.status) }}>
                    {Math.round(s.ubs_implantadas / s.ubs_total * 100)}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 ml-5">{s.descricao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "conectividade" && Array.isArray(conectividade) && (
          <div className="grid gap-3">
            {(conectividade as any[]).map((c: any) => (
              <div key={c.ubs} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(c.status) }} />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-700">{c.ubs}</p>
                  <p className="text-xs text-slate-400">{c.tipo} · última sinc.: {c.ultima_sinc}</p>
                </div>
                <div className="text-right text-xs space-y-0.5">
                  <p>e-SUS: <b style={{ color: c.esus_pec ? OK : CRIT }}>{c.esus_pec ? "Sim" : "Não"}</b></p>
                  <p>Internet: <b style={{ color: c.internet ? OK : CRIT }}>{c.internet ? "Sim" : "Não"}</b></p>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Digital — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line dataKey="ubs_esus_pct"          name="UBS e-SUS PEC (%)"      stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="prontuario_digital_pct" name="Prontuário digital (%)"  stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="atend_cns_pct"          name="CNS identificado (%)"    stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
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
