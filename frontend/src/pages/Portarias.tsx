// Módulo 6 — Banco de Portarias
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPortarias, type Portaria } from "../lib/api";
import { Search, Plus, FileText, Trash2, ExternalLink } from "lucide-react";

const S = {
  page: { padding: 20 } as React.CSSProperties,
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } as React.CSSProperties,
  title: { fontSize: 16, fontWeight: 600 } as React.CSSProperties,
  card: { background: "#fff", borderRadius: 8, border: "1px solid #e5e5e3", padding: 16, marginBottom: 10 } as React.CSSProperties,
  row: { display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" as const } as React.CSSProperties,
  input: { border: "1px solid #e5e5e3", borderRadius: 6, padding: "7px 10px", fontSize: 13, flex: 1, minWidth: 180 } as React.CSSProperties,
  btn: { padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 5 } as React.CSSProperties,
  badge: (cor: string) => ({ background: cor, color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 500 }) as React.CSSProperties,
  valor: { fontSize: 13, color: "#059669", fontWeight: 600 } as React.CSSProperties,
  sub: { fontSize: 12, color: "#737373", marginTop: 3 } as React.CSSProperties,
};

const BLOCOS = ["Atenção Básica", "MAC", "Vigilância em Saúde", "Farmácia", "Custeio e investimento"];

const COR_BLOCO: Record<string, string> = {
  "Atenção Básica": "#059669",
  "MAC": "#dc2626",
  "Vigilância em Saúde": "#7c3aed",
  "Farmácia": "#0284c7",
  "Custeio e investimento": "#d97706",
};

function NovaPortariaModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    numero: "", ano: new Date().getFullYear(), orgao_emissor: "GM/MS",
    programa: "", bloco: "Atenção Básica", objeto: "",
    data_publicacao: "", valor_total: 0,
  });

  const mutation = useMutation({
    mutationFn: () => apiPortarias.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portarias"] }); onClose(); },
  });

  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: "#fff", borderRadius: 10, padding: 24, width: 520, maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Nova Portaria</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            ["Número", "numero", "text"],
            ["Ano", "ano", "number"],
            ["Órgão Emissor", "orgao_emissor", "text"],
            ["Data Publicação", "data_publicacao", "date"],
          ].map(([label, key, type]) => (
            <div key={key}>
              <div style={{ fontSize: 11, color: "#737373", marginBottom: 3 }}>{label}</div>
              <input
                type={type}
                value={(form as Record<string, unknown>)[key] as string}
                onChange={(e) => set(key, type === "number" ? Number(e.target.value) : e.target.value)}
                style={{ ...S.input, width: "100%", boxSizing: "border-box" }}
              />
            </div>
          ))}
          <div>
            <div style={{ fontSize: 11, color: "#737373", marginBottom: 3 }}>Bloco</div>
            <select value={form.bloco} onChange={(e) => set("bloco", e.target.value)} style={{ ...S.input, width: "100%", boxSizing: "border-box" }}>
              {BLOCOS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#737373", marginBottom: 3 }}>Valor Total (R$)</div>
            <input type="number" value={form.valor_total} onChange={(e) => set("valor_total", Number(e.target.value))} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, color: "#737373", marginBottom: 3 }}>Programa</div>
          <input value={form.programa} onChange={(e) => set("programa", e.target.value)} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
        </div>
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, color: "#737373", marginBottom: 3 }}>Objeto / Descrição</div>
          <textarea value={form.objeto} onChange={(e) => set("objeto", e.target.value)} rows={3} style={{ ...S.input, width: "100%", boxSizing: "border-box", resize: "vertical" }} />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ ...S.btn, background: "#f5f5f3" }}>Cancelar</button>
          <button onClick={() => mutation.mutate()} style={{ ...S.btn, background: "#1D9E75", color: "#fff" }} disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Portarias() {
  const [q, setQ] = useState("");
  const [bloco, setBloco] = useState("");
  const [ano, setAno] = useState<number | undefined>();
  const [modal, setModal] = useState(false);
  const qc = useQueryClient();

  const { data: portarias = [], isLoading } = useQuery({
    queryKey: ["portarias", q, bloco, ano],
    queryFn: () => apiPortarias.list({ q: q || undefined, bloco: bloco || undefined, ano }),
    staleTime: 30_000,
  });

  const remover = useMutation({
    mutationFn: (id: number) => apiPortarias.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portarias"] }),
  });

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div style={S.page}>
      {modal && <NovaPortariaModal onClose={() => setModal(false)} />}

      <div style={S.header}>
        <div style={S.title}>
          <FileText size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
          Banco de Portarias
        </div>
        <button onClick={() => setModal(true)} style={{ ...S.btn, background: "#1D9E75", color: "#fff" }}>
          <Plus size={14} /> Nova Portaria
        </button>
      </div>

      {/* Filtros */}
      <div style={S.row}>
        <div style={{ position: "relative", flex: 2, minWidth: 220 }}>
          <Search size={14} style={{ position: "absolute", left: 9, top: 9, color: "#737373" }} />
          <input
            placeholder="Buscar por número, programa, objeto…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ ...S.input, paddingLeft: 30, width: "100%", boxSizing: "border-box" }}
          />
        </div>
        <select value={bloco} onChange={(e) => setBloco(e.target.value)} style={{ ...S.input, flex: 1 }}>
          <option value="">Todos os blocos</option>
          {BLOCOS.map((b) => <option key={b}>{b}</option>)}
        </select>
        <input
          type="number"
          placeholder="Ano"
          value={ano ?? ""}
          onChange={(e) => setAno(e.target.value ? Number(e.target.value) : undefined)}
          style={{ ...S.input, flex: 0.5, minWidth: 90 }}
        />
      </div>

      {/* Estatística rápida */}
      <div style={{ ...S.card, background: "#f0fdf4", display: "flex", gap: 24, padding: "10px 16px", marginBottom: 14 }}>
        <div><span style={{ fontSize: 20, fontWeight: 700 }}>{portarias.length}</span><div style={{ fontSize: 11, color: "#737373" }}>portarias encontradas</div></div>
        <div><span style={{ fontSize: 20, fontWeight: 700 }}>{fmt(portarias.reduce((s, p) => s + (p.valor_total || 0), 0))}</span><div style={{ fontSize: 11, color: "#737373" }}>valor total</div></div>
      </div>

      {isLoading && <div style={{ textAlign: "center", padding: 40, color: "#737373" }}>Carregando…</div>}

      {portarias.map((p: Portaria) => (
        <div key={p.id} style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Portaria {p.numero}/{p.ano}</span>
                {p.bloco && (
                  <span style={S.badge(COR_BLOCO[p.bloco] ?? "#6b7280")}>{p.bloco}</span>
                )}
                <span style={{ fontSize: 11, color: "#737373" }}>{p.orgao_emissor}</span>
              </div>
              {p.programa && <div style={{ fontSize: 13, color: "#404040", marginBottom: 2 }}>{p.programa}</div>}
              {p.objeto && <div style={S.sub}>{p.objeto.slice(0, 120)}{p.objeto.length > 120 ? "…" : ""}</div>}
              <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
                {p.valor_total > 0 && <span style={S.valor}>{fmt(p.valor_total)}</span>}
                {p.data_publicacao && <span style={S.sub}>Publicada em {new Date(p.data_publicacao).toLocaleDateString("pt-BR")}</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginLeft: 12 }}>
              {p.arquivo_pdf && (
                <a href={p.arquivo_pdf} target="_blank" style={{ ...S.btn, background: "#eff6ff", color: "#1d4ed8", textDecoration: "none" }}>
                  <ExternalLink size={13} /> PDF
                </a>
              )}
              <button
                onClick={() => { if (window.confirm("Remover esta portaria?")) remover.mutate(p.id); }}
                style={{ ...S.btn, background: "#fff0f0", color: "#dc2626" }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {!isLoading && portarias.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#737373" }}>
          <FileText size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
          <div>Nenhuma portaria encontrada.</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Cadastre portarias ou ajuste os filtros de busca.</div>
        </div>
      )}
    </div>
  );
}
