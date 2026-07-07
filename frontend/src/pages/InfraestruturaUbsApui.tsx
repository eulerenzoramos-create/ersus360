import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Wrench, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function InfraestruturaUbsApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["ubs-dash"],  queryFn: () => apiGet("/api/infraestrutura-ubs-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: unidades }    = useQuery({ queryKey: ["ubs-unid"],  queryFn: () => apiGet("/api/infraestrutura-ubs-apui/unidades"),   enabled: aba === "unidades" });
  const { data: acoes }       = useQuery({ queryKey: ["ubs-acao"],  queryFn: () => apiGet("/api/infraestrutura-ubs-apui/acoes"),      enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["ubs-hist"],  queryFn: () => apiGet("/api/infraestrutura-ubs-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["ubs-ind"],   queryFn: () => apiGet("/api/infraestrutura-ubs-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard", icon: <Wrench size={15}/> },
    { key: "unidades",    label: "Unidades",  icon: <Activity size={15}/> },
    { key: "acoes",       label: "Ações",     icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico", icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Wrench size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Infraestrutura das UBSs — Apuí/AM</h1>
            <p className="text-sm text-slate-500">UBSs · HMM · Equipamentos · Internet · e-SUS PEC · Cadeia de Frio · FMS Apuí/AM</p>
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
              <KPI label="UBSs em boas condições" value={`${dashRaw.ubs_em_boas_condicoes}/${dashRaw.ubs_total}`} color={CRIT} sub={`${dashRaw.ubs_reforma_necessaria} precisam de reforma`} />
              <KPI label="HMM — leitos UTI"       value={dashRaw.hmm_leitos_uti}                                  color={CRIT} sub={`${dashRaw.hmm_leitos_total} leitos totais`} />
              <KPI label="Internet nas UBSs"      value={`${dashRaw.internet_ubs_pct}%`}                          color={CRIT} sub="meta: 100%" />
              <KPI label="Equipamentos calibrados" value={`${dashRaw.equipamento_eletromedico_calibrado_pct}%`}   color={CRIT} sub="meta: 100%" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Acessibilidade PcD"      value={`${dashRaw.acessibilidade_pcd_pct}%`}         color={CRIT} sub="meta: 100%" />
              <KPI label="Prontuário eletrônico"   value={`${dashRaw.prontuario_eletronico_ubs_pct}%`}  color={CRIT} sub="e-SUS PEC" />
              <KPI label="Sala vacinas adequada"   value={`${dashRaw.sala_vacinas_refrigerador_adequado_pct}%`} color={WARN} sub="cadeia de frio" />
              <KPI label="Custo obras necessárias" value={`R$ ${(dashRaw.custo_obras_necessarias_estimado/1000000).toFixed(1)}M`} color={CRIT} sub="estimado 2025" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Infraestrutura HMM — Disponibilidade de Recursos</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Internet UBSs: ${dashRaw.internet_ubs_pct}%`,               value: dashRaw.internet_ubs_pct,                       max: 100, color: CRIT },
                    { label: `Prontuário eletrônico: ${dashRaw.prontuario_eletronico_ubs_pct}%`, value: dashRaw.prontuario_eletronico_ubs_pct,    max: 100, color: CRIT },
                    { label: `Acessibilidade PcD: ${dashRaw.acessibilidade_pcd_pct}%`,    value: dashRaw.acessibilidade_pcd_pct,                  max: 100, color: CRIT },
                    { label: `Equipamentos calibrados: ${dashRaw.equipamento_eletromedico_calibrado_pct}%`, value: dashRaw.equipamento_eletromedico_calibrado_pct, max: 100, color: CRIT },
                    { label: `Sala de vacinas adequada: ${dashRaw.sala_vacinas_refrigerador_adequado_pct}%`, value: dashRaw.sala_vacinas_refrigerador_adequado_pct, max: 100, color: WARN },
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
                <p><b>1 de 6 UBSs em boas condições</b> — UBS Ribeirinha: sem energia elétrica há 8 meses (inversor solar defeituoso, R$ 4.800 resolve). 1.240 ribeirinhos sem cadeia de frio para vacinas.</p>
                <p><b>HMM: zero UTI, zero ventilador mecânico, zero banco de sangue</b> — sala cirúrgica sem ar condicionado adequado. IRAS: 8,4% (meta < 2%). R$ 42.000 em climatização = payback em 1 ano.</p>
                <p><b>Starlink para todas as UBSs: R$ 36k/ano</b> — 28,4% com internet, 42,4% com prontuário eletrônico. Sem internet: zero Telessaúde, dados invisíveis ao MS (RNDS), prontuário em papel.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "unidades" && Array.isArray(unidades) && (
          <div className="grid gap-3">
            {(unidades as any[]).map((u: any) => (
              <div key={u.unidade} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(u.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{u.unidade}</p>
                  </div>
                  <div className="text-right text-xs">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${u.status === "critico" ? "bg-red-100 text-red-700" : u.status === "atencao" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                      {u.tipo.toUpperCase()} · {u.status}
                    </span>
                    {u.leitos > 0 && <p className="text-xs text-slate-400 mt-0.5">{u.leitos} leitos</p>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{u.observacao}</p>
              </div>
            ))}
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
                  <div className="text-right text-xs text-slate-500">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${a.implementada ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {a.implementada ? "Implementada" : "Não implementada"}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">R$ {a.custo.toLocaleString()} · {a.prazo_meses}m</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Infraestrutura das UBSs — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="ubs_boas_condicoes"        name="UBSs boas condições"   stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="internet_pct"              name="Internet (%)"           stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="prontuario_eletronico_pct" name="Prontuário eletr. (%)" stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
