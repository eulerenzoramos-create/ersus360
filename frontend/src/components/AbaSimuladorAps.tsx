// Simulador de Financiamento e Oportunidades de Credenciamento da APS (aba do eGestor).
// Fontes: e-Gestor APS (pagamento por componente/equipe, valores de referência) e SIAPS (avaliação por equipe).
// Nada aqui é calculado no navegador além de filtros e formatação — os números vêm de /api/aps-simulador.
import { Fragment, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGetRaw, apiPost } from "../lib/api";
import { BRL } from "../lib/fmt";

type Eleg = "confirmada" | "potencial" | "nao_elegivel" | "dados_insuficientes";
const ELEG_COR: Record<Eleg, [string, string]> = {
  confirmada: ["#dcfce7", "#166534"], potencial: ["#fef9c3", "#854d0e"],
  nao_elegivel: ["#fee2e2", "#991b1b"], dados_insuficientes: ["#f1f5f9", "#475569"],
};
const CLASSE: Record<string, string> = { otimo: "Ótimo", bom: "Bom", suficiente: "Suficiente", regular: "Regular" };
const COR_CLASSE: Record<string, string> = { otimo: "#1d4ed8", bom: "#16a34a", suficiente: "#d97706", regular: "#dc2626" };

const card: React.CSSProperties = { background: "#fff", color: "#1f2937", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16, marginBottom: 16 };
const th: React.CSSProperties = { padding: "7px 10px", textAlign: "left", fontSize: 12, color: "#374151", background: "#f3f4f6", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "7px 10px", fontSize: 12, borderTop: "1px solid #eef0f3", color: "#1f2937", verticalAlign: "top" };
const h3: React.CSSProperties = { fontSize: 15, fontWeight: 700, margin: "0 0 10px", color: "#1e3a8a" };
const brl = (v: number | null | undefined) => (v == null ? "—" : BRL(v));

function Kpi({ rotulo, valor, sub, cor = "#1e3a8a" }: { rotulo: string; valor: string; sub?: string; cor?: string }) {
  return (
    <div style={{ ...card, marginBottom: 0, padding: 14 }}>
      <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{rotulo}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: cor, marginTop: 4 }}>{valor}</div>
      {sub && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Classe({ c }: { c?: string | null }) {
  if (!c) return <span style={{ color: "#9ca3af" }}>—</span>;
  return <span style={{ color: COR_CLASSE[c] ?? "#374151", fontWeight: 700 }}>{CLASSE[c] ?? c}</span>;
}

function Linha({ rotulo, valor, cor, dica }: { rotulo: string; valor: string; cor?: string; dica?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "5px 0", borderTop: "1px dashed #eef0f3", fontSize: 13 }}>
      <span style={{ color: "#374151" }} title={dica}>{rotulo}</span>
      <b style={{ color: cor ?? "#1f2937", whiteSpace: "nowrap" }}>{valor}</b>
    </div>
  );
}

