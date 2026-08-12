import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Syringe, AlertTriangle, Thermometer, Activity } from "lucide-react";

const BRAND  = "#dbeafe";
const ACCENT = "#2563eb";
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

export default function Imunizacao() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["imu-dashboard"],
    queryFn: () => apiGet("/api/imunizacao/dashboard"),
    enabled: aba === "dashboard",
  });
  const { data: vacinas } = useQuery({
    queryKey: ["imu-vacinas"],
    queryFn: () => apiGet("/api/imunizacao/vacinas"),
    enabled: aba === "vacinas",
  });
  const { data: redeFrio } = useQuery({
    queryKey: ["imu-redefrio"],
    queryFn: () => apiGet("/api/imunizacao/rede-frio"),
    enabled: aba === "redefrio",
  });
  const { data: historico } = useQuery({
    queryKey: ["imu-historico"],
    queryFn: () => apiGet("/api/imunizacao/historico"),
    enabled: aba === "historico",
  });
  const { data: indicadores } = useQuery({
    queryKey: ["imu-indicadores"],
    queryFn: () => apiGet("/api/imunizacao/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Syringe size={15}/> },
    { key: "vacinas",     label: "Coberturas",  icon: <AlertTriangle size={15}/> },
    { key: "redefrio",    label: "Rede de Frio",icon: <Thermometer size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Syringe size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Imunização / PNI</h1>
            <p className="text-sm text-slate-500">Coberturas Vacinais · Rede de Frio · SI-PNI · FMS Apuí/AM</p>
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
              <KPI label="Doses Aplicadas/Mês"  value={dashRaw.doses_aplicadas_mes.toLocaleString()} color={ACCENT} />
              <KPI label="Vacinas Monitoradas"  value={dashRaw.vacinas_monitoradas.toString()} />
              <KPI label="Metas Atingidas"      value={`${dashRaw.vacinas_meta_atingida}/${dashRaw.vacinas_monitoradas}`} sub="vacinas acima da meta" color={WARN} />
              <KPI label="Cobertura Média"      value={`${dashRaw.cobertura_media_pct}%`} sub="meta: 95%" color={CRIT} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Menor Cobertura"      value={dashRaw.vacina_menor_cobertura.split("(")[0].trim()} sub={dashRaw.vacina_menor_cobertura.match(/\(([^)]+)\)/)?.[1] || ""} color={CRIT} />
              <KPI label="Equipamentos RF"      value={dashRaw.equipamentos_rede_frio.toString()} />
              <KPI label="RF Críticos"          value={dashRaw.equipamentos_criticos.toString()} sub="temperatura fora do padrão" color={CRIT} />
              <KPI label="Perdas de Doses"      value={`${dashRaw.perdas_doses_pct}%`} sub="índice de perdas" color={WARN} />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <b>Alerta cobertura:</b> Apenas {dashRaw.vacinas_meta_atingida} de {dashRaw.vacinas_monitoradas} vacinas atingem a meta. Penta e Pólio com cobertura &lt;83% — risco de surtos. {dashRaw.equipamentos_criticos} equipamento(s) de rede frio com temperatura inadequada.
            </div>
          </div>
        )}

        {aba === "vacinas" && Array.isArray(vacinas) && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Cobertura por Vacina vs Meta (%)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={vacinas} layout="vertical" margin={{ left: 10, right: 50 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} unit="%" />
                  <YAxis type="category" dataKey="vacina" tick={{ fontSize: 8 }} width={195} />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="cobertura_pct" name="Cobertura" radius={[0,3,3,0]}>
                    {(vacinas as any[]).map((v: any, i: number) => (
                      <Cell key={i} fill={statusColor(v.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(vacinas as any[]).map((v: any) => (
                <div key={v.vacina} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: statusColor(v.status) }} />
                      <span className="font-medium text-slate-700 text-sm">{v.vacina}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Doses: <b>{v.doses_aplicadas.toLocaleString()}</b></span>
                      <span style={{ color: statusColor(v.status) }}>Cob.: <b>{v.cobertura_pct}%</b></span>
                      <span>Meta: <b>{v.meta_pct}%</b></span>
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${Math.min(v.cobertura_pct, 100)}%`, background: statusColor(v.status) }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "redefrio" && Array.isArray(redeFrio) && (
          <div className="space-y-3">
            {(redeFrio as any[]).map((eq: any) => (
              <div key={eq.equipamento} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(eq.status_equipamento) }} />
                    <span className="font-semibold text-slate-700">{eq.equipamento}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {eq.alarme_ativo && (
                      <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: CRIT + "22", color: CRIT }}>ALARME ATIVO</span>
                    )}
                    <span className="font-bold text-lg" style={{ color: statusColor(eq.status_equipamento) }}>
                      {eq.temperatura_atual}°C
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                  <span>Faixa ideal: <b>{eq.faixa_ideal}</b></span>
                  <span>Última verif.: <b>{eq.ultima_verificacao_horas}h atrás</b></span>
                  <span>Status: <b style={{ color: statusColor(eq.status_equipamento) }}>{eq.status_equipamento.toUpperCase()}</b></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal (2026)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" domain={[75, 90]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="doses_total"      name="Doses Aplicadas"   stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="cobertura_media"  name="Cob. Média (%)"    stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="pct" dataKey="perdas_pct"       name="Perdas (%)"        stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
                      {`${ind.valor} ${ind.unidade}`}{ind.meta != null ? ` / meta: ${ind.meta} ${ind.unidade}` : ""}
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
