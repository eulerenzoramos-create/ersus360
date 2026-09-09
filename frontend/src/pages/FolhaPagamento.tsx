// src/pages/FolhaPagamento.tsx — Folha de Pagamento SMS Apuí/AM — v4 completo
import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGetRaw, api } from "../lib/api";
import {
  FileText, Download, Printer, Filter, Users, MapPin, Calendar,
  Settings, Plus, Trash2, RefreshCw, AlertTriangle, CheckCircle,
  Clock, UserX, UserCheck, Home, Building2, ChevronDown, X
} from "lucide-react";
import { BRL } from "../lib/fmt";

// ── Tipos ─────────────────────────────────────────────────────────────────────
type Status = "ativo" | "licenca" | "licenca_maternidade" | "afastado" | "cedido" | "ferias";
type Aba = "resumo" | "por_fonte" | "detalhada" | "lotacao" | "presenca" | "gestao" | "encargos";

interface Servidor {
  matricula: string; nome: string; cargo: string; vinculo: string;
  status: Status; lotacao: string; setor: string; observacao?: string;
  fonte_pagamento: string; fonte_contabil: string; fonte_grupo: string;
  salario_base: number; adicional_interioridade: number; bruto: number;
  desc_inss: number; desc_irrf: number; liquido: number;
  custo_total_empregador: number; carga_horaria: number;
  enc_inss_patronal: number; enc_fgts: number;
  enc_ferias_prop: number; enc_decimo_terceiro: number;
}

// ── Print CSS ─────────────────────────────────────────────────────────────────
const PRINT_CSS = `@media print{body *{visibility:hidden!important}#folha-print-area,#folha-print-area *{visibility:visible!important}#folha-print-area{position:fixed;inset:0;width:100%;padding:0;background:#fff;font-family:Arial,sans-serif;font-size:10pt}@page{size:A4 landscape;margin:12mm 10mm}}`;
function injectPrintCSS() {
  if (document.getElementById("folha-print-css")) return;
  const s = document.createElement("style");
  s.id = "folha-print-css"; s.textContent = PRINT_CSS;
  document.head.appendChild(s);
}

// ── Helpers visuais ───────────────────────────────────────────────────────────
const BRL2 = (v: number) => v?.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) ?? "—";

const COR_STATUS: Record<string,string> = {
  ativo:"#059669", licenca:"#d97706", licenca_maternidade:"#db2777",
  afastado:"#dc2626", cedido:"#6366f1", ferias:"#0284c7",
};
const LABEL_STATUS: Record<string,string> = {
  ativo:"Ativo", licenca:"Lic. Saúde", licenca_maternidade:"Lic. Maternidade",
  afastado:"Afastado", cedido:"Cedido", ferias:"Férias",
};
const ICON_STATUS: Record<string, React.ReactNode> = {
  ativo:   <CheckCircle size={11}/>, licenca:  <Clock size={11}/>,
  licenca_maternidade: <UserCheck size={11}/>, afastado: <UserX size={11}/>,
  cedido:  <RefreshCw size={11}/>, ferias: <Calendar size={11}/>,
};

const COR_GRUPO: Record<string,string> = { MS:"#1a6baa", MUNICIPAL:"#14864e", ESTADUAL:"#b07a00" };
const COR_VINCULO: Record<string,string> = {
  estatutario:"#059669", temporario:"#d97706", clt:"#0284c7", comissionado:"#dc2626",
};
const LABEL_VINCULO: Record<string,string> = {
  estatutario:"Estatutário", temporario:"Temporário", clt:"CLT", comissionado:"Comissionado",
};
const COMP_LABEL: Record<string,string> = {
  "2026-01":"Jan/2026","2026-02":"Fev/2026","2026-03":"Mar/2026","2026-04":"Abr/2026",
  "2026-05":"Mai/2026","2026-06":"Jun/2026","2026-07":"Jul/2026","2026-08":"Ago/2026",
  "2026-09":"Set/2026","2026-10":"Out/2026","2026-11":"Nov/2026","2026-12":"Dez/2026",
};

function StatusBadge({ status }: { status: string }) {
  const cor = COR_STATUS[status] || "#6b7280";
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:3, padding:"2px 7px",
      borderRadius:4, fontSize:10, fontWeight:700, background:cor+"18", color:cor,
      border:`1px solid ${cor}30`, whiteSpace:"nowrap" }}>
      {ICON_STATUS[status]}
      {LABEL_STATUS[status] || status}
    </span>
  );
}

function Badge({ label, cor }: { label: string; cor: string }) {
  return (
    <span style={{ display:"inline-block", padding:"2px 7px", borderRadius:4, fontSize:10,
      fontWeight:700, background:cor+"18", color:cor, border:`1px solid ${cor}30`, whiteSpace:"nowrap" }}>
      {label}
    </span>
  );
}

function KPICard({ label, value, sub, cor }: { label:string; value:string; sub?:string; cor?:string }) {
  return (
    <div style={{ background:"#fff", border:"1px solid #dde4ee", borderRadius:10,
      padding:"14px 18px", borderTop:`3px solid ${cor||"#1a6baa"}` }}>
      <div style={{ fontSize:10, color:"#6b7280", fontWeight:700, textTransform:"uppercase", letterSpacing:".04em" }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:800, color:cor||"#0d2137", marginTop:4 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>{sub}</div>}
    </div>
  );
}

const thSt: React.CSSProperties = {
  padding:"8px 10px", textAlign:"left", fontSize:10, fontWeight:700,
  background:"#e8f1fa", color:"#0d2137", borderBottom:"2px solid #1a6baa",
  whiteSpace:"nowrap", letterSpacing:".03em",
};
const tdSt: React.CSSProperties = {
  padding:"7px 10px", fontSize:12, borderBottom:"1px solid #e8edf4", verticalAlign:"middle",
};

