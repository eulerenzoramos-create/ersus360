import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Layers, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function SaudeAmbientalApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["amb-dashboard"], queryFn: () => apiGet("/api/saude-ambiental-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: saneamento }  = useQuery({ queryKey: ["amb-san"],       queryFn: () => apiGet("/api/saude-ambiental-apui/saneamento"), enabled: aba === "saneamento" });
  const { data: riscos }      = useQuery({ queryKey: ["amb-riscos"],    queryFn: () => apiGet("/api/saude-ambiental-apui/riscos"),     enabled: aba === "riscos" });
  const { data: historico }   = useQuery({ queryKey: ["amb-hist"],      queryFn: () => apiGet("/api/saude-ambiental-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["amb-ind"],       queryFn: () => apiGet("/api/saude-ambiental-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",    icon: <Layers size={15}/> },
    { key: "saneamento", label: "Saneamento",   icon: <Activity size={15}/> },
    { key: "riscos",     label: "Riscos",        icon: <AlertTriangle size={15}/> },
    { key: "historico",  label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Layers size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Ambiental — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Saneamento · Mercúrio · Queimadas · Agrotóxicos · FMS Apuí/AM</p>
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
              <KPI label="Água Tratada (urbana)" value={`${dashRaw.agua_tratada_urbana_pct}%`}   color={WARN} sub="área da sede" />
              <KPI label="Água Tratada (rural)"  value={`${dashRaw.agua_tratada_rural_pct}%`}    color={CRIT} sub="28 comunidades sem tratamento" />
              <KPI label="Esgotamento Sanitário" value={`${dashRaw.esgotamento_sanitario_pct}%`} color={CRIT} sub={`meta: ${dashRaw.meta_esgotamento_pct}%`} />
              <KPI label="Coleta Lixo (urbana)"  value={`${dashRaw.residuos_coleta_urbana_pct}%`}color={WARN} sub="lixão ativo — sem aterro" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Sem Água Tratada"      value={dashRaw.populacao_sem_agua_tratada.toLocaleString()} color={CRIT} sub="pessoas afetadas" />
              <KPI label="Diarreias/Ano (água)"  value={dashRaw.diarreias_por_agua_casos_ano.toString()} color={CRIT} sub="atribuíveis à água contaminada" />
              <KPI label="Intox. Agrotóxico/Ano" value={dashRaw.intoxicacoes_agrotoxico_ano.toString()} color={CRIT} sub="subnotificação ~70%" />
              <KPI label="Mercúrio (suspeitos)"  value={dashRaw.mercurio_garimpo_casos_suspeitos_ano.toString()} color={CRIT} sub="zero monitoramento laboratorial" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cobertura de Saneamento Básico</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: "Água tratada (urbana)", value: dashRaw.agua_tratada_urbana_pct, meta: 80, color: WARN },
                    { label: "Água tratada (rural/ribeirinha)", value: dashRaw.agua_tratada_rural_pct, meta: 80, color: CRIT },
                    { label: "Esgotamento sanitário", value: dashRaw.esgotamento_sanitario_pct, meta: 60, color: CRIT },
                    { label: "Coleta de resíduos (urbana)", value: dashRaw.residuos_coleta_urbana_pct, meta: 95, color: WARN },
                    { label: "Poços monitorados (VIGIAGUA)", value: dashRaw.pocos_monitorados_vigilancia_pct, meta: 80, color: CRIT },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-bold" style={{ color: b.color }}>{b.value}% / meta {b.meta}%</span>
                      </div>
                      <ProgressBar value={b.value} max={100} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>100% das comunidades ribeirinhas sem água tratada</b> — 12.800 pessoas consumindo diretamente dos rios. Coliformes fecais + mercúrio + contaminação por garimpo = risco múltiplo simultâneo.</p>
                <p><b>Mercúrio do garimpo ilegal</b> — bacias do Juma e Acará contaminadas. Biomagnificação no peixe (principal proteína ribeirinha). ZERO monitoramento laboratorial. Neurotóxico irreversível em crianças.</p>
                <p><b>Lixão ativo desde os anos 90</b> — Lei 12.305/10 exigiu encerramento em 2014. Não conformidade legal há &gt;10 anos. Chorume contamina lençol freático da sede. Sem solução no PMS vigente.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "saneamento" && Array.isArray(saneamento) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Saneamento por Localidade — Apuí/AM</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={saneamento as any[]} margin={{ left: 10, right: 30 }}>
                  <XAxis dataKey="localidade" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="agua_tratada_pct"   name="Água tratada (%)"     fill={ACCENT}   radius={[4,4,0,0]} />
                  <Bar dataKey="esgoto_pct"          name="Esgotamento (%)"      fill={WARN}     radius={[4,4,0,0]} />
                  <Bar dataKey="coleta_residuos_pct" name="Coleta resíduos (%)"  fill={OK}       radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(saneamento as any[]).map((s: any) => (
                <div key={s.localidade} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-slate-700">{s.localidade}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: statusColor(s.status), color: "white" }}>
                      {s.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { label: "Água", value: s.agua_tratada_pct, color: ACCENT },
                      { label: "Esgoto", value: s.esgoto_pct, color: WARN },
                      { label: "Resíduos", value: s.coleta_residuos_pct, color: OK },
                    ].map((b) => (
                      <div key={b.label}>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-slate-500">{b.label}</span>
                          <span className="font-bold" style={{ color: b.value === 0 ? CRIT : b.color }}>{b.value}%</span>
                        </div>
                        <ProgressBar value={b.value} max={100} color={b.value === 0 ? CRIT : b.color} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "riscos" && Array.isArray(riscos) && (
          <div className="space-y-3">
            {(riscos as any[]).map((r: any) => (
              <div key={r.risco} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(r.status) }} />
                    <span className="font-semibold text-sm text-slate-700">{r.risco}</span>
                  </div>
                  <div className="text-xs text-right ml-4">
                    <div className="font-bold" style={{ color: statusColor(r.status) }}>{r.afetados_estimados.toLocaleString()} expostos</div>
                    {r.casos_suspeitos_ano > 0 && <div className="text-slate-400">{r.casos_suspeitos_ano} casos/ano</div>}
                    <div className="text-slate-400">monitoramento: {r.monitoramento}</div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">{r.descricao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Saúde Ambiental (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" tick={{ fontSize: 11 }} unit="%" />
                <YAxis yAxisId="n" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="pct" dataKey="agua_tratada_urbana_pct" name="Água tratada urb. (%)"  stroke={ACCENT} strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="pct" dataKey="esgoto_pct"               name="Esgotamento (%)"        stroke={BRAND}  strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="n"   dataKey="diarreias"                name="Diarreias (casos)"      stroke={CRIT}   strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
                <Line yAxisId="n"   dataKey="intox_agrotoxico"         name="Intox. agrotóxico"      stroke={WARN}   strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
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
