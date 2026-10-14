/**
 * Cadastro único de navegação — ERSUS 360
 * Todas as rotas, categorias, palavras-chave e permissões em um único lugar.
 * NÃO editar rotas em App.tsx — alterar somente aqui.
 */
import type { LucideIcon } from "lucide-react";

// ── Perfis que podem acessar módulos financeiros
export const ROLES_FIN  = ["administrador_geral","superadmin","admin","gestor","financeiro","contabilidade","prefeito"];
export const ROLES_RH   = ["administrador_geral","superadmin","admin","gestor"];
export const ROLES_USR  = ["administrador_geral","superadmin","admin"];
export const ROLES_AUD  = ["administrador_geral","superadmin","admin","gestor","auditoria"];

export interface NavItem {
  id: string;
  title: string;
  shortTitle?: string;
  description: string;
  route: string;
  category: string;
  subcategory?: string;
  iconName: string;          // nome do ícone lucide — mapeado no Sidebar
  keywords: string[];
  roles?: string[];          // undefined = qualquer perfil autenticado
  order: number;
  isNew?: boolean;
  highlight?: boolean;
  altRoute?: string;         // rota alternativa legada
}

// ── Ícone temporário — preenchido em runtime pelo Sidebar
export type NavItemWithIcon = NavItem & { Icon: LucideIcon };

// ============================================================
// Catálogo completo
// ============================================================
export const NAV_ITEMS: NavItem[] = [

  // ── Atenção Primária → Painel ────────────────────────────
  // Cofinanciamento APS
  { id:"previne",             category:"Atenção Primária", subcategory:"Cofinanciamento APS (P. 3.493)", order:110, iconName:"PieChart",
    title:"Consolidado C/B/M", route:"/previne",
    description:"Consolidado do cofinanciamento federal APS — Grupos C, B e M — Portaria 3.493",
    keywords:["previne","cofinanciamento","aps","portaria 3493","grupo c","grupo b","grupo m","consolidado","financiamento","federal","bloco","atenção básica","ab"] },

  { id:"grupo-b",             category:"Atenção Primária", subcategory:"Cofinanciamento APS (P. 3.493)", order:112, iconName:"Stethoscope",
    title:"Grupo B — eSB", route:"/previne/grupoB",
    description:"Equipes de Saúde Bucal — cofinanciamento Grupo B",
    keywords:["grupo b","esb","saúde bucal","odontologia","equipe","cofinanciamento"] },

  { id:"grupo-c",             category:"Atenção Primária", subcategory:"Cofinanciamento APS (P. 3.493)", order:111, iconName:"Users",
    title:"Grupo C — eSF/eAP", route:"/previne/grupoC",
    description:"Equipes de Saúde da Família e Atenção Primária — cofinanciamento Grupo C",
    keywords:["grupo c","esf","eap","saúde família","atenção primária","equipe","cofinanciamento"] },

  { id:"sprint-otimo",        category:"Atenção Primária", subcategory:"Cofinanciamento APS (P. 3.493)", order:115, iconName:"Star",
    title:"Sprint ÓTIMO", route:"/sprint-otimo",
    description:"Painel do Sprint ÓTIMO — desempenho de indicadores APS no mês",
    keywords:["sprint","ótimo","meta","indicadores","mensal","performance"] },

  // Busca Ativa
  { id:"busca-ia",            category:"Atenção Primária", subcategory:"Busca Ativa", order:154, iconName:"Brain", isNew:true,
    title:"Busca Ativa · IA", route:"/busca-ativa-ia",
    description:"Busca ativa com inteligência artificial para priorização de usuários",
    keywords:["busca ativa","ia","inteligência artificial","priorização","algoritmo","machine learning"] },

  // ACS
  { id:"acs-cadastros",       category:"Atenção Primária", subcategory:"ACS", order:161, iconName:"Users",
    title:"Cadastros do Cidadão", route:"/acs/cadastros-cid",
    description:"Fichas de cadastro individual dos cidadãos cadastrados pelos ACS",
    keywords:["acs","cadastro","cidadão","individual","ficha","esus","cns","cpf"] },

  { id:"acs-mapa",            category:"Atenção Primária", subcategory:"ACS", order:163, iconName:"Map",
    title:"Mapa de Visitas ACS", route:"/acs/mapa-visitas",
    description:"Mapa georreferenciado de visitas domiciliares dos ACS",
    keywords:["acs","mapa","visita","georreferenciado","microárea","território"] },

  { id:"acs-painel",          category:"Atenção Primária", subcategory:"ACS", order:160, iconName:"BarChart3",
    title:"Painel do ACS", route:"/acs/painel",
    description:"Painel de monitoramento dos Agentes Comunitários de Saúde em tempo real",
    keywords:["acs","agente comunitário","saúde","painel","monitoramento","visita","esus pec","microárea"] },

  { id:"acs-registrar",       category:"Atenção Primária", subcategory:"ACS", order:164, iconName:"ClipboardCheck",
    title:"Registrar Visita ACS", route:"/acs/registrar-visita",
    description:"Formulário de registro de visita domiciliar pelo ACS",
    keywords:["acs","registrar","visita","formulário","domiciliar","novo registro"] },

  { id:"acs-visitas",         category:"Atenção Primária", subcategory:"ACS", order:162, iconName:"MapPin",
    title:"Visitas Domiciliares", route:"/acs/visitas-cidadao",
    description:"Registro e acompanhamento de visitas domiciliares dos ACS",
    keywords:["acs","visita","domiciliar","domicílio","registro","esus","agente"] },

];

// ── Utilitários de busca ──────────────────────────────────────────────────────

/** Remove acentos e converte para minúsculas */
export function normalizeText(t: string): string {
  return t.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Retorna true se o item passa no filtro de perfil */
export function itemAllowed(item: NavItem, perfil: string): boolean {
  if (!item.roles) return true;
  return item.roles.includes(perfil);
}

/** Score de relevância do item para a query (0 = não encontrado) */
export function scoreItem(item: NavItem, normQuery: string): number {
  if (!normQuery) return 1;
  const words = normQuery.split(" ").filter(Boolean);
  const text = normalizeText([
    item.title, item.shortTitle ?? "", item.description,
    item.category, item.subcategory ?? "", item.route,
    ...item.keywords,
  ].join(" "));

  let score = 0;
  for (const w of words) {
    if (!text.includes(w)) return 0; // all words must match
    if (normalizeText(item.title).includes(w)) score += 10;
    else if (normalizeText(item.category).includes(w)) score += 4;
    else if (normalizeText(item.description).includes(w)) score += 3;
    else score += 1;
  }
  return score;
}

/** Lista de categorias únicas na ordem de exibição */
export const CATEGORIES = [
  "Visão Executiva",
  "Atenção Primária",
  "Financeiro e Gestão Fiscal",
  "Planejamento e Prestação de Contas",
  "Vigilância em Saúde",
  "Assistência Farmacêutica",
  "Atenção Especializada e Regulação",
  "Saúde do Cidadão",
  "Central de Inconsistências",
  "Central de Relatórios",
  "Administração do Sistema",
  "Gestão Operacional",
] as const;

export type Category = (typeof CATEGORIES)[number];
