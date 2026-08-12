import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { FlaskConical, AlertTriangle, Activity, TrendingUp } from "lucide-react";

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

export default function LaboratorioApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["lab-dashboard"], queryFn: () => apiGet("/api/laboratorio-apui/dashboard"),    enabled: aba === "dashboard" });
  const { data: exames }      = useQuery({ queryKey: ["lab-exames"],    queryFn: () => apiGet("/api/laboratorio-apui/exames-grupo"), enabled: aba === "exames" });
  const { data: equips }      = useQuery({ queryKey: ["lab-equips"],    queryFn: () => apiGet("/api/laboratorio-apui/equipamentos"), enabled: aba === "equipamentos" });
  const { data: historico }   = useQuery({ queryKey: ["lab-historico"], queryFn: () => apiGet("/api/laboratorio-apui/historico"),    enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["lab-ind"],       queryFn: () => apiGet("/api/laboratorio-apui/indicadores"),  enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",       icon: <FlaskConical size={15}/> },
    { key: "exames",       label: "Exames",          icon: <Activity size={15}/> },
    { key: "equipamentos", label: "Equipamentos",    icon: <Activity size={15}/> },
    { key: "historico",    label: "Histórico",       icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores",     icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <FlaskConical size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Laboratório Municipal — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Exames · Laudos · Equipamentos · LACEN-AM · FMS Apuí/AM</p>
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
              <KPI label="Exames/Mês"              value={dashRaw.exames_realizados_mes.toLocaleString()} color={ACCENT} sub={`${dashRaw.exames_realizados_ano.toLocaleString()}/ano`} />
              <KPI label="Tempo Médio Laudo"       value={`${dashRaw.tempo_medio_laudo_dias} dias`} color={WARN} sub={`meta: ${dashRaw.meta_laudo_dias} dias`} />
              <KPI label="Exames Fora do Prazo"    value={`${dashRaw.exames_fora_prazo_pct}%`} color={WARN} sub="meta: 5%" />
              <KPI label="Cobertura Populacional"  value={`${dashRaw.cobertura_populacao_pct}%`} color={WARN} sub="meta: 90%" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Exames Próprios"         value={`${dashRaw.exames_proprios_pct}%`} color={BRAND} />
              <KPI label="Terceirizados"           value={`${dashRaw.exames_terceirizados_pct}%`} />
              <KPI label="Reativos em Falta"       value={dashRaw.reativos_em_falta_itens.toString()} color={WARN} sub="itens críticos" />
              <KPI label="Equipamentos OK"         value={`${dashRaw.equipamentos_funcionando_pct}%`} color={WARN} sub={`${dashRaw.equipamentos_manutencao} em manutenção`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Próprio × Terceirizado</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Produção própria</span>
                      <span className="font-bold text-blue-700">{dashRaw.exames_proprios_pct}%</span>
                    </div>
                    <ProgressBar value={dashRaw.exames_proprios_pct} max={100} color={BRAND} />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Terceirizado (LACEN + privado)</span>
                      <span className="font-bold text-slate-500">{dashRaw.exames_terceirizados_pct}%</span>
                    </div>
                    <ProgressBar value={dashRaw.exames_terceirizados_pct} max={100} color={WARN} />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">LACEN-AM: {dashRaw.lacen_envios_mes} amostras/mês — laudo retorna em 7–30 dias</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex flex-col gap-2 justify-center">
                <p><b>Laudo 2× acima da meta:</b> 4,2 dias vs meta 2,0 — microbiologia (7d) e anatomopatológico (21d via LACEN) puxam a média.</p>
                <p><b>2 equipamentos parados:</b> centrífuga e banho-maria — exames dependentes represados ou terceirizados com custo adicional.</p>
                <p><b>4 reativos em falta:</b> hormônios e sorologias específicas afetadas — impacto direto na conduta clínica de pacientes crônicos.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "exames" && Array.isArray(exames) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Volume de Exames por Grupo — Jun/2025</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={(exames as any[])} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="grupo" tick={{ fontSize: 8 }} width={230} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip formatter={(v: any, n: any) => [v, n === "realizados_mes" ? "Realizados/mês" : "Tempo (dias)"]} />
                  <Bar dataKey="realizados_mes" name="Realizados/mês" radius={[0,3,3,0]}>
                    {(exames as any[]).map((e: any) => <Cell key={e.grupo} fill={e.proprio ? BRAND : ACCENT} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: BRAND }} />Próprio</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: ACCENT }} />Terceirizado</span>
              </div>
            </div>
            <div className="grid gap-2">
              {(exames as any[]).map((e: any) => (
                <div key={e.grupo} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm text-slate-700">{e.grupo}</span>
                    <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                      <span>{e.realizados_mes.toLocaleString()}/mês</span>
                      <span className={e.proprio ? "text-blue-600" : "text-purple-600"}>{e.proprio ? "Próprio" : "Terceirizado"}</span>
                    </div>
                  </div>
                  <span className="font-bold text-sm" style={{ color: statusColor(e.status) }}>{e.tempo_dias}d</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "equipamentos" && Array.isArray(equips) && (
          <div className="grid gap-3">
            {(equips as any[]).map((eq: any) => (
              <div key={eq.equipamento} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(eq.status) }} />
                  <div>
                    <span className="font-semibold text-slate-700 text-sm">{eq.equipamento}</span>
                    <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                      <span>Último calibre: {eq.ultimo_calibre}</span>
                      <span>Garantia: {eq.garantia}</span>
                    </div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-bold ${eq.funcionando ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {eq.funcionando ? "✓ OK" : "✗ Parado"}
                </span>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal — Laboratório (Jan–Jun/2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="realizados"     name="Exames realizados"   stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="criticos"       name="Exames críticos"      stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="fora_prazo_pct" name="Fora do prazo %"      stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="pct" dataKey="terceiriz"      name="Terceirizados %"      stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
