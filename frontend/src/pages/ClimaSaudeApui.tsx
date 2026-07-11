import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Thermometer, AlertTriangle, TrendingUp, Activity } from "lucide-react";

const BRAND  = "#1e3a5f";
const ACCENT = "#1d4ed8";
const OK     = "#16a34a";
const WARN   = "#d97706";
const CRIT   = "#dc2626";

function magColor(m: string) {
  if (m === "critico") return CRIT;
  if (m === "atencao") return WARN;
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

export default function ClimaSaudeApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["clim-dashboard"], queryFn: () => apiGet("/api/clima-saude-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: impactos }    = useQuery({ queryKey: ["clim-impactos"],  queryFn: () => apiGet("/api/clima-saude-apui/impactos"),    enabled: aba === "impactos" });
  const { data: adaptacao }   = useQuery({ queryKey: ["clim-adapt"],     queryFn: () => apiGet("/api/clima-saude-apui/adaptacao"),   enabled: aba === "adaptacao" });
  const { data: historico }   = useQuery({ queryKey: ["clim-hist"],      queryFn: () => apiGet("/api/clima-saude-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["clim-ind"],       queryFn: () => apiGet("/api/clima-saude-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",     icon: <Thermometer size={15}/> },
    { key: "impactos",    label: "Impactos",      icon: <AlertTriangle size={15}/> },
    { key: "adaptacao",   label: "Adaptação",     icon: <Activity size={15}/> },
    { key: "historico",   label: "Histórico",     icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",   icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Thermometer size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Clima e Saúde — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Queimadas · Seca · Calor extremo · Mercúrio · Vetores · Agrotóxicos · FMS Apuí/AM</p>
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
              <KPI label="Focos queimada 2024"      value={dashRaw.queimadas_focos_2024?.toLocaleString()}     color={CRIT} sub={`${dashRaw.qualidade_ar_dias_ruins_2024} dias ar ruim`} />
              <KPI label="Aumento temperatura 45a"  value={`+${dashRaw.aumento_temperatura_graus}°C`}          color={CRIT} sub={`${dashRaw.temperatura_media_1980}°C → ${dashRaw.temperatura_media_2025}°C`} />
              <KPI label="Mercúrio — expostos"      value={`${dashRaw.mercurio_exposicao_garimpo_casos}`}       color={CRIT} sub="garimpo/peixes carnívoros" />
              <KPI label="Seca extrema 2024"        value={`${dashRaw.seca_extrema_dias_2024} dias`}            color={CRIT} sub={`rio: ${dashRaw.nivel_rio_apui_minimo_2024_cm}cm mínimo`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Desmatamento acumulado"   value={`${dashRaw.desmatamento_acumulado_pct}%`}            color={CRIT} sub={`${dashRaw.desmatamento_2024_km2} km² em 2024`} />
              <KPI label="Água tratada"             value={`${dashRaw.agua_tratada_pct}%`}                      color={CRIT} sub="meta: 100%" />
              <KPI label="Vetores (+10a)"           value={`+${dashRaw.doencas_vetoriais_aumento_pct_10a}%`}   color={CRIT} sub="doenças vetoriais" />
              <KPI label="PM2,5 pico queimadas"     value={`${dashRaw.pm25_pico_ug_m3} μg/m³`}                 color={CRIT} sub="meta OMS: 15 μg/m³" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Indicadores Climáticos e Sanitários</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Água tratada (${dashRaw.agua_tratada_pct}%)`,              value: dashRaw.agua_tratada_pct, max: 100, color: CRIT },
                    { label: `Saneamento básico (${dashRaw.saneamento_basico_pct}%)`,    value: dashRaw.saneamento_basico_pct, max: 100, color: CRIT },
                    { label: `Vacina febre amarela (72,4%)`,                              value: 72.4, max: 95, color: WARN },
                    { label: `Malária aumento seca (${dashRaw.malaria_aumento_seca_pct}%)`, value: dashRaw.malaria_aumento_seca_pct, max: 100, color: CRIT },
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
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex flex-col gap-2 justify-center">
                <p><b>PM2,5 das queimadas: 19x acima da meta OMS</b> — 284 μg/m³ vs meta 15 μg/m³. 68 dias/ano com ar irrespirável. Asma: exacerbação em 284 pacientes. Zero protocolo de alerta de qualidade do ar em Apuí.</p>
                <p><b>Mercúrio no peixe: principal proteína ribeirinha</b> — 72,4% da população ribeirinha depende do peixe. Peixe carnívoro (tucunaré): 8,4x acima do limite OMS. 142 expostos, 8 com sintomas neurológicos. Dosagem de Hg-U: não disponível em Apuí.</p>
                <p><b>+2,6°C em 45 anos</b> — Amazônia aquece 2x mais que a média global pelo efeito do desmatamento. 84 dias/ano &gt; 35°C. 62,4% sem água tratada na seca. Diarreia +48,4% em crianças &lt; 5a durante seca.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "impactos" && Array.isArray(impactos) && (
          <div className="grid gap-3">
            {(impactos as any[]).map((i: any) => (
              <div key={i.impacto} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: magColor(i.magnitude) }} />
                    <p className="font-semibold text-sm text-slate-700">{i.impacto}</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: i.magnitude === "critico" ? "#fee2e2" : "#fef3c7", color: magColor(i.magnitude) }}>
                    {i.magnitude}
                  </span>
                </div>
                <p className="text-xs text-slate-500 ml-5">{i.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "adaptacao" && Array.isArray(adaptacao) && (
          <div className="grid gap-3">
            {(adaptacao as any[]).map((a: any) => (
              <div key={a.medida} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: a.implementada ? OK : CRIT }} />
                    <p className="font-semibold text-sm text-slate-700">{a.medida}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${a.implementada ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {a.implementada ? "Implementada" : "Não implementada"}
                    </span>
                    {a.custo_implantacao > 0 && <p className="text-xs text-slate-400 mt-0.5">custo: R$ {a.custo_implantacao?.toLocaleString()}</p>}
                    {a.custo_implantacao === 0 && <p className="text-xs text-green-600 mt-0.5">custo R$ 0</p>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Clima e Saúde — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="focos_queimada"        name="Focos queimada"         stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="casos_malaria"         name="Malária (casos)"        stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="intox_agrotoxicos"     name="Intox. agrotóxicos"     stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="temperatura_media"     name="Temp. média (°C)"       stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {aba === "indicadores" && Array.isArray(indicadores) && (
          <div className="grid gap-3">
            {(indicadores as any[]).map((ind: any) => (
              <div key={ind.indicador} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-4">
                <div className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: ind.status === "critico" ? CRIT : WARN }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 text-sm">{ind.indicador}</span>
                    <span className="font-bold text-sm" style={{ color: ind.status === "critico" ? CRIT : WARN }}>
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
