import { useListReports, useUpdateReport, useResolveReport } from "@workspace/api-client-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert, Flame, Clock, CheckCircle2, Building2,
  Filter, MapPin, ExternalLink, Zap, AlertTriangle, TrendingUp
} from "lucide-react";

const SEV_CONFIG: Record<string, { cls: string; barColor: string }> = {
  critical: { cls: "text-red-400 border-red-500/40 bg-red-500/10 badge-critical",   barColor: "#ef4444" },
  high:     { cls: "text-orange-400 border-orange-500/40 bg-orange-500/10 badge-high", barColor: "#f97316" },
  medium:   { cls: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10 badge-medium", barColor: "#eab308" },
  low:      { cls: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10 badge-low", barColor: "#10b981" },
};

const STATUS_COLOR: Record<string, string> = {
  pending:     "text-slate-400",
  analyzing:   "text-blue-400",
  validated:   "text-indigo-400",
  assigned:    "text-purple-400",
  in_progress: "text-amber-400",
  resolved:    "text-emerald-400",
  rejected:    "text-rose-400",
};

export default function Authority() {
  const qc = useQueryClient();
  const { data: allReports, isLoading } = useListReports({ limit: 100 });
  const updateReport  = useUpdateReport();
  const resolveReport = useResolveReport();

  const [filterStatus,   setFilterStatus]   = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [resolveId,      setResolveId]      = useState<number | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");

  const allArr = Array.isArray(allReports) ? allReports : [];
  const reports = allArr
    .filter(r => (filterStatus   === "all" || r.status   === filterStatus))
    .filter(r => (filterSeverity === "all" || r.severity === filterSeverity))
    .sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0));

  const stats = {
    total:      allArr.length,
    critical:   allArr.filter(r => r.severity === "critical").length,
    inProgress: allArr.filter(r => r.status === "in_progress").length,
    resolved:   allArr.filter(r => r.status === "resolved").length,
  };
  const resolveRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

  const handleStatusChange = async (id: number, status: string) => {
    await updateReport.mutateAsync({ id, data: { status: status as "pending"|"analyzing"|"validated"|"assigned"|"in_progress"|"resolved"|"rejected" } });
    qc.invalidateQueries({ queryKey: ["/api/reports"] });
    qc.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
  };

  const handleResolve = async () => {
    if (!resolveId || !resolutionNote.trim()) return;
    await resolveReport.mutateAsync({ id: resolveId, data: { resolutionNote } });
    qc.invalidateQueries({ queryKey: ["/api/reports"] });
    qc.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
    setResolveId(null);
    setResolutionNote("");
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-5 md:p-7 space-y-4 sm:space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-5 rounded-full bg-amber-400" />
            <h1 className="text-2xl font-bold font-mono tracking-tight">AUTHORITY DASHBOARD</h1>
          </div>
          <p className="text-muted-foreground text-xs font-mono ml-3.5">Priority queue · Municipal issue management</p>
        </div>
        <div className="w-10 h-10 rounded-xl border border-amber-400/20 bg-amber-400/8 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Issues",  value: stats.total,      icon: Building2,   color: "text-primary",     border: "border-primary/20",    bg: "bg-primary/8" },
          { label: "Critical",      value: stats.critical,   icon: Flame,       color: "text-red-400",     border: "border-red-400/20",    bg: "bg-red-400/8" },
          { label: "In Progress",   value: stats.inProgress, icon: Clock,       color: "text-amber-400",   border: "border-amber-400/20",  bg: "bg-amber-400/8" },
          { label: "Resolved",      value: stats.resolved,   icon: CheckCircle2,color: "text-emerald-400", border: "border-emerald-400/20",bg: "bg-emerald-400/8" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`rounded-xl border ${s.border} ${s.bg} p-4 relative overflow-hidden glow-border`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-muted-foreground tracking-wider">{s.label.toUpperCase()}</span>
              <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
            </div>
            <div className={`text-3xl font-bold font-mono ${s.color}`}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Resolution rate bar */}
      <div className="rounded-xl border border-border/60 bg-card/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-mono text-muted-foreground">RESOLUTION RATE</span>
          </div>
          <span className="text-sm font-bold font-mono text-emerald-400">{resolveRate}%</span>
        </div>
        <Progress value={resolveRate} className="h-2" />
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-1.5">
          <span>{stats.resolved} resolved</span>
          <span>{stats.total - stats.resolved} remaining</span>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
          <Filter className="w-3 h-3" /> FILTER
        </div>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-36 h-8 text-[11px] font-mono bg-card/50 border-border/60">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-8 text-[11px] font-mono bg-card/50 border-border/60">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="validated">Validated</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-[10px] font-mono text-muted-foreground">
          {reports.length} issues · sorted by priority
        </span>
      </div>

      {/* ── Issue list ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-28 shimmer rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {reports.map((report, idx) => {
              const sev = SEV_CONFIG[report.severity] ?? SEV_CONFIG.low;
              const pri = report.priorityScore ?? 0;
              const priColor = pri > 75 ? "#ef4444" : pri > 50 ? "#f97316" : pri > 25 ? "#eab308" : "#94a3b8";
              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: idx * 0.035 }}
                  className="rounded-xl border border-border/50 bg-card/50 hover:bg-card/70 transition-all duration-200 overflow-hidden group"
                >
                  <div className="p-3 sm:p-4 flex gap-3 sm:gap-4 items-start">
                    {/* Priority orb */}
                    <div
                      className="shrink-0 w-12 h-12 rounded-xl border flex flex-col items-center justify-center relative overflow-hidden"
                      style={{ borderColor: `${priColor}40`, background: `${priColor}10` }}
                    >
                      <span className="text-[9px] font-mono" style={{ color: priColor }}>PRI</span>
                      <span className="text-sm font-bold font-mono" style={{ color: priColor }}>{Math.round(pri)}</span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold font-mono text-sm truncate">{report.title}</h3>
                            <Badge variant="outline" className={`text-[9px] font-mono shrink-0 ${sev.cls}`}>
                              {report.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono flex-wrap">
                            {report.neighborhood && (
                              <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{report.neighborhood}</span>
                            )}
                            {report.assignedDepartment && (
                              <span className="flex items-center gap-1"><Building2 className="w-2.5 h-2.5" />{report.assignedDepartment}</span>
                            )}
                            {report.estimatedResolutionDays && (
                              <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{report.estimatedResolutionDays}d ETA</span>
                            )}
                            <span className={`flex items-center gap-1 ${STATUS_COLOR[report.status] ?? ""}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {report.status.replace("_", " ").toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <Link href={`/track/${report.id}`} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-primary">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>

                      {/* Score bars */}
                      {report.urgencyScore != null && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="flex justify-between text-[9px] font-mono text-muted-foreground mb-1">
                              <span>URGENCY</span><span className="text-red-400">{Math.round(report.urgencyScore)}</span>
                            </div>
                            <div className="h-1 rounded-full bg-border overflow-hidden">
                              <div className="h-full rounded-full bg-red-400/70 transition-all" style={{ width: `${report.urgencyScore}%` }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-[9px] font-mono text-muted-foreground mb-1">
                              <span>IMPACT</span><span className="text-orange-400">{Math.round(report.impactScore ?? 0)}</span>
                            </div>
                            <div className="h-1 rounded-full bg-border overflow-hidden">
                              <div className="h-full rounded-full bg-orange-400/70 transition-all" style={{ width: `${report.impactScore ?? 0}%` }} />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <Select value={report.status} onValueChange={v => handleStatusChange(report.id, v)}>
                          <SelectTrigger className="h-7 w-full sm:w-36 text-[10px] font-mono bg-background/50 border-border/60">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="assigned">Assigned</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                        {report.status !== "resolved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] font-mono border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 tracking-wider"
                            onClick={() => setResolveId(report.id)}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            RESOLVE
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {reports.length === 0 && !isLoading && (
            <div className="rounded-xl border border-border/40 bg-card/30 p-16 text-center">
              <AlertTriangle className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-xs font-mono text-muted-foreground">NO ISSUES MATCH CURRENT FILTERS</p>
            </div>
          )}
        </div>
      )}

      {/* ── Resolve dialog ── */}
      <Dialog open={!!resolveId} onOpenChange={() => setResolveId(null)}>
        <DialogContent className="bg-card border-border/60">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
          <DialogHeader>
            <DialogTitle className="font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              RESOLVE ISSUE #{resolveId}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-mono">Provide a resolution summary for citizen tracking and city records.</p>
            <Textarea
              placeholder="Describe what action was taken to resolve this issue..."
              value={resolutionNote}
              onChange={e => setResolutionNote(e.target.value)}
              className="bg-background/50 border-border/60 min-h-[100px] font-mono text-sm focus:border-emerald-500/40"
            />
          </div>
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button variant="ghost" size="sm" className="font-mono text-xs" onClick={() => setResolveId(null)}>CANCEL</Button>
            <Button
              size="sm"
              className="font-mono text-xs bg-emerald-500 hover:bg-emerald-600 text-white tracking-wider"
              onClick={handleResolve}
              disabled={!resolutionNote.trim() || resolveReport.isPending}
            >
              {resolveReport.isPending ? "RESOLVING..." : "MARK RESOLVED"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
