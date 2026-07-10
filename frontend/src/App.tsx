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
  Radio, Globe, ShoppingBag, Bell, Search, MessageSquare, Wrench, Brain, Bug, FlaskRound, Smile, Thermometer, Droplets, Utensils,
  Wind, Eye, TrendingDown, Trash2, School, Sparkles, Waves, Clock,
  HeartPulse, HandHeart, Scale,
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
import SaudeCrianca            from "./pages/SaudeCrianca";
import VigilanciaVISA          from "./pages/VigilanciaVISA";
import ControleVetores         from "./pages/ControleVetores";
import SISVAN                  from "./pages/SISVAN";
import AtencaoDomiciliar       from "./pages/AtencaoDomiciliar";
import TbHanseniase            from "./pages/TbHanseniase";
import IstHiv                  from "./pages/IstHiv";
import SaudeIdoso              from "./pages/SaudeIdoso";
import SaudeHomem              from "./pages/SaudeHomem";
import SimSinasc               from "./pages/SimSinasc";
import SaudeTrabalhador        from "./pages/SaudeTrabalhador";
import UrgenciaEmergencia      from "./pages/UrgenciaEmergencia";
import SaudeAdolescente        from "./pages/SaudeAdolescente";
import HiperDia                from "./pages/HiperDia";
import RedeFrio                from "./pages/RedeFrio";
import FarmaciaEspecializada   from "./pages/FarmaciaEspecializada";
import GestaoLeitos            from "./pages/GestaoLeitos";
import RegulacaoAcesso         from "./pages/RegulacaoAcesso";
import ControleTabaco          from "./pages/ControleTabaco";
import ICSAP                   from "./pages/ICSAP";
import Hemoterapia             from "./pages/Hemoterapia";
import CCIH                    from "./pages/CCIH";
import SADT                    from "./pages/SADT";
import SaudePrisional          from "./pages/SaudePrisional";
import NutricaoClinica         from "./pages/NutricaoClinica";
import Telessaude              from "./pages/Telessaude";
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
import ConsultorioRua          from "./pages/ConsultorioRua";
import CEREST                  from "./pages/CEREST";
import CAPSInfanto             from "./pages/CAPSInfanto";
import VigilanciaObito         from "./pages/VigilanciaObito";
import CAPSAD                  from "./pages/CAPSAD";
import SaudeEstomia            from "./pages/SaudeEstomia";
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
import CuidadosPaliativos        from "./pages/CuidadosPaliativos";
import SaudeRibeirinha           from "./pages/SaudeRibeirinha";
import ReabilitacaoApui          from "./pages/ReabilitacaoApui";
import SaudeFamiliaApui          from "./pages/SaudeFamiliaApui";
import SaudeMentalCapsApui       from "./pages/SaudeMentalCapsApui";
import VigilanciaEpidemApui      from "./pages/VigilanciaEpidemApui";
import SaudeMulherApui           from "./pages/SaudeMulherApui";
import HiperdiaApui              from "./pages/HiperdiaApui";
import OncologiaApui             from "./pages/OncologiaApui";
import TuberculoseApui           from "./pages/TuberculoseApui";
import MalariaApui               from "./pages/MalariaApui";
import SaudeBucalApui            from "./pages/SaudeBucalApui";
import IstHivHepatitesApui       from "./pages/IstHivHepatitesApui";
import HanseniaseApui             from "./pages/HanseniaseApui";
import SaudeAmbientalApui         from "./pages/SaudeAmbientalApui";
import UrgenciaEmergenciaApui     from "./pages/UrgenciaEmergenciaApui";
import NutricaoSisvanApui         from "./pages/NutricaoSisvanApui";
import RegulacaoEspecializadaApui from "./pages/RegulacaoEspecializadaApui";
import SaudeTrabalhadorApui       from "./pages/SaudeTrabalhadorApui";
import FarmaciaBasicaApui         from "./pages/FarmaciaBasicaApui";
import SaudeEscolarApui           from "./pages/SaudeEscolarApui";
import VigilanciaSanitariaApui    from "./pages/VigilanciaSanitariaApui";
import SaudeIndígenaApui          from "./pages/SaudeIndígenaApui";
import DoencasCronicasApui        from "./pages/DoencasCronicasApui";
import SaudeMentalApui2           from "./pages/SaudeMentalApui2";
import ImunizacaoApui             from "./pages/ImunizacaoApui";
import MaternoInfantilApui        from "./pages/MaternoInfantilApui";
import AtencaoPrimariaApui             from "./pages/AtencaoPrimariaApui";
import SaudeIdosoApui                  from "./pages/SaudeIdosoApui";
import SaudeCriancaApui                from "./pages/SaudeCriancaApui";
import VigilanciaEpidemiologicaApui    from "./pages/VigilanciaEpidemiologicaApui";
import GestaoHospitalarApui            from "./pages/GestaoHospitalarApui";
import AguaSaneamentoApui              from "./pages/AguaSaneamentoApui";
import SaudeDigitalApui                from "./pages/SaudeDigitalApui";
import FundoMunicipalSaudeApui         from "./pages/FundoMunicipalSaudeApui";
import SaudeGarimpoApui                from "./pages/SaudeGarimpoApui";
import RecursosHumanosSaudeApui        from "./pages/RecursosHumanosSaudeApui";
import RedeLogisticaApui               from "./pages/RedeLogisticaApui";
import SaudePcdApui                    from "./pages/SaudePcdApui";
import PlanejamentoSaudeApui           from "./pages/PlanejamentoSaudeApui";
import SaudeRespiratoriaApui           from "./pages/SaudeRespiratoriaApui";
import SaudeCardiovascularApui         from "./pages/SaudeCardiovascularApui";
import SaudeRenalApui                  from "./pages/SaudeRenalApui";
import ViolenciaAcidentesApui          from "./pages/ViolenciaAcidentesApui";
import SaudeDiabetesApui              from "./pages/SaudeDiabetesApui";
import SaudeQuilombolaApui            from "./pages/SaudeQuilombolaApui";
import SegurancaAlimentarApui         from "./pages/SegurancaAlimentarApui";
import HepatitesViraisApui            from "./pages/HepatitesViraisApui";
import SaudeNeonatalApui              from "./pages/SaudeNeonatalApui";
import InfeccoesHospitalaresApui      from "./pages/InfeccoesHospitalaresApui";
import RegulacaoReferenciaApui        from "./pages/RegulacaoReferenciaApui";
import SaudeHomemApui                 from "./pages/SaudeHomemApui";
import SaudeAuditivaApui              from "./pages/SaudeAuditivaApui";
import SaudeAdolescenteApui           from "./pages/SaudeAdolescenteApui";
import DoencasRarasApui               from "./pages/DoencasRarasApui";
import ClimaSaudeApui                 from "./pages/ClimaSaudeApui";
import TfdEspecialidadesApui          from "./pages/TfdEspecialidadesApui";
import ResiduosSaudeApui              from "./pages/ResiduosSaudeApui";
import EconomiaSaudeApui              from "./pages/EconomiaSaudeApui";
import MortalidadeMaternaApui         from "./pages/MortalidadeMaternaApui";
import TabagismoDpocApui              from "./pages/TabagismoDpocApui";
import SaudeLgbtqiaApui              from "./pages/SaudeLgbtqiaApui";
import DengueArbovirosesApui         from "./pages/DengueArbovirosesApui";
import IlpiIdosoApui                 from "./pages/IlpiIdosoApui";
import FarmaciaPopularApui           from "./pages/FarmaciaPopularApui";
import AcidentesTransitoApui         from "./pages/AcidentesTransitoApui";
import SaudeMentalInfantilApui       from "./pages/SaudeMentalInfantilApui";
import SaneamentoBasicoApui          from "./pages/SaneamentoBasicoApui";
import PlanejamentoFamiliarApui      from "./pages/PlanejamentoFamiliarApui";
import SaudePrisionalApui            from "./pages/SaudePrisionalApui";
import ZoonosesApui                  from "./pages/ZoonosesApui";
import AtividadeFisicaApui           from "./pages/AtividadeFisicaApui";
import InfraestruturaUbsApui         from "./pages/InfraestruturaUbsApui";
import MedicamentosAltoCustoApui     from "./pages/MedicamentosAltoCustoApui";
import ResiduosSolidosUrbanosApui    from "./pages/ResiduosSolidosUrbanosApui";
import FilaCirurgicaApui             from "./pages/FilaCirurgicaApui";
import PrevencaoSuicidioApui         from "./pages/PrevencaoSuicidioApui";
import PcdCriancaApui                from "./pages/PcdCriancaApui";
import DemenciaAlzheimerApui         from "./pages/DemenciaAlzheimerApui";
import IcsapApui                     from "./pages/IcsapApui";
import LeishmanioseVisceralApui      from "./pages/LeishmanioseVisceralApui";
import DesnutricaoInfantilApui       from "./pages/DesnutricaoInfantilApui";
import PrenatalRiscoGestacionalApui  from "./pages/PrenatalRiscoGestacionalApui";
import QueimAdasRespiratoriaApui     from "./pages/QueimAdasRespiratoriaApui";
import SaudeEscolarPseApui           from "./pages/SaudeEscolarPseApui";
import DoencasNegligenciadasApui     from "./pages/DoencasNegligenciadasApui";
import SaudeMentalInfantoJuvenilApui from "./pages/SaudeMentalInfantoJuvenilApui";
import MercurioGarimpoApui           from "./pages/MercurioGarimpoApui";
import SaudeOcularApui               from "./pages/SaudeOcularApui";
import ViolenciaDomesticaSexualApui  from "./pages/ViolenciaDomesticaSexualApui";
import EducacaoPermanenteApui        from "./pages/EducacaoPermanenteApui";
import SegurancaPacienteApui         from "./pages/SegurancaPacienteApui";
import CuidadosPaliativosApui        from "./pages/CuidadosPaliativosApui";
import GestaoLeitosApui              from "./pages/GestaoLeitosApui";
import AleitamentoMaternoApui        from "./pages/AleitamentoMaternoApui";
import BancoSangueHemoterapiaApui   from "./pages/BancoSangueHemoterapiaApui";
import DoacaoOrgaosApui             from "./pages/DoacaoOrgaosApui";
import NutricaoClinicaApui          from "./pages/NutricaoClinicaApui";
import PsicologiaApsApui            from "./pages/PsicologiaApsApui";
import MortalidadePrematuraApui     from "./pages/MortalidadePrematurasApui";
import SaudeFinanceiraApui          from "./pages/SaudeFinanceiraApui";
import PoliticaPrevencaoApui         from "./pages/PoliticaPrevencaoApui";
import GestaoContratosApui           from "./pages/GestaoContratosApui";
import RegulacaoAcessoApui           from "./pages/RegulacaoAcessoApui";
import SaudeRibeirinhaApui           from "./pages/SaudeRibeirinhaApui";
import VisaMunicipalApui             from "./pages/VisaMunicipalApui";
import IntegracaoTempoRealApui       from "./pages/IntegracaoTempoRealApui";
import SaudePopulacaoRuaApui        from "./pages/SaudePopulacaoRuaApui";
import SaudeSexualReprodutoraApui   from "./pages/SaudeSexualReprodutoraApui";
import AuditoriaInternaApui         from "./pages/AuditoriaInternaApui";
import MonitoramentoMetasApui       from "./pages/MonitoramentoMetasApui";
import GestaoRiscosSaudeApui        from "./pages/GestaoRiscosSaudeApui";
import AcessoEspecialidadesApui     from "./pages/AcessoEspecialidadesApui";
import ControleVetorialApui         from "./pages/ControleVetorialApui";
import ComiteMortalidadeApui        from "./pages/ComiteMortalidadeApui";
import SuaSusApui                   from "./pages/SuaSusApui";
import CadeiaFrioApui               from "./pages/CadeiaFrioApui";
import MatriciamentoNasfApui        from "./pages/MatriciamentoNasfApui";
import CeacAmbulatorialApui         from "./pages/CeacAmbulatorialApui";
import FarmacovigilanciaApui        from "./pages/FarmacovigilanciaApui";
import BancoLeiteApui               from "./pages/BancoLeiteApui";
import JudicializacaoSaudeApui      from "./pages/JudicializacaoSaudeApui";
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
            <L1 to="/regulacao-acesso-apui"       label="Regulação e Acesso"     Icon={Network}/>
            <L1 to="/gestao-leitos-apui"          label="Gestão de Leitos"       Icon={Building2}/>
            <L1 to="/visa-municipal-apui"         label="Vigilância Sanitária"   Icon={ShieldCheck}/>
            <L1 to="/saude-trabalhador-apui" label="Saúde do Trabalhador"   Icon={Wrench}/>
            <L1 to="/educacao-permanente-apui" label="Educação Permanente"  Icon={BookOpen}/>
            <L1 to="/aleitamento-materno-apui"    label="Aleitamento Materno"    Icon={Heart}/>
            <L1 to="/politica-prevencao-apui"     label="Política de Prevenção"  Icon={ShieldCheck}/>
            <L1 to="/gestao-contratos-apui"       label="Gestão de Contratos"    Icon={Clipboard}/>
            <L1 to="/banco-sangue-hemoterapia-apui" label="Banco de Sangue"       Icon={Droplets}/>
            <L1 to="/mortalidade-prematura-apui"  label="Mortalidade Prematura"  Icon={TrendingUp}/>
            <L1 to="/saude-financeira-apui"       label="Financeiro FMS"         Icon={DollarSign}/>
            <L1 to="/doacao-orgaos-apui"          label="Doação de Órgãos"       Icon={Heart}/>
            <L1 to="/nutricao-clinica-apui"       label="Nutrição Clínica"       Icon={Utensils}/>
            <L1 to="/psicologia-aps-apui"         label="Psicologia APS"         Icon={Brain}/>
            <L1 to="/conselho-saude-apui"    label="Conselho de Saúde"     Icon={Users}/>
            <L1 to="/ouvidoria-apui"         label="Ouvidoria Municipal"   Icon={MessageSquare}/>
            <L1 to="/seguranca-paciente-apui"label="Segurança do Paciente" Icon={Shield}/>
            <L1 to="/telessaude-apui"        label="TeleSaúde"             Icon={Monitor}/>
            <L1 to="/laboratorio-apui"       label="Laboratório Municipal" Icon={FlaskConical}/>
            <L1 to="/farmacia-especializada-apui" label="Farmácia Especializ." Icon={Pill}/>
            <L1 to="/cuidados-paliativos"         label="Cuidados Paliativos"  Icon={Heart}/>
            <L1 to="/saude-ribeirinha-apui"            label="Saúde Ribeirinha"     Icon={Waves}/>
            <L1 to="/reabilitacao-apui"           label="Reabilitação"         Icon={Activity}/>
            <L1 to="/saude-familia-apui"          label="Saúde da Família"     Icon={Users}/>
            <L1 to="/saude-mental-caps-apui"      label="Saúde Mental / CAPS"  Icon={Brain}/>
            <L1 to="/imunizacao-apui"             label="Imunização"           Icon={Syringe}/>
            <L1 to="/vigilancia-epidem-apui"      label="Vigilância Epidem."   Icon={Bug}/>
            <L1 to="/saude-mulher-apui"           label="Saúde da Mulher"      Icon={Sparkles}/>
            <L1 to="/saude-crianca-apui"          label="Saúde da Criança"     Icon={Smile}/>
            <L1 to="/hiperdia-apui"               label="Hiperdia / HAS + DM"  Icon={Thermometer}/>
            <L1 to="/saude-idoso-apui"            label="Saúde do Idoso"       Icon={UserCheck}/>
            <L1 to="/oncologia-apui"              label="Oncologia"            Icon={Stethoscope}/>
            <L1 to="/tuberculose-apui"            label="Tuberculose"          Icon={Thermometer}/>
            <L1 to="/malaria-apui"                label="Malária"              Icon={Droplets}/>
            <L1 to="/saude-bucal-apui"            label="Saúde Bucal"          Icon={Star}/>
            <L1 to="/ist-hiv-hepatites-apui"      label="IST / HIV / Hepatites" Icon={FlaskConical}/>
            <L1 to="/hanseniase-apui"             label="Hanseníase"           Icon={FlaskRound}/>
            <L1 to="/saude-ambiental-apui"        label="Saúde Ambiental"      Icon={Layers}/>
            <L1 to="/urgencia-emergencia-apui"    label="Urgência e Emergência" Icon={Clock}/>
            <L1 to="/nutricao-sisvan-apui"        label="Nutrição / SISVAN"    Icon={ShoppingBag}/>
            <L1 to="/regulacao-especializada-apui" label="Regulação Especializ." Icon={Globe}/>
            <L1 to="/regulacao-referencia-apui"   label="Regulação e Referência" Icon={Network}/>
            <L1 to="/saude-trabalhador-apui"      label="Saúde do Trabalhador" Icon={Wrench}/>
            <L1 to="/farmacia-basica-apui"        label="Farmácia Básica"      Icon={Pill}/>
            <L1 to="/saude-escolar-apui"          label="Saúde Escolar (PSE)"  Icon={School}/>
            <L1 to="/vigilancia-sanitaria-apui"   label="Vigilância Sanitária" Icon={ShieldCheck}/>
            <L1 to="/saude-indigena-apui"         label="Saúde Indígena"       Icon={Users}/>
            <L1 to="/doencas-cronicas-apui"       label="Doenças Crônicas"     Icon={Heart}/>
            <L1 to="/saude-mental-apui"           label="Saúde Mental"         Icon={Brain}/>
            <L1 to="/imunizacao-apui"             label="Imunização / PNI"     Icon={Syringe}/>
            <L1 to="/materno-infantil-apui"       label="Materno-Infantil"     Icon={Baby}/>
            <L1 to="/atencao-primaria-apui"       label="Atenção Primária"     Icon={Stethoscope}/>
            <L1 to="/saude-idoso-apui"            label="Saúde do Idoso"       Icon={UserCheck}/>
            <L1 to="/saude-crianca-apui"          label="Saúde da Criança"     Icon={Smile}/>
            <L1 to="/vigilancia-epidemiologica-apui" label="Vigil. Epidemiológica" Icon={Monitor}/>
            <L1 to="/gestao-hospitalar-apui"      label="Gestão Hospitalar"    Icon={Landmark}/>
            <L1 to="/agua-saneamento-apui"        label="Água e Saneamento"    Icon={Droplets}/>
            <L1 to="/saude-digital-apui"          label="Saúde Digital"        Icon={Globe}/>
            <L1 to="/fundo-municipal-saude-apui"  label="Fundo Municipal Saúde" Icon={FolderOpen}/>
            <L1 to="/saude-garimpo-apui"          label="Saúde do Garimpo"     Icon={Bug}/>
            <L1 to="/recursos-humanos-saude-apui" label="Recursos Humanos RHS" Icon={UserCog}/>
            <L1 to="/rede-logistica-apui"         label="Rede Logística"       Icon={Truck}/>
            <L1 to="/saude-pcd-apui"              label="Saúde da PcD"          Icon={Waves}/>
            <L1 to="/planejamento-saude-apui"     label="Planejamento Saúde"    Icon={BarChart2}/>
            <L1 to="/saude-respiratoria-apui"     label="Saúde Respiratória"    Icon={Wind}/>
            <L1 to="/saude-cardiovascular-apui"   label="Saúde Cardiovascular"  Icon={Heart}/>
            <L1 to="/saude-renal-apui"            label="Saúde Renal"           Icon={Droplets}/>
            <L1 to="/violencia-acidentes-apui"    label="Violência e Acidentes" Icon={Shield}/>
            <L1 to="/saude-diabetes-apui"         label="Diabetes Mellitus"      Icon={Stethoscope}/>
            <L1 to="/saude-quilombola-apui"       label="Saúde Quilombola"       Icon={Users}/>
            <L1 to="/seguranca-alimentar-apui"    label="Segurança Alimentar"    Icon={ShoppingBag}/>
            <L1 to="/hepatites-virais-apui"       label="Hepatites Virais"        Icon={FlaskConical}/>
            <L1 to="/saude-neonatal-apui"         label="Saúde Neonatal"          Icon={Baby}/>
            <L1 to="/infeccoes-hospitalares-apui" label="Infecções Hospitalares"  Icon={ShieldCheck}/>
            <L1 to="/saude-homem-apui"            label="Saúde do Homem"          Icon={UserCog}/>
            <L1 to="/saude-ocular-apui"           label="Saúde Ocular"            Icon={Eye}/>
            <L1 to="/saude-auditiva-apui"         label="Saúde Auditiva"          Icon={Radio}/>
            <L1 to="/saude-adolescente-apui"      label="Saúde do Adolescente"    Icon={Sparkles}/>
            <L1 to="/doencas-raras-apui"          label="Doenças Raras"           Icon={FlaskRound}/>
            <L1 to="/clima-saude-apui"            label="Clima e Saúde"           Icon={Thermometer}/>
            <L1 to="/tfd-especialidades-apui"     label="TFD e Especialidades"    Icon={Globe}/>
            <L1 to="/residuos-saude-apui"         label="Resíduos de Saúde"       Icon={Trash2}/>
            <L1 to="/economia-saude-apui"         label="Economia da Saúde"       Icon={TrendingDown}/>
            <L1 to="/mortalidade-materna-apui"    label="Mortalidade Materna"     Icon={Heart}/>
            <L1 to="/tabagismo-dpoc-apui"         label="Tabagismo e DPOC"        Icon={Wind}/>
            <L1 to="/saude-lgbtqia-apui"          label="Saúde LGBTQIA+"          Icon={Smile}/>
            <L1 to="/dengue-arboviroses-apui"     label="Dengue e Arboviroses"    Icon={Radio}/>
            <L1 to="/ilpi-idoso-apui"             label="ILPI e Idoso Dependente" Icon={Building2}/>
            <L1 to="/farmacia-popular-apui"        label="Farmácia Popular"        Icon={ShoppingBag}/>
            <L1 to="/acidentes-transito-apui"     label="Acidentes de Trânsito"   Icon={AlertTriangle}/>
            <L1 to="/saude-mental-infantil-apui"  label="Saúde Mental Infantil"   Icon={Brain}/>
            <L1 to="/saneamento-basico-apui"       label="Saneamento Básico"       Icon={Waves}/>
            <L1 to="/planejamento-familiar-apui"  label="Planejamento Familiar"   Icon={Calendar}/>
            <L1 to="/saude-prisional-apui"         label="Saúde Prisional"         Icon={Shield}/>
            <L1 to="/zoonoses-apui"                label="Controle de Zoonoses"    Icon={FlaskRound}/>
            <L1 to="/atividade-fisica-apui"        label="Atividade Física"         Icon={Thermometer}/>
            <L1 to="/infraestrutura-ubs-apui"      label="Infraestrutura das UBSs"  Icon={Wrench}/>
            <L1 to="/medicamentos-alto-custo-apui" label="Medicamentos Alto Custo"  Icon={Star}/>
            <L1 to="/residuos-solidos-urbanos-apui" label="Resíduos Sólidos"       Icon={Trash2}/>
            <L1 to="/fila-cirurgica-apui"          label="Fila Cirúrgica"          Icon={Clock}/>
            <L1 to="/prevencao-suicidio-apui"      label="Prevenção do Suicídio"   Icon={Heart}/>
            <L1 to="/pcd-crianca-apui"             label="PcD Criança/Habilitação" Icon={Baby}/>
            <L1 to="/demencia-alzheimer-apui"      label="Demência e Alzheimer"    Icon={UserCog}/>
            <L1 to="/icsap-apui"                   label="ICSAP — Internações Evit." Icon={Stethoscope}/>
            <L1 to="/leishmaniose-visceral-apui"   label="Leishmaniose Visceral"   Icon={Droplets}/>
            <L1 to="/desnutricao-infantil-apui"    label="Desnutrição Infantil"    Icon={Brain}/>
            <L1 to="/prenatal-risco-gestacional-apui" label="Pré-Natal Risco Gestac." Icon={Syringe}/>
            <L1 to="/queimadas-respiratoria-apui"  label="Queimadas Respiratória"  Icon={Wind}/>
            <L1 to="/saude-escolar-pse-apui"       label="Saúde Escolar / PSE"      Icon={School}/>
            <L1 to="/doencas-negligenciadas-apui"  label="Doenças Negligenciadas"   Icon={Bug}/>
            <L1 to="/saude-mental-infantojuvenil-apui" label="Saúde Mental Infanto-Juv." Icon={Smile}/>
            <L1 to="/integracao-tempo-real-apui"       label="Integração Tempo Real"      Icon={Radio}/>
            <L1 to="/saude-populacao-rua-apui"         label="Saúde Pop. Situação de Rua"  Icon={Home}/>
            <L1 to="/gestao-riscos-saude-apui"         label="Gestão de Riscos"            Icon={ShieldCheck}/>
            <L1 to="/acesso-especialidades-apui"       label="Acesso a Especialidades"     Icon={Stethoscope}/>
            <L1 to="/saude-sexual-reprodutiva-apui"    label="Saúde Sexual e Reprodutiva"  Icon={Heart}/>
            <L1 to="/auditoria-interna-apui"           label="Auditoria Interna"           Icon={Shield}/>
            <L1 to="/monitoramento-metas-apui"         label="Monitoramento de Metas"      Icon={Target}/>
            <L1 to="/controle-vetorial-apui"           label="Controle Vetorial"            Icon={Bug}/>
            <L1 to="/comite-mortalidade-apui"          label="Comitê de Mortalidade"        Icon={HeartPulse}/>
            <L1 to="/suas-sus-apui"                    label="Interface SUAS/SUS"           Icon={HandHeart}/>
            <L1 to="/cadeia-frio-apui"                 label="Cadeia de Frio / PNI"         Icon={Thermometer}/>
            <L1 to="/matriciamento-nasf-apui"          label="Matriciamento NASF/eMulti"    Icon={Users}/>
            <L1 to="/ceac-ambulatorial-apui"           label="CEAC Ambulatorial"            Icon={Stethoscope}/>
            <L1 to="/farmacovigilancia-apui"           label="Farmacovigilância"             Icon={FlaskConical}/>
            <L1 to="/banco-leite-apui"                 label="Banco de Leite Humano"         Icon={Baby}/>
            <L1 to="/judicializacao-saude-apui"        label="Judicialização em Saúde"       Icon={Scale}/>
            <L1 to="/mercurio-garimpo-apui"           label="Mercúrio e Garimpo"       Icon={FlaskConical}/>
            <L1 to="/saude-ocular-apui"               label="Saúde Ocular"             Icon={Eye}/>
            <L1 to="/violencia-domestica-sexual-apui" label="Violência Doméstica/Sex." Icon={Shield}/>
            <L1 to="/cuidados-paliativos-apui"        label="Cuidados Paliativos"      Icon={Heart}/>
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
            <Route path="/regulacao-mac"             element={<RegulacaoMAC/>}/>
            <Route path="/ppa-loa"                   element={<PainelPPALOA/>}/>
            <Route path="/absenteismo"               element={<Absenteismo/>}/>
            <Route path="/sala-vacinas"              element={<SalaVacinas/>}/>
            <Route path="/raps"                      element={<RAPS/>}/>
            <Route path="/manutencao"                element={<Manutencao/>}/>
            <Route path="/vigilancia-epid"           element={<NotificacoesSINAN/>}/>
            <Route path="/transporte-sanitario"      element={<TransporteSanitario/>}/>
            <Route path="/producao-sisab"            element={<ProducaoSISAB/>}/>
            <Route path="/saude-mulher"              element={<SaudeMulher/>}/>
            <Route path="/conselho-saude"            element={<ConselhoSaude/>}/>
            <Route path="/saude-crianca"             element={<SaudeCrianca/>}/>
            <Route path="/visa"                      element={<VigilanciaVISA/>}/>
            <Route path="/vetores"                   element={<ControleVetores/>}/>
            <Route path="/sisvan"                    element={<SISVAN/>}/>
            <Route path="/atencao-domiciliar"        element={<AtencaoDomiciliar/>}/>
            <Route path="/tb-hanseniase"             element={<TbHanseniase/>}/>
            <Route path="/ist-hiv"                   element={<IstHiv/>}/>
            <Route path="/saude-idoso"               element={<SaudeIdoso/>}/>
            <Route path="/saude-homem"               element={<SaudeHomem/>}/>
            <Route path="/sim-sinasc"                element={<SimSinasc/>}/>
            <Route path="/saude-trabalhador"         element={<SaudeTrabalhador/>}/>
            <Route path="/saude-adolescente"         element={<SaudeAdolescente/>}/>
            <Route path="/hiperdia"                  element={<HiperDia/>}/>
            <Route path="/rede-frio"                 element={<RedeFrio/>}/>
            <Route path="/farmacia-especializada"    element={<FarmaciaEspecializada/>}/>
            <Route path="/controle-tabaco"           element={<ControleTabaco/>}/>
            <Route path="/icsap"                     element={<ICSAP/>}/>
            <Route path="/hemoterapia"               element={<Hemoterapia/>}/>
            <Route path="/ccih"                      element={<CCIH/>}/>
            <Route path="/sadt"                      element={<SADT/>}/>
            <Route path="/saude-prisional"           element={<SaudePrisional/>}/>
            <Route path="/nutricao-clinica"          element={<NutricaoClinica/>}/>
            <Route path="/telessaude"                element={<Telessaude/>}/>
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
            <Route path="/consultorio-rua"           element={<ConsultorioRua/>}/>
            <Route path="/cerest"                    element={<CEREST/>}/>
            <Route path="/caps-infanto"              element={<CAPSInfanto/>}/>
            <Route path="/vigilancia-obito"          element={<VigilanciaObito/>}/>
            <Route path="/caps-ad"                   element={<CAPSAD/>}/>
            <Route path="/saude-estomia"             element={<SaudeEstomia/>}/>
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
            <Route path="/visa-municipal-apui"      element={<VisaMunicipalApui/>}/>
            <Route path="/educacao-permanente-apui"element={<EducacaoPermanenteApui/>}/>
            <Route path="/conselho-saude-apui"          element={<ConselhoSaudeApui/>}/>
            <Route path="/ouvidoria-apui"               element={<OuvidoriaApui/>}/>
            <Route path="/seguranca-paciente-apui"      element={<SegurancaPacienteApui/>}/>
            <Route path="/telessaude-apui"              element={<TelessaudeApui/>}/>
            <Route path="/laboratorio-apui"             element={<LaboratorioApui/>}/>
            <Route path="/farmacia-especializada-apui"  element={<FarmaciaEspecializadaApui/>}/>
            <Route path="/cuidados-paliativos"           element={<CuidadosPaliativos/>}/>
            <Route path="/cuidados-paliativos-apui"      element={<CuidadosPaliativosApui/>}/>
            <Route path="/gestao-leitos-apui"           element={<GestaoLeitosApui/>}/>
            <Route path="/aleitamento-materno-apui"         element={<AleitamentoMaternoApui/>}/>
            <Route path="/banco-sangue-hemoterapia-apui" element={<BancoSangueHemoterapiaApui/>}/>
            <Route path="/doacao-orgaos-apui"            element={<DoacaoOrgaosApui/>}/>
            <Route path="/nutricao-clinica-apui"         element={<NutricaoClinicaApui/>}/>
            <Route path="/psicologia-aps-apui"           element={<PsicologiaApsApui/>}/>
            <Route path="/mortalidade-prematura-apui"    element={<MortalidadePrematuraApui/>}/>
            <Route path="/saude-financeira-apui"         element={<SaudeFinanceiraApui/>}/>
            <Route path="/politica-prevencao-apui"      element={<PoliticaPrevencaoApui/>}/>
            <Route path="/gestao-contratos-apui"        element={<GestaoContratosApui/>}/>
            <Route path="/regulacao-acesso-apui"        element={<RegulacaoAcessoApui/>}/>
            <Route path="/saude-ribeirinha-apui"        element={<SaudeRibeirinhaApui/>}/>
            <Route path="/saude-ribeirinha"              element={<SaudeRibeirinha/>}/>
            <Route path="/reabilitacao-apui"             element={<ReabilitacaoApui/>}/>
            <Route path="/saude-familia-apui"            element={<SaudeFamiliaApui/>}/>
            <Route path="/saude-mental-caps-apui"        element={<SaudeMentalCapsApui/>}/>
            <Route path="/imunizacao-apui"               element={<ImunizacaoApui/>}/>
            <Route path="/vigilancia-epidem-apui"        element={<VigilanciaEpidemApui/>}/>
            <Route path="/saude-mulher-apui"             element={<SaudeMulherApui/>}/>
            <Route path="/saude-crianca-apui"            element={<SaudeCriancaApui/>}/>
            <Route path="/hiperdia-apui"                 element={<HiperdiaApui/>}/>
            <Route path="/saude-idoso-apui"              element={<SaudeIdosoApui/>}/>
            <Route path="/oncologia-apui"                element={<OncologiaApui/>}/>
            <Route path="/tuberculose-apui"              element={<TuberculoseApui/>}/>
            <Route path="/malaria-apui"                  element={<MalariaApui/>}/>
            <Route path="/saude-bucal-apui"              element={<SaudeBucalApui/>}/>
            <Route path="/ist-hiv-hepatites-apui"        element={<IstHivHepatitesApui/>}/>
            <Route path="/hanseniase-apui"               element={<HanseniaseApui/>}/>
            <Route path="/saude-ambiental-apui"          element={<SaudeAmbientalApui/>}/>
            <Route path="/urgencia-emergencia-apui"      element={<UrgenciaEmergenciaApui/>}/>
            <Route path="/nutricao-sisvan-apui"          element={<NutricaoSisvanApui/>}/>
            <Route path="/regulacao-especializada-apui"  element={<RegulacaoEspecializadaApui/>}/>
            <Route path="/regulacao-referencia-apui"    element={<RegulacaoReferenciaApui/>}/>
            <Route path="/saude-trabalhador-apui"   element={<SaudeTrabalhadorApui/>}/>
            <Route path="/farmacia-basica-apui"     element={<FarmaciaBasicaApui/>}/>
            <Route path="/saude-escolar-apui"       element={<SaudeEscolarApui/>}/>
            <Route path="/vigilancia-sanitaria-apui" element={<VigilanciaSanitariaApui/>}/>
            <Route path="/saude-indigena-apui"       element={<SaudeIndígenaApui/>}/>
            <Route path="/doencas-cronicas-apui"     element={<DoencasCronicasApui/>}/>
            <Route path="/saude-mental-apui"         element={<SaudeMentalApui2/>}/>
            <Route path="/materno-infantil-apui"     element={<MaternoInfantilApui/>}/>
            <Route path="/atencao-primaria-apui"     element={<AtencaoPrimariaApui/>}/>
            <Route path="/vigilancia-epidemiologica-apui" element={<VigilanciaEpidemiologicaApui/>}/>
            <Route path="/gestao-hospitalar-apui"         element={<GestaoHospitalarApui/>}/>
            <Route path="/agua-saneamento-apui"           element={<AguaSaneamentoApui/>}/>
            <Route path="/saude-digital-apui"             element={<SaudeDigitalApui/>}/>
            <Route path="/fundo-municipal-saude-apui"     element={<FundoMunicipalSaudeApui/>}/>
            <Route path="/saude-garimpo-apui"             element={<SaudeGarimpoApui/>}/>
            <Route path="/recursos-humanos-saude-apui"    element={<RecursosHumanosSaudeApui/>}/>
            <Route path="/rede-logistica-apui"            element={<RedeLogisticaApui/>}/>
            <Route path="/saude-pcd-apui"                element={<SaudePcdApui/>}/>
            <Route path="/planejamento-saude-apui"       element={<PlanejamentoSaudeApui/>}/>
            <Route path="/saude-respiratoria-apui"       element={<SaudeRespiratoriaApui/>}/>
            <Route path="/saude-cardiovascular-apui"     element={<SaudeCardiovascularApui/>}/>
            <Route path="/saude-renal-apui"              element={<SaudeRenalApui/>}/>
            <Route path="/violencia-acidentes-apui"      element={<ViolenciaAcidentesApui/>}/>
            <Route path="/saude-diabetes-apui"           element={<SaudeDiabetesApui/>}/>
            <Route path="/saude-quilombola-apui"         element={<SaudeQuilombolaApui/>}/>
            <Route path="/seguranca-alimentar-apui"      element={<SegurancaAlimentarApui/>}/>
            <Route path="/hepatites-virais-apui"        element={<HepatitesViraisApui/>}/>
            <Route path="/saude-neonatal-apui"          element={<SaudeNeonatalApui/>}/>
            <Route path="/infeccoes-hospitalares-apui"  element={<InfeccoesHospitalaresApui/>}/>
            <Route path="/saude-homem-apui"             element={<SaudeHomemApui/>}/>
            <Route path="/saude-ocular-apui"            element={<SaudeOcularApui/>}/>
            <Route path="/saude-auditiva-apui"          element={<SaudeAuditivaApui/>}/>
            <Route path="/saude-adolescente-apui"       element={<SaudeAdolescenteApui/>}/>
            <Route path="/doencas-raras-apui"           element={<DoencasRarasApui/>}/>
            <Route path="/clima-saude-apui"             element={<ClimaSaudeApui/>}/>
            <Route path="/tfd-especialidades-apui"      element={<TfdEspecialidadesApui/>}/>
            <Route path="/residuos-saude-apui"          element={<ResiduosSaudeApui/>}/>
            <Route path="/economia-saude-apui"          element={<EconomiaSaudeApui/>}/>
            <Route path="/mortalidade-materna-apui"     element={<MortalidadeMaternaApui/>}/>
            <Route path="/tabagismo-dpoc-apui"          element={<TabagismoDpocApui/>}/>
            <Route path="/saude-lgbtqia-apui"           element={<SaudeLgbtqiaApui/>}/>
            <Route path="/dengue-arboviroses-apui"      element={<DengueArbovirosesApui/>}/>
            <Route path="/ilpi-idoso-apui"              element={<IlpiIdosoApui/>}/>
            <Route path="/farmacia-popular-apui"        element={<FarmaciaPopularApui/>}/>
            <Route path="/acidentes-transito-apui"     element={<AcidentesTransitoApui/>}/>
            <Route path="/saude-mental-infantil-apui"  element={<SaudeMentalInfantilApui/>}/>
            <Route path="/saneamento-basico-apui"      element={<SaneamentoBasicoApui/>}/>
            <Route path="/planejamento-familiar-apui" element={<PlanejamentoFamiliarApui/>}/>
            <Route path="/saude-prisional-apui"       element={<SaudePrisionalApui/>}/>
            <Route path="/zoonoses-apui"              element={<ZoonosesApui/>}/>
            <Route path="/atividade-fisica-apui"      element={<AtividadeFisicaApui/>}/>
            <Route path="/infraestrutura-ubs-apui"    element={<InfraestruturaUbsApui/>}/>
            <Route path="/medicamentos-alto-custo-apui" element={<MedicamentosAltoCustoApui/>}/>
            <Route path="/violencia-domestica-sexual-apui" element={<ViolenciaDomesticaSexualApui/>}/>
            <Route path="/mercurio-garimpo-apui"       element={<MercurioGarimpoApui/>}/>
            <Route path="/residuos-solidos-urbanos-apui" element={<ResiduosSolidosUrbanosApui/>}/>
            <Route path="/fila-cirurgica-apui"          element={<FilaCirurgicaApui/>}/>
            <Route path="/prevencao-suicidio-apui"      element={<PrevencaoSuicidioApui/>}/>
            <Route path="/pcd-crianca-apui"             element={<PcdCriancaApui/>}/>
            <Route path="/demencia-alzheimer-apui"   element={<DemenciaAlzheimerApui/>}/>
            <Route path="/icsap-apui"                element={<IcsapApui/>}/>
            <Route path="/leishmaniose-visceral-apui" element={<LeishmanioseVisceralApui/>}/>
            <Route path="/desnutricao-infantil-apui" element={<DesnutricaoInfantilApui/>}/>
            <Route path="/prenatal-risco-gestacional-apui" element={<PrenatalRiscoGestacionalApui/>}/>
            <Route path="/queimadas-respiratoria-apui" element={<QueimAdasRespiratoriaApui/>}/>
            <Route path="/saude-escolar-pse-apui"        element={<SaudeEscolarPseApui/>}/>
            <Route path="/doencas-negligenciadas-apui"   element={<DoencasNegligenciadasApui/>}/>
            <Route path="/saude-mental-infantojuvenil-apui" element={<SaudeMentalInfantoJuvenilApui/>}/>
            <Route path="/integracao-tempo-real-apui"      element={<IntegracaoTempoRealApui/>}/>
            <Route path="/saude-populacao-rua-apui"       element={<SaudePopulacaoRuaApui/>}/>
            <Route path="/gestao-riscos-saude-apui"       element={<GestaoRiscosSaudeApui/>}/>
            <Route path="/acesso-especialidades-apui"     element={<AcessoEspecialidadesApui/>}/>
            <Route path="/saude-sexual-reprodutiva-apui"  element={<SaudeSexualReprodutoraApui/>}/>
            <Route path="/auditoria-interna-apui"         element={<AuditoriaInternaApui/>}/>
            <Route path="/monitoramento-metas-apui"       element={<MonitoramentoMetasApui/>}/>
            <Route path="/controle-vetorial-apui"         element={<ControleVetorialApui/>}/>
            <Route path="/comite-mortalidade-apui"        element={<ComiteMortalidadeApui/>}/>
            <Route path="/suas-sus-apui"                  element={<SuaSusApui/>}/>
            <Route path="/cadeia-frio-apui"               element={<CadeiaFrioApui/>}/>
            <Route path="/matriciamento-nasf-apui"        element={<MatriciamentoNasfApui/>}/>
            <Route path="/ceac-ambulatorial-apui"         element={<CeacAmbulatorialApui/>}/>
            <Route path="/farmacovigilancia-apui"          element={<FarmacovigilanciaApui/>}/>
            <Route path="/banco-leite-apui"                element={<BancoLeiteApui/>}/>
            <Route path="/judicializacao-saude-apui"       element={<JudicializacaoSaudeApui/>}/>
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
