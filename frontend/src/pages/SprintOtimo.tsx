// src/pages/SprintOtimo.tsx — Sprint ÓTIMO Q2 Mai–Ago/2026
import { useState, useEffect } from "react";
import { Trophy, Target, Zap, CheckSquare, Square, TrendingUp, AlertTriangle, Clock, Users, UserCheck, ShieldAlert, FileText } from "lucide-react";

// ── Dados das equipes ──────────────────────────────────────────────────────
const EQUIPES = [
  { nome: "KENNEDY",      pts: 74.5, meta: 75, risco: "baixo",  ganho: 0.5,  cor: "#22c55e" },
  { nome: "JK",           pts: 66.5, meta: 75, risco: "medio",  ganho: 8.5,  cor: "#f59e0b" },
  { nome: "ACARI",        pts: 64.9, meta: 75, risco: "medio",  ganho: 10.1, cor: "#f59e0b" },
  { nome: "JUMA",         pts: 60.0, meta: 75, risco: "alto",   ganho: 15.0, cor: "#ef4444" },
  { nome: "ESTRADA NOVA", pts: 59.2, meta: 75, risco: "alto",   ganho: 15.8, cor: "#ef4444" },
  { nome: "LIBERDADE",    pts: 58.2, meta: 75, risco: "alto",   ganho: 16.8, cor: "#ef4444" },
  { nome: "SÃO SEBASTIÃO",pts: 56.1, meta: 75, risco: "alto",   ganho: 18.9, cor: "#ef4444" },
  { nome: "CACHOEIRA",    pts: 52.6, meta: 75, risco: "critico",ganho: 22.4, cor: "#dc2626" },
  { nome: "TRÊS ESTADOS", pts: 44.1, meta: 75, risco: "critico",ganho: 30.9, cor: "#b91c1c" },
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
];

const FRENTE_COR: Record<string,string> = {
  "Sistema":    "#ef4444",
  "Clínica":    "#f59e0b",
  "ACS":        "#f59e0b",
  "Retroativo": "#3b82f6",
  "Fechamento": "#3b82f6",
};

