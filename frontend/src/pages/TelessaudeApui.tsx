import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Monitor, AlertTriangle, Radio, TrendingUp } from "lucide-react";

const BRAND  = "#dbeafe";
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

export default function TelessaudeApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["ts-dashboard"],  queryFn: () => apiGet("/api/telessaude-apui/dashboard"),    enabled: aba === "dashboard" });
  const { data: espec }       = useQuery({ queryKey: ["ts-espec"],      queryFn: () => apiGet("/api/telessaude-apui/especialidades"),enabled: aba === "especialidades" });
  const { data: conect }      = useQuery({ queryKey: ["ts-conect"],     queryFn: () => apiGet("/api/telessaude-apui/conectividade"), enabled: aba === "conectividade" });
  const { data: historico }   = useQuery({ queryKey: ["ts-historico"],  queryFn: () => apiGet("/api/telessaude-apui/historico"),     enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["ts-ind"],        queryFn: () => apiGet("/api/telessaude-apui/indicadores"),   enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",     label: "Dashboard",       icon: <Monitor size={15}/> },
    { key: "especialidades",label: "Especialidades",  icon: <Radio size={15}/> },
    { key: "conectividade", label: "Conectividade",   icon: <Radio size={15}/> },
    { key: "historico",     label: "Histórico",       icon: <TrendingUp size={15}/> },
    { key: "indicadores",   label: "Indicadores",     icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Monitor size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>TeleSaúde — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Teleconsulta · Telediagnóstico · 2ª Opinião · Conectividade UBS · FMS Apuí/AM</p>
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
              <KPI label="Teleconsultas/Ano"       value={dashRaw.teleconsultas_realizadas_ano.toLocaleString()} color={ACCENT} sub={`${dashRaw.teleconsultas_mes_atual}/mês atual`} />
              <KPI label="Telediagnósticos/Ano"    value={dashRaw.telediagnosticos_ano.toString()} color={BRAND} />
              <KPI label="Resolubilidade"          value={`${dashRaw.taxa_resolubilidade_pct}%`} color={WARN} sub="meta: 80%" />
              <KPI label="Referências Evitadas"    value={`${dashRaw.evitou_referencia_manaus_pct}%`} color={OK} sub="evitou viagem a Manaus" />
            </div>
            <div className="grid grid-cols-2 md:grid-calls-4 md:grid-cols-4 gap-4">
              <KPI label="UBS Conectadas"          value={`${dashRaw.ubs_com_conectividade}/${dashRaw.ubs_total}`} color={WARN} sub={`${dashRaw.conectividade_pct}% cobertura`} />
              <KPI label="Velocidade Média"        value={`${dashRaw.velocidade_media_mbps} Mbps`} color={WARN} sub={`meta: ${dashRaw.meta_velocidade_mbps} Mbps`} />
              <KPI label="Especialidades"          value={dashRaw.especialidades_disponiveis.toString()} sub="disponíveis via tela" />
              <KPI label="Tele-ECG/Ano"            value={dashRaw.tele_eletrocardiograma_ano.toString()} color={BRAND} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Conectividade por UBS</h3>
                <div className="space-y-2">
                  {[
                    { label: "Fibra óptica (≥8 Mbps)", count: 1, color: OK },
                    { label: "Rádio 4G (2–5 Mbps)",   count: 4, color: WARN },
                    { label: "Satélite VSAT (<2 Mbps)",count: 2, color: CRIT },
                    { label: "Sem conexão",            count: 2, color: "#6b7280" },
                  ].map((c) => (
                    <div key={c.label} className="flex items-center gap-3">
                      <span className="text-xs w-40 text-slate-600">{c.label}</span>
                      <ProgressBar value={c.count} max={8} color={c.color} />
                      <span className="text-xs font-bold w-4" style={{ color: c.color }}>{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900 flex flex-col gap-2 justify-center">
                <p><b>Impacto econômico:</b> teleconsulta evita viagem a Manaus — estimativa de R$ 180 mil/ano economizados em custeio de transporte e hospedagem.</p>
                <p><b>Aldeia sem conexão:</b> 2 UBS indígenas sem internet — populações mais vulneráveis excluídas do acesso à teleconsulta.</p>
                <p><b>VSAT insuficiente:</b> 0,8 Mbps no Rio Juma não suporta videochamada — teleconsultas são apenas assíncronas (envio de imagens).</p>
              </div>
            </div>
          </div>
        )}

        {aba === "especialidades" && Array.isArray(espec) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Consultas por Especialidade — 2025</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={(espec as any[])} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="especialidade" tick={{ fontSize: 9 }} width={200} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip formatter={(v: any, n: any) => [v, n === "consultas_ano" ? "Consultas" : "Resolubilidade %"]} />
                  <Bar dataKey="consultas_ano" name="Consultas" radius={[0,3,3,0]}>
                    {(espec as any[]).map((e: any) => <Cell key={e.especialidade} fill={statusColor(e.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(espec as any[]).map((e: any) => (
                <div key={e.especialidade} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-semibold text-sm text-slate-700">{e.especialidade}</span>
                      <span className="ml-2 text-xs text-slate-400">{e.disponibilidade}</span>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <span className="text-slate-500">{e.consultas_ano} consultas</span>
                      <span className="font-bold" style={{ color: statusColor(e.status) }}>{e.resolubilidade_pct}% resolutivo</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-24">Resolubilidade:</span>
                    <ProgressBar value={e.resolubilidade_pct} max={100} color={statusColor(e.status)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "conectividade" && Array.isArray(conect) && (
          <div className="grid gap-3">
            {(conect as any[]).map((u: any) => (
              <div key={u.ubs} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: statusColor(u.status) }} />
                    <span className="font-semibold text-slate-700">{u.ubs}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: statusColor(u.status) }}>
                    {u.conectada ? `${u.velocidade_mbps} Mbps` : "Sem conexão"}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-slate-500 mb-2">
                  <span>Tipo: <b>{u.tipo}</b></span>
                  <span className={u.conectada ? "text-green-600" : "text-red-600"}>
                    {u.conectada ? "✓ Conectada" : "✗ Sem internet"}
                  </span>
                </div>
                {u.conectada && (
                  <ProgressBar value={u.velocidade_mbps} max={10} color={statusColor(u.status)} />
                )}
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal — TeleSaúde (Jan–Jun/2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="teleconsultas"  name="Teleconsultas"   stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="telediag"       name="Telediagnósticos"stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="segunda_opiniao"name="2ª Opinião"       stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="resolvidas_pct" name="Resolubilidade %" stroke={OK}    strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
