import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Baby, AlertTriangle, TrendingUp, MapPin } from "lucide-react";

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

const Bar2 = ({ value, max, color }: { value: number; max: number; color: string }) => (
  <div className="w-full bg-slate-100 rounded-full h-2">
    <div className="h-2 rounded-full" style={{ width: `${Math.min(value / max * 100, 100)}%`, background: color }} />
  </div>
);

export default function TriagemNeonatalApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }    = useQuery({ queryKey: ["tna-dash"],    queryFn: () => apiGet("/api/triagem-neonatal-apui/dashboard"),    enabled: aba === "dashboard" });
  const { data: testes }  = useQuery({ queryKey: ["tna-testes"],  queryFn: () => apiGet("/api/triagem-neonatal-apui/testes"),        enabled: aba === "testes" });
  const { data: zona }    = useQuery({ queryKey: ["tna-zona"],    queryFn: () => apiGet("/api/triagem-neonatal-apui/cobertura-zona"),enabled: aba === "zona" });
  const { data: hist }    = useQuery({ queryKey: ["tna-hist"],    queryFn: () => apiGet("/api/triagem-neonatal-apui/historico"),     enabled: aba === "historico" });
  const { data: ind }     = useQuery({ queryKey: ["tna-ind"],     queryFn: () => apiGet("/api/triagem-neonatal-apui/indicadores"),   enabled: aba === "indicadores" });

  const d = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",   icon: <Baby size={14}/> },
    { key: "testes",      label: "Os 5 Testes", icon: <AlertTriangle size={14}/> },
    { key: "zona",        label: "Por Zona",    icon: <MapPin size={14}/> },
    { key: "historico",   label: "Histórico",   icon: <TrendingUp size={14}/> },
    { key: "indicadores", label: "Indicadores", icon: <AlertTriangle size={14}/> },
  ];

  const radarData = Array.isArray(testes) ? (testes as any[]).map((t: any) => ({
    teste: t.sigla, cobertura: t.cobertura_pct, prazo: t.no_prazo_pct,
  })) : [];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Baby size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Triagem Neonatal — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Pezinho · Orelhinha · Olhinho · Coraçãozinho · Quadrilzinho · FMS Apuí/AM</p>
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

        {aba === "dashboard" && d && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Nascidos Vivos/Ano"    value={d.nascidos_vivos_ano.toString()} />
              <KPI label="Cobertura Média 5 Testes" value={`${d.cobertura_media_pct}%`} color={CRIT} sub="meta: 100%" />
              <KPI label="Partos Domiciliares"   value={`${d.partos_domiciliares_pct}%`} color={CRIT} sub="sem triagem automática" />
              <KPI label="Casos Confirmados"     value={d.casos_confirmados_total.toString()} color={ACCENT} sub={`${d.tratamentos_iniciados} em tratamento`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: "Pezinho",      v: d.cobertura_pezinho_pct,   meta: 100 },
                { label: "Orelhinha",    v: d.cobertura_orelhinha_pct,  meta: 95 },
                { label: "Olhinho",      v: d.cobertura_olhinho_pct,    meta: 100 },
                { label: "Coraçãozinho", v: d.cobertura_coracao_pct,    meta: 100 },
                { label: "Quadrilzinho", v: d.cobertura_quadril_pct,    meta: 95 },
              ].map((t) => (
                <div key={t.label} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm text-center">
                  <p className="text-xs text-slate-500 uppercase">{t.label}</p>
                  <p className="text-xl font-bold mt-1" style={{ color: t.v >= t.meta ? OK : t.v >= 80 ? WARN : CRIT }}>{t.v}%</p>
                  <Bar2 value={t.v} max={100} color={t.v >= t.meta ? OK : t.v >= 80 ? WARN : CRIT} />
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Situação do Pezinho</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Cobertura atual (meta 100%)",        v: d.cobertura_pezinho_pct,        color: WARN, display: `${d.cobertura_pezinho_pct}%` },
                    { label: "No prazo ≤5 dias (meta 90%)",        v: d.cobertura_pezinho_pct * 0.66, color: CRIT, display: "52,0%" },
                    { label: "Kits disponíveis / necessidade",     v: d.kits_teste_disponiveis / (d.kits_meta_mensal * 2) * 100, color: OK, display: `${d.kits_teste_disponiveis}/${d.kits_meta_mensal * 2}` },
                  ].map((b: any) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-bold" style={{ color: b.color }}>{b.display}</span>
                      </div>
                      <Bar2 value={b.v} max={100} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>53,8% dos RN sem Orelhinha</b> — 80 crianças/ano sem triagem auditiva. Perda bilateral não detectada antes dos 6 meses = criança muda funcional. Aparelho OEA existe no HMM mas sem protocolo de alta obrigatório.</p>
                <p><b>18,2% partos domiciliares</b> — 27 RN/ano nascidos em casa (comunidades ribeirinhas e garimpo). Sem registro imediato = triagem adiada 15–30 dias ou nunca realizada. ACS deve captar RN em 72h.</p>
                <p><b>Atraso médio 9,4 dias no Pezinho</b> — o prazo ideal é 3–5 dias. Para RN ribeirinho, coleta é na UBS fluvial mas transporte da amostra para Manaus depende do barco da prefeitura (2x/semana).</p>
              </div>
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
              <div key={t.teste} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-700">{t.teste}</p>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 mr-2">{t.sigla}</span>
                    <span className="text-xs text-slate-400">{t.prazo_ideal}</span>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: statusColor(t.status) }}>{t.cobertura_pct}% cobertura</span>
                    <p className="text-xs text-slate-400">Fila espera: {t.lista_espera ?? "—"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-500 mb-2">
                  <span>Realizados: <b>{t.realizados_ano}/ano</b></span>
                  <span>No prazo: <b style={{ color: t.no_prazo_pct < 70 ? CRIT : WARN }}>{t.no_prazo_pct}%</b></span>
                  <span>Atraso médio: <b>{t.atraso_medio_dias}d</b></span>
                  <span>Alterados: <b style={{ color: t.alterados > 0 ? WARN : OK }}>{t.alterados}</b></span>
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

        {aba === "zona" && Array.isArray(zona) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Cobertura Pezinho e Orelhinha por Zona</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={zona as any[]} margin={{ left: 0, right: 10 }}>
                  <XAxis dataKey="zona" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="pezinho_pct"   name="Pezinho (%)"   fill={ACCENT} radius={[3,3,0,0]} />
                  <Bar dataKey="orelhinha_pct" name="Orelhinha (%)" fill={WARN}   radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(zona as any[]).map((z: any) => (
                <div key={z.zona} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(z.status) }} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-700">{z.zona}</p>
                    <p className="text-xs text-slate-400">{z.nascimentos} nascimentos/ano</p>
                  </div>
                  <div className="text-right text-xs space-y-0.5">
                    <p>Pezinho: <b style={{ color: z.pezinho_pct < 80 ? CRIT : WARN }}>{z.pezinho_pct}%</b></p>
                    <p>Orelhinha: <b style={{ color: z.orelhinha_pct < 50 ? CRIT : WARN }}>{z.orelhinha_pct}%</b></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(hist) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Cobertura dos 5 Testes — 2026</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={hist} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis domain={[30, 105]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="pezinho_pct"   name="Pezinho"      stroke={BRAND}  strokeWidth={2} dot={{ r: 3 }} />
                <Line dataKey="orelhinha_pct" name="Orelhinha"    stroke={CRIT}   strokeWidth={2} dot={{ r: 3 }} />
                <Line dataKey="coracao_pct"   name="Coraçãozinho" stroke={OK}     strokeWidth={2} dot={{ r: 3 }} />
                <Line dataKey="quadril_pct"   name="Quadrilzinho" stroke={WARN}   strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {aba === "indicadores" && Array.isArray(ind) && (
          <div className="grid gap-3">
            {(ind as any[]).map((i: any) => (
              <div key={i.indicador} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-4">
                <div className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(i.status) }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 text-sm">{i.indicador}</span>
                    <span className="font-bold text-sm" style={{ color: statusColor(i.status) }}>
                      {`${i.valor} ${i.unidade}`}{i.meta != null ? ` / meta: ${i.meta}` : ""}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{i.observacao}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
