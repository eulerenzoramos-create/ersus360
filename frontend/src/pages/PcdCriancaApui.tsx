import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Baby, AlertTriangle, TrendingUp, Activity } from "lucide-react";

const BRAND  = "#1e3a5f";
const ACCENT = "#1d4ed8";
const OK     = "#16a34a";
const WARN   = "#d97706";
const CRIT   = "#dc2626";

function statusColor(s: string) {
  if (s === "critico") return CRIT;
  if (s === "atencao") return WARN;
  return OK;
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

export default function PcdCriancaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["pcd-dash"],  queryFn: () => apiGet("/api/pcd-crianca-apui/dashboard"),    enabled: aba === "dashboard" });
  const { data: deficiencias }= useQuery({ queryKey: ["pcd-def"],   queryFn: () => apiGet("/api/pcd-crianca-apui/deficiencias"), enabled: aba === "deficiencias" });
  const { data: acoes }       = useQuery({ queryKey: ["pcd-acao"],  queryFn: () => apiGet("/api/pcd-crianca-apui/acoes"),        enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["pcd-hist"],  queryFn: () => apiGet("/api/pcd-crianca-apui/historico"),    enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["pcd-ind"],   queryFn: () => apiGet("/api/pcd-crianca-apui/indicadores"),  enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",   icon: <Baby size={15}/> },
    { key: "deficiencias", label: "Deficiências",icon: <Activity size={15}/> },
    { key: "acoes",        label: "Ações",       icon: <AlertTriangle size={15}/> },
    { key: "historico",    label: "Histórico",   icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Baby size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>PcD Criança e Habilitação — Apuí/AM</h1>
            <p className="text-sm text-slate-500">TEA · Paralisia Cerebral · Surdez · Baixa Visão · BPC · APAE · CRIES · FMS Apuí/AM</p>
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
              <KPI label="Crianças PcD estimadas"    value={dashRaw.criancas_pcd_estimadas}                        color={BRAND} sub={`${dashRaw.populacao_0_17_anos.toLocaleString()} crianças totais`} />
              <KPI label="Diagnosticadas"            value={dashRaw.criancas_pcd_diagnosticadas}                   color={WARN}  sub={`${dashRaw.criancas_pcd_sem_diagnostico_pct}% sem diagnóstico`} />
              <KPI label="Sem BPC (elegíveis)"       value={dashRaw.criancas_pcd_sem_bpc_elegivel}                 color={CRIT}  sub={`R$ 1.412/mês não acessados cada`} />
              <KPI label="Fisioterapeuta/Fono SUS"   value={dashRaw.fisioterapeuta_sus + dashRaw.fonoaudiologo_sus} color={CRIT}  sub="zero no eMulti" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="APAE / CRIES em Apuí"     value="Inexistente"                                            color={CRIT} sub="zero reabilitação infantil" />
              <KPI label="Cadeirantes sem cadeira"   value={dashRaw.cadeirante_sem_cadeira_de_rodas}                color={CRIT} sub="ORCID disponível: R$ 0" />
              <KPI label="Surdos sem AASI"           value={dashRaw.deficiencia_auditiva_sem_aparelho}              color={CRIT} sub="SUS fornece via CRER-AM" />
              <KPI label="Custo social anual"        value={`R$ ${(dashRaw.custo_social_pcd_sem_suporte_anual/1000000).toFixed(1)}M`} color={CRIT} sub="estimado sem suporte" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Crianças PcD — Diagnóstico e Suporte</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Diagnosticadas: ${dashRaw.criancas_pcd_diagnosticadas}/${dashRaw.criancas_pcd_estimadas} estimadas`, value: dashRaw.criancas_pcd_diagnosticadas, max: dashRaw.criancas_pcd_estimadas, color: WARN },
                    { label: `BPC acessado: ${dashRaw.criancas_pcd_beneficio_bpc}/${dashRaw.criancas_pcd_estimadas} elegíveis`,   value: dashRaw.criancas_pcd_beneficio_bpc,  max: dashRaw.criancas_pcd_estimadas, color: CRIT },
                    { label: `Escola adaptada: ${dashRaw.escola_inclusiva_adaptada_pct}% (meta 100%)`,                             value: dashRaw.escola_inclusiva_adaptada_pct, max: 100, color: CRIT },
                    { label: `Auxiliar educacional: ${dashRaw.auxiliar_educacional_pcd}/${dashRaw.meta_auxiliar_educacional_pcd} necessários`, value: dashRaw.auxiliar_educacional_pcd, max: dashRaw.meta_auxiliar_educacional_pcd, color: CRIT },
                  ].map((b: any) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                      </div>
                      <ProgressBar value={b.value} max={b.max} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>66,2% das crianças PcD sem diagnóstico</b> — 420 elegíveis ao BPC (R$ 1.412/mês) sem acesso = R$ 7,1M/ano não captados. Vigilância do desenvolvimento (Denver II): R$ 12.000 implanta na puericultura.</p>
                <p><b>Zero fisioterapeuta, zero fonoaudiólogo no SUS</b> — família gasta R$ 34k/ano em viagens a Manaus. eMulti: R$ 36k/ano municipal → ROI de R$ 2,7M/ano em deslocamento evitado. 80 famílias/mês param de viajar.</p>
                <p><b>42 cadeirantes sem cadeira (ORCID: R$ 0 para o município)</b> — 84 surdos sem AASI (SUS fornece via CRER-AM). Triagem visual e auditiva escolar: R$ 8.400 detecta 3.200 alunos. LBI exige inclusão plena — Apuí em descumprimento.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "deficiencias" && Array.isArray(deficiencias) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={deficiencias as any[]} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="deficiencia" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="criancas_estimadas"    name="Estimadas" radius={[4,4,0,0]} fill={BRAND} />
                <Bar dataKey="criancas_diagnosticadas" name="Diagnosticadas" radius={[4,4,0,0]} fill={OK} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(deficiencias as any[]).map((d: any) => (
                <div key={d.deficiencia} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(d.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{d.deficiencia}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: statusColor(d.status) }}>{d.criancas_diagnosticadas}/{d.criancas_estimadas}</span>
                      <span className="text-slate-400"> · {d.sem_tratamento_pct}% sem trat.</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{d.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "acoes" && Array.isArray(acoes) && (
          <div className="grid gap-3">
            {(acoes as any[]).map((a: any) => (
              <div key={a.acao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: a.implementada ? OK : CRIT }} />
                    <p className="font-semibold text-sm text-slate-700">{a.acao}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${a.implementada ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {a.implementada ? "Implementada" : "Não implementada"}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">R$ {a.custo.toLocaleString()} · {a.prazo_meses}m</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução PcD Criança — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="diagnosticadas"        name="Diagnosticadas"         stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="bpc_acessado"          name="BPC acessado"           stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="escola_adaptada_pct"   name="Escola adaptada (%)"   stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
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
