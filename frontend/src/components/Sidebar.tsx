/**
 * Sidebar ERSUS 360 — menu lateral refatorado
 * Busca (Ctrl+K) + favoritos + grupos temáticos recolhíveis (abre só o grupo da tela atual)
 * Itens filtrados por perfil e pelas telas liberadas ao município da sessão.
 */
import React, {
  useState, useMemo, useCallback, useRef, useEffect,
  createContext, useContext,
} from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../App";
import {
  Home, Monitor, Star, Map as MapIcon, BarChart2, Award, Bot, Target, TrendingUp,
  Stethoscope, PieChart, Users, Activity, Ship, Search, BarChart3,
  MapPin, ClipboardCheck, Clock, BookOpen, DollarSign, Clipboard,
  FileText, Landmark, Building2, Globe, Shield, ArrowLeftRight,
  ClipboardList, Calendar, MessageSquare, Syringe, Bug, Droplets,
  ShoppingBag, Pill, Network, Radio, Truck,
  ShieldCheck, Baby, HeartPulse, UserCheck, Smile, Wrench, Package,
  Calculator, Brain, School, Sparkles, AlertTriangle, Download,
  UserCog, Layers, Plug, Bell, Thermometer, Trash2, FlaskConical,
  Heart, ShieldAlert, ChevronDown, ChevronRight, X, Menu,
} from "lucide-react";
import {
  NAV_ITEMS, CATEGORIES, normalizeText, itemAllowed, scoreItem,
  type NavItem, type Category,
} from "../lib/navItems";
import { paginaDisponivel } from "../lib/municipio";

// ── Ícones ────────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  Home, Monitor, Star, Map: MapIcon, BarChart2, Award, Bot, Target, TrendingUp,
  Stethoscope, PieChart, Users, Activity, Ship, Search, BarChart3,
  MapPin, ClipboardCheck, Clock, BookOpen, DollarSign, Clipboard,
  FileText, Landmark, Building2, Globe, Shield, ArrowLeftRight,
  ClipboardList, Calendar, MessageSquare, Syringe, Bug, Droplets,
  ShoppingBag, Pill, Network, Radio, Truck, ShieldCheck, Baby,
  HeartPulse, UserCheck, Smile, Wrench, Package, Calculator, Brain,
  School, Sparkles, AlertTriangle, Download, UserCog, Layers, Plug,
  Bell, Thermometer, Trash2, FlaskConical, Heart, ShieldAlert,
};

export function getIcon(name: string): React.ElementType {
  return ICON_MAP[name] ?? Activity;
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:      "#0f1b2d",
  hover:   "#1a2d47",
  act:     "#1e40af",
  text:    "#cbd5e1",
  muted:   "#64748b",
  accent:  "#38bdf8",
  border:  "#1e3a5f",
  pill:    "#172035",
  pillAct: "#1e40af",
  fav:     "#f59e0b",
  new_:    "#10b981",
  hi:      "#7c3aed",
} as const;

// ── localStorage helpers ──────────────────────────────────────────────────────
const LS = {
  get<T>(key: string, fallback: T): T {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(key: string, val: unknown) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  },
};

// ── Sidebar context (exposed for CommandPalette) ──────────────────────────────
interface SidebarCtx { openPalette(): void }
export const SidebarContext = createContext<SidebarCtx>({ openPalette: () => {} });

