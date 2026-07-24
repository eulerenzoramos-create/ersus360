// src/pages/GestaoEquipamentos.tsx — Gestão de Equipamentos e Manutenção
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Wrench, CheckCircle, AlertTriangle, XCircle, Clock,
  ChevronDown, ChevronRight, RefreshCw, Plus, Package,
} from "lucide-react";
import { apiGet, apiPost } from "../lib/api";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Equipamento {
  id: string; nome: string; tipo: string; fabricante: string; modelo: string;
  patrimonio: string; unidade: string; setor: string;
  status: "operacional" | "manutencao" | "aguardando_peca" | "inativo" | "descarte";
  data_ultima_manut: string | null; data_proxima_manut: string | null;
  dias_prox_manut: number | null; garantia_ate: string | null;
  historico: HistoricoManut[];
  alertas: string[];
}

interface HistoricoManut {
  data: string; tipo: "preventiva" | "corretiva" | "calibracao";
  descricao: string; tecnico: string; custo: number | null;
}

interface ResumoEquipamentos {
  total: number; operacionais: number; em_manutencao: number;
  aguardando_peca: number; inativos: number;
  manut_proximos_30d: number; vencendo_garantia: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const COR_STATUS: Record<string, string> = {
  operacional: "#16a34a", manutencao: "#d97706", aguardando_peca: "#ea580c", inativo: "#dc2626", descarte: "#6b7280",
};
const LABEL_STATUS: Record<string, string> = {
  operacional: "Operacional", manutencao: "Em Manutenção", aguardando_peca: "Aguard. Peça", inativo: "Inativo", descarte: "Descarte",
};
const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function StatusIcon({ s }: { s: string }) {
  if (s === "operacional")    return <CheckCircle size={16} color="#16a34a"/>;
  if (s === "manutencao")     return <Wrench size={16} color="#d97706"/>;
  if (s === "aguardando_peca")return <Clock size={16} color="#ea580c"/>;
  return <XCircle size={16} color="#dc2626"/>;
}

// ── Card Equipamento ──────────────────────────────────────────────────────────

function CardEquip({ eq }: { eq: Equipamento }) {
  const [aberto, setAberto] = useState(false);
  const cor = COR_STATUS[eq.status];

  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}20`, borderLeft: `4px solid ${cor}`, borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
      <div onClick={() => setAberto(o => !o)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", cursor: "pointer" }}>
        <StatusIcon s={eq.status}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" as const }}>
            <span style={{ fontWeight: 800, fontSize: 13 }}>{eq.nome}</span>
            <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 10, background: cor + "18", color: cor }}>{LABEL_STATUS[eq.status]}</span>
            <span style={{ fontSize: 9, color: "#9ca3af" }}>{eq.tipo} · {eq.fabricante}</span>
          </div>
          <div style={{ fontSize: 10, color: "#6b7280" }}>
            Patrim. {eq.patrimonio} · {eq.unidade} / {eq.setor}
            {eq.dias_prox_manut !== null && (
              <span style={{ color: eq.dias_prox_manut <= 30 ? "#d97706" : "#9ca3af" }}>
                {" "}· Próxima manutenção: {eq.dias_prox_manut <= 0 ? "VENCIDA" : `em ${eq.dias_prox_manut}d (${eq.data_proxima_manut})`}
              </span>
            )}
          </div>
          {eq.alertas.length > 0 && (
            <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" as const }}>
              {eq.alertas.map((a, i) => (
                <span key={i} style={{ fontSize: 9, background: "#fef3c7", color: "#92400e", padding: "1px 7px", borderRadius: 8, fontWeight: 600 }}>⚠ {a}</span>
              ))}
            </div>
          )}
        </div>
        {aberto ? <ChevronDown size={14} color="#9ca3af"/> : <ChevronRight size={14} color="#9ca3af"/>}
      </div>

      {aberto && (
        <div style={{ borderTop: `1px solid ${cor}15`, padding: "14px 16px", background: "#fafafa" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Dados do Equipamento</div>
              {[
                ["Modelo",          eq.modelo],
                ["Fabricante",      eq.fabricante],
                ["Patrimônio",      eq.patrimonio],
                ["Garantia até",    eq.garantia_ate ?? "Vencida"],
                ["Última manutenção",eq.data_ultima_manut ?? "—"],
                ["Próx. manutenção", eq.data_proxima_manut ?? "—"],
              ].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: 10, color: "#6b7280" }}>{l}</span>
                  <span style={{ fontSize: 10, fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Histórico de Manutenção</div>
              {eq.historico.map((h, i) => {
                const tcor = h.tipo === "preventiva" ? "#1351b4" : h.tipo === "corretiva" ? "#dc2626" : "#7c3aed";
                return (
                  <div key={i} style={{ padding: "8px 10px", marginBottom: 6, background: "#fff", borderRadius: 8, border: `1px solid ${tcor}20`, borderLeft: `2px solid ${tcor}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: tcor }}>{h.tipo.toUpperCase()}</span>
                      <span style={{ fontSize: 9, color: "#9ca3af" }}>{h.data}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#374151" }}>{h.descricao}</div>
                    <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 2 }}>
                      Técnico: {h.tecnico}{h.custo ? ` · Custo: ${BRL(h.custo)}` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ padding: "6px 14px", fontSize: 11, fontWeight: 700, background: "#d97706", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
              Registrar Manutenção
            </button>
            <button style={{ padding: "6px 14px", fontSize: 11, fontWeight: 700, background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer" }}>
              Editar Equipamento
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Principal ─────────────────────────────────────────────────────────────────

export default function GestaoEquipamentos() {
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroUnidade, setFiltroUnidade] = useState("todos");
  const qc = useQueryClient();

  const { data: resumo } = useQuery<ResumoEquipamentos>({
    queryKey: ["equip-resumo"],
    queryFn: () => apiGet("/api/equipamentos/resumo") as Promise<ResumoEquipamentos>,
    staleTime: 300_000,
  });

  const { data: equipamentos = [], isLoading } = useQuery<Equipamento[]>({
    queryKey: ["equip-lista"],
    queryFn: () => apiGet("/api/equipamentos/lista") as Promise<Equipamento[]>,
    staleTime: 300_000,
  });

  const unidades = ["todos", ...Array.from(new Set(equipamentos.map(e => e.unidade))).sort()];

  const visiveis = equipamentos.filter(e => {
    const okStatus  = filtroStatus  === "todos" || e.status  === filtroStatus;
    const okUnidade = filtroUnidade === "todos" || e.unidade === filtroUnidade;
    return okStatus && okUnidade;
  });

  const r = resumo;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1c1917 0%,#78350f 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}><Wrench size={18} color="#fff"/></div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Gestão de Equipamentos</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Inventário patrimonial · Manutenção preventiva e corretiva · Calibração · Garantias · FMS Apuí/AM
            </div>
          </div>
        </div>

        {r && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8, marginTop: 16 }}>
            {[
              { l: "Total",           v: r.total,             cor: "#fde68a" },
              { l: "Operacionais",    v: r.operacionais,      cor: "#86efac" },
              { l: "Manutenção",      v: r.em_manutencao,     cor: "#fde68a" },
              { l: "Aguard. Peça",    v: r.aguardando_peca,   cor: "#fed7aa" },
              { l: "Inativos",        v: r.inativos,          cor: "#fca5a5" },
              { l: "Manut. <30d",     v: r.manut_proximos_30d,cor: "#fde68a" },
              { l: "Garantia venc.",  v: r.vencendo_garantia, cor: "#fca5a5" },
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
          <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Status:</span>
          {["todos","operacional","manutencao","aguardando_peca","inativo"].map(s => (
            <button key={s} onClick={() => setFiltroStatus(s)}
              style={{ padding: "5px 10px", fontSize: 10, borderRadius: 20, border: `1px solid ${filtroStatus===s?(COR_STATUS[s]??"#78350f"):"#d1d5db"}`, background: filtroStatus===s?((COR_STATUS[s]??"#78350f")+"15"):"#fff", color: filtroStatus===s?(COR_STATUS[s]??"#78350f"):"#374151", cursor: "pointer" }}>
              {s === "todos" ? "Todos" : LABEL_STATUS[s]}
            </button>
          ))}
          <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginLeft: 8 }}>Unidade:</span>
          {unidades.map(u => (
            <button key={u} onClick={() => setFiltroUnidade(u)}
              style={{ padding: "5px 10px", fontSize: 10, borderRadius: 20, border: `1px solid ${filtroUnidade===u?"#78350f":"#d1d5db"}`, background: filtroUnidade===u?"#fef3c7":"#fff", color: filtroUnidade===u?"#78350f":"#374151", cursor: "pointer" }}>
              {u === "todos" ? "Todas" : u}
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#9ca3af" }}>{visiveis.length} equipamento(s)</span>
        </div>

        {isLoading
          ? <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando inventário...</div>
          : visiveis.map(eq => <CardEquip key={eq.id} eq={eq}/>)
        }
      </div>
    </div>
  );
}
