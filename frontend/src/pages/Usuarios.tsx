// Módulo 13 — Gestão de Usuários e Perfis RBAC
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiUsuarios } from "../lib/api";
import { Users, Plus, Trash2, Check, X, ShieldCheck, Lock } from "lucide-react";

const S = {
  page:  { padding: 20 } as React.CSSProperties,
  card:  { background: "#fff", borderRadius: 8, border: "1px solid #e5e5e3", padding: 16, marginBottom: 14 } as React.CSSProperties,
  title: { fontSize: 14, fontWeight: 600, marginBottom: 12 } as React.CSSProperties,
  input: { border: "1px solid #e5e5e3", borderRadius: 6, padding: "7px 10px", fontSize: 13, width: "100%", boxSizing: "border-box" as const },
  btn:   (cor?: string) => ({ padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, background: cor ?? "#f5f5f3", color: cor ? "#fff" : "#404040", display: "flex", alignItems: "center", gap: 5 }) as React.CSSProperties,
};

const PERFIS = [
  { value: "superadmin",   label: "Super Admin",         cor: "#7f1d1d" },
  { value: "admin",        label: "Administrador",        cor: "#dc2626" },
  { value: "gestor",       label: "Gestor Municipal",     cor: "#1e40af" },
  { value: "coordenador",  label: "Coordenador APS",      cor: "#7c3aed" },
  { value: "enfermeiro",   label: "Enfermeiro(a)",        cor: "#0284c7" },
  { value: "medico",       label: "Médico(a)",            cor: "#0891b2" },
  { value: "tecnico_aps",  label: "Técnico APS",          cor: "#0369a1" },
  { value: "acs",          label: "ACS",                  cor: "#059669" },
  { value: "odontologia",  label: "Odontólogo(a)",        cor: "#0d9488" },
  { value: "farmaceutico", label: "Farmacêutico(a)",      cor: "#d97706" },
  { value: "vigilancia",   label: "Vigilância em Saúde",  cor: "#b45309" },
  { value: "financeiro",   label: "Financeiro",           cor: "#1D9E75" },
  { value: "contabilidade",label: "Contabilidade",        cor: "#166534" },
  { value: "planejamento", label: "Planejamento",         cor: "#065f46" },
  { value: "auditoria",    label: "Auditoria",            cor: "#6b21a8" },
  { value: "prefeito",     label: "Prefeito(a)",          cor: "#9f1239" },
  { value: "conselho",     label: "Conselho de Saúde",    cor: "#854d0e" },
  { value: "consulta",     label: "Apenas Consulta",      cor: "#737373" },
];

const PERMISSOES: Record<string, string[]> = {
  superadmin:   ["Acesso irrestrito — gestão de usuários, todos os módulos, configurações do sistema"],
  admin:        ["Acesso total ao sistema — todos os módulos incluindo gestão de usuários"],
  gestor:       ["Todos os módulos exceto gestão de usuários (exclusivo do Administrador)"],
  coordenador:  ["APS, Qualidade, Parâmetros MS, SISAB, Busca Ativa, ACS, Vigilância, eGestor, Painel de Gestão — SEM acesso a Financeiro/Repasses/CAF/FNS/SIOPS/Contratos"],
  enfermeiro:   ["APS, Componente Qualidade, SISAB, Busca Ativa, Sala de Vacinas, Vigilância, Atenção Domiciliar, eGestor"],
  medico:       ["APS, Componente Qualidade, SISAB, Busca Ativa, Farmácia, Vigilância, Atenção Domiciliar, TeleSaúde"],
  tecnico_aps:  ["APS, SISAB, Busca Ativa, ACS, Inconsistências, Sala de Vacinas, Painel de Gestão, eGestor"],
  acs:          ["Painel do ACS, Busca Ativa, Cadastros, Mapa de Visitas, Monitor Tempo Real"],
  odontologia:  ["APS, Componente Qualidade (Grupo B), Produção SISAB, Painel de Gestão, eGestor"],
  farmaceutico: ["Assistência Farmacêutica, Produção SISAB, Relatório de Produção, eGestor"],
  vigilancia:   ["Vigilância em Saúde, Epidemiologia/SINAN, Sala de Vacinas, SIM/SINASC, CCIH, Câncer"],
  financeiro:   ["Painel Financeiro, FNS/Repasses/CAF, Execução Financeira, SIOPS, Contratos, PPA/LOA, eGestor"],
  contabilidade:["Painel Financeiro, SIOPS, Contratos, PPA/LOA"],
  planejamento: ["Plano Municipal Saúde, Score, Qualidade, Parâmetros MS, POEPS, PPA/LOA, eGestor"],
  auditoria:    ["Visualização completa de todos os módulos exceto Gestão de Usuários — somente leitura"],
  prefeito:     ["Dashboard, Score, Painel Financeiro, Portal do Gestor, eGestor, Qualidade"],
  conselho:     ["Dashboard, Score, Qualidade, Parâmetros MS, Conselho de Saúde, SIM/SINASC"],
  consulta:     ["Apenas Home e Alertas — acesso mínimo"],
};

interface Usuario {
  id: number; nome: string; email: string; perfil: string; ativo: boolean;
  municipio_id: number; ultimo_acesso?: string;
}

const FORM_VAZIO = { nome: "", email: "", perfil: "coordenador", senha: "", cargo: "", username: "" };

