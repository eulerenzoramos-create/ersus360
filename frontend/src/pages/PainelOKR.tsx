// src/pages/PainelOKR.tsx — Painel de OKRs Estratégicos · FMS Apuí
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Target, ChevronDown, ChevronRight, CheckCircle, Clock,
  AlertTriangle, TrendingUp, TrendingDown, Plus, RefreshCw,
} from "lucide-react";
import { apiGet, apiPost } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface KeyResult {
  id: string; descricao: string; unidade: string;
  valor_atual: number; valor_meta: number; pct: number;
  status: "no_prazo" | "atencao" | "critico" | "concluido";
  responsavel: string; data_limite: string;
}

interface Objetivo {
  id: string; titulo: string; area: string; trimestre: string;
  descricao: string; pct_geral: number;
  status: "no_prazo" | "atencao" | "critico" | "concluido";
  key_results: KeyResult[];
}

interface ResumoOKR {
  ciclo: string; total_objetivos: number; total_krs: number;
  concluidos: number; no_prazo: number; atencao: number; criticos: number;
  score_medio: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const COR_STATUS: Record<string, string> = {
  no_prazo: "#16a34a", atencao: "#d97706", critico: "#dc2626", concluido: "#1351b4",
};
const BG_STATUS: Record<string, string> = {
  no_prazo: "#dcfce7", atencao: "#fef3c7", critico: "#fee2e2", concluido: "#dbeafe",
};
const LABEL_STATUS: Record<string, string> = {
  no_prazo: "No Prazo", atencao: "Atenção", critico: "Crítico", concluido: "Concluído",
};

function Badge({ s }: { s: string }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 10,
      background: BG_STATUS[s] ?? "#f1f5f9", color: COR_STATUS[s] ?? "#6b7280" }}>
      {LABEL_STATUS[s] ?? s}
    </span>
  );
}

function BarraProgresso({ pct, cor }: { pct: number; cor: string }) {
  return (
    <div style={{ height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: cor, borderRadius: 3, transition: "width .4s" }}/>
    </div>
  );
}

// ── Card Key Result ────────────────────────────────────────────────────────────

