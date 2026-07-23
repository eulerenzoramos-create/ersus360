import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { MapPin, AlertTriangle, Activity, Users } from "lucide-react";

const BRAND  = "#7c2d12";
const ACCENT = "#ea580c";
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

export default function SaudeIndigenaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["si-dashboard"], queryFn: () => apiGet("/api/saude-indigena-apui/dashboard"),         enabled: aba === "dashboard" });
  const { data: aldeias }     = useQuery({ queryKey: ["si-aldeias"],   queryFn: () => apiGet("/api/saude-indigena-apui/aldeias"),           enabled: aba === "aldeias" });
  const { data: indSaude }    = useQuery({ queryKey: ["si-indics"],    queryFn: () => apiGet("/api/saude-indigena-apui/indicadores-saude"), enabled: aba === "saude" });
  const { data: historico }   = useQuery({ queryKey: ["si-historico"], queryFn: () => apiGet("/api/saude-indigena-apui/historico"),         enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["si-ind"],       queryFn: () => apiGet("/api/saude-indigena-apui/indicadores"),       enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",    icon: <MapPin size={15}/> },
    { key: "aldeias",     label: "Aldeias",      icon: <MapPin size={15}/> },
    { key: "saude",       label: "Saúde Indíg.", icon: <Activity size={15}/> },
    { key: "historico",   label: "Histórico",    icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <MapPin size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Indígena — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Tenharim · Mura · Parintintin · Jiahui · 18 Aldeias · EMSI · UBSI · FMS Apuí/AM</p>
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
              <KPI label="População Indígena"     value={dashRaw.populacao_indigena.toLocaleString()} color={ACCENT} sub={`${dashRaw.etnias.length} etnias`} />
              <KPI label="Aldeias Total"          value={dashRaw.aldeias_total.toString()} />
              <KPI label="Aldeias com EMSI"       value={`${dashRaw.aldeias_com_emsi}/${dashRaw.aldeias_total}`} color={WARN} />
              <KPI label="Óbitos Indígenas/Ano"   value={dashRaw.obitos_indigenas_ano.toString()} color={CRIT} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Óbito Infantil Indíg."  value={`${dashRaw.obito_infantil_indigena_por_mil}/1k`} color={CRIT} sub="meta: 10/1k NV" />
              <KPI label="Desnutrição Inf. Indíg."value={`${dashRaw.desnutricao_infantil_indigena_pct}%`} color={CRIT} sub="vs 8,4% municipal" />
              <KPI label="Malária em Indígenas"   value={`${dashRaw.malaria_indigena_pct_total}%`}        color={CRIT} sub="dos casos totais" />
              <KPI label="Vacinação Indígena"     value={`${dashRaw.imunizacao_indigena_pct}%`}           color={WARN} sub="meta: 95%" />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-3">Etnias Presentes em Apuí/AM</h3>
              <div className="flex flex-wrap gap-2">
                {dashRaw.etnias.map((e: string) => (
                  <span key={e} className="px-3 py-1 rounded-full text-sm font-medium" style={{ background: ACCENT + "22", color: BRAND }}>{e}</span>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">Polo Base: {dashRaw.polo_base} · {dashRaw.emsi_total} EMSI · {dashRaw.ubsi_total} UBSI</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900">
              <b>Situação crítica da saúde indígena.</b> Óbito infantil 38,4/1k NV (quase 4× a meta). Indígenas são 5,6% da população mas representam 48,4% dos casos de malária. 6 aldeias sem EMSI. Saneamento básico em apenas 28,4% das aldeias.
            </div>
          </div>
        )}

        {aba === "aldeias" && Array.isArray(aldeias) && (
          <div className="grid gap-3">
            {(aldeias as any[]).map((a: any) => (
              <div key={a.aldeia} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-700">{a.aldeia}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-700">{a.etnia}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span>Pop.: <b>{a.populacao}</b></span>
                      <span>Acesso: <b>{a.acesso}</b></span>
                      <span>Distância: <b>{a.distancia_polo_km} km</b> do polo</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded"
                    style={{ background: statusColor(a.status) + "22", color: statusColor(a.status) }}>
                    {a.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex gap-3 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${a.emsi ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    EMSI: {a.emsi ? "✓" : "✗"}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${a.ubsi ? "bg-green-50 text-green-700" : "bg-slate-50 text-slate-500"}`}>
                    UBSI: {a.ubsi ? "✓" : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "saude" && Array.isArray(indSaude) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Indicadores de Saúde Indígena vs. Meta</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(indSaude as any[]).filter((i: any) => i.meta_pct != null).map((i: any) => ({ ind: i.indicador.substring(0, 30), valor: i.valor, meta: i.meta_pct || i.meta_por_mil }))} layout="vertical" margin={{ left: 10, right: 60 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="ind" tick={{ fontSize: 7 }} width={220} />
                  <Tooltip />
                  <Bar dataKey="valor" name="Valor atual" radius={[0,3,3,0]}>
                    {(indSaude as any[]).filter((i: any) => i.meta_pct != null).map((i: any) => <Cell key={i.indicador} fill={statusColor(i.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(indSaude as any[]).map((ind: any) => (
                <div key={ind.indicador} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                  <span className="text-sm text-slate-700">{ind.indicador}</span>
                  <div className="text-right">
                    <span className="font-bold text-sm" style={{ color: statusColor(ind.status) }}>{ind.valor}{ind.unidade}</span>
                    {ind.meta_pct && <span className="text-xs text-slate-400 ml-2">/ meta: {ind.meta_pct}{ind.unidade}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Saúde Indígena 2022–2025</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" tick={{ fontSize: 11 }} unit="%" />
                <YAxis yAxisId="n"   orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="pct" dataKey="cobertura_vacinal"   name="Vacinação %"       stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="desnutricao_inf"     name="Desnutrição Inf. %" stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="malaria_casos"       name="Malária (casos)"    stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="obitos"              name="Óbitos"             stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
