// Módulo 1 — Cadastro do Município e Contas Bancárias
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { MapPin, Plus, Trash2, Edit2, Check, X } from "lucide-react";

const S = {
  page:  { padding: 20 } as React.CSSProperties,
  card:  { background: "#fff", borderRadius: 8, border: "1px solid #e5e5e3", padding: 16, marginBottom: 14 } as React.CSSProperties,
  title: { fontSize: 14, fontWeight: 600, marginBottom: 12 } as React.CSSProperties,
  input: { border: "1px solid #e5e5e3", borderRadius: 6, padding: "7px 10px", fontSize: 13, width: "100%", boxSizing: "border-box" as const },
  btn:   (cor?: string) => ({ padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, background: cor ?? "#f5f5f3", color: cor ? "#fff" : "#404040", display: "flex", alignItems: "center", gap: 5 }) as React.CSSProperties,
};

interface Municipio {
  id: number; nome: string; uf: string; codigo_ibge: string; cnpj_fundo: string;
  secretario: string; prefeito: string; gestor_fundo: string; telefone: string;
  email: string; populacao: number;
}
interface ContaBancaria {
  id: number; municipio_id: number; banco: string; agencia: string; conta: string;
  digito: string; tipo: string; fonte_recurso: string; ativa: boolean;
}

const CAMPOS_MUNICIPIO: { key: keyof Municipio; label: string; type?: string }[] = [
  { key: "nome",         label: "Nome do Município" },
  { key: "uf",           label: "UF" },
  { key: "codigo_ibge",  label: "Código IBGE" },
  { key: "cnpj_fundo",  label: "CNPJ do Fundo" },
  { key: "secretario",   label: "Secretário de Saúde" },
  { key: "prefeito",     label: "Prefeito" },
  { key: "gestor_fundo", label: "Gestor do Fundo" },
  { key: "telefone",     label: "Telefone" },
  { key: "email",        label: "E-mail", type: "email" },
  { key: "populacao",    label: "População", type: "number" },
];

export default function Municipio() {
  const qc = useQueryClient();
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<Partial<Municipio>>({});
  const [novaConta, setNovaConta] = useState(false);
  const [conta, setConta] = useState({ banco: "", agencia: "", conta: "", digito: "", tipo: "corrente", fonte_recurso: "" });

  const { data: mun } = useQuery<Municipio>({
    queryKey: ["municipio"],
    queryFn: () => api.get("/api/municipio/1").then((r) => r.data),
  });
  const { data: contas = [] } = useQuery<ContaBancaria[]>({
    queryKey: ["contas-bancarias"],
    queryFn: () => api.get("/api/municipio/1/contas").then((r) => r.data),
  });

  const salvarMun = useMutation({
    mutationFn: (body: Partial<Municipio>) => api.put("/api/municipio/1", body).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["municipio"] }); setEditando(false); },
  });

  const criarConta = useMutation({
    mutationFn: (body: typeof conta) => api.post("/api/municipio/1/contas", body).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contas-bancarias"] }); setNovaConta(false); setConta({ banco: "", agencia: "", conta: "", digito: "", tipo: "corrente", fonte_recurso: "" }); },
  });

  const excluirConta = useMutation({
    mutationFn: (id: number) => api.delete(`/api/municipio/1/contas/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contas-bancarias"] }),
  });

  const iniciarEdicao = () => {
    if (mun) setForm({ ...mun });
    setEditando(true);
  };

  return (
    <div style={S.page}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <MapPin size={16} /> Cadastro do Município
      </div>

      {/* Dados do Município */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={S.title}>Dados Cadastrais — FMS</div>
          {!editando
            ? <button style={S.btn("#1D9E75")} onClick={iniciarEdicao}><Edit2 size={13} /> Editar</button>
            : <div style={{ display: "flex", gap: 8 }}>
                <button style={S.btn("#059669")} onClick={() => salvarMun.mutate(form)}><Check size={13} /> Salvar</button>
                <button style={S.btn()} onClick={() => setEditando(false)}><X size={13} /> Cancelar</button>
              </div>
          }
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {CAMPOS_MUNICIPIO.map(({ key, label, type }) => (
            <div key={key}>
              <label style={{ fontSize: 11, color: "#737373", display: "block", marginBottom: 3 }}>{label}</label>
              {editando
                ? <input
                    type={type ?? "text"}
                    value={String(form[key] ?? "")}
                    onChange={(e) => setForm({ ...form, [key]: type === "number" ? Number(e.target.value) : e.target.value })}
                    style={S.input}
                  />
                : <div style={{ fontSize: 13, padding: "7px 0", borderBottom: "1px solid #f5f5f3" }}>
                    {mun?.[key] ?? "—"}
                  </div>
              }
            </div>
          ))}
        </div>
      </div>

      {/* Contas Bancárias */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={S.title}>Contas Bancárias do Fundo</div>
          <button style={S.btn("#1D9E75")} onClick={() => setNovaConta(true)}>
            <Plus size={13} /> Nova Conta
          </button>
        </div>

        {novaConta && (
          <div style={{ background: "#f9f9f7", border: "1px solid #e5e5e3", borderRadius: 8, padding: 14, marginBottom: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              {[
                { key: "banco", label: "Banco" },
                { key: "agencia", label: "Agência" },
                { key: "conta", label: "Conta" },
                { key: "digito", label: "Dígito" },
                { key: "fonte_recurso", label: "Fonte de Recurso" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label style={{ fontSize: 11, color: "#737373", display: "block", marginBottom: 3 }}>{label}</label>
                  <input
                    style={S.input}
                    value={(conta as Record<string, string>)[key]}
                    onChange={(e) => setConta({ ...conta, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 11, color: "#737373", display: "block", marginBottom: 3 }}>Tipo</label>
                <select value={conta.tipo} onChange={(e) => setConta({ ...conta, tipo: e.target.value })} style={S.input}>
                  <option value="corrente">Corrente</option>
                  <option value="poupanca">Poupança</option>
                  <option value="aplicacao">Aplicação</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btn("#059669")} onClick={() => criarConta.mutate(conta)}><Check size={13} /> Salvar Conta</button>
              <button style={S.btn()} onClick={() => setNovaConta(false)}><X size={13} /> Cancelar</button>
            </div>
          </div>
        )}

        {(contas as ContaBancaria[]).map((c) => (
          <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0ee" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                {c.banco} · Ag. {c.agencia} · Conta {c.conta}-{c.digito}
              </div>
              <div style={{ fontSize: 11, color: "#737373", marginTop: 2 }}>
                {c.tipo} · {c.fonte_recurso}
                <span style={{ marginLeft: 8, background: c.ativa ? "#f0fdf4" : "#f5f5f3", color: c.ativa ? "#059669" : "#737373", borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 600 }}>
                  {c.ativa ? "Ativa" : "Inativa"}
                </span>
              </div>
            </div>
            <button onClick={() => { if (window.confirm("Excluir esta conta?")) excluirConta.mutate(c.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 4 }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {contas.length === 0 && !novaConta && (
          <div style={{ textAlign: "center", padding: 24, color: "#737373", fontSize: 13 }}>
            Nenhuma conta bancária cadastrada.
          </div>
        )}
      </div>
    </div>
  );
}
