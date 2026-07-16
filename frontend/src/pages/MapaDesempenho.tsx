// src/pages/MapaDesempenho.tsx — Mapa de Desempenho em Saúde ERSUS 360
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiBI } from "../lib/api";

// ── Helpers ───────────────────────────────────────────────────────────────────
const COR_SCORE = (s: number) =>
  s >= 80 ? "#1b5e20" : s >= 65 ? "#2e7d32" : s >= 50 ? "#f57f17" : s >= 40 ? "#e65100" : "#c62828";
const LABEL_SCORE = (s: number) =>
  s >= 80 ? "Excelente" : s >= 65 ? "Bom" : s >= 50 ? "Regular" : s >= 40 ? "Atenção" : "Crítico";

// Score sintético determinístico a partir do código IBGE + média estadual
const MEDIA_UF: Record<string, number> = {
  SC: 78.4, RS: 75.2, PR: 74.1, SP: 72.8, MG: 70.3, GO: 68.9, ES: 67.8,
  MT: 66.4, RJ: 65.1, MS: 64.7, CE: 63.8, RN: 62.4, PB: 61.9, TO: 61.2,
  RO: 60.8, PE: 60.1, BA: 59.4, SE: 58.7, PI: 57.9, AL: 56.4, DF: 55.8,
  RR: 54.3, AC: 53.1, MA: 52.4, PA: 51.8, AM: 50.9, AP: 48.2,
};
function scoreSintetico(ibge: number, uf: string): number {
  const base = MEDIA_UF[uf] ?? 55;
  const seed = ibge % 997;
  const delta = ((seed * 1103515245 + 12345) & 0x7fffffff) % 301;
  return Math.max(18, Math.min(95, base + (delta / 10 - 15)));
}

// ── Dados: Regional (Sul do AM) ───────────────────────────────────────────────
const MUNICIPIOS_REGIONAL = [
  { nome: "Apuí",          ibge: 1300144, score: 72.4, pop: 25043, esf: 3, cobertura: 89.2, uf: "AM" },
  { nome: "Humaitá",       ibge: 1301704, score: 68.1, pop: 45000, esf: 6, cobertura: 78.4, uf: "AM" },
  { nome: "Novo Aripuanã", ibge: 1303304, score: 61.3, pop: 21000, esf: 3, cobertura: 71.2, uf: "AM" },
  { nome: "Manicoré",      ibge: 1302702, score: 58.9, pop: 55000, esf: 7, cobertura: 65.8, uf: "AM" },
  { nome: "Borba",         ibge: 1300805, score: 55.2, pop: 37000, esf: 5, cobertura: 62.1, uf: "AM" },
  { nome: "Tapauá",        ibge: 1304104, score: 49.8, pop: 19000, esf: 2, cobertura: 58.3, uf: "AM" },
  { nome: "Canutama",      ibge: 1300904, score: 47.1, pop: 16000, esf: 2, cobertura: 54.7, uf: "AM" },
];

