// src/pages/AuditoriaAutomatica.tsx — Auditoria Automática Mensal (cron)
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, PlayCircle, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, ChevronDown, ChevronRight, Calendar } from "lucide-react";
import { apiGet, apiPost } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface ItemAuditoria {
  id: string; modulo: string; descricao: string; status: "ok" | "alerta" | "critico" | "nao_verificado";
  valor_encontrado: string; valor_esperado: string; acao_recomendada: string;
}

interface ExecucaoAuditoria {
  id: number; competencia: string; inicio: string; fim: string | null;
  status: "executando" | "concluida" | "com_falhas" | "agendada";
  total_verificacoes: number; ok: number; alertas: number; criticos: number;
  itens: ItemAuditoria[];
  disparada_por: "cron" | "manual";
}

interface ConfigCron {
  ativo: boolean; expressao_cron: string; descricao_cron: string;
  proxima_execucao: string; ultima_execucao: string; total_execucoes: number;
}

// ── Status badges ─────────────────────────────────────────────────────────────

function BadgeStatus({ s }: { s: string }) {
  const m: Record<string, [string, string]> = {
    ok:            ["#dcfce7","#166534"],
    alerta:        ["#fef3c7","#92400e"],
    critico:       ["#fee2e2","#991b1b"],
    nao_verificado:["#f1f5f9","#64748b"],
    executando:    ["#dbeafe","#1e40af"],
    concluida:     ["#dcfce7","#166534"],
    com_falhas:    ["#fee2e2","#991b1b"],
    agendada:      ["#f1f5f9","#64748b"],
  };
  const [bg, cor] = m[s] ?? ["#f1f5f9","#64748b"];
  const labels: Record<string,string> = {
    ok:"OK", alerta:"Alerta", critico:"Crítico", nao_verificado:"N/V",
    executando:"Executando", concluida:"Concluída", com_falhas:"Com Falhas", agendada:"Agendada",
  };
  return (
    <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 10, background: bg, color: cor }}>
      {labels[s] ?? s}
    </span>
  );
}

// ── Card Execução ─────────────────────────────────────────────────────────────

