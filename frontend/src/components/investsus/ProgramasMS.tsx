// INVESTSUS 360 — Recursos de programação do Ministério da Saúde.
// Dados vindos da lista oficial de propostas do InvestSUS (sincronização pelo navegador
// logado no gov.br → /api/investsus/sincronizar-relay). Nada aqui é estimado: sem limite
// oficial registrado, "Teto não informado" e "Saldo não calculável".
import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, RefreshCw, History } from "lucide-react";
import { COR_TETO, fmtBRL } from "./TetoFinanceiro";

export const AREA_ROTULO: Record<string, { label: string; cor: string; bg: string }> = {
  pap: { label: "PAP — Atenção Primária à Saúde", cor: "#0369a1", bg: "#e0f2fe" },
  mac: { label: "MAC — Atenção Especializada à Saúde", cor: "#7c3aed", bg: "#f3e8ff" },
  outros: { label: "Demais programas do Ministério da Saúde", cor: "#0f766e", bg: "#ccfbf1" },
  misto: { label: "Programa com propostas PAP e MAC", cor: "#b45309", bg: "#fef3c7" },
};

const fmtData = (v?: string | null) => {
  if (!v) return "—";
  const d = new Date(v.length === 10 ? `${v}T12:00:00` : v.endsWith("Z") || v.includes("+") ? v : `${v}Z`);
  return isNaN(d.getTime()) ? v : d.toLocaleString("pt-BR", v.length === 10 ? { dateStyle: "short" } : { dateStyle: "short", timeStyle: "short" });
};
const fmtPct = (v?: number | null) => (v == null ? "—" : `${v.toFixed(1)}%`);

export function AreaSelo({ area }: { area: string }) {
  const a = AREA_ROTULO[area] ?? AREA_ROTULO.outros;
  return <span style={{ background: a.bg, color: a.cor, borderRadius: 4, padding: "1px 6px", fontSize: 10.5, fontWeight: 800, whiteSpace: "nowrap" }}>{a.label.split(" — ")[0]}</span>;
}

function Ind({ rotulo, valor, cor, bg, vazio, nota }: { rotulo: string; valor: number | null | undefined; cor: string; bg: string; vazio?: string; nota?: string }) {
  return (
    <div style={{ background: bg, borderRadius: 8, padding: "6px 9px", borderLeft: `3px solid ${cor}`, minWidth: 0 }}>
      <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.3, color: cor, textTransform: "uppercase" }}>{rotulo}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: valor == null ? "#9ca3af" : cor, whiteSpace: "nowrap" }}>
        {valor == null ? vazio ?? "Não disponível" : fmtBRL(valor)}
      </div>
      {nota && <div style={{ fontSize: 10, color: "#6b7280" }}>{nota}</div>}
    </div>
  );
}

/** Os cinco indicadores de um programa: máximo autorizado, solicitado, aprovado, pago e saldo. */
export function IndicadoresPrograma({ g }: { g: any }) {
  const excedido = !!g.acima_do_teto;
  const usado = Math.min(100, Math.max(0, g.perc_utilizado ?? 0));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(140px, 100%), 1fr))", gap: 6 }}>
        <Ind rotulo="Valor máximo autorizado" valor={g.valor_maximo} cor={COR_TETO.teto} bg="#eff6ff" vazio="Teto não informado" />
        <Ind rotulo="Valor já solicitado" valor={g.solicitado ?? g.valor_solicitado} cor={COR_TETO.utilizado} bg="#fff7ed" />
        <Ind rotulo="Valor aprovado" valor={g.aprovado ?? 0} cor="#0e7490" bg="#ecfeff" />
        <Ind rotulo="Valor pago" valor={g.pago ?? 0} cor="#4338ca" bg="#eef2ff" />
        <Ind rotulo={excedido ? "Saldo (excedido)" : "Saldo p/ solicitação"} valor={g.saldo} vazio="Saldo não calculável"
          cor={excedido ? COR_TETO.excedido : COR_TETO.saldo} bg={excedido ? "#fef2f2" : "#ecfdf5"}
          nota={g.valor_maximo != null ? `${fmtPct(g.perc_disponivel)} do máximo` : undefined} />
      </div>
      {g.valor_maximo != null && (
        <div>
          <div style={{ display: "flex", height: 7, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: `${usado}%`, background: excedido ? COR_TETO.excedido : COR_TETO.utilizado }} />
            <div style={{ flex: 1, background: COR_TETO.saldo, opacity: 0.35 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, marginTop: 2 }}>
            <span style={{ color: COR_TETO.utilizado, fontWeight: 600 }}>Comprometido {fmtPct(g.perc_utilizado)}</span>
            <span style={{ color: COR_TETO.saldo, fontWeight: 600 }}>Disponível {fmtPct(g.perc_disponivel)}</span>
          </div>
        </div>
      )}
      <div style={{ fontSize: 10.5, color: "#6b7280" }}>
        Saldo p/ solicitação = máximo autorizado − valor comprometido (um estágio por proposta, sem canceladas/rejeitadas).
        Não é saldo financeiro em conta.
      </div>
    </div>
  );
}

