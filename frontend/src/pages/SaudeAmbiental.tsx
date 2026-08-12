import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Droplets, AlertTriangle, Users, Activity } from "lucide-react";

const BRAND  = "#164e63";
const ACCENT = "#0891b2";
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

export default function SaudeAmbiental() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["sa-dashboard"],
    queryFn: () => apiGet("/api/saude-ambiental/dashboard"),
    enabled: aba === "dashboard",
  });
  const { data: vigiagua } = useQuery({
    queryKey: ["sa-vigiagua"],
    queryFn: () => apiGet("/api/saude-ambiental/vigiagua"),
    enabled: aba === "vigiagua",
  });
  const { data: saneamento } = useQuery({
    queryKey: ["sa-saneamento"],
    queryFn: () => apiGet("/api/saude-ambiental/saneamento"),
    enabled: aba === "saneamento",
  });
  const { data: agrotoxicos } = useQuery({
    queryKey: ["sa-agrotoxicos"],
    queryFn: () => apiGet("/api/saude-ambiental/agrotoxicos"),
    enabled: aba === "agrotoxicos",
  });
  const { data: historico } = useQuery({
    queryKey: ["sa-historico"],
    queryFn: () => apiGet("/api/saude-ambiental/historico"),
    enabled: aba === "historico",
  });
  const { data: indicadores } = useQuery({
    queryKey: ["sa-indicadores"],
    queryFn: () => apiGet("/api/saude-ambiental/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;
  const sanRaw  = saneamento as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",   icon: <Droplets size={15}/> },
    { key: "vigiagua",    label: "VIGIÁGUA",    icon: <Droplets size={15}/> },
    { key: "saneamento",  label: "Saneamento",  icon: <Users size={15}/> },
    { key: "agrotoxicos", label: "Agrotóxicos", icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",   icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Droplets size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Ambiental</h1>
            <p className="text-sm text-slate-500">VIGIÁGUA · Saneamento · Agrotóxicos · Mercúrio Garimpo · FMS Apuí/AM</p>
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
              <KPI label="Água Tratada"      value={`${dashRaw.agua_tratada_pct}%`}           color={CRIT} />
              <KPI label="Esgoto Coletado"   value={`${dashRaw.esgoto_coletado_pct}%`}        color={CRIT} />
              <KPI label="Conform. VIGIÁGUA" value={`${dashRaw.conformidade_vigiagua_pct}%`}  color={CRIT} />
              <KPI label="DDA/Mês"           value={dashRaw.dda_casos_mes.toString()}          color={CRIT} sub="doenças diarreicas" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Intox. Agrotóxicos/Mês" value={dashRaw.intox_agrotoxicos_mes.toString()}     color={CRIT} sub="tendência crescente" />
              <KPI label="Intox. Mercúrio/Ano"    value={dashRaw.intox_mercurio_garimpo_ano.toString()} color={CRIT} sub="garimpo sem monit." />
              <KPI label="Sistemas VIGIÁGUA"      value={dashRaw.sistemas_monitorados.toString()}       color={ACCENT} />
              <KPI label="Hosp. DDA/Mês"          value={dashRaw.dda_hospitalizacoes_mes.toString()}    color={WARN} />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <b>Tripla crise ambiental:</b> apenas {dashRaw.agua_tratada_pct}% com água tratada, {dashRaw.esgoto_coletado_pct}% com esgoto coletado. Mercúrio no garimpo <b>sem programa de monitoramento ativo</b>. DDA: {dashRaw.dda_casos_mes} casos/mês.
            </div>
          </div>
        )}

        {aba === "vigiagua" && Array.isArray(vigiagua) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Conformidade por Sistema de Abastecimento (%)</h3>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={vigiagua} layout="vertical" margin={{ left: 10, right: 40 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} unit="%" />
                  <YAxis type="category" dataKey="sistema" tick={{ fontSize: 8 }} width={260} />
                  <Tooltip />
                  <Bar dataKey="conformes_pct" name="Conformes %" fill={ACCENT} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(vigiagua as any[]).map((vig: any) => (
                <div key={vig.sistema} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-700 text-sm">{vig.sistema}</span>
                    <span className="font-bold text-sm" style={{ color: statusColor(vig.status) }}>
                      {vig.cobertura_pct}% cobertura · {vig.conformes_pct}% conforme
                    </span>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-slate-500 mb-0.5">
                      <span>Conformidade geral</span><span>{vig.conformes_pct}%</span>
                    </div>
                    <ProgressBar value={vig.conformes_pct} max={100} color={statusColor(vig.status)} />
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-slate-500">
                    <span>Pop.: <b>{vig.populacao_atendida.toLocaleString()}</b></span>
                    <span>Amostras/mês: <b>{vig.amostras_mes}</b></span>
                    <span style={{ color: vig.cloro_residual_ok_pct >= 90 ? OK : CRIT }}>Cloro OK: {vig.cloro_residual_ok_pct}%</span>
                    <span style={{ color: vig.fluoreto_ok_pct >= 70 ? OK : CRIT }}>Fluoreto: {vig.fluoreto_ok_pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "saneamento" && sanRaw && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <KPI label="Água Tratada"             value={`${sanRaw.agua_tratada_pct}%`}                    color={CRIT} />
              <KPI label="Esgoto Coletado"          value={`${sanRaw.esgoto_coletado_pct}%`}                 color={CRIT} />
              <KPI label="Esgoto Tratado"           value={`${sanRaw.esgoto_tratado_pct}%`}                  color={CRIT} />
              <KPI label="Resíduos Coletados"       value={`${sanRaw.residuos_solidos_coletados_pct}%`}      color={WARN} />
              <KPI label="Destino Adequado"         value={`${sanRaw.residuos_solidos_destino_adequado_pct}%`} color={OK} />
              <KPI label="Lixão Ativo"              value={sanRaw.lixao_ativo ? "SIM" : "Não"} color={sanRaw.lixao_ativo ? CRIT : OK} />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Cobertura Saneamento vs Meta (99%)</h3>
              {[
                { label: "Água Tratada",    val: sanRaw.agua_tratada_pct },
                { label: "Esgoto Coletado", val: sanRaw.esgoto_coletado_pct },
                { label: "Esgoto Tratado",  val: sanRaw.esgoto_tratado_pct },
              ].map((item) => (
                <div key={item.label} className="mb-3">
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>{item.label}</span>
                    <span className="font-bold" style={{ color: item.val < 60 ? CRIT : WARN }}>{item.val}%</span>
                  </div>
                  <ProgressBar value={item.val} max={99} color={item.val < 50 ? CRIT : item.val < 80 ? WARN : OK} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <KPI label="DDA Casos/Mês"           value={sanRaw.dda_casos_mes.toString()}           color={CRIT} sub="correlação com água inadequada" />
              <KPI label="DDA Hospitalizações/Mês" value={sanRaw.dda_hospitalizacoes_mes.toString()} color={CRIT} />
            </div>
          </div>
        )}

        {aba === "agrotoxicos" && Array.isArray(agrotoxicos) && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Intoxicações por Cultura/Atividade (2026)</h3>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={agrotoxicos} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="cultura" tick={{ fontSize: 9 }} width={200} />
                  <Tooltip />
                  <Bar dataKey="intoxicacoes_ano" name="Intox./ano" fill={CRIT} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(agrotoxicos as any[]).map((agro: any) => (
                <div key={agro.cultura} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-700 text-sm">{agro.cultura}</span>
                    <span className="font-bold text-sm" style={{ color: statusColor(agro.status) }}>
                      {agro.intoxicacoes_ano} intox./ano
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {agro.agrotoxicos_uso.map((ag: string) => (
                      <span key={ag} className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{ag}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                    {agro.area_ha && <span>Área: <b>{agro.area_ha.toLocaleString()} ha</b></span>}
                    <span style={{ color: agro.monitoramento_ativo ? OK : CRIT }}>
                      {agro.monitoramento_ativo ? "Monitoramento ativo" : "SEM MONITORAMENTO"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Tendências VIGIÁGUA e DDA (2026)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" domain={[70, 90]} tick={{ fontSize: 11 }} unit="%" />
                <YAxis yAxisId="n"   orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="pct" dataKey="conformes_pct"  name="Conformidade água %" stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="dda_casos"       name="DDA casos"           stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="intox_agrotox"   name="Intox. agrotóxico"   stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
