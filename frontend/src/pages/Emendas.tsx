// Módulo — Emendas Parlamentares (InvestSUS / DigiSUS Gestor)
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Landmark, Plus, Check, X, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const S = {
  page:  { padding: 20 } as React.CSSProperties,
  card:  { background: "#fff", borderRadius: 8, border: "1px solid #e5e5e3", padding: 16, marginBottom: 14 } as React.CSSProperties,
  title: { fontSize: 14, fontWeight: 600, marginBottom: 12 } as React.CSSProperties,
  tab:   (a: boolean) => ({ padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, background: a ? "#7c3aed" : "#f5f5f3", color: a ? "#fff" : "#404040" }) as React.CSSProperties,
  input: { border: "1px solid #e5e5e3", borderRadius: 6, padding: "7px 10px", fontSize: 13, width: "100%", boxSizing: "border-box" as const },
  btn:   (cor?: string) => ({ padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, background: cor ?? "#f5f5f3", color: cor ? "#fff" : "#404040", display: "flex", alignItems: "center", gap: 5 }) as React.CSSProperties,
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const FASES: Record<string, { label: string; cor: string; bg: string; ordem: number }> = {
  indicada:    { label: "Indicada",    cor: "#737373", bg: "#f5f5f3", ordem: 1 },
  empenhada:   { label: "Empenhada",   cor: "#0284c7", bg: "#eff6ff", ordem: 2 },
  em_execucao: { label: "Em Execução", cor: "#d97706", bg: "#fffbeb", ordem: 3 },
  liquidada:   { label: "Liquidada",   cor: "#7c3aed", bg: "#f5f3ff", ordem: 4 },
  paga:        { label: "Paga",        cor: "#059669", bg: "#f0fdf4", ordem: 5 },
  cancelada:   { label: "Cancelada",   cor: "#dc2626", bg: "#fff0f0", ordem: 6 },
};

const CORES_PROG = ["#1D9E75", "#0284c7", "#7c3aed", "#d97706", "#dc2626", "#059669"];

interface Dashboard {
  total_emendas: number; total_indicado: number; total_empenhado: number;
  total_pago: number; perc_empenhado: number; perc_executado: number; saldo_a_pagar: number;
  por_parlamentar: { parlamentar: string; partido: string; total: number; pago: number; qtd: number }[];
  por_programa: { programa: string; valor: number }[];
  por_fase: { fase: string; qtd: number }[];
  por_quadrimestre: { quadrimestre: string; indicado: number; pago: number }[];
}
interface Emenda {
  id: number; numero_emenda: string; ano: number; parlamentar: string; partido: string;
  tipo: string; objeto: string; programa: string; vinculo: string;
  valor_indicado: number; valor_empenhado: number; valor_pago: number;
  fase: string; quadrimestre: string; data_indicacao: string; nota_empenho: string;
  perc_empenhado: number; perc_executado: number; saldo_a_pagar: number;
}

const FORM_VAZIO = {
  numero_emenda: "", ano: new Date().getFullYear(), parlamentar: "", partido: "",
  objeto: "", programa: "APS", vinculo: "custeio", tipo: "individual",
  valor_indicado: 0, quadrimestre: "1Q", fase: "indicada",
};

export default function Emendas() {
  const [aba, setAba] = useState<"dashboard" | "lista" | "quadrimestre">("dashboard");
  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [filtroFase, setFiltroFase] = useState("");
  const qc = useQueryClient();

  const { data: dashboard } = useQuery<Dashboard>({
    queryKey: ["emendas-dashboard"],
    queryFn: () => api.get("/api/emendas/dashboard").then(r => r.data),
  });
  const { data: emendas = [] } = useQuery<Emenda[]>({
    queryKey: ["emendas", filtroFase],
    queryFn: () => api.get("/api/emendas", { params: filtroFase ? { fase: filtroFase } : {} }).then(r => r.data),
    enabled: aba === "lista",
  });

  const criar = useMutation({
    mutationFn: (body: typeof form) => api.post("/api/emendas", { ...body, municipio_id: 1 }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["emendas"] }); qc.invalidateQueries({ queryKey: ["emendas-dashboard"] }); setCriando(false); setForm(FORM_VAZIO); },
  });

  const f = (field: string, value: string | number) => setForm(p => ({ ...p, [field]: value }));

  return (
    <div style={S.page}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <Landmark size={16} /> Emendas Parlamentares — InvestSUS
      </div>

      {/* KPIs */}
      {dashboard && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
          {[
            { label: "Total Indicado",  valor: fmt(dashboard.total_indicado),  cor: "#7c3aed" },
            { label: "Total Empenhado", valor: fmt(dashboard.total_empenhado), cor: "#0284c7" },
            { label: "Total Pago",      valor: fmt(dashboard.total_pago),      cor: "#059669" },
            { label: "Saldo a Pagar",   valor: fmt(dashboard.saldo_a_pagar),   cor: "#d97706" },
          ].map(({ label, valor, cor }) => (
            <div key={label} style={{ ...S.card, textAlign: "center", padding: 12, margin: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: cor }}>{valor}</div>
              <div style={{ fontSize: 11, color: "#737373", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Funil de execução */}
      {dashboard && (
        <div style={{ ...S.card, marginBottom: 14 }}>
          <div style={S.title}>Funil de Execução das Emendas</div>
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {[
              { label: "Indicado",  valor: dashboard.total_indicado,  perc: 100,                      cor: "#737373" },
              { label: "Empenhado", valor: dashboard.total_empenhado, perc: dashboard.perc_empenhado, cor: "#0284c7" },
              { label: "Pago",      valor: dashboard.total_pago,      perc: dashboard.perc_executado, cor: "#059669" },
            ].map((item, i) => (
              <div key={item.label} style={{ flex: 1, textAlign: "center", position: "relative" }}>
                <div style={{ background: item.cor + "15", border: `2px solid ${item.cor}`, borderRadius: 8, padding: "12px 8px", margin: i === 0 ? 0 : "0 0 0 -8px" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: item.cor }}>{item.perc.toFixed(0)}%</div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: "#737373" }}>{fmt(item.valor)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Abas */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button style={S.tab(aba === "dashboard")}    onClick={() => setAba("dashboard")}>Painéis</button>
        <button style={S.tab(aba === "lista")}        onClick={() => setAba("lista")}>Lista de Emendas</button>
        <button style={S.tab(aba === "quadrimestre")} onClick={() => setAba("quadrimestre")}>Por Quadrimestre</button>
      </div>

      {/* ABA PAINÉIS */}
      {aba === "dashboard" && dashboard && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

          {/* Por parlamentar */}
          <div style={S.card}>
            <div style={S.title}>Por Parlamentar</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dashboard.por_parlamentar} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="parlamentar" tick={{ fontSize: 10 }} width={110} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="total" name="Indicado" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                <Bar dataKey="pago"  name="Pago"     fill="#059669" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Por programa */}
          <div style={S.card}>
            <div style={S.title}>Por Programa / Área</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={dashboard.por_programa} dataKey="valor" nameKey="programa" outerRadius={80} label={({ programa, percent }) => `${programa} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {dashboard.por_programa.map((_, i) => <Cell key={i} fill={CORES_PROG[i % CORES_PROG.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Por fase */}
          <div style={S.card}>
            <div style={S.title}>Status por Fase</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.entries(FASES).map(([key, cfg]) => {
                const item = dashboard.por_fase.find(f => f.fase === key);
                const qtd = item?.qtd ?? 0;
                return (
                  <div key={key} style={{ background: cfg.bg, border: `1px solid ${cfg.cor}30`, borderRadius: 8, padding: "10px 16px", flex: "1 0 120px", textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: cfg.cor }}>{qtd}</div>
                    <div style={{ fontSize: 11, color: cfg.cor, fontWeight: 600 }}>{cfg.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Por parlamentar — detalhes */}
          <div style={S.card}>
            <div style={S.title}>Execução por Parlamentar</div>
            {dashboard.por_parlamentar.map(p => {
              const perc = p.total > 0 ? (p.pago / p.total) * 100 : 0;
              const cor = perc >= 75 ? "#059669" : perc >= 40 ? "#d97706" : "#dc2626";
              return (
                <div key={p.parlamentar} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12 }}>{p.parlamentar} <span style={{ fontSize: 10, color: "#737373" }}>({p.partido})</span></span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: cor }}>{perc.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 6, background: "#e5e5e3", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(perc, 100)}%`, height: "100%", background: cor, borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                    {fmt(p.pago)} pago de {fmt(p.total)} · {p.qtd} emenda{p.qtd !== 1 ? "s" : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA LISTA */}
      {aba === "lista" && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={S.title}>Emendas Parlamentares</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["", ...Object.keys(FASES)].map(f => (
                <button key={f} onClick={() => setFiltroFase(f)} style={{ ...S.tab(filtroFase === f), padding: "5px 10px" }}>
                  {f ? FASES[f]?.label : "Todas"}
                </button>
              ))}
              <button style={S.btn("#7c3aed")} onClick={() => setCriando(true)}>
                <Plus size={13} /> Nova
              </button>
            </div>
          </div>

          {/* Formulário nova emenda */}
          {criando && (
            <div style={{ background: "#f9f9f7", border: "1px solid #e5e5e3", borderRadius: 8, padding: 14, marginBottom: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                {[
                  ["numero_emenda", "Nº da Emenda"], ["parlamentar", "Parlamentar"],
                  ["partido", "Partido"], ["programa", "Programa"],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label style={{ fontSize: 11, color: "#737373", display: "block", marginBottom: 3 }}>{label}</label>
                    <input style={S.input} value={(form as any)[key]} onChange={e => f(key, e.target.value)} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 11, color: "#737373", display: "block", marginBottom: 3 }}>Valor Indicado (R$)</label>
                  <input type="number" style={S.input} value={form.valor_indicado} onChange={e => f("valor_indicado", Number(e.target.value))} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#737373", display: "block", marginBottom: 3 }}>Quadrimestre</label>
                  <select style={S.input} value={form.quadrimestre} onChange={e => f("quadrimestre", e.target.value)}>
                    <option value="1Q">1º Quadrimestre</option>
                    <option value="2Q">2º Quadrimestre</option>
                    <option value="3Q">3º Quadrimestre</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: "#737373", display: "block", marginBottom: 3 }}>Objeto / Descrição</label>
                <input style={S.input} value={form.objeto} onChange={e => f("objeto", e.target.value)} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={S.btn("#059669")} onClick={() => criar.mutate(form)}><Check size={13} /> Salvar</button>
                <button style={S.btn()} onClick={() => { setCriando(false); setForm(FORM_VAZIO); }}><X size={13} /> Cancelar</button>
              </div>
            </div>
          )}

          {(emendas as Emenda[]).map(e => {
            const fase = FASES[e.fase] ?? FASES.indicada;
            return (
              <div key={e.id} style={{ padding: "12px 0", borderBottom: "1px solid #f0f0ee" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontFamily: "monospace", fontSize: 11, background: "#f5f5f3", borderRadius: 3, padding: "1px 6px", color: "#737373" }}>
                        {e.numero_emenda}
                      </span>
                      <span style={{ background: fase.bg, color: fase.cor, borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 600 }}>
                        {fase.label}
                      </span>
                      {e.quadrimestre && (
                        <span style={{ fontSize: 10, background: "#f5f5f3", borderRadius: 3, padding: "1px 5px", color: "#737373" }}>
                          {e.quadrimestre}
                        </span>
                      )}
                      <span style={{ fontSize: 10, background: "#eff6ff", color: "#0284c7", borderRadius: 3, padding: "1px 6px" }}>
                        {e.programa}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 1 }}>{e.parlamentar} <span style={{ fontWeight: 400, color: "#737373" }}>({e.partido})</span></div>
                    <div style={{ fontSize: 12, color: "#404040" }}>{e.objeto}</div>
                    {e.nota_empenho && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>NE: {e.nota_empenho}</div>}
                  </div>
                  <div style={{ textAlign: "right", marginLeft: 16, flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{fmt(e.valor_indicado)}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>indicado</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: e.perc_executado >= 75 ? "#059669" : e.perc_executado >= 40 ? "#d97706" : "#dc2626", marginTop: 4 }}>
                      {e.perc_executado.toFixed(0)}% pago
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 4, background: "#e5e5e3", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(e.perc_executado, 100)}%`, height: "100%", background: e.perc_executado >= 75 ? "#059669" : e.perc_executado >= 40 ? "#d97706" : "#dc2626", borderRadius: 2 }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ABA QUADRIMESTRE */}
      {aba === "quadrimestre" && dashboard && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 14 }}>
            {["1Q", "2Q", "3Q"].map(q => {
              const dados = dashboard.por_quadrimestre.find(d => d.quadrimestre === q);
              const perc = dados && dados.indicado > 0 ? (dados.pago / dados.indicado) * 100 : 0;
              const cor = perc >= 75 ? "#059669" : perc >= 40 ? "#d97706" : "#dc2626";
              const label = q === "1Q" ? "1º Quadrimestre (Jan–Abr)" : q === "2Q" ? "2º Quadrimestre (Mai–Ago)" : "3º Quadrimestre (Set–Dez)";
              return (
                <div key={q} style={S.card}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{label}</div>
                  {dados ? (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: "#737373" }}>Indicado</span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{fmt(dados.indicado)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: "#737373" }}>Pago</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: cor }}>{fmt(dados.pago)}</span>
                      </div>
                      <div style={{ height: 10, background: "#e5e5e3", borderRadius: 5, overflow: "hidden", marginBottom: 6 }}>
                        <div style={{ width: `${Math.min(perc, 100)}%`, height: "100%", background: cor, borderRadius: 5 }} />
                      </div>
                      <div style={{ textAlign: "center", fontSize: 22, fontWeight: 700, color: cor }}>{perc.toFixed(0)}%</div>
                      <div style={{ textAlign: "center", fontSize: 11, color: "#737373" }}>execução</div>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", padding: 20, color: "#9ca3af", fontSize: 12 }}>Sem emendas neste quadrimestre</div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={S.card}>
            <div style={S.title}>Comparativo por Quadrimestre — Indicado vs. Pago</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dashboard.por_quadrimestre}>
                <XAxis dataKey="quadrimestre" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="indicado" name="Indicado" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pago"     name="Pago"     fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
