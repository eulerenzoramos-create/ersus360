// src/pages/MatrizNormativaAPS.tsx — Matriz Normativa da APS (dados reais: /api/aps-simulador/matriz-normativa)
// Por modalidade: cadeia normativa, critérios com fundamentação oficial (artigo + link + conferência no texto
// oficial), financiamento e a fonte do dado que valida cada critério. Valores vêm dos parâmetros versionados.
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

type Fund = { norma: string; dispositivo: string; resumo: string; url: string; chave: string;
  conferido: boolean | null; conferido_em: string; detalhe_conferencia: string };
type Criterio = { id: string; criterio: string; tipo: string; fonte_dado: string; exigencia: string;
  valores: Record<string, { valor: number | null; vigencia_inicio: string | null; origem: string }>;
  categorias: { id: string; nome: string; cbo: string[] }[]; fundamentacao: Fund };
type Norma = { norma: string; papel: string; descricao: string; url: string | null; referencia: string | null };
type Modalidade = { id: string; nome: string; tipo_cnes: string | null; cadeia: Norma[]; criterios: Criterio[];
  financiamento: { chave: string; valor: number | null; valor_texto: string | null; norma: string }[];
  pendencias: string[] };
type Matriz = { competencia: string; modalidades: Modalidade[]; monitoramento: string;
  categorias_cbo: { fonte: string; emulti_anexo6: Record<string, string> } };

const COR = { azul: "#1d4ed8", navy: "#0f2a4a", borda: "#e2e8f0", fundo: "#f8fafc", muted: "#64748b",
  verde: "#15803d", verdeLt: "#dcfce7", ambar: "#b45309", ambarLt: "#fef3c7", vermelho: "#b91c1c" };
