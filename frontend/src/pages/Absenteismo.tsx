import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell,
} from "recharts";
import { Users, AlertTriangle, CheckCircle, Clock, Search } from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

const COR_STATUS = (s: string) =>
  s === "critico" ? "#dc2626" : s === "atencao" ? "#d97706" : "#16a34a";
const BG_STATUS = (s: string) =>
  s === "critico" ? "#fff7f7" : s === "atencao" ? "#fffbeb" : "#f0fdf4";
const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };

function KpiCard({ label, value, sub, cor, icon }: { label: string; value: string | number; sub?: string; cor: string; icon: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}22`, borderTop: `3px solid ${cor}`, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: "#6b7280" }}>{label}</span>
        <div style={{ background: `${cor}15`, borderRadius: 6, padding: 5 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: cor, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export default function Absenteismo() {
  const [busca, setBusca] = useState("");

  const { data: dash }      = useQuery({ queryKey: ["abs-dashboard"], queryFn: () => apiGet("/api/absenteismo/dashboard") as Promise<any> });
  const { data: servidores }= useQuery({ queryKey: ["abs-servidores"],queryFn: () => apiGet("/api/absenteismo/servidores") as Promise<any[]> });

  const filtrados = (servidores ?? []).filter(s =>
    !busca || s.nome.toLowerCase().includes(busca.toLowerCase()) ||
    s.cargo.toLowerCase().includes(busca.toLowerCase()) ||
    s.unidade.toLowerCase().includes(busca.toLowerCase())
  );

  if (!dash) return <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />;

  const motivos = [
    { label: "Atestado médico", n: dash.motivos.medico,  cor: "#d97706" },
    { label: "Injustificado",   n: dash.motivos.injust,  cor: "#dc2626" },
    { label: "Licença",         n: dash.motivos.licenca, cor: "#1d4ed8" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui, sans-serif" }}>
      {/* Cabeçalho */}
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Absenteísmo — Gestão de Frequência</h1>
            <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>FMS Apuí/AM · Meta ≤ 8% · Competência Abr/2026</p>
          </div>
          <div style={{ background: dash.conforme ? "#16a34a" : "#dc2626", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{dash.taxa_geral}%</div>
            <div style={{ fontSize: 10, opacity: 0.9 }}>taxa geral {dash.conforme ? "✓ conforme" : "✗ crítico"}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 24px" }}>
        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 22 }}>
          <KpiCard label="Servidores ativos"  value={dash.total_servidores} sub="FMS total"     cor="#1d4ed8" icon={<Users size={14} color="#1d4ed8"/>} />
          <KpiCard label="Taxa absenteísmo"   value={`${dash.taxa_geral}%`} sub={`meta ≤ ${dash.meta_taxa}%`} cor={dash.conforme ? "#16a34a" : "#dc2626"} icon={<CheckCircle size={14} color={dash.conforme ? "#16a34a" : "#dc2626"}/>} />
          <KpiCard label="Dias faltados/mês"  value={dash.total_dias_falta} sub={`de ${dash.total_dias_trab} trabalhados`} cor="#d97706" icon={<Clock size={14} color="#d97706"/>} />
          <KpiCard label="Servidores críticos" value={dash.n_criticos} sub="taxa ≥ 10%" cor={dash.n_criticos > 0 ? "#dc2626" : "#16a34a"} icon={<AlertTriangle size={14} color={dash.n_criticos > 0 ? "#dc2626" : "#16a34a"}/>} />
          <KpiCard label="Injustificados"      value={dash.motivos.injust}  sub="dias no mês"  cor="#dc2626" icon={<AlertTriangle size={14} color="#dc2626"/>} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 22 }}>
          {/* Histórico */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Taxa de absenteísmo — últimos 6 meses</div>
            <div style={{ height: 170 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dash.historico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={TT} formatter={(v: number) => [`${v}%`, "Taxa"]} />
                  <Line type="monotone" dataKey="pct" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4 }} name="Taxa %" />
                  <Line type="monotone" dataKey={() => 8} stroke="#dc2626" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="Meta 8%" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Por cargo + motivos */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Taxa por cargo</div>
            <div style={{ height: 120, marginBottom: 14 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dash.por_cargo.slice(0,6)} layout="vertical" barSize={10}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="cargo" tick={{ fontSize: 9 }} width={130} />
                  <Tooltip contentStyle={TT} formatter={(v: number) => [`${v}%`, "Taxa"]} />
                  <Bar dataKey="taxa" name="Taxa" radius={[0,4,4,0]}>
                    {dash.por_cargo.slice(0,6).map((c: any, i: number) => (
                      <Cell key={i} fill={c.taxa >= 10 ? "#dc2626" : c.taxa >= 5 ? "#d97706" : "#16a34a"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Motivos de falta</div>
            <div style={{ display: "flex", gap: 10 }}>
              {motivos.map(m => (
                <div key={m.label} style={{ flex: 1, textAlign: "center", background: "#f9fafb", borderRadius: 8, padding: "8px 6px" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: m.cor }}>{m.n}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Busca */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input placeholder="Buscar por nome, cargo ou unidade…" value={busca} onChange={e => setBusca(e.target.value)}
              style={{ width: "100%", paddingLeft: 32, padding: "6px 12px 6px 32px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>{filtrados.length} servidores</span>
        </div>

        {/* Tabela servidores */}
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#374151", color: "#fff" }}>
                <th style={{ padding: "9px 14px", textAlign: "left" }}>Servidor</th>
                <th style={{ padding: "9px 12px", textAlign: "left" }}>Cargo</th>
                <th style={{ padding: "9px 12px", textAlign: "left" }}>Unidade</th>
                <th style={{ padding: "9px 10px", textAlign: "right" }}>D. Trabalhados</th>
                <th style={{ padding: "9px 10px", textAlign: "right" }}>D. Faltados</th>
                <th style={{ padding: "9px 10px", textAlign: "right" }}>Médico</th>
                <th style={{ padding: "9px 10px", textAlign: "right" }}>Injustif.</th>
                <th style={{ padding: "9px 10px", textAlign: "right" }}>Licença</th>
                <th style={{ padding: "9px 10px", textAlign: "right" }}>Taxa</th>
                <th style={{ padding: "9px 10px", textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((s, i) => (
                <tr key={s.id} style={{ borderTop: "1px solid #f3f4f6", background: s.status === "critico" ? "#fff7f7" : i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                  <td style={{ padding: "9px 14px", fontWeight: 600 }}>{s.nome}</td>
                  <td style={{ padding: "9px 12px", color: "#6b7280" }}>{s.cargo}</td>
                  <td style={{ padding: "9px 12px", color: "#6b7280", fontSize: 11 }}>{s.unidade}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right" }}>{s.dt}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: s.df > 0 ? 700 : 400, color: s.df >= 5 ? "#dc2626" : "#374151" }}>{s.df}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right", color: s.motivos.medico > 0 ? "#d97706" : "#9ca3af" }}>{s.motivos.medico}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right", color: s.motivos.injust > 0 ? "#dc2626" : "#9ca3af", fontWeight: s.motivos.injust > 0 ? 700 : 400 }}>{s.motivos.injust}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right", color: s.motivos.licenca > 0 ? "#1d4ed8" : "#9ca3af" }}>{s.motivos.licenca}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 700, color: COR_STATUS(s.status) }}>{s.taxa}%</td>
                  <td style={{ padding: "9px 10px", textAlign: "center" }}>
                    <span style={{ background: BG_STATUS(s.status), color: COR_STATUS(s.status), fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>
                      {s.status === "ok" ? "OK" : s.status === "atencao" ? "Atenção" : "Crítico"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
