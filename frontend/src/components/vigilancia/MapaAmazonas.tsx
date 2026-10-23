/**
 * Mapa coroplético dos 62 municípios do Amazonas desenhado em SVG a partir da malha oficial do IBGE
 * (API de malhas v3, via /api/vigilancia-fvs/malha). Sem mapa de fundo de terceiros.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../../lib/api";
import { COR, FVS_API, fmt, fmtPct } from "../../lib/vigilanciaFvs";
import { RAMPA } from "./Graficos";
import { Vazio } from "./FvsBase";

export interface ValorMapa { ibge6: string; nome: string; valor: number | null; texto?: string | null; taxa_100mil?: number | null;
  ano_anterior?: number | null; variacao_pct?: number | null }

type Anel = number[][];
function aneis(geom: any): Anel[] {
  if (!geom) return [];
  if (geom.type === "Polygon") return geom.coordinates;
  if (geom.type === "MultiPolygon") return geom.coordinates.flat();
  return [];
}

export default function MapaAmazonas({ valores, medida, selecionados, onSelecionar, rotuloMedida }: {
  valores: ValorMapa[]; medida: "valor" | "taxa_100mil" | "variacao_pct"; selecionados: string[];
  onSelecionar: (ibge6: string) => void; rotuloMedida: string;
}) {
  const malha = useQuery({ queryKey: ["fvs-malha"], staleTime: Infinity,
    queryFn: () => apiGet<{ geojson: any; fonte: string }>(`${FVS_API}/malha`) });
  const [foco, setFoco] = useState<ValorMapa | null>(null);
  const porIbge = useMemo(() => Object.fromEntries(valores.map(v => [v.ibge6, v])), [valores]);

  const geo = malha.data?.geojson;
  const desenho = useMemo(() => {
    if (!geo?.features) return null;
    let minX = 180, maxX = -180, minY = 90, maxY = -90;
    for (const f of geo.features) for (const a of aneis(f.geometry)) for (const [x, y] of a) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    const L = 1000, esc = L / (maxX - minX), H = (maxY - minY) * esc;
    const path = (g: any) => aneis(g).map(a => "M" + a.map(([x, y]) => `${((x - minX) * esc).toFixed(1)},${((maxY - y) * esc).toFixed(1)}`).join("L") + "Z").join("");
    return { L, H, formas: geo.features.map((f: any) => ({ ibge6: String(f.properties.codarea).slice(0, 6), d: path(f.geometry) })) };
  }, [geo]);

  const numeros = valores.map(v => v[medida]).filter((x): x is number => typeof x === "number");
  const divergente = medida === "variacao_pct";
  const max = Math.max(0, ...numeros.map(Math.abs));
  // Quebras por quantis (magnitude) — classes iguais em número de municípios com dado
  const quebras = useMemo(() => {
    if (divergente) return [];
    const s = [...numeros].filter(x => x > 0).sort((a, b) => a - b);
    if (!s.length) return [];
    // RAMPA[1..5] = "até" cada quebra; acima da última quebra = RAMPA[6]
    const n = RAMPA.length - 2;
    return Array.from(new Set(Array.from({ length: n }, (_, i) => s[Math.min(s.length - 1, Math.floor(((i + 1) / (n + 1)) * s.length))])));
  }, [numeros, divergente]);

  const cor = (v: number | null | undefined) => {
    if (v === null || v === undefined) return "#f1f5f9";
    if (divergente) {
      if (Math.abs(v) < 5) return "#f0efec";
      const t = Math.min(1, Math.abs(v) / Math.max(max, 1));
      const quente = ["#f9d3c2", "#f2a07f", "#eb6834", "#b8461c"], fria = ["#cde2fb", "#86b6ef", "#3987e5", "#184f95"];
      return (v > 0 ? quente : fria)[Math.min(3, Math.floor(t * 4))];
    }
    if (v === 0) return "#ffffff";
    const i = quebras.findIndex(q => v <= q);
    return i === -1 ? RAMPA[RAMPA.length - 1] : RAMPA[i + 1];
  };

  if (malha.isLoading) return <Vazio>Carregando a malha municipal do IBGE…</Vazio>;
  if (!desenho) return <Vazio>Malha municipal do IBGE indisponível no momento. A tabela ao lado traz os mesmos valores.</Vazio>;

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${desenho.L} ${desenho.H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img"
        aria-label={`Mapa dos municípios do Amazonas — ${rotuloMedida}`}>
        {desenho.formas.map((f: { ibge6: string; d: string }) => {
          const v = porIbge[f.ibge6];
          const sel = selecionados.includes(f.ibge6);
          return (
            <path key={f.ibge6} d={f.d} fill={cor(v?.[medida] as number | null)} stroke={sel ? "#0b0b0b" : "#fcfcfb"} strokeWidth={sel ? 3 : 1.2}
              style={{ cursor: "pointer" }} onClick={() => onSelecionar(f.ibge6)}
              onMouseEnter={() => setFoco(v ?? { ibge6: f.ibge6, nome: f.ibge6, valor: null })} onMouseLeave={() => setFoco(null)}>
              <title>{v ? `${v.nome}: ${v[medida] === null || v[medida] === undefined ? "sem dado" : medida === "variacao_pct" ? fmtPct(v.variacao_pct) : fmt(v[medida] as number, medida === "valor" ? 0 : 1)}` : f.ibge6}</title>
            </path>
          );
        })}
      </svg>
      {foco && (
        <div style={{ position: "absolute", top: 8, left: 8, background: "#fff", border: `1px solid ${COR.borda}`, borderRadius: 8, padding: "6px 9px", fontSize: 12, pointerEvents: "none", boxShadow: "0 2px 6px #0001", color: COR.texto }}>
          <b>{foco.nome}</b><br />
          {rotuloMedida}: <b>{foco[medida] === null || foco[medida] === undefined ? "sem dado" : medida === "variacao_pct" ? fmtPct(foco.variacao_pct) : fmt(foco[medida] as number, medida === "valor" ? 0 : 1)}</b>
          {foco.texto ? <><br />{foco.texto}</> : null}
        </div>
      )}
      <Legenda divergente={divergente} quebras={quebras} medida={medida} />
    </div>
  );
}

function Legenda({ divergente, quebras, medida }: { divergente: boolean; quebras: number[]; medida: string }) {
  const item = (c: string, t: string) => (
    <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 14, height: 10, background: c, border: "1px solid #d6d3d1", borderRadius: 2 }} />{t}</span>
  );
  const casas = medida === "valor" ? 0 : 1;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 11, color: COR.sub, marginTop: 6 }}>
      {item("#f1f5f9", "sem dado")}
      {divergente ? <>{item("#184f95", "queda forte")}{item("#86b6ef", "queda")}{item("#f0efec", "estável (±5%)")}{item("#f2a07f", "aumento")}{item("#b8461c", "aumento forte")}</>
        : <>{item("#ffffff", "zero")}{quebras.map((q, i) => item(RAMPA[i + 1], `até ${fmt(q, casas)}`))}
          {quebras.length > 0 && item(RAMPA[RAMPA.length - 1], `acima de ${fmt(quebras[quebras.length - 1], casas)}`)}</>}
    </div>
  );
}
