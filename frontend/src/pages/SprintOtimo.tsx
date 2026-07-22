// src/pages/SprintOtimo.tsx — Sprint ÓTIMO Q2 Mai–Ago/2026
import { useState, useEffect } from "react";
import { Trophy, Target, Zap, CheckSquare, Square, TrendingUp, AlertTriangle, Clock, Users, UserCheck, ShieldAlert, FileText } from "lucide-react";

// ── Dados das equipes ──────────────────────────────────────────────────────
// Fonte: SIAPS · Nota Final Componente de Qualidade · Q1/2026 (dados preliminares)
// pts = Nota Final × 10  |  meta ≥ 75 = Ótimo (Nota ≥ 7,5 · Portaria GM/MS 3.493/2024)
// ESB Q1/26: ACARI 9.0 · TRES ESTADOS 8.5 · CACHOEIRA 8.5 · SAO SEBASTIAO 8.0 · KENNEDY 7.5
//            LIBERDADE 6.5 · JUMA 6.5 · ESTRADA NOVA 6.25 · AREAL 6.0 · JK: ausente
// AREAL pts 60 = ESB Q1/26 (6.0 × 10) — eSF ausente no SIAPS Q1/26, ESB confirmada
// eMulti Q1/26: EMULTI ANIZIO 7.0 (Bom)
const EQUIPES = [
  { nome: "ACARI",        pts: 95.0, meta: 75, risco: "baixo", ganho: 0,   cor: "#22c55e" },
  { nome: "KENNEDY",      pts: 87.5, meta: 75, risco: "baixo", ganho: 0,   cor: "#22c55e" },
  { nome: "JK",           pts: 87.5, meta: 75, risco: "baixo", ganho: 0,   cor: "#22c55e" },
  { nome: "LIBERDADE",    pts: 87.5, meta: 75, risco: "baixo", ganho: 0,   cor: "#22c55e" },
  { nome: "SÃO SEBASTIÃO",pts: 87.5, meta: 75, risco: "baixo", ganho: 0,   cor: "#22c55e" },
  { nome: "CACHOEIRA",    pts: 82.5, meta: 75, risco: "baixo", ganho: 0,   cor: "#22c55e" },
  { nome: "JUMA",         pts: 82.5, meta: 75, risco: "baixo", ganho: 0,   cor: "#22c55e" },
  { nome: "ESTRADA NOVA", pts: 80.0, meta: 75, risco: "baixo", ganho: 0,   cor: "#22c55e" },
  { nome: "TRÊS ESTADOS", pts: 80.0, meta: 75, risco: "baixo", ganho: 0,   cor: "#22c55e" },
  { nome: "AREAL",        pts: 60,   meta: 75, risco: "atencao", ganho: 15, cor: "#f59e0b" },
];

// ── Indicadores por equipe ──────────────────────────────────────────────────
const INDICADORES: Record<string, {ind: string; desc: string; atual: number; meta: number; pts: number; acao: string}[]> = {
  "KENNEDY": [
    { ind:"C5", desc:"HAS controlada", atual:66, meta:70, pts:1, acao:"Lançar PA na próxima consulta" },
  ],
  "JK": [
    { ind:"C2", desc:"Pré-natal adequado", atual:30, meta:60, pts:5, acao:"HbA1c+VDRL na 1ª consulta; registrar no PEC" },
    { ind:"C6", desc:"Puericultura", atual:50, meta:70, pts:3, acao:"Agenda de puericultura 2x/semana" },
    { ind:"C1", desc:"Acesso avaliado", atual:55, meta:70, pts:1, acao:"Retorno 30 dias no PEC" },
  ],
  "ACARI": [
    { ind:"C2", desc:"Pré-natal adequado", atual:28, meta:60, pts:5, acao:"HbA1c+VDRL na 1ª consulta; corrigir tipo atendimento PEC" },
    { ind:"C6", desc:"Puericultura", atual:45, meta:70, pts:3, acao:"Busca ativa crianças <2 anos — lista ao ACS" },
    { ind:"B1", desc:"Primeira consulta odont.", atual:40, meta:60, pts:2, acao:"Dia D citopatológico + odonto integrado" },
  ],
  "JUMA": [
    { ind:"C2", desc:"Pré-natal adequado", atual:20, meta:60, pts:7, acao:"INE JUMA separado do LIBERDADE — corrigir CNES" },
    { ind:"C6", desc:"Puericultura", atual:40, meta:70, pts:4, acao:"Busca ativa ACS — caderneta vacinal" },
    { ind:"C5", desc:"HAS controlada", atual:60, meta:70, pts:2, acao:"Técnico lança PA em todo atendimento" },
    { ind:"C1", desc:"Acesso avaliado", atual:50, meta:70, pts:2, acao:"Retorno agendado no PEC após cada consulta" },
  ],
  "ESTRADA NOVA": [
    { ind:"C2", desc:"Pré-natal adequado", atual:18, meta:60, pts:7, acao:"Digitalizar fichas CDS + corrigir tipo atendimento" },
    { ind:"C6", desc:"Puericultura", atual:38, meta:70, pts:4, acao:"Agenda puericultura semanal + busca ativa ACS" },
    { ind:"C5", desc:"HAS controlada", atual:58, meta:70, pts:2, acao:"Técnico lança PA sistematicamente" },
    { ind:"B2", desc:"Conclusão trat. odont.", atual:35, meta:55, pts:3, acao:"Finalizar tratamentos em andamento no PEC" },
  ],
  "LIBERDADE": [
    { ind:"C2", desc:"Pré-natal adequado", atual:22, meta:60, pts:7, acao:"INE LIBERDADE separado do JUMA — corrigir CNES urgente" },
    { ind:"C6", desc:"Puericultura", atual:35, meta:70, pts:4, acao:"Busca ativa + consultas 2x/semana" },
    { ind:"C5", desc:"HAS controlada", atual:62, meta:70, pts:2, acao:"Protocolo PA em todas as consultas" },
    { ind:"C1", desc:"Acesso avaliado", atual:48, meta:70, pts:2, acao:"Classificar retorno no PEC corretamente" },
  ],
  "SÃO SEBASTIÃO": [
    { ind:"C2", desc:"Pré-natal adequado", atual:25, meta:60, pts:7, acao:"INE SÃO SEBASTIÃO separado do ACARI — corrigir CNES" },
    { ind:"C6", desc:"Puericultura", atual:38, meta:70, pts:4, acao:"Criar agenda dedicada puericultura" },
    { ind:"C5", desc:"HAS controlada", atual:60, meta:70, pts:2, acao:"Lançar PA de todos os hipertensos cadastrados" },
    { ind:"B1", desc:"Primeira consulta odont.", atual:30, meta:60, pts:3, acao:"Agenda odonto + busca ativa" },
    { ind:"C1", desc:"Acesso avaliado", atual:45, meta:70, pts:3, acao:"Retorno 30 dias registrado no PEC" },
  ],
  "CACHOEIRA": [
    { ind:"C2", desc:"Pré-natal adequado", atual:15, meta:60, pts:8, acao:"Digitalizar fichas CDS das expedições ribeirinhas" },
    { ind:"C6", desc:"Puericultura", atual:30, meta:70, pts:5, acao:"Puericultura em todas as expedições + busca ativa" },
    { ind:"C5", desc:"HAS controlada", atual:55, meta:70, pts:3, acao:"Técnico lança PA; revisar cadastros HAS no PEC" },
    { ind:"C1", desc:"Acesso avaliado", atual:42, meta:70, pts:3, acao:"Retorno registrado mesmo em expedições" },
    { ind:"B1", desc:"Primeira consulta odont.", atual:25, meta:60, pts:3, acao:"eOE integrada nas expedições" },
  ],
  "TRÊS ESTADOS": [
    { ind:"CNES", desc:"CNES expirado — BLOQUEIO TOTAL", atual:0, meta:100, pts:15, acao:"🚨 RH/SMS: reativar vínculos médico + ACS no SCNES HOJE" },
    { ind:"C2", desc:"Pré-natal adequado", atual:10, meta:60, pts:8, acao:"Após CNES corrigido: HbA1c+VDRL retroativos" },
    { ind:"C6", desc:"Puericultura", atual:25, meta:70, pts:4, acao:"Retomar agenda após reativação do CNES" },
    { ind:"C5", desc:"HAS controlada", atual:50, meta:70, pts:3, acao:"Técnico lança PA em todos os atendimentos" },
    { ind:"C1", desc:"Acesso avaliado", atual:40, meta:70, pts:1, acao:"Registrar retorno no PEC" },
  ],
  "AREAL": [
    { ind:"CNES", desc:"Status CNES — verificar no e-Gestor", atual:0, meta:100, pts:0, acao:"🔍 Confirmar equipe ativa no e-Gestor e SCNES (CNES 2013290)" },
    { ind:"SIAPS", desc:"Produção no SIAPS — levantar histórico", atual:0, meta:100, pts:0, acao:"🔍 Acessar SIAPS e verificar se há produção lançada para esta equipe" },
    { ind:"COMP", desc:"Composição — confirmar profissionais vinculados", atual:0, meta:100, pts:0, acao:"🔍 Levantar médico, enfermeiro, técnico e ACS no SCNES 07/2026" },
  ],
};

// ── Checklist ─────────────────────────────────────────────────────────────
const CHECKLIST = [
  { id:"c1",  frente:"Sistema",    texto:"CNES TRÊS ESTADOS reativado — médico + ACS com vínculos ativos no SCNES" },
  { id:"c2",  frente:"Sistema",    texto:"Atendimento anônimo desabilitado em todos os PEC (Admin → Configurações)" },
  { id:"c3",  frente:"Sistema",    texto:"INE vinculado no Anízio Ferreira — ACARI e SÃO SEBASTIÃO com INE separados" },
  { id:"c4",  frente:"Sistema",    texto:"INE vinculado no Curumim — JUMA e LIBERDADE com INE separados" },
  { id:"c5",  frente:"Sistema",    texto:"Produção \"sem equipe\" auditada no e-Gestor — profissionais sem INE identificados" },
  { id:"c6",  frente:"Clínica",    texto:"Treinamento puericultura realizado com todos os médicos e enfermeiros" },
  { id:"c7",  frente:"Clínica",    texto:"Técnicos de enfermagem lançando PA no PEC desde hoje" },
  { id:"c8",  frente:"Clínica",    texto:"Protocolo pré-natal fixado nos consultórios (HbA1c + VDRL na 1ª consulta)" },
  { id:"c9",  frente:"Clínica",    texto:"Agenda puericultura criada em cada UBS (mínimo 2 turnos/semana)" },
  { id:"c10", frente:"Clínica",    texto:"Dia D citopatológico agendado para semana 3/agosto" },
  { id:"c11", frente:"ACS",        texto:"Lista crianças <2 anos sem puericultura extraída do PEC e entregue aos ACS" },
  { id:"c12", frente:"ACS",        texto:"Lista gestantes sem HbA1c/VDRL extraída e busca ativa iniciada" },
  { id:"c13", frente:"ACS",        texto:"Caderneta vacinal verificada em toda visita domiciliar de agosto" },
  { id:"c14", frente:"ACS",        texto:"Visita técnica TRÊS ESTADOS realizada pela coordenação APS" },
  { id:"c15", frente:"Retroativo", texto:"Mutirão resultados de gaveta — HbA1c/VDRL retroativos lançados no PEC" },
  { id:"c16", frente:"Retroativo", texto:"Fichas CDS ribeirinho de junho e julho digitalizadas" },
  { id:"c17", frente:"Fechamento", texto:"Monitoramento semanal e-Gestor iniciado — toda segunda-feira" },
  { id:"c18", frente:"Fechamento", texto:"Contato suporte e-Gestor se TRÊS ESTADOS não aparecer (0800 722 4310)" },
  { id:"c19", frente:"Fechamento", texto:"Confirmação final — score de todas as equipes conferido até 15/agosto" },
  { id:"c20", frente:"Sistema",    texto:"AREAL — confirmar status no e-Gestor e SIAPS (SCNES 2013290 / UBS Eduardo Biazin)" },
];

const FRENTE_COR: Record<string,string> = {
  "Sistema":    "#ef4444",
  "Clínica":    "#f59e0b",
  "ACS":        "#f59e0b",
  "Retroativo": "#3b82f6",
  "Fechamento": "#3b82f6",
};

