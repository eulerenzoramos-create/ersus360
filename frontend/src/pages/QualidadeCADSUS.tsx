/**
 * QualidadeCADSUS — ERSUS 360
 * Qualidade cadastral CADSUS / e-SUS PEC.
 *
 * Dados reais: requer e-SUS PEC local (ESUS_URL no Railway).
 * Enquanto a integração não estiver configurada, exibe situacao_dado nao_disponivel
 * com instruções claras — nenhum dado é simulado.
 */
import { useQuery } from "@tanstack/react-query";
import {
  UserCheck, RefreshCw, Info, AlertCircle, CheckCircle, Database, Settings,
} from "lucide-react";
import { api } from "../lib/api";
import { useMunicipioSeletor } from "../lib/municipio";
import MunicipioSeletor from "../components/MunicipioSeletor";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Metrica {
  label: string; valor: number | null; situacao_dado: string; observacao: string;
}

interface EsusPec {
  online: boolean; situacao_dado: string; nota: string;
}

interface Resumo {
  ibge: string; situacao_dado_geral: string;
  esus_pec: EsusPec; metricas: Record<string, Metrica>;
  microareas: unknown[]; total_cidadaos: number | null;
  cidadaos_situacao: string; verificado_em: string; nota: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SIT_COR: Record<string, string> = {
  oficial_validado:   "#166534",
  oficial_aguardando: "#854d0e",
  divergente:         "#991b1b",
  dado_nao_validado:  "#6b7280",
  nao_disponivel:     "#94a3b8",
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

// ── Card de métrica ───────────────────────────────────────────────────────────

function CardMetrica({ m }: { m: Metrica }) {
  return (
    <div style={{ padding:"12px 14px", background:"#fff", borderRadius:10,
      border:"1px solid #f1f5f9", marginBottom:8 }}>
      <div style={{ display:"flex", alignItems:"flex-start",
        justifyContent:"space-between", gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#374151", marginBottom:3 }}>
            {m.label}
          </div>
          <div style={{ fontSize:11, color:"#94a3b8" }}>{m.observacao}</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
          <span style={{ fontSize:16, fontWeight:700,
            color: m.valor !== null ? "#1e293b" : "#94a3b8" }}>
            {m.valor !== null ? `${m.valor}%` : "—"}
          </span>
          <Tag s={m.situacao_dado}/>
        </div>
      </div>
    </div>
  );
}

// ── Banner de status e-SUS ────────────────────────────────────────────────────

function BannerEsus({ esus }: { esus: EsusPec }) {
  const online = esus.online;
  return (
    <div style={{ padding:"14px 18px", borderRadius:12, marginBottom:16,
      background: online ? "#f0fdf4" : "#fef9c3",
      border: `1px solid ${online ? "#bbf7d0" : "#fde68a"}` }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
        {online
          ? <CheckCircle size={16} color="#16a34a"/>
          : <AlertCircle size={16} color="#d97706"/>
        }
        <span style={{ fontSize:14, fontWeight:700,
          color: online ? "#166534" : "#92400e" }}>
          e-SUS PEC: {online ? "Acessível" : "Não configurado / offline"}
        </span>
      </div>
      <div style={{ fontSize:12, color: online ? "#166534" : "#92400e" }}>
        {esus.nota}
      </div>
    </div>
  );
}

// ── Painel de configuração Railway ────────────────────────────────────────────

function GuiaConfiguracao() {
  return (
    <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0",
      padding:"20px 22px", marginTop:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <Settings size={16} color="#1d4ed8"/>
        <span style={{ fontSize:14, fontWeight:700, color:"#1e293b" }}>
          Configurar integração e-SUS PEC (Railway)
        </span>
      </div>
      <div style={{ fontSize:12, color:"#475569", lineHeight:1.7 }}>
        Para habilitar qualidade cadastral CADSUS, configure as seguintes variáveis de ambiente
        no painel <strong>Railway → Variables</strong> do projeto ERSUS 360:
      </div>
      <div style={{ marginTop:12, display:"grid", gap:6 }}>
        {[
          ["ESUS_URL",               "URL do e-SUS PEC local (ex: http://192.168.1.x:8080)"],
          ["ESUS_USUARIO_1300144",   "Usuário de acesso ao e-SUS PEC de Apuí/AM"],
          ["ESUS_SENHA_1300144",     "Senha do usuário e-SUS PEC"],
        ].map(([k, v]) => (
          <div key={k} style={{ display:"flex", alignItems:"flex-start", gap:10,
            padding:"8px 12px", background:"#f8fafc", borderRadius:8,
            border:"1px solid #e2e8f0" }}>
            <code style={{ fontSize:11, fontFamily:"monospace", color:"#1d4ed8",
              background:"#eff6ff", padding:"2px 6px", borderRadius:4, flexShrink:0 }}>
              {k}
            </code>
            <span style={{ fontSize:11, color:"#64748b" }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop:12, padding:"10px 14px", background:"#fef2f2",
        border:"1px solid #fecaca", borderRadius:8, fontSize:11, color:"#991b1b" }}>
        Nunca insira credenciais no código-fonte. Use somente as variáveis de ambiente no Railway.
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function QualidadeCADSUS() {
  const { ibge, setIbge } = useMunicipioSeletor();
  const token = localStorage.getItem("ersus_token") ?? "";

  const { data, isLoading, refetch } = useQuery<Resumo>({
    queryKey: ["cadsus-qualidade", ibge],
    queryFn: () =>
      api.get(`/api/cadsus-qualidade/resumo?ibge=${ibge}`,
        { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data),
    staleTime: 120_000,
  });

  return (
    <div style={{ padding:24, maxWidth:860, margin:"0 auto" }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>

      {/* Cabeçalho */}
      <div style={{ display:"flex", alignItems:"flex-start",
        justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <UserCheck size={22} color="#1d4ed8"/>
            <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:"#1e293b" }}>
              Qualidade Cadastral CADSUS
            </h1>
          </div>
          <div style={{ fontSize:12, color:"#64748b" }}>
            Completude · CNS válido · Endereço · Unicidade — Fonte: e-SUS PEC local
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

      {isLoading && (
        <div style={{ textAlign:"center", padding:60, color:"#94a3b8" }}>
          <RefreshCw size={28} style={{ animation:"spin 1s linear infinite" }}/>
          <div style={{ marginTop:10, fontSize:13 }}>Consultando integração…</div>
        </div>
      )}

      {data && (
        <>
          {/* Status e-SUS */}
          <BannerEsus esus={data.esus_pec}/>

          {/* Métricas */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#374151", marginBottom:10 }}>
              Métricas de Qualidade Cadastral
            </div>
            {Object.entries(data.metricas).map(([k, m]) => (
              <CardMetrica key={k} m={m}/>
            ))}
          </div>

          {/* Nota geral */}
          <div style={{ padding:"12px 16px", background:"#f8fafc",
            border:"1px solid #e2e8f0", borderRadius:10,
            fontSize:12, color:"#64748b",
            display:"flex", alignItems:"flex-start", gap:8, marginBottom:6 }}>
            <Info size={13} style={{ flexShrink:0, marginTop:1 }}/>
            {data.nota}
          </div>

          {/* Guia de configuração (se offline) */}
          {!data.esus_pec.online && <GuiaConfiguracao/>}

          {/* Microáreas (quando integração ativa) */}
          {data.microareas.length > 0 && (
            <div style={{ marginTop:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#374151", marginBottom:10 }}>
                Microáreas ({data.microareas.length})
              </div>
              {/* Cards de microárea aparecerão aqui quando e-SUS PEC estiver integrado */}
            </div>
          )}
        </>
      )}

      {/* Nota de integridade */}
      <div style={{ marginTop:20, padding:"12px 16px", background:"#f8fafc",
        border:"1px solid #e2e8f0", borderRadius:10, fontSize:11, color:"#94a3b8" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
          <Database size={11}/> <strong>Integridade dos dados</strong>
        </div>
        Qualidade cadastral por microárea e ACS requer extração do e-SUS PEC local.
        O CADSUS não possui API pública de acesso em lote por município.
        Nenhum valor é simulado ou estimado — dados ausentes são declarados como "Não disponível".
      </div>
    </div>
  );
}
