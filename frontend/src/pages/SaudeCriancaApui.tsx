import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Smile, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function SaudeCriancaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["cri-dashboard"], queryFn: () => apiGet("/api/saude-crianca-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: triagens }    = useQuery({ queryKey: ["cri-triagens"],  queryFn: () => apiGet("/api/saude-crianca-apui/triagens"),    enabled: aba === "triagens" });
  const { data: nutricao }    = useQuery({ queryKey: ["cri-nutricao"],  queryFn: () => apiGet("/api/saude-crianca-apui/nutricao"),    enabled: aba === "nutricao" });
  const { data: historico }   = useQuery({ queryKey: ["cri-hist"],      queryFn: () => apiGet("/api/saude-crianca-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["cri-ind"],       queryFn: () => apiGet("/api/saude-crianca-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",    icon: <Smile size={15}/> },
    { key: "triagens",   label: "Triagens RN",  icon: <Activity size={15}/> },
    { key: "nutricao",   label: "Nutrição",     icon: <AlertTriangle size={15}/> },
    { key: "historico",  label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Smile size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde da Criança — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Puericultura · Triagens · Nutrição · Desenvolvimento · FMS Apuí/AM</p>
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
              <KPI label="Acomp. < 2 anos"          value={`${dashRaw.acompanhamento_siab_menor_2_pct}%`} color={CRIT} sub={`meta: ${dashRaw.meta_acompanhamento_pct}%`} />
              <KPI label="Desnutrição Crônica < 5a"  value={`${dashRaw.desnutricao_cronica_dea_pct}%`}    color={CRIT} sub={`meta: ${dashRaw.meta_desnutricao_pct}%`} />
              <KPI label="Anemia < 2 anos"           value={`${dashRaw.anemia_ferropriva_menor_2_pct}%`}  color={CRIT} sub={`meta: ${dashRaw.meta_anemia_pct}%`} />
              <KPI label="Parasitoses < 5a"          value={`${dashRaw.parasitoses_intestinais_pct}%`}    color={CRIT} sub="intestinais" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Teste do Pezinho"          value={`${dashRaw.teste_pezinho_pct}%`}              color={WARN} sub={`meta: ${dashRaw.meta_teste_pezinho_pct}%`} />
              <KPI label="Teste da Orelhinha"        value={`${dashRaw.teste_orelhinha_pct}%`}            color={CRIT} sub={`meta: ${dashRaw.meta_teste_orelhinha_pct}%`} />
              <KPI label="Trabalho Infantil (est.)"  value={`${dashRaw.trabalho_infantil_estimado}`}      color={CRIT} sub="crianças" />
              <KPI label="Pediatra no Município"     value={`${dashRaw.pediatra_municipio}`}              color={CRIT} sub="zero especialista" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Triagens Neonatais e APS</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Puericultura ≥6 cons./ano",      value: (dashRaw.puericultura_consultas_ano_crianca / dashRaw.meta_puericultura_consultas * 100), color: CRIT, display: `${dashRaw.puericultura_consultas_ano_crianca}/${dashRaw.meta_puericultura_consultas}` },
                    { label: "Teste do pezinho (meta 100%)",   value: dashRaw.teste_pezinho_pct,  color: WARN, display: `${dashRaw.teste_pezinho_pct}%` },
                    { label: "Teste da orelhinha (meta 100%)", value: dashRaw.teste_orelhinha_pct, color: CRIT, display: `${dashRaw.teste_orelhinha_pct}%` },
                    { label: "Teste do olhinho (meta 100%)",   value: dashRaw.teste_olhinho_pct,  color: CRIT, display: `${dashRaw.teste_olhinho_pct}%` },
                    { label: "Vitamina A supl. (meta 80%)",    value: dashRaw.suplementacao_vit_a_pct, color: WARN, display: `${dashRaw.suplementacao_vit_a_pct}%` },
                    { label: "Sulfato ferroso (meta 80%)",     value: dashRaw.sulfato_ferroso_pct, color: CRIT, display: `${dashRaw.sulfato_ferroso_pct}%` },
                  ].map((b: any) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-bold" style={{ color: b.color }}>{b.display}</span>
                      </div>
                      <ProgressBar value={b.value} max={100} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>Puericultura 2,4 consultas/ano vs 6 preconizadas</b> — criança ribeirinha vai ao posto quando está doente, não para prevenção. Desnutrição, anemia e atraso de desenvolvimento passam despercebidos até estarem avançados.</p>
                <p><b>Teste da orelhinha 48,4%</b> — perda auditiva congênita bilateral não diagnosticada até 6 meses = criança muda funcional. 51,6% sem triagem é inaceitável: aparelho OEA existe no HMM mas sem protocolo de aplicação universal.</p>
                <p><b>84 crianças em trabalho infantil estimado</b> — garimpo ilegal e agricultura familiar. Exposição a mercúrio no garimpo desde criança = dano neurológico. CREAS sem capacidade de fiscalização. Trabalho infantil é o maior preditor de evasão escolar.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "triagens" && Array.isArray(triagens) && (
          <div className="space-y-3">
            {(triagens as any[]).map((t: any) => (
              <div key={t.triagem} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(t.status) }} />
                    <div>
                      <p className="font-semibold text-sm text-slate-700">{t.triagem}</p>
                      <p className="text-xs text-slate-400">Prazo ideal: {t.prazo_ideal_dias}</p>
                    </div>
                  </div>
                  <span className="font-bold text-sm ml-4 text-right" style={{ color: statusColor(t.status) }}>{t.cobertura_pct}% / meta {t.meta_pct}%</span>
                </div>
                <p className="text-xs text-slate-500 ml-5">{t.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "nutricao" && Array.isArray(nutricao) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Estado Nutricional por Faixa Etária (%)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={nutricao as any[]} margin={{ left: 0, right: 10 }}>
                  <XAxis dataKey="faixa" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="desnutricao_cr_pct"  name="Desnutrição crônica" fill={CRIT}   radius={[3,3,0,0]} />
                  <Bar dataKey="desnutricao_ag_pct"  name="Desnutrição aguda"   fill={WARN}   radius={[3,3,0,0]} />
                  <Bar dataKey="sobrepeso_pct"       name="Sobrepeso/obesidade" fill={ACCENT} radius={[3,3,0,0]} />
                  <Bar dataKey="anemia_pct"          name="Anemia"              fill="#64748b" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
              <b>Dupla carga nutricional</b> — desnutrição crônica e sobrepeso coexistindo nas mesmas comunidades. Zona ribeirinha com desnutrição crônica > 20% em < 5 anos. Sede urbana com obesidade crescente. SISVAN com cobertura 58,4% em < 5 anos: dados subestimam realidade.
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Saúde da Criança (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(v: any) => `${v}%`} />
                <Legend />
                <Line dataKey="acomp_siab_pct"     name="Acomp. SISAB < 2a (%)" stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="desnutricao_cr_pct"  name="Desnutrição cr. (%)"   stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="anemia_pct"          name="Anemia < 2a (%)"       stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="teste_pezinho_pct"   name="Teste do pezinho (%)"  stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="vit_a_pct"           name="Vit. A supl. (%)"      stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
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
