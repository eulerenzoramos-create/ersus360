// src/lib/api.ts — Cliente HTTP centralizado
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

// Injeta token JWT em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ersus_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Remove token e redireciona se 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("ersus_token");
      localStorage.removeItem("ersus_perfil");
      localStorage.removeItem("ersus_nome");
      window.location.href = "/";
    }
    return Promise.reject(err);
  },
);

// ── Tipos principais ──────────────────────────────────────────────────────────

export interface DashboardStats {
  municipio_id: number;
  municipio_nome: string;
  total_indicadores: number;
  indicadores_atingidos: number;
  execucao_media: number;
  total_repasses: number;
  convenios_vigentes: number;
  total_convenios: number;
  execucao_pas: number;
  alertas_ativos: number;
  alertas_criticos: number;
  atualizado_em: string;
}

export interface Convenio {
  id: number;
  municipio_id: number;
  numero: string;
  objeto: string;
  situacao: string;
  valor_contrato: number;
  perc_fisico_executado: number;
  perc_financeiro_executado: number;
  bloco_pacto?: { id: number; nome: string };
  criado_em: string;
  atualizado_em: string;
}

export interface Repasse {
  id: number;
  convenio_id: number;
  competencia: string;
  mes: number;
  ano: number;
  tipo_repasse: string;
  novos_repasses: number;
  valor_previsto: number;
  valor_realizado: number;
  data_repasse?: string;
  origem: string;
  criado_em: string;
}

export interface RepasseMensal {
  competencia: string;
  mes: number;
  ano: number;
  total_previsto: number;
  total_realizado: number;
  novos_repasses: number;
}

export interface Indicador {
  id: number;
  municipio_id: number;
  indicador: string;
  eixo?: string;
  unidade_medida: string;
  meta_prevista: number;
  valor_alcancado: number;
  situacao: string;
  competencia?: string;
  criado_em: string;
}

export interface Alerta {
  id: number;
  titulo: string;
  descricao: string;
  modulo: string;
  severidade: "critico" | "atencao" | "info";
  resolvido: boolean;
  criado_em: string;
}

export interface FnsSyncResult {
  status: string;
  competencia: string;
  total_encontrados: number;
  novos_inseridos: number;
  atualizados: number;
  alertas_gerados: number;
  mensagem: string;
  executado_em: string;
  itens: Array<{
    numero_convenio: string;
    objeto: string;
    bloco: string;
    valor_previsto: number;
    valor_realizado: number;
  }>;
}

// ── Funções de API ─────────────────────────────────────────────────────────────

export const apiDashboard = {
  stats: (municipioId = 1) =>
    api.get<DashboardStats>(`/api/dashboard/stats?municipio_id=${municipioId}`).then((r) => r.data),
};

export const apiConvenios = {
  list: (municipioId = 1) =>
    api.get<Convenio[]>(`/api/convenios?municipio_id=${municipioId}`).then((r) => r.data),
  create: (body: Partial<Convenio>) => api.post<Convenio>("/api/convenios", body).then((r) => r.data),
  update: (id: number, body: Partial<Convenio>) =>
    api.put<Convenio>(`/api/convenios/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/convenios/${id}`),
};

export const apiRepasses = {
  list: (params?: { municipio_id?: number; convenio_id?: number }) =>
    api.get<Repasse[]>("/api/repasses", { params }).then((r) => r.data),
  mensais: (ano = 2026, municipioId = 1) =>
    api.get<RepasseMensal[]>(`/api/repasses/mensais?ano=${ano}&municipio_id=${municipioId}`).then((r) => r.data),
  create: (body: Partial<Repasse>) => api.post<Repasse>("/api/repasses", body).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/repasses/${id}`),
};

export const apiIndicadores = {
  list: (municipioId = 1) =>
    api.get<Indicador[]>(`/api/indicadores?municipio_id=${municipioId}`).then((r) => r.data),
  create: (body: Partial<Indicador>) =>
    api.post<Indicador>("/api/indicadores", body).then((r) => r.data),
  update: (id: number, body: Partial<Indicador>) =>
    api.put<Indicador>(`/api/indicadores/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/indicadores/${id}`),
};

export const apiAlertas = {
  list: (municipioId = 1) =>
    api.get<Alerta[]>(`/api/alertas?municipio_id=${municipioId}`).then((r) => r.data),
  resolver: (id: number) => api.post<Alerta>(`/api/alertas/${id}/resolver`).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/alertas/${id}`),
};

export const apiFns = {
  status: () => api.get("/api/fns/status").then((r) => r.data),
  historico: () => api.get("/api/fns/historico").then((r) => r.data),
  preview: (mes: number, ano: number) =>
    api.post<FnsSyncResult>("/api/fns/sync", { mes, ano, modo: "preview" }).then((r) => r.data),
  sync: (mes: number, ano: number, municipio_id = 1) =>
    api.post<FnsSyncResult>("/api/fns/sync", { mes, ano, municipio_id, modo: "sync" }).then((r) => r.data),
  syncTodos: (municipio_id = 1, ultimos_meses = 3) =>
    api.post<FnsSyncResult[]>(`/api/fns/sync-todos?municipio_id=${municipio_id}&ultimos_meses=${ultimos_meses}`).then((r) => r.data),
};

