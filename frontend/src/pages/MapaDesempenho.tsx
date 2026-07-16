// src/pages/MapaDesempenho.tsx — Mapa de Desempenho em Saúde ERSUS 360
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiBI } from "../lib/api";

// ── Helpers ───────────────────────────────────────────────────────────────────
const COR_SCORE = (s: number) =>
  s >= 80 ? "#1b5e20" : s >= 65 ? "#2e7d32" : s >= 50 ? "#f57f17" : s >= 40 ? "#e65100" : "#c62828";
const LABEL_SCORE = (s: number) =>
  s >= 80 ? "Excelente" : s >= 65 ? "Bom" : s >= 50 ? "Regular" : s >= 40 ? "Atenção" : "Crítico";

// ── Dados: Regional (Sul do AM) ───────────────────────────────────────────────
const MUNICIPIOS_REGIONAL = [
  { nome: "Apuí",          ibge: "1300144", score: 72.4, pop: 25043, esf: 3, cobertura: 89.2, uf: "AM" },
  { nome: "Humaitá",       ibge: "1301704", score: 68.1, pop: 45000, esf: 6, cobertura: 78.4, uf: "AM" },
  { nome: "Novo Aripuanã", ibge: "1303304", score: 61.3, pop: 21000, esf: 3, cobertura: 71.2, uf: "AM" },
  { nome: "Manicoré",      ibge: "1302702", score: 58.9, pop: 55000, esf: 7, cobertura: 65.8, uf: "AM" },
  { nome: "Borba",         ibge: "1300805", score: 55.2, pop: 37000, esf: 5, cobertura: 62.1, uf: "AM" },
  { nome: "Tapauá",        ibge: "1304104", score: 49.8, pop: 19000, esf: 2, cobertura: 58.3, uf: "AM" },
  { nome: "Canutama",      ibge: "1300904", score: 47.1, pop: 16000, esf: 2, cobertura: 54.7, uf: "AM" },
];

// ── Dados: Estadual (AM — municípios similares até 80k hab) ──────────────────
const MUNICIPIOS_ESTADUAL = [
  { nome: "Apuí",               ibge: "1300144", score: 72.4, pop: 25043, esf: 3,  cobertura: 89.2, uf: "AM" },
  { nome: "Humaitá",            ibge: "1301704", score: 68.1, pop: 45000, esf: 6,  cobertura: 78.4, uf: "AM" },
  { nome: "Lábrea",             ibge: "1302405", score: 66.8, pop: 42000, esf: 5,  cobertura: 76.1, uf: "AM" },
  { nome: "Tefé",               ibge: "1304203", score: 65.4, pop: 62000, esf: 8,  cobertura: 74.8, uf: "AM" },
  { nome: "Itacoatiara",        ibge: "1301902", score: 63.2, pop: 98000, esf: 12, cobertura: 72.3, uf: "AM" },
  { nome: "Parintins",          ibge: "1303403", score: 62.9, pop: 113000,esf: 14, cobertura: 71.9, uf: "AM" },
  { nome: "Novo Aripuanã",      ibge: "1303304", score: 61.3, pop: 21000, esf: 3,  cobertura: 71.2, uf: "AM" },
  { nome: "São Gabriel da C.",  ibge: "1303809", score: 60.7, pop: 47000, esf: 6,  cobertura: 70.5, uf: "AM" },
  { nome: "Coari",              ibge: "1301209", score: 59.8, pop: 85000, esf: 10, cobertura: 68.9, uf: "AM" },
  { nome: "Manicoré",          ibge: "1302702", score: 58.9, pop: 55000, esf: 7,  cobertura: 65.8, uf: "AM" },
  { nome: "Maués",              ibge: "1302900", score: 57.4, pop: 62000, esf: 8,  cobertura: 64.2, uf: "AM" },
  { nome: "Borba",              ibge: "1300805", score: 55.2, pop: 37000, esf: 5,  cobertura: 62.1, uf: "AM" },
  { nome: "Carauari",           ibge: "1301001", score: 53.8, pop: 29000, esf: 4,  cobertura: 60.7, uf: "AM" },
  { nome: "Barcelos",           ibge: "1300409", score: 52.1, pop: 26000, esf: 3,  cobertura: 59.4, uf: "AM" },
  { nome: "Tapauá",             ibge: "1304104", score: 49.8, pop: 19000, esf: 2,  cobertura: 58.3, uf: "AM" },
  { nome: "Canutama",           ibge: "1300904", score: 47.1, pop: 16000, esf: 2,  cobertura: 54.7, uf: "AM" },
  { nome: "Pauini",             ibge: "1303502", score: 46.3, pop: 18000, esf: 2,  cobertura: 53.1, uf: "AM" },
  { nome: "Jutaí",              ibge: "1302001", score: 44.8, pop: 22000, esf: 3,  cobertura: 51.6, uf: "AM" },
  { nome: "Envira",             ibge: "1301506", score: 43.2, pop: 17000, esf: 2,  cobertura: 49.8, uf: "AM" },
  { nome: "Itamarati",          ibge: "1301951", score: 41.7, pop: 11000, esf: 1,  cobertura: 48.2, uf: "AM" },
  { nome: "Ipixuna",            ibge: "1301803", score: 40.1, pop: 29000, esf: 3,  cobertura: 46.5, uf: "AM" },
  { nome: "Atalaia do Norte",   ibge: "1300300", score: 38.4, pop: 21000, esf: 2,  cobertura: 44.1, uf: "AM" },
];

