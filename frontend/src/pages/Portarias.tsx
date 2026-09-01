// Módulo 6 — Banco de Portarias
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPortarias, type Portaria, apiGet, apiPost, api } from "../lib/api";
import { Search, Plus, FileText, Trash2, ExternalLink, Mail, Play, RotateCcw, Eye, Pause, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

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

// ── Painel Envios Diários ─────────────────────────────────────────────────────

const COR_REL: Record<string, string> = {
  apui: "#059669", amazonas: "#7c3aed", federal: "#0284c7",
  sem_impacto: "#6b7280", outros: "#6b7280",
};
const BG_REL: Record<string, string> = {
  apui: "#f0fdf4", amazonas: "#faf5ff", federal: "#eff6ff",
  sem_impacto: "#f8fafc", outros: "#f8fafc",
};
const LABEL_REL: Record<string, string> = {
  apui: "📍 Apuí/AM", amazonas: "🏛 Estado AM",
  federal: "🇧🇷 Federal Municipal", sem_impacto: "📄 Sem impacto direto", outros: "📄 Outros",
};

// Etiquetas de prioridade (spec: vermelho urgente, laranja prazo, verde financeiro,
//   azul normativo, cinza sem_impacto, roxo referência federal)
const COR_PRIO: Record<string, string> = {
  urgente:    "#dc2626",
  prazo:      "#ea580c",
  financeiro: "#059669",
  normativo:  "#2563eb",
  sem_impacto:"#6b7280",
};
const LABEL_PRIO: Record<string, string> = {
  urgente:    "🔴 Urgente",
  prazo:      "🟠 Prazo/Providência",
  financeiro: "🟢 Recurso Financeiro",
  normativo:  "🔵 Orientação Normativa",
  sem_impacto:"⚪ Sem impacto direto",
};

// Modal de edição de informe
function ModalEditarInforme({ inf, onSalvar, onFechar }: {
  inf: any; onSalvar: (novoInf: any) => void; onFechar: () => void;
}) {
  const [form, setForm] = useState({ ...inf });
  const campo = (label: string, campo: string, textarea = false) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>{label}</label>
      {textarea ? (
        <textarea
          value={form[campo] || ""}
          onChange={e => setForm((f: any) => ({ ...f, [campo]: e.target.value }))}
          rows={4}
          style={{ width: "100%", fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 10px", resize: "vertical" as const, boxSizing: "border-box" as const }}
        />
      ) : (
        <input
          value={form[campo] || ""}
          onChange={e => setForm((f: any) => ({ ...f, [campo]: e.target.value }))}
          style={{ width: "100%", fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 10px", boxSizing: "border-box" as const }}
        />
      )}
    </div>
  );
  return (
    <div style={{ position: "fixed" as const, inset: 0, background: "rgba(0,0,0,.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 600, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
        <div style={{ background: "#1d4ed8", padding: "16px 20px", borderRadius: "12px 12px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>✏️ Editar Informe</span>
          <button onClick={onFechar} style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>
          {campo("Título", "titulo")}
          {campo("Número", "numero")}
          {campo("Data de Publicação", "data_pub")}
          {campo("Órgão Emissor", "orgao")}
          {campo("Relevância (apui / amazonas / federal / sem_impacto)", "relevancia")}
          {campo("Resumo / Ementa", "resumo", true)}
          {campo("Impacto para Apuí/AM", "impacto", true)}
          {campo("Link oficial DOU", "link")}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
            <button onClick={onFechar}
              style={{ padding: "8px 18px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, cursor: "pointer", color: "#475569" }}>
              Cancelar
            </button>
            <button onClick={() => { onSalvar(form); onFechar(); }}
              style={{ padding: "8px 18px", background: "#1d4ed8", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#fff" }}>
              Salvar alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InformeCard({ inf, idx, selecionado, onToggle, onEditar, onDeletar }: {
  inf: any; idx: number; selecionado: boolean;
  onToggle: () => void; onEditar: (novoInf: any) => void; onDeletar: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [gerandoIA, setGerandoIA] = useState(false);
  const [erroIA, setErroIA] = useState<string | null>(null);

  const gerarInformeIA = async () => {
    setGerandoIA(true);
    setErroIA(null);
    try {
      // Usa o cliente axios (BASE_URL do Railway) para evitar o rewrite do Vercel
      const resp = await api.post("/api/email-diario/informe-ia", { portaria: inf }, { responseType: "text" });
      const html = resp.data as string;
      const w = window.open("", "_blank");
      if (w) { w.document.write(html); w.document.close(); }
    } catch (e: any) {
      // Extrai mensagem real do backend (axios encapsula em e.response)
      const detalhe = e?.response?.data
        ? (typeof e.response.data === "string"
            ? e.response.data.slice(0, 300)
            : e.response.data?.detail || JSON.stringify(e.response.data).slice(0, 300))
        : e?.message || "Erro desconhecido";
      setErroIA(`Erro ${e?.response?.status ?? ""}: ${detalhe}`);
    } finally {
      setGerandoIA(false);
    }
  };
  const cor = COR_REL[inf.relevancia] || "#6b7280";
  const bg  = selecionado ? `${cor}10` : (BG_REL[inf.relevancia] || "#f8fafc");
  return (
    <>
      {editando && (
        <ModalEditarInforme
          inf={inf}
          onSalvar={onEditar}
          onFechar={() => setEditando(false)}
        />
      )}
      <div style={{ border: `1px solid ${selecionado ? cor : cor+"30"}`, borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
        {/* Cabeçalho */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: bg }}>
          <input
            type="checkbox"
            checked={selecionado}
            onChange={onToggle}
            onClick={e => e.stopPropagation()}
            style={{ width: 16, height: 16, cursor: "pointer", accentColor: cor, flexShrink: 0 }}
          />
          <span style={{ fontSize: 10, fontWeight: 700, color: cor, background: `${cor}18`, border: `1px solid ${cor}40`, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" as const }}>
            {LABEL_REL[inf.relevancia]}
          </span>
          {inf.prioridade && inf.prioridade !== "sem_impacto" && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: COR_PRIO[inf.prioridade] || "#2563eb",
              background: `${COR_PRIO[inf.prioridade] || "#2563eb"}12`,
              border: `1px solid ${COR_PRIO[inf.prioridade] || "#2563eb"}40`,
              padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" as const,
            }}>
              {LABEL_PRIO[inf.prioridade] || inf.prioridade}
            </span>
          )}
          <span onClick={() => setAberto(a => !a)}
            style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", flex: 1, cursor: "pointer" }}>
            {inf.titulo}
          </span>
          {/* Botões */}
          <button
            onClick={e => { e.stopPropagation(); gerarInformeIA(); }}
            disabled={gerandoIA}
            title="Gerar Informe Técnico formal via IA"
            style={{ background: gerandoIA ? "#e0e7ff" : "#ede9fe", border: "1px solid #c4b5fd", borderRadius: 5, padding: "3px 10px", fontSize: 11, cursor: "pointer", color: "#7c3aed", fontWeight: 700, flexShrink: 0 }}>
            {gerandoIA ? "⏳ Gerando…" : "✨ Informe IA"}
          </button>
          <button
            onClick={e => { e.stopPropagation(); setEditando(true); }}
            title="Editar informe"
            style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 5, padding: "3px 10px", fontSize: 11, cursor: "pointer", color: "#1d4ed8", fontWeight: 700, flexShrink: 0 }}>
            ✏️ Editar
          </button>
          <button
            onClick={e => { e.stopPropagation(); if (window.confirm("Remover este informe da lista?")) onDeletar(); }}
            title="Remover informe"
            style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 5, padding: "3px 10px", fontSize: 11, cursor: "pointer", color: "#dc2626", fontWeight: 700, flexShrink: 0 }}>
            🗑 Remover
          </button>
          <span onClick={() => setAberto(a => !a)} style={{ fontSize: 11, color: "#94a3b8", cursor: "pointer", flexShrink: 0 }}>
            {aberto ? "▲" : "▼"}
          </span>
        </div>

        {erroIA && (
          <div style={{ padding: "6px 14px", background: "#fef2f2", borderTop: "1px solid #fca5a5", fontSize: 11, color: "#991b1b" }}>
            ⚠ {erroIA}
          </div>
        )}

        {aberto && (
          <div style={{ padding: "12px 14px", background: "#fff", display: "flex", flexDirection: "column" as const, gap: 8 }}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
              {inf.numero && (
                <div style={{ fontSize: 11 }}>
                  <span style={{ color: "#94a3b8" }}>Número </span>
                  <span style={{ color: "#1e293b", fontWeight: 600 }}>{inf.numero}</span>
                </div>
              )}
              {inf.data_pub && (
                <div style={{ fontSize: 11 }}>
                  <span style={{ color: "#94a3b8" }}>Publicação </span>
                  <span style={{ color: "#1e293b", fontWeight: 600 }}>{inf.data_pub}</span>
                </div>
              )}
              <div style={{ fontSize: 11 }}>
                <span style={{ color: "#94a3b8" }}>Órgão </span>
                <span style={{ color: "#1e293b", fontWeight: 600 }}>{inf.orgao || "Ministério da Saúde"}</span>
              </div>
            </div>

            {inf.resumo && inf.resumo !== "(Acesse o link para ver o conteúdo completo)" && (() => {
              const capResumo = (t: string) => !t ? t :
                t.replace(/^([a-záàâãéêíóôõúüç])/i, (_m, c) => c.toUpperCase())
                 .replace(/([.!?]\s+)([a-záàâãéêíóôõúüç])/gi, (_m, p, c) => p + c.toUpperCase());
              return (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 3 }}>Resumo</div>
                  <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6, background: "#f8fafc", borderRadius: 6, padding: "8px 10px" }}>
                    {capResumo(inf.resumo)}
                  </div>
                </div>
              );
            })()}

            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, padding: "8px 10px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 3 }}>⚡ Impacto para Apuí/AM</div>
              <div style={{ fontSize: 12, color: "#78350f", lineHeight: 1.5 }}>{inf.impacto}</div>
            </div>

            {(() => {
              const isDireto = inf.link && inf.link.includes("in.gov.br/web/dou");
              return (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, alignItems: "center" }}>
                  <a href={inf.link} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#fff", fontWeight: 600, textDecoration: "none", background: "#1d4ed8", padding: "7px 16px", borderRadius: 6 }}>
                    <ExternalLink size={12} /> {isDireto ? "Abrir Portaria no DOU" : "Buscar Portaria no DOU"}
                  </a>
                  {!isDireto && (
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>
                      (abre o DOU na data da portaria — localize pelo número)
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </>
  );
}

function LimparNaoMsBtn({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ removidos: number } | null>(null);

  const limpar = async () => {
    if (!window.confirm("Isso vai remover do banco todas as portarias que não são do Ministério da Saúde. Confirma?")) return;
    setLoading(true); setResultado(null);
    try {
      const r = await apiPost("/api/email-diario/limpar-nao-ms");
      setResultado(r);
      onDone();
    } catch {
      alert("Erro ao executar limpeza.");
    } finally { setLoading(false); }
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <button onClick={limpar} disabled={loading}
        title="Remove do banco portarias de outros órgãos (RFB, MAPA, Forças Armadas, universidades etc.)"
        style={{ padding: "6px 12px", background: "#fef2f2", color: "#b91c1c", border: "1px solid #fca5a5", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
        {loading ? "Limpando…" : "🗑 Excluir não-MS"}
      </button>
      {resultado && (
        <span style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>
          ✓ {resultado.total_removidos} removida(s) · {resultado.restantes} restante(s)
        </span>
      )}
    </span>
  );
}

function BuscaRetroativa() {
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [resultado, setResultado] = useState<any>(null);
  // Cópia editável dos informes (permite editar/deletar sem refazer busca)
  const [informesEditaveis, setInformesEditaveis] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBanco, setLoadingBanco] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());

  const toggleSelecao = (idx: number) =>
    setSelecionados(prev => { const s = new Set(prev); s.has(idx) ? s.delete(idx) : s.add(idx); return s; });

  const toggleTodos = () =>
    setSelecionados(prev => prev.size === informesEditaveis.length
      ? new Set()
      : new Set(informesEditaveis.map((_: any, i: number) => i)));

  const editarInforme = (idx: number, novoInf: any) => {
    setInformesEditaveis(prev => prev.map((inf, i) => i === idx ? novoInf : inf));
    // Remove da seleção se existia, mantém o índice
    setSelecionados(prev => { const s = new Set(prev); return s; });
  };

  const deletarInforme = (idx: number) => {
    setInformesEditaveis(prev => prev.filter((_, i) => i !== idx));
    setSelecionados(prev => {
      const s = new Set<number>();
      prev.forEach(i => { if (i < idx) s.add(i); else if (i > idx) s.add(i - 1); });
      return s;
    });
  };

  const buscar = async () => {
    setLoading(true); setErro(null); setResultado(null);
    setInformesEditaveis([]); setSelecionados(new Set());
    try {
      const r = await apiGet(`/api/email-diario/buscar-dou?data=${data}`);
      setResultado(r);
      setInformesEditaveis(r?.informes || []);
    } catch (e: any) {
      setErro(e?.message || "Erro ao consultar o DOU.");
    } finally { setLoading(false); }
  };

  const carregarBanco = async () => {
    setLoadingBanco(true); setErro(null); setResultado(null);
    setInformesEditaveis([]); setSelecionados(new Set());
    try {
      const r = await apiGet(`/api/email-diario/portarias-salvas?data=${data}`);
      setResultado(r);
      setInformesEditaveis(r?.informes || []);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar do banco.");
    } finally { setLoadingBanco(false); }
  };

  const enviar = async () => {
    setEnviando(true); setErro(null);
    try {
      await apiGet(`/api/email-diario/buscar-dou?data=${data}&enviar=true`);
      setResultado((prev: any) => ({ ...prev, enviado: true }));
    } catch (e: any) {
      setErro(e?.message || "Erro ao enviar e-mail.");
    } finally { setEnviando(false); }
  };

  const apui    = resultado?.apui    || [];
  const federal = resultado?.federal || [];
  const amazonas= resultado?.amazonas|| [];
  const outros  = resultado?.outros  || [];

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20, marginBottom: 20 }}>
      {/* Título */}
      <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
        <Search size={14} /> Agente de Busca — Portarias MS no DOU
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        Selecione a data e o agente busca, classifica e gera informes automáticos para Apuí/AM e portarias federais do MS.
      </div>

      {/* Controles */}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" as const, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Data de referência</div>
          <input type="date" value={data} onChange={e => setData(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "7px 10px", fontSize: 13 }} />
        </div>
        <button onClick={buscar} disabled={loading || loadingBanco}
          style={{ padding: "9px 20px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Search size={13} />{loading ? "Buscando no DOU…" : "Buscar e Gerar Informes"}
        </button>
        <button onClick={carregarBanco} disabled={loading || loadingBanco}
          title="Carrega portarias já salvas no banco para esta data, sem buscar no DOU"
          style={{ padding: "9px 16px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          {loadingBanco ? "Carregando…" : "↻ Carregar do Banco"}
        </button>
        {resultado && !resultado.enviado && (
          <button onClick={enviar} disabled={enviando}
            style={{ padding: "9px 20px", background: "#059669", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Mail size={13} />{enviando ? "Enviando…" : "Enviar e-mail"}
          </button>
        )}
        {informesEditaveis.length > 0 && (
          <button
            onClick={() => {
              const lista: any[] = selecionados.size > 0
                ? informesEditaveis.filter((_: any, i: number) => selecionados.has(i))
                : informesEditaveis;
              const dt = new Date(resultado.data + "T12:00:00").toLocaleDateString("pt-BR");
              const ano = new Date(resultado.data + "T12:00:00").getFullYear();

              // Capitaliza primeira letra e após pontuação (DOU search API retorna content em minúsculas)
              const cap = (t: string) => {
                if (!t) return t;
                return t.replace(/^([a-záàâãéêíóôõúüç])/i, (_m, c) => c.toUpperCase())
                         .replace(/([.!?]\s+)([a-záàâãéêíóôõúüç])/gi, (_m, p, c) => p + c.toUpperCase());
              };

              const COR: Record<string,string> = {
                apui:"#059669", amazonas:"#7c3aed",
                federal:"#0284c7", sem_impacto:"#6b7280",
              };
              const LABEL_ABRANG: Record<string,string> = {
                apui:       "Específica para Apuí/AM — aplicação direta imediata",
                amazonas:   "Direcionada ao Estado do Amazonas",
                federal:    "Federal com aplicação municipal — verificar elegibilidade",
                sem_impacto:"Sem impacto direto identificado após análise do texto",
              };

              function analisarImpacto(titulo: string, resumo: string) {
                const t = (titulo + " " + resumo).toLowerCase();
                const fin: string[] = [], ass: string[] = [], adm: string[] = [], prov: string[] = [];
                if (/repasse|transferência|transferencia|recurso|valor|custeio|investimento|fundo nacional|bloco de financ|teto financ/.test(t))
                  fin.push("A portaria trata de aspectos financeiros. Verificar se Apuí consta como beneficiário no texto ou anexos.");
                if (/emenda parlamentar/.test(t))
                  fin.push("Envolve emenda parlamentar. Verificar se há parcela destinada a Apuí/AM.");
                if (/aten.o prim|aten.o b.sica|esf|acs|agente comunit/.test(t))
                  ass.push("Impacto potencial na Atenção Primária à Saúde. Verificar se a portaria cria obrigações para equipes de Apuí.");
                if (/habilita|credenciamento/.test(t))
                  ass.push("Portaria de habilitação/credenciamento. Verificar elegibilidade de Apuí e prazo de adesão.");
                if (/vigilância|vigilancia/.test(t))
                  ass.push("Relacionada à vigilância em saúde. Verificar obrigações de notificação.");
                if (/prazo|data limite/.test(t))
                  adm.push("Portaria com prazo definido. Verificar data e providência necessária.");
                if (/sistema|sigtap|cnes|ine|rnds/.test(t))
                  adm.push("Envolve sistemas de informação. Verificar obrigação de atualização cadastral.");
                if (/presta.o de contas|relat.rio/.test(t))
                  adm.push("Exige prestação de contas ou relatório. Verificar responsável e prazo.");
                if (/apuí|apui|1300144/.test(t))
                  prov.push("AÇÃO IMEDIATA: O município de Apuí/AM está citado expressamente. Ler o texto integral e anexos.");
                return { fin, ass, adm, prov };
              }

              function lista_ul(items: string[], vazio: string): string {
                if (!items.length) return `<p style="color:#6b7280;font-style:italic">${vazio}</p>`;
                return "<ul style='margin:6px 0;padding-left:20px'>" +
                  items.map(i => `<li style="margin-bottom:6px">${i}</li>`).join("") + "</ul>";
              }

              const informes_html = lista.map((inf: any, i: number) => {
                const rel  = inf.relevancia || "federal";
                const cor  = COR[rel] || "#0284c7";
                const abr  = LABEL_ABRANG[rel] || "Federal";
                const resumoCap = cap(inf.resumo || "");
                const imp  = analisarImpacto(inf.titulo || "", resumoCap);
                const link = inf.link || "https://www.in.gov.br/leiturajornal";
                const linkLabel = link.includes("in.gov.br/web/dou") ? "Abrir portaria completa" : "Ver DOU na data de publicação";

                const conclusao = rel === "apui"
                  ? "Portaria com referência direta a Apuí/AM. Leitura integral do ato e dos anexos é obrigatória."
                  : rel === "amazonas"
                  ? "Portaria aplicável ao Estado do Amazonas. Verificar se Apuí está incluído como município beneficiário."
                  : rel === "federal"
                  ? "Norma federal do Ministério da Saúde com potencial aplicação municipal. Verificar elegibilidade e obrigações para Apuí/AM."
                  : "Não foi identificado impacto direto para o Município de Apuí/AM após análise do texto e dos anexos.";

                return `
                <div style="border:1px solid #e2e8f0;border-radius:10px;margin-bottom:32px;
                            overflow:hidden;page-break-inside:avoid;font-family:Arial,sans-serif">
                  <div style="background:#1d4ed8;padding:16px 22px">
                    <div style="color:rgba(255,255,255,.7);font-size:10px;text-transform:uppercase;
                                letter-spacing:1px">Informe Técnico Nº ${String(i+1).padStart(3,"0")}/${ano}</div>
                    <div style="color:#fff;font-size:15px;font-weight:700;margin-top:4px;line-height:1.4">
                      ${inf.titulo || "Sem título"}
                    </div>
                  </div>
                  <div style="padding:18px 22px;background:#fff">

                    <!-- 1. Identificação -->
                    <div style="margin-bottom:18px">
                      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#1d4ed8;
                                  letter-spacing:.8px;border-bottom:2px solid #dbeafe;padding-bottom:4px;margin-bottom:8px">
                        1. Identificação do Ato
                      </div>
                      <table style="font-size:12px;color:#374151;border-collapse:collapse;width:100%">
                        ${inf.numero ? `<tr><td style="padding:3px 16px 3px 0;font-weight:600;width:160px">Portaria</td><td>${inf.numero}</td></tr>` : ""}
                        ${inf.data_pub ? `<tr><td style="padding:3px 16px 3px 0;font-weight:600">Publicação DOU</td><td>${inf.data_pub}</td></tr>` : ""}
                        <tr><td style="padding:3px 16px 3px 0;font-weight:600">Órgão responsável</td><td>${inf.orgao || "Ministério da Saúde"}</td></tr>
                        <tr><td style="padding:3px 16px 3px 0;font-weight:600">Link oficial DOU</td>
                            <td><a href="${link}" style="color:#1d4ed8">${link.length>80?link.slice(0,80)+"...":link}</a></td></tr>
                      </table>
                    </div>

                    <!-- 2. Objeto -->
                    <div style="margin-bottom:18px">
                      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#1d4ed8;
                                  letter-spacing:.8px;border-bottom:2px solid #dbeafe;padding-bottom:4px;margin-bottom:8px">
                        2. Objeto
                      </div>
                      <div style="font-size:12px;color:#374151;line-height:1.7;background:#f8fafc;
                                  padding:12px;border-radius:6px">
                        ${resumoCap || "(Acesse o link para ver o conteúdo completo)"}
                      </div>
                    </div>

                    <!-- 3. Abrangência -->
                    <div style="margin-bottom:18px">
                      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#1d4ed8;
                                  letter-spacing:.8px;border-bottom:2px solid #dbeafe;padding-bottom:4px;margin-bottom:8px">
                        3. Abrangência
                      </div>
                      <span style="background:${cor};color:#fff;font-size:12px;font-weight:600;
                                   padding:4px 14px;border-radius:20px">${abr}</span>
                    </div>

                    <!-- 4. Impacto -->
                    <div style="margin-bottom:18px">
                      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#1d4ed8;
                                  letter-spacing:.8px;border-bottom:2px solid #dbeafe;padding-bottom:4px;margin-bottom:8px">
                        4. Impacto para Apuí/AM
                      </div>
                      ${imp.prov.length ? `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;padding:10px 14px;margin-bottom:10px"><strong style="color:#dc2626">⚡ Ação imediata:</strong> ${imp.prov.join(" ")}</div>` : ""}
                      <div style="font-size:12px;font-weight:600;color:#374151;margin:8px 0 4px">Impacto financeiro</div>
                      ${lista_ul(imp.fin, "Não identificado impacto financeiro direto.")}
                      <div style="font-size:12px;font-weight:600;color:#374151;margin:8px 0 4px">Impacto assistencial</div>
                      ${lista_ul(imp.ass, "Não identificado impacto assistencial direto.")}
                      <div style="font-size:12px;font-weight:600;color:#374151;margin:8px 0 4px">Impacto administrativo</div>
                      ${lista_ul(imp.adm, "Não identificado impacto administrativo direto.")}
                    </div>

                    <!-- 5. Valores -->
                    <div style="margin-bottom:18px">
                      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#1d4ed8;
                                  letter-spacing:.8px;border-bottom:2px solid #dbeafe;padding-bottom:4px;margin-bottom:8px">
                        5. Valores e Beneficiários
                      </div>
                      <div style="font-size:12px;color:#6b7280;font-style:italic">
                        Verificar valores, CNES, INE, competências e beneficiários no texto integral e anexos do DOU.
                      </div>
                    </div>

                    <!-- 6. Providências -->
                    <div style="margin-bottom:18px">
                      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#1d4ed8;
                                  letter-spacing:.8px;border-bottom:2px solid #dbeafe;padding-bottom:4px;margin-bottom:8px">
                        6. Providências Recomendadas
                      </div>
                      ${imp.prov.length ? lista_ul(imp.prov, "") : "<p style='font-size:12px;color:#374151'>Acessar o link oficial, ler o texto integral e verificar se Apuí (IBGE 1300144) consta como beneficiário.</p>"}
                    </div>

                    <!-- 7. Prazos -->
                    <div style="margin-bottom:18px">
                      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#1d4ed8;
                                  letter-spacing:.8px;border-bottom:2px solid #dbeafe;padding-bottom:4px;margin-bottom:8px">
                        7. Prazos e Riscos
                      </div>
                      <div style="font-size:12px;color:#6b7280;font-style:italic">
                        ${imp.adm.some(a => /prazo/.test(a.toLowerCase()))
                          ? "Portaria contém referência a prazo. Verificar data exata no texto integral."
                          : "Prazo não identificado automaticamente. Verificar no texto integral do DOU."}
                      </div>
                    </div>

                    <!-- 8. Conclusão -->
                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:14px;margin-bottom:16px">
                      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#15803d;
                                  letter-spacing:.8px;margin-bottom:6px">8. Conclusão</div>
                      <div style="font-size:12px;color:#374151;line-height:1.6">${conclusao}</div>
                    </div>

                    <!-- Link DOU -->
                    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:10px 14px">
                      <div style="font-size:10px;font-weight:700;color:#1e40af;text-transform:uppercase;
                                  letter-spacing:.5px;margin-bottom:4px">🔗 ${linkLabel}</div>
                      <a href="${link}" style="font-size:12px;color:#1d4ed8;word-break:break-all">${link}</a>
                    </div>

                    <!-- Assinatura -->
                    <div style="margin-top:16px;padding-top:12px;border-top:1px solid #e2e8f0;
                                font-size:11px;color:#6b7280">
                      <div>Destinatária: <strong>Rosângela Motter</strong> — Secretária Municipal de Saúde de Apuí/AM</div>
                      <div>Elaborado por: <strong>Euler Ramos de Oliveira</strong> — Assessor Técnico em Saúde Pública</div>
                    </div>
                  </div>
                </div>`;
              }).join("");

              const html = `<!DOCTYPE html><html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Informes Técnicos — Portarias MS — ${dt}</title>
  <style>
    body{font-family:Arial,sans-serif;margin:40px;color:#1e293b;background:#f8fafc;font-size:13px;}
    @media print{.no-print{display:none!important}body{margin:20px;background:#fff}}
  </style>
</head>
<body>
  <div class="no-print" style="position:sticky;top:0;background:#fff;border-bottom:1px solid #e2e8f0;
       padding:10px 20px;margin:-40px -40px 32px;display:flex;gap:12px;align-items:center;z-index:100">
    <button onclick="window.print()" style="padding:8px 20px;background:#1d4ed8;color:#fff;border:none;
            border-radius:6px;cursor:pointer;font-size:13px;font-weight:700">🖨 Imprimir / Salvar PDF</button>
    <div style="font-size:12px;color:#64748b">
      <strong>ERSUS 360</strong> · Informes Técnicos · Portarias MS · ${dt} · ${lista.length} informe(s)
    </div>
  </div>
  <div style="border:2px solid #1d4ed8;border-radius:10px;padding:20px 28px;margin-bottom:32px;background:#fff">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;
                color:#1d4ed8;margin-bottom:4px">ERSUS 360 — Sistema de Monitoramento em Saúde Pública</div>
    <div style="font-size:18px;font-weight:800;color:#1e293b;margin-bottom:8px">
      Informes Técnicos — Portarias do Ministério da Saúde
    </div>
    <table style="font-size:12px;color:#374151;border-collapse:collapse">
      <tr><td style="padding-right:20px;font-weight:600">Município</td><td>Apuí/AM — IBGE 1300144</td></tr>
      <tr><td style="padding-right:20px;font-weight:600">Secretária de Saúde</td><td>Rosângela Motter</td></tr>
      <tr><td style="padding-right:20px;font-weight:600">Assessor Técnico</td><td>Euler Ramos de Oliveira</td></tr>
      <tr><td style="padding-right:20px;font-weight:600">Data DOU consultada</td><td>${dt}</td></tr>
      <tr><td style="padding-right:20px;font-weight:600">Total de informes</td><td>${lista.length}</td></tr>
      <tr><td style="padding-right:20px;font-weight:600">Fonte</td><td>Diário Oficial da União — www.in.gov.br</td></tr>
    </table>
  </div>
  ${informes_html || "<p style='color:#94a3b8;text-align:center;padding:40px'>Nenhum informe disponível.</p>"}
</body></html>`;
              const w = window.open("", "_blank");
              if (w) { w.document.write(html); w.document.close(); }
            }}
            style={{ padding: "9px 20px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <FileText size={13} /> Gerar Documento
          </button>
        )}
        {resultado?.enviado && <span style={{ fontSize: 12, color: "#059669", fontWeight: 700 }}>✓ E-mail enviado</span>}
      </div>

      {erro && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#991b1b", marginBottom: 12 }}>{erro}</div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: 24, color: "#1d4ed8", fontSize: 13 }}>
          ⏳ Consultando o Diário Oficial da União…
        </div>
      )}
      {loadingBanco && (
        <div style={{ textAlign: "center", padding: 24, color: "#92400e", fontSize: 13 }}>
          🗄️ Carregando portarias salvas no banco…
        </div>
      )}

      {resultado && (
        <div>
          {/* Badge de origem */}
          {resultado.fonte === "banco" && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fefce8", border: "1px solid #fde68a", borderRadius: 6, padding: "4px 12px", fontSize: 11, color: "#92400e", marginBottom: 10 }}>
              🗄️ <strong>Dados carregados do banco</strong> — {resultado.total} portaria(s) salva(s) para {new Date(resultado.data + "T12:00:00").toLocaleDateString("pt-BR")}
              <button onClick={buscar} disabled={loading} style={{ marginLeft: 8, fontSize: 11, padding: "2px 8px", border: "1px solid #d97706", borderRadius: 4, background: "#fffbeb", color: "#b45309", cursor: "pointer", fontWeight: 600 }}>
                {loading ? "…" : "🔄 Rebuscar no DOU"}
              </button>
            </div>
          )}
          {/* Resumo KPIs */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const, marginBottom: 12 }}>
            {[
              { label: "MS validados",   val: resultado.total,                cor: "#1d4ed8", bg: "#eff6ff" },
              { label: "Apuí/AM",        val: (resultado.apui||[]).length,    cor: "#059669", bg: "#f0fdf4" },
              { label: "Federal Munic.", val: (resultado.federal||[]).length,  cor: "#0284c7", bg: "#f0f9ff" },
              { label: "Estado AM",      val: (resultado.amazonas||[]).length, cor: "#7c3aed", bg: "#faf5ff" },
              { label: "Sem impacto",    val: (resultado.sem_impacto||[]).length, cor: "#6b7280", bg: "#f8fafc" },
            ].map(k => (
              <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.cor}30`, borderRadius: 8, padding: "8px 14px", minWidth: 90, textAlign: "center" as const }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: k.cor }}>{k.val}</div>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>{k.label}</div>
              </div>
            ))}
          </div>
          {/* Log de execução */}
          {resultado.log && (
            <details style={{ marginBottom: 14, fontSize: 11, color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 12px" }}>
              <summary style={{ cursor: "pointer", fontWeight: 700, color: "#475569" }}>
                Log de execução — {(resultado.log.descartados||[]).length} descartados por órgão inválido
              </summary>
              <div style={{ marginTop: 8 }}>
                {(resultado.log.descartados||[]).slice(0,10).map((d: any, i: number) => (
                  <div key={i} style={{ borderBottom: "1px solid #e2e8f0", padding: "4px 0" }}>
                    <strong>{d.titulo}</strong> — {d.motivo}
                  </div>
                ))}
                {(resultado.log.falhas||[]).length > 0 && (
                  <div style={{ color: "#dc2626", marginTop: 6 }}>
                    Falhas: {resultado.log.falhas.join("; ")}
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Informes — Apuí + Federal */}
          {informesEditaveis.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" as const }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>
                  📋 Informes Gerados ({informesEditaveis.length}) — Apuí/AM, Amazonas e Federal Municipal
                </div>
                <button onClick={toggleTodos} style={{ fontSize: 11, padding: "3px 10px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8fafc", cursor: "pointer", color: "#475569" }}>
                  {selecionados.size === informesEditaveis.length ? "Desmarcar todos" : "Selecionar todos"}
                </button>
                {selecionados.size > 0 && (
                  <>
                    <span style={{ fontSize: 11, color: "#1d4ed8", fontWeight: 600 }}>
                      {selecionados.size} selecionada(s)
                    </span>
                    <button
                      onClick={() => {
                        const qtd = selecionados.size;
                        if (!window.confirm(`Remover ${qtd} informe(s) selecionado(s)?`)) return;
                        const novaLista = informesEditaveis.filter((_: any, i: number) => !selecionados.has(i));
                        setInformesEditaveis(novaLista);
                        setSelecionados(new Set());
                      }}
                      style={{ fontSize: 11, padding: "3px 10px", border: "1px solid #fca5a5", borderRadius: 6, background: "#fef2f2", cursor: "pointer", color: "#b91c1c", fontWeight: 600 }}>
                      🗑 Remover selecionadas
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    if (!window.confirm(`Remover todos os ${informesEditaveis.length} informes da lista?`)) return;
                    setInformesEditaveis([]);
                    setSelecionados(new Set());
                  }}
                  style={{ fontSize: 11, padding: "3px 10px", border: "1px solid #fca5a5", borderRadius: 6, background: "#fef2f2", cursor: "pointer", color: "#b91c1c", fontWeight: 600, marginLeft: "auto" }}>
                  🗑 Remover todos
                </button>
              </div>
              {informesEditaveis.map((inf: any, i: number) => (
                <InformeCard key={i} inf={inf} idx={i} selecionado={selecionados.has(i)}
                  onToggle={() => toggleSelecao(i)}
                  onEditar={(novoInf) => editarInforme(i, novoInf)}
                  onDeletar={() => deletarInforme(i)} />
              ))}
            </div>
          )}

          {/* Sem impacto — colapsados */}
          {(resultado.sem_impacto || []).length > 0 && (
            <details style={{ marginBottom: 8 }}>
              <summary style={{ fontSize: 12, color: "#6b7280", cursor: "pointer", fontWeight: 600 }}>
                📄 Sem impacto direto ({(resultado.sem_impacto || []).length}) — atos MS sem relação com Apuí/AM
              </summary>
              <div style={{ marginTop: 8 }}>
                {(resultado.sem_impacto || []).map((p: any, i: number) => (
                  <InformeCard key={i} inf={p} idx={i} selecionado={false}
                    onToggle={() => {}}
                    onEditar={() => {}}
                    onDeletar={() => {}} />
                ))}
              </div>
            </details>
          )}

          {resultado.total === 0 && (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8", fontSize: 13 }}>
              Nenhuma portaria do Ministério da Saúde encontrada para esta data no DOU.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PainelEnviosDiarios() {
  const qc = useQueryClient();

  const { data: status, isLoading: loadingStatus, refetch } = useQuery({
    queryKey: ["email-diario-status"],
    queryFn: () => apiGet("/api/email-diario/status"),
    staleTime: 30_000,
    retry: false,
  });

  const enviarAgora = useMutation({
    mutationFn: () => apiPost("/api/email-diario/enviar-agora", {}),
    onSuccess: () => { refetch(); },
  });

  const pausar = useMutation({
    mutationFn: () => apiPost("/api/email-diario/pausar", {}),
    onSuccess: () => { refetch(); },
  });

  const retomar = useMutation({
    mutationFn: () => apiPost("/api/email-diario/retomar", {}),
    onSuccess: () => { refetch(); },
  });

  const statusIcon = (s: string) => {
    if (s === "enviado" || s === "reenviado") return <CheckCircle size={13} color="#16a34a" />;
    if (s === "falha") return <XCircle size={13} color="#dc2626" />;
    if (s === "pendente") return <Clock size={13} color="#d97706" />;
    if (s === "pausado") return <Pause size={13} color="#6b7280" />;
    return <AlertCircle size={13} color="#94a3b8" />;
  };

  const statusCor = (s: string) => ({
    enviado: "#16a34a", reenviado: "#16a34a", falha: "#dc2626",
    pendente: "#d97706", pausado: "#6b7280",
  }[s] || "#94a3b8");

  if (loadingStatus) return (
    <div style={{ textAlign: "center", padding: 24, color: "#94a3b8", fontSize: 13 }}>
      Carregando painel de envios…
    </div>
  );

  const st = status as any;

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #bfdbfe", overflow: "hidden", marginBottom: 20 }}>
      {/* Header */}
      <div style={{ background: "#1d4ed8", padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
        <Mail size={16} color="#fff" />
        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Envios Diários — Agente de Portarias MS</span>
        {st?.pausado && (
          <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 800, color: "#fbbf24", background: "rgba(251,191,36,0.2)", border: "1px solid #fbbf24", padding: "2px 10px", borderRadius: 20 }}>⏸ PAUSADO</span>
        )}
      </div>

      <div style={{ padding: "20px 24px" }}>
        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Próximo envio",       val: st?.proximo_envio || "—",         cor: "#1d4ed8", bg: "#eff6ff", bd: "#bfdbfe" },
            { label: "Último envio",        val: st?.ultimo_envio || "Nenhum",      cor: "#15803d", bg: "#f0fdf4", bd: "#bbf7d0" },
            { label: "Destinatário",        val: st?.destinatario || "—",          cor: "#475569", bg: "#f8fafc", bd: "#e5e7eb" },
            { label: "Portarias (último)",  val: String(st?.qtd_portarias_ultimo ?? 0), cor: "#d97706", bg: "#fffbeb", bd: "#fde68a" },
            { label: "Informes (último)",   val: String(st?.qtd_informes_ultimo ?? 0),  cor: "#7c3aed", bg: "#f5f3ff", bd: "#c4b5fd" },
          ].map(k => (
            <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.bd}`, borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 0.5 }}>{k.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: k.cor, marginTop: 4, wordBreak: "break-all" as const }}>{k.val}</div>
            </div>
          ))}
          <div style={{ background: st?.status_atual === "falha" ? "#fef2f2" : "#f8fafc", border: `1px solid ${st?.status_atual === "falha" ? "#fca5a5" : "#e5e7eb"}`, borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Status</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
              {statusIcon(st?.status_atual || "")}
              <span style={{ fontSize: 13, fontWeight: 700, color: statusCor(st?.status_atual || "") }}>{st?.status_atual || "nenhum"}</span>
            </div>
            {st?.erro_ultimo && <div style={{ fontSize: 10, color: "#dc2626", marginTop: 4 }}>{st.erro_ultimo.slice(0, 80)}</div>}
          </div>
        </div>

        {/* Tentativas */}
        {st?.tentativas_ultimo > 0 && (
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
            Tentativas realizadas: <strong>{st.tentativas_ultimo}</strong> / 3
          </div>
        )}

        {/* Botões de ação */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, marginBottom: 20 }}>
          <button
            onClick={() => enviarAgora.mutate()}
            disabled={enviarAgora.isPending}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: "#1d4ed8", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            <Play size={13} />{enviarAgora.isPending ? "Enviando…" : "Enviar agora"}
          </button>
          <button
            onClick={() => enviarAgora.mutate()}
            disabled={enviarAgora.isPending}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f8fafc", color: "#475569", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            <RotateCcw size={13} /> Reenviar
          </button>
          {!st?.pausado ? (
            <button
              onClick={() => pausar.mutate()}
              disabled={pausar.isPending}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid #fde68a", background: "#fffbeb", color: "#d97706", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              <Pause size={13} /> Pausar envio
            </button>
          ) : (
            <button
              onClick={() => retomar.mutate()}
              disabled={retomar.isPending}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#15803d", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              <Play size={13} /> Retomar envio
            </button>
          )}
        </div>

        {/* Alerta de falha */}
        {st?.status_atual === "falha" && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#991b1b" }}>
            <strong>⚠ Último envio falhou.</strong> Verifique as variáveis de ambiente <code>SMTP_USER</code>, <code>SMTP_PASS</code> e <code>EMAIL_RECIPIENT</code> no Railway. Erro: {st?.erro_ultimo}
          </div>
        )}

        {/* Histórico de envios */}
        {st?.historico?.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 8 }}>Histórico de envios</div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
              {st.historico.filter((h: any) => h.data_referencia !== "pausa").slice(0, 10).map((h: any) => (
                <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", borderRadius: 6, padding: "8px 12px", fontSize: 12 }}>
                  {statusIcon(h.status)}
                  <span style={{ color: "#1e293b", fontWeight: 600, minWidth: 90 }}>{h.data_referencia}</span>
                  <span style={{ color: statusCor(h.status), flex: 1 }}>{h.status}</span>
                  <span style={{ color: "#64748b" }}>{h.qtd_portarias} portaria(s)</span>
                  <span style={{ color: "#64748b" }}>{h.tentativas} tent.</span>
                  <a
                    href={`/api/email-diario/visualizar/${h.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 4, color: "#1d4ed8", fontSize: 11 }}
                  >
                    <Eye size={12} /> ver
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ── Painel Portarias DOU (banco) ─────────────────────────────────────────────

const COR_PRIO_DOU: Record<string, string> = {
  urgente: "#dc2626", prazo: "#ea580c", financeiro: "#059669",
  normativo: "#2563eb", sem_impacto: "#6b7280",
};

async function _atualizarStatusPortaria(id: number, status: string, motivo?: string) {
  const resp = await api.patch(`/api/email-diario/portarias/${id}/status`, { status, motivo });
  return resp.data;
}

function PainelPortariasDOU() {
  const hoje = new Date().toISOString().slice(0, 10);
  const hojeAnoMes = hoje.slice(0, 7); // "YYYY-MM"

  // Modo de filtro de data: "dia" ou "mes"
  const [modoData, setModoData] = useState<"dia" | "mes">("dia");
  const [filtroData, setFiltroData] = useState(hoje);       // "YYYY-MM-DD"
  const [filtroMes, setFiltroMes] = useState(hojeAnoMes);  // "YYYY-MM"

  const [filtroRel, setFiltroRel] = useState("");
  const [filtroPrio, setFiltroPrio] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [expandido, setExpandido] = useState<number | null>(null);
  const [atualizando, setAtualizando] = useState<number | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [resultadoBusca, setResultadoBusca] = useState<string | null>(null);
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const qc = useQueryClient();

  // Navegação dia a dia
  const navDia = (delta: number) => {
    const d = new Date(filtroData + "T12:00:00");
    d.setDate(d.getDate() + delta);
    const nova = d.toISOString().slice(0, 10);
    if (nova <= hoje) setFiltroData(nova);
  };

  // Navegação mês a mês
  const navMes = (delta: number) => {
    const [ano, mes] = filtroMes.split("-").map(Number);
    const d = new Date(ano, mes - 1 + delta, 1);
    const nova = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (nova <= hojeAnoMes) setFiltroMes(nova);
  };

  // Monta params de query
  const params = new URLSearchParams();
  if (modoData === "dia" && filtroData) {
    params.set("data", filtroData);
  } else if (modoData === "mes" && filtroMes) {
    // Passa mês como data_inicio + data_fim
    const [ano, mes] = filtroMes.split("-").map(Number);
    const inicio = `${filtroMes}-01`;
    const fimDate = new Date(ano, mes, 0); // último dia do mês
    const fim = `${filtroMes}-${String(fimDate.getDate()).padStart(2, "0")}`;
    params.set("data_inicio", inicio);
    params.set("data_fim", fim);
  }
  if (filtroRel) params.set("relevancia", filtroRel);
  if (filtroPrio) params.set("prioridade", filtroPrio);
  if (filtroStatus) params.set("status", filtroStatus);
  params.set("limit", "200");

  const queryKey = ["portarias-dou", modoData, filtroData, filtroMes, filtroRel, filtroPrio, filtroStatus];

  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () => apiGet(`/api/email-diario/portarias?${params.toString()}`),
    staleTime: 60_000,
    retry: false,
  });

  const buscarDOU = async () => {
    if (modoData === "dia" && !filtroData) return;
    if (modoData === "mes" && !filtroMes) return;
    setBuscando(true);
    setResultadoBusca(null);
    setErroBusca(null);
    try {
      if (modoData === "dia") {
        const r = await apiGet(`/api/email-diario/buscar-dou?data=${filtroData}`);
        const tot = (r as any)?.total ?? 0;
        setResultadoBusca(`${tot} portaria(s) do MS salvas (${filtroData}).`);
      } else {
        // Busca todos os dias úteis do mês
        const [ano, mes] = filtroMes.split("-").map(Number);
        const diasNoMes = new Date(ano, mes, 0).getDate();
        let totalAcum = 0;
        let diasBuscados = 0;
        for (let d = 1; d <= diasNoMes; d++) {
          const dataStr = `${filtroMes}-${String(d).padStart(2, "0")}`;
          if (dataStr > hoje) break;
          const diaSemana = new Date(dataStr + "T12:00:00").getDay();
          if (diaSemana === 0 || diaSemana === 6) continue;
          diasBuscados++;
          try {
            const r2 = await apiGet(`/api/email-diario/buscar-dou?data=${dataStr}`);
            totalAcum += (r2 as any)?.total ?? 0;
          } catch { /* dia sem publicação */ }
        }
        setResultadoBusca(`${totalAcum} portaria(s) capturadas em ${diasBuscados} dias úteis de ${filtroMes}.`);
      }
      setFiltroRel(""); // reseta para mostrar todas as portarias
      qc.invalidateQueries({ queryKey: ["portarias-dou"] });
      qc.invalidateQueries({ queryKey: ["portarias-execucoes"] });
    } catch (e: any) {
      setErroBusca(e?.message || "Erro ao buscar no DOU.");
    } finally {
      setBuscando(false);
    }
  };

  const mudarStatus = async (id: number, status: string) => {
    setAtualizando(id);
    try {
      await _atualizarStatusPortaria(id, status);
      qc.invalidateQueries({ queryKey: ["portarias-dou"] });
    } finally {
      setAtualizando(null);
    }
  };

  const { data: execucoes } = useQuery({
    queryKey: ["portarias-execucoes"],
    queryFn: () => apiGet("/api/email-diario/execucoes?limit=10"),
    staleTime: 60_000,
    retry: false,
  });

  const portarias: any[] = (data as any)?.portarias || [];
  const total: number = (data as any)?.total || 0;

  const COR_REL_DOU: Record<string, string> = {
    apui: "#059669", amazonas: "#7c3aed", federal: "#0284c7", sem_impacto: "#6b7280",
  };
  const LABEL_REL_DOU: Record<string, string> = {
    apui: "📍 Apuí/AM", amazonas: "🏛 Amazonas", federal: "🇧🇷 Federal", sem_impacto: "⚪ Sem impacto",
  };
  const LABEL_PRIO_DOU: Record<string, string> = {
    urgente: "🔴 Urgente", prazo: "🟠 Prazo", financeiro: "🟢 Financeiro",
    normativo: "🔵 Normativo", sem_impacto: "⚪ Sem impacto",
  };

  return (
    <div>
      {/* Execuções recentes */}
      {(execucoes as any)?.execucoes?.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 10, textTransform: "uppercase" as const, letterSpacing: 0.5 }}>
            Últimas Execuções do Agente
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
            {((execucoes as any).execucoes as any[]).map((e: any) => (
              <div key={e.id} style={{ display: "flex", gap: 12, fontSize: 11, background: "#f8fafc", borderRadius: 6, padding: "6px 12px", alignItems: "center", flexWrap: "wrap" as const }}>
                <span style={{ fontWeight: 700, color: "#1e293b", minWidth: 90 }}>{e.data_referencia}</span>
                <span style={{ color: "#64748b" }}>bruto: <strong>{e.total_bruto}</strong></span>
                <span style={{ color: "#059669" }}>aceitos: <strong>{e.total_aceitos}</strong></span>
                <span style={{ color: "#dc2626" }}>descartados: <strong>{e.total_descartados}</strong></span>
                <span style={{ color: "#d97706" }}>duplicatas: <strong>{e.total_duplicatas}</strong></span>
                <span style={{ color: e.email_enviado ? "#059669" : "#94a3b8" }}>{e.email_enviado ? "✓ e-mail" : "sem e-mail"}</span>
                <span style={{ marginLeft: "auto", fontSize: 10, color: "#94a3b8" }}>{e.modo}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros + Busca */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap" as const, gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>
            Portarias salvas no banco — {total} registro(s)
          </div>
          {/* Toggle Dia / Mês */}
          <div style={{ display: "flex", border: "1px solid #e2e8f0", borderRadius: 6, overflow: "hidden" }}>
            {(["dia", "mes"] as const).map(m => (
              <button key={m} onClick={() => setModoData(m)}
                style={{ padding: "4px 14px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                  background: modoData === m ? "#1d4ed8" : "#f8fafc",
                  color: modoData === m ? "#fff" : "#475569" }}>
                {m === "dia" ? "Por dia" : "Por mês"}
              </button>
            ))}
          </div>
        </div>

        {/* Linha 1: seletor de data com navegação */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 10, flexWrap: "wrap" as const }}>
          {/* Botão anterior */}
          <button onClick={() => modoData === "dia" ? navDia(-1) : navMes(-1)}
            title={modoData === "dia" ? "Dia anterior" : "Mês anterior"}
            style={{ padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8fafc", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#475569" }}>
            ←
          </button>

          {modoData === "dia" ? (
            <input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)}
              max={hoje}
              style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 10px", fontSize: 13, fontWeight: 600 }} />
          ) : (
            <input type="month" value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
              max={hojeAnoMes}
              style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 10px", fontSize: 13, fontWeight: 600 }} />
          )}

          {/* Botão próximo */}
          <button
            onClick={() => modoData === "dia" ? navDia(1) : navMes(1)}
            disabled={modoData === "dia" ? filtroData >= hoje : filtroMes >= hojeAnoMes}
            title={modoData === "dia" ? "Próximo dia" : "Próximo mês"}
            style={{ padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8fafc", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#475569",
              opacity: (modoData === "dia" ? filtroData >= hoje : filtroMes >= hojeAnoMes) ? 0.4 : 1 }}>
            →
          </button>

          {/* Atalho: Hoje / Mês atual */}
          <button onClick={() => modoData === "dia" ? setFiltroData(hoje) : setFiltroMes(hojeAnoMes)}
            style={{ padding: "5px 12px", border: "1px solid #bfdbfe", borderRadius: 6, background: "#eff6ff", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "#1d4ed8" }}>
            {modoData === "dia" ? "Hoje" : "Mês atual"}
          </button>

          {/* Label informativo */}
          {modoData === "mes" && (
            <span style={{ fontSize: 11, color: "#64748b" }}>
              Busca todos os dias úteis do mês (segunda a sexta)
            </span>
          )}
        </div>

        {/* Linha 2: filtros + botões */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, alignItems: "center" }}>
          <select value={filtroRel} onChange={e => setFiltroRel(e.target.value)}
            style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 10px", fontSize: 12 }}>
            <option value="">Todas as portarias MS</option>
            <option value="apui">📍 Relevante para Apuí/AM</option>
            <option value="amazonas">🏛 Somente Amazonas</option>
            <option value="federal">🇧🇷 Somente Federal</option>
            <option value="sem_impacto">⚪ Sem impacto direto</option>
          </select>
          <select value={filtroPrio} onChange={e => setFiltroPrio(e.target.value)}
            style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 10px", fontSize: 12 }}>
            <option value="">Toda prioridade</option>
            <option value="urgente">🔴 Urgente</option>
            <option value="prazo">🟠 Prazo/Providência</option>
            <option value="financeiro">🟢 Recurso Financeiro</option>
            <option value="normativo">🔵 Normativo</option>
            <option value="sem_impacto">⚪ Sem impacto</option>
          </select>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
            style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 10px", fontSize: 12 }}>
            <option value="">Todo status</option>
            <option value="processado">Processado</option>
            <option value="revisao_manual">Revisão manual</option>
            <option value="descartado">Descartado</option>
          </select>

          <button onClick={buscarDOU} disabled={buscando}
            style={{ padding: "6px 16px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            <Search size={12} />
            {buscando
              ? (modoData === "mes" ? "Buscando mês…" : "Buscando…")
              : (modoData === "mes" ? "Buscar mês no DOU" : "Buscar no DOU")}
          </button>

          <button onClick={() => refetch()}
            style={{ padding: "6px 12px", background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Atualizar lista
          </button>

          <LimparNaoMsBtn onDone={() => refetch()} />
        </div>

        {/* Feedback */}
        {buscando && modoData === "mes" && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, fontSize: 12, color: "#1d4ed8" }}>
            ⏳ Buscando portarias de cada dia útil do mês {filtroMes}… Isso pode levar alguns segundos.
          </div>
        )}
        {resultadoBusca && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, fontSize: 12, color: "#15803d", fontWeight: 600 }}>
            ✓ {resultadoBusca}
          </div>
        )}
        {erroBusca && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, fontSize: 12, color: "#991b1b" }}>
            ⚠ {erroBusca}
          </div>
        )}
      </div>

      {isLoading && <div style={{ textAlign: "center", padding: 32, color: "#94a3b8", fontSize: 13 }}>Carregando portarias…</div>}

      {!isLoading && portarias.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 13 }}>
          <FileText size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
          <div>Nenhuma portaria encontrada com estes filtros.</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Clique em <strong>Buscar no DOU</strong> para capturar portarias do MS da data selecionada.</div>
        </div>
      )}

      {portarias.map((p: any) => {
        const cor = COR_REL_DOU[p.relevancia] || "#6b7280";
        const isOpen = expandido === p.id;
        return (
          <div key={p.id} style={{ background: "#fff", borderRadius: 8, border: `1px solid ${cor}30`, marginBottom: 8, overflow: "hidden" }}>
            <div
              onClick={() => setExpandido(isOpen ? null : p.id)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", cursor: "pointer", background: `${cor}08` }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: cor, background: `${cor}18`, border: `1px solid ${cor}40`, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" as const }}>
                {LABEL_REL_DOU[p.relevancia]}
              </span>
              {p.prioridade && p.prioridade !== "sem_impacto" && (
                <span style={{ fontSize: 10, fontWeight: 700, color: COR_PRIO_DOU[p.prioridade], background: `${COR_PRIO_DOU[p.prioridade]}12`, border: `1px solid ${COR_PRIO_DOU[p.prioridade]}40`, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" as const }}>
                  {LABEL_PRIO_DOU[p.prioridade]}
                </span>
              )}
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", flex: 1 }}>{p.titulo}</span>
              {p.numero && <span style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" as const }}>{p.numero}</span>}
              {p.status === "revisao_manual" && (
                <span style={{ fontSize: 9, fontWeight: 800, color: "#92400e", background: "#fef3c7", border: "1px solid #fcd34d", padding: "1px 7px", borderRadius: 20, whiteSpace: "nowrap" as const }}>
                  ⚠ REVISÃO
                </span>
              )}
              {p.status === "descartado" && (
                <span style={{ fontSize: 9, fontWeight: 800, color: "#7f1d1d", background: "#fee2e2", border: "1px solid #fca5a5", padding: "1px 7px", borderRadius: 20, whiteSpace: "nowrap" as const }}>
                  🗑 DESCARTADO
                </span>
              )}
              <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" as const }}>{p.data_publicacao}</span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{isOpen ? "▲" : "▼"}</span>
            </div>
            {isOpen && (
              <div style={{ padding: "12px 14px", borderTop: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>
                  <strong>Órgão:</strong> {p.orgao || "—"} &nbsp;|&nbsp;
                  <strong>Capturado:</strong> {p.capturado_em ? new Date(p.capturado_em).toLocaleString("pt-BR") : "—"}
                </div>
                {p.resumo && (
                  <div style={{ fontSize: 12, color: "#374151", background: "#f8fafc", borderRadius: 6, padding: "8px 10px", marginBottom: 8, lineHeight: 1.6 }}>
                    {p.resumo}
                  </div>
                )}
                {(p.valores_identificados?.length > 0) && (
                  <div style={{ fontSize: 11, color: "#059669", fontWeight: 700, marginBottom: 6 }}>
                    💰 Valores: {p.valores_identificados.join(" · ")}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, alignItems: "center", marginTop: 8 }}>
                  {p.url_oficial && (
                    <a href={p.url_oficial} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, color: "#1d4ed8", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <ExternalLink size={11} /> Abrir no DOU
                    </a>
                  )}
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>|</span>
                  {p.status !== "processado" && (
                    <button disabled={atualizando === p.id}
                      onClick={() => mudarStatus(p.id, "processado")}
                      style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#15803d", cursor: "pointer" }}>
                      ✓ Processado
                    </button>
                  )}
                  {p.status !== "revisao_manual" && (
                    <button disabled={atualizando === p.id}
                      onClick={() => mudarStatus(p.id, "revisao_manual")}
                      style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, border: "1px solid #fde68a", background: "#fffbeb", color: "#92400e", cursor: "pointer" }}>
                      ⚠ Revisão manual
                    </button>
                  )}
                  {p.status !== "descartado" && (
                    <button disabled={atualizando === p.id}
                      onClick={() => { if (window.confirm("Descartar esta portaria?")) mudarStatus(p.id, "descartado"); }}
                      style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626", cursor: "pointer" }}>
                      🗑 Descartar
                    </button>
                  )}
                  <span style={{ fontSize: 10, fontWeight: 700, marginLeft: 4, color: ({"processado":"#15803d","revisao_manual":"#92400e","descartado":"#dc2626","retificado":"#7c3aed"} as Record<string,string>)[p.status] || "#6b7280" }}>
                    ● {p.status}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Portarias() {
  const [q, setQ] = useState("");
  const [bloco, setBloco] = useState("");
  const [ano, setAno] = useState<number | undefined>();
  const [modal, setModal] = useState(false);
  const [aba, setAba] = useState<"banco" | "envios" | "dou">("envios");
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

  // Portarias capturadas pelo agente DOU ainda não importadas para o banco
  const { data: pendenteDOU = [] } = useQuery<{ id: number; titulo: string; numero: string; orgao: string; relevancia: string; prioridade: string; }[]>({
    queryKey: ["portarias-pendentes-dou"],
    queryFn: () => apiGet("/api/portarias/pendentes-dou"),
    staleTime: 60_000,
    enabled: aba === "banco",
  });

  const [importandoDOU, setImportandoDOU] = useState(false);
  const [importadosOk, setImportadosOk] = useState<number | null>(null);

  const importarTodosDOU = async () => {
    if (!pendenteDOU.length) return;
    setImportandoDOU(true);
    setImportadosOk(null);
    try {
      const ids = pendenteDOU.map((p) => p.id);
      const res = await apiPost("/api/portarias/importar-dou", ids);
      setImportadosOk(res.importadas ?? 0);
      qc.invalidateQueries({ queryKey: ["portarias"] });
      qc.invalidateQueries({ queryKey: ["portarias-pendentes-dou"] });
    } catch {
      // erro silencioso — o banner ainda mostra
    } finally {
      setImportandoDOU(false);
    }
  };

  const fmt = (v: number) => v?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (!isLoading && !portarias) return (
    <div style={{ padding: 24 }}>
      <NaoDisponivelBanner
        titulo="Portarias indisponivel"
        nota="Dados nao disponiveis — integracao pendente de configuracao no Railway."
      />
    </div>
  );

  return (
    <div style={S.page}>
      {modal && <NovaPortariaModal onClose={() => setModal(false)} />}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, borderBottom: "2px solid #e5e7eb", marginBottom: 20 }}>
        {([
          { key: "envios", label: "Envios Diários",    icon: <Mail size={13} /> },
          { key: "dou",    label: "Portarias DOU",     icon: <Search size={13} /> },
          { key: "banco",  label: "Banco de Portarias",icon: <FileText size={13} /> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setAba(t.key)} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 0, border: "none",
            borderBottom: aba === t.key ? "2px solid #1d4ed8" : "2px solid transparent",
            background: "none", fontSize: 13, fontWeight: aba === t.key ? 700 : 400,
            color: aba === t.key ? "#1d4ed8" : "#6b7280", cursor: "pointer", marginBottom: -2,
          }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Aba: Envios Diários */}
      {aba === "envios" && <>
        <PainelEnviosDiarios />
        <BuscaRetroativa />
      </>}

      {/* Aba: Portarias DOU (banco agente) */}
      {aba === "dou" && <PainelPortariasDOU />}

      {/* Aba: Banco de Portarias */}
      {aba === "banco" && <>

      <div style={S.header}>
        <div style={S.title}>
          <FileText size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
          Banco de Portarias
        </div>
        <button onClick={() => setModal(true)} style={{ ...S.btn, background: "#1D9E75", color: "#fff" }}>
          <Plus size={14} /> Nova Portaria
        </button>
      </div>

      {/* Banner: importar do agente DOU */}
      {pendenteDOU.length > 0 && importadosOk === null && (
        <div style={{
          background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: 8,
          padding: "12px 16px", marginBottom: 14,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1d4ed8" }}>
              🤖 {pendenteDOU.length} portaria{pendenteDOU.length > 1 ? "s" : ""} capturada{pendenteDOU.length > 1 ? "s" : ""} pelo agente DOU disponível{pendenteDOU.length > 1 ? "is" : ""} para importar
            </div>
            <div style={{ fontSize: 12, color: "#3b82f6", marginTop: 2 }}>
              Apenas portarias com relevância Apuí/AM, Amazonas ou Federal Municipal
            </div>
          </div>
          <button
            onClick={importarTodosDOU}
            disabled={importandoDOU}
            style={{ ...S.btn, background: "#1d4ed8", color: "#fff", whiteSpace: "nowrap" }}
          >
            {importandoDOU ? <RotateCcw size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={13} />}
            {importandoDOU ? "Importando…" : "Importar todas"}
          </button>
        </div>
      )}
      {importadosOk !== null && (
        <div style={{
          background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8,
          padding: "10px 16px", marginBottom: 14, fontSize: 13, color: "#15803d", fontWeight: 600,
        }}>
          ✓ {importadosOk} portaria{importadosOk !== 1 ? "s" : ""} importada{importadosOk !== 1 ? "s" : ""} com sucesso do agente DOU.
        </div>
      )}

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

      </>}
    </div>
  );
}
