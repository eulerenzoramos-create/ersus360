import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Droplets, AlertTriangle, MapPin, Activity } from "lucide-react";

const BRAND = "#164e63";
const ACCENT = "#0891b2";
const OK = "#16a34a";
const WARN = "#d97706";
const CRIT = "#dc2626";

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

const ZONA_COLORS = ["#0891b2", "#0ea5e9", "#38bdf8", "#7dd3fc", "#bae6fd"];

export default function Abastecimento() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["abastecimento-dashboard"],
    queryFn: () => apiGet("/api/abastecimento/dashboard"),
    enabled: aba === "dashboard",
  });

  const { data: qualidade } = useQuery({
    queryKey: ["abastecimento-qualidade"],
    queryFn: () => apiGet("/api/abastecimento/qualidade-agua"),
    enabled: aba === "qualidade",
  });

  const { data: coberturas } = useQuery({
    queryKey: ["abastecimento-coberturas"],
    queryFn: () => apiGet("/api/abastecimento/coberturas"),
    enabled: aba === "coberturas",
  });

  const { data: historico } = useQuery({
    queryKey: ["abastecimento-historico"],
    queryFn: () => apiGet("/api/abastecimento/historico"),
    enabled: aba === "historico",
  });

  const { data: indicadores } = useQuery({
    queryKey: ["abastecimento-indicadores"],
    queryFn: () => apiGet("/api/abastecimento/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",    icon: <Droplets size={15}/> },
    { key: "qualidade",   label: "Qualidade",    icon: <AlertTriangle size={15}/> },
    { key: "coberturas",  label: "Coberturas",   icon: <MapPin size={15}/> },
    { key: "historico",   label: "Histórico",    icon: <Activity size={15}/> },
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
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Abastecimento &amp; Saneamento</h1>
            <p className="text-sm text-slate-500">Qualidade da Água · Cobertura · Saúde Ambiental · FMS Apuí/AM</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {ABAS.map((a) => (
            <button
              key={a.key}
              onClick={() => setAba(a.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={
                aba === a.key
                  ? { background: BRAND, color: "white" }
                  : { background: "white", color: "#475569", border: "1px solid #e2e8f0" }
              }
            >
              {a.icon} {a.label}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {aba === "dashboard" && dashRaw && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Pop. Atendida" value={dashRaw.populacao_atendida.toLocaleString()} sub={`de ${dashRaw.populacao_total_municipio.toLocaleString()}`} />
              <KPI label="Cobertura Água Tratada" value={`${dashRaw.cobertura_agua_tratada_pct}%`} color={WARN} />
              <KPI label="Cobertura Esgotamento" value={`${dashRaw.cobertura_esgotamento_pct}%`} color={CRIT} />
              <KPI label="Coleta de Lixo" value={`${dashRaw.cobertura_coleta_lixo_pct}%`} color={WARN} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Amostras/Mês" value={dashRaw.amostras_agua_potavel_mes.toString()} />
              <KPI label="Conformidade" value={`${dashRaw.amostras_conforme_pct}%`} sub={`${dashRaw.amostras_nao_conforme} não conformes`} color={WARN} />
              <KPI label="Domicílios sem Água Tratada" value={dashRaw.domicilios_sem_agua_tratada.toLocaleString()} color={CRIT} />
              <KPI label="Doenças Hídricas/Mês" value={dashRaw.doencas_transmitidas_agua_mes.toString()} color={CRIT} />
            </div>
          </div>
        )}

        {/* Qualidade da Água */}
        {aba === "qualidade" && qualidade && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <KPI label="Pontos Conformes"  value={(qualidade as any).resumo?.pontos_conformes?.toString()} color={OK} />
              <KPI label="Pontos Atenção"    value={(qualidade as any).resumo?.pontos_atencao?.toString()}   color={WARN} />
              <KPI label="Pontos Críticos"   value={(qualidade as any).resumo?.pontos_criticos?.toString()}  color={CRIT} />
            </div>
            <div className="grid gap-3">
              {((qualidade as any).pontos_monitoramento || []).map((p: any) => (
                <div key={p.ponto} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-700 text-sm">{p.ponto}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: statusColor(p.status) + "22", color: statusColor(p.status) }}>
                      {p.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2 text-xs text-slate-500">
                    <span>Cloro: <b style={{ color: p.cloro_residual < 0.2 ? CRIT : OK }}>{p.cloro_residual} mg/L</b></span>
                    <span>Turbidez: <b style={{ color: p.turbidez > 1 ? CRIT : OK }}>{p.turbidez} UNT</b></span>
                    <span>Colif. Totais: <b style={{ color: p.coliformes_totais === "Presente" ? CRIT : OK }}>{p.coliformes_totais}</b></span>
                    <span>Colif. Fecais: <b style={{ color: p.coliformes_fecais === "Presente" ? CRIT : OK }}>{p.coliformes_fecais}</b></span>
                    <span>Flúor: <b>{p.fluor} mg/L</b></span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Última coleta: {p.ultima_coleta}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coberturas */}
        {aba === "coberturas" && Array.isArray(coberturas) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Cobertura por Zona (%)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={coberturas} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="zona" tick={{ fontSize: 9 }} />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="agua_tratada_pct"  name="Água Tratada"   fill={ACCENT}>
                    {(coberturas as any[]).map((_: any, i: number) => (
                      <Cell key={i} fill={ZONA_COLORS[i % ZONA_COLORS.length]} />
                    ))}
                  </Bar>
                  <Bar dataKey="esgotamento_pct"   name="Esgotamento"    fill="#7c3aed" />
                  <Bar dataKey="coleta_lixo_pct"   name="Coleta de Lixo" fill={OK} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(coberturas as any[]).map((z: any, i: number) => (
                <div key={z.zona} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-700 text-sm">{z.zona}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: statusColor(z.status) + "22", color: statusColor(z.status) }}>
                      {z.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2 text-xs text-slate-500">
                    <span>Pop.: <b>{z.populacao.toLocaleString()}</b></span>
                    <span>Água: <b style={{ color: z.agua_tratada_pct < 50 ? CRIT : z.agua_tratada_pct < 80 ? WARN : OK }}>{z.agua_tratada_pct}%</b></span>
                    <span>Esgoto: <b style={{ color: z.esgotamento_pct < 20 ? CRIT : z.esgotamento_pct < 50 ? WARN : OK }}>{z.esgotamento_pct}%</b></span>
                    <span>Lixo: <b style={{ color: z.coleta_lixo_pct < 40 ? CRIT : z.coleta_lixo_pct < 70 ? WARN : OK }}>{z.coleta_lixo_pct}%</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Histórico */}
        {aba === "historico" && Array.isArray(historico) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal (últimos 6 meses)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="conf" domain={[80, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="n" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="conf" dataKey="conformidade_pct"  name="Conformidade (%)"    stroke={ACCENT} strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="n"    dataKey="doencas_h2o"        name="Doenças Hídricas"    stroke={CRIT}   strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="n"    dataKey="novos_domicilios_tratada" name="Novas Lig." stroke={OK}   strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Indicadores */}
        {aba === "indicadores" && Array.isArray(indicadores) && (
          <div className="grid gap-3">
            {(indicadores as any[]).map((ind: any) => (
              <div key={ind.indicador} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-4">
                <div className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(ind.status) }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 text-sm">{ind.indicador}</span>
                    <span className="font-bold text-sm" style={{ color: statusColor(ind.status) }}>
                      {`${ind.valor} ${ind.unidade}`}
                      {ind.meta !== null && ind.meta !== undefined ? ` / meta: ${ind.meta} ${ind.unidade}` : ""}
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
