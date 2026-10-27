// eGestor › Componente Qualidade — resultado OFICIAL por equipe lido da área logada do SIAPS
// (captura assistida: o gestor está logado no gov.br no navegador do app Claude; só os resultados
// chegam aqui — senha e token nunca saem do navegador). Classificação = a do Ministério da Saúde.
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../lib/api";


const CLS: Record<string, { cor: string; bg: string; rot: string }> = {
  otimo: { cor: "#1d4ed8", bg: "#eff6ff", rot: "Ótimo" },
  bom: { cor: "#16a34a", bg: "#f0fdf4", rot: "Bom" },
  suficiente: { cor: "#d97706", bg: "#fffbeb", rot: "Suficiente" },
  regular: { cor: "#dc2626", bg: "#fff7f7", rot: "Regular" },
};
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const mesAno = (c?: string) => { if (!c) return "—"; const [a, m] = c.split("-"); return `${MESES[+m - 1]}/${a}`; };
const num = (v: number | null | undefined) => (v === null || v === undefined ? "—" : v.toLocaleString("pt-BR", { maximumFractionDigits: 2 }));
const dataBR = (iso?: string | null) => iso ? new Date(iso.endsWith("Z") ? iso : iso + "Z").toLocaleString("pt-BR") : "nenhuma";
const PREFIXO = "#captura-siaps=";

export function capturaNoEndereco(): boolean {
  return typeof window !== "undefined" && window.location.hash.startsWith(PREFIXO);
}

