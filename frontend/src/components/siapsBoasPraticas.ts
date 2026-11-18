/**
 * Boas práticas de cada indicador do Componente Qualidade, como a tela "Resultado" do SIAPS
 * (área logada, Visão por Competência) mostra: colunas A–K, quadro Pontuação, Boas Práticas e NM/DN.
 * Textos copiados da própria tela do SIAPS em 17/11/2026 (fonte oficial: fichas técnicas do MS).
 *
 * Colunas:
 *  - "letras": uma coluna por boa prática (A, B, C…) = variável QTBP<letra> da API do SIAPS;
 *  - "cancer": NM.x / DN.x / PONTUAÇÃO x por boa prática = QTBP<x> / DNBP<x> / SCOREBP<x>;
 *  - "nenhuma": só NM, DN e Pontuação (ex.: Mais Acesso).
 */
export type BoaPratica = { letra: string; texto: string; pontos?: string };
export type FichaSiaps = {
  colunas: "letras" | "cancer" | "nenhuma";
  boas: BoaPratica[];
  nm: string;
  dn: string;
  faixas?: [string, string][];   // [classificação, faixa] na ordem Regular → Ótimo
};

const FAIXAS_PADRAO: [string, string][] = [["Regular", "0 a 25"], ["Suficiente", ">25 e <=50"], ["Bom", ">50 e <=75"], ["Ótimo", ">75 a 100"]];

const INFANTIL: FichaSiaps = {
  colunas: "letras", faixas: FAIXAS_PADRAO,
  boas: [
    { letra: "A", texto: "Ter a 1ª consulta presencial realizada por médica(o) ou enfermeira(o), até o 30º dia de vida", pontos: "20 pontos / por pessoa" },
    { letra: "B", texto: "Ter pelo menos 09 (nove) consultas presenciais ou remotas realizadas por médica (o) ou enfermeira(o) até dois anos de vida", pontos: "20 pontos / por pessoa" },
    { letra: "C", texto: "Ter pelo menos 09 (nove) registros simultâneos de peso e altura até os dois anos de vida", pontos: "20 pontos / por pessoa" },
    { letra: "D", texto: "Ter pelo menos 02 (duas) visitas domiciliares realizadas por ACS/TACS, sendo a primeira até os primeiros 30 (trinta) dias de vida e a segunda até os 06 (seis) meses de vida", pontos: "20 pontos / por pessoa" },
    { letra: "E", texto: "Ter vacinas contra difteria, tétano, coqueluche, hepatite B, infecções causadas por Haemophilus influenzae tipo b, poliomielite, sarampo, caxumba e rubéola, pneumocócica, registradas com todas as doses recomendadas", pontos: "20 pontos / por pessoa" },
  ],
  nm: "Somatório das boas práticas pontuadas para cada criança com até 02 (dois) anos de vida durante o acompanhamento do desenvolvimento infantil.",
  dn: "Nº total de crianças com até 02 (dois) anos de vida vinculadas à equipe no período",
};

