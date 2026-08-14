// src/pages/SimuladorCenarios.tsx — Simulador de Cenários Financeiros
import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Calculator, TrendingUp, TrendingDown, RefreshCw, DollarSign, Target, Sliders } from "lucide-react";
import { apiPost } from "../lib/api";
import { BRL, BRL_AXIS, PCT } from "../lib/fmt";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Parametro {
  id: string; label: string; descricao: string;
  valor: number; min: number; max: number; step: number; sufixo: string;
}

interface ResultadoSimulacao {
  fpq_estimado: number; apq_estimado: number; recurso_total: number;
  variacao_fpq_pct: number; variacao_apq_pct: number; variacao_total_pct: number;
  cenario_label: string; alertas: string[];
  detalhamento: { componente: string; valor_base: number; valor_simulado: number; variacao_pct: number }[];
}

// ── Formatador BRL ─────────────────────────────────────────────────────────────


// ── Slider com valor ──────────────────────────────────────────────────────────

function Slider({ param, onChange }: { param: Parametro; onChange: (id: string, v: number) => void }) {
  const pct = ((param.valor - param.min) / (param.max - param.min)) * 100;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1f2937" }}>{param.label}</div>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>{param.descricao}</div>
        </div>
        <div style={{ textAlign: "right" as const }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#1e1b4b" }}>{param.valor?.toFixed(param.step < 1 ? 1 : 0)}{param.sufixo}</div>
          <div style={{ fontSize: 9, color: "#9ca3af" }}>{param.min}{param.sufixo} – {param.max}{param.sufixo}</div>
        </div>
      </div>
      <div style={{ position: "relative", height: 6, background: "#e5e7eb", borderRadius: 3 }}>
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#4f46e5,#7c3aed)", borderRadius: 3 }}/>
        <input type="range" min={param.min} max={param.max} step={param.step} value={param.valor}
          onChange={e => onChange(param.id, parseFloat(e.target.value))}
          style={{ position: "absolute", top: -4, left: 0, width: "100%", opacity: 0, cursor: "pointer", height: 14 }}/>
      </div>
    </div>
  );
}

// ── Gauge mini ────────────────────────────────────────────────────────────────

function VarBadge({ val }: { val: number }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 10,
      background: val > 0 ? "#dcfce7" : val < 0 ? "#fee2e2" : "#f1f5f9",
      color: val > 0 ? "#16a34a" : val < 0 ? "#dc2626" : "#6b7280" }}>
      {val > 0 ? "+" : ""}{val?.toFixed(1)}%
    </span>
  );
}

// ── Valores-base fixos ────────────────────────────────────────────────────────

const BASE_FPQ = 980_000;
const BASE_APQ = 420_000;
const BASE_TOTAL = BASE_FPQ + BASE_APQ;

const PARAMS_INICIAIS: Parametro[] = [
  { id: "cobertura_esf",     label: "Cobertura ESF (%)",        descricao: "% da população cadastrada em equipes ESF",         valor: 78,  min: 40,  max: 100, step: 1,   sufixo: "%" },
  { id: "acompan_prenatal",  label: "Acompanhamento Pré-natal", descricao: "Taxa de gestantes com 6+ consultas (C/B)",           valor: 62,  min: 20,  max: 100, step: 1,   sufixo: "%" },
  { id: "citopatologico",    label: "Exame Citopatológico",     descricao: "Taxa de mulheres 25-64a com coleta em dia (C)",      valor: 41,  min: 10,  max: 100, step: 1,   sufixo: "%" },
  { id: "hiper_acompan",     label: "Hipertensos Acompanhand.", descricao: "% de hipertensos cadastrados em acomp. ativo (B)",   valor: 58,  min: 20,  max: 100, step: 1,   sufixo: "%" },
  { id: "diab_acompan",     label: "Diabéticos Acompanhand.",  descricao: "% de diabéticos cadastrados em acomp. ativo (B)",    valor: 53,  min: 20,  max: 100, step: 1,   sufixo: "%" },
  { id: "saude_crianca",    label: "Saúde da Criança",         descricao: "% crianças <2a com consultas em dia (M)",            valor: 71,  min: 20,  max: 100, step: 1,   sufixo: "%" },
  { id: "producao_acs",     label: "Produção ACS (%)",         descricao: "% de ACS com produção validada no mês",              valor: 85,  min: 40,  max: 100, step: 1,   sufixo: "%" },
  { id: "municipio_pop",    label: "População Cadastrada",     descricao: "Número de pessoas no cadastro ativo (SIAB/eSUS)",     valor: 8800, min: 5000, max: 20000, step: 100, sufixo: "" },
];

