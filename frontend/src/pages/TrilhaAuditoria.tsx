// src/pages/TrilhaAuditoria.tsx — Trilha de Auditoria Imutável (Audit Trail)
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GitBranch, Search, Filter, Download, Shield, User, Clock, Eye, AlertTriangle, CheckCircle, Database } from "lucide-react";
import { apiGet } from "../lib/api";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface EventoAuditoria {
  id: number; timestamp: string; usuario: string; perfil: string;
  acao: string; modulo: string; sistema: string;
  entidade: string; entidade_id: string;
  campo_alterado: string | null; valor_anterior: string | null; valor_novo: string | null;
  ip: string; hash: string; severidade: "info" | "aviso" | "critico";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ACAO_COR: Record<string, string> = {
  CREATE: "#16a34a", UPDATE: "#d97706", DELETE: "#dc2626",
  LOGIN: "#1351b4", LOGOUT: "#6b7280", VIEW: "#9ca3af",
  EXPORT: "#7c3aed", SYNC: "#0891b2", AUDIT: "#059669",
};
const SEV_COR: Record<string, string> = { info: "#1351b4", aviso: "#d97706", critico: "#dc2626" };

function HashBadge({ hash }: { hash: string }) {
  return (
    <span style={{ fontFamily: "monospace", fontSize: 9, background: "#f1f5f9", color: "#475569", padding: "2px 6px", borderRadius: 4, border: "1px solid #e2e8f0" }}>
      #{hash.slice(0, 8)}
    </span>
  );
}

// ── Componente Principal ──────────────────────────────────────────────────────

export default function TrilhaAuditoria() {
  const [busca, setBusca] = useState("");
  const [filtroAcao, setFiltroAcao] = useState("Todas");
  const [filtroSistema, setFiltroSistema] = useState("Todos");
  const [filtroSev, setFiltroSev] = useState("Todas");
  const [pagina, setPagina] = useState(0);
  const [expandido, setExpandido] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["trilha-auditoria", pagina, filtroAcao, filtroSistema, filtroSev],
    queryFn: () => apiGet("/api/auditoria/trilha", {
      pagina,
      acao: filtroAcao !== "Todas" ? filtroAcao : undefined,
      sistema: filtroSistema !== "Todos" ? filtroSistema : undefined,
      severidade: filtroSev !== "Todas" ? filtroSev : undefined,
    }) as Promise<{ eventos: EventoAuditoria[]; total: number; paginas: number }>,
    staleTime: 30_000,
  });

  const eventos = (data?.eventos ?? []).filter(e =>
    !busca || e.usuario.toLowerCase().includes(busca.toLowerCase()) ||
    e.modulo.toLowerCase().includes(busca.toLowerCase()) ||
    e.acao.toLowerCase().includes(busca.toLowerCase()) ||
    e.entidade.toLowerCase().includes(busca.toLowerCase())
  );

  const resumo = {
    total: data?.total ?? 0,
    criticos: (data?.eventos ?? []).filter(e => e.severidade === "critico").length,
    avisos: (data?.eventos ?? []).filter(e => e.severidade === "aviso").length,
    usuarios_ativos: [...new Set((data?.eventos ?? []).map(e => e.usuario))].length,
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0d1b2a 0%,#1351b4 100%)", padding: "18px 28px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}>
                <GitBranch size={18} color="#fff" />
              </div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Trilha de Auditoria</span>
              <span style={{ background: "#dc262620", color: "#fca5a5", borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700, border: "1px solid #dc262640" }}>
                🔒 Imutável
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#bfdbfe" }}>
              Log completo de todas as ações do sistema · Conforme LGPD · {resumo.total.toLocaleString("pt-BR")} eventos registrados
            </div>
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            <Download size={13} /> Exportar CSV
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
          {[
            { label: "Total Eventos", val: resumo.total.toLocaleString("pt-BR"), cor: "#bfdbfe" },
            { label: "Críticos", val: resumo.criticos, cor: "#fca5a5" },
            { label: "Avisos", val: resumo.avisos, cor: "#fde68a" },
            { label: "Usuários Ativos", val: resumo.usuarios_ativos, cor: "#86efac" },
          ].map(k => (
            <div key={k.label} style={{ background: "rgba(255,255,255,.1)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: k.cor }}>{k.val}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)" }}>{k.label}</div>
            </div>
          ))}
          <div style={{ background: "rgba(255,255,255,.08)", borderRadius: 8, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "rgba(255,255,255,.5)" }}>
            <Shield size={12} color="#86efac" />
            <span>Cada evento possui hash criptográfico de integridade (SHA-256)</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 28px 60px" }}>

        {/* Filtros */}
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "12px 16px", marginBottom: 18, display: "flex", gap: 12, flexWrap: "wrap" as const, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: "7px 12px", flex: 1, minWidth: 180 }}>
            <Search size={12} color="#9ca3af" />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar usuário, módulo, ação..."
              style={{ border: "none", outline: "none", fontSize: 12, flex: 1, background: "transparent" }} />
          </div>
          <select value={filtroAcao} onChange={e => setFiltroAcao(e.target.value)}
            style={{ border: "1px solid #d1d5db", borderRadius: 7, padding: "7px 10px", fontSize: 12 }}>
            {["Todas","CREATE","UPDATE","DELETE","LOGIN","LOGOUT","VIEW","EXPORT","SYNC","AUDIT"].map(a => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <select value={filtroSistema} onChange={e => setFiltroSistema(e.target.value)}
            style={{ border: "1px solid #d1d5db", borderRadius: 7, padding: "7px 10px", fontSize: 12 }}>
            {["Todos","SCNES","eSUS PEC","SIAPS","e-Gestor","RNDS","CADSUS","Sistema"].map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select value={filtroSev} onChange={e => setFiltroSev(e.target.value)}
            style={{ border: "1px solid #d1d5db", borderRadius: 7, padding: "7px 10px", fontSize: 12 }}>
            {["Todas","critico","aviso","info"].map(s => (
              <option key={s} value={s}>{s === "Todas" ? "Todas Severidades" : s.charAt(0).toUpperCase()+s.slice(1)}</option>
            ))}
          </select>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>{eventos.length} eventos</span>
        </div>

        {/* Tabela */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando trilha de auditoria...</div>
        ) : (data as any)?.situacao_dado === "nao_disponivel" ? (
          <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0d2137", marginBottom: 8 }}>Trilha de Auditoria Indisponível</div>
            <div style={{ fontSize: 13, color: "#64748b", maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
              {(data as any).nota || "A trilha requer integração com sistema de logs operacionais. Nenhum evento simulado."}
            </div>
          </div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Timestamp","Usuário","Ação","Módulo","Sistema","Entidade","Severidade","Hash",""].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#6b7280", borderBottom: "2px solid #e4e7ec", whiteSpace: "nowrap" as const }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {eventos.map(e => {
                    const corAcao = ACAO_COR[e.acao] || "#6b7280";
                    const corSev = SEV_COR[e.severidade];
                    const aberto = expandido === e.id;
                    return (
                      <>
                        <tr key={e.id} style={{ borderBottom: "1px solid #f3f4f6", background: aberto ? "#f8faff" : undefined }}>
                          <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 10, color: "#6b7280", whiteSpace: "nowrap" as const }}>
                            {e.timestamp}
                          </td>
                          <td style={{ padding: "9px 12px" }}>
                            <div style={{ fontWeight: 600, fontSize: 12 }}>{e.usuario}</div>
                            <div style={{ fontSize: 10, color: "#9ca3af" }}>{e.perfil}</div>
                          </td>
                          <td style={{ padding: "9px 12px" }}>
                            <span style={{ background: `${corAcao}15`, color: corAcao, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5 }}>
                              {e.acao}
                            </span>
                          </td>
                          <td style={{ padding: "9px 12px", fontSize: 11, color: "#374151" }}>{e.modulo}</td>
                          <td style={{ padding: "9px 12px" }}>
                            <span style={{ background: "#eff6ff", color: "#1d4ed8", fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 20 }}>{e.sistema}</span>
                          </td>
                          <td style={{ padding: "9px 12px", fontSize: 11, color: "#6b7280" }}>
                            {e.entidade} {e.entidade_id && <span style={{ color: "#9ca3af" }}>#{e.entidade_id}</span>}
                          </td>
                          <td style={{ padding: "9px 12px" }}>
                            <span style={{ background: `${corSev}15`, color: corSev, fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 20 }}>
                              {e.severidade === "critico" ? "⚠ CRÍTICO" : e.severidade === "aviso" ? "⚠ AVISO" : "ℹ INFO"}
                            </span>
                          </td>
                          <td style={{ padding: "9px 12px" }}><HashBadge hash={e.hash} /></td>
                          <td style={{ padding: "9px 12px" }}>
                            {(e.campo_alterado || e.valor_anterior || e.valor_novo) && (
                              <button onClick={() => setExpandido(aberto ? null : e.id)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#1351b4", fontSize: 10, fontWeight: 600 }}>
                                {aberto ? "▲ ocultar" : "▼ diff"}
                              </button>
                            )}
                          </td>
                        </tr>
                        {aberto && (e.campo_alterado || e.valor_anterior || e.valor_novo) && (
                          <tr key={`${e.id}-detail`} style={{ background: "#f8faff" }}>
                            <td colSpan={9} style={{ padding: "10px 16px 14px 48px", borderBottom: "1px solid #e4e7ec" }}>
                              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, fontWeight: 600 }}>
                                Campo alterado: <span style={{ color: "#1351b4", fontFamily: "monospace" }}>{e.campo_alterado}</span>
                              </div>
                              <div style={{ display: "flex", gap: 12 }}>
                                <div style={{ flex: 1, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, padding: "8px 12px" }}>
                                  <div style={{ fontSize: 9, fontWeight: 700, color: "#dc2626", marginBottom: 4 }}>ANTES</div>
                                  <div style={{ fontSize: 11, fontFamily: "monospace", color: "#374151", wordBreak: "break-all" as const }}>{e.valor_anterior ?? "—"}</div>
                                </div>
                                <div style={{ flex: 1, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 7, padding: "8px 12px" }}>
                                  <div style={{ fontSize: 9, fontWeight: 700, color: "#16a34a", marginBottom: 4 }}>DEPOIS</div>
                                  <div style={{ fontSize: 11, fontFamily: "monospace", color: "#374151", wordBreak: "break-all" as const }}>{e.valor_novo ?? "—"}</div>
                                </div>
                              </div>
                              <div style={{ marginTop: 8, fontSize: 10, color: "#9ca3af" }}>
                                IP: {e.ip} · Hash completo: <span style={{ fontFamily: "monospace" }}>{e.hash}</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {eventos.length === 0 && (
              <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>
                <Database size={32} color="#d1d5db" style={{ marginBottom: 8 }} /><br/>
                Nenhum evento encontrado para os filtros selecionados.
              </div>
            )}
          </div>
        )}

        {/* Paginação */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
          <button onClick={() => setPagina(p => Math.max(0, p-1))} disabled={pagina === 0}
            style={{ padding: "7px 16px", borderRadius: 7, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: 12 }}>← Anterior</button>
          <span style={{ padding: "7px 14px", fontSize: 12, color: "#6b7280" }}>Página {pagina + 1} de {data?.paginas ?? 1}</span>
          <button onClick={() => setPagina(p => p+1)} disabled={pagina >= (data?.paginas ?? 1) - 1}
            style={{ padding: "7px 16px", borderRadius: 7, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: 12 }}>Próxima →</button>
        </div>
      </div>
    </div>
  );
}
