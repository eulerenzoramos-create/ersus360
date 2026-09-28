// Relatórios do SIAPS importados pelo município ("Baixar dados": CVAT e Qualidade)
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, Info, Upload } from "lucide-react";
import { api } from "../lib/api";
import PrazoSiapsBanner, { dataBr, useCalendarioSiaps } from "../components/PrazoSiapsBanner";

interface Meta { id: number; componente: "cvat" | "qualidade"; indicador: string; competencia: string; tipo_equipe: string;
  dado_preliminar: boolean; gerado_em: string | null; importado_por: string | null; equipes: number }
interface LinhaCvat { ine: string; equipe: string; ubs: string; sigla: string; pontuacao: number | null; status: string;
  parametro: number | null; A: number | null; B: number | null; C: number | null; D: number | null; E: number | null;
  F: number | null; G: number | null; H: number | null; I: number | null; J: number | null; K: number | null }
interface LinhaQual { ine: string; equipe: string; ubs: string; sigla: string; pontuacao: number | null; valores: Record<string, number | null> }
interface Painel {
  situacao_dado: string; competencias: string[]; competencia?: string; avisos?: string[]; relatorios?: Meta[];
  cvat?: (Meta & { resumo: { equipes: number; pessoas_vinculadas: number; pessoas_acompanhadas: number; pontuacao_media: number | null;
                             por_status: Record<string, number> }; linhas: LinhaCvat[] }) | null;
  qualidade?: (Meta & { colunas: string[]; linhas: LinhaQual[] })[];
  equipes?: { ine: string; equipe: string; ubs: string; sigla: string; cvat_pontuacao: number | null; cvat_status: string | null;
              pessoas_vinculadas: number | null; qualidade: Record<string, number | null> }[];
}
interface Resultado { arquivo: string; ok: boolean; erro?: string; substituiu?: boolean; componente?: string; indicador?: string; tipo_equipe?: string; competencia?: string }

const card: React.CSSProperties = { background: "#fff", color: "#1f2937", borderRadius: 8, border: "1px solid #e5e5e3", padding: 16, marginBottom: 12 };
const th: React.CSSProperties = { padding: "6px 8px", whiteSpace: "nowrap", textAlign: "left" };
const td: React.CSSProperties = { padding: "6px 8px", borderTop: "1px solid #eee", fontVariantNumeric: "tabular-nums" };
const COR_STATUS: Record<string, string> = { otimo: "#1d4ed8", bom: "#16a34a", suficiente: "#d97706", regular: "#dc2626" };
const ROT_STATUS: Record<string, string> = { otimo: "Ótimo", bom: "Bom", suficiente: "Suficiente", regular: "Regular" };
const n = (v: number | null | undefined) => (v === null || v === undefined ? "—" : v.toLocaleString("pt-BR"));
const mesAno = (c?: string) => { if (!c) return "—"; const [a, m] = c.split("-"); return `${["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][+m - 1]}/${a}`; };

function Envio() {
  const qc = useQueryClient();
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const m = useMutation<{ resultados: Resultado[] }, unknown, File[]>({
    mutationFn: (arquivos) => {
      const fd = new FormData();
      arquivos.forEach(a => fd.append("arquivos", a));
      return api.post("/api/siaps-relatorios/importar", fd, { headers: { "Content-Type": "multipart/form-data" } }).then(r => r.data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["siaps-relatorios"] }); qc.invalidateQueries({ queryKey: ["siaps-vinculo"] }); },
  });
  const enviar = (fl: FileList | null) => { if (fl && fl.length) m.mutate(Array.from(fl)); };
  return (
    <div style={card}>
      <div onClick={() => ref.current?.click()}
           onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
           onDrop={e => { e.preventDefault(); setDrag(false); enviar(e.dataTransfer.files); }}
           style={{ border: `2px dashed ${drag ? "#1D9E75" : "#d4d4d0"}`, borderRadius: 8, padding: 22, textAlign: "center",
                    cursor: "pointer", background: drag ? "#f0fdf4" : "#f9f9f7" }}>
        <Upload size={22} style={{ color: "#737373" }} />
        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>
          {m.isPending ? "Importando…" : "Arraste aqui os relatórios baixados do SIAPS (.csv ou .xlsx) — pode ser vários de uma vez"}
        </div>
        <div style={{ fontSize: 12, color: "#737373", marginTop: 4 }}>
          SIAPS → Componente Vínculo (CVAT) ou Qualidade → Visão por Competência → "Baixar dados". Inclua a aba eSFR (equipes ribeirinhas).
        </div>
        <input ref={ref} type="file" multiple accept=".csv,.xlsx" style={{ display: "none" }}
               onChange={e => { enviar(e.target.files); e.target.value = ""; }} />
      </div>
      {m.data?.resultados.map((r, i) => (
        <div key={i} style={{ fontSize: 13, marginTop: 6, color: r.ok ? "#059669" : "#dc2626" }}>
          {r.arquivo}: {r.ok
            ? `${r.componente === "cvat" ? "Vínculo (CVAT)" : `Qualidade — ${r.indicador}`} · ${r.tipo_equipe} · ${mesAno(r.competencia)}${r.substituiu ? " (substituiu o anterior)" : ""}`
            : r.erro}
        </div>
      ))}
    </div>
  );
}

