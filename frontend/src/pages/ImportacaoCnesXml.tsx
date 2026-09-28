// Importação do XML-CNES do SISAB — equipes, composição mínima e pendências cadastrais
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Info, Upload, Users } from "lucide-react";
import { api } from "../lib/api";

interface Composicao { medico: number; enfermeiro: number; tec_aux_enfermagem: number; acs: number; dentista: number; asb_tsb: number }
interface Equipe {
  ine: string; nome: string; tipo: string; tp_equipe: string; desativada_em: string | null;
  estabelecimentos_nomes: string[]; ribeirinha: boolean | null; fonte_marcacao: string | null;
  total_profissionais: number; composicao: Composicao;
}
interface Pendencia { severidade: "critica" | "alerta" | "info"; codigo: string; ine: string | null; equipe: string | null; mensagem: string; orientacao: string }
interface Importacao { id: number; data_arquivo: string | null; versao_xsd: string | null; arquivo_nome: string | null; importado_por: string | null; importado_em: string | null;
  totais: { estabelecimentos: number; equipes_ativas: number; por_tipo: Record<string, number>; profissionais: number; lotacoes: number } }
interface Painel {
  situacao_dado: string; importacao: Importacao | null; equipes?: Equipe[]; pendencias?: Pendencia[];
  resumo_pendencias?: Record<string, number>; avisos?: string[];
  comparacao?: { data_anterior: string | null; equipes_novas: string[]; equipes_removidas: string[]; equipes_desativadas: string[];
                 profissionais_entraram: string[]; profissionais_sairam: string[] } | null;
}

const COR = { critica: "#dc2626", alerta: "#d97706", info: "#2563eb" } as const;
const ROTULO = { critica: "Crítica", alerta: "Alerta", info: "Informação" } as const;
const card: React.CSSProperties = { background: "#fff", color: "#1f2937", borderRadius: 8, border: "1px solid #e5e5e3", padding: 16, marginBottom: 12 };
const dataBr = (d?: string | null) => (d ? d.split("T")[0].split("-").reverse().join("/") : "—");

function Envio() {
  const qc = useQueryClient();
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const m = useMutation({
    mutationFn: (arquivo: File) => {
      const fd = new FormData();
      fd.append("arquivo", arquivo);
      return api.post("/api/cnes-xml/importar", fd, { headers: { "Content-Type": "multipart/form-data" } }).then(r => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cnes-xml"] }),
  });
  const erro = (m.error as { response?: { data?: { detail?: string } } } | null)?.response?.data?.detail;
  return (
    <div style={card}>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) m.mutate(f); }}
        style={{ border: `2px dashed ${drag ? "#1D9E75" : "#d4d4d0"}`, borderRadius: 8, padding: 22, textAlign: "center",
                 cursor: "pointer", background: drag ? "#f0fdf4" : "#f9f9f7" }}>
        <Upload size={22} style={{ color: "#737373" }} />
        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>
          {m.isPending ? "Importando…" : "Arraste aqui o arquivo XmlParaESUS31_…zip (ou .xml) ou clique para escolher"}
        </div>
        <div style={{ fontSize: 12, color: "#737373", marginTop: 4 }}>
          SISAB → Gerador de Arquivo XML-CNES para o e-SUS APS → "Gerar Arquivo XML - V.3.1"
        </div>
        <input ref={ref} type="file" accept=".zip,.xml" style={{ display: "none" }}
               onChange={e => { const f = e.target.files?.[0]; if (f) m.mutate(f); e.target.value = ""; }} />
      </div>
      {m.isSuccess && <div style={{ color: "#059669", fontSize: 13, marginTop: 8 }}>Arquivo importado.</div>}
      {erro && <div style={{ color: "#dc2626", fontSize: 13, marginTop: 8 }}>{erro}</div>}
    </div>
  );
}

function Num({ v, obrigatorio }: { v: number; obrigatorio?: boolean }) {
  const falta = obrigatorio && v === 0;
  return <td style={{ padding: "6px 8px", textAlign: "center", fontWeight: falta ? 700 : 400, color: falta ? "#dc2626" : undefined }}>{v}</td>;
}

