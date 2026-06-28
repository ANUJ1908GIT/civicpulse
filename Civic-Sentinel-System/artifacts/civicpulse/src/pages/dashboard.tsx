// src/pages/dashboard.tsx — Enterprise Dashboard (mobile-responsive)
import { useGetDashboardStats, useListReports } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  AlertCircle, CheckCircle2, Clock, Activity, ArrowRight,
  TrendingUp, TrendingDown, Minus, MapPin, Zap, Building2,
  BarChart3, Users, ArrowUpRight, Shield, FileText, Brain
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area } from "recharts";
import { useEffect, useState } from "react";
import MiniMapPreview from "@/components/map/MiniMapPreview";

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, duration = 900 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / (duration / 16));
    const t = setInterval(() => {
      start = Math.min(start + step, value);
      setDisplay(start);
      if (start >= value) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [value, duration]);
  return <span>{display.toLocaleString()}</span>;
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, icon: Icon, color, bg, change, suffix = ""
}: {
  label: string; value: number; icon: React.ElementType;
  color: string; bg: string; change?: number; suffix?: string;
}) {
  const isPositive = (change ?? 0) >= 0;
  const TrendIcon = change == null ? Minus : isPositive ? TrendingUp : TrendingDown;
  const trendCls = change == null ? "text-muted-foreground" : isPositive ? "text-emerald-600" : "text-red-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
      transition={{ duration: 0.2 }}
      className="card-base card-shadow bg-white dark:bg-card p-3 sm:p-5 flex flex-col gap-2 sm:gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground leading-tight pr-1">{label}</span>
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0`} style={{ background: bg }}>
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color }} />
        </div>
      </div>
      <div>
        <div className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          <AnimatedNumber value={value} />{suffix}
        </div>
        {change != null && (
          <div className={`flex items-center gap-1 mt-1 sm:mt-1.5 text-xs ${trendCls}`}>
            <TrendIcon className="w-3 h-3" />
            <span className="font-medium">{Math.abs(change)}%</span>
            <span className="text-muted-foreground font-normal hidden sm:inline">vs yesterday</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Report card ───────────────────────────────────────────────────────────────
const SEV_CONFIG: Record<string, { label: string; cls: string }> = {
  critical: { label: "High Priority",  cls: "badge-critical" },
  high:     { label: "High",           cls: "badge-high"     },
  medium:   { label: "Medium",         cls: "badge-medium"   },
  low:      { label: "Low",            cls: "badge-low"      },
};

const STAT_CONFIG: Record<string, string> = {
  pending:     "status-pending",
  analyzing:   "status-analyzing",
  in_progress: "status-in_progress",
  resolved:    "status-resolved",
  rejected:    "status-rejected",
};

function ReportCard({ report, idx }: { report: any; idx: number }) {
  const sev  = SEV_CONFIG[report.severity]  ?? SEV_CONFIG.low;
  const stat = STAT_CONFIG[report.status]   ?? "status-pending";

  return (
    <Link href={`/track/${report.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.06 }}
        whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
        className="card-base bg-white dark:bg-card p-3 sm:p-4 cursor-pointer flex gap-3 sm:gap-3.5 group transition-all"
      >
        {/* Thumbnail */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-border">
          {report.imageUrl
            ? <img src={report.imageUrl} alt={report.title} className="w-full h-full object-cover" />
            : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/30" />
              </div>
            )
          }
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-xs sm:text-sm text-foreground leading-tight line-clamp-2 sm:line-clamp-1 group-hover:text-primary transition-colors">
              {report.title}
            </h3>
            <Badge className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 border ${sev.cls}`}>
              {sev.label}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-1 hidden sm:block">{report.description}</p>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {report.neighborhood && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="w-3 h-3" />{report.neighborhood}
              </span>
            )}
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${stat}`}>
              {report.status.replace("_", " ")}
            </span>
            <span className="text-[11px] text-muted-foreground ml-auto">
              {new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ── Chart colors ──────────────────────────────────────────────────────────────
const CHART_COLORS = ["#2563EB", "#16A34A", "#F59E0B", "#DC2626", "#7C3AED", "#0891B2"];

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: rawReports, isLoading: reportsLoading } = useListReports({ limit: 8 });
  const reports = Array.isArray(rawReports) ? rawReports : [];

  const kpis = [
    { label: "Total Reports",      value: stats?.totalReports ?? 0,  icon: FileText,   color: "#2563EB", bg: "#EFF6FF", change: 10.2 },
    { label: "In Progress",        value: stats?.pendingReports ?? 0, icon: Clock,      color: "#F59E0B", bg: "#FFFBEB", change: 12.5 },
    { label: "Resolved Today",     value: stats?.resolvedReports ?? 0, icon: CheckCircle2, color: "#16A34A", bg: "#F0FDF4", change: 24.7 },
    { label: "Critical Issues",    value: stats?.criticalReports ?? 0, icon: AlertCircle,  color: "#DC2626", bg: "#FEF2F2", change: -8.3 },
    { label: "Authorities Online", value: 28,                         icon: Building2,  color: "#7C3AED", bg: "#F5F3FF", change: undefined },
    { label: "AI Confidence",      value: 96,                         icon: Brain,      color: "#0891B2", bg: "#ECFEFF", suffix: "%", change: undefined },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

      {/* ── KPI row ── */}
      {statsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card-base h-24 sm:h-28 skeleton" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {kpis.map((k, i) => (
            <KpiCard key={k.label} {...k} />
          ))}
        </div>
      )}

      {/* ── Main 2-col grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">

        {/* Left 2/3: Map + Reports ── */}
        <div className="xl:col-span-2 space-y-4 sm:space-y-6">

          {/* City Intelligence Map */}
          <div className="card-base bg-white dark:bg-card">
            <div className="flex items-start sm:items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-border gap-2">
              <div className="min-w-0">
                <h2 className="font-semibold text-foreground text-sm sm:text-base">City Intelligence Map</h2>
                <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">Live hotspot detection & report clustering</p>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <div className="hidden lg:flex items-center gap-3 text-[11px] text-muted-foreground">
                  {[
                    { color: "#DC2626", label: "High" },
                    { color: "#F59E0B", label: "Medium" },
                    { color: "#16A34A", label: "Low" },
                    { color: "#2563EB", label: "Reports" },
                  ].map(l => (
                    <span key={l.label} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                      {l.label}
                    </span>
                  ))}
                </div>
                <Link href="/map">
                  <Button variant="ghost" size="sm" className="text-xs gap-1.5 h-8 px-2 sm:px-3">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Expand</span>
                  </Button>
                </Link>
              </div>
            </div>
            <div className="h-56 sm:h-72 map-container relative rounded-b-xl overflow-hidden">
              <MiniMapPreview />
            </div>
          </div>

          {/* Recent Reports */}
          <div className="card-base bg-white dark:bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-border">
              <div>
                <h2 className="font-semibold text-foreground text-sm sm:text-base">Recent Reports</h2>
                <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">Latest submitted civic issues</p>
              </div>
              <Link href="/analytics">
                <Button variant="ghost" size="sm" className="text-xs gap-1.5 h-8 text-primary px-2 sm:px-3">
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
            <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
              {reportsLoading
                ? [...Array(4)].map((_, i) => <div key={i} className="h-16 sm:h-20 skeleton rounded-xl" />)
                : reports.length === 0
                ? (
                  <div className="py-12 text-center">
                    <FileText className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No reports yet</p>
                    <Link href="/report">
                      <Button size="sm" className="mt-3 text-xs">Submit first report</Button>
                    </Link>
                  </div>
                )
                : reports.map((r, i) => <ReportCard key={r.id} report={r} idx={i} />)
              }
            </div>
          </div>
        </div>

        {/* Right 1/3: Side panels ── */}
        <div className="space-y-4 sm:space-y-5">

          {/* Category breakdown donut */}
          <div className="card-base bg-white dark:bg-card overflow-hidden">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-border">
              <h2 className="font-semibold text-foreground text-sm sm:text-base">Reports by Category</h2>
              <p className="text-xs text-muted-foreground mt-0.5">This week</p>
            </div>
            <div className="p-3 sm:p-4">
              {statsLoading ? (
                <div className="h-44 skeleton rounded-xl" />
              ) : Array.isArray(stats?.reportsByCategory) && stats.reportsByCategory.length > 0 ? (
                <>
                  <div className="h-44 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.reportsByCategory}
                          cx="50%" cy="50%"
                          innerRadius={48} outerRadius={68}
                          paddingAngle={3}
                          dataKey="count"
                          nameKey="category"
                          stroke="none"
                        >
                          {stats.reportsByCategory.map((_: any, i: number) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 10,
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center total */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-foreground">
                        {stats.reportsByCategory.reduce((s: number, c: any) => s + c.count, 0)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">Total</span>
                    </div>
                  </div>
                  <div className="space-y-2 mt-3">
                    {stats.reportsByCategory.slice(0, 5).map((c: any, i: number) => {
                      const total = stats.reportsByCategory.reduce((s: number, x: any) => s + x.count, 0);
                      const pct = total > 0 ? Math.round((c.count / total) * 100) : 0;
                      return (
                        <div key={c.category} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-xs text-muted-foreground flex-1 truncate capitalize">{c.category}</span>
                          <span className="text-xs font-semibold text-foreground">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
              )}
            </div>
          </div>

          {/* Authority status */}
          <div className="card-base bg-white dark:bg-card overflow-hidden">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-border">
              <h2 className="font-semibold text-foreground text-sm sm:text-base">Authority Status</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Department activity</p>
            </div>
            <div className="p-3 sm:p-4 space-y-3">
              {[
                { name: "Public Works",    active: true,  issues: 38, resolved: 12, color: "#2563EB" },
                { name: "Water Supply",    active: true,  issues: 24, resolved: 8,  color: "#16A34A" },
                { name: "Electricity Dept",active: false, issues: 15, resolved: 5,  color: "#F59E0B" },
                { name: "Sanitation",      active: true,  issues: 10, resolved: 4,  color: "#7C3AED" },
              ].map((dept, i) => (
                <motion.div
                  key={dept.name}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg border border-border flex items-center justify-center bg-slate-50 dark:bg-slate-800 shrink-0">
                    <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground truncate">{dept.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${dept.active ? "bg-emerald-500" : "bg-slate-300"}`} />
                        <span className="text-[10px] text-muted-foreground">{dept.issues} active</span>
                      </div>
                    </div>
                    <Progress
                      value={(dept.resolved / dept.issues) * 100}
                      className="h-1"
                    />
                  </div>
                </motion.div>
              ))}
              <Link href="/authority">
                <Button variant="ghost" size="sm" className="w-full text-xs mt-1 text-primary">
                  View All Departments <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick actions */}
          <div className="card-base bg-white dark:bg-card p-3 sm:p-4">
            <h2 className="font-semibold text-foreground text-sm mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "New Report",    href: "/report",    icon: FileText,  color: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400" },
                { label: "Live Map",      href: "/map",       icon: MapPin,    color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" },
                { label: "AI Insights",  href: "/admin",     icon: Brain,     color: "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400" },
                { label: "Community",    href: "/community", icon: Users,     color: "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400" },
              ].map(a => (
                <Link key={a.href} href={a.href}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex flex-col items-center gap-1.5 p-2.5 sm:p-3 rounded-xl cursor-pointer border border-transparent hover:border-border transition-all ${a.color}`}
                  >
                    <a.icon className="w-4 h-4" />
                    <span className="text-[11px] font-medium">{a.label}</span>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