const GESTACAO: FichaSiaps = {
  colunas: "letras", faixas: FAIXAS_PADRAO,
  boas: [
    { letra: "A", texto: "Ter a 1ª consulta presencial ou remota realizada por médica(o) ou enfermeira(o), até a 12ª semana de gestação.", pontos: "10 pontos / por pessoa" },
    { letra: "B", texto: "Ter pelo menos 07 (sete) consultas presenciais ou remotas realizadas por médica(o) ou enfermeira(o) durante o período da gestação.", pontos: "9 pontos / por pessoa" },
    { letra: "C", texto: "Ter pelo menos 07 (sete) registro de aferição de pressão arterial realizados durante o período da gestação.", pontos: "9 pontos / por pessoa" },
    { letra: "D", texto: "Ter pelo menos 07 (sete) registros simultâneos de peso e altura durante o período da gestação.", pontos: "9 pontos / por pessoa" },
    { letra: "E", texto: "Ter pelo menos 03 (três) visitas domiciliares realizadas por ACS/TACS, após a primeira consulta do pré-natal.", pontos: "9 pontos / por pessoa" },
    { letra: "F", texto: "Ter vacina acelular contra difteria, tétano, coqueluche (dTpa) registrada a partir da 20ª semana de cada gestação.", pontos: "9 pontos / por pessoa" },
    { letra: "G", texto: "Ter registro dos testes rápidos ou dos exames avaliados para sífilis, HIV e hepatites B e C realizados no 1º trimestre de cada gestação.", pontos: "9 pontos / por pessoa" },
    { letra: "H", texto: "Ter registro dos testes rápidos ou dos exames avaliados para sífilis e HIV realizados no 3º trimestre de cada gestação.", pontos: "9 pontos / por pessoa" },
    { letra: "I", texto: "Ter pelo menos 01 registro de consulta presencial ou remota realizada por médica(o) ou enfermeira(o) durante o puerpério.", pontos: "9 pontos / por pessoa" },
    { letra: "J", texto: "Ter pelo menos 01 visita domiciliar realizada por ACS/TACS durante o puerpério.", pontos: "9 pontos / por pessoa" },
    { letra: "K", texto: "Ter pelo menos 01 atividade em saúde bucal realizada por cirurgiã(ão) dentista ou técnica(o) de saúde bucal durante o período da gestação.", pontos: "9 pontos / por pessoa" },
  ],
  nm: "Somatório das boas práticas pontuadas para a pessoa gestante e puérpera, durante cada gestação",
  dn: "Nº total de gestantes e puérperas vinculadas à equipe no período.",
};

const DIABETES: FichaSiaps = {
  colunas: "letras", faixas: FAIXAS_PADRAO,
  boas: [
    { letra: "A", texto: "Ter pelo menos 01 (uma) consulta presencial ou remota realizadas por médica(o) ou enfermeira(o), nos últimos 06 (seis) meses", pontos: "20 pontos / por pessoa" },
    { letra: "B", texto: "Ter pelo menos 01 (um) registro de aferição de pressão arterial realizado nos últimos 06 (seis) meses", pontos: "15 pontos / por pessoa" },
    { letra: "C", texto: "Ter pelo menos 01 (um) registro simultâneos de peso e altura realizado nos últimos 12 (doze) meses", pontos: "15 pontos / por pessoa" },
    { letra: "D", texto: "Ter pelo menos 02 (duas) visitas domiciliares realizadas por ACS/TACS, com intervalo mínimo de 30 (trinta) dias, nos últimos 12 (doze) meses", pontos: "20 pontos / por pessoa" },
    { letra: "E", texto: "Ter pelo menos 01 (um) registro de solicitação de hemoglobina glicada realizada ou avaliada, nos últimos 12 (doze) meses", pontos: "15 pontos / por pessoa" },
    { letra: "F", texto: "Ter pelo menos 01 (uma) avaliação dos pés realizada nos últimos 12 (doze) meses", pontos: "15 pontos / por pessoa" },
  ],
  nm: "Somatório das boas práticas pontuadas para a pessoa com diabetes no período",
  dn: "Nº total de pessoas com diabetes vinculadas à equipe no período",
};

const HIPERTENSAO: FichaSiaps = {
  colunas: "letras", faixas: FAIXAS_PADRAO,
  boas: [
    { letra: "A", texto: "Ter pelo menos 01 (uma) consulta presencial ou remota realizadas por médica(o) ou enfermeira(o), nos últimos 06 (seis) meses", pontos: "25 pontos / por pessoa" },
    { letra: "B", texto: "Ter pelo menos 01 (um) registro de aferição de pressão arterial realizado nos últimos 06 (seis) meses", pontos: "25 pontos / por pessoa" },
    { letra: "C", texto: "Ter pelo menos 01 (um) registro simultâneos de peso e altura realizado nos últimos 12 (doze) meses", pontos: "25 pontos / por pessoa" },
    { letra: "D", texto: "Ter pelo menos 02 (duas) visitas domiciliares realizadas por ACS/TACS, com intervalo mínimo de 30 (trinta) dias, nos últimos 12 (doze) meses", pontos: "25 pontos / por pessoa" },
  ],
  nm: "Somatório das boas práticas pontuadas para a pessoa com hipertensão no período",
  dn: "Nº total de pessoas com hipertensão vinculadas à equipe no período",
};

