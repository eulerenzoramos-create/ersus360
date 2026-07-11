import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, api } from "../lib/api";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  RefreshCw, CheckCircle, AlertTriangle, WifiOff, Database, ExternalLink,
} from "lucide-react";

const BRAND  = "#1e3a5f";
const ACCENT = "#1d4ed8";
const OK     = "#16a34a";
const WARN   = "#d97706";
const CRIT   = "#dc2626";

const COLORS = ["#1e3a5f","#1d4ed8","#0891b2","#7c3aed","#16a34a","#d97706","#dc2626","#059669"];

const BRLK = (v: number) => {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `R$${(v / 1_000).toFixed(0)}K`;
  return `R$${v.toFixed(0)}`;
};

const KPI = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-bold mt-1" style={{ color: color || BRAND }}>{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </div>
);

function FonteBadge({ fonte }: { fonte: string }) {
  const isApi  = fonte?.startsWith("API");
  const isErr  = fonte === "indisponível";
  const color  = isApi ? OK : isErr ? CRIT : ACCENT;
  const Icon   = isApi ? CheckCircle : isErr ? WifiOff : Database;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
      style={{ background: `${color}18`, color }}>
      <Icon size={12} /> {fonte || "—"}
    </span>
  );
}

export default function SIOPSLive() {
  const [aba, setAba] = useState("dashboard");
  const qc = useQueryClient();

  const { data: status, isLoading: stLoading } = useQuery({
    queryKey: ["siops-live-status"],
    queryFn: () => apiGet("/api/siops-live/status"),
    refetchInterval: 30_000,
  });

  const { data: dash, isLoading: dashLoading, isError: dashErr } = useQuery({
    queryKey: ["siops-live-dash"],
    queryFn: () => apiGet("/api/siops-live/dashboard"),
    enabled: aba === "dashboard",
    retry: 1,
  });

  const { data: porFonte } = useQuery({
    queryKey: ["siops-live-fonte"],
    queryFn: () => apiGet("/api/siops-live/despesas/por-fonte"),
    enabled: aba === "fontes",
  });

  const { data: porSubfun } = useQuery({
    queryKey: ["siops-live-subfun"],
    queryFn: () => apiGet("/api/siops-live/despesas/por-subfuncao"),
    enabled: aba === "subfuncoes",
  });

  const { data: porNat } = useQuery({
    queryKey: ["siops-live-nat"],
    queryFn: () => apiGet("/api/siops-live/despesas/por-natureza"),
    enabled: aba === "natureza",
  });

  const sincMut = useMutation({
    mutationFn: () => api.post("/api/siops-live/sincronizar"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["siops-live-status"] });
      qc.invalidateQueries({ queryKey: ["siops-live-dash"] });
      qc.invalidateQueries({ queryKey: ["siops-live-fonte"] });
      qc.invalidateQueries({ queryKey: ["siops-live-subfun"] });
      qc.invalidateQueries({ queryKey: ["siops-live-nat"] });
    },
  });

  const st = status as any;
  const d  = dash   as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard"         },
    { key: "fontes",     label: "Por Fonte"          },
    { key: "subfuncoes", label: "Por Subfunção"      },
    { key: "natureza",   label: "Por Natureza"       },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Cabeçalho */}
        <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: BRAND }}>
              <Database size={22} color="white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: BRAND }}>SIOPS — Dados Oficiais</h1>
              <p className="text-sm text-slate-500">
                Integração com o Portal FNS · IBGE 1300144 · Apuí/AM
              </p>
            </div>
          </div>
          <button
            onClick={() => sincMut.mutate()}
            disabled={sincMut.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
            style={{ background: sincMut.isPending ? "#94a3b8" : BRAND }}>
            <RefreshCw size={14} className={sincMut.isPending ? "animate-spin" : ""} />
            {sincMut.isPending ? "Sincronizando…" : "Sincronizar agora"}
          </button>
        </div>

        {/* Painel de status */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div>
              <span className="text-slate-400 mr-1">Fonte:</span>
              {stLoading ? <span className="text-slate-300">…</span> : <FonteBadge fonte={st?.fonte} />}
            </div>
            <div>
              <span className="text-slate-400 mr-1">Última sincronização:</span>
              <span className="font-medium text-slate-600">
                {st?.sincronizado_em
                  ? new Date(st.sincronizado_em).toLocaleString("pt-BR")
                  : "Nunca — clique em Sincronizar"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 mr-1">Cache válido:</span>
              <span className="font-medium" style={{ color: st?.cache_valido ? OK : WARN }}>
                {st?.cache_valido ? "Sim (24h)" : "Expirado"}
              </span>
            </div>
            <a
              href="https://portalfns.saude.gov.br/siops/"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-blue-600 hover:underline text-xs">
              Portal FNS <ExternalLink size={11} />
            </a>
          </div>

          {/* Mensagem de resultado da última sincronização */}
          {sincMut.isSuccess && (sincMut.data?.data as any)?.fonte && (
            <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: `${OK}14`, color: OK }}>
              ✓ Sincronizado — fonte: <b>{(sincMut.data?.data as any).fonte}</b>
              {(sincMut.data?.data as any).erro && (
                <span className="ml-2" style={{ color: CRIT }}>
                  Aviso: {(sincMut.data?.data as any).erro}
                </span>
              )}
            </div>
          )}
          {sincMut.isError && (
            <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: `${CRIT}14`, color: CRIT }}>
              Erro na sincronização — verifique a conectividade com o servidor Railway.
            </div>
          )}
        </div>

        {/* Aviso quando dados não disponíveis ainda */}
        {!st?.cache_valido && !sincMut.isPending && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" style={{ color: WARN }} />
            <div className="text-sm text-yellow-800">
              <b>Dados não carregados ainda.</b> Clique em <b>"Sincronizar agora"</b> para buscar os dados
              diretamente do portal FNS (SIOPS). O download pode levar até 30 segundos na primeira vez.
              <br/><span className="text-xs text-yellow-600 mt-1 block">
                Tentará a API pública SIOPS primeiro; se indisponível, fará download do CSV oficial 2025.
              </span>
            </div>
          </div>
        )}

        {/* Abas */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {ABAS.map((a) => (
            <button key={a.key} onClick={() => setAba(a.key)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={aba === a.key
                ? { background: BRAND, color: "white" }
                : { background: "white", color: "#475569", border: "1px solid #e2e8f0" }}>
              {a.label}
            </button>
          ))}
        </div>

        {/* ── DASHBOARD ── */}
        {aba === "dashboard" && (
          <>
            {dashLoading && (
              <div className="text-center py-20 text-slate-400">Carregando dados do SIOPS…</div>
            )}
            {dashErr && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm">
                <b>Dados não disponíveis.</b> Clique em "Sincronizar agora" para buscar os dados do portal FNS.
              </div>
            )}
            {d && !dashLoading && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KPI label="Dotação Atualizada"  value={BRLK(d.totais?.dotacao   || 0)} color={BRAND} />
                  <KPI label="Empenhado"            value={BRLK(d.totais?.empenhado || 0)} color={ACCENT} />
                  <KPI label="Liquidado"            value={BRLK(d.totais?.liquidado || 0)} color={ACCENT} />
                  <KPI label="Pago"                 value={BRLK(d.totais?.pago      || 0)} sub={`${d.pct_execucao || 0}% da dotação`} color={OK} />
                </div>

                {/* Barra de execução geral */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-700 mb-4">Pipeline Orçamentário — Dotação → Empenho → Liquidação → Pagamento</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Dotação",    val: d.totais?.dotacao,   color: "#94a3b8" },
                      { label: "Empenhado",  val: d.totais?.empenhado, color: ACCENT },
                      { label: "Liquidado",  val: d.totais?.liquidado, color: "#0891b2" },
                      { label: "Pago",       val: d.totais?.pago,      color: OK },
                    ].map((item) => {
                      const pct = d.totais?.dotacao
                        ? Math.min(((item.val || 0) / d.totais.dotacao) * 100, 100)
                        : 0;
                      return (
                        <div key={item.label} className="flex items-center gap-3 text-sm">
                          <span className="w-24 text-slate-500 shrink-0">{item.label}</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-3">
                            <div className="h-3 rounded-full transition-all" style={{ width: `${pct}%`, background: item.color }} />
                          </div>
                          <span className="w-28 text-right font-semibold text-slate-700">{BRLK(item.val || 0)}</span>
                          <span className="w-12 text-right text-slate-400 text-xs">{pct.toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {/* Top fontes */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <h3 className="font-semibold text-slate-700 mb-3 text-sm">Top Fontes</h3>
                    <div className="space-y-2">
                      {(d.top_fontes || []).slice(0, 6).map((f: any, i: number) => (
                        <div key={f.fonte} className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="flex-1 text-slate-600 truncate">{f.fonte}</span>
                          <span className="font-semibold text-slate-700">{BRLK(f.pago)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Top subfunções */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <h3 className="font-semibold text-slate-700 mb-3 text-sm">Top Subfunções</h3>
                    <div className="space-y-2">
                      {(d.top_subfuncoes || []).slice(0, 6).map((f: any, i: number) => (
                        <div key={f.subfuncao} className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="flex-1 text-slate-600 truncate">{f.subfuncao}</span>
                          <span className="font-semibold text-slate-700">{BRLK(f.pago)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Top naturezas */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <h3 className="font-semibold text-slate-700 mb-3 text-sm">Top Naturezas de Despesa</h3>
                    <div className="space-y-2">
                      {(d.top_naturezas || []).slice(0, 6).map((f: any, i: number) => (
                        <div key={f.natureza} className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="flex-1 text-slate-600 truncate">{f.natureza}</span>
                          <span className="font-semibold text-slate-700">{BRLK(f.pago)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-100 rounded-xl p-3 text-xs text-slate-500 flex items-center gap-2">
                  <Database size={13} />
                  <span>
                    {d.total_linhas_csv ? `${d.total_linhas_csv} registros carregados do CSV SIOPS` : "Dados carregados"}
                    {" · "}Fonte: <b>{d.fonte}</b>
                    {" · "}Sincronizado: {d.sincronizado_em ? new Date(d.sincronizado_em).toLocaleString("pt-BR") : "—"}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── POR FONTE ── */}
        {aba === "fontes" && Array.isArray(porFonte) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Despesa Paga por Fonte de Recurso</h3>
              <ResponsiveContainer width="100%" height={Math.max(300, (porFonte as any[]).length * 32)}>
                <BarChart data={porFonte as any[]} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="fonte" tick={{ fontSize: 9 }} width={220} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip formatter={(v: number) => BRLK(v)} />
                  <Bar dataKey="pago" name="Pago (R$)" radius={[0,3,3,0]}>
                    {(porFonte as any[]).map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── POR SUBFUNÇÃO ── */}
        {aba === "subfuncoes" && Array.isArray(porSubfun) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Despesa Paga por Subfunção</h3>
              <ResponsiveContainer width="100%" height={Math.max(300, (porSubfun as any[]).length * 32)}>
                <BarChart data={porSubfun as any[]} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="subfuncao" tick={{ fontSize: 9 }} width={260} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip formatter={(v: number) => BRLK(v)} />
                  <Bar dataKey="pago" name="Pago (R$)" radius={[0,3,3,0]}>
                    {(porSubfun as any[]).map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── POR NATUREZA ── */}
        {aba === "natureza" && Array.isArray(porNat) && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-4">Despesa por Natureza — Pizza</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={porNat as any[]} dataKey="pago" nameKey="natureza"
                      cx="50%" cy="50%" outerRadius={100}
                      label={({ name, percent }: any) => `${(percent * 100).toFixed(0)}%`}>
                      {(porNat as any[]).map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => BRLK(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-4">Ranking — Natureza de Despesa</h3>
                <div className="space-y-2">
                  {(porNat as any[]).map((n: any, i: number) => {
                    const total = (porNat as any[]).reduce((s: number, x: any) => s + x.pago, 0);
                    const pct = total ? ((n.pago / total) * 100).toFixed(1) : "0";
                    return (
                      <div key={n.natureza}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-slate-600 truncate">{n.natureza}</span>
                          <span className="font-bold text-slate-700 ml-2">{BRLK(n.pago)}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
