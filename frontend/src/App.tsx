// src/App.tsx — ERSUS 360
import { useState, createContext, useContext, Component, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";

// ── Error Boundary global — evita tela branca em crashes de componentes ───────
class AppErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }
  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, message: String(error) };
  }
  componentDidCatch(error: unknown, info: unknown) {
    console.error("[ERSUS ErrorBoundary]", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "system-ui", background: "#f4f6f8" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 32, maxWidth: 480, textAlign: "center", boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ color: "#1e3a5f", marginBottom: 8 }}>Erro ao carregar o ERSUS 360</h2>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>{this.state.message}</p>
            <button
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              style={{ background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontSize: 14 }}
            >
              Limpar sessão e tentar novamente
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Page-level Error Boundary — isola crash de uma página sem derrubar o app ──
class PageErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }
  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, message: String(error) };
  }
  componentDidCatch(error: unknown, info: unknown) {
    console.error("[ERSUS PageError]", error, info);
  }
  componentDidUpdate(prev: { children: React.ReactNode }) {
    if (prev.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false, message: "" });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display:"flex", flexDirection:"column" as const, alignItems:"center", justifyContent:"center",
          height:"100%", fontFamily:"system-ui", padding:40, gap:16 }}>
          <div style={{ background:"#fff8f0", border:"1px solid #fbbf24", borderRadius:12, padding:24,
            maxWidth:480, textAlign:"center" as const }}>
            <div style={{ fontSize:32, marginBottom:8 }}>⚠️</div>
            <h3 style={{ color:"#92400e", marginBottom:8, fontSize:16 }}>Erro nesta página</h3>
            <p style={{ color:"#78350f", fontSize:12, marginBottom:16 }}>{this.state.message}</p>
            <button onClick={() => this.setState({ hasError:false, message:"" })}
              style={{ background:"#1e3a5f", color:"#fff", border:"none", borderRadius:8,
                padding:"8px 20px", cursor:"pointer", fontSize:13 }}>
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Auth Context — disponível para qualquer componente filho ──────────────────
export interface AuthUser {
  nome: string;
  perfil: string;
  municipio_ibge: string;   // "" = assessoria (acesso total)
  municipio: string;
  perfis_assessoria: boolean;
}
export const AuthContext = createContext<AuthUser>({
  nome: "", perfil: "", municipio_ibge: "", municipio: "", perfis_assessoria: false,
});
export const useAuth = () => useContext(AuthContext);
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from "react-router-dom";
import {
  Home, BarChart2, Map, ChevronDown, ChevronRight,
  ArrowLeftRight, Target, Building2, Bot, LogOut, GitBranch,
  FileText, DollarSign, FolderOpen, BarChart3, ClipboardList,
  Activity, Pill, ShieldCheck, Truck, Network, MapPin, Users,
  Landmark, Baby, Heart, Stethoscope, Syringe, FlaskConical,
  AlertTriangle, BookOpen, Calendar, Clipboard, UserCheck,
  TrendingUp, PieChart, Layers, Star, Shield, Monitor, UserCog,
  Radio, Globe, ShoppingBag, Bell, Search, MessageSquare, Wrench, Brain, Bug, FlaskRound, Smile, Thermometer, Droplets, Utensils,
  Wind, Eye, TrendingDown, Trash2, School, Sparkles, Waves, Clock,
  HeartPulse, HandHeart, Scale, Ship, Trophy, Package,
  ShieldAlert, Calculator, ClipboardCheck, Download, Award, Plug,
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
import InvestSUS       from "./pages/InvestSUS";
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
import RepassesApsApui  from "./pages/RepassesApsApui";
import PainelGestaoAPS  from "./pages/PainelGestaoAPS";
import SiapsEgestor      from "./pages/SiapsEgestor";
import IndicadoresAPS    from "./pages/IndicadoresAPS";
import PainelCAF         from "./pages/PainelCAF";
import MatrizNormativaAPS from "./pages/MatrizNormativaAPS";
import FolhaPagamento from "./pages/FolhaPagamento";
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
import SIOPSLive              from "./pages/SIOPSLive";
import SIOPSCompleto          from "./pages/SIOPSCompleto";
import SICONFIPanel           from "./pages/SICONFIPanel";
import RREOAnexo12            from "./pages/RREOAnexo12";
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
import CentralAuditoria         from "./pages/CentralAuditoria";
import GapAnalysisAPS           from "./pages/GapAnalysisAPS";
import PlanoAcao                from "./pages/PlanoAcao";
import TrilhaAuditoria          from "./pages/TrilhaAuditoria";
import MonitorLotesSIAPS        from "./pages/MonitorLotesSIAPS";
import ConformidadeSCNES        from "./pages/ConformidadeSCNES";
import QualidadeCADSUS          from "./pages/QualidadeCADSUS";
import GatewayRNDS              from "./pages/GatewayRNDS";
import IntegracaoPEC            from "./pages/IntegracaoPEC";
import MapaVisitasDomiciliares  from "./pages/MapaVisitasDomiciliares";
import RegistrarVisita          from "./pages/RegistrarVisita";
import CadastrosCidadao         from "./pages/CadastrosCidadao";
import VisitasDomiciliaresCidadao from "./pages/VisitasDomiciliaresCidadao";
import LinhaTempoCidadao        from "./pages/LinhaTempoCidadao";
import RelatorioTCETCU          from "./pages/RelatorioTCETCU";
import PrevisaoPrevineBrasil    from "./pages/PrevisaoPrevineBrasil";
import SimuladorCenarios        from "./pages/SimuladorCenarios";
import ScoreRiscoESF            from "./pages/ScoreRiscoESF";
import AuditoriaAutomatica      from "./pages/AuditoriaAutomatica";
import PainelOKR               from "./pages/PainelOKR";
import CentralRegulacao        from "./pages/CentralRegulacao";
import MonitorEpidemiologico   from "./pages/MonitorEpidemiologico";
import RelatorioRAS             from "./pages/RelatorioRAS";
import CronogramaRepasses       from "./pages/CronogramaRepasses";
import BuscaAtivaIA             from "./pages/BuscaAtivaIA";
import GestaoEquipamentos       from "./pages/GestaoEquipamentos";
import PainelTransparencia      from "./pages/PainelTransparencia";
import PainelVacinacao          from "./pages/PainelVacinacao";
import Almoxarifado             from "./pages/Almoxarifado";
import RelatorioGestao          from "./pages/RelatorioGestao";
import MapaSanitario            from "./pages/MapaSanitario";
import GestaoContratos          from "./pages/GestaoContratos";
import ConselhoMunicipalSaude   from "./pages/ConselhoMunicipalSaude";
import ProducaoAPS              from "./pages/ProducaoAPS";
import DashboardExecutivo360    from "./pages/DashboardExecutivo360";
import CentroNotificacoes       from "./pages/CentroNotificacoes";
import ExportadorRelatorios     from "./pages/ExportadorRelatorios";
import IDSUSMunicipal           from "./pages/IDSUSMunicipal";
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
import SaudeIndigenaApui          from "./pages/SaudeIndigenaApui";
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
import MonitoramentoRtApui          from "./pages/MonitoramentoRtApui";
import RelatorioProducao            from "./pages/RelatorioProducao";
import ParametrosMS                 from "./pages/ParametrosMS";
import FichasTecnicas               from "./pages/FichasTecnicas";
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
import EssenciaisApui               from "./pages/EssenciaisApui";
import TriagemNeonatalApui          from "./pages/TriagemNeonatalApui";
import AbsenteismoApui              from "./pages/AbsenteismoApui";
import PICSApui                     from "./pages/PICSApui";
import SprintOtimo                  from "./pages/SprintOtimo";
import AnaliseMunicipio             from "./pages/AnaliseMunicipio";
import AnaliseBrasil360            from "./pages/AnaliseBrasil360";
import CvatDashboard                from "./pages/CvatDashboard";
import Inconsistencias              from "./pages/Inconsistencias";
import RelatorioERSUS               from "./pages/RelatorioERSUS";
import PainelIntegracoes            from "./pages/PainelIntegracoes";
import GatewayIntegracao            from "./pages/GatewayIntegracao";
import { SinoAlertas } from "./components/SinoAlertas";
import ExportarRelatorio from "./components/ExportarRelatorio";

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });

