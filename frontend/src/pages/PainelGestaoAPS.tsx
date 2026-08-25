import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell,
} from "recharts";
import {
  Activity, Users, Home, Syringe, CheckCircle, AlertTriangle,
  RefreshCw, ChevronDown, ChevronRight, Send, Download, FileText,
} from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

// ── Helpers ────────────────────────────────────────────────────────────────────

const TT = { fontSize: 12, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };

const COR_STATUS: Record<string, string> = {
  verde: "#16a34a", amarelo: "#d97706", vermelho: "#dc2626",
  em_dia: "#16a34a", pendente: "#d97706",
};
const BG_STATUS: Record<string, string> = {
  verde: "#f0fdf4", amarelo: "#fffbeb", vermelho: "#fff7f7",
};

function Badge({ label, status }: { label: string; status: string }) {
  const cor = COR_STATUS[status] ?? "#9ca3af";
  const bg  = BG_STATUS[status]  ?? "#f3f4f6";
  return (
    <span style={{ background: bg, color: cor, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>{label}</span>
  );
}

function KpiCard({ label, val, sub, icon, cor }: { label: string; val: string | number; sub?: string; icon: React.ReactNode; cor: string }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}22`, borderTop: `3px solid ${cor}`, borderRadius: 8, padding: "14px 16px" }}>
      <div style={{ color: cor, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: cor }}>{val}</div>
      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

// ── Aba: Atendimentos ──────────────────────────────────────────────────────────

function AbaAtendimentos() {
  const { data } = useQuery({
    queryKey: ["gestao-atendimentos"],
    queryFn: () => apiGet("/api/gestao/atendimentos") as Promise<any>,
  });
  if (!data) return <NaoDisponivelBanner nota="Integração com sistema de gestão APS ainda não configurada no Railway. Nenhum dado foi inventado." />;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        <KpiCard label="Total no período" val={data.total_periodo?.toLocaleString("pt-BR")} sub="Jan–Jul/2026"
          icon={<Activity size={18} />} cor="#1d4ed8" />
        <KpiCard label="Média mensal" val={Math.round(data.media_mensal).toLocaleString("pt-BR")}
          sub="atendimentos/mês" icon={<Users size={18} />} cor="#16a34a" />
        <KpiCard label="Último mês (parcial)" val={data.serie_mensal.at(-1).total?.toLocaleString("pt-BR")}
          sub={data.serie_mensal.at(-1).mes} icon={<Activity size={18} />} cor="#d97706" />
      </div>

      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>Atendimentos por Tipo — 2026</h3>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.serie_mensal} barGap={3}>
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={TT} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="medico"       name="Médico"       fill="#2563eb" radius={[3,3,0,0]} stackId="a" />
              <Bar dataKey="enfermeiro"   name="Enfermeiro"   fill="#16a34a" radius={[3,3,0,0]} stackId="a" />
              <Bar dataKey="odontologico" name="Odontológico" fill="#7c3aed" radius={[3,3,0,0]} stackId="a" />
              <Bar dataKey="outros"       name="Outros"       fill="#d97706" radius={[3,3,0,0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela resumo */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              {["Mês", "Médico", "Enfermeiro", "Odontológico", "Outros", "Total"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: h === "Mês" ? "left" : "right", fontWeight: 600, color: "#6b7280" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.serie_mensal.map((m: any) => (
              <tr key={m.mes} style={{ borderTop: "1px solid #f3f4f6" }}>
                <td style={{ padding: "7px 12px", fontWeight: 500 }}>{m.mes}</td>
                <td style={{ padding: "7px 12px", textAlign: "right", color: "#2563eb" }}>{m.medico?.toLocaleString("pt-BR")}</td>
                <td style={{ padding: "7px 12px", textAlign: "right", color: "#16a34a" }}>{m.enfermeiro?.toLocaleString("pt-BR")}</td>
                <td style={{ padding: "7px 12px", textAlign: "right", color: "#7c3aed" }}>{m.odontologico?.toLocaleString("pt-BR")}</td>
                <td style={{ padding: "7px 12px", textAlign: "right", color: "#9ca3af" }}>{m.outros?.toLocaleString("pt-BR")}</td>
                <td style={{ padding: "7px 12px", textAlign: "right", fontWeight: 700 }}>{m.total?.toLocaleString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Aba: Procedimentos ─────────────────────────────────────────────────────────

function AbaProcedimentos() {
  const { data } = useQuery({
    queryKey: ["gestao-procedimentos"],
    queryFn: () => apiGet("/api/gestao/procedimentos") as Promise<any>,
  });
  if (!data) return <NaoDisponivelBanner nota="Integração com sistema de gestão APS ainda não configurada no Railway. Nenhum dado foi inventado." />;

  return (
    <div>
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>Top Procedimentos SIGTAP — Jan-Jul/2026</h3>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.procedimentos} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="descricao" width={220} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={TT} formatter={(v: number) => [v?.toLocaleString("pt-BR"), "Quantidade"]} />
              <Bar dataKey="quantidade" name="Quantidade" fill="#2563eb" radius={[0,4,4,0]}>
                {data.procedimentos.map((_: any, i: number) => (
                  <Cell key={i} fill={`hsl(${220 - i * 12}, 70%, 50%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              {["Código SIGTAP", "Procedimento", "Quantidade", "Unidade"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#6b7280" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.procedimentos.map((p: any, i: number) => (
              <tr key={p.codigo} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                <td style={{ padding: "7px 12px", fontFamily: "monospace", color: "#6b7280" }}>{p.codigo}</td>
                <td style={{ padding: "7px 12px" }}>{p.descricao}</td>
                <td style={{ padding: "7px 12px", fontWeight: 700, color: "#1d4ed8" }}>{p.quantidade?.toLocaleString("pt-BR")}</td>
                <td style={{ padding: "7px 12px", color: "#9ca3af", fontSize: 11 }}>{p.unidade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Aba: Vacinas ───────────────────────────────────────────────────────────────

function AbaVacinas() {
  const { data } = useQuery({
    queryKey: ["gestao-vacinas"],
    queryFn: () => apiGet("/api/gestao/vacinas") as Promise<any>,
  });
  if (!data) return <NaoDisponivelBanner nota="Integração com sistema de gestão APS ainda não configurada no Railway. Nenhum dado foi inventado." />;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        <KpiCard label="Em dia (≥ meta)" val={data.em_dia} icon={<CheckCircle size={18} />} cor="#16a34a" />
        <KpiCard label="Em atenção" val={data.atencao}    icon={<AlertTriangle size={18} />} cor="#d97706" />
        <KpiCard label="Crítica (< 70%)" val={data.criticas} icon={<AlertTriangle size={18} />} cor="#dc2626" />
        <KpiCard label="Cobertura média" val={`${data.pct_cobertura_media}%`}
          icon={<Syringe size={18} />} cor="#1d4ed8" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.vacinas.map((v: any) => {
          const cor = COR_STATUS[v.status] ?? "#9ca3af";
          const pct = Math.min(v.pct, 130);
          return (
            <div key={v.vacina} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: cor, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{v.vacina}</span>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{v.doses_aplicadas?.toLocaleString("pt-BR")} / {v.meta_ano?.toLocaleString("pt-BR")} doses</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: cor, minWidth: 52, textAlign: "right" }}>{v.pct?.toFixed(1)}%</span>
                </div>
              </div>
              <div style={{ height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(pct / 1.3, 100)}%`, height: "100%", background: cor, borderRadius: 3, transition: "width .6s" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Aba: Visitas ───────────────────────────────────────────────────────────────

function AbaVisitas() {
  const { data } = useQuery({
    queryKey: ["gestao-visitas"],
    queryFn: () => apiGet("/api/gestao/visitas") as Promise<any>,
  });
  if (!data) return <NaoDisponivelBanner nota="Integração com sistema de gestão APS ainda não configurada no Railway. Nenhum dado foi inventado." />;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        <KpiCard label="Visitas programadas" val={data.total_programadas?.toLocaleString("pt-BR")}
          sub="Jan–Jul/2026" icon={<Home size={18} />} cor="#6b7280" />
        <KpiCard label="Visitas realizadas" val={data.total_realizadas?.toLocaleString("pt-BR")}
          icon={<CheckCircle size={18} />} cor="#16a34a" />
        <KpiCard label="Cumprimento geral" val={`${data.pct_cumprimento}%`}
          icon={<Activity size={18} />} cor={data.pct_cumprimento >= 90 ? "#16a34a" : "#d97706"} />
      </div>

      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>Visitas Domiciliares ACS — 2026</h3>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.serie_mensal}>
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis domain={[3500, 5200]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={TT} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="programadas" name="Programadas" stroke="#9ca3af" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="realizadas"  name="Realizadas"  stroke="#16a34a" strokeWidth={2} dot={{ fill: "#16a34a", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Aba: SISAB ─────────────────────────────────────────────────────────────────

function AbaSISAB() {
  const { data } = useQuery({
    queryKey: ["gestao-sisab"],
    queryFn: () => apiGet("/api/gestao/sisab") as Promise<any>,
  });
  if (!data) return <NaoDisponivelBanner nota="Integração com sistema de gestão APS ainda não configurada no Railway. Nenhum dado foi inventado." />;

  const emDia = data.status_envio === "em_dia";

  return (
    <div>
      {/* Status principal */}
      <div style={{
        background: emDia ? "#f0fdf4" : "#fff7f7",
        border: `2px solid ${emDia ? "#bbf7d0" : "#fca5a5"}`,
        borderRadius: 12, padding: "20px 24px", marginBottom: 20,
        display: "flex", gap: 20, alignItems: "center",
      }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: emDia ? "#16a34a" : "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Send size={26} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: emDia ? "#16a34a" : "#dc2626" }}>
            SISAB — {emDia ? "Envio em Dia" : "Pendente"}
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
            Última competência enviada: <strong>{data.ultima_competencia_enviada}</strong> ·
            Próxima: <strong>{data.proxima_competencia}</strong> (prazo {data.prazo_envio})
          </div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: emDia ? "#16a34a" : "#d97706" }}>{data.dias_para_prazo}</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>dias para prazo</div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <KpiCard label="Equipes com produção" val={`${data.equipes_com_producao_mes}/${data.equipes_ativas}`}
          icon={<Users size={18} />} cor="#1d4ed8" />
        <KpiCard label="Fichas validadas" val={`${data.pct_fichas_validadas}%`}
          icon={<CheckCircle size={18} />} cor="#16a34a" />
        <KpiCard label="Inconsistências" val={data.inconsistencias}
          icon={<AlertTriangle size={18} />} cor={data.inconsistencias > 0 ? "#d97706" : "#16a34a"} />
        <KpiCard label="CNS sem CPF" val={data.cns_sem_cpf}
          icon={<AlertTriangle size={18} />} cor={data.cns_sem_cpf > 0 ? "#dc2626" : "#16a34a"} />
      </div>

      {/* Histórico envio */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", background: "#f3f4f6", fontWeight: 700, fontSize: 13 }}>Histórico de Envios SISAB</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              {["Competência", "Status", "Fichas enviadas"].map(h => (
                <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontWeight: 600, color: "#6b7280" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.historico_envio.map((h: any) => (
              <tr key={h.competencia} style={{ borderTop: "1px solid #f3f4f6" }}>
                <td style={{ padding: "8px 14px", fontWeight: 500 }}>{h.competencia}</td>
                <td style={{ padding: "8px 14px" }}>
                  <Badge label={h.status === "enviado" ? "✓ Enviado" : "⏳ Pendente"} status={h.status === "enviado" ? "verde" : "amarelo"} />
                </td>
                <td style={{ padding: "8px 14px", fontWeight: 700, color: "#1d4ed8" }}>
                  {h.fichas != null ? h.fichas?.toLocaleString("pt-BR") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Aba: Equipes ESF ───────────────────────────────────────────────────────────

function AbaEquipesESF() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["gestao-equipes-esf"],
    queryFn: () => apiGet("/api/gestao/equipes-esf") as Promise<any>,
  });
  if (!data) return <NaoDisponivelBanner nota="Integração com sistema de gestão APS ainda não configurada no Railway. Nenhum dado foi inventado." />;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <KpiCard label="Equipes ESF total"  val={data.total}     icon={<Users size={18} />} cor="#1d4ed8" />
        <KpiCard label="Equipes completas"  val={data.completas} icon={<CheckCircle size={18} />} cor="#16a34a" />
        <KpiCard label="Equipes incompletas" val={data.incompletas} icon={<AlertTriangle size={18} />}
          cor={data.incompletas > 0 ? "#dc2626" : "#16a34a"} />
        <KpiCard label="Pop. cadastrada ESF" val={data.populacao_total?.toLocaleString("pt-BR")} sub="cidadãos"
          icon={<Users size={18} />} cor="#7c3aed" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {data.equipes.map((e: any) => {
          const isOpen = expanded === e.cnes;
          return (
            <div key={e.cnes} style={{ border: `1px solid ${e.completa ? "#bbf7d0" : "#fca5a5"}`, borderLeft: `4px solid ${e.completa ? "#16a34a" : "#dc2626"}`, borderRadius: 8, overflow: "hidden", background: "#fff" }}>
              <div onClick={() => setExpanded(isOpen ? null : e.cnes)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", cursor: "pointer" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{e.nome}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{e.unidade} · {e.area}</div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{e.populacao_cadastrada?.toLocaleString("pt-BR")}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>cadastrados</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: e.pct_cobertura >= 80 ? "#16a34a" : "#d97706" }}>
                      {e.pct_cobertura}%
                    </div>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>cobertura</div>
                  </div>
                  <Badge label={e.completa ? "Completa" : "Incompleta"} status={e.completa ? "verde" : "vermelho"} />
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </div>

              {isOpen && (
                <div style={{ padding: "12px 16px", borderTop: "1px solid #f3f4f6", background: "#fafafa" }}>
                  {!e.completa && e.incompleta_motivo && (
                    <div style={{ background: "#fff7f7", border: "1px solid #fca5a5", borderRadius: 6, padding: "8px 12px", marginBottom: 10, fontSize: 12, color: "#dc2626", display: "flex", gap: 6, alignItems: "flex-start" }}>
                      <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {e.incompleta_motivo}
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
                    {e.composicao.medico && (
                      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 12px" }}>
                        <div style={{ fontWeight: 700, color: "#2563eb", marginBottom: 2 }}>Médico</div>
                        <div>{e.composicao.medico.nome}</div>
                        <div style={{ color: "#9ca3af", marginTop: 1 }}>{e.composicao.medico.carga_horaria}h/semana</div>
                      </div>
                    )}
                    {!e.composicao.medico && (
                      <div style={{ background: "#fff7f7", border: "1px solid #fca5a5", borderRadius: 6, padding: "8px 12px" }}>
                        <div style={{ fontWeight: 700, color: "#dc2626" }}>Médico</div>
                        <div style={{ color: "#dc2626", fontSize: 11 }}>VAGA EM ABERTO</div>
                      </div>
                    )}
                    {e.composicao.enfermeiro && (
                      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 12px" }}>
                        <div style={{ fontWeight: 700, color: "#16a34a", marginBottom: 2 }}>Enfermeiro</div>
                        <div>{e.composicao.enfermeiro.nome}</div>
                      </div>
                    )}
                    {e.composicao.tecnico_enfermagem && (
                      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 12px" }}>
                        <div style={{ fontWeight: 700, color: "#7c3aed", marginBottom: 2 }}>Técnico Enf.</div>
                        <div>{e.composicao.tecnico_enfermagem.nome}</div>
                      </div>
                    )}
                    {!e.composicao.tecnico_enfermagem && (
                      <div style={{ background: "#fff7f7", border: "1px solid #fca5a5", borderRadius: 6, padding: "8px 12px" }}>
                        <div style={{ fontWeight: 700, color: "#dc2626" }}>Técnico Enf.</div>
                        <div style={{ color: "#dc2626", fontSize: 11 }}>SEM REGISTRO ATIVO</div>
                      </div>
                    )}
                    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 12px" }}>
                      <div style={{ fontWeight: 700, color: "#d97706", marginBottom: 2 }}>ACS</div>
                      <div>{e.composicao.acs_count} agentes ativos</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
                    CNES: <span style={{ fontFamily: "monospace" }}>{e.cnes}</span> ·
                    Produção mês: <strong>{e.producao_mes?.toLocaleString("pt-BR")}</strong> atendimentos ·
                    Famílias: <strong>{e.familias?.toLocaleString("pt-BR")}</strong>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Aba: Indicadores C1–C7 (e-SUS PEC) ────────────────────────────────────────

const _META_C: Record<string, number> = {
  C1: 75, C2: 75, C3: 70, C4: 50, C5: 50, C6: 60, C7: 40,
};
const _DESC_C: Record<string, string> = {
  C1: "Mais Acesso", C2: "Desenv. Infantil", C3: "Gestação/Puerpério",
  C4: "Diabetes", C5: "Hipertensão", C6: "Pessoa Idosa", C7: "Prev. Câncer Colo",
};

function GaugeBar({ valor, meta, cor }: { valor: number; meta: number; cor: string }) {
  const pct = Math.min((valor / meta) * 100, 100);
  return (
    <div style={{ height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden", position: "relative" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: cor, borderRadius: 3, transition: "width .5s" }} />
      <div style={{ position: "absolute", top: -1, left: "100%", transform: "translateX(-1px)", height: 8, width: 2, background: "#9ca3af", borderRadius: 1 }} />
    </div>
  );
}

// ── Helpers de exportação ──────────────────────────────────────────────────────

function exportarCSV(data: {
  competencia: string;
  equipes: Record<string, Record<string, number>>;
  tipos_equipe: Record<string, string>;
}) {
  const inds = ["C1","C2","C3","C4","C5","C6","C7"];
  const metas = { C1:75, C2:75, C3:70, C4:50, C5:50, C6:60, C7:40 };
  const descs = {
    C1:"Mais Acesso", C2:"Desenv. Infantil", C3:"Gestacao/Puerperio",
    C4:"Diabetes", C5:"Hipertensao", C6:"Pessoa Idosa", C7:"Prev. Cancer Colo",
  };

  const linhas: string[][] = [];
  // Cabeçalho
  linhas.push([
    "Equipe", "Tipo",
    ...inds.flatMap(i => [`${i} - ${descs[i as keyof typeof descs]} (%)`, `${i} Meta (%)`, `${i} Gap (pp)`, `${i} Status`]),
  ]);
  // Dados
  Object.entries(data.equipes).forEach(([nome, indsEquipe]) => {
    const tipo = data.tipos_equipe?.[nome] ?? "";
    const cols = inds.flatMap(ind => {
      const v = indsEquipe[ind];
      const meta = metas[ind as keyof typeof metas];
      if (v == null) return ["", String(meta), "", "sem dado"];
      const gap = meta - v;
      const status = gap <= 0 ? "OK" : gap >= 20 ? "Critico" : "Aviso";
      return [v.toFixed(1), String(meta), gap.toFixed(1), status];
    });
    linhas.push([nome, tipo, ...cols]);
  });
  // Linha de médias
  const medias = inds.map(ind => {
    const vals = Object.values(data.equipes).map(e => e[ind]).filter(v => v != null);
    const media = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    const meta = metas[ind as keyof typeof metas];
    const gap = meta - media;
    return [media.toFixed(1), String(meta), gap.toFixed(1), gap <= 0 ? "OK" : gap >= 20 ? "Critico" : "Aviso"];
  });
  linhas.push(["MEDIA GERAL", "", ...medias.flat()]);

  const csv = linhas.map(l => l.map(c => `"${c}"`).join(";")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `indicadores_C1C7_${data.competencia}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportarPDF(data: {
  competencia: string;
  equipes: Record<string, Record<string, number>>;
  tipos_equipe: Record<string, string>;
}) {
  const inds = ["C1","C2","C3","C4","C5","C6","C7"];
  const metas: Record<string, number> = { C1:75, C2:75, C3:70, C4:50, C5:50, C6:60, C7:40 };
  const descs: Record<string, string> = {
    C1:"Mais Acesso", C2:"Desenv. Infantil", C3:"Gestação/Puerpério",
    C4:"Diabetes", C5:"Hipertensão", C6:"Pessoa Idosa", C7:"Prev. Câncer Colo",
  };

  const corCelula = (v: number | undefined, meta: number) => {
    if (v == null) return "#f9fafb";
    const gap = meta - v;
    if (gap <= 0)  return "#dcfce7";
    if (gap >= 20) return "#fee2e2";
    return "#fef3c7";
  };
  const corTexto = (v: number | undefined, meta: number) => {
    if (v == null) return "#9ca3af";
    return meta - v <= 0 ? "#16a34a" : meta - v >= 20 ? "#dc2626" : "#d97706";
  };

  const equipes = Object.entries(data.equipes);
  const medias = inds.map(ind => {
    const vals = equipes.map(([, e]) => e[ind]).filter(v => v != null);
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
  });

  const thStyle = `padding:6px 8px;background:#1e3a5f;color:#fff;font-size:10px;text-align:center;border:1px solid #1e3a5f;white-space:nowrap`;
  const tdBase = `padding:5px 7px;border:1px solid #e5e7eb;font-size:10px;text-align:center`;

  const thLinhas = `
    <tr>
      <th style="${thStyle};text-align:left">Equipe</th>
      <th style="${thStyle}">Tipo</th>
      ${inds.map(i => `<th style="${thStyle}">${i}<br/><span style="font-weight:400;font-size:9px">${descs[i]}</span><br/><span style="font-size:9px">meta ${metas[i]}%</span></th>`).join("")}
    </tr>`;

  const trEquipes = equipes.map(([nome, e]) => `
    <tr>
      <td style="${tdBase};text-align:left;font-weight:600">${nome}</td>
      <td style="${tdBase};color:#6b7280">${data.tipos_equipe?.[nome] ?? ""}</td>
      ${inds.map((ind, idx) => {
        const v = e[ind];
        const meta = metas[ind];
        return `<td style="${tdBase};background:${corCelula(v, meta)};color:${corTexto(v, meta)};font-weight:700">${v != null ? v.toFixed(1) + "%" : "—"}</td>`;
      }).join("")}
    </tr>`).join("");

  const trMedias = `
    <tr style="background:#f0f4ff">
      <td style="${tdBase};text-align:left;font-weight:800;color:#1e3a5f">MÉDIA GERAL</td>
      <td style="${tdBase}"></td>
      ${inds.map((ind, idx) => {
        const v = medias[idx];
        const meta = metas[ind];
        return `<td style="${tdBase};background:${corCelula(v ?? undefined, meta)};color:${corTexto(v ?? undefined, meta)};font-weight:800">${v != null ? v.toFixed(1) + "%" : "—"}</td>`;
      }).join("")}
    </tr>`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Indicadores C1–C7 — ${data.competencia}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; color: #111; }
      h1 { font-size: 16px; color: #1e3a5f; margin-bottom: 4px; }
      .sub { font-size: 11px; color: #6b7280; margin-bottom: 16px; }
      table { border-collapse: collapse; width: 100%; }
      @media print { @page { size: landscape; margin: 10mm; } }
      .legenda { display: flex; gap: 16px; font-size: 10px; margin-top: 12px; }
      .dot { width: 12px; height: 12px; border-radius: 2px; display: inline-block; margin-right: 4px; vertical-align: middle; }
    </style>
  </head><body>
    <h1>Indicadores de Qualidade APS — C1 a C7</h1>
    <div class="sub">
      Competência: <strong>${data.competencia}</strong> &nbsp;·&nbsp;
      Portaria GM/MS nº 3.493/2024 &nbsp;·&nbsp;
      Fonte: e-SUS PEC · ERSUS360 &nbsp;·&nbsp;
      Gerado em: ${new Date().toLocaleString("pt-BR")}
    </div>
    <table>${thLinhas}${trEquipes}${trMedias}</table>
    <div class="legenda">
      <span><span class="dot" style="background:#dcfce7"></span>≥ meta (OK)</span>
      <span><span class="dot" style="background:#fef3c7"></span>Abaixo &lt; 20pp (Aviso)</span>
      <span><span class="dot" style="background:#fee2e2"></span>Abaixo ≥ 20pp (Crítico)</span>
    </div>
  </body></html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.onload = () => win.print();
}

function AbaIndicadoresC1C7() {
  const [indSel, setIndSel] = useState<string>("C1");

  const { data: competencias } = useQuery({
    queryKey: ["pec-competencias"],
    queryFn: () => apiGet("/api/pec/competencias") as Promise<{ competencias: string[] }>,
  });

  const ultima = competencias?.competencias?.[0] ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["pec-indicadores", ultima],
    queryFn: () => apiGet(`/api/pec/indicadores/${ultima}`) as Promise<{
      competencia: string; equipes: Record<string, Record<string, number>>;
      tipos_equipe: Record<string, string>; ultima_atualizacao: string;
    }>,
    enabled: !!ultima,
  });

  if (isLoading) return (
    <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>
      <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", display: "block", margin: "0 auto 10px" }} />
      Carregando indicadores do e-SUS PEC...
    </div>
  );

  if (!data) return (
    <NaoDisponivelBanner nota="Nenhuma sincronização PEC encontrada. Execute o agente pec_sync --once para enviar os dados ao ERSUS360." />
  );

  const equipes = Object.entries(data.equipes);
  const indicadores = Object.keys(_META_C);

  // Dados para o gráfico do indicador selecionado
  const dadosGrafico = equipes.map(([nome, inds]) => ({
    name: nome.length > 12 ? nome.slice(0, 12) + "…" : nome,
    valor: inds[indSel] ?? 0,
    meta: _META_C[indSel],
  })).sort((a, b) => b.valor - a.valor);

  // Resumo por indicador (média entre equipes)
  const resumo = indicadores.map(ind => {
    const vals = equipes.map(([, inds]) => inds[ind] ?? 0);
    const media = vals.reduce((s, v) => s + v, 0) / (vals.length || 1);
    const meta = _META_C[ind];
    const abaixo = vals.filter(v => v < meta).length;
    return { ind, media, meta, abaixo, total: vals.length };
  });

  return (
    <div>
      {/* Header info */}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#1e40af", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <Activity size={14} />
        <span><strong>Competência:</strong> {data.competencia}</span>
        <span>·</span>
        <span><strong>Fonte:</strong> e-SUS PEC local (sync {data.ultima_atualizacao?.slice(0, 16).replace("T", " ")} UTC)</span>
        <span>·</span>
        <span><strong>Portaria GM/MS 3.493/2024</strong></span>
      </div>

      {/* Cards resumo C1–C7 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        {resumo.map(r => {
          const ok = r.media >= r.meta;
          const cor = r.media >= r.meta ? "#16a34a" : r.meta - r.media >= 20 ? "#dc2626" : "#d97706";
          return (
            <button key={r.ind} onClick={() => setIndSel(r.ind)}
              style={{
                background: indSel === r.ind ? (ok ? "#f0fdf4" : "#fff7f7") : "#fff",
                border: `1px solid ${indSel === r.ind ? cor : "#e5e7eb"}`,
                borderTop: `3px solid ${cor}`,
                borderRadius: 8, padding: "10px 12px", cursor: "pointer", textAlign: "left",
                transition: "box-shadow .15s",
                boxShadow: indSel === r.ind ? `0 0 0 2px ${cor}33` : "none",
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: cor }}>{r.ind}</span>
                {r.abaixo > 0 && (
                  <span style={{ fontSize: 9, background: "#fee2e2", color: "#dc2626", padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>
                    {r.abaixo} ↓
                  </span>
                )}
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: cor, lineHeight: 1 }}>
                {r.media.toFixed(1)}%
              </div>
              <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 2 }}>
                meta {r.meta}% · {_DESC_C[r.ind]}
              </div>
              <GaugeBar valor={r.media} meta={r.meta} cor={cor} />
            </button>
          );
        })}
      </div>

      {/* Gráfico de barras por equipe */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
            {indSel} — {_DESC_C[indSel]} · por equipe
          </h3>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>meta: {_META_C[indSel]}%</span>
        </div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosGrafico} margin={{ left: 0, right: 10 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={TT}
                formatter={(v: number) => [`${v.toFixed(1)}%`, indSel]}
                labelStyle={{ fontWeight: 700 }} />
              {/* Linha de referência da meta */}
              <Bar dataKey="meta" name="Meta" fill="transparent" legendType="none" />
              <Bar dataKey="valor" name="Realizado" radius={[4, 4, 0, 0]}>
                {dadosGrafico.map((d, i) => (
                  <Cell key={i} fill={d.valor >= d.meta ? "#16a34a" : d.meta - d.valor >= 20 ? "#dc2626" : "#d97706"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Linha da meta manual (referência visual) */}
        <div style={{ fontSize: 11, color: "#6b7280", textAlign: "center", marginTop: 4 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 12, height: 3, background: "#16a34a", display: "inline-block", borderRadius: 2 }} /> ≥ meta
            <span style={{ width: 12, height: 3, background: "#d97706", display: "inline-block", borderRadius: 2, marginLeft: 8 }} /> abaixo &lt; 20pp
            <span style={{ width: 12, height: 3, background: "#dc2626", display: "inline-block", borderRadius: 2, marginLeft: 8 }} /> crítico ≥ 20pp
          </span>
        </div>
      </div>

      {/* Botões de exportação */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button
          onClick={() => exportarCSV(data)}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
            background: "#16a34a", color: "#fff", border: "none", borderRadius: 6,
            fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}
        >
          <Download size={13} /> Exportar CSV
        </button>
        <button
          onClick={() => exportarPDF(data)}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
            background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 6,
            fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}
        >
          <FileText size={13} /> Exportar PDF
        </button>
      </div>

      {/* Tabela completa por equipe × indicador */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#374151", minWidth: 140 }}>Equipe</th>
              {indicadores.map(ind => (
                <th key={ind} style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, color: "#374151", minWidth: 72 }}>
                  {ind}<br/><span style={{ fontSize: 9, color: "#9ca3af", fontWeight: 400 }}>meta {_META_C[ind]}%</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {equipes.map(([nome, inds], i) => (
              <tr key={nome} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                <td style={{ padding: "8px 12px", fontWeight: 600, fontSize: 11 }}>
                  {nome}
                  {data.tipos_equipe?.[nome] && (
                    <span style={{ fontSize: 9, color: "#9ca3af", marginLeft: 5 }}>{data.tipos_equipe[nome]}</span>
                  )}
                </td>
                {indicadores.map(ind => {
                  const v = inds[ind];
                  const meta = _META_C[ind];
                  if (v == null) return <td key={ind} style={{ padding: "8px 10px", textAlign: "center", color: "#d1d5db" }}>—</td>;
                  const cor = v >= meta ? "#16a34a" : meta - v >= 20 ? "#dc2626" : "#d97706";
                  return (
                    <td key={ind} style={{ padding: "8px 10px", textAlign: "center" }}>
                      <span style={{ fontWeight: 700, color: cor, fontSize: 12 }}>{v.toFixed(1)}%</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────

type Aba = "atendimentos" | "procedimentos" | "vacinas" | "visitas" | "sisab" | "equipes" | "c1c7";

export default function PainelGestaoAPS() {
  const [aba, setAba] = useState<Aba>("c1c7");

  const { data: painel } = useQuery({
    queryKey: ["gestao-painel"],
    queryFn: () => apiGet("/api/gestao/painel") as Promise<any>,
  });

  const ABAS: { id: Aba; label: string }[] = [
    { id: "c1c7",          label: "⭐ Indicadores C1–C7" },
    { id: "atendimentos",  label: "Atendimentos" },
    { id: "procedimentos", label: "Procedimentos" },
    { id: "vacinas",       label: "Vacinas" },
    { id: "visitas",       label: "Visitas ACS" },
    { id: "sisab",         label: "SISAB" },
    { id: "equipes",       label: "Equipes ESF" },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1040, margin: "0 auto" }}>

      {/* Cabeçalho */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Painel de Gestão APS</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
          Produção, SISAB, Equipes ESF · {painel?.municipio ?? "Apuí"}/AM · {painel?.periodo ?? "2026"}
        </p>
      </div>

      {/* KPIs topo */}
      {painel && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
          <KpiCard label="Atendimentos/ano" val={painel.total_atendimentos_ano?.toLocaleString("pt-BR")}
            sub={`≈ ${painel.media_mensal_atendimentos}/mês`} icon={<Activity size={18} />} cor="#1d4ed8" />
          <KpiCard label="Visitas domiciliares" val={painel.total_visitas_domiciliares_ano?.toLocaleString("pt-BR")}
            sub="Jan–Jul/2026" icon={<Home size={18} />} cor="#16a34a" />
          <KpiCard label="Cobertura ESF" val={`${painel.pct_cobertura_media}%`}
            sub={`${painel.populacao_coberta_esf?.toLocaleString("pt-BR")} cadastrados`}
            icon={<Users size={18} />} cor="#7c3aed" />
          <KpiCard label="SISAB"
            val={painel.sisab_status === "em_dia" ? "Em dia" : "Pendente"}
            sub={painel.sisab_inconsistencias > 0 ? `${painel.sisab_inconsistencias} inconsistências` : "Sem inconsistências"}
            icon={<Send size={18} />}
            cor={painel.sisab_status === "em_dia" ? "#16a34a" : "#dc2626"} />
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 20, borderBottom: "2px solid #e4e7ec" }}>
        {ABAS.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)} style={{
            padding: "8px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13,
            borderBottom: aba === a.id ? "2px solid #1d4ed8" : "2px solid transparent",
            color: aba === a.id ? "#1d4ed8" : "#6b7280",
            fontWeight: aba === a.id ? 700 : 400, marginBottom: -2,
          }}>{a.label}</button>
        ))}
      </div>

      {aba === "c1c7"          && <AbaIndicadoresC1C7 />}
      {aba === "atendimentos"  && <AbaAtendimentos />}
      {aba === "procedimentos" && <AbaProcedimentos />}
      {aba === "vacinas"       && <AbaVacinas />}
      {aba === "visitas"       && <AbaVisitas />}
      {aba === "sisab"         && <AbaSISAB />}
      {aba === "equipes"       && <AbaEquipesESF />}
    </div>
  );
}
