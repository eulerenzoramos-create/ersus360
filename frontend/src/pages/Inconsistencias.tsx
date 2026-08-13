/**
 * Inconsistências — ERSUS 360
 * Central de Inconsistências com abas:
 *   Cadastros | SCNES | CADSUS | SIAPS | Integrações
 *
 * Fase 6 — cada aba embute o respectivo módulo de auditoria.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle, CheckCircle, Clock, XCircle, Search,
  Plus, ChevronDown, ChevronRight, Filter, RefreshCw,
  Shield, FileText, ExternalLink, Users, Building2,
  TrendingDown, AlertOctagon, Package, UserCheck,
} from "lucide-react";
import { apiGet, api } from "../lib/api";
import { useMunicipioSeletor } from "../lib/municipio";
import MunicipioSeletor from "../components/MunicipioSeletor";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

// Abas externas
import ConformidadeSCNES from "./ConformidadeSCNES";
import QualidadeCADSUS   from "./QualidadeCADSUS";
import MonitorLotesSIAPS from "./MonitorLotesSIAPS";
import GapAnalysisAPS    from "./GapAnalysisAPS";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Gravidade = "critica" | "alta" | "media" | "baixa";
type Situacao  = "identificada" | "em_correcao" | "corrigida" | "encerrada" | "descartada";

interface Inconsistencia {
  id: number;
  municipio_ibge: string; municipio_nome: string; municipio_uf: string;
  competencia: string;
  programa: string; componente: string; descricao: string;
  cnes: string | null; ine: string | null; equipe_nome: string | null;
  quantidade_afetada: number | null;
  evidencia: string;
  fontes_comparadas: string[];
  link_evidencia: string | null;
  causa_confirmada: string | null;
  risco_assistencial: string | null;
  risco_financeiro: number | null;
  gravidade: Gravidade; situacao: Situacao;
  sistema_correcao: string | null; procedimento: string | null;
  responsavel: string | null; prazo: string | null;
  competencia_regularizacao: string | null;
  evidencia_resolucao: string | null; link_resolucao: string | null;
  resolvida_em: string | null;
  criado_em: string; atualizado_em: string;
}

interface Resumo {
  total: number; abertas: number; criticas: number;
  risco_financeiro_total: number;
  por_situacao: Record<string, number>;
  por_gravidade: Record<string, number>;
}

interface ScnesResumo {
  inconsistencias_abertas: number;
}

interface SiapsResumo {
  inconsistencias_abertas: number;
}

// ── Config visual ─────────────────────────────────────────────────────────────

const GRAVIDADE_CFG: Record<Gravidade, { label: string; cor: string; bg: string; dot: string }> = {
  critica: { label: "Crítica",  cor: "#991b1b", bg: "#fee2e2", dot: "#ef4444" },
  alta:    { label: "Alta",     cor: "#9a3412", bg: "#ffedd5", dot: "#f97316" },
  media:   { label: "Média",    cor: "#854d0e", bg: "#fef3c7", dot: "#f59e0b" },
  baixa:   { label: "Baixa",   cor: "#166534", bg: "#dcfce7", dot: "#22c55e" },
};

const SITUACAO_CFG: Record<Situacao, { label: string; cor: string; bg: string; icon: React.ReactNode }> = {
  identificada: { label: "Identificada",  cor: "#1d4ed8", bg: "#dbeafe", icon: <AlertTriangle size={12}/> },
  em_correcao:  { label: "Em correção",   cor: "#854d0e", bg: "#fef3c7", icon: <Clock size={12}/> },
  corrigida:    { label: "Corrigida",     cor: "#166534", bg: "#dcfce7", icon: <CheckCircle size={12}/> },
  encerrada:    { label: "Encerrada",     cor: "#374151", bg: "#f3f4f6", icon: <CheckCircle size={12}/> },
  descartada:   { label: "Descartada",    cor: "#6b7280", bg: "#f9fafb", icon: <XCircle size={12}/> },
};

function GravidadeBadge({ g }: { g: Gravidade }) {
  const cfg = GRAVIDADE_CFG[g];
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, fontWeight:700,
      padding:"2px 8px", borderRadius:20, color:cfg.cor, background:cfg.bg }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:cfg.dot, flexShrink:0 }}/>
      {cfg.label}
    </span>
  );
}

function SituacaoBadge({ s }: { s: Situacao }) {
  const cfg = SITUACAO_CFG[s];
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11, fontWeight:600,
      padding:"2px 8px", borderRadius:20, color:cfg.cor, background:cfg.bg }}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

// ── Cards de resumo ───────────────────────────────────────────────────────────

function ResumoCard({ label, valor, sub, cor, Icon }: {
  label: string; valor: string | number; sub?: string; cor: string;
  Icon: React.ElementType;
}) {
  return (
    <div style={{ background:"#fff", borderRadius:12, padding:"16px 18px",
      border:"1px solid #e2e8f0", boxShadow:"0 1px 4px rgba(0,0,0,.05)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <div style={{ width:32, height:32, borderRadius:8, background:`${cor}18`,
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Icon size={16} color={cor}/>
        </div>
        <span style={{ fontSize:12, color:"#64748b", fontWeight:500 }}>{label}</span>
      </div>
      <div style={{ fontSize:24, fontWeight:800, color:"#1e293b" }}>{valor}</div>
      {sub && <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{sub}</div>}
    </div>
  );
}

// ── Linha da tabela (expandível) ──────────────────────────────────────────────

function LinhaInconsistencia({ inc, onAtualizarSituacao }: {
  inc: Inconsistencia;
  onAtualizarSituacao: (id: number, situacao: string, evidencia?: string) => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const [novaSituacao, setNovaSituacao] = useState(inc.situacao);
  const [evidenciaInput, setEvidenciaInput] = useState("");

  const td: React.CSSProperties = { padding:"12px 14px", fontSize:13, color:"#374151",
    borderBottom:"1px solid #f1f5f9", verticalAlign:"middle" };

  return (
    <>
      <tr style={{ background: expandido ? "#f8fafc" : "#fff", cursor:"pointer" }}
        onClick={() => setExpandido(!expandido)}>
        <td style={{ ...td, width:24 }}>
          {expandido ? <ChevronDown size={13} color="#94a3b8"/> : <ChevronRight size={13} color="#94a3b8"/>}
        </td>
        <td style={td}>
          <div style={{ fontWeight:600, color:"#1e293b" }}>{inc.programa}</div>
          <div style={{ fontSize:11, color:"#64748b" }}>{inc.componente}</div>
        </td>
        <td style={td}>
          <div style={{ fontSize:12 }}>{inc.municipio_nome}/{inc.municipio_uf}</div>
          <div style={{ fontSize:11, color:"#94a3b8" }}>{inc.competencia.slice(4)}/{inc.competencia.slice(0,4)}</div>
        </td>
        <td style={td}><GravidadeBadge g={inc.gravidade}/></td>
        <td style={td}><SituacaoBadge s={inc.situacao}/></td>
        <td style={{ ...td, maxWidth:280 }}>
          <div style={{ fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {inc.descricao}
          </div>
        </td>
        <td style={{ ...td, textAlign:"right", fontVariantNumeric:"tabular-nums" }}>
          {inc.risco_financeiro
            ? <span style={{ color:"#dc2626", fontWeight:700 }}>
                R$ {inc.risco_financeiro.toLocaleString("pt-BR",{minimumFractionDigits:2})}
              </span>
            : <span style={{ color:"#94a3b8" }}>—</span>
          }
        </td>
        <td style={td}>
          {inc.prazo
            ? <span style={{ fontSize:11 }}>{new Date(inc.prazo).toLocaleDateString("pt-BR")}</span>
            : <span style={{ color:"#94a3b8", fontSize:11 }}>—</span>
          }
        </td>
      </tr>

      {expandido && (
        <tr>
          <td colSpan={8} style={{ background:"#f8fafc", borderBottom:"2px solid #e2e8f0", padding:0 }}>
            <div style={{ padding:"20px 24px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>

              {/* Coluna esquerda: detalhes */}
              <div>
                <Section title="Descrição completa">
                  <p style={{ margin:0, fontSize:13, lineHeight:1.6, color:"#374151" }}>{inc.descricao}</p>
                </Section>

                <Section title="Evidência">
                  <p style={{ margin:0, fontSize:13, lineHeight:1.6, color:"#374151" }}>{inc.evidencia}</p>
                  {inc.link_evidencia && (
                    <a href={inc.link_evidencia} target="_blank" rel="noreferrer"
                      style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:12,
                        color:"#1d4ed8", marginTop:6 }}>
                      <ExternalLink size={12}/> Ver evidência
                    </a>
                  )}
                </Section>

                {inc.causa_confirmada && (
                  <Section title="Causa confirmada">
                    <p style={{ margin:0, fontSize:13, color:"#374151" }}>{inc.causa_confirmada}</p>
                  </Section>
                )}

                {inc.risco_assistencial && (
                  <Section title="Risco assistencial">
                    <p style={{ margin:0, fontSize:13, color:"#9a3412" }}>{inc.risco_assistencial}</p>
                  </Section>
                )}

                {(inc.cnes || inc.ine || inc.equipe_nome) && (
                  <Section title="Registros afetados">
                    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                      {inc.cnes && <Chip label="CNES" valor={inc.cnes}/>}
                      {inc.ine && <Chip label="INE" valor={inc.ine}/>}
                      {inc.equipe_nome && <Chip label="Equipe" valor={inc.equipe_nome}/>}
                      {inc.quantidade_afetada && (
                        <Chip label="Pessoas" valor={inc.quantidade_afetada.toLocaleString("pt-BR")}/>
                      )}
                    </div>
                  </Section>
                )}

                {inc.fontes_comparadas.length > 0 && (
                  <Section title="Fontes comparadas">
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {inc.fontes_comparadas.map(f => (
                        <span key={f} style={{ fontSize:11, padding:"2px 8px", background:"#eff6ff",
                          color:"#1d4ed8", borderRadius:6 }}>{f}</span>
                      ))}
                    </div>
                  </Section>
                )}
              </div>

              {/* Coluna direita: procedimento + atualizar situação */}
              <div>
                {inc.procedimento && (
                  <Section title="Procedimento de correção">
                    <p style={{ margin:0, fontSize:13, color:"#374151" }}>{inc.procedimento}</p>
                    {inc.sistema_correcao && (
                      <div style={{ marginTop:6, fontSize:12, color:"#64748b" }}>
                        Sistema: <strong>{inc.sistema_correcao}</strong>
                      </div>
                    )}
                  </Section>
                )}

                {(inc.responsavel || inc.competencia_regularizacao) && (
                  <Section title="Responsável e prazo">
                    {inc.responsavel && <Chip label="Responsável" valor={inc.responsavel}/>}
                    {inc.competencia_regularizacao && (
                      <Chip label="Competência alvo" valor={
                        `${inc.competencia_regularizacao.slice(4)}/${inc.competencia_regularizacao.slice(0,4)}`
                      }/>
                    )}
                  </Section>
                )}

                {inc.evidencia_resolucao && (
                  <Section title="Evidência de resolução">
                    <p style={{ margin:0, fontSize:13, color:"#166534" }}>{inc.evidencia_resolucao}</p>
                    {inc.link_resolucao && (
                      <a href={inc.link_resolucao} target="_blank" rel="noreferrer"
                        style={{ display:"inline-flex", alignItems:"center", gap:4,
                          fontSize:12, color:"#1d4ed8", marginTop:4 }}>
                        <ExternalLink size={12}/> Ver resolução
                      </a>
                    )}
                  </Section>
                )}

                {/* Atualizar situação */}
                {inc.situacao !== "encerrada" && inc.situacao !== "descartada" && (
                  <Section title="Atualizar situação">
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      <select
                        value={novaSituacao}
                        onChange={e => setNovaSituacao(e.target.value as Situacao)}
                        onClick={e => e.stopPropagation()}
                        style={{ padding:"7px 10px", borderRadius:8, border:"1.5px solid #cbd5e1",
                          fontSize:12, background:"#fff" }}
                      >
                        <option value="identificada">Identificada</option>
                        <option value="em_correcao">Em correção</option>
                        <option value="corrigida">Corrigida</option>
                        <option value="encerrada">Encerrada</option>
                        <option value="descartada">Descartada</option>
                      </select>
                      <textarea
                        placeholder="Evidência de resolução (opcional)"
                        value={evidenciaInput}
                        onChange={e => setEvidenciaInput(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        rows={2}
                        style={{ padding:"7px 10px", borderRadius:8, border:"1.5px solid #cbd5e1",
                          fontSize:12, resize:"vertical" }}
                      />
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onAtualizarSituacao(inc.id, novaSituacao, evidenciaInput || undefined);
                        }}
                        style={{ padding:"7px 14px", borderRadius:8, border:"none",
                          background:"#1d4ed8", color:"#fff", fontSize:12,
                          fontWeight:600, cursor:"pointer" }}
                      >
                        Salvar situação
                      </button>
                    </div>
                  </Section>
                )}

                <div style={{ fontSize:11, color:"#94a3b8", marginTop:12 }}>
                  Criado em {new Date(inc.criado_em).toLocaleString("pt-BR")}
                  {inc.atualizado_em !== inc.criado_em &&
                    ` · Atualizado em ${new Date(inc.atualizado_em).toLocaleString("pt-BR")}`}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase",
        letterSpacing:"0.06em", marginBottom:6 }}>{title}</div>
      {children}
    </div>
  );
}

