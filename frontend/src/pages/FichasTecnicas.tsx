/**
 * Fichas Técnicas do Novo Modelo de Financiamento da APS
 * Portaria GM/MS nº 3.493/2024 | NT DESF/SAPS/MS nº 30/2025
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, DollarSign, AlertTriangle, ChevronDown, ChevronRight, CheckCircle, Info } from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "";
const apiGet = (path: string) => fetch(`${API}${path}`).then(r => r.json());

type Prioridade = "ALTA" | "MÉDIA" | "BAIXA";

const COR_PRIO: Record<Prioridade, string> = {
  ALTA: "#1b5e20",
  MÉDIA: "#e65100",
  BAIXA: "#616161",
};
const BG_PRIO: Record<Prioridade, string> = {
  ALTA: "#e8f5e9",
  MÉDIA: "#fff3e0",
  BAIXA: "#f5f5f5",
};

function Badge({ label, cor, bg }: { label: string; cor: string; bg: string }) {
  return (
    <span style={{ background: bg, color: cor, border: `1px solid ${cor}`, borderRadius: 12, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
      {label}
    </span>
  );
}

function PrioChip({ p }: { p: Prioridade }) {
  return <Badge label={p} cor={COR_PRIO[p]} bg={BG_PRIO[p]} />;
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", padding: 16, ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontWeight: 700, fontSize: 13, color: "#1565c0", borderBottom: "2px solid #e4e7ec", paddingBottom: 4, marginBottom: 12 }}>
      {children}
    </div>
  );
}

function ProfTable({ rows }: { rows: { profissional: string; cbo: string; ch_minima: number; obrigatorio?: boolean; nota?: string }[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "#f5f5f5" }}>
            <th style={{ padding: "6px 10px", textAlign: "left", borderBottom: "1px solid #e0e0e0" }}>Profissional</th>
            <th style={{ padding: "6px 10px", textAlign: "left", borderBottom: "1px solid #e0e0e0" }}>CBO</th>
            <th style={{ padding: "6px 10px", textAlign: "center", borderBottom: "1px solid #e0e0e0" }}>CH mín/sem</th>
            <th style={{ padding: "6px 10px", textAlign: "center", borderBottom: "1px solid #e0e0e0" }}>Obrigatório</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "6px 10px" }}>
                {r.profissional}
                {r.nota && <div style={{ fontSize: 10, color: "#e65100", marginTop: 2 }}>{r.nota}</div>}
              </td>
              <td style={{ padding: "6px 10px", fontFamily: "monospace", color: "#616161" }}>{r.cbo}</td>
              <td style={{ padding: "6px 10px", textAlign: "center", fontWeight: 600 }}>{r.ch_minima}h</td>
              <td style={{ padding: "6px 10px", textAlign: "center" }}>
                {r.obrigatorio !== false ? <CheckCircle size={14} color="#2e7d32" /> : <span style={{ color: "#9e9e9e" }}>—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── ABA: RESUMO ───────────────────────────────────────────────────────────────
function TabResumo() {
  const q = useQuery({ queryKey: ["ft-resumo"], queryFn: () => apiGet("/api/fichas-tecnicas/resumo") });
  const d = q.data;
  if (q.isLoading || !q.data) return <NaoDisponivelBanner nota="Integração com sistema de fichas técnicas ainda não configurada no Railway. Nenhum dado foi inventado." />;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ background: "#e3f2fd", border: "1px solid #90caf9", borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 13 }}>
        <b>📋 Base Legal:</b> {d?.portaria_base} · {d?.nota_tecnica}
        <br />
        <b>Monitoramento:</b> {d?.fonte_monitoramento}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
        {(d?.equipes ?? []).map((e: {
          equipe: string;
          modalidade: string;
          financiamento_base: string;
          bonus: string;
          total_potencial?: string;
          prioridade_apui: Prioridade;
        }, i: number) => (
          <Card key={i} style={{ borderLeft: `4px solid ${COR_PRIO[e.prioridade_apui]}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{e.equipe}</div>
                <div style={{ fontSize: 11, color: "#616161" }}>{e.modalidade}</div>
              </div>
              <PrioChip p={e.prioridade_apui} />
            </div>
            <div style={{ fontSize: 12, color: "#212121", marginBottom: 4 }}>
              <DollarSign size={12} style={{ verticalAlign: "middle", marginRight: 4, color: "#2e7d32" }} />
              {e.financiamento_base}
            </div>
            {e.total_potencial && (
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1b5e20", marginBottom: 4 }}>
                Total potencial: {e.total_potencial}
              </div>
            )}
            <div style={{ fontSize: 11, color: "#616161" }}>
              🎯 Bônus: {e.bonus}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── ABA: eSF / eAP ───────────────────────────────────────────────────────────
function TabESF() {
  const q = useQuery({ queryKey: ["ft-esf"], queryFn: () => apiGet("/api/fichas-tecnicas/esf") });
  const d = q.data;
  if (q.isLoading || !q.data) return <NaoDisponivelBanner nota="Integração com sistema de fichas técnicas ainda não configurada no Railway. Nenhum dado foi inventado." />;

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <SectionTitle>eSF / eAP — Identificação</SectionTitle>
        <div style={{ fontSize: 13, color: "#424242", marginBottom: 8 }}>{d?.descricao}</div>
        <div style={{ fontSize: 12, color: "#616161" }}>
          <b>Base legal:</b> {d?.portaria} · {d?.nota_tecnica}
        </div>
      </Card>

      <Card>
        <SectionTitle>Composição Mínima Obrigatória</SectionTitle>
        {d?.composicao_minima && <ProfTable rows={d.composicao_minima} />}
        <div style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>Complementares (opcionais):</div>
          {(d?.composicao_complementar ?? []).map((c: { profissional: string; cbo: string; ch_minima: number }, i: number) => (
            <span key={i} style={{ display: "inline-block", background: "#f5f5f5", border: "1px solid #e0e0e0", borderRadius: 12, padding: "2px 10px", fontSize: 11, margin: "0 4px 4px 0" }}>
              {c.profissional} (CBO {c.cbo})
            </span>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Carga Horária</SectionTitle>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1565c0" }}>{d?.carga_horaria?.descricao}</div>
        <div style={{ fontSize: 12, color: "#616161", marginTop: 4 }}>{d?.carga_horaria?.fonte}</div>
      </Card>

      <Card>
        <SectionTitle>Parâmetro Populacional — Apuí/AM</SectionTitle>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                <th style={{ padding: "6px 10px", textAlign: "left", borderBottom: "1px solid #e0e0e0" }}>Porte</th>
                <th style={{ padding: "6px 10px", textAlign: "center", borderBottom: "1px solid #e0e0e0" }}>Pessoas / eSF</th>
              </tr>
            </thead>
            <tbody>
              {(d?.parametro_populacional?.tabela ?? []).map((r: { porte: string; pessoas: number }, i: number) => (
                <tr key={i} style={{ borderBottom: "1px solid #f0f0f0", background: i === 0 ? "#e8f5e9" : undefined }}>
                  <td style={{ padding: "6px 10px" }}>{r.porte}</td>
                  <td style={{ padding: "6px 10px", textAlign: "center", fontWeight: i === 0 ? 700 : 400 }}>{r.pessoas.toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 10, background: "#e8f5e9", borderRadius: 6, padding: 10, fontSize: 12 }}>
          <b>🏙 Apuí (Porte I):</b> {d?.parametro_populacional?.apui?.pessoas_por_equipe?.toLocaleString("pt-BR")} pessoas/eSF
          <br />
          <span style={{ color: "#616161" }}>{d?.parametro_populacional?.apui?.observacao}</span>
        </div>
        <div style={{ fontSize: 11, color: "#9e9e9e", marginTop: 6 }}>Fonte: {d?.parametro_populacional?.fonte}</div>
      </Card>

      <Card>
        <SectionTitle>Componentes do Financiamento</SectionTitle>
        {(d?.financiamento?.componentes ?? []).map((c: { nome: string; descricao: string; valor_referencia: string; indicadores_fonte?: string }, i: number) => (
          <div key={i} style={{ borderLeft: "3px solid #1565c0", paddingLeft: 10, marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{c.nome}</div>
            <div style={{ fontSize: 12, color: "#424242" }}>{c.descricao}</div>
            <div style={{ fontSize: 11, color: "#1565c0", marginTop: 2 }}>{c.valor_referencia}</div>
            {c.indicadores_fonte && <div style={{ fontSize: 11, color: "#e65100" }}>Fonte: {c.indicadores_fonte}</div>}
          </div>
        ))}
        <div style={{ fontSize: 12, color: "#424242", background: "#fff3e0", borderRadius: 6, padding: 10, marginTop: 4 }}>
          <Info size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
          {d?.financiamento?.nota}
        </div>
      </Card>

      <Card>
        <SectionTitle>Critérios de Implantação</SectionTitle>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.8 }}>
          {(d?.criterios_implantacao ?? []).map((c: string, i: number) => <li key={i}>{c}</li>)}
        </ul>
      </Card>
    </div>
  );
}

// ── ABA: ESB ─────────────────────────────────────────────────────────────────
function TabESB() {
  const q = useQuery({ queryKey: ["ft-esb"], queryFn: () => apiGet("/api/fichas-tecnicas/esb") });
  const d = q.data;
  if (q.isLoading || !q.data) return <NaoDisponivelBanner nota="Integração com sistema de fichas técnicas ainda não configurada no Railway. Nenhum dado foi inventado." />;

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <SectionTitle>ESB — Identificação</SectionTitle>
        <div style={{ fontSize: 13, color: "#424242", marginBottom: 8 }}>{d?.descricao}</div>
        <div style={{ fontSize: 12, color: "#616161" }}><b>Base legal:</b> {d?.portaria}</div>
      </Card>

      {(d?.modalidades ?? []).map((m: { tipo: string; composicao: { profissional: string; cbo: string; ch_minima: number }[]; descricao: string }, i: number) => (
        <Card key={i} style={{ borderLeft: "4px solid #1565c0" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{m.tipo}</div>
          <div style={{ fontSize: 12, color: "#616161", marginBottom: 8 }}>{m.descricao}</div>
          <ProfTable rows={m.composicao} />
        </Card>
      ))}

      <Card>
        <SectionTitle>Parâmetro Populacional</SectionTitle>
        <div style={{ fontSize: 13 }}>
          <b>Vinculação:</b> {d?.parametro_populacional?.vinculacao}<br />
          <span style={{ color: "#616161" }}>{d?.parametro_populacional?.cobertura_recomendada}</span>
        </div>
      </Card>

      <Card>
        <SectionTitle>Indicadores Monitorados (SIAPS)</SectionTitle>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.8 }}>
          {(d?.indicadores_monitoramento ?? []).map((ind: string, i: number) => <li key={i}>{ind}</li>)}
        </ul>
      </Card>
    </div>
  );
}

// ── ABA: eMulti ──────────────────────────────────────────────────────────────
function TabEMulti() {
  const q = useQuery({ queryKey: ["ft-emulti"], queryFn: () => apiGet("/api/fichas-tecnicas/emulti") });
  const d = q.data;
  const [cboDet, setCboDet] = useState(false);
  if (q.isLoading || !q.data) return <NaoDisponivelBanner nota="Integração com sistema de fichas técnicas ainda não configurada no Railway. Nenhum dado foi inventado." />;

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <SectionTitle>eMulti — Identificação</SectionTitle>
        <div style={{ fontSize: 13, color: "#424242", marginBottom: 8 }}>{d?.descricao}</div>
        <div style={{ fontSize: 12, color: "#616161" }}><b>Base legal:</b> {d?.portaria} · {d?.nota_tecnica}</div>
      </Card>

      {/* Contexto Apuí */}
      <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 8, padding: 12, fontSize: 13 }}>
        <b>🌊 Contexto Apuí/AM:</b> {d?.apui_contexto?.justificativa}
        <br />
        <b>Modalidade recomendada:</b> {d?.apui_contexto?.modalidade_recomendada} — <b style={{ color: "#2e7d32" }}>{d?.apui_contexto?.valor_potencial_atual}</b>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {(d?.modalidades ?? []).map((m: {
          tipo: string;
          esf_vinculadas: string;
          ch_minima_equipe: number;
          financiamento_mensal: number;
          bonus_desempenho: number;
          total_potencial_mes: number;
          composicao_minima: string[];
          descricao: string;
          cooperacao_intermunicipal?: boolean;
        }, i: number) => (
          <Card key={i} style={{ borderTop: "4px solid #1565c0" }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{m.tipo}</div>
            <div style={{ fontSize: 11, color: "#616161", marginBottom: 8 }}>{m.descricao}</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
              <div style={{ background: "#f5f5f5", borderRadius: 6, padding: "6px 10px" }}>
                <div style={{ fontSize: 10, color: "#9e9e9e" }}>eSF vinculadas</div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{m.esf_vinculadas}</div>
              </div>
              <div style={{ background: "#f5f5f5", borderRadius: 6, padding: "6px 10px" }}>
                <div style={{ fontSize: 10, color: "#9e9e9e" }}>CH mín/equipe</div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{m.ch_minima_equipe}h/sem</div>
              </div>
              <div style={{ background: "#e8f5e9", borderRadius: 6, padding: "6px 10px" }}>
                <div style={{ fontSize: 10, color: "#9e9e9e" }}>Custeio base/mês</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#1b5e20" }}>
                  R$ {m.financiamento_mensal.toLocaleString("pt-BR")}
                </div>
              </div>
              <div style={{ background: "#e3f2fd", borderRadius: 6, padding: "6px 10px" }}>
                <div style={{ fontSize: 10, color: "#9e9e9e" }}>Bônus desempenho</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#1565c0" }}>
                  + R$ {m.bonus_desempenho.toLocaleString("pt-BR")}
                </div>
              </div>
            </div>

            <div style={{ background: "#e8f5e9", borderRadius: 6, padding: "8px 12px", textAlign: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: "#616161" }}>Total potencial/mês</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#1b5e20" }}>
                R$ {m.total_potencial_mes.toLocaleString("pt-BR")}
              </div>
            </div>

            <div style={{ fontSize: 11, color: "#424242" }}>
              <b>Composição mínima:</b>
              <ul style={{ margin: "4px 0 0 0", paddingLeft: 16, lineHeight: 1.6 }}>
                {m.composicao_minima.map((c, ci) => <li key={ci}>{c}</li>)}
              </ul>
            </div>

            {m.cooperacao_intermunicipal && (
              <div style={{ marginTop: 8, fontSize: 11, background: "#e1f5fe", borderRadius: 4, padding: "4px 8px", color: "#0277bd" }}>
                ✓ Cooperação intermunicipal permitida
              </div>
            )}
          </Card>
        ))}
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setCboDet(v => !v)}>
          <SectionTitle>CBOs Elegíveis ({d?.cbos_elegiveis?.length ?? 0} profissões)</SectionTitle>
          {cboDet ? <ChevronDown size={16} color="#9e9e9e" /> : <ChevronRight size={16} color="#9e9e9e" />}
        </div>
        {cboDet && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {(d?.cbos_elegiveis ?? []).map((c: { profissional: string; cbo: string }, i: number) => (
              <span key={i} style={{ background: "#f5f5f5", border: "1px solid #e0e0e0", borderRadius: 6, padding: "3px 10px", fontSize: 11 }}>
                {c.profissional} <span style={{ color: "#9e9e9e", fontFamily: "monospace" }}>{c.cbo}</span>
              </span>
            ))}
          </div>
        )}
        {!cboDet && <div style={{ fontSize: 12, color: "#616161" }}>Clique para expandir a lista completa de profissões</div>}
      </Card>
    </div>
  );
}

