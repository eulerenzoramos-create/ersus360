// src/pages/PortalGestor.tsx — Painel do Prefeito / Secretário
import { useQuery } from "@tanstack/react-query";
import { apiPortais } from "../lib/api";
import { BRL, BRL_AXIS, PCT } from "../lib/fmt";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

function GaugeCircle({ score, size = 120 }: { score: number; size?: number }) {
  const cor = score >= 80 ? "#2e7d32" : score >= 60 ? "#f57f17" : score >= 40 ? "#e65100" : "#c62828";
  const label = score >= 80 ? "Excelente" : score >= 60 ? "Em desenvolvimento" : score >= 40 ? "Atenção" : "Crítico";
  const r = size / 2 - 10;
  const circum = 2 * Math.PI * r;
  const offset = circum - (score / 100) * circum;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f0f0f0" strokeWidth={10} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={cor} strokeWidth={10}
          strokeDasharray={circum} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
        <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="middle"
          style={{ fill: cor, fontSize: size * 0.22, fontWeight: 900, transform: "rotate(90deg)", transformOrigin: `${size / 2}px ${size / 2}px` }}>
          {score.toFixed(0)}
        </text>
      </svg>
      <span style={{ fontSize: 12, color: cor, fontWeight: 700 }}>{label}</span>
    </div>
  );
}

function KpiCard({ label, value, sub, cor = "#1565c0", icon }: { label: string; value: string | number; sub?: string; cor?: string; icon?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, padding: "18px 20px", border: `1px solid #e0e0e0`, borderTop: `3px solid ${cor}` }}>
      {icon && <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>}
      <div style={{ fontSize: 28, fontWeight: 900, color: cor, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function SemaforoBar({ label, valor, meta, unidade = "%" }: { label: string; valor: number; meta: number; unidade?: string }) {
  const ok = valor >= meta;
  const pct = Math.min((valor / (meta * 1.2)) * 100, 100);
  const cor = ok ? "#2e7d32" : valor >= meta * 0.9 ? "#f57f17" : "#c62828";
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
        <span style={{ color: "#444" }}>{label}</span>
        <span style={{ fontWeight: 700, color: cor }}>{valor}{unidade} <span style={{ color: "#999", fontWeight: 400, fontSize: 11 }}>/ meta {meta}{unidade}</span></span>
      </div>
      <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: cor, borderRadius: 4, transition: "width .6s" }} />
      </div>
    </div>
  );
}

