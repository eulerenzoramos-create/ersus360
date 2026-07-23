import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";
import { Brain, Users, AlertTriangle, Heart, Calendar } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#e4e7ec", border: "none", borderRadius: 6, color: "#f8fafc" };

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

const RISCO_COR: Record<string, string> = { alto: "#dc2626", medio: "#d97706", baixo: "#16a34a" };
const STATUS_COR: Record<string, string> = { critico: "#dc2626", atencao: "#d97706", estavel: "#16a34a" };

function AbaDashboard({ dash }: { dash: any }) {
  if (!dash) return null;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Usuários ativos"     value={`${dash.usuarios_ativos}/${dash.capacidade}`} sub={`Ocupação: ${dash.taxa_ocupacao}%`} cor="#7c3aed" icon={<Users size={14} color="#7c3aed"/>}/>
        <KpiCard label="Novos este mês"      value={dash.novos_mes}         sub="admissões Abr/26"          cor="#0891b2" icon={<Heart size={14} color="#0891b2"/>}/>
        <KpiCard label="Alto risco"          value={dash.alto_risco}        sub="acompanhamento intensivo"  cor={dash.alto_risco>0?"#dc2626":"#16a34a"} icon={<AlertTriangle size={14} color={dash.alto_risco>0?"#dc2626":"#16a34a"}/>}/>
        <KpiCard label="Status crítico"      value={dash.status_critico}    sub="usuários em crise"         cor={dash.status_critico>0?"#dc2626":"#16a34a"} icon={<Brain size={14} color={dash.status_critico>0?"#dc2626":"#16a34a"}/>}/>
        <KpiCard label="Leitos disponíveis"  value={dash.leitos_disponiveis} sub={`${dash.internacoes_mes} internações/mês`} cor="#16a34a" icon={<Heart size={14} color="#16a34a"/>}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Distribuição por diagnóstico</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dash.por_diagnostico} layout="vertical" barSize={12}>
                <XAxis type="number" tick={{ fontSize: 9 }}/>
                <YAxis type="category" dataKey="diag" tick={{ fontSize: 9 }} width={165}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="n" name="Usuários" fill="#7c3aed" radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Atendimentos mensais</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dash.historico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Line type="monotone" dataKey="atend" stroke="#7c3aed" strokeWidth={2.5} dot={false} name="Atendimentos"/>
                <Line type="monotone" dataKey="novos" stroke="#0891b2" strokeWidth={1.5} dot={false} name="Novos"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function AbaCAPS({ caps }: { caps: any }) {
  if (!caps) return null;
  const ocup = Math.round(caps.usuarios_ativos / caps.capacidade * 100);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>{caps.nome}</div>
        {[["Tipo", caps.tipo], ["Responsável", caps.responsavel], ["Usuários / Vagas", `${caps.usuarios_ativos} / ${caps.capacidade}`], ["Grupos/semana", caps.grupos_semana]].map(([k, v]) => (
          <div key={String(k)} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}>
            <span style={{ color: "#6b7280" }}>{k}</span>
            <span style={{ fontWeight: 600 }}>{String(v)}</span>
          </div>
        ))}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>Ocupação de vagas</div>
          <div style={{ background: "#f3f4f6", borderRadius: 6, height: 12, overflow: "hidden" }}>
            <div style={{ background: ocup >= 90 ? "#dc2626" : "#7c3aed", height: "100%", width: `${ocup}%`, borderRadius: 6 }}/>
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{caps.usuarios_ativos}/{caps.capacidade} ({ocup}%)</div>
        </div>
      </div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Equipe de profissionais</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              <th style={{ padding: "7px 10px", textAlign: "left", color: "#6b7280", fontWeight: 600 }}>Cargo</th>
              <th style={{ padding: "7px 10px", textAlign: "left", color: "#6b7280", fontWeight: 600 }}>Nome</th>
              <th style={{ padding: "7px 10px", textAlign: "right", color: "#6b7280", fontWeight: 600 }}>CH</th>
            </tr>
          </thead>
          <tbody>
            {caps.profissionais.map((p: any, i: number) => (
              <tr key={i} style={{ borderTop: "1px solid #f3f4f6" }}>
                <td style={{ padding: "7px 10px" }}>{p.cargo}</td>
                <td style={{ padding: "7px 10px", color: "#6b7280" }}>{p.nome}</td>
                <td style={{ padding: "7px 10px", textAlign: "right" }}>{p.ch}h/sem</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AbaUsuarios({ usuarios }: { usuarios: any[] | undefined }) {
  const [busca, setBusca] = useState("");
  const [filtroRisco, setFiltroRisco] = useState("todos");
  if (!usuarios) return null;
  const lista = usuarios.filter(u =>
    (filtroRisco === "todos" || u.risco === filtroRisco) &&
    (busca === "" || u.diagnostico.toLowerCase().includes(busca.toLowerCase()) || u.iniciais.toLowerCase().includes(busca.toLowerCase()))
  );
  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por iniciais ou diagnóstico..." style={{ flex: 1, padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13 }}/>
        <select value={filtroRisco} onChange={e => setFiltroRisco(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13 }}>
          <option value="todos">Todos riscos</option>
          <option value="alto">Alto risco</option>
          <option value="medio">Médio risco</option>
          <option value="baixo">Baixo risco</option>
        </select>
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#7c3aed", color: "#fff" }}>
              <th style={{ padding: "9px 14px", textAlign: "left" }}>Usuário</th>
              <th style={{ padding: "9px 10px", textAlign: "left" }}>Diagnóstico (CID-10)</th>
              <th style={{ padding: "9px 10px", textAlign: "left" }}>Frequência</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Meses</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>Risco</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((u, i) => (
              <tr key={u.id} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                <td style={{ padding: "9px 14px", fontWeight: 600 }}>{u.iniciais}</td>
                <td style={{ padding: "9px 10px", color: "#374151" }}>{u.diagnostico}</td>
                <td style={{ padding: "9px 10px", color: "#6b7280" }}>{u.frequencia}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", color: "#6b7280" }}>{u.meses_acomp}</td>
                <td style={{ padding: "9px 10px", textAlign: "center" }}>
                  <span style={{ background: RISCO_COR[u.risco] + "15", color: RISCO_COR[u.risco], fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, textTransform: "capitalize" as const }}>{u.risco}</span>
                </td>
                <td style={{ padding: "9px 10px", textAlign: "center" }}>
                  <span style={{ background: STATUS_COR[u.status] + "15", color: STATUS_COR[u.status], fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, textTransform: "capitalize" as const }}>{u.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>{lista.length} usuários exibidos</div>
    </div>
  );
}

function AbaGrupos({ grupos }: { grupos: any[] | undefined }) {
  if (!grupos) return null;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
        {grupos.map(g => (
          <div key={g.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e7ec" }}>{g.nome}</div>
              <span style={{ background: "#7c3aed15", color: "#7c3aed", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 5 }}>{g.n_usuarios} usuários</span>
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#6b7280" }}>
              <div><Calendar size={12} style={{ display: "inline", marginRight: 4 }}/>{g.dia} {g.horario}</div>
              <div>Facilitador: <span style={{ color: "#374151", fontWeight: 500 }}>{g.facilitador}</span></div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 18, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
        <strong>Semana terapêutica CAPS I Apuí</strong> — {grupos.reduce((a, g) => a + g.n_usuarios, 0)} participações/semana em {grupos.length} grupos ativos. Grupos em conformidade com Portaria GM/MS nº 3.088/2011 (RAPS).
      </div>
    </div>
  );
}

function AbaLeitos({ leitos }: { leitos: any[] | undefined }) {
  if (!leitos) return null;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {leitos.map((l, i) => {
          const ocup = Math.round((l.total - l.disponiveis) / l.total * 100);
          return (
            <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{l.hospital}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 14 }}>{l.tipo}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[["Total", l.total, "#1d4ed8"], ["Disponíveis", l.disponiveis, l.disponiveis > 0 ? "#16a34a" : "#dc2626"], ["Internações/mês", l.internacoes_mes, "#7c3aed"]].map(([k, v, c]) => (
                  <div key={String(k)} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: String(c) }}>{v}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{k}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ background: "#f3f4f6", borderRadius: 6, height: 10, overflow: "hidden" }}>
                  <div style={{ background: "#7c3aed", height: "100%", width: `${ocup}%`, borderRadius: 6 }}/>
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Ocupação: {ocup}%</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 18, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
        <strong>Rede de referência psiquiátrica:</strong> CAPS I Apuí + Hospital Regional Apuí + HPGV Manaus (Hospital Psiquiátrico Gustavo Riedel). Regulação via Central de Regulação MAC/CROSS-AM para Manaus.
      </div>
    </div>
  );
}

type Aba = "dashboard"|"caps"|"usuarios"|"grupos"|"leitos";

export default function RAPS() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash }     = useQuery({ queryKey: ["raps-dash"],   queryFn: () => apiGet("/api/raps/dashboard") as Promise<any> });
  const { data: caps }     = useQuery({ queryKey: ["raps-caps"],   queryFn: () => apiGet("/api/raps/caps") as Promise<any>,    enabled: aba === "caps" });
  const { data: usuarios } = useQuery({ queryKey: ["raps-users"],  queryFn: () => apiGet("/api/raps/usuarios") as Promise<any[]>, enabled: aba === "usuarios" });
  const { data: grupos }   = useQuery({ queryKey: ["raps-grp"],    queryFn: () => apiGet("/api/raps/grupos") as Promise<any[]>,  enabled: aba === "grupos" });
  const { data: leitos }   = useQuery({ queryKey: ["raps-leitos"], queryFn: () => apiGet("/api/raps/leitos") as Promise<any[]>,  enabled: aba === "leitos" });

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "caps",      label: "CAPS I" },
    { id: "usuarios",  label: "Usuários" },
    { id: "grupos",    label: "Grupos Terapêuticos" },
    { id: "leitos",    label: "Leitos de Referência" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#7c3aed 0%,#ec4899 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>RAPS — Saúde Mental</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Rede de Atenção Psicossocial · CAPS I Apuí/AM · Portaria GM/MS nº 3.088/2011</p>
          </div>
          {dash && (
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{dash.usuarios_ativos}</div>
              <div style={{ fontSize: 10, opacity: .8 }}>usuários ativos</div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #f3e8ff" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba === a.id ? "2px solid #7c3aed" : "2px solid transparent", color: aba === a.id ? "#7c3aed" : "#6b7280", fontWeight: aba === a.id ? 700 : 400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba === "dashboard" && <AbaDashboard dash={dash}/>}
        {aba === "caps"      && <AbaCAPS caps={caps}/>}
        {aba === "usuarios"  && <AbaUsuarios usuarios={usuarios}/>}
        {aba === "grupos"    && <AbaGrupos grupos={grupos}/>}
        {aba === "leitos"    && <AbaLeitos leitos={leitos}/>}
      </div>
    </div>
  );
}
