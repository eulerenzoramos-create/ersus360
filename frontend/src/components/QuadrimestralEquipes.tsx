// eGestor › Avaliação Quadrimestre — resultado OFICIAL por equipe (área logada do SIAPS, captura assistida)
// e conferência entre fontes. Nada é calculado aqui: nota, peso, conceito e classificação são do Ministério
// (NT nº 8/2026 e nº 12/2026-DEAPS/SAPS/MS); a conferência só aponta o que não fecha.
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

type Ind = { co: number; codigo: string; peso?: number; conceito?: number; nota?: number; classificacao?: string | null;
             score?: number; nm?: number; dn?: number; nps?: number; mensal_score?: Record<string, any>;
             mensal_nm?: Record<string, any>; mensal_dn?: Record<string, any> };
type Equipe = { ine: string; equipe: string; ubs: string; nota_final: number | null; classificacao: string | null;
                equipe_valida: boolean; homologada: boolean; indicadores: Ind[]; versao: number; capturado_em: string };
type Grupo = { componente: string; sg_equipe: string; contagem_validas: Record<string, number>; equipes: Equipe[] };
type Resp = { situacao_dado: string; quadrimestre?: string; quadrimestres: string[]; situacao?: string; nota_situacao?: string; grupos: Grupo[] };
type Conf = { itens: { quadrimestre: string; componente: string; sg_equipe: string; publico: Record<string, number> | null;
                       capturado: Record<string, number> | null; situacao: string; nota?: string | null }[];
              integridade: { quadrimestre: string; componente: string; equipe: string; sg_equipe: string; problema: string }[];
              resumo: Record<string, number>; regra: string };

const CLS: Record<string, { cor: string; bg: string; rot: string }> = {
  otimo: { cor: "#1d4ed8", bg: "#eff6ff", rot: "Ótimo" }, bom: { cor: "#16a34a", bg: "#f0fdf4", rot: "Bom" },
  suficiente: { cor: "#d97706", bg: "#fffbeb", rot: "Suficiente" }, regular: { cor: "#dc2626", bg: "#fff7f7", rot: "Regular" },
};
const ORDEM = ["otimo", "bom", "suficiente", "regular"];
const COMP = { CVAT: "Vínculo e Acompanhamento (Componente II)", QUALIDADE: "Qualidade (Componente III)" } as Record<string, string>;
const rotQ = (q?: string) => { if (!q) return "—"; const [a, n] = q.split("Q"); return `${n}º quadrimestre/${a} (${({ "1": "jan–abr", "2": "mai–ago", "3": "set–dez" } as any)[n]})`; };
const n = (v: number | null | undefined, d = 2) => (v === null || v === undefined ? "—" : v.toLocaleString("pt-BR", { maximumFractionDigits: d }));
const Badge = ({ c }: { c?: string | null }) => {
  const k = c ? CLS[c] : undefined;
  return <span style={{ background: k?.bg ?? "#f1f5f9", color: k?.cor ?? "#64748b", fontWeight: 700, fontSize: 11, padding: "2px 8px", borderRadius: 10 }}>{k?.rot ?? "—"}</span>;
};
const mensalTxt = (m?: Record<string, any>) => !m ? "" : Object.entries(m).map(([k, v]) =>
  typeof v === "object" && v ? `${k}: ${Object.values(v).map(x => n(x as number)).join(" · ")}` : `${k.replace("MES", "M")} ${n(v as number)}`).join("  |  ");

