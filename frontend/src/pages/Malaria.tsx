import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Bug, AlertTriangle, MapPin, Activity } from "lucide-react";

const BRAND  = "#14532d";
const ACCENT = "#16a34a";
const OK     = "#16a34a";
const WARN   = "#d97706";
const CRIT   = "#dc2626";
const FALC   = "#dc2626";
const VIVAX  = "#2563eb";

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

const AREA_COLORS: Record<string, string> = {
  urbana: "#2563eb", rural: "#d97706", ribeirinha: "#0891b2", garimpo: "#dc2626",
};

export default function Malaria() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["mal-dashboard"],
    queryFn: () => apiGet("/api/malaria/dashboard"),
    enabled: aba === "dashboard",
  });
  const { data: localidades } = useQuery({
    queryKey: ["mal-localidades"],
    queryFn: () => apiGet("/api/malaria/localidades"),
    enabled: aba === "localidades",
  });
  const { data: semanas } = useQuery({
    queryKey: ["mal-semanas"],
    queryFn: () => apiGet("/api/malaria/serie-semanas"),
    enabled: aba === "semanas",
  });
  const { data: historico } = useQuery({
    queryKey: ["mal-historico"],
    queryFn: () => apiGet("/api/malaria/historico"),
    enabled: aba === "historico",
  });
  const { data: indicadores } = useQuery({
    queryKey: ["mal-indicadores"],
    queryFn: () => apiGet("/api/malaria/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",    icon: <Bug size={15}/> },
    { key: "localidades", label: "Localidades",  icon: <MapPin size={15}/> },
    { key: "semanas",     label: "S. Epidem.",   icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",    icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Bug size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Malária</h1>
            <p className="text-sm text-slate-500">IPA · Falciparum · Vivax · SIVEP-Malária · FMS Apuí/AM</p>
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
              <KPI label="Casos/Mês"         value={dashRaw.casos_mes.toString()} color={CRIT} />
              <KPI label="IPA Municipal"     value={dashRaw.ipa_municipio.toString()} sub="/1000 hab — EPIDEMIA" color={CRIT} />
              <KPI label="P. falciparum"     value={`${dashRaw.falciparum_pct}%`} sub="dos casos" color={FALC} />
              <KPI label="P. vivax"          value={`${dashRaw.vivax_pct}%`} sub="dos casos" color={VIVAX} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Graves/Mês"        value={dashRaw.casos_graves_mes.toString()} color={CRIT} />
              <KPI label="Óbitos/Ano"        value={dashRaw.obitos_ano.toString()} color={dashRaw.obitos_ano > 0 ? CRIT : OK} />
              <KPI label="Cura Tratam."      value={`${dashRaw.cura_tratamento_pct}%`} color={OK} />
              <KPI label="Exames/Mês"        value={dashRaw.exames_mes.toString()} />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <b>ALERTA EPIDÊMICO — SE {dashRaw.pos_semana_epidemiologica}/2026:</b> IPA {dashRaw.ipa_municipio}/1000 hab supera limiar de epidemia. {dashRaw.ivp_iip}. Sorotipos circulantes: {dashRaw.sorotipos_circulantes?.join(", ")}.
            </div>
          </div>
        )}

        {aba === "localidades" && Array.isArray(localidades) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">IPA por Localidade</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={localidades} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="localidade" tick={{ fontSize: 9 }} width={200} />
                  <Tooltip />
                  <Bar dataKey="ipa" name="IPA" radius={[0,3,3,0]}>
                    {(localidades as any[]).map((l: any) => (
                      <Cell key={l.localidade} fill={AREA_COLORS[l.area] || CRIT} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(localidades as any[]).map((l: any) => (
                <div key={l.localidade} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: AREA_COLORS[l.area] || CRIT }} />
                      <span className="font-semibold text-slate-700 text-sm">{l.localidade}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: AREA_COLORS[l.area] + "22", color: AREA_COLORS[l.area] }}>{l.area}</span>
                    </div>
                    <span className="font-bold text-sm" style={{ color: statusColor(l.status) }}>IPA {l.ipa}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-slate-500">
                    <span>Exames: <b>{l.exames_mes}</b></span>
                    <span>Positivos: <b>{l.positivos_mes}</b></span>
                    <span style={{ color: FALC }}>Falc.: <b>{l.falciparum_pct}%</b></span>
                    <span style={{ color: VIVAX }}>Vivax: <b>{l.vivax_pct}%</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "semanas" && Array.isArray(semanas) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Série por Semana Epidemiológica (2026)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={semanas} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="semana" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="vivax"       name="P. vivax"      fill={VIVAX} stackId="a" />
                <Bar dataKey="falciparum"  name="P. falciparum" fill={FALC}  stackId="a" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal (2026)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="ipa" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="casos"          name="Casos Totais"   stroke={CRIT}   strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="n"   dataKey="falciparum"     name="P. falciparum"  stroke={FALC}   strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
                <Line yAxisId="n"   dataKey="vivax"          name="P. vivax"       stroke={VIVAX}  strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
                <Line yAxisId="ipa" dataKey="ipa"            name="IPA"            stroke={WARN}   strokeWidth={2} dot={{ r: 3 }} />
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
                      {`${ind.valor} ${ind.unidade}`}{ind.meta ? ` / meta: ${ind.meta} ${ind.unidade}` : ""}
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
