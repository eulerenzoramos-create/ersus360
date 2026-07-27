// src/pages/ConformidadeSCNES.tsx — Conformidade SCNES com 6 integrações
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2, RefreshCw, AlertTriangle, CheckCircle,
  ChevronDown, ChevronRight, TrendingUp, TrendingDown, Search,
  Bell, History, Zap, ClipboardList, BarChart3, XCircle,
  Clock, Calendar, ArrowRightLeft, Check,
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

interface AlertaCNES {
  id: string; equipe: string; ine: string | null; cnes: string;
  tipo: string; titulo: string; descricao: string; severidade: string;
  data_expiracao: string; dias_vencido: number; acao_recomendada: string;
  status: string;
}

interface ItemHistorico {
  id: string; data: string; hora: string; equipe: string;
  tipo_alteracao: string; campo: string; valor_anterior: string; valor_novo: string;
  profissional: string; responsavel_alteracao: string; status: string; impacto: string;
}

interface ExecucaoSync {
  id: string; data: string; hora: string; duracao_seg: number; status: string;
  equipes_atualizadas: number; pendencias_novas: number; pendencias_resolvidas: number;
  competencia: string; erro?: string;
}

interface TarefaCorrecao {
  id: string; equipe: string; ine: string; titulo: string; descricao: string;
  responsavel: string; prazo: string; prioridade: string; status: string;
  passos: { ordem: number; descricao: string; feito: boolean }[];
  dimensao_afetada: string; ganho_estimado_score: number;
}

interface Divergencia {
  equipe: string; ubs: string; ine: string; cnes: string; campo: string;
  profissional?: string; cbo?: string;
  valor_scnes: string; valor_pec: string; status: "convergente" | "divergente" | "alerta";
  criticidade?: string; tipo: string; orientacao?: string;
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

