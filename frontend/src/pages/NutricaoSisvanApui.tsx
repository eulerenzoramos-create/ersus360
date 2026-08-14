import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { ShoppingBag, AlertTriangle, TrendingUp, Activity } from "lucide-react";

const BRAND  = "#dbeafe";
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

export default function NutricaoSisvanApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["nut-dash"],  queryFn: () => apiGet("/api/nutricao-sisvan-apui/dashboard"),         enabled: aba === "dashboard" });
  const { data: grupos }      = useQuery({ queryKey: ["nut-grp"],   queryFn: () => apiGet("/api/nutricao-sisvan-apui/grupos"),            enabled: aba === "grupos" });
  const { data: acoes }       = useQuery({ queryKey: ["nut-acao"],  queryFn: () => apiGet("/api/nutricao-sisvan-apui/acoes"),             enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["nut-hist"],  queryFn: () => apiGet("/api/nutricao-sisvan-apui/historico"),         enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["nut-ind"],   queryFn: () => apiGet("/api/nutricao-sisvan-apui/indicadores"),       enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",         icon: <ShoppingBag size={15}/> },
    { key: "grupos",      label: "Estado Nutricional", icon: <Activity size={15}/> },
    { key: "acoes",       label: "Ações",             icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",         icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",       icon: <AlertTriangle size={15}/> },
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
            <p className="text-sm text-slate-500">Desnutrição · Obesidade · SISVAN · Vitamina A · Ferro · Insegurança Alimentar · Bolsa Família · FMS Apuí/AM</p>
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
              <KPI label="Desnutrição < 5a (meta: < 2,5%)"  value={`${dashRaw.desnutricao_crianca_pct}%`}          color={CRIT} sub={`aguda grave: ${dashRaw.desnutricao_aguda_crianca_pct}% · Ref: HGH-Humaitá`} />
              <KPI label="Anemia em gestantes (meta: < 20%)" value={`${dashRaw.anemia_gestante_pct}%`}              color={CRIT} sub="sulfato ferroso + ácido fólico: REMUME gratuito" />
              <KPI label="Obesidade adultos (meta: < 20%)"   value={`${dashRaw.obesidade_adulto_pct}%`}             color={WARN} sub={`sobrepeso: ${dashRaw.sobrepeso_adulto_pct}% · síndrome metabólica: ${dashRaw.sindrome_metabolica_estimada_pct}%`} />
              <KPI label="SISVAN cobertura (meta: 100%)"     value={`${dashRaw.sisvan_cobertura_pct}%`}             color={CRIT} sub={`${dashRaw.criancas_acompanhadas_sisvan?.toLocaleString()} crianças + ${dashRaw.gestantes_acompanhadas_sisvan} gestantes`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Vitamina A 6m-5a (meta: 100%)"    value={`${dashRaw.vitamina_a_cobertura_pct}%`}         color={CRIT} sub="MS fornece gratuitamente — dose semestral" />
              <KPI label="Ferro profilático (meta: 100%)"    value={`${dashRaw.ferro_profilatico_pct}%`}            color={CRIT} sub="6m-5a + gestantes — REMUME gratuito" />
              <KPI label="Insegurança alimentar grave"       value={`${dashRaw.inseguranca_alimentar_grave_pct}%`}  color={CRIT} sub={`${dashRaw.bolsa_familia_familias?.toLocaleString()} famílias no Bolsa Família`} />
              <KPI label="Nutricionista em Apuí"             value={`${dashRaw.nutricionista_apui} profissional`}   color={CRIT} sub="eMulti: R$ 84.000/ano (50% PREVINE) → 120 consultas/mês" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Panorama Nutricional — Apuí/AM 2025</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Desnutrição < 5a",      val: dashRaw.desnutricao_crianca_pct, meta: 2.5, inv: true },
                    { label: "Anemia gestante",        val: dashRaw.anemia_gestante_pct,     meta: 20,  inv: true },
                    { label: "Obesidade adulto",       val: dashRaw.obesidade_adulto_pct,    meta: 20,  inv: true },
                    { label: "SISVAN cobertura",       val: dashRaw.sisvan_cobertura_pct,    meta: 100, inv: false },
                    { label: "Vitamina A (0-5a)",      val: dashRaw.vitamina_a_cobertura_pct, meta: 100, inv: false },
                    { label: "Cantina escolar saudável", val: dashRaw.cantina_escolar_saudavel_pct, meta: 100, inv: false },
                  ].map((f: any) => (
                    <div key={f.label} className="flex items-center gap-2">
                      <span className="text-slate-600 w-40 text-xs">{f.label}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: `${Math.min(f.val, 100)}%`, background: f.inv ? (f.val <= f.meta ? OK : CRIT) : (f.val >= f.meta * 0.8 ? OK : CRIT) }} />
                      </div>
                      <span className="font-bold text-xs" style={{ color: f.inv ? (f.val <= f.meta ? OK : CRIT) : (f.val >= f.meta * 0.8 ? OK : CRIT) }}>{f.val}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>12,4% de desnutrição em crianças &lt; 5a</b> (meta &lt; 2,5% — 5×). 4,8% em desnutrição aguda grave (risco de óbito). Vitamina A: 52,4% (meta 100%). Sulfato ferroso profilático: 42,4% (meta 100%). MS fornece ambos gratuitamente. Busca ativa ACS: R$ 8.400.</p>
                <p><b>52,4% das gestantes com anemia</b> (meta &lt; 20%). Sulfato ferroso + ácido fólico: REMUME gratuito — aderência 42,4%. Anemia gestacional: baixo peso ao nascer + prematuridade + mortalidade perinatal. 8,4% com insegurança alimentar grave = 2.075 pessoas com fome real.</p>
                <p><b>Zero nutricionista em Apuí</b>. eMulti: R$ 84.000/ano (50% PREVINE Brasil). 120 consultas/mês = 1.440/ano. SISVAN: 42,4% (meta 100%). Cantina escolar saudável: 18,4% (Lei Estadual AM). Obesidade infantil: 18,4% — ultra-processados na escola.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "grupos" && Array.isArray(grupos) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={grupos as any[]} margin={{ top: 5, right: 20, bottom: 80, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="grupo" tick={{ fontSize: 8 }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="desnutricao_pct" name="Desnutrição (%)"  radius={[4,4,0,0]}>
                  {(grupos as any[]).map((g: any, i: number) => <Cell key={i} fill={statusColor(g.status)} />)}
                </Bar>
                <Bar dataKey="sobrepeso_pct"   name="Sobrepeso (%)"   radius={[4,4,0,0]} fill={WARN} opacity={0.7} />
                <Bar dataKey="anemia_pct"      name="Anemia (%)"      radius={[4,4,0,0]} fill={ACCENT} opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(grupos as any[]).map((g: any) => (
                <div key={g.grupo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(g.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{g.grupo}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: statusColor(g.status) }}>Desnut.: {g.desnutricao_pct}%</span>
                      <p className="text-slate-400 mt-0.5">Sobrepeso: {g.sobrepeso_pct}% · Anemia: {g.anemia_pct}%</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{g.observacao}</p>
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
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Nutricional — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left"  tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="desnutricao_crianca_pct" name="Desnut. < 5a (%)"       stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="obesidade_adulto_pct"    name="Obesidade adulto (%)"   stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="left"  dataKey="anemia_gestante_pct"     name="Anemia gestante (%)"    stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
                <Line yAxisId="right" dataKey="sisvan_pct"              name="SISVAN cobertura (%)"   stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="inseg_alimentar_pct"     name="Inseg. alimentar (%)"   stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="6 2" />
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