const PAPEL: Record<string, { rot: string; cor: string }> = {
  origem: { rot: "Origem", cor: "#7c3aed" }, alteracao: { rot: "Alteração", cor: COR.ambar },
  revogacao: { rot: "Revogação", cor: COR.vermelho }, financiamento: { rot: "Financiamento", cor: COR.azul },
  vigente: { rot: "Norma vigente", cor: COR.verde },
};
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function compAtual() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function MatrizNormativaAPS() {
  const [comp, setComp] = useState(compAtual());
  const [sel, setSel] = useState("eSF");
  const q = useQuery<Matriz>({
    queryKey: ["matriz-normativa", comp],
    queryFn: () => api.get(`/api/aps-simulador/matriz-normativa?competencia=${comp}`).then(r => r.data),
  });
  const m = q.data?.modalidades.find(x => x.id === sel);

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ background: COR.navy, color: "#fff", borderRadius: 10, padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Matriz Normativa da APS</div>
        <div style={{ fontSize: 13, opacity: .85, marginTop: 4 }}>
          Composição, CBO, carga horária, vínculos e suspensão por modalidade — fundamentação oficial com artigo,
          vigência e link. Base para as validações do Monitoramento CNES.
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
        <label style={{ fontSize: 14, color: COR.muted }}>Competência
          <input value={`${comp.slice(0, 4)}-${comp.slice(4)}`} type="month"
            onChange={e => e.target.value && setComp(e.target.value.replace("-", ""))}
            style={{ marginLeft: 8, padding: "6px 8px", border: `1px solid ${COR.borda}`, borderRadius: 6 }} />
        </label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(q.data?.modalidades ?? []).map(x => (
            <button key={x.id} onClick={() => setSel(x.id)}
              style={{ padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14,
                border: `1px solid ${sel === x.id ? COR.azul : COR.borda}`,
                background: sel === x.id ? COR.azul : "#fff", color: sel === x.id ? "#fff" : COR.navy }}>
              {x.id}
            </button>
          ))}
        </div>
      </div>

      {q.isLoading && <div style={{ color: COR.muted }}>Carregando a matriz…</div>}
      {q.isError && <div style={{ color: COR.vermelho }}>Não foi possível carregar a matriz normativa.</div>}

      {m && (
        <>
          <h2 style={{ fontSize: 18, color: COR.navy, margin: "8px 0 4px" }}>{m.nome}</h2>
          <div style={{ fontSize: 13, color: COR.muted, marginBottom: 12 }}>
            {m.tipo_cnes ? `Tipo de equipe no CNES: ${m.tipo_cnes}` : "Tipo de equipe no CNES: identificado pelo e-Gestor"}
          </div>

          <Secao titulo="Cadeia normativa">
            <div style={{ display: "grid", gap: 8 }}>
              {m.cadeia.map((n, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                  <span style={{ minWidth: 118, fontSize: 12, fontWeight: 700, color: PAPEL[n.papel]?.cor }}>
                    {PAPEL[n.papel]?.rot ?? n.papel}</span>
                  <span style={{ fontWeight: 600 }}>
                    {n.url ? <a href={n.url} target="_blank" rel="noreferrer" style={{ color: COR.azul }}>{n.norma}</a> : n.norma}
                  </span>
                  <span style={{ color: COR.muted, fontSize: 14 }}>{n.descricao}{n.referencia ? ` (${n.referencia})` : ""}</span>
                </div>
              ))}
            </div>
          </Secao>

          <Secao titulo="Critérios exigidos">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead><tr style={{ textAlign: "left", color: COR.muted, fontSize: 12 }}>
                  <th style={th}>Critério</th><th style={th}>Exigência do MS</th><th style={th}>Fundamentação</th>
                  <th style={th}>Texto oficial</th><th style={th}>Dado que valida</th>
                </tr></thead>
                <tbody>{m.criterios.map(c => (
                  <tr key={c.id} style={{ borderTop: `1px solid ${COR.borda}`, verticalAlign: "top" }}>
                    <td style={td}><b>{c.criterio}</b>
                      {c.categorias.length > 0 && <div style={{ fontSize: 12, color: COR.muted, marginTop: 4 }}>
                        {c.categorias.map(k => `${k.nome} (CBO ${k.cbo.join("/")})`).join(" · ")}</div>}</td>
                    <td style={td}>{c.exigencia}
                      {Object.values(c.valores).some(v => v.origem === "atualizacao_validada") &&
                        <div style={{ fontSize: 12, color: COR.ambar }}>Valor atualizado e validado</div>}</td>
                    <td style={td}><a href={c.fundamentacao.url} target="_blank" rel="noreferrer" style={{ color: COR.azul }}>
                      {c.fundamentacao.norma}</a><div style={{ fontSize: 12 }}>{c.fundamentacao.dispositivo}</div>
                      <div style={{ fontSize: 12, color: COR.muted }}>{c.fundamentacao.resumo}</div></td>
                    <td style={td}><Conf f={c.fundamentacao} /></td>
                    <td style={td}>{c.fonte_dado}</td>
                  </tr>))}</tbody>
              </table>
            </div>
            {m.pendencias.map((p, i) => (
              <div key={i} style={{ marginTop: 10, padding: 10, borderRadius: 8, background: COR.ambarLt, color: COR.ambar, fontSize: 13 }}>
                Pendente de confirmação: {p}</div>))}
          </Secao>

          <Secao titulo="Financiamento (parâmetros vigentes na competência)">
            {m.financiamento.length === 0 ? <div style={{ color: COR.muted }}>Sem parâmetro de financiamento cadastrado.</div> :
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <tbody>{m.financiamento.map(f => (
                  <tr key={f.chave} style={{ borderTop: `1px solid ${COR.borda}` }}>
                    <td style={td}><code style={{ fontSize: 12 }}>{f.chave}</code></td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>
                      {f.valor != null ? brl(f.valor) : f.valor_texto}</td>
                    <td style={{ ...td, color: COR.muted, fontSize: 12 }}>{f.norma}</td>
                  </tr>))}</tbody>
              </table>}
          </Secao>

          {m.id === "eMulti" && q.data && (
            <Secao titulo="Categorias possíveis da eMulti (Anexo 6 do Anexo XXII da PRC 2/2017)">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.entries(q.data.categorias_cbo.emulti_anexo6).map(([cbo, nome]) => (
                  <span key={cbo} style={{ fontSize: 12, padding: "4px 8px", borderRadius: 6, background: COR.fundo,
                    border: `1px solid ${COR.borda}` }}>{nome} · {cbo}</span>))}
              </div>
            </Secao>
          )}
          <div style={{ fontSize: 12, color: COR.muted, marginTop: 8 }}>{q.data?.monitoramento}</div>
        </>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding: "8px 10px", fontWeight: 600 };
const td: React.CSSProperties = { padding: "10px" };

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${COR.borda}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
      <div style={{ fontWeight: 700, color: COR.navy, marginBottom: 12 }}>{titulo}</div>
      {children}
    </div>
  );
}

function Conf({ f }: { f: Fund }) {
  const data = f.conferido_em ? new Date(f.conferido_em).toLocaleDateString("pt-BR") : "";
  if (f.conferido === null)
    return <span style={{ fontSize: 12, color: COR.muted }}>Página oficial indisponível na última verificação</span>;
  return f.conferido
    ? <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 6, background: COR.verdeLt, color: COR.verde }}>
        Conferido · {data}</span>
    : <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 6, background: COR.ambarLt, color: COR.ambar }}
        title={f.detalhe_conferencia}>Trecho não encontrado · {data}</span>;
}
