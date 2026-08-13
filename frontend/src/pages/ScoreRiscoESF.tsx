// src/pages/ScoreRiscoESF.tsx — Score de Risco por Equipe ESF
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, RefreshCw, ChevronDown, ChevronRight, Activity } from "lucide-react";
import { apiGet, apiPost } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface DimensaoRisco {
  nome: string; score: number; peso: number; status: "critico" | "atencao" | "bom"; contribuicao: number;
  detalhes: string;
}

interface AlertaESF {
  tipo: "critico" | "alto" | "medio" | "baixo"; mensagem: string; acao: string;
}

interface EquipeRisco {
  id: string; nome: string; score_risco: number; nivel_risco: "critico" | "alto" | "medio" | "baixo";
  cnes: string; ine: string; tipo_equipe: string;
  medico: string; enfermeiro: string; num_acs: number; area_cobertura: string;
  score_previne: number; score_scnes: number; score_cadsus: number; score_siaps: number;
  dimensoes: DimensaoRisco[];
  alertas: AlertaESF[];
  tendencia: "piorando" | "estavel" | "melhorando";
  ultima_atualizacao: string;
}

interface ResumoRisco {
  total_equipes: number; criticas: number; alto_risco: number; medio_risco: number; baixo_risco: number;
  score_medio_municipio: number; equipe_mais_critica: string; ultima_atualizacao: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const COR_RISCO: Record<string, string> = {
  critico: "#dc2626", alto: "#ea580c", medio: "#d97706", baixo: "#16a34a",
};

const BG_RISCO: Record<string, string> = {
  critico: "#fee2e2", alto: "#ffedd5", medio: "#fef3c7", baixo: "#dcfce7",
};

const LABEL_RISCO: Record<string, string> = {
  critico: "Crítico", alto: "Alto Risco", medio: "Atenção", baixo: "Baixo Risco",
};

// ── Score Ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, nivel, size = 80 }: { score: number; nivel: string; size?: number }) {
  const cor = COR_RISCO[nivel] ?? "#6b7280";
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={6}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={cor} strokeWidth={6}
        strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2 + 1} textAnchor="middle" dominantBaseline="middle" fontSize={size < 70 ? 13 : 16} fontWeight={900} fill={cor}>{score}</text>
      <text x={size/2} y={size/2 + (size < 70 ? 14 : 17)} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill="#9ca3af">risco</text>
    </svg>
  );
}

// ── Card Equipe ───────────────────────────────────────────────────────────────

