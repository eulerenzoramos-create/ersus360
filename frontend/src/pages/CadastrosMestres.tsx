// Fase 3 — Cadastros Mestres
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiCadastros } from "../lib/api";
import { Users, Building2, UserCheck, Pill, Truck, LayoutGrid, Stethoscope } from "lucide-react";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

const API = import.meta.env.VITE_API_URL ?? "";

const S = {
  page:  { padding: 20 } as React.CSSProperties,
  card:  { background: "#fff", borderRadius: 8, border: "1px solid #e5e5e3", padding: 16, marginBottom: 14 } as React.CSSProperties,
  tab:   (ativo: boolean) => ({ padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: ativo ? 600 : 400, background: ativo ? "#1565C0" : "#f5f5f3", color: ativo ? "#fff" : "#404040", display: "flex", alignItems: "center", gap: 6 } as React.CSSProperties),
  badge: (cor: string) => ({ background: cor + "18", color: cor, borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 600 } as React.CSSProperties),
};

const VINCULOS: Record<string, string> = {
  estatutario: "Estatutário", clt: "CLT", temporario: "Temporário",
  terceirizado: "Terceirizado", residente: "Residente", estagiario: "Estagiário",
};
const COR_VINCULO: Record<string, string> = {
  estatutario: "#059669", clt: "#0284c7", temporario: "#d97706",
  terceirizado: "#7c3aed", residente: "#0891b2", estagiario: "#6b7280",
};
const COR_RENAME: Record<string, string> = {
  basico: "#059669", especializado: "#7c3aed", estrategico: "#dc2626", nao_rename: "#6b7280",
};
const LABEL_RENAME: Record<string, string> = {
  basico: "Básico", especializado: "Especializado", estrategico: "Estratégico", nao_rename: "Fora RENAME",
};
const COR_EQUIPE: Record<string, string> = {
  ESF: "#1565C0", eSFR: "#0891b2", eSB: "#059669", eMulti: "#7c3aed", eCR: "#dc2626",
};

type Aba = "resumo" | "profissionais" | "unidades" | "equipes" | "acs" | "medicamentos" | "fornecedores";

