// src/pages/CronogramaRepasses.tsx — Cronograma de Repasses FNS · Fundo a Fundo
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, DollarSign, CheckCircle, Clock, AlertTriangle, FileText, Printer, X, Filter, RefreshCw, Edit2, Save, Database, Wifi } from "lucide-react";
import { apiGet, apiPost, apiPut } from "../lib/api";
import { BRL, BRL_AXIS, PCT } from "../lib/fmt";

interface Repasse {
  id: string; competencia: string; bloco: string; programa: string;
  valor_previsto: number; valor_creditado: number | null;
  data_prevista: string; data_credito: string | null;
  status: "creditado" | "previsto" | "atrasado" | "parcial";
  portaria: string; observacao: string;
  fonte?: string; editado_em?: string;
}

interface ResumoRepasses {
  total_previsto: number; total_creditado: number; total_aguardando: number;
  creditados: number; previstos: number; atrasados: number;
  proximo_repasse: string; proximo_valor: number; proximo_bloco: string;
  ultima_sincronizacao?: string | null;
  fonte_dados?: string;
  municipio?: string;
  ibge?: string;
}

const BRLd = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

const COR_STATUS: Record<string, string> = {
  creditado: "#16a34a", previsto: "#1351b4", atrasado: "#dc2626", parcial: "#d97706",
};
const LABEL_STATUS: Record<string, string> = {
  creditado: "Creditado", previsto: "Previsto", atrasado: "Atrasado", parcial: "Parcial",
};

const MESES_PT: Record<string, number> = {
  jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6,
  jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12,
};
function ordenarCompetencia(a: string, b: string) {
  const [ma, aa] = a.toLowerCase().split("/");
  const [mb, ab] = b.toLowerCase().split("/");
  const ya = parseInt(aa ?? "0"), yb = parseInt(ab ?? "0");
  if (ya !== yb) return ya - yb;
  return (MESES_PT[ma] ?? 0) - (MESES_PT[mb] ?? 0);
}

function BadgeStatus({ s }: { s: string }) {
  const cor = COR_STATUS[s] ?? "#6b7280";
  return (
    <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 10, background: cor + "18", color: cor }}>
      {LABEL_STATUS[s] ?? s}
    </span>
  );
}

function BadgeFonte({ fonte }: { fonte?: string }) {
  if (!fonte || fonte === "manual") return null;
  return (
    <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 7px", borderRadius: 10, background: "#eff6ff", color: "#1d4ed8", display: "inline-flex", alignItems: "center", gap: 3 }}>
      <Wifi size={8}/> Portal CGU
    </span>
  );
}

function BarraExec({ previsto, creditado }: { previsto: number; creditado: number | null }) {
  const pct = creditado ? Math.min(100, (creditado / previsto) * 100) : 0;
  const cor = pct >= 100 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626";
  return (
    <div style={{ height: 4, background: "#e5e7eb", borderRadius: 2 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: cor, borderRadius: 2 }}/>
    </div>
  );
}

// ── Modal de Edição ────────────────────────────────────────────────────────────

