import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Wrench, AlertTriangle, ClipboardList, Activity } from "lucide-react";

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const BRLK = (v: number) => {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}K`;
  return BRL(v);
};

const BRAND = "#92400e";
const ACCENT = "#d97706";
const OK = "#16a34a";
const WARN = "#d97706";
const CRIT = "#dc2626";

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

const URGENCIA_COLOR: Record<string, string> = { alta: CRIT, media: WARN, baixa: OK };
const ESTADO_BADGE: Record<string, { label: string; color: string }> = {
  inoperante:  { label: "Inoperante",  color: CRIT },
  manutencao:  { label: "Em Manutenção", color: WARN },
  funcionando: { label: "Funcionando", color: OK },
  obsoleto:    { label: "Obsoleto",    color: "#6b21a8" },
};

export default function PatSaude() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["pat-saude-dashboard"],
    queryFn: () => apiGet("/api/pat-saude/dashboard"),
    enabled: aba === "dashboard",
  });

  const { data: categorias } = useQuery({
    queryKey: ["pat-saude-categorias"],
    queryFn: () => apiGet("/api/pat-saude/categorias"),
    enabled: aba === "categorias",
  });

  const { data: criticos } = useQuery({
    queryKey: ["pat-saude-criticos"],
    queryFn: () => apiGet("/api/pat-saude/criticos"),
    enabled: aba === "criticos",
  });

  const { data: historico } = useQuery({
    queryKey: ["pat-saude-historico"],
    queryFn: () => apiGet("/api/pat-saude/historico"),
    enabled: aba === "historico",
  });

  const { data: indicadores } = useQuery({
    queryKey: ["pat-saude-indicadores"],
    queryFn: () => apiGet("/api/pat-saude/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Wrench size={15}/> },
    { key: "categorias",  label: "Categorias", icon: <ClipboardList size={15}/> },
    { key: "criticos",    label: "Críticos",   icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <Activity size={15}/> },
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
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Patrimônio de Saúde</h1>
            <p className="text-sm text-slate-500">Inventário · Depreciação · Equipamentos · FMS Apuí/AM</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {ABAS.map((a) => (
            <button
              key={a.key}
              onClick={() => setAba(a.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={
                aba === a.key
                  ? { background: BRAND, color: "white" }
                  : { background: "white", color: "#475569", border: "1px solid #e2e8f0" }
              }
            >
              {a.icon} {a.label}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {aba === "dashboard" && dashRaw && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Bens Tombados" value={dashRaw.bens_tombados.toLocaleString()} />
              <KPI label="Valor Patrimonial" value={BRLK(dashRaw.valor_patrimonial_total)} />
              <KPI label="Valor Líquido" value={BRLK(dashRaw.valor_liquido_total)} sub="Após depreciação" />
              <KPI label="Investimento 2026" value={BRLK(dashRaw.investimento_equipamentos_ano)} color={OK} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Equip. Médicos" value={dashRaw.equipamentos_medicos.toString()} />
              <KPI label="Inoperantes" value={`${dashRaw.equipamentos_inoperantes} (${dashRaw.equipamentos_inoperantes_pct}%)`} color={CRIT} />
              <KPI label="Para Descarte" value={dashRaw.bens_para_descarte.toString()} color={WARN} />
              <KPI label="Inventário Atual." value={`${dashRaw.inventario_atualizado_pct}%`} sub={`Sem plaqueta: ${dashRaw.bens_sem_plaqueta}`} color={WARN} />
            </div>
          </div>
        )}

        {/* Categorias */}
        {aba === "categorias" && Array.isArray(categorias) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Valor Patrimonial por Categoria</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categorias} layout="vertical" margin={{ top: 5, right: 30, left: 160, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tickFormatter={(v) => BRLK(v)} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="categoria" tick={{ fontSize: 10 }} width={155} />
                  <Tooltip formatter={(v: number) => BRL(v)} />
                  <Legend />
                  <Bar dataKey="valor_total"  name="Valor Total"  fill={ACCENT} radius={[0,3,3,0]}>
                    {(categorias as any[]).map((_: any, i: number) => (
                      <Cell key={i} fill={i % 2 === 0 ? ACCENT : "#fbbf24"} />
                    ))}
                  </Bar>
                  <Bar dataKey="valor_liquido" name="Valor Líquido" fill={OK} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(categorias as any[]).map((c: any) => (
                <div key={c.categoria} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-700 text-sm">{c.categoria}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: statusColor(c.status) + "22", color: statusColor(c.status) }}>
                      {c.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2 text-xs text-slate-500 mt-2">
                    <span>Qtd: <b>{c.quantidade}</b></span>
                    <span>Total: <b>{BRLK(c.valor_total)}</b></span>
                    <span>Líquido: <b>{BRLK(c.valor_liquido)}</b></span>
                    <span>Deprec.: <b>{c.depreciacao_media_pct}%</b></span>
                    <span>Inop.: <b style={{ color: c.inoperantes > 0 ? CRIT : OK }}>{c.inoperantes}</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Críticos */}
        {aba === "criticos" && Array.isArray(criticos) && (
          <div className="grid gap-3">
            {(criticos as any[]).map((b: any) => {
              const badge = ESTADO_BADGE[b.estado] || { label: b.estado, color: "#64748b" };
              return (
                <div key={b.bem} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-700 text-sm">{b.bem}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: badge.color + "22", color: badge.color }}>
                          {badge.label}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: URGENCIA_COLOR[b.urgencia] + "22", color: URGENCIA_COLOR[b.urgencia] }}>
                          urgência {b.urgencia}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{b.observacao}</p>
                      <div className="flex gap-4 text-xs text-slate-400 mt-2">
                        <span>Unid.: <b>{b.unidade}</b></span>
                        <span>Categoria: <b>{b.categoria}</b></span>
                        <span>Aquisição: <b>{b.ano_aquisicao}</b></span>
                        <span>Val. Aquis.: <b>{BRL(b.valor_aquisicao)}</b></span>
                        {b.reparo_orcado > 0 && <span>Reparo: <b style={{ color: WARN }}>{BRL(b.reparo_orcado)}</b></span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Histórico */}
        {aba === "historico" && Array.isArray(historico) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Evolução Patrimonial 2021–2026</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="bens" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="inv" orientation="right" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="bens" dataKey="bens_tombados"   name="Bens Tombados"   stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                  <Line yAxisId="inv"  dataKey="inventario_pct"  name="Inventário (%)"  stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                  <Line yAxisId="bens" dataKey="inoperantes"     name="Inoperantes"     stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Indicadores */}
        {aba === "indicadores" && Array.isArray(indicadores) && (
          <div className="grid gap-3">
            {(indicadores as any[]).map((ind: any) => (
              <div key={ind.indicador} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-4">
                <div className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(ind.status) }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 text-sm">{ind.indicador}</span>
                    <span className="font-bold text-sm" style={{ color: statusColor(ind.status) }}>
                      {ind.unidade === "R$" ? BRL(ind.valor) : `${ind.valor} ${ind.unidade}`}
                      {ind.meta !== null && ind.meta !== undefined ? ` / meta: ${ind.unidade === "R$" ? BRL(ind.meta) : `${ind.meta} ${ind.unidade}`}` : ""}
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