function CardEquipe({ eq }: { eq: EquipeRisco }) {
  const [aberto, setAberto] = useState(false);
  const cor = COR_RISCO[eq.nivel_risco];
  const bg  = BG_RISCO[eq.nivel_risco];
  const tend = eq.tendencia;

  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}25`, borderLeft: `4px solid ${cor}`, borderRadius: 10, marginBottom: 10, overflow: "hidden" }}>
      <div onClick={() => setAberto(o => !o)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", cursor: "pointer" }}>
        <ScoreRing score={eq.score_risco} nivel={eq.nivel_risco} size={68}/>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Linha 1: nome + nível + tendência */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" as const }}>
            <span style={{ fontWeight: 800, fontSize: 14 }}>{eq.nome}</span>
            <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 12, background: bg, color: cor }}>
              {LABEL_RISCO[eq.nivel_risco]}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10, background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd" }}>
              {eq.tipo_equipe}
            </span>
            <span style={{ fontSize: 10, color: tend === "piorando" ? "#dc2626" : tend === "melhorando" ? "#16a34a" : "#9ca3af" }}>
              {tend === "piorando" ? "▼ Piorando" : tend === "melhorando" ? "▲ Melhorando" : "— Estável"}
            </span>
          </div>
          {/* Linha 2: CNES / INE / Área */}
          <div style={{ display: "flex", gap: 16, marginBottom: 6, flexWrap: "wrap" as const }}>
            <span style={{ fontSize: 10, color: "#6b7280" }}>
              <span style={{ fontWeight: 700, color: "#374151" }}>CNES:</span> {eq.cnes}
            </span>
            <span style={{ fontSize: 10, color: "#6b7280" }}>
              <span style={{ fontWeight: 700, color: "#374151" }}>INE:</span> {eq.ine}
            </span>
            <span style={{ fontSize: 10, color: "#6b7280" }}>
              <span style={{ fontWeight: 700, color: "#374151" }}>Área:</span> {eq.area_cobertura}
            </span>
          </div>
          {/* Linha 3: Profissionais */}
          <div style={{ display: "flex", gap: 14, marginBottom: 6, flexWrap: "wrap" as const }}>
            <span style={{ fontSize: 10, color: eq.medico === "Vaga em aberto" ? "#dc2626" : "#6b7280", fontWeight: eq.medico === "Vaga em aberto" ? 700 : 400 }}>
              <span style={{ fontWeight: 700, color: "#374151" }}>Médico:</span> {eq.medico}
            </span>
            <span style={{ fontSize: 10, color: "#6b7280" }}>
              <span style={{ fontWeight: 700, color: "#374151" }}>Enfermeiro:</span> {eq.enfermeiro}
            </span>
            <span style={{ fontSize: 10, color: "#6b7280" }}>
              <span style={{ fontWeight: 700, color: "#374151" }}>ACS:</span> {eq.num_acs} agentes
            </span>
          </div>
          {/* 4 sub-scores em barras */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {[
              { l: "Previne Brasil", v: eq.score_previne, cor: "#1351b4" },
              { l: "SCNES", v: eq.score_scnes, cor: "#059669" },
              { l: "CADSUS", v: eq.score_cadsus, cor: "#0369a1" },
              { l: "SIAPS", v: eq.score_siaps, cor: "#d97706" },
            ].map(s => (
              <div key={s.l}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 9, color: "#9ca3af" }}>{s.l}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: s.cor }}>{s.v}</span>
                </div>
                <div style={{ height: 4, background: "#f3f4f6", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${s.v}%`, background: s.cor, borderRadius: 2 }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {eq.alertas.filter(a => a.tipo === "critico").length > 0 &&
            <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 10, background: "#fee2e2", color: "#dc2626" }}>
              {eq.alertas.filter(a => a.tipo === "critico").length} alerta(s) crítico(s)
            </span>
          }
          {aberto ? <ChevronDown size={14} color="#9ca3af"/> : <ChevronRight size={14} color="#9ca3af"/>}
        </div>
      </div>

      {aberto && (
        <div style={{ borderTop: `1px solid ${cor}15`, background: "#fafafa", padding: "16px 18px" }}>
          {/* Ficha de identificação */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16, background: "#fff", border: "1px solid #e4e7ec", borderRadius: 8, padding: "10px 14px" }}>
            {[
              { l: "CNES",         v: eq.cnes },
              { l: "INE",          v: eq.ine },
              { l: "Tipo de equipe", v: eq.tipo_equipe },
              { l: "Nº ACS",       v: `${eq.num_acs} agentes` },
            ].map(f => (
              <div key={f.l}>
                <div style={{ fontSize: 9, color: "#9ca3af", marginBottom: 2 }}>{f.l}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>{f.v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Dimensões com peso */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Dimensões de Risco (com peso)</div>
              {eq.dimensoes.map((d, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{d.nome}</span>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 9, color: "#9ca3af" }}>peso {d.peso}%</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: COR_RISCO[d.status] ?? "#6b7280" }}>{d.score}</span>
                    </div>
                  </div>
                  <div style={{ height: 5, background: "#e5e7eb", borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${d.score}%`, background: COR_RISCO[d.status] ?? "#6b7280", borderRadius: 3 }}/>
                  </div>
                  <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 2 }}>{d.detalhes}</div>
                </div>
              ))}
            </div>
            {/* Alertas */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Alertas e Ações Recomendadas</div>
              {eq.alertas.map((a, i) => (
                <div key={i} style={{ background: BG_RISCO[a.tipo] ?? "#f9fafb", borderRadius: 8, padding: "10px 12px", marginBottom: 8, borderLeft: `3px solid ${COR_RISCO[a.tipo] ?? "#6b7280"}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COR_RISCO[a.tipo] ?? "#374151", marginBottom: 3 }}>{a.mensagem}</div>
                  <div style={{ fontSize: 10, color: "#6b7280" }}>→ {a.acao}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 8, textAlign: "right" as const }}>Última atualização: {eq.ultima_atualizacao}</div>
        </div>
      )}
    </div>
  );
}