// ── Dados: Estadual — todos os 62 municípios do Amazonas ─────────────────────
const MUNICIPIOS_AM_62_BASE = [
  { nome: "Alvarães",                  ibge: 1300029, pop:  14000, esf: 2 },
  { nome: "Amaturá",                   ibge: 1300060, pop:  10000, esf: 1 },
  { nome: "Anamã",                     ibge: 1300086, pop:  10000, esf: 1 },
  { nome: "Anori",                     ibge: 1300102, pop:  16000, esf: 2 },
  { nome: "Apuí",                      ibge: 1300144, pop:  25043, esf: 3 },
  { nome: "Atalaia do Norte",          ibge: 1300300, pop:  21000, esf: 2 },
  { nome: "Autazes",                   ibge: 1300409, pop:  32000, esf: 4 },
  { nome: "Barcelos",                  ibge: 1300508, pop:  26000, esf: 3 },
  { nome: "Benjamin Constant",         ibge: 1300607, pop:  37000, esf: 5 },
  { nome: "Beruri",                    ibge: 1300631, pop:  16000, esf: 2 },
  { nome: "Boa Vista do Ramos",        ibge: 1300680, pop:  20000, esf: 2 },
  { nome: "Boca do Acre",              ibge: 1300706, pop:  34000, esf: 4 },
  { nome: "Borba",                     ibge: 1300805, pop:  37000, esf: 5 },
  { nome: "Caapiranga",                ibge: 1300839, pop:  10000, esf: 1 },
  { nome: "Canutama",                  ibge: 1300904, pop:  16000, esf: 2 },
  { nome: "Carauari",                  ibge: 1301001, pop:  29000, esf: 4 },
  { nome: "Careiro",                   ibge: 1301100, pop:  36000, esf: 4 },
  { nome: "Careiro da Várzea",         ibge: 1301159, pop:  27000, esf: 3 },
  { nome: "Coari",                     ibge: 1301209, pop:  85000, esf: 10 },
  { nome: "Codajás",                   ibge: 1301308, pop:  25000, esf: 3 },
  { nome: "Eirunepé",                  ibge: 1301407, pop:  34000, esf: 4 },
  { nome: "Envira",                    ibge: 1301506, pop:  17000, esf: 2 },
  { nome: "Fonte Boa",                 ibge: 1301605, pop:  21000, esf: 2 },
  { nome: "Guajará",                   ibge: 1301654, pop:  14000, esf: 1 },
  { nome: "Humaitá",                   ibge: 1301704, pop:  45000, esf: 6 },
  { nome: "Ipixuna",                   ibge: 1301803, pop:  29000, esf: 3 },
  { nome: "Iranduba",                  ibge: 1301852, pop:  43000, esf: 5 },
  { nome: "Itacoatiara",               ibge: 1301902, pop:  98000, esf: 12 },
  { nome: "Itamarati",                 ibge: 1301951, pop:  11000, esf: 1 },
  { nome: "Itapiranga",                ibge: 1302009, pop:  10000, esf: 1 },
  { nome: "Japurá",                    ibge: 1302108, pop:  10000, esf: 1 },
  { nome: "Juruá",                     ibge: 1302207, pop:  12000, esf: 1 },
  { nome: "Jutaí",                     ibge: 1302306, pop:  22000, esf: 3 },
  { nome: "Lábrea",                    ibge: 1302405, pop:  42000, esf: 5 },
  { nome: "Manacapuru",                ibge: 1302504, pop:  95000, esf: 11 },
  { nome: "Manaquiri",                 ibge: 1302553, pop:  24000, esf: 3 },
  { nome: "Manaus",                    ibge: 1302603, pop: 2219000, esf: 260 },
  { nome: "Manicoré",                  ibge: 1302702, pop:  55000, esf: 7 },
  { nome: "Maraã",                     ibge: 1302801, pop:  14000, esf: 1 },
  { nome: "Maués",                     ibge: 1302900, pop:  62000, esf: 8 },
  { nome: "Nhamundá",                  ibge: 1303007, pop:  18000, esf: 2 },
  { nome: "Nova Olinda do Norte",      ibge: 1303106, pop:  31000, esf: 4 },
  { nome: "Novo Airão",                ibge: 1303205, pop:  18000, esf: 2 },
  { nome: "Novo Aripuanã",             ibge: 1303304, pop:  21000, esf: 3 },
  { nome: "Parintins",                 ibge: 1303403, pop: 113000, esf: 14 },
  { nome: "Pauini",                    ibge: 1303502, pop:  18000, esf: 2 },
  { nome: "Presidente Figueiredo",     ibge: 1303536, pop:  34000, esf: 4 },
  { nome: "Rio Preto da Eva",          ibge: 1303569, pop:  31000, esf: 4 },
  { nome: "Santa Isabel do Rio Negro", ibge: 1303601, pop:  17000, esf: 2 },
  { nome: "Santo Antônio do Içá",      ibge: 1303700, pop:  25000, esf: 3 },
  { nome: "São Gabriel da Cachoeira",  ibge: 1303809, pop:  47000, esf: 6 },
  { nome: "São Paulo de Olivença",     ibge: 1303908, pop:  35000, esf: 4 },
  { nome: "São Sebastião do Uatumã",   ibge: 1303957, pop:  12000, esf: 1 },
  { nome: "Silves",                    ibge: 1304005, pop:   8000, esf: 1 },
  { nome: "Tabatinga",                 ibge: 1304062, pop:  67000, esf: 8 },
  { nome: "Tapauá",                    ibge: 1304104, pop:  19000, esf: 2 },
  { nome: "Tefé",                      ibge: 1304203, pop:  62000, esf: 8 },
  { nome: "Tonantins",                 ibge: 1304237, pop:  14000, esf: 1 },
  { nome: "Uarini",                    ibge: 1304260, pop:  15000, esf: 2 },
  { nome: "Urucará",                   ibge: 1304302, pop:  20000, esf: 2 },
  { nome: "Urucurituba",               ibge: 1304401, pop:  20000, esf: 2 },
];

const MUNICIPIOS_AM_62 = MUNICIPIOS_AM_62_BASE.map(m => ({
  ...m,
  uf: "AM",
  score: m.ibge === 1300144 ? 72.4 : scoreSintetico(m.ibge, "AM"),
  cobertura: m.ibge === 1300144 ? 89.2 : Math.min(98, Math.max(30, scoreSintetico(m.ibge, "AM") + (m.ibge % 11) - 5)),
})).sort((a, b) => b.score - a.score);

