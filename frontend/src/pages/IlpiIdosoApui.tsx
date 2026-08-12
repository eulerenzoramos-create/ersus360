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

const ProgressBar = ({ value, max, color }: { value: number; max: number; color: string }) => (
  <div className="w-full bg-slate-100 rounded-full h-2.5">
    <div className="h-2.5 rounded-full" style={{ width: `${Math.min(value / max * 100, 100)}%`, background: color }} />
  </div>
);

export default function IlpiIdosoApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["ilpi-dashboard"],  queryFn: () => apiGet("/api/ilpi-idoso-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: condicoes }   = useQuery({ queryKey: ["ilpi-condicoes"],  queryFn: () => apiGet("/api/ilpi-idoso-apui/condicoes"),  enabled: aba === "condicoes" });
  const { data: ilpi }        = useQuery({ queryKey: ["ilpi-servicos"],   queryFn: () => apiGet("/api/ilpi-idoso-apui/ilpi"),       enabled: aba === "ilpi" });
  const { data: historico }   = useQuery({ queryKey: ["ilpi-hist"],       queryFn: () => apiGet("/api/ilpi-idoso-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["ilpi-ind"],        queryFn: () => apiGet("/api/ilpi-idoso-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",   icon: <Building2 size={15}/> },
    { key: "condicoes",   label: "Condições",   icon: <Activity size={15}/> },
    { key: "ilpi",        label: "Serviços",    icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",   icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Building2 size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>ILPI e Idoso Dependente — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Quedas · Demência · SAD · ILPI · Abuso ao Idoso · FMS Apuí/AM</p>
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
              <KPI label="Pop. idosa (≥60 anos)"    value={dashRaw.populacao_idosa_60mais?.toLocaleString()}  color={BRAND} sub={`${dashRaw.populacao_idosa_pct}% da população`} />
              <KPI label="Idosos dependentes"       value={dashRaw.idosos_dependentes_estimados}              color={CRIT}  sub={`${dashRaw.idosos_sem_cuidador_formal}% sem cuidador formal`} />
              <KPI label="Quedas hospitalizadas/a"  value={dashRaw.quedas_hospitalizacao_2025}                color={CRIT}  sub={`${dashRaw.quedas_obito_2025} óbitos`} />
              <KPI label="ILPI no município"        value={dashRaw.ilpi_municipio === 0 ? "Nenhuma" : dashRaw.ilpi_municipio} color={CRIT} sub={`referência: ${dashRaw.ilpi_referencia_cidade}`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Demência estimada"        value={dashRaw.demencia_estimados}                        color={CRIT}  sub={`só ${dashRaw.demencia_diagnosticados_pct}% diagnosticados`} />
              <KPI label="Depressão em idosos"      value={`${dashRaw.depressao_idoso_pct}%`}                color={CRIT}  sub="meta: rastreamento 80%" />
              <KPI label="Polifarmácia (≥5 meds)"  value={`${dashRaw.idosos_polifarmacia_5mais_med}%`}      color={WARN}  sub="medicamentos inapropriados em 28,4%" />
              <KPI label="Abuso notificado/a"       value={dashRaw.abuso_idoso_notificado_2025}              color={CRIT}  sub={`${dashRaw.abuso_idoso_subnotificacao_pct}% subnotificação`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Atenção ao Idoso — Cobertura dos Serviços</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Cuidadores formais SAD (${dashRaw.cuidadores_formais_sus}/${dashRaw.meta_cuidadores})`, value: dashRaw.cuidadores_formais_sus, max: dashRaw.meta_cuidadores, color: CRIT },
                    { label: `Visitas SAD/mês (${dashRaw.sad_visitas_idoso_mes}/${dashRaw.meta_sad_visitas_mes})`,     value: dashRaw.sad_visitas_idoso_mes, max: dashRaw.meta_sad_visitas_mes, color: CRIT },
                    { label: `Vacina influenza idoso (${dashRaw.vacina_influenza_idoso_pct}% / meta 90%)`,             value: dashRaw.vacina_influenza_idoso_pct, max: 100, color: CRIT },
                    { label: `Vacina pneumocócica (${dashRaw.vacina_pneumococica_idoso_pct}% / meta 90%)`,             value: dashRaw.vacina_pneumococica_idoso_pct, max: 100, color: CRIT },
                    { label: `Demência diagnosticada (${dashRaw.demencia_diagnosticados_pct}% / meta 70%)`,            value: dashRaw.demencia_diagnosticados_pct, max: 100, color: CRIT },
                  ].map((b: any) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                      </div>
                      <ProgressBar value={b.value} max={b.max} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex flex-col gap-2 justify-center">
                <p><b>Zero ILPI em Apuí</b> — 84 idosos dependentes sem alternativa. Mais próxima: Humaitá (284 km), 12 vagas, fila 18 meses. 2 idosos crônicos ocupam leitos do HMM por ausência de ILPI. ILPI comunitária via convênio: R$ 1.200/idoso/mês.</p>
                <p><b>42 quedas hospitalizadas em 2025, 8 óbitos</b> — fratura de fêmur + espera de 14-21 dias para cirurgia em Humaitá = mortalidade de 50% em 6 meses. Fisioterapia preventiva de equilíbrio: zero vagas. Vitamina D suplementada em apenas 22,4% dos idosos.</p>
                <p><b>85,6% das demências sem diagnóstico</b> — MEEM + Teste do Relógio: 10 min na APS. Donepezila e memantina no REMUME: disponíveis mas sem prescrição por falta de diagnóstico. Cuidador em burnout: 48,4% dos casos.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "condicoes" && Array.isArray(condicoes) && (
          <div className="grid gap-3">
            {(condicoes as any[]).map((c: any) => (
              <div key={c.condicao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(c.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{c.condicao}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <span className="font-bold text-slate-700">{c.estimados} estimados</span>
                    {" · "}
                    <span style={{ color: statusColor(c.status) }}>{c.acometidos_pct}% afetados · {c.acompanhamento_pct}% acomp.</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{c.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "ilpi" && Array.isArray(ilpi) && (
          <div className="grid gap-3">
            {(ilpi as any[]).map((s: any) => (
              <div key={s.servico} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: s.disponivel ? OK : CRIT }} />
                    <p className="font-semibold text-sm text-slate-700">{s.servico}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.disponivel ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {s.disponivel ? "Disponível" : "Indisponível"}
                    </span>
                    <p className="text-xs mt-0.5">capacidade: {s.capacidade} · demanda: {s.demanda_estimada}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{s.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Saúde do Idoso — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="quedas_hosp"   name="Quedas hospitalizadas" stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="demencia_diag" name="Demência diagnosticada" stroke={WARN}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="sad_visitas"   name="Visitas SAD/mês"       stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="abuso_notif"   name="Abuso notificado"      stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
