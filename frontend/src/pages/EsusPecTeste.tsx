// e-SUS PEC — servidor de teste (homologação/treinamento) do município
// O ERSUS360 só confere se o endereço responde; o login no PEC é do próprio usuário, no navegador.
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ExternalLink, FlaskConical, Info, RefreshCw } from "lucide-react";
import { api } from "../lib/api";

interface StatusPecTeste {
  status: "nao_configurado" | "url_invalida" | "online" | "offline" | "erro_servidor";
  mensagem: string; variavel: string; url: string | null; online: boolean | null;
  http_status: number | null; tempo_ms: number | null; verificado_em: string;
}

const card: React.CSSProperties = { background: "#fff", color: "#1f2937", borderRadius: 8, border: "1px solid #e5e5e3", padding: 16, marginBottom: 12 };
const COR = { ok: "#16a34a", alerta: "#d97706", erro: "#dc2626", neutro: "#6b7280" } as const;
const horaBr = (d?: string) => (d ? new Date(d).toLocaleString("pt-BR") : "—");

export default function EsusPecTeste() {
  const q = useQuery({
    queryKey: ["esus-pec-teste"],
    queryFn: () => api.get<StatusPecTeste>("/api/esus-pec-teste/status").then(r => r.data),
    staleTime: 60_000,
  });
  const s = q.data;
  const cor = !s ? COR.neutro : s.status === "online" ? COR.ok : s.status === "nao_configurado" ? COR.alerta : COR.erro;
  const Icone = s?.status === "online" ? CheckCircle2 : AlertTriangle;

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 22, margin: "0 0 4px", color: "#1f2937" }}>
        <FlaskConical size={22} /> e-SUS PEC — Servidor de Teste
      </h1>
      <p style={{ color: "#6b7280", margin: "0 0 16px" }}>
        Ambiente de teste/treinamento do e-SUS APS PEC do município, separado do PEC de produção.
      </p>

      <div style={{ ...card, borderLeft: `4px solid ${cor}` }}>
        {q.isLoading && <span>Verificando o servidor de teste…</span>}
        {q.isError && <span style={{ color: COR.erro }}>Não foi possível consultar a situação (perfil sem acesso ou API fora do ar).</span>}
        {s && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: cor }}>
              <Icone size={18} /> {s.mensagem}
            </div>
            <div style={{ marginTop: 10, fontSize: 14, display: "grid", gridTemplateColumns: "180px 1fr", rowGap: 4 }}>
              <span style={{ color: "#6b7280" }}>Variável no Railway</span><code>{s.variavel}</code>
              {s.url && <><span style={{ color: "#6b7280" }}>Endereço</span><code>{s.url}</code></>}
              {s.http_status !== null && <><span style={{ color: "#6b7280" }}>Resposta HTTP</span><span>{s.http_status}</span></>}
              {s.tempo_ms !== null && <><span style={{ color: "#6b7280" }}>Tempo de resposta</span><span>{s.tempo_ms} ms</span></>}
              <span style={{ color: "#6b7280" }}>Verificado em</span><span>{horaBr(s.verificado_em)}</span>
            </div>
          </>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <button onClick={() => q.refetch()} disabled={q.isFetching}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}>
            <RefreshCw size={14} /> {q.isFetching ? "Verificando…" : "Verificar novamente"}
          </button>
          {s?.url && (
            <a href={s.url} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, background: "#2563eb", color: "#fff", textDecoration: "none" }}>
              <ExternalLink size={14} /> Abrir PEC de teste
            </a>
          )}
        </div>
      </div>

      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, marginBottom: 6 }}><Info size={16} /> Como funciona</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
          <li>O endereço do servidor de teste fica só na variável <code>{s?.variavel ?? "ESUS_PEC_TESTE_URL_{IBGE}"}</code> no Railway (ex.: <code>https://pec-teste.exemplo.gov.br</code>).</li>
          <li>O ERSUS360 apenas confere se o endereço responde: não faz login, não lê dados de cidadãos e não grava nada no PEC.</li>
          <li>O acesso ao PEC de teste é feito por você, no navegador, com o seu usuário do PEC.</li>
          <li>O Painel ACS continua vindo somente do agente local (PEC_SYNC_AGENT) do PEC de produção.</li>
        </ul>
      </div>
    </div>
  );
}