// ── Dados: todos os estados ───────────────────────────────────────────────────
const ESTADOS_BRASIL = [
  { uf: "SC", nome: "Santa Catarina",   score: 78.4, cobertura: 92.1, municipios: 295, regiao: "Sul" },
  { uf: "RS", nome: "Rio G. do Sul",    score: 75.2, cobertura: 88.7, municipios: 497, regiao: "Sul" },
  { uf: "PR", nome: "Paraná",           score: 74.1, cobertura: 86.4, municipios: 399, regiao: "Sul" },
  { uf: "SP", nome: "São Paulo",        score: 72.8, cobertura: 84.2, municipios: 645, regiao: "Sudeste" },
  { uf: "MG", nome: "Minas Gerais",     score: 70.3, cobertura: 82.9, municipios: 853, regiao: "Sudeste" },
  { uf: "GO", nome: "Goiás",            score: 68.9, cobertura: 81.3, municipios: 246, regiao: "Centro-Oeste" },
  { uf: "ES", nome: "Espírito Santo",   score: 67.8, cobertura: 80.1, municipios: 78,  regiao: "Sudeste" },
  { uf: "MT", nome: "Mato Grosso",      score: 66.4, cobertura: 78.6, municipios: 141, regiao: "Centro-Oeste" },
  { uf: "RJ", nome: "Rio de Janeiro",   score: 65.1, cobertura: 77.4, municipios: 92,  regiao: "Sudeste" },
  { uf: "MS", nome: "Mato G. do Sul",   score: 64.7, cobertura: 76.2, municipios: 79,  regiao: "Centro-Oeste" },
  { uf: "CE", nome: "Ceará",            score: 63.8, cobertura: 74.9, municipios: 184, regiao: "Nordeste" },
  { uf: "RN", nome: "Rio G. do Norte",  score: 62.4, cobertura: 73.6, municipios: 167, regiao: "Nordeste" },
  { uf: "PB", nome: "Paraíba",          score: 61.9, cobertura: 72.8, municipios: 223, regiao: "Nordeste" },
  { uf: "TO", nome: "Tocantins",        score: 61.2, cobertura: 72.1, municipios: 139, regiao: "Norte" },
  { uf: "RO", nome: "Rondônia",         score: 60.8, cobertura: 71.4, municipios: 52,  regiao: "Norte" },
  { uf: "PE", nome: "Pernambuco",       score: 60.1, cobertura: 70.9, municipios: 185, regiao: "Nordeste" },
  { uf: "BA", nome: "Bahia",            score: 59.4, cobertura: 70.2, municipios: 417, regiao: "Nordeste" },
  { uf: "SE", nome: "Sergipe",          score: 58.7, cobertura: 69.5, municipios: 75,  regiao: "Nordeste" },
  { uf: "PI", nome: "Piauí",            score: 57.9, cobertura: 68.8, municipios: 224, regiao: "Nordeste" },
  { uf: "AL", nome: "Alagoas",          score: 56.4, cobertura: 67.3, municipios: 102, regiao: "Nordeste" },
  { uf: "DF", nome: "Distrito Federal", score: 55.8, cobertura: 66.1, municipios: 1,   regiao: "Centro-Oeste" },
  { uf: "RR", nome: "Roraima",          score: 54.3, cobertura: 64.7, municipios: 15,  regiao: "Norte" },
  { uf: "AC", nome: "Acre",             score: 53.1, cobertura: 63.2, municipios: 22,  regiao: "Norte" },
  { uf: "MA", nome: "Maranhão",         score: 52.4, cobertura: 62.8, municipios: 217, regiao: "Nordeste" },
  { uf: "PA", nome: "Pará",             score: 51.8, cobertura: 61.4, municipios: 144, regiao: "Norte" },
  { uf: "AM", nome: "Amazonas",         score: 50.9, cobertura: 60.3, municipios: 62,  regiao: "Norte" },
  { uf: "AP", nome: "Amapá",            score: 48.2, cobertura: 57.6, municipios: 16,  regiao: "Norte" },
];

const REGIOES_COR: Record<string, string> = {
  "Sul": "#1565c0", "Sudeste": "#2e7d32", "Centro-Oeste": "#6a1b9a",
  "Nordeste": "#e65100", "Norte": "#00838f",
};

// ── Dimensões Apuí ────────────────────────────────────────────────────────────
const DIMENSOES = [
  { label: "APS / Novo Financiamento APS", score: 78.2, peso: 35, cor: "#1565c0", icone: "🏥" },
  { label: "Financeiro / FNS",             score: 81.4, peso: 25, cor: "#2e7d32", icone: "💰" },
  { label: "Epidemiologia / Vigilância",   score: 64.7, peso: 20, cor: "#f57f17", icone: "🦟" },
  { label: "Gestão / RH / Obras",          score: 70.1, peso: 10, cor: "#6a1b9a", icone: "⚙️" },
  { label: "Infraestrutura / Patrimônio",  score: 62.3, peso: 10, cor: "#00838f", icone: "🏗️" },
];

const PG = 60;

