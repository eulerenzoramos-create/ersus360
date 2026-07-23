import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Waves, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function SaudePcdApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["pcd-dashboard"],    queryFn: () => apiGet("/api/saude-pcd-apui/dashboard"),    enabled: aba === "dashboard" });
  const { data: deficiencias } = useQuery({ queryKey: ["pcd-defic"],       queryFn: () => apiGet("/api/saude-pcd-apui/deficiencias"), enabled: aba === "deficiencias" });
  const { data: beneficios }  = useQuery({ queryKey: ["pcd-benef"],        queryFn: () => apiGet("/api/saude-pcd-apui/beneficios"),   enabled: aba === "beneficios" });
  const { data: historico }   = useQuery({ queryKey: ["pcd-hist"],         queryFn: () => apiGet("/api/saude-pcd-apui/historico"),    enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["pcd-ind"],          queryFn: () => apiGet("/api/saude-pcd-apui/indicadores"),  enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",     icon: <Waves size={15}/> },
    { key: "deficiencias", label: "Deficiências",  icon: <Activity size={15}/> },
    { key: "beneficios",   label: "Benefícios",    icon: <Activity size={15}/> },
    { key: "historico",    label: "Histórico",     icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores",   icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Waves size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde da Pessoa com Deficiência — Apuí/AM</h1>
            <p className="text-sm text-slate-500">BPC · Reabilitação · Acessibilidade · Diagnóstico · FMS Apuí/AM</p>
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
              <KPI label="PcD estimadas (IBGE)"    value={`${dashRaw.pcd_estimada_total.toLocaleString()}`}    color={BRAND} sub={`${dashRaw.pcd_estimada_ibge_pct}% da população`} />
              <KPI label="PcD cadastradas (CADSUS)" value={`${dashRaw.pcd_cadastradas_cadsus}`}               color={CRIT}  sub={`${dashRaw.cobertura_cadastro_pct}% de cobertura`} />
              <KPI label="BPC beneficiários"        value={`${dashRaw.bpc_beneficiarios}`}                    color={WARN}  sub={`${dashRaw.bpc_cobertura_pcd_pct}% das PcD`} />
              <KPI label="Acesso à reabilitação"    value={`${dashRaw.consultas_reabilitacao_mes}/mês`}        color={CRIT}  sub={`meta: ${dashRaw.meta_reabilitacao_mes}/mês`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Fisioterapeuta municipal" value={`${dashRaw.fisioterapeuta_municipio}`}              color={CRIT}  sub="1 para 24.700 hab." />
              <KPI label="Fonoaudiólogo"            value={`${dashRaw.fonoaudiologo_municipio}`}              color={CRIT}  sub="zero no município" />
              <KPI label="Laudo médico PcD"         value={`${dashRaw.laudo_medico_pcd_emissao_dias} dias`}   color={CRIT}  sub={`meta: ${dashRaw.meta_laudo_dias} dias`} />
              <KPI label="Acessibilidade UBS"       value={`${dashRaw.acessibilidade_ubs_adequada_pct}%`}     color={CRIT}  sub="apenas 2/8 UBS acessíveis" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cobertura por Categoria</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Cadastro CADSUS (meta 80%)",           value: dashRaw.cobertura_cadastro_pct,         color: CRIT },
                    { label: "BPC — cobertura elegíveis (meta 90%)", value: dashRaw.bpc_cobertura_pcd_pct,          color: WARN },
                    { label: "Reabilitação (meta 80%)",              value: (dashRaw.consultas_reabilitacao_mes / dashRaw.meta_reabilitacao_mes) * 100, color: CRIT },
                    { label: "Acessibilidade UBS (meta 100%)",       value: dashRaw.acessibilidade_ubs_adequada_pct, color: CRIT },
                  ].map((b: any) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-bold" style={{ color: b.color }}>{b.value.toFixed(1)}%</span>
                      </div>
                      <ProgressBar value={b.value} max={100} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>APAE mais próxima: Humaitá (284 km)</b> — PcD com deficiência intelectual precisa percorrer 568 km ida e volta para 1 atendimento/semana. Inviável para frequência terapêutica mínima. Criança sem estimulação precoce: déficit permanente de desenvolvimento.</p>
                <p><b>Diagnóstico tardio em 64,2%</b> — surdez detectada na escola (7 anos), não no nascimento. Déficit intelectual percebido pelo professor, não pelo médico. Cada ano sem diagnóstico = potencial de desenvolvimento desperdiçado.</p>
                <p><b>6/8 UBS inacessíveis</b> — sem rampa, sem banheiro adaptado. PcD usuária de cadeira de rodas usa emergência hospitalar como único ponto de acesso à APS — custo 8x maior e desvincula do cuidado contínuo.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "deficiencias" && Array.isArray(deficiencias) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-2">
              <h3 className="font-semibold text-slate-700 mb-3">Acesso à Reabilitação por Tipo de Deficiência</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={deficiencias as any[]} layout="vertical" margin={{ left: 120, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10 }} unit="%" domain={[0, 30]} />
                  <YAxis dataKey="tipo" type="category" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="reabilitacao_acesso_pct" name="Acesso reabilitação (%)">
                    {(deficiencias as any[]).map((d: any) => (
                      <Cell key={d.tipo} fill={statusColor(d.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {(deficiencias as any[]).map((d: any) => (
              <div key={d.tipo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(d.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{d.tipo}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: BRAND }}>{d.prevalencia_estimada} estimados</span>
                    <p className="text-xs" style={{ color: CRIT }}>{d.cadastradas} cadastrados · {d.reabilitacao_acesso_pct}% em reabilitação</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{d.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "beneficios" && Array.isArray(beneficios) && (
          <div className="grid gap-3">
            {(beneficios as any[]).map((b: any) => (
              <div key={b.beneficio} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(b.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{b.beneficio}</p>
                  </div>
                  <div className="text-right text-sm">
                    {b.cobertura_pct > 0 ? (
                      <span className="font-bold" style={{ color: statusColor(b.status) }}>{b.cobertura_pct}% cobertura</span>
                    ) : (
                      <span className="font-bold" style={{ color: CRIT }}>Crítico</span>
                    )}
                    {b.beneficiarios > 0 && (
                      <p className="text-xs text-slate-400">{b.beneficiarios} beneficiários / {b.elegibilidade_estimada} elegíveis</p>
                    )}
                  </div>
                </div>
                {b.cobertura_pct > 0 && (
                  <div className="ml-5 mb-2">
                    <ProgressBar value={b.cobertura_pct} max={100} color={statusColor(b.status)} />
                  </div>
                )}
                <p className="text-xs text-slate-500 ml-5">{b.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução — Saúde da PcD (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="pcd_cadastradas"   name="PcD cadastradas"        stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="bpc_beneficiarios" name="BPC beneficiários"       stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="tfd_viagens"        name="TFD PcD (viagens/ano)"  stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
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
