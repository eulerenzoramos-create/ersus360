// Módulo 10 — Relatórios e Prestação de Contas
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRelatorios } from "../lib/api";
import { BarChart3, Download, FileText, TrendingUp, PieChart, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend } from "recharts";

const S = {
  page:  { padding: 20 } as React.CSSProperties,
  card:  { background: "#fff", borderRadius: 8, border: "1px solid #e5e5e3", padding: 16, marginBottom: 14 } as React.CSSProperties,
  btn:   { padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 5 } as React.CSSProperties,
  title: { fontSize: 14, fontWeight: 600, marginBottom: 12 } as React.CSSProperties,
  tab:   (a: boolean) => ({ padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, background: a ? "#1D9E75" : "#f5f5f3", color: a ? "#fff" : "#404040" }) as React.CSSProperties,
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v: number) => `${v.toFixed(1)}%`;

const CORES = ["#1D9E75", "#2563eb", "#d97706", "#dc2626", "#7c3aed", "#0284c7"];

function KpiBox({ label, valor, sub, cor = "#1D9E75" }: { label: string; valor: string; sub?: string; cor?: string }) {
  return (
    <div style={{ background: `${cor}08`, borderRadius: 8, padding: "12px 16px", border: `1px solid ${cor}20` }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: cor }}>{valor}</div>
      <div style={{ fontSize: 12, color: "#737373", marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function TabelaConvenios({ itens }: { itens: Array<Record<string, unknown>> }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "#f5f5f3" }}>
            {["Convênio", "Bloco", "Recebido", "Pago", "Saldo", "% Exec."].map((h) => (
              <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "#404040", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {itens.map((item, i) => {
            const perc = item.perc_executado as number;
            const cor = perc >= 75 ? "#059669" : perc >= 50 ? "#d97706" : "#dc2626";
            return (
              <tr key={i} style={{ borderBottom: "1px solid #f0f0ee" }}>
                <td style={{ padding: "8px 10px", fontWeight: 500 }}>{item.convenio as string}</td>
                <td style={{ padding: "8px 10px", color: "#737373" }}>{item.bloco as string}</td>
                <td style={{ padding: "8px 10px" }}>{fmt(item.valor_recebido as number)}</td>
                <td style={{ padding: "8px 10px" }}>{fmt(item.valor_pago as number)}</td>
                <td style={{ padding: "8px 10px", color: "#059669", fontWeight: 500 }}>{fmt(item.saldo as number)}</td>
                <td style={{ padding: "8px 10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 60, height: 5, background: "#e5e5e3", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(perc, 100)}%`, height: "100%", background: cor, borderRadius: 3 }} />
                    </div>
                    <span style={{ color: cor, fontWeight: 600 }}>{fmtPct(perc)}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Relatorios() {
  const [aba, setAba] = useState<"financeiro" | "bloco" | "programa" | "prestacao">("financeiro");
  const [ano, setAno] = useState(2026);

  const { data: financeiro, isLoading: loadFin } = useQuery({
    queryKey: ["relatorio-financeiro", ano],
    queryFn: () => apiRelatorios.financeiro(ano),
    enabled: aba === "financeiro",
  });

  const { data: porBloco = [] } = useQuery({
    queryKey: ["relatorio-bloco", ano],
    queryFn: () => apiRelatorios.porBloco(ano),
    enabled: aba === "bloco",
  });

  const { data: porPrograma = [] } = useQuery({
    queryKey: ["relatorio-programa", ano],
    queryFn: () => apiRelatorios.porPrograma(ano),
    enabled: aba === "programa",
  });

  const { data: prestacao, isLoading: loadPC } = useQuery({
    queryKey: ["prestacao-contas", ano],
    queryFn: () => apiRelatorios.prestacaoContas(ano),
    enabled: aba === "prestacao",
  });

  const exportarJSON = (dados: unknown, nome: string) => {
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${nome}_${ano}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div style={S.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>
          <BarChart3 size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
          Relatórios e Prestação de Contas
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
            style={{ border: "1px solid #e5e5e3", borderRadius: 6, padding: "6px 10px", fontSize: 13 }}
          >
            {[2026, 2025, 2024, 2023].map((y) => <option key={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button style={S.tab(aba === "financeiro")}  onClick={() => setAba("financeiro")}>
          <FileText size={13} style={{ marginRight: 4 }} />Financeiro
        </button>
        <button style={S.tab(aba === "bloco")}       onClick={() => setAba("bloco")}>
          <PieChart size={13} style={{ marginRight: 4 }} />Por Bloco
        </button>
        <button style={S.tab(aba === "programa")}    onClick={() => setAba("programa")}>
          <TrendingUp size={13} style={{ marginRight: 4 }} />Por Programa
        </button>
        <button style={S.tab(aba === "prestacao")}   onClick={() => setAba("prestacao")}>
          <Calendar size={13} style={{ marginRight: 4 }} />Prestação de Contas
        </button>
      </div>

      {/* ── ABA FINANCEIRO ────────────────────────────────────────────────────── */}
      {aba === "financeiro" && (
        <>
          {loadFin ? (
            <div style={{ textAlign: "center", padding: 40, color: "#737373" }}>Calculando…</div>
          ) : financeiro && (
            <>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                <button
                  onClick={() => exportarJSON(financeiro, "relatorio-financeiro")}
                  style={{ ...S.btn, background: "#eff6ff", color: "#1d4ed8" }}
                >
                  <Download size={13} /> Exportar JSON
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 14 }}>
                <KpiBox label="Total Recebido" valor={fmt(financeiro.total_recebido)} cor="#059669" />
                <KpiBox label="Total Pago" valor={fmt(financeiro.total_pago)} cor="#1d4ed8" />
                <KpiBox label="Saldo Disponível" valor={fmt(financeiro.total_saldo)} cor="#d97706" />
                <KpiBox label="Rendimentos" valor={fmt(financeiro.total_rendimento)} cor="#7c3aed"
                  sub="aplicações financeiras" />
              </div>
              <div style={S.card}>
                <div style={S.title}>Convênios — Exercício {ano}</div>
                {financeiro.itens?.length > 0
                  ? <TabelaConvenios itens={financeiro.itens} />
                  : <div style={{ textAlign: "center", padding: 20, color: "#737373" }}>Nenhum dado para o período.</div>
                }
              </div>
            </>
          )}
        </>
      )}

      {/* ── ABA POR BLOCO ─────────────────────────────────────────────────────── */}
      {aba === "bloco" && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={S.title}>Repasses por Bloco de Financiamento — {ano}</div>
            <button onClick={() => exportarJSON(porBloco, "relatorio-bloco")} style={{ ...S.btn, background: "#eff6ff", color: "#1d4ed8", fontSize: 12 }}>
              <Download size={12} /> Exportar
            </button>
          </div>
          {(porBloco as Array<{ bloco: string; total: number }>).length === 0
            ? <div style={{ textAlign: "center", padding: 30, color: "#737373" }}>Sem dados para o período.</div>
            : (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={porBloco as Array<{ bloco: string; total: number }>} margin={{ left: 10 }}>
                    <XAxis dataKey="bloco" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Bar dataKey="total" fill="#1D9E75" radius={[4, 4, 0, 0]} name="Total" />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 12 }}>
                  {(porBloco as Array<{ bloco: string; total: number }>).map(({ bloco, total }, i) => (
                    <div key={bloco} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0f0ee", fontSize: 13 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: CORES[i % CORES.length], display: "inline-block" }} />
                        {bloco}
                      </span>
                      <strong>{fmt(total)}</strong>
                    </div>
                  ))}
                </div>
              </>
            )
          }
        </div>
      )}

      {/* ── ABA POR PROGRAMA ──────────────────────────────────────────────────── */}
      {aba === "programa" && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={S.title}>Repasses por Programa — {ano}</div>
            <button onClick={() => exportarJSON(porPrograma, "relatorio-programa")} style={{ ...S.btn, background: "#eff6ff", color: "#1d4ed8", fontSize: 12 }}>
              <Download size={12} /> Exportar
            </button>
          </div>
          {(porPrograma as Array<{ programa: string; total: number }>).length === 0
            ? <div style={{ textAlign: "center", padding: 30, color: "#737373" }}>Sem dados para o período.</div>
            : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <RechartsPie>
                    <Pie
                      data={porPrograma as Array<{ programa: string; total: number }>}
                      dataKey="total"
                      nameKey="programa"
                      cx="50%" cy="50%"
                      outerRadius={80}
                      label={({ programa, percent }: { programa: string; percent: number }) =>
                        `${programa?.slice(0, 12)}… ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {(porPrograma as Array<{ programa: string; total: number }>).map((_: unknown, i: number) => (
                        <Cell key={i} fill={CORES[i % CORES.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} />
                  </RechartsPie>
                </ResponsiveContainer>
                <div>
                  {(porPrograma as Array<{ programa: string; total: number }>).map(({ programa, total }, i) => (
                    <div key={programa} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0f0ee", fontSize: 13 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: CORES[i % CORES.length], display: "inline-block" }} />
                        {programa}
                      </span>
                      <strong>{fmt(total)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )
          }
        </div>
      )}

      {/* ── ABA PRESTAÇÃO DE CONTAS ───────────────────────────────────────────── */}
      {aba === "prestacao" && (
        <>
          {loadPC ? (
            <div style={{ textAlign: "center", padding: 40, color: "#737373" }}>Gerando relatório…</div>
          ) : prestacao && (
            <>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                <button
                  onClick={() => exportarJSON(prestacao, "prestacao-contas")}
                  style={{ ...S.btn, background: "#059669", color: "#fff" }}
                >
                  <Download size={13} /> Exportar para TCE/TCM
                </button>
              </div>

              <div style={{ ...S.card, background: "#f0fdf4", borderColor: "#86efac" }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{(prestacao as Record<string, string>).titulo}</div>
                <div style={{ fontSize: 12, color: "#737373" }}>
                  {(prestacao as Record<string, string>).municipio}/{(prestacao as Record<string, string>).uf} — Gerado em: {(prestacao as Record<string, string>).gerado_em}
                </div>
              </div>

              {/* Resumo financeiro */}
              <div style={S.card}>
                <div style={S.title}>Resumo Financeiro</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                  {Object.entries((prestacao as Record<string, Record<string, number>>).resumo_financeiro ?? {}).map(([k, v]) => (
                    <KpiBox
                      key={k}
                      label={k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      valor={fmt(v)}
                      cor={k.includes("saldo") ? "#d97706" : "#1D9E75"}
                    />
                  ))}
                </div>
              </div>

              {/* Por Bloco */}
              {(prestacao as Record<string, Array<{ bloco: string; total: number }>>).por_bloco?.length > 0 && (
                <div style={S.card}>
                  <div style={S.title}>Execução por Bloco de Financiamento</div>
                  {(prestacao as Record<string, Array<{ bloco: string; total: number }>>).por_bloco.map(({ bloco, total }) => (
                    <div key={bloco} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0f0ee", fontSize: 13 }}>
                      <span>{bloco}</span>
                      <strong>{fmt(total)}</strong>
                    </div>
                  ))}
                </div>
              )}

              {/* Convênios */}
              {(prestacao as Record<string, Array<Record<string, unknown>>>).convenios?.length > 0 && (
                <div style={S.card}>
                  <div style={S.title}>Demonstrativo por Convênio</div>
                  <TabelaConvenios itens={(prestacao as Record<string, Array<Record<string, unknown>>>).convenios} />
                </div>
              )}

              {/* Indicadores */}
              {(prestacao as Record<string, Array<Record<string, unknown>>>).indicadores?.length > 0 && (
                <div style={S.card}>
                  <div style={S.title}>Indicadores de Saúde</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "#f5f5f3" }}>
                        <th style={{ padding: "7px 10px", textAlign: "left" }}>Indicador</th>
                        <th style={{ padding: "7px 10px", textAlign: "left" }}>Eixo</th>
                        <th style={{ padding: "7px 10px" }}>Meta</th>
                        <th style={{ padding: "7px 10px" }}>Alcançado</th>
                        <th style={{ padding: "7px 10px" }}>Situação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(prestacao as Record<string, Array<Record<string, unknown>>>).indicadores.map((ind, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f0f0ee" }}>
                          <td style={{ padding: "7px 10px" }}>{ind.indicador as string}</td>
                          <td style={{ padding: "7px 10px", color: "#737373" }}>{ind.eixo as string}</td>
                          <td style={{ padding: "7px 10px", textAlign: "center" }}>{ind.meta as number}</td>
                          <td style={{ padding: "7px 10px", textAlign: "center" }}>{ind.alcancado as number}</td>
                          <td style={{ padding: "7px 10px", textAlign: "center" }}>
                            <span style={{
                              background: (ind.situacao as string)?.includes("Atingido") ? "#f0fdf4" : "#fff0f0",
                              color: (ind.situacao as string)?.includes("Atingido") ? "#059669" : "#dc2626",
                              borderRadius: 4, padding: "2px 7px", fontSize: 11,
                            }}>
                              {ind.situacao as string}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
