import { useGetReport, useValidateReport, useAnalyzeReport } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Building2, Clock, ThumbsUp, CheckCircle2,
  Eye, Tag, Zap, AlertTriangle, TrendingUp, Brain, Shield,
  Navigation, GitMerge, Star, BarChart3, RefreshCw, Calendar,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

const SEVERITY_CONFIG = {
  critical: { label: "CRITICAL", cls: "border-red-500/50 text-red-400 bg-red-500/10 badge-critical" },
  high:     { label: "HIGH",     cls: "border-orange-500/50 text-orange-400 bg-orange-500/10 badge-high" },
  medium:   { label: "MEDIUM",   cls: "border-yellow-500/50 text-yellow-400 bg-yellow-500/10 badge-medium" },
  low:      { label: "LOW",      cls: "border-emerald-500/50 text-emerald-400 bg-emerald-500/10 badge-low" },
};

const STATUS_CONFIG: Record<string, { label: string; dot: string; cls: string; color: string }> = {
  pending:     { label: "PENDING",     dot: "bg-slate-400",                  cls: "bg-slate-500/10 text-slate-400 border-slate-500/30",   color: "#94a3b8" },
  analyzing:   { label: "ANALYZING",   dot: "bg-blue-400 animate-pulse",     cls: "bg-blue-500/10 text-blue-400 border-blue-500/30",      color: "#60a5fa" },
  validated:   { label: "VALIDATED",   dot: "bg-indigo-400",                 cls: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30", color: "#818cf8" },
  assigned:    { label: "ASSIGNED",    dot: "bg-purple-400",                 cls: "bg-purple-500/10 text-purple-400 border-purple-500/30", color: "#c084fc" },
  in_progress: { label: "IN PROGRESS", dot: "bg-amber-400 animate-pulse",    cls: "bg-amber-500/10 text-amber-400 border-amber-500/30",   color: "#fbbf24" },
  resolved:    { label: "RESOLVED",    dot: "bg-emerald-400",                cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", color: "#34d399" },
  rejected:    { label: "REJECTED",    dot: "bg-rose-400",                   cls: "bg-rose-500/10 text-rose-400 border-rose-500/30",      color: "#fb7185" },
};

const AGENT_DEFS = [
  { key: "visionAgent",         icon: Eye,         label: "Vision Agent",         color: "#0ea5e9" },
  { key: "classificationAgent", icon: Tag,         label: "Classification",       color: "#8b5cf6" },
  { key: "geospatialAgent",     icon: MapPin,      label: "Geospatial",           color: "#10b981" },
  { key: "duplicateAgent",      icon: GitMerge,    label: "Duplicate Detection",  color: "#f59e0b" },
  { key: "priorityAgent",       icon: Zap,         label: "Priority",             color: "#ef4444" },
  { key: "routingAgent",        icon: Navigation,  label: "Routing",              color: "#ec4899" },
  { key: "predictiveAgent",     icon: TrendingUp,  label: "Predictive",           color: "#14b8a6" },
  { key: "resolutionAdvisor",   icon: Shield,      label: "Resolution Advisor",   color: "#a3e635" },
];

function ScoreRing({ value, color, label }: { value: number; color: string; label: string }) {
  const r = 24;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="60" height="60" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle
          cx="30" cy="30" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 30 30)"
          style={{ transition: "stroke-dasharray 1s ease", filter: `drop-shadow(0 0 4px ${color}80)` }}
        />
        <text x="30" y="35" textAnchor="middle" fontSize="13" fontWeight="bold" fill={color} fontFamily="monospace">
          {Math.round(value)}
        </text>
      </svg>
      <span className="text-[10px] font-mono text-muted-foreground tracking-wider">{label}</span>
    </div>
  );
}

