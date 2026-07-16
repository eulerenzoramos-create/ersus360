// src/pages/MapaDesempenho.tsx — Mapa de Desempenho em Saúde ERSUS 360
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiBI } from "../lib/api";

// ── Municípios simulados para ranking regional AM ─────────────────────────────
const MUNICIPIOS_AM = [
  { nome: "Apuí",        ibge: "1300144", score: 72.4, pop: 25043,  esf: 3,  cobertura: 89.2, cor: "#1565c0" },
  { nome: "Humaitá",     ibge: "1301704", score: 68.1, pop: 45000,  esf: 6,  cobertura: 78.4, cor: "#2e7d32" },
  { nome: "Novo Aripuanã",ibge:"1303304", score: 61.3, pop: 21000,  esf: 3,  cobertura: 71.2, cor: "#f57f17" },
  { nome: "Manicoré",    ibge: "1302702", score: 58.9, pop: 55000,  esf: 7,  cobertura: 65.8, cor: "#e65100" },
  { nome: "Borba",       ibge: "1300805", score: 55.2, pop: 37000,  esf: 5,  cobertura: 62.1, cor: "#c62828" },
  { nome: "Tapauá",      ibge: "1304104", score: 49.8, pop: 19000,  esf: 2,  cobertura: 58.3, cor: "#c62828" },
  { nome: "Canutama",    ibge: "1300904", score: 47.1, pop: 16000,  esf: 2,  cobertura: 54.7, cor: "#c62828" },
];

const COR_SCORE = (s: number) =>
  s >= 80 ? "#1b5e20" : s >= 65 ? "#2e7d32" : s >= 50 ? "#f57f17" : s >= 40 ? "#e65100" : "#c62828";

const LABEL_SCORE = (s: number) =>
  s >= 80 ? "Excelente" : s >= 65 ? "Bom" : s >= 50 ? "Regular" : s >= 40 ? "Atenção" : "Crítico";

// ── Indicadores dimensionais Apuí ─────────────────────────────────────────────
const DIMENSOES = [
  { label: "APS / Novo Financiamento APS",      score: 78.2, peso: 35, cor: "#1565c0",  icone: "🏥" },
  { label: "Financeiro / FNS",          score: 81.4, peso: 25, cor: "#2e7d32",  icone: "💰" },
  { label: "Epidemiologia / Vigilância",score: 64.7, peso: 20, cor: "#f57f17",  icone: "🦟" },
  { label: "Gestão / RH / Obras",       score: 70.1, peso: 10, cor: "#6a1b9a",  icone: "⚙️" },
  { label: "Infraestrutura / Patrimônio",score: 62.3, peso: 10, cor: "#00838f", icone: "🏗️" },
];

