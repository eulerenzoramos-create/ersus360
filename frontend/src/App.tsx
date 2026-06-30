// src/App.tsx — ERSUS 360 · Layout VersaSaúde
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import {
  Home, BarChart2, Map, ChevronDown, ChevronRight,
  ArrowLeftRight, Target, Building2, Heart, Bell,
  Settings, Bot, Monitor, LogOut,
} from "lucide-react";

import PainelGestor from "./pages/PainelGestor";
import Indicadores from "./pages/Indicadores";
import Modulos from "./pages/Modulos";
import FnsConvenios from "./pages/FnsConvenios";
import IAGestora from "./pages/IAGestora";
import Portarias from "./pages/Portarias";
import Obras from "./pages/Obras";
import Execucao from "./pages/Execucao";
import Documentos from "./pages/Documentos";
import Alertas from "./pages/Alertas";
import Relatorios from "./pages/Relatorios";
import APS from "./pages/APS";
import Farmacia from "./pages/Farmacia";
import Planejamento from "./pages/Planejamento";
import Vigilancia from "./pages/Vigilancia";
import Municipio from "./pages/Municipio";
import Usuarios from "./pages/Usuarios";
import Login from "./pages/Login";
import Transporte from "./pages/Transporte";
import Regulacao from "./pages/Regulacao";
import Emendas from "./pages/Emendas";

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });

// ── Estilo base ──────────────────────────────────────────────────────────────
const S = {
  app: { display:"flex", flexDirection:"column" as const, height:"100vh", fontFamily:"system-ui,-apple-system,sans-serif" },

  // header
  header: { height:52, background:"#1565c0", display:"flex", alignItems:"center", padding:"0 16px", gap:12, flexShrink:0, boxShadow:"0 1px 4px rgba(0,0,0,.3)", zIndex:200 },
  hIcon: { width:34, height:34, background:"rgba(255,255,255,.2)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", border:"2px solid rgba(255,255,255,.4)", flexShrink:0 },
  hLogo: { display:"flex", alignItems:"center", gap:10, textDecoration:"none", cursor:"pointer" },
  hName: { color:"#fff", fontSize:15, fontWeight:700, lineHeight:1.1 },
  hSub: { color:"rgba(255,255,255,.7)", fontSize:10 },
  hRight: { marginLeft:"auto", display:"flex", alignItems:"center", gap:8 },
  hMun: { display:"flex", alignItems:"center", gap:6, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", padding:"5px 12px", border:"1px solid rgba(255,255,255,.3)", borderRadius:4 },
  hBell: { position:"relative" as const, width:34, height:34, background:"rgba(255,255,255,.12)", border:"1px solid rgba(255,255,255,.2)", borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff" },
  hUser: { display:"flex", alignItems:"center", gap:7, cursor:"pointer", color:"#fff", padding:"4px 8px", border:"1px solid rgba(255,255,255,.2)", borderRadius:4 },
  hAv: { width:28, height:28, background:"rgba(255,255,255,.2)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:12, fontWeight:700 },

  // body
  body: { display:"flex", flex:1, overflow:"hidden" },

  // sidebar
  sidebar: { width:240, background:"#fff", borderRight:"1px solid #e0e0e0", display:"flex", flexDirection:"column" as const, overflow:"hidden" },
  sbScroll: { flex:1, overflowY:"auto" as const, padding:"8px 0" },
  sbFooter: { padding:"12px 16px", borderTop:"1px solid #e0e0e0", fontSize:11, color:"#9e9e9e", lineHeight:1.7 },

  // nav simple
  navSimple: (active:boolean) => ({
    display:"flex", alignItems:"center", gap:10, padding:"9px 16px",
    color: active ? "#1565c0" : "#424242", cursor:"pointer",
    background: active ? "#e3f2fd" : "transparent",
    fontSize:13, fontWeight: active ? 600 : 400, textDecoration:"none",
    borderLeft: active ? "3px solid #1565c0" : "3px solid transparent",
    transition:"background .15s",
  }),

  // nav group header
  navGrpHdr: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 16px", cursor:"pointer", fontSize:13, fontWeight:400, color:"#212121", borderLeft:"3px solid transparent" },
  navGrpBody: { background:"#fafafa" },
  navSub: (active:boolean) => ({
    display:"flex", alignItems:"center", gap:6, padding:"7px 16px 7px 36px",
    fontSize:13, color: active ? "#1565c0" : "#616161", cursor:"pointer",
    background: active ? "#e3f2fd" : "transparent", textDecoration:"none",
    fontWeight: active ? 600 : 400,
  }),

  // logout
  sbLogout: { display:"flex", alignItems:"center", gap:6, color:"#c62828", cursor:"pointer", fontSize:12, fontWeight:600, marginTop:8, padding:"6px 0" },

  // main
  main: { flex:1, overflow:"auto", background:"#f5f5f3" },
};

// ── AccordionGroup ───────────────────────────────────────────────────────────
function AccordionGroup({ label, children, defaultOpen = false }: { label: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <div style={S.navGrpHdr} onClick={() => setOpen(o => !o)}>
        <span>{label}</span>
        {open ? <ChevronDown size={14} color="#9e9e9e" /> : <ChevronRight size={14} color="#9e9e9e" />}
      </div>
      {open && <div style={S.navGrpBody}>{children}</div>}
    </div>
  );
}

// ── SubLink ──────────────────────────────────────────────────────────────────
function SubLink({ to, label }: { to: string; label: string }) {
  const loc = useLocation();
  const active = loc.pathname === to;
  return <NavLink to={to} style={S.navSub(active)}>{label}</NavLink>;
}

// ── SimpleLink ───────────────────────────────────────────────────────────────
function SimpleLink({ to, label, Icon, end = false }: { to: string; label: string; Icon: React.ElementType; end?: boolean }) {
  const loc = useLocation();
  const active = end ? loc.pathname === to : loc.pathname.startsWith(to);
  return (
    <NavLink to={to} end={end} style={S.navSimple(active)}>
      <Icon size={15} color={active ? "#1565c0" : "#9e9e9e"} />
      {label}
    </NavLink>
  );
}

// ── Layout ───────────────────────────────────────────────────────────────────
function Layout({ children, nomeUsuario, perfilUsuario, onLogout }: {
  children: React.ReactNode; nomeUsuario: string; perfilUsuario: string; onLogout: () => void;
}) {
  const ini = (nomeUsuario || "G").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={S.app}>
      {/* ── Header ── */}
      <header style={S.header}>
        <div style={S.hIcon}>
          <span style={{ color:"#fff", fontSize:17 }}>⚕</span>
        </div>
        <div>
          <div style={S.hName}>ERSUS 360</div>
          <div style={S.hSub}>Painel de Gestão da Saúde</div>
        </div>
        <div style={S.hRight}>
          <div style={S.hMun}>
            APUÍ / AM <ChevronDown size={12} style={{ opacity:.7 }} />
          </div>
          <div style={S.hBell}>
            <Bell size={16} />
          </div>
          <ChevronDown size={12} style={{ color:"rgba(255,255,255,.6)" }} />
          <div style={S.hUser} onClick={onLogout} title="Clique para sair">
            <div style={S.hAv}>{ini}</div>
            <span style={{ fontSize:12, fontWeight:600 }}>{(nomeUsuario || "GESTOR").toUpperCase()}</span>
            <ChevronDown size={11} style={{ opacity:.6 }} />
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={S.body}>
        {/* ── Sidebar ── */}
        <aside style={S.sidebar}>
          <div style={S.sbScroll}>

            {/* Itens simples */}
            <SimpleLink to="/"          label="Home"                Icon={Home}    end />
            <SimpleLink to="/painel"    label="Painel do Gestor"    Icon={BarChart2} />
            <SimpleLink to="/alertas"   label="Alertas"             Icon={Bell} />
            <SimpleLink to="/indicadores" label="Indicadores"       Icon={Target} />

            {/* Grupos acordeão */}
            <AccordionGroup label="FNS / Convênios">
              <SubLink to="/fns"        label="Convênios e Repasses" />
              <SubLink to="/execucao"   label="Execução Financeira" />
              <SubLink to="/portarias"  label="Portarias" />
              <SubLink to="/emendas"    label="Emendas" />
            </AccordionGroup>

            <AccordionGroup label="Obras">
              <SubLink to="/obras"      label="Acompanhamento" />
            </AccordionGroup>

            <AccordionGroup label="Programas de Saúde">
              <SubLink to="/aps"        label="Atenção Primária (APS)" />
              <SubLink to="/farmacia"   label="Assist. Farmacêutica" />
              <SubLink to="/vigilancia" label="Vigilância em Saúde" />
              <SubLink to="/regulacao"  label="Regulação" />
              <SubLink to="/transporte" label="TFD / Transporte" />
            </AccordionGroup>

            <AccordionGroup label="Gestão e Documentos">
              <SubLink to="/documentos"   label="Documentos" />
              <SubLink to="/relatorios"   label="Relatórios" />
              <SubLink to="/planejamento" label="Planejamento" />
              <SubLink to="/modulos"      label="Módulos" />
              <SubLink to="/municipio"    label="Município" />
              <SubLink to="/usuarios"     label="Usuários" />
            </AccordionGroup>

            <SimpleLink to="/ia" label="IA Gestora" Icon={Bot} />

          </div>

          {/* Footer sidebar */}
          <div style={S.sbFooter}>
            <div>ERSUS 360 by <span style={{ color:"#1565c0" }}>FMS Apuí/AM</span></div>
            <div>v1.0.0 | <span style={{ color:"#1565c0", cursor:"pointer" }}>Termos de uso</span></div>
            <div style={S.sbLogout} onClick={onLogout}>
              <LogOut size={13} /> Sair do sistema
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main style={S.main}>{children}</main>
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
    return (
      <QueryClientProvider client={qc}>
        <Login onLogin={handleLogin} />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Layout nomeUsuario={nomeUsuario} perfilUsuario={perfilUsuario} onLogout={handleLogout}>
          <Routes>
            <Route path="/"             element={<PainelGestor />} />
            <Route path="/painel"       element={<PainelGestor />} />
            <Route path="/indicadores"  element={<Indicadores />} />
            <Route path="/modulos"      element={<Modulos />} />
            <Route path="/fns"          element={<FnsConvenios />} />
            <Route path="/ia"           element={<IAGestora />} />
            <Route path="/portarias"    element={<Portarias />} />
            <Route path="/obras"        element={<Obras />} />
            <Route path="/execucao"     element={<Execucao />} />
            <Route path="/documentos"   element={<Documentos />} />
            <Route path="/alertas"      element={<Alertas />} />
            <Route path="/relatorios"   element={<Relatorios />} />
            <Route path="/aps"          element={<APS />} />
            <Route path="/farmacia"     element={<Farmacia />} />
            <Route path="/planejamento" element={<Planejamento />} />
            <Route path="/vigilancia"   element={<Vigilancia />} />
            <Route path="/transporte"   element={<Transporte />} />
            <Route path="/regulacao"    element={<Regulacao />} />
            <Route path="/usuarios"     element={<Usuarios />} />
            <Route path="/municipio"    element={<Municipio />} />
            <Route path="/emendas"      element={<Emendas />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
