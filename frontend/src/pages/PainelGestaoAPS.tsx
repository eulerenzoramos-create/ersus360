// src/pages/PainelGestaoAPS.tsx — Painel Gestão APS
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import {
  Activity, Users, Home, Syringe, CheckCircle, AlertTriangle,
  RefreshCw, ChevronDown, FileText,
} from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

const TT = { fontSize: 12, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6 };

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
    <span style={{ background: bg, color: cor, fontSize: 11, fontWeight: 700,
      padding: "2px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function KpiCard({ label, val, sub, icon, cor }: {
  label: string; val: string | number; sub?: string; icon: React.ReactNode; cor: string;
}) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}22`,
      borderTop: `3px solid ${cor}`, borderRadius: 8, padding: "14px 16px" }}>
      <div style={{ color: cor, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: cor }}>{val}</div>
      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function AbaAtendimentos() {
  const { data } = useQuery({
    queryKey: ["gestao-atendimentos"],
    queryFn: () => apiGet("/api/gestao/atendimentos") as Promise<any>,
  });

  if (!data) return (
    <NaoDisponivelBanner nota="Dados de atendimentos disponíveis no SISAB (sisab.saude.gov.br) e no e-SUS PEC local." />
  );

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        <KpiCard label="Total no período" val={data.total_periodo?.toLocaleString("pt-BR")}
          sub="Jan–Jul/2026" icon={<Activity size={18}/>} cor="#1d4ed8"/>
        <KpiCard label="Média mensal" val={Math.round(data.media_mensal || 0).toLocaleString("pt-BR")}
          sub="atendimentos/mês" icon={<Users size={18}/>} cor="#16a34a"/>
        <KpiCard label="Último mês (parcial)" val={data.serie_mensal?.at(-1)?.total?.toLocaleString("pt-BR") ?? "—"}
          sub={data.serie_mensal?.at(-1)?.mes} icon={<Activity size={18}/>} cor="#d97706"/>
      </div>
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>Atendimentos por Tipo — 2026</h3>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.serie_mensal} barGap={3}>
              <XAxis dataKey="mes" tick={{ fontSize: 11 }}/>
              <YAxis tick={{ fontSize: 11 }}/>
              <Tooltip contentStyle={TT}/>
              <Legend wrapperStyle={{ fontSize: 11 }}/>
              <Bar dataKey="medico"       name="Médico"       fill="#2563eb" radius={[3,3,0,0]} stackId="a"/>
              <Bar dataKey="enfermeiro"   name="Enfermeiro"   fill="#16a34a" radius={[3,3,0,0]} stackId="a"/>
              <Bar dataKey="odontologico" name="Odontológico" fill="#7c3aed" radius={[3,3,0,0]} stackId="a"/>
              <Bar dataKey="outros"       name="Outros"       fill="#d97706" radius={[3,3,0,0]} stackId="a"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              {["Mês","Médico","Enfermeiro","Odontológico","Outros","Total"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: h==="Mês"?"left":"right",
                  fontWeight: 600, color: "#6b7280" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data.serie_mensal||[]).map((m: any) => (
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

function AbaProcedimentos() {
  const { data } = useQuery({
    queryKey: ["gestao-procedimentos"],
    queryFn: () => apiGet("/api/gestao/procedimentos") as Promise<any>,
  });

  if (!data) return (
    <NaoDisponivelBanner nota="Dados de procedimentos disponíveis no SIGTAP/SIA (sia.datasus.gov.br)." />
  );

  return (
    <div>
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>Top Procedimentos SIGTAP — Jan-Jul/2026</h3>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.procedimentos} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" tick={{ fontSize: 10 }}/>
              <YAxis dataKey="nome" type="category" tick={{ fontSize: 10 }} width={180}/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="total" fill="#2563eb" radius={[0,3,3,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function AbaEquipes() {
  const { data } = useQuery({
    queryKey: ["gestao-equipes"],
    queryFn: () => apiGet("/api/gestao/equipes") as Promise<any>,
  });

  if (!data) return (
    <NaoDisponivelBanner nota="Dados de equipes disponíveis no CNES (cnes.datasus.gov.br)." />
  );

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <KpiCard label="Equipes eSF" val={data.esf ?? "—"} icon={<Home size={18}/>} cor="#1d4ed8"/>
        <KpiCard label="eAP 30h" val={data.eap30 ?? "—"} icon={<Users size={18}/>} cor="#16a34a"/>
        <KpiCard label="eAP 20h" val={data.eap20 ?? "—"} icon={<Users size={18}/>} cor="#7c3aed"/>
        <KpiCard label="NASF-AB" val={data.nasf ?? "—"} icon={<Syringe size={18}/>} cor="#d97706"/>
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              {["Equipe","Tipo","Responsável","Território","Status"].map(h=>(
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#6b7280" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data.lista||[]).map((e: any) => (
              <tr key={e.ine} style={{ borderTop: "1px solid #f3f4f6" }}>
                <td style={{ padding: "7px 12px", fontWeight: 600 }}>{e.nome}</td>
                <td style={{ padding: "7px 12px", color: "#6b7280" }}>{e.tipo}</td>
                <td style={{ padding: "7px 12px" }}>{e.responsavel}</td>
                <td style={{ padding: "7px 12px" }}>{e.territorio}</td>
                <td style={{ padding: "7px 12px" }}><Badge label={e.status} status={e.status_key||"verde"}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AbaVacinacao() {
  const { data } = useQuery({
    queryKey: ["gestao-vacinacao"],
    queryFn: () => apiGet("/api/gestao/vacinacao") as Promise<any>,
  });

  if (!data) return (
    <NaoDisponivelBanner nota="Dados de vacinação disponíveis no SI-PNI (datasus.gov.br/sipni)." />
  );

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        <KpiCard label="Cobertura DTP" val={`${data.cobertura_dtp ?? "—"}%`} icon={<Syringe size={18}/>} cor="#1d4ed8"/>
        <KpiCard label="Cobertura Polio" val={`${data.cobertura_polio ?? "—"}%`} icon={<Syringe size={18}/>} cor="#16a34a"/>
        <KpiCard label="Influenza ≥60" val={`${data.cobertura_influenza ?? "—"}%`} icon={<Syringe size={18}/>} cor="#d97706"/>
      </div>
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>Cobertura Vacinal — 2026</h3>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.serie||[]}>
              <XAxis dataKey="mes" tick={{ fontSize: 11 }}/>
              <YAxis tick={{ fontSize: 11 }} unit="%"/>
              <Tooltip contentStyle={TT}/>
              <Legend wrapperStyle={{ fontSize: 11 }}/>
              <Line dataKey="dtp" name="DTP" stroke="#2563eb" dot={false}/>
              <Line dataKey="polio" name="Polio" stroke="#16a34a" dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

type AbaId = "atendimentos" | "procedimentos" | "equipes" | "vacinacao";

export default function PainelGestaoAPS() {
  const [aba, setAba] = useState<AbaId>("atendimentos");

  const ABAS: { id: AbaId; label: string; icon: React.ReactNode }[] = [
    { id: "atendimentos",  label: "Atendimentos",  icon: <Activity size={13}/> },
    { id: "procedimentos", label: "Procedimentos", icon: <FileText size={13}/> },
    { id: "equipes",       label: "Equipes",        icon: <Users size={13}/> },
    { id: "vacinacao",     label: "Vacinação",      icon: <Syringe size={13}/> },
  ];

  const tabSt = (a: boolean): React.CSSProperties => ({
    padding: "9px 16px", border: "none", cursor: "pointer", fontSize: 12,
    fontWeight: a ? 700 : 400, background: a ? "#0d2137" : "transparent",
    color: a ? "#fff" : "#6b7280", borderRadius: "6px 6px 0 0",
    display: "flex", alignItems: "center", gap: 5,
  });

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", background: "#f0f5fb", minHeight: "100vh" }}>
      <div style={{ background: "#0d2137", color: "#fff", padding: "16px 24px",
        display: "flex", alignItems: "center", gap: 12 }}>
        <Activity size={20} color="#3b82f6"/>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Painel de Gestão APS — Apuí/AM</div>
          <div style={{ fontSize: 11, color: "#9ab8d8", marginTop: 2 }}>
            Atendimentos · Procedimentos · Equipes · Vacinação
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "20px 20px 48px" }}>
        <div style={{ display: "flex", gap: 2, borderBottom: "2px solid #dde4ee",
          marginBottom: 0, background: "#f0f5fb" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={tabSt(aba === a.id)}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
        <div style={{ background: "#fff", border: "1px solid #dde4ee",
          borderRadius: "0 0 10px 10px", padding: 20 }}>
          {aba === "atendimentos"  && <AbaAtendimentos/>}
          {aba === "procedimentos" && <AbaProcedimentos/>}
          {aba === "equipes"       && <AbaEquipes/>}
          {aba === "vacinacao"     && <AbaVacinacao/>}
        </div>
      </div>
    </div>
  );
}
