/**
 * Sessão multi-tenant — ERSUS 360
 *
 * O município da sessão é definido pelo BACKEND (login ou troca auditada em
 * /api/tenant/selecionar) e vem dentro do token. O frontend só exibe; nunca
 * escolhe o município enviando parâmetros.
 */

export interface SessaoUsuario {
  username: string;
  nome: string;
  cargo: string;
  role: string;
  municipio_id: number | null;
  municipio_uuid: string | null;
  municipio: string;
  municipio_ibge: string | null;
  municipio_uf: string | null;
  municipio_brasao: string | null;
  administrador_geral: boolean;
  perfis_assessoria: boolean;   // true = pode trocar de município
  modulos: string[];
}

const K_TOKEN = "ersus_token";
const K_SESSAO = "ersus_sessao";
// Chaves antigas, ainda lidas por algumas telas
const LEGADAS = ["ersus_perfil", "ersus_nome", "ersus_municipio_ibge", "ersus_municipio",
                 "ersus_perfis_assessoria", "ersus_municipio_ativo"];

export const API_BASE: string = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export function salvarSessao(data: { access_token: string; user: SessaoUsuario }) {
  localStorage.setItem(K_TOKEN, data.access_token);
  localStorage.setItem(K_SESSAO, JSON.stringify(data.user));
  localStorage.setItem("ersus_perfil", data.user.role);
  localStorage.setItem("ersus_nome", data.user.nome);
  localStorage.setItem("ersus_municipio_ibge", data.user.municipio_ibge ?? "");
  localStorage.setItem("ersus_municipio", data.user.municipio ?? "");
  localStorage.setItem("ersus_perfis_assessoria", String(data.user.perfis_assessoria));
  localStorage.removeItem("ersus_municipio_ativo");
}

export function lerSessao(): SessaoUsuario | null {
  if (!localStorage.getItem(K_TOKEN)) return null;
  try {
    return JSON.parse(localStorage.getItem(K_SESSAO) ?? "null");
  } catch {
    return null;
  }
}

export function lerToken(): string | null {
  return localStorage.getItem(K_TOKEN);
}

export function limparSessao() {
  [K_TOKEN, K_SESSAO, ...LEGADAS].forEach(k => localStorage.removeItem(k));
  // o histórico local de alertas pertence ao município anterior
  localStorage.removeItem("ersus_alertas_historico");
}

/** Chamada à API de tenant com o token atual. */
async function tenantPost(path: string, body?: unknown) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const erro = await r.json().catch(() => ({}));
    throw new Error(erro.detail ?? `Erro ${r.status}`);
  }
  return r.json();
}

/** Troca de município: novo token + recarga completa (limpa caches de outro município). */
export async function selecionarMunicipio(municipioUuid: string) {
  const data = await tenantPost("/api/tenant/selecionar", { municipio_uuid: municipioUuid });
  localStorage.removeItem("ersus_alertas_historico");
  salvarSessao(data);
  window.location.assign("/");
}

export async function sairDoSuporte() {
  const data = await tenantPost("/api/tenant/sair-suporte");
  localStorage.removeItem("ersus_alertas_historico");
  salvarSessao(data);
  window.location.assign("/");
}

function ehChamadaApi(url: string): boolean {
  return url.startsWith("/api/") || url.startsWith(`${API_BASE}/api/`);
}

/**
 * Instala o token em TODAS as chamadas fetch() para a API (várias telas usam
 * fetch direto em vez do cliente axios). 401 encerra a sessão; 409 de
 * município não selecionado volta à tela de seleção.
 */
export function instalarFetchAutenticado() {
  const original = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!ehChamadaApi(url)) return original(input, init);

    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    const token = lerToken();
    if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
    const resp = await original(input, { ...init, headers });
    tratarStatus(resp.status, url);
    return resp;
  };
}

export function tratarStatus(status: number, url: string) {
  if (status === 401 && !url.includes("/api/auth/login")) {
    limparSessao();
    window.location.assign("/");
  }
}
