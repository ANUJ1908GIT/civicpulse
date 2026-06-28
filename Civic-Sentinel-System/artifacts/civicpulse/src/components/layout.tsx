// src/components/layout.tsx — Enterprise floating dock layout (mobile-responsive)
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, FileText, Map, Brain, Shield,
  Users, BarChart3, Settings, Plus, Search,
  Command, ChevronRight, Wifi, Sun, Moon, X,
  Activity, Cpu, Radio, AlertTriangle
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/theme-provider";
import { useListReports } from "@workspace/api-client-react";

const NAV_ITEMS = [
  { href: "/",          label: "Overview",    icon: LayoutDashboard },
  { href: "/report",    label: "Reports",     icon: FileText },
  { href: "/map",       label: "Live Map",    icon: Map },
  { href: "/admin",     label: "AI Insights", icon: Brain },
  { href: "/authority", label: "Authorities", icon: Shield },
  { href: "/community", label: "Community",   icon: Users },
  { href: "/analytics", label: "Analytics",   icon: BarChart3 },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

// ── Live Clock ────────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hh = time.getHours().toString().padStart(2, "0");
  const mm = time.getMinutes().toString().padStart(2, "0");
  const ss = time.getSeconds().toString().padStart(2, "0");
  const dateStr = time.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="hidden lg:flex flex-col items-end leading-none">
      <span className="text-sm font-bold font-mono text-foreground tracking-wider">
        {hh}:{mm}<span className="text-muted-foreground text-xs">:{ss}</span>
      </span>
      <span className="text-[10px] text-muted-foreground font-mono mt-0.5">{dateStr}</span>
    </div>
  );
}

// ── Pending Reports Badge ─────────────────────────────────────────────────────
function PendingAlerts() {
  const { data: reports } = useListReports();
  const pending = (reports ?? []).filter((r: any) => r.status === "pending" || r.status === "analyzing").length;
  if (!pending) return null;
  return (
    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
      <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
      <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">{pending} Pending</span>
    </div>
  );
}

// ── System Status ─────────────────────────────────────────────────────────────
function SystemStatus() {
  const [pulse, setPulse] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
      <div className={`w-2 h-2 rounded-full bg-emerald-500 transition-opacity duration-700 ${pulse ? "opacity-100" : "opacity-40"}`} />
      <Wifi className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
      <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Live</span>
    </div>
  );
}

