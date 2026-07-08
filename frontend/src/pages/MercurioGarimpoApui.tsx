import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { FlaskConical, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function MercurioGarimpoApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["hg-dash"],  queryFn: () => apiGet("/api/mercurio-garimpo-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: exposicao }   = useQuery({ queryKey: ["hg-exp"],   queryFn: () => apiGet("/api/mercurio-garimpo-apui/exposicao"),  enabled: aba === "exposicao" });
  const { data: acoes }       = useQuery({ queryKey: ["hg-acao"],  queryFn: () => apiGet("/api/mercurio-garimpo-apui/acoes"),      enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["hg-hist"],  queryFn: () => apiGet("/api/mercurio-garimpo-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["hg-ind"],   queryFn: () => apiGet("/api/mercurio-garimpo-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <FlaskConical size={15}/> },
    { key: "exposicao",   label: "Exposição",  icon: <Activity size={15}/> },
    { key: "acoes",       label: "Ações",      icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <FlaskConical size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Mercúrio e Garimpo — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Hg sangue · Metilmercúrio · Crianças · Gestantes · Garimpeiros · Rios · FMS Apuí/AM</p>
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
              <KPI label="Crianças com Hg > limite CDC"    value={`${dashRaw.criancas_hg_acima_limite_pct}%`}            color={CRIT} sub={`média ${dashRaw.criancas_hg_sangue_ug_dl_medio} µg/dL (limite ${dashRaw.limite_cdc_hg_sangue_ug_dl})`} />
              <KPI label="Hg médio em peixes (rios garimpo)" value={`${dashRaw.nivel_hg_peixe_medio_mg_kg} mg/kg`}       color={CRIT} sub={`${dashRaw.nivel_hg_peixe_vezes_limite}× o limite OMS (${dashRaw.limite_oms_hg_peixe_mg_kg} mg/kg)`} />
              <KPI label="Gestantes com Hg acima OMS"      value={`${dashRaw.gestantes_expostas_hg_estimadas} gestantes`}color={CRIT} sub={`cabelo médio ${dashRaw.gestantes_hg_cabelo_ppm_medio} ppm (limite ${dashRaw.limite_oms_gestante_hg_cabelo_ppm} ppm)`} />
              <KPI label="Garimpeiros com Hg > limite"     value={`${dashRaw.garimpeiros_hg_urina_acima_limite_pct}%`}   color={CRIT} sub={`${dashRaw.garimpeiros_ativos_estimados.toLocaleString()} garimpeiros ativos`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Microcefalia — área de garimpo"  value={dashRaw.microcefalia_garimpo_2025}                     color={CRIT} sub="nenhuma investigada para Hg em 2025" />
              <KPI label="QI perdido por criança exposta"  value={`${dashRaw.qi_perdido_pontos_medio_crianca_exposta} pontos`} color={CRIT} sub="dano neurológico irreversível" />
              <KPI label="Rios contaminados por garimpo"   value={dashRaw.rios_contaminados_mercurio}                    color={CRIT} sub={`${(dashRaw.mercurio_liberado_rios_kg_2025_estimado||0).toLocaleString()} kg Hg em rios (2025)`} />
              <KPI label="Monitoramento Hg nos rios"       value="Inexistente"                                           color={CRIT} sub="zero análise de sedimento/água/peixe" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Exposição ao Mercúrio por Grupo</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Crianças 0-6a: ${dashRaw.criancas_hg_acima_limite_pct}% acima limite (28,4 µg/dL médio)`,     value: dashRaw.criancas_hg_acima_limite_pct, max: 100, color: CRIT },
                    { label: `Gestantes: ${dashRaw.gestantes_hg_cabelo_ppm_medio} ppm (limite OMS 1,0 ppm)`,                  value: dashRaw.gestantes_hg_cabelo_ppm_medio, max: 10, color: CRIT },
                    { label: `Garimpeiros com sintomas neurológicos: ${dashRaw.sintomas_neurológicos_garimpeiros_pct}%`,       value: dashRaw.sintomas_neurológicos_garimpeiros_pct, max: 100, color: CRIT },
                    { label: `Garimpeiros formalizados (com EPI): ${dashRaw.garimpeiros_formalizados_pct}%`,                   value: dashRaw.garimpeiros_formalizados_pct, max: 100, color: CRIT },
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
                <p><b>84,4% das crianças ribeirinhas com Hg acima do limite CDC</b> — média 28,4 µg/dL (8,1× o limite). QI perdido: 7,4 pontos/criança. Dano irreversível. Rastreio DBS: R$ 70.728 para 842 crianças.</p>
                <p><b>8 microcéfalas em 2025 em área de garimpo</b> — zero investigadas para mercúrio. Hg fetal = 1,7× concentração materna. Cabelo de gestante revela 1 mês de exposição. Rastreio: R$ 51.520 para 184 gestantes.</p>
                <p><b>Hg em peixe: 3,7× o limite OMS</b>. Cartilha peixes seguros: R$ 2.400 → -60% de exposição por via alimentar. Matrinxã e curimatã: seguros. Tucunaré e dourada: proibido para gestantes e crianças.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "exposicao" && Array.isArray(exposicao) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={exposicao as any[]} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="grupo" tick={{ fontSize: 8 }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="n_estimado"          name="N estimado"       radius={[4,4,0,0]} fill={ACCENT} />
                <Bar dataKey="acima_limite_pct"    name="Acima limite (%)" radius={[4,4,0,0]}>
                  {(exposicao as any[]).map((e: any, i: number) => <Cell key={i} fill={statusColor(e.status)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(exposicao as any[]).map((e: any) => (
                <div key={e.grupo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(e.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{e.grupo}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: statusColor(e.status) }}>{e.acima_limite_pct}% acima limite</span>
                      <span className="text-slate-400"> · Hg: {e.hg_medio_ug_dl} µg/dL</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 ml-5 mb-1"><b>Via:</b> {e.via_principal}</p>
                  <p className="text-xs text-slate-500 ml-5">{e.observacao}</p>
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
                  <div className="text-right text-xs">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${a.implementada ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {a.implementada ? "Implementada" : "Não implementada"}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">R$ {(a.custo||0).toLocaleString()} · {a.prazo_meses}m</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mercúrio e Garimpo — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="criancas_hg_acima_pct"   name="Crianças Hg > limite (%)"  stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="gestantes_hg_acima_pct"  name="Gestantes Hg > limite (%)" stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="right" dataKey="garimpeiros_ativos"       name="Garimpeiros ativos"        stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
                <Line yAxisId="right" dataKey="area_garimpo_km2"         name="Área garimpo (km²)"        stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="microcefalia_garimpo"     name="Microcefalia (área garimpo)" stroke={OK}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="6 2" />
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
