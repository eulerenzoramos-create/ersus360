import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { MessageSquare, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";

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

const TIPO_COLORS: Record<string, string> = {
  "Reclamação":  CRIT,
  "Denúncia":    "#7c2d12",
  "Sugestão":    OK,
  "Elogio":      ACCENT,
  "Solicitação": WARN,
};

export default function OuvidoriaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["ouv-dashboard"],  queryFn: () => apiGet("/api/ouvidoria-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: temas }       = useQuery({ queryKey: ["ouv-temas"],      queryFn: () => apiGet("/api/ouvidoria-apui/temas"),      enabled: aba === "temas" });
  const { data: canais }      = useQuery({ queryKey: ["ouv-canais"],     queryFn: () => apiGet("/api/ouvidoria-apui/canais"),     enabled: aba === "canais" });
  const { data: historico }   = useQuery({ queryKey: ["ouv-historico"],  queryFn: () => apiGet("/api/ouvidoria-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["ouv-ind"],        queryFn: () => apiGet("/api/ouvidoria-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",      icon: <MessageSquare size={15}/> },
    { key: "temas",       label: "Temas",          icon: <TrendingDown size={15}/> },
    { key: "canais",      label: "Canais",         icon: <MessageSquare size={15}/> },
    { key: "historico",   label: "Histórico",      icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",    icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <MessageSquare size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Ouvidoria Municipal de Saúde — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Manifestações · Reclamações · Denúncias · Tempo de Resposta · FMS Apuí/AM</p>
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
              <KPI label="Manifestações Totais/Ano" value={dashRaw.manifestacoes_total_ano.toString()} color={ACCENT} />
              <KPI label="Reclamações"              value={dashRaw.reclamacoes.toString()}             color={CRIT}   sub={`${((dashRaw.reclamacoes/dashRaw.manifestacoes_total_ano)*100).toFixed(1)}% do total`} />
              <KPI label="Denúncias"                value={dashRaw.denuncias.toString()}               color={WARN} />
              <KPI label="Taxa de Resposta"         value={`${dashRaw.respondidas_pct}%`}             color={WARN}   sub={`meta: ${dashRaw.meta_resposta_pct}%`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Tempo Médio Resposta"    value={`${dashRaw.tempo_medio_resposta_dias} dias`} color={WARN}   sub={`meta: ${dashRaw.meta_tempo_dias} dias`} />
              <KPI label="Manifestações Anônimas"  value={`${dashRaw.anonimas_pct}%`} />
              <KPI label="Reincidências"           value={dashRaw.reincidencias_ano.toString()}        color={WARN}   sub="mesma queixa recorrente" />
              <KPI label="Satisfação do Usuário"   value={`${dashRaw.satisfacao_media_nota}/5`}        color={WARN}   sub={`meta: ${dashRaw.satisfacao_meta_nota}/5`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Tipo de Manifestação</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={[
                      { name: "Reclamação",  value: dashRaw.reclamacoes },
                      { name: "Denúncia",    value: dashRaw.denuncias },
                      { name: "Sugestão",    value: dashRaw.sugestoes },
                      { name: "Elogio",      value: dashRaw.elogios },
                      { name: "Solicitação", value: dashRaw.solicitacoes },
                    ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }: any) => `${(percent*100).toFixed(0)}%`}>
                      {[CRIT, "#7c2d12", OK, ACCENT, WARN].map((c) => <Cell key={c} fill={c} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Canal Predominante</h3>
                <div className="flex items-center justify-center h-28">
                  <div className="text-center">
                    <p className="text-3xl font-bold" style={{ color: BRAND }}>{dashRaw.canal_predominante}</p>
                    <p className="text-xs text-slate-400 mt-2">52,1% das manifestações chegam presencialmente — reflexo da baixa conectividade digital na zona rural</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {aba === "temas" && Array.isArray(temas) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Temas mais Frequentes — Manifestações 2025</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={(temas as any[])} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="tema" tick={{ fontSize: 9 }} width={230} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip formatter={(v: any, n: any) => [v, n === "total" ? "Manifestações" : "Resolvidas %"]} />
                  <Bar dataKey="total" name="Manifestações" radius={[0,3,3,0]}>
                    {(temas as any[]).map((t: any) => <Cell key={t.tema} fill={statusColor(t.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(temas as any[]).map((t: any) => (
                <div key={t.tema} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-slate-700">{t.tema}</span>
                    <div className="flex gap-3 text-xs">
                      <span className="font-bold" style={{ color: statusColor(t.status) }}>{t.total} manif.</span>
                      <span className="text-slate-400">{t.pct}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 flex-shrink-0 w-20">Resolvidas:</span>
                    <ProgressBar value={t.resolvidas_pct} max={100} color={statusColor(t.status)} />
                    <span className="text-xs font-medium w-10 text-right" style={{ color: statusColor(t.status) }}>{t.resolvidas_pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "canais" && Array.isArray(canais) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Manifestações por Canal</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={(canais as any[])} margin={{ left: 0, right: 20 }}>
                  <XAxis dataKey="canal" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip />
                  <Bar dataKey="manifestacoes" name="Manifestações" radius={[3,3,0,0]}>
                    {(canais as any[]).map((_: any, i: number) => {
                      const colors = [BRAND, ACCENT, OK, WARN, "#7c3aed"];
                      return <Cell key={i} fill={colors[i % colors.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(canais as any[]).map((c: any, i: number) => {
                const colors = [BRAND, ACCENT, OK, WARN, "#7c3aed"];
                return (
                  <div key={c.canal} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm text-slate-700">{c.canal}</span>
                      <span className="font-bold text-sm" style={{ color: colors[i % colors.length] }}>{c.pct}%</span>
                    </div>
                    <ProgressBar value={c.pct} max={100} color={colors[i % colors.length]} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal — Ouvidoria (Jan–Jun/2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="total"          name="Total manif."    stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="reclamacoes"    name="Reclamações"     stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="denuncias"      name="Denúncias"       stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="respondidas_pct"name="Respondidas %"   stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
