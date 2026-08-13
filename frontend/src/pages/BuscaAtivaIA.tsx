// src/pages/BuscaAtivaIA.tsx — Busca Ativa Avançada com IA · Priorização Inteligente
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Brain, User, AlertTriangle, CheckCircle, MapPin,
  Phone, RefreshCw, ChevronDown, ChevronRight, Zap,
} from "lucide-react";
import { apiGet, apiPost } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface CidadaoPriorizado {
  id: string; nome: string; cns: string; idade: number; microarea: string; acs: string;
  score_prioridade: number; nivel: "critico" | "alto" | "medio" | "baixo";
  motivos: string[]; ultima_visita: string | null; dias_sem_visita: number;
  pendencias: Pendencia[]; telefone: string | null;
}

interface Pendencia {
  tipo: string; descricao: string; criticidade: "critica" | "alta" | "media" | "baixa";
}

interface ResumoBuscaIA {
  total_cidadaos: number; criticos: number; alto: number; medio: number; baixo: number;
  com_visita_pendente: number; sem_contato_90d: number; ultima_atualizacao: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const COR_NIVEL: Record<string, string> = {
  critico: "#dc2626", alto: "#ea580c", medio: "#d97706", baixo: "#16a34a",
};
const BG_NIVEL: Record<string, string> = {
  critico: "#fee2e2", alto: "#ffedd5", medio: "#fef3c7", baixo: "#dcfce7",
};

// ── Score bar ─────────────────────────────────────────────────────────────────

function ScoreBar({ score, nivel }: { score: number; nivel: string }) {
  const cor = COR_NIVEL[nivel];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "#e5e7eb", borderRadius: 3 }}>
        <div style={{ height: "100%", width: `${score}%`, background: cor, borderRadius: 3 }}/>
      </div>
      <span style={{ fontSize: 11, fontWeight: 900, color: cor, minWidth: 28 }}>{score}</span>
    </div>
  );
}

// ── Card Cidadão ──────────────────────────────────────────────────────────────

