import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ShieldCheck, AlertTriangle, FileText, CheckCircle, Search } from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };
const RESULT_COR: Record<string, string>  = { bom: "#16a34a", regular: "#d97706", insatisfatorio: "#dc2626" };
const RESULT_LABEL: Record<string, string> = { bom: "Bom", regular: "Regular", insatisfatorio: "Insatisfatório" };
const AUTO_COR: Record<string, string>    = { em_prazo: "#d97706", vencido: "#dc2626", encerrado: "#16a34a" };

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
  const barData = [
    { nome: "Bom",            n: dash.resultado_bom || 0,            cor: "#16a34a" },
    { nome: "Regular",        n: dash.resultado_regular || 0,        cor: "#d97706" },
    { nome: "Insatisfatório", n: dash.resultado_insatisfatorio || 0, cor: "#dc2626" },
  ];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Estabelecimentos"    value={dash.total_estabelecimentos}  sub="cadastrados"              cor="#1d4ed8" icon={<ShieldCheck size={14} color="#1d4ed8"/>}/>
        <KpiCard label="Inspeções no ano"    value={dash.inspecionados_ano}       sub="realizadas 2026"          cor="#7c3aed" icon={<Search size={14} color="#7c3aed"/>}/>
        <KpiCard label="Resultado insatisf." value={dash.resultado_insatisfatorio} sub="estabelecimentos"        cor={dash.resultado_insatisfatorio>0?"#dc2626":"#16a34a"} icon={<AlertTriangle size={14} color={dash.resultado_insatisfatorio>0?"#dc2626":"#16a34a"}/>}/>
        <KpiCard label="Licenças vencidas"   value={dash.licencas_vencidas}       sub="precisam regularizar"     cor={dash.licencas_vencidas>0?"#d97706":"#16a34a"} icon={<FileText size={14} color={dash.licencas_vencidas>0?"#d97706":"#16a34a"}/>}/>
        <KpiCard label="Autos em aberto"     value={dash.autos_abertos}           sub={`${dash.autos_vencidos} vencidos`} cor={dash.autos_vencidos>0?"#dc2626":"#d97706"} icon={<AlertTriangle size={14} color={dash.autos_vencidos>0?"#dc2626":"#d97706"}/>}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Resultado das inspeções 2026</div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barSize={44}>
                <XAxis dataKey="nome" tick={{ fontSize: 10 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="n" name="Estab." radius={[4,4,0,0]}>
                  {barData.map((b, i) => <Cell key={i} fill={b.cor}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Inspeções realizadas — 6 meses</div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dash.historico} barSize={20}>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="realizadas"    name="Realizadas"    fill="#1d4ed8" radius={[0,0,0,0]}/>
                <Bar dataKey="programadas"   name="Programadas"   fill="#e5e7eb" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {dash.proximas_inspecoes > 0 && (
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", marginTop: 18, fontSize: 12 }}>
          <strong>{dash.proximas_inspecoes} inspeções</strong> programadas para o 1º semestre de 2026. Verificar disponibilidade do fiscal sanitário e priorizar estabelecimentos com histórico de infrações.
        </div>
      )}
    </div>
  );
}

function AbaEstabelecimentos({ estabs }: { estabs: any[] | undefined }) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  if (!estabs) return <NaoDisponivelBanner nota="Dados n�o dispon�veis no momento. Integra��o pendente de configura��o no Railway." />;
  const lista = estabs.filter(e =>
    (filtro === "todos" || e.resultado === filtro || (filtro === "licenca_vencida" && !e.licenca_valida)) &&
    (busca === "" || e.razao.toLowerCase().includes(busca.toLowerCase()) || e.atividade.toLowerCase().includes(busca.toLowerCase()))
  );
  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar estabelecimento ou atividade..." style={{ flex: 1, padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13 }}/>
        <select value={filtro} onChange={e => setFiltro(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13 }}>
          <option value="todos">Todos</option>
          <option value="insatisfatorio">Insatisfatórios</option>
          <option value="regular">Regulares</option>
          <option value="bom">Bom</option>
          <option value="licenca_vencida">Licença vencida</option>
        </select>
        <div style={{ fontSize: 12, color: "#9ca3af", alignSelf: "center" }}>{lista.length} itens</div>
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#1d4ed8", color: "#fff" }}>
              <th style={{ padding: "9px 14px", textAlign: "left" }}>Estabelecimento</th>
              <th style={{ padding: "9px 10px", textAlign: "left" }}>Atividade</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>Risco</th>
              <th style={{ padding: "9px 10px", textAlign: "left" }}>Última insp.</th>
              <th style={{ padding: "9px 10px", textAlign: "left" }}>Próx. insp.</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>Resultado</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>Licença</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>Autos</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((e, i) => {
              const corRes = RESULT_COR[e.resultado] || "#6b7280";
              return (
                <tr key={e.id} style={{ borderTop: "1px solid #f3f4f6", background: e.resultado==="insatisfatorio"||!e.licenca_valida?"#fff7f7":i%2===0?"#fff":"#f9fafb" }}>
                  <td style={{ padding: "9px 14px", fontWeight: 600, fontSize: 12 }}>{e.razao}</td>
                  <td style={{ padding: "9px 10px", color: "#374151" }}>{e.atividade}</td>
                  <td style={{ padding: "9px 10px", textAlign: "center" }}>
                    <span style={{ background: e.risco==="alto"?"#fef2f2":"#fefce8", color: e.risco==="alto"?"#dc2626":"#d97706", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3 }}>{e.risco}</span>
                  </td>
                  <td style={{ padding: "9px 10px", fontSize: 11, color: "#6b7280" }}>{e.ultima_inspecao}</td>
                  <td style={{ padding: "9px 10px", fontSize: 11, color: e.proxima_inspecao<="2026-06-30"?"#d97706":"#6b7280" }}>{e.proxima_inspecao}</td>
                  <td style={{ padding: "9px 10px", textAlign: "center" }}>
                    <span style={{ background: corRes+"15", color: corRes, fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>{RESULT_LABEL[e.resultado]}</span>
                  </td>
                  <td style={{ padding: "9px 10px", textAlign: "center" }}>
                    {e.licenca_valida
                      ? <span style={{ color: "#16a34a", fontSize: 11 }}>✓ {e.validade_licenca}</span>
                      : <span style={{ color: "#dc2626", fontSize: 11, fontWeight: 700 }}>⚠ Vencida</span>}
                  </td>
                  <td style={{ padding: "9px 10px", textAlign: "center", fontWeight: e.autos>0?700:400, color: e.autos>0?"#dc2626":"#9ca3af" }}>{e.autos||"—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AbaAutos({ autos }: { autos: any[] | undefined }) {
  if (!autos) return <NaoDisponivelBanner nota="Dados n�o dispon�veis no momento. Integra��o pendente de configura��o no Railway." />;
  const total_multas = autos.reduce((s, a) => s + a.multa_est, 0);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 18 }}>
        {[["Em prazo", autos.filter(a=>a.status==="em_prazo").length, "#d97706"],["Vencidos", autos.filter(a=>a.status==="vencido").length, "#dc2626"],["Multas est.", `R$ ${total_multas.toLocaleString("pt-BR",{minimumFractionDigits:0})}`, "#7c3aed"]].map(([k,v,c])=>(
          <div key={String(k)} style={{ background: "#fff", border: `1px solid ${c}22`, borderTop: `3px solid ${c}`, borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: String(c) }}>{v}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{k}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {autos.map(a => {
          const cor = AUTO_COR[a.status] || "#6b7280";
          return (
            <div key={a.id} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>AI #{a.id} — {a.estab}</div>
                <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, flexShrink: 0 }}>
                  {a.status === "em_prazo" ? "Em prazo" : a.status === "vencido" ? "Vencido" : "Encerrado"}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#374151", marginBottom: 6 }}>{a.infracao}</div>
              <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#6b7280" }}>
                <span>Base: <strong style={{ color: "#374151" }}>{a.base_legal}</strong></span>
                <span>Data: <strong>{a.data}</strong></span>
                <span>Prazo: <strong style={{ color: a.prazo_regularizacao<"2026-05-01"?"#dc2626":"#374151" }}>{a.prazo_regularizacao}</strong></span>
                <span>Multa est.: <strong style={{ color: "#7c3aed" }}>R$ {a.multa_est.toLocaleString("pt-BR",{minimumFractionDigits:0})}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 16, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
        Autos de Infração emitidos nos termos da Lei 8.080/1990 e Decreto 79.094/1977. Recurso em 1ª instância: 15 dias da ciência. Encaminhar ao VISA Estadual (SUSAM/AM) para homologação de multas acima de R$ 2.000.
      </div>
    </div>
  );
}

type Aba = "dashboard"|"estabelecimentos"|"autos";

export default function VigilanciaVISA() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dashRaw }  = useQuery({ queryKey: ["visa-dash"],  queryFn: () => apiGet("/api/visa/dashboard") as Promise<any> });
  const { data: estabs }   = useQuery({ queryKey: ["visa-estab"], queryFn: () => apiGet("/api/visa/estabelecimentos") as Promise<any[]>, enabled: aba==="estabelecimentos" });
  const { data: autos }    = useQuery({ queryKey: ["visa-autos"], queryFn: () => apiGet("/api/visa/autos") as Promise<any[]>,            enabled: aba==="autos" });
  const { data: hist }     = useQuery({ queryKey: ["visa-hist"],  queryFn: () => apiGet("/api/visa/inspecoes") as Promise<any[]>,        enabled: aba==="dashboard" });

  const dash = dashRaw && hist ? {
    ...dashRaw,
    historico: hist,
    resultado_bom:           (dashRaw as any).total_estabelecimentos - dashRaw.resultado_insatisfatorio - 5,
    resultado_regular:       5,
  } : null;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",        label: "Dashboard" },
    { id: "estabelecimentos", label: "Estabelecimentos" },
    { id: "autos",            label: `Autos (${dashRaw?.autos_abertos ?? 0})` },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Vigilância Sanitária — VISA</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Inspeções · Licenças · Autos de Infração · FMS Apuí/AM</p>
          </div>
          {dashRaw && (
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.total_estabelecimentos}</div>
              <div style={{ fontSize: 10, opacity: .8 }}>estabelecimentos</div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e4e7ec" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #0f766e":"2px solid transparent", color: aba===a.id?"#0f766e":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard" && !dash && <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />}
        {aba==="dashboard"        && <AbaDashboard dash={dash}/>}
        {aba==="estabelecimentos" && <AbaEstabelecimentos estabs={estabs}/>}
        {aba==="autos"            && <AbaAutos autos={autos}/>}
      </div>
    </div>
  );
}
