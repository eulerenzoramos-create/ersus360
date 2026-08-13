// src/pages/CentralRegulacao.tsx — Central de Regulação · SISREG / Fila de Espera
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftRight, Clock, CheckCircle, AlertTriangle, XCircle,
  RefreshCw, ChevronDown, ChevronRight, Search, User,
} from "lucide-react";
import { apiGet, apiPost } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface SolicitacaoReg {
  id: string; paciente: string; cns: string; idade: number;
  especialidade: string; cid: string; prioridade: "urgente" | "alta" | "media" | "eletiva";
  data_solicitacao: string; dias_espera: number;
  status: "aguardando" | "agendado" | "autorizado" | "negado" | "realizado";
  unidade_origem: string; unidade_destino: string | null;
  data_agendamento: string | null; observacao: string;
}

interface ResumoRegulacao {
  total_fila: number; urgentes: number; agendados_mes: number;
  tempo_medio_espera_dias: number; taxa_autorizacao_pct: number;
  oferta_disponivel: number; demanda_reprimida: number;
  ultima_sincronizacao: string;
}

interface EspecialidadeFila {
  especialidade: string; aguardando: number; tempo_medio_dias: number; oferta_mensal: number; deficit: number;
}

// ── Cores por prioridade ──────────────────────────────────────────────────────

const COR_PRIO: Record<string, string> = {
  urgente: "#dc2626", alta: "#ea580c", media: "#d97706", eletiva: "#16a34a",
};
const COR_STATUS: Record<string, string> = {
  aguardando: "#d97706", agendado: "#1351b4", autorizado: "#16a34a", negado: "#dc2626", realizado: "#6b7280",
};

// ── Badge ─────────────────────────────────────────────────────────────────────

function PrioBadge({ p }: { p: string }) {
  const cor = COR_PRIO[p] ?? "#6b7280";
  return <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 10, background: cor + "18", color: cor }}>{p.toUpperCase()}</span>;
}

function StatBadge({ s }: { s: string }) {
  const cor = COR_STATUS[s] ?? "#6b7280";
  const labels: Record<string,string> = { aguardando:"Aguardando", agendado:"Agendado", autorizado:"Autorizado", negado:"Negado", realizado:"Realizado" };
  return <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 10, background: cor + "18", color: cor }}>{labels[s] ?? s}</span>;
}

// ── Linha da fila ─────────────────────────────────────────────────────────────

