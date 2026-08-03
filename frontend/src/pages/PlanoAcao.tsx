// src/pages/PlanoAcao.tsx — Workflow de Plano de Ação Pós-Auditoria
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardList, Plus, Calendar, User, CheckCircle,
  Clock, AlertTriangle, ChevronDown, ChevronRight,
  Filter, Search, Trash2, Edit3, Save, X,
} from "lucide-react";
import { apiGet, apiPost, apiPut } from "../lib/api";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type ColStatus = "aberto" | "em_andamento" | "pendente_evidencia" | "concluido" | "cancelado";

interface Tarefa {
  id: number; titulo: string; descricao: string;
  sistema: string; categoria: string;
  responsavel: string; prazo: string; prioridade: "critica" | "alta" | "media" | "baixa";
  status: ColStatus; criado_em: string; atualizado_em: string;
  evidencia: string | null; comentarios: number;
  origem_alerta: string | null;
}

interface NovaT {
  titulo: string; descricao: string; sistema: string;
  responsavel: string; prazo: string; prioridade: Tarefa["prioridade"];
  categoria: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const COLUNAS: { id: ColStatus; label: string; cor: string; bg: string }[] = [
  { id: "aberto",              label: "📋 Aberto",              cor: "#6b7280", bg: "#f9fafb"  },
  { id: "em_andamento",        label: "⚡ Em Andamento",        cor: "#1351b4", bg: "#eff6ff"  },
  { id: "pendente_evidencia",  label: "📎 Aguarda Evidência",   cor: "#d97706", bg: "#fef3c7"  },
  { id: "concluido",           label: "✅ Concluído",           cor: "#16a34a", bg: "#f0fdf4"  },
];

const PRIO_COR: Record<string, string> = {
  critica: "#dc2626", alta: "#d97706", media: "#1351b4", baixa: "#6b7280",
};
const SISTEMAS = ["SCNES/CNES", "eSUS PEC", "SIAPS", "e-Gestor APS", "RNDS", "CADSUS", "Geral"];
const RESPONSAVEIS = ["Rosangela", "Euler Ramos", "Gestor APS", "TI Municipal", "Enfermeira KENNEDY", "Coord. Atenção Primária"];

// ── Card Tarefa ───────────────────────────────────────────────────────────────

function CardTarefa({ t, onMover, onEditar }: {
  t: Tarefa; onMover: (id: number, status: ColStatus) => void; onEditar: (t: Tarefa) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cor = PRIO_COR[t.prioridade];
  const vencida = new Date(t.prazo) < new Date() && t.status !== "concluido";

  return (
    <div style={{ background: "#fff", border: `1px solid #e4e7ec`, borderLeft: `3px solid ${cor}`, borderRadius: 8, padding: "12px 14px", marginBottom: 8, position: "relative" }}>
      {/* Prioridade + sistema */}
      <div style={{ display: "flex", gap: 6, marginBottom: 7, flexWrap: "wrap" as const }}>
        <span style={{ background: `${cor}15`, color: cor, fontSize: 9, fontWeight: 700, padding: "1px 8px", borderRadius: 20 }}>{t.prioridade.toUpperCase()}</span>
        <span style={{ background: "#eff6ff", color: "#1d4ed8", fontSize: 9, fontWeight: 700, padding: "1px 8px", borderRadius: 20 }}>{t.sistema}</span>
        {t.categoria && <span style={{ background: "#faf5ff", color: "#7c3aed", fontSize: 9, padding: "1px 8px", borderRadius: 20 }}>{t.categoria}</span>}
      </div>

      {/* Título */}
      <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 5, lineHeight: 1.4 }}>{t.titulo}</div>
      {t.descricao && <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8, lineHeight: 1.4 }}>{t.descricao}</div>}

      {/* Origem alerta */}
      {t.origem_alerta && (
        <div style={{ fontSize: 10, color: "#dc2626", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
          <AlertTriangle size={10} /> Alerta: {t.origem_alerta}
        </div>
      )}

      {/* Evidência */}
      {t.evidencia && (
        <div style={{ fontSize: 10, color: "#16a34a", marginBottom: 6 }}>📎 {t.evidencia}</div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 20, height: 20, borderRadius: 10, background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <User size={10} color="#6b7280" />
          </div>
          <span style={{ fontSize: 10, color: "#6b7280" }}>{t.responsavel}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Calendar size={10} color={vencida ? "#dc2626" : "#9ca3af"} />
          <span style={{ fontSize: 10, color: vencida ? "#dc2626" : "#9ca3af", fontWeight: vencida ? 700 : 400 }}>
            {vencida ? "⚠ " : ""}{t.prazo}
          </span>
        </div>
      </div>

      {/* Ações */}
      <div style={{ display: "flex", gap: 4, marginTop: 10, borderTop: "1px solid #f3f4f6", paddingTop: 8 }}>
        <button onClick={() => onEditar(t)}
          style={{ flex: 1, padding: "4px", fontSize: 10, background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 3, color: "#374151" }}>
          <Edit3 size={9} /> Editar
        </button>
        {t.status !== "em_andamento" && t.status !== "concluido" && (
          <button onClick={() => onMover(t.id, "em_andamento")}
            style={{ flex: 1, padding: "4px", fontSize: 10, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 5, cursor: "pointer", color: "#1351b4", fontWeight: 600 }}>
            → Iniciar
          </button>
        )}
        {t.status === "em_andamento" && (
          <button onClick={() => onMover(t.id, "pendente_evidencia")}
            style={{ flex: 1, padding: "4px", fontSize: 10, background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 5, cursor: "pointer", color: "#d97706", fontWeight: 600 }}>
            → Evidência
          </button>
        )}
        {t.status === "pendente_evidencia" && (
          <button onClick={() => onMover(t.id, "concluido")}
            style={{ flex: 1, padding: "4px", fontSize: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 5, cursor: "pointer", color: "#16a34a", fontWeight: 600 }}>
            → Concluir
          </button>
        )}
      </div>
    </div>
  );
}

// ── Modal Nova Tarefa ─────────────────────────────────────────────────────────

function ModalTarefa({ onSalvar, onFechar, inicial }: {
  onSalvar: (t: NovaT) => void; onFechar: () => void; inicial?: Partial<NovaT>;
}) {
  const [form, setForm] = useState<NovaT>({
    titulo: "", descricao: "", sistema: "SCNES/CNES",
    responsavel: RESPONSAVEIS[0], prazo: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    prioridade: "media", categoria: "Conformidade",
    ...inicial,
  });
  const set = (k: keyof NovaT, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={e => e.target === e.currentTarget && onFechar()}>
      <div style={{ background: "#fff", borderRadius: 14, padding: "24px 28px", width: "100%", maxWidth: 500 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Nova Tarefa de Auditoria</div>
          <button onClick={onFechar} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} color="#6b7280" /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Título *</label>
            <input value={form.titulo} onChange={e => set("titulo", e.target.value)} placeholder="Ex: Atualizar INE expirado equipe ACARI"
              style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 7, padding: "8px 12px", fontSize: 12 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Descrição</label>
            <textarea value={form.descricao} onChange={e => set("descricao", e.target.value)} rows={3}
              style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 7, padding: "8px 12px", fontSize: 12, resize: "none" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Sistema</label>
              <select value={form.sistema} onChange={e => set("sistema", e.target.value)}
                style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 7, padding: "8px 10px", fontSize: 12 }}>
                {SISTEMAS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Prioridade</label>
              <select value={form.prioridade} onChange={e => set("prioridade", e.target.value as any)}
                style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 7, padding: "8px 10px", fontSize: 12 }}>
                {["critica","alta","media","baixa"].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Responsável</label>
              <select value={form.responsavel} onChange={e => set("responsavel", e.target.value)}
                style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 7, padding: "8px 10px", fontSize: 12 }}>
                {RESPONSAVEIS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Prazo</label>
              <input type="date" value={form.prazo} onChange={e => set("prazo", e.target.value)}
                style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 7, padding: "8px 10px", fontSize: 12 }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Categoria</label>
            <input value={form.categoria} onChange={e => set("categoria", e.target.value)}
              placeholder="Ex: Conformidade, Cadastro, Produção..."
              style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 7, padding: "8px 12px", fontSize: 12 }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button onClick={onFechar} style={{ flex: 1, padding: "10px", background: "#f8fafc", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#374151" }}>
            Cancelar
          </button>
          <button onClick={() => form.titulo && onSalvar(form)} disabled={!form.titulo}
            style={{ flex: 2, padding: "10px", background: form.titulo ? "#1351b4" : "#9ca3af", color: "#fff", border: "none", borderRadius: 8, cursor: form.titulo ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 700 }}>
            <Save size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
            Salvar Tarefa
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Principal ─────────────────────────────────────────────────────────────────

export default function PlanoAcao() {
  const [filtroSistema, setFiltroSistema] = useState("Todos");
  const [filtroPrio, setFiltroPrio] = useState("Todas");
  const [busca, setBusca] = useState("");
  const [modalNova, setModalNova] = useState(false);
  const [tarefaEditar, setTarefaEditar] = useState<Tarefa | null>(null);
  const qc = useQueryClient();

  const { data: tarefas = [], isLoading } = useQuery<Tarefa[]>({
    queryKey: ["plano-acao"],
    queryFn: () => apiGet("/api/auditoria/plano-acao") as Promise<Tarefa[]>,
    staleTime: 30_000,
  });

  const criarTarefa = useMutation({
    mutationFn: (t: NovaT) => apiPost("/api/auditoria/plano-acao", t),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["plano-acao"] }); setModalNova(false); },
  });

  const moverTarefa = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ColStatus }) =>
      apiPut(`/api/auditoria/plano-acao/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plano-acao"] }),
  });

  const tarefasFiltradas = tarefas.filter(t => {
    if (filtroSistema !== "Todos" && t.sistema !== filtroSistema) return false;
    if (filtroPrio !== "Todas" && t.prioridade !== filtroPrio) return false;
    if (busca && !t.titulo.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const porColuna = (col: ColStatus) => tarefasFiltradas.filter(t => t.status === col);

  const resumo = {
    total: tarefas.length,
    abertas: tarefas.filter(t => t.status === "aberto").length,
    andamento: tarefas.filter(t => t.status === "em_andamento").length,
    concluidas: tarefas.filter(t => t.status === "concluido").length,
    vencidas: tarefas.filter(t => new Date(t.prazo) < new Date() && t.status !== "concluido").length,
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0d1b2a 0%,#1351b4 100%)", padding: "18px 28px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}>
                <ClipboardList size={18} color="#fff" />
              </div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Plano de Ação</span>
              <span style={{ background: "rgba(255,255,255,.15)", color: "#bfdbfe", borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
                Pós-Auditoria
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#bfdbfe" }}>Workflow de conformidade · {resumo.total} tarefas · {resumo.concluidas} concluídas</div>
          </div>
          <button onClick={() => setModalNova(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#1351b4", border: "none", borderRadius: 8, padding: "10px 18px", cursor: "pointer", fontSize: 12, fontWeight: 800 }}>
            <Plus size={14} /> Nova Tarefa
          </button>
        </div>

        {/* KPIs rápidos */}
        <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
          {[
            { label: "Total", val: resumo.total, cor: "#bfdbfe" },
            { label: "Abertas", val: resumo.abertas, cor: "#fde68a" },
            { label: "Em Andamento", val: resumo.andamento, cor: "#93c5fd" },
            { label: "Concluídas", val: resumo.concluidas, cor: "#86efac" },
            { label: "Vencidas", val: resumo.vencidas, cor: "#fca5a5" },
          ].map(k => (
            <div key={k.label} style={{ background: "rgba(255,255,255,.1)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: k.cor }}>{k.val}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)" }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 28px 60px" }}>

        {/* Filtros */}
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap" as const, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: "7px 12px", flex: 1, minWidth: 160 }}>
            <Search size={12} color="#9ca3af" />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar tarefa..."
              style={{ border: "none", outline: "none", fontSize: 12, flex: 1, background: "transparent" }} />
          </div>
          <select value={filtroSistema} onChange={e => setFiltroSistema(e.target.value)}
            style={{ border: "1px solid #d1d5db", borderRadius: 7, padding: "7px 10px", fontSize: 12 }}>
            {["Todos", ...SISTEMAS].map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={filtroPrio} onChange={e => setFiltroPrio(e.target.value)}
            style={{ border: "1px solid #d1d5db", borderRadius: 7, padding: "7px 10px", fontSize: 12 }}>
            {["Todas","critica","alta","media","baixa"].map(p => <option key={p} value={p}>{p === "Todas" ? "Todas Prioridades" : p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
          </select>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>{tarefasFiltradas.length} tarefas</span>
        </div>

        {isLoading && <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>Carregando tarefas...</div>}

        {/* Kanban */}
        {!isLoading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, alignItems: "start" }}>
            {COLUNAS.map(col => {
              const items = porColuna(col.id);
              return (
                <div key={col.id}>
                  {/* Cabeçalho coluna */}
                  <div style={{ background: col.bg, border: `1px solid ${col.cor}30`, borderRadius: "10px 10px 0 0", padding: "10px 14px", marginBottom: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: col.cor }}>{col.label}</span>
                      <span style={{ background: col.cor, color: "#fff", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 800 }}>{items.length}</span>
                    </div>
                  </div>
                  {/* Cards */}
                  <div style={{ background: col.bg, border: `1px solid ${col.cor}20`, borderTop: "none", borderRadius: "0 0 10px 10px", padding: "10px 10px 10px", minHeight: 120 }}>
                    {items.map(t => (
                      <CardTarefa key={t.id} t={t}
                        onMover={(id, s) => moverTarefa.mutate({ id, status: s })}
                        onEditar={setTarefaEditar} />
                    ))}
                    {items.length === 0 && (
                      <div style={{ textAlign: "center", padding: "24px 0", color: "#d1d5db", fontSize: 11 }}>
                        Nenhuma tarefa
                      </div>
                    )}
                    {/* Botão adicionar na coluna */}
                    {col.id === "aberto" && (
                      <button onClick={() => setModalNova(true)}
                        style={{ width: "100%", padding: "8px", fontSize: 11, background: "transparent", border: `1px dashed ${col.cor}60`, borderRadius: 7, cursor: "pointer", color: col.cor, fontWeight: 600, marginTop: 4 }}>
                        + Adicionar tarefa
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalNova && (
        <ModalTarefa onSalvar={t => criarTarefa.mutate(t)} onFechar={() => setModalNova(false)} />
      )}
      {tarefaEditar && (
        <ModalTarefa
          inicial={tarefaEditar}
          onSalvar={t => { criarTarefa.mutate(t); setTarefaEditar(null); }}
          onFechar={() => setTarefaEditar(null)} />
      )}
    </div>
  );
}