// ── Design System ─────────────────────────────────────────────────────────────
const BLUE     = "#1565c0";
const GRAY     = "#616161";
const LIGHT_BG = "#f5f5f3";
const SB_BG    = "#0f1b2d";   // sidebar dark navy
const SB_HOVER = "#1a2d47";
const SB_ACT   = "#1e40af";
const SB_TEXT  = "#cbd5e1";
const SB_MUTED = "#64748b";
const SB_ACCENT= "#38bdf8";

// ── Helpers de estilo ────────────────────────────────────────────────────────
const navSimpleStyle = (active: boolean) => ({
  display:"flex", alignItems:"center", gap:9, padding:"8px 14px",
  color: active ? SB_ACCENT : SB_TEXT, cursor:"pointer",
  background: active ? SB_ACT : "transparent",
  fontSize:12.5, fontWeight: active ? 700 : 400, textDecoration:"none" as const,
  borderLeft: `3px solid ${active ? SB_ACCENT : "transparent"}`,
  transition:"background .12s, color .12s",
});

const grp1Style = {
  display:"flex", alignItems:"center", justifyContent:"space-between",
  padding:"7px 14px", cursor:"pointer", fontSize:11, fontWeight:700,
  color:SB_MUTED, textTransform:"uppercase" as const, letterSpacing:"0.06em",
  borderTop:"1px solid #1e2d3d", marginTop:4,
};
const grp2Style = {
  display:"flex", alignItems:"center", justifyContent:"space-between",
  padding:"7px 14px 7px 26px", cursor:"pointer", fontSize:12.5, fontWeight:500, color:SB_TEXT,
};
const grp3Style = {
  display:"flex", alignItems:"center", justifyContent:"space-between",
  padding:"6px 14px 6px 36px", cursor:"pointer", fontSize:12, fontWeight:400, color:SB_MUTED,
};

const leaf2Style = (active: boolean) => ({
  display:"flex", alignItems:"center", gap:8, padding:"7px 14px 7px 26px",
  fontSize:12.5, color: active ? SB_ACCENT : SB_TEXT, textDecoration:"none" as const,
  background: active ? SB_ACT : "transparent", fontWeight: active ? 700 : 400,
  borderLeft: `3px solid ${active ? SB_ACCENT : "transparent"}`,
});
const leaf3Style = (active: boolean) => ({
  display:"flex", alignItems:"center", gap:8, padding:"6px 14px 6px 36px",
  fontSize:12, color: active ? SB_ACCENT : SB_MUTED, textDecoration:"none" as const,
  background: active ? "#162032" : "transparent", fontWeight: active ? 600 : 400,
  borderLeft: `3px solid ${active ? SB_ACCENT : "transparent"}`,
});
const leaf4Style = (active: boolean) => ({
  display:"flex", alignItems:"center", gap:8, padding:"6px 14px 6px 48px",
  fontSize:11.5, color: active ? SB_ACCENT : SB_MUTED, textDecoration:"none" as const,
  background: active ? "#162032" : "transparent", fontWeight: active ? 600 : 400,
});

// ── Divisor de seção ─────────────────────────────────────────────────────────
function SbSection({ label }: { label: string }) {
  return (
    <div style={{ padding:"12px 14px 4px", fontSize:10, fontWeight:800, letterSpacing:"0.1em",
      textTransform:"uppercase" as const, color:SB_MUTED, borderTop:"1px solid #1a2d40", marginTop:6 }}>
      {label}
    </div>
  );
}

// ── Componentes de acordeão ──────────────────────────────────────────────────
function Acc1({ label, children, open: init=false, icon }: { label:string; children:React.ReactNode; open?:boolean; icon?: React.ReactNode }) {
  const [open,setOpen]=useState(init);
  return (
    <div>
      <div role="button" aria-expanded={open} aria-label={label} tabIndex={0}
        style={grp1Style} onClick={()=>setOpen(o=>!o)}
        onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")setOpen(o=>!o);}}>
        <span style={{display:"flex",alignItems:"center",gap:6}}>{icon}{label}</span>
        {open ? <ChevronDown size={12} color={SB_MUTED}/> : <ChevronRight size={12} color={SB_MUTED}/>}
      </div>
      {open && <div>{children}</div>}
    </div>
  );
}

function Acc2({ label, children, open: init=false }: { label:string; children:React.ReactNode; open?:boolean }) {
  const [open,setOpen]=useState(init);
  return (
    <div>
      <div role="button" aria-expanded={open} aria-label={label} tabIndex={0}
        style={grp2Style} onClick={()=>setOpen(o=>!o)}
        onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")setOpen(o=>!o);}}>
        <span>{label}</span>
        {open ? <ChevronDown size={12} color={SB_MUTED}/> : <ChevronRight size={12} color={SB_MUTED}/>}
      </div>
      {open && <div style={{background:"#0c1624"}}>{children}</div>}
    </div>
  );
}

function Acc3({ label, children, open: init=false }: { label:string; children:React.ReactNode; open?:boolean }) {
  const [open,setOpen]=useState(init);
  return (
    <div>
      <div role="button" aria-expanded={open} aria-label={label} tabIndex={0}
        style={grp3Style} onClick={()=>setOpen(o=>!o)}
        onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")setOpen(o=>!o);}}>
        <span>{label}</span>
        {open ? <ChevronDown size={11} color={SB_MUTED}/> : <ChevronRight size={11} color={SB_MUTED}/>}
      </div>
      {open && <div>{children}</div>}
    </div>
  );
}

function L1({ to, label, Icon, end=false, badge }: { to:string; label:string; Icon:React.ElementType; end?:boolean; badge?: string }) {
  const loc=useLocation(); const active = end ? loc.pathname===to : loc.pathname.startsWith(to);
  return (
    <NavLink to={to} end={end} aria-current={active ? "page" : undefined} style={navSimpleStyle(active)}>
      <Icon size={15} color={active ? SB_ACCENT : SB_MUTED} aria-hidden="true"/>
      <span style={{flex:1}}>{label}</span>
      {badge && <span style={{fontSize:9,fontWeight:800,background:"#ef4444",color:"#fff",padding:"1px 5px",borderRadius:8}} aria-label={`${badge} alertas`}>{badge}</span>}
    </NavLink>
  );
}
function L2({ to, label, Icon }: { to:string; label:string; Icon:React.ElementType }) {
  const loc=useLocation(); const active=loc.pathname===to;
  return <NavLink to={to} aria-current={active ? "page" : undefined} style={leaf2Style(active)}><Icon size={13} color={active?SB_ACCENT:SB_MUTED} aria-hidden="true"/>{label}</NavLink>;
}
function L3({ to, label, Icon }: { to:string; label:string; Icon:React.ElementType }) {
  const loc=useLocation(); const active=loc.pathname===to;
  return <NavLink to={to} aria-current={active ? "page" : undefined} style={leaf3Style(active)}><Icon size={13} color={active?SB_ACCENT:SB_MUTED} aria-hidden="true"/>{label}</NavLink>;
}
function L4({ to, label, Icon }: { to:string; label:string; Icon:React.ElementType }) {
  const loc=useLocation(); const active=loc.pathname===to;
  return <NavLink to={to} aria-current={active ? "page" : undefined} style={leaf4Style(active)}><Icon size={12} color={active?SB_ACCENT:SB_MUTED} aria-hidden="true"/>{label}</NavLink>;
}