function LinhaFila({ sol }: { sol: SolicitacaoReg }) {
  const [aberta, setAberta] = useState(false);
  const diasCor = sol.dias_espera > 90 ? "#dc2626" : sol.dias_espera > 30 ? "#d97706" : "#16a34a";

  return (
    <div style={{ borderBottom: "1px solid #f3f4f6" }}>
      <div onClick={() => setAberta(o => !o)} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px 90px 80px 24px", gap: 12, padding: "10px 16px", cursor: "pointer", alignItems: "center", fontSize: 11 }}>
        <div>
          <div style={{ fontWeight: 700 }}>{sol.paciente}</div>
          <div style={{ fontSize: 9, color: "#9ca3af" }}>CNS {sol.cns} · {sol.idade}a · {sol.unidade_origem}</div>
        </div>
        <div>
          <div style={{ fontWeight: 600 }}>{sol.especialidade}</div>
          <div style={{ fontSize: 9, color: "#9ca3af" }}>CID: {sol.cid}</div>
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const }}>
          <PrioBadge p={sol.prioridade}/>
          <StatBadge s={sol.status}/>
        </div>
        <div style={{ textAlign: "center" as const, fontWeight: 800, color: diasCor }}>{sol.dias_espera}d</div>
        <div style={{ fontSize: 10, color: "#6b7280" }}>{sol.data_solicitacao}</div>
        <div style={{ fontSize: 10, color: sol.data_agendamento ? "#16a34a" : "#9ca3af" }}>{sol.data_agendamento ?? "—"}</div>
        {aberta ? <ChevronDown size={12} color="#9ca3af"/> : <ChevronRight size={12} color="#9ca3af"/>}
      </div>
      {aberta && (
        <div style={{ padding: "10px 16px 14px 48px", background: "#f9fafb" }}>
          <div style={{ fontSize: 11 }}>
            <b>Unidade destino:</b> {sol.unidade_destino ?? "Não definida"} &nbsp;·&nbsp;
            <b>Observação:</b> {sol.observacao || "—"}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Principal ─────────────────────────────────────────────────────────────────

export default function CentralRegulacao() {
  const [tab, setTab] = useState<"fila" | "especialidades" | "sync">("fila");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPrio, setFiltroPrio] = useState("todos");
  const qc = useQueryClient();

  const { data: resumo } = useQuery<ResumoRegulacao>({
    queryKey: ["regulacao-resumo"],
    queryFn: () => apiGet("/api/central-regulacao/resumo") as Promise<ResumoRegulacao>,
    staleTime: 120_000,
  });

  const { data: solicitacoes = [], isLoading } = useQuery<SolicitacaoReg[]>({
    queryKey: ["regulacao-solicitacoes"],
    queryFn: () => apiGet("/api/central-regulacao/solicitacoes") as Promise<SolicitacaoReg[]>,
    staleTime: 120_000,
  });

  const { data: especialidades = [] } = useQuery<EspecialidadeFila[]>({
    queryKey: ["regulacao-especialidades"],
    queryFn: () => apiGet("/api/central-regulacao/especialidades") as Promise<EspecialidadeFila[]>,
    staleTime: 300_000,
  });

  const sincronizar = useMutation({
    mutationFn: () => apiPost("/api/central-regulacao/sincronizar"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["regulacao-resumo"] }); qc.invalidateQueries({ queryKey: ["regulacao-solicitacoes"] }); },
  });

  const r = resumo;

  const visiveis = solicitacoes.filter(s => {
    const okBusca = !busca || s.paciente.toLowerCase().includes(busca.toLowerCase()) || s.especialidade.toLowerCase().includes(busca.toLowerCase()) || s.cns.includes(busca);
    const okStatus = filtroStatus === "todos" || s.status === filtroStatus;
    const okPrio   = filtroPrio === "todos"   || s.prioridade === filtroPrio;
    return okBusca && okStatus && okPrio;
  });

  if (!isLoading && !resumo) return (
    <div style={{ padding: 24 }}>
      <NaoDisponivelBanner
        titulo="CentralRegulacao indisponivel"
        nota="Dados nao disponiveis — integracao pendente de configuracao no Railway."
      />
    </div>
  );

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}><ArrowLeftRight size={18} color="#fff"/></div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Central de Regulação · SISREG</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Fila de espera · Encaminhamentos · Consultas e exames especializados · MAC Apuí/AM
            </div>
          </div>
          <button onClick={() => sincronizar.mutate()} disabled={sincronizar.isPending}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            <RefreshCw size={12}/>{sincronizar.isPending ? "Sincronizando..." : "Sincronizar SISREG"}
          </button>
        </div>

        {r && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8, marginTop: 16 }}>
            {[
              { l: "Fila Total",       v: r.total_fila,                      cor: "#bfdbfe" },
              { l: "Urgentes",         v: r.urgentes,                        cor: "#fca5a5" },
              { l: "Agendados/mês",    v: r.agendados_mes,                   cor: "#86efac" },
              { l: "Espera Média",     v: `${r.tempo_medio_espera_dias}d`,   cor: "#fde68a" },
              { l: "Taxa Autorização", v: `${r.taxa_autorizacao_pct}%`,      cor: "#86efac" },
              { l: "Oferta Disponível",v: r.oferta_disponivel,               cor: "#a5f3fc" },
              { l: "Dem. Reprimida",   v: r.demanda_reprimida,               cor: "#fca5a5" },
            ].map(k => (
              <div key={k.l} style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "10px 10px", textAlign: "center" as const }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: k.cor }}>{k.v}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.5)" }}>{k.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "20px 28px 60px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: 4, marginBottom: 16, width: "fit-content" as const }}>
          {([["fila","Fila de Espera"],["especialidades","Por Especialidade"],["sync","Sincronização"]] as [string,string][]).map(([id,l]) => (
            <button key={id} onClick={() => setTab(id as "fila" | "especialidades" | "sync")}
              style={{ padding: "6px 18px", borderRadius: 7, border: "none", fontSize: 12, fontWeight: tab===id?700:400, background: tab===id?"#2563eb":"transparent", color: tab===id?"#fff":"#6b7280", cursor: "pointer" }}>
              {l}
            </button>
          ))}
        </div>

        {tab === "fila" && (
          <>
            {/* Filtros */}
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "12px 16px", marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const, alignItems: "center" }}>
                <div style={{ position: "relative" as const, flex: 1, minWidth: 200 }}>
                  <Search size={13} color="#9ca3af" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}/>
                  <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar paciente, especialidade ou CNS..."
                    style={{ width: "100%", padding: "7px 10px 7px 30px", fontSize: 12, border: "1px solid #d1d5db", borderRadius: 8, outline: "none", boxSizing: "border-box" as const }}/>
                </div>
                {["todos","aguardando","agendado","autorizado","negado"].map(s => (
                  <button key={s} onClick={() => setFiltroStatus(s)}
                    style={{ padding: "5px 10px", fontSize: 10, borderRadius: 20, border: `1px solid ${filtroStatus===s?"#2563eb":"#d1d5db"}`, background: filtroStatus===s?"#dbeafe":"#fff", color: filtroStatus===s?"#1d4ed8":"#374151", cursor: "pointer" }}>
                    {s === "todos" ? "Todos" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
                {["todos","urgente","alta","media","eletiva"].map(p => (
                  <button key={p} onClick={() => setFiltroPrio(p)}
                    style={{ padding: "5px 10px", fontSize: 10, borderRadius: 20, border: `1px solid ${filtroPrio===p?(COR_PRIO[p]??"#2563eb"):"#d1d5db"}`, background: filtroPrio===p?((COR_PRIO[p]??"#2563eb")+"15"):"#fff", color: filtroPrio===p?(COR_PRIO[p]??"#1d4ed8"):"#374151", cursor: "pointer" }}>
                    {p === "todos" ? "Todas prior." : p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#9ca3af" }}>{visiveis.length} registros</span>
              </div>
            </div>

            {/* Tabela */}
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px 90px 80px 24px", gap: 12, padding: "8px 16px", background: "#f8fafc", borderBottom: "1px solid #e4e7ec", fontSize: 10, fontWeight: 700, color: "#6b7280" }}>
                <span>PACIENTE</span><span>ESPECIALIDADE</span><span>STATUS/PRIOR.</span><span style={{textAlign:"center" as const}}>ESPERA</span><span>SOLICITAÇÃO</span><span>AGENDAMENTO</span><span/>
              </div>
              {isLoading
                ? <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Carregando fila...</div>
                : visiveis.map(s => <LinhaFila key={s.id} sol={s}/>)
              }
            </div>
          </>
        )}

        {tab === "especialidades" && (
          <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e4e7ec", display: "grid", gridTemplateColumns: "2fr 80px 100px 100px 100px", gap: 12, fontSize: 10, fontWeight: 700, color: "#6b7280" }}>
              <span>ESPECIALIDADE</span><span style={{textAlign:"center" as const}}>AGUARDANDO</span><span style={{textAlign:"center" as const}}>ESPERA MÉDIA</span><span style={{textAlign:"center" as const}}>OFERTA/MÊS</span><span style={{textAlign:"center" as const}}>DÉFICIT</span>
            </div>
            {especialidades.map((e, i) => {
              const deficit = e.aguardando - e.oferta_mensal;
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 80px 100px 100px 100px", gap: 12, padding: "12px 16px", borderBottom: "1px solid #f3f4f6", fontSize: 11, alignItems: "center" }}>
                  <span style={{ fontWeight: 600 }}>{e.especialidade}</span>
                  <span style={{ textAlign: "center" as const, fontWeight: 800, color: e.aguardando > 50 ? "#dc2626" : "#1f2937" }}>{e.aguardando}</span>
                  <span style={{ textAlign: "center" as const, color: e.tempo_medio_dias > 90 ? "#dc2626" : e.tempo_medio_dias > 30 ? "#d97706" : "#16a34a", fontWeight: 700 }}>{e.tempo_medio_dias} dias</span>
                  <span style={{ textAlign: "center" as const }}>{e.oferta_mensal}</span>
                  <span style={{ textAlign: "center" as const, fontWeight: 800, color: deficit > 0 ? "#dc2626" : "#16a34a" }}>{deficit > 0 ? `+${deficit}` : deficit}</span>
                </div>
              );
            })}
          </div>
        )}

        {tab === "sync" && resumo && (
          <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "20px 24px", maxWidth: 480 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Status da Sincronização SISREG</div>
            {[
              ["Última sincronização", resumo.ultima_sincronizacao],
              ["Registros importados", String(resumo.total_fila)],
              ["Fonte", "SISREG — Ministério da Saúde"],
              ["Frequência", "A cada 6 horas (cron)"],
              ["Próxima sincronização", "2026-07-23 12:00"],
            ].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                <span style={{ fontSize: 11, color: "#6b7280" }}>{l}</span>
                <span style={{ fontSize: 11, fontWeight: 700 }}>{v}</span>
              </div>
            ))}
            <button onClick={() => sincronizar.mutate()} disabled={sincronizar.isPending}
              style={{ marginTop: 16, width: "100%", padding: "10px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {sincronizar.isPending ? "Sincronizando..." : "Sincronizar Agora"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
