import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Thermometer, AlertTriangle, MapPin, Activity } from "lucide-react";

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

const IIP_COLOR = (iip: number) => iip >= 3.9 ? CRIT : iip >= 1.0 ? WARN : OK;

export default function Arboviroses() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["arb-dashboard"],
    queryFn: () => apiGet("/api/arboviroses/dashboard"),
    enabled: aba === "dashboard",
  });
  const { data: semanas } = useQuery({
    queryKey: ["arb-semanas"],
    queryFn: () => apiGet("/api/arboviroses/semanas-epidemiologicas"),
    enabled: aba === "semanas",
  });
  const { data: indice } = useQuery({
    queryKey: ["arb-indice"],
    queryFn: () => apiGet("/api/arboviroses/levantamento-indice-stegomyia"),
    enabled: aba === "indice",
  });
  const { data: historico } = useQuery({
    queryKey: ["arb-historico"],
    queryFn: () => apiGet("/api/arboviroses/historico"),
    enabled: aba === "historico",
  });
  const { data: indicadores } = useQuery({
    queryKey: ["arb-indicadores"],
    queryFn: () => apiGet("/api/arboviroses/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",   icon: <Thermometer size={15}/> },
    { key: "semanas",     label: "S. Epidem.",  icon: <AlertTriangle size={15}/> },
    { key: "indice",      label: "Índice LIRAa",icon: <MapPin size={15}/> },
    { key: "historico",   label: "Histórico",   icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Thermometer size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Arboviroses</h1>
            <p className="text-sm text-slate-500">Dengue · Zika · Chikungunya · LIRAa · FMS Apuí/AM</p>
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
              <KPI label="Dengue Confirm./Ano"  value={dashRaw.dengue_confirmados_ano.toString()} color={CRIT} />
              <KPI label="IIP Municipal"        value={`${dashRaw.iip_municipal}%`} sub="meta: ≤1%" color={CRIT} />
              <KPI label="Dengue Grave/Ano"     value={dashRaw.dengue_graves_ano.toString()} color={WARN} />
              <KPI label="Bairros Críticos"     value={dashRaw.bairros_criticos.toString()} sub="IIP ≥3.9%" color={CRIT} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Chikungunya/Ano"      value={dashRaw.chikungunya_notificacoes_ano.toString()} color={WARN} />
              <KPI label="Zika/Ano"             value={dashRaw.zika_notificacoes_ano.toString()} />
              <KPI label="Depósitos Elim./Mês"  value={dashRaw.depositos_eliminados_mes.toString()} color={OK} />
              <KPI label="Sorotipos DENV"       value={(dashRaw.sorotipos_circulantes || []).join(" + ")} color={CRIT} />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <b>Pico epidêmico:</b> SE {dashRaw.semana_pico} com {dashRaw.casos_semana_pico} notificações. IIP municipal {dashRaw.iip_municipal}% — risco {dashRaw.nivel_infestacao.toUpperCase()}. Circulação simultânea de DENV-1 e DENV-3 aumenta risco de formas graves.
            </div>
          </div>
        )}

        {aba === "semanas" && Array.isArray(semanas) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Dengue por Semana Epidemiológica (2026)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={semanas} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="semana" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="dengue_notif" name="Notificações" fill={ACCENT} radius={[3,3,0,0]} />
                <Bar dataKey="dengue_conf"  name="Confirmados"  fill={CRIT}   radius={[3,3,0,0]} />
                <Bar dataKey="chik_notif"   name="Chikungunya"  fill={WARN}   radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {aba === "indice" && Array.isArray(indice) && (
          <div className="space-y-3">
            <div className="flex gap-4 text-xs mb-2">
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full" style={{ background: OK }} /> Baixo (&lt;1%)</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full" style={{ background: WARN }} /> Médio (1–3.9%)</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full" style={{ background: CRIT }} /> Alto (≥3.9%)</span>
            </div>
            {(indice as any[]).map((b: any) => (
              <div key={b.bairro} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: IIP_COLOR(b.iip) }} />
                    <span className="font-semibold text-slate-700 text-sm">{b.bairro}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: IIP_COLOR(b.iip) + "22", color: IIP_COLOR(b.iip) }}>
                      {b.risco.toUpperCase()}
                    </span>
                  </div>
                  <span className="font-bold text-sm" style={{ color: IIP_COLOR(b.iip) }}>IIP {b.iip}%</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                  <span>IB: <b>{b.ib}%</b></span>
                  <span>ITO: <b>{b.ito}%</b></span>
                </div>
              </div>
            ))}
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
                <YAxis yAxisId="iip" orientation="right" domain={[0, 8]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="dengue"        name="Dengue"        stroke={CRIT}  strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="n"   dataKey="chik"          name="Chikungunya"   stroke={WARN}  strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="n"   dataKey="zika"          name="Zika"          stroke="#0891b2" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="iip" dataKey="iip"           name="IIP (%)"       stroke={ACCENT} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
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
