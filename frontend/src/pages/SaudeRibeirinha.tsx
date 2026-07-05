import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Waves, MapPin, AlertTriangle, Activity } from "lucide-react";

const BRAND  = "#0c4a6e";
const ACCENT = "#0ea5e9";
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

const RIO_COLORS: Record<string, string> = {
  "Rio Madeira":  "#0ea5e9",
  "Rio Aripuanã": "#8b5cf6",
  "Rio Juma":     "#10b981",
  "Rio Acari":    "#f59e0b",
  "Rio Mapari":   "#ef4444",
};

export default function SaudeRibeirinha() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["sr-dashboard"],
    queryFn: () => apiGet("/api/saude-ribeirinha/dashboard"),
    enabled: aba === "dashboard",
  });

  const { data: comunidades } = useQuery({
    queryKey: ["sr-comunidades"],
    queryFn: () => apiGet("/api/saude-ribeirinha/comunidades"),
    enabled: aba === "comunidades",
  });

  const { data: atendimentos } = useQuery({
    queryKey: ["sr-atendimentos"],
    queryFn: () => apiGet("/api/saude-ribeirinha/atendimentos-itinerantes"),
    enabled: aba === "atendimentos",
  });

  const { data: historico } = useQuery({
    queryKey: ["sr-historico"],
    queryFn: () => apiGet("/api/saude-ribeirinha/historico"),
    enabled: aba === "historico",
  });

  const { data: indicadores } = useQuery({
    queryKey: ["sr-indicadores"],
    queryFn: () => apiGet("/api/saude-ribeirinha/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",     icon: <Waves size={15}/> },
    { key: "comunidades",  label: "Comunidades",   icon: <MapPin size={15}/> },
    { key: "atendimentos", label: "Itinerantes",   icon: <Activity size={15}/> },
    { key: "historico",    label: "Histórico",     icon: <Activity size={15}/> },
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
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Ribeirinha</h1>
            <p className="text-sm text-slate-500">Comunidades Ribeirinhas · Atenção Itinerante · FMS Apuí/AM</p>
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
              <KPI label="Comunidades"        value={dashRaw.comunidades_cadastradas.toString()} />
              <KPI label="Pop. Ribeirinha"    value={dashRaw.populacao_ribeirinha_total.toLocaleString()} sub={`${dashRaw.populacao_ribeirinha_pct_municipio}% do município`} color={ACCENT} />
              <KPI label="Atendimentos/Mês"  value={dashRaw.atendimentos_itinerantes_mes.toString()} color={WARN} />
              <KPI label="Encaminh./Sede"    value={dashRaw.encaminhamentos_sede_mes.toString()} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Cobertura Vacinal"   value={`${dashRaw.cobertura_vacinacao_pct}%`}  sub="meta: 95%" color={CRIT} />
              <KPI label="Pré-natal"           value={`${dashRaw.acompanhamento_pre_natal_pct}%`} sub="meta: 85%" color={CRIT} />
              <KPI label="Comunidades OK"      value={dashRaw.comunidades_ok.toString()} color={OK} />
              <KPI label="Críticas"            value={dashRaw.comunidades_criticas.toString()} color={CRIT} />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <b>Alerta:</b> {dashRaw.comunidades_criticas} comunidades com visita há &gt;60 dias. Distância máxima: {dashRaw.distancia_maxima_km} km. Apenas {dashRaw.equipes_com_embarcacao} equipe(s) com embarcação própria.
            </div>
          </div>
        )}

        {aba === "comunidades" && Array.isArray(comunidades) && (
          <div className="grid gap-3">
            {(comunidades as any[]).map((c: any) => (
              <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: statusColor(c.status) }} />
                    <span className="font-semibold text-slate-700 text-sm">{c.nome}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: statusColor(c.status) + "22", color: statusColor(c.status) }}>
                    {c.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-slate-500">
                  <span style={{ color: RIO_COLORS[c.rio] || ACCENT }}>{c.rio}</span>
                  <span>Pop.: <b>{c.populacao}</b></span>
                  <span>Dist.: <b>{c.distancia_sede_km} km</b></span>
                  <span>Acesso: <b>{c.acesso}</b></span>
                  <span>Última visita: <b>{c.ultima_visita}</b></span>
                </div>
                <div className="text-xs text-slate-400 mt-1">ESF: {c.equipe_esf} · UBS Ref.: {c.ubs_referencia}</div>
              </div>
            ))}
          </div>
        )}

        {aba === "atendimentos" && Array.isArray(atendimentos) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Atendimentos por Expedição</h3>
            <div className="grid gap-3">
              {(atendimentos as any[]).map((a: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                  <div className="text-xs font-bold text-slate-400 w-16 flex-shrink-0">{a.mes}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-700">{a.comunidade}</p>
                    <p className="text-xs text-slate-400">{a.profissional}</p>
                  </div>
                  <div className="text-xs text-right">
                    <div>Atend.: <b>{a.atendimentos}</b></div>
                    <div>Proced.: <b>{a.procedimentos}</b></div>
                    <div style={{ color: a.encaminhamentos > 4 ? WARN : "inherit" }}>Encaminh.: <b>{a.encaminhamentos}</b></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal (2026)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" domain={[50, 70]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="atendimentos"          name="Atendimentos"     stroke={ACCENT} strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="n"   dataKey="encaminhamentos"        name="Encaminhamentos"  stroke={WARN}   strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
                <Line yAxisId="pct" dataKey="cobertura_pre_natal_pct" name="Pré-natal (%)"   stroke={CRIT}   strokeWidth={2} dot={{ r: 3 }} />
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