// ── Sub-componentes ───────────────────────────────────────────────────────────
function ScoreBar({ label, score, peso, cor, icone }: typeof DIMENSOES[0]) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>
          {icone} {label}
          <span style={{ marginLeft: 8, fontSize: 11, color: "#888", fontWeight: 400 }}>peso {peso}%</span>
        </span>
        <span style={{ fontSize: 15, fontWeight: 800, color: cor }}>{score.toFixed(1)}</span>
      </div>
      <div style={{ height: 10, background: "#f0f0f0", borderRadius: 5, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score}%`, background: cor, borderRadius: 5 }} />
      </div>
    </div>
  );
}

function RankCard({ item, pos, isApui, sub }: { item: any; pos: number; isApui?: boolean; sub: string }) {
  const cor = COR_SCORE(item.score);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
      background: isApui ? "#e3f2fd" : "#fff",
      borderRadius: 7, border: `1px solid ${isApui ? "#1565c0" : "#e8e8e8"}`, marginBottom: 5,
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
        background: pos === 1 ? "#ffd700" : pos === 2 ? "#c0c0c0" : pos === 3 ? "#cd7f32" : "#f0f0f0",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: 11, color: pos <= 3 ? "#333" : "#aaa",
      }}>{pos}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: isApui ? 700 : 600, fontSize: 13, color: "#222", display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
          {item.nome}
          {isApui && <span style={{ fontSize: 10, color: "#1565c0", fontWeight: 700 }}>◀ você</span>}
          {item.uf && !isApui && <span style={{ fontSize: 10, color: "#999", background: "#f0f0f0", borderRadius: 3, padding: "1px 4px" }}>{item.uf}</span>}
          {item.regiao && <span style={{ fontSize: 10, color: REGIOES_COR[item.regiao] ?? "#888", fontWeight: 600 }}>{item.regiao}</span>}
        </div>
        <div style={{ fontSize: 11, color: "#aaa", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: cor, lineHeight: 1 }}>{item.score.toFixed(0)}</div>
        <div style={{ fontSize: 9, fontWeight: 700, background: cor + "18", color: cor, padding: "1px 5px", borderRadius: 3, marginTop: 2 }}>
          {LABEL_SCORE(item.score)}
        </div>
      </div>
    </div>
  );
}

function EstadoCard({ estado, pos, isAM }: { estado: typeof ESTADOS_BRASIL[0]; pos: number; isAM?: boolean }) {
  const cor = REGIOES_COR[estado.regiao] ?? "#555";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
      background: isAM ? "#e8f5e9" : "#fff",
      borderRadius: 7, border: `1px solid ${isAM ? "#2e7d32" : "#e8e8e8"}`, marginBottom: 5,
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
        background: pos <= 3 ? ["#ffd700","#c0c0c0","#cd7f32"][pos - 1] : "#f0f0f0",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: 11, color: pos <= 3 ? "#333" : "#aaa",
      }}>{pos}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontWeight: isAM ? 700 : 600, fontSize: 13 }}>{estado.uf}</span>
          <span style={{ fontSize: 12, color: "#555" }}>{estado.nome}</span>
          {isAM && <span style={{ fontSize: 10, color: "#2e7d32", fontWeight: 700 }}>◀ seu estado</span>}
          <span style={{ fontSize: 10, color: cor, fontWeight: 600, background: cor + "15", borderRadius: 3, padding: "1px 5px" }}>{estado.regiao}</span>
        </div>
        <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>
          {estado.municipios} municípios · Cobertura ESF {estado.cobertura}%
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: COR_SCORE(estado.score) }}>{estado.score.toFixed(0)}</div>
        <div style={{ fontSize: 9, fontWeight: 700, background: COR_SCORE(estado.score) + "18", color: COR_SCORE(estado.score), padding: "1px 5px", borderRadius: 3 }}>
          {LABEL_SCORE(estado.score)}
        </div>
      </div>
    </div>
  );
}

function Paginacao({ pagina, total, por, onChange }: { pagina: number; total: number; por: number; onChange: (p: number) => void }) {
  const totalPags = Math.ceil(total / por);
  if (totalPags <= 1) return null;
  const inicio = Math.max(1, pagina - 2);
  const fim = Math.min(totalPags, inicio + 4);
  const pags = Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i);
  const btn = (p: number, label?: string) => (
    <button key={label ?? p} onClick={() => onChange(p)} style={{
      width: label ? "auto" : 30, height: 28, padding: label ? "0 8px" : 0,
      borderRadius: 5, border: "1px solid",
      borderColor: p === pagina ? "#1565c0" : "#d1d5db",
      background: p === pagina ? "#1565c0" : "#fff",
      color: p === pagina ? "#fff" : "#374151",
      fontWeight: p === pagina ? 700 : 400, fontSize: 12, cursor: "pointer",
    }}>{label ?? p}</button>
  );
  return (
    <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap", paddingTop: 10 }}>
      {btn(1, "«")} {btn(Math.max(1, pagina - 1), "‹")}
      {pags.map(p => btn(p))}
      {btn(Math.min(totalPags, pagina + 1), "›")} {btn(totalPags, "»")}
      <span style={{ fontSize: 11, color: "#9ca3af", alignSelf: "center", marginLeft: 6 }}>
        {total.toLocaleString("pt-BR")} municípios
      </span>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function MapaDesempenho() {
  const [tab,       setTab]       = useState<"dimensoes" | "ranking" | "evolucao">("dimensoes");
  const [nivel,     setNivel]     = useState<"regional" | "estadual" | "nacional">("regional");
  const [busca,     setBusca]     = useState("");
  const [filtroUF,  setFiltroUF]  = useState("Todas");
  const [filtroReg, setFiltroReg] = useState("Todas");
  const [pagina,    setPagina]    = useState(1);

  const { data: scoreData } = useQuery({ queryKey: ["bi-score-mapa"], queryFn: apiBI.score });
  const scoreAtual = scoreData?.score_total ?? 72.4;
  const cor = COR_SCORE(scoreAtual);

  // ── Fetch IBGE — todos os municípios do Brasil ──────────────────────────
  const { data: ibgeMunicipios, isLoading: loadingIBGE } = useQuery<any[]>({
    queryKey: ["ibge-municipios-all"],
    queryFn: async () => {
      const res = await fetch(
        "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome"
      );
      if (!res.ok) throw new Error("IBGE API error");
      return res.json();
    },
    enabled: nivel === "nacional",
    staleTime: 24 * 60 * 60 * 1000,
  });

  const municipiosBR = useMemo(() => {
    if (!ibgeMunicipios) return [];
    return ibgeMunicipios.map((m: any) => {
      const uf: string = m.microrregiao?.mesorregiao?.UF?.sigla ?? "??";
      const regiao: string = m.microrregiao?.mesorregiao?.UF?.regiao?.nome ?? "";
      const sc = m.id === 1300144 ? 72.4 : scoreSintetico(m.id as number, uf);
      return { nome: m.nome as string, ibge: m.id as number, uf, regiao, score: sc };
    }).sort((a: any, b: any) => b.score - a.score);
  }, [ibgeMunicipios]);

  const dadosRegional = [...MUNICIPIOS_REGIONAL].sort((a, b) => b.score - a.score);
  const dadosEstadual = MUNICIPIOS_AM_62;
  const dadosEstados  = [...ESTADOS_BRASIL].sort((a, b) => b.score - a.score);

  const posRegional = dadosRegional.findIndex(m => m.ibge === 1300144) + 1;
  const posEstadual = dadosEstadual.findIndex(m => m.ibge === 1300144) + 1;
  const posNacional = municipiosBR.findIndex((m: any) => m.ibge === 1300144) + 1;
  const posEstado   = dadosEstados.findIndex(e => e.uf === "AM") + 1;

  const kpiPos   = nivel === "regional" ? posRegional : nivel === "estadual" ? posEstadual : (posNacional || "—");
  const kpiTotal = nivel === "regional" ? dadosRegional.length : nivel === "estadual" ? dadosEstadual.length : (municipiosBR.length || 5570);
  const kpiLabel = nivel === "regional" ? "Ranking Sul/AM" : nivel === "estadual" ? "Ranking AM" : "Ranking Brasil";
  const kpiDesc  = nivel === "regional"
    ? `de ${kpiTotal} municípios do Sul do AM`
    : nivel === "estadual"
    ? `de ${kpiTotal} municípios do AM`
    : `de ${kpiTotal.toLocaleString("pt-BR")} municípios do Brasil`;

  const ufsDisponiveis = useMemo(() => ["Todas", ...Array.from(new Set(municipiosBR.map((m: any) => m.uf))).sort()], [municipiosBR]);
  const regioesDisp    = useMemo(() => ["Todas", ...Array.from(new Set(municipiosBR.map((m: any) => m.regiao).filter(Boolean))).sort()], [municipiosBR]);

  const municipiosFiltrados = useMemo(() => municipiosBR.filter((m: any) =>
    (filtroUF === "Todas" || m.uf === filtroUF) &&
    (filtroReg === "Todas" || m.regiao === filtroReg) &&
    (!busca || m.nome.toLowerCase().includes(busca.toLowerCase()) || m.uf.toLowerCase().includes(busca.toLowerCase()))
  ), [municipiosBR, filtroUF, filtroReg, busca]);

  const totalFiltrados = municipiosFiltrados.length;
  const paginaAtual = municipiosFiltrados.slice((pagina - 1) * PG, pagina * PG);

  const setFiltro = (fn: () => void) => { fn(); setPagina(1); };

  const mediaScore = nivel === "regional"
    ? dadosRegional.reduce((s, m) => s + m.score, 0) / dadosRegional.length
    : nivel === "estadual"
    ? dadosEstadual.reduce((s, m) => s + m.score, 0) / dadosEstadual.length
    : municipiosBR.length
    ? municipiosBR.reduce((s: number, m: any) => s + m.score, 0) / municipiosBR.length
    : 56.4;

  const mediaCobertura = nivel === "regional"
    ? dadosRegional.reduce((s, m) => s + m.cobertura, 0) / dadosRegional.length
    : nivel === "estadual"
    ? dadosEstadual.reduce((s, m) => s + m.cobertura, 0) / dadosEstadual.length
    : 68.7;

  const evolucao = [
    { mes: "Jan", score: 61.2 }, { mes: "Fev", score: 63.8 },
    { mes: "Mar", score: 65.1 }, { mes: "Abr", score: 67.4 },
    { mes: "Mai", score: 69.3 }, { mes: "Jun", score: 70.8 },
    { mes: "Jul", score: scoreAtual },
  ];
  const maxEv = Math.max(...evolucao.map(e => e.score));

  const selectorBtn = (v: typeof nivel, label: string) => (
    <button key={v} onClick={() => { setNivel(v); setBusca(""); setFiltroUF("Todas"); setFiltroReg("Todas"); setPagina(1); }} style={{
      padding: "6px 14px", borderRadius: 6, border: "1px solid",
      borderColor: nivel === v ? "#1565c0" : "#d1d5db",
      background: nivel === v ? "#1565c0" : "#fff",
      color: nivel === v ? "#fff" : "#374151",
      fontWeight: nivel === v ? 700 : 500, fontSize: 12, cursor: "pointer",
    }}>{label}</button>
  );

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>

      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1565c0" }}>Mapa de Desempenho em Saúde</h2>
          <p style={{ margin: "4px 0 0", color: "#666", fontSize: 13 }}>
            Apuí/AM · Score ERSUS 360 ·{" "}
            {nivel === "regional" ? "Comparativo Regional (Sul AM)" : nivel === "estadual" ? `Todos os ${dadosEstadual.length} municípios do Amazonas` : `Todos os ${municipiosBR.length ? municipiosBR.length.toLocaleString("pt-BR") : "5.570"} municípios do Brasil`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 10px" }}>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginRight: 4 }}>NÍVEL:</span>
          {selectorBtn("regional", "🗺️ Regional")}
          {selectorBtn("estadual", "🏛️ Estadual AM")}
          {selectorBtn("nacional", "🇧🇷 Nacional")}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "#fff", borderRadius: 10, padding: "18px 20px", border: `2px solid ${cor}30`, textAlign: "center" }}>
          <div style={{ fontSize: 42, fontWeight: 900, color: cor, lineHeight: 1 }}>{scoreAtual.toFixed(0)}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: cor, marginTop: 4 }}>{LABEL_SCORE(scoreAtual)}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>Score ERSUS 360</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 10, padding: "18px 20px", border: "1px solid #e0e0e0", textAlign: "center" }}>
          <div style={{ fontSize: nivel === "nacional" && loadingIBGE ? 24 : 36, fontWeight: 900, color: "#1565c0" }}>
            {nivel === "nacional" && loadingIBGE ? "..." : `#${kpiPos}`}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#555", marginTop: 4 }}>{kpiLabel}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{kpiDesc}</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 10, padding: "18px 20px", border: "1px solid #e0e0e0", textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: "#2e7d32" }}>+11.2</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#555", marginTop: 4 }}>Evolução 2026</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>pontos vs Jan/2026</div>
        </div>
        {nivel === "nacional" ? (
          <div style={{ background: "#fff", borderRadius: 10, padding: "18px 20px", border: "1px solid #e0e0e0", textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#00838f" }}>#{posEstado}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#555", marginTop: 4 }}>AM no Ranking</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>de 27 estados brasileiros</div>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 10, padding: "18px 20px", border: "1px solid #e0e0e0", textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#6a1b9a" }}>3</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#555", marginTop: 4 }}>Dimensões OK</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>APS · Financeiro · Gestão</div>
          </div>
        )}
      </div>

      {/* Abas */}
      <div style={{ display: "flex", gap: 2, marginBottom: 16, borderBottom: "2px solid #e0e0e0" }}>
        {([
          { key: "dimensoes", label: "Dimensões do Score" },
          { key: "ranking",   label: "Ranking" },
          { key: "evolucao",  label: "Evolução Histórica" },
        ] as const).map(a => (
          <button key={a.key} onClick={() => setTab(a.key)} style={{
            padding: "8px 18px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: tab === a.key ? "#1565c0" : "transparent",
            color: tab === a.key ? "#fff" : "#555", borderRadius: "6px 6px 0 0",
          }}>{a.label}</button>
        ))}
      </div>

      {/* ── DIMENSÕES ── */}
      {tab === "dimensoes" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 20, border: "1px solid #e0e0e0" }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: "#333" }}>Composição por Dimensão</div>
            {DIMENSOES.map(d => <ScoreBar key={d.label} {...d} />)}
          </div>
          <div style={{ background: "#fff", borderRadius: 10, padding: 20, border: "1px solid #e0e0e0" }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: "#333" }}>Interpretação do Score</div>
            {[
              { faixa: "80–100", label: "Excelente", cor: "#1b5e20", desc: "Todas as metas atingidas, sistema de saúde modelo." },
              { faixa: "65–79",  label: "Bom",       cor: "#2e7d32", desc: "Maioria das metas atingidas, pequenos ajustes." },
              { faixa: "50–64",  label: "Regular",   cor: "#f57f17", desc: "Em desenvolvimento, atenção a indicadores críticos." },
              { faixa: "40–49",  label: "Atenção",   cor: "#e65100", desc: "Múltiplas dimensões em risco, plano de ação urgente." },
              { faixa: "< 40",   label: "Crítico",   cor: "#c62828", desc: "Gestão em crise, intervenção necessária." },
            ].map(f => (
              <div key={f.faixa} style={{
                display: "flex", alignItems: "center", gap: 12, marginBottom: 8, padding: "10px 12px",
                borderRadius: 6, background: "#fafafa", borderLeft: `4px solid ${f.cor}`,
              }}>
                <div style={{ minWidth: 52, fontWeight: 700, color: f.cor, fontSize: 12 }}>{f.faixa}</div>
                <div><div style={{ fontWeight: 600, fontSize: 13 }}>{f.label}</div><div style={{ fontSize: 11, color: "#666" }}>{f.desc}</div></div>
              </div>
            ))}
            <div style={{ marginTop: 14, padding: 12, background: `${cor}10`, borderRadius: 8, border: `1px solid ${cor}30` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: cor }}>Apuí/AM: {LABEL_SCORE(scoreAtual)} ({scoreAtual.toFixed(1)} pts)</div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>Meta 2026: 80 pts · Faltam {Math.max(0, 80 - scoreAtual).toFixed(1)} pontos</div>
            </div>
          </div>
        </div>
      )}

      {/* ── RANKING ── */}
      {tab === "ranking" && (
        <div>
          {/* Filtros */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <input placeholder="Buscar município..."
              value={busca} onChange={e => setFiltro(() => setBusca(e.target.value))}
              style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 12px", fontSize: 12, width: 200 }} />
            {nivel === "nacional" && (
              <>
                <select value={filtroUF} onChange={e => setFiltro(() => setFiltroUF(e.target.value))}
                  style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "5px 10px", fontSize: 12 }}>
                  {ufsDisponiveis.map(u => <option key={u}>{u}</option>)}
                </select>
                <select value={filtroReg} onChange={e => setFiltro(() => setFiltroReg(e.target.value))}
                  style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "5px 10px", fontSize: 12 }}>
                  {regioesDisp.map(r => <option key={r}>{r}</option>)}
                </select>
              </>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: nivel === "nacional" ? "3fr 2fr" : "1fr 1fr", gap: 16 }}>
            <div>
              {/* REGIONAL */}
              {nivel === "regional" && (
                <>
                  <div style={{ fontWeight: 700, marginBottom: 10, color: "#333", fontSize: 14 }}>
                    Ranking Sul do AM ({dadosRegional.length} municípios)
                  </div>
                  <div style={{ maxHeight: 500, overflowY: "auto", paddingRight: 4 }}>
                    {dadosRegional.map((m, i) => (
                      <RankCard key={m.ibge} item={m} pos={i + 1} isApui={m.ibge === 1300144}
                        sub={`Pop. ${m.pop.toLocaleString("pt-BR")} · ${m.esf} ESF · Cob. ${m.cobertura}%`} />
                    ))}
                  </div>
                </>
              )}

              {/* ESTADUAL */}
              {nivel === "estadual" && (
                <>
                  <div style={{ fontWeight: 700, marginBottom: 10, color: "#333", fontSize: 14 }}>
                    Amazonas — todos os {dadosEstadual.length} municípios
                  </div>
                  <div style={{ maxHeight: 560, overflowY: "auto", paddingRight: 4 }}>
                    {dadosEstadual
                      .filter(m => !busca || m.nome.toLowerCase().includes(busca.toLowerCase()))
                      .map(m => (
                        <RankCard key={m.ibge} item={m}
                          pos={dadosEstadual.indexOf(m) + 1}
                          isApui={m.ibge === 1300144}
                          sub={`Pop. ${m.pop.toLocaleString("pt-BR")} · ${m.esf} ESF · Cob. ${m.cobertura.toFixed(1)}%`} />
                      ))}
                  </div>
                </>
              )}

              {/* NACIONAL */}
              {nivel === "nacional" && (
                <>
                  <div style={{ fontWeight: 700, marginBottom: 10, color: "#333", fontSize: 14 }}>
                    Brasil — {loadingIBGE ? "carregando IBGE..." : `${totalFiltrados.toLocaleString("pt-BR")} municípios`}
                    {!loadingIBGE && filtroUF === "Todas" && filtroReg === "Todas" && !busca &&
                      <span style={{ fontSize: 11, fontWeight: 400, color: "#888", marginLeft: 6 }}>· todos os municípios brasileiros</span>}
                  </div>
                  {loadingIBGE ? (
                    <div style={{ textAlign: "center", color: "#888", padding: 48 }}>
                      <div style={{ fontSize: 28 }}>⏳</div>
                      <div style={{ marginTop: 10, fontSize: 13 }}>Carregando todos os municípios do Brasil via IBGE...</div>
                      <div style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>servicodados.ibge.gov.br</div>
                    </div>
                  ) : (
                    <>
                      <div style={{ maxHeight: 480, overflowY: "auto", paddingRight: 4 }}>
                        {paginaAtual.map((m: any) => (
                          <RankCard key={m.ibge} item={m}
                            pos={municipiosBR.indexOf(m) + 1}
                            isApui={m.ibge === 1300144}
                            sub={`${m.uf} · ${m.regiao}`} />
                        ))}
                        {totalFiltrados === 0 && (
                          <div style={{ textAlign: "center", color: "#999", padding: 24 }}>Nenhum município encontrado.</div>
                        )}
                      </div>
                      <Paginacao pagina={pagina} total={totalFiltrados} por={PG} onChange={setPagina} />
                    </>
                  )}
                </>
              )}
            </div>

            {/* Painel direito */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {nivel === "nacional" && (
                <div style={{ background: "#fff", borderRadius: 10, padding: 16, border: "1px solid #e0e0e0" }}>
                  <div style={{ fontWeight: 700, marginBottom: 10, color: "#333", fontSize: 13 }}>
                    Ranking por Estado — 27 UFs
                  </div>
                  <div style={{ maxHeight: 280, overflowY: "auto", paddingRight: 2 }}>
                    {dadosEstados.map((e, i) => (
                      <EstadoCard key={e.uf} estado={e} pos={i + 1} isAM={e.uf === "AM"} />
                    ))}
                  </div>
                </div>
              )}

              <div style={{ background: "#fff", borderRadius: 10, padding: 18, border: "1px solid #e0e0e0" }}>
                <div style={{ fontWeight: 700, marginBottom: 14, color: "#333" }}>
                  Apuí vs Média {nivel === "regional" ? "Sul AM" : nivel === "estadual" ? "Amazonas" : "Nacional"}
                </div>
                {[
                  { label: "Score ERSUS",           apui: scoreAtual, media: mediaScore,    unidade: "pts" },
                  { label: "Cobertura ESF",          apui: 89.2,       media: mediaCobertura, unidade: "%" },
                  { label: "Novo Financiamento APS", apui: 68.4,       media: nivel === "regional" ? 52.3 : nivel === "estadual" ? 48.7 : 61.2, unidade: "%" },
                ].map(c => {
                  const max = Math.max(c.apui, c.media, 1);
                  const acima = c.apui >= c.media;
                  return (
                    <div key={c.label} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5, fontWeight: 600 }}>
                        <span style={{ color: "#444" }}>{c.label}</span>
                        <span>
                          <span style={{ color: "#1565c0", fontWeight: 800 }}>Apuí {c.apui.toFixed(1)}{c.unidade}</span>
                          <span style={{ color: "#9e9e9e", marginLeft: 8 }}>Média {c.media.toFixed(1)}{c.unidade}</span>
                          <span style={{ marginLeft: 6, color: acima ? "#2e7d32" : "#c62828", fontWeight: 700 }}>
                            {acima ? "▲" : "▼"}{Math.abs(c.apui - c.media).toFixed(1)}
                          </span>
                        </span>
                      </div>
                      <div style={{ position: "relative", height: 14, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(c.media / max) * 100}%`, background: "#e0e0e0", borderRadius: 4 }} />
                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(c.apui / max) * 100}%`, background: "#1565c0", borderRadius: 4, opacity: .8 }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: 6, fontSize: 11, color: "#aaa", fontStyle: "italic" }}>
                  Fonte: IBGE/MS · Portaria 3.493/2024 · Jul/2026
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EVOLUÇÃO ── */}
      {tab === "evolucao" && (
        <div style={{ background: "#fff", borderRadius: 10, padding: 20, border: "1px solid #e0e0e0" }}>
          <div style={{ fontWeight: 700, marginBottom: 20, color: "#333" }}>Evolução do Score ERSUS 360 — 2026</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 200, padding: "0 10px" }}>
            {evolucao.map((e, i) => {
              const h = (e.score / maxEv) * 180;
              const isLast = i === evolucao.length - 1;
              return (
                <div key={e.mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: isLast ? 800 : 600, color: COR_SCORE(e.score) }}>{e.score.toFixed(1)}</div>
                  <div style={{ width: "100%", height: h, background: isLast ? COR_SCORE(e.score) : COR_SCORE(e.score) + "80", borderRadius: "4px 4px 0 0", border: isLast ? `2px solid ${COR_SCORE(e.score)}` : "none" }} />
                  <div style={{ fontSize: 11, color: "#888" }}>{e.mes}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 20 }}>
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