const IDOSA: FichaSiaps = {
  colunas: "letras", faixas: FAIXAS_PADRAO,
  boas: [
    { letra: "A", texto: "Ter registro de pelo menos 01 consulta presencial ou remota por profissional médica(o) ou enfermeira(o) realizada nos últimos 12 meses", pontos: "25 pontos / por pessoa" },
    { letra: "B", texto: "Ter realizado pelo menos 01 (um) registro simultâneo (no mesmo dia) de peso e altura para avaliação antropométrica nos últimos 12 meses", pontos: "25 pontos / por pessoa" },
    { letra: "C", texto: "Ter registro de pelo menos 02 visitas domiciliares por ACS/TACS, com intervalo mínimo de 30 dias, realizadas nos últimos 12 meses", pontos: "25 pontos / por pessoa" },
    { letra: "D", texto: "Ter registro de 1 dose da vacina contra influenza realizada nos últimos 12 meses", pontos: "25 pontos / por pessoa" },
  ],
  nm: "Somatório de boas práticas realizadas para pessoas idosas vinculadas à equipe",
  dn: "Número total de pessoas idosas vinculadas à equipe",
};

const CANCER: FichaSiaps = {
  colunas: "cancer", faixas: FAIXAS_PADRAO,
  boas: [
    { letra: "A", texto: "Ter pelo menos 01 (um) exame de rastreamento para câncer do colo do útero em mulheres entre 25 e 64 anos de idade, coletado, solicitado ou avaliado nos últimos 36 meses. DN.A: total de mulheres entre 25 e 64 anos.", pontos: "20 pontos / por pessoa" },
    { letra: "B", texto: "Ter pelo menos 01 (uma) dose da vacina HPV para crianças e adolescentes do sexo feminino de 09 a 14 anos de idade. DN.B: total de crianças e adolescentes do sexo feminino de 09 a 14 anos.", pontos: "30 pontos / por pessoa" },
    { letra: "C", texto: "Ter pelo menos 01 (um) atendimento presencial ou remoto, para adolescentes do sexo feminino e mulheres entre 14 e 69 anos de idade, sobre atenção à saúde sexual e reprodutiva, realizado nos últimos 12 meses. DN.C: total de mulheres entre 14 e 69 anos.", pontos: "30 pontos / por pessoa" },
    { letra: "D", texto: "Ter registro de pelo menos 01 (um) exame de rastreamento para câncer de mama em mulheres entre 50 e 69 anos de idade, solicitado ou avaliado nos últimos 24 meses. DN.D: total de mulheres entre 50 e 69 anos.", pontos: "20 pontos / por pessoa" },
  ],
  nm: "NM.x: pessoas com a boa prática x registrada · PONTUAÇÃO x = NM.x / DN.x",
  dn: "DN.x: total de pessoas do público da boa prática x vinculadas à equipe",
};

const FAIXAS_MAIS_ACESSO: [string, string][] = [["Regular", "<=10 ou >70"], ["Suficiente", ">10 e <=30"], ["Bom", ">30 e <=50"], ["Ótimo", ">50 e <=70"]];

