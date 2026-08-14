import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";
import { Home, AlertTriangle, Users, Activity } from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };
const MOD_COR: Record<string, string> = { AD1: "#16a34a", AD2: "#1d4ed8", AD3: "#dc2626" };

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

function AbaDashboard({ dash }: { dash: any }) {
  if (!dash) return <NaoDisponivelBanner nota="Dados indisponíveis. Integração não configurada no Railway. Nenhum valor foi inventado." />;
  const modalData = [
    { mod: "AD1", n: dash.ad1, cor: "#16a34a" },
    { mod: "AD2", n: dash.ad2, cor: "#1d4ed8" },
    { mod: "AD3", n: dash.ad3, cor: "#dc2626" },
  ];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Pacientes ativos"   value={dash.pacientes_ativos} sub="em programa SAD"     cor="#1d4ed8" icon={<Home size={14} color="#1d4ed8"/>}/>
        <KpiCard label="AD3 (alta depend.)" value={dash.ad3}             sub="cuidados intensivos"   cor="#dc2626" icon={<AlertTriangle size={14} color="#dc2626"/>}/>
        <KpiCard label="Com alerta"         value={dash.com_alerta}      sub="requerem atenção"      cor={dash.com_alerta>3?"#dc2626":"#d97706"} icon={<AlertTriangle size={14} color={dash.com_alerta>3?"#dc2626":"#d97706"}/>}/>
        <KpiCard label="Visitas/mês"        value={dash.visitas_mes}     sub="realizadas Mar/26"     cor="#16a34a" icon={<Activity size={14} color="#16a34a"/>}/>
        <KpiCard label="Procedimentos/mês"  value={dash.procedimentos_mes} sub="Mar/2026"            cor="#7c3aed" icon={<Users size={14} color="#7c3aed"/>}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Visitas e procedimentos — 6 meses</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dash.historico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Line type="monotone" dataKey="visitas_domiciliares" stroke="#1d4ed8" strokeWidth={2.5} dot={{ r: 3 }} name="Visitas"/>
                <Line type="monotone" dataKey="procedimentos"        stroke="#7c3aed" strokeWidth={1.5} dot={false}   name="Procedimentos"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Pacientes por modalidade — Mar/26</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modalData} barSize={50}>
                <XAxis dataKey="mod" tick={{ fontSize: 12 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="n" name="Pacientes" radius={[4,4,0,0]}>
                  {modalData.map((m, i) => (
                    <rect key={i} fill={m.cor}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8, fontSize: 11 }}>
            {modalData.map(m => (
              <span key={m.mod} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: m.cor, display: "inline-block" }}/>
                <span style={{ color: m.cor, fontWeight: 700 }}>{m.mod}: {m.n}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AbaPacientes({ pacientes }: { pacientes: any[] | undefined }) {
  const [filtro, setFiltro] = useState("todos");
  const [busca, setBusca] = useState("");
  if (!pacientes) return <NaoDisponivelBanner nota="Dados indisponíveis. Nenhum valor foi inventado." />;
  const lista = pacientes.filter(p =>
    (filtro === "todos" || p.modalidade === filtro || (filtro === "alerta" && p.alerta)) &&
    (busca === "" || p.nome.toLowerCase().includes(busca.toLowerCase()) || p.cid.toLowerCase().includes(busca.toLowerCase()))
  );
  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar nome ou CID..." style={{ flex: 1, padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13 }}/>
        <select value={filtro} onChange={e => setFiltro(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13 }}>
          <option value="todos">Todos</option>
          <option value="AD1">AD1</option>
          <option value="AD2">AD2</option>
          <option value="AD3">AD3</option>
          <option value="alerta">Com alerta</option>
        </select>
        <div style={{ fontSize: 12, color: "#9ca3af", alignSelf: "center" }}>{lista.length} pacientes</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {lista.map(p => {
          const modCor = MOD_COR[p.modalidade];
          return (
            <div key={p.id} style={{ background: "#fff", border: `1px solid ${p.alerta?"#dc262622":"#e5e7eb"}`, borderLeft: `4px solid ${modCor}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{p.nome} <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 400 }}>{p.idade}a</span></div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ background: modCor+"15", color: modCor, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>{p.modalidade}</span>
                  {p.alerta && <span style={{ background: "#fef2f2", color: "#dc2626", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>⚠ {p.alerta}</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#6b7280" }}>
                <span>CID: <strong style={{ color: "#374151" }}>{p.cid}</strong></span>
                <span>Equipe: <strong>{p.equipe}</strong></span>
                <span>Cuidador: <strong>{p.cuidador}</strong></span>
                <span>Dias no programa: <strong>{p.dias_programa}</strong></span>
                <span>Visitas/mês: <strong>{p.visitas_mes}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaEquipe({ emad }: { emad: any }) {
  if (!emad) return <NaoDisponivelBanner nota="Dados indisponíveis. Nenhum valor foi inventado." />;
  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{emad.nome}</div>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>Portaria GM/MS nº 825/2016 · Transporte: {emad.transporte} · Abrangência: {emad.area_abrangencia}</div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Composição da equipe EMAD</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {emad.composicao.map((m: any, i: number) => (
            <div key={i} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{m.profissional}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{m.carga_horaria} · {m.vinculo}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "12px 16px", fontSize: 12 }}>
        <strong>EMAD</strong> (Equipe Multiprofissional de Atenção Domiciliar) — responsável pelos pacientes AD2 e AD3. Pacientes AD1 são acompanhados pelas equipes ESF. Critério de AD3: dependência intensiva de equipamento ou procedimentos de alta complexidade no domicílio.
      </div>
    </div>
  );
}

function AbaProducao({ prod }: { prod: any[] | undefined }) {
  if (!prod) return <NaoDisponivelBanner nota="Dados indisponíveis. Nenhum valor foi inventado." />;
  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Produção mensal SAD — 6 meses</div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={prod} barSize={18}>
              <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
              <YAxis tick={{ fontSize: 10 }}/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="visitas_domiciliares" name="Visitas"       fill="#1d4ed8" radius={[4,4,0,0]}/>
              <Bar dataKey="procedimentos"        name="Procedimentos" fill="#7c3aed" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#1d4ed8", color: "#fff" }}>
              {["Mês","Visitas","Proced.","AD1","AD2","AD3","Altas","Óbitos"].map(h=>(
                <th key={h} style={{ padding: "8px 12px", textAlign: h==="Mês"?"left":"center" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {prod.map((m, i) => (
              <tr key={m.mes} style={{ borderTop: "1px solid #f3f4f6", background: i%2===0?"#fff":"#f9fafb" }}>
                <td style={{ padding: "8px 12px", fontWeight: 600 }}>{m.mes}</td>
                <td style={{ padding: "8px 12px", textAlign: "center", color: "#1d4ed8", fontWeight: 700 }}>{m.visitas_domiciliares}</td>
                <td style={{ padding: "8px 12px", textAlign: "center", color: "#7c3aed" }}>{m.procedimentos}</td>
                <td style={{ padding: "8px 12px", textAlign: "center", color: "#16a34a" }}>{m.ad1}</td>
                <td style={{ padding: "8px 12px", textAlign: "center", color: "#1d4ed8" }}>{m.ad2}</td>
                <td style={{ padding: "8px 12px", textAlign: "center", color: "#dc2626", fontWeight: m.ad3>2?700:400 }}>{m.ad3}</td>
                <td style={{ padding: "8px 12px", textAlign: "center" }}>{m.altas}</td>
                <td style={{ padding: "8px 12px", textAlign: "center", color: m.obitos>0?"#dc2626":"#9ca3af" }}>{m.obitos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type Aba = "dashboard"|"pacientes"|"equipe"|"producao";

export default function AtencaoDomiciliar() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash }      = useQuery({ queryKey: ["ad-dash"],  queryFn: () => apiGet("/api/atencao-domiciliar/dashboard") as Promise<any> });
  const { data: pacientes } = useQuery({ queryKey: ["ad-pac"],   queryFn: () => apiGet("/api/atencao-domiciliar/pacientes")  as Promise<any[]>, enabled: aba==="pacientes" });
  const { data: emad }      = useQuery({ queryKey: ["ad-emad"],  queryFn: () => apiGet("/api/atencao-domiciliar/equipe")     as Promise<any>,   enabled: aba==="equipe" });
  const { data: prod = []}      = useQuery({ queryKey: ["ad-prod"],  queryFn: () => apiGet("/api/atencao-domiciliar/producao")   as Promise<any[]>, enabled: aba==="producao" });

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "pacientes", label: `Pacientes (${(dash as any)?.pacientes_ativos ?? 0})` },
    { id: "equipe",    label: "EMAD" },
    { id: "producao",  label: "Produção" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Atenção Domiciliar — SAD/EMAD</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>AD1 · AD2 · AD3 · Portaria GM/MS nº 825/2016 · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{(dash as any).pacientes_ativos}</div>
              <div style={{ fontSize: 10, opacity: .8 }}>pacientes ativos</div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e4e7ec" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #1d4ed8":"2px solid transparent", color: aba===a.id?"#1d4ed8":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard" && !dash && <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />}
        {aba==="dashboard" && <AbaDashboard dash={dash}/>}
        {aba==="pacientes" && <AbaPacientes pacientes={pacientes}/>}
        {aba==="equipe"    && <AbaEquipe emad={emad}/>}
        {aba==="producao"  && <AbaProducao prod={prod}/>}
      </div>
    </div>
  );
}
