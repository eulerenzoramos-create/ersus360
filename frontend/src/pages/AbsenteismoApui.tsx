import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { UserCog, AlertTriangle, TrendingUp, Users } from "lucide-react";

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

const BAR_COLORS = [CRIT, WARN, "#dc2626aa", OK, WARN, OK];

export default function AbsenteismoApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }     = useQuery({ queryKey: ["abs-dash"],   queryFn: () => apiGet("/api/absenteismo-apui/dashboard"),    enabled: aba === "dashboard" });
  const { data: categ }    = useQuery({ queryKey: ["abs-cat"],    queryFn: () => apiGet("/api/absenteismo-apui/categorias"),   enabled: aba === "categorias" });
  const { data: cargos }   = useQuery({ queryKey: ["abs-carg"],   queryFn: () => apiGet("/api/absenteismo-apui/cargos-criticos"), enabled: aba === "cargos" });
  const { data: hist }     = useQuery({ queryKey: ["abs-hist"],   queryFn: () => apiGet("/api/absenteismo-apui/historico"),   enabled: aba === "historico" });
  const { data: ind }      = useQuery({ queryKey: ["abs-ind"],    queryFn: () => apiGet("/api/absenteismo-apui/indicadores"), enabled: aba === "indicadores" });

  const d = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",   icon: <UserCog size={14}/> },
    { key: "categorias",  label: "Categorias",  icon: <AlertTriangle size={14}/> },
    { key: "cargos",      label: "Cargos Críticos", icon: <Users size={14}/> },
    { key: "historico",   label: "Histórico",   icon: <TrendingUp size={14}/> },
    { key: "indicadores", label: "Indicadores", icon: <AlertTriangle size={14}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <UserCog size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Absenteísmo e RHS — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Gestão de Recursos Humanos em Saúde · Rotatividade · Vacâncias · FMS Apuí/AM</p>
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
              <KPI label="Total Servidores Saúde"  value={d.total_servidores_saude.toString()} color={ACCENT} />
              <KPI label="Taxa Absenteísmo"        value={`${d.taxa_absenteismo_pct}%`} color={CRIT} sub={`meta: ${d.meta_absenteismo_pct}%`} />
              <KPI label="Rotatividade Anual"      value={`${d.rotatividade_anual_pct}%`} color={CRIT} sub="meta: 15%" />
              <KPI label="Cargos Vagos"            value={d.cargos_vazios.toString()} color={CRIT} sub="sem cobertura efetiva" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Afastados LTS"           value={d.servidores_afastados_lts.toString()} color={CRIT} />
              <KPI label="Dias Perdidos/Mês"       value={d.dias_perdidos_mes.toString()} color={CRIT} sub="equivale a 22 profissionais" />
              <KPI label="Horas Extras/Mês"        value={d.horas_extras_mes.toLocaleString("pt-BR")} color={WARN} sub="R$ 51 mil/mês" />
              <KPI label="Médicos RPA (não efetivos)" value={`${d.medicos_contratados_rpa}/${d.medicos_efetivos + d.medicos_contratados_rpa}`} color={CRIT} sub="9 de 13 médicos sem vínculo" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Composição da Equipe Médica</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={[
                      { name: `Efetivos (${d.medicos_efetivos})`, value: d.medicos_efetivos },
                      { name: `RPA/Contratados (${d.medicos_contratados_rpa})`, value: d.medicos_contratados_rpa },
                    ]} dataKey="value" cx="50%" cy="50%" outerRadius={70}>
                      <Cell fill={OK} />
                      <Cell fill={CRIT} />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>34,2% de rotatividade anual</b> — 1 em cada 3 profissionais sai por ano. Médicos ficam em média 8 meses antes de ir para Manaus ou cidade maior. Cada saída custa R$ 12–18 mil em processo seletivo, integração e sobrecarga dos que ficam.</p>
                <p><b>11,8% de absenteísmo</b> — 2,4x a meta. Plantonistas de saúde mental e UPA cobrem falta de outros: burnout é a principal causa de LTS (38% dos afastamentos). A distância de Manaus impede acesso rápido a saúde do trabalhador para avaliação e retorno.</p>
                <p><b>Zero fisioterapeutas efetivos</b> — toda reabilitação depende de TFD para Manaus (R$ 480/viagem). 28 cargos vagos em áreas críticas. PSS (Processo Seletivo Simplificado) com dificuldade de candidatos qualificados para região remota.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "categorias" && Array.isArray(categ) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Dias Perdidos por Categoria de Afastamento</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categ as any[]} layout="vertical" margin={{ left: 10, right: 60 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="categoria" tick={{ fontSize: 9 }} width={200} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip />
                  <Bar dataKey="dias_perdidos" name="Dias perdidos" radius={[0,3,3,0]}>
                    {(categ as any[]).map((c: any, i: number) => (
                      <Cell key={c.categoria} fill={statusColor(c.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(categ as any[]).map((c: any) => (
                <div key={c.categoria} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(c.status) }} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-700">{c.categoria}</p>
                    <p className="text-xs text-slate-400">{c.casos_mes} casos no mês</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold" style={{ color: statusColor(c.status) }}>{c.dias_perdidos} dias</p>
                    <p className="text-slate-400">{c.pct_total}% do total</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "cargos" && Array.isArray(cargos) && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Cobertura por Cargo (%)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={cargos as any[]} layout="vertical" margin={{ left: 10, right: 60 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                  <YAxis type="category" dataKey="cargo" tick={{ fontSize: 9 }} width={180} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="cobertura_pct" name="Cobertura %" radius={[0,3,3,0]}>
                    {(cargos as any[]).map((c: any) => (
                      <Cell key={c.cargo} fill={statusColor(c.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {(cargos as any[]).map((c: any) => (
              <div key={c.cargo} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(c.status) }} />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-700">{c.cargo}</p>
                </div>
                <div className="text-right text-xs space-y-0.5">
                  <p><b>{c.efetivos}</b> efetivos / <b>{c.necessarios}</b> necessários</p>
                  <p className="font-bold" style={{ color: statusColor(c.status) }}>{c.cobertura_pct}% coberto · {c.vacantes} vagas</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(hist) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Absenteísmo e Rotatividade (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hist} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct"  tick={{ fontSize: 11 }} unit="%" />
                <YAxis yAxisId="n"    orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="pct" dataKey="absenteismo_pct"   name="Absenteísmo (%)"  stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="rotatividade_pct"  name="Rotatividade (%)" stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="cargos_vazios"     name="Cargos vagos"     stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
