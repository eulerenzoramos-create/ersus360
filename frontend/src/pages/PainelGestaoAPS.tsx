import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell,
} from "recharts";
import {
  Activity, Users, Home, Syringe, CheckCircle, AlertTriangle,
  RefreshCw, ChevronDown, ChevronRight, Send,
} from "lucide-react";
import { apiGet } from "../lib/api";

// ── Helpers ────────────────────────────────────────────────────────────────────

const TT = { fontSize: 12, background: "#1e293b", border: "none", borderRadius: 6, color: "#f8fafc" };

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
  if (!data) return <div style={{ textAlign: "center", padding: 40 }}><RefreshCw size={24} color="#9ca3af" /></div>;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        <KpiCard label="Total no período" val={data.total_periodo.toLocaleString("pt-BR")} sub="Jan–Jul/2026"
          icon={<Activity size={18} />} cor="#1d4ed8" />
        <KpiCard label="Média mensal" val={Math.round(data.media_mensal).toLocaleString("pt-BR")}
          sub="atendimentos/mês" icon={<Users size={18} />} cor="#16a34a" />
        <KpiCard label="Último mês (parcial)" val={data.serie_mensal.at(-1).total.toLocaleString("pt-BR")}
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
                <td style={{ padding: "7px 12px", textAlign: "right", color: "#2563eb" }}>{m.medico.toLocaleString("pt-BR")}</td>
                <td style={{ padding: "7px 12px", textAlign: "right", color: "#16a34a" }}>{m.enfermeiro.toLocaleString("pt-BR")}</td>
                <td style={{ padding: "7px 12px", textAlign: "right", color: "#7c3aed" }}>{m.odontologico.toLocaleString("pt-BR")}</td>
                <td style={{ padding: "7px 12px", textAlign: "right", color: "#9ca3af" }}>{m.outros.toLocaleString("pt-BR")}</td>
                <td style={{ padding: "7px 12px", textAlign: "right", fontWeight: 700 }}>{m.total.toLocaleString("pt-BR")}</td>
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
  if (!data) return <div style={{ textAlign: "center", padding: 40 }}><RefreshCw size={24} color="#9ca3af" /></div>;

  return (
    <div>
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>Top Procedimentos SIGTAP — Jan-Jul/2026</h3>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.procedimentos} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="descricao" width={220} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={TT} formatter={(v: number) => [v.toLocaleString("pt-BR"), "Quantidade"]} />
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
                <td style={{ padding: "7px 12px", fontWeight: 700, color: "#1d4ed8" }}>{p.quantidade.toLocaleString("pt-BR")}</td>
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
  if (!data) return <div style={{ textAlign: "center", padding: 40 }}><RefreshCw size={24} color="#9ca3af" /></div>;

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
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{v.doses_aplicadas.toLocaleString("pt-BR")} / {v.meta_ano.toLocaleString("pt-BR")} doses</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: cor, minWidth: 52, textAlign: "right" }}>{v.pct.toFixed(1)}%</span>
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
  if (!data) return <div style={{ textAlign: "center", padding: 40 }}><RefreshCw size={24} color="#9ca3af" /></div>;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        <KpiCard label="Visitas programadas" val={data.total_programadas.toLocaleString("pt-BR")}
          sub="Jan–Jul/2026" icon={<Home size={18} />} cor="#6b7280" />
        <KpiCard label="Visitas realizadas" val={data.total_realizadas.toLocaleString("pt-BR")}
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
  if (!data) return <div style={{ textAlign: "center", padding: 40 }}><RefreshCw size={24} color="#9ca3af" /></div>;

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
                  {h.fichas != null ? h.fichas.toLocaleString("pt-BR") : "—"}
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
  if (!data) return <div style={{ textAlign: "center", padding: 40 }}><RefreshCw size={24} color="#9ca3af" /></div>;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <KpiCard label="Equipes ESF total"  val={data.total}     icon={<Users size={18} />} cor="#1d4ed8" />
        <KpiCard label="Equipes completas"  val={data.completas} icon={<CheckCircle size={18} />} cor="#16a34a" />
        <KpiCard label="Equipes incompletas" val={data.incompletas} icon={<AlertTriangle size={18} />}
          cor={data.incompletas > 0 ? "#dc2626" : "#16a34a"} />
        <KpiCard label="Pop. cadastrada ESF" val={data.populacao_total.toLocaleString("pt-BR")} sub="cidadãos"
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
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{e.populacao_cadastrada.toLocaleString("pt-BR")}</div>
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
                    Produção mês: <strong>{e.producao_mes.toLocaleString("pt-BR")}</strong> atendimentos ·
                    Famílias: <strong>{e.familias.toLocaleString("pt-BR")}</strong>
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

// ── Página principal ───────────────────────────────────────────────────────────

type Aba = "atendimentos" | "procedimentos" | "vacinas" | "visitas" | "sisab" | "equipes";

export default function PainelGestaoAPS() {
  const [aba, setAba] = useState<Aba>("atendimentos");

  const { data: painel } = useQuery({
    queryKey: ["gestao-painel"],
    queryFn: () => apiGet("/api/gestao/painel") as Promise<any>,
  });

  const ABAS: { id: Aba; label: string }[] = [
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
          <KpiCard label="Atendimentos/ano" val={painel.total_atendimentos_ano.toLocaleString("pt-BR")}
            sub={`≈ ${painel.media_mensal_atendimentos}/mês`} icon={<Activity size={18} />} cor="#1d4ed8" />
          <KpiCard label="Visitas domiciliares" val={painel.total_visitas_domiciliares_ano.toLocaleString("pt-BR")}
            sub="Jan–Jul/2026" icon={<Home size={18} />} cor="#16a34a" />
          <KpiCard label="Cobertura ESF" val={`${painel.pct_cobertura_media}%`}
            sub={`${painel.populacao_coberta_esf.toLocaleString("pt-BR")} cadastrados`}
            icon={<Users size={18} />} cor="#7c3aed" />
          <KpiCard label="SISAB"
            val={painel.sisab_status === "em_dia" ? "Em dia" : "Pendente"}
            sub={painel.sisab_inconsistencias > 0 ? `${painel.sisab_inconsistencias} inconsistências` : "Sem inconsistências"}
            icon={<Send size={18} />}
            cor={painel.sisab_status === "em_dia" ? "#16a34a" : "#dc2626"} />
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 20, borderBottom: "2px solid #e5e7eb" }}>
        {ABAS.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)} style={{
            padding: "8px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13,
            borderBottom: aba === a.id ? "2px solid #1d4ed8" : "2px solid transparent",
            color: aba === a.id ? "#1d4ed8" : "#6b7280",
            fontWeight: aba === a.id ? 700 : 400, marginBottom: -2,
          }}>{a.label}</button>
        ))}
      </div>

      {aba === "atendimentos"  && <AbaAtendimentos />}
      {aba === "procedimentos" && <AbaProcedimentos />}
      {aba === "vacinas"       && <AbaVacinas />}
      {aba === "visitas"       && <AbaVisitas />}
      {aba === "sisab"         && <AbaSISAB />}
      {aba === "equipes"       && <AbaEquipesESF />}
    </div>
  );
}
