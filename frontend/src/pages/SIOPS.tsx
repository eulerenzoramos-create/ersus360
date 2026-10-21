// src/pages/SIOPS.tsx — SIOPS / Mínimo Constitucional em Saúde ERSUS 360
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGetRaw } from "../lib/api";
import { BRL, PCT } from "../lib/fmt";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import SIOPSCompleto from "./SIOPSCompleto";
import SIOPSDetalhado from "./SIOPSDetalhado";
import SIOPSLive from "./SIOPSLive";

type OuterTab = "resumo" | "completo" | "detalhado" | "live";

const OUTER_TABS: { key: OuterTab; label: string }[] = [
  { key: "resumo",    label: "Resumo" },
  { key: "completo",  label: "Completo" },
  { key: "detalhado", label: "Detalhado" },
  { key: "live",      label: "Live" },
];

export default function SIOPS() {
  const [outerTab, setOuterTab] = useState<OuterTab>("resumo");


  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Abas externas */}
      <div style={{ display: "flex", gap: 0, borderBottom: "3px solid #1565c0", background: "#f5f7fa", padding: "0 24px" }}>
        {OUTER_TABS.map(a => (
          <button key={a.key} onClick={() => setOuterTab(a.key)}
            style={{
              padding: "12px 22px", border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: outerTab === a.key ? 700 : 500,
              background: outerTab === a.key ? "#1565c0" : "transparent",
              color: outerTab === a.key ? "#fff" : "#555",
              borderRadius: "6px 6px 0 0",
              marginBottom: -3,
              borderBottom: outerTab === a.key ? "3px solid #1565c0" : "3px solid transparent",
            }}>
            {a.label}
          </button>
        ))}
      </div>

      {outerTab === "completo"  && <SIOPSCompleto />}
      {outerTab === "detalhado" && <SIOPSDetalhado />}
      {outerTab === "live"      && <SIOPSLive />}

      {outerTab === "resumo" && <SiopsResumo />}

    </div>
  );
}

// ── Resumo: mínimo constitucional pelos indicadores HOMOLOGADOS do SIOPS ─────
// Fonte única: consulta pública do SIOPS (/api/siops/apuracao e /historico). Ano em andamento aparece como
// parcial (acumulado até o último bimestre homologado) — nunca como "atingido"/"não atingido".
const corStatus = (st?: string | null) =>
  st === "atingido" ? "#2e7d32" : st === "nao_atingido" ? "#c62828" : st === "parcial_abaixo" ? "#b45309" : st === "parcial_acima" ? "#1565c0" : "#6b7280";
const rotStatus = (st?: string | null) =>
  ({ atingido: "MÍNIMO ATINGIDO", nao_atingido: "MÍNIMO NÃO ATINGIDO", parcial_acima: "PARCIAL — ACIMA DE 15% ATÉ AGORA",
     parcial_abaixo: "PARCIAL — ABAIXO DE 15% ATÉ AGORA" } as Record<string, string>)[st ?? ""] ?? "SEM DADO HOMOLOGADO";

