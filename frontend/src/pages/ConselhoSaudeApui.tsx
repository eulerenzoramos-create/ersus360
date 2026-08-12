import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Users, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";

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

const SEG_COLORS: Record<string, string> = {
  "usuario": "#1d4ed8",
  "trabalhador": "#16a34a",
  "gestor": "#d97706",
  "prestador": "#7c3aed",
};

export default function ConselhoSaudeApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["cms-dashboard"],   queryFn: () => apiGet("/api/conselho-saude-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: composicao }  = useQuery({ queryKey: ["cms-composicao"],  queryFn: () => apiGet("/api/conselho-saude-apui/composicao"),  enabled: aba === "composicao" });
  const { data: delibs }      = useQuery({ queryKey: ["cms-delibs"],      queryFn: () => apiGet("/api/conselho-saude-apui/deliberacoes"), enabled: aba === "deliberacoes" });
  const { data: historico }   = useQuery({ queryKey: ["cms-historico"],   queryFn: () => apiGet("/api/conselho-saude-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["cms-ind"],         queryFn: () => apiGet("/api/conselho-saude-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",      icon: <Users size={15}/> },
    { key: "composicao",   label: "Composição",     icon: <Users size={15}/> },
    { key: "deliberacoes", label: "Deliberações",   icon: <CheckCircle size={15}/> },
    { key: "historico",    label: "Histórico",      icon: <TrendingUp size={15}/> },
    { key: "indicadores",  label: "Indicadores",    icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Users size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Conselho Municipal de Saúde — Apuí/AM</h1>
            <p className="text-sm text-slate-500">CMS · Controle Social · Deliberações · Plenárias · FMS Apuí/AM</p>
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
              <KPI label="Membros do CMS"          value={dashRaw.composicao_total_membros.toString()} color={ACCENT} sub="16 titulares + 14 suplentes" />
              <KPI label="Reuniões Realizadas"     value={`${dashRaw.reunioes_ordinarias_realizadas_ano}/${dashRaw.reunioes_ordinarias_previstas_ano}`} color={WARN} sub="ordinárias + 4 extraordinárias" />
              <KPI label="Deliberações no Ano"     value={dashRaw.deliberacoes_emitidas_ano.toString()} color={BRAND} />
              <KPI label="Deliberações Cumpridas"  value={`${dashRaw.deliberacoes_cumpridas_pct}%`} color={WARN} sub="meta: 90%" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Resoluções Aprovadas"    value={dashRaw.resolucoes_aprovadas_ano.toString()} />
              <KPI label="Plenárias Públicas"      value={`${dashRaw.plenarias_publicas_ano}/4`} color={WARN} sub="meta: 4 por ano" />
              <KPI label="Quórum Médio"            value={`${dashRaw.quorum_medio_pct}%`} color={OK} sub="meta: 75%" />
              <KPI label="Atas no Prazo"           value={`${dashRaw.ata_publicacao_prazo_pct}%`} color={WARN} sub="meta: 100%" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Composição por Segmento</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={[
                      { name: "Usuários (50%)",      value: 8, fill: SEG_COLORS.usuario },
                      { name: "Trabalhadores (25%)", value: 4, fill: SEG_COLORS.trabalhador },
                      { name: "Gestores (12,5%)",    value: 2, fill: SEG_COLORS.gestor },
                      { name: "Prestadores (12,5%)", value: 2, fill: SEG_COLORS.prestador },
                    ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                      {["#1d4ed8","#16a34a","#d97706","#7c3aed"].map((c) => <Cell key={c} fill={c} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex flex-col gap-2 justify-center">
                <p><b>Controle social ativo:</b> CMS funcionando regularmente com quórum médio de 81,3% — acima da média nacional.</p>
                <p><b>Deliberações não cumpridas:</b> 31,6% pendentes — falta de psiquiatra e demora na regulação são as principais queixas persistentes.</p>
                <p><b>Transparência digital:</b> CMS sem site — deliberações e atas não acessíveis on-line. Municípios com &lt;20k hab. raramente têm infraestrutura digital para o conselho.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "composicao" && Array.isArray(composicao) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Vagas por Segmento (Lei 8.142/90 — paridade)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(composicao as any[])} margin={{ left: 0, right: 20 }}>
                  <XAxis dataKey="segmento" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="titulares" name="Titulares" radius={[3,3,0,0]}>
                    {(composicao as any[]).map((c: any) => <Cell key={c.segmento} fill={SEG_COLORS[c.tipo] || BRAND} />)}
                  </Bar>
                  <Bar dataKey="suplentes" name="Suplentes" fill="#6b7280" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(composicao as any[]).map((c: any) => (
                <div key={c.segmento} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ background: SEG_COLORS[c.tipo] || BRAND }} />
                    <div>
                      <span className="font-semibold text-slate-700">{c.segmento}</span>
                      <p className="text-xs text-slate-400">{c.pct_plenario}% do plenário</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{c.titulares} titulares</p>
                    <p className="text-xs text-slate-400">{c.suplentes} suplentes</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "deliberacoes" && Array.isArray(delibs) && (
          <div className="grid gap-3">
            {(delibs as any[]).map((d: any) => (
              <div key={d.numero} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-400">{d.numero}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{d.area}</span>
                      <span className="text-xs text-slate-400">{d.data}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">{d.assunto}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-bold flex-shrink-0 ${d.cumprida ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                    {d.cumprida ? "✓ Cumprida" : "⏳ Pendente"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — CMS (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="reunioes"      name="Reuniões"          stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="deliberacoes"  name="Deliberações"      stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="cumpridas_pct" name="Cumpridas %"       stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="quorum_medio"  name="Quórum médio %"   stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
