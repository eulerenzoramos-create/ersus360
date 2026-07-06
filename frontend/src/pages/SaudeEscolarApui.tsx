import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { School, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

const ACAO_COLORS: Record<string, string> = {
  "Avaliação antropométrica":           BRAND,
  "Saúde bucal (avaliação + flúor)":    CRIT,
  "Vacinação na escola":                OK,
  "Triagem visual":                     WARN,
  "Triagem auditiva":                   ACCENT,
  "Saúde mental / prevenção violência": "#7c3aed",
  "Prevenção de IST / DST":             "#e11d48",
  "Saúde ambiental / parasitoses":      "#64748b",
};

export default function SaudeEscolarApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["pse-dashboard"], queryFn: () => apiGet("/api/saude-escolar-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: acoes }       = useQuery({ queryKey: ["pse-acoes"],     queryFn: () => apiGet("/api/saude-escolar-apui/acoes"),       enabled: aba === "acoes" });
  const { data: escolas }     = useQuery({ queryKey: ["pse-escolas"],   queryFn: () => apiGet("/api/saude-escolar-apui/escolas"),     enabled: aba === "escolas" });
  const { data: historico }   = useQuery({ queryKey: ["pse-hist"],      queryFn: () => apiGet("/api/saude-escolar-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["pse-ind"],       queryFn: () => apiGet("/api/saude-escolar-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",   icon: <School size={15}/> },
    { key: "acoes",      label: "Ações PSE",   icon: <Activity size={15}/> },
    { key: "escolas",    label: "Escolas",     icon: <AlertTriangle size={15}/> },
    { key: "historico",  label: "Histórico",   icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <School size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Escolar / PSE — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Programa Saúde na Escola · Triagens · Gravidez Adol. · FMS Apuí/AM</p>
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
              <KPI label="Escolas PSE"           value={`${dashRaw.escolas_pse_parceiras}/${dashRaw.escolas_municipio_total}`} color={WARN} sub={`${dashRaw.cobertura_escolas_pse_pct}% cobertura`} />
              <KPI label="Alunos Cobertos"       value={`${dashRaw.alunos_cobertos_pse.toLocaleString()}/${dashRaw.alunos_total.toLocaleString()}`} color={WARN} sub={`${dashRaw.cobertura_alunos_pct}%`} />
              <KPI label="Gravidez Adolescente"  value={`${dashRaw.maternidade_adolescente_pct}%`} color={CRIT} sub={`meta: ${dashRaw.meta_gravidez_adol_pct}%`} />
              <KPI label="Triagem Visual"        value={`${dashRaw.triagem_visual_pct}%`}           color={CRIT} sub="71,6% sem triagem" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Saúde Bucal Escola"    value={`${dashRaw.saude_bucal_escola_pct}%`}       color={CRIT} sub={`meta: ${dashRaw.meta_saude_bucal_pct}%`} />
              <KPI label="Saúde Mental Adol."    value={`${dashRaw.saude_mental_adolescente_pct}%`} color={CRIT} sub="81,6% sem abordagem" />
              <KPI label="Distorção Idade-Série" value={`${dashRaw.distorcao_idade_serie_pct}%`}    color={CRIT} sub="reflexo de déficits não detectados" />
              <KPI label="Evasão Escolar"        value={`${dashRaw.evasao_escolar_pct}%`}           color={CRIT} sub="correlação com gravidez adol." />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Coberturas das Ações PSE</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Avaliação antropométrica (meta 80%)", value: dashRaw.avaliacao_antropometrica_pct, meta: 80, color: WARN },
                    { label: "Saúde bucal (meta 70%)",              value: dashRaw.saude_bucal_escola_pct,      meta: 70, color: CRIT },
                    { label: "Vacinação (meta 90%)",                value: dashRaw.vacinacao_escola_pct,        meta: 90, color: WARN },
                    { label: "Triagem visual (meta 70%)",           value: dashRaw.triagem_visual_pct,          meta: 70, color: CRIT },
                    { label: "Saúde mental (meta 60%)",             value: dashRaw.saude_mental_adolescente_pct,meta: 60, color: CRIT },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-bold" style={{ color: b.color }}>{b.value}%</span>
                      </div>
                      <ProgressBar value={b.value} max={100} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>10 escolas sem PSE</b> — zonas rural (60%) e ribeirinha (75%) descobertas. Alunos ribeirinhos têm as piores condições nutricionais e menor acesso a serviços de saúde preventivos.</p>
                <p><b>Triagem visual 28,4%</b> — distúrbio visual não corrigido é a principal causa evitável de fracasso escolar e distorção idade-série (38,4%). Sem oftalmologista: encaminhamento para Manaus (784 km).</p>
                <p><b>Gravidez na adolescência 18,2%</b> — estável desde 2022. Educação sexual cobre apenas 22,4% das escolas. Adolescente grávida evade, perpetua pobreza. PSE é a intervenção mais custo-efetiva disponível.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "acoes" && Array.isArray(acoes) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Cobertura por Ação PSE (%)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={acoes as any[]} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
                  <YAxis type="category" dataKey="acao" tick={{ fontSize: 8 }} width={260} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="realizado_pct" name="Realizado (%)" radius={[0,3,3,0]}>
                    {(acoes as any[]).map((a: any) => <Cell key={a.acao} fill={statusColor(a.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(acoes as any[]).map((a: any) => (
                <div key={a.acao} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: statusColor(a.status) }} />
                      <span className="font-semibold text-sm text-slate-700">{a.acao}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: statusColor(a.status) }}>{a.realizado_pct}% / meta {a.meta_pct}% — {a.alunos_beneficiados.toLocaleString()} alunos</span>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "escolas" && Array.isArray(escolas) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Cobertura PSE por Localidade</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={escolas as any[]} margin={{ left: 10, right: 30 }}>
                  <XAxis dataKey="localidade" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip />
                  <Bar dataKey="cobertura_pct" name="Cobertura PSE (%)" radius={[4,4,0,0]}>
                    {(escolas as any[]).map((e: any) => <Cell key={e.localidade} fill={statusColor(e.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(escolas as any[]).map((e: any) => (
                <div key={e.localidade} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: statusColor(e.status) }} />
                    <span className="font-semibold text-sm text-slate-700">{e.localidade}</span>
                  </div>
                  <div className="text-xs text-right space-y-0.5">
                    <div>Escolas PSE: <span className="font-bold">{e.pse_parceiras}/{e.escolas}</span> (<span style={{ color: statusColor(e.status) }}>{e.cobertura_pct}%</span>)</div>
                    <div className="text-slate-400">{e.alunos.toLocaleString()} alunos</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Saúde Escolar / PSE (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(v: any) => `${v}%`} />
                <Legend />
                <Line dataKey="cobertura_escolas_pct" name="Cobertura escolas" stroke={BRAND}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="antrop_pct"            name="Antropometria"    stroke={ACCENT}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="bucal_pct"             name="Saúde bucal"     stroke={CRIT}    strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="vacinacao_pct"         name="Vacinação"       stroke={OK}      strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="gravidez_adol_pct"     name="Grav. adol. (%)" stroke={WARN}    strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
