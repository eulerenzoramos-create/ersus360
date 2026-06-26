// src/pages/Indicadores.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiIndicadores, type Indicador } from "../lib/api";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";

const COR: Record<string, string> = {
  "Atingido": "#3B6D11",
  "Em andamento": "#BA7517",
  "Não atingido": "#A32D2D",
  "Não avaliado": "#888780",
};

const BG: Record<string, string> = {
  "Atingido": "#EAF3DE",
  "Em andamento": "#FAEEDA",
  "Não atingido": "#FCEBEB",
  "Não avaliado": "#F1EFE8",
};

const SITUACOES = ["Em andamento", "Atingido", "Não atingido", "Não avaliado"];

const vazio: Partial<Indicador> = {
  indicador: "", eixo: "", unidade_medida: "%",
  meta_prevista: 100, valor_alcancado: 0, situacao: "Em andamento",
  competencia: "2026-06", municipio_id: 1,
};

export default function Indicadores() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<Indicador>>(vazio);
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: indicadores = [], isLoading } = useQuery({
    queryKey: ["indicadores"],
    queryFn: () => apiIndicadores.list(),
  });

  const mutCreate = useMutation({
    mutationFn: apiIndicadores.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["indicadores"] }); reset(); },
  });
  const mutUpdate = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<Indicador> }) =>
      apiIndicadores.update(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["indicadores"] }); reset(); },
  });
  const mutDelete = useMutation({
    mutationFn: apiIndicadores.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["indicadores"] }),
  });

  const reset = () => { setForm(vazio); setEditId(null); setShowForm(false); };

  const submit = () => {
    if (!form.indicador) return;
    if (editId !== null) mutUpdate.mutate({ id: editId, body: form });
    else mutCreate.mutate(form);
  };

  const startEdit = (ind: Indicador) => {
    setForm(ind);
    setEditId(ind.id);
    setShowForm(true);
  };

  const atingidos = indicadores.filter((i) => i.situacao === "Atingido").length;
  const execMedia = indicadores.length
    ? Math.round(indicadores.reduce((s, i) => s + i.valor_alcancado, 0) / indicadores.length)
    : 0;

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: "10px" }}>
        {[
          { label: "Total indicadores", value: indicadores.length },
          { label: "Metas atingidas", value: atingidos },
          { label: "Taxa de êxito", value: `${indicadores.length ? Math.round((atingidos / indicadores.length) * 100) : 0}%` },
          { label: "Execução média", value: `${execMedia}%` },
        ].map((k) => (
          <div key={k.label} style={{ background: "var(--color-background-secondary)", borderRadius: "8px", padding: "12px" }}>
            <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>{k.label}</div>
            <div style={{ fontSize: "22px", fontWeight: 500, marginTop: "4px" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Botão novo */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          data-testid="button-new-indicador"
          onClick={() => { reset(); setShowForm(true); }}
          style={{ padding: "8px 14px", background: "#1D9E75", color: "#fff", border: "none", borderRadius: "8px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
        >
          <Plus size={14} /> Novo Indicador
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div style={{ background: "var(--color-background-primary)", border: "1.5px solid #1D9E75", borderRadius: "12px", padding: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "12px" }}>
            {editId ? "Editar Indicador" : "Novo Indicador"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>Nome do indicador *</label>
              <input data-testid="input-indicador" value={form.indicador || ""} onChange={(e) => setForm((f) => ({ ...f, indicador: e.target.value }))}
                style={{ display: "block", width: "100%", marginTop: 4 }} placeholder="Ex: Cobertura vacinal BCG" />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>Eixo / categoria</label>
              <input value={form.eixo || ""} onChange={(e) => setForm((f) => ({ ...f, eixo: e.target.value }))}
                style={{ display: "block", width: "100%", marginTop: 4 }} placeholder="Ex: Imunização" />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>Unidade</label>
              <input value={form.unidade_medida || "%"} onChange={(e) => setForm((f) => ({ ...f, unidade_medida: e.target.value }))}
                style={{ display: "block", width: "100%", marginTop: 4 }} placeholder="%" />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>Meta prevista</label>
              <input type="number" value={form.meta_prevista ?? 100} onChange={(e) => setForm((f) => ({ ...f, meta_prevista: parseFloat(e.target.value) || 0 }))}
                style={{ display: "block", width: "100%", marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>Valor alcançado</label>
              <input data-testid="input-valor-alcancado" type="number" value={form.valor_alcancado ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, valor_alcancado: parseFloat(e.target.value) || 0 }))}
                style={{ display: "block", width: "100%", marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>Situação</label>
              <select value={form.situacao || "Em andamento"} onChange={(e) => setForm((f) => ({ ...f, situacao: e.target.value as any }))}
                style={{ display: "block", width: "100%", marginTop: 4, padding: "7px 10px", borderRadius: 6, border: "0.5px solid var(--color-border-secondary)" }}>
                {SITUACOES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>Competência</label>
              <input value={form.competencia || ""} onChange={(e) => setForm((f) => ({ ...f, competencia: e.target.value }))}
                style={{ display: "block", width: "100%", marginTop: 4 }} placeholder="2026-06" />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
            <button data-testid="button-save-indicador" onClick={submit}
              style={{ padding: "7px 14px", background: "#1D9E75", color: "#fff", border: "none", borderRadius: "8px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <Check size={13} /> {editId ? "Salvar" : "Cadastrar"}
            </button>
            <button onClick={reset}
              style={{ padding: "7px 14px", background: "transparent", border: "0.5px solid var(--color-border-secondary)", borderRadius: "8px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <X size={13} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)", fontSize: "13px", fontWeight: 500 }}>
          Indicadores PAS ({indicadores.length})
        </div>
        {isLoading ? (
          <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: "var(--color-text-secondary)" }}>Carregando...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {indicadores.map((ind) => {
              const pct = Math.min(100, Math.round((ind.valor_alcancado / (ind.meta_prevista || 1)) * 100));
              const cor = COR[ind.situacao] ?? "#888";
              return (
                <div key={ind.id} style={{ padding: "10px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)", display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: cor, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ind.indicador}
                    </div>
                    {ind.eixo && <div style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>{ind.eixo}</div>}
                  </div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ flex: 1, height: 6, background: "var(--color-background-secondary)", borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: cor, borderRadius: 3, transition: "width .4s" }} />
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: 500, color: cor, minWidth: 40, textAlign: "right" }}>
                      {ind.valor_alcancado.toFixed(0)}{ind.unidade_medida}
                    </div>
                  </div>
                  <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 500, background: BG[ind.situacao] ?? "#f0f0f0", color: cor, flexShrink: 0 }}>
                    {ind.situacao}
                  </span>
                  <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                    <button data-testid={`button-edit-indicador-${ind.id}`} onClick={() => startEdit(ind)}
                      style={{ padding: "4px 8px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 6, background: "transparent", cursor: "pointer" }}>
                      <Pencil size={12} />
                    </button>
                    <button data-testid={`button-delete-indicador-${ind.id}`}
                      onClick={() => { if (confirm("Excluir este indicador?")) mutDelete.mutate(ind.id); }}
                      style={{ padding: "4px 8px", border: "0.5px solid #F7C1C1", borderRadius: 6, background: "transparent", cursor: "pointer" }}>
                      <Trash2 size={12} color="#A32D2D" />
                    </button>
                  </div>
                </div>
              );
            })}
            {indicadores.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", fontSize: 12, color: "var(--color-text-secondary)" }}>
                Nenhum indicador cadastrado ainda.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
