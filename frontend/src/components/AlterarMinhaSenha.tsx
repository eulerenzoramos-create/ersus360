// Janela "Alterar minha senha": a própria pessoa troca a senha confirmando a atual.
// A senha nunca é exibida nem guardada fora deste formulário.
import { useState } from "react";
import { KeyRound, X } from "lucide-react";
import { api } from "../lib/api";

const inp: React.CSSProperties = { width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, boxSizing: "border-box" };
const lbl: React.CSSProperties = { display: "block", fontSize: 12, color: "#475569", marginBottom: 10 };

export default function AlterarMinhaSenha({ onClose }: { onClose: () => void }) {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [conf, setConf] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [enviando, setEnviando] = useState(false);

  const salvar = async () => {
    setMsg(null);
    if (nova.length < 8) return setMsg({ ok: false, texto: "A nova senha precisa ter pelo menos 8 caracteres." });
    if (nova !== conf) return setMsg({ ok: false, texto: "As duas novas senhas não são iguais." });
    setEnviando(true);
    try {
      await api.post("/api/auth/minha-senha", { senha_atual: atual, senha_nova: nova });
      setAtual(""); setNova(""); setConf("");
      setMsg({ ok: true, texto: "Senha alterada. Use a nova senha no próximo acesso." });
    } catch (e: any) {
      const d = e?.response?.data?.detail;
      setMsg({ ok: false, texto: typeof d === "string" ? d : "Não foi possível alterar a senha. Tente novamente." });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Alterar minha senha" onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 400, padding: 20,
        boxShadow: "0 20px 50px rgba(0,0,0,.3)", color: "#1f2937" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
            <KeyRound size={18} color="#1d4ed8" /> Alterar minha senha</div>
          <button onClick={onClose} aria-label="Fechar" style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
        </div>
        <label style={lbl}>Senha atual
          <input type="password" autoComplete="current-password" style={inp} value={atual} onChange={e => setAtual(e.target.value)} /></label>
        <label style={lbl}>Nova senha (mínimo 8 caracteres)
          <input type="password" autoComplete="new-password" style={inp} value={nova} onChange={e => setNova(e.target.value)} /></label>
        <label style={lbl}>Repita a nova senha
          <input type="password" autoComplete="new-password" style={inp} value={conf} onChange={e => setConf(e.target.value)} /></label>
        {msg && <div role="status" style={{ fontSize: 12, marginBottom: 10, padding: "8px 10px", borderRadius: 6,
          background: msg.ok ? "#f0fdf4" : "#fef2f2", color: msg.ok ? "#166534" : "#991b1b",
          border: `1px solid ${msg.ok ? "#86efac" : "#fca5a5"}` }}>{msg.texto}</div>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", fontSize: 13 }}>
            {msg?.ok ? "Fechar" : "Cancelar"}</button>
          <button onClick={salvar} disabled={enviando || !atual} style={{ padding: "8px 14px", borderRadius: 6, border: "none",
            background: "#1d4ed8", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, opacity: enviando || !atual ? 0.6 : 1 }}>
            {enviando ? "Salvando…" : "Salvar nova senha"}</button>
        </div>
      </div>
    </div>);
}
