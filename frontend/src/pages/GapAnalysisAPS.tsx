// src/pages/GapAnalysisAPS.tsx — ERSUS 360 · Auditoria da APS · Gap Analysis
import { useState } from "react";
import {
  ShieldCheck, AlertTriangle, CheckCircle, XCircle, Clock,
  Database, Wifi, FileText, GitBranch, Map, BarChart2,
  Layers, CheckSquare, TrendingUp, ChevronRight, Info,
  Circle, ArrowRightLeft, Users, Activity,
} from "lucide-react";

// ── Paleta ────────────────────────────────────────────────────────────────────

const AZUL   = "#1351b4";
const VERDE  = "#168821";
const AMAREL = "#FFCD07";
const LARAN  = "#E37222";
const VERM   = "#E52207";
const CINZA  = "#555770";

// ── Dados ─────────────────────────────────────────────────────────────────────

type Prioridade = "P1 — Crítica" | "P2 — Alta" | "P3 — Média" | "P4 — Baixa";
type StatusGap  = "Implementado" | "Parcial" | "Planejado" | "Não iniciado";

interface Gap {
  id: number;
  titulo: string;
  sistema: string;
  dimensao: string;
  prioridade: Prioridade;
  status: StatusGap;
  descricao: string;
  impacto: string;
  acao: string;
  fase: string;
}

