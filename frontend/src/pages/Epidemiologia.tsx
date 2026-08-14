// src/pages/Epidemiologia.tsx — Vigilância Epidemiológica / SINAN ERSUS 360
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiEpidemiologia } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

type Agravo = {
  agravo: string; cid: string; casos_mes: number; casos_ano: number;
  incidencia?: number; ipa?: number; meta_ipa?: number; status: string; tendencia: string;
};

const COR: Record<string, string> = { verde: "#2e7d32", amarelo: "#f57f17", vermelho: "#c62828" };
const BG:  Record<string, string> = { verde: "#e8f5e9", amarelo: "#fff8e1", vermelho: "#ffebee" };

function SemaforoBadge({ status }: { status: string }) {
  return (
    <span style={{ background: BG[status] ?? "#f5f5f5", color: COR[status] ?? "#9e9e9e", padding: "2px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
      {status.toUpperCase()}
    </span>
  );
}

export default function Epidemiologia() { 
  const [tab, setTab] = useState<"dashboard" | "agravos" | "malaria" | "dengue" | "notificacoes">("dashboard");

  const { data: dash, isLoading } = useQuery({ queryKey: ["epi-dash"],   queryFn: apiEpidemiologia.dashboard });
  const { data: agravos = []} = useQuery({ queryKey: ["epi-agravos"], queryFn: apiEpidemiologia.agravos, enabled: tab === "agravos" });
  const { data: malaria } = useQuery({ queryKey: ["epi-malaria"], queryFn: apiEpidemiologia.malaria, enabled: tab === "malaria" });
  const { data: dengue }  = useQuery({ queryKey: ["epi-dengue"],  queryFn: apiEpidemiologia.dengue,  enabled: tab === "dengue" });
  const { data: notif }   = useQuery({ queryKey: ["epi-notif"],   queryFn: () => apiEpidemiologia.notificacoes(), enabled: tab === "notificacoes" });

  if (!isLoading && !dash) return (
    <div style={{ padding: 24 }}>
      <NaoDisponivelBanner
        titulo="Painel Epidemiologico indisponivel"
        nota="Dados nao disponiveis — integracao pendente de configuracao no Railway."
      />
    </div>
  );

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1565c0" }}>Vigilância Epidemiológica</h2>
        <p style={{ margin: "4px 0 0", color: "#666", fontSize: 13 }}>SINAN · Notificações Compulsórias · Apuí/AM</p>
      </div>

      {/* KPIs */}
      {dash && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "IPA Malária",         value: `${dash.malaria_ipa_atual}`, sub: `meta < ${dash.malaria_ipa_meta}`, cor: COR[dash.malaria_ipa_status] },
            { label: "Dengue (acum.)",       value: `${dash.dengue_casos_acum}`,     sub: "casos 2026",   cor: "#1565c0" },
            { label: "Mort. Infantil",       value: `${dash.mortalidade_infantil}/1k NV`, sub: `meta < ${dash.mortalidade_infantil_meta}`, cor: dash.mortalidade_infantil < dash.mortalidade_infantil_meta ? "#2e7d32" : "#c62828" },
            { label: "Notificações/ano",     value: `${dash.total_notificacoes_ano}`,     sub: `${dash.total_investigadas_pct}% invest.`, cor: "#6a1b9a" },
            { label: "Cob. Vacinal média",   value: `${dash.cobertura_vacinal_media_pct}%`,sub: "DTP + Penta + Pólио",cor: dash.cobertura_vacinal_media_pct >= 90 ? "#2e7d32" : "#f57f17" },
          ].map(k => (
            <div key={k.label} style={{ background: "#fff", borderRadius: 8, padding: "14px 18px", border: `2px solid ${k.cor}20` }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.cor }}>{k.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#333", marginTop: 2 }}>{k.label}</div>
              <div style={{ fontSize: 10, color: "#888", marginTop: 1 }}>{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Abas */}
      <div style={{ display: "flex", gap: 2, marginBottom: 16, borderBottom: "2px solid #e4e7ec" }}>
        {[
          { key: "dashboard"     as const, label: "Resumo" },
          { key: "agravos"       as const, label: "Agravos Compulsórios" },
          { key: "malaria"       as const, label: "Malária" },
          { key: "dengue"        as const, label: "Dengue" },
          { key: "notificacoes"  as const, label: "Notificações SINAN" },
        ].map(a => (
          <button key={a.key} onClick={() => setTab(a.key)}
            style={{ padding: "8px 18px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: tab === a.key ? "#1565c0" : "transparent",
              color: tab === a.key ? "#fff" : "#555", borderRadius: "6px 6px 0 0" }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === "dashboard" && dash && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 20, border: "1px solid #e0e0e0" }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: "#333" }}>Situação Atual — Jul/2026</div>
            {[
              { label: "Malária: IPA 3.47/1000 hab",  status: "verde",   desc: "Abaixo da meta (< 10). Tendência de queda contínua." },
              { label: "Dengue: 36 casos acumulados", status: "verde",   desc: "Abaixo do limiar epidêmico. Vigilância ativa." },
              { label: "Leptospirose: 11 casos",      status: "amarelo", desc: "Acima da média histórica — associado a chuvas." },
              { label: "Tuberculose: 5 casos",        status: "amarelo", desc: "Investigação em andamento. 2 casos novos." },
              { label: "Mortalidade Infantil: 8.1",   status: "verde",   desc: "Abaixo da meta nacional (< 10/1000 NV)." },
            ].map(i => (
              <div key={i.label} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10, padding: "10px 12px", borderRadius: 6, background: BG[i.status], border: `1px solid ${COR[i.status]}20` }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: COR[i.status], flexShrink: 0, marginTop: 4 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#333" }}>{i.label}</div>
                  <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{i.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: "#fff", borderRadius: 10, padding: 20, border: "1px solid #e0e0e0" }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: "#333" }}>Mortalidade — Apuí/AM (2025)</div>
            {[
              { label: "Doenças Circulatórias", pct: 31.2, cor: "#c62828" },
              { label: "Causas Externas",       pct: 18.9, cor: "#e65100" },
              { label: "Doenças Infecciosas",   pct: 23.4, cor: "#f57f17" },
              { label: "Neoplasias",            pct: 14.8, cor: "#6a1b9a" },
              { label: "Outras causas",         pct: 11.7, cor: "#9e9e9e" },
            ].map(m => (
              <div key={m.label} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span>{m.label}</span>
                  <span style={{ fontWeight: 700, color: m.cor }}>{m.pct}%</span>
                </div>
                <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4 }}>
                  <div style={{ height: "100%", width: `${m.pct}%`, background: m.cor, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agravos */}
      {tab === "agravos" && agravos && (
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e0e0e0", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f0f0", fontWeight: 700, color: "#333" }}>
            Agravos de Notificação Compulsória — {agravos.total_agravos_monitorados} monitorados
            {agravos.alertas_ativos > 0 && (
              <span style={{ marginLeft: 10, background: "#fff8e1", color: "#e65100", padding: "2px 10px", borderRadius: 4, fontSize: 12, fontWeight: 700 }}>
                {agravos.alertas_ativos} em atenção
              </span>
            )}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                {["Agravo", "CID", "Casos mês", "Casos ano", "Incidência", "Status", "Tendência"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#666", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agravos.agravos?.map((a: Agravo, i: number) => (
                <tr key={a.agravo} style={{ borderTop: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 600, fontSize: 13 }}>{a.agravo}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#666" }}>{a.cid}</td>
                  <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 700, color: a.casos_mes > 0 ? "#333" : "#9e9e9e" }}>{a.casos_mes}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13 }}>{a.casos_ano}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12 }}>{a.ipa ? `IPA ${a.ipa}` : a.incidencia ? `${a.incidencia}/100k` : "—"}</td>
                  <td style={{ padding: "10px 14px" }}><SemaforoBadge status={a.status} /></td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: a.tendencia === "queda" ? "#2e7d32" : a.tendencia === "subida" ? "#c62828" : "#9e9e9e" }}>
                    {a.tendencia === "queda" ? "↓ Queda" : a.tendencia === "subida" ? "↑ Subida" : "→ Estável"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Malária */}
      {tab === "malaria" && malaria && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 20, border: "1px solid #e0e0e0" }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: "#333" }}>
              Malária — Série Mensal 2026
              <span style={{ marginLeft: 8, fontSize: 12, color: "#2e7d32", fontWeight: 400 }}>IPA acum: {malaria.ipa_acumulado} (meta &lt; {malaria.ipa_meta})</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
              {malaria.serie_mensal?.map((m: { mes: string; total: number; vf: number; vv: number }) => {
                const max = Math.max(...malaria.serie_mensal.map((x: { total: number }) => x.total));
                const h = (m.total / (max || 1)) * 120;
                return (
                  <div key={m.mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#c62828" }}>{m.total}</div>
                    <div style={{ width: "100%", position: "relative" }}>
                      <div style={{ height: (m.vv / (max || 1)) * 120, background: "#1565c080", borderRadius: "4px 4px 0 0", width: "100%" }} />
                      <div style={{ height: (m.vf / (max || 1)) * 120, background: "#c62828", borderRadius: "4px 4px 0 0", width: "100%" }} />
                    </div>
                    <div style={{ fontSize: 10, color: "#888" }}>{m.mes.slice(0,3)}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 11 }}>
              <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#c62828", borderRadius: 2, marginRight: 4 }} />P. falciparum ({malaria.total_pf})</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#1565c080", borderRadius: 2, marginRight: 4 }} />P. vivax ({malaria.total_pv})</span>
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: 10, padding: 20, border: "1px solid #e0e0e0" }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: "#333" }}>Contexto Epidemiológico</div>
            <div style={{ fontSize: 13, color: "#555", lineHeight: 1.7 }}>
              {malaria.observacao}
            </div>
            <div style={{ marginTop: 16, padding: 14, background: "#e8f5e9", borderRadius: 8, border: "1px solid #c8e6c9" }}>
              <div style={{ fontWeight: 700, color: "#2e7d32", fontSize: 13 }}>IPA Atual: {malaria.ipa_acumulado} / 1.000 hab</div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                Meta OMS: &lt; 10/1.000 · Status: <strong style={{ color: "#2e7d32" }}>{malaria.ipa_status.toUpperCase()}</strong>
              </div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>Total acum. 2026: {malaria.total_casos_periodo} casos</div>
            </div>
          </div>
        </div>
      )}

      {/* Dengue */}
      {tab === "dengue" && dengue && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 20, border: "1px solid #e0e0e0" }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: "#333" }}>Dengue — Série Mensal 2026</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
              {dengue.serie_mensal?.map((m: { mes: string; casos: number; graves: number }) => {
                const max = Math.max(...dengue.serie_mensal.map((x: { casos: number }) => x.casos));
                const h = (m.casos / (max || 1)) * 120;
                return (
                  <div key={m.mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#e65100" }}>{m.casos}</div>
                    <div style={{ width: "100%", height: h, background: m.graves > 0 ? "#c62828" : "#e65100", borderRadius: "4px 4px 0 0" }} />
                    <div style={{ fontSize: 10, color: "#888" }}>{m.mes.slice(0,3)}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: 10, padding: 20, border: "1px solid #e0e0e0" }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: "#333" }}>Indicadores Dengue 2026</div>
            {[
              { label: "Total de casos", value: `${dengue.total_casos_periodo}`, cor: "#e65100" },
              { label: "Casos graves",   value: `${dengue.casos_graves}`,        cor: "#c62828" },
              { label: "Óbitos",         value: `${dengue.obitos}`,              cor: "#333" },
              { label: "Incidência/100k",value: `${dengue.incidencia_por_100k}`, cor: "#1565c0" },
              { label: "Nível de alerta",value: dengue.nivel_alerta.toUpperCase(), cor: COR[dengue.nivel_alerta] },
            ].map(k => (
              <div key={k.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
                <span style={{ fontSize: 13, color: "#555" }}>{k.label}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: k.cor }}>{k.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notificações SINAN */}
      {tab === "notificacoes" && notif && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: "14px 18px", border: "1px solid #e0e0e0", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#1565c0" }}>{notif.total}</div>
              <div style={{ fontSize: 13, color: "#555" }}>Total notificações</div>
            </div>
            <div style={{ background: "#e8f5e9", borderRadius: 8, padding: "14px 18px", border: "1px solid #c8e6c9", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#2e7d32" }}>{notif.investigadas}</div>
              <div style={{ fontSize: 13, color: "#555" }}>Investigadas/encerradas</div>
            </div>
            <div style={{ background: "#fff8e1", borderRadius: 8, padding: "14px 18px", border: "1px solid #ffe082", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#e65100" }}>{notif.pendentes}</div>
              <div style={{ fontSize: 13, color: "#555" }}>Em investigação</div>
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e0e0e0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f5f5f5" }}>
                  {["Nº SINAN", "Agravo", "CID", "Notificante", "Data", "Status"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#666", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {notif.notificacoes?.map((n: { id: number; agravo: string; cid: string; notificante: string; data: string; status: string; encerrada: boolean }) => (
                  <tr key={n.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "10px 14px", fontSize: 12, fontFamily: "monospace" }}>{n.id}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>{n.agravo}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#666" }}>{n.cid}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12 }}>{n.notificante}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12 }}>{new Date(n.data).toLocaleDateString("pt-BR")}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{
                        background: n.encerrada ? "#e8f5e9" : "#fff8e1",
                        color: n.encerrada ? "#2e7d32" : "#e65100",
                        padding: "2px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                      }}>
                        {n.encerrada ? "ENCERRADA" : "EM INVEST."}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