// ── Lógica de simulação (local, sem backend) ──────────────────────────────────

function calcularSimulacao(params: Parametro[]): ResultadoSimulacao {
  const p = Object.fromEntries(params.map(x => [x.id, x.valor]));
  const cob  = p.cobertura_esf / 100;
  const pn   = p.acompan_prenatal / 100;
  const cito = p.citopatologico / 100;
  const hi   = p.hiper_acompan / 100;
  const di   = p.diab_acompan / 100;
  const sc   = p.saude_crianca / 100;
  const acs  = p.producao_acs / 100;
  const pop  = p.municipio_pop;

  // Fator de cobertura populacional (base 8800 pessoas)
  const fPop = Math.sqrt(pop / 8800);

  // FPQ: baseado em cobertura ESF e produção ACS
  const fFPQ = (cob * 0.55 + acs * 0.45) * fPop;
  const fpq_est = Math.round(BASE_FPQ * fFPQ * 1.18);

  // APQ: baseado nos indicadores de qualidade (C, B, M grupos)
  const score_C = (pn + cito) / 2;
  const score_B = (hi + di) / 2;
  const score_M = sc;
  const fAPQ = (score_C * 0.35 + score_B * 0.40 + score_M * 0.25) * fPop;
  const apq_est = Math.round(BASE_APQ * fAPQ * 2.1);

  const total_est = fpq_est + apq_est;
  const dFPQ  = ((fpq_est  - BASE_FPQ)  / BASE_FPQ)  * 100;
  const dAPQ  = ((apq_est  - BASE_APQ)  / BASE_APQ)  * 100;
  const dTot  = ((total_est - BASE_TOTAL) / BASE_TOTAL) * 100;

  // Label cenário
  const cenario = dTot > 15 ? "Cenário Otimista" : dTot > 0 ? "Cenário de Melhoria" : dTot > -10 ? "Cenário Base" : "Cenário de Risco";

  // Alertas
  const alertas: string[] = [];
  if (p.citopatologico < 50) alertas.push("Cobertura de citopatológico abaixo de 50% — indicador Grupo C com peso alto no APQ.");
  if (p.hiper_acompan < 55)  alertas.push("Acompanhamento de hipertensos baixo — impacta significativamente Grupo B.");
  if (p.cobertura_esf < 60)  alertas.push("Cobertura ESF < 60% — credenciamento de novas equipes pode aumentar FPQ.");
  if (p.producao_acs < 70)   alertas.push("Produção ACS < 70% — consolidação de fichas CDS pendente pode cortar FPQ.");

  return {
    fpq_estimado: fpq_est, apq_estimado: apq_est, recurso_total: total_est,
    variacao_fpq_pct: dFPQ, variacao_apq_pct: dAPQ, variacao_total_pct: dTot,
    cenario_label: cenario, alertas,
    detalhamento: [
      { componente: "FPQ — Financiamento por Cadastro e Cobertura",        valor_base: BASE_FPQ,           valor_simulado: fpq_est,       variacao_pct: dFPQ },
      { componente: "APQ — Qualidade Grupo C (Pré-natal + Cito.)",         valor_base: Math.round(BASE_APQ*0.35), valor_simulado: Math.round(apq_est*0.35), variacao_pct: dAPQ },
      { componente: "APQ — Qualidade Grupo B (HAS + DM)",                  valor_base: Math.round(BASE_APQ*0.40), valor_simulado: Math.round(apq_est*0.40), variacao_pct: dAPQ },
      { componente: "APQ — Qualidade Grupo M (Saúde da Criança)",          valor_base: Math.round(BASE_APQ*0.25), valor_simulado: Math.round(apq_est*0.25), variacao_pct: dAPQ },
    ],
  };
}

