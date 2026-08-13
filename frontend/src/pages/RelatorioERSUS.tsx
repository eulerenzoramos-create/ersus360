/**
 * RelatorioERSUS — ERSUS 360
 * Geração e visualização dos Relatórios Executivo e Técnico.
 *
 * - Executivo: resumo para gestor/prefeito/conselho — sem dados brutos
 * - Técnico: proveniência completa, equipes, inconsistências detalhadas
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText, Download, RefreshCw, AlertTriangle, CheckCircle,
  Shield, AlertOctagon, Info, Clock, Users, MapPin,
  Building2, ChevronDown, ChevronRight, ExternalLink,
} from "lucide-react";
import { api } from "../lib/api";
import { useMunicipioSeletor } from "../lib/municipio";
import MunicipioSeletor from "../components/MunicipioSeletor";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type TipoRelatorio = "executivo" | "tecnico";

interface Aviso {
  nivel: "critico" | "atencao" | "info";
  modulo: string;
  mensagem: string;
}

interface RelatorioData {
  tipo: TipoRelatorio;
  classificacao: string;
  publico_alvo: string;
  gerado_em: string;
  municipio: {
    nome: string; uf: string; codigo_ibge: string;
    cnpj_fundo?: string; secretario?: string; populacao?: number;
  };
  competencia: string;
  fontes_configuradas: string[];
  fontes_pendentes: string[];
  cvat: {
    situacao_dado: string;
    fonte?: string;
    total_equipes?: number;
    total_vinculadas?: number;
    total_acompanhadas?: number;
    situacao_k: string;
    situacao_h: string;
    nota_h?: string;
    sem_vinculo_estimado?: number;
    equipes?: unknown[];
  };
  populacao: {
    valor?: number;
    situacao_dado: string;
    fonte: string;
    cobertura_vinculacao_pct?: number;
  };
  cnes: {
    situacao_dado: string;
    total_estabelecimentos: number;
  };
  inconsistencias: {
    total: number; abertas: number; criticas: number; altas: number;
    risco_financeiro_total: number;
    por_situacao: Record<string, number>;
    por_gravidade: Record<string, number>;
    destaques: Array<{
      id: number; programa: string; componente: string;
      gravidade: string; descricao: string; situacao: string;
    }>;
  };
  avisos: Aviso[];
  nota_metodologica?: string;
}

// ── Helpers visuais ───────────────────────────────────────────────────────────

const NIVEL_CFG = {
  critico: { cor: "#991b1b", bg: "#fee2e2", icon: <AlertOctagon size={14}/> },
  atencao: { cor: "#9a3412", bg: "#ffedd5", icon: <AlertTriangle size={14}/> },
  info:    { cor: "#1d4ed8", bg: "#dbeafe", icon: <Info size={14}/> },
};

const SITUACAO_COR: Record<string, string> = {
  oficial_validado: "#166534", oficial_aguardando: "#854d0e",
  divergente: "#9a3412", rejeitado: "#991b1b",
  estimativa_autorizada: "#1d4ed8", dado_nao_validado: "#6b7280",
  nao_disponivel: "#6b7280",
};

const SITUACAO_LABEL: Record<string, string> = {
  oficial_validado:      "Oficial validado",
  oficial_aguardando:    "Aguardando validação",
  divergente:            "Divergente",
  rejeitado:             "Rejeitado",
  estimativa_autorizada: "Estimativa autorizada",
  dado_nao_validado:     "Dado não validado",
  nao_disponivel:        "Não disponível",
};

function Tag({ s }: { s: string }) {
  const cor = SITUACAO_COR[s] ?? "#6b7280";
  return (
    <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:10,
      color:cor, background:`${cor}18`, border:`1px solid ${cor}40` }}>
      {SITUACAO_LABEL[s] ?? s}
    </span>
  );
}

function MetCard({ label, valor, tag, cor="#1e293b", sub }: {
  label: string; valor: string | number | null; tag?: string;
  cor?: string; sub?: string;
}) {
  const semDado = valor === null || valor === undefined;
  return (
    <div style={{ background:"#fff", borderRadius:10, padding:"14px 16px",
      border:"1px solid #e2e8f0", boxShadow:"0 1px 3px rgba(0,0,0,.05)" }}>
      <div style={{ fontSize:11, color:"#64748b", fontWeight:500, marginBottom:4 }}>{label}</div>
      <div style={{ fontSize: semDado ? 13 : 22, fontWeight:700,
        color: semDado ? "#94a3b8" : cor, marginBottom:4 }}>
        {semDado ? "Não disponível" : (typeof valor === "number" ? valor.toLocaleString("pt-BR") : valor)}
      </div>
      {tag && <Tag s={tag}/>}
      {sub && <div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>{sub}</div>}
    </div>
  );
}

// ── Seção com toggle ──────────────────────────────────────────────────────────

function Secao({ titulo, icon, children, defaultAberta = true }: {
  titulo: string; icon: React.ReactNode;
  children: React.ReactNode; defaultAberta?: boolean;
}) {
  const [aberta, setAberta] = useState(defaultAberta);
  return (
    <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0",
      marginBottom:16, boxShadow:"0 1px 3px rgba(0,0,0,.04)" }}>
      <button
        onClick={() => setAberta(!aberta)}
        style={{ width:"100%", display:"flex", alignItems:"center", gap:10,
          padding:"14px 18px", background:"none", border:"none", cursor:"pointer",
          borderBottom: aberta ? "1px solid #f1f5f9" : "none" }}
      >
        {icon}
        <span style={{ flex:1, textAlign:"left", fontSize:14, fontWeight:700, color:"#1e293b" }}>
          {titulo}
        </span>
        {aberta ? <ChevronDown size={14} color="#94a3b8"/> : <ChevronRight size={14} color="#94a3b8"/>}
      </button>
      {aberta && <div style={{ padding:"16px 18px" }}>{children}</div>}
    </div>
  );
}

// ── Corpo do relatório ────────────────────────────────────────────────────────

function CorpoRelatorio({ data, tipo }: { data: RelatorioData; tipo: TipoRelatorio }) {
  const mun = data.municipio;
  const cvat = data.cvat;
  const pop  = data.populacao;
  const inc  = data.inconsistencias;

  return (
    <div id="ersus-relatorio-corpo">

      {/* Cabeçalho do relatório */}
      <div style={{ background:"linear-gradient(135deg,#0f172a,#1e3a5f)", borderRadius:16,
        padding:"24px 28px", marginBottom:20, color:"#fff" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
          flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontSize:11, color:"#94a3b8", fontWeight:600, textTransform:"uppercase",
              letterSpacing:"0.08em", marginBottom:6 }}>
              ERSUS 360 · Relatório {tipo === "executivo" ? "Executivo" : "Técnico"}
            </div>
            <div style={{ fontSize:22, fontWeight:800 }}>{mun.nome} / {mun.uf}</div>
            <div style={{ fontSize:13, color:"#94a3b8", marginTop:4 }}>
              IBGE {mun.codigo_ibge}
              {mun.cnpj_fundo ? ` · CNPJ FMS ${mun.cnpj_fundo}` : ""}
              {mun.secretario ? ` · Sec: ${mun.secretario}` : ""}
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:11, color:"#64748b" }}>Competência</div>
            <div style={{ fontSize:20, fontWeight:800 }}>
              {data.competencia.slice(4)}/{data.competencia.slice(0,4)}
            </div>
            <div style={{ fontSize:11, color:"#64748b", marginTop:4 }}>
              Gerado em {new Date(data.gerado_em).toLocaleString("pt-BR")}
            </div>
          </div>
        </div>
        <div style={{ marginTop:12, fontSize:11, color:"#64748b", fontStyle:"italic" }}>
          {data.publico_alvo}
        </div>
      </div>

      {/* Avisos */}
      {data.avisos.length > 0 && (
        <div style={{ marginBottom:20 }}>
          {data.avisos.map((av, i) => {
            const cfg = NIVEL_CFG[av.nivel];
            return (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10,
                background:cfg.bg, border:`1px solid ${cfg.cor}40`, borderRadius:10,
                padding:"10px 14px", marginBottom:8, color:cfg.cor }}>
                {cfg.icon}
                <div>
                  <strong style={{ fontSize:12 }}>{av.modulo}:</strong>
                  <span style={{ fontSize:12, marginLeft:6 }}>{av.mensagem}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CVAT — Vínculo e Acompanhamento */}
      <Secao titulo="Componente Vínculo e Acompanhamento Territorial" icon={<Users size={16} color="#1d4ed8"/>}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
          <MetCard label="Equipes ESF/EAPS" valor={cvat.total_equipes ?? null} tag="oficial_validado"/>
          <MetCard label="Pessoas vinculadas (K)" valor={cvat.total_vinculadas ?? null}
            tag={cvat.situacao_k} cor="#166534"/>
          <MetCard label="Pessoas acompanhadas (H)"
            valor={cvat.total_acompanhadas && cvat.total_acompanhadas > 0 ? cvat.total_acompanhadas : null}
            tag={cvat.situacao_h} sub={cvat.nota_h ? "Ver nota metodológica" : undefined}/>
          <MetCard label="População IBGE 2022" valor={pop.valor ?? null}
            tag={pop.situacao_dado} cor="#7c3aed"/>
          {pop.cobertura_vinculacao_pct !== undefined && (
            <MetCard label="Cobertura vinculação" valor={`${pop.cobertura_vinculacao_pct}%`}
              tag={cvat.situacao_k} cor="#0369a1"/>
          )}
          {cvat.sem_vinculo_estimado !== undefined && (
            <MetCard label="Sem vínculo (estimado)" valor={cvat.sem_vinculo_estimado}
              tag="estimativa_autorizada" cor="#dc2626"/>
          )}
        </div>
        {cvat.nota_h && (
          <div style={{ marginTop:12, padding:"10px 14px", background:"#f0fdf4",
            borderRadius:8, fontSize:11, color:"#166534" }}>
            <strong>Nota H:</strong> {cvat.nota_h}
          </div>
        )}
        {cvat.situacao_dado === "dado_nao_validado" && (
          <div style={{ marginTop:12, padding:"10px 14px", background:"#f8fafc",
            borderRadius:8, fontSize:12, color:"#475569" }}>
            Dados do SIAPS ainda não disponíveis para este município/competência.
          </div>
        )}
      </Secao>

      {/* Estabelecimentos CNES */}
      <Secao titulo="Rede de Estabelecimentos (CNES/DATASUS)" icon={<Building2 size={16} color="#7c3aed"/>}>
        <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
          <MetCard label="Estabelecimentos UBS" valor={data.cnes.total_estabelecimentos || null}
            tag={data.cnes.situacao_dado}/>
        </div>
      </Secao>

      {/* Inconsistências */}
      <Secao titulo="Inconsistências Identificadas" icon={<AlertOctagon size={16} color="#dc2626"/>}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12, marginBottom:16 }}>
          <MetCard label="Total registradas" valor={inc.total} cor="#475569"/>
          <MetCard label="Em aberto" valor={inc.abertas} cor="#f59e0b"/>
          <MetCard label="Críticas" valor={inc.criticas} cor="#dc2626"/>
          <MetCard label="Altas" valor={inc.altas} cor="#f97316"/>
          <MetCard label="Risco financeiro"
            valor={inc.risco_financeiro_total > 0
              ? `R$ ${inc.risco_financeiro_total.toLocaleString("pt-BR",{minimumFractionDigits:2})}`
              : null}
            cor="#9a3412"/>
        </div>

        {inc.destaques.length > 0 && (
          <>
            <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:8 }}>
              Inconsistências críticas/altas em aberto:
            </div>
            {inc.destaques.map(d => (
              <div key={d.id} style={{ padding:"10px 14px", borderRadius:8, marginBottom:8,
                background: d.gravidade === "critica" ? "#fff7f7" : "#fffbeb",
                border:`1px solid ${d.gravidade === "critica" ? "#fecaca" : "#fde68a"}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:11, fontWeight:700,
                    color: d.gravidade === "critica" ? "#991b1b" : "#9a3412" }}>
                    {d.gravidade.toUpperCase()}
                  </span>
                  <span style={{ fontSize:11, color:"#64748b" }}>{d.programa} · {d.componente}</span>
                </div>
                <div style={{ fontSize:12, color:"#374151" }}>{d.descricao}</div>
              </div>
            ))}
          </>
        )}

        {inc.total === 0 && (
          <div style={{ display:"flex", alignItems:"center", gap:8, color:"#166534",
            padding:"12px 14px", background:"#f0fdf4", borderRadius:8, fontSize:13 }}>
            <CheckCircle size={16}/> Nenhuma inconsistência registrada para este município.
          </div>
        )}
      </Secao>

      {/* Status das fontes */}
      <Secao titulo="Status das Fontes de Dados" icon={<Shield size={16} color="#0369a1"/>} defaultAberta={false}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:10 }}>
          {data.fontes_configuradas.map(f => (
            <div key={f} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px",
              background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, fontSize:12, color:"#166534" }}>
              <CheckCircle size={13}/> <strong>{f.toUpperCase()}</strong>
            </div>
          ))}
          {data.fontes_pendentes.map(f => (
            <div key={f} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px",
              background:"#fafafa", border:"1px solid #e2e8f0", borderRadius:8, fontSize:12, color:"#6b7280" }}>
              <Clock size={13}/> <strong>{f.toUpperCase()}</strong> — sem credenciais
            </div>
          ))}
        </div>
      </Secao>

      {/* Nota metodológica (somente relatório técnico) */}
      {tipo === "tecnico" && data.nota_metodologica && (
        <Secao titulo="Nota Metodológica" icon={<Info size={16} color="#64748b"/>} defaultAberta={false}>
          <p style={{ margin:0, fontSize:13, color:"#475569", lineHeight:1.7 }}>
            {data.nota_metodologica}
          </p>
          <div style={{ marginTop:12 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:8 }}>
              Classificação dos dados (SituacaoDado):
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:8 }}>
              {Object.entries(SITUACAO_LABEL).map(([k, v]) => (
                <div key={k} style={{ display:"flex", alignItems:"center", gap:8, fontSize:11 }}>
                  <Tag s={k}/> <span style={{ color:"#475569" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </Secao>
      )}

      {/* Rodapé */}
      <div style={{ textAlign:"center", fontSize:10, color:"#94a3b8", marginTop:24,
        padding:"12px", borderTop:"1px solid #f1f5f9" }}>
        Relatório gerado pelo ERSUS 360 · Assessoria em Gestão Municipal do SUS ·
        Dados conforme fontes oficiais do Ministério da Saúde · LGPD Lei 13.709/2018
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

const COMPETENCIAS = ["202605","202604","202603","202602","202601","202512","202511","202510"];

export default function RelatorioERSUS() {
  const { ibge, setIbge } = useMunicipioSeletor();
  const [tipo, setTipo] = useState<TipoRelatorio>("executivo");
  const [competencia, setCompetencia] = useState("202605");
  const [gerarClicado, setGerarClicado] = useState(false);

  const token = localStorage.getItem("ersus_token") ?? "";

  const { data, isLoading, isError, refetch } = useQuery<RelatorioData>({
    queryKey: ["relatorio-ersus", ibge, competencia, tipo],
    queryFn: () =>
      api.get(`/api/relatorio-ersus/${ibge}/${tipo}?competencia=${competencia}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.data),
    enabled: gerarClicado,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const btnTipo: React.CSSProperties = (ativo: boolean) => ({
    padding:"9px 20px", borderRadius:9, border:"none", cursor:"pointer",
    fontSize:13, fontWeight:600,
    background: ativo ? "#1d4ed8" : "#f1f5f9",
    color: ativo ? "#fff" : "#374151",
    transition:"all .15s",
  } as any);

  const handleGerar = () => {
    setGerarClicado(true);
    setTimeout(() => refetch(), 50);
  };

  const handleImprimir = () => {
    window.print();
  };

  if (!isLoading && !data) return (
    <div style={{ padding: 24 }}>
      <NaoDisponivelBanner
        titulo="RelatorioERSUS indisponivel"
        nota="Dados nao disponiveis — integracao pendente de configuracao no Railway."
      />
    </div>
  );

  return (
    <div style={{ padding:24, maxWidth:1100, margin:"0 auto" }}>

      {/* CSS de impressão */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #ersus-relatorio-print { display: block !important; }
          @page { margin: 20mm; }
        }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      {/* Controles (não imprimem) */}
      <div className="no-print">
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
          marginBottom:24, flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
              <FileText size={22} color="#1d4ed8"/>
              <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:"#1e293b" }}>
                Relatórios ERSUS 360
              </h1>
            </div>
            <div style={{ fontSize:12, color:"#64748b" }}>
              Relatório Executivo e Técnico · Consolidação de todas as fontes oficiais
            </div>
          </div>
        </div>

        {/* Painel de configuração */}
        <div style={{ background:"#fff", borderRadius:14, padding:"20px 24px",
          border:"1px solid #e2e8f0", marginBottom:24, boxShadow:"0 1px 4px rgba(0,0,0,.05)" }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#374151", marginBottom:14 }}>
            Configurar relatório
          </div>

          <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"flex-end" }}>
            {/* Tipo */}
            <div>
              <div style={{ fontSize:11, color:"#64748b", fontWeight:600, marginBottom:6 }}>
                Tipo de relatório
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button style={btnTipo(tipo === "executivo")} onClick={() => setTipo("executivo")}>
                  Executivo
                </button>
                <button style={btnTipo(tipo === "tecnico")} onClick={() => setTipo("tecnico")}>
                  Técnico
                </button>
              </div>
            </div>

            {/* Município */}
            <div>
              <div style={{ fontSize:11, color:"#64748b", fontWeight:600, marginBottom:6 }}>
                Município
              </div>
              <MunicipioSeletor onChange={(novoIbge) => { setIbge(novoIbge); setGerarClicado(false); }}/>
            </div>

            {/* Competência */}
            <div>
              <div style={{ fontSize:11, color:"#64748b", fontWeight:600, marginBottom:6 }}>
                Competência
              </div>
              <select value={competencia} onChange={e => { setCompetencia(e.target.value); setGerarClicado(false); }}
                style={{ padding:"8px 12px", borderRadius:9, border:"1.5px solid #e2e8f0",
                  fontSize:13, fontWeight:600, background:"#fff" }}>
                {COMPETENCIAS.map(c => (
                  <option key={c} value={c}>{c.slice(4)}/{c.slice(0,4)}</option>
                ))}
              </select>
            </div>

            {/* Botão gerar */}
            <button
              onClick={handleGerar}
              disabled={isLoading}
              style={{ padding:"9px 22px", borderRadius:9, border:"none",
                background: isLoading ? "#94a3b8" : "#1d4ed8", color:"#fff",
                fontSize:13, fontWeight:700, cursor: isLoading ? "default" : "pointer" }}>
              {isLoading ? "Gerando…" : "Gerar relatório"}
            </button>

            {data && (
              <button onClick={handleImprimir}
                style={{ padding:"9px 16px", borderRadius:9, border:"1.5px solid #e2e8f0",
                  background:"#fff", fontSize:13, fontWeight:600, cursor:"pointer",
                  display:"flex", alignItems:"center", gap:6, color:"#374151" }}>
                <Download size={14}/> Exportar PDF
              </button>
            )}
          </div>

          {/* Descrição do tipo */}
          <div style={{ marginTop:12, padding:"10px 14px", background:"#f8fafc",
            borderRadius:8, fontSize:12, color:"#475569" }}>
            {tipo === "executivo"
              ? "Relatório Executivo: resumo das métricas principais, avisos críticos e status das fontes. Para secretário, prefeito e conselho municipal."
              : "Relatório Técnico: dados completos com proveniência, equipes, inconsistências detalhadas e nota metodológica. Para assessoria e auditoria."
            }
          </div>
        </div>

        {/* Estado inicial */}
        {!gerarClicado && !isLoading && (
          <div style={{ background:"#fff", borderRadius:16, padding:"48px 32px",
            border:"1px solid #e2e8f0", textAlign:"center" }}>
            <FileText size={40} color="#cbd5e1" style={{ marginBottom:12 }}/>
            <div style={{ fontSize:16, fontWeight:700, color:"#1e293b", marginBottom:8 }}>
              Configure e gere o relatório
            </div>
            <div style={{ fontSize:13, color:"#64748b" }}>
              Escolha o tipo, município e competência acima e clique em "Gerar relatório".
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div style={{ textAlign:"center", padding:60, color:"#94a3b8" }}>
            <RefreshCw size={28} style={{ animation:"spin 1s linear infinite", marginBottom:12 }}/>
            <div style={{ fontSize:14 }}>Consolidando dados de todas as fontes…</div>
            <div style={{ fontSize:12, marginTop:4 }}>SIAPS · IBGE · CNES · Inconsistências</div>
          </div>
        )}

        {/* Erro */}
        {isError && !isLoading && (
          <div style={{ background:"#fff7f7", border:"1px solid #fecaca", borderRadius:12,
            padding:24, textAlign:"center" }}>
            <AlertTriangle size={24} color="#dc2626" style={{ marginBottom:8 }}/>
            <div style={{ fontSize:14, color:"#dc2626", fontWeight:600 }}>Erro ao gerar relatório</div>
            <div style={{ fontSize:12, color:"#64748b", marginTop:4 }}>
              Verifique se o backend está disponível e as credenciais configuradas.
            </div>
          </div>
        )}
      </div>

      {/* Relatório renderizado */}
      {data && !isLoading && (
        <div id="ersus-relatorio-print">
          <CorpoRelatorio data={data} tipo={tipo}/>
        </div>
      )}
    </div>
  );
}
