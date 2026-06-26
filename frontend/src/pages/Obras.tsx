// Módulo 4 — Obras e SISMOB
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiObras, type Obra } from "../lib/api";
import { Building2, Plus, AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";

const S = {
  page: { padding: 20 } as React.CSSProperties,
  card: { background: "#fff", borderRadius: 8, border: "1px solid #e5e5e3", padding: 16, marginBottom: 10 } as React.CSSProperties,
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 } as React.CSSProperties,
  btn: { padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 5 } as React.CSSProperties,
  label: { fontSize: 11, color: "#737373", marginBottom: 3 } as React.CSSProperties,
  input: { border: "1px solid #e5e5e3", borderRadius: 6, padding: "7px 10px", fontSize: 13, width: "100%", boxSizing: "border-box" as const },
};

const STATUS_CONFIG: Record<string, { cor: string; bg: string; icon: React.ReactNode }> = {
  "Em licitação":  { cor: "#d97706", bg: "#fffbeb", icon: <Clock size={13} /> },
  "Em andamento":  { cor: "#2563eb", bg: "#eff6ff", icon: <Building2 size={13} /> },
  "Paralisada":    { cor: "#dc2626", bg: "#fff0f0", icon: <XCircle size={13} /> },
  "Concluída":     { cor: "#059669", bg: "#f0fdf4", icon: <CheckCircle2 size={13} /> },
  "Cancelada":     { cor: "#737373", bg: "#f5f5f5", icon: <XCircle size={13} /> },
};

