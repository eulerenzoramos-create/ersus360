import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Droplets, AlertTriangle, Activity, TrendingUp } from "lucide-react";

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

export default function BancoSangueHemoterapiaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["bsh-dashboard"],  queryFn: () => apiGet("/api/banco-sangue-hemoterapia-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: componentes } = useQuery({ queryKey: ["bsh-comp"],       queryFn: () => apiGet("/api/banco-sangue-hemoterapia-apui/componentes"),  enabled: aba === "componentes" });
  const { data: campanhas }   = useQuery({ queryKey: ["bsh-camp"],       queryFn: () => apiGet("/api/banco-sangue-hemoterapia-apui/campanhas"),    enabled: aba === "campanhas" });
  const { data: historico }   = useQuery({ queryKey: ["bsh-hist"],       queryFn: () => apiGet("/api/banco-sangue-hemoterapia-apui/historico"),    enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["bsh-ind"],        queryFn: () => apiGet("/api/banco-sangue-hemoterapia-apui/indicadores"),  enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",    icon: <Droplets size={15}/> },
    { key: "componentes", label: "Componentes",  icon: <Activity size={15}/> },
    { key: "campanhas",   label: "Campanhas",    icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Droplets size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Banco de Sangue e Hemoterapia — Apuí/AM</h1>
            <p className="text-sm text-slate-500">HEMORREDE · Doação Voluntária · Hemoam Manaus · FMS Apuí/AM</p>
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
              <KPI label="Banco de sangue local"  value="NÃO"                                          color={CRIT} sub={dashRaw.referencia_hemocentro} />
              <KPI label="Coletas/ano"             value={dashRaw.coletas_ano.toString()}               color={WARN} sub={`necessidade: ${dashRaw.necessidade_estimada_bolsas} bolsas`} />
              <KPI label="Déficit de bolsas"       value={`${dashRaw.deficit_pct}%`}                   color={CRIT} sub="meta: 0% (autossuficiência)" />
              <KPI label="Doadores cadastrados"    value={dashRaw.doadores_cadastrados.toString()}      color={CRIT} sub={`taxa: ${dashRaw.taxa_doacao_por_mil}/1000 hab`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Transfusões emergenciais" value={dashRaw.transfusoes_emergenciais_ano.toString()} color={BRAND} sub="via Hemoam/ano" />
              <KPI label="Transf. suspensas (mês)"  value={dashRaw.transfusoes_suspensas_mes_anterior.toString()} color={CRIT} sub="por falta de estoque" />
              <KPI label="Hemocomponentes locais"   value={dashRaw.hemocomponentes_locais.toString()}   color={CRIT} sub="tipos disponíveis" />
              <KPI label="Bolsas descartadas"        value={`${dashRaw.bolsas_descartadas_pct}%`}       color={WARN} sub="meta: < 5%" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Coletas vs. Necessidade Anual</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={[
                    { tipo: "Coletadas",   qtd: dashRaw.coletas_ano },
                    { tipo: "Necessárias", qtd: dashRaw.necessidade_estimada_bolsas },
                  ]} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                    <XAxis dataKey="tipo" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => `${v} bolsas`} />
                    <Bar dataKey="qtd" name="Bolsas" radius={[3,3,0,0]}>
                      <Cell fill={CRIT} />
                      <Cell fill="#374151" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>Banco de sangue inexistente.</b> 100% dos hemocomponentes dependem do Hemoam em Manaus (690 km). Em emergências, o prazo de chegada é 48–72 horas.</p>
                <p><b>Taxa de doação: 0,34/1000 hab</b> — 97% abaixo da meta OMS de 10/1000. 4 transfusões suspensas no mês anterior por indisponibilidade.</p>
                <p><b>82,5% de déficit</b> — apenas 84 bolsas coletadas das 480 necessárias/ano. Cirurgias eletivas regularmente postergadas.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "componentes" && Array.isArray(componentes) && (
          <div className="grid gap-3">
            {(componentes as any[]).map((c: any) => (
              <div key={c.componente} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ background: CRIT }} />
                    <div>
                      <span className="font-semibold text-sm text-slate-700">{c.componente}</span>
                      <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                        <span>Necessidade: {c.necessidade_mensal} bolsas/mês</span>
                        <span>Fonte: {c.fonte}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold flex-shrink-0">SEM ESTOQUE LOCAL</span>
                </div>
                <p className="text-xs text-slate-500 ml-6">{c.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "campanhas" && Array.isArray(campanhas) && (
          <div className="grid gap-3">
            {(campanhas as any[]).map((c: any, i: number) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${c.status === "planejada" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                      {c.status === "planejada" ? "PLANEJADA" : "ENCERRADA"}
                    </span>
                    <span className="font-semibold text-sm text-slate-700">{c.campanha}</span>
                  </div>
                  {c.coletas > 0 && (
                    <span className="text-sm font-bold" style={{ color: OK }}>{c.aproveitadas} aproveitadas</span>
                  )}
                </div>
                <div className="flex gap-3 text-xs text-slate-400 mt-1">
                  <span>{c.data}</span>
                  {c.coletas > 0 && <>
                    <span>Coletadas: {c.coletas}</span>
                    <span>Descartadas: {c.descartadas}</span>
                  </>}
                </div>
                <p className="text-xs text-slate-500 mt-1">{c.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Hemoterapia (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="coletas"          name="Coletas/ano"         stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="transfusoes"      name="Transfusões"          stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="doadores_ativos"  name="Doadores ativos"      stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="pct" dataKey="descartadas_pct"  name="Descartadas %"        stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
