// src/pages/HistoricoAlertas.tsx — Histórico de alertas WebSocket + alertas APS (PEC)
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAlertas, AlertaWS } from "../hooks/useAlertas";
import { Bell, AlertTriangle, Info, CheckCircle2, Trash2, CheckCheck, Wifi, WifiOff, Activity } from "lucide-react";
import { apiGet, apiPost } from "../lib/api";

const NIVEL_CONFIG: Record<string, { cor: string; bg: string; borda: string; icon: React.ReactNode; label: string }> = {
  CRITICO: { cor: "#c62828", bg: "#ffebee", borda: "#ef9a9a", icon: <AlertTriangle size={14} />, label: "Crítico" },
  AVISO:   { cor: "#e65100", bg: "#fff8e1", borda: "#ffcc80", icon: <AlertTriangle size={14} />, label: "Aviso"   },
  INFO:    { cor: "#1565c0", bg: "#e3f2fd", borda: "#90caf9", icon: <Info size={14} />,          label: "Info"    },
};

function formatTs(ts?: string) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

function AlertaCard({ alerta, onMarcarLido }: { alerta: AlertaWS; onMarcarLido: (id: string) => void }) {
  const cfg = NIVEL_CONFIG[alerta.nivel] ?? NIVEL_CONFIG.INFO;
  return (
    <div style={{
      background: alerta.lido ? "#fafafa" : cfg.bg,
      border: `1px solid ${alerta.lido ? "#e0e0e0" : cfg.borda}`,
      borderLeft: `4px solid ${alerta.lido ? "#e0e0e0" : cfg.cor}`,
      borderRadius: 8, padding: "12px 16px", marginBottom: 8,
      display: "flex", gap: 12, alignItems: "flex-start",
      opacity: alerta.lido ? 0.72 : 1,
    }}>
      <div style={{ color: alerta.lido ? "#9e9e9e" : cfg.cor, paddingTop: 2, flexShrink: 0 }}>
        {alerta.lido ? <CheckCircle2 size={14} color="#9e9e9e" /> : cfg.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 3,
            background: alerta.lido ? "#e0e0e0" : cfg.bg, color: alerta.lido ? "#9e9e9e" : cfg.cor,
            border: `1px solid ${alerta.lido ? "#e0e0e0" : cfg.borda}`,
          }}>
            {cfg.label}
          </span>
          {alerta.modulo && (
            <span style={{ fontSize: 10, background: "#f5f5f5", color: "#757575", padding: "1px 7px", borderRadius: 3 }}>
              {alerta.modulo}
            </span>
          )}
          {alerta.categoria && alerta.categoria !== alerta.modulo && (
            <span style={{ fontSize: 10, background: "#f5f5f5", color: "#757575", padding: "1px 7px", borderRadius: 3 }}>
              {alerta.categoria}
            </span>
          )}
          <span style={{ fontSize: 11, color: "#9e9e9e", marginLeft: "auto" }}>{formatTs(alerta.ts)}</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: alerta.lido ? 400 : 600, color: alerta.lido ? "#9e9e9e" : "#212121" }}>
          {alerta.titulo}
        </div>
        {(alerta.descricao || alerta.mensagem) && (
          <div style={{ fontSize: 12, color: "#555", marginTop: 3, lineHeight: 1.5 }}>
            {alerta.descricao || alerta.mensagem}
          </div>
        )}
      </div>
      {!alerta.lido && alerta._localId && (
        <button
          onClick={() => onMarcarLido(alerta._localId!)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#9e9e9e", padding: 4, flexShrink: 0 }}
          title="Marcar como lido"
        >
          <CheckCircle2 size={16} />
        </button>
      )}
    </div>
  );
}

// ── Alertas APS (do PEC sync) ─────────────────────────────────────────────────

interface AlertaAPS {
  id: string; nivel: string; modulo: string; categoria: string;
  titulo: string; mensagem: string; ts: string; lido: boolean;
}

