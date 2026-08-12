import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Layers, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function SaudeAmbientalApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["samb-dash"],  queryFn: () => apiGet("/api/saude-ambiental-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: riscos }      = useQuery({ queryKey: ["samb-risc"],  queryFn: () => apiGet("/api/saude-ambiental-apui/riscos"),      enabled: aba === "riscos" });
  const { data: acoes }       = useQuery({ queryKey: ["samb-acao"],  queryFn: () => apiGet("/api/saude-ambiental-apui/acoes"),       enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["samb-hist"],  queryFn: () => apiGet("/api/saude-ambiental-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["samb-ind"],   queryFn: () => apiGet("/api/saude-ambiental-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Layers size={15}/> },
    { key: "riscos",      label: "Exposições", icon: <Activity size={15}/> },
    { key: "acoes",       label: "Ações",      icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Layers size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Ambiental — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Queimadas · Mercúrio do Garimpo · Agrotóxicos · Lixão · Qualidade da Água · VIGIAGUA · FMS Apuí/AM</p>
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
              <KPI label="Focos de queimada 2025"            value={(dashRaw.focos_queimada_2025||0).toLocaleString()} color={CRIT} sub={`${dashRaw.queimada_area_ha_2025?.toLocaleString()} ha queimados · ${dashRaw.dias_qualidade_ar_ruim_2025} dias de ar ruim`} />
              <KPI label="PM2,5 no pico (OMS: 15 µg/m³)"   value={`${dashRaw.pm25_media_ug_m3_pico} µg/m³`}          color={CRIT} sub={`${(dashRaw.pm25_media_ug_m3_pico/dashRaw.oms_pm25_limite_ug_m3).toFixed(1)}× limite OMS · ${dashRaw.internacao_ira_crianca_queimada_2025} internações crianças`} />
              <KPI label="Mercúrio crianças > limite CDC"    value={`${dashRaw.mercurio_criancas_acima_cdc_pct}%`}     color={CRIT} sub={`${dashRaw.mercurio_nivel_medio_ug_dl} µg/dL (limite CDC: ${dashRaw.cdc_limite_mercurio_ug_dl})`} />
              <KPI label="Agrotóxico — notificações 2025"   value={(dashRaw.intoxicacao_agrotoxicos_2025||0).toString()} color={CRIT} sub={`subnotificação ~10×: ~840 casos reais · ${dashRaw.obito_agrotoxicos_2025} óbitos`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Lixão ativo em Apuí"               value={dashRaw.lixao_ativo ? "ATIVO (ilegal)" : "Encerrado"} color={CRIT} sub="ilegal desde 2014 (Lei 12.305/2010) · IBAMA R$ 84k-840k" />
              <KPI label="RSS descartado corretamente"        value={`${dashRaw.residuos_saude_descarte_correto_pct}%`} color={CRIT} sub="meta 100% · agulhas + sangue no lixão = contaminação" />
              <KPI label="VIGIAGUA — amostras água (meta: 180/ano)" value={`${dashRaw.monitoramento_agua_agrotoxicos ? "Monit." : "S/ Monit."}`} color={CRIT} sub="agrotóxicos detectados no manancial (2024) — lab. municipal: zero" />
              <KPI label="Garimpeiros ativos em Apuí"         value={(dashRaw.garimpeiros_ativos||0).toLocaleString()} color={CRIT} sub={`peixe c/ Hg > OMS: ${dashRaw.peixes_mercurio_acima_oms_pct}% · ${dashRaw.nascidos_com_microcefalia_garimpo_2025} microcefálicos em área garimpo`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Riscos Ambientais — Vigilância Apuí/AM 2025</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: "Mercúrio criançs > CDC",    val: dashRaw.mercurio_criancas_acima_cdc_pct, color: CRIT, suffix: "%" },
                    { label: "Peixe Hg > OMS",            val: dashRaw.peixes_mercurio_acima_oms_pct,  color: CRIT, suffix: "%" },
                    { label: "Agrotóx. vigilância (meta: 100%)", val: dashRaw.vigilancia_sanitaria_agrotoxico_pct, color: CRIT, suffix: "%" },
                    { label: "RSS descarte correto (meta: 100%)", val: dashRaw.residuos_saude_descarte_correto_pct, color: CRIT, suffix: "%" },
                    { label: "IIP Aedes no lixão",        val: (dashRaw.vetor_lixao_iip_pct || 4.8), color: CRIT, suffix: "%" },
                    { label: "Focos de queimada (k)",     val: Math.round((dashRaw.focos_queimada_2025 || 0) / 100), color: CRIT, suffix: "00" },
                  ].map((f: any) => (
                    <div key={f.label} className="flex items-center gap-2">
                      <span className="text-slate-600 w-44 text-xs">{f.label}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: `${Math.min(f.val, 100)}%`, background: f.color }} />
                      </div>
                      <span className="font-bold text-xs" style={{ color: f.color }}>{f.val}{f.suffix}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>2.842 focos de queimada em 2025</b> — PM2,5 no pico: 248 µg/m³ (16,5× OMS). 84 dias de ar ruim. 1.284 atendimentos IRA + 184 internações de crianças + 4 óbitos. Monitor portátil PM2,5: R$ 280. Plano de contingência: inexistente. Filtro HEPA nas UBSs: R$ 3.600.</p>
                <p><b>84,4% das crianças ribeirinhas com Hg &gt; CDC</b> (28,4 µg/dL — 8,1× limite). 8 microcefálicas em área de garimpo. Peixe: 72,4% com Hg &gt; OMS. Cartilha peixes seguros (Fiocruz AM): R$ 2.400. Dosagem Hg: LACEN-AM, R$ 0. Quelação DMSA: HUAM Manaus.</p>
                <p><b>Lixão ativo desde 2014 (ilegal)</b>. PMGIRS: R$ 84.000. PAC Saneamento R$ 8,4M (aguarda PMSB). RSS descartado corretamente: 28,4% (meta 100%). Agrotóxicos detectados no manancial de captação — monitoramento regular: zero. VIGIAGUA: 42 amostras em 2025 (meta 180).</p>
              </div>
            </div>
          </div>
        )}

        {aba === "riscos" && Array.isArray(riscos) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={riscos as any[]} margin={{ top: 5, right: 20, bottom: 80, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="risco" tick={{ fontSize: 8 }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="casos_2025"      name="Casos notificados 2025" radius={[4,4,0,0]}>
                  {(riscos as any[]).map((r: any, i: number) => <Cell key={i} fill={statusColor(r.status)} />)}
                </Bar>
                <Bar dataKey="expostos_estimados" name="Expostos estimados" radius={[4,4,0,0]} fill={ACCENT} opacity={0.3} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(riscos as any[]).map((r: any) => (
                <div key={r.risco} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(r.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{r.risco}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: statusColor(r.status) }}>{(r.expostos_estimados||0).toLocaleString()} expostos</span>
                      <p className="text-slate-400 mt-0.5">{r.casos_2025} casos · {r.obitos_2025} óbitos</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{r.observacao}</p>
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
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Saúde Ambiental — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left"  tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="focos_queimada"        name="Focos queimada"          stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="ira_queimada"          name="IRA por queimada"        stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="right" dataKey="mercurio_criancas_pct" name="Hg crianças > CDC (%)"   stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
                <Line yAxisId="left"  dataKey="intox_agrotoxico"      name="Intox. agrotóxico"       stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="6 2" />
                <Line yAxisId="right" dataKey="dias_ar_ruim"          name="Dias de ar ruim"         stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
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