// ── Principal ─────────────────────────────────────────────────────────────────

export default function ScoreRiscoESF() {
  const [filtro, setFiltro] = useState("todos");
  const qc = useQueryClient();

  const { data: resumo } = useQuery<ResumoRisco>({
    queryKey: ["score-risco-resumo"],
    queryFn: () => apiGet("/api/score-risco/resumo") as Promise<ResumoRisco>,
    staleTime: 300_000,
  });

  const { data: equipes = [], isLoading } = useQuery<EquipeRisco[]>({
    queryKey: ["score-risco-equipes"],
    queryFn: () => apiGet("/api/score-risco/equipes") as Promise<EquipeRisco[]>,
    staleTime: 300_000,
  });

  const recalcular = useMutation({
    mutationFn: () => apiPost("/api/score-risco/recalcular"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["score-risco-resumo"] }); qc.invalidateQueries({ queryKey: ["score-risco-equipes"] }); },
  });

  const visiveis = equipes.filter(e => filtro === "todos" || e.nivel_risco === filtro);
  const r = resumo;

  if (!isLoading && !resumo) return (
    <div style={{ padding: 24 }}>
      <NaoDisponivelBanner
        titulo="ScoreRiscoESF indisponivel"
        nota="Dados nao disponiveis — integracao pendente de configuracao no Railway."
      />
    </div>
  );

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#450a0a 0%,#b91c1c 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}><ShieldAlert size={18} color="#fff"/></div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Score de Risco por Equipe ESF</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Índice composto: Previne Brasil + SCNES + CADSUS + SIAPS · Atualização mensal via auditoria automática
            </div>
          </div>
          <button onClick={() => recalcular.mutate()} disabled={recalcular.isPending}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            <RefreshCw size={12}/>{recalcular.isPending ? "Recalculando..." : "Recalcular Scores"}
          </button>
        </div>

        {r && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginTop: 16 }}>
            {[
              { label: "Score Médio", val: r.score_medio_municipio, cor: "#fca5a5" },
              { label: "Críticas",    val: r.criticas,              cor: "#fca5a5" },
              { label: "Alto Risco",  val: r.alto_risco,            cor: "#fed7aa" },
              { label: "Atenção",     val: r.medio_risco,           cor: "#fef08a" },
              { label: "Baixo Risco", val: r.baixo_risco,           cor: "#86efac" },
            ].map(k => (
              <div key={k.label} style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "10px 14px", textAlign: "center" as const }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: k.cor }}>{k.val}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.55)" }}>{k.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "20px 28px 60px" }}>
        {/* Filtros */}
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10, alignItems: "center" }}>
          {[
            { id: "todos", l: "Todas" },
            { id: "critico", l: "Críticas" },
            { id: "alto", l: "Alto Risco" },
            { id: "medio", l: "Atenção" },
            { id: "baixo", l: "Baixo Risco" },
          ].map(f => (
            <button key={f.id} onClick={() => setFiltro(f.id)}
              style={{ padding: "5px 14px", fontSize: 11, borderRadius: 20, border: `1px solid ${filtro===f.id ? "#b91c1c" : "#d1d5db"}`, background: filtro===f.id ? "#fee2e2" : "#fff", color: filtro===f.id ? "#b91c1c" : "#374151", cursor: "pointer", fontWeight: filtro===f.id ? 700 : 400 }}>
              {f.l}
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af" }}>{visiveis.length} equipe(s)</span>
        </div>

        {isLoading
          ? <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Calculando scores...</div>
          : visiveis.sort((a, b) => b.score_risco - a.score_risco).map(eq => <CardEquipe key={eq.id} eq={eq}/>)
        }
      </div>
    </div>
  );
}
