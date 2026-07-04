import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell,
} from "recharts";
import {
  Network, AlertTriangle, Clock, CheckCircle, Users,
  ChevronDown, ChevronRight, TrendingUp, DollarSign,
  Ambulance, Search,
} from "lucide-react";
import { apiGet } from "../lib/api";

const BRL  = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const BRLK = (v: number) =>
  v >= 1_000_000 ? `R$ ${(v/1_000_000).toFixed(2).replace(".",",")}M`
  : `R$ ${(v/1_000).toFixed(1).replace(".",",")}k`;

const COR_META = (s: string) =>
  s === "critico" ? "#dc2626" : s === "atencao" ? "#d97706" : "#16a34a";
const BG_META = (s: string) =>
  s === "critico" ? "#fff7f7" : s === "atencao" ? "#fffbeb" : "#f0fdf4";
const LABEL_META = (s: string) =>
  s === "critico" ? "Crítico" : s === "atencao" ? "Atenção" : "OK";

const COR_STATUS_TFD: Record<string, string> = {
  autorizado:   "#16a34a",
  em_analise:   "#d97706",
  pendente_doc: "#dc2626",
};
const TT = { fontSize: 11, background: "#1e293b", border: "none", borderRadius: 6, color: "#f8fafc" };

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

// ── Dashboard ─────────────────────────────────────────────────────────────────
function AbaDashboard({ dash }: { dash: any }) {
  if (!dash) return <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Carregando…</div>;

  return (
    <div>
      {/* Alerta MAC */}
      <div style={{ background: "#fff7f7", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 16px", marginBottom: 18, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <AlertTriangle size={14} color="#dc2626" style={{ marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: 12, color: "#7f1d1d" }}>
          <strong>MAC crítico:</strong> execução {dash.mac_pct}% ({BRL(dash.mac_empenhado)} / {BRL(dash.mac_dotacao)}).
          Fila de {dash.fila_total} procedimentos ambulatoriais com {dash.especialidades_criticas.length} especialidades em status crítico.
          Acesse o <strong>Painel Financeiro</strong> para monitorar o bloco MAC.
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 10, marginBottom: 22 }}>
        <KpiCard label="Fila total"          value={dash.fila_total}          sub="procedimentos"           cor="#dc2626" icon={<Users size={13} color="#dc2626"/>} />
        <KpiCard label="Autorizadas/mês"     value={dash.autorizadas_mes}     sub={`${dash.taxa_autorizacao}% taxa`} cor="#16a34a" icon={<CheckCircle size={13} color="#16a34a"/>} />
        <KpiCard label="Negadas/mês"         value={dash.negadas_mes}         sub="revisar critérios"       cor="#d97706" icon={<AlertTriangle size={13} color="#d97706"/>} />
        <KpiCard label="Urgentes na fila"    value={dash.urgentes}            sub="prioridade"              cor="#ea580c" icon={<Clock size={13} color="#ea580c"/>} />
        <KpiCard label="Espera médio"        value={`${dash.tempo_espera_medio_dias}d`} sub="dias p/ autorização" cor="#7c3aed" icon={<Clock size={13} color="#7c3aed"/>} />
        <KpiCard label="Taxa ocupação leitos" value={`${dash.taxa_ocupacao}%`} sub={`${dash.leitos_ocupados}/${dash.leitos_referenciados}`} cor="#0891b2" icon={<TrendingUp size={13} color="#0891b2"/>} />
        <KpiCard label="AIH/mês"             value={BRLK(dash.valor_aih_mes)} sub="internações"            cor="#1d4ed8" icon={<DollarSign size={13} color="#1d4ed8"/>} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 22 }}>
        {/* Histórico */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Autorizações mensais por tipo</div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dash.historico} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TT} />
                <Bar dataKey="ambulatorial" stackId="a" fill="#1d4ed8" name="Ambulatorial" />
                <Bar dataKey="internacao"   stackId="a" fill="#7c3aed" name="Internação" />
                <Bar dataKey="tfd"          stackId="a" fill="#0891b2" name="TFD" />
                <Bar dataKey="negadas"      stackId="a" fill="#dc2626" name="Negadas" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Especialidades críticas */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Especialidades com maior fila</div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 12 }}>Crítico: Oftalmologia (61), Ortopedia (52), TC (45)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {dash.especialidades_criticas.map((e: string) => (
              <div key={e} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={11} color="#dc2626" />
                <span style={{ fontSize: 12, color: "#7f1d1d", fontWeight: 600 }}>{e}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: "10px 12px", background: "#f0fdf4", borderRadius: 8, fontSize: 12, color: "#166534" }}>
            <strong>TFD:</strong> {dash.tfd_autorizados_mes} autorizados · {dash.tfd_pendentes} pendentes este mês
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Fila Ambulatorial ─────────────────────────────────────────────────────────
function AbaFila({ fila }: { fila: any[] | undefined }) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("");
  if (!fila) return null;

  const filtrada = fila.filter(f =>
    (!busca || f.especialidade.toLowerCase().includes(busca.toLowerCase())) &&
    (!filtro || f.status_meta === filtro)
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
          <input placeholder="Buscar especialidade…" value={busca} onChange={e => setBusca(e.target.value)}
            style={{ width: "100%", paddingLeft: 32, padding: "6px 12px 6px 32px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
        {["", "critico", "atencao", "ok"].map(s => (
          <button key={s} onClick={() => setFiltro(s)} style={{
            padding: "5px 12px", border: `1px solid ${filtro === s ? "#1d4ed8" : "#d1d5db"}`, borderRadius: 20, fontSize: 11, cursor: "pointer",
            background: filtro === s ? "#eff6ff" : "#fff", color: filtro === s ? "#1d4ed8" : "#6b7280", fontWeight: filtro === s ? 700 : 400,
          }}>{s === "" ? "Todos" : s === "critico" ? "Crítico" : s === "atencao" ? "Atenção" : "OK"}</button>
        ))}
      </div>

      {/* Gráfico de barras fila */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Tamanho da fila por especialidade</div>
        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filtrada.slice(0, 12)} layout="vertical" barSize={12}>
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis type="category" dataKey="especialidade" tick={{ fontSize: 9 }} width={120} />
              <Tooltip contentStyle={TT} />
              <Bar dataKey="fila" name="Fila" radius={[0,4,4,0]}>
                {filtrada.slice(0, 12).map((f, i) => <Cell key={i} fill={COR_META(f.status_meta)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#1d4ed8", color: "#fff" }}>
              <th style={{ padding: "9px 14px", textAlign: "left" }}>Especialidade</th>
              <th style={{ padding: "9px 10px", textAlign: "left" }}>Tipo</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Fila</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Espera</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Aut./mês</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Neg./mês</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Urgentes</th>
              <th style={{ padding: "9px 10px", textAlign: "left" }}>Referência</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtrada.map((f, i) => (
              <tr key={f.id} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                <td style={{ padding: "9px 14px", fontWeight: 700 }}>{f.especialidade}</td>
                <td style={{ padding: "9px 10px", color: "#6b7280", fontSize: 11 }}>{f.tipo}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 700, color: COR_META(f.status_meta) }}>{f.fila}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", color: f.tempo_medio_dias > 90 ? "#dc2626" : "#d97706" }}>{f.tempo_medio_dias}d</td>
                <td style={{ padding: "9px 10px", textAlign: "right", color: "#16a34a", fontWeight: 600 }}>{f.autorizadas_mes}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", color: f.negadas_mes > 0 ? "#dc2626" : "#9ca3af" }}>{f.negadas_mes}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", color: f.urgentes > 0 ? "#ea580c" : "#9ca3af", fontWeight: f.urgentes > 0 ? 700 : 400 }}>{f.urgentes}</td>
                <td style={{ padding: "9px 10px", fontSize: 11, color: "#6b7280" }}>{f.referencia}</td>
                <td style={{ padding: "9px 10px", textAlign: "center" }}>
                  <span style={{ background: BG_META(f.status_meta), color: COR_META(f.status_meta), fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>
                    {LABEL_META(f.status_meta)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Internações / Leitos ──────────────────────────────────────────────────────
function AbaInternacoes({ internacoes }: { internacoes: any[] | undefined }) {
  if (!internacoes) return null;
  const totalLeitos = internacoes.reduce((s, i) => s + i.leitos_ref, 0);
  const ocupados    = internacoes.reduce((s, i) => s + i.ocupados, 0);
  const totalAIH    = internacoes.reduce((s, i) => s + i.valor_aih_mes, 0);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 22 }}>
        <div style={{ background: "#eff6ff", borderRadius: 10, padding: "16px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1d4ed8" }}>{totalLeitos}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Leitos referenciados</div>
        </div>
        <div style={{ background: "#fffbeb", borderRadius: 10, padding: "16px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#d97706" }}>{ocupados} / {totalLeitos}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Ocupados ({Math.round(ocupados/totalLeitos*100)}%)</div>
        </div>
        <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "16px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#16a34a" }}>{BRL(totalAIH)}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Valor AIH / mês</div>
        </div>
      </div>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#1d4ed8", color: "#fff" }}>
              <th style={{ padding: "10px 16px", textAlign: "left" }}>Tipo de internação</th>
              <th style={{ padding: "10px 12px", textAlign: "right" }}>Leitos ref.</th>
              <th style={{ padding: "10px 12px", textAlign: "right" }}>Ocupados</th>
              <th style={{ padding: "10px 12px", textAlign: "right" }}>Taxa ocup.</th>
              <th style={{ padding: "10px 12px", textAlign: "right" }}>AIH/mês</th>
              <th style={{ padding: "10px 12px", textAlign: "right" }}>Aut./mês</th>
              <th style={{ padding: "10px 12px", textAlign: "right" }}>Perm. média</th>
            </tr>
          </thead>
          <tbody>
            {internacoes.map((int, i) => {
              const taxa = Math.round(int.ocupados / int.leitos_ref * 100);
              const corTaxa = taxa >= 90 ? "#dc2626" : taxa >= 70 ? "#d97706" : "#16a34a";
              return (
                <tr key={int.id} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                  <td style={{ padding: "10px 16px", fontWeight: 600 }}>{int.tipo}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>{int.leitos_ref}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{int.ocupados}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: corTaxa }}>{taxa}%</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#1d4ed8", fontWeight: 700 }}>{BRL(int.valor_aih_mes)}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>{int.autorizadas_mes}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#6b7280" }}>{int.dias_medio_perm} dias</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: "#eff6ff", borderTop: "2px solid #bfdbfe" }}>
              <td style={{ padding: "10px 16px", fontWeight: 700 }}>TOTAL</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{totalLeitos}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{ocupados}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: "#d97706" }}>{Math.round(ocupados/totalLeitos*100)}%</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: "#16a34a" }}>{BRL(totalAIH)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── TFD ───────────────────────────────────────────────────────────────────────
function AbaTFD({ tfd }: { tfd: any[] | undefined }) {
  if (!tfd) return null;
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1d4ed8", margin: "0 0 4px" }}>TFD — Tratamento Fora do Domicílio</h2>
        <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Pacientes de Apuí/AM referenciados para Manaus · Abr/2026</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Autorizados",   n: tfd.filter(t=>t.status==="autorizado").length,   cor: "#16a34a" },
          { label: "Em análise",    n: tfd.filter(t=>t.status==="em_analise").length,    cor: "#d97706" },
          { label: "Pend. docum.",  n: tfd.filter(t=>t.status==="pendente_doc").length,  cor: "#dc2626" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", border: `1px solid ${s.cor}22`, borderTop: `3px solid ${s.cor}`, borderRadius: 8, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.cor }}>{s.n}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tfd.map(t => {
          const cor = COR_STATUS_TFD[t.status] ?? "#6b7280";
          const LABEL: Record<string,string> = { autorizado:"Autorizado", em_analise:"Em análise", pendente_doc:"Pend. doc." };
          return (
            <div key={t.id} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{t.especialidade}</span>
                  {t.urgencia === "urgente" && <span style={{ background: "#dc2626", color: "#fff", fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4 }}>URGENTE</span>}
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>Paciente: {t.paciente} · Destino: {t.destino} · Data: {t.data}</div>
              </div>
              <span style={{ background: `${cor}15`, color: cor, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6 }}>
                {LABEL[t.status]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────

type Aba = "dashboard" | "fila" | "internacoes" | "tfd";

export default function RegulacaoMAC() {
  const [aba, setAba] = useState<Aba>("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["reg-dashboard"],    queryFn: () => apiGet("/api/regulacao-mac/dashboard") as Promise<any> });
  const { data: fila }        = useQuery({ queryKey: ["reg-fila"],         queryFn: () => apiGet("/api/regulacao-mac/fila-ambulatorial") as Promise<any[]>, enabled: aba === "fila" });
  const { data: internacoes } = useQuery({ queryKey: ["reg-internacoes"],  queryFn: () => apiGet("/api/regulacao-mac/internacoes") as Promise<any[]>, enabled: aba === "internacoes" });
  const { data: tfd }         = useQuery({ queryKey: ["reg-tfd"],          queryFn: () => apiGet("/api/regulacao-mac/tfd") as Promise<any[]>, enabled: aba === "tfd" });

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "fila",        label: "Fila Ambulatorial" },
    { id: "internacoes", label: "Internações / Leitos" },
    { id: "tfd",         label: "TFD" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui, sans-serif" }}>
      {/* Cabeçalho */}
      <div style={{ background: "linear-gradient(135deg,#7c3aed 0%,#1d4ed8 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Regulação MAC — SUS Regulação / CROSS-AM</h1>
            <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>
              Média e Alta Complexidade · TFD · AIH · Apuí/AM
            </p>
            <div style={{ marginTop: 6, background: "rgba(255,255,255,.15)", borderRadius: 6, padding: "3px 10px", display: "inline-block", fontSize: 11 }}>
              ⚠ SISREG será descontinuado — sistema migrado para SUS Regulação (gov.br)
            </div>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "#dc262622", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dash.fila_total}</div>
                <div style={{ fontSize: 10, opacity: 0.8 }}>na fila total</div>
              </div>
              <div style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dash.mac_pct}%</div>
                <div style={{ fontSize: 10, opacity: 0.8 }}>MAC executado</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #dbeafe" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{
              padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13,
              borderBottom: aba === a.id ? "2px solid #7c3aed" : "2px solid transparent",
              color: aba === a.id ? "#7c3aed" : "#6b7280",
              fontWeight: aba === a.id ? 700 : 400, marginBottom: -2,
            }}>{a.label}</button>
          ))}
        </div>

        {aba === "dashboard"   && <AbaDashboard dash={dash} />}
        {aba === "fila"        && <AbaFila fila={fila} />}
        {aba === "internacoes" && <AbaInternacoes internacoes={internacoes} />}
        {aba === "tfd"         && <AbaTFD tfd={tfd} />}
      </div>
    </div>
  );
}
