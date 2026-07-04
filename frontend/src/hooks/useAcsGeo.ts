/**
 * Hook: useAcsGeo
 * Conecta ao WebSocket /ws/acs-geo como "gestor" e mantém
 * o estado em tempo real das posições e produção dos ACS.
 */
import { useEffect, useRef, useState, useCallback } from "react";

export interface PosicaoAcs {
  acs_id: number;
  nome: string;
  lat: number;
  lng: number;
  status: "ativo" | "em_visita" | "deslocamento" | "offline";
  microarea: string;
  precisao: number;
  bateria: number | null;
  ts: string;
}

export interface RegistroProducao {
  acs_id: number;
  nome: string;
  familia: string;
  cns_responsavel: string;
  microarea: string;
  lat: number | null;
  lng: number | null;
  procedimentos: string[];
  observacao: string;
  ts: string;
}

interface UseAcsGeoReturn {
  posicoes: PosicaoAcs[];
  producaoHoje: RegistroProducao[];
  totalAtivos: number;
  totalVisitas: number;
  conectado: boolean;
  ultimoEvento: string;
}

const WS_BASE = (import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL?.replace("https://", "wss://").replace("http://", "ws://") || "ws://localhost:8000");

export function useAcsGeo(): UseAcsGeoReturn {
  const [posicoes, setPosicoes] = useState<PosicaoAcs[]>([]);
  const [producaoHoje, setProducaoHoje] = useState<RegistroProducao[]>([]);
  const [conectado, setConectado] = useState(false);
  const [ultimoEvento, setUltimoEvento] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const token = localStorage.getItem("ersus_token") ?? "";
    const url = `${WS_BASE}/ws/acs-geo`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConectado(true);
      // Envia handshake como gestor
      ws.send(JSON.stringify({ role: "gestor", token }));
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);

        if (msg.tipo === "snapshot") {
          setPosicoes(msg.posicoes ?? []);
          setProducaoHoje(msg.producao_hoje ?? []);
          setUltimoEvento("snapshot recebido");
        } else if (msg.tipo === "localizacao") {
          setPosicoes(prev => {
            const outros = prev.filter(p => p.acs_id !== msg.acs_id);
            return [...outros, msg as PosicaoAcs];
          });
          setUltimoEvento(`${msg.nome} — ${msg.status} às ${new Date(msg.ts).toLocaleTimeString("pt-BR")}`);
        } else if (msg.tipo === "acs_offline") {
          setPosicoes(prev => prev.map(p =>
            p.acs_id === msg.acs_id ? { ...p, status: "offline" } : p
          ));
          setUltimoEvento(`ACS ${msg.acs_id} saiu`);
        } else if (msg.tipo === "producao_registrada") {
          setProducaoHoje(prev => [msg as RegistroProducao, ...prev].slice(0, 200));
          setUltimoEvento(`Produção: ${msg.nome} — ${msg.familia}`);
        } else if (msg.tipo === "checkin") {
          setUltimoEvento(`Check-in: ${msg.nome} em ${msg.microarea}`);
        }
      } catch { /* ignore parse errors */ }
    };

    ws.onclose = () => {
      setConectado(false);
      // Reconecta em 5s
      timerRef.current = setTimeout(connect, 5000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      timerRef.current && clearTimeout(timerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const totalAtivos = posicoes.filter(p => p.status !== "offline").length;
  const totalVisitas = producaoHoje.length;

  return { posicoes, producaoHoje, totalAtivos, totalVisitas, conectado, ultimoEvento };
}