function Chip({ label, valor }: { label: string; valor: string }) {
  return (
    <div style={{ display:"inline-flex", flexDirection:"column", background:"#f8fafc",
      border:"1px solid #e2e8f0", borderRadius:8, padding:"4px 10px" }}>
      <span style={{ fontSize:9, color:"#94a3b8", fontWeight:700, textTransform:"uppercase",
        letterSpacing:"0.05em" }}>{label}</span>
      <span style={{ fontSize:12, fontWeight:600, color:"#1e293b", fontFamily:"monospace" }}>{valor}</span>
    </div>
  );
}

// ── Aba Cadastros (conteúdo original de Inconsistencias) ──────────────────────

const PROGRAMAS = ["", "CVAT", "Qualidade APS", "CNES/SCNES", "FNS Repasses", "e-SUS PEC", "SIAPS"];
const GRAVIDADES: Array<{ value: string; label: string }> = [
  { value:"", label:"Todas as gravidades" },
  { value:"critica", label:"Crítica" },
  { value:"alta",    label:"Alta" },
  { value:"media",   label:"Média" },
  { value:"baixa",   label:"Baixa" },
];
const SITUACOES: Array<{ value: string; label: string }> = [
  { value:"",             label:"Todas as situações" },
  { value:"identificada", label:"Identificadas" },
  { value:"em_correcao",  label:"Em correção" },
  { value:"corrigida",    label:"Corrigidas" },
  { value:"encerrada",    label:"Encerradas" },
  { value:"descartada",   label:"Descartadas" },
];

