// src/pages/Marketplace.tsx — Marketplace e Academia ERSUS 360
import { useState } from "react";

type Parceiro = {
  nome: string; categoria: string; descricao: string;
  tipo: "gratuito" | "pago"; logo: string; status: "disponivel" | "em_breve";
};

type Trilha = {
  id: number; titulo: string; descricao: string; duracao: string;
  modulos: number; nivel: string; plano_minimo: string; certificado: boolean;
};

const PARCEIROS: Parceiro[] = [
  { nome: "e-SUS PEC Integrado", categoria: "Integrações de sistema", descricao: "Sincronização bidirecional com o e-SUS PEC da equipe de saúde.", tipo: "gratuito", logo: "🏥", status: "disponivel" },
  { nome: "CNES Conector", categoria: "Integrações de sistema", descricao: "Atualização automática de cadastros via API pública do DATASUS.", tipo: "gratuito", logo: "📋", status: "disponivel" },
  { nome: "TeleMed Conecta", categoria: "Telemed", descricao: "Teleconsultas integradas ao prontuário do e-SUS PEC.", tipo: "pago", logo: "💻", status: "disponivel" },
  { nome: "Laudo Digital SUS", categoria: "Laudos e diagnóstico", descricao: "Telediagnóstico de ECG e radiologia integrado ao ERSUS.", tipo: "pago", logo: "🩺", status: "disponivel" },
  { nome: "Folha RH Municipal", categoria: "RH e Folha", descricao: "Integração com sistemas de folha de pagamento da prefeitura.", tipo: "pago", logo: "💰", status: "em_breve" },
  { nome: "Farmácia Controlada", categoria: "Farmácia", descricao: "Módulo de dispensação de psicotrópicos com SCTC integrado.", tipo: "pago", logo: "💊", status: "em_breve" },
];

const TRILHAS: Trilha[] = [
  {
    id: 1, titulo: "Gestão em Saúde para Iniciantes",
    descricao: "Como funciona o SUS no município, financiamento PAB, Novo Financiamento APS e RDQA.",
    duracao: "8 horas", modulos: 4, nivel: "Iniciante", plano_minimo: "Bronze", certificado: true,
  },
  {
    id: 2, titulo: "Atenção Primária na Prática",
    descricao: "e-SUS PEC básico, ficha de cadastro, visita domiciliar, SISAB e inconsistências.",
    duracao: "12 horas", modulos: 4, nivel: "Intermediário", plano_minimo: "Prata", certificado: true,
  },
  {
    id: 3, titulo: "Financeiro Municipal de Saúde",
    descricao: "Blocos de financiamento FNS, SIOPS na prática, convênios e mínimo constitucional.",
    duracao: "10 horas", modulos: 4, nivel: "Intermediário", plano_minimo: "Prata", certificado: true,
  },
  {
    id: 4, titulo: "Gestor ERSUS 360 Avançado",
    descricao: "Score ERSUS, BI e análise de dados, LGPD na saúde, configuração completa do sistema.",
    duracao: "16 horas", modulos: 4, nivel: "Avançado", plano_minimo: "Ouro", certificado: true,
  },
];

const PLANO_COR: Record<string, string> = { Bronze: "#cd7f32", Prata: "#9e9e9e", Ouro: "#f9a825", Diamante: "#42a5f5" };

function PlanoTag({ plano }: { plano: string }) {
  const cor = PLANO_COR[plano] ?? "#616161";
  return <span style={{ background: `${cor}20`, color: cor, padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, border: `1px solid ${cor}40` }}>{plano}</span>;
}

