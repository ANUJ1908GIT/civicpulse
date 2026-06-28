import { useGetCommunityFeed, useListReports, useListAuthorities } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Users, Activity, CheckCircle2, AlertCircle, GitMerge,
  Zap, FileWarning, MessageSquare, ArrowRight, Building2, Clock, Radio
} from "lucide-react";

const FEED_ICONS: Record<string, React.ElementType> = {
  report_submitted:  Activity,
  report_validated:  CheckCircle2,
  report_resolved:   CheckCircle2,
  agent_completed:   Zap,
  escalation:        AlertCircle,
  duplicate_detected: GitMerge,
};

const FEED_COLORS: Record<string, { icon: string; bg: string; border: string; label: string }> = {
  report_submitted:   { icon: "#60a5fa", bg: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.2)",  label: "NEW REPORT" },
  report_validated:   { icon: "#818cf8", bg: "rgba(129,140,248,0.08)", border: "rgba(129,140,248,0.2)", label: "VALIDATED" },
  report_resolved:    { icon: "#34d399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.2)",  label: "RESOLVED" },
  agent_completed:    { icon: "#0ea5e9", bg: "rgba(14,165,233,0.08)",  border: "rgba(14,165,233,0.2)",  label: "AI COMPLETE" },
  escalation:         { icon: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)", label: "ESCALATION" },
  duplicate_detected: { icon: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.2)",  label: "DUPLICATE" },
};

const SEV_CLS: Record<string, string> = {
  critical: "border-red-500/40 text-red-400 bg-red-500/8",
  high:     "border-orange-500/40 text-orange-400 bg-orange-500/8",
  medium:   "border-yellow-500/40 text-yellow-400 bg-yellow-500/8",
  low:      "border-emerald-500/40 text-emerald-400 bg-emerald-500/8",
};

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Community() {
  const { data: feed,       isLoading: feedLoading }    = useGetCommunityFeed();
  const { data: resolved,   isLoading: resolvedLoading} = useListReports({ status: "resolved", limit: 5 });
  const { data: authorities }                            = useListAuthorities();

  const feedList      = Array.isArray(feed)        ? feed        : [];
  const resolvedList  = Array.isArray(resolved)    ? resolved    : [];
  const authorityList = Array.isArray(authorities) ? authorities : [];

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-5 md:p-7 space-y-4 sm:space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-5 rounded-full bg-purple-400" />
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight">COMMUNITY FEED</h1>
          </div>
          <p className="text-muted-foreground text-xs font-mono ml-3.5">Real-time civic activity across all neighborhoods</p>
        </div>
        <div className="w-10 h-10 rounded-xl border border-purple-400/20 bg-purple-400/8 flex items-center justify-center">
          <Users className="w-5 h-5 text-purple-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* ── Live activity feed ── */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-primary animate-pulse" />
            <h2 className="text-sm font-bold font-mono tracking-wider">LIVE ACTIVITY FEED</h2>
            {!feedLoading && (
              <span className="text-[10px] font-mono text-muted-foreground ml-auto">{feedList.length} events</span>
            )}
          </div>

          {feedLoading ? (
            <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-20 shimmer rounded-xl" />)}</div>
          ) : feedList.length === 0 ? (
            <div className="rounded-xl border border-border/40 bg-card/30 p-12 text-center">
              <Radio className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-xs font-mono text-muted-foreground">NO ACTIVITY YET</p>
            </div>
          ) : (
            <div className="space-y-2">
              {feedList.map((item, idx) => {
                const Icon   = FEED_ICONS[item.type] ?? MessageSquare;
                const colors = FEED_COLORS[item.type] ?? { icon: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)", label: "EVENT" };
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="rounded-xl border bg-card/40 hover:bg-card/60 transition-all duration-200 p-4 flex gap-3"
                    style={{ borderColor: colors.border }}
                  >
                    {/* Icon */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{ background: colors.bg, borderColor: colors.border }}
                    >
                      <Icon className="w-4 h-4" style={{ color: colors.icon }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold" style={{ color: colors.icon }}>
                          {colors.label}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0">{timeAgo(item.timestamp)}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-foreground/80 mb-1.5">{item.message}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.neighborhood && (
                          <span className="text-[10px] font-mono text-muted-foreground">{item.neighborhood}</span>
                        )}
                        {item.severity && (
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${SEV_CLS[item.severity] ?? ""}`}>
                            {item.severity.toUpperCase()}
                          </Badge>
                        )}
                        {item.reportId && (
                          <Link href={`/track/${item.reportId}`} className="text-[10px] font-mono text-primary hover:text-primary/80 flex items-center gap-0.5">
                            Report #{item.reportId} <ArrowRight className="w-2.5 h-2.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">

          {/* Recently resolved */}
          <div className="rounded-xl border border-border/60 bg-card/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-mono font-bold tracking-wider text-muted-foreground">RECENTLY RESOLVED</span>
            </div>
            <div className="p-3 space-y-1">
              {resolvedLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 shimmer rounded-lg" />)}</div>
              ) : resolvedList.length > 0 ? (
                resolvedList.map(r => (
                  <Link key={r.id} href={`/track/${r.id}`}>
                    <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                      <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{r.title}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{r.neighborhood ?? "—"}</p>
                      </div>
                      <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-[11px] text-muted-foreground font-mono text-center py-6">NO RESOLVED ISSUES YET</p>
              )}
            </div>
          </div>

          {/* Active authorities */}
          <div className="rounded-xl border border-border/60 bg-card/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] font-mono font-bold tracking-wider text-muted-foreground">ACTIVE AUTHORITIES</span>
            </div>
            <div className="p-3 space-y-3">
              {authorityList.slice(0, 4).map(auth => (
                <div key={auth.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold truncate">{auth.name}</span>
                    <Badge variant="outline" className="text-[9px] border-border/50 text-muted-foreground font-mono ml-2 shrink-0">
                      {auth.activeIssues} active
                    </Badge>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">{auth.department}</div>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{auth.avgResponseHours}h avg</span>
                    <span className="text-emerald-400">{auth.resolvedThisMonth} resolved</span>
                  </div>
                  {/* Response time bar */}
                  <div className="h-0.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/50"
                      style={{ width: `${Math.min((auth.resolvedThisMonth / 10) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA card */}
          <div className="rounded-xl border border-primary/25 bg-primary/6 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            <div className="p-5 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto">
                <FileWarning className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold font-mono">SEE A PROBLEM?</p>
                <p className="text-[11px] text-muted-foreground mt-1">Report it instantly. AI does the rest.</p>
              </div>
              <Link href="/report">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full bg-primary text-primary-foreground text-[11px] font-mono font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 tracking-wider"
                >
                  <Zap className="w-3.5 h-3.5" />
                  REPORT AN ISSUE
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
