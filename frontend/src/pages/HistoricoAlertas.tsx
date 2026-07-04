// src/pages/HistoricoAlertas.tsx — Histórico de alertas WebSocket com persistência local
import { useState } from "react";
import { useAlertas, AlertaWS } from "../hooks/useAlertas";
import { Bell, AlertTriangle, Info, CheckCircle2, Trash2, CheckCheck, Wifi, WifiOff } from "lucide-react";

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

export default function HistoricoAlertas() {
  const { alertas, naoLidos, conectado, marcarLido, marcarTodosLidos, limparHistorico } = useAlertas();
  const [filtroNivel, setFiltroNivel] = useState<string>("todos");
  const [filtroLido, setFiltroLido]   = useState<string>("todos");
  const [busca, setBusca]             = useState("");

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
          Alertas recebidos em tempo real · Persistidos localmente · {alertas.length} registros
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "#fff", borderRadius: 8, padding: "14px 18px", border: "1px solid #e0e0e0" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1565c0" }}>{alertas.length}</div>
          <div style={{ fontSize: 13, color: "#555" }}>Total</div>
        </div>
        <div style={{ background: "#ffebee", borderRadius: 8, padding: "14px 18px", border: "1px solid #ef9a9a" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#c62828" }}>{naoLidos}</div>
          <div style={{ fontSize: 13, color: "#555" }}>Não lidos</div>
        </div>
        <div style={{ background: "#ffebee", borderRadius: 8, padding: "14px 18px", border: "1px solid #ef9a9a" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#c62828" }}>{contadores.CRITICO}</div>
          <div style={{ fontSize: 13, color: "#555" }}>Críticos</div>
        </div>
        <div style={{ background: "#fff8e1", borderRadius: 8, padding: "14px 18px", border: "1px solid #ffcc80" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#e65100" }}>{contadores.AVISO}</div>
          <div style={{ fontSize: 13, color: "#555" }}>Avisos</div>
        </div>
      </div>

      {/* Filtros + ações */}
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
              <button key={n}
                onClick={() => setFiltroNivel(n)}
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
            <button key={v}
              onClick={() => setFiltroLido(v)}
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
            <button
              onClick={marcarTodosLidos}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "1px solid #c8e6c9", background: "#e8f5e9", color: "#2e7d32", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
            >
              <CheckCheck size={13} /> Marcar todos lidos
            </button>
          )}
          {alertas.length > 0 && (
            <button
              onClick={() => { if (confirm("Limpar todo o histórico de alertas?")) limparHistorico(); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "1px solid #ffcdd2", background: "#ffebee", color: "#c62828", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
            >
              <Trash2 size={13} /> Limpar histórico
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "#9e9e9e" }}>
          <Bell size={32} color="#e0e0e0" style={{ marginBottom: 12, display: "block", margin: "0 auto 12px" }} />
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
            <AlertaCard
              key={a._localId ?? `${a.nivel}_${a.titulo}_${i}`}
              alerta={a}
              onMarcarLido={marcarLido}
            />
          ))}
        </div>
      )}
    </div>
  );
}