// ── Dados: Nacional (todos os estados — média municipal APS) ─────────────────
const ESTADOS_BRASIL = [
  { uf: "SC", nome: "Santa Catarina",   score: 78.4, cobertura: 92.1, municipios: 295,  regiao: "Sul" },
  { uf: "RS", nome: "Rio G. do Sul",    score: 75.2, cobertura: 88.7, municipios: 497,  regiao: "Sul" },
  { uf: "PR", nome: "Paraná",           score: 74.1, cobertura: 86.4, municipios: 399,  regiao: "Sul" },
  { uf: "SP", nome: "São Paulo",        score: 72.8, cobertura: 84.2, municipios: 645,  regiao: "Sudeste" },
  { uf: "MG", nome: "Minas Gerais",     score: 70.3, cobertura: 82.9, municipios: 853,  regiao: "Sudeste" },
  { uf: "GO", nome: "Goiás",            score: 68.9, cobertura: 81.3, municipios: 246,  regiao: "Centro-Oeste" },
  { uf: "ES", nome: "Espírito Santo",   score: 67.8, cobertura: 80.1, municipios: 78,   regiao: "Sudeste" },
  { uf: "MT", nome: "Mato Grosso",      score: 66.4, cobertura: 78.6, municipios: 141,  regiao: "Centro-Oeste" },
  { uf: "RJ", nome: "Rio de Janeiro",   score: 65.1, cobertura: 77.4, municipios: 92,   regiao: "Sudeste" },
  { uf: "MS", nome: "Mato G. do Sul",   score: 64.7, cobertura: 76.2, municipios: 79,   regiao: "Centro-Oeste" },
  { uf: "CE", nome: "Ceará",            score: 63.8, cobertura: 74.9, municipios: 184,  regiao: "Nordeste" },
  { uf: "RN", nome: "Rio G. do Norte",  score: 62.4, cobertura: 73.6, municipios: 167,  regiao: "Nordeste" },
  { uf: "PB", nome: "Paraíba",          score: 61.9, cobertura: 72.8, municipios: 223,  regiao: "Nordeste" },
  { uf: "TO", nome: "Tocantins",        score: 61.2, cobertura: 72.1, municipios: 139,  regiao: "Norte" },
  { uf: "RO", nome: "Rondônia",         score: 60.8, cobertura: 71.4, municipios: 52,   regiao: "Norte" },
  { uf: "PE", nome: "Pernambuco",       score: 60.1, cobertura: 70.9, municipios: 185,  regiao: "Nordeste" },
  { uf: "BA", nome: "Bahia",            score: 59.4, cobertura: 70.2, municipios: 417,  regiao: "Nordeste" },
  { uf: "SE", nome: "Sergipe",          score: 58.7, cobertura: 69.5, municipios: 75,   regiao: "Nordeste" },
  { uf: "PI", nome: "Piauí",            score: 57.9, cobertura: 68.8, municipios: 224,  regiao: "Nordeste" },
  { uf: "AL", nome: "Alagoas",          score: 56.4, cobertura: 67.3, municipios: 102,  regiao: "Nordeste" },
  { uf: "DF", nome: "Distrito Federal", score: 55.8, cobertura: 66.1, municipios: 1,    regiao: "Centro-Oeste" },
  { uf: "RR", nome: "Roraima",          score: 54.3, cobertura: 64.7, municipios: 15,   regiao: "Norte" },
  { uf: "AC", nome: "Acre",             score: 53.1, cobertura: 63.2, municipios: 22,   regiao: "Norte" },
  { uf: "MA", nome: "Maranhão",         score: 52.4, cobertura: 62.8, municipios: 217,  regiao: "Nordeste" },
  { uf: "PA", nome: "Pará",             score: 51.8, cobertura: 61.4, municipios: 144,  regiao: "Norte" },
  { uf: "AM", nome: "Amazonas",         score: 50.9, cobertura: 60.3, municipios: 62,   regiao: "Norte" },
  { uf: "AP", nome: "Amapá",            score: 48.2, cobertura: 57.6, municipios: 16,   regiao: "Norte" },
];

