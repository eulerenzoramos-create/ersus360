import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Baby, AlertTriangle, TrendingUp, Activity } from "lucide-react";

const BRAND  = "#1e3a5f";
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

export default function SaudeNeonatalApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["neo-dashboard"], queryFn: () => apiGet("/api/saude-neonatal-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: triagem }     = useQuery({ queryKey: ["neo-triagem"],   queryFn: () => apiGet("/api/saude-neonatal-apui/triagem"),      enabled: aba === "triagem" });
  const { data: partos }      = useQuery({ queryKey: ["neo-partos"],    queryFn: () => apiGet("/api/saude-neonatal-apui/partos"),       enabled: aba === "partos" });
  const { data: historico }   = useQuery({ queryKey: ["neo-hist"],      queryFn: () => apiGet("/api/saude-neonatal-apui/historico"),    enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["neo-ind"],       queryFn: () => apiGet("/api/saude-neonatal-apui/indicadores"),  enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",    icon: <Baby size={15}/> },
    { key: "triagem",     label: "Triagem",      icon: <Activity size={15}/> },
    { key: "partos",      label: "Partos",       icon: <Activity size={15}/> },
    { key: "historico",   label: "Histórico",    icon: <TrendingUp size={15}/> },
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
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Neonatal — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Triagem neonatal · UCIN · Prematuridade · Aleitamento · Mortalidade neonatal · FMS Apuí/AM</p>
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
              <KPI label="Mortalidade neonatal"  value={`${dashRaw.taxa_mortalidade_neonatal_1k}/1k NV`}  color={CRIT} sub="meta: 5/1k" />
              <KPI label="Prematuridade"         value={`${dashRaw.prematuridade_pct}%`}                  color={CRIT} sub="meta: 8%" />
              <KPI label="UCIN / UTI neonatal"   value={`${dashRaw.ucin_leitos + dashRaw.uti_neonatal_leitos} leitos`} color={CRIT} sub="zero em Apuí" />
              <KPI label="Parto domiciliar"      value={`${dashRaw.parto_domiciliar_pct}%`}               color={CRIT} sub={`ribeirinho: ${dashRaw.parto_domiciliar_ribeirinho_pct}%`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Triagem pezinho"       value={`${dashRaw.triagem_neonatal_cobertura_pct}%`}     color={WARN} sub="meta: 100%" />
              <KPI label="Triagem orelhinha"     value={`${dashRaw.teste_orelhinha_pct}%`}                color={CRIT} sub="meta: 100%" />
              <KPI label="Aleitamento até 6m"    value={`${dashRaw.aleitamento_exclusivo_6m_pct}%`}       color={WARN} sub="meta: 50%" />
              <KPI label="Cesariana"             value={`${dashRaw.cesarea_pct}%`}                        color={CRIT} sub="meta: 30%" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Triagem Neonatal — Cobertura por Teste</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Pezinho (${dashRaw.triagem_neonatal_cobertura_pct}%)`,  value: dashRaw.triagem_neonatal_cobertura_pct, color: WARN },
                    { label: `Orelhinha (${dashRaw.teste_orelhinha_pct}%)`,           value: dashRaw.teste_orelhinha_pct,           color: CRIT },
                    { label: `Olhinho (${dashRaw.teste_olhinho_pct}%)`,               value: dashRaw.teste_olhinho_pct,             color: WARN },
                    { label: `Coraçãozinho (${dashRaw.teste_coracaozinho_pct}%)`,     value: dashRaw.teste_coracaozinho_pct,        color: WARN },
                  ].map((b: any) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                      </div>
                      <ProgressBar value={b.value} max={100} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex flex-col gap-2 justify-center">
                <p><b>Zero UCIN e UTI neonatal</b> — prematuridade 12,4% (meta 8%): cada prematuro ribeirinho é transferido 784 km para Manaus em estado crítico. Mortalidade no trajeto estimada em 28,4% dos casos graves.</p>
                <p><b>51,6% sem triagem auditiva</b> — surdez congênita não detectada = atraso de linguagem até 6-7 anos (detectada na escola, não no berçário). Janela terapêutica: 0-6 meses. Zero fonoaudiólogo em Apuí.</p>
                <p><b>Cesariana 48,4%</b> (meta OMS 30%) — sem anestesista fixo e sem protocolo humanizado, o plantonista clínico resolve cirurgicamente. Cada cesariana desnecessária: risco 3x maior de complicações materno-neonatais.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "triagem" && Array.isArray(triagem) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-2">
              <h3 className="font-semibold text-slate-700 mb-3">Cobertura de Triagem Neonatal (%)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={triagem as any[]} layout="vertical" margin={{ top: 5, right: 40, bottom: 5, left: 160 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <YAxis type="category" dataKey="teste" tick={{ fontSize: 9 }} width={155} />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="cobertura_pct" name="Cobertura atual (%)" radius={[0,4,4,0]}>
                    {(triagem as any[]).map((t: any) => (
                      <Cell key={t.teste} fill={statusColor(t.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {(triagem as any[]).map((t: any) => (
              <div key={t.teste} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(t.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{t.teste}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: statusColor(t.status) }}>{t.cobertura_pct}%</span>
                    <p className="text-xs text-slate-400">meta: {t.meta_pct}% · janela: {t.janela_ideal_horas}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{t.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "partos" && Array.isArray(partos) && (
          <div className="grid gap-3">
            {(partos as any[]).map((p: any) => (
              <div key={p.local} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(p.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{p.local}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: BRAND }}>{p.numero_ano} partos/ano</span>
                    <p className="text-xs text-slate-400">cesárea {p.cesarea_pct}% · prematuro {p.prematuridade_pct}% · óbito neonatal: {p.obito_neonatal}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{p.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Saúde Neonatal — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="mortalidade_neonatal_1k" name="Mortalidade neonatal /1k NV" stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="prematuridade_pct"       name="Prematuridade (%)"           stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="triagem_pct"             name="Triagem pezinho (%)"         stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="aleitamento_6m_pct"      name="Aleitamento 6m (%)"          stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
