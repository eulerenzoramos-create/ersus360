// src/pages/Patrimonio.tsx — Patrimônio e Frota ERSUS 360
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiPatrimonio } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

type Veiculo = { placa: string; descricao: string; tipo: string; ano: number; km_atual: number; ultima_manutencao: string; status: string; responsavel: string };
type Bem = { tombamento: string; descricao: string; tipo: string; estado: string; valor_aquisicao: number; ano: number };
type Manutencao = { id: number; veiculo: string; tipo: string; km_entrada: number; descricao: string; data: string; custo: number; oficina: string; status: string };

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, { cor: string; bg: string }> = {
    otimo: { cor: "#1a237e", bg: "#e8eaf6" },
    bom: { cor: "#2e7d32", bg: "#e8f5e9" },
    regular: { cor: "#e65100", bg: "#fff3e0" },
    ruim: { cor: "#c62828", bg: "#ffebee" },
    inservivel: { cor: "#616161", bg: "#f5f5f5" },
  };
  const s = map[estado] ?? { cor: "#616161", bg: "#f5f5f5" };
  return <span style={{ background: s.bg, color: s.cor, padding: "2px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: "capitalize" as const }}>{estado}</span>;
}

export default function Patrimonio() {
  const [aba, setAba] = useState<"painel" | "frota" | "bens" | "manutencao" | "combustivel">("painel");

  const { data: painel } = useQuery({ queryKey: ["patrimonio-painel"], queryFn: apiPatrimonio.painel });
  const { data: frota } = useQuery({ queryKey: ["patrimonio-frota"], queryFn: apiPatrimonio.frota });
  const { data: bens } = useQuery({ queryKey: ["patrimonio-bens"], queryFn: apiPatrimonio.bens });
  const { data: manut } = useQuery({ queryKey: ["patrimonio-manut"], queryFn: apiPatrimonio.manutencao });
  const { data: comb } = useQuery({ queryKey: ["patrimonio-comb"], queryFn: apiPatrimonio.abastecimento });

  if (!isLoading && !painel) return (
    <div style={{ padding: 24 }}>
      <NaoDisponivelBanner
        titulo="Patrimonio indisponivel"
        nota="Dados nao disponiveis — integracao pendente de configuracao no Railway."
      />
    </div>
  );

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1565c0" }}>Patrimônio e Frota</h2>
        <p style={{ margin: "4px 0 0", color: "#666", fontSize: 13 }}>Bens tombados, veículos, manutenção e abastecimento</p>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", gap: 2, marginBottom: 16, borderBottom: "2px solid #e4e7ec" }}>
        {[
          { key: "painel" as const, label: "Painel" },
          { key: "frota" as const, label: "Frota" },
          { key: "bens" as const, label: "Bens Tombados" },
          { key: "manutencao" as const, label: "Manutenção" },
          { key: "combustivel" as const, label: "Abastecimento" },
        ].map(a => (
          <button key={a.key} onClick={() => setAba(a.key)}
            style={{ padding: "8px 16px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: aba === a.key ? "#1565c0" : "transparent",
              color: aba === a.key ? "#fff" : "#555",
              borderRadius: "6px 6px 0 0",
            }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Painel */}
      {aba === "painel" && painel && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Total de Bens", value: painel.total_bens, cor: "#1565c0" },
              { label: "Frota Total", value: painel.frota_total, cor: "#2e7d32" },
              { label: "Frota Ativa", value: painel.frota_ativa, cor: "#2e7d32" },
              { label: "Em Manutenção", value: painel.frota_manutencao, cor: "#e65100" },
            ].map(k => (
              <div key={k.label} style={{ background: "#fff", borderRadius: 8, padding: "16px 20px", border: `2px solid ${k.cor}20` }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: k.cor }}>{k.value}</div>
                <div style={{ fontSize: 13, color: "#555", marginTop: 2, fontWeight: 600 }}>{k.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", padding: 18 }}>
              <div style={{ fontSize: 13, color: "#666" }}>Valor Patrimônio</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#1565c0" }}>R$ {painel.valor_patrimonio?.toLocaleString("pt-BR")}</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", padding: 18 }}>
              <div style={{ fontSize: 13, color: "#666" }}>Custo Manutenção + Combustível/mês</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#e65100" }}>R$ {((painel.custo_manutencao_mes ?? 0) + (painel.custo_combustivel_mes ?? 0)).toLocaleString("pt-BR")}</div>
            </div>
          </div>
          {painel.alertas?.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", padding: 18 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: "#333" }}>Alertas</div>
              {painel.alertas.map((al: { tipo: string; descricao: string }, i: number) => (
                <div key={i} style={{ padding: "8px 12px", background: "#fff3e0", borderRadius: 6, marginBottom: 8, borderLeft: "4px solid #e65100", fontSize: 13 }}>
                  {al.descricao}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Frota */}
      {aba === "frota" && frota && (
        <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                {["Placa", "Veículo", "Tipo", "Ano", "KM", "Últ. Manutenção", "Responsável", "Status"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#666", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {frota.veiculos?.map((v: Veiculo, i: number) => (
                <tr key={v.placa} style={{ borderTop: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 13, fontWeight: 700 }}>{v.placa}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13 }}>{v.descricao}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#666" }}>{v.tipo.replace(/_/g, " ")}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13 }}>{v.ano}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13 }}>{v.km_atual.toLocaleString("pt-BR")} km</td>
                  <td style={{ padding: "10px 14px", fontSize: 12 }}>{v.ultima_manutencao}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#666" }}>{v.responsavel}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ background: v.status === "ativo" ? "#e8f5e9" : "#fff3e0", color: v.status === "ativo" ? "#2e7d32" : "#e65100", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                      {v.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bens Tombados */}
      {aba === "bens" && bens && (
        <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                {["Tombamento", "Descrição", "Tipo", "Ano", "Valor Aquisição", "Estado"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#666", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bens.bens?.map((b: Bem, i: number) => (
                <tr key={b.tombamento} style={{ borderTop: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 13 }}>{b.tombamento}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13 }}>{b.descricao}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#666" }}>{b.tipo.replace(/_/g, " ")}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13 }}>{b.ano}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>R$ {b.valor_aquisicao.toLocaleString("pt-BR")}</td>
                  <td style={{ padding: "10px 14px" }}><EstadoBadge estado={b.estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Manutenção */}
      {aba === "manutencao" && manut && (
        <div>
          <div style={{ background: "#e8f5e9", borderRadius: 8, padding: "12px 18px", marginBottom: 16, fontSize: 14 }}>
            Custo total de manutenções no ano: <strong>R$ {manut.total_custo_ano?.toLocaleString("pt-BR")}</strong>
          </div>
          {manut.manutencoes?.map((m: Manutencao) => (
            <div key={m.id} style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", padding: 18, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 4 }}>{m.veiculo}</div>
                  <div style={{ fontSize: 13, color: "#555" }}>{m.descricao}</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>Oficina: {m.oficina} · Data: {m.data}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#1565c0" }}>R$ {m.custo.toLocaleString("pt-BR")}</div>
                  <span style={{ background: m.status === "concluida" ? "#e8f5e9" : "#fff3e0", color: m.status === "concluida" ? "#2e7d32" : "#e65100", padding: "2px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                    {m.status === "concluida" ? "CONCLUÍDA" : "EM ANDAMENTO"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Abastecimento */}
      {aba === "combustivel" && comb && (
        <div>
          <div style={{ background: "#e3f2fd", borderRadius: 8, padding: "12px 18px", marginBottom: 16, fontSize: 14 }}>
            Custo total de combustível no mês: <strong>R$ {comb.custo_mes?.toLocaleString("pt-BR")}</strong>
          </div>
          <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f5f5f5" }}>
                  {["Data", "Veículo", "KM", "Litros", "Valor", "Consumo (km/l)"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#666", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comb.abastecimentos?.map((a: { data: string; veiculo: string; km: number; litros: number; valor_total: number; consumo_km_l: number }, i: number) => (
                  <tr key={i} style={{ borderTop: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "10px 14px", fontSize: 13 }}>{a.data}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontFamily: "monospace" }}>{a.veiculo}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13 }}>{a.km.toLocaleString("pt-BR")} km</td>
                    <td style={{ padding: "10px 14px", fontSize: 13 }}>{a.litros} L</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700 }}>R$ {a.valor_total.toLocaleString("pt-BR")}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13 }}>{a.consumo_km_l} km/l</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