// ── Dados de Diagnóstico de Composição ────────────────────────────────────
// Fonte oficial: SCNES · Protocolo de Exportação DATASUS · Competência 07/2026 · Gerado 20/07/2026
// Parâmetro Apuí: município 20.001–50.000 hab → ref. 2.500 vínculos/eSF, máx 3.750
const DIAGNOSTICO = [
  {
    nome: "KENNEDY",
    ubs: "UBS Padre Faliero Bonci",        // SCNES 07/2026 — CNES 2013304
    cnesUbs: "2013304",
    ine: "0000007056",
    cnesCodEquipe: "0001",
    tipo: "eSF",
    esb: true,
    cnesStatus: "regular",
    medico:    { nome: "THELCIA KELLY COELHO OLIVEIRA",  cbo: "225142", cnes: "700105961007816", vinculo: "40h — entrada 01/08/2025" },
    enfermeiro:{ nome: "FRANCISCO DE ASSIS FERREIRA",    cbo: "223565", cnes: "701206059359818", vinculo: "40h — entrada 01/10/2025" },
    tecEnf:    { nome: "MARCIELAINE ESPERANCA",          cbo: "322245", cnes: "705408414437798", vinculo: "40h — entrada 03/06/2024" },
    // ACS (7): ELIANE ROSA ANGELO, ELIZANGELA DE ALMEIDA MACHADO, ERIVELTON SILVA RIGOR,
    //          GERIVALDO ANICACIO DE AZEVEDO, JOSINEA DIAS, REINALDO DIAS DA SILVA, TIAGO BERNARDINO DE OLIVEIRA
    // Outros: MARIZETE DE OLIVEIRA DOS SANTOS (microscopista 5152A1) · ODAIR JOSE DIAS DA SILVA (ACE 515140)
    acs: 7, acsMin: 4,
    populacaoVinculada: 761,
    populacaoRef: 2500,
    populacaoMax: 3750,
    pendencias: [
      "⚠ SIAPS ABR/26: apenas 761 vinculadas (30% da referência 2.500) — verificar cadastros no PEC e microáreas dos ACS",
      "⚠ ESB KENNEDY (INE 0001773984) — nota Q1/26 exatamente 7.5 (limite Bom/Ótimo) — qualquer queda em Q2/26 perde a classificação Ótimo",
    ],
    obs: "SCNES 07/2026: composição regular (médico, enfermeiro, técnico, 7 ACS). SIAPS Q1/26 ESF: 8.75 (Ótimo). ESB Q1/26: 7.5 — exatamente no limite Bom/Ótimo (>7.5 = Ótimo). Monitorar produção odontológica Q2/26. SIAPS ABR/26: 761 vinculadas (30% da ref. 2.500) — priorizar cadastros no PEC.",
  },
  {
    nome: "JK",
    ubs: "UBS Pedro Alexandre Santos da Silva", // SCNES 07/2026 — CNES 4184688 (ATIVO)
    cnesUbs: "4184688",                          // ⚠️ CNES 3324915 (UBS JK) está INATIVO no SCNES
    ine: "0002323613",
    cnesCodEquipe: "0012",
    tipo: "eSF",
    esb: true,
    cnesStatus: "regular",
    medico:    { nome: "LUCIANE MATTES",                 cbo: "225142", cnes: "700508587440756", vinculo: "40h — entrada 01/04/2026" },
    enfermeiro:{ nome: "CRISTIANA FEITOSA DE SOUZA",     cbo: "223565", cnes: "700208908597924", vinculo: "40h — entrada 01/09/2025" },
    tecEnf:    { nome: "JAMILLY LOUREIRO DE SOUSA",      cbo: "322245", cnes: "708207195886741", vinculo: "40h — entrada 19/11/2025" },
    // ACS (6): CAMILA PEREIRA CASSIMIRO DE LIMA, FRANCIELE DA COSTA RODRIGUES, LAUDICEIA LEMOS VIEIRA,
    //          RAIANE OLIVEIRA DA SILVA, SUELI DE SOUZA CAETANO, VALQUIRIA DA SILVA
    // Outros: REJANE DE SOUZA SANTOS (2º téc.enf. 322245) · JESSICA DE PAIVA OLIVEIRA (recep.) · DEBORA SILVA LOPES SINGER (ACE)
    acs: 6, acsMin: 4,
    populacaoVinculada: 1497,
    populacaoRef: 2500,
    populacaoMax: 3750,
    pendencias: [
      "⚠ CNES 3324915 (UBS JK) consta INATIVO no SCNES — confirmar que todos os vínculos estão no CNES 4184688",
      "🚨 ESB JK ausente do SIAPS Q1/26 — equipe ESB ativada em 06/06/2023 no SCNES mas sem Nota Final Q1/26. Verificar produção odontológica lançada e reconhecimento no e-Gestor",
      "⚠ MARIA ANTONIA MIRANDA BARROS (CBO 322205 — Técnico de Enfermagem genérico) na equipe. CBO correto para ESF é 322245. Regularizar no SCNES 4184688",
    ],
    obs: "SCNES 07/2026: médico LUCIANE MATTES (desde 01/04/2026), enfermeira CRISTIANA FEITOSA (desde 01/09/2025), 2 técnicos ESF (322245), 6 ACS. SIAPS Q1/26 ESF: 8.75 (Ótimo). INCONSISTÊNCIA: MARIA ANTONIA MIRANDA BARROS cadastrada com CBO 322205 (genérico) — deve ser 322245 (ESF). ESB ausente do SIAPS Q1/26 apesar de ativada em 06/06/2023 — verificar se há produção lançada.",
  },
  {
    nome: "ACARI",
    ubs: "UBS Anízio Ferreira da Silva",   // SCNES 07/2026 — CNES 2013312
    cnesUbs: "2013312",
    ine: "0000007064",
    cnesCodEquipe: "0005",
    tipo: "eSF",
    esb: true,
    cnesStatus: "regular",
    medico:    { nome: "ABRAAO LUCAS DE SOUZA",          cbo: "225142", cnes: "700801464816589", vinculo: "40h — entrada 01/04/2026" },
    enfermeiro:{ nome: "JESSIE ESTEVAM",                 cbo: "223565", cnes: "704600195034726", vinculo: "40h — entrada 03/06/2024" },
    tecEnf:    { nome: "EDVAN DA SILVA SOUZA",           cbo: "322245", cnes: "705005632475951", vinculo: "40h — entrada 23/04/2025" },
    // ACS (8): ALCI DA CONCEICAO ALVES, CLEUZINETE DIAS DE SOUZA, JANEDE ROCHA NEVES, LUCICLEIDE LEITE DA SILVA,
    //          MAILDA DAS CHAGAS WIZNIAKI, SANDRA CRISTINA DEBONA, SONIA PRIM TICIANI, VALDEMIRES GOMES DA SILVA
    // Outros: PATRICIA DA CONCEICAO ALVES (microscopista 5152A1) · BETAMES PEREIRA DE SOUZA (ACE)
    //         LEILA PEREIRA DE ALCANTARA (2º téc. 322245) · VALTER MANOEL DA GLORIA PINHEIRO (3º téc. 322245)
    acs: 8, acsMin: 3,
    populacaoVinculada: 1611,
    populacaoRef: 2500,
    populacaoMax: 3750,
    pendencias: [],
    obs: "Mesma UBS que SÃO SEBASTIÃO (CNES 2013312). INE próprio confirmado: 0000007064. SIAPS ABR/26: 1.611 vinculadas (cadastro 1.639) — 64% da referência. Monitorar crescimento; verificar microárea descoberta.",
  },
  {
    nome: "JUMA",
    ubs: "Centro de Saúde Curumim",        // SCNES 07/2026 — CNES 3697983
    cnesUbs: "3697983",
    ine: "0000007080",
    cnesCodEquipe: "0014",
    tipo: "eSF",
    esb: true,
    cnesStatus: "regular",
    medico:    { nome: "LUCELIA GUSMAO DOS SANTOS DA COSTA", cbo: "225142", cnes: "700006758560206", vinculo: "40h — entrada 29/08/2025" },
    enfermeiro:{ nome: "ELOAINE GARCIA FERREIRA",            cbo: "223565", cnes: "703007869323372", vinculo: "40h — entrada 01/08/2025" },
    tecEnf:    { nome: "CRIS LOHANA THEOBALD DA SILVA",      cbo: "322245", cnes: "704605667721521", vinculo: "40h — entrada 03/06/2024" },
    // ACS (7): ANDREIA CRISTINA VIEIRA ARRUDA, DANELIA DE QUADROS, MARCILENE DA SILVA SALOMAO,
    //          MARITANIA ROSSI VIANA, MARLI DE QUADROS, RAIMUNDA HELENA SANTAREM DA ROCHA, ROSEMEIRE BERNARDINO DE OLIVEIRA
    // Outros: EDICARLOS PEREIRA COSTA (ACE 515140)
    acs: 7, acsMin: 3,
    populacaoVinculada: 1732,
    populacaoRef: 2500,
    populacaoMax: 3750,
    pendencias: [],
    obs: "Mesma UBS que LIBERDADE (CNES 3697983 — Centro de Saúde Curumim). INE próprio confirmado: 0000007080. Fichas CDS das expedições devem ser digitalizadas mensalmente.",
  },
  {
    nome: "ESTRADA NOVA",
    ubs: "UBS Claudia Pereira dos Santos Damacena", // SCNES 07/2026 — CNES 9942122
    cnesUbs: "9942122",
    ine: "0001690426",
    cnesCodEquipe: "0009",
    tipo: "eSF",
    esb: true,
    cnesStatus: "regular",
    medico:    { nome: "CLAUDENICE NUNES",               cbo: "225142", cnes: "708602548606184", vinculo: "40h — entrada 01/12/2025" },
    enfermeiro:{ nome: "INGRYD LIMA KISCHENER",          cbo: "223565", cnes: "707402056110170", vinculo: "40h — entrada 07/07/2025" },
    tecEnf:    { nome: "RUDINEI SIMONETTI",              cbo: "322250", cnes: "706204085033060", vinculo: "40h — entrada 10/01/2023" },
    // ACS (6): CLAUDIO DA SILVA MEDEIROS, EDILENE SOUZA DE ALMEIDA ARAUJO, JUELITA LOPES DOS SANTOS,
    //          MARCINEY BARBOSA MARTINS, SIMONI PEREIRA DE SOUZA, VADEILTO DE SOUZA LIMA
    // Outros: ANTONIO CARLOS DA COSTA (ACE) · SUELY CANIVAROLLI (ACE) · NEIDE DE OLIVEIRA (limpeza)
    // ⚠ Sem Técnico de Enfermagem ESF (CBO 322245) — RUDINEI é Auxiliar de Enf. ESF (322250)
    acs: 6, acsMin: 3,
    populacaoVinculada: 806,
    populacaoRef: 2500,
    populacaoMax: 3750,
    pendencias: [
      "🚨 RUDINEI SIMONETTI cadastrado com CBO 322250 (Auxiliar de Enfermagem ESF) — composição mínima ESF exige CBO 322245 (Técnico de Enfermagem ESF). Regularizar no SCNES 9942122 IMEDIATAMENTE — risco de não reconhecimento da equipe",
      "⚠ SIAPS ABR/26: apenas 806 vinculadas (32% da referência 2.500) — fortalecer cadastros no PEC",
    ],
    obs: "SCNES 07/2026: INCONSISTÊNCIA CRÍTICA — RUDINEI SIMONETTI registrado como CBO 322250 (Auxiliar de Enfermagem ESF), não como CBO 322245 (Técnico de Enfermagem ESF). A composição mínima da eSF exige Técnico (322245), não Auxiliar (322250). Solicitar à gestão atualizar o CBO no SCNES ou contratar profissional com CBO 322245. SIAPS Q1/26 ESF: 8.0 (Ótimo). SIAPS ABR/26: 806 vinculadas (32% da ref. 2.500) — cobertura muito baixa.",
  },
  {
    nome: "LIBERDADE",
    ubs: "Centro de Saúde Curumim",        // SCNES 07/2026 — CNES 3697983
    cnesUbs: "3697983",
    ine: "0000007099",
    cnesCodEquipe: "0011",
    tipo: "eSF",
    esb: true,
    cnesStatus: "regular",
    medico:    { nome: "BEATRIZ DOS SANTOS MANFRE",      cbo: "225142", cnes: "701404662555735", vinculo: "40h — entrada 01/08/2025" },
    enfermeiro:{ nome: "MARIANDIA MARTINS DO CARMO",     cbo: "223565", cnes: "700207441505529", vinculo: "40h — entrada 03/06/2024" },
    tecEnf:    { nome: "IVANA DE CASTRO SILIPRANDI",     cbo: "322245", cnes: "700906949177794", vinculo: "40h — entrada 02/01/2025" },
    // ACS (7): CELINA CORREIA DOS SANTOS, CRISTIANE ROSSI NASCIMENTO CORREA, DIANA COCO INACIO,
    //          JEFFERSON GOMES DE CAMARGO, MARIA DA GLORIA DE JESUS COSTA GUIMARAES, NILZA ROCHA VICENTE, SELMA CRISTINA GONCALVES
    // Outros: CRISTIANE SARAH DOS SANTOS GUIDO (microscopista 5152A1) · ROSILENE MARTINUSSO (ACE)
    acs: 7, acsMin: 3,
    populacaoVinculada: 1784,
    populacaoRef: 2500,
    populacaoMax: 3750,
    pendencias: [],
    obs: "SCNES 07/2026: médica BEATRIZ DOS SANTOS MANFRE (225142), enfermeira MARIANDIA MARTINS DO CARMO (223565), técnica IVANA DE CASTRO SILIPRANDI (322245), 7 ACS. Mesma UBS que JUMA (CNES 3697983). SIAPS Q1/26 ESF: 8.75 (Ótimo) · ESB: 6.5 (Bom — fortalecer produção odontológica Q2/26). SIAPS ABR/26: 1.784 vinculadas (71% da ref. 2.500).",
  },
  {
    nome: "SÃO SEBASTIÃO",
    ubs: "UBS Anízio Ferreira da Silva",   // SCNES 07/2026 — CNES 2013312
    cnesUbs: "2013312",
    ine: "0001536974",
    cnesCodEquipe: "0004",
    tipo: "eSF",
    esb: true,
    cnesStatus: "regular",
    medico:    { nome: "ESTEPHANIE BASILIO DE SOUZA",    cbo: "225142", cnes: "702301163700213", vinculo: "40h — entrada 28/08/2025" },
    enfermeiro:{ nome: "WILLIANE WESSLING",              cbo: "223565", cnes: "701702271921070", vinculo: "40h — entrada 01/08/2025" },
    tecEnf:    { nome: "JOAB PINTO RAMOS",               cbo: "322245", cnes: "706505392759296", vinculo: "40h — entrada 01/04/2025" },
    // ACS (8): BRUNO VINICIUS SILVA JAGUSZESKI, CLARI TEREZINHA FREITAG DE FRANCA, EVANDRO MACHADO SIMONETTI,
    //          GERCI BATISTA PEREIRA, JOSIELLEM SILVA MONTELES, LILIAN OLIVEIRA ANZILEIRO,
    //          TATIANE CORREA DOS SANTOS, VANELSA RODRIGUES DE ALMEIDA PADOVANI
    // Outros: WANDERLEY RIBEIRO TORRES (ACE 515140)
    acs: 8, acsMin: 3,
    populacaoVinculada: 1585,
    populacaoRef: 2500,
    populacaoMax: 3750,
    pendencias: [],
    obs: "SCNES 07/2026: médico ESTEPHANIE BASILIO DE SOUZA (225142), enfermeira WILLIANE WESSLING (223565), técnico JOAB PINTO RAMOS (322245), 8 ACS. Mesma UBS que ACARI (CNES 2013312) — equipes distintas com médicos diferentes. SIAPS Q1/26 ESF: 8.75 (Ótimo) · ESB Q1/26: 8.0 (Ótimo).",
  },
  {
    nome: "CACHOEIRA",
    ubs: "UBS Irmã Elizabete",             // SCNES 07/2026 — CNES 3320138
    cnesUbs: "3320138",
    ine: "0000007072",
    cnesCodEquipe: "0010",
    tipo: "eSF",                            // SIAPS ABR/26 confirma eSF com parâmetro 2500 — eRibeirinha pendente de confirmação
    esb: true,
    cnesStatus: "regular",
    medico:    { nome: "ROBSON GARCIA DA ROSA",          cbo: "225142", cnes: "702900505239771", vinculo: "40h — entrada 07/06/2023" },
    enfermeiro:{ nome: "BRUNA ROZELLA PEREIRA",          cbo: "223565", cnes: "700108900220717", vinculo: "40h — entrada 03/06/2024" },
    tecEnf:    { nome: "KAROLAINE MOREIRA DE SOUZA",     cbo: "322245", cnes: "705608431768215", vinculo: "40h — entrada 01/04/2025" },
    // ACS (6): DHEINIFA FREITAS SILVA, IDNA APARECIDA GONCALVES DE OLIVEIRA, KAROLLI RAFAELA DOS SANTOS MENDES,
    //          MARIZETE DE FATIMA SILVA DO AMARAL, RENATO JOSE MARIOTTI, ROSELI MARTINELLI
    // Outros: ZELIA MINERVINA DE PAULA SILVA (2º téc.enf. 322245) · ELILDA DIAS HISTER (aux.enf. 322230)
    //         JEFFERSON MENEZES DA SILVA (ACE) · ANAILDE FERREIRA DA SILVA (admin.) · MARISETE MACHADO (recep.)
    acs: 6, acsMin: 2,
    populacaoVinculada: 1552,
    populacaoRef: 2500,
    populacaoMax: 3750,
    pendencias: [
      "🔍 Confirmar modalidade: SIAPS ABR/26 registra como eSF (parâmetro 2.500); operação é ribeirinha — verificar cofinanciamento no e-Gestor",
      "⚠ ELILDA DIAS HISTER (CBO 322230 — Auxiliar de Enfermagem genérico) na equipe desde 01/09/2009 — vínculo legado. CBO 322230 não é perfil ESF padrão (deveria ser 322245 ou sair da equipe). Verificar se afeta composição reconhecida",
      "📋 Fichas CDS das expedições a manter atualizadas",
    ],
    obs: "SCNES 07/2026: médico ROBSON GARCIA DA ROSA (225142), enfermeira BRUNA ROZELLA PEREIRA (223565), técnica KAROLAINE MOREIRA DE SOUZA (322245), 6 ACS. INCONSISTÊNCIA: ELILDA DIAS HISTER (CBO 322230 — Auxiliar de Enfermagem genérico) cadastrada na equipe desde 2009 — CBO legado pré-ESF. SIAPS Q1/26 ESF: 8.25 (Ótimo) · ESB Q1/26: 8.5 (Ótimo). Operação ribeirinha mas cofinanciamento eSF ativo — confirmar modalidade no e-Gestor.",
  },
  {
    nome: "TRÊS ESTADOS",
    ubs: "UBS Osvaldo Lemes Cabral",       // SCNES 07/2026 — CNES 9934448
    cnesUbs: "9934448",
    ine: "0001690442",
    cnesCodEquipe: "0008",
    tipo: "eSF",
    esb: true,
    cnesStatus: "regular",
    medico:    { nome: "CARINA SATELES PINHEIRO",        cbo: "225142", cnes: "700500555725456", vinculo: "40h — entrada 05/01/2023" },
    enfermeiro:{ nome: "TAYANE BARROS CARVALHO",         cbo: "223565", cnes: "704605689602029", vinculo: "40h — entrada 17/06/2025" },
    tecEnf:    { nome: "ANGELA MARIA MELO GUERRA DOS SANTOS", cbo: "322245", cnes: "705603468441215", vinculo: "40h — entrada 01/08/2025" },
    // ACS (6): ALAERTE LEANDRO FERNANDES, ANA CARLAS PITORRA MARTINS, ELDIENE ASSIS DE LACERDA,
    //          PATRICIA FREITAS GUSMAO, RAYANNE LIMA ROCHA, SHEILA REGINA DO AMARAL SILVA
    // Outros: SANDRA CLARA PEREIRA (microscopista 5152A1) · IVANE RESENDE DA SILVA (ACE) · MARINETE RIBEIRO (atend.enf.)
    acs: 6, acsMin: 2,
    populacaoVinculada: 1035,
    populacaoRef: 2500,
    populacaoMax: 3750,
    pendencias: [
      "⚠ MARINETE RIBEIRO DE ARAÚJO SOARES (CBO 515110 — Atendente de Enfermagem) cadastrada na equipe. CBO 515110 não é perfil ESF (não é ACS 515105 nem técnico). Verificar se vínculo irregular interfere na composição reconhecida no e-Gestor",
      "⚠ Confirmar se vínculos anteriormente expirados foram regularizados — SIAPS Q1/26 mostra Ótimo (8.0), sugerindo que produção está sendo reconhecida",
    ],
    obs: "SCNES 07/2026: composição atualizada — médica CARINA SATELES PINHEIRO (225142, desde 05/01/2023), enfermeira TAYANE BARROS CARVALHO (223565, desde 17/06/2025), técnica ANGELA MARIA MELO GUERRA DOS SANTOS (322245, desde 01/08/2025), 6 ACS. INCONSISTÊNCIA: MARINETE RIBEIRO DE ARAÚJO SOARES (CBO 515110 — Atendente de Enfermagem) na equipe — vínculo não-padrão ESF. SIAPS Q1/26 ESF: 8.0 (Ótimo) · ESB: 8.5 (Ótimo). SIAPS ABR/26: 1.035 vinculadas.",
  },
  // ── AREAL — eSF Ribeirinha · CNES 2013290 · UBS Eduardo Biazin ──────────────
  // Fonte: Protocolo de Exportação SCNES 07/2026 + Ficha Estabelecimento CNES 2013290
  //   2013290-0001-0002 AREAL → ESB (código 0001, vinculada à ESF código 0002)
  //   2013290-0002       AREAL → ESF Tipo 70 (Ribeirinha) — 1 médico, 2 enf., 2 téc.enf., 5 ACS, 1 microscopista
  {
    nome: "AREAL",
    ubs: "UBS Eduardo Biazin",
    cnesUbs: "2013290",
    ine: "0000007048",
    cnesCodEquipe: "0002",
    tipo: "eRibeirinha",                   // SCNES: Tipo 70 ESF com característica Ribeirinha
    esb: true,                             // ESB "KENNEDY" (Tipo 71) registrada no CNES 2013290
    cnesStatus: "ativo",
    medico:    { nome: "EDVAN SOARES GONCALVES",      cbo: "225142", cnes: "705008041383950", vinculo: "40h ambulatorial — entrada 03/02/2025" },
    enfermeiro:{ nome: "ALINE COSTA DA SILVA",         cbo: "223565", cnes: "708604555293783", vinculo: "40h ambulatorial — entrada 03/06/2024" },
    tecEnf:    { nome: "RITHERLY DOS SANTOS PINTO",    cbo: "322245", cnes: "703002848573774", vinculo: "40h ambulatorial — entrada 16/04/2025" },
    acs: 5, acsMin: 2,
    // ACS confirmados no SCNES 07/2026:
    //   CLEUCIANE PALESTIS (515105 · 700500143901354 · desde 01/04/2020)
    //   ERVINO GUDER (515105 · 703407617781100 · desde 15/06/2026)
    //   MARIA RAIMUNDA LEMOS DA SILVA (515105 · 700404405741140 · desde 01/06/2008)
    //   ROSELAINE MARTINS DA SILVA (515105 · 706804706469925 · desde 03/01/2020)
    //   VERONICA DE FATIMA FERNANDES (515105 · 706200052886060 · desde 01/04/2012)
    // Outros profissionais no SCNES: ALAN ALEXANDER HISTER (2º enfermeiro, 223565, desde 13/11/2024)
    //   JOAO BARBOSA DE OLIVEIRA FILHO (microscopista 5152A1, desde 01/05/2025)
    //   MARIA LUIZA TRINDADE FIGUEIREDO (2º téc. enf. 322245, desde 10/12/2025)
    populacaoVinculada: 0,
    populacaoRef: 1000,
    populacaoMax: 1500,
    pendencias: [
      "🚨 2 enfermeiros (CBO 223565) cadastrados na mesma equipe: ALINE COSTA DA SILVA (desde 03/06/2024) e ALAN ALEXANDER HISTER (desde 13/11/2024). ESF admite 1 enfermeiro na composição mínima. Verificar no e-Gestor qual é o enfermeiro oficial e desativar o excedente no SCNES",
      "⚠ AREAL ausente no SIAPS ABR/26 — equipe sem produção reconhecida. Verificar se há produção lançada em competência anterior",
      "⚠ ESB AREAL (código 0001, INE 0001773941) — SIAPS Q1/26 ESB: 6.0 (Bom). Confirmar vínculo com equipe ESF no e-Gestor",
      "⚠ ERVINO GUDER (ACS) — entrada 15/06/2026, recente. Confirmar se já está com microárea definida e produzindo no PEC",
    ],
    obs: "CNES 2013290 — UBS Eduardo Biazin. Tipo 70 (ESF/Ribeirinha). Protocolo Exportação SCNES 07/2026 confirma: código ESF 0002, ESB vinculada código 0001 (AREAL ESB). Composição SCNES 07/2026: médico EDVAN SOARES GONCALVES (CBO 225142), enfermeira ALINE COSTA DA SILVA + ALAN ALEXANDER HISTER (CBO 223565), téc. enf. RITHERLY DOS SANTOS PINTO + MARIA LUIZA TRINDADE FIGUEIREDO (CBO 322245), 5 ACS (CLEUCIANE PALESTIS, ERVINO GUDER, MARIA RAIMUNDA LEMOS DA SILVA, ROSELAINE MARTINS DA SILVA, VERONICA DE FATIMA FERNANDES), microscopista JOAO BARBOSA DE OLIVEIRA FILHO (5152A1). CNES 2013282 (Hospital Dorvalino Lagasse) — sem equipes ESF, apenas hospital. Ausente SIAPS ABR/26 — levantar histórico de produção.",
  },
];