function DetalheEquipe({ e, componente }: { e: Equipe; componente: string }) {
  return (
    <div style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0", padding: "10px 12px" }}>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>
        INE {e.ine} · {e.homologada ? "homologada" : "não homologada"} · {e.equipe_valida ? "válida (custeada)" : "não válida para o componente"}
        {e.versao > 1 && ` · revisada pelo MS (versão ${e.versao})`}
      </div>
      {e.indicadores.map(i => (
        <div key={i.co} style={{ display: "grid", gridTemplateColumns: "minmax(150px,1.2fr) repeat(4, minmax(70px,.5fr))", gap: 8,
                                 alignItems: "center", padding: "5px 0", borderTop: "1px dashed #e2e8f0", fontSize: 12 }}>
          <div><b>{i.codigo}</b>{componente === "QUALIDADE" && i.peso !== undefined && <span style={{ color: "#64748b" }}> · peso {n(i.peso)}</span>}</div>
          <div>Resultado <b>{n(i.score)}</b></div>
          <div>{i.nm !== undefined || i.dn !== undefined ? <>NM {n(i.nm, 0)} / DN {n(i.dn, 0)}</> : <span style={{ color: "#cbd5e1" }}>NM/DN —</span>}</div>
          <div>{componente === "QUALIDADE" ? <>Conceito {n(i.conceito)} → nota <b>{n(i.nota)}</b></> : i.nps !== undefined ? <>NPS {n(i.nps)}</> : null}</div>
          <div><Badge c={i.classificacao} /></div>
          {(i.mensal_score || i.mensal_nm || i.mensal_dn) && (
            <div style={{ gridColumn: "1 / -1", fontSize: 10.5, color: "#64748b" }}>
              {i.mensal_score && <>Mês a mês: {mensalTxt(i.mensal_score)} </>}
              {i.mensal_nm && <>· NM {mensalTxt(i.mensal_nm)} </>}{i.mensal_dn && <>· DN {mensalTxt(i.mensal_dn)}</>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function ConferenciaFontes() {
  const { data } = useQuery<Conf>({ queryKey: ["siaps-conferencia"], queryFn: () => api.get("/api/siaps-publico/conferencia").then(r => r.data) });
  if (!data) return null;
  const cor: Record<string, string> = { confere: "#16a34a", diverge: "#dc2626", sem_comparacao: "#64748b" };
  const rot: Record<string, string> = { confere: "Confere", diverge: "Diverge", sem_comparacao: "Sem comparação" };
  const fmt = (c: Record<string, number> | null) => c ? ORDEM.map(k => `${CLS[k].rot[0]}${c[k] ?? 0}`).join(" ") : "—";
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e3a8a", marginBottom: 4 }}>Conferência automática das fontes oficiais</div>
      <div style={{ fontSize: 11.5, color: "#64748b", marginBottom: 8 }}>{data.regra}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        {(["confere", "diverge", "sem_comparacao"] as const).map(s => (
          <span key={s} style={{ fontSize: 12, fontWeight: 700, color: cor[s], border: `1px solid ${cor[s]}55`, borderRadius: 12, padding: "2px 10px" }}>
            {rot[s]}: {data.resumo[s] ?? 0}</span>))}
        <span style={{ fontSize: 12, fontWeight: 700, color: data.integridade.length ? "#dc2626" : "#16a34a", borderRadius: 12, padding: "2px 10px", border: "1px solid #e5e7eb" }}>
          Integridade pelas Notas Técnicas: {data.integridade.length ? `${data.integridade.length} problema(s)` : "sem problemas"}</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 560 }}>
          <thead><tr style={{ background: "#f1f5f9" }}>
            {["Quadrimestre", "Componente", "Equipe", "Área pública (Ó B S R)", "Área logada — equipes válidas", "Situação"].map(h =>
              <th key={h} style={{ padding: "5px 8px", textAlign: "left" }}>{h}</th>)}</tr></thead>
          <tbody>{data.itens.map((i, k) => (
            <tr key={k} style={{ borderTop: "1px solid #f1f5f9" }}>
              <td style={{ padding: "4px 8px" }}>{i.quadrimestre}</td><td style={{ padding: "4px 8px" }}>{i.componente}</td>
              <td style={{ padding: "4px 8px" }}>{i.sg_equipe}</td><td style={{ padding: "4px 8px", fontFamily: "monospace" }}>{fmt(i.publico)}</td>
              <td style={{ padding: "4px 8px", fontFamily: "monospace" }}>{fmt(i.capturado)}</td>
              <td style={{ padding: "4px 8px", color: cor[i.situacao], fontWeight: 700 }}>{rot[i.situacao]}
                {i.nota && <div style={{ fontWeight: 400, fontSize: 10.5, color: "#64748b" }}>{i.nota}</div>}</td>
            </tr>))}</tbody>
        </table>
      </div>
      {data.integridade.map((p, k) => (
        <div key={k} style={{ fontSize: 12, color: "#b91c1c", marginTop: 4 }}>• {p.quadrimestre} {p.componente} {p.sg_equipe} {p.equipe}: {p.problema}</div>))}
    </div>
  );
}

export default function QuadrimestralEquipes() {
  const [q, setQ] = useState<string | undefined>();
  const [grupoSel, setGrupoSel] = useState<string | undefined>();
  const [aberta, setAberta] = useState<string | null>(null);
  const { data } = useQuery<Resp>({
    queryKey: ["siaps-quadrimestral", q],
    queryFn: () => api.get("/api/siaps-publico/quadrimestral", { params: q ? { quadrimestre: q } : {} }).then(r => r.data),
  });
  const grupos = data?.grupos ?? [];
  const chave = (g: Grupo) => `${g.componente}|${g.sg_equipe}`;
  const g = grupos.find(x => chave(x) === grupoSel) ?? grupos[0];

  return (
    <div style={{ background: "#fff", border: "1px solid #c7d2fe", borderRadius: 10, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#1e3a8a" }}>Resultado oficial por equipe — avaliação quadrimestral</div>
        {data?.situacao && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
            background: data.situacao === "publicado" ? "#dcfce7" : "#fef9c3", color: data.situacao === "publicado" ? "#166534" : "#854d0e" }}>
          {data.situacao === "publicado" ? "Resultado oficial publicado" : "Preliminar"}</span>}
        {data?.quadrimestres?.length ? (
          <select aria-label="Quadrimestre" value={data.quadrimestre} onChange={e => { setQ(e.target.value); setAberta(null); }}
                  style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}>
            {data.quadrimestres.map(x => <option key={x} value={x}>{rotQ(x)}</option>)}
          </select>) : null}
      </div>
      {data?.nota_situacao && <div style={{ fontSize: 11.5, color: "#64748b", marginBottom: 8 }}>{data.nota_situacao}</div>}
      {data?.situacao_dado === "nao_disponivel" && (
        <div style={{ fontSize: 13, color: "#475569" }}>Ainda não há avaliação quadrimestral por equipe captada da área logada do SIAPS
          (captura assistida, todo dia 20, com o gestor logado no gov.br no app Claude).</div>)}
      {g && <>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {grupos.map(x => (
            <button key={chave(x)} onClick={() => { setGrupoSel(chave(x)); setAberta(null); }}
                    style={{ padding: "5px 12px", borderRadius: 16, fontSize: 12, fontWeight: 700, cursor: "pointer",
                             border: `1px solid ${x === g ? "#1d4ed8" : "#cbd5e1"}`, background: x === g ? "#1d4ed8" : "#fff", color: x === g ? "#fff" : "#334155" }}>
              {x.componente === "CVAT" ? "Vínculo" : "Qualidade"} · {x.sg_equipe} ({x.equipes.length})
            </button>))}
        </div>
        <div style={{ fontSize: 12, color: "#334155", marginBottom: 6 }}>
          {COMP[g.componente]} — {g.sg_equipe} · equipes válidas: {ORDEM.map(k => `${CLS[k].rot} ${g.contagem_validas[k] ?? 0}`).join(" · ")}
        </div>
        {g.equipes.map(e => (
          <div key={e.ine} style={{ border: "1px solid #e2e8f0", borderRadius: 8, marginBottom: 6, overflow: "hidden" }}>
            <button onClick={() => setAberta(aberta === e.ine ? null : e.ine)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#fff",
                             border: "none", cursor: "pointer", textAlign: "left", flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>{aberta === e.ine ? "▾" : "▸"}</span>
              <span style={{ fontWeight: 700, fontSize: 13, minWidth: 150 }}>{e.equipe}</span>
              <span style={{ fontSize: 11, color: "#94a3b8", flex: 1 }}>{e.ubs}</span>
              {!e.equipe_valida && <span style={{ fontSize: 10.5, color: "#b45309" }}>não válida</span>}
              <span style={{ fontSize: 13 }}>Nota <b>{n(e.nota_final)}</b></span>
              <Badge c={e.classificacao} />
            </button>
            {aberta === e.ine && <DetalheEquipe e={e} componente={g.componente} />}
          </div>
        ))}
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
          Fonte: SIAPS área logada — Avaliação do Quadrimestre ({rotQ(data?.quadrimestre)}). Cálculo do Ministério conforme NT nº 8/2026
          (eSF, eAP, eSB, eMulti) e NT nº 12/2026 (eSFR, eCR, eAPP); clique na equipe para ver indicadores, pesos, conceitos e mês a mês.
        </div>
      </>}
    </div>
  );
}
