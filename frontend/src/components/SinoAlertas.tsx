// src/components/SinoAlertas.tsx — Sino de notificações em tempo real
import { useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useAlertas, AlertaWS } from "../hooks/useAlertas";

const NIVEL_COR: Record<string, string> = {
  CRITICO: "#c62828",
  AVISO: "#e65100",
  INFO: "#1565c0",
};

export function SinoAlertas() {
  const { alertas, naoLidos, conectado, marcarLido, marcarTodosLidos } = useAlertas();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Botão sino */}
      <button
        onClick={() => setAberto(v => !v)}
        title="Alertas"
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "6px 8px",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Bell size={20} color={naoLidos > 0 ? "#c62828" : "#9e9e9e"} />
        {naoLidos > 0 && (
          <span style={{
            position: "absolute",
            top: 2, right: 2,
            background: "#c62828",
            color: "#fff",
            borderRadius: "50%",
            fontSize: 9,
            fontWeight: 700,
            minWidth: 15,
            height: 15,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 2px",
          }}>
            {naoLidos > 99 ? "99+" : naoLidos}
          </span>
        )}
        {/* indicador de conexão */}
        <span style={{
          position: "absolute",
          bottom: 4, right: 4,
          width: 6, height: 6,
          borderRadius: "50%",
          background: conectado ? "#2e7d32" : "#bdbdbd",
        }} />
      </button>

      {/* Painel dropdown */}
      {aberto && (
        <>
          {/* overlay para fechar ao clicar fora */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 999 }}
            onClick={() => setAberto(false)}
          />
          <div style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            width: 360,
            maxHeight: 480,
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,.18)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{
              padding: "12px 16px",
              borderBottom: "1px solid #f0f0f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#212121" }}>Alertas</span>
                {naoLidos > 0 && (
                  <span style={{
                    marginLeft: 8,
                    background: "#c62828",
                    color: "#fff",
                    borderRadius: 10,
                    fontSize: 11,
                    padding: "1px 8px",
                    fontWeight: 700,
                  }}>
                    {naoLidos} novo{naoLidos > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {naoLidos > 0 && (
                <button
                  onClick={marcarTodosLidos}
                  style={{ fontSize: 11, color: "#1565c0", background: "none", border: "none", cursor: "pointer" }}
                >
                  Marcar todos como lidos
                </button>
              )}
            </div>

            {/* Lista */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {alertas.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#9e9e9e", fontSize: 13 }}>
                  Nenhum alerta no momento
                </div>
              ) : (
                alertas.slice(0, 20).map((a: AlertaWS, i) => (
                  <div
                    key={a._localId ?? i}
                    onClick={() => a._localId && marcarLido(a._localId)}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #f5f5f5",
                      borderLeft: `3px solid ${NIVEL_COR[a.nivel] ?? "#9e9e9e"}`,
                      background: a.lido ? "#fafafa" : "#fff",
                      cursor: "pointer",
                      transition: "background .15s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: NIVEL_COR[a.nivel] ?? "#9e9e9e",
                            background: (NIVEL_COR[a.nivel] ?? "#9e9e9e") + "15",
                            padding: "1px 6px",
                            borderRadius: 3,
                          }}>
                            {a.nivel}
                          </span>
                          <span style={{ fontSize: 10, color: "#9e9e9e", background: "#f5f5f5", padding: "1px 6px", borderRadius: 3 }}>
                            {a.categoria}
                          </span>
                          {!a.lido && (
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#c62828", flexShrink: 0 }} />
                          )}
                        </div>
                        <div style={{ fontWeight: a.lido ? 400 : 600, fontSize: 13, color: "#212121" }}>{a.titulo}</div>
                        <div style={{ fontSize: 12, color: "#757575", marginTop: 2 }}>{a.descricao}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: "8px 16px",
              borderTop: "1px solid #f0f0f0",
              fontSize: 11,
              color: "#9e9e9e",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span>{conectado ? "🟢 Conectado em tempo real" : "⚪ Reconectando..."}</span>
              <a href="/alertas/historico" style={{ color: "#1565c0", textDecoration: "none", fontWeight: 600 }}>
                Ver histórico completo →
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
