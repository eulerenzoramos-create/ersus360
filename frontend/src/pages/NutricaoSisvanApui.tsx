import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { ShoppingBag, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

const FAIXA_COLORS = [CRIT, CRIT, WARN, WARN, WARN, CRIT, CRIT];

export default function NutricaoSisvanApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["nut-dashboard"],  queryFn: () => apiGet("/api/nutricao-sisvan-apui/dashboard"),         enabled: aba === "dashboard" });
  const { data: estNutri }    = useQuery({ queryKey: ["nut-estado"],     queryFn: () => apiGet("/api/nutricao-sisvan-apui/estado-nutricional"), enabled: aba === "estado" });
  const { data: micros }      = useQuery({ queryKey: ["nut-micros"],     queryFn: () => apiGet("/api/nutricao-sisvan-apui/micronutrientes"),    enabled: aba === "micronutrientes" });
  const { data: historico }   = useQuery({ queryKey: ["nut-hist"],       queryFn: () => apiGet("/api/nutricao-sisvan-apui/historico"),          enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["nut-ind"],        queryFn: () => apiGet("/api/nutricao-sisvan-apui/indicadores"),        enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",      label: "Dashboard",       icon: <ShoppingBag size={15}/> },
    { key: "estado",         label: "Estado Nutric.",  icon: <Activity size={15}/> },
    { key: "micronutrientes",label: "Micronutrientes", icon: <AlertTriangle size={15}/> },
    { key: "historico",      label: "Histórico",       icon: <TrendingUp size={15}/> },
    { key: "indicadores",    label: "Indicadores",     icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <ShoppingBag size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Nutrição / SISVAN — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Desnutrição · Anemia · Micronutrientes · SISVAN · FMS Apuí/AM</p>
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
              <KPI label="Desnutrição Grave < 5a"  value={`${dashRaw.desnutricao_grave_menor5a_pct}%`}  color={CRIT} sub={`meta: ${dashRaw.meta_desnutricao_pct}%`} />
              <KPI label="Anemia Gestantes"         value={`${dashRaw.anemia_gestantes_pct}%`}           color={CRIT} sub={`meta: ${dashRaw.meta_anemia_gestantes_pct}%`} />
              <KPI label="Anemia < 5 anos"          value={`${dashRaw.anemia_criancas_menor5a_pct}%`}    color={CRIT} sub="déficit cognitivo reversível" />
              <KPI label="Baixo Peso ao Nascer"     value={`${dashRaw.baixo_peso_nascer_pct}%`}          color={CRIT} sub={`meta: ${dashRaw.meta_baixo_peso_pct}%`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Cobertura SISVAN"         value={`${dashRaw.sisvan_cobertura_pct}%`}           color={WARN} sub={`meta: ${dashRaw.meta_sisvan_pct}%`} />
              <KPI label="Vitamina A < 5a"          value={`${dashRaw.vitamina_a_menor5a_pct}%`}         color={CRIT} sub={`meta: ${dashRaw.meta_vitamina_a_pct}%`} />
              <KPI label="Excesso Peso Adultos"     value={`${dashRaw.excesso_peso_adultos_pct}%`}       color={WARN} sub="transição nutricional" />
              <KPI label="NutriSUS / NASF Nutric."  value="NÃO"                                          color={CRIT} sub="nenhum implantado" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Coberturas vs Metas</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: "Vitamina A < 5a",          value: dashRaw.vitamina_a_menor5a_pct,    meta: dashRaw.meta_vitamina_a_pct,      color: CRIT },
                    { label: "Sulfato ferroso gestantes", value: dashRaw.sulfato_ferroso_gestantes_pct, meta: dashRaw.meta_sulfato_ferroso_pct, color: CRIT },
                    { label: "SISVAN cobertura",          value: dashRaw.sisvan_cobertura_pct,      meta: dashRaw.meta_sisvan_pct,          color: WARN },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-bold" style={{ color: b.color }}>{b.value}% / meta {b.meta}%</span>
                      </div>
                      <ProgressBar value={b.value} max={100} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>Desnutrição + obesidade no mesmo domicílio</b> — transição nutricional. Criança desnutrida (4,8%) e mãe com excesso de peso (38,4%) é padrão frequente em assentamentos e comunidades ribeirinhas.</p>
                <p><b>38,4% de anemia em crianças &lt; 5a</b> — causa mais prevalente de déficit cognitivo reversível. Ferro profilático não sistematizado. Impacto no aprendizado escolar é geracional.</p>
                <p><b>NutriSUS e NASF nutricionista não implantados</b> — sem suplementação em domicílio e sem orientação dietética individual. A SMS não tem nenhum nutricionista no quadro efetivo.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "estado" && Array.isArray(estNutri) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Estado Nutricional por Faixa Etária (%)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={estNutri as any[]} margin={{ left: 10, right: 10 }}>
                  <XAxis dataKey="faixa" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="desnut_grave_pct"  name="Desnut. grave" fill={CRIT}   radius={[2,2,0,0]} stackId="a" />
                  <Bar dataKey="desnut_mod_pct"    name="Desnut. mod."  fill={WARN}   radius={[2,2,0,0]} stackId="a" />
                  <Bar dataKey="adequado_pct"      name="Adequado"      fill={OK}     radius={[2,2,0,0]} stackId="a" />
                  <Bar dataKey="excesso_pct"       name="Excesso peso"  fill={ACCENT} radius={[2,2,0,0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(estNutri as any[]).map((e: any, i: number) => (
                <div key={e.faixa} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: FAIXA_COLORS[i] }} />
                    <span className="font-semibold text-sm text-slate-700">{e.faixa}</span>
                  </div>
                  <div className="text-xs text-right space-y-0.5">
                    <div>Desnut. grave: <span className="font-bold" style={{ color: CRIT }}>{e.desnut_grave_pct}%</span> | Anemia estimada: —</div>
                    <div>Adequado: <span className="font-bold" style={{ color: OK }}>{e.adequado_pct}%</span> | Excesso: <span className="font-bold" style={{ color: ACCENT }}>{e.excesso_pct}%</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "micronutrientes" && Array.isArray(micros) && (
          <div className="space-y-3">
            {(micros as any[]).map((m: any) => (
              <div key={m.micronutriente} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: statusColor(m.status) }} />
                    <span className="font-semibold text-sm text-slate-700">{m.micronutriente}</span>
                  </div>
                  <div className="text-xs font-bold" style={{ color: statusColor(m.status) }}>
                    {m.cobertura_pct}% / meta {m.meta_pct}%
                  </div>
                </div>
                <ProgressBar value={m.cobertura_pct} max={100} color={statusColor(m.status)} />
                <p className="text-xs text-slate-500 mt-2">{m.impacto}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Nutrição / SISVAN (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(v: any) => `${v}%`} />
                <Legend />
                <Line dataKey="desnut_grave_5a_pct"     name="Desnut. grave < 5a" stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="anemia_gest_pct"          name="Anemia gestantes"   stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="sisvan_cob_pct"           name="Cobertura SISVAN"   stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="vit_a_pct"                name="Vitamina A < 5a"    stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="excesso_peso_adult_pct"   name="Excesso peso adult."stroke="#64748b"strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
