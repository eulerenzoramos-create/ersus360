/**
 * ScoreERSUS — ERSUS 360
 * Score composto 0–100 com situacao_dado explícito por métrica.
 * Eixos sem API pública são exibidos como "Sem dado disponível".
 */
import { useQuery } from "@tanstack/react-query";
import {
  RefreshCw, Activity, DollarSign, Heart,
  Briefcase, Truck, Info, AlertCircle, CheckCircle,
} from "lucide-react";
import { api } from "../lib/api";
import { useMunicipioSeletor } from "../lib/municipio";
import MunicipioSeletor from "../components/MunicipioSeletor";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Metrica {
  label: string; valor: number | string | boolean | null;
  situacao_dado: string; observacao: string;
}

interface Eixo {
  score: number | null; situacao_dado: string;
  metricas: Record<string, Metrica>;
  indicadores_raw?: Array<{
    nome: string; resultado_pct: number | null; meta_pct: number; pct_meta: number | null;
    situacao_dado: string;
  }>;
  peso: number; contribuicao: number | null; nota: string;
}

interface ScoreData {
  score_total: number | null; situacao_dado: string;
  nivel: string; cor: string;
  municipio: string; uf: string; ibge: string;
  calculado_em: string; nota: string;
  eixos: {
    aps: Eixo; financeiro: Eixo; epidemiologia: Eixo;
    gestao: Eixo; infraestrutura: Eixo;
  };
}

// ── Constantes ────────────────────────────────────────────────────────────────

const SIT_COR: Record<string, string> = {
  oficial_validado:   "#166534",
  oficial_aguardando: "#854d0e",
  divergente:         "#991b1b",
  dado_nao_validado:  "#6b7280",
  nao_disponivel:     "#94a3b8",
};
const SIT_LABEL: Record<string, string> = {
  oficial_validado:   "Oficial validado",
  oficial_aguardando: "Aguardando",
  divergente:         "Divergente",
  dado_nao_validado:  "Não validado",
  nao_disponivel:     "Não disponível",
};

const EIXOS_META = [
  { key: "aps",            label: "Atenção Primária",  peso: "35%", Icon: Heart,      cor: "#e11d48" },
  { key: "financeiro",     label: "Financeiro",         peso: "25%", Icon: DollarSign, cor: "#16a34a" },
  { key: "epidemiologia",  label: "Epidemiologia",      peso: "20%", Icon: Activity,   cor: "#7c3aed" },
  { key: "gestao",         label: "Gestão",             peso: "10%", Icon: Briefcase,  cor: "#0ea5e9" },
  { key: "infraestrutura", label: "Infraestrutura",     peso: "10%", Icon: Truck,      cor: "#f59e0b" },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function corScore(s: number | null) {
  if (s === null) return "#94a3b8";
  if (s >= 80) return "#16a34a";
  if (s >= 65) return "#2563eb";
  if (s >= 50) return "#d97706";
  return "#dc2626";
}

function Tag({ s }: { s: string }) {
  const cor = SIT_COR[s] ?? "#6b7280";
  return (
    <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10,
      color:cor, background:`${cor}15`, border:`1px solid ${cor}30` }}>
      {SIT_LABEL[s] ?? s}
    </span>
  );
}

// ── Gauge SVG ─────────────────────────────────────────────────────────────────

function GaugeCircle({ score, cor }: { score: number | null; cor: string }) {
  const r = 70, circ = 2 * Math.PI * r;
  const dash = score !== null ? (score / 100) * circ : 0;
  return (
    <svg width={170} height={170} viewBox="0 0 170 170">
      <circle cx={85} cy={85} r={r} fill="none" stroke="#e5e7eb" strokeWidth={12}/>
      <circle cx={85} cy={85} r={r} fill="none" stroke={cor} strokeWidth={12}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 85 85)"
        style={{ transition:"stroke-dasharray .8s ease" }}/>
      {score !== null
        ? <>
            <text x={85} y={80} textAnchor="middle" fontSize={34} fontWeight={800} fill={cor}>{score}</text>
            <text x={85} y={100} textAnchor="middle" fontSize={12} fill="#9ca3af">/100</text>
          </>
        : <text x={85} y={90} textAnchor="middle" fontSize={13} fill="#94a3b8">Sem dado</text>
      }
    </svg>
  );
}

