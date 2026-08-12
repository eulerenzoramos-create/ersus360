// src/hooks/useAlertas.ts — WebSocket de alertas em tempo real com persistência
import { useEffect, useRef, useState, useCallback } from "react";

export interface AlertaWS {
  id?: number;
  nivel: "CRITICO" | "AVISO" | "INFO";
  categoria: string;
  titulo: string;
  descricao: string;
  modulo?: string;
  mensagem?: string;
  lido: boolean;
  ts?: string;
  _localId?: string;
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

const STORAGE_KEY = "ersus_alertas_historico";
const MAX_HISTORICO = 200;

function loadFromStorage(): AlertaWS[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(alertas: AlertaWS[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alertas.slice(0, MAX_HISTORICO)));
  } catch {
    // quota exceeded — ignora
  }
}

function mergeAlertas(existentes: AlertaWS[], novos: AlertaWS[]): AlertaWS[] {
  const ids = new Set(existentes.map(a => a._localId ?? `${a.nivel}_${a.titulo}_${a.ts}`));
  const unicos = novos.filter(a => {
    const k = a._localId ?? `${a.nivel}_${a.titulo}_${a.ts}`;
    if (ids.has(k)) return false;
    ids.add(k);
    return true;
  });
  return [...unicos, ...existentes].slice(0, MAX_HISTORICO);
}

export function useAlertas() {
  const [estado, setEstado] = useState<Estado>(() => {
    const hist = loadFromStorage();
    return { alertas: hist, naoLidos: hist.filter(a => !a.lido).length, conectado: false };
  });
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
          const novos: AlertaWS[] = (msg.alertas ?? []).map((a: AlertaWS) => ({
            ...a,
            ts: a.ts ?? new Date().toISOString(),
            _localId: `${a.nivel}_${a.titulo}_${a.ts ?? Date.now()}`,
          }));
          setEstado(e => {
            const merged = mergeAlertas(e.alertas, novos);
            saveToStorage(merged);
            return { alertas: merged, naoLidos: merged.filter(a => !a.lido).length, conectado: true };
          });
        } else if (msg.tipo === "alerta") {
          const novo: AlertaWS = {
            ...msg, lido: false,
            ts: msg.ts ?? new Date().toISOString(),
            descricao: msg.descricao ?? msg.mensagem ?? "",
            categoria: msg.categoria ?? msg.modulo ?? "Sistema",
            _localId: `${msg.nivel}_${msg.titulo}_${msg.ts ?? Date.now()}`,
          };
          setEstado(e => {
            const merged = mergeAlertas(e.alertas, [novo]);
            saveToStorage(merged);
            return { alertas: merged, naoLidos: merged.filter(a => !a.lido).length, conectado: true };
          });
        }
        // pings ignorados
      } catch {
        // JSON inválido ignorado
      }
    };

    ws.onclose = () => {
      setEstado(e => ({ ...e, conectado: false }));
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

  const marcarLido = useCallback((localId: string) => {
    setEstado(e => {
      const alertas = e.alertas.map(a =>
        (a._localId === localId) ? { ...a, lido: true } : a
      );
      saveToStorage(alertas);
      return { ...e, alertas, naoLidos: alertas.filter(a => !a.lido).length };
    });
  }, []);

  const marcarTodosLidos = useCallback(() => {
    setEstado(e => {
      const alertas = e.alertas.map(a => ({ ...a, lido: true }));
      saveToStorage(alertas);
      return { ...e, alertas, naoLidos: 0 };
    });
  }, []);

  const limparHistorico = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setEstado(e => ({ ...e, alertas: [], naoLidos: 0 }));
  }, []);

  return { ...estado, marcarLido, marcarTodosLidos, limparHistorico };
}
