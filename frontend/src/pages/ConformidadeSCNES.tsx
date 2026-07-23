// src/pages/ConformidadeSCNES.tsx — Score de Conformidade Cadastral SCNES por Equipe ESF
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2, Users, RefreshCw, AlertTriangle, CheckCircle,
  ChevronDown, ChevronRight, TrendingUp, TrendingDown, Search,
  Edit3, Star, Info,
} from "lucide-react";
import { apiGet, apiPost } from "../lib/api";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface EquipeESF {
  ine: string; nome: string; tipo: string; unidade: string; cnes: string;
  municipio: string; uf: string; status_cnes: "ativo" | "inativo" | "suspenso";
  score_geral: number; tendencia: "melhora" | "piora" | "estavel";
  dimensoes: Record<string, DimensaoScore>;
  pendencias: Pendencia[];
  ultima_atualizacao: string; proxima_verificacao: string;
}

interface DimensaoScore {
  score: number; peso: number; label: string; itens_ok: number; itens_total: number; observacao: string;
}

interface Pendencia {
  id: number; categoria: string; descricao: string; criticidade: "critica" | "alta" | "media" | "baixa";
  prazo_legal: string | null; status: "pendente" | "em_correcao" | "resolvida";
}

interface ResumoConformidade {
  competencia: string; score_municipio: number; total_equipes: number;
  equipes_conformes: number; equipes_criticas: number;
  distribuicao: { faixa: string; qtd: number; cor: string }[];
  top_pendencias: { categoria: string; qtd: number }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const CRIT_COR: Record<string, string> = {
  critica: "#dc2626", alta: "#d97706", media: "#1351b4", baixa: "#6b7280",
};
const CRIT_LABEL: Record<string, string> = {
  critica: "Crítica", alta: "Alta", media: "Média", baixa: "Baixa",
};

function scoreCor(s: number) {
  return s >= 90 ? "#16a34a" : s >= 70 ? "#d97706" : "#dc2626";
}

function ScoreCircle({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size - 8) / 2; const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  const cor = scoreCor(score);
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={4}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={cor} strokeWidth={4}
        strokeDasharray={`${dash} ${c}`} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        style={{ fill: cor, fontSize: size/3.4, fontWeight: 800, fontFamily: "monospace" }}>{score}</text>
    </svg>
  );
}

// ── Card Equipe ───────────────────────────────────────────────────────────────

