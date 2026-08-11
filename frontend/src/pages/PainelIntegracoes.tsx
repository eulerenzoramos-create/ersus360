/**
 * PainelIntegracoes — ERSUS 360
 * Dashboard de status das integrações: SIAPS, e-Gestor APS, e-SUS PEC/RNDS e CNES.
 * Mostra o que está configurado, o que está faltando e guias de configuração no Railway.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plug, RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock,
  ChevronDown, ChevronRight, Copy, Terminal, ExternalLink,
  Database, Globe, Network, Shield, Activity, Users, Building2,
  Key, Wifi, WifiOff, Loader,
} from "lucide-react";
import { api } from "../lib/api";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface SiapsStatus {
  sistema: string; url_base: string;
  credenciais_configuradas: boolean; autenticado: boolean;
  api_publica_alcancavel: boolean; api_publica_status_http: number | null;
  dados_vinculo_obtidos: boolean; fonte: string; nota: string;
  tempo_ms: number; verificado_em: string;
}

interface EgestorStatus {
  sistema: string; url_base: string; ibge: string;
  credenciais_configuradas: boolean; api_alcancavel: boolean;
  api_status_http: number | null; equipes_retornadas: number | null;
  ines_obtidos: Array<{ ine: string; equipe: string }>;
  nota: string; tempo_ms: number; verificado_em: string;
}

interface PecLocal {
  url: string; conectado: boolean | null; autenticado: boolean | null;
  versao: string | null; credenciais_configuradas: boolean; nota: string;
}
interface Rnds {
  alcancavel: boolean; credenciais_configuradas: boolean; nota: string;
}
interface EsusStatus {
  sistema: string; pec_local: PecLocal; rnds: Rnds;
  tempo_ms: number; verificado_em: string;
}

interface EstabItem {
  cnes: string; nome: string;
  rejeicao_esf: boolean | null; equipes: unknown[]; observacao: string | null;
}
interface CnesStatus {
  sistema: string; ibge: string; cnes_sms: string;
  total_estabelecimentos: number; com_rejeicao_equipe_esf: number;
  sem_rejeicao_equipe_esf: number; estabelecimentos: EstabItem[];
  fonte: string; nota: string; tempo_ms: number; verificado_em: string;
}

interface StatusResponse {
  municipio: string; ibge: string; cnes_sms: string;
  sistemas_ok: number; total_sistemas: number;
  integracoes: {
    siaps: SiapsStatus;
    egestor: EgestorStatus;
    esus_pec: EsusStatus;
    cnes: CnesStatus;
  };
  verificado_em: string;
}

// ── Helpers visuais ───────────────────────────────────────────────────────────

type Nivel = "ok" | "parcial" | "erro" | "pendente";

function nivelSiaps(s: SiapsStatus): Nivel {
  if (s.dados_vinculo_obtidos && s.autenticado) return "ok";
  if (s.api_publica_alcancavel) return "parcial";
  if (s.credenciais_configuradas) return "parcial";
  return "erro";
}
function nivelEgestor(s: EgestorStatus): Nivel {
  if (s.ines_obtidos?.length > 0) return "ok";
  if (s.api_alcancavel) return "parcial";
  if (s.credenciais_configuradas) return "parcial";
  return "erro";
}
function nivelPec(s: EsusStatus): Nivel {
  if (s.pec_local?.conectado && s.pec_local?.autenticado) return "ok";
  if (s.pec_local?.conectado) return "parcial";
  if (s.pec_local?.credenciais_configuradas) return "pendente";
  return "erro";
}
function nivelCnes(s: CnesStatus): Nivel {
  if (s.total_estabelecimentos > 0) return "ok";
  return "erro";
}

const NIVEL_CFG: Record<Nivel, { cor: string; bg: string; label: string; icon: React.ReactNode }> = {
  ok:      { cor: "#166534", bg: "#f0fdf4", label: "Operacional", icon: <CheckCircle size={14}/> },
  parcial: { cor: "#854d0e", bg: "#fffbeb", label: "Parcial",     icon: <AlertTriangle size={14}/> },
  pendente:{ cor: "#1d4ed8", bg: "#eff6ff", label: "Pendente",    icon: <Clock size={14}/> },
  erro:    { cor: "#991b1b", bg: "#fef2f2", label: "Sem config",  icon: <XCircle size={14}/> },
};

function NivelBadge({ nivel }: { nivel: Nivel }) {
  const cfg = NIVEL_CFG[nivel];
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11,
      fontWeight:700, padding:"3px 8px", borderRadius:10,
      color:cfg.cor, background:cfg.bg, border:`1px solid ${cfg.cor}30` }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function Bool({ v }: { v: boolean | null | undefined }) {
  if (v == null) return <span style={{ color:"#94a3b8", fontSize:11 }}>—</span>;
  return v
    ? <CheckCircle size={13} color="#166534"/>
    : <XCircle size={13} color="#dc2626"/>;
}

function Tempo({ ms }: { ms: number }) {
  return (
    <span style={{ fontSize:10, color:"#94a3b8", fontVariantNumeric:"tabular-nums" }}>
      {ms < 1000 ? `${ms} ms` : `${(ms/1000).toFixed(1)} s`}
    </span>
  );
}

// ── Seção de configuração (env vars Railway) ──────────────────────────────────

function GuiaRailway({ vars }: { vars: Array<{ nome: string; exemplo: string; descricao: string }> }) {
  const [copiado, setCopiado] = useState<string | null>(null);
  function copiar(v: string) {
    navigator.clipboard.writeText(v).then(() => {
      setCopiado(v);
      setTimeout(() => setCopiado(null), 1500);
    });
  }
  return (
    <div style={{ marginTop:12, padding:"12px 14px", background:"#0f172a",
      borderRadius:10, fontFamily:"monospace" }}>
      <div style={{ fontSize:11, color:"#64748b", marginBottom:10,
        display:"flex", alignItems:"center", gap:6 }}>
        <Terminal size={12}/> Variáveis de ambiente — Railway
      </div>
      {vars.map(v => (
        <div key={v.nome} style={{ marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
            <span style={{ color:"#38bdf8", fontSize:12, fontWeight:700 }}>{v.nome}</span>
            <span style={{ fontSize:10, color:"#475569" }}>=</span>
            <code style={{ color:"#a5f3fc", fontSize:11, flex:1 }}>{v.exemplo}</code>
            <button onClick={() => copiar(`${v.nome}=${v.exemplo}`)}
              style={{ background:"none", border:"none", cursor:"pointer",
                color: copiado === `${v.nome}=${v.exemplo}` ? "#4ade80" : "#475569" }}>
              <Copy size={11}/>
            </button>
          </div>
          <div style={{ fontSize:10, color:"#475569", paddingLeft:4 }}># {v.descricao}</div>
        </div>
      ))}
    </div>
  );
}

// ── Cards das integrações ─────────────────────────────────────────────────────

function CardIntegracao({ titulo, icon, nivel, tempo, children, guia }: {
  titulo: string; icon: React.ReactNode; nivel: Nivel; tempo: number;
  children: React.ReactNode; guia?: React.ReactNode;
}) {
  const [expandido, setExpandido] = useState(nivel !== "ok");
  const cfg = NIVEL_CFG[nivel];
  return (
    <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${cfg.cor}30`,
      boxShadow:"0 1px 4px rgba(0,0,0,.05)", overflow:"hidden", marginBottom:16 }}>
      <button onClick={() => setExpandido(!expandido)}
        style={{ width:"100%", display:"flex", alignItems:"center", gap:12,
          padding:"16px 20px", background:"none", border:"none", cursor:"pointer",
          borderBottom: expandido ? `1px solid ${cfg.bg}` : "none" }}>
        <div style={{ width:36, height:36, borderRadius:10, background:`${cfg.cor}15`,
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          {icon}
        </div>
        <div style={{ flex:1, textAlign:"left" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#1e293b" }}>{titulo}</div>
          <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>
            Verificado às {new Date(Date.now()).toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" })}
            {" · "}<Tempo ms={tempo}/>
          </div>
        </div>
        <NivelBadge nivel={nivel}/>
        {expandido ? <ChevronDown size={14} color="#94a3b8"/> : <ChevronRight size={14} color="#94a3b8"/>}
      </button>

      {expandido && (
        <div style={{ padding:"16px 20px" }}>
          {children}
          {guia}
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6,
      fontSize:12, paddingBottom:6, borderBottom:"1px solid #f8fafc" }}>
      <span style={{ color:"#64748b", minWidth:200 }}>{label}</span>
      <span style={{ color:"#1e293b", fontWeight:500 }}>{children}</span>
    </div>
  );
}

// ── SIAPS Card ────────────────────────────────────────────────────────────────

function CardSiaps({ d }: { d: SiapsStatus }) {
  const nivel = nivelSiaps(d);
  return (
    <CardIntegracao titulo="SIAPS / e-Gestor APS — Componente Vínculo" nivel={nivel}
      icon={<Database size={18} color={NIVEL_CFG[nivel].cor}/>} tempo={d.tempo_ms}
      guia={nivel !== "ok" && (
        <GuiaRailway vars={[
          { nome:"SIAPS_CPF",   exemplo:"34130047272", descricao:"CPF da gestora sem pontuação (Railway env var — nunca hardcode)" },
          { nome:"SIAPS_SENHA", exemplo:"••••••••",    descricao:"Senha gov.br da gestora (Railway env var — nunca hardcode)" },
        ]}/>
      )}>
      <Row label="Credenciais configuradas"><Bool v={d.credenciais_configuradas}/></Row>
      <Row label="Autenticação gov.br"><Bool v={d.autenticado}/></Row>
      <Row label="API pública alcançável"><Bool v={d.api_publica_alcancavel}/>{" "}<span style={{ fontSize:11, color:"#94a3b8" }}>HTTP {d.api_publica_status_http ?? "—"}</span></Row>
      <Row label="Dados de vínculo obtidos"><Bool v={d.dados_vinculo_obtidos}/></Row>
      <Row label="Fonte atual"><span style={{ fontFamily:"monospace", fontSize:11 }}>{d.fonte}</span></Row>
      <div style={{ marginTop:10, padding:"8px 12px", background: nivel === "ok" ? "#f0fdf4" : "#fffbeb",
        borderRadius:8, fontSize:12, color: nivel === "ok" ? "#166534" : "#9a3412" }}>
        {d.nota}
      </div>
    </CardIntegracao>
  );
}

// ── e-Gestor INEs Card ────────────────────────────────────────────────────────

function CardEgestor({ d }: { d: EgestorStatus }) {
  const nivel = nivelEgestor(d);
  const [expandirInes, setExpandirInes] = useState(false);
  return (
    <CardIntegracao titulo="e-Gestor APS — INEs das Equipes ESF" nivel={nivel}
      icon={<Users size={18} color={NIVEL_CFG[nivel].cor}/>} tempo={d.tempo_ms}
      guia={nivel !== "ok" && (
        <GuiaRailway vars={[
          { nome:"EGESTOR_TOKEN", exemplo:"eyJhbGci…",
            descricao:"Bearer token obtido em egestorab.saude.gov.br (Railway env var)" },
        ]}/>
      )}>
      <Row label="Credenciais configuradas"><Bool v={d.credenciais_configuradas}/></Row>
      <Row label="API alcançável"><Bool v={d.api_alcancavel}/>{" "}<span style={{ fontSize:11, color:"#94a3b8" }}>HTTP {d.api_status_http ?? "—"}</span></Row>
      <Row label="Equipes com INE">
        {d.equipes_retornadas != null
          ? <span style={{ fontWeight:700, color: d.equipes_retornadas > 0 ? "#166534" : "#dc2626" }}>
              {d.equipes_retornadas}
            </span>
          : <span style={{ color:"#94a3b8" }}>—</span>
        }
      </Row>
      <div style={{ marginTop:10, padding:"8px 12px", background: nivel === "ok" ? "#f0fdf4" : "#fffbeb",
        borderRadius:8, fontSize:12, color: nivel === "ok" ? "#166534" : "#9a3412" }}>
        {d.nota}
      </div>
      {d.ines_obtidos?.length > 0 && (
        <div style={{ marginTop:10 }}>
          <button onClick={() => setExpandirInes(!expandirInes)}
            style={{ background:"none", border:"none", cursor:"pointer", fontSize:12,
              color:"#1d4ed8", display:"flex", alignItems:"center", gap:4 }}>
            {expandirInes ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}
            Ver {d.ines_obtidos.length} INEs obtidos
          </button>
          {expandirInes && (
            <div style={{ marginTop:8, border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                <thead>
                  <tr style={{ background:"#f8fafc" }}>
                    <th style={{ padding:"6px 12px", textAlign:"left", color:"#475569" }}>INE</th>
                    <th style={{ padding:"6px 12px", textAlign:"left", color:"#475569" }}>Equipe</th>
                  </tr>
                </thead>
                <tbody>
                  {d.ines_obtidos.map((i, idx) => (
                    <tr key={idx} style={{ borderTop:"1px solid #f1f5f9" }}>
                      <td style={{ padding:"6px 12px", fontFamily:"monospace", color:"#1d4ed8", fontWeight:700 }}>{i.ine}</td>
                      <td style={{ padding:"6px 12px", color:"#374151" }}>{i.equipe || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </CardIntegracao>
  );
}

// ── e-SUS PEC Card ────────────────────────────────────────────────────────────

function CardEsus({ d }: { d: EsusStatus }) {
  const nivel = nivelPec(d);
  return (
    <CardIntegracao titulo="e-SUS PEC / RNDS" nivel={nivel}
      icon={<Network size={18} color={NIVEL_CFG[nivel].cor}/>} tempo={d.tempo_ms}
      guia={nivel !== "ok" && (
        <GuiaRailway vars={[
          { nome:"ESUS_URL",    exemplo:"http://pec.apui.am.gov.br:8080",
            descricao:"URL do PEC local do município" },
          { nome:"ESUS_USUARIO", exemplo:"@l39er79",
            descricao:"Usuário de integração do PEC (Railway env var — nunca hardcode)" },
          { nome:"ESUS_SENHA",   exemplo:"••••••••",
            descricao:"Senha do usuário de integração (Railway env var — nunca hardcode)" },
          { nome:"RNDS_CLIENT_ID",     exemplo:"xxxxxxxx-xxxx-xxxx",
            descricao:"Client ID ICP-Brasil RNDS (Railway env var)" },
          { nome:"RNDS_CLIENT_SECRET", exemplo:"••••••••••••••••",
            descricao:"Client Secret ICP-Brasil RNDS (Railway env var)" },
        ]}/>
      )}>
      <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:8 }}>PEC Local</div>
      <Row label="URL configurada">{d.pec_local.url || "—"}</Row>
      <Row label="Credenciais configuradas"><Bool v={d.pec_local.credenciais_configuradas}/></Row>
      <Row label="Conectado"><Bool v={d.pec_local.conectado}/></Row>
      <Row label="Autenticado"><Bool v={d.pec_local.autenticado}/></Row>
      {d.pec_local.versao && <Row label="Versão PEC">{d.pec_local.versao}</Row>}
      <div style={{ fontSize:12, fontWeight:700, color:"#374151", margin:"12px 0 8px" }}>RNDS / FHIR R4</div>
      <Row label="Credenciais configuradas"><Bool v={d.rnds.credenciais_configuradas}/></Row>
      <Row label="Token obtido"><Bool v={d.rnds.alcancavel}/></Row>
      <div style={{ marginTop:10, padding:"8px 12px", background: nivel === "ok" ? "#f0fdf4" : "#f0f9ff",
        borderRadius:8, fontSize:12, color: nivel === "ok" ? "#166534" : "#1d4ed8" }}>
        {d.pec_local.nota}
      </div>
    </CardIntegracao>
  );
}

// ── CNES Card ─────────────────────────────────────────────────────────────────

function CardCnes({ d }: { d: CnesStatus }) {
  const nivel = nivelCnes(d);
  const [expandirEstabs, setExpandirEstabs] = useState(false);
  return (
    <CardIntegracao titulo="CNES / DATASUS — Estabelecimentos de Saúde" nivel={nivel}
      icon={<Building2 size={18} color={NIVEL_CFG[nivel].cor}/>} tempo={d.tempo_ms}>
      <Row label="IBGE">{d.ibge}</Row>
      <Row label="CNES SMS">{d.cnes_sms}</Row>
      <Row label="Total de estabelecimentos">
        <span style={{ fontWeight:700, color: d.total_estabelecimentos > 0 ? "#166534" : "#dc2626" }}>
          {d.total_estabelecimentos}
        </span>
      </Row>
      <Row label="Com rejeição de equipe ESF">
        <span style={{ fontWeight:700, color: d.com_rejeicao_equipe_esf > 0 ? "#dc2626" : "#166534" }}>
          {d.com_rejeicao_equipe_esf}
        </span>
      </Row>
      <Row label="Sem rejeição (equipes ativas)">
        <span style={{ fontWeight:700, color:"#166534" }}>{d.sem_rejeicao_equipe_esf}</span>
      </Row>
      <Row label="Fonte"><span style={{ fontFamily:"monospace", fontSize:11 }}>{d.fonte}</span></Row>
      <div style={{ marginTop:10, padding:"8px 12px", background:"#f0fdf4",
        borderRadius:8, fontSize:12, color:"#166534" }}>
        {d.nota}
      </div>
      {d.estabelecimentos?.length > 0 && (
        <div style={{ marginTop:10 }}>
          <button onClick={() => setExpandirEstabs(!expandirEstabs)}
            style={{ background:"none", border:"none", cursor:"pointer", fontSize:12,
              color:"#1d4ed8", display:"flex", alignItems:"center", gap:4 }}>
            {expandirEstabs ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}
            Ver {d.estabelecimentos.length} estabelecimentos
          </button>
          {expandirEstabs && (
            <div style={{ marginTop:8, border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                <thead>
                  <tr style={{ background:"#f8fafc" }}>
                    <th style={{ padding:"6px 12px", textAlign:"left", color:"#475569" }}>CNES</th>
                    <th style={{ padding:"6px 12px", textAlign:"left", color:"#475569" }}>Nome</th>
                    <th style={{ padding:"6px 12px", textAlign:"center", color:"#475569" }}>Rejeição ESF</th>
                    <th style={{ padding:"6px 12px", textAlign:"right", color:"#475569" }}>Equipes</th>
                  </tr>
                </thead>
                <tbody>
                  {d.estabelecimentos.map((e, idx) => (
                    <tr key={idx} style={{ borderTop:"1px solid #f1f5f9",
                      background: e.rejeicao_esf ? "#fff7f7" : "transparent" }}>
                      <td style={{ padding:"6px 12px", fontFamily:"monospace", color:"#1d4ed8", fontWeight:700 }}>{e.cnes}</td>
                      <td style={{ padding:"6px 12px", color:"#374151" }}>{e.nome}</td>
                      <td style={{ padding:"6px 12px", textAlign:"center" }}>
                        {e.rejeicao_esf == null ? "—" : e.rejeicao_esf
                          ? <XCircle size={13} color="#dc2626"/>
                          : <CheckCircle size={13} color="#166534"/>
                        }
                      </td>
                      <td style={{ padding:"6px 12px", textAlign:"right", color:"#374151" }}>
                        {Array.isArray(e.equipes) ? e.equipes.length : 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </CardIntegracao>
  );
}

// ── Score geral de integrações ────────────────────────────────────────────────

function ScoreBar({ ok, total }: { ok: number; total: number }) {
  const pct = Math.round(ok / total * 100);
  const cor = pct === 100 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626";
  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11,
        color:"#64748b", marginBottom:4 }}>
        <span>{ok} de {total} sistemas operacionais</span>
        <span style={{ fontWeight:700, color:cor }}>{pct}%</span>
      </div>
      <div style={{ height:8, background:"#f1f5f9", borderRadius:4, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:cor,
          borderRadius:4, transition:"width .5s" }}/>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function PainelIntegracoes() {
  const token = localStorage.getItem("ersus_token") ?? "";
  const [rodando, setRodando] = useState(false);

  const { data, isLoading, isError, refetch, dataUpdatedAt } = useQuery<StatusResponse>({
    queryKey: ["integracao-status"],
    queryFn: () =>
      api.get("/api/integracao/status", {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.data),
    staleTime: 3 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
  });

  const handleAtualizar = async () => {
    setRodando(true);
    await refetch();
    setRodando(false);
  };

  return (
    <div style={{ padding:24, maxWidth:920, margin:"0 auto" }}>

      {/* Cabeçalho */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
        marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <Plug size={22} color="#1d4ed8"/>
            <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:"#1e293b" }}>
              Painel de Integrações
            </h1>
          </div>
          <div style={{ fontSize:12, color:"#64748b" }}>
            Status em tempo real de todas as fontes de dados do ERSUS 360
          </div>
        </div>
        <button onClick={handleAtualizar} disabled={isLoading || rodando}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px",
            borderRadius:9, border:"1.5px solid #e2e8f0", background:"#fff",
            fontSize:13, fontWeight:600, cursor: isLoading ? "default" : "pointer",
            color:"#374151" }}>
          <RefreshCw size={14} style={{ animation: (isLoading || rodando) ? "spin 1s linear infinite" : "none" }}/>
          Verificar agora
        </button>
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      {/* Loading */}
      {isLoading && (
        <div style={{ textAlign:"center", padding:60, color:"#94a3b8" }}>
          <Loader size={28} style={{ animation:"spin 1s linear infinite", marginBottom:12 }}/>
          <div style={{ fontSize:14 }}>Verificando todas as integrações…</div>
          <div style={{ fontSize:12, marginTop:4 }}>SIAPS · e-Gestor · e-SUS PEC · CNES</div>
        </div>
      )}

      {/* Erro */}
      {isError && !isLoading && (
        <div style={{ background:"#fff7f7", border:"1px solid #fecaca", borderRadius:12,
          padding:24, textAlign:"center", marginBottom:20 }}>
          <AlertTriangle size={24} color="#dc2626" style={{ marginBottom:8 }}/>
          <div style={{ fontSize:14, color:"#dc2626", fontWeight:600 }}>
            Erro ao consultar status das integrações
          </div>
          <div style={{ fontSize:12, color:"#64748b", marginTop:4 }}>
            Verifique se o backend Railway está disponível.
          </div>
          <button onClick={handleAtualizar} style={{ marginTop:12, padding:"8px 16px",
            borderRadius:8, border:"1px solid #dc2626", background:"#fff",
            color:"#dc2626", fontSize:12, cursor:"pointer" }}>
            Tentar novamente
          </button>
        </div>
      )}

      {data && !isLoading && (
        <>
          {/* Resumo geral */}
          <div style={{ background:"linear-gradient(135deg,#0f172a,#1e3a5f)", borderRadius:14,
            padding:"20px 24px", marginBottom:24, color:"#fff" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
              marginBottom:14, flexWrap:"wrap", gap:8 }}>
              <div>
                <div style={{ fontSize:11, color:"#64748b", textTransform:"uppercase",
                  letterSpacing:"0.08em", marginBottom:4 }}>Status geral</div>
                <div style={{ fontSize:18, fontWeight:800 }}>
                  {data.municipio} · IBGE {data.ibge}
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6,
                background: data.sistemas_ok === data.total_sistemas
                  ? "rgba(22,163,74,.15)" : "rgba(245,158,11,.15)",
                border: `1px solid ${data.sistemas_ok === data.total_sistemas ? "rgba(22,163,74,.4)" : "rgba(245,158,11,.4)"}`,
                borderRadius:8, padding:"6px 12px" }}>
                {data.sistemas_ok === data.total_sistemas
                  ? <Wifi size={14} color="#4ade80"/>
                  : <WifiOff size={14} color="#fbbf24"/>
                }
                <span style={{ fontSize:13, fontWeight:700,
                  color: data.sistemas_ok === data.total_sistemas ? "#4ade80" : "#fbbf24" }}>
                  {data.sistemas_ok}/{data.total_sistemas} operacionais
                </span>
              </div>
            </div>
            <ScoreBar ok={data.sistemas_ok} total={data.total_sistemas}/>
            <div style={{ fontSize:10, color:"#475569", marginTop:4 }}>
              Última verificação: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleString("pt-BR") : "—"}
              {" · "}{data.integracoes.siaps?.nota?.includes("SISAB") ? "" : "SISAB descontinuado — excluído"}
            </div>
          </div>

          {/* Cards das integrações */}
          <CardSiaps d={data.integracoes.siaps}/>
          <CardEgestor d={data.integracoes.egestor}/>
          <CardEsus d={data.integracoes.esus_pec}/>
          <CardCnes d={data.integracoes.cnes}/>

          {/* Nota de segurança */}
          <div style={{ background:"#fafafa", border:"1px solid #e2e8f0", borderRadius:10,
            padding:"12px 16px", marginTop:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
              <Key size={13} color="#64748b"/>
              <span style={{ fontSize:12, fontWeight:700, color:"#374151" }}>
                Segurança — variáveis de ambiente
              </span>
            </div>
            <div style={{ fontSize:11, color:"#64748b", lineHeight:1.6 }}>
              Nenhuma credencial é armazenada no código-fonte ou no banco de dados.
              Todas as chaves são configuradas exclusivamente como variáveis de ambiente no Railway.
              Os guias de configuração acima mostram apenas os nomes das variáveis, nunca os valores reais.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