// ── CVAT — Componente Vínculo e Acompanhamento Territorial ────────────────
// Fonte: SIAPS · Visão por Variável · Apuí/AM · Competência Mai–Ago/2026
// Variáveis extraídas do dropdown SIAPS CVAT — todas as categorias disponíveis
// Variáveis reais do dropdown SIAPS CVAT — Visão por Variável
// Fonte: siaps.saude.gov.br/componentes/cvat · dropdown Variáveis
export const CVAT_VARIAVEIS = [
  { key: "semCriterio",   label: "Pessoas sem critério",                                      desc: "Total de pessoas vinculadas à equipe sem filtro de critério (INE ativo)" },
  { key: "somenteCI",     label: "A — Pessoas somente com Cadastro Individual",               desc: "Pessoas que possuem ficha de Cadastro Individual mas NÃO têm Cadastro Domiciliar e Territorial associado" },
  { key: "ciEcd",         label: "B — Pessoas com Cadastro Individual + Domiciliar/Territorial", desc: "Pessoas com Cadastro Individual E Cadastro Domiciliar e Territorial vinculados na equipe" },
  { key: "totalCadastro", label: "C — Total de Pessoas com Cadastro (C = A + B)",             desc: "Soma de todas as pessoas com qualquer tipo de cadastro ativo na equipe (A + B)" },
  { key: "criancasIdosos",  label: "Crianças + Pessoas Idosas",                          desc: "Crianças (0–12 anos) e idosos (≥60 anos) vinculados à equipe — grupos prioritários de acompanhamento" },
  { key: "bpcPbf",          label: "Pessoas beneficiárias do BPC ou PBF",               desc: "Pessoas vinculadas que recebem Benefício de Prestação Continuada (BPC) ou Programa Bolsa Família (PBF)" },
  { key: "criancasIdososBpc",label: "Pessoas idosas ou crianças + BPC ou PBF",          desc: "Interseção: crianças ou idosos que também são beneficiários do BPC ou PBF — grupo de maior vulnerabilidade" },
  { key: "acompanhadas",    label: "Total de pessoas Acompanhadas",                      desc: "Pessoas com pelo menos um atendimento ou visita domiciliar registrada no período pela equipe" },
  { key: "atendSujeitos",   label: "Atendimentos sujeitos à Avaliação de Satisfação",   desc: "Total de atendimentos elegíveis para avaliação de satisfação do usuário (C7 — Brasil 360)" },
  { key: "atendAvaliados",  label: "Atendimentos com Avaliação de Satisfação",           desc: "Atendimentos em que o usuário respondeu efetivamente à avaliação de satisfação (numerador C7)" },
  { key: "vinculadas",      label: "N de pessoas vinculadas à Equipe",                   desc: "Total de pessoas com vínculo ativo ao INE da equipe no SISAB — base do Componente Vínculo" },
];

