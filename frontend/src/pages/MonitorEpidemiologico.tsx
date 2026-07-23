// src/pages/MonitorEpidemiologico.tsx — Monitor Epidemiológico em Tempo Real
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity, AlertTriangle, TrendingUp, TrendingDown, RefreshCw,
  ChevronDown, ChevronRight, Thermometer, Eye,
} from "lucide-react";
import { apiGet, apiPost } from "../lib/api";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface AlertaEpid {
  id: string; agravo: string; cid: string;
  nivel: "epidemia" | "surto" | "alerta" | "monitoramento";
  casos_semana: number; casos_anterior: number; variacao_pct: number;
  limiar_epidemico: number; descricao: string;
  municipios_afetados: string[]; data_alerta: string; ativo: boolean;
}

interface AgravoDashboard {
  cid: string; agravo: string; grupo: string;
  casos_ano: number; casos_mes: number; casos_semana: number;
  tendencia: "crescimento" | "queda" | "estavel";
  historico_semanas: number[];
  notificacoes_pendentes: number;
}

interface ResumoEpid {
  semana_epidemiologica: string; total_notificacoes_semana: number;
  alertas_ativos: number; surtos_ativos: number; agravos_monitorados: number;
  taxa_confirmacao_pct: number; ultima_atualizacao: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const COR_NIVEL: Record<string, string> = {
  epidemia: "#dc2626", surto: "#ea580c", alerta: "#d97706", monitoramento: "#1351b4",
};

function NivelBadge({ n }: { n: string }) {
  const cor = COR_NIVEL[n] ?? "#6b7280";
  const labels: Record<string,string> = { epidemia:"EPIDEMIA", surto:"SURTO", alerta:"ALERTA", monitoramento:"MONITORAMENTO" };
  return <span style={{ fontSize: 9, fontWeight: 900, padding: "3px 8px", borderRadius: 10, background: cor + "18", color: cor, letterSpacing: "0.04em" }}>{labels[n] ?? n.toUpperCase()}</span>;
}

// ── Sparkline inline ──────────────────────────────────────────────────────────

function Spark({ vals, cor }: { vals: number[]; cor: string }) {
  const min = Math.min(...vals); const max = Math.max(...vals); const range = max - min || 1;
  const W = 80; const H = 28;
  const pts = vals.map((v, i) => `${i * (W / (vals.length - 1))},${H - ((v - min) / range) * (H - 4) + 2}`).join(" ");
  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={cor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={vals.length > 0 ? (vals.length - 1) * (W / (vals.length - 1)) : W} cy={H - ((vals[vals.length - 1] - min) / range) * (H - 4) + 2} r={3} fill={cor}/>
    </svg>
  );
}

// ── Card Alerta ───────────────────────────────────────────────────────────────

function CardAlerta({ alerta }: { alerta: AlertaEpid }) {
  const [aberto, setAberto] = useState(false);
  const cor = COR_NIVEL[alerta.nivel];

  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}30`, borderLeft: `4px solid ${cor}`, borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
      <div onClick={() => setAberto(o => !o)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", cursor: "pointer" }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: cor + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <AlertTriangle size={16} color={cor}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontWeight: 800, fontSize: 13 }}>{alerta.agravo}</span>
            <NivelBadge n={alerta.nivel}/>
            <span style={{ fontSize: 9, color: "#9ca3af" }}>CID: {alerta.cid}</span>
          </div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>{alerta.descricao}</div>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
          <div style={{ textAlign: "center" as const }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: cor }}>{alerta.casos_semana}</div>
            <div style={{ fontSize: 9, color: "#9ca3af" }}>casos/semana</div>
          </div>
          <div style={{ textAlign: "center" as const }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: alerta.variacao_pct > 0 ? "#dc2626" : "#16a34a" }}>
              {alerta.variacao_pct > 0 ? "▲" : "▼"} {Math.abs(alerta.variacao_pct)}%
            </div>
            <div style={{ fontSize: 9, color: "#9ca3af" }}>vs. anterior</div>
          </div>
          {aberto ? <ChevronDown size={14} color="#9ca3af"/> : <ChevronRight size={14} color="#9ca3af"/>}
        </div>
      </div>

      {aberto && (
        <div style={{ borderTop: `1px solid ${cor}15`, padding: "12px 16px", background: "#fafafa" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              {[
                ["Limiar epidêmico", `${alerta.limiar_epidemico} casos/semana`],
                ["Casos esta semana", String(alerta.casos_semana)],
                ["Casos semana anterior", String(alerta.casos_anterior)],
                ["Data do alerta", alerta.data_alerta],
              ].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>{l}</span>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Áreas Afetadas</div>
              {alerta.municipios_afetados.map((m, i) => (
                <div key={i} style={{ fontSize: 11, padding: "3px 8px", marginBottom: 3, background: cor + "10", borderRadius: 6, color: cor, fontWeight: 600 }}>📍 {m}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Card Agravo ───────────────────────────────────────────────────────────────

function CardAgravo({ ag }: { ag: AgravoDashboard }) {
  const cor = ag.tendencia === "crescimento" ? "#dc2626" : ag.tendencia === "queda" ? "#16a34a" : "#6b7280";
  return (
    <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 12 }}>{ag.agravo}</div>
          <div style={{ fontSize: 9, color: "#9ca3af" }}>CID {ag.cid} · {ag.grupo}</div>
        </div>
        {ag.notificacoes_pendentes > 0 && (
          <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 8, background: "#fee2e2", color: "#dc2626" }}>{ag.notificacoes_pendentes} pend.</span>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
            {[["Semana", ag.casos_semana],["Mês", ag.casos_mes],["Ano", ag.casos_ano]].map(([l, v]) => (
              <div key={l as string}>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#1f2937" }}>{v}</div>
                <div style={{ fontSize: 9, color: "#9ca3af" }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 9, color: cor, fontWeight: 700 }}>
            {ag.tendencia === "crescimento" ? "▲ Crescimento" : ag.tendencia === "queda" ? "▼ Queda" : "— Estável"}
          </div>
        </div>
        <Spark vals={ag.historico_semanas} cor={cor}/>
      </div>
    </div>
  );
}

// ── Principal ─────────────────────────────────────────────────────────────────

export default function MonitorEpidemiologico() {
  const [tab, setTab] = useState<"alertas" | "agravos">("alertas");
  const [filtroNivel, setFiltroNivel] = useState("todos");
  const qc = useQueryClient();

  const { data: resumo } = useQuery<ResumoEpid>({
    queryKey: ["epid-resumo"],
    queryFn: () => apiGet("/api/monitor-epidem/resumo") as Promise<ResumoEpid>,
    staleTime: 120_000,
  });

  const { data: alertas = [], isLoading: loadAl } = useQuery<AlertaEpid[]>({
    queryKey: ["epid-alertas"],
    queryFn: () => apiGet("/api/monitor-epidem/alertas") as Promise<AlertaEpid[]>,
    staleTime: 120_000,
  });

  const { data: agravos = [], isLoading: loadAg } = useQuery<AgravoDashboard[]>({
    queryKey: ["epid-agravos"],
    queryFn: () => apiGet("/api/monitor-epidem/agravos") as Promise<AgravoDashboard[]>,
    staleTime: 120_000,
  });

  const atualizar = useMutation({
    mutationFn: () => apiPost("/api/monitor-epidem/atualizar"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["epid-resumo"] }); qc.invalidateQueries({ queryKey: ["epid-alertas"] }); },
  });

  const r = resumo;
  const alertasFiltrados = alertas.filter(a => filtroNivel === "todos" || a.nivel === filtroNivel);

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#431407 0%,#c2410c 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}><Activity size={18} color="#fff"/></div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Monitor Epidemiológico · Tempo Real</span>
              {r && <span style={{ fontSize: 9, background: "rgba(255,255,255,.15)", color: "#fed7aa", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>SE {r.semana_epidemiologica}</span>}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              SINAN · e-SUS VE · Arboviroses · DNC · Surtos e Epidemias · FMS Apuí/AM
            </div>
          </div>
          <button onClick={() => atualizar.mutate()} disabled={atualizar.isPending}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            <RefreshCw size={12}/>{atualizar.isPending ? "Atualizando..." : "Atualizar Dados"}
          </button>
        </div>

        {r && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginTop: 16 }}>
            {[
              { l: "Notif./Semana",    v: r.total_notificacoes_semana, cor: "#fed7aa" },
              { l: "Alertas Ativos",   v: r.alertas_ativos,            cor: "#fca5a5" },
              { l: "Surtos Ativos",    v: r.surtos_ativos,             cor: "#fca5a5" },
              { l: "Agravos Monit.",   v: r.agravos_monitorados,       cor: "#fed7aa" },
              { l: "Taxa Confirm.",    v: `${r.taxa_confirmacao_pct}%`, cor: "#86efac" },
              { l: "Atualização",      v: r.ultima_atualizacao,        cor: "rgba(255,255,255,.5)" },
            ].map(k => (
              <div key={k.l} style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "10px 12px", textAlign: "center" as const }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: k.cor }}>{k.v}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.5)" }}>{k.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "20px 28px 60px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: 4, marginBottom: 16, width: "fit-content" as const }}>
          {([["alertas","Alertas Ativos"],["agravos","Painel de Agravos"]] as [string,string][]).map(([id,l]) => (
            <button key={id} onClick={() => setTab(id as "alertas" | "agravos")}
              style={{ padding: "6px 18px", borderRadius: 7, border: "none", fontSize: 12, fontWeight: tab===id?700:400, background: tab===id?"#c2410c":"transparent", color: tab===id?"#fff":"#6b7280", cursor: "pointer" }}>
              {l}
            </button>
          ))}
        </div>

        {tab === "alertas" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" as const, alignItems: "center" }}>
              {["todos","epidemia","surto","alerta","monitoramento"].map(n => (
                <button key={n} onClick={() => setFiltroNivel(n)}
                  style={{ padding: "5px 12px", fontSize: 11, borderRadius: 20, border: `1px solid ${filtroNivel===n?(COR_NIVEL[n]??"#c2410c"):"#d1d5db"}`, background: filtroNivel===n?((COR_NIVEL[n]??"#c2410c")+"15"):"#fff", color: filtroNivel===n?(COR_NIVEL[n]??"#c2410c"):"#374151", cursor: "pointer" }}>
                  {n === "todos" ? "Todos" : n.charAt(0).toUpperCase() + n.slice(1)}
                </button>
              ))}
              <span style={{ marginLeft: "auto", fontSize: 11, color: "#9ca3af" }}>{alertasFiltrados.length} alertas</span>
            </div>
            {loadAl ? <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando alertas...</div>
              : alertasFiltrados.map(a => <CardAlerta key={a.id} alerta={a}/>)
            }
          </>
        )}

        {tab === "agravos" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {loadAg ? <div style={{ textAlign: "center", padding: 60, color: "#9ca3af", gridColumn: "1/-1" }}>Carregando agravos...</div>
              : agravos.map(ag => <CardAgravo key={ag.cid} ag={ag}/>)
            }
          </div>
        )}
      </div>
    </div>
  );
}
