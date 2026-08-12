/**
 * DashboardExecutivo360 — ERSUS 360
 * Visão unificada com dados reais e situacao_dado por indicador.
 * Valores sem API pública mostrados como "—" com tag "Não disponível".
 */
import { useQuery } from "@tanstack/react-query";
import {
  Activity, AlertTriangle, CheckCircle,
  TrendingUp, TrendingDown, Minus, RefreshCw, Info,
} from "lucide-react";
import { api } from "../lib/api";
import { useMunicipioSeletor } from "../lib/municipio";
import MunicipioSeletor from "../components/MunicipioSeletor";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Indicador {
  nome: string; valor: string; status: string; situacao_dado: string;
  tendencia: string | null; rota: string;
}

interface Bloco {
  modulo: string; icone: string; situacao_dado: string;
  indicadores: Indicador[]; nota: string;
}

interface DashData {
  ibge: string; verificado_em: string; nota: string; blocos: Bloco[];
}

interface AlertasData {
  total_alertas: number | null; criticos: number | null;
  situacao_dado: string;
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
  oficial_validado:   "Oficial",
  oficial_aguardando: "Aguardando",
  divergente:         "Divergente",
  dado_nao_validado:  "Não validado",
  nao_disponivel:     "Indisponível",
};

const STATUS_BG: Record<string, [string, string]> = {
  ok:      ["#dcfce7", "#16a34a"],
  alerta:  ["#fef3c7", "#d97706"],
  critico: ["#fee2e2", "#dc2626"],
};

function Tag({ s }: { s: string }) {
  const cor = SIT_COR[s] ?? "#6b7280";
  return (
    <span style={{ fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:8,
      color:cor, background:`${cor}18`, border:`1px solid ${cor}28` }}>
      {SIT_LABEL[s] ?? s}
    </span>
  );
}

function Tend({ t }: { t: string | null }) {
  if (t === "alta")  return <TrendingUp  size={10} color="#16a34a"/>;
  if (t === "queda") return <TrendingDown size={10} color="#dc2626"/>;
  return <Minus size={10} color="#9ca3af"/>;
}

// ── Card de KPI ───────────────────────────────────────────────────────────────

function CardKPI({ ind }: { ind: Indicador }) {
  const [bg, cor] = STATUS_BG[ind.status] ?? ["#f8fafc", "#6b7280"];
  const sem_dado = ind.situacao_dado === "nao_disponivel";

  return (
    <div style={{ background: sem_dado ? "#f8fafc" : bg,
      border:`1px solid ${sem_dado ? "#e2e8f0" : cor + "30"}`,
      borderRadius:8, padding:"8px 10px" }}>
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"flex-start", marginBottom:3 }}>
        <span style={{ fontSize:9, color:"#6b7280", lineHeight:1.3, flex:1 }}>
          {ind.nome}
        </span>
        {ind.tendencia && <Tend t={ind.tendencia}/>}
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:14, fontWeight:900,
          color: sem_dado ? "#94a3b8" : cor }}>
          {ind.valor}
        </span>
        <Tag s={ind.situacao_dado}/>
      </div>
    </div>
  );
}

// ── Bloco de módulo ───────────────────────────────────────────────────────────

