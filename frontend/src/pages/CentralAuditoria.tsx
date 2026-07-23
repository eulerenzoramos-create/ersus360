// src/pages/CentralAuditoria.tsx — Central de Auditoria da APS
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck, AlertTriangle, CheckCircle, XCircle, Clock,
  RefreshCw, TrendingUp, TrendingDown, FileText, Settings,
  Wifi, WifiOff, Database, Activity, Users, Zap, Play,
  ChevronRight, BarChart2, Bell, GitBranch, Eye,
} from "lucide-react";
import { apiGet, apiPost } from "../lib/api";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface SistemaScore {
  id: string; nome: string; sigla: string;
  score: number; status: "ok" | "warn" | "critico" | "offline";
  funcionalidades_total: number; funcionalidades_ok: number;
  ultimo_check: string; proxima_verificacao: string;
  alertas_ativos: number; cor: string;
  detalhes: { label: string; ok: boolean; nota?: string }[];
}

interface AlertaAtivo {
  id: number; sistema: string; titulo: string; descricao: string;
  severidade: "critico" | "alta" | "media" | "baixa";
  criado_em: string; responsavel: string | null;
  status: "aberto" | "em_andamento" | "resolvido";
}

interface RegraAuditoria {
  id: number; nome: string; sistema: string; descricao: string;
  ativa: boolean; frequencia: string; ultima_execucao: string;
  resultado: "ok" | "alerta" | "erro" | "pendente";
  total_verificacoes: number; total_alertas: number;
}

interface DashAuditoria {
  score_geral: number; sistemas: SistemaScore[];
  alertas_ativos: AlertaAtivo[]; regras: RegraAuditoria[];
  ultima_auditoria: string; proxima_auditoria: string;
  tarefas_abertas: number; conformidade_pct: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COR: Record<string, string> = {
  ok: "#16a34a", warn: "#d97706", critico: "#dc2626", offline: "#9ca3af",
};
const STATUS_LABEL: Record<string, string> = {
  ok: "Conforme", warn: "Atenção", critico: "Crítico", offline: "Offline",
};
const SEV_COR: Record<string, string> = {
  critico: "#dc2626", alta: "#d97706", media: "#2563eb", baixa: "#6b7280",
};

function ScoreGauge({ score }: { score: number }) {
  const cor = score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626";
  const r = 54; const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: 140, height: 140 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={cor} strokeWidth="12"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: cor }}>{score}</div>
        <div style={{ fontSize: 10, color: "#9ca3af" }}>Score Geral</div>
      </div>
    </div>
  );
}

function Bar({ pct, cor, height = 6 }: { pct: number; cor: string; height?: number }) {
  return (
    <div style={{ height, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: cor, borderRadius: 4, transition: "width .4s" }} />
    </div>
  );
}

// ── Cartão de Sistema ─────────────────────────────────────────────────────────

function SistemaCard({ s, onSelect }: { s: SistemaScore; onSelect: () => void }) {
  const cor = STATUS_COR[s.status];
  return (
    <div onClick={onSelect} style={{ background: "#fff", border: `1px solid ${cor}30`, borderTop: `4px solid ${cor}`, borderRadius: 12, padding: "16px 18px", cursor: "pointer", transition: "box-shadow .15s" }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.1)")}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800 }}>{s.sigla}</div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{s.nome}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: cor }}>{s.score}</div>
          <span style={{ background: `${cor}15`, color: cor, fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, border: `1px solid ${cor}40` }}>
            {STATUS_LABEL[s.status]}
          </span>
        </div>
      </div>
      <Bar pct={s.score} cor={cor} height={6} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: "#9ca3af" }}>
        <span>✓ {s.funcionalidades_ok}/{s.funcionalidades_total} funções</span>
        {s.alertas_ativos > 0 && (
          <span style={{ color: "#dc2626", fontWeight: 700 }}>⚠ {s.alertas_ativos} alertas</span>
        )}
      </div>
      <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 6 }}>Último check: {s.ultimo_check}</div>
    </div>
  );
}

// ── Modal Detalhe Sistema ─────────────────────────────────────────────────────

