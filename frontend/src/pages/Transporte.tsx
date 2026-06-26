// Módulo — Transporte em Saúde / TFD
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Truck, MapPin, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

const S = {
  page:  { padding: 20 } as React.CSSProperties,
  card:  { background: "#fff", borderRadius: 8, border: "1px solid #e5e5e3", padding: 16, marginBottom: 14 } as React.CSSProperties,
  title: { fontSize: 14, fontWeight: 600, marginBottom: 12 } as React.CSSProperties,
  tab:   (a: boolean) => ({ padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, background: a ? "#0284c7" : "#f5f5f3", color: a ? "#fff" : "#404040" }) as React.CSSProperties,
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Dashboard {
  veiculos_total: number; veiculos_disponiveis: number;
  veiculos_manutencao: number; veiculos_indisponiveis: number;
  tfd_mes_atual: number; tfd_valor_mes: number; km_rodados_mes: number;
}
interface Veiculo {
  id: number; placa: string; modelo: string; ano: number; tipo: string;
  situacao: string; km_atual: number; proxima_revisao_km: number; motorista?: string;
}
interface TFD {
  id: number; paciente: string; especialidade: string; destino: string;
  data_saida: string; valor_diaria: number; dias: number; status: string;
}

const SIT_VEI: Record<string, { cor: string; bg: string; icon: React.ReactNode }> = {
  "Disponível":    { cor: "#059669", bg: "#f0fdf4", icon: <CheckCircle2 size={12} /> },
  "Em Manutenção": { cor: "#d97706", bg: "#fffbeb", icon: <AlertTriangle size={12} /> },
  "Indisponível":  { cor: "#dc2626", bg: "#fff0f0", icon: <AlertTriangle size={12} /> },
};

export default function Transporte() {
  const [aba, setAba] = useState<"frota" | "tfd">("frota");

  const { data: dashboard } = useQuery<Dashboard>({
    queryKey: ["transporte-dashboard"],
    queryFn: () => api.get("/api/transporte/dashboard").then((r) => r.data),
  });
  const { data: veiculos = [] } = useQuery<Veiculo[]>({
    queryKey: ["transporte-veiculos"],
    queryFn: () => api.get("/api/transporte/veiculos").then((r) => r.data),
    enabled: aba === "frota",
  });
  const { data: tfd = [] } = useQuery<TFD[]>({
    queryKey: ["transporte-tfd"],
    queryFn: () => api.get("/api/transporte/tfd").then((r) => r.data),
    enabled: aba === "tfd",
  });

  return (
    <div style={S.page}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <Truck size={16} /> Transporte em Saúde / TFD
      </div>

      {/* KPIs */}
      {dashboard && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Frota Total",        valor: dashboard.veiculos_total,        cor: "#0284c7" },
            { label: "Disponíveis",         valor: dashboard.veiculos_disponiveis,  cor: "#059669" },
            { label: "Em Manutenção",       valor: dashboard.veiculos_manutencao,   cor: "#d97706" },
            { label: "TFD / Mês",           valor: dashboard.tfd_mes_atual,         cor: "#7c3aed" },
          ].map(({ label, valor, cor }) => (
            <div key={label} style={{ ...S.card, textAlign: "center", padding: 12, margin: 0 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: cor }}>{valor}</div>
              <div style={{ fontSize: 12, color: "#737373" }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {dashboard && (
        <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: "#737373" }}>Custo TFD / Mês</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#7c3aed" }}>{fmt(dashboard.tfd_valor_mes)}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#737373" }}>Km Rodados / Mês</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#0284c7" }}>{dashboard.km_rodados_mes.toLocaleString("pt-BR")} km</div>
          </div>
        </div>
      )}

      {/* Abas */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button style={S.tab(aba === "frota")} onClick={() => setAba("frota")}>Frota</button>
        <button style={S.tab(aba === "tfd")}   onClick={() => setAba("tfd")}>TFD — Pacientes</button>
      </div>

      {/* Frota */}
      {aba === "frota" && (
        <div style={S.card}>
          <div style={S.title}>Veículos de Saúde</div>
          {(veiculos as Veiculo[]).map((v) => {
            const cfg = SIT_VEI[v.situacao] ?? SIT_VEI["Disponível"];
            const kmAteRevisao = v.proxima_revisao_km - v.km_atual;
            return (
              <div key={v.id} style={{ padding: "10px 0", borderBottom: "1px solid #f0f0ee" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace" }}>{v.placa}</span>
                      <span style={{ background: cfg.bg, color: cfg.cor, borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 2 }}>
                        {cfg.icon} {v.situacao}
                      </span>
                      <span style={{ fontSize: 10, background: "#f5f5f3", borderRadius: 3, padding: "1px 6px", color: "#737373" }}>{v.tipo}</span>
                    </div>
                    <div style={{ fontSize: 13 }}>{v.modelo} ({v.ano})</div>
                    {v.motorista && <div style={{ fontSize: 11, color: "#9ca3af" }}>Motorista: {v.motorista}</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "#737373" }}>{v.km_atual.toLocaleString("pt-BR")} km</div>
                    {v.proxima_revisao_km > 0 && (
                      <div style={{ fontSize: 11, color: kmAteRevisao <= 2000 ? "#dc2626" : "#9ca3af" }}>
                        revisão em {kmAteRevisao.toLocaleString("pt-BR")} km
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TFD */}
      {aba === "tfd" && (
        <div style={S.card}>
          <div style={S.title}>Tratamento Fora do Domicílio — Junho/2026</div>
          {(tfd as TFD[]).map((t) => {
            const cor = t.status === "Realizado" ? "#059669" : t.status === "Agendado" ? "#0284c7" : "#d97706";
            const bg  = t.status === "Realizado" ? "#f0fdf4" : t.status === "Agendado" ? "#eff6ff" : "#fffbeb";
            return (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0ee" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{t.paciente}</span>
                    <span style={{ background: bg, color: cor, borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 600 }}>
                      {t.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#737373" }}>
                    {t.especialidade} · <MapPin size={10} style={{ verticalAlign: "middle" }} /> {t.destino}
                    · <Clock size={10} style={{ verticalAlign: "middle" }} /> {new Date(t.data_saida).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{fmt(t.valor_diaria * t.dias)}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>{t.dias}d × {fmt(t.valor_diaria)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
