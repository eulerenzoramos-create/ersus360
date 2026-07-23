import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "../lib/api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Monitor, AlertTriangle, Wifi, Activity, Settings, CheckCircle, XCircle, RefreshCw } from "lucide-react";

const BRAND  = "#1e3a5f";
const ACCENT = "#2563eb";
const OK     = "#16a34a";
const WARN   = "#d97706";
const CRIT   = "#dc2626";

function statusColor(s: string) {
  if (s === "ok" || s === "ATINGIDO") return OK;
  if (s === "atencao" || s === "EM_ANDAMENTO") return WARN;
  return CRIT;
}

const KPI = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-bold mt-1" style={{ color: color || BRAND }}>{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </div>
);

const ProgressBar = ({ value, max, color }: { value: number; max: number; color: string }) => (
  <div className="w-full bg-slate-100 rounded-full h-2">
    <div className="h-2 rounded-full" style={{ width: `${Math.min(value / max * 100, 100)}%`, background: color }} />
  </div>
);

// ── Banner de status do e-SUS PEC ─────────────────────────────────────────────
function PecStatusBanner({ onConfig }: { onConfig: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["pec-status"],
    queryFn: () => apiGet("/api/saude-digital-esus/pec/status"),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const pec = data as any;

  if (isLoading) return null;

  const conectado = pec?.conectado;
  const autenticado = conectado && (pec?.instancia || pec?.versao);
  const bgColor = autenticado ? "#f0fdf4" : conectado ? "#fffbeb" : "#fef2f2";
  const borderColor = autenticado ? "#bbf7d0" : conectado ? "#fde68a" : "#fecaca";
  const textColor = autenticado ? OK : conectado ? WARN : CRIT;

  return (
    <div style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 10,
      padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center",
      justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {autenticado
          ? <CheckCircle size={16} color={OK} />
          : conectado
            ? <AlertTriangle size={16} color={WARN} />
            : <XCircle size={16} color={CRIT} />}
        <span style={{ fontSize: 13, color: textColor, fontWeight: 600 }}>
          {autenticado
            ? `e-SUS PEC conectado${pec.instancia ? ` — ${pec.instancia}` : ""}${pec.versao ? ` v${pec.versao}` : ""}`
            : conectado
              ? `e-SUS PEC acessível mas não autenticado — verifique usuário/senha (Railway)`
              : `e-SUS PEC não acessível${pec?.url ? ` (${pec.url})` : ""} — configure a URL correta`}
        </span>
        {pec?.fonte === "fallback" && (
          <span style={{ fontSize: 11, color: "#64748b", background: "#f1f5f9",
            borderRadius: 6, padding: "1px 8px", border: "1px solid #e2e8f0" }}>
            dados de demonstração
          </span>
        )}
      </div>
      <button onClick={onConfig}
        style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12,
          color: ACCENT, background: "white", border: "1px solid #bfdbfe",
          borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 500 }}>
        <Settings size={12} /> Configurar
      </button>
    </div>
  );
}

