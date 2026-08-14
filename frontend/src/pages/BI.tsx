// src/pages/BI.tsx — Business Intelligence ERSUS 360
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiBI } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

// ── Gauge Score ──────────────────────────────────────────────────────────────
function GaugeScore({ score }: { score: number }) {
  const cor = score >= 80 ? "#2e7d32" : score >= 60 ? "#f57f17" : score >= 40 ? "#e65100" : "#c62828";
  const label = score >= 80 ? "Excelente" : score >= 60 ? "Em desenvolvimento" : score >= 40 ? "Atenção" : "Crítico";
  return (
    <div style={{ textAlign: "center", padding: 24 }}>
      <div style={{ fontSize: 72, fontWeight: 900, color: cor, lineHeight: 1 }}>{score?.toFixed(1)}</div>
      <div style={{ fontSize: 18, color: cor, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>Score ERSUS 360</div>
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, cor = "#1565c0" }: { label: string; value: string; sub?: string; cor?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: "16px 20px", border: `2px solid ${cor}20` }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: cor }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── Bar Progress ─────────────────────────────────────────────────────────────
function BarProgress({ label, value, meta, max = 100 }: { label: string; value: number; meta?: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const cor = value >= (meta ?? 60) ? "#2e7d32" : value >= (meta ?? 60) * 0.9 ? "#f57f17" : "#c62828";
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
        <span style={{ color: "#333" }}>{label}</span>
        <span style={{ fontWeight: 700, color: cor }}>{value?.toFixed(1)}%</span>
      </div>
      <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: cor, borderRadius: 4, transition: "width .5s" }} />
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function BI() {
  const [aba, setAba] = useState<"executivo" | "aps" | "financeiro" | "epidemiologico">("executivo");

  const { data: scoreData } = useQuery({ queryKey: ["bi-score"], queryFn: apiBI.score });
  const { data: exec } = useQuery({ queryKey: ["bi-executivo"], queryFn: apiBI.painelExecutivo });
  const { data: aps } = useQuery({ queryKey: ["bi-aps"], queryFn: apiBI.painelAPS });
  const { data: fin } = useQuery({ queryKey: ["bi-fin"], queryFn: apiBI.painelFinanceiro });
  const { data: epi } = useQuery({ queryKey: ["bi-epi"], queryFn: apiBI.painelEpidemiologico });

  const abas = [
    { key: "executivo" as const, label: "Executivo" },
    { key: "aps" as const, label: "Atenção Primária" },
    { key: "financeiro" as const, label: "Financeiro" },
    { key: "epidemiologico" as const, label: "Epidemiológico" },
  ];

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1565c0" }}>Business Intelligence</h2>
        <p style={{ margin: "4px 0 0", color: "#666", fontSize: 13 }}>Análise consolidada de todos os módulos — Apuí/AM</p>
      </div>

      {/* Score + dimensões */}
      {!scoreData
        ? <NaoDisponivelBanner titulo="Score ERSUS 360 indisponivel" nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />
        : (
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, marginBottom: 20 }}>
            <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <GaugeScore score={scoreData.score_total} />
            </div>
            <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 14, color: "#333" }}>Composição do Score por Dimensão</div>
              {scoreData.dimensoes && Object.entries(scoreData.dimensoes as Record<string, { peso: number; score: number; contribuicao: number }>).map(([key, d]) => (
                <BarProgress
                  key={key}
                  label={`${key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())} (peso ${d.peso}%)`}
                  value={d.score}
                  meta={60}
                />
              ))}
            </div>
          </div>
        )
      }

      {/* Abas */}
      <div style={{ display: "flex", gap: 2, marginBottom: 16, borderBottom: "2px solid #e4e7ec" }}>
        {abas.map(a => (
          <button key={a.key} onClick={() => setAba(a.key)}
            style={{ padding: "8px 18px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: aba === a.key ? "#1565c0" : "transparent",
              color: aba === a.key ? "#fff" : "#555",
              borderRadius: "6px 6px 0 0",
            }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Painel Executivo */}
      {aba === "executivo" && !exec && <NaoDisponivelBanner titulo="Painel executivo indisponivel" nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />}
      {aba === "executivo" && exec && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
            <KPI label="Cobertura ESF" value={`${exec.cobertura_esf_pct}%`} cor="#1565c0" />
            <KPI label="Novo Financiamento APS (média)" value={`${exec.previne_media_pct}%`} cor="#2e7d32" />
            <KPI label="Famílias Cadastradas" value={exec.familias_cadastradas?.toLocaleString()} cor="#6a1b9a" />
            <KPI label="Alertas Críticos" value={exec.alertas_criticos} cor="#c62828" />
          </div>
          <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: "#333" }}>Indicadores Novo Financiamento APS</div>
            {exec.previne_indicadores?.map((ind: { indicador: string; resultado: number; meta: number; status: string }) => (
              <div key={ind.indicador} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0, background: ind.status === "verde" ? "#2e7d32" : ind.status === "amarelo" ? "#f57f17" : "#c62828" }} />
                <div style={{ flex: 1, fontSize: 13 }}>{ind.indicador}</div>
                <div style={{ width: 120 }}>
                  <div style={{ height: 6, background: "#f0f0f0", borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${Math.min((ind.resultado / 100) * 100, 100)}%`, background: ind.status === "verde" ? "#2e7d32" : "#f57f17", borderRadius: 3 }} />
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, minWidth: 48, textAlign: "right" }}>{ind.resultado?.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Painel APS */}
      {aba === "aps" && !aps && <NaoDisponivelBanner titulo="Painel APS indisponivel" nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />}
      {aba === "aps" && aps && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: "#333" }}>Produção por Equipe (mês)</div>
            {aps.equipes?.map((e: { nome: string; consultas_mes: number; meta_mes: number; pct: number }) => (
              <div key={e.nome} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                  <span>{e.nome}</span>
                  <span style={{ fontWeight: 700 }}>{e.consultas_mes}/{e.meta_mes}</span>
                </div>
                <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4 }}>
                  <div style={{ height: "100%", width: `${e.pct}%`, background: e.pct >= 90 ? "#2e7d32" : e.pct >= 75 ? "#f57f17" : "#c62828", borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: "#333" }}>ACS — Visitas Domiciliares</div>
            {aps.acs_visitas?.map((a: { nome: string; microarea: string; realizadas: number; meta: number; pct: number }) => (
              <div key={a.nome} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                  <span>{a.nome} (MA {a.microarea})</span>
                  <span style={{ fontWeight: 700 }}>{a.realizadas}/{a.meta}</span>
                </div>
                <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4 }}>
                  <div style={{ height: "100%", width: `${a.pct}%`, background: a.pct >= 90 ? "#2e7d32" : "#f57f17", borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Painel Financeiro */}
      {aba === "financeiro" && !fin && <NaoDisponivelBanner titulo="Painel financeiro indisponivel" nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />}
      {aba === "financeiro" && fin && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            <KPI label="Mínimo Constitucional" value={`${fin.minimo_constitucional_pct}%`} sub="Meta: 15%" cor="#2e7d32" />
            <KPI label="Convênios Vigentes" value={fin.convenios_vigentes} cor="#1565c0" />
            <KPI label="Vencendo em 30 dias" value={fin.convenios_vencendo_30d} cor="#c62828" />
          </div>
          <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: "#333" }}>Execução por Bloco FNS</div>
            {fin.blocos?.map((b: { nome: string; empenhado: number; liquidado: number; pct: number }) => (
              <div key={b.nome} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                  <span>{b.nome}</span>
                  <span>R$ {b.liquidado?.toLocaleString("pt-BR")} / {b.empenhado?.toLocaleString("pt-BR")} <strong>({b.pct?.toFixed(1)}%)</strong></span>
                </div>
                <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4 }}>
                  <div style={{ height: "100%", width: `${b.pct}%`, background: b.pct >= 80 ? "#2e7d32" : b.pct >= 60 ? "#f57f17" : "#c62828", borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Painel Epidemiológico */}
      {aba === "epidemiologico" && !epi && <NaoDisponivelBanner titulo="Painel epidemiologico indisponivel" nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />}
      {aba === "epidemiologico" && epi && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: "#333" }}>Coberturas Vacinais</div>
            {epi.coberturas_vacinais?.map((v: { vacina: string; cobertura: number; meta: number; status: string }) => (
              <BarProgress key={v.vacina} label={v.vacina} value={v.cobertura} meta={v.meta} />
            ))}
          </div>
          <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: "#333" }}>Indicadores Epidemiológicos</div>
            <div style={{ display: "grid", gap: 12 }}>
              <KPI label="IPA Malária" value={`${epi.malaria_ipa}`} sub="Meta: < 10 casos/1000 hab" cor={epi.malaria_ipa < 10 ? "#2e7d32" : "#c62828"} />
              <KPI label="Dengue (mês)" value={epi.dengue_casos_mes} sub="Casos notificados" cor="#1565c0" />
              <KPI label="Mort. Infantil" value={`${epi.mortalidade_infantil}/1000 NV`} sub="Meta: < 10" cor={epi.mortalidade_infantil < 10 ? "#2e7d32" : "#f57f17"} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