function BlocoModulo({ b }: { b: Bloco }) {
  const criticos = b.indicadores.filter(i => i.status === "critico").length;
  const alertas  = b.indicadores.filter(i => i.status === "alerta").length;
  const titCor   = criticos > 0 ? "#dc2626" : alertas > 0 ? "#d97706" : "#16a34a";
  const semDados = b.situacao_dado === "nao_disponivel";

  return (
    <div style={{ background:"#fff",
      border:`1px solid #e4e7ec`,
      borderTop:`3px solid ${semDados ? "#e2e8f0" : titCor}`,
      borderRadius:10, padding:"12px 14px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8,
        flexWrap:"wrap" as const }}>
        <span style={{ fontSize:12, fontWeight:800, color:"#374151" }}>{b.modulo}</span>
        {criticos > 0 && (
          <span style={{ fontSize:9, background:"#fee2e2", color:"#dc2626",
            padding:"1px 6px", borderRadius:8, fontWeight:700 }}>
            {criticos} crítico(s)
          </span>
        )}
        {alertas > 0 && (
          <span style={{ fontSize:9, background:"#fef3c7", color:"#d97706",
            padding:"1px 6px", borderRadius:8, fontWeight:700 }}>
            {alertas} alerta(s)
          </span>
        )}
        {semDados && (
          <span style={{ fontSize:9, color:"#94a3b8" }}>Integração pendente</span>
        )}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
        {b.indicadores.map((ind, i) => <CardKPI key={i} ind={ind}/>)}
      </div>
      {b.nota && (
        <div style={{ marginTop:8, fontSize:9, color:"#94a3b8",
          display:"flex", alignItems:"flex-start", gap:4 }}>
          <Info size={9} style={{ flexShrink:0, marginTop:1 }}/>{b.nota}
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function DashboardExecutivo360() {
  const { ibge, setIbge } = useMunicipioSeletor();
  const token = localStorage.getItem("ersus_token") ?? "";

  const { data, isLoading, refetch } = useQuery<DashData>({
    queryKey: ["exec360-blocos", ibge],
    queryFn: () =>
      api.get(`/api/dashboard-exec/blocos?ibge=${ibge}`,
        { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data),
    staleTime: 120_000,
    refetchInterval: 120_000,
  });

  const { data: alertas } = useQuery<AlertasData>({
    queryKey: ["exec360-alertas", ibge],
    queryFn: () =>
      api.get(`/api/dashboard-exec/alertas?ibge=${ibge}`,
        { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data),
    staleTime: 120_000,
  });

  const blocos = data?.blocos ?? [];
  const totalCriticos = blocos.flatMap(b => b.indicadores)
    .filter(i => i.status === "critico").length;
  const totalAlertas = blocos.flatMap(b => b.indicadores)
    .filter(i => i.status === "alerta").length;
  const comDado = blocos.filter(b => b.situacao_dado !== "nao_disponivel").length;

  return (
    <div style={{ fontFamily:"Inter, system-ui, sans-serif", background:"#f4f6f8", minHeight:"100vh" }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#1e40af 100%)",
        padding:"20px 28px" }}>
        <div style={{ display:"flex", alignItems:"flex-start",
          justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
              <div style={{ background:"rgba(255,255,255,.15)", borderRadius:8, padding:6 }}>
                <Activity size={20} color="#fff"/>
              </div>
              <span style={{ fontWeight:900, fontSize:22, color:"#fff", letterSpacing:-0.5 }}>
                ERSUS 360
              </span>
              <span style={{ fontSize:10, fontWeight:800,
                background:"rgba(255,255,255,.2)", color:"#bfdbfe",
                padding:"2px 10px", borderRadius:10 }}>
                DASHBOARD EXECUTIVO
              </span>
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,.6)" }}>
              Dados reais · {comDado}/{blocos.length} áreas com dado disponível
              {data?.verificado_em &&
                ` · ${data.verificado_em.slice(0,16).replace("T"," ")} UTC`
              }
            </div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <MunicipioSeletor onChange={setIbge}/>
            <button onClick={() => refetch()}
              style={{ display:"flex", alignItems:"center", gap:6,
                padding:"7px 12px", borderRadius:8,
                border:"1px solid rgba(255,255,255,.3)",
                background:"rgba(255,255,255,.1)", color:"#fff",
                fontSize:11, fontWeight:600, cursor:"pointer" }}>
              <RefreshCw size={11}
                style={{ animation: isLoading ? "spin 1s linear infinite" : "none" }}/>
              Atualizar
            </button>
          </div>
        </div>

        {/* Barra de status */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)",
          gap:8, marginTop:16 }}>
          {[
            { l:"Críticos",        v: alertas?.criticos ?? totalCriticos, cor:"#fca5a5", Icon:AlertTriangle },
            { l:"Alertas",         v: alertas?.total_alertas ?? totalAlertas, cor:"#fde68a", Icon:AlertTriangle },
            { l:"Áreas c/ dado",   v: comDado,           cor:"#86efac", Icon:CheckCircle },
            { l:"Total de áreas",  v: blocos.length,     cor:"#bfdbfe", Icon:Activity },
          ].map(k => (
            <div key={k.l} style={{ background:"rgba(255,255,255,.1)", borderRadius:10,
              padding:"10px 14px", display:"flex", alignItems:"center", gap:10 }}>
              <k.Icon size={14} color={k.cor}/>
              <div>
                <div style={{ fontSize:20, fontWeight:900, color:k.cor, lineHeight:1 }}>
                  {k.v ?? "—"}
                </div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,.5)", marginTop:1 }}>
                  {k.l}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid de módulos */}
      <div style={{ padding:"20px 28px 60px" }}>
        {isLoading && (
          <div style={{ textAlign:"center", padding:60, color:"#94a3b8" }}>
            <RefreshCw size={28} style={{ animation:"spin 1s linear infinite" }}/>
            <div style={{ marginTop:10, fontSize:13 }}>Carregando dados reais…</div>
          </div>
        )}
        {!isLoading && blocos.length > 0 && (
          <>
            <div style={{ fontSize:10, fontWeight:700, color:"#9ca3af",
              marginBottom:12, letterSpacing:0.5, textTransform:"uppercase" as const }}>
              {blocos.length} áreas · indicadores com situação do dado em tempo real
            </div>
            <div style={{ display:"grid",
              gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
              {blocos.map((b, i) => <BlocoModulo key={i} b={b}/>)}
            </div>
          </>
        )}

        {/* Nota de integridade */}
        {data && (
          <div style={{ marginTop:20, padding:"10px 14px", background:"#f8fafc",
            border:"1px solid #e2e8f0", borderRadius:10,
            fontSize:11, color:"#94a3b8",
            display:"flex", alignItems:"flex-start", gap:6 }}>
            <Info size={12} style={{ flexShrink:0, marginTop:1 }}/>
            {data.nota}
          </div>
        )}
      </div>
    </div>
  );
}
