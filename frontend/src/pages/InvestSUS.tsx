// InvestSUS — Emendas, Propostas e Execução
// ERSUS 360 · FMS Apuí/AM
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  Landmark, Plus, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  ChevronDown, ChevronRight, FileText, Upload, Search, X, Check,
  TrendingUp, DollarSign, BarChart3, Bell, Info, Eye, Calendar,
  Building2, ClipboardList, Activity, Filter, Download,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

// ── Paleta de cores ───────────────────────────────────────────────────────────
const CORES = {
  indicado:  "#7c3aed",
  aprovado:  "#0284c7",
  empenhado: "#0891b2",
  pago:      "#059669",
  executado: "#16a34a",
  alerta:    "#d97706",
  critico:   "#dc2626",
  urgente:   "#ea580c",
  info:      "#6366f1",
};

const SITUACAO_MAP: Record<string, { label: string; cor: string; bg: string }> = {
  recurso_disponivel:               { label: "Recurso Disponível",             cor: "#6b7280", bg: "#f3f4f6" },
  recurso_programado:               { label: "Programado",                     cor: "#6b7280", bg: "#f3f4f6" },
  indicacao_parlamentar:            { label: "Indicação Parlamentar",          cor: "#7c3aed", bg: "#f5f3ff" },
  beneficiario_indicado:            { label: "Beneficiário Indicado",          cor: "#7c3aed", bg: "#f5f3ff" },
  prazo_cadastramento:              { label: "Prazo de Cadastramento",         cor: "#d97706", bg: "#fffbeb" },
  proposta_elaboracao:              { label: "Em Elaboração",                  cor: "#0891b2", bg: "#ecfeff" },
  proposta_cadastrada:              { label: "Proposta Cadastrada",            cor: "#0891b2", bg: "#ecfeff" },
  proposta_enviada:                 { label: "Proposta Enviada",               cor: "#0284c7", bg: "#eff6ff" },
  em_analise:                       { label: "Em Análise",                     cor: "#0284c7", bg: "#eff6ff" },
  em_diligencia:                    { label: "Em Diligência",                  cor: "#d97706", bg: "#fffbeb" },
  aguardando_complementacao:        { label: "Aguardando Complementação",      cor: "#d97706", bg: "#fffbeb" },
  complementacao_enviada:           { label: "Complementação Enviada",         cor: "#0284c7", bg: "#eff6ff" },
  em_reanalize:                     { label: "Em Reanálise",                   cor: "#0284c7", bg: "#eff6ff" },
  aprovada:                         { label: "Aprovada",                       cor: "#059669", bg: "#f0fdf4" },
  rejeitada:                        { label: "Rejeitada",                      cor: "#dc2626", bg: "#fef2f2" },
  cancelada:                        { label: "Cancelada",                      cor: "#9ca3af", bg: "#f9fafb" },
  empenhada:                        { label: "Empenhada",                      cor: "#0891b2", bg: "#ecfeff" },
  empenhada_aguardando_formalizacao: { label: "Empenhada — Ag. Formalização",  cor: "#ea580c", bg: "#fff7ed" },
  formalizada:                      { label: "Formalizada",                    cor: "#059669", bg: "#f0fdf4" },
  portaria_publicada:               { label: "Portaria Publicada",             cor: "#059669", bg: "#f0fdf4" },
  aguardando_pagamento:             { label: "Aguardando Pagamento",           cor: "#d97706", bg: "#fffbeb" },
  parcialmente_paga:                { label: "Parcialmente Paga",              cor: "#0891b2", bg: "#ecfeff" },
  totalmente_paga:                  { label: "Totalmente Paga",                cor: "#059669", bg: "#f0fdf4" },
  execucao_nao_iniciada:            { label: "Execução Não Iniciada",          cor: "#9ca3af", bg: "#f9fafb" },
  em_execucao:                      { label: "Em Execução",                    cor: "#0284c7", bg: "#eff6ff" },
  execucao_atrasada:                { label: "Execução Atrasada",              cor: "#dc2626", bg: "#fef2f2" },
  execucao_paralisada:              { label: "Execução Paralisada",            cor: "#dc2626", bg: "#fef2f2" },
  execucao_fisica_concluida:        { label: "Execução Física Concluída",      cor: "#059669", bg: "#f0fdf4" },
  execucao_financeira_concluida:    { label: "Execução Financeira Concluída",  cor: "#059669", bg: "#f0fdf4" },
  monitoramento_pendente:           { label: "Monitoramento Pendente",         cor: "#d97706", bg: "#fffbeb" },
  monitoramento_preenchido:         { label: "Monitoramento Preenchido",       cor: "#059669", bg: "#f0fdf4" },
  prestacao_contas_pendente:        { label: "Prestação de Contas Pendente",   cor: "#dc2626", bg: "#fef2f2" },
  prestacao_contas_enviada:         { label: "Prestação de Contas Enviada",    cor: "#059669", bg: "#f0fdf4" },
  devolucao_saldo_pendente:         { label: "Devolução de Saldo Pendente",    cor: "#dc2626", bg: "#fef2f2" },
  instrumento_concluido:            { label: "Instrumento Concluído",          cor: "#059669", bg: "#f0fdf4" },
};

const NIVEL_ALERTA: Record<string, { label: string; cor: string; icone: React.ReactNode }> = {
  informativo: { label: "Informativo", cor: "#6366f1", icone: <Info size={14} /> },
  atencao:     { label: "Atenção",     cor: "#d97706", icone: <AlertTriangle size={14} /> },
  urgente:     { label: "Urgente",     cor: "#ea580c", icone: <AlertTriangle size={14} /> },
  critico:     { label: "Crítico",     cor: "#dc2626", icone: <AlertTriangle size={14} /> },
};

const fmt = (v: number) => v?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v: number) => `${(v ?? 0).toFixed(1)}%`;

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  page:  { padding: 20, fontFamily: "system-ui, -apple-system, sans-serif" } as React.CSSProperties,
  card:  { background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 16, marginBottom: 14 } as React.CSSProperties,
  title: { fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#111827" } as React.CSSProperties,
  tab:   (a: boolean) => ({ padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: a ? "#1e3a5f" : "#f3f4f6", color: a ? "#fff" : "#374151", transition: "all .15s" }) as React.CSSProperties,
  btn:   (cor?: string) => ({ padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: cor ?? "#f3f4f6", color: cor ? "#fff" : "#374151", display: "flex", alignItems: "center", gap: 5 }) as React.CSSProperties,
  input: { border: "1px solid #d1d5db", borderRadius: 6, padding: "7px 10px", fontSize: 13, width: "100%", boxSizing: "border-box" as const, outline: "none" },
  label: { fontSize: 11, color: "#6b7280", display: "block", marginBottom: 3, fontWeight: 500 } as React.CSSProperties,
};

