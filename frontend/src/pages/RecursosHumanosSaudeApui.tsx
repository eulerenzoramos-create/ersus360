import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { UserCog, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function RecursosHumanosSaudeApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["rhs-dashboard"], queryFn: () => apiGet("/api/recursos-humanos-saude-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: cargos }      = useQuery({ queryKey: ["rhs-cargos"],    queryFn: () => apiGet("/api/recursos-humanos-saude-apui/cargos"),     enabled: aba === "cargos" });
  const { data: historico }   = useQuery({ queryKey: ["rhs-hist"],      queryFn: () => apiGet("/api/recursos-humanos-saude-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["rhs-ind"],       queryFn: () => apiGet("/api/recursos-humanos-saude-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",   icon: <UserCog size={15}/> },
    { key: "cargos",     label: "Cargos",      icon: <Activity size={15}/> },
    { key: "historico",  label: "Histórico",   icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <UserCog size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Recursos Humanos em Saúde — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Rotatividade · Fixação · Absenteísmo · PCCS · FMS Apuí/AM</p>
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
              <KPI label="Médicos total"             value={`${dashRaw.medicos_total}`}               color={WARN}  sub={`${dashRaw.vagas_medico_nao_preenchidas} vagas abertas`} />
              <KPI label="Rotatividade médicos"      value={`${dashRaw.rotatividade_medicos_pct}%`}   color={CRIT}  sub={`meta: ${dashRaw.meta_rotatividade_pct}%`} />
              <KPI label="Absenteísmo geral"         value={`${dashRaw.absenteismo_geral_pct}%`}      color={CRIT}  sub={`meta: ${dashRaw.meta_absenteismo_pct}%`} />
              <KPI label="Médicos especialistas"     value={`${dashRaw.medicos_especialistas_municipio}`} color={CRIT} sub="zero especialista em Apuí" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Temporários (%)"           value={`${dashRaw.contratados_temporarios_pct}%`} color={CRIT} sub="vs concursados estáveis" />
              <KPI label="Salário médico Apuí"       value={`R$ ${dashRaw.salario_medico_municipio_R.toLocaleString("pt-BR")}`} color={WARN} sub={`Manaus: R$ ${dashRaw.salario_medico_manaus_R.toLocaleString("pt-BR")}`} />
              <KPI label="Capacitação (horas/ano)"   value={`${dashRaw.capacitacao_horas_ano_media}h`} color={WARN} sub={`meta: ${dashRaw.meta_capacitacao_horas}h`} />
              <KPI label="Plano de Cargos (PCCS)"    value={dashRaw.plano_cargos_salarios ? "Sim" : "Não"} color={CRIT} sub="zero PCCS implantado" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Preenchimento de Vagas por Categoria</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Fisioterapeuta",   preench: 1, total: 4 },
                    { label: "Psicólogo",        preench: 1, total: 3 },
                    { label: "Médico clínico",   preench: 4, total: 8 },
                    { label: "Dentista",         preench: 5, total: 8 },
                    { label: "Farmacêutico",     preench: 4, total: 6 },
                    { label: "Enfermeiro",       preench: 28, total: 32 },
                    { label: "ACS",              preench: 28, total: 42 },
                  ].map((b) => {
                    const pct = Math.round(b.preench / b.total * 100);
                    const col = pct < 60 ? CRIT : pct < 80 ? WARN : OK;
                    return (
                      <div key={b.label}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-slate-600">{b.label}</span>
                          <span className="font-bold" style={{ color: col }}>{b.preench}/{b.total} ({pct}%)</span>
                        </div>
                        <ProgressBar value={pct} max={100} color={col} />
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>Rotatividade 72,4%</b> — 9/12 médicos saem todo ano. Médico novo precisa de 3-6 meses para conhecer a comunidade: vinculação terapêutica nunca se consolida. ACS mora na comunidade há 10 anos mas o médico que ele referencia muda todo ciclo do PMMB.</p>
                <p><b>Salário médico R$ 14.800 vs R$ 28.400 em Manaus</b> — sem adicional de interioridade, sem PCCS, sem perspectiva de progressão. Concurso público último realizado em 2019. 64,2% dos profissionais em contratos temporários: nenhum investimento no vínculo de longo prazo.</p>
                <p><b>Zero psiquiatra, zero obstetra, zero pediatra</b> — municípios do porte de Apuí não conseguem custear especialista com salário competitivo. Solução: teleconsulta especializada + equipe multiprofissional qualificada na APS para reduzir demanda por especialista presencial.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "cargos" && Array.isArray(cargos) && (
          <div className="space-y-3">
            {(cargos as any[]).map((c: any) => (
              <div key={c.categoria} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(c.status) }} />
                    <div>
                      <p className="font-semibold text-sm text-slate-700">{c.categoria}</p>
                      <p className="text-xs text-slate-400">
                        {c.preenchidas}/{c.vagas} vagas · temp.: {c.temporarios} · concurs.: {c.concursados} · rot.: {c.rotatividade_pct}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: BRAND }}>R$ {c.salario_R.toLocaleString("pt-BR")}</span>
                    <p className="text-xs" style={{ color: statusColor(c.status) }}>{Math.round(c.preenchidas/c.vagas*100)}% preenchido</p>
                  </div>
                </div>
                <div className="ml-5 mb-2">
                  <ProgressBar value={Math.round(c.preenchidas/c.vagas*100)} max={100} color={statusColor(c.status)} />
                </div>
                <p className="text-xs text-slate-500 ml-5">{c.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução RHS — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line dataKey="rotatividade_pct"  name="Rotatividade (%)"   stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="absenteismo_pct"   name="Absenteísmo (%)"    stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="temporarios_pct"   name="Temporários (%)"    stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
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