// ── Novos módulos ─────────────────────────────────────────────────────────────

export interface Portaria {
  id: number;
  numero: string;
  ano: number;
  orgao_emissor: string;
  programa?: string;
  bloco?: string;
  objeto?: string;
  data_publicacao?: string;
  valor_total: number;
  arquivo_pdf?: string;
}

export interface Obra {
  id: number;
  municipio_id: number;
  nome_estabelecimento: string;
  tipo_estabelecimento: string;
  tipo_obra: string;
  valor_contrato: number;
  perc_fisico: number;
  perc_financeiro: number;
  status: string;
  data_previsao_conclusao?: string;
  dias_atraso?: number;
  empresa_construtora?: string;
  numero_sismob?: string;
}

export interface Empenho {
  id: number;
  convenio_id: number;
  numero: string;
  data_empenho: string;
  valor: number;
  credor?: string;
  descricao?: string;
  situacao: string;
  valor_liquidado: number;
  valor_pago: number;
  valor_saldo: number;
}

export interface SaldoConvenio {
  convenio_id: number;
  numero: string;
  objeto: string;
  valor_recebido: number;
  total_empenhado: number;
  total_liquidado: number;
  total_pago: number;
  total_rendimento: number;
  saldo_disponivel: number;
  saldo_comprometido: number;
  saldo_executado: number;
  perc_executado: number;
}

export interface Documento {
  id: number;
  titulo: string;
  tipo: string;
  arquivo: string;
  tamanho_kb?: number;
  mime_type?: string;
  descricao?: string;
  criado_em: string;
}

export interface IAMensagem {
  pergunta: string;
  resposta: string;
  timestamp: string;
}

export const apiAuth = {
  login: (username: string, password: string) => {
    const form = new URLSearchParams();
    form.append("username", username);
    form.append("password", password);
    return api.post("/api/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }).then((r) => r.data as { access_token: string; user: Record<string, string> });
  },
  me: (token: string) =>
    api.get("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.data),
};

export const apiPortarias = {
  list: (params?: { q?: string; bloco?: string; ano?: number }) =>
    api.get<Portaria[]>("/api/portarias", { params }).then((r) => r.data),
  get: (id: number) => api.get<Portaria>(`/api/portarias/${id}`).then((r) => r.data),
  create: (body: Partial<Portaria>) => api.post<Portaria>("/api/portarias", body).then((r) => r.data),
  update: (id: number, body: Partial<Portaria>) =>
    api.put<Portaria>(`/api/portarias/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/portarias/${id}`),
};

export const apiObras = {
  list: (params?: { status?: string; tipo?: string }) =>
    api.get<Obra[]>("/api/obras", { params }).then((r) => r.data),
  get: (id: number) => api.get<Obra>(`/api/obras/${id}`).then((r) => r.data),
  create: (body: Partial<Obra>) => api.post<Obra>("/api/obras", body).then((r) => r.data),
  update: (id: number, body: Partial<Obra>) =>
    api.put<Obra>(`/api/obras/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/obras/${id}`),
  cronograma: (id: number) => api.get(`/api/obras/${id}/cronograma`).then((r) => r.data),
  fotos: (id: number) => api.get(`/api/obras/${id}/fotos`).then((r) => r.data),
};

export const apiExecucao = {
  empenhos: (convenio_id?: number) =>
    api.get<Empenho[]>("/api/execucao/empenhos", { params: { convenio_id } }).then((r) => r.data),
  criarEmpenho: (body: Partial<Empenho>) =>
    api.post<Empenho>("/api/execucao/empenhos", body).then((r) => r.data),
  saldo: (convenio_id: number) =>
    api.get<SaldoConvenio>(`/api/execucao/saldo/${convenio_id}`).then((r) => r.data),
  rendimentos: () =>
    api.get("/api/execucao/rendimentos").then((r) => r.data),
  restosAPagar: (ano?: number) =>
    api.get("/api/execucao/restos-a-pagar", { params: { ano } }).then((r) => r.data),
};

export const apiDocumentos = {
  list: (params?: { tipo?: string; convenio_id?: number; q?: string }) =>
    api.get<Documento[]>("/api/documentos", { params }).then((r) => r.data),
  upload: (formData: FormData) =>
    api.post<Documento>("/api/documentos/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/documentos/${id}`),
};

export const apiRelatorios = {
  financeiro: (ano?: number) =>
    api.get("/api/relatorios/financeiro", { params: { ano } }).then((r) => r.data),
  porBloco: (ano?: number) =>
    api.get("/api/relatorios/por-bloco", { params: { ano } }).then((r) => r.data),
  porPrograma: (ano?: number) =>
    api.get("/api/relatorios/por-programa", { params: { ano } }).then((r) => r.data),
  prestacaoContas: (ano: number) =>
    api.get("/api/relatorios/prestacao-contas", { params: { ano } }).then((r) => r.data),
};

export const apiIA = {
  perguntar: (pergunta: string) =>
    api.post<IAMensagem>("/api/ia/pergunta", { pergunta }).then((r) => r.data),
  historico: () => api.get<IAMensagem[]>("/api/ia/historico").then((r) => r.data),
  sugestoes: () => api.get<{ perguntas: string[] }>("/api/ia/sugestoes").then((r) => r.data),
};
