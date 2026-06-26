// Módulo 8 — Central de Alertas
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiAlertas, type Alerta } from "../lib/api";
import { Bell, AlertTriangle, Info, CheckCircle2, X, RefreshCw } from "lucide-react";

const S = {
  page: { padding: 20 } as React.CSSProperties,
  card: (cor: string) => ({
    background: "#fff",
    borderRadius: 8,
    border: `1px solid ${cor}30`,
    borderLeft: `4px solid ${cor}`,
    padding: 14,
    marginBottom: 8,
  }) as React.CSSProperties,
  btn: { padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 5 } as React.CSSProperties,
  chip: (bg: string, cor: string) => ({
    background: bg, color: cor, borderRadius: 4,
    padding: "2px 8px", fontSize: 11, fontWeight: 500,
    display: "inline-flex", alignItems: "center", gap: 3,
  }) as React.CSSProperties,
};

const SEV = {
  critico: { cor: "#dc2626", bg: "#fff0f0", label: "Crítico", icon: <AlertTriangle size={13} /> },
  atencao: { cor: "#d97706", bg: "#fffbeb", label: "Atenção",  icon: <AlertTriangle size={13} /> },
  info:    { cor: "#2563eb", bg: "#eff6ff", label: "Info",     icon: <Info size={13} /> },
};

const MODULO_CORES: Record<string, string> = {
  FNS: "#059669", APS: "#0284c7", Farmácia: "#7c3aed",
  MAC: "#dc2626", Vigilância: "#d97706", Obras: "#6b7280",
};

function AlertaCard({ alerta, onResolver, onRemover }: {
  alerta: Alerta;
  onResolver: () => void;
  onRemover: () => void;
}) {
  const sev = SEV[alerta.severidade] ?? SEV.info;
  const tempo = (() => {
    const d = Math.floor((Date.now() - new Date(alerta.criado_em).getTime()) / 60000);
    if (d < 60) return `${d}min atrás`;
    if (d < 1440) return `${Math.floor(d / 60)}h atrás`;
    return `${Math.floor(d / 1440)}d atrás`;
  })();

  return (
    <div style={S.card(sev.cor)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={S.chip(sev.bg, sev.cor)}>{sev.icon} {sev.label}</span>
            <span style={{
              background: `${MODULO_CORES[alerta.modulo] ?? "#6b7280"}15`,
              color: MODULO_CORES[alerta.modulo] ?? "#6b7280",
              borderRadius: 4, padding: "2px 7px", fontSize: 11,
            }}>
              {alerta.modulo}
            </span>
            <span style={{ fontSize: 11, color: "#737373" }}>{tempo}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{alerta.titulo}</div>
          <div style={{ fontSize: 12, color: "#404040", lineHeight: 1.5 }}>{alerta.descricao}</div>
        </div>
        <div style={{ display: "flex", gap: 6, marginLeft: 12, flexShrink: 0 }}>
          <button
            onClick={onResolver}
            title="Marcar como resolvido"
            style={{ ...S.btn, background: "#f0fdf4", color: "#059669", padding: "5px 10px" }}
          >
            <CheckCircle2 size={13} />
          </button>
          <button
            onClick={onRemover}
            title="Remover alerta"
            style={{ ...S.btn, background: "#f5f5f3", color: "#737373", padding: "5px 10px" }}
          >
            <X size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Alertas() {
  const [mostrarResolvidos, setMostrarResolvidos] = useState(false);
  const [filtroSev, setFiltroSev] = useState<string>("");
  const qc = useQueryClient();

  const { data: alertas = [], isLoading, refetch } = useQuery({
    queryKey: ["alertas", mostrarResolvidos],
    queryFn: () => apiAlertas.list(),
    refetchInterval: 30_000,
  });

  const resolver = useMutation({
    mutationFn: (id: number) => apiAlertas.resolver(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alertas"] }),
  });

  const remover = useMutation({
    mutationFn: (id: number) => apiAlertas.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alertas"] }),
  });

  const lista = (alertas as Alerta[]).filter((a) => {
    if (!mostrarResolvidos && a.resolvido) return false;
    if (filtroSev && a.severidade !== filtroSev) return false;
    return true;
  });

  const criticos = (alertas as Alerta[]).filter((a) => !a.resolvido && a.severidade === "critico").length;
  const atencao  = (alertas as Alerta[]).filter((a) => !a.resolvido && a.severidade === "atencao").length;
  const total    = (alertas as Alerta[]).filter((a) => !a.resolvido).length;

  return (
    <div style={S.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          <Bell size={16} />
          Central de Alertas
          {total > 0 && (
            <span style={{ background: "#dc2626", color: "#fff", borderRadius: 10, padding: "1px 8px", fontSize: 12 }}>
              {total}
            </span>
          )}
        </div>
        <button onClick={() => refetch()} style={{ ...S.btn, background: "#f5f5f3" }}>
          <RefreshCw size={13} /> Atualizar
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Críticos", valor: criticos, cor: "#dc2626", bg: "#fff0f0" },
          { label: "Atenção",  valor: atencao,  cor: "#d97706", bg: "#fffbeb" },
          { label: "Total Ativos", valor: total, cor: "#2563eb", bg: "#eff6ff" },
        ].map(({ label, valor, cor, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: 8, padding: "12px 16px", border: `1px solid ${cor}20` }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: cor }}>{valor}</div>
            <div style={{ fontSize: 12, color: "#737373" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {[
          { key: "", label: "Todos" },
          { key: "critico", label: "Críticos" },
          { key: "atencao", label: "Atenção" },
          { key: "info",    label: "Info" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFiltroSev(key)}
            style={{
              ...S.btn,
              background: filtroSev === key ? "#1D9E75" : "#f5f5f3",
              color: filtroSev === key ? "#fff" : "#404040",
              fontSize: 12,
            }}
          >
            {label}
          </button>
        ))}
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#737373", marginLeft: "auto", cursor: "pointer" }}>
          <input type="checkbox" checked={mostrarResolvidos} onChange={(e) => setMostrarResolvidos(e.target.checked)} />
          Mostrar resolvidos
        </label>
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", padding: 40, color: "#737373" }}>Carregando alertas…</div>
      )}

      {lista.map((a: Alerta) => (
        <AlertaCard
          key={a.id}
          alerta={a}
          onResolver={() => resolver.mutate(a.id)}
          onRemover={() => { if (window.confirm("Remover este alerta?")) remover.mutate(a.id); }}
        />
      ))}

      {!isLoading && lista.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: "#737373" }}>
          <CheckCircle2 size={36} style={{ marginBottom: 10, color: "#059669", opacity: 0.6 }} />
          <div style={{ fontSize: 14, fontWeight: 500 }}>Nenhum alerta ativo.</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            O sistema monitora automaticamente execução financeira, prazos e programas.
          </div>
        </div>
      )}
    </div>
  );
}
