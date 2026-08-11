/**
 * Utilitários de município ativo — ERSUS 360
 *
 * Hierarquia de resolução do IBGE ativo:
 *   1. Estado local do seletor (assessoria escolheu um município específico)
 *   2. municipio_ibge do usuário logado (perfil municipal)
 *   3. Fallback "1300144" (Apuí/AM — município piloto)
 */
import { useState, useCallback } from "react";
import { useAuth } from "../App";

export const IBGE_PILOTO = "1300144";
const LS_KEY = "ersus_municipio_ativo";

/** Retorna o IBGE do município que deve ser usado nas chamadas de API. */
export function useMunicipioAtivo() {
  const auth = useAuth();

  // Usuário municipal: sempre o próprio município, sem opção de trocar
  if (!auth.perfis_assessoria && auth.municipio_ibge) {
    return {
      ibge: auth.municipio_ibge,
      municipio: auth.municipio,
      podeSelecionar: false,
    };
  }

  // Assessoria: usa o seletor ou o piloto como padrão
  const ibgeSelecionado = localStorage.getItem(LS_KEY) || IBGE_PILOTO;
  return {
    ibge: ibgeSelecionado,
    municipio: ibgeSelecionado === IBGE_PILOTO ? "Apuí / AM" : ibgeSelecionado,
    podeSelecionar: true,
  };
}

/** Hook com estado reativo para assessoria trocar de município. */
export function useMunicipioSeletor() {
  const auth = useAuth();
  const [ibge, setIbgeState] = useState<string>(
    !auth.perfis_assessoria && auth.municipio_ibge
      ? auth.municipio_ibge
      : (localStorage.getItem(LS_KEY) || IBGE_PILOTO)
  );

  const setIbge = useCallback((novoIbge: string) => {
    localStorage.setItem(LS_KEY, novoIbge);
    setIbgeState(novoIbge);
  }, []);

  return {
    ibge,
    setIbge,
    podeSelecionar: auth.perfis_assessoria,
  };
}