// ── Card de eixo ──────────────────────────────────────────────────────────────

function EixoCard({ eixoKey, e }: { eixoKey: string; e: Eixo }) {
  const meta = EIXOS_META.find(m => m.key === eixoKey)!;
  const { Icon, label, peso, cor } = meta;
  const scoreColor = corScore(e.score);
  const semDado = e.score === null;

  return (
    <div style={{ border:`1px solid ${cor}20`, borderRadius:10, overflow:"hidden" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"12px 16px", background:`${cor}08`, borderBottom:`1px solid ${cor}15` }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Icon size={18} color={cor}/>
          <div>
            <div style={{ fontWeight:700, fontSize:14, color:"#1e293b" }}>{label}</div>
            <div style={{ fontSize:11, color:"#9ca3af" }}>peso {peso}</div>
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          {semDado
            ? <div style={{ fontSize:13, color:"#94a3b8", fontStyle:"italic" }}>Sem dado</div>
            : <div style={{ fontSize:26, fontWeight:800, color:scoreColor }}>{e.score}</div>
          }
          <Tag s={e.situacao_dado}/>
        </div>
      </div>

      {/* Métricas */}
      <div style={{ padding:"12px 16px" }}>
        {Object.entries(e.metricas).map(([k, m]) => (
          <div key={k} style={{ display:"flex", alignItems:"flex-start",
            justifyContent:"space-between", marginBottom:8, gap:10 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, color:"#374151", fontWeight:600 }}>{m.label}</div>
              {m.observacao && (
                <div style={{ fontSize:11, color:"#94a3b8", marginTop:1 }}>{m.observacao}</div>
              )}
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3, flexShrink:0 }}>
              <span style={{ fontSize:13, fontWeight:700, color: m.valor !== null ? "#1e293b" : "#94a3b8" }}>
                {m.valor !== null && m.valor !== undefined ? String(m.valor) : "—"}
              </span>
              <Tag s={m.situacao_dado}/>
            </div>
          </div>
        ))}

        {/* Indicadores Previne (APS) */}
        {e.indicadores_raw && e.indicadores_raw.length > 0 && (
          <div style={{ marginTop:10, borderTop:"1px solid #f1f5f9", paddingTop:10 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#6b7280",
              textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>
              Indicadores Previne Brasil
            </div>
            {e.indicadores_raw.map((ind, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between",
                fontSize:11, marginBottom:4, color:"#6b7280" }}>
                <span style={{ maxWidth:"65%", overflow:"hidden",
                  textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{ind.nome}</span>
                <span style={{ fontWeight:600, color:
                  ind.resultado_pct !== null && ind.resultado_pct >= ind.meta_pct
                    ? "#16a34a" : "#dc2626" }}>
                  {ind.resultado_pct !== null ? `${ind.resultado_pct}%` : "—"} / {ind.meta_pct}%
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Nota eixo */}
        {e.nota && (
          <div style={{ marginTop:8, fontSize:11, color:"#94a3b8",
            display:"flex", alignItems:"flex-start", gap:6 }}>
            <Info size={11} style={{ flexShrink:0, marginTop:1 }}/>
            {e.nota}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function ScoreERSUS() {
  const { ibge, setIbge } = useMunicipioSeletor();
  const token = localStorage.getItem("ersus_token") ?? "";

  const { data, isLoading, refetch } = useQuery<ScoreData>({
    queryKey: ["score-ersus", ibge],
    queryFn: () =>
      api.get(`/api/score?ibge=${ibge}`,
        { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data),
    staleTime: 300_000,
  });

  const scoreColor = corScore(data?.score_total ?? null);

  return (
    <div style={{ padding:24, maxWidth:960, margin:"0 auto" }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>

      {/* Cabeçalho */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
        marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:"#1e293b" }}>
            Score ERSUS 360
          </h1>
          <div style={{ fontSize:12, color:"#64748b" }}>
            Índice composto — dados reais de APIs públicas · situacao_dado por métrica
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" as const }}>
          <MunicipioSeletor onChange={setIbge}/>
          <button onClick={() => refetch()}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px",
              borderRadius:9, border:"1.5px solid #e2e8f0", background:"#fff",
              fontSize:12, fontWeight:600, cursor:"pointer", color:"#374151" }}>
            <RefreshCw size={13} style={{ animation: isLoading ? "spin 1s linear infinite" : "none" }}/>
            Atualizar
          </button>
        </div>
      </div>

      {isLoading && (
        <div style={{ textAlign:"center", padding:60, color:"#94a3b8" }}>
          <RefreshCw size={28} style={{ animation:"spin 1s linear infinite" }}/>
          <div style={{ marginTop:10, fontSize:14 }}>Calculando score…</div>
        </div>
      )}

      {data && (
        <>
          {/* Hero */}
          <div style={{ background:"linear-gradient(135deg,#1e3a5f,#1d4ed8)",
            borderRadius:14, padding:"24px 28px", marginBottom:20,
            display:"flex", alignItems:"center", gap:28, flexWrap:"wrap", color:"#fff" }}>
            <GaugeCircle score={data.score_total} cor={scoreColor}/>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.55)", textTransform:"uppercase",
                letterSpacing:"0.09em", marginBottom:4 }}>Score ERSUS 360</div>
              <div style={{ fontSize:28, fontWeight:900, marginBottom:4 }}>
                {data.municipio} / {data.uf}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" as const }}>
                <span style={{ fontSize:16, fontWeight:700,
                  color: scoreColor === "#94a3b8" ? "rgba(255,255,255,.6)" : scoreColor }}>
                  {data.nivel}
                </span>
                <Tag s={data.situacao_dado}/>
              </div>
              {data.score_total === null && (
                <div style={{ marginTop:10, fontSize:13, color:"rgba(255,255,255,.6)",
                  display:"flex", alignItems:"center", gap:6 }}>
                  <AlertCircle size={14}/>
                  Nenhum eixo retornou dado real ainda. Configure as integrações no Railway.
                </div>
              )}
              {data.score_total !== null && (
                <div style={{ marginTop:10, fontSize:12, color:"rgba(255,255,255,.5)" }}>
                  Calculado em: {data.calculado_em.slice(0, 16).replace("T", " ")} UTC
                </div>
              )}
            </div>

            {/* Contribuições por eixo */}
            <div style={{ minWidth:180 }}>
              {EIXOS_META.map(m => {
                const e = data.eixos[m.key as keyof typeof data.eixos];
                return (
                  <div key={m.key} style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"center", marginBottom:6, gap:16 }}>
                    <span style={{ fontSize:12, color:"rgba(255,255,255,.65)" }}>
                      {m.label} ({m.peso})
                    </span>
                    {e.score !== null
                      ? <span style={{ fontSize:13, fontWeight:700, color:corScore(e.score) }}>
                          {e.score}
                        </span>
                      : <span style={{ fontSize:11, color:"rgba(255,255,255,.35)" }}>—</span>
                    }
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nota geral */}
          <div style={{ padding:"10px 16px", background:"#f8fafc",
            border:"1px solid #e2e8f0", borderRadius:10, marginBottom:20,
            fontSize:12, color:"#64748b",
            display:"flex", alignItems:"flex-start", gap:8 }}>
            <Info size={13} style={{ flexShrink:0, marginTop:1 }}/>
            {data.nota}
          </div>

          {/* Eixos */}
          <div style={{ display:"grid", gap:14 }}>
            {EIXOS_META.map(m => (
              <EixoCard key={m.key}
                eixoKey={m.key}
                e={data.eixos[m.key as keyof typeof data.eixos]}/>
            ))}
          </div>

          {/* Nota de dados */}
          <div style={{ marginTop:16, padding:"12px 16px", background:"#f8fafc",
            border:"1px solid #e2e8f0", borderRadius:10, fontSize:11, color:"#94a3b8" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
              <CheckCircle size={11}/> <strong>Integridade dos dados</strong>
            </div>
            Todos os valores exibidos provêm de APIs públicas (Previne Brasil, SIOPS/DATASUS).
            Eixos sem API pública disponível são declarados como "Não disponível" — nenhum
            número é estimado ou simulado. Configure integrações locais via Railway para habilitar
            os demais eixos.
          </div>
        </>
      )}
    </div>
  );
}