function AlertaAPSCard({ alerta, onLido }: { alerta: AlertaAPS; onLido: () => void }) {
  const cfg = NIVEL_CONFIG[alerta.nivel] ?? NIVEL_CONFIG.INFO;
  return (
    <div style={{
      background: alerta.lido ? "#fafafa" : cfg.bg,
      border: `1px solid ${alerta.lido ? "#e0e0e0" : cfg.borda}`,
      borderLeft: `4px solid ${alerta.lido ? "#e0e0e0" : cfg.cor}`,
      borderRadius: 8, padding: "12px 16px", marginBottom: 8,
      display: "flex", gap: 12, alignItems: "flex-start",
      opacity: alerta.lido ? 0.65 : 1,
    }}>
      <div style={{ color: alerta.lido ? "#9e9e9e" : cfg.cor, paddingTop: 2, flexShrink: 0 }}>
        {alerta.lido ? <CheckCircle2 size={14} color="#9e9e9e" /> : cfg.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 3,
            background: cfg.bg, color: cfg.cor, border: `1px solid ${cfg.borda}` }}>
            {cfg.label}
          </span>
          <span style={{ fontSize: 10, background: "#e8f4fd", color: "#1565c0", padding: "1px 7px", borderRadius: 3, fontWeight: 600 }}>
            APS · {alerta.categoria}
          </span>
          <span style={{ fontSize: 11, color: "#9e9e9e", marginLeft: "auto" }}>{formatTs(alerta.ts)}</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: alerta.lido ? 400 : 600, color: alerta.lido ? "#9e9e9e" : "#212121" }}>
          {alerta.titulo}
        </div>
        <div style={{ fontSize: 12, color: "#555", marginTop: 3, lineHeight: 1.5 }}>{alerta.mensagem}</div>
      </div>
      {!alerta.lido && (
        <button onClick={onLido}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#9e9e9e", padding: 4, flexShrink: 0 }}
          title="Marcar como lido">
          <CheckCircle2 size={16} />
        </button>
      )}
    </div>
  );
}