// ── Dados de Diagnóstico de Composição ────────────────────────────────────
// Parâmetro Apuí: município 20.001–50.000 hab → ref. 2.500 vínculos/eSF, máx 3.750
const DIAGNOSTICO = [
  {
    nome: "KENNEDY",
    ubs: "UBS Kennedy",
    tipo: "eSF",
    cnesStatus: "regular",
    medico: { nome: "Dr. Gilmar Oliveira", cbo: "225125", cnes: "OK", vinculo: "Estatutário" },
    enfermeiro: { nome: "Enf. Patrícia Lima", cbo: "223505", cnes: "OK", vinculo: "Estatutário" },
    tecEnf: { nome: "Téc. Rosângela Silva", cbo: "322205", cnes: "OK", vinculo: "Estatutário" },
    acs: 5, acsMin: 4,
    populacaoVinculada: 2680,
    populacaoRef: 2500,
    populacaoMax: 3750,
    pendencias: [],
    obs: "Equipe dentro dos parâmetros. Manter monitoramento mensal de vínculos no SCNES.",
  },
  {
    nome: "JK",
    ubs: "UBS JK",
    tipo: "eSF",
    cnesStatus: "regular",
    medico: { nome: "Dr. Anízio Ferreira", cbo: "225125", cnes: "OK", vinculo: "Contratado" },
    enfermeiro: { nome: "Enf. Marcela Santos", cbo: "223505", cnes: "OK", vinculo: "Estatutário" },
    tecEnf: { nome: "Téc. Ana Paula Costa", cbo: "322205", cnes: "OK", vinculo: "Estatutário" },
    acs: 4, acsMin: 4,
    populacaoVinculada: 2420,
    populacaoRef: 2500,
    populacaoMax: 3750,
    pendencias: ["INE compartilhado com ACARI — dividir no SCNES"],
    obs: "INE vinculado a dois territórios. Separar imediatamente para evitar mistura de produção no e-Gestor.",
  },
  {
    nome: "ACARI",
    ubs: "UBS Anízio Ferreira",
    tipo: "eSF",
    cnesStatus: "regular",
    medico: { nome: "Dr. Anízio Ferreira", cbo: "225125", cnes: "OK", vinculo: "Contratado" },
    enfermeiro: { nome: "Enf. Cláudia Rocha", cbo: "223505", cnes: "OK", vinculo: "Estatutário" },
    tecEnf: { nome: "Téc. Fátima Alves", cbo: "322205", cnes: "OK", vinculo: "Estatutário" },
    acs: 4, acsMin: 3,
    populacaoVinculada: 1980,
    populacaoRef: 2500,
    populacaoMax: 3750,
    pendencias: ["INE compartilhado com SÃO SEBASTIÃO — dividir no SCNES"],
    obs: "População abaixo da referência (1.980 vs 2.500). Verificar se território está completo no cadastro.",
  },
  {
    nome: "JUMA",
    ubs: "UBS Curumim / Juma",
    tipo: "eSF",
    cnesStatus: "regular",
    medico: { nome: "Dr. Curumim", cbo: "225125", cnes: "OK", vinculo: "Contratado" },
    enfermeiro: { nome: "Enf. Maria José", cbo: "223505", cnes: "OK", vinculo: "Estatutário" },
    tecEnf: { nome: "Téc. Valdete Cruz", cbo: "322205", cnes: "OK", vinculo: "Estatutário" },
    acs: 3, acsMin: 3,
    populacaoVinculada: 1650,
    populacaoRef: 2500,
    populacaoMax: 3750,
    pendencias: ["INE compartilhado com LIBERDADE — dividir no SCNES"],
    obs: "Equipe ribeirinha. Fichas CDS das expedições devem ser digitalizadas mensalmente. INE precisa ser separado.",
  },
  {
    nome: "ESTRADA NOVA",
    ubs: "UBS Estrada Nova",
    tipo: "eSF",
    cnesStatus: "regular",
    medico: { nome: "Dr. Roberto Nunes", cbo: "225125", cnes: "OK", vinculo: "Contratado" },
    enfermeiro: { nome: "Enf. Simone Borges", cbo: "223505", cnes: "OK", vinculo: "Estatutário" },
    tecEnf: { nome: "Téc. Lúcia Ferreira", cbo: "322205", cnes: "OK", vinculo: "Estatutário" },
    acs: 4, acsMin: 3,
    populacaoVinculada: 2150,
    populacaoRef: 2500,
    populacaoMax: 3750,
    pendencias: [],
    obs: "Composição mínima atendida. Fortalecer digitalização de produção e agenda de puericultura.",
  },
  {
    nome: "LIBERDADE",
    ubs: "UBS Curumim / Liberdade",
    tipo: "eSF",
    cnesStatus: "regular",
    medico: { nome: "Dr. Curumim", cbo: "225125", cnes: "OK", vinculo: "Contratado" },
    enfermeiro: { nome: "Enf. Teresinha Mota", cbo: "223505", cnes: "OK", vinculo: "Estatutário" },
    tecEnf: { nome: "Téc. Adriana Pinto", cbo: "322205", cnes: "OK", vinculo: "Estatutário" },
    acs: 3, acsMin: 3,
    populacaoVinculada: 1480,
    populacaoRef: 2500,
    populacaoMax: 3750,
    pendencias: ["INE compartilhado com JUMA — dividir no SCNES"],
    obs: "Equipe com menor cobertura populacional. Verificar se há área descoberta no território.",
  },
  {
    nome: "SÃO SEBASTIÃO",
    ubs: "UBS Anízio Ferreira / São Sebastião",
    tipo: "eSF",
    cnesStatus: "regular",
    medico: { nome: "Dr. Anízio Ferreira", cbo: "225125", cnes: "OK", vinculo: "Contratado" },
    enfermeiro: { nome: "Enf. Beatriz Lima", cbo: "223505", cnes: "OK", vinculo: "Estatutário" },
    tecEnf: { nome: "Téc. Joana Sousa", cbo: "322205", cnes: "OK", vinculo: "Estatutário" },
    acs: 3, acsMin: 3,
    populacaoVinculada: 1720,
    populacaoRef: 2500,
    populacaoMax: 3750,
    pendencias: ["INE compartilhado com ACARI — dividir no SCNES"],
    obs: "Médico compartilhado com ACARI e JK. Verificar carga horária e distribuição de atendimentos no PEC.",
  },
  {
    nome: "CACHOEIRA",
    ubs: "UBS Cachoeira / Ribeirinha",
    tipo: "eRibeirinha",
    cnesStatus: "regular",
    medico: { nome: "Dr. Pedro Matias", cbo: "225125", cnes: "OK", vinculo: "Contratado" },
    enfermeiro: { nome: "Enf. Cristiane Nunes", cbo: "223505", cnes: "OK", vinculo: "Estatutário" },
    tecEnf: { nome: "Téc. Solange Dias", cbo: "322205", cnes: "OK", vinculo: "Estatutário" },
    acs: 2, acsMin: 2,
    populacaoVinculada: 820,
    populacaoRef: 1000,
    populacaoMax: 1500,
    pendencias: ["Fichas CDS das expedições de jun e jul não digitalizadas"],
    obs: "Equipe Ribeirinha com menor população adscrita por natureza do território. Principal gap: digitalização das fichas CDS das expedições fluviais.",
  },
  {
    nome: "TRÊS ESTADOS",
    ubs: "UBS Três Estados",
    tipo: "eSF",
    cnesStatus: "expirado",
    medico: { nome: "Dr. (a confirmar)", cbo: "225125", cnes: "EXPIRADO", vinculo: "Desatualizado" },
    enfermeiro: { nome: "Enf. (a confirmar)", cbo: "223505", cnes: "EXPIRADO", vinculo: "Desatualizado" },
    tecEnf: { nome: "Téc. (a confirmar)", cbo: "322205", cnes: "EXPIRADO", vinculo: "Desatualizado" },
    acs: 2, acsMin: 2,
    populacaoVinculada: 980,
    populacaoRef: 2500,
    populacaoMax: 3750,
    pendencias: [
      "🚨 Vínculos do médico expirados no SCNES — RH/SMS deve reativar HOJE",
      "🚨 Vínculos dos ACS expirados no SCNES",
      "🚨 Toda produção está sendo descartada pelo e-Gestor",
      "População vinculada muito abaixo da referência (980 vs 2.500)",
      "Verificar se território está cadastrado completamente",
    ],
    obs: "SITUAÇÃO CRÍTICA: sem a regularização do SCNES, nenhuma produção desta equipe é reconhecida pelo Ministério da Saúde para fins de financiamento. Ligar para o e-Gestor: 0800 722 4310.",
  },
];

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
  const [aba, setAba] = useState<"visao"|"indicadores"|"equipe"|"checklist"|"diagnostico">("visao");
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
    <div style={{ padding: "0 0 40px 0", fontFamily: "Inter, system-ui, sans-serif", background: "var(--bg, #0f172a)", minHeight: "100vh", color: "var(--fg, #f1f5f9)" }}>

      {/* ── Header ── */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #14532d 100%)", borderBottom: "1px solid #1e293b", padding: "14px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <Trophy size={20} color="#f59e0b" />
              <span style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9" }}>SPRINT ÓTIMO — Meta: ≥75 pts em TODAS as equipes</span>
            </div>

            {/* Município editável */}
            {editandoMunicipio ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
                <input
                  value={municipioNome}
                  onChange={e => setMunicipioNome(e.target.value)}
                  placeholder="Nome do município"
                  style={{ background: "#0f172a", border: "1px solid #3b82f6", borderRadius: 6, color: "#f1f5f9", padding: "5px 10px", fontSize: 12, width: 160, outline: "none" }}
                />
                <select value={municipioUF} onChange={e => setMunicipioUF(e.target.value)}
                  style={{ background: "#0f172a", border: "1px solid #3b82f6", borderRadius: 6, color: "#f1f5f9", padding: "5px 8px", fontSize: 12, outline: "none" }}>
                  {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
                <input
                  value={municipioIBGE}
                  onChange={e => setMunicipioIBGE(e.target.value)}
                  placeholder="IBGE"
                  style={{ background: "#0f172a", border: "1px solid #3b82f6", borderRadius: 6, color: "#f1f5f9", padding: "5px 10px", fontSize: 12, width: 90, outline: "none" }}
                />
                <button onClick={() => setEditandoMunicipio(false)}
                  style={{ background: "#166534", color: "#bbf7d0", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  ✓ Confirmar
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "#94a3b8" }}>
                  📍 <strong style={{ color: "#f1f5f9" }}>{municipioNome}/{municipioUF}</strong>
                  {municipioIBGE && <span style={{ color: "#64748b" }}> · IBGE {municipioIBGE}</span>}
                  <span style={{ color: "#64748b" }}> · Portaria GM/MS 3.493/2024 · Componente Qualidade</span>
                </span>
                <button onClick={() => setEditandoMunicipio(true)}
                  style={{ background: "#1e3a5f", color: "#93c5fd", border: "1px solid #1e40af", borderRadius: 6, padding: "2px 10px", fontSize: 11, cursor: "pointer" }}>
                  ✏️ Trocar município
                </button>
              </div>
            )}

            {/* Seletor de período */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {PERIODOS.map(p => (
                <button key={p.key} onClick={() => setPeriodo(p.key as any)}
                  style={{
                    padding: "4px 14px", borderRadius: 20, fontSize: 11, fontWeight: periodo === p.key ? 700 : 500,
                    border: `1px solid ${periodo === p.key ? "#22c55e" : "#334155"}`,
                    background: periodo === p.key ? "#14532d" : "#0f172a",
                    color: periodo === p.key ? "#bbf7d0" : "#64748b",
                    cursor: "pointer"
                  }}>
                  {p.label}
                </button>
              ))}
              <span style={{ fontSize: 11, color: "#475569", alignSelf: "center", paddingLeft: 4 }}>{periodoAtual.desc}</span>
            </div>
          </div>

          {/* Countdown */}
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", lineHeight: 1 }}>{diasRestantes}</div>
              <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: 1 }}>DIAS</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", lineHeight: 1 }}>{horasRestantes}</div>
              <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: 1 }}>HORAS</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Badges resumo ── */}
      <div style={{ display: "flex", gap: 8, padding: "10px 24px", flexWrap: "wrap", alignItems: "center", background: "#0f172a", borderBottom: "1px solid #1e293b" }}>
        <span style={{ background: "#166534", color: "#bbf7d0", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>🏆 Meta ≥75 pts</span>
        <span style={{ background: "#7f1d1d", color: "#fca5a5", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>5 equipes em risco crítico</span>
        <span style={{ background: "#1e3a5f", color: "#93c5fd", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{diasRestantes} dias de sprint</span>
        <span style={{ background: "#3730a3", color: "#c7d2fe", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>Checklist {feitos}/{totalChecks}</span>
        <span style={{ background: periodo === "diaria" ? "#7c3aed" : periodo === "mensal" ? "#0f4c81" : "#14532d", color: "#fff", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
          {periodoAtual.label}
        </span>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 0, padding: "0 24px 0 24px", borderBottom: "1px solid #1e293b", flexWrap: "wrap" }}>
        {([
          { key: "visao",        label: "📊 Visão Geral" },
          { key: "diagnostico",  label: "🔍 Diagnóstico de Equipe" },
          { key: "indicadores",  label: "📈 Indicadores-Chave" },
          { key: "equipe",       label: "👥 Por Equipe" },
          { key: "checklist",    label: "✅ Checklist" },
        ] as {key: "visao"|"indicadores"|"equipe"|"checklist"|"diagnostico"; label: string}[]).map(t => (
          <button key={t.key} onClick={() => setAba(t.key)} style={{
            padding: "9px 16px", fontSize: 12.5, fontWeight: aba === t.key ? 700 : 400,
            border: "none", borderBottom: aba === t.key ? "2px solid #22c55e" : "2px solid transparent",
            background: "transparent", color: aba === t.key ? "#22c55e" : "#94a3b8",
            cursor: "pointer", marginBottom: -1, whiteSpace: "nowrap"
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "20px 24px" }}>

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
                    border: `1px solid ${diagEquipe === eq.nome ? (eq.cnesStatus === "expirado" ? "#ef4444" : "#22c55e") : "#334155"}`,
                    background: diagEquipe === eq.nome ? (eq.cnesStatus === "expirado" ? "#450a0a" : "#14532d") : "transparent",
                    color: diagEquipe === eq.nome ? (eq.cnesStatus === "expirado" ? "#fca5a5" : "#bbf7d0") : "#94a3b8",
                  }}>
                    {eq.cnesStatus === "expirado" ? "🚨 " : ""}{eq.nome}
                  </button>
                ))}
              </div>

              {/* Alerta crítico CNES */}
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>

                {/* Card composição mínima */}
                <div style={{ background: "#1e293b", borderRadius: 10, padding: 18, border: "1px solid #334155" }}>
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
                  <div style={{ marginTop: 10, padding: "8px 0", borderTop: "1px solid #334155" }}>
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
                <div style={{ background: "#1e293b", borderRadius: 10, padding: 18, border: "1px solid #334155" }}>
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
                <div style={{ background: "#1e293b", borderRadius: 10, padding: 16, marginBottom: 14, border: "1px solid #b45309" }}>
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
              <div style={{ background: "#0f172a", borderRadius: 10, padding: 16, border: "1px solid #1e3a5f", marginBottom: 14 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <FileText size={14} color="#3b82f6" />
                  <span style={{ fontWeight: 700, fontSize: 12, color: "#3b82f6" }}>Observação Técnica</span>
                </div>
                <p style={{ fontSize: 13, color: "#cbd5e1", margin: 0 }}>{d.obs}</p>
              </div>

              {/* Fundamentação legal */}
              <div style={{ background: "#1e293b", borderRadius: 10, padding: 16, border: "1px solid #334155" }}>
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
              <div style={{ background: "#052e16", border: "1px solid #166534", borderRadius: 10, padding: 14, marginBottom: 16, display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ fontSize: 22 }}>📊</span>
                <div>
                  <div style={{ fontWeight: 700, color: "#86efac", marginBottom: 4 }}>Q2 Mai–Ago/2026 — Fechamento em 31/Agosto</div>
                  <div style={{ fontSize: 12, color: "#4ade80" }}>Este é o quadrimestre que define o pagamento de setembro. Scores acumulados de maio a agosto. Toda produção lançada até 31/ago será contabilizada. Foco total em C2 (pré-natal) e C6 (puericultura).</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    {[`✓ ${diasRestantes} dias restantes`,`✓ ${5} equipes abaixo de 75 pts`,"✓ CNES TRÊS ESTADOS — regularizar HOJE","✓ Retroativos de gaveta — lançar agora"].map(t => (
                      <span key={t} style={{ background: "#14532d", color: "#86efac", padding: "3px 10px", borderRadius: 12, fontSize: 11 }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginBottom: 24 }}>
              {EQUIPES.map(eq => {
                const pctBar = Math.min(100, (eq.pts / 75) * 100);
                const label = eq.pts >= 75 ? "ÓTIMO" : eq.pts >= 60 ? "BOM" : "RISCO";
                const labelCor = eq.pts >= 75 ? "#22c55e" : eq.pts >= 60 ? "#f59e0b" : "#ef4444";
                return (
                  <div key={eq.nome} style={{ background: "#1e293b", borderRadius: 10, padding: 16, border: `1px solid ${eq.pts >= 75 ? "#166534" : "#334155"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#f1f5f9" }}>{eq.nome}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: labelCor, background: labelCor + "22", padding: "2px 8px", borderRadius: 10 }}>{label}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
                      <span>{eq.pts} pts atuais</span>
                      <span style={{ color: eq.ganho <= 3 ? "#22c55e" : eq.ganho <= 15 ? "#f59e0b" : "#ef4444", fontWeight: 600 }}>+{eq.ganho} pts necessários</span>
                    </div>
                    <div style={{ height: 8, background: "#334155", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pctBar}%`, background: eq.pts >= 75 ? "#22c55e" : eq.pts >= 60 ? "#f59e0b" : "#ef4444", borderRadius: 4, transition: "width 0.4s" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#64748b", marginTop: 4 }}>
                      <span>0</span><span style={{ color: "#22c55e" }}>75 (ÓTIMO)</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Resumo financeiro */}
            <div style={{ background: "#1e293b", borderRadius: 10, padding: 20, border: "1px solid #334155" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 }}>💰 Impacto Financeiro — BOM vs ÓTIMO</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {[
                  { label: "Diferença ÓTIMO/BOM por equipe/mês", valor: "≈ R$ 2.050", cor: "#22c55e" },
                  { label: "9 equipes × 12 meses (projeção)", valor: "≈ R$ 221.400/ano", cor: "#22c55e" },
                  { label: "Q2 fechamento em agosto", valor: "3 meses acumulados", cor: "#f59e0b" },
                  { label: "Pagamentos retroativos set/2026", valor: "Reflect score Q2", cor: "#3b82f6" },
                ].map(item => (
                  <div key={item.label} style={{ background: "#0f172a", borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: item.cor }}>{item.valor}</div>
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
              <div key={item.ind} style={{ background: "#1e293b", borderRadius: 10, padding: 16, marginBottom: 12, borderLeft: `4px solid ${item.cor}` }}>
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
              const inds = INDICADORES[equipeAtiva] || [];
              const totalPtsDisp = inds.reduce((a,i) => a + i.pts, 0);
              return (
                <div>
                  <div style={{ background: "#1e293b", borderRadius: 10, padding: 20, marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9" }}>{eq.nome}</div>
                        <div style={{ fontSize: 13, color: "#94a3b8" }}>Score atual: <strong style={{ color: eq.cor }}>{eq.pts} pts</strong> → Meta: <strong style={{ color: "#22c55e" }}>75 pts (ÓTIMO)</strong></div>
                      </div>
                      <div style={{ textAlign: "center", background: "#0f172a", borderRadius: 10, padding: "12px 20px" }}>
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

                  {eq.nome === "TRÊS ESTADOS" && (
                    <div style={{ background: "#450a0a", border: "1px solid #ef4444", borderRadius: 10, padding: 16, marginBottom: 16 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                        <AlertTriangle size={18} color="#ef4444" />
                        <span style={{ fontWeight: 700, color: "#ef4444", fontSize: 14 }}>AÇÃO IMEDIATA — CNES EXPIRADO</span>
                      </div>
                      <p style={{ fontSize: 13, color: "#fca5a5", margin: 0 }}>
                        O CNES da equipe TRÊS ESTADOS está com vínculos expirados. <strong>Toda a produção registrada está sendo descartada pelo e-Gestor.</strong> Contato urgente com RH/SMS para reativar os vínculos no SCNES antes de qualquer outra ação. Telefone e-Gestor: <strong>0800 722 4310</strong>.
                      </p>
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
            <div style={{ background: "#1e293b", borderRadius: 10, padding: 16, marginBottom: 20 }}>
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
                <div key={frente} style={{ background: "#1e293b", borderRadius: 10, padding: 16, marginBottom: 14 }}>
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

      </div>
    </div>
  );
}
