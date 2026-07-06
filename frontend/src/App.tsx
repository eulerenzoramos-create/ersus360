// src/App.tsx — ERSUS 360 · Sidebar estilo VersaSaúde (3 níveis)
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import {
  Home, BarChart2, Map, ChevronDown, ChevronRight,
  ArrowLeftRight, Target, Building2, Bot, LogOut,
  FileText, DollarSign, FolderOpen, BarChart3, ClipboardList,
  Activity, Pill, ShieldCheck, Truck, Network, MapPin, Users,
  Landmark, Baby, Heart, Stethoscope, Syringe, FlaskConical,
  AlertTriangle, BookOpen, Calendar, Clipboard, UserCheck,
  TrendingUp, PieChart, Layers, Star, Shield, Monitor, UserCog,
  Radio, Globe, ShoppingBag, Bell, Search, MessageSquare, Wrench, Brain, Bug, FlaskRound, Smile, Thermometer, Droplets,
  Wind, Eye, TrendingDown, Trash2, School, Sparkles, Waves, Clock,
} from "lucide-react";

import PainelGestor    from "./pages/PainelGestor";
import Indicadores     from "./pages/Indicadores";
import Modulos         from "./pages/Modulos";
import FnsConvenios    from "./pages/FnsConvenios";
import IAGestora       from "./pages/IAGestora";
import Portarias       from "./pages/Portarias";
import Obras           from "./pages/Obras";
import Execucao        from "./pages/Execucao";
import Documentos      from "./pages/Documentos";
import Alertas         from "./pages/Alertas";
import Relatorios      from "./pages/Relatorios";
import APS             from "./pages/APS";
import Farmacia        from "./pages/Farmacia";
import Planejamento    from "./pages/Planejamento";
import Vigilancia      from "./pages/Vigilancia";
import Municipio       from "./pages/Municipio";
import Usuarios        from "./pages/Usuarios";
import Login           from "./pages/Login";
import Transporte      from "./pages/Transporte";
import Regulacao       from "./pages/Regulacao";
import Emendas         from "./pages/Emendas";
import PrevineBrasil   from "./pages/PrevineBrasil";
import Sus360          from "./pages/Sus360";
import Auditoria       from "./pages/Auditoria";
import CadastrosMestres from "./pages/CadastrosMestres";
import RH              from "./pages/RH";
import BI              from "./pages/BI";
import OCIS            from "./pages/OCIS";
import Patrimonio      from "./pages/Patrimonio";
import PortalCidadao   from "./pages/PortalCidadao";
import PortalGestor    from "./pages/PortalGestor";
import Marketplace     from "./pages/Marketplace";
import MapaDesempenho  from "./pages/MapaDesempenho";
import Epidemiologia   from "./pages/Epidemiologia";
import SIOPS           from "./pages/SIOPS";
import Agenda          from "./pages/Agenda";
import HistoricoAlertas from "./pages/HistoricoAlertas";
import BuscaAtiva       from "./pages/BuscaAtiva";
import RDQA             from "./pages/RDQA";
import ScoreERSUS       from "./pages/ScoreERSUS";
import Conformidade      from "./pages/Conformidade";
import ACSPainel         from "./pages/ACSPainel";
import PainelFinanceiro  from "./pages/PainelFinanceiro";
import PainelGestaoAPS  from "./pages/PainelGestaoAPS";
import SiapsEgestor      from "./pages/SiapsEgestor";
import PainelCAF         from "./pages/PainelCAF";
import Ouvidoria         from "./pages/Ouvidoria";
import Contratos         from "./pages/Contratos";
import RegulacaoMAC      from "./pages/RegulacaoMAC";
import PainelPPALOA      from "./pages/PainelPPALOA";
import Absenteismo        from "./pages/Absenteismo";
import SalaVacinas           from "./pages/SalaVacinas";
import RAPS                  from "./pages/RAPS";
import Manutencao             from "./pages/Manutencao";
import NotificacoesSINAN       from "./pages/NotificacoesSINAN";
import AssistenciaFarmaceutica  from "./pages/AssistenciaFarmaceutica";
import TransporteSanitario     from "./pages/TransporteSanitario";
import ProducaoSISAB           from "./pages/ProducaoSISAB";
import SaudeMulher             from "./pages/SaudeMulher";
import ConselhoSaude           from "./pages/ConselhoSaude";
import SaudeBucal              from "./pages/SaudeBucal";
import SaudeCrianca            from "./pages/SaudeCrianca";
import VigilanciaVISA          from "./pages/VigilanciaVISA";
import ControleVetores         from "./pages/ControleVetores";
import SISVAN                  from "./pages/SISVAN";
import AtencaoDomiciliar       from "./pages/AtencaoDomiciliar";
import SaudeIndigena           from "./pages/SaudeIndigena";
import TbHanseniase            from "./pages/TbHanseniase";
import IstHiv                  from "./pages/IstHiv";
import SaudeIdoso              from "./pages/SaudeIdoso";
import SaudeHomem              from "./pages/SaudeHomem";
import SimSinasc               from "./pages/SimSinasc";
import SaudeTrabalhador        from "./pages/SaudeTrabalhador";
import SaudeMental             from "./pages/SaudeMental";
import UrgenciaEmergencia      from "./pages/UrgenciaEmergencia";
import SaudeAdolescente        from "./pages/SaudeAdolescente";
import HiperDia                from "./pages/HiperDia";
import CancerRastreio          from "./pages/CancerRastreio";
import RedeFrio                from "./pages/RedeFrio";
import Reabilitacao            from "./pages/Reabilitacao";
import FarmaciaEspecializada   from "./pages/FarmaciaEspecializada";
import SaudeAmbiental          from "./pages/SaudeAmbiental";
import GestaoLeitos            from "./pages/GestaoLeitos";
import RegulacaoAcesso         from "./pages/RegulacaoAcesso";
import ControleTabaco          from "./pages/ControleTabaco";
import SaudeOcular             from "./pages/SaudeOcular";
import ICSAP                   from "./pages/ICSAP";
import Hemoterapia             from "./pages/Hemoterapia";
import CCIH                    from "./pages/CCIH";
import SADT                    from "./pages/SADT";
import SaudePrisional          from "./pages/SaudePrisional";
import NutricaoClinica         from "./pages/NutricaoClinica";
import Telessaude              from "./pages/Telessaude";
import Oncologia               from "./pages/Oncologia";
import PGRSS                   from "./pages/PGRSS";
import EducacaoPermanente      from "./pages/EducacaoPermanente";
import Farmacovigilancia       from "./pages/Farmacovigilancia";
import GestaoQualidade         from "./pages/GestaoQualidade";
import SaudeDigital            from "./pages/SaudeDigital";
import CME                    from "./pages/CME";
import PSE                    from "./pages/PSE";
import BLH                    from "./pages/BLH";
import PICS                   from "./pages/PICS";
import Frota                  from "./pages/Frota";
import VigiAgua               from "./pages/VigiAgua";
import NASF                   from "./pages/NASF";
import Zoonoses               from "./pages/Zoonoses";
import SaudeServidor          from "./pages/SaudeServidor";
import PlanejamentoFamiliar   from "./pages/PlanejamentoFamiliar";
import Acolhimento            from "./pages/Acolhimento";
import Judicializacao         from "./pages/Judicializacao";
import SPD                   from "./pages/SPD";
import Contratos              from "./pages/Contratos";
import SAMU                  from "./pages/SAMU";
import PNAE                  from "./pages/PNAE";
import SIOPSDetalhado         from "./pages/SIOPSDetalhado";
import PatSaude               from "./pages/PatSaude";
import Abastecimento          from "./pages/Abastecimento";
import SegurancaPaciente       from "./pages/SegurancaPaciente";
import VisaAlimentos           from "./pages/VisaAlimentos";
import AcademiaSaude           from "./pages/AcademiaSaude";
import Laboratorio             from "./pages/Laboratorio";
import CRIE                   from "./pages/CRIE";
import ProtocoloClinico        from "./pages/ProtocoloClinico";
import CuidadosPaliativos      from "./pages/CuidadosPaliativos";
import ConsultorioRua          from "./pages/ConsultorioRua";
import SaudeRibeirinha         from "./pages/SaudeRibeirinha";
import CEREST                  from "./pages/CEREST";
import CAPSInfanto             from "./pages/CAPSInfanto";
import VigilanciaObito         from "./pages/VigilanciaObito";
import CAPSAD                  from "./pages/CAPSAD";
import SaudeEstomia            from "./pages/SaudeEstomia";
import RedeCegonha             from "./pages/RedeCegonha";
import TriagemNeonatal         from "./pages/TriagemNeonatal";
import ViolenciaDomestica      from "./pages/ViolenciaDomestica";
import Malaria                 from "./pages/Malaria";
import Leishmaniose            from "./pages/Leishmaniose";
import Arboviroses             from "./pages/Arboviroses";
import SaudeIndigena           from "./pages/SaudeIndigena";
import Hanseniase               from "./pages/Hanseniase";
import Tuberculose              from "./pages/Tuberculose";
import DstHiv                  from "./pages/DstHiv";
import Imunizacao               from "./pages/Imunizacao";
import SaudeMental              from "./pages/SaudeMental";
import SaudeBucal               from "./pages/SaudeBucal";
import SaudeOcular              from "./pages/SaudeOcular";
import SaudeAuditiva            from "./pages/SaudeAuditiva";
import Oncologia                from "./pages/Oncologia";
import DCNT                    from "./pages/DCNT";
import Nutricao                 from "./pages/Nutricao";
import Reabilitacao             from "./pages/Reabilitacao";
import AssistFarmaceutica       from "./pages/AssistFarmaceutica";
import SaudeAmbiental           from "./pages/SaudeAmbiental";
import VigEpidemAvancada        from "./pages/VigEpidemAvancada";
import SaudeDigitalEsus         from "./pages/SaudeDigitalEsus";
import GestaoPessoas            from "./pages/GestaoPessoas";
import FundoMunicipal           from "./pages/FundoMunicipal";
import JudicializacaoSaude      from "./pages/JudicializacaoSaude";
import AtencaoEspecializada     from "./pages/AtencaoEspecializada";
import MalariaEndemias          from "./pages/MalariaEndemias";
import VigilanciaNutricional    from "./pages/VigilanciaNutricional";
import SaudeIndigenaApui        from "./pages/SaudeIndigenaApui";
import DcntCronicas             from "./pages/DcntCronicas";
import CancerRastreio           from "./pages/CancerRastreio";
import SaudeBucalMunicipal      from "./pages/SaudeBucalMunicipal";
import SaudeMentalCaps          from "./pages/SaudeMentalCaps";
import RedeCegonha               from "./pages/RedeCegonha";
import ProgramaSaudeEscola       from "./pages/ProgramaSaudeEscola";
import PlanoMunicipalSaude      from "./pages/PlanoMunicipalSaude";
import ScoreMunicipal           from "./pages/ScoreMunicipal";
import GestaoContratosFms       from "./pages/GestaoContratosFms";
import VisaMunicipal            from "./pages/VisaMunicipal";
import ConselhoSaudeApui        from "./pages/ConselhoSaudeApui";
import OuvidoriaApui            from "./pages/OuvidoriaApui";
import TelessaudeApui           from "./pages/TelessaudeApui";
import LaboratorioApui          from "./pages/LaboratorioApui";
import FarmaciaEspecializadaApui from "./pages/FarmaciaEspecializadaApui";
import { SinoAlertas } from "./components/SinoAlertas";

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });

