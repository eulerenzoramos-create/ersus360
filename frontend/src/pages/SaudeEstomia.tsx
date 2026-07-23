import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";
import { UserCheck, AlertTriangle, Clipboard, Activity } from "lucide-react";

const BRAND  = "#14532d";
const ACCENT = "#16a34a";
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

const T_COLORS = ["#16a34a","#0891b2","#8b5cf6","#f59e0b","#ef4444"];

export default function SaudeEstomia() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["se-dashboard"],
    queryFn: () => apiGet("/api/saude-estomia/dashboard"),
    enabled: aba === "dashboard",
  });

  const { data: pacientes } = useQuery({
    queryKey: ["se-pacientes"],
    queryFn: () => apiGet("/api/saude-estomia/pacientes"),
    enabled: aba === "pacientes",
  });

  const { data: insumos } = useQuery({
    queryKey: ["se-insumos"],
    queryFn: () => apiGet("/api/saude-estomia/insumos"),
    enabled: aba === "insumos",
  });

  const { data: historico } = useQuery({
    queryKey: ["se-historico"],
    queryFn: () => apiGet("/api/saude-estomia/historico"),
    enabled: aba === "historico",
  });

  const { data: indicadores } = useQuery({
    queryKey: ["se-indicadores"],
    queryFn: () => apiGet("/api/saude-estomia/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <UserCheck size={15}/> },
    { key: "pacientes",   label: "Pacientes",  icon: <Clipboard size={15}/> },
    { key: "insumos",     label: "Insumos",    icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <UserCheck size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde da Pessoa com Ostomia</h1>
            <p className="text-sm text-slate-500">Ostomia · Cateterismo · Traqueostomia · Insumos · FMS Apuí/AM</p>
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
              <KPI label="Pacientes Cadastrados" value={dashRaw.pacientes_cadastrados.toString()} />
              <KPI label="Colostomias"           value={dashRaw.colostomias.toString()} color={ACCENT} />
              <KPI label="Cateterismo Vesical"   value={dashRaw.cateterismo_vesical.toString()} color="#0891b2" />
              <KPI label="Traqueostomias"        value={dashRaw.traqueostomias.toString()} color={WARN} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Consultas Estomaterap./Mês" value={dashRaw.consultas_estomaterapia_mes.toString()} />
              <KPI label="Fornecimento Insumos"       value={`${dashRaw.fornecimento_insumos_pct}%`} sub="meta: 100%" color={WARN} />
              <KPI label="Complicações/Mês"           value={dashRaw.complicacoes_periostomia_mes.toString()} color={WARN} />
              <KPI label="Internações/Mês"            value={dashRaw.internacoes_por_complicacao_mes.toString()} color={dashRaw.internacoes_por_complicacao_mes > 0 ? CRIT : OK} />
            </div>
          </div>
        )}

        {aba === "pacientes" && Array.isArray(pacientes) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-3">Distribuição por Tipo</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pacientes} dataKey="n" nameKey="tipo" cx="50%" cy="50%" outerRadius={80} label={({ tipo, pct }: any) => `${tipo}: ${pct}%`} labelLine>
                    {(pacientes as any[]).map((_: any, i: number) => (
                      <Cell key={i} fill={T_COLORS[i % T_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(pacientes as any[]).map((p: any, i: number) => (
                <div key={p.tipo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: T_COLORS[i % T_COLORS.length] }} />
                      <span className="font-semibold text-slate-700">{p.tipo}</span>
                    </div>
                    <span className="font-bold text-lg" style={{ color: T_COLORS[i % T_COLORS.length] }}>{p.n}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                    <span>Provisória: <b>{p.provisoria}</b></span>
                    <span>Definitiva: <b>{p.definitiva}</b></span>
                    <span>Causa: <b>{p.motivo_principal}</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "insumos" && Array.isArray(insumos) && (
          <div className="grid gap-3">
            {(insumos as any[]).map((ins: any) => (
              <div key={ins.insumo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-700 text-sm">{ins.insumo}</span>
                  <span className="font-bold text-sm px-2 py-0.5 rounded-full" style={{ background: statusColor(ins.status) + "22", color: statusColor(ins.status) }}>
                    {ins.meses_estoque} meses
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{
                      width: `${Math.min(ins.meses_estoque / 6 * 100, 100)}%`,
                      background: statusColor(ins.status),
                    }} />
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  Consumo: {ins.consumo_mes}/mês · Estoque: {ins.estoque_atual} unid.
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
                <YAxis yAxisId="pct" orientation="right" domain={[90, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="pacientes"        name="Pacientes"          stroke={ACCENT}  strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="n"   dataKey="consultas"        name="Consultas"          stroke="#0891b2" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="n"   dataKey="complicacoes"     name="Complicações"       stroke={WARN}    strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
                <Line yAxisId="pct" dataKey="fornecimento_pct" name="Fornecimento (%)"   stroke={OK}      strokeWidth={2} dot={{ r: 3 }} />
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