const sinal = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${BRL(Math.abs(v))}/mês`;

function CartaoTipo({ g }: { g: any }) {
  const ops: any[] = g.oportunidades ?? [];
  const ativas = ops.filter(o => o.elegibilidade === "potencial" || o.elegibilidade === "confirmada");
  const outras = ops.filter(o => !(o.elegibilidade === "potencial" || o.elegibilidade === "confirmada"));
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 14, background: "#fcfdff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <div style={{ fontWeight: 800, color: "#1e3a8a", fontSize: 14 }}>{g.nome}</div>
        {g.equipes_cadastradas > 0 && <div style={{ fontSize: 11, color: "#6b7280" }}>{g.equipes} paga(s) · {g.equipes_cadastradas} no SIAPS</div>}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#1e3a8a", marginTop: 6 }}>{brl(g.recebe_mensal)}<span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>/mês hoje</span></div>
      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>{brl(g.recebe_anual)}/ano se mantido</div>
      {g.variacao_proxima_avaliacao_mensal !== 0 && (
        <Linha rotulo="Próxima avaliação já capturada" valor={sinal(g.variacao_proxima_avaliacao_mensal)}
          cor={g.variacao_proxima_avaliacao_mensal < 0 ? "#dc2626" : "#16a34a"} dica="Quando o MS aplicar a avaliação quadrimestral mais recente" />
      )}
      {g.melhoria_indicadores_mensal > 0 && (
        <Linha rotulo="Melhorando indicadores (1 nível)" valor={sinal(g.melhoria_indicadores_mensal)} cor="#16a34a" />
      )}
      {g.melhoria_apos_transicao_mensal > 0 && (
        <Linha rotulo="Melhoria no vínculo (após a transição)" valor={sinal(g.melhoria_apos_transicao_mensal)} cor="#6b7280" />
      )}
      {(g.fim_transicao_perdas_mensal !== 0 || g.fim_transicao_ganhos_mensal !== 0) && (
        <Linha rotulo="Fim da transição do vínculo" cor={g.fim_transicao_perdas_mensal + g.fim_transicao_ganhos_mensal < 0 ? "#dc2626" : "#16a34a"}
          valor={`${sinal(g.fim_transicao_perdas_mensal)} | ${sinal(g.fim_transicao_ganhos_mensal)}`}
          dica="Perdas das equipes abaixo de Bom | ganhos das acima de Bom" />
      )}
      {g.credenciamento_a_confirmar_mensal > 0 && (
        <Linha rotulo="Credenciamentos possíveis (a confirmar)" valor={sinal(g.credenciamento_a_confirmar_mensal)} cor="#b45309" />
      )}
      {(g.regras ?? []).length > 0 && (
        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>
          {g.regras.map((r: any) => <div key={r.componente}>• {r.componente}: {r.texto}</div>)}
        </div>
      )}
      {ativas.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
          <thead><tr><th style={{ ...th, fontSize: 11 }}>O que pode solicitar</th><th style={{ ...th, fontSize: 11 }}>Mês</th><th style={{ ...th, fontSize: 11 }}>Ano</th></tr></thead>
          <tbody>{ativas.map(o => (
            <tr key={o.id}>
              <td style={{ ...td, fontSize: 12 }}>{o.programa.replace(/^[^—]+— /, "")}{o.quantidade ? ` (${o.quantidade})` : ""}
                {o.grupo_exclusivo && <div style={{ fontSize: 10, color: "#9ca3af" }}>alternativa — conta uma vez</div>}
                {o.implantacao_total ? <div style={{ fontSize: 10, color: "#6b7280" }}>+ implantação {brl(o.implantacao_total)} (única)</div> : null}</td>
              <td style={{ ...td, fontSize: 12, whiteSpace: "nowrap", color: "#b45309", fontWeight: 700 }}>{o.incremento_mensal != null ? `+${brl(o.incremento_mensal)}` : "—"}</td>
              <td style={{ ...td, fontSize: 12, whiteSpace: "nowrap" }}>{o.incremento_anual != null ? brl(o.incremento_anual) : "—"}</td>
            </tr>))}</tbody>
        </table>
      )}
      {outras.length > 0 && (
        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>
          {outras.map(o => <div key={o.id}>• {o.programa}: <i>{o.elegibilidade_rotulo}</i>{o.custeio_unitario ? ` (${brl(o.custeio_unitario)} por unidade)` : ""}</div>)}
        </div>
      )}
      {(g.providencias ?? []).length > 0 && (
        <div style={{ marginTop: 8, background: "#f8fafc", borderRadius: 8, padding: "8px 10px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1e3a8a", marginBottom: 2 }}>Providências</div>
          {g.providencias.map((p: string) => <div key={p} style={{ fontSize: 12 }}>• {p}</div>)}
        </div>
      )}
    </div>
  );
}

function Selo({ e, rotulo }: { e: Eleg; rotulo: string }) {
  const [bg, fg] = ELEG_COR[e];
  return <span style={{ background: bg, color: fg, borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{rotulo}</span>;
}

export default function AbaSimuladorAps({ parcelaGlobal }: { parcelaGlobal?: string }) {
  const [parcela, setParcela] = useState<string | undefined>(parcelaGlobal);
  useEffect(() => { setParcela(parcelaGlobal); }, [parcelaGlobal]);
  const { data: d, isLoading, refetch } = useQuery<any>({
    queryKey: ["aps-simulador", parcela],
    queryFn: () => apiGetRaw<any>("/api/aps-simulador", parcela ? { parcela } : undefined),
  });
  const [fEleg, setFEleg] = useState<string>("");
  const [fProg, setFProg] = useState("");
  const [aberta, setAberta] = useState<string | null>(null);
  const [eqAberta, setEqAberta] = useState<string | null>(null);

  const ops: any[] = d?.oportunidades ?? [];
  const opsFiltradas = useMemo(() => ops.filter(o =>
    (!fEleg || o.elegibilidade === fEleg) && (!fProg || o.programa.toLowerCase().includes(fProg.toLowerCase()))), [ops, fEleg, fProg]);

  if (isLoading) return <div style={card}>Calculando com os dados do e-Gestor e do SIAPS…</div>;
  if (!d || d.situacao_dado !== "oficial_validado") {
    return (
      <div style={{ ...card, background: "#fffbeb", borderColor: "#fde68a" }}>
        <b>Simulador indisponível.</b> {d?.nota ?? ""}
        {(d?.lacunas ?? []).map((l: string) => <div key={l} style={{ fontSize: 13, marginTop: 6 }}>• {l}</div>)}
      </div>
    );
  }
  const k = d.kpis, p = d.perfil, t = d.transicao, dz = d.desempenho;

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ ...card, background: "linear-gradient(135deg,#1e3a8a,#1d4ed8)", color: "#fff", border: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Simulador de Financiamento e Oportunidades da APS</div>
            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>
              Competência: {d.parcela_rotulo} · CNES {d.competencia_cnes ? `${d.competencia_cnes.slice(4)}/${d.competencia_cnes.slice(0, 4)}` : "—"} · {d.nao_utiliza}
            </div>
          </div>
          <label style={{ fontSize: 12 }}>Parcela do e-Gestor{" "}
            <select value={parcela ?? d.parcela} onChange={e => setParcela(e.target.value)}
              style={{ marginLeft: 6, padding: "4px 8px", borderRadius: 6, color: "#1f2937" }}>
              {(d.parcelas ?? []).map((x: any) => <option key={x.nu_parcela} value={x.nu_parcela}>{x.rotulo}</option>)}
            </select>
          </label>
        </div>
        <div style={{ fontSize: 11, opacity: 0.85, marginTop: 8 }}>Fontes: {d.fontes.join(" · ")}</div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12, marginBottom: 16 }}>
        <Kpi rotulo="Financiamento atual (pago na parcela)" valor={brl(k.financiamento_atual_mensal)} sub={`Projeção anual ${brl(k.financiamento_atual_anual)}`} />
        <Kpi rotulo="Incremento por melhoria de indicadores" valor={`${brl(k.incremento_desempenho_mensal)}/mês`} cor="#16a34a"
          sub={`Na próxima avaliação aplicada pelo MS${k.incremento_desempenho_apos_transicao_mensal ? ` · +${brl(k.incremento_desempenho_apos_transicao_mensal)}/mês após a transição (vínculo)` : ""}`} />
        <Kpi rotulo="Mudança com a avaliação mais recente" valor={`${k.variacao_proxima_avaliacao_mensal > 0 ? "+" : ""}${brl(k.variacao_proxima_avaliacao_mensal)}/mês`}
          cor={k.variacao_proxima_avaliacao_mensal < 0 ? "#dc2626" : "#16a34a"} sub="Quando o MS aplicar a avaliação quadrimestral já capturada" />
        {(k.fim_transicao_perdas_mensal || k.fim_transicao_ganhos_mensal) ? (
          <Kpi rotulo="Fim da transição do vínculo" valor={`${brl(k.fim_transicao_perdas_mensal)}/mês`} cor="#dc2626"
            sub={`Perda das equipes abaixo de Bom quando o vínculo deixar de ser pago como “Bom” · ganho das acima: +${brl(k.fim_transicao_ganhos_mensal)}/mês`} />
        ) : null}
        <Kpi rotulo="Incremento por credenciamentos confirmados" valor={`${brl(k.incremento_credenciamento_confirmado_mensal)}/mês`} cor="#16a34a" />
        <Kpi rotulo="Credenciamentos a confirmar (não garantido)" valor={`${brl(k.incremento_credenciamento_a_confirmar_mensal)}/mês`} cor="#b45309"
          sub={`Implantação (parcela única): ${brl(k.implantacao_nao_recorrente_a_confirmar)}`} />
        <Kpi rotulo="Total potencial garantido" valor={`${brl(k.total_potencial_mensal)}/mês`} sub={`${brl(k.total_potencial_anual)}/ano`} />
        <Kpi rotulo="Total com itens a confirmar" valor={`${brl(k.total_com_a_confirmar_mensal)}/mês`} cor="#b45309" sub="Somente se os requisitos forem confirmados" />
        <Kpi rotulo="Oportunidades identificadas" valor={String(k.oportunidades)}
          sub={`${k.oportunidades_confirmadas} confirmadas · ${k.oportunidades_pendentes} a confirmar · ${k.oportunidades_dados_insuficientes} sem dados`} />
      </div>

      {/* Projeções por equipe */}
      <div style={card}>
        <h3 style={h3}>Projeções por equipe</h3>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
          Para cada tipo de equipe: quanto recebe hoje, o que muda com a próxima avaliação, quanto ganha melhorando
          indicadores, o efeito do fim da transição e o que pode solicitar. Valores “a confirmar” não são garantidos.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 12 }}>
          {(d.por_tipo ?? []).map((g: any) => <CartaoTipo key={g.tipo} g={g} />)}
        </div>
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1e3a8a" }}>Resumo em texto (respostas do ERSUS360)</summary>
          {d.respostas.map((r: any) => (
            <div key={r.pergunta} style={{ padding: "8px 0", borderTop: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{r.pergunta}</div>
              <div style={{ fontSize: 13, color: "#374151", marginTop: 2 }}>{r.resposta}</div>
            </div>
          ))}
        </details>
      </div>

      {/* Alertas e lacunas */}
      {(d.alertas.length > 0 || d.lacunas.length > 0) && (
        <div style={{ ...card, background: "#fffbeb", borderColor: "#fde68a" }}>
          <h3 style={{ ...h3, color: "#92400e" }}>Alertas normativos e informações ausentes</h3>
          {d.alertas.map((a: any, i: number) => <div key={i} style={{ fontSize: 13, marginBottom: 4 }}>⚠️ {a.texto}</div>)}
          {d.lacunas.map((l: string) => <div key={l} style={{ fontSize: 13, marginBottom: 4 }}>ℹ️ {l}</div>)}
        </div>
      )}

      {/* Perfil municipal */}
      <div style={card}>
        <h3 style={h3}>Perfil municipal</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18, fontSize: 13, marginBottom: 10 }}>
          <span><b>IED:</b> {p.estrato_texto ?? "—"}</span>
          <span><b>População (MS):</b> {p.populacao ? `${p.populacao.toLocaleString("pt-BR")} (${p.populacao_ano})` : "—"}</span>
          <span><b>Vínculo (e-Gestor):</b> {p.classificacao_vinculo_egestor ?? "—"}</span>
          <span><b>Qualidade (e-Gestor):</b> {p.classificacao_qualidade_egestor ?? "—"}</span>
          <span><b>Avaliação SIAPS:</b> {p.quadrimestre_avaliacao ?? "não capturada"}</span>
          {p.cobertura_estimada && <span title={p.cobertura_estimada.nota}><b>Capacidade de cadastro das eSF:</b> {p.cobertura_estimada.percentual}% da população</span>}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}>Tipo</th><th style={th}>Cadastradas (SIAPS)</th><th style={th}>Homologadas</th><th style={th}>Válidas</th></tr></thead>
          <tbody>{p.equipes.filter((e: any) => e.cadastradas_siaps || e.homologadas_siaps).map((e: any) => (
            <tr key={e.tipo}><td style={td}>{e.tipo}</td><td style={td}>{e.cadastradas_siaps}</td>
              <td style={td}>{e.homologadas_siaps ?? "—"}</td><td style={td}>{e.validas_siaps ?? "—"}</td></tr>))}</tbody>
        </table>
        <div style={{ fontSize: 12, color: "#475569", marginTop: 10, background: "#f8fafc", padding: 10, borderRadius: 8 }}>
          <b>Regra de pagamento identificada nesta parcela:</b>
          <ul style={{ margin: "6px 0 6px 18px", padding: 0 }}>
            {(t.regras ?? []).map((r: any) => <li key={r.componente}><b>{r.componente}:</b> {r.texto}</li>)}
          </ul>
          {t.texto} <i>({t.norma})</i>
        </div>
      </div>

      {/* Situação atual por componente */}
      <div style={card}>
        <h3 style={h3}>Situação financeira atual — valores pagos (e-Gestor)</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Componente", "Teto", "Credenc.", "Homolog.", "Pagas", "Fixo", "Vínculo", "Qualidade", "Desconto", "Total mensal", "Anual (×12)"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{d.componentes.map((c: any) => (
              <tr key={c.co}>
                <td style={td}>{c.componente}</td><td style={td}>{c.teto ?? "—"}</td><td style={td}>{c.credenciadas ?? "—"}</td>
                <td style={td}>{c.homologadas ?? "—"}</td><td style={td}>{c.pagas ?? "—"}</td>
                <td style={td}>{brl(c.vl_fixo)}</td><td style={td}>{brl(c.vl_vinculo)}</td><td style={td}>{brl(c.vl_qualidade)}</td>
                <td style={{ ...td, color: c.vl_desconto ? "#dc2626" : undefined }}>{c.vl_desconto ? brl(c.vl_desconto) : "—"}</td>
                <td style={{ ...td, fontWeight: 700 }}>{brl(c.vl_total)}</td><td style={td}>{brl((c.vl_total ?? 0) * 12)}</td>
              </tr>))}</tbody>
          </table>
        </div>
        {d.diferencas.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Diferenças financeiras identificadas</div>
            {d.diferencas.map((x: any, i: number) => <div key={i} style={{ fontSize: 12, marginBottom: 4 }}>• {x.texto}</div>)}
          </div>
        )}
      </div>

      {/* Por equipe */}
      <div style={card}>
        <h3 style={h3}>Por equipe — atual × norma com o desempenho real × potencial</h3>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
          “Pago” = valor da equipe pela regra que o MS aplicou nesta parcela (fechada com o total do e-Gestor). “Com a avaliação
          mais recente” = valor da tabela para a classificação atual da equipe no SIAPS. Clique na equipe para ver os indicadores a melhorar.
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Equipe", "Tipo", "Homolog./válida", "Pagamento", "Vínculo", "Qualidade", "Pago/mês", "Com a avaliação mais recente", "Potencial (próximo nível)"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{d.por_equipe.map((e: any) => (
              <Fragment key={e.ine}>
                <tr key={e.ine} onClick={() => setEqAberta(eqAberta === e.ine ? null : e.ine)} style={{ cursor: "pointer" }}>
                  <td style={td}><b>{e.equipe ?? "—"}</b><div style={{ color: "#9ca3af" }}>INE {e.ine}</div></td>
                  <td style={td}>{e.tipo ?? "—"}</td>
                  <td style={td}>{e.homologada == null ? "—" : `${e.homologada ? "sim" : "não"} / ${e.valida ? "sim" : "não"}`}</td>
                  <td style={td}>{!e.credenciada_egestor ? <span style={{ color: "#b45309" }}>sem credenciamento no e-Gestor</span>
                    : e.pagamento_ok ? <span style={{ color: "#16a34a" }}>pago</span> : <span style={{ color: "#dc2626" }}>com pendência</span>}</td>
                  <td style={td}><Classe c={e.vinculo?.classificacao} /></td>
                  <td style={td}><Classe c={e.qualidade?.classificacao} /></td>
                  <td style={td}>{brl(e.atual_total)}</td><td style={td}>{brl(e.norma_total)}</td>
                  <td style={td}>{e.melhoria.length ? e.melhoria.map((m: any) => (
                    <div key={m.componente}>{m.componente}: <Classe c={m.de} /> → <Classe c={m.para} /> <b>+{brl(m.incremento_mensal)}</b>
                      {m.efeito === "apos_transicao" && <span style={{ color: "#6b7280" }}> (após a transição)</span>}
                      {m.efeito === "nao_confirmado" && <span title="Pagamento não confere com os parâmetros cadastrados" style={{ color: "#b45309" }}> (não confirmado)</span>}</div>)) : "—"}
                    {(e.fim_transicao ?? []).map((f: any) => (
                      <div key={"ft" + f.componente} style={{ color: f.variacao_mensal < 0 ? "#dc2626" : "#16a34a" }}>
                        fim da transição ({f.componente} <Classe c={f.classificacao} />): {f.variacao_mensal > 0 ? "+" : ""}{brl(f.variacao_mensal)}/mês
                      </div>))}</td>
                </tr>
                {eqAberta === e.ine && (
                  <tr key={e.ine + "-d"}><td style={{ ...td, background: "#f8fafc" }} colSpan={9}>
                    {e.pendencias.length > 0 && <div style={{ marginBottom: 6 }}><b>Pendências no e-Gestor:</b> {e.pendencias.join("; ")}</div>}
                    {e.melhoria.map((m: any) => (
                      <div key={m.componente} style={{ marginBottom: 6 }}>
                        <b>{m.componente}</b> ({m.norma}): nota {m.plano?.nota_atual ?? "—"}
                        {m.plano?.possivel ? <> → {m.plano.nota_projetada}. Melhorar: {m.plano.passos.map((s: any) =>
                          `${s.indicador} (${CLASSE[s.de]}→${CLASSE[s.para]}, peso ${s.peso})`).join(", ")}</> : <> — {m.plano?.motivo}</>}
                      </div>))}
                    {e.observacoes.map((o: string) => <div key={o} style={{ color: "#6b7280" }}>ℹ️ {o}</div>)}
                  </td></tr>
                )}
              </Fragment>))}</tbody>
          </table>
        </div>
        <div style={{ fontSize: 12, color: "#475569", marginTop: 8 }}>{dz.texto}</div>
      </div>

      {/* Oportunidades */}
      <div style={card}>
        <h3 style={h3}>Oportunidades de Credenciamento e Incremento Financeiro</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <input placeholder="Filtrar programa…" value={fProg} onChange={e => setFProg(e.target.value)}
            style={{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }} />
          <select value={fEleg} onChange={e => setFEleg(e.target.value)} style={{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }}>
            <option value="">Todas as situações</option>
            <option value="confirmada">Elegibilidade confirmada</option>
            <option value="potencial">Potencialmente elegível</option>
            <option value="nao_elegivel">Não elegível</option>
            <option value="dados_insuficientes">Dados insuficientes</option>
          </select>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Programa", "Situação atual", "Perfil municipal", "Elegibilidade", "Qtd. potencial", "Incremento mensal", "Incremento anual", "Portaria", "Providência necessária"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{opsFiltradas.map((o: any) => (
              <Fragment key={o.id}>
                <tr key={o.id} onClick={() => setAberta(aberta === o.id ? null : o.id)} style={{ cursor: "pointer" }}>
                  <td style={td}><b>{o.programa}</b>{o.grupo_exclusivo && <div style={{ color: "#9ca3af" }}>alternativas excludentes: conta uma vez</div>}</td>
                  <td style={td}>{o.situacao_atual}</td><td style={td}>{o.perfil}</td>
                  <td style={td}><Selo e={o.elegibilidade} rotulo={o.elegibilidade_rotulo} /></td>
                  <td style={td}>{o.quantidade ?? "—"}</td>
                  <td style={td}>{o.incremento_mensal != null ? brl(o.incremento_mensal) : o.custeio_unitario != null ? `${brl(o.custeio_unitario)} por unidade` : "—"}</td>
                  <td style={td}>{brl(o.incremento_anual)}</td><td style={td}>{o.portaria ?? "—"}</td><td style={td}>{o.providencia}</td>
                </tr>
                {aberta === o.id && (
                  <tr key={o.id + "-d"}><td colSpan={9} style={{ ...td, background: "#f8fafc" }}>
                    <div><b>Fundamentação:</b> {o.fundamento ?? "—"}</div>
                    <div><b>Custeio mensal por unidade:</b> {brl(o.custeio_unitario)} · <b>Implantação (parcela única):</b> {brl(o.implantacao_unitaria)}
                      {o.implantacao_total ? ` · total ${brl(o.implantacao_total)}` : ""}</div>
                    {o.observacao && <div style={{ color: "#6b7280" }}>{o.observacao}</div>}
                    {o.condicoes.length > 0 && <div><b>Condições para recebimento:</b> {o.condicoes.join("; ")}</div>}
                    {o.etapas.length > 0 && <div><b>Etapas para solicitação:</b> {o.etapas.join(" → ")}</div>}
                    {o.pendencias.length > 0 && <div><b>Pendências:</b> {o.pendencias.join("; ")}</div>}
                    <div><b>Disponibilidade:</b> {o.disponibilidade}</div>
                    {!o.conta_no_total && <div style={{ color: "#b45309" }}>Não entra no total (alternativa excludente).</div>}
                  </td></tr>
                )}
              </Fragment>))}</tbody>
          </table>
        </div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
          Perfil compatível não é credenciamento aprovado nem pagamento garantido. Só “Elegibilidade confirmada” entra no total garantido.
        </div>
      </div>

      {/* Memória de cálculo */}
      <div style={card}>
        <h3 style={h3}>Memória de cálculo</h3>
        {Object.values(d.formulas).map((f: any) => <div key={f} style={{ fontSize: 12, marginBottom: 4 }}>• {f}</div>)}
      </div>

      <ParametrosNormas onMudou={() => refetch()} />
    </div>
  );
}

function ParametrosNormas({ onMudou }: { onMudou: () => void }) {
  const { data, refetch } = useQuery<any>({ queryKey: ["aps-parametros"], queryFn: () => apiGetRaw<any>("/api/aps-simulador/parametros") });
  const [form, setForm] = useState({ chave: "", valor: "", valor_texto: "", norma: "", fonte: "", justificativa: "", vigencia_inicio: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [ver, setVer] = useState(false);
  const enviar = async () => {
    setMsg(null);
    try {
      await apiPost("/api/aps-simulador/parametros", {
        chave: form.chave, valor: form.valor ? Number(form.valor) : null, valor_texto: form.valor_texto || null,
        norma: form.norma, fonte: form.fonte, justificativa: form.justificativa, vigencia_inicio: form.vigencia_inicio, nacional: false,
      });
      setMsg("Registrado — aguardando validação por outro usuário."); refetch();
    } catch (e: any) { setMsg(String(e?.response?.data?.detail ?? "Não foi possível registrar.")); }
  };
  const decidir = async (id: number, aprovar: boolean) => {
    setMsg(null);
    try { await apiPost(`/api/aps-simulador/parametros/${id}/decidir`, { aprovar }); refetch(); onMudou(); }
    catch (e: any) { setMsg(String(e?.response?.data?.detail ?? "Não foi possível decidir.")); }
  };
  const hist: any[] = data?.historico ?? [];
  const inp: React.CSSProperties = { padding: "6px 8px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12 };
  return (
    <div style={card}>
      <h3 style={h3}>Parâmetros e atualização normativa</h3>
      <div style={{ fontSize: 12, color: "#475569", marginBottom: 8 }}>{data?.monitoramento}</div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10 }}>
        <thead><tr>{["Registro", "Parâmetro", "Valor", "Norma", "Vigência", "Situação", ""].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>{hist.slice(0, 30).map(h => (
          <tr key={h.id}>
            <td style={td}>{h.registrado_em?.slice(0, 10)} · {h.origem === "egestor" ? "monitor e-Gestor" : h.registrado_por}</td>
            <td style={td}>{h.origem === "egestor" ? h.valor_texto : h.chave}<div style={{ color: "#9ca3af" }}>{h.justificativa}</div></td>
            <td style={td}>{h.valor ?? (h.origem === "egestor" ? "valores de referência" : h.valor_texto)}</td>
            <td style={td}>{h.norma}<div style={{ color: "#9ca3af" }}>{h.fonte}</div></td>
            <td style={td}>{h.vigencia_inicio}{h.vigencia_fim ? ` a ${h.vigencia_fim}` : ""}</td>
            <td style={td}>{h.situacao}</td>
            <td style={td}>{h.situacao === "pendente_validacao" && <>
              <button onClick={() => decidir(h.id, true)} style={{ marginRight: 6 }}>Validar</button>
              <button onClick={() => decidir(h.id, false)}>Rejeitar</button></>}</td>
          </tr>))}</tbody>
      </table>
      <button onClick={() => setVer(!ver)} style={{ fontSize: 12 }}>{ver ? "Fechar" : "Registrar atualização de parâmetro (norma nova)"}</button>
      {ver && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 8, marginTop: 10 }}>
          <select style={inp} value={form.chave} onChange={e => setForm({ ...form, chave: e.target.value })}>
            <option value="">Parâmetro…</option>
            {Object.keys(data?.vigentes ?? {}).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <input style={inp} placeholder="Valor (R$)" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
          <input style={inp} placeholder="ou texto (ex.: AAAAMM)" value={form.valor_texto} onChange={e => setForm({ ...form, valor_texto: e.target.value })} />
          <input style={inp} placeholder="Norma (ex.: PRT GM/MS nº …/2026, art.)" value={form.norma} onChange={e => setForm({ ...form, norma: e.target.value })} />
          <input style={inp} placeholder="Fonte (link/DOU conferido)" value={form.fonte} onChange={e => setForm({ ...form, fonte: e.target.value })} />
          <input style={inp} placeholder="Vigência a partir de (AAAAMM)" value={form.vigencia_inicio} onChange={e => setForm({ ...form, vigencia_inicio: e.target.value })} />
          <input style={{ ...inp, gridColumn: "1/-1" }} placeholder="Justificativa" value={form.justificativa} onChange={e => setForm({ ...form, justificativa: e.target.value })} />
          <button onClick={enviar}>Registrar (fica pendente de validação)</button>
        </div>
      )}
      {msg && <div style={{ fontSize: 12, marginTop: 8 }}>{msg}</div>}
    </div>
  );
}
