import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

const ROUTE_LABELS: Record<string, string> = {
  "/": "Painel do Gestor",
  "/painel-financeiro": "Painel Financeiro",
  "/siaps": "SIAPS / e-SUS Egestor",
  "/indicadores": "Indicadores de Saúde",
  "/aps": "Atenção Primária à Saúde",
  "/vigilancia": "Vigilância em Saúde",
  "/regulacao": "Regulação",
  "/farmacia": "Assistência Farmacêutica",
  "/saude-bucal": "Saúde Bucal",
  "/imunizacao": "Imunização",
  "/saude-mental": "Saúde Mental",
  "/epidemiologia": "Epidemiologia",
  "/siops": "SIOPS",
  "/auditoria": "Auditoria",
  "/rh": "Gestão de Pessoas / RH",
  "/bi": "Business Intelligence",
  "/planejamento": "Planejamento em Saúde",
  "/fns-convenios": "FNS / Convênios",
};

function getNomeModulo(pathname: string): string {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
  // Gera nome a partir do path
  const seg = pathname.split("/").filter(Boolean).pop() ?? "Módulo";
  return seg.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export default function ExportarRelatorio({ nomeUsuario, perfilUsuario }: { nomeUsuario: string; perfilUsuario: string }) {
  const loc = useLocation();
  const hoje = new Date();
  const [open, setOpen]       = useState(false);
  const [mesRef, setMesRef]   = useState(hoje.getMonth());      // 0-based
  const [anoRef, setAnoRef]   = useState(hoje.getFullYear());
  const [mesAte, setMesAte]   = useState(hoje.getMonth());
  const [anoAte, setAnoAte]   = useState(hoje.getFullYear());
  const [retroativo, setRetro] = useState(false);
  const [imprimindo, setImp]   = useState(false);

  const modulo = getNomeModulo(loc.pathname);

  // Injeta CSS de impressão global uma vez
  useEffect(() => {
    const id = "ersus-print-style";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @media print {
        body > * { display: none !important; }
        #ersus-print-area { display: block !important; }
        #ersus-print-area { position: static; background: #fff; padding: 0; margin: 0; }
        @page { size: A4 landscape; margin: 6mm 6mm; }
        #ersus-print-area button,
        #ersus-print-area input,
        #ersus-print-area select { display: none !important; }
      }
      #ersus-print-area { display: none; }
    `;
    document.head.appendChild(s);
  }, []);

  function gerarPDF() {
    setImp(true);

    const periodoStr = retroativo
      ? `${MESES[mesRef]}/${anoRef} a ${MESES[mesAte]}/${anoAte}`
      : `${MESES[mesRef]}/${anoRef}`;

    const dataGeracao = hoje.toLocaleDateString("pt-BR", { day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" } as any);

    // Captura o conteúdo principal da página
    const main = document.querySelector("main") ?? document.querySelector("[data-main]") ?? document.getElementById("page-content");
    // Clona para não modificar o DOM original
    let conteudo = "<p style='color:#6b7280'>Nenhum conteúdo capturável neste módulo.</p>";
    if (main) {
      const clone = main.cloneNode(true) as HTMLElement;
      // Remove botões, inputs e elementos não imprimíveis
      clone.querySelectorAll("button, input, select, [role='button'], .no-print, [data-no-print]").forEach(el => el.remove());
      conteudo = clone.innerHTML;
    }

    let area = document.getElementById("ersus-print-area");
    if (!area) {
      area = document.createElement("div");
      area.id = "ersus-print-area";
      document.body.appendChild(area);
    }

    area.innerHTML = `
      <div style="font-family:system-ui,sans-serif;color:#111827;max-width:100%">
        <!-- Cabeçalho -->
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #1d4ed8;padding-bottom:12px;margin-bottom:18px">
          <div style="display:flex;align-items:center;gap:14px">
            <div style="width:46px;height:46px;border-radius:10px;background:linear-gradient(135deg,#1d4ed8,#0ea5e9);display:flex;align-items:center;justify-content:center;">
              <span style="color:#fff;font-size:24px">⚕</span>
            </div>
            <div>
              <div style="font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-0.02em">ERSUS 360</div>
              <div style="font-size:10px;color:#64748b;letter-spacing:0.06em;text-transform:uppercase">Sistema de Gestão em Saúde · Apuí / AM</div>
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:11px;color:#64748b">Fundo Municipal de Saúde de Apuí</div>
            <div style="font-size:11px;color:#64748b">CNPJ: 12.834.320/0001-26 · IBGE: 1300144</div>
            <div style="font-size:10px;color:#9ca3af;margin-top:2px">Gerado em: ${dataGeracao}</div>
          </div>
        </div>

        <!-- Título do módulo -->
        <div style="background:#eff6ff;border-left:4px solid #1d4ed8;border-radius:0 6px 6px 0;padding:10px 16px;margin-bottom:16px">
          <div style="font-size:9px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">Relatório — ${modulo}</div>
          <div style="display:flex;gap:24px;align-items:center">
            <div>
              <span style="font-size:11px;color:#6b7280">Período de referência: </span>
              <span style="font-size:13px;font-weight:800;color:#1e40af">${periodoStr}</span>
            </div>
            <div>
              <span style="font-size:11px;color:#6b7280">Responsável: </span>
              <span style="font-size:12px;font-weight:700;color:#374151">${nomeUsuario || "Gestor"}</span>
              <span style="font-size:10px;color:#9ca3af"> · ${perfilUsuario}</span>
            </div>
          </div>
        </div>

        <!-- Conteúdo capturado da página -->
        <div style="font-size:11px;line-height:1.5">
          ${conteudo}
        </div>

        <!-- Rodapé -->
        <div style="margin-top:28px;border-top:1px solid #e5e7eb;padding-top:10px;display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:9px;color:#9ca3af">ERSUS 360 · Sistema de Gestão em Saúde · Prefeitura Municipal de Apuí/AM</div>
          <div style="font-size:9px;color:#9ca3af">Secretaria Municipal de Saúde · ${nomeUsuario || "Gestor"} · ${dataGeracao}</div>
        </div>
      </div>
    `;

    setTimeout(() => {
      // Aplica zoom direto no elemento — mais confiável que @media print zoom no Chrome
      const printArea = document.getElementById("ersus-print-area");
      if (printArea) {
        // Remove overflow de todos os filhos para não cortar conteúdo
        printArea.querySelectorAll("*").forEach((el) => {
          const e = el as HTMLElement;
          if (e.style && (e.style.overflow === "auto" || e.style.overflow === "hidden" || e.style.overflowX === "auto")) {
            e.style.overflow = "visible";
            e.style.overflowX = "visible";
          }
        });
        printArea.style.zoom = "0.48";
      }
      window.print();
      setTimeout(() => {
        if (printArea) printArea.style.zoom = "";
        setImp(false);
        setOpen(false);
      }, 800);
    }, 200);
  }

  const selSt: React.CSSProperties = {
    border: "1px solid #d1d5db", borderRadius: 5, padding: "6px 8px",
    fontSize: 12, background: "#fff", width: "100%", cursor: "pointer",
  };

  const anos = Array.from({ length: 6 }, (_, i) => hoje.getFullYear() - i);

  return (
    <>
      {/* Botão flutuante no header */}
      <button
        onClick={() => setOpen(true)}
        title="Exportar relatório PDF"
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)",
          borderRadius: 7, padding: "5px 11px", cursor: "pointer", color: "#e2e8f0", fontSize: 12, fontWeight: 600,
          transition: "background .15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.18)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,.1)")}
      >
        <span style={{ fontSize: 14 }}>📄</span>
        PDF
      </button>

      {/* Modal */}
      {open && (
        <div onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 12, padding: 28, width: 420, boxShadow: "0 16px 48px rgba(0,0,0,.25)", fontFamily: "system-ui,sans-serif" }}>

            {/* Header modal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Exportar Relatório PDF</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{modulo}</div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#9ca3af" }}>✕</button>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", marginBottom: 18 }} />

            {/* Data de referência */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Competência de Referência</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 8 }}>
                <select value={mesRef} onChange={e => setMesRef(Number(e.target.value))} style={selSt}>
                  {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select value={anoRef} onChange={e => setAnoRef(Number(e.target.value))} style={selSt}>
                  {anos.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
            </div>

            {/* Período retroativo toggle */}
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 14 }}>
              <input type="checkbox" checked={retroativo} onChange={e => setRetro(e.target.checked)}
                style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#1d4ed8" }} />
              <span style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>Período retroativo (intervalo de competências)</span>
            </label>

            {/* Até (retroativo) */}
            {retroativo && (
              <div style={{ marginBottom: 14, background: "#eff6ff", borderRadius: 7, padding: "12px 14px" }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", display: "block", marginBottom: 6 }}>Até (competência final)</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 8 }}>
                  <select value={mesAte} onChange={e => setMesAte(Number(e.target.value))} style={selSt}>
                    {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                  <select value={anoAte} onChange={e => setAnoAte(Number(e.target.value))} style={selSt}>
                    {anos.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Resumo */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 7, padding: "10px 14px", marginBottom: 20, fontSize: 12 }}>
              <div style={{ color: "#6b7280", marginBottom: 3 }}>O relatório incluirá:</div>
              <div style={{ color: "#111827", fontWeight: 600 }}>📋 {modulo}</div>
              <div style={{ color: "#374151" }}>
                📅 {retroativo
                  ? `${MESES[mesRef]}/${anoRef} → ${MESES[mesAte]}/${anoAte}`
                  : `Competência: ${MESES[mesRef]}/${anoRef}`}
              </div>
              <div style={{ color: "#374151" }}>👤 {nomeUsuario || "Gestor"} · {perfilUsuario}</div>
              <div style={{ color: "#374151" }}>🏥 Fundo Municipal de Saúde de Apuí/AM</div>
            </div>

            {/* Botões */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={gerarPDF} disabled={imprimindo}
                style={{ flex: 1, background: imprimindo ? "#93c5fd" : "#1d4ed8", color: "#fff", border: "none", borderRadius: 7, padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: imprimindo ? "default" : "pointer" }}>
                {imprimindo ? "⏳ Gerando..." : "📄 Exportar PDF"}
              </button>
              <button onClick={() => setOpen(false)}
                style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 7, padding: "10px 16px", fontSize: 13, cursor: "pointer", color: "#374151" }}>
                Cancelar
              </button>
            </div>

            <div style={{ marginTop: 12, fontSize: 10, color: "#9ca3af", textAlign: "center" }}>
              O diálogo de impressão do navegador será aberto — escolha "Salvar como PDF"
            </div>
          </div>
        </div>
      )}
    </>
  );
}
