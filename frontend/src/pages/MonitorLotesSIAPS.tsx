/**
 * MonitorLotesSIAPS — ERSUS 360
 * Monitor de Status SIAPS por Competência
 *
 * Dados reais da API SIAPS (gov.br) + histórico da tabela de extrações.
 * Nunca exibe dados simulados — campos sem dado real mostram situacao_dado.
 */
import { useQuery } from "@tanstack/react-query";
import {
  Package, RefreshCw, CheckCircle, XCircle, AlertTriangle,
  Clock, Wifi, WifiOff, AlertOctagon, ChevronDown, ChevronRight,
  Database, Info, Activity,
} from "lucide-react";
import { useState } from "react";
import { api } from "../lib/api";
import { useMunicipioSeletor } from "../lib/municipio";
import MunicipioSeletor from "../components/MunicipioSeletor";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Resumo {
  ibge: string; competencia_atual: string; competencia_codigo: string;
  status_conexao: "online" | "degradado" | "sem_credenciais";
  competencias_monitoradas: number; competencias_com_dados: number;
  inconsistencias_abertas: number;
  ultima_extracao: { realizada_em: string; sucesso: boolean; metodo: string } | null;
  total_extracoes_historico: number;
  situacao_dado_atual: string;
  vinculadas_atual: number | null;
  acompanhadas_atual: number | null;
  verificado_em: string;
}

interface CompetenciaItem {
  competencia: string; competencia_fmt: string;
  situacao_dado: string; fonte: string; tem_dado_real: boolean;
  total_vinculadas: number | null;
  total_acompanhadas: number | null;
  total_equipes: number | null;
  situacao_k?: string; situacao_h?: string;
  nota: string;
  extracao_historico: { realizada_em: string; sucesso: boolean } | null;
}

// ── Helpers visuais ───────────────────────────────────────────────────────────

const SITUACAO_COR: Record<string, string> = {
  oficial_validado:      "#166534",
  oficial_aguardando:    "#854d0e",
  divergente:            "#9a3412",
  rejeitado:             "#991b1b",
  estimativa_autorizada: "#1d4ed8",
  dado_nao_validado:     "#6b7280",
  nao_disponivel:        "#94a3b8",
  sem_dado:              "#94a3b8",
};

const SITUACAO_LABEL: Record<string, string> = {
  oficial_validado:      "Oficial validado",
  oficial_aguardando:    "Aguardando validação",
  divergente:            "Divergente",
  rejeitado:             "Rejeitado",
  estimativa_autorizada: "Estimativa autorizada",
  dado_nao_validado:     "Não validado",
  nao_disponivel:        "Não disponível",
  sem_dado:              "Sem dado",
};

function Tag({ s }: { s: string }) {
  const cor = SITUACAO_COR[s] ?? "#6b7280";
  return (
    <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:10,
      color:cor, background:`${cor}15`, border:`1px solid ${cor}40` }}>
      {SITUACAO_LABEL[s] ?? s}
    </span>
  );
}

function Num({ v, cor }: { v: number | null | undefined; cor?: string }) {
  if (v == null) return <span style={{ color:"#94a3b8", fontSize:11 }}>—</span>;
  return (
    <span style={{ fontWeight:700, color:cor || "#1e293b", fontVariantNumeric:"tabular-nums" }}>
      {v.toLocaleString("pt-BR")}
    </span>
  );
}

// ── Card por competência ──────────────────────────────────────────────────────

