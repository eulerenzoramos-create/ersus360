import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Monitor, AlertTriangle, Wifi, Activity } from "lucide-react";

const BRAND  = "#1e3a5f";
const ACCENT = "#2563eb";
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
  <div className="w-full bg-slate-100 rounded-full h-2">
    <div className="h-2 rounded-full" style={{ width: `${Math.min(value / max * 100, 100)}%`, background: color }} />
  </div>
);

export default function SaudeDigitalEsus() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["sde-dashboard"],
    queryFn: () => apiGet("/api/saude-digital-esus/dashboard"),
    enabled: aba === "dashboard",
  });
  const { data: sistemas } = useQuery({
    queryKey: ["sde-sistemas"],
    queryFn: () => apiGet("/api/saude-digital-esus/sistemas"),
    enabled: aba === "sistemas",
  });
  const { data: prontuario } = useQuery({
    queryKey: ["sde-prontuario"],
    queryFn: () => apiGet("/api/saude-digital-esus/prontuario-digital"),
    enabled: aba === "prontuario",
  });
  const { data: conectividade } = useQuery({
    queryKey: ["sde-conectividade"],
    queryFn: () => apiGet("/api/saude-digital-esus/conectividade"),
    enabled: aba === "conectividade",
  });
  const { data: historico } = useQuery({
    queryKey: ["sde-historico"],
    queryFn: () => apiGet("/api/saude-digital-esus/historico"),
    enabled: aba === "historico",
  });
  const { data: indicadores } = useQuery({
    queryKey: ["sde-indicadores"],
    queryFn: () => apiGet("/api/saude-digital-esus/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;
  const pronRaw = prontuario as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",    icon: <Monitor size={15}/> },
    { key: "sistemas",     label: "Sistemas",     icon: <Monitor size={15}/> },
    { key: "prontuario",   label: "Prontuário",   icon: <Activity size={15}/> },
    { key: "conectividade",label: "Conectividade",icon: <Wifi size={15}/> },
    { key: "historico",    label: "Histórico",    icon: <Activity size={15}/> },
    { key: "indicadores",  label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Monitor size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Digital / e-SUS</h1>
            <p className="text-sm text-slate-500">PEC · SISAB · RNDS · ConecteSUS · GAL · Conectividade · FMS Apuí/AM</p>
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
              <KPI label="Atend. Digitais/Mês"  value={dashRaw.atendimentos_digitais_mes.toLocaleString()} color={ACCENT} />
              <KPI label="Atend. em Papel/Mês"  value={dashRaw.atendimentos_papel_mes.toString()}         color={WARN} />
              <KPI label="Adesão PEC"           value={`${dashRaw.adesao_pec_pct}%`}                      color={dashRaw.adesao_pec_pct >= 95 ? OK : WARN} />
              <KPI label="Cobertura Prontuário" value={`${dashRaw.cobertura_prontuario_pct}%`}             color={dashRaw.cobertura_prontuario_pct >= 80 ? OK : CRIT} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Sistemas OK"          value={`${dashRaw.sistemas_ok}/${dashRaw.sistemas_monitorados}`} color={OK} />
              <KPI label="Sistemas Críticos"    value={dashRaw.sistemas_criticos.toString()}              color={CRIT} />
              <KPI label="Fichas Pend. SISAB"   value={dashRaw.fichas_pendentes_sisab.toString()}          color={WARN} />
              <KPI label="Unidades RNDS"        value={`${dashRaw.unidades_rnds_integradas}/8`}           color={CRIT} sub="integradas à RNDS" />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <b>RNDS crítico</b> — apenas {dashRaw.unidades_rnds_integradas} de 8 unidades integradas à Rede Nacional de Dados em Saúde. Uptime médio: {dashRaw.uptime_medio_pct}% — UBSF Juma (71%) e Mapari (68%) com conectividade insuficiente para PEC.
            </div>
          </div>
        )}

        {aba === "sistemas" && Array.isArray(sistemas) && (
          <div className="grid gap-3">
            {(sistemas as any[]).map((sis: any) => (
              <div key={sis.sistema} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor(sis.status) }} />
                    <span className="font-semibold text-slate-700 text-sm">{sis.sistema}</span>
                    {sis.versao !== "—" && <span className="text-xs text-slate-400">v{sis.versao}</span>}
                  </div>
                  <span className="font-bold text-sm" style={{ color: statusColor(sis.status) }}>
                    {sis.sincronizacao_ok_pct}% sync
                  </span>
                </div>
                <div className="mb-2">
                  <ProgressBar value={sis.sincronizacao_ok_pct} max={100} color={statusColor(sis.status)} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                  <span>Unidades ativas: <b>{sis.unidades_ativas}/{sis.unidades_total}</b></span>
                  {sis.producao_mes && <span>Produção/mês: <b>{sis.producao_mes.toLocaleString()}</b></span>}
                  {sis.ultima_sync && <span>Último sync: <b>{sis.ultima_sync}</b></span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "prontuario" && pronRaw && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <KPI label="Pacientes com PEC"     value={pronRaw.pacientes_com_pec.toLocaleString()}   color={ACCENT} />
              <KPI label="Total Cadastrados"     value={pronRaw.pacientes_cadastrados_total.toLocaleString()} />
              <KPI label="Cobertura PEC"         value={`${pronRaw.cobertura_pec_pct}%`}              color={pronRaw.cobertura_pec_pct >= 80 ? OK : CRIT} />
              <KPI label="Profissionais Ativos"  value={`${pronRaw.profissionais_ativos_pec}/${pronRaw.profissionais_total}`} color={ACCENT} />
              <KPI label="Adesão Profissionais"  value={`${pronRaw.adesao_pec_pct}%`}                 color={pronRaw.adesao_pec_pct >= 95 ? OK : WARN} />
              <KPI label="Prescrição Eletrônica" value={`${pronRaw.prescricoes_eletronicas_pct}%`}    color={pronRaw.prescricoes_eletronicas_pct >= 95 ? OK : WARN} />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="font-semibold text-slate-700">Cobertura Digital vs Meta (90%)</h3>
              {[
                { label: "Pacientes com Prontuário PEC", val: pronRaw.cobertura_pec_pct },
                { label: "Adesão dos Profissionais",     val: pronRaw.adesao_pec_pct },
                { label: "Prescrições Eletrônicas",      val: pronRaw.prescricoes_eletronicas_pct },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>{item.label}</span>
                    <span className="font-bold" style={{ color: item.val >= 90 ? OK : item.val >= 75 ? WARN : CRIT }}>{item.val}%</span>
                  </div>
                  <ProgressBar value={item.val} max={100} color={item.val >= 90 ? OK : item.val >= 75 ? WARN : CRIT} />
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "conectividade" && Array.isArray(conectividade) && (
          <div className="grid gap-3">
            {(conectividade as any[]).map((u: any) => (
              <div key={u.unidade} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor(u.status) }} />
                    <span className="font-semibold text-slate-700 text-sm">{u.unidade}</span>
                  </div>
                  <span className="font-bold text-sm" style={{ color: statusColor(u.status) }}>
                    {u.uptime_pct}% uptime
                  </span>
                </div>
                <div className="mb-2">
                  <ProgressBar value={u.uptime_pct} max={100} color={statusColor(u.status)} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                  <span>Tipo: <b>{u.tipo_conexao}</b></span>
                  <span>Velocidade: <b>{u.velocidade_mbps} Mbps</b></span>
                  <span style={{ color: u.backup_4g ? OK : WARN }}>4G backup: <b>{u.backup_4g ? "Sim" : "Não"}</b></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal (2026)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" domain={[84, 95]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="atendimentos_digitais"          name="Atend. Digitais"      stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="fichas_sinan_transmitidas_pct"  name="SISAB Transm. %"       stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="pct" dataKey="uptime_medio_pct"               name="Uptime Médio %"        stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
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
