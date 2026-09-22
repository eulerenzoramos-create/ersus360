/**
 * Seleção de município — ERSUS 360 (multi-tenant)
 *
 * Lista SOMENTE os municípios que o backend autoriza para o usuário
 * (/api/tenant/municipios). A escolha gera um novo token no backend, com
 * registro na auditoria, e recarrega toda a aplicação no novo contexto.
 */
import { useEffect, useState } from "react";
import { MapPin, LogOut, Search } from "lucide-react";
import { api } from "../lib/api";
import { selecionarMunicipio } from "../lib/sessao";

interface MunicipioAutorizado {
  uuid: string;
  nome: string;
  uf: string;
  codigo_ibge: string;
  situacao: string;
  brasao_url: string | null;
}

const SITUACAO_LABEL: Record<string, string> = {
  disponivel: "Disponível", implantacao: "Em implantação", ativo: "Ativo",
  suspenso: "Suspenso", encerrado: "Encerrado",
};

export function ListaMunicipios({ atualUuid }: { atualUuid?: string | null }) {
  const [lista, setLista] = useState<MunicipioAutorizado[] | null>(null);
  const [filtro, setFiltro] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState<string | null>(null);

  useEffect(() => {
    api.get<MunicipioAutorizado[]>("/api/tenant/municipios")
      .then(r => setLista(r.data))
      .catch(() => setErro("Não foi possível carregar os municípios autorizados."));
  }, []);

  const escolher = async (m: MunicipioAutorizado) => {
    setEnviando(m.uuid);
    setErro("");
    try {
      await selecionarMunicipio(m.uuid);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Acesso negado.");
      setEnviando(null);
    }
  };

  const visiveis = (lista ?? []).filter(m =>
    `${m.nome} ${m.uf} ${m.codigo_ibge}`.toLowerCase().includes(filtro.toLowerCase()));

  return (
    <div>
      <div style={{ position: "relative", marginBottom: 12 }}>
        <Search size={14} color="#64748b" style={{ position: "absolute", left: 10, top: 10 }} />
        <input value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="Buscar município…"
          aria-label="Buscar município"
          style={{ width: "100%", padding: "8px 10px 8px 30px", borderRadius: 8, border: "1px solid #cbd5e1",
                   fontSize: 13, boxSizing: "border-box" }} />
      </div>
      {erro && <div role="alert" style={{ color: "#b91c1c", fontSize: 13, marginBottom: 10 }}>{erro}</div>}
      {lista === null && !erro && <div style={{ color: "#64748b", fontSize: 13 }}>Carregando…</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 380, overflowY: "auto" }}>
        {visiveis.map(m => (
          <button key={m.uuid} onClick={() => escolher(m)} disabled={!!enviando || m.uuid === atualUuid}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8,
              border: `1px solid ${m.uuid === atualUuid ? "#1d4ed8" : "#e2e8f0"}`,
              background: m.uuid === atualUuid ? "#eff6ff" : "#fff", cursor: "pointer", textAlign: "left",
            }}>
            {m.brasao_url
              ? <img src={m.brasao_url} alt="" width={28} height={28} style={{ objectFit: "contain" }} />
              : <MapPin size={20} color="#1d4ed8" />}
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontWeight: 700, fontSize: 13, color: "#0f172a" }}>
                {m.nome} / {m.uf}
              </span>
              <span style={{ fontSize: 11, color: "#64748b" }}>
                IBGE {m.codigo_ibge} · {SITUACAO_LABEL[m.situacao] ?? m.situacao}
              </span>
            </span>
            {enviando === m.uuid && <span style={{ fontSize: 11, color: "#1d4ed8" }}>Entrando…</span>}
            {m.uuid === atualUuid && <span style={{ fontSize: 11, color: "#1d4ed8" }}>Atual</span>}
          </button>
        ))}
        {lista !== null && visiveis.length === 0 && (
          <div style={{ color: "#64748b", fontSize: 13 }}>Nenhum município encontrado.</div>
        )}
      </div>
    </div>
  );
}

/** Tela cheia exibida ao administrador-geral enquanto nenhum município está selecionado. */
export default function SeletorMunicipio({ nome, onLogout }: { nome: string; onLogout: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 28, width: "100%", maxWidth: 480 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#1d4ed8", letterSpacing: ".06em",
                      textTransform: "uppercase" }}>Administração geral</div>
        <h1 style={{ fontSize: 20, margin: "4px 0 4px", color: "#0f172a" }}>Selecione o município</h1>
        <p style={{ fontSize: 13, color: "#475569", margin: "0 0 16px" }}>
          {nome}, escolha o ambiente municipal. O início e o fim do acesso e todas as
          alterações feitas ficam registrados na auditoria.
        </p>
        <ListaMunicipios />
        <button onClick={onLogout} style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 6,
                  background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13 }}>
          <LogOut size={14} /> Sair
        </button>
      </div>
    </div>
  );
}
