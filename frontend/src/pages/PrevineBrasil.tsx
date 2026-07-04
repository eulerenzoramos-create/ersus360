// src/pages/PrevineBrasil.tsx — Previne Brasil ERSUS 360
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiPrevine } from "../lib/api";
import { TrendingUp, TrendingDown, Minus, Search, Users } from "lucide-react";

type Indicador = {
  numero: number; nome: string; descricao: string; eixo: string;
  numerador: number; denominador: number;
  resultado_pct: number; meta_pct: number;
  pontuacao: number; status: string; tendencia: string;
};

const COR_STATUS: Record<string, string> = { verde: "#2e7d32", amarelo: "#f57f17", vermelho: "#c62828" };
const BG_STATUS:  Record<string, string> = { verde: "#e8f5e9", amarelo: "#fff8e1", vermelho: "#ffebee" };

function TendenciaIcon({ t }: { t: string }) {
  if (t === "subindo")  return <TrendingUp  size={14} color="#2e7d32" />;
  if (t === "descendo") return <TrendingDown size={14} color="#c62828" />;
  return <Minus size={14} color="#9e9e9e" />;
}

function CardIndicador({ ind, onBuscaAtiva }: { ind: Indicador; onBuscaAtiva: () => void }) {
  const cor = COR_STATUS[ind.status] ?? "#9e9e9e";
  const bg  = BG_STATUS[ind.status]  ?? "#f5f5f5";
  const pct = Math.min((ind.resultado_pct / 100) * 100, 100);
  const metaPct = Math.min((ind.meta_pct / 100) * 100, 100);

  return (
    <div style={{
      background: "#fff", borderRadius: 10, border: `1px solid ${cor}30`,
      borderLeft: `4px solid ${cor}`, padding: 16, position: "relative",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: cor, borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {ind.numero}
            </span>
            <span style={{ fontSize: 10, color: "#888", background: "#f5f5f5", padding: "1px 7px", borderRadius: 3 }}>{ind.eixo}</span>
            <TendenciaIcon t={ind.tendencia} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#212121", lineHeight: 1.4 }}>{ind.nome}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: cor, lineHeight: 1 }}>{ind.resultado_pct.toFixed(1)}%</div>
          <div style={{ fontSize: 11, color: "#888" }}>Meta: {ind.meta_pct.toFixed(0)}%</div>
        </div>
      </div>

      {/* Barra com marcador de meta */}
      <div style={{ position: "relative", height: 10, background: "#f0f0f0", borderRadius: 5, marginBottom: 10 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: cor, borderRadius: 5, transition: "width .6s" }} />
        {/* Linha de meta */}
        <div style={{
          position: "absolute", top: -2, bottom: -2, left: `${metaPct}%`,
          width: 2, background: "#333", borderRadius: 1,
        }} />
        <div style={{
          position: "absolute", top: -16, left: `${metaPct}%`,
          transform: "translateX(-50%)", fontSize: 9, color: "#333", fontWeight: 700, whiteSpace: "nowrap",
        }}>meta</div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 12, color: "#666" }}>
          {ind.numerador} de {ind.denominador} pacientes
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{
            fontSize: 11, fontWeight: 700,
            background: bg, color: cor,
            padding: "2px 8px", borderRadius: 3,
          }}>
            {ind.pontuacao.toFixed(0)} pts
          </span>
          {ind.denominador - ind.numerador > 0 && (
            <button
              onClick={onBuscaAtiva}
              style={{
                fontSize: 11, display: "flex", alignItems: "center", gap: 4,
                padding: "3px 10px", borderRadius: 4, border: "1px solid #1565c020",
                background: "#e3f2fd", color: "#1565c0", cursor: "pointer",
              }}
            >
              <Search size={10} /> Busca ativa ({ind.denominador - ind.numerador})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PrevineBrasil() {
  const [tab, setTab] = useState<"indicadores" | "equipes" | "historico" | "busca">("indicadores");
  const [indSelecionado, setIndSelecionado] = useState<number | null>(null);
  const [competencia, setCompetencia] = useState("202507");

  const { data, isLoading } = useQuery({
    queryKey: ["previne-indicadores", competencia],
    queryFn: () => apiPrevine.indicadores(competencia),
  });

  const { data: equipes } = useQuery({
    queryKey: ["previne-equipes", competencia],
    queryFn: () => apiPrevine.equipes(competencia),
    enabled: tab === "equipes",
  });

  const { data: hist } = useQuery({
    queryKey: ["previne-historico"],
    queryFn: () => apiPrevine.historico(6),
    enabled: tab === "historico",
  });

  const { data: busca } = useQuery({
    queryKey: ["previne-busca", indSelecionado],
    queryFn: () => apiPrevine.buscaAtiva(indSelecionado!),
    enabled: tab === "busca" && indSelecionado !== null,
  });

  const indicadores: Indicador[] = data?.indicadores ?? [];
  const verdes   = indicadores.filter(i => i.status === "verde").length;
  const amarelos = indicadores.filter(i => i.status === "amarelo").length;
  const vermelhos = indicadores.filter(i => i.status === "vermelho").length;

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1565c0" }}>Previne Brasil</h2>
          <p style={{ margin: "4px 0 0", color: "#666", fontSize: 13 }}>
            7 indicadores oficiais · Apuí/AM · Competência {competencia.slice(4)}/{competencia.slice(0,4)}
          </p>
        </div>
        <select
          value={competencia}
          onChange={e => setCompetencia(e.target.value)}
          style={{ padding: "7px 12px", borderRadius: 6, border: "1px solid #e0e0e0", fontSize: 13 }}
        >
          {["202503","202504","202505","202506","202507"].map(c => (
            <option key={c} value={c}>{c.slice(4)}/{c.slice(0,4)}</option>
          ))}
        </select>
      </div>

      {/* KPIs */}
      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
          <div style={{ background: "#fff", borderRadius: 8, padding: "14px 18px", border: "2px solid #1565c020", textAlign: "center" }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: "#1565c0" }}>{data.total_pontos.toFixed(0)}</div>
            <div style={{ fontSize: 11, color: "#555", fontWeight: 600 }}>Pontos / 49</div>
            <div style={{ fontSize: 10, color: "#888" }}>{data.percentual_pontos}%</div>
          </div>
          <div style={{ background: "#fff", borderRadius: 8, padding: "14px 18px", border: "2px solid #2e7d3220", textAlign: "center" }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: "#2e7d32" }}>{verdes}</div>
            <div style={{ fontSize: 11, color: "#555", fontWeight: 600 }}>Meta atingida</div>
          </div>
          <div style={{ background: "#fff", borderRadius: 8, padding: "14px 18px", border: "2px solid #f57f1720", textAlign: "center" }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: "#f57f17" }}>{amarelos}</div>
            <div style={{ fontSize: 11, color: "#555", fontWeight: 600 }}>Em atenção</div>
          </div>
          <div style={{ background: "#fff", borderRadius: 8, padding: "14px 18px", border: "2px solid #c6282820", textAlign: "center" }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: "#c62828" }}>{vermelhos}</div>
            <div style={{ fontSize: 11, color: "#555", fontWeight: 600 }}>Abaixo da meta</div>
          </div>
          <div style={{ background: "#fff", borderRadius: 8, padding: "14px 18px", border: "2px solid #6a1b9a20", textAlign: "center" }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: "#6a1b9a" }}>{data.media_geral_pct}%</div>
            <div style={{ fontSize: 11, color: "#555", fontWeight: 600 }}>Média geral</div>
          </div>
        </div>
      )}

      {/* Abas */}
      <div style={{ display: "flex", gap: 2, marginBottom: 16, borderBottom: "2px solid #e0e0e0" }}>
        {[
          { key: "indicadores" as const, label: "Indicadores" },
          { key: "equipes"     as const, label: "Por Equipe" },
          { key: "historico"   as const, label: "Evolução" },
          { key: "busca"       as const, label: "Busca Ativa" },
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

      {/* Indicadores */}
      {tab === "indicadores" && (
        isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#9e9e9e" }}>Carregando...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
            {indicadores.map(ind => (
              <CardIndicador
                key={ind.numero}
                ind={ind}
                onBuscaAtiva={() => { setIndSelecionado(ind.numero); setTab("busca"); }}
              />
            ))}
          </div>
        )
      )}

      {/* Por Equipe */}
      {tab === "equipes" && equipes && (
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e0e0e0", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f0f0", fontWeight: 700, color: "#333" }}>
            Indicadores por Equipe de Saúde — {equipes.total_equipes} equipes
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f5f5f5" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left" }}>Equipe</th>
                  {[1,2,3,4,5,6,7].map(n => <th key={n} style={{ padding: "10px 10px", textAlign: "right" }}>Ind.{n}</th>)}
                  <th style={{ padding: "10px 14px", textAlign: "right" }}>Média</th>
                </tr>
              </thead>
              <tbody>
                {equipes.equipes?.map((eq: Record<string, unknown>, i: number) => (
                  <tr key={i} style={{ borderTop: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>{eq.nome as string}</td>
                    {[1,2,3,4,5,6,7].map(n => {
                      const v = eq[`ind${n}`] as number;
                      return (
                        <td key={n} style={{ padding: "10px 10px", textAlign: "right",
                          color: v >= 60 ? "#2e7d32" : v >= 40 ? "#f57f17" : "#c62828",
                          fontWeight: 700,
                        }}>
                          {v.toFixed(1)}%
                        </td>
                      );
                    })}
                    <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 800, fontSize: 13, color: "#1565c0" }}>
                      {(eq.media as number).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Histórico */}
      {tab === "historico" && hist && (
        <div style={{ background: "#fff", borderRadius: 10, padding: 20, border: "1px solid #e0e0e0" }}>
          <div style={{ fontWeight: 700, marginBottom: 16, color: "#333" }}>
            Evolução Histórica — Média Geral Previne Brasil · Variação: +{hist.variacao_6_meses}%
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 160, marginBottom: 20 }}>
            {hist.historico?.map((h: Record<string, number>, i: number) => {
              const max = Math.max(...(hist.historico as Record<string, number>[]).map((x) => x.media_geral));
              const hh = (h.media_geral / max) * 140;
              const cor = h.media_geral >= 60 ? "#2e7d32" : "#f57f17";
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: cor }}>{h.media_geral.toFixed(1)}%</div>
                  <div style={{ width: "100%", height: hh, background: cor, borderRadius: "4px 4px 0 0", opacity: i === hist.historico.length - 1 ? 1 : 0.6 }} />
                  <div style={{ fontSize: 11, color: "#888" }}>
                    {String(h.competencia).slice(4)}/{String(h.competencia).slice(0,4)}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "#f5f5f5" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>Competência</th>
                  {[1,2,3,4,5,6,7].map(n => <th key={n} style={{ padding: "8px 10px", textAlign: "right" }}>Ind.{n}</th>)}
                  <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700 }}>Média</th>
                </tr>
              </thead>
              <tbody>
                {hist.historico?.map((h: Record<string, number>, i: number) => (
                  <tr key={i} style={{ borderTop: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 600 }}>
                      {String(h.competencia).slice(4)}/{String(h.competencia).slice(0,4)}
                    </td>
                    {[1,2,3,4,5,6,7].map(n => (
                      <td key={n} style={{ padding: "8px 10px", textAlign: "right", color: (h[`ind${n}`] ?? 0) >= 60 ? "#2e7d32" : "#c62828" }}>
                        {(h[`ind${n}`] ?? 0).toFixed(1)}%
                      </td>
                    ))}
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 800, color: "#1565c0" }}>
                      {h.media_geral.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Busca Ativa */}
      {tab === "busca" && (
        <div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {indicadores.map(ind => (
              <button key={ind.numero}
                onClick={() => setIndSelecionado(ind.numero)}
                style={{
                  padding: "6px 14px", borderRadius: 20, border: `1px solid ${COR_STATUS[ind.status] ?? "#e0e0e0"}`,
                  background: indSelecionado === ind.numero ? COR_STATUS[ind.status] : "#fff",
                  color: indSelecionado === ind.numero ? "#fff" : COR_STATUS[ind.status] ?? "#333",
                  cursor: "pointer", fontSize: 12, fontWeight: 600,
                }}
              >
                Ind.{ind.numero} ({ind.denominador - ind.numerador} pendentes)
              </button>
            ))}
          </div>

          {busca ? (
            <div style={{ background: "#fff", borderRadius: 10, padding: 20, border: "1px solid #e0e0e0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#333" }}>{busca.indicador}</div>
                  <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
                    {busca.total_realizado} realizados de {busca.total_elegivel} elegíveis
                    — <strong style={{ color: "#c62828" }}>{busca.pendentes} pendentes</strong>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Users size={16} color="#1565c0" />
                  <span style={{ fontSize: 13, color: "#1565c0", fontWeight: 600 }}>ACS responsáveis: {busca.acs_responsaveis?.join(", ")}</span>
                </div>
              </div>
              <div style={{ background: "#fff8e1", borderRadius: 8, padding: "12px 16px", border: "1px solid #ffe082" }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#e65100" }}>Microáreas críticas:</div>
                <div style={{ marginTop: 4, display: "flex", gap: 8 }}>
                  {busca.microareas_criticas?.map((ma: string) => (
                    <span key={ma} style={{ background: "#e65100", color: "#fff", padding: "2px 10px", borderRadius: 4, fontSize: 12, fontWeight: 700 }}>{ma}</span>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>{busca.observacao}</div>
              </div>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: "#9e9e9e", fontSize: 13 }}>
              Selecione um indicador acima para ver os pacientes pendentes de busca ativa
            </div>
          )}
        </div>
      )}
    </div>
  );
}
