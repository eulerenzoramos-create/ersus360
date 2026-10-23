/**
 * Vigilância em Saúde — dados públicos da FVS-RCP/AM (backend: /api/vigilancia-fvs).
 * Dado estadual público: qualquer município do AM pode ser consultado/comparado; o município
 * da sessão é só o ponto de partida (não há troca de sessão aqui).
 */
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./api";

export const FVS_API = "/api/vigilancia-fvs";

/** Identificador neutro da subaba (backend) → rota da tela no ERSUS360. */
export const SUBABA_ROTA: Record<string, string> = {
  painel: "/vigilancia-saude",
  arboviroses: "/arboviroses",
  ccih: "/ccih",
  vetores: "/vetores",
  epidemiologia: "/epidemiologia",
  ist_hiv: "/ist-hiv",
  malaria: "/malaria-apui",
  monitor: "/monitor-epidemiologico",
  cancer: "/cancer-rastreio",
  vacinas: "/sala-vacinas",
  sim_sinasc: "/sim-sinasc",
  sisvan: "/sisvan",
  tb_hanseniase: "/tb-hanseniase",
  vigiagua: "/vigiagua",
  visa: "/visa",
  zoonoses: "/zoonoses-apui",
};

export interface MunicipioFvs { ibge6: string; ibge7: string; nome: string; regiao_saude: string | null }

export interface EstadoFonte {
  fonte: string; rotulo: string; situacao: string; ultima_sincronizacao: string | null;
  publicado_na_fonte: string | null; data_referencia: string | null; registros?: number | null;
  erro?: string | null; painel_url?: string; pagina_oficial?: string;
}

export interface PainelFvs {
  id: string; ver_painel: number | null; grupo: string; titulo: string; descricao: string;
  plataforma: "tableau" | "powerbi"; integracao: "extracao" | "incorporado" | "bloqueado_lgpd";
  embed: string; subabas: string[]; nota?: string; coletor?: string;
}

export interface LinhaSerie {
  indicador: string; ibge6: string; ano: number; periodo_tipo: string; periodo: number;
  recorte: string; recorte_valor: string; valor: number | null; numerador: number | null;
  denominador: number | null; meta: string | null; alcance: string | null; texto: string | null;
}

export const IBGE_AM = "130000";

export function ibge6(ibge?: string | null) {
  return (ibge || "").replace(/\D/g, "").slice(0, 6);
}

export function fmt(v: number | null | undefined, casas = 0) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

export function fmtPct(v: number | null | undefined) {
  if (v === null || v === undefined) return "—";
  return `${v > 0 ? "+" : ""}${fmt(v, 1)}%`;
}

export function dataHora(iso?: string | null) {
  if (!iso) return "—";
  // o backend grava em UTC sem fuso
  const d = new Date(iso.endsWith("Z") || iso.includes("+") ? iso : iso + "Z");
  return d.toLocaleString("pt-BR", { timeZone: "America/Manaus", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function useMunicipiosFvs() {
  return useQuery({
    queryKey: ["fvs-municipios"],
    queryFn: () => apiGet<{ municipios: MunicipioFvs[]; regioes: string[]; fonte: string }>(`${FVS_API}/municipios`),
    staleTime: 60 * 60 * 1000,
  });
}

export function useCatalogoFvs() {
  return useQuery({
    queryKey: ["fvs-catalogo"],
    queryFn: () => apiGet<{ paineis: PainelFvs[]; subabas: Record<string, string>; sem_fonte_fvs: Record<string, string>; pagina_oficial: string }>(`${FVS_API}/catalogo`),
    staleTime: 60 * 60 * 1000,
  });
}

export const COR = {
  primaria: "#0f766e", primariaClara: "#ccfbf1", texto: "#0f172a", sub: "#475569", borda: "#e2e8f0",
  fundo: "#f8fafc", alto: "#b91c1c", medio: "#b45309", baixo: "#475569", oficial: "#1d4ed8", calculado: "#7c3aed",
};

export const ROTULO_RECORTE: Record<string, string> = {
  sexo: "Sexo", faixa_etaria: "Faixa etária", zona: "Zona de residência", raca_cor: "Raça/cor",
  parasita: "Espécie parasitária", dose: "Dose", virus: "Vírus",
};
