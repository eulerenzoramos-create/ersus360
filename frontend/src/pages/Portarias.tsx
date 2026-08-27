// Módulo 6 — Banco de Portarias
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPortarias, type Portaria, apiGet, apiPost } from "../lib/api";
import { Search, Plus, FileText, Trash2, ExternalLink, Mail, Play, RotateCcw, Eye, Pause, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

const S = {
  page: { padding: 20 } as React.CSSProperties,
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } as React.CSSProperties,
  title: { fontSize: 16, fontWeight: 600 } as React.CSSProperties,
  card: { background: "#fff", borderRadius: 8, border: "1px solid #e5e5e3", padding: 16, marginBottom: 10 } as React.CSSProperties,
  row: { display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" as const } as React.CSSProperties,
  input: { border: "1px solid #e5e5e3", borderRadius: 6, padding: "7px 10px", fontSize: 13, flex: 1, minWidth: 180 } as React.CSSProperties,
  btn: { padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 5 } as React.CSSProperties,
  badge: (cor: string) => ({ background: cor, color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 500 }) as React.CSSProperties,
  valor: { fontSize: 13, color: "#059669", fontWeight: 600 } as React.CSSProperties,
  sub: { fontSize: 12, color: "#737373", marginTop: 3 } as React.CSSProperties,
};

const BLOCOS = ["Atenção Básica", "MAC", "Vigilância em Saúde", "Farmácia", "Custeio e investimento"];

const COR_BLOCO: Record<string, string> = {
  "Atenção Básica": "#059669",
  "MAC": "#dc2626",
  "Vigilância em Saúde": "#7c3aed",
  "Farmácia": "#0284c7",
  "Custeio e investimento": "#d97706",
};

function NovaPortariaModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    numero: "", ano: new Date().getFullYear(), orgao_emissor: "GM/MS",
    programa: "", bloco: "Atenção Básica", objeto: "",
    data_publicacao: "", valor_total: 0,
  });

  const mutation = useMutation({
    mutationFn: () => apiPortarias.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portarias"] }); onClose(); },
  });

  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: "#fff", borderRadius: 10, padding: 24, width: 520, maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Nova Portaria</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            ["Número", "numero", "text"],
            ["Ano", "ano", "number"],
            ["Órgão Emissor", "orgao_emissor", "text"],
            ["Data Publicação", "data_publicacao", "date"],
          ].map(([label, key, type]) => (
            <div key={key}>
              <div style={{ fontSize: 11, color: "#737373", marginBottom: 3 }}>{label}</div>
              <input
                type={type}
                value={(form as Record<string, unknown>)[key] as string}
                onChange={(e) => set(key, type === "number" ? Number(e.target.value) : e.target.value)}
                style={{ ...S.input, width: "100%", boxSizing: "border-box" }}
              />
            </div>
          ))}
          <div>
            <div style={{ fontSize: 11, color: "#737373", marginBottom: 3 }}>Bloco</div>
            <select value={form.bloco} onChange={(e) => set("bloco", e.target.value)} style={{ ...S.input, width: "100%", boxSizing: "border-box" }}>
              {BLOCOS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#737373", marginBottom: 3 }}>Valor Total (R$)</div>
            <input type="number" value={form.valor_total} onChange={(e) => set("valor_total", Number(e.target.value))} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, color: "#737373", marginBottom: 3 }}>Programa</div>
          <input value={form.programa} onChange={(e) => set("programa", e.target.value)} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
        </div>
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, color: "#737373", marginBottom: 3 }}>Objeto / Descrição</div>
          <textarea value={form.objeto} onChange={(e) => set("objeto", e.target.value)} rows={3} style={{ ...S.input, width: "100%", boxSizing: "border-box", resize: "vertical" }} />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ ...S.btn, background: "#f5f5f3" }}>Cancelar</button>
          <button onClick={() => mutation.mutate()} style={{ ...S.btn, background: "#1D9E75", color: "#fff" }} disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Painel Envios Diários ─────────────────────────────────────────────────────