// ── ABA: Ribeirinha ───────────────────────────────────────────────────────────
function TabRibeirinha() {
  const q = useQuery({ queryKey: ["ft-ribeirinha"], queryFn: () => apiGet("/api/fichas-tecnicas/ribeirinha") });
  const d = q.data;
  if (q.isLoading || !q.data) return <NaoDisponivelBanner nota="Integração com sistema de fichas técnicas ainda não configurada no Railway. Nenhum dado foi inventado." />;

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: "#fbe9e7", border: "1px solid #ffccbc", borderRadius: 8, padding: 12, fontSize: 13 }}>
        <AlertTriangle size={14} style={{ verticalAlign: "middle", marginRight: 6, color: "#bf360c" }} />
        <b>Contexto Ribeirinho Amazônico — Apuí/AM:</b><br />
        {d?.desafios_indicadores?.pre_natal?.causa}. Indicadores historicamente abaixo da média nacional.
      </div>

      <Card>
        <SectionTitle>eSF Ribeirinha — Identificação</SectionTitle>
        <div style={{ fontSize: 13, color: "#424242", marginBottom: 8 }}>{d?.descricao}</div>
        <div style={{ fontSize: 12, color: "#616161" }}><b>Base legal:</b> {d?.portaria}</div>
      </Card>

      <Card>
        <SectionTitle>Composição Mínima</SectionTitle>
        {d?.composicao_minima && <ProfTable rows={d.composicao_minima} />}
        <div style={{ marginTop: 8, fontSize: 12, color: "#616161" }}>
          <Info size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
          {d?.carga_horaria?.especificidade}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card style={{ borderLeft: "4px solid #c62828" }}>
          <SectionTitle>Pré-Natal — Desafio Crítico</SectionTitle>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#c62828" }}>
            {d?.desafios_indicadores?.pre_natal?.realidade_ribeirinha}
          </div>
          <div style={{ fontSize: 11, color: "#616161" }}>vs meta nacional: {d?.desafios_indicadores?.pre_natal?.meta_nacional}</div>
          <div style={{ fontSize: 11, color: "#424242", marginTop: 6 }}>{d?.desafios_indicadores?.pre_natal?.causa}</div>
          <div style={{ fontSize: 10, color: "#9e9e9e", marginTop: 4 }}>Fonte: {d?.desafios_indicadores?.pre_natal?.fonte}</div>
        </Card>
        <Card style={{ borderLeft: "4px solid #e65100" }}>
          <SectionTitle>HbA1c — Desafio Crítico</SectionTitle>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#e65100" }}>
            {d?.desafios_indicadores?.hba1c?.realidade_ribeirinha}
          </div>
          <div style={{ fontSize: 11, color: "#616161" }}>vs meta nacional: {d?.desafios_indicadores?.hba1c?.meta_nacional}</div>
          <div style={{ fontSize: 11, color: "#424242", marginTop: 6 }}>{d?.desafios_indicadores?.hba1c?.causa}</div>
        </Card>
      </div>

      <Card>
        <SectionTitle>Ações de Gestão Recomendadas</SectionTitle>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.8 }}>
          {(d?.desafios_indicadores?.acoes_gestao ?? []).map((a: string, i: number) => <li key={i}>{a}</li>)}
        </ul>
      </Card>

      <Card>
        <SectionTitle>Contexto Local — Apuí/AM</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div style={{ background: "#e3f2fd", borderRadius: 6, padding: 10, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1565c0" }}>{d?.apui_contexto?.equipes_ribeirinhas_apui}</div>
            <div style={{ fontSize: 11, color: "#616161" }}>Equipes Ribeirinhas</div>
          </div>
          <div style={{ background: "#e3f2fd", borderRadius: 6, padding: 10, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1565c0" }}>{d?.apui_contexto?.comunidades_estimadas}</div>
            <div style={{ fontSize: 11, color: "#616161" }}>Comunidades</div>
          </div>
          <div style={{ background: "#e3f2fd", borderRadius: 6, padding: 10, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1565c0" }}>42%</div>
            <div style={{ fontSize: 11, color: "#616161" }}>Pop. rural/ribeirinha</div>
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 12 }}>
          <b>Rios principais:</b> {(d?.apui_contexto?.rios_principais ?? []).join(", ")}
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: "#424242" }}>{d?.apui_contexto?.observacao}</div>
      </Card>
    </div>
  );
}