export default function Usuarios() {
  const qc = useQueryClient();
  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [perfilSelecionado, setPerfilSelecionado] = useState("");

  const perfilAtual = localStorage.getItem("ersus_perfil") ?? "";
  const podeGerenciar = ["superadmin", "admin"].includes(perfilAtual);

  if (!podeGerenciar) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"60vh", gap:12, color:"#737373" }}>
        <Lock size={40} color="#dc2626"/>
        <div style={{ fontSize:18, fontWeight:700, color:"#1e293b" }}>Acesso Restrito</div>
        <div style={{ fontSize:13, textAlign:"center", maxWidth:380 }}>
          A gestão de usuários é exclusiva do <strong>Administrador</strong>.<br/>
          Solicite ao administrador do sistema para criar ou alterar acessos.
        </div>
      </div>
    );
  }

  const { data: usuarios = [] } = useQuery<Usuario[]>({
    queryKey: ["usuarios"],
    queryFn: apiUsuarios.lista,
  });

  const criar = useMutation({
    mutationFn: (body: typeof form) =>
      api.post("/api/auth/registrar", body).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["usuarios"] }); setCriando(false); setForm(FORM_VAZIO); },
  });

  const desativar = useMutation({
    mutationFn: (id: number) => api.delete(`/api/usuarios/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios"] }),
  });

  const perfilInfo = (p: string) => PERFIS.find((x) => x.value === p) ?? { label: p, cor: "#737373" };

  const usrFiltrados = perfilSelecionado
    ? (usuarios as Usuario[]).filter((u) => u.perfil === perfilSelecionado)
    : (usuarios as Usuario[]);

  return (
    <div style={S.page}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <Users size={16} /> Gestão de Usuários
      </div>

      {/* Resumo RBAC */}
      <div style={{ ...S.card, background: "#f0fdf4", borderColor: "#86efac" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <ShieldCheck size={14} color="#059669" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#166534" }}>Controle de Acesso por Perfil (RBAC)</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {PERFIS.map((p) => {
            const count = (usuarios as Usuario[]).filter((u) => u.perfil === p.value && u.ativo).length;
            return (
              <button
                key={p.value}
                onClick={() => setPerfilSelecionado(perfilSelecionado === p.value ? "" : p.value)}
                style={{ background: perfilSelecionado === p.value ? p.cor : "#fff", color: perfilSelecionado === p.value ? "#fff" : p.cor, border: `1px solid ${p.cor}40`, borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 500 }}
              >
                {p.label} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>
        {perfilSelecionado && PERMISSOES[perfilSelecionado] && (
          <div style={{ marginTop: 10, fontSize: 12, color: "#404040" }}>
            <strong>Permissões do perfil {perfilInfo(perfilSelecionado).label}:</strong>{" "}
            {PERMISSOES[perfilSelecionado].join(" · ")}
          </div>
        )}
      </div>

      {/* Lista de usuários */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={S.title}>Usuários Cadastrados</div>
          <button style={S.btn("#1D9E75")} onClick={() => setCriando(true)}>
            <Plus size={13} /> Novo Usuário
          </button>
        </div>

        {/* Formulário novo usuário */}
        {criando && (
          <div style={{ background: "#f9f9f7", border: "1px solid #e5e5e3", borderRadius: 8, padding: 14, marginBottom: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              {[
                { key: "username", label: "Login (usuário)" },
                { key: "nome",     label: "Nome completo" },
                { key: "email",    label: "E-mail", type: "email" },
                { key: "cargo",    label: "Cargo / Função" },
                { key: "senha",    label: "Senha inicial", type: "password" },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label style={{ fontSize: 11, color: "#737373", display: "block", marginBottom: 3 }}>{label}</label>
                  <input
                    type={type ?? "text"}
                    style={S.input}
                    value={(form as Record<string, string>)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 11, color: "#737373", display: "block", marginBottom: 3 }}>Perfil de Acesso</label>
                <select value={form.perfil} onChange={(e) => setForm({ ...form, perfil: e.target.value })} style={S.input}>
                  {PERFIS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btn("#059669")} onClick={() => criar.mutate(form)}><Check size={13} /> Criar Usuário</button>
              <button style={S.btn()} onClick={() => { setCriando(false); setForm(FORM_VAZIO); }}><X size={13} /> Cancelar</button>
            </div>
          </div>
        )}

        {usrFiltrados.map((u: Usuario) => {
          const p = perfilInfo(u.perfil);
          return (
            <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0ee" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: p.cor + "20", color: p.cor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                    {u.nome.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{u.nome}</span>
                  <span style={{ background: p.cor + "15", color: p.cor, borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 600 }}>
                    {p.label}
                  </span>
                  {!u.ativo && (
                    <span style={{ background: "#f5f5f3", color: "#737373", borderRadius: 4, padding: "1px 6px", fontSize: 10 }}>Inativo</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#737373" }}>
                  {u.email}
                  {u.ultimo_acesso && ` · Último acesso: ${new Date(u.ultimo_acesso).toLocaleDateString("pt-BR")}`}
                </div>
              </div>
              {u.ativo && (
                <button
                  onClick={() => { if (window.confirm(`Desativar usuário "${u.nome}"?`)) desativar.mutate(u.id); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 4 }}
                  title="Desativar usuário"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          );
        })}

        {usrFiltrados.length === 0 && (
          <div style={{ textAlign: "center", padding: 28, color: "#737373", fontSize: 13 }}>
            Nenhum usuário {perfilSelecionado ? `com perfil "${perfilInfo(perfilSelecionado).label}"` : "cadastrado"}.
          </div>
        )}
      </div>
    </div>
  );
}
