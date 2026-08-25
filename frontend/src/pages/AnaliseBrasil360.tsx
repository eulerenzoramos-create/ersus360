// src/pages/AnaliseBrasil360.tsx — ERSUS360 · Análise Brasil 360 · Comparativo C1–C7
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Activity, Trophy, AlertTriangle, Target, TrendingUp,
  Download, RefreshCw, CheckCircle, XCircle,
} from "lucide-react";
import { apiGet } from "../lib/api";

// ── Constantes ────────────────────────────────────────────────────────────────

const META: Record<string, number> = {
  C1: 75, C2: 75, C3: 70, C4: 50, C5: 50, C6: 60, C7: 40,
};
const DESC: Record<string, string> = {
  C1: "Mais Acesso",         C2: "Desenv. Infantil",   C3: "Gestação/Puerpério",
  C4: "Diabetes",            C5: "Hipertensão",         C6: "Pessoa Idosa",
  C7: "Prev. Câncer Colo",
};
const COR_IND: Record<string, string> = {
  C1: "#1d4ed8", C2: "#7c3aed", C3: "#be185d",
  C4: "#b45309", C5: "#dc2626", C6: "#065f46", C7: "#b45309",
};
const INDS = ["C1","C2","C3","C4","C5","C6","C7"] as const;

const TT = { background: "#1e293b", border: "none", borderRadius: 6, fontSize: 12, color: "#f1f5f9" };

function cor(v: number, meta: number) {
  if (v >= meta) return "#16a34a";
  if (meta - v >= 20) return "#dc2626";
  return "#d97706";
}

function badge(v: number, meta: number) {
  if (v >= meta) return { label: "OK", bg: "#dcfce7", fg: "#16a34a" };
  if (meta - v >= 20) return { label: "CRÍTICO", bg: "#fee2e2", fg: "#dc2626" };
  return { label: "AVISO", bg: "#fef3c7", fg: "#d97706" };
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const cor = score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626";
  const label = score >= 80 ? "Bom" : score >= 60 ? "Regular" : "Crítico";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: cor + "22", color: cor, borderRadius: 99,
      padding: "2px 10px", fontSize: 11, fontWeight: 800,
    }}>
      {label} {score.toFixed(0)}%
    </span>
  );
}

// Radar de uma equipe (% da meta atingida)
function RadarEquipe({ nome, inds, size = 220 }: {
  nome: string;
  inds: Record<string, number>;
  size?: number;
}) {
  const data = INDS.map(ind => ({
    ind,
    desc: DESC[ind],
    pct: Math.min(100, ((inds[ind] ?? 0) / META[ind]) * 100),
    meta: 100,
  }));
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>{nome}</div>
      <RadarChart width={size} height={size} data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="ind" tick={{ fontSize: 10, fill: "#374151" }} />
        <Radar name="Meta" dataKey="meta" stroke="#e5e7eb" fill="#e5e7eb" fillOpacity={0.3} />
        <Radar name={nome} dataKey="pct" stroke="#1d4ed8" fill="#1d4ed8" fillOpacity={0.25} />
      </RadarChart>
    </div>
  );
}

