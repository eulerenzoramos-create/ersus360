import { useQuery } from "@tanstack/react-query";
import { RefreshCw, TrendingUp, TrendingDown, Minus, Info, Activity, DollarSign, Heart, Briefcase, Truck } from "lucide-react";
import { apiGet } from "../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface EixoData {
  score: number;
  peso: number;
  subcomponentes: Record<string, number | boolean | string>;
  indicadores?: { nome: string; resultado: number; meta: number; pct_meta: number }[];
}

interface Benchmark { nome: string; score: number }

interface ScoreData {
  score_total: number;
  nivel: string;
  cor: string;
  emoji: string;
  municipio: string;
  uf: string;
  calculado_em: string;
  eixos: {
    aps:           EixoData;
    financeiro:    EixoData;
    epidemiologia: EixoData;
    gestao:        EixoData;
    infraestrutura:EixoData;
  };
  historico: { mes: string; score: number }[];
  benchmarks: { municipio: Benchmark; estado_am: Benchmark; nacional: Benchmark };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const EIXOS_META = [
  { key: "aps",            label: "Atenção Primária",  peso: "35%", Icon: Heart,     descricao: "Previne Brasil, cobertura ESF, SISAB" },
  { key: "financeiro",     label: "Financeiro",         peso: "25%", Icon: DollarSign, descricao: "Execução FNS, SIOPS, recursos próprios" },
  { key: "epidemiologia",  label: "Epidemiologia",      peso: "20%", Icon: Activity,  descricao: "Notificações, vacinação, malária, dengue" },
  { key: "gestao",         label: "Gestão",             peso: "10%", Icon: Briefcase, descricao: "Obrigações legais, RH, documentação" },
  { key: "infraestrutura", label: "Infraestrutura",     peso: "10%", Icon: Truck,     descricao: "Frota, obras, patrimônio" },
] as const;

const corScore = (s: number) =>
  s >= 80 ? "#16a34a" : s >= 65 ? "#2563eb" : s >= 50 ? "#d97706" : "#dc2626";

function GaugeCircle({ score, cor }: { score: number; cor: string }) {
  const r = 72;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <svg width={180} height={180} viewBox="0 0 180 180" style={{ display: "block" }}>
      {/* Trilha */}
      <circle cx={90} cy={90} r={r} fill="none" stroke="#e5e7eb" strokeWidth={12} />
      {/* Arco */}
      <circle
        cx={90} cy={90} r={r}
        fill="none"
        stroke={cor}
        strokeWidth={12}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 90 90)"
        style={{ transition: "stroke-dasharray .8s ease" }}
      />
      {/* Texto */}
      <text x={90} y={86} textAnchor="middle" fontSize={32} fontWeight={700} fill={cor}>{score}</text>
      <text x={90} y={108} textAnchor="middle" fontSize={13} fill="#6b7280">/100</text>
    </svg>
  );
}

function MiniBar({ score, label, cor, max = 100 }: { score: number; label: string; cor: string; max?: number }) {
  const w = Math.min((score / max) * 100, 100);
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
        <span style={{ color: "#6b7280" }}>{label}</span>
        <span style={{ fontWeight: 600, color: cor }}>{typeof score === "boolean" ? (score ? "Sim" : "Não") : `${score}`}</span>
      </div>
      <div style={{ height: 6, background: "#e5e7eb", borderRadius: 3 }}>
        <div style={{ width: `${w}%`, height: "100%", background: cor, borderRadius: 3, transition: "width .5s" }} />
      </div>
    </div>
  );
}

function SparkLine({ historico }: { historico: { mes: string; score: number }[] }) {
  const w = 340, h = 70, pad = 10;
  const scores = historico.map(h => h.score);
  const min = Math.min(...scores) - 5;
  const max = Math.max(...scores) + 5;
  const xStep = (w - pad * 2) / (scores.length - 1);
  const yScale = (s: number) => h - pad - ((s - min) / (max - min)) * (h - pad * 2);

  const pts = scores.map((s, i) => `${pad + i * xStep},${yScale(s)}`).join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke="#2563eb" strokeWidth={2} />
      {scores.map((s, i) => (
        <g key={i}>
          <circle cx={pad + i * xStep} cy={yScale(s)} r={3} fill={corScore(s)} />
          <text x={pad + i * xStep} y={h - 1} textAnchor="middle" fontSize={9} fill="#9ca3af">
            {historico[i].mes.slice(0, 3)}
          </text>
        </g>
      ))}
    </svg>
  );
}

