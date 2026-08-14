import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, ReferenceLine, Cell,
} from "recharts";
import { Bug, AlertTriangle, Activity, Shield } from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };
const IIP_COR = (iip: number) => iip < 1.0 ? "#16a34a" : iip < 3.9 ? "#d97706" : "#dc2626";
const IVPV_COR = (v: number) => v < 5 ? "#16a34a" : v < 10 ? "#d97706" : "#dc2626";
const SIT_LABEL: Record<string, string> = { satisfatorio: "Satisfatório", alerta: "Alerta", risco: "Risco" };
const SIT_COR: Record<string, string>   = { satisfatorio: "#16a34a", alerta: "#d97706", risco: "#dc2626" };

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
  const iipCor = IIP_COR(dash.dengue_iip_atual);
  const ivpvCor = IVPV_COR(dash.malaria_ivpv_atual);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="IIP Dengue atual" value={dash.dengue_iip_atual+"%"} sub={SIT_LABEL[dash.dengue_situacao]} cor={iipCor} icon={<Bug size={14} color={iipCor}/>}/>
        <KpiCard label="Focos ativos" value={dash.dengue_focos_ativos} sub="última vistoria" cor={dash.dengue_focos_ativos>10?"#dc2626":"#d97706"} icon={<AlertTriangle size={14} color={dash.dengue_focos_ativos>10?"#dc2626":"#d97706"}/>}/>
        <KpiCard label="Insp. imóveis" value={dash.dengue_inspecao_pct+"%"} sub="cobertura ciclo" cor={dash.dengue_inspecao_pct>=90?"#16a34a":"#d97706"} icon={<Activity size={14} color={dash.dengue_inspecao_pct>=90?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="IVPV Malária" value={dash.malaria_ivpv_atual} sub="lâminas positivas/examinadas × 100" cor={ivpvCor} icon={<Activity size={14} color={ivpvCor}/>}/>
        <KpiCard label="Anti-rábica" value={dash.zoonoses_cobertura_antirabica+"%"} sub="cobertura cães/gatos 2025" cor={dash.zoonoses_cobertura_antirabica>=80?"#16a34a":"#d97706"} icon={<Shield size={14} color={dash.zoonoses_cobertura_antirabica>=80?"#16a34a":"#d97706"}/>}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>IIP Dengue — ciclos 2026 (% infestation)</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dash.historico_dengue_iip}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="ciclo" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <ReferenceLine y={1.0} stroke="#16a34a" strokeDasharray="4 3" label={{ value:"Satisf. 1%", fontSize:9 }}/>
                <ReferenceLine y={3.9} stroke="#dc2626" strokeDasharray="4 3" label={{ value:"Risco 3,9%", fontSize:9 }}/>
                <Line type="monotone" dataKey="iip"  stroke="#d97706" strokeWidth={2.5} dot={{ r: 3 }} name="IIP"/>
                <Line type="monotone" dataKey="ibp"  stroke="#dc2626" strokeWidth={1.5} dot={false}   name="IBP"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Malária — casos positivos / IVPV</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dash.historico_malaria}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <ReferenceLine y={5} stroke="#d97706" strokeDasharray="4 3" label={{ value:"Alerta IVPV 5", fontSize:9 }}/>
                <Line type="monotone" dataKey="positivos" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3 }} name="Positivos"/>
                <Line type="monotone" dataKey="ivpv"      stroke="#7c3aed" strokeWidth={1.5} dot={false}   name="IVPV"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function AbaDengue({ dados }: { dados: any }) {
  if (!dados) return <NaoDisponivelBanner nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />;
  const ciclos = dados.ciclos || [];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18, fontSize: 12, color: "#374151" }}>
        {[["IIP Satisfatório","< "+dados.limites.iip_satisfatorio+"%","#16a34a"],["IIP Alerta","< "+dados.limites.iip_alerta+"%","#d97706"],["IIP Risco","≥ "+dados.limites.iip_alerta+"%","#dc2626"]].map(([k,v,c])=>(
          <div key={String(k)} style={{ background: "#fff", border: `2px solid ${c}`, borderRadius: 8, padding:"10px 14px", textAlign:"center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: String(c) }}>{v}</div>
            <div>{k}</div>
          </div>
        ))}
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#d97706", color: "#fff" }}>
              {["Ciclo","Período","Prog.","Insp.","% Insp.","A1","A2","B","C","D","IIP","IBP","Situação"].map(h=>(
                <th key={h} style={{ padding: "8px 10px", textAlign: h==="Ciclo"||h==="Período"?"left":"center" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ciclos.map((c: any, i: number) => {
              const cor = SIT_COR[c.situacao];
              return (
                <tr key={c.ciclo} style={{ borderTop: "1px solid #f3f4f6", background: i%2===0?"#fff":"#fafafa" }}>
                  <td style={{ padding: "8px 10px", fontWeight: 700 }}>{c.ciclo}</td>
                  <td style={{ padding: "8px 10px", color: "#6b7280" }}>{c.periodo}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>{c.imoveis_prog}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>{c.imoveis_insp}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center", color: c.pct_insp>=90?"#16a34a":"#d97706", fontWeight: 700 }}>{c.pct_insp}%</td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>{c.foco_A1}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>{c.foco_A2}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>{c.foco_B}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>{c.foco_C}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>{c.foco_D}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, color: IIP_COR(c.iip) }}>{c.iip}%</td>
                  <td style={{ padding: "8px 10px", textAlign: "center", color: "#7c3aed" }}>{c.ibp}%</td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>
                    <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>{SIT_LABEL[c.situacao]}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 14, background: "#fef3c7", border: "1px solid #fbbf24", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
        <strong>LIRAa:</strong> Levantamento de Índice Rápido do Aedes aegypti. Ciclos com IIP ≥ 1% exigem intensificação das ações de campo. Foco A (recipientes domiciliares), B (depósitos), C (escalonados), D (naturais/outros). Notificar SE Municipal e COSEV/SUSAM quando IIP ≥ 3,9%.
      </div>
    </div>
  );
}

function AbaMalaria({ dados }: { dados: any }) {
  if (!dados) return <NaoDisponivelBanner nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 18 }}>
        {[["IPA Alto risco","≥ "+dados.ipa_alto_risco+"/mil","#dc2626"],["Pop. em risco",dados.populacao_risco?.toLocaleString("pt-BR")+" hab.","#7c3aed"],["Alerta IVPV","≥ "+dados.limite_alerta_ivpv+"%","#d97706"]].map(([k,v,c])=>(
          <div key={String(k)} style={{ background: "#fff", border: `1px solid ${c}22`, borderTop: `3px solid ${c}`, borderRadius: 8, padding:"12px 14px", textAlign:"center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: String(c) }}>{v}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{k}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Histórico malária — 6 meses</div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dados.historico} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
              <YAxis yAxisId="left"  tick={{ fontSize: 10 }} label={{ value:"casos", angle:-90, position:"insideLeft", fontSize:9 }}/>
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} label={{ value:"IPA/mil", angle:90, position:"insideRight", fontSize:9 }}/>
              <Tooltip contentStyle={TT}/>
              <Bar yAxisId="left"  dataKey="exames"   name="Exames"    fill="#e5e7eb" radius={[4,4,0,0]}>
                {dados.historico.map((_: any, i: number) => <Cell key={i} fill="#e5e7eb"/>)}
              </Bar>
              <Bar yAxisId="left"  dataKey="positivos" name="Positivos" fill="#dc2626" radius={[4,4,0,0]}/>
              <Line yAxisId="right" type="monotone" dataKey="ipa" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} name="IPA/mil"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ marginTop: 14, background: "#ede9fe", border: "1px solid #c4b5fd", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
        <strong>IPA</strong> (Incidência Parasitária Anual) ≥ 50/1.000 hab. = Alto risco. Apuí/AM — área endêmica P. vivax. Tratamento: cloroquina + primaquina conforme protocolo MS. Notificação compulsória SINAN Malária em 24h.
      </div>
    </div>
  );
}

function AbaZoonoses({ dados }: { dados: any }) {
  if (!dados) return <NaoDisponivelBanner nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />;
  const anti = dados.campanha_antirabica_2025;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <KpiCard label="Cobertura anti-rábica" value={anti.cobertura_pct+"%"} sub="cães + gatos 2025" cor={anti.cobertura_pct>=80?"#16a34a":"#dc2626"} icon={<Shield size={14} color={anti.cobertura_pct>=80?"#16a34a":"#dc2626"}/>}/>
        <KpiCard label="Cães vacinados"   value={anti.cao?.toLocaleString("pt-BR")}  sub={`meta: ${anti.meta?.toLocaleString("pt-BR")}`} cor="#1d4ed8" icon={<Shield size={14} color="#1d4ed8"/>}/>
        <KpiCard label="Leishm. cães +"   value={dados.leishmaniose_caes_positivos} sub={`${dados.leishmaniose_caes_eutanasiados} eutanasiados`} cor="#dc2626" icon={<AlertTriangle size={14} color="#dc2626"/>}/>
        <KpiCard label="Leptospirose 2026" value={dados.leptospirose_casos_2026}    sub="casos notificados"  cor={dados.leptospirose_casos_2026>0?"#d97706":"#16a34a"} icon={<Activity size={14} color={dados.leptospirose_casos_2026>0?"#d97706":"#16a34a"}/>}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Campanha Anti-rábica 2025</div>
          {[["Cães vacinados", anti.cao, anti.meta, "#1d4ed8"],["Gatos vacinados", anti.gato, Math.round(anti.meta*0.25), "#7c3aed"]].map(([k,v,m,c])=>(
            <div key={String(k)} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span>{k}</span><span style={{ fontWeight: 700, color: String(c) }}>{(v as number).toLocaleString("pt-BR")}</span>
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 6, height: 8 }}>
                <div style={{ background: String(c), height: "100%", width: `${Math.min(100, Math.round((v as number)/(m as number)*100))}%`, borderRadius: 6 }}/>
              </div>
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>meta: {(m as number).toLocaleString("pt-BR")}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Controle canino 2026</div>
          {[["Capturados",dados.caes_capturados_2026,"#374151"],["Adotados",dados.caes_adotados,"#16a34a"],["Eutanásia s. pública",dados.caes_eutanasiados_saude_publica,"#dc2626"]].map(([k,v,c])=>(
            <div key={String(k)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}>
              <span style={{ color: "#374151" }}>{k}</span>
              <span style={{ fontWeight: 800, color: String(c) }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 10, fontSize: 11, color: "#9ca3af" }}>LCV: Leishmaniose Visceral Canina — eutanásia obrigatória RDC 28/2010</div>
        </div>
      </div>
    </div>
  );
}

type Aba = "dashboard"|"dengue"|"malaria"|"zoonoses";

export default function ControleVetores() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash }     = useQuery({ queryKey: ["vet-dash"],    queryFn: () => apiGet("/api/vetores/dashboard") as Promise<any> });
  const { data: dengue }   = useQuery({ queryKey: ["vet-dengue"],  queryFn: () => apiGet("/api/vetores/dengue")    as Promise<any>, enabled: aba==="dengue" });
  const { data: malaria }  = useQuery({ queryKey: ["vet-malaria"], queryFn: () => apiGet("/api/vetores/malaria")   as Promise<any>, enabled: aba==="malaria" });
  const { data: zoonoses } = useQuery({ queryKey: ["vet-zoo"],     queryFn: () => apiGet("/api/vetores/zoonoses") as Promise<any>, enabled: aba==="zoonoses" });

  const iipAtual = (dash as any)?.dengue_iip_atual ?? 0;
  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "dengue",    label: `Dengue (IIP ${iipAtual}%)` },
    { id: "malaria",   label: "Malária" },
    { id: "zoonoses",  label: "Zoonoses" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Controle de Vetores e Zoonoses</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>LIRAa/Dengue · Malária · Anti-rábica · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{(dash as any).dengue_iip_atual}%</div>
              <div style={{ fontSize: 10, opacity: .8 }}>IIP Dengue atual</div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e4e7ec" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"3px solid #1351b4":"2px solid transparent", color: aba===a.id?"#1351b4":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard" && !dash && <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />}
        {aba==="dashboard" && <AbaDashboard dash={dash}/>}
        {aba==="dengue"    && <AbaDengue dados={dengue}/>}
        {aba==="malaria"   && <AbaMalaria dados={malaria}/>}
        {aba==="zoonoses"  && <AbaZoonoses dados={zoonoses}/>}
      </div>
    </div>
  );
}