const MAIS_ACESSO: FichaSiaps = {
  colunas: "nenhuma", boas: [], faixas: FAIXAS_MAIS_ACESSO,
  nm: "Número total de atendimentos por demanda programada",
  dn: "Número total de atendimentos por todos os tipos de demandas (espontâneas e programadas)",
};
/** Fichas sem boas práticas por letra (Saúde Bucal, eMulti): só NM, DN e Pontuação, com faixa própria. */
const simples = (nm: string, dn: string, faixas: [string, string][]): FichaSiaps => ({ colunas: "nenhuma", boas: [], nm, dn, faixas });
const fx = (r: string, s: string, b: string, o: string): [string, string][] => [["Regular", r], ["Suficiente", s], ["Bom", b], ["Ótimo", o]];

// Saúde Bucal (eSB) — SIAPS componentes/qualidade/BUCAL/111–116 (faixas exatamente como a tela mostra)
const B1 = simples("Nº total de pessoas com primeira consulta odontológica programática realizadas pela eSB",
  "Nº total de pessoas vinculadas à eSF/eAP da eSB de referência", fx("<= 0.25", "> 0.25 e <= 0.75", "> 0.75 e <= 1.25", "> 1.25"));
const B2 = simples("Nº total de pessoas com tratamento odontológico concluído pela eSB",
  "Nº total de pessoas com primeira consulta odontológica programática realizadas pela eSB", fx("<= 25", "> 25 e <= 50", "> 50 e <= 75", "> 75 a 100"));
const B3 = simples("Nº total de exodontias realizadas pelo cirurgião-dentista da eSB",
  "Nº total de procedimentos individuais preventivos, curativos e exodontias realizadas pelo cirurgião-dentista da eSB", fx("< 3 e >= 14", ">= 12 e < 14", "> 10 e < 12", ">= 3 e < 10"));
const B4 = simples("Nº total de crianças de 6 a 12 anos participantes da ação coletiva de escovação dental supervisionada realizada pela eSB",
  "Nº total de crianças de 6 a 12 anos vinculadas à eSF/eAP de referência da eSB", fx("<= 0.25", "> 0.25 e <= 0.5", "> 0.5 e <= 1", "> 1"));
const B5 = simples("Nº total de procedimentos odontológicos preventivos individuais",
  "Nº total de procedimentos odontológicos individuais realizados", fx("< 40 e > 85", ">= 40 e < 55", ">= 55 e < 65", ">= 65 e <= 85"));
const B6 = simples("Nº total de procedimentos “Tratamento Restaurador Atraumático” realizados pela eSB",
  "Nº total de procedimentos restauradores realizados pela eSB", fx("<= 3", "> 3 e <= 6", "> 6 e <= 8", "> 8"));

// eMulti — SIAPS componentes/qualidade/EMULT/117–118
const M1 = simples("Número de atendimentos individuais e coletivos realizados", "Número total de pessoas atendidas",
  fx("<= 1", "> 1 e <= 2", "> 2 e <= 3", "> 3"));
const M2 = simples("Número de ações compartilhadas realizadas pela eMulti", "Número de ações realizadas pela eMulti",
  fx("<= 1", "> 1 e <= 2.5", "> 2.5 e <= 5", "> 5"));

