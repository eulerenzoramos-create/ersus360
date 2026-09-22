/**
 * Utilitários de município ativo — ERSUS 360 (multi-tenant)
 *
 * O município ativo é SEMPRE o da sessão, definido pelo backend no login ou na
 * troca auditada (cabeçalho → "Trocar município"). Seletores dentro das telas
 * não trocam mais o município: parâmetros divergentes são recusados pela API.
 */
import { useAuth } from "../App";

export const IBGE_PILOTO = "1300144";

/** Telas verificadas como multi-município (sem dados de Apuí embutidos). */
export const PAGINAS_MULTIMUNICIPIO = ["/", "/usuarios", "/documentos", "/alertas"];

export function paginaDisponivel(pathname: string, ibge: string): boolean {
  if (ibge === IBGE_PILOTO) return true;
  return PAGINAS_MULTIMUNICIPIO.some(p => pathname === p || (p !== "/" && pathname.startsWith(p + "/")));
}

/** Retorna o IBGE do município da sessão para as chamadas de API. */
export function useMunicipioAtivo() {
  const auth = useAuth();
  return {
    ibge: auth.municipio_ibge,
    municipio: auth.municipio,
    podeSelecionar: false,
  };
}

/** Mantido por compatibilidade com as telas: sem troca local de município. */
export function useMunicipioSeletor() {
  const auth = useAuth();
  return {
    ibge: auth.municipio_ibge,
    setIbge: (_novoIbge: string) => { /* troca só pelo cabeçalho (auditada) */ },
    podeSelecionar: false,
  };
}
