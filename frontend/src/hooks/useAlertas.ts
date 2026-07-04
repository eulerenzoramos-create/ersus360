// src/hooks/useAlertas.ts — WebSocket de alertas em tempo real
import { useEffect, useRef, useState, useCallback } from "react";

export interface AlertaWS {
  id?: number;
  nivel: "CRITICO" | "AVISO" | "INFO";
  categoria: string;
  titulo: string;
  descricao: string;
  modulo?: string;
  lido: boolean;
  ts?: string;
}

interface Estado {
  alertas: AlertaWS[];
  naoLidos: number;
  conectado: boolean;
}

const WS_URL = (() => {
  const api = import.meta.env.VITE_API_URL ?? "https://ersus360-production.up.railway.app";
  return api.replace(/^https/, "wss").replace(/^http/, "ws") + "/ws/alertas";
})();

export function useAlertas() {
  const [estado, setEstado] = useState<Estado>({ alertas: [], naoLidos: 0, conectado: false });
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const token = localStorage.getItem("ersus_token");
    const url = token ? `${WS_URL}?token=${token}` : WS_URL;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setEstado(e => ({ ...e, conectado: true }));

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.tipo === "snapshot") {
          setEstado({ alertas: msg.alertas ?? [], naoLidos: msg.total_nao_lidos ?? 0, conectado: true });
        } else if (msg.tipo === "alerta") {
          setEstado(e => ({
            conectado: true,
            alertas: [{ ...msg, lido: false, ts: msg.ts }, ...e.alertas].slice(0, 50),
            naoLidos: e.naoLidos + 1,
          }));
        }
        // pings ignorados
      } catch {
        // JSON inválido ignorado
      }
    };

    ws.onclose = () => {
      setEstado(e => ({ ...e, conectado: false }));
      // reconecta após 10s
      retryRef.current = setTimeout(connect, 10_000);
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      retryRef.current && clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const marcarLido = useCallback((id: number) => {
    setEstado(e => {
      const alertas = e.alertas.map(a => a.id === id ? { ...a, lido: true } : a);
      return { ...e, alertas, naoLidos: Math.max(0, alertas.filter(a => !a.lido).length) };
    });
  }, []);

  const marcarTodosLidos = useCallback(() => {
    setEstado(e => ({
      ...e,
      alertas: e.alertas.map(a => ({ ...a, lido: true })),
      naoLidos: 0,
    }));
  }, []);

  return { ...estado, marcarLido, marcarTodosLidos };
}