// Saúde da Família Ribeirinha (eSFR) — SIAPS componentes/qualidade/eSFR/131–136 (boas práticas próprias)
const R1: FichaSiaps = {
  colunas: "nenhuma", boas: [], faixas: FAIXAS_MAIS_ACESSO,
  nm: "Nº total de atendimentos na eSFR por demanda programada (consulta agendada programada; cuidado continuado; e consulta agendada)",
  dn: "Nº total de atendimentos na eSFR por todos os tipos de demandas (espontâneas e programadas)",
};
const R2: FichaSiaps = {
  colunas: "letras", faixas: FAIXAS_PADRAO,
  boas: [
    { letra: "A", texto: "Ter pelo menos 06 (seis) consultas presenciais ou remotas realizadas por médica(o) ou enfermeira(o) até dois anos de vida", pontos: "25 pontos / por pessoa" },
    { letra: "B", texto: "Ter pelo menos 06 (seis) registros simultâneos de peso e altura até os dois anos de vida", pontos: "25 pontos / por pessoa" },
    { letra: "C", texto: "Ter pelo menos 06 (seis) visitas domiciliares realizadas por ACS/TACS, sendo a primeira até os primeiros 30 (trinta) dias de vida e a segunda até os 06 (seis) meses de vida", pontos: "25 pontos / por pessoa" },
    { letra: "D", texto: "Ter vacinas contra difteria, tétano, coqueluche, hepatite B, infecções causadas por Haemophilus influenzae tipo b, poliomielite, sarampo, caxumba e rubéola, pneumocócica, registradas com todas as doses recomendadas", pontos: "25 pontos / por pessoa" },
  ],
  nm: "Somatório das boas práticas pontuadas para cada criança com até 02 (dois) anos de vida durante o acompanhamento do desenvolvimento infantil",
  dn: "Nº total de crianças com até 02 (dois) anos de vida, cadastradas à equipe no período",
};
const R3: FichaSiaps = {
  colunas: "letras", faixas: FAIXAS_PADRAO,
  boas: [
    { letra: "A", texto: "Ter pelo menos 05 (cinco) consultas presenciais ou remotas realizadas por médica(o) ou enfermeira(o) durante o período da gestação", pontos: "15 pontos / por pessoa" },
    { letra: "B", texto: "Ter pelo menos 05 (cinco) registros de aferição de pressão arterial realizados durante o período da gestação", pontos: "10 pontos / por pessoa" },
    { letra: "C", texto: "Ter pelo menos 05 (cinco) registros simultâneos de peso e altura durante o período da gestação", pontos: "10 pontos / por pessoa" },
    { letra: "D", texto: "Ter pelo menos 03 (três) visitas domiciliares realizadas por ACS/TACS, com intervalo mínimo de 30 dias após a primeira consulta", pontos: "10 pontos / por pessoa" },
    { letra: "E", texto: "Ter registro dos testes rápidos ou dos exames avaliados para sífilis, HIV e hepatites B e C realizados no 1º trimestre de cada gestação", pontos: "10 pontos / por pessoa" },
    { letra: "F", texto: "Ter registro dos testes rápidos ou dos exames avaliados para sífilis e HIV realizados no 3º trimestre de cada gestação", pontos: "10 pontos / por pessoa" },
    { letra: "G", texto: "Ter pelo menos 01 registro de consulta presencial ou remota realizada por médica(o) ou enfermeira(o) durante o puerpério", pontos: "10 pontos / por pessoa" },
    { letra: "H", texto: "Ter pelo menos o registro de 01 visita domiciliar realizada por ACS/TACS durante o puerpério", pontos: "10 pontos / por pessoa" },
    { letra: "I", texto: "Ter pelo menos 01 avaliação odontológica realizada por cirurgiã(ão) dentista durante o período da gestação", pontos: "10 pontos / por pessoa" },
  ],
  nm: "Somatório das boas práticas pontuadas para pessoas em processo gestacional e puerperal, durante cada gestação",
  dn: "Nº total de pessoas em processo gestacional e puerperal cadastradas na equipe no período",
};
const R4: FichaSiaps = {
  colunas: "letras", faixas: FAIXAS_PADRAO,
  boas: [
    { letra: "A", texto: "Ter pelo menos 01 (uma) consulta presencial ou remota realizadas por médica(o) ou enfermeira(o), nos últimos 06 (seis) meses", pontos: "20 pontos / por pessoa" },
    { letra: "B", texto: "Ter pelo menos 01 (um) registro de aferição de pressão arterial realizado nos últimos 06 (seis) meses", pontos: "15 pontos / por pessoa" },
    { letra: "C", texto: "Ter pelo menos 01 (um) registro simultâneos de peso e altura realizado nos últimos 12 (doze) meses", pontos: "20 pontos / por pessoa" },
    { letra: "D", texto: "Ter pelo menos 02 (duas) visitas domiciliares realizadas por ACS/TACS, com intervalo mínimo de 30 (trinta) dias, nos últimos 12 (doze) meses", pontos: "15 pontos / por pessoa" },
    { letra: "E", texto: "Ter pelo menos 01 (um) registro de hemoglobina glicada solicitada ou avaliada, nos últimos 12 (doze) meses", pontos: "15 pontos / por pessoa" },
    { letra: "F", texto: "Ter pelo menos 01 (uma) avaliação dos pés realizada nos últimos 12 (doze) meses", pontos: "15 pontos / por pessoa" },
  ],
  nm: "Somatório das boas práticas pontuadas para a pessoa com diabetes no período",
  dn: "Nº total de pessoas com diabetes cadastradas à equipe no período",
};
const R5: FichaSiaps = { ...HIPERTENSAO, dn: "Nº total de pessoas com hipertensão cadastradas à equipe no período" };
const R6: FichaSiaps = {
  colunas: "letras", faixas: FAIXAS_PADRAO,
  boas: [
    { letra: "A", texto: "Ter pelo menos 01 (um) exame de rastreamento para câncer do colo do útero em mulheres entre 25 e 64 anos de idade, coletado, solicitado ou avaliado nos últimos 36 meses", pontos: "50 pontos / por pessoa" },
    { letra: "B", texto: "Ter pelo menos 01 (uma) dose da vacina HPV para crianças e adolescentes do sexo feminino de 09 a 14 anos de idade", pontos: "50 pontos / por pessoa" },
  ],
  nm: "Somatório da boa prática pontuada para cada mulher na faixa etária avaliada na boa prática",
  dn: "Nº total de mulheres na faixa etária avaliada na boa prática e vinculadas à equipe no período",
};

