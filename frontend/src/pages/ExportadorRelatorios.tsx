// src/pages/ExportadorRelatorios.tsx — Exportador de Relatórios · ERSUS 360
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Download, FileText, FileSpreadsheet, Table, CheckCircle,
  Clock, AlertCircle, ChevronDown, ChevronRight,
} from "lucide-react";
import { apiGet, apiPost } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

interface RelatorioDisponivel {
  id: string; nome: string; descricao: string; modulo: string;
  formatos: ("pdf" | "excel" | "csv")[]; ultima_geracao: string | null;
  tempo_estimado_s: number;
}

interface JobExportacao {
  job_id: string; relatorio_id: string; nome: string;
  formato: string; status: "pendente" | "gerando" | "concluido" | "erro";
  criado_em: string; url_download: string | null; erro: string | null;
}

interface ResumoExport {
  relatorios_disponiveis: number; geracoes_mes: number;
  ultima_exportacao: string; formatos_suportados: string[];
}

const COR_MOD: Record<string, string> = {
  "APS": "#1d4ed8", "Vigilância": "#7c3aed", "Financeiro": "#d97706",
  "Gestão": "#0369a1", "Saúde Bucal": "#0891b2", "Farmácia": "#16a34a",
};

function IconFormato({ f }: { f: string }) {
  if (f === "excel") return <FileSpreadsheet size={13} color="#16a34a"/>;
  if (f === "csv")   return <Table           size={13} color="#6b7280"/>;
  return <FileText size={13} color="#dc2626"/>;
}

function StatusJob({ j }: { j: JobExportacao }) {
  if (j.status === "concluido") return <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#16a34a", fontSize: 10, fontWeight: 700 }}><CheckCircle size={12}/> Concluído</span>;
  if (j.status === "gerando")   return <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#d97706", fontSize: 10, fontWeight: 700 }}><Clock size={12}/> Gerando...</span>;
  if (j.status === "erro")      return <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#dc2626", fontSize: 10, fontWeight: 700 }}><AlertCircle size={12}/> Erro</span>;
  return <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#9ca3af", fontSize: 10 }}><Clock size={12}/> Pendente</span>;
}

