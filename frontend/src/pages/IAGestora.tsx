// src/pages/IAGestora.tsx
import { useState, useRef, useEffect } from "react";
import { api } from "../lib/api";
import { Bot, Send, RefreshCw } from "lucide-react";

interface Msg { role: "user" | "assistant"; content: string }

const CHIPS = [
  "Qual a situação geral do FMS Apuí em junho/2026?",
  "O que precisa de ação urgente?",
  "Explique o que é o Previne Brasil",
  "Como melhorar a execução MAC?",
  "Gere um resumo executivo para a câmara municipal",
  "O que é ICSAP e por que é importante?",
];

export default function IAGestora() {
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Olá! Sou a IA Gestora do ERSUS 360 para o FMS de Apuí/AM. Posso analisar indicadores, interpretar repasses do FNS, sugerir ações para metas em risco e gerar relatórios. Como posso ajudar?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async (texto?: string) => {
    const txt = (texto ?? input).trim();
    if (!txt || loading) return;
    setInput("");

    const novas: Msg[] = [...msgs, { role: "user", content: txt }];
    setMsgs(novas);
    setLoading(true);

    try {
      const res = await api.post("/api/ia/chat", {
        mensagens: novas.map((m) => ({ role: m.role, content: m.content })),
      });
      setMsgs((prev) => [...prev, { role: "assistant", content: res.data.resposta }]);
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? "Erro ao chamar a IA. Verifique o ANTHROPIC_API_KEY no .env";
      setMsgs((prev) => [...prev, { role: "assistant", content: `⚠️ ${detail}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px", height: "calc(100vh - 110px)" }}>
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "12px", display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "12px 14px", borderBottom: "0.5px solid var(--color-border-tertiary)", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1D9E75" }} />
          <Bot size={15} color="#1D9E75" />
          <span style={{ fontSize: "13px", fontWeight: 500 }}>IA Gestora — ERSUS 360 / Apuí-AM</span>
          <button onClick={() => setMsgs([{ role: "assistant", content: "Conversa reiniciada. Como posso ajudar?" }])}
            style={{ marginLeft: "auto", padding: "4px 8px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 6, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--color-text-secondary)" }}>
            <RefreshCw size={11} /> Limpar
          </button>
        </div>

        {/* Chips */}
        <div style={{ padding: "8px 14px", borderBottom: "0.5px solid var(--color-border-tertiary)", display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {CHIPS.map((c) => (
            <button key={c} onClick={() => send(c)}
              style={{ fontSize: "11px", padding: "3px 10px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 20, cursor: "pointer", background: "transparent", color: "var(--color-text-secondary)" }}>
              {c.length > 35 ? c.slice(0, 35) + "…" : c}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "85%", padding: "9px 12px", borderRadius: 10, fontSize: "12px", lineHeight: 1.65,
                background: m.role === "user" ? "#1D9E75" : "var(--color-background-secondary)",
                color: m.role === "user" ? "#fff" : "var(--color-text-primary)",
                border: m.role === "user" ? "none" : "0.5px solid var(--color-border-tertiary)",
                whiteSpace: "pre-wrap",
              }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex" }}>
              <div style={{ padding: "9px 14px", borderRadius: 10, fontSize: "12px", background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", color: "var(--color-text-secondary)" }}>
                Analisando...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "10px 14px", borderTop: "0.5px solid var(--color-border-tertiary)", display: "flex", gap: "8px" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Pergunte sobre gestão, indicadores, repasses, farmácia..."
            style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "0.5px solid var(--color-border-secondary)", fontSize: "12px" }}
            disabled={loading}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            style={{ padding: "8px 14px", background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            <Send size={13} /> Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