// Dados CVAT por equipe — Apuí/AM · Abr/2026
// Fonte: SIAPS CVAT — siaps.saude.gov.br/componentes/cvat
// semCriterio = total vinculadas (do SIAPS)
// somenteCI   ≈ pessoas sem domicílio cadastrado (~15% da pop)
// ciEcd       ≈ pessoas com cadastro domiciliar completo (~85%)
// totalCadastro = somenteCI + ciEcd (≈ semCriterio, diferença = sem cadastro)
// criancasIdosos ≈ crianças (0–12a ~18%) + idosos (≥60a ~8%) = ~26%
// Dados CVAT por equipe — Apuí/AM · Abr/2026
// Fonte: SIAPS CVAT — 11 variáveis completas do dropdown Visão por Variável
// Fonte: SIAPS · Dado Agregado Visão Geral CVAT · Competência: ABR/26 · Gerado: 22/07/2026 14:34h
// Campos confirmados: totalCadastro, acompanhadas, vinculadas
// semCriterio ≈ vinculadas (base populacional); demais campos sem dados nesta competência
const CVAT_EQUIPES: Record<string, Record<string, number>> = {
  //                         semCrit  somCI  ciEcd  totCad  criId  bpcPbf  criBpc  acomp  atSuj  atAval  vinc
  KENNEDY:         { semCriterio:761,  somenteCI:0, ciEcd:0, totalCadastro:773,  criancasIdosos:0, bpcPbf:0, criancasIdososBpc:0, acompanhadas:761,  atendSujeitos:0, atendAvaliados:0, vinculadas:761  },
  JK:              { semCriterio:1497, somenteCI:0, ciEcd:0, totalCadastro:1540, criancasIdosos:0, bpcPbf:0, criancasIdososBpc:0, acompanhadas:1497, atendSujeitos:0, atendAvaliados:0, vinculadas:1497 },
  ACARI:           { semCriterio:1611, somenteCI:0, ciEcd:0, totalCadastro:1639, criancasIdosos:0, bpcPbf:0, criancasIdososBpc:0, acompanhadas:1611, atendSujeitos:0, atendAvaliados:0, vinculadas:1611 },
  JUMA:            { semCriterio:1732, somenteCI:0, ciEcd:0, totalCadastro:1761, criancasIdosos:0, bpcPbf:0, criancasIdososBpc:0, acompanhadas:1732, atendSujeitos:0, atendAvaliados:0, vinculadas:1732 },
  "ESTRADA NOVA":  { semCriterio:806,  somenteCI:0, ciEcd:0, totalCadastro:822,  criancasIdosos:0, bpcPbf:0, criancasIdososBpc:0, acompanhadas:806,  atendSujeitos:0, atendAvaliados:0, vinculadas:806  },
  LIBERDADE:       { semCriterio:1784, somenteCI:0, ciEcd:0, totalCadastro:1797, criancasIdosos:0, bpcPbf:0, criancasIdososBpc:0, acompanhadas:1784, atendSujeitos:0, atendAvaliados:0, vinculadas:1784 },
  "SÃO SEBASTIÃO": { semCriterio:1585, somenteCI:0, ciEcd:0, totalCadastro:1619, criancasIdosos:0, bpcPbf:0, criancasIdososBpc:0, acompanhadas:1585, atendSujeitos:0, atendAvaliados:0, vinculadas:1585 },
  CACHOEIRA:       { semCriterio:1552, somenteCI:0, ciEcd:0, totalCadastro:1565, criancasIdosos:0, bpcPbf:0, criancasIdososBpc:0, acompanhadas:1552, atendSujeitos:0, atendAvaliados:0, vinculadas:1552 },
  "TRÊS ESTADOS":  { semCriterio:1035, somenteCI:0, ciEcd:0, totalCadastro:1045, criancasIdosos:0, bpcPbf:0, criancasIdososBpc:0, acompanhadas:1035, atendSujeitos:0, atendAvaliados:0, vinculadas:1035 },
  // AREAL: ausente no relatório ABR/26 (eSF Ribeirinha — competência pode diferir)
  "AREAL":         { semCriterio:0,    somenteCI:0, ciEcd:0, totalCadastro:0,    criancasIdosos:0, bpcPbf:0, criancasIdososBpc:0, acompanhadas:0,    atendSujeitos:0, atendAvaliados:0, vinculadas:0    },
};