function CardRelatorio({ rel, onExportar }: { rel: RelatorioDisponivel; onExportar: (id: string, fmt: string) => void }) {
  const [aberto, setAberto] = useState(false);
  const [fmt, setFmt] = useState<string>(rel.formatos[0]);
  const cor = COR_MOD[rel.modulo] ?? "#374151";

  return (
    <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderLeft: `4px solid ${cor}`, borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", cursor: "pointer" }} onClick={() => setAberto(o => !o)}>
        <FileText size={15} color={cor}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 12, color: "#111", marginBottom: 2 }}>{rel.nome}</div>
          <div style={{ fontSize: 10, color: "#6b7280" }}>{rel.descricao}</div>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
          <span style={{ fontSize: 9, fontWeight: 700, background: cor + "15", color: cor, padding: "2px 8px", borderRadius: 8 }}>{rel.modulo}</span>
          {aberto ? <ChevronDown size={13} color="#9ca3af"/> : <ChevronRight size={13} color="#9ca3af"/>}
        </div>
      </div>
      {aberto && (
        <div style={{ borderTop: "1px solid #f3f4f6", padding: "12px 16px", background: "#fafafa" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 9, color: "#9ca3af", marginBottom: 4 }}>FORMATOS DISPONÍVEIS</div>
              <div style={{ display: "flex", gap: 6 }}>
                {rel.formatos.map(f => (
                  <button key={f} onClick={() => setFmt(f)}
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", fontSize: 10, borderRadius: 8, border: `1px solid ${fmt===f?"#374151":"#d1d5db"}`, background: fmt===f?"#111":"#fff", color: fmt===f?"#fff":"#374151", cursor: "pointer", fontWeight: fmt===f?700:400 }}>
                    <IconFormato f={f}/> {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#9ca3af", marginBottom: 4 }}>ÚLTIMA GERAÇÃO</div>
              <div style={{ fontSize: 11, color: "#374151" }}>{rel.ultima_geracao ?? "Nunca gerado"}</div>
              <div style={{ fontSize: 10, color: "#9ca3af" }}>Tempo estimado: ~{rel.tempo_estimado_s}s</div>
            </div>
          </div>
          <button onClick={() => onExportar(rel.id, fmt)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 11, fontWeight: 800, background: cor, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
            <Download size={13}/> Gerar e baixar ({fmt.toUpperCase()})
          </button>
        </div>
      )}
    </div>
  );
}

export default function ExportadorRelatorios() {
  const [filtroModulo, setFiltroModulo] = useState("todos");
  const [jobs, setJobs] = useState<JobExportacao[]>([]);

  const { data: resumo } = useQuery<ResumoExport>({
    queryKey: ["export-resumo"],
    queryFn: () => apiGet("/api/exportador/resumo") as Promise<ResumoExport>,
    staleTime: 60_000,
  });

  const { data: relatorios = [] } = useQuery<RelatorioDisponivel[]>({
    queryKey: ["export-lista", filtroModulo],
    queryFn: () => apiGet("/api/exportador/lista", filtroModulo !== "todos" ? { modulo: filtroModulo } : {}) as Promise<RelatorioDisponivel[]>,
    staleTime: 60_000,
  });

  const gerar = useMutation({
    mutationFn: ({ id, fmt }: { id: string; fmt: string }) => apiPost("/api/exportador/gerar", { relatorio_id: id, formato: fmt }) as Promise<JobExportacao>,
    onSuccess: (job: JobExportacao) => setJobs(prev => [job, ...prev.slice(0, 9)]),
  });

  const modulos = ["todos", ...Array.from(new Set(relatorios.map(r => r.modulo)))];

  if (!resumo) return (
    <div style={{ padding: 24 }}>
      <NaoDisponivelBanner
        titulo="ExportadorRelatorios indisponivel"
        nota="Dados nao disponiveis — integracao pendente de configuracao no Railway."
      />
    </div>
  );

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}>
                <Download size={18} color="#fff"/>
              </div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Exportador de Relatórios</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Geração de PDF, Excel e CSV · ERSUS 360 · FMS Apuí/AM
            </div>
          </div>
        </div>

        {resumo && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 16 }}>
            {[
              { l: "Relatórios disponíveis", v: resumo.relatorios_disponiveis, cor: "#c7d2fe" },
              { l: "Gerações no mês",        v: resumo.geracoes_mes,           cor: "#86efac" },
              { l: "Última exportação",      v: resumo.ultima_exportacao,      cor: "#fde68a" },
              { l: "Formatos",               v: resumo.formatos_suportados.join(", ").toUpperCase(), cor: "#bfdbfe" },
            ].map(k => (
              <div key={k.l} style={{ background: "rgba(255,255,255,.1)", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: typeof k.v === "number" ? 22 : 14, fontWeight: 900, color: k.cor, lineHeight: 1.2 }}>{k.v}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.5)", marginTop: 2 }}>{k.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "20px 28px 60px" }}>
        {/* Fila de jobs */}
        {jobs.length > 0 && (
          <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#374151", marginBottom: 10, letterSpacing: 0.5 }}>FILA DE EXPORTAÇÕES DESTA SESSÃO</div>
            {jobs.map(j => (
              <div key={j.job_id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
                <IconFormato f={j.formato}/>
                <span style={{ flex: 1, fontSize: 11, color: "#374151" }}>{j.nome}</span>
                <span style={{ fontSize: 10, color: "#9ca3af" }}>{j.criado_em}</span>
                <StatusJob j={j}/>
                {j.status === "concluido" && j.url_download && (
                  <a href={j.url_download} style={{ fontSize: 10, fontWeight: 700, color: "#1d4ed8", display: "flex", alignItems: "center", gap: 3 }}>
                    <Download size={11}/> Baixar
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Filtros */}
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "12px 16px", marginBottom: 14, display: "flex", gap: 8, flexWrap: "wrap" as const, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Módulo:</span>
          {modulos.map(m => (
            <button key={m} onClick={() => setFiltroModulo(m)}
              style={{ padding: "5px 10px", fontSize: 10, borderRadius: 20, border: `1px solid ${filtroModulo===m?"#0f3460":"#d1d5db"}`, background: filtroModulo===m?"#eef2ff":"#fff", color: filtroModulo===m?"#0f3460":"#374151", cursor: "pointer", fontWeight: filtroModulo===m?700:400 }}>
              {m === "todos" ? "Todos" : m}
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#9ca3af" }}>{relatorios.length} relatório(s)</span>
        </div>

        {relatorios.map(r => (
          <CardRelatorio key={r.id} rel={r} onExportar={(id, fmt) => gerar.mutate({ id, fmt })}/>
        ))}
      </div>
    </div>
  );
}
