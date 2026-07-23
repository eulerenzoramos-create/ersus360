import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Waves, AlertTriangle, TrendingUp, Activity } from "lucide-react";

const BRAND  = "#dbeafe";
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

export default function SaudeRibeirinhaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["sr-dash"],  queryFn: () => apiGet("/api/saude-ribeirinha-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: comunidades } = useQuery({ queryKey: ["sr-com"],   queryFn: () => apiGet("/api/saude-ribeirinha-apui/comunidades"),  enabled: aba === "comunidades" });
  const { data: morbidade }   = useQuery({ queryKey: ["sr-morb"],  queryFn: () => apiGet("/api/saude-ribeirinha-apui/morbidade"),   enabled: aba === "morbidade" });
  const { data: historico }   = useQuery({ queryKey: ["sr-hist"],  queryFn: () => apiGet("/api/saude-ribeirinha-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["sr-ind"],   queryFn: () => apiGet("/api/saude-ribeirinha-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",   icon: <Waves size={15}/> },
    { key: "comunidades", label: "Comunidades", icon: <Activity size={15}/> },
    { key: "morbidade",   label: "Morbidade",   icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",   icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Waves size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde das Populações Ribeirinhas — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Rios Juma · Maici · Acará · Marmelos · 28 Comunidades · Equipes Fluviais · DSEI · SESAI · FMS Apuí/AM</p>
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
              <KPI label="Populaçao ribeirinha estimada"       value={`${dashRaw.populacao_ribeirinha_estimada.toLocaleString()}`} color={BRAND} sub={`${dashRaw.pct_populacao_total}% da pop. · ${dashRaw.comunidades_ribeirinhas} comunidades`} />
              <KPI label="Cobertura de atendimento (meta: 90%)" value={`${dashRaw.cobertura_atendimento_pct}%`}                   color={CRIT}  sub={`${dashRaw.comunidades_com_atendimento_regular}/${dashRaw.comunidades_ribeirinhas} comunidades · ${dashRaw.equipes_fluviais_ativas} equipes fluviais`} />
              <KPI label="Água tratada nas comunidades"        value="ZERO"                                                        color={CRIT}  sub="100% usam água do rio sem tratamento — DDA, hepatite A, parasitoses" />
              <KPI label="Mortalidade infantil ribeirinha"     value={`${dashRaw.mortalidade_infantil_ribeirinha}/mil NV`}         color={CRIT}  sub="3,2× a meta nacional (10/mil NV) — partos domiciliares + diarreia" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Lanchas de saúde disponíveis"        value={`${dashRaw.lanchas_saude_disponiveis} lanchas`}             color={WARN}  sub={`${dashRaw.lanchas_em_manutencao} em manutenção · ${dashRaw.visitas_ribeirinhas_mes} visitas/mês`} />
              <KPI label="Tempo médio deslocamento/visita"     value={`${dashRaw.tempo_medio_deslocamento_horas}h`}               color={WARN}  sub={`${dashRaw.atendimentos_por_visita_media} atend./visita · comunidades até 212 km`} />
              <KPI label="Saneamento básico mínimo"            value={`${dashRaw.saneamento_basico_pct}%`}                        color={CRIT}  sub="18,4% com algum saneamento — doenças hídricas 8,4× mais frequentes" />
              <KPI label="Cobertura vacinal ribeirinha"        value={`${dashRaw.cobertura_vacinal_ribeirinha_pct}%`}             color={CRIT}  sub="26,6% sem vacinação completa — cadeia de frio insuficiente nas lanchas" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Indicadores Ribeirinhos — Apuí/AM vs Meta</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Cobertura atend. (meta: 90%)", val: dashRaw.cobertura_atendimento_pct,       meta: 90  },
                    { label: "Água tratada (meta: 100%)",    val: 0,                                        meta: 100 },
                    { label: "Saneamento (meta: 100%)",      val: dashRaw.saneamento_basico_pct,            meta: 100 },
                    { label: "Vacinação (meta: 95%)",        val: dashRaw.cobertura_vacinal_ribeirinha_pct, meta: 95  },
                    { label: "Mortalidade inf. (meta ≤ 10/mil NV)", val: Math.max(0, 100 - dashRaw.mortalidade_infantil_ribeirinha * 3), meta: 97 },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center gap-2">
                      <span className="text-slate-600 w-48 text-xs">{f.label}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: `${Math.min(Math.max(f.val, 0), 100)}%`, background: f.val >= f.meta * 0.8 ? OK : CRIT }} />
                      </div>
                      <span className="font-bold text-xs" style={{ color: f.val >= f.meta * 0.8 ? OK : CRIT }}>{f.val}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>3.840 ribeirinhos em 28 comunidades</b> — 42,9% sem atendimento regular. 2 equipes fluviais ativas, 1 lancha em manutenção permanente. Manutenção preventiva: R$ 28.000/lancha/ano. Custo: inação = agravos não tratados + transferência aérea = R$ 8.400/caso. Terceira lancha: custo R$ 280.000 ou compartilhamento com Novo Aripuanã e Manicoré (consórcio).</p>
                <p><b>ZERO comunidades com água tratada</b>. Toda água consumida vem do rio sem tratamento. Sistema de cloração por gravidade (Sodis): R$ 840/comunidade. Filtro de cerâmica: R$ 280/família. Hipoclorito de sódio 1%: R$ 0,42/litro × 1.000 litros/dia × 28 comunidades = R$ 4.305/mês. Malária ribeirinha: 8,4× mais frequente que na área urbana.</p>
                <p><b>Mortalidade infantil ribeirinha: 32,4/mil NV</b> (meta nacional 10/mil). Causa: diarreia grave + desnutrição + parto domiciliar. Agente comunitário de saúde ribeirinho (ACS-R): R$ 2.824/mês (salário mínimo). 1 ACS-R por 150 famílias = 10 ACS-R para 3.840 ribeirinhos = R$ 282.400/ano. Vacinação em loco: visita + isopor com gelo seco = R$ 280/visita.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "comunidades" && Array.isArray(comunidades) && (
          <div className="grid gap-3">
            {(comunidades as any[]).map((c: any) => (
              <div key={c.comunidade} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(c.status) }} />
                    <div>
                      <p className="font-semibold text-sm text-slate-700">{c.comunidade}</p>
                      <p className="text-xs text-slate-400">Rio {c.rio} · {c.distancia_sede_km > 0 ? `${c.distancia_sede_km} km da sede` : "várias"} · {c.acesso}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-bold text-slate-700">{c.populacao} hab.</span>
                    <p className={`mt-0.5 font-semibold ${c.atend_regular ? "text-green-600" : "text-red-600"}`}>
                      {c.atend_regular ? "Atend. regular" : "Sem atend. regular"}
                    </p>
                    <p className="text-red-500">{c.agua_tratada ? "Água tratada" : "Sem água tratada"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "morbidade" && Array.isArray(morbidade) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={morbidade as any[]} layout="vertical" margin={{ top: 5, right: 100, bottom: 5, left: 220 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="agravo" tick={{ fontSize: 9 }} width={220} />
                <Tooltip />
                <Bar dataKey="taxa_100k" name="Taxa /100k hab." radius={[0,4,4,0]}>
                  {(morbidade as any[]).map((m: any, i: number) => <Cell key={i} fill={statusColor(m.status)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(morbidade as any[]).map((m: any) => (
                <div key={m.agravo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: statusColor(m.status) }} />
                    <span className="text-sm font-semibold text-slate-700">{m.agravo}</span>
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-bold" style={{ color: statusColor(m.status) }}>{m.taxa_100k.toLocaleString()}/100k</span>
                    <p className="text-slate-400">{m.ribeirinho_vs_urbano} mais que área urbana</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Saúde Ribeirinha — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left"  tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="atendimentos"   name="Atendimentos/ano"   stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="visitas"        name="Visitas/ano"         stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
                <Line yAxisId="right" dataKey="cobertura_pct"  name="Cobertura (%)"       stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="right" dataKey="vacinacao_pct"  name="Vacinação (%)"       stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
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
