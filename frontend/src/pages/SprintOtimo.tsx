// src/pages/SprintOtimo.tsx — Sprint ÓTIMO Q2 Mai–Ago/2026
import { useState, useEffect } from "react";
import { Trophy, Target, Zap, CheckSquare, Square, TrendingUp, AlertTriangle, Clock } from "lucide-react";

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

// ── Componente Principal ───────────────────────────────────────────────────
export default function SprintOtimo() {
  const [aba, setAba] = useState<"visao"|"indicadores"|"equipe"|"checklist">("visao");
  const [equipeAtiva, setEquipeAtiva] = useState("JK");
  const [checks, setChecks] = useState<Record<string,boolean>>({});
  const { diasRestantes, horasRestantes } = useCountdown();

  const totalChecks = CHECKLIST.length;
  const feitos = Object.values(checks).filter(Boolean).length;
  const pct = Math.round((feitos / totalChecks) * 100);

  function toggle(id: string) {
    setChecks(p => ({ ...p, [id]: !p[id] }));
  }

  const FRENTES = ["Sistema","Clínica","ACS","Retroativo","Fechamento"];

  return (
    <div style={{ padding: "0 0 40px 0", fontFamily: "Inter, system-ui, sans-serif", background: "var(--bg, #0f172a)", minHeight: "100vh", color: "var(--fg, #f1f5f9)" }}>

      {/* ── Header ── */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #14532d 100%)", borderBottom: "1px solid #1e293b", padding: "16px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <Trophy size={22} color="#f59e0b" />
              <span style={{ fontWeight: 700, fontSize: 17, color: "#f1f5f9" }}>SPRINT ÓTIMO — Meta: ≥75 pts em TODAS as equipes</span>
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Apuí/AM · Portaria GM/MS 3.493/2024 · Componente Qualidade · Fechamento Q2: 31/Ago/2026</div>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", lineHeight: 1 }}>{diasRestantes}</div>
              <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>DIAS</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", lineHeight: 1 }}>{horasRestantes}</div>
              <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>HORAS</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Badges resumo ── */}
      <div style={{ display: "flex", gap: 10, padding: "12px 24px", flexWrap: "wrap" }}>
        <span style={{ background: "#166534", color: "#bbf7d0", padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>🏆 Meta ≥75 pts</span>
        <span style={{ background: "#7f1d1d", color: "#fca5a5", padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>5 equipes em risco crítico</span>
        <span style={{ background: "#1e3a5f", color: "#93c5fd", padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{diasRestantes} dias de sprint</span>
        <span style={{ background: "#3730a3", color: "#c7d2fe", padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>Checklist {feitos}/{totalChecks}</span>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, padding: "0 24px 0 24px", borderBottom: "1px solid #1e293b", flexWrap: "wrap" }}>
        {(["visao","indicadores","equipe","checklist"] as const).map(t => (
          <button key={t} onClick={() => setAba(t)} style={{
            padding: "8px 18px", fontSize: 13, fontWeight: aba === t ? 700 : 400,
            border: "none", borderBottom: aba === t ? "2px solid #22c55e" : "2px solid transparent",
            background: "transparent", color: aba === t ? "#22c55e" : "#94a3b8",
            cursor: "pointer", marginBottom: -1
          }}>
            {t === "visao" ? "📊 Visão Geral" : t === "indicadores" ? "📈 Indicadores-Chave" : t === "equipe" ? "👥 Por Equipe" : "✅ Checklist"}
          </button>
        ))}
      </div>

      <div style={{ padding: "20px 24px" }}>

        {/* ── ABA: Visão Geral ── */}
        {aba === "visao" && (
          <div>
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
