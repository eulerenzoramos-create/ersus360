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

  // ══════════ Agentes Comunitários de Saúde ══════════

  { id:"acs-cadastros",       category:"Agentes Comunitários de Saúde", order:161, iconName:"Users",
    title:"Cadastros do Cidadão", route:"/acs/cadastros-cid",
    description:"Fichas de cadastro individual dos cidadãos cadastrados pelos ACS",
    keywords:["acs","cadastro","cidadão","individual","ficha","esus","cns","cpf"] },

  { id:"acs-mapa",            category:"Agentes Comunitários de Saúde", order:163, iconName:"Map",
    title:"Mapa de Visitas ACS", route:"/acs/mapa-visitas",
    description:"Mapa georreferenciado de visitas domiciliares dos ACS",
    keywords:["acs","mapa","visita","georreferenciado","microárea","território"] },

  { id:"acs-painel",          category:"Agentes Comunitários de Saúde", order:160, iconName:"BarChart3",
    title:"Painel do ACS", route:"/acs/painel",
    description:"Painel de monitoramento dos Agentes Comunitários de Saúde em tempo real",
    keywords:["acs","agente comunitário","saúde","painel","monitoramento","visita","esus pec","microárea"] },

  { id:"acs-registrar",       category:"Agentes Comunitários de Saúde", order:164, iconName:"ClipboardCheck",
    title:"Registrar Visita ACS", route:"/acs/registrar-visita",
    description:"Formulário de registro de visita domiciliar pelo ACS",
    keywords:["acs","registrar","visita","formulário","domiciliar","novo registro"] },

  { id:"acs-visitas",         category:"Agentes Comunitários de Saúde", order:162, iconName:"MapPin",
    title:"Visitas Domiciliares", route:"/acs/visitas-cidadao",
    description:"Registro e acompanhamento de visitas domiciliares dos ACS",
    keywords:["acs","visita","domiciliar","domicílio","registro","esus","agente"] },


  // ══════════ Vigilância em Saúde ══════════

  { id:"arboviroses",         category:"Vigilância em Saúde", order:406, iconName:"Bug",
    title:"Arboviroses / Dengue", route:"/arboviroses",
    description:"Vigilância de arboviroses — Dengue, Chikungunya e Zika",
    keywords:["dengue","chikungunya","zika","arbovirose","aedes","mosquito","vetor","febre"] },

  { id:"ccih",                category:"Vigilância em Saúde", order:411, iconName:"Shield",
    title:"CCIH / Infecções", shortTitle:"CCIH", route:"/ccih",
    description:"Comissão de Controle de Infecção Hospitalar — IRAS",
    keywords:["ccih","iras","infecção","hospitalar","controle","resistência","bacteremia","sepse"] },

  { id:"vetores",             category:"Vigilância em Saúde", order:408, iconName:"Bug",
    title:"Controle de Vetores", route:"/vetores",
    description:"Controle de vetores e animais peçonhentos",
    keywords:["vetor","controle","mosquito","borrifação","lw","larval","roedor","animal peçonhento"] },

  { id:"epidemiologia",       category:"Vigilância em Saúde", order:401, iconName:"Activity",
    title:"Epidemiologia / SINAN", route:"/epidemiologia",
    description:"Vigilância epidemiológica — SINAN — Sistema de Informação de Agravos de Notificação",
    keywords:["epidemiologia","sinan","agravo","notificação","surto","investigação","doenças","compulsória"] },

  { id:"ist-hiv",             category:"Vigilância em Saúde", order:403, iconName:"ShieldCheck",
    title:"IST / HIV / Hepatites", route:"/ist-hiv",
    description:"Vigilância de Infecções Sexualmente Transmissíveis, HIV/AIDS e Hepatites Virais",
    keywords:["ist","hiv","aids","hepatites","sexualmente transmissíveis","sifilis","gonorréia","prevenção"] },

  { id:"malaria",             category:"Vigilância em Saúde", order:407, iconName:"Bug",
    title:"Malária / Endemias", route:"/malaria-apui",
    description:"Vigilância e controle da Malária e doenças endêmicas em Apuí",
    keywords:["malária","endemia","plasmodium","ivp","api","notificação","amazônia","apuí"] },

  { id:"monitor-epid",        category:"Vigilância em Saúde", order:402, iconName:"Activity",
    title:"Monitor Epidemiológico", route:"/monitor-epidemiologico",
    description:"Painel em tempo real de monitoramento epidemiológico municipal",
    keywords:["monitor","epidemiológico","tempo real","vigilância","painel","surto","tendência"] },

  { id:"cancer-rastreio",     category:"Vigilância em Saúde", order:414, iconName:"Activity",
    title:"Rastreio de Câncer", route:"/cancer-rastreio",
    description:"Rastreamento de câncer de mama e colo de útero na atenção primária",
    keywords:["câncer","rastreio","mama","colo útero","citopatológico","mamografia","prevenção","inca"] },

  { id:"vacinas",             category:"Vigilância em Saúde", order:400, iconName:"Syringe",
    title:"Sala de Vacinas / SIPNI", shortTitle:"Vacinas / SIPNI", route:"/sala-vacinas",
    description:"Sala de Vacinas — cobertura vacinal e SIPNI — Sistema de Informações do Programa Nacional de Imunizações",
    keywords:["vacinas","sipni","vacinação","imunização","sala","cobertura","imuno","esquema","campanha","influenza","covid","polio"] },

  { id:"sim-sinasc",          category:"Vigilância em Saúde", order:404, iconName:"FileText",
    title:"SIM / SINASC", route:"/sim-sinasc",
    description:"Sistema de Informações sobre Mortalidade e Sistema de Informações de Nascidos Vivos",
    keywords:["sim","sinasc","mortalidade","óbito","nascidos vivos","declaração","do","dn","dnv"] },

  { id:"sisvan",              category:"Vigilância em Saúde", order:413, iconName:"ShoppingBag",
    title:"SISVAN / Nutrição", shortTitle:"SISVAN", route:"/sisvan",
    description:"Sistema de Vigilância Alimentar e Nutricional — SISVAN",
    keywords:["sisvan","nutrição","alimentar","vigilância","imc","peso","altura","anemia","desnutrição","obesidade"] },

  { id:"tb-hanseniase",       category:"Vigilância em Saúde", order:405, iconName:"ShieldCheck",
    title:"TB / Hanseníase", route:"/tb-hanseniase",
    description:"Vigilância e controle da Tuberculose e Hanseníase",
    keywords:["tb","tuberculose","hanseníase","lepra","controle","tratamento","dots","pauci","multi"] },

  { id:"vigiagua",            category:"Vigilância em Saúde", order:412, iconName:"Droplets",
    title:"VigiÁgua", route:"/vigiagua",
    description:"Vigilância da qualidade da água para consumo humano — VigiÁgua",
    keywords:["vigiágua","água","qualidade","consumo","potabilidade","cloro","turbidez","fluoreto"] },

  { id:"visa",                category:"Vigilância em Saúde", order:410, iconName:"Shield",
    title:"VISA / Vigilância Sanitária", shortTitle:"Vigilância Sanitária", route:"/visa",
    description:"Vigilância Sanitária — inspeção, licenciamento e controle de riscos sanitários",
    keywords:["visa","vigilância sanitária","inspeção","licenciamento","sanitária","alimento","medicamento","estabelecimento","auto de infração","vig sanit"] },

  { id:"zoonoses",            category:"Vigilância em Saúde", order:409, iconName:"Bug",
    title:"Zoonoses", route:"/zoonoses-apui",
    description:"Vigilância de zoonoses e doenças transmitidas por animais",
    keywords:["zoonose","animal","raiva","leptospirose","brucelose","leishmaniose","transmissível"] },


  // ══════════ Assistência Farmacêutica ══════════

  { id:"almoxarifado",        category:"Assistência Farmacêutica", order:503, iconName:"Package",
    title:"Almoxarifado", route:"/almoxarifado",
    description:"Gestão de estoque do almoxarifado de saúde — insumos e medicamentos",
    keywords:["almoxarifado","estoque","insumo","material","farmácia","dispensação","requisição","saldo"] },

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


  // ══════════ Atenção Especializada e Regulação ══════════

  { id:"sad",                 category:"Atenção Especializada e Regulação", order:603, iconName:"Home",
    title:"Atenção Domiciliar (SAD)", shortTitle:"SAD", route:"/atencao-domiciliar",
    description:"Serviço de Atenção Domiciliar — SAD — cuidados em domicílio",
    keywords:["sad","domiciliar","atenção domiciliar","home care","internação domiciliar","cuidado","equipe"] },

  { id:"especializada",       category:"Atenção Especializada e Regulação", order:600, iconName:"Stethoscope",
    title:"Atenção Especializada", route:"/atencao-especializada",
    description:"Atenção ambulatorial especializada — consultas e procedimentos especializados",
    keywords:["especializada","ambulatorial","consulta","especialidade","referência","encaminhamento","mac"] },

  { id:"leitos",              category:"Atenção Especializada e Regulação", order:605, iconName:"Building2",
    title:"Gestão de Leitos", route:"/gestao-leitos-apui",
    description:"Monitoramento e gestão de leitos hospitalares SUS",
    keywords:["leitos","hospitalar","internação","ocupação","disponibilidade","UTI","enfermaria","regulação"] },

  { id:"hemoterapia",         category:"Atenção Especializada e Regulação", order:609, iconName:"Droplets",
    title:"Hemoterapia / BLH", route:"/hemoterapia",
    description:"Serviços de hemoterapia e Banco de Leite Humano",
    keywords:["hemoterapia","sangue","transfusão","banco","leite","humano","blh","hemocentro","doação"] },

  { id:"reabilitacao",        category:"Atenção Especializada e Regulação", order:608, iconName:"Activity",
    title:"Reabilitação", route:"/reabilitacao-apui",
    description:"Serviço de reabilitação física, auditiva, intelectual e visual",
    keywords:["reabilitação","fisioterapia","fonoaudiologia","terapia ocupacional","deficiência","cir","caps"] },

  { id:"regulacao-acesso",    category:"Atenção Especializada e Regulação", order:604, iconName:"Network",
    title:"Regulação e Acesso", route:"/regulacao-acesso-apui",
    description:"Regulação do acesso a serviços especializados — central de regulação",
    keywords:["regulação","acesso","central","fila","espera","especialidade","consulta","encaminhamento"] },

  { id:"samu",                category:"Atenção Especializada e Regulação", order:602, iconName:"Radio",
    title:"SAMU 192", route:"/samu",
    description:"Serviço de Atendimento Móvel de Urgência — SAMU 192",
    keywords:["samu","192","móvel","urgência","ambulância","remoção","atendimento","pré-hospitalar"] },

  { id:"seguranca-paciente",  category:"Atenção Especializada e Regulação", order:607, iconName:"Shield",
    title:"Segurança do Paciente", route:"/seguranca-paciente-apui",
    description:"Programa de Segurança do Paciente — notificações e incidentes hospitalares",
    keywords:["segurança","paciente","incidente","notificação","evento adverso","hospital","psp","vigipós"] },

  { id:"telessaude",          category:"Atenção Especializada e Regulação", order:606, iconName:"Monitor",
    title:"TeleSaúde", route:"/telessaude-apui",
    description:"Teleconsultas e telediagnóstico — TeleSaúde Brasil Redes",
    keywords:["telessaúde","teleconsulta","telediagnóstico","telecardio","telepatologia","digital","remoto"] },

  { id:"tfd",                 category:"Atenção Especializada e Regulação", order:611, iconName:"ArrowLeftRight",
    title:"TFD — Tratamento Fora do Dom.", shortTitle:"TFD", route:"/tfd-especialidades-apui",
    description:"Tratamento Fora do Domicílio — TFD — para procedimentos de alta complexidade",
    keywords:["tfd","tratamento fora","domicílio","deslocamento","diária","regulação","alta complexidade"] },

  { id:"transporte-sanitario",category:"Atenção Especializada e Regulação", order:610, iconName:"Truck",
    title:"Transporte Sanitário", route:"/transporte-sanitario",
    description:"Transporte sanitário de pacientes para serviços de saúde",
    keywords:["transporte","sanitário","paciente","ambulância","veículo","deslocamento","tfd","remoção"] },

  { id:"urgencia",            category:"Atenção Especializada e Regulação", order:601, iconName:"Activity",
    title:"Urgência / Emergência", route:"/urgencia-emergencia-apui",
    description:"Serviço de Urgência e Emergência — UPA e pronto-atendimento",
    keywords:["urgência","emergência","upa","pronto atendimento","pa","hospital","plantão","samu"] },


  // ══════════ Financiamento e Recursos ══════════

  { id:"repasses-aps",        category:"Financiamento e Recursos", order:201, iconName:"TrendingUp", highlight:true,
    title:"Controle Financeiro FNS", shortTitle:"Controle Financeiro FNS", route:"/repasses-aps-apui", roles:ROLES_FIN,
    description:"Transferências mensais do FNS para APS — Apuí/AM — OBs, portarias e contas bancárias",
    keywords:["repasse","fns","fundo nacional saúde","transferência","ordem bancária","ob","portaria","conta","agência","banco","fundo a fundo","apuí","recurso","parcela","mensal","aps","financeiro","cofinanciamento"] },

  { id:"financeiro",          category:"Financiamento e Recursos", order:200, iconName:"DollarSign",
    title:"Painel Financeiro", route:"/financeiro", roles:ROLES_FIN,
    description:"Painel consolidado de recursos financeiros da saúde municipal",
    keywords:["financeiro","painel","recursos","receita","despesa","orçamento","FMS","fundo"] },

  // FNS / Convênios

  { id:"fns",                 category:"Financiamento e Recursos", subcategory:"FNS / Convênios", order:210, iconName:"Clipboard",
    title:"Consolidado de Convênios FNS", shortTitle:"Convênios FNS", route:"/fns", roles:ROLES_FIN,
    description:"Consolidado de convênios e transferências do Fundo Nacional de Saúde",
    keywords:["fns","convênio","consolidado","transferência","federal","saúde","fundo nacional","recurso","consultafns"] },

  { id:"emendas",             category:"Financiamento e Recursos", subcategory:"FNS / Convênios", order:213, iconName:"Landmark",
    title:"Emendas Parlamentares", route:"/emendas", roles:ROLES_FIN,
    description:"Acompanhamento de emendas parlamentares destinadas à saúde",
    keywords:["emenda","parlamentar","deputado","senador","congresso","câmara","convênio","recurso"] },

  { id:"execucao-bloco",      category:"Financiamento e Recursos", subcategory:"FNS / Convênios", order:212, iconName:"DollarSign",
    title:"Execução por Bloco", route:"/execucao", roles:ROLES_FIN,
    description:"Execução financeira por bloco de financiamento do SUS",
    keywords:["execução","bloco","financiamento","sus","atenção básica","média","alta","vigilância","assistência"] },

  { id:"investsus",           category:"Financiamento e Recursos", subcategory:"FNS / Convênios", order:214, iconName:"TrendingUp",
    title:"InvestSUS — Propostas/Execução", shortTitle:"InvestSUS", route:"/investsus", roles:ROLES_FIN,
    description:"Propostas, emendas e execução financeira via InvestSUS (Ministério da Saúde)",
    keywords:["investsus","proposta","emenda","execução","ministério saúde","ms","convênio","instrumento","parlamentar","recurso","indicado","aprovado","pago"] },

  { id:"portarias-fns",       category:"Financiamento e Recursos", subcategory:"FNS / Convênios", order:211, iconName:"FileText",
    title:"Portarias FNS", route:"/portarias", roles:ROLES_FIN,
    description:"Portarias ministeriais que regulamentam transferências do FNS",
    keywords:["portaria","fns","ministerial","regulamentação","norma","legislação","número portaria"] },

  { id:"caf-fin",             category:"Financiamento e Recursos", order:225, iconName:"TrendingUp",
    title:"CAF — Cofinanciamento", shortTitle:"CAF", route:"/caf", roles:ROLES_FIN,
    description:"Cofinanciamento Estadual e Federal de Ações de Saúde — CAF",
    keywords:["caf","cofinanciamento","estadual","federal","recurso","assistência farmacêutica","cbaf","componente básico"] },

  { id:"fundo-municipal",     category:"Financiamento e Recursos", order:228, iconName:"Landmark",
    title:"Fundo Municipal de Saúde", shortTitle:"Fundo Municipal", route:"/fundo-municipal-saude-apui", roles:ROLES_FIN,
    description:"Gestão do Fundo Municipal de Saúde de Apuí — FMS",
    keywords:["fundo","municipal","saúde","fms","conta bancária","recurso","apuí","financiamento"] },

  { id:"ppa-loa",             category:"Financiamento e Recursos", order:223, iconName:"ClipboardList",
    title:"PPA / LOA", route:"/ppa-loa", roles:ROLES_FIN,
    description:"Plano Plurianual e Lei Orçamentária Anual de saúde",
    keywords:["ppa","loa","plano plurianual","orçamento","anual","lei","previsão","receita","despesa"] },

  { id:"regulacao-mac",       category:"Financiamento e Recursos", order:224, iconName:"ArrowLeftRight",
    title:"Regulação MAC", route:"/regulacao-mac", roles:ROLES_FIN,
    description:"Regulação de teto de Média e Alta Complexidade — MAC",
    keywords:["mac","média","alta complexidade","regulação","teto","recurso","ambulatorial","hospitalar"] },

  { id:"tce-tcu",             category:"Financiamento e Recursos", order:227, iconName:"Shield",
    title:"Relatório TCE / TCU", route:"/relatorio-tce-tcu", roles:ROLES_FIN,
    description:"Relatórios de prestação de contas para TCE e TCU",
    keywords:["tce","tcu","tribunal","contas","prestação","relatório","auditoria","controle externo"] },

  { id:"rreo",                category:"Financiamento e Recursos", order:222, iconName:"FileText",
    title:"RREO Anexo 12", route:"/rreo-anexo12", roles:ROLES_FIN,
    description:"Relatório Resumido da Execução Orçamentária — Anexo 12 de Saúde",
    keywords:["rreo","anexo 12","execução","orçamentária","relatório","siops","lrf","responsabilidade fiscal"] },

  { id:"siconfi",             category:"Financiamento e Recursos", order:221, iconName:"Building2",
    title:"SICONFI", route:"/siconfi", roles:ROLES_FIN,
    description:"Sistema de Informações Contábeis e Fiscais do Setor Público Brasileiro",
    keywords:["siconfi","contabilidade","fiscal","prestação de contas","tesouro","secretaria","rreo","rgf","dfato"] },

  { id:"siops",               category:"Financiamento e Recursos", order:220, iconName:"Target",
    title:"SIOPS / Mínimo Constitucional", shortTitle:"SIOPS", route:"/siops", roles:ROLES_FIN,
    description:"Sistema de Informações sobre Orçamentos Públicos em Saúde — mínimo constitucional 15%",
    keywords:["siops","mínimo constitucional","15%","orçamento","saúde","aplicação","comprovação","receita","lcms"] },

  { id:"transparencia",       category:"Financiamento e Recursos", order:226, iconName:"Globe",
    title:"Transparência LAI", route:"/painel-transparencia", roles:ROLES_FIN,
    description:"Painel de transparência — Lei de Acesso à Informação",
    keywords:["transparência","lai","acesso informação","portal","público","divulgação","dados abertos"] },


  // ══════════ Sistemas e Integrações ══════════

  { id:"siaps",               category:"Sistemas e Integrações", order:1005, iconName:"Globe",
    title:"eGestor / SIAPS", shortTitle:"eGestor", route:"/siaps",
    description:"eGestor APS — SIAPS — financiamento federal da Atenção Primária por competência",
    keywords:["egestor","siaps","aps","financiamento","competência","parcela","equipe","esf","eap","saúde bucal","nasf","emulti","acs","cofinanciamento","federal"] },

  { id:"gateway-rnds",        category:"Sistemas e Integrações", order:1008, iconName:"Network",
    title:"Gateway RNDS · FHIR R4", route:"/gateway-rnds", roles:ROLES_AUD,
    description:"Gateway de integração com a Rede Nacional de Dados em Saúde — FHIR R4",
    keywords:["rnds","rede nacional","dados","saúde","fhir","r4","gateway","prontuário","interoperabilidade"] },

  { id:"integracao-pec",      category:"Sistemas e Integrações", order:1009, iconName:"Plug",
    title:"Integração PEC e-SUS", route:"/integracao-pec", roles:ROLES_AUD,
    description:"Configuração da integração com o Prontuário Eletrônico do Cidadão — e-SUS PEC",
    keywords:["pec","esus","integração","prontuário","configuração","ledi","mivdt","graphql"] },

  { id:"integracoes",         category:"Sistemas e Integrações", order:1006, iconName:"Plug", highlight:true,
    title:"Painel de Integrações", shortTitle:"Integrações", route:"/integracoes",
    description:"Painel de status e configuração de integrações com sistemas externos",
    keywords:["integração","api","webhook","sistema","externo","rnds","esus","sisab","sinan","conectividade"] },


  // ══════════ Relatórios e Indicadores ══════════

  // Visão Executiva

  { id:"dashboard-executivo", category:"Relatórios e Indicadores", subcategory:"Visão Executiva", order:11, iconName:"Monitor",
    title:"Dashboard Executivo 360°", route:"/dashboard-executivo",
    description:"Visão estratégica 360° de todos os indicadores do município",
    keywords:["dashboard","executivo","360","indicadores","gestão","estratégico"] },

  { id:"ia-gestora",          category:"Relatórios e Indicadores", subcategory:"Visão Executiva", order:16, iconName:"Bot", isNew:true,
    title:"IA Gestora", route:"/ia",
    description:"Inteligência artificial para apoio à decisão em gestão de saúde",
    keywords:["ia","inteligência artificial","ai","machine learning","decisão","algoritmo"] },

  { id:"idsus",               category:"Relatórios e Indicadores", subcategory:"Visão Executiva", order:15, iconName:"Award",
    title:"IDSUS Municipal", route:"/idsus-municipal",
    description:"Índice de Desempenho do SUS a nível municipal",
    keywords:["idsus","índice","sus","desempenho","datasus","monitoramento"] },

  { id:"mapa-desempenho",     category:"Relatórios e Indicadores", subcategory:"Visão Executiva", order:13, iconName:"Map",
    title:"Mapa de Desempenho", route:"/mapa",
    description:"Mapa geográfico de desempenho por indicadores e territórios",
    keywords:["mapa","desempenho","geográfico","território","espacial"] },

  { id:"ranking",             category:"Relatórios e Indicadores", subcategory:"Visão Executiva", order:14, iconName:"BarChart2",
    title:"Ranking Municipal", route:"/ranking",
    description:"Ranking comparativo entre municípios por indicadores de saúde",
    keywords:["ranking","comparativo","municípios","classificação","posição"] },

  { id:"score",               category:"Relatórios e Indicadores", subcategory:"Visão Executiva", order:12, iconName:"Star",
    title:"Score ERSUS 360", route:"/score",
    description:"Pontuação integrada de desempenho do sistema de saúde municipal",
    keywords:["score","pontuação","desempenho","nota","avaliação","ersus"] },

  // Inconsistências e Qualidade

  { id:"inconsistencias",     category:"Relatórios e Indicadores", subcategory:"Inconsistências e Qualidade", order:800, iconName:"AlertTriangle", highlight:true,
    title:"Central de Inconsistências", route:"/inconsistencias",
    description:"Alertas de divergências, erros, riscos e pendências que podem causar perda de recursos",
    keywords:["inconsistência","erro","divergência","alerta","pendência","risco","perda recurso","rejeição","auditoria","divergência","validação","conformidade","irregularidade"] },

  { id:"cnes-xml",            category:"Relatórios e Indicadores", subcategory:"Inconsistências e Qualidade", order:802, iconName:"ClipboardCheck", isNew:true,
    title:"Equipes do CNES (XML SISAB)", shortTitle:"Equipes CNES", route:"/cnes-xml",
    description:"Importa o XML-CNES do SISAB e confere a composição mínima das equipes (eSF, eSB, eMulti)",
    keywords:["cnes","xml","sisab","equipe","ine","lotação","composição","acs","esf","esb","emulti","ribeirinha","scnes","importar"] },

  { id:"indicadores-equipe",  category:"Relatórios e Indicadores", subcategory:"Inconsistências e Qualidade", order:801, iconName:"Users", isNew:true, highlight:true,
    title:"Indicadores por Equipe", shortTitle:"Indicadores por Equipe", route:"/indicadores-equipe",
    description:"Resultado oficial de cada equipe (INE) por indicador, meta, GAP, evolução e atenção necessária",
    keywords:["indicador","equipe","ine","meta","gap","esf","esfr","esb","emulti","qualidade","vínculo","resultado","atenção"] },

  { id:"siaps-relatorios",    category:"Relatórios e Indicadores", subcategory:"Inconsistências e Qualidade", order:803, iconName:"BarChart3", isNew:true,
    title:"Relatórios do SIAPS (importação)", shortTitle:"Relatórios SIAPS", route:"/siaps-relatorios",
    description:"Importa os relatórios de Vínculo (CVAT) e Qualidade baixados no SIAPS, incluindo eSFR",
    keywords:["siaps","cvat","vínculo","qualidade","mais acesso","esfr","ribeirinha","relatório","importar","csv","pontuação"] },

  { id:"score-risco-esf",     category:"Relatórios e Indicadores", subcategory:"Inconsistências e Qualidade", order:801, iconName:"ShieldAlert",
    title:"Score de Risco ESF", route:"/score-risco-esf",
    description:"Score de risco por Equipe de Saúde da Família — priorização de correções",
    keywords:["score","risco","esf","equipe","priorização","inconsistência","alerta","vulnerabilidade"] },

  // Relatórios Gerais

  { id:"relatorios",          category:"Relatórios e Indicadores", subcategory:"Relatórios Gerais", order:900, iconName:"FileText",
    title:"Relatórios", route:"/relatorios",
    description:"Central de relatórios consolidados do sistema de saúde municipal",
    keywords:["relatório","central","consolidado","saúde","dados","exportar","impressão","pdf"] },


  // ══════════ Administração ══════════

  { id:"absenteismo",         category:"Administração", order:1002, iconName:"UserCog",
    title:"Absenteísmo / RHS", route:"/absenteismo-apui", roles:ROLES_RH,
    description:"Monitoramento de absenteísmo e gestão da força de trabalho em saúde",
    keywords:["absenteísmo","falta","ausência","licença","atestado","workforce","rhs","força trabalho"] },

  { id:"auditoria",           category:"Administração", order:1007, iconName:"Shield",
    title:"Auditoria e Controle", shortTitle:"Auditoria", route:"/auditoria", roles:ROLES_AUD,
    description:"Auditoria de acessos, alterações e controle interno do sistema",
    keywords:["auditoria","controle","log","acesso","alteração","rastreabilidade","trilha","interno"] },

  { id:"cadastros-mestres",   category:"Administração", order:1003, iconName:"Layers",
    title:"Cadastros Mestres", route:"/cadastros", roles:ROLES_RH,
    description:"Gestão de cadastros mestres — unidades, profissionais e serviços",
    keywords:["cadastro","mestre","unidade","estabelecimento","cnes","profissional","serviço","configuração"] },

  { id:"contratos",           category:"Administração", order:305, iconName:"FileText",
    title:"Contratos e Licitações", shortTitle:"Contratos", route:"/gestao-contratos",
    description:"Gestão de contratos, licitações e compras públicas de saúde",
    keywords:["contratos","licitação","compras","pregão","dispensa","fornecedor","fiscal","prestação"] },

  { id:"folha-pagamento",     category:"Administração", order:1001, iconName:"DollarSign",
    title:"Folha de Pagamento", route:"/folha-pagamento", roles:ROLES_RH,
    description:"Gestão da folha de pagamento do setor saúde",
    keywords:["folha","pagamento","salário","remuneração","proventos","desconto","contracheque"] },

  { id:"usuarios",            category:"Administração", order:1004, iconName:"Users",
    title:"Gestão de Usuários", shortTitle:"Usuários", route:"/usuarios", roles:ROLES_USR,
    description:"Criação, edição e controle de acesso de usuários do sistema",
    keywords:["usuário","gestão","acesso","perfil","permissão","criação","senha","autenticação","login"] },

  { id:"rh",                  category:"Administração", order:1000, iconName:"UserCog",
    title:"Recursos Humanos", shortTitle:"RH", route:"/rh", roles:ROLES_RH,
    description:"Gestão de recursos humanos — equipes e servidores da saúde municipal",
    keywords:["rh","recursos humanos","servidores","funcionários","equipes","carga horária","escalas"] },

  // Gestão Operacional

  { id:"agenda",              category:"Administração", subcategory:"Gestão Operacional", order:1105, iconName:"Calendar",
    title:"Agenda de Gestão", route:"/agenda",
    description:"Agenda de gestão e compromissos da secretaria municipal de saúde",
    keywords:["agenda","compromisso","reunião","calendário","gestão","secretaria"] },

  { id:"alertas",             category:"Administração", subcategory:"Gestão Operacional", order:1109, iconName:"AlertTriangle",
    title:"Central de Alertas", route:"/alertas",
    description:"Central de alertas operacionais e críticos do sistema",
    keywords:["alerta","crítico","operacional","notificação","urgente","central","monitoramento"] },

  { id:"cme",                 category:"Administração", subcategory:"Gestão Operacional", order:1107, iconName:"Thermometer",
    title:"CME", route:"/cme",
    description:"Central de Material e Esterilização — controle de materiais esterilizados",
    keywords:["cme","esterilização","material","central","autoclave","biossegurança","hospital"] },

  { id:"documentos",          category:"Administração", subcategory:"Gestão Operacional", order:1106, iconName:"FileText",
    title:"Documentos", route:"/documentos",
    description:"Gestão eletrônica de documentos oficiais e administrativos",
    keywords:["documento","arquivo","ofício","memorando","circular","gestão","ged","digital"] },

  { id:"equipamentos",        category:"Administração", subcategory:"Gestão Operacional", order:1103, iconName:"Wrench",
    title:"Equipamentos", route:"/gestao-equipamentos",
    description:"Gestão de equipamentos médicos e hospitalares",
    keywords:["equipamento","médico","hospitalar","manutenção","calibração","registro","anvisa"] },

  { id:"frota",               category:"Administração", subcategory:"Gestão Operacional", order:1101, iconName:"Truck",
    title:"Frota", route:"/frota",
    description:"Gestão da frota de veículos da secretaria de saúde",
    keywords:["frota","veículo","carro","ambulância","manutenção","abastecimento","km","motorista"] },

  { id:"manutencao",          category:"Administração", subcategory:"Gestão Operacional", order:1104, iconName:"Wrench",
    title:"Manutenção", route:"/manutencao",
    description:"Ordens de serviço e controle de manutenção predial e de equipamentos",
    keywords:["manutenção","ordem de serviço","reparo","conserto","preventiva","corretiva"] },

  { id:"obras",               category:"Administração", subcategory:"Gestão Operacional", order:1102, iconName:"Building2",
    title:"Obras e Infraestrutura", route:"/obras",
    description:"Gestão de obras de infraestrutura de saúde em andamento",
    keywords:["obras","infraestrutura","construção","reforma","instalação","predial","saúde"] },

  { id:"patrimonio",          category:"Administração", subcategory:"Gestão Operacional", order:1100, iconName:"Truck",
    title:"Patrimônio", route:"/patrimonio",
    description:"Gestão de patrimônio e bens móveis e imóveis da saúde",
    keywords:["patrimônio","bem","equipamento","tombamento","inventário","ativo","gestão"] },

  { id:"pgrss",               category:"Administração", subcategory:"Gestão Operacional", order:1108, iconName:"Trash2",
    title:"PGRSS", route:"/pgrss",
    description:"Plano de Gerenciamento de Resíduos de Serviços de Saúde",
    keywords:["pgrss","resíduo","lixo","descarte","infectante","perfuro-cortante","ambiental","biológico"] },
];

// ── Utilitários de busca ──────────────────────────────────────────────────────

/** Remove acentos e converte para minúsculas */
export function normalizeText(t: string): string {
  return t.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
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
  "Agentes Comunitários de Saúde",
  "Vigilância em Saúde",
  "Assistência Farmacêutica",
  "Atenção Especializada e Regulação",
  "Financiamento e Recursos",
  "Sistemas e Integrações",
  "Relatórios e Indicadores",
  "Administração",
] as const;

export type Category = (typeof CATEGORIES)[number];
