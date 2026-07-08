import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Network, AlertTriangle, TrendingUp, Activity } from "lucide-react";

const BRAND  = "#1e3a5f";
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

export default function RegulacaoReferenciaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["reg-dash"],  queryFn: () => apiGet("/api/regulacao-referencia-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: filas }       = useQuery({ queryKey: ["reg-fil"],   queryFn: () => apiGet("/api/regulacao-referencia-apui/filas"),      enabled: aba === "filas" });
  const { data: acoes }       = useQuery({ queryKey: ["reg-acao"],  queryFn: () => apiGet("/api/regulacao-referencia-apui/acoes"),      enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["reg-hist"],  queryFn: () => apiGet("/api/regulacao-referencia-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["reg-ind"],   queryFn: () => apiGet("/api/regulacao-referencia-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Network size={15}/> },
    { key: "filas",       label: "Filas",      icon: <Activity size={15}/> },
    { key: "acoes",       label: "Ações",      icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Network size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Regulação e Referência — Apuí/AM</h1>
            <p className="text-sm text-slate-500">SISREG · Filas de Espera · Tele-saúde · Transporte Sanitário · Referências Regionais · FMS Apuí/AM</p>
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
              <KPI label="Pendências SISREG"                      value={(dashRaw.solicitacoes_sisreg_pendentes||0).toLocaleString()} color={CRIT} sub={`taxa regulação: ${dashRaw.taxa_regulacao_pct}% — ${dashRaw.solicitacoes_inseridas_mes} sol./mês inseridas`} />
              <KPI label="Tempo médio de espera (meta: ≤ 30 dias)" value={`${dashRaw.tempo_medio_espera_dias} dias`}               color={CRIT} sub={`psiquiatria: ${dashRaw.espera_psiquiatria_dias}d · neurologia: ${dashRaw.espera_neurologia_dias}d`} />
              <KPI label="Tele-saúde — consultorias/mês (meta: 100)" value={`${dashRaw.telessaude_consultorias_mes}/mês`}          color={CRIT} sub="TELESSAÚDE-AM: tele-psiquiatria, neuro, cardio, derm, oftalmo" />
              <KPI label="Ambulância UTI-móvel em Apuí"            value={`${dashRaw.ambulancia_uti_apui} / ${dashRaw.ambulancia_basica_apui} básicas`} color={CRIT} sub={`transporte emergência: ${dashRaw.transporte_sanitario_urgencia_mes}/mês`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Pacientes que perdem consulta regulada"  value={`${dashRaw.pacientes_perdidos_consulta_pct}%`}            color={CRIT} sub="falha de comunicação — SMS + ligação: -42% de perdas" />
              <KPI label="Tomógrafo em Apuí"                       value={dashRaw.tomografo_apui ? "Disponível" : "Indisponível"}   color={CRIT} sub={`espera tomografia: ${dashRaw.espera_tomografia_dias} dias SISREG`} />
              <KPI label="Espera — Psiquiatria"                    value={`${dashRaw.espera_psiquiatria_dias} dias`}                color={CRIT} sub="11 suicídios 2025 — tele-psiquiatria: espera → 10 dias" />
              <KPI label="Custo transporte Manaus (ida+volta)"     value={`R$ ${(dashRaw.custo_transporte_manaus_ida_volta||0).toLocaleString()}`} color={CRIT} sub="1 tele-consultoria = R$ 2.800 evitados" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Filas por Especialidade — Tempo de Espera em Dias</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Psiquiatria",      dias: dashRaw.espera_psiquiatria_dias,     meta: 30 },
                    { label: "Neurologia",        dias: dashRaw.espera_neurologia_dias,       meta: 30 },
                    { label: "Cardiologia",       dias: dashRaw.espera_cardiologia_dias,      meta: 30 },
                    { label: "Urologia",          dias: dashRaw.espera_urologia_dias,         meta: 30 },
                    { label: "Oftalmologia",      dias: dashRaw.espera_oftalmologia_dias,     meta: 30 },
                    { label: "Ortopedia",         dias: dashRaw.espera_ortopedia_dias,        meta: 30 },
                  ].map((f: any) => (
                    <div key={f.label} className="flex items-center gap-2">
                      <span className="text-slate-600 w-28 text-xs">{f.label}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div className="h-2 rounded-full bg-red-500" style={{ width: `${Math.min(f.dias / 500 * 100, 100)}%` }} />
                      </div>
                      <span className="font-bold text-xs" style={{ color: CRIT }}>{f.dias}d</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>2.840 solicitações pendentes no SISREG</b> — taxa de regulação 50%. Tempo médio 184 dias (meta 30d). Psiquiatria: 480 dias — 11 suicídios em 2025. Tele-psiquiatria: espera → 10 dias. Custo: R$ 0 (TELESSAÚDE-AM já disponível). 18 consultorias/mês — meta 100.</p>
                <p><b>28,4% perdem a consulta depois de regulada</b> — falha de comunicação. SMS + ligação 24h antes: -42% de perdas. Custo: R$ 0 (chip municipal). Ambulância UTI-móvel: zero. IAM + AVC + neonatal: transporte em ambulância básica = mortalidade aumentada.</p>
                <p><b>284 na fila de catarata + 142 cegueiras irreversíveis</b>. Mutirão SES-AM: R$ 84.000 → 200 cirurgias em 1 semana. 1 cego de catarata: custo social R$ 280.000 (cuidador + LOAS + produtividade). Tele-saúde expansão: R$ 8.400 → ROI 33:1 em deslocamentos evitados.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "filas" && Array.isArray(filas) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={filas as any[]} margin={{ top: 5, right: 20, bottom: 60, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="especialidade" tick={{ fontSize: 8 }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="espera_dias"   name="Espera atual (dias)" radius={[4,4,0,0]}>
                  {(filas as any[]).map((f: any, i: number) => <Cell key={i} fill={statusColor(f.status)} />)}
                </Bar>
                <Bar dataKey="meta_dias"     name="Meta (dias)"         radius={[4,4,0,0]} fill={OK} opacity={0.3} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(filas as any[]).map((f: any) => (
                <div key={f.especialidade} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(f.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{f.especialidade}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: statusColor(f.status) }}>{f.espera_dias} dias</span>
                      <span className="text-slate-400"> / meta {f.meta_dias}d</span>
                      <p className="text-slate-400 mt-0.5">{f.fila_estimada} na fila</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{f.observacao}</p>
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
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Regulação — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="pendentes_sisreg"      name="Pendentes SISREG"      stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" dataKey="tempo_espera_dias"      name="Tempo espera (dias)"   stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="right" dataKey="telessaude_mes"         name="Tele-saúde/mês"        stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
                <Line yAxisId="right" dataKey="transporte_mes"         name="Transportes/mês"       stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" dataKey="perdas_consulta_pct"    name="Perdas consulta (%)"   stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="6 2" />
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
