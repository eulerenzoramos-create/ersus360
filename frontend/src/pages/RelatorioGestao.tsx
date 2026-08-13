// src/pages/RelatorioGestao.tsx — Relatório de Gestão Quadrimestral · CMS
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText, CheckCircle, AlertTriangle, Download, ChevronDown, ChevronRight,
  BarChart2, Target, Users, DollarSign, Activity, TrendingUp,
} from "lucide-react";
import { apiGet, apiPost } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

interface SecaoRelatorio {
  id: string; titulo: string; descricao: string;
  status: "aprovada" | "pendente" | "revisao" | "rascunho";
  itens: ItemRelatorio[];
  percentual_execucao: number;
}

interface ItemRelatorio {
  indicador: string; meta: string; realizado: string;
  situacao: "atingida" | "parcial" | "nao_atingida" | "sem_dado";
  justificativa: string;
}

interface ResumoRG {
  quadrimestre: string; periodo: string; ano: number;
  secoes_total: number; secoes_aprovadas: number; secoes_pendentes: number;
  indicadores_total: number; indicadores_atingidos: number;
  data_apresentacao_cms: string; status_geral: string;
}

const COR_SECAO: Record<string, string> = {
  aprovada: "#16a34a", pendente: "#d97706", revisao: "#ea580c", rascunho: "#6b7280",
};
const COR_SITUACAO: Record<string, string> = {
  atingida: "#16a34a", parcial: "#d97706", nao_atingida: "#dc2626", sem_dado: "#9ca3af",
};
const LABEL_SITUACAO: Record<string, string> = {
  atingida: "Atingida", parcial: "Parcial", nao_atingida: "Não Atingida", sem_dado: "Sem Dado",
};

const ICONES: Record<string, React.ReactNode> = {
  "Atenção Primária":       <Activity size={14} color="#16a34a"/>,
  "Vigilância em Saúde":    <AlertTriangle size={14} color="#d97706"/>,
  "Gestão Financeira":      <DollarSign size={14} color="#1351b4"/>,
  "Recursos Humanos":       <Users size={14} color="#7c3aed"/>,
  "Saúde Mental":           <Target size={14} color="#0d9488"/>,
  "Assistência Farmacêutica": <BarChart2 size={14} color="#9333ea"/>,
};

function BollinhaSituacao({ s }: { s: string }) {
  const cor = COR_SITUACAO[s] ?? "#9ca3af";
  const label = LABEL_SITUACAO[s] ?? s;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, color: cor }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: cor, display: "inline-block" }}/>
      {label}
    </span>
  );
}

