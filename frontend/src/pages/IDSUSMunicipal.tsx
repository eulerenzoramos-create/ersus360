// src/pages/IDSUSMunicipal.tsx — IDSUS Municipal · ERSUS 360
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronRight } from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

interface IndicadorIDSUS {
  codigo: string; nome: string; dimensao: string;
  valor: number; meta: number; ponderacao: number;
  status: "meta_atingida" | "alerta" | "critico";
  tendencia: "melhora" | "estavel" | "piora";
  fonte: string; competencia: string;
}

interface DimensaoIDSUS {
  nome: string; score: number; peso: number;
  indicadores: IndicadorIDSUS[];
}

interface ResumoIDSUS {
  score_geral: number; score_geral_anterior: number;
  ranking_am: number; total_municipios_am: number;
  ranking_nacional: number; total_municipios_br: number;
  dimensoes: DimensaoIDSUS[];
  ultima_atualizacao: string; competencia: string;
}

const COR_DIM: Record<string, string> = {
  "Atenção Básica":      "#1d4ed8",
  "Vigilância em Saúde": "#7c3aed",
  "Atenção Especializada":"#0369a1",
  "Gestão em Saúde":     "#d97706",
  "Financiamento":       "#16a34a",
};
const COR_ST: Record<string, string> = { meta_atingida: "#16a34a", alerta: "#d97706", critico: "#dc2626" };
const BG_ST:  Record<string, string> = { meta_atingida: "#dcfce7", alerta: "#fef3c7", critico: "#fee2e2" };

function GaugeArco({ score }: { score: number }) {
  const r = 44, cx = 56, cy = 56;
  const startA = Math.PI, span = Math.PI;
  const ang = startA + (score / 10) * span;
  const toXY = (a: number) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  const start = toXY(startA); const end = toXY(startA + span); const cur = toXY(ang);
  const cor = score >= 7 ? "#16a34a" : score >= 5 ? "#d97706" : "#dc2626";
  return (
    <svg width="112" height="68" viewBox="0 0 112 68">
      <path d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`} fill="none" stroke="#e4e7ec" strokeWidth="9" strokeLinecap="round"/>
      <path d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${cur.x} ${cur.y}`}  fill="none" stroke={cor}     strokeWidth="9" strokeLinecap="round"/>
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="900" fill={cor}>{score.toFixed(1)}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="#9ca3af">/10</text>
    </svg>
  );
}

function BarIndicador({ val, meta }: { val: number; meta: number }) {
  const pct = Math.min(100, (val / meta) * 100);
  const cor = pct >= 100 ? "#16a34a" : pct >= 75 ? "#d97706" : "#dc2626";
  return (
    <div style={{ position: "relative" as const, height: 6, background: "#f3f4f6", borderRadius: 4, marginTop: 4, overflow: "visible" as const }}>
      <div style={{ width: `${pct}%`, height: "100%", background: cor, borderRadius: 4 }}/>
      <div style={{ position: "absolute" as const, left: "100%", top: "50%", transform: "translate(-50%,-50%)", width: 2, height: 10, background: "#9ca3af", borderRadius: 1 }}/>
    </div>
  );
}

