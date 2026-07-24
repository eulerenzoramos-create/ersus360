// src/pages/Almoxarifado.tsx — Almoxarifado de Insumos e Medicamentos
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package, AlertTriangle, CheckCircle, XCircle, Search,
  ChevronDown, ChevronRight, RefreshCw, TrendingDown,
} from "lucide-react";
import { apiGet, apiPost } from "../lib/api";

interface Insumo {
  id: string; nome: string; codigo: string; categoria: string;
  unidade: string; estoque_atual: number; estoque_minimo: number;
  estoque_maximo: number; consumo_medio_mensal: number;
  meses_cobertura: number; lote: string; validade: string | null;
  dias_vencimento: number | null; local: string;
  status: "ok" | "alerta" | "critico" | "vencido" | "sem_estoque";
  valor_unitario: number; ultimo_recebimento: string | null;
}

interface ResumoAlmoxarifado {
  total_itens: number; itens_ok: number; itens_alerta: number;
  itens_critico: number; sem_estoque: number; vencendo_30d: number;
  valor_total_estoque: number;
}

const COR_STATUS: Record<string, string> = {
  ok: "#16a34a", alerta: "#d97706", critico: "#ea580c", vencido: "#dc2626", sem_estoque: "#6b7280",
};
const LABEL_STATUS: Record<string, string> = {
  ok: "OK", alerta: "Alerta", critico: "Crítico", vencido: "Vencido", sem_estoque: "Sem Estoque",
};
const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

function BarEstoque({ atual, min, max }: { atual: number; min: number; max: number }) {
  const pct = Math.min(100, max > 0 ? (atual / max) * 100 : 0);
  const minPct = max > 0 ? (min / max) * 100 : 0;
  const cor = atual <= 0 ? "#6b7280" : atual < min ? "#dc2626" : atual < min * 2 ? "#d97706" : "#16a34a";
  return (
    <div style={{ position: "relative" as const, height: 6, background: "#e5e7eb", borderRadius: 3, marginTop: 4 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: cor, borderRadius: 3 }}/>
      <div style={{ position: "absolute" as const, top: -2, left: `${minPct}%`, height: 10, width: 2, background: "#dc2626", borderRadius: 1 }}/>
    </div>
  );
}

function StatusIcon({ s }: { s: string }) {
  if (s === "ok")         return <CheckCircle size={16} color="#16a34a"/>;
  if (s === "sem_estoque")return <XCircle size={16} color="#6b7280"/>;
  return <AlertTriangle size={16} color={COR_STATUS[s]}/>;
}

