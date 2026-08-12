import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { AlertTriangle, Users, Activity, Bell } from "lucide-react";

const BRAND  = "#450a0a";
const ACCENT = "#b91c1c";
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

export default function VigilanciaObito() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["vo-dashboard"],
    queryFn: () => apiGet("/api/vigilancia-obito/dashboard"),
    enabled: aba === "dashboard",
  });

  const { data: maternos } = useQuery({
    queryKey: ["vo-maternos"],
    queryFn: () => apiGet("/api/vigilancia-obito/obitos-maternos"),
    enabled: aba === "maternos",
  });

  const { data: infantis } = useQuery({
    queryKey: ["vo-infantis"],
    queryFn: () => apiGet("/api/vigilancia-obito/obitos-infantis"),
    enabled: aba === "infantis",
  });

  const { data: historico } = useQuery({
    queryKey: ["vo-historico"],
    queryFn: () => apiGet("/api/vigilancia-obito/historico"),
    enabled: aba === "historico",
  });

  const { data: indicadores } = useQuery({
    queryKey: ["vo-indicadores"],
    queryFn: () => apiGet("/api/vigilancia-obito/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",        icon: <Bell size={15}/> },
    { key: "maternos",   label: "Óbitos Maternos",  icon: <AlertTriangle size={15}/> },
    { key: "infantis",   label: "Óbitos Infantis",  icon: <Users size={15}/> },
    { key: "historico",  label: "Histórico",        icon: <Activity size={15}/> },
    { key: "indicadores",label: "Indicadores",      icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Bell size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Vigilância do Óbito</h1>
            <p className="text-sm text-slate-500">COMAVE · Materno · Infantil · Fetal · FMS Apuí/AM</p>
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
              <KPI label="Óbitos Maternos/Ano"    value={dashRaw.obitos_maternos_ano.toString()} color={CRIT} />
              <KPI label="RMM"                    value={dashRaw.razao_mortalidade_materna.toString()} sub={`meta OMS: ${dashRaw.meta_rmm_oms}/100mil NV`} color={CRIT} />
              <KPI label="Óbitos Infantis/Ano"    value={dashRaw.obitos_infantis_ano.toString()} color={ACCENT} />
              <KPI label="TMI"                    value={dashRaw.taxa_mortalidade_infantil.toString()} sub={`meta: ${dashRaw.meta_tmi}/mil NV`} color={WARN} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Natimortos/Ano"         value={dashRaw.obitos_fetais_ano.toString()} color={WARN} />
              <KPI label="Investigados"           value={`${dashRaw.obitos_investigados_pct}%`} color={OK} />
              <KPI label="Evitáveis"              value={`${dashRaw.obitos_evitaveis_pct}%`} sub="dos investigados" color={CRIT} />
              <KPI label="Recom. Implementadas"   value={`${dashRaw.pct_recomendacoes_impl}%`} sub={`${dashRaw.recomendacoes_implementadas}/${dashRaw.recomendacoes_emitidas}`} color={WARN} />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <b>Situação crítica:</b> RMM de {dashRaw.razao_mortalidade_materna}/100 mil NV — {Math.round(dashRaw.razao_mortalidade_materna / dashRaw.meta_rmm_oms)}× acima da meta OMS. {dashRaw.obitos_evitaveis_pct}% dos óbitos foram considerados <b>evitáveis</b> pelo COMAVE.
            </div>
          </div>
        )}

        {aba === "maternos" && Array.isArray(maternos) && (
          <div className="grid gap-4">
            {(maternos as any[]).map((o: any) => (
              <div key={o.caso} className="bg-white rounded-xl border border-red-200 p-5 shadow-sm border-l-4" style={{ borderLeftColor: CRIT }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-50 text-red-700">{o.caso}</span>
                    <span className="font-semibold text-slate-700">{o.causa_basica}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-700">{o.tipo}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold" style={{ color: o.evitavel ? CRIT : OK }}>
                      {o.evitavel ? "EVITÁVEL" : "Não evitável"}
                    </span>
                    <span className="text-slate-400">{o.competencia}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs text-slate-500 mb-3">
                  <span>Idade: <b>{o.idade} anos</b></span>
                  <span>IG: <b>{o.semana_gestacional} sem.</b></span>
                  <span>Local: <b>{o.local_obito}</b></span>
                </div>
                <div className="text-xs bg-red-50 rounded-lg p-3 text-red-800">
                  <b>Conclusão COMAVE:</b> {o.conclusao}
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "infantis" && Array.isArray(infantis) && (
          <div className="grid gap-4">
            {(infantis as any[]).map((f: any) => (
              <div key={f.faixa} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-slate-700">{f.faixa}</span>
                  <span className="font-bold text-lg" style={{ color: ACCENT }}>{f.n_2026} óbitos (2026*)</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs text-slate-500 mb-3">
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-slate-600">{f.n_2024}</div>
                    <div>2024</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-slate-600">{f.n_2025}</div>
                    <div>2025</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-red-600">{f.n_2026}</div>
                    <div>2026*</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">Causas principais: </span>
                    {f.causas_principais.map((c: string) => (
                      <span key={c} className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 mr-1">{c}</span>
                    ))}
                  </div>
                  <span className="font-bold ml-3" style={{ color: f.evitaveis_pct >= 70 ? CRIT : WARN }}>
                    {f.evitaveis_pct}% evitáveis
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Séries Históricas (2022–2026*)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="rmm" domain={[0, 300]} tickFormatter={(v) => `${v}`} tick={{ fontSize: 10 }} label={{ value: "RMM", angle: -90, position: "insideLeft", fontSize: 10 }} />
                <YAxis yAxisId="tmi" orientation="right" domain={[0, 25]} tick={{ fontSize: 10 }} label={{ value: "TMI", angle: 90, position: "insideRight", fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="rmm" dataKey="rmm"          name="RMM (/100mil NV)"  stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="tmi" dataKey="tmi"           name="TMI (/mil NV)"     stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="tmi" dataKey="obitos_infantis" name="Óbitos Infantis (n)" stroke={WARN} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
                      {`${ind.valor} ${ind.unidade}`}{ind.meta ? ` / meta: ${ind.meta} ${ind.unidade}` : ""}
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
