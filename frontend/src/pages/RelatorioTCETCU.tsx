// src/pages/RelatorioTCETCU.tsx — Relatório TCE/TCU Estruturado com Assinatura Digital
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  FileText, Download, Shield, CheckCircle, Clock, AlertTriangle,
  ChevronDown, ChevronRight, RefreshCw, Pen, Eye, Lock,
  BarChart2, DollarSign, Users, Activity,
} from "lucide-react";
import { apiGet, apiPost } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Relatorio {
  id: number; tipo: "TCE" | "TCU"; titulo: string; competencia: string;
  data_geracao: string; status: "rascunho" | "gerado" | "assinado" | "enviado" | "aprovado";
  assinado_por: string | null; assinado_em: string | null; hash_sha256: string | null;
  tamanho_kb: number; paginas: number; secoes: SecaoRelatorio[];
}

interface SecaoRelatorio {
  codigo: string; titulo: string; pagina_inicio: number; concluida: boolean;
  pendencias: string[];
}

interface ResumoFinanceiro {
  competencia: string;
  receitas: { categoria: string; valor: number }[];
  despesas: { categoria: string; valor: number }[];
  total_receitas: number; total_despesas: number; saldo: number; pct_execucao: number;
  transferencias_fundo: { bloco: string; recebido: number; aplicado: number; saldo: number }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ST_COR: Record<string, string> = {
  rascunho: "#9ca3af", gerado: "#1351b4", assinado: "#16a34a",
  enviado: "#7c3aed", aprovado: "#059669",
};
const ST_LABEL: Record<string, string> = {
  rascunho: "Rascunho", gerado: "Gerado", assinado: "Assinado",
  enviado: "Enviado", aprovado: "Aprovado",
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ── Card Relatório ────────────────────────────────────────────────────────────

function CardRelatorio({ rel, onAssinar, onGerarPDF }: {
  rel: Relatorio;
  onAssinar: (id: number) => void;
  onGerarPDF: (id: number) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const cor = ST_COR[rel.status];

  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}30`, borderLeft: `4px solid ${cor}`,
      borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
      <div onClick={() => setAberto(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 18px", cursor: "pointer" }}>
        <div style={{ background: `${cor}12`, borderRadius: 8, padding: 8, flexShrink: 0 }}>
          <FileText size={16} color={cor}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontWeight: 800, fontSize: 14 }}>{rel.titulo}</span>
            <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 20,
              background: `${cor}15`, color: cor, border: `1px solid ${cor}35` }}>
              {rel.tipo}
            </span>
            <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 20,
              background: `${cor}10`, color: cor }}>
              {ST_LABEL[rel.status]}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>
            Competência {rel.competencia} · Gerado {rel.data_geracao} · {rel.paginas} páginas · {rel.tamanho_kb}KB
            {rel.assinado_por && ` · Assinado por ${rel.assinado_por} em ${rel.assinado_em}`}
          </div>
          {rel.hash_sha256 && (
            <div style={{ fontSize: 9, color: "#9ca3af", fontFamily: "monospace", marginTop: 2 }}>
              SHA-256: {rel.hash_sha256.slice(0, 32)}…
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          {rel.status === "gerado" && (
            <button onClick={e => { e.stopPropagation(); onAssinar(rel.id); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                fontSize: 11, borderRadius: 8, border: "1px solid #16a34a",
                background: "#f0fdf4", color: "#16a34a", cursor: "pointer", fontWeight: 700 }}>
              <Pen size={11}/> Assinar
            </button>
          )}
          <button onClick={e => { e.stopPropagation(); onGerarPDF(rel.id); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
              fontSize: 11, borderRadius: 8, border: "1px solid #d1d5db",
              background: "#fff", color: "#374151", cursor: "pointer" }}>
            <Download size={11}/> PDF
          </button>
          {aberto ? <ChevronDown size={14} color="#9ca3af"/> : <ChevronRight size={14} color="#9ca3af"/>}
        </div>
      </div>

      {aberto && (
        <div style={{ borderTop: `1px solid ${cor}15`, padding: "14px 18px", background: "#fafafa" }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Seções do Relatório</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {rel.secoes.map(s => (
              <div key={s.codigo} style={{ display: "flex", alignItems: "flex-start", gap: 10,
                background: "#fff", border: `1px solid ${s.concluida ? "#dcfce7" : "#fef3c7"}`,
                borderRadius: 8, padding: "9px 12px" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%",
                  background: s.concluida ? "#16a34a" : "#d97706",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {s.concluida
                    ? <CheckCircle size={11} color="#fff"/>
                    : <Clock size={11} color="#fff"/>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 2 }}>
                    {s.codigo} — {s.titulo}
                    <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 400, marginLeft: 8 }}>p. {s.pagina_inicio}</span>
                  </div>
                  {s.pendencias.length > 0 && (
                    <div style={{ fontSize: 10, color: "#d97706" }}>
                      ⚠ {s.pendencias.join("; ")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Principal ─────────────────────────────────────────────────────────────────

export default function RelatorioTCETCU() {
  const [abaAtiva, setAbaAtiva] = useState<"relatorios"|"financeiro"|"assinatura">("relatorios");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [competencia, setCompetencia] = useState("2026");

  const { data: relatorios = [], isLoading, refetch } = useQuery<Relatorio[]>({
    queryKey: ["tce-tcu-relatorios", filtroTipo],
    queryFn: () => apiGet("/api/tce-tcu/relatorios", { tipo: filtroTipo !== "todos" ? filtroTipo : undefined }) as Promise<Relatorio[]>,
    staleTime: 120_000,
  });

  const { data: resumoFin } = useQuery<ResumoFinanceiro>({
    queryKey: ["tce-tcu-financeiro", competencia],
    queryFn: () => apiGet("/api/tce-tcu/resumo-financeiro", { ano: competencia }) as Promise<ResumoFinanceiro>,
    staleTime: 300_000,
  });

  const gerarRelatorio = useMutation({
    mutationFn: (tipo: "TCE" | "TCU") => apiPost("/api/tce-tcu/gerar", { tipo, competencia }),
    onSuccess: () => refetch(),
  });

  const assinar = useMutation({
    mutationFn: (id: number) => apiPost(`/api/tce-tcu/relatorios/${id}/assinar`),
    onSuccess: () => refetch(),
  });

  const gerarPDF = useMutation({
    mutationFn: (id: number) => apiPost(`/api/tce-tcu/relatorios/${id}/pdf`),
  });

  const rFin = resumoFin;

  if (!isLoading && !relatorios) return (
    <div style={{ padding: 24 }}>
      <NaoDisponivelBanner
        titulo="RelatorioTCETCU indisponivel"
        nota="Dados nao disponiveis — integracao pendente de configuracao no Railway."
      />
    </div>
  );

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1c1917 0%,#44403c 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}>
                <Shield size={18} color="#fff"/>
              </div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Relatórios TCE / TCU</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Prestação de contas · Assinatura digital ICP-Brasil · Hash SHA-256 · Exportação PDF/XML
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={competencia} onChange={e => setCompetencia(e.target.value)}
              style={{ border: "1px solid rgba(255,255,255,.3)", background: "rgba(255,255,255,.1)",
                color: "#fff", borderRadius: 8, padding: "7px 12px", fontSize: 12 }}>
              {["2024","2025","2026"].map(a => <option key={a} value={a} style={{ color: "#000" }}>{a}</option>)}
            </select>
            <button onClick={() => gerarRelatorio.mutate("TCE")} disabled={gerarRelatorio.isPending}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#78350f",
                color: "#fff", border: "1px solid #92400e", borderRadius: 8, padding: "8px 14px",
                cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
              <FileText size={12}/> Gerar TCE
            </button>
            <button onClick={() => gerarRelatorio.mutate("TCU")} disabled={gerarRelatorio.isPending}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.15)",
                color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 8, padding: "8px 14px",
                cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
              <FileText size={12}/> Gerar TCU
            </button>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e4e7ec", padding: "0 28px", display: "flex" }}>
        {[
          { id: "relatorios" as const, label: `Relatórios (${relatorios.length})` },
          { id: "financeiro" as const, label: "Resumo Financeiro" },
          { id: "assinatura" as const, label: "Assinatura Digital" },
        ].map(a => (
          <button key={a.id} onClick={() => setAbaAtiva(a.id)}
            style={{ padding: "12px 18px", fontSize: 13, fontWeight: abaAtiva===a.id ? 700 : 400,
              background: "none", border: "none", borderBottom: abaAtiva===a.id ? "2px solid #1c1917" : "2px solid transparent",
              color: abaAtiva===a.id ? "#1c1917" : "#6b7280", cursor: "pointer" }}>
            {a.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "20px 28px 60px" }}>

        {/* ── RELATÓRIOS ── */}
        {abaAtiva === "relatorios" && (
          <>
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10,
              padding: "12px 16px", marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
              {["todos","TCE","TCU"].map(f => (
                <button key={f} onClick={() => setFiltroTipo(f)}
                  style={{ padding: "5px 14px", fontSize: 11, borderRadius: 20,
                    border: `1px solid ${filtroTipo===f?"#1c1917":"#d1d5db"}`,
                    background: filtroTipo===f?"#1c191715":"#fff",
                    color: filtroTipo===f?"#1c1917":"#374151", cursor: "pointer", fontWeight: filtroTipo===f?700:400 }}>
                  {f === "todos" ? "Todos" : f}
                </button>
              ))}
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af" }}>{relatorios.length} relatórios</span>
            </div>
            {isLoading
              ? <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando relatórios...</div>
              : relatorios.map(r => (
                <CardRelatorio key={r.id} rel={r}
                  onAssinar={id => assinar.mutate(id)}
                  onGerarPDF={id => gerarPDF.mutate(id)}/>
              ))
            }
            {relatorios.length === 0 && !isLoading && (
              <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>
                <FileText size={32} color="#d1d5db" style={{ marginBottom: 8 }}/><br/>
                Nenhum relatório gerado. Use os botões acima para criar.
              </div>
            )}
          </>
        )}

        {/* ── FINANCEIRO ── */}
        {abaAtiva === "financeiro" && rFin && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Receitas */}
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: "#16a34a" }}>
                Receitas — {rFin.competencia}
              </div>
              {rFin.receitas.map(r => (
                <div key={r.categoria} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: 12, color: "#374151" }}>{r.categoria}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>{formatBRL(r.valor)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontWeight: 800 }}>
                <span style={{ fontSize: 13 }}>Total Receitas</span>
                <span style={{ fontSize: 13, color: "#16a34a" }}>{formatBRL(rFin.total_receitas)}</span>
              </div>
            </div>

            {/* Despesas */}
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: "#dc2626" }}>
                Despesas — {rFin.competencia}
              </div>
              {rFin.despesas.map(d => (
                <div key={d.categoria} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: 12, color: "#374151" }}>{d.categoria}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}>{formatBRL(d.valor)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontWeight: 800 }}>
                <span style={{ fontSize: 13 }}>Total Despesas</span>
                <span style={{ fontSize: 13, color: "#dc2626" }}>{formatBRL(rFin.total_despesas)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", marginTop: 6, background: rFin.saldo >= 0 ? "#f0fdf4" : "#fef2f2", borderRadius: 6, paddingLeft: 10, paddingRight: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 800 }}>Saldo</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: rFin.saldo >= 0 ? "#16a34a" : "#dc2626" }}>{formatBRL(rFin.saldo)}</span>
              </div>
            </div>

            {/* Transferências fundo a fundo */}
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px", gridColumn: "1 / -1" }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Transferências Fundo a Fundo — Execução por Bloco</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Bloco","Recebido","Aplicado","Saldo","Execução"].map(h => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: "left" as const, fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rFin.transferencias_fundo.map(t => {
                      const pct = t.recebido > 0 ? Math.round((t.aplicado / t.recebido) * 100) : 0;
                      const cor = pct >= 90 ? "#16a34a" : pct >= 70 ? "#d97706" : "#dc2626";
                      return (
                        <tr key={t.bloco} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "9px 12px", fontWeight: 600, color: "#374151" }}>{t.bloco}</td>
                          <td style={{ padding: "9px 12px", color: "#16a34a", fontWeight: 700 }}>{formatBRL(t.recebido)}</td>
                          <td style={{ padding: "9px 12px", color: "#1351b4", fontWeight: 700 }}>{formatBRL(t.aplicado)}</td>
                          <td style={{ padding: "9px 12px", color: t.saldo >= 0 ? "#16a34a" : "#dc2626", fontWeight: 700 }}>{formatBRL(t.saldo)}</td>
                          <td style={{ padding: "9px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ flex: 1, height: 6, background: "#e5e7eb", borderRadius: 3 }}>
                                <div style={{ width: `${Math.min(pct,100)}%`, height: "100%", background: cor, borderRadius: 3 }}/>
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 800, color: cor, minWidth: 36 }}>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── ASSINATURA ── */}
        {abaAtiva === "assinatura" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ background: "#16a34a15", borderRadius: 10, padding: 10 }}>
                  <Lock size={20} color="#16a34a"/>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>Assinatura Digital ICP-Brasil</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>Certificado A3 — Pessoa Física</div>
                </div>
              </div>
              {[
                { label: "Titular", val: "Euler Ramos — Secretário Municipal de Saúde" },
                { label: "Cargo", val: "Gestor do Fundo Municipal de Saúde" },
                { label: "CPF", val: "***.***.***-**" },
                { label: "Emissor", val: "AC DATAPREV RFB v4" },
                { label: "Validade cert.", val: "2027-03-15" },
                { label: "Política", val: "AD-RB — Assinatura com Referência Básica" },
                { label: "Algoritmo hash", val: "SHA-256" },
              ].map(i => (
                <div key={i.label} style={{ display: "flex", justifyContent: "space-between",
                  padding: "7px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{i.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>{i.val}</span>
                </div>
              ))}
              <div style={{ marginTop: 16, background: "#f0fdf4", border: "1px solid #bbf7d0",
                borderRadius: 8, padding: "12px 14px", fontSize: 12, color: "#166534" }}>
                ✓ Certificado válido e pronto para assinatura de documentos oficiais.
                Os arquivos assinados geram um hash SHA-256 único e imutável.
              </div>
            </div>

            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "24px" }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Processo de Assinatura</div>
              {[
                { num: 1, label: "Gerar relatório", desc: "Selecione o tipo (TCE ou TCU) e clique em Gerar", status: "ok" },
                { num: 2, label: "Revisar conteúdo", desc: "Verifique todas as seções e dados antes de assinar", status: "ok" },
                { num: 3, label: "Assinar digitalmente", desc: "Certificado ICP-Brasil A3 · Hash SHA-256 calculado", status: "pendente" },
                { num: 4, label: "Exportar PDF/XML", desc: "Formato aceito pelo TCE-AM e TCU", status: "aguardando" },
                { num: 5, label: "Enviar ao órgão", desc: "Protocolo com número de controle e recibo", status: "aguardando" },
              ].map(s => {
                const cor = s.status === "ok" ? "#16a34a" : s.status === "pendente" ? "#d97706" : "#9ca3af";
                return (
                  <div key={s.num} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      background: `${cor}15`, border: `2px solid ${cor}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 800, color: cor }}>
                      {s.status === "ok" ? "✓" : s.num}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>{s.desc}</div>
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 8, background: "#fffbeb", border: "1px solid #fde68a",
                borderRadius: 8, padding: "10px 12px", fontSize: 11, color: "#92400e" }}>
                ⚠ Prazo de envio ao TCE-AM: até o dia 30 após encerramento do exercício.
                Para o TCU (repasses federais): até 60 dias após o término da vigência.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