// ── Painel de configuração ─────────────────────────────────────────────────────
function PecConfigPanel({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<any>(null);

  const testar = useMutation({
    mutationFn: (u: string) => apiPost("/api/saude-digital-esus/pec/testar-conexao", { url: u }),
    onSuccess: (data) => { setResult(data); qc.invalidateQueries({ queryKey: ["pec-status"] }); },
  });

  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12,
      padding: 20, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontWeight: 700, color: BRAND, fontSize: 14 }}>Configuração do e-SUS PEC</span>
        <button onClick={onClose} style={{ fontSize: 18, color: "#94a3b8", background: "none",
          border: "none", cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>

      <div style={{ fontSize: 13, color: "#475569", marginBottom: 12, lineHeight: 1.6 }}>
        <p>O e-SUS PEC precisa estar <strong>acessível pela internet</strong> para que o ERSUS360 se conecte.</p>
        <p style={{ marginTop: 4 }}>
          Configure as variáveis no <strong>Railway</strong>:<br />
          <code style={{ background: "#f8fafc", padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>
            ESUS_URL</code> · <code style={{ background: "#f8fafc", padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>
            ESUS_USUARIO</code> · <code style={{ background: "#f8fafc", padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>
            ESUS_SENHA</code>
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          type="url"
          placeholder="https://esus.seumunicípio.gov.br"
          value={url}
          onChange={e => setUrl(e.target.value)}
          style={{ flex: 1, padding: "8px 12px", fontSize: 13, border: "1px solid #e2e8f0",
            borderRadius: 8, outline: "none" }}
        />
        <button
          onClick={() => url.trim() && testar.mutate(url.trim())}
          disabled={testar.isPending || !url.trim()}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
            background: ACCENT, color: "white", border: "none", borderRadius: 8,
            fontSize: 13, cursor: "pointer", opacity: testar.isPending ? 0.7 : 1 }}>
          {testar.isPending && <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} />}
          Testar
        </button>
      </div>

      {result && (
        <div style={{ fontSize: 12, padding: "8px 12px", borderRadius: 8, marginTop: 4,
          background: result.conectado ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${result.conectado ? "#bbf7d0" : "#fecaca"}`,
          color: result.conectado ? OK : CRIT }}>
          {result.conectado
            ? `✓ Acessível${result.instancia ? ` — ${result.instancia}` : ""}${result.versao ? ` v${result.versao}` : ""}. Salve a URL no Railway como ESUS_URL.`
            : `✗ Não foi possível conectar: ${result.erro || "sem resposta"}`}
        </div>
      )}

      <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 10 }}>
        Após salvar as variáveis no Railway, aguarde o redeploy (~1 min) e clique em "Configurar" novamente para verificar.
      </p>
    </div>
  );
}

// ── Aba e-SUS PEC — dados reais ───────────────────────────────────────────────
function TabPEC() {
  const hoje = new Date();
  const defaultComp = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  const [comp, setComp] = useState(defaultComp);

  const { data: prod, isLoading: loadProd } = useQuery({
    queryKey: ["pec-producao", comp],
    queryFn: () => apiGet(`/api/saude-digital-esus/pec/producao?competencia=${comp}`),
  });
  const { data: cad } = useQuery({
    queryKey: ["pec-cadastros"],
    queryFn: () => apiGet("/api/saude-digital-esus/pec/cadastros"),
  });
  const { data: unidades } = useQuery({
    queryKey: ["pec-unidades"],
    queryFn: () => apiGet("/api/saude-digital-esus/pec/unidades"),
  });
  const { data: profissionais } = useQuery({
    queryKey: ["pec-profissionais"],
    queryFn: () => apiGet("/api/saude-digital-esus/pec/profissionais"),
  });
  const { data: indAps } = useQuery({
    queryKey: ["pec-indicadores-aps"],
    queryFn: () => apiGet("/api/saude-digital-esus/pec/indicadores-aps"),
  });

  const p = prod as any;
  const c = cad as any;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Competência */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <label style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>Competência:</label>
        <input type="month" value={comp} onChange={e => setComp(e.target.value)}
          style={{ padding: "5px 10px", border: "1px solid #e2e8f0", borderRadius: 8,
            fontSize: 13, outline: "none", color: BRAND }} />
        {p?.fonte === "fallback" && (
          <span style={{ fontSize: 11, color: "#64748b", background: "#f1f5f9",
            borderRadius: 6, padding: "2px 8px", border: "1px solid #e2e8f0" }}>
            demonstração
          </span>
        )}
      </div>

      {/* Produção */}
      {!loadProd && p && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 style={{ fontWeight: 700, color: BRAND, fontSize: 14, marginBottom: 12 }}>
            Produção — {p.competencia}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[
              ["Atend. Individuais",    p.atendimentos_individuais,   ACCENT],
              ["Atend. Odontológicos",  p.atendimentos_odontologicos, "#7c3aed"],
              ["Visitas Domiciliares",  p.visitas_domiciliares,       "#0891b2"],
              ["Procedimentos",         p.procedimentos,              "#d97706"],
              ["Atividades Coletivas",  p.atividades_coletivas,       OK],
              ["Encaminhamentos",       p.encaminhamentos,            "#64748b"],
            ].map(([l, v, c]) => (
              <div key={l as string} style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: c as string }}>
                  {(v as number).toLocaleString("pt-BR")}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{l as string}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cadastros */}
      {c && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          <KPI label="Cidadãos cadastrados"  value={(c.individuais || 0).toLocaleString("pt-BR")} color={ACCENT} />
          <KPI label="Domicílios cadastrados" value={(c.domiciliares || 0).toLocaleString("pt-BR")} color={BRAND} />
          <KPI label="Atualiz. (12 meses)"   value={(c.atualizados_12m || 0).toLocaleString("pt-BR")} color={OK} />
        </div>
      )}

      {/* Unidades */}
      {Array.isArray(unidades) && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 style={{ fontWeight: 700, color: BRAND, fontSize: 14, marginBottom: 10 }}>
            Unidades de Saúde ({(unidades as any[]).length})
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Nome", "CNES", "Tipo"].map(h => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: "left",
                      color: "#475569", fontWeight: 600, fontSize: 11,
                      borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(unidades as any[]).map((u: any, i: number) => (
                  <tr key={u.id || i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "7px 10px", color: BRAND, fontWeight: 500 }}>{u.nome}</td>
                    <td style={{ padding: "7px 10px", color: "#64748b", fontFamily: "monospace" }}>{u.cnes}</td>
                    <td style={{ padding: "7px 10px", color: "#475569" }}>{u.tipo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Profissionais */}
      {Array.isArray(profissionais) && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 style={{ fontWeight: 700, color: BRAND, fontSize: 14, marginBottom: 10 }}>
            Profissionais de Saúde ({(profissionais as any[]).length})
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Nome", "CBO", "Unidade", "Equipe"].map(h => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: "left",
                      color: "#475569", fontWeight: 600, fontSize: 11,
                      borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(profissionais as any[]).map((pr: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "7px 10px", color: BRAND, fontWeight: 500 }}>{pr.nome}</td>
                    <td style={{ padding: "7px 10px", color: "#64748b" }}>{pr.cbo}</td>
                    <td style={{ padding: "7px 10px", color: "#475569" }}>{pr.unidade}</td>
                    <td style={{ padding: "7px 10px", color: "#475569" }}>{pr.equipe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Indicadores APS */}
      {Array.isArray(indAps) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h3 style={{ fontWeight: 700, color: BRAND, fontSize: 14 }}>Indicadores APS</h3>
          {(indAps as any[]).map((ind: any) => (
            <div key={ind.indicador} style={{ background: "white", borderRadius: 10,
              border: "1px solid #e2e8f0", padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                  {ind.indicador}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700,
                  color: statusColor(ind.situacao || ""), background: "#f8fafc",
                  padding: "2px 8px", borderRadius: 20, border: "1px solid #e2e8f0" }}>
                  {ind.alcancado}% / {ind.meta}%
                </span>
              </div>
              <ProgressBar value={ind.alcancado} max={ind.meta}
                color={statusColor(ind.situacao || "")} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ── Página principal ──────────────────────────────────────────────────────────
export default function SaudeDigitalEsus() {
  const [aba, setAba] = useState("pec");
  const [showConfig, setShowConfig] = useState(false);

  const { data: dash } = useQuery({
    queryKey: ["sde-dashboard"],
    queryFn: () => apiGet("/api/saude-digital-esus/dashboard"),
    enabled: aba === "dashboard",
  });
  const { data: sistemas } = useQuery({
    queryKey: ["sde-sistemas"],
    queryFn: () => apiGet("/api/saude-digital-esus/sistemas"),
    enabled: aba === "sistemas",
  });
  const { data: prontuario } = useQuery({
    queryKey: ["sde-prontuario"],
    queryFn: () => apiGet("/api/saude-digital-esus/prontuario-digital"),
    enabled: aba === "prontuario",
  });
  const { data: conectividade } = useQuery({
    queryKey: ["sde-conectividade"],
    queryFn: () => apiGet("/api/saude-digital-esus/conectividade"),
    enabled: aba === "conectividade",
  });
  const { data: historico } = useQuery({
    queryKey: ["sde-historico"],
    queryFn: () => apiGet("/api/saude-digital-esus/historico"),
    enabled: aba === "historico",
  });
  const { data: indicadores } = useQuery({
    queryKey: ["sde-indicadores"],
    queryFn: () => apiGet("/api/saude-digital-esus/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;
  const pronRaw = prontuario as any;

  const ABAS = [
    { key: "pec",          label: "e-SUS PEC",     icon: <Activity size={15}/> },
    { key: "dashboard",    label: "Dashboard",      icon: <Monitor size={15}/> },
    { key: "sistemas",     label: "Sistemas",       icon: <Monitor size={15}/> },
    { key: "prontuario",   label: "Prontuário",     icon: <Activity size={15}/> },
    { key: "conectividade",label: "Conectividade",  icon: <Wifi size={15}/> },
    { key: "historico",    label: "Histórico",      icon: <Activity size={15}/> },
    { key: "indicadores",  label: "Indicadores",    icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Monitor size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Digital / e-SUS</h1>
            <p className="text-sm text-slate-500">PEC · SISAB · RNDS · ConecteSUS · GAL · Conectividade · FMS Apuí/AM</p>
          </div>
        </div>

        <PecStatusBanner onConfig={() => setShowConfig(!showConfig)} />
        {showConfig && <PecConfigPanel onClose={() => setShowConfig(false)} />}

        <div className="flex gap-2 mb-6 flex-wrap">
          {ABAS.map((a) => (
            <button key={a.key} onClick={() => setAba(a.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={aba === a.key ? { background: BRAND, color: "white" } : { background: "white", color: "#475569", border: "1px solid #e2e8f0" }}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>

        {aba === "pec" && <TabPEC />}

        {aba === "dashboard" && dashRaw && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Atend. Digitais/Mês"  value={dashRaw.atendimentos_digitais_mes.toLocaleString()} color={ACCENT} />
              <KPI label="Atend. em Papel/Mês"  value={dashRaw.atendimentos_papel_mes.toString()}         color={WARN} />
              <KPI label="Adesão PEC"           value={`${dashRaw.adesao_pec_pct}%`}                      color={dashRaw.adesao_pec_pct >= 95 ? OK : WARN} />
              <KPI label="Cobertura Prontuário" value={`${dashRaw.cobertura_prontuario_pct}%`}             color={dashRaw.cobertura_prontuario_pct >= 80 ? OK : CRIT} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Sistemas OK"          value={`${dashRaw.sistemas_ok}/${dashRaw.sistemas_monitorados}`} color={OK} />
              <KPI label="Sistemas Críticos"    value={dashRaw.sistemas_criticos.toString()}              color={CRIT} />
              <KPI label="Fichas Pend. SISAB"   value={dashRaw.fichas_pendentes_sisab.toString()}          color={WARN} />
              <KPI label="Unidades RNDS"        value={`${dashRaw.unidades_rnds_integradas}/8`}           color={CRIT} sub="integradas à RNDS" />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <b>RNDS crítico</b> — apenas {dashRaw.unidades_rnds_integradas} de 8 unidades integradas à Rede Nacional de Dados em Saúde. Uptime médio: {dashRaw.uptime_medio_pct}% — UBSF Juma (71%) e Mapari (68%) com conectividade insuficiente para PEC.
            </div>
          </div>
        )}

        {aba === "sistemas" && Array.isArray(sistemas) && (
          <div className="grid gap-3">
            {(sistemas as any[]).map((sis: any) => (
              <div key={sis.sistema} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor(sis.status) }} />
                    <span className="font-semibold text-slate-700 text-sm">{sis.sistema}</span>
                    {sis.versao !== "—" && <span className="text-xs text-slate-400">v{sis.versao}</span>}
                  </div>
                  <span className="font-bold text-sm" style={{ color: statusColor(sis.status) }}>
                    {sis.sincronizacao_ok_pct}% sync
                  </span>
                </div>
                <div className="mb-2">
                  <ProgressBar value={sis.sincronizacao_ok_pct} max={100} color={statusColor(sis.status)} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                  <span>Unidades ativas: <b>{sis.unidades_ativas}/{sis.unidades_total}</b></span>
                  {sis.producao_mes && <span>Produção/mês: <b>{sis.producao_mes.toLocaleString()}</b></span>}
                  {sis.ultima_sync && <span>Último sync: <b>{sis.ultima_sync}</b></span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "prontuario" && pronRaw && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <KPI label="Pacientes com PEC"     value={pronRaw.pacientes_com_pec.toLocaleString()}   color={ACCENT} />
              <KPI label="Total Cadastrados"     value={pronRaw.pacientes_cadastrados_total.toLocaleString()} />
              <KPI label="Cobertura PEC"         value={`${pronRaw.cobertura_pec_pct}%`}              color={pronRaw.cobertura_pec_pct >= 80 ? OK : CRIT} />
              <KPI label="Profissionais Ativos"  value={`${pronRaw.profissionais_ativos_pec}/${pronRaw.profissionais_total}`} color={ACCENT} />
              <KPI label="Adesão Profissionais"  value={`${pronRaw.adesao_pec_pct}%`}                 color={pronRaw.adesao_pec_pct >= 95 ? OK : WARN} />
              <KPI label="Prescrição Eletrônica" value={`${pronRaw.prescricoes_eletronicas_pct}%`}    color={pronRaw.prescricoes_eletronicas_pct >= 95 ? OK : WARN} />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="font-semibold text-slate-700">Cobertura Digital vs Meta (90%)</h3>
              {[
                { label: "Pacientes com Prontuário PEC", val: pronRaw.cobertura_pec_pct },
                { label: "Adesão dos Profissionais",     val: pronRaw.adesao_pec_pct },
                { label: "Prescrições Eletrônicas",      val: pronRaw.prescricoes_eletronicas_pct },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>{item.label}</span>
                    <span className="font-bold" style={{ color: item.val >= 90 ? OK : item.val >= 75 ? WARN : CRIT }}>{item.val}%</span>
                  </div>
                  <ProgressBar value={item.val} max={100} color={item.val >= 90 ? OK : item.val >= 75 ? WARN : CRIT} />
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "conectividade" && Array.isArray(conectividade) && (
          <div className="grid gap-3">
            {(conectividade as any[]).map((u: any) => (
              <div key={u.unidade} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor(u.status) }} />
                    <span className="font-semibold text-slate-700 text-sm">{u.unidade}</span>
                  </div>
                  <span className="font-bold text-sm" style={{ color: statusColor(u.status) }}>
                    {u.uptime_pct}% uptime
                  </span>
                </div>
                <div className="mb-2">
                  <ProgressBar value={u.uptime_pct} max={100} color={statusColor(u.status)} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                  <span>Tipo: <b>{u.tipo_conexao}</b></span>
                  <span>Velocidade: <b>{u.velocidade_mbps} Mbps</b></span>
                  <span style={{ color: u.backup_4g ? OK : WARN }}>4G backup: <b>{u.backup_4g ? "Sim" : "Não"}</b></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal (2026)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" domain={[84, 95]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="atendimentos_digitais"         name="Atend. Digitais"  stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="fichas_sinan_transmitidas_pct" name="SISAB Transm. %"  stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="pct" dataKey="uptime_medio_pct"              name="Uptime Médio %"   stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {aba === "indicadores" && Array.isArray(indicadores) && (
          <div className="grid gap-3">
            {(indicadores as any[]).map((ind: any) => (
              <div key={ind.indicador} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-4">
                <div className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(ind.status) }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 text-sm">{ind.indicador}</span>
                    <span className="font-bold text-sm" style={{ color: statusColor(ind.status) }}>
                      {`${ind.valor} ${ind.unidade}`}{ind.meta != null ? ` / meta: ${ind.meta} ${ind.unidade}` : ""}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{ind.observacao}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