// ── Cálculo de score geral (média ponderada % da meta) ───────────────────────
function calcScore(inds: Record<string, number>): number {
  const vals = INDS.map(ind => Math.min(100, ((inds[ind] ?? 0) / META[ind]) * 100));
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

// ── Plano de ação automático para equipe com pior gap ────────────────────────
const ACAO: Record<string, string> = {
  C1: "Aumentar produção de consultas. Reduzir faltas via confirmação ativa de agendas. Registrar TODAS as consultas no PEC com tipo correto.",
  C2: "Busca ativa de crianças < 5 anos. ACS identificar faltosos. Programar Dia D de puericultura.",
  C3: "Auditar pré-natais: ≥ 6 consultas + exames obrigatórios lançados. Busca ativa de gestantes.",
  C4: "Solicitar HbA1c para todos os diabéticos sem exame nos últimos 12 meses. Mutirão de consultas.",
  C5: "Registrar PA em TODA consulta de hipertenso. Dia D de aferição para faltosos.",
  C6: "Busca ativa de idosos ≥ 60 anos sem consulta no quadrimestre. ACS: visita domiciliar.",
  C7: "Dia D de coleta de citopatológico. Convocar mulheres 25–64 sem exame válido.",
};

// ── Página principal ──────────────────────────────────────────────────────────

export default function AnaliseBrasil360() {
  const [indSel, setIndSel] = useState<string>("C1");
  const [equipeFoco, setEquipeFoco] = useState<string | null>(null);

  const { data: competencias } = useQuery({
    queryKey: ["pec-competencias"],
    queryFn: () => apiGet("/api/pec/competencias") as Promise<{ competencias: string[] }>,
  });
  const ultima = competencias?.competencias?.[0] ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["pec-indicadores", ultima],
    queryFn: () => apiGet(`/api/pec/indicadores/${ultima}`) as Promise<{
      competencia: string;
      equipes: Record<string, Record<string, number>>;
      tipos_equipe?: Record<string, string>;
      ultima_atualizacao?: string;
    }>,
    enabled: !!ultima,
  });

  if (isLoading) return (
    <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>
      <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", display: "block", margin: "0 auto 10px" }} />
      Carregando dados do e-SUS PEC...
    </div>
  );

  if (!data) return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <AlertTriangle size={32} color="#d97706" style={{ marginBottom: 12, display: "block", margin: "0 auto 12px" }} />
      <div style={{ fontWeight: 700, color: "#374151", marginBottom: 6 }}>Nenhuma sincronização PEC encontrada</div>
      <div style={{ fontSize: 13, color: "#9ca3af" }}>
        Execute o agente <code>pec_sync --once</code> para enviar os dados ao ERSUS360.
      </div>
    </div>
  );

  const equipes = Object.entries(data.equipes);
  const tipos = data.tipos_equipe ?? {};

  // Ranking geral (score médio)
  const ranking = equipes
    .map(([nome, inds]) => ({ nome, inds, score: calcScore(inds), tipo: tipos[nome] ?? "" }))
    .sort((a, b) => b.score - a.score);

  // Médias municipais por indicador
  const mediaMun: Record<string, number> = {};
  INDS.forEach(ind => {
    const vals = equipes.map(([, e]) => e[ind]).filter(v => v != null);
    mediaMun[ind] = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
  });

  // Dados do ranking por indicador selecionado
  const dadosInd = equipes
    .map(([nome, inds]) => ({ nome: nome.length > 13 ? nome.slice(0, 13) + "…" : nome, nomeReal: nome, valor: inds[indSel] ?? 0 }))
    .sort((a, b) => b.valor - a.valor);

  // Heatmap: equipe × indicador (% relativo à meta)
  const heatmap = ranking.map(r => ({
    nome: r.nome,
    tipo: r.tipo,
    score: r.score,
    ...Object.fromEntries(INDS.map(ind => [ind, r.inds[ind] ?? 0])),
  }));

  // Pior gap por equipe (para plano de ação)
  function piorGap(inds: Record<string, number>) {
    let worst = { ind: "C1", gap: 0 };
    INDS.forEach(ind => {
      const gap = META[ind] - (inds[ind] ?? 0);
      if (gap > worst.gap) worst = { ind, gap };
    });
    return worst;
  }

  const equipeFocoData = equipeFoco
    ? equipes.find(([n]) => n === equipeFoco)
    : null;

  // CSV export
  function exportCSV() {
    const rows: string[][] = [
      ["Equipe", "Tipo", "Score Geral (%)", ...INDS, ...INDS.map(i => `${i} Meta`), ...INDS.map(i => `${i} Gap`)],
    ];
    ranking.forEach(r => {
      rows.push([
        r.nome, r.tipo, r.score.toFixed(1),
        ...INDS.map(ind => (r.inds[ind] ?? 0).toFixed(1)),
        ...INDS.map(ind => String(META[ind])),
        ...INDS.map(ind => (META[ind] - (r.inds[ind] ?? 0)).toFixed(1)),
      ]);
    });
    rows.push(["MÉDIA MUNICIPAL", "", calcScore(mediaMun).toFixed(1),
      ...INDS.map(ind => mediaMun[ind].toFixed(1)),
      ...INDS.map(ind => String(META[ind])),
      ...INDS.map(ind => (META[ind] - mediaMun[ind]).toFixed(1)),
    ]);
    const csv = rows.map(r => r.map(c => `"${c}"`).join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `analise360_${data.competencia}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#1e3a5f" }}>
            Análise Brasil 360
          </h1>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            Comparativo entre equipes · Indicadores C1–C7 · Portaria GM/MS 3.493/2024
            {data.competencia && <> · Competência <strong>{data.competencia}</strong></>}
          </div>
        </div>
        <button onClick={exportCSV} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
          background: "#16a34a", color: "#fff", border: "none", borderRadius: 6,
          fontSize: 12, fontWeight: 700, cursor: "pointer",
        }}>
          <Download size={13} /> Exportar CSV
        </button>
      </div>

      {/* KPIs municipais */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          {
            label: "Score Municipal",
            val: `${calcScore(mediaMun).toFixed(0)}%`,
            sub: "média das equipes",
            cor: cor(calcScore(mediaMun), 80),
            icon: <Target size={16} />,
          },
          {
            label: "Equipes ≥ meta em C1",
            val: `${equipes.filter(([, e]) => e.C1 >= META.C1).length}/${equipes.length}`,
            sub: "Mais Acesso",
            cor: "#1d4ed8",
            icon: <CheckCircle size={16} />,
          },
          {
            label: "Indicadores OK (mun.)",
            val: `${INDS.filter(ind => mediaMun[ind] >= META[ind]).length}/7`,
            sub: "média municipal ≥ meta",
            cor: "#16a34a",
            icon: <Trophy size={16} />,
          },
          {
            label: "Equipes em estado crítico",
            val: `${ranking.filter(r => r.score < 60).length}`,
            sub: "score geral < 60%",
            cor: "#dc2626",
            icon: <AlertTriangle size={16} />,
          },
        ].map((k, i) => (
          <div key={i} style={{
            background: "#fff", border: `1px solid ${k.cor}22`,
            borderTop: `3px solid ${k.cor}`, borderRadius: 8, padding: "12px 14px",
          }}>
            <div style={{ color: k.cor, marginBottom: 6 }}>{k.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: k.cor }}>{k.val}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginTop: 2 }}>{k.label}</div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Ranking geral + radar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Ranking */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 18px" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: "#1e3a5f" }}>
            <Trophy size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
            Ranking de Equipes — Score Geral
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ranking.map((r, i) => (
              <button
                key={r.nome}
                onClick={() => setEquipeFoco(equipeFoco === r.nome ? null : r.nome)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: equipeFoco === r.nome ? "#eff6ff" : (i % 2 === 0 ? "#f9fafb" : "#fff"),
                  border: `1px solid ${equipeFoco === r.nome ? "#1d4ed8" : "#e5e7eb"}`,
                  borderRadius: 7, padding: "8px 10px", cursor: "pointer", textAlign: "left",
                  transition: "border .1s",
                }}
              >
                <span style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  background: i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : "#e5e7eb",
                  color: i < 3 ? "#fff" : "#6b7280",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 900,
                }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.nome}
                  </div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>{r.tipo}</div>
                </div>
                {/* Barra de score */}
                <div style={{ width: 70, height: 6, background: "#f3f4f6", borderRadius: 3, overflow: "hidden", flexShrink: 0 }}>
                  <div style={{ width: `${r.score}%`, height: "100%", background: cor(r.score, 80), borderRadius: 3, transition: "width .4s" }} />
                </div>
                <ScoreBadge score={r.score} />
              </button>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 8 }}>
            Score = média de (realizado/meta)×100 para C1–C7. Clique para ver radar da equipe.
          </div>
        </div>

        {/* Radar */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 18px" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: "#1e3a5f" }}>
            <Activity size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
            {equipeFoco ? `Radar — ${equipeFoco}` : "Radar — Média Municipal"}
          </h3>
          {equipeFoco && equipeFocoData ? (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <RadarEquipe nome={equipeFoco} inds={equipeFocoData[1]} size={260} />
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <RadarEquipe nome="Média Municipal" inds={mediaMun} size={260} />
            </div>
          )}
          {/* Legenda de indicadores */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 6 }}>
            {INDS.map(ind => (
              <span key={ind} style={{ fontSize: 9, color: "#6b7280" }}>
                <strong style={{ color: "#374151" }}>{ind}</strong> {DESC[ind]}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfico de barras por indicador */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 18px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1e3a5f" }}>
            <TrendingUp size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
            Ranking por Indicador — {indSel}: {DESC[indSel]}
          </h3>
          {/* Seletor de indicador */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {INDS.map(ind => (
              <button key={ind} onClick={() => setIndSel(ind)} style={{
                padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: "pointer",
                background: indSel === ind ? COR_IND[ind] : "#f3f4f6",
                color: indSel === ind ? "#fff" : "#374151",
                border: `1px solid ${indSel === ind ? COR_IND[ind] : "#e5e7eb"}`,
              }}>{ind}</button>
            ))}
          </div>
        </div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosInd} margin={{ left: 0, right: 10 }}>
              <XAxis dataKey="nome" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
              <ReferenceLine y={META[indSel]} stroke="#374151" strokeDasharray="4 3"
                label={{ value: `meta ${META[indSel]}%`, position: "insideTopRight", fontSize: 10, fill: "#374151" }} />
              <Tooltip contentStyle={TT} formatter={(v: number) => [`${v.toFixed(1)}%`, indSel]} />
              <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                {dadosInd.map((d, i) => (
                  <Cell key={i} fill={cor(d.valor, META[indSel])} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Legenda status */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", fontSize: 10, color: "#6b7280", marginTop: 4 }}>
          {[["#16a34a", "≥ meta (OK)"], ["#d97706", "abaixo < 20pp"], ["#dc2626", "crítico ≥ 20pp"]].map(([c, l]) => (
            <span key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, background: c, borderRadius: 2, display: "inline-block" }} />{l}
            </span>
          ))}
        </div>
      </div>

      {/* Heatmap — equipes × indicadores */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 18px", marginBottom: 20, overflowX: "auto" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: "#1e3a5f" }}>
          Heatmap — Equipes × Indicadores C1–C7
        </h3>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12, minWidth: 600 }}>
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th style={{ padding: "7px 12px", textAlign: "left", fontWeight: 700, color: "#374151", minWidth: 140 }}>Equipe</th>
              <th style={{ padding: "7px 8px", textAlign: "center", fontWeight: 700, color: "#374151", minWidth: 64 }}>Score</th>
              {INDS.map(ind => (
                <th key={ind} style={{ padding: "7px 8px", textAlign: "center", fontWeight: 700, color: "#374151", minWidth: 66 }}>
                  {ind}<br/><span style={{ fontSize: 9, fontWeight: 400, color: "#9ca3af" }}>meta {META[ind]}%</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Linha de média municipal */}
            <tr style={{ background: "#eff6ff", borderTop: "2px solid #bfdbfe" }}>
              <td style={{ padding: "7px 12px", fontWeight: 800, color: "#1d4ed8", fontSize: 11 }}>
                ∅ Média Municipal
              </td>
              <td style={{ padding: "7px 8px", textAlign: "center" }}>
                <ScoreBadge score={calcScore(mediaMun)} />
              </td>
              {INDS.map(ind => {
                const v = mediaMun[ind];
                const b = badge(v, META[ind]);
                return (
                  <td key={ind} style={{ padding: "7px 8px", textAlign: "center", background: b.bg }}>
                    <span style={{ color: b.fg, fontWeight: 800 }}>{v.toFixed(1)}%</span>
                  </td>
                );
              })}
            </tr>
            {heatmap.map((r, i) => (
              <tr key={r.nome} style={{
                borderTop: "1px solid #f3f4f6",
                background: equipeFoco === r.nome ? "#eff6ff" : (i % 2 === 0 ? "#fff" : "#f9fafb"),
                cursor: "pointer",
              }}
                onClick={() => setEquipeFoco(equipeFoco === r.nome ? null : r.nome)}>
                <td style={{ padding: "7px 12px" }}>
                  <div style={{ fontWeight: 600, fontSize: 11 }}>{r.nome}</div>
                  {r.tipo && <div style={{ fontSize: 9, color: "#9ca3af" }}>{r.tipo}</div>}
                </td>
                <td style={{ padding: "7px 8px", textAlign: "center" }}>
                  <ScoreBadge score={r.score} />
                </td>
                {INDS.map(ind => {
                  const v = (r as any)[ind] as number;
                  const b = badge(v, META[ind]);
                  return (
                    <td key={ind} style={{ padding: "7px 8px", textAlign: "center", background: b.bg }}>
                      <span style={{ color: b.fg, fontWeight: 700, fontSize: 12 }}>{v.toFixed(1)}%</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 6 }}>
          Clique em uma equipe para ver o radar. Verde = ≥ meta · Amarelo = abaixo &lt; 20pp · Vermelho = crítico ≥ 20pp
        </div>
      </div>

      {/* Plano de ação para equipe selecionada */}
      {equipeFoco && equipeFocoData && (() => {
        const inds = equipeFocoData[1];
        const { ind, gap } = piorGap(inds);
        const itens = INDS.filter(i => inds[i] < META[i]).sort((a, b) => (META[b] - inds[b]) - (META[a] - inds[a]));
        return (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 18px", marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: "#1e3a5f" }}>
              Plano de Ação — {equipeFoco}
            </h3>
            <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 7, padding: "10px 14px", marginBottom: 12, fontSize: 12 }}>
              <strong style={{ color: "#92400e" }}>Pior gap:</strong>{" "}
              <span style={{ color: "#374151" }}>{ind} ({DESC[ind]}) — gap {gap.toFixed(1)}pp abaixo da meta {META[ind]}%</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {itens.map(i => {
                const v = inds[i] ?? 0;
                const g = META[i] - v;
                const b = badge(v, META[i]);
                return (
                  <div key={i} style={{
                    background: b.bg, border: `1px solid ${b.fg}44`,
                    borderRadius: 7, padding: "10px 14px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, color: b.fg, fontSize: 13 }}>{i}</span>
                      <span style={{ fontSize: 11, color: "#374151", fontWeight: 600 }}>{DESC[i]}</span>
                      <span style={{ marginLeft: "auto", fontSize: 11, color: b.fg, fontWeight: 800 }}>
                        {v.toFixed(1)}% / meta {META[i]}% · gap {g.toFixed(1)}pp
                      </span>
                      <span style={{ background: b.fg, color: "#fff", fontSize: 9, fontWeight: 800, padding: "1px 7px", borderRadius: 99 }}>
                        {b.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#374151", lineHeight: 1.5 }}>
                      {ACAO[i]}
                    </div>
                  </div>
                );
              })}
              {itens.length === 0 && (
                <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 7, padding: "12px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle size={16} color="#16a34a" />
                  <span style={{ fontSize: 12, color: "#166534", fontWeight: 700 }}>
                    Equipe atingiu todas as metas C1–C7! Parabéns.
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Comparativo média vs metas */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 18px" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: "#1e3a5f" }}>
          Média Municipal vs Metas — Visão Geral
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
          {INDS.map(ind => {
            const v = mediaMun[ind];
            const meta = META[ind];
            const pct = Math.min(100, (v / meta) * 100);
            const b = badge(v, meta);
            return (
              <div key={ind} style={{
                background: b.bg, border: `1px solid ${b.fg}44`,
                borderRadius: 8, padding: "10px 8px", textAlign: "center",
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: b.fg, marginBottom: 2 }}>{ind}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: b.fg }}>{v.toFixed(1)}%</div>
                <div style={{ fontSize: 9, color: "#9ca3af", marginBottom: 6 }}>meta {meta}%</div>
                {/* Mini barra */}
                <div style={{ height: 4, background: "#e5e7eb", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: b.fg, borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 9, color: b.fg, fontWeight: 700, marginTop: 4 }}>{b.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