export default function PortalGestor() {
  const { data: resumo, isLoading } = useQuery({
    queryKey: ["portal-gestor"],
    queryFn: apiPortais.gestor,
  });

  if (!isLoading && !resumo) {
    return (
      <div style={{ padding: 24 }}>
        <NaoDisponivelBanner titulo="Painel do Gestor indisponivel" nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />
      </div>
    );
  }

  const d = resumo!;

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif", maxWidth: 1100 }}>

      {/* Header executivo */}
      <div style={{ background: "linear-gradient(135deg, #0d47a1, #1565c0)", borderRadius: 12, padding: "24px 28px", marginBottom: 24, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Painel do Gestor — Apuí/AM</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>Secretaria Municipal de Saúde · Competência: {d.competencia}</div>
          {d.alertas_criticos > 0 && (
            <div style={{ marginTop: 10, background: "rgba(198,40,40,.3)", border: "1px solid rgba(198,40,40,.5)", borderRadius: 6, padding: "6px 14px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>
              ⚠️ {d.alertas_criticos} alerta{d.alertas_criticos > 1 ? "s" : ""} crítico{d.alertas_criticos > 1 ? "s" : ""} — verificar OCIS
            </div>
          )}
        </div>
        <GaugeCircle score={d.score_ersus} size={130} />
      </div>

      {/* KPIs principais */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <KpiCard icon="💰" label="FNS recebido no mês" value={BRL(d.fns_recebido_mes)} sub="Transferência fundo a fundo" cor="#2e7d32" />
        <KpiCard icon="📊" label="Execução orçamentária" value={`${d.execucao_orcamentaria_pct}%`} sub="PAB + MAC + VS + Farmácia" cor={d.execucao_orcamentaria_pct >= 70 ? "#1565c0" : "#c62828"} />
        <KpiCard icon="👨‍👩‍👧‍👦" label="Famílias atendidas pela ESF" value={d.familias_atendidas_esf.toLocaleString("pt-BR")} sub="Cadastros ativos no SISAB" cor="#6a1b9a" />
        <KpiCard icon="💉" label="Cobertura vacinal" value={`${d.cobertura_vacinal_pct}%`} sub="Vacinas do calendário básico" cor={d.cobertura_vacinal_pct >= 90 ? "#2e7d32" : "#f57f17"} />
      </div>

      {/* Linha 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>

        {/* Metas Novo Financiamento APS */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e0e0e0", padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#333" }}>Metas Novo Financiamento APS</div>
            <div style={{ background: d.metas_previne_atingidas >= d.metas_previne_total * 0.7 ? "#e8f5e9" : "#fff3e0", color: d.metas_previne_atingidas >= d.metas_previne_total * 0.7 ? "#2e7d32" : "#e65100", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 800 }}>
              {d.metas_previne_atingidas}/{d.metas_previne_total} atingidas
            </div>
          </div>
          <SemaforoBar label="Pré-natal (≥6 consultas)" valor={82} meta={60} />
          <SemaforoBar label="Citopatológico colo uterino" valor={71} meta={60} />
          <SemaforoBar label="Vacinas DTP/Penta em dia" valor={91} meta={90} />
          <SemaforoBar label="Pré-natal na 1ª semana" valor={63} meta={60} />
          <SemaforoBar label="Hipertensão controlada" valor={58} meta={60} />
          <SemaforoBar label="Diabetes controlada" valor={55} meta={60} />
          <SemaforoBar label="Desenvolvimento infantil" valor={78} meta={60} />
        </div>

        {/* Resumo operacional */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Obras */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e0e0e0", padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 12 }}>🏗️ Obras em Andamento</div>
            <div style={{ display: "flex", gap: 14 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#1565c0" }}>{d.obras_andamento}</div>
                <div style={{ fontSize: 12, color: "#666" }}>em execução</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 13, marginBottom: 3 }}>Reforma UBS Central</div>
                  <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4 }}>
                    <div style={{ height: "100%", width: "68%", background: "#1565c0", borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>68% concluída · Previsão set/2026</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, marginBottom: 3 }}>Farmácia Central</div>
                  <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4 }}>
                    <div style={{ height: "100%", width: "0%", background: "#e65100", borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>Contratada · Início previsto ago/2026</div>
                </div>
              </div>
            </div>
          </div>

          {/* Situação financeira simplificada */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e0e0e0", padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 12 }}>💼 Situação Financeira</div>
            {[
              { label: "Mínimo constitucional (saúde)", valor: 18.4, meta: 15 },
              { label: "Execução PAB", valor: 81.2, meta: 70 },
              { label: "Execução MAC", valor: 65.6, meta: 70 },
              { label: "Execução Farmácia", valor: 80.2, meta: 70 },
            ].map(i => (
              <SemaforoBar key={i.label} label={i.label} valor={i.valor} meta={i.meta} />
            ))}
          </div>
        </div>
      </div>

      {/* Rodapé informativo */}
      <div style={{ background: "#f5f5f5", borderRadius: 8, padding: "12px 18px", fontSize: 12, color: "#888", display: "flex", justifyContent: "space-between" }}>
        <span>Dados de referência — Apuí/AM · Competência {d.competencia}</span>
        <span>ERSUS 360 v1.0 · Atualizado diariamente às 1h</span>
      </div>
    </div>
  );
}