function CardInsumo({ ins }: { ins: Insumo }) {
  const [aberto, setAberto] = useState(false);
  const cor = COR_STATUS[ins.status];

  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}25`, borderLeft: `4px solid ${cor}`, borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
      <div onClick={() => setAberto(o => !o)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", cursor: "pointer" }}>
        <StatusIcon s={ins.status}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" as const }}>
            <span style={{ fontWeight: 800, fontSize: 13 }}>{ins.nome}</span>
            <span style={{ fontSize: 9, fontWeight: 800, background: cor + "18", color: cor, padding: "2px 7px", borderRadius: 10 }}>{LABEL_STATUS[ins.status]}</span>
            <span style={{ fontSize: 9, color: "#9ca3af" }}>{ins.categoria} · {ins.codigo}</span>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 10, color: "#6b7280", marginBottom: 4 }}>
            <span>Estoque: <b style={{ color: cor }}>{ins.estoque_atual} {ins.unidade}</b></span>
            <span>Mín: <b>{ins.estoque_minimo}</b></span>
            <span>Cobertura: <b style={{ color: ins.meses_cobertura < 1 ? "#dc2626" : ins.meses_cobertura < 2 ? "#d97706" : "#16a34a" }}>{ins.meses_cobertura.toFixed(1)} meses</b></span>
            {ins.dias_vencimento !== null && ins.dias_vencimento <= 60 && (
              <span style={{ color: ins.dias_vencimento <= 0 ? "#dc2626" : "#d97706" }}>
                Validade: {ins.dias_vencimento <= 0 ? "VENCIDO" : `${ins.dias_vencimento}d`}
              </span>
            )}
          </div>
          <BarEstoque atual={ins.estoque_atual} min={ins.estoque_minimo} max={ins.estoque_maximo}/>
        </div>
        <div style={{ textAlign: "right" as const, flexShrink: 0, fontSize: 10 }}>
          <div style={{ fontWeight: 700, color: "#374151" }}>{BRL(ins.valor_unitario)}/un</div>
          <div style={{ color: "#9ca3af" }}>{ins.local}</div>
        </div>
        {aberto ? <ChevronDown size={14} color="#9ca3af"/> : <ChevronRight size={14} color="#9ca3af"/>}
      </div>

      {aberto && (
        <div style={{ borderTop: `1px solid ${cor}15`, padding: "14px 16px", background: "#fafafa" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Informações do Item</div>
              {[
                ["Código CATMAT/REMUME", ins.codigo],
                ["Lote",                 ins.lote],
                ["Validade",             ins.validade ?? "—"],
                ["Local de armazenagem", ins.local],
                ["Último recebimento",   ins.ultimo_recebimento ?? "—"],
                ["Valor unitário",       BRL(ins.valor_unitario)],
                ["Valor total em estoque", BRL(ins.estoque_atual * ins.valor_unitario)],
              ].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: 10, color: "#6b7280" }}>{l}</span>
                  <span style={{ fontSize: 10, fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Controle de Consumo</div>
              {[
                ["Estoque atual",          `${ins.estoque_atual} ${ins.unidade}`],
                ["Estoque mínimo",         `${ins.estoque_minimo} ${ins.unidade}`],
                ["Estoque máximo",         `${ins.estoque_maximo} ${ins.unidade}`],
                ["Consumo médio mensal",   `${ins.consumo_medio_mensal} ${ins.unidade}/mês`],
                ["Cobertura estimada",     `${ins.meses_cobertura.toFixed(1)} meses`],
                ["Ponto de ressuprimento", `${ins.estoque_minimo} ${ins.unidade}`],
                ["Quantidade a repor",     `${Math.max(0, ins.estoque_maximo - ins.estoque_atual)} ${ins.unidade}`],
              ].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: 10, color: "#6b7280" }}>{l}</span>
                  <span style={{ fontSize: 10, fontWeight: 700 }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 4 }}>Nível de estoque</div>
                <BarEstoque atual={ins.estoque_atual} min={ins.estoque_minimo} max={ins.estoque_maximo}/>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#9ca3af", marginTop: 2 }}>
                  <span>0</span><span style={{ color: "#dc2626" }}>▲ Mín ({ins.estoque_minimo})</span><span>{ins.estoque_maximo}</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <button style={{ padding: "6px 14px", fontSize: 11, fontWeight: 700, background: "#0369a1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
              Registrar Entrada
            </button>
            <button style={{ padding: "6px 14px", fontSize: 11, fontWeight: 700, background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer" }}>
              Registrar Saída
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Almoxarifado() {
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todos");
  const [busca, setBusca] = useState("");
  const qc = useQueryClient();

  const { data: resumo } = useQuery<ResumoAlmoxarifado>({
    queryKey: ["almo-resumo"],
    queryFn: () => apiGet("/api/almoxarifado/resumo") as Promise<ResumoAlmoxarifado>,
    staleTime: 300_000,
  });

  const { data: insumos = [], isLoading } = useQuery<Insumo[]>({
    queryKey: ["almo-lista", filtroStatus, filtroCategoria],
    queryFn: () => apiGet("/api/almoxarifado/lista", {
      status:    filtroStatus    !== "todos" ? filtroStatus    : undefined,
      categoria: filtroCategoria !== "todos" ? filtroCategoria : undefined,
    }) as Promise<Insumo[]>,
    staleTime: 300_000,
  });

  const categorias = ["todos", ...Array.from(new Set(insumos.map(i => i.categoria))).sort()];

  const visiveis = insumos.filter(i =>
    !busca || i.nome.toLowerCase().includes(busca.toLowerCase()) || i.codigo.includes(busca)
  );

  const r = resumo;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg,#1e3a5f 0%,#155e75 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}><Package size={18} color="#fff"/></div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Almoxarifado · Insumos e Medicamentos</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Gestão de estoques · CATMAT/REMUME · Ponto de ressuprimento · Validades · FMS Apuí/AM
            </div>
          </div>
        </div>

        {r && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8, marginTop: 16 }}>
            {[
              { l: "Total de Itens",   v: r.total_itens,                                            cor: "#bae6fd" },
              { l: "OK",               v: r.itens_ok,                                               cor: "#86efac" },
              { l: "Em Alerta",        v: r.itens_alerta,                                           cor: "#fde68a" },
              { l: "Crítico",          v: r.itens_critico,                                          cor: "#fed7aa" },
              { l: "Sem Estoque",      v: r.sem_estoque,                                            cor: "#fca5a5" },
              { l: "Vencendo <30d",    v: r.vencendo_30d,                                           cor: "#fca5a5" },
              { l: "Valor em Estoque", v: BRL(r.valor_total_estoque),                               cor: "#bae6fd" },
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
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Nome ou código..."
              style={{ padding: "6px 10px 6px 28px", fontSize: 11, border: "1px solid #d1d5db", borderRadius: 8, outline: "none", width: 180 }}/>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Status:</span>
          {["todos","ok","alerta","critico","sem_estoque","vencido"].map(s => {
            const cor = s === "todos" ? "#155e75" : COR_STATUS[s];
            const ativo = filtroStatus === s;
            return (
              <button key={s} onClick={() => setFiltroStatus(s)}
                style={{ padding: "5px 10px", fontSize: 10, borderRadius: 20, border: `1px solid ${ativo ? cor : "#d1d5db"}`, background: ativo ? cor + "15" : "#fff", color: ativo ? cor : "#374151", cursor: "pointer" }}>
                {s === "todos" ? "Todos" : LABEL_STATUS[s]}
              </button>
            );
          })}
          <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Categoria:</span>
          {categorias.map(c => (
            <button key={c} onClick={() => setFiltroCategoria(c)}
              style={{ padding: "5px 10px", fontSize: 10, borderRadius: 20, border: `1px solid ${filtroCategoria===c?"#155e75":"#d1d5db"}`, background: filtroCategoria===c?"#e0f2fe":"#fff", color: filtroCategoria===c?"#155e75":"#374151", cursor: "pointer" }}>
              {c === "todos" ? "Todas" : c}
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#9ca3af" }}>{visiveis.length} item(ns)</span>
        </div>

        {isLoading
          ? <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando estoque...</div>
          : visiveis.map(ins => <CardInsumo key={ins.id} ins={ins}/>)
        }
      </div>
    </div>
  );
}
