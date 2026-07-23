import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Pill, AlertTriangle, Users, Activity } from "lucide-react";

const BRAND  = "#166534";
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

export default function AssistFarmaceutica() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["af-dashboard"],
    queryFn: () => apiGet("/api/assist-farmaceutica/dashboard"),
    enabled: aba === "dashboard",
  });
  const { data: basicos } = useQuery({
    queryKey: ["af-basicos"],
    queryFn: () => apiGet("/api/assist-farmaceutica/medicamentos-basicos"),
    enabled: aba === "basicos",
  });
  const { data: especializados } = useQuery({
    queryKey: ["af-especializados"],
    queryFn: () => apiGet("/api/assist-farmaceutica/componente-especializado"),
    enabled: aba === "especializados",
  });
  const { data: historico } = useQuery({
    queryKey: ["af-historico"],
    queryFn: () => apiGet("/api/assist-farmaceutica/historico"),
    enabled: aba === "historico",
  });
  const { data: indicadores } = useQuery({
    queryKey: ["af-indicadores"],
    queryFn: () => apiGet("/api/assist-farmaceutica/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",      label: "Dashboard",          icon: <Pill size={15}/> },
    { key: "basicos",        label: "Med. Básicos",        icon: <Pill size={15}/> },
    { key: "especializados", label: "Comp. Especializado", icon: <Users size={15}/> },
    { key: "historico",      label: "Histórico",           icon: <Activity size={15}/> },
    { key: "indicadores",    label: "Indicadores",         icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Pill size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Assistência Farmacêutica</h1>
            <p className="text-sm text-slate-500">Med. Básicos · Componente Especializado · RENAME · FMS Apuí/AM</p>
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
              <KPI label="Dispensações/Mês"   value={dashRaw.dispensacoes_mes.toLocaleString()} />
              <KPI label="Itens em Falta"     value={dashRaw.itens_em_falta.toString()} color={CRIT} />
              <KPI label="Receitas Atendidas" value={`${dashRaw.receitas_atendidas_pct}%`} color={dashRaw.receitas_atendidas_pct >= 95 ? OK : CRIT} />
              <KPI label="Custo Básico/Mês"   value={`R$ ${dashRaw.custo_basico_mes_r.toLocaleString()}`} color={ACCENT} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Medicamentos Básicos" value={dashRaw.medicamentos_basicos_monitorados.toString()} />
              <KPI label="Pac. Comp. Especial."  value={dashRaw.componente_especializado_pacientes.toString()} color={ACCENT} />
              <KPI label="Custo CE/Mês"          value={`R$ ${dashRaw.componente_especializado_custo_r.toLocaleString()}`} color={WARN} />
              <KPI label="Venc. ≤30 dias"        value={dashRaw.vencimento_proximo_30d.toString()} sub="lotes para vencer" color={WARN} />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <b>{dashRaw.itens_em_falta} medicamentos em ruptura</b> — Amoxicilina (18d), Salbutamol (8d CRITICO), Sulfato Ferroso (14d), Azitromicina (12d). {(100 - dashRaw.receitas_atendidas_pct).toFixed(1)}% das receitas com item em falta.
            </div>
          </div>
        )}

        {aba === "basicos" && Array.isArray(basicos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Estoque em Dias — Medicamentos Básicos</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={basicos} layout="vertical" margin={{ left: 10, right: 40 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="medicamento" tick={{ fontSize: 8 }} width={220} />
                  <Tooltip />
                  <Bar dataKey="estoque_dias" name="Estoque (dias)" fill={ACCENT} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(basicos as any[]).map((m: any) => (
                <div key={m.medicamento} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-700 text-sm">{m.medicamento}</span>
                    <span className="font-bold text-sm px-2 py-0.5 rounded" style={{ background: statusColor(m.status) + "20", color: statusColor(m.status) }}>
                      {m.estoque_dias}d estoque
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                    <div className="h-2 rounded-full" style={{ width: `${Math.min(m.estoque_dias / 90 * 100, 100)}%`, background: statusColor(m.status) }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                    <span>Demanda/mês: <b>{m.demanda_mensal.toLocaleString()}</b></span>
                    <span>Dispensado: <b>{m.dispensado_mes.toLocaleString()}</b></span>
                    <span style={{ color: m.ruptura_historica ? CRIT : OK }}>
                      {m.ruptura_historica ? "Ruptura histórica" : "Sem ruptura anterior"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "especializados" && Array.isArray(especializados) && (
          <div className="grid gap-3">
            {(especializados as any[]).map((med: any) => (
              <div key={med.medicamento} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-700 text-sm">{med.medicamento}</span>
                  <span className="font-bold text-sm" style={{ color: statusColor(med.status) }}>
                    {med.ruptura_mes} rupt./semestre
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs text-slate-500">
                  <span>Pacientes: <b>{med.pacientes}</b></span>
                  <span>Custo/mês: <b>R$ {med.custo_mensal_r.toLocaleString()}</b></span>
                  <span style={{ color: med.fornecimento_estadual ? OK : CRIT }}>
                    {med.fornecimento_estadual ? "Fornec. estadual" : "SEM fornec. estadual"}
                  </span>
                  <span style={{ color: statusColor(med.status) }}>
                    {med.status === "ok" ? "Estável" : med.status === "atencao" ? "Atenção" : "CRÍTICO"}
                  </span>
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
                <YAxis yAxisId="pct" orientation="right" domain={[84, 95]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="dispensacoes"          name="Dispensações"        stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="itens_em_falta"        name="Itens em Falta"      stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="receitas_atendidas_pct" name="Receitas Atend. %"  stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