// ── Principal ─────────────────────────────────────────────────────────────────

export default function SimuladorCenarios() {
  const [params, setParams] = useState<Parametro[]>(PARAMS_INICIAIS);
  const resultado = calcularSimulacao(params);

  const handleChange = useCallback((id: string, valor: number) => {
    setParams(ps => ps.map(p => p.id === id ? { ...p, valor } : p));
  }, []);

  const resetar = () => setParams(PARAMS_INICIAIS);

  const corTotal = resultado.variacao_total_pct > 0 ? "#16a34a" : resultado.variacao_total_pct < -10 ? "#dc2626" : "#d97706";

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#134e4a 0%,#0d9488 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}><Calculator size={18} color="#fff"/></div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Simulador de Cenários Financeiros</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Cofinanciamento APS (P. 3.493/2024) · FPQ + APQ · Ajuste de parâmetros e projeção de receita federal
            </div>
          </div>
          <button onClick={resetar}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            <RefreshCw size={12}/>Resetar Parâmetros
          </button>
        </div>
        {/* KPIs no header */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 16 }}>
          {[
            { label: "FPQ Estimado", val: BRL(resultado.fpq_estimado), delta: resultado.variacao_fpq_pct },
            { label: "APQ Estimado", val: BRL(resultado.apq_estimado), delta: resultado.variacao_apq_pct },
            { label: "Total Previsto", val: BRL(resultado.recurso_total), delta: resultado.variacao_total_pct },
          ].map(k => (
            <div key={k.label} style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)", marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{k.val}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: k.delta >= 0 ? "#86efac" : "#fca5a5", marginTop: 2 }}>
                {k.delta >= 0 ? "▲ " : "▼ "}{Math.abs(k.delta).toFixed(1)}% vs base atual
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 20, padding: "20px 28px 60px" }}>
        {/* Painel de parâmetros */}
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <Sliders size={15} color="#0d9488"/>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Parâmetros do Cenário</span>
          </div>
          {params.map(p => <Slider key={p.id} param={p} onChange={handleChange}/>)}
        </div>

        {/* Resultado */}
        <div>
          {/* Cenário label */}
          <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "16px 20px", marginBottom: 12, textAlign: "center" as const }}>
            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>Cenário Identificado</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: corTotal }}>{resultado.cenario_label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#1f2937", marginTop: 6 }}>{BRL(resultado.recurso_total)}</div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>Base atual: {BRL(BASE_TOTAL)}</div>
            <div style={{ marginTop: 8 }}>
              <VarBadge val={resultado.variacao_total_pct}/>
            </div>
          </div>

          {/* Detalhamento por componente */}
          <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "16px 20px", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Detalhamento por Componente</div>
            {resultado.detalhamento.map((d, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: "#6b7280", maxWidth: 200 }}>{d.componente}</span>
                  <VarBadge val={d.variacao_pct}/>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: "#9ca3af" }}>Base: {BRL(d.valor_base)}</span>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{BRL(d.valor_simulado)}</span>
                </div>
                <div style={{ height: 4, background: "#f3f4f6", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${Math.min(100, (d.valor_simulado / (d.valor_base * 1.5)) * 100)}%`, background: d.variacao_pct >= 0 ? "#0d9488" : "#ef4444", borderRadius: 2 }}/>
                </div>
              </div>
            ))}
          </div>

          {/* Alertas */}
          {resultado.alertas.length > 0 && (
            <div style={{ background: "#fffbeb", border: "1px solid #f59e0b30", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 8 }}>⚠ Alertas do Modelo</div>
              {resultado.alertas.map((a, i) => (
                <div key={i} style={{ fontSize: 11, color: "#78350f", marginBottom: 5, paddingLeft: 10, borderLeft: "2px solid #f59e0b" }}>{a}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
