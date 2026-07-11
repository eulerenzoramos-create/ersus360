import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Sparkles, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

const ProgressBar = ({ value, max, color }: { value: number; max: number; color: string }) => (
  <div className="w-full bg-slate-100 rounded-full h-2.5">
    <div className="h-2.5 rounded-full" style={{ width: `${Math.min(value / max * 100, 100)}%`, background: color }} />
  </div>
);

export default function SaudeMulherApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["mul-dash"],  queryFn: () => apiGet("/api/saude-mulher-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: programas }   = useQuery({ queryKey: ["mul-prog"],  queryFn: () => apiGet("/api/saude-mulher-apui/programas"),  enabled: aba === "programas" });
  const { data: acoes }       = useQuery({ queryKey: ["mul-acao"],  queryFn: () => apiGet("/api/saude-mulher-apui/acoes"),      enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["mul-hist"],  queryFn: () => apiGet("/api/saude-mulher-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["mul-ind"],   queryFn: () => apiGet("/api/saude-mulher-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Sparkles size={15}/> },
    { key: "programas",   label: "Programas",  icon: <Activity size={15}/> },
    { key: "acoes",       label: "Ações",      icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Sparkles size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde da Mulher — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Pré-natal · Câncer Ginecológico · Sífilis Congênita · Planejamento Familiar · Mortalidade Materna · FMS Apuí/AM</p>
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
              <KPI label="Mortalidade materna (meta: ≤ 30/100k NV)" value={`${dashRaw.razao_mortalidade_materna_100k_nv}/100k`} color={CRIT} sub={`${dashRaw.obito_materno_2025} óbitos 2025 — 9,5× a meta OMS`} />
              <KPI label="Pré-natal 1º trimestre (meta: 100%)"       value={`${dashRaw.prenatal_1consulta_1tri_pct}%`}            color={CRIT} sub={`${dashRaw.prenatal_6consultas_pct}% com ≥ 6 consultas — ${dashRaw.consultas_medias_prenatal} consultas/média`} />
              <KPI label="Sífilis congênita 2025"                    value={`${dashRaw.sifilis_congenita_2025} casos`}            color={CRIT} sub={`${dashRaw.sifilis_gestante_2025} sífilis gestacional — 100% evitável`} />
              <KPI label="Citopatológico cobertura (meta: 80%)"      value={`${dashRaw.citopatologico_cobertura_pct}%`}           color={CRIT} sub={`colposcopia: ${dashRaw.colposcopia_apui ? "disponível" : "indisponível"} — fila ${dashRaw.espera_colposcopia_sisreg_dias} dias`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Mamografia cobertura 50-69a (meta: 70%)"   value={`${dashRaw.mammografia_cobertura_pct}%`}              color={CRIT} sub="mamógrafo em Apuí: zero — Humaitá 280km" />
              <KPI label="DIU disponível nas UBSs"                   value={dashRaw.contraceptivo_diu_disponivel ? "Disponível" : "Indisponível"} color={CRIT} sub="MS fornece via RENAME: R$ 0" />
              <KPI label="Gestante adolescente (< 20a)"              value={`${dashRaw.gestante_adolescente_pct}%`}               color={CRIT} sub="maior risco de eclâmpsia e prematuridade" />
              <KPI label="Ginecologista em Apuí"                     value={dashRaw.ginecologista_apui === 0 ? "Nenhum" : dashRaw.ginecologista_apui} color={CRIT} sub="obstetrícia: apenas 1 enfermeira-obstetra" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cobertura dos Programas de Saúde da Mulher — Apuí/AM</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Pré-natal 1º tri: ${dashRaw.prenatal_1consulta_1tri_pct}% (meta 100%)`,  value: dashRaw.prenatal_1consulta_1tri_pct,  max: 100, color: CRIT },
                    { label: `Citopatológico: ${dashRaw.citopatologico_cobertura_pct}% (meta 80%)`,    value: dashRaw.citopatologico_cobertura_pct, max: 80,  color: CRIT },
                    { label: `Mamografia 50-69a: ${dashRaw.mammografia_cobertura_pct}% (meta 70%)`,    value: dashRaw.mammografia_cobertura_pct,    max: 70,  color: CRIT },
                    { label: `Planejamento familiar: ${dashRaw.planejamento_familiar_cobertura_pct}%`, value: dashRaw.planejamento_familiar_cobertura_pct, max: 80, color: CRIT },
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
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>RMM 284/100k NV</b> — 9,5× a meta OMS (30/100k). 3 óbitos maternos 2025. Causa principal: eclâmpsia (magnésio sulfato disponível, mas pré-natal tardio). CMMM: obrigatório por lei — R$ 4.200/ano. AAS 100mg + cálcio 1g/dia em gestantes alto risco: custo R$ 0,84/mês.</p>
                <p><b>28 casos de sífilis congênita</b> (meta OMS &lt; 50/100k NV). 100% evitável com VDRL + penicilina G benzatina R$ 8,40/ampola. Custo de 1 SC não tratado: R$ 284.000 (surdez + retardo + UTI neonatal). Parceiro sexual não tratado: 62% dos casos.</p>
                <p><b>DIU e implante subdérmico: zero disponível</b>. MS fornece via RENAME: R$ 0. Capacitação: 40h EAD (ENAP gratuito). 68,4% das gestações são não planejadas. 4 casos de laqueadura sem consentimento informado adequado registrados no CRAS.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "programas" && Array.isArray(programas) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={programas as any[]} margin={{ top: 5, right: 20, bottom: 60, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="programa" tick={{ fontSize: 7 }} angle={-10} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="cobertura_pct" name="Cobertura atual (%)" radius={[4,4,0,0]}>
                  {(programas as any[]).map((p: any, i: number) => <Cell key={i} fill={statusColor(p.status)} />)}
                </Bar>
                <Bar dataKey="meta_pct" name="Meta (%)" radius={[4,4,0,0]} fill={OK} opacity={0.3} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(programas as any[]).map((p: any) => (
                <div key={p.programa} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(p.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{p.programa}</p>
                    </div>
                    <span className="font-bold text-sm" style={{ color: statusColor(p.status) }}>{p.cobertura_pct}% / meta {p.meta_pct}%</span>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{p.observacao}</p>
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
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Saúde da Mulher — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="prenatal_1tri_pct" name="Pré-natal 1º tri (%)"   stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="citop_pct"         name="Citopatológico (%)"      stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="left"  dataKey="mamografia_pct"    name="Mamografia (%)"          stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
                <Line yAxisId="right" dataKey="sifilis_cong"      name="Sífilis congênita"       stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" dataKey="obito_materno"     name="Óbito materno"           stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="6 2" />
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
