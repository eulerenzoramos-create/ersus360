// Módulo 5 — Planejamento Municipal de Saúde (PMS/PAS/RAG)
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { ClipboardList, Download, CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react";

const S = {
  page:  { padding: 20 } as React.CSSProperties,
  card:  { background: "#fff", borderRadius: 8, border: "1px solid #e5e5e3", padding: 16, marginBottom: 14 } as React.CSSProperties,
  title: { fontSize: 14, fontWeight: 600, marginBottom: 12 } as React.CSSProperties,
  tab:   (a: boolean) => ({ padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, background: a ? "#1D9E75" : "#f5f5f3", color: a ? "#fff" : "#404040" }) as React.CSSProperties,
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface AcaoPAS {
  id: number; codigo: string; descricao: string; eixo: string;
  meta_fisica: number; meta_financeira_prevista: number; meta_financeira_realizada: number;
  execucao_fisica: number; situacao: string; responsavel: string;
}
interface Dashboard {
  acoes_total: number; acoes_concluidas: number; acoes_em_andamento: number;
  acoes_atrasadas: number; execucao_financeira_geral: number; execucao_fisica_geral: number;
}

const SIT_CONFIG: Record<string, { cor: string; bg: string; icon: React.ReactNode }> = {
  "Em Execução":   { cor: "#2563eb", bg: "#eff6ff", icon: <Clock size={12} /> },
  "Em Andamento":  { cor: "#2563eb", bg: "#eff6ff", icon: <Clock size={12} /> },
  "Concluído":     { cor: "#059669", bg: "#f0fdf4", icon: <CheckCircle2 size={12} /> },
  "Crítico":       { cor: "#dc2626", bg: "#fff0f0", icon: <AlertTriangle size={12} /> },
  "Em Licitação":  { cor: "#d97706", bg: "#fffbeb", icon: <XCircle size={12} /> },
};

export default function Planejamento() {
  const [aba, setAba] = useState<"pas" | "rag" | "digisus">("pas");
  const [eixoFiltro, setEixoFiltro] = useState("");

  const { data: dashboard } = useQuery<Dashboard>({
    queryKey: ["planejamento-dashboard"],
    queryFn: () => api.get("/api/planejamento/dashboard").then((r) => r.data),
  });
  const { data: acoes = [] } = useQuery<AcaoPAS[]>({
    queryKey: ["pas-acoes", eixoFiltro],
    queryFn: () => api.get("/api/planejamento/pas/acoes", { params: eixoFiltro ? { eixo: eixoFiltro } : {} }).then((r) => r.data),
    enabled: aba === "pas",
  });
  const { data: rag } = useQuery({
    queryKey: ["rag"],
    queryFn: () => api.get("/api/planejamento/rag/gerar").then((r) => r.data),
    enabled: aba === "rag",
  });
  const { data: digisus } = useQuery({
    queryKey: ["digisus"],
    queryFn: () => api.get("/api/planejamento/digisus/exportar").then((r) => r.data),
    enabled: aba === "digisus",
  });

  const eixos = [...new Set((acoes as AcaoPAS[]).map((a) => a.eixo))];

  const exportarJSON = (dados: unknown, nome: string) => {
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${nome}.json`;
    a.click();
  };

  return (
    <div style={S.page}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <ClipboardList size={16} /> Planejamento Municipal de Saúde
      </div>

      {/* KPIs */}
      {dashboard && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Ações Totais",      valor: dashboard.acoes_total,       cor: "#1D9E75" },
            { label: "Em Andamento",      valor: dashboard.acoes_em_andamento, cor: "#2563eb" },
            { label: "Concluídas",        valor: dashboard.acoes_concluidas,  cor: "#059669" },
            { label: "Com Atraso",        valor: dashboard.acoes_atrasadas,   cor: "#dc2626" },
          ].map(({ label, valor, cor }) => (
            <div key={label} style={{ ...S.card, textAlign: "center", padding: 12, margin: 0 }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: cor }}>{valor}</div>
              <div style={{ fontSize: 12, color: "#737373" }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Execução geral */}
      {dashboard && (
        <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          {[
            { label: "Execução Financeira Geral", perc: dashboard.execucao_financeira_geral },
            { label: "Execução Física Geral",     perc: dashboard.execucao_fisica_geral },
          ].map(({ label, perc }) => {
            const cor = perc >= 75 ? "#059669" : perc >= 50 ? "#d97706" : "#dc2626";
            return (
              <div key={label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13 }}>{label}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: cor }}>{perc.toFixed(1)}%</span>
                </div>
                <div style={{ height: 8, background: "#e5e5e3", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(perc, 100)}%`, height: "100%", background: cor, borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Abas */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button style={S.tab(aba === "pas")}     onClick={() => setAba("pas")}>PAS — Ações</button>
        <button style={S.tab(aba === "rag")}     onClick={() => setAba("rag")}>RAG Automático</button>
        <button style={S.tab(aba === "digisus")} onClick={() => setAba("digisus")}>DIGISUS</button>
      </div>

      {/* ABA PAS */}
      {aba === "pas" && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={S.title}>Programação Anual de Saúde — Ações 2026</div>
            <select
              value={eixoFiltro}
              onChange={(e) => setEixoFiltro(e.target.value)}
              style={{ border: "1px solid #e5e5e3", borderRadius: 6, padding: "6px 10px", fontSize: 12 }}
            >
              <option value="">Todos os eixos</option>
              {eixos.map((e) => <option key={e}>{e}</option>)}
            </select>
          </div>
          {(acoes as AcaoPAS[]).map((acao) => {
            const cfg = SIT_CONFIG[acao.situacao] ?? SIT_CONFIG["Em Andamento"];
            const perc = acao.meta_financeira_prevista > 0
              ? (acao.meta_financeira_realizada / acao.meta_financeira_prevista) * 100
              : 0;
            const cor = perc >= 75 ? "#059669" : perc >= 50 ? "#d97706" : "#dc2626";
            return (
              <div key={acao.id} style={{ padding: "12px 0", borderBottom: "1px solid #f0f0ee" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontFamily: "monospace", fontSize: 11, background: "#f5f5f3", borderRadius: 3, padding: "1px 5px", color: "#737373" }}>
                        {acao.codigo}
                      </span>
                      <span style={{ background: cfg.bg, color: cfg.cor, borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                        {cfg.icon} {acao.situacao}
                      </span>
                      <span style={{ fontSize: 11, color: "#737373", background: "#f5f5f3", borderRadius: 3, padding: "1px 6px" }}>
                        {acao.eixo}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, marginBottom: 2 }}>{acao.descricao}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>Responsável: {acao.responsavel}</div>
                  </div>
                  <div style={{ textAlign: "right", marginLeft: 16, flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: cor }}>{perc.toFixed(0)}%</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>exec. fin.</div>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 5, background: "#e5e5e3", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(perc, 100)}%`, height: "100%", background: cor, borderRadius: 3 }} />
                  </div>
                  {acao.meta_financeira_prevista > 0 && (
                    <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#737373", marginTop: 4 }}>
                      <span>Previsto: {fmt(acao.meta_financeira_prevista)}</span>
                      <span>Realizado: {fmt(acao.meta_financeira_realizada)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ABA RAG */}
      {aba === "rag" && rag && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
            <button onClick={() => exportarJSON(rag, "RAG_2026")} style={{ padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, background: "#1D9E75", color: "#fff", display: "flex", alignItems: "center", gap: 5 }}>
              <Download size={13} /> Exportar RAG
            </button>
          </div>
          <div style={{ ...S.card, background: "#f0fdf4", borderColor: "#86efac" }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Relatório Anual de Gestão — {(rag as Record<string, unknown>).ano_referencia as string}</div>
            <div style={{ fontSize: 12, color: "#737373", marginTop: 3 }}>
              {(rag as Record<string, unknown>).municipio as string} · Status: {(rag as Record<string, unknown>).status as string} · Gerado em {new Date((rag as Record<string, unknown>).gerado_em as string).toLocaleDateString("pt-BR")}
            </div>
          </div>
          {((rag as any).secoes ?? []).map((secao: any) => (
            <div key={secao.titulo} style={S.card}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1D9E75", marginBottom: 8 }}>{secao.titulo}</div>
              <p style={{ fontSize: 13, color: "#404040", lineHeight: 1.6, marginBottom: secao.indicadores.length > 0 ? 10 : 0 }}>
                {secao.conteudo}
              </p>
              {secao.indicadores.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {secao.indicadores.map((ind) => (
                    <div key={ind.nome} style={{ background: "#f0fdf4", borderRadius: 6, padding: "6px 12px", fontSize: 12 }}>
                      <strong>{ind.nome}:</strong> {ind.unidade === "R$" ? fmt(ind.valor) : `${ind.valor} ${ind.unidade}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {((rag as any).proximos_passos ?? []).length > 0 && (
            <div style={S.card}>
              <div style={{ ...S.title, color: "#d97706" }}>Próximos Passos Recomendados</div>
              {((rag as any).proximos_passos as string[]).map((passo, i) => (
                <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid #f0f0ee", fontSize: 13 }}>
                  <span style={{ color: "#1D9E75", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                  {passo}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA DIGISUS */}
      {aba === "digisus" && digisus && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={S.title}>Exportação DIGISUS Gestor</div>
            <button onClick={() => exportarJSON(digisus, "DIGISUS_2026")} style={{ padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, background: "#1D9E75", color: "#fff", display: "flex", alignItems: "center", gap: 5 }}>
              <Download size={13} /> Baixar JSON DIGISUS
            </button>
          </div>
          <div style={{ ...S.card, background: "#fffbeb", borderColor: "#fde68a", margin: 0, marginBottom: 12 }}>
            <AlertTriangle size={14} style={{ color: "#d97706", verticalAlign: "middle", marginRight: 6 }} />
            <span style={{ fontSize: 12, color: "#92400e" }}>
              {(digisus as Record<string, string>).observacao}
            </span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <tbody>
              {[
                ["Versão DIGISUS", (digisus as Record<string, string>).versao_digisus],
                ["Município IBGE",  (digisus as Record<string, string>).municipio_ibge],
                ["Ano de Referência", (digisus as Record<string, string>).ano_referencia],
                ["Competência de Envio", (digisus as Record<string, string>).competencia_envio],
                ["Ações Programadas", String((digisus as Record<string, number>).acoes_programadas)],
                ["Ações Realizadas",  String((digisus as Record<string, number>).acoes_realizadas)],
                ["Execução (%)", `${(digisus as Record<string, number>).execucao_percentual}%`],
                ["Status", (digisus as Record<string, string>).status_exportacao],
              ].map(([label, valor]) => (
                <tr key={label} style={{ borderBottom: "1px solid #f0f0ee" }}>
                  <td style={{ padding: "8px 10px", color: "#737373", width: "40%" }}>{label}</td>
                  <td style={{ padding: "8px 10px", fontWeight: 500 }}>{valor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
