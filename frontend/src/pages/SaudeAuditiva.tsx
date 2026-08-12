import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";
import { Radio, AlertTriangle, Users, Activity } from "lucide-react";

const BRAND  = "#dbeafe";
const ACCENT = "#0ea5e9";
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

const GRAU_COLORS = [OK, ACCENT, WARN, "#f97316", CRIT];

export default function SaudeAuditiva() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["aud-dashboard"],
    queryFn: () => apiGet("/api/saude-auditiva/dashboard"),
    enabled: aba === "dashboard",
  });
  const { data: graus } = useQuery({
    queryKey: ["aud-graus"],
    queryFn: () => apiGet("/api/saude-auditiva/graus-perda"),
    enabled: aba === "graus",
  });
  const { data: tan } = useQuery({
    queryKey: ["aud-tan"],
    queryFn: () => apiGet("/api/saude-auditiva/tan-historico"),
    enabled: aba === "tan",
  });
  const { data: aasi } = useQuery({
    queryKey: ["aud-aasi"],
    queryFn: () => apiGet("/api/saude-auditiva/aasi-estoque"),
    enabled: aba === "aasi",
  });
  const { data: indicadores } = useQuery({
    queryKey: ["aud-indicadores"],
    queryFn: () => apiGet("/api/saude-auditiva/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",   icon: <Radio size={15}/> },
    { key: "graus",       label: "Graus Perda", icon: <Users size={15}/> },
    { key: "tan",         label: "TAN",         icon: <Activity size={15}/> },
    { key: "aasi",        label: "AASI Estoque",icon: <AlertTriangle size={15}/> },
    { key: "indicadores", label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Radio size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Auditiva</h1>
            <p className="text-sm text-slate-500">TAN · AASI · CER · Fonoaudiologia · FMS Apuí/AM</p>
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
              <KPI label="Pacientes c/ Perda Aud."  value={dashRaw.pacientes_perda_auditiva.toString()} />
              <KPI label="AASI Adaptados/Ano"       value={dashRaw.aasi_adaptados_total.toString()} color={ACCENT} />
              <KPI label="Lista Espera AASI"        value={dashRaw.aasi_lista_espera.toString()} color={CRIT} />
              <KPI label="TAN Cobertura"            value={`${dashRaw.tan_cobertura_pct}%`} sub="meta: 95%" color={WARN} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="TAN Confirm. 2026"        value={dashRaw.tan_confirmados_2026.toString()} sub="perdas confirmadas" />
              <KPI label="Severo/Prof. s/ AASI"     value={dashRaw.grau_severo_profundo_sem_aasi.toString()} color={CRIT} />
              <KPI label="Avaliações/Mês"           value={dashRaw.avaliacoes_mes.toString()} color={ACCENT} />
              <KPI label="RF Estoque Crítico"       value={dashRaw.aasi_modelos_estoque_critico.toString()} sub="modelos abaixo do mínimo" color={CRIT} />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
              <b>AASI pediátrico crítico:</b> apenas 3 unidades BTE pediátrico em estoque — menos de 1 mês. {dashRaw.grau_severo_profundo_sem_aasi} pacientes com perda severa/profunda sem adaptação. TAN {dashRaw.tan_cobertura_pct}% — meta 95%.
            </div>
          </div>
        )}

        {aba === "graus" && Array.isArray(graus) && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col items-center">
              <h3 className="font-semibold text-slate-700 mb-4 self-start">Distribuição por Grau</h3>
              <PieChart width={220} height={220}>
                <Pie data={graus} dataKey="casos" nameKey="grau" cx={110} cy={100} outerRadius={90}
                  label={({ pct }) => `${pct}%`}>
                  {(graus as any[]).map((_: any, i: number) => (
                    <Cell key={i} fill={GRAU_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>
            <div className="space-y-3">
              {(graus as any[]).map((g: any, i: number) => (
                <div key={g.grau} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: GRAU_COLORS[i] }} />
                      <span className="font-semibold text-slate-700 text-sm">{g.grau}</span>
                    </div>
                    <span className="font-bold text-sm" style={{ color: GRAU_COLORS[i] }}>{g.casos} ({g.pct}%)</span>
                  </div>
                  {g.aasi_indicado && (
                    <div className="text-xs text-slate-500">
                      AASI indicado — Adaptados: <b style={{ color: OK }}>{g.aasi_adaptados}</b>
                      {g.lista_espera > 0 && <span style={{ color: CRIT }}> · Lista espera: <b>{g.lista_espera}</b></span>}
                    </div>
                  )}
                  <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${g.pct * 2}%`, background: GRAU_COLORS[i] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "tan" && Array.isArray(tan) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">TAN — Triagem Auditiva Neonatal (2022–2026*)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={tan} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" domain={[80, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar  yAxisId="n"   dataKey="triados"           name="Triados"          fill={ACCENT} radius={[3,3,0,0]} />
                <Bar  yAxisId="n"   dataKey="confirmados_perda" name="Perda Confirm."   fill={CRIT}   radius={[3,3,0,0]} />
                <Line yAxisId="pct" dataKey="cobertura_pct"     name="Cobertura (%)"   stroke={OK}   strokeWidth={2} dot={{ r: 4 }} type="monotone" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {aba === "aasi" && Array.isArray(aasi) && (
          <div className="space-y-3">
            {(aasi as any[]).map((a: any) => (
              <div key={a.modelo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(a.status_equipamento || a.status) }} />
                    <span className="font-semibold text-slate-700">{a.modelo}</span>
                  </div>
                  <span className="font-bold text-sm" style={{ color: statusColor(a.status) }}>
                    Estoque: {a.estoque} un.
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                  <span>Dispensados/ano: <b>{a.dispensados_ano}</b></span>
                  <span>Demanda/mês: <b>{a.demanda_mensal}</b></span>
                  <span style={{ color: a.estoque < a.demanda_mensal * 2 ? CRIT : OK }}>
                    Cobertura: <b>{Math.round(a.estoque / a.demanda_mensal)} meses</b>
                  </span>
                </div>
                <div className="mt-2 w-full bg-slate-100 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{
                    width: `${Math.min((a.estoque / (a.demanda_mensal * 3)) * 100, 100)}%`,
                    background: statusColor(a.status),
                  }} />
                </div>
              </div>
            ))}
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
                      {`${ind.valor} ${ind.unidade}`}{ind.meta != null ? ` / meta: ${ind.meta} ${ind.unidade}` : ""}
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
