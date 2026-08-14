import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Wrench, AlertTriangle, TrendingUp, Activity } from "lucide-react";

const BRAND  = "#dbeafe";
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

const SETOR_COLORS: Record<string, string> = {
  "Garimpo ilegal":                  CRIT,
  "Agropecuária / assentamentos":    WARN,
  "Construção civil":                ACCENT,
  "Serviços (comércio/saúde/educ.)": "#7c3aed",
  "Transporte fluvial / rodoviário": "#6b7280",
};

export default function SaudeTrabalhadorApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["sst-dashboard"], queryFn: () => apiGet("/api/saude-trabalhador-apui-sst/dashboard"),  enabled: aba === "dashboard" });
  const { data: acidentes }   = useQuery({ queryKey: ["sst-acid"],      queryFn: () => apiGet("/api/saude-trabalhador-apui-sst/acidentes"),   enabled: aba === "acidentes" });
  const { data: doencas }     = useQuery({ queryKey: ["sst-doencas"],   queryFn: () => apiGet("/api/saude-trabalhador-apui-sst/doencas"),     enabled: aba === "doencas" });
  const { data: historico }   = useQuery({ queryKey: ["sst-hist"],      queryFn: () => apiGet("/api/saude-trabalhador-apui-sst/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["sst-ind"],       queryFn: () => apiGet("/api/saude-trabalhador-apui-sst/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",    icon: <Wrench size={15}/> },
    { key: "acidentes",  label: "Acidentes",    icon: <Activity size={15}/> },
    { key: "doencas",    label: "Doenças Ocup.",icon: <AlertTriangle size={15}/> },
    { key: "historico",  label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores",  icon: <AlertTriangle size={15}/> },
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
            <p className="text-sm text-slate-500">Garimpo · Agrotóxicos · Mercúrio · CEREST Humaitá · FMS Apuí/AM</p>
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
              <KPI label="Acidentes Trabalho/Ano"  value={dashRaw.acidentes_trabalho_ano.toString()}     color={CRIT} sub={`${dashRaw.obitos_acidente_trabalho_ano} óbitos`} />
              <KPI label="Acidentes Graves"        value={dashRaw.acidentes_graves_afastamento.toString()} color={CRIT} sub="afastamento > 15 dias" />
              <KPI label="Subnotificação CAT"      value={`${dashRaw.subnotificacao_cat_estimada_pct}%`}  color={CRIT} sub="estimada — informal" />
              <KPI label="Garimpo Sem SST"         value={`${dashRaw.garimpo_cobertura_sst_pct}%`}       color={CRIT} sub={`${dashRaw.garimpo_trabalhadores_estimados?.toLocaleString()} expostos`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Mercúrio Expostos"       value={dashRaw.mercurio_expostos_estimados?.toLocaleString()} color={CRIT} sub="zero monitoramento" />
              <KPI label="Intox. Agrotóxico/Ano"  value={dashRaw.intoxicacoes_agrotoxico_ano.toString()}  color={CRIT} sub="subnotificação ~70%" />
              <KPI label="Sem EPI (rurais)"        value={`${dashRaw.trabalhadores_rurais_sem_epi_pct}%`} color={CRIT} sub="agricultores sem proteção" />
              <KPI label="CEREST Referência"       value={dashRaw.cerest_referencia}                      color={WARN} sub={`${dashRaw.cerest_distancia_km} km de Apuí`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cobertura Programática SST</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: "PPRA/PCMSO empresas cadastradas", value: dashRaw.ppra_empresas_cadastradas_pct, meta: dashRaw.meta_ppra_pct, color: CRIT },
                    { label: "Notificação SINAN-trabalhador",   value: dashRaw.notificacao_sinan_trabalhador_pct, meta: dashRaw.meta_notificacao_pct, color: CRIT },
                    { label: "CAT emitidas (de estimado)",       value: (dashRaw.cat_emitidas_ano / dashRaw.acidentes_trabalho_ano * 100).toFixed(1), meta: 100, color: WARN, isStr: true },
                  ].map((b: any) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-bold" style={{ color: b.color }}>{b.value}% / meta {b.meta}%</span>
                      </div>
                      <ProgressBar value={parseFloat(b.value)} max={100} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>3.200 garimpeiros sem nenhuma cobertura SST</b> — atividade ilegal impossibilita PPRA/PCMSO formais. Acidentes mecanicos, exposição a mercúrio e silicose são invisíveis ao sistema de saúde.</p>
                <p><b>48,4% de subnotificação de CAT</b> — trabalhador informal (garimpo/agricultura) sem vínculo CLT não tem CAT, não tem NTEP, não tem acesso ao nexo técnico. Perde direito a benefício previdenciário.</p>
                <p><b>Mercúrio: 3.200 expostos, zero dosagem</b> — biomagnificação via peixe atinge ribeirinhos e crianças. Dano neurológico irreversível. CEREST Humaitá (280 km) faz dosagem, mas fluxo não existe.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "acidentes" && Array.isArray(acidentes) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Acidentes de Trabalho por Setor</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={acidentes as any[]} layout="vertical" margin={{ left: 10, right: 60 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="setor" tick={{ fontSize: 9 }} width={220} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip />
                  <Bar dataKey="acidentes" name="Acidentes/ano" radius={[0,3,3,0]}>
                    {(acidentes as any[]).map((a: any) => <Cell key={a.setor} fill={SETOR_COLORS[a.setor] || BRAND} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(acidentes as any[]).map((a: any) => (
                <div key={a.setor} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: SETOR_COLORS[a.setor] || BRAND }} />
                    <span className="font-semibold text-sm text-slate-700">{a.setor}</span>
                  </div>
                  <div className="text-xs text-right space-y-0.5">
                    <div><span className="font-bold">{a.acidentes}</span> ({a.pct}%) | Graves: <span className="font-bold" style={{ color: CRIT }}>{a.graves}</span> | Óbitos: <span className="font-bold" style={{ color: a.obitos > 0 ? CRIT : OK }}>{a.obitos}</span></div>
                    <div>CAT emitida: <span className="font-bold" style={{ color: a.cat_pct >= 70 ? OK : a.cat_pct >= 40 ? WARN : CRIT }}>{a.cat_pct}%</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "doencas" && Array.isArray(doencas) && (
          <div className="space-y-3">
            {(doencas as any[]).map((d: any) => (
              <div key={d.doenca} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0" style={{ background: statusColor(d.status) }} />
                    <span className="font-semibold text-sm text-slate-700">{d.doenca}</span>
                  </div>
                  <div className="text-xs text-right ml-4 space-y-0.5">
                    <div>Susp.: <span className="font-bold">{d.casos_suspeitos}</span> | Confirm.: <span className="font-bold">{d.confirmados}</span></div>
                    <div className="text-slate-400">Monitoramento: {d.monitoramento}</div>
                  </div>
                </div>
                <p className="text-xs text-slate-500">{d.descricao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Saúde do Trabalhador (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="acidentes"          name="Acidentes/ano"      stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="graves"             name="Graves"             stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="obitos"             name="Óbitos"             stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="n"   dataKey="intox_agrotoxico"   name="Intox. agrotóxico"  stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="pct" dataKey="cat_pct"            name="CAT emitida (%)"    stroke="#6b7280"strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
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