function Semaforo({ perc }: { perc: number }) {
  const cor = perc >= 75 ? "#059669" : perc >= 50 ? "#d97706" : "#dc2626";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 100, height: 6, background: "#e5e5e3", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(perc, 100)}%`, height: "100%", background: cor, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, color: cor, fontWeight: 600 }}>{perc.toFixed(0)}%</span>
    </div>
  );
}

function NovaObraModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    nome_estabelecimento: "",
    tipo_estabelecimento: "UBS",
    tipo_obra: "Construção",
    valor_contrato: 0,
    empresa_construtora: "",
    engenheiro_resp: "",
    art_numero: "",
    data_inicio: "",
    data_previsao_conclusao: "",
    status: "Em licitação",
    numero_sismob: "",
    observacoes: "",
  });

  const mutation = useMutation({
    mutationFn: () => apiObras.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["obras"] }); onClose(); },
  });

  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: "#fff", borderRadius: 10, padding: 24, width: 560, maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Cadastrar Obra</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <div style={S.label}>Nome do Estabelecimento</div>
            <input value={form.nome_estabelecimento} onChange={(e) => set("nome_estabelecimento", e.target.value)} style={S.input} />
          </div>
          <div>
            <div style={S.label}>Tipo de Estabelecimento</div>
            <select value={form.tipo_estabelecimento} onChange={(e) => set("tipo_estabelecimento", e.target.value)} style={S.input}>
              {["UBS", "Hospital", "CAPS", "Academia da Saúde", "UPA", "SAMU", "CEO", "Outro"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <div style={S.label}>Tipo de Obra</div>
            <select value={form.tipo_obra} onChange={(e) => set("tipo_obra", e.target.value)} style={S.input}>
              {["Construção", "Reforma", "Ampliação", "Aquisição de Equipamento"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <div style={S.label}>Valor do Contrato (R$)</div>
            <input type="number" value={form.valor_contrato} onChange={(e) => set("valor_contrato", Number(e.target.value))} style={S.input} />
          </div>
          <div>
            <div style={S.label}>Número SISMOB</div>
            <input value={form.numero_sismob} onChange={(e) => set("numero_sismob", e.target.value)} style={S.input} />
          </div>
          <div>
            <div style={S.label}>Empresa Construtora</div>
            <input value={form.empresa_construtora} onChange={(e) => set("empresa_construtora", e.target.value)} style={S.input} />
          </div>
          <div>
            <div style={S.label}>Engenheiro Responsável</div>
            <input value={form.engenheiro_resp} onChange={(e) => set("engenheiro_resp", e.target.value)} style={S.input} />
          </div>
          <div>
            <div style={S.label}>Número ART</div>
            <input value={form.art_numero} onChange={(e) => set("art_numero", e.target.value)} style={S.input} />
          </div>
          <div>
            <div style={S.label}>Status</div>
            <select value={form.status} onChange={(e) => set("status", e.target.value)} style={S.input}>
              {Object.keys(STATUS_CONFIG).map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div style={S.label}>Data de Início</div>
            <input type="date" value={form.data_inicio} onChange={(e) => set("data_inicio", e.target.value)} style={S.input} />
          </div>
          <div>
            <div style={S.label}>Previsão de Conclusão</div>
            <input type="date" value={form.data_previsao_conclusao} onChange={(e) => set("data_previsao_conclusao", e.target.value)} style={S.input} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <div style={S.label}>Observações</div>
            <textarea value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} rows={2} style={{ ...S.input, resize: "vertical" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ ...S.btn, background: "#f5f5f3" }}>Cancelar</button>
          <button onClick={() => mutation.mutate()} style={{ ...S.btn, background: "#1D9E75", color: "#fff" }} disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando…" : "Salvar Obra"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Obras() {
  const [modal, setModal] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("");
  const qc = useQueryClient();

  const { data: obras = [], isLoading } = useQuery({
    queryKey: ["obras", filtroStatus],
    queryFn: () => apiObras.list(filtroStatus ? { status: filtroStatus } : undefined),
    staleTime: 30_000,
  });

  const remover = useMutation({
    mutationFn: (id: number) => apiObras.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["obras"] }),
  });

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const atrasadas = obras.filter((o: Obra) => (o.dias_atraso ?? 0) > 0).length;
  const emAndamento = obras.filter((o: Obra) => o.status === "Em andamento").length;
  const concluidas = obras.filter((o: Obra) => o.status === "Concluída").length;

  return (
    <div style={S.page}>
      {modal && <NovaObraModal onClose={() => setModal(false)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>
          <Building2 size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
          Obras e Infraestrutura
        </div>
        <button onClick={() => setModal(true)} style={{ ...S.btn, background: "#1D9E75", color: "#fff" }}>
          <Plus size={14} /> Nova Obra
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Total de Obras", valor: obras.length, cor: "#1D9E75" },
          { label: "Em Andamento", valor: emAndamento, cor: "#2563eb" },
          { label: "Concluídas", valor: concluidas, cor: "#059669" },
          { label: "Com Atraso", valor: atrasadas, cor: "#dc2626" },
        ].map(({ label, valor, cor }) => (
          <div key={label} style={{ ...S.card, textAlign: "center", padding: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: cor }}>{valor}</div>
            <div style={{ fontSize: 11, color: "#737373" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filtro */}
      <div style={{ marginBottom: 14, display: "flex", gap: 8 }}>
        {["", ...Object.keys(STATUS_CONFIG)].map((s) => (
          <button
            key={s}
            onClick={() => setFiltroStatus(s)}
            style={{
              ...S.btn,
              background: filtroStatus === s ? "#1D9E75" : "#f5f5f3",
              color: filtroStatus === s ? "#fff" : "#404040",
              fontSize: 12,
            }}
          >
            {s || "Todas"}
          </button>
        ))}
      </div>

      {isLoading && <div style={{ textAlign: "center", padding: 40, color: "#737373" }}>Carregando…</div>}

      <div style={S.grid}>
        {obras.map((obra: Obra) => {
          const cfg = STATUS_CONFIG[obra.status] ?? STATUS_CONFIG["Em andamento"];
          const atrasada = (obra.dias_atraso ?? 0) > 0;
          return (
            <div key={obra.id} style={{ ...S.card, position: "relative", borderLeft: `3px solid ${cfg.cor}` }}>
              {atrasada && (
                <div style={{ position: "absolute", top: 10, right: 10, display: "flex", alignItems: "center", gap: 4, background: "#fff0f0", color: "#dc2626", borderRadius: 4, padding: "2px 7px", fontSize: 11 }}>
                  <AlertTriangle size={11} /> {obra.dias_atraso}d atraso
                </div>
              )}
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, paddingRight: atrasada ? 90 : 0 }}>
                {obra.nome_estabelecimento}
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ background: cfg.bg, color: cfg.cor, borderRadius: 4, padding: "2px 7px", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}>
                  {cfg.icon} {obra.status}
                </span>
                <span style={{ background: "#f5f5f3", color: "#737373", borderRadius: 4, padding: "2px 7px", fontSize: 11 }}>
                  {obra.tipo_estabelecimento}
                </span>
                <span style={{ background: "#f5f5f3", color: "#737373", borderRadius: 4, padding: "2px 7px", fontSize: 11 }}>
                  {obra.tipo_obra}
                </span>
              </div>

              {obra.numero_sismob && (
                <div style={{ fontSize: 11, color: "#737373", marginBottom: 6 }}>SISMOB: {obra.numero_sismob}</div>
              )}

              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: "#737373", marginBottom: 3 }}>Execução Física</div>
                <Semaforo perc={obra.perc_fisico} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: "#737373", marginBottom: 3 }}>Execução Financeira</div>
                <Semaforo perc={obra.perc_financeiro} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#059669" }}>{fmt(obra.valor_contrato)}</span>
                {obra.data_previsao_conclusao && (
                  <span style={{ fontSize: 11, color: "#737373" }}>
                    Prev: {new Date(obra.data_previsao_conclusao).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>

              {obra.empresa_construtora && (
                <div style={{ fontSize: 11, color: "#737373", marginTop: 4 }}>{obra.empresa_construtora}</div>
              )}

              <button
                onClick={() => { if (window.confirm("Remover esta obra?")) remover.mutate(obra.id); }}
                style={{ ...S.btn, background: "#fff0f0", color: "#dc2626", marginTop: 10, fontSize: 11, padding: "4px 10px" }}
              >
                Remover
              </button>
            </div>
          );
        })}
      </div>

      {!isLoading && obras.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#737373" }}>
          <Building2 size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
          <div>Nenhuma obra cadastrada.</div>
        </div>
      )}
    </div>
  );
}
