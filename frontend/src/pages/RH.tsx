// Fase 4 — Recursos Humanos
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRH } from "../lib/api";
import { UserCog, Calendar, AlertTriangle, FileText, TrendingUp, Users, Clock } from "lucide-react";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

const S = {
  page:  { padding: 20 } as React.CSSProperties,
  card:  { background: "#fff", borderRadius: 8, border: "1px solid #e5e5e3", padding: 16, marginBottom: 14 } as React.CSSProperties,
  tab:   (a: boolean) => ({ padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: a ? 600 : 400, background: a ? "#1565C0" : "#f5f5f3", color: a ? "#fff" : "#404040", display: "flex", alignItems: "center", gap: 6 } as React.CSSProperties),
  badge: (cor: string) => ({ background: cor + "18", color: cor, borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 600 } as React.CSSProperties),
};

const COR_VINCULO: Record<string, string> = {
  estatutario: "#059669", clt: "#0284c7", temporario: "#d97706",
  terceirizado: "#7c3aed", comissionado: "#dc2626", estagiario: "#6b7280",
};
const LABEL_VINCULO: Record<string, string> = {
  estatutario: "Estatutário", clt: "CLT", temporario: "Temporário",
  terceirizado: "Terceirizado", comissionado: "Comissionado", estagiario: "Estagiário",
};
const COR_STATUS_FERIAS: Record<string, string> = {
  programada: "#0284c7", em_gozo: "#059669", concluida: "#6b7280", cancelada: "#9e9e9e", vencida: "#dc2626",
};
const LABEL_MOV: Record<string, string> = {
  afastamento_saude: "Afastamento Saúde", afastamento_gestante: "Lic. Maternidade",
  afastamento_paternidade: "Lic. Paternidade", transferencia: "Transferência",
  licenca_interesse: "Lic. s/ Vencimento", suspensao: "Suspensão",
  aposentadoria: "Aposentadoria", exoneracao: "Exoneração", rescisao: "Rescisão",
};

type Aba = "painel" | "servidores" | "ferias" | "movimentacoes" | "contratos";