function CardKR({ kr }: { kr: KeyResult }) {
  const cor = COR_STATUS[kr.status];
  return (
    <div style={{ padding: "10px 14px", borderRadius: 8, background: "#f9fafb", border: `1px solid ${cor}20`, borderLeft: `3px solid ${cor}`, marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#1f2937", marginBottom: 2 }}>{kr.descricao}</div>
          <div style={{ fontSize: 9, color: "#9ca3af" }}>Responsável: {kr.responsavel} · Prazo: {kr.data_limite}</div>
        </div>
        <div style={{ textAlign: "right" as const, flexShrink: 0, marginLeft: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: cor }}>{kr.pct}%</div>
          <div style={{ fontSize: 9, color: "#9ca3af" }}>{kr.valor_atual}/{kr.valor_meta} {kr.unidade}</div>
        </div>
      </div>
      <BarraProgresso pct={kr.pct} cor={cor}/>
    </div>
  );
}

// ── Card Objetivo ─────────────────────────────────────────────────────────────

function CardObjetivo({ obj }: { obj: Objetivo }) {
  const [aberto, setAberto] = useState(false);
  const cor = COR_STATUS[obj.status];

  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}20`, borderLeft: `4px solid ${cor}`, borderRadius: 10, marginBottom: 10, overflow: "hidden" }}>
      <div onClick={() => setAberto(o => !o)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", cursor: "pointer" }}>
        <div style={{ width: 52, height: 52, flexShrink: 0 }}>
          <svg width={52} height={52} viewBox="0 0 52 52">
            <circle cx={26} cy={26} r={22} fill="none" stroke="#e5e7eb" strokeWidth={5}/>
            <circle cx={26} cy={26} r={22} fill="none" stroke={cor} strokeWidth={5}
              strokeDasharray={`${(obj.pct_geral / 100) * 138.2} 138.2`} strokeLinecap="round"
              transform="rotate(-90 26 26)"/>
            <text x={26} y={26} textAnchor="middle" dominantBaseline="middle" fontSize={12} fontWeight={900} fill={cor}>{obj.pct_geral}%</text>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontWeight: 800, fontSize: 13 }}>{obj.titulo}</span>
            <Badge s={obj.status}/>
            <span style={{ fontSize: 9, background: "#f1f5f9", color: "#6b7280", padding: "1px 7px", borderRadius: 8, fontWeight: 700 }}>{obj.trimestre}</span>
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 5 }}>{obj.descricao}</div>
          <div style={{ fontSize: 9, color: "#9ca3af" }}>{obj.key_results.length} Key Results · Área: {obj.area}</div>
        </div>
        {aberto ? <ChevronDown size={14} color="#9ca3af"/> : <ChevronRight size={14} color="#9ca3af"/>}
      </div>

      {aberto && (
        <div style={{ borderTop: `1px solid ${cor}15`, padding: "12px 18px", background: "#fafafa" }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 10 }}>Key Results</div>
          {obj.key_results.map(kr => <CardKR key={kr.id} kr={kr}/>)}
        </div>
      )}
    </div>
  );
}

// ── Principal ─────────────────────────────────────────────────────────────────

export default function PainelOKR() {
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroArea, setFiltroArea] = useState("todos");
  const qc = useQueryClient();

  const { data: resumo } = useQuery<ResumoOKR>({
    queryKey: ["okr-resumo"],
    queryFn: () => apiGet("/api/okr/resumo") as Promise<ResumoOKR>,
    staleTime: 300_000,
  });

  const { data: objetivos = [], isLoading } = useQuery<Objetivo[]>({
    queryKey: ["okr-objetivos"],
    queryFn: () => apiGet("/api/okr/objetivos") as Promise<Objetivo[]>,
    staleTime: 300_000,
  });

  const atualizar = useMutation({
    mutationFn: () => apiPost("/api/okr/atualizar"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["okr-resumo"] }),
  });

  const areas = ["todos", ...Array.from(new Set(objetivos.map(o => o.area)))];

  const visiveis = objetivos.filter(o => {
    const okStatus = filtroStatus === "todos" || o.status === filtroStatus;
    const okArea   = filtroArea === "todos"   || o.area === filtroArea;
    return okStatus && okArea;
  });

  const r = resumo;

  if (!isLoading && !resumo) return (
    <div style={{ padding: 24 }}>
      <NaoDisponivelBanner
        titulo="PainelOKR indisponivel"
        nota="Dados nao disponiveis — integracao pendente de configuracao no Railway."
      />
    </div>
  );

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#14532d 0%,#16a34a 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}><Target size={18} color="#fff"/></div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>OKRs Estratégicos · FMS Apuí</span>
              {r && <span style={{ fontSize: 10, background: "rgba(255,255,255,.15)", color: "#bbf7d0", padding: "2px 10px", borderRadius: 6, fontWeight: 700 }}>{r.ciclo}</span>}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Objetivos e Resultados-Chave · Ciclo trimestral · Alinhado ao Plano Municipal de Saúde 2026–2029
            </div>
          </div>
          <button onClick={() => atualizar.mutate()} disabled={atualizar.isPending}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            <RefreshCw size={12}/>{atualizar.isPending ? "Atualizando..." : "Atualizar OKRs"}
          </button>
        </div>

        {r && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginTop: 16 }}>
            {[
              { l: "Score Médio",  v: `${r.score_medio}%`, cor: "#86efac" },
              { l: "Objetivos",    v: r.total_objetivos,   cor: "#bbf7d0" },
              { l: "Concluídos",   v: r.concluidos,        cor: "#86efac" },
              { l: "No Prazo",     v: r.no_prazo,          cor: "#86efac" },
              { l: "Atenção",      v: r.atencao,           cor: "#fde68a" },
              { l: "Críticos",     v: r.criticos,          cor: "#fca5a5" },
            ].map(k => (
              <div key={k.l} style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "10px 12px", textAlign: "center" as const }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: k.cor }}>{k.v}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.5)" }}>{k.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "20px 28px 60px" }}>
        {/* Filtros */}
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap" as const, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Status:</span>
          {["todos","no_prazo","atencao","critico","concluido"].map(s => (
            <button key={s} onClick={() => setFiltroStatus(s)}
              style={{ padding: "5px 12px", fontSize: 11, borderRadius: 20, border: `1px solid ${filtroStatus===s?"#16a34a":"#d1d5db"}`, background: filtroStatus===s?"#dcfce7":"#fff", color: filtroStatus===s?"#16a34a":"#374151", cursor: "pointer", fontWeight: filtroStatus===s?700:400 }}>
              {s === "todos" ? "Todos" : LABEL_STATUS[s]}
            </button>
          ))}
          <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginLeft: 8 }}>Área:</span>
          {areas.map(a => (
            <button key={a} onClick={() => setFiltroArea(a)}
              style={{ padding: "5px 12px", fontSize: 11, borderRadius: 20, border: `1px solid ${filtroArea===a?"#16a34a":"#d1d5db"}`, background: filtroArea===a?"#dcfce7":"#fff", color: filtroArea===a?"#16a34a":"#374151", cursor: "pointer", fontWeight: filtroArea===a?700:400 }}>
              {a === "todos" ? "Todas" : a}
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af" }}>{visiveis.length} objetivo(s)</span>
        </div>

        {isLoading
          ? <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando OKRs...</div>
          : visiveis.map(o => <CardObjetivo key={o.id} obj={o}/>)
        }
      </div>
    </div>
  );
}
