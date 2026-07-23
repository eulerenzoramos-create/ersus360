import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { Truck, AlertTriangle, CheckCircle, DollarSign } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#e4e7ec", border: "none", borderRadius: 6, color: "#f8fafc" };
const ST_COR: Record<string, string> = { disponivel: "#16a34a", manutencao: "#d97706", inoperante: "#dc2626" };
const MAN_COR: Record<string, string> = { em_andamento: "#d97706", agendada: "#1d4ed8", pendente: "#dc2626" };

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

function AbaDashboard({ dash, hist }: { dash: any; hist: any[] | undefined }) {
  if (!dash) return null;
  return (
    <div>
      {(dash.disponibilidade_pct < 85 || dash.veiculos_vencidos_revisao > 0) && (
        <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#92400e" }}>
          <strong>⚠ Disponibilidade abaixo da meta:</strong> {dash.disponibilidade_pct}% (meta 85%) · {dash.veiculos_vencidos_revisao} veículo(s) com revisão vencida · Lancha fluvial inoperante há 60 dias.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Disponibilidade"     value={dash.disponibilidade_pct+"%"}          sub={`${dash.disponiveis}/${dash.total_veiculos} disponíveis`}             cor={dash.disponibilidade_pct>=85?"#16a34a":"#dc2626"} icon={<Truck size={14} color={dash.disponibilidade_pct>=85?"#16a34a":"#dc2626"}/>}/>
        <KpiCard label="Pacientes transp."   value={dash.pacientes_transportados_mes.toLocaleString("pt-BR")} sub={`${dash.viagens_mes} viagens`}                    cor="#374151"   icon={<CheckCircle size={14} color="#374151"/>}/>
        <KpiCard label="Custo combustível"   value={`R$${dash.custo_combustivel_mes.toLocaleString("pt-BR",{minimumFractionDigits:0})}`} sub="este mês"             cor="#374151"   icon={<DollarSign size={14} color="#374151"/>}/>
        <KpiCard label="Em manutenção/inop." value={`${dash.manutencao+dash.inoperantes}`} sub={`${dash.manutencao} manut. + ${dash.inoperantes} inop.`}              cor={dash.manutencao+dash.inoperantes>=4?"#dc2626":"#d97706"} icon={<AlertTriangle size={14} color={dash.manutencao+dash.inoperantes>=4?"#dc2626":"#d97706"}/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Frota — evolução 6 meses</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hist} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }}/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }} unit="%"/>
                <Tooltip contentStyle={TT}/>
                <Bar yAxisId="l" dataKey="viagens"   name="Viagens"   fill="#1d4ed8" radius={[4,4,0,0]}/>
                <Bar yAxisId="l" dataKey="pacientes" name="Pacientes" fill="#0891b2" radius={[4,4,0,0]}/>
                <Line yAxisId="r" type="monotone" dataKey="disponibilidade_pct" name="Disponibilidade %" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaVeiculos({ veiculos }: { veiculos: any[] | undefined }) {
  if (!veiculos) return null;
  return (
    <div>
      {veiculos.map(v => {
        const cor = ST_COR[v.status];
        return (
          <div key={v.placa} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div>
                <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 12 }}>{v.placa}</span>
                <span style={{ marginLeft: 8, fontSize: 13 }}>{v.tipo}</span>
                <span style={{ marginLeft: 6, fontSize: 11, color: "#9ca3af" }}>({v.ano})</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: 11, color: "#6b7280" }}>{v.lotacao}</span>
                <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
                  {v.status==="disponivel"?"● Disponível":v.status==="manutencao"?"● Manutenção":"● Inoperante"}
                </span>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>
              {v.km_atual && <>KM atual: <strong style={{ color: "#374151" }}>{v.km_atual.toLocaleString("pt-BR")}</strong> · </>}
              {v.proxima_revisao_km && <>Próx. revisão: <strong style={{ color: v.km_atual>v.proxima_revisao_km-2000?"#d97706":"#374151" }}>{v.proxima_revisao_km.toLocaleString("pt-BR")} km</strong> · </>}
              Combustível: {v.combustivel}
            </div>
            {v.observacao && <div style={{ marginTop: 5, background: "#fef9c3", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#92400e" }}>⚠ {v.observacao}</div>}
          </div>
        );
      })}
    </div>
  );
}