// ── Municípios similares Brasil (15k–35k hab, porte semelhante a Apuí) ───────
const MUNICIPIOS_NACIONAIS = [
  { nome: "Apuí",              ibge:"1300144", score: 72.4, pop: 25043, uf:"AM", regiao:"Norte",        cobertura: 89.2 },
  { nome: "Chapecó",           ibge:"4204202", score: 79.8, pop: 23000, uf:"SC", regiao:"Sul",          cobertura: 95.4 },
  { nome: "Horizontina",       ibge:"4308409", score: 78.3, pop: 18000, uf:"RS", regiao:"Sul",          cobertura: 94.1 },
  { nome: "Palmeira das Missões",ibge:"4314001",score:77.1, pop: 34000, uf:"RS", regiao:"Sul",          cobertura: 93.2 },
  { nome: "Rolândia",          ibge:"4122404", score: 76.4, pop: 29000, uf:"PR", regiao:"Sul",          cobertura: 91.8 },
  { nome: "São L. do Paraitinga",ibge:"3549409",score:75.2, pop: 16000, uf:"SP", regiao:"Sudeste",      cobertura: 90.4 },
  { nome: "Lagoa Santa",       ibge:"3137601", score: 74.8, pop: 31000, uf:"MG", regiao:"Sudeste",      cobertura: 89.7 },
  { nome: "Itaberaí",          ibge:"5210406", score: 73.9, pop: 27000, uf:"GO", regiao:"Centro-Oeste", cobertura: 89.3 },
  { nome: "Jataí",             ibge:"5211909", score: 73.2, pop: 33000, uf:"GO", regiao:"Centro-Oeste", cobertura: 88.9 },
  { nome: "Patos de Minas",    ibge:"3148004", score: 72.9, pop: 28000, uf:"MG", regiao:"Sudeste",      cobertura: 88.6 },
  { nome: "Ariquemes",         ibge:"1100023", score: 71.8, pop: 22000, uf:"RO", regiao:"Norte",        cobertura: 87.4 },
  { nome: "Ji-Paraná",         ibge:"1100122", score: 71.2, pop: 30000, uf:"RO", regiao:"Norte",        cobertura: 86.9 },
  { nome: "Palmas",            ibge:"1721000", score: 70.4, pop: 25000, uf:"TO", regiao:"Norte",        cobertura: 86.1 },
  { nome: "Gurupi",            ibge:"1709500", score: 69.8, pop: 20000, uf:"TO", regiao:"Norte",        cobertura: 85.4 },
  { nome: "Sobral",            ibge:"2312908", score: 68.7, pop: 32000, uf:"CE", regiao:"Nordeste",     cobertura: 84.2 },
  { nome: "Quixadá",           ibge:"2311306", score: 67.4, pop: 24000, uf:"CE", regiao:"Nordeste",     cobertura: 83.7 },
  { nome: "Mossoró",           ibge:"2408003", score: 66.9, pop: 26000, uf:"RN", regiao:"Nordeste",     cobertura: 82.4 },
  { nome: "Campina Grande",    ibge:"2504009", score: 65.8, pop: 34000, uf:"PB", regiao:"Nordeste",     cobertura: 81.8 },
  { nome: "Caruaru",           ibge:"2604106", score: 64.3, pop: 28000, uf:"PE", regiao:"Nordeste",     cobertura: 80.6 },
  { nome: "Ilhéus",            ibge:"2913606", score: 62.7, pop: 31000, uf:"BA", regiao:"Nordeste",     cobertura: 78.9 },
  { nome: "Imperatriz",        ibge:"2105302", score: 61.4, pop: 27000, uf:"MA", regiao:"Nordeste",     cobertura: 77.4 },
  { nome: "Santarém",          ibge:"1506807", score: 59.2, pop: 29000, uf:"PA", regiao:"Norte",        cobertura: 74.8 },
  { nome: "Castanhal",         ibge:"1502400", score: 57.8, pop: 23000, uf:"PA", regiao:"Norte",        cobertura: 72.3 },
  { nome: "Marabá",            ibge:"1504208", score: 56.1, pop: 32000, uf:"PA", regiao:"Norte",        cobertura: 70.1 },
  { nome: "Altamira",          ibge:"1500602", score: 54.4, pop: 18000, uf:"PA", regiao:"Norte",        cobertura: 67.8 },
  { nome: "Rio Branco",        ibge:"1200401", score: 52.9, pop: 22000, uf:"AC", regiao:"Norte",        cobertura: 65.4 },
  { nome: "Humaitá",           ibge:"1301704", score: 68.1, pop: 45000, uf:"AM", regiao:"Norte",        cobertura: 78.4 },
  { nome: "Boa Vista",         ibge:"1400100", score: 51.3, pop: 19000, uf:"RR", regiao:"Norte",        cobertura: 63.2 },
  { nome: "Macapá",            ibge:"1600303", score: 48.9, pop: 21000, uf:"AP", regiao:"Norte",        cobertura: 60.7 },
  { nome: "Barcelos",          ibge:"1300409", score: 52.1, pop: 26000, uf:"AM", regiao:"Norte",        cobertura: 59.4 },
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
        <div style={{ height: "100%", width: `${score}%`, background: cor, borderRadius: 5, transition: "width .8s" }} />
      </div>
    </div>
  );
}

