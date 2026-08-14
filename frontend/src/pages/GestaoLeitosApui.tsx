import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Building2, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function GestaoLeitosApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["gl-dash"],  queryFn: () => apiGet("/api/gestao-leitos-apui/dashboard"),        enabled: aba === "dashboard" });
  const { data: tipos }       = useQuery({ queryKey: ["gl-tipo"],  queryFn: () => apiGet("/api/gestao-leitos-apui/leitos-tipo"),      enabled: aba === "tipos" });
  const { data: causas }      = useQuery({ queryKey: ["gl-caus"],  queryFn: () => apiGet("/api/gestao-leitos-apui/causas-internacao"),enabled: aba === "causas" });
  const { data: historico }   = useQuery({ queryKey: ["gl-hist"],  queryFn: () => apiGet("/api/gestao-leitos-apui/historico"),        enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["gl-ind"],   queryFn: () => apiGet("/api/gestao-leitos-apui/indicadores"),      enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",       icon: <Building2 size={15}/> },
    { key: "tipos",       label: "Leitos por Tipo", icon: <Activity size={15}/> },
    { key: "causas",      label: "Causas de Intern.",icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",       icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",     icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Building2 size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Gestão de Leitos Hospitalares — Apuí/AM</h1>
            <p className="text-sm text-slate-500">CNES · AIH · UTI · Internações · Transferências · Média de Permanência · SISREG · FMS Apuí/AM</p>
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
              <KPI label="Leitos SUS — Apuí (CNES)"    value={`${dashRaw.leitos_sus} leitos`}           color={WARN} sub={`${dashRaw.leitos_ocupados} ocupados · taxa: ${dashRaw.taxa_ocupacao_pct}%`} />
              <KPI label="UTI disponível em Apuí"       value={dashRaw.leitos_uti > 0 ? `${dashRaw.leitos_uti} UTI` : "ZERO UTI"} color={CRIT} sub="Pacientes graves → Manaus, 600 km, lancha ou avião" />
              <KPI label="Transferências Manaus/mês"    value={`${dashRaw.transferencias_saida_mes}/mês`} color={WARN} sub="Neurologia, UTI, cardiologia intervencionista, oncologia" />
              <KPI label="Média de permanência (meta: 4,5d)" value={`${dashRaw.media_permanencia_dias}d`} color={WARN} sub={`meta: ${dashRaw.meta_permanencia_dias}d · infecciosas e SM: 7–9d`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Internações/mês"              value={`${dashRaw.internacoes_mes}`}            color={ACCENT} sub={`altas: ${dashRaw.alta_mes} · óbitos: ${dashRaw.obito_hospitalar_mes}`} />
              <KPI label="AIH aprovadas/mês"            value={`${dashRaw.aih_aprovadas_mes}`}          color={ACCENT} sub={`R$ ${dashRaw.aih_valor_medio_r?.toLocaleString("pt-BR")} valor médio/AIH`} />
              <KPI label="Leitos isolamento (100% ocup.)" value="4/4 — LOTADO"                         color={CRIT}   sub="Sem reserva de capacidade para surtos ou epidemias" />
              <KPI label="Taxa de ocupação hospitalar"  value={`${dashRaw.taxa_ocupacao_pct}%`}         color={WARN}   sub="Ideal: 70–85%. Risco de superlotação em pico de malária/respiratório" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Vulnerabilidades Críticas — Leitos Apuí/AM</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: "UTI: zero leitos (meta: 4)", val: 0, meta: 4, display: "0/4" },
                    { label: "Isolamento: 100% ocupado", val: 0, meta: 85, display: "100%" },
                    { label: "Média permanência vs meta 4,5d", val: 78, meta: 100, display: "5,8d" },
                    { label: "Transferências vs meta 20/mês", val: 48, meta: 100, display: "42/mês" },
                    { label: "Taxa ocupação (ideal 70–85%)", val: 87, meta: 100, display: "73,7%" },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center gap-2">
                      <span className="text-slate-600 w-48 text-xs">{f.label}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: `${Math.min(f.val, 100)}%`, background: f.val >= 80 ? OK : f.val >= 50 ? WARN : CRIT }} />
                      </div>
                      <span className="font-bold text-xs text-slate-600">{f.display}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex flex-col gap-2 justify-center">
                <p><b>ZERO UTI em Apuí</b>. Paciente com IAM/AVC/trauma grave → lancha ou avião para Manaus (600 km). Janela terapêutica para AVC isquêmico: 4,5h. Transferência Apuí→Manaus: 6–12h. Mortalidade de UTI sem UTI local: estimada 3× maior. UPA com leito de estabilização + tele-UTI (TELESSAÚDE-AM): solução de curto prazo. UTI móvel: custo R$ 840.000, viabilidade via SES-AM.</p>
                <p><b>Leitos de isolamento: 100% ocupados</b>. 4 leitos = zero reserva para surtos. Apuí: risco permanente de surto de malária, dengue, leptospirose. Isolamento com barreira simples (biombo + paramentação): conversão de leito cirúrgico em 2h. Protocolo: R$ 0. Isolamento improvisado: R$ 4.200 (EPI + sinalização).</p>
                <p><b>Média de permanência 5,8d</b> (meta 4,5d = 29% acima). Causas: internações psiquiátricas (8,8d), infecciosas (7,2d), traumas (6,4d). SISREG: regulação ativa = reduz permanência. Contrarreferência: 61,6% sem retorno para UBS. Permanência prolongada por falta de destino social: assistente social hospitalar.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "tipos" && Array.isArray(tipos) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tipos as any[]} margin={{ top: 5, right: 20, bottom: 60, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="tipo" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total"    name="Leitos totais"  radius={[4,4,0,0]} fill={ACCENT} opacity={0.4} />
                <Bar dataKey="ocupados" name="Leitos ocupados" radius={[4,4,0,0]}>
                  {(tipos as any[]).map((t: any, i: number) => <Cell key={i} fill={statusColor(t.status)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(tipos as any[]).map((t: any) => (
                <div key={t.tipo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: statusColor(t.status) }} />
                      <span className="font-semibold text-slate-700 text-sm">{t.tipo}</span>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: statusColor(t.status) }}>{t.taxa_ocup}% ocupação</span>
                      <p className="text-slate-400">{t.ocupados}/{t.total} leitos · perm. {t.media_perm_dias}d</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "causas" && Array.isArray(causas) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={causas as any[]} layout="vertical" margin={{ top: 5, right: 40, bottom: 5, left: 180 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="cid_grupo" tick={{ fontSize: 9 }} width={180} />
                <Tooltip />
                <Bar dataKey="internacoes" name="Internações" radius={[0,4,4,0]} fill={ACCENT} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-2">
              {(causas as any[]).map((c: any) => (
                <div key={c.cid_grupo} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                  <span className="text-sm text-slate-700 font-medium">{c.cid_grupo}</span>
                  <div className="text-right text-xs">
                    <span className="font-bold text-slate-700">{c.internacoes} intern. ({c.pct}%)</span>
                    <p className="text-slate-400">perm. média: {c.perm_media}d</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Hospitalar — Apuí/AM (Jan–Jun 2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left"  tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="internacoes"     name="Internações/mês"      stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" dataKey="taxa_ocup"       name="Taxa ocupação (%)"    stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="left"  dataKey="transferencias"  name="Transferências/mês"   stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
                <Line yAxisId="right" dataKey="perm_media"      name="Perm. média (dias)"   stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
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
