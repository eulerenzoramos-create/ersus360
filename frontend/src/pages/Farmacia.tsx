// Módulo 5 — Farmácia Municipal
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Pill, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const S = {
  page:  { padding: 20 } as React.CSSProperties,
  card:  { background: "#fff", borderRadius: 8, border: "1px solid #e5e5e3", padding: 16, marginBottom: 14 } as React.CSSProperties,
  title: { fontSize: 14, fontWeight: 600, marginBottom: 12 } as React.CSSProperties,
  tab:   (a: boolean) => ({ padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, background: a ? "#7c3aed" : "#f5f5f3", color: a ? "#fff" : "#404040" }) as React.CSSProperties,
};

const STATUS_CONFIG: Record<string, { cor: string; bg: string; label: string; icon: React.ReactNode }> = {
  ok:      { cor: "#059669", bg: "#f0fdf4", label: "OK",      icon: <CheckCircle2 size={12} /> },
  critico: { cor: "#dc2626", bg: "#fff0f0", label: "Crítico", icon: <AlertTriangle size={12} /> },
  zerado:  { cor: "#dc2626", bg: "#fff0f0", label: "Zerado",  icon: <XCircle size={12} /> },
  excesso: { cor: "#d97706", bg: "#fffbeb", label: "Excesso", icon: <AlertTriangle size={12} /> },
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Medicamento {
  id: number; nome: string; principio_ativo: string; forma_farmaceutica: string;
  apresentacao: string; estoque_atual: number; estoque_minimo: number;
  situacao: string; validade?: string; programa: string;
}
interface Dispensacao { mes: string; total_dispensacoes: number; usuarios_atendidos: number }
interface Programa { programa: string; previsto: number; realizado: number; execucao: number; situacao: string }
interface Dashboard {
  total_medicamentos: number; itens_criticos: number; itens_zerados: number;
  dispensacoes_mes: number; usuarios_atendidos_mes: number;
  execucao_popular: number; execucao_bnafar: number; competencia: string;
}

export default function Farmacia() {
  const [aba, setAba] = useState<"estoque" | "dispensacao" | "programas">("estoque");
  const [filtroSit, setFiltroSit] = useState("");

  const { data: dashboard } = useQuery<Dashboard>({
    queryKey: ["farmacia-dashboard"],
    queryFn: () => api.get("/api/farmacia/dashboard").then((r) => r.data),
  });
  const { data: estoque = [] } = useQuery<Medicamento[]>({
    queryKey: ["farmacia-estoque", filtroSit],
    queryFn: () => api.get("/api/farmacia/estoque", { params: filtroSit ? { situacao: filtroSit } : {} }).then((r) => r.data),
    enabled: aba === "estoque",
  });
  const { data: dispensacoes = [] } = useQuery<Dispensacao[]>({
    queryKey: ["farmacia-dispensacoes"],
    queryFn: () => api.get("/api/farmacia/dispensacoes").then((r) => r.data),
    enabled: aba === "dispensacao",
  });
  const { data: programas = [] } = useQuery<Programa[]>({
    queryKey: ["farmacia-programas"],
    queryFn: () => api.get("/api/farmacia/programas").then((r) => r.data),
    enabled: aba === "programas",
  });

  return (
    <div style={S.page}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <Pill size={16} /> Assistência Farmacêutica
        {dashboard && <span style={{ fontSize: 12, color: "#737373", fontWeight: 400 }}>— {dashboard.competencia}</span>}
      </div>

      {/* KPIs */}
      {dashboard && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Medicamentos",     valor: dashboard.total_medicamentos,  cor: "#7c3aed", sub: "no cadastro" },
            { label: "Itens Críticos",   valor: dashboard.itens_criticos,      cor: "#dc2626", sub: "abaixo do mínimo" },
            { label: "Dispensações/Mês", valor: dashboard.dispensacoes_mes,    cor: "#1D9E75", sub: "junho/2026" },
            { label: "Usuários/Mês",     valor: dashboard.usuarios_atendidos_mes, cor: "#0284c7", sub: "atendidos" },
          ].map(({ label, valor, cor, sub }) => (
            <div key={label} style={{ ...S.card, textAlign: "center", padding: 12, margin: 0 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: cor }}>{valor}</div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>{sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Execução Farmácia Popular + BNAFAR */}
      {dashboard && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          {[
            { label: "Farmácia Popular", perc: dashboard.execucao_popular, cor: dashboard.execucao_popular >= 75 ? "#059669" : "#dc2626" },
            { label: "BNAFAR / Comp. Básico", perc: dashboard.execucao_bnafar, cor: dashboard.execucao_bnafar >= 75 ? "#059669" : "#d97706" },
          ].map(({ label, perc, cor }) => (
            <div key={label} style={{ ...S.card, padding: 14, margin: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: cor }}>{perc.toFixed(1)}%</span>
              </div>
              <div style={{ height: 8, background: "#e5e5e3", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(perc, 100)}%`, height: "100%", background: cor, borderRadius: 4 }} />
              </div>
              {perc < 75 && (
                <div style={{ fontSize: 11, color: "#dc2626", marginTop: 5 }}>
                  <AlertTriangle size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />
                  Execução abaixo da meta — ação corretiva necessária
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Abas */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button style={S.tab(aba === "estoque")}     onClick={() => setAba("estoque")}>Estoque</button>
        <button style={S.tab(aba === "dispensacao")} onClick={() => setAba("dispensacao")}>Dispensações</button>
        <button style={S.tab(aba === "programas")}   onClick={() => setAba("programas")}>Programas</button>
      </div>

      {/* ABA ESTOQUE */}
      {aba === "estoque" && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={S.title}>Estoque de Medicamentos</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["", "critico", "zerado", "ok"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFiltroSit(s)}
                  style={{ ...S.tab(filtroSit === s), padding: "5px 10px", background: filtroSit === s ? "#7c3aed" : "#f5f5f3", color: filtroSit === s ? "#fff" : "#404040" }}
                >
                  {s || "Todos"}
                </button>
              ))}
            </div>
          </div>
          {(estoque as Medicamento[]).map((med) => {
            const cfg = STATUS_CONFIG[med.situacao] ?? STATUS_CONFIG.ok;
            const perc = med.estoque_minimo > 0
              ? Math.min((med.estoque_atual / med.estoque_minimo) * 100, 200)
              : 100;
            return (
              <div key={med.id} style={{ padding: "10px 0", borderBottom: "1px solid #f0f0ee" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{med.nome}</span>
                      <span style={{ background: cfg.bg, color: cfg.cor, borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 2 }}>
                        {cfg.icon} {cfg.label}
                      </span>
                      <span style={{ fontSize: 10, color: "#737373", background: "#f5f5f3", borderRadius: 3, padding: "1px 5px" }}>
                        {med.programa}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#737373" }}>
                      {med.principio_ativo} · {med.apresentacao}
                      {med.validade && ` · Val: ${med.validade}`}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", marginLeft: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: cfg.cor }}>{med.estoque_atual}</div>
                    <div style={{ fontSize: 10, color: "#737373" }}>mín: {med.estoque_minimo}</div>
                  </div>
                </div>
                <div style={{ marginTop: 6, height: 4, background: "#e5e5e3", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(perc, 100)}%`, height: "100%", background: cfg.cor, borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ABA DISPENSAÇÃO */}
      {aba === "dispensacao" && (
        <div style={S.card}>
          <div style={S.title}>Dispensações Mensais — 2026</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dispensacoes}>
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total_dispensacoes" fill="#7c3aed" radius={[3, 3, 0, 0]} name="Dispensações" />
              <Bar dataKey="usuarios_atendidos" fill="#c4b5fd" radius={[3, 3, 0, 0]} name="Usuários" />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 12 }}>
            {dispensacoes.slice(-3).map((d: Dispensacao) => (
              <div key={d.mes} style={{ background: "#f9f9f7", borderRadius: 6, padding: 10, textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#7c3aed" }}>{d.total_dispensacoes}</div>
                <div style={{ fontSize: 11, color: "#737373" }}>dispensações</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>{d.mes}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA PROGRAMAS */}
      {aba === "programas" && (
        <div style={S.card}>
          <div style={S.title}>Execução por Programa Farmacêutico</div>
          {(programas as Programa[]).map((p) => {
            const cor = p.execucao >= 75 ? "#059669" : p.execucao >= 50 ? "#d97706" : "#dc2626";
            return (
              <div key={p.programa} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{p.programa}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: cor }}>{p.execucao.toFixed(1)}%</span>
                </div>
                <div style={{ height: 8, background: "#e5e5e3", borderRadius: 4, overflow: "hidden", marginBottom: 4 }}>
                  <div style={{ width: `${Math.min(p.execucao, 100)}%`, height: "100%", background: cor, borderRadius: 4 }} />
                </div>
                {p.previsto > 0 && (
                  <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#737373" }}>
                    <span>Previsto: {fmt(p.previsto)}</span>
                    <span>Realizado: {fmt(p.realizado)}</span>
                    <span>Saldo: {fmt(p.previsto - p.realizado)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
