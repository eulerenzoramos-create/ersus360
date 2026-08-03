// src/pages/GestaoContratos.tsx — Gestão de Contratos e Prestadores de Saúde
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText, CheckCircle, AlertTriangle, XCircle, Clock,
  ChevronDown, ChevronRight, Search, DollarSign,
} from "lucide-react";
import { apiGet } from "../lib/api";
import { BRL, BRL_AXIS, PCT } from "../lib/fmt";

interface Contrato {
  id: string; numero: string; objeto: string; contratado: string;
  cnpj: string; modalidade: string; tipo: string;
  valor_total: number; valor_executado: number;
  data_inicio: string; data_fim: string; dias_vencimento: number;
  status: "vigente" | "vencendo" | "vencido" | "suspenso" | "encerrado";
  fiscal: string; aditivos: number;
  descricao_servico: string; alertas: string[];
}

interface ResumoContratos {
  total: number; vigentes: number; vencendo_30d: number;
  vencidos: number; suspensos: number;
  valor_total_carteira: number; valor_executado_total: number;
}

const COR: Record<string, string> = {
  vigente: "#16a34a", vencendo: "#d97706", vencido: "#dc2626",
  suspenso: "#ea580c", encerrado: "#6b7280",
};
const LABEL: Record<string, string> = {
  vigente: "Vigente", vencendo: "Vencendo", vencido: "Vencido",
  suspenso: "Suspenso", encerrado: "Encerrado",
};

function BarExec({ total, exec }: { total: number; exec: number }) {
  const pct = Math.min(100, total > 0 ? (exec / total) * 100 : 0);
  const cor = pct >= 90 ? "#dc2626" : pct >= 70 ? "#d97706" : "#16a34a";
  return (
    <div style={{ height: 4, background: "#e5e7eb", borderRadius: 2 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: cor, borderRadius: 2 }}/>
    </div>
  );
}

function StatusIcon({ s }: { s: string }) {
  if (s === "vigente")   return <CheckCircle size={15} color="#16a34a"/>;
  if (s === "vencendo")  return <Clock size={15} color="#d97706"/>;
  if (s === "vencido")   return <XCircle size={15} color="#dc2626"/>;
  return <AlertTriangle size={15} color={COR[s] ?? "#6b7280"}/>;
}

