/**
 * ConformidadeSCNES — ERSUS 360
 * Conformidade Cadastral SCNES — equipes ESF, estabelecimentos, alertas.
 *
 * Dados reais: CNES/DATASUS + tabela inconsistencias.
 * situacao_dado classifica cada campo — nenhum valor é simulado.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2, RefreshCw, AlertTriangle, CheckCircle, XCircle,
  ChevronDown, ChevronRight, Users, Info, AlertOctagon,
  Shield, Database, ArrowRightLeft,
} from "lucide-react";
import { api } from "../lib/api";
import { useMunicipioSeletor } from "../lib/municipio";
import MunicipioSeletor from "../components/MunicipioSeletor";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Dimensao {
  label: string; situacao_dado: string;
  valor: string | number | boolean | null; observacao: string;
}

interface EquipeItem {
  ine: string | null; nome: string; cnes_ubs: string;
  municipio: string; uf: string; ativo: boolean; rejeicao_cnes: boolean;
  situacao_geral: string;
  dimensoes: Record<string, Dimensao>;
  pendencias_abertas: number;
  pendencias_detalhe: Array<{
    id: number; componente: string; gravidade: string; descricao: string; situacao: string;
  }>;
  fonte: string; verificado_em: string;
}

interface Resumo {
  ibge: string; municipio: string; uf: string; situacao_geral: string;
  estabelecimentos: { total: number; situacao_dado: string; fonte: string };
  equipes_esf: {
    total: number; com_ine: number; sem_ine: number;
    ativas: number; com_rejeicao: number; situacao_dado: string; nota: string;
  };
  inconsistencias_abertas: number;
  total_inconsistencias: number;
  verificado_em: string;
}

interface Alertas {
  total: number; criticos: number; altos: number; medios: number;
  situacao_dado: string; alertas: Array<{
    id: number; componente: string; gravidade: string; descricao: string; situacao: string;
  }>;
}

interface SyncStatus {
  situacao_dado: string; ultima_sync: string;
  total_estabelecimentos: number; total_equipes: number;
  equipes_com_ine: number; equipes_sem_ine: number; nota: string;
}

// ── Helpers visuais ───────────────────────────────────────────────────────────

const SIT_COR: Record<string, string> = {
  oficial_validado:      "#166534",
  oficial_aguardando:    "#854d0e",
  divergente:            "#991b1b",
  dado_nao_validado:     "#6b7280",
  nao_disponivel:        "#94a3b8",
};
const SIT_LABEL: Record<string, string> = {
  oficial_validado:   "Oficial validado",
  oficial_aguardando: "Aguardando",
  divergente:         "Divergente",
  dado_nao_validado:  "Não validado",
  nao_disponivel:     "Não disponível",
};

function Tag({ s }: { s: string }) {
  const cor = SIT_COR[s] ?? "#6b7280";
  return (
    <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10,
      color:cor, background:`${cor}15`, border:`1px solid ${cor}30` }}>
      {SIT_LABEL[s] ?? s}
    </span>
  );
}

function GravBadge({ g }: { g: string }) {
  const m: Record<string, [string, string]> = {
    critica: ["#dc2626","Crítica"], alta: ["#d97706","Alta"],
    media: ["#1d4ed8","Média"], baixa: ["#6b7280","Baixa"],
  };
  const [cor, label] = m[g] ?? ["#6b7280", g];
  return (
    <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:10,
      color:cor, background:`${cor}15`, border:`1px solid ${cor}30` }}>
      {label}
    </span>
  );
}

function Bool({ v }: { v: boolean | null | undefined }) {
  if (v == null) return <span style={{ color:"#94a3b8" }}>—</span>;
  return v ? <CheckCircle size={13} color="#166534"/> : <XCircle size={13} color="#dc2626"/>;
}

function KPI({ label, val, sub, cor }: { label: string; val: string | number; sub?: string; cor?: string }) {
  return (
    <div style={{ background:"rgba(255,255,255,.12)", borderRadius:10, padding:"12px 16px", textAlign:"center" }}>
      <div style={{ fontSize:22, fontWeight:900, color:cor ?? "#fff" }}>{val}</div>
      <div style={{ fontSize:11, color:"rgba(255,255,255,.7)", marginTop:2 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:"rgba(255,255,255,.45)" }}>{sub}</div>}
    </div>
  );
}

// ── Card de equipe ────────────────────────────────────────────────────────────

function CardEquipe({ e }: { e: EquipeItem }) {
  const [aberto, setAberto] = useState(e.situacao_geral !== "oficial_validado");
  const cor = SIT_COR[e.situacao_geral] ?? "#6b7280";

  return (
    <div style={{ background:"#fff", borderRadius:12, border:`1px solid ${cor}25`,
      borderLeft:`4px solid ${cor}`, marginBottom:10, overflow:"hidden" }}>

      <button onClick={() => setAberto(o => !o)}
        style={{ width:"100%", display:"flex", alignItems:"center", gap:14,
          padding:"14px 18px", background:"none", border:"none", cursor:"pointer",
          textAlign:"left" }}>

        <Users size={18} color={cor} style={{ flexShrink:0 }}/>

        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#1e293b", marginBottom:3 }}>
            {e.nome}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" as const }}>
            <Tag s={e.situacao_geral}/>
            {e.ine
              ? <span style={{ fontSize:11, fontFamily:"monospace", color:"#1d4ed8",
                  background:"#eff6ff", padding:"1px 6px", borderRadius:4 }}>
                  INE {e.ine}
                </span>
              : <span style={{ fontSize:11, color:"#dc2626", fontWeight:600 }}>
                  INE pendente
                </span>
            }
            {e.rejeicao_cnes && (
              <span style={{ fontSize:10, color:"#dc2626", fontWeight:700,
                background:"#fef2f2", padding:"2px 7px", borderRadius:10,
                border:"1px solid #fecaca" }}>
                Rejeição ESF
              </span>
            )}
          </div>
        </div>

        <div style={{ textAlign:"right", fontSize:11, color:"#94a3b8", flexShrink:0 }}>
          <div>CNES {e.cnes_ubs || "—"}</div>
          {e.pendencias_abertas > 0 && (
            <div style={{ color:"#dc2626", fontWeight:700, marginTop:2 }}>
              {e.pendencias_abertas} pendência(s)
            </div>
          )}
        </div>

        {aberto
          ? <ChevronDown size={13} color="#94a3b8"/>
          : <ChevronRight size={13} color="#94a3b8"/>
        }
      </button>

      {aberto && (
        <div style={{ borderTop:`1px solid ${cor}15`, padding:"14px 18px", background:"#fafafa" }}>

          {/* Dimensões */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:8 }}>
              Dimensões de Conformidade
            </div>
            <div style={{ display:"grid", gap:6 }}>
              {Object.entries(e.dimensoes).map(([k, d]) => (
                <div key={k} style={{ display:"flex", alignItems:"flex-start",
                  justifyContent:"space-between", fontSize:12,
                  padding:"6px 10px", background:"#fff", borderRadius:8,
                  border:"1px solid #f1f5f9" }}>
                  <div>
                    <div style={{ color:"#374151", fontWeight:600 }}>{d.label}</div>
                    {d.observacao && (
                      <div style={{ color:"#64748b", fontSize:11, marginTop:2 }}>
                        {d.observacao}
                      </div>
                    )}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0, marginLeft:12 }}>
                    {typeof d.valor === "boolean"
                      ? <Bool v={d.valor}/>
                      : <span style={{ fontFamily:"monospace", fontSize:11, color:"#1e293b" }}>
                          {d.valor ?? "—"}
                        </span>
                    }
                    <Tag s={d.situacao_dado}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pendências */}
          {e.pendencias_detalhe.length > 0 && (
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"#dc2626", marginBottom:8 }}>
                Pendências Abertas ({e.pendencias_detalhe.length})
              </div>
              {e.pendencias_detalhe.map((p, i) => (
                <div key={i} style={{ padding:"8px 12px", marginBottom:6,
                  background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <GravBadge g={p.gravidade}/>
                    <span style={{ fontSize:12, fontWeight:600, color:"#374151" }}>
                      {p.componente}
                    </span>
                  </div>
                  <div style={{ fontSize:11, color:"#64748b" }}>{p.descricao}</div>
                </div>
              ))}
            </div>
          )}

          {e.pendencias_abertas === 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:8,
              color:"#166534", fontSize:12, fontWeight:600 }}>
              <CheckCircle size={13}/> Sem pendências abertas registradas
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Painel de alertas ─────────────────────────────────────────────────────────