function ScoreBar({ label, score, peso, cor, icone }: typeof DIMENSOES[0]) {
  const w = Math.min(score, 100);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>
          {icone} {label}
          <span style={{ marginLeft: 8, fontSize: 11, color: "#888", fontWeight: 400 }}>peso {peso}%</span>
        </span>
        <span style={{ fontSize: 15, fontWeight: 800, color: cor }}>{score.toFixed(1)}</span>
      </div>
      <div style={{ height: 12, background: "#f0f0f0", borderRadius: 6, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${w}%`, background: cor,
          borderRadius: 6, transition: "width .8s ease",
        }} />
      </div>
    </div>
  );
}

function RankCard({ mun, pos }: { mun: typeof MUNICIPIOS_AM[0]; pos: number }) {
  const isApui = mun.ibge === "1300144";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
      background: isApui ? "#e3f2fd" : "#fff",
      borderRadius: 8,
      border: `1px solid ${isApui ? "#1565c0" : "#e0e0e0"}`,
      marginBottom: 8,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: pos <= 3 ? ["#ffd700", "#c0c0c0", "#cd7f32"][pos - 1] : "#f5f5f5",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: 15, color: pos <= 3 ? "#333" : "#9e9e9e",
        flexShrink: 0,
      }}>
        {pos}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: isApui ? 700 : 600, fontSize: 14, color: "#333" }}>
          {mun.nome} {isApui && <span style={{ fontSize: 11, color: "#1565c0" }}>◀ você</span>}
        </div>
        <div style={{ fontSize: 12, color: "#888", marginTop: 1 }}>
          Pop. {mun.pop.toLocaleString("pt-BR")} · {mun.esf} ESF · Cobertura {mun.cobertura}%
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: COR_SCORE(mun.score) }}>{mun.score.toFixed(0)}</div>
        <div style={{
          fontSize: 10, fontWeight: 700,
          background: COR_SCORE(mun.score) + "18",
          color: COR_SCORE(mun.score),
          padding: "1px 7px", borderRadius: 3,
        }}>{LABEL_SCORE(mun.score)}</div>
      </div>
    </div>
  );
}

export default function MapaDesempenho() {
  const [tab, setTab] = useState<"dimensoes" | "ranking" | "evolucao">("dimensoes");
  const { data: scoreData } = useQuery({ queryKey: ["bi-score-mapa"], queryFn: apiBI.score });

  const scoreAtual = scoreData?.score_total ?? 72.4;
  const cor = COR_SCORE(scoreAtual);

  const rankOrdenado = [...MUNICIPIOS_AM].sort((a, b) => b.score - a.score);
  const posApui = rankOrdenado.findIndex(m => m.ibge === "1300144") + 1;

  const evolucao = [
    { mes: "Jan", score: 61.2 }, { mes: "Fev", score: 63.8 },
    { mes: "Mar", score: 65.1 }, { mes: "Abr", score: 67.4 },
    { mes: "Mai", score: 69.3 }, { mes: "Jun", score: 70.8 },
    { mes: "Jul", score: scoreAtual },
  ];
  const maxEv = Math.max(...evolucao.map(e => e.score));

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>

      {/* Cabeçalho */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1565c0" }}>
          Mapa de Desempenho em Saúde
        </h2>
        <p style={{ margin: "4px 0 0", color: "#666", fontSize: 13 }}>
          Apuí/AM (IBGE 1300144) · Score ERSUS 360 · Comparativo regional
        </p>
      </div>

      {/* KPIs topo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "#fff", borderRadius: 10, padding: "18px 20px", border: `2px solid ${cor}30`, textAlign: "center" }}>
          <div style={{ fontSize: 42, fontWeight: 900, color: cor, lineHeight: 1 }}>{scoreAtual.toFixed(0)}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: cor, marginTop: 4 }}>{LABEL_SCORE(scoreAtual)}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>Score ERSUS 360</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 10, padding: "18px 20px", border: "1px solid #e0e0e0", textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: "#1565c0" }}>#{posApui}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#555", marginTop: 4 }}>Ranking AM</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>de {MUNICIPIOS_AM.length} municípios similares</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 10, padding: "18px 20px", border: "1px solid #e0e0e0", textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: "#2e7d32" }}>+11.2</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#555", marginTop: 4 }}>Evolução 2026</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>pontos vs Jan/2026</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 10, padding: "18px 20px", border: "1px solid #e0e0e0", textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: "#6a1b9a" }}>3</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#555", marginTop: 4 }}>Dimensões OK</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>APS · Financeiro · Gestão</div>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", gap: 2, marginBottom: 16, borderBottom: "2px solid #e0e0e0" }}>
        {[
          { key: "dimensoes" as const, label: "Dimensões do Score" },
          { key: "ranking"   as const, label: "Ranking Regional" },
          { key: "evolucao"  as const, label: "Evolução Histórica" },
        ].map(a => (
          <button key={a.key} onClick={() => setTab(a.key)}
            style={{
              padding: "8px 18px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: tab === a.key ? "#1565c0" : "transparent",
              color: tab === a.key ? "#fff" : "#555",
              borderRadius: "6px 6px 0 0",
            }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Dimensões */}
      {tab === "dimensoes" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 20, border: "1px solid #e0e0e0" }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: "#333" }}>Composição por Dimensão</div>
            {DIMENSOES.map(d => <ScoreBar key={d.label} {...d} />)}
          </div>
          <div style={{ background: "#fff", borderRadius: 10, padding: 20, border: "1px solid #e0e0e0" }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: "#333" }}>Interpretação do Score</div>
            {[
              { faixa: "80 – 100", label: "Excelente", cor: "#1b5e20", desc: "Todas as metas atingidas, sistema de saúde modelo." },
              { faixa: "65 – 79", label: "Bom", cor: "#2e7d32", desc: "Maioria das metas atingidas, pequenos ajustes necessários." },
              { faixa: "50 – 64", label: "Regular", cor: "#f57f17", desc: "Em desenvolvimento, atenção a indicadores abaixo da meta." },
              { faixa: "40 – 49", label: "Atenção", cor: "#e65100", desc: "Múltiplas dimensões em risco, plano de ação necessário." },
              { faixa: "< 40",    label: "Crítico",   cor: "#c62828", desc: "Gestão em crise, intervenção urgente recomendada." },
            ].map(f => (
              <div key={f.faixa} style={{
                display: "flex", alignItems: "center", gap: 12, marginBottom: 10, padding: "10px 12px",
                borderRadius: 6,
                background: scoreAtual >= parseInt(f.faixa) || f.faixa === "< 40" ? "#fafafa" : "#fafafa",
                border: `1px solid ${f.cor}20`,
                borderLeft: `4px solid ${f.cor}`,
              }}>
                <div style={{ minWidth: 60, fontWeight: 700, color: f.cor, fontSize: 13 }}>{f.faixa}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#333" }}>{f.label}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>{f.desc}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 16, padding: 12, background: `${cor}10`, borderRadius: 8, border: `1px solid ${cor}30` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: cor }}>
                Apuí/AM está na faixa: {LABEL_SCORE(scoreAtual)} ({scoreAtual.toFixed(1)} pontos)
              </div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                Meta para 2026: atingir 80 pontos (Excelente) · Faltam {Math.max(0, 80 - scoreAtual).toFixed(1)} pontos
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ranking */}
      {tab === "ranking" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 12, color: "#333", fontSize: 14 }}>
              Ranking — Municípios do Sul do AM
            </div>
            {rankOrdenado.map((m, i) => (
              <RankCard key={m.ibge} mun={m} pos={i + 1} />
            ))}
          </div>
          <div style={{ background: "#fff", borderRadius: 10, padding: 20, border: "1px solid #e0e0e0" }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: "#333" }}>Médias Regionais vs Apuí</div>
            {[
              { label: "Score ERSUS", apui: scoreAtual, media: 59.0, unidade: "pts" },
              { label: "Cobertura ESF", apui: 89.2, media: 70.1, unidade: "%" },
              { label: "Novo Financiamento APS", apui: 68.4, media: 52.3, unidade: "%" },
              { label: "Equipes ESF/10k hab", apui: 1.20, media: 0.92, unidade: "" },
            ].map(c => (
              <div key={c.label} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, fontWeight: 600 }}>
                  <span>{c.label}</span>
                  <span>
                    <span style={{ color: "#1565c0", fontWeight: 800 }}>Apuí: {c.apui.toFixed(1)}{c.unidade}</span>
                    <span style={{ color: "#9e9e9e", fontWeight: 400, marginLeft: 8 }}>Média: {c.media.toFixed(1)}{c.unidade}</span>
                  </span>
                </div>
                <div style={{ position: "relative", height: 20 }}>
                  <div style={{ position: "absolute", inset: 0, background: "#f0f0f0", borderRadius: 4 }} />
                  <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0,
                    width: `${(c.media / (c.apui > c.media ? c.apui : c.media)) * 100}%`,
                    background: "#e0e0e0", borderRadius: 4,
                  }} />
                  <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0,
                    width: `${(c.apui / (c.apui > c.media ? c.apui : c.media)) * 100}%`,
                    background: "#1565c0", borderRadius: 4, opacity: .8,
                  }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 12, fontSize: 12, color: "#888", fontStyle: "italic" }}>
              Fonte: dados de referência IBGE/MS · Competência Jul/2026
            </div>
          </div>
        </div>
      )}

      {/* Evolução */}
      {tab === "evolucao" && (
        <div style={{ background: "#fff", borderRadius: 10, padding: 20, border: "1px solid #e0e0e0" }}>
          <div style={{ fontWeight: 700, marginBottom: 20, color: "#333" }}>Evolução do Score ERSUS 360 — 2026</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 200, padding: "0 10px" }}>
            {evolucao.map((e, i) => {
              const h = (e.score / maxEv) * 180;
              const isLast = i === evolucao.length - 1;
              return (
                <div key={e.mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: isLast ? 800 : 600, color: COR_SCORE(e.score) }}>
                    {e.score.toFixed(1)}
                  </div>
                  <div style={{
                    width: "100%", height: h,
                    background: isLast ? COR_SCORE(e.score) : COR_SCORE(e.score) + "80",
                    borderRadius: "4px 4px 0 0",
                    transition: "height .5s",
                    border: isLast ? `2px solid ${COR_SCORE(e.score)}` : "none",
                  }} />
                  <div style={{ fontSize: 12, color: "#888" }}>{e.mes}</div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <div style={{ padding: "12px 16px", background: "#e8f5e9", borderRadius: 8, border: "1px solid #c8e6c9" }}>
              <div style={{ fontSize: 11, color: "#666", fontWeight: 600 }}>CRESCIMENTO 2026</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#2e7d32", marginTop: 4 }}>+11.2 pts</div>
              <div style={{ fontSize: 12, color: "#555" }}>Jan 61.2 → Jul {scoreAtual.toFixed(1)}</div>
            </div>
            <div style={{ padding: "12px 16px", background: "#e3f2fd", borderRadius: 8, border: "1px solid #bbdefb" }}>
              <div style={{ fontSize: 11, color: "#666", fontWeight: 600 }}>META 2026</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#1565c0", marginTop: 4 }}>80.0 pts</div>
              <div style={{ fontSize: 12, color: "#555" }}>Excelente · Faltam {(80 - scoreAtual).toFixed(1)} pts</div>
            </div>
            <div style={{ padding: "12px 16px", background: "#f3e5f5", borderRadius: 8, border: "1px solid #e1bee7" }}>
              <div style={{ fontSize: 11, color: "#666", fontWeight: 600 }}>PROJEÇÃO DEZ/2026</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#6a1b9a", marginTop: 4 }}>~78.5 pts</div>
              <div style={{ fontSize: 12, color: "#555" }}>Tendência linear atual</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