const GAPS: Gap[] = [
  {
    id: 1,
    titulo: "Sincronização em tempo real SCNES → ERSUS 360",
    sistema: "SCNES/CNES",
    dimensao: "Cadastro / Conformidade",
    prioridade: "P1 — Crítica",
    status: "Parcial",
    descricao: "O ERSUS 360 atualmente usa dados SCNES estáticos (referência jul/2026). Necessário webhook ou polling horário via API DATASUS para refletir alterações de equipes, profissionais e CBO em tempo real.",
    impacto: "Divergências SCNES×PEC não detectadas automaticamente; score de conformidade desatualizado.",
    acao: "Implementar job agendado (Railway Cron) consumindo API pública CNES a cada 6h. Solicitar acesso à API autenticada DATASUS para dados completos.",
    fase: "Fase 2",
  },
  {
    id: 2,
    titulo: "Importação automática de produção do eSUS PEC",
    sistema: "eSUS PEC",
    dimensao: "Produção / SISAB",
    prioridade: "P1 — Crítica",
    status: "Não iniciado",
    descricao: "O Relatório de Produção usa dados estimados (Random seed). A integração real requer acesso ao banco PostgreSQL do eSUS PEC local ou exportação via API SISAB/RNDS.",
    impacto: "KPIs de produção não fidedignos — gestão baseada em estimativas, não em produção real.",
    acao: "Solicitar exportação CSV mensal do eSUS PEC → importar via endpoint /api/producao/importar. Ou conectar ao PostgreSQL do servidor local do eSUS PEC via VPN.",
    fase: "Fase 2",
  },
  {
    id: 3,
    titulo: "Autenticação mTLS com certificado ICP-Brasil para RNDS",
    sistema: "RNDS",
    dimensao: "Infraestrutura / Segurança",
    prioridade: "P1 — Crítica",
    status: "Não iniciado",
    descricao: "A integração FHIR R4 com a RNDS exige certificado digital ICP-Brasil A3 emitido em nome do CNPJ 12.834.320/0001-26 (FMS Apuí) e credenciais OAuth 2.0 aprovadas pelo DATASUS.",
    impacto: "Sem certificado: impossível consultar histórico clínico, enviar sumários de atendimento ou receber dados nacionais.",
    acao: "1) Solicitar e-CNPJ A3 (Serpro/Certisign) · 2) Cadastrar no portal rnds.saude.gov.br · 3) Implementar serviço mTLS no backend Railway.",
    fase: "Fase 3",
  },
  {
    id: 4,
    titulo: "Financiamento APS — dados reais do e-Gestor AB",
    sistema: "e-Gestor APS",
    dimensao: "Financeiro / SIAPS",
    prioridade: "P1 — Crítica",
    status: "Parcial",
    descricao: "Os valores de Capitação Ponderada, Desempenho e Vínculo exibidos no ERSUS 360 são referência calculada, não os valores homologados pelo e-Gestor. Diferenças podem ocorrer por fatores de ajuste regionais.",
    impacto: "Cronograma de repasses e valor FAEC podem divergir dos pagamentos reais do FNS.",
    acao: "Exportar relatório de pagamento mensal do e-Gestor AB (egestorab.saude.gov.br) e importar via painel de administração do ERSUS 360.",
    fase: "Fase 1",
  },
  {
    id: 5,
    titulo: "Histórico clínico do cidadão integrado com RNDS",
    sistema: "RNDS",
    dimensao: "Continuidade do cuidado",
    prioridade: "P2 — Alta",
    status: "Planejado",
    descricao: "Consulta ao perfil FHIR Patient + Bundle de atendimentos anteriores de outros municípios/estados para o mesmo CNS. Permite identificar duplicidades e histórico de doenças crônicas.",
    impacto: "Sem histórico nacional: risco de duplicidade de tratamentos, perda de rastreabilidade.",
    acao: "Após certificado ICP-Brasil: implementar GET /Patient?identifier={cns} e GET /Bundle?patient={id} na RNDS produção.",
    fase: "Fase 3",
  },
  {
    id: 6,
    titulo: "Auditoria de duplicidade CNS/CPF via CADSUS",
    sistema: "CADSUS",
    dimensao: "Qualidade cadastral",
    prioridade: "P2 — Alta",
    status: "Planejado",
    descricao: "Identificar cidadãos cadastrados com múltiplos CNS ou CNS sem CPF vinculado. Requer acesso à API CADSUS Web Service (SOAP) ou CADSUS Conector.",
    impacto: "Duplicidades geram contagem equivocada de população cadastrada e vinculada no SIAPS.",
    acao: "Solicitar acesso ao CADSUS Conector via DATASUS. Implementar rotina semanal de validação de CNS/CPF.",
    fase: "Fase 3",
  },
  {
    id: 7,
    titulo: "Workflow de plano de ação pós-auditoria",
    sistema: "Funcional",
    dimensao: "Gestão / Accountability",
    prioridade: "P2 — Alta",
    status: "Parcial",
    descricao: "O módulo de Plano de Correção existe, mas não tem fluxo de aprovação, notificações automáticas por e-mail/WhatsApp, nem integração com o módulo de metas do PMS.",
    impacto: "Ações corretivas ficam sem acompanhamento sistemático; prazo expirado sem alerta.",
    acao: "Implementar status workflow (aberto → em andamento → concluído) com alertas por e-mail (SendGrid) e prazo automático baseado na criticidade.",
    fase: "Fase 2",
  },
  {
    id: 8,
    titulo: "Trilha de auditoria e versionamento de registros",
    sistema: "Funcional",
    dimensao: "Conformidade / TCE/TCU",
    prioridade: "P2 — Alta",
    status: "Parcial",
    descricao: "Módulo de histórico existe, mas não registra quem alterou dados financeiros (repasses, valores FNS), nem exporta trilha em formato PDF/XML para o TCE-AM.",
    impacto: "Risco de não conformidade em auditorias do TCE-AM e CGU.",
    acao: "Adicionar log imutável em tabela audit_log (PostgreSQL) para todas as operações CRUD em dados financeiros. Exportar em PDF com assinatura eletrônica.",
    fase: "Fase 2",
  },
  {
    id: 9,
    titulo: "Encaminhamentos e regulação integrados ao eSUS PEC",
    sistema: "eSUS PEC",
    dimensao: "Regulação / SISREG",
    prioridade: "P2 — Alta",
    status: "Não iniciado",
    descricao: "O módulo de Regulação do ERSUS 360 não consulta a fila do SISREG nem os encaminhamentos registrados no PEC. Lista de espera é manual.",
    impacto: "Gestor não visualiza em tempo real a demanda reprimida por especialidade.",
    acao: "Integrar via API SISREG (sisreg3.saude.gov.br) com autenticação por CPF gestor. Exibir fila por especialidade no módulo de Regulação.",
    fase: "Fase 3",
  },
  {
    id: 10,
    titulo: "Score de conformidade cadastral por equipe ESF",
    sistema: "SCNES",
    dimensao: "Qualidade / Gestão",
    prioridade: "P3 — Média",
    status: "Parcial",
    descricao: "O score atual é calculado com base em critérios fixos. Falta ponderar por tempo de preenchimento, CBO correto de cada profissional e consistência entre eSUS PEC e SCNES.",
    impacto: "Score pode superestimar conformidade de equipes com dados desatualizados.",
    acao: "Refinar algoritmo de score com peso por criticidade de campo (RT = peso 3, CH = peso 2, ACS = peso 1). Adicionar penalidade por dados com mais de 90 dias sem atualização.",
    fase: "Fase 2",
  },
];

