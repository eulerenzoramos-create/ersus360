// Módulo 5 — Vigilância em Saúde (Epidemiológica + Sanitária + Ambiental)
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { ShieldCheck, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

const S = {
  page:  { padding: 20 } as React.CSSProperties,
  card:  { background: "#fff", borderRadius: 8, border: "1px solid #e5e5e3", padding: 16, marginBottom: 14 } as React.CSSProperties,
  title: { fontSize: 14, fontWeight: 600, marginBottom: 12 } as React.CSSProperties,
  tab:   (a: boolean) => ({ padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, background: a ? "#dc2626" : "#f5f5f3", color: a ? "#fff" : "#404040" }) as React.CSSProperties,
};

interface VigDashboard {
  competencia: string; agravos_notificados: number; surtos_ativos: number;
  cobertura_vacinal_geral: number; visitas_sanitarias: number;
}
interface Agravo {
  agravo: string; casos_confirmados: number; casos_suspeitos: number;
  obitos: number; competencia: string; semana_epidemiologica?: number;
}
interface VacinalItem { vacina: string; meta: number; cobertura: number; situacao: string }

export default function Vigilancia() {
  const [aba, setAba] = useState<"epidemio" | "vacinal" | "sanitaria">("epidemio");

  const { data: dashboard } = useQuery<VigDashboard>({
    queryKey: ["vig-dashboard"],
    queryFn: () => api.get("/api/vigilancia/dashboard").then((r) => r.data),
  });
  const { data: agravos = [] } = useQuery<Agravo[]>({
    queryKey: ["vig-agravos"],
    queryFn: () => api.get("/api/vigilancia/agravos").then((r) => r.data),
    enabled: aba === "epidemio",
  });
  const { data: vacinal = [] } = useQuery<VacinalItem[]>({
    queryKey: ["vig-vacinal"],
    queryFn: () => api.get("/api/vigilancia/vacinacao").then((r) => r.data),
    enabled: aba === "vacinal",
  });

  return (
    <div style={S.page}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <ShieldCheck size={16} /> Vigilância em Saúde
        {dashboard && <span style={{ fontSize: 12, color: "#737373", fontWeight: 400 }}>— {dashboard.competencia}</span>}
      </div>

      {/* KPIs */}
      {dashboard && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Surtos Ativos",        valor: dashboard.surtos_ativos,          cor: dashboard.surtos_ativos > 0 ? "#dc2626" : "#059669", sub: "em investigação" },
            { label: "Agravos Notificados",  valor: dashboard.agravos_notificados,    cor: "#d97706", sub: "no mês" },
            { label: "Cobertura Vacinal",    valor: `${dashboard.cobertura_vacinal_geral}%`, cor: dashboard.cobertura_vacinal_geral >= 90 ? "#059669" : "#dc2626", sub: "meta: 90%" },
            { label: "Visitas Sanitárias",   valor: dashboard.visitas_sanitarias,     cor: "#2563eb", sub: "no ano" },
          ].map(({ label, valor, cor, sub }) => (
            <div key={label} style={{ ...S.card, textAlign: "center", padding: 12, margin: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: cor }}>{valor}</div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>{sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Abas */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button style={S.tab(aba === "epidemio")}  onClick={() => setAba("epidemio")}>Epidemiológica</button>
        <button style={S.tab(aba === "vacinal")}   onClick={() => setAba("vacinal")}>Imunização</button>
        <button style={S.tab(aba === "sanitaria")} onClick={() => setAba("sanitaria")}>Sanitária</button>
      </div>

      {/* ABA EPIDEMIO */}
      {aba === "epidemio" && (
        <div style={S.card}>
          <div style={S.title}>Agravos de Notificação Compulsória — SINAN</div>
          {(agravos as Agravo[]).map((ag) => {
            const total = ag.casos_confirmados + ag.casos_suspeitos;
            const alerta = ag.casos_confirmados >= 3 || ag.obitos > 0;
            return (
              <div key={ag.agravo} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0ee" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{ag.agravo}</span>
                    {ag.semana_epidemiologica && (
                      <span style={{ fontSize: 10, background: "#f5f5f3", borderRadius: 3, padding: "1px 5px", color: "#737373" }}>SE {ag.semana_epidemiologica}</span>
                    )}
                    {alerta && (
                      <span style={{ fontSize: 10, background: "#fff0f0", color: "#dc2626", borderRadius: 4, padding: "1px 6px", display: "flex", alignItems: "center", gap: 3, fontWeight: 600 }}>
                        <AlertTriangle size={10} /> Alerta
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "#737373" }}>Confirmados: {ag.casos_confirmados} · Suspeitos: {ag.casos_suspeitos} · Óbitos: {ag.obitos}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: total >= 5 ? "#dc2626" : total > 0 ? "#d97706" : "#059669" }}>{total}</div>
                  <div style={{ fontSize: 11, color: "#737373" }}>casos</div>
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 12, padding: 10, background: "#eff6ff", borderRadius: 6, fontSize: 12, color: "#2563eb" }}>
            <TrendingUp size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />
            Notificações registradas no SINAN Online. Dados da Semana Epidemiológica atual.
          </div>
        </div>
      )}

      {/* ABA VACINAL */}
      {aba === "vacinal" && (
        <div style={S.card}>
          <div style={S.title}>Cobertura Vacinal — PNI 2026</div>
          {(vacinal as VacinalItem[]).map((v) => {
            const cor = v.situacao === "ok" ? "#059669" : v.situacao === "atencao" ? "#d97706" : "#dc2626";
            const perc = Math.min((v.cobertura / v.meta) * 100, 115);
            return (
              <div key={v.vacina} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13 }}>{v.vacina}</span>
                    {v.cobertura >= v.meta
                      ? <CheckCircle2 size={13} color="#059669" />
                      : <AlertTriangle size={13} color={cor} />
                    }
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: cor }}>{v.cobertura}%</span>
                </div>
                <div style={{ height: 8, background: "#e5e5e3", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(perc, 100)}%`, height: "100%", background: cor, borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 11, color: "#737373", marginTop: 2 }}>Meta: {v.meta}%</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ABA SANITÁRIA */}
      {aba === "sanitaria" && (
        <div style={S.card}>
          <div style={S.title}>Vigilância Sanitária e Ambiental</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Estabelecimentos Cadastrados", valor: 47,  cor: "#1D9E75" },
              { label: "Inspeções no Ano",             valor: dashboard?.visitas_sanitarias ?? 0, cor: "#2563eb" },
              { label: "Irregularidades Identificadas", valor: 8,  cor: "#d97706" },
              { label: "Autos de Infração Emitidos",    valor: 3,  cor: "#dc2626" },
              { label: "Amostras de Água (SISAGUA)",    valor: 24, cor: "#0891b2" },
              { label: "Conformidade Água",             valor: "94%", cor: "#059669" },
            ].map(({ label, valor, cor }) => (
              <div key={label} style={{ background: "#f9f9f7", borderRadius: 6, padding: "12px 14px" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: cor }}>{valor}</div>
                <div style={{ fontSize: 12, color: "#737373", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