const BLUE = "#1565c0";
const GRAY = "#616161";
const LIGHT_BG = "#f5f5f3";

// ── Helpers de estilo ────────────────────────────────────────────────────────
const navSimpleStyle = (active: boolean) => ({
  display:"flex", alignItems:"center", gap:10, padding:"9px 16px",
  color: active ? BLUE : "#424242", cursor:"pointer",
  background: active ? "#e3f2fd" : "transparent",
  fontSize:13, fontWeight: active ? 600 : 400, textDecoration:"none" as const,
  borderLeft: `3px solid ${active ? BLUE : "transparent"}`,
});

const grp1Style = { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 16px", cursor:"pointer", fontSize:13, fontWeight:500, color:"#212121", borderTop:"1px solid #f0f0f0" };
const grp2Style = { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 16px 8px 28px", cursor:"pointer", fontSize:13, fontWeight:500, color:"#424242" };
const grp3Style = { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 16px 7px 40px", cursor:"pointer", fontSize:13, fontWeight:400, color:"#424242" };

const leaf2Style = (active: boolean) => ({
  display:"flex", alignItems:"center", gap:9, padding:"8px 16px 8px 28px",
  fontSize:13, color: active ? BLUE : GRAY, textDecoration:"none" as const,
  background: active ? "#e3f2fd" : "transparent", fontWeight: active ? 600 : 400,
});
const leaf3Style = (active: boolean) => ({
  display:"flex", alignItems:"center", gap:9, padding:"7px 16px 7px 40px",
  fontSize:13, color: active ? BLUE : GRAY, textDecoration:"none" as const,
  background: active ? "#e3f2fd" : "transparent", fontWeight: active ? 600 : 400,
});
const leaf4Style = (active: boolean) => ({
  display:"flex", alignItems:"center", gap:9, padding:"7px 16px 7px 52px",
  fontSize:13, color: active ? BLUE : GRAY, textDecoration:"none" as const,
  background: active ? "#e3f2fd" : "transparent", fontWeight: active ? 600 : 400,
});

// ── Componentes de acordeão ──────────────────────────────────────────────────
function Acc1({ label, children, open: init=false }: { label:string; children:React.ReactNode; open?:boolean }) {
  const [open,setOpen]=useState(init);
  return (
    <div>
      <div style={grp1Style} onClick={()=>setOpen(o=>!o)}>
        <span>{label}</span>
        {open ? <ChevronDown size={14} color="#9e9e9e"/> : <ChevronRight size={14} color="#9e9e9e"/>}
      </div>
      {open && <div>{children}</div>}
    </div>
  );
}

function Acc2({ label, children, open: init=false }: { label:string; children:React.ReactNode; open?:boolean }) {
  const [open,setOpen]=useState(init);
  return (
    <div>
      <div style={grp2Style} onClick={()=>setOpen(o=>!o)}>
        <span>{label}</span>
        {open ? <ChevronDown size={13} color="#9e9e9e"/> : <ChevronRight size={13} color="#9e9e9e"/>}
      </div>
      {open && <div style={{background:"#fafafa"}}>{children}</div>}
    </div>
  );
}

function Acc3({ label, children, open: init=false }: { label:string; children:React.ReactNode; open?:boolean }) {
  const [open,setOpen]=useState(init);
  return (
    <div>
      <div style={grp3Style} onClick={()=>setOpen(o=>!o)}>
        <span>{label}</span>
        {open ? <ChevronDown size={12} color="#9e9e9e"/> : <ChevronRight size={12} color="#9e9e9e"/>}
      </div>
      {open && <div>{children}</div>}
    </div>
  );
}

function L1({ to, label, Icon, end=false }: { to:string; label:string; Icon:React.ElementType; end?:boolean }) {
  const loc=useLocation(); const active = end ? loc.pathname===to : loc.pathname.startsWith(to);
  return <NavLink to={to} end={end} style={navSimpleStyle(active)}><Icon size={15} color={active?BLUE:"#9e9e9e"}/>{label}</NavLink>;
}
function L2({ to, label, Icon }: { to:string; label:string; Icon:React.ElementType }) {
  const loc=useLocation(); const active=loc.pathname===to;
  return <NavLink to={to} style={leaf2Style(active)}><Icon size={14} color={active?BLUE:"#bdbdbd"}/>{label}</NavLink>;
}
function L3({ to, label, Icon }: { to:string; label:string; Icon:React.ElementType }) {
  const loc=useLocation(); const active=loc.pathname===to;
  return <NavLink to={to} style={leaf3Style(active)}><Icon size={14} color={active?BLUE:"#bdbdbd"}/>{label}</NavLink>;
}
function L4({ to, label, Icon }: { to:string; label:string; Icon:React.ElementType }) {
  const loc=useLocation(); const active=loc.pathname===to;
  return <NavLink to={to} style={leaf4Style(active)}><Icon size={13} color={active?BLUE:"#bdbdbd"}/>{label}</NavLink>;
}

// ── Layout ───────────────────────────────────────────────────────────────────
function Layout({ children, nomeUsuario, onLogout }: { children:React.ReactNode; nomeUsuario:string; onLogout:()=>void }) {
  const ini = (nomeUsuario||"G").split(" ").map((w:string)=>w[0]).join("").slice(0,2).toUpperCase();
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",fontFamily:"system-ui,-apple-system,sans-serif"}}>

      {/* Header */}
      <header style={{height:52,background:BLUE,display:"flex",alignItems:"center",padding:"0 16px",gap:12,flexShrink:0,boxShadow:"0 1px 4px rgba(0,0,0,.3)",zIndex:200}}>
        <div style={{width:34,height:34,background:"rgba(255,255,255,.2)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid rgba(255,255,255,.4)"}}>
          <span style={{color:"#fff",fontSize:17}}>⚕</span>
        </div>
        <div>
          <div style={{color:"#fff",fontSize:15,fontWeight:700,lineHeight:1.1}}>ERSUS 360</div>
          <div style={{color:"rgba(255,255,255,.7)",fontSize:10}}>Painel de Gestão da Saúde</div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:6,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",padding:"5px 12px",border:"1px solid rgba(255,255,255,.3)",borderRadius:4}}>
            APUÍ / AM <ChevronDown size={12} style={{opacity:.7}}/>
          </div>
          <SinoAlertas />
          <div style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",color:"#fff",padding:"4px 8px",border:"1px solid rgba(255,255,255,.2)",borderRadius:4}} onClick={onLogout} title="Clique para sair">
            <div style={{width:28,height:28,background:"rgba(255,255,255,.2)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:700}}>{ini}</div>
            <span style={{fontSize:12,fontWeight:600}}>{(nomeUsuario||"GESTOR").toUpperCase()}</span>
            <ChevronDown size={11} style={{opacity:.6}}/>
          </div>
        </div>
      </header>

      {/* Body */}
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* Sidebar */}
        <aside style={{width:250,background:"#fff",borderRight:"1px solid #e0e0e0",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{flex:1,overflowY:"auto"}}>

            {/* ── Topo ── */}
            <L1 to="/"        label="Home"               Icon={Home}    end />
            <L1 to="/score"      label="Score ERSUS 360"    Icon={Star}/>
            <L1 to="/financeiro" label="Painel Financeiro"  Icon={DollarSign}/>
            <L1 to="/gestao"     label="Gestão APS"         Icon={Activity}/>
            <L1 to="/siaps"      label="eGestor / SIAPS"    Icon={Globe}/>
            <L1 to="/caf"        label="CAF — Cofinanciamento" Icon={TrendingUp}/>
            <L1 to="/ouvidoria"  label="Ouvidoria SUS"         Icon={MessageSquare}/>
            <L1 to="/contratos"  label="Contratos & Licitações" Icon={FileText}/>
            <L1 to="/regulacao-mac" label="Regulação MAC"       Icon={Network}/>
            <L1 to="/ppa-loa"      label="PPA / LOA"           Icon={ClipboardList}/>
            <L1 to="/absenteismo"  label="Absenteísmo RH"       Icon={UserCog}/>
            <L1 to="/sala-vacinas"      label="Sala de Vacinas"       Icon={Syringe}/>
            <L1 to="/raps"              label="RAPS / Saúde Mental"   Icon={Brain}/>
            <L1 to="/manutencao"        label="Manutenção Equipam."   Icon={Wrench}/>
            <L1 to="/vigilancia-epid"   label="Vigilância Epidem."    Icon={Bug}/>
            <L1 to="/assist-farmaceutica" label="Assist. Farmacêutica"  Icon={FlaskRound}/>
            <L1 to="/transporte-sanitario"  label="Transporte / TFD"    Icon={Truck}/>
            <L1 to="/producao-sisab"        label="Produção APS / SISAB" Icon={Activity}/>
            <L1 to="/saude-mulher"          label="Saúde da Mulher"      Icon={Heart}/>
            <L1 to="/conselho-saude"        label="Conselho Municipal"    Icon={Users}/>
            <L1 to="/saude-bucal"           label="Saúde Bucal"          Icon={Smile}/>
            <L1 to="/saude-crianca"         label="Saúde da Criança"     Icon={Baby}/>
            <L1 to="/visa"                  label="Vig. Sanitária"        Icon={ShieldCheck}/>
            <L1 to="/vetores"               label="Controle de Vetores"   Icon={Bug}/>
            <L1 to="/sisvan"                label="SISVAN Nutricional"    Icon={TrendingUp}/>
            <L1 to="/atencao-domiciliar"    label="Atenção Domiciliar"    Icon={Home}/>
            <L1 to="/saude-indigena"        label="Saúde Indígena"        Icon={MapPin}/>
            <L1 to="/tb-hanseniase"         label="TB e Hanseníase"       Icon={Activity}/>
            <L1 to="/ist-hiv"               label="IST / HIV / AIDS"      Icon={Shield}/>
            <L1 to="/saude-idoso"           label="Saúde do Idoso"        Icon={UserCheck}/>
            <L1 to="/saude-homem"           label="Saúde do Homem"        Icon={UserCog}/>
            <L1 to="/sim-sinasc"            label="SIM / SINASC"          Icon={BarChart2}/>
            <L1 to="/saude-trabalhador"     label="Saúde do Trabalhador"  Icon={Wrench}/>
            <L1 to="/saude-mental"          label="Saúde Mental"          Icon={Brain}/>
            <L1 to="/urgencia-emergencia"   label="Urgência e Emergência" Icon={Activity}/>
            <L1 to="/saude-adolescente"     label="Saúde do Adolescente"  Icon={Users}/>
            <L1 to="/hiperdia"              label="HiperDia / DCNT"       Icon={Heart}/>
            <L1 to="/cancer-rastreio"       label="Rastreio de Câncer"    Icon={Search}/>
            <L1 to="/rede-frio"             label="Rede de Frio"          Icon={Thermometer}/>
            <L1 to="/reabilitacao"          label="Reabilitação / PCD"    Icon={UserCheck}/>
            <L1 to="/farmacia-especializada" label="Farmácia Especializada" Icon={Pill}/>
            <L1 to="/saude-ambiental"       label="Saúde Ambiental"       Icon={Droplets}/>
            <L1 to="/gestao-leitos"         label="Gestão de Leitos"      Icon={Layers}/>
            <L1 to="/regulacao-acesso"      label="Regulação de Acesso"   Icon={Network}/>
            <L1 to="/controle-tabaco"       label="Controle de Tabaco"    Icon={Wind}/>
            <L1 to="/saude-ocular"          label="Saúde Ocular"          Icon={Eye}/>
            <L1 to="/icsap"                 label="ICSAP"                 Icon={TrendingDown}/>
            <L1 to="/hemoterapia"           label="Hemoterapia"           Icon={Droplets}/>
            <L1 to="/ccih"                  label="CCIH"                  Icon={ShieldCheck}/>
            <L1 to="/sadt"                  label="SADT"                  Icon={FlaskConical}/>
            <L1 to="/saude-prisional"       label="Saúde Prisional"       Icon={Shield}/>
            <L1 to="/nutricao-clinica"      label="Nutrição Clínica"      Icon={Activity}/>
            <L1 to="/telessaude"            label="Telessaúde"            Icon={Monitor}/>
            <L1 to="/oncologia"             label="Oncologia/Paliativos"  Icon={Heart}/>
            <L1 to="/pgrss"                 label="PGRSS"                 Icon={Trash2}/>
            <L1 to="/educacao-permanente"   label="Educação Permanente"   Icon={BookOpen}/>
            <L1 to="/farmacovigilancia"     label="Farmacovigilância"     Icon={Pill}/>
            <L1 to="/gestao-qualidade"      label="Gestão da Qualidade"   Icon={Star}/>
            <L1 to="/saude-digital"         label="Saúde Digital"         Icon={Globe}/>
            <L1 to="/cme"                   label="CME"                   Icon={Thermometer}/>
            <L1 to="/pse"                   label="Saúde na Escola (PSE)" Icon={School}/>
            <L1 to="/blh"                   label="Banco de Leite (BLH)"  Icon={Droplets}/>
            <L1 to="/pics"                  label="PICS"                  Icon={Sparkles}/>
            <L1 to="/frota"                 label="Frota de Saúde"        Icon={Truck}/>
            <L1 to="/vigiagua"              label="VIGIÁGUA"              Icon={Waves}/>
            <L1 to="/nasf"                  label="NASF-AB"               Icon={Users}/>
            <L1 to="/zoonoses"              label="Controle de Zoonoses"  Icon={Bug}/>
            <L1 to="/saude-servidor"        label="Saúde do Servidor"     Icon={UserCog}/>
            <L1 to="/planejamento-familiar" label="Planejamento Familiar"  Icon={Baby}/>
            <L1 to="/acolhimento"           label="Acolhimento / Classif. Risco" Icon={Clock}/>
            <L1 to="/judicializacao"        label="Judicialização da Saúde" Icon={Landmark}/>
            <L1 to="/spd"                   label="Saúde da Pessoa c/ Defic." Icon={UserCheck}/>
            <L1 to="/contratos"             label="Gestão de Contratos"   Icon={FileText}/>
            <L1 to="/samu"                  label="SAMU 192"              Icon={Radio}/>
            <L1 to="/pnae"                  label="Alimentação Escolar (PNAE)" Icon={ShoppingBag}/>
            <L1 to="/siops-detalhado"       label="SIOPS Detalhado"       Icon={Landmark}/>
            <L1 to="/pat-saude"             label="Patrimônio de Saúde"   Icon={Wrench}/>
            <L1 to="/abastecimento"         label="Abastecimento/Saneamento" Icon={Droplets}/>
            <L1 to="/seguranca-paciente"    label="Segurança do Paciente" Icon={ShieldCheck}/>
            <L1 to="/visa-alimentos"        label="VISA Alimentos"        Icon={ShieldCheck}/>
            <L1 to="/academia-saude"        label="Academia da Saúde"     Icon={Activity}/>
            <L1 to="/laboratorio"           label="Laboratório Municipal" Icon={FlaskConical}/>
            <L1 to="/crie"                  label="CRIE"                  Icon={Syringe}/>
            <L1 to="/protocolo-clinico"     label="Protocolos Clínicos"   Icon={ClipboardList}/>
            <L1 to="/cuidados-paliativos"   label="Cuidados Paliativos"   Icon={Heart}/>
            <L1 to="/consultorio-rua"       label="Consultório na Rua"    Icon={Users}/>
            <L1 to="/saude-ribeirinha"      label="Saúde Ribeirinha"      Icon={Waves}/>
            <L1 to="/cerest"               label="CEREST"                Icon={Wrench}/>
            <L1 to="/caps-infanto"         label="CAPS Infanto-Juvenil"  Icon={Smile}/>
            <L1 to="/vigilancia-obito"     label="Vigilância do Óbito"   Icon={Bell}/>
            <L1 to="/caps-ad"              label="CAPS AD"               Icon={Brain}/>
            <L1 to="/saude-estomia"        label="Saúde — Ostomia"       Icon={UserCheck}/>
            <L1 to="/rede-cegonha"         label="Rede Cegonha"          Icon={Baby}/>
            <L1 to="/triagem-neonatal"     label="Triagem Neonatal"      Icon={Star}/>
            <L1 to="/violencia-domestica"  label="Violência Doméstica"   Icon={Shield}/>
            <L1 to="/malaria"             label="Malária"               Icon={Bug}/>
            <L1 to="/leishmaniose"        label="Leishmaniose"          Icon={FlaskRound}/>
            <L1 to="/arboviroses"         label="Arboviroses"           Icon={Thermometer}/>
            <L1 to="/saude-indigena"      label="Saúde Indígena"        Icon={Globe}/>
            <L1 to="/hanseniase"          label="Hanseníase"            Icon={Eye}/>
            <L1 to="/tuberculose"         label="Tuberculose"           Icon={Wind}/>
            <L1 to="/dst-hiv"             label="DST / HIV / AIDS"      Icon={ShieldCheck}/>
            <L1 to="/imunizacao"          label="Imunização / PNI"      Icon={Syringe}/>
            <L1 to="/saude-mental"        label="Saúde Mental"          Icon={Brain}/>
            <L1 to="/saude-bucal"         label="Saúde Bucal"           Icon={Smile}/>
            <L1 to="/saude-ocular"        label="Saúde Ocular"          Icon={Eye}/>
            <L1 to="/saude-auditiva"      label="Saúde Auditiva"        Icon={Radio}/>
            <L1 to="/oncologia"           label="Oncologia"             Icon={Search}/>
            <L1 to="/dcnt"                label="DCNT / Crônicas"       Icon={Heart}/>
            <L1 to="/nutricao"            label="Nutrição / SISVAN"     Icon={ShoppingBag}/>
            <L1 to="/reabilitacao"        label="Reabilitação / PCD"    Icon={UserCheck}/>
            <L1 to="/assist-farmaceutica" label="Assist. Farmacêutica"  Icon={Pill}/>
            <L1 to="/saude-ambiental"     label="Saúde Ambiental"       Icon={Droplets}/>
            <L1 to="/vig-epidem-avancada"   label="Vig. Epidem. Avançada"  Icon={AlertTriangle}/>
            <L1 to="/saude-digital-esus"   label="Saúde Digital / e-SUS"  Icon={Monitor}/>
            <L1 to="/gestao-pessoas"       label="Gestão de Pessoas"      Icon={UserCog}/>
            <L1 to="/fundo-municipal"      label="Fundo Municipal Saúde"  Icon={Landmark}/>
            <L1 to="/judicializacao-saude" label="Judicialização Saúde"   Icon={AlertTriangle}/>
            <L1 to="/atencao-especializada" label="Atenção Especializada" Icon={Stethoscope}/>
            <L1 to="/malaria-endemias"         label="Malária e Endemias"     Icon={Bug}/>
            <L1 to="/vigilancia-nutricional"  label="Vigilância Nutricional" Icon={FlaskConical}/>
            <L1 to="/saude-indigena"          label="Saúde Indígena"         Icon={MapPin}/>
            <L1 to="/dcnt-cronicas"            label="DCNT / Crônicas"        Icon={Activity}/>
            <L1 to="/cancer-rastreio"         label="Câncer e Rastreio"       Icon={ShieldCheck}/>
            <L1 to="/saude-bucal-municipal"   label="Saúde Bucal Municipal"   Icon={Smile}/>
            <L1 to="/saude-mental-caps"       label="Saúde Mental / CAPS"    Icon={Brain}/>
            <L1 to="/rede-cegonha"           label="Rede Cegonha"           Icon={Baby}/>
            <L1 to="/programa-saude-escola"  label="Saúde na Escola (PSE)"  Icon={School}/>
            <L1 to="/plano-municipal-saude"  label="Plano Municipal Saúde"  Icon={BookOpen}/>
            <L1 to="/score-municipal"        label="Score / Diagnóstico"    Icon={Star}/>
            <L1 to="/gestao-contratos-fms"   label="Contratos / Licitações" Icon={FolderOpen}/>
            <L1 to="/urgencia-emergencia"    label="Urgência e Emergência"  Icon={Clock}/>
            <L1 to="/regulacao-acesso"       label="Regulação e Acesso"     Icon={Network}/>
            <L1 to="/gestao-leitos"          label="Gestão de Leitos"       Icon={Building2}/>
            <L1 to="/visa-municipal"         label="Vigilância Sanitária"   Icon={ShieldCheck}/>
            <L1 to="/saude-trabalhador-apui" label="Saúde do Trabalhador"   Icon={Wrench}/>
            <L1 to="/educacao-permanente-apui" label="Educação Permanente"  Icon={BookOpen}/>
            <L1 to="/conselho-saude-apui"    label="Conselho de Saúde"     Icon={Users}/>
            <L1 to="/ouvidoria-apui"         label="Ouvidoria Municipal"   Icon={MessageSquare}/>
            <L1 to="/seguranca-paciente-apui"label="Segurança do Paciente" Icon={Shield}/>
            <L1 to="/telessaude-apui"        label="TeleSaúde"             Icon={Monitor}/>
            <L1 to="/laboratorio-apui"       label="Laboratório Municipal" Icon={FlaskConical}/>
            <L1 to="/farmacia-especializada-apui" label="Farmácia Especializ." Icon={Pill}/>
            <L1 to="/ranking" label="Ranking"            Icon={BarChart2}/>
            <L1 to="/mapa"    label="Mapa de Desempenho" Icon={Map}/>

            {/* ── Saúde Brasil 360 ── */}
            <Acc1 label="Saúde Brasil 360">
              <Acc2 label="Vínculo e Acompanhamento">
                <L3 to="/sb360/consolidado-territorial"   label="Consolidado Acompanhamento Territorial" Icon={PieChart}/>
                <L3 to="/sb360/acompanhamento-territorial" label="Acompanhamento Territorial"           Icon={MapPin}/>
              </Acc2>
              <Acc2 label="Qualidade e Desempenho">
                <Acc2 label="Equipes de Atenção Primária">
                  <L3 to="/sb360/mais-acesso-aps"              label="Mais Acesso à APS"                    Icon={Heart}/>
                  <L3 to="/sb360/desenvolvimento-infantil"     label="Cuidado no Desenvolvimento Infantil"  Icon={Baby}/>
                  <L3 to="/sb360/gestante-puerpera"            label="Cuidado da Gestante e Puérpera"       Icon={Baby}/>
                  <L3 to="/sb360/pessoa-diabetes"              label="Cuidado da Pessoa com Diabetes"       Icon={FlaskConical}/>
                  <L3 to="/sb360/pessoa-hipertensao"           label="Cuidado da Pessoa com Hipertensão"    Icon={Activity}/>
                  <L3 to="/sb360/pessoa-idosa"                 label="Cuidado da Pessoa Idosa"              Icon={UserCheck}/>
                  <L3 to="/sb360/mulher-cancer"                label="Cuidado da Mulher — Prevenção Câncer" Icon={ShieldCheck}/>
                </Acc2>
                <L3 to="/sb360/saude-bucal"                  label="Saúde Bucal"                          Icon={Stethoscope}/>
                <L3 to="/sb360/equipes-multiprofissionais"   label="Equipes Multiprofissionais"            Icon={Users}/>
              </Acc2>
            </Acc1>

            {/* ── Previne Brasil ── */}
            <Acc1 label="Previne Brasil">
              <L2 to="/previne"      label="Consolidado"                              Icon={PieChart}/>
              <L2 to="/previne/ind1" label="Ind. 1 — Pré-natal (≥6 consultas)"       Icon={Baby}/>
              <L2 to="/previne/ind2" label="Ind. 2 — Citopatológico"                 Icon={Stethoscope}/>
              <L2 to="/previne/ind3" label="Ind. 3 — Vacinação (DTP/Penta)"          Icon={Syringe}/>
              <L2 to="/previne/ind4" label="Ind. 4 — Pré-natal 1ª semana"            Icon={Heart}/>
              <L2 to="/previne/ind5" label="Ind. 5 — Hipertensão"                    Icon={Activity}/>
              <L2 to="/previne/ind6" label="Ind. 6 — Diabetes"                       Icon={FlaskConical}/>
              <L2 to="/previne/ind7" label="Ind. 7 — Desenvolvimento Infantil"       Icon={Star}/>
            </Acc1>

            {/* ── Painel de Gestão ── */}
            <Acc1 label="Painel de Gestão">
              <L2 to="/gestao"                  label="Consolidado"               Icon={PieChart}/>
              <L2 to="/gestao/atend"            label="Atendimentos"              Icon={UserCheck}/>
              <L2 to="/gestao/atend-odonto"     label="Atendimentos Odontológicos" Icon={Stethoscope}/>
              <L2 to="/gestao/atividades"       label="Atividades Coletivas"      Icon={Users}/>
              <L2 to="/gestao/procedimentos"    label="Consolidado Procedimentos" Icon={Clipboard}/>
              <L2 to="/gestao/encaminhamentos"  label="Encaminhamentos"           Icon={ArrowLeftRight}/>
              <L2 to="/gestao/procedimentos2"   label="Procedimentos"             Icon={ClipboardList}/>
              <L2 to="/gestao/vacinas"          label="Vacinas"                   Icon={Syringe}/>
              <L2 to="/gestao/visitas"          label="Visitas Domiciliares"      Icon={Home}/>
            </Acc1>

            {/* ── Busca Ativa ── */}
            <Acc1 label="Busca Ativa">
              <L2 to="/busca-ativa"           label="Painel Geral"    Icon={Search}/>
              <L2 to="/busca-ativa/gestante"  label="Gestante"        Icon={Baby}/>
              <L2 to="/busca-ativa/vacinas"   label="Vacinas"         Icon={Syringe}/>
              <L2 to="/busca-ativa/cito"      label="Citopatológico"  Icon={Activity}/>
            </Acc1>

            {/* ── ACS ── */}
            <Acc1 label="ACS">
              <L2 to="/acs/painel"             label="Painel do ACS"                    Icon={BarChart3}/>
              <L2 to="/acs/cadastros-ind"      label="Cadastros Individuais"            Icon={UserCheck}/>
              <L2 to="/acs/cadastros-dom"      label="Cadastros Domiciliares"           Icon={Home}/>
              <L2 to="/acs/cadastros-cid"      label="Cadastros do Cidadão"             Icon={Users}/>
              <L2 to="/acs/calendario"         label="Calendário de Visitas"            Icon={Calendar}/>
              <L2 to="/acs/visitas-cidadao"    label="Visitas Domiciliares Cidadão"     Icon={MapPin}/>
              <L2 to="/acs/mapa-visitas"       label="Mapa de Visitas Domiciliares"     Icon={Map}/>
            </Acc1>

            {/* ── Inconsistências ── */}
            <Acc1 label="Inconsistências">
              <L2 to="/inconsistencias/sem-responsavel"  label="Sem Responsável Informado"     Icon={UserCheck}/>
              <L2 to="/inconsistencias/sem-documentos"   label="Sem Documentos"                Icon={FileText}/>
              <L2 to="/inconsistencias/duplicados"       label="Cadastros Ind. Duplicados"     Icon={Clipboard}/>
              <L2 to="/inconsistencias/domicilio-atual"  label="Cadastros Em Domicílio Atual"  Icon={Home}/>
              <L2 to="/inconsistencias/cbo"              label="Cadastros Com CBO Divergente"  Icon={AlertTriangle}/>
              <L2 to="/inconsistencias/prontuarios"      label="Prontuários Duplicados"        Icon={BookOpen}/>
            </Acc1>

            {/* ── POEPS ── */}
            <Acc1 label="POEPS">
              <L2 to="/poeps/ind1"  label="Ind. 1 — Atividade Física"                    Icon={Activity}/>
              <L2 to="/poeps/ind2"  label="Ind. 2 — Educação em Saúde"                   Icon={BookOpen}/>
              <L2 to="/poeps/ind3"  label="Ind. 3 — Vigilância Alimentar e Nutricional"  Icon={ShieldCheck}/>
              <L2 to="/poeps/ind5"  label="Ind. 5 — Vigilância Alimentar e Nutricional"  Icon={Shield}/>
              <L2 to="/poeps/ind6"  label="Ind. 6 — Política de Equidade"                Icon={Star}/>
              <L2 to="/poeps/ind7"  label="Ind. 7 — Política de Equidade"                Icon={Target}/>
              <L2 to="/poeps/ind8"  label="Ind. 8 — Práticas Integrativas"               Icon={Heart}/>
            </Acc1>

            {/* ── Programa Saúde na Escola ── */}
            <Acc1 label="Programa Saúde na Escola">
              <L2 to="/pse/consolidado" label="Consolidado"  Icon={PieChart}/>
              <L2 to="/pse/ind1"        label="Indicador 1"  Icon={BookOpen}/>
              <L2 to="/pse/ind2"        label="Indicador 2"  Icon={BookOpen}/>
            </Acc1>

            {/* ── FNS / Convênios ── */}
            <Acc1 label="FNS / Convênios">
              <Acc2 label="Transferências Fundo a Fundo">
                <L3 to="/fns"       label="Consolidado de Convênios"    Icon={Clipboard}/>
                <L3 to="/repasses"  label="Cronograma de Repasses"      Icon={Calendar}/>
                <L3 to="/portarias" label="Portarias FNS"               Icon={FileText}/>
              </Acc2>
              <Acc2 label="Execução Financeira">
                <L3 to="/execucao"  label="Execução por Bloco"          Icon={DollarSign}/>
                <L3 to="/siops"     label="SIOPS / Mínimo Const."       Icon={Target}/>
                <L3 to="/emendas"   label="Emendas Parlamentares"       Icon={Landmark}/>
              </Acc2>
            </Acc1>

            {/* ── Módulos Operacionais ── */}
            <Acc1 label="Módulos Operacionais">
              <L2 to="/farmacia"    label="Assistência Farmacêutica" Icon={Pill}/>
              <L2 to="/aps"         label="Atenção Primária (APS)"   Icon={Heart}/>
              <L2 to="/vigilancia"    label="Vigilância em Saúde"       Icon={ShieldCheck}/>
              <L2 to="/epidemiologia" label="Epidemiologia / SINAN"    Icon={Activity}/>
              <L2 to="/planejamento" label="Planejamento em Saúde"   Icon={ClipboardList}/>
              <L2 to="/rdqa"         label="RDQA — Relatório Quad."  Icon={Calendar}/>
              <L2 to="/obras"       label="Obras e Infraestrutura"   Icon={Building2}/>
              <L2 to="/transporte"  label="Transporte / TFD"         Icon={Truck}/>
              <L2 to="/regulacao"   label="Regulação SUS"            Icon={ArrowLeftRight}/>
              <L2 to="/alertas"     label="Central de Alertas"       Icon={AlertTriangle}/>
              <L2 to="/relatorios"  label="Relatórios"               Icon={FileText}/>
            </Acc1>

            {/* ── Informatiza APS ── */}
            <div style={{borderTop:"1px solid #f0f0f0", marginTop:4}}>
              <L1 to="/informatiza-aps" label="Informatiza APS"  Icon={Network}/>
              <L1 to="/sus360"          label="SUS 360° — MS"    Icon={Monitor}/>
              <L1 to="/ia"              label="IA Gestora"        Icon={Bot}/>
            </div>

            {/* ── Gestão Operacional ── */}
            <div style={{borderTop:"1px solid #f0f0f0", marginTop:4}}>
              <L1 to="/agenda"          label="Agenda de Gestão"      Icon={Calendar}/>
              <L1 to="/conformidade"    label="Conformidade Legal"    Icon={Shield}/>
              <L1 to="/alertas/historico" label="Histórico de Alertas" Icon={Bell}/>
            <L1 to="/bi"              label="Business Intelligence" Icon={TrendingUp}/>
              <L1 to="/ocis"            label="OCIS — Operações"      Icon={Radio}/>
              <L1 to="/patrimonio"      label="Patrimônio e Frota"    Icon={Truck}/>
              <L1 to="/portal-gestor"   label="Painel do Prefeito"     Icon={Star}/>
              <L1 to="/portal-cidadao"  label="Portal do Cidadão"     Icon={Globe}/>
              <L1 to="/marketplace"     label="Marketplace & Academia" Icon={ShoppingBag}/>
            </div>

            {/* ── Administração ── */}
            <div style={{borderTop:"1px solid #f0f0f0", marginTop:4}}>
              <L1 to="/rh"         label="Recursos Humanos"     Icon={UserCog}/>
              <L1 to="/cadastros"  label="Cadastros Mestres"    Icon={Layers}/>
              <L1 to="/usuarios"   label="Gestão de Usuários"   Icon={Users}/>
              <L1 to="/auditoria"  label="Auditoria do Sistema" Icon={Shield}/>
            </div>

          </div>

          {/* Footer */}
          <div style={{padding:"12px 16px",borderTop:"1px solid #e0e0e0",fontSize:11,color:"#9e9e9e",lineHeight:1.8,flexShrink:0}}>
            <div>ERSUS 360 by <span style={{color:BLUE}}>FMS Apuí/AM</span></div>
            <div>v1.0.0 | <span style={{color:BLUE,cursor:"pointer"}}>Termos de uso</span></div>
            <div style={{display:"flex",alignItems:"center",gap:5,color:"#c62828",cursor:"pointer",marginTop:6,fontWeight:600,fontSize:12}} onClick={onLogout}>
              <LogOut size={13}/> Sair do sistema
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={{flex:1,overflow:"auto",background:LIGHT_BG}}>{children}</main>
      </div>
    </div>
  );
}

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [autenticado, setAutenticado] = useState(!!localStorage.getItem("ersus_token"));
  const [nomeUsuario, setNomeUsuario] = useState(localStorage.getItem("ersus_nome") ?? "");
  const [perfilUsuario, setPerfilUsuario] = useState(localStorage.getItem("ersus_perfil") ?? "");

  const handleLogin = (_token: string, perfil: string, nome: string) => {
    setNomeUsuario(nome); setPerfilUsuario(perfil); setAutenticado(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("ersus_token");
    localStorage.removeItem("ersus_perfil");
    localStorage.removeItem("ersus_nome");
    setAutenticado(false);
  };

  if (!autenticado) {
    return <QueryClientProvider client={qc}><Login onLogin={handleLogin}/></QueryClientProvider>;
  }

  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Layout nomeUsuario={nomeUsuario} onLogout={handleLogout}>
          <Routes>
            <Route path="/"                          element={<PainelGestor/>}/>
            <Route path="/score"                     element={<ScoreERSUS/>}/>
            <Route path="/ranking"                   element={<Indicadores/>}/>
            <Route path="/mapa"                      element={<MapaDesempenho/>}/>
            {/* Saúde Brasil 360 */}
            <Route path="/sb360/*"                   element={<APS/>}/>
            {/* Previne Brasil */}
            <Route path="/previne"                   element={<PrevineBrasil/>}/>
            <Route path="/previne/*"                 element={<PrevineBrasil/>}/>
            {/* Painel de Gestão */}
            <Route path="/gestao"                    element={<PainelGestaoAPS/>}/>
            <Route path="/gestao/*"                  element={<PainelGestaoAPS/>}/>
            {/* Busca Ativa */}
            <Route path="/busca-ativa"               element={<BuscaAtiva/>}/>
            <Route path="/busca-ativa/*"             element={<BuscaAtiva/>}/>
            {/* ACS */}
            <Route path="/acs/painel"                element={<ACSPainel/>}/>
            <Route path="/acs/*"                     element={<ACSPainel/>}/>
            {/* Inconsistências */}
            <Route path="/inconsistencias/*"         element={<Documentos/>}/>
            {/* POEPS */}
            <Route path="/poeps/*"                   element={<Indicadores/>}/>
            {/* PSE */}
            <Route path="/pse/*"                     element={<Indicadores/>}/>
            {/* FNS */}
            <Route path="/fns"                       element={<FnsConvenios/>}/>
            <Route path="/repasses"                  element={<FnsConvenios/>}/>
            <Route path="/portarias"                 element={<Portarias/>}/>
            <Route path="/execucao"                  element={<Execucao/>}/>
            <Route path="/emendas"                   element={<Emendas/>}/>
            {/* Informatiza APS */}
            <Route path="/informatiza-aps"           element={<APS/>}/>
            {/* Demais */}
            <Route path="/ia"                        element={<IAGestora/>}/>
            <Route path="/sus360"                    element={<Sus360/>}/>
            <Route path="/obras"                     element={<Obras/>}/>
            <Route path="/obras/*"                   element={<Obras/>}/>
            <Route path="/documentos"                element={<Documentos/>}/>
            <Route path="/alertas"                   element={<Alertas/>}/>
            <Route path="/alertas/*"                 element={<Alertas/>}/>
            <Route path="/relatorios"                element={<Relatorios/>}/>
            <Route path="/planejamento"              element={<Planejamento/>}/>
            <Route path="/rdqa"                      element={<RDQA/>}/>
            <Route path="/aps"                       element={<APS/>}/>
            <Route path="/aps/*"                     element={<APS/>}/>
            <Route path="/farmacia"                  element={<Farmacia/>}/>
            <Route path="/farmacia/*"                element={<Farmacia/>}/>
            <Route path="/vigilancia"                element={<Vigilancia/>}/>
            <Route path="/vigilancia/*"              element={<Vigilancia/>}/>
            <Route path="/epidemiologia"             element={<Epidemiologia/>}/>
            <Route path="/epidemiologia/*"           element={<Epidemiologia/>}/>
            <Route path="/siops"                     element={<SIOPS/>}/>
            <Route path="/financeiro"                element={<PainelFinanceiro/>}/>
            <Route path="/siaps"                     element={<SiapsEgestor/>}/>
            <Route path="/caf"                       element={<PainelCAF/>}/>
            <Route path="/ouvidoria"                 element={<Ouvidoria/>}/>
            <Route path="/contratos"                 element={<Contratos/>}/>
            <Route path="/regulacao-mac"             element={<RegulacaoMAC/>}/>
            <Route path="/ppa-loa"                   element={<PainelPPALOA/>}/>
            <Route path="/absenteismo"               element={<Absenteismo/>}/>
            <Route path="/sala-vacinas"              element={<SalaVacinas/>}/>
            <Route path="/raps"                      element={<RAPS/>}/>
            <Route path="/manutencao"                element={<Manutencao/>}/>
            <Route path="/vigilancia-epid"           element={<NotificacoesSINAN/>}/>
            <Route path="/assist-farmaceutica"       element={<AssistenciaFarmaceutica/>}/>
            <Route path="/transporte-sanitario"      element={<TransporteSanitario/>}/>
            <Route path="/producao-sisab"            element={<ProducaoSISAB/>}/>
            <Route path="/saude-mulher"              element={<SaudeMulher/>}/>
            <Route path="/conselho-saude"            element={<ConselhoSaude/>}/>
            <Route path="/saude-bucal"               element={<SaudeBucal/>}/>
            <Route path="/saude-crianca"             element={<SaudeCrianca/>}/>
            <Route path="/visa"                      element={<VigilanciaVISA/>}/>
            <Route path="/vetores"                   element={<ControleVetores/>}/>
            <Route path="/sisvan"                    element={<SISVAN/>}/>
            <Route path="/atencao-domiciliar"        element={<AtencaoDomiciliar/>}/>
            <Route path="/saude-indigena"            element={<SaudeIndigena/>}/>
            <Route path="/tb-hanseniase"             element={<TbHanseniase/>}/>
            <Route path="/ist-hiv"                   element={<IstHiv/>}/>
            <Route path="/saude-idoso"               element={<SaudeIdoso/>}/>
            <Route path="/saude-homem"               element={<SaudeHomem/>}/>
            <Route path="/sim-sinasc"                element={<SimSinasc/>}/>
            <Route path="/saude-trabalhador"         element={<SaudeTrabalhador/>}/>
            <Route path="/saude-mental"              element={<SaudeMental/>}/>
            <Route path="/urgencia-emergencia"       element={<UrgenciaEmergencia/>}/>
            <Route path="/saude-adolescente"         element={<SaudeAdolescente/>}/>
            <Route path="/hiperdia"                  element={<HiperDia/>}/>
            <Route path="/cancer-rastreio"           element={<CancerRastreio/>}/>
            <Route path="/rede-frio"                 element={<RedeFrio/>}/>
            <Route path="/reabilitacao"              element={<Reabilitacao/>}/>
            <Route path="/farmacia-especializada"    element={<FarmaciaEspecializada/>}/>
            <Route path="/saude-ambiental"           element={<SaudeAmbiental/>}/>
            <Route path="/gestao-leitos"             element={<GestaoLeitos/>}/>
            <Route path="/regulacao-acesso"          element={<RegulacaoAcesso/>}/>
            <Route path="/controle-tabaco"           element={<ControleTabaco/>}/>
            <Route path="/saude-ocular"              element={<SaudeOcular/>}/>
            <Route path="/icsap"                     element={<ICSAP/>}/>
            <Route path="/hemoterapia"               element={<Hemoterapia/>}/>
            <Route path="/ccih"                      element={<CCIH/>}/>
            <Route path="/sadt"                      element={<SADT/>}/>
            <Route path="/saude-prisional"           element={<SaudePrisional/>}/>
            <Route path="/nutricao-clinica"          element={<NutricaoClinica/>}/>
            <Route path="/telessaude"                element={<Telessaude/>}/>
            <Route path="/oncologia"                 element={<Oncologia/>}/>
            <Route path="/pgrss"                     element={<PGRSS/>}/>
            <Route path="/educacao-permanente"       element={<EducacaoPermanente/>}/>
            <Route path="/farmacovigilancia"         element={<Farmacovigilancia/>}/>
            <Route path="/gestao-qualidade"          element={<GestaoQualidade/>}/>
            <Route path="/saude-digital"             element={<SaudeDigital/>}/>
            <Route path="/cme"                       element={<CME/>}/>
            <Route path="/pse"                       element={<PSE/>}/>
            <Route path="/blh"                       element={<BLH/>}/>
            <Route path="/pics"                      element={<PICS/>}/>
            <Route path="/frota"                     element={<Frota/>}/>
            <Route path="/vigiagua"                  element={<VigiAgua/>}/>
            <Route path="/nasf"                      element={<NASF/>}/>
            <Route path="/zoonoses"                  element={<Zoonoses/>}/>
            <Route path="/saude-servidor"            element={<SaudeServidor/>}/>
            <Route path="/planejamento-familiar"     element={<PlanejamentoFamiliar/>}/>
            <Route path="/acolhimento"               element={<Acolhimento/>}/>
            <Route path="/judicializacao"            element={<Judicializacao/>}/>
            <Route path="/spd"                       element={<SPD/>}/>
            <Route path="/contratos"                 element={<Contratos/>}/>
            <Route path="/samu"                      element={<SAMU/>}/>
            <Route path="/pnae"                      element={<PNAE/>}/>
            <Route path="/siops-detalhado"           element={<SIOPSDetalhado/>}/>
            <Route path="/pat-saude"                 element={<PatSaude/>}/>
            <Route path="/abastecimento"             element={<Abastecimento/>}/>
            <Route path="/seguranca-paciente"        element={<SegurancaPaciente/>}/>
            <Route path="/visa-alimentos"            element={<VisaAlimentos/>}/>
            <Route path="/academia-saude"            element={<AcademiaSaude/>}/>
            <Route path="/laboratorio"               element={<Laboratorio/>}/>
            <Route path="/crie"                      element={<CRIE/>}/>
            <Route path="/protocolo-clinico"         element={<ProtocoloClinico/>}/>
            <Route path="/cuidados-paliativos"        element={<CuidadosPaliativos/>}/>
            <Route path="/consultorio-rua"           element={<ConsultorioRua/>}/>
            <Route path="/saude-ribeirinha"          element={<SaudeRibeirinha/>}/>
            <Route path="/cerest"                    element={<CEREST/>}/>
            <Route path="/caps-infanto"              element={<CAPSInfanto/>}/>
            <Route path="/vigilancia-obito"          element={<VigilanciaObito/>}/>
            <Route path="/caps-ad"                   element={<CAPSAD/>}/>
            <Route path="/saude-estomia"             element={<SaudeEstomia/>}/>
            <Route path="/rede-cegonha"              element={<RedeCegonha/>}/>
            <Route path="/triagem-neonatal"          element={<TriagemNeonatal/>}/>
            <Route path="/violencia-domestica"       element={<ViolenciaDomestica/>}/>
            <Route path="/malaria"                   element={<Malaria/>}/>
            <Route path="/leishmaniose"              element={<Leishmaniose/>}/>
            <Route path="/arboviroses"               element={<Arboviroses/>}/>
            <Route path="/saude-indigena"            element={<SaudeIndigena/>}/>
            <Route path="/hanseniase"                element={<Hanseniase/>}/>
            <Route path="/tuberculose"               element={<Tuberculose/>}/>
            <Route path="/dst-hiv"                   element={<DstHiv/>}/>
            <Route path="/imunizacao"                element={<Imunizacao/>}/>
            <Route path="/saude-mental"              element={<SaudeMental/>}/>
            <Route path="/saude-bucal"               element={<SaudeBucal/>}/>
            <Route path="/saude-ocular"              element={<SaudeOcular/>}/>
            <Route path="/saude-auditiva"            element={<SaudeAuditiva/>}/>
            <Route path="/oncologia"                 element={<Oncologia/>}/>
            <Route path="/dcnt"                      element={<DCNT/>}/>
            <Route path="/nutricao"                  element={<Nutricao/>}/>
            <Route path="/reabilitacao"              element={<Reabilitacao/>}/>
            <Route path="/assist-farmaceutica"       element={<AssistFarmaceutica/>}/>
            <Route path="/saude-ambiental"           element={<SaudeAmbiental/>}/>
            <Route path="/vig-epidem-avancada"       element={<VigEpidemAvancada/>}/>
            <Route path="/saude-digital-esus"        element={<SaudeDigitalEsus/>}/>
            <Route path="/gestao-pessoas"            element={<GestaoPessoas/>}/>
            <Route path="/fundo-municipal"           element={<FundoMunicipal/>}/>
            <Route path="/judicializacao-saude"      element={<JudicializacaoSaude/>}/>
            <Route path="/atencao-especializada"     element={<AtencaoEspecializada/>}/>
            <Route path="/malaria-endemias"        element={<MalariaEndemias/>}/>
            <Route path="/vigilancia-nutricional" element={<VigilanciaNutricional/>}/>
            <Route path="/saude-indigena"         element={<SaudeIndigenaApui/>}/>
            <Route path="/dcnt-cronicas"           element={<DcntCronicas/>}/>
            <Route path="/cancer-rastreio"        element={<CancerRastreio/>}/>
            <Route path="/saude-bucal-municipal"  element={<SaudeBucalMunicipal/>}/>
            <Route path="/saude-mental-caps"       element={<SaudeMentalCaps/>}/>
            <Route path="/rede-cegonha"           element={<RedeCegonha/>}/>
            <Route path="/programa-saude-escola"  element={<ProgramaSaudeEscola/>}/>
            <Route path="/plano-municipal-saude"   element={<PlanoMunicipalSaude/>}/>
            <Route path="/score-municipal"         element={<ScoreMunicipal/>}/>
            <Route path="/gestao-contratos-fms"    element={<GestaoContratosFms/>}/>
            <Route path="/urgencia-emergencia"    element={<UrgenciaEmergencia/>}/>
            <Route path="/regulacao-acesso"       element={<RegulacaoAcesso/>}/>
            <Route path="/gestao-leitos"          element={<GestaoLeitos/>}/>
            <Route path="/visa-municipal"           element={<VisaMunicipal/>}/>
            <Route path="/saude-trabalhador-apui"  element={<SaudeTrabalhador/>}/>
            <Route path="/educacao-permanente-apui"element={<EducacaoPermanente/>}/>
            <Route path="/conselho-saude-apui"          element={<ConselhoSaudeApui/>}/>
            <Route path="/ouvidoria-apui"               element={<OuvidoriaApui/>}/>
            <Route path="/seguranca-paciente-apui"      element={<SegurancaPaciente/>}/>
            <Route path="/telessaude-apui"              element={<TelessaudeApui/>}/>
            <Route path="/laboratorio-apui"             element={<LaboratorioApui/>}/>
            <Route path="/farmacia-especializada-apui"  element={<FarmaciaEspecializadaApui/>}/>
            <Route path="/agenda"                    element={<Agenda/>}/>
            <Route path="/conformidade"              element={<Conformidade/>}/>
            <Route path="/alertas/historico"         element={<HistoricoAlertas/>}/>
            <Route path="/transporte"                element={<Transporte/>}/>
            <Route path="/regulacao"                 element={<Regulacao/>}/>
            <Route path="/usuarios"                  element={<Usuarios/>}/>
            <Route path="/auditoria"                 element={<Auditoria/>}/>
            <Route path="/cadastros"                 element={<CadastrosMestres/>}/>
            <Route path="/cadastros/*"               element={<CadastrosMestres/>}/>
            <Route path="/rh"                        element={<RH/>}/>
            <Route path="/rh/*"                      element={<RH/>}/>
            <Route path="/bi"                        element={<BI/>}/>
            <Route path="/bi/*"                      element={<BI/>}/>
            <Route path="/ocis"                      element={<OCIS/>}/>
            <Route path="/ocis/*"                    element={<OCIS/>}/>
            <Route path="/patrimonio"                element={<Patrimonio/>}/>
            <Route path="/patrimonio/*"              element={<Patrimonio/>}/>
            <Route path="/portal-gestor"             element={<PortalGestor/>}/>
            <Route path="/portal-cidadao"            element={<PortalCidadao/>}/>
            <Route path="/marketplace"               element={<Marketplace/>}/>
            <Route path="/municipio"                 element={<Municipio/>}/>
            <Route path="/modulos"                   element={<Modulos/>}/>
            <Route path="/indicadores"               element={<Indicadores/>}/>
            <Route path="/ind/*"                     element={<Indicadores/>}/>
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