const SISTEMAS_STATUS = [
  { sigla: "SCNES/CNES", nome: "Cadastro Nacional de Estabelecimentos", status: "parcial",       cor: LARAN,  endpoint: "apidadosabertos.saude.gov.br/cnes", auth: "Pública",         icone: <Database size={16}/> },
  { sigla: "eSUS PEC",   nome: "Prontuário Eletrônico do Cidadão",      status: "nao_iniciado",  cor: VERM,   endpoint: "eSUS local (PostgreSQL / VPN)",      auth: "VPN local",       icone: <Activity size={16}/> },
  { sigla: "SIAPS",      nome: "Sistema de Informação da APS",          status: "parcial",       cor: LARAN,  endpoint: "egestorab.saude.gov.br",             auth: "CPF + Senha",     icone: <BarChart2 size={16}/> },
  { sigla: "e-Gestor",   nome: "e-Gestor Atenção Básica",               status: "parcial",       cor: LARAN,  endpoint: "egestorab.saude.gov.br",             auth: "CPF + Senha",     icone: <TrendingUp size={16}/> },
  { sigla: "RNDS",       nome: "Rede Nacional de Dados em Saúde",       status: "nao_iniciado",  cor: VERM,   endpoint: "ehr.rnds.saude.gov.br/api/fhir/r4",  auth: "mTLS + OAuth 2.0",icone: <Wifi size={16}/> },
  { sigla: "CADSUS",     nome: "Cadastro de Usuários do SUS",           status: "nao_iniciado",  cor: VERM,   endpoint: "cadsus.saude.gov.br",                auth: "Certificado A3",  icone: <Users size={16}/> },
];