export default function ImportacaoCnesXml() {
  const { data, isLoading } = useQuery<Painel>({ queryKey: ["cnes-xml", "painel"], queryFn: () => api.get("/api/cnes-xml/painel").then(r => r.data) });
  const imp = data?.importacao;
  const ativas = (data?.equipes ?? []).filter(e => !e.desativada_em);

  return (
    <div style={{ padding: 20, maxWidth: 1200, color: "#1f2937" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
        <Users size={20} /> Equipes do CNES — importação do XML do SISAB
      </h1>
      <p style={{ fontSize: 13, color: "#525252", margin: "0 0 14px" }}>
        Confere a composição mínima de cada equipe e aponta pendências cadastrais a partir do arquivo oficial do SISAB.
      </p>

      <Envio />

      {isLoading && <div style={card}>Carregando…</div>}
      {data && !imp && <div style={{ ...card, color: "#525252", fontSize: 14 }}>Nenhum arquivo importado ainda para este município.</div>}

      {imp && (
        <>
          <div style={{ ...card, display: "flex", flexWrap: "wrap", gap: 24, fontSize: 13 }}>
            <div><b>Arquivo de</b> {dataBr(imp.data_arquivo)} · v{imp.versao_xsd}</div>
            <div><b>{imp.totais.estabelecimentos}</b> estabelecimentos</div>
            <div><b>{imp.totais.equipes_ativas}</b> equipes ativas ({Object.entries(imp.totais.por_tipo).map(([k, v]) => `${v} ${k}`).join(" · ")})</div>
            <div><b>{imp.totais.profissionais}</b> profissionais · {imp.totais.lotacoes} lotações</div>
            <div style={{ color: "#737373" }}>Importado em {dataBr(imp.importado_em)} por {imp.importado_por}</div>
          </div>

          <div style={card}>
            <div style={{ fontWeight: 700, marginBottom: 8, display: "flex", gap: 12, alignItems: "center" }}>
              Pendências cadastrais
              {(["critica", "alerta"] as const).map(s => (
                <span key={s} style={{ fontSize: 12, color: COR[s], fontWeight: 600 }}>{data.resumo_pendencias?.[s] ?? 0} {ROTULO[s].toLowerCase()}(s)</span>
              ))}
            </div>
            {(data.pendencias ?? []).length === 0
              ? <div style={{ color: "#059669", fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
                  <CheckCircle2 size={16} /> Todas as equipes ativas têm a composição mínima cadastrada.
                </div>
              : (data.pendencias ?? []).map((p, i) => (
                  <div key={i} style={{ borderLeft: `4px solid ${COR[p.severidade]}`, padding: "6px 10px", marginBottom: 6, background: "#fafafa" }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      <span style={{ color: COR[p.severidade] }}>{ROTULO[p.severidade]}</span> · {p.mensagem}
                    </div>
                    <div style={{ fontSize: 12, color: "#525252" }}>{p.orientacao}</div>
                  </div>
                ))}
            {(data.avisos ?? []).map((a, i) => (
              <div key={i} style={{ fontSize: 12, color: "#525252", marginTop: 8, display: "flex", gap: 6 }}><Info size={14} /> {a}</div>
            ))}
          </div>

          <div style={{ ...card, overflowX: "auto" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Composição das equipes ativas</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f5f5f3", textAlign: "left" }}>
                  {["Equipe", "Tipo", "INE", "Unidade(s)", "Médico", "Enferm.", "Téc./Aux. Enf.", "ACS", "Dentista", "ASB/TSB", "Total"].map(h =>
                    <th key={h} style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {ativas.map(e => {
                  const esf = e.tp_equipe === "70", esb = e.tp_equipe === "71";
                  return (
                    <tr key={e.ine} style={{ borderTop: "1px solid #eee" }}>
                      <td style={{ padding: "6px 8px", fontWeight: 600 }}>
                        {e.nome}{e.ribeirinha && <span title={e.fonte_marcacao ?? ""} style={{ marginLeft: 6, fontSize: 11, color: "#0369a1", background: "#e0f2fe", borderRadius: 4, padding: "1px 6px" }}>Ribeirinha</span>}
                      </td>
                      <td style={{ padding: "6px 8px" }}>{e.tipo}</td>
                      <td style={{ padding: "6px 8px", fontVariantNumeric: "tabular-nums" }}>{e.ine}</td>
                      <td style={{ padding: "6px 8px", fontSize: 12 }}>{e.estabelecimentos_nomes.join(", ")}</td>
                      <Num v={e.composicao.medico} obrigatorio={esf} />
                      <Num v={e.composicao.enfermeiro} obrigatorio={esf} />
                      <Num v={e.composicao.tec_aux_enfermagem} obrigatorio={esf} />
                      <Num v={e.composicao.acs} obrigatorio={esf} />
                      <Num v={e.composicao.dentista} obrigatorio={esb} />
                      <Num v={e.composicao.asb_tsb} obrigatorio={esb} />
                      <td style={{ padding: "6px 8px", textAlign: "center", fontWeight: 600 }}>{e.total_profissionais}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {data.comparacao && (
            <div style={card}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>O que mudou desde o arquivo de {dataBr(data.comparacao.data_anterior)}</div>
              {([["Equipes novas", data.comparacao.equipes_novas], ["Equipes que saíram do arquivo", data.comparacao.equipes_removidas],
                 ["Equipes desativadas", data.comparacao.equipes_desativadas], ["Profissionais que entraram", data.comparacao.profissionais_entraram],
                 ["Profissionais que saíram", data.comparacao.profissionais_sairam]] as [string, string[]][]).map(([t, l]) => (
                <div key={t} style={{ fontSize: 13, marginBottom: 4 }}>
                  <b>{t}:</b> {l.length ? l.join(", ") : <span style={{ color: "#737373" }}>nenhum</span>}
                </div>
              ))}
            </div>
          )}
          {!data.comparacao && (
            <div style={{ fontSize: 12, color: "#737373", display: "flex", gap: 6 }}>
              <AlertTriangle size={14} /> Importe o arquivo de novo nos próximos meses para ver o que mudou entre um e outro.
            </div>
          )}
        </>
      )}
    </div>
  );
}
