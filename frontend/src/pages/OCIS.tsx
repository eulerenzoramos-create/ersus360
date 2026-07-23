// src/pages/OCIS.tsx — Centro de Operações em Saúde ERSUS 360
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiOCIS } from "../lib/api";

type Alerta = { id: number; nivel: string; categoria: string; titulo: string; descricao: string; data: string; resolvido: boolean };
type TFD = { id: number; paciente: string; cid: string; especialidade: string; hospital_destino: string; tipo_transporte: string; data_viagem: string; status: string; custo_estimado: number };
type Fila = { especialidade: string; aguardando: number; media_espera_dias: number };

function NivelBadge({ nivel }: { nivel: string }) {
  const cor = nivel === "CRITICO" ? "#c62828" : nivel === "AVISO" ? "#e65100" : "#1565c0";
  return <span style={{ background: `${cor}15`, color: cor, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{nivel}</span>;
}

export default function OCIS() {
  const [aba, setAba] = useState<"central" | "regulacao" | "tfd">("central");

  const { data: dash } = useQuery({ queryKey: ["ocis-dash"], queryFn: apiOCIS.dashboard });
  const { data: alertas } = useQuery({ queryKey: ["ocis-alertas"], queryFn: apiOCIS.centralAlertas });
  const { data: fila } = useQuery({ queryKey: ["ocis-fila"], queryFn: apiOCIS.filaEspera });
  const { data: tfd } = useQuery({ queryKey: ["ocis-tfd"], queryFn: apiOCIS.tfd });

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1565c0" }}>OCIS — Centro de Operações em Saúde</h2>
        <p style={{ margin: "4px 0 0", color: "#666", fontSize: 13 }}>Monitoramento em tempo real · Regulação · TFD · Alertas</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Alertas Críticos", value: dash?.alertas_criticos ?? 3, cor: "#c62828" },
          { label: "Alertas de Aviso", value: dash?.alertas_avisos ?? 7, cor: "#e65100" },
          { label: "TFD em Andamento", value: dash?.tfd_em_andamento ?? 5, cor: "#1565c0" },
          { label: "Fila de Regulação", value: dash?.regulacao_fila_total ?? 42, cor: "#6a1b9a" },
        ].map(k => (
          <div key={k.label} style={{ background: "#fff", borderRadius: 8, padding: "16px 20px", border: `2px solid ${k.cor}20` }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: k.cor }}>{k.value}</div>
            <div style={{ fontSize: 13, color: "#555", marginTop: 2, fontWeight: 600 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div style={{ display: "flex", gap: 2, marginBottom: 16, borderBottom: "2px solid #e4e7ec" }}>
        {[{ key: "central" as const, label: "Central de Alertas" }, { key: "regulacao" as const, label: "Regulação" }, { key: "tfd" as const, label: "TFD" }].map(a => (
          <button key={a.key} onClick={() => setAba(a.key)}
            style={{ padding: "8px 18px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: aba === a.key ? "#1565c0" : "transparent",
              color: aba === a.key ? "#fff" : "#555",
              borderRadius: "6px 6px 0 0",
            }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Central de Alertas */}
      {aba === "central" && alertas && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {alertas.alertas?.map((a: Alerta) => (
            <div key={a.id} style={{ background: "#fff", borderRadius: 8, padding: "14px 18px", border: `1px solid ${a.nivel === "CRITICO" ? "#c6282840" : "#e6510040"}`, borderLeft: `4px solid ${a.nivel === "CRITICO" ? "#c62828" : "#e65100"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <NivelBadge nivel={a.nivel} />
                    <span style={{ fontSize: 11, color: "#888", background: "#f5f5f5", padding: "2px 8px", borderRadius: 4 }}>{a.categoria}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#333" }}>{a.titulo}</div>
                  <div style={{ fontSize: 13, color: "#666", marginTop: 3 }}>{a.descricao}</div>
                </div>
                <div style={{ fontSize: 11, color: "#999", flexShrink: 0, marginLeft: 16 }}>
                  {new Date(a.data).toLocaleString("pt-BR")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Regulação */}
      {aba === "regulacao" && fila && (
        <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 700, color: "#333" }}>Fila de Espera por Especialidade</div>
            <div style={{ fontSize: 13, color: "#666" }}>Média espera: <strong>{fila.regulacao_media_espera_dias ?? 18} dias</strong> · Meta: &lt; 30 dias</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, color: "#666", fontWeight: 600 }}>Especialidade</th>
                <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 12, color: "#666", fontWeight: 600 }}>Aguardando</th>
                <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 12, color: "#666", fontWeight: 600 }}>Média Espera</th>
                <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 12, color: "#666", fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {fila.fila?.map((f: Fila, i: number) => (
                <tr key={f.especialidade} style={{ borderTop: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "10px 16px", fontSize: 13 }}>{f.especialidade}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700, fontSize: 14 }}>{f.aguardando}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right", fontSize: 13 }}>{f.media_espera_dias} dias</td>
                  <td style={{ padding: "10px 16px", textAlign: "center" }}>
                    <span style={{ background: f.media_espera_dias <= 30 ? "#e8f5e9" : "#ffebee", color: f.media_espera_dias <= 30 ? "#2e7d32" : "#c62828", padding: "2px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                      {f.media_espera_dias <= 30 ? "OK" : "FORA DA META"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TFD */}
      {aba === "tfd" && tfd && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: "14px 18px", border: "1px solid #e0e0e0" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#1565c0" }}>{tfd.resumo?.total_mes ?? 5}</div>
              <div style={{ fontSize: 13, color: "#555" }}>TFDs no mês</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 8, padding: "14px 18px", border: "1px solid #e0e0e0" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#2e7d32" }}>R$ {tfd.resumo?.custo_mes?.toLocaleString("pt-BR") ?? "6.200"}</div>
              <div style={{ fontSize: 13, color: "#555" }}>Custo total do mês</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 8, padding: "14px 18px", border: "1px solid #e0e0e0" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#6a1b9a" }}>{tfd.resumo?.tipo_mais_frequente ?? "terrestre"}</div>
              <div style={{ fontSize: 13, color: "#555" }}>Transporte mais frequente</div>
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f0f0", fontWeight: 700, color: "#333" }}>Solicitações TFD</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f5f5f5" }}>
                  {["Paciente", "Especialidade", "Destino", "Transporte", "Data", "Custo", "Status"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#666", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tfd.tfd?.map((t: TFD) => (
                  <tr key={t.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "10px 14px", fontSize: 13 }}>{t.paciente}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13 }}>{t.especialidade}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#666" }}>{t.hospital_destino}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12 }}>
                      <span style={{ background: "#e3f2fd", color: "#1565c0", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{t.tipo_transporte}</span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12 }}>{t.data_viagem}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>R$ {t.custo_estimado.toLocaleString("pt-BR")}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ background: t.status === "realizado" ? "#e8f5e9" : "#fff8e1", color: t.status === "realizado" ? "#2e7d32" : "#f57f17", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                        {t.status.toUpperCase()}
                      </span>
                    </td>
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
