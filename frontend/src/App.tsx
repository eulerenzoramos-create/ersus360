// src/App.tsx — ERSUS 360 · Sidebar estilo VersaSaúde (3 níveis)
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import {
  Home, BarChart2, Map, ChevronDown, ChevronRight,
  ArrowLeftRight, Target, Building2, Bell, Bot, LogOut,
  FileText, DollarSign, FolderOpen, BarChart3, ClipboardList,
  Activity, Pill, ShieldCheck, Truck, Network, MapPin, Users,
  Landmark, Baby, Heart, Stethoscope, Syringe, FlaskConical,
  AlertTriangle, BookOpen, Calendar, Clipboard, UserCheck,
  TrendingUp, PieChart, Layers, Star, Shield, Monitor,
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
          <div style={{width:34,height:34,background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.2)",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff"}}>
            <Bell size={16}/>
          </div>
          <ChevronDown size={12} style={{color:"rgba(255,255,255,.6)"}}/>
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
              <L2 to="/busca-ativa/gestante"  label="Gestante"  Icon={Baby}/>
              <L2 to="/busca-ativa/vacinas"   label="Vacinas"   Icon={Syringe}/>
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
                <L3 to="/emendas"   label="Emendas Parlamentares"       Icon={Landmark}/>
              </Acc2>
            </Acc1>

            {/* ── Informatiza APS ── */}
            <div style={{borderTop:"1px solid #f0f0f0", marginTop:4}}>
              <L1 to="/informatiza-aps" label="Informatiza APS"  Icon={Network}/>
              <L1 to="/sus360"          label="SUS 360° — MS"    Icon={Monitor}/>
              <L1 to="/ia"              label="IA Gestora"        Icon={Bot}/>
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
            <Route path="/ranking"                   element={<Indicadores/>}/>
            <Route path="/mapa"                      element={<PainelGestor/>}/>
            {/* Saúde Brasil 360 */}
            <Route path="/sb360/*"                   element={<APS/>}/>
            {/* Previne Brasil */}
            <Route path="/previne"                   element={<PrevineBrasil/>}/>
            <Route path="/previne/*"                 element={<PrevineBrasil/>}/>
            {/* Painel de Gestão */}
            <Route path="/gestao"                    element={<PainelGestor/>}/>
            <Route path="/gestao/*"                  element={<PainelGestor/>}/>
            {/* Busca Ativa */}
            <Route path="/busca-ativa/*"             element={<Alertas/>}/>
            {/* ACS */}
            <Route path="/acs/*"                     element={<Municipio/>}/>
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
            <Route path="/aps"                       element={<APS/>}/>
            <Route path="/aps/*"                     element={<APS/>}/>
            <Route path="/farmacia"                  element={<Farmacia/>}/>
            <Route path="/farmacia/*"                element={<Farmacia/>}/>
            <Route path="/vigilancia"                element={<Vigilancia/>}/>
            <Route path="/vigilancia/*"              element={<Vigilancia/>}/>
            <Route path="/transporte"                element={<Transporte/>}/>
            <Route path="/regulacao"                 element={<Regulacao/>}/>
            <Route path="/usuarios"                  element={<Usuarios/>}/>
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
