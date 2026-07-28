// src/pages/VisitasDomiciliaresCidadao.tsx — ACS → Visitas Domiciliares Cidadão
// Histórico de visitas por cidadão — continuidade do cuidado (não é o mapa geral, ver MapaVisitasDomiciliares.tsx).
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Info, Search } from "lucide-react";
import { apiGet } from "../lib/api";

interface CidadaoItem {
  id: number; nome: string; cns_mascarado: string; microarea: string | null;
}
interface VisitaHistorico {
  id: number; numero_controle: string; data: string;
  acs: string | null; equipe: string | null; microarea: string | null;
  motivo_visita: string; tipo_visita: string; desfecho: string | null;
  duracao_segundos: number | null; status_fila: string;
}
interface HistoricoResposta {
  cidadao: { id: number; nome: string; cns_mascarado: string };
  visitas: VisitaHistorico[];
}

const STATUS_LABEL: Record<string, string> = {
  criado_localmente: "Criada localmente", sincronizado_ersus: "Sincronizada no ERSUS",
  validado_ersus: "Validada no ERSUS", preparado_ledi: "Preparada (LEDI)",
  enviado_pec: "Enviada ao PEC", recebido_pec: "Recebida pelo PEC",
  processando_pec: "Processando no PEC", aceito_pec: "Aceita pelo PEC",
  rejeitado_pec: "Rejeitada pelo PEC", corrigido: "Corrigida", reenviado: "Reenviada",
  processado_fluxo_oficial: "Incluída no fluxo oficial",
};

export default function VisitasDomiciliaresCidadao() {
  const [busca, setBusca] = useState("");
  const [cidadaoId, setCidadaoId] = useState<number | null>(null);

  const { data: cidadaos = [] } = useQuery<CidadaoItem[]>({
    queryKey: ["cidadaos-lista"],
    queryFn: () => apiGet("/api/cidadaos") as Promise<CidadaoItem[]>,
    staleTime: 60_000,
  });

  const { data: historico, isLoading: carregandoHistorico } = useQuery<HistoricoResposta>({
    queryKey: ["cidadao-visitas", cidadaoId],
    queryFn: () => apiGet(`/api/cidadaos/${cidadaoId}/visitas`) as Promise<HistoricoResposta>,
    enabled: cidadaoId !== null,
  });

  const visiveis = cidadaos.filter(c =>
    !busca || c.nome.toLowerCase().includes(busca.toLowerCase()) || (c.microarea ?? "").toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg,#0c4a6e 0%,#075985 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
          <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}>
            <MapPin size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>ACS · Visitas Domiciliares Cidadão</span>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
          Histórico de visitas de um cidadão específico — para a visão geográfica de todas as visitas, use o Mapa de Visitas Domiciliares.
        </div>
      </div>

      <div style={{ padding: "20px 28px 60px", display: "grid", gridTemplateColumns: "300px 1fr", gap: 16 }}>
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: 14, height: "fit-content" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e5e7eb",
            borderRadius: 8, padding: "7px 10px", marginBottom: 10 }}>
            <Search size={12} color="#9ca3af" />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar cidadão..."
              style={{ border: "none", outline: "none", fontSize: 12, flex: 1, background: "transparent" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 500, overflowY: "auto" as const }}>
            {visiveis.map(c => (
              <button key={c.id} onClick={() => setCidadaoId(c.id)}
                style={{ textAlign: "left", padding: "8px 10px", borderRadius: 8, border: "1px solid",
                  borderColor: cidadaoId === c.id ? "#0284c7" : "transparent",
                  background: cidadaoId === c.id ? "#eff6ff" : "transparent", cursor: "pointer" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{c.nome}</div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>{c.microarea ?? "—"} · {c.cns_mascarado}</div>
              </button>
            ))}
            {visiveis.length === 0 && (
              <div style={{ fontSize: 11, color: "#9ca3af", padding: "8px 4px" }}>Nenhum cidadão sincronizado ainda.</div>
            )}
          </div>
        </div>

        <div>
          {!cidadaoId ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#eff6ff", border: "1px solid #bfdbfe",
              borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#1e40af" }}>
              <Info size={14} /> Selecione um cidadão na lista à esquerda para ver o histórico de visitas.
            </div>
          ) : carregandoHistorico ? (
            <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando histórico...</div>
          ) : historico && historico.visitas.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#eff6ff", border: "1px solid #bfdbfe",
              borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#1e40af" }}>
              <Info size={14} /> Nenhuma visita registrada ainda para {historico.cidadao.nome}.
            </div>
          ) : historico && (
            <>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
                Histórico de {historico.cidadao.nome} <span style={{ fontWeight: 400, color: "#9ca3af", fontSize: 12 }}>({historico.cidadao.cns_mascarado})</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {historico.visitas.map(v => (
                  <div key={v.id} style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "12px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{v.tipo_visita}</span>
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>{new Date(v.data).toLocaleString("pt-BR")}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>
                      ACS: <b>{v.acs ?? "—"}</b> · Equipe: {v.equipe ?? "—"} · Microárea: {v.microarea ?? "—"}
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>Motivo: {v.motivo_visita}{v.desfecho ? ` · Desfecho: ${v.desfecho}` : ""}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                      <span style={{ fontSize: 9, fontFamily: "monospace", color: "#9ca3af" }}>{v.numero_controle}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#0284c7", background: "#eff6ff", padding: "2px 8px", borderRadius: 20 }}>
                        {STATUS_LABEL[v.status_fila] ?? v.status_fila}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