export default function Marketplace() {
  const [aba, setAba] = useState<"marketplace" | "academia">("marketplace");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
  const [trilhaSelecionada, setTrilhaSelecionada] = useState<number | null>(null);

  const categorias = ["Todas", ...Array.from(new Set(PARCEIROS.map(p => p.categoria)))];
  const parceirosFiltrados = categoriaFiltro === "Todas" ? PARCEIROS : PARCEIROS.filter(p => p.categoria === categoriaFiltro);

  const trilha = TRILHAS.find(t => t.id === trilhaSelecionada);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1565c0" }}>Marketplace & Academia ERSUS</h2>
        <p style={{ margin: "4px 0 0", color: "#666", fontSize: 13 }}>Integrações de parceiros e capacitação em gestão municipal de saúde</p>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", gap: 2, marginBottom: 20, borderBottom: "2px solid #e0e0e0" }}>
        {[{ key: "marketplace" as const, label: "🛒 Marketplace" }, { key: "academia" as const, label: "🎓 Academia ERSUS" }].map(a => (
          <button key={a.key} onClick={() => setAba(a.key)}
            style={{ padding: "9px 20px", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600,
              background: aba === a.key ? "#1565c0" : "transparent",
              color: aba === a.key ? "#fff" : "#555",
              borderRadius: "6px 6px 0 0",
            }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* ── MARKETPLACE ─────────────────────────────────────────────────────── */}
      {aba === "marketplace" && (
        <div>
          {/* Filtros */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {categorias.map(c => (
              <button key={c} onClick={() => setCategoriaFiltro(c)}
                style={{ padding: "5px 14px", border: `1px solid ${categoriaFiltro === c ? "#1565c0" : "#ddd"}`, borderRadius: 20, fontSize: 12, cursor: "pointer",
                  background: categoriaFiltro === c ? "#1565c0" : "#fff",
                  color: categoriaFiltro === c ? "#fff" : "#555", fontWeight: categoriaFiltro === c ? 700 : 400,
                }}>
                {c}
              </button>
            ))}
          </div>

          {/* Grid de parceiros */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {parceirosFiltrados.map(p => (
              <div key={p.nome} style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", padding: 18, opacity: p.status === "em_breve" ? 0.7 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ fontSize: 28 }}>{p.logo}</div>
                  <div style={{ display: "flex", gap: 6, flexDirection: "column", alignItems: "flex-end" }}>
                    <span style={{ background: p.tipo === "gratuito" ? "#e8f5e9" : "#e3f2fd", color: p.tipo === "gratuito" ? "#2e7d32" : "#1565c0", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                      {p.tipo === "gratuito" ? "GRATUITO" : "PAGO"}
                    </span>
                    {p.status === "em_breve" && (
                      <span style={{ background: "#fff3e0", color: "#e65100", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>EM BREVE</span>
                    )}
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 4 }}>{p.nome}</div>
                <div style={{ fontSize: 11, color: "#999", marginBottom: 8 }}>{p.categoria}</div>
                <div style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>{p.descricao}</div>
                <button disabled={p.status === "em_breve"}
                  style={{ marginTop: 14, width: "100%", padding: "8px", background: p.status === "em_breve" ? "#f5f5f5" : "#1565c0", color: p.status === "em_breve" ? "#bbb" : "#fff", border: "none", borderRadius: 6, cursor: p.status === "em_breve" ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}>
                  {p.status === "em_breve" ? "Em breve" : "Ver integração"}
                </button>
              </div>
            ))}
          </div>

          {/* CTA parceiro */}
          <div style={{ marginTop: 24, background: "linear-gradient(135deg, #1565c0, #1976d2)", borderRadius: 10, padding: "20px 24px", color: "#fff" }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Quer publicar sua integração no Marketplace ERSUS?</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 14 }}>Parceiros certificados têm acesso a todos os municípios usuários do ERSUS 360. Processo: cadastro → documentação API → homologação → publicação.</div>
            <button style={{ padding: "8px 20px", background: "rgba(255,255,255,.2)", border: "1px solid rgba(255,255,255,.4)", borderRadius: 6, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              Solicitar parceria
            </button>
          </div>
        </div>
      )}

      {/* ── ACADEMIA ────────────────────────────────────────────────────────── */}
      {aba === "academia" && !trilhaSelecionada && (
        <div>
          <div style={{ background: "#e8f5e9", borderRadius: 8, padding: "14px 18px", marginBottom: 20, fontSize: 13, color: "#2e7d32" }}>
            <strong>Plano atual: Prata</strong> — Acesso às Trilhas 1 e 2 com certificados. Faça upgrade para Ouro e acesse todas as 4 trilhas.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {TRILHAS.map(t => {
              const bloqueado = t.plano_minimo === "Ouro" || t.plano_minimo === "Diamante";
              return (
                <div key={t.id} style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", padding: 20, opacity: bloqueado ? 0.6 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <PlanoTag plano={t.plano_minimo} />
                    {bloqueado && <span style={{ fontSize: 16 }}>🔒</span>}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#333", marginBottom: 6 }}>{t.titulo}</div>
                  <div style={{ fontSize: 13, color: "#666", lineHeight: 1.5, marginBottom: 12 }}>{t.descricao}</div>
                  <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#888", marginBottom: 14 }}>
                    <span>⏱ {t.duracao}</span>
                    <span>📚 {t.modulos} módulos</span>
                    <span>📊 {t.nivel}</span>
                    {t.certificado && <span>🏆 Certificado</span>}
                  </div>
                  <button onClick={() => !bloqueado && setTrilhaSelecionada(t.id)} disabled={bloqueado}
                    style={{ width: "100%", padding: "9px", background: bloqueado ? "#f5f5f5" : "#1565c0", color: bloqueado ? "#bbb" : "#fff", border: "none", borderRadius: 6, cursor: bloqueado ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}>
                    {bloqueado ? `Requer plano ${t.plano_minimo}` : "Iniciar trilha"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Certificações */}
          <div style={{ marginTop: 24, background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#333", marginBottom: 14 }}>Certificações ERSUS</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
              {[
                { titulo: "Gestor Iniciante", requisito: "Trilha 1 + aprovação 70%", plano: "Bronze" },
                { titulo: "APS Certificado", requisito: "Trilhas 1 + 2", plano: "Prata" },
                { titulo: "Financeiro Certificado", requisito: "Trilha 3", plano: "Prata" },
                { titulo: "Especialista ERSUS 360", requisito: "Todas as 4 trilhas + avaliação prática", plano: "Ouro" },
              ].map(c => (
                <div key={c.titulo} style={{ background: "#f9f9f9", borderRadius: 6, padding: 14, border: "1px solid #eee" }}>
                  <div style={{ marginBottom: 6 }}><PlanoTag plano={c.plano} /></div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#333" }}>🏆 {c.titulo}</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{c.requisito}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detalhe da trilha */}
      {aba === "academia" && trilhaSelecionada && trilha && (
        <div>
          <button onClick={() => setTrilhaSelecionada(null)} style={{ marginBottom: 16, background: "none", border: "none", cursor: "pointer", color: "#1565c0", fontSize: 13, fontWeight: 600 }}>
            ← Voltar às trilhas
          </button>
          <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <PlanoTag plano={trilha.plano_minimo} />
                <div style={{ fontWeight: 800, fontSize: 18, color: "#333", marginTop: 8 }}>{trilha.titulo}</div>
                <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>{trilha.descricao}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 20 }}>
                <div style={{ fontSize: 12, color: "#888" }}>{trilha.duracao} · {trilha.modulos} módulos</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{trilha.nivel} · {trilha.certificado ? "Com certificado" : "Sem certificado"}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Array.from({ length: trilha.modulos }).map((_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: i === 0 ? "#e3f2fd" : "#f9f9f9", borderRadius: 6, border: `1px solid ${i === 0 ? "#90caf9" : "#eee"}` }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: i === 0 ? "#1565c0" : "#e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", color: i === 0 ? "#fff" : "#777", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {i === 0 ? "▶" : i + 1}
                  </div>
                  <div style={{ fontSize: 13, color: "#333" }}>Módulo {i + 1}</div>
                  {i === 0 && <span style={{ marginLeft: "auto", fontSize: 11, color: "#1565c0", fontWeight: 700 }}>PRÓXIMO</span>}
                </div>
              ))}
            </div>
            <button style={{ marginTop: 18, padding: "11px 28px", background: "#1565c0", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
              Continuar trilha
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