function PainelAlertas({ ibge, token }: { ibge: string; token: string }) {
  const { data } = useQuery<Alertas>({
    queryKey: ["scnes-alertas", ibge],
    queryFn: () =>
      api.get(`/api/scnes-conformidade/alertas-cnes?ibge=${ibge}`,
        { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data),
    staleTime: 120_000,
  });

  if (!data) return <NaoDisponivelBanner nota="Dados n�o dispon�veis no momento. Integra��o pendente de configura��o no Railway." />;
  if (data.situacao_dado === "nao_disponivel" || data.total === 0) {
    return (
      <div style={{ padding:"12px 16px", background:"#f0fdf4",
        border:"1px solid #bbf7d0", borderRadius:10, marginBottom:16,
        fontSize:12, color:"#166534", display:"flex", alignItems:"center", gap:8 }}>
        <CheckCircle size={14}/> Nenhum alerta SCNES aberto registrado no banco.
      </div>
    );
  }

  return (
    <div style={{ background:"#fff", borderRadius:12, border:"1px solid #fecaca",
      padding:"16px 18px", marginBottom:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <AlertOctagon size={16} color="#dc2626"/>
        <span style={{ fontSize:14, fontWeight:700, color:"#dc2626" }}>
          {data.total} Alerta(s) SCNES — {data.criticos} crítico(s)
        </span>
      </div>
      {data.alertas.slice(0, 5).map((a, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:10,
          padding:"6px 10px", borderRadius:8, background:"#fef2f2",
          border:"1px solid #fecaca", marginBottom:6, fontSize:12 }}>
          <GravBadge g={a.gravidade}/>
          <span style={{ color:"#374151", flex:1 }}>{a.descricao}</span>
        </div>
      ))}
    </div>
  );
}

// ── Painel sincronização ──────────────────────────────────────────────────────

function PainelSync({ ibge, token }: { ibge: string; token: string }) {
  const qc = useQueryClient();
  const { data } = useQuery<SyncStatus>({
    queryKey: ["scnes-sync", ibge],
    queryFn: () =>
      api.get(`/api/scnes-conformidade/sincronizacao`,
        { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data),
    staleTime: 60_000,
  });

  const sync = useMutation({
    mutationFn: () =>
      api.post(`/api/scnes-conformidade/sincronizar`, {},
        { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scnes-sync"] });
      qc.invalidateQueries({ queryKey: ["scnes-equipes"] });
      qc.invalidateQueries({ queryKey: ["scnes-resumo"] });
    },
  });

  return (
    <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0",
      padding:"16px 18px", marginBottom:16 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Database size={15} color="#1d4ed8"/>
          <span style={{ fontSize:14, fontWeight:700, color:"#1e293b" }}>
            Sincronização CNES / DATASUS
          </span>
        </div>
        <button onClick={() => sync.mutate()} disabled={sync.isPending}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px",
            borderRadius:8, border:"1.5px solid #1d4ed8", background:"#eff6ff",
            color:"#1d4ed8", fontSize:12, fontWeight:600, cursor:"pointer" }}>
          <RefreshCw size={12} style={{ animation: sync.isPending ? "spin 1s linear infinite" : "none" }}/>
          Sincronizar agora
        </button>
      </div>
      {data && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:8 }}>
          {[
            { label:"Estabelecimentos", val:data.total_estabelecimentos },
            { label:"Equipes ESF", val:data.total_equipes },
            { label:"Com INE", val:data.equipes_com_ine },
            { label:"Sem INE", val:data.equipes_sem_ine },
          ].map(k => (
            <div key={k.label} style={{ textAlign:"center", padding:"8px 12px",
              background:"#f8fafc", borderRadius:8 }}>
              <div style={{ fontSize:18, fontWeight:700, color:"#1e293b" }}>{k.val}</div>
              <div style={{ fontSize:11, color:"#64748b" }}>{k.label}</div>
            </div>
          ))}
        </div>
      )}
      {data?.nota && (
        <div style={{ marginTop:10, fontSize:11, color:"#64748b" }}>
          {data.nota}
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function ConformidadeSCNES() {
  const { ibge, setIbge } = useMunicipioSeletor();
  const token = localStorage.getItem("ersus_token") ?? "";

  const { data: resumo, isLoading: loadR, refetch } = useQuery<Resumo>({
    queryKey: ["scnes-resumo", ibge],
    queryFn: () =>
      api.get(`/api/scnes-conformidade/resumo?ibge=${ibge}`,
        { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data),
    staleTime: 120_000,
  });

  const { data: equipes = [], isLoading: loadE } = useQuery<EquipeItem[]>({
    queryKey: ["scnes-equipes", ibge],
    queryFn: () =>
      api.get(`/api/scnes-conformidade/equipes?ibge=${ibge}`,
        { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data),
    staleTime: 120_000,
  });

  const isLoading = loadR || loadE;

  return (
    <div style={{ padding:24, maxWidth:960, margin:"0 auto" }}>

      {/* Cabeçalho */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
        marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <Shield size={22} color="#1d4ed8"/>
            <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:"#1e293b" }}>
              Conformidade SCNES
            </h1>
          </div>
          <div style={{ fontSize:12, color:"#64748b" }}>
            Equipes ESF · INEs · Estabelecimentos · Pendências — Fonte: CNES/DATASUS
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" as const }}>
          <MunicipioSeletor onChange={setIbge}/>
          <button onClick={() => refetch()}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px",
              borderRadius:9, border:"1.5px solid #e2e8f0", background:"#fff",
              fontSize:12, fontWeight:600, cursor:"pointer", color:"#374151" }}>
            <RefreshCw size={13} style={{ animation: isLoading ? "spin 1s linear infinite" : "none" }}/>
            Atualizar
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      {/* Resumo */}
      {resumo && (
        <div style={{ background:"linear-gradient(135deg,#1e3a5f,#1d4ed8)",
          borderRadius:14, padding:"20px 24px", marginBottom:20, color:"#fff" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            marginBottom:16, flexWrap:"wrap", gap:8 }}>
            <div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.6)", textTransform:"uppercase",
                letterSpacing:"0.08em", marginBottom:4 }}>Situação geral</div>
              <div style={{ fontSize:18, fontWeight:800 }}>
                {resumo.municipio} / {resumo.uf}
              </div>
            </div>
            <Tag s={resumo.situacao_geral}/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10 }}>
            <KPI label="Estabelecimentos" val={resumo.estabelecimentos.total}/>
            <KPI label="Equipes ESF" val={resumo.equipes_esf.total}/>
            <KPI label="Com INE" val={resumo.equipes_esf.com_ine}
              cor={resumo.equipes_esf.com_ine === resumo.equipes_esf.total ? "#86efac" : "#fde68a"}/>
            <KPI label="Com Rejeição" val={resumo.equipes_esf.com_rejeicao}
              cor={resumo.equipes_esf.com_rejeicao > 0 ? "#fca5a5" : "#86efac"}/>
            <KPI label="Inconsistências" val={resumo.inconsistencias_abertas}
              cor={resumo.inconsistencias_abertas > 0 ? "#fca5a5" : "#86efac"}/>
          </div>
          {resumo.equipes_esf.nota && (
            <div style={{ marginTop:12, fontSize:11, color:"rgba(255,255,255,.6)" }}>
              {resumo.equipes_esf.nota}
            </div>
          )}
        </div>
      )}

      {/* Alertas */}
      <PainelAlertas ibge={ibge} token={token}/>

      {/* Sincronização */}
      <PainelSync ibge={ibge} token={token}/>

      {/* Equipes */}
      {isLoading && (
        <div style={{ textAlign:"center", padding:40, color:"#94a3b8" }}>
          <RefreshCw size={24} style={{ animation:"spin 1s linear infinite" }}/>
          <div style={{ marginTop:8, fontSize:13 }}>Carregando dados do CNES/DATASUS…</div>
        </div>
      )}

      {!isLoading && equipes.length > 0 && (
        <>
          <div style={{ fontSize:13, fontWeight:700, color:"#374151", marginBottom:12 }}>
            Equipes ESF — {equipes.length} registradas
          </div>
          {equipes.map((e, i) => <CardEquipe key={e.ine ?? i} e={e}/>)}
        </>
      )}

      {/* Nota de fonte */}
      <div style={{ marginTop:16, padding:"12px 16px", background:"#f8fafc",
        border:"1px solid #e2e8f0", borderRadius:10, fontSize:11, color:"#94a3b8" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
          <Info size={12}/> <strong>Fonte e classificação</strong>
        </div>
        Dados de estabelecimentos e equipes obtidos em tempo real via CNES/DATASUS
        (API pública — sem credenciais). INEs via e-Gestor APS (requer EGESTOR_TOKEN no Railway).
        Inconsistências consultadas no banco ERSUS 360.
        Todos os campos classificados com SituacaoDado — nenhum valor é simulado.
      </div>
    </div>
  );
}