const CATEGORIAS = [
  { k: "incremento_mac", rotulo: "Incremento MAC" },
  { k: "incremento_pap", rotulo: "Incremento PAP" },
  { k: "outros", rotulo: "Outros tipos (programas)" },
];

/** Cabeçalho de sincronização + conferência com o gráfico da tela Propostas do InvestSUS. */
export function SincronizacaoProgramas({ sinc, onSincronizar }: { sinc: any; onSincronizar?: () => void }) {
  const conf = sinc?.conferencia_tipos;
  const ers = conf?.ersus ?? {};
  const inv = conf?.investsus;
  const tot = (o: any, campo: string) => CATEGORIAS.reduce((s, c) => s + (o?.[c.k]?.[campo] ?? 0), 0);
  const th: React.CSSProperties = { padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap" };
  const td: React.CSSProperties = { padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap", color: "#111827" };
  const linhas = [...CATEGORIAS, { k: "_total", rotulo: "Total" }];
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 10, background: "#f8fafc", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ fontSize: 11.5, color: "#374151", lineHeight: 1.6 }}>
          <b>Fonte:</b> lista oficial de propostas do InvestSUS (MS), captada pelo navegador logado no gov.br.<br />
          <b>Última atualização das propostas:</b> {fmtData(sinc?.ultima_consulta_investsus)}
          {sinc?.ultima_conferencia && <> · <b>Última conferência completa:</b> {fmtData(sinc.ultima_conferencia.capturado_em)}
            {sinc.ultima_conferencia.investsus_total != null && ` (${sinc.ultima_conferencia.investsus_total} propostas na lista oficial)`}</>}
        </div>
        {onSincronizar && (
          <button onClick={onSincronizar}
            style={{ padding: "7px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: "#0f766e", color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={13} /> Sincronizar propostas do InvestSUS
          </button>
        )}
      </div>
      {conf && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
            <thead>
              <tr style={{ color: "#6b7280" }}>
                <th style={{ ...th, textAlign: "left" }}>Conferência {conf.exercicio} (gráfico do InvestSUS)</th>
                <th style={th}>InvestSUS — propostas</th>
                <th style={th}>ERSUS360 — propostas</th>
                <th style={th}>ERSUS360 — ativas</th>
                <th style={th}>ERSUS360 — valor ativas</th>
                <th style={{ ...th, textAlign: "left" }}>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map(c => {
                const iv = c.k === "_total" ? (inv ? tot(inv, "qtd") : null) : inv ? (inv[c.k]?.qtd ?? 0) : null;
                const eq = c.k === "_total" ? tot(ers, "qtd") : ers[c.k]?.qtd ?? 0;
                const ea = c.k === "_total" ? tot(ers, "qtd_ativas") : ers[c.k]?.qtd_ativas ?? 0;
                const ev = c.k === "_total" ? tot(ers, "valor_ativas") : ers[c.k]?.valor_ativas ?? 0;
                const ok = iv != null && iv === eq;
                return (
                  <tr key={c.k} style={{ borderTop: "1px solid #e5e7eb", fontWeight: c.k === "_total" ? 800 : 400 }}>
                    <td style={{ ...td, textAlign: "left" }}>{c.rotulo}</td>
                    <td style={td}>{iv ?? "—"}</td>
                    <td style={td}>{eq}</td>
                    <td style={td}>{ea}</td>
                    <td style={td}>{fmtBRL(ev)}</td>
                    <td style={{ ...td, textAlign: "left", color: iv == null ? "#6b7280" : ok ? "#047857" : "#b45309", fontWeight: 700 }}>
                      {iv == null ? "Aguardando sincronização completa" : ok ? "Confere" : `Diferença de ${eq - iv}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ fontSize: 10.5, color: "#6b7280", marginTop: 4, lineHeight: 1.5 }}>
            Categoria pelo tipo oficial da proposta (INCREMENTO MAC / INCREMENTO PAP / demais tipos). O ERSUS360 não grava propostas
            que já chegam canceladas, então a coluna do InvestSUS pode ser maior nas canceladas.
            {conf.ersus_sem_tipo_oficial > 0 && ` ${conf.ersus_sem_tipo_oficial} proposta(s) ainda sem tipo oficial gravado — sincronize para classificá-las.`}
          </div>
        </div>
      )}
    </div>
  );
}

/** Tabela gerencial das propostas de programa com filtros e histórico. */
export function TabelaPropostasProgramas({ programas }: { programas: any[] }) {
  const [fProg, setFProg] = useState("");
  const [fArea, setFArea] = useState("");
  const [fSit, setFSit] = useState("");
  const [fPort, setFPort] = useState("");
  const [incluirExcl, setIncluirExcl] = useState(false);
  const [aberta, setAberta] = useState<number | null>(null);

  const todas = useMemo(() => programas.flatMap(g => [
    ...g.propostas.map((l: any) => ({ ...l, programa: g.programa, area: l.area ?? g.area, excluida: false })),
    ...(g.excluidas ?? []).map((l: any) => ({ ...l, programa: g.programa, area: l.area ?? g.area, excluida: true })),
  ]), [programas]);
  const situacoes = useMemo(() => [...new Set(todas.map(l => l.situacao_oficial || l.situacao).filter(Boolean))].sort(), [todas]);
  const linhas = todas.filter(l =>
    (incluirExcl || !l.excluida) && (!fProg || l.programa === fProg) && (!fArea || l.area === fArea)
    && (!fSit || (l.situacao_oficial || l.situacao) === fSit)
    && (!fPort || `${l.portaria_numero ?? ""} ${l.portaria_data ?? ""}`.toLowerCase().includes(fPort.toLowerCase())));
  const soma = (c: string) => linhas.reduce((s, l) => s + (Number(l[c]) || 0), 0);

  const sel: React.CSSProperties = { padding: "5px 8px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12, background: "#fff", color: "#111827", maxWidth: 260 };
  const th: React.CSSProperties = { padding: "6px 8px", textAlign: "left", whiteSpace: "nowrap" };
  const td: React.CSSProperties = { padding: "6px 8px", color: "#111827", verticalAlign: "top" };
  const num: React.CSSProperties = { ...td, textAlign: "right", whiteSpace: "nowrap" };
  if (!todas.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>Propostas de programas — detalhamento</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <select style={sel} value={fProg} onChange={e => setFProg(e.target.value)} aria-label="Programa">
          <option value="">Todos os programas</option>
          {programas.map(g => <option key={g.programa} value={g.programa}>{g.programa}</option>)}
        </select>
        <select style={sel} value={fArea} onChange={e => setFArea(e.target.value)} aria-label="Área">
          <option value="">PAP, MAC e outros</option>
          <option value="pap">PAP</option><option value="mac">MAC</option><option value="outros">Outros programas</option>
        </select>
        <select style={sel} value={fSit} onChange={e => setFSit(e.target.value)} aria-label="Situação">
          <option value="">Todas as situações</option>
          {situacoes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input style={{ ...sel, width: 170 }} placeholder="Portaria (nº ou data)" value={fPort} onChange={e => setFPort(e.target.value)} />
        <label style={{ fontSize: 11.5, color: "#374151", display: "flex", alignItems: "center", gap: 4 }}>
          <input type="checkbox" checked={incluirExcl} onChange={e => setIncluirExcl(e.target.checked)} /> incluir canceladas/rejeitadas
        </label>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
          <thead>
            <tr style={{ color: "#6b7280", background: "#f9fafb" }}>
              <th style={th}></th><th style={th}>Proposta</th><th style={th}>Exercício</th><th style={th}>Programa</th><th style={th}>Área</th>
              <th style={th}>Tipo (InvestSUS)</th><th style={th}>Ação orçamentária</th><th style={th}>Situação oficial</th><th style={th}>Portaria</th>
              <th style={{ ...th, textAlign: "right" }}>Solicitado</th><th style={{ ...th, textAlign: "right" }}>Aprovado</th>
              <th style={{ ...th, textAlign: "right" }}>Empenhado</th><th style={{ ...th, textAlign: "right" }}>Pago</th><th style={th}>Atualizado</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(l => (
              <Fragment key={l.id}>
                <tr style={{ borderTop: "1px solid #f3f4f6", opacity: l.excluida ? 0.6 : 1 }}>
                  <td style={td}>
                    <button title="Histórico da proposta" onClick={() => setAberta(aberta === l.id ? null : l.id)}
                      style={{ border: "none", background: "none", cursor: "pointer", padding: 0, color: "#1e3a5f", display: "flex", alignItems: "center" }}>
                      {aberta === l.id ? <ChevronDown size={13} /> : <ChevronRight size={13} />}<History size={12} />
                    </button>
                  </td>
                  <td style={{ ...td, fontFamily: "monospace", whiteSpace: "nowrap" }} title={l.objeto ?? ""}>{l.numero_proposta}</td>
                  <td style={td}>{l.exercicio ?? "—"}</td>
                  <td style={{ ...td, minWidth: 160 }}>{l.programa}</td>
                  <td style={td}><AreaSelo area={l.area} /></td>
                  <td style={td}>{[l.tipo_recurso, l.tipo_proposta].filter(Boolean).join(" · ") || "—"}</td>
                  <td style={td}>{l.acao_orcamentaria || "—"}</td>
                  <td style={{ ...td, minWidth: 150 }}>{l.situacao_oficial || l.situacao || "—"}</td>
                  <td style={td}>{l.portaria_numero ? `${l.portaria_numero}${l.portaria_data ? ` de ${fmtData(l.portaria_data)}` : ""}` : "—"}</td>
                  <td style={num}>{fmtBRL(l.valor_solicitado)}</td>
                  <td style={num}>{fmtBRL(l.valor_aprovado)}</td>
                  <td style={num}>{fmtBRL(l.valor_empenhado)}</td>
                  <td style={{ ...num, fontWeight: 700 }}>{fmtBRL(l.valor_pago)}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>{fmtData(l.ultima_consulta_investsus)}</td>
                </tr>
                {aberta === l.id && (
                  <tr>
                    <td></td>
                    <td colSpan={13} style={{ ...td, background: "#f9fafb", fontSize: 11 }}>
                      <div style={{ marginBottom: 4, color: "#374151" }}>
                        <b>Referência oficial:</b> InvestSUS → Propostas → nº {l.numero_proposta}
                        {l.numero_instrumento ? ` · instrumento ${l.numero_instrumento}` : ""} · fonte do registro: {l.fonte ?? "—"}
                      </div>
                      {(l.historico ?? []).length === 0 ? <span style={{ color: "#9ca3af" }}>Sem movimentações registradas.</span> : (
                        <ul style={{ margin: 0, paddingLeft: 16 }}>
                          {l.historico.map((h: any, i: number) => (
                            <li key={i}>{fmtData(h.data)} — {h.anterior ? `${h.anterior} → ` : ""}<b>{h.nova}</b> ({h.origem})</li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            <tr style={{ borderTop: "2px solid #e5e7eb", background: "#f9fafb", fontWeight: 800 }}>
              <td></td><td style={td} colSpan={8}>{linhas.length} proposta(s) filtrada(s)</td>
              <td style={num}>{fmtBRL(soma("valor_solicitado"))}</td><td style={num}>{fmtBRL(soma("valor_aprovado"))}</td>
              <td style={num}>{fmtBRL(soma("valor_empenhado"))}</td><td style={num}>{fmtBRL(soma("valor_pago"))}</td><td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