// ── Props ─────────────────────────────────────────────────────────────────────
interface SidebarProps {
  perfil: string;
  nomeUsuario?: string;
  onLogout(): void;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_FAV_SHOW = 6;

// Ícone e rótulo curto de cada grupo (o nome completo segue no breadcrumb e no title)
const CAT_META: Record<string, { label: string; icon: React.ElementType }> = {
  "Financiamento":                     { label: "Financiamento",             icon: DollarSign },
  "Gestão e Qualidade":                { label: "Gestão e Qualidade",        icon: ClipboardCheck },
  "Atenção Primária e ACS":            { label: "Atenção Primária e ACS",    icon: Users },
  "Vigilância em Saúde":               { label: "Vigilância em Saúde",       icon: Activity },
  "Atenção Especializada e Regulação": { label: "Atenção Especializada",     icon: Stethoscope },
  "Sistemas e Integrações":            { label: "Sistemas e Integrações",    icon: Plug },
};

// ── Main component ────────────────────────────────────────────────────────────
export function Sidebar({ perfil }: SidebarProps) {
  const location = useLocation();
  const auth = useAuth();

  // Search
  const [query, setQuery]       = useState("");
  const searchRef               = useRef<HTMLInputElement>(null);

  // Grupo aberto (acordeão) — começa pelo grupo da tela atual
  const [openCat, setOpenCat] = useState<string | null>(null);

  // Favorites
  const [favs, setFavs]         = useState<string[]>(
    () => LS.get("sb_favs", [])
  );

  // Mobile drawer
  const [mobileOpen, setMobileOpen] = useState(false);

  // Command palette
  const [paletteOpen, setPaletteOpen] = useState(false);

  // ── Itens permitidos: perfil + telas liberadas para o município da sessão ──
  // (mesma regra do GuardaPaginaMunicipio — módulos só-Apuí não aparecem para outros municípios)
  const ibgeSessao = auth.municipio_ibge ?? "";
  const allowed = useMemo(
    () => NAV_ITEMS
      .filter(item => itemAllowed(item, perfil) && paginaDisponivel(item.route, ibgeSessao))
      .sort((a, b) => a.order - b.order),
    [perfil, ibgeSessao]
  );

  // ── Search ─────────────────────────────────────────────────────────────────
  const normQ  = useMemo(() => normalizeText(query), [query]);
  const filtered = useMemo(() => {
    if (!normQ) return allowed;
    return allowed
      .map(i => ({ item: i, score: scoreItem(i, normQ) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.item);
  }, [allowed, normQ]);

  // ── Group by category (only when not searching) ───────────────────────────
  const grouped = useMemo(() => {
    if (normQ) return null;
    const map = new Map<Category, NavItem[]>();
    for (const cat of CATEGORIES) {
      // Telas-filhas ficam como subabas do painel principal, não na lista do menu
      const items = filtered.filter(i => i.category === cat && !i.parent);
      if (items.length) map.set(cat as Category, items);
    }
    return map;
  }, [filtered, normQ]);

  // ── Favourite items ────────────────────────────────────────────────────────
  // Favorito de uma subaba aponta para o painel principal (sem repetir o painel)
  const favItems = useMemo(() => {
    const out: NavItem[] = [];
    for (const id of favs) {
      const it = allowed.find(i => i.id === id);
      if (!it) continue;
      const alvo = (it.parent && allowed.find(i => i.id === it.parent)) || it;
      if (!out.some(o => o.id === alvo.id)) out.push(alvo);
    }
    return out;
  }, [favs, allowed]);

  // ── Active item detection ──────────────────────────────────────────────────
  const activeItem = useMemo(() => {
    const path = location.pathname;
    // Exact match first, then prefix match (longer wins)
    const hit = [...allowed]
      .filter(i => path === i.route || path.startsWith(i.route + "/"))
      .sort((a, b) => b.route.length - a.route.length)[0];
    // Numa subaba, destaca o painel principal no menu
    return (hit?.parent && allowed.find(i => i.id === hit.parent)) || hit;
  }, [location.pathname, allowed]);
  const activeId = activeItem?.id;

  // ── Acordeão: ao navegar, abre só o grupo da tela atual ────────────────────
  useEffect(() => {
    const cat = activeItem?.category;
    if (cat) setOpenCat(cat);
  }, [activeItem?.category]);

  // ── Toggle fav ────────────────────────────────────────────────────────────
  // Remover um painel dos favoritos também remove suas subabas favoritadas
  const toggleFav = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setFavs(prev => {
      const filhas = NAV_ITEMS.filter(i => i.parent === id).map(i => i.id);
      const marcado = prev.includes(id) || filhas.some(f => prev.includes(f));
      const next = marcado
        ? prev.filter(x => x !== id && !filhas.includes(x))
        : [...prev, id];
      LS.set("sb_favs", next);
      return next;
    });
  }, []);

  // ── Toggle category (um grupo aberto por vez) ─────────────────────────────
  const toggleCat = useCallback((cat: string) => {
    setOpenCat(prev => (prev === cat ? null : cat));
  }, []);

  // ── Keyboard: Ctrl+K opens palette ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen(p => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Close search on route change ──────────────────────────────────────────
  useEffect(() => { setQuery(""); setMobileOpen(false); }, [location.pathname]);

  // ── Render a single nav item ──────────────────────────────────────────────
  const renderItem = useCallback((item: NavItem, _legado = false, forceActive?: boolean, showFav = true) => {
    const isAct = forceActive ?? item.id === activeId;
    const isFav = favs.includes(item.id) || favs.some(f => NAV_ITEMS.find(i => i.id === f)?.parent === item.id);
    const Icon  = getIcon(item.iconName);

    return (
      <Link
        key={item.id}
        to={item.route}
        title={item.description}
        style={{
          display:        "flex",
          alignItems:     "center",
          gap:            8,
          padding:        "6px 12px 6px 10px",
          borderRadius:   6,
          textDecoration: "none",
          color:          isAct ? "#fff" : T.text,
          background:     isAct ? T.act : "transparent",
          fontSize:       13,
          fontWeight:     isAct ? 600 : 400,
          transition:     "background 0.15s",
          position:       "relative",
          borderLeft:     isAct ? "3px solid #60a5fa" : "3px solid transparent",
        }}
        onMouseEnter={e => {
          if (!isAct) (e.currentTarget as HTMLAnchorElement).style.background = T.hover;
        }}
        onMouseLeave={e => {
          if (!isAct) (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
        }}
        aria-current={isAct ? "page" : undefined}
      >
        <Icon size={15} style={{ flexShrink: 0, opacity: isAct ? 1 : 0.75 }} />
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.shortTitle ?? item.title}
        </span>
        {item.isNew && (
          <span style={{ fontSize: 9, fontWeight: 700, color: T.new_, background: "#064e3b", borderRadius: 4, padding: "1px 4px" }}>
            NOVO
          </span>
        )}
        {showFav && <button
          onClick={e => toggleFav(item.id, e)}
          title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: 2, color: isFav ? T.fav : T.muted, opacity: 0,
            transition: "opacity 0.1s",
            display: "flex", alignItems: "center",
          }}
          className="sb-fav-btn"
          aria-label={isFav ? "Remover favorito" : "Adicionar favorito"}
        >
          <Star size={11} fill={isFav ? T.fav : "none"} />
        </button>}
      </Link>
    );
  }, [activeId, favs, toggleFav]);

  // ── Sidebar content ───────────────────────────────────────────────────────
  const sidebarContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Busca (logo e município já estão no cabeçalho — não repetir aqui) */}
      <div style={{ padding: "12px 10px 8px", flexShrink: 0 }}>
        <div style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: T.muted, pointerEvents: "none" }} />
          <input
            ref={searchRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Escape") setQuery(""); }}
            placeholder="Buscar módulo…"
            aria-label="Buscar módulo"
            className="sb-search"
            style={{
              width: "100%", boxSizing: "border-box",
              background: "#172035", border: `1px solid ${T.border}`,
              borderRadius: 8, padding: "7px 52px 7px 28px",
              color: T.text, fontSize: 12.5, outline: "none",
            }}
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.muted, display: "flex", alignItems: "center" }}
              aria-label="Limpar busca"
            >
              <X size={12} />
            </button>
          ) : (
            <button
              onClick={() => setPaletteOpen(true)}
              title="Busca global (Ctrl+K)"
              aria-label="Abrir busca global (Ctrl+K)"
              style={{
                position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                background: "#0f1b2d", border: `1px solid ${T.border}`, borderRadius: 4,
                color: T.muted, fontSize: 10, padding: "1px 5px", cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Ctrl K
            </button>
          )}
        </div>
      </div>

      {/* Scrollable area */}
      <nav aria-label="Módulos" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "0 8px 16px" }}>

        {/* Início — sempre visível */}
        {!normQ && (
          <div style={{ marginBottom: 6 }}>
            {renderItem({
              id: "__inicio", title: "Início", description: "Painel inicial do município",
              route: "/", category: "", iconName: "Home", keywords: [], order: 0,
            }, false, location.pathname === "/", false)}
          </div>
        )}

        {/* Search results */}
        {normQ && (
          <div>
            <div style={{ fontSize: 10, color: T.muted, padding: "6px 6px 2px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </div>
            {filtered.length === 0 ? (
              <div style={{ padding: "20px 8px", textAlign: "center", color: T.muted, fontSize: 12 }}>
                Nenhum módulo encontrado
              </div>
            ) : (
              filtered.map(item => renderItem(item))
            )}
          </div>
        )}

        {/* Normal nav — favorites */}
        {!normQ && favItems.length > 0 && (
          <Section label="Favoritos" icon={Star}>
            {favItems.slice(0, MAX_FAV_SHOW).map(item => renderItem(item))}
          </Section>
        )}

        {!normQ && <div style={{ fontSize: 10.5, color: T.muted, padding: "8px 8px 4px", fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>Módulos</div>}

        {/* Categories */}
        {!normQ && grouped && Array.from(grouped.entries()).map(([cat, items]) => {
          const isCollapsed = openCat !== cat;
          const meta = CAT_META[cat] ?? { label: cat, icon: Layers };
          const CatIcon = meta.icon;
          const temAtivo = activeItem?.category === cat;
          // Group by subcategory
          const subcats = new Map<string, NavItem[]>();
          const noSub: NavItem[] = [];
          for (const item of items) {
            if (item.subcategory) {
              const arr = subcats.get(item.subcategory) ?? [];
              arr.push(item);
              subcats.set(item.subcategory, arr);
            } else {
              noSub.push(item);
            }
          }

          return (
            <div key={cat} style={{ marginBottom: 2 }}>
              <button
                onClick={() => toggleCat(cat)}
                title={cat}
                className="sb-cat"
                style={{
                  width: "100%", border: "none", cursor: "pointer",
                  background: !isCollapsed ? "#14243b" : "none",
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "8px 8px 8px 10px", borderRadius: 7,
                  color: temAtivo || !isCollapsed ? "#f1f5f9" : T.text,
                  fontSize: 13, fontWeight: 600, textAlign: "left",
                  fontFamily: "inherit",
                }}
                aria-expanded={!isCollapsed}
              >
                <CatIcon size={15} style={{ flexShrink: 0, color: temAtivo ? T.accent : T.muted }} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta.label}</span>
                <span style={{ fontSize: 10, color: T.muted, minWidth: 14, textAlign: "right" }}>{items.length}</span>
                {isCollapsed ? <ChevronRight size={13} color={T.muted} /> : <ChevronDown size={13} color={T.muted} />}
              </button>

              {!isCollapsed && (
                <div style={{ margin: "2px 0 6px 17px", paddingLeft: 6, borderLeft: `1px solid ${T.border}` }}>
                  {/* Items without subcategory */}
                  {noSub.map(item => renderItem(item))}

                  {/* Subcategory groups */}
                  {Array.from(subcats.entries()).map(([sub, subItems]) => (
                    <Subcategory key={sub} label={sub} count={subItems.length} forceOpen={subItems.some(i => i.id === activeId)}>
                      {subItems.map(item => renderItem(item))}
                    </Subcategory>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Rodapé removido: usuário, troca de município e "Sair" (com confirmação)
          ficam no menu do cabeçalho; o antigo botão "Config" apontava para rota inexistente. */}
    </div>
  );

  return (
    <SidebarContext.Provider value={{ openPalette: () => setPaletteOpen(true) }}>
      {/* ── Desktop ── */}
      <aside
        style={{
          // ocupa só a altura abaixo do cabeçalho (antes 100vh cortava o fim do menu)
          width: 248, flexShrink: 0, alignSelf: "stretch", minHeight: 0,
          background: T.bg, display: "flex", flexDirection: "column",
          borderRight: `1px solid ${T.border}`, overflowY: "hidden",
        }}
        aria-label="Menu de navegação"
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile toggle ── */}
      <button
        onClick={() => setMobileOpen(p => !p)}
        style={{
          display: "none", // shown via CSS below
          position: "fixed", bottom: 18, right: 18, zIndex: 1200,
          background: T.act, border: "none", borderRadius: "50%",
          width: 48, height: 48, cursor: "pointer",
          alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        }}
        className="sb-mobile-toggle"
        aria-label="Abrir menu"
      >
        <Menu size={22} color="#fff" />
      </button>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex" }}>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.5)" }} onClick={() => setMobileOpen(false)} />
          <aside style={{ width: 260, background: T.bg, height: "100vh", display: "flex", flexDirection: "column", borderLeft: `1px solid ${T.border}` }}>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* ── Command Palette ── */}
      {paletteOpen && (
        <CommandPalette
          allowed={allowed}
          onClose={() => setPaletteOpen(false)}
          activeId={activeId}
          favs={favs}
          toggleFav={toggleFav}
        />
      )}

      {/* Global styles */}
      <style>{`
        .sb-fav-btn { opacity: 0 !important; }
        a:hover .sb-fav-btn, a:focus-within .sb-fav-btn { opacity: 1 !important; }
        .sb-cat:hover { background: #1a2d47 !important; }
        .sb-cat:focus-visible, aside a:focus-visible, aside button:focus-visible { outline: 2px solid #38bdf8; outline-offset: -2px; }
        .sb-search:focus { border-color: #38bdf8 !important; }
        @media (max-width: 768px) {
          aside[aria-label="Menu de navegação"] { display: none !important; }
          .sb-mobile-toggle { display: flex !important; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 4px; }
      `}</style>
    </SidebarContext.Provider>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────
function Section({ label, icon: Icon, children }: { label: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: T.muted, padding: "6px 8px 4px", fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>
        {Icon && <Icon size={11} color={T.fav} fill={T.fav} />}
        {label}
      </div>
      {children}
    </div>
  );
}

function Subcategory({ label, count, forceOpen, children }: { label: string; count?: number; forceOpen?: boolean; children: React.ReactNode }) {
  // Subgrupos começam recolhidos, exceto o que contém a tela atual
  const [open, setOpen] = useState(!!forceOpen);
  useEffect(() => { if (forceOpen) setOpen(true); }, [forceOpen]);
  return (
    <div style={{ marginTop: 2 }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: "100%", background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 5,
          padding: "5px 8px", borderRadius: 5,
          color: "#94a3b8", fontSize: 11.5, fontWeight: 600,
          textAlign: "left", fontFamily: "inherit",
        }}
        aria-expanded={open}
        className="sb-cat"
      >
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        {count != null && <span style={{ fontSize: 10, color: T.muted }}>{count}</span>}
      </button>
      {open && <div style={{ paddingLeft: 8 }}>{children}</div>}
    </div>
  );
}

// ── Command Palette ───────────────────────────────────────────────────────────
interface PaletteProps {
  allowed: NavItem[];
  onClose(): void;
  activeId?: string;
  favs: string[];
  toggleFav(id: string, e: React.MouseEvent): void;
}

function CommandPalette({ allowed, onClose, activeId, favs, toggleFav }: PaletteProps) {
  const [q, setQ]       = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef        = useRef<HTMLInputElement>(null);
  const listRef         = useRef<HTMLDivElement>(null);
  const { pathname }    = useLocation();

  const normQ = useMemo(() => normalizeText(q), [q]);
  const results = useMemo(() => {
    // Sem texto: favoritos primeiro, depois os painéis principais (sem as subabas)
    if (!normQ) {
      const fav = favs.map(id => allowed.find(i => i.id === id)).filter(Boolean) as NavItem[];
      const resto = allowed.filter(i => !i.parent && !favs.includes(i.id));
      return [...fav, ...resto].slice(0, 12);
    }
    return allowed
      .map(i => ({ item: i, score: scoreItem(i, normQ) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(x => x.item);
  }, [allowed, normQ, favs]);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setCursor(0); }, [results]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") { e.preventDefault(); setCursor(p => Math.min(p + 1, results.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(p => Math.max(p - 1, 0)); }
      if (e.key === "Enter" && results[cursor]) {
        window.location.hash = ""; // force navigation
        window.history.pushState({}, "", results[cursor].route);
        window.dispatchEvent(new PopStateEvent("popstate"));
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [results, cursor, onClose]);

  // scroll cursor into view
  useEffect(() => {
    const el = listRef.current?.children[cursor] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 80, background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        style={{ width: 560, maxWidth: "90vw", background: "#0f1b2d", borderRadius: 12, border: `1px solid ${T.border}`, boxShadow: "0 24px 64px rgba(0,0,0,0.6)", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="Busca global"
        aria-modal="true"
      >
        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: `1px solid ${T.border}` }}>
          <Search size={16} style={{ color: T.muted, flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar módulo, indicador, relatório…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: T.text, fontSize: 15 }}
            aria-label="Busca global"
            autoComplete="off"
          />
          <kbd style={{ fontSize: 10, color: T.muted, background: "#172035", border: `1px solid ${T.border}`, borderRadius: 4, padding: "2px 5px" }}>Esc</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: 420, overflowY: "auto", padding: "6px 8px" }}>
          {results.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center", color: T.muted, fontSize: 13 }}>
              Nenhum módulo encontrado para "{q}"
            </div>
          ) : (
            results.map((item, idx) => {
              const isAct  = item.id === activeId;
              const isFav  = favs.includes(item.id);
              const Icon   = getIcon(item.iconName);
              const isCur  = idx === cursor;
              return (
                <a
                  key={item.id}
                  href={item.route}
                  onClick={e => { e.preventDefault(); window.history.pushState({}, "", item.route); window.dispatchEvent(new PopStateEvent("popstate")); onClose(); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px", borderRadius: 8, textDecoration: "none",
                    background: isCur ? T.hover : "transparent",
                    color: isAct ? T.accent : T.text,
                    marginBottom: 2, transition: "background 0.1s",
                  }}
                  onMouseEnter={() => setCursor(idx)}
                >
                  <Icon size={16} style={{ flexShrink: 0, opacity: 0.8 }} />
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.title}
                      {item.isNew && <span style={{ marginLeft: 6, fontSize: 9, color: T.new_, background: "#064e3b", borderRadius: 4, padding: "1px 4px", fontWeight: 700 }}>NOVO</span>}
                    </div>
                    <div style={{ fontSize: 11, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.parent
                        ? `Subaba do ${(() => { const p = allowed.find(i => i.id === item.parent); return p ? (p.shortTitle ?? p.title) : item.category; })()}`
                        : `${item.category}${item.subcategory ? ` › ${item.subcategory}` : ""}`}
                    </div>
                  </div>
                  <button
                    onClick={e => toggleFav(item.id, e)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: isFav ? T.fav : T.muted, display: "flex", alignItems: "center" }}
                    aria-label={isFav ? "Remover favorito" : "Adicionar favorito"}
                  >
                    <Star size={12} fill={isFav ? T.fav : "none"} />
                  </button>
                </a>
              );
            })
          )}
        </div>

        <div style={{ padding: "8px 16px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 16, fontSize: 10, color: T.muted }}>
          <span><kbd style={{ background: "#172035", border: `1px solid ${T.border}`, borderRadius: 3, padding: "1px 4px" }}>↑↓</kbd> navegar</span>
          <span><kbd style={{ background: "#172035", border: `1px solid ${T.border}`, borderRadius: 3, padding: "1px 4px" }}>Enter</kbd> abrir</span>
          <span><kbd style={{ background: "#172035", border: `1px solid ${T.border}`, borderRadius: 3, padding: "1px 4px" }}>Esc</kbd> fechar</span>
          <span style={{ marginLeft: "auto" }}>{results.length} módulo{results.length !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  );
}

export function useSidebar() { return useContext(SidebarContext); }
