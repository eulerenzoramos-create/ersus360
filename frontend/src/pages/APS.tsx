// Módulo 5 — Atenção Primária à Saúde
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Activity, Users, Building2, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const S = {
  page:  { padding: 20 } as React.CSSProperties,
  card:  { background: "#fff", borderRadius: 8, border: "1px solid #e5e5e3", padding: 16, marginBottom: 14 } as React.CSSProperties,
  title: { fontSize: 14, fontWeight: 600, marginBottom: 12 } as React.CSSProperties,
};

interface ApsIndicador {
  nome: string; categoria: string; valor: number;
  meta: number; unidade: string; competencia: string; semaforo: string;
}
interface ApsDashboard {
  cobertura_esf: number; cobertura_eap: number; ubs_total: number;
  equipes_sf: number; producao_mensal: number; icsap_taxa: number;
  prenatal_7mais: number; vacinal_bcg: number; competencia: string;
}
interface Ubs { id: number; nome: string; equipes: number; situacao: string; populacao_cadastrada: number }
interface ProducaoMes { mes: string; producao: number; ano: number }

const COR_SEMAFORO: Record<string, string> = { verde: "#059669", amarelo: "#d97706", vermelho: "#dc2626" };
const BG_SEMAFORO:  Record<string, string> = { verde: "#f0fdf4", amarelo: "#fffbeb", vermelho: "#fff0f0" };

function SemaforoBar({ valor, meta, cor }: { valor: number; meta: number; cor: string }) {
  const perc = Math.min((valor / meta) * 100, 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "#e5e5e3", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${perc}%`, height: "100%", background: cor, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, color: cor, fontWeight: 600, minWidth: 45, textAlign: "right" }}>
        {valor.toFixed(1)}%
      </span>
      <span style={{ fontSize: 11, color: "#9ca3af" }}>/{meta}%</span>
    </div>
  );
}

export default function APS() {
  const { data: dashboard } = useQuery<ApsDashboard>({
    queryKey: ["aps-dashboard"],
    queryFn: () => api.get("/api/aps/dashboard").then((r) => r.data),
  });
  const { data: indicadores = [] } = useQuery<ApsIndicador[]>({
    queryKey: ["aps-indicadores"],
    queryFn: () => api.get("/api/aps/indicadores").then((r) => r.data),
  });
  const { data: ubs = [] } = useQuery<Ubs[]>({
    queryKey: ["aps-ubs"],
    queryFn: () => api.get("/api/aps/ubs").then((r) => r.data),
  });
  const { data: producao = [] } = useQuery<ProducaoMes[]>({
    queryKey: ["aps-producao"],
    queryFn: () => api.get("/api/aps/producao-mensal").then((r) => r.data),
  });

  const categorias = [...new Set(indicadores.map((i) => i.categoria))];

  return (
    <div style={S.page}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <Activity size={16} /> Atenção Primária à Saúde
        {dashboard && <span style={{ fontSize: 12, color: "#737373", fontWeight: 400 }}>— Competência {dashboard.competencia}</span>}
      </div>

      {/* KPIs */}
      {dashboard && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { label: "UBS",           valor: String(dashboard.ubs_total),        sub: "unidades ativas",            cor: "#0284c7", Icon: Building2 },
            { label: "Equipes SF",    valor: String(dashboard.equipes_sf),        sub: "Saúde da Família",           cor: "#1D9E75", Icon: Users },
            { label: "Cobertura ESF", valor: `${dashboard.cobertura_esf}%`,       sub: "meta 100%",                  cor: dashboard.cobertura_esf >= 75 ? "#059669" : "#dc2626", Icon: Activity },
            { label: "Produção/Mês",  valor: dashboard.producao_mensal.toLocaleString("pt-BR"), sub: "atendimentos",cor: "#7c3aed", Icon: TrendingUp },
          ].map(({ label, valor, sub, cor, Icon }) => (
            <div key={label} style={{ ...S.card, padding: 14, textAlign: "center", margin: 0 }}>
              <Icon size={18} style={{ color: cor, marginBottom: 6 }} />
              <div style={{ fontSize: 22, fontWeight: 700, color: cor }}>{valor}</div>
              <div style={{ fontSize: 12, fontWeight: 500, marginTop: 1 }}>{label}</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>{sub}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Indicadores por categoria */}
        <div style={S.card}>
          <div style={S.title}>Indicadores do Previne Brasil / PAS</div>
          {categorias.map((cat) => (
            <div key={cat} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#737373", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                {cat}
              </div>
              {indicadores.filter((i) => i.categoria === cat).map((ind) => {
                const cor = COR_SEMAFORO[ind.semaforo];
                return (
                  <div key={ind.nome} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 12 }}>{ind.nome}</span>
                      <span style={{
                        background: BG_SEMAFORO[ind.semaforo], color: cor,
                        borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 600,
                      }}>
                        {ind.semaforo}
                      </span>
                    </div>
                    <SemaforoBar valor={ind.valor} meta={ind.meta} cor={cor} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Produção mensal */}
          <div style={S.card}>
            <div style={S.title}>Produção Ambulatorial Mensal</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={producao} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0ee" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="producao" fill="#1D9E75" radius={[3, 3, 0, 0]} name="Atendimentos" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* UBS */}
          <div style={S.card}>
            <div style={S.title}>Unidades Básicas de Saúde</div>
            {ubs.map((u) => (
              <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #f0f0ee" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{u.nome}</div>
                  <div style={{ fontSize: 11, color: "#737373", marginTop: 2 }}>
                    {u.populacao_cadastrada.toLocaleString("pt-BR")} cadastrados
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: u.equipes > 0 ? "#059669" : "#dc2626", fontWeight: 600 }}>
                    {u.equipes} equipe{u.equipes !== 1 ? "s" : ""}
                  </div>
                  <div style={{
                    fontSize: 10, marginTop: 2,
                    color: u.situacao === "Ativa" ? "#059669" : "#d97706",
                  }}>
                    {u.situacao}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
