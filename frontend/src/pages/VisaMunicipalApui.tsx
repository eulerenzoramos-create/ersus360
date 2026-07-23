import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { ShieldCheck, AlertTriangle, TrendingUp, Activity } from "lucide-react";

const BRAND  = "#1e3a5f";
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

export default function VisaMunicipalApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["visa-dash"],   queryFn: () => apiGet("/api/visa-municipal-apui/dashboard"),        enabled: aba === "dashboard" });
  const { data: estab }       = useQuery({ queryKey: ["visa-estab"],  queryFn: () => apiGet("/api/visa-municipal-apui/estabelecimentos"),  enabled: aba === "estabelecimentos" });
  const { data: inspecoes }   = useQuery({ queryKey: ["visa-insp"],   queryFn: () => apiGet("/api/visa-municipal-apui/inspecoes"),         enabled: aba === "inspecoes" });
  const { data: alertas }     = useQuery({ queryKey: ["visa-alert"],  queryFn: () => apiGet("/api/visa-municipal-apui/alertas-produtos"),  enabled: aba === "alertas" });
  const { data: indicadores } = useQuery({ queryKey: ["visa-ind"],    queryFn: () => apiGet("/api/visa-municipal-apui/indicadores"),       enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",        label: "Dashboard",       icon: <ShieldCheck size={15}/> },
    { key: "estabelecimentos", label: "Estabelecimentos",icon: <Activity size={15}/> },
    { key: "inspecoes",        label: "Inspeções",       icon: <TrendingUp size={15}/> },
    { key: "alertas",          label: "Alertas",         icon: <AlertTriangle size={15}/> },
    { key: "indicadores",      label: "Indicadores",     icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <ShieldCheck size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Vigilância Sanitária Municipal — Apuí/AM</h1>
            <p className="text-sm text-slate-500">VISA · Inspeções Sanitárias · Licença Sanitária · Alimentos · DTAs · ANVISA · LACEN · FMS Apuí/AM</p>
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
              <KPI label="Cobertura de inspeções (meta: 100%)" value={`${dashRaw.cobertura_inspecao_pct}%`}           color={WARN} sub={`${dashRaw.inspecoes_realizadas_ano}/${dashRaw.meta_inspecoes_ano} inspeções · ${dashRaw.autos_infracao_ano} autos/ano`} />
              <KPI label="Estabelecimentos irregulares"         value={`${dashRaw.estabelecimentos_irregulares}`}     color={WARN} sub={`${dashRaw.estabelecimentos_sem_licenca} sem licença · 16,9% do total`} />
              <KPI label="Abatedouros regulares (meta: 100%)"   value="33,3%"                                         color={CRIT} sub="2/6 abatedouros regulares — alto risco de DTA e zoonoses" />
              <KPI label="Amostras com inconformidade"          value={`${dashRaw.amostras_irregulares_pct}%`}        color={WARN} sub={`${dashRaw.amostras_coletadas_ano} amostras coletadas/ano · meta < 5%`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Interdições ano 2025"                 value={`${dashRaw.interdictions_ano}`}               color={WARN} sub="Abatedouros + manipulação alimentos + cosméticos clandestinos" />
              <KPI label="Multas arrecadadas 2025"              value={`R$ ${dashRaw.multas_valor_r.toLocaleString("pt-BR")}`} color={ACCENT} sub={`${dashRaw.autos_infracao_ano} autos de infração lavrados`} />
              <KPI label="Reclamações ouvidoria/ano"            value={`${dashRaw.reclamacoes_ouvidoria_ano}`}       color={WARN} sub="Alimentos, cosméticos, serviços saúde" />
              <KPI label="Tempo médio resolução notificação"    value="28 dias"                                       color={WARN} sub="meta: 15 dias · 2 técnicos VISA para 24.892 habitantes" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Situação da VISA — Apuí/AM 2025</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Cobertura inspeções (meta 100%)",  val: dashRaw.cobertura_inspecao_pct,    meta: 100 },
                    { label: "Estabelecimentos regulares",        val: (dashRaw.estabelecimentos_regulares / dashRaw.estabelecimentos_cadastrados * 100).toFixed(1), meta: 95 },
                    { label: "Abatedouros regulares (meta 100%)", val: 33.3, meta: 100 },
                    { label: "Amostras conformes (meta > 95%)",   val: 100 - dashRaw.amostras_irregulares_pct, meta: 95 },
                    { label: "Meta inspeções atingida",           val: (dashRaw.inspecoes_realizadas_ano / dashRaw.meta_inspecoes_ano * 100).toFixed(1), meta: 100 },
                  ].map((f: any) => (
                    <div key={f.label} className="flex items-center gap-2">
                      <span className="text-slate-600 w-48 text-xs">{f.label}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: `${Math.min(Number(f.val), 100)}%`, background: Number(f.val) >= f.meta * 0.8 ? OK : WARN }} />
                      </div>
                      <span className="font-bold text-xs text-slate-600">{f.val}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex flex-col gap-2 justify-center">
                <p><b>38 estabelecimentos sem Licença Sanitária</b> (13,4%). Licença: R$ 84–840/estabelecimento/ano (arrecadação para VISA). Regularização compulsória: notificação + prazo 30 dias + multa. Campanha "Licença em Dia": FMS + SEMEC + Câmara Municipal. 2 técnicos VISA para 284 estabelecimentos = 1 inspeção/estabelecimento a cada 2,7 meses (meta: bimestral para alto risco).</p>
                <p><b>Abatedouros: 4/6 irregulares</b>. Risco: DTA por Salmonella, E.coli, Listeria. Carne sem inspeção = risco de brucelose, tuberculose bovina, cisticercose. SIF (federal) ou SIM (municipal): obrigatório. SIM municipal: custo R$ 28.000/ano (veterinário 20h/semana). 1 surto DTA hospitalizações 10 pessoas: R$ 84.000. ROI SIM: 3:1.</p>
                <p><b>12,8% das amostras com inconformidade</b>. LACEN-AM: envio gratuito. Açaí: coliformes termotolerantes — risco doença de Chagas (transmissão oral). Peixe: temperatura inadequada + parasitas. Plano de amostragem VISA: prioritizar alto risco (alimentos, cosméticos). Análise fiscal: LACEN cobre custo.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "estabelecimentos" && Array.isArray(estab) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={estab as any[]} margin={{ top: 5, right: 20, bottom: 80, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="tipo" tick={{ fontSize: 8 }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="regulares"    name="Regulares"     radius={[4,4,0,0]} fill={OK}     />
                <Bar dataKey="irregulares"  name="Irregulares"   radius={[4,4,0,0]} fill={WARN}   />
                <Bar dataKey="sem_licenca"  name="Sem licença"   radius={[4,4,0,0]} fill={CRIT}   />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(estab as any[]).map((e: any) => (
                <div key={e.tipo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: statusColor(e.status) }} />
                      <span className="font-semibold text-sm text-slate-700">{e.tipo}</span>
                      <span className="text-xs text-slate-400">risco {e.risco}</span>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold text-slate-700">{e.total} total</span>
                      <p className="text-slate-400">{e.regulares} reg. · {e.irregulares} irreg. · {e.sem_licenca} sem lic.</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "inspecoes" && Array.isArray(inspecoes) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Inspeções Realizadas — Apuí/AM 2025</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={inspecoes} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left"  tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="realizadas"      name="Inspeções realizadas" stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="meta"            name="Meta"                 stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="6 3" />
                <Line yAxisId="left"  dataKey="irregularidades" name="Irregularidades"      stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="right" dataKey="autos"           name="Autos de infração"    stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {aba === "alertas" && Array.isArray(alertas) && (
          <div className="grid gap-3">
            {(alertas as any[]).map((a: any) => (
              <div key={a.produto} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: a.risco === "alto" ? CRIT : WARN }} />
                    <p className="font-semibold text-sm text-slate-700">{a.produto}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${a.status === "resolvido" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {a.status === "resolvido" ? "Resolvido" : "Em apuração"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 ml-5">{a.acao}</p>
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
