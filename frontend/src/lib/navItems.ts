/**
 * Cadastro único de navegação — ERSUS 360
 * Todas as rotas, categorias, palavras-chave e permissões em um único lugar.
 * NÃO editar rotas em App.tsx — alterar somente aqui.
 */
import type { LucideIcon } from "lucide-react";

// ── Perfis que podem acessar módulos financeiros
export const ROLES_FIN  = ["superadmin","admin","gestor","financeiro","contabilidade","prefeito"];
export const ROLES_RH   = ["superadmin","admin","gestor"];
export const ROLES_USR  = ["superadmin","admin"];
export const ROLES_AUD  = ["superadmin","admin","gestor","auditoria"];

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

  // ── Visão Executiva ──────────────────────────────────────
  { id:"home",                category:"Visão Executiva", order:10, iconName:"Home",
    title:"Painel do Gestor", shortTitle:"Home", route:"/",
    description:"Painel principal com resumo geral da gestão municipal de saúde",
    keywords:["home","painel","início","dashboard","principal","gestor","resumo"] },

  { id:"dashboard-executivo", category:"Visão Executiva", order:11, iconName:"Monitor",
    title:"Dashboard Executivo 360°", route:"/dashboard-executivo",
    description:"Visão estratégica 360° de todos os indicadores do município",
    keywords:["dashboard","executivo","360","indicadores","gestão","estratégico"] },

  { id:"score",               category:"Visão Executiva", order:12, iconName:"Star",
    title:"Score ERSUS 360", route:"/score",
    description:"Pontuação integrada de desempenho do sistema de saúde municipal",
    keywords:["score","pontuação","desempenho","nota","avaliação","ersus"] },

  { id:"mapa-desempenho",     category:"Visão Executiva", order:13, iconName:"Map",
    title:"Mapa de Desempenho", route:"/mapa",
    description:"Mapa geográfico de desempenho por indicadores e territórios",
    keywords:["mapa","desempenho","geográfico","território","espacial"] },

  { id:"ranking",             category:"Visão Executiva", order:14, iconName:"BarChart2",
    title:"Ranking Municipal", route:"/ranking",
    description:"Ranking comparativo entre municípios por indicadores de saúde",
    keywords:["ranking","comparativo","municípios","classificação","posição"] },

  { id:"idsus",               category:"Visão Executiva", order:15, iconName:"Award",
    title:"IDSUS Municipal", route:"/idsus-municipal",
    description:"Índice de Desempenho do SUS a nível municipal",
    keywords:["idsus","índice","sus","desempenho","datasus","monitoramento"] },

  { id:"ia-gestora",          category:"Visão Executiva", order:16, iconName:"Bot", isNew:true,
    title:"IA Gestora", route:"/ia",
    description:"Inteligência artificial para apoio à decisão em gestão de saúde",
    keywords:["ia","inteligência artificial","ai","machine learning","decisão","algoritmo"] },

  { id:"okr",                 category:"Visão Executiva", order:17, iconName:"Target",
    title:"OKRs Estratégicos", route:"/okr",
    description:"Objetivos e resultados-chave da gestão municipal de saúde",
    keywords:["okr","objetivos","resultados","metas","estratégia","chave"] },

  { id:"bi",                  category:"Visão Executiva", order:18, iconName:"TrendingUp",
    title:"Business Intelligence", shortTitle:"BI", route:"/bi",
    description:"Análise avançada de dados e painéis de inteligência em saúde",
    keywords:["bi","business intelligence","análise","dados","relatórios","painéis","power bi"] },

  // ── Atenção Primária → Painel ────────────────────────────
  { id:"aps",                 category:"Atenção Primária", order:100, iconName:"Stethoscope",
    title:"Painel APS", route:"/aps",
    description:"Painel de atenção primária à saúde — indicadores e equipes",
    keywords:["aps","atenção primária","painel","saúde","equipes","esf","eap"] },

  { id:"essenciais",          category:"Atenção Primária", order:101, iconName:"Star", highlight:true,
    title:"Módulos Essenciais Apuí", shortTitle:"Essenciais", route:"/essenciais-apui",
    description:"Conjunto de módulos essenciais configurados para o município de Apuí/AM",
    keywords:["essenciais","apuí","municipais","módulos","apui"] },

  // Cofinanciamento APS
  { id:"previne",             category:"Atenção Primária", subcategory:"Cofinanciamento APS (P. 3.493)", order:110, iconName:"PieChart",
    title:"Consolidado C/B/M", route:"/previne",
    description:"Consolidado do cofinanciamento federal APS — Grupos C, B e M — Portaria 3.493",
    keywords:["previne","cofinanciamento","aps","portaria 3493","grupo c","grupo b","grupo m","consolidado","financiamento","federal","bloco","atenção básica","ab"] },

  { id:"grupo-c",             category:"Atenção Primária", subcategory:"Cofinanciamento APS (P. 3.493)", order:111, iconName:"Users",
    title:"Grupo C — eSF/eAP", route:"/previne/grupoC",
    description:"Equipes de Saúde da Família e Atenção Primária — cofinanciamento Grupo C",
    keywords:["grupo c","esf","eap","saúde família","atenção primária","equipe","cofinanciamento"] },

  { id:"grupo-b",             category:"Atenção Primária", subcategory:"Cofinanciamento APS (P. 3.493)", order:112, iconName:"Stethoscope",
    title:"Grupo B — eSB", route:"/previne/grupoB",
    description:"Equipes de Saúde Bucal — cofinanciamento Grupo B",
    keywords:["grupo b","esb","saúde bucal","odontologia","equipe","cofinanciamento"] },

  { id:"grupo-m",             category:"Atenção Primária", subcategory:"Cofinanciamento APS (P. 3.493)", order:113, iconName:"Activity",
    title:"Grupo M — eMulti", route:"/previne/grupoM",
    description:"Equipes Multiprofissionais — NASF/eMulti — cofinanciamento Grupo M",
    keywords:["grupo m","emulti","nasf","multiprofissional","equipe","cofinanciamento","multi"] },

  { id:"ribeirinha",          category:"Atenção Primária", subcategory:"Cofinanciamento APS (P. 3.493)", order:114, iconName:"Ship",
    title:"eRibeirinha", route:"/previne/ribeirinha",
    description:"Equipes Ribeirinhas e comunidades de difícil acesso",
    keywords:["ribeirinha","eSF ribeirinha","comunidade","difícil acesso","barco","fluvial"] },

  { id:"sprint-otimo",        category:"Atenção Primária", subcategory:"Cofinanciamento APS (P. 3.493)", order:115, iconName:"Star",
    title:"Sprint ÓTIMO", route:"/sprint-otimo",
    description:"Painel do Sprint ÓTIMO — desempenho de indicadores APS no mês",
    keywords:["sprint","ótimo","meta","indicadores","mensal","performance"] },

  // Saúde Brasil 360
  { id:"cvat",                category:"Atenção Primária", subcategory:"Saúde Brasil 360", order:120, iconName:"Users",
    title:"CVAT — Multimunicípio", route:"/cvat",
    description:"Comparativo de desempenho entre municípios — CVAT",
    keywords:["cvat","comparativo","municípios","multimunicípio","saúde brasil"] },

  { id:"sb360-territorial",   category:"Atenção Primária", subcategory:"Saúde Brasil 360", order:121, iconName:"PieChart",
    title:"Consolidado Territorial", route:"/sb360/consolidado-territorial",
    description:"Visão consolidada territorial — Saúde Brasil 360",
    keywords:["territorial","consolidado","saúde brasil","360","mapa","região"] },

  { id:"sb360-acomp",         category:"Atenção Primária", subcategory:"Saúde Brasil 360", order:122, iconName:"MapPin",
    title:"Acompanhamento Territorial", route:"/sb360/acompanhamento-territorial",
    description:"Acompanhamento de indicadores por território",
    keywords:["acompanhamento","territorial","indicadores","monitoramento","território"] },

  { id:"sb360-acesso",        category:"Atenção Primária", subcategory:"Saúde Brasil 360", order:123, iconName:"Heart",
    title:"Mais Acesso à APS", route:"/sb360/mais-acesso-aps",
    description:"Expansão do acesso à Atenção Primária à Saúde",
    keywords:["acesso","aps","expansão","cobertura","população"] },

  { id:"sb360-infantil",      category:"Atenção Primária", subcategory:"Saúde Brasil 360", order:124, iconName:"Baby",
    title:"Desenvolvimento Infantil", route:"/sb360/desenvolvimento-infantil",
    description:"Indicadores de desenvolvimento infantil na APS",
    keywords:["desenvolvimento","infantil","criança","bebê","puericultura"] },

  { id:"sb360-gestante",      category:"Atenção Primária", subcategory:"Saúde Brasil 360", order:125, iconName:"Baby",
    title:"Gestante e Puérpera", route:"/sb360/gestante-puerpera",
    description:"Acompanhamento de gestantes e puérperas na APS",
    keywords:["gestante","puérpera","pré-natal","gravidez","parto","maternidade"] },

  { id:"sb360-diabetes",      category:"Atenção Primária", subcategory:"Saúde Brasil 360", order:126, iconName:"FlaskConical",
    title:"Pessoa com Diabetes", route:"/sb360/pessoa-diabetes",
    description:"Monitoramento de pessoas com diabetes mellitus na APS",
    keywords:["diabetes","dm","glicemia","insulina","hiperdia","crônico"] },

  { id:"sb360-hipertensao",   category:"Atenção Primária", subcategory:"Saúde Brasil 360", order:127, iconName:"Activity",
    title:"Pessoa com Hipertensão", route:"/sb360/pessoa-hipertensao",
    description:"Monitoramento de pessoas com hipertensão arterial na APS",
    keywords:["hipertensão","has","pressão","arterial","crônico","hiperdia"] },

  { id:"sb360-idoso",         category:"Atenção Primária", subcategory:"Saúde Brasil 360", order:128, iconName:"UserCheck",
    title:"Pessoa Idosa", route:"/sb360/pessoa-idosa",
    description:"Acompanhamento de pessoas idosas na Atenção Primária",
    keywords:["idoso","idosa","terceira idade","envelhecimento","velhice","60 anos"] },

  { id:"sb360-cancer",        category:"Atenção Primária", subcategory:"Saúde Brasil 360", order:129, iconName:"ShieldCheck",
    title:"Mulher — Prevenção Câncer", route:"/sb360/mulher-cancer",
    description:"Rastreio e prevenção de câncer de mama e colo do útero na APS",
    keywords:["câncer","mama","colo","útero","rastreio","prevenção","mulher","citopatológico"] },

  { id:"sb360-multi",         category:"Atenção Primária", subcategory:"Saúde Brasil 360", order:130, iconName:"Users",
    title:"Equipes Multiprofissionais", route:"/sb360/equipes-multiprofissionais",
    description:"Monitoramento das equipes multiprofissionais — eMulti/NASF",
    keywords:["emulti","nasf","multiprofissional","equipe","multi","nasf-ab"] },

  // Produção e Monitoramento
  { id:"producao-sisab",      category:"Atenção Primária", subcategory:"Produção e Monitoramento", order:140, iconName:"BarChart2",
    title:"Produção APS · SISAB", shortTitle:"Produção SISAB", route:"/producao-sisab",
    description:"Produção ambulatorial de APS registrada no SISAB/e-SUS",
    keywords:["produção","sisab","esus","ambulatorial","aps","atendimento","ficha","cds","pec"] },

  { id:"relatorio-producao",  category:"Atenção Primária", subcategory:"Produção e Monitoramento", order:141, iconName:"FileText",
    title:"Relatório de Produção", route:"/relatorio-producao",
    description:"Relatório consolidado de produção de saúde da APS",
    keywords:["relatório","produção","consolidado","aps","dados"] },

  { id:"gestao-aps",          category:"Atenção Primária", subcategory:"Produção e Monitoramento", order:142, iconName:"PieChart",
    title:"Painel de Gestão APS", route:"/gestao",
    description:"Painel gerencial de indicadores de gestão na Atenção Primária",
    keywords:["gestão","painel","aps","gerencial","indicadores"] },

  { id:"analise-brasil",      category:"Atenção Primária", subcategory:"Produção e Monitoramento", order:143, iconName:"PieChart",
    title:"Análise Brasil 360", route:"/analise-municipio",
    description:"Análise comparativa de indicadores do município com o Brasil",
    keywords:["análise","brasil","360","comparativo","município","nacional"] },

  { id:"parametros-ms",       category:"Atenção Primária", subcategory:"Produção e Monitoramento", order:144, iconName:"BookOpen",
    title:"Parâmetros MS", route:"/parametros-ms",
    description:"Parâmetros assistenciais do Ministério da Saúde",
    keywords:["parâmetros","ms","ministério","saúde","assistencial","referência","normativas"] },

  { id:"fichas-tecnicas",     category:"Atenção Primária", subcategory:"Produção e Monitoramento", order:145, iconName:"Clipboard",
    title:"Fichas Técnicas", route:"/fichas-tecnicas",
    description:"Fichas técnicas dos indicadores de saúde",
    keywords:["ficha","técnica","indicadores","metodologia","cálculo","definição"] },

  { id:"score-municipal",     category:"Atenção Primária", subcategory:"Produção e Monitoramento", order:146, iconName:"Star",
    title:"Score Municipal", route:"/score-municipal",
    description:"Score de desempenho municipal em saúde pública",
    keywords:["score","municipal","desempenho","nota","pontuação","ranking"] },

  { id:"simulador",           category:"Atenção Primária", subcategory:"Produção e Monitoramento", order:147, iconName:"Calculator",
    title:"Simulador de Cenários", route:"/simulador-cenarios",
    description:"Simulador de cenários para metas e indicadores de saúde",
    keywords:["simulador","cenários","meta","projeção","forecast","estimativa","indicador"] },

  // Busca Ativa
  { id:"busca-ativa",         category:"Atenção Primária", subcategory:"Busca Ativa", order:150, iconName:"Search",
    title:"Painel Geral — Busca Ativa", shortTitle:"Busca Ativa", route:"/busca-ativa",
    description:"Painel geral de busca ativa de usuários faltosos ao serviço de saúde",
    keywords:["busca ativa","faltoso","ausente","convocação","agenda","chamada"] },

  { id:"busca-gestante",      category:"Atenção Primária", subcategory:"Busca Ativa", order:151, iconName:"Baby",
    title:"Busca Ativa — Gestante", route:"/busca-ativa/gestante",
    description:"Busca ativa de gestantes sem acompanhamento de pré-natal",
    keywords:["busca ativa","gestante","pré-natal","gravidez","ativa","convocação"] },

  { id:"busca-vacinas",       category:"Atenção Primária", subcategory:"Busca Ativa", order:152, iconName:"Syringe",
    title:"Busca Ativa — Vacinas", route:"/busca-ativa/vacinas",
    description:"Busca ativa de crianças e adultos com vacinas em atraso",
    keywords:["busca ativa","vacinas","vacinação","imunização","sipni","atraso","faltoso"] },

  { id:"busca-cito",          category:"Atenção Primária", subcategory:"Busca Ativa", order:153, iconName:"Activity",
    title:"Busca Ativa — Citopatológico", route:"/busca-ativa/cito",
    description:"Busca ativa de mulheres com citopatológico em atraso",
    keywords:["busca ativa","citopatológico","colo","útero","papanicolau","rastreio","câncer"] },

  { id:"busca-ia",            category:"Atenção Primária", subcategory:"Busca Ativa", order:154, iconName:"Brain", isNew:true,
    title:"Busca Ativa · IA", route:"/busca-ativa-ia",
    description:"Busca ativa com inteligência artificial para priorização de usuários",
    keywords:["busca ativa","ia","inteligência artificial","priorização","algoritmo","machine learning"] },

  // ACS
  { id:"acs-painel",          category:"Atenção Primária", subcategory:"ACS", order:160, iconName:"BarChart3",
    title:"Painel do ACS", route:"/acs/painel",
    description:"Painel de monitoramento dos Agentes Comunitários de Saúde em tempo real",
    keywords:["acs","agente comunitário","saúde","painel","monitoramento","visita","esus pec","microárea"] },

  { id:"acs-cadastros",       category:"Atenção Primária", subcategory:"ACS", order:161, iconName:"Users",
    title:"Cadastros do Cidadão", route:"/acs/cadastros-cid",
    description:"Fichas de cadastro individual dos cidadãos cadastrados pelos ACS",
    keywords:["acs","cadastro","cidadão","individual","ficha","esus","cns","cpf"] },

  { id:"acs-visitas",         category:"Atenção Primária", subcategory:"ACS", order:162, iconName:"MapPin",
    title:"Visitas Domiciliares", route:"/acs/visitas-cidadao",
    description:"Registro e acompanhamento de visitas domiciliares dos ACS",
    keywords:["acs","visita","domiciliar","domicílio","registro","esus","agente"] },

  { id:"acs-mapa",            category:"Atenção Primária", subcategory:"ACS", order:163, iconName:"Map",
    title:"Mapa de Visitas ACS", route:"/acs/mapa-visitas",
    description:"Mapa georreferenciado de visitas domiciliares dos ACS",
    keywords:["acs","mapa","visita","georreferenciado","microárea","território"] },

  { id:"acs-registrar",       category:"Atenção Primária", subcategory:"ACS", order:164, iconName:"ClipboardCheck",
    title:"Registrar Visita ACS", route:"/acs/registrar-visita",
    description:"Formulário de registro de visita domiciliar pelo ACS",
    keywords:["acs","registrar","visita","formulário","domiciliar","novo registro"] },

  // Outros da APS
  { id:"acolhimento",         category:"Atenção Primária", order:170, iconName:"Clock",
    title:"Acolhimento / Classificação de Risco", shortTitle:"Acolhimento", route:"/acolhimento",
    description:"Acolhimento e classificação de risco na atenção primária",
    keywords:["acolhimento","classificação","risco","manchester","triagem","urgência","recepção"] },

  { id:"matriz-normativa",    category:"Atenção Primária", order:171, iconName:"BookOpen",
    title:"Matriz Normativa APS", route:"/matriz-normativa-aps",
    description:"Matriz de normativas e portarias da Atenção Primária à Saúde",
    keywords:["matriz","normativa","portaria","aps","legislação","norma","regulação"] },

  { id:"nasf",                category:"Atenção Primária", order:172, iconName:"Users",
    title:"NASF / eMulti", route:"/nasf",
    description:"Núcleo Ampliado de Saúde da Família e Atenção Básica / Equipe Multiprofissional",
    keywords:["nasf","emulti","multiprofissional","nucleo","saúde família","equipe multi","nas","nasfab"] },

  { id:"academia-saude",      category:"Atenção Primária", order:173, iconName:"Activity",
    title:"Academia da Saúde", route:"/academia-saude",
    description:"Programa Academia da Saúde — atividade física e promoção da saúde",
    keywords:["academia","saúde","atividade física","promoção","exercício","polo"] },

  { id:"pics",                category:"Atenção Primária", order:174, iconName:"Sparkles",
    title:"PICS", route:"/pics-apui",
    description:"Práticas Integrativas e Complementares em Saúde",
    keywords:["pics","práticas integrativas","complementares","acupuntura","homeopatia","fitoterapia","meditação"] },

  { id:"pse",                 category:"Atenção Primária", order:175, iconName:"School",
    title:"Saúde na Escola (PSE)", shortTitle:"PSE", route:"/saude-escolar-pse-apui",
    description:"Programa Saúde na Escola — ações de saúde em ambiente escolar",
    keywords:["pse","saúde escola","escolar","criança","adolescente","programa","educação"] },

  // ── Financeiro ───────────────────────────────────────────
  { id:"financeiro",          category:"Financeiro e Gestão Fiscal", order:200, iconName:"DollarSign",
    title:"Painel Financeiro", route:"/financeiro", roles:ROLES_FIN,
    description:"Painel consolidado de recursos financeiros da saúde municipal",
    keywords:["financeiro","painel","recursos","receita","despesa","orçamento","FMS","fundo"] },

  { id:"repasses-aps",        category:"Financeiro e Gestão Fiscal", order:201, iconName:"TrendingUp", highlight:true,
    title:"Repasses APS — Apuí/AM", shortTitle:"Repasses FNS", route:"/repasses-aps-apui", roles:ROLES_FIN,
    description:"Transferências mensais do FNS para APS — Apuí/AM — OBs, portarias e contas bancárias",
    keywords:["repasse","fns","fundo nacional saúde","transferência","ordem bancária","ob","portaria","conta","agência","banco","fundo a fundo","apuí","recurso","parcela","mensal","aps","financeiro","cofinanciamento"] },

  { id:"fns",                 category:"Financeiro e Gestão Fiscal", subcategory:"FNS / Convênios", order:210, iconName:"Clipboard",
    title:"Consolidado de Convênios FNS", shortTitle:"Convênios FNS", route:"/fns", roles:ROLES_FIN,
    description:"Consolidado de convênios e transferências do Fundo Nacional de Saúde",
    keywords:["fns","convênio","consolidado","transferência","federal","saúde","fundo nacional","recurso","consultafns"] },

  { id:"portarias-fns",       category:"Financeiro e Gestão Fiscal", subcategory:"FNS / Convênios", order:211, iconName:"FileText",
    title:"Portarias FNS", route:"/portarias", roles:ROLES_FIN,
    description:"Portarias ministeriais que regulamentam transferências do FNS",
    keywords:["portaria","fns","ministerial","regulamentação","norma","legislação","número portaria"] },

  { id:"execucao-bloco",      category:"Financeiro e Gestão Fiscal", subcategory:"FNS / Convênios", order:212, iconName:"DollarSign",
    title:"Execução por Bloco", route:"/execucao", roles:ROLES_FIN,
    description:"Execução financeira por bloco de financiamento do SUS",
    keywords:["execução","bloco","financiamento","sus","atenção básica","média","alta","vigilância","assistência"] },

  { id:"emendas",             category:"Financeiro e Gestão Fiscal", subcategory:"FNS / Convênios", order:213, iconName:"Landmark",
    title:"Emendas Parlamentares", route:"/emendas", roles:ROLES_FIN,
    description:"Acompanhamento de emendas parlamentares destinadas à saúde",
    keywords:["emenda","parlamentar","deputado","senador","congresso","câmara","convênio","recurso"] },

  { id:"investsus",           category:"Financeiro e Gestão Fiscal", subcategory:"FNS / Convênios", order:214, iconName:"TrendingUp",
    title:"InvestSUS — Propostas/Execução", shortTitle:"InvestSUS", route:"/investsus", roles:ROLES_FIN,
    description:"Propostas, emendas e execução financeira via InvestSUS (Ministério da Saúde)",
    keywords:["investsus","proposta","emenda","execução","ministério saúde","ms","convênio","instrumento","parlamentar","recurso","indicado","aprovado","pago"] },

  { id:"siops",               category:"Financeiro e Gestão Fiscal", order:220, iconName:"Target",
    title:"SIOPS / Mínimo Constitucional", shortTitle:"SIOPS", route:"/siops", roles:ROLES_FIN,
    description:"Sistema de Informações sobre Orçamentos Públicos em Saúde — mínimo constitucional 15%",
    keywords:["siops","mínimo constitucional","15%","orçamento","saúde","aplicação","comprovação","receita","lcms"] },

  { id:"siconfi",             category:"Financeiro e Gestão Fiscal", order:221, iconName:"Building2",
    title:"SICONFI", route:"/siconfi", roles:ROLES_FIN,
    description:"Sistema de Informações Contábeis e Fiscais do Setor Público Brasileiro",
    keywords:["siconfi","contabilidade","fiscal","prestação de contas","tesouro","secretaria","rreo","rgf","dfato"] },

  { id:"rreo",                category:"Financeiro e Gestão Fiscal", order:222, iconName:"FileText",
    title:"RREO Anexo 12", route:"/rreo-anexo12", roles:ROLES_FIN,
    description:"Relatório Resumido da Execução Orçamentária — Anexo 12 de Saúde",
    keywords:["rreo","anexo 12","execução","orçamentária","relatório","siops","lrf","responsabilidade fiscal"] },

  { id:"ppa-loa",             category:"Financeiro e Gestão Fiscal", order:223, iconName:"ClipboardList",
    title:"PPA / LOA", route:"/ppa-loa", roles:ROLES_FIN,
    description:"Plano Plurianual e Lei Orçamentária Anual de saúde",
    keywords:["ppa","loa","plano plurianual","orçamento","anual","lei","previsão","receita","despesa"] },

  { id:"regulacao-mac",       category:"Financeiro e Gestão Fiscal", order:224, iconName:"ArrowLeftRight",
    title:"Regulação MAC", route:"/regulacao-mac", roles:ROLES_FIN,
    description:"Regulação de teto de Média e Alta Complexidade — MAC",
    keywords:["mac","média","alta complexidade","regulação","teto","recurso","ambulatorial","hospitalar"] },

  { id:"caf-fin",             category:"Financeiro e Gestão Fiscal", order:225, iconName:"TrendingUp",
    title:"CAF — Cofinanciamento", shortTitle:"CAF", route:"/caf", roles:ROLES_FIN,
    description:"Cofinanciamento Estadual e Federal de Ações de Saúde — CAF",
    keywords:["caf","cofinanciamento","estadual","federal","recurso","assistência farmacêutica","cbaf","componente básico"] },

  { id:"transparencia",       category:"Financeiro e Gestão Fiscal", order:226, iconName:"Globe",
    title:"Transparência LAI", route:"/painel-transparencia", roles:ROLES_FIN,
    description:"Painel de transparência — Lei de Acesso à Informação",
    keywords:["transparência","lai","acesso informação","portal","público","divulgação","dados abertos"] },

  { id:"tce-tcu",             category:"Financeiro e Gestão Fiscal", order:227, iconName:"Shield",
    title:"Relatório TCE / TCU", route:"/relatorio-tce-tcu", roles:ROLES_FIN,
    description:"Relatórios de prestação de contas para TCE e TCU",
    keywords:["tce","tcu","tribunal","contas","prestação","relatório","auditoria","controle externo"] },

  { id:"fundo-municipal",     category:"Financeiro e Gestão Fiscal", order:228, iconName:"Landmark",
    title:"Fundo Municipal de Saúde", shortTitle:"Fundo Municipal", route:"/fundo-municipal-saude-apui", roles:ROLES_FIN,
    description:"Gestão do Fundo Municipal de Saúde de Apuí — FMS",
    keywords:["fundo","municipal","saúde","fms","conta bancária","recurso","apuí","financiamento"] },

  // ── Planejamento ─────────────────────────────────────────
  { id:"plano-municipal",     category:"Planejamento e Prestação de Contas", order:300, iconName:"ClipboardList",
    title:"Plano Municipal de Saúde", shortTitle:"Plano Municipal", route:"/plano-municipal-saude",
    description:"Plano Municipal de Saúde — PMS — instrumento de planejamento quadrienal",
    keywords:["plano municipal","saúde","pms","planejamento","quadrienal","metas","objetivos"] },

  { id:"planejamento",        category:"Planejamento e Prestação de Contas", order:301, iconName:"ClipboardList",
    title:"Planejamento em Saúde", route:"/planejamento",
    description:"Módulo de planejamento estratégico em saúde pública municipal",
    keywords:["planejamento","estratégico","saúde","metas","objetivos","programa"] },

  { id:"rdqa",                category:"Planejamento e Prestação de Contas", order:302, iconName:"Calendar",
    title:"RDQA — Relatório Quadrimestral", shortTitle:"RDQA", route:"/rdqa",
    description:"Relatório Detalhado do Quadrimestre Anterior — prestação de contas ao Conselho",
    keywords:["rdqa","quadrimestre","relatório","prestação de contas","conselho","saúde","audiência","detalhado","anterior"] },

  { id:"plano-acao",          category:"Planejamento e Prestação de Contas", order:303, iconName:"ClipboardList",
    title:"Plano de Ação", route:"/plano-acao",
    description:"Plano de ação municipal para cumprimento de metas de saúde",
    keywords:["plano","ação","meta","cumprimento","prazo","responsável","monitoramento"] },

  { id:"relatorio-gestao",    category:"Planejamento e Prestação de Contas", order:304, iconName:"FileText",
    title:"Relatório Anual de Gestão", shortTitle:"RAG", route:"/relatorio-gestao",
    description:"Relatório Anual de Gestão — RAG — prestação de contas anual ao Conselho de Saúde",
    keywords:["rag","relatório","anual","gestão","prestação de contas","conselho","digisus","digiSUS","siops"] },

  { id:"contratos",           category:"Planejamento e Prestação de Contas", order:305, iconName:"FileText",
    title:"Contratos e Licitações", shortTitle:"Contratos", route:"/gestao-contratos",
    description:"Gestão de contratos, licitações e compras públicas de saúde",
    keywords:["contratos","licitação","compras","pregão","dispensa","fornecedor","fiscal","prestação"] },

  { id:"conselho-saude",      category:"Planejamento e Prestação de Contas", order:306, iconName:"Users",
    title:"Conselho Municipal de Saúde", shortTitle:"Conselho de Saúde", route:"/conselho-saude-apui",
    description:"Conselho Municipal de Saúde — CMS — controle social e deliberação",
    keywords:["conselho","municipal","saúde","cms","controle social","deliberação","ata","reunião"] },

  { id:"ouvidoria",           category:"Planejamento e Prestação de Contas", order:307, iconName:"MessageSquare",
    title:"Ouvidoria Municipal", route:"/ouvidoria-apui",
    description:"Ouvidoria municipal de saúde — reclamações, sugestões e manifestações",
    keywords:["ouvidoria","reclamação","sugestão","manifestação","cidadão","atendimento","demanda"] },

  { id:"conformidade",        category:"Planejamento e Prestação de Contas", order:308, iconName:"Shield",
    title:"Conformidade Legal", route:"/conformidade",
    description:"Monitoramento de conformidade legal e regulatória da saúde municipal",
    keywords:["conformidade","legal","normativa","regulatória","compliance","legislação","obrigação"] },

  // ── Vigilância em Saúde ──────────────────────────────────
  { id:"vacinas",             category:"Vigilância em Saúde", order:400, iconName:"Syringe",
    title:"Sala de Vacinas / SIPNI", shortTitle:"Vacinas / SIPNI", route:"/sala-vacinas",
    description:"Sala de Vacinas — cobertura vacinal e SIPNI — Sistema de Informações do Programa Nacional de Imunizações",
    keywords:["vacinas","sipni","vacinação","imunização","sala","cobertura","imuno","esquema","campanha","influenza","covid","polio"] },

  { id:"epidemiologia",       category:"Vigilância em Saúde", order:401, iconName:"Activity",
    title:"Epidemiologia / SINAN", route:"/epidemiologia",
    description:"Vigilância epidemiológica — SINAN — Sistema de Informação de Agravos de Notificação",
    keywords:["epidemiologia","sinan","agravo","notificação","surto","investigação","doenças","compulsória"] },

  { id:"monitor-epid",        category:"Vigilância em Saúde", order:402, iconName:"Activity",
    title:"Monitor Epidemiológico", route:"/monitor-epidemiologico",
    description:"Painel em tempo real de monitoramento epidemiológico municipal",
    keywords:["monitor","epidemiológico","tempo real","vigilância","painel","surto","tendência"] },

  { id:"ist-hiv",             category:"Vigilância em Saúde", order:403, iconName:"ShieldCheck",
    title:"IST / HIV / Hepatites", route:"/ist-hiv",
    description:"Vigilância de Infecções Sexualmente Transmissíveis, HIV/AIDS e Hepatites Virais",
    keywords:["ist","hiv","aids","hepatites","sexualmente transmissíveis","sifilis","gonorréia","prevenção"] },

  { id:"sim-sinasc",          category:"Vigilância em Saúde", order:404, iconName:"FileText",
    title:"SIM / SINASC", route:"/sim-sinasc",
    description:"Sistema de Informações sobre Mortalidade e Sistema de Informações de Nascidos Vivos",
    keywords:["sim","sinasc","mortalidade","óbito","nascidos vivos","declaração","do","dn","dnv"] },

  { id:"tb-hanseniase",       category:"Vigilância em Saúde", order:405, iconName:"ShieldCheck",
    title:"TB / Hanseníase", route:"/tb-hanseniase",
    description:"Vigilância e controle da Tuberculose e Hanseníase",
    keywords:["tb","tuberculose","hanseníase","lepra","controle","tratamento","dots","pauci","multi"] },

  { id:"arboviroses",         category:"Vigilância em Saúde", order:406, iconName:"Bug",
    title:"Arboviroses / Dengue", route:"/arboviroses",
    description:"Vigilância de arboviroses — Dengue, Chikungunya e Zika",
    keywords:["dengue","chikungunya","zika","arbovirose","aedes","mosquito","vetor","febre"] },

  { id:"malaria",             category:"Vigilância em Saúde", order:407, iconName:"Bug",
    title:"Malária / Endemias", route:"/malaria-apui",
    description:"Vigilância e controle da Malária e doenças endêmicas em Apuí",
    keywords:["malária","endemia","plasmodium","ivp","api","notificação","amazônia","apuí"] },

  { id:"vetores",             category:"Vigilância em Saúde", order:408, iconName:"Bug",
    title:"Controle de Vetores", route:"/vetores",
    description:"Controle de vetores e animais peçonhentos",
    keywords:["vetor","controle","mosquito","borrifação","lw","larval","roedor","animal peçonhento"] },

  { id:"zoonoses",            category:"Vigilância em Saúde", order:409, iconName:"Bug",
    title:"Zoonoses", route:"/zoonoses-apui",
    description:"Vigilância de zoonoses e doenças transmitidas por animais",
    keywords:["zoonose","animal","raiva","leptospirose","brucelose","leishmaniose","transmissível"] },

  { id:"visa",                category:"Vigilância em Saúde", order:410, iconName:"Shield",
    title:"VISA / Vigilância Sanitária", shortTitle:"Vigilância Sanitária", route:"/visa",
    description:"Vigilância Sanitária — inspeção, licenciamento e controle de riscos sanitários",
    keywords:["visa","vigilância sanitária","inspeção","licenciamento","sanitária","alimento","medicamento","estabelecimento","auto de infração","vig sanit"] },

  { id:"ccih",                category:"Vigilância em Saúde", order:411, iconName:"Shield",
    title:"CCIH / Infecções", shortTitle:"CCIH", route:"/ccih",
    description:"Comissão de Controle de Infecção Hospitalar — IRAS",
    keywords:["ccih","iras","infecção","hospitalar","controle","resistência","bacteremia","sepse"] },

  { id:"vigiagua",            category:"Vigilância em Saúde", order:412, iconName:"Droplets",
    title:"VigiÁgua", route:"/vigiagua",
    description:"Vigilância da qualidade da água para consumo humano — VigiÁgua",
    keywords:["vigiágua","água","qualidade","consumo","potabilidade","cloro","turbidez","fluoreto"] },

  { id:"sisvan",              category:"Vigilância em Saúde", order:413, iconName:"ShoppingBag",
    title:"SISVAN / Nutrição", shortTitle:"SISVAN", route:"/sisvan",
    description:"Sistema de Vigilância Alimentar e Nutricional — SISVAN",
    keywords:["sisvan","nutrição","alimentar","vigilância","imc","peso","altura","anemia","desnutrição","obesidade"] },

  { id:"cancer-rastreio",     category:"Vigilância em Saúde", order:414, iconName:"Activity",
    title:"Rastreio de Câncer", route:"/cancer-rastreio",
    description:"Rastreamento de câncer de mama e colo de útero na atenção primária",
    keywords:["câncer","rastreio","mama","colo útero","citopatológico","mamografia","prevenção","inca"] },

  // ── Assistência Farmacêutica ──────────────────────────────
  { id:"farmacia-basica",     category:"Assistência Farmacêutica", order:500, iconName:"Pill",
    title:"Farmácia Básica", route:"/farmacia",
    description:"Gestão da Assistência Farmacêutica Básica — componente básico — CBAF",
    keywords:["farmácia","básica","cbaf","componente básico","medicamento","dispensação","estoque","farmacia"] },

  { id:"farmacia-especializada", category:"Assistência Farmacêutica", order:501, iconName:"Pill",
    title:"Farmácia Especializada", route:"/farmacia-especializada-apui",
    description:"Componente Especializado da Assistência Farmacêutica — medicamentos de alto custo",
    keywords:["farmácia especializada","ceaf","alto custo","componente especializado","autorização","laudo","protocolo"] },

  { id:"farmacovigilancia",   category:"Assistência Farmacêutica", order:502, iconName:"ShieldCheck",
    title:"Farmacovigilância", route:"/farmacovigilancia-apui",
    description:"Vigilância de reações adversas e segurança de medicamentos",
    keywords:["farmacovigilância","reação adversa","medicamento","segurança","notificação","queixa técnica","anvisa"] },

  { id:"almoxarifado",        category:"Assistência Farmacêutica", order:503, iconName:"Package",
    title:"Almoxarifado", route:"/almoxarifado",
    description:"Gestão de estoque do almoxarifado de saúde — insumos e medicamentos",
    keywords:["almoxarifado","estoque","insumo","material","farmácia","dispensação","requisição","saldo"] },

  // ── Atenção Especializada ─────────────────────────────────
  { id:"especializada",       category:"Atenção Especializada e Regulação", order:600, iconName:"Stethoscope",
    title:"Atenção Especializada", route:"/atencao-especializada",
    description:"Atenção ambulatorial especializada — consultas e procedimentos especializados",
    keywords:["especializada","ambulatorial","consulta","especialidade","referência","encaminhamento","mac"] },

  { id:"urgencia",            category:"Atenção Especializada e Regulação", order:601, iconName:"Activity",
    title:"Urgência / Emergência", route:"/urgencia-emergencia-apui",
    description:"Serviço de Urgência e Emergência — UPA e pronto-atendimento",
    keywords:["urgência","emergência","upa","pronto atendimento","pa","hospital","plantão","samu"] },

  { id:"samu",                category:"Atenção Especializada e Regulação", order:602, iconName:"Radio",
    title:"SAMU 192", route:"/samu",
    description:"Serviço de Atendimento Móvel de Urgência — SAMU 192",
    keywords:["samu","192","móvel","urgência","ambulância","remoção","atendimento","pré-hospitalar"] },

  { id:"sad",                 category:"Atenção Especializada e Regulação", order:603, iconName:"Home",
    title:"Atenção Domiciliar (SAD)", shortTitle:"SAD", route:"/atencao-domiciliar",
    description:"Serviço de Atenção Domiciliar — SAD — cuidados em domicílio",
    keywords:["sad","domiciliar","atenção domiciliar","home care","internação domiciliar","cuidado","equipe"] },

  { id:"regulacao-acesso",    category:"Atenção Especializada e Regulação", order:604, iconName:"Network",
    title:"Regulação e Acesso", route:"/regulacao-acesso-apui",
    description:"Regulação do acesso a serviços especializados — central de regulação",
    keywords:["regulação","acesso","central","fila","espera","especialidade","consulta","encaminhamento"] },

  { id:"leitos",              category:"Atenção Especializada e Regulação", order:605, iconName:"Building2",
    title:"Gestão de Leitos", route:"/gestao-leitos-apui",
    description:"Monitoramento e gestão de leitos hospitalares SUS",
    keywords:["leitos","hospitalar","internação","ocupação","disponibilidade","UTI","enfermaria","regulação"] },

  { id:"telessaude",          category:"Atenção Especializada e Regulação", order:606, iconName:"Monitor",
    title:"TeleSaúde", route:"/telessaude-apui",
    description:"Teleconsultas e telediagnóstico — TeleSaúde Brasil Redes",
    keywords:["telessaúde","teleconsulta","telediagnóstico","telecardio","telepatologia","digital","remoto"] },

  { id:"seguranca-paciente",  category:"Atenção Especializada e Regulação", order:607, iconName:"Shield",
    title:"Segurança do Paciente", route:"/seguranca-paciente-apui",
    description:"Programa de Segurança do Paciente — notificações e incidentes hospitalares",
    keywords:["segurança","paciente","incidente","notificação","evento adverso","hospital","psp","vigipós"] },

  { id:"reabilitacao",        category:"Atenção Especializada e Regulação", order:608, iconName:"Activity",
    title:"Reabilitação", route:"/reabilitacao-apui",
    description:"Serviço de reabilitação física, auditiva, intelectual e visual",
    keywords:["reabilitação","fisioterapia","fonoaudiologia","terapia ocupacional","deficiência","cir","caps"] },

  { id:"hemoterapia",         category:"Atenção Especializada e Regulação", order:609, iconName:"Droplets",
    title:"Hemoterapia / BLH", route:"/hemoterapia",
    description:"Serviços de hemoterapia e Banco de Leite Humano",
    keywords:["hemoterapia","sangue","transfusão","banco","leite","humano","blh","hemocentro","doação"] },

  { id:"transporte-sanitario",category:"Atenção Especializada e Regulação", order:610, iconName:"Truck",
    title:"Transporte Sanitário", route:"/transporte-sanitario",
    description:"Transporte sanitário de pacientes para serviços de saúde",
    keywords:["transporte","sanitário","paciente","ambulância","veículo","deslocamento","tfd","remoção"] },

  { id:"tfd",                 category:"Atenção Especializada e Regulação", order:611, iconName:"ArrowLeftRight",
    title:"TFD — Tratamento Fora do Dom.", shortTitle:"TFD", route:"/tfd-especialidades-apui",
    description:"Tratamento Fora do Domicílio — TFD — para procedimentos de alta complexidade",
    keywords:["tfd","tratamento fora","domicílio","deslocamento","diária","regulação","alta complexidade"] },

  // ── Saúde do Cidadão ─────────────────────────────────────
  { id:"saude-mulher",        category:"Saúde do Cidadão", subcategory:"Saúde da Mulher", order:700, iconName:"Heart",
    title:"Saúde da Mulher", route:"/saude-mulher",
    description:"Atenção integral à saúde da mulher — indicadores e programas",
    keywords:["saúde mulher","feminina","gênero","maternal","reprodutiva","ginecologia","prenatal"] },

  { id:"rede-cegonha",        category:"Saúde do Cidadão", subcategory:"Saúde da Mulher", order:701, iconName:"Baby",
    title:"Rede Cegonha", route:"/rede-cegonha",
    description:"Rede Cegonha — pré-natal, parto e puerpério de qualidade",
    keywords:["rede cegonha","pré-natal","parto","puerpério","maternidade","neonatal","gravidez"] },

  { id:"planejamento-familiar",category:"Saúde do Cidadão", subcategory:"Saúde da Mulher", order:702, iconName:"Users",
    title:"Planejamento Familiar", route:"/planejamento-familiar-apui",
    description:"Ações de planejamento familiar e saúde reprodutiva",
    keywords:["planejamento familiar","reprodutivo","contracepção","laqueadura","vasectomia","gravidez"] },

  { id:"saude-crianca",       category:"Saúde do Cidadão", subcategory:"Saúde da Criança", order:710, iconName:"Baby",
    title:"Saúde da Criança", route:"/saude-crianca",
    description:"Atenção integral à saúde da criança — puericultura e vigilância",
    keywords:["saúde criança","puericultura","crescimento","desenvolvimento","pediatria","infantil","caderneta"] },

  { id:"triagem-neonatal",    category:"Saúde do Cidadão", subcategory:"Saúde da Criança", order:711, iconName:"Baby",
    title:"Triagem Neonatal", route:"/triagem-neonatal-apui",
    description:"Triagem neonatal — Teste do Pezinho e outros testes do recém-nascido",
    keywords:["triagem","neonatal","pezinho","recém-nascido","teste","orelhinha","olhinho","coraçãozinho"] },

  { id:"saude-adolescente",   category:"Saúde do Cidadão", subcategory:"Saúde da Criança", order:712, iconName:"Users",
    title:"Saúde do Adolescente", route:"/saude-adolescente-apui",
    description:"Atenção à saúde do adolescente — 10 a 19 anos",
    keywords:["adolescente","juventude","adolescência","sexual","reprodutiva","drogas","violência"] },

  { id:"saude-mental",        category:"Saúde do Cidadão", subcategory:"Saúde Mental", order:720, iconName:"HeartPulse",
    title:"Saúde Mental", route:"/saude-mental",
    description:"Atenção psicossocial — CAPS, RAPS e saúde mental comunitária",
    keywords:["saúde mental","psicossocial","caps","raps","transtorno","depressão","ansiedade","psiquiatria","psicologia"] },

  { id:"raps",                category:"Saúde do Cidadão", subcategory:"Saúde Mental", order:721, iconName:"Network",
    title:"RAPS", route:"/raps",
    description:"Rede de Atenção Psicossocial — fluxo e pontos de atenção",
    keywords:["raps","rede","psicossocial","caps","ubs","hospital","leitos","mental","álcool","drogas"] },

  { id:"caps-ad",             category:"Saúde do Cidadão", subcategory:"Saúde Mental", order:722, iconName:"Activity",
    title:"CAPS AD", route:"/caps-ad",
    description:"Centro de Atenção Psicossocial Álcool e Drogas — CAPS AD",
    keywords:["caps","ad","álcool","drogas","dependência","química","psicossocial","substância"] },

  { id:"saude-idoso",         category:"Saúde do Cidadão", order:730, iconName:"UserCheck",
    title:"Saúde do Idoso", route:"/saude-idoso",
    description:"Atenção integral à pessoa idosa — 60 anos ou mais",
    keywords:["idoso","envelhecimento","60 anos","terceira idade","caderneta","geriátrico","fragilidade"] },

  { id:"saude-bucal",         category:"Saúde do Cidadão", order:731, iconName:"Stethoscope",
    title:"Saúde Bucal / CEO", route:"/saude-bucal",
    description:"Atenção em saúde bucal — ESB e Centro de Especialidades Odontológicas",
    keywords:["saúde bucal","odontologia","ceo","esb","dentista","fluorose","cárie","periodontal"] },

  { id:"saude-homem",         category:"Saúde do Cidadão", order:732, iconName:"UserCheck",
    title:"Saúde do Homem", route:"/saude-homem",
    description:"Atenção integral à saúde do homem — prevenção e rastreio",
    keywords:["saúde homem","masculina","próstata","testicular","prevenção","rastreio","câncer"] },

  { id:"saude-trabalhador",   category:"Saúde do Cidadão", order:733, iconName:"Wrench",
    title:"Saúde do Trabalhador", route:"/saude-trabalhador-apui",
    description:"Saúde do trabalhador — CEREST e vigilância de ambientes de trabalho",
    keywords:["trabalhador","saúde","cerest","trabalho","ocupacional","acidente","doença ocupacional"] },

  { id:"saude-lgbtqia",       category:"Saúde do Cidadão", order:734, iconName:"Smile",
    title:"Saúde LGBTQIA+", route:"/saude-lgbtqia-apui",
    description:"Atenção à saúde da população LGBTQIA+ e diversidade sexual",
    keywords:["lgbtqia","diversidade","sexual","trans","gay","lésbica","bissexual","identidade","gênero"] },

  { id:"hiperdia",            category:"Saúde do Cidadão", order:735, iconName:"Activity",
    title:"HiperDia", route:"/hiperdia-apui",
    description:"HiperDia — controle e acompanhamento de hipertensos e diabéticos",
    keywords:["hiperdia","hipertensão","diabetes","crônico","pressão","glicemia","has","dm","acompanhamento"] },

  { id:"leishmaniose",        category:"Saúde do Cidadão", order:736, iconName:"Bug",
    title:"Leishmaniose", route:"/leishmaniose",
    description:"Vigilância e controle de Leishmaniose Visceral e Tegumentar",
    keywords:["leishmaniose","visceral","tegumentar","calazar","lv","lt","vetor","flebótomo","apuí"] },

  { id:"saude-indigena",      category:"Saúde do Cidadão", order:737, iconName:"MapPin",
    title:"Saúde Indígena e Ribeirinha", route:"/saude-indigena-apui",
    description:"Atenção à saúde de populações indígenas e ribeirinhas de Apuí",
    keywords:["indígena","ribeirinha","sesai","dsei","povo","comunidade","floresta","rio","aldeia","apuí"] },

  // ── Central de Inconsistências ────────────────────────────
  { id:"inconsistencias",     category:"Central de Inconsistências", order:800, iconName:"AlertTriangle", highlight:true,
    title:"Central de Inconsistências", route:"/inconsistencias",
    description:"Alertas de divergências, erros, riscos e pendências que podem causar perda de recursos",
    keywords:["inconsistência","erro","divergência","alerta","pendência","risco","perda recurso","rejeição","auditoria","divergência","validação","conformidade","irregularidade"] },

  { id:"score-risco-esf",     category:"Central de Inconsistências", order:801, iconName:"ShieldAlert",
    title:"Score de Risco ESF", route:"/score-risco-esf",
    description:"Score de risco por Equipe de Saúde da Família — priorização de correções",
    keywords:["score","risco","esf","equipe","priorização","inconsistência","alerta","vulnerabilidade"] },

  // ── Central de Relatórios ─────────────────────────────────
  { id:"relatorios",          category:"Central de Relatórios", order:900, iconName:"FileText",
    title:"Relatórios", route:"/relatorios",
    description:"Central de relatórios consolidados do sistema de saúde municipal",
    keywords:["relatório","central","consolidado","saúde","dados","exportar","impressão","pdf"] },

  { id:"exportador",          category:"Central de Relatórios", order:901, iconName:"Download",
    title:"Exportador de Relatórios", route:"/exportador-relatorios",
    description:"Exportação de dados e relatórios em múltiplos formatos",
    keywords:["exportar","relatório","excel","csv","pdf","download","dados","geração"] },

  { id:"relatorio-ersus",     category:"Central de Relatórios", order:902, iconName:"FileText",
    title:"Relatório ERSUS 360", route:"/relatorio-ersus",
    description:"Relatório completo de desempenho gerado pelo ERSUS 360",
    keywords:["relatório","ersus","360","desempenho","completo","municipal","gestão"] },

  { id:"mapa-sanitario",      category:"Central de Relatórios", order:903, iconName:"MapPin",
    title:"Mapa Sanitário", route:"/mapa-sanitario",
    description:"Mapa sanitário com distribuição de serviços e indicadores por território",
    keywords:["mapa","sanitário","território","serviço","distribuição","geográfico","indicadores"] },

  { id:"linha-tempo",         category:"Central de Relatórios", order:904, iconName:"Clock",
    title:"Linha do Tempo do Cidadão", route:"/linha-tempo-cidadao",
    description:"Linha do tempo com histórico de atendimentos do cidadão",
    keywords:["linha do tempo","cidadão","histórico","atendimento","prontuário","longitudinal","e-SUS"] },

  { id:"saude-digital",       category:"Central de Relatórios", order:905, iconName:"Network",
    title:"Saúde Digital e-SUS", route:"/saude-digital-esus",
    description:"Painel de saúde digital e integrações com o e-SUS PEC",
    keywords:["saúde digital","esus","pec","digital","integração","tecnologia","prontuário eletrônico"] },

  // ── Administração do Sistema ──────────────────────────────
  { id:"rh",                  category:"Administração do Sistema", order:1000, iconName:"UserCog",
    title:"Recursos Humanos", shortTitle:"RH", route:"/rh", roles:ROLES_RH,
    description:"Gestão de recursos humanos — equipes e servidores da saúde municipal",
    keywords:["rh","recursos humanos","servidores","funcionários","equipes","carga horária","escalas"] },

  { id:"folha-pagamento",     category:"Administração do Sistema", order:1001, iconName:"DollarSign",
    title:"Folha de Pagamento", route:"/folha-pagamento", roles:ROLES_RH,
    description:"Gestão da folha de pagamento do setor saúde",
    keywords:["folha","pagamento","salário","remuneração","proventos","desconto","contracheque"] },

  { id:"absenteismo",         category:"Administração do Sistema", order:1002, iconName:"UserCog",
    title:"Absenteísmo / RHS", route:"/absenteismo-apui", roles:ROLES_RH,
    description:"Monitoramento de absenteísmo e gestão da força de trabalho em saúde",
    keywords:["absenteísmo","falta","ausência","licença","atestado","workforce","rhs","força trabalho"] },

  { id:"cadastros-mestres",   category:"Administração do Sistema", order:1003, iconName:"Layers",
    title:"Cadastros Mestres", route:"/cadastros", roles:ROLES_RH,
    description:"Gestão de cadastros mestres — unidades, profissionais e serviços",
    keywords:["cadastro","mestre","unidade","estabelecimento","cnes","profissional","serviço","configuração"] },

  { id:"usuarios",            category:"Administração do Sistema", order:1004, iconName:"Users",
    title:"Gestão de Usuários", shortTitle:"Usuários", route:"/usuarios", roles:ROLES_USR,
    description:"Criação, edição e controle de acesso de usuários do sistema",
    keywords:["usuário","gestão","acesso","perfil","permissão","criação","senha","autenticação","login"] },

  { id:"siaps",               category:"Administração do Sistema", order:1005, iconName:"Globe",
    title:"eGestor / SIAPS", shortTitle:"eGestor", route:"/siaps",
    description:"eGestor APS — SIAPS — financiamento federal da Atenção Primária por competência",
    keywords:["egestor","siaps","aps","financiamento","competência","parcela","equipe","esf","eap","saúde bucal","nasf","emulti","acs","cofinanciamento","federal"] },

  { id:"integracoes",         category:"Administração do Sistema", order:1006, iconName:"Plug", highlight:true,
    title:"Painel de Integrações", shortTitle:"Integrações", route:"/integracoes",
    description:"Painel de status e configuração de integrações com sistemas externos",
    keywords:["integração","api","webhook","sistema","externo","rnds","esus","sisab","sinan","conectividade"] },

  { id:"auditoria",           category:"Administração do Sistema", order:1007, iconName:"Shield",
    title:"Auditoria e Controle", shortTitle:"Auditoria", route:"/auditoria", roles:ROLES_AUD,
    description:"Auditoria de acessos, alterações e controle interno do sistema",
    keywords:["auditoria","controle","log","acesso","alteração","rastreabilidade","trilha","interno"] },

  { id:"gateway-rnds",        category:"Administração do Sistema", order:1008, iconName:"Network",
    title:"Gateway RNDS · FHIR R4", route:"/gateway-rnds", roles:ROLES_AUD,
    description:"Gateway de integração com a Rede Nacional de Dados em Saúde — FHIR R4",
    keywords:["rnds","rede nacional","dados","saúde","fhir","r4","gateway","prontuário","interoperabilidade"] },

  { id:"integracao-pec",      category:"Administração do Sistema", order:1009, iconName:"Plug",
    title:"Integração PEC e-SUS", route:"/integracao-pec", roles:ROLES_AUD,
    description:"Configuração da integração com o Prontuário Eletrônico do Cidadão — e-SUS PEC",
    keywords:["pec","esus","integração","prontuário","configuração","ledi","mivdt","graphql"] },

  { id:"gateway-integracao",  category:"Administração do Sistema", order:1010, iconName:"Shield", highlight:true,
    title:"Integration Gateway", route:"/gateway-integracao", roles:ROLES_AUD,
    description:"Controle central do ERSUS Integration Gateway — RNDS FHIR R4 e LEDI e-SUS APS",
    keywords:["gateway","integração","rnds","ledi","fhir","esus","pausa","diagnóstico","transmissão","certificado","mtls","icp","brasil"] },

  // ── Gestão Operacional ────────────────────────────────────
  { id:"patrimonio",          category:"Gestão Operacional", order:1100, iconName:"Truck",
    title:"Patrimônio", route:"/patrimonio",
    description:"Gestão de patrimônio e bens móveis e imóveis da saúde",
    keywords:["patrimônio","bem","equipamento","tombamento","inventário","ativo","gestão"] },

  { id:"frota",               category:"Gestão Operacional", order:1101, iconName:"Truck",
    title:"Frota", route:"/frota",
    description:"Gestão da frota de veículos da secretaria de saúde",
    keywords:["frota","veículo","carro","ambulância","manutenção","abastecimento","km","motorista"] },

  { id:"obras",               category:"Gestão Operacional", order:1102, iconName:"Building2",
    title:"Obras e Infraestrutura", route:"/obras",
    description:"Gestão de obras de infraestrutura de saúde em andamento",
    keywords:["obras","infraestrutura","construção","reforma","instalação","predial","saúde"] },

  { id:"equipamentos",        category:"Gestão Operacional", order:1103, iconName:"Wrench",
    title:"Equipamentos", route:"/gestao-equipamentos",
    description:"Gestão de equipamentos médicos e hospitalares",
    keywords:["equipamento","médico","hospitalar","manutenção","calibração","registro","anvisa"] },

  { id:"manutencao",          category:"Gestão Operacional", order:1104, iconName:"Wrench",
    title:"Manutenção", route:"/manutencao",
    description:"Ordens de serviço e controle de manutenção predial e de equipamentos",
    keywords:["manutenção","ordem de serviço","reparo","conserto","preventiva","corretiva"] },

  { id:"agenda",              category:"Gestão Operacional", order:1105, iconName:"Calendar",
    title:"Agenda de Gestão", route:"/agenda",
    description:"Agenda de gestão e compromissos da secretaria municipal de saúde",
    keywords:["agenda","compromisso","reunião","calendário","gestão","secretaria"] },

  { id:"documentos",          category:"Gestão Operacional", order:1106, iconName:"FileText",
    title:"Documentos", route:"/documentos",
    description:"Gestão eletrônica de documentos oficiais e administrativos",
    keywords:["documento","arquivo","ofício","memorando","circular","gestão","ged","digital"] },

  { id:"cme",                 category:"Gestão Operacional", order:1107, iconName:"Thermometer",
    title:"CME", route:"/cme",
    description:"Central de Material e Esterilização — controle de materiais esterilizados",
    keywords:["cme","esterilização","material","central","autoclave","biossegurança","hospital"] },

  { id:"pgrss",               category:"Gestão Operacional", order:1108, iconName:"Trash2",
    title:"PGRSS", route:"/pgrss",
    description:"Plano de Gerenciamento de Resíduos de Serviços de Saúde",
    keywords:["pgrss","resíduo","lixo","descarte","infectante","perfuro-cortante","ambiental","biológico"] },

  { id:"alertas",             category:"Gestão Operacional", order:1109, iconName:"AlertTriangle",
    title:"Central de Alertas", route:"/alertas",
    description:"Central de alertas operacionais e críticos do sistema",
    keywords:["alerta","crítico","operacional","notificação","urgente","central","monitoramento"] },

  { id:"notificacoes",        category:"Gestão Operacional", order:1110, iconName:"Bell",
    title:"Centro de Notificações", route:"/notificacoes",
    description:"Central de notificações e avisos do sistema para usuários",
    keywords:["notificação","aviso","mensagem","central","alerta","comunicado","sistema"] },
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
