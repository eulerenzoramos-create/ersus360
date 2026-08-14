import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Calendar, CheckCircle, Clock, FileText } from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

function KpiCard({ label, value, sub, cor, icon }: { label: string; value: string | number; sub?: string; cor: string; icon: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}22`, borderTop: `3px solid ${cor}`, borderRadius: 10, padding: "13px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: "#6b7280" }}>{label}</span>
        <div style={{ background: `${cor}15`, borderRadius: 6, padding: 5 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: cor, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

const SEG_COR: Record<string, string> = {
  gestão: "#1d4ed8", trabalhadores: "#16a34a", usuarios: "#7c3aed", prestadores: "#d97706",
};
const SEG_LABEL: Record<string, string> = {
  gestão: "Gestão", trabalhadores: "Trabalhadores", usuarios: "Usuários", prestadores: "Prestadores",
};
const DELIB_COR: Record<string, string> = {
  implementada: "#16a34a", em_andamento: "#0891b2", pendente: "#d97706",
};

function AbaDashboard({ dash }: { dash: any }) {
  if (!dash) return <NaoDisponivelBanner nota="Dados indisponíveis. Integração não configurada no Railway. Nenhum valor foi inventado." />;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Reuniões realizadas"   value={dash.total_reunioes}          sub="em 2026"                  cor="#1d4ed8" icon={<Calendar size={14} color="#1d4ed8"/>}/>
        <KpiCard label="Quórum médio"          value={`${dash.media_quorum_pct}%`}  sub="presença dos conselheiros" cor={dash.media_quorum_pct>=80?"#16a34a":"#d97706"} icon={<Users size={14} color={dash.media_quorum_pct>=80?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="Deliberações"          value={dash.deliberacoes_total}       sub={`${dash.deliberacoes_implant} implantadas`} cor="#7c3aed" icon={<CheckCircle size={14} color="#7c3aed"/>}/>
        <KpiCard label="Atas pendentes"        value={dash.atas_pendentes}           sub="aprovação"                cor={dash.atas_pendentes>0?"#d97706":"#16a34a"} icon={<FileText size={14} color={dash.atas_pendentes>0?"#d97706":"#16a34a"}/>}/>
        <KpiCard label="Próxima reunião"       value={dash.proxima_reuniao || "—"}   sub="ordinária Mai/26"         cor="#0891b2" icon={<Calendar size={14} color="#0891b2"/>}/>
      </div>

      {dash.proxima_reuniao && (
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "12px 16px", marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8", marginBottom: 4 }}>Próxima reunião: {dash.proxima_reuniao}</div>
          <div style={{ fontSize: 12, color: "#374151" }}>Pauta prevista: {dash.proxima_pauta}</div>
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Reuniões 2026 — quórum</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {dash.reunioes_ano.map((r: any) => {
            const pct = Math.round(r.quorum / r.total * 100);
            return (
              <div key={r.data} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, width: 90, flexShrink: 0, color: "#374151" }}>{r.data}</span>
                <span style={{ fontSize: 11, color: "#9ca3af", width: 85, flexShrink: 0 }}>{r.tipo === "ordinaria" ? "Ordinária" : "Extraordinária"}</span>
                <div style={{ flex: 1, background: "#f3f4f6", borderRadius: 6, height: 10, overflow: "hidden" }}>
                  <div style={{ background: pct >= 80 ? "#16a34a" : "#d97706", height: "100%", width: `${pct}%`, borderRadius: 6 }}/>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 80 ? "#16a34a" : "#d97706", width: 60, textAlign: "right" }}>{r.quorum}/{r.total}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AbaReunioes({ reunioes }: { reunioes: any[] | undefined }) {
  if (!reunioes) return <NaoDisponivelBanner nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {reunioes.map(r => (
        <div key={r.id} style={{ background: "#fff", border: `1px solid ${r.quorum === null ? "#374151" : "#e5e7eb"}`, borderLeft: `4px solid ${r.tipo === "extraordinaria" ? "#dc2626" : "#1d4ed8"}`, borderRadius: 8, padding: "14px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{r.data}</span>
              <span style={{ marginLeft: 10, background: r.tipo === "ordinaria" ? "#dbeafe" : "#fee2e2", color: r.tipo === "ordinaria" ? "#1d4ed8" : "#dc2626", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>
                {r.tipo === "ordinaria" ? "Ordinária" : "Extraordinária"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {r.quorum !== null && (
                <span style={{ fontSize: 12, color: "#6b7280" }}>Quórum: <strong>{r.quorum}/{r.total_conselheiros}</strong></span>
              )}
              {r.quorum === null && <span style={{ fontSize: 12, color: "#0891b2", fontWeight: 600 }}>Agendada</span>}
              {r.ata_aprovada !== undefined && r.quorum !== null && (
                <span style={{ fontSize: 11, color: r.ata_aprovada ? "#16a34a" : "#d97706", fontWeight: 700 }}>
                  {r.ata_aprovada ? "Ata aprovada ✓" : "Ata pendente"}
                </span>
              )}
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: r.deliberacoes?.length ? 8 : 0 }}>Pauta: {r.pauta}</div>
          {r.deliberacoes?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
              {r.deliberacoes.map((d: string, i: number) => (
                <span key={i} style={{ background: "#f0fdf4", color: "#16a34a", fontSize: 11, padding: "2px 8px", borderRadius: 4 }}>✓ {d}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AbaConselheiros({ conselheiros }: { conselheiros: any[] | undefined }) {
  if (!conselheiros) return <NaoDisponivelBanner nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />;
  const segmentos = ["gestão", "trabalhadores", "usuarios", "prestadores"];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {segmentos.map(s => {
          const n = conselheiros.filter(c => c.segmento === s && c.ativo).length;
          const cor = SEG_COR[s];
          return (
            <div key={s} style={{ background: cor + "08", border: `1px solid ${cor}22`, borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: cor }}>{n}</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>{SEG_LABEL[s]}</div>
            </div>
          );
        })}
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#1d4ed8", color: "#fff" }}>
              <th style={{ padding: "9px 14px", textAlign: "left" }}>Nome</th>
              <th style={{ padding: "9px 10px", textAlign: "left" }}>Segmento</th>
              <th style={{ padding: "9px 10px", textAlign: "left" }}>Cargo no CMS</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>Situação</th>
            </tr>
          </thead>
          <tbody>
            {conselheiros.map((c, i) => (
              <tr key={c.id} style={{ borderTop: "1px solid #f3f4f6", background: !c.ativo ? "#f9fafb" : i % 2 === 0 ? "#fff" : "#f9fafb", opacity: c.ativo ? 1 : 0.5 }}>
                <td style={{ padding: "9px 14px", fontWeight: 600 }}>{c.nome}</td>
                <td style={{ padding: "9px 10px" }}>
                  <span style={{ background: SEG_COR[c.segmento] + "15", color: SEG_COR[c.segmento], fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{SEG_LABEL[c.segmento]}</span>
                </td>
                <td style={{ padding: "9px 10px", color: "#374151" }}>{c.cargo}</td>
                <td style={{ padding: "9px 10px", textAlign: "center" }}>
                  <span style={{ color: c.ativo ? "#16a34a" : "#9ca3af", fontSize: 11, fontWeight: 700 }}>{c.ativo ? "Ativo" : "Inativo"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>Composição: 50% usuários, 25% trabalhadores, 25% gestão+prestadores — conforme Lei 8.142/1990</div>
    </div>
  );
}

function AbaDeliberacoes({ deliberacoes }: { deliberacoes: any[] | undefined }) {
  const [filtro, setFiltro] = useState("todos");
  if (!deliberacoes) return <NaoDisponivelBanner nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />;
  const lista = filtro === "todos" ? deliberacoes : deliberacoes.filter(d => d.status === filtro);
  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <select value={filtro} onChange={e => setFiltro(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13 }}>
          <option value="todos">Todos</option>
          <option value="implementada">Implementadas</option>
          <option value="em_andamento">Em andamento</option>
          <option value="pendente">Pendentes</option>
        </select>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {lista.map(d => {
          const cor = DELIB_COR[d.status];
          return (
            <div key={d.id} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{d.descricao}</div>
                <span style={{ background: cor + "15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, flexShrink: 0, marginLeft: 10 }}>
                  {d.status === "implementada" ? "Implementada" : d.status === "em_andamento" ? "Em andamento" : "Pendente"}
                </span>
              </div>
              <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                <span>Reunião #{d.reuniao}</span>
                <span>Responsável: <strong style={{ color: "#374151" }}>{d.responsavel}</strong></span>
                <span>Prazo: <strong style={{ color: d.prazo < "2026-05-01" ? "#d97706" : "#374151" }}>{d.prazo}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type Aba = "dashboard" | "reunioes" | "conselheiros" | "deliberacoes";

export default function ConselhoSaude() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash }         = useQuery({ queryKey: ["cms-dash"],  queryFn: () => apiGet("/api/cms/dashboard") as Promise<any> });
  const { data: reunioes = []}     = useQuery({ queryKey: ["cms-reun"],  queryFn: () => apiGet("/api/cms/reunioes") as Promise<any[]>,       enabled: aba === "reunioes" });
  const { data: conselheiros = []} = useQuery({ queryKey: ["cms-cons"],  queryFn: () => apiGet("/api/cms/conselheiros") as Promise<any[]>,   enabled: aba === "conselheiros" });
  const { data: deliberacoes = []} = useQuery({ queryKey: ["cms-delib"], queryFn: () => apiGet("/api/cms/deliberacoes") as Promise<any[]>,   enabled: aba === "deliberacoes" });

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",    label: "Dashboard" },
    { id: "reunioes",     label: "Reuniões" },
    { id: "conselheiros", label: "Conselheiros" },
    { id: "deliberacoes", label: "Deliberações" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Conselho Municipal de Saúde</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>CMS Apuí · Controle Social · Lei 8.142/1990 · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{dash.conselheiros_ativos}</div>
              <div style={{ fontSize: 10, opacity: .8 }}>conselheiros</div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e4e7ec" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba === a.id ? "2px solid #1d4ed8" : "2px solid transparent", color: aba === a.id ? "#1d4ed8" : "#6b7280", fontWeight: aba === a.id ? 700 : 400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba === "dashboard" && !dash && <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />}
        {aba === "dashboard"    && <AbaDashboard dash={dash}/>}
        {aba === "reunioes"     && <AbaReunioes reunioes={reunioes}/>}
        {aba === "conselheiros" && <AbaConselheiros conselheiros={conselheiros}/>}
        {aba === "deliberacoes" && <AbaDeliberacoes deliberacoes={deliberacoes}/>}
      </div>
    </div>
  );
}
