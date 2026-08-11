/**
 * MunicipioSeletor — ERSUS 360
 *
 * Exibido apenas para usuários da assessoria (perfis_assessoria = true).
 * Permite trocar o município ativo sem re-login.
 * Usuários municipais não veem este componente — já estão fixados no próprio município.
 */
import { useState, useEffect } from "react";
import { MapPin, ChevronDown, Building2 } from "lucide-react";
import { useAuth } from "../App";
import { useMunicipioSeletor } from "../lib/municipio";
import { apiGet } from "../lib/api";

interface MunicipioItem {
  id: number;
  nome: string;
  uf: string;
  codigo_ibge: string;
  populacao: number | null;
}

interface Props {
  /** Callback chamado sempre que o município ativo muda. */
  onChange?: (ibge: string, nome: string) => void;
  compact?: boolean;
}

export default function MunicipioSeletor({ onChange, compact = false }: Props) {
  const auth = useAuth();
  const { ibge, setIbge, podeSelecionar } = useMunicipioSeletor();
  const [municipios, setMunicipios] = useState<MunicipioItem[]>([]);
  const [aberto, setAberto] = useState(false);
  const [loading, setLoading] = useState(false);

  // Só assessoria pode selecionar
  if (!podeSelecionar) return null;

  // Carrega lista ao abrir
  useEffect(() => {
    if (!aberto || municipios.length > 0) return;
    setLoading(true);
    apiGet("/api/municipios")
      .then((data: MunicipioItem[]) => setMunicipios(data))
      .catch(() => {/* sem municípios cadastrados */})
      .finally(() => setLoading(false));
  }, [aberto]);

  const ativo = municipios.find(m => m.codigo_ibge === ibge);
  const nomeAtivo = ativo ? `${ativo.nome} / ${ativo.uf}` : (ibge === "1300144" ? "Apuí / AM" : ibge);

  function selecionar(m: MunicipioItem) {
    setIbge(m.codigo_ibge);
    onChange?.(m.codigo_ibge, `${m.nome} / ${m.uf}`);
    setAberto(false);
  }

  if (compact) {
    return (
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setAberto(!aberto)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)",
            borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: "#e2e8f0",
          }}
        >
          <MapPin size={12} color="#38bdf8" />
          <span style={{ fontSize: 12, fontWeight: 600 }}>{nomeAtivo}</span>
          <ChevronDown size={12} />
        </button>
        {aberto && <DropdownList municipios={municipios} loading={loading} ibgeAtivo={ibge} onSelect={selecionar} onClose={() => setAberto(false)} />}
      </div>
    );
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setAberto(!aberto)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#fff", border: "1.5px solid #cbd5e1",
          borderRadius: 10, padding: "8px 14px", cursor: "pointer",
          boxShadow: "0 1px 3px rgba(0,0,0,.08)", minWidth: 220,
        }}
      >
        <Building2 size={15} color="#1d4ed8" />
        <span style={{ flex: 1, textAlign: "left", fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
          {nomeAtivo}
        </span>
        <span style={{ fontSize: 10, color: "#64748b", marginRight: 2 }}>IBGE {ibge}</span>
        <ChevronDown size={14} color="#64748b" />
      </button>

      {aberto && (
        <DropdownList
          municipios={municipios}
          loading={loading}
          ibgeAtivo={ibge}
          onSelect={selecionar}
          onClose={() => setAberto(false)}
        />
      )}
    </div>
  );
}

function DropdownList({
  municipios, loading, ibgeAtivo, onSelect, onClose,
}: {
  municipios: MunicipioItem[];
  loading: boolean;
  ibgeAtivo: string;
  onSelect: (m: MunicipioItem) => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* overlay */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 999 }}
      />
      <div style={{
        position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 1000,
        background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
        boxShadow: "0 8px 24px rgba(0,0,0,.12)", minWidth: 280, maxHeight: 320,
        overflowY: "auto",
      }}>
        {loading && (
          <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
            Carregando municípios…
          </div>
        )}
        {!loading && municipios.length === 0 && (
          <div style={{ padding: 16, color: "#64748b", fontSize: 13 }}>
            Nenhum município cadastrado.
          </div>
        )}
        {!loading && municipios.map(m => (
          <button
            key={m.codigo_ibge}
            onClick={() => onSelect(m)}
            style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "10px 16px", background: m.codigo_ibge === ibgeAtivo ? "#eff6ff" : "transparent",
              border: "none", cursor: "pointer", textAlign: "left",
              borderBottom: "1px solid #f1f5f9",
            }}
            onMouseEnter={e => { if (m.codigo_ibge !== ibgeAtivo) (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = m.codigo_ibge === ibgeAtivo ? "#eff6ff" : "transparent"; }}
          >
            <MapPin size={13} color={m.codigo_ibge === ibgeAtivo ? "#1d4ed8" : "#94a3b8"} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                {m.nome} / {m.uf}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>
                IBGE {m.codigo_ibge}
                {m.populacao ? ` · ${m.populacao.toLocaleString("pt-BR")} hab.` : ""}
              </div>
            </div>
            {m.codigo_ibge === ibgeAtivo && (
              <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: "#1d4ed8" }} />
            )}
          </button>
        ))}
      </div>
    </>
  );
}
