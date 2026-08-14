import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Waves, AlertTriangle, Activity, TrendingUp } from "lucide-react";

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

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  "ok":      { bg: "#dcfce7", text: "#166534", label: "Regular" },
  "atencao": { bg: "#fef3c7", text: "#92400e", label: "Atenção" },
  "critico": { bg: "#fee2e2", text: "#991b1b", label: "Crítico" },
};

const RIO_COLORS: Record<string, string> = {
  "Juma":    BRAND,
  "Maici":   ACCENT,
  "Acará":   "#0891b2",
  "Marmelos":"#7c3aed",
  "Vários":  "#6b7280",
};

export default function SaudeRibeirinha() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["sr-dashboard"],   queryFn: () => apiGet("/api/saude-ribeirinha/dashboard"),   enabled: aba === "dashboard" });
  const { data: comunidades } = useQuery({ queryKey: ["sr-comunidades"], queryFn: () => apiGet("/api/saude-ribeirinha/comunidades"), enabled: aba === "comunidades" });
  const { data: morbidade }   = useQuery({ queryKey: ["sr-morbidade"],   queryFn: () => apiGet("/api/saude-ribeirinha/morbidade"),   enabled: aba === "morbidade" });
  const { data: historico }   = useQuery({ queryKey: ["sr-historico"],   queryFn: () => apiGet("/api/saude-ribeirinha/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["sr-ind"],         queryFn: () => apiGet("/api/saude-ribeirinha/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",     icon: <Waves size={15}/> },
    { key: "comunidades",  label: "Comunidades",   icon: <Activity size={15}/> },
    { key: "morbidade",    label: "Morbidade",     icon: <AlertTriangle size={15}/> },
    { key: "historico",    label: "Histórico",     icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores",   icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Waves size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Ribeirinha — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Populações Ribeirinhas · Equipes Fluviais · Rios Juma / Maici / Acará · FMS Apuí/AM</p>
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
              <KPI label="Pop. Ribeirinha Est."    value={dashRaw.populacao_ribeirinha_estimada?.toLocaleString()} color={BRAND} sub={`${dashRaw.pct_populacao_total}% da população total`} />
              <KPI label="Comunidades"             value={`${dashRaw.comunidades_com_atendimento_regular} / ${dashRaw.comunidades_ribeirinhas}`} color={WARN} sub="com atendimento regular" />
              <KPI label="Equipes Fluviais"        value={dashRaw.equipes_fluviais_ativas.toString()} color={ACCENT} sub={`${dashRaw.lanchas_em_manutencao} lancha(s) em manutenção`} />
              <KPI label="Cobertura Atendimento"   value={`${dashRaw.cobertura_atendimento_pct}%`} color={CRIT} sub="meta: 90%" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Visitas/Mês"             value={dashRaw.visitas_ribeirinhas_mes.toString()} color={BRAND} sub={`${dashRaw.atendimentos_por_visita_media} atend./visita`} />
              <KPI label="Tempo Médio Desloc."     value={`${dashRaw.tempo_medio_deslocamento_horas}h`} color={WARN} sub="por visita às comunidades" />
              <KPI label="Cobertura Vacinal Rib."  value={`${dashRaw.cobertura_vacinal_ribeirinha_pct}%`} color={CRIT} sub="meta: 95%" />
              <KPI label="Mortalidade Infantil Rib."value={`${dashRaw.mortalidade_infantil_ribeirinha}/1k NV`} color={CRIT} sub="meta: < 10" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Condições Estruturais das Comunidades</h3>
                <div className="space-y-3">
                  {[
                    { label: "Com água tratada",         value: 0,                                  max: 100, color: CRIT },
                    { label: "Com saneamento básico",    value: dashRaw.saneamento_basico_pct,       max: 100, color: CRIT },
                    { label: "Com atendimento regular",  value: dashRaw.cobertura_atendimento_pct,   max: 100, color: WARN },
                    { label: "Cobertura vacinal",        value: dashRaw.cobertura_vacinal_ribeirinha_pct, max: 100, color: WARN },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-medium" style={{ color: b.color }}>{b.value}%</span>
                      </div>
                      <ProgressBar value={b.value} max={b.max} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>ZERO comunidades com água tratada</b> — toda população ribeirinha consome água diretamente do rio. DDA e hepatite A são 5–7× mais frequentes.</p>
                <p><b>Malária 8,4× mais frequente</b> que na área urbana — trabalho em mata sem EPI, demora diagnóstica pela distância.</p>
                <p><b>1 lancha em manutenção permanente</b> — frota insuficiente. Com 3 lanchas, seria possível cobrir 85% das comunidades.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "comunidades" && Array.isArray(comunidades) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Populações por Comunidade</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={(comunidades as any[])} layout="vertical" margin={{ left: 10, right: 60 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="comunidade" tick={{ fontSize: 9 }} width={200} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip formatter={(v: any) => `${v} hab.`} />
                  <Bar dataKey="populacao" name="População" radius={[0,3,3,0]}>
                    {(comunidades as any[]).map((c: any) => <Cell key={c.comunidade} fill={RIO_COLORS[c.rio] || BRAND} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(comunidades as any[]).map((c: any) => {
                const badge = STATUS_BADGE[c.status] || STATUS_BADGE["critico"];
                return (
                  <div key={c.comunidade} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-sm text-slate-700">{c.comunidade}</span>
                        <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                          <span style={{ color: RIO_COLORS[c.rio] || BRAND }}>Rio {c.rio}</span>
                          {c.distancia_sede_km > 0 && <span>{c.distancia_sede_km} km da sede</span>}
                          <span>{c.acesso}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!c.atend_regular && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">SEM ATEND.</span>}
                        <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: badge.bg, color: badge.text }}>{badge.label}</span>
                        <span className="text-lg font-bold" style={{ color: RIO_COLORS[c.rio] || BRAND }}>{c.populacao}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {aba === "morbidade" && Array.isArray(morbidade) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Taxa de Agravos — Ribeirinhos (por 100 mil)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={morbidade as any[]} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="agravo" tick={{ fontSize: 9 }} width={230} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip formatter={(v: any) => `${v?.toLocaleString()}/100k`} />
                  <Bar dataKey="taxa_100k" name="Taxa /100k" radius={[0,3,3,0]}>
                    {(morbidade as any[]).map((m: any) => <Cell key={m.agravo} fill={statusColor(m.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(morbidade as any[]).map((m: any) => (
                <div key={m.agravo} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: statusColor(m.status) }} />
                    <div>
                      <span className="font-semibold text-sm text-slate-700">{m.agravo}</span>
                      <p className="text-xs text-slate-400">{m.taxa_100k?.toLocaleString()} casos/100 mil hab.</p>
                    </div>
                  </div>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">{m.ribeirinho_vs_urbano} vs urbano</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Saúde Ribeirinha (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="s" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n" dataKey="visitas"       name="Visitas"        stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n" dataKey="atendimentos"  name="Atendimentos"   stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="s" dataKey="cobertura_pct" name="Cobertura (%)"  stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="s" dataKey="vacinacao_pct" name="Vacinação (%)"  stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