function EixoCard({ eixoKey, meta, data }: {
  eixoKey: string;
  meta: typeof EIXOS_META[number];
  data: EixoData;
}) {
  const cor = corScore(data.score);
  const Icon = meta.Icon;
  const subLabels: Record<string, string> = {
    previne_brasil:           "Previne Brasil",
    cobertura_esf:            "Cobertura ESF (%)",
    sisab_regularidade:       "Regularidade SISAB (%)",
    execucao_fns_pct:         "Execução FNS (%)",
    proprio_saude_pct:        "Recursos próprios (%)",
    siops_conformidade:       "Conformidade SIOPS (%)",
    pendencias_fns:           "Pendências FNS",
    notificacao_oportuna_pct: "Notificação oportuna (%)",
    cobertura_vacinal_pct:    "Cobertura vacinal (%)",
    ipa_malaria_controle:     "Controle IPA malária (%)",
    dengue_confirmados:       "Casos dengue confirmados",
    obrigacoes_cumpridas_pct: "Obrigações cumpridas (%)",
    servidores_regulares_pct: "Servidores sem pendências (%)",
    documentos_assinados_pct: "Documentos assinados (%)",
    rdqa_em_dia:              "RDQA apresentado",
    frota_operacional_pct:    "Frota operacional (%)",
    obras_no_prazo_pct:       "Obras no prazo (%)",
    patrimonio_regular_pct:   "Patrimônio regular (%)",
  };

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", background: cor + "0d",
        borderBottom: "1px solid #e5e7eb",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon size={18} color={cor} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{meta.label}</div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>{meta.descricao}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: cor, lineHeight: 1 }}>{data.score}</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>peso {meta.peso}</div>
        </div>
      </div>

      {/* Subcomponentes */}
      <div style={{ padding: "12px 16px" }}>
        {Object.entries(data.subcomponentes).map(([k, v]) => {
          if (typeof v === "boolean") {
            return (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: "#6b7280" }}>{subLabels[k] ?? k}</span>
                <span style={{ fontWeight: 600, color: v ? "#16a34a" : "#dc2626" }}>{v ? "Sim ✓" : "Não ✗"}</span>
              </div>
            );
          }
          const num = Number(v);
          const c = num >= 70 ? "#16a34a" : num >= 40 ? "#d97706" : "#dc2626";
          return <MiniBar key={k} score={num} label={subLabels[k] ?? k} cor={c} />;
        })}

        {/* Indicadores Previne (só APS) */}
        {data.indicadores && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 6, textTransform: "uppercase" }}>
              Indicadores Previne Brasil
            </div>
            {data.indicadores.map(ind => (
              <div key={ind.nome} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3, color: "#6b7280" }}>
                <span style={{ maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ind.nome}</span>
                <span style={{ fontWeight: 600, color: ind.resultado >= ind.meta ? "#16a34a" : "#dc2626" }}>
                  {ind.resultado}% / {ind.meta}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function ScoreERSUS() {
  const { data, isLoading, refetch, dataUpdatedAt } = useQuery<ScoreData>({
    queryKey: ["score-ersus"],
    queryFn: () => apiGet("/api/score") as Promise<ScoreData>,
    staleTime: 120_000,
  });

  const ultimaAtualizacao = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleString("pt-BR")
    : "—";

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <RefreshCw size={28} color="#9ca3af" style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!data) return null;

  const ultimoScore = data.historico.at(-2)?.score ?? data.score_total;
  const variacao = data.score_total - ultimoScore;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>

      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Score ERSUS 360</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
            Índice composto de gestão municipal em saúde — {data.municipio}/{data.uf}
          </p>
        </div>
        <button onClick={() => refetch()} style={{
          display: "flex", alignItems: "center", gap: 6,
          border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 12px",
          background: "#fff", cursor: "pointer", fontSize: 13,
        }}>
          <RefreshCw size={14} /> Recalcular
        </button>
      </div>

      {/* Score principal */}
      <div style={{
        display: "grid", gridTemplateColumns: "220px 1fr", gap: 20,
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
        padding: 24, marginBottom: 20,
      }}>
        {/* Gauge */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <GaugeCircle score={data.score_total} cor={data.cor} />
          <div style={{
            background: data.cor + "18", color: data.cor,
            fontWeight: 700, fontSize: 14, padding: "4px 16px", borderRadius: 20,
          }}>
            {data.emoji} {data.nivel}
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>Atualizado: {ultimaAtualizacao}</div>
        </div>

        {/* Resumo direito */}
        <div>
          {/* Variação */}
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {variacao > 0
                ? <TrendingUp size={18} color="#16a34a" />
                : variacao < 0
                ? <TrendingDown size={18} color="#dc2626" />
                : <Minus size={18} color="#9ca3af" />}
              <span style={{ fontSize: 13, color: variacao >= 0 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                {variacao > 0 ? "+" : ""}{variacao.toFixed(1)} pts vs mês anterior
              </span>
            </div>
          </div>

          {/* Eixos resumo */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 16 }}>
            {EIXOS_META.map(m => {
              const eixo = (data.eixos as Record<string, EixoData>)[m.key];
              const c = corScore(eixo.score);
              const Icon = m.Icon;
              return (
                <div key={m.key} style={{ textAlign: "center", padding: "8px 4px", background: c + "0d", borderRadius: 8 }}>
                  <Icon size={16} color={c} style={{ marginBottom: 2 }} />
                  <div style={{ fontSize: 18, fontWeight: 700, color: c }}>{eixo.score}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", lineHeight: 1.2 }}>{m.label}</div>
                  <div style={{ fontSize: 10, color: "#d1d5db" }}>{m.peso}</div>
                </div>
              );
            })}
          </div>

          {/* Benchmarks */}
          <div style={{ display: "flex", gap: 12 }}>
            {Object.values(data.benchmarks).map(b => (
              <div key={b.nome} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: corScore(b.score) }}>{b.score}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>{b.nome}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evolução histórica */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <TrendingUp size={16} color="#2563eb" />
          <strong style={{ fontSize: 13 }}>Evolução do Score — 2026</strong>
        </div>
        <SparkLine historico={data.historico} />
      </div>

      {/* Cards por eixo */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {EIXOS_META.map(m => (
          <EixoCard
            key={m.key}
            eixoKey={m.key}
            meta={m}
            data={(data.eixos as Record<string, EixoData>)[m.key]}
          />
        ))}
      </div>

      {/* Nota metodológica */}
      <div style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "flex-start", color: "#9ca3af", fontSize: 11 }}>
        <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Score composto: APS 35% + Financeiro 25% + Epidemiologia 20% + Gestão 10% + Infraestrutura 10%.
          Valores baseados em dados de referência Apuí/AM. Integração com FNS e e-SUS em implantação.
        </span>
      </div>
    </div>
  );
}
