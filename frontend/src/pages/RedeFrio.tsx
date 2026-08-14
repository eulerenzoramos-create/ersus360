import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { Thermometer, AlertTriangle, Package, TrendingDown } from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", alerta: "#dc2626", urgente: "#dc2626", critico: "#dc2626" };
const CAUSA_COR: Record<string, string> = { "Vencimento": "#dc2626", "Frasco aberto": "#d97706", "Falha cadeia frio": "#7c3aed" };

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

function AbaDashboard({ dash, perdas }: { dash: any; perdas: any[] | undefined }) {
  if (!dash) return <NaoDisponivelBanner nota="Dados indisponíveis. Integração não configurada no Railway. Nenhum valor foi inventado." />;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Equipamentos OK"    value={`${dash.equipamentos_ok}/${dash.equipamentos_total}`}   sub="câmaras e refrigeradores" cor={dash.equipamentos_alerta>0?"#d97706":"#16a34a"} icon={<Thermometer size={14} color={dash.equipamentos_alerta>0?"#d97706":"#16a34a"}/>}/>
        <KpiCard label="Temperatura atual"  value={dash.temperatura_media_atual+"°C"}                     sub="câmara fria central"       cor={dash.temperatura_ok?"#16a34a":"#dc2626"}      icon={<Thermometer size={14} color={dash.temperatura_ok?"#16a34a":"#dc2626"}/>}/>
        <KpiCard label="Perdas do mês"      value={dash.perdas_mes_doses+" doses"}                        sub={`${dash.perdas_mes_pct}% do estoque`} cor={STATUS_COR[dash.perdas_status]}   icon={<TrendingDown size={14} color={STATUS_COR[dash.perdas_status]}/>}/>
        <KpiCard label="Lotes vencendo"     value={dash.lotes_vencendo_30d}                               sub="próximos 30 dias"          cor={dash.lotes_vencendo_30d>0?"#d97706":"#16a34a"} icon={<Package size={14} color={dash.lotes_vencendo_30d>0?"#d97706":"#16a34a"}/>}/>
      </div>
      {perdas && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Perdas de imunobiológicos — 6 meses</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perdas} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }}/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }} unit="%"/>
                <Tooltip contentStyle={TT}/>
                <Bar yAxisId="l" dataKey="doses_perdidas" name="Doses perdidas" fill="#dc2626" radius={[4,4,0,0]}/>
                <Line yAxisId="r" type="monotone" dataKey="pct_perdas" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} name="% perdas"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaEquipamentos({ equip }: { equip: any[] | undefined }) {
  if (!equip) return <NaoDisponivelBanner nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {equip.map(e => {
          const cor = STATUS_COR[e.status];
          const tempAlerta = e.temp_atual > 8 || e.temp_max_24h > 8;
          return (
            <div key={e.id} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{e.id}</span>
                  <span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280" }}>{e.tipo}</span>
                </div>
                <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{e.status}</span>
              </div>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{e.local}</div>
              <div style={{ display: "flex", gap: 14, fontSize: 12 }}>
                <span>Atual: <strong style={{ color: tempAlerta?"#dc2626":"#16a34a" }}>{e.temp_atual}°C</strong></span>
                <span>Min 24h: <strong>{e.temp_min_24h}°C</strong></span>
                <span>Max 24h: <strong style={{ color: e.temp_max_24h>8?"#dc2626":"#374151" }}>{e.temp_max_24h}°C</strong></span>
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>Calibração: {e.ultima_calibracao}</div>
              {e.alerta && <div style={{ marginTop: 6, background: "#fef2f2", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#dc2626", fontWeight: 600 }}>⚠ {e.alerta}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaEstoque({ estoque }: { estoque: any[] | undefined }) {
  if (!estoque) return <NaoDisponivelBanner nota="Dados indisponíveis. Nenhum valor foi inventado." />;
  return (
    <div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#1d4ed8", color: "#fff" }}>
              {["Vacina","Lote","Estoque","Mínimo","Vencimento","Status"].map(h => (
                <th key={h} style={{ padding: "8px 10px", textAlign: h==="Vacina"?"left":"center" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {estoque.map((v, i) => {
              const cor = STATUS_COR[v.status];
              return (
                <tr key={v.vacina} style={{ borderTop: "1px solid #f3f4f6", background: i%2===0?"#fff":"#f9fafb" }}>
                  <td style={{ padding: "8px 10px", fontWeight: 600 }}>{v.vacina}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center", color: "#6b7280", fontSize: 11 }}>{v.lote}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, color: v.doses_estoque<=v.doses_minimas?"#dc2626":"#374151" }}>{v.doses_estoque}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center", color: "#6b7280" }}>{v.doses_minimas}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center", color: v.vencimento.includes("Abr")?"#d97706":"#374151" }}>{v.vencimento}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>
                    <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{v.status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type Aba = "dashboard"|"equipamentos"|"estoque";

export default function RedeFrio() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash  } = useQuery({ queryKey: ["rf-dash"],  queryFn: () => apiGet("/api/rede-frio/dashboard")    as Promise<any> });
  const { data: equip = []} = useQuery({ queryKey: ["rf-equip"], queryFn: () => apiGet("/api/rede-frio/equipamentos") as Promise<any[]>, enabled: aba==="equipamentos" });
  const { data: est   } = useQuery({ queryKey: ["rf-est"],   queryFn: () => apiGet("/api/rede-frio/estoque")      as Promise<any[]>, enabled: aba==="estoque" });
  const { data: perd  } = useQuery({ queryKey: ["rf-perd"],  queryFn: () => apiGet("/api/rede-frio/perdas")       as Promise<any[]>, enabled: aba==="dashboard" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",    label: "Dashboard" },
    { id: "equipamentos", label: `Equipamentos (${dashRaw?.equipamentos_alerta ?? 0} alertas)` },
    { id: "estoque",      label: `Estoque (${dashRaw?.lotes_vencendo_30d ?? 0} vencem em 30d)` },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Rede de Frio</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Imunobiológicos · Temperatura · Estoque · Perdas · PNI · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: dashRaw.equipamentos_alerta>0?"#fbbf24":"#fff" }}>{dashRaw.equipamentos_alerta}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>equip. em alerta</div>
              </div>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.temperatura_media_atual}°C</div>
                <div style={{ fontSize: 10, opacity: .8 }}>câmara central</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e4e7ec" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"3px solid #1351b4":"2px solid transparent", color: aba===a.id?"#0369a1":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard" && !dashRaw && <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />}
        {aba==="dashboard"    && <AbaDashboard dash={dashRaw} perdas={perd}/>}
        {aba==="equipamentos" && <AbaEquipamentos equip={equip}/>}
        {aba==="estoque"      && <AbaEstoque estoque={est}/>}
      </div>
    </div>
  );
}