function CardSecao({ sec }: { sec: SecaoRelatorio }) {
  const [aberto, setAberto] = useState(false);
  const cor = COR_SECAO[sec.status];
  const atingidas = sec.itens.filter(i => i.situacao === "atingida").length;

  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}25`, borderLeft: `4px solid ${cor}`, borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
      <div onClick={() => setAberto(o => !o)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", cursor: "pointer" }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: cor + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {ICONES[sec.titulo] ?? <FileText size={14} color={cor}/>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" as const }}>
            <span style={{ fontWeight: 800, fontSize: 14 }}>{sec.titulo}</span>
            <span style={{ fontSize: 9, fontWeight: 800, background: cor + "18", color: cor, padding: "2px 8px", borderRadius: 10 }}>
              {sec.status.charAt(0).toUpperCase() + sec.status.slice(1).replace("_", " ")}
            </span>
            <span style={{ fontSize: 9, color: "#9ca3af" }}>{atingidas}/{sec.itens.length} indicadores atingidos</span>
          </div>
          <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 6 }}>{sec.descricao}</div>
          <div style={{ height: 4, background: "#e5e7eb", borderRadius: 2 }}>
            <div style={{ height: "100%", width: `${sec.percentual_execucao}%`, background: cor, borderRadius: 2 }}/>
          </div>
        </div>
        <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: cor }}>{sec.percentual_execucao}%</div>
          <div style={{ fontSize: 9, color: "#9ca3af" }}>execução</div>
        </div>
        {aberto ? <ChevronDown size={14} color="#9ca3af"/> : <ChevronRight size={14} color="#9ca3af"/>}
      </div>

      {aberto && (
        <div style={{ borderTop: `1px solid ${cor}15`, padding: "14px 16px", background: "#fafafa" }}>
          <div style={{ overflowX: "auto" as const }}>
            <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 11 }}>
              <thead>
                <tr>
                  {["Indicador", "Meta", "Realizado", "Situação", "Justificativa"].map(h => (
                    <th key={h} style={{ textAlign: "left" as const, padding: "6px 10px", fontSize: 9, fontWeight: 700, color: "#9ca3af", borderBottom: "1px solid #e4e7ec" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sec.itens.map((it, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "8px 10px", fontWeight: 600, color: "#374151" }}>{it.indicador}</td>
                    <td style={{ padding: "8px 10px", color: "#6b7280" }}>{it.meta}</td>
                    <td style={{ padding: "8px 10px", fontWeight: 700, color: COR_SITUACAO[it.situacao] }}>{it.realizado}</td>
                    <td style={{ padding: "8px 10px" }}><BollinhaSituacao s={it.situacao}/></td>
                    <td style={{ padding: "8px 10px", color: "#9ca3af", fontSize: 10 }}>{it.justificativa || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RelatorioGestao() {
  const qc = useQueryClient();

  const { data: resumo } = useQuery<ResumoRG>({
    queryKey: ["rg-resumo"],
    queryFn: () => apiGet("/api/relatorio-gestao/resumo") as Promise<ResumoRG>,
    staleTime: 300_000,
  });

  const { data: secoes = [], isLoading } = useQuery<SecaoRelatorio[]>({
    queryKey: ["rg-secoes"],
    queryFn: () => apiGet("/api/relatorio-gestao/secoes") as Promise<SecaoRelatorio[]>,
    staleTime: 300_000,
  });

  const gerar = useMutation({
    mutationFn: () => apiPost("/api/relatorio-gestao/gerar"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rg-resumo"] }),
  });

  const r = resumo;

  if (!isLoading && !resumo) return (
    <div style={{ padding: 24 }}>
      <NaoDisponivelBanner
        titulo="RelatorioGestao indisponivel"
        nota="Dados nao disponiveis — integracao pendente de configuracao no Railway."
      />
    </div>
  );

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg,#292524 0%,#57534e 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}><FileText size={18} color="#fff"/></div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Relatório de Gestão Quadrimestral</span>
              <span style={{ fontSize: 9, fontWeight: 800, background: "rgba(255,255,255,.2)", color: "#fde68a", padding: "2px 9px", borderRadius: 10 }}>CMS · Art. 36 LC 141/2012</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              {r ? `${r.quadrimestre} · ${r.periodo} · Apuí/AM · Apresentação ao CMS: ${r.data_apresentacao_cms}` : "Relatório de Gestão em Saúde · FMS Apuí/AM"}
            </div>
          </div>
          <button onClick={() => gerar.mutate()} disabled={gerar.isPending}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            <Download size={12}/>{gerar.isPending ? "Gerando..." : "Gerar PDF"}
          </button>
        </div>

        {r && (
          <>
            {/* Status geral */}
            <div style={{ background: "rgba(255,255,255,.12)", borderRadius: 10, padding: "12px 16px", marginTop: 14, display: "flex", gap: 24, alignItems: "center", border: "1px solid rgba(255,255,255,.15)" }}>
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)" }}>Status geral do relatório</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#fde68a" }}>{r.status_geral}</div>
              </div>
              <div style={{ width: 1, height: 36, background: "rgba(255,255,255,.2)" }}/>
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)" }}>Indicadores atingidos</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#86efac" }}>{r.indicadores_atingidos}/{r.indicadores_total}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 8, background: "rgba(255,255,255,.2)", borderRadius: 4 }}>
                  <div style={{ height: "100%", width: `${r.indicadores_total > 0 ? (r.indicadores_atingidos / r.indicadores_total) * 100 : 0}%`, background: "#86efac", borderRadius: 4 }}/>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginTop: 12 }}>
              {[
                { l: "Seções",           v: r.secoes_total,      cor: "#bae6fd" },
                { l: "Aprovadas",        v: r.secoes_aprovadas,  cor: "#86efac" },
                { l: "Pendentes",        v: r.secoes_pendentes,  cor: "#fde68a" },
                { l: "Indicadores",      v: r.indicadores_total, cor: "#bae6fd" },
                { l: "Atingidos",        v: r.indicadores_atingidos, cor: "#86efac" },
              ].map(k => (
                <div key={k.l} style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "10px 12px", textAlign: "center" as const }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: k.cor }}>{k.v}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,.5)" }}>{k.l}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ padding: "20px 28px 60px" }}>
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>Base Legal</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>
            Lei Complementar nº 141/2012 (art. 36) · Resolução CIT nº 8/2016 · Portaria GM/MS nº 3.992/2017 · IDSUS · PlanejaSUS
          </div>
        </div>

        {isLoading
          ? <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando relatório...</div>
          : secoes.map(sec => <CardSecao key={sec.id} sec={sec}/>)
        }
      </div>
    </div>
  );
}