// ── Quick Access Cards ────────────────────────────────────────────────────────
function QuickCard({ to, label, Icon, cor }: { to:string; label:string; Icon:React.ElementType; cor:string }) {
  const loc = useLocation();
  const active = loc.pathname.startsWith(to);
  return (
    <NavLink to={to} style={{
      display:"flex", flexDirection:"column" as const, alignItems:"center", justifyContent:"center",
      gap:5, padding:"10px 4px", borderRadius:8, textDecoration:"none",
      background: active ? cor+"33" : "#1a2d47",
      border: `1px solid ${active ? cor : "#1e3a5f"}`,
      transition:"all .15s", flex:1, minWidth:0,
    }}>
      <div style={{width:28,height:28,borderRadius:6,background:cor+"22",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Icon size={14} color={cor}/>
      </div>
      <span style={{fontSize:9.5,fontWeight:600,color:active?cor:SB_TEXT,textAlign:"center" as const,lineHeight:1.2,wordBreak:"break-word" as const}}>{label}</span>
    </NavLink>
  );
}

// ── Permissões por perfil ─────────────────────────────────────────────────────
const PODE_FIN  = new Set(["superadmin","admin","gestor","financeiro","contabilidade","prefeito"]);
const PODE_USR  = new Set(["superadmin","admin"]);
const PODE_RH   = new Set(["superadmin","admin","gestor"]);
const PODE_AUD  = new Set(["superadmin","admin","gestor","auditoria"]);

const CARGO_LABEL: Record<string,string> = {
  superadmin:"Administrador Geral", admin:"Administrador do Sistema",
  gestor:"Gestor Municipal de Saúde", coordenador:"Coordenador de APS",
  enfermeiro:"Enfermeiro(a)", medico:"Médico(a)", tecnico_aps:"Técnico(a) de APS",
  acs:"Agente Comunitário de Saúde", odontologia:"Odontólogo(a)",
  farmaceutico:"Farmacêutico(a)", vigilancia:"Vigilância em Saúde",
  financeiro:"Setor Financeiro", contabilidade:"Contabilidade",
  planejamento:"Planejamento", auditoria:"Auditoria",
  prefeito:"Prefeito(a)", conselho:"Conselho de Saúde", consulta:"Consulta",
};

// ── Layout ───────────────────────────────────────────────────────────────────
function Layout({ children, nomeUsuario, perfilUsuario, municipioIbge, municipioNome, perfisAssessoria, onLogout }: {
  children: React.ReactNode;
  nomeUsuario: string;
  perfilUsuario: string;
  municipioIbge: string;
  municipioNome: string;
  perfisAssessoria: boolean;
  onLogout: () => void;
}) {
  const ini = (nomeUsuario||"G").split(" ").map((w:string)=>w[0]).join("").slice(0,2).toUpperCase();
  const podeFin = PODE_FIN.has(perfilUsuario);
  const podeUsr = PODE_USR.has(perfilUsuario);
  const podeRH  = PODE_RH.has(perfilUsuario);
  const podeAud = PODE_AUD.has(perfilUsuario);
  const cargoExib = CARGO_LABEL[perfilUsuario] || "Usuário";
  return (
    <AuthContext.Provider value={{
      nome: nomeUsuario,
      perfil: perfilUsuario,
      municipio_ibge: municipioIbge,
      municipio: municipioNome,
      perfis_assessoria: perfisAssessoria,
    }}>
    <div style={{display:"flex",flexDirection:"column",height:"100vh",fontFamily:"system-ui,-apple-system,sans-serif"}}>

      {/* ── Skip link (WCAG 2.4.1) ── */}
      <a href="#ersus-main" style={{
        position:"absolute",left:-9999,top:"auto",width:1,height:1,overflow:"hidden",
        zIndex:9999,background:"#1d4ed8",color:"#fff",padding:"8px 16px",borderRadius:4,
        fontWeight:700,fontSize:14,textDecoration:"none",
        ":focus":{left:8,top:8,width:"auto",height:"auto",overflow:"visible"},
      }} onFocus={e=>{Object.assign(e.currentTarget.style,{left:"8px",top:"8px",width:"auto",height:"auto",overflow:"visible"})}}
         onBlur={e=>{Object.assign(e.currentTarget.style,{left:"-9999px",top:"auto",width:"1px",height:"1px",overflow:"hidden"})}}>
        Ir para o conteúdo principal
      </a>

      {/* ── Header ── */}
      <header role="banner" style={{
        height:56, background:"linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)",
        display:"flex", alignItems:"center", padding:"0 20px", gap:14, flexShrink:0,
        boxShadow:"0 2px 8px rgba(0,0,0,.4)", zIndex:200, borderBottom:"1px solid #1e3a5f",
      }}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{
            width:38, height:38, borderRadius:10,
            background:"linear-gradient(135deg,#1d4ed8,#0ea5e9)",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 2px 8px rgba(14,165,233,.4)",
          }}>
            <span style={{color:"#fff",fontSize:20}}>⚕</span>
          </div>
          <div>
            <div style={{color:"#fff",fontSize:16,fontWeight:800,lineHeight:1,letterSpacing:"-0.02em"}}>ERSUS 360</div>
            <div style={{color:"#94a3b8",fontSize:9.5,letterSpacing:"0.04em",textTransform:"uppercase" as const}}>Sistema de Gestão em Saúde</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{width:1,height:30,background:"#1e3a5f",margin:"0 4px"}}/>

        {/* Breadcrumb / Município */}
        <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.06)",borderRadius:8,padding:"6px 12px",border:"1px solid rgba(255,255,255,.1)"}}>
          <MapPin size={13} color="#38bdf8"/>
          <span style={{color:"#e2e8f0",fontSize:13,fontWeight:700}}>
            {perfisAssessoria ? "Assessoria" : (municipioNome || "Apuí / AM")}
          </span>
          {!perfisAssessoria && (
            <span style={{color:"#475569",fontSize:11}}>· IBGE {municipioIbge || "1300144"}</span>
          )}
        </div>

        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
          {/* Status Online */}
          <div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.3)",borderRadius:6,padding:"4px 10px"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 6px #22c55e"}}/>
            <span style={{color:"#86efac",fontSize:11,fontWeight:600}}>Online</span>
          </div>

          <SinoAlertas />

          <ExportarRelatorio nomeUsuario={nomeUsuario} perfilUsuario={perfilUsuario} />

          {/* User */}
          <div style={{
            display:"flex", alignItems:"center", gap:8, cursor:"pointer",
            background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.15)",
            borderRadius:8, padding:"5px 10px", transition:"background .15s",
          }} onClick={onLogout} title="Clique para sair" aria-label={`Sair — ${nomeUsuario}`} role="button">
            <div style={{
              width:30, height:30, borderRadius:8,
              background:"linear-gradient(135deg,#1d4ed8,#7c3aed)",
              display:"flex", alignItems:"center", justifyContent:"center",
              color:"#fff", fontSize:12, fontWeight:800,
            }}>{ini}</div>
            <div>
              <div style={{color:"#f1f5f9",fontSize:12,fontWeight:700,lineHeight:1}}>{(nomeUsuario||"GESTOR").toUpperCase()}</div>
              <div style={{color:"#64748b",fontSize:10}}>{cargoExib}</div>
            </div>
            <ChevronDown size={12} color="#64748b"/>
          </div>
        </div>
      </header>

      {/* Body */}
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* ── Sidebar ── */}
        <Sidebar perfil={perfilUsuario} nomeUsuario={nomeUsuario} onLogout={onLogout} />

        {/* LEGADO — bloco mantido apenas para referência; nunca será renderizado */}
        {false && <aside id="ersus-sidebar" role="navigation" aria-label="Menu principal" style={{
          width:252, background:SB_BG,
          display:"flex", flexDirection:"column" as const, overflow:"hidden",
          boxShadow:"2px 0 12px rgba(0,0,0,.3)",
        }}>
          <div style={{flex:1,overflowY:"auto",scrollbarWidth:"thin" as const,scrollbarColor:"#1e3a5f transparent"}}>

            {/* ── Acesso Rápido ── */}
            <div style={{padding:"12px 10px 8px"}}>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:SB_MUTED,marginBottom:8}}>
                Acesso Rápido
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                <QuickCard to="/"           label="Home"        Icon={Home}        cor="#38bdf8"/>
                {podeFin && <QuickCard to="/financeiro" label="Financeiro"  Icon={DollarSign}  cor="#22c55e"/>}
                <QuickCard to="/indicadores-aps" label="Indicadores APS" Icon={BarChart2} cor="#1d4ed8"/>
                <QuickCard to="/siaps"      label="e-Gestor"    Icon={Globe}       cor="#a78bfa"/>
                {podeFin && <QuickCard to="/caf"        label="CAF"         Icon={TrendingUp}  cor="#fb923c"/>}
                <QuickCard to="/previne"    label="Qualidade"   Icon={Target}      cor="#38bdf8"/>
                <QuickCard to="/parametros-ms" label="Parâm. MS" Icon={BookOpen}  cor="#f472b6"/>
              </div>
            </div>

            {/* ── Módulos Essenciais ── */}
            <div style={{padding:"4px 10px 6px"}}>
              <NavLink to="/essenciais-apui" style={({isActive})=>({
                display:"flex", alignItems:"center", gap:8, padding:"9px 12px", borderRadius:8,
                fontWeight:700, fontSize:12.5,
                background: isActive ? "linear-gradient(135deg,#1d4ed8,#0ea5e9)" : "linear-gradient(135deg,#1a3a6e,#1e4080)",
                color:"#fff", textDecoration:"none",
                border:`1px solid ${isActive?"#3b82f6":"#1e3a5f"}`,
                boxShadow: isActive ? "0 2px 8px rgba(29,78,216,.4)" : "none",
              })}>
                <Star size={14} color="#fbbf24"/> Módulos Essenciais Apuí
              </NavLink>
            </div>

            {/* ── M01: Visão Executiva ── */}
            <SbSection label="Visão Executiva"/>
            <L1 to="/"                       label="Painel do Gestor"           Icon={Home}        end/>
            <L1 to="/dashboard-executivo"    label="Dashboard Executivo 360°"   Icon={Monitor}/>
            <L1 to="/score"                  label="Score ERSUS 360"            Icon={Star}/>
            <L1 to="/mapa"                   label="Mapa de Desempenho"         Icon={Map}/>
            <L1 to="/ranking"                label="Ranking Municipal"          Icon={BarChart2}/>
            <L1 to="/idsus-municipal"        label="IDSUS Municipal"            Icon={Award}/>
            <L1 to="/ia"                     label="IA Gestora"                 Icon={Bot}/>
            <L1 to="/okr"                    label="OKRs Estratégicos"          Icon={Target}/>
            <L1 to="/bi"                     label="Business Intelligence"      Icon={TrendingUp}/>

            {/* ── M02: Atenção Primária ── */}
            <SbSection label="Atenção Primária"/>
            <L1 to="/aps"                    label="Painel APS"                 Icon={Stethoscope}/>

            <Acc1 label="Cofinanciamento APS (P. 3.493)">
              <L2 to="/previne"            label="Consolidado C/B/M"   Icon={PieChart}/>
              <L2 to="/previne/grupoC"     label="Grupo C — eSF/eAP"  Icon={Users}/>
              <L2 to="/previne/grupoB"     label="Grupo B — eSB"      Icon={Stethoscope}/>
              <L2 to="/previne/grupoM"     label="Grupo M — eMulti"   Icon={Activity}/>
              <L2 to="/previne/ribeirinha" label="eRibeirinha"         Icon={Ship}/>
              <L2 to="/sprint-otimo"       label="Sprint ÓTIMO"        Icon={Star}/>
            </Acc1>

            <Acc1 label="Saúde Brasil 360">
              <L2 to="/cvat"                             label="CVAT — Multimunicípio"         Icon={Users}/>
              <L2 to="/sb360/consolidado-territorial"    label="Consolidado Territorial"       Icon={PieChart}/>
              <L2 to="/sb360/acompanhamento-territorial" label="Acompanhamento Territorial"    Icon={MapPin}/>
              <L2 to="/sb360/mais-acesso-aps"            label="Mais Acesso à APS"             Icon={Heart}/>
              <L2 to="/sb360/desenvolvimento-infantil"   label="Desenvolvimento Infantil"      Icon={Baby}/>
              <L2 to="/sb360/gestante-puerpera"          label="Gestante e Puérpera"           Icon={Baby}/>
              <L2 to="/sb360/pessoa-diabetes"            label="Pessoa com Diabetes"           Icon={FlaskConical}/>
              <L2 to="/sb360/pessoa-hipertensao"         label="Pessoa com Hipertensão"        Icon={Activity}/>
              <L2 to="/sb360/pessoa-idosa"               label="Pessoa Idosa"                  Icon={UserCheck}/>
              <L2 to="/sb360/mulher-cancer"              label="Mulher — Prevenção Câncer"     Icon={ShieldCheck}/>
              <L2 to="/sb360/equipes-multiprofissionais" label="Equipes Multiprofissionais"    Icon={Users}/>
            </Acc1>

            <Acc1 label="Produção e Monitoramento">
              <L2 to="/producao-sisab"     label="Produção APS · SISAB"    Icon={BarChart2}/>
              <L2 to="/relatorio-producao" label="Relatório de Produção"   Icon={FileText}/>
              <L2 to="/gestao"             label="Painel de Gestão APS"    Icon={PieChart}/>
              <L2 to="/analise-municipio"  label="Análise Brasil 360"      Icon={PieChart}/>
              <L2 to="/parametros-ms"      label="Parâmetros MS"           Icon={BookOpen}/>
              <L2 to="/fichas-tecnicas"    label="Fichas Técnicas"         Icon={Clipboard}/>
              <L2 to="/score-municipal"    label="Score Municipal"         Icon={Star}/>
              <L2 to="/simulador-cenarios" label="Simulador de Cenários"   Icon={Calculator}/>
            </Acc1>

            <Acc1 label="Busca Ativa">
              <L2 to="/busca-ativa"          label="Painel Geral"     Icon={Search}/>
              <L2 to="/busca-ativa/gestante" label="Gestante"         Icon={Baby}/>
              <L2 to="/busca-ativa/vacinas"  label="Vacinas"          Icon={Syringe}/>
              <L2 to="/busca-ativa/cito"     label="Citopatológico"   Icon={Activity}/>
              <L2 to="/busca-ativa-ia"       label="Busca Ativa · IA" Icon={Brain}/>
            </Acc1>

            <Acc1 label="ACS">
              <L2 to="/acs/painel"           label="Painel do ACS"         Icon={BarChart3}/>
              <L2 to="/acs/cadastros-cid"    label="Cadastros do Cidadão"  Icon={Users}/>
              <L2 to="/acs/visitas-cidadao"  label="Visitas Domiciliares"  Icon={MapPin}/>
              <L2 to="/acs/mapa-visitas"     label="Mapa de Visitas"       Icon={Map}/>
              <L2 to="/acs/registrar-visita" label="Registrar Visita"      Icon={ClipboardCheck}/>
            </Acc1>

            <L1 to="/acolhimento"            label="Acolhimento / Classificação" Icon={Clock}/>
            <L1 to="/matriz-normativa-aps"   label="Matriz Normativa APS"        Icon={BookOpen}/>
            <L1 to="/nasf"                   label="NASF / eMulti"               Icon={Users}/>
            <L1 to="/academia-saude"         label="Academia da Saúde"           Icon={Activity}/>
            <L1 to="/pics-apui"              label="PICS"                        Icon={Sparkles}/>
            <L1 to="/saude-escolar-pse-apui" label="Saúde na Escola (PSE)"       Icon={School}/>

            {/* ── M03: Financeiro e Gestão Fiscal ── */}
            <SbSection label="Financeiro e Gestão Fiscal"/>
            {podeFin && (
            <>
              <L1 to="/financeiro"               label="Painel Financeiro"              Icon={DollarSign}/>
              <L1 to="/repasses-aps-apui"        label="Repasses APS — Apuí/AM"         Icon={TrendingUp}/>
              <Acc1 label="FNS / Convênios">
                <L2 to="/fns"       label="Consolidado de Convênios"  Icon={Clipboard}/>
                <L2 to="/portarias" label="Portarias FNS"             Icon={FileText}/>
                <L2 to="/execucao"  label="Execução por Bloco"        Icon={DollarSign}/>
                <L2 to="/emendas"     label="Emendas Parlamentares"         Icon={Landmark}/>
                <L2 to="/investsus"  label="InvestSUS — Propostas/Execução" Icon={Landmark}/>
              </Acc1>
              <L1 to="/siops"                    label="SIOPS / Mínimo Constitucional"  Icon={Target}/>
              <L1 to="/siconfi"                  label="SICONFI"                        Icon={Building2}/>
              <L1 to="/rreo-anexo12"             label="RREO Anexo 12"                  Icon={FileText}/>
              <L1 to="/ppa-loa"                  label="PPA / LOA"                      Icon={ClipboardList}/>
              <L1 to="/regulacao-mac"            label="Regulação MAC"                  Icon={ArrowLeftRight}/>
              <L1 to="/caf"                      label="CAF — Cofinanciamento"          Icon={TrendingUp}/>
              <L1 to="/painel-transparencia"     label="Transparência LAI"              Icon={Globe}/>
              <L1 to="/relatorio-tce-tcu"        label="Relatório TCE / TCU"            Icon={Shield}/>
              <L1 to="/fundo-municipal-saude-apui" label="Fundo Municipal de Saúde"     Icon={Landmark}/>
            </>
            )}

            {/* ── M04: Planejamento e Prestação de Contas ── */}
            <SbSection label="Planejamento e Prestação de Contas"/>
            <L1 to="/plano-municipal-saude"  label="Plano Municipal de Saúde"       Icon={ClipboardList}/>
            <L1 to="/planejamento"           label="Planejamento em Saúde"          Icon={ClipboardList}/>
            <L1 to="/rdqa"                   label="RDQA — Relatório Quadrimestral" Icon={Calendar}/>
            <L1 to="/plano-acao"             label="Plano de Ação"                  Icon={ClipboardList}/>
            <L1 to="/relatorio-gestao"       label="Relatório de Gestão"            Icon={FileText}/>
            <L1 to="/gestao-contratos"       label="Contratos e Licitações"         Icon={FileText}/>
            <L1 to="/conselho-saude-apui"    label="Conselho Municipal de Saúde"    Icon={Users}/>
            <L1 to="/ouvidoria-apui"         label="Ouvidoria Municipal"            Icon={MessageSquare}/>
            <L1 to="/conformidade"           label="Conformidade Legal"             Icon={Shield}/>

            {/* ── M05: Vigilância em Saúde ── */}
            <SbSection label="Vigilância em Saúde"/>
            <L1 to="/sala-vacinas"           label="Sala de Vacinas / SIPNI"        Icon={Syringe}/>
            <L1 to="/epidemiologia"          label="Epidemiologia / SINAN"          Icon={Activity}/>
            <L1 to="/monitor-epidemiologico" label="Monitor Epidemiológico"         Icon={Activity}/>
            <L1 to="/ist-hiv"                label="IST / HIV / Hepatites"          Icon={ShieldCheck}/>
            <L1 to="/sim-sinasc"             label="SIM / SINASC"                   Icon={FileText}/>
            <L1 to="/tb-hanseniase"          label="TB / Hanseníase"                Icon={ShieldCheck}/>
            <L1 to="/arboviroses"            label="Arboviroses / Dengue"           Icon={Bug}/>
            <L1 to="/malaria-apui"           label="Malária / Endemias"             Icon={Bug}/>
            <L1 to="/vetores"                label="Controle de Vetores"            Icon={Bug}/>
            <L1 to="/zoonoses-apui"          label="Zoonoses"                       Icon={Bug}/>
            <L1 to="/visa"                   label="VISA / Vigilância Sanitária"    Icon={Shield}/>
            <L1 to="/ccih"                   label="CCIH / Infecções"               Icon={Shield}/>
            <L1 to="/vigiagua"               label="VigiÁgua"                       Icon={Droplets}/>
            <L1 to="/sisvan"                 label="SISVAN / Nutrição"              Icon={ShoppingBag}/>
            <L1 to="/cancer-rastreio"        label="Rastreio de Câncer"             Icon={Activity}/>

            {/* ── M06: Assistência Farmacêutica ── */}
            <SbSection label="Assistência Farmacêutica"/>
            <L1 to="/farmacia"                    label="Farmácia Básica"          Icon={Pill}/>
            <L1 to="/farmacia-especializada-apui" label="Farmácia Especializada"   Icon={Pill}/>
            <L1 to="/farmacovigilancia-apui"      label="Farmacovigilância"        Icon={ShieldCheck}/>
            <L1 to="/almoxarifado"                label="Almoxarifado"             Icon={Package}/>

            {/* ── M07: Atenção Especializada e Regulação ── */}
            <SbSection label="Atenção Especializada e Regulação"/>
            <L1 to="/atencao-especializada"    label="Atenção Especializada"         Icon={Stethoscope}/>
            <L1 to="/urgencia-emergencia-apui" label="Urgência / Emergência"         Icon={Activity}/>
            <L1 to="/samu"                     label="SAMU 192"                      Icon={Radio}/>
            <L1 to="/atencao-domiciliar"       label="Atenção Domiciliar (SAD)"      Icon={Home}/>
            <L1 to="/regulacao-acesso-apui"    label="Regulação e Acesso"            Icon={Network}/>
            <L1 to="/gestao-leitos-apui"       label="Gestão de Leitos"              Icon={Building2}/>
            <L1 to="/telessaude-apui"          label="TeleSaúde"                     Icon={Monitor}/>
            <L1 to="/seguranca-paciente-apui"  label="Segurança do Paciente"         Icon={Shield}/>
            <L1 to="/reabilitacao-apui"        label="Reabilitação"                  Icon={Activity}/>
            <L1 to="/hemoterapia"              label="Hemoterapia / BLH"             Icon={Droplets}/>
            <L1 to="/transporte-sanitario"     label="Transporte Sanitário"          Icon={Truck}/>
            <L1 to="/tfd-especialidades-apui"  label="TFD — Tratamento Fora do Dom." Icon={ArrowLeftRight}/>

            {/* ── M08: Saúde do Cidadão ── */}
            <SbSection label="Saúde do Cidadão"/>
            <Acc1 label="Saúde da Mulher">
              <L2 to="/saude-mulher"               label="Saúde da Mulher"       Icon={Heart}/>
              <L2 to="/rede-cegonha"               label="Rede Cegonha"          Icon={Baby}/>
              <L2 to="/planejamento-familiar-apui" label="Planejamento Familiar" Icon={Users}/>
            </Acc1>
            <Acc1 label="Saúde da Criança">
              <L2 to="/saude-crianca"          label="Saúde da Criança"     Icon={Baby}/>
              <L2 to="/triagem-neonatal-apui"  label="Triagem Neonatal"     Icon={Baby}/>
              <L2 to="/saude-adolescente-apui" label="Saúde do Adolescente" Icon={Users}/>
            </Acc1>
            <Acc1 label="Saúde Mental">
              <L2 to="/saude-mental" label="Saúde Mental" Icon={HeartPulse}/>
              <L2 to="/raps"         label="RAPS"         Icon={Network}/>
              <L2 to="/caps-ad"      label="CAPS AD"      Icon={Activity}/>
            </Acc1>
            <L1 to="/saude-idoso"            label="Saúde do Idoso"              Icon={UserCheck}/>
            <L1 to="/saude-bucal"            label="Saúde Bucal / CEO"           Icon={Stethoscope}/>
            <L1 to="/saude-homem"            label="Saúde do Homem"              Icon={UserCheck}/>
            <L1 to="/saude-trabalhador-apui" label="Saúde do Trabalhador"        Icon={Wrench}/>
            <L1 to="/saude-lgbtqia-apui"     label="Saúde LGBTQIA+"              Icon={Smile}/>
            <L1 to="/hiperdia-apui"          label="HiperDia"                    Icon={Activity}/>
            <L1 to="/leishmaniose"           label="Leishmaniose"                Icon={Bug}/>
            <L1 to="/saude-indigena-apui"    label="Saúde Indígena e Ribeirinha" Icon={MapPin}/>

            {/* ── M09: Central de Inconsistências ── */}
            <SbSection label="Central de Inconsistências"/>
            <L1 to="/inconsistencias"  label="Central de Inconsistências ★" Icon={AlertTriangle}/>
            <L1 to="/score-risco-esf"  label="Score de Risco ESF"           Icon={ShieldAlert}/>

            {/* ── M10: Central de Relatórios ── */}
            <SbSection label="Central de Relatórios"/>
            <L1 to="/relatorios"            label="Relatórios"                  Icon={FileText}/>
            <L1 to="/exportador-relatorios" label="Exportador de Relatórios"    Icon={Download}/>
            <L1 to="/relatorio-ersus"       label="Relatório ERSUS 360"         Icon={FileText}/>
            <L1 to="/mapa-sanitario"        label="Mapa Sanitário"              Icon={MapPin}/>
            <L1 to="/linha-tempo-cidadao"   label="Linha do Tempo do Cidadão"   Icon={Clock}/>
            <L1 to="/saude-digital-esus"    label="Saúde Digital e-SUS"         Icon={Network}/>

            {/* ── M11: Administração do Sistema ── */}
            <SbSection label="Administração do Sistema"/>
            {podeRH  && <L1 to="/rh"               label="Recursos Humanos"       Icon={UserCog}/>}
            {podeRH  && <L1 to="/folha-pagamento"   label="Folha de Pagamento"     Icon={DollarSign}/>}
            {podeRH  && <L1 to="/absenteismo-apui"  label="Absenteísmo / RHS"      Icon={UserCog}/>}
            {podeRH  && <L1 to="/cadastros"         label="Cadastros Mestres"      Icon={Layers}/>}
            {podeUsr && <L1 to="/usuarios"          label="Gestão de Usuários"     Icon={Users}/>}
            <L1 to="/indicadores-aps" label="Indicadores APS · SIAPS"  Icon={BarChart2}/>
            <L1 to="/siaps"       label="eGestor (legado)"         Icon={Globe}/>
            <L1 to="/integracoes" label="Painel de Integrações ★"  Icon={Plug}/>
            {podeAud && <L1 to="/auditoria"      label="Auditoria e Controle"   Icon={Shield}/>}
            {podeAud && <L1 to="/gateway-rnds"   label="Gateway RNDS · FHIR R4" Icon={Network}/>}
            {podeAud && <L1 to="/integracao-pec" label="Integração PEC e-SUS"   Icon={Plug}/>}

            {/* ── Gestão Operacional ── */}
            <SbSection label="Gestão Operacional"/>
            <L1 to="/patrimonio"          label="Patrimônio"             Icon={Truck}/>
            <L1 to="/frota"               label="Frota"                  Icon={Truck}/>
            <L1 to="/obras"               label="Obras e Infraestrutura" Icon={Building2}/>
            <L1 to="/gestao-equipamentos" label="Equipamentos"           Icon={Wrench}/>
            <L1 to="/manutencao"          label="Manutenção"             Icon={Wrench}/>
            <L1 to="/agenda"              label="Agenda de Gestão"       Icon={Calendar}/>
            <L1 to="/documentos"          label="Documentos"             Icon={FileText}/>
            <L1 to="/cme"                 label="CME"                    Icon={Thermometer}/>
            <L1 to="/pgrss"               label="PGRSS"                  Icon={Trash2}/>
            <L1 to="/alertas"             label="Central de Alertas"     Icon={AlertTriangle}/>
            <L1 to="/notificacoes"        label="Centro de Notificações" Icon={Bell}/>

            <div style={{height:24}}/>
          </div>

          {/* Footer sidebar */}
          <div style={{
            padding:"12px 14px", borderTop:"1px solid #1a2d40",
            flexShrink:0, background:"#0a1520",
          }}>
            <div style={{fontSize:11,color:SB_MUTED,marginBottom:8,lineHeight:1.6}}>
              <span style={{color:"#38bdf8",fontWeight:700}}>ERSUS 360</span> · FMS Apuí/AM
              <br/><span style={{fontSize:10}}>v1.0.0 · SAPS ©2026</span>
            </div>
            <div style={{
              display:"flex", alignItems:"center", gap:6, cursor:"pointer",
              color:"#f87171", fontSize:12, fontWeight:600,
              padding:"6px 10px", borderRadius:6, border:"1px solid #7f1d1d22",
              background:"rgba(239,68,68,.08)", transition:"background .15s",
            }} onClick={onLogout}>
              <LogOut size={13}/> Sair do sistema
            </div>
          </div>
        </aside>}

        {/* Main */}
        <main id="ersus-main" style={{flex:1,overflow:"auto",background:"#f1f5f9"}}>
          <PageErrorBoundary>{children}</PageErrorBoundary>
        </main>
      </div>
    </div>
    </AuthContext.Provider>
  );
}

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  // Acorda o backend Railway na inicialização (evita cold start lento)
  useEffect(() => {
    const base = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
    fetch(`${base}/health`, { method: "GET" }).catch(() => {});
  }, []);

  const [autenticado, setAutenticado]         = useState(!!localStorage.getItem("ersus_token"));
  const [nomeUsuario, setNomeUsuario]         = useState(localStorage.getItem("ersus_nome") ?? "");
  const [perfilUsuario, setPerfilUsuario]     = useState(localStorage.getItem("ersus_perfil") ?? "");
  const [municipioIbge, setMunicipioIbge]     = useState(localStorage.getItem("ersus_municipio_ibge") ?? "");
  const [municipioNome, setMunicipioNome]     = useState(localStorage.getItem("ersus_municipio") ?? "");
  const [perfisAssessoria, setPerfisAssessoria] = useState(
    localStorage.getItem("ersus_perfis_assessoria") === "true"
  );

  const handleLogin = (
    _token: string,
    perfil: string,
    nome: string,
    ibge: string | null,
    municipio: string,
    assessoria: boolean,
  ) => {
    setNomeUsuario(nome);
    setPerfilUsuario(perfil);
    setMunicipioIbge(ibge ?? "");
    setMunicipioNome(municipio);
    setPerfisAssessoria(assessoria);
    setAutenticado(true);
  };

  const handleLogout = () => {
    ["ersus_token","ersus_perfil","ersus_nome",
     "ersus_municipio_ibge","ersus_municipio","ersus_perfis_assessoria"]
      .forEach(k => localStorage.removeItem(k));
    setAutenticado(false);
  };

  if (!autenticado) {
    return <AppErrorBoundary><QueryClientProvider client={qc}><Login onLogin={handleLogin}/></QueryClientProvider></AppErrorBoundary>;
  }

  return (
    <AppErrorBoundary>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Layout
          nomeUsuario={nomeUsuario}
          perfilUsuario={perfilUsuario}
          municipioIbge={municipioIbge}
          municipioNome={municipioNome}
          perfisAssessoria={perfisAssessoria}
          onLogout={handleLogout}
        >
          <Routes>
            <Route path="/"                          element={<PainelGestor/>}/>
            <Route path="/score"                     element={<ScoreERSUS/>}/>
            <Route path="/ranking"                   element={<Indicadores/>}/>
            <Route path="/mapa"                      element={<MapaDesempenho/>}/>
            {/* Saúde Brasil 360 */}
            <Route path="/sb360/*"                   element={<APS/>}/>
            {/* Componente Qualidade — Novo Financiamento APS (Portaria 3.493/2024) */}
            <Route path="/previne"                   element={<PrevineBrasil/>}/>
            <Route path="/previne/*"                 element={<PrevineBrasil/>}/>
            <Route path="/sprint-otimo"              element={<SprintOtimo/>}/>
            <Route path="/analise-municipio"         element={<AnaliseBrasil360/>}/>
            <Route path="/analise-municipio-legado"  element={<AnaliseMunicipio/>}/>
            {/* Painel de Gestão */}
            <Route path="/gestao"                    element={<PainelGestaoAPS/>}/>
            <Route path="/gestao/*"                  element={<PainelGestaoAPS/>}/>
            {/* Busca Ativa */}
            <Route path="/busca-ativa"               element={<BuscaAtiva/>}/>
            <Route path="/busca-ativa/*"             element={<BuscaAtiva/>}/>
            {/* ACS */}
            <Route path="/acs/painel"                element={<ACSPainel/>}/>
            <Route path="/acs/mapa-visitas"           element={<MapaVisitasDomiciliares/>}/>
            <Route path="/acs/registrar-visita"       element={<RegistrarVisita/>}/>
            <Route path="/acs/cadastros-cid"          element={<CadastrosCidadao/>}/>
            <Route path="/acs/visitas-cidadao"        element={<VisitasDomiciliaresCidadao/>}/>
            <Route path="/acs/*"                     element={<ACSPainel/>}/>
            {/* CVAT — Vínculo e Acompanhamento Territorial (multimunicípio) */}
            <Route path="/cvat"                      element={<CvatDashboard/>}/>
            <Route path="/cvat/*"                    element={<CvatDashboard/>}/>
            {/* Inconsistências */}
            <Route path="/inconsistencias"           element={<Inconsistencias/>}/>
            <Route path="/inconsistencias/*"         element={<Inconsistencias/>}/>
            {/* Relatórios ERSUS 360 */}
            <Route path="/relatorio-ersus"           element={<RelatorioERSUS/>}/>
            <Route path="/relatorio-ersus/*"         element={<RelatorioERSUS/>}/>
            {/* Painel de Integrações */}
            <Route path="/integracoes"               element={<PainelIntegracoes/>}/>
            <Route path="/integracoes/*"             element={<PainelIntegracoes/>}/>
            <Route path="/gateway-integracao"        element={<GatewayIntegracao/>}/>
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
            <Route path="/investsus"                 element={<InvestSUS/>}/>
            {/* Informatiza APS */}
            <Route path="/informatiza-aps"           element={<APS/>}/>
            {/* Demais */}
            <Route path="/ia"                        element={<IAGestora/>}/>
            <Route path="/sus360" element={<Navigate to="/" replace/>}/>{/* arquivado: sistema MS externo */}
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
            <Route path="/siops-completo"            element={<Navigate to="/siops" replace/>}/>
            <Route path="/siops-detalhado"           element={<Navigate to="/siops" replace/>}/>
            <Route path="/siops-live"                element={<Navigate to="/siops" replace/>}/>
            <Route path="/financeiro"                element={<PainelFinanceiro/>}/>
            <Route path="/siaps"                     element={<SiapsEgestor/>}/>
            <Route path="/indicadores-aps"           element={<IndicadoresAPS/>}/>
            <Route path="/caf"                       element={<PainelCAF/>}/>
            <Route path="/matriz-normativa-aps"      element={<MatrizNormativaAPS/>}/>
            <Route path="/folha-pagamento"            element={<FolhaPagamento/>}/>
            <Route path="/ouvidoria" element={<Navigate to="/ouvidoria-apui" replace/>}/>
            <Route path="/regulacao-mac"             element={<RegulacaoMAC/>}/>
            <Route path="/ppa-loa"                   element={<PainelPPALOA/>}/>
            <Route path="/absenteismo" element={<Navigate to="/absenteismo-apui" replace/>}/>
            <Route path="/sala-vacinas"              element={<SalaVacinas/>}/>
            <Route path="/raps"                      element={<RAPS/>}/>
            <Route path="/manutencao"                element={<Manutencao/>}/>
            <Route path="/vigilancia-epid"           element={<NotificacoesSINAN/>}/>
            <Route path="/transporte-sanitario"      element={<TransporteSanitario/>}/>
            <Route path="/producao-sisab"            element={<ProducaoSISAB/>}/>
            <Route path="/saude-mulher"              element={<SaudeMulher/>}/>
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
            <Route path="/saude-trabalhador" element={<Navigate to="/saude-trabalhador-apui" replace/>}/>
            <Route path="/saude-adolescente" element={<Navigate to="/saude-adolescente-apui" replace/>}/>
            <Route path="/hiperdia" element={<Navigate to="/hiperdia-apui" replace/>}/>
            <Route path="/rede-frio"                 element={<RedeFrio/>}/>
            <Route path="/farmacia-especializada" element={<Navigate to="/farmacia-especializada-apui" replace/>}/>
            <Route path="/controle-tabaco"           element={<ControleTabaco/>}/>
            <Route path="/icsap" element={<Navigate to="/icsap-apui" replace/>}/>
            <Route path="/hemoterapia"               element={<Hemoterapia/>}/>
            <Route path="/ccih"                      element={<CCIH/>}/>
            <Route path="/sadt"                      element={<SADT/>}/>
            <Route path="/saude-prisional" element={<Navigate to="/saude-prisional-apui" replace/>}/>
            <Route path="/nutricao-clinica" element={<Navigate to="/nutricao-clinica-apui" replace/>}/>
            <Route path="/telessaude" element={<Navigate to="/telessaude-apui" replace/>}/>
            <Route path="/pgrss"                     element={<PGRSS/>}/>
            <Route path="/educacao-permanente"       element={<EducacaoPermanente/>}/>
            <Route path="/farmacovigilancia" element={<Navigate to="/farmacovigilancia-apui" replace/>}/>
            <Route path="/gestao-qualidade"          element={<GestaoQualidade/>}/>
            <Route path="/saude-digital" element={<Navigate to="/saude-digital-apui" replace/>}/>
            <Route path="/cme"                       element={<CME/>}/>
            <Route path="/pse"                       element={<PSE/>}/>
            <Route path="/blh"                       element={<BLH/>}/>
            <Route path="/pics" element={<Navigate to="/pics-apui" replace/>}/>
            <Route path="/frota"                     element={<Frota/>}/>
            <Route path="/vigiagua"                  element={<VigiAgua/>}/>
            <Route path="/nasf"                      element={<NASF/>}/>
            <Route path="/zoonoses" element={<Navigate to="/zoonoses-apui" replace/>}/>
            <Route path="/saude-servidor" element={<Navigate to="/absenteismo-apui" replace/>}/>
            <Route path="/planejamento-familiar" element={<Navigate to="/planejamento-familiar-apui" replace/>}/>
            <Route path="/acolhimento"               element={<Acolhimento/>}/>
            <Route path="/judicializacao"            element={<Judicializacao/>}/>
            <Route path="/spd"                       element={<SPD/>}/>
            <Route path="/contratos" element={<Navigate to="/gestao-contratos" replace/>}/>
            <Route path="/samu"                      element={<SAMU/>}/>
            <Route path="/pnae" element={<Navigate to="/" replace/>}/>{/* arquivado: competência Educação */}
            <Route path="/siconfi"                  element={<SICONFIPanel/>}/>
            <Route path="/rreo-anexo12"             element={<RREOAnexo12/>}/>
            <Route path="/pat-saude" element={<Navigate to="/patrimonio" replace/>}/>
            <Route path="/abastecimento"             element={<Abastecimento/>}/>
            <Route path="/seguranca-paciente" element={<Navigate to="/seguranca-paciente-apui" replace/>}/>
            <Route path="/visa-alimentos" element={<Navigate to="/visa" replace/>}/>
            <Route path="/academia-saude"            element={<AcademiaSaude/>}/>
            <Route path="/laboratorio" element={<Navigate to="/laboratorio-apui" replace/>}/>
            <Route path="/crie"                      element={<CRIE/>}/>
            <Route path="/protocolo-clinico"         element={<ProtocoloClinico/>}/>
            <Route path="/consultorio-rua"           element={<ConsultorioRua/>}/>
            <Route path="/cerest"                    element={<CEREST/>}/>
            <Route path="/caps-infanto"              element={<CAPSInfanto/>}/>
            <Route path="/vigilancia-obito"          element={<VigilanciaObito/>}/>
            <Route path="/caps-ad"                   element={<CAPSAD/>}/>
            <Route path="/saude-estomia"             element={<SaudeEstomia/>}/>
            <Route path="/triagem-neonatal" element={<Navigate to="/triagem-neonatal-apui" replace/>}/>
            <Route path="/violencia-domestica"       element={<ViolenciaDomestica/>}/>
            <Route path="/malaria" element={<Navigate to="/malaria-apui" replace/>}/>
            <Route path="/leishmaniose"              element={<Leishmaniose/>}/>
            <Route path="/arboviroses"               element={<Arboviroses/>}/>
            <Route path="/saude-indigena"            element={<SaudeIndigena/>}/>
            <Route path="/hanseniase" element={<Navigate to="/hanseniase-apui" replace/>}/>
            <Route path="/tuberculose" element={<Navigate to="/tuberculose-apui" replace/>}/>
            <Route path="/dst-hiv"                   element={<Navigate to="/ist-hiv" replace/>}/>
            <Route path="/imunizacao" element={<Navigate to="/imunizacao-apui" replace/>}/>
            <Route path="/saude-mental"              element={<SaudeMental/>}/>
            <Route path="/saude-bucal"               element={<SaudeBucal/>}/>
            <Route path="/saude-ocular" element={<Navigate to="/saude-ocular-apui" replace/>}/>
            <Route path="/saude-auditiva" element={<Navigate to="/saude-auditiva-apui" replace/>}/>
            <Route path="/oncologia" element={<Navigate to="/oncologia-apui" replace/>}/>
            <Route path="/dcnt"                      element={<DCNT/>}/>
            <Route path="/nutricao"                  element={<Nutricao/>}/>
            <Route path="/reabilitacao" element={<Navigate to="/reabilitacao-apui" replace/>}/>
            <Route path="/assist-farmaceutica"       element={<AssistFarmaceutica/>}/>
            <Route path="/saude-ambiental" element={<Navigate to="/saude-ambiental-apui" replace/>}/>
            <Route path="/vig-epidem-avancada"       element={<VigEpidemAvancada/>}/>
            <Route path="/saude-digital-esus"        element={<SaudeDigitalEsus/>}/>
            <Route path="/gestao-pessoas"            element={<GestaoPessoas/>}/>
            <Route path="/fundo-municipal"           element={<FundoMunicipal/>}/>
            <Route path="/judicializacao-saude" element={<Navigate to="/judicializacao-saude-apui" replace/>}/>
            <Route path="/atencao-especializada"     element={<AtencaoEspecializada/>}/>
            <Route path="/malaria-endemias"        element={<MalariaEndemias/>}/>
            <Route path="/vigilancia-nutricional" element={<VigilanciaNutricional/>}/>
            <Route path="/dcnt-cronicas"           element={<DcntCronicas/>}/>
            <Route path="/cancer-rastreio"        element={<CancerRastreio/>}/>
            <Route path="/saude-bucal-municipal"  element={<SaudeBucalMunicipal/>}/>
            <Route path="/saude-mental-caps" element={<Navigate to="/saude-mental-caps-apui" replace/>}/>
            <Route path="/rede-cegonha"           element={<RedeCegonha/>}/>
            <Route path="/programa-saude-escola"  element={<ProgramaSaudeEscola/>}/>
            <Route path="/plano-municipal-saude"   element={<PlanoMunicipalSaude/>}/>
            <Route path="/score-municipal" element={<Navigate to="/score" replace/>}/>
            <Route path="/gestao-contratos-fms" element={<Navigate to="/gestao-contratos" replace/>}/>
            <Route path="/urgencia-emergencia" element={<Navigate to="/urgencia-emergencia-apui" replace/>}/>
            <Route path="/regulacao-acesso" element={<Navigate to="/regulacao-acesso-apui" replace/>}/>
            <Route path="/gestao-leitos" element={<Navigate to="/gestao-leitos-apui" replace/>}/>
            <Route path="/visa-municipal" element={<Navigate to="/visa" replace/>}/>
            <Route path="/visa-municipal-apui" element={<Navigate to="/visa" replace/>}/>
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
            <Route path="/gestao-contratos-apui" element={<Navigate to="/gestao-contratos" replace/>}/>
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
            <Route path="/saude-indigena-apui"       element={<SaudeIndigenaApui/>}/>
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
            <Route path="/monitoramento-rt-apui"          element={<MonitoramentoRtApui/>}/>
            <Route path="/relatorio-producao"             element={<RelatorioProducao/>}/>
            <Route path="/parametros-ms"                  element={<ParametrosMS/>}/>
            <Route path="/fichas-tecnicas"                element={<FichasTecnicas/>}/>
            <Route path="/controle-vetorial-apui"         element={<ControleVetorialApui/>}/>
            <Route path="/comite-mortalidade-apui"        element={<ComiteMortalidadeApui/>}/>
            <Route path="/suas-sus-apui"                  element={<SuaSusApui/>}/>
            <Route path="/cadeia-frio-apui"               element={<CadeiaFrioApui/>}/>
            <Route path="/matriciamento-nasf-apui"        element={<MatriciamentoNasfApui/>}/>
            <Route path="/ceac-ambulatorial-apui"         element={<CeacAmbulatorialApui/>}/>
            <Route path="/farmacovigilancia-apui"          element={<FarmacovigilanciaApui/>}/>
            <Route path="/banco-leite-apui"                element={<BancoLeiteApui/>}/>
            <Route path="/judicializacao-saude-apui"       element={<JudicializacaoSaudeApui/>}/>
            <Route path="/essenciais-apui"                 element={<EssenciaisApui/>}/>
            <Route path="/triagem-neonatal-apui"           element={<TriagemNeonatalApui/>}/>
            <Route path="/absenteismo-apui"                element={<AbsenteismoApui/>}/>
            <Route path="/pics-apui"                       element={<PICSApui/>}/>
            <Route path="/agenda"                    element={<Agenda/>}/>
            <Route path="/conformidade"              element={<Conformidade/>}/>
            <Route path="/alertas/historico"         element={<HistoricoAlertas/>}/>
            <Route path="/transporte"                element={<Transporte/>}/>
            <Route path="/regulacao"                 element={<Regulacao/>}/>
            <Route path="/usuarios"                  element={<Usuarios/>}/>
            <Route path="/auditoria"                 element={<Auditoria/>}/>
            <Route path="/central-auditoria"         element={<Navigate to="/auditoria" replace/>}/>
            <Route path="/auditoria-automatica"      element={<Navigate to="/auditoria" replace/>}/>
            <Route path="/trilha-auditoria"          element={<Navigate to="/auditoria" replace/>}/>
            <Route path="/relatorio-ras"             element={<Navigate to="/auditoria" replace/>}/>
            <Route path="/conformidade-scnes"   element={<Navigate to="/inconsistencias" replace/>}/>
            <Route path="/qualidade-cadsus"      element={<Navigate to="/inconsistencias" replace/>}/>
            <Route path="/monitor-lotes-siaps"   element={<Navigate to="/inconsistencias" replace/>}/>
            <Route path="/gap-analysis-aps"      element={<Navigate to="/inconsistencias" replace/>}/>
            <Route path="/plano-acao"                element={<PlanoAcao/>}/>
            <Route path="/gateway-rnds"              element={<GatewayRNDS/>}/>
            <Route path="/integracao-pec"            element={<IntegracaoPEC/>}/>
            <Route path="/linha-tempo-cidadao"       element={<LinhaTempoCidadao/>}/>
            <Route path="/relatorio-tce-tcu"         element={<RelatorioTCETCU/>}/>
            <Route path="/previsao-previne" element={<Navigate to="/aps" replace/>}/>{/* arquivado: ML sem API */}
            <Route path="/simulador-cenarios"        element={<SimuladorCenarios/>}/>
            <Route path="/score-risco-esf"           element={<ScoreRiscoESF/>}/>
            <Route path="/okr"                       element={<PainelOKR/>}/>
            <Route path="/central-regulacao"         element={<CentralRegulacao/>}/>
            <Route path="/monitor-epidemiologico"    element={<MonitorEpidemiologico/>}/>
            <Route path="/cronograma-repasses"       element={<CronogramaRepasses/>}/>
            <Route path="/repasses-aps-apui"          element={<RepassesApsApui/>}/>
            <Route path="/busca-ativa-ia"            element={<BuscaAtivaIA/>}/>
            <Route path="/gestao-equipamentos"       element={<GestaoEquipamentos/>}/>
            <Route path="/painel-transparencia"      element={<PainelTransparencia/>}/>
            <Route path="/vacinacao"               element={<PainelVacinacao/>}/>
            <Route path="/almoxarifado"            element={<Almoxarifado/>}/>
            <Route path="/relatorio-gestao"        element={<RelatorioGestao/>}/>
            <Route path="/mapa-sanitario"          element={<MapaSanitario/>}/>
            <Route path="/gestao-contratos"        element={<GestaoContratos/>}/>
            <Route path="/conselho-saude"          element={<ConselhoMunicipalSaude/>}/>
            <Route path="/producao-aps"            element={<Navigate to="/producao-sisab" replace/>}/>
            <Route path="/dashboard-executivo"     element={<DashboardExecutivo360/>}/>
            <Route path="/notificacoes"            element={<CentroNotificacoes/>}/>
            <Route path="/exportador-relatorios"   element={<ExportadorRelatorios/>}/>
            <Route path="/idsus-municipal"         element={<IDSUSMunicipal/>}/>
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
            <Route path="/portal-gestor" element={<Navigate to="/dashboard-executivo" replace/>}/>
            <Route path="/portal-cidadao" element={<Navigate to="/" replace/>}/>
            <Route path="/marketplace" element={<Navigate to="/" replace/>}/>{/* arquivado */}
            <Route path="/municipio"                 element={<Municipio/>}/>
            <Route path="/modulos"                   element={<Modulos/>}/>
            <Route path="/indicadores"               element={<Indicadores/>}/>
            <Route path="/ind/*"                     element={<Indicadores/>}/>
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
    </AppErrorBoundary>
  );
}
