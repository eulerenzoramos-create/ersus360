// src/pages/RelatorioRAS.tsx — Relatório da Rede de Atenção à Saúde (RAS)
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Network, CheckCircle, AlertTriangle, XCircle, RefreshCw, Download, BarChart3, Layers } from "lucide-react";
import { apiGet, apiPost } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface PontoRAS {
  id: string; nome: string; tipo: string; nivel_atencao: "APS" | "MAC" | "Urgencia" | "RAPS" | "Domiciliar";
  municipio: string; ativo: boolean;
  capacidade_instalada: number; producao_mes: number; ocupacao_pct: number;
  indicadores: { nome: string; valor: string; status: "ok" | "atencao" | "critico" }[];
}

interface FluxoRAS {
  origem: string; destino: string; tipo_fluxo: string;
  volume_mes: number; tempo_medio_dias: number; status: "adequado" | "sobrecarregado" | "subuti";
}

interface ResumoRAS {
  pontos_rede: number; aps_credenciadas: number; servicos_mac: number;
  cobertura_populacao_pct: number; producao_total_mes: number;
  servicos_integrados: number; ultima_atualizacao: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const COR_NIVEL: Record<string, string> = {
  APS: "#16a34a", MAC: "#1351b4", Urgencia: "#dc2626", RAPS: "#7c3aed", Domiciliar: "#0d9488",
};

function StatusDot({ s }: { s: "ok" | "atencao" | "critico" }) {
  const cor = s === "ok" ? "#16a34a" : s === "atencao" ? "#d97706" : "#dc2626";
  return <div style={{ width: 8, height: 8, borderRadius: "50%", background: cor, flexShrink: 0 }}/>;
}

// ── Card Ponto RAS ────────────────────────────────────────────────────────────

function CardPonto({ ponto }: { ponto: PontoRAS }) {
  const corNivel = COR_NIVEL[ponto.nivel_atencao] ?? "#6b7280";
  const ocCor = ponto.ocupacao_pct > 90 ? "#dc2626" : ponto.ocupacao_pct > 70 ? "#d97706" : "#16a34a";

  return (
    <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "14px 16px", borderTop: `3px solid ${corNivel}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 3 }}>{ponto.nome}</div>
          <div style={{ fontSize: 9, color: "#9ca3af" }}>{ponto.tipo} · {ponto.municipio}</div>
        </div>
        <div style={{ display: "flex", flex: "column", gap: 4, alignItems: "flex-end" }}>
          <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 8, background: corNivel + "18", color: corNivel }}>{ponto.nivel_atencao}</span>
          {!ponto.ativo && <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 8, background: "#fee2e2", color: "#dc2626", marginTop: 3 }}>INATIVO</span>}
        </div>
      </div>

      {/* Ocupação */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
          <span style={{ fontSize: 9, color: "#9ca3af" }}>Ocupação</span>
          <span style={{ fontSize: 10, fontWeight: 800, color: ocCor }}>{ponto.ocupacao_pct}%</span>
        </div>
        <div style={{ height: 4, background: "#f3f4f6", borderRadius: 2 }}>
          <div style={{ height: "100%", width: `${ponto.ocupacao_pct}%`, background: ocCor, borderRadius: 2 }}/>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
          <span style={{ fontSize: 9, color: "#9ca3af" }}>Produção: {ponto.producao_mes?.toLocaleString("pt-BR")}</span>
          <span style={{ fontSize: 9, color: "#9ca3af" }}>Cap.: {ponto.capacidade_instalada?.toLocaleString("pt-BR")}</span>
        </div>
      </div>

      {/* Indicadores */}
      <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 8 }}>
        {ponto.indicadores.map((ind, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
            <StatusDot s={ind.status}/>
            <span style={{ fontSize: 10, color: "#6b7280", flex: 1 }}>{ind.nome}</span>
            <span style={{ fontSize: 10, fontWeight: 700 }}>{ind.valor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Principal ─────────────────────────────────────────────────────────────────

export default function RelatorioRAS() {
  const [tab, setTab] = useState<"rede" | "fluxos" | "relatorio">("rede");
  const [filtroNivel, setFiltroNivel] = useState("todos");

  const { data: resumo } = useQuery<ResumoRAS>({
    queryKey: ["ras-resumo"],
    queryFn: () => apiGet("/api/ras/resumo") as Promise<ResumoRAS>,
    staleTime: 300_000,
  });

  const { data: pontos = [], isLoading } = useQuery<PontoRAS[]>({
    queryKey: ["ras-pontos"],
    queryFn: () => apiGet("/api/ras/pontos") as Promise<PontoRAS[]>,
    staleTime: 300_000,
  });

  const { data: fluxos = [] } = useQuery<FluxoRAS[]>({
    queryKey: ["ras-fluxos"],
    queryFn: () => apiGet("/api/ras/fluxos") as Promise<FluxoRAS[]>,
    staleTime: 300_000,
  });

  const gerarRelatorio = useMutation({
    mutationFn: () => apiPost("/api/ras/gerar-relatorio"),
  });

  const r = resumo;
  const visiveis = pontos.filter(p => filtroNivel === "todos" || p.nivel_atencao === filtroNivel);

  if (!isLoading && !resumo) return (
    <div style={{ padding: 24 }}>
      <NaoDisponivelBanner
        titulo="RelatorioRAS indisponivel"
        nota="Dados nao disponiveis — integracao pendente de configuracao no Railway."
      />
    </div>
  );

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#5b21b6 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}><Network size={18} color="#fff"/></div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Relatório RAS · Rede de Atenção à Saúde</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              APS · MAC · Urgência · RAPS · Atenção Domiciliar · Fluxos e Referência/Contrarreferência · Apuí/AM
            </div>
          </div>
          <button onClick={() => gerarRelatorio.mutate()} disabled={gerarRelatorio.isPending}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            <Download size={12}/>{gerarRelatorio.isPending ? "Gerando..." : "Gerar Relatório"}
          </button>
        </div>

        {r && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginTop: 16 }}>
            {[
              { l: "Pontos da Rede",   v: r.pontos_rede,                        cor: "#c4b5fd" },
              { l: "UBS/eSF",          v: r.aps_credenciadas,                   cor: "#86efac" },
              { l: "Serviços MAC",     v: r.servicos_mac,                       cor: "#bfdbfe" },
              { l: "Cobertura Pop.",   v: `${r.cobertura_populacao_pct}%`,      cor: "#c4b5fd" },
              { l: "Produção/Mês",     v: r.producao_total_mes?.toLocaleString("pt-BR"), cor: "#c4b5fd" },
              { l: "Serv. Integrados", v: r.servicos_integrados,                cor: "#86efac" },
            ].map(k => (
              <div key={k.l} style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "10px 12px", textAlign: "center" as const }}>
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
          {([["rede","Pontos da Rede"],["fluxos","Fluxos e Referência"],["relatorio","Consolidado"]] as [string,string][]).map(([id,l]) => (
            <button key={id} onClick={() => setTab(id as "rede" | "fluxos" | "relatorio")}
              style={{ padding: "6px 18px", borderRadius: 7, border: "none", fontSize: 12, fontWeight: tab===id?700:400, background: tab===id?"#5b21b6":"transparent", color: tab===id?"#fff":"#6b7280", cursor: "pointer" }}>
              {l}
            </button>
          ))}
        </div>

        {tab === "rede" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" as const }}>
              {["todos","APS","MAC","Urgencia","RAPS","Domiciliar"].map(n => (
                <button key={n} onClick={() => setFiltroNivel(n)}
                  style={{ padding: "5px 12px", fontSize: 11, borderRadius: 20, border: `1px solid ${filtroNivel===n?(COR_NIVEL[n]??"#5b21b6"):"#d1d5db"}`, background: filtroNivel===n?((COR_NIVEL[n]??"#5b21b6")+"15"):"#fff", color: filtroNivel===n?(COR_NIVEL[n]??"#5b21b6"):"#374151", cursor: "pointer" }}>
                  {n === "todos" ? "Todos" : n}
                </button>
              ))}
            </div>
            {isLoading
              ? <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando rede...</div>
              : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
                  {visiveis.map(p => <CardPonto key={p.id} ponto={p}/>)}
                </div>
            }
          </>
        )}

        {tab === "fluxos" && (
          <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", background: "#f8fafc", borderBottom: "1px solid #e4e7ec", display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1fr 80px 100px 100px", gap: 12, fontSize: 10, fontWeight: 700, color: "#6b7280" }}>
              <span>ORIGEM</span><span>DESTINO</span><span>TIPO FLUXO</span><span style={{textAlign:"center" as const}}>VOL./MÊS</span><span style={{textAlign:"center" as const}}>T. MÉDIO</span><span style={{textAlign:"center" as const}}>STATUS</span>
            </div>
            {fluxos.map((f, i) => {
              const cor = f.status === "adequado" ? "#16a34a" : f.status === "sobrecarregado" ? "#dc2626" : "#d97706";
              const label = f.status === "adequado" ? "Adequado" : f.status === "sobrecarregado" ? "Sobrecarregado" : "Subutilizado";
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1fr 80px 100px 100px", gap: 12, padding: "10px 16px", borderBottom: "1px solid #f3f4f6", fontSize: 11, alignItems: "center" }}>
                  <span style={{ fontWeight: 600 }}>{f.origem}</span>
                  <span>{f.destino}</span>
                  <span style={{ color: "#6b7280" }}>{f.tipo_fluxo}</span>
                  <span style={{ textAlign: "center" as const, fontWeight: 700 }}>{f.volume_mes}</span>
                  <span style={{ textAlign: "center" as const }}>{f.tempo_medio_dias}d</span>
                  <span style={{ textAlign: "center" as const, fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 8, background: cor + "18", color: cor }}>{label}</span>
                </div>
              );
            })}
          </div>
        )}

        {tab === "relatorio" && r && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "20px 24px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}><Layers size={14} color="#5b21b6"/> Resumo da Rede</div>
              {[
                ["Pontos credenciados na RAS",  String(r.pontos_rede)],
                ["UBS / equipes ESF ativas",    String(r.aps_credenciadas)],
                ["Serviços de média/alta comp.", String(r.servicos_mac)],
                ["Cobertura populacional APS",  `${r.cobertura_populacao_pct}%`],
                ["Produção total mês",          r.producao_total_mes?.toLocaleString("pt-BR")],
                ["Serviços integrados ao RNDS", String(r.servicos_integrados)],
                ["Última atualização",          r.ultima_atualizacao],
              ].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>{l}</span>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "20px 24px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}><BarChart3 size={14} color="#5b21b6"/> Distribuição por Nível</div>
              {(["APS","MAC","Urgencia","RAPS","Domiciliar"] as const).map(nivel => {
                const qt = pontos.filter(p => p.nivel_atencao === nivel).length;
                const pct = pontos.length > 0 ? Math.round((qt / pontos.length) * 100) : 0;
                const cor = COR_NIVEL[nivel];
                return (
                  <div key={nivel} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: cor }}>{nivel}</span>
                      <span style={{ fontSize: 11, fontWeight: 700 }}>{qt} ({pct}%)</span>
                    </div>
                    <div style={{ height: 5, background: "#f3f4f6", borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: cor, borderRadius: 3 }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
