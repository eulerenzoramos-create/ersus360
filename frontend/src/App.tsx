// src/App.tsx — ERSUS 360 · Menu e Rotas Completos
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import {
  LayoutDashboard, Target, Grid2X2, ArrowLeftRight, Bot,
  FileText, Building2, DollarSign, FolderOpen, BarChart3,
  Bell, ClipboardList, Activity, Pill, ShieldCheck, MapPin, Users,
  Truck, Network, Landmark,
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

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

const NAV_GRUPOS = [
  {
    grupo: "Principal",
    itens: [
      { to: "/", label: "Painel", Icon: LayoutDashboard },
      { to: "/ia", label: "IA Gestora", Icon: Bot },
      { to: "/alertas", label: "Alertas", Icon: Bell },
    ],
  },
  {
    grupo: "Financeiro",
    itens: [
      { to: "/fns", label: "FNS / Convênios", Icon: ArrowLeftRight },
      { to: "/execucao", label: "Execução", Icon: DollarSign },
      { to: "/relatorios", label: "Relatórios", Icon: BarChart3 },
    ],
  },
  {
    grupo: "Gestão",
    itens: [
      { to: "/portarias", label: "Portarias", Icon: FileText },
      { to: "/obras", label: "Obras", Icon: Building2 },
      { to: "/documentos", label: "Documentos", Icon: FolderOpen },
    ],
  },
  {
    grupo: "Programas",
    itens: [
      { to: "/indicadores", label: "Indicadores", Icon: Target },
      { to: "/modulos", label: "Módulos", Icon: Grid2X2 },
    ],
  },
];

// Lista plana para a navbar horizontal (versão compacta)
const NAV_FLAT = [
  { to: "/", label: "Painel", Icon: LayoutDashboard },
  { to: "/fns", label: "FNS", Icon: ArrowLeftRight },
  { to: "/execucao", label: "Execução", Icon: DollarSign },
  { to: "/portarias", label: "Portarias", Icon: FileText },
  { to: "/obras", label: "Obras", Icon: Building2 },
  { to: "/documentos", label: "Docs", Icon: FolderOpen },
  { to: "/indicadores", label: "Indicadores", Icon: Target },
  { to: "/modulos", label: "Módulos", Icon: Grid2X2 },
  { to: "/relatorios", label: "Relatórios", Icon: BarChart3 },
  { to: "/alertas", label: "Alertas", Icon: Bell },
  { to: "/planejamento", label: "Planejamento", Icon: ClipboardList },
  { to: "/aps", label: "APS", Icon: Activity },
  { to: "/farmacia", label: "Farmácia", Icon: Pill },
  { to: "/vigilancia", label: "Vigilância", Icon: ShieldCheck },
  { to: "/transporte", label: "Transporte", Icon: Truck },
  { to: "/regulacao", label: "Regulação", Icon: Network },
  { to: "/municipio", label: "Município", Icon: MapPin },
  { to: "/usuarios", label: "Usuários", Icon: Users },
  { to: "/emendas", label: "Emendas", Icon: Landmark },
  { to: "/ia", label: "IA", Icon: Bot },
];

function Layout({ children, nomeUsuario, perfilUsuario, onLogout }: {
  children: React.ReactNode;
  nomeUsuario: string;
  perfilUsuario: string;
  onLogout: () => void;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-tertiary,#f5f5f3)", fontFamily: "var(--font-sans,system-ui,sans-serif)" }}>
      {/* Header */}
      <header style={{
        background: "var(--color-background-primary,#fff)",
        borderBottom: "0.5px solid var(--color-border-tertiary,#e5e5e3)",
        padding: "10px 20px", display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 17 }}>⚕</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>ERSUS 360</div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary,#737373)" }}>Gestão Inteligente do SUS</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary,#737373)", textAlign: "right" }}>
            <strong style={{ display: "block", fontSize: 13 }}>{nomeUsuario || "FMS Apuí / AM"}</strong>
            <span style={{ fontSize: 10, background: "#f0fdf4", color: "#1D9E75", borderRadius: 3, padding: "1px 5px" }}>
              {perfilUsuario}
            </span>
          </div>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            title="Sair do sistema"
            onClick={onLogout}
          >
            {(nomeUsuario || "G").charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Navbar */}
      <nav style={{
        background: "var(--color-background-secondary,#f9f9f7)",
        borderBottom: "0.5px solid var(--color-border-tertiary,#e5e5e3)",
        padding: "0 20px", display: "flex", gap: 2, overflowX: "auto", scrollbarWidth: "none",
      }}>
        {NAV_FLAT.map(({ to, label, Icon }) => (
          <NavLink
            key={to} to={to} end={to === "/"}
            style={({ isActive }) => ({
              padding: "9px 11px", fontSize: 12,
              fontWeight: isActive ? 500 : 400,
              color: isActive ? "#1D9E75" : "var(--color-text-secondary,#737373)",
              borderBottom: `2px solid ${isActive ? "#1D9E75" : "transparent"}`,
              textDecoration: "none", display: "flex", alignItems: "center",
              gap: 4, whiteSpace: "nowrap", transition: "color .15s",
            })}
          >
            <Icon size={13} />{label}
          </NavLink>
        ))}
        <button
          onClick={onLogout}
          style={{
            marginLeft: "auto", padding: "6px 14px", fontSize: 12, fontWeight: 600,
            color: "#dc2626", background: "#fff0f0", border: "1px solid #fecaca",
            borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center",
            gap: 5, whiteSpace: "nowrap", alignSelf: "center", flexShrink: 0,
          }}
        >
          ⏻ Sair
        </button>
      </nav>

      <main style={{ maxWidth: 980, margin: "0 auto" }}>{children}</main>
    </div>
  );
}

function Sub({ title, rota }: { title: string; rota: string }) {
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 12, color: "#737373", marginBottom: 12 }}>
        Endpoint: <code>/api{rota}</code>
      </div>
      <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#1D9E75" }}>
        Ver documentação interativa →
      </a>
    </div>
  );
}

export default function App() {
  const [autenticado, setAutenticado] = useState(!!localStorage.getItem("ersus_token"));
  const [nomeUsuario, setNomeUsuario] = useState(localStorage.getItem("ersus_nome") ?? "");
  const [perfilUsuario, setPerfilUsuario] = useState(localStorage.getItem("ersus_perfil") ?? "");

  const handleLogin = (_token: string, perfil: string, nome: string) => {
    setNomeUsuario(nome);
    setPerfilUsuario(perfil);
    setAutenticado(true);
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
            <Route path="/" element={<PainelGestor />} />
            <Route path="/indicadores" element={<Indicadores />} />
            <Route path="/modulos" element={<Modulos />} />
            <Route path="/fns" element={<FnsConvenios />} />
            <Route path="/ia" element={<IAGestora />} />
            <Route path="/portarias" element={<Portarias />} />
            <Route path="/obras" element={<Obras />} />
            <Route path="/execucao" element={<Execucao />} />
            <Route path="/documentos" element={<Documentos />} />
            <Route path="/alertas" element={<Alertas />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/aps" element={<APS />} />
            <Route path="/farmacia" element={<Farmacia />} />
            <Route path="/planejamento" element={<Planejamento />} />
            <Route path="/vigilancia" element={<Vigilancia />} />
            <Route path="/transporte" element={<Transporte />} />
            <Route path="/regulacao" element={<Regulacao />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/municipio" element={<Municipio />} />
            <Route path="/emendas" element={<Emendas />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