export default function HistoricoAlertas() {
  const { alertas, naoLidos, conectado, marcarLido, marcarTodosLidos, limparHistorico } = useAlertas();
  const qc = useQueryClient();
  const [filtroNivel, setFiltroNivel] = useState<string>("todos");
  const [filtroLido, setFiltroLido]   = useState<string>("todos");
  const [busca, setBusca]             = useState("");
  const [abaAtiva, setAbaAtiva]       = useState<"ws" | "aps">("ws");

  const { data: apsData } = useQuery({
    queryKey: ["alertas-aps"],
    queryFn: () => apiGet("/api/pec/alertas") as Promise<{ total: number; alertas: AlertaAPS[] }>,
    refetchInterval: 60_000,
  });

  const marcarLidoAPS = useMutation({
    mutationFn: (id: string) => apiPost(`/api/pec/alertas/${id}/lido`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alertas-aps"] }),
  });

  const alertasAPS = apsData?.alertas ?? [];
  const apsNaoLidos = alertasAPS.filter(a => !a.lido).length;

  const filtrados = alertas.filter(a => {
    if (filtroNivel !== "todos" && a.nivel !== filtroNivel) return false;
    if (filtroLido === "nao_lido" && a.lido)               return false;
    if (filtroLido === "lido"    && !a.lido)               return false;
    if (busca && !a.titulo.toLowerCase().includes(busca.toLowerCase())
              && !(a.descricao ?? "").toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const contadores = {
    CRITICO: alertas.filter(a => a.nivel === "CRITICO").length,
    AVISO:   alertas.filter(a => a.nivel === "AVISO").length,
    INFO:    alertas.filter(a => a.nivel === "INFO").length,
  };

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>

      {/* Cabeçalho */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <Bell size={20} color="#1565c0" />
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1565c0" }}>
            Histórico de Alertas
          </h2>
          <div style={{
            display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600,
            color: conectado ? "#2e7d32" : "#c62828",
            background: conectado ? "#e8f5e9" : "#ffebee",
            padding: "3px 10px", borderRadius: 20,
          }}>
            {conectado ? <Wifi size={11} /> : <WifiOff size={11} />}
            {conectado ? "Conectado" : "Desconectado"}
          </div>
        </div>
        <p style={{ margin: 0, color: "#666", fontSize: 13 }}>
          Alertas em tempo real (WebSocket) + Alertas APS C1–C7 (e-SUS PEC)
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "#fff", borderRadius: 8, padding: "14px 18px", border: "1px solid #e0e0e0" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1565c0" }}>{alertas.length + alertasAPS.length}</div>
          <div style={{ fontSize: 13, color: "#555" }}>Total</div>
        </div>
        <div style={{ background: "#ffebee", borderRadius: 8, padding: "14px 18px", border: "1px solid #ef9a9a" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#c62828" }}>{naoLidos + apsNaoLidos}</div>
          <div style={{ fontSize: 13, color: "#555" }}>Não lidos</div>
        </div>
        <div style={{ background: "#ffebee", borderRadius: 8, padding: "14px 18px", border: "1px solid #ef9a9a" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#c62828" }}>{contadores.CRITICO}</div>
          <div style={{ fontSize: 13, color: "#555" }}>Críticos (WS)</div>
        </div>
        <div style={{ background: "#e8f4fd", borderRadius: 8, padding: "14px 18px", border: "1px solid #90caf9" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1565c0" }}>{apsNaoLidos}</div>
          <div style={{ fontSize: 13, color: "#555" }}>APS não lidos</div>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid #e0e0e0", marginBottom: 20 }}>
        {([
          { id: "ws",  label: "WebSocket", count: naoLidos,    icon: <Activity size={13}/> },
          { id: "aps", label: "APS · C1–C7", count: apsNaoLidos, icon: <AlertTriangle size={13}/> },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setAbaAtiva(tab.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 20px", border: "none", background: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600,
              color: abaAtiva === tab.id ? "#1565c0" : "#9e9e9e",
              borderBottom: abaAtiva === tab.id ? "2px solid #1565c0" : "2px solid transparent",
              marginBottom: -2,
            }}>
            {tab.icon} {tab.label}
            {tab.count > 0 && (
              <span style={{ background: "#c62828", color: "#fff", fontSize: 10,
                fontWeight: 800, borderRadius: 10, padding: "1px 6px" }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── ABA WebSocket ── */}
      {abaAtiva === "ws" && (
        <>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
            <input
              placeholder="Buscar alertas..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: "7px 12px", fontSize: 13, minWidth: 200 }}
            />
            <div style={{ display: "flex", gap: 4 }}>
              {(["todos", "CRITICO", "AVISO", "INFO"] as const).map(n => {
                const cfg = n !== "todos" ? NIVEL_CONFIG[n] : null;
                return (
                  <button key={n} onClick={() => setFiltroNivel(n)}
                    style={{
                      padding: "5px 12px", borderRadius: 20, border: `1px solid ${cfg?.borda ?? "#e0e0e0"}`,
                      background: filtroNivel === n ? (cfg?.cor ?? "#1565c0") : "#fff",
                      color: filtroNivel === n ? "#fff" : (cfg?.cor ?? "#555"),
                      cursor: "pointer", fontSize: 12, fontWeight: 600,
                    }}>
                    {n === "todos" ? "Todos" : cfg?.label}
                    {n !== "todos" && <span style={{ marginLeft: 5, opacity: .75 }}>{contadores[n]}</span>}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {[["todos","Todos"],["nao_lido","Não lidos"],["lido","Lidos"]].map(([v, l]) => (
                <button key={v} onClick={() => setFiltroLido(v)}
                  style={{
                    padding: "5px 12px", borderRadius: 20, border: "1px solid #e0e0e0",
                    background: filtroLido === v ? "#424242" : "#fff",
                    color: filtroLido === v ? "#fff" : "#555",
                    cursor: "pointer", fontSize: 12, fontWeight: 600,
                  }}>
                  {l}
                </button>
              ))}
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              {naoLidos > 0 && (
                <button onClick={marcarTodosLidos}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "1px solid #c8e6c9", background: "#e8f5e9", color: "#2e7d32", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  <CheckCheck size={13} /> Marcar todos lidos
                </button>
              )}
              {alertas.length > 0 && (
                <button onClick={() => { if (confirm("Limpar todo o histórico de alertas?")) limparHistorico(); }}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "1px solid #ffcdd2", background: "#ffebee", color: "#c62828", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  <Trash2 size={13} /> Limpar histórico
                </button>
              )}
            </div>
          </div>

          {filtrados.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "#9e9e9e" }}>
              <Bell size={32} color="#e0e0e0" style={{ display: "block", margin: "0 auto 12px" }} />
              <div style={{ fontSize: 14 }}>Nenhum alerta encontrado</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                {!conectado ? "Aguardando conexão WebSocket..." : "Os alertas aparecerão aqui quando forem gerados"}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 12, color: "#9e9e9e", marginBottom: 10 }}>
                {filtrados.length} alerta{filtrados.length !== 1 ? "s" : ""} encontrado{filtrados.length !== 1 ? "s" : ""}
              </div>
              {filtrados.map((a, i) => (
                <AlertaCard key={a._localId ?? `${a.nivel}_${a.titulo}_${i}`} alerta={a} onMarcarLido={marcarLido} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── ABA APS C1–C7 ── */}
      {abaAtiva === "aps" && (
        <>
          <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 12, color: "#666" }}>
              Alertas gerados automaticamente pelo agente e-SUS PEC · Portaria GM/MS 3.493/2024
            </div>
            {apsNaoLidos > 0 && (
              <button
                onClick={() => alertasAPS.filter(a => !a.lido).forEach(a => marcarLidoAPS.mutate(a.id))}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "1px solid #c8e6c9", background: "#e8f5e9", color: "#2e7d32", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                <CheckCheck size={13} /> Marcar todos lidos
              </button>
            )}
          </div>

          {alertasAPS.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "#9e9e9e" }}>
              <Activity size={32} color="#e0e0e0" style={{ display: "block", margin: "0 auto 12px" }} />
              <div style={{ fontSize: 14 }}>Nenhum alerta APS disponível</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                Execute o agente pec_sync para sincronizar os indicadores C1–C7
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 12, color: "#9e9e9e", marginBottom: 10 }}>
                {alertasAPS.length} alerta{alertasAPS.length !== 1 ? "s" : ""} APS · {apsNaoLidos} não lido{apsNaoLidos !== 1 ? "s" : ""}
              </div>
              {alertasAPS.map(a => (
                <AlertaAPSCard key={a.id} alerta={a} onLido={() => marcarLidoAPS.mutate(a.id)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
