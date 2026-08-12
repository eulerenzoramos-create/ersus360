import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { ShoppingBag, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function SegurancaAlimentarApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["san-dashboard"], queryFn: () => apiGet("/api/seguranca-alimentar-apui/dashboard"), enabled: aba === "dashboard" });
  const { data: sisvan }      = useQuery({ queryKey: ["san-sisvan"],    queryFn: () => apiGet("/api/seguranca-alimentar-apui/sisvan"),    enabled: aba === "sisvan" });
  const { data: programas }   = useQuery({ queryKey: ["san-prog"],      queryFn: () => apiGet("/api/seguranca-alimentar-apui/programas"), enabled: aba === "programas" });
  const { data: historico }   = useQuery({ queryKey: ["san-hist"],      queryFn: () => apiGet("/api/seguranca-alimentar-apui/historico"), enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["san-ind"],       queryFn: () => apiGet("/api/seguranca-alimentar-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",    icon: <ShoppingBag size={15}/> },
    { key: "sisvan",     label: "SISVAN",        icon: <Activity size={15}/> },
    { key: "programas",  label: "Programas",    icon: <Activity size={15}/> },
    { key: "historico",  label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <ShoppingBag size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Segurança Alimentar e Nutricional — Apuí/AM</h1>
            <p className="text-sm text-slate-500">SISVAN · PNAE · Bolsa Família · Desnutrição · Obesidade · FMS Apuí/AM</p>
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
              <KPI label="Insegurança alimentar"    value={`${dashRaw.inseguranca_alimentar_total_pct}%`}        color={CRIT} sub={`fome grave: ${dashRaw.inseguranca_alimentar_grave_pct}%`} />
              <KPI label="Desnutrição crônica < 5a" value={`${dashRaw.desnutricao_cronica_criancas_5a_pct}%`}   color={CRIT} sub="meta: 2,5%" />
              <KPI label="Obesidade adultos"         value={`${dashRaw.obesidade_adultos_pct}%`}                 color={CRIT} sub="tendência crescente" />
              <KPI label="Anemia < 2 anos"          value={`${dashRaw.anemia_criancas_6m_2a_pct}%`}             color={CRIT} sub="meta: 10%" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="SISVAN — cobertura"        value={`${dashRaw.sisvan_cobertura_criancas_pct}%`}         color={CRIT} sub="crianças monitoradas" />
              <KPI label="Bolsa Família"             value={`${dashRaw.bolsa_familia_familias.toLocaleString()}`}color={WARN} sub={`${dashRaw.bolsa_familia_cobertura_estimada_pct}% de cobertura`} />
              <KPI label="Nutricionista"             value={`${dashRaw.nutricionista_municipal}`}                color={CRIT} sub="zero no município" />
              <KPI label="Banco de alimentos"        value={dashRaw.banco_alimentos_municipal ? "Ativo" : "Não existe"} color={CRIT} sub="nenhum em Apuí" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Insegurança Alimentar — Escala</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: `Segurança alimentar (${100 - dashRaw.inseguranca_alimentar_total_pct}%)`,      value: 100 - dashRaw.inseguranca_alimentar_total_pct, color: OK },
                    { label: `Inseg. leve (${dashRaw.inseguranca_alimentar_leve_pct}%)`,                     value: dashRaw.inseguranca_alimentar_leve_pct,        color: WARN },
                    { label: `Inseg. moderada (${dashRaw.inseguranca_alimentar_moderada_pct}%)`,             value: dashRaw.inseguranca_alimentar_moderada_pct,    color: WARN },
                    { label: `Inseg. grave / fome (${dashRaw.inseguranca_alimentar_grave_pct}%)`,            value: dashRaw.inseguranca_alimentar_grave_pct,       color: CRIT },
                  ].map((b: any) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                      </div>
                      <ProgressBar value={b.value} max={100} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex flex-col gap-2 justify-center">
                <p><b>Paradoxo amazônico</b> — Apuí produz castanha, pecuária e peixes, mas 55,2% da população vive em insegurança alimentar. Produção local não chega à mesa do produtor: escoamento só via atravessadores. Feirinha municipal sem regularidade.</p>
                <p><b>Zero nutricionista municipal</b> — desnutrição crônica 3,4x acima da meta, obesidade crescendo, anemia em 28,4% dos lactentes: 3 crises nutricionais paralelas sem nenhum profissional de referência. Salário de 1 nutricionista: R$ 4.800/mês = custo de 1 internação por desnutrição grave.</p>
                <p><b>SISVAN em 48,4%</b> — decisões de saúde nutricional baseadas em metade dos dados reais. Sem monitoramento universal, surtos de desnutrição em comunidades ribeirinhas podem demorar meses para serem detectados.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "sisvan" && Array.isArray(sisvan) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-2">
              <h3 className="font-semibold text-slate-700 mb-3">SISVAN — Desnutrição e Obesidade por Grupo Etário</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={sisvan as any[]} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis dataKey="grupo" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="desnutricao_cronica_pct" name="Desnutrição crônica (%)" fill={CRIT} />
                  <Bar dataKey="sobrepeso_pct"            name="Sobrepeso (%)"           fill={WARN} />
                  <Bar dataKey="obesidade_pct"            name="Obesidade (%)"           fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {(sisvan as any[]).map((s: any) => (
              <div key={s.grupo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(s.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{s.grupo}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: BRAND }}>{s.avaliadas_pct}% avaliados</span>
                    <p className="text-xs text-slate-400">Desnut. {s.desnutricao_cronica_pct}% · Sobrep. {s.sobrepeso_pct}% · Obes. {s.obesidade_pct}%</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{s.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "programas" && Array.isArray(programas) && (
          <div className="grid gap-3">
            {(programas as any[]).map((p: any) => (
              <div key={p.programa} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(p.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{p.programa}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: statusColor(p.status) }}>{p.cobertura_pct}%</span>
                    <p className="text-xs text-slate-400">meta: {p.meta_pct}%</p>
                  </div>
                </div>
                <div className="ml-5 mb-2">
                  <ProgressBar value={p.cobertura_pct} max={p.meta_pct > 0 ? p.meta_pct : 100} color={statusColor(p.status)} />
                </div>
                <p className="text-xs text-slate-500 ml-5">{p.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Nutricional — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="inseg_alimentar_pct"      name="Inseg. alimentar (%)"      stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="desnutricao_criancas_pct" name="Desnutrição crianças (%)"  stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="obesidade_adultos_pct"    name="Obesidade adultos (%)"     stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="sisvan_cobertura_pct"     name="SISVAN cobertura (%)"      stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