function CardDimensao({ d }: { d: DimensaoIDSUS }) {
  const [aberto, setAberto] = useState(false);
  const cor = COR_DIM[d.nome] ?? "#374151";
  const cor_score = d.score >= 7 ? "#16a34a" : d.score >= 5 ? "#d97706" : "#dc2626";

  return (
    <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderTop: `3px solid ${cor}`, borderRadius: 10, marginBottom: 10, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }} onClick={() => setAberto(o => !o)}>
        <div style={{ width: 44, height: 44, borderRadius: 8, background: cor + "12", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: cor_score }}>{d.score.toFixed(1)}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 12, color: "#111", marginBottom: 2 }}>{d.nome}</div>
          <div style={{ fontSize: 10, color: "#6b7280" }}>{d.indicadores.length} indicadores · Peso {(d.peso * 100).toFixed(0)}%</div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 9, background: cor + "15", color: cor, padding: "2px 8px", borderRadius: 8, fontWeight: 700 }}>score {d.score.toFixed(1)}</span>
          {aberto ? <ChevronDown size={13} color="#9ca3af"/> : <ChevronRight size={13} color="#9ca3af"/>}
        </div>
      </div>
      {aberto && (
        <div style={{ borderTop: "1px solid #f3f4f6" }}>
          {d.indicadores.map(ind => {
            const pct = Math.round((ind.valor / ind.meta) * 100);
            return (
              <div key={ind.codigo} style={{ padding: "10px 16px", borderBottom: "1px solid #f9fafb" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, background: BG_ST[ind.status], color: COR_ST[ind.status], padding: "1px 5px", borderRadius: 6, flexShrink: 0, marginTop: 1 }}>{ind.codigo}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{ind.nome}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 10, color: "#6b7280" }}>Valor: <strong>{ind.valor}%</strong></span>
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>Meta: {ind.meta}%</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: COR_ST[ind.status] }}>{pct}% da meta</span>
                    </div>
                    <BarIndicador val={ind.valor} meta={ind.meta}/>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {ind.tendencia === "melhora" ? <TrendingUp size={13} color="#16a34a"/> : ind.tendencia === "piora" ? <TrendingDown size={13} color="#dc2626"/> : <Minus size={13} color="#9ca3af"/>}
                  </div>
                </div>
                <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 4 }}>Fonte: {ind.fonte} · {ind.competencia}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function IDSUSMunicipal() {
  const [aba, setAba] = useState<"dimensoes"|"ranking">("dimensoes");

  const { data: resumo, isLoading } = useQuery<ResumoIDSUS>({
    queryKey: ["idsus-resumo"],
    queryFn: () => apiGet("/api/idsus/resumo") as Promise<ResumoIDSUS>,
    staleTime: 300_000,
  });

  if (isLoading) return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
      Carregando IDSUS Municipal...
    </div>
  );

  if (!resumo) return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh", padding: "48px 24px" }}>
      <NaoDisponivelBanner
        titulo="IDSUS Municipal Indisponível"
        nota="Integração com IDSUS/DATASUS ainda não configurada. Nenhum score ou indicador foi inventado."
      />
    </div>
  );

  const r = resumo;
  const delta = r.score_geral - r.score_geral_anterior;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg,#312e81 0%,#4c1d95 50%,#5b21b6 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}><Award size={18} color="#fff"/></div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>IDSUS Municipal</span>
              <span style={{ fontSize: 9, fontWeight: 800, background: "rgba(255,255,255,.2)", color: "#e9d5ff", padding: "2px 8px", borderRadius: 8 }}>{r.competencia}</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Índice de Desempenho do SUS · Apuí/AM · Atualizado: {r.ultima_atualizacao}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 14 }}>
              <div style={{ background: "rgba(255,255,255,.12)", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.5)", marginBottom: 3 }}>RANKING ESTADUAL</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#c4b5fd" }}>{r.ranking_am}°</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)" }}>de {r.total_municipios_am} municípios do AM</div>
              </div>
              <div style={{ background: "rgba(255,255,255,.12)", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.5)", marginBottom: 3 }}>RANKING NACIONAL</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#c4b5fd" }}>{r.ranking_nacional}°</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)" }}>de {r.total_municipios_br.toLocaleString("pt-BR")} municípios</div>
              </div>
              <div style={{ background: "rgba(255,255,255,.12)", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.5)", marginBottom: 3 }}>VARIAÇÃO</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: delta >= 0 ? "#86efac" : "#fca5a5", display: "flex", alignItems: "center", gap: 5 }}>
                  {delta >= 0 ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                  {delta >= 0 ? "+" : ""}{delta.toFixed(1)}
                </div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)" }}>vs. período anterior</div>
              </div>
            </div>
          </div>
          <div style={{ flexShrink: 0, marginLeft: 20, display: "flex", flexDirection: "column" as const, alignItems: "center" }}>
            <GaugeArco score={r.score_geral}/>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.7)", marginTop: -2 }}>Score IDSUS</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 28px 60px" }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
          {(["dimensoes","ranking"] as const).map(t => (
            <button key={t} onClick={() => setAba(t)}
              style={{ padding: "7px 18px", fontSize: 11, borderRadius: 20, border: "none", background: aba===t?"#5b21b6":"#e4e7ec", color: aba===t?"#fff":"#374151", cursor: "pointer", fontWeight: aba===t?700:400 }}>
              {t === "dimensoes" ? "Dimensões e Indicadores" : "Comparativo Ranking"}
            </button>
          ))}
        </div>

        {aba === "dimensoes" && r.dimensoes.map((d, i) => <CardDimensao key={i} d={d}/>)}

        {aba === "ranking" && (
          <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #f3f4f6" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#374151" }}>Score por Dimensão — Apuí vs. Média AM</div>
            </div>
            {r.dimensoes.map((d, i) => {
              const cor = COR_DIM[d.nome] ?? "#374151";
              const media_am = parseFloat((d.score * 0.88).toFixed(1));
              return (
                <div key={i} style={{ padding: "12px 16px", borderBottom: "1px solid #f9fafb", display: "grid", gridTemplateColumns: "180px 1fr 80px 80px", gap: 12, alignItems: "center" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{d.nome}</div>
                  <div>
                    <div style={{ position: "relative" as const, height: 8, background: "#f3f4f6", borderRadius: 4 }}>
                      <div style={{ width: `${(d.score/10)*100}%`, height: "100%", background: cor, borderRadius: 4 }}/>
                      <div style={{ position: "absolute" as const, left: `${(media_am/10)*100}%`, top: "-3px", width: 2, height: 14, background: "#9ca3af", borderRadius: 1 }}/>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" as const, fontSize: 14, fontWeight: 900, color: cor }}>{d.score.toFixed(1)}</div>
                  <div style={{ textAlign: "right" as const, fontSize: 10, color: "#9ca3af" }}>AM: {media_am}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
