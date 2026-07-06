import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Wrench, AlertTriangle, Activity, TrendingUp } from "lucide-react";

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

export default function SaudeTrabalhador() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["st-dashboard"],  queryFn: () => apiGet("/api/saude-trabalhador/dashboard"),    enabled: aba === "dashboard" });
  const { data: setores }     = useQuery({ queryKey: ["st-setores"],    queryFn: () => apiGet("/api/saude-trabalhador/setores-risco"), enabled: aba === "setores" });
  const { data: intox }       = useQuery({ queryKey: ["st-intox"],      queryFn: () => apiGet("/api/saude-trabalhador/intoxicacoes"),  enabled: aba === "intoxicacoes" });
  const { data: historico }   = useQuery({ queryKey: ["st-historico"],  queryFn: () => apiGet("/api/saude-trabalhador/historico"),     enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["st-ind"],        queryFn: () => apiGet("/api/saude-trabalhador/indicadores"),   enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",          icon: <Wrench size={15}/> },
    { key: "setores",      label: "Setores de Risco",   icon: <Activity size={15}/> },
    { key: "intoxicacoes", label: "Agrotóxicos",        icon: <AlertTriangle size={15}/> },
    { key: "historico",    label: "Histórico",          icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores",        icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Wrench size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde do Trabalhador — Apuí/AM</h1>
            <p className="text-sm text-slate-500">CAT · CEREST Humaitá · Agrotóxicos · Doenças Ocupacionais · FMS Apuí/AM</p>
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
              <KPI label="Trabalhadores Estimados" value={dashRaw.populacao_trabalhadora_estimada.toLocaleString()} color={ACCENT} />
              <KPI label="CATs Registradas/Ano"    value={dashRaw.cat_registradas_ano.toString()} color={WARN} sub={`subnotif. est. ${dashRaw.cat_subnotificadas_estimativa_pct}%`} />
              <KPI label="Acidentes Fatais/Ano"    value={dashRaw.acidentes_fatais_ano.toString()} color={CRIT} />
              <KPI label="Intox. Agrotóxicos/Ano"  value={dashRaw.intoxicacoes_agrotoxicos_ano.toString()} color={CRIT} sub="notificações confirmadas" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Afastamentos INSS/Ano"   value={dashRaw.afastamentos_inss_ano.toString()} />
              <KPI label="Acidentes Agrícolas"     value={`${dashRaw.acidentes_agricolas_pct}%`} color={WARN} sub="do total de CATs" />
              <KPI label="Trabalhadores Informais" value={`${dashRaw.trabalhadores_informais_pct}%`} color={CRIT} sub="sem proteção trabalhista" />
              <KPI label="Cobertura PCMSO"         value={`${dashRaw.cobertura_pcmso_empresas_pct}%`} color={CRIT} sub="empresas com PCMSO" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-2">CEREST de Referência</h3>
                <p className="text-sm text-slate-600">{dashRaw.cerest_referencia}</p>
                <p className="text-2xl font-bold mt-2" style={{ color: CRIT }}>{dashRaw.distancia_cerest_km} km</p>
                <p className="text-xs text-slate-400">Trabalhador intoxicado precisa percorrer esta distância para atendimento especializado</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900">
                <p><b>Corredor da soja:</b> Apuí está na fronteira agrícola do AM — uso intensivo de agrotóxicos classe I e II.</p>
                <p className="mt-2"><b>Subnotificação grave:</b> 62% das CATs estimadas não são registradas — trabalhadores informais sem acesso ao sistema.</p>
                <p className="mt-2"><b>Expostos:</b> ~1.840 trabalhadores rurais estimados com exposição a agrotóxicos em 2025.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "setores" && Array.isArray(setores) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">CATs e Doenças por Setor</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={(setores as any[])} layout="vertical" margin={{ left: 10, right: 60 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="setor" tick={{ fontSize: 9 }} width={210} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cat_ano"       name="CATs/ano"    fill={WARN}   radius={[0,3,3,0]} />
                  <Bar dataKey="doencas_notif" name="Doenças notif." fill={CRIT} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(setores as any[]).map((s: any) => (
                <div key={s.setor} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <span className="font-semibold text-sm text-slate-700">{s.setor}</span>
                      <div className="text-xs text-slate-400 mt-0.5">{s.trabalhadores.toLocaleString()} trabalhadores · Risco <b>{s.risco}</b></div>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded flex-shrink-0"
                      style={{ background: statusColor(s.status) + "22", color: statusColor(s.status) }}>
                      {s.cat_ano} CATs
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Riscos: {s.principais_riscos}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "intoxicacoes" && Array.isArray(intox) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Intoxicações por Agrotóxico — 2025 (mensal)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={(intox as any[])} margin={{ left: 0, right: 20 }}>
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="casos"          name="Casos"           fill={WARN}   radius={[3,3,0,0]} />
                  <Bar dataKey="hospitalizacoes"name="Hospitalizações" fill={CRIT}   radius={[3,3,0,0]} />
                  <Bar dataKey="fatais"         name="Fatais"          fill="#7c2d12" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(intox as any[]).map((m: any) => (
                <div key={m.mes} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm text-slate-700">{m.mes}</span>
                    <p className="text-xs text-slate-500 mt-0.5">Principal: {m.produto_principal}</p>
                  </div>
                  <div className="flex gap-4 text-right">
                    <div><p className="text-xs text-slate-400">Casos</p><p className="font-bold text-amber-700">{m.casos}</p></div>
                    <div><p className="text-xs text-slate-400">Hosp.</p><p className="font-bold text-red-600">{m.hospitalizacoes}</p></div>
                    <div><p className="text-xs text-slate-400">Fatais</p><p className="font-bold" style={{ color: m.fatais > 0 ? CRIT : "#94a3b8" }}>{m.fatais}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Saúde do Trabalhador (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="s"   orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="n" dataKey="cat"           name="CATs"             stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n" dataKey="afastamentos"  name="Afastamentos"     stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="s" dataKey="intox_agrotox" name="Intox. Agrotóx."  stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="s" dataKey="fatais"        name="Fatais"           stroke="#7c2d12" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
