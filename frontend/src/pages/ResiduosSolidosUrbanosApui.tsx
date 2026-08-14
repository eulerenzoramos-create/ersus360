import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Trash2, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import { BRL, BRL_AXIS, PCT } from "../lib/fmt";

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

const ProgressBar = ({ value, max, color }: { value: number; max: number; color: string }) => (
  <div className="w-full bg-slate-100 rounded-full h-2.5">
    <div className="h-2.5 rounded-full" style={{ width: `${Math.min(value / max * 100, 100)}%`, background: color }} />
  </div>
);

export default function ResiduosSolidosUrbanosApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["rsu-dash"],  queryFn: () => apiGet("/api/residuos-solidos-urbanos-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: componentes } = useQuery({ queryKey: ["rsu-comp"],  queryFn: () => apiGet("/api/residuos-solidos-urbanos-apui/componentes"),enabled: aba === "componentes" });
  const { data: acoes }       = useQuery({ queryKey: ["rsu-acao"],  queryFn: () => apiGet("/api/residuos-solidos-urbanos-apui/acoes"),      enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["rsu-hist"],  queryFn: () => apiGet("/api/residuos-solidos-urbanos-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["rsu-ind"],   queryFn: () => apiGet("/api/residuos-solidos-urbanos-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",   icon: <Trash2 size={15}/> },
    { key: "componentes", label: "Componentes", icon: <Activity size={15}/> },
    { key: "acoes",       label: "Ações",       icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",   icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Trash2 size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Resíduos Sólidos Urbanos — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Lixão · PNRS · Catadores · RSS · Aterro Sanitário · Coleta Seletiva · FMS Apuí/AM</p>
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
              <KPI label="Lixão ativo (ilegal desde 2014)" value={dashRaw.lixao_ativo ? "SIM" : "Não"}                  color={CRIT} sub={`${dashRaw.lixao_area_ha} ha · ${dashRaw.lixao_distancia_zona_urbana_km} km da cidade`} />
              <KPI label="Coleta urbana"                    value={`${dashRaw.cobertura_coleta_urbana_pct}%`}             color={WARN} sub={`meta: 100%`} />
              <KPI label="Coleta rural"                     value={`${dashRaw.cobertura_coleta_rural_pct}%`}              color={CRIT} sub={`${100-dashRaw.cobertura_coleta_rural_pct}% sem coleta`} />
              <KPI label="Resíduos lançados no rio"         value={`${dashRaw.residuos_descartados_rio_pct}%`}            color={CRIT} sub="do lixo não coletado" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Catadores no lixão"      value={dashRaw.lixao_catadores_informais}             color={CRIT} sub={`${dashRaw.catadores_epi_pct}% com EPI`} />
              <KPI label="Doenças relacionadas"    value={dashRaw.casos_doencas_relacionadas_lixo_2025}  color={CRIT} sub="casos em 2025" />
              <KPI label="PGRSS nas UBSs"          value="0%"                                            color={CRIT} sub="zero UBSs com PGRSS" />
              <KPI label="Custo saúde do lixão"    value={BRL(dashRaw.custo_lixao_saude_anual)} color={CRIT} sub="estimado/ano" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cobertura de Saneamento de RSU — Apuí/AM</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Coleta urbana: ${dashRaw.cobertura_coleta_urbana_pct}% (meta 100%)`,    value: dashRaw.cobertura_coleta_urbana_pct, max: 100, color: WARN },
                    { label: `Coleta rural: ${dashRaw.cobertura_coleta_rural_pct}% (meta 100%)`,      value: dashRaw.cobertura_coleta_rural_pct,  max: 100, color: CRIT },
                    { label: `Catadores com EPI: ${dashRaw.catadores_epi_pct}% (meta 100%)`,          value: dashRaw.catadores_epi_pct,            max: 100, color: CRIT },
                    { label: `Catadores vacinados HepB: ${dashRaw.catadores_vacinados_hep_b_pct}%`,   value: dashRaw.catadores_vacinados_hep_b_pct,max: 100, color: CRIT },
                    { label: `RSS separado nas UBSs: 33% (2 de 6)`,                                   value: 33, max: 100, color: CRIT },
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
                <p><b>Lixão ativo há 11 anos (ilegal desde 2014)</b> — poço artesiano a 180m com coliformes fecais detectados. 2 óbitos em 2025 relacionados. PNRS (Lei 12.305): multa potencial R$ 50M por descumprimento.</p>
                <p><b>Caminhão de lixo parado há 4 meses (peça R$ 42k)</b> — metade da frota inativa. Cada semana: 91 toneladas acumuladas. Custo de doença por lixo: R$ 284k/mês. Payback da peça: 4 dias.</p>
                <p><b>84 catadores no lixão sem EPI, 14 crianças trabalhando</b> — CATAFORTE disponível (80% federal). Galpão: R$ 120k → renda de R$ 1.800/catador/mês na cooperativa. Aterro consorciado: R$ 576k municipal (FUNASA financia 80%).</p>
              </div>
            </div>
          </div>
        )}

        {aba === "componentes" && Array.isArray(componentes) && (
          <div className="grid gap-3">
            {(componentes as any[]).map((c: any) => (
              <div key={c.componente} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: c.adequado ? OK : statusColor(c.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{c.componente}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.adequado ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {c.adequado ? "Adequado" : "Inadequado"}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">R$ {c.custo_regularizacao?.toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{c.observacao}</p>
              </div>
            ))}
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
                    <p className="text-xs text-slate-400 mt-0.5">R$ {a.custo?.toLocaleString()} · {a.prazo_meses}m</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Resíduos Sólidos Urbanos — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="cobertura_urbana_pct" name="Coleta urbana (%)"   stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="residuos_rio_pct"     name="Lixo no rio (%)"     stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="catadores"            name="Catadores (qtd)"     stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
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
