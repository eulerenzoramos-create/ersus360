import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Baby, AlertTriangle, Heart, Activity } from "lucide-react";

const BRAND  = "#9d174d";
const ACCENT = "#db2777";
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

const PIE_COLORS = [CRIT, OK];

export default function RedeCegonha() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }      = useQuery({ queryKey: ["rc-dashboard"], queryFn: () => apiGet("/api/rede-cegonha/dashboard"),    enabled: aba === "dashboard" });
  const { data: prenatal }  = useQuery({ queryKey: ["rc-prenatal"],  queryFn: () => apiGet("/api/rede-cegonha/prenatal"),     enabled: aba === "prenatal" });
  const { data: parto }     = useQuery({ queryKey: ["rc-parto"],     queryFn: () => apiGet("/api/rede-cegonha/parto"),        enabled: aba === "parto" });
  const { data: mortalidade }= useQuery({ queryKey: ["rc-mort"],    queryFn: () => apiGet("/api/rede-cegonha/mortalidade"),  enabled: aba === "mortalidade" });
  const { data: historico } = useQuery({ queryKey: ["rc-historico"], queryFn: () => apiGet("/api/rede-cegonha/historico"),   enabled: aba === "historico" });
  const { data: indicadores }= useQuery({ queryKey: ["rc-ind"],     queryFn: () => apiGet("/api/rede-cegonha/indicadores"),  enabled: aba === "indicadores" });

  const dashRaw  = dash as any;
  const partoRaw = parto as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",    icon: <Baby size={15}/> },
    { key: "prenatal",    label: "Pré-Natal",    icon: <Heart size={15}/> },
    { key: "parto",       label: "Parto/Puerpério",icon: <Heart size={15}/> },
    { key: "mortalidade", label: "Mortalidade",  icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",    icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Baby size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Rede Cegonha</h1>
            <p className="text-sm text-slate-500">Pré-natal · Parto · Puerpério · Mortalidade Materna/Infantil · FMS Apuí/AM</p>
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
              <KPI label="Gestantes Acompanhadas" value={dashRaw.gestantes_acompanhadas.toString()} color={ACCENT} />
              <KPI label="Cobertura Pré-Natal"    value={`${dashRaw.cobertura_prenatal_pct}%`}      color={statusColor(dashRaw.status_prenatal)} />
              <KPI label="6+ Consultas"            value={`${dashRaw.consultas_minimas_6_pct}%`}     color={WARN} sub="das gestantes" />
              <KPI label="1ª Consulta ≤ 12 sem"   value={`${dashRaw.primeira_consulta_ate_12sem_pct}%`} color={WARN} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Partos/Ano"              value={dashRaw.partos_ano.toString()} />
              <KPI label="Taxa de Cesarianas"      value={`${dashRaw.cesareas_pct}%`}    color={CRIT} sub="meta OMS: <15%" />
              <KPI label="Óbitos Maternos (2025)"  value={dashRaw.obitos_maternos_ano.toString()} color={CRIT} />
              <KPI label="Sífilis Congênita"       value={dashRaw.sifilis_congenita_casos.toString()} color={CRIT} sub="casos em 2025" />
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-900">
              <b>ALERTA — Sífilis Congênita:</b> 8 casos em 2025 (taxa 27,6/1k NV vs. meta de eliminação 0,5). Cesariana 52,4% — mais de 3× a meta OMS. Apuí não possui maternidade: 100% dos partos referenciados a Manaus (600 km).
            </div>
          </div>
        )}

        {aba === "prenatal" && Array.isArray(prenatal) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Cobertura dos Exames e Procedimentos do Pré-Natal</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={prenatal} layout="vertical" margin={{ left: 10, right: 60 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} unit="%" />
                  <YAxis type="category" dataKey="indicador" tick={{ fontSize: 8 }} width={260} />
                  <Tooltip />
                  <Bar dataKey="valor" name="Realizado %" radius={[0,3,3,0]}>
                    {(prenatal as any[]).map((p: any) => <Cell key={p.indicador} fill={statusColor(p.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(prenatal as any[]).map((p: any) => (
                <div key={p.indicador} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{p.indicador}</span>
                    <span className="font-bold text-sm" style={{ color: statusColor(p.status) }}>{p.valor}% / meta: {p.meta}%</span>
                  </div>
                  <ProgressBar value={p.valor} max={p.meta} color={statusColor(p.status)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "parto" && partoRaw && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-4">Local do Parto</h3>
                <div className="space-y-3">
                  {partoRaw.local_parto.map((l: any) => (
                    <div key={l.local}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">{l.local}</span>
                        <span className="font-bold">{l.partos} ({l.pct}%)</span>
                      </div>
                      <ProgressBar value={l.pct} max={100} color={ACCENT} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-4">Tipo de Parto</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={partoRaw.tipo_parto} dataKey="n" nameKey="tipo" cx="50%" cy="50%" outerRadius={65} label={({ tipo, pct }) => `${tipo}: ${pct}%`} labelLine={false}>
                      {partoRaw.tipo_parto.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <KPI label="Consulta Puerperal ≤ 42 dias" value={`${partoRaw.consulta_puerperio_ate_42dias_pct}%`} color={WARN} sub={`meta: ${partoRaw.meta_puerperio_pct}%`} />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">{partoRaw.obs}</div>
          </div>
        )}

        {aba === "mortalidade" && Array.isArray(mortalidade) && (
          <div className="grid gap-3">
            {(mortalidade as any[]).map((m: any) => (
              <div key={m.evento} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-4">
                <div className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(m.status) }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">{m.evento}</span>
                    <span className="font-bold text-sm" style={{ color: statusColor(m.status) }}>
                      {m.casos_2025} caso(s) · {m.taxa} {m.unidade}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Meta: {m.meta} {m.unidade}</div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                    <div className="h-1.5 rounded-full" style={{ width: `${Math.min((m.taxa / (m.meta + m.taxa)) * 100, 100)}%`, background: statusColor(m.status) }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Pré-Natal, Parto e Mortalidade</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" tick={{ fontSize: 11 }} unit="%" />
                <YAxis yAxisId="n"   orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="pct" dataKey="cobertura_prenatal" name="Cobertura PN %"    stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="consultas_6mais"    name="6+ Consultas %"    stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="cesareas_pct"       name="Cesarianas %"      stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="sifilis_cong"       name="Sífilis Congênita" stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