// ── Badges ─────────────────────────────────────────────────────────────────────
function SituacaoBadge({ situacao }: { situacao: string }) {
  const cfg = SITUACAO_MAP[situacao] ?? { label: situacao, cor: "#6b7280", bg: "#f3f4f6" };
  return (
    <span style={{ background: cfg.bg, color: cfg.cor, borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" as const }}>
      {cfg.label}
    </span>
  );
}

function NivelBadge({ nivel }: { nivel: string }) {
  const cfg = NIVEL_ALERTA[nivel] ?? NIVEL_ALERTA.atencao;
  return (
    <span style={{ color: cfg.cor, display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700 }}>
      {cfg.icone} {cfg.label}
    </span>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPICard({ label, valor, cor, sub }: { label: string; valor: string; cor: string; sub?: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 16px", borderTop: `3px solid ${cor}` }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: cor }}>{valor}</div>
      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function DashboardInvestSUS({ municipio_id }: { municipio_id: number }) {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["investsus-dashboard", municipio_id],
    queryFn: () => api.get(`/api/investsus/dashboard?municipio_id=${municipio_id}`).then(r => r.data),
    retry: 1,
  });

  const seedMutation = useMutation({
    mutationFn: () => api.post("/api/investsus/seed-exemplo-apui").then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investsus"] }),
  });

  if (isLoading) return <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Carregando...</div>;

  if (error || !data) {
    return (
      <div style={{ ...S.card, borderLeft: "4px solid #d97706", background: "#fffbeb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <AlertTriangle size={18} color="#d97706" />
          <span style={{ fontWeight: 700, color: "#92400e" }}>Nenhuma proposta cadastrada</span>
        </div>
        <p style={{ fontSize: 13, color: "#78350f", marginBottom: 16 }}>
          O módulo InvestSUS está pronto. Cadastre propostas manualmente, importe via CSV ou carregue o exemplo real de Apuí para validação.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={S.btn("#1e3a5f")} onClick={() => seedMutation.mutate()}>
            {seedMutation.isPending ? "Carregando..." : "Carregar exemplo Apuí (36000820396202600)"}
          </button>
        </div>
        {seedMutation.isSuccess && <div style={{ marginTop: 8, color: "#059669", fontSize: 12 }}>✓ Exemplo carregado — atualize a página.</div>}
      </div>
    );
  }

  const CORES_PIE = ["#1e3a5f", "#0284c7", "#059669", "#d97706", "#7c3aed", "#dc2626"];

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
        <KPICard label="Total Indicado"  valor={fmt(data.total_indicado)}  cor={CORES.indicado} />
        <KPICard label="Total Aprovado"  valor={fmt(data.total_aprovado)}  cor={CORES.aprovado} sub={fmtPct(data.perc_empenhado) + " empenhado"} />
        <KPICard label="Total Pago"      valor={fmt(data.total_pago)}      cor={CORES.pago}     sub={fmtPct(data.perc_pago) + " do indicado"} />
        <KPICard label="Total Executado" valor={fmt(data.total_executado)} cor={CORES.executado} sub={fmtPct(data.perc_executado) + " do pago"} />
      </div>

      {/* Alertas */}
      {data.alertas_abertos > 0 && (
        <div style={{ ...S.card, borderLeft: "4px solid #dc2626", background: "#fef2f2", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Bell size={16} color="#dc2626" />
            <span style={{ fontWeight: 700, color: "#991b1b" }}>
              {data.alertas_abertos} alerta{data.alertas_abertos !== 1 ? "s" : ""} aberto{data.alertas_abertos !== 1 ? "s" : ""}
              {data.alertas_criticos > 0 && ` — ${data.alertas_criticos} crítico${data.alertas_criticos !== 1 ? "s" : ""}`}
            </span>
          </div>
        </div>
      )}

      {/* Funil */}
      <div style={S.card}>
        <div style={S.title}>Funil de Execução</div>
        <div style={{ display: "flex", alignItems: "stretch", gap: 4 }}>
          {[
            { label: "Indicado",  valor: data.total_indicado,  perc: 100,             cor: CORES.indicado },
            { label: "Aprovado",  valor: data.total_aprovado,  perc: data.perc_empenhado, cor: CORES.aprovado },
            { label: "Pago",      valor: data.total_pago,      perc: data.perc_pago,  cor: CORES.pago },
            { label: "Executado", valor: data.total_executado, perc: data.perc_executado, cor: CORES.executado },
          ].map((item) => (
            <div key={item.label} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ background: item.cor + "15", border: `2px solid ${item.cor}`, borderRadius: 8, padding: "10px 6px" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: item.cor }}>{fmtPct(item.perc)}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: item.cor }}>{item.label}</div>
                <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{fmt(item.valor)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gráficos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={S.card}>
          <div style={S.title}>Por Programa</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.por_programa.slice(0, 8)} layout="vertical" margin={{ left: 8, right: 20 }}>
              <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={(v) => fmt(v)} />
              <YAxis type="category" dataKey="programa" tick={{ fontSize: 9 }} width={130} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="valor" fill={CORES.aprovado} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={S.card}>
          <div style={S.title}>Por Situação</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.por_situacao} dataKey="qtd" nameKey="situacao" outerRadius={80}
                label={({ situacao, qtd }) => `${SITUACAO_MAP[situacao]?.label ?? situacao}: ${qtd}`}
                labelLine={false}>
                {data.por_situacao.map((_: any, i: number) => <Cell key={i} fill={CORES_PIE[i % CORES_PIE.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v} proposta${v !== 1 ? "s" : ""}`, "Qtd"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Totais */}
      <div style={{ ...S.card, background: "#f9fafb" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[
            { label: "Propostas",   valor: `${data.total_propostas}` },
            { label: "Saldo Executar", valor: fmt(data.saldo_executar) },
            { label: "Alertas Abertos", valor: `${data.alertas_abertos}` },
            { label: "Alertas Críticos", valor: `${data.alertas_criticos}` },
          ].map(({ label, valor }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1e3a5f" }}>{valor}</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Lista de Propostas ────────────────────────────────────────────────────────
function ListaPropostas({ municipio_id, onSelect }: { municipio_id: number; onSelect: (p: any) => void }) {
  const [busca, setBusca] = useState("");
  const [situacaoFiltro, setSituacaoFiltro] = useState("");
  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState({
    numero_proposta: "", numero_emenda: "", exercicio: new Date().getFullYear(),
    objeto: "", entidade_nome: "", entidade_cnpj: "", valor_indicado: 0,
    situacao_original: "", situacao_normalizada: "recurso_disponivel",
    componente: "MAC", tipo_financiamento: "custeio", tipo_emenda: "individual",
    responsavel_interno: "", fonte_dado: "manual",
  });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["investsus-propostas", municipio_id, busca, situacaoFiltro],
    queryFn: () => {
      const params = new URLSearchParams({ municipio_id: String(municipio_id) });
      if (busca) params.set("busca", busca);
      if (situacaoFiltro) params.set("situacao", situacaoFiltro);
      return api.get(`/api/investsus/propostas?${params}`).then(r => r.data);
    },
    placeholderData: { total: 0, propostas: [] },
  });

  const criar = useMutation({
    mutationFn: (body: typeof form) => api.post("/api/investsus/propostas", body).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["investsus"] });
      setCriando(false);
      setForm({ ...form, numero_proposta: "", numero_emenda: "", objeto: "", valor_indicado: 0, situacao_original: "" });
    },
  });

  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" as const }}>
        <div style={{ position: "relative" as const, flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
          <input style={{ ...S.input, paddingLeft: 28 }} placeholder="Buscar por número, objeto, entidade..."
            value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <select style={{ ...S.input, width: "auto", flex: "none" }} value={situacaoFiltro} onChange={e => setSituacaoFiltro(e.target.value)}>
          <option value="">Todas situações</option>
          {Object.entries(SITUACAO_MAP).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <button style={S.btn("#1e3a5f")} onClick={() => setCriando(true)}>
          <Plus size={13} /> Nova Proposta
        </button>
      </div>

      {/* Form nova proposta */}
      {criando && (
        <div style={{ ...S.card, background: "#f9fafb", borderLeft: "3px solid #1e3a5f" }}>
          <div style={{ ...S.title, marginBottom: 14 }}>Nova Proposta InvestSUS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 10 }}>
            {([
              ["numero_proposta", "Nº da Proposta *", "text"],
              ["numero_emenda", "Nº da Emenda", "text"],
              ["exercicio", "Exercício", "number"],
              ["entidade_nome", "Entidade Beneficiária", "text"],
              ["entidade_cnpj", "CNPJ", "text"],
              ["valor_indicado", "Valor Indicado (R$)", "number"],
            ] as [string, string, string][]).map(([k, lbl, t]) => (
              <div key={k}>
                <label style={S.label}>{lbl}</label>
                <input type={t} style={S.input} value={(form as any)[k]}
                  onChange={e => f(k, t === "number" ? Number(e.target.value) : e.target.value)} />
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={S.label}>Situação Normalizada</label>
              <select style={S.input} value={form.situacao_normalizada} onChange={e => f("situacao_normalizada", e.target.value)}>
                {Object.entries(SITUACAO_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Componente</label>
              <select style={S.input} value={form.componente} onChange={e => f("componente", e.target.value)}>
                <option value="PAP">PAP - Atenção Primária</option>
                <option value="MAC">MAC - Média e Alta Complexidade</option>
                <option value="Vigilância">Vigilância em Saúde</option>
                <option value="Assistência Farmacêutica">Assistência Farmacêutica</option>
                <option value="Gestão">Gestão em Saúde</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div>
              <label style={S.label}>Tipo de Financiamento</label>
              <select style={S.input} value={form.tipo_financiamento} onChange={e => f("tipo_financiamento", e.target.value)}>
                <option value="custeio">Custeio</option>
                <option value="investimento">Investimento (Equipamentos/Obras)</option>
                <option value="estruturacao">Estruturação</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={S.label}>Objeto / Descrição</label>
            <textarea style={{ ...S.input, minHeight: 60, resize: "vertical" as const }}
              value={form.objeto} onChange={e => f("objeto", e.target.value)} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={S.label}>Situação Original (InvestSUS)</label>
            <input style={S.input} value={form.situacao_original} onChange={e => f("situacao_original", e.target.value)}
              placeholder="Cole aqui o texto exato do InvestSUS" />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={S.btn("#059669")} onClick={() => criar.mutate(form)}>
              {criar.isPending ? "Salvando..." : <><Check size={13} /> Salvar Proposta</>}
            </button>
            <button style={S.btn()} onClick={() => setCriando(false)}><X size={13} /> Cancelar</button>
          </div>
          {criar.isError && <div style={{ marginTop: 8, color: "#dc2626", fontSize: 12 }}>Erro ao salvar. Verifique se o número da proposta já existe.</div>}
        </div>
      )}

      {/* Lista */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Carregando propostas...</div>
      ) : (data?.propostas ?? []).length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
          <Landmark size={32} style={{ marginBottom: 10 }} />
          <div>Nenhuma proposta encontrada.</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Clique em "Nova Proposta" ou use a importação para cadastrar.</div>
        </div>
      ) : (
        <div style={S.card}>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
            {data?.total ?? 0} proposta{(data?.total ?? 0) !== 1 ? "s" : ""} encontrada{(data?.total ?? 0) !== 1 ? "s" : ""}
          </div>
          {(data?.propostas ?? []).map((p: any) => (
            <PropostaRow key={p.id} proposta={p} onClick={() => onSelect(p)} />
          ))}
        </div>
      )}
    </div>
  );
}

function PropostaRow({ proposta: p, onClick }: { proposta: any; onClick: () => void }) {
  const perc_pago = p.valor_indicado > 0 ? (p.valor_pago / p.valor_indicado) * 100 : 0;
  const cor = perc_pago >= 75 ? "#059669" : perc_pago >= 40 ? "#d97706" : "#6b7280";
  return (
    <div onClick={onClick} style={{ padding: "14px 0", borderBottom: "1px solid #f3f4f6", cursor: "pointer" }}
      onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" as const }}>
            <span style={{ fontFamily: "monospace", fontSize: 11, background: "#f3f4f6", borderRadius: 4, padding: "1px 7px", color: "#374151", fontWeight: 700 }}>
              {p.numero_proposta}
            </span>
            <SituacaoBadge situacao={p.situacao_normalizada ?? ""} />
            {p.componente && (
              <span style={{ fontSize: 10, background: "#eff6ff", color: "#1d4ed8", borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>
                {p.componente}
              </span>
            )}
            {p.exercicio && (
              <span style={{ fontSize: 10, color: "#9ca3af" }}>{p.exercicio}</span>
            )}
            {p.total_alertas_abertos > 0 && (
              <span style={{ fontSize: 10, background: "#fef2f2", color: "#dc2626", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>
                <Bell size={9} /> {p.total_alertas_abertos}
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 2 }}>
            {p.entidade_nome || "Entidade não informada"}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>{p.objeto ?? "—"}</div>
          {p.parlamentar && (
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
              {p.parlamentar.nome} · {p.parlamentar.partido}/{p.parlamentar.uf}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" as const, marginLeft: 16, flexShrink: 0, minWidth: 110 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>{fmt(p.valor_indicado)}</div>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>indicado</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: cor, marginTop: 4 }}>{fmtPct(perc_pago)} pago</div>
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        <div style={{ height: 4, background: "#f3f4f6", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${Math.min(perc_pago, 100)}%`, height: "100%", background: cor, borderRadius: 2 }} />
        </div>
      </div>
    </div>
  );
}

// ── Detalhe da Proposta ───────────────────────────────────────────────────────
function DetalheProposta({ id, municipio_id, onVoltar }: { id: number; municipio_id: number; onSelect?: any; onVoltar: () => void }) {
  const [secoes, setSecoes] = useState<Record<string, boolean>>({
    execucao: true, objeto: false, entidade: false, digisus: false, unidades: false,
    naturezas: false, planos: false, pareceres: true, pagamentos: false, alertas: true,
    historico: true, atualizacoes: false,
  });
  const [addParecer, setAddParecer] = useState(false);
  const [addPagamento, setAddPagamento] = useState(false);
  const [addAtualizacao, setAddAtualizacao] = useState(false);
  const [atualizandoSituacao, setAtualizandoSituacao] = useState(false);
  const [novaSituacao, setNovaSituacao] = useState("");
  const [parecerForm, setParecerForm] = useState({
    area_responsavel: "", sigla_area: "", data_parecer: "", tipo: "merito",
    resultado: "pendente", texto: "", eh_diligencia: false, prazo_resposta: "",
  });
  const [pgForm, setPgForm] = useState({ ordem_bancaria: "", data_pagamento: "", valor: 0, parcela: 1 });
  const [atForm, setAtForm] = useState({ data_consulta: "", situacao_encontrada: "", observacoes: "" });
  const qc = useQueryClient();

  const { data: p, isLoading } = useQuery({
    queryKey: ["investsus-proposta", id],
    queryFn: () => api.get(`/api/investsus/propostas/${id}`).then(r => r.data),
  });

  const mutParecer = useMutation({
    mutationFn: (body: typeof parecerForm) => api.post(`/api/investsus/propostas/${id}/pareceres`, body).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["investsus-proposta", id] }); setAddParecer(false); },
  });

  const mutPagamento = useMutation({
    mutationFn: (body: typeof pgForm) => api.post(`/api/investsus/propostas/${id}/pagamentos`, body).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["investsus-proposta", id] }); setAddPagamento(false); },
  });

  const mutAtualizacao = useMutation({
    mutationFn: (body: typeof atForm) => api.post(`/api/investsus/propostas/${id}/atualizacoes`, body).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["investsus-proposta", id] }); setAddAtualizacao(false); },
  });

  const mutSituacao = useMutation({
    mutationFn: (s: string) => api.put(`/api/investsus/propostas/${id}`, { situacao_normalizada: s }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["investsus-proposta", id] }); setAtualizandoSituacao(false); },
  });

  const toggle = (k: string) => setSecoes(s => ({ ...s, [k]: !s[k] }));

  if (isLoading || !p) return <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Carregando...</div>;

  const secoesConfig = [
    { key: "execucao",    label: "Execução Física e Financeira" },
    { key: "objeto",      label: "Objeto e Finalidade" },
    { key: "entidade",    label: "Entidade Beneficiária" },
    { key: "digisus",     label: "DigiSUS / PAS" },
    { key: "unidades",    label: `Unidades Beneficiadas (${p.unidades?.length ?? 0})` },
    { key: "naturezas",   label: `Naturezas de Despesa (${p.naturezas_despesa?.length ?? 0})` },
    { key: "planos",      label: `Planos de Trabalho (${p.planos_trabalho?.length ?? 0})` },
    { key: "pareceres",   label: `Pareceres e Diligências (${p.pareceres?.length ?? 0})` },
    { key: "pagamentos",  label: `Pagamentos (${p.pagamentos?.length ?? 0})` },
    { key: "alertas",     label: `Alertas (${(p.alertas ?? []).filter((a: any) => !a.resolvido).length} abertos)` },
    { key: "historico",   label: "Linha do Tempo" },
    { key: "atualizacoes", label: `Atualizações Manuais (${p.atualizacoes?.length ?? 0})` },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button style={{ ...S.btn(), padding: "5px 10px" }} onClick={onVoltar}>← Voltar</button>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
            <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 800, color: "#1e3a5f" }}>{p.numero_proposta}</span>
            <SituacaoBadge situacao={p.situacao_normalizada ?? ""} />
            {p.componente && <span style={{ fontSize: 11, background: "#eff6ff", color: "#1d4ed8", borderRadius: 4, padding: "2px 7px", fontWeight: 700 }}>{p.componente}</span>}
            {p.exercicio && <span style={{ fontSize: 11, color: "#9ca3af" }}>Exercício {p.exercicio}</span>}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>{p.entidade_nome}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button style={S.btn("#1e3a5f")} onClick={() => setAtualizandoSituacao(v => !v)}>
            <RefreshCw size={12} /> Atualizar Situação
          </button>
          <button style={S.btn("#059669")} onClick={() => setAddAtualizacao(v => !v)}>
            <Calendar size={12} /> Registrar Consulta
          </button>
        </div>
      </div>

      {/* Valores */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
        <KPICard label="Indicado"   valor={fmt(p.valor_indicado)}  cor={CORES.indicado} />
        <KPICard label="Aprovado"   valor={fmt(p.valor_aprovado)}  cor={CORES.aprovado} />
        <KPICard label="Empenhado"  valor={fmt(p.valor_empenhado)} cor={CORES.pago} />
        <KPICard label="Pago"       valor={fmt(p.valor_pago)}      cor={CORES.executado} />
      </div>

      {/* Situação original */}
      {p.situacao_original && (
        <div style={{ ...S.card, background: "#f0fdf4", borderLeft: "4px solid #059669", marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#065f46", fontWeight: 700, marginBottom: 2 }}>Situação InvestSUS (original)</div>
          <div style={{ fontSize: 13, color: "#065f46" }}>{p.situacao_original}</div>
          {p.ultima_consulta_investsus && (
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Última consulta: {p.ultima_consulta_investsus}</div>
          )}
        </div>
      )}

      {/* Atualizar situação inline */}
      {atualizandoSituacao && (
        <div style={{ ...S.card, background: "#f9fafb", borderLeft: "3px solid #1e3a5f", marginBottom: 14 }}>
          <div style={S.title}>Atualizar Situação Normalizada</div>
          <select style={{ ...S.input, marginBottom: 10 }} value={novaSituacao} onChange={e => setNovaSituacao(e.target.value)}>
            <option value="">Selecione...</option>
            {Object.entries(SITUACAO_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={S.btn("#1e3a5f")} onClick={() => novaSituacao && mutSituacao.mutate(novaSituacao)} disabled={!novaSituacao}>
              <Check size={12} /> Salvar
            </button>
            <button style={S.btn()} onClick={() => setAtualizandoSituacao(false)}><X size={12} /> Cancelar</button>
          </div>
        </div>
      )}

      {/* Registrar consulta manual */}
      {addAtualizacao && (
        <div style={{ ...S.card, background: "#f9fafb", borderLeft: "3px solid #059669", marginBottom: 14 }}>
          <div style={S.title}>Registrar Consulta ao InvestSUS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={S.label}>Data da Consulta</label>
              <input type="date" style={S.input} value={atForm.data_consulta} onChange={e => setAtForm(f => ({ ...f, data_consulta: e.target.value }))} />
            </div>
            <div>
              <label style={S.label}>Situação Encontrada (texto do InvestSUS)</label>
              <input style={S.input} value={atForm.situacao_encontrada} onChange={e => setAtForm(f => ({ ...f, situacao_encontrada: e.target.value }))} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={S.label}>Observações</label>
            <textarea style={{ ...S.input, minHeight: 50, resize: "vertical" as const }}
              value={atForm.observacoes} onChange={e => setAtForm(f => ({ ...f, observacoes: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={S.btn("#059669")} onClick={() => mutAtualizacao.mutate(atForm)}>
              {mutAtualizacao.isPending ? "Salvando..." : <><Check size={12} /> Registrar</>}
            </button>
            <button style={S.btn()} onClick={() => setAddAtualizacao(false)}><X size={12} /> Cancelar</button>
          </div>
        </div>
      )}

      {/* Verificações de consistência */}
      {(p.verificacoes ?? []).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {p.verificacoes.map((v: any, i: number) => (
            <div key={i} style={{ ...S.card, borderLeft: `4px solid ${v.nivel === "critico" ? "#dc2626" : "#d97706"}`, background: v.nivel === "critico" ? "#fef2f2" : "#fffbeb", marginBottom: 6 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
                <AlertTriangle size={13} color={v.nivel === "critico" ? "#dc2626" : "#d97706"} />
                {v.msg}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Seções expansíveis */}
      {secoesConfig.map(({ key, label }) => (
        <div key={key} style={S.card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
            onClick={() => toggle(key)}>
            <div style={{ ...S.title, marginBottom: 0 }}>{label}</div>
            {secoes[key] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          {secoes[key] && (
            <div style={{ marginTop: 14 }}>
              {key === "execucao" && <SecaoExecucao p={p} proposta_id={id} />}
              {key === "objeto" && <SecaoObjeto p={p} />}
              {key === "entidade" && <SecaoEntidade p={p} />}
              {key === "digisus" && <SecaoDigiSUS p={p} />}
              {key === "unidades" && <SecaoUnidades p={p} />}
              {key === "naturezas" && <SecaoNaturezas p={p} />}
              {key === "planos" && <SecaoPlanos p={p} proposta_id={id} />}
              {key === "pareceres" && (
                <>
                  <SecaoPareceres p={p} />
                  <button style={{ ...S.btn("#7c3aed"), marginTop: 10 }} onClick={() => setAddParecer(v => !v)}>
                    <Plus size={12} /> Adicionar Parecer / Diligência
                  </button>
                  {addParecer && (
                    <div style={{ marginTop: 12, background: "#f9fafb", borderRadius: 8, padding: 12 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                        <div>
                          <label style={S.label}>Área Responsável</label>
                          <input style={S.input} value={parecerForm.area_responsavel}
                            onChange={e => setParecerForm(f => ({ ...f, area_responsavel: e.target.value }))} />
                        </div>
                        <div>
                          <label style={S.label}>Data do Parecer</label>
                          <input type="date" style={S.input} value={parecerForm.data_parecer}
                            onChange={e => setParecerForm(f => ({ ...f, data_parecer: e.target.value }))} />
                        </div>
                        <div>
                          <label style={S.label}>Resultado</label>
                          <select style={S.input} value={parecerForm.resultado}
                            onChange={e => setParecerForm(f => ({ ...f, resultado: e.target.value }))}>
                            <option value="pendente">Pendente</option>
                            <option value="favoravel">Favorável</option>
                            <option value="desfavoravel">Desfavorável</option>
                            <option value="diligencia">Diligência</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label style={S.label}>Texto do Parecer</label>
                        <textarea style={{ ...S.input, minHeight: 60, resize: "vertical" as const }}
                          value={parecerForm.texto} onChange={e => setParecerForm(f => ({ ...f, texto: e.target.value }))} />
                      </div>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, marginBottom: 10, cursor: "pointer" }}>
                        <input type="checkbox" checked={parecerForm.eh_diligencia}
                          onChange={e => setParecerForm(f => ({ ...f, eh_diligencia: e.target.checked, resultado: e.target.checked ? "diligencia" : f.resultado }))} />
                        É uma Diligência (aguarda complementação)
                      </label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button style={S.btn("#7c3aed")} onClick={() => mutParecer.mutate(parecerForm)}>
                          {mutParecer.isPending ? "Salvando..." : <><Check size={12} /> Salvar</>}
                        </button>
                        <button style={S.btn()} onClick={() => setAddParecer(false)}><X size={12} /> Cancelar</button>
                      </div>
                    </div>
                  )}
                </>
              )}
              {key === "pagamentos" && (
                <>
                  <SecaoPagamentos p={p} />
                  <button style={{ ...S.btn("#059669"), marginTop: 10 }} onClick={() => setAddPagamento(v => !v)}>
                    <Plus size={12} /> Registrar Pagamento
                  </button>
                  {addPagamento && (
                    <div style={{ marginTop: 12, background: "#f9fafb", borderRadius: 8, padding: 12 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                        <div>
                          <label style={S.label}>Ordem Bancária</label>
                          <input style={S.input} value={pgForm.ordem_bancaria}
                            onChange={e => setPgForm(f => ({ ...f, ordem_bancaria: e.target.value }))} />
                        </div>
                        <div>
                          <label style={S.label}>Data do Pagamento</label>
                          <input type="date" style={S.input} value={pgForm.data_pagamento}
                            onChange={e => setPgForm(f => ({ ...f, data_pagamento: e.target.value }))} />
                        </div>
                        <div>
                          <label style={S.label}>Valor (R$)</label>
                          <input type="number" step="0.01" style={S.input} value={pgForm.valor}
                            onChange={e => setPgForm(f => ({ ...f, valor: Number(e.target.value) }))} />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button style={S.btn("#059669")} onClick={() => mutPagamento.mutate(pgForm)}>
                          {mutPagamento.isPending ? "Salvando..." : <><Check size={12} /> Salvar</>}
                        </button>
                        <button style={S.btn()} onClick={() => setAddPagamento(false)}><X size={12} /> Cancelar</button>
                      </div>
                    </div>
                  )}
                </>
              )}
              {key === "alertas" && <SecaoAlertas p={p} proposta_id={id} />}
              {key === "historico" && <SecaoHistorico p={p} />}
              {key === "atualizacoes" && <SecaoAtualizacoes p={p} />}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Seções internas da proposta ───────────────────────────────────────────────

function SecaoExecucao({ p, proposta_id }: { p: any; proposta_id: number }) {
  const qc = useQueryClient();
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    valor_executado: p.valor_executado ?? 0,
    saldo_bancario: p.saldo_bancario ?? 0,
    rendimentos: p.rendimentos ?? 0,
    perc_fisico: p.perc_fisico ?? 0,
    perc_financeiro: p.perc_financeiro ?? 0,
  });
  const salvar = useMutation({
    mutationFn: (body: typeof form) => api.put(`/api/investsus/propostas/${proposta_id}`, body).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["investsus-proposta", proposta_id] }); setEditando(false); },
  });

  const perc_exec = p.valor_pago > 0 ? (p.valor_executado / p.valor_pago) * 100 : 0;
  const perc_fisico = p.perc_fisico ?? 0;
  const perc_fin = p.perc_financeiro ?? 0;

  return (
    <div>
      {/* Barras de progresso */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 700 }}>EXECUÇÃO FINANCEIRA</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: perc_exec >= 80 ? "#059669" : perc_exec >= 40 ? "#d97706" : "#dc2626" }}>{fmtPct(perc_exec)}</span>
          </div>
          <div style={{ height: 10, background: "#f3f4f6", borderRadius: 5, overflow: "hidden" }}>
            <div style={{ width: `${Math.min(perc_exec, 100)}%`, height: "100%", background: perc_exec >= 80 ? "#059669" : perc_exec >= 40 ? "#d97706" : "#dc2626", borderRadius: 5 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: "#6b7280" }}>
            <span>Executado: {fmt(p.valor_executado)}</span>
            <span>Pago: {fmt(p.valor_pago)}</span>
          </div>
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 700 }}>EXECUÇÃO FÍSICA</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: perc_fisico >= 80 ? "#059669" : perc_fisico >= 40 ? "#d97706" : "#6b7280" }}>{fmtPct(perc_fisico)}</span>
          </div>
          <div style={{ height: 10, background: "#f3f4f6", borderRadius: 5, overflow: "hidden" }}>
            <div style={{ width: `${Math.min(perc_fisico, 100)}%`, height: "100%", background: perc_fisico >= 80 ? "#059669" : perc_fisico >= 40 ? "#d97706" : "#6b7280", borderRadius: 5 }} />
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Percentual físico informado</div>
        </div>
      </div>

      {/* Grid de valores */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
        {[
          { label: "Valor Executado",  valor: p.valor_executado,  cor: "#059669" },
          { label: "Saldo Bancário",   valor: p.saldo_bancario,   cor: "#0284c7" },
          { label: "Rendimentos",      valor: p.rendimentos,      cor: "#7c3aed" },
          { label: "Saldo a Executar", valor: p.saldo_executar,   cor: p.saldo_executar > 0 ? "#d97706" : "#059669" },
        ].map(({ label, valor, cor }) => (
          <div key={label} style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 12px", borderTop: `3px solid ${cor}` }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: cor }}>{fmt(valor ?? 0)}</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Botão editar / form inline */}
      {!editando ? (
        <button style={S.btn("#1e3a5f")} onClick={() => setEditando(true)}>
          <RefreshCw size={12} /> Atualizar Execução
        </button>
      ) : (
        <div style={{ background: "#f9fafb", borderRadius: 8, padding: 12 }}>
          <div style={{ ...S.title, marginBottom: 12 }}>Atualizar Execução</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 10 }}>
            {([
              ["valor_executado", "Valor Executado (R$)"],
              ["saldo_bancario",  "Saldo Bancário (R$)"],
              ["rendimentos",     "Rendimentos (R$)"],
              ["perc_fisico",     "% Físico (0-100)"],
              ["perc_financeiro", "% Financeiro (0-100)"],
            ] as [string, string][]).map(([k, lbl]) => (
              <div key={k}>
                <label style={S.label}>{lbl}</label>
                <input type="number" step="0.01" style={S.input} value={(form as any)[k]}
                  onChange={e => setForm(f => ({ ...f, [k]: Number(e.target.value) }))} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={S.btn("#059669")} onClick={() => salvar.mutate(form)}>
              {salvar.isPending ? "Salvando..." : <><Check size={12} /> Salvar</>}
            </button>
            <button style={S.btn()} onClick={() => setEditando(false)}><X size={12} /> Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SecaoPlanos({ p, proposta_id }: { p: any; proposta_id: number }) {
  const qc = useQueryClient();
  const [addPlano, setAddPlano] = useState(false);
  const [addAcao, setAddAcao] = useState<number | null>(null);
  const [planoForm, setPlanoForm] = useState({ versao: "1", objeto: "", valor_indicado: 0, data_elaboracao: "", responsavel: "", situacao: "elaboracao" });
  const [acaoForm, setAcaoForm] = useState({ categoria: "", descricao: "", tipo: "servico", meta_quantitativa: 0, unidade_medida: "", valor: 0, situacao_execucao: "nao_iniciada" });

  const mutPlano = useMutation({
    mutationFn: (b: typeof planoForm) => api.post(`/api/investsus/propostas/${proposta_id}/planos`, b).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["investsus-proposta", proposta_id] }); setAddPlano(false); },
  });
  const mutAcao = useMutation({
    mutationFn: ({ plano_id, body }: { plano_id: number; body: typeof acaoForm }) =>
      api.post(`/api/investsus/planos/${plano_id}/acoes`, body).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["investsus-proposta", proposta_id] }); setAddAcao(null); },
  });

  const planos: any[] = p.planos_trabalho ?? [];
  const SIT_LABEL: Record<string, string> = { elaboracao: "Em Elaboração", enviado: "Enviado", aprovado: "Aprovado", reprovado: "Reprovado", em_execucao: "Em Execução", concluido: "Concluído" };
  const EXEC_LABEL: Record<string, string> = { nao_iniciada: "Não Iniciada", em_andamento: "Em Andamento", concluida: "Concluída", cancelada: "Cancelada" };

  return (
    <div>
      {!planos.length && !addPlano && (
        <div style={{ color: "#9ca3af", fontSize: 13, marginBottom: 10 }}>Nenhum plano de trabalho cadastrado.</div>
      )}
      {planos.map((pt: any) => (
        <div key={pt.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Versão {pt.versao}</span>
              <span style={{ fontSize: 11, background: "#f0fdf4", color: "#059669", borderRadius: 4, padding: "1px 6px", marginLeft: 8, fontWeight: 700 }}>{SIT_LABEL[pt.situacao] ?? pt.situacao}</span>
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", textAlign: "right" as const }}>
              <div>{fmt(pt.valor_indicado)}</div>
              {pt.data_aprovacao && <div>Aprovado: {pt.data_aprovacao}</div>}
            </div>
          </div>
          {pt.objeto && <div style={{ fontSize: 12, color: "#374151", marginBottom: 10 }}>{pt.objeto}</div>}
          {/* Ações */}
          {(pt.acoes ?? []).length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Categoria", "Descrição", "Meta", "Valor", "Execução"].map(h => (
                    <th key={h} style={{ padding: "4px 6px", textAlign: "left" as const, color: "#6b7280", fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(pt.acoes ?? []).map((ac: any) => (
                  <tr key={ac.id}>
                    <td style={{ padding: "4px 6px" }}>{ac.categoria}</td>
                    <td style={{ padding: "4px 6px" }}>{ac.descricao}</td>
                    <td style={{ padding: "4px 6px" }}>{ac.meta_quantitativa} {ac.unidade_medida}</td>
                    <td style={{ padding: "4px 6px", textAlign: "right" as const }}>{fmt(ac.valor)}</td>
                    <td style={{ padding: "4px 6px" }}>
                      <span style={{ fontSize: 10, background: "#f3f4f6", borderRadius: 3, padding: "1px 5px" }}>{EXEC_LABEL[ac.situacao_execucao] ?? ac.situacao_execucao}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <button style={{ ...S.btn(), marginTop: 8, fontSize: 11 }} onClick={() => setAddAcao(pt.id)}>
            <Plus size={11} /> Adicionar Ação/Meta
          </button>
          {addAcao === pt.id && (
            <div style={{ marginTop: 10, background: "#f9fafb", borderRadius: 6, padding: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div><label style={S.label}>Categoria</label>
                  <select style={S.input} value={acaoForm.categoria} onChange={e => setAcaoForm(f => ({ ...f, categoria: e.target.value }))}>
                    <option value="">—</option>
                    <option value="capacitacao">Capacitação</option>
                    <option value="equipamento">Equipamento</option>
                    <option value="obra">Obra/Reforma</option>
                    <option value="servico">Serviço</option>
                    <option value="material">Material</option>
                  </select>
                </div>
                <div><label style={S.label}>Meta Quantitativa</label>
                  <input type="number" style={S.input} value={acaoForm.meta_quantitativa} onChange={e => setAcaoForm(f => ({ ...f, meta_quantitativa: Number(e.target.value) }))} />
                </div>
                <div><label style={S.label}>Unidade de Medida</label>
                  <input style={S.input} value={acaoForm.unidade_medida} onChange={e => setAcaoForm(f => ({ ...f, unidade_medida: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={S.label}>Descrição</label>
                <input style={S.input} value={acaoForm.descricao} onChange={e => setAcaoForm(f => ({ ...f, descricao: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={S.btn("#059669")} onClick={() => mutAcao.mutate({ plano_id: pt.id, body: acaoForm })}>
                  {mutAcao.isPending ? "..." : <><Check size={11} /> Salvar</>}
                </button>
                <button style={S.btn()} onClick={() => setAddAcao(null)}><X size={11} /></button>
              </div>
            </div>
          )}
        </div>
      ))}

      <button style={S.btn("#1e3a5f")} onClick={() => setAddPlano(v => !v)}>
        <Plus size={12} /> Novo Plano de Trabalho
      </button>
      {addPlano && (
        <div style={{ marginTop: 12, background: "#f9fafb", borderRadius: 8, padding: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div><label style={S.label}>Versão</label>
              <input style={S.input} value={planoForm.versao} onChange={e => setPlanoForm(f => ({ ...f, versao: e.target.value }))} />
            </div>
            <div><label style={S.label}>Data Elaboração</label>
              <input type="date" style={S.input} value={planoForm.data_elaboracao} onChange={e => setPlanoForm(f => ({ ...f, data_elaboracao: e.target.value }))} />
            </div>
            <div><label style={S.label}>Valor Indicado (R$)</label>
              <input type="number" step="0.01" style={S.input} value={planoForm.valor_indicado} onChange={e => setPlanoForm(f => ({ ...f, valor_indicado: Number(e.target.value) }))} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={S.label}>Objeto do Plano</label>
            <textarea style={{ ...S.input, minHeight: 50, resize: "vertical" as const }} value={planoForm.objeto} onChange={e => setPlanoForm(f => ({ ...f, objeto: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={S.btn("#1e3a5f")} onClick={() => mutPlano.mutate(planoForm)}>
              {mutPlano.isPending ? "Salvando..." : <><Check size={12} /> Salvar</>}
            </button>
            <button style={S.btn()} onClick={() => setAddPlano(false)}><X size={12} /> Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({ label, valor }: { label: string; valor: any }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 13, color: "#111827", marginTop: 2 }}>{valor ?? <span style={{ color: "#d1d5db" }}>—</span>}</div>
    </div>
  );
}

function SecaoObjeto({ p }: { p: any }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
      <div style={{ gridColumn: "1 / -1" }}><Campo label="Objeto" valor={p.objeto} /></div>
      <Campo label="Finalidade" valor={p.finalidade} />
      <Campo label="Tipo do Objeto" valor={p.tipo_objeto} />
      <Campo label="Modalidade de Transferência" valor={p.modalidade_transferencia} />
      <Campo label="Bloco de Financiamento" valor={p.bloco_financiamento} />
      <Campo label="Componente (PAP/MAC)" valor={p.componente} />
      <Campo label="Tipo de Financiamento" valor={p.tipo_financiamento} />
      <Campo label="Ação Orçamentária" valor={p.acao_orcamentaria} />
      <Campo label="Portaria" valor={p.portaria_numero ? `${p.portaria_numero} (${p.portaria_data ?? "sem data"})` : null} />
      <Campo label="Empenho" valor={p.empenho_numero ? `${p.empenho_numero} (${p.empenho_data ?? "sem data"})` : null} />
      <Campo label="Conta Bancária" valor={p.conta_bancaria} />
      <Campo label="Responsável Interno" valor={p.responsavel_interno} />
      <Campo label="Prazo de Vigência" valor={p.prazo_vigencia} />
      <Campo label="Fonte do Dado" valor={p.fonte_dado} />
    </div>
  );
}

function SecaoEntidade({ p }: { p: any }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
      <div style={{ gridColumn: "1 / -1" }}><Campo label="Entidade" valor={p.entidade_nome} /></div>
      <Campo label="CNPJ" valor={p.entidade_cnpj} />
      <Campo label="Município" valor={p.entidade_municipio ? `${p.entidade_municipio}/${p.entidade_uf}` : null} />
      <Campo label="Esfera Administrativa" valor={p.entidade_esfera} />
      <Campo label="Natureza Jurídica" valor={p.entidade_natureza_juridica} />
      <Campo label="Fundo de Saúde" valor={p.fundo_saude} />
      <Campo label="Responsável Legal" valor={p.responsavel_legal} />
      <Campo label="Situação Cadastral" valor={p.situacao_cadastral} />
      <Campo label="Situação Habilitação" valor={p.situacao_habilitacao} />
    </div>
  );
}

function SecaoDigiSUS({ p }: { p: any }) {
  const temVinculacao = p.digisus_diretriz || p.digisus_objetivo || p.digisus_meta;
  return (
    <div>
      {!temVinculacao && (
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 12, color: "#92400e" }}>
          <AlertTriangle size={13} style={{ marginRight: 5 }} />
          Proposta sem vinculação à Programação Anual de Saúde (DigiSUS). Preencha as informações abaixo para regularizar.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <Campo label="Exercício da PAS" valor={p.digisus_exercicio} />
        <Campo label="Situação da Vinculação" valor={p.digisus_situacao_vinculacao} />
        <Campo label="Verificado em" valor={p.digisus_verificado_em ? `${p.digisus_verificado_em} por ${p.digisus_verificado_por ?? "—"}` : null} />
        <div style={{ gridColumn: "1 / -1" }}><Campo label="Diretriz" valor={p.digisus_diretriz} /></div>
        <div style={{ gridColumn: "1 / -1" }}><Campo label="Objetivo" valor={p.digisus_objetivo} /></div>
        <div style={{ gridColumn: "1 / -1" }}><Campo label="Meta" valor={p.digisus_meta} /></div>
        <Campo label="Indicador" valor={p.digisus_indicador} />
        <Campo label="Ação Vinculada" valor={p.digisus_acao} />
        <div style={{ gridColumn: "1 / -1" }}><Campo label="Justificativa de Compatibilidade" valor={p.digisus_justificativa} /></div>
      </div>
    </div>
  );
}

function SecaoUnidades({ p }: { p: any }) {
  if (!(p.unidades ?? []).length) return <div style={{ color: "#9ca3af", fontSize: 13 }}>Nenhuma unidade cadastrada.</div>;
  return (
    <div>
      {(p.unidades ?? []).map((u: any) => (
        <div key={u.id} style={{ padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{u.nome_estabelecimento}</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>CNES: {u.cnes ?? "—"} · {u.municipio ?? "—"} · {u.tipo_estabelecimento ?? "—"}</div>
              {u.objeto_destinado && <div style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>{u.objeto_destinado}</div>}
            </div>
            <div style={{ textAlign: "right" as const }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1e3a5f" }}>{fmt(u.valor_destinado)}</div>
              {p.valor_aprovado > 0 && (
                <div style={{ fontSize: 11, color: "#6b7280" }}>
                  {((u.valor_destinado / p.valor_aprovado) * 100).toFixed(1)}%
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SecaoNaturezas({ p }: { p: any }) {
  if (!(p.naturezas_despesa ?? []).length) return <div style={{ color: "#9ca3af", fontSize: 13 }}>Nenhuma natureza cadastrada.</div>;
  return (
    <div style={{ overflowX: "auto" as const }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "#f9fafb" }}>
            {["Código", "Descrição", "Previsto", "Empenhado", "Liquidado", "Pago", "Saldo"].map(h => (
              <th key={h} style={{ padding: "6px 8px", textAlign: "left" as const, color: "#6b7280", fontWeight: 700, borderBottom: "1px solid #e5e7eb", fontSize: 11 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(p.naturezas_despesa ?? []).map((nd: any) => (
            <tr key={nd.id}>
              <td style={{ padding: "6px 8px", fontFamily: "monospace", fontWeight: 700, color: "#374151" }}>{nd.codigo}</td>
              <td style={{ padding: "6px 8px", color: "#374151" }}>{nd.descricao}</td>
              <td style={{ padding: "6px 8px", textAlign: "right" as const }}>{fmt(nd.valor_previsto)}</td>
              <td style={{ padding: "6px 8px", textAlign: "right" as const }}>{fmt(nd.valor_empenhado_municipio)}</td>
              <td style={{ padding: "6px 8px", textAlign: "right" as const }}>{fmt(nd.valor_liquidado)}</td>
              <td style={{ padding: "6px 8px", textAlign: "right" as const, fontWeight: 700, color: "#059669" }}>{fmt(nd.valor_pago)}</td>
              <td style={{ padding: "6px 8px", textAlign: "right" as const, color: nd.saldo > 0 ? "#d97706" : "#059669" }}>{fmt(nd.saldo)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SecaoPareceres({ p }: { p: any }) {
  if (!(p.pareceres ?? []).length) return <div style={{ color: "#9ca3af", fontSize: 13 }}>Nenhum parecer registrado.</div>;
  return (
    <div>
      {[...(p.pareceres ?? [])].sort((a: any, b: any) => (a.data_parecer ?? "").localeCompare(b.data_parecer ?? "")).map((pa: any) => {
        const res_cor = pa.resultado === "favoravel" ? "#059669" : pa.resultado === "diligencia" ? "#d97706" : pa.resultado === "desfavoravel" ? "#dc2626" : "#6b7280";
        const res_label = { favoravel: "Favorável", desfavoravel: "Desfavorável", diligencia: "Diligência", pendente: "Pendente" }[pa.resultado] ?? pa.resultado;
        return (
          <div key={pa.id} style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${res_cor}30`, background: `${res_cor}08`, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: res_cor }}>{res_label.toUpperCase()}</span>
                {pa.eh_diligencia && <span style={{ fontSize: 10, background: "#fef3c7", color: "#92400e", borderRadius: 4, padding: "1px 5px", marginLeft: 6, fontWeight: 700 }}>DILIGÊNCIA</span>}
                <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 8 }}>{pa.sigla_area ?? pa.area_responsavel}</span>
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>{pa.data_parecer}</div>
            </div>
            {pa.texto && <div style={{ fontSize: 12, color: "#374151" }}>{pa.texto}</div>}
            {pa.prazo_resposta && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Prazo resposta: {pa.prazo_resposta}</div>}
          </div>
        );
      })}
    </div>
  );
}

function SecaoPagamentos({ p }: { p: any }) {
  if (!(p.pagamentos ?? []).length) return <div style={{ color: "#9ca3af", fontSize: 13 }}>Nenhum pagamento registrado.</div>;
  return (
    <div>
      {(p.pagamentos ?? []).map((pg: any) => (
        <div key={pg.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6", fontSize: 12 }}>
          <div>
            <span style={{ fontWeight: 700 }}>{pg.ordem_bancaria ?? "OB não informada"}</span>
            {pg.parcela && <span style={{ color: "#6b7280", marginLeft: 6 }}>Parcela {pg.parcela}</span>}
            <div style={{ color: "#9ca3af" }}>{pg.data_pagamento}</div>
          </div>
          <div style={{ fontWeight: 800, color: "#059669", fontSize: 14 }}>{fmt(pg.valor)}</div>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, paddingTop: 8, borderTop: "2px solid #e5e7eb" }}>
        <span style={{ fontWeight: 800, fontSize: 14 }}>Total: {fmt((p.pagamentos ?? []).reduce((a: number, x: any) => a + x.valor, 0))}</span>
      </div>
    </div>
  );
}

function SecaoAlertas({ p, proposta_id }: { p: any; proposta_id: number }) {
  const qc = useQueryClient();
  const resolver = useMutation({
    mutationFn: (id: number) => api.post(`/api/investsus/alertas/${id}/resolver`, {}).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investsus-proposta", proposta_id] }),
  });

  const alertas = (p.alertas ?? []).filter((a: any) => !a.resolvido);
  if (!alertas.length) return <div style={{ color: "#9ca3af", fontSize: 13 }}>Nenhum alerta aberto.</div>;

  return (
    <div>
      {alertas.map((al: any) => {
        const nivel = NIVEL_ALERTA[al.nivel] ?? NIVEL_ALERTA.atencao;
        return (
          <div key={al.id} style={{ borderLeft: `4px solid ${nivel.cor}`, background: `${nivel.cor}10`, borderRadius: 6, padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <NivelBadge nivel={al.nivel} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{al.titulo}</span>
                </div>
                {al.descricao && <div style={{ fontSize: 12, color: "#374151" }}>{al.descricao}</div>}
                {al.providencia && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Providência: {al.providencia}</div>}
                {al.prazo && <div style={{ fontSize: 11, color: "#9ca3af" }}>Prazo: {al.prazo}</div>}
              </div>
              <button style={{ ...S.btn("#059669"), fontSize: 11, padding: "4px 8px", flexShrink: 0 }} onClick={() => resolver.mutate(al.id)}>
                <Check size={11} /> Resolver
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SecaoHistorico({ p }: { p: any }) {
  if (!(p.historico ?? []).length) return <div style={{ color: "#9ca3af", fontSize: 13 }}>Sem histórico.</div>;
  return (
    <div style={{ position: "relative" as const }}>
      {[...(p.historico ?? [])].reverse().map((h: any, i: number) => (
        <div key={h.id} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: i === 0 ? "#059669" : "#d1d5db", flexShrink: 0, marginTop: 3 }} />
            {i < (p.historico ?? []).length - 1 && <div style={{ width: 2, flex: 1, background: "#e5e7eb", marginTop: 3 }} />}
          </div>
          <div style={{ flex: 1, paddingBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{h.situacao_nova}</div>
            {h.situacao_anterior && <div style={{ fontSize: 11, color: "#9ca3af" }}>De: {h.situacao_anterior}</div>}
            {h.observacao && <div style={{ fontSize: 11, color: "#374151", marginTop: 2 }}>{h.observacao}</div>}
            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
              {h.data_evento?.substring(0, 10)} · {h.usuario ?? "sistema"} · {h.origem}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SecaoAtualizacoes({ p }: { p: any }) {
  if (!(p.atualizacoes ?? []).length) return <div style={{ color: "#9ca3af", fontSize: 13 }}>Nenhuma atualização manual registrada.</div>;
  return (
    <div>
      {(p.atualizacoes ?? []).map((at: any) => (
        <div key={at.id} style={{ padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Consulta em {at.data_consulta}</div>
              {at.situacao_encontrada && <div style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>Situação: {at.situacao_encontrada}</div>}
              {at.situacao_anterior && <div style={{ fontSize: 11, color: "#9ca3af" }}>Anterior: {at.situacao_anterior}</div>}
              {at.observacoes && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{at.observacoes}</div>}
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "right" as const }}>
              <div>{at.responsavel}</div>
              <div>{at.origem}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Alertas globais ───────────────────────────────────────────────────────────
function AlertasGlobais({ municipio_id }: { municipio_id: number }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["investsus-alertas", municipio_id],
    queryFn: () => api.get(`/api/investsus/alertas?municipio_id=${municipio_id}&apenas_abertos=true`).then(r => r.data),
  });
  const qc = useQueryClient();
  const resolver = useMutation({
    mutationFn: (id: number) => api.post(`/api/investsus/alertas/${id}/resolver`, {}).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investsus-alertas"] }),
  });

  if (isLoading) return <div style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>Carregando alertas...</div>;
  if (!data.length) return (
    <div style={{ ...S.card, textAlign: "center", padding: 40 }}>
      <CheckCircle2 size={32} color="#059669" style={{ marginBottom: 10 }} />
      <div style={{ color: "#059669", fontWeight: 700 }}>Nenhum alerta aberto</div>
    </div>
  );

  const ordenados = [...data].sort((a: any, b: any) => {
    const ordem = { critico: 0, urgente: 1, atencao: 2, informativo: 3 };
    return (ordem[a.nivel as keyof typeof ordem] ?? 3) - (ordem[b.nivel as keyof typeof ordem] ?? 3);
  });

  return (
    <div>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>{data.length} alerta{data.length !== 1 ? "s" : ""} aberto{data.length !== 1 ? "s" : ""}</div>
      {ordenados.map((al: any) => {
        const nivel = NIVEL_ALERTA[al.nivel] ?? NIVEL_ALERTA.atencao;
        return (
          <div key={al.id} style={{ ...S.card, borderLeft: `4px solid ${nivel.cor}`, background: `${nivel.cor}08`, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <NivelBadge nivel={al.nivel} />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{al.titulo}</span>
                </div>
                {al.descricao && <div style={{ fontSize: 12, color: "#374151", marginBottom: 4 }}>{al.descricao}</div>}
                {al.providencia && <div style={{ fontSize: 12, color: "#6b7280" }}>Providência: {al.providencia}</div>}
                {al.prazo && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>Prazo: {al.prazo}</div>}
              </div>
              <button style={{ ...S.btn("#059669"), fontSize: 11, padding: "5px 10px", flexShrink: 0 }} onClick={() => resolver.mutate(al.id)}>
                <Check size={11} /> Resolver
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Importação Assistida ──────────────────────────────────────────────────────
function ImportacaoAssistida({ municipio_id }: { municipio_id: number }) {
  const [etapa, setEtapa] = useState<"upload" | "preview" | "confirmar" | "resultado">("upload");
  const [preview, setPreview] = useState<any[]>([]);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [resultado, setResultado] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const processarArquivo = async (file: File) => {
    const texto = await file.text();
    const linhas = texto.split("\n").filter(l => l.trim());
    if (!linhas.length) return;

    const sep = linhas[0].includes(";") ? ";" : ",";
    const headers = linhas[0].split(sep).map(h => h.replace(/"/g, "").trim());
    const rows = linhas.slice(1).map(linha => {
      const valores = linha.split(sep).map(v => v.replace(/"/g, "").trim());
      return Object.fromEntries(headers.map((h, i) => [h, valores[i] ?? ""]));
    });

    const resp = await api.post("/api/investsus/importar/preview", rows).then(r => r.data);
    setPreview(resp.preview ?? []);
    setSelecionados(new Set(resp.preview.filter((r: any) => !r.ja_existe).map((_: any, i: number) => i)));
    setEtapa("preview");
  };

  const confirmarImportacao = async () => {
    const rows = preview
      .filter((_, i) => selecionados.has(i))
      .map(r => ({ ...r._row_original, sobrescrever: r.ja_existe }));

    const resp = await api.post("/api/investsus/importar/confirmar", rows).then(r => r.data);
    setResultado(resp);
    setEtapa("resultado");
    qc.invalidateQueries({ queryKey: ["investsus"] });
  };

  return (
    <div>
      {etapa === "upload" && (
        <div style={{ ...S.card, textAlign: "center", padding: 40 }}>
          <Upload size={40} color="#1e3a5f" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Importação Assistida</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20, maxWidth: 500, margin: "0 auto 20px" }}>
            Importe dados do InvestSUS via arquivo CSV ou XLSX. O sistema apresentará um preview com validações antes de confirmar.
          </div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>
            Colunas aceitas: numero_proposta, objeto, valor_indicado, valor_aprovado, valor_empenhado, valor_pago, situacao_original, entidade_nome, exercicio, numero_emenda
          </div>
          <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: "none" }}
            onChange={e => e.target.files?.[0] && processarArquivo(e.target.files[0])} />
          <button style={S.btn("#1e3a5f")} onClick={() => fileRef.current?.click()}>
            <Upload size={14} /> Selecionar arquivo CSV
          </button>
        </div>
      )}

      {etapa === "preview" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 700 }}>Preview — {preview.length} linha{preview.length !== 1 ? "s" : ""}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btn()} onClick={() => setEtapa("upload")}><X size={12} /> Cancelar</button>
              <button style={S.btn("#059669")} onClick={confirmarImportacao} disabled={selecionados.size === 0}>
                <Check size={12} /> Importar {selecionados.size} selecionado{selecionados.size !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
          <div style={{ overflowX: "auto" as const }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ padding: "6px 8px", width: 36 }}>
                    <input type="checkbox" checked={selecionados.size === preview.length}
                      onChange={e => setSelecionados(e.target.checked ? new Set(preview.map((_, i) => i)) : new Set())} />
                  </th>
                  {["Nº Proposta", "Objeto", "Valor", "Situação", "Status"].map(h => (
                    <th key={h} style={{ padding: "6px 8px", textAlign: "left" as const, fontSize: 11, color: "#6b7280", fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} style={{ background: r.ja_existe ? "#fffbeb" : "#fff" }}>
                    <td style={{ padding: "5px 8px" }}>
                      <input type="checkbox" checked={selecionados.has(i)}
                        onChange={e => setSelecionados(prev => {
                          const s = new Set(prev);
                          e.target.checked ? s.add(i) : s.delete(i);
                          return s;
                        })} />
                    </td>
                    <td style={{ padding: "5px 8px", fontFamily: "monospace", fontWeight: 700, color: "#374151" }}>{r.numero_proposta}</td>
                    <td style={{ padding: "5px 8px", color: "#6b7280", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{r.objeto}</td>
                    <td style={{ padding: "5px 8px", textAlign: "right" as const }}>{fmt(r.valor_indicado)}</td>
                    <td style={{ padding: "5px 8px", color: "#6b7280" }}>{r.situacao_original}</td>
                    <td style={{ padding: "5px 8px" }}>
                      {r.ja_existe ? <span style={{ background: "#fef3c7", color: "#92400e", borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>JÁ EXISTE</span>
                        : <span style={{ background: "#d1fae5", color: "#065f46", borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>NOVO</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {etapa === "resultado" && resultado && (
        <div style={{ ...S.card, textAlign: "center", padding: 40 }}>
          <CheckCircle2 size={40} color="#059669" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Importação Concluída</div>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#059669" }}>{resultado.criados}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Criados</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#0284c7" }}>{resultado.atualizados}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Atualizados</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#dc2626" }}>{resultado.erros?.length ?? 0}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Erros</div>
            </div>
          </div>
          {(resultado.erros ?? []).length > 0 && (
            <div style={{ background: "#fef2f2", borderRadius: 8, padding: 10, marginBottom: 16, textAlign: "left" as const }}>
              {resultado.erros.map((e: any, i: number) => (
                <div key={i} style={{ fontSize: 12, color: "#dc2626" }}>{e.numero}: {e.erro}</div>
              ))}
            </div>
          )}
          <button style={S.btn("#1e3a5f")} onClick={() => setEtapa("upload")}>Nova Importação</button>
        </div>
      )}
    </div>
  );
}

// ── Relatório de Acompanhamento ───────────────────────────────────────────────
function RelatorioAcompanhamento({ municipio_id }: { municipio_id: number }) {
  const [exercicio, setExercicio] = useState<string>("");
  const [situacaoFiltro, setSituacaoFiltro] = useState<string>("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["investsus-relatorio", municipio_id, exercicio, situacaoFiltro],
    queryFn: () => {
      const params = new URLSearchParams({ municipio_id: String(municipio_id) });
      if (exercicio) params.set("exercicio", exercicio);
      if (situacaoFiltro) params.set("situacao", situacaoFiltro);
      return api.get(`/api/investsus/relatorio?${params}`).then(r => r.data);
    },
    enabled: false, // só busca ao clicar
  });

  const exportarCSV = () => {
    if (!data?.linhas?.length) return;
    const cols = [
      "numero_proposta", "numero_emenda", "exercicio", "parlamentar", "partido_uf",
      "programa", "componente", "tipo_financiamento", "entidade", "cnpj", "objeto",
      "situacao_original", "situacao_normalizada",
      "valor_indicado", "valor_aprovado", "valor_empenhado", "valor_pago", "valor_executado",
      "saldo_bancario", "perc_fisico", "perc_financeiro",
      "portaria_numero", "empenho_numero", "prazo_vigencia", "ultima_consulta",
      "total_pareceres", "alertas_abertos", "responsavel_interno",
    ];
    const header = cols.join(";");
    const rows = data.linhas.map((r: any) =>
      cols.map(c => {
        const v = r[c] ?? "";
        return typeof v === "string" && v.includes(";") ? `"${v}"` : v;
      }).join(";")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `investsus_relatorio_${exercicio || "todos"}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Filtros */}
      <div style={{ ...S.card }}>
        <div style={S.title}>Relatório de Acompanhamento InvestSUS</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" as const }}>
          <div>
            <label style={S.label}>Exercício</label>
            <input type="number" style={{ ...S.input, width: 100 }} value={exercicio} placeholder="2026"
              onChange={e => setExercicio(e.target.value)} />
          </div>
          <div>
            <label style={S.label}>Situação</label>
            <select style={{ ...S.input, width: 220 }} value={situacaoFiltro} onChange={e => setSituacaoFiltro(e.target.value)}>
              <option value="">Todas</option>
              {Object.entries(SITUACAO_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <button style={S.btn("#1e3a5f")} onClick={() => refetch()}>
              <Search size={12} /> Gerar Relatório
            </button>
            {data?.linhas?.length > 0 && (
              <button style={S.btn("#059669")} onClick={exportarCSV}>
                <Download size={12} /> Exportar CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {isLoading && <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Gerando relatório...</div>}

      {data && (
        <>
          {/* Totais */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
            <KPICard label="Propostas"    valor={`${data.totais.total_propostas}`}   cor="#1e3a5f" />
            <KPICard label="Total Indicado" valor={fmt(data.totais.total_indicado)}  cor={CORES.indicado} />
            <KPICard label="Total Pago"   valor={fmt(data.totais.total_pago)}        cor={CORES.pago} />
            <KPICard label="Total Executado" valor={fmt(data.totais.total_executado)} cor={CORES.executado} />
          </div>

          {/* Tabela */}
          <div style={{ ...S.card, overflowX: "auto" as const }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
              {data.linhas.length} proposta{data.linhas.length !== 1 ? "s" : ""}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "#f9fafb", position: "sticky" as const, top: 0 }}>
                  {["Nº Proposta", "Exercício", "Parlamentar", "Programa", "Entidade", "Situação", "Indicado", "Aprovado", "Pago", "Executado", "% Fís.", "Alertas", "Resp."].map(h => (
                    <th key={h} style={{ padding: "6px 8px", textAlign: "left" as const, color: "#6b7280", fontWeight: 700, borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" as const }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.linhas.map((r: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                    <td style={{ padding: "5px 8px", fontFamily: "monospace", fontWeight: 700, color: "#1e3a5f" }}>{r.numero_proposta}</td>
                    <td style={{ padding: "5px 8px" }}>{r.exercicio}</td>
                    <td style={{ padding: "5px 8px", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{r.parlamentar}</td>
                    <td style={{ padding: "5px 8px", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{r.programa}</td>
                    <td style={{ padding: "5px 8px", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{r.entidade}</td>
                    <td style={{ padding: "5px 8px" }}><SituacaoBadge situacao={r.situacao_normalizada} /></td>
                    <td style={{ padding: "5px 8px", textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>{fmt(r.valor_indicado)}</td>
                    <td style={{ padding: "5px 8px", textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>{fmt(r.valor_aprovado)}</td>
                    <td style={{ padding: "5px 8px", textAlign: "right" as const, fontVariantNumeric: "tabular-nums", fontWeight: 700, color: "#059669" }}>{fmt(r.valor_pago)}</td>
                    <td style={{ padding: "5px 8px", textAlign: "right" as const, fontVariantNumeric: "tabular-nums", fontWeight: 700, color: "#16a34a" }}>{fmt(r.valor_executado)}</td>
                    <td style={{ padding: "5px 8px", textAlign: "right" as const }}>{fmtPct(r.perc_fisico)}</td>
                    <td style={{ padding: "5px 8px", textAlign: "center" as const }}>
                      {r.alertas_abertos > 0 && (
                        <span style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>{r.alertas_abertos}</span>
                      )}
                    </td>
                    <td style={{ padding: "5px 8px", color: "#6b7280", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{r.responsavel_interno}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#1e3a5f", color: "#fff" }}>
                  <td colSpan={6} style={{ padding: "8px 8px", fontWeight: 700, fontSize: 12 }}>TOTAL</td>
                  <td style={{ padding: "8px 8px", textAlign: "right" as const, fontWeight: 800 }}>{fmt(data.totais.total_indicado)}</td>
                  <td style={{ padding: "8px 8px", textAlign: "right" as const, fontWeight: 800 }}>{fmt(data.totais.total_aprovado)}</td>
                  <td style={{ padding: "8px 8px", textAlign: "right" as const, fontWeight: 800 }}>{fmt(data.totais.total_pago)}</td>
                  <td style={{ padding: "8px 8px", textAlign: "right" as const, fontWeight: 800 }}>{fmt(data.totais.total_executado)}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
// ── Sincronizar com InvestSUS ─────────────────────────────────────────────────
function SincronizarInvestSUS({ municipio_id }: { municipio_id: number }) {
  const qc = useQueryClient();
  const [resultado, setResultado] = useState<any>(null);

  const sync = useMutation({
    mutationFn: () => api.post("/api/investsus/sincronizar", {}),
    onSuccess: (data: any) => {
      setResultado(data.data || data);
      qc.invalidateQueries({ queryKey: ["investsus-dashboard", municipio_id] });
      qc.invalidateQueries({ queryKey: ["investsus-propostas"] });
    },
  });

  const cor = {
    card:   { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 24, marginBottom: 16 },
    titulo: { fontSize: 15, fontWeight: 700, color: "#1e3a5f", marginBottom: 8 },
    sub:    { fontSize: 12, color: "#6b7280", marginBottom: 16, lineHeight: 1.6 },
    btn:    (loading: boolean) => ({
      background: loading ? "#9ca3af" : "#1e3a5f", color: "#fff",
      border: "none", borderRadius: 8, padding: "12px 28px",
      fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
      display: "flex", alignItems: "center", gap: 8,
    } as React.CSSProperties),
    ok:     { background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 16, marginTop: 16 },
    err:    { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 16, marginTop: 16 },
    tag:    (c: string) => ({ background: c, color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 } as React.CSSProperties),
  };

  return (
    <div>
      {/* Card principal */}
      <div style={cor.card}>
        <div style={cor.titulo}>Sincronização com InvestSUS</div>
        <div style={cor.sub}>
          Busca <strong>emendas parlamentares, convênios e transferências</strong> do FMS Apuí via
          Portal da Transparência (Ministério da Saúde) e atualiza o banco local automaticamente.<br /><br />
          Usa a variável <code>TRANSPARENCIA_API_KEY</code> já configurada no Railway.
        </div>

        <button
          style={cor.btn(sync.isPending)}
          onClick={() => sync.mutate()}
          disabled={sync.isPending}
        >
          <RefreshCw size={16} style={{ animation: sync.isPending ? "spin 1s linear infinite" : "none" }} />
          {sync.isPending ? "Sincronizando com InvestSUS..." : "Sincronizar Agora"}
        </button>

        {sync.isError && (
          <div style={cor.err}>
            <strong>Erro na sincronização:</strong>{" "}
            {(sync.error as any)?.response?.data?.erro || (sync.error as any)?.message || "Erro desconhecido"}
            {(sync.error as any)?.response?.data?.instrucao && (
              <div style={{ marginTop: 8, fontSize: 12, color: "#991b1b" }}>
                {(sync.error as any).response.data.instrucao}
              </div>
            )}
          </div>
        )}

        {resultado && !sync.isError && (
          <div style={cor.ok}>
            <div style={{ fontWeight: 700, color: "#166534", marginBottom: 10 }}>
              ✓ Sincronização concluída — {resultado.sincronizado_em?.slice(0, 19).replace("T", " ")} UTC
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
              <span style={cor.tag("#1e3a5f")}>{resultado.propostas_encontradas} propostas encontradas</span>
              <span style={cor.tag("#065f46")}>{resultado.criadas} novas</span>
              <span style={cor.tag("#92400e")}>{resultado.atualizadas} atualizadas</span>
              {resultado.repasses > 0 && <span style={cor.tag("#4c1d95")}>{resultado.repasses} repasses</span>}
            </div>
            {resultado.erros?.length > 0 && (
              <div style={{ marginTop: 12, fontSize: 12, color: "#92400e" }}>
                <strong>Avisos:</strong>
                <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                  {resultado.erros.map((e: any, i: number) => (
                    <li key={i}>{e.endpoint}: {e.erro}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instruções de configuração */}
      <div style={cor.card}>
        <div style={cor.titulo}>Fonte dos dados</div>
        <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.8 }}>
          <div style={{ marginBottom: 8 }}>
            Os dados são obtidos via <strong>Portal da Transparência</strong> (API pública do governo federal):
          </div>
          <ul style={{ margin: "0 0 8px 16px", padding: 0, fontSize: 12, color: "#374151" }}>
            <li>Emendas parlamentares destinadas ao CNPJ do FMS (12.834.320/0001-26)</li>
            <li>Convênios e instrumentos de transferência voluntária</li>
            <li>Transferências recebidas pelo município (IBGE 1300144)</li>
          </ul>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            A variável <code>TRANSPARENCIA_API_KEY</code> já está configurada no Railway.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvestSUS() {
  const [aba, setAba] = useState<"dashboard" | "propostas" | "alertas" | "importar" | "relatorio">("dashboard");
  const [propostaSelecionada, setPropostaSelecionada] = useState<any>(null);
  const municipio_id = 1; // TODO: pegar do contexto de autenticação

  const abas = [
    { key: "dashboard",  label: "Dashboard",  icone: <BarChart3 size={13} /> },
    { key: "propostas",  label: "Propostas",  icone: <FileText size={13} /> },
    { key: "alertas",    label: "Alertas",    icone: <Bell size={13} /> },
    { key: "sincronizar", label: "Sincronizar", icone: <RefreshCw size={13} /> },
    { key: "relatorio",  label: "Relatório",  icone: <Download size={13} /> },
  ] as const;

  return (
    <div style={S.page}>
      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Landmark size={20} color="#1e3a5f" />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1e3a5f", lineHeight: 1.2 }}>InvestSUS</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>Emendas, Propostas e Execução · FMS Apuí/AM</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "right" as const }}>
          <div>Fonte: InvestSUS / MS</div>
          <div>Atualização: manual auditável</div>
        </div>
      </div>

      {/* Abas */}
      {!propostaSelecionada && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {abas.map(({ key, label, icone }) => (
            <button key={key} style={{ ...S.tab(aba === key), display: "flex", alignItems: "center", gap: 5 }}
              onClick={() => setAba(key as typeof aba)}>
              {icone} {label}
            </button>
          ))}
        </div>
      )}

      {/* Conteúdo */}
      {propostaSelecionada ? (
        <DetalheProposta
          id={propostaSelecionada.id}
          municipio_id={municipio_id}
          onVoltar={() => setPropostaSelecionada(null)}
        />
      ) : aba === "dashboard" ? (
        <DashboardInvestSUS municipio_id={municipio_id} />
      ) : aba === "propostas" ? (
        <ListaPropostas municipio_id={municipio_id} onSelect={setPropostaSelecionada} />
      ) : aba === "alertas" ? (
        <AlertasGlobais municipio_id={municipio_id} />
      ) : aba === "sincronizar" ? (
        <SincronizarInvestSUS municipio_id={municipio_id} />
      ) : (
        <RelatorioAcompanhamento municipio_id={municipio_id} />
      )}
    </div>
  );
}
