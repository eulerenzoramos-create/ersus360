import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import { apiGet } from "../lib/api"
import { Wifi, WifiOff, AlertCircle, CheckCircle, RefreshCw, Database, Activity } from "lucide-react"

const BRAND = "#dbeafe"
const ACCENT = "#1d4ed8"
const OK = "#16a34a"
const WARN = "#d97706"
const CRIT = "#dc2626"
const ABAS = ["Status", "FNS", "e-Gestor", "e-SUS PEC", "SIAPS"]

type FonteStatus = "ok" | "degradado" | "offline"

function StatusBadge({ status, fonte }: { status: FonteStatus; fonte: string }) {
  const color = status === "ok" ? OK : status === "degradado" ? WARN : CRIT
  const Icon = status === "ok" ? CheckCircle : status === "degradado" ? AlertCircle : WifiOff
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 12, background: color + "22", color, fontWeight: 600, fontSize: 12 }}>
      <Icon size={12} /> {status.toUpperCase()} · {fonte}
    </span>
  )
}

function KPI({ label, value, sub, color = BRAND }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 18px", minWidth: 130 }}>
      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function SistemaCard({ nome, status, fonte, ts, credOk, items }: { nome: string; status: FonteStatus; fonte: string; ts: string; credOk: boolean; items: { label: string; value: string | number }[] }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, color: BRAND, fontSize: 16 }}>{nome}</div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{ts}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
          <StatusBadge status={status} fonte={fonte} />
          <span style={{ fontSize: 11, color: credOk ? OK : CRIT }}>
            {credOk ? "✓ Credenciais OK" : "✗ Credenciais não configuradas"}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {items.map(i => (
          <div key={i.label} style={{ background: "#f9fafb", borderRadius: 8, padding: "8px 14px" }}>
            <div style={{ fontSize: 10, color: "#6b7280" }}>{i.label}</div>
            <div style={{ fontWeight: 700, color: BRAND }}>{i.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function IntegracaoTempoRealApui() {
  const [aba, setAba] = useState("Status")

  const fnsStatus   = useQuery({ queryKey: ["fns-status"],     queryFn: () => apiGet("/api/integracao-fns-apui/status"),       enabled: aba === "Status" || aba === "FNS", staleTime: 60000 })
  const fnsDash     = useQuery({ queryKey: ["fns-dashboard"],  queryFn: () => apiGet("/api/integracao-fns-apui/dashboard"),    enabled: aba === "FNS",     staleTime: 60000 })
  const fnsRep      = useQuery({ queryKey: ["fns-repasses"],   queryFn: () => apiGet("/api/integracao-fns-apui/repasses-sus"), enabled: aba === "FNS",     staleTime: 60000 })
  const fnsTrans    = useQuery({ queryKey: ["fns-trans"],      queryFn: () => apiGet("/api/integracao-fns-apui/transferencias"),enabled: aba === "FNS",    staleTime: 60000 })

  const egestStatus = useQuery({ queryKey: ["egest-status"],   queryFn: () => apiGet("/api/integracao-egestor-apui/status"),   enabled: aba === "Status" || aba === "e-Gestor", staleTime: 60000 })
  const egestDash   = useQuery({ queryKey: ["egest-dash"],     queryFn: () => apiGet("/api/integracao-egestor-apui/dashboard"),enabled: aba === "e-Gestor", staleTime: 60000 })
  const egestEq     = useQuery({ queryKey: ["egest-equipes"],  queryFn: () => apiGet("/api/integracao-egestor-apui/equipes"),  enabled: aba === "e-Gestor", staleTime: 60000 })
  const egestProf   = useQuery({ queryKey: ["egest-prof"],     queryFn: () => apiGet("/api/integracao-egestor-apui/profissionais"), enabled: aba === "e-Gestor", staleTime: 60000 })

  const esusStatus  = useQuery({ queryKey: ["esus-status"],    queryFn: () => apiGet("/api/integracao-esuspec-apui/status"),   enabled: aba === "Status" || aba === "e-SUS PEC", staleTime: 60000 })
  const esusDash    = useQuery({ queryKey: ["esus-dash"],      queryFn: () => apiGet("/api/integracao-esuspec-apui/dashboard"),enabled: aba === "e-SUS PEC", staleTime: 60000 })
  const esusVac     = useQuery({ queryKey: ["esus-vac"],       queryFn: () => apiGet("/api/integracao-esuspec-apui/vacinacao"),enable: aba === "e-SUS PEC", staleTime: 60000 })
  const esusAte     = useQuery({ queryKey: ["esus-ate"],       queryFn: () => apiGet("/api/integracao-esuspec-apui/atendimentos"), enabled: aba === "e-SUS PEC", staleTime: 60000 })

  const siapsStatus = useQuery({ queryKey: ["siaps-status"],   queryFn: () => apiGet("/api/integracao-siaps-apui/status"),     enabled: aba === "Status" || aba === "SIAPS", staleTime: 60000 })
  const siapsDash   = useQuery({ queryKey: ["siaps-dash"],     queryFn: () => apiGet("/api/integracao-siaps-apui/dashboard"),  enabled: aba === "SIAPS",    staleTime: 60000 })
  const siapsEst    = useQuery({ queryKey: ["siaps-estoque"],  queryFn: () => apiGet("/api/integracao-siaps-apui/estoque"),    enabled: aba === "SIAPS",    staleTime: 60000 })

  const fnsS   = fnsStatus.data   as any
  const egestS = egestStatus.data as any
  const esusS  = esusStatus.data  as any
  const siapsS = siapsStatus.data as any
  const fnsDashRaw   = fnsDash.data   as any
  const egestDashRaw = egestDash.data as any
  const esusDashRaw  = esusDash.data  as any
  const siapsDashRaw = siapsDash.data as any
  const fnsRepRaw    = fnsRep.data    as any
  const fnsTrRaw     = fnsTrans.data  as any
  const egestEqRaw   = egestEq.data   as any
  const egestPrRaw   = egestProf.data as any
  const esusVacRaw   = esusVac.data   as any
  const esusAteRaw   = esusAte.data   as any
  const siapsEstRaw  = siapsEst.data  as any

  const sistemas = [
    { id: "fns",       nome: "FNS",       s: fnsS,   d: fnsDashRaw   },
    { id: "egestor",   nome: "e-Gestor",  s: egestS, d: egestDashRaw },
    { id: "esuspec",   nome: "e-SUS PEC", s: esusS,  d: esusDashRaw  },
    { id: "siaps",     nome: "SIAPS",     s: siapsS, d: siapsDashRaw },
  ]

  const onlineCount = sistemas.filter(s => s.d && s.d.status === "ok").length

  return (
    <div style={{ padding: "24px 32px", fontFamily: "Inter,sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Wifi size={28} color={ACCENT} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: BRAND }}>Integração em Tempo Real</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>e-Gestor AB · e-SUS PEC · FNS · SIAPS — Apuí/AM (IBGE 1300144)</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <KPI label="Sistemas" value={`${onlineCount}/4`} sub="online" color={onlineCount === 4 ? OK : onlineCount > 1 ? WARN : CRIT} />
        </div>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {ABAS.map(a => (
          <button key={a} onClick={() => setAba(a)} style={{
            padding: "6px 18px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13,
            background: aba === a ? ACCENT : "#e5e7eb", color: aba === a ? "#fff" : "#374151",
          }}>{a}</button>
        ))}
      </div>

      {/* ABA STATUS */}
      {aba === "Status" && (
        <div>
          <div style={{ marginBottom: 20, fontWeight: 700, color: BRAND }}>Status de Conectividade — Sistemas Federais</div>
          {sistemas.map(({ nome, s, d }) => (
            <SistemaCard
              key={nome}
              nome={nome}
              status={(d?.status ?? s?.status ?? "offline") as FonteStatus}
              fonte={d?.fonte ?? "—"}
              ts={d?.ultima_atualizacao ?? s?.ultima_verificacao ?? "—"}
              credOk={s?.credenciais_configuradas ?? false}
              items={d ? [
                ...Object.entries(d).filter(([k]) => !["status","fonte","ultima_atualizacao","municipio","ibge","credenciais_ok"].includes(k))
                  .slice(0, 5)
                  .map(([k, v]) => ({ label: k.replace(/_/g, " "), value: String(v) }))
              ] : []}
            />
          ))}
          <div style={{ background: "#fff3cd", border: "1px solid #ffd07a", borderRadius: 10, padding: 16, marginTop: 8, fontSize: 13, color: "#7c4a00" }}>
            <b>Configuração necessária:</b> Adicionar as seguintes variáveis de ambiente no Railway para ativar cada sistema:
            <ul style={{ margin: "8px 0 0 16px" }}>
              <li><b>FNS/Transparência:</b> TRANSPARENCIA_API_KEY, FNS_API_CPF ✓ (já configurado), FNS_API_SENHA ✓</li>
              <li><b>e-Gestor AB:</b> EGESTOR_USUARIO, EGESTOR_SENHA, EGESTOR_TOKEN</li>
              <li><b>e-SUS PEC / RNDS:</b> RNDS_CLIENT_ID, RNDS_CLIENT_SECRET, RNDS_CERT_B64, RNDS_CERT_PASSWORD</li>
              <li><b>SIAPS / HORUS:</b> SIAPS_TOKEN</li>
            </ul>
          </div>
        </div>
      )}

      {/* ABA FNS */}
      {aba === "FNS" && (
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
            <KPI label="Total Repassado 2025" value={fnsDashRaw ? `R$ ${(fnsDashRaw.total_repassado_2025/1e6).toFixed(2)}M` : "—"} color={ACCENT} />
            <KPI label="Blocos de Financiamento" value={fnsDashRaw?.blocos ?? "—"} />
            <KPI label="Competência" value={fnsDashRaw?.competencia_atual ?? "—"} />
            <KPI label="Pendências" value={fnsDashRaw?.pendencias ?? "—"} color={fnsDashRaw?.pendencias > 0 ? WARN : OK} />
          </div>
          {fnsRepRaw?.dados && Array.isArray(fnsRepRaw.dados) && (
            <div style={{ background: "#fff", borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: BRAND, marginBottom: 12 }}>Repasses SUS por Bloco</div>
              <StatusBadge status={fnsRepRaw.status as FonteStatus} fonte={fnsRepRaw.fonte} />
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={fnsRepRaw.dados} margin={{ top: 10, right: 20, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="bloco" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tickFormatter={v => `R$ ${(v/1e6).toFixed(1)}M`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [`R$ ${(v/1000).toFixed(0)}k`, "Valor Anual"]} />
                  <Bar dataKey="valor_anual" fill={ACCENT} radius={[4,4,0,0]} name="Valor Anual" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {fnsTrRaw?.dados && Array.isArray(fnsTrRaw.dados) && (
            <div style={{ background: "#fff", borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: BRAND, marginBottom: 12 }}>Transferências Recentes</div>
              <StatusBadge status={fnsTrRaw.status as FonteStatus} fonte={fnsTrRaw.fonte} />
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12, fontSize: 13 }}>
                <thead><tr style={{ background: "#f3f4f6" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: BRAND }}>Programa</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", color: BRAND }}>Valor</th>
                  <th style={{ padding: "8px 12px", textAlign: "center", color: BRAND }}>Competência</th>
                  <th style={{ padding: "8px 12px", textAlign: "center", color: BRAND }}>Situação</th>
                </tr></thead>
                <tbody>{fnsTrRaw.dados.map((t: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "8px 12px" }}>{t.programa}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}>R$ {(t.valor/1000).toFixed(0)}k</td>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>{t.competencia}</td>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      <span style={{ color: t.situacao === "pago" ? OK : WARN, fontWeight: 600 }}>{t.situacao}</span>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ABA e-Gestor */}
      {aba === "e-Gestor" && (
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
            <KPI label="Equipes Cadastradas" value={egestDashRaw?.equipes_cadastradas ?? "—"} />
            <KPI label="Equipes Ativas" value={egestDashRaw?.equipes_ativas ?? "—"} color={OK} />
            <KPI label="Cobertura ESF" value={egestDashRaw ? `${egestDashRaw.cobertura_esf_pct}%` : "—"} color={ACCENT} />
            <KPI label="Pop. Cadastrada" value={egestDashRaw ? egestDashRaw.populacao_cadastrada.toLocaleString("pt-BR") : "—"} />
          </div>
          {egestEqRaw?.dados && Array.isArray(egestEqRaw.dados) && (
            <div style={{ background: "#fff", borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: BRAND, marginBottom: 12 }}>Equipes de Saúde da Família</div>
              <StatusBadge status={egestEqRaw.status as FonteStatus} fonte={egestEqRaw.fonte} />
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12, fontSize: 13 }}>
                <thead><tr style={{ background: "#f3f4f6" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: BRAND }}>Equipe</th>
                  <th style={{ padding: "8px 12px", textAlign: "center", color: BRAND }}>Tipo</th>
                  <th style={{ padding: "8px 12px", textAlign: "center", color: BRAND }}>Médico</th>
                  <th style={{ padding: "8px 12px", textAlign: "center", color: BRAND }}>ACS</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: BRAND }}>Área</th>
                  <th style={{ padding: "8px 12px", textAlign: "center", color: BRAND }}>CNES</th>
                </tr></thead>
                <tbody>{egestEqRaw.dados.map((e: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "8px 12px" }}>{e.equipe}</td>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>{e.tipo}</td>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      <span style={{ color: e.medico ? OK : CRIT }}>{e.medico ? "✓" : "✗"}</span>
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>{e.acs}</td>
                    <td style={{ padding: "8px 12px", fontSize: 11 }}>{e.area_cobertura}</td>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      <span style={{ color: e.status_cnes === "ativo" ? OK : WARN, fontWeight: 600 }}>{e.status_cnes}</span>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {egestPrRaw?.dados && Array.isArray(egestPrRaw.dados) && (
            <div style={{ background: "#fff", borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: BRAND, marginBottom: 12 }}>Profissionais de Saúde</div>
              <StatusBadge status={egestPrRaw.status as FonteStatus} fonte={egestPrRaw.fonte} />
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={egestPrRaw.dados} layout="vertical" margin={{ left: 120, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="categoria" type="category" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="qtd" fill={ACCENT} radius={[0,4,4,0]} name="Qtd" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ABA e-SUS PEC */}
      {aba === "e-SUS PEC" && (
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
            <KPI label="Atendimentos/Mês" value={esusDashRaw?.atendimentos_mes?.toLocaleString("pt-BR") ?? "—"} color={ACCENT} />
            <KPI label="Prescrições/Mês" value={esusDashRaw?.prescricoes_mes?.toLocaleString("pt-BR") ?? "—"} />
            <KPI label="Doses Vacinação" value={esusDashRaw?.doses_vacinacao_mes?.toLocaleString("pt-BR") ?? "—"} />
            <KPI label="Cobertura Vacinal Média" value={esusDashRaw ? `${esusDashRaw.cobertura_vacinal_media_pct}%` : "—"} color={OK} />
          </div>
          {esusAteRaw?.dados?.por_tipo && (
            <div style={{ background: "#fff", borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: BRAND, marginBottom: 12 }}>Atendimentos por Tipo — {esusAteRaw.dados.competencia}</div>
              <StatusBadge status={esusAteRaw.status as FonteStatus} fonte={esusAteRaw.fonte} />
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={esusAteRaw.dados.por_tipo} margin={{ top: 10, right: 20, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="tipo" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="qtd" fill={ACCENT} radius={[4,4,0,0]} name="Qtd" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {esusVacRaw?.dados && Array.isArray(esusVacRaw.dados) && (
            <div style={{ background: "#fff", borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: BRAND, marginBottom: 12 }}>Cobertura Vacinal</div>
              <StatusBadge status={esusVacRaw.status as FonteStatus} fonte={esusVacRaw.fonte} />
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12, fontSize: 13 }}>
                <thead><tr style={{ background: "#f3f4f6" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: BRAND }}>Vacina</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", color: BRAND }}>Doses/Mês</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", color: BRAND }}>Cobertura</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", color: BRAND }}>Meta</th>
                  <th style={{ padding: "8px 12px", textAlign: "center", color: BRAND }}>Status</th>
                </tr></thead>
                <tbody>{esusVacRaw.dados.map((v: any, i: number) => {
                  const ok = v.cobertura_pct >= v.meta_pct
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "8px 12px" }}>{v.vacina}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>{v.doses_mes}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: ok ? OK : WARN }}>{v.cobertura_pct}%</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", color: "#6b7280" }}>{v.meta_pct}%</td>
                      <td style={{ padding: "8px 12px", textAlign: "center" }}>
                        <span style={{ color: ok ? OK : WARN }}>{ok ? "✓ Meta" : "▼ Abaixo"}</span>
                      </td>
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ABA SIAPS */}
      {aba === "SIAPS" && (
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
            <KPI label="Medicamentos Monitorados" value={siapsDashRaw?.medicamentos_monitorados ?? "—"} />
            <KPI label="Itens Críticos" value={siapsDashRaw?.itens_criticos ?? "—"} color={CRIT} />
            <KPI label="Itens Atenção" value={siapsDashRaw?.itens_atencao ?? "—"} color={WARN} />
            <KPI label="Dispensações/Mês" value={siapsDashRaw?.dispensacoes_mes?.toLocaleString("pt-BR") ?? "—"} color={ACCENT} />
            <KPI label="Usuários Atendidos" value={siapsDashRaw?.usuarios_atendidos_mes?.toLocaleString("pt-BR") ?? "—"} />
            <KPI label="Cobertura Farmácia" value={siapsDashRaw ? `${siapsDashRaw.taxa_cobertura_farmacia_pct}%` : "—"} color={OK} />
          </div>
          {siapsEstRaw?.dados && Array.isArray(siapsEstRaw.dados) && (
            <div style={{ background: "#fff", borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: BRAND, marginBottom: 12 }}>Estoque de Medicamentos</div>
              <StatusBadge status={siapsEstRaw.status as FonteStatus} fonte={siapsEstRaw.fonte} />
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12, fontSize: 13 }}>
                <thead><tr style={{ background: "#f3f4f6" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: BRAND }}>Medicamento</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", color: BRAND }}>Estoque</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", color: BRAND }}>CMM</th>
                  <th style={{ padding: "8px 12px", textAlign: "center", color: BRAND }}>Cobertura</th>
                  <th style={{ padding: "8px 12px", textAlign: "center", color: BRAND }}>Status</th>
                </tr></thead>
                <tbody>{siapsEstRaw.dados.map((m: any, i: number) => {
                  const cor = m.status === "ok" ? OK : m.status === "atencao" ? WARN : CRIT
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "8px 12px" }}>{m.medicamento}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>{m.estoque.toLocaleString("pt-BR")} {m.unidade}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>{m.consumo_medio_mensal.toLocaleString("pt-BR")}</td>
                      <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700, color: cor }}>{m.cobertura_meses.toFixed(1)} m</td>
                      <td style={{ padding: "8px 12px", textAlign: "center" }}>
                        <span style={{ color: cor, fontWeight: 700 }}>{m.status.toUpperCase()}</span>
                      </td>
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