const ROADMAP = [
  {
    fase: "Fase 1 — Imediato",
    prazo: "Ago/2026",
    cor: VERM,
    itens: [
      "Exportar dados e-Gestor AB e importar no ERSUS 360",
      "Ativar polling horário da API pública CNES (sem autenticação)",
      "Configurar variáveis de ambiente no Railway para credenciais",
    ],
  },
  {
    fase: "Fase 2 — Curto prazo",
    prazo: "Set–Out/2026",
    cor: LARAN,
    itens: [
      "Solicitar e-CNPJ A3 (Serpro) para CNPJ 12.834.320/0001-26",
      "Cadastrar no portal RNDS e aguardar aprovação DATASUS",
      "Implementar workflow de plano de ação com alertas e-mail",
      "Trilha de auditoria imutável para dados financeiros",
      "Refinar score de conformidade SCNES por peso de campo",
    ],
  },
  {
    fase: "Fase 3 — Médio prazo",
    prazo: "Nov/2026–Jan/2027",
    cor: "#059669",
    itens: [
      "Integração mTLS RNDS produção (após certificado aprovado)",
      "Consulta histórico clínico FHIR R4 por CNS",
      "Auditoria duplicidade CNS/CPF via CADSUS Conector",
      "Encaminhamentos e fila do SISREG integrados",
      "Importação automática produção eSUS PEC via exportação CSV",
    ],
  },
  {
    fase: "Fase 4 — Longo prazo",
    prazo: "2027",
    cor: AZUL,
    itens: [
      "API RNDS bidirecional (envio de sumários de atendimento)",
      "Integração SISAB para indicadores Previne Brasil em tempo real",
      "Dashboard unificado com dados reais de todos os 6 sistemas",
      "Certificação como Sistema de Informação em Saúde pelo DATASUS",
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const PRIOR_COR: Record<string, string> = {
  "P1 — Crítica": VERM,
  "P2 — Alta":    LARAN,
  "P3 — Média":   "#d97706",
  "P4 — Baixa":   CINZA,
};

const STATUS_COR: Record<string, string> = {
  "Implementado":  VERDE,
  "Parcial":       LARAN,
  "Planejado":     AZUL,
  "Não iniciado":  VERM,
};

const STATUS_ICONE: Record<string, JSX.Element> = {
  "Implementado":  <CheckCircle size={12}/>,
  "Parcial":       <AlertTriangle size={12}/>,
  "Planejado":     <Clock size={12}/>,
  "Não iniciado":  <XCircle size={12}/>,
};

const SIS_COR: Record<string, string> = {
  "ok":          VERDE,
  "parcial":     LARAN,
  "nao_iniciado": VERM,
};

const SIS_LABEL: Record<string, string> = {
  "ok":          "Integrado",
  "parcial":     "Parcial",
  "nao_iniciado":"Não iniciado",
};

// ── Componentes de Aba ────────────────────────────────────────────────────────

function AbaResumo() {
  const total       = GAPS.length;
  const impl        = GAPS.filter(g => g.status === "Implementado").length;
  const parcial     = GAPS.filter(g => g.status === "Parcial").length;
  const planejado   = GAPS.filter(g => g.status === "Planejado").length;
  const naoIniciado = GAPS.filter(g => g.status === "Não iniciado").length;
  const criticos    = GAPS.filter(g => g.prioridade === "P1 — Crítica").length;
  const pct         = Math.round(((impl + parcial * 0.5) / total) * 100);

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total de Gaps",      val: total,       cor: CINZA,  bg: "#f9fafb" },
          { label: "Implementados",      val: impl,        cor: VERDE,  bg: "#f0fdf4" },
          { label: "Parciais",           val: parcial,     cor: LARAN,  bg: "#fff7ed" },
          { label: "Planejados",         val: planejado,   cor: AZUL,   bg: "#eff6ff" },
          { label: "Não iniciados",      val: naoIniciado, cor: VERM,   bg: "#fff1f2" },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.cor}25`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: k.cor }}>{k.val}</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Barra de progresso geral */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Progresso Geral de Integração</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: pct >= 60 ? VERDE : pct >= 30 ? LARAN : VERM }}>{pct}%</span>
        </div>
        <div style={{ background: "#f1f5f9", borderRadius: 999, height: 10, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${AZUL}, ${VERDE})`, borderRadius: 999, transition: "width .5s" }}/>
        </div>
        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>
          {criticos} gaps críticos (P1) precisam de ação imediata · Meta: 80% até Jan/2027
        </div>
      </div>

      {/* Tabela de gaps */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
              <th style={{ padding: "10px 12px", textAlign: "left", color: "#6b7280", fontWeight: 700, width: 36 }}>#</th>
              <th style={{ padding: "10px 12px", textAlign: "left", color: "#6b7280", fontWeight: 700 }}>Gap / Funcionalidade</th>
              <th style={{ padding: "10px 12px", textAlign: "left", color: "#6b7280", fontWeight: 700 }}>Sistema</th>
              <th style={{ padding: "10px 12px", textAlign: "left", color: "#6b7280", fontWeight: 700 }}>Dimensão</th>
              <th style={{ padding: "10px 12px", textAlign: "center", color: "#6b7280", fontWeight: 700 }}>Prioridade</th>
              <th style={{ padding: "10px 12px", textAlign: "center", color: "#6b7280", fontWeight: 700 }}>Status</th>
              <th style={{ padding: "10px 12px", textAlign: "center", color: "#6b7280", fontWeight: 700 }}>Fase</th>
            </tr>
          </thead>
          <tbody>
            {GAPS.map((g, i) => (
              <tr key={g.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ padding: "9px 12px", color: "#9ca3af", fontWeight: 700 }}>{g.id}</td>
                <td style={{ padding: "9px 12px", fontWeight: 600, color: "#1e293b", maxWidth: 320 }}>{g.titulo}</td>
                <td style={{ padding: "9px 12px" }}>
                  <span style={{ background: "#eff6ff", color: AZUL, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>{g.sistema}</span>
                </td>
                <td style={{ padding: "9px 12px", color: "#374151", fontSize: 11 }}>{g.dimensao}</td>
                <td style={{ padding: "9px 12px", textAlign: "center" }}>
                  <span style={{ background: `${PRIOR_COR[g.prioridade]}15`, color: PRIOR_COR[g.prioridade], fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 10 }}>
                    {g.prioridade}
                  </span>
                </td>
                <td style={{ padding: "9px 12px", textAlign: "center" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: `${STATUS_COR[g.status]}15`, color: STATUS_COR[g.status], fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 10 }}>
                    {STATUS_ICONE[g.status]} {g.status}
                  </span>
                </td>
                <td style={{ padding: "9px 12px", textAlign: "center", fontSize: 11, color: "#6b7280" }}>{g.fase}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AbaSistema({ sigla }: { sigla: string }) {
  const gaps = GAPS.filter(g => g.sistema === sigla);
  const sis  = SISTEMAS_STATUS.find(s => s.sigla === sigla);
  if (!sis) return <NaoDisponivelBanner nota="Dados n�o dispon�veis no momento. Integra��o pendente de configura��o no Railway." />;
  const cor = SIS_COR[sis.status];

  return (
    <div>
      {/* Header do sistema */}
      <div style={{ background: "#fff", border: `1px solid ${cor}30`, borderLeft: `4px solid ${cor}`, borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ color: cor }}>{sis.icone}</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>{sis.nome}</span>
          <span style={{ background: `${cor}15`, color: cor, fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 10, marginLeft: "auto" }}>
            {SIS_LABEL[sis.status]}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
          <div><span style={{ color: "#9ca3af" }}>Endpoint:</span> <code style={{ background: "#f1f5f9", padding: "1px 6px", borderRadius: 4, fontSize: 11 }}>{sis.endpoint}</code></div>
          <div><span style={{ color: "#9ca3af" }}>Autenticação:</span> <strong>{sis.auth}</strong></div>
        </div>
      </div>

      {/* Gaps do sistema */}
      {gaps.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
          <CheckCircle size={32} color={VERDE} style={{ marginBottom: 8 }}/>
          <div>Nenhum gap identificado para este sistema.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {gaps.map(g => (
            <div key={g.id} style={{ background: "#fff", border: `1px solid ${PRIOR_COR[g.prioridade]}25`, borderLeft: `4px solid ${PRIOR_COR[g.prioridade]}`, borderRadius: 8, padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ background: `${PRIOR_COR[g.prioridade]}15`, color: PRIOR_COR[g.prioridade], fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8 }}>{g.prioridade}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: `${STATUS_COR[g.status]}15`, color: STATUS_COR[g.status], fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8 }}>
                  {STATUS_ICONE[g.status]} {g.status}
                </span>
                <span style={{ fontSize: 10, color: "#9ca3af" }}>{g.fase}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", marginBottom: 6 }}>{g.titulo}</div>
              <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6, marginBottom: 8 }}>{g.descricao}</div>
              <div style={{ background: "#fffbeb", borderRadius: 6, padding: "7px 12px", fontSize: 11, marginBottom: 6 }}>
                <span style={{ fontWeight: 700, color: "#92400e" }}>⚠ Impacto: </span>
                <span style={{ color: "#374151" }}>{g.impacto}</span>
              </div>
              <div style={{ background: "#f0fdf4", borderRadius: 6, padding: "7px 12px", fontSize: 11 }}>
                <span style={{ fontWeight: 700, color: "#166534" }}>✅ Ação: </span>
                <span style={{ color: "#374151" }}>{g.acao}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AbaIntegracoes() {
  return (
    <div>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
        Mapa de integração do ERSUS 360 com o ecossistema oficial do Ministério da Saúde.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
        {SISTEMAS_STATUS.map(s => {
          const cor = SIS_COR[s.status];
          return (
            <div key={s.sigla} style={{ background: "#fff", border: `1px solid ${cor}30`, borderLeft: `4px solid ${cor}`, borderRadius: 10, padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ color: cor }}>{s.icone}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#1e293b" }}>{s.sigla}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>{s.nome}</div>
                </div>
                <span style={{ marginLeft: "auto", background: `${cor}15`, color: cor, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>
                  {SIS_LABEL[s.status]}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>Endpoint:</span>{" "}
                <code style={{ background: "#f1f5f9", padding: "1px 6px", borderRadius: 4 }}>{s.endpoint}</code>
              </div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>
                <span style={{ fontWeight: 600 }}>Auth:</span> {s.auth}
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: "#374151" }}>
                {GAPS.filter(g => g.sistema === s.sigla).length} gap(s) identificado(s)
                {" · "}
                {GAPS.filter(g => g.sistema === s.sigla && g.status === "Implementado").length} implementado(s)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaAuditoria() {
  const checklist = [
    { cat: "Cadastro",    item: "Composição mínima de cada equipe ESF verificada",              ok: true  },
    { cat: "Cadastro",    item: "CBO de todos os profissionais conferido no SCNES",              ok: true  },
    { cat: "Cadastro",    item: "Carga horária SCNES × PEC convergente",                         ok: false },
    { cat: "Financeiro",  item: "Valores de Capitação Ponderada conferidos com e-Gestor AB",     ok: false },
    { cat: "Financeiro",  item: "Repasses FNS reconciliados com extrato bancário FMS",           ok: true  },
    { cat: "Financeiro",  item: "Aplicação mínima 15% NFS verificada (Lei 141/2012)",            ok: true  },
    { cat: "Produção",    item: "Indicadores Previne Brasil conferidos com SISAB",               ok: false },
    { cat: "Produção",    item: "Produção por profissional validada com eSUS PEC",               ok: false },
    { cat: "Conformidade",item: "Divergências SCNES × PEC com plano de correção",               ok: false },
    { cat: "Conformidade",item: "Certificado ICP-Brasil vigente para integração RNDS",          ok: false },
    { cat: "Segurança",   item: "Trilha de auditoria ativa para alterações de dados financeiros",ok: false },
    { cat: "Segurança",   item: "Backup diário do banco de dados Railway verificado",            ok: true  },
  ];
  const ok   = checklist.filter(c => c.ok).length;
  const nok  = checklist.filter(c => !c.ok).length;
  const cats = [...new Set(checklist.map(c => c.cat))];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: VERDE }}>{ok}</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>Itens conformes</div>
        </div>
        <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: VERM }}>{nok}</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>Itens pendentes</div>
        </div>
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: AZUL }}>{Math.round((ok / checklist.length) * 100)}%</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>Conformidade geral</div>
        </div>
      </div>

      {cats.map(cat => (
        <div key={cat} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 18px", marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: AZUL, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".05em" }}>{cat}</div>
          {checklist.filter(c => c.cat === cat).map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < checklist.filter(x => x.cat === cat).length - 1 ? "1px solid #f1f5f9" : "none" }}>
              {c.ok
                ? <CheckCircle size={14} color={VERDE} style={{ flexShrink: 0 }}/>
                : <XCircle    size={14} color={VERM}  style={{ flexShrink: 0 }}/>
              }
              <span style={{ fontSize: 12, color: c.ok ? "#374151" : "#991b1b", fontWeight: c.ok ? 400 : 600 }}>{c.item}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function AbaRoadmap() {
  return (
    <div>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
        Cronograma de implementação das integrações do ERSUS 360 com o ecossistema MS — Apuí/AM.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {ROADMAP.map((fase, fi) => (
          <div key={fi} style={{ background: "#fff", border: `1px solid ${fase.cor}30`, borderLeft: `4px solid ${fase.cor}`, borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: fase.cor, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 13, flexShrink: 0 }}>
                {fi + 1}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#1e293b" }}>{fase.fase}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>Prazo: {fase.prazo}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {fase.itens.map((item, ii) => (
                <div key={ii} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "#374151" }}>
                  <ChevronRight size={13} color={fase.cor} style={{ marginTop: 1, flexShrink: 0 }}/>
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Página Principal ──────────────────────────────────────────────────────────

type AbaId = "resumo" | "scnes" | "esus" | "siaps" | "egestor" | "rnds" | "cadsus" | "integracoes" | "auditoria" | "roadmap";

interface AbaItem { id: AbaId; label: string; icon: JSX.Element }

export default function GapAnalysisAPS() {
  const [aba, setAba] = useState<AbaId>("resumo");

  const ABAS: AbaItem[] = [
    { id: "resumo",      label: "Resumo Executivo",    icon: <BarChart2 size={13}/> },
    { id: "scnes",       label: "SCNES/CNES",           icon: <Database size={13}/> },
    { id: "esus",        label: "eSUS PEC",             icon: <Activity size={13}/> },
    { id: "siaps",       label: "SIAPS",                icon: <TrendingUp size={13}/> },
    { id: "egestor",     label: "e-Gestor APS",         icon: <FileText size={13}/> },
    { id: "rnds",        label: "RNDS",                 icon: <Wifi size={13}/> },
    { id: "cadsus",      label: "CADSUS",               icon: <Users size={13}/> },
    { id: "integracoes", label: "Integrações",          icon: <ArrowRightLeft size={13}/> },
    { id: "auditoria",   label: "Auditoria Funcional",  icon: <CheckSquare size={13}/> },
    { id: "roadmap",     label: "Roadmap",              icon: <Map size={13}/> },
  ];

  const SIS_MAP: Record<string, string> = {
    scnes: "SCNES/CNES", esus: "eSUS PEC", siaps: "SIAPS",
    egestor: "e-Gestor", rnds: "RNDS", cadsus: "CADSUS",
  };

  const total     = GAPS.length;
  const impl      = GAPS.filter(g => g.status === "Implementado").length;
  const criticos  = GAPS.filter(g => g.prioridade === "P1 — Crítica").length;
  const pct       = Math.round(((impl + GAPS.filter(g => g.status === "Parcial").length * 0.5) / total) * 100);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${AZUL} 0%, #1e40af 100%)`, color: "#fff", padding: "18px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <ShieldCheck size={20}/>
              <span style={{ fontSize: 20, fontWeight: 900 }}>ERSUS 360 — Auditoria da APS</span>
            </div>
            <div style={{ fontSize: 12, opacity: .75 }}>
              Gap Analysis · Ecossistema Oficial Ministério da Saúde · Julho/2026
            </div>
          </div>
          {/* Badges de sistemas */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {SISTEMAS_STATUS.map(s => (
              <span key={s.sigla} style={{ background: `${SIS_COR[s.status]}cc`, color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 10 }}>
                {s.sigla}
              </span>
            ))}
          </div>
        </div>

        {/* Mini KPIs no header */}
        <div style={{ display: "flex", gap: 20, marginBottom: 0, fontSize: 12 }}>
          <span style={{ opacity: .8 }}>{total} gaps mapeados</span>
          <span style={{ color: "#fca5a5", fontWeight: 700 }}>{criticos} críticos (P1)</span>
          <span style={{ color: "#86efac", fontWeight: 700 }}>{pct}% implementado</span>
        </div>

        {/* Abas */}
        <div style={{ display: "flex", gap: 0, marginTop: 16, overflowX: "auto" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "9px 14px", fontSize: 12, fontWeight: aba === a.id ? 700 : 400,
                color: aba === a.id ? AZUL : "rgba(255,255,255,.75)",
                background: aba === a.id ? "#fff" : "transparent",
                border: "none", borderRadius: "8px 8px 0 0",
                cursor: "pointer", whiteSpace: "nowrap",
                borderBottom: aba === a.id ? "none" : "none",
              }}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{ padding: "24px" }}>
        {aba === "resumo"      && <AbaResumo />}
        {aba === "integracoes" && <AbaIntegracoes />}
        {aba === "auditoria"   && <AbaAuditoria />}
        {aba === "roadmap"     && <AbaRoadmap />}
        {["scnes","esus","siaps","egestor","rnds","cadsus"].includes(aba) && (
          <AbaSistema sigla={SIS_MAP[aba]} />
        )}
      </div>
    </div>
  );
}