// ── Countdown ──────────────────────────────────────────────────────────────
function useCountdown() {
  const [diasRestantes, setDiasRestantes] = useState(0);
  const [horasRestantes, setHorasRestantes] = useState(0);
  useEffect(() => {
    function calc() {
      const agora = new Date();
      // Fechamento Q2: 31/Ago/2026 23:59
      const alvo = new Date(2026, 7, 31, 23, 59, 0);
      const diff = alvo.getTime() - agora.getTime();
      if (diff > 0) {
        setDiasRestantes(Math.floor(diff / (1000 * 60 * 60 * 24)));
        setHorasRestantes(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
      }
    }
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, []);
  return { diasRestantes, horasRestantes };
}

// ── Períodos de análise ────────────────────────────────────────────────────
const PERIODOS = [
  { key: "diaria",        label: "📅 Diária",        desc: "Monitoramento do dia — produção, pendências e alertas urgentes" },
  { key: "mensal",        label: "📆 Mensal",         desc: "Consolidado mensal — competência atual vs mês anterior" },
  { key: "quadrimestral", label: "📊 Quadrimestral",  desc: "Q2 Mai–Ago/2026 — resultado para fins de financiamento federal" },
];

// ── Componente Principal ───────────────────────────────────────────────────
export default function SprintOtimo() {
  const [aba, setAba] = useState<"visao"|"indicadores"|"equipe"|"checklist"|"diagnostico"|"cvat"|"inconsistencias">("visao");
  const [cvatVariavel, setCvatVariavel] = useState("semCriterio");
  const [cvatVizualiz, setCvatVizualiz] = useState<"variavel"|"equipe">("variavel");
  const [equipeAtiva, setEquipeAtiva] = useState("JK");
  const [diagEquipe, setDiagEquipe] = useState("KENNEDY");
  const [checks, setChecks] = useState<Record<string,boolean>>({});
  const [periodo, setPeriodo] = useState<"diaria"|"mensal"|"quadrimestral">("quadrimestral");
  const [municipioNome, setMunicipioNome] = useState("Apuí");
  const [municipioUF, setMunicipioUF] = useState("AM");
  const [municipioIBGE, setMunicipioIBGE] = useState("1300144");
  const [editandoMunicipio, setEditandoMunicipio] = useState(false);
  const { diasRestantes, horasRestantes } = useCountdown();

  const totalChecks = CHECKLIST.length;
  const feitos = Object.values(checks).filter(Boolean).length;
  const pct = Math.round((feitos / totalChecks) * 100);

  const periodoAtual = PERIODOS.find(p => p.key === periodo)!;

  function toggle(id: string) {
    setChecks(p => ({ ...p, [id]: !p[id] }));
  }

  const FRENTES = ["Sistema","Clínica","ACS","Retroativo","Fechamento"];

  const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

  return (
    <div style={{ padding: "0 0 60px 0", fontFamily: "Inter, system-ui, sans-serif", background: "#070c18", minHeight: "100vh", color: "#f1f5f9" }}>

      {/* ── Header ── */}
      <div style={{ background: "linear-gradient(180deg, #0d1a35 0%, #09121f 100%)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>

          {/* Lado esquerdo — logo + info */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Logo mark */}
            <div style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", borderRadius: 12, width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 20px rgba(245,158,11,0.3)" }}>
              <Trophy size={22} color="#fff" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontWeight: 800, fontSize: 18, color: "#f8fafc", letterSpacing: -0.3 }}>Sprint ÓTIMO</span>
                <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", padding: "1px 8px", borderRadius: 20 }}>Q2 · 2026</span>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                Meta ≥ 75 pts · Portaria GM/MS 3.493/2024
              </div>
            </div>
          </div>

          {/* Município editável — centro */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            {editandoMunicipio ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  value={municipioNome}
                  onChange={e => setMunicipioNome(e.target.value)}
                  placeholder="Nome do município"
                  style={{ background: "#07101e", border: "1px solid #3b82f6", borderRadius: 8, color: "#f1f5f9", padding: "6px 12px", fontSize: 13, width: 160, outline: "none" }}
                />
                <select value={municipioUF} onChange={e => setMunicipioUF(e.target.value)}
                  style={{ background: "#07101e", border: "1px solid #3b82f6", borderRadius: 8, color: "#f1f5f9", padding: "6px 10px", fontSize: 13, outline: "none" }}>
                  {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
                <input
                  value={municipioIBGE}
                  onChange={e => setMunicipioIBGE(e.target.value)}
                  placeholder="IBGE"
                  style={{ background: "#07101e", border: "1px solid #3b82f6", borderRadius: 8, color: "#f1f5f9", padding: "6px 12px", fontSize: 13, width: 90, outline: "none" }}
                />
                <button onClick={() => setEditandoMunicipio(false)}
                  style={{ background: "#15803d", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  ✓
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{municipioNome} / {municipioUF}</div>
                  {municipioIBGE && <div style={{ fontSize: 11, color: "#475569" }}>IBGE {municipioIBGE}</div>}
                </div>
                <button onClick={() => setEditandoMunicipio(true)}
                  style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>
                  ✏️
                </button>
              </div>
            )}
          </div>

          {/* Lado direito — período + countdown */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* Seletor de período */}
            <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 4 }}>
              {PERIODOS.map(p => (
                <button key={p.key} onClick={() => setPeriodo(p.key as any)}
                  style={{
                    padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: periodo === p.key ? 700 : 400,
                    border: "none",
                    background: periodo === p.key ? "#15803d" : "transparent",
                    color: periodo === p.key ? "#fff" : "#64748b",
                    cursor: "pointer", transition: "all 0.15s"
                  }}>
                  {p.label}
                </button>
              ))}
            </div>

            {/* Countdown */}
            <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "6px 14px", textAlign: "center", minWidth: 56 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{diasRestantes}</div>
                <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase" as const, letterSpacing: 1, marginTop: 2 }}>dias</div>
              </div>
              <div style={{ color: "#334155", fontWeight: 800, fontSize: 16 }}>:</div>
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "6px 14px", textAlign: "center", minWidth: 56 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{horasRestantes}</div>
                <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase" as const, letterSpacing: 1, marginTop: 2 }}>horas</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 0, background: "#0a1020", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        {[
          { label: "Meta sprint", value: "≥ 75 pts", sub: "Componente Qualidade", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
          { label: "Equipes ÓTIMO", value: `${EQUIPES.filter(e => e.pts >= 75).length} / ${EQUIPES.filter(e => e.risco !== "apurar").length}`, sub: "meta atingida", color: "#22c55e", bg: "rgba(34,197,94,0.07)" },
          { label: "Em risco crítico", value: String(EQUIPES.filter(e => e.risco === "critico").length), sub: "precisam ação imediata", color: "#ef4444", bg: "rgba(239,68,68,0.07)" },
          { label: "Checklist", value: `${feitos} / ${totalChecks}`, sub: `${pct}% concluído`, color: "#818cf8", bg: "rgba(129,140,248,0.07)" },
          { label: "Sprint encerra", value: `${diasRestantes}d ${horasRestantes}h`, sub: periodoAtual.desc, color: "#38bdf8", bg: "rgba(56,189,248,0.07)" },
        ].map((s, i, arr) => (
          <div key={s.label} style={{ padding: "12px 20px", borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", background: s.bg }}>
            <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase" as const, letterSpacing: 0.8, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 6, padding: "12px 28px", background: "#070c18", borderBottom: "1px solid rgba(255,255,255,0.05)", flexWrap: "wrap" }}>
        {([
          { key: "visao",        label: "Visão Geral",           icon: "📊" },
          { key: "diagnostico",  label: "Diagnóstico de Equipe", icon: "🔍" },
          { key: "cvat",         label: "CVAT / SIAPS",          icon: "🗂️" },
          { key: "indicadores",  label: "Indicadores-Chave",     icon: "📈" },
          { key: "equipe",       label: "Por Equipe",            icon: "👥" },
          { key: "checklist",       label: "Checklist",             icon: "✅" },
          { key: "inconsistencias", label: "Inconsistências",       icon: "⚠" },
        ] as {key: "visao"|"indicadores"|"equipe"|"checklist"|"diagnostico"|"cvat"|"inconsistencias"; label: string; icon: string}[]).map(t => (
          <button key={t.key} onClick={() => setAba(t.key)} style={{
            padding: "7px 16px", fontSize: 12.5, fontWeight: aba === t.key ? 700 : 500,
            border: aba === t.key ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8,
            background: aba === t.key ? "linear-gradient(135deg, rgba(21,128,61,0.45), rgba(20,83,45,0.35))" : "rgba(255,255,255,0.03)",
            color: aba === t.key ? "#4ade80" : "#64748b",
            cursor: "pointer", whiteSpace: "nowrap", display: "flex", gap: 6, alignItems: "center",
            transition: "all 0.15s",
            boxShadow: aba === t.key ? "0 0 12px rgba(34,197,94,0.12), inset 0 1px 0 rgba(255,255,255,0.05)" : "none",
          }}>
            <span style={{ fontSize: 13 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "24px 28px" }}>

        {/* ── ABA: CVAT / SIAPS ── */}
        {aba === "cvat" && (() => {
          const variavelAtual = CVAT_VARIAVEIS.find(v => v.key === cvatVariavel) || CVAT_VARIAVEIS[0];
          const nomes = Object.keys(CVAT_EQUIPES);

          // Totais municipais por variável
          const totalMunicipal: Record<string, number> = {};
          CVAT_VARIAVEIS.forEach(v => {
            totalMunicipal[v.key] = nomes.reduce((s, eq) => s + (CVAT_EQUIPES[eq][v.key] || 0), 0);
          });

          // Cor por % relativo ao total
          function pctCor(pct: number) {
            if (pct >= 70) return "#22c55e";
            if (pct >= 40) return "#f59e0b";
            return "#ef4444";
          }

          return (
            <div>
              {/* Header CVAT */}
              <div style={{ background: "#07101e", border: "1px solid #1e3a5f", borderRadius: 10, padding: "14px 18px", marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 2 }}>
                      🗂️ CVAT — Componente Vínculo e Acompanhamento Territorial
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      Fonte: SIAPS · siaps.saude.gov.br/componentes/cvat · UF: AM · Município: APUÍ · IED: 2 · eAP + eSF
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "6px 14px", fontSize: 11, color: "#93c5fd" }}>
                      📅 Competência: <strong>Abr/2026</strong>
                    </div>
                    <div style={{ background: "#14532d", border: "1px solid #166534", borderRadius: 8, padding: "6px 14px", fontSize: 11, color: "#bbf7d0" }}>
                      Total Vinculadas: <strong>{totalMunicipal.semCriterio.toLocaleString("pt-BR")}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seletor de visualização */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {(["variavel","equipe"] as const).map(v => (
                  <button key={v} onClick={() => setCvatVizualiz(v)} style={{
                    padding: "5px 16px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                    fontWeight: cvatVizualiz === v ? 700 : 400,
                    border: `1px solid ${cvatVizualiz === v ? "#3b82f6" : "#334155"}`,
                    background: cvatVizualiz === v ? "#1e3a5f" : "transparent",
                    color: cvatVizualiz === v ? "#93c5fd" : "#64748b",
                  }}>
                    {v === "variavel" ? "📊 Visão por Variável" : "👥 Visão por Equipe"}
                  </button>
                ))}
              </div>

              {/* VISÃO POR VARIÁVEL */}
              {cvatVizualiz === "variavel" && (
                <div>
                  {/* Seletor de variável */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                    {CVAT_VARIAVEIS.map(v => (
                      <button key={v.key} onClick={() => setCvatVariavel(v.key)} style={{
                        padding: "4px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer",
                        fontWeight: cvatVariavel === v.key ? 700 : 400,
                        border: `1px solid ${cvatVariavel === v.key ? "#2563eb" : "#1e293b"}`,
                        background: cvatVariavel === v.key ? "#1e3a5f" : "#0f172a",
                        color: cvatVariavel === v.key ? "#93c5fd" : "#475569",
                        whiteSpace: "nowrap",
                      }}>
                        {v.label}
                      </button>
                    ))}
                  </div>

                  {/* Card da variável selecionada */}
                  <div style={{ background: "#0d1f35", border: "1px solid #1e3a5f", borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#93c5fd", marginBottom: 3 }}>{variavelAtual.label}</div>
                    <div style={{ fontSize: 11.5, color: "#64748b", marginBottom: 8 }}>{variavelAtual.desc}</div>
                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                      <div><span style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9" }}>{totalMunicipal[variavelAtual.key].toLocaleString("pt-BR")}</span><span style={{ fontSize: 11, color: "#64748b", marginLeft: 6 }}>total município</span></div>
                      {cvatVariavel !== "semCriterio" && totalMunicipal.semCriterio > 0 && (
                        <div><span style={{ fontSize: 22, fontWeight: 800, color: "#f59e0b" }}>{((totalMunicipal[variavelAtual.key] / totalMunicipal.semCriterio) * 100).toFixed(1)}%</span><span style={{ fontSize: 11, color: "#64748b", marginLeft: 6 }}>da pop. vinculada</span></div>
                      )}
                      <div><span style={{ fontSize: 22, fontWeight: 800, color: "#10b981" }}>{EQUIPES.filter(e => e.risco !== "apurar").length}</span><span style={{ fontSize: 11, color: "#64748b", marginLeft: 6 }}>equipes ativas</span></div>
                    </div>
                  </div>

                  {/* Tabela por equipe para a variável selecionada */}
                  <div style={{ background: "#07101e", border: "1px solid #1e293b", borderRadius: 10, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                      <thead>
                        <tr style={{ background: "#1e293b" }}>
                          <th style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 11 }}>Equipe</th>
                          <th style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 11 }}>Tipo</th>
                          <th style={{ padding: "10px 14px", textAlign: "right", color: "#64748b", fontWeight: 600, fontSize: 11 }}>Pop. Vinculada Total</th>
                          <th style={{ padding: "10px 14px", textAlign: "right", color: "#64748b", fontWeight: 600, fontSize: 11 }}>{variavelAtual.label}</th>
                          {cvatVariavel !== "semCriterio" && <th style={{ padding: "10px 14px", textAlign: "right", color: "#64748b", fontWeight: 600, fontSize: 11 }}>% da equipe</th>}
                          <th style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 11 }}>Distribuição</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nomes.map((eq, i) => {
                          const val = CVAT_EQUIPES[eq][cvatVariavel] || 0;
                          const pop = CVAT_EQUIPES[eq].semCriterio;
                          const pct = cvatVariavel === "semCriterio" ? (pop / (totalMunicipal.semCriterio || 1)) * 100 : (val / (pop || 1)) * 100;
                          const barW = cvatVariavel === "semCriterio"
                            ? (pop / Math.max(...nomes.map(n => CVAT_EQUIPES[n].semCriterio))) * 100
                            : (val / Math.max(1, ...nomes.map(n => CVAT_EQUIPES[n][cvatVariavel] || 0))) * 100;
                          const diag = DIAGNOSTICO.find(d => d.nome === eq);
                          const isCritico = diag?.cnesStatus === "expirado";
                          const isApurar = diag?.cnesStatus === "apurar";
                          return (
                            <tr key={eq} style={{ borderBottom: "1px solid #1e293b", background: isCritico ? "rgba(239,68,68,0.05)" : isApurar ? "rgba(107,114,128,0.05)" : i % 2 === 0 ? "transparent" : "rgba(30,41,59,0.3)" }}>
                              <td style={{ padding: "10px 14px", color: isCritico ? "#ef4444" : isApurar ? "#6b7280" : "#f1f5f9", fontWeight: 700 }}>
                                {isCritico ? "🚨 " : isApurar ? "🔍 " : ""}{eq}
                              </td>
                              <td style={{ padding: "10px 14px" }}>
                                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: isApurar ? "#1e293b" : diag?.tipo === "eRibeirinha" ? "#1e3a5f" : "#14532d", color: isApurar ? "#6b7280" : diag?.tipo === "eRibeirinha" ? "#93c5fd" : "#bbf7d0", fontWeight: 700 }}>
                                  {isApurar ? "—" : diag?.tipo || "eSF"}
                                </span>
                              </td>
                              <td style={{ padding: "10px 14px", textAlign: "right", color: isApurar ? "#6b7280" : "#94a3b8", fontVariantNumeric: "tabular-nums", fontStyle: isApurar ? "italic" : "normal" }}>
                                {isApurar ? "—" : pop.toLocaleString("pt-BR")}
                              </td>
                              <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: isCritico ? "#ef4444" : isApurar ? "#6b7280" : "#f1f5f9", fontVariantNumeric: "tabular-nums", fontStyle: isApurar ? "italic" : "normal" }}>
                                {isApurar ? "—" : isCritico && val === 0 ? <span title="Produção descartada pelo e-Gestor — CNES expirado">0 ⚠</span> : val.toLocaleString("pt-BR")}
                              </td>
                              {cvatVariavel !== "semCriterio" && (
                                <td style={{ padding: "10px 14px", textAlign: "right", color: isApurar ? "#6b7280" : pctCor(pct), fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                                  {isApurar ? "—" : `${pct.toFixed(1)}%`}
                                </td>
                              )}
                              <td style={{ padding: "10px 14px", minWidth: 120 }}>
                                {isApurar
                                  ? <div style={{ fontSize: 10, color: "#6b7280", fontStyle: "italic" }}>a apurar</div>
                                  : <div style={{ background: "#1e293b", borderRadius: 4, height: 8, overflow: "hidden" }}>
                                      <div style={{ width: `${barW}%`, height: "100%", borderRadius: 4, background: isCritico ? "#ef4444" : "#3b82f6", transition: "width 0.3s" }} />
                                    </div>
                                }
                              </td>
                            </tr>
                          );
                        })}
                        {/* Total */}
                        <tr style={{ background: "#1e293b", borderTop: "2px solid #334155" }}>
                          <td colSpan={2} style={{ padding: "10px 14px", fontWeight: 800, color: "#f1f5f9", fontSize: 12 }}>TOTAL MUNICÍPIO</td>
                          <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 800, color: "#f1f5f9", fontVariantNumeric: "tabular-nums" }}>{totalMunicipal.semCriterio.toLocaleString("pt-BR")}</td>
                          <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 800, color: "#f59e0b", fontVariantNumeric: "tabular-nums" }}>{(totalMunicipal[cvatVariavel] || 0).toLocaleString("pt-BR")}</td>
                          {cvatVariavel !== "semCriterio" && <td style={{ padding: "10px 14px", textAlign: "right", color: "#f59e0b", fontWeight: 700 }}>{totalMunicipal.semCriterio > 0 ? ((totalMunicipal[cvatVariavel] / totalMunicipal.semCriterio) * 100).toFixed(1) : "0.0"}%</td>}
                          <td />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VISÃO POR EQUIPE */}
              {cvatVizualiz === "equipe" && (
                <div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5, minWidth: 900 }}>
                      <thead>
                        <tr style={{ background: "#1e293b" }}>
                          <th style={{ padding: "10px 12px", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, position: "sticky", left: 0, background: "#1e293b", zIndex: 1 }}>Variável</th>
                          {nomes.map(eq => {
                            const st = DIAGNOSTICO.find(d=>d.nome===eq)?.cnesStatus;
                            return (
                              <th key={eq} style={{ padding: "10px 10px", textAlign: "right", color: st === "expirado" ? "#ef4444" : st === "apurar" ? "#6b7280" : "#64748b", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap" }}>
                                {st === "expirado" ? "🚨 " : st === "apurar" ? "🔍 " : ""}{eq}
                              </th>
                            );
                          })}
                          <th style={{ padding: "10px 10px", textAlign: "right", color: "#f59e0b", fontWeight: 700, fontSize: 10 }}>TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {CVAT_VARIAVEIS.map((v, i) => (
                          <tr key={v.key} style={{ borderBottom: "1px solid #1e293b", background: i % 2 === 0 ? "transparent" : "rgba(30,41,59,0.3)" }}>
                            <td style={{ padding: "8px 12px", color: "#f1f5f9", fontWeight: 600, whiteSpace: "nowrap", position: "sticky", left: 0, background: i % 2 === 0 ? "#0f172a" : "#0d1624", zIndex: 1 }}>
                              {v.label}
                              <div style={{ fontSize: 10, color: "#475569", fontWeight: 400 }}>{v.desc.substring(0, 45)}...</div>
                            </td>
                            {nomes.map(eq => {
                              const val = CVAT_EQUIPES[eq][v.key] || 0;
                              const st = DIAGNOSTICO.find(d=>d.nome===eq)?.cnesStatus;
                              const isCritico = st === "expirado";
                              const isApurar = st === "apurar";
                              return (
                                <td key={eq} style={{ padding: "8px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: isApurar ? "#6b7280" : isCritico ? "#ef4444" : "#f1f5f9", fontWeight: 400, fontStyle: isApurar ? "italic" : "normal" }}>
                                  {isApurar ? "—" : val === 0 && isCritico ? <span title="CNES expirado — produção descartada">0 ⚠</span> : val.toLocaleString("pt-BR")}
                                </td>
                              );
                            })}
                            <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 800, color: "#f59e0b", fontVariantNumeric: "tabular-nums", background: "rgba(245,158,11,0.05)" }}>
                              {totalMunicipal[v.key].toLocaleString("pt-BR")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: "#ef4444" }}>🚨 CNES expirado — produção descartada pelo e-Gestor</span>
                      <span style={{ fontSize: 11, color: "#6b7280" }}>🔍 Dados a apurar no e-Gestor/SIAPS</span>
                      <span style={{ fontSize: 11, color: "#6b7280" }}>— Sem dados disponíveis</span>
                      <span style={{ fontSize: 11, color: "#ef4444" }}>0 ⚠ Zero por bloqueio CNES, não ausência de produção</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#475569", textAlign: "right" }}>
                      * Dados estimados com base no cadastro PEC e-SUS APS e SIAPS CVAT — Apuí/AM · IED 2 · Abr/2026
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── ABA: Diagnóstico de Equipe ── */}
        {aba === "diagnostico" && (() => {
          const d = DIAGNOSTICO.find(x => x.nome === diagEquipe) || DIAGNOSTICO[0];
          const popPct = Math.round((d.populacaoVinculada / d.populacaoMax) * 100);
          const popStatus = d.populacaoVinculada >= d.populacaoRef ? "ok" : d.populacaoVinculada >= d.populacaoRef * 0.8 ? "alerta" : "baixo";
          const popCor = popStatus === "ok" ? "#22c55e" : popStatus === "alerta" ? "#f59e0b" : "#ef4444";
          const isCritico = d.cnesStatus === "expirado";

          return (
            <div>
              {/* Seletor de equipe */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                {DIAGNOSTICO.map(eq => (
                  <button key={eq.nome} onClick={() => setDiagEquipe(eq.nome)} style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                    fontWeight: diagEquipe === eq.nome ? 700 : 400,
                    border: `1px solid ${diagEquipe === eq.nome ? (eq.cnesStatus === "expirado" ? "#ef4444" : eq.cnesStatus === "apurar" ? "#6b7280" : "#22c55e") : "#334155"}`,
                    background: diagEquipe === eq.nome ? (eq.cnesStatus === "expirado" ? "#450a0a" : eq.cnesStatus === "apurar" ? "#1e293b" : "#14532d") : "transparent",
                    color: diagEquipe === eq.nome ? (eq.cnesStatus === "expirado" ? "#fca5a5" : eq.cnesStatus === "apurar" ? "#94a3b8" : "#bbf7d0") : "#94a3b8",
                  }}>
                    {eq.cnesStatus === "expirado" ? "🚨 " : eq.cnesStatus === "apurar" ? "🔍 " : ""}{eq.nome}
                  </button>
                ))}
              </div>

              {/* Badge CNES oficial */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#64748b" }}>📋 Fonte: SCNES 07/2026 · Exportação DATASUS 20/07/2026</span>
                {(d as any).cnesUbs && (
                  <span style={{ background: "#1e3a5f", color: "#93c5fd", fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 10, fontFamily: "monospace" }}>
                    CNES {(d as any).cnesUbs}
                  </span>
                )}
                {(d as any).cnesCodEquipe && (
                  <span style={{ background: "#14532d", color: "#bbf7d0", fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 10, fontFamily: "monospace" }}>
                    Equipe {(d as any).cnesCodEquipe}
                  </span>
                )}
                {(d as any).esb && (
                  <span style={{ background: "#3b1a6e", color: "#c4b5fd", fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 10 }}>ESB vinculada</span>
                )}
              </div>

              {/* Alerta AREAL a apurar */}
              {d.cnesStatus === "apurar" && (
                <div style={{ background: "#1e293b", border: "1px solid #475569", borderRadius: 10, padding: 16, marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <FileText size={22} color="#94a3b8" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 800, color: "#f1f5f9", fontSize: 14, marginBottom: 6 }}>EQUIPE IDENTIFICADA NO SCNES — DADOS A APURAR</div>
                    <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
                      A equipe <strong>AREAL</strong> (CNES 2013290 — UBS Eduardo Biazin) foi identificada no Protocolo de Exportação SCNES 07/2026
                      mas <strong>não estava no monitoramento ERSUS 360</strong>.
                      Verificar no e-Gestor / SIAPS se a equipe está ativa e produzindo.
                      Se confirmada, incluir no Sprint ÓTIMO e levantar composição completa via SCNES.
                    </p>
                  </div>
                </div>
              )}

              {/* Alerta crítico CNES expirado */}
              {isCritico && (
                <div style={{ background: "#450a0a", border: "1px solid #ef4444", borderRadius: 10, padding: 16, marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <ShieldAlert size={22} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 800, color: "#ef4444", fontSize: 14, marginBottom: 6 }}>CNES EXPIRADO — FINANCIAMENTO BLOQUEADO</div>
                    <p style={{ fontSize: 13, color: "#fca5a5", margin: 0 }}>
                      Com vínculos expirados no SCNES, <strong>toda a produção desta equipe está sendo descartada pelo e-Gestor</strong>.
                      Nenhum indicador é contabilizado para fins de financiamento pela Portaria GM/MS 3.493/2024.
                      O RH/SMS deve reativar os vínculos <strong>imediatamente</strong>.
                      Suporte e-Gestor: <strong>0800 722 4310</strong>.
                    </p>
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

                {/* Card composição mínima */}
                <div style={{ background: "linear-gradient(180deg, #111827 0%, #0f1623 100%)", borderRadius: 12, padding: 18, border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <Users size={16} color="#3b82f6" />
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#f1f5f9" }}>Composição Mínima da Equipe</span>
                    <span style={{ fontSize: 10, color: "#64748b" }}>PNAB / Port. Cons. nº 2/2017</span>
                  </div>
                  {[
                    { cargo: "Médico", pessoa: d.medico, cbo: "225125" },
                    { cargo: "Enfermeiro", pessoa: d.enfermeiro, cbo: "223505" },
                    { cargo: "Téc./Aux. Enfermagem", pessoa: d.tecEnf, cbo: "322205" },
                  ].map(p => {
                    const ok = p.pessoa.cnes === "OK";
                    return (
                      <div key={p.cargo} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #0f172a" }}>
                        <div>
                          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>{p.cargo} · CBO {p.cbo}</div>
                          <div style={{ fontSize: 13, color: "#f1f5f9", fontWeight: 500 }}>{p.pessoa.nome}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.pessoa.vinculo}</div>
                        </div>
                        <div style={{ textAlign: "center", minWidth: 70 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: ok ? "#22c55e" : "#ef4444",
                            background: ok ? "#14532d" : "#450a0a", borderRadius: 8, padding: "3px 10px" }}>
                            {ok ? "✓ Regular" : "✗ Expirado"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ marginTop: 10, padding: "8px 0", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>ACS (mínimo necessário: {d.acsMin})</div>
                        <div style={{ fontSize: 13, color: "#f1f5f9", fontWeight: 500 }}>{d.acs} ACS ativos no SCNES</div>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700,
                        color: d.acs >= d.acsMin ? "#22c55e" : "#ef4444",
                        background: d.acs >= d.acsMin ? "#14532d" : "#450a0a",
                        borderRadius: 8, padding: "3px 10px" }}>
                        {d.acs >= d.acsMin ? "✓ Suficiente" : "✗ Insuficiente"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card população vinculada */}
                <div style={{ background: "linear-gradient(180deg, #111827 0%, #0f1623 100%)", borderRadius: 12, padding: 18, border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <UserCheck size={16} color="#3b82f6" />
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#f1f5f9" }}>População Vinculada</span>
                    <span style={{ fontSize: 10, color: "#64748b" }}>Port. 3.493/2024</span>
                  </div>

                  <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: popCor }}>{d.populacaoVinculada.toLocaleString("pt-BR")}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>pessoas vinculadas</div>
                  </div>

                  <div style={{ height: 10, background: "#334155", borderRadius: 5, marginBottom: 8, position: "relative" as const, overflow: "hidden" }}>
                    <div style={{ position: "absolute" as const, height: "100%", width: `${Math.min(100,(d.populacaoRef/d.populacaoMax)*100)}%`, background: "#334155", borderRight: "2px dashed #f59e0b" }} />
                    <div style={{ height: "100%", width: `${popPct}%`, background: popCor, borderRadius: 5, transition: "width 0.4s" }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginBottom: 14 }}>
                    <span>0</span>
                    <span style={{ color: "#f59e0b" }}>Ref: {d.populacaoRef.toLocaleString("pt-BR")}</span>
                    <span style={{ color: "#94a3b8" }}>Máx: {d.populacaoMax.toLocaleString("pt-BR")}</span>
                  </div>

                  {[
                    { label: "Parâmetro de referência", val: d.populacaoRef.toLocaleString("pt-BR"), cor: "#f59e0b" },
                    { label: "Limite máximo financiamento", val: d.populacaoMax.toLocaleString("pt-BR"), cor: "#94a3b8" },
                    { label: "Situação", val: popStatus === "ok" ? "Dentro do parâmetro" : popStatus === "alerta" ? "Abaixo da referência" : "Muito abaixo — verificar cadastro", cor: popCor },
                  ].map(item => (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #0f172a" }}>
                      <span style={{ color: "#94a3b8" }}>{item.label}</span>
                      <span style={{ fontWeight: 600, color: item.cor }}>{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pendências */}
              {d.pendencias.length > 0 && (
                <div style={{ background: "linear-gradient(180deg, #111827 0%, #0f1623 100%)", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.3)", padding: 16, marginBottom: 14, border: "1px solid #b45309" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                    <AlertTriangle size={15} color="#f59e0b" />
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#f59e0b" }}>Pendências Identificadas</span>
                  </div>
                  {d.pendencias.map((p, i) => (
                    <div key={i} style={{ fontSize: 13, color: "#fbbf24", padding: "5px 0", borderBottom: i < d.pendencias.length - 1 ? "1px solid #292524" : "none" }}>
                      • {p}
                    </div>
                  ))}
                </div>
              )}

              {/* Observação técnica */}
              <div style={{ background: "#07101e", borderRadius: 10, padding: 16, border: "1px solid #1e3a5f", marginBottom: 14 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <FileText size={14} color="#3b82f6" />
                  <span style={{ fontWeight: 700, fontSize: 12, color: "#3b82f6" }}>Observação Técnica</span>
                </div>
                <p style={{ fontSize: 13, color: "#cbd5e1", margin: 0 }}>{d.obs}</p>
              </div>

              {/* Fundamentação legal */}
              <div style={{ background: "linear-gradient(180deg, #111827 0%, #0f1623 100%)", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.3)", padding: 16, border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: "#64748b", marginBottom: 10, textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Fundamentação Legal</div>
                {[
                  { norm: "Portaria de Consolidação GM/MS nº 2/2017", desc: "Anexo XXII — Política Nacional de Atenção Básica (PNAB). Define composição mínima obrigatória: 1 médico, 1 enfermeiro, 1 técnico/auxiliar de enfermagem e ACS em número suficiente." },
                  { norm: "Portaria GM/MS nº 3.493/2024", desc: "Institui o Novo Financiamento da APS (Brasil 360). Para municípios de 20.001–50.000 hab. (como Apuí), parâmetro de referência é 2.500 pessoas/eSF, com limite máximo de 3.750 para fins de cofinanciamento federal." },
                  { norm: "SCNES — Cadastro Nacional de Estabelecimentos de Saúde", desc: "Vínculos expirados impedem o reconhecimento da produção pelo Ministério da Saúde e comprometem o financiamento da APS. Atualização mensal obrigatória." },
                ].map(item => (
                  <div key={item.norm} style={{ padding: "10px 0", borderBottom: "1px solid #0f172a" }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: "#93c5fd", marginBottom: 4 }}>{item.norm}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── ABA: Visão Geral ── */}
        {aba === "visao" && (
          <div>

            {/* Banner de contexto por período */}
            {periodo === "diaria" && (
              <div style={{ background: "#2e1065", border: "1px solid #7c3aed", borderRadius: 10, padding: 14, marginBottom: 16, display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ fontSize: 22 }}>📅</span>
                <div>
                  <div style={{ fontWeight: 700, color: "#c4b5fd", marginBottom: 4 }}>Análise Diária — {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</div>
                  <div style={{ fontSize: 12, color: "#a78bfa" }}>Foco de hoje: verificar no PEC se há produção sem INE vinculado, confirmar lançamentos do dia anterior e garantir que ACS realizaram visitas programadas. Toda produção de hoje conta para o fechamento de agosto.</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    {["✓ Verificar produção sem equipe no e-Gestor","✓ PA de hipertensos lançada?","✓ Puericultura do dia agendada?","✓ ACS com lista de busca ativa?"].map(t => (
                      <span key={t} style={{ background: "#3b0764", color: "#c4b5fd", padding: "3px 10px", borderRadius: 12, fontSize: 11 }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {periodo === "mensal" && (
              <div style={{ background: "#0c1a2e", border: "1px solid #1d4ed8", borderRadius: 10, padding: 14, marginBottom: 16, display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ fontSize: 22 }}>📆</span>
                <div>
                  <div style={{ fontWeight: 700, color: "#93c5fd", marginBottom: 4 }}>Análise Mensal — {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</div>
                  <div style={{ fontSize: 12, color: "#60a5fa" }}>Competência aberta até ~dia 20 do próximo mês. Verificar no e-Gestor se os indicadores desta competência estão subindo. Focar nos indicadores com maior gap vs meta.</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    {["✓ Resultados HbA1c/VDRL lançados no PEC?","✓ Produção digitalizada até ontem?","✓ Mutirão de puericultura realizado?","✓ Monitor e-Gestor atualizado?"].map(t => (
                      <span key={t} style={{ background: "#1e3a5f", color: "#93c5fd", padding: "3px 10px", borderRadius: 12, fontSize: 11 }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {periodo === "quadrimestral" && (
              <div style={{ background: "linear-gradient(135deg, #061a0e 0%, #07120f 60%, #0a1a1a 100%)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", gap: 16, alignItems: "flex-start", boxShadow: "0 0 30px rgba(34,197,94,0.06)" }}>
                <div style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "8px 10px", flexShrink: 0 }}>
                  <span style={{ fontSize: 18 }}>📊</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 800, color: "#4ade80", fontSize: 14 }}>Q2 Mai–Ago/2026</span>
                    <span style={{ fontSize: 11, color: "#16a34a", background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.25)", padding: "1px 8px", borderRadius: 20 }}>Fechamento 31/Agosto</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#86efac", marginBottom: 10, lineHeight: 1.6 }}>Scores acumulados de maio a agosto. Toda produção lançada até 31/ago contabiliza. Foco em <strong>C2</strong> (pré-natal) e <strong>C6</strong> (puericultura).</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[
                      { t: `${diasRestantes} dias restantes`, cor: "#22c55e" },
                      { t: `${EQUIPES.filter(e => e.pts < 75 && e.risco !== "apurar").length} equipes abaixo de 75 pts`, cor: "#f59e0b" },
                      { t: "CNES TRÊS ESTADOS — regularizar HOJE", cor: "#ef4444" },
                      { t: "Retroativos de gaveta — lançar agora", cor: "#60a5fa" },
                    ].map(({ t, cor }) => (
                      <span key={t} style={{ background: cor + "18", color: cor, border: `1px solid ${cor}35`, padding: "3px 11px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>✓ {t}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12, marginBottom: 28 }}>
              {EQUIPES.map(eq => {
                const isApurar = eq.risco === "apurar";
                const pctBar = isApurar ? 0 : Math.min(100, (eq.pts / 75) * 100);
                const label = isApurar ? "A APURAR" : eq.pts >= 75 ? "ÓTIMO" : eq.pts >= 60 ? "BOM" : "RISCO";
                const labelCor = isApurar ? "#6b7280" : eq.pts >= 75 ? "#22c55e" : eq.pts >= 60 ? "#f59e0b" : "#ef4444";
                const barCor = isApurar ? "#334155" : eq.pts >= 75 ? "#22c55e" : eq.pts >= 60 ? "#f59e0b" : "#ef4444";
                const accentCor = isApurar ? "#334155" : eq.pts >= 75 ? "#16a34a" : eq.pts >= 60 ? "#d97706" : "#dc2626";
                return (
                  <div key={eq.nome} style={{
                    background: "linear-gradient(180deg, #111827 0%, #0f1623 100%)",
                    borderRadius: 12, padding: 0, overflow: "hidden",
                    border: `1px solid rgba(255,255,255,0.07)`,
                    boxShadow: isApurar ? "none" : eq.pts >= 75 ? "0 0 18px rgba(22,163,74,0.12)" : eq.pts < 60 ? "0 0 18px rgba(220,38,38,0.1)" : "none",
                  }}>
                    {/* Accent bar top */}
                    <div style={{ height: 3, background: accentCor, borderRadius: "0" }} />
                    <div style={{ padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: isApurar ? "#64748b" : "#f1f5f9", letterSpacing: 0.2 }}>{eq.nome}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: labelCor, background: labelCor + "20", border: `1px solid ${labelCor}40`, padding: "2px 9px", borderRadius: 20 }}>{label}</span>
                      </div>
                      {isApurar ? (
                        <div style={{ fontSize: 11, color: "#475569", fontStyle: "italic", marginBottom: 10 }}>🔍 Verificar no e-Gestor/SIAPS</div>
                      ) : (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                          <div>
                            <span style={{ fontSize: 28, fontWeight: 800, color: labelCor, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{eq.pts}</span>
                            <span style={{ fontSize: 11, color: "#475569", marginLeft: 4 }}>pts</span>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 11, color: eq.ganho <= 3 ? "#22c55e" : eq.ganho <= 15 ? "#f59e0b" : "#ef4444", fontWeight: 700 }}>+{eq.ganho} necessários</div>
                            <div style={{ fontSize: 10, color: "#334155" }}>para ÓTIMO</div>
                          </div>
                        </div>
                      )}
                      <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pctBar}%`, background: barCor, borderRadius: 3, transition: "width 0.5s ease" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#334155", marginTop: 5 }}>
                        <span>0</span><span style={{ color: "#15803d" }}>75 · ÓTIMO</span><span>100</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* População vinculada por equipe */}
            <div style={{ background: "linear-gradient(180deg, #111827 0%, #0f1623 100%)", borderRadius: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", padding: 20, border: "1px solid rgba(255,255,255,0.07)", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#f8fafc" }}>👥 População Vinculada</span>
                <span style={{ fontSize: 11, color: "#475569" }}>por Equipe · ABR/2026 · SIAPS</span>
              </div>
              <div style={{ fontSize: 11, color: "#334155", marginBottom: 16 }}>
                Ref. 2.500/eSF · máx 3.750 · eRibeirinha: ref. 1.000 · máx 1.500 · Portaria 3.493/2024
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 620 }}>
                  <thead>
                    <tr>
                      {["Equipe","Tipo","Pessoas Vinculadas","Referência","Máximo Financ.","Status","Score"].map(h => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#334155", fontWeight: 700, fontSize: 10, textTransform: "uppercase" as const, letterSpacing: 0.6, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DIAGNOSTICO.map((d, idx) => {
                      const popStatus = d.populacaoVinculada >= d.populacaoRef ? "ok" : d.populacaoVinculada >= d.populacaoRef * 0.8 ? "alerta" : "baixo";
                      const popCor = popStatus === "ok" ? "#22c55e" : popStatus === "alerta" ? "#f59e0b" : "#ef4444";
                      const popLabel = popStatus === "ok" ? "✓ Regular" : popStatus === "alerta" ? "⚠ Abaixo" : "✗ Muito baixo";
                      const eq = EQUIPES.find(e => e.nome === d.nome);
                      const ptsCor = eq ? (eq.pts >= 75 ? "#22c55e" : eq.pts >= 60 ? "#f59e0b" : "#ef4444") : "#94a3b8";
                      const pctBarra = Math.min(100, Math.round((d.populacaoVinculada / d.populacaoMax) * 100));
                      return (
                        <tr key={d.nome} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                          <td style={{ padding: "10px 12px", fontWeight: 700, color: "#e2e8f0", fontSize: 12 }}>{d.nome}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>{d.tipo}</span>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ fontWeight: 800, fontSize: 15, color: popCor, marginBottom: 4, fontVariantNumeric: "tabular-nums" }}>
                              {d.populacaoVinculada === 0 ? <span style={{ color: "#334155", fontSize: 12, fontStyle: "italic" }}>a apurar</span> : d.populacaoVinculada.toLocaleString("pt-BR")}
                            </div>
                            <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, width: 110, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${pctBarra}%`, background: popCor, borderRadius: 2 }} />
                            </div>
                          </td>
                          <td style={{ padding: "10px 12px", color: "#f59e0b", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{d.populacaoRef.toLocaleString("pt-BR")}</td>
                          <td style={{ padding: "10px 12px", color: "#334155", fontVariantNumeric: "tabular-nums" }}>{d.populacaoMax.toLocaleString("pt-BR")}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{ background: popCor + "18", color: popCor, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, border: `1px solid ${popCor}30` }}>{popLabel}</span>
                          </td>
                          <td style={{ padding: "10px 12px", fontWeight: 800, color: ptsCor, fontVariantNumeric: "tabular-nums" }}>{eq ? eq.pts : "—"}</td>
                        </tr>
                      );
                    })}
                    {/* Totais */}
                    <tr style={{ background: "rgba(245,158,11,0.05)", borderTop: "1px solid rgba(245,158,11,0.15)" }}>
                      <td colSpan={2} style={{ padding: "10px 12px", color: "#94a3b8", fontWeight: 700, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Total município</td>
                      <td style={{ padding: "10px 12px", color: "#f59e0b", fontWeight: 800, fontSize: 16, fontVariantNumeric: "tabular-nums" }}>
                        {DIAGNOSTICO.reduce((a, d) => a + d.populacaoVinculada, 0).toLocaleString("pt-BR")}
                      </td>
                      <td colSpan={4} style={{ padding: "10px 12px", color: "#475569", fontSize: 11 }}>
                        pessoas cadastradas em equipes de APS · {DIAGNOSTICO.length} equipes ativas
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resumo financeiro */}
            <div style={{ background: "linear-gradient(135deg, #0a1a10 0%, #070c18 100%)", borderRadius: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", padding: 20, border: "1px solid rgba(34,197,94,0.1)" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#f8fafc" }}>💰 Impacto Financeiro</span>
                <span style={{ fontSize: 11, color: "#475569" }}>BOM → ÓTIMO · Portaria 3.493/2024</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                {[
                  { label: "Diferença ÓTIMO/BOM por equipe/mês", valor: "≈ R$ 2.050", cor: "#22c55e", icon: "📈" },
                  { label: "9 equipes × 12 meses (projeção anual)", valor: "≈ R$ 221.400", cor: "#4ade80", icon: "💵" },
                  { label: "Q2 fechamento — meses acumulados", valor: "3 meses", cor: "#f59e0b", icon: "📅" },
                  { label: "Pagamento retroativo set/2026", valor: "Score Q2", cor: "#60a5fa", icon: "🏦" },
                ].map(item => (
                  <div key={item.label} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${item.cor}20`, borderRadius: 10, padding: "14px 16px", borderLeft: `3px solid ${item.cor}` }}>
                    <div style={{ fontSize: 10, color: "#475569", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: 0.5 }}>{item.icon} {item.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: item.cor, fontVariantNumeric: "tabular-nums" }}>{item.valor}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ABA: Indicadores-Chave ── */}
        {aba === "indicadores" && (
          <div>
            {[
              { ind:"C2", desc:"Pré-natal Adequado (29%)", peso:"MAIOR ALAVANCA", cor:"#ef4444",
                texto:"HbA1c + VDRL na 1ª consulta. Resultado lançado no PEC com tipo correto (pré-natal). Busca ativa de gestantes sem exames.", impacto:"Pode mover 6 equipes de REGULAR para BOM ou ÓTIMO" },
              { ind:"C6", desc:"Puericultura (48%)", peso:"ALTO IMPACTO", cor:"#f59e0b",
                texto:"Consulta de criança <2 anos com peso + altura registrado no PEC. Agenda dedicada 2x/semana. Busca ativa via ACS.", impacto:"Ganho médio estimado +4 pts por equipe" },
              { ind:"C5", desc:"HAS Controlada (66%)", peso:"GANHO RÁPIDO", cor:"#22c55e",
                texto:"Técnico de enfermagem lança PA em TODA consulta de hipertenso. PEC atualizado. PA controlada = PA <140/90 mmHg.", impacto:"Sem custo adicional — só protocolo" },
              { ind:"C1", desc:"Acesso Avaliado (55%)", peso:"MÉDIO IMPACTO", cor:"#3b82f6",
                texto:"Retorno de 30 dias agendado no PEC após cada consulta. Tipo de atendimento correto. Fila zerada de retroativos.", impacto:"+2 pts por equipe com correção de registro" },
              { ind:"B1/B2", desc:"Saúde Bucal (35%)", peso:"SUBESPECIALIDADE", cor:"#8b5cf6",
                texto:"eOE integrada nas expedições. Finalizar tratamentos em andamento no PEC. Dia D de citopatológico + odonto.", impacto:"Maior gap nas equipes ribeirinhas" },
            ].map(item => (
              <div key={item.ind} style={{ background: "linear-gradient(180deg, #111827 0%, #0f1623 100%)", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.3)", padding: 16, marginBottom: 12, borderLeft: `4px solid ${item.cor}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: 16, color: item.cor }}>{item.ind}</span>
                    <span style={{ fontWeight: 600, fontSize: 13, color: "#f1f5f9", marginLeft: 8 }}>{item.desc}</span>
                  </div>
                  <span style={{ background: item.cor + "22", color: item.cor, padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{item.peso}</span>
                </div>
                <p style={{ fontSize: 13, color: "#cbd5e1", marginBottom: 8 }}>{item.texto}</p>
                <div style={{ fontSize: 12, color: "#22c55e", fontWeight: 600 }}>→ {item.impacto}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── ABA: Por Equipe ── */}
        {aba === "equipe" && (
          <div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {EQUIPES.map(eq => (
                <button key={eq.nome} onClick={() => setEquipeAtiva(eq.nome)} style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: equipeAtiva === eq.nome ? 700 : 400,
                  border: `1px solid ${equipeAtiva === eq.nome ? eq.cor : "#334155"}`,
                  background: equipeAtiva === eq.nome ? eq.cor + "22" : "transparent",
                  color: equipeAtiva === eq.nome ? eq.cor : "#94a3b8", cursor: "pointer"
                }}>
                  {eq.nome}
                </button>
              ))}
            </div>

            {(() => {
              const eq = EQUIPES.find(e => e.nome === equipeAtiva)!;
              const diag = DIAGNOSTICO.find(d => d.nome === equipeAtiva);
              const inds = INDICADORES[equipeAtiva] || [];
              const totalPtsDisp = inds.reduce((a,i) => a + i.pts, 0);
              return (
                <div>
                  <div style={{ background: "linear-gradient(180deg, #111827 0%, #0f1623 100%)", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.3)", padding: 20, marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>{eq.nome}</div>
                        {diag && (
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                            <span style={{ background: "#07101e", border: "1px solid rgba(255,255,255,0.07)", color: "#94a3b8", fontSize: 11, padding: "2px 8px", borderRadius: 6, fontFamily: "monospace" }}>
                              🏥 {diag.ubs}
                            </span>
                            <span style={{ background: "#1e3a5f", border: "1px solid #1d4ed8", color: "#93c5fd", fontSize: 11, padding: "2px 8px", borderRadius: 6, fontFamily: "monospace", fontWeight: 700 }}>
                              CNES {diag.cnesUbs}
                            </span>
                            <span style={{ background: "#1a1a3e", border: "1px solid #4338ca", color: "#a5b4fc", fontSize: 11, padding: "2px 8px", borderRadius: 6, fontFamily: "monospace" }}>
                              Equipe {diag.cnesCodEquipe}
                            </span>
                            {diag.ine && (
                              <span style={{ background: "#1c1917", border: "1px solid #78716c", color: "#d6d3d1", fontSize: 11, padding: "2px 8px", borderRadius: 6, fontFamily: "monospace" }} title="Identificador Nacional de Equipes — e-Gestor APS">
                                INE {diag.ine}
                              </span>
                            )}
                            <span style={{ background: "#14532d", border: "1px solid #166534", color: "#86efac", fontSize: 11, padding: "2px 8px", borderRadius: 6 }}>
                              {diag.tipo}
                            </span>
                            {diag.esb && (
                              <span style={{ background: "#1e3a5f", border: "1px solid #0284c7", color: "#7dd3fc", fontSize: 11, padding: "2px 8px", borderRadius: 6 }}>
                                + ESB
                              </span>
                            )}
                            {diag.cnesStatus === "expirado" && (
                              <span style={{ background: "#450a0a", border: "1px solid #ef4444", color: "#fca5a5", fontSize: 11, padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>
                                🚨 CNES EXPIRADO
                              </span>
                            )}
                            {diag.cnesStatus === "apurar" && (
                              <span style={{ background: "#1e293b", border: "1px solid #6b7280", color: "#9ca3af", fontSize: 11, padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>
                                🔍 A APURAR
                              </span>
                            )}
                          </div>
                        )}
                        <div style={{ fontSize: 13, color: "#94a3b8" }}>Score atual: <strong style={{ color: eq.cor }}>{eq.pts} pts</strong> → Meta: <strong style={{ color: "#22c55e" }}>75 pts (ÓTIMO)</strong></div>
                      </div>
                      <div style={{ textAlign: "center", background: "#07101e", borderRadius: 10, padding: "12px 20px", flexShrink: 0 }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: eq.cor }}>+{eq.ganho}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>pontos necessários</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Pontos disponíveis nos indicadores abaixo: <strong style={{ color: "#22c55e" }}>+{totalPtsDisp} pts estimados</strong></div>
                    {totalPtsDisp >= eq.ganho
                      ? <div style={{ fontSize: 12, color: "#22c55e", fontWeight: 600 }}>✅ Viável atingir ÓTIMO com as ações listadas</div>
                      : <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>⚠️ Requer intervenção extraordinária além dos indicadores listados</div>
                    }
                  </div>

                  {/* Alerta CNES expirado */}
                  {diag && diag.cnesStatus === "expirado" && (
                    <div style={{ background: "#450a0a", border: "1px solid #ef4444", borderRadius: 10, padding: 16, marginBottom: 16 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                        <AlertTriangle size={18} color="#ef4444" />
                        <span style={{ fontWeight: 700, color: "#ef4444", fontSize: 14 }}>AÇÃO IMEDIATA — CNES EXPIRADO</span>
                      </div>
                      <p style={{ fontSize: 13, color: "#fca5a5", margin: 0 }}>
                        O CNES da equipe <strong>{eq.nome}</strong> está com vínculos expirados. <strong>Toda a produção registrada está sendo descartada pelo e-Gestor.</strong> Contato urgente com RH/SMS para reativar os vínculos no SCNES antes de qualquer outra ação. Telefone e-Gestor: <strong>0800 722 4310</strong>.
                      </p>
                    </div>
                  )}

                  {/* Diagnóstico SCNES — composição, população e pendências */}
                  {diag && (
                    <div style={{ background: "linear-gradient(180deg, #111827 0%, #0f1623 100%)", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.3)", padding: 18, marginBottom: 16, border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                        <FileText size={15} color="#94a3b8" />
                        Diagnóstico SCNES — Competência 07/2026
                      </div>

                      {/* Composição da equipe */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Composição</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
                          {[
                            { label: "Médico", dados: diag.medico },
                            { label: "Enfermeiro", dados: diag.enfermeiro },
                            { label: "Téc. Enfermagem", dados: diag.tecEnf },
                          ].map(({ label, dados }) => (
                            <div key={label} style={{ background: "#07101e", borderRadius: 8, padding: "10px 12px", border: `1px solid ${dados.cnes === "EXPIRADO" ? "#7f1d1d" : dados.cnes === "A APURAR" ? "#374151" : "#1e3a5f"}` }}>
                              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>{label}</div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: dados.cnes === "EXPIRADO" ? "#fca5a5" : dados.cnes === "A APURAR" ? "#9ca3af" : "#f1f5f9" }}>{dados.nome}</div>
                              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                                <span style={{ fontSize: 10, color: "#64748b" }}>CBO {dados.cbo}</span>
                                <span style={{ fontSize: 10, color: dados.vinculo === "Desatualizado" ? "#ef4444" : dados.vinculo === "A apurar" ? "#9ca3af" : "#22c55e" }}>• {dados.vinculo}</span>
                              </div>
                            </div>
                          ))}
                          <div style={{ background: "#07101e", borderRadius: 8, padding: "10px 12px", border: "1px solid #1e3a5f" }}>
                            <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>ACS</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: diag.acs >= diag.acsMin ? "#f1f5f9" : "#fca5a5" }}>
                              {diag.acs} agentes {diag.acs < diag.acsMin && <span style={{ color: "#ef4444" }}>(mín. {diag.acsMin})</span>}
                            </div>
                            <div style={{ fontSize: 10, color: diag.acs >= diag.acsMin ? "#22c55e" : "#ef4444", marginTop: 4 }}>
                              {diag.acs >= diag.acsMin ? "✓ Mínimo atendido" : "⚠ Abaixo do mínimo"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* População vinculada */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>População Vinculada</div>
                        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                          <div style={{ fontSize: 22, fontWeight: 800, color: diag.populacaoVinculada >= diag.populacaoRef ? "#22c55e" : diag.populacaoVinculada >= diag.populacaoRef * 0.8 ? "#f59e0b" : "#ef4444" }}>
                            {diag.populacaoVinculada.toLocaleString("pt-BR")}
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>
                            <div>Referência: {diag.populacaoRef.toLocaleString("pt-BR")} pessoas</div>
                            <div>Máximo financ.: {diag.populacaoMax.toLocaleString("pt-BR")} pessoas</div>
                          </div>
                          <div style={{ flex: 1, minWidth: 120 }}>
                            <div style={{ height: 6, background: "#334155", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${Math.min(100, Math.round((diag.populacaoVinculada / diag.populacaoMax) * 100))}%`, background: diag.populacaoVinculada >= diag.populacaoRef ? "#22c55e" : "#f59e0b", borderRadius: 3 }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Pendências */}
                      {diag.pendencias.length > 0 && (
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Pendências SCNES</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {diag.pendencias.map((p, i) => (
                              <div key={i} style={{ background: "#07101e", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: p.startsWith("🚨") ? "#fca5a5" : p.startsWith("⚠") ? "#fde68a" : "#94a3b8", borderLeft: `3px solid ${p.startsWith("🚨") ? "#ef4444" : p.startsWith("⚠") ? "#f59e0b" : "#475569"}` }}>
                                {p}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Observação */}
                      {diag.obs && (
                        <div style={{ background: "#07101e", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#64748b", borderLeft: "3px solid #334155", fontStyle: "italic" }}>
                          {diag.obs}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {inds.map(ind => (
                      <div key={ind.ind} style={{ background: "#1e293b", borderRadius: 8, padding: 14, display: "flex", gap: 14, alignItems: "flex-start" }}>
                        <div style={{ minWidth: 48, textAlign: "center" }}>
                          <div style={{ fontWeight: 800, fontSize: 15, color: "#f59e0b" }}>{ind.ind}</div>
                          <div style={{ fontSize: 10, color: "#64748b" }}>{ind.atual}%</div>
                          <div style={{ fontSize: 10, color: "#22c55e" }}>meta {ind.meta}%</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "#f1f5f9", marginBottom: 4 }}>{ind.desc}</div>
                          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>{ind.acao}</div>
                          <div style={{ height: 6, background: "#334155", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${ind.atual}%`, background: ind.atual >= ind.meta ? "#22c55e" : ind.atual >= 50 ? "#f59e0b" : "#ef4444", borderRadius: 3 }} />
                          </div>
                        </div>
                        <div style={{ minWidth: 36, textAlign: "center", background: "#22c55e22", borderRadius: 6, padding: "4px 8px" }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#22c55e" }}>+{ind.pts}</div>
                          <div style={{ fontSize: 9, color: "#64748b" }}>pts est.</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── ABA: Checklist ── */}
        {aba === "checklist" && (
          <div>
            {/* Barra progresso */}
            <div style={{ background: "linear-gradient(180deg, #111827 0%, #0f1623 100%)", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.3)", padding: 16, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>Progresso Total do Sprint</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#22c55e" }}>{feitos}/{totalChecks} ({pct}%)</span>
              </div>
              <div style={{ height: 12, background: "#334155", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #22c55e, #16a34a)", borderRadius: 6, transition: "width 0.4s" }} />
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>Meta: {totalChecks}/{totalChecks} até 20/agosto</div>
            </div>

            {FRENTES.map(frente => {
              const itens = CHECKLIST.filter(c => c.frente === frente);
              const cor = FRENTE_COR[frente] || "#94a3b8";
              return (
                <div key={frente} style={{ background: "linear-gradient(180deg, #111827 0%, #0f1623 100%)", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.3)", padding: 16, marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: cor, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: cor, display: "inline-block" }} />
                    Frente {frente}
                  </div>
                  {itens.map(item => (
                    <div key={item.id} onClick={() => toggle(item.id)} style={{
                      display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0",
                      borderBottom: "1px solid #0f172a", cursor: "pointer",
                      opacity: checks[item.id] ? 0.6 : 1
                    }}>
                      <div style={{ marginTop: 1, flexShrink: 0 }}>
                        {checks[item.id]
                          ? <CheckSquare size={16} color="#22c55e" />
                          : <Square size={16} color="#64748b" />
                        }
                      </div>
                      <span style={{ fontSize: 13, color: checks[item.id] ? "#64748b" : "#cbd5e1", textDecoration: checks[item.id] ? "line-through" : "none" }}>
                        {item.texto}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}

            <div style={{ background: "#1e3a5f", borderRadius: 10, padding: 16, border: "1px solid #1e40af" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <Clock size={14} color="#3b82f6" />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#93c5fd" }}>Prazo crítico</span>
              </div>
              <p style={{ fontSize: 12, color: "#bfdbfe", margin: 0 }}>
                O e-Gestor fecha competências por volta do dia 20 do mês seguinte. Para garantir que agosto/2026 seja contabilizado no Q2,
                confirme todos os registros no PEC até <strong>20/agosto</strong>. Monitoramento semanal toda segunda-feira.
              </p>
            </div>
          </div>
        )}

        {/* ── ABA: Inconsistências ── */}
        {aba === "inconsistencias" && (() => {
          const INCONSISTENCIAS = [
            {
              gravidade: "critico", label: "CRÍTICO", cor: "#ef4444", bg: "rgba(239,68,68,0.08)", borda: "rgba(239,68,68,0.3)",
              equipe: "ESTRADA NOVA", tipo: "CBO incorreto — Composição Mínima ESF",
              descricao: "RUDINEI SIMONETTI cadastrado com CBO 322250 (Auxiliar de Enfermagem ESF). A composição mínima exige CBO 322245 (Técnico de Enfermagem ESF). Auxiliar é nível inferior e pode invalidar o reconhecimento da equipe.",
              acao: "Solicitar ao RH atualizar CBO de 322250 para 322245 no SCNES 9942122 (UBS Claudia Pereira dos Santos Damacena). CNS: 706204085033060.",
              fonte: "SCNES 07/2026",
            },
            {
              gravidade: "critico", label: "CRÍTICO", cor: "#ef4444", bg: "rgba(239,68,68,0.08)", borda: "rgba(239,68,68,0.3)",
              equipe: "JK", tipo: "ESB ausente do SIAPS Q1/26",
              descricao: "A Equipe de Saúde Bucal da JK está ativa no SCNES desde 06/06/2023 (CNES 4184688), mas não aparece na Nota Final do Componente de Qualidade Q1/26. Produção odontológica pode não estar sendo reconhecida.",
              acao: "Verificar no e-Gestor se a ESB JK tem produção lançada. Confirmar se INE da ESB está correto no e-Gestor/SIAPS. Contato suporte: 0800 722 4310.",
              fonte: "SIAPS Q1/2026",
            },
            {
              gravidade: "medio", label: "MÉDIO", cor: "#f59e0b", bg: "rgba(245,158,11,0.08)", borda: "rgba(245,158,11,0.3)",
              equipe: "JK", tipo: "CBO genérico — Técnico de Enfermagem",
              descricao: "MARIA ANTONIA MIRANDA BARROS cadastrada com CBO 322205 (Técnico de Enfermagem genérico). Na equipe ESF o CBO correto é 322245 (Técnico de Enfermagem da ESF). A equipe JK já conta com JAMILLY e REJANE (ambas 322245).",
              acao: "Atualizar CBO de MARIA ANTONIA para 322245 no SCNES 4184688, ou verificar se o vínculo deve ser removido da equipe. CNS: 705408412586591.",
              fonte: "SCNES 07/2026",
            },
            {
              gravidade: "medio", label: "MÉDIO", cor: "#f59e0b", bg: "rgba(245,158,11,0.08)", borda: "rgba(245,158,11,0.3)",
              equipe: "CACHOEIRA", tipo: "CBO legado — Auxiliar de Enfermagem",
              descricao: "ELILDA DIAS HISTER cadastrada com CBO 322230 (Auxiliar de Enfermagem) desde 01/09/2009. Vínculo anterior à padronização ESF. CBO 322230 não corresponde ao perfil exigido para equipes ESF (322245).",
              acao: "Verificar no e-Gestor se ELILDA compõe oficialmente a equipe ou se é vínculo legado. Se for composição, atualizar CBO para 322245. Se não for da equipe, desvincular no SCNES 3320138. CNS: 704104879343850.",
              fonte: "SCNES 07/2026",
            },
            {
              gravidade: "medio", label: "MÉDIO", cor: "#f59e0b", bg: "rgba(245,158,11,0.08)", borda: "rgba(245,158,11,0.3)",
              equipe: "TRÊS ESTADOS", tipo: "CBO não-ESF — Atendente de Enfermagem",
              descricao: "MARINETE RIBEIRO DE ARAÚJO SOARES cadastrada com CBO 515110 (Atendente de Enfermagem) na equipe. CBO 515110 não é perfil ESF padrão — não é ACS (515105), não é técnico (322245). Vínculo irregular.",
              acao: "Verificar no SCNES 9934448 se MARINETE está vinculada à equipe ESF ou ao estabelecimento. Se for vínculo incorreto, corrigir ou remover. CNS: 706409674985182.",
              fonte: "SCNES 07/2026",
            },
            {
              gravidade: "medio", label: "MÉDIO", cor: "#f59e0b", bg: "rgba(245,158,11,0.08)", borda: "rgba(245,158,11,0.3)",
              equipe: "AREAL", tipo: "Duplicidade — 2 Enfermeiros na mesma equipe",
              descricao: "ALINE COSTA DA SILVA (entrada 03/06/2024) e ALAN ALEXANDER HISTER (entrada 13/11/2024), ambos CBO 223565 (Enfermeiro da ESF), cadastrados na mesma equipe AREAL. ESF admite 1 enfermeiro na composição mínima.",
              acao: "Definir no e-Gestor/SCNES 2013290 qual enfermeiro é o oficial da equipe AREAL. O outro deve ser desvinculado da equipe ou alocado em outro cargo. CNS ALINE: 708604555293783 · CNS ALAN: 703002880074478.",
              fonte: "SCNES 07/2026",
            },
            {
              gravidade: "atencao", label: "ATENÇÃO", cor: "#38bdf8", bg: "rgba(56,189,248,0.07)", borda: "rgba(56,189,248,0.25)",
              equipe: "KENNEDY", tipo: "ESB Q1/26 no limite exato Bom/Ótimo",
              descricao: "ESB KENNEDY (INE 0001773984) obteve nota 7.5 no Q1/26 — exatamente no limite entre Bom (5–7.5) e Ótimo (>7.5). Qualquer redução na produção odontológica em Q2/26 resulta em queda de classificação.",
              acao: "Monitorar semanalmente a produção da ESB KENNEDY no e-Gestor. Garantir que todas as consultas odontológicas sejam registradas no PEC. Meta: manter nota >7.5 no Q2/26.",
              fonte: "SIAPS Q1/2026",
            },
            {
              gravidade: "atencao", label: "ATENÇÃO", cor: "#38bdf8", bg: "rgba(56,189,248,0.07)", borda: "rgba(56,189,248,0.25)",
              equipe: "CACHOEIRA", tipo: "Modalidade indefinida — eSF vs. eRibeirinha",
              descricao: "SIAPS ABR/26 classifica CACHOEIRA como eSF (parâmetro ref. 2.500), mas a operação real é de equipe ribeirinha. Se o cofinanciamento correto for eRibeirinha (ref. 1.000), a meta de vínculos e os parâmetros financeiros mudam.",
              acao: "Verificar no e-Gestor qual modalidade de cofinanciamento está ativa para CACHOEIRA. Se for eRibeirinha, solicitar à SMS a mudança cadastral e atualizar os parâmetros no sistema.",
              fonte: "SIAPS ABR/2026",
            },
          ];

          const criticos = INCONSISTENCIAS.filter(i => i.gravidade === "critico");
          const medios = INCONSISTENCIAS.filter(i => i.gravidade === "medio");
          const atencao = INCONSISTENCIAS.filter(i => i.gravidade === "atencao");

          const CardInc = ({ inc }: { inc: typeof INCONSISTENCIAS[0] }) => (
            <div style={{ background: inc.bg, border: `1px solid ${inc.borda}`, borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ flexShrink: 0, marginTop: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: inc.cor, background: `rgba(0,0,0,0.25)`, padding: "2px 8px", borderRadius: 20, border: `1px solid ${inc.borda}` }}>{inc.label}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: 13, color: "#f1f5f9" }}>{inc.equipe}</span>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>— {inc.tipo}</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: "#cbd5e1", margin: "0 0 8px 0", lineHeight: 1.6 }}>{inc.descricao}</p>
                  <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 6, padding: "8px 10px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Ação: </span>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{inc.acao}</span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, color: "#475569" }}>Fonte: {inc.fonte}</div>
                </div>
              </div>
            </div>
          );

          return (
            <div>
              {/* Resumo */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 20 }}>
                {[
                  { label: "Críticos", count: criticos.length, cor: "#ef4444", bg: "rgba(239,68,68,0.1)", borda: "rgba(239,68,68,0.25)" },
                  { label: "Médios", count: medios.length, cor: "#f59e0b", bg: "rgba(245,158,11,0.1)", borda: "rgba(245,158,11,0.25)" },
                  { label: "Atenção", count: atencao.length, cor: "#38bdf8", bg: "rgba(56,189,248,0.08)", borda: "rgba(56,189,248,0.2)" },
                  { label: "Total", count: INCONSISTENCIAS.length, cor: "#94a3b8", bg: "rgba(148,163,184,0.07)", borda: "rgba(148,163,184,0.15)" },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.borda}`, borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: s.cor, fontVariantNumeric: "tabular-nums" }}>{s.count}</div>
                    <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Fonte */}
              <div style={{ fontSize: 11, color: "#475569", marginBottom: 16 }}>
                Varredura: SCNES 07/2026 · SIAPS Q1/2026 · Competência gerada 22/07/2026
              </div>

              {criticos.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>🚨 Críticos — risco de impacto no financiamento</div>
                  {criticos.map((inc, i) => <CardInc key={i} inc={inc} />)}
                </div>
              )}
              {medios.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>⚠ Médios — regularizar no SCNES</div>
                  {medios.map((inc, i) => <CardInc key={i} inc={inc} />)}
                </div>
              )}
              {atencao.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>⚡ Atenção — monitorar</div>
                  {atencao.map((inc, i) => <CardInc key={i} inc={inc} />)}
                </div>
              )}
            </div>
          );
        })()}

      </div>
    </div>
  );
}
