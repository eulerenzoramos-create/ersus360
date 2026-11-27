// O gov.br não permite login automático pelo servidor. O navegador do usuário, já logado
// no InvestSUS em outra aba, consulta a API oficial e envia os dados ao ERSUS360.
export const INVESTSUS_API = "https://investsus-backend-prd.saude.gov.br/api";

export function cabecalhosInvestSUS(contexto: string): Record<string, string> {
  return {
    "content-type": "application/json",
    "accept": "application/json, text/plain, */*",
    "cz-aphrodite-de-peixes": "DIREME",
    "cz-milo-de-escopiao": "ENTPUBLICAFNS",
    "cz-mu-de-aries": contexto,
  };
}

async function _get(caminho: string, contexto: string): Promise<any> {
  let r: Response;
  try {
    r = await fetch(`${INVESTSUS_API}${caminho}`, { credentials: "include", headers: cabecalhosInvestSUS(contexto) });
  } catch {
    throw new Error("SEM_SESSAO");
  }
  if (r.status === 401 || r.status === 403) throw new Error("SEM_SESSAO");
  if (!r.ok) throw new Error(`O InvestSUS respondeu com erro ${r.status}. Tente de novo em alguns minutos.`);
  try { return await r.json(); } catch { throw new Error("SEM_SESSAO"); }
}

export type TipoLimiteCapturado = { id: any; descricao: string; linhas: any[] };

/** Tela "Limites" do InvestSUS: todos os tipos de limite do exercício (8 em 2026),
 *  com as linhas de cada um (Limite · Valor Indicado · Limite a Indicar). */
export async function capturarLimites(cnpj: string, contexto: string, ano: number,
                                      onProgresso?: (m: string) => void): Promise<TipoLimiteCapturado[]> {
  onProgresso?.("Lendo os tipos de limite do InvestSUS…");
  const tipos: any[] = (await _get("/corporativo/entidades/tipo-limites", contexto)) ?? [];
  const out: TipoLimiteCapturado[] = [];
  let i = 0;
  for (const t of tipos) {
    i++;
    if (t?.id == null) continue;
    onProgresso?.(`Lendo os limites de ${ano} no InvestSUS… ${i}/${tipos.length}`);
    const linhas = await _get(`/corporativo/entidades/${cnpj}/limites?ano=${ano}&tipoTeto=${encodeURIComponent(t.id)}`, contexto);
    out.push({ id: t.id, descricao: String(t.descricao ?? ""), linhas: Array.isArray(linhas) ? linhas : [] });
  }
  return out;
}
