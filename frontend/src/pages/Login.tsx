// Tela de Login — ERSUS 360
import { useState, FormEvent } from "react";
import { api } from "../lib/api";

interface Props { onLogin: (token: string, perfil: string, nome: string) => void }

export default function Login({ onLogin }: Props) {
  const [email, setEmail]       = useState("");
  const [senha, setSenha]       = useState("");
  const [erro, setErro]         = useState("");
  const [loading, setLoading]   = useState(false);

  const entrar = async (e: FormEvent) => {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("username", email);
      params.append("password", senha);
      const { data } = await api.post("/api/auth/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const perfil = data.user?.role ?? "financeiro";
      const nome   = data.user?.nome ?? email;
      localStorage.setItem("ersus_token",  data.access_token);
      localStorage.setItem("ersus_perfil", perfil);
      localStorage.setItem("ersus_nome",   nome);
      onLogin(data.access_token, perfil, nome);
    } catch {
      setErro("Usuário ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg,#0f4c35 0%,#1D9E75 60%,#34d399 100%)",
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: 40, width: 380,
        boxShadow: "0 20px 60px rgba(0,0,0,.18)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: "#1D9E75",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, margin: "0 auto 12px",
          }}>⚕</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0f4c35" }}>ERSUS 360</div>
          <div style={{ fontSize: 13, color: "#737373", marginTop: 2 }}>
            Gestão Inteligente do SUS
          </div>
        </div>

        <form onSubmit={entrar}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: "#404040", display: "block", marginBottom: 5, fontWeight: 500 }}>
              Usuário / E-mail
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="gestor"
              required
              style={{
                width: "100%", boxSizing: "border-box", padding: "10px 12px",
                border: "1.5px solid #e5e5e3", borderRadius: 8, fontSize: 14,
                outline: "none", transition: "border .15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1D9E75")}
              onBlur={(e)  => (e.target.style.borderColor = "#e5e5e3")}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: "#404040", display: "block", marginBottom: 5, fontWeight: 500 }}>
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: "100%", boxSizing: "border-box", padding: "10px 12px",
                border: "1.5px solid #e5e5e3", borderRadius: 8, fontSize: 14,
                outline: "none", transition: "border .15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1D9E75")}
              onBlur={(e)  => (e.target.style.borderColor = "#e5e5e3")}
            />
          </div>

          {erro && (
            <div style={{ background: "#fff0f0", color: "#dc2626", borderRadius: 7, padding: "9px 12px", fontSize: 13, marginBottom: 14 }}>
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "11px 0", borderRadius: 8, border: "none",
              background: loading ? "#9ca3af" : "#1D9E75", color: "#fff",
              fontSize: 15, fontWeight: 600, cursor: loading ? "default" : "pointer",
              transition: "background .15s",
            }}
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <div style={{ marginTop: 20, padding: "12px 14px", background: "#f0fdf4", borderRadius: 8, fontSize: 12, color: "#166534" }}>
          <strong>Credenciais padrão:</strong><br />
          gestor / ersus2026 &nbsp;·&nbsp; admin / admin2026
        </div>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "#9ca3af" }}>
          Fundo Municipal de Saúde — Apuí / AM<br />
          Sistema homologado conforme LGPD · Lei 13.709/2018
        </div>
      </div>
    </div>
  );
}