function AbaCadastros({ ibge }: { ibge: string }) {
  const qc = useQueryClient();

  const [gravidade, setGravidade] = useState("");
  const [situacao, setSituacao] = useState("");
  const [programa, setPrograma] = useState("");
  const [busca, setBusca] = useState("");

  const { data: resumo, isLoading: loadingResumo } = useQuery<Resumo>({
    queryKey: ["inconsistencias-resumo", ibge],
    queryFn: () => apiGet(`/api/inconsistencias/resumo?municipio_ibge=${ibge}`),
    staleTime: 2 * 60 * 1000,
  });

  const { data: listaData, isLoading: loadingLista, refetch } = useQuery<{
    total: number; inconsistencias: Inconsistencia[];
  }>({
    queryKey: ["inconsistencias-lista", ibge, gravidade, situacao, programa],
    queryFn: () => {
      const p = new URLSearchParams({ municipio_ibge: ibge });
      if (gravidade) p.set("gravidade", gravidade);
      if (situacao)  p.set("situacao",  situacao);
      if (programa)  p.set("programa",  programa);
      return apiGet(`/api/inconsistencias?${p}`);
    },
    staleTime: 60 * 1000,
  });

  const mutAtualizarSituacao = useMutation({
    mutationFn: ({ id, situacao, evidencia }: { id: number; situacao: string; evidencia?: string }) =>
      api.patch(`/api/inconsistencias/${id}/situacao`, {
        situacao,
        evidencia_resolucao: evidencia ?? null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inconsistencias-lista"] });
      qc.invalidateQueries({ queryKey: ["inconsistencias-resumo"] });
    },
  });

  const lista = listaData?.inconsistencias ?? [];
  const listaBusca = busca
    ? lista.filter(i =>
        i.descricao.toLowerCase().includes(busca.toLowerCase()) ||
        i.programa.toLowerCase().includes(busca.toLowerCase()) ||
        (i.equipe_nome ?? "").toLowerCase().includes(busca.toLowerCase()) ||
        (i.cnes ?? "").includes(busca) ||
        (i.ine ?? "").includes(busca)
      )
    : lista;

  const select_style: React.CSSProperties = {
    padding:"7px 10px", borderRadius:9, border:"1.5px solid #e2e8f0",
    fontSize:12, fontWeight:500, color:"#374151", background:"#fff", cursor:"pointer",
  };

  if (!loadingResumo && !resumo) return (
    <NaoDisponivelBanner
      titulo="Inconsistencias indisponivel"
      nota="Dados nao disponiveis — integracao pendente de configuracao no Railway."
    />
  );

  return (
    <div>
      {/* Resumo */}
      {!loadingResumo && resumo && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",
          gap:14, marginBottom:24 }}>
          <ResumoCard label="Total" valor={resumo.total} Icon={FileText} cor="#475569"/>
          <ResumoCard label="Abertas" valor={resumo.abertas}
            sub={`${resumo.por_situacao.identificada ?? 0} identificadas · ${resumo.por_situacao.em_correcao ?? 0} em correção`}
            Icon={AlertTriangle} cor="#f59e0b"/>
          <ResumoCard label="Críticas" valor={resumo.criticas} Icon={AlertOctagon} cor="#dc2626"/>
          <ResumoCard
            label="Risco financeiro"
            valor={resumo.risco_financeiro_total > 0
              ? `R$ ${resumo.risco_financeiro_total.toLocaleString("pt-BR",{minimumFractionDigits:2})}`
              : "—"
            }
            Icon={TrendingDown} cor="#9a3412"
          />
          <ResumoCard label="Encerradas" valor={resumo.por_situacao.encerrada ?? 0} Icon={CheckCircle} cor="#166534"/>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center",
        background:"#fff", padding:"12px 16px", borderRadius:12, border:"1px solid #e2e8f0" }}>
        <Filter size={14} color="#64748b"/>

        <div style={{ position:"relative", flex:"1 1 200px" }}>
          <Search size={13} color="#94a3b8" style={{ position:"absolute", left:10, top:"50%",
            transform:"translateY(-50%)" }}/>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por descrição, CNES, INE, equipe…"
            style={{ ...select_style, paddingLeft:30, width:"100%", boxSizing:"border-box" }}
          />
        </div>

        <select value={gravidade} onChange={e => setGravidade(e.target.value)} style={select_style}>
          {GRAVIDADES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
        </select>

        <select value={situacao} onChange={e => setSituacao(e.target.value)} style={select_style}>
          {SITUACOES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <select value={programa} onChange={e => setPrograma(e.target.value)} style={select_style}>
          {PROGRAMAS.map(p => (
            <option key={p} value={p}>{p || "Todos os programas"}</option>
          ))}
        </select>

        <button onClick={() => refetch()} style={{ ...select_style, display:"flex",
          alignItems:"center", gap:6, border:"1px solid #e2e8f0" }}>
          <RefreshCw size={13}/> Atualizar
        </button>
      </div>

      {/* Tabela */}
      {loadingLista && (
        <div style={{ textAlign:"center", padding:40, color:"#94a3b8" }}>
          <RefreshCw size={24} style={{ animation:"spin 1s linear infinite", marginBottom:10 }}/>
          <div>Carregando inconsistências…</div>
        </div>
      )}

      {!loadingLista && listaBusca.length === 0 && (
        <div style={{ background:"#fff", borderRadius:16, padding:"48px 32px", textAlign:"center",
          border:"1px solid #e2e8f0" }}>
          <CheckCircle size={40} color="#22c55e" style={{ marginBottom:12 }}/>
          <div style={{ fontSize:16, fontWeight:700, color:"#1e293b", marginBottom:8 }}>
            Nenhuma inconsistência encontrada
          </div>
          <div style={{ fontSize:13, color:"#64748b" }}>
            {busca || gravidade || situacao || programa
              ? "Ajuste os filtros para ver mais resultados."
              : "Município sem inconsistências registradas para os filtros selecionados."}
          </div>
        </div>
      )}

      {!loadingLista && listaBusca.length > 0 && (
        <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0",
          boxShadow:"0 1px 4px rgba(0,0,0,.05)", overflowX:"auto" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid #f1f5f9",
            display:"flex", alignItems:"center", gap:8 }}>
            <AlertOctagon size={15} color="#dc2626"/>
            <span style={{ fontSize:14, fontWeight:700, color:"#1e293b" }}>
              {listaBusca.length} inconsistência{listaBusca.length !== 1 ? "s" : ""}
              {listaData?.total && listaData.total > listaBusca.length
                ? ` (de ${listaData.total} total)`
                : ""}
            </span>
          </div>

          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:800 }}>
            <thead>
              <tr>
                {["", "Programa / Componente", "Município", "Gravidade", "Situação",
                  "Descrição", "Risco R$", "Prazo"].map(h => (
                  <th key={h} style={{ padding:"10px 14px", background:"#f8fafc",
                    fontSize:11, fontWeight:700, color:"#475569", textAlign:"left",
                    borderBottom:"1px solid #e2e8f0", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listaBusca.map(inc => (
                <LinhaInconsistencia
                  key={inc.id}
                  inc={inc}
                  onAtualizarSituacao={(id, sit, ev) =>
                    mutAtualizarSituacao.mutate({ id, situacao: sit, evidencia: ev })
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Página principal com abas ─────────────────────────────────────────────────

type TabId = "cadastros" | "scnes" | "cadsus" | "siaps" | "integracoes";

export default function Inconsistencias() {
  const { ibge, setIbge } = useMunicipioSeletor();
  const [activeTab, setActiveTab] = useState<TabId>("cadastros");
  const token = localStorage.getItem("ersus_token") ?? "";

  // Badges: contagens de inconsistências abertas por aba
  const { data: resumoCad } = useQuery<Resumo>({
    queryKey: ["inconsistencias-resumo", ibge],
    queryFn: () => apiGet(`/api/inconsistencias/resumo?municipio_ibge=${ibge}`),
    staleTime: 2 * 60 * 1000,
  });

  const { data: resumoScnes } = useQuery<ScnesResumo>({
    queryKey: ["scnes-resumo", ibge],
    queryFn: () =>
      api.get(`/api/scnes-conformidade/resumo?ibge=${ibge}`,
        { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data),
    staleTime: 120_000,
  });

  const { data: resumoSiaps } = useQuery<SiapsResumo>({
    queryKey: ["siaps-resumo", ibge],
    queryFn: () =>
      api.get(`/api/siaps-monitor/resumo?ibge=${ibge}`,
        { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data),
    staleTime: 60_000,
  });

  const badgeCad   = resumoCad?.abertas ?? null;
  const badgeScnes = resumoScnes?.inconsistencias_abertas ?? null;
  const badgeSiaps = resumoSiaps?.inconsistencias_abertas ?? null;
  // Integrações: 10 gaps, 0 implementados (estático)
  const badgeInteg = 10;

  const totalGeral =
    (badgeCad   ?? 0) +
    (badgeScnes ?? 0) +
    (badgeSiaps ?? 0);

  interface TabDef { id: TabId; label: string; badge: number | null }
  const TABS: TabDef[] = [
    { id: "cadastros",   label: "Cadastros",   badge: badgeCad   },
    { id: "scnes",       label: "SCNES",        badge: badgeScnes },
    { id: "cadsus",      label: "CADSUS",       badge: null       },
    { id: "siaps",       label: "SIAPS",        badge: badgeSiaps },
    { id: "integracoes", label: "Integrações",  badge: badgeInteg },
  ];

  const tabBarStyle: React.CSSProperties = {
    display:"flex", gap:0, borderBottom:"2px solid #e2e8f0",
    marginBottom:24, overflowX:"auto",
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    display:"flex", alignItems:"center", gap:7,
    padding:"10px 20px", fontSize:13, fontWeight: active ? 700 : 500,
    color: active ? "#1d4ed8" : "#64748b",
    background:"transparent", border:"none",
    borderBottom: active ? "3px solid #1d4ed8" : "3px solid transparent",
    marginBottom:"-2px", cursor:"pointer", whiteSpace:"nowrap",
    transition:"color .15s",
  });

  const badgeStyle: React.CSSProperties = {
    fontSize:9, fontWeight:800, background:"#ef4444", color:"#fff",
    padding:"1px 5px", borderRadius:8, marginLeft:2,
  };

  return (
    <div style={{ padding:24, maxWidth:1300, margin:"0 auto" }}>

      {/* Cabeçalho */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
        marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <AlertOctagon size={22} color="#dc2626"/>
            <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:"#1e293b" }}>
              Central de Inconsistências
            </h1>
            {totalGeral > 0 && (
              <span style={{ fontSize:11, fontWeight:800, background:"#dc2626", color:"#fff",
                padding:"2px 10px", borderRadius:12 }}>
                {totalGeral} abertas
              </span>
            )}
          </div>
          <div style={{ fontSize:12, color:"#64748b" }}>
            Cadastros · SCNES · CADSUS · SIAPS · Integrações — ERSUS 360
          </div>
        </div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
          <MunicipioSeletor onChange={(novoIbge) => setIbge(novoIbge)}/>
        </div>
      </div>

      {/* Barra de abas */}
      <div style={tabBarStyle}>
        {TABS.map(t => (
          <button key={t.id} style={tabStyle(activeTab === t.id)}
            onClick={() => setActiveTab(t.id)}>
            {t.label}
            {t.badge != null && t.badge > 0 && (
              <span style={badgeStyle}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Conteúdo das abas */}
      {activeTab === "cadastros"   && <AbaCadastros ibge={ibge}/>}
      {activeTab === "scnes"       && <ConformidadeSCNES/>}
      {activeTab === "cadsus"      && <QualidadeCADSUS/>}
      {activeTab === "siaps"       && <MonitorLotesSIAPS/>}
      {activeTab === "integracoes" && <GapAnalysisAPS/>}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
