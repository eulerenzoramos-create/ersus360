/**
 * Sidebar ERSUS 360 — menu lateral refatorado
 * Busca + filtros de área + favoritos + recentes + teclado
 */
import React, {
  useState, useMemo, useCallback, useRef, useEffect,
  createContext, useContext,
} from "react";
import { Link, useLocation } from "react-router-dom";
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
  Heart, ShieldAlert, ChevronDown, ChevronRight, X, Settings,
  LogOut, User, Menu, Keyboard,
} from "lucide-react";
import {
  NAV_ITEMS, CATEGORIES, normalizeText, itemAllowed, scoreItem,
  type NavItem, type Category,
} from "../lib/navItems";

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

function getIcon(name: string): React.ElementType {
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
const MAX_RECENTS  = 8;
const MAX_FAV_SHOW = 6;
const AREA_ALL     = "Todos";

// ── Main component ────────────────────────────────────────────────────────────
export function Sidebar({ perfil, nomeUsuario, onLogout }: SidebarProps) {
  const location = useLocation();

  // Search
  const [query, setQuery]       = useState("");
  const searchRef               = useRef<HTMLInputElement>(null);

  // Area filter
  const [area, setArea]         = useState<string>(AREA_ALL);

  // Collapsed categories
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(
    () => LS.get("sb_collapsed", {})
  );

  // Favorites
  const [favs, setFavs]         = useState<string[]>(
    () => LS.get("sb_favs", [])
  );

  // Recents
  const [recents, setRecents]   = useState<string[]>(
    () => LS.get("sb_recents", [])
  );

  // Mobile drawer
  const [mobileOpen, setMobileOpen] = useState(false);

  // Command palette
  const [paletteOpen, setPaletteOpen] = useState(false);

  // ── Allowed items for this user's perfil ───────────────────────────────────
  const allowed = useMemo(
    () => NAV_ITEMS.filter(item => itemAllowed(item, perfil)),
    [perfil]
  );

  // ── Search + area filter ───────────────────────────────────────────────────
  const normQ  = useMemo(() => normalizeText(query), [query]);
  const filtered = useMemo(() => {
    let items = allowed;
    if (area !== AREA_ALL) items = items.filter(i => i.category === area);
    if (!normQ) return items;
    return items
      .map(i => ({ item: i, score: scoreItem(i, normQ) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.item);
  }, [allowed, area, normQ]);

  // ── Group by category (only when not searching) ───────────────────────────
  const grouped = useMemo(() => {
    if (normQ) return null;
    const map = new Map<Category, NavItem[]>();
    for (const cat of CATEGORIES) {
      const items = filtered.filter(i => i.category === cat);
      if (items.length) map.set(cat as Category, items);
    }
    return map;
  }, [filtered, normQ]);

  // ── Favourite items ────────────────────────────────────────────────────────
  const favItems = useMemo(
    () => favs.map(id => allowed.find(i => i.id === id)).filter(Boolean) as NavItem[],
    [favs, allowed]
  );

  // ── Recent items ───────────────────────────────────────────────────────────
  const recentItems = useMemo(
    () => recents.map(id => allowed.find(i => i.id === id)).filter(Boolean) as NavItem[],
    [recents, allowed]
  );

  // ── Active item detection ──────────────────────────────────────────────────
  const activeId = useMemo(() => {
    const path = location.pathname;
    // Exact match first, then prefix match (longer wins)
    return allowed
      .filter(i => path === i.route || path.startsWith(i.route + "/"))
      .sort((a, b) => b.route.length - a.route.length)[0]?.id;
  }, [location.pathname, allowed]);

  // ── Record navigation ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeId) return;
    setRecents(prev => {
      const next = [activeId, ...prev.filter(x => x !== activeId)].slice(0, MAX_RECENTS);
      LS.set("sb_recents", next);
      return next;
    });
  }, [activeId]);

  // ── Toggle fav ────────────────────────────────────────────────────────────
  const toggleFav = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setFavs(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      LS.set("sb_favs", next);
      return next;
    });
  }, []);

  // ── Toggle category ───────────────────────────────────────────────────────
  const toggleCat = useCallback((cat: string) => {
    setCollapsed(prev => {
      const next = { ...prev, [cat]: !prev[cat] };
      LS.set("sb_collapsed", next);
      return next;
    });
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

  // ── Area chips ────────────────────────────────────────────────────────────
  const areas = useMemo(() => [
    AREA_ALL,
    ...CATEGORIES.filter(c => allowed.some(i => i.category === c)),
  ], [allowed]);

  // ── Render a single nav item ──────────────────────────────────────────────
  const renderItem = useCallback((item: NavItem, highlight = false) => {
    const isAct = item.id === activeId;
    const isFav = favs.includes(item.id);
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
          borderLeft:     highlight && !isAct ? `3px solid ${T.hi}` : isAct ? "3px solid #60a5fa" : "3px solid transparent",
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
        <button
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
        </button>
      </Link>
    );
  }, [activeId, favs, toggleFav]);

  // ── Sidebar content ───────────────────────────────────────────────────────
  const sidebarContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Logo */}
      <div style={{ padding: "16px 14px 8px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>ERSUS <span style={{ color: T.accent }}>360°</span></div>
            <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>Apuí · AM · IBGE 1300144</div>
          </div>
          <button
            onClick={() => setPaletteOpen(true)}
            title="Busca global (Ctrl+K)"
            style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, padding: 4, borderRadius: 6, display: "flex", alignItems: "center" }}
            aria-label="Abrir busca global"
          >
            <Keyboard size={14} />
          </button>
        </div>

        {/* Pesquisa inline */}
        <div style={{ marginTop: 10, position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: T.muted, pointerEvents: "none" }} />
          <input
            ref={searchRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar módulo… (Ctrl+K)"
            aria-label="Buscar módulo"
            style={{
              width: "100%", boxSizing: "border-box",
              background: "#172035", border: `1px solid ${T.border}`,
              borderRadius: 8, padding: "6px 30px 6px 28px",
              color: T.text, fontSize: 12, outline: "none",
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.muted, display: "flex", alignItems: "center" }}
              aria-label="Limpar busca"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Area filter chips */}
      {!normQ && (
        <div style={{
          display: "flex", gap: 4, padding: "4px 10px 8px", flexWrap: "nowrap",
          overflowX: "auto", flexShrink: 0,
        }}>
          {["Todos","Atenção Primária","Financeiro e Gestão Fiscal","Vigilância em Saúde","Saúde do Cidadão","Administração do Sistema"].map(a => (
            <button
              key={a}
              onClick={() => setArea(a === area ? AREA_ALL : a)}
              style={{
                flexShrink: 0,
                fontSize: 10, fontWeight: 600, border: "none", cursor: "pointer",
                borderRadius: 20, padding: "3px 8px", whiteSpace: "nowrap",
                background: area === a ? T.pillAct : T.pill,
                color: area === a ? "#fff" : T.muted,
                transition: "background 0.15s",
              }}
            >
              {a === "Todos" ? "Todos" : a.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {/* Scrollable area */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "0 6px 80px" }}>

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
          <Section label="⭐ Favoritos" muted>
            {favItems.slice(0, MAX_FAV_SHOW).map(item => renderItem(item))}
          </Section>
        )}

        {/* Recent */}
        {!normQ && !normQ && recentItems.length > 0 && area === AREA_ALL && (
          <Section label="🕐 Recentes" muted>
            {recentItems.slice(0, 5).map(item => renderItem(item))}
          </Section>
        )}

        {/* Categories */}
        {!normQ && grouped && Array.from(grouped.entries()).map(([cat, items]) => {
          const isCollapsed = collapsed[cat] ?? false;
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
            <div key={cat} style={{ marginBottom: 4 }}>
              <button
                onClick={() => toggleCat(cat)}
                style={{
                  width: "100%", background: "none", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "5px 8px", borderRadius: 6, color: T.muted,
                  fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase",
                  textAlign: "left",
                }}
                aria-expanded={!isCollapsed}
              >
                {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                <span style={{ flex: 1 }}>{cat}</span>
                <span style={{ fontSize: 9, opacity: 0.6 }}>{items.length}</span>
              </button>

              {!isCollapsed && (
                <div style={{ paddingLeft: 4 }}>
                  {/* Items without subcategory */}
                  {noSub.map(item => renderItem(item, !!item.highlight))}

                  {/* Subcategory groups */}
                  {Array.from(subcats.entries()).map(([sub, subItems]) => (
                    <Subcategory key={sub} label={sub}>
                      {subItems.map(item => renderItem(item, !!item.highlight))}
                    </Subcategory>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer — user + logout */}
      <div style={{
        flexShrink: 0,
        borderTop: `1px solid ${T.border}`,
        padding: "10px 12px",
        background: T.bg,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.act, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <User size={14} color="#fff" />
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 12, color: T.text, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {nomeUsuario ?? "Usuário"}
            </div>
            <div style={{ fontSize: 10, color: T.muted }}>{perfil}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Link to="/configuracoes" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "5px 0", borderRadius: 6, background: T.hover, color: T.muted, textDecoration: "none", fontSize: 11 }}>
            <Settings size={12} /> Config
          </Link>
          <button
            onClick={onLogout}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "5px 0", borderRadius: 6, background: T.hover, color: T.muted, border: "none", cursor: "pointer", fontSize: 11 }}
          >
            <LogOut size={12} /> Sair
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <SidebarContext.Provider value={{ openPalette: () => setPaletteOpen(true) }}>
      {/* ── Desktop ── */}
      <aside
        style={{
          width: 240, flexShrink: 0, height: "100vh", position: "sticky", top: 0,
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
        .sb-fav-btn[style*="color: rgb(245"] { opacity: 1 !important; }
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
function Section({ label, muted, children }: { label: string; muted?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, color: T.muted, padding: "4px 8px 2px", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function Subcategory({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginTop: 2 }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: "100%", background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 4,
          padding: "3px 6px", borderRadius: 4,
          color: "#475569", fontSize: 10, fontWeight: 600, letterSpacing: 0.3,
          textAlign: "left",
        }}
      >
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
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
    if (!normQ) return allowed.slice(0, 12);
    return allowed
      .map(i => ({ item: i, score: scoreItem(i, normQ) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(x => x.item);
  }, [allowed, normQ]);

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
                      {item.category}{item.subcategory ? ` › ${item.subcategory}` : ""}
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
