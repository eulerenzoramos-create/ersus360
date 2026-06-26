// Módulo 3 — Execução Financeira
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiExecucao, apiConvenios, type Empenho, type SaldoConvenio } from "../lib/api";
import { DollarSign, Plus, TrendingUp, AlertCircle } from "lucide-react";

const S = {
  page: { padding: 20 } as React.CSSProperties,
  card: { background: "#fff", borderRadius: 8, border: "1px solid #e5e5e3", padding: 16, marginBottom: 10 } as React.CSSProperties,
  btn: { padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 5 } as React.CSSProperties,
  label: { fontSize: 11, color: "#737373", marginBottom: 3 } as React.CSSProperties,
  input: { border: "1px solid #e5e5e3", borderRadius: 6, padding: "7px 10px", fontSize: 13, width: "100%", boxSizing: "border-box" as const },
  tab: (ativo: boolean) => ({
    padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13,
    background: ativo ? "#1D9E75" : "#f5f5f3",
    color: ativo ? "#fff" : "#404040",
  }) as React.CSSProperties,
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function SaldoCard({ saldo }: { saldo: SaldoConvenio }) {
  const perc = saldo.perc_executado;
  const cor = perc >= 75 ? "#059669" : perc >= 50 ? "#d97706" : "#dc2626";
  return (
    <div style={{ ...S.card, borderLeft: `3px solid ${cor}` }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
        {saldo.numero} — {saldo.objeto.slice(0, 60)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 10 }}>
        {[
          { label: "Recebido", valor: saldo.valor_recebido, cor: "#059669" },
          { label: "Pago", valor: saldo.saldo_executado, cor: "#1d4ed8" },
          { label: "Saldo Disponível", valor: saldo.saldo_disponivel, cor: cor },
        ].map(({ label, valor, cor: c }) => (
          <div key={label} style={{ textAlign: "center", background: "#f9f9f7", borderRadius: 6, padding: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: c }}>{fmt(valor)}</div>
            <div style={{ fontSize: 11, color: "#737373" }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, height: 6, background: "#e5e5e3", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: `${Math.min(perc, 100)}%`, height: "100%", background: cor, borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 12, color: cor, fontWeight: 600, minWidth: 40 }}>{perc.toFixed(1)}%</span>
        <span style={{ fontSize: 11, color: "#737373" }}>executado</span>
      </div>
      {saldo.total_rendimento > 0 && (
        <div style={{ fontSize: 11, color: "#059669", marginTop: 6 }}>
          <TrendingUp size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
          Rendimentos: {fmt(saldo.total_rendimento)}
        </div>
      )}
    </div>
  );
}

function NovoEmpenhoModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: convenios = [] } = useQuery({
    queryKey: ["convenios"],
    queryFn: () => apiConvenios.list(),
  });

  const [form, setForm] = useState({
    convenio_id: 0,
    numero: "",
    data_empenho: new Date().toISOString().split("T")[0],
    valor: 0,
    descricao: "",
    natureza: "",
    credor: "",
    cnpj_credor: "",
    situacao: "Normal",
  });

  const mutation = useMutation({
    mutationFn: () => apiExecucao.criarEmpenho(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["empenhos"] }); onClose(); },
  });

  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: "#fff", borderRadius: 10, padding: 24, width: 500, maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Registrar Empenho</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <div style={S.label}>Convênio</div>
            <select value={form.convenio_id} onChange={(e) => set("convenio_id", Number(e.target.value))} style={S.input}>
              <option value={0}>Selecione…</option>
              {convenios.map((c) => (
                <option key={c.id} value={c.id}>{c.numero} — {c.objeto.slice(0, 40)}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={S.label}>Número do Empenho</div>
            <input value={form.numero} onChange={(e) => set("numero", e.target.value)} style={S.input} />
          </div>
          <div>
            <div style={S.label}>Data do Empenho</div>
            <input type="date" value={form.data_empenho} onChange={(e) => set("data_empenho", e.target.value)} style={S.input} />
          </div>
          <div>
            <div style={S.label}>Valor (R$)</div>
            <input type="number" step="0.01" value={form.valor} onChange={(e) => set("valor", Number(e.target.value))} style={S.input} />
          </div>
          <div>
            <div style={S.label}>Natureza da Despesa</div>
            <input value={form.natureza} onChange={(e) => set("natureza", e.target.value)} placeholder="ex: 3.3.90.30" style={S.input} />
          </div>
          <div>
            <div style={S.label}>Credor / Fornecedor</div>
            <input value={form.credor} onChange={(e) => set("credor", e.target.value)} style={S.input} />
          </div>
          <div>
            <div style={S.label}>CNPJ do Credor</div>
            <input value={form.cnpj_credor} onChange={(e) => set("cnpj_credor", e.target.value)} style={S.input} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <div style={S.label}>Descrição / Objeto</div>
            <textarea value={form.descricao} onChange={(e) => set("descricao", e.target.value)} rows={2} style={{ ...S.input, resize: "vertical" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ ...S.btn, background: "#f5f5f3" }}>Cancelar</button>
          <button
            onClick={() => mutation.mutate()}
            style={{ ...S.btn, background: "#1D9E75", color: "#fff" }}
            disabled={mutation.isPending || !form.convenio_id || !form.numero}
          >
            {mutation.isPending ? "Salvando…" : "Registrar Empenho"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Execucao() {
  const [aba, setAba] = useState<"saldos" | "empenhos" | "restos">("saldos");
  const [modal, setModal] = useState(false);
  const [convenioSel, setConvenioSel] = useState<number | undefined>();

  const { data: convenios = [] } = useQuery({ queryKey: ["convenios"], queryFn: () => apiConvenios.list() });
  const { data: empenhos = [], isLoading: loadEmp } = useQuery({
    queryKey: ["empenhos", convenioSel],
    queryFn: () => apiExecucao.empenhos(convenioSel),
  });
  const { data: restos = [] } = useQuery({
    queryKey: ["restos"],
    queryFn: () => apiExecucao.restosAPagar(),
    enabled: aba === "restos",
  });

  // Saldos de todos os convênios
  const saldoQueries = useQuery({
    queryKey: ["saldos", convenios.map((c) => c.id)],
    queryFn: async () => {
      const results = await Promise.all(
        convenios.slice(0, 8).map((c) => apiExecucao.saldo(c.id).catch(() => null))
      );
      return results.filter(Boolean) as SaldoConvenio[];
    },
    enabled: convenios.length > 0 && aba === "saldos",
  });

  const totalPago = (empenhos as Empenho[]).reduce((s, e) => s + e.valor_pago, 0);
  const totalEmpenhado = (empenhos as Empenho[]).reduce((s, e) => s + e.valor, 0);

  return (
    <div style={S.page}>
      {modal && <NovoEmpenhoModal onClose={() => setModal(false)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>
          <DollarSign size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
          Execução Financeira
        </div>
        <button onClick={() => setModal(true)} style={{ ...S.btn, background: "#1D9E75", color: "#fff" }}>
          <Plus size={14} /> Empenho
        </button>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button style={S.tab(aba === "saldos")} onClick={() => setAba("saldos")}>Saldos por Convênio</button>
        <button style={S.tab(aba === "empenhos")} onClick={() => setAba("empenhos")}>Empenhos</button>
        <button style={S.tab(aba === "restos")} onClick={() => setAba("restos")}>Restos a Pagar</button>
      </div>

      {/* ABA SALDOS */}
      {aba === "saldos" && (
        <>
          {saldoQueries.isLoading && <div style={{ textAlign: "center", padding: 40, color: "#737373" }}>Calculando saldos…</div>}
          {(saldoQueries.data ?? []).map((s) => <SaldoCard key={s.convenio_id} saldo={s} />)}
        </>
      )}

      {/* ABA EMPENHOS */}
      {aba === "empenhos" && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <select
              value={convenioSel ?? ""}
              onChange={(e) => setConvenioSel(e.target.value ? Number(e.target.value) : undefined)}
              style={{ ...S.input, flex: 1, maxWidth: 360 }}
            >
              <option value="">Todos os convênios</option>
              {convenios.map((c) => <option key={c.id} value={c.id}>{c.numero}</option>)}
            </select>
            {empenhos.length > 0 && (
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#737373" }}>
                  Empenhado: <strong>{fmt(totalEmpenhado)}</strong>
                </span>
                <span style={{ fontSize: 12, color: "#737373" }}>
                  Pago: <strong style={{ color: "#059669" }}>{fmt(totalPago)}</strong>
                </span>
              </div>
            )}
          </div>

          {loadEmp && <div style={{ textAlign: "center", padding: 30, color: "#737373" }}>Carregando…</div>}

          {(empenhos as Empenho[]).map((emp) => (
            <div key={emp.id} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Empenho {emp.numero}</span>
                  <span style={{ fontSize: 11, color: "#737373", marginLeft: 10 }}>
                    {new Date(emp.data_empenho).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1d4ed8" }}>{fmt(emp.valor)}</span>
              </div>
              {emp.descricao && <div style={{ fontSize: 12, color: "#404040", marginBottom: 6 }}>{emp.descricao}</div>}
              {emp.credor && <div style={{ fontSize: 11, color: "#737373", marginBottom: 6 }}>Credor: {emp.credor}</div>}
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ fontSize: 11, color: "#737373" }}>
                  Liquidado: <strong style={{ color: "#d97706" }}>{fmt(emp.valor_liquidado)}</strong>
                </div>
                <div style={{ fontSize: 11, color: "#737373" }}>
                  Pago: <strong style={{ color: "#059669" }}>{fmt(emp.valor_pago)}</strong>
                </div>
                <div style={{ fontSize: 11, color: "#737373" }}>
                  Saldo: <strong style={{ color: emp.valor_saldo > 0 ? "#dc2626" : "#059669" }}>{fmt(emp.valor_saldo)}</strong>
                </div>
              </div>
            </div>
          ))}

          {!loadEmp && empenhos.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: "#737373" }}>
              <AlertCircle size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
              <div>Nenhum empenho registrado.</div>
            </div>
          )}
        </>
      )}

      {/* ABA RESTOS A PAGAR */}
      {aba === "restos" && (
        <>
          {(restos as Array<Record<string, number>>).length === 0
            ? <div style={{ textAlign: "center", padding: 40, color: "#737373" }}>Nenhum resto a pagar registrado.</div>
            : (restos as Array<Record<string, number>>).map((r) => (
              <div key={r.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Empenho #{r.empenho_id} — Ano {r.ano_inscricao}</div>
                    <div style={{ fontSize: 11, color: "#737373", marginTop: 4 }}>{r.situacao}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{fmt(r.valor_inscrito)}</div>
                    <div style={{ fontSize: 11, color: "#059669" }}>Saldo: {fmt(r.valor_saldo)}</div>
                  </div>
                </div>
              </div>
            ))
          }
        </>
      )}
    </div>
  );
}