// ── Geração de impressão ──────────────────────────────────────────────────────
function imprimirFolha(folha: any, competencia: string, compLabel: string) {
  const rows = folha.verbas.map((v: any, i: number) => `
    <tr style="background:${i%2===0?"#fff":"#f7fafc"}">
      <td>${i+1}</td><td style="font-family:monospace;color:#1a6baa">${v.matricula}</td>
      <td style="font-weight:600">${v.nome}</td>
      <td>${v.cargo}</td>
      <td>${v.lotacao||v.setor||"—"}</td>
      <td>${LABEL_VINCULO[v.vinculo]||v.vinculo}</td>
      <td style="text-align:center"><span style="background:${(COR_STATUS[v.status||"ativo"]||"#059669")}18;color:${COR_STATUS[v.status||"ativo"]||"#059669"};padding:1px 6px;border-radius:3px;font-size:8pt;font-weight:700">${LABEL_STATUS[v.status||"ativo"]||"Ativo"}</span></td>
      <td style="text-align:right">${BRL2(v.bruto)}</td>
      <td style="text-align:right;color:#b07a00">(${BRL2(v.desc_inss)})</td>
      <td style="text-align:right;color:#b83232">(${BRL2(v.desc_irrf)})</td>
      <td style="text-align:right;font-weight:800;color:#14864e">${BRL2(v.liquido)}</td>
      <td style="text-align:right;color:#b83232">${BRL2(v.custo_total_empregador)}</td>
    </tr>`).join("");

  const resumoRows = folha.resumo_por_fonte.map((r: any) => `
    <tr><td style="font-weight:600">${r.label}</td>
    <td style="font-family:monospace;color:#1a6baa">${r.contabil}</td>
    <td>${r.grupo}</td><td style="text-align:center">${r.servidores}</td>
    <td style="text-align:right">${BRL2(r.bruto)}</td>
    <td style="text-align:right;color:#14864e">${BRL2(r.liquido)}</td>
    <td style="text-align:right;color:#b83232">${BRL2(r.custo_total)}</td></tr>`).join("");

  const ativos = folha.verbas.filter((v: any) => (v.status||"ativo") === "ativo").length;
  const afastados = folha.verbas.length - ativos;

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
<title>Folha de Pagamento — SMS Apuí/AM — ${compLabel}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:9pt;color:#222;background:#fff}
h1{font-size:14pt;font-weight:800;color:#0d2137}
h2{font-size:11pt;font-weight:700;color:#1a6baa;margin:16px 0 6px;border-bottom:1px solid #dde4ee;padding-bottom:4px}
.header{background:#0d2137;color:#fff;padding:10px 16px;margin-bottom:12px}
.header span{font-size:9pt;color:#9ab8d8}
.kpis{display:flex;gap:10px;margin-bottom:14px}
.kpi{flex:1;border:1px solid #dde4ee;border-radius:6px;padding:8px 12px;border-top:3px solid #1a6baa}
.kpi .l{font-size:7.5pt;color:#6b7280;font-weight:700;text-transform:uppercase}
.kpi .v{font-size:14pt;font-weight:800;margin-top:2px}
table{width:100%;border-collapse:collapse;font-size:8pt;margin-bottom:16px}
th{background:#e8f1fa;color:#0d2137;font-weight:700;padding:5px 7px;text-align:left;border-bottom:2px solid #1a6baa;white-space:nowrap;font-size:7.5pt}
td{padding:4px 7px;border-bottom:1px solid #e8edf4;vertical-align:middle}
.total-row{background:#0d2137;color:#fff;font-weight:800}
.total-row td{color:#fff;border-color:#0d2137}
.ass{flex:1;border-top:1px solid #333;padding-top:6px;font-size:8pt;text-align:center}
.assinaturas{display:flex;gap:40px;margin-top:32px}
.rodape{margin-top:20px;font-size:7pt;color:#9ca3af;border-top:1px solid #dde4ee;padding-top:8px}
@page{size:A4 landscape;margin:12mm 10mm}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="header"><h1>FOLHA DE PAGAMENTO — SMS APUÍ/AM</h1>
<span>Competência: <strong style="color:#fff">${compLabel}</strong> &nbsp;·&nbsp;
Processado em: ${new Date().toLocaleString("pt-BR")} &nbsp;·&nbsp; ERSUS 360 &nbsp;·&nbsp;
<strong style="color:#fff">${folha.total_servidores} servidores</strong> (${ativos} ativos, ${afastados} afastados/licença)</span></div>

<div class="kpis">
  <div class="kpi"><div class="l">Total Servidores</div><div class="v" style="color:#0d2137">${folha.total_servidores}</div></div>
  <div class="kpi"><div class="l">Total Bruto</div><div class="v" style="color:#1a6baa">${BRL2(folha.total_bruto)}</div></div>
  <div class="kpi"><div class="l">Total Líquido</div><div class="v" style="color:#14864e">${BRL2(folha.total_liquido)}</div></div>
  <div class="kpi"><div class="l">INSS Descontado</div><div class="v" style="color:#b07a00">${BRL2(folha.total_inss_descontado)}</div></div>
  <div class="kpi"><div class="l">IRRF Descontado</div><div class="v" style="color:#b83232">${BRL2(folha.total_irrf_descontado)}</div></div>
  <div class="kpi"><div class="l">Custo Empregador</div><div class="v" style="color:#b83232">${BRL2(folha.total_custo_empregador)}</div></div>
</div>

<h2>I — Resumo por Fonte</h2>
<table><thead><tr><th>Fonte</th><th>Contábil</th><th>Grupo</th><th style="text-align:center">Serv.</th>
<th style="text-align:right">Bruto</th><th style="text-align:right">Líquido</th><th style="text-align:right">Custo Total</th></tr></thead>
<tbody>${resumoRows}</tbody>
<tr class="total-row"><td colspan="3"><strong>TOTAL GERAL</strong></td>
<td style="text-align:center">${folha.total_servidores}</td>
<td style="text-align:right">${BRL2(folha.total_bruto)}</td>
<td style="text-align:right">${BRL2(folha.total_liquido)}</td>
<td style="text-align:right">${BRL2(folha.total_custo_empregador)}</td></tr></table>

<h2>II — Folha Detalhada (por Fonte → Nome)</h2>
<table><thead><tr><th>#</th><th>Matrícula</th><th>Nome</th><th>Cargo</th><th>Lotação</th>
<th>Vínculo</th><th>Status</th>
<th style="text-align:right">Bruto</th><th style="text-align:right">INSS</th>
<th style="text-align:right">IRRF</th><th style="text-align:right">Líquido</th>
<th style="text-align:right">Custo Total</th></tr></thead>
<tbody>${rows}</tbody>
<tr class="total-row"><td colspan="7"><strong>TOTAL</strong></td>
<td style="text-align:right">${BRL2(folha.total_bruto)}</td>
<td style="text-align:right">(${BRL2(folha.total_inss_descontado)})</td>
<td style="text-align:right">(${BRL2(folha.total_irrf_descontado)})</td>
<td style="text-align:right">${BRL2(folha.total_liquido)}</td>
<td style="text-align:right">${BRL2(folha.total_custo_empregador)}</td></tr></table>

<div class="assinaturas">
  <div class="ass">Secretário(a) Municipal de Saúde</div>
  <div class="ass">Resp. pelo Setor de RH</div>
  <div class="ass">Contador(a) — CRC</div>
  <div class="ass">Ordenador(a) de Despesa</div>
</div>
<div class="rodape">Folha processada pelo sistema ERSUS 360 · FMS Apuí/AM · Competência ${compLabel} ·
Valores estimados conforme PCCS SMS Apuí (ref. Jul/2026) · INSS/IRRF: tabelas vigentes 2026 ·
Encargos: IN RFB 2.110/2022 · Para fins contábeis, utilizar os valores empenho pela Contabilidade Municipal.</div>
<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};</script>
</body></html>`;

  const w = window.open("", "_blank", "width=1200,height=850");
  if (!w) { alert("Permita pop-ups para imprimir."); return; }
  w.document.open(); w.document.write(html); w.document.close();
}

// ── Modal: Adicionar Funcionário ──────────────────────────────────────────────
function ModalNovoFuncionario({ onClose, onSalvo }: { onClose: ()=>void; onSalvo: ()=>void }) {
  const [form, setForm] = useState({
    nome:"", cargo:"", vinculo:"estatutario", status:"ativo",
    lotacao:"Atenção Básica / APS", fonte_pagamento:"Municipal",
    fonte_contabil:"319011", fonte_grupo:"MUNICIPAL",
    bruto:"", carga_horaria:"40",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar() {
    if (!form.nome.trim() || !form.cargo.trim() || !form.bruto) {
      setErro("Preencha nome, cargo e salário bruto."); return;
    }
    setSalvando(true);
    try {
      const bruto = parseFloat(form.bruto.replace(",","."));
      await api.post("/api/folha/funcionario", {
        ...form, bruto, carga_horaria: parseInt(form.carga_horaria)||40,
        salario_base: round2(bruto*0.80), adicional_interioridade: round2(bruto*0.08),
        desc_inss: round2(bruto*0.12), desc_irrf: 0, liquido: round2(bruto*0.88),
        custo_total_empregador: round2(bruto*1.20),
        enc_inss_patronal: round2(bruto*0.20), enc_fgts:0,
        enc_ferias_prop: round2(bruto/12*1.333), enc_decimo_terceiro: round2(bruto/12),
        setor: form.lotacao,
      });
      onSalvo(); onClose();
    } catch { setErro("Erro de conexão."); }
    finally { setSalvando(false); }
  }

  const field = (label: string, key: string, type="text") => (
    <div style={{ marginBottom:12 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:4 }}>{label}</label>
      <input type={type} value={(form as any)[key]}
        onChange={e => setForm(f=>({...f,[key]:e.target.value}))}
        style={{ width:"100%", padding:"7px 10px", border:"1px solid #d1d5db",
          borderRadius:6, fontSize:13 }}/>
    </div>
  );
  const sel = (label: string, key: string, opts: Record<string,string>) => (
    <div style={{ marginBottom:12 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:4 }}>{label}</label>
      <select value={(form as any)[key]} onChange={e => setForm(f=>({...f,[key]:e.target.value}))}
        style={{ width:"100%", padding:"7px 10px", border:"1px solid #d1d5db", borderRadius:6, fontSize:13 }}>
        {Object.entries(opts).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:1000,
      display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#fff", borderRadius:12, padding:28, width:520, maxHeight:"90vh",
        overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontSize:16, fontWeight:800, color:"#0d2137" }}>
            <Plus size={16} style={{ marginRight:6, verticalAlign:"middle" }}/>Novo Servidor
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
            <X size={20} color="#6b7280"/>
          </button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
          <div style={{ gridColumn:"1/-1" }}>{field("Nome completo *","nome")}</div>
          {field("Cargo *","cargo")}
          {field("Salário Bruto (R$) *","bruto","text")}
          {sel("Vínculo","vinculo",LABEL_VINCULO)}
          {sel("Status","status",LABEL_STATUS)}
          {sel("Fonte de Pagamento","fonte_pagamento",{
            "Federal-APS":"Federal-APS","Federal-PACS":"Federal-PACS",
            "Federal-FUNASA":"Federal-FUNASA","Federal-MAC":"Federal-MAC","Municipal":"Municipal",
          })}
          {sel("Lotação / Setor","lotacao",{
            "Atenção Básica / APS":"Atenção Básica / APS","PACS":"PACS",
            "MAC / Hospital":"MAC / Hospital","Vig. Epidemiológica":"Vig. Epidemiológica",
            "Vig. Sanitária":"Vig. Sanitária","Saúde Bucal":"Saúde Bucal",
            "CAPS":"CAPS","Laboratório":"Laboratório","Sede SEMSA":"Sede SEMSA",
            "Gestão / Comissionados":"Gestão / Comissionados","Contratos":"Contratos",
          })}
          {field("Carga Horária","carga_horaria","number")}
        </div>
        {erro && <div style={{ padding:"8px 12px", background:"#fff7f7", border:"1px solid #fca5a5",
          borderRadius:6, fontSize:12, color:"#dc2626", marginBottom:12 }}>{erro}</div>}
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"8px 18px", border:"1px solid #d1d5db",
            borderRadius:6, background:"#fff", cursor:"pointer", fontSize:13 }}>Cancelar</button>
          <button onClick={salvar} disabled={salvando}
            style={{ padding:"8px 18px", background:salvando?"#9ca3af":"#1a6baa", border:"none",
              borderRadius:6, color:"#fff", cursor:"pointer", fontSize:13, fontWeight:700 }}>
            {salvando ? "Salvando..." : "Adicionar Servidor"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Alterar Status ─────────────────────────────────────────────────────
function ModalStatus({ servidor, onClose, onSalvo }: { servidor: Servidor; onClose:()=>void; onSalvo:()=>void }) {
  const [status, setStatus] = useState<Status>(servidor.status || "ativo");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar() {
    setSalvando(true);
    setErro("");
    try {
      await api.patch(`/api/folha/funcionario/${servidor.matricula}/status`, { status });
      onSalvo(); onClose();
    } catch (e: any) {
      setErro(e?.response?.data?.detail || "Erro ao salvar status.");
    } finally { setSalvando(false); }
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:1000,
      display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#fff", borderRadius:12, padding:28, width:380,
        boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
          <div style={{ fontSize:15, fontWeight:800, color:"#0d2137" }}>Alterar Status Funcional</div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer" }}><X size={20}/></button>
        </div>
        <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>{servidor.nome}</div>
        <div style={{ fontSize:11, color:"#6b7280", marginBottom:16 }}>{servidor.cargo}</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 }}>
          {(Object.entries(LABEL_STATUS) as [Status,string][]).map(([k,l]) => (
            <button key={k} onClick={() => setStatus(k)}
              style={{ padding:"10px 8px", border:`2px solid ${status===k?COR_STATUS[k]:"#e5e7eb"}`,
                borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:700,
                background: status===k ? COR_STATUS[k]+"18" : "#fff",
                color: status===k ? COR_STATUS[k] : "#374151", textAlign:"center",
                display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              {ICON_STATUS[k]}
              {l}
            </button>
          ))}
        </div>
        {erro && <div style={{ color:"#dc2626", fontSize:12, marginBottom:10, textAlign:"center" }}>{erro}</div>}
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"8px 16px", border:"1px solid #d1d5db",
            borderRadius:6, background:"#fff", cursor:"pointer", fontSize:13 }}>Cancelar</button>
          <button onClick={salvar} disabled={salvando}
            style={{ padding:"8px 16px", background:salvando?"#9ca3af":COR_STATUS[status],
              border:"none", borderRadius:6, color:"#fff", cursor:"pointer", fontSize:13, fontWeight:700 }}>
            {salvando?"Salvando...":"Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function round2(n: number) { return Math.round(n*100)/100; }

// ── Componente principal ──────────────────────────────────────────────────────
export default function FolhaPagamento() {
  useState(() => { injectPrintCSS(); });
  const qc = useQueryClient();
  const [aba, setAba] = useState<Aba>("resumo");
  const [competencia, setCompetencia] = useState("2026-07");
  const [filtroFonte, setFiltroFonte] = useState("");
  const [filtroVinculo, setFiltroVinculo] = useState("");
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroLotacao, setFiltroLotacao] = useState("");
  const [modalNovo, setModalNovo] = useState(false);
  const [modalStatus, setModalStatus] = useState<Servidor|null>(null);
  const [excluindo, setExcluindo] = useState<string|null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["folha", competencia],
    queryFn: () => apiGetRaw(`/api/folha/folha?competencia=${competencia}`),
  });

  const { data: presencaData } = useQuery({
    queryKey: ["presenca", competencia],
    queryFn: () => apiGetRaw(`/api/folha/presenca?competencia=${competencia}`),
    enabled: aba === "presenca",
  });

  const folha = data as any;

  const lotacoes = useMemo(() => {
    if (!folha?.verbas) return [];
    return Array.from(new Set(folha.verbas.map((v: any) => v.lotacao || v.setor || ""))).filter(Boolean).sort() as string[];
  }, [folha]);

  const ubsNomes = useMemo(() => {
    if (!folha?.verbas) return [];
    return Array.from(new Set(folha.verbas.map((v: any) => v.ubs_nome || ""))).filter(Boolean).sort() as string[];
  }, [folha]);

  const verbasFiltradas = useMemo(() => {
    if (!folha?.verbas) return [];
    return folha.verbas.filter((v: any) =>
      (!filtroFonte   || v.fonte_pagamento === filtroFonte) &&
      (!filtroVinculo || v.vinculo === filtroVinculo) &&
      (!filtroGrupo   || v.fonte_grupo === filtroGrupo) &&
      (!filtroStatus  || (v.status||"ativo") === filtroStatus) &&
      (!filtroLotacao || (v.lotacao||v.setor||"") === filtroLotacao ||
                         (v.ubs_nome||"") === filtroLotacao) &&
      (!filtroNome    || v.nome.toLowerCase().includes(filtroNome.toLowerCase()) || v.matricula.includes(filtroNome))
    );
  }, [folha, filtroFonte, filtroVinculo, filtroGrupo, filtroStatus, filtroLotacao, filtroNome]);

  const statusCount = useMemo(() => {
    if (!folha?.verbas) return {};
    return folha.verbas.reduce((acc: any, v: any) => {
      const s = v.status || "ativo"; acc[s] = (acc[s]||0)+1; return acc;
    }, {});
  }, [folha]);

  const refetch = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["folha", competencia] });
    qc.invalidateQueries({ queryKey: ["presenca", competencia] });
  }, [qc, competencia]);

  async function excluirServidor(matricula: string, nome: string) {
    if (!confirm(`Remover ${nome} da folha ativa?\n\nO servidor ficará inativo (reversível pelo administrador).`)) return;
    setExcluindo(matricula);
    try {
      await api.delete(`/api/folha/funcionario/${matricula}`);
      refetch();
    } finally { setExcluindo(null); }
  }

  const ABAS: {id:Aba; label:string; icon:React.ReactNode}[] = [
    { id:"resumo",    label:"Resumo Geral",      icon:<FileText size={13}/> },
    { id:"por_fonte", label:"Por Fonte",          icon:<Building2 size={13}/> },
    { id:"detalhada", label:"Folha Detalhada",   icon:<Users size={13}/> },
    { id:"lotacao",   label:"Lotação / Setores", icon:<MapPin size={13}/> },
    { id:"presenca",  label:"Folha de Presença", icon:<Calendar size={13}/> },
    { id:"gestao",    label:"Gestão de Pessoal", icon:<Settings size={13}/> },
    { id:"encargos",  label:"Encargos",          icon:<Home size={13}/> },
  ];

  const tabStyle = (a: boolean): React.CSSProperties => ({
    padding:"9px 14px", border:"none", cursor:"pointer", fontSize:12,
    fontWeight: a ? 700 : 400,
    background: a ? "#0d2137" : "transparent",
    color: a ? "#fff" : "#6b7280",
    borderRadius:"6px 6px 0 0",
    display:"flex", alignItems:"center", gap:5,
  });

  if (!isLoading && (!data || (data as any).situacao_dado === "nao_disponivel")) return (
    <div style={{ padding:32, maxWidth:680, margin:"0 auto" }}>
      <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12,
        padding:"36px 32px", textAlign:"center" }}>
        <FileText size={48} color="#1a6baa" style={{ marginBottom:16, opacity:.7 }}/>
        <div style={{ fontSize:20, fontWeight:800, color:"#0d2137", marginBottom:8 }}>
          Folha de Pagamento — SMS Apuí/AM
        </div>
        <div style={{ fontSize:13, color:"#475569", lineHeight:1.7, marginBottom:24 }}>
          Integrado com o <strong>Sistema Fiorele</strong>. Exporte o CSV/TXT e faça upload para visualizar os dados.
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", minHeight:"100vh", background:"#f0f5fb" }}>

      {/* Modais */}
      {modalNovo && <ModalNovoFuncionario onClose={() => setModalNovo(false)} onSalvo={refetch}/>}
      {modalStatus && <ModalStatus servidor={modalStatus} onClose={() => setModalStatus(null)} onSalvo={refetch}/>}

      {/* Header */}
      <div style={{ background:"#0d2137", color:"#fff", padding:"14px 24px",
        display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <FileText size={22} color="#1565c0"/>
          <div>
            <div style={{ fontSize:16, fontWeight:700 }}>Folha de Pagamento — SMS Apuí/AM</div>
            <div style={{ fontSize:11, color:"#9ab8d8", marginTop:2 }}>
              Processamento por Fonte · Contabilidade Pública · {COMP_LABEL[competencia]||competencia}
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <select value={competencia} onChange={e => setCompetencia(e.target.value)}
            style={{ padding:"7px 12px", border:"1px solid #2d4a6e", background:"#1a3356",
              color:"#fff", borderRadius:6, fontSize:12 }}>
            {Object.entries(COMP_LABEL).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button onClick={() => setModalNovo(true)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px",
              background:"#14864e", border:"none", borderRadius:6, color:"#fff", fontSize:12,
              cursor:"pointer", fontWeight:700 }}>
            <Plus size={14}/> Novo Servidor
          </button>
          <button
            style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px",
              background:"#1a6baa", border:"none", borderRadius:6, color:"#fff", fontSize:12,
              cursor:"pointer", fontWeight:600 }}
            onClick={() => folha && imprimirFolha(folha, competencia, COMP_LABEL[competencia]||competencia)}>
            <Printer size={14}/> Imprimir
          </button>
          <button
            style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px",
              background:"#374151", border:"none", borderRadius:6, color:"#fff", fontSize:12,
              cursor:"pointer", fontWeight:600 }}>
            <Download size={14}/> Exportar
          </button>
        </div>
      </div>

      {isLoading && <div style={{ padding:48, textAlign:"center", color:"#6b7280" }}>Carregando folha...</div>}

      {folha && folha.situacao_dado !== "nao_disponivel" && (
        <div style={{ maxWidth:1400, margin:"0 auto", padding:"20px 20px 48px" }}>

          {/* KPIs */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))", gap:10, marginBottom:16 }}>
            <KPICard label="Total Servidores" value={`${folha.total_servidores}`} cor="#0d2137"/>
            <KPICard label="Ativos" value={`${statusCount.ativo||0}`} cor="#059669"
              sub={`${((statusCount.ativo||0)/folha.total_servidores*100).toFixed(0)}% do quadro`}/>
            <KPICard label="Afastados/Licença" value={`${(folha.total_servidores-(statusCount.ativo||0))}`} cor="#d97706"
              sub="licença, maternidade, cedido"/>
            <KPICard label="Total Bruto" value={BRL(folha.total_bruto)} cor="#1a6baa"
              sub={COMP_LABEL[competencia]||competencia}/>
            <KPICard label="Total Líquido" value={BRL(folha.total_liquido)} cor="#14864e"/>
            <KPICard label="INSS Descontado" value={BRL(folha.total_inss_descontado)} cor="#b07a00"/>
            <KPICard label="Custo Empregador" value={BRL(folha.total_custo_empregador)} cor="#b83232"
              sub="incl. encargos patronais"/>
          </div>

          {/* Badges de status */}
          <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
            {(Object.entries(statusCount) as [string,number][]).map(([s,n]) => (
              <span key={s} style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"4px 10px",
                borderRadius:20, fontSize:11, fontWeight:700,
                background:COR_STATUS[s]+"15", color:COR_STATUS[s],
                border:`1px solid ${COR_STATUS[s]}30`, cursor:"pointer" }}
                onClick={() => setFiltroStatus(filtroStatus===s?"":s)}>
                {ICON_STATUS[s]} {LABEL_STATUS[s]}: {n}
              </span>
            ))}
          </div>

          {/* Abas */}
          <div style={{ display:"flex", gap:2, borderBottom:"2px solid #dde4ee",
            marginBottom:0, background:"#f0f5fb", flexWrap:"wrap" }}>
            {ABAS.map(a => (
              <button key={a.id} onClick={() => setAba(a.id)} style={tabStyle(aba === a.id)}>
                {a.icon} {a.label}
              </button>
            ))}
          </div>

          {/* ── RESUMO GERAL ── */}
          {aba === "resumo" && (
            <div style={{ background:"#fff", border:"1px solid #dde4ee", borderRadius:"0 0 10px 10px", padding:20 }}>
              <div style={{ fontWeight:700, color:"#0d2137", fontSize:14, marginBottom:16,
                borderBottom:"1px solid #dde4ee", paddingBottom:10 }}>
                📊 Resumo Geral — {COMP_LABEL[competencia]||competencia}
              </div>

              <div style={{ background:"#fff8e1", border:"1px solid #fbbf24", borderRadius:8,
                padding:"10px 14px", marginBottom:16, display:"flex", gap:8, alignItems:"flex-start" }}>
                <AlertTriangle size={14} color="#d97706" style={{ flexShrink:0, marginTop:2 }}/>
                <div style={{ fontSize:11, color:"#78350f" }}>
                  <strong>Contabilidade:</strong> Empenhos separados por Fonte de Recurso (FR) conforme Art. 32 LRF.
                  Transferências fundo-a-fundo MS creditadas até dia 15/mês.
                </div>
              </div>

              {["MS","MUNICIPAL","ESTADUAL"].map(grupo => {
                const itens = folha.resumo_por_fonte.filter((r: any) => r.grupo === grupo);
                if (!itens.length) return null;
                const tot = { bruto:itens.reduce((a:number,r:any)=>a+r.bruto,0),
                  liquido:itens.reduce((a:number,r:any)=>a+r.liquido,0),
                  custo:itens.reduce((a:number,r:any)=>a+r.custo_total,0),
                  serv:itens.reduce((a:number,r:any)=>a+r.servidores,0) };
                const cor = COR_GRUPO[grupo]||"#555";
                return (
                  <div key={grupo} style={{ marginBottom:20 }}>
                    <div style={{ background:cor, color:"#fff", padding:"8px 14px",
                      borderRadius:"8px 8px 0 0", fontWeight:700, fontSize:12,
                      display:"flex", justifyContent:"space-between" }}>
                      <span>{grupo==="MS"?"🏛️ Recursos Federais — Ministério da Saúde"
                        :grupo==="MUNICIPAL"?"🏙️ Recurso Próprio Municipal":"🏛️ Tesouro Estadual"}</span>
                      <span>{tot.serv} serv · {BRL(tot.bruto)}</span>
                    </div>
                    <div style={{ overflowX:"auto" }}>
                      <table style={{ width:"100%", borderCollapse:"collapse" }}>
                        <thead><tr>{["Fonte","Contábil (FR)","Servidores","Bruto","Líquido","Custo Total"].map(h=>(
                          <th key={h} style={{ ...thSt, background:cor+"18", color:cor }}>{h}</th>))}
                        </tr></thead>
                        <tbody>
                          {itens.map((r:any) => (
                            <tr key={r.label}>
                              <td style={tdSt}><strong>{r.label}</strong></td>
                              <td style={{ ...tdSt, fontFamily:"monospace", color:"#1a6baa" }}>{r.contabil}</td>
                              <td style={{ ...tdSt, textAlign:"center", fontWeight:700 }}>{r.servidores}</td>
                              <td style={{ ...tdSt, fontWeight:700 }}>{BRL(r.bruto)}</td>
                              <td style={{ ...tdSt, color:"#14864e", fontWeight:600 }}>{BRL(r.liquido)}</td>
                              <td style={{ ...tdSt, color:"#b83232", fontWeight:600 }}>{BRL(r.custo_total)}</td>
                            </tr>
                          ))}
                          <tr style={{ background:cor+"0d", fontWeight:700 }}>
                            <td style={tdSt} colSpan={2}><strong>SUBTOTAL {grupo}</strong></td>
                            <td style={{ ...tdSt, textAlign:"center" }}><strong>{tot.serv}</strong></td>
                            <td style={tdSt}><strong>{BRL(tot.bruto)}</strong></td>
                            <td style={{ ...tdSt, color:"#14864e" }}><strong>{BRL(tot.liquido)}</strong></td>
                            <td style={{ ...tdSt, color:"#b83232" }}><strong>{BRL(tot.custo)}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

              <div style={{ background:"#0d2137", color:"#fff", borderRadius:8, padding:"14px 20px",
                display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
                {[["TOTAL SERVIDORES",`${folha.total_servidores}`],["TOTAL BRUTO",BRL(folha.total_bruto)],
                  ["TOTAL LÍQUIDO",BRL(folha.total_liquido)],["CUSTO EMPREGADOR",BRL(folha.total_custo_empregador)]
                ].map(([l,v])=>(
                  <div key={l}>
                    <div style={{ fontSize:10, color:"#9ab8d8", fontWeight:600, letterSpacing:".04em" }}>{l}</div>
                    <div style={{ fontSize:17, fontWeight:800, marginTop:4 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── POR FONTE ── */}
          {aba === "por_fonte" && (
            <div style={{ background:"#fff", border:"1px solid #dde4ee", borderRadius:"0 0 10px 10px", padding:20 }}>
              <div style={{ fontWeight:700, fontSize:14, color:"#0d2137", marginBottom:16,
                borderBottom:"1px solid #dde4ee", paddingBottom:10 }}>
                🗂️ Detalhamento por Fonte de Pagamento
              </div>
              {folha.resumo_por_fonte.map((r: any) => {
                const cor = COR_GRUPO[r.grupo]||"#555";
                const servs = folha.verbas.filter((v: any) => v.fonte_pagamento === r.label);
                return (
                  <div key={r.label} style={{ marginBottom:24, border:`1px solid ${cor}30`, borderRadius:10, overflow:"hidden" }}>
                    <div style={{ background:cor+"12", borderBottom:`2px solid ${cor}`,
                      padding:"10px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontWeight:700, color:cor, fontSize:13 }}>{r.label}</div>
                        <div style={{ fontSize:11, color:"#6b7280" }}>FR: <strong>{r.contabil}</strong> · {r.servidores} servidores</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontWeight:800, fontSize:15 }}>{BRL(r.bruto)}</div>
                        <div style={{ fontSize:11, color:"#14864e" }}>Líquido: {BRL(r.liquido)}</div>
                      </div>
                    </div>
                    <div style={{ overflowX:"auto" }}>
                      <table style={{ width:"100%", borderCollapse:"collapse" }}>
                        <thead><tr>
                          {["Mat.","Nome","Cargo","Lotação","Vínculo","Status","Bruto","INSS","IRRF","Líquido"].map(h=>(
                            <th key={h} style={thSt}>{h}</th>))}
                        </tr></thead>
                        <tbody>
                          {servs.map((v:any) => (
                            <tr key={v.matricula} style={{ background: (v.status&&v.status!=="ativo") ? "#fffbeb":"" }}>
                              <td style={{ ...tdSt, fontFamily:"monospace", color:"#1a6baa", fontSize:10 }}>{v.matricula}</td>
                              <td style={{ ...tdSt, fontWeight:600 }}>{v.nome}</td>
                              <td style={{ ...tdSt, color:"#6b7280", fontSize:11 }}>{v.cargo}</td>
                              <td style={{ ...tdSt, fontSize:11 }}>{v.lotacao||v.setor||"—"}</td>
                              <td style={tdSt}><Badge label={LABEL_VINCULO[v.vinculo]||v.vinculo} cor={COR_VINCULO[v.vinculo]||"#555"}/></td>
                              <td style={tdSt}><StatusBadge status={v.status||"ativo"}/></td>
                              <td style={{ ...tdSt, fontWeight:700 }}>{BRL(v.bruto)}</td>
                              <td style={{ ...tdSt, color:"#b07a00" }}>({BRL(v.desc_inss)})</td>
                              <td style={{ ...tdSt, color:"#b83232" }}>({BRL(v.desc_irrf)})</td>
                              <td style={{ ...tdSt, fontWeight:700, color:"#14864e" }}>{BRL(v.liquido)}</td>
                            </tr>
                          ))}
                          <tr style={{ background:"#f8fafc", fontWeight:700 }}>
                            <td colSpan={6} style={tdSt}><strong>Subtotal</strong></td>
                            <td style={tdSt}><strong>{BRL(servs.reduce((a:number,v:any)=>a+v.bruto,0))}</strong></td>
                            <td style={{ ...tdSt, color:"#b07a00" }}>({BRL(servs.reduce((a:number,v:any)=>a+v.desc_inss,0))})</td>
                            <td style={{ ...tdSt, color:"#b83232" }}>({BRL(servs.reduce((a:number,v:any)=>a+v.desc_irrf,0))})</td>
                            <td style={{ ...tdSt, color:"#14864e" }}><strong>{BRL(servs.reduce((a:number,v:any)=>a+v.liquido,0))}</strong></td>
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
              <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
                <Filter size={14} color="#6b7280"/>
                <input placeholder="Buscar nome / matrícula..." value={filtroNome}
                  onChange={e => setFiltroNome(e.target.value)}
                  style={{ padding:"6px 10px", border:"1px solid #dde4ee", borderRadius:6, fontSize:12, width:200 }}/>
                <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
                  style={{ padding:"6px 10px", border:"1px solid #dde4ee", borderRadius:6, fontSize:12 }}>
                  <option value="">Todos os status</option>
                  {Object.entries(LABEL_STATUS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <select value={filtroLotacao} onChange={e => setFiltroLotacao(e.target.value)}
                  style={{ padding:"6px 10px", border:"1px solid #dde4ee", borderRadius:6, fontSize:12 }}>
                  <option value="">Todas as UBS / Setores</option>
                  <optgroup label="── UBS ──">
                    {ubsNomes.filter(u => u.startsWith("UBS") || u.startsWith("Centro")).map(u => <option key={u} value={u}>{u}</option>)}
                  </optgroup>
                  <optgroup label="── Unidades especializadas ──">
                    {ubsNomes.filter(u => !u.startsWith("UBS") && !u.startsWith("Centro")).map(u => <option key={u} value={u}>{u}</option>)}
                  </optgroup>
                  <optgroup label="── Setor ──">
                    {lotacoes.map(l => <option key={`lot-${l}`} value={l}>{l}</option>)}
                  </optgroup>
                </select>
                <select value={filtroFonte} onChange={e => setFiltroFonte(e.target.value)}
                  style={{ padding:"6px 10px", border:"1px solid #dde4ee", borderRadius:6, fontSize:12 }}>
                  <option value="">Todas as fontes</option>
                  {Array.from(new Set((folha.verbas||[]).map((v:any)=>v.fonte_pagamento))).map((f:any) => (
                    <option key={f} value={f}>{f}</option>))}
                </select>
                <select value={filtroVinculo} onChange={e => setFiltroVinculo(e.target.value)}
                  style={{ padding:"6px 10px", border:"1px solid #dde4ee", borderRadius:6, fontSize:12 }}>
                  <option value="">Todos os vínculos</option>
                  {Object.entries(LABEL_VINCULO).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                {(filtroNome||filtroStatus||filtroLotacao||filtroFonte||filtroVinculo) && (
                  <button onClick={() => { setFiltroNome(""); setFiltroStatus(""); setFiltroLotacao(""); setFiltroFonte(""); setFiltroVinculo(""); }}
                    style={{ padding:"6px 10px", border:"1px solid #fca5a5", background:"#fff7f7",
                      borderRadius:6, fontSize:12, cursor:"pointer", color:"#dc2626" }}>
                    <X size={12}/> Limpar
                  </button>
                )}
                <span style={{ fontSize:11, color:"#6b7280", marginLeft:"auto" }}>
                  {verbasFiltradas.length} de {folha.total_servidores} servidores
                </span>
              </div>

              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>
                      {["#","Mat.","Nome","Cargo","UBS / Unidade","Setor","Vínculo","Status","Bruto","INSS","IRRF","Líquido","Custo Total","Ações"].map(h=>(
                        <th key={h} style={thSt}>{h}</th>))}
                    </tr>
                  </thead>
                  <tbody>
                    {verbasFiltradas.map((v: any, i: number) => (
                      <tr key={v.matricula}
                        style={{ background: i%2===0?"#fff":"#f9fafb",
                          opacity: excluindo===v.matricula ? 0.4 : 1,
                          borderLeft: (v.status&&v.status!=="ativo") ? `3px solid ${COR_STATUS[v.status]}` : undefined }}>
                        <td style={{ ...tdSt, color:"#9ca3af", fontSize:10 }}>{i+1}</td>
                        <td style={{ ...tdSt, fontFamily:"monospace", color:"#1a6baa", fontSize:10 }}>{v.matricula}</td>
                        <td style={{ ...tdSt, fontWeight:600, maxWidth:200 }}>{v.nome}</td>
                        <td style={{ ...tdSt, color:"#6b7280", fontSize:11, maxWidth:160 }}>{v.cargo}</td>
                        <td style={{ ...tdSt, fontSize:10, maxWidth:180 }}>
                          <span style={{ display:"inline-flex", alignItems:"center", gap:3, color:"#1a3356", fontWeight:600 }}>
                            🏥 {v.ubs_nome || v.lotacao || "—"}
                          </span>
                          {v.equipe && <div style={{ fontSize:9, color:"#6b7280" }}>Equipe: {v.equipe}</div>}
                        </td>
                        <td style={{ ...tdSt, fontSize:10, color:"#475569" }}>{v.lotacao||v.setor||"—"}</td>
                        <td style={tdSt}><Badge label={LABEL_VINCULO[v.vinculo]||v.vinculo} cor={COR_VINCULO[v.vinculo]||"#555"}/></td>
                        <td style={tdSt}><StatusBadge status={v.status||"ativo"}/></td>
                        <td style={{ ...tdSt, fontWeight:700 }}>{BRL(v.bruto)}</td>
                        <td style={{ ...tdSt, color:"#b07a00", fontSize:11 }}>({BRL(v.desc_inss)})</td>
                        <td style={{ ...tdSt, color:"#b83232", fontSize:11 }}>({BRL(v.desc_irrf)})</td>
                        <td style={{ ...tdSt, fontWeight:800, color:"#14864e" }}>{BRL(v.liquido)}</td>
                        <td style={{ ...tdSt, color:"#b83232", fontSize:11 }}>{BRL(v.custo_total_empregador)}</td>
                        <td style={tdSt}>
                          <div style={{ display:"flex", gap:4 }}>
                            <button title="Alterar status"
                              onClick={() => setModalStatus(v as Servidor)}
                              style={{ padding:"3px 7px", background:"#e0f2fe", border:"1px solid #bae6fd",
                                borderRadius:4, cursor:"pointer", fontSize:10, color:"#0369a1" }}>
                              <RefreshCw size={10}/>
                            </button>
                            <button title="Excluir da folha" disabled={excluindo===v.matricula}
                              onClick={() => excluirServidor(v.matricula, v.nome)}
                              style={{ padding:"3px 7px", background:"#fef2f2", border:"1px solid #fca5a5",
                                borderRadius:4, cursor:"pointer", fontSize:10, color:"#dc2626" }}>
                              <Trash2 size={10}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background:"#0d2137", color:"#fff" }}>
                      <td style={{ ...tdSt, color:"#fff" }} colSpan={9}><strong>TOTAL ({verbasFiltradas.length} serv.)</strong></td>
                      <td style={{ ...tdSt, fontWeight:800, color:"#fff" }}>{BRL(verbasFiltradas.reduce((a:number,v:any)=>a+v.bruto,0))}</td>
                      <td style={{ ...tdSt, color:"#fbbf24" }}>({BRL(verbasFiltradas.reduce((a:number,v:any)=>a+v.desc_inss,0))})</td>
                      <td style={{ ...tdSt, color:"#fca5a5" }}>({BRL(verbasFiltradas.reduce((a:number,v:any)=>a+v.desc_irrf,0))})</td>
                      <td style={{ ...tdSt, fontWeight:800, color:"#6ee7b7" }}>{BRL(verbasFiltradas.reduce((a:number,v:any)=>a+v.liquido,0))}</td>
                      <td style={{ ...tdSt, color:"#fca5a5" }}>{BRL(verbasFiltradas.reduce((a:number,v:any)=>a+v.custo_total_empregador,0))}</td>
                      <td style={tdSt}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ── LOTAÇÃO / SETORES ── */}
          {aba === "lotacao" && (() => {
            // Agrupa por ubs_nome (UBS real)
            const ubsMap = new Map<string, any[]>();
            for (const v of folha.verbas) {
              const key = v.ubs_nome || v.lotacao || "Sem UBS";
              if (!ubsMap.has(key)) ubsMap.set(key, []);
              ubsMap.get(key)!.push(v);
            }
            // Ordena: UBS primeiro, depois Sede/Hospital/Vig
            const ubsOrdem = [
              "UBS Irmã Elizabete",
              "UBS Anizio Ferreira da Silva",
              "UBS Osvaldo Lemes Cabral",
              "Centro de Saúde Curumim",
              "UBS Padre Faliero Bonci",
              "UBS JK",
              "UBS Cláudia Pereira dos Santos Damacena",
              "CAPS AD — Centro de Atenção Psicossocial",
              "Hospital Municipal de Apuí",
              "Vigilância em Saúde — SEMSA",
              "Vigilância Sanitária — SEMSA",
              "Sede SEMSA — Secretaria Municipal de Saúde",
            ];
            const ubsKeys = [
              ...ubsOrdem.filter(k => ubsMap.has(k)),
              ...[...ubsMap.keys()].filter(k => !ubsOrdem.includes(k)).sort(),
            ];
            const COR_UBS: Record<string,string> = {
              "UBS Irmã Elizabete":"#1a6baa",
              "UBS Anizio Ferreira da Silva":"#0e7a5a",
              "UBS Osvaldo Lemes Cabral":"#7c3aed",
              "Centro de Saúde Curumim":"#d97706",
              "UBS Padre Faliero Bonci":"#0284c7",
              "UBS JK":"#059669",
              "UBS Cláudia Pereira dos Santos Damacena":"#db2777",
              "CAPS AD — Centro de Atenção Psicossocial":"#6366f1",
              "Hospital Municipal de Apuí":"#b83232",
              "Vigilância em Saúde — SEMSA":"#92400e",
              "Vigilância Sanitária — SEMSA":"#854d0e",
              "Sede SEMSA — Secretaria Municipal de Saúde":"#374151",
            };
            const ICONE_UBS: Record<string,string> = {
              "UBS Irmã Elizabete":"🏥",
              "UBS Anizio Ferreira da Silva":"🏥",
              "UBS Osvaldo Lemes Cabral":"🏥",
              "Centro de Saúde Curumim":"🏥",
              "UBS Padre Faliero Bonci":"🏥",
              "UBS JK":"🏥",
              "UBS Cláudia Pereira dos Santos Damacena":"🏥",
              "CAPS AD — Centro de Atenção Psicossocial":"🧠",
              "Hospital Municipal de Apuí":"🏨",
              "Vigilância em Saúde — SEMSA":"🔬",
              "Vigilância Sanitária — SEMSA":"🛡️",
              "Sede SEMSA — Secretaria Municipal de Saúde":"🏛️",
            };
            return (
              <div style={{ background:"#fff", border:"1px solid #dde4ee", borderRadius:"0 0 10px 10px", padding:20 }}>
                <div style={{ fontWeight:700, fontSize:14, color:"#0d2137", marginBottom:16,
                  borderBottom:"1px solid #dde4ee", paddingBottom:10 }}>
                  📍 Lotação por UBS / Unidade de Saúde — Apuí/AM
                </div>

                {/* Cards por UBS */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:12, marginBottom:28 }}>
                  {ubsKeys.map(ubs => {
                    const servs = ubsMap.get(ubs)!;
                    const ativos = servs.filter((v:any) => (v.status||"ativo")==="ativo").length;
                    const afastados = servs.length - ativos;
                    const cor = COR_UBS[ubs] || "#374151";
                    const icon = ICONE_UBS[ubs] || "📍";
                    const equipes = Array.from(new Set(servs.map((v:any)=>v.equipe).filter(Boolean)));
                    const cargos = Array.from(new Set(servs.map((v:any)=>v.cargo))).slice(0,4);
                    const setores = Array.from(new Set(servs.map((v:any)=>v.lotacao)));
                    return (
                      <div key={ubs} onClick={() => { setFiltroLotacao(setores[0]||""); setAba("detalhada"); }}
                        style={{ border:`1px solid ${cor}30`, borderRadius:10, overflow:"hidden",
                          cursor:"pointer", transition:"box-shadow .15s" }}
                        onMouseEnter={e=>(e.currentTarget.style.boxShadow=`0 4px 16px ${cor}25`)}
                        onMouseLeave={e=>(e.currentTarget.style.boxShadow="")}>
                        <div style={{ background:cor, color:"#fff", padding:"11px 14px" }}>
                          <div style={{ fontWeight:800, fontSize:13 }}>{icon} {ubs}</div>
                          {equipes.length > 0 && (
                            <div style={{ fontSize:10, color:"#ffffff99", marginTop:3 }}>
                              Equipes: {equipes.join(" · ")}
                            </div>
                          )}
                        </div>
                        <div style={{ padding:"12px 14px" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                              <span style={{ fontSize:20, fontWeight:800, color:cor }}>{servs.length}</span>
                              <span style={{ fontSize:11, color:"#6b7280" }}>servidores</span>
                            </div>
                            <div style={{ textAlign:"right", fontSize:11 }}>
                              <div style={{ color:"#059669", fontWeight:700 }}>{ativos} ativos</div>
                              {afastados>0 && <div style={{ color:"#d97706" }}>{afastados} afastado(s)</div>}
                            </div>
                          </div>
                          <div style={{ fontSize:11, color:"#6b7280", marginBottom:8 }}>
                            💰 {BRL(servs.reduce((a:number,v:any)=>a+v.liquido,0))} líquido/mês
                          </div>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
                            {cargos.map((c:any) => <Badge key={c} label={c} cor={cor}/>)}
                            {Array.from(new Set(servs.map((v:any)=>v.cargo))).length > 4 &&
                              <Badge label={`+${Array.from(new Set(servs.map((v:any)=>v.cargo))).length-4}`} cor="#9ca3af"/>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tabela resumo */}
                <div style={{ fontWeight:700, fontSize:13, marginBottom:10, color:"#0d2137" }}>
                  Resumo por UBS / Unidade
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr>
                      {["UBS / Unidade","Equipes","Setor(es)","Total","Ativos","Afastados","Bruto","Líquido"].map(h=>(
                        <th key={h} style={thSt}>{h}</th>))}
                    </tr></thead>
                    <tbody>
                      {ubsKeys.map(ubs => {
                        const servs = ubsMap.get(ubs)!;
                        const ativos = servs.filter((v:any)=>(v.status||"ativo")==="ativo").length;
                        const equipes = Array.from(new Set(servs.map((v:any)=>v.equipe).filter(Boolean))).join(", ");
                        const setores = Array.from(new Set(servs.map((v:any)=>v.lotacao))).join(", ");
                        const cor = COR_UBS[ubs] || "#374151";
                        return (
                          <tr key={ubs} style={{ borderLeft:`3px solid ${cor}` }}>
                            <td style={{ ...tdSt, fontWeight:700, color:cor }}>
                              {ICONE_UBS[ubs]||"📍"} {ubs}
                            </td>
                            <td style={{ ...tdSt, fontSize:10, color:"#6b7280" }}>{equipes||"—"}</td>
                            <td style={{ ...tdSt, fontSize:10, color:"#374151" }}>{setores}</td>
                            <td style={{ ...tdSt, textAlign:"center", fontWeight:800, color:cor }}>{servs.length}</td>
                            <td style={{ ...tdSt, textAlign:"center", color:"#059669", fontWeight:600 }}>{ativos}</td>
                            <td style={{ ...tdSt, textAlign:"center", color:servs.length-ativos>0?"#d97706":"#9ca3af" }}>
                              {servs.length-ativos||"—"}
                            </td>
                            <td style={tdSt}>{BRL(servs.reduce((a:number,v:any)=>a+v.bruto,0))}</td>
                            <td style={{ ...tdSt, color:"#14864e", fontWeight:600 }}>{BRL(servs.reduce((a:number,v:any)=>a+v.liquido,0))}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* ── FOLHA DE PRESENÇA ── */}
          {aba === "presenca" && (
            <div style={{ background:"#fff", border:"1px solid #dde4ee", borderRadius:"0 0 10px 10px", padding:20 }}>
              <div style={{ fontWeight:700, fontSize:14, color:"#0d2137", marginBottom:6,
                borderBottom:"1px solid #dde4ee", paddingBottom:10 }}>
                📋 Folha de Presença — {COMP_LABEL[competencia]||competencia}
              </div>
              <div style={{ fontSize:12, color:"#6b7280", marginBottom:16 }}>
                P = Presente · F = Falta · FJ = Falta Justificada · FS = Folga/Escala · L = Licença
              </div>

              {!presencaData ? (
                <div style={{ padding:24, textAlign:"center", color:"#9ca3af" }}>Carregando...</div>
              ) : (presencaData as any)?.setores?.map((setor: any) => {
                const dias = Array.from({length:(presencaData as any).dias_mes},(_,i)=>i+1);
                const diasUteis = dias.filter(d => {
                  const dt = new Date((presencaData as any).ano, (presencaData as any).mes-1, d);
                  return dt.getDay() !== 0 && dt.getDay() !== 6;
                });
                return (
                  <div key={setor.nome} style={{ marginBottom:28 }}>
                    <div style={{ background:"#1a3356", color:"#fff", padding:"8px 14px",
                      borderRadius:"8px 8px 0 0", fontWeight:700, fontSize:12,
                      display:"flex", justifyContent:"space-between" }}>
                      <span><MapPin size={12} style={{ marginRight:5, verticalAlign:"middle" }}/>{setor.nome}</span>
                      <span>{setor.servidores.length} servidores · {diasUteis.length} dias úteis</span>
                    </div>
                    <div style={{ overflowX:"auto", border:"1px solid #dde4ee", borderTop:"none" }}>
                      <table style={{ width:"100%", borderCollapse:"collapse", minWidth:900 }}>
                        <thead>
                          <tr>
                            <th style={{ ...thSt, position:"sticky", left:0, zIndex:1, minWidth:200, background:"#e8f1fa" }}>Servidor</th>
                            <th style={{ ...thSt, minWidth:120 }}>Cargo</th>
                            <th style={{ ...thSt, minWidth:80 }}>Situação</th>
                            {diasUteis.map(d => {
                              const dt = new Date((presencaData as any).ano, (presencaData as any).mes-1, d);
                              return (
                                <th key={d} style={{ ...thSt, textAlign:"center", minWidth:34, padding:"6px 4px" }}>
                                  <div>{d}</div>
                                  <div style={{ fontWeight:400, fontSize:8, color:"#6b7280" }}>
                                    {["D","S","T","Q","Q","S","S"][dt.getDay()]}
                                  </div>
                                </th>
                              );
                            })}
                            <th style={thSt}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {setor.servidores.map((s: any, i: number) => {
                            const licenca = s.status !== "ativo";
                            return (
                              <tr key={s.matricula} style={{ background: licenca?"#fffbeb":(i%2===0?"#fff":"#f9fafb") }}>
                                <td style={{ ...tdSt, fontWeight:600, position:"sticky", left:0,
                                  background: licenca?"#fffbeb":(i%2===0?"#fff":"#f9fafb"), zIndex:0 }}>
                                  {s.nome}
                                </td>
                                <td style={{ ...tdSt, fontSize:10, color:"#6b7280" }}>{s.cargo}</td>
                                <td style={tdSt}><StatusBadge status={s.status||"ativo"}/></td>
                                {diasUteis.map(d => (
                                  <td key={d} style={{ ...tdSt, textAlign:"center", padding:"4px 2px" }}>
                                    {licenca ? (
                                      <span style={{ fontSize:9, color:"#d97706", fontWeight:700 }}>L</span>
                                    ) : (
                                      <span style={{ fontSize:9, color:"#059669", fontWeight:700 }}>P</span>
                                    )}
                                  </td>
                                ))}
                                <td style={{ ...tdSt, textAlign:"center", fontWeight:700 }}>
                                  {licenca ? <span style={{ color:"#d97706" }}>—</span>
                                    : <span style={{ color:"#059669" }}>{diasUteis.length}</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── GESTÃO DE PESSOAL ── */}
          {aba === "gestao" && (
            <div style={{ background:"#fff", border:"1px solid #dde4ee", borderRadius:"0 0 10px 10px", padding:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                marginBottom:16, borderBottom:"1px solid #dde4ee", paddingBottom:10 }}>
                <div style={{ fontWeight:700, fontSize:14, color:"#0d2137" }}>
                  ⚙️ Gestão de Pessoal — Quadro Funcional
                </div>
                <button onClick={() => setModalNovo(true)}
                  style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px",
                    background:"#1a6baa", border:"none", borderRadius:8, color:"#fff",
                    fontSize:13, fontWeight:700, cursor:"pointer" }}>
                  <Plus size={14}/> Adicionar Servidor
                </button>
              </div>

              {/* Resumo por status */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:10, marginBottom:20 }}>
                {(Object.entries(statusCount) as [string,number][]).map(([s,n]) => (
                  <div key={s} style={{ background:COR_STATUS[s]+"10", border:`1px solid ${COR_STATUS[s]}30`,
                    borderRadius:10, padding:"12px 16px", borderTop:`3px solid ${COR_STATUS[s]}` }}>
                    <div style={{ fontSize:10, color:COR_STATUS[s], fontWeight:700, textTransform:"uppercase", letterSpacing:".04em" }}>
                      {LABEL_STATUS[s]}
                    </div>
                    <div style={{ fontSize:24, fontWeight:800, color:COR_STATUS[s], marginTop:4 }}>{n}</div>
                    <div style={{ fontSize:10, color:"#9ca3af", marginTop:2 }}>
                      {((n/folha.total_servidores)*100).toFixed(1)}% do quadro
                    </div>
                  </div>
                ))}
              </div>

              {/* Servidores afastados */}
              {folha.verbas.filter((v:any) => v.status && v.status !== "ativo").length > 0 && (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:"#d97706", marginBottom:8,
                    display:"flex", alignItems:"center", gap:6 }}>
                    <AlertTriangle size={14}/> Servidores Afastados / Licença
                  </div>
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <thead><tr>
                        {["Matrícula","Nome","Cargo","Lotação","Status","Fonte","Observação","Ações"].map(h=>(
                          <th key={h} style={thSt}>{h}</th>))}
                      </tr></thead>
                      <tbody>
                        {folha.verbas.filter((v:any) => v.status && v.status !== "ativo").map((v:any) => (
                          <tr key={v.matricula} style={{ background:"#fffbeb" }}>
                            <td style={{ ...tdSt, fontFamily:"monospace", color:"#1a6baa", fontSize:10 }}>{v.matricula}</td>
                            <td style={{ ...tdSt, fontWeight:600 }}>{v.nome}</td>
                            <td style={{ ...tdSt, fontSize:11, color:"#6b7280" }}>{v.cargo}</td>
                            <td style={{ ...tdSt, fontSize:11 }}>{v.lotacao||v.setor||"—"}</td>
                            <td style={tdSt}><StatusBadge status={v.status}/></td>
                            <td style={{ ...tdSt, fontSize:11 }}>{v.fonte_pagamento}</td>
                            <td style={{ ...tdSt, fontSize:10, color:"#9ca3af" }}>{v.observacao||"—"}</td>
                            <td style={tdSt}>
                              <button onClick={() => setModalStatus(v as Servidor)}
                                style={{ padding:"3px 8px", background:"#e0f2fe", border:"1px solid #bae6fd",
                                  borderRadius:4, cursor:"pointer", fontSize:11, color:"#0369a1",
                                  display:"flex", alignItems:"center", gap:3 }}>
                                <RefreshCw size={10}/> Alterar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Todos os servidores */}
              <div style={{ fontWeight:700, fontSize:13, marginBottom:8, color:"#0d2137" }}>
                Quadro Completo — {folha.total_servidores} servidores
              </div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead><tr>
                    {["Mat.","Nome","Cargo","Lotação","Vínculo","Status","Fonte","C.H.","Ações"].map(h=>(
                      <th key={h} style={thSt}>{h}</th>))}
                  </tr></thead>
                  <tbody>
                    {folha.verbas.map((v:any, i:number) => (
                      <tr key={v.matricula} style={{ background: i%2===0?"#fff":"#f9fafb" }}>
                        <td style={{ ...tdSt, fontFamily:"monospace", color:"#1a6baa", fontSize:10 }}>{v.matricula}</td>
                        <td style={{ ...tdSt, fontWeight:600, fontSize:12 }}>{v.nome}</td>
                        <td style={{ ...tdSt, fontSize:11, color:"#6b7280" }}>{v.cargo}</td>
                        <td style={{ ...tdSt, fontSize:11 }}>{v.lotacao||v.setor||"—"}</td>
                        <td style={tdSt}><Badge label={LABEL_VINCULO[v.vinculo]||v.vinculo} cor={COR_VINCULO[v.vinculo]||"#555"}/></td>
                        <td style={tdSt}><StatusBadge status={v.status||"ativo"}/></td>
                        <td style={{ ...tdSt, fontSize:10, color:"#6b7280" }}>{v.fonte_pagamento}</td>
                        <td style={{ ...tdSt, textAlign:"center", fontSize:11 }}>{v.carga_horaria}h</td>
                        <td style={tdSt}>
                          <div style={{ display:"flex", gap:4 }}>
                            <button title="Alterar status" onClick={() => setModalStatus(v as Servidor)}
                              style={{ padding:"3px 7px", background:"#e0f2fe", border:"1px solid #bae6fd",
                                borderRadius:4, cursor:"pointer", fontSize:10, color:"#0369a1" }}>
                              <RefreshCw size={10}/>
                            </button>
                            <button title="Excluir" disabled={excluindo===v.matricula}
                              onClick={() => excluirServidor(v.matricula, v.nome)}
                              style={{ padding:"3px 7px", background:"#fef2f2", border:"1px solid #fca5a5",
                                borderRadius:4, cursor:"pointer", fontSize:10, color:"#dc2626" }}>
                              <Trash2 size={10}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── ENCARGOS PATRONAIS ── */}
          {aba === "encargos" && (
            <div style={{ background:"#fff", border:"1px solid #dde4ee", borderRadius:"0 0 10px 10px", padding:20 }}>
              <div style={{ fontWeight:700, fontSize:14, color:"#0d2137", marginBottom:16,
                borderBottom:"1px solid #dde4ee", paddingBottom:10 }}>
                💼 Encargos Patronais — {COMP_LABEL[competencia]||competencia}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12, marginBottom:20 }}>
                {[
                  { l:"INSS Patronal (20%)", v:BRL(folha.verbas?.reduce((a:number,v:any)=>a+(v.enc_inss_patronal||0),0)), cor:"#d97706" },
                  { l:"FGTS (8% CLT)", v:BRL(folha.verbas?.reduce((a:number,v:any)=>a+(v.enc_fgts||0),0)), cor:"#0284c7" },
                  { l:"Férias Proporcionais", v:BRL(folha.verbas?.reduce((a:number,v:any)=>a+(v.enc_ferias_prop||0),0)), cor:"#14864e" },
                  { l:"13º Salário Proporcional", v:BRL(folha.verbas?.reduce((a:number,v:any)=>a+(v.enc_decimo_terceiro||0),0)), cor:"#7c3aed" },
                  { l:"Total Encargos", v:BRL(folha.total_custo_empregador - folha.total_bruto), cor:"#b83232" },
                  { l:"Custo Total Empregador", v:BRL(folha.total_custo_empregador), cor:"#0d2137" },
                ].map(k => <KPICard key={k.l} label={k.l} value={k.v} cor={k.cor}/>)}
              </div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead><tr>
                    {["Nome","Cargo","Vínculo","Bruto","INSS Patronal","FGTS","Férias Prop.","13º Prop.","Custo Total"].map(h=>(
                      <th key={h} style={thSt}>{h}</th>))}
                  </tr></thead>
                  <tbody>
                    {(folha.verbas||[]).map((v:any, i:number) => (
                      <tr key={v.matricula} style={{ background: i%2===0?"#fff":"#f9fafb" }}>
                        <td style={{ ...tdSt, fontWeight:600 }}>{v.nome}</td>
                        <td style={{ ...tdSt, fontSize:11, color:"#6b7280" }}>{v.cargo}</td>
                        <td style={tdSt}><Badge label={LABEL_VINCULO[v.vinculo]||v.vinculo} cor={COR_VINCULO[v.vinculo]||"#555"}/></td>
                        <td style={{ ...tdSt, fontWeight:700 }}>{BRL(v.bruto)}</td>
                        <td style={{ ...tdSt, color:"#d97706" }}>{BRL(v.enc_inss_patronal||0)}</td>
                        <td style={{ ...tdSt, color:"#0284c7" }}>{BRL(v.enc_fgts||0)}</td>
                        <td style={{ ...tdSt, color:"#14864e" }}>{BRL(v.enc_ferias_prop||0)}</td>
                        <td style={{ ...tdSt, color:"#7c3aed" }}>{BRL(v.enc_decimo_terceiro||0)}</td>
                        <td style={{ ...tdSt, fontWeight:800, color:"#b83232" }}>{BRL(v.custo_total_empregador)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background:"#0d2137", color:"#fff" }}>
                      <td style={{ ...tdSt, color:"#fff" }} colSpan={3}><strong>TOTAL</strong></td>
                      <td style={{ ...tdSt, color:"#fff", fontWeight:800 }}>{BRL(folha.total_bruto)}</td>
                      <td style={{ ...tdSt, color:"#fbbf24", fontWeight:700 }}>{BRL((folha.verbas||[]).reduce((a:number,v:any)=>a+(v.enc_inss_patronal||0),0))}</td>
                      <td style={{ ...tdSt, color:"#93c5fd", fontWeight:700 }}>{BRL((folha.verbas||[]).reduce((a:number,v:any)=>a+(v.enc_fgts||0),0))}</td>
                      <td style={{ ...tdSt, color:"#6ee7b7", fontWeight:700 }}>{BRL((folha.verbas||[]).reduce((a:number,v:any)=>a+(v.enc_ferias_prop||0),0))}</td>
                      <td style={{ ...tdSt, color:"#c4b5fd", fontWeight:700 }}>{BRL((folha.verbas||[]).reduce((a:number,v:any)=>a+(v.enc_decimo_terceiro||0),0))}</td>
                      <td style={{ ...tdSt, color:"#fca5a5", fontWeight:800 }}>{BRL(folha.total_custo_empregador)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