function CardCidadao({ c }: { c: CidadaoPriorizado }) {
  const [aberto, setAberto] = useState(false);
  const cor = COR_NIVEL[c.nivel];
  const bg  = BG_NIVEL[c.nivel];
  const labels: Record<string,string> = { critico:"Crítico", alto:"Alto", medio:"Atenção", baixo:"Baixo" };

  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}20`, borderLeft: `4px solid ${cor}`, borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
      <div onClick={() => setAberto(o => !o)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", cursor: "pointer" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: cor + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <User size={18} color={cor}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" as const }}>
            <span style={{ fontWeight: 800, fontSize: 13 }}>{c.nome}</span>
            <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 10, background: bg, color: cor }}>{labels[c.nivel]}</span>
            <span style={{ fontSize: 9, color: "#9ca3af" }}>{c.idade}a · {c.microarea}</span>
          </div>
          <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 5 }}>
            ACS: {c.acs} · {c.dias_sem_visita > 0 ? `Sem visita há ${c.dias_sem_visita} dias` : "Visita recente"}
            {c.telefone && ` · ${c.telefone}`}
          </div>
          <ScoreBar score={c.score_prioridade} nivel={c.nivel}/>
        </div>
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column" as const, gap: 4, alignItems: "flex-end" }}>
          <span style={{ fontSize: 10, color: "#9ca3af" }}>{c.pendencias.length} pendência(s)</span>
          {c.pendencias.filter(p => p.criticidade === "critica").length > 0 &&
            <span style={{ fontSize: 9, fontWeight: 800, background: "#fee2e2", color: "#dc2626", padding: "1px 6px", borderRadius: 8 }}>
              {c.pendencias.filter(p => p.criticidade === "critica").length} crítica(s)
            </span>
          }
        </div>
        {aberto ? <ChevronDown size={14} color="#9ca3af"/> : <ChevronRight size={14} color="#9ca3af"/>}
      </div>

      {aberto && (
        <div style={{ borderTop: `1px solid ${cor}15`, padding: "12px 16px", background: "#fafafa" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Brain size={12} color="#7c3aed"/> Motivos da Priorização (IA)
              </div>
              {c.motivos.map((m, i) => (
                <div key={i} style={{ display: "flex", gap: 7, marginBottom: 5, fontSize: 11 }}>
                  <span style={{ color: cor, fontWeight: 800, flexShrink: 0 }}>•</span>
                  <span style={{ color: "#374151" }}>{m}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Pendências Identificadas</div>
              {c.pendencias.map((p, i) => {
                const pcor = p.criticidade === "critica" ? "#dc2626" : p.criticidade === "alta" ? "#ea580c" : p.criticidade === "media" ? "#d97706" : "#16a34a";
                return (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, padding: "6px 10px", borderRadius: 8, background: pcor + "0d", borderLeft: `2px solid ${pcor}` }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 800, color: pcor }}>{p.tipo}</div>
                      <div style={{ fontSize: 10, color: "#374151" }}>{p.descricao}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <button style={{ padding: "6px 14px", fontSize: 11, fontWeight: 700, background: cor, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
              Registrar Visita
            </button>
            <button style={{ padding: "6px 14px", fontSize: 11, fontWeight: 700, background: "#fff", color: cor, border: `1px solid ${cor}`, borderRadius: 8, cursor: "pointer" }}>
              Ver Prontuário
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Principal ─────────────────────────────────────────────────────────────────

export default function BuscaAtivaIA() {
  const [filtroNivel, setFiltroNivel] = useState("todos");
  const [filtroArea, setFiltroArea] = useState("todos");
  const [busca, setBusca] = useState("");
  const qc = useQueryClient();

  const { data: resumo } = useQuery<ResumoBuscaIA>({
    queryKey: ["busca-ia-resumo"],
    queryFn: () => apiGet("/api/busca-ativa-ia/resumo") as Promise<ResumoBuscaIA>,
    staleTime: 300_000,
  });

  const { data: cidadaos = [], isLoading } = useQuery<CidadaoPriorizado[]>({
    queryKey: ["busca-ia-lista", filtroNivel, filtroArea],
    queryFn: () => apiGet("/api/busca-ativa-ia/priorizada", { nivel: filtroNivel !== "todos" ? filtroNivel : undefined, microarea: filtroArea !== "todos" ? filtroArea : undefined }) as Promise<CidadaoPriorizado[]>,
    staleTime: 300_000,
  });

  const recalcular = useMutation({
    mutationFn: () => apiPost("/api/busca-ativa-ia/recalcular"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["busca-ia-resumo"] }); qc.invalidateQueries({ queryKey: ["busca-ia-lista"] }); },
  });

  const microareas = ["todos", ...Array.from(new Set(cidadaos.map(c => c.microarea))).sort()];
  const r = resumo;

  const visiveis = cidadaos.filter(c =>
    !busca || c.nome.toLowerCase().includes(busca.toLowerCase()) || c.cns.includes(busca)
  );

  if (!isLoading && !resumo) return (
    <div style={{ padding: 24 }}>
      <NaoDisponivelBanner
        titulo="BuscaAtivaIA indisponivel"
        nota="Dados nao disponiveis — integracao pendente de configuracao no Railway."
      />
    </div>
  );

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#312e81 0%,#6d28d9 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}><Brain size={18} color="#fff"/></div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Busca Ativa · Priorização IA</span>
              <span style={{ fontSize: 9, fontWeight: 800, background: "rgba(255,255,255,.2)", color: "#c4b5fd", padding: "2px 9px", borderRadius: 10 }}>INTELIGÊNCIA ARTIFICIAL</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Gradient Boosting + regras de negócio · Integra CADSUS, PEC, SIAPS, SCNES · Score 0–100
            </div>
          </div>
          <button onClick={() => recalcular.mutate()} disabled={recalcular.isPending}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            <Zap size={12}/>{recalcular.isPending ? "Calculando..." : "Recalcular Prioridades"}
          </button>
        </div>

        {r && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8, marginTop: 16 }}>
            {[
              { l: "Total",           v: r.total_cidadaos, cor: "#c4b5fd" },
              { l: "Críticos",        v: r.criticos,       cor: "#fca5a5" },
              { l: "Alto Risco",      v: r.alto,           cor: "#fed7aa" },
              { l: "Atenção",         v: r.medio,          cor: "#fde68a" },
              { l: "Baixo",           v: r.baixo,          cor: "#86efac" },
              { l: "Visit. Pendente", v: r.com_visita_pendente, cor: "#fde68a" },
              { l: "Sem contato >90d",v: r.sem_contato_90d,    cor: "#fca5a5" },
            ].map(k => (
              <div key={k.l} style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "10px 10px", textAlign: "center" as const }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: k.cor }}>{k.v}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.5)" }}>{k.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "20px 28px 60px" }}>
        {/* Filtros */}
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap" as const, alignItems: "center" }}>
          <div style={{ position: "relative" as const }}>
            <Search size={12} color="#9ca3af" style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)" }}/>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Nome ou CNS..."
              style={{ padding: "6px 10px 6px 28px", fontSize: 11, border: "1px solid #d1d5db", borderRadius: 8, outline: "none", width: 180 }}/>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Nível:</span>
          {["todos","critico","alto","medio","baixo"].map(n => (
            <button key={n} onClick={() => setFiltroNivel(n)}
              style={{ padding: "5px 10px", fontSize: 10, borderRadius: 20, border: `1px solid ${filtroNivel===n?(COR_NIVEL[n]??"#6d28d9"):"#d1d5db"}`, background: filtroNivel===n?((COR_NIVEL[n]??"#6d28d9")+"15"):"#fff", color: filtroNivel===n?(COR_NIVEL[n]??"#6d28d9"):"#374151", cursor: "pointer" }}>
              {n === "todos" ? "Todos" : n.charAt(0).toUpperCase() + n.slice(1)}
            </button>
          ))}
          <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Microárea:</span>
          {microareas.map(m => (
            <button key={m} onClick={() => setFiltroArea(m)}
              style={{ padding: "5px 10px", fontSize: 10, borderRadius: 20, border: `1px solid ${filtroArea===m?"#6d28d9":"#d1d5db"}`, background: filtroArea===m?"#ede9fe":"#fff", color: filtroArea===m?"#6d28d9":"#374151", cursor: "pointer" }}>
              {m === "todos" ? "Todas" : m}
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#9ca3af" }}>{visiveis.length} cidadão(s)</span>
        </div>

        {isLoading
          ? <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Calculando prioridades...</div>
          : visiveis.map(c => <CardCidadao key={c.id} c={c}/>)
        }
      </div>
    </div>
  );
}