function CardEquipe({ eq }: { eq: EquipeESF }) {
  const [aberto, setAberto] = useState(false);
  const cor = scoreCor(eq.score_geral);

  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}30`, borderLeft: `4px solid ${cor}`, borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
      {/* Header */}
      <div onClick={() => setAberto(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 18px", cursor: "pointer" }}>
        <ScoreCircle score={eq.score_geral} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{eq.nome}</span>
            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 12, background: eq.status_cnes==="ativo"?"#dcfce7":"#fee2e2", color: eq.status_cnes==="ativo"?"#16a34a":"#dc2626" }}>
              {eq.status_cnes.toUpperCase()}
            </span>
            {eq.tendencia === "melhora" ? <TrendingUp size={13} color="#16a34a"/> : eq.tendencia === "piora" ? <TrendingDown size={13} color="#dc2626"/> : <span style={{fontSize:10,color:"#9ca3af"}}>—</span>}
          </div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>
            INE {eq.ine} · CNES {eq.cnes} · {eq.unidade} · {eq.tipo}
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#dc2626" }}>
              {eq.pendencias.filter(p => p.status !== "resolvida").length}
            </div>
            <div style={{ fontSize: 9, color: "#9ca3af" }}>pendências</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: cor }}>
              {eq.score_geral >= 90 ? "✓" : eq.score_geral >= 70 ? "!" : "✗"}
            </div>
            <div style={{ fontSize: 9, color: "#9ca3af" }}>{eq.score_geral >= 90 ? "Conforme" : eq.score_geral >= 70 ? "Atenção" : "Crítico"}</div>
          </div>
          {aberto ? <ChevronDown size={14} color="#9ca3af"/> : <ChevronRight size={14} color="#9ca3af"/>}
        </div>
      </div>

      {/* Detalhe */}
      {aberto && (
        <div style={{ borderTop: `1px solid ${cor}20`, padding: "14px 18px", background: "#fafafa" }}>
          {/* Dimensões */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Dimensões de Conformidade</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 8 }}>
              {Object.entries(eq.dimensoes).map(([key, d]) => {
                const dCor = scoreCor(d.score);
                return (
                  <div key={key} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{d.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: dCor }}>{d.score}</span>
                    </div>
                    <div style={{ height: 5, background: "#e5e7eb", borderRadius: 3, marginBottom: 5 }}>
                      <div style={{ width: `${d.score}%`, height: "100%", background: dCor, borderRadius: 3 }}/>
                    </div>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>{d.itens_ok}/{d.itens_total} itens · peso {d.peso}%</div>
                    {d.observacao && <div style={{ fontSize: 10, color: "#d97706", marginTop: 3 }}>⚠ {d.observacao}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pendências */}
          {eq.pendencias.filter(p => p.status !== "resolvida").length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "#dc2626" }}>
                Pendências Ativas
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {eq.pendencias.filter(p => p.status !== "resolvida").map(p => (
                  <div key={p.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#fff", border: `1px solid ${CRIT_COR[p.criticidade]}30`, borderRadius: 7, padding: "8px 12px" }}>
                    <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 10, background: `${CRIT_COR[p.criticidade]}15`, color: CRIT_COR[p.criticidade], flexShrink: 0, marginTop: 1 }}>
                      {CRIT_LABEL[p.criticidade]}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 2 }}>{p.descricao}</div>
                      <div style={{ fontSize: 10, color: "#9ca3af" }}>
                        {p.categoria}{p.prazo_legal ? ` · Prazo: ${p.prazo_legal}` : ""}
                        {p.status === "em_correcao" && " · ⚡ Em correção"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 10 }}>
            Atualizado {eq.ultima_atualizacao} · Próxima verificação {eq.proxima_verificacao}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Principal ─────────────────────────────────────────────────────────────────

export default function ConformidadeSCNES() {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [abaAtiva, setAbaAtiva] = useState<"equipes" | "resumo">("equipes");
  const qc = useQueryClient();

  const { data: resumo, isLoading: loadResumo } = useQuery<ResumoConformidade>({
    queryKey: ["scnes-resumo"],
    queryFn: () => apiGet("/api/scnes-conformidade/resumo") as Promise<ResumoConformidade>,
    staleTime: 60_000,
  });

  const { data: equipes = [], isLoading: loadEquipes } = useQuery<EquipeESF[]>({
    queryKey: ["scnes-equipes", filtroStatus],
    queryFn: () => apiGet("/api/scnes-conformidade/equipes", { status: filtroStatus }) as Promise<EquipeESF[]>,
    staleTime: 60_000,
  });

  const sincronizar = useMutation({
    mutationFn: () => apiPost("/api/scnes-conformidade/sincronizar"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["scnes-resumo"] }); qc.invalidateQueries({ queryKey: ["scnes-equipes"] }); },
  });

  const equipesVisiveis = equipes.filter(e =>
    !busca || e.nome.toLowerCase().includes(busca.toLowerCase()) || e.ine.includes(busca) || e.cnes.includes(busca)
  );

  const r = resumo;

  const ABAS: { id: "equipes" | "resumo"; label: string }[] = [
    { id: "equipes", label: "Equipes ESF" },
    { id: "resumo", label: "Panorama Municipal" },
  ];

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#065f46 0%,#059669 100%)", padding: "18px 28px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}>
                <Building2 size={18} color="#fff"/>
              </div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Conformidade Cadastral SCNES</span>
              {r && (
                <span style={{ background: "rgba(255,255,255,.2)", color: "#fff", borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                  {r.competencia}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Score de conformidade SCNES/CNES por equipe ESF · Vinculação · Profissionais · CH
            </div>
          </div>
          <button onClick={() => sincronizar.mutate()}
            disabled={sincronizar.isPending}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700, opacity: sincronizar.isPending ? 0.7 : 1 }}>
            <RefreshCw size={13} className={sincronizar.isPending ? "spin" : ""}/>
            {sincronizar.isPending ? "Sincronizando..." : "Sincronizar SCNES"}
          </button>
        </div>

        {/* KPIs */}
        {r && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginTop: 16 }}>
            {[
              { label: "Score Municipal", val: r.score_municipio, suf: "", cor: scoreCor(r.score_municipio) + "dd" },
              { label: "Total Equipes", val: r.total_equipes, suf: "", cor: "#fff" },
              { label: "Conformes ≥90", val: r.equipes_conformes, suf: "", cor: "#86efac" },
              { label: "Críticas <70", val: r.equipes_criticas, suf: "", cor: "#fca5a5" },
              { label: "Taxa Conformidade", val: r.total_equipes > 0 ? Math.round((r.equipes_conformes/r.total_equipes)*100) : 0, suf: "%", cor: "#a7f3d0" },
            ].map(k => (
              <div key={k.label} style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: k.cor }}>{k.val}{k.suf}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)" }}>{k.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Abas */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e4e7ec", padding: "0 28px", display: "flex", gap: 0 }}>
        {ABAS.map(a => (
          <button key={a.id} onClick={() => setAbaAtiva(a.id)}
            style={{ padding: "12px 18px", fontSize: 13, fontWeight: abaAtiva===a.id ? 700 : 400, background: "none", border: "none", borderBottom: abaAtiva===a.id ? "2px solid #059669" : "2px solid transparent", color: abaAtiva===a.id ? "#059669" : "#6b7280", cursor: "pointer" }}>
            {a.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "20px 28px 60px" }}>
        {abaAtiva === "resumo" && r && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Distribuição por faixa */}
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Distribuição por Score</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {r.distribuicao.map(d => (
                  <div key={d.faixa}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: "#374151" }}>{d.faixa}</span>
                      <span style={{ fontWeight: 700, color: d.cor }}>{d.qtd} equipes</span>
                    </div>
                    <div style={{ height: 8, background: "#e5e7eb", borderRadius: 4 }}>
                      <div style={{ width: `${r.total_equipes>0?(d.qtd/r.total_equipes)*100:0}%`, height: "100%", background: d.cor, borderRadius: 4 }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Pendências */}
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Top Pendências Municipais</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {r.top_pendencias.map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: "#d97706", minWidth: 24 }}>#{i+1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{p.categoria}</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#dc2626" }}>{p.qtd}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {abaAtiva === "equipes" && (
          <>
            {/* Filtros */}
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap" as const, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: "7px 12px" }}>
                <Search size={12} color="#9ca3af"/>
                <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar equipe, INE ou CNES..."
                  style={{ border: "none", outline: "none", fontSize: 12, width: 200, background: "transparent" }}/>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { id: "todos", label: "Todas" },
                  { id: "criticas", label: "Críticas (<70)" },
                  { id: "atencao", label: "Atenção (70–89)" },
                  { id: "conformes", label: "Conformes (≥90)" },
                ].map(f => (
                  <button key={f.id} onClick={() => setFiltroStatus(f.id)}
                    style={{ padding: "5px 12px", fontSize: 11, borderRadius: 20, border: `1px solid ${filtroStatus===f.id?"#059669":"#d1d5db"}`, background: filtroStatus===f.id?"#d1fae5":"#fff", color: filtroStatus===f.id?"#059669":"#374151", cursor: "pointer", fontWeight: filtroStatus===f.id?700:400 }}>
                    {f.label}
                  </button>
                ))}
              </div>
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af" }}>{equipesVisiveis.length} equipes</span>
            </div>

            {/* Lista */}
            {(loadEquipes || loadResumo) ? (
              <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando equipes SCNES...</div>
            ) : (
              equipesVisiveis.length === 0
                ? <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}><Building2 size={32} color="#d1d5db" style={{ marginBottom: 8 }}/><br/>Nenhuma equipe encontrada.</div>
                : equipesVisiveis.map(e => <CardEquipe key={e.ine} eq={e}/>)
            )}
          </>
        )}
      </div>
    </div>
  );
}