/** Fichas por código do indicador no ERSUS360 (C = eSF/eAP, B = eSB, M = eMulti, R = eSFR), conferidas
 * na tela do SIAPS em 17/11/2026. Indicador sem ficha usa as colunas que a captura trouxer (QTBP<letra>). */
export const FICHAS_SIAPS: Record<string, FichaSiaps> = {
  C1: MAIS_ACESSO, C2: INFANTIL, C3: GESTACAO, C4: DIABETES, C5: HIPERTENSAO, C6: IDOSA, C7: CANCER,
  B1, B2, B3, B4, B5, B6, M1, M2, R1, R2, R3, R4, R5, R6,
};

export type ColunaVar = { rotulo: string; chave: string; tipo: "int" | "pont" };

/** Colunas extras da tabela (entre "Equipe" e "NM"), na ordem da tela do SIAPS. */
export function colunasDoIndicador(codigo: string, linhas: { variaveis?: Record<string, unknown> | null }[]): ColunaVar[] {
  const ficha = FICHAS_SIAPS[codigo];
  const chaves = new Set<string>();
  linhas.forEach(l => Object.keys(l.variaveis ?? {}).forEach(k => chaves.add(k)));
  const cancer = ficha?.colunas === "cancer" || (!ficha && chaves.has("DNBPA"));
  if (cancer) {
    const letras = ficha ? ficha.boas.map(b => b.letra)
      : [..."ABCDEFGHIJK"].filter(l => chaves.has(`QTBP${l}`) || chaves.has(`DNBP${l}`));
    return letras.flatMap(l => [
      { rotulo: `NM.${l}`, chave: `QTBP${l}`, tipo: "int" as const },
      { rotulo: `DN.${l}`, chave: `DNBP${l}`, tipo: "int" as const },
      { rotulo: `Pontuação ${l}`, chave: `SCOREBP${l}`, tipo: "pont" as const },
    ]);
  }
  if (ficha?.colunas === "nenhuma") return [];
  const letras = ficha ? ficha.boas.map(b => b.letra) : [..."ABCDEFGHIJK"].filter(l => chaves.has(`QTBP${l}`));
  return letras.map(l => ({ rotulo: l, chave: `QTBP${l}`, tipo: "int" as const }));
}