function AbaManutencoes({ mans }: { mans: any[] | undefined }) {
  if (!mans) return null;
  return (
    <div>
      {mans.map(m => {
        const cor = MAN_COR[m.status] ?? "#374151";
        return (
          <div key={m.veiculo+m.servico} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "13px 18px", marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div>
                <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 12 }}>{m.veiculo}</span>
                <span style={{ marginLeft: 8, background: m.tipo==="Corretiva"?"#fef2f2":"#f0fdf4", color: m.tipo==="Corretiva"?"#dc2626":"#16a34a", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>{m.tipo}</span>
              </div>
              <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>{m.status.replace("_"," ")}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{m.servico}</div>
            <div style={{ display: "flex", gap: 20, fontSize: 11, color: "#6b7280" }}>
              <span>Oficina: {m.oficina}</span>
              <span>Prazo: <strong style={{ color: m.prazo_dias>30?"#dc2626":m.prazo_dias>7?"#d97706":"#374151" }}>{m.prazo_dias} dias</strong></span>
              <span>Custo: <strong style={{ color: "#374151" }}>R${m.valor.toLocaleString("pt-BR",{minimumFractionDigits:2})}</strong></span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AbaIndicadores({ inds }: { inds: any[] | undefined }) {
  if (!inds) return null;
  return (
    <div>
      {["critico","atencao","ok"].map(nivel => {
        const grupo = inds.filter(i => i.status === nivel);
        if (!grupo.length) return null;
        const cor = { critico:"#dc2626", atencao:"#d97706", ok:"#16a34a" }[nivel] as string;
        return (
          <div key={nivel} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: cor, marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: 1 }}>{nivel==="critico"?"Crítico":nivel==="atencao"?"Atenção":"OK"}</div>
            {grupo.map(ind => (
              <div key={ind.indicador} style={{ background: "#fff", border: `1px solid ${cor}22`, borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{ind.indicador}</span>
                    {ind.observacao && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{ind.observacao}</div>}
                  </div>
                  <div style={{ flexShrink: 0, marginLeft: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{typeof ind.valor==="number"?ind.valor.toLocaleString("pt-BR"):ind.valor}{ind.unidade==="%"?"%":ind.unidade==="R$/km"?" R$/km":""}</span>
                    {ind.meta !== null && ind.meta !== undefined && <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>meta: {ind.meta}{ind.unidade==="%"?"%":""}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

type Aba = "dashboard"|"veiculos"|"manutencoes"|"indicadores";

export default function Frota() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash  } = useQuery({ queryKey: ["frt-dash"],  queryFn: () => apiGet("/api/frota/dashboard")    as Promise<any> });
  const { data: hist  } = useQuery({ queryKey: ["frt-hist"],  queryFn: () => apiGet("/api/frota/historico")    as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: veics } = useQuery({ queryKey: ["frt-veic"],  queryFn: () => apiGet("/api/frota/veiculos")     as Promise<any[]>, enabled: aba==="veiculos" });
  const { data: mans  } = useQuery({ queryKey: ["frt-man"],   queryFn: () => apiGet("/api/frota/manutencoes")  as Promise<any[]>, enabled: aba==="manutencoes" });
  const { data: inds  } = useQuery({ queryKey: ["frt-ind"],   queryFn: () => apiGet("/api/frota/indicadores")  as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",    label: "Dashboard" },
    { id: "veiculos",     label: `Veículos (${dashRaw?.total_veiculos ?? 0})` },
    { id: "manutencoes",  label: `Manutenções (${dashRaw ? dashRaw.manutencao+dashRaw.inoperantes : 0} pend.)` },
    { id: "indicadores",  label: "Indicadores" },
  ];

  return (
    <div style={{ background: "#fff", padding: "20px 24px 32px" }}>
      <div style={{ style_SIAPS_PLACEHOLDER }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Frota de Saúde</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Veículos · Manutenção · TFD · Transporte Fluvial · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: dashRaw.disponibilidade_pct<85?"rgba(255,100,100,.3)":"rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.disponibilidade_pct}%</div>
                <div style={{ fontSize: 10, opacity: .8 }}>disponibilidade</div>
              </div>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.km_rodados_mes.toLocaleString("pt-BR")}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>km rodados/mês</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #d4d4d4" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"3px solid #1351b4":"2px solid transparent", color: aba===a.id?"#1351b4":"#555", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard"   && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="veiculos"    && <AbaVeiculos veiculos={veics}/>}
        {aba==="manutencoes" && <AbaManutencoes mans={mans}/>}
        {aba==="indicadores" && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
