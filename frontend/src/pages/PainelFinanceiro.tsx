import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine, Cell,
} from "recharts";
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, Clock, RefreshCw, Download, FileText,
  ChevronDown, ChevronRight, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { apiGet } from "../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Bloco {
  bloco: string; codigo: string; cor: string;
  previsto_ano: number; recebido_ano: number;
  empenhado: number; liquidado: number; pago: number;
  pct_execucao: number;
  ultima_parcela: string; proxima_parcela: string;
}

interface Empenho {
  id: string; credor: string; objeto: string; valor: number;
  data: string; bloco: string; status: string;
}

interface Repasse { mes: string; previsto: number; recebido: number | null; diferenca: number | null }

interface Siops {
  pct_proprio_saude: number; meta_minima: number; conforme: boolean;
  margem_seguranca: number;
  historico: { ano: number; pct: number; conforme: boolean; parcial?: boolean }[];
}

interface Painel {
  municipio: string; uf: string; mes_referencia: string;
  receitas: Record<string, number>;
  despesas: Record<string, number>;
  blocos: Bloco[];
  repasses_mensais: Repasse[];
  empenhos_pendentes: Empenho[];
  siops: Siops;
  alertas: { nivel: string; bloco: string; msg: string }[];
  kpis: {
    pct_execucao_geral: number; pct_arrecadacao: number;
    saldo_disponivel: number; siops_conforme: boolean;
    total_empenhos_pendentes: number; valor_pendente_liquidar: number;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const R = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);

const Pct = ({ v, meta, inverted = false }: { v: number; meta?: number; inverted?: boolean }) => {
  const ok = meta ? (inverted ? v <= meta : v >= meta) : v >= 70;
  return (
    <span style={{ fontWeight: 700, color: ok ? "#16a34a" : v >= (meta ?? 0) * 0.8 ? "#d97706" : "#dc2626" }}>
      {v.toFixed(1)}%
    </span>
  );
};

function MiniBar({ pct, cor, height = 8 }: { pct: number; cor: string; height?: number }) {
  return (
    <div style={{ height, background: "#e5e7eb", borderRadius: height / 2, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: cor, transition: "width .6s", borderRadius: height / 2 }} />
    </div>
  );
}

const TOOLTIPSTYLE = { fontSize: 12, background: "#1e293b", border: "none", borderRadius: 6, color: "#f8fafc" };

// ── Card KPI ──────────────────────────────────────────────────────────────────

function KpiCard({ label, val, sub, icon, bg, cor, delta }: {
  label: string; val: string; sub?: string; icon: React.ReactNode;
  bg: string; cor: string; delta?: number;
}) {
  return (
    <div style={{ background: bg, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ color: cor, opacity: .8 }}>{icon}</div>
        {delta !== undefined && (
          <span style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 2, color: delta >= 0 ? "#16a34a" : "#dc2626" }}>
            {delta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: cor }}>{val}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── Bloco card ────────────────────────────────────────────────────────────────

function BlocoCard({ b }: { b: Bloco }) {
  const [open, setOpen] = useState(false);
  const cor = b.pct_execucao >= 65 ? "#16a34a" : b.pct_execucao >= 40 ? "#d97706" : "#dc2626";

  return (
    <div style={{ border: `1px solid ${b.cor}30`, borderLeft: `4px solid ${b.cor}`, borderRadius: 8, overflow: "hidden", background: "#fff" }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", cursor: "pointer" }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: b.cor + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: b.cor }}>{b.codigo}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{b.bloco}</div>
          <MiniBar pct={b.pct_execucao} cor={cor} />
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: cor }}>{b.pct_execucao}%</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>exec.</div>
        </div>
        {open ? <ChevronDown size={14} color="#9ca3af" /> : <ChevronRight size={14} color="#9ca3af" />}
      </div>

      {open && (
        <div style={{ padding: "10px 14px 14px", borderTop: `1px solid ${b.cor}20`, background: b.cor + "05" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 10 }}>
            {[
              { label: "Recebido FNS",  val: R(b.recebido_ano),  cor: "#2563eb" },
              { label: "Liquidado",     val: R(b.liquidado),     cor: "#d97706" },
              { label: "Pago",          val: R(b.pago),          cor: "#16a34a" },
            ].map(k => (
              <div key={k.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: k.cor }}>{k.val}</div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>{k.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#6b7280" }}>
            <span>Última parcela: {b.ultima_parcela}</span>
            <span>Próxima: <strong>{b.proxima_parcela}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tooltip personalizado para gráficos ───────────────────────────────────────

function TooltipRepasse({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const prev = payload.find((p: any) => p.dataKey === "previsto");
  const rec  = payload.find((p: any) => p.dataKey === "recebido");
  return (
    <div style={{ ...TOOLTIPSTYLE, padding: "8px 12px" }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {prev && <div style={{ color: "#93c5fd" }}>Previsto: {R(prev.value)}</div>}
      {rec  && <div style={{ color: "#4ade80" }}>Recebido: {R(rec.value)}</div>}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function PainelFinanceiro() {
  const [aba, setAba] = useState<"visao-geral" | "blocos" | "repasses" | "empenhos" | "siops">("visao-geral");

  const { data, isLoading, refetch } = useQuery<Painel>({
    queryKey: ["financeiro-painel"],
    queryFn: () => apiGet("/api/financeiro/painel") as Promise<Painel>,
    staleTime: 60_000,
  });

  const handleExportPdf = async () => {
    const token = localStorage.getItem("ersus_token");
    const res = await fetch(
      `${import.meta.env.VITE_API_URL || ""}/api/relatorios/exportar-pdf?tipo=gerencial&ano=2026`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) { alert("Erro ao gerar PDF"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Painel_Financeiro_Apui_2026.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  const k = data?.kpis;
  const ABAS = [
    { id: "visao-geral", label: "Visão Geral" },
    { id: "blocos",      label: "Blocos FNS"  },
    { id: "repasses",    label: "Repasses"    },
    { id: "empenhos",    label: `Empenhos (${data?.empenhos_pendentes?.length ?? "…"})` },
    { id: "siops",       label: "SIOPS"       },
  ] as const;

  return (
    <div style={{ padding: 24, maxWidth: 1040, margin: "0 auto" }}>

      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Painel Financeiro</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
            Execução orçamentária · {data?.municipio}/{data?.uf} · {data?.mes_referencia ?? "2026"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => refetch()} style={{ display: "flex", alignItems: "center", gap: 5, border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 12px", background: "#fff", cursor: "pointer", fontSize: 13 }}>
            <RefreshCw size={13} /> Atualizar
          </button>
          <button onClick={handleExportPdf} style={{ display: "flex", alignItems: "center", gap: 5, background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            <Download size={13} /> PDF
          </button>
        </div>
      </div>

      {isLoading && <div style={{ textAlign: "center", padding: 60 }}><RefreshCw size={28} color="#9ca3af" style={{ animation: "spin 1s linear infinite" }} /></div>}

      {data && k && (
        <>
          {/* Alertas */}
          {data.alertas.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {data.alertas.map((al, i) => (
                <div key={i} style={{
                  display: "flex", gap: 10, alignItems: "center", padding: "8px 14px", borderRadius: 8,
                  background: al.nivel === "CRITICO" ? "#fff7f7" : "#fffbeb",
                  border: `1px solid ${al.nivel === "CRITICO" ? "#fca5a5" : "#fde68a"}`,
                }}>
                  <AlertTriangle size={15} color={al.nivel === "CRITICO" ? "#dc2626" : "#d97706"} />
                  <span style={{ fontSize: 13, color: al.nivel === "CRITICO" ? "#991b1b" : "#92400e" }}>{al.msg}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2, marginBottom: 20, borderBottom: "2px solid #e5e7eb" }}>
            {ABAS.map(a => (
              <button key={a.id} onClick={() => setAba(a.id)} style={{
                padding: "8px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13,
                borderBottom: aba === a.id ? "2px solid #1d4ed8" : "2px solid transparent",
                color: aba === a.id ? "#1d4ed8" : "#6b7280", fontWeight: aba === a.id ? 700 : 400, marginBottom: -2,
              }}>{a.label}</button>
            ))}
          </div>

          {/* ── Visão Geral ── */}
          {aba === "visao-geral" && (
            <div>
              {/* KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
                <KpiCard label="Execução Geral" val={`${k.pct_execucao_geral}%`}
                  sub={`${R(data.despesas.pago)} pagos`}
                  icon={<TrendingUp size={20} />} bg="#eff6ff" cor="#1d4ed8" delta={3.2} />
                <KpiCard label="Saldo Disponível" val={R(k.saldo_disponivel)}
                  sub="arrecadado − pago"
                  icon={<DollarSign size={20} />} bg="#f0fdf4" cor="#16a34a" />
                <KpiCard label="SIOPS — Rec. Próprios" val={`${data.siops.pct_proprio_saude}%`}
                  sub={`Meta ≥ ${data.siops.meta_minima}% • ${data.siops.conforme ? "✓ Conforme" : "⚠ Crítico"}`}
                  icon={<CheckCircle size={20} />}
                  bg={data.siops.conforme ? "#f0fdf4" : "#fff7f7"}
                  cor={data.siops.conforme ? "#16a34a" : "#dc2626"} />
              </div>

              {/* Gráfico receita vs despesa */}
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 20, marginBottom: 16 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>Receita × Despesa — 2026</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

                  {/* Barras receita */}
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>Arrecadação por fonte</div>
                    {[
                      { label: "FNS",        val: data.receitas.fns_recebido,         total: data.receitas.fns_previsto,        cor: "#2563eb" },
                      { label: "Próprio",    val: data.receitas.municipio_proprio,    total: data.receitas.municipio_proprio,   cor: "#16a34a" },
                      { label: "Convênios",  val: data.receitas.convenios_recebido,   total: data.receitas.convenios_recebido,  cor: "#7c3aed" },
                      { label: "Emendas",    val: data.receitas.emendas_recebido,     total: data.receitas.emendas_recebido,    cor: "#d97706" },
                    ].map(item => (
                      <div key={item.label} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                          <span>{item.label}</span>
                          <span style={{ fontWeight: 600 }}>{R(item.val)}</span>
                        </div>
                        <MiniBar pct={(item.val / item.total) * 100} cor={item.cor} height={7} />
                      </div>
                    ))}
                  </div>

                  {/* Estágios da despesa */}
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>Estágios da despesa</div>
                    {[
                      { label: "Dotação atualizada", val: data.despesas.dotacao_atualizada, cor: "#e5e7eb", pct: 100 },
                      { label: "Empenhado",          val: data.despesas.empenhado,           cor: "#93c5fd", pct: data.despesas.empenhado / data.despesas.dotacao_atualizada * 100 },
                      { label: "Liquidado",          val: data.despesas.liquidado,           cor: "#60a5fa", pct: data.despesas.liquidado / data.despesas.dotacao_atualizada * 100 },
                      { label: "Pago",               val: data.despesas.pago,               cor: "#2563eb", pct: data.despesas.pago / data.despesas.dotacao_atualizada * 100 },
                    ].map(item => (
                      <div key={item.label} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                          <span>{item.label}</span>
                          <span style={{ fontWeight: item.label === "Pago" ? 700 : 400 }}>{R(item.val)}</span>
                        </div>
                        <MiniBar pct={item.pct} cor={item.cor} height={7} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Empenhos pendentes resumo */}
              {data.empenhos_pendentes.length > 0 && (
                <div style={{ border: "1px solid #fde68a", borderRadius: 8, padding: 14, background: "#fffbeb" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Clock size={15} color="#d97706" />
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#92400e" }}>
                      {data.empenhos_pendentes.length} empenhos aguardando — {R(k.valor_pendente_liquidar)} a liquidar
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {data.empenhos_pendentes.slice(0, 3).map(e => (
                      <span key={e.id} style={{ fontSize: 11, background: "#fff", border: "1px solid #fde68a", borderRadius: 6, padding: "3px 8px" }}>
                        {e.credor.split(" ").slice(0, 2).join(" ")} · {R(e.valor)}
                      </span>
                    ))}
                    {data.empenhos_pendentes.length > 3 && (
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>+{data.empenhos_pendentes.length - 3} mais…</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Blocos FNS ── */}
          {aba === "blocos" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 16 }}>
                {data.blocos.map(b => {
                  const cor = b.pct_execucao >= 65 ? "#16a34a" : b.pct_execucao >= 40 ? "#d97706" : "#dc2626";
                  return (
                    <div key={b.codigo} style={{ textAlign: "center", padding: "10px 6px", background: b.cor + "0d", borderRadius: 8, border: `1px solid ${b.cor}20` }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: cor }}>{b.pct_execucao}%</div>
                      <div style={{ fontSize: 10, color: "#6b7280" }}>{b.codigo}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ height: 220, marginBottom: 20 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.blocos} barGap={4}>
                    <XAxis dataKey="codigo" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(v: number, name: string) => [R(v), name === "recebido_ano" ? "Recebido" : name === "pago" ? "Pago" : name]}
                      contentStyle={TOOLTIPSTYLE}
                    />
                    <Bar dataKey="recebido_ano" name="Recebido" radius={[4,4,0,0]}>
                      {data.blocos.map(b => <Cell key={b.codigo} fill={b.cor + "88"} />)}
                    </Bar>
                    <Bar dataKey="pago" name="Pago" radius={[4,4,0,0]}>
                      {data.blocos.map(b => <Cell key={b.codigo} fill={b.cor} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.blocos.map(b => <BlocoCard key={b.codigo} b={b} />)}
              </div>
            </div>
          )}

          {/* ── Repasses mensais ── */}
          {aba === "repasses" && (
            <div>
              <div style={{ height: 240, marginBottom: 20 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.repasses_mensais} barGap={6}>
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <Tooltip content={<TooltipRepasse />} />
                    <Bar dataKey="previsto"  name="Previsto"  fill="#93c5fd" radius={[4,4,0,0]} />
                    <Bar dataKey="recebido"  name="Recebido"  radius={[4,4,0,0]}>
                      {data.repasses_mensais.map((r, i) => (
                        <Cell key={i} fill={r.recebido == null ? "#e5e7eb" : "#2563eb"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
                      <th style={{ padding: "8px 12px" }}>Mês</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Previsto</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Recebido</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Diferença</th>
                      <th style={{ padding: "8px 12px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.repasses_mensais.map((r, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", background: r.recebido == null ? "#f9fafb" : "white" }}>
                        <td style={{ padding: "8px 12px", fontWeight: 500 }}>{r.mes}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", color: "#6b7280" }}>{R(r.previsto)}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600 }}>
                          {r.recebido != null ? R(r.recebido) : <span style={{ color: "#9ca3af" }}>—</span>}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "right" }}>
                          {r.diferenca != null ? (
                            <span style={{ color: r.diferenca >= 0 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                              {r.diferenca >= 0 ? "+" : ""}{R(r.diferenca)}
                            </span>
                          ) : "—"}
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          {r.recebido == null
                            ? <span style={{ background: "#f3f4f6", color: "#9ca3af", fontSize: 11, padding: "2px 8px", borderRadius: 10 }}>Pendente</span>
                            : r.diferenca != null && r.diferenca < -5000
                            ? <span style={{ background: "#fff7f7", color: "#dc2626", fontSize: 11, padding: "2px 8px", borderRadius: 10 }}>Glosa parcial</span>
                            : <span style={{ background: "#f0fdf4", color: "#16a34a", fontSize: 11, padding: "2px 8px", borderRadius: 10 }}>✓ Recebido</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Empenhos ── */}
          {aba === "empenhos" && (
            <div>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
                      <th style={{ padding: "8px 12px" }}>NE</th>
                      <th style={{ padding: "8px 12px" }}>Credor</th>
                      <th style={{ padding: "8px 12px" }}>Objeto</th>
                      <th style={{ padding: "8px 12px" }}>Bloco</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Valor</th>
                      <th style={{ padding: "8px 12px" }}>Vencimento</th>
                      <th style={{ padding: "8px 12px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.empenhos_pendentes.map(e => {
                      const venc = new Date(e.data + "T00:00");
                      const dias = Math.ceil((venc.getTime() - Date.now()) / 86400000);
                      const atrasado = dias < 0;
                      return (
                        <tr key={e.id} style={{ borderBottom: "1px solid #f3f4f6", background: atrasado ? "#fff7f7" : "white" }}>
                          <td style={{ padding: "8px 12px", fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>{e.id}</td>
                          <td style={{ padding: "8px 12px", fontWeight: 500, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.credor}</td>
                          <td style={{ padding: "8px 12px", color: "#6b7280", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.objeto}</td>
                          <td style={{ padding: "8px 12px" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, background: "#e0f2fe", color: "#0369a1", padding: "1px 6px", borderRadius: 6 }}>{e.bloco}</span>
                          </td>
                          <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700 }}>{R(e.valor)}</td>
                          <td style={{ padding: "8px 12px", fontSize: 12 }}>
                            <span style={{ color: atrasado ? "#dc2626" : dias <= 3 ? "#d97706" : "#6b7280" }}>
                              {venc.toLocaleDateString("pt-BR")} {atrasado ? `(${Math.abs(dias)}d atraso)` : dias <= 3 ? "(urgente)" : ""}
                            </span>
                          </td>
                          <td style={{ padding: "8px 12px" }}>
                            <span style={{
                              fontSize: 11, padding: "2px 8px", borderRadius: 10,
                              background: e.status === "a_liquidar" ? "#fffbeb" : "#eff6ff",
                              color: e.status === "a_liquidar" ? "#d97706" : "#2563eb",
                              fontWeight: 600,
                            }}>
                              {e.status === "a_liquidar" ? "A liquidar" : "A pagar"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 10, textAlign: "right", fontSize: 12, color: "#6b7280" }}>
                Total pendente: <strong>{R(k.valor_pendente_liquidar)}</strong>
              </div>
            </div>
          )}

          {/* ── SIOPS ── */}
          {aba === "siops" && (
            <div>
              {/* Gauge principal */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{
                  background: data.siops.conforme ? "#f0fdf4" : "#fff7f7",
                  border: `2px solid ${data.siops.conforme ? "#bbf7d0" : "#fca5a5"}`,
                  borderRadius: 12, padding: "20px 24px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 48, fontWeight: 900, color: data.siops.conforme ? "#16a34a" : "#dc2626" }}>
                    {data.siops.pct_proprio_saude}%
                  </div>
                  <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>Recursos próprios em saúde</div>
                  <div style={{ marginTop: 12 }}>
                    <span style={{
                      background: data.siops.conforme ? "#16a34a" : "#dc2626",
                      color: "#fff", fontWeight: 700, fontSize: 14,
                      padding: "4px 16px", borderRadius: 20,
                    }}>
                      {data.siops.conforme ? "✓ CONFORME" : "✗ NÃO CONFORME"}
                    </span>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 12, color: "#9ca3af" }}>
                    Meta mínima: {data.siops.meta_minima}% · Margem: +{data.siops.margem_seguranca}%
                  </div>
                </div>

                <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
                  <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>Histórico SIOPS</h3>
                  <div style={{ height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.siops.historico}>
                        <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                        <YAxis domain={[13, 20]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => [`${v}%`, "Rec. Próprios"]} contentStyle={TOOLTIPSTYLE} />
                        <ReferenceLine y={15} stroke="#dc2626" strokeDasharray="4 4" label={{ value: "15% mín", position: "right", fontSize: 10, fill: "#dc2626" }} />
                        <Line type="monotone" dataKey="pct" stroke="#16a34a" strokeWidth={2} dot={{ fill: "#16a34a", r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "12px 16px", fontSize: 13 }}>
                <strong>Base legal:</strong> LC 141/2012 — Municípios devem aplicar no mínimo 15% das receitas próprias em ações e serviços públicos de saúde. O não cumprimento implica sanções do Tribunal de Contas e bloqueio de transferências federais voluntárias.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
