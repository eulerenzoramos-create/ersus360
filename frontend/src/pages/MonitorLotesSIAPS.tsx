// src/pages/MonitorLotesSIAPS.tsx — Monitor de Lotes SIAPS em Tempo Real
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Database, AlertTriangle, CheckCircle, Clock, RefreshCw,
  ChevronDown, ChevronRight, Search, Download, Activity,
  XCircle, Package, TrendingUp, FileText, Zap,
} from "lucide-react";
import { apiGet } from "../lib/api";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Lote {
  id: number; numero_lote: string; competencia: string; esf: string;
  data_envio: string; data_processamento: string | null;
  status: "pendente" | "processando" | "processado" | "rejeitado" | "erro";
  total_fichas: number; fichas_processadas: number; fichas_rejeitadas: number;
  taxa_rejeicao: number; tipos_ficha: Record<string, number>;
  erros: ErroLote[];
}

interface ErroLote {
  codigo: string; descricao: string; quantidade: number;
  fichas_afetadas: string[]; acao_corretiva: string;
}

interface ResumoSIAPS {
  competencia_atual: string;
  total_lotes: number; lotes_processados: number; lotes_pendentes: number; lotes_com_erro: number;
  total_fichas: number; fichas_ok: number; fichas_rejeitadas: number; taxa_rejeicao_geral: number;
  ultima_transmissao: string; status_conexao: "online" | "offline" | "degradado";
  historico_taxa: { competencia: string; taxa: number }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COR: Record<string, string> = {
  pendente: "#9ca3af", processando: "#1351b4", processado: "#16a34a",
  rejeitado: "#dc2626", erro: "#7c3aed",
};
const STATUS_LABEL: Record<string, string> = {
  pendente: "⏳ Pendente", processando: "⚡ Processando", processado: "✓ Processado",
  rejeitado: "✗ Rejeitado", erro: "⚠ Erro",
};

function Bar({ pct, cor, height = 6 }: { pct: number; cor: string; height?: number }) {
  return (
    <div style={{ height, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: cor, borderRadius: 4, transition: "width .4s" }} />
    </div>
  );
}

// ── Card Lote ─────────────────────────────────────────────────────────────────

function CardLote({ lote }: { lote: Lote }) {
  const [aberto, setAberto] = useState(false);
  const cor = STATUS_COR[lote.status];
  const corTaxa = lote.taxa_rejeicao === 0 ? "#16a34a" : lote.taxa_rejeicao < 5 ? "#d97706" : "#dc2626";

  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}30`, borderLeft: `4px solid ${cor}`, borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
      {/* Header do card */}
      <div onClick={() => setAberto(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", cursor: "pointer" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{lote.numero_lote}</span>
            <span style={{ background: `${cor}15`, color: cor, fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, border: `1px solid ${cor}40` }}>
              {STATUS_LABEL[lote.status]}
            </span>
            <span style={{ background: "#eff6ff", color: "#1d4ed8", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
              {lote.esf}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>
            Competência {lote.competencia} · Enviado {lote.data_envio}
            {lote.data_processamento && ` · Processado ${lote.data_processamento}`}
          </div>
        </div>

        <div style={{ display: "flex", gap: 20, alignItems: "center", flexShrink: 0 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#374151" }}>{lote.total_fichas}</div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>fichas</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#16a34a" }}>{lote.fichas_processadas}</div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>ok</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#dc2626" }}>{lote.fichas_rejeitadas}</div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>rejeit.</div>
          </div>
          <div style={{ textAlign: "center", minWidth: 56 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: corTaxa }}>{lote.taxa_rejeicao}%</div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>rejeição</div>
          </div>
          {aberto ? <ChevronDown size={14} color="#9ca3af" /> : <ChevronRight size={14} color="#9ca3af" />}
        </div>
      </div>

      {/* Barra de progresso */}
      {lote.status === "processando" && (
        <div style={{ padding: "0 16px 12px" }}>
          <Bar pct={(lote.fichas_processadas / lote.total_fichas) * 100} cor="#1351b4" height={4} />
          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>
            {lote.fichas_processadas}/{lote.total_fichas} processadas…
          </div>
        </div>
      )}

      {/* Detalhe expandido */}
      {aberto && (
        <div style={{ borderTop: `1px solid ${cor}20`, padding: "14px 16px", background: "#fafafa" }}>
          {/* Tipos de ficha */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Fichas por Tipo</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
              {Object.entries(lote.tipos_ficha).map(([tipo, qtd]) => (
                <div key={tipo} style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 8, padding: "6px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#1351b4" }}>{qtd}</div>
                  <div style={{ fontSize: 9, color: "#9ca3af" }}>{tipo}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Erros */}
          {lote.erros.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "#dc2626" }}>
                ⚠ Erros de Processamento — {lote.erros.length} tipo(s)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {lote.erros.map((e, i) => (
                  <div key={i} style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <div>
                        <span style={{ fontFamily: "monospace", fontSize: 10, background: "#dc262615", color: "#dc2626", padding: "1px 6px", borderRadius: 4, marginRight: 8 }}>{e.codigo}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{e.descricao}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#dc2626", flexShrink: 0 }}>{e.quantidade} fichas</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>
                      Fichas: {e.fichas_afetadas.slice(0, 3).join(", ")}{e.fichas_afetadas.length > 3 ? ` +${e.fichas_afetadas.length - 3}` : ""}
                    </div>
                    <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>
                      ✓ Ação: {e.acao_corretiva}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lote.erros.length === 0 && lote.status === "processado" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#16a34a", fontSize: 12, fontWeight: 600 }}>
              <CheckCircle size={14} /> Lote processado sem erros
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Principal ─────────────────────────────────────────────────────────────────

export default function MonitorLotesSIAPS() {
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroESF, setFiltroESF] = useState("Todas");
  const [busca, setBusca] = useState("");

  const { data: resumo, isLoading: loadResumo, refetch } = useQuery<ResumoSIAPS>({
    queryKey: ["siaps-resumo"],
    queryFn: () => apiGet("/api/siaps-monitor/resumo") as Promise<ResumoSIAPS>,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const { data: lotes = [], isLoading: loadLotes } = useQuery<Lote[]>({
    queryKey: ["siaps-lotes", filtroStatus, filtroESF],
    queryFn: () => apiGet("/api/siaps-monitor/lotes", {
      status: filtroStatus !== "todos" ? filtroStatus : undefined,
      esf: filtroESF !== "Todas" ? filtroESF : undefined,
    }) as Promise<Lote[]>,
    staleTime: 30_000,
  });

  const lotesFiltrados = lotes.filter(l =>
    !busca || l.numero_lote.includes(busca) || l.competencia.includes(busca)
  );

  const r = resumo;
  const corConexao = r?.status_conexao === "online" ? "#16a34a" : r?.status_conexao === "degradado" ? "#d97706" : "#dc2626";

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#92400e 0%,#d97706 100%)", padding: "18px 28px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}>
                <Package size={18} color="#fff" />
              </div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Monitor de Lotes SIAPS</span>
              {r && (
                <span style={{ background: `${corConexao}25`, color: corConexao, borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700, border: `1px solid ${corConexao}50` }}>
                  {r.status_conexao === "online" ? "● Online" : r.status_conexao === "degradado" ? "◐ Degradado" : "○ Offline"}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Transmissão · Processamento · Rejeições · Erros por ficha · {r?.competencia_atual}
            </div>
          </div>
          <button onClick={() => refetch()}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            <RefreshCw size={13} /> Atualizar
          </button>
        </div>

        {/* KPIs */}
        {r && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginTop: 16 }}>
            {[
              { label: "Total de Lotes", val: r.total_lotes, cor: "#fff" },
              { label: "Processados", val: r.lotes_processados, cor: "#86efac" },
              { label: "Pendentes", val: r.lotes_pendentes, cor: "#fde68a" },
              { label: "Com Erro", val: r.lotes_com_erro, cor: "#fca5a5" },
              { label: "Taxa Rejeição", val: `${r.taxa_rejeicao_geral}%`, cor: r.taxa_rejeicao_geral < 5 ? "#86efac" : "#fca5a5" },
            ].map(k => (
              <div key={k.label} style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: k.cor }}>{k.val}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)" }}>{k.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "20px 28px 60px" }}>

        {/* Gráfico histórico taxa rejeição */}
        {r?.historico_taxa && r.historico_taxa.length > 0 && (
          <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px", marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Histórico — Taxa de Rejeição por Competência</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
              {r.historico_taxa.map((h, i) => {
                const cor = h.taxa === 0 ? "#16a34a" : h.taxa < 5 ? "#d97706" : "#dc2626";
                const altura = Math.max(6, (h.taxa / 15) * 80);
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: cor }}>{h.taxa}%</div>
                    <div style={{ width: "100%", height: altura, background: cor, borderRadius: "3px 3px 0 0", opacity: 0.85 }} />
                    <div style={{ fontSize: 9, color: "#9ca3af", whiteSpace: "nowrap" as const }}>{h.competencia}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 10, color: "#9ca3af" }}>
              {[{c:"#16a34a",l:"0%"},{c:"#d97706",l:"<5%"},{c:"#dc2626",l:"≥5%"}].map(x=>(
                <span key={x.l} style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:2,background:x.c,display:"inline-block"}}/>{x.l} rejeição</span>
              ))}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap" as const, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: "7px 12px" }}>
            <Search size={12} color="#9ca3af" />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar lote ou competência..."
              style={{ border: "none", outline: "none", fontSize: 12, width: 180, background: "transparent" }} />
          </div>
          <select value={filtroESF} onChange={e => setFiltroESF(e.target.value)}
            style={{ border: "1px solid #d1d5db", borderRadius: 7, padding: "7px 10px", fontSize: 12 }}>
            {["Todas","ESF I","ESF II","ESF III","ESF IV","ESF V"].map(e => <option key={e}>{e}</option>)}
          </select>
          <div style={{ display: "flex", gap: 6 }}>
            {["todos","processado","pendente","rejeitado","erro"].map(s => {
              const cor = STATUS_COR[s] || "#374151";
              return (
                <button key={s} onClick={() => setFiltroStatus(s)}
                  style={{ padding: "5px 12px", fontSize: 11, borderRadius: 20, border: `1px solid ${filtroStatus===s?cor:"#d1d5db"}`, background: filtroStatus===s?`${cor}15`:"#fff", color: filtroStatus===s?cor:"#374151", cursor: "pointer", fontWeight: filtroStatus===s?700:400 }}>
                  {s === "todos" ? "Todos" : STATUS_LABEL[s]}
                </button>
              );
            })}
          </div>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af" }}>{lotesFiltrados.length} lotes</span>
        </div>

        {/* Lista de lotes */}
        {(loadLotes || loadResumo) ? (
          <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando lotes SIAPS...</div>
        ) : (
          <div>
            {lotesFiltrados.map(l => <CardLote key={l.id} lote={l} />)}
            {lotesFiltrados.length === 0 && (
              <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>
                <Package size={32} color="#d1d5db" style={{ marginBottom: 8 }} /><br/>
                Nenhum lote encontrado.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
