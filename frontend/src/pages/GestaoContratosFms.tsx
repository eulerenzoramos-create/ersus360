import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { FolderOpen, AlertTriangle, DollarSign, Activity } from "lucide-react";
import { BRL, BRL_AXIS, PCT } from "../lib/fmt";

const BRAND  = "#dbeafe";
const ACCENT = "#2563eb";
const OK     = "#16a34a";
const WARN   = "#d97706";
const CRIT   = "#dc2626";

function statusColor(s: string) {
  if (s === "ok" || s === "ativo") return OK;
  if (s === "atencao" || s === "em_andamento" || s === "homologado") return WARN;
  return CRIT;
}

const KPI = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-bold mt-1" style={{ color: color || BRAND }}>{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </div>
);

const FASE_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  em_andamento:       { bg: "#fefce8", text: WARN,  label: "Em Andamento" },
  homologado:         { bg: "#f0fdf4", text: OK,    label: "Homologado" },
  concluido:          { bg: "#f0fdf4", text: OK,    label: "Concluído" },
  aguardando_recurso: { bg: "#fff7ed", text: WARN,  label: "Aguard. Recurso" },
  planejamento:       { bg: "#eff6ff", text: ACCENT,"label": "Planejamento" },
};

export default function GestaoContratosFms() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }       = useQuery({ queryKey: ["gc-dashboard"],  queryFn: () => apiGet("/api/gestao-contratos-fms/dashboard"),  enabled: aba === "dashboard" });
  const { data: contratos }  = useQuery({ queryKey: ["gc-contratos"],  queryFn: () => apiGet("/api/gestao-contratos-fms/contratos"),  enabled: aba === "contratos" });
  const { data: licitacoes } = useQuery({ queryKey: ["gc-licitacoes"], queryFn: () => apiGet("/api/gestao-contratos-fms/licitacoes"), enabled: aba === "licitacoes" });
  const { data: historico }  = useQuery({ queryKey: ["gc-historico"],  queryFn: () => apiGet("/api/gestao-contratos-fms/historico"),  enabled: aba === "historico" });
  const { data: indicadores }= useQuery({ queryKey: ["gc-ind"],       queryFn: () => apiGet("/api/gestao-contratos-fms/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",   icon: <FolderOpen size={15}/> },
    { key: "contratos",  label: "Contratos",   icon: <FolderOpen size={15}/> },
    { key: "licitacoes", label: "Licitações",  icon: <DollarSign size={15}/> },
    { key: "historico",  label: "Histórico",   icon: <Activity size={15}/> },
    { key: "indicadores",label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  const tipo_labels: Record<string, string> = { servico: "Serviço", fornecimento: "Fornecimento", locacao: "Locação", tecnologia: "Tecnologia" };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <FolderOpen size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Gestão de Contratos / Licitações</h1>
            <p className="text-sm text-slate-500">Contratos FMS · Pregões · Economicidade · Vigências · FMS Apuí/AM</p>
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
              <KPI label="Contratos Ativos"      value={dashRaw.contratos_ativos.toString()} color={ACCENT} />
              <KPI label="Contratos Vencidos"    value={dashRaw.contratos_vencidos.toString()} color={CRIT} />
              <KPI label="Valor Total Contratos" value={`R$ ${(dashRaw.valor_total_contratos_r/1_000_000).toFixed(2)}M`} color={ACCENT} />
              <KPI label="Empenhado/Mês"         value={`R$ ${(dashRaw.valor_empenhado_mes_r/1000).toFixed(0)}k`} color={WARN} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Licitações em Andamento" value={dashRaw.licitacoes_em_andamento.toString()} color={WARN} />
              <KPI label="Licitações Planejadas"   value={dashRaw.licitacoes_planejadas.toString()} color={ACCENT} />
              <KPI label="Economicidade Média"     value={`${dashRaw.economicidade_media_pct}%`} color={OK} sub="abaixo do estimado" />
              <KPI label="Contratos com Aditivo"   value={dashRaw.contratos_com_aditivo.toString()} color={WARN} />
            </div>
            {dashRaw.contratos_vencidos > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
                <b>{dashRaw.contratos_vencidos} contrato(s) vencido(s)</b> sem renovação — transporte sanitário em risco de paralisação. Providenciar pregão emergencial ou prorrogação.
              </div>
            )}
          </div>
        )}

        {aba === "contratos" && Array.isArray(contratos) && (
          <div className="grid gap-3">
            {(contratos as any[]).map((ct: any) => (
              <div key={ct.numero} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-slate-400">{ct.numero}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{tipo_labels[ct.tipo] || ct.tipo}</span>
                      <span className="text-xs px-2 py-0.5 rounded font-semibold"
                        style={{ background: ct.status === "ativo" ? "#f0fdf4" : "#fef2f2", color: ct.status === "ativo" ? OK : CRIT }}>
                        {ct.status === "ativo" ? "Ativo" : "VENCIDO"}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-700 text-sm">{ct.objeto}</p>
                    <p className="text-xs text-slate-400">{ct.fornecedor} · Vigência até: {ct.vigencia_fim}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg" style={{ color: ACCENT }}>{BRL(ct.valor_total_r)}</p>
                    <p className="text-xs text-slate-500">{BRL(ct.valor_mensal_r)}/mês</p>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                  <div className="h-1.5 rounded-full" style={{ width: `${Math.min(ct.execucao_pct, 100)}%`, background: ct.execucao_pct >= 100 ? CRIT : ct.execucao_pct >= 80 ? WARN : OK }} />
                </div>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span>Execução: <b>{ct.execucao_pct}%</b></span>
                  <span>Aditivos: <b>{ct.aditivos}</b></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "licitacoes" && Array.isArray(licitacoes) && (
          <div className="grid gap-3">
            {(licitacoes as any[]).map((lic: any) => {
              const badge = FASE_BADGE[lic.fase] || FASE_BADGE["em_andamento"];
              return (
                <div key={lic.numero} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-slate-400">{lic.numero}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{lic.modalidade}</span>
                        <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ background: badge.bg, color: badge.text }}>{badge.label}</span>
                      </div>
                      <p className="font-semibold text-slate-700 text-sm">{lic.objeto}</p>
                      <p className="text-xs text-slate-400">Abertura: {lic.data_abertura} · Propostas: {lic.propostas_recebidas}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg" style={{ color: ACCENT }}>{BRL(lic.valor_estimado_r)}</p>
                      <p className="text-xs text-slate-500">estimado</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal — Contratos e Economicidade (2026)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="r"   orientation="right" tick={{ fontSize: 10 }} tickFormatter={BRL_AXIS}M`} />
                <Tooltip />
                <Legend />
                <Line yAxisId="n" dataKey="contratos_ativos"      name="Contratos Ativos"   stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="r" dataKey="valor_contratos_r"     name="Valor Total (R$)"   stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="n" dataKey="economicidade_pct"     name="Economicidade %"    stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {aba === "indicadores" && Array.isArray(indicadores) && (
          <div className="grid gap-3">
            {(indicadores as any[]).map((ind: any) => (
              <div key={ind.indicador} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-4">
                <div className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: ind.status === "ok" ? OK : ind.status === "atencao" ? WARN : CRIT }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 text-sm">{ind.indicador}</span>
                    <span className="font-bold text-sm" style={{ color: ind.status === "ok" ? OK : ind.status === "atencao" ? WARN : CRIT }}>
                      {typeof ind.valor === "number" && ind.valor > 100000
                        ? `R$ ${ind.valor.toLocaleString()} ${ind.unidade}`
                        : `${ind.valor} ${ind.unidade}`}
                      {ind.meta != null ? ` / meta: ${ind.meta} ${ind.unidade}` : ""}
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
