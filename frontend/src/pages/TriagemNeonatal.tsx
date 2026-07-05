import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import { Star, AlertTriangle, Baby, Activity } from "lucide-react";

const BRAND  = "#1e3a5f";
const ACCENT = "#2563eb";
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

export default function TriagemNeonatal() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["tn-dashboard"],
    queryFn: () => apiGet("/api/triagem-neonatal/dashboard"),
    enabled: aba === "dashboard",
  });

  const { data: testes } = useQuery({
    queryKey: ["tn-testes"],
    queryFn: () => apiGet("/api/triagem-neonatal/testes"),
    enabled: aba === "testes",
  });

  const { data: historico } = useQuery({
    queryKey: ["tn-historico"],
    queryFn: () => apiGet("/api/triagem-neonatal/historico"),
    enabled: aba === "historico",
  });

  const { data: indicadores } = useQuery({
    queryKey: ["tn-indicadores"],
    queryFn: () => apiGet("/api/triagem-neonatal/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Star size={15}/> },
    { key: "testes",      label: "Os 5 Testes", icon: <Baby size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  const radarData = testes ? (testes as any[]).map((t: any) => ({
    teste: t.sigla,
    cobertura: t.cobertura_pct,
    prazo: t.no_prazo_pct,
  })) : [];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Star size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Triagem Neonatal</html>
            <p className="text-sm text-slate-500">Pezinho · Olhinho · Orelhinha · Coraçãozinho · Quadrilzinho · FMS Apuí/AM</p>
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
              <KPI label="Nascidos Vivos/Ano"      value={dashRaw.nascidos_vivos_ano.toString()} />
              <KPI label="Cobertura Média"         value={`${dashRaw.cobertura_media_pct}%`} sub="5 testes" color={WARN} />
              <KPI label="Casos Confirmados"       value={dashRaw.confirmados_total.toString()} color={ACCENT} />
              <KPI label="Em Tratamento"           value={dashRaw.tratamentos_iniciados.toString()} color={OK} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Pezinho",      value: dashRaw.teste_pezinho_cobertura,   meta: 100 },
                { label: "Orelhinha",    value: dashRaw.teste_orelhinha_cobertura, meta: 95 },
                { label: "Quadrilzinho", value: dashRaw.teste_quadril_cobertura,   meta: 95 },
                { label: "Olhinho",      value: dashRaw.teste_olhinho_cobertura,   meta: 100 },
                { label: "Coraçãozinho", value: dashRaw.teste_coracao_cobertura,   meta: 100 },
              ].map((t) => (
                <div key={t.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <p className="text-xs text-slate-500 font-medium uppercase">{t.label}</p>
                  <p className="text-xl font-bold mt-1" style={{ color: t.value >= t.meta ? OK : t.value >= 85 ? WARN : CRIT }}>{t.value}%</p>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                    <div className="h-1.5 rounded-full" style={{ width: `${t.value}%`, background: t.value >= t.meta ? OK : t.value >= 85 ? WARN : CRIT }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "testes" && Array.isArray(testes) && (
          <div className="space-y-4">
            {radarData.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cobertura × No Prazo — Radar</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={90}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="teste" tick={{ fontSize: 11 }} />
                    <Radar name="Cobertura (%)" dataKey="cobertura" stroke={ACCENT} fill={ACCENT} fillOpacity={0.25} />
                    <Radar name="No prazo (%)"  dataKey="prazo"     stroke={WARN}   fill={WARN}   fillOpacity={0.15} />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
            {(testes as any[]).map((t: any) => (
              <div key={t.teste} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-semibold text-slate-700">{t.teste}</span>
                    <span className="text-xs ml-2 px-2 py-0.5 rounded bg-blue-50 text-blue-700">{t.sigla}</span>
                    <span className="text-xs ml-1 text-slate-400">{t.prazo_ideal}</span>
                  </div>
                  <span className="font-bold text-sm" style={{ color: statusColor(t.status) }}>{t.cobertura_pct}% cobertura</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-500 mb-3">
                  <span>Realizados: <b>{t.realizados_ano}</b></span>
                  <span>No prazo: <b style={{ color: t.no_prazo_pct < 75 ? CRIT : WARN }}>{t.no_prazo_pct}%</b></span>
                  <span>Alterados: <b style={{ color: t.alterados > 0 ? WARN : OK }}>{t.alterados}</b></span>
                  <span>Em acompanham.: <b>{t.em_acompanhamento}</b></span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {t.doencas_rastreadas.map((d: string) => (
                    <span key={d} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{d}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Cobertura dos Testes por Mês (2026)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis domain={[50, 105]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="pezinho_pct"   name="Pezinho"      stroke={ACCENT}  strokeWidth={2} dot={{ r: 3 }} />
                <Line dataKey="orelhinha_pct" name="Orelhinha"    stroke={WARN}    strokeWidth={2} dot={{ r: 3 }} />
                <Line dataKey="coracao_pct"   name="Coraçãozinho" stroke={OK}      strokeWidth={2} dot={{ r: 3 }} />
                <Line dataKey="quadril_pct"   name="Quadrilzinho" stroke={CRIT}    strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
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