function CapturaAssistida() {
  const qc = useQueryClient();
  const [texto, setTexto] = useState("");
  const [recebido, setRecebido] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const m = useMutation<{ competencias: string[]; inseridos: number; atualizados: number; equipes: number; sem_codigo: string[];
                          corrigidos_pelo_ms?: string[]; quadrimestral?: { novos: number; revisados: string[]; sem_mudanca: number } }, any, string>({
    mutationFn: (t) => api.post("/api/siaps-publico/captura", JSON.parse(t)).then(r => r.data),
    onSuccess: () => {
      setTexto(""); setRecebido(null);
      ["siaps-captura-tabela", "siaps-boas", "siaps-quadrimestral", "siaps-conferencia", "siaps-painel-geral"].forEach(k => qc.invalidateQueries({ queryKey: [k] }));
    },
  });
  useEffect(() => {
    // A tarefa "Captura SIAPS mensal", na página do SIAPS, abre o eGestor levando o resultado depois do
    // "#" (fragmento: fica no navegador, não vai a servidor). A importação depende do clique abaixo.
    if (!capturaNoEndereco()) return;
    setAberto(true);
    try {
      const pacote = JSON.parse(decodeURIComponent(window.location.hash.slice(PREFIXO.length)));
      if (pacote?.formato === "ersus360-siaps-captura-v1") {
        setTexto(JSON.stringify(pacote));
        setRecebido(`Recebido do SIAPS: ${pacote.linhas?.length ?? 0} linhas mensais` +
                    (pacote.quadrimestral?.length ? ` + ${pacote.quadrimestral.length} avaliações quadrimestrais` : "") +
                    " — confira e clique em Importar captura.");
      }
    } catch { setRecebido("O resultado recebido do SIAPS está incompleto. Refaça a captura."); }
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []);
  let jsonOk = true;
  try { if (texto.trim()) JSON.parse(texto); } catch { jsonOk = false; }

  return (
    <div id="captura-siaps" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
      <button onClick={() => setAberto(!aberto)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer",
              fontSize: 12.5, fontWeight: 700, color: "#334155" }}>
        {aberto ? "▾" : "▸"} Captura assistida do SIAPS (área logada)
      </button>
      {recebido && !aberto && <span style={{ fontSize: 12, color: "#1d4ed8", marginLeft: 8 }}>{recebido}</span>}
      {aberto && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 6 }}>
            Todo dia 20, com o gestor logado no gov.br no navegador do app Claude, a tarefa "Captura SIAPS mensal" lê no próprio
            SIAPS a pontuação, NM/DN e a classificação oficial de cada equipe e traz o resultado para cá. Nenhuma senha ou token é enviado.
          </div>
          <textarea id="captura-siaps-json" aria-label="Resultado da captura do SIAPS (JSON)" value={texto}
                    onChange={e => setTexto(e.target.value)} rows={3} placeholder='{"formato": "ersus360-siaps-captura-v1", ...}'
                    style={{ width: "100%", fontFamily: "monospace", fontSize: 11, padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
            <button onClick={() => m.mutate(texto)} disabled={!texto.trim() || !jsonOk || m.isPending}
                    style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#1d4ed8", color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>
              {m.isPending ? "Importando…" : "Importar captura"}
            </button>
            {recebido && !m.isSuccess && <span style={{ fontSize: 12, color: "#1d4ed8" }}>{recebido}</span>}
            {!jsonOk && <span style={{ fontSize: 12, color: "#dc2626" }}>Conteúdo não é um JSON válido.</span>}
            {m.isSuccess && <span id="captura-siaps-resultado" style={{ fontSize: 12, color: "#059669" }}>
              Importado: {m.data.competencias.map(mesAno).join(", ")} · {m.data.equipes} equipes · {m.data.inseridos} novos, {m.data.atualizados} atualizados
              {m.data.quadrimestral && ` · quadrimestral: ${m.data.quadrimestral.novos} novas, ${m.data.quadrimestral.revisados.length} revisadas pelo MS, ${m.data.quadrimestral.sem_mudanca} sem mudança`}
              {m.data.corrigidos_pelo_ms?.length ? ` · ${m.data.corrigidos_pelo_ms.length} valor(es) mensal(is) corrigido(s) pelo MS` : ""}
              {m.data.sem_codigo.length ? ` · sem código: ${m.data.sem_codigo.join("; ")}` : ""}</span>}
            {m.isError && <span id="captura-siaps-resultado" style={{ fontSize: 12, color: "#dc2626" }}>{m.error?.response?.data?.detail ?? "Falha ao importar."}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

type BlocoInd = { codigo: string; nome_publicado: string; sg_equipe: string;
  catalogo: { nome: string; modalidades: string; peso_quadrimestral: number | null; nota_tecnica: string; ficha_tecnica: string } | null;
  contagem: Record<string, number>;
  equipes: { ine: string; equipe: string; ubs: string; resultado: number | null; numerador: number | null; denominador: number | null; classificacao: string }[] };
type RespInd = { situacao_dado: string; competencia?: string; competencias: string[]; indicadores: BlocoInd[]; ultima_captura?: string | null };
type Serie = { codigo: string; competencias: string[]; equipes: { ine: string; equipe: string; valores: Record<string, { resultado: number | null; classificacao: string; corrigido_pelo_ms: boolean }> }[] };

const ORDEM_CLS = ["otimo", "bom", "suficiente", "regular"];
const CORES_LINHA = ["#1d4ed8", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#be185d", "#4d7c0f", "#475569", "#b45309"];

function exportarCsv(b: BlocoInd, competencia?: string) {
  const cab = ["competencia", "codigo", "indicador", "modalidade", "ine", "equipe", "ubs", "resultado", "numerador", "denominador", "classificacao_oficial", "fonte"];
  const linhas = b.equipes.map(e => [competencia, b.codigo, b.catalogo?.nome ?? b.nome_publicado, b.sg_equipe, e.ine, e.equipe, e.ubs,
    e.resultado, e.numerador, e.denominador, CLS[e.classificacao]?.rot ?? e.classificacao, "SIAPS área logada (captura assistida)"]);
  const csv = [cab, ...linhas].map(l => l.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  a.download = `SIAPS-${b.codigo}-${b.sg_equipe}-${competencia ?? ""}.csv`;
  a.click();
}

function DetalheIndicador({ b, competencia, atualizacao }: { b: BlocoInd; competencia?: string; atualizacao?: string | null }) {
  const { data: serie } = useQuery<Serie>({
    queryKey: ["siaps-serie", b.codigo],
    queryFn: () => api.get("/api/siaps-publico/captura/serie", { params: { codigo: b.codigo } }).then(r => r.data),
  });
  const pontos = (serie?.competencias ?? []).map(c => ({
    c: mesAno(c), ...Object.fromEntries((serie?.equipes ?? []).map(e => [e.equipe, e.valores[c]?.resultado ?? null])) }));
  return (
    <div style={{ border: "1px solid #c7d2fe", borderRadius: 10, padding: 14, marginTop: 10, background: "#fbfcff" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#1e3a8a" }}>{b.codigo} — {b.catalogo?.nome ?? b.nome_publicado}</div>
        <button onClick={() => exportarCsv(b, competencia)} style={{ marginLeft: "auto", fontSize: 12, padding: "4px 10px", borderRadius: 6,
                border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}>⬇ Exportar CSV</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 6, fontSize: 12, color: "#334155", margin: "8px 0" }}>
        <div><b>Modalidade:</b> {b.sg_equipe}</div>
        <div><b>Competência:</b> {mesAno(competencia)} (preliminar)</div>
        <div><b>Peso no quadrimestre:</b> {b.catalogo?.peso_quadrimestral ?? "—"} ({b.catalogo?.nota_tecnica ?? "—"})</div>
        <div><b>Atualização no ERSUS360:</b> {dataBR(atualizacao)}</div>
        <div style={{ gridColumn: "1 / -1" }}><b>Meta/parâmetro, unidade e fórmula:</b>{" "}
          {b.catalogo ? <a href={b.catalogo.ficha_tecnica} target="_blank" rel="noreferrer">ficha técnica oficial do indicador</a> : "ficha técnica não catalogada"}
          {" "}· nome publicado no SIAPS: “{b.nome_publicado}”</div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 520 }}>
          <thead><tr style={{ background: "#f1f5f9" }}>
            {["Equipe", "INE", "Resultado", "Numerador", "Denominador", "Classificação oficial"].map(h =>
              <th key={h} style={{ padding: "5px 8px", textAlign: "left" }}>{h}</th>)}</tr></thead>
          <tbody>{b.equipes.map(e => (
            <tr key={e.ine} style={{ borderTop: "1px solid #f1f5f9" }}>
              <td style={{ padding: "5px 8px" }}><b>{e.equipe}</b><div style={{ fontSize: 10, color: "#94a3b8" }}>{e.ubs}</div></td>
              <td style={{ padding: "5px 8px", fontFamily: "monospace" }}>{e.ine}</td>
              <td style={{ padding: "5px 8px", fontWeight: 800 }}>{num(e.resultado)}</td>
              <td style={{ padding: "5px 8px" }}>{num(e.numerador)}</td>
              <td style={{ padding: "5px 8px" }}>{num(e.denominador)}</td>
              <td style={{ padding: "5px 8px" }}><span style={{ background: CLS[e.classificacao]?.bg, color: CLS[e.classificacao]?.cor,
                  fontWeight: 700, fontSize: 11, padding: "2px 8px", borderRadius: 10 }}>{CLS[e.classificacao]?.rot}</span></td>
            </tr>))}</tbody>
        </table>
      </div>
      {pontos.length > 1 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>Histórico por equipe (competências capturadas)</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={pontos}>
              <XAxis dataKey="c" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} width={34} />
              <Tooltip contentStyle={{ fontSize: 11 }} /><Legend wrapperStyle={{ fontSize: 10 }} />
              {(serie?.equipes ?? []).map((e, i) => <Line key={e.ine} dataKey={e.equipe} stroke={CORES_LINHA[i % CORES_LINHA.length]} dot={{ r: 2 }} strokeWidth={1.5} connectNulls />)}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// modo "qualidade" (aba Componente Qualidade, com a captura) | "analise" (aba Análise do Indicador)
export default function QualidadeOficialPorEquipe({ modo = "qualidade", competencia }: { modo?: "qualidade" | "analise"; competencia?: string }) {
  const [comp, setComp] = useState<string | undefined>(competencia);
  const [sgSel, setSgSel] = useState<string | undefined>();
  const [indSel, setIndSel] = useState<string | null>(null);
  useEffect(() => { if (competencia) { setComp(competencia); setIndSel(null); } }, [competencia]);
  const { data } = useQuery<RespInd>({
    queryKey: ["siaps-captura-tabela", comp],
    queryFn: () => api.get("/api/siaps-publico/captura/indicadores", { params: comp ? { competencia: comp } : {} }).then(r => r.data),
  });
  const blocos = data?.indicadores ?? [];
  const modalidades = Array.from(new Set(blocos.map(b => b.sg_equipe)));
  const sg = sgSel && modalidades.includes(sgSel) ? sgSel : modalidades[0];
  const doSg = blocos.filter(b => b.sg_equipe === sg);
  const sel = doSg.find(b => b.codigo === indSel) ?? (modo === "analise" ? doSg[0] : undefined);

  return (
    <div style={{ background: "#fff", border: "1px solid #c7d2fe", borderRadius: 10, padding: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#1e3a8a" }}>{modo === "analise" ? "Análise do Indicador — SIAPS" : "Resultado oficial por indicador e equipe — SIAPS"}</div>
        <span style={{ background: "#fef9c3", color: "#854d0e", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>Monitoramento mensal · preliminar</span>
        {data?.competencias?.length ? (
          <select value={data.competencia} onChange={e => { setComp(e.target.value); setIndSel(null); }} aria-label="Competência"
                  style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}>
            {data.competencias.map(c => <option key={c} value={c}>{mesAno(c)}</option>)}
          </select>
        ) : null}
        <span style={{ fontSize: 11, color: "#64748b", marginLeft: "auto" }}>Última captura: {dataBR(data?.ultima_captura)}</span>
      </div>
      {data?.competencia && (
        <div style={{ fontSize: 11.5, color: "#64748b", marginBottom: 8 }}>
          Competência mais recente capturada do SIAPS: <b>{mesAno(data.competencias[0])}</b>. Resultados mensais são de monitoramento
          (NT nº 8/2026, item 2.3); a classificação para cofinanciamento é a quadrimestral (aba Avaliação Quadrimestre).
        </div>)}

      {modo === "qualidade" && <CapturaAssistida />}

      {data && data.situacao_dado === "nao_disponivel" && (
        <div style={{ fontSize: 13, color: "#475569", padding: "8px 0" }}>
          Ainda não há resultado por equipe captado da área logada do SIAPS. A captura roda todo dia 20 (gestor logado no gov.br no app Claude).
        </div>
      )}

      {sg && <>
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {modalidades.map(m => (
            <button key={m} onClick={() => { setSgSel(m); setIndSel(null); }}
                    style={{ padding: "5px 12px", borderRadius: 16, fontSize: 12, fontWeight: 700, cursor: "pointer",
                             border: `1px solid ${m === sg ? "#1d4ed8" : "#cbd5e1"}`, background: m === sg ? "#1d4ed8" : "#fff", color: m === sg ? "#fff" : "#334155" }}>
              {m}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 10 }}>
          {doSg.map(b => {
            const total = b.equipes.length || 1;
            return (
              <button key={b.codigo} onClick={() => setIndSel(indSel === b.codigo ? null : b.codigo)}
                      style={{ textAlign: "left", border: `1px solid ${indSel === b.codigo ? "#1d4ed8" : "#e2e8f0"}`, borderRadius: 10,
                               background: indSel === b.codigo ? "#eff6ff" : "#fff", padding: 12, cursor: "pointer" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#1e3a8a" }}>{b.codigo}</div>
                <div style={{ fontSize: 12, color: "#334155", minHeight: 32 }}>{b.catalogo?.nome ?? b.nome_publicado}</div>
                <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", margin: "8px 0 4px" }}>
                  {ORDEM_CLS.map(c => <div key={c} style={{ width: `${(b.contagem[c] ?? 0) / total * 100}%`, background: CLS[c].cor }} />)}
                </div>
                <div style={{ fontSize: 10.5, color: "#64748b" }}>
                  {ORDEM_CLS.filter(c => b.contagem[c]).map(c => `${CLS[c].rot} ${b.contagem[c]}`).join(" · ")}
                </div>
              </button>
            );
          })}
        </div>
        {sel ? <DetalheIndicador b={sel} competencia={data?.competencia} atualizacao={data?.ultima_captura} />
             : <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 8 }}>Clique em um indicador para ver equipes, INE, numerador/denominador, histórico e exportar.</div>}
      </>}
    </div>
  );
}