function ModalSistema({ s, onClose }: { s: SistemaScore; onClose: () => void }) {
  const cor = STATUS_COR[s.status];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 14, padding: "24px 28px", width: "100%", maxWidth: 560, maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{s.sigla}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{s.nome}</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: cor }}>{s.score}/100</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Bar pct={s.score} cor={cor} height={10} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Checklist de Funcionalidades</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {s.detalhes.map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 12px", borderRadius: 8, background: d.ok ? "#f0fdf4" : "#fef2f2", border: `1px solid ${d.ok ? "#bbf7d0" : "#fecaca"}` }}>
              {d.ok ? <CheckCircle size={14} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} /> : <XCircle size={14} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />}
              <div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{d.label}</div>
                {d.nota && <div style={{ fontSize: 10, color: "#6b7280" }}>{d.nota}</div>}
              </div>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{ marginTop: 20, width: "100%", padding: "10px", background: "#1351b4", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
          Fechar
        </button>
      </div>
    </div>
  );
}

// ── Aba Regras ────────────────────────────────────────────────────────────────

function AbaRegras({ regras, onExecutar }: { regras: RegraAuditoria[]; onExecutar: (id: number) => void }) {
  const RES_COR: Record<string, string> = { ok: "#16a34a", alerta: "#d97706", erro: "#dc2626", pendente: "#9ca3af" };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Motor de Regras — {regras.length} regras ativas</div>
        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#1351b4", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
          <Play size={12} /> Executar Todas
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {regras.map(r => {
          const cor = RES_COR[r.resultado];
          return (
            <div key={r.id} style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{r.nome}</span>
                    <span style={{ background: "#eff6ff", color: "#1d4ed8", fontSize: 9, fontWeight: 700, padding: "1px 8px", borderRadius: 20 }}>{r.sistema}</span>
                    {r.ativa && <span style={{ background: "#f0fdf4", color: "#16a34a", fontSize: 9, fontWeight: 700, padding: "1px 8px", borderRadius: 20 }}>● Ativa</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{r.descricao}</div>
                </div>
                <div style={{ textAlign: "right", marginLeft: 16, flexShrink: 0 }}>
                  <span style={{ background: `${cor}15`, color: cor, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, border: `1px solid ${cor}40` }}>
                    {r.resultado === "ok" ? "✓ Conforme" : r.resultado === "alerta" ? "⚠ Alerta" : r.resultado === "erro" ? "✗ Erro" : "⏳ Pendente"}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 20, fontSize: 10, color: "#9ca3af", alignItems: "center" }}>
                <span>🕐 {r.frequencia}</span>
                <span>Última: {r.ultima_execucao}</span>
                <span>{r.total_verificacoes} verificações</span>
                {r.total_alertas > 0 && <span style={{ color: "#dc2626", fontWeight: 700 }}>{r.total_alertas} alertas gerados</span>}
                <button onClick={() => onExecutar(r.id)}
                  style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, padding: "4px 12px", background: "#f8fafc", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 700, color: "#374151" }}>
                  <Play size={9} /> Executar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Aba Alertas ───────────────────────────────────────────────────────────────

function AbaAlertas({ alertas }: { alertas: AlertaAtivo[] }) {
  const [filtro, setFiltro] = useState("todos");
  const filtrados = alertas.filter(a => filtro === "todos" || a.severidade === filtro || a.status === filtro);
  const STATUS_ALERTA_COR: Record<string, string> = { aberto: "#dc2626", em_andamento: "#d97706", resolvido: "#16a34a" };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" as const }}>
        {["todos", "critico", "alta", "media", "aberto", "em_andamento", "resolvido"].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            style={{ padding: "5px 14px", fontSize: 11, borderRadius: 20, border: "1px solid #d1d5db", background: filtro === f ? "#1351b4" : "#fff", color: filtro === f ? "#fff" : "#374151", cursor: "pointer", fontWeight: filtro === f ? 700 : 400 }}>
            {f === "todos" ? "Todos" : f === "em_andamento" ? "Em andamento" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af", alignSelf: "center" }}>{filtrados.length} alertas</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtrados.map(a => {
          const cor = SEV_COR[a.severidade];
          const corStatus = STATUS_ALERTA_COR[a.status];
          return (
            <div key={a.id} style={{ background: "#fff", border: `1px solid ${cor}25`, borderLeft: `4px solid ${cor}`, borderRadius: 10, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{a.titulo}</span>
                    <span style={{ background: `${cor}15`, color: cor, fontSize: 9, fontWeight: 700, padding: "1px 8px", borderRadius: 20 }}>{a.severidade.toUpperCase()}</span>
                    <span style={{ background: `${corStatus}15`, color: corStatus, fontSize: 9, fontWeight: 700, padding: "1px 8px", borderRadius: 20 }}>{a.status.replace("_", " ")}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{a.descricao}</div>
                </div>
                <div style={{ textAlign: "right", marginLeft: 16, flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>{a.sistema}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>{a.criado_em}</div>
                </div>
              </div>
              {a.responsavel && (
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>
                  Responsável: <span style={{ fontWeight: 600, color: "#374151" }}>{a.responsavel}</span>
                </div>
              )}
            </div>
          );
        })}
        {filtrados.length === 0 && (
          <div style={{ textAlign: "center", padding: 48, color: "#9ca3af", fontSize: 13 }}>
            <CheckCircle size={32} color="#16a34a" style={{ marginBottom: 8 }} /><br/>Nenhum alerta para este filtro
          </div>
        )}
      </div>
    </div>
  );
}

// ── Componente Principal ──────────────────────────────────────────────────────

type Aba = "overview" | "regras" | "alertas" | "historico";

export default function CentralAuditoria() {
  const [aba, setAba] = useState<Aba>("overview");
  const [sistemaSel, setSistemaSel] = useState<SistemaScore | null>(null);
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery<DashAuditoria>({
    queryKey: ["central-auditoria"],
    queryFn: () => apiGet("/api/auditoria/dashboard") as Promise<DashAuditoria>,
    staleTime: 60_000,
  });

  const executarRegra = useMutation({
    mutationFn: (id: number) => apiPost(`/api/auditoria/regras/${id}/executar`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["central-auditoria"] }),
  });

  const executarAuditoria = useMutation({
    mutationFn: () => apiPost("/api/auditoria/executar-completa", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["central-auditoria"] }),
  });

  const d = data;
  const corGeral = d ? (d.score_geral >= 80 ? "#16a34a" : d.score_geral >= 60 ? "#d97706" : "#dc2626") : "#9ca3af";

  const ABAS = [
    { id: "overview" as Aba,  label: "Visão Geral",     icon: <BarChart2 size={13}/> },
    { id: "regras" as Aba,    label: "Motor de Regras", icon: <Settings size={13}/> },
    { id: "alertas" as Aba,   label: `Alertas${d ? ` (${d.alertas_ativos.filter(a=>a.status!=="resolvido").length})` : ""}`, icon: <Bell size={13}/> },
    { id: "historico" as Aba, label: "Histórico",       icon: <GitBranch size={13}/> },
  ];

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0d1b2a 0%,#1351b4 100%)", padding: "18px 28px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}>
                <ShieldCheck size={18} color="#fff" />
              </div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Central de Auditoria</span>
              <span style={{ background: "rgba(255,255,255,.15)", color: "#bfdbfe", borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>APS</span>
            </div>
            <div style={{ fontSize: 12, color: "#bfdbfe" }}>
              Conformidade · SCNES · eSUS PEC · SIAPS · e-Gestor · RNDS · CADSUS
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {d && (
              <div style={{ background: `${corGeral}22`, border: `1px solid ${corGeral}50`, borderRadius: 10, padding: "8px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <ShieldCheck size={16} color={corGeral} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: corGeral }}>{d.score_geral}/100</div>
                  <div style={{ fontSize: 9, color: "#bfdbfe" }}>Conformidade Geral</div>
                </div>
              </div>
            )}
            <button onClick={() => executarAuditoria.mutate()}
              disabled={executarAuditoria.isPending}
              style={{ display: "flex", alignItems: "center", gap: 6, background: executarAuditoria.isPending ? "rgba(255,255,255,.1)" : "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
              {executarAuditoria.isPending ? <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Play size={13} />}
              {executarAuditoria.isPending ? "Executando..." : "Auditar Agora"}
            </button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 0 }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", border: "none",
                borderBottom: aba === a.id ? "3px solid #fff" : "3px solid transparent",
                background: "transparent", color: aba === a.id ? "#fff" : "rgba(255,255,255,.6)",
                fontWeight: aba === a.id ? 700 : 400, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" as const }}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "24px 28px 60px" }}>
        {isLoading && <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando Central de Auditoria...</div>}

        {/* ── Overview ── */}
        {aba === "overview" && d && (
          <div>
            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Score Geral", val: `${d.score_geral}/100`, cor: corGeral, bg: `${corGeral}10`, border: `${corGeral}30`, icon: <ShieldCheck size={16}/> },
                { label: "Alertas Ativos", val: d.alertas_ativos.filter(a=>a.status!=="resolvido").length, cor: "#dc2626", bg: "#fef2f2", border: "#fecaca", icon: <AlertTriangle size={16}/> },
                { label: "Tarefas Abertas", val: d.tarefas_abertas, cor: "#d97706", bg: "#fef3c7", border: "#fde68a", icon: <Clock size={16}/> },
                { label: "Regras Ativas", val: d.regras.filter(r=>r.ativa).length, cor: "#1351b4", bg: "#eff6ff", border: "#bfdbfe", icon: <Settings size={16}/> },
                { label: "Conformidade", val: `${d.conformidade_pct}%`, cor: d.conformidade_pct>=80?"#16a34a":d.conformidade_pct>=60?"#d97706":"#dc2626", bg: "#f0fdf4", border: "#bbf7d0", icon: <CheckCircle size={16}/> },
              ].map(k => (
                <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.border}`, borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>{k.label}</span>
                    <div style={{ color: k.cor }}>{k.icon}</div>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: k.cor }}>{k.val}</div>
                </div>
              ))}
            </div>

            {/* Score gauge + resumo */}
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 18, marginBottom: 24 }}>
              <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <ScoreGauge score={d.score_geral} />
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: corGeral }}>{d.score_geral >= 80 ? "Sistema Conforme" : d.score_geral >= 60 ? "Atenção Necessária" : "Conformidade Crítica"}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>Última auditoria: {d.ultima_auditoria}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>Próxima: {d.proxima_auditoria}</div>
                </div>
              </div>

              <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Score por Sistema</div>
                {d.sistemas.map(s => {
                  const cor = STATUS_COR[s.status];
                  return (
                    <div key={s.id} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 700 }}>{s.sigla}</span>
                          <span style={{ fontSize: 10, color: "#9ca3af" }}>{s.nome}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {s.alertas_ativos > 0 && <span style={{ fontSize: 10, color: "#dc2626", fontWeight: 700 }}>⚠ {s.alertas_ativos}</span>}
                          <span style={{ fontSize: 13, fontWeight: 800, color: cor }}>{s.score}</span>
                        </div>
                      </div>
                      <Bar pct={s.score} cor={cor} height={7} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cards por sistema */}
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Sistemas Integrados — Detalhamento</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
              {d.sistemas.map(s => (
                <SistemaCard key={s.id} s={s} onSelect={() => setSistemaSel(s)} />
              ))}
            </div>

            {/* Alertas recentes */}
            {d.alertas_ativos.filter(a => a.status !== "resolvido").length > 0 && (
              <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
                  <span>Alertas Não Resolvidos</span>
                  <button onClick={() => setAba("alertas")} style={{ fontSize: 11, color: "#1351b4", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                    Ver todos →
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {d.alertas_ativos.filter(a => a.status !== "resolvido").slice(0, 5).map(a => {
                    const cor = SEV_COR[a.severidade];
                    return (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: `${cor}08`, border: `1px solid ${cor}25`, borderLeft: `3px solid ${cor}`, borderRadius: 8 }}>
                        <AlertTriangle size={14} color={cor} style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{a.titulo}</div>
                          <div style={{ fontSize: 10, color: "#9ca3af" }}>{a.sistema} · {a.criado_em}</div>
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 700, background: `${cor}15`, color: cor, padding: "2px 8px", borderRadius: 20 }}>{a.severidade}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Regras ── */}
        {aba === "regras" && d && (
          <AbaRegras regras={d.regras} onExecutar={(id) => executarRegra.mutate(id)} />
        )}

        {/* ── Alertas ── */}
        {aba === "alertas" && d && <AbaAlertas alertas={d.alertas_ativos} />}

        {/* ── Histórico ── */}
        {aba === "historico" && (
          <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Histórico de Auditorias Executadas</div>
            <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>
              <GitBranch size={32} color="#d1d5db" style={{ marginBottom: 8 }} /><br/>
              Trilha de auditoria disponível após primeira execução automática.
            </div>
          </div>
        )}
      </div>

      {sistemaSel && <ModalSistema s={sistemaSel} onClose={() => setSistemaSel(null)} />}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