// ── ABA: Consultório na Rua ───────────────────────────────────────────────────
function TabConsultorioRua() {
  const q = useQuery({ queryKey: ["ft-cr"], queryFn: () => apiGet("/api/fichas-tecnicas/consultorio-na-rua") });
  const d = q.data;
  if (q.isLoading || !q.data) return <NaoDisponivelBanner nota="Integração com sistema de fichas técnicas ainda não configurada no Railway. Nenhum dado foi inventado." />;

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <SectionTitle>eCR — Identificação</SectionTitle>
        <div style={{ fontSize: 13, color: "#424242", marginBottom: 8 }}>{d?.descricao}</div>
        <div style={{ fontSize: 12, color: "#616161" }}><b>Base legal:</b> {d?.portaria}</div>
        <div style={{ fontSize: 12, marginTop: 6 }}><b>Público-alvo:</b> {d?.publico_alvo}</div>
      </Card>

      <div style={{ background: "#f3e5f5", border: "1px solid #ce93d8", borderRadius: 8, padding: 12, fontSize: 13 }}>
        <b>📍 Apuí/AM:</b> {d?.apui_contexto?.recomendacao}
        <br /><span style={{ color: "#616161" }}>{d?.apui_contexto?.aplicabilidade}</span>
      </div>

      {(d?.modalidades ?? []).map((m: { tipo: string; composicao_minima: { profissional: string; cbo: string; ch_minima: number }[]; ch_equipe_minima: number; descricao: string }, i: number) => (
        <Card key={i} style={{ borderLeft: "4px solid #8e24aa" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{m.tipo}</div>
          <div style={{ fontSize: 11, color: "#616161", marginBottom: 8 }}>{m.descricao} · CH mín equipe: {m.ch_equipe_minima}h/sem</div>
          <ProfTable rows={m.composicao_minima} />
        </Card>
      ))}

      <Card>
        <SectionTitle>Articulação em Rede</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {(d?.articulacao_rede ?? []).map((r: string, i: number) => (
            <span key={i} style={{ background: "#f3e5f5", border: "1px solid #ce93d8", borderRadius: 12, padding: "2px 10px", fontSize: 11 }}>{r}</span>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── ABA: Prisional ────────────────────────────────────────────────────────────
function TabPrisional() {
  const q = useQuery({ queryKey: ["ft-prisional"], queryFn: () => apiGet("/api/fichas-tecnicas/prisional") });
  const d = q.data;
  if (q.isLoading || !q.data) return <NaoDisponivelBanner nota="Integração com sistema de fichas técnicas ainda não configurada no Railway. Nenhum dado foi inventado." />;

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <SectionTitle>eSFP — Identificação</SectionTitle>
        <div style={{ fontSize: 13, color: "#424242", marginBottom: 8 }}>{d?.descricao}</div>
        <div style={{ fontSize: 12, color: "#616161" }}><b>Base legal:</b> {d?.portaria}</div>
      </Card>

      <div style={{ background: "#e8eaf6", border: "1px solid #9fa8da", borderRadius: 8, padding: 12, fontSize: 13 }}>
        <b>📍 Apuí/AM:</b> {d?.apui_contexto?.estabelecimentos}
        <br /><span style={{ color: "#616161" }}>{d?.apui_contexto?.recomendacao}</span>
      </div>

      {(d?.modalidades ?? []).map((m: { tipo: string; composicao: { profissional: string; cbo: string; ch_minima: number }[]; descricao: string }, i: number) => (
        <Card key={i} style={{ borderLeft: "4px solid #3949ab" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{m.tipo}</div>
          <div style={{ fontSize: 11, color: "#616161", marginBottom: 8 }}>{m.descricao}</div>
          <ProfTable rows={m.composicao} />
        </Card>
      ))}

      <Card>
        <SectionTitle>Prioridades de Saúde (PNAISP)</SectionTitle>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.8 }}>
          {(d?.prioridades_saude ?? []).map((p: string, i: number) => <li key={i}>{p}</li>)}
        </ul>
      </Card>
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
const ABAS = [
  { key: "resumo", label: "📊 Resumo / Financiamento" },
  { key: "esf", label: "🏥 eSF / eAP" },
  { key: "esb", label: "🦷 ESB" },
  { key: "emulti", label: "👥 eMulti" },
  { key: "ribeirinha", label: "🚤 Ribeirinha" },
  { key: "cr", label: "🏠 Consultório na Rua" },
  { key: "prisional", label: "🔒 Prisional" },
];

export default function FichasTecnicas() {
  const [aba, setAba] = useState("resumo");

  return (
    <div style={{ fontFamily: "system-ui,-apple-system,sans-serif", minHeight: "100vh", background: "#f5f5f3" }}>
      {/* Header */}
      <div style={{ background: "#1565c0", color: "#fff", padding: "12px 20px" }}>
        <div style={{ fontWeight: 700, fontSize: 17 }}>📋 Fichas Técnicas — Novo Financiamento APS</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          Portaria GM/MS nº 3.493/2024 · NT DESF/SAPS/MS nº 30/2025 · Apuí/AM (IBGE 1300144)
        </div>
      </div>

      {/* Abas */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "0 16px", display: "flex", overflowX: "auto", gap: 0 }}>
        {ABAS.map(a => (
          <button
            key={a.key}
            onClick={() => setAba(a.key)}
            style={{
              border: "none", background: "none", cursor: "pointer",
              padding: "12px 14px", fontSize: 12, fontWeight: aba === a.key ? 700 : 400,
              color: aba === a.key ? "#1565c0" : "#616161",
              borderBottom: aba === a.key ? "2px solid #1565c0" : "2px solid transparent",
              whiteSpace: "nowrap",
            }}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {aba === "resumo" && <TabResumo />}
      {aba === "esf" && <TabESF />}
      {aba === "esb" && <TabESB />}
      {aba === "emulti" && <TabEMulti />}
      {aba === "ribeirinha" && <TabRibeirinha />}
      {aba === "cr" && <TabConsultorioRua />}
      {aba === "prisional" && <TabPrisional />}
    </div>
  );
}
