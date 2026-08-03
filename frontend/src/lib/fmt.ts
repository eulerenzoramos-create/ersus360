// src/lib/fmt.ts — Formatador monetário único · padrão pt-BR completo (sem K / M / B)
// Usar SEMPRE esta função para exibir valores financeiros em toda a aplicação.

/** Valor monetário completo em reais: R$ 1.850.000,00 */
export const BRL = (v: number | null | undefined): string => {
  if (v == null || (typeof v === "number" && isNaN(v))) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v as number);
};

/** Rótulo de eixo Y em gráficos — número sem prefixo R$ e sem centavos: 1.850.000 */
export const BRL_AXIS = (v: number): string =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(v);

/** Tooltip de gráficos — mesmo que BRL mas retorna [valor_formatado, nome] */
export const BRL_TT = (v: number, name?: string): [string, string] =>
  [BRL(v), name ?? ""];

/** Percentual com n casas decimais */
export const PCT = (v: number | null | undefined, decimals = 2): string =>
  v == null || (typeof v === "number" && isNaN(v))
    ? "—"
    : `${(v as number).toFixed(decimals).replace(".", ",")}%`;