function CardContrato({ c }: { c: Contrato }) {
  const [aberto, setAberto] = useState(false);
  const cor = COR[c.status];
  const execPct = c.valor_total > 0 ? Math.round((c.valor_executado / c.valor_total) * 100) : 0;

  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}25`, borderLeft: `4px solid ${cor}`, borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
      <div onClick={() => setAberto(o => !o)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", cursor: "pointer" }}>
        <StatusIcon s={c.status}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" as const }}>
            <span style={{ fontWeight: 800, fontSize: 13 }}>{c.numero}</span>
            <span style={{ fontSize: 9, fontWeight: 800, background: cor + "18", color: cor, padding: "2px 7px", borderRadius: 10 }}>{LABEL[c.status]}</span>
            <span style={{ fontSize: 9, color: "#9ca3af" }}>{c.modalidade} · {c.tipo}</span>
            {c.aditivos > 0 && <span style={{ fontSize: 9, background: "#e0f2fe", color: "#0369a1", padding: "1px 6px", borderRadius: 8, fontWeight: 600 }}>{c.aditivos} aditivo(s)</span>}
          </div>
          <div style={{ fontWeight: 600, fontSize: 12, color: "#374151", marginBottom: 2 }}>{c.contratado}</div>
          <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 5 }}>{c.objeto}</div>
          <BarExec total={c.valor_total} exec={c.valor_executado}/>
          <div style={{ display: "flex", gap: 14, fontSize: 9, color: "#9ca3af", marginTop: 3 }}>
            <span>Executado: <b style={{ color: "#374151" }}>{execPct}%</b></span>
            <span>Vigência: {c.data_inicio} → {c.data_fim}</span>
            {c.dias_vencimento <= 60 && c.dias_vencimento >= 0 && (
              <span style={{ color: "#d97706", fontWeight: 700 }}>Vence em {c.dias_vencimento}d</span>
            )}
            {c.dias_vencimento < 0 && <span style={{ color: "#dc2626", fontWeight: 700 }}>Vencido há {Math.abs(c.dias_vencimento)}d</span>}
          </div>
        </div>
        <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#374151" }}>{BRL(c.valor_total)}</div>
          <div style={{ fontSize: 9, color: "#9ca3af" }}>valor contratual</div>
        </div>
        {aberto ? <ChevronDown size={14} color="#9ca3af"/> : <ChevronRight size={14} color="#9ca3af"/>}
      </div>

      {aberto && (
        <div style={{ borderTop: `1px solid ${cor}15`, padding: "14px 16px", background: "#fafafa" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Dados do Contrato</div>
              {[
                ["Contratado",        c.contratado],
                ["CNPJ",              c.cnpj],
                ["Modalidade",        c.modalidade],
                ["Tipo de serviço",   c.tipo],
                ["Fiscal do contrato",c.fiscal],
                ["Início",            c.data_inicio],
                ["Término",           c.data_fim],
                ["Nº de Aditivos",    c.aditivos.toString()],
              ].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: 10, color: "#6b7280" }}>{l}</span>
                  <span style={{ fontSize: 10, fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Execução Financeira</div>
              {[
                ["Valor contratual",  BRL(c.valor_total)],
                ["Valor executado",   BRL(c.valor_executado)],
                ["Saldo disponível",  BRL(c.valor_total - c.valor_executado)],
                ["% executado",       `${execPct}%`],
              ].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: 10, color: "#6b7280" }}>{l}</span>
                  <span style={{ fontSize: 10, fontWeight: 700 }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>Objeto</div>
                <div style={{ fontSize: 10, color: "#6b7280", lineHeight: 1.5 }}>{c.descricao_servico}</div>
              </div>
              {c.alertas.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {c.alertas.map((a, i) => (
                    <div key={i} style={{ fontSize: 9, background: "#fef3c7", color: "#92400e", padding: "4px 8px", borderRadius: 6, marginBottom: 4, fontWeight: 600 }}>⚠ {a}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button style={{ padding: "6px 14px", fontSize: 11, fontWeight: 700, background: "#1351b4", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Ver Processo</button>
            <button style={{ padding: "6px 14px", fontSize: 11, fontWeight: 700, background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer" }}>Registrar Aditivo</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GestaoContratos() {
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [busca, setBusca] = useState("");

  const { data: resumo } = useQuery<ResumoContratos>({
    queryKey: ["contratos-resumo"],
    queryFn: () => apiGet("/api/contratos/resumo") as Promise<ResumoContratos>,
    staleTime: 300_000,
  });

  const { data: contratos = [], isLoading } = useQuery<Contrato[]>({
    queryKey: ["contratos-lista", filtroStatus],
    queryFn: () => apiGet("/api/contratos/lista", { status: filtroStatus !== "todos" ? filtroStatus : undefined }) as Promise<Contrato[]>,
    staleTime: 300_000,
  });

  const visiveis = contratos.filter(c =>
    !busca || c.contratado.toLowerCase().includes(busca.toLowerCase()) ||
    c.numero.includes(busca) || c.objeto.toLowerCase().includes(busca.toLowerCase())
  );
  const r = resumo;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}><FileText size={18} color="#fff"/></div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Gestão de Contratos</span>
              <span style={{ fontSize: 9, fontWeight: 800, background: "rgba(255,255,255,.2)", color: "#bfdbfe", padding: "2px 9px", borderRadius: 10 }}>LICITAÇÕES</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Contratos com prestadores · Fiscalização · Aditivos · FMS Apuí/AM
            </div>
          </div>
        </div>

        {r && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8, marginTop: 16 }}>
            {[
              { l: "Total",             v: r.total,                            cor: "#bfdbfe" },
              { l: "Vigentes",          v: r.vigentes,                         cor: "#86efac" },
              { l: "Vencendo <30d",     v: r.vencendo_30d,                     cor: "#fde68a" },
              { l: "Vencidos",          v: r.vencidos,                         cor: "#fca5a5" },
              { l: "Suspensos",         v: r.suspensos,                        cor: "#fed7aa" },
              { l: "Valor Carteira",    v: BRL(r.valor_total_carteira),        cor: "#bfdbfe" },
              { l: "Valor Executado",   v: BRL(r.valor_executado_total),       cor: "#86efac" },
            ].map(k => (
              <div key={k.l} style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "10px 8px", textAlign: "center" as const }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: k.cor }}>{k.v}</div>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,.5)" }}>{k.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "20px 28px 60px" }}>
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap" as const, alignItems: "center" }}>
          <div style={{ position: "relative" as const }}>
            <Search size={12} color="#9ca3af" style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)" }}/>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Nº, contratado ou objeto..."
              style={{ padding: "6px 10px 6px 28px", fontSize: 11, border: "1px solid #d1d5db", borderRadius: 8, outline: "none", width: 220 }}/>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Status:</span>
          {["todos","vigente","vencendo","vencido","suspenso","encerrado"].map(s => {
            const cor = s === "todos" ? "#1d4ed8" : COR[s];
            const ativo = filtroStatus === s;
            return (
              <button key={s} onClick={() => setFiltroStatus(s)}
                style={{ padding: "5px 10px", fontSize: 10, borderRadius: 20, border: `1px solid ${ativo ? cor : "#d1d5db"}`, background: ativo ? cor + "15" : "#fff", color: ativo ? cor : "#374151", cursor: "pointer", fontWeight: ativo ? 700 : 400 }}>
                {s === "todos" ? "Todos" : LABEL[s]}
              </button>
            );
          })}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#9ca3af" }}>{visiveis.length} contrato(s)</span>
        </div>

        {isLoading
          ? <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando contratos...</div>
          : visiveis.map(c => <CardContrato key={c.id} c={c}/>)
        }
      </div>
    </div>
  );
}