const COR_REL: Record<string, string> = { apui: "#059669", amazonas: "#7c3aed", federal: "#0284c7", outros: "#6b7280" };
const BG_REL:  Record<string, string> = { apui: "#f0fdf4", amazonas: "#faf5ff", federal: "#eff6ff", outros: "#f8fafc" };
const LABEL_REL: Record<string, string> = { apui: "📍 Apuí/AM", amazonas: "🏛 Estado AM", federal: "🇧🇷 Federal MS", outros: "📄 Outros" };

function InformeCard({ inf, idx, selecionado, onToggle }: { inf: any; idx: number; selecionado: boolean; onToggle: () => void }) {
  const [aberto, setAberto] = useState(false);
  const cor = COR_REL[inf.relevancia] || "#6b7280";
  const bg  = selecionado ? `${cor}10` : (BG_REL[inf.relevancia] || "#f8fafc");
  return (
    <div style={{ border: `1px solid ${selecionado ? cor : cor+"30"}`, borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: bg }}>
        {/* Checkbox de seleção */}
        <input
          type="checkbox"
          checked={selecionado}
          onChange={onToggle}
          onClick={e => e.stopPropagation()}
          style={{ width: 16, height: 16, cursor: "pointer", accentColor: cor, flexShrink: 0 }}
        />
        <span style={{ fontSize: 10, fontWeight: 700, color: cor, background: `${cor}18`, border: `1px solid ${cor}40`, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" as const }}>
          {LABEL_REL[inf.relevancia]}
        </span>
        <span
          onClick={() => setAberto(a => !a)}
          style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", flex: 1, cursor: "pointer" }}
        >{inf.titulo}</span>
        <span onClick={() => setAberto(a => !a)} style={{ fontSize: 11, color: "#94a3b8", cursor: "pointer" }}>{aberto ? "▲" : "▼"}</span>
      </div>

      {aberto && (
        <div style={{ padding: "12px 14px", background: "#fff", display: "flex", flexDirection: "column" as const, gap: 8 }}>
          {/* Metadados */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
            {inf.numero && (
              <div style={{ fontSize: 11 }}>
                <span style={{ color: "#94a3b8" }}>Número </span>
                <span style={{ color: "#1e293b", fontWeight: 600 }}>{inf.numero}</span>
              </div>
            )}
            {inf.data_pub && (
              <div style={{ fontSize: 11 }}>
                <span style={{ color: "#94a3b8" }}>Publicação </span>
                <span style={{ color: "#1e293b", fontWeight: 600 }}>{inf.data_pub}</span>
              </div>
            )}
            <div style={{ fontSize: 11 }}>
              <span style={{ color: "#94a3b8" }}>Órgão </span>
              <span style={{ color: "#1e293b", fontWeight: 600 }}>{inf.orgao || "Ministério da Saúde"}</span>
            </div>
          </div>

          {/* Resumo */}
          {inf.resumo && inf.resumo !== "(Acesse o link para ver o conteúdo completo)" && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 3 }}>Resumo</div>
              <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6, background: "#f8fafc", borderRadius: 6, padding: "8px 10px" }}>
                {inf.resumo}
              </div>
            </div>
          )}

          {/* Impacto para Apuí */}
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, padding: "8px 10px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 3 }}>⚡ Impacto para Apuí/AM</div>
            <div style={{ fontSize: 12, color: "#78350f", lineHeight: 1.5 }}>{inf.impacto}</div>
          </div>

          {/* Link DOU */}
          {(() => {
            const isDireto = inf.link && inf.link.includes("in.gov.br/web/dou");
            return (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, alignItems: "center" }}>
                <a href={inf.link} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#fff", fontWeight: 600, textDecoration: "none", background: "#1d4ed8", padding: "7px 16px", borderRadius: 6 }}>
                  <ExternalLink size={12} /> {isDireto ? "Abrir Portaria no DOU" : "Buscar Portaria no DOU"}
                </a>
                {!isDireto && (
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>
                    (link direto não disponível — abrirá busca específica)
                  </span>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

function BuscaRetroativa() {
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());

  const toggleSelecao = (idx: number) =>
    setSelecionados(prev => { const s = new Set(prev); s.has(idx) ? s.delete(idx) : s.add(idx); return s; });

  const toggleTodos = () => {
    const informes: any[] = resultado?.informes || [];
    setSelecionados(prev => prev.size === informes.length ? new Set() : new Set(informes.map((_: any, i: number) => i)));
  };

  const buscar = async () => {
    setLoading(true); setErro(null); setResultado(null); setSelecionados(new Set());
    try {
      const r = await apiGet(`/api/email-diario/buscar-dou?data=${data}`);
      setResultado(r);
    } catch (e: any) {
      setErro(e?.message || "Erro ao consultar o DOU.");
    } finally { setLoading(false); }
  };

  const enviar = async () => {
    setEnviando(true); setErro(null);
    try {
      await apiGet(`/api/email-diario/buscar-dou?data=${data}&enviar=true`);
      setResultado((prev: any) => ({ ...prev, enviado: true }));
    } catch (e: any) {
      setErro(e?.message || "Erro ao enviar e-mail.");
    } finally { setEnviando(false); }
  };

  const informes: any[] = resultado?.informes || [];
  const apui    = resultado?.apui    || [];
  const federal = resultado?.federal || [];
  const amazonas= resultado?.amazonas|| [];
  const outros  = resultado?.outros  || [];

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20, marginBottom: 20 }}>
      {/* Título */}
      <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
        <Search size={14} /> Agente de Busca — Portarias MS no DOU
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        Selecione a data e o agente busca, classifica e gera informes automáticos para Apuí/AM e portarias federais do MS.
      </div>

      {/* Controles */}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" as const, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Data de referência</div>
          <input type="date" value={data} onChange={e => setData(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "7px 10px", fontSize: 13 }} />
        </div>
        <button onClick={buscar} disabled={loading}
          style={{ padding: "9px 20px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Search size={13} />{loading ? "Buscando no DOU…" : "Buscar e Gerar Informes"}
        </button>
        {resultado && !resultado.enviado && (
          <button onClick={enviar} disabled={enviando}
            style={{ padding: "9px 20px", background: "#059669", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Mail size={13} />{enviando ? "Enviando…" : "Enviar e-mail"}
          </button>
        )}
        {resultado?.informes?.length > 0 && (
          <button
            onClick={() => {
              const COR_D: Record<string,string> = { apui:"#059669", amazonas:"#7c3aed", federal:"#0284c7", outros:"#6b7280" };
              const LBL_D: Record<string,string> = { apui:"📍 Apuí/AM", amazonas:"🏛 Estado AM", federal:"🇧🇷 Federal MS", outros:"📄 Outros" };
              const dt = new Date(resultado.data + "T12:00:00").toLocaleDateString("pt-BR");
              const lista = selecionados.size > 0
                ? (resultado.informes as any[]).filter((_: any, i: number) => selecionados.has(i))
                : (resultado.informes as any[]);
              const itens = lista.map((inf: any, i: number) => {
                const cor = COR_D[inf.relevancia] || "#0284c7";
                const lbl = LBL_D[inf.relevancia] || "Federal MS";
                const temResumo = inf.resumo && inf.resumo !== "(Acesse o link para ver o conteúdo completo)";
                const textoTecnico = (() => {
                  const t = ((inf.resumo || "") + " " + (inf.titulo || "")).toLowerCase();
                  const partes: string[] = [];
                  if (/financiamento|repasse|transfer|recurso|fundo/.test(t))
                    partes.push("Esta portaria tem implicações financeiras diretas para o município. Recomenda-se verificar competência, valor e prazo de execução.");
                  if (/aten.o prim|aten.o b.sica|aps|esf|acs|agente comunit/.test(t))
                    partes.push("Trata de Atenção Primária à Saúde. Avaliar impacto nas equipes de ESF/ACS e nos indicadores de cobertura.");
                  if (/meta|indicador|avalia.o|desempenho|score/.test(t))
                    partes.push("Envolve metas e indicadores de desempenho. Verificar cumprimento e registros no sistema de monitoramento.");
                  if (/prazo|habilita.o|credenciamento|ades.o|inscri.o/.test(t))
                    partes.push("Contém prazo para habilitação, adesão ou credenciamento. Verificar data limite e providenciar documentação.");
                  if (/apuí|apui|1300144/.test(t))
                    partes.push("Portaria com referência direta ao município de Apuí/AM. Ação imediata recomendada pela gestão.");
                  if (/vigilância|epidemiol|notifica|surto|emergência/.test(t))
                    partes.push("Relacionada à Vigilância em Saúde. Verificar obrigações de notificação e protocolos vigentes.");
                  if (partes.length === 0)
                    partes.push("Recomenda-se leitura integral da portaria para verificar aplicabilidade ao município e possíveis obrigações administrativas.");
                  return partes.join(" ");
                })();
                return `
                  <div style="border-left:4px solid ${cor};margin-bottom:32px;padding:0 0 20px 18px;page-break-inside:avoid;">
                    <div style="margin-bottom:8px;display:flex;align-items:center;gap:10px;">
                      <span style="font-size:10px;font-weight:700;color:${cor};background:${cor}18;border:1px solid ${cor}40;padding:2px 10px;border-radius:20px;">${lbl}</span>
                      <span style="font-size:11px;color:#94a3b8;">#${i+1}</span>
                    </div>
                    <div style="font-size:15px;font-weight:700;color:#1e293b;margin-bottom:10px;line-height:1.4;">${inf.titulo || "(sem título)"}</div>
                    <table style="font-size:11px;color:#64748b;border-collapse:collapse;margin-bottom:12px;background:#f8fafc;padding:8px;border-radius:6px;width:100%;">
                      ${inf.numero ? `<tr><td style="padding:3px 20px 3px 0;font-weight:700;color:#374151;white-space:nowrap;">Número</td><td>${inf.numero}</td></tr>` : ""}
                      ${inf.data_pub ? `<tr><td style="padding:3px 20px 3px 0;font-weight:700;color:#374151;white-space:nowrap;">Publicação DOU</td><td>${inf.data_pub}</td></tr>` : ""}
                      <tr><td style="padding:3px 20px 3px 0;font-weight:700;color:#374151;white-space:nowrap;">Órgão Emissor</td><td>${inf.orgao || "Ministério da Saúde"}</td></tr>
                    </table>
                    ${temResumo ? `
                    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#64748b;margin-bottom:6px;">Ementa / Resumo</div>
                    <div style="font-size:12px;color:#374151;line-height:1.8;background:#f8fafc;padding:12px;border-radius:6px;margin-bottom:12px;border-left:2px solid #e2e8f0;">
                      ${inf.resumo}
                    </div>` : ""}
                    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:12px;margin-bottom:12px;">
                      <div style="font-size:10px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">⚡ Análise para o Gestor — Apuí/AM</div>
                      <div style="font-size:12px;color:#78350f;line-height:1.7;">${textoTecnico}</div>
                    </div>
                    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:10px;">
                      <div style="font-size:10px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">🔗 Portaria Completa no DOU</div>
                      <a href="${inf.link}" style="font-size:12px;color:#1d4ed8;word-break:break-all;">${inf.link}</a>
                    </div>
                  </div>`;
              }).join("");
              const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
                <title>Informe Portarias MS — ${dt}</title>
                <style>
                  body{font-family:Arial,sans-serif;margin:40px;color:#1e293b;font-size:13px;}
                  @media print{.no-print{display:none}body{margin:20px}}
                  h1{font-size:18px;color:#1d4ed8;margin-bottom:4px;}
                  .meta{font-size:12px;color:#64748b;margin-bottom:24px;border-bottom:2px solid #e2e8f0;padding-bottom:12px;}
                </style></head><body>
                <div class="no-print" style="margin-bottom:16px;">
                  <button onclick="window.print()" style="padding:8px 20px;background:#1d4ed8;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;">🖨 Imprimir / Salvar PDF</button>
                </div>
                <h1>📋 Informe de Portarias — Ministério da Saúde</h1>
                <div class="meta">
                  <strong>Município:</strong> Apuí/AM — IBGE 1300144 &nbsp;|&nbsp;
                  <strong>Data DOU:</strong> ${dt} &nbsp;|&nbsp;
                  <strong>Total de informes:</strong> ${lista.length} &nbsp;|&nbsp;
                  <strong>Gerado pelo ERSUS 360</strong>
                </div>
                ${itens}
              </body></html>`;
              const w = window.open("", "_blank");
              if (w) { w.document.write(html); w.document.close(); }
            }}
            style={{ padding: "9px 20px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <FileText size={13} /> Gerar Documento
          </button>
        )}
        {resultado?.enviado && <span style={{ fontSize: 12, color: "#059669", fontWeight: 700 }}>✓ E-mail enviado</span>}
      </div>

      {erro && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#991b1b", marginBottom: 12 }}>{erro}</div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: 24, color: "#1d4ed8", fontSize: 13 }}>
          ⏳ Consultando o Diário Oficial da União…
        </div>
      )}

      {resultado && (
        <div>
          {/* Resumo KPIs */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const, marginBottom: 16 }}>
            {[
              { label: "Total DOU",    val: resultado.total,    cor: "#1d4ed8", bg: "#eff6ff" },
              { label: "Apuí/AM",      val: apui.length,        cor: "#059669", bg: "#f0fdf4" },
              { label: "Federal MS",   val: federal.length,     cor: "#0284c7", bg: "#f0f9ff" },
              { label: "Estado AM",    val: amazonas.length,    cor: "#7c3aed", bg: "#faf5ff" },
              { label: "Outros",       val: outros.length,      cor: "#6b7280", bg: "#f8fafc" },
            ].map(k => (
              <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.cor}30`, borderRadius: 8, padding: "8px 14px", minWidth: 80, textAlign: "center" as const }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: k.cor }}>{k.val}</div>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Informes — Apuí + Federal */}
          {informes.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" as const }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>
                  📋 Informes Gerados ({informes.length}) — Apuí/AM e Federal MS
                </div>
                <button onClick={toggleTodos} style={{ fontSize: 11, padding: "3px 10px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8fafc", cursor: "pointer", color: "#475569" }}>
                  {selecionados.size === informes.length ? "Desmarcar todos" : "Selecionar todos"}
                </button>
                {selecionados.size > 0 && (
                  <span style={{ fontSize: 11, color: "#1d4ed8", fontWeight: 600 }}>
                    {selecionados.size} selecionada(s) — clique em "Gerar Documento" para gerar apenas estas
                  </span>
                )}
              </div>
              {informes.map((inf: any, i: number) => (
                <InformeCard key={i} inf={inf} idx={i} selecionado={selecionados.has(i)} onToggle={() => toggleSelecao(i)} />
              ))}
            </div>
          )}

          {/* Outros — colapsados */}
          {outros.length > 0 && (
            <details style={{ marginBottom: 8 }}>
              <summary style={{ fontSize: 12, color: "#6b7280", cursor: "pointer", fontWeight: 600 }}>
                📄 Outros atos MS ({outros.length}) — sem classificação direta para Apuí
              </summary>
              <div style={{ marginTop: 8 }}>
                {outros.map((p: any, i: number) => (
                  <InformeCard key={i} inf={p} idx={i} selecionado={false} onToggle={() => {}} />
                ))}
              </div>
            </details>
          )}

          {resultado.total === 0 && (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8", fontSize: 13 }}>
              Nenhuma portaria do Ministério da Saúde encontrada para esta data no DOU.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PainelEnviosDiarios() {
  const qc = useQueryClient();

  const { data: status, isLoading: loadingStatus, refetch } = useQuery({
    queryKey: ["email-diario-status"],
    queryFn: () => apiGet("/api/email-diario/status"),
    staleTime: 30_000,
    retry: false,
  });

  const enviarAgora = useMutation({
    mutationFn: () => apiPost("/api/email-diario/enviar-agora", {}),
    onSuccess: () => { refetch(); },
  });

  const pausar = useMutation({
    mutationFn: () => apiPost("/api/email-diario/pausar", {}),
    onSuccess: () => { refetch(); },
  });

  const retomar = useMutation({
    mutationFn: () => apiPost("/api/email-diario/retomar", {}),
    onSuccess: () => { refetch(); },
  });

  const statusIcon = (s: string) => {
    if (s === "enviado" || s === "reenviado") return <CheckCircle size={13} color="#16a34a" />;
    if (s === "falha") return <XCircle size={13} color="#dc2626" />;
    if (s === "pendente") return <Clock size={13} color="#d97706" />;
    if (s === "pausado") return <Pause size={13} color="#6b7280" />;
    return <AlertCircle size={13} color="#94a3b8" />;
  };

  const statusCor = (s: string) => ({
    enviado: "#16a34a", reenviado: "#16a34a", falha: "#dc2626",
    pendente: "#d97706", pausado: "#6b7280",
  }[s] || "#94a3b8");

  if (loadingStatus) return (
    <div style={{ textAlign: "center", padding: 24, color: "#94a3b8", fontSize: 13 }}>
      Carregando painel de envios…
    </div>
  );

  const st = status as any;

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #bfdbfe", overflow: "hidden", marginBottom: 20 }}>
      {/* Header */}
      <div style={{ background: "#1d4ed8", padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
        <Mail size={16} color="#fff" />
        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Envios Diários — Agente de Portarias MS</span>
        {st?.pausado && (
          <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 800, color: "#fbbf24", background: "rgba(251,191,36,0.2)", border: "1px solid #fbbf24", padding: "2px 10px", borderRadius: 20 }}>⏸ PAUSADO</span>
        )}
      </div>

      <div style={{ padding: "20px 24px" }}>
        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Próximo envio",       val: st?.proximo_envio || "—",         cor: "#1d4ed8", bg: "#eff6ff", bd: "#bfdbfe" },
            { label: "Último envio",        val: st?.ultimo_envio || "Nenhum",      cor: "#15803d", bg: "#f0fdf4", bd: "#bbf7d0" },
            { label: "Destinatário",        val: st?.destinatario || "—",          cor: "#475569", bg: "#f8fafc", bd: "#e5e7eb" },
            { label: "Portarias (último)",  val: String(st?.qtd_portarias_ultimo ?? 0), cor: "#d97706", bg: "#fffbeb", bd: "#fde68a" },
            { label: "Informes (último)",   val: String(st?.qtd_informes_ultimo ?? 0),  cor: "#7c3aed", bg: "#f5f3ff", bd: "#c4b5fd" },
          ].map(k => (
            <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.bd}`, borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 0.5 }}>{k.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: k.cor, marginTop: 4, wordBreak: "break-all" as const }}>{k.val}</div>
            </div>
          ))}
          <div style={{ background: st?.status_atual === "falha" ? "#fef2f2" : "#f8fafc", border: `1px solid ${st?.status_atual === "falha" ? "#fca5a5" : "#e5e7eb"}`, borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Status</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
              {statusIcon(st?.status_atual || "")}
              <span style={{ fontSize: 13, fontWeight: 700, color: statusCor(st?.status_atual || "") }}>{st?.status_atual || "nenhum"}</span>
            </div>
            {st?.erro_ultimo && <div style={{ fontSize: 10, color: "#dc2626", marginTop: 4 }}>{st.erro_ultimo.slice(0, 80)}</div>}
          </div>
        </div>

        {/* Tentativas */}
        {st?.tentativas_ultimo > 0 && (
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
            Tentativas realizadas: <strong>{st.tentativas_ultimo}</strong> / 3
          </div>
        )}

        {/* Botões de ação */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, marginBottom: 20 }}>
          <button
            onClick={() => enviarAgora.mutate()}
            disabled={enviarAgora.isPending}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: "#1d4ed8", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            <Play size={13} />{enviarAgora.isPending ? "Enviando…" : "Enviar agora"}
          </button>
          <button
            onClick={() => enviarAgora.mutate()}
            disabled={enviarAgora.isPending}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f8fafc", color: "#475569", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            <RotateCcw size={13} /> Reenviar
          </button>
          {!st?.pausado ? (
            <button
              onClick={() => pausar.mutate()}
              disabled={pausar.isPending}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid #fde68a", background: "#fffbeb", color: "#d97706", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              <Pause size={13} /> Pausar envio
            </button>
          ) : (
            <button
              onClick={() => retomar.mutate()}
              disabled={retomar.isPending}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#15803d", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              <Play size={13} /> Retomar envio
            </button>
          )}
        </div>

        {/* Alerta de falha */}
        {st?.status_atual === "falha" && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#991b1b" }}>
            <strong>⚠ Último envio falhou.</strong> Verifique as variáveis de ambiente <code>SMTP_USER</code>, <code>SMTP_PASS</code> e <code>EMAIL_RECIPIENT</code> no Railway. Erro: {st?.erro_ultimo}
          </div>
        )}

        {/* Histórico de envios */}
        {st?.historico?.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 8 }}>Histórico de envios</div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
              {st.historico.filter((h: any) => h.data_referencia !== "pausa").slice(0, 10).map((h: any) => (
                <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", borderRadius: 6, padding: "8px 12px", fontSize: 12 }}>
                  {statusIcon(h.status)}
                  <span style={{ color: "#1e293b", fontWeight: 600, minWidth: 90 }}>{h.data_referencia}</span>
                  <span style={{ color: statusCor(h.status), flex: 1 }}>{h.status}</span>
                  <span style={{ color: "#64748b" }}>{h.qtd_portarias} portaria(s)</span>
                  <span style={{ color: "#64748b" }}>{h.tentativas} tent.</span>
                  <a
                    href={`/api/email-diario/visualizar/${h.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 4, color: "#1d4ed8", fontSize: 11 }}
                  >
                    <Eye size={12} /> ver
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


export default function Portarias() {
  const [q, setQ] = useState("");
  const [bloco, setBloco] = useState("");
  const [ano, setAno] = useState<number | undefined>();
  const [modal, setModal] = useState(false);
  const [aba, setAba] = useState<"banco" | "envios">("banco");
  const qc = useQueryClient();

  const { data: portarias = [], isLoading } = useQuery({
    queryKey: ["portarias", q, bloco, ano],
    queryFn: () => apiPortarias.list({ q: q || undefined, bloco: bloco || undefined, ano }),
    staleTime: 30_000,
  });

  const remover = useMutation({
    mutationFn: (id: number) => apiPortarias.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portarias"] }),
  });

  const fmt = (v: number) => v?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (!isLoading && !portarias) return (
    <div style={{ padding: 24 }}>
      <NaoDisponivelBanner
        titulo="Portarias indisponivel"
        nota="Dados nao disponiveis — integracao pendente de configuracao no Railway."
      />
    </div>
  );

  return (
    <div style={S.page}>
      {modal && <NovaPortariaModal onClose={() => setModal(false)} />}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, borderBottom: "2px solid #e5e7eb", marginBottom: 20 }}>
        {([
          { key: "banco",  label: "Banco de Portarias", icon: <FileText size={13} /> },
          { key: "envios", label: "Envios Diários",      icon: <Mail size={13} /> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setAba(t.key)} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 0, border: "none",
            borderBottom: aba === t.key ? "2px solid #1d4ed8" : "2px solid transparent",
            background: "none", fontSize: 13, fontWeight: aba === t.key ? 700 : 400,
            color: aba === t.key ? "#1d4ed8" : "#6b7280", cursor: "pointer", marginBottom: -2,
          }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Aba: Envios Diários */}
      {aba === "envios" && <>
        <PainelEnviosDiarios />
        <BuscaRetroativa />
      </>}

      {/* Aba: Banco de Portarias */}
      {aba === "banco" && <>

      <div style={S.header}>
        <div style={S.title}>
          <FileText size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
          Banco de Portarias
        </div>
        <button onClick={() => setModal(true)} style={{ ...S.btn, background: "#1D9E75", color: "#fff" }}>
          <Plus size={14} /> Nova Portaria
        </button>
      </div>

      {/* Filtros */}
      <div style={S.row}>
        <div style={{ position: "relative", flex: 2, minWidth: 220 }}>
          <Search size={14} style={{ position: "absolute", left: 9, top: 9, color: "#737373" }} />
          <input
            placeholder="Buscar por número, programa, objeto…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ ...S.input, paddingLeft: 30, width: "100%", boxSizing: "border-box" }}
          />
        </div>
        <select value={bloco} onChange={(e) => setBloco(e.target.value)} style={{ ...S.input, flex: 1 }}>
          <option value="">Todos os blocos</option>
          {BLOCOS.map((b) => <option key={b}>{b}</option>)}
        </select>
        <input
          type="number"
          placeholder="Ano"
          value={ano ?? ""}
          onChange={(e) => setAno(e.target.value ? Number(e.target.value) : undefined)}
          style={{ ...S.input, flex: 0.5, minWidth: 90 }}
        />
      </div>

      {/* Estatística rápida */}
      <div style={{ ...S.card, background: "#f0fdf4", display: "flex", gap: 24, padding: "10px 16px", marginBottom: 14 }}>
        <div><span style={{ fontSize: 20, fontWeight: 700 }}>{portarias.length}</span><div style={{ fontSize: 11, color: "#737373" }}>portarias encontradas</div></div>
        <div><span style={{ fontSize: 20, fontWeight: 700 }}>{fmt(portarias.reduce((s, p) => s + (p.valor_total || 0), 0))}</span><div style={{ fontSize: 11, color: "#737373" }}>valor total</div></div>
      </div>

      {isLoading && <div style={{ textAlign: "center", padding: 40, color: "#737373" }}>Carregando…</div>}

      {portarias.map((p: Portaria) => (
        <div key={p.id} style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Portaria {p.numero}/{p.ano}</span>
                {p.bloco && (
                  <span style={S.badge(COR_BLOCO[p.bloco] ?? "#6b7280")}>{p.bloco}</span>
                )}
                <span style={{ fontSize: 11, color: "#737373" }}>{p.orgao_emissor}</span>
              </div>
              {p.programa && <div style={{ fontSize: 13, color: "#404040", marginBottom: 2 }}>{p.programa}</div>}
              {p.objeto && <div style={S.sub}>{p.objeto.slice(0, 120)}{p.objeto.length > 120 ? "…" : ""}</div>}
              <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
                {p.valor_total > 0 && <span style={S.valor}>{fmt(p.valor_total)}</span>}
                {p.data_publicacao && <span style={S.sub}>Publicada em {new Date(p.data_publicacao).toLocaleDateString("pt-BR")}</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginLeft: 12 }}>
              {p.arquivo_pdf && (
                <a href={p.arquivo_pdf} target="_blank" style={{ ...S.btn, background: "#eff6ff", color: "#1d4ed8", textDecoration: "none" }}>
                  <ExternalLink size={13} /> PDF
                </a>
              )}
              <button
                onClick={() => { if (window.confirm("Remover esta portaria?")) remover.mutate(p.id); }}
                style={{ ...S.btn, background: "#fff0f0", color: "#dc2626" }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {!isLoading && portarias.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#737373" }}>
          <FileText size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
          <div>Nenhuma portaria encontrada.</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Cadastre portarias ou ajuste os filtros de busca.</div>
        </div>
      )}

      </>}
    </div>
  );
}