function CardComp({ c }: { c: CompetenciaItem }) {
  const [aberto, setAberto] = useState(false);
  const corSit = SITUACAO_COR[c.situacao_dado] ?? "#6b7280";
  const isOk = c.tem_dado_real;

  return (
    <div style={{ background:"#fff", border:`1px solid ${corSit}30`,
      borderLeft:`4px solid ${corSit}`, borderRadius:10,
      overflow:"hidden", marginBottom:8 }}>

      <button onClick={() => setAberto(o => !o)}
        style={{ width:"100%", display:"flex", alignItems:"center", gap:14,
          padding:"13px 16px", background:"none", border:"none", cursor:"pointer",
          textAlign:"left" }}>

        {/* Competência */}
        <div style={{ minWidth:80 }}>
          <div style={{ fontSize:15, fontWeight:800, color:"#1e293b" }}>
            {c.competencia_fmt}
          </div>
          <div style={{ fontSize:10, color:"#94a3b8", fontFamily:"monospace" }}>
            {c.competencia}
          </div>
        </div>

        {/* Tag situação */}
        <Tag s={c.situacao_dado}/>

        {/* Métricas */}
        <div style={{ flex:1, display:"flex", gap:24, alignItems:"center" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#1d4ed8" }}>
              <Num v={c.total_equipes}/>
            </div>
            <div style={{ fontSize:9, color:"#94a3b8" }}>equipes</div>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#166534" }}>
              <Num v={c.total_vinculadas}/>
            </div>
            <div style={{ fontSize:9, color:"#94a3b8" }}>vinculadas (K)</div>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:14, fontWeight:700,
              color: c.total_acompanhadas ? "#0369a1" : "#94a3b8" }}>
              <Num v={c.total_acompanhadas}/>
            </div>
            <div style={{ fontSize:9, color:"#94a3b8" }}>acompanhadas (H)</div>
          </div>
        </div>

        {/* Fonte e última extração */}
        <div style={{ textAlign:"right", fontSize:10, color:"#94a3b8" }}>
          <div style={{ fontFamily:"monospace" }}>{c.fonte}</div>
          {c.extracao_historico && (
            <div style={{ marginTop:2 }}>
              {c.extracao_historico.sucesso
                ? <CheckCircle size={10} color="#166534" style={{ verticalAlign:"middle", marginRight:3 }}/>
                : <XCircle size={10} color="#dc2626" style={{ verticalAlign:"middle", marginRight:3 }}/>
              }
              {new Date(c.extracao_historico.realizada_em).toLocaleDateString("pt-BR")}
            </div>
          )}
        </div>

        {aberto
          ? <ChevronDown size={13} color="#94a3b8"/>
          : <ChevronRight size={13} color="#94a3b8"/>
        }
      </button>

      {aberto && (
        <div style={{ borderTop:`1px solid ${corSit}20`, padding:"12px 16px",
          background:"#fafafa" }}>
          <div style={{ fontSize:12, color:"#475569", marginBottom:8 }}>
            {c.nota || "Sem nota disponível."}
          </div>
          {c.situacao_k && (
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" as const }}>
              <div>
                <span style={{ fontSize:11, color:"#64748b" }}>Campo K: </span>
                <Tag s={c.situacao_k}/>
              </div>
              {c.situacao_h && (
                <div>
                  <span style={{ fontSize:11, color:"#64748b" }}>Campo H: </span>
                  <Tag s={c.situacao_h}/>
                </div>
              )}
            </div>
          )}
          {!c.tem_dado_real && (
            <div style={{ marginTop:10, padding:"8px 12px", background:"#fff7ed",
              border:"1px solid #fed7aa", borderRadius:8, fontSize:11, color:"#9a3412" }}>
              <AlertTriangle size={11} style={{ verticalAlign:"middle", marginRight:4 }}/>
              Configure <code>SIAPS_CPF</code> e <code>SIAPS_SENHA</code> no Railway para
              obter dados reais desta competência.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Status da conexão ─────────────────────────────────────────────────────────

function StatusConexao({ s }: { s: string }) {
  const cfg: Record<string, { cor: string; label: string; icon: React.ReactNode }> = {
    online:           { cor:"#16a34a", label:"Online",           icon:<Wifi size={13}/> },
    degradado:        { cor:"#d97706", label:"Degradado",        icon:<Activity size={13}/> },
    sem_credenciais:  { cor:"#dc2626", label:"Sem credenciais",  icon:<WifiOff size={13}/> },
  };
  const c = cfg[s] ?? { cor:"#6b7280", label:s, icon:<Info size={13}/> };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11,
      fontWeight:700, padding:"3px 10px", borderRadius:10,
      color:c.cor, background:`${c.cor}15`, border:`1px solid ${c.cor}40` }}>
      {c.icon} {c.label}
    </span>
  );
}

// ── Barra de progresso de cobertura ──────────────────────────────────────────

function BarraCobertura({ ok, total }: { ok: number; total: number }) {
  const pct = total > 0 ? Math.round(ok / total * 100) : 0;
  const cor = pct === 100 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626";
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11,
        color:"#64748b", marginBottom:3 }}>
        <span>{ok} de {total} competências com dados</span>
        <span style={{ fontWeight:700, color:cor }}>{pct}%</span>
      </div>
      <div style={{ height:6, background:"#f1f5f9", borderRadius:4, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:cor,
          borderRadius:4, transition:"width .5s" }}/>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function MonitorLotesSIAPS() {
  const { ibge, setIbge } = useMunicipioSeletor();
  const token = localStorage.getItem("ersus_token") ?? "";

  const { data: resumo, isLoading: loadR, refetch } = useQuery<Resumo>({
    queryKey: ["siaps-resumo", ibge],
    queryFn: () =>
      api.get(`/api/siaps-monitor/resumo?ibge=${ibge}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.data),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });

  const { data: competencias = [], isLoading: loadC } = useQuery<CompetenciaItem[]>({
    queryKey: ["siaps-competencias", ibge],
    queryFn: () =>
      api.get(`/api/siaps-monitor/competencias?ibge=${ibge}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.data),
    staleTime: 60_000,
  });

  const isLoading = loadR || loadC;

  return (
    <div style={{ padding:24, maxWidth:960, margin:"0 auto" }}>

      {/* Cabeçalho */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
        marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <Package size={22} color="#d97706"/>
            <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:"#1e293b" }}>
              Monitor SIAPS — Componente Vínculo
            </h1>
          </div>
          <div style={{ fontSize:12, color:"#64748b" }}>
            Status por competência · Campo K (vinculadas) · Campo H (acompanhadas) · Fonte: API SIAPS gov.br
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

      {/* Painel de resumo */}
      {resumo && (
        <div style={{ background:"linear-gradient(135deg,#78350f,#b45309)", borderRadius:14,
          padding:"20px 24px", marginBottom:20, color:"#fff" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            marginBottom:14, flexWrap:"wrap", gap:8 }}>
            <div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.6)", marginBottom:4,
                textTransform:"uppercase", letterSpacing:"0.08em" }}>
                Competência atual
              </div>
              <div style={{ fontSize:20, fontWeight:800 }}>{resumo.competencia_atual}</div>
            </div>
            <StatusConexao s={resumo.status_conexao}/>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:10, marginBottom:16 }}>
            {[
              { label:"Vinculadas (K)",   val: resumo.vinculadas_atual?.toLocaleString("pt-BR") ?? "—", cor:"#fde68a" },
              { label:"Acompanhadas (H)", val: resumo.acompanhadas_atual?.toLocaleString("pt-BR") ?? "—", cor:"#a5f3fc" },
              { label:"Inconsistências",  val: String(resumo.inconsistencias_abertas), cor: resumo.inconsistencias_abertas > 0 ? "#fca5a5" : "#86efac" },
              { label:"Extrações hist.",  val: String(resumo.total_extracoes_historico), cor:"#fff" },
            ].map(k => (
              <div key={k.label} style={{ background:"rgba(255,255,255,.12)",
                borderRadius:8, padding:"10px 14px", textAlign:"center" }}>
                <div style={{ fontSize:20, fontWeight:900, color:k.cor }}>{k.val}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,.6)" }}>{k.label}</div>
              </div>
            ))}
          </div>

          <BarraCobertura ok={resumo.competencias_com_dados} total={resumo.competencias_monitoradas}/>

          {resumo.ultima_extracao && (
            <div style={{ marginTop:10, fontSize:11, color:"rgba(255,255,255,.5)" }}>
              Última extração: {new Date(resumo.ultima_extracao.realizada_em).toLocaleString("pt-BR")}
              {" · "}{resumo.ultima_extracao.sucesso ? "✓ Sucesso" : "✗ Falha"}
              {" · método: "}{resumo.ultima_extracao.metodo}
            </div>
          )}
        </div>
      )}

      {/* Alerta sem credenciais */}
      {resumo?.status_conexao === "sem_credenciais" && (
        <div style={{ background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:12,
          padding:"14px 18px", marginBottom:20, display:"flex", gap:12, alignItems:"flex-start" }}>
          <AlertOctagon size={18} color="#d97706" style={{ flexShrink:0, marginTop:1 }}/>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#9a3412", marginBottom:4 }}>
              Credenciais SIAPS não configuradas
            </div>
            <div style={{ fontSize:12, color:"#9a3412" }}>
              Configure as variáveis <code style={{ background:"#fef9c3", padding:"1px 4px",
                borderRadius:3 }}>SIAPS_CPF</code> e{" "}
              <code style={{ background:"#fef9c3", padding:"1px 4px", borderRadius:3 }}>SIAPS_SENHA</code>{" "}
              no painel do Railway para habilitar a busca de dados reais do SIAPS.
              Acesse <strong>Painel de Integrações</strong> para o guia completo.
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div style={{ textAlign:"center", padding:60, color:"#94a3b8" }}>
          <RefreshCw size={28} style={{ animation:"spin 1s linear infinite", marginBottom:12 }}/>
          <div style={{ fontSize:14 }}>Consultando SIAPS para cada competência…</div>
        </div>
      )}

      {/* Lista de competências */}
      {!isLoading && competencias.length > 0 && (
        <>
          <div style={{ fontSize:13, fontWeight:700, color:"#374151", marginBottom:12 }}>
            Status por Competência — {competencias.length} competências monitoradas
          </div>
          {competencias.map(c => <CardComp key={c.competencia} c={c}/>)}
        </>
      )}

      {/* Legenda */}
      {!isLoading && (
        <div style={{ marginTop:16, padding:"12px 16px", background:"#f8fafc",
          border:"1px solid #e2e8f0", borderRadius:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
            <Database size={13} color="#64748b"/>
            <span style={{ fontSize:12, fontWeight:700, color:"#374151" }}>
              Classificação SituacaoDado
            </span>
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" as const }}>
            {Object.entries(SITUACAO_LABEL).map(([k, v]) => (
              <Tag key={k} s={k}/>
            ))}
          </div>
          <div style={{ marginTop:8, fontSize:11, color:"#94a3b8" }}>
            Nenhum valor é estimado ou inventado — campos sem dado real da API
            recebem a classificação <em>nao_disponivel</em>.
          </div>
        </div>
      )}
    </div>
  );
}
