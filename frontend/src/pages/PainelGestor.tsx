// src/pages/PainelGestor.tsx
import { useQuery } from "@tanstack/react-query";
import { apiDashboard, apiAlertas, apiIndicadores } from "../lib/api";
import {
  TrendingUp, TrendingDown, AlertTriangle, AlertCircle, CheckCircle,
  Activity, DollarSign, Target, Bell,
} from "lucide-react";

const fmt = (v: number) =>
  v >= 1_000_000
    ? `R$${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
    ? `R$${(v / 1_000).toFixed(0)}K`
    : `R$${v.toFixed(0)}`;

const corSemaforo = (valor: number, meta: number) => {
  const p = meta > 0 ? valor / meta : 0;
  if (p >= 0.9) return "#3B6D11";
  if (p >= 0.6) return "#BA7517";
  return "#A32D2D";
};

const bgSeveridade: Record<string, string> = {
  critico: "#FCEBEB",
  atencao: "#FAEEDA",
  info: "#E6F1FB",
};
const corSeveridade: Record<string, string> = {
  critico: "#A32D2D",
  atencao: "#854F0B",
  info: "#185FA5",
};
const IconSeveridade = ({ s }: { s: string }) =>
  s === "critico" ? <AlertTriangle size={14} /> : <AlertCircle size={14} />;

export default function PainelGestor() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiDashboard.stats(),
  });
  const { data: alertas = [] } = useQuery({
    queryKey: ["alertas"],
    queryFn: () => apiAlertas.list(),
  });
  const { data: indicadores = [] } = useQuery({
    queryKey: ["indicadores"],
    queryFn: () => apiIndicadores.list(),
  });

  if (isLoading) return (
    <div style={{ padding: 32, textAlign: "center", color: "var(--color-text-secondary)", fontSize: 13 }}>
      Carregando painel...
    </div>
  );

  const kpis = [
    {
      label: "Indicadores atingidos",
      value: stats ? `${stats.indicadores_atingidos}/${stats.total_indicadores}` : "—",
      sub: stats ? `${Math.round((stats.indicadores_atingidos / (stats.total_indicadores || 1)) * 100)}%` : "",
      Icon: Target,
      trend: "up",
    },
    {
      label: "Repasses recebidos",
      value: stats ? fmt(stats.total_repasses) : "—",
      sub: `${stats?.convenios_vigentes ?? 0} convênios vigentes`,
      Icon: DollarSign,
      trend: "up",
    },
    {
      label: "Execução PAS",
      value: stats ? `${stats.execucao_pas.toFixed(0)}%` : "—",
      sub: "Meta: 100%",
      Icon: Activity,
      trend: stats && stats.execucao_pas < 70 ? "down" : "up",
    },
    {
      label: "Alertas ativos",
      value: alertas.filter((a) => !a.resolvido).length.toString(),
      sub: `${alertas.filter((a) => a.severidade === "critico" && !a.resolvido).length} críticos`,
      Icon: Bell,
      trend: "down",
    },
  ];

  const semaforo = indicadores.slice(0, 8);

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: "10px" }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ background: "var(--color-background-secondary)", borderRadius: "8px", padding: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>{k.label}</span>
              <k.Icon size={14} color="var(--color-text-secondary)" />
            </div>
            <div style={{ fontSize: "22px", fontWeight: 500 }}>{k.value}</div>
            <div style={{ fontSize: "11px", marginTop: "2px", display: "flex", alignItems: "center", gap: "3px",
              color: k.trend === "up" ? "#3B6D11" : "#A32D2D" }}>
              {k.trend === "up" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Semáforo de indicadores */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "12px", padding: "16px" }}>
        <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
          <Activity size={15} /> Semáforo de indicadores críticos
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {semaforo.map((ind) => {
            const cor = corSemaforo(ind.valor_alcancado, ind.meta_prevista);
            const pct = Math.min(100, Math.round((ind.valor_alcancado / (ind.meta_prevista || 1)) * 100));
            return (
              <div key={ind.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: cor, flexShrink: 0 }} />
                <div style={{ fontSize: "12px", flex: "0 0 auto", minWidth: 0, maxWidth: 150,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  title={ind.indicador}>{ind.indicador}</div>
                <div style={{ flex: 1, height: 6, background: "var(--color-background-secondary)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: cor, borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: "12px", fontWeight: 500, color: cor, minWidth: 36, textAlign: "right" }}>
                  {ind.valor_alcancado.toFixed(0)}%
                </div>
              </div>
            );
          })}
          {semaforo.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", textAlign: "center", padding: "10px 0" }}>
              Nenhum indicador cadastrado. Acesse a aba Indicadores para adicionar.
            </div>
          )}
        </div>
      </div>

      {/* Alertas */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "12px", padding: "16px" }}>
        <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
          <Bell size={15} /> Alertas prioritários
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {alertas.filter((a) => !a.resolvido).slice(0, 5).map((a) => (
            <div key={a.id} style={{
              padding: "10px 12px", borderRadius: "8px",
              background: bgSeveridade[a.severidade] ?? "#f5f5f3",
              border: `0.5px solid ${corSeveridade[a.severidade] ?? "#888"}`,
              display: "flex", gap: "10px", alignItems: "flex-start",
            }}>
              <span style={{ color: corSeveridade[a.severidade], flexShrink: 0, marginTop: 1 }}>
                <IconSeveridade s={a.severidade} />
              </span>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 500, color: corSeveridade[a.severidade] }}>{a.titulo}</div>
                <div style={{ fontSize: "11px", color: corSeveridade[a.severidade], marginTop: 2, opacity: 0.85 }}>
                  {a.modulo} · {new Date(a.criado_em).toLocaleDateString("pt-BR")}
                </div>
              </div>
            </div>
          ))}
          {alertas.filter((a) => !a.resolvido).length === 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: 12, color: "#3B6D11" }}>
              <CheckCircle size={14} /> Nenhum alerta ativo. Tudo em ordem!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
