// src/pages/CadastrosCidadao.tsx — ACS → Cadastros do Cidadão
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Search, Info } from "lucide-react";
import { apiGet } from "../lib/api";

interface CidadaoItem {
  id: number;
  nome: string;
  cns_mascarado: string;
  data_nascimento: string | null;
  sexo: string | null;
  domicilio_id: number | null;
  microarea: string | null;
  origem_dado: "pec" | "ersus_operacional" | "ersus_manual";
  data_ultima_atualizacao_pec: string | null;
}

const ORIGEM_LABEL: Record<string, string> = {
  pec: "PEC (oficial)",
  ersus_operacional: "ERSUS 360 (operacional)",
  ersus_manual: "Cadastro manual (contingência)",
};
const ORIGEM_COR: Record<string, string> = {
  pec: "#16a34a", ersus_operacional: "#2563eb", ersus_manual: "#d97706",
};

export default function CadastrosCidadao() {
  const [busca, setBusca] = useState("");

  const { data: cidadaos = [], isLoading } = useQuery<CidadaoItem[]>({
    queryKey: ["cidadaos-lista"],
    queryFn: () => apiGet("/api/cidadaos") as Promise<CidadaoItem[]>,
    staleTime: 60_000,
  });

  const modoDemo = cidadaos.length > 0 && cidadaos[0].id < 0;

  const visiveis = cidadaos.filter(c =>
    !busca || c.nome.toLowerCase().includes(busca.toLowerCase()) || (c.microarea ?? "").toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg,#0c4a6e 0%,#075985 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
          <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}>
            <Users size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>ACS · Cadastros do Cidadão</span>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
          Cache local, somente leitura — o PEC e-SUS APS continua sendo a fonte oficial deste cadastro.
        </div>
      </div>

      <div style={{ padding: "20px 28px 60px" }}>
        {modoDemo && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fffbeb", border: "1px solid #fcd34d",
            borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#92400e", marginBottom: 14 }}>
            <Info size={14} />
            <span><strong>Modo demonstração</strong> — dados fictícios para referência. Sincronize o PEC para visualizar cadastros reais (Configurações → Integrações → PEC e-SUS APS).</span>
          </div>
        )}
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "12px 16px",
          marginBottom: 16, display: "flex", gap: 10, alignItems: "center" }}>
          <Search size={13} color="#9ca3af" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou microárea..."
            style={{ border: "none", outline: "none", fontSize: 12, flex: 1, background: "transparent" }} />
          <span style={{ fontSize: 11, color: "#9ca3af" }}>{visiveis.length} cidadão(s)</span>
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando cadastros...</div>
        ) : visiveis.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#eff6ff", border: "1px solid #bfdbfe",
            borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#1e40af" }}>
            <Info size={14} />
            Nenhum cidadão sincronizado ainda. Este cadastro é populado a partir do PEC
            (Configurações → Integrações → PEC e-SUS APS → Sincronizar Cadastros) ou de cadastros de contingência.
          </div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e7ec" }}>
                  {["Nome", "CNS", "Nascimento", "Sexo", "Microárea", "Origem do dado", "Última atualização PEC"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700, color: "#6b7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visiveis.map(c => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 600 }}>{c.nome}</td>
                    <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>{c.cns_mascarado}</td>
                    <td style={{ padding: "8px 12px" }}>{c.data_nascimento ? new Date(c.data_nascimento).toLocaleDateString("pt-BR") : "—"}</td>
                    <td style={{ padding: "8px 12px" }}>{c.sexo ?? "—"}</td>
                    <td style={{ padding: "8px 12px" }}>{c.microarea ?? "—"}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: ORIGEM_COR[c.origem_dado],
                        background: `${ORIGEM_COR[c.origem_dado]}15`, padding: "2px 8px", borderRadius: 20 }}>
                        {ORIGEM_LABEL[c.origem_dado] ?? c.origem_dado}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px", color: "#9ca3af" }}>
                      {c.data_ultima_atualizacao_pec ? new Date(c.data_ultima_atualizacao_pec).toLocaleString("pt-BR") : "nunca"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