function RankCard({ item, pos, isApui, sub }: { item: any; pos: number; isApui?: boolean; sub: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
      background: isApui ? "#e3f2fd" : "#fff",
      borderRadius: 8, border: `1px solid ${isApui ? "#1565c0" : "#e0e0e0"}`,
      marginBottom: 6,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        background: pos === 1 ? "#ffd700" : pos === 2 ? "#c0c0c0" : pos === 3 ? "#cd7f32" : "#f5f5f5",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: 13, color: pos <= 3 ? "#333" : "#9e9e9e",
      }}>{pos}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: isApui ? 700 : 600, fontSize: 13, color: "#333", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {item.nome}
          {isApui && <span style={{ fontSize: 10, color: "#1565c0", fontWeight: 700 }}>◀ você</span>}
          {item.uf && !isApui && <span style={{ fontSize: 10, color: "#888", background: "#f5f5f5", borderRadius: 3, padding: "1px 5px" }}>{item.uf}</span>}
          {item.regiao && <span style={{ fontSize: 10, color: REGIOES_COR[item.regiao] ?? "#888", fontWeight: 600 }}>{item.regiao}</span>}
        </div>
        <div style={{ fontSize: 11, color: "#999", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: COR_SCORE(item.score) }}>{item.score.toFixed(0)}</div>
        <div style={{ fontSize: 9, fontWeight: 700, background: COR_SCORE(item.score) + "18", color: COR_SCORE(item.score), padding: "1px 6px", borderRadius: 3 }}>
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
      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
      background: isAM ? "#e8f5e9" : "#fff",
      borderRadius: 8, border: `1px solid ${isAM ? "#2e7d32" : "#e0e0e0"}`, marginBottom: 6,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        background: pos <= 3 ? ["#ffd700","#c0c0c0","#cd7f32"][pos-1] : "#f5f5f5",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: 12, color: pos <= 3 ? "#333" : "#9e9e9e",
      }}>{pos}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: isAM ? 700 : 600, fontSize: 13, color: "#333" }}>
            {estado.uf}
          </span>
          <span style={{ fontSize: 12, color: "#555" }}>{estado.nome}</span>
          {isAM && <span style={{ fontSize: 10, color: "#2e7d32", fontWeight: 700 }}>◀ seu estado</span>}
          <span style={{ fontSize: 10, color: cor, fontWeight: 600, background: cor + "18", borderRadius: 3, padding: "1px 5px" }}>{estado.regiao}</span>
        </div>
        <div style={{ fontSize: 11, color: "#999", marginTop: 1 }}>
          {estado.municipios} municípios · Cobertura ESF {estado.cobertura}%
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: COR_SCORE(estado.score) }}>{estado.score.toFixed(0)}</div>
        <div style={{ fontSize: 9, fontWeight: 700, background: COR_SCORE(estado.score) + "18", color: COR_SCORE(estado.score), padding: "1px 6px", borderRadius: 3 }}>
          {LABEL_SCORE(estado.score)}
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function MapaDesempenho() {
  const [tab, setTab]     = useState<"dimensoes" | "ranking" | "evolucao">("dimensoes");
  const [nivel, setNivel] = useState<"regional" | "estadual" | "nacional">("regional");
  const [filtroRegiao, setFiltroRegiao] = useState<string>("Todas");
  const [busca, setBusca] = useState("");

  const { data: scoreData } = useQuery({ queryKey: ["bi-score-mapa"], queryFn: apiBI.score });
  const scoreAtual = scoreData?.score_total ?? 72.4;
  const cor = COR_SCORE(scoreAtual);

  // dados do nível selecionado
  const dadosRegional   = [...MUNICIPIOS_REGIONAL].sort((a, b) => b.score - a.score);
  const dadosEstadual   = [...MUNICIPIOS_ESTADUAL].sort((a, b) => b.score - a.score);
  const dadosNacional   = [...MUNICIPIOS_NACIONAIS].sort((a, b) => b.score - a.score);
  const dadosEstados    = [...ESTADOS_BRASIL].sort((a, b) => b.score - a.score);

  const posRegional  = dadosRegional.findIndex(m => m.ibge === "1300144") + 1;
  const posEstadual  = dadosEstadual.findIndex(m => m.ibge === "1300144") + 1;
  const posNacional  = dadosNacional.findIndex(m => m.ibge === "1300144") + 1;
  const posEstado    = dadosEstados.findIndex(e => e.uf === "AM") + 1;

  const evolucao = [
    { mes: "Jan", score: 61.2 }, { mes: "Fev", score: 63.8 },
    { mes: "Mar", score: 65.1 }, { mes: "Abr", score: 67.4 },
    { mes: "Mai", score: 69.3 }, { mes: "Jun", score: 70.8 },
    { mes: "Jul", score: scoreAtual },
  ];
  const maxEv = Math.max(...evolucao.map(e => e.score));

  // KPIs dinâmicos por nível
  const kpiPos    = nivel === "regional" ? posRegional : nivel === "estadual" ? posEstadual : posNacional;
  const kpiTotal  = nivel === "regional" ? MUNICIPIOS_REGIONAL.length : nivel === "estadual" ? MUNICIPIOS_ESTADUAL.length : MUNICIPIOS_NACIONAIS.length;
  const kpiLabel  = nivel === "regional" ? "Ranking Sul/AM" : nivel === "estadual" ? "Ranking AM" : "Ranking Brasil";
  const kpiDesc   = nivel === "regional" ? `de ${kpiTotal} municípios do Sul do AM` : nivel === "estadual" ? `de ${kpiTotal} municípios do AM` : `de ${kpiTotal} municípios similares`;

  // Filtro busca/região
  const regioes = ["Todas", ...Array.from(new Set(MUNICIPIOS_NACIONAIS.map(m => m.regiao).filter(Boolean)))];
  const nacionaisFiltrados = dadosNacional.filter(m =>
    (filtroRegiao === "Todas" || m.regiao === filtroRegiao) &&
    (!busca || m.nome.toLowerCase().includes(busca.toLowerCase()) || m.uf.toLowerCase().includes(busca.toLowerCase()))
  );
  const estadosFiltrados = dadosEstados.filter(e =>
    !busca || e.nome.toLowerCase().includes(busca.toLowerCase()) || e.uf.toLowerCase().includes(busca.toLowerCase())
  );

  const selectorBtn = (v: typeof nivel, label: string) => (
    <button onClick={() => { setNivel(v); setBusca(""); setFiltroRegiao("Todas"); }} style={{
      padding: "6px 16px", borderRadius: 6, border: "1px solid",
      borderColor: nivel === v ? "#1565c0" : "#d1d5db",
      background: nivel === v ? "#1565c0" : "#fff",
      color: nivel === v ? "#fff" : "#374151",
      fontWeight: nivel === v ? 700 : 500, fontSize: 12, cursor: "pointer",
    }}>{label}</button>
  );

  // médias comparativas por nível
  const mediaScore = nivel === "regional"
    ? (dadosRegional.reduce((s, m) => s + m.score, 0) / dadosRegional.length)
    : nivel === "estadual"
    ? (dadosEstadual.reduce((s, m) => s + m.score, 0) / dadosEstadual.length)
    : (dadosNacional.reduce((s, m) => s + m.score, 0) / dadosNacional.length);

  const mediaCobertura = nivel === "regional"
    ? (dadosRegional.reduce((s, m) => s + m.cobertura, 0) / dadosRegional.length)
    : nivel === "estadual"
    ? (dadosEstadual.reduce((s, m) => s + m.cobertura, 0) / dadosEstadual.length)
    : (dadosNacional.reduce((s, m) => s + m.cobertura, 0) / dadosNacional.length);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>

      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1565c0" }}>Mapa de Desempenho em Saúde</h2>
          <p style={{ margin: "4px 0 0", color: "#666", fontSize: 13 }}>
            Apuí/AM (IBGE 1300144) · Score ERSUS 360 · Comparativo {nivel === "regional" ? "Regional" : nivel === "estadual" ? "Estadual" : "Nacional"}
          </p>
        </div>
        {/* Seletor de nível */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 10px" }}>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginRight: 4 }}>NÍVEL:</span>
          {selectorBtn("regional", "🗺️ Regional")}
          {selectorBtn("estadual", "🏛️ Estadual")}
          {selectorBtn("nacional", "🇧🇷 Nacional")}
        </div>
      </div>

      {/* KPIs topo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "#fff", borderRadius: 10, padding: "18px 20px", border: `2px solid ${cor}30`, textAlign: "center" }}>
          <div style={{ fontSize: 42, fontWeight: 900, color: cor, lineHeight: 1 }}>{scoreAtual.toFixed(0)}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: cor, marginTop: 4 }}>{LABEL_SCORE(scoreAtual)}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>Score ERSUS 360</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 10, padding: "18px 20px", border: "1px solid #e0e0e0", textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: "#1565c0" }}>#{kpiPos}</div>
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
        {[
          { key: "dimensoes" as const, label: "Dimensões do Score" },
          { key: "ranking"   as const, label: "Ranking" },
          { key: "evolucao"  as const, label: "Evolução Histórica" },
        ].map(a => (
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
                borderRadius: 6, background: "#fafafa", border: `1px solid ${f.cor}20`, borderLeft: `4px solid ${f.cor}`,
              }}>
                <div style={{ minWidth: 52, fontWeight: 700, color: f.cor, fontSize: 12 }}>{f.faixa}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#333" }}>{f.label}</div>
                  <div style={{ fontSize: 11, color: "#666" }}>{f.desc}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 14, padding: 12, background: `${cor}10`, borderRadius: 8, border: `1px solid ${cor}30` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: cor }}>
                Apuí/AM: {LABEL_SCORE(scoreAtual)} ({scoreAtual.toFixed(1)} pts)
              </div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                Meta 2026: 80 pts (Excelente) · Faltam {Math.max(0, 80 - scoreAtual).toFixed(1)} pontos
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RANKING ── */}
      {tab === "ranking" && (
        <div>
          {/* Busca + filtro região (nacional) */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <input
              placeholder={nivel === "nacional" ? "Buscar município ou UF..." : "Buscar município..."}
              value={busca} onChange={e => setBusca(e.target.value)}
              style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 12px", fontSize: 12, width: 220 }}
            />
            {nivel === "nacional" && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {regioes.map(r => (
                  <button key={r} onClick={() => setFiltroRegiao(r)} style={{
                    padding: "4px 10px", borderRadius: 5, border: "1px solid",
                    borderColor: filtroRegiao === r ? (REGIOES_COR[r] ?? "#1565c0") : "#d1d5db",
                    background: filtroRegiao === r ? (REGIOES_COR[r] ?? "#1565c0") : "#fff",
                    color: filtroRegiao === r ? "#fff" : "#374151",
                    fontWeight: filtroRegiao === r ? 700 : 400, fontSize: 11, cursor: "pointer",
                  }}>{r}</button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Lista ranking */}
            <div>
              {/* REGIONAL */}
              {nivel === "regional" && (
                <>
                  <div style={{ fontWeight: 700, marginBottom: 10, color: "#333", fontSize: 14 }}>
                    Ranking — Municípios do Sul do AM ({dadosRegional.length})
                  </div>
                  <div style={{ maxHeight: 480, overflowY: "auto", paddingRight: 4 }}>
                    {dadosRegional.map((m, i) => (
                      <RankCard key={m.ibge} item={m} pos={i + 1} isApui={m.ibge === "1300144"}
                        sub={`Pop. ${m.pop.toLocaleString("pt-BR")} · ${m.esf} ESF · Cobertura ${m.cobertura}%`} />
                    ))}
                  </div>
                </>
              )}

              {/* ESTADUAL */}
              {nivel === "estadual" && (
                <>
                  <div style={{ fontWeight: 700, marginBottom: 10, color: "#333", fontSize: 14 }}>
                    Ranking — Municípios do Amazonas ({dadosEstadual.length})
                  </div>
                  <div style={{ maxHeight: 520, overflowY: "auto", paddingRight: 4 }}>
                    {dadosEstadual.filter(m =>
                      !busca || m.nome.toLowerCase().includes(busca.toLowerCase())
                    ).map((m, i) => (
                      <RankCard key={m.ibge} item={m} pos={dadosEstadual.indexOf(m) + 1}
                        isApui={m.ibge === "1300144"}
                        sub={`Pop. ${m.pop.toLocaleString("pt-BR")} · ${m.esf} ESF · Cobertura ${m.cobertura}%`} />
                    ))}
                  </div>
                </>
              )}

              {/* NACIONAL — Municípios */}
              {nivel === "nacional" && (
                <>
                  <div style={{ fontWeight: 700, marginBottom: 10, color: "#333", fontSize: 14 }}>
                    Municípios similares — Brasil ({nacionaisFiltrados.length} de {MUNICIPIOS_NACIONAIS.length})
                  </div>
                  <div style={{ maxHeight: 520, overflowY: "auto", paddingRight: 4 }}>
                    {nacionaisFiltrados.map((m) => (
                      <RankCard key={m.ibge} item={m} pos={dadosNacional.indexOf(m) + 1}
                        isApui={m.ibge === "1300144"}
                        sub={`${m.uf} · Pop. ${m.pop.toLocaleString("pt-BR")} · Cobertura ${m.cobertura}%`} />
                    ))}
                    {nacionaisFiltrados.length === 0 && (
                      <div style={{ textAlign: "center", color: "#999", padding: 24 }}>Nenhum município encontrado.</div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Painel direito */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Nacional: ranking de estados */}
              {nivel === "nacional" && (
                <div style={{ background: "#fff", borderRadius: 10, padding: 16, border: "1px solid #e0e0e0" }}>
                  <div style={{ fontWeight: 700, marginBottom: 10, color: "#333", fontSize: 13 }}>
                    Ranking — Todos os Estados ({ESTADOS_BRASIL.length})
                  </div>
                  <div style={{ maxHeight: 300, overflowY: "auto", paddingRight: 2 }}>
                    {estadosFiltrados.map((e, i) => (
                      <EstadoCard key={e.uf} estado={e} pos={dadosEstados.indexOf(e) + 1} isAM={e.uf === "AM"} />
                    ))}
                  </div>
                </div>
              )}

              {/* Comparativo médias */}
              <div style={{ background: "#fff", borderRadius: 10, padding: 18, border: "1px solid #e0e0e0" }}>
                <div style={{ fontWeight: 700, marginBottom: 14, color: "#333" }}>
                  Apuí vs Média {nivel === "regional" ? "Regional" : nivel === "estadual" ? "Estadual (AM)" : "Nacional"}
                </div>
                {[
                  { label: "Score ERSUS",         apui: scoreAtual,   media: mediaScore,    unidade: "pts" },
                  { label: "Cobertura ESF",        apui: 89.2,         media: mediaCobertura, unidade: "%" },
                  { label: "Novo Financiamento APS",apui: 68.4,        media: nivel === "regional" ? 52.3 : nivel === "estadual" ? 48.7 : 61.2, unidade: "%" },
                  { label: "Equipes ESF/10k hab",  apui: 1.20,        media: nivel === "regional" ? 0.92 : nivel === "estadual" ? 0.78 : 1.05, unidade: "" },
                ].map(c => {
                  const max = Math.max(c.apui, c.media);
                  const pctApui = (c.apui / max) * 100;
                  const pctMedia = (c.media / max) * 100;
                  const acima = c.apui >= c.media;
                  return (
                    <div key={c.label} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5, fontWeight: 600 }}>
                        <span style={{ color: "#444" }}>{c.label}</span>
                        <span>
                          <span style={{ color: "#1565c0", fontWeight: 800 }}>Apuí: {c.apui.toFixed(1)}{c.unidade}</span>
                          <span style={{ color: "#9e9e9e", marginLeft: 8 }}>Média: {c.media.toFixed(1)}{c.unidade}</span>
                          <span style={{ marginLeft: 6, color: acima ? "#2e7d32" : "#c62828", fontWeight: 700 }}>
                            {acima ? "▲" : "▼"}{Math.abs(c.apui - c.media).toFixed(1)}
                          </span>
                        </span>
                      </div>
                      <div style={{ position: "relative", height: 16, background: "#f0f0f0", borderRadius: 4 }}>
                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pctMedia}%`, background: "#e0e0e0", borderRadius: 4 }} />
                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pctApui}%`, background: "#1565c0", borderRadius: 4, opacity: .85 }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: 8, fontSize: 11, color: "#888", fontStyle: "italic" }}>
                  Fonte: IBGE/MS · Portaria 3.493/2024 · Competência Jul/2026
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
                  <div style={{
                    width: "100%", height: h,
                    background: isLast ? COR_SCORE(e.score) : COR_SCORE(e.score) + "80",
                    borderRadius: "4px 4px 0 0", transition: "height .5s",
                    border: isLast ? `2px solid ${COR_SCORE(e.score)}` : "none",
                  }} />
                  <div style={{ fontSize: 11, color: "#888" }}>{e.mes}</div>
                </div>
              );
            })}
          </div>

          {/* Linha de meta */}
          <div style={{ margin: "16px 0 8px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: "#e0e0e0", borderTop: "2px dashed #f57f17" }} />
            <span style={{ fontSize: 11, color: "#f57f17", fontWeight: 700, whiteSpace: "nowrap" }}>Meta 80 pts</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
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