function AgentCard({ agentKey, icon: Icon, label, color, data }: {
  agentKey: string; icon: React.ElementType; label: string; color: string; data: Record<string, unknown> | null | undefined;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!data) return null;
  const entries = Object.entries(data);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card/50 overflow-hidden"
      style={{ borderColor: `${color}30` }}
    >
      <button
        className="w-full flex items-center gap-3 p-3 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div className="flex-1">
          <div className="text-xs font-mono font-semibold" style={{ color }}>{label}</div>
          <div className="text-[10px] text-muted-foreground">{entries.length} data points</div>
        </div>
        <div className="w-4 h-4 rounded-full border flex items-center justify-center" style={{ borderColor: `${color}40` }}>
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            className="text-[10px]"
            style={{ color }}
          >▾</motion.span>
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-1.5 border-t border-white/5">
              {entries.map(([k, v]) => (
                <div key={k} className="flex gap-2 text-[11px] pt-1.5">
                  <span className="text-muted-foreground font-mono shrink-0 capitalize min-w-[100px]">
                    {k.replace(/([A-Z])/g, " $1").trim()}:
                  </span>
                  <span className="text-foreground font-mono break-all">
                    {Array.isArray(v) ? v.join(", ") || "—"
                      : typeof v === "boolean" ? (v ? "Yes" : "No")
                      : typeof v === "number" ? Math.round(v * 100) / 100
                      : String(v ?? "—")}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Track() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0");
  const { data: report, isLoading, refetch } = useGetReport(id, { query: { enabled: !!id, queryKey: ["getReport", id] } });
  const validateReport = useValidateReport();
  const analyzeReport = useAnalyzeReport();

  const handleValidate = async () => {
    await validateReport.mutateAsync({ id, data: { isValid: true, validatorName: "Anonymous Citizen" } });
    refetch();
  };
  const handleReanalyze = async () => {
    await analyzeReport.mutateAsync({ id });
    refetch();
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-5">
        {[80, 200, 120, 120].map((h, i) => (
          <div key={i} className="shimmer rounded-xl" style={{ height: h }} />
        ))}
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <AlertTriangle className="w-10 h-10 text-muted-foreground/30" />
        <p className="text-muted-foreground font-mono text-sm">REPORT NOT FOUND</p>
        <Link href="/"><Button variant="outline" size="sm" className="font-mono text-xs"><ArrowLeft className="w-3 h-3 mr-1" />BACK</Button></Link>
      </div>
    );
  }

  const sev  = SEVERITY_CONFIG[report.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.medium;
  const stat = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.pending;
  const ai   = report.aiAnalysis as Record<string, Record<string, unknown>> | null;
  const agentsWithData = AGENT_DEFS.filter(a => ai?.[a.key]);

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-5 md:p-7 space-y-4 sm:space-y-5">

      {/* ── Breadcrumb + actions ── */}
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3 h-3" /> BACK TO DASHBOARD
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="font-mono text-[10px] tracking-wider h-8 border-border/60"
          onClick={handleReanalyze}
          disabled={analyzeReport.isPending}
        >
          <RefreshCw className={`w-3 h-3 mr-1.5 ${analyzeReport.isPending ? "animate-spin" : ""}`} />
          {analyzeReport.isPending ? "ANALYZING..." : "RE-ANALYZE"}
        </Button>
      </div>

      {/* ── Hero header ── */}
      <div className="rounded-xl border border-border/60 bg-card/50 backdrop-blur overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <div className="p-4 sm:p-5 md:p-6">
          <div className="flex items-start gap-4">
            {/* Image thumbnail */}
            {(report.imageUrl || report.imageBase64) && (
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-border/60 shrink-0">
                <img src={report.imageUrl ?? report.imageBase64 ?? ""} alt={report.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground mb-2">
                <span className="text-primary">REPORT #{report.id}</span>
                <span>·</span>
                <Calendar className="w-3 h-3" />
                <span>{new Date(report.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold font-mono tracking-tight mb-3">{report.title}</h1>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={`text-[10px] font-mono ${sev.cls}`}>{sev.label}</Badge>
                <Badge variant="outline" className={`text-[10px] font-mono ${stat.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${stat.dot}`} />
                  {stat.label}
                </Badge>
                {report.category && (
                  <Badge variant="outline" className="text-[10px] font-mono border-border/50 text-muted-foreground">{report.category}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Description */}
          <div className="rounded-xl border border-border/60 bg-card/50 p-5">
            <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-3 flex items-center gap-2">
              <div className="w-1 h-3 rounded-full bg-primary" />
              INCIDENT DESCRIPTION
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{report.description}</p>
          </div>

          {/* Location metadata */}
          {(report.address || report.neighborhood || report.assignedDepartment || report.estimatedResolutionDays) && (
            <div className="rounded-xl border border-border/60 bg-card/50 p-4 grid grid-cols-2 gap-3">
              {report.address && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-muted-foreground">ADDRESS</div>
                    <div className="text-xs font-mono">{report.address}</div>
                  </div>
                </div>
              )}
              {report.neighborhood && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-muted-foreground">NEIGHBORHOOD</div>
                    <div className="text-xs font-mono">{report.neighborhood}</div>
                  </div>
                </div>
              )}
              {report.assignedDepartment && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-muted-foreground">DEPT</div>
                    <div className="text-xs font-mono">{report.assignedDepartment}</div>
                  </div>
                </div>
              )}
              {report.estimatedResolutionDays && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-muted-foreground">ETA</div>
                    <div className="text-xs font-mono">{report.estimatedResolutionDays} days</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Agent Results — expandable cards */}
          {agentsWithData.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold font-mono tracking-wider">AI AGENT ANALYSIS</h2>
                <span className="text-[10px] font-mono text-muted-foreground ml-auto">{agentsWithData.length} agents ran</span>
              </div>
              <div className="space-y-2">
                {AGENT_DEFS.map(a => (
                  <AgentCard key={a.key} agentKey={a.key} icon={a.icon} label={a.label} color={a.color} data={ai?.[a.key]} />
                ))}
              </div>
            </div>
          )}

          {/* Resolution banner */}
          {report.status === "resolved" && report.resolutionNote && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold font-mono text-emerald-400">RESOLVED</span>
                {report.resolvedAt && (
                  <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                    {new Date(report.resolvedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground/80">{report.resolutionNote}</p>
            </motion.div>
          )}

          {/* Duplicate warning */}
          {report.duplicateOfId && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/8 p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <p className="text-xs font-mono text-rose-400 font-bold">DUPLICATE DETECTED</p>
                <p className="text-xs text-muted-foreground">Similar to Report #{report.duplicateOfId}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="space-y-4">

          {/* Priority score rings */}
          {(report.urgencyScore != null || report.impactScore != null || report.riskScore != null) && (
            <div className="rounded-xl border border-border/60 bg-card/50 p-4">
              <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-4 flex items-center gap-2">
                <BarChart3 className="w-3 h-3" /> PRIORITY SCORES
              </div>
              <div className="flex items-center justify-around mb-4">
                {report.urgencyScore != null && <ScoreRing value={report.urgencyScore} color="#ef4444" label="URGENCY" />}
                {report.impactScore  != null && <ScoreRing value={report.impactScore}  color="#f97316" label="IMPACT"  />}
                {report.riskScore    != null && <ScoreRing value={report.riskScore}    color="#eab308" label="RISK"    />}
              </div>
              {report.priorityScore != null && (
                <div className="border-t border-border/40 pt-3 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground">OVERALL PRIORITY</span>
                  <span className="text-2xl font-bold font-mono text-primary">{Math.round(report.priorityScore)}</span>
                </div>
              )}
            </div>
          )}

          {/* Resolution probability */}
          {report.resolutionProbability != null && (
            <div className="rounded-xl border border-border/60 bg-card/50 p-4 text-center">
              <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-3 flex items-center justify-center gap-2">
                <Star className="w-3 h-3" /> RESOLUTION PROBABILITY
              </div>
              <div className="text-4xl font-bold font-mono text-emerald-400 mb-2">
                {Math.round(report.resolutionProbability * 100)}%
              </div>
              <Progress value={report.resolutionProbability * 100} className="h-2 mb-2" />
              <p className="text-[10px] text-muted-foreground font-mono">AI predicted likelihood</p>
            </div>
          )}

          {/* Community actions */}
          <div className="rounded-xl border border-border/60 bg-card/50 p-4 space-y-3">
            <div className="text-[10px] font-mono text-muted-foreground tracking-wider flex items-center gap-2">
              <ThumbsUp className="w-3 h-3" /> COMMUNITY
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-primary/8 border border-primary/20 p-2.5 text-center">
                <div className="text-xl font-bold font-mono text-primary">{report.validationCount ?? 0}</div>
                <div className="text-[9px] font-mono text-muted-foreground">VALIDATED</div>
              </div>
              <div className="rounded-lg bg-card border border-border/50 p-2.5 text-center">
                <div className="text-xl font-bold font-mono">{report.upvotes ?? 0}</div>
                <div className="text-[9px] font-mono text-muted-foreground">UPVOTES</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full font-mono text-[10px] tracking-wider border-primary/30 text-primary hover:bg-primary/10 h-9"
              onClick={handleValidate}
              disabled={validateReport.isPending}
            >
              <ThumbsUp className="w-3 h-3 mr-1.5" />
              {validateReport.isPending ? "SUBMITTING..." : "VALIDATE THIS REPORT"}
            </Button>
          </div>

          {/* Civic health impact */}
          {report.civicHealthImpact != null && (
            <div className="rounded-xl border border-border/60 bg-card/50 p-4 text-center">
              <div className="text-[9px] font-mono text-muted-foreground tracking-wider mb-2">CIVIC HEALTH IMPACT</div>
              <div className={`text-3xl font-bold font-mono ${
                report.civicHealthImpact < 30 ? "text-red-400" :
                report.civicHealthImpact < 60 ? "text-yellow-400" : "text-emerald-400"
              }`}>{Math.round(report.civicHealthImpact)}</div>
              <div className="text-[10px] font-mono text-muted-foreground mt-1">neighborhood score</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