      {aberto && (
        <div style={{ borderTop: `1px solid ${cor}20`, padding: "14px 18px", background: "#fafafa" }}>
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

          {eq.pendencias.filter(p => p.status !== "resolvida").length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "#dc2626" }}>Pendências Ativas</div>
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

// ── Aba 1: Alertas CNES ───────────────────────────────────────────────────────

function AbaAlertasCNES() {
  const { data, isLoading } = useQuery<{ total: number; criticos: number; altos: number; medios: number; alertas: AlertaCNES[]; ultima_verificacao: string }>({
    queryKey: ["scnes-alertas"],
    queryFn: () => apiGet("/api/scnes-conformidade/alertas-cnes") as Promise<{ total: number; criticos: number; altos: number; medios: number; alertas: AlertaCNES[]; ultima_verificacao: string }>,
    staleTime: 60_000,
  });

  if (isLoading) return <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando alertas...</div>;
  if (!data) return null;

  const SEV_COR: Record<string, string> = { critica: "#dc2626", alta: "#d97706", media: "#1351b4" };
  const SEV_BG: Record<string, string>  = { critica: "#fff1f2", alta: "#fffbeb", media: "#eff6ff" };
  const SEV_LABEL: Record<string, string> = { critica: "Crítico", alta: "Alto", media: "Médio" };

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total de Alertas",  val: data.total,    cor: "#374151", bg: "#f9fafb" },
          { label: "Críticos",          val: data.criticos, cor: "#dc2626", bg: "#fff1f2" },
          { label: "Altos",             val: data.altos,    cor: "#d97706", bg: "#fffbeb" },
          { label: "Médios",            val: data.medios,   cor: "#1351b4", bg: "#eff6ff" },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.cor}20`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: k.cor }}>{k.val}</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 12 }}>
        Última verificação: {data.ultima_verificacao}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {data.alertas.map(a => {
          const cor = SEV_COR[a.severidade] ?? "#6b7280";
          const bg  = SEV_BG[a.severidade]  ?? "#f9fafb";
          return (
            <div key={a.id} style={{ background: "#fff", border: `1px solid ${cor}30`, borderLeft: `4px solid ${cor}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", background: bg }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 10, background: `${cor}20`, color: cor }}>
                        {SEV_LABEL[a.severidade]}
                      </span>
                      <span style={{ fontSize: 9, color: "#9ca3af" }}>CNES {a.cnes}</span>
                      {a.ine && <span style={{ fontSize: 9, color: "#9ca3af" }}>INE {a.ine}</span>}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e", marginBottom: 2 }}>{a.titulo}</div>
                    <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 6 }}>{a.equipe}</div>
                    <div style={{ fontSize: 12, color: "#374151" }}>{a.descricao}</div>
                  </div>
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    {a.dias_vencido > 0 ? (
                      <>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#dc2626" }}>{a.dias_vencido}d</div>
                        <div style={{ fontSize: 9, color: "#dc2626" }}>em atraso</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#d97706" }}>{Math.abs(a.dias_vencido)}d</div>
                        <div style={{ fontSize: 9, color: "#d97706" }}>para vencer</div>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ background: `${cor}12`, borderRadius: 8, padding: "8px 12px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <AlertTriangle size={12} color={cor} style={{ marginTop: 1, flexShrink: 0 }}/>
                  <span style={{ fontSize: 11, color: "#374151" }}><strong>Ação recomendada:</strong> {a.acao_recomendada}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Aba 2: Histórico de Alterações ────────────────────────────────────────────

function AbaHistorico() {
  const { data, isLoading } = useQuery<{ total_alteracoes: number; aprovadas: number; pendentes_regularizacao: number; periodo: string; alteracoes: ItemHistorico[] }>({
    queryKey: ["scnes-historico"],
    queryFn: () => apiGet("/api/scnes-conformidade/historico") as Promise<{ total_alteracoes: number; aprovadas: number; pendentes_regularizacao: number; periodo: string; alteracoes: ItemHistorico[] }>,
    staleTime: 60_000,
  });

  if (isLoading) return <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando histórico...</div>;
  if (!data) return null;

  const TIPO_LABEL: Record<string, string> = {
    atualizacao_ch: "Carga Horária",
    atualizacao_cbo: "Atualiz. CBO",
    desvinculacao: "Desvinculação",
    novo_profissional: "Novo Prof.",
    atualizacao_area: "Área Atuação",
    atualizacao_formacao: "Formação",
    sincronizacao: "Sincronização",
  };

  const TIPO_COR: Record<string, string> = {
    atualizacao_ch: "#1351b4", atualizacao_cbo: "#7c3aed", desvinculacao: "#dc2626",
    novo_profissional: "#16a34a", atualizacao_area: "#d97706", atualizacao_formacao: "#0891b2",
    sincronizacao: "#059669",
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total de Alterações", val: data.total_alteracoes, cor: "#374151", bg: "#f9fafb" },
          { label: "Aprovadas",           val: data.aprovadas,        cor: "#16a34a", bg: "#f0fdf4" },
          { label: "Pend. Regularização", val: data.pendentes_regularizacao, cor: "#dc2626", bg: "#fff1f2" },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.cor}20`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: k.cor }}>{k.val}</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 14 }}>Período: {data.periodo}</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {data.alteracoes.map((h, i) => {
          const cor = TIPO_COR[h.tipo_alteracao] ?? "#6b7280";
          const isPendente = h.status === "pendente_regularizacao";
          return (
            <div key={h.id} style={{ display: "flex", gap: 0 }}>
              {/* Linha do tempo */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: 16, flexShrink: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: cor + "20", border: `2px solid ${cor}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 8 }}>
                  <History size={13} color={cor}/>
                </div>
                {i < data.alteracoes.length - 1 && <div style={{ width: 2, flex: 1, background: "#e5e7eb", minHeight: 16 }}/>}
              </div>

              <div style={{ flex: 1, background: "#fff", border: `1px solid #e4e7ec`, borderRadius: 10, padding: "12px 16px", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 8, background: cor+"15", color: cor }}>{TIPO_LABEL[h.tipo_alteracao] ?? h.tipo_alteracao}</span>
                  <span style={{ fontSize: 10, color: "#9ca3af" }}>{h.data} às {h.hora}</span>
                  {isPendente && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 8, background: "#fee2e2", color: "#dc2626" }}>Pend. Regularização</span>}
                  {!isPendente && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 8, background: "#dcfce7", color: "#16a34a" }}>Aprovada</span>}
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e", marginBottom: 2 }}>{h.campo}</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{h.equipe}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 11, flexWrap: "wrap" }}>
                  <span style={{ background: "#fee2e2", color: "#dc2626", padding: "2px 8px", borderRadius: 6, fontFamily: "monospace" }}>{h.valor_anterior}</span>
                  <span style={{ color: "#9ca3af" }}>→</span>
                  <span style={{ background: "#dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: 6, fontFamily: "monospace" }}>{h.valor_novo}</span>
                </div>
                {h.impacto && (
                  <div style={{ marginTop: 6, fontSize: 10, color: "#059669", display: "flex", alignItems: "center", gap: 4 }}>
                    <TrendingUp size={10}/> {h.impacto}
                  </div>
                )}
                <div style={{ marginTop: 4, fontSize: 10, color: "#9ca3af" }}>Por: {h.responsavel_alteracao}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Aba 3: Sincronização Automática ───────────────────────────────────────────

function AbaSincronizacao() {
  const qc = useQueryClient();

  interface SyncData {
    status_api: string;
    frequencia: string;
    ultima_sincronizacao: { data: string; hora: string; status: string; duracao_seg: number; competencia: string };
    proxima_sincronizacao: string;
    historico_execucoes: ExecucaoSync[];
    endpoints_scnes: { nome: string; url: string; status: string }[];
    taxa_sucesso: number;
  }

  const { data, isLoading } = useQuery<SyncData>({
    queryKey: ["scnes-sincronizacao"],
    queryFn: () => apiGet("/api/scnes-conformidade/sincronizacao") as Promise<SyncData>,
    staleTime: 30_000,
  });

  const executarSync = useMutation({
    mutationFn: () => apiPost("/api/scnes-conformidade/sincronizar"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scnes-sincronizacao"] }),
  });

  if (isLoading) return <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando sincronização...</div>;
  if (!data) return null;

  return (
    <div>
      {/* Status geral */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ display: "flex", align: "center", gap: 10, marginBottom: 14 }}>
            <Zap size={16} color="#059669"/>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Status da Integração SCNES API</span>
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <div style={{ background: data.status_api === "online" ? "#dcfce7" : "#fee2e2", color: data.status_api === "online" ? "#16a34a" : "#dc2626", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700 }}>
              ● {data.status_api === "online" ? "API Online" : "API Offline"}
            </div>
            <div style={{ background: "#f0fdf4", color: "#16a34a", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700 }}>
              {data.taxa_sucesso}% de sucesso
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
            <strong>Frequência:</strong> {data.frequencia}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
            <strong>Última execução:</strong> {data.ultima_sincronizacao.data} às {data.ultima_sincronizacao.hora} ({data.ultima_sincronizacao.duracao_seg}s)
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 14 }}>
            <strong>Próxima execução:</strong> {data.proxima_sincronizacao}
          </div>
          <button
            onClick={() => executarSync.mutate()}
            disabled={executarSync.isPending}
            style={{ display: "flex", alignItems: "center", gap: 6, background: executarSync.isPending ? "#9ca3af" : "#059669", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", cursor: executarSync.isPending ? "default" : "pointer", fontSize: 12, fontWeight: 700 }}>
            <RefreshCw size={13}/>
            {executarSync.isPending ? "Sincronizando..." : "Executar Agora"}
          </button>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Endpoints SCNES</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.endpoints_scnes.map(ep => (
              <div key={ep.nome} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#f8fafc", borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{ep.nome}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", fontFamily: "monospace" }}>{ep.url}</div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: ep.status === "online" ? "#dcfce7" : "#fee2e2", color: ep.status === "online" ? "#16a34a" : "#dc2626" }}>
                  {ep.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Histórico de execuções */}
      <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Histórico de Execuções</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {data.historico_execucoes.map((ex, i) => (
            <div key={ex.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: i < data.historico_execucoes.length - 1 ? "1px solid #f3f4f6" : "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: ex.status === "sucesso" ? "#dcfce7" : "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {ex.status === "sucesso" ? <CheckCircle size={14} color="#16a34a"/> : <XCircle size={14} color="#dc2626"/>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                  {ex.data} às {ex.hora} — Competência {ex.competencia}
                </div>
                {ex.erro && <div style={{ fontSize: 10, color: "#dc2626" }}>{ex.erro}</div>}
                {!ex.erro && (
                  <div style={{ fontSize: 10, color: "#6b7280" }}>
                    {ex.equipes_atualizadas} equipes · {ex.pendencias_novas} pend. novas · {ex.pendencias_resolvidas} resolvidas
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0 }}>
                {ex.duracao_seg > 0 ? `${ex.duracao_seg}s` : "—"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Aba 4: Plano de Correção Cadastral ────────────────────────────────────────

function AbaPlanoCorrecao() {
  interface PlanoData {
    total_tarefas: number; abertos: number; em_andamento: number;
    concluidos: number; ganho_potencial_score: number; tarefas: TarefaCorrecao[];
  }

  const qc = useQueryClient();
  const { data, isLoading } = useQuery<PlanoData>({
    queryKey: ["scnes-plano"],
    queryFn: () => apiGet("/api/scnes-conformidade/plano-correcao") as Promise<PlanoData>,
    staleTime: 30_000,
  });

  const resolver = useMutation({
    mutationFn: (id: string) => apiPost(`/api/scnes-conformidade/plano-correcao/${id}/resolver`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scnes-plano"] }),
  });

  const [expandido, setExpandido] = useState<string | null>(null);

  if (isLoading) return <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando plano...</div>;
  if (!data) return null;

  const PRIO_COR: Record<string, string> = { critica: "#dc2626", alta: "#d97706", media: "#1351b4", baixa: "#6b7280" };
  const STATUS_COR: Record<string, string> = { aberto: "#dc2626", em_andamento: "#d97706", concluido: "#16a34a" };
  const STATUS_LABEL: Record<string, string> = { aberto: "Aberto", em_andamento: "Em Andamento", concluido: "Concluído" };

  const colunas = [
    { id: "aberto",       label: "Em Aberto",     cor: "#dc2626" },
    { id: "em_andamento", label: "Em Andamento",  cor: "#d97706" },
    { id: "concluido",    label: "Concluído",      cor: "#16a34a" },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total de Tarefas",     val: data.total_tarefas, cor: "#374151", bg: "#f9fafb" },
          { label: "Em Aberto",            val: data.abertos,       cor: "#dc2626", bg: "#fff1f2" },
          { label: "Em Andamento",         val: data.em_andamento,  cor: "#d97706", bg: "#fffbeb" },
          { label: "Ganho Score Potencial",val: `+${data.ganho_potencial_score}pts`, cor: "#059669", bg: "#f0fdf4" },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.cor}20`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: k.cor }}>{k.val}</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Kanban */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {colunas.map(col => {
          const tarefas = data.tarefas.filter(t => t.status === col.id);
          return (
            <div key={col.id} style={{ background: "#f8fafc", border: `1px solid ${col.cor}20`, borderTop: `3px solid ${col.cor}`, borderRadius: 10, padding: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: col.cor }}>{col.label}</span>
                <span style={{ background: col.cor, color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{tarefas.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {tarefas.map(t => {
                  const aberto = expandido === t.id;
                  const passosFeitos = t.passos.filter(p => p.feito).length;
                  return (
                    <div key={t.id} style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 8, overflow: "hidden" }}>
                      <div onClick={() => setExpandido(aberto ? null : t.id)} style={{ padding: "10px 12px", cursor: "pointer" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 8, background: `${PRIO_COR[t.prioridade]}15`, color: PRIO_COR[t.prioridade] }}>
                            {t.prioridade.toUpperCase()}
                          </span>
                          <span style={{ fontSize: 9, color: "#9ca3af" }}>+{t.ganho_estimado_score}pts</span>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>{t.titulo}</div>
                        <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 6 }}>{t.equipe}</div>
                        <div style={{ height: 4, background: "#e5e7eb", borderRadius: 2 }}>
                          <div style={{ width: `${(passosFeitos / t.passos.length) * 100}%`, height: "100%", background: col.cor, borderRadius: 2 }}/>
                        </div>
                        <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 3 }}>{passosFeitos}/{t.passos.length} passos · Prazo {t.prazo}</div>
                      </div>
                      {aberto && (
                        <div style={{ borderTop: "1px solid #f3f4f6", padding: "10px 12px", background: "#fafafa" }}>
                          <div style={{ fontSize: 11, color: "#374151", marginBottom: 8 }}>{t.descricao}</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                            {t.passos.map(p => (
                              <div key={p.ordem} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                                <div style={{ width: 14, height: 14, borderRadius: "50%", background: p.feito ? "#16a34a" : "#e5e7eb", border: `1px solid ${p.feito ? "#16a34a" : "#d1d5db"}`, flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  {p.feito && <Check size={8} color="#fff"/>}
                                </div>
                                <span style={{ fontSize: 10, color: p.feito ? "#9ca3af" : "#374151", textDecoration: p.feito ? "line-through" : "none" }}>{p.descricao}</span>
                              </div>
                            ))}
                          </div>
                          {t.status !== "concluido" && (
                            <button
                              onClick={() => resolver.mutate(t.id)}
                              disabled={resolver.isPending}
                              style={{ width: "100%", padding: "7px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                              Marcar como Concluída
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Aba 5: Divergência SCNES × PEC ───────────────────────────────────────────

function AbaDivergenciaPEC() {
  interface DivData {
    total_campos: number; convergentes: number; divergentes: number;
    alertas: number; criticas: number; taxa_convergencia: number;
    competencia_scnes: string; competencia_pec: string;
    divergencias: Divergencia[]; ultima_comparacao: string;
  }

  const { data, isLoading } = useQuery<DivData>({
    queryKey: ["scnes-divergencia"],
    queryFn: () => apiGet("/api/scnes-conformidade/divergencia-pec") as Promise<DivData>,
    staleTime: 60_000,
  });

  const [filtro, setFiltro] = useState<"todos" | "divergente" | "alerta" | "convergente">("todos");

  if (isLoading) return <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando comparativo...</div>;
  if (!data) return null;

  const STATUS_COR: Record<string, string>   = { convergente: "#16a34a", divergente: "#dc2626", alerta: "#d97706" };
  const STATUS_BG: Record<string, string>    = { convergente: "#f0fdf4",  divergente: "#fff1f2",  alerta: "#fffbeb" };
  const STATUS_LABEL: Record<string, string> = { convergente: "Convergente", divergente: "Divergente", alerta: "Alerta" };

  const filtradas = data.divergencias.filter(d => filtro === "todos" || d.status === filtro);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Campos",       val: data.total_campos,        cor: "#374151", bg: "#f9fafb" },
          { label: "Convergentes",       val: data.convergentes,        cor: "#16a34a", bg: "#f0fdf4" },
          { label: "Divergentes",        val: data.divergentes,         cor: "#dc2626", bg: "#fff1f2" },
          { label: "Alertas",            val: data.alertas,             cor: "#d97706", bg: "#fffbeb" },
          { label: "Taxa Convergência",  val: `${data.taxa_convergencia}%`, cor: "#1351b4", bg: "#eff6ff" },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.cor}20`, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: k.cor }}>{k.val}</div>
            <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 16, fontSize: 11, color: "#1e40af" }}>
        <span><strong>SCNES:</strong> Competência {data.competencia_scnes}</span>
        <ArrowRightLeft size={12} style={{ marginTop: 1 }}/>
        <span><strong>PEC:</strong> Competência {data.competencia_pec}</span>
        <span style={{ marginLeft: "auto", color: "#9ca3af" }}>Última comparação: {data.ultima_comparacao}</span>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {(["todos", "divergente", "alerta", "convergente"] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            style={{ padding: "5px 12px", fontSize: 11, borderRadius: 20, border: `1px solid ${filtro===f?"#059669":"#d1d5db"}`, background: filtro===f?"#d1fae5":"#fff", color: filtro===f?"#059669":"#374151", cursor: "pointer", fontWeight: filtro===f?700:400 }}>
            {f === "todos" ? "Todos" : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtradas.map((d, i) => {
          const cor = STATUS_COR[d.status];
          const bg  = STATUS_BG[d.status];
          return (
            <div key={i} style={{ background: "#fff", border: `1px solid ${cor}30`, borderLeft: `3px solid ${cor}`, borderRadius: 8, padding: "12px 16px" }}>
              {/* Linha de badges */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 8, background: bg, color: cor }}>
                  {STATUS_LABEL[d.status]}
                </span>
                {d.criticidade && (
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 8, background: `${CRIT_COR[d.criticidade]}15`, color: CRIT_COR[d.criticidade] }}>
                    {CRIT_LABEL[d.criticidade]}
                  </span>
                )}
                <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}>{d.campo}</span>
              </div>

              {/* Equipe + UBS */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#1a1a2e" }}>{d.equipe}</span>
                {d.ubs && (
                  <span style={{ fontSize: 10, color: "#6b7280", background: "#f1f5f9", padding: "1px 8px", borderRadius: 10 }}>
                    {d.ubs}
                  </span>
                )}
                <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: "auto" }}>INE: {d.ine}</span>
              </div>

              {/* Profissional + CBO */}
              {d.profissional && d.profissional !== "—" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "5px 10px", background: "#f8fafc", borderRadius: 6, border: "1px solid #e5e7eb" }}>
                  <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, flexShrink: 0 }}>Profissional:</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#1e293b" }}>{d.profissional}</span>
                  {d.cbo && d.cbo !== "—" && (
                    <span style={{ fontSize: 10, color: "#64748b", marginLeft: 6, borderLeft: "1px solid #cbd5e1", paddingLeft: 8 }}>{d.cbo}</span>
                  )}
                </div>
              )}

              {/* Comparativo SCNES × PEC */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
                <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 10px" }}>
                  <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 700, marginBottom: 2 }}>SCNES</div>
                  <div style={{ fontSize: 11, color: "#374151", fontFamily: "monospace" }}>{d.valor_scnes}</div>
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 10px" }}>
                  <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 700, marginBottom: 2 }}>PEC</div>
                  <div style={{ fontSize: 11, color: "#374151", fontFamily: "monospace" }}>{d.valor_pec}</div>
                </div>
              </div>

              {d.orientacao && (
                <div style={{ marginTop: 8, background: `${cor}10`, borderRadius: 6, padding: "6px 10px", fontSize: 10, color: "#374151" }}>
                  <strong>Orientação:</strong> {d.orientacao}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Página Principal ──────────────────────────────────────────────────────────

type AbaId = "equipes" | "resumo" | "alertas" | "historico" | "sincronizacao" | "plano" | "divergencia";

export default function ConformidadeSCNES() {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [abaAtiva, setAbaAtiva] = useState<AbaId>("equipes");
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

  const ABAS: { id: AbaId; label: string; icon: React.ReactNode }[] = [
    { id: "equipes",       label: "Equipes ESF",       icon: <Building2 size={12}/> },
    { id: "resumo",        label: "Panorama",          icon: <BarChart3 size={12}/> },
    { id: "alertas",       label: "Alertas CNES",      icon: <Bell size={12}/> },
    { id: "historico",     label: "Histórico",         icon: <History size={12}/> },
    { id: "sincronizacao", label: "Sincronização",     icon: <Zap size={12}/> },
    { id: "plano",         label: "Plano de Correção", icon: <ClipboardList size={12}/> },
    { id: "divergencia",   label: "SCNES × PEC",       icon: <ArrowRightLeft size={12}/> },
  ];

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#065f46 0%,#059669 100%)", padding: "18px 28px" }}>
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
              Score · Alertas · Histórico · Sincronização · Plano de Correção · Divergência SCNES×PEC
            </div>
          </div>
          <button onClick={() => sincronizar.mutate()}
            disabled={sincronizar.isPending}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700, opacity: sincronizar.isPending ? 0.7 : 1 }}>
            <RefreshCw size={13}/>
            {sincronizar.isPending ? "Sincronizando..." : "Sincronizar SCNES"}
          </button>
        </div>

        {r && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginTop: 16 }}>
            {[
              { label: "Score Municipal",   val: r.score_municipio, suf: "", cor: scoreCor(r.score_municipio) + "dd" },
              { label: "Total Equipes",     val: r.total_equipes,   suf: "", cor: "#fff" },
              { label: "Conformes ≥90",     val: r.equipes_conformes, suf: "", cor: "#86efac" },
              { label: "Críticas <70",      val: r.equipes_criticas,  suf: "", cor: "#fca5a5" },
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
      <div style={{ background: "#fff", borderBottom: "1px solid #e4e7ec", padding: "0 28px", display: "flex", gap: 0, overflowX: "auto" }}>
        {ABAS.map(a => (
          <button key={a.id} onClick={() => setAbaAtiva(a.id)}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "12px 16px", fontSize: 12, fontWeight: abaAtiva===a.id ? 700 : 400, background: "none", border: "none", borderBottom: abaAtiva===a.id ? "2px solid #059669" : "2px solid transparent", color: abaAtiva===a.id ? "#059669" : "#6b7280", cursor: "pointer", whiteSpace: "nowrap" }}>
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "20px 28px 60px" }}>

        {/* Aba: Equipes ESF */}
        {abaAtiva === "equipes" && (
          <>
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap" as const, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: "7px 12px" }}>
                <Search size={12} color="#9ca3af"/>
                <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar equipe, INE ou CNES..."
                  style={{ border: "none", outline: "none", fontSize: 12, width: 200, background: "transparent" }}/>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { id: "todos",     label: "Todas" },
                  { id: "criticas",  label: "Críticas (<70)" },
                  { id: "atencao",   label: "Atenção (70–89)" },
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

            {(loadEquipes || loadResumo) ? (
              <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando equipes SCNES...</div>
            ) : (
              equipesVisiveis.length === 0
                ? <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}><Building2 size={32} color="#d1d5db" style={{ marginBottom: 8 }}/><br/>Nenhuma equipe encontrada.</div>
                : equipesVisiveis.map(e => <CardEquipe key={e.ine} eq={e}/>)
            )}
          </>
        )}

        {/* Aba: Panorama */}
        {abaAtiva === "resumo" && r && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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

        {/* Abas das integrações */}
        {abaAtiva === "alertas"       && <AbaAlertasCNES />}
        {abaAtiva === "historico"     && <AbaHistorico />}
        {abaAtiva === "sincronizacao" && <AbaSincronizacao />}
        {abaAtiva === "plano"         && <AbaPlanoCorrecao />}
        {abaAtiva === "divergencia"   && <AbaDivergenciaPEC />}
      </div>
    </div>
  );
}
