import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, Cell, LabelList,
} from "recharts";
import {
  DollarSign, TrendingUp, AlertTriangle, Info,
  ChevronDown, ChevronRight, Zap, Target,
} from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import { BRL, BRL_AXIS, PCT } from "../lib/fmt";

// ── Helpers ───────────────────────────────────────────────────────────────────

const COR_STATUS = (s: string) =>
  s === "otimo" ? "#1d4ed8" : s === "bom" ? "#16a34a" : s === "suficiente" ? "#d97706" : "#dc2626";

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, cor, icon }: { label: string; value: string; sub?: string; cor: string; icon: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}22`, borderTop: `3px solid ${cor}`, borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "#6b7280" }}>{label}</span>
        <div style={{ background: `${cor}15`, borderRadius: 7, padding: 6 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: cor, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── Aba: Visão Geral ──────────────────────────────────────────────────────────
function AbaVisaoGeral({ dash }: { dash: any }) {
  if (!dash) return <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />;

  const COMPONENTES = [
    { label: "Capitação Ponderada",  val: dash.total_capita_mes,      cor: "#1d4ed8", pct: Math.round((dash.total_capita_mes / dash.total_mensal) * 100) },
    { label: "Desempenho",           val: dash.total_desempenho_mes,  cor: "#7c3aed", pct: Math.round((dash.total_desempenho_mes / dash.total_mensal) * 100) },
    { label: "Estratégico",          val: dash.total_estrategico_mes, cor: "#0891b2", pct: Math.round((dash.total_estrategico_mes / dash.total_mensal) * 100) },
  ];

  return (
    <div>
      {/* Tarja info */}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Info size={14} color="#1d4ed8" style={{ marginTop: 2, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "#1e40af" }}>
          Cofinanciamento Federal da APS — Portaria GM/MS nº 3.493/2024 (Novo Financiamento APS) · IED Apuí/AM = <strong>2</strong> · Ponderador = <strong>1,25×</strong> · Competência <strong>{dash.competencia}</strong>
        </span>
      </div>

      {/* KPIs principais */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
        <KpiCard
          label="Repasse Mensal Total" value={BRL(dash.total_mensal)} sub={`${dash.n_equipes_esf} equipes eSF`}
          cor="#1d4ed8" icon={<DollarSign size={16} color="#1d4ed8" />}
        />
        <KpiCard
          label="Repasse Anual Projetado" value={BRL(dash.total_anual)} sub="12 competências"
          cor="#7c3aed" icon={<TrendingUp size={16} color="#7c3aed" />}
        />
        <KpiCard
          label="Potencial máximo / mês" value={BRL(dash.potencial_mensal)} sub="todas equipes em Ótimo"
          cor="#16a34a" icon={<Target size={16} color="#16a34a" />}
        />
        <KpiCard
          label="Gap — valor não captado / mês" value={BRL(dash.gap_mensal)} sub={`R$ ${(dash.gap_anual / 1000).toFixed(1).replace(".",",")}k/ano perdidos`}
          cor="#dc2626" icon={<AlertTriangle size={16} color="#dc2626" />}
        />
      </div>

      {/* Aproveitamento */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 18px", marginBottom: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Aproveitamento do cofinanciamento</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: dash.pct_aproveitamento >= 85 ? "#16a34a" : "#d97706" }}>
            {dash.pct_aproveitamento}%
          </span>
        </div>
        <div style={{ height: 14, background: "#f3f4f6", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ width: `${dash.pct_aproveitamento}%`, height: "100%", borderRadius: 8, background: dash.pct_aproveitamento >= 85 ? "#16a34a" : "#d97706" }} />
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
          Atual {BRL(dash.total_mensal)} / Potencial {BRL(dash.potencial_mensal)}
        </div>
      </div>

      {/* Composição */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 22 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Composição do repasse mensal</div>
          {COMPONENTES.map(c => (
            <div key={c.label} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13 }}>{c.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: c.cor }}>{BRL(c.val)}</span>
              </div>
              <div style={{ height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${c.pct}%`, height: "100%", background: c.cor, borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{c.pct}% do total</div>
            </div>
          ))}
        </div>

        {/* Histórico */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Evolução dos repasses (últimos 6 meses)</div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dash.historico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${BRL(v)}`} />
                <Tooltip contentStyle={TT} formatter={(v: number) => [BRL(v), "Repasse"]} />
                <Line type="monotone" dataKey="repasse" stroke="#1d4ed8" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alertas equipes */}
      {dash.equipes_regular?.length > 0 && (
        <div style={{ background: "#fff7f7", border: "1px solid #fca5a5", borderRadius: 10, padding: "14px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <AlertTriangle size={16} color="#dc2626" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#dc2626" }}>Equipes em status Regular — impacto financeiro crítico</span>
          </div>
          <p style={{ margin: "0 0 6px", fontSize: 13, color: "#7f1d1d" }}>
            As equipes <strong>{dash.equipes_regular.join(" e ")}</strong> estão com pontuação abaixo de 5,0 no Componente Vínculo.
            Isso reduz o fator de desempenho para 20%, causando perda de cofinanciamento.
            Acesse a aba <strong>Simulação</strong> para ver o ganho potencial com plano de melhoria.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Aba: Por Equipe ───────────────────────────────────────────────────────────
function AbaPorEquipe({ equipes }: { equipes: any[] | undefined }) {
  const [abertas, setAbertas] = useState<Set<string>>(new Set());
  if (!equipes) return <NaoDisponivelBanner nota="Dados n�o dispon�veis no momento. Integra��o pendente de configura��o no Railway." />;

  const toggle = (nome: string) => setAbertas(prev => {
    const s = new Set(prev);
    s.has(nome) ? s.delete(nome) : s.add(nome);
    return s;
  });

  const barData = equipes.map(e => ({
    nome: e.nome,
    "Capitação": e.capita,
    "Desempenho": e.desempenho,
    "Estratégico": e.estrategico,
    status: e.status_vinculo,
    total: e.total_mes,
    gap: e.gap_mes,
  }));

  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Repasse por equipe / mês — composição empilhada</div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="nome" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={42} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${BRL(v)}`} />
              <Tooltip contentStyle={TT} formatter={(v: number, name) => [BRL(v), name as string]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Capitação"   stackId="a" fill="#1d4ed8" />
              <Bar dataKey="Desempenho"  stackId="a" fill="#7c3aed" />
              <Bar dataKey="Estratégico" stackId="a" fill="#0891b2" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {equipes.map((e, i) => {
          const isOpen = abertas.has(e.nome);
          const cor = COR_STATUS(e.status_vinculo);
          return (
            <div key={i} style={{ border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, background: "#fff", overflow: "hidden" }}>
              <div onClick={() => toggle(e.nome)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", cursor: "pointer" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{e.nome}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>Param: {e.parametro.toLocaleString("pt-BR")} pessoas · Vínculo: {e.vinculo.toFixed(2)}</div>
                </div>
                <div style={{ textAlign: "right", minWidth: 90 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: cor }}>{BRL(e.total_mes)}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>/mês</div>
                </div>
                {e.gap_mes > 500 && (
                  <div style={{ textAlign: "right", minWidth: 80 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}>-{BRL(e.gap_mes)}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>gap/mês</div>
                  </div>
                )}
                <span style={{ background: `${cor}15`, color: cor, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, textTransform: "capitalize" }}>
                  {e.status_vinculo}
                </span>
                {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </div>
              {isOpen && (
                <div style={{ padding: "12px 16px", borderTop: "1px solid #f3f4f6", background: "#fafafa", display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12 }}>
                  {[
                    { label: "Capitação",      val: e.capita,      cor: "#1d4ed8" },
                    { label: "Desempenho",      val: e.desempenho,  cor: "#7c3aed" },
                    { label: "Estratégico",     val: e.estrategico, cor: "#0891b2" },
                    { label: "Total mês",       val: e.total_mes,   cor: "#16a34a" },
                    { label: "Total ano",       val: e.total_ano,   cor: "#059669" },
                    { label: "Gap potencial/mês", val: e.gap_mes,   cor: "#dc2626" },
                  ].map(k => (
                    <div key={k.label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: k.cor }}>{BRL(k.val)}</div>
                      <div style={{ fontSize: 10, color: "#9ca3af" }}>{k.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Aba: Componente Estratégico ───────────────────────────────────────────────
function AbaEstrategico({ estrategico }: { estrategico: any }) {
  if (!estrategico) return <NaoDisponivelBanner nota="Dados n�o dispon�veis no momento. Integra��o pendente de configura��o no Railway." />;
  const LABEL: Record<string, string> = {
    eSFR:   "Equipe Saúde da Família Rural",
    eSB:    "Equipe de Saúde Bucal",
    eMulti: "Equipe Multiprofissional",
    eAP:    "Equipe de Atenção Primária",
  };
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1d4ed8", margin: "0 0 4px" }}>Componente Estratégico</h2>
        <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Incentivos adicionais por tipo de equipe implantada em Apuí/AM</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
        <div style={{ background: "#eff6ff", borderRadius: 10, padding: "16px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#1d4ed8" }}>{BRL(estrategico.total_mes)}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Total estratégico / mês</div>
        </div>
        <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "16px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#16a34a" }}>{BRL(estrategico.total_ano)}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Total estratégico / ano</div>
        </div>
        <div style={{ background: "#fefce8", borderRadius: 10, padding: "16px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#a16207" }}>{estrategico.extras.length}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Tipos de equipe com incentivo</div>
        </div>
      </div>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#1d4ed8", color: "#fff" }}>
              <th style={{ padding: "10px 16px", textAlign: "left" }}>Tipo</th>
              <th style={{ padding: "10px 16px", textAlign: "left" }}>Descrição</th>
              <th style={{ padding: "10px 12px", textAlign: "right" }}>Qtd</th>
              <th style={{ padding: "10px 12px", textAlign: "right" }}>Valor Unit./mês</th>
              <th style={{ padding: "10px 12px", textAlign: "right" }}>Total/mês</th>
              <th style={{ padding: "10px 12px", textAlign: "right" }}>Total/ano</th>
            </tr>
          </thead>
          <tbody>
            {estrategico.extras.map((x: any, i: number) => (
              <tr key={i} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                <td style={{ padding: "10px 16px", fontWeight: 700, color: "#1d4ed8" }}>{x.tipo}</td>
                <td style={{ padding: "10px 16px", color: "#374151" }}>{LABEL[x.tipo] ?? x.tipo}</td>
                <td style={{ padding: "10px 12px", textAlign: "right" }}>{x.quantidade}</td>
                <td style={{ padding: "10px 12px", textAlign: "right" }}>{BRL(x.valor_unitario_mes)}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{BRL(x.total_mes)}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: "#16a34a", fontWeight: 700 }}>{BRL(x.total_ano)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: "#eff6ff", borderTop: "2px solid #bfdbfe" }}>
              <td colSpan={4} style={{ padding: "10px 16px", fontWeight: 700 }}>TOTAL ESTRATÉGICO</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: "#1d4ed8" }}>{BRL(estrategico.total_mes)}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: "#16a34a" }}>{BRL(estrategico.total_ano)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── Aba: Simulação ────────────────────────────────────────────────────────────
function AbaSimulacao({ simulacao }: { simulacao: any }) {
  if (!simulacao) return <NaoDisponivelBanner nota="Dados n�o dispon�veis no momento. Integra��o pendente de configura��o no Railway." />;
  const totalGanhoBom  = simulacao.cenarios.reduce((s: number, c: any) => s + c.ganho_bom_ano, 0);
  const totalGanhoOtimo = simulacao.cenarios.reduce((s: number, c: any) => s + c.ganho_otimo_ano, 0);

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1d4ed8", margin: "0 0 4px" }}>Simulação de Cenários</h2>
        <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
          Impacto financeiro ao elevar equipes "Regular" para "Bom" ou "Ótimo"
        </p>
      </div>

      {/* Totais */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginBottom: 24 }}>
        <div style={{ background: "#fff", border: "2px solid #bbf7d0", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Zap size={16} color="#16a34a" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>Cenário 1 — Atingir status BOM</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#16a34a" }}>+{BRL(totalGanhoBom)}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>ganho anual adicional projetado</div>
        </div>
        <div style={{ background: "#fff", border: "2px solid #bfdbfe", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Target size={16} color="#1d4ed8" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8" }}>Cenário 2 — Atingir status ÓTIMO</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#1d4ed8" }}>+{BRL(totalGanhoOtimo)}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>ganho anual adicional projetado</div>
        </div>
      </div>

      {/* Comparativo por equipe */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Comparativo de repasse mensal por cenário</div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={simulacao.cenarios.map((c: any) => ({
              equipe: c.equipe,
              Atual: c.atual_mes,
              Bom:   c.bom_mes,
              Ótimo: c.otimo_mes,
            }))} barGap={6} barSize={30}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="equipe" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${BRL(v)}`} />
              <Tooltip contentStyle={TT} formatter={(v: number, name) => [BRL(v), name as string]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Atual" fill="#dc2626" radius={[3,3,0,0]} />
              <Bar dataKey="Bom"   fill="#16a34a" radius={[3,3,0,0]}>
                <LabelList dataKey="Bom" position="top" formatter={(v: number) => BRL(v)} style={{ fontSize: 9 }} />
              </Bar>
              <Bar dataKey="Ótimo" fill="#1d4ed8" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela detalhada */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#1d4ed8", color: "#fff" }}>
              <th style={{ padding: "10px 16px", textAlign: "left" }}>Equipe</th>
              <th style={{ padding: "10px 12px", textAlign: "right" }}>Atual/mês</th>
              <th style={{ padding: "10px 12px", textAlign: "right", background: "#16a34a" }}>Bom/mês</th>
              <th style={{ padding: "10px 12px", textAlign: "right", background: "#16a34a" }}>Ganho Bom/ano</th>
              <th style={{ padding: "10px 12px", textAlign: "right" }}>Ótimo/mês</th>
              <th style={{ padding: "10px 12px", textAlign: "right" }}>Ganho Ótimo/ano</th>
            </tr>
          </thead>
          <tbody>
            {simulacao.cenarios.map((c: any, i: number) => (
              <tr key={i} style={{ borderTop: "1px solid #f3f4f6" }}>
                <td style={{ padding: "10px 16px", fontWeight: 700, color: "#dc2626" }}>{c.equipe}</td>
                <td style={{ padding: "10px 12px", textAlign: "right" }}>{BRL(c.atual_mes)}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#16a34a" }}>{BRL(c.bom_mes)}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#16a34a" }}>+{BRL(c.ganho_bom_ano)}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#1d4ed8" }}>{BRL(c.otimo_mes)}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#1d4ed8" }}>+{BRL(c.ganho_otimo_ano)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: "#f0fdf4", borderTop: "2px solid #bbf7d0" }}>
              <td colSpan={3} style={{ padding: "10px 16px", fontWeight: 700 }}>GANHO TOTAL / ANO</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 900, color: "#16a34a" }}>+{BRL(totalGanhoBom)}</td>
              <td />
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 900, color: "#1d4ed8" }}>+{BRL(totalGanhoOtimo)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ marginTop: 16, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 16px", fontSize: 12, color: "#92400e" }}>
        <strong>Como calcular:</strong> o fator de desempenho varia com a pontuação do Componente Vínculo (Regular=20%, Suficiente=50%, Bom=80%, Ótimo=100%).
        Para KENNEDY e ESTRADA NOVA, um plano de melhoria estrutural focado em cadastros domiciliares (variável B) e acompanhamento de grupos prioritários (G) pode elevar a pontuação em 4–6 pontos em 2 competências.
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────

type Aba = "geral" | "equipes" | "estrategico" | "simulacao";

export default function PainelCAF() {
  const [aba, setAba] = useState<Aba>("geral");

  const { data: dash }       = useQuery({ queryKey: ["caf-dashboard"],   queryFn: () => apiGet("/api/caf/dashboard") as Promise<any> });
  const { data: equipes }    = useQuery({ queryKey: ["caf-equipes"],     queryFn: () => apiGet("/api/caf/equipes") as Promise<any[]>, enabled: aba === "equipes" });
  const { data: estrategico }= useQuery({ queryKey: ["caf-estrategico"], queryFn: () => apiGet("/api/caf/estrategico") as Promise<any>, enabled: aba === "estrategico" });
  const { data: simulacao }  = useQuery({ queryKey: ["caf-simulacao"],   queryFn: () => apiGet("/api/caf/simulacao") as Promise<any>, enabled: aba === "simulacao" });

  const ABAS: { id: Aba; label: string }[] = [
    { id: "geral",       label: "Visão Geral" },
    { id: "equipes",     label: "Por Equipe ESF" },
    { id: "estrategico", label: "Componente Estratégico" },
    { id: "simulacao",   label: "Simulação de Cenários" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui, sans-serif" }}>
      {/* Cabeçalho */}
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>CAF — Cofinanciamento Federal da APS</h1>
            <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>
              Capitação Ponderada · Desempenho · Estratégico · Apuí/AM · IED=2
            </p>
          </div>
          {dash && (
            <div style={{ textAlign: "right", background: "rgba(255,255,255,.12)", borderRadius: 10, padding: "10px 16px" }}>
              <div style={{ fontSize: 26, fontWeight: 900 }}>{BRL(dash.total_mensal)}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>repasse mensal atual</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "0 24px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e4e7ec" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{
              padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13,
              borderBottom: aba === a.id ? "2px solid #1d4ed8" : "2px solid transparent",
              color: aba === a.id ? "#1d4ed8" : "#6b7280",
              fontWeight: aba === a.id ? 700 : 400, marginBottom: -2,
            }}>{a.label}</button>
          ))}
        </div>

        {aba === "geral"        && <AbaVisaoGeral dash={dash} />}
        {aba === "equipes"      && <AbaPorEquipe equipes={equipes} />}
        {aba === "estrategico"  && <AbaEstrategico estrategico={estrategico} />}
        {aba === "simulacao"    && <AbaSimulacao simulacao={simulacao} />}
      </div>
    </div>
  );
}