function SiopsResumo() {
  const anoPadrao = new Date().getFullYear() - 1;
  const [ano, setAno] = useState(anoPadrao);
  const { data: a, isLoading } = useQuery<any>({ queryKey: ["siops-apuracao", ano], queryFn: () => apiGetRaw("/api/siops/apuracao", { ano }) });
  const { data: h } = useQuery<any>({ queryKey: ["siops-historico"], queryFn: () => apiGetRaw("/api/siops/historico") });
  const anos: any[] = h?.anos ?? [];
  const ok = a?.situacao_dado === "oficial_validado";
  const cor = corStatus(a?.status_minimo);
  const pct = a?.percentual_saude_receita as number | null | undefined;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1565c0" }}>SIOPS — Mínimo Constitucional em Saúde</h2>
          <p style={{ margin: "4px 0 0", color: "#4b5563", fontSize: 13 }}>
            LC 141/2012 (mínimo municipal de 15%) · {a?.municipio ?? "—"}/{a?.uf ?? ""} · {ok ? `${a.ano} — ${a.periodo}` : `Ano ${ano}`}
          </p>
        </div>
        <label style={{ fontSize: 13, color: "#374151" }}>Ano:{" "}
          <select value={ano} onChange={e => setAno(Number(e.target.value))} style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 10px", fontSize: 13 }}>
            {[0, 1, 2, 3, 4, 5].map(i => anoPadrao + 1 - i).map(y => <option key={y} value={y}>{y}{y > anoPadrao ? " (em andamento)" : ""}</option>)}
          </select>
        </label>
      </div>

      {isLoading && <div style={{ fontSize: 13, color: "#4b5563" }}>Consultando o SIOPS…</div>}
      {!isLoading && !ok && <NaoDisponivelBanner titulo="Sem dados homologados" nota={a?.nota ?? "O SIOPS não respondeu agora. Nenhum valor foi estimado."} />}

      {ok && (
        <>
          {(a.alertas ?? []).map((al: any, i: number) => (
            <div key={i} style={{ background: al.nivel === "critico" ? "#fef2f2" : "#fffbeb", border: `1px solid ${al.nivel === "critico" ? "#fca5a5" : "#fcd34d"}`,
              color: al.nivel === "critico" ? "#991b1b" : "#92400e", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 12 }}>{al.mensagem}</div>
          ))}
          {a.nota && <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 12 }}>{a.nota}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 260px) 1fr", gap: 16, marginBottom: 20 }}>
            <div style={{ background: "#fff", borderRadius: 10, padding: 24, border: `2px solid ${cor}40`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 52, fontWeight: 900, color: cor, lineHeight: 1 }}>{PCT(pct)}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: cor, marginTop: 6, textAlign: "center" }}>{rotStatus(a.status_minimo)}</div>
              <div style={{ fontSize: 12, color: "#4b5563", marginTop: 4, textAlign: "center" }}>
                Mínimo: {a.minimo_constitucional_pct_obrigatorio}% · diferença: {a.superavit_minimo_pct != null ? `${a.superavit_minimo_pct >= 0 ? "+" : ""}${a.superavit_minimo_pct.toFixed(2)} p.p.` : "—"}
              </div>
              <div style={{ marginTop: 14, height: 12, width: "100%", background: "#f0f0f0", borderRadius: 6, overflow: "hidden", position: "relative" }}>
                <div style={{ height: "100%", width: `${Math.min(((pct ?? 0) / 30) * 100, 100)}%`, background: cor, borderRadius: 6 }} />
                <div title="15%" style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: "#111827" }} />
              </div>
              <div style={{ fontSize: 10, color: "#4b5563", marginTop: 4 }}>escala 0–30% · traço = 15%</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
              {[
                { label: "Receita de impostos e transferências constitucionais (base do mínimo)", value: BRL(a.receita_impostos_transferencias), cor: "#1565c0" },
                { label: "Mínimo obrigatório (15% da base)", value: BRL(a.minimo_constitucional_valor_obrigatorio), cor: "#b45309" },
                { label: "Aplicado em ASPS com recursos próprios", value: BRL(a.despesa_asps_recursos_proprios), cor: cor },
                { label: "Despesa total com saúde", value: BRL(a.despesa_total_saude), cor: "#1565c0" },
                { label: "Despesa com saúde por habitante", value: BRL(a.despesa_saude_por_habitante), cor: "#1565c0" },
                { label: "Transferências SUS recebidas", value: BRL(a.transferencias_sus), cor: "#6a1b9a" },
                { label: "Despesa com pessoal na saúde", value: BRL(a.despesa_pessoal_saude), cor: "#374151" },
                { label: "Receita total do município", value: BRL(a.receita_total), cor: "#374151" },
              ].map(k => (
                <div key={k.label} style={{ background: "#fff", borderRadius: 8, padding: "12px 14px", border: `1px solid ${k.cor}25` }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: k.cor }}>{k.value}</div>
                  <div style={{ fontSize: 12, color: "#4b5563", marginTop: 2 }}>{k.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e0e0e0", padding: 16, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 10, color: "#1f2937" }}>Indicadores oficiais do SIOPS — {a.ano} ({a.periodo})</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead><tr style={{ background: "#f3f4f6" }}>{["Nº", "Indicador", "Numerador", "Denominador", "Resultado"].map(t => <th key={t} style={{ padding: "7px 10px", textAlign: t === "Indicador" || t === "Nº" ? "left" : "right", color: "#1f2937" }}>{t}</th>)}</tr></thead>
                <tbody>{(a.indicadores ?? []).map((i: any) => (
                  <tr key={i.numero} style={{ borderBottom: "1px solid #eef0f3", background: i.numero === "3.2" ? "#f0fdf4" : undefined }}>
                    <td style={{ padding: "6px 10px", fontWeight: 700 }}>{i.numero}</td>
                    <td style={{ padding: "6px 10px" }}>{i.descricao.replace(":ano", String(a.ano))}</td>
                    <td style={{ padding: "6px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{i.numerador?.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) ?? "—"}</td>
                    <td style={{ padding: "6px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{i.denominador?.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) ?? "—"}</td>
                    <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 700 }}>{String(i.valor ?? "—")}</td>
                  </tr>))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {anos.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e0e0e0", padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 10, color: "#1f2937" }}>Histórico — % da receita própria aplicada em saúde</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: "#f3f4f6" }}>{["Ano", "Período", "% aplicado", "Situação", "Despesa total com saúde", "Transferências SUS"].map(t => <th key={t} style={{ padding: "7px 10px", textAlign: "left", color: "#1f2937" }}>{t}</th>)}</tr></thead>
            <tbody>{[...anos].reverse().map((x: any) => (
              <tr key={x.ano} style={{ borderBottom: "1px solid #eef0f3", cursor: "pointer", background: x.ano === ano ? "#eff6ff" : undefined }} onClick={() => setAno(x.ano)}>
                <td style={{ padding: "6px 10px", fontWeight: 700 }}>{x.ano}</td>
                <td style={{ padding: "6px 10px" }}>{x.periodo ?? "—"}</td>
                <td style={{ padding: "6px 10px", fontWeight: 700, color: corStatus(x.status) }}>{PCT(x.minimo_pct)}</td>
                <td style={{ padding: "6px 10px", color: corStatus(x.status), fontSize: 12 }}>{x.situacao_dado === "oficial_validado" ? rotStatus(x.status) : "sem dado homologado"}</td>
                <td style={{ padding: "6px 10px" }}>{BRL(x.despesa_total_saude)}</td>
                <td style={{ padding: "6px 10px" }}>{BRL(x.transferencias_sus)}</td>
              </tr>))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ fontSize: 11, color: "#4b5563" }}>
        Fonte: {a?.fonte ?? "SIOPS — consulta pública de indicadores homologados"}{a?.verificado_em ? ` · consultado em ${new Date(a.verificado_em).toLocaleString("pt-BR")}` : ""}.
        Execução por bloco e trimestral não são publicadas nesta consulta do SIOPS.
      </div>
    </div>
  );
}
