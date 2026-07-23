import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Wrench, AlertTriangle, CheckCircle, Clock, DollarSign } from "lucide-react";
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

const STATUS_LABEL: Record<string, string> = {
  operante:           "Operante",
  em_manutencao:      "Em manutenção",
  aguardando_peca:    "Aguard. peça",
  preventiva_vencida: "Prev. vencida",
};
const STATUS_COR: Record<string, string> = {
  operante:           "#16a34a",
  em_manutencao:      "#dc2626",
  aguardando_peca:    "#dc2626",
  preventiva_vencida: "#d97706",
};
const CRIT_COR: Record<string, string> = { critica: "#dc2626", alta: "#d97706", media: "#6b7280" };
const ORDEM_STATUS_COR: Record<string, string> = {
  em_execucao:  "#0891b2",
  aguard_peca:  "#d97706",
  agendada:     "#7c3aed",
  concluida:    "#16a34a",
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
function AbaDashboard({ dash }: { dash: any }) {
  if (!dash) return null;
  const disponib = dash.taxa_disponibilidade;
  const barData = [
    { nome: "Operantes",        n: dash.operantes,         cor: "#16a34a" },
    { nome: "Em manutenção",    n: dash.em_manutencao,     cor: "#dc2626" },
    { nome: "Aguard. peça",     n: dash.aguardando_peca,   cor: "#dc2626" },
    { nome: "Prev. vencida",    n: dash.preventiva_vencida,cor: "#d97706" },
  ];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Disponibilidade"   value={`${disponib}%`}              sub={`${dash.operantes}/${dash.total_equipamentos} operantes`} cor={disponib>=85?"#16a34a":"#dc2626"} icon={<CheckCircle size={14} color={disponib>=85?"#16a34a":"#dc2626"}/>}/>
        <KpiCard label="Em manutenção"     value={dash.em_manutencao}          sub="equipamentos"                                             cor="#dc2626" icon={<Wrench size={14} color="#dc2626"/>}/>
        <KpiCard label="Aguard. peça"      value={dash.aguardando_peca}        sub="equipamentos parados"                                     cor="#dc2626" icon={<AlertTriangle size={14} color="#dc2626"/>}/>
        <KpiCard label="Ordens abertas"    value={dash.ordens_abertas}         sub="em aberto"                                                cor="#d97706" icon={<Clock size={14} color="#d97706"/>}/>
        <KpiCard label="Custo estimado"    value={`R$ ${dash.custo_estimado_aberto.toLocaleString("pt-BR",{minimumFractionDigits:0})}`} sub="ordens em aberto" cor="#7c3aed" icon={<DollarSign size={14} color="#7c3aed"/>}/>
      </div>

      {dash.equipamentos_criticos_parados.length > 0 && (
        <div style={{ background: "#fff7f7", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 16px", marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", marginBottom: 6 }}>Equipamentos críticos parados</div>
          {dash.equipamentos_criticos_parados.map((e: string) => (
            <div key={e} style={{ fontSize: 12, color: "#7f1d1d", padding: "2px 0" }}>• {e}</div>
          ))}
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Status do parque de equipamentos ({dash.total_equipamentos} itens)</div>
        <div style={{ height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} barSize={36}>
              <XAxis dataKey="nome" tick={{ fontSize: 10 }}/>
              <YAxis tick={{ fontSize: 10 }}/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="n" name="Qtd" radius={[4,4,0,0]}>
                {barData.map((b, i) => <Cell key={i} fill={b.cor}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Equipamentos ──────────────────────────────────────────────────────────────
function AbaEquipamentos({ equips }: { equips: any[] | undefined }) {
  const [filtro, setFiltro] = useState("todos");
  if (!equips) return null;
  const lista = filtro === "todos" ? equips : equips.filter(e => e.status === filtro);
  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <select value={filtro} onChange={e => setFiltro(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13 }}>
          <option value="todos">Todos os status</option>
          <option value="operante">Operantes</option>
          <option value="em_manutencao">Em manutenção</option>
          <option value="aguardando_peca">Aguardando peça</option>
          <option value="preventiva_vencida">Preventiva vencida</option>
        </select>
        <div style={{ fontSize: 12, color: "#9ca3af", alignSelf: "center" }}>{lista.length} equipamentos</div>
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#d97706", color: "#fff" }}>
              <th style={{ padding: "9px 14px", textAlign: "left" }}>Equipamento</th>
              <th style={{ padding: "9px 10px", textAlign: "left" }}>Unidade</th>
              <th style={{ padding: "9px 10px", textAlign: "left" }}>Fabricante</th>
              <th style={{ padding: "9px 10px", textAlign: "left" }}>N° Série</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Dias parado</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>Criticidade</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>Status</th>
              <th style={{ padding: "9px 10px", textAlign: "left" }}>Próx. prev.</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((e, i) => (
              <tr key={e.id} style={{ borderTop: "1px solid #f3f4f6", background: e.status !== "operante" ? "#fff7f7" : i%2===0?"#fff":"#f9fafb" }}>
                <td style={{ padding: "9px 14px", fontWeight: 600 }}>{e.equipamento}</td>
                <td style={{ padding: "9px 10px", color: "#374151" }}>{e.unidade}</td>
                <td style={{ padding: "9px 10px", color: "#6b7280" }}>{e.fabricante}</td>
                <td style={{ padding: "9px 10px", fontSize: 11, color: "#9ca3af" }}>{e.n_serie}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: e.dias_parado > 0 ? 700 : 400, color: e.dias_parado > 30 ? "#dc2626" : e.dias_parado > 0 ? "#d97706" : "#9ca3af" }}>
                  {e.dias_parado > 0 ? e.dias_parado : "—"}
                </td>
                <td style={{ padding: "9px 10px", textAlign: "center" }}>
                  <span style={{ background: CRIT_COR[e.criticidade]+"15", color: CRIT_COR[e.criticidade], fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, textTransform: "capitalize" as const }}>{e.criticidade}</span>
                </td>
                <td style={{ padding: "9px 10px", textAlign: "center" }}>
                  <span style={{ background: STATUS_COR[e.status]+"15", color: STATUS_COR[e.status], fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>{STATUS_LABEL[e.status]}</span>
                </td>
                <td style={{ padding: "9px 10px", fontSize: 11, color: e.proxima_prev < "2026-07-01" ? "#dc2626" : "#6b7280" }}>{e.proxima_prev}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Ordens de Serviço ─────────────────────────────────────────────────────────
function AbaOrdens({ ordens }: { ordens: any[] | undefined }) {
  if (!ordens) return null;
  const totalCusto = ordens.filter(o => o.status !== "concluida").reduce((s, o) => s + o.custo_est, 0);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14, textAlign: "center" }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#0891b2" }}>{ordens.filter(o => o.status === "em_execucao").length}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Em execução</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14, textAlign: "center" }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#d97706" }}>{ordens.filter(o => o.status === "aguard_peca").length}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Aguardando peça</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14, textAlign: "center" }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#7c3aed" }}>R$ {totalCusto.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Custo total estimado</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {ordens.map(o => (
          <div key={o.id} style={{ background: "#fff", border: `1px solid ${o.status === "aguard_peca" ? "#fed7aa" : "#e5e7eb"}`, borderRadius: 10, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>OS #{o.id} — {o.equipamento_nome}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{o.descricao}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                <span style={{ background: ORDEM_STATUS_COR[o.status]+"15", color: ORDEM_STATUS_COR[o.status], fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4 }}>
                  {o.status === "em_execucao" ? "Em execução" : o.status === "aguard_peca" ? "Aguard. peça" : o.status === "agendada" ? "Agendada" : "Concluída"}
                </span>
                <span style={{ background: o.tipo === "corretiva" ? "#fef2f2" : "#eff6ff", color: o.tipo === "corretiva" ? "#dc2626" : "#1d4ed8", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4 }}>
                  {o.tipo === "corretiva" ? "Corretiva" : "Preventiva"}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 24, fontSize: 12, color: "#6b7280" }}>
              <span>Empresa: <strong style={{ color: "#374151" }}>{o.empresa}</strong></span>
              <span>Abertura: <strong>{o.data_aber}</strong></span>
              <span>Previsão: <strong>{o.prev_conclusao}</strong></span>
              <span>Custo est.: <strong style={{ color: "#7c3aed" }}>R$ {o.custo_est.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></span>
              <span>Solicitante: <strong>{o.solicitante}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type Aba = "dashboard"|"equipamentos"|"ordens";

export default function Manutencao() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash }   = useQuery({ queryKey: ["man-dash"],  queryFn: () => apiGet("/api/manutencao/dashboard") as Promise<any> });
  const { data: equips } = useQuery({ queryKey: ["man-equip"], queryFn: () => apiGet("/api/manutencao/equipamentos") as Promise<any[]>, enabled: aba === "equipamentos" });
  const { data: ordens } = useQuery({ queryKey: ["man-ord"],   queryFn: () => apiGet("/api/manutencao/ordens") as Promise<any[]>,        enabled: aba === "ordens" });

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",    label: "Dashboard" },
    { id: "equipamentos", label: "Equipamentos" },
    { id: "ordens",       label: "Ordens de Serviço" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#d97706 0%,#92400e 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Manutenção de Equipamentos</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Gestão preventiva e corretiva · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{dash.taxa_disponibilidade}%</div>
              <div style={{ fontSize: 10, opacity: .8 }}>disponibilidade</div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #fef3c7" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba === a.id ? "2px solid #d97706" : "2px solid transparent", color: aba === a.id ? "#d97706" : "#6b7280", fontWeight: aba === a.id ? 700 : 400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba === "dashboard"    && <AbaDashboard dash={dash}/>}
        {aba === "equipamentos" && <AbaEquipamentos equips={equips}/>}
        {aba === "ordens"       && <AbaOrdens ordens={ordens}/>}
      </div>
    </div>
  );
}
