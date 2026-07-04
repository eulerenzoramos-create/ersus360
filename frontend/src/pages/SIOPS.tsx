// src/pages/SIOPS.tsx — SIOPS / Mínimo Constitucional em Saúde ERSUS 360
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiSiops } from "../lib/api";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

type Bloco = { bloco: string; transferido: number; aplicado: number; pct_exec: number };
type Trim  = { trimestre: string; receita_imp: number; gasto_proprio: number; minimo_pct: number; status: string };

export default function SIOPS() {
  const [tab, setTab] = useState<"apuracao" | "blocos" | "trimestral" | "historico">("apuracao");

  const { data: apuracao } = useQuery({ queryKey: ["siops-apuracao"], queryFn: () => apiSiops.apuracao() });
  const { data: blocos }   = useQuery({ queryKey: ["siops-blocos"],   queryFn: apiSiops.blocos,    enabled: tab === "blocos" });
  const { data: trim }     = useQuery({ queryKey: ["siops-trim"],     queryFn: apiSiops.trimestral, enabled: tab === "trimestral" });
  const { data: hist }     = useQuery({ queryKey: ["siops-hist"],     queryFn: apiSiops.historico, enabled: tab === "historico" });

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1565c0" }}>SIOPS — Mínimo Constitucional</h2>
        <p style={{ margin: "4px 0 0", color: "#666", fontSize: 13 }}>
          EC 29/2000 · LC 141/2012 · Apuí/AM · Ano {apuracao?.ano ?? 2026}
        </p>
      </div>

      {/* Gauge mínimo */}
      {apuracao && (
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16, marginBottom: 20 }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 24, border: "2px solid #2e7d3230", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 56, fontWeight: 900, color: "#2e7d32", lineHeight: 1 }}>{apuracao.minimo_constitucional_pct_aplicado.toFixed(1)}%</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#2e7d32", marginTop: 6 }}>MÍNIMO ATINGIDO</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>Meta: ≥ {apuracao.minimo_constitucional_pct_obrigatorio}% · Superávit: +{apuracao.superavit_minimo_pct.toFixed(1)}%</div>
            <div style={{ marginTop: 14, height: 12, width: "100%", background: "#f0f0f0", borderRadius: 6, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min((apuracao.minimo_constitucional_pct_aplicado / 25) * 100, 100)}%`, background: "#2e7d32", borderRadius: 6 }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { label: "Receita de Impostos",    value: fmt(apuracao.receita_impostos),          cor: "#1565c0" },
              { label: "Mínimo Obrigatório",      value: fmt(apuracao.minimo_constitucional_valor_obrigatorio), cor: "#f57f17" },
              { label: "Gasto Próprio em Saúde",  value: fmt(apuracao.gasto_proprio_saude),      cor: "#2e7d32" },
              { label: "Transferências SUS",      value: fmt(apuracao.transferencias_sus),        cor: "#6a1b9a" },
              { label: "Gasto Total em Saúde",    value: fmt(apuracao.gasto_total_saude),         cor: "#1565c0" },
              { label: "Atenção Básica",          value: fmt(apuracao.atenção_basica_gasto),      cor: "#2e7d32" },
            ].map(k => (
              <div key={k.label} style={{ background: "#fff", borderRadius: 8, padding: "14px 16px", border: `1px solid ${k.cor}20` }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: k.cor }}>{k.value}</div>
                <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Abas */}
      <div style={{ display: "flex", gap: 2, marginBottom: 16, borderBottom: "2px solid #e0e0e0" }}>
        {[
          { key: "apuracao"   as const, label: "Apuração Anual" },
          { key: "blocos"     as const, label: "Execução por Bloco" },
          { key: "trimestral" as const, label: "Trimestral" },
          { key: "historico"  as const, label: "Histórico 5 anos" },
        ].map(a => (
          <button key={a.key} onClick={() => setTab(a.key)}
            style={{ padding: "8px 18px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: tab === a.key ? "#1565c0" : "transparent",
              color: tab === a.key ? "#fff" : "#555", borderRadius: "6px 6px 0 0" }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Apuração anual */}
      {tab === "apuracao" && apuracao && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 20, border: "1px solid #e0e0e0" }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: "#333" }}>Composição do Gasto em Saúde</div>
            {[
              { label: "Atenção Básica",            v: apuracao.atenção_basica_gasto,    cor: "#1565c0" },
              { label: "Média e Alta Complexidade",  v: apuracao.media_alta_complex_gasto,cor: "#6a1b9a" },
              { label: "Vigilância em Saúde",        v: apuracao.vigilancia_gasto,         cor: "#e65100" },
              { label: "Assistência Farmacêutica",   v: apuracao.assistencia_farmaceutica_gasto, cor: "#2e7d32" },
              { label: "Gestão em Saúde",            v: apuracao.gestao_saude_gasto,       cor: "#f57f17" },
            ].map(item => {
              const pct = (item.v / apuracao.gasto_total_saude) * 100;
              return (
                <div key={item.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span>{item.label}</span>
                    <span style={{ fontWeight: 700, color: item.cor }}>{fmt(item.v)} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: item.cor, borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ background: "#fff", borderRadius: 10, padding: 20, border: "1px solid #e0e0e0" }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: "#333" }}>Conformidade LC 141/2012</div>
            {[
              { label: "Receita de Impostos",     value: fmt(apuracao.receita_impostos),   ok: true },
              { label: "15% Mínimo Obrigatório",  value: fmt(apuracao.minimo_constitucional_valor_obrigatorio), ok: true },
              { label: "Gasto Próprio Aplicado",  value: fmt(apuracao.gasto_proprio_saude), ok: apuracao.gasto_proprio_saude >= apuracao.minimo_constitucional_valor_obrigatorio },
              { label: "% Aplicado",              value: `${apuracao.minimo_constitucional_pct_aplicado.toFixed(2)}%`, ok: true },
              { label: "Situação",                value: apuracao.status_minimo.toUpperCase(), ok: apuracao.status_minimo === "atingido" },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
                <span style={{ fontSize: 13, color: "#555" }}>{r.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{r.value}</span>
                  <span style={{ fontSize: 16 }}>{r.ok ? "✅" : "❌"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blocos */}
      {tab === "blocos" && blocos && (
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e0e0e0", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 700, color: "#333" }}>Execução por Bloco de Financiamento FNS</div>
            <div style={{ fontSize: 13, color: "#666" }}>
              Total: {fmt(blocos.total_aplicado)} / {fmt(blocos.total_transferido)} — <strong style={{ color: "#2e7d32" }}>{blocos.pct_exec_total}%</strong>
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                {["Bloco", "Transferido", "Aplicado", "% Exec.", "Status"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, color: "#666", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {blocos.blocos?.map((b: Bloco, i: number) => (
                <tr key={b.bloco} style={{ borderTop: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600 }}>{b.bloco}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>{fmt(b.transferido)}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700 }}>{fmt(b.aplicado)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 8, background: "#f0f0f0", borderRadius: 4, minWidth: 80 }}>
                        <div style={{ height: "100%", width: `${Math.min(b.pct_exec, 100)}%`, background: b.pct_exec >= 90 ? "#2e7d32" : b.pct_exec >= 70 ? "#f57f17" : "#c62828", borderRadius: 4 }} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 13, color: b.pct_exec >= 90 ? "#2e7d32" : b.pct_exec >= 70 ? "#f57f17" : "#c62828", minWidth: 45, textAlign: "right" }}>
                        {b.pct_exec.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: b.pct_exec >= 90 ? "#e8f5e9" : "#fff8e1", color: b.pct_exec >= 90 ? "#2e7d32" : "#f57f17", padding: "2px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                      {b.pct_exec >= 100 ? "SUPERÁVIT" : b.pct_exec >= 90 ? "OK" : b.pct_exec >= 70 ? "ATENÇÃO" : "CRÍTICO"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Trimestral */}
      {tab === "trimestral" && trim && (
        <div>
          {trim.alerta_1t && (
            <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#e65100" }}>
              ⚠ {trim.alerta_1t}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {trim.trimestres?.map((t: Trim) => (
              <div key={t.trimestre} style={{
                background: "#fff", borderRadius: 10, padding: 18,
                border: `2px solid ${t.status === "atingido" ? "#2e7d3230" : "#c6282830"}`,
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 12 }}>{t.trimestre}</div>
                <div style={{ fontSize: 30, fontWeight: 900, color: t.status === "atingido" ? "#2e7d32" : "#c62828" }}>
                  {t.minimo_pct.toFixed(2)}%
                </div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>Meta: ≥ 15%</div>
                <div style={{ marginTop: 12, fontSize: 12, color: "#555" }}>
                  <div>Receita imp.: {fmt(t.receita_imp)}</div>
                  <div>Gasto próprio: {fmt(t.gasto_proprio)}</div>
                </div>
                <span style={{
                  display: "inline-block", marginTop: 10,
                  background: t.status === "atingido" ? "#e8f5e9" : "#ffebee",
                  color: t.status === "atingido" ? "#2e7d32" : "#c62828",
                  padding: "2px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                }}>
                  {t.status === "atingido" ? "✅ ATINGIDO" : "❌ PENDENTE"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico */}
      {tab === "historico" && hist && (
        <div style={{ background: "#fff", borderRadius: 10, padding: 20, border: "1px solid #e0e0e0" }}>
          <div style={{ fontWeight: 700, marginBottom: 20, color: "#333" }}>Histórico do Mínimo Constitucional — últimos 5 anos</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 20, height: 180, marginBottom: 20 }}>
            {hist.historico?.map((h: { ano: number; minimo_pct: number; status: string }) => {
              const maxV = 25;
              const hh = (h.minimo_pct / maxV) * 160;
              return (
                <div key={h.ano} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#2e7d32" }}>{h.minimo_pct.toFixed(2)}%</div>
                  <div style={{ width: "100%", height: hh, background: "#2e7d32", borderRadius: "4px 4px 0 0", position: "relative" }}>
                    {/* Linha de 15% */}
                    <div style={{ position: "absolute", bottom: (15 / maxV) * hh - 1, left: 0, right: 0, borderTop: "2px dashed #c62828" }} />
                  </div>
                  <div style={{ fontSize: 12, color: "#888", fontWeight: 700 }}>{h.ano}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
            <span><span style={{ display: "inline-block", width: 16, height: 3, background: "#2e7d32", marginRight: 6, verticalAlign: "middle" }} />Mínimo aplicado</span>
            <span><span style={{ display: "inline-block", width: 16, borderTop: "2px dashed #c62828", marginRight: 6, verticalAlign: "middle" }} />Limite obrigatório (15%)</span>
          </div>
          <div style={{ marginTop: 16, padding: 14, background: "#e8f5e9", borderRadius: 8, border: "1px solid #c8e6c9", fontSize: 13 }}>
            ✅ Apuí/AM atingiu o mínimo constitucional em saúde nos últimos 5 anos consecutivos. Média do período: {(hist.historico.reduce((s: number, h: { minimo_pct: number }) => s + h.minimo_pct, 0) / hist.historico.length).toFixed(2)}%
          </div>
        </div>
      )}
    </div>
  );
}
