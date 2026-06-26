// Módulo — Regulação em Saúde (SISREG / Central de Regulação)
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Network, CheckCircle2, XCircle, Clock } from "lucide-react";

const S = {
  page:  { padding: 20 } as React.CSSProperties,
  card:  { background: "#fff", borderRadius: 8, border: "1px solid #e5e5e3", padding: 16, marginBottom: 14 } as React.CSSProperties,
  title: { fontSize: 14, fontWeight: 600, marginBottom: 12 } as React.CSSProperties,
};

interface Dashboard {
  solicitacoes_mes: number; autorizadas: number; negadas: number;
  pendentes: number; tempo_medio_espera_dias: number; taxa_autorizacao: number;
}
interface Solicitacao {
  id: number; especialidade: string; tipo: string; status: string;
  solicitada_em: string; autorizada_em?: string; prazo_dias?: number;
}

const STATUS: Record<string, { cor: string; bg: string; icon: React.ReactNode }> = {
  "Autorizada": { cor: "#059669", bg: "#f0fdf4", icon: <CheckCircle2 size={12} /> },
  "Pendente":   { cor: "#d97706", bg: "#fffbeb", icon: <Clock size={12} /> },
  "Negada":     { cor: "#dc2626", bg: "#fff0f0", icon: <XCircle size={12} /> },
};

export default function Regulacao() {
  const [filtroStatus, setFiltroStatus] = useState("");

  const { data: dashboard } = useQuery<Dashboard>({
    queryKey: ["regulacao-dashboard"],
    queryFn: () => api.get("/api/regulacao/dashboard").then((r) => r.data),
  });
  const { data: solicitacoes = [] } = useQuery<Solicitacao[]>({
    queryKey: ["regulacao-solicitacoes", filtroStatus],
    queryFn: () => api.get("/api/regulacao/solicitacoes", { params: filtroStatus ? { status: filtroStatus } : {} }).then((r) => r.data),
  });

  const lista = filtroStatus
    ? (solicitacoes as Solicitacao[]).filter((s) => s.status === filtroStatus)
    : (solicitacoes as Solicitacao[]);

  return (
    <div style={S.page}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <Network size={16} /> Regulação em Saúde
      </div>

      {dashboard && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
            {[
              { label: "Solicitações / Mês", valor: dashboard.solicitacoes_mes,  cor: "#0284c7" },
              { label: "Autorizadas",         valor: dashboard.autorizadas,       cor: "#059669" },
              { label: "Pendentes",            valor: dashboard.pendentes,         cor: "#d97706" },
              { label: "Negadas",              valor: dashboard.negadas,           cor: "#dc2626" },
            ].map(({ label, valor, cor }) => (
              <div key={label} style={{ ...S.card, textAlign: "center", padding: 12, margin: 0 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: cor }}>{valor}</div>
                <div style={{ fontSize: 12, color: "#737373" }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: "#737373" }}>Taxa de Autorização</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: dashboard.taxa_autorizacao >= 80 ? "#059669" : "#d97706" }}>
                {dashboard.taxa_autorizacao}%
              </div>
              <div style={{ height: 8, background: "#e5e5e3", borderRadius: 4, overflow: "hidden", marginTop: 6 }}>
                <div style={{ width: `${dashboard.taxa_autorizacao}%`, height: "100%", background: dashboard.taxa_autorizacao >= 80 ? "#059669" : "#d97706", borderRadius: 4 }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#737373" }}>Tempo Médio de Espera</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: dashboard.tempo_medio_espera_dias > 15 ? "#dc2626" : "#059669" }}>
                {dashboard.tempo_medio_espera_dias} dias
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>meta: até 15 dias úteis</div>
            </div>
          </div>
        </>
      )}

      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={S.title}>Solicitações de Regulação</div>
          <div style={{ display: "flex", gap: 6 }}>
            {["", "Autorizada", "Pendente", "Negada"].map((s) => (
              <button
                key={s}
                onClick={() => setFiltroStatus(s)}
                style={{
                  padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11,
                  background: filtroStatus === s ? "#0284c7" : "#f5f5f3",
                  color: filtroStatus === s ? "#fff" : "#404040",
                }}
              >
                {s || "Todos"}
              </button>
            ))}
          </div>
        </div>

        {lista.map((s: Solicitacao) => {
          const cfg = STATUS[s.status] ?? STATUS["Pendente"];
          return (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0ee" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{s.especialidade}</span>
                  <span style={{ fontSize: 10, background: "#f5f5f3", borderRadius: 3, padding: "1px 5px", color: "#737373" }}>{s.tipo}</span>
                  <span style={{ background: cfg.bg, color: cfg.cor, borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 2 }}>
                    {cfg.icon} {s.status}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "#737373" }}>
                  Solicitada: {new Date(s.solicitada_em).toLocaleDateString("pt-BR")}
                  {s.autorizada_em && ` · Autorizada: ${new Date(s.autorizada_em).toLocaleDateString("pt-BR")}`}
                </div>
              </div>
              {s.prazo_dias !== undefined && s.prazo_dias !== null && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: s.prazo_dias <= 5 ? "#059669" : "#d97706" }}>
                    {s.prazo_dias}d
                  </div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>prazo</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
