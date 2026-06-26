// src/pages/FnsConvenios.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  RefreshCw, Eye, Zap, CheckCircle, AlertTriangle, AlertCircle,
  Plus, Trash2, TrendingUp,
} from "lucide-react";
import { apiFns, apiConvenios, apiRepasses, type FnsSyncResult } from "../lib/api";

const MESES = [
  "", "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const pct = (realizado: number, previsto: number) =>
  previsto > 0 ? Math.round((realizado / previsto) * 100) : 0;

const corPct = (p: number) =>
  p >= 75 ? "#3B6D11" : p >= 50 ? "#BA7517" : "#A32D2D";

export default function FnsConvenios() {
  const qc = useQueryClient();
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [syncResult, setSyncResult] = useState<FnsSyncResult | null>(null);
  const [tab, setTab] = useState<"painel" | "convenios" | "repasses">("painel");

  // Queries
  const { data: status } = useQuery({ queryKey: ["fns-status"], queryFn: apiFns.status });
  const { data: convenios = [] } = useQuery({ queryKey: ["convenios"], queryFn: () => apiConvenios.list() });
  const { data: repasses = [] } = useQuery({ queryKey: ["repasses"], queryFn: () => apiRepasses.list() });
  const { data: mensais = [] } = useQuery({ queryKey: ["repasses-mensais"], queryFn: () => apiRepasses.mensais(ano) });

  // Mutations
  const mutPreview = useMutation({
    mutationFn: () => apiFns.preview(mes, ano),
    onSuccess: (data) => setSyncResult(data),
  });

  const mutSync = useMutation({
    mutationFn: () => apiFns.sync(mes, ano),
    onSuccess: (data) => {
      setSyncResult(data);
      qc.invalidateQueries({ queryKey: ["convenios"] });
      qc.invalidateQueries({ queryKey: ["repasses"] });
      qc.invalidateQueries({ queryKey: ["repasses-mensais"] });
      qc.invalidateQueries({ queryKey: ["alertas"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const mutSyncTodos = useMutation({
    mutationFn: () => apiFns.syncTodos(),
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });

  const mutDeleteRepasse = useMutation({
    mutationFn: (id: number) => apiRepasses.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["repasses"] }),
  });

  const isLoading = mutPreview.isPending || mutSync.isPending || mutSyncTodos.isPending;

  // Dados do gráfico
  const graficoDados = mensais.map((m) => ({
    name: MESES[m.mes].slice(0, 3),
    Previsto: Math.round(m.total_previsto),
    Realizado: Math.round(m.total_realizado),
  }));

  const totalPrevisto = repasses.reduce((s, r) => s + r.valor_previsto, 0);
  const totalRealizado = repasses.reduce((s, r) => s + r.valor_realizado, 0);

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 500, margin: 0 }}>FNS / Convênios</h2>
          <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0 }}>
            Painel financeiro FNS · SIOPS · Repasses federais
          </p>
        </div>
        {status?.ultimo_sync && (
          <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", textAlign: "right" }}>
            Último sync: {new Date(status.ultimo_sync).toLocaleString("pt-BR")}
          </div>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: "10px" }}>
        {[
          { label: "Convênios vigentes", value: convenios.filter((c) => c.situacao === "Vigente" || c.situacao === "Em Execução").length },
          { label: "Total recebido", value: fmt(totalRealizado) },
          { label: "Execução geral", value: `${pct(totalRealizado, totalPrevisto)}%` },
          { label: "Repasses importados", value: repasses.filter((r) => r.origem === "fns_sync").length },
        ].map((k) => (
          <div key={k.label} style={{ background: "var(--color-background-secondary)", borderRadius: "8px", padding: "12px" }}>
            <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>{k.label}</div>
            <div style={{ fontSize: "20px", fontWeight: 500, marginTop: "4px" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Automação FNS */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "12px", padding: "16px" }}>
        <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
          <Zap size={16} />
          Automação FNS — Sincronização de Repasses
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "12px" }}>
          <div>
            <label style={{ fontSize: "11px", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>Mês</label>
            <select value={mes} onChange={(e) => setMes(Number(e.target.value))} style={{ padding: "6px 10px", fontSize: "13px", borderRadius: "6px", border: "0.5px solid var(--color-border-secondary)" }}>
              {MESES.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "11px", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>Ano</label>
            <select value={ano} onChange={(e) => setAno(Number(e.target.value))} style={{ padding: "6px 10px", fontSize: "13px", borderRadius: "6px", border: "0.5px solid var(--color-border-secondary)" }}>
              {[2024, 2025, 2026].map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <button
            onClick={() => mutPreview.mutate()}
            disabled={isLoading}
            style={{ padding: "7px 14px", fontSize: "12px", borderRadius: "8px", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
          >
            <Eye size={14} /> Consultar FNS
          </button>
          <button
            onClick={() => mutSync.mutate()}
            disabled={isLoading}
            style={{ padding: "7px 14px", fontSize: "12px", borderRadius: "8px", border: "none", background: "#1D9E75", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
          >
            <RefreshCw size={14} className={mutSync.isPending ? "spin" : ""} />
            {mutSync.isPending ? "Sincronizando..." : "Sincronizar"}
          </button>
          <button
            onClick={() => mutSyncTodos.mutate()}
            disabled={isLoading}
            style={{ padding: "7px 14px", fontSize: "12px", borderRadius: "8px", border: "0.5px solid var(--color-border-secondary)", background: "transparent", cursor: "pointer", fontSize: "11px" }}
          >
            Sync últimos 3 meses
          </button>
        </div>

        {/* Resultado do sync */}
        {syncResult && (
          <div style={{ background: "var(--color-background-secondary)", borderRadius: "8px", padding: "12px", fontSize: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontWeight: 500 }}>
              {syncResult.status === "ok" ? <CheckCircle size={14} color="#3B6D11" /> : <AlertCircle size={14} color="#BA7517" />}
              {syncResult.mensagem}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", marginBottom: "10px" }}>
              {[
                ["Encontrados", syncResult.total_encontrados],
                ["Novos", syncResult.novos_inseridos],
                ["Atualizados", syncResult.atualizados],
                ["Alertas", syncResult.alertas_gerados],
              ].map(([l, v]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "18px", fontWeight: 500 }}>{v}</div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>{l}</div>
                </div>
              ))}
            </div>
            {syncResult.itens.length > 0 && (
              <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                    <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: 500 }}>Convênio</th>
                    <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: 500 }}>Bloco</th>
                    <th style={{ textAlign: "right", padding: "4px 6px", fontWeight: 500 }}>Previsto</th>
                    <th style={{ textAlign: "right", padding: "4px 6px", fontWeight: 500 }}>Realizado</th>
                    <th style={{ textAlign: "right", padding: "4px 6px", fontWeight: 500 }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {syncResult.itens.map((item, i) => {
                    const p = pct(item.valor_realizado, item.valor_previsto);
                    return (
                      <tr key={i} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                        <td style={{ padding: "4px 6px", color: "var(--color-text-secondary)" }}>{item.numero_convenio}</td>
                        <td style={{ padding: "4px 6px" }}>{item.bloco}</td>
                        <td style={{ padding: "4px 6px", textAlign: "right" }}>{fmt(item.valor_previsto)}</td>
                        <td style={{ padding: "4px 6px", textAlign: "right" }}>{fmt(item.valor_realizado)}</td>
                        <td style={{ padding: "4px 6px", textAlign: "right", color: corPct(p), fontWeight: 500 }}>{p}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Gráfico evolução mensal */}
      {graficoDados.length > 0 && (
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "12px", padding: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <TrendingUp size={16} /> Evolução mensal de repasses {ano}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={graficoDados} barGap={4}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Previsto" fill="#B5D4F4" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Realizado" fill="#1D9E75" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabela de convênios */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)", fontSize: "13px", fontWeight: 500 }}>
          Convênios ({convenios.length})
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--color-background-secondary)" }}>
                <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 500 }}>Número</th>
                <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 500 }}>Objeto</th>
                <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 500 }}>Situação</th>
                <th style={{ textAlign: "right", padding: "8px 12px", fontWeight: 500 }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {convenios.map((c) => (
                <tr key={c.id} style={{ borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                  <td style={{ padding: "8px 12px", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>{c.numero}</td>
                  <td style={{ padding: "8px 12px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.objeto}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: "20px",
                      fontSize: "10px",
                      fontWeight: 500,
                      background: c.situacao === "Vigente" || c.situacao === "Em Execução" ? "#EAF3DE" : "#FAEEDA",
                      color: c.situacao === "Vigente" || c.situacao === "Em Execução" ? "#3B6D11" : "#633806",
                    }}>
                      {c.situacao}
                    </span>
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "right", whiteSpace: "nowrap" }}>{fmt(c.valor_contrato)}</td>
                </tr>
              ))}
              {convenios.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: "20px", textAlign: "center", color: "var(--color-text-secondary)", fontSize: "12px" }}>
                    Nenhum convênio. Faça o sync FNS para importar automaticamente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
