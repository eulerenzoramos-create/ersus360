// src/pages/FolhaPagamento.tsx — Folha de Pagamento SMS Apuí/AM
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGetRaw } from "../lib/api";
import { FileText, Download, Printer, Filter, AlertTriangle } from "lucide-react";
import { BRL, BRL_AXIS, PCT } from "../lib/fmt";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

// ── CSS impressão injetado no <head> uma única vez ────────────────────────────
const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #folha-print-area, #folha-print-area * { visibility: visible !important; }
  #folha-print-area {
    position: fixed; inset: 0; width: 100%; padding: 0;
    background: #fff; font-family: Arial, sans-serif; font-size: 10pt;
  }
  @page { size: A4 landscape; margin: 12mm 10mm; }
}
`;
function injectPrintCSS() {
  if (document.getElementById("folha-print-css")) return;
  const s = document.createElement("style");
  s.id = "folha-print-css";
  s.textContent = PRINT_CSS;
  document.head.appendChild(s);
}

// ── Geração de janela de impressão isolada ────────────────────────────────────
function imprimirFolha(folha: any, competencia: string, compLabel: string) {
  const BRL2 = (v: number) => v.toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
  const LABEL_V: Record<string,string> = {
    estatutario:"Estatutário", temporario:"Temporário",
    clt:"CLT", terceirizado:"Terceirizado", comissionado:"Comissionado",
  };

  const rows = folha.verbas.map((v: any, i: number) => `
    <tr style="background:${i%2===0?"#fff":"#f7fafc"}">
      <td>${i+1}</td>
      <td style="font-family:monospace;color:#1a6baa">${v.matricula}</td>
      <td style="font-weight:600">${v.nome}</td>
      <td>${v.cargo}</td>
      <td>${LABEL_V[v.vinculo]||v.vinculo}</td>
      <td>${v.fonte_contabil} · ${v.fonte_grupo}</td>
      <td style="text-align:right">${BRL2(v.salario_base)}</td>
      <td style="text-align:right;color:#b07a00">${v.adicional_interioridade>0?"+"+BRL2(v.adicional_interioridade):"—"}</td>
      <td style="text-align:right;font-weight:700">${BRL2(v.bruto)}</td>
      <td style="text-align:right;color:#b07a00">(${BRL2(v.desc_inss)})</td>
      <td style="text-align:right;color:#b83232">(${BRL2(v.desc_irrf)})</td>
      <td style="text-align:right;font-weight:800;color:#14864e">${BRL2(v.liquido)}</td>
      <td style="text-align:right;color:#b83232">${BRL2(v.custo_total_empregador)}</td>
    </tr>
  `).join("");

  const resumoRows = folha.resumo_por_fonte.map((r: any) => `
    <tr>
      <td style="font-weight:600">${r.label}</td>
      <td style="font-family:monospace;color:#1a6baa">${r.contabil}</td>
      <td>${r.grupo}</td>
      <td style="text-align:center">${r.servidores}</td>
      <td style="text-align:right">${BRL2(r.bruto)}</td>
      <td style="text-align:right;color:#14864e">${BRL2(r.liquido)}</td>
      <td style="text-align:right;color:#b83232">${BRL2(r.custo_total)}</td>
    </tr>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Folha de Pagamento — SMS Apuí/AM — ${compLabel}</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:Arial,sans-serif; font-size:9pt; color:#222; background:#fff; }
  h1 { font-size:14pt; font-weight:800; color:#0d2137; }
  h2 { font-size:11pt; font-weight:700; color:#1a6baa; margin:16px 0 6px; border-bottom:1px solid #dde4ee; padding-bottom:4px; }
  .header { background:#0d2137; color:#fff; padding:10px 16px; margin-bottom:12px; }
  .header span { font-size:9pt; color:#9ab8d8; }
  .kpis { display:flex; gap:10px; margin-bottom:14px; }
  .kpi { flex:1; border:1px solid #dde4ee; border-radius:6px; padding:8px 12px; border-top:3px solid #1a6baa; }
  .kpi .l { font-size:7.5pt; color:#6b7280; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
  .kpi .v { font-size:15pt; font-weight:800; margin-top:2px; }
  table { width:100%; border-collapse:collapse; font-size:8pt; margin-bottom:16px; }
  th { background:#e8f1fa; color:#0d2137; font-weight:700; padding:5px 7px; text-align:left; border-bottom:2px solid #1a6baa; white-space:nowrap; font-size:7.5pt; }
  td { padding:4px 7px; border-bottom:1px solid #e8edf4; vertical-align:middle; }
  .total-row { background:#0d2137; color:#fff; font-weight:800; }
  .total-row td { color:#fff; border-color:#0d2137; }
  .rodape { margin-top:20px; font-size:7pt; color:#9ca3af; border-top:1px solid #dde4ee; padding-top:8px; }
  .assinaturas { display:flex; gap:40px; margin-top:32px; }
  .ass { flex:1; border-top:1px solid #333; padding-top:6px; font-size:8pt; text-align:center; }
  @page { size:A4 landscape; margin:12mm 10mm; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style>
</head>
<body>
<div class="header">
  <h1>FOLHA DE PAGAMENTO — SMS APUÍ/AM</h1>
  <span>Competência: <strong style="color:#fff">${compLabel}</strong> &nbsp;·&nbsp; Processado em: ${new Date().toLocaleString("pt-BR")} &nbsp;·&nbsp; ERSUS 360</span>
</div>

<div class="kpis">
  <div class="kpi"><div class="l">Total Servidores</div><div class="v" style="color:#0d2137">${folha.total_servidores}</div></div>
  <div class="kpi"><div class="l">Total Bruto</div><div class="v" style="color:#1a6baa">${BRL2(folha.total_bruto)}</div></div>
  <div class="kpi"><div class="l">Total Líquido</div><div class="v" style="color:#14864e">${BRL2(folha.total_liquido)}</div></div>
  <div class="kpi"><div class="l">INSS Descontado</div><div class="v" style="color:#b07a00">${BRL2(folha.total_inss_descontado)}</div></div>
  <div class="kpi"><div class="l">IRRF Descontado</div><div class="v" style="color:#b83232">${BRL2(folha.total_irrf_descontado)}</div></div>
  <div class="kpi"><div class="l">Custo Empregador</div><div class="v" style="color:#b83232">${BRL2(folha.total_custo_empregador)}</div></div>
</div>

<h2>I — Resumo por Fonte de Pagamento</h2>
<table>
  <thead><tr>
    <th>Fonte de Pagamento</th><th>Contábil (FR)</th><th>Grupo</th>
    <th style="text-align:center">Serv.</th><th style="text-align:right">Bruto</th>
    <th style="text-align:right">Líquido</th><th style="text-align:right">Custo Total</th>
  </tr></thead>
  <tbody>${resumoRows}</tbody>
  <tr class="total-row">
    <td colspan="3"><strong>TOTAL GERAL</strong></td>
    <td style="text-align:center">${folha.total_servidores}</td>
    <td style="text-align:right">${BRL2(folha.total_bruto)}</td>
    <td style="text-align:right">${BRL2(folha.total_liquido)}</td>
    <td style="text-align:right">${BRL2(folha.total_custo_empregador)}</td>
  </tr>
</table>

<h2>II — Folha Detalhada de Servidores (ordenada por Fonte → Nome)</h2>
<table>
  <thead><tr>
    <th>#</th><th>Matrícula</th><th>Nome</th><th>Cargo</th><th>Vínculo</th>
    <th>Fonte / FR</th><th style="text-align:right">Sal. Base</th>
    <th style="text-align:right">Adicional</th><th style="text-align:right">Bruto</th>
    <th style="text-align:right">INSS</th><th style="text-align:right">IRRF</th>
    <th style="text-align:right">Líquido</th><th style="text-align:right">Custo Total</th>
  </tr></thead>
  <tbody>${rows}</tbody>
  <tr class="total-row">
    <td colspan="6"><strong>TOTAL</strong></td>
    <td style="text-align:right">${BRL2(folha.verbas.reduce((a:number,v:any)=>a+v.salario_base,0))}</td>
    <td style="text-align:right">${BRL2(folha.verbas.reduce((a:number,v:any)=>a+v.adicional_interioridade,0))}</td>
    <td style="text-align:right">${BRL2(folha.total_bruto)}</td>
    <td style="text-align:right">(${BRL2(folha.total_inss_descontado)})</td>
    <td style="text-align:right">(${BRL2(folha.total_irrf_descontado)})</td>
    <td style="text-align:right">${BRL2(folha.total_liquido)}</td>
    <td style="text-align:right">${BRL2(folha.total_custo_empregador)}</td>
  </tr>
</table>

<div class="assinaturas">
  <div class="ass">Secretário(a) Municipal de Saúde</div>
  <div class="ass">Responsável pelo Setor de RH</div>
  <div class="ass">Contador(a) Responsável — CRC</div>
  <div class="ass">Ordenador(a) de Despesa</div>
</div>

<div class="rodape">
  Folha processada pelo sistema ERSUS 360 · FMS Apuí/AM · Competência ${compLabel} ·
  Salários calculados conforme PCCS SMS Apuí (ref. Jul/2026) · INSS/IRRF: tabelas vigentes 2026 ·
  Encargos: IN RFB 2.110/2022 · Para fins contábeis, utilizar os valores empenho pela Contabilidade Municipal.
</div>

<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};</script>
</body></html>`;

  const w = window.open("", "_blank", "width=1200,height=850");
  if (!w) { alert("Permita pop-ups para este site para gerar a impressão."); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const COR_VINCULO: Record<string, string> = {
  estatutario: "#059669", temporario: "#d97706",
  clt: "#0284c7", terceirizado: "#7c3aed", comissionado: "#dc2626",
};
const LABEL_VINCULO: Record<string, string> = {
  estatutario: "Estatutário", temporario: "Temporário",
  clt: "CLT", terceirizado: "Terceirizado", comissionado: "Comissionado",
};
const COR_GRUPO: Record<string, string> = {
  MS: "#1a6baa", MUNICIPAL: "#14864e", ESTADUAL: "#b07a00",
};

// ── Sub-componentes ───────────────────────────────────────────────────────────
function KPICard({ label, value, sub, cor }: { label: string; value: string; sub?: string; cor?: string }) {
  return (
    <div style={{ background:"#fff", border:"1px solid #dde4ee", borderRadius:10,
      padding:"14px 18px", borderTop:`3px solid ${cor||"#1a6baa"}` }}>
      <div style={{ fontSize:11, color:"#6b7280", fontWeight:600, textTransform:"uppercase", letterSpacing:".04em" }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:800, color: cor||"#0d2137", marginTop:4 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"#9ca3af", marginTop:3 }}>{sub}</div>}
    </div>
  );
}

function Badge({ label, cor }: { label: string; cor: string }) {
  return (
    <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:4, fontSize:10,
      fontWeight:700, background:cor+"18", color:cor, border:`1px solid ${cor}30`, whiteSpace:"nowrap" }}>
      {label}
    </span>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
type Aba = "resumo" | "detalhada" | "por_fonte" | "encargos";

export default function FolhaPagamento() {
  useState(() => { injectPrintCSS(); });
  const [aba, setAba] = useState<Aba>("resumo");
  const [competencia, setCompetencia] = useState("2026-07");
  const [filtroFonte, setFiltroFonte] = useState("");
  const [filtroVinculo, setFiltroVinculo] = useState("");
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["folha", competencia],
    queryFn: () => apiGetRaw(`/api/folha/folha?competencia=${competencia}`),
  });

  const folha = data as any;

  const verbasFiltradas = useMemo(() => {
    if (!folha?.verbas) return [];
    return folha.verbas.filter((v: any) =>
      (!filtroFonte   || v.fonte_pagamento === filtroFonte) &&
      (!filtroVinculo || v.vinculo === filtroVinculo) &&
      (!filtroGrupo   || v.fonte_grupo === filtroGrupo) &&
      (!filtroNome    || v.nome.toLowerCase().includes(filtroNome.toLowerCase()) || v.matricula.includes(filtroNome))
    );
  }, [folha, filtroFonte, filtroVinculo, filtroGrupo, filtroNome]);

  const COMP_LABEL: Record<string, string> = {
    "2026-01":"Jan/2026","2026-02":"Fev/2026","2026-03":"Mar/2026","2026-04":"Abr/2026",
    "2026-05":"Mai/2026","2026-06":"Jun/2026","2026-07":"Jul/2026","2026-08":"Ago/2026",
    "2026-09":"Set/2026","2026-10":"Out/2026","2026-11":"Nov/2026","2026-12":"Dez/2026",
  };

  const ABAS: {id: Aba; label: string}[] = [
    { id:"resumo",    label:"Resumo Geral" },
    { id:"por_fonte", label:"Por Fonte de Pagamento" },
    { id:"detalhada", label:"Folha Detalhada" },
    { id:"encargos",  label:"Encargos Patronais" },
  ];

  const tabStyle = (a: boolean): React.CSSProperties => ({
    padding:"9px 16px", border:"none", cursor:"pointer", fontSize:12, fontWeight: a ? 700 : 400,
    background: a ? "#0d2137" : "transparent", color: a ? "#fff" : "#6b7280",
    borderRadius:"6px 6px 0 0",
  });

  const thSt: React.CSSProperties = {
    padding:"8px 12px", textAlign:"left", fontSize:10, fontWeight:700,
    background:"#e8f1fa", color:"#0d2137", borderBottom:"2px solid #1a6baa",
    whiteSpace:"nowrap", letterSpacing:".03em",
  };
  const tdSt: React.CSSProperties = {
    padding:"8px 12px", fontSize:12, borderBottom:"1px solid #e8edf4", verticalAlign:"middle",
  };

  if (!isLoading && !data) return (
    <div style={{ padding: 24 }}>
      <NaoDisponivelBanner
        titulo="FolhaPagamento indisponivel"
        nota="Dados nao disponiveis — integracao pendente de configuracao no Railway."
      />
    </div>
  );

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", minHeight:"100vh", background:"#f0f5fb" }}>

      {/* Header */}
      <div style={{ background:"#0d2137", color:"#fff", padding:"16px 24px",
        display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <FileText size={22} color="#1565c0"/>
          <div>
            <div style={{ fontSize:17, fontWeight:700 }}>Folha de Pagamento — SMS Apuí/AM</div>
            <div style={{ fontSize:11, color:"#9ab8d8", marginTop:2 }}>
              Processamento por Fonte · Contabilidade Pública · Competência {COMP_LABEL[competencia]||competencia}
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <select value={competencia} onChange={e => setCompetencia(e.target.value)}
            style={{ padding:"7px 12px", border:"1px solid #2d4a6e", background:"#1a3356",
              color:"#fff", borderRadius:6, fontSize:12 }}>
            {Object.entries(COMP_LABEL).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px",
            background:"#1a6baa", border:"none", borderRadius:6, color:"#fff", fontSize:12,
            cursor:"pointer", fontWeight:600 }}
            onClick={() => folha && imprimirFolha(folha, competencia, COMP_LABEL[competencia]||competencia)}>
            <Printer size={14}/> Imprimir
          </button>
          <button style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px",
            background:"#14864e", border:"none", borderRadius:6, color:"#fff", fontSize:12,
            cursor:"pointer", fontWeight:600 }}>
            <Download size={14}/> Exportar
          </button>
        </div>
      </div>

      {isLoading && (
        <div style={{ padding:48, textAlign:"center", color:"#6b7280" }}>Carregando folha de pagamento...</div>
      )}

      {folha?.situacao_dado === "nao_disponivel" && (
        <div style={{ maxWidth:900, margin:"48px auto", padding:"32px 24px", background:"#fff",
          border:"1px solid #e2e8f0", borderRadius:12, textAlign:"center" }}>
          <AlertTriangle size={40} color="#d97706" style={{ marginBottom:16 }}/>
          <div style={{ fontSize:18, fontWeight:700, color:"#0d2137", marginBottom:8 }}>
            Folha de Pagamento Indisponível
          </div>
          <div style={{ fontSize:13, color:"#64748b", maxWidth:560, margin:"0 auto 16px", lineHeight:1.6 }}>
            {folha.nota || "Integração com SIAPE ou sistema de RH municipal ainda não configurada. Nenhum servidor inventado."}
          </div>
          <div style={{ display:"inline-flex", gap:8, padding:"8px 16px", background:"#fef3c7",
            border:"1px solid #d97706", borderRadius:8, fontSize:12, color:"#92400e" }}>
            <AlertTriangle size={14}/> situacao_dado: nao_disponivel
          </div>
        </div>
      )}

      {folha && folha.situacao_dado !== "nao_disponivel" && (
        <div style={{ maxWidth:1300, margin:"0 auto", padding:"20px 20px 48px" }}>

          {/* KPIs */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:20 }}>
            <KPICard label="Total Servidores"  value={`${folha.total_servidores}`}        cor="#0d2137"/>
            <KPICard label="Total Bruto"        value={BRL(folha.total_bruto)}             cor="#1a6baa" sub={`Comp. ${COMP_LABEL[competencia]||competencia}`}/>
            <KPICard label="Total Líquido"      value={BRL(folha.total_liquido)}           cor="#14864e"/>
            <KPICard label="INSS Descontado"    value={BRL(folha.total_inss_descontado)}   cor="#b07a00"/>
            <KPICard label="Custo Total Empregador" value={BRL(folha.total_custo_empregador)} cor="#b83232" sub="incl. encargos patronais"/>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:2, borderBottom:"2px solid #dde4ee", marginBottom:0, background:"#f0f5fb" }}>
            {ABAS.map(a => <button key={a.id} onClick={() => setAba(a.id)} style={tabStyle(aba === a.id)}>{a.label}</button>)}
          </div>

          {/* ── RESUMO GERAL ── */}
          {aba === "resumo" && (
            <div style={{ background:"#fff", border:"1px solid #dde4ee", borderRadius:"0 0 10px 10px", padding:20 }}>
              <div style={{ fontWeight:700, color:"#0d2137", fontSize:14, marginBottom:16,
                borderBottom:"1px solid #dde4ee", paddingBottom:10 }}>
                📊 Resumo Geral — Competência {COMP_LABEL[competencia]||competencia}
              </div>

              {/* Alertas */}
              <div style={{ background:"#fff8e1", border:"1px solid #fbbf24", borderRadius:8,
                padding:"12px 16px", marginBottom:16, display:"flex", gap:10, alignItems:"flex-start" }}>
                <AlertTriangle size={16} color="#d97706" style={{ flexShrink:0, marginTop:2 }}/>
                <div style={{ fontSize:12, color:"#78350f" }}>
                  <strong>Atenção contabilidade:</strong> Folha processada conforme fontes do SIOPS.
                  Empenhos devem ser separados por Fonte de Recurso (FR) conforme Art. 32 da LRF.
                  Transferências fundo a fundo MS: creditadas até dia 15 de cada mês.
                </div>
              </div>

              {/* Tabela resumo por grupo */}
              {["MS","MUNICIPAL","ESTADUAL"].map(grupo => {
                const itens = folha.resumo_por_fonte.filter((r: any) => r.grupo === grupo);
                if (!itens.length) return null;
                const totGrupo = { bruto: itens.reduce((a: number,r: any) => a + r.bruto, 0),
                  liquido: itens.reduce((a: number,r: any) => a + r.liquido, 0),
                  custo: itens.reduce((a: number,r: any) => a + r.custo_total, 0),
                  serv: itens.reduce((a: number,r: any) => a + r.servidores, 0) };
                const cor = COR_GRUPO[grupo]||"#555";
                return (
                  <div key={grupo} style={{ marginBottom:20 }}>
                    <div style={{ background:cor, color:"#fff", padding:"8px 14px",
                      borderRadius:"8px 8px 0 0", fontWeight:700, fontSize:12,
                      display:"flex", justifyContent:"space-between" }}>
                      <span>{grupo === "MS" ? "🏛️ Recursos Federais — Ministério da Saúde"
                        : grupo === "MUNICIPAL" ? "🏙️ Recurso Próprio Municipal"
                        : "🏛️ Tesouro Estadual (SES-AM)"}</span>
                      <span>{totGrupo.serv} servidores · {BRL(totGrupo.bruto)} bruto</span>
                    </div>
                    <div style={{ overflowX:"auto" }}>
                      <table style={{ width:"100%", borderCollapse:"collapse" }}>
                        <thead>
                          <tr>
                            {["Fonte","Contábil (FR)","Servidores","Bruto","Líquido","Custo Total"].map(h => (
                              <th key={h} style={{ ...thSt, background: cor+"18", color:cor }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {itens.map((r: any) => (
                            <tr key={r.fonte} style={{ borderBottom:"1px solid #e8edf4" }}>
                              <td style={tdSt}><span style={{ fontWeight:600 }}>{r.label}</span></td>
                              <td style={{ ...tdSt, fontFamily:"monospace", color:"#1a6baa" }}>{r.contabil}</td>
                              <td style={{ ...tdSt, textAlign:"center", fontWeight:700 }}>{r.servidores}</td>
                              <td style={{ ...tdSt, fontWeight:700 }}>{BRL(r.bruto)}</td>
                              <td style={{ ...tdSt, color:"#14864e", fontWeight:600 }}>{BRL(r.liquido)}</td>
                              <td style={{ ...tdSt, color:"#b83232", fontWeight:600 }}>{BRL(r.custo_total)}</td>
                            </tr>
                          ))}
                          <tr style={{ background: cor+"0d", fontWeight:700 }}>
                            <td style={tdSt} colSpan={2}><strong>SUBTOTAL {grupo}</strong></td>
                            <td style={{ ...tdSt, textAlign:"center" }}><strong>{totGrupo.serv}</strong></td>
                            <td style={tdSt}><strong>{BRL(totGrupo.bruto)}</strong></td>
                            <td style={{ ...tdSt, color:"#14864e" }}><strong>{BRL(totGrupo.liquido)}</strong></td>
                            <td style={{ ...tdSt, color:"#b83232" }}><strong>{BRL(totGrupo.custo)}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

              {/* Total geral */}
              <div style={{ background:"#0d2137", color:"#fff", borderRadius:8, padding:"14px 20px",
                display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginTop:8 }}>
                {[
                  { l:"TOTAL SERVIDORES", v:`${folha.total_servidores}` },
                  { l:"TOTAL BRUTO",      v:BRL(folha.total_bruto) },
                  { l:"TOTAL LÍQUIDO",    v:BRL(folha.total_liquido) },
                  { l:"CUSTO EMPREGADOR", v:BRL(folha.total_custo_empregador) },
                ].map(k => (
                  <div key={k.l}>
                    <div style={{ fontSize:10, color:"#9ab8d8", fontWeight:600, letterSpacing:".04em" }}>{k.l}</div>
                    <div style={{ fontSize:18, fontWeight:800, marginTop:4 }}>{k.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── POR FONTE ── */}
          {aba === "por_fonte" && (
            <div style={{ background:"#fff", border:"1px solid #dde4ee", borderRadius:"0 0 10px 10px", padding:20 }}>
              <div style={{ fontWeight:700, color:"#0d2137", fontSize:14, marginBottom:16,
                borderBottom:"1px solid #dde4ee", paddingBottom:10 }}>
                🗂️ Detalhamento por Fonte de Pagamento
              </div>
              {folha.resumo_por_fonte.map((r: any) => {
                const cor = COR_GRUPO[r.grupo]||"#555";
                const servsDesteFonte = folha.verbas.filter((v: any) => v.fonte_pagamento === r.fonte);
                return (
                  <div key={r.fonte} style={{ marginBottom:24, border:`1px solid ${cor}30`,
                    borderRadius:10, overflow:"hidden" }}>
                    <div style={{ background:cor+"12", borderBottom:`2px solid ${cor}`,
                      padding:"10px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontWeight:700, color:cor, fontSize:13 }}>{r.label}</div>
                        <div style={{ fontSize:11, color:"#6b7280" }}>
                          Fonte Contábil: <strong>{r.contabil}</strong> · {r.servidores} servidores
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontWeight:800, fontSize:16 }}>{BRL(r.bruto)}</div>
                        <div style={{ fontSize:11, color:"#14864e" }}>Líquido: {BRL(r.liquido)}</div>
                      </div>
                    </div>
                    <div style={{ overflowX:"auto" }}>
                      <table style={{ width:"100%", borderCollapse:"collapse" }}>
                        <thead>
                          <tr>
                            {["Matrícula","Nome","Cargo","Vínculo","C.H.","Unidade","Bruto","INSS","IRRF","Líquido"].map(h => (
                              <th key={h} style={thSt}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {servsDesteFonte.map((v: any) => (
                            <tr key={v.matricula}>
                              <td style={{ ...tdSt, fontFamily:"monospace", color:"#1a6baa" }}>{v.matricula}</td>
                              <td style={{ ...tdSt, fontWeight:600 }}>{v.nome}</td>
                              <td style={{ ...tdSt, color:"#6b7280" }}>{v.cargo}</td>
                              <td style={tdSt}><Badge label={LABEL_VINCULO[v.vinculo]||v.vinculo} cor={COR_VINCULO[v.vinculo]||"#555"}/></td>
                              <td style={{ ...tdSt, textAlign:"center" }}>{v.carga_horaria}h</td>
                              <td style={{ ...tdSt, fontSize:11, color:"#6b7280" }}>{v.unidade}</td>
                              <td style={{ ...tdSt, fontWeight:700 }}>{BRL(v.bruto)}</td>
                              <td style={{ ...tdSt, color:"#b07a00" }}>({BRL(v.desc_inss)})</td>
                              <td style={{ ...tdSt, color:"#b83232" }}>({BRL(v.desc_irrf)})</td>
                              <td style={{ ...tdSt, fontWeight:700, color:"#14864e" }}>{BRL(v.liquido)}</td>
                            </tr>
                          ))}
                          <tr style={{ background:"#f8fafc", fontWeight:700 }}>
                            <td colSpan={6} style={tdSt}><strong>Subtotal</strong></td>
                            <td style={tdSt}><strong>{BRL(servsDesteFonte.reduce((a: number,v: any) => a+v.bruto,0))}</strong></td>
                            <td style={{ ...tdSt, color:"#b07a00" }}>({BRL(servsDesteFonte.reduce((a: number,v: any) => a+v.desc_inss,0))})</td>
                            <td style={{ ...tdSt, color:"#b83232" }}>({BRL(servsDesteFonte.reduce((a: number,v: any) => a+v.desc_irrf,0))})</td>
                            <td style={{ ...tdSt, color:"#14864e" }}><strong>{BRL(servsDesteFonte.reduce((a: number,v: any) => a+v.liquido,0))}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── FOLHA DETALHADA ── */}
          {aba === "detalhada" && (
            <div style={{ background:"#fff", border:"1px solid #dde4ee", borderRadius:"0 0 10px 10px", padding:20 }}>
              {/* Filtros */}
              <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
                <Filter size={14} color="#6b7280"/>
                <input placeholder="Buscar nome ou matrícula..."
                  value={filtroNome} onChange={e => setFiltroNome(e.target.value)}
                  style={{ padding:"6px 10px", border:"1px solid #dde4ee", borderRadius:6,
                    fontSize:12, width:220 }}/>
                <select value={filtroGrupo} onChange={e => setFiltroGrupo(e.target.value)}
                  style={{ padding:"6px 10px", border:"1px solid #dde4ee", borderRadius:6, fontSize:12 }}>
                  <option value="">Todos os grupos</option>
                  <option value="MS">Recursos MS</option>
                  <option value="MUNICIPAL">Recurso Próprio</option>
                  <option value="ESTADUAL">Tesouro Estadual</option>
                </select>
                <select value={filtroFonte} onChange={e => setFiltroFonte(e.target.value)}
                  style={{ padding:"6px 10px", border:"1px solid #dde4ee", borderRadius:6, fontSize:12 }}>
                  <option value="">Todas as fontes</option>
                  {folha.resumo_por_fonte.map((r: any) => (
                    <option key={r.fonte} value={r.fonte}>{r.label}</option>
                  ))}
                </select>
                <select value={filtroVinculo} onChange={e => setFiltroVinculo(e.target.value)}
                  style={{ padding:"6px 10px", border:"1px solid #dde4ee", borderRadius:6, fontSize:12 }}>
                  <option value="">Todos os vínculos</option>
                  {["estatutario","temporario","clt","terceirizado"].map(v => (
                    <option key={v} value={v}>{LABEL_VINCULO[v]}</option>
                  ))}
                </select>
                <span style={{ fontSize:11, color:"#6b7280" }}>{verbasFiltradas.length} registros</span>
              </div>

              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr>
                      {["Ord.","Matrícula","Nome","Cargo","Vínculo","CH","Unidade","Equipe",
                        "Fonte (FR)","Sal. Base","Adicional","Bruto","INSS","IRRF","Líquido"].map(h => (
                        <th key={h} style={thSt}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {verbasFiltradas.map((v: any, i: number) => (
                      <tr key={v.matricula}
                        style={{ background: i%2===0 ? "#fff" : "#f8fafc" }}>
                        <td style={{ ...tdSt, color:"#9ca3af", textAlign:"center" }}>{i+1}</td>
                        <td style={{ ...tdSt, fontFamily:"monospace", color:"#1a6baa", fontWeight:600 }}>{v.matricula}</td>
                        <td style={{ ...tdSt, fontWeight:600, whiteSpace:"nowrap" }}>{v.nome}</td>
                        <td style={{ ...tdSt, color:"#4b5563", fontSize:11 }}>{v.cargo}</td>
                        <td style={tdSt}><Badge label={LABEL_VINCULO[v.vinculo]||v.vinculo} cor={COR_VINCULO[v.vinculo]||"#555"}/></td>
                        <td style={{ ...tdSt, textAlign:"center" }}>{v.carga_horaria}h</td>
                        <td style={{ ...tdSt, fontSize:10, color:"#6b7280", maxWidth:160 }}>{v.unidade}</td>
                        <td style={{ ...tdSt, fontSize:10, color:"#1a6baa" }}>{v.equipe}</td>
                        <td style={tdSt}>
                          <div style={{ fontSize:10, fontWeight:700, color:COR_GRUPO[v.fonte_grupo]||"#555" }}>
                            {v.fonte_contabil}
                          </div>
                          <div style={{ fontSize:10, color:"#6b7280" }}>{v.fonte_grupo}</div>
                        </td>
                        <td style={{ ...tdSt, textAlign:"right" }}>{BRL(v.salario_base)}</td>
                        <td style={{ ...tdSt, textAlign:"right", color:"#b07a00" }}>
                          {v.adicional_interioridade > 0 ? `+${BRL(v.adicional_interioridade)}` : "—"}
                        </td>
                        <td style={{ ...tdSt, fontWeight:700, textAlign:"right" }}>{BRL(v.bruto)}</td>
                        <td style={{ ...tdSt, color:"#b07a00", textAlign:"right" }}>({BRL(v.desc_inss)})</td>
                        <td style={{ ...tdSt, color:"#b83232", textAlign:"right" }}>({BRL(v.desc_irrf)})</td>
                        <td style={{ ...tdSt, fontWeight:800, color:"#14864e", textAlign:"right" }}>{BRL(v.liquido)}</td>
                      </tr>
                    ))}
                    {verbasFiltradas.length > 0 && (
                      <tr style={{ background:"#0d2137", color:"#fff", fontWeight:800 }}>
                        <td colSpan={9} style={{ ...tdSt, color:"#fff" }}><strong>TOTAL</strong></td>
                        <td style={{ ...tdSt, color:"#fff", textAlign:"right" }}>
                          {BRL(verbasFiltradas.reduce((a: number,v: any) => a+v.salario_base,0))}
                        </td>
                        <td style={{ ...tdSt, color:"#fbbf24", textAlign:"right" }}>
                          {BRL(verbasFiltradas.reduce((a: number,v: any) => a+v.adicional_interioridade,0))}
                        </td>
                        <td style={{ ...tdSt, color:"#1565c0", textAlign:"right" }}>
                          {BRL(verbasFiltradas.reduce((a: number,v: any) => a+v.bruto,0))}
                        </td>
                        <td style={{ ...tdSt, color:"#fbbf24", textAlign:"right" }}>
                          ({BRL(verbasFiltradas.reduce((a: number,v: any) => a+v.desc_inss,0))})
                        </td>
                        <td style={{ ...tdSt, color:"#fca5a5", textAlign:"right" }}>
                          ({BRL(verbasFiltradas.reduce((a: number,v: any) => a+v.desc_irrf,0))})
                        </td>
                        <td style={{ ...tdSt, color:"#6ee7b7", textAlign:"right" }}>
                          {BRL(verbasFiltradas.reduce((a: number,v: any) => a+v.liquido,0))}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── ENCARGOS PATRONAIS ── */}
          {aba === "encargos" && (
            <div style={{ background:"#fff", border:"1px solid #dde4ee", borderRadius:"0 0 10px 10px", padding:20 }}>
              <div style={{ fontWeight:700, color:"#0d2137", fontSize:14, marginBottom:16,
                borderBottom:"1px solid #dde4ee", paddingBottom:10 }}>
                ⚖️ Encargos Patronais — Custo Total ao Empregador
              </div>

              {/* Aviso */}
              <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:8,
                padding:"12px 16px", marginBottom:16, fontSize:12, color:"#1e40af" }}>
                <strong>Base legal:</strong> Encargos calculados conforme IN RFB 2.110/2022 (INSS), FGTS Lei 8.036/90,
                férias proporcionais (1/12 avos) e 13º proporcional. Terceirizados: encargos de responsabilidade da empresa contratada.
              </div>

              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr>
                      {["Matrícula","Nome","Vínculo","Bruto","INSS Patronal (14-20%)","FGTS (8%)","Férias Prop. (11,67%)","13º Prop. (8,33%)","Custo Total"].map(h => (
                        <th key={h} style={thSt}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {folha.verbas.map((v: any, i: number) => (
                      <tr key={v.matricula} style={{ background: i%2===0 ? "#fff":"#f8fafc" }}>
                        <td style={{ ...tdSt, fontFamily:"monospace", color:"#1a6baa" }}>{v.matricula}</td>
                        <td style={{ ...tdSt, fontWeight:600 }}>{v.nome}</td>
                        <td style={tdSt}><Badge label={LABEL_VINCULO[v.vinculo]||v.vinculo} cor={COR_VINCULO[v.vinculo]||"#555"}/></td>
                        <td style={{ ...tdSt, fontWeight:700, textAlign:"right" }}>{BRL(v.bruto)}</td>
                        <td style={{ ...tdSt, color:"#b07a00", textAlign:"right" }}>{BRL(v.enc_inss_patronal)}</td>
                        <td style={{ ...tdSt, color:"#1a6baa", textAlign:"right" }}>
                          {v.enc_fgts > 0 ? BRL(v.enc_fgts) : <span style={{ color:"#9ca3af" }}>—</span>}
                        </td>
                        <td style={{ ...tdSt, color:"#7c3aed", textAlign:"right" }}>{BRL(v.enc_ferias_prop)}</td>
                        <td style={{ ...tdSt, color:"#14864e", textAlign:"right" }}>{BRL(v.enc_decimo_terceiro)}</td>
                        <td style={{ ...tdSt, fontWeight:800, color:"#b83232", textAlign:"right" }}>{BRL(v.custo_total_empregador)}</td>
                      </tr>
                    ))}
                    <tr style={{ background:"#0d2137", color:"#fff", fontWeight:800 }}>
                      <td colSpan={3} style={{ ...tdSt, color:"#fff" }}><strong>TOTAL GERAL</strong></td>
                      <td style={{ ...tdSt, color:"#1565c0", textAlign:"right" }}>{BRL(folha.total_bruto)}</td>
                      <td style={{ ...tdSt, color:"#fbbf24", textAlign:"right" }}>
                        {BRL(folha.verbas.reduce((a: number,v: any) => a+v.enc_inss_patronal,0))}
                      </td>
                      <td style={{ ...tdSt, color:"#1d4ed8", textAlign:"right" }}>
                        {BRL(folha.verbas.reduce((a: number,v: any) => a+v.enc_fgts,0))}
                      </td>
                      <td style={{ ...tdSt, color:"#c4b5fd", textAlign:"right" }}>
                        {BRL(folha.verbas.reduce((a: number,v: any) => a+v.enc_ferias_prop,0))}
                      </td>
                      <td style={{ ...tdSt, color:"#6ee7b7", textAlign:"right" }}>
                        {BRL(folha.verbas.reduce((a: number,v: any) => a+v.enc_decimo_terceiro,0))}
                      </td>
                      <td style={{ ...tdSt, color:"#fca5a5", textAlign:"right" }}>
                        {BRL(folha.total_custo_empregador)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rodapé */}
          <div style={{ marginTop:16, fontSize:10, color:"#9ca3af", textAlign:"center" }}>
            Folha processada pelo sistema ERSUS360 · FMS Apuí/AM · Competência {COMP_LABEL[competencia]||competencia} ·
            Salários calculados conforme PCCS SMS Apuí (ref. Jul/2026) · INSS/IRRF: tabelas vigentes 2026 ·
            Encargos: IN RFB 2.110/2022 · Para fins contábeis, utilizar os valores empenho pela Contabilidade Municipal.
          </div>
        </div>
      )}
    </div>
  );
}