function ModalEditar({ repasse, onFechar, onSalvo }: { repasse: Repasse; onFechar: () => void; onSalvo: () => void }) {
  const [form, setForm] = useState({
    valor_creditado: repasse.valor_creditado ?? "",
    data_credito:    repasse.data_credito ?? "",
    status:          repasse.status,
    observacao:      repasse.observacao ?? "",
    portaria:        repasse.portaria ?? "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSalvar = async () => {
    setSalvando(true); setErro(null);
    try {
      const payload: Record<string, unknown> = {
        status:     form.status,
        observacao: form.observacao,
        portaria:   form.portaria,
      };
      if (form.valor_creditado !== "") payload.valor_creditado = Number(form.valor_creditado);
      if (form.data_credito)           payload.data_credito    = form.data_credito;

      await apiPut(`/api/cronograma-repasses/${repasse.id}`, payload);
      onSalvo();
      onFechar();
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar — verifique o backend.");
    } finally {
      setSalvando(false);
    }
  };

  const campo = (label: string, key: keyof typeof form, type = "text") => (
    <div key={key} style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: "#6b7280" }}>{label}</label>
      {key === "status" ? (
        <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as typeof form["status"] }))}
          style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "#374151", background: "#fff", outline: "none" }}>
          {["creditado","previsto","atrasado","parcial"].map(s => <option key={s} value={s}>{LABEL_STATUS[s]}</option>)}
        </select>
      ) : key === "observacao" ? (
        <textarea rows={2} value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))}
          style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 10px", fontSize: 12, resize: "vertical", outline: "none" }}/>
      ) : (
        <input type={type} value={String(form[key])} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 10px", fontSize: 12, outline: "none" }}/>
      )}
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={e => e.target === e.currentTarget && onFechar()}>
      <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e4e7ec" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Edit2 size={15} color="#059669"/>
            <span style={{ fontWeight: 800, fontSize: 14 }}>Editar Repasse</span>
          </div>
          <button onClick={onFechar} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={16} color="#6b7280"/></button>
        </div>

        <div style={{ padding: "20px" }}>
          <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 11 }}>
            <div style={{ fontWeight: 700, color: "#065f46" }}>{repasse.bloco} · {repasse.competencia}</div>
            <div style={{ color: "#6b7280", marginTop: 2 }}>{repasse.programa}</div>
            <div style={{ color: "#059669", fontWeight: 700, marginTop: 4 }}>Previsto: {BRLd(repasse.valor_previsto)}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
            {campo("Status", "status")}
            {campo("Valor Creditado (R$)", "valor_creditado", "number")}
            {campo("Data de Crédito (DD/MM/AAAA)", "data_credito")}
            {campo("Portaria / Instrumento", "portaria")}
            {campo("Observação", "observacao")}
          </div>

          {erro && <div style={{ marginTop: 10, fontSize: 11, color: "#dc2626", background: "#fee2e2", borderRadius: 6, padding: "8px 12px" }}>{erro}</div>}

          <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
            <button onClick={onFechar} style={{ padding: "9px 18px", fontSize: 12, fontWeight: 600, border: "1px solid #d1d5db", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#374151" }}>
              Cancelar
            </button>
            <button onClick={handleSalvar} disabled={salvando}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", fontSize: 12, fontWeight: 700, border: "none", borderRadius: 8, background: salvando ? "#9ca3af" : "#059669", color: "#fff", cursor: salvando ? "not-allowed" : "pointer" }}>
              <Save size={13}/> {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Card Repasse com botão editar ──────────────────────────────────────────────

function CardRepasse({ r, onEditar }: { r: Repasse; onEditar: (r: Repasse) => void }) {
  const cor = COR_STATUS[r.status];
  const icon = r.status === "creditado" ? <CheckCircle size={16} color="#16a34a"/>
             : r.status === "atrasado"  ? <AlertTriangle size={16} color="#dc2626"/>
             : <Clock size={16} color={r.status === "parcial" ? "#d97706" : "#1351b4"}/>;

  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}20`, borderLeft: `4px solid ${cor}`, borderRadius: 10, padding: "14px 16px", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ marginTop: 1 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" as const }}>
            <span style={{ fontWeight: 800, fontSize: 13 }}>{r.bloco}</span>
            <BadgeStatus s={r.status}/>
            <BadgeFonte fonte={r.fonte}/>
            <span style={{ fontSize: 9, color: "#9ca3af" }}>{r.competencia}</span>
            <span style={{ fontSize: 9, color: "#9ca3af" }}>·</span>
            <span style={{ fontSize: 9, color: "#6b7280" }}>{r.portaria}</span>
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>{r.programa}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 8 }}>
            {[
              { l: "Valor Previsto",  v: BRL(r.valor_previsto) },
              { l: "Creditado",       v: r.valor_creditado ? BRL(r.valor_creditado) : "—" },
              { l: "Data Prevista",   v: r.data_prevista },
              { l: "Data Crédito",    v: r.data_credito ?? "—" },
            ].map(k => (
              <div key={k.l}>
                <div style={{ fontSize: 9, color: "#9ca3af" }}>{k.l}</div>
                <div style={{ fontSize: 11, fontWeight: 700 }}>{k.v}</div>
              </div>
            ))}
          </div>
          <BarraExec previsto={r.valor_previsto} creditado={r.valor_creditado}/>
          {r.observacao && <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 5 }}>ℹ {r.observacao}</div>}
        </div>
        <button onClick={() => onEditar(r)}
          style={{ background: "#f0fdf4", border: "1px solid #d1fae5", borderRadius: 8, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#059669", fontWeight: 700, flexShrink: 0 }}>
          <Edit2 size={12}/> Editar
        </button>
      </div>
    </div>
  );
}

// ── Modal Relatório Mensal ────────────────────────────────────────────────────

function ModalRelatorio({ repasses, mes, onFechar }: { repasses: Repasse[]; mes: string; onFechar: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);

  const totalPrevisto   = repasses.reduce((s, r) => s + r.valor_previsto, 0);
  const totalCreditado  = repasses.reduce((s, r) => s + (r.valor_creditado ?? 0), 0);
  const totalAguardando = totalPrevisto - totalCreditado;
  const creditados = repasses.filter(r => r.status === "creditado").length;
  const pendentes  = repasses.filter(r => r.status !== "creditado").length;

  const handleImprimir = () => {
    const conteudo = printRef.current;
    if (!conteudo) return;
    const janela = window.open("", "_blank", "width=1000,height=800");
    if (!janela) return;
    janela.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
      <title>Relatório de Repasses FNS — ${mes}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 1.5cm 1.2cm;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1a1a2e; background: #fff; }
        .cabecalho { border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 16px; }
        .cabecalho h1 { font-size: 16px; font-weight: 800; color: #065f46; margin-bottom: 3px; }
        .kpis { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 16px; page-break-inside: avoid; }
        .kpi { border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 12px; text-align: center; }
        .kpi .val { font-size: 13px; font-weight: 900; }
        .kpi .lbl { font-size: 8px; color: #6b7280; margin-top: 2px; }
        .badges-row { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; page-break-inside: avoid; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        thead { display: table-header-group; background: #f0fdf4; }
        thead th { text-align: left; font-size: 9px; font-weight: 700; color: #065f46; padding: 7px 8px; border-bottom: 2px solid #d1fae5; }
        tbody { display: table-row-group; }
        tbody tr { border-bottom: 1px solid #f3f4f6; page-break-inside: avoid; break-inside: avoid; }
        tbody td { padding: 7px 8px; font-size: 10px; vertical-align: top; }
        .badge { display: inline-block; font-size: 8px; font-weight: 800; padding: 2px 7px; border-radius: 10px; }
        .total-row { background: #f0fdf4; font-weight: 800; }
        .total-row td { padding: 9px 8px; border-top: 2px solid #059669; }
        .assinaturas { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 40px; page-break-inside: avoid; }
        .assinatura { border-top: 1px solid #374151; padding-top: 6px; font-size: 9px; text-align: center; color: #374151; }
        .rodape { border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 16px; font-size: 9px; color: #9ca3af; display: flex; justify-content: space-between; page-break-inside: avoid; }
        .fonte-aviso { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 7px 10px; font-size: 9px; color: #1d4ed8; margin-bottom: 14px; page-break-inside: avoid; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          thead { display: table-header-group; }
          tbody tr { page-break-inside: avoid; break-inside: avoid; }
          .total-row { page-break-inside: avoid; }
          .assinaturas { page-break-inside: avoid; }
          .rodape { page-break-inside: avoid; }
        }
      </style></head><body>${conteudo.innerHTML}</body></html>`);
    janela.document.close();
    janela.focus();
    setTimeout(() => { janela.print(); }, 500);
  };

  const temDadosReais = repasses.some(r => r.fonte === "portal_transparencia");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px", overflowY: "auto" }}
      onClick={e => e.target === e.currentTarget && onFechar()}>
      <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 880, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e4e7ec" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={16} color="#059669"/>
            <span style={{ fontWeight: 800, fontSize: 15, color: "#1a1a2e" }}>Relatório de Repasses — {mes}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleImprimir}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#059669", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
              <Printer size={13}/> Imprimir / PDF
            </button>
            <button onClick={onFechar}
              style={{ display: "flex", alignItems: "center", background: "#f1f5f9", border: "none", borderRadius: 8, padding: "8px 10px", cursor: "pointer" }}>
              <X size={14} color="#6b7280"/>
            </button>
          </div>
        </div>

        <div style={{ padding: "24px 28px", overflowY: "auto", maxHeight: "80vh" }}>
          <div ref={printRef}>
            {/* Aviso de fonte */}
            {temDadosReais && (
              <div className="fonte-aviso" style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "8px 12px", fontSize: 10, color: "#1d4ed8", marginBottom: 16 }}>
                ✓ Dados integrados do Portal da Transparência CGU — Transferências reais FNS → Apuí/AM (IBGE 1300144)
              </div>
            )}

            {/* Cabeçalho */}
            <div className="cabecalho" style={{ borderBottom: "2px solid #059669", paddingBottom: 14, marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h1 style={{ fontSize: 18, fontWeight: 800, color: "#065f46", marginBottom: 3 }}>
                    Relatório de Repasses FNS — Competência {mes}
                  </h1>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>
                    Fundo Nacional de Saúde → Fundo Municipal de Saúde · Apuí / AM · Blocos de Financiamento
                  </div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                    Emitido em: {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · ERSUS 360
                  </div>
                </div>
                <div style={{ textAlign: "right" as const }}>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>CNPJ FMS</div>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>12.834.320/0001-26</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 3 }}>Município</div>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>Apuí — AM · IBGE 1300144</div>
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="kpis" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
              {[
                { l: "Total Previsto",  v: BRLd(totalPrevisto),   cor: "#065f46", bg: "#f0fdf4", borda: "#d1fae5" },
                { l: "Total Creditado", v: BRLd(totalCreditado),  cor: "#16a34a", bg: "#f0fdf4", borda: "#d1fae5" },
                { l: "A Receber",       v: BRLd(totalAguardando), cor: totalAguardando > 0 ? "#d97706" : "#16a34a", bg: totalAguardando > 0 ? "#fffbeb" : "#f0fdf4", borda: "#e5e7eb" },
                { l: "Execução",        v: totalPrevisto > 0 ? `${Math.round((totalCreditado / totalPrevisto) * 100)}%` : "0%", cor: "#1351b4", bg: "#eff6ff", borda: "#bfdbfe" },
              ].map(k => (
                <div key={k.l} className="kpi" style={{ border: `1px solid ${k.borda}`, background: k.bg, borderRadius: 8, padding: "10px 14px", textAlign: "center" as const }}>
                  <div className="val" style={{ fontSize: 14, fontWeight: 900, color: k.cor }}>{k.v}</div>
                  <div className="lbl" style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>{k.l}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 18, fontSize: 11, flexWrap: "wrap" as const }}>
              <span style={{ background: "#dcfce7", color: "#16a34a", padding: "4px 12px", borderRadius: 20, fontWeight: 700 }}>✓ {creditados} creditado(s)</span>
              {pendentes > 0 && <span style={{ background: "#fef3c7", color: "#d97706", padding: "4px 12px", borderRadius: 20, fontWeight: 700 }}>⏳ {pendentes} pendente(s)</span>}
              <span style={{ background: "#f3f4f6", color: "#6b7280", padding: "4px 12px", borderRadius: 20, fontWeight: 700 }}>{repasses.length} transferência(s)</span>
            </div>

            {/* Tabela */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
              <thead>
                <tr style={{ background: "#f0fdf4" }}>
                  {["Bloco / Programa", "Portaria", "Status", "Valor Previsto", "Valor Creditado", "Data Prevista", "Data Crédito"].map(h => (
                    <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 700, color: "#065f46", padding: "8px 10px", borderBottom: "1px solid #d1fae5" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {repasses.map((rep, i) => (
                  <tr key={rep.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "9px 10px", verticalAlign: "top" }}>
                      <div style={{ fontWeight: 700, fontSize: 11 }}>{rep.bloco}</div>
                      <div style={{ fontSize: 10, color: "#6b7280" }}>{rep.programa}</div>
                      {rep.observacao && <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 2 }}>ℹ {rep.observacao}</div>}
                    </td>
                    <td style={{ padding: "9px 10px", fontSize: 10, color: "#6b7280", verticalAlign: "top" }}>{rep.portaria}</td>
                    <td style={{ padding: "9px 10px", verticalAlign: "top" }}>
                      <span className={`badge badge-${rep.status}`} style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 10, background: (COR_STATUS[rep.status] ?? "#6b7280") + "18", color: COR_STATUS[rep.status] ?? "#6b7280" }}>
                        {LABEL_STATUS[rep.status] ?? rep.status}
                      </span>
                    </td>
                    <td style={{ padding: "9px 10px", fontSize: 11, fontWeight: 700, fontFamily: "monospace", verticalAlign: "top" }}>{BRLd(rep.valor_previsto)}</td>
                    <td style={{ padding: "9px 10px", fontSize: 11, fontWeight: 700, fontFamily: "monospace", color: rep.valor_creditado ? "#16a34a" : "#9ca3af", verticalAlign: "top" }}>
                      {rep.valor_creditado ? BRLd(rep.valor_creditado) : "—"}
                    </td>
                    <td style={{ padding: "9px 10px", fontSize: 11, verticalAlign: "top" }}>{rep.data_prevista}</td>
                    <td style={{ padding: "9px 10px", fontSize: 11, color: rep.data_credito ? "#16a34a" : "#9ca3af", verticalAlign: "top" }}>{rep.data_credito ?? "—"}</td>
                  </tr>
                ))}
                <tr className="total-row" style={{ background: "#f0fdf4", fontWeight: 800, borderTop: "2px solid #059669" }}>
                  <td colSpan={3} style={{ padding: 10, fontSize: 12, fontWeight: 800, color: "#065f46" }}>TOTAL — Competência {mes}</td>
                  <td style={{ padding: 10, fontSize: 12, fontWeight: 900, fontFamily: "monospace", color: "#065f46" }}>{BRLd(totalPrevisto)}</td>
                  <td style={{ padding: 10, fontSize: 12, fontWeight: 900, fontFamily: "monospace", color: "#16a34a" }}>{BRLd(totalCreditado)}</td>
                  <td colSpan={2} style={{ padding: 10, fontSize: 11, color: "#6b7280" }}>Execução: {totalPrevisto > 0 ? Math.round((totalCreditado / totalPrevisto) * 100) : 0}%</td>
                </tr>
              </tbody>
            </table>

            {/* Assinaturas */}
            <div className="assinaturas" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, marginTop: 50 }}>
              {[
                { cargo: "Secretário(a) Municipal de Saúde", nome: "Fundo Municipal de Saúde — Apuí/AM" },
                { cargo: "Responsável pelo Controle Financeiro", nome: "Departamento Financeiro — FMS" },
              ].map((a, i) => (
                <div key={i} className="assinatura" style={{ borderTop: "1px solid #374151", paddingTop: 6, fontSize: 10, textAlign: "center" as const, color: "#374151" }}>
                  <div style={{ fontWeight: 700 }}>{a.cargo}</div>
                  <div style={{ color: "#9ca3af" }}>{a.nome}</div>
                </div>
              ))}
            </div>

            <div className="rodape" style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12, marginTop: 20, fontSize: 10, color: "#9ca3af", display: "flex", justifyContent: "space-between" }}>
              <span>ERSUS 360 — Sistema de Gestão Inteligente do SUS · FMS Apuí/AM</span>
              <span>Gerado em: {new Date().toLocaleString("pt-BR")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Principal ─────────────────────────────────────────────────────────────────

export default function CronogramaRepasses() {
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroBloco, setFiltroBloco]   = useState("todos");
  const [filtroMes, setFiltroMes]       = useState("todos");
  const [modalMes, setModalMes]         = useState<string | null>(null);
  const [editando, setEditando]         = useState<Repasse | null>(null);
  const [sincMsg, setSincMsg]           = useState<{ ok: boolean; texto: string } | null>(null);
  const qc = useQueryClient();

  const { data: resumo } = useQuery<ResumoRepasses>({
    queryKey: ["repasses-resumo"],
    queryFn: () => apiGet("/api/cronograma-repasses/resumo") as Promise<ResumoRepasses>,
    staleTime: 60_000,
  });

  const { data: repasses = [], isLoading } = useQuery<Repasse[]>({
    queryKey: ["repasses-lista"],
    queryFn: () => apiGet("/api/cronograma-repasses/lista") as Promise<Repasse[]>,
    staleTime: 60_000,
  });

  const sincronizarFNS = useMutation({
    mutationFn: () => apiPost("/api/cronograma-repasses/sincronizar-fns", { ano: 2026 }) as Promise<{ ok: boolean; novos_registros?: number; erro?: string; instrucao?: string; aviso?: string }>,
    onSuccess: (res) => {
      if (res.ok) {
        setSincMsg({ ok: true, texto: `✓ ${res.novos_registros ?? 0} registros importados do Portal da Transparência CGU. ${res.aviso ?? ""}` });
        qc.invalidateQueries({ queryKey: ["repasses-resumo"] });
        qc.invalidateQueries({ queryKey: ["repasses-lista"] });
      } else {
        setSincMsg({ ok: false, texto: `${res.erro ?? "Erro"} — ${res.instrucao ?? ""}` });
      }
    },
    onError: () => setSincMsg({ ok: false, texto: "Falha na conexão com o backend." }),
  });

  const meses  = Array.from(new Set(repasses.map(r => r.competencia))).sort(ordenarCompetencia);
  const blocos = ["todos", ...Array.from(new Set(repasses.map(r => r.bloco)))];

  const visiveis = repasses.filter(r => {
    const okStatus = filtroStatus === "todos" || r.status === filtroStatus;
    const okBloco  = filtroBloco  === "todos" || r.bloco  === filtroBloco;
    const okMes    = filtroMes    === "todos" || r.competencia === filtroMes;
    return okStatus && okBloco && okMes;
  });

  const r = resumo;
  const fonteReal = r?.fonte_dados === "portal_transparencia";
  const ultimaSync = r?.ultima_sincronizacao
    ? new Date(r.ultima_sincronizacao).toLocaleString("pt-BR")
    : null;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#065f46 0%,#059669 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}><Calendar size={18} color="#fff"/></div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Cronograma de Repasses FNS</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Transferências Fundo a Fundo · FNS → FMS Apuí/AM · Competência 2026 · Blocos de Financiamento
            </div>
          </div>

          {/* Botão Sincronizar */}
          <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 4 }}>
            <button
              onClick={() => { setSincMsg(null); sincronizarFNS.mutate(); }}
              disabled={sincronizarFNS.isPending}
              style={{ display: "flex", alignItems: "center", gap: 7, background: sincronizarFNS.isPending ? "rgba(255,255,255,.3)" : "rgba(255,255,255,.2)", border: "1px solid rgba(255,255,255,.4)", borderRadius: 10, padding: "9px 16px", cursor: sincronizarFNS.isPending ? "not-allowed" : "pointer", color: "#fff", fontSize: 12, fontWeight: 700 }}>
              <RefreshCw size={14} style={{ animation: sincronizarFNS.isPending ? "spin 1s linear infinite" : "none" }}/>
              {sincronizarFNS.isPending ? "Sincronizando..." : "Sincronizar com FNS"}
            </button>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,.5)", textAlign: "right" as const }}>
              {fonteReal ? (
                <span style={{ color: "#bbf7d0", display: "flex", alignItems: "center", gap: 4 }}>
                  <Wifi size={9}/> Dados reais — Portal da Transparência CGU
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Database size={9}/> Dados manuais
                </span>
              )}
              {ultimaSync && <div>Últ. sync: {ultimaSync}</div>}
            </div>
          </div>
        </div>

        {/* Alerta da sincronização */}
        {sincMsg && (
          <div style={{ background: sincMsg.ok ? "rgba(220,252,231,.9)" : "rgba(254,226,226,.9)", borderRadius: 8, padding: "10px 14px", marginTop: 10, fontSize: 11, color: sincMsg.ok ? "#065f46" : "#991b1b", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <span>{sincMsg.texto}</span>
            <button onClick={() => setSincMsg(null)} style={{ background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}><X size={13} color={sincMsg.ok ? "#065f46" : "#991b1b"}/></button>
          </div>
        )}

        {r && (
          <>
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 10, padding: "12px 16px", marginTop: 14, display: "flex", alignItems: "center", gap: 16, border: "1px solid rgba(255,255,255,.2)" }}>
              <div style={{ background: "#fbbf24", borderRadius: 8, padding: 8 }}><DollarSign size={16} color="#fff"/></div>
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)" }}>Próximo repasse previsto</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>{r.proximo_bloco}</div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" as const }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#fbbf24" }}>{BRL(r.proximo_valor)}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)" }}>{r.proximo_repasse}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginTop: 12 }}>
              {[
                { l: "Total Previsto",  v: BRL(r.total_previsto),  cor: "#bbf7d0" },
                { l: "Total Creditado", v: BRL(r.total_creditado), cor: "#86efac" },
                { l: "Aguardando",      v: BRL(r.total_aguardando), cor: "#fde68a" },
                { l: "Creditados",      v: r.creditados,            cor: "#86efac" },
                { l: "Previstos",       v: r.previstos,             cor: "#bfdbfe" },
                { l: "Atrasados",       v: r.atrasados,             cor: "#fca5a5" },
              ].map(k => (
                <div key={k.l} style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "10px 12px", textAlign: "center" as const }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: k.cor }}>{k.v}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,.5)" }}>{k.l}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ padding: "20px 28px 60px" }}>

        {/* Filtros */}
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "14px 16px", marginBottom: 16, display: "flex", flexDirection: "column" as const, gap: 12 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const, alignItems: "center" }}>
            <Filter size={13} color="#9ca3af"/>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Status:</span>
            {["todos","creditado","previsto","atrasado","parcial"].map(s => (
              <button key={s} onClick={() => setFiltroStatus(s)}
                style={{ padding: "5px 12px", fontSize: 11, borderRadius: 20, border: `1px solid ${filtroStatus===s?(COR_STATUS[s]??"#059669"):"#d1d5db"}`, background: filtroStatus===s?((COR_STATUS[s]??"#059669")+"15"):"#fff", color: filtroStatus===s?(COR_STATUS[s]??"#059669"):"#374151", cursor: "pointer", fontWeight: filtroStatus===s?700:400 }}>
                {s === "todos" ? "Todos" : LABEL_STATUS[s]}
              </button>
            ))}
            <div style={{ width: 1, height: 20, background: "#e5e7eb", margin: "0 4px" }}/>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Bloco:</span>
            {blocos.map(b => (
              <button key={b} onClick={() => setFiltroBloco(b)}
                style={{ padding: "5px 12px", fontSize: 11, borderRadius: 20, border: `1px solid ${filtroBloco===b?"#059669":"#d1d5db"}`, background: filtroBloco===b?"#dcfce7":"#fff", color: filtroBloco===b?"#059669":"#374151", cursor: "pointer", fontWeight: filtroBloco===b?700:400 }}>
                {b === "todos" ? "Todos" : b}
              </button>
            ))}
            <span style={{ marginLeft: "auto", fontSize: 11, color: "#9ca3af" }}>{visiveis.length} repasse(s)</span>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 10, borderTop: "1px solid #f3f4f6", flexWrap: "wrap" as const }}>
            <Calendar size={13} color="#9ca3af"/>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Mês de referência:</span>
            <button onClick={() => setFiltroMes("todos")}
              style={{ padding: "5px 12px", fontSize: 11, borderRadius: 20, border: `1px solid ${filtroMes==="todos"?"#059669":"#d1d5db"}`, background: filtroMes==="todos"?"#dcfce7":"#fff", color: filtroMes==="todos"?"#059669":"#374151", cursor: "pointer", fontWeight: filtroMes==="todos"?700:400 }}>
              Todos
            </button>
            {meses.map(m => (
              <button key={m} onClick={() => setFiltroMes(m)}
                style={{ padding: "5px 12px", fontSize: 11, borderRadius: 20, border: `1px solid ${filtroMes===m?"#059669":"#d1d5db"}`, background: filtroMes===m?"#dcfce7":"#fff", color: filtroMes===m?"#059669":"#374151", cursor: "pointer", fontWeight: filtroMes===m?700:400 }}>
                {m}
              </button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" as const }}>
              {filtroMes !== "todos" ? (
                <button onClick={() => setModalMes(filtroMes)}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: "#059669", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                  <FileText size={13}/> Gerar Relatório — {filtroMes}
                </button>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>Relatório por mês:</span>
                  <select defaultValue=""
                    onChange={e => { if (e.target.value) setModalMes(e.target.value === "__todos__" ? "todos" : e.target.value); }}
                    style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 10px", fontSize: 11, color: "#374151", cursor: "pointer", background: "#fff", outline: "none" }}>
                    <option value="" disabled>Selecionar mês...</option>
                    {meses.map(m => <option key={m} value={m}>{m}</option>)}
                    <option value="__todos__">Relatório completo (todos os meses)</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cards */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando cronograma...</div>
        ) : filtroMes === "todos" ? (
          meses.map(mes => {
            const doMes   = visiveis.filter(r => r.competencia === mes);
            if (doMes.length === 0) return null;
            const totalMes = doMes.reduce((s, r) => s + r.valor_previsto, 0);
            const credMes  = doMes.reduce((s, r) => s + (r.valor_creditado ?? 0), 0);
            return (
              <div key={mes} style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 3, height: 18, background: "#059669", borderRadius: 2 }}/>
                    <span style={{ fontWeight: 800, fontSize: 14, color: "#1a1a2e" }}>{mes}</span>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>{BRL(credMes)} de {BRL(totalMes)} creditados</span>
                    {credMes >= totalMes && <span style={{ fontSize: 9, fontWeight: 700, background: "#dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: 10 }}>100%</span>}
                  </div>
                  <button onClick={() => setModalMes(mes)}
                    style={{ display: "flex", alignItems: "center", gap: 5, background: "#f0fdf4", color: "#059669", border: "1px solid #d1fae5", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                    <FileText size={11}/> Relatório
                  </button>
                </div>
                {doMes.map(rep => <CardRepasse key={rep.id} r={rep} onEditar={setEditando}/>)}
              </div>
            );
          })
        ) : (
          visiveis.map(r => <CardRepasse key={r.id} r={r} onEditar={setEditando}/>)
        )}
      </div>

      {/* Modais */}
      {modalMes && (
        <ModalRelatorio
          repasses={modalMes === "todos" ? repasses : repasses.filter(r => r.competencia === modalMes)}
          mes={modalMes === "todos" ? "Todos os Meses" : modalMes}
          onFechar={() => setModalMes(null)}
        />
      )}
      {editando && (
        <ModalEditar
          repasse={editando}
          onFechar={() => setEditando(null)}
          onSalvo={() => {
            qc.invalidateQueries({ queryKey: ["repasses-lista"] });
            qc.invalidateQueries({ queryKey: ["repasses-resumo"] });
          }}
        />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