export default function RelatoriosSiaps() {
  const [comp, setComp] = useState<string | undefined>();
  const { data, isLoading } = useQuery<Painel>({
    queryKey: ["siaps-relatorios", comp],
    queryFn: () => api.get("/api/siaps-relatorios/painel", { params: comp ? { competencia: comp } : {} }).then(r => r.data),
  });
  const indicadores = Array.from(new Set((data?.qualidade ?? []).map(q => q.indicador)));

  return (
    <div style={{ padding: 20, maxWidth: 1300, color: "#1f2937" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
        <FileSpreadsheet size={20} /> Relatórios do SIAPS — Vínculo e Qualidade
      </h1>
      <p style={{ fontSize: 13, color: "#525252", margin: "0 0 14px" }}>
        O SIAPS só libera os dados por equipe com o login gov.br de quem opera o sistema; por isso a integração é pelo arquivo oficial baixado no próprio SIAPS.
      </p>
      <PrazoSiapsBanner linkRelatorios={false} />
      <Envio />

      {isLoading && <div style={card}>Carregando…</div>}
      {data?.situacao_dado === "nao_disponivel" && <div style={{ ...card, fontSize: 14, color: "#525252" }}>Nenhum relatório importado ainda para este município.</div>}

      {data?.competencia && (
        <>
          <div style={{ ...card, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", fontSize: 13 }}>
            <label htmlFor="comp-siaps"><b>Competência</b></label>
            <select id="comp-siaps" value={data.competencia} onChange={e => setComp(e.target.value)} style={{ padding: "4px 8px", borderRadius: 6 }}>
              {data.competencias.map(c => <option key={c} value={c}>{mesAno(c)}</option>)}
            </select>
            {(data.avisos ?? []).map((a, i) => <span key={i} style={{ display: "flex", gap: 4, color: "#525252" }}><Info size={14} /> {a}</span>)}
          </div>

          <div style={{ ...card, overflowX: "auto" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Visão por equipe — {mesAno(data.competencia)}</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ background: "#f5f5f3" }}>
                <th style={th}>Equipe</th><th style={th}>Tipo</th><th style={th}>UBS</th>
                <th style={th}>Vínculo (CVAT)</th><th style={th}>Vinculadas</th>
                {indicadores.map(i => <th key={i} style={th}>{i}</th>)}
              </tr></thead>
              <tbody>{(data.equipes ?? []).map(e => (
                <tr key={e.ine}>
                  <td style={{ ...td, fontWeight: 600 }}>{e.equipe}</td><td style={td}>{e.sigla}</td><td style={{ ...td, fontSize: 12 }}>{e.ubs}</td>
                  <td style={td}>{e.cvat_pontuacao === null
                    ? <span style={{ color: "#737373", fontSize: 12 }}>{e.sigla.toUpperCase() === "ESFR" ? "não avaliada no CVAT" : "—"}</span>
                    : <span style={{ color: COR_STATUS[e.cvat_status ?? ""], fontWeight: 600 }}>{n(e.cvat_pontuacao)} · {ROT_STATUS[e.cvat_status ?? ""]}</span>}</td>
                  <td style={td}>{n(e.pessoas_vinculadas)}</td>
                  {indicadores.map(i => <td key={i} style={td}>{n(e.qualidade[i])}</td>)}
                </tr>))}
              </tbody>
            </table>
          </div>

          {data.cvat && (
            <div style={{ ...card, overflowX: "auto" }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Vínculo e Acompanhamento (CVAT) · {data.cvat.tipo_equipe}{data.cvat.dado_preliminar ? " · dado preliminar" : ""}</div>
              <div style={{ fontSize: 13, color: "#525252", marginBottom: 8 }}>
                {data.cvat.resumo.equipes} equipes · {n(data.cvat.resumo.pessoas_vinculadas)} pessoas vinculadas · média {n(data.cvat.resumo.pontuacao_media)} ·
                {" "}{Object.entries(data.cvat.resumo.por_status).map(([k, v]) => `${v} ${ROT_STATUS[k]}`).join(" · ")}
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr style={{ background: "#f5f5f3" }}>
                  {["Equipe", "Parâm.", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "Pontuação"].map(h => <th key={h} style={th}>{h}</th>)}
                </tr></thead>
                <tbody>{data.cvat.linhas.map(l => (
                  <tr key={l.ine}>
                    <td style={{ ...td, fontWeight: 600 }}>{l.equipe}</td>
                    {(["parametro", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"] as const).map(k => <td key={k} style={td}>{n(l[k])}</td>)}
                    <td style={{ ...td, fontWeight: 700, color: COR_STATUS[l.status] }}>{n(l.pontuacao)} · {ROT_STATUS[l.status]}</td>
                  </tr>))}
                </tbody>
              </table>
            </div>
          )}

          {(data.qualidade ?? []).map(q => (
            <div key={q.id} style={{ ...card, overflowX: "auto" }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Qualidade — {q.indicador} · {q.tipo_equipe}{q.dado_preliminar ? " · dado preliminar" : ""}</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr style={{ background: "#f5f5f3" }}>
                  <th style={th}>Equipe</th>{q.colunas.slice(0, -1).map(c => <th key={c} style={{ ...th, whiteSpace: "normal", fontSize: 11 }}>{c}</th>)}<th style={th}>Pontuação</th>
                </tr></thead>
                <tbody>{q.linhas.map(l => (
                  <tr key={l.ine}>
                    <td style={{ ...td, fontWeight: 600 }}>{l.equipe}</td>
                    {q.colunas.slice(0, -1).map(c => <td key={c} style={td}>{n(l.valores[c])}</td>)}
                    <td style={{ ...td, fontWeight: 700 }}>{n(l.pontuacao)}</td>
                  </tr>))}
                </tbody>
              </table>
            </div>
          ))}
        </>
      )}
      <CalendarioSiaps />
    </div>
  );
}

const SIT: Record<string, [string, string]> = {
  envio_encerrado: ["Envio encerrado", "#525252"], prazo_de_envio: ["Prazo de envio aberto", "#b45309"],
  em_producao: ["Em produção", "#1d4ed8"], futura: ["Futura", "#737373"],
};

function CalendarioSiaps() {
  const { data } = useCalendarioSiaps();
  if (!data) return null;
  return (
    <div style={{ ...card, overflowX: "auto" }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>Calendário SIAPS 2026 — envio até o 10º dia útil</div>
      <div style={{ fontSize: 12, color: "#525252", marginBottom: 8 }}>
        Relatório extraído no dia seguinte à data limite. Alertas automáticos às 7h: 7, 3 e 1 dia antes, no dia do prazo e no dia do relatório.
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr style={{ background: "#f5f5f3" }}>
          {["Competência", "Período", "Data limite de envio", "Extrair relatório em", "Situação", "Relatório no ERSUS360"].map(h => <th key={h} style={th}>{h}</th>)}
        </tr></thead>
        <tbody>{data.calendario.map(i => {
          const proximo = data.proximo_prazo?.competencia === i.competencia;
          const [rot, cor] = SIT[i.situacao] ?? [i.situacao, "#525252"];
          const deveria = i.data_relatorio <= data.hoje;
          return (
            <tr key={i.competencia} style={{ background: proximo ? "#fffbeb" : undefined }}>
              <td style={{ ...td, fontWeight: 600 }}>{i.nome}</td>
              <td style={td}>{dataBr(i.inicio)} a {dataBr(i.fim)}</td>
              <td style={{ ...td, fontWeight: 700 }}>{dataBr(i.data_limite)}{proximo && <span style={{ color: "#b45309", fontWeight: 600 }}> · faltam {i.dias_para_limite} dia(s)</span>}</td>
              <td style={td}>{dataBr(i.data_relatorio)}</td>
              <td style={{ ...td, color: cor }}>{rot}</td>
              <td style={td}>{i.relatorio_importado ? <span style={{ color: "#059669", fontWeight: 600 }}>Importado</span>
                : deveria ? <span style={{ color: "#b45309" }}>Pendente</span> : <span style={{ color: "#a3a3a3" }}>—</span>}</td>
            </tr>
          );
        })}</tbody>
      </table>
      <div style={{ fontSize: 11, color: "#737373", marginTop: 6 }}>Fonte: {data.fonte}</div>
    </div>
  );
}
