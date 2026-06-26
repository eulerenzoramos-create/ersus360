// Módulo 9 — Gestão de Documentos
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiDocumentos, type Documento } from "../lib/api";
import { FolderOpen, Upload, Download, Trash2, Search, File, FileText, Image } from "lucide-react";

const S = {
  page: { padding: 20 } as React.CSSProperties,
  card: { background: "#fff", borderRadius: 8, border: "1px solid #e5e5e3", padding: 14, marginBottom: 8 } as React.CSSProperties,
  btn: { padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 5 } as React.CSSProperties,
  input: { border: "1px solid #e5e5e3", borderRadius: 6, padding: "7px 10px", fontSize: 13, flex: 1 } as React.CSSProperties,
};

const TIPOS = ["Portaria", "Ofício", "Nota Técnica", "Parecer", "Extrato Bancário", "Comprovante", "Nota Fiscal", "Foto", "Relatório", "Outro"];

const ICON_TIPO: Record<string, React.ReactNode> = {
  "Foto": <Image size={16} />,
  "Portaria": <FileText size={16} />,
  "default": <File size={16} />,
};

const COR_TIPO: Record<string, string> = {
  "Portaria": "#7c3aed", "Ofício": "#2563eb", "Nota Técnica": "#0284c7",
  "Parecer": "#6b7280", "Extrato Bancário": "#059669", "Comprovante": "#d97706",
  "Nota Fiscal": "#dc2626", "Foto": "#ec4899", "Relatório": "#1D9E75", "Outro": "#6b7280",
};

function UploadModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ titulo: "", tipo: "Portaria", descricao: "" });
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);

  const mutation = useMutation({
    mutationFn: () => {
      if (!arquivo) throw new Error("Selecione um arquivo");
      const fd = new FormData();
      fd.append("arquivo", arquivo);
      fd.append("titulo", form.titulo || arquivo.name);
      fd.append("tipo", form.tipo);
      if (form.descricao) fd.append("descricao", form.descricao);
      return apiDocumentos.upload(fd);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documentos"] }); onClose(); },
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: "#fff", borderRadius: 10, padding: 24, width: 460 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Enviar Documento</div>

        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) setArquivo(f); }}
          style={{
            border: `2px dashed ${drag ? "#1D9E75" : "#e5e5e3"}`,
            borderRadius: 8, padding: 24, textAlign: "center", cursor: "pointer",
            background: drag ? "#f0fdf4" : "#f9f9f7", marginBottom: 14,
          }}
        >
          <Upload size={24} style={{ color: "#737373", marginBottom: 8 }} />
          {arquivo
            ? <div style={{ fontSize: 13, color: "#059669", fontWeight: 500 }}>{arquivo.name} ({(arquivo.size / 1024).toFixed(0)} KB)</div>
            : <div style={{ fontSize: 13, color: "#737373" }}>Arraste um arquivo ou clique para selecionar</div>
          }
          <input ref={inputRef} type="file" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && setArquivo(e.target.files[0])} />
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: "#737373", marginBottom: 3 }}>Título</div>
            <input value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} placeholder="Nome do documento" style={{ ...S.input, width: "100%", boxSizing: "border-box" as const }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#737373", marginBottom: 3 }}>Tipo</div>
            <select value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))} style={{ ...S.input, width: "100%", boxSizing: "border-box" as const }}>
              {TIPOS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#737373", marginBottom: 3 }}>Descrição</div>
            <input value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} style={{ ...S.input, width: "100%", boxSizing: "border-box" as const }} />
          </div>
        </div>

        {mutation.isError && (
          <div style={{ color: "#dc2626", fontSize: 12, marginTop: 10 }}>{String(mutation.error)}</div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ ...S.btn, background: "#f5f5f3" }}>Cancelar</button>
          <button onClick={() => mutation.mutate()} style={{ ...S.btn, background: "#1D9E75", color: "#fff" }} disabled={mutation.isPending || !arquivo}>
            {mutation.isPending ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Documentos() {
  const [modal, setModal] = useState(false);
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("");
  const qc = useQueryClient();

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["documentos", q, tipo],
    queryFn: () => apiDocumentos.list({ q: q || undefined, tipo: tipo || undefined }),
    staleTime: 30_000,
  });

  const remover = useMutation({
    mutationFn: (id: number) => apiDocumentos.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documentos"] }),
  });

  const totalKb = (docs as Documento[]).reduce((s, d) => s + (d.tamanho_kb ?? 0), 0);

  return (
    <div style={S.page}>
      {modal && <UploadModal onClose={() => setModal(false)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>
          <FolderOpen size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
          Documentos
        </div>
        <button onClick={() => setModal(true)} style={{ ...S.btn, background: "#1D9E75", color: "#fff" }}>
          <Upload size={14} /> Enviar Documento
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 2, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 9, top: 9, color: "#737373" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar documentos…" style={{ ...S.input, paddingLeft: 30, width: "100%", boxSizing: "border-box" as const }} />
        </div>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ ...S.input, flex: 1 }}>
          <option value="">Todos os tipos</option>
          {TIPOS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Resumo */}
      <div style={{ ...S.card, background: "#f0fdf4", display: "flex", gap: 24, padding: "10px 16px", marginBottom: 14 }}>
        <div><strong>{docs.length}</strong><div style={{ fontSize: 11, color: "#737373" }}>documentos</div></div>
        <div><strong>{(totalKb / 1024).toFixed(1)} MB</strong><div style={{ fontSize: 11, color: "#737373" }}>armazenado</div></div>
        <div><strong>{new Set((docs as Documento[]).map((d) => d.tipo)).size}</strong><div style={{ fontSize: 11, color: "#737373" }}>categorias</div></div>
      </div>

      {isLoading && <div style={{ textAlign: "center", padding: 40, color: "#737373" }}>Carregando…</div>}

      {(docs as Documento[]).map((doc) => (
        <div key={doc.id} style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
              <div style={{ color: COR_TIPO[doc.tipo] ?? "#6b7280" }}>
                {ICON_TIPO[doc.tipo] ?? ICON_TIPO["default"]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{doc.titulo}</div>
                <div style={{ display: "flex", gap: 10, marginTop: 3, flexWrap: "wrap" }}>
                  <span style={{ background: `${COR_TIPO[doc.tipo] ?? "#6b7280"}20`, color: COR_TIPO[doc.tipo] ?? "#6b7280", borderRadius: 4, padding: "1px 6px", fontSize: 11 }}>
                    {doc.tipo}
                  </span>
                  {doc.tamanho_kb && <span style={{ fontSize: 11, color: "#737373" }}>{doc.tamanho_kb} KB</span>}
                  <span style={{ fontSize: 11, color: "#737373" }}>{new Date(doc.criado_em).toLocaleDateString("pt-BR")}</span>
                  {doc.descricao && <span style={{ fontSize: 11, color: "#737373" }}>{doc.descricao}</span>}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginLeft: 12 }}>
              <a
                href={`/api/documentos/${doc.id}/download`}
                target="_blank"
                style={{ ...S.btn, background: "#eff6ff", color: "#1d4ed8", textDecoration: "none" }}
              >
                <Download size={13} />
              </a>
              <button
                onClick={() => { if (window.confirm("Remover este documento?")) remover.mutate(doc.id); }}
                style={{ ...S.btn, background: "#fff0f0", color: "#dc2626" }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {!isLoading && docs.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#737373" }}>
          <FolderOpen size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
          <div>Nenhum documento encontrado.</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Envie portarias, ofícios, extratos e comprovantes.</div>
        </div>
      )}
    </div>
  );
}