function CardExecucao({ ex }: { ex: ExecucaoAuditoria }) {
  const [aberto, setAberto] = useState(false);
  const pctOK = ex.total_verificacoes > 0 ? (ex.ok / ex.total_verificacoes) * 100 : 0;

  return (
    <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
      <div onClick={() => setAberto(o => !o)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", cursor: "pointer" }}>
        <div style={{ flexShrink: 0 }}>
          {ex.status === "concluida" ? <CheckCircle size={20} color="#16a34a"/> :
           ex.status === "com_falhas" ? <XCircle size={20} color="#dc2626"/> :
           ex.status === "executando" ? <RefreshCw size={20} color="#1d4ed8"/> :
           <Clock size={20} color="#9ca3af"/>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Auditoria {ex.competencia}</span>
            <BadgeStatus s={ex.status}/>
            <span style={{ fontSize: 9, background: ex.disparada_por === "cron" ? "#ede9fe" : "#dbeafe", color: ex.disparada_por === "cron" ? "#6d28d9" : "#1d4ed8", padding: "1px 6px", borderRadius: 8, fontWeight: 700 }}>
              {ex.disparada_por === "cron" ? "Automático" : "Manual"}
            </span>
          </div>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>{ex.inicio} {ex.fim ? `→ ${ex.fim}` : "· Em andamento"}</div>
          {/* Barra de completude */}
          {ex.total_verificacoes > 0 && (
            <div style={{ marginTop: 6 }}>
              <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                <div style={{ flex: ex.ok, height: 4, background: "#16a34a", borderRadius: "3px 0 0 3px", minWidth: 0 }}/>
                <div style={{ flex: ex.alertas, height: 4, background: "#d97706", minWidth: 0 }}/>
                <div style={{ flex: ex.criticos, height: 4, background: "#dc2626", borderRadius: "0 3px 3px 0", minWidth: 0 }}/>
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 9, color: "#6b7280" }}>
                <span style={{ color: "#16a34a" }}>✓ {ex.ok} OK</span>
                <span style={{ color: "#d97706" }}>⚠ {ex.alertas} alertas</span>
                <span style={{ color: "#dc2626" }}>✗ {ex.criticos} críticos</span>
                <span>de {ex.total_verificacoes} verificações</span>
              </div>
            </div>
          )}
        </div>
        {aberto ? <ChevronDown size={14} color="#9ca3af"/> : <ChevronRight size={14} color="#9ca3af"/>}
      </div>

      {aberto && ex.itens && ex.itens.length > 0 && (
        <div style={{ borderTop: "1px solid #f3f4f6", padding: "14px 16px", background: "#fafafa" }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 10 }}>Verificações Detalhadas</div>
          {ex.itens.map(item => (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: "120px 1fr 140px", gap: 10, padding: "8px 10px", marginBottom: 6, background: "#fff", borderRadius: 8, border: "1px solid #f3f4f6", borderLeft: `3px solid ${item.status === "ok" ? "#16a34a" : item.status === "critico" ? "#dc2626" : item.status === "alerta" ? "#d97706" : "#e5e7eb"}` }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af" }}>{item.modulo}</div>
                <BadgeStatus s={item.status}/>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{item.descricao}</div>
                <div style={{ fontSize: 9, color: "#6b7280" }}>Encontrado: <b>{item.valor_encontrado}</b> · Esperado: {item.valor_esperado}</div>
                {item.status !== "ok" && <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 2 }}>→ {item.acao_recomendada}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Principal ─────────────────────────────────────────────────────────────────

export default function AuditoriaAutomatica() {
  const [tab, setTab] = useState<"historico" | "config">("historico");
  const qc = useQueryClient();

  const { data: execucoes = [], isLoading } = useQuery<ExecucaoAuditoria[]>({
    queryKey: ["auditoria-execucoes"],
    queryFn: () => apiGet("/api/auditoria-auto/execucoes") as Promise<ExecucaoAuditoria[]>,
    staleTime: 120_000,
  });

  const { data: config } = useQuery<ConfigCron>({
    queryKey: ["auditoria-config"],
    queryFn: () => apiGet("/api/auditoria-auto/config") as Promise<ConfigCron>,
    staleTime: 300_000,
  });

  const disparar = useMutation({
    mutationFn: () => apiPost("/api/auditoria-auto/disparar"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auditoria-execucoes"] }),
  });

  const toggleCron = useMutation({
    mutationFn: (ativo: boolean) => apiPost("/api/auditoria-auto/config", { ativo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auditoria-config"] }),
  });

  const ultima = execucoes.find(e => e.status === "concluida" || e.status === "com_falhas");
  const emExecucao = execucoes.some(e => e.status === "executando");

  if (!isLoading && !execucoes) return (
    <div style={{ padding: 24 }}>
      <NaoDisponivelBanner
        titulo="AuditoriaAutomatica indisponivel"
        nota="Dados nao disponiveis — integracao pendente de configuracao no Railway."
      />
    </div>
  );

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1e3a2f 0%,#15803d 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}><ClipboardCheck size={18} color="#fff"/></div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Auditoria Automática Mensal</span>
              {config && (
                <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 10px", borderRadius: 10,
                  background: config.ativo ? "rgba(134,239,172,.25)" : "rgba(255,255,255,.12)",
                  color: config.ativo ? "#86efac" : "rgba(255,255,255,.5)" }}>
                  {config.ativo ? "CRON ATIVO" : "CRON PAUSADO"}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Verificações automáticas: SIAPS, SCNES, CADSUS, Previne Brasil, RNDS · {config?.expressao_cron ?? "0 0 1 * *"} (cron)
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => disparar.mutate()} disabled={disparar.isPending || emExecucao}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.2)", color: "#fff", border: "1px solid rgba(255,255,255,.35)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
              <PlayCircle size={12}/>{disparar.isPending || emExecucao ? "Executando..." : "Disparar Agora"}
            </button>
          </div>
        </div>

        {ultima && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 16 }}>
            {[
              { label: "Última Auditoria", val: ultima.competencia, cor: "#86efac" },
              { label: "OK", val: ultima.ok, cor: "#86efac" },
              { label: "Alertas", val: ultima.alertas, cor: "#fde68a" },
              { label: "Críticos", val: ultima.criticos, cor: "#fca5a5" },
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
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: 4, marginBottom: 16, width: "fit-content" as const }}>
          {([["historico","Histórico de Execuções"],["config","Configuração do Cron"]] as [string,string][]).map(([id,l]) => (
            <button key={id} onClick={() => setTab(id as "historico" | "config")}
              style={{ padding: "6px 18px", borderRadius: 7, border: "none", fontSize: 12, fontWeight: tab===id?700:400, background: tab===id?"#15803d":"transparent", color: tab===id?"#fff":"#6b7280", cursor: "pointer" }}>
              {l}
            </button>
          ))}
        </div>

        {tab === "historico" && (
          isLoading
            ? <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando histórico...</div>
            : execucoes.map(ex => <CardExecucao key={ex.id} ex={ex}/>)
        )}

        {tab === "config" && config && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Configuração cron */}
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "20px 24px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <Calendar size={14} color="#15803d"/> Agendamento Cron
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 12 }}>Status do Cron</span>
                <div onClick={() => toggleCron.mutate(!config.ativo)} style={{ width: 40, height: 22, borderRadius: 11, background: config.ativo ? "#15803d" : "#d1d5db", cursor: "pointer", display: "flex", alignItems: "center", padding: "0 3px", transition: "background .2s" }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", transform: config.ativo ? "translateX(18px)" : "translateX(0)", transition: "transform .2s" }}/>
                </div>
              </div>
              {[
                ["Expressão Cron", config.expressao_cron],
                ["Descrição", config.descricao_cron],
                ["Próxima Execução", config.proxima_execucao],
                ["Última Execução", config.ultima_execucao],
                ["Total de Execuções", String(config.total_execucoes)],
              ].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>{l}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#1f2937", fontFamily: l === "Expressão Cron" ? "monospace" : "inherit" }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Módulos verificados */}
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "20px 24px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Módulos Verificados Automaticamente</div>
              {[
                { m: "SIAPS", desc: "Taxa de transmissão de lotes — rejeitados > 10%", cor: "#d97706" },
                { m: "SCNES", desc: "Conformidade cadastral por equipe ESF — pendências críticas", cor: "#059669" },
                { m: "CADSUS", desc: "Qualidade cadastral por microárea — CNS inválidos, unicidade", cor: "#0369a1" },
                { m: "Previne Brasil", desc: "Indicadores abaixo de 70% da meta — aviso automático", cor: "#1351b4" },
                { m: "RNDS / FHIR", desc: "Endpoints com erro > 5% nas últimas 24h", cor: "#4f46e5" },
                { m: "Financeiro", desc: "Execução orçamentária < 80% no mês corrente", cor: "#15803d" },
                { m: "Score de Risco", desc: "Equipes com piora > 10 pontos no score composto", cor: "#b91c1c" },
              ].map(({ m, desc, cor }) => (
                <div key={m} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #f3f4f6", alignItems: "flex-start" }}>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 10, background: cor + "18", color: cor, flexShrink: 0, marginTop: 1 }}>{m}</span>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
