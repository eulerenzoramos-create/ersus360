import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Smile, AlertTriangle, Activity, TrendingUp } from "lucide-react";

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

const CAUSA_COLORS: Record<string, string> = {
  "Infecções respiratórias agudas": CRIT,
  "Doenças diarreicas agudas":       "#7c3aed",
  "Prematuridade / BPN":            ACCENT,
  "Malformação congênita":          "#64748b",
  "Causas externas (afogamento)":   WARN,
};

export default function SaudeCriancaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["sc-dashboard"],   queryFn: () => apiGet("/api/saude-crianca-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: mortalidade } = useQuery({ queryKey: ["sc-mortalidade"], queryFn: () => apiGet("/api/saude-crianca-apui/mortalidade"), enabled: aba === "mortalidade" });
  const { data: nutricao }    = useQuery({ queryKey: ["sc-nutricao"],    queryFn: () => apiGet("/api/saude-crianca-apui/nutricao"),    enabled: aba === "nutricao" });
  const { data: historico }   = useQuery({ queryKey: ["sc-historico"],   queryFn: () => apiGet("/api/saude-crianca-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["sc-ind"],         queryFn: () => apiGet("/api/saude-crianca-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",    icon: <Smile size={15}/> },
    { key: "mortalidade",  label: "Mortalidade",  icon: <AlertTriangle size={15}/> },
    { key: "nutricao",     label: "Nutrição",     icon: <Activity size={15}/> },
    { key: "historico",    label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Smile size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde da Criança — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Mortalidade Infantil · Nutrição · D/C · Aleitamento · AIDPI · FMS Apuí/AM</p>
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
              <KPI label="Mortalidade Infantil"  value={`${dashRaw.mortalidade_infantil_1k_NV}/1k NV`} color={statusColor(dashRaw.status_mortalidade)} sub="meta: 10" />
              <KPI label="Óbitos Infantis/Ano"   value={dashRaw.obitos_infantis_ano.toString()} color={CRIT} sub="80% evitáveis" />
              <KPI label="Baixo Peso ao Nascer"  value={`${dashRaw.baixo_peso_nascer_pct}%`} color={WARN} sub={`meta: ${dashRaw.meta_baixo_peso_pct}%`} />
              <KPI label="Prematuridade"         value={`${dashRaw.prematuridade_pct}%`} color={WARN} sub="< 37 semanas" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Aleitamento Exc. 6m"   value={`${dashRaw.aleitamento_materno_exclusivo_6m_pct}%`} color={statusColor(dashRaw.status_aleitamento)} sub={`meta: ${dashRaw.meta_aleitamento_pct}%`} />
              <KPI label="Desnutrição < 2a"       value={`${dashRaw.desnutricao_grave_menores2_pct}%`} color={statusColor(dashRaw.status_nutricao)} sub={`meta: ${dashRaw.meta_desnutricao_pct}%`} />
              <KPI label="Peso Monitorado < 2a"   value={`${dashRaw.cobertura_peso_monitorado_pct}%`} color={OK} sub={`meta: ${dashRaw.meta_peso_monitorado_pct}%`} />
              <KPI label="Caderneta Atualizada"   value={`${dashRaw.criancas_com_caderneta_atualizada_pct}%`} color={WARN} sub="das crianças 0-9a" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Mortalidade Neonatal por Período</h3>
                <div className="space-y-3">
                  {[
                    { label: "Neonatal precoce (0-6d)",  value: dashRaw.mortalidade_neonatal_precoce, color: CRIT },
                    { label: "Neonatal tardia (7-27d)",  value: dashRaw.mortalidade_neonatal_tardia,  color: WARN },
                    { label: "Pós-neonatal (28d-<1a)",   value: dashRaw.mortalidade_pos_neonatal,     color: ACCENT },
                  ].map((b) => (
                    <div key={b.label} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">{b.label}</span>
                      <span className="font-bold text-sm" style={{ color: b.color }}>{b.value}/1k NV</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>80% dos óbitos infantis eram evitáveis</b> — diarreia, IRA, afogamento e prematuridade evitável com pré-natal e saneamento.</p>
                <p><b>Desnutrição grave 4,8%</b> — 2× acima da meta 2%. Ribeirinhos com taxa estimada 12,4% — sem água tratada, sem alimentação complementar adequada.</p>
                <p><b>Aleitamento exclusivo 6m: 42,4%</b> — 17,6 pp abaixo da meta. Retorno precoce ao trabalho e falta de suporte de lactação são as principais causas.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "mortalidade" && Array.isArray(mortalidade) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Óbitos Infantis por Causa — Apuí/AM (2025)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={mortalidade as any[]} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="causa" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v: any) => `${v} óbito(s)`} />
                  <Bar dataKey="obitos" name="Óbitos" radius={[3,3,0,0]}>
                    {(mortalidade as any[]).map((m: any) => <Cell key={m.causa} fill={CAUSA_COLORS[m.causa] || BRAND} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(mortalidade as any[]).map((m: any) => (
                <div key={m.causa} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: CAUSA_COLORS[m.causa] || BRAND }} />
                    <span className="font-semibold text-sm text-slate-700">{m.causa}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.evitavel && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">EVITÁVEL</span>}
                    <span className="text-lg font-bold" style={{ color: statusColor(m.status) }}>{m.obitos}</span>
                    <span className="text-xs text-slate-400">({m.pct}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "nutricao" && Array.isArray(nutricao) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Indicadores Nutricionais por Faixa Etária</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={nutricao as any[]} margin={{ top: 5, right: 60, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="faixa" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="resultado_pct" name="Resultado (%)" radius={[3,3,0,0]}>
                    {(nutricao as any[]).map((n: any) => <Cell key={n.faixa} fill={statusColor(n.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(nutricao as any[]).map((n: any) => (
                <div key={n.faixa} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="font-semibold text-sm text-slate-700">{n.indicador}</span>
                      <p className="text-xs text-slate-400">{n.faixa} · {n.total.toLocaleString()} crianças</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold" style={{ color: statusColor(n.status) }}>{n.resultado_pct}%</span>
                      <p className="text-xs text-slate-400">meta: {n.meta_pct}%</p>
                    </div>
                  </div>
                  <ProgressBar value={n.resultado_pct} max={Math.max(n.meta_pct, n.resultado_pct)} color={statusColor(n.status)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Saúde da Criança (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="s" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n" dataKey="mi_1k_nv"         name="MI (/1k NV)"          stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="s" dataKey="desnutricao_pct"   name="Desnutrição grave (%)" stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="s" dataKey="ame_pct"           name="Aleitamento exc. (%)"  stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