export default function RH() { 
  const [aba, setAba] = useState<Aba>("painel");

  const { data: painel, isLoading } = useQuery({ queryKey: ["rh-painel"],        queryFn: apiRH.painel });
  const { data: alertas }       = useQuery({ queryKey: ["rh-alertas"],       queryFn: apiRH.alertas });
  const { data: servidores = [] } = useQuery({ queryKey: ["servidores"],     queryFn: apiRH.servidores,    enabled: aba === "servidores" });
  const { data: ferias = [] }   = useQuery({ queryKey: ["ferias"],           queryFn: apiRH.ferias,        enabled: aba === "ferias" });
  const { data: movimentacoes = [] } = useQuery({ queryKey: ["movimentacoes"], queryFn: apiRH.movimentacoes, enabled: aba === "movimentacoes" });
  const { data: contratos = [] } = useQuery({ queryKey: ["contratos"],       queryFn: apiRH.contratos,     enabled: aba === "contratos" });

  const ABAS = [
    { id: "painel" as Aba,        label: "Painel RH",     icon: <TrendingUp size={13}/> },
    { id: "servidores" as Aba,    label: "Servidores",    icon: <Users size={13}/> },
    { id: "ferias" as Aba,        label: "Férias",        icon: <Calendar size={13}/> },
    { id: "movimentacoes" as Aba, label: "Movimentações", icon: <FileText size={13}/> },
    { id: "contratos" as Aba,     label: "Contratos",     icon: <Clock size={13}/> },
  ];

  const COR_ALERTA: Record<string, string> = { critico: "#dc2626", atencao: "#d97706", info: "#0284c7" };

  if (!isLoading && !painel) return (
    <div style={{ padding: 24 }}>
      <NaoDisponivelBanner
        titulo="Recursos Humanos indisponivel"
        nota="Dados nao disponiveis — integracao pendente de configuracao no Railway."
      />
    </div>
  );

  return (
    <div style={S.page}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <UserCog size={16} color="#1565C0" /> Recursos Humanos
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {ABAS.map(a => <button key={a.id} style={S.tab(aba === a.id)} onClick={() => setAba(a.id)}>{a.icon}{a.label}</button>)}
      </div>

      {/* ── PAINEL ── */}
      {aba === "painel" && painel && (
        <>
          {/* Alertas */}
          {alertas?.alertas?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              {alertas.alertas.map((al: any, i: number) => (
                <div key={i} style={{ ...S.card, marginBottom: 8, borderLeft: `4px solid ${COR_ALERTA[al.nivel]}`, background: COR_ALERTA[al.nivel] + "08", display: "flex", alignItems: "center", gap: 10 }}>
                  <AlertTriangle size={14} color={COR_ALERTA[al.nivel]} />
                  <span style={{ fontSize: 13, color: COR_ALERTA[al.nivel], fontWeight: 500 }}>{al.mensagem}</span>
                </div>
              ))}
            </div>
          )}

          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
            {[
              { label: "Headcount Total",       valor: painel.headcount_total,          cor: "#1565C0" },
              { label: "Afastamentos Ativos",   valor: painel.afastamentos_ativos,      cor: painel.afastamentos_ativos > 0 ? "#d97706" : "#059669" },
              { label: "Férias Vencidas",        valor: painel.ferias_vencidas,          cor: painel.ferias_vencidas > 0 ? "#dc2626" : "#059669" },
              { label: "Contratos Vencendo 30d", valor: painel.contratos_vencendo_30d,  cor: painel.contratos_vencendo_30d > 0 ? "#d97706" : "#059669" },
            ].map(k => (
              <div key={k.label} style={{ ...S.card, marginBottom: 0 }}>
                <div style={{ fontSize: 11, color: "#737373", marginBottom: 6 }}>{k.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: k.cor }}>{k.valor}</div>
              </div>
            ))}
          </div>

          {/* Por vínculo */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={S.card}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Headcount por Vínculo</div>
              {Object.entries(painel.por_vinculo as Record<string, number>).map(([v, n]) => (
                <div key={v} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f5f5f3" }}>
                  <span style={S.badge(COR_VINCULO[v] ?? "#6b7280")}>{LABEL_VINCULO[v] ?? v}</span>
                  <span style={{ fontWeight: 700, fontSize: 16, color: COR_VINCULO[v] ?? "#6b7280" }}>{n}</span>
                </div>
              ))}
            </div>
            <div style={S.card}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Headcount por Unidade</div>
              {Object.entries(painel.por_unidade as Record<string, number>).map(([u, n]) => (
                <div key={u} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f5f5f3" }}>
                  <span style={{ fontSize: 12 }}>{u}</span>
                  <span style={{ fontWeight: 700, color: "#1565C0" }}>{n}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 11, color: "#9e9e9e", textAlign: "center", marginTop: 8 }}>
            Dados de referência — {painel.municipio} · Taxa de absenteísmo: {painel.taxa_absenteismo}%
          </div>
        </>
      )}

      {/* ── SERVIDORES ── */}
      {aba === "servidores" && (
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Servidores — {(servidores as any[]).length} registros</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ borderBottom: "2px solid #e4e7ec" }}>
              {["Matrícula", "Nome", "Cargo", "Vínculo", "C.H.", "Unidade", "Fonte Pagamento"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "6px 8px", color: "#737373", fontWeight: 600 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {(servidores as any[]).map((s: any) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f9f9f7" }}>
                  <td style={{ padding: "8px", fontFamily: "monospace", fontSize: 11 }}>{s.matricula}</td>
                  <td style={{ padding: "8px", fontWeight: 500 }}>{s.nome}</td>
                  <td style={{ padding: "8px", fontSize: 11 }}>{s.cargo}</td>
                  <td style={{ padding: "8px" }}><span style={S.badge(COR_VINCULO[s.vinculo] ?? "#6b7280")}>{LABEL_VINCULO[s.vinculo] ?? s.vinculo}</span></td>
                  <td style={{ padding: "8px" }}>{s.carga_horaria}h</td>
                  <td style={{ padding: "8px", fontSize: 11 }}>{s.unidade_nome}</td>
                  <td style={{ padding: "8px", fontSize: 10, color: "#737373" }}>{s.fonte_pagamento.replace(/_/g, " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── FÉRIAS ── */}
      {aba === "ferias" && (
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Férias — {(ferias as any[]).length} registros</div>
          {(ferias as any[]).map((f: any) => (
            <div key={f.id} style={{ padding: "12px 0", borderBottom: "1px solid #f5f5f3" }}>
              {f.alerta && (
                <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, padding: "6px 10px", marginBottom: 6, fontSize: 11, color: "#dc2626", display: "flex", gap: 6, alignItems: "center" }}>
                  <AlertTriangle size={12} /> {f.alerta}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 2 }}>{f.servidor_nome}</div>
                  <div style={{ fontSize: 11, color: "#737373" }}>
                    Período aquisitivo: {f.periodo_aquisitivo} · {f.inicio_gozo} → {f.fim_gozo} ({f.dias} dias)
                  </div>
                </div>
                <span style={S.badge(COR_STATUS_FERIAS[f.status] ?? "#6b7280")}>{f.status.replace("_", " ")}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MOVIMENTAÇÕES ── */}
      {aba === "movimentacoes" && (
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Movimentações</div>
          {(movimentacoes as any[]).map((m: any) => (
            <div key={m.id} style={{ padding: "12px 0", borderBottom: "1px solid #f5f5f3", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 500, marginBottom: 2 }}>{m.servidor_nome}</div>
                <div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>{m.descricao}</div>
                <div style={{ fontSize: 11, color: "#737373" }}>
                  {m.data_inicio}{m.data_fim ? ` → ${m.data_fim}` : " (em andamento)"}
                  {m.documento && <span> · {m.documento}</span>}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                <span style={S.badge("#1565C0")}>{LABEL_MOV[m.tipo] ?? m.tipo}</span>
                <span style={S.badge(m.ativo ? "#d97706" : "#6b7280")}>{m.ativo ? "Ativo" : "Encerrado"}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CONTRATOS ── */}
      {aba === "contratos" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {(contratos as any[]).map((c: any) => (
            <div key={c.id} style={{ ...S.card, marginBottom: 0, borderLeft: `4px solid ${c.dias_restantes <= 30 ? "#dc2626" : "#059669"}` }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{c.servidor_nome}</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <span style={S.badge("#7c3aed")}>{c.tipo}</span>
                <span style={S.badge(c.dias_restantes <= 30 ? "#dc2626" : "#059669")}>
                  {c.dias_restantes <= 30 ? `⚠️ ${c.dias_restantes} dias restantes` : `${c.dias_restantes} dias restantes`}
                </span>
              </div>
              {c.empresa && <div style={{ fontSize: 11, color: "#737373" }}>Empresa: {c.empresa}</div>}
              <div style={{ fontSize: 11, color: "#737373" }}>Vigência: {c.inicio} → {c.fim}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1565C0", marginTop: 6 }}>
                R$ {c.valor_mensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