export default function CadastrosMestres() { 
  const [aba, setAba] = useState<Aba>("resumo");

  const { data: resumo, isLoading } = useQuery({ queryKey: ["cadastros-resumo"],   queryFn: apiCadastros.resumo });
  const { data: profissionais = [] } = useQuery({ queryKey: ["profissionais"],     queryFn: apiCadastros.profissionais, enabled: aba === "profissionais" });
  const { data: unidades = [] }     = useQuery({ queryKey: ["unidades"],           queryFn: apiCadastros.unidades,      enabled: aba === "unidades" });
  const { data: equipes = [] }      = useQuery({ queryKey: ["equipes"],            queryFn: apiCadastros.equipes,       enabled: aba === "equipes" });
  const { data: acs = [] }          = useQuery({ queryKey: ["acs"],                queryFn: apiCadastros.acs,           enabled: aba === "acs" });
  const { data: medicamentos = [] } = useQuery({ queryKey: ["medicamentos"],       queryFn: apiCadastros.medicamentos,  enabled: aba === "medicamentos" });
  const { data: fornecedores = [] } = useQuery({ queryKey: ["fornecedores"],       queryFn: apiCadastros.fornecedores,  enabled: aba === "fornecedores" });

  const ABAS: { id: Aba; label: string; icon: React.ReactNode }[] = [
    { id: "resumo",         label: "Resumo",        icon: <LayoutGrid size={13}/> },
    { id: "profissionais",  label: "Profissionais", icon: <Stethoscope size={13}/> },
    { id: "unidades",       label: "Unidades",      icon: <Building2 size={13}/> },
    { id: "equipes",        label: "Equipes",       icon: <Users size={13}/> },
    { id: "acs",            label: "ACS",           icon: <UserCheck size={13}/> },
    { id: "medicamentos",   label: "Medicamentos",  icon: <Pill size={13}/> },
    { id: "fornecedores",   label: "Fornecedores",  icon: <Truck size={13}/> },
  ];

  if (!isLoading && !resumo) return (
    <div style={{ padding: 24 }}>
      <NaoDisponivelBanner
        titulo="CadastrosMestres indisponivel"
        nota="Dados nao disponiveis — integracao pendente de configuracao no Railway."
      />
    </div>
  );

  return (
    <div style={S.page}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Cadastros Mestres</div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {ABAS.map(a => (
          <button key={a.id} style={S.tab(aba === a.id)} onClick={() => setAba(a.id)}>
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      {/* ── RESUMO ── */}
      {aba === "resumo" && resumo && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
            {[
              { label: "Profissionais", valor: resumo.profissionais_ativos, cor: "#1565C0", icon: <Stethoscope size={16}/> },
              { label: "Unidades de Saúde", valor: resumo.unidades_ativas, cor: "#059669", icon: <Building2 size={16}/> },
              { label: "Equipes ESF/eSB", valor: resumo.equipes_ativas, cor: "#7c3aed", icon: <Users size={16}/> },
              { label: "ACS Ativos", valor: resumo.acs_ativos, cor: "#0891b2", icon: <UserCheck size={16}/> },
              { label: "Famílias Cadastradas", valor: resumo.familias_cadastradas?.toLocaleString("pt-BR"), cor: "#d97706", icon: <Users size={16}/> },
              { label: "Medicamentos", valor: resumo.medicamentos_ativos, cor: "#dc2626", icon: <Pill size={16}/> },
              { label: "Fornecedores", valor: resumo.fornecedores_ativos, cor: "#0284c7", icon: <Truck size={16}/> },
            ].map(item => (
              <div key={item.label} style={{ ...S.card, marginBottom: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: item.cor, marginBottom: 6 }}>{item.icon}<span style={{ fontSize: 11, color: "#737373" }}>{item.label}</span></div>
                <div style={{ fontSize: 26, fontWeight: 700, color: item.cor }}>{item.valor}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#9e9e9e", textAlign: "center" }}>
            Fonte: dados de referência Apuí/AM (IBGE {resumo.ibge}) · Sincronize com CNES para dados em tempo real
          </div>
        </>
      )}

      {/* ── PROFISSIONAIS ── */}
      {aba === "profissionais" && (
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Profissionais de Saúde — {(profissionais as any[]).length} registros</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ borderBottom: "2px solid #e4e7ec" }}>
              {["Nome", "CBO / Função", "Vínculo", "Carga Hor.", "Unidade", "Equipe"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "6px 8px", color: "#737373", fontWeight: 600 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {(profissionais as any[]).map((p: any) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f9f9f7" }}>
                  <td style={{ padding: "8px" }}><div style={{ fontWeight: 500 }}>{p.nome}</div><div style={{ fontSize: 10, color: "#9e9e9e" }}>CNS: {p.cns}</div></td>
                  <td style={{ padding: "8px" }}><div>{p.cbo_descricao}</div><div style={{ fontSize: 10, color: "#9e9e9e" }}>CBO {p.cbo}</div></td>
                  <td style={{ padding: "8px" }}><span style={S.badge(COR_VINCULO[p.vinculo] ?? "#6b7280")}>{VINCULOS[p.vinculo] ?? p.vinculo}</span></td>
                  <td style={{ padding: "8px" }}>{p.carga_horaria}h</td>
                  <td style={{ padding: "8px", fontSize: 11 }}>{p.unidade_nome}</td>
                  <td style={{ padding: "8px", fontSize: 11 }}>{p.equipe_nome ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── UNIDADES ── */}
      {aba === "unidades" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {(unidades as any[]).map((u: any) => (
            <div key={u.id} style={{ ...S.card, marginBottom: 0 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{u.nome}</div>
              <div style={{ fontSize: 11, color: "#0284c7", marginBottom: 6 }}>CNES: {u.cnes} · {u.tipo}</div>
              <div style={{ fontSize: 12, color: "#555" }}>{u.endereco}</div>
              {u.telefone && <div style={{ fontSize: 11, color: "#737373", marginTop: 4 }}>📞 {u.telefone}</div>}
              <div style={{ marginTop: 8 }}><span style={S.badge(u.ativa ? "#059669" : "#737373")}>{u.ativa ? "Ativa" : "Inativa"}</span></div>
            </div>
          ))}
        </div>
      )}

      {/* ── EQUIPES ── */}
      {aba === "equipes" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {(equipes as any[]).map((e: any) => (
            <div key={e.id} style={{ ...S.card, marginBottom: 0, borderLeft: `4px solid ${COR_EQUIPE[e.tipo] ?? "#1565C0"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontWeight: 600 }}>{e.nome}</div>
                <span style={S.badge(COR_EQUIPE[e.tipo] ?? "#1565C0")}>{e.tipo}</span>
              </div>
              <div style={{ fontSize: 11, color: "#737373", marginTop: 4 }}>INE: {e.ine}</div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{e.unidade_nome}</div>
              {e.num_familias && (
                <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11 }}>
                  <span><b>{e.num_microareas}</b> microáreas</span>
                  <span><b>{e.num_familias?.toLocaleString("pt-BR")}</b> famílias</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── ACS ── */}
      {aba === "acs" && (
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Agentes Comunitários de Saúde — {(acs as any[]).length} registros</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ borderBottom: "2px solid #e4e7ec" }}>
              {["Nome", "Microárea", "Equipe", "Famílias", "Pessoas"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "6px 8px", color: "#737373", fontWeight: 600 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {(acs as any[]).map((a: any) => (
                <tr key={a.id} style={{ borderBottom: "1px solid #f9f9f7" }}>
                  <td style={{ padding: "8px", fontWeight: 500 }}>{a.nome}</td>
                  <td style={{ padding: "8px" }}><span style={{ background: "#eff6ff", color: "#1565C0", borderRadius: 4, padding: "1px 8px", fontWeight: 600 }}>MA {a.microarea}</span></td>
                  <td style={{ padding: "8px", fontSize: 11 }}>{a.equipe_nome}</td>
                  <td style={{ padding: "8px", fontWeight: 600 }}>{a.num_familias}</td>
                  <td style={{ padding: "8px" }}>{a.num_pessoas}</td>
                </tr>
              ))}
              <tr style={{ borderTop: "2px solid #f0f0ee", fontWeight: 700 }}>
                <td colSpan={3} style={{ padding: "8px", color: "#737373" }}>Total</td>
                <td style={{ padding: "8px" }}>{(acs as any[]).reduce((s: number, a: any) => s + (a.num_familias ?? 0), 0).toLocaleString("pt-BR")}</td>
                <td style={{ padding: "8px" }}>{(acs as any[]).reduce((s: number, a: any) => s + (a.num_pessoas ?? 0), 0).toLocaleString("pt-BR")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── MEDICAMENTOS ── */}
      {aba === "medicamentos" && (
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Medicamentos — {(medicamentos as any[]).length} registros</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ borderBottom: "2px solid #e4e7ec" }}>
              {["DCB", "Apresentação", "Concentração", "RENAME", "Controlado"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "6px 8px", color: "#737373", fontWeight: 600 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {(medicamentos as any[]).map((m: any) => (
                <tr key={m.id} style={{ borderBottom: "1px solid #f9f9f7" }}>
                  <td style={{ padding: "8px" }}><div style={{ fontWeight: 500 }}>{m.dcb}</div>{m.nome_comercial && <div style={{ fontSize: 10, color: "#9e9e9e" }}>{m.nome_comercial}</div>}</td>
                  <td style={{ padding: "8px" }}>{m.apresentacao}</td>
                  <td style={{ padding: "8px" }}>{m.concentracao}</td>
                  <td style={{ padding: "8px" }}><span style={S.badge(COR_RENAME[m.componente_rename] ?? "#6b7280")}>{LABEL_RENAME[m.componente_rename] ?? m.componente_rename}</span></td>
                  <td style={{ padding: "8px" }}>{m.controlado ? <span style={S.badge("#dc2626")}>Controlado</span> : <span style={{ color: "#9e9e9e", fontSize: 11 }}>—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── FORNECEDORES ── */}
      {aba === "fornecedores" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {(fornecedores as any[]).map((f: any) => (
            <div key={f.id} style={{ ...S.card, marginBottom: 0 }}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{f.razao_social}</div>
              {f.nome_fantasia && <div style={{ fontSize: 11, color: "#0284c7" }}>{f.nome_fantasia}</div>}
              <div style={{ fontSize: 11, color: "#737373", marginTop: 4 }}>CNPJ: {f.cnpj}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                <span style={S.badge("#1565C0")}>{f.segmento}</span>
                <span style={S.badge(f.ativo ? "#059669" : "#737373")}>{f.ativo ? "Ativo" : "Inativo"}</span>
              </div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 6 }}>📧 {f.email}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