// ── Command Palette ───────────────────────────────────────────────────────────
const COMMANDS = [
  { group: "Navigation", items: [
    { label: "Go to Dashboard",        shortcut: "G D", href: "/" },
    { label: "Submit New Report",      shortcut: "G R", href: "/report" },
    { label: "Open Live Map",          shortcut: "G M", href: "/map" },
    { label: "View AI Insights",       shortcut: "G A", href: "/admin" },
    { label: "Authority Dashboard",    shortcut: "G U", href: "/authority" },
    { label: "Community Feed",         shortcut: "G C", href: "/community" },
    { label: "Analytics",             shortcut: "G N", href: "/analytics" },
  ]},
  { group: "AI Commands", items: [
    { label: "Show critical reports",  shortcut: null, href: "/authority" },
    { label: "Open hotspot map",       shortcut: null, href: "/map" },
    { label: "Generate weekly report", shortcut: null, href: "/admin" },
    { label: "View AI predictions",    shortcut: null, href: "/admin" },
  ]},
];

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setQuery(""); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  const filtered = COMMANDS.map(g => ({
    ...g,
    items: g.items.filter(i => i.label.toLowerCase().includes(query.toLowerCase())),
  })).filter(g => g.items.length > 0);

  const handleSelect = (href: string) => { setLocation(href); onClose(); };

  if (!open) return null;

  return (
    <div className="command-overlay fixed inset-0 z-[9999] flex items-start justify-center pt-16 sm:pt-24 px-3 sm:px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -8 }}
        transition={{ duration: 0.15 }}
        className="command-box w-full max-w-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search reports, pages, AI commands..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
            onKeyDown={e => e.key === "Escape" && onClose()}
          />
          <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 hidden sm:inline">ESC</kbd>
        </div>

        <div className="max-h-72 sm:max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No results for "{query}"</div>
          ) : filtered.map(group => (
            <div key={group.group}>
              <div className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
                {group.group}
              </div>
              {group.items.map(item => (
                <button
                  key={item.label}
                  onClick={() => handleSelect(item.href)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-accent transition-colors text-left"
                >
                  <span className="flex items-center gap-2.5">
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    {item.label}
                  </span>
                  {item.shortcut && (
                    <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 hidden sm:inline">{item.shortcut}</kbd>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="border-t border-border px-4 py-2 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><kbd className="border border-border rounded px-1">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="border border-border rounded px-1">↵</kbd> select</span>
          <span className="flex items-center gap-1"><kbd className="border border-border rounded px-1">ESC</kbd> close</span>
        </div>
      </motion.div>
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}

// ── Settings Panel ────────────────────────────────────────────────────────────
function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center sm:justify-end px-0 sm:px-4 sm:pr-6 pb-0 sm:pb-0 pt-0">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.18 }}
        className="w-full sm:w-80 bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden sm:mb-0"
        style={{ maxHeight: "85vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-foreground text-sm">Settings</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">System preferences</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-accent transition-all text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: "calc(85vh - 65px)" }}>
          {/* Appearance */}
          <div>
            <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-2">Appearance</p>
            <div className="grid grid-cols-2 gap-2">
              {(["light", "dark", "system"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all capitalize ${
                    theme === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  {t === "light" ? <Sun className="w-3.5 h-3.5" /> : t === "dark" ? <Moon className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Preferences */}
          <div>
            <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-2">Preferences</p>
            <div className="space-y-1">
              {[
                { label: "Push Notifications", sub: "Alerts for new critical reports", val: notifications, set: setNotifications },
                { label: "Auto Refresh", sub: "Live data every 30s", val: autoRefresh, set: setAutoRefresh },
                { label: "Compact Mode", sub: "Denser UI layout", val: compactMode, set: setCompactMode },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-accent/50 transition-all">
                  <div>
                    <p className="text-xs font-medium text-foreground">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                  </div>
                  <button
                    onClick={() => item.set(!item.val)}
                    className={`w-10 h-5 rounded-full transition-all relative ${item.val ? "bg-primary" : "bg-border"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${item.val ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* System Info */}
          <div>
            <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-2">System</p>
            <div className="rounded-xl border border-border bg-background/50 p-3 space-y-2">
              {[
                { label: "Platform", value: "CivicPulse v2.0" },
                { label: "AI Engine", value: "8-Agent Pipeline" },
                { label: "Database", value: "Neon PostgreSQL" },
                { label: "Maps", value: "OpenStreetMap + Nominatim" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{item.label}</span>
                  <span className="text-[11px] font-mono text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      <div className="absolute inset-0 -z-10 bg-black/20" onClick={onClose} />
    </div>
  );
}

// ── Top Bar ───────────────────────────────────────────────────────────────────
function TopBar({ onCommandOpen, onSettingsOpen }: { onCommandOpen: () => void; onSettingsOpen: () => void }) {
  return (
    <header className="topbar h-14 flex items-center px-3 sm:px-6 gap-2 sm:gap-3 sticky top-0 z-50">
      {/* Mobile: brand */}
      <div className="flex md:hidden items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <LayoutDashboard className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-bold text-foreground">CivicPulse</span>
      </div>

      {/* Desktop: Live system indicators */}
      <div className="hidden md:flex items-center gap-2">
        <SystemStatus />
        <PendingAlerts />
      </div>

      <div className="flex-1" />

      {/* Center: Search */}
      <button
        onClick={onCommandOpen}
        className="hidden md:flex items-center gap-2.5 h-9 px-3.5 rounded-xl border border-border bg-background text-muted-foreground text-sm hover:border-primary/30 hover:bg-accent transition-all min-w-[220px]"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="flex-1 text-left text-xs">Search reports, locations...</span>
        <div className="flex items-center gap-0.5">
          <kbd className="text-[10px] border border-border rounded px-1 py-0.5 bg-background">⌘K</kbd>
        </div>
      </button>

      <div className="flex-1 hidden md:block" />

      {/* Right: useful items */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Live clock */}
        <LiveClock />

        <div className="w-px h-5 bg-border hidden lg:block mx-1" />

        <ThemeToggle />

        {/* Search icon (mobile) */}
        <button
          onClick={onCommandOpen}
          className="w-8 h-8 rounded-lg flex md:hidden items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Command palette (desktop) */}
        <button
          onClick={onCommandOpen}
          className="w-8 h-8 rounded-lg hidden md:flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          title="Command palette (⌘K)"
        >
          <Command className="w-4 h-4" />
        </button>

        {/* AI Pulse indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/8 border border-primary/20" title="AI Pipeline Active">
          <Cpu className="w-3 h-3 text-primary" />
          <span className="text-[11px] font-medium text-primary hidden lg:inline">AI Active</span>
        </div>

        {/* Quick report */}
        <Link href="/report">
          <button className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all">
            <Plus className="w-3.5 h-3.5" />
            Report
          </button>
        </Link>

        {/* Settings */}
        <button
          onClick={onSettingsOpen}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

// ── Floating Dock (left sidebar) ──────────────────────────────────────────────
function FloatingDock({ onSettingsOpen }: { onSettingsOpen: () => void }) {
  const [location] = useLocation();
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.nav
      initial={false}
      animate={{ width: expanded ? 200 : 64 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="floating-dock hidden md:flex flex-col fixed left-4 top-1/2 -translate-y-1/2 z-40 rounded-2xl py-3 overflow-hidden"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 pb-3 mb-1 border-b border-border/60">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <LayoutDashboard className="w-4.5 h-4.5 text-white" />
        </div>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <div className="text-sm font-bold text-foreground leading-none">CivicPulse</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">AI Platform</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <div className="flex-1 flex flex-col gap-0.5 px-2 py-1">
        {NAV_ITEMS.map(item => {
          const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                transition={{ duration: 0.1 }}
                className={`flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      transition={{ duration: 0.12 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Bottom: Settings — now actually opens settings panel */}
      <div className="px-2 pt-2 border-t border-border/60 mt-1">
        <motion.div
          whileHover={{ x: 2 }}
          onClick={onSettingsOpen}
          className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
        >
          <Settings className="w-4 h-4 shrink-0" />
          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                className="text-sm font-medium whitespace-nowrap"
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.nav>
  );
}

// ── Mobile Bottom Nav ─────────────────────────────────────────────────────────
function MobileNav() {
  const [location] = useLocation();
  const items = NAV_ITEMS.slice(0, 5);
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-t border-border flex items-center justify-around h-16 px-1 safe-area-bottom">
      {items.map(item => {
        const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href}>
            <div className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-[44px] ${active ? "text-primary" : "text-muted-foreground"}`}>
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] font-medium leading-none">{item.label}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

// ── Main Layout ───────────────────────────────────────────────────────────────
export function Layout({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        setSettingsOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnimatePresence>
        {commandOpen && <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOpen && <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />}
      </AnimatePresence>

      <FloatingDock onSettingsOpen={() => setSettingsOpen(true)} />
      <MobileNav />

      <div className="md:pl-[88px]">
        <TopBar onCommandOpen={() => setCommandOpen(true)} onSettingsOpen={() => setSettingsOpen(true)} />
        <main className="page-enter pb-20 md:pb-8 min-h-screen overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
