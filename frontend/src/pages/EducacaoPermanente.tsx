import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { BookOpen, AlertTriangle, Users, TrendingUp } from "lucide-react";

const BRAND  = "#1e3a5f";
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

const MODALIDADE_COLOR: Record<string, string> = {
  "Presencial": BRAND,
  "EAD/UNASUS": ACCENT,
};

const STATUS_CURSO: Record<string, { bg: string; text: string; label: string }> = {
  "concluido":    { bg: "#dcfce7", text: "#166534", label: "Concluído" },
  "em_andamento": { bg: "#fef3c7", text: "#92400e", label: "Em andamento" },
  "planejado":    { bg: "#eff6ff", text: "#1d4ed8", label: "Planejado" },
};

const DEMANDA_COLOR: Record<string, string> = {
  "alta":  CRIT,
  "média": WARN,
  "baixa": OK,
};

export default function EducacaoPermanente() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["ep-dashboard"],   queryFn: () => apiGet("/api/educacao-permanente/dashboard"),    enabled: aba === "dashboard" });
  const { data: cursos }      = useQuery({ queryKey: ["ep-cursos"],      queryFn: () => apiGet("/api/educacao-permanente/cursos"),        enabled: aba === "cursos" });
  const { data: necessidades }= useQuery({ queryKey: ["ep-necessidades"],queryFn: () => apiGet("/api/educacao-permanente/necessidades"),  enabled: aba === "necessidades" });
  const { data: historico }   = useQuery({ queryKey: ["ep-historico"],   queryFn: () => apiGet("/api/educacao-permanente/historico"),     enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["ep-ind"],         queryFn: () => apiGet("/api/educacao-permanente/indicadores"),   enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",         icon: <BookOpen size={15}/> },
    { key: "cursos",       label: "Cursos / Ações",    icon: <BookOpen size={15}/> },
    { key: "necessidades", label: "Necessidades",      icon: <Users size={15}/> },
    { key: "historico",    label: "Histórico",         icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores",       icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <BookOpen size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Educação Permanente em Saúde — Apuí/AM</h1>
            <p className="text-sm text-slate-500">EPS · UNASUS · Cursos Presenciais · Fixação de Profissionais · FMS Apuí/AM</p>
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
              <KPI label="Servidores de Saúde"    value={dashRaw.servidores_saude_total.toString()} color={ACCENT} sub="FMS Apuí/AM" />
              <KPI label="Capacitados/Ano"        value={dashRaw.servidores_capacitados_ano.toString()} color={BRAND} />
              <KPI label="Cobertura Capacitação"  value={`${dashRaw.cobertura_capacitacao_pct}%`} color={WARN} sub={`meta: ${dashRaw.meta_cobertura_pct}%`} />
              <KPI label="Rotatividade/Ano"       value={`${dashRaw.rotatividade_profissional_pct}%`} color={CRIT} sub="meta: 10%" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Cursos Realizados"      value={dashRaw.cursos_realizados_ano.toString()} />
              <KPI label="Cursos EAD/UNASUS"      value={dashRaw.cursos_ead_unasus.toString()} sub="plataforma UNASUS" />
              <KPI label="CH Média Anual"         value={`${dashRaw.carga_horaria_media_anual}h`} />
              <KPI label="Tutores EPS Ativos"     value={`${dashRaw.tutores_ativos}/${dashRaw.tutores_ativos + 4}`} color={WARN} sub="meta: 12 tutores" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cobertura de Capacitação</h3>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Capacitados</span>
                    <span className="font-semibold">{dashRaw.servidores_capacitados_ano} / {dashRaw.servidores_saude_total}</span>
                  </div>
                  <ProgressBar value={dashRaw.servidores_capacitados_ano} max={dashRaw.servidores_saude_total} color={WARN} />
                </div>
                <div className="flex gap-3 mt-2">
                  <div className="flex-1 p-2 rounded-lg bg-slate-50 text-center">
                    <p className="text-xs text-slate-500">Pós-graduação</p>
                    <p className="font-bold" style={{ color: WARN }}>{dashRaw.profissionais_pos_graduacao_pct}%</p>
                  </div>
                  <div className="flex-1 p-2 rounded-lg bg-red-50 text-center">
                    <p className="text-xs text-slate-500">Residência</p>
                    <p className="font-bold text-red-600">{dashRaw.residentes_multiprofissionais} vagas</p>
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
                <p><b>Principal desafio:</b> rotatividade de 28,4%/ano cancela o investimento em capacitação. Profissionais capacitados saem e os novos chegam sem formação.</p>
                <p className="mt-2"><b>EAD como alternativa:</b> internet de qualidade limitada compromete acesso à UNASUS para 38% dos servidores rurais.</p>
                <p className="mt-2"><b>Inexistência de residência multiprofissional:</b> principal indutor de fixação em municípios remotos — Apuí não possui nenhuma vaga.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "cursos" && Array.isArray(cursos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Participantes por Curso</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={(cursos as any[])} layout="vertical" margin={{ left: 10, right: 60 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="curso" tick={{ fontSize: 8 }} width={240} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip />
                  <Bar dataKey="participantes" name="Participantes" radius={[0,3,3,0]}>
                    {(cursos as any[]).map((c: any) => <Cell key={c.curso} fill={MODALIDADE_COLOR[c.modalidade] || ACCENT} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: BRAND }} />Presencial</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: ACCENT }} />EAD/UNASUS</span>
              </div>
            </div>
            <div className="grid gap-2">
              {(cursos as any[]).map((c: any) => {
                const badge = STATUS_CURSO[c.status] || { bg: "#f1f5f9", text: "#475569", label: c.status };
                return (
                  <div key={c.curso} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-semibold text-sm text-slate-700">{c.curso}</span>
                        <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                          <span>{c.modalidade}</span>
                          <span>{c.ch_horas}h</span>
                          <span>{c.area}</span>
                          <span><b>{c.participantes}</b> participantes</span>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded flex-shrink-0" style={{ background: badge.bg, color: badge.text }}>{badge.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {aba === "necessidades" && Array.isArray(necessidades) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Profissionais com Necessidade de Formação por Área</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={(necessidades as any[])} layout="vertical" margin={{ left: 10, right: 60 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="area" tick={{ fontSize: 10 }} width={200} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip />
                  <Bar dataKey="profissionais" name="Profissionais" radius={[0,3,3,0]}>
                    {(necessidades as any[]).map((n: any) => <Cell key={n.area} fill={DEMANDA_COLOR[n.demanda] || WARN} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(necessidades as any[]).map((n: any) => (
                <div key={n.area} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-start gap-3">
                  <div className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: DEMANDA_COLOR[n.demanda] || WARN }} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-slate-700">{n.area}</span>
                      <span className="text-xs font-bold" style={{ color: DEMANDA_COLOR[n.demanda] || WARN }}>Demanda {n.demanda} · {n.profissionais} prof.</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{n.observacao}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução — Educação Permanente (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="capacitados"       name="Capacitados"      stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="cursos"            name="Cursos"           stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="rotatividade_pct"  name="Rotatividade %"  stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
