// eGestor › Componente Qualidade — resultado OFICIAL por equipe lido da área logada do SIAPS
// (captura assistida: o gestor está logado no gov.br no navegador do app Claude; só os resultados
// chegam aqui — senha e token nunca saem do navegador). Classificação = a do Ministério da Saúde.
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

type Valor = { resultado: number | null; numerador: number | null; denominador: number | null; classificacao: string };
type Tipo = { tipo_equipe: string; indicadores: { codigo: string; nome: string }[];
              equipes: { ine: string; equipe: string; ubs: string; valores: Record<string, Valor> }[] };
type Tabela = { situacao_dado: string; competencia?: string; competencias: string[]; tipos: Tipo[]; ultima_captura?: string | null };

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
  const m = useMutation<{ competencias: string[]; inseridos: number; atualizados: number; equipes: number; sem_codigo: string[] }, any, string>({
    mutationFn: (t) => api.post("/api/siaps-publico/captura", JSON.parse(t)).then(r => r.data),
    onSuccess: () => {
      setTexto(""); setRecebido(null);
      ["siaps-captura-tabela", "siaps-boas"].forEach(k => qc.invalidateQueries({ queryKey: [k] }));
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
        setRecebido(`Recebido do SIAPS: ${pacote.linhas?.length ?? 0} linhas — confira e clique em Importar captura.`);
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
              {m.data.sem_codigo.length ? ` · sem código: ${m.data.sem_codigo.join("; ")}` : ""}</span>}
            {m.isError && <span id="captura-siaps-resultado" style={{ fontSize: 12, color: "#dc2626" }}>{m.error?.response?.data?.detail ?? "Falha ao importar."}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function QualidadeOficialPorEquipe() {
  const [comp, setComp] = useState<string | undefined>();
  const [tipoSel, setTipoSel] = useState<string | undefined>();
  const { data } = useQuery<Tabela>({
    queryKey: ["siaps-captura-tabela", comp],
    queryFn: () => api.get("/api/siaps-publico/captura/resultados", { params: comp ? { competencia: comp } : {} }).then(r => r.data),
  });
  const tipos = data?.tipos ?? [];
  const tipo = tipos.find(t => t.tipo_equipe === tipoSel) ?? tipos[0];

  return (
    <div style={{ background: "#fff", border: "1px solid #c7d2fe", borderRadius: 10, padding: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#1e3a8a" }}>Resultado oficial por equipe — SIAPS</div>
        <span style={{ background: "#fef9c3", color: "#854d0e", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>Dado preliminar</span>
        {data?.competencias?.length ? (
          <select value={data.competencia} onChange={e => setComp(e.target.value)} aria-label="Competência"
                  style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}>
            {data.competencias.map(c => <option key={c} value={c}>{mesAno(c)}</option>)}
          </select>
        ) : null}
        <span style={{ fontSize: 11, color: "#64748b", marginLeft: "auto" }}>Última captura: {dataBR(data?.ultima_captura)}</span>
      </div>

      <CapturaAssistida />

      {data && data.situacao_dado === "nao_disponivel" && (
        <div style={{ fontSize: 13, color: "#475569", padding: "8px 0" }}>
          Ainda não há resultado por equipe captado da área logada do SIAPS. A captura roda todo dia 20 (gestor logado no gov.br no app Claude).
        </div>
      )}

      {tipo && <>
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {tipos.map(t => (
            <button key={t.tipo_equipe} onClick={() => setTipoSel(t.tipo_equipe)}
                    style={{ padding: "5px 12px", borderRadius: 16, fontSize: 12, fontWeight: 700, cursor: "pointer",
                             border: `1px solid ${t === tipo ? "#1d4ed8" : "#cbd5e1"}`,
                             background: t === tipo ? "#1d4ed8" : "#fff", color: t === tipo ? "#fff" : "#334155" }}>
              {t.tipo_equipe} · {t.equipes.length}
            </button>
          ))}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 720 }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                <th style={{ padding: "6px 8px", textAlign: "left" }}>Equipe</th>
                {tipo.indicadores.map(i => (
                  <th key={i.codigo} title={i.nome} style={{ padding: "6px 8px", textAlign: "center", fontWeight: 700, color: "#334155", maxWidth: 130 }}>
                    <div>{i.codigo}</div><div style={{ fontSize: 10, fontWeight: 500, color: "#64748b" }}>{i.nome.length > 34 ? i.nome.slice(0, 34) + "…" : i.nome}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tipo.equipes.map(e => (
                <tr key={e.ine} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "6px 8px" }}><div style={{ fontWeight: 700 }}>{e.equipe}</div><div style={{ fontSize: 10, color: "#94a3b8" }}>{e.ubs}</div></td>
                  {tipo.indicadores.map(i => {
                    const v = e.valores[i.codigo];
                    const c = v ? CLS[v.classificacao] : undefined;
                    return (
                      <td key={i.codigo} title={v ? `NM ${num(v.numerador)} · DN ${num(v.denominador)}` : ""}
                          style={{ padding: "4px 6px", textAlign: "center" }}>
                        {v ? (
                          <div style={{ background: c?.bg, borderRadius: 6, padding: "3px 4px" }}>
                            <div style={{ fontWeight: 800, color: c?.cor }}>{num(v.resultado)}</div>
                            <div style={{ fontSize: 10, color: c?.cor }}>{c?.rot}</div>
                          </div>
                        ) : <span style={{ color: "#cbd5e1" }}>—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 8 }}>
          Fonte: SIAPS área logada — Componente Qualidade, Visão por Competência ({mesAno(data?.competencia)}). Classificação do Ministério da Saúde;
          passe o mouse sobre o resultado para ver numerador e denominador.
        </div>
      </>}
    </div>
  );
}
